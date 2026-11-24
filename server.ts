import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local .env / .env.local if present without overriding hosting environment variables
for (const envFileName of ['.env.local', '.env']) {
  try {
    const envPath = path.join(__dirname, envFileName);
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    // ignore missing or unreadable env files
  }
}

const isProduction = process.env.NODE_ENV === 'production';

function getCliFlag(flagName: string): string | undefined {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === flagName && args[i + 1]) return args[i + 1];
    if (arg.startsWith(`${flagName}=`)) return arg.slice(flagName.length + 1);
  }
  return undefined;
}

const cliPort = Number(getCliFlag('--port') || getCliFlag('-p'));
const HOST = getCliFlag('--host') || '0.0.0.0';
const envPort = Number(process.env.PORT);
const nginxPort = Number(process.env.NGINX_PORT);
const defaultAppPort = Number(process.env.DEFAULT_APP_PORT || 3000);

const PORT =
  Number.isFinite(cliPort) && cliPort > 0
    ? cliPort
    : !isProduction
      ? defaultAppPort
      : Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort
        ? envPort
        : defaultAppPort;

interface ParsedGovtNotice {
  id: string;
  title: string;
  url: string;
  date: string;
  isPdf: boolean;
}

function isAllowedPublicHttpUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function resolveAbsoluteUrl(href: string, base: URL): string {
  try {
    return new URL(href.trim(), base.origin).toString();
  } catch {
    return base.toString();
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseHajjGovBdHtml(html: string, base: URL): ParsedGovtNotice[] {
  const notices: ParsedGovtNotice[] = [];
  const seen = new Set<string>();

  const rowPattern =
    /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<p[^>]*class=["'][^"']*news-list-title[^"']*["'][^>]*>([\s\S]*?)<span[^>]*class=["'][^"']*news-list-date[^"']*["'][^>]*>([^<]+)<\/span>[\s\S]*?<\/p>[\s\S]*?<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const absUrl = resolveAbsoluteUrl(match[1], base);
    const title = stripTags(match[2]);
    const date = stripTags(match[3]);
    if (!title || title.length < 4) continue;
    const dedupeKey = `${title}::${absUrl}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    notices.push({
      id: `govt-${notices.length + 1}-${Buffer.from(dedupeKey).toString('base64').slice(0, 10)}`,
      title,
      url: absUrl,
      date: date || 'সাম্প্রতিক বিজ্ঞপ্তি',
      isPdf: /\.pdf($|\?)/i.test(absUrl)
    });
  }

  return notices;
}

function parseGenericHtmlOrRss(body: string, base: URL): ParsedGovtNotice[] {
  const notices: ParsedGovtNotice[] = [];
  const seen = new Set<string>();

  // 1. Check RSS/Atom <item> or <entry>
  const rssPattern = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
  let rssMatch: RegExpExecArray | null;
  while ((rssMatch = rssPattern.exec(body)) !== null) {
    const block = rssMatch[1];
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkHrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
    const linkTextMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const dateMatch = block.match(/<(?:pubDate|updated|published)[^>]*>([\s\S]*?)<\/(?:pubDate|updated|published)>/i);
    const title = titleMatch ? stripTags(titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '')) : '';
    const rawHref = (linkHrefMatch?.[1] || linkTextMatch?.[1] || '').trim();
    if (!title || !rawHref) continue;
    const absUrl = resolveAbsoluteUrl(rawHref, base);
    const dedupeKey = `${title}::${absUrl}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    notices.push({
      id: `govt-rss-${notices.length + 1}`,
      title,
      url: absUrl,
      date: dateMatch ? stripTags(dateMatch[1]).slice(0, 24) : 'সাম্প্রতিক',
      isPdf: /\.pdf($|\?)/i.test(absUrl)
    });
  }
  if (notices.length > 0) return notices.slice(0, 25);

  // 2. Fallback generic notice/PDF anchor extraction
  const anchorPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch: RegExpExecArray | null;
  while ((anchorMatch = anchorPattern.exec(body)) !== null) {
    const rawHref = anchorMatch[1].trim();
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) continue;
    const text = stripTags(anchorMatch[2]);
    if (!text || text.length < 12) continue;
    const looksLikeNotice =
      /\.pdf($|\?)/i.test(rawHref) ||
      /notice|circular|news|announcement|নোটিশ|বিজ্ঞপ্তি|সার্কুলার|প্রজ্ঞাপন|হজ/i.test(`${rawHref} ${text}`);
    if (!looksLikeNotice) continue;
    const absUrl = resolveAbsoluteUrl(rawHref, base);
    const dedupeKey = `${text}::${absUrl}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    notices.push({
      id: `govt-link-${notices.length + 1}`,
      title: text,
      url: absUrl,
      date: 'অফিশিয়াল বিজ্ঞপ্তি',
      isPdf: /\.pdf($|\?)/i.test(absUrl)
    });
    if (notices.length >= 25) break;
  }

  return notices;
}

async function fetchJsonOrText(url: string): Promise<{ text: string; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'MuttaqiHajjPortalReader/1.0 (+https://muttaqi.com.bd)',
        'Cache-Control': 'no-cache',
        Accept: 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    return { text, contentType: response.headers.get('content-type') || '' };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchGovtNoticesFromSource(targetUrl: URL): Promise<ParsedGovtNotice[]> {
  const host = targetUrl.hostname.toLowerCase();
  const isHajjGovBd = host === 'hajj.gov.bd' || host.endsWith('.hajj.gov.bd');

  if (isHajjGovBd) {
    const origin = 'https://www.hajj.gov.bd';
    const currentYear = new Date().getFullYear();
    const candidateYears = [currentYear, currentYear - 1, 2026, 2025].filter(
      (y, idx, arr) => arr.indexOf(y) === idx
    );

    for (const yr of candidateYears) {
      try {
        const { text } = await fetchJsonOrText(`${origin}/get-selected-news/${yr}`);
        const payload = JSON.parse(text) as { responseCode?: number; html?: string };
        if (payload && typeof payload.html === 'string') {
          const parsed = parseHajjGovBdHtml(payload.html, new URL(origin));
          if (parsed.length > 0) return parsed.slice(0, 25);
        }
      } catch {
        // Try next year endpoint
      }
    }

    // Fallback to /all-news on hajj.gov.bd
    try {
      const { text } = await fetchJsonOrText(`${origin}/all-news`);
      const payload = JSON.parse(text) as { html?: string };
      if (payload && typeof payload.html === 'string') {
        const parsed = parseHajjGovBdHtml(payload.html, new URL(origin));
        if (parsed.length > 0) return parsed.slice(0, 25);
      }
    } catch {
      // Fall through to HTML parsing
    }
  }

  const { text } = await fetchJsonOrText(targetUrl.toString());
  try {
    const parsedJson = JSON.parse(text) as { html?: string };
    if (parsedJson && typeof parsedJson.html === 'string') {
      const govNotices = parseHajjGovBdHtml(parsedJson.html, targetUrl);
      if (govNotices.length > 0) return govNotices.slice(0, 25);
      return parseGenericHtmlOrRss(parsedJson.html, targetUrl);
    }
  } catch {
    // Standard HTML or RSS response
  }

  const specific = parseHajjGovBdHtml(text, targetUrl);
  if (specific.length > 0) return specific.slice(0, 25);
  return parseGenericHtmlOrRss(text, targetUrl);
}

function normalizePassportDate(raw: string): string {
  const value = (raw || '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const dmySlashOrDash = value.match(/^(\d{1,2})[\/\-.\s](\d{1,2})[\/\-.\s](\d{4})$/);
  if (dmySlashOrDash) {
    const day = dmySlashOrDash[1].padStart(2, '0');
    const month = dmySlashOrDash[2].padStart(2, '0');
    const year = dmySlashOrDash[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return '';
}

function parseDataUrlPayload(fileDataUrl: string): { mimeType: string; base64Data: string } | null {
  const match = fileDataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  const rawMime = match[1].toLowerCase();
  const mimeType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
  const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  if (!allowedMimes.has(mimeType)) return null;
  const base64Data = match[2].replace(/\s+/g, '');
  if (!base64Data) return null;
  return { mimeType, base64Data };
}

const SERVER_SUPABASE_URL =
  (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://nxsvorwevdbpdqyobvua.supabase.co').trim();
const SERVER_SUPABASE_KEY =
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_thSb5TCXSHldDKhKTOPFmQ_IMOJzbGF').trim();

const serverSupabase =
  SERVER_SUPABASE_URL && SERVER_SUPABASE_KEY
    ? createClient(SERVER_SUPABASE_URL, SERVER_SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : null;

const DEFAULT_SERVER_ADMIN_EMAIL = 'muttaqi.kafela@gmail.com';
const DEFAULT_SERVER_ADMIN_PASS = 'Muttaqi111@';
const DEFAULT_SERVER_ADMIN_NAME = 'মুত্তাকী এডমিন (Muttaqi Admin)';

function toAsciiDigits(val: string): string {
  return val.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
}

function maskEmailAddress(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const local = parts[0];
  const domain = parts[1];
  const visible = local.length <= 2 ? local.slice(0, 1) : local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

function escapeEmailHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface MatchedRecoveryAccount {
  accountType: 'haji' | 'admin' | 'sub_admin' | 'employee';
  roleLabel: string;
  accountName: string;
  displayUserId: string;
  email: string;
  previousPassword: string;
}

async function findAccountForPasswordRecovery(
  rawUserId: string,
  rawEmail: string,
  preferredScope: 'haji' | 'admin' | 'any'
): Promise<MatchedRecoveryAccount | null> {
  const cleanUserId = rawUserId.trim().toLowerCase();
  const cleanUserIdDigits = toAsciiDigits(cleanUserId).replace(/[^0-9]/g, '');
  const cleanEmail = rawEmail.trim().toLowerCase();

  if (!cleanUserId || !cleanEmail) return null;

  const checkAdminAndStaff = async (): Promise<MatchedRecoveryAccount | null> => {
    // 1. Check Super Admin (Supabase app_storage admin_credentials + default fallback)
    let adminEmail = DEFAULT_SERVER_ADMIN_EMAIL;
    let adminPassword = DEFAULT_SERVER_ADMIN_PASS;
    let adminName = DEFAULT_SERVER_ADMIN_NAME;

    if (serverSupabase) {
      try {
        const { data } = await serverSupabase
          .from('app_storage')
          .select('value')
          .eq('key', 'admin_credentials')
          .maybeSingle();
        const stored = (data as { value?: Record<string, unknown> } | null)?.value;
        if (stored && typeof stored === 'object') {
          if (typeof stored.email === 'string' && stored.email.trim()) adminEmail = stored.email.trim();
          if (typeof stored.password === 'string' && stored.password.trim()) adminPassword = stored.password.trim();
          if (typeof stored.name === 'string' && stored.name.trim()) adminName = stored.name.trim();
        }
      } catch {
        // fallback to defaults
      }
    }

    const adminEmailLower = adminEmail.toLowerCase();
    const adminNameLower = adminName.toLowerCase();
    const isAdminEmailMatch = cleanEmail === adminEmailLower;
    const isAdminIdMatch =
      cleanUserId === 'admin' ||
      cleanUserId === 'muttaqi.admin' ||
      cleanUserId === adminEmailLower ||
      (Boolean(adminNameLower) && cleanUserId === adminNameLower);

    if (isAdminEmailMatch && isAdminIdMatch) {
      return {
        accountType: 'admin',
        roleLabel: 'সুপার এডমিন (Super Admin)',
        accountName: adminName,
        displayUserId: adminEmail,
        email: adminEmail,
        previousPassword: adminPassword
      };
    }

    // 2. Check Sub-Admin & Employee accounts in Supabase (merge sub_admins table + app_storage.muttaqi_sub_admins_cache for full username/employeeId support)
    if (serverSupabase) {
      try {
        const [{ data: rows }, { data: cacheRow }] = await Promise.all([
          serverSupabase.from('sub_admins').select('*'),
          serverSupabase
            .from('app_storage')
            .select('value')
            .eq('key', 'muttaqi_sub_admins_cache')
            .maybeSingle()
        ]);

        const cachedList = Array.isArray((cacheRow as { value?: unknown } | null)?.value)
          ? ((cacheRow as { value: Array<Record<string, any>> }).value)
          : [];
        const cachedById = new Map<string, Record<string, any>>();
        for (const item of cachedList) {
          if (item && item.id) cachedById.set(String(item.id), item);
        }

        const combined: Array<Record<string, any>> = [];
        const seenIds = new Set<string>();

        if (Array.isArray(rows)) {
          for (const row of rows as Array<Record<string, any>>) {
            const idKey = String(row.id || '');
            const cached = idKey ? cachedById.get(idKey) : undefined;
            const raw = (row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {}) as Record<string, any>;
            combined.push({ ...raw, ...row, ...(cached || {}), _tablePassword: row.password, _tableEmail: row.email });
            if (idKey) seenIds.add(idKey);
          }
        }
        for (const item of cachedList) {
          const idKey = String(item?.id || '');
          if (idKey && !seenIds.has(idKey)) {
            combined.push(item);
          }
        }

        for (const rec of combined) {
          const recEmailRaw = String(rec._tableEmail || rec.email || '').trim();
          const recEmail = recEmailRaw.toLowerCase();
          if (!recEmail || recEmail !== cleanEmail) continue;

          const username = String(rec.username || '').trim().toLowerCase();
          const employeeId = String(rec.employeeId || rec.employee_id || '').trim().toLowerCase();
          const englishName = String(rec.englishName || rec.english_name || rec.name || '').trim().toLowerCase();
          const recId = String(rec.id || '').trim().toLowerCase();
          const phoneDigits = toAsciiDigits(String(rec.phone || '')).replace(/[^0-9]/g, '');

          const userIdMatches =
            (Boolean(username) && username === cleanUserId) ||
            (Boolean(employeeId) && employeeId === cleanUserId) ||
            (Boolean(recId) && recId === cleanUserId) ||
            (Boolean(englishName) && englishName === cleanUserId) ||
            recEmail === cleanUserId ||
            (Boolean(cleanUserIdDigits) && Boolean(phoneDigits) && phoneDigits === cleanUserIdDigits);

          if (!userIdMatches) continue;

          const prevPass = String(
            rec.password || rec._tablePassword || rec.initialPassword || rec.initial_password || ''
          ).trim();
          if (!prevPass) continue;

          const isEmployee =
            rec.role === 'employee' || String(rec.id || '').startsWith('emp-');

          return {
            accountType: isEmployee ? 'employee' : 'sub_admin',
            roleLabel: isEmployee ? 'কর্মচারী (Employee)' : 'সাব-এডমিন (Sub-Admin)',
            accountName: String(rec.englishName || rec.english_name || rec.name || rec.username || recEmailRaw),
            displayUserId: String(rec.username || rec.employeeId || rec.employee_id || recEmailRaw),
            email: recEmailRaw,
            previousPassword: prevPass
          };
        }
      } catch {
        // ignore query error
      }
    }

    return null;
  };

  const checkHajiAccounts = async (): Promise<MatchedRecoveryAccount | null> => {
    if (!serverSupabase) return null;
    try {
      const { data: rows } = await serverSupabase.from('inquiries').select('*');
      if (Array.isArray(rows)) {
        for (const row of rows as Array<Record<string, any>>) {
          const raw = (row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {}) as Record<string, any>;
          const recEmail = String(row.email || raw.email || '').trim().toLowerCase();
          if (!recEmail || recEmail !== cleanEmail) continue;

          const hajiUserId = String(row.haji_user_id || raw.hajiUserId || '').trim();
          const hajiUserIdLower = hajiUserId.toLowerCase();
          const hajiUserIdDigits = toAsciiDigits(hajiUserId).replace(/[^0-9]/g, '');
          const regRef = String(row.registration_ref || raw.registrationRef || '').trim().toLowerCase();
          const recId = String(row.id || '').trim().toLowerCase();
          const phoneDigits = toAsciiDigits(String(row.phone || raw.phone || '')).replace(/[^0-9]/g, '');
          const nidNo = String(row.nid_no || raw.nidNo || '').trim().toLowerCase();
          const passportNo = String(row.passport_no || raw.passportNo || '').trim().toLowerCase();

          const userIdMatches =
            (Boolean(hajiUserIdLower) && hajiUserIdLower === cleanUserId) ||
            (Boolean(regRef) && regRef === cleanUserId) ||
            (Boolean(recId) && recId === cleanUserId) ||
            (Boolean(nidNo) && nidNo === cleanUserId) ||
            (Boolean(passportNo) && passportNo === cleanUserId) ||
            recEmail === cleanUserId ||
            (Boolean(cleanUserIdDigits) && Boolean(phoneDigits) && phoneDigits === cleanUserIdDigits) ||
            (Boolean(cleanUserIdDigits) && Boolean(hajiUserIdDigits) && hajiUserIdDigits === cleanUserIdDigits);

          if (!userIdMatches) continue;

          const prevPass = String(row.haji_password || raw.hajiPassword || 'Haji12').trim();

          return {
            accountType: 'haji',
            roleLabel: 'হাজী একাউন্ট (Haji Account)',
            accountName: String(row.name_bn || raw.nameBn || row.name || raw.name || 'সম্মানিত হাজী'),
            displayUserId: hajiUserId || String(row.phone || raw.phone || row.registration_ref || row.id),
            email: String(row.email || raw.email).trim(),
            previousPassword: prevPass
          };
        }
      }
    } catch {
      // ignore query error
    }
    return null;
  };

  if (preferredScope === 'haji') {
    return (await checkHajiAccounts()) || (await checkAdminAndStaff());
  }
  return (await checkAdminAndStaff()) || (await checkHajiAccounts());
}

interface PasswordRecoveryQueueItem {
  id: string;
  userId: string;
  email: string;
  maskedEmail: string;
  accountName: string;
  accountType: 'haji' | 'admin' | 'sub_admin' | 'employee';
  roleLabel: string;
  requestedAt: string;
  status: 'pending' | 'sent';
  sentAt?: string;
  sentBy?: string;
}

let inMemoryRecoveryQueue: PasswordRecoveryQueueItem[] = [];

async function loadRecoveryRequests(): Promise<PasswordRecoveryQueueItem[]> {
  if (serverSupabase) {
    try {
      const { data } = await serverSupabase
        .from('app_storage')
        .select('value')
        .eq('key', 'password_recovery_requests')
        .maybeSingle();
      const stored = (data as { value?: unknown } | null)?.value;
      if (Array.isArray(stored)) {
        inMemoryRecoveryQueue = stored as PasswordRecoveryQueueItem[];
        return inMemoryRecoveryQueue;
      }
    } catch {
      // fall back to in-memory cache
    }
  }
  return inMemoryRecoveryQueue;
}

async function saveRecoveryRequests(items: PasswordRecoveryQueueItem[]): Promise<void> {
  const trimmed = items.slice(0, 100);
  inMemoryRecoveryQueue = trimmed;
  if (serverSupabase) {
    try {
      await serverSupabase.from('app_storage').upsert(
        {
          key: 'password_recovery_requests',
          value: trimmed,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );
    } catch {
      // keep in-memory copy
    }
  }
}

async function getSuperAdminEmail(): Promise<string> {
  let adminEmail = DEFAULT_SERVER_ADMIN_EMAIL;
  if (serverSupabase) {
    try {
      const { data } = await serverSupabase
        .from('app_storage')
        .select('value')
        .eq('key', 'admin_credentials')
        .maybeSingle();
      const stored = (data as { value?: Record<string, unknown> } | null)?.value;
      if (stored && typeof stored.email === 'string' && stored.email.trim()) {
        adminEmail = stored.email.trim();
      }
    } catch {
      // use default
    }
  }
  return adminEmail.toLowerCase();
}

function buildPasswordRecoveryEmailContent(account: MatchedRecoveryAccount): {
  subject: string;
  textBody: string;
  htmlBody: string;
} {
  const subject = 'মুত্তাকী হজ্ব ও কন্সাল্টেন্সি — আপনার পূর্বের পাসওয়ার্ড পুনরুদ্ধার (Password Recovery)';

  const textBody = [
    `আসসালামু আলাইকুম ${account.accountName},`,
    '',
    'মুত্তাকী হজ্ব ও কন্সাল্টেন্সি পোর্টাল থেকে আপনার পাসওয়ার্ড পুনরুদ্ধারের অনুরোধ সফলভাবে যাচাই করা হয়েছে।',
    '',
    `একাউন্টের ধরন: ${account.roleLabel}`,
    `ইউজার আইডি: ${account.displayUserId}`,
    `নিবন্ধিত ইমেইল: ${account.email}`,
    `আপনার পূর্বের পাসওয়ার্ড: ${account.previousPassword}`,
    '',
    'নিরাপত্তার স্বার্থে এই পাসওয়ার্ডটি গোপন রাখুন এবং প্রয়োজনে লগইনের পর পরিবর্তন করে নিন।',
    '— মুত্তাকী হজ্ব ও কন্সাল্টেন্সি'
  ].join('\n');

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #faf8f5; border: 2px solid #DCB473; border-radius: 16px; overflow: hidden;">
      <div style="background: #0f2922; color: #DCB473; padding: 20px 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">মুত্তাকী হজ্ব ও কন্সাল্টেন্সি</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #f5e6c8;">পাসওয়ার্ড পুনরুদ্ধার বার্তা (Password Recovery)</p>
      </div>
      <div style="padding: 24px; color: #1c1917; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">আসসালামু আলাইকুম <strong>${escapeEmailHtml(account.accountName)}</strong>,</p>
        <p>আপনার ইউজার আইডি ও ইমেইল সফলভাবে যাচাই করা হয়েছে। নিচে আপনার একাউন্টের পূর্বের পাসওয়ার্ড দেওয়া হলো:</p>
        <div style="background: #ffffff; border: 1px solid #DCB473; border-radius: 12px; padding: 16px; margin: 18px 0;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #57534e;"><strong>একাউন্টের ধরন:</strong> ${escapeEmailHtml(account.roleLabel)}</p>
          <p style="margin: 0 0 6px; font-size: 13px; color: #57534e;"><strong>ইউজার আইডি:</strong> ${escapeEmailHtml(account.displayUserId)}</p>
          <p style="margin: 12px 0 4px; font-size: 12px; color: #78716c; text-transform: uppercase;">আপনার পূর্বের পাসওয়ার্ড:</p>
          <div style="font-family: monospace; font-size: 20px; font-weight: bold; color: #0f2922; background: #fef3c7; border: 1px dashed #b88e44; padding: 10px 14px; border-radius: 8px; letter-spacing: 0.05em;">
            ${escapeEmailHtml(account.previousPassword)}
          </div>
        </div>
        <p style="font-size: 12px; color: #57534e; margin-bottom: 0;">নিরাপত্তার স্বার্থে আপনার পাসওয়ার্ড কারো সাথে শেয়ার করবেন না।</p>
      </div>
    </div>
  `;

  return { subject, textBody, htmlBody };
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match && match[1].trim() ? match[1].trim() : null;
}

async function verifyGoogleAccessTokenEmail(accessToken: string): Promise<string | null> {
  try {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (resp.ok) {
      const data = (await resp.json()) as { email?: string };
      if (data && typeof data.email === 'string' && data.email.includes('@')) {
        return data.email.trim().toLowerCase();
      }
    }
  } catch {
    // try tokeninfo fallback below
  }

  try {
    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    if (resp.ok) {
      const data = (await resp.json()) as { email?: string };
      if (data && typeof data.email === 'string' && data.email.includes('@')) {
        return data.email.trim().toLowerCase();
      }
    }
  } catch {
    // invalid token
  }

  return null;
}

function encodeRfc2047Utf8(text: string): string {
  return `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function sendPasswordRecoveryViaGmailApi(
  accessToken: string,
  fromEmail: string,
  account: MatchedRecoveryAccount
): Promise<{ sent: boolean; status?: number; error?: string }> {
  const { subject, textBody, htmlBody } = buildPasswordRecoveryEmailContent(account);
  const boundary = `muttaqi_boundary_${Date.now().toString(36)}`;
  const brandHeader = `${encodeRfc2047Utf8('মুত্তাকী হজ্ব ও কন্সাল্টেন্সি')} <${fromEmail}>`;

  const mimeLines = [
    `From: ${brandHeader}`,
    `To: ${account.email}`,
    `Subject: ${encodeRfc2047Utf8(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(textBody, 'utf8').toString('base64'),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlBody, 'utf8').toString('base64'),
    '',
    `--${boundary}--`
  ];

  const raw = toBase64Url(mimeLines.join('\r\n'));

  try {
    const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => `HTTP ${resp.status}`);
      console.error('Gmail API send error:', resp.status, errBody);
      return { sent: false, status: resp.status, error: errBody };
    }

    return { sent: true, status: resp.status };
  } catch (err) {
    console.error('Gmail API network error:', err);
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'Gmail API delivery failed'
    };
  }
}

