import express from 'express';
import type { Request, Response } from 'express';
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

    // 2. Check Sub-Admin & Employee accounts in Supabase
    if (serverSupabase) {
      try {
        const { data: rows } = await serverSupabase.from('sub_admins').select('*');
        if (Array.isArray(rows)) {
          for (const row of rows as Array<Record<string, any>>) {
            const raw = (row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {}) as Record<string, any>;
            const recEmail = String(row.email || raw.email || '').trim().toLowerCase();
            if (!recEmail || recEmail !== cleanEmail) continue;

            const username = String(row.username || raw.username || '').trim().toLowerCase();
            const employeeId = String(row.employee_id || raw.employeeId || '').trim().toLowerCase();
            const recId = String(row.id || '').trim().toLowerCase();
            const phoneDigits = toAsciiDigits(String(row.phone || raw.phone || '')).replace(/[^0-9]/g, '');

            const userIdMatches =
              (Boolean(username) && username === cleanUserId) ||
              (Boolean(employeeId) && employeeId === cleanUserId) ||
              (Boolean(recId) && recId === cleanUserId) ||
              recEmail === cleanUserId ||
              (Boolean(cleanUserIdDigits) && Boolean(phoneDigits) && phoneDigits === cleanUserIdDigits);

            if (!userIdMatches) continue;

            const prevPass = String(
              row.password || raw.password || row.initial_password || raw.initialPassword || ''
            ).trim();
            if (!prevPass) continue;

            const isEmployee =
              row.role === 'employee' ||
              raw.role === 'employee' ||
              String(row.id || '').startsWith('emp-');

            return {
              accountType: isEmployee ? 'employee' : 'sub_admin',
              roleLabel: isEmployee ? 'কর্মচারী (Employee)' : 'সাব-এডমিন (Sub-Admin)',
              accountName: String(row.english_name || raw.englishName || row.name || username || recEmail),
              displayUserId: String(row.username || raw.username || row.employee_id || raw.employeeId || recEmail),
              email: String(row.email || raw.email).trim(),
              previousPassword: prevPass
            };
          }
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
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
        '1. nameEn: Full name of the passport holder in English uppercase (combine Given Name + Surname cleanly in natural order, e.g., "MD ABDULLAH"; never include MRZ filler "<").',
        '2. dateOfBirth: Date of birth formatted strictly as YYYY-MM-DD (e.g., "1980-05-14").',
        '3. nidNo: National ID / NID / Personal No. (usually 10, 13, or 17 digits under Personal No. or NID No.). Remove spaces.',
        '4. passportNo: Passport number in uppercase without spaces (e.g., "A01234567" or "EP1234567").',
        '5. guardianPhone: Emergency Contact telephone or mobile number visible on the passport (e.g., under Emergency Contact Telephone No., normalized cleanly like "01787843822" if Bangladeshi +880 number).',
        '6. guardianName: Emergency Contact Name (under "Emergency Contact: -> Name:") or Legal Guardian\'s Name in English uppercase if printed on the passport (e.g., "MD TOZIMMAL HOSSAIN").',
        '7. guardianRelation: Emergency Contact Relationship ONLY (under "Emergency Contact: -> Relationship:", e.g., "SON", "WIFE", "HUSBAND", "DAUGHTER", "FATHER", "MOTHER"). Never return "ADDRESS" or an address line; if unreadable, return "".',
        '8. fatherNameEn: Father\'s full name in English uppercase if printed on the passport.',
        '9. motherNameEn: Mother\'s full name in English uppercase if printed on the passport.',
        '10. presentAddress: Present address or permanent/emergency address printed on the passport in readable form.',
        '11. postCode: 4-digit Bangladeshi postal code found inside the address (e.g., "5810"), or "" if none.'
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

      const rawGuardianPhone = cleanStr(rawJson.guardianPhone);
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
