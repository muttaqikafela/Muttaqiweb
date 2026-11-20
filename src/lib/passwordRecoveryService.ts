import { supabase } from './supabase';

export type RecoveryAccountType = 'haji' | 'admin' | 'sub_admin' | 'employee';

export interface PasswordRecoveryQueueItem {
  id: string;
  userId: string;
  email: string;
  maskedEmail: string;
  accountName: string;
  accountType: RecoveryAccountType;
  roleLabel: string;
  requestedAt: string;
  status: 'pending' | 'sent';
  sentAt?: string;
  sentBy?: string;
}

export interface ForgetPasswordResponse {
  ok: boolean;
  deliveredToEmail?: boolean;
  requiresGmailAuth?: boolean;
  queuedForAdmin?: boolean;
  isGmailAddress?: boolean;
  gmailAuthExpired?: boolean;
  emailMismatch?: boolean;
  maskedEmail?: string;
  accountType?: RecoveryAccountType;
  roleLabel?: string;
  accountName?: string;
  sentAt?: string;
  error?: string;
}

interface MatchedAccountInternal {
  accountType: RecoveryAccountType;
  roleLabel: string;
  accountName: string;
  displayUserId: string;
  email: string;
  previousPassword: string;
}

const DEFAULT_ADMIN_EMAIL = 'muttaqi.kafela@gmail.com';
const DEFAULT_ADMIN_PASS = 'Muttaqi111@';
const DEFAULT_ADMIN_NAME = 'মুত্তাকী এডমিন (Muttaqi Admin)';

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

function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function utf8ToBase64Url(text: string): string {
  return utf8ToBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeRfc2047Utf8(text: string): string {
  return `=?UTF-8?B?${utf8ToBase64(text)}?=`;
}

function formatBnTimestamp(): string {
  try {
    return new Date().toLocaleString('bn-BD', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return new Date().toLocaleString();
  }
}

async function tryBackendJson<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit
): Promise<{ available: boolean; ok: boolean; status: number; data: T | null }> {
  try {
    const resp = await fetch(url, init);
    const contentType = (resp.headers.get('content-type') || '').toLowerCase();
    // Static hosts (GitHub Pages / Vercel SPA rewrites) return text/html for /api/* routes
    if (!contentType.includes('application/json')) {
      return { available: false, ok: false, status: resp.status, data: null };
    }
    const data = (await resp.json()) as T;
    return { available: true, ok: resp.ok, status: resp.status, data };
  } catch {
    return { available: false, ok: false, status: 0, data: null };
  }
}

async function getSuperAdminCredentialsDirect(): Promise<{
  email: string;
  password: string;
  name: string;
}> {
  let email = DEFAULT_ADMIN_EMAIL;
  let password = DEFAULT_ADMIN_PASS;
  let name = DEFAULT_ADMIN_NAME;

  try {
    const { data } = await supabase
      .from('app_storage')
      .select('value')
      .eq('key', 'admin_credentials')
      .maybeSingle();
    const stored = (data as { value?: Record<string, unknown> } | null)?.value;
    if (stored && typeof stored === 'object') {
      if (typeof stored.email === 'string' && stored.email.trim()) email = stored.email.trim();
      if (typeof stored.password === 'string' && stored.password.trim()) {
        password = stored.password.trim();
      }
      if (typeof stored.name === 'string' && stored.name.trim()) name = stored.name.trim();
    }
  } catch {
    // fallback to defaults
  }

  return { email, password, name };
}

async function findAccountDirectInSupabase(
  rawUserId: string,
  rawEmail: string,
  preferredScope: 'haji' | 'admin' | 'any'
): Promise<MatchedAccountInternal | null> {
  const cleanUserId = rawUserId.trim().toLowerCase();
  const cleanUserIdDigits = toAsciiDigits(cleanUserId).replace(/[^0-9]/g, '');
  const cleanEmail = rawEmail.trim().toLowerCase();

  if (!cleanUserId || !cleanEmail) return null;

  const checkAdminAndStaff = async (): Promise<MatchedAccountInternal | null> => {
    const adminCred = await getSuperAdminCredentialsDirect();
    const adminEmailLower = adminCred.email.toLowerCase();
    const adminNameLower = adminCred.name.toLowerCase();
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
        accountName: adminCred.name,
        displayUserId: adminCred.email,
        email: adminCred.email,
        previousPassword: adminCred.password
      };
    }

    try {
      const { data: rows } = await supabase.from('sub_admins').select('*');
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
      // ignore query failure
    }

    return null;
  };

  const checkHajiAccounts = async (): Promise<MatchedAccountInternal | null> => {
    try {
      const { data: rows } = await supabase.from('inquiries').select('*');
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
      // ignore query failure
    }

    return null;
  };

  if (preferredScope === 'haji') {
    return (await checkHajiAccounts()) || (await checkAdminAndStaff());
  }
  return (await checkAdminAndStaff()) || (await checkHajiAccounts());
}