async function sendPasswordRecoveryEmail(account: MatchedRecoveryAccount): Promise<{
  configured: boolean;
  sent: boolean;
  fromAddress: string;
  subject: string;
  error?: string;
}> {
  const { subject, textBody, htmlBody } = buildPasswordRecoveryEmailContent(account);
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const rawSmtpPass = (process.env.SMTP_PASS || '').trim();
  const inferredHost = (() => {
    const lowerUser = smtpUser.toLowerCase();
    if (lowerUser.endsWith('@gmail.com') || lowerUser.endsWith('@googlemail.com')) return 'smtp.gmail.com';
    if (lowerUser.endsWith('@outlook.com') || lowerUser.endsWith('@hotmail.com') || lowerUser.endsWith('@live.com')) {
      return 'smtp.office365.com';
    }
    if (lowerUser.endsWith('@yahoo.com')) return 'smtp.mail.yahoo.com';
    return '';
  })();
  const smtpHost = (process.env.SMTP_HOST || '').trim() || inferredHost;
  // Strip spaces in Gmail App Passwords (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const smtpPass =
    smtpHost === 'smtp.gmail.com' ? rawSmtpPass.replace(/\s+/g, '') : rawSmtpPass;
  const smtpPort = Number(process.env.SMTP_PORT) || (smtpHost === 'smtp.gmail.com' ? 465 : 587);
  const smtpSecure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : smtpPort === 465;
  const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const fromAddress =
    (process.env.SMTP_FROM || process.env.MAIL_FROM || smtpUser || DEFAULT_SERVER_ADMIN_EMAIL).trim();

  // 1. Try SMTP via nodemailer if configured
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });
      await transporter.sendMail({
        from: `"মুত্তাকী হজ্ব ও কন্সাল্টেন্সি" <${fromAddress}>`,
        to: account.email,
        subject,
        text: textBody,
        html: htmlBody
      });
      return { configured: true, sent: true, fromAddress, subject };
    } catch (err) {
      console.error('SMTP delivery error:', err);
      return {
        configured: true,
        sent: false,
        fromAddress,
        subject,
        error: err instanceof Error ? err.message : 'SMTP delivery failed'
      };
    }
  }

  // 2. Try Resend API if configured
  if (resendApiKey) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `মুত্তাকী হজ্ব ও কন্সাল্টেন্সি <${fromAddress}>`,
          to: [account.email],
          subject,
          text: textBody,
          html: htmlBody
        })
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
        console.error('Resend delivery error:', errText);
        return { configured: true, sent: false, fromAddress, subject, error: errText };
      }
      return { configured: true, sent: true, fromAddress, subject };
    } catch (err) {
      console.error('Resend delivery error:', err);
      return {
        configured: true,
        sent: false,
        fromAddress,
        subject,
        error: err instanceof Error ? err.message : 'Resend delivery failed'
      };
    }
  }

  // 3. Try Brevo API if configured
  if (brevoApiKey) {
    try {
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'মুত্তাকী হজ্ব ও কন্সাল্টেন্সি', email: fromAddress },
          to: [{ email: account.email, name: account.accountName }],
          subject,
          textContent: textBody,
          htmlContent: htmlBody
        })
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => `HTTP ${resp.status}`);
        console.error('Brevo delivery error:', errText);
        return { configured: true, sent: false, fromAddress, subject, error: errText };
      }
      return { configured: true, sent: true, fromAddress, subject };
    } catch (err) {
      console.error('Brevo delivery error:', err);
      return {
        configured: true,
        sent: false,
        fromAddress,
        subject,
        error: err instanceof Error ? err.message : 'Brevo delivery failed'
      };
    }
  }

  return { configured: false, sent: false, fromAddress, subject };
}

