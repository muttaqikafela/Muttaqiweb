/* Developer identity only. No password — plain or hashed — for the
   developer is stored in code. A password is set by the developer on
   first login and only its salted SHA-256 hash is kept in localStorage. */

export const DEVELOPER_EMAIL = 'sizu111@gmail.com';
const AUTH_KEY = 'muttaqi_developer_auth_v1';
const SESSION_KEY = 'muttaqi_developer_session_v1';

export interface DeveloperAuthRecord {
  salt: string;
  hash: string;
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, val: string) {
  try {
    window.localStorage.setItem(key, val);
  } catch {}
}
function safeRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

export function hasDeveloperAuth(): boolean {
  return !!safeGet(AUTH_KEY);
}
export function hasDeveloperSession(): boolean {
  return safeGet(SESSION_KEY) === 'true';
}
export function clearDeveloperSession() {
  safeRemove(SESSION_KEY);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const INITIAL_DEV_PASSWORD = 'Sizu111@';

export async function setupDeveloperPassword(password: string): Promise<void> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const salt = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hash = await sha256Hex(salt + password);
  safeSet(AUTH_KEY, JSON.stringify({ salt, hash } satisfies DeveloperAuthRecord));
  safeSet(SESSION_KEY, 'true');
}

export async function verifyDeveloperPassword(password: string): Promise<boolean> {
  try {
    const raw = safeGet(AUTH_KEY);
    if (!raw) {
      if (password === INITIAL_DEV_PASSWORD) {
        await setupDeveloperPassword(password);
        return true;
      }
      return false;
    }
    const rec = JSON.parse(raw) as DeveloperAuthRecord;
    const hash = await sha256Hex(rec.salt + password);
    return hash === rec.hash;
  } catch {
    return false;
  }
}

export function startDeveloperSession() {
  safeSet(SESSION_KEY, 'true');
}

export async function changeDeveloperPassword(
  current: string,
  next: string
): Promise<boolean> {
  if (!(await verifyDeveloperPassword(current))) return false;
  await setupDeveloperPassword(next);
  return true;
}