async function verifyGoogleTokenEmailDirect(accessToken: string): Promise<string | null> {
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
    // fallback below
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

async function sendViaGmailApiDirect(
  accessToken: string,
  fromEmail: string,
  account: MatchedAccountInternal
): Promise<{ sent: boolean; status?: number }> {
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
    utf8ToBase64(textBody),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    utf8ToBase64(htmlBody),
    '',
    `--${boundary}--`
  ];

  const raw = utf8ToBase64Url(mimeLines.join('\r\n'));

  try {
    const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });
    return { sent: resp.ok, status: resp.status };
  } catch {
    return { sent: false };
  }
}

async function loadRecoveryQueueDirect(): Promise<PasswordRecoveryQueueItem[]> {
  try {
    const { data } = await supabase
      .from('app_storage')
      .select('value')
      .eq('key', 'password_recovery_requests')
      .maybeSingle();
    const stored = (data as { value?: unknown } | null)?.value;
    if (Array.isArray(stored)) {
      return stored as PasswordRecoveryQueueItem[];
    }
  } catch {
    // ignore
  }
  return [];
}

async function saveRecoveryQueueDirect(items: PasswordRecoveryQueueItem[]): Promise<void> {
  await supabase.from('app_storage').upsert(
    {
      key: 'password_recovery_requests',
      value: items.slice(0, 100),
      updated_at: new Date().toISOString()
    },
    { onConflict: 'key' }
  );
}

/**
 * Step 1: Verify User ID + Email (works both with Express backend AND on static hosting like GitHub Pages / muttaqi.com.bd)
 */
export async function verifyOrSendForgetPassword(params: {
  userId: string;
  email: string;
  scope: 'haji' | 'admin';
}): Promise<ForgetPasswordResponse> {
  // 1. Try backend /api/forget-password first (handles server SMTP if configured)
  const backend = await tryBackendJson<ForgetPasswordResponse>('/api/forget-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (backend.available && backend.data) {
    return backend.data;
  }

  // 2. Seamless Static Hosting Fallback (GitHub Pages / muttaqi.com.bd): Verify live in Supabase
  const matched = await findAccountDirectInSupabase(params.userId, params.email, params.scope);
  if (!matched) {
    return {
      ok: false,
      error:
        'প্রদত্ত ইউজার আইডি ও ইমেইল মিলেনি! অনুগ্রহ করে নিবন্ধিত সঠিক ইউজার আইডি এবং ইমেইল দিয়ে পুনরায় চেষ্টা করুন।'
    };
  }

  const lowerEmail = matched.email.toLowerCase();
  const isGmailAddress =
    lowerEmail.endsWith('@gmail.com') || lowerEmail.endsWith('@googlemail.com');

  return {
    ok: true,
    requiresGmailAuth: true,
    isGmailAddress,
    maskedEmail: maskEmailAddress(matched.email),
    accountType: matched.accountType,
    roleLabel: matched.roleLabel,
    accountName: matched.accountName
  };
}

/**
 * Step 2A: Send recovery email directly to user's Email Inbox via Gmail API (works on both Node server AND static GitHub Pages)
 */