// ==================== DEVELOPER CODE SOURCE & GITHUB SYNC ====================
const WORKSPACE_ROOT = path.resolve(__dirname);
const REAL_WORKSPACE_ROOT = fs.realpathSync(WORKSPACE_ROOT);
const SERVER_DEVELOPER_EMAIL = 'sizu111@gmail.com';
const DEV_SESSION_TTL_MS = 4 * 60 * 60 * 1000;
const MAX_DEV_SESSIONS = 20;
const MAX_CODE_FILE_BYTES = 512 * 1024;
const DEV_SERVER_AUTH_STORAGE_KEY = 'developer_server_auth';

const BLOCKED_CODE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  '.aistudio',
  '.vscode',
  '.idea',
  'coverage',
  '.cache',
  '.vite'
]);

const BLOCKED_EXACT_FILES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
  'package-lock.json',
  'bun.lock',
  'eng.traineddata'
]);

const ALLOWED_EXACT_CODE_NAMES = new Set([
  '.env.example',
  '.gitignore',
  '.nojekyll',
  'CNAME',
  'LICENSE'
]);

const ALLOWED_CODE_TEXT_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.css',
  '.scss',
  '.html',
  '.md',
  '.txt',
  '.sql',
  '.yml',
  '.yaml',
  '.xml',
  '.svg'
]);

interface DevSessionRecord {
  email: string;
  expiresAt: number;
}

interface StoredDevAuthRecord {
  salt: string;
  hash: string;
  updatedAt: string;
}

const activeDevSessions = new Map<string, DevSessionRecord>();
const devAuthAttempts = new Map<string, { count: number; resetAt: number }>();
let cachedServerDevAuth: StoredDevAuthRecord | null = null;

function hashDeveloperScrypt(password: string, saltHex: string): string {
  return crypto.scryptSync(password, saltHex, 64).toString('hex');
}

function timingSafeHexEqual(hexA: string, hexB: string): boolean {
  if (!hexA || !hexB || hexA.length !== hexB.length) return false;
  try {
    const a = Buffer.from(hexA, 'hex');
    const b = Buffer.from(hexB, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function timingSafeStringSha256Equal(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

async function loadServerDeveloperAuth(): Promise<StoredDevAuthRecord | null> {
  if (cachedServerDevAuth) return cachedServerDevAuth;
  if (!serverSupabase) return null;
  try {
    const { data } = await serverSupabase
      .from('app_storage')
      .select('value')
      .eq('key', DEV_SERVER_AUTH_STORAGE_KEY)
      .maybeSingle();
    const rec = (data as { value?: Partial<StoredDevAuthRecord> } | null)?.value;
    if (rec && typeof rec.salt === 'string' && typeof rec.hash === 'string') {
      cachedServerDevAuth = {
        salt: rec.salt,
        hash: rec.hash,
        updatedAt: typeof rec.updatedAt === 'string' ? rec.updatedAt : new Date().toISOString()
      };
      return cachedServerDevAuth;
    }
  } catch {
    // ignore storage read errors
  }
  return null;
}

async function saveServerDeveloperAuth(password: string): Promise<StoredDevAuthRecord> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashDeveloperScrypt(password, salt);
  const record: StoredDevAuthRecord = {
    salt,
    hash,
    updatedAt: new Date().toISOString()
  };
  cachedServerDevAuth = record;
  if (serverSupabase) {
    try {
      await serverSupabase.from('app_storage').upsert(
        {
          key: DEV_SERVER_AUTH_STORAGE_KEY,
          value: record,
          updated_at: record.updatedAt
        },
        { onConflict: 'key' }
      );
    } catch {
      // keep in-memory cache even if cloud storage is unavailable
    }
  }
  return record;
}

function issueDevSessionToken(email: string): string {
  const now = Date.now();
  for (const [k, v] of activeDevSessions.entries()) {
    if (v.expiresAt <= now) activeDevSessions.delete(k);
  }
  while (activeDevSessions.size >= MAX_DEV_SESSIONS) {
    const oldestKey = activeDevSessions.keys().next().value;
    if (!oldestKey) break;
    activeDevSessions.delete(oldestKey);
  }
  const token = crypto.randomBytes(32).toString('hex');
  activeDevSessions.set(token, { email, expiresAt: now + DEV_SESSION_TTL_MS });
  return token;
}

function requireDeveloperAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({
      ok: false,
      error: 'ডেভেলপার অথেনটিকেশন প্রয়োজন। অনুগ্রহ করে পাসওয়ার্ড দিয়ে আনলক করুন।'
    });
    return;
  }
  const session = activeDevSessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) activeDevSessions.delete(token);
    res.status(401).json({
      ok: false,
      error: 'ডেভেলপার সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে পুনরায় আনলক করুন।'
    });
    return;
  }
  next();
}