export async function sendForgetPasswordViaGmail(params: {
  userId: string;
  email: string;
  scope: 'haji' | 'admin';
  accessToken: string;
}): Promise<ForgetPasswordResponse> {
  // 1. Try backend route first (sends MIME entirely from server when backend is active)
  const backend = await tryBackendJson<ForgetPasswordResponse>('/api/forget-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.accessToken}`
    },
    body: JSON.stringify({
      userId: params.userId,
      email: params.email,
      scope: params.scope,
      mode: 'gmail'
    })
  });

  if (backend.available && backend.data) {
    return backend.data;
  }

  // 2. Static Hosting Direct Gmail API Path (GitHub Pages / muttaqi.com.bd)
  const matched = await findAccountDirectInSupabase(params.userId, params.email, params.scope);
  if (!matched) {
    return {
      ok: false,
      error:
        'প্রদত্ত ইউজার আইডি ও ইমেইল মিলেনি! অনুগ্রহ করে নিবন্ধিত সঠিক ইউজার আইডি এবং ইমেইল দিয়ে পুনরায় চেষ্টা করুন।'
    };
  }

  const tokenOwnerEmail = await verifyGoogleTokenEmailDirect(params.accessToken);
  if (!tokenOwnerEmail) {
    return {
      ok: false,
      gmailAuthExpired: true,
      error:
        'Google সেশনের মেয়াদ শেষ হয়ে গেছে বা অনুমোদন সঠিক নয়। অনুগ্রহ করে আবার "Sign in with Google" করুন।'
    };
  }

  const superAdmin = await getSuperAdminCredentialsDirect();
  const maskedEmail = maskEmailAddress(matched.email);
  const isAllowed =
    tokenOwnerEmail === matched.email.toLowerCase() ||
    tokenOwnerEmail === superAdmin.email.toLowerCase();

  if (!isAllowed) {
    return {
      ok: false,
      emailMismatch: true,
      error: `আপনি ${tokenOwnerEmail} দিয়ে সাইন ইন করেছেন, কিন্তু এই একাউন্টের নিবন্ধিত ইমেইল (${maskedEmail}) ভিন্ন। নিরাপত্তার স্বার্থে আপনার নিবন্ধিত Google একাউন্ট দিয়ে সাইন ইন করুন অথবা নিচ থেকে অ্যাডমিনের মাধ্যমে ইমেইলে পাঠানোর অনুরোধ করুন।`
    };
  }

  const gmailRes = await sendViaGmailApiDirect(params.accessToken, tokenOwnerEmail, matched);
  if (!gmailRes.sent) {
    if (gmailRes.status === 401 || gmailRes.status === 403) {
      return {
        ok: false,
        gmailAuthExpired: true,
        error:
          'Gmail থেকে ইমেইল পাঠানোর অনুমতি সক্রিয় নেই বা মেয়াদ শেষ হয়েছে। অনুগ্রহ করে পুনরায় "Sign in with Google" করে অনুমতি দিন।'
      };
    }
    return {
      ok: false,
      error: 'Gmail-এর মাধ্যমে ইমেইল পাঠানো যায়নি। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।'
    };
  }

  return {
    ok: true,
    deliveredToEmail: true,
    maskedEmail,
    accountType: matched.accountType,
    roleLabel: matched.roleLabel,
    accountName: matched.accountName,
    sentAt: formatBnTimestamp()
  };
}

/**
 * Step 2B: Queue verified recovery request for Super Admin Gmail dispatch (works on both Node server AND static GitHub Pages)
 */
export async function submitAdminRecoveryRequest(params: {
  userId: string;
  email: string;
  scope: 'haji' | 'admin';
}): Promise<ForgetPasswordResponse> {
  const backend = await tryBackendJson<ForgetPasswordResponse>('/api/forget-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      mode: 'admin_request'
    })
  });

  if (backend.available && backend.data) {
    return backend.data;
  }

  const matched = await findAccountDirectInSupabase(params.userId, params.email, params.scope);
  if (!matched) {
    return {
      ok: false,
      error:
        'প্রদত্ত ইউজার আইডি ও ইমেইল মিলেনি! অনুগ্রহ করে নিবন্ধিত সঠিক ইউজার আইডি এবং ইমেইল দিয়ে পুনরায় চেষ্টা করুন।'
    };
  }

  const maskedEmail = maskEmailAddress(matched.email);
  const sentAt = formatBnTimestamp();

  try {
    const existing = await loadRecoveryQueueDirect();
    const alreadyPending = existing.find(
      (r) =>
        r.status === 'pending' &&
        r.email.toLowerCase() === matched.email.toLowerCase() &&
        r.userId.toLowerCase() === matched.displayUserId.toLowerCase()
    );
    if (!alreadyPending) {
      const item: PasswordRecoveryQueueItem = {
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
      await saveRecoveryQueueDirect([item, ...existing]);
    }
    return {
      ok: true,
      queuedForAdmin: true,
      maskedEmail,
      accountType: matched.accountType,
      roleLabel: matched.roleLabel,
      accountName: matched.accountName,
      sentAt
    };
  } catch {
    return {
      ok: false,
      error: 'অনুরোধ সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
    };
  }
}