function isBlockedFileBasename(basename: string): boolean {
  const lower = basename.toLowerCase();
  if (BLOCKED_EXACT_FILES.has(lower)) return true;
  if (lower.startsWith('.env') && lower !== '.env.example') return true;
  if (
    lower.endsWith('.pem') ||
    lower.endsWith('.key') ||
    lower.endsWith('.p12') ||
    lower.endsWith('.pfx') ||
    lower.endsWith('.traineddata')
  ) {
    return true;
  }
  return false;
}

function isAllowedCodeFilename(basename: string): boolean {
  if (isBlockedFileBasename(basename)) return false;
  if (ALLOWED_EXACT_CODE_NAMES.has(basename)) return true;
  const ext = path.extname(basename).toLowerCase();
  return ALLOWED_CODE_TEXT_EXTS.has(ext);
}

function resolveSafeWorkspacePath(
  rawRelPath: string,
  options: { forWrite?: boolean } = {}
): { ok: true; relPath: string; resolved: string } | { ok: false; status: number; error: string } {
  if (typeof rawRelPath !== 'string') {
    return { ok: false, status: 400, error: 'ফাইলের পাথ প্রদান করা হয়নি।' };
  }
  const trimmed = rawRelPath.trim();
  if (!trimmed || trimmed.length > 240) {
    return { ok: false, status: 400, error: 'অবৈধ ফাইল পাথ।' };
  }
  if (
    trimmed.includes('\0') ||
    trimmed.includes('\\') ||
    trimmed.startsWith('/') ||
    /^[A-Za-z]:/.test(trimmed) ||
    trimmed.includes('://')
  ) {
    return { ok: false, status: 403, error: 'অননুমোদিত ফাইল পাথ।' };
  }

  const segments = trimmed.split('/');
  if (segments.some((s) => !s || s === '.' || s === '..')) {
    return { ok: false, status: 403, error: 'পাথ ট্রাভার্সাল অনুমোদিত নয়।' };
  }
  for (let i = 0; i < segments.length - 1; i++) {
    if (BLOCKED_CODE_DIRS.has(segments[i].toLowerCase())) {
      return { ok: false, status: 403, error: 'এই ডিরেক্টরি অ্যাক্সেস করা যাবে না।' };
    }
  }

  const basename = segments[segments.length - 1];
  if (!isAllowedCodeFilename(basename)) {
    return {
      ok: false,
      status: 403,
      error: 'এই ফাইল টাইপ বা গোপন কনফিগারেশন ফাইল দেখা/সম্পাদনা করা অনুমোদিত নয়।'
    };
  }

  const relPath = segments.join('/');
  const resolved = path.resolve(WORKSPACE_ROOT, relPath);
  if (!resolved.startsWith(WORKSPACE_ROOT + path.sep)) {
    return { ok: false, status: 403, error: 'ফাইল পাথ ওয়ার্কস্পেসের বাইরে অবস্থিত।' };
  }

  // Verify symlink containment on target or nearest existing parent directory
  try {
    if (fs.existsSync(resolved)) {
      const realTarget = fs.realpathSync(resolved);
      if (!realTarget.startsWith(REAL_WORKSPACE_ROOT + path.sep)) {
        return { ok: false, status: 403, error: 'সিমলিংক অ্যাক্সেস অনুমোদিত নয়।' };
      }
    } else if (options.forWrite) {
      let checkDir = path.dirname(resolved);
      while (checkDir.length >= WORKSPACE_ROOT.length && !fs.existsSync(checkDir)) {
        const parent = path.dirname(checkDir);
        if (parent === checkDir) break;
        checkDir = parent;
      }
      if (fs.existsSync(checkDir)) {
        const realParent = fs.realpathSync(checkDir);
        if (realParent !== REAL_WORKSPACE_ROOT && !realParent.startsWith(REAL_WORKSPACE_ROOT + path.sep)) {
          return { ok: false, status: 403, error: 'অবৈধ ডিরেক্টরি টার্গেট।' };
        }
      }
    }
  } catch {
    return { ok: false, status: 403, error: 'ফাইল পাথ যাচাই করা যায়নি।' };
  }

  return { ok: true, relPath, resolved };
}