/**
 * Admin Dashboard: Fetch recovery queue (hybrid backend + static Supabase fallback)
 */
export async function fetchPasswordRecoveryRequests(): Promise<PasswordRecoveryQueueItem[]> {
  const backend = await tryBackendJson<{ ok: boolean; requests?: PasswordRecoveryQueueItem[] }>(
    '/api/password-recovery-requests',
    { cache: 'no-store' }
  );
  if (backend.available && backend.ok && Array.isArray(backend.data?.requests)) {
    return backend.data.requests;
  }
  return loadRecoveryQueueDirect();
}

/**
 * Admin Dashboard: Dispatch recovery email to user's inbox via Admin's Gmail (hybrid backend + static Supabase/Gmail fallback)
 */
export async function sendQueuedRecoveryRequest(
  requestItem: PasswordRecoveryQueueItem,
  accessToken: string | null
): Promise<ForgetPasswordResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const backend = await tryBackendJson<ForgetPasswordResponse>(
    `/api/password-recovery-requests/${encodeURIComponent(requestItem.id)}/send`,
    { method: 'POST', headers }
  );
  if (backend.available && backend.data) {
    return backend.data;
  }

  if (!accessToken) {
    return {
      ok: false,
      gmailAuthExpired: true,
      error:
        'ইমেইল পাঠাতে প্রথমে "Sign in with Google" বাটনে ক্লিক করে আপনার সুপার অ্যাডমিন Gmail যুক্ত করুন।'
    };
  }

  const tokenOwnerEmail = await verifyGoogleTokenEmailDirect(accessToken);
  if (!tokenOwnerEmail) {
    return {
      ok: false,
      gmailAuthExpired: true,
      error: 'Google সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার "Sign in with Google" করুন।'
    };
  }

  const superAdmin = await getSuperAdminCredentialsDirect();
  const matched = await findAccountDirectInSupabase(
    requestItem.userId,
    requestItem.email,
    requestItem.accountType === 'haji' ? 'haji' : 'admin'
  );
  if (!matched) {
    return {
      ok: false,
      error: 'এই অনুরোধের সাথে সংশ্লিষ্ট একাউন্ট ডাটাবেসে পাওয়া যায়নি।'
    };
  }

  if (
    tokenOwnerEmail !== superAdmin.email.toLowerCase() &&
    tokenOwnerEmail !== matched.email.toLowerCase()
  ) {
    return {
      ok: false,
      error: `সুপার অ্যাডমিন ইমেইল (${superAdmin.email}) দিয়ে সাইন ইন করে পাসওয়ার্ড রিকভারি ইমেইল পাঠান।`
    };
  }

  const gmailRes = await sendViaGmailApiDirect(accessToken, tokenOwnerEmail, matched);
  if (!gmailRes.sent) {
    return {
      ok: false,
      gmailAuthExpired: gmailRes.status === 401 || gmailRes.status === 403,
      error: 'Gmail দিয়ে ইমেইল পাঠানো যায়নি। অনুগ্রহ করে পুনরায় Sign in with Google করে চেষ্টা করুন।'
    };
  }

  const sentAt = formatBnTimestamp();
  try {
    const current = await loadRecoveryQueueDirect();
    const updated = current.map((item) =>
      item.id === requestItem.id
        ? { ...item, status: 'sent' as const, sentAt, sentBy: tokenOwnerEmail }
        : item
    );
    await saveRecoveryQueueDirect(updated);
  } catch {
    // email already delivered
  }

  return {
    ok: true,
    deliveredToEmail: true,
    maskedEmail: maskEmailAddress(matched.email),
    sentAt
  };
}

/**
 * Admin Dashboard: Remove a recovery request from the queue
 */
export async function deleteQueuedRecoveryRequest(requestId: string): Promise<boolean> {
  const backend = await tryBackendJson<{ ok: boolean }>(
    `/api/password-recovery-requests/${encodeURIComponent(requestId)}`,
    { method: 'DELETE' }
  );
  if (backend.available) {
    return Boolean(backend.ok && backend.data?.ok);
  }
  try {
    const current = await loadRecoveryQueueDirect();
    await saveRecoveryQueueDirect(current.filter((item) => item.id !== requestId));
    return true;
  } catch {
    return false;
  }
}