function computeGitBlobSha(contentUtf8: string): string {
  const buf = Buffer.from(contentUtf8, 'utf8');
  const header = Buffer.from(`blob ${buf.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(header).update(buf).digest('hex');
}

function classifyCodeCategory(relPath: string): string {
  if (relPath.startsWith('src/pages/')) return 'pages';
  if (relPath.startsWith('src/components/')) return 'components';
  if (relPath.startsWith('src/context/')) return 'context';
  if (relPath.startsWith('src/services/') || relPath.startsWith('src/lib/') || relPath.startsWith('src/utils/')) {
    return 'services-lib';
  }
  if (relPath.startsWith('src/data/') || relPath.startsWith('src/types/')) return 'data-types';
  if (relPath.startsWith('src/')) return 'src-root';
  if (relPath.startsWith('.github/') || relPath.startsWith('public/')) return 'deploy-public';
  return 'root-config';
}

interface ScannedCodeFile {
  path: string;
  size: number;
  lines: number;
  updatedAt: string;
  category: string;
  blobSha: string;
}

async function scanWorkspaceCodeFiles(): Promise<ScannedCodeFile[]> {
  const results: ScannedCodeFile[] = [];

  async function walk(currentDir: string, prefixRel: string) {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const name = entry.name;
      if (entry.isSymbolicLink()) continue;

      const rel = prefixRel ? `${prefixRel}/${name}` : name;
      const fullPath = path.join(currentDir, name);

      if (entry.isDirectory()) {
        if (BLOCKED_CODE_DIRS.has(name.toLowerCase())) continue;
        await walk(fullPath, rel);
      } else if (entry.isFile()) {
        if (!isAllowedCodeFilename(name)) continue;
        try {
          const stat = await fs.promises.stat(fullPath);
          if (stat.size > MAX_CODE_FILE_BYTES) continue;
          const buf = await fs.promises.readFile(fullPath);
          if (buf.includes(0)) continue; // skip binary blobs
          const text = buf.toString('utf8');
          const lines = text.length === 0 ? 0 : text.split(/\r?\n/).length;
          results.push({
            path: rel,
            size: stat.size,
            lines,
            updatedAt: stat.mtime.toISOString(),
            category: classifyCodeCategory(rel),
            blobSha: computeGitBlobSha(text)
          });
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  await walk(WORKSPACE_ROOT, '');
  results.sort((a, b) => a.path.localeCompare(b.path));
  return results;
}

interface GithubRepoConfig {
  configured: boolean;
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

function getGithubRepoConfig(): GithubRepoConfig {
  const rawCombined = (process.env.GITHUB_REPO || process.env.VITE_GITHUB_REPO || '').trim();
  let owner = (process.env.GITHUB_OWNER || '').trim();
  let repo = '';

  if (rawCombined.includes('/')) {
    const [o, r] = rawCombined.split('/').map((s) => s.trim());
    owner = o || owner;
    repo = r || '';
  } else if (rawCombined && owner) {
    repo = rawCombined;
  }

  const branch = (process.env.GITHUB_BRANCH || process.env.VITE_GITHUB_BRANCH || 'main').trim() || 'main';
  const token = (process.env.GITHUB_TOKEN || '').trim();

  const validOwner = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner);
  const validRepo = /^[A-Za-z0-9._-]{1,100}$/.test(repo);
  const validBranch =
    /^[A-Za-z0-9._/-]{1,100}$/.test(branch) && !branch.includes('..') && !branch.startsWith('/');

  return {
    configured: validOwner && validRepo && validBranch,
    owner: validOwner ? owner : '',
    repo: validRepo ? repo : '',
    branch: validBranch ? branch : 'main',
    token
  };
}

async function githubApiFetch(
  apiPath: string,
  token: string,
  init: RequestInit = {}
): Promise<globalThis.Response> {
  const cleanPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'MuttaqiCodeSourceSync/1.0',
      'X-GitHub-Api-Version': '2022-11-28',
      ...((init.headers as Record<string, string>) || {})
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return await fetch(`https://api.github.com${cleanPath}`, {
      ...init,
      headers,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function encodeGithubRepoPath(relPath: string): string {
  return relPath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
}

async function fetchGithubBranchTreeMap(
  cfg: GithubRepoConfig
): Promise<{ ok: boolean; commitSha?: string; blobs: Map<string, string>; error?: string }> {
  const blobs = new Map<string, string>();
  if (!cfg.configured) return { ok: false, blobs, error: 'GitHub repo not configured' };

  try {
    const branchResp = await githubApiFetch(
      `/repos/${cfg.owner}/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`,
      cfg.token
    );
    if (!branchResp.ok) {
      return { ok: false, blobs, error: `GitHub branch lookup HTTP ${branchResp.status}` };
    }
    const branchData = (await branchResp.json()) as {
      commit?: { sha?: string; commit?: { tree?: { sha?: string } } };
    };
    const commitSha = branchData.commit?.sha || '';
    const treeSha = branchData.commit?.commit?.tree?.sha || commitSha;
    if (!treeSha) return { ok: false, blobs, error: 'Missing tree SHA' };

    const treeResp = await githubApiFetch(
      `/repos/${cfg.owner}/${cfg.repo}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`,
      cfg.token
    );
    if (!treeResp.ok) {
      return { ok: false, blobs, error: `GitHub tree HTTP ${treeResp.status}` };
    }
    const treeData = (await treeResp.json()) as {
      tree?: Array<{ path?: string; type?: string; sha?: string }>;
    };
    for (const item of treeData.tree || []) {
      if (item.type === 'blob' && item.path && item.sha) {
        blobs.set(item.path, item.sha);
      }
    }
    return { ok: true, commitSha, blobs };
  } catch (err) {
    return {
      ok: false,
      blobs,
      error: err instanceof Error ? err.message : 'GitHub tree fetch failed'
    };
  }
}

async function pushSingleFileToGithub(
  cfg: GithubRepoConfig,
  relPath: string,
  contentUtf8: string,
  commitMessage: string
): Promise<{ synced: boolean; commitSha?: string; commitUrl?: string; reason?: string }> {
  if (!cfg.configured) {
    return { synced: false, reason: 'GITHUB_REPO কনফিগার করা হয়নি।' };
  }
  if (!cfg.token) {
    return { synced: false, reason: 'সার্ভারে GITHUB_TOKEN সেট করা হয়নি।' };
  }

  const encodedPath = encodeGithubRepoPath(relPath);
  try {
    // Lookup existing blob sha on target branch if file already exists
    let existingSha: string | undefined;
    const checkResp = await githubApiFetch(
      `/repos/${cfg.owner}/${cfg.repo}/contents/${encodedPath}?ref=${encodeURIComponent(cfg.branch)}`,
      cfg.token
    );
    if (checkResp.ok) {
      const existingData = (await checkResp.json()) as { sha?: string };
      if (typeof existingData.sha === 'string') existingSha = existingData.sha;
    }

    const putResp = await githubApiFetch(
      `/repos/${cfg.owner}/${cfg.repo}/contents/${encodedPath}`,
      cfg.token,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(contentUtf8, 'utf8').toString('base64'),
          branch: cfg.branch,
          ...(existingSha ? { sha: existingSha } : {})
        })
      }
    );

    if (!putResp.ok) {
      const errBody = await putResp.text().catch(() => '');
      return {
        synced: false,
        reason: `GitHub আপডেট ব্যর্থ (HTTP ${putResp.status})${errBody ? `: ${errBody.slice(0, 140)}` : ''}`
      };
    }

    const putData = (await putResp.json()) as {
      commit?: { sha?: string; html_url?: string };
    };
    return {
      synced: true,
      commitSha: putData.commit?.sha,
      commitUrl: putData.commit?.html_url
    };
  } catch (err) {
    return {
      synced: false,
      reason: err instanceof Error ? err.message : 'GitHub নেটওয়ার্ক ত্রুটি'
    };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // ==================== CODE SOURCE & GITHUB SYNC API ====================
  app.post('/api/code-source/auth', async (req: Request, res: Response) => {
    try {
      const ipKey = req.ip || 'unknown';
      const now = Date.now();
      const attemptRec = devAuthAttempts.get(ipKey);
      if (attemptRec && attemptRec.resetAt > now && attemptRec.count >= 15) {
        res.status(429).json({
          ok: false,
          error: 'অনেকবার ভুল প্রচেষ্টা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।'
        });
        return;
      }

      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const targetEmail = email || SERVER_DEVELOPER_EMAIL;

      if (targetEmail !== SERVER_DEVELOPER_EMAIL || !password || password.length < 4) {
        devAuthAttempts.set(ipKey, {
          count: (attemptRec && attemptRec.resetAt > now ? attemptRec.count : 0) + 1,
          resetAt: attemptRec && attemptRec.resetAt > now ? attemptRec.resetAt : now + 10 * 60 * 1000
        });
        res.status(401).json({ ok: false, error: 'ভুল ডেভেলপার ইমেইল বা পাসওয়ার্ড।' });
        return;
      }

      const envPasscode = (process.env.DEVELOPER_PANEL_PASSCODE || '').trim();
      if (envPasscode) {
        if (!timingSafeStringSha256Equal(password, envPasscode)) {
          devAuthAttempts.set(ipKey, {
            count: (attemptRec && attemptRec.resetAt > now ? attemptRec.count : 0) + 1,
            resetAt: attemptRec && attemptRec.resetAt > now ? attemptRec.resetAt : now + 10 * 60 * 1000
          });
          res.status(401).json({ ok: false, error: 'ভুল ডেভেলপার পাসওয়ার্ড।' });
          return;
        }
        devAuthAttempts.delete(ipKey);
        const token = issueDevSessionToken(targetEmail);
        res.json({ ok: true, token, expiresInMs: DEV_SESSION_TTL_MS });
        return;
      }

      const existing = await loadServerDeveloperAuth();
      if (!existing) {
        // First-time claim: bind server scrypt hash to the verified developer password
        await saveServerDeveloperAuth(password);
        devAuthAttempts.delete(ipKey);
        const token = issueDevSessionToken(targetEmail);
        res.json({ ok: true, token, expiresInMs: DEV_SESSION_TTL_MS, initialized: true });
        return;
      }

      const computedHash = hashDeveloperScrypt(password, existing.salt);
      if (!timingSafeHexEqual(computedHash, existing.hash)) {
        devAuthAttempts.set(ipKey, {
          count: (attemptRec && attemptRec.resetAt > now ? attemptRec.count : 0) + 1,
          resetAt: attemptRec && attemptRec.resetAt > now ? attemptRec.resetAt : now + 10 * 60 * 1000
        });
        res.status(401).json({ ok: false, error: 'ভুল ডেভেলপার পাসওয়ার্ড।' });
        return;
      }

      devAuthAttempts.delete(ipKey);
      const token = issueDevSessionToken(targetEmail);
      res.json({ ok: true, token, expiresInMs: DEV_SESSION_TTL_MS });
    } catch {
      res.status(500).json({ ok: false, error: 'অথেনটিকেশন প্রক্রিয়ায় ত্রুটি হয়েছে।' });
    }
  });

  app.post('/api/code-source/change-password', async (req: Request, res: Response) => {
    try {
      const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
      const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
      if (!currentPassword || !newPassword || newPassword.length < 4) {
        res.status(400).json({ ok: false, error: 'বর্তমান এবং নতুন পাসওয়ার্ড সঠিকভাবে দিন।' });
        return;
      }
      if ((process.env.DEVELOPER_PANEL_PASSCODE || '').trim()) {
        res.status(400).json({
          ok: false,
          error: 'সার্ভারে DEVELOPER_PANEL_PASSCODE নির্ধারিত আছে; এনভায়রনমেন্ট থেকে পরিবর্তন করুন।'
        });
        return;
      }
      const existing = await loadServerDeveloperAuth();
      if (existing) {
        const computed = hashDeveloperScrypt(currentPassword, existing.salt);
        if (!timingSafeHexEqual(computed, existing.hash)) {
          res.status(401).json({ ok: false, error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
          return;
        }
      } else {
        // If no stored scrypt record exists yet, require an active authenticated Bearer session
        const bearer = extractBearerToken(req);
        const session = bearer ? activeDevSessions.get(bearer) : undefined;
        if (!session || session.expiresAt <= Date.now()) {
          res.status(401).json({ ok: false, error: 'অননুমোদিত অনুরোধ। প্রথমে লগইন করুন।' });
          return;
        }
      }
      await saveServerDeveloperAuth(newPassword);
      const token = issueDevSessionToken(SERVER_DEVELOPER_EMAIL);
      res.json({ ok: true, token, expiresInMs: DEV_SESSION_TTL_MS });
    } catch {
      res.status(500).json({ ok: false, error: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' });
    }
  });

  app.post('/api/code-source/logout', (req: Request, res: Response) => {
    const token = extractBearerToken(req);
    if (token) activeDevSessions.delete(token);
    res.json({ ok: true });
  });

  app.get('/api/code-source/github-status', requireDeveloperAuth, async (_req: Request, res: Response) => {
    const cfg = getGithubRepoConfig();
    if (!cfg.configured) {
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ok: true,
        configured: false,
        repo: null,
        branch: cfg.branch,
        hasWriteToken: Boolean(cfg.token),
        reachable: false
      });
      return;
    }

    try {
      const resp = await githubApiFetch(
        `/repos/${cfg.owner}/${cfg.repo}/branches/${encodeURIComponent(cfg.branch)}`,
        cfg.token
      );
      if (!resp.ok) {
        res.setHeader('Cache-Control', 'no-store');
        res.json({
          ok: true,
          configured: true,
          repo: `${cfg.owner}/${cfg.repo}`,
          branch: cfg.branch,
          hasWriteToken: Boolean(cfg.token),
          reachable: false,
          error: `GitHub API HTTP ${resp.status}`
        });
        return;
      }

      const data = (await resp.json()) as {
        commit?: {
          sha?: string;
          html_url?: string;
          commit?: {
            message?: string;
            author?: { name?: string; date?: string };
          };
        };
      };

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ok: true,
        configured: true,
        repo: `${cfg.owner}/${cfg.repo}`,
        branch: cfg.branch,
        hasWriteToken: Boolean(cfg.token),
        reachable: true,
        latestCommit: data.commit
          ? {
              sha: (data.commit.sha || '').slice(0, 7),
              fullSha: data.commit.sha || '',
              message: (data.commit.commit?.message || '').split('\n')[0],
              author: data.commit.commit?.author?.name || '',
              date: data.commit.commit?.author?.date || '',
              url: data.commit.html_url || ''
            }
          : null
      });
    } catch (err) {
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ok: true,
        configured: true,
        repo: `${cfg.owner}/${cfg.repo}`,
        branch: cfg.branch,
        hasWriteToken: Boolean(cfg.token),
        reachable: false,
        error: err instanceof Error ? err.message : 'GitHub সংযোগ ব্যর্থ হয়েছে'
      });
    }
  });

  app.get('/api/code-source/tree', requireDeveloperAuth, async (req: Request, res: Response) => {
    try {
      const files = await scanWorkspaceCodeFiles();
      const cfg = getGithubRepoConfig();
      const includeGithubDiff = req.query.compareGithub === '1' && cfg.configured;

      let githubTreeOk = false;
      let githubCommitSha = '';
      let githubBlobs = new Map<string, string>();

      if (includeGithubDiff) {
        const treeRes = await fetchGithubBranchTreeMap(cfg);
        githubTreeOk = treeRes.ok;
        githubCommitSha = treeRes.commitSha || '';
        githubBlobs = treeRes.blobs;
      }

      const enrichedFiles = files.map((file) => {
        let syncStatus: 'synced' | 'modified' | 'local-only' | 'untracked' = 'untracked';
        if (githubTreeOk) {
          const remoteSha = githubBlobs.get(file.path);
          if (!remoteSha) syncStatus = 'local-only';
          else syncStatus = remoteSha === file.blobSha ? 'synced' : 'modified';
        }
        return {
          path: file.path,
          size: file.size,
          lines: file.lines,
          updatedAt: file.updatedAt,
          category: file.category,
          syncStatus
        };
      });

      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ok: true,
        files: enrichedFiles,
        totalFiles: enrichedFiles.length,
        totalSize,
        githubCompared: githubTreeOk,
        githubCommitSha: githubCommitSha ? githubCommitSha.slice(0, 7) : null
      });
    } catch {
      res.status(500).json({ ok: false, error: 'কোড ফাইল তালিকা লোড করা যায়নি।' });
    }
  });

  app.get('/api/code-source/file', requireDeveloperAuth, async (req: Request, res: Response) => {
    const rawPath = typeof req.query.path === 'string' ? req.query.path : '';
    const checked = resolveSafeWorkspacePath(rawPath);
    if (checked.ok === false) {
      res.status(checked.status).json({ ok: false, error: checked.error });
      return;
    }

    try {
      const stat = await fs.promises.stat(checked.resolved);
      if (!stat.isFile()) {
        res.status(404).json({ ok: false, error: 'ফাইলটি পাওয়া যায়নি।' });
        return;
      }
      if (stat.size > MAX_CODE_FILE_BYTES) {
        res.status(413).json({ ok: false, error: 'ফাইলটি ৫১২ কেবি সীমার চেয়ে বড়।' });
        return;
      }
      const buf = await fs.promises.readFile(checked.resolved);
      if (buf.includes(0)) {
        res.status(400).json({ ok: false, error: 'বাইনারি ফাইল কোড এডিটরে খোলা যাবে না।' });
        return;
      }
      const content = buf.toString('utf8');
      const localBlobSha = computeGitBlobSha(content);

      let githubContent: string | null = null;
      let githubInSync: boolean | null = null;
      if (req.query.compareGithub === '1') {
        const cfg = getGithubRepoConfig();
        if (cfg.configured) {
          try {
            const ghResp = await githubApiFetch(
              `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeGithubRepoPath(checked.relPath)}?ref=${encodeURIComponent(cfg.branch)}`,
              cfg.token
            );
            if (ghResp.ok) {
              const ghData = (await ghResp.json()) as { content?: string; encoding?: string; sha?: string };
              if (ghData.encoding === 'base64' && typeof ghData.content === 'string') {
                githubContent = Buffer.from(ghData.content.replace(/\s+/g, ''), 'base64').toString('utf8');
                githubInSync = githubContent === content;
              } else if (typeof ghData.sha === 'string') {
                githubInSync = ghData.sha === localBlobSha;
              }
            }
          } catch {
            // ignore GitHub compare fetch errors
          }
        }
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ok: true,
        path: checked.relPath,
        content,
        size: stat.size,
        lines: content.length === 0 ? 0 : content.split(/\r?\n/).length,
        updatedAt: stat.mtime.toISOString(),
        githubContent,
        githubInSync
      });
    } catch {
      res.status(404).json({ ok: false, error: 'ফাইলটি পড়া যায়নি বা বিদ্যমান নেই।' });
    }
  });

  app.put('/api/code-source/file', requireDeveloperAuth, async (req: Request, res: Response) => {
    const rawPath = typeof req.body?.path === 'string' ? req.body.path : '';
    const content = typeof req.body?.content === 'string' ? req.body.content : null;
    const syncToGithub = req.body?.syncToGithub !== false;
    const rawCommitMsg =
      typeof req.body?.commitMessage === 'string' ? req.body.commitMessage.trim() : '';

    if (content === null) {
      res.status(400).json({ ok: false, error: 'সঠিক কোড কন্টেন্ট প্রদান করুন।' });
      return;
    }

    const byteLength = Buffer.byteLength(content, 'utf8');
    if (byteLength > MAX_CODE_FILE_BYTES) {
      res.status(413).json({ ok: false, error: 'ফাইলের আকার সর্বোচ্চ ৫১২ কেবি হতে পারবে।' });
      return;
    }

    const checked = resolveSafeWorkspacePath(rawPath, { forWrite: true });
    if (checked.ok === false) {
      res.status(checked.status).json({ ok: false, error: checked.error });
      return;
    }

    try {
      await fs.promises.mkdir(path.dirname(checked.resolved), { recursive: true });
      const tempPath = `${checked.resolved}.tmp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      await fs.promises.writeFile(tempPath, content, 'utf8');
      await fs.promises.rename(tempPath, checked.resolved);

      const stat = await fs.promises.stat(checked.resolved);
      const cfg = getGithubRepoConfig();
      const safeCommitMessage = (rawCommitMsg || `Update ${checked.relPath} via Developer Panel`).slice(0, 140);

      let githubResult: {
        synced: boolean;
        commitSha?: string;
        commitUrl?: string;
        reason?: string;
      } = { synced: false, reason: 'লোকাল সেভ সম্পন্ন হয়েছে।' };

      if (syncToGithub) {
        githubResult = await pushSingleFileToGithub(cfg, checked.relPath, content, safeCommitMessage);
      }

      res.json({
        ok: true,
        path: checked.relPath,
        size: stat.size,
        lines: content.length === 0 ? 0 : content.split(/\r?\n/).length,
        updatedAt: stat.mtime.toISOString(),
        savedLocal: true,
        syncedToGithub: githubResult.synced,
        commitSha: githubResult.commitSha ? githubResult.commitSha.slice(0, 7) : undefined,
        commitUrl: githubResult.commitUrl,
        githubMessage: githubResult.reason
      });
    } catch (err) {
      console.error('Code source write error:', err);
      res.status(500).json({ ok: false, error: 'ফাইল সংরক্ষণ করতে সমস্যা হয়েছে।' });
    }
  });

  app.post('/api/code-source/pull-from-github', requireDeveloperAuth, async (req: Request, res: Response) => {
    const cfg = getGithubRepoConfig();
    if (!cfg.configured) {
      res.status(400).json({
        ok: false,
        error: 'সার্ভারে GITHUB_REPO (যেমন owner/repo) কনফিগার করা নেই।'
      });
      return;
    }

    const singlePath = typeof req.body?.path === 'string' ? req.body.path.trim() : '';

    try {
      if (singlePath) {
        const checked = resolveSafeWorkspacePath(singlePath, { forWrite: true });
        if (checked.ok === false) {
          res.status(checked.status).json({ ok: false, error: checked.error });
          return;
        }
        const ghResp = await githubApiFetch(
          `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeGithubRepoPath(checked.relPath)}?ref=${encodeURIComponent(cfg.branch)}`,
          cfg.token
        );
        if (!ghResp.ok) {
          res.status(404).json({ ok: false, error: 'ফাইলটি গিটহাব রিপোজিটরিতে পাওয়া যায়নি।' });
          return;
        }
        const ghData = (await ghResp.json()) as { content?: string; encoding?: string };
        if (ghData.encoding !== 'base64' || typeof ghData.content !== 'string') {
          res.status(400).json({ ok: false, error: 'গিটহাব থেকে টেক্সট ফাইল ডাউনলোড করা যায়নি।' });
          return;
        }
        const decoded = Buffer.from(ghData.content.replace(/\s+/g, ''), 'base64').toString('utf8');
        if (Buffer.byteLength(decoded, 'utf8') > MAX_CODE_FILE_BYTES) {
          res.status(413).json({ ok: false, error: 'গিটহাব ফাইলটি ৫১২ কেবি সীমার চেয়ে বড়।' });
          return;
        }
        await fs.promises.mkdir(path.dirname(checked.resolved), { recursive: true });
        await fs.promises.writeFile(checked.resolved, decoded, 'utf8');
        res.json({
          ok: true,
          path: checked.relPath,
          content: decoded,
          updatedCount: 1
        });
        return;
      }

      // Full repository pull for differing code files
      const treeRes = await fetchGithubBranchTreeMap(cfg);
      if (!treeRes.ok) {
        res.status(502).json({ ok: false, error: treeRes.error || 'গিটহাব ফাইল ট্রি লোড করা যায়নি।' });
        return;
      }

      const localFiles = await scanWorkspaceCodeFiles();
      const localShaMap = new Map(localFiles.map((f) => [f.path, f.blobSha]));

      let updatedCount = 0;
      let skippedCount = 0;

      for (const [remotePath, remoteSha] of treeRes.blobs.entries()) {
        const checked = resolveSafeWorkspacePath(remotePath, { forWrite: true });
        if (!checked.ok) {
          skippedCount++;
          continue;
        }
        if (localShaMap.get(checked.relPath) === remoteSha) continue;

        const ghResp = await githubApiFetch(
          `/repos/${cfg.owner}/${cfg.repo}/git/blobs/${encodeURIComponent(remoteSha)}`,
          cfg.token
        );
        if (!ghResp.ok) {
          skippedCount++;
          continue;
        }
        const blobData = (await ghResp.json()) as { content?: string; encoding?: string; size?: number };
        if (
          blobData.encoding !== 'base64' ||
          typeof blobData.content !== 'string' ||
          (typeof blobData.size === 'number' && blobData.size > MAX_CODE_FILE_BYTES)
        ) {
          skippedCount++;
          continue;
        }
        const buf = Buffer.from(blobData.content.replace(/\s+/g, ''), 'base64');
        if (buf.includes(0) || buf.length > MAX_CODE_FILE_BYTES) {
          skippedCount++;
          continue;
        }
        await fs.promises.mkdir(path.dirname(checked.resolved), { recursive: true });
        await fs.promises.writeFile(checked.resolved, buf.toString('utf8'), 'utf8');
        updatedCount++;
      }

      res.json({
        ok: true,
        updatedCount,
        skippedCount,
        commitSha: treeRes.commitSha ? treeRes.commitSha.slice(0, 7) : undefined
      });
    } catch (err) {
      console.error('GitHub pull error:', err);
      res.status(500).json({ ok: false, error: 'গিটহাব থেকে কোড সিঙ্ক করতে সমস্যা হয়েছে।' });
    }
  });

  app.post('/api/code-source/push-all-to-github', requireDeveloperAuth, async (req: Request, res: Response) => {
    const cfg = getGithubRepoConfig();
    if (!cfg.configured || !cfg.token) {
      res.status(400).json({
        ok: false,
        error: 'গিটহাবে পুশ করতে সার্ভারে GITHUB_REPO এবং GITHUB_TOKEN কনফিগার করুন।'
      });
      return;
    }

    const rawMsg =
      typeof req.body?.commitMessage === 'string' && req.body.commitMessage.trim()
        ? req.body.commitMessage.trim()
        : 'Sync website source code via Developer Panel';
    const commitMessage = rawMsg.slice(0, 140);

    try {
      const refResp = await githubApiFetch(
        `/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${encodeURIComponent(cfg.branch)}`,
        cfg.token
      );
      if (!refResp.ok) {
        res.status(502).json({ ok: false, error: `গিটহাব ব্রাঞ্চ তথ্য পাওয়া যায়নি (HTTP ${refResp.status})` });
        return;
      }
      const refData = (await refResp.json()) as { object?: { sha?: string } };
      const parentCommitSha = refData.object?.sha || '';
      if (!parentCommitSha) {
        res.status(502).json({ ok: false, error: 'গিটহাব ব্রাঞ্চ হেড SHA পাওয়া যায়নি।' });
        return;
      }

      const commitResp = await githubApiFetch(
        `/repos/${cfg.owner}/${cfg.repo}/git/commits/${encodeURIComponent(parentCommitSha)}`,
        cfg.token
      );
      if (!commitResp.ok) {
        res.status(502).json({ ok: false, error: 'গিটহাব বেস ট্রি পড়া যায়নি।' });
        return;
      }
      const commitData = (await commitResp.json()) as { tree?: { sha?: string } };
      const baseTreeSha = commitData.tree?.sha || '';
      if (!baseTreeSha) {
        res.status(502).json({ ok: false, error: 'গিটহাব বেস ট্রি SHA পাওয়া যায়নি।' });
        return;
      }

      const remoteTreeRes = await fetchGithubBranchTreeMap(cfg);
      const localFiles = await scanWorkspaceCodeFiles();

      const treeEntries: Array<{
        path: string;
        mode: '100644';
        type: 'blob';
        content: string;
      }> = [];

      for (const f of localFiles) {
        const remoteSha = remoteTreeRes.blobs.get(f.path);
        if (remoteSha && remoteSha === f.blobSha) continue;
        const checked = resolveSafeWorkspacePath(f.path);
        if (!checked.ok) continue;
        const content = await fs.promises.readFile(checked.resolved, 'utf8');
        treeEntries.push({
          path: checked.relPath,
          mode: '100644',
          type: 'blob',
          content
        });
      }

      if (treeEntries.length === 0) {
        res.json({
          ok: true,
          pushedCount: 0,
          alreadyInSync: true,
          commitSha: parentCommitSha.slice(0, 7)
        });
        return;
      }

      const newTreeResp = await githubApiFetch(`/repos/${cfg.owner}/${cfg.repo}/git/trees`, cfg.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeEntries
        })
      });
      if (!newTreeResp.ok) {
        const txt = await newTreeResp.text().catch(() => '');
        res.status(502).json({ ok: false, error: `গিটহাব ট্রি তৈরি ব্যর্থ: ${txt.slice(0, 140)}` });
        return;
      }
      const newTreeData = (await newTreeResp.json()) as { sha?: string };

      const newCommitResp = await githubApiFetch(`/repos/${cfg.owner}/${cfg.repo}/git/commits`, cfg.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: commitMessage,
          tree: newTreeData.sha,
          parents: [parentCommitSha]
        })
      });
      if (!newCommitResp.ok) {
        const txt = await newCommitResp.text().catch(() => '');
        res.status(502).json({ ok: false, error: `গিটহাব কমিট তৈরি ব্যর্থ: ${txt.slice(0, 140)}` });
        return;
      }
      const newCommitData = (await newCommitResp.json()) as { sha?: string; html_url?: string };

      const updateRefResp = await githubApiFetch(
        `/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${encodeURIComponent(cfg.branch)}`,
        cfg.token,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sha: newCommitData.sha })
        }
      );
      if (!updateRefResp.ok) {
        const txt = await updateRefResp.text().catch(() => '');
        res.status(502).json({ ok: false, error: `গিটহাব ব্রাঞ্চ আপডেট ব্যর্থ: ${txt.slice(0, 140)}` });
        return;
      }

      res.json({
        ok: true,
        pushedCount: treeEntries.length,
        alreadyInSync: false,
        commitSha: (newCommitData.sha || '').slice(0, 7),
        commitUrl: newCommitData.html_url || ''
      });
    } catch (err) {
      console.error('GitHub push all error:', err);
      res.status(500).json({ ok: false, error: 'গিটহাবে কোড পুশ করতে সমস্যা হয়েছে।' });
    }
  });

  app.post('/api/forget-password', async (req: Request, res: Response) => {
    try {
      const userId = typeof req.body?.userId === 'string' ? req.body.userId.trim() : '';
      const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
      const scopeRaw = typeof req.body?.scope === 'string' ? req.body.scope : 'any';
      const modeRaw = typeof req.body?.mode === 'string' ? req.body.mode : 'auto';
      const preferredScope: 'haji' | 'admin' | 'any' =
        scopeRaw === 'haji' || scopeRaw === 'admin' ? scopeRaw : 'any';

      if (!userId || !email) {
        res.status(400).json({
          ok: false,
          error: 'অনুগ্রহ করে ইউজার আইডি এবং নিবন্ধিত ইমেইল—উভয়ই সঠিকভাবে দিন।'
        });
        return;
      }

      const matched = await findAccountForPasswordRecovery(userId, email, preferredScope);
      if (!matched) {
        res.status(404).json({
          ok: false,
          error: 'প্রদত্ত ইউজার আইডি ও ইমেইল মিলেনি! অনুগ্রহ করে নিবন্ধিত সঠিক ইউজার আইডি এবং ইমেইল দিয়ে পুনরায় চেষ্টা করুন।'
        });
        return;
      }

      const maskedEmail = maskEmailAddress(matched.email);
      const sentAt = new Date().toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      // Path 1: Queue verified recovery request for Super Admin Gmail dispatch (for non-Gmail or assisted users)
      if (modeRaw === 'admin_request') {
        const existing = await loadRecoveryRequests();
        const alreadyPending = existing.find(
          (r) =>
            r.status === 'pending' &&
            r.email.toLowerCase() === matched.email.toLowerCase() &&
            r.userId.toLowerCase() === matched.displayUserId.toLowerCase()
        );
        if (!alreadyPending) {
          const newRequest: PasswordRecoveryQueueItem = {
            id: `pwr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId: matched.displayUserId,
            email: matched.email,
            maskedEmail,
            accountName: matched.accountName,
            accountType: matched.accountType,
            roleLabel: matched.roleLabel,
            requestedAt: sentAt,
            status: 'pending'
          };
          await saveRecoveryRequests([newRequest, ...existing]);
        }
        res.json({
          ok: true,
          queuedForAdmin: true,
          maskedEmail,
          accountType: matched.accountType,
          roleLabel: matched.roleLabel,
          accountName: matched.accountName,
          sentAt
        });
        return;
      }

      // Path 2: Direct Gmail API Delivery (client passed Google OAuth Bearer token)
      const bearerToken = extractBearerToken(req);
      if (bearerToken) {
        const tokenOwnerEmail = await verifyGoogleAccessTokenEmail(bearerToken);
        if (!tokenOwnerEmail) {
          res.status(401).json({
            ok: false,
            gmailAuthExpired: true,
            error: 'Google সেশনের মেয়াদ শেষ হয়ে গেছে বা অনুমোদন সঠিক নয়। অনুগ্রহ করে আবার "Sign in with Google" করুন।'
          });
          return;
        }

        const superAdminEmail = await getSuperAdminEmail();
        const targetEmailLower = matched.email.toLowerCase();
        const isAllowedSender =
          tokenOwnerEmail === targetEmailLower || tokenOwnerEmail === superAdminEmail;

        if (!isAllowedSender) {
          res.status(403).json({
            ok: false,
            emailMismatch: true,
            signedInEmail: tokenOwnerEmail,
            error: `আপনি ${tokenOwnerEmail} দিয়ে সাইন ইন করেছেন, কিন্তু এই একাউন্টের নিবন্ধিত ইমেইল (${maskedEmail}) ভিন্ন। নিরাপত্তার স্বার্থে আপনার নিবন্ধিত Google একাউন্ট দিয়ে সাইন ইন করুন অথবা নিচ থেকে অ্যাডমিনের মাধ্যমে ইমেইলে পাঠানোর অনুরোধ করুন।`
          });
          return;
        }

        const gmailResult = await sendPasswordRecoveryViaGmailApi(
          bearerToken,
          tokenOwnerEmail,
          matched
        );

        if (gmailResult.sent) {
          // Password sent ONLY straight to the user's real email inbox — NEVER returned in HTTP response
          res.json({
            ok: true,
            deliveredToEmail: true,
            method: 'gmail',
            maskedEmail,
            accountType: matched.accountType,
            roleLabel: matched.roleLabel,
            accountName: matched.accountName,
            sentAt
          });
          return;
        }

        if (gmailResult.status === 401 || gmailResult.status === 403) {
          res.status(401).json({
            ok: false,
            gmailAuthExpired: true,
            error: 'Gmail থেকে ইমেইল পাঠানোর অনুমতি সক্রিয় নেই বা মেয়াদ শেষ হয়েছে। অনুগ্রহ করে পুনরায় "Sign in with Google" করে অনুমতি দিন।'
          });
          return;
        }

        res.status(502).json({
          ok: false,
          error: 'Gmail-এর মাধ্যমে ইমেইল পাঠানো যায়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
        });
        return;
      }

      // Path 3: Server-configured SMTP / Resend / Brevo automatic delivery (when env vars exist)
      const delivery = await sendPasswordRecoveryEmail(matched);
      if (delivery.configured && delivery.sent) {
        res.json({
          ok: true,
          deliveredToEmail: true,
          method: 'smtp',
          maskedEmail,
          accountType: matched.accountType,
          roleLabel: matched.roleLabel,
          accountName: matched.accountName,
          sentAt
        });
        return;
      }

      if (delivery.configured && !delivery.sent) {
        res.status(502).json({
          ok: false,
          error: 'ইমেইল পাঠানো যায়নি! অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা Gmail পদ্ধতি ব্যবহার করুন।'
        });
        return;
      }

      // Path 4: Account verified! Prompt user for Gmail Sign-In or Admin Gmail Dispatch (NEVER reveal password!)
      const lowerMatchedEmail = matched.email.toLowerCase();
      const isGmailAddress =
        lowerMatchedEmail.endsWith('@gmail.com') || lowerMatchedEmail.endsWith('@googlemail.com');

      res.json({
        ok: true,
        requiresGmailAuth: true,
        isGmailAddress,
        maskedEmail,
        accountType: matched.accountType,
        roleLabel: matched.roleLabel,
        accountName: matched.accountName
      });
    } catch (err) {
      console.error('Forget password error:', err);
      res.status(500).json({
        ok: false,
        error: 'পাসওয়ার্ড পুনরুদ্ধার প্রক্রিয়ায় ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      });
    }
  });

  app.get('/api/password-recovery-requests', async (_req: Request, res: Response) => {
    try {
      const requests = await loadRecoveryRequests();
      res.setHeader('Cache-Control', 'no-store');
      res.json({ ok: true, requests });
    } catch {
      res.status(500).json({ ok: false, requests: [] });
    }
  });

  app.post('/api/password-recovery-requests/:id/send', async (req: Request, res: Response) => {
    try {
      const requestId = req.params.id;
      const requests = await loadRecoveryRequests();
      const target = requests.find((r) => r.id === requestId);
      if (!target) {
        res.status(404).json({ ok: false, error: 'পাসওয়ার্ড রিকভারি অনুরোধটি খুঁজে পাওয়া যায়নি।' });
        return;
      }

      const matched = await findAccountForPasswordRecovery(
        target.userId,
        target.email,
        target.accountType === 'haji' ? 'haji' : 'admin'
      );
      if (!matched) {
        res.status(404).json({
          ok: false,
          error: 'এই অনুরোধের সাথে সংশ্লিষ্ট একাউন্ট ডাটাবেসে পাওয়া যায়নি।'
        });
        return;
      }

      const sentAt = new Date().toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

      const bearerToken = extractBearerToken(req);
      let sentByLabel = 'Server Mail';

      if (bearerToken) {
        const tokenOwnerEmail = await verifyGoogleAccessTokenEmail(bearerToken);
        if (!tokenOwnerEmail) {
          res.status(401).json({
            ok: false,
            error: 'Google সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার "Sign in with Google" করুন।'
          });
          return;
        }

        const superAdminEmail = await getSuperAdminEmail();
        if (
          tokenOwnerEmail !== superAdminEmail &&
          tokenOwnerEmail !== matched.email.toLowerCase()
        ) {
          res.status(403).json({
            ok: false,
            error: `সুপার অ্যাডমিন ইমেইল (${superAdminEmail}) দিয়ে সাইন ইন করে পাসওয়ার্ড রিকভারি ইমেইল পাঠান।`
          });
          return;
        }

        const gmailRes = await sendPasswordRecoveryViaGmailApi(
          bearerToken,
          tokenOwnerEmail,
          matched
        );
        if (!gmailRes.sent) {
          res.status(gmailRes.status === 401 || gmailRes.status === 403 ? 401 : 502).json({
            ok: false,
            error: 'Gmail দিয়ে ইমেইল পাঠানো যায়নি। অনুগ্রহ করে পুনরায় Sign in with Google করে চেষ্টা করুন।'
          });
          return;
        }
        sentByLabel = tokenOwnerEmail;
      } else {
        const delivery = await sendPasswordRecoveryEmail(matched);
        if (!delivery.configured || !delivery.sent) {
          res.status(401).json({
            ok: false,
            error: 'ইমেইল পাঠাতে প্রথমে "Sign in with Google" বাটনে ক্লিক করে আপনার সুপার অ্যাডমিন Gmail যুক্ত করুন।'
          });
          return;
        }
      }

      const updated = requests.map((item) =>
        item.id === requestId
          ? { ...item, status: 'sent' as const, sentAt, sentBy: sentByLabel }
          : item
      );
      await saveRecoveryRequests(updated);

      res.json({
        ok: true,
        deliveredToEmail: true,
        maskedEmail: maskEmailAddress(matched.email),
        sentAt
      });
    } catch (err) {
      console.error('Admin dispatch recovery email error:', err);
      res.status(500).json({
        ok: false,
        error: 'ইমেইল পাঠাতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
      });
    }
  });

  app.delete('/api/password-recovery-requests/:id', async (req: Request, res: Response) => {
    try {
      const requestId = req.params.id;
      const requests = await loadRecoveryRequests();
      const filtered = requests.filter((r) => r.id !== requestId);
      await saveRecoveryRequests(filtered);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ ok: false });
    }
  });

  app.post('/api/extract-passport', async (req: Request, res: Response) => {
    try {
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();
      if (!apiKey || apiKey === 'YOUR_API_KEY' || apiKey.length < 10) {
        res.status(200).json({
          ok: false,
          fallback: 'browser-ocr'
        });
        return;
      }

      const fileDataUrl =
        typeof req.body?.fileDataUrl === 'string' ? req.body.fileDataUrl.trim() : '';

      const parsedPayload = fileDataUrl ? parseDataUrlPayload(fileDataUrl) : null;
      if (!parsedPayload) {
        res.status(400).json({
          ok: false,
          error: 'সঠিক পাসপোর্ট ছবি (JPG/PNG/WEBP) অথবা PDF ফাইল আপলোড করুন।'
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = [
        'Analyze this uploaded passport image or PDF (commonly a Bangladeshi e-Passport, MRP data page, and/or personal/emergency information page).',
        'Extract ONLY details clearly printed on the document. If a field is not visible or unreadable, return an empty string "" for that field (do NOT guess or invent values).',
        'Field extraction rules:',
        '1. nameEn: Full name of the passport holder in English uppercase (read directly from "Name:" on the Personal Data page and verify with "Given Name" + "Surname" on the Bio Data page, e.g., "MD ABDUS SALAM" or "MD ALTAF ALI"; NEVER include MRZ "<" filler or stray C/K/L characters misread from "<").',
        '2. dateOfBirth: Date of birth formatted strictly as YYYY-MM-DD (e.g., "1980-05-14").',
        '3. nidNo: National ID / NID / Personal No. (usually 10, 13, or 17 digits under Personal No. or NID No.). Remove spaces.',
        '4. passportNo: Passport number in uppercase without spaces (e.g., "A01234567" or "A23557113").',
        '5. guardianPhone: Emergency Contact telephone or mobile number printed under "Emergency Contact -> Telephone No:" (e.g., "+8801326292983" normalized cleanly to "01326292983").',
        '6. guardianName: Emergency Contact Name printed under "Emergency Contact -> Name:" (e.g., "MD SHARIFUL ISLAM"), or "Legal Guardian\'s Name" only if Emergency Contact Name is blank.',
        '7. guardianRelation: Emergency Contact Relationship printed under "Emergency Contact -> Relationship:" ONLY (e.g., "SON", "WIFE", "HUSBAND", "DAUGHTER", "FATHER", "MOTHER"). Never return "ADDRESS" or an address line; if unreadable, return "".',
        '8. fatherNameEn: Father\'s full name in English uppercase printed under "Father\'s Name:".',
        '9. motherNameEn: Mother\'s full name in English uppercase printed under "Mother\'s Name:".',
        '10. presentAddress: Complete address printed under "Address:" (or "Permanent Address:" / "Present Address:") in English uppercase (e.g., "CHALK JHINAHAR, SHIBGANJ, BURIGANJ - 5810, BOGURA").',
        '11. postCode: The 4-digit Bangladeshi postal code found inside that Address (e.g., "5810"), or "" if none.'
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: parsedPayload.mimeType,
                data: parsedPayload.base64Data
              }
            },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nameEn: { type: Type.STRING },
              dateOfBirth: { type: Type.STRING },
              nidNo: { type: Type.STRING },
              passportNo: { type: Type.STRING },
              guardianPhone: { type: Type.STRING },
              guardianName: { type: Type.STRING },
              guardianRelation: { type: Type.STRING },
              fatherNameEn: { type: Type.STRING },
              motherNameEn: { type: Type.STRING },
              presentAddress: { type: Type.STRING },
              postCode: { type: Type.STRING }
            },
            required: [
              'nameEn',
              'dateOfBirth',
              'nidNo',
              'passportNo',
              'guardianPhone',
              'guardianName',
              'guardianRelation',
              'fatherNameEn',
              'motherNameEn',
              'presentAddress',
              'postCode'
            ]
          }
        }
      });

      const rawText = response.text || '{}';
      const rawJson = JSON.parse(rawText) as Record<string, unknown>;

      const cleanStr = (val: unknown) =>
        typeof val === 'string' ? val.replace(/\s+/g, ' ').trim() : '';

      const presentAddress = cleanStr(rawJson.presentAddress);
      const rawPostCode = cleanStr(rawJson.postCode).replace(/\D/g, '');
      const derivedPostCode =
        rawPostCode.length === 4
          ? rawPostCode
          : presentAddress.match(/[-–]\s*([1-9]\d{3})\b/)?.[1] ||
            presentAddress.match(/\b([1-9]\d{3})\b/)?.[1] ||
            '';

      const rawGuardianPhone = cleanStr(rawJson.guardianPhone).replace(/[\s\-()]/g, '');
      const normalizedGuardianPhone = rawGuardianPhone
        .replace(/^\+?88(01[3-9]\d{8})$/, '$1')
        .replace(/^88(01[3-9]\d{8})$/, '$1');

      const rawRelation = cleanStr(rawJson.guardianRelation).toUpperCase();
      const safeGuardianRelation =
        /^(?:ADDRESS|N\/A|NONE|NULL)$/.test(rawRelation) || /\bADDRESS\b/.test(rawRelation)
          ? ''
          : rawRelation;

      const extracted = {
        nameEn: cleanStr(rawJson.nameEn).toUpperCase(),
        dateOfBirth: normalizePassportDate(cleanStr(rawJson.dateOfBirth)),
        nidNo: cleanStr(rawJson.nidNo).replace(/\s+/g, ''),
        passportNo: cleanStr(rawJson.passportNo).replace(/\s+/g, '').toUpperCase(),
        guardianPhone: normalizedGuardianPhone,
        guardianName: cleanStr(rawJson.guardianName).toUpperCase(),
        guardianRelation: safeGuardianRelation,
        fatherNameEn: cleanStr(rawJson.fatherNameEn).toUpperCase(),
        motherNameEn: cleanStr(rawJson.motherNameEn).toUpperCase(),
        presentAddress,
        postCode: derivedPostCode
      };

      res.json({ ok: true, data: extracted });
    } catch {
      res.status(200).json({
        ok: false,
        fallback: 'browser-ocr'
      });
    }
  });

  app.get('/api/govt-hajj-notices', async (req: Request, res: Response) => {
    const requestedUrl =
      typeof req.query.url === 'string' && req.query.url.trim()
        ? req.query.url.trim()
        : 'https://www.hajj.gov.bd/';

    const targetUrl = isAllowedPublicHttpUrl(requestedUrl);
    if (!targetUrl) {
      res.status(400).json({
        ok: false,
        error: 'Invalid or disallowed portal URL. Must be a public http/https URL.'
      });
      return;
    }

    try {
      const notices = await fetchGovtNoticesFromSource(targetUrl);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.json({
        ok: true,
        sourceUrl: targetUrl.toString(),
        syncedAt: new Date().toISOString(),
        notices
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notices';
      res.status(502).json({
        ok: false,
        sourceUrl: targetUrl.toString(),
        error: message,
        notices: []
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*path}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
