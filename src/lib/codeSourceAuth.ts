/* Memory-only Bearer session store for Developer Code Source server routes.
   Tokens live strictly in JS memory and are cleared on logout or page reload. */

let inMemoryCodeSourceToken: string | null = null;
let inMemoryTokenExpiresAt = 0;

export function getCodeSourceToken(): string | null {
  if (!inMemoryCodeSourceToken) return null;
  if (inMemoryTokenExpiresAt > 0 && Date.now() >= inMemoryTokenExpiresAt) {
    inMemoryCodeSourceToken = null;
    inMemoryTokenExpiresAt = 0;
    return null;
  }
  return inMemoryCodeSourceToken;
}

export function setCodeSourceToken(token: string | null, expiresInMs = 4 * 60 * 60 * 1000) {
  inMemoryCodeSourceToken = token && token.trim() ? token.trim() : null;
  inMemoryTokenExpiresAt = inMemoryCodeSourceToken ? Date.now() + expiresInMs : 0;
}

export function clearCodeSourceToken() {
  inMemoryCodeSourceToken = null;
  inMemoryTokenExpiresAt = 0;
}

export async function authenticateCodeSourceServer(
  email: string,
  password: string,
  mode: 'login' | 'setup' = 'login'
): Promise<{
  ok: boolean;
  serverAvailable: boolean;
  needsSetup?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/code-source/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mode })
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, serverAvailable: false };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      token?: string;
      expiresInMs?: number;
      needsSetup?: boolean;
      error?: string;
    };
    if (res.ok && data.ok && data.token) {
      setCodeSourceToken(data.token, data.expiresInMs);
      return { ok: true, serverAvailable: true };
    }
    return {
      ok: false,
      serverAvailable: true,
      needsSetup: Boolean(data.needsSetup),
      error: data.error
    };
  } catch {
    return { ok: false, serverAvailable: false };
  }
}

export async function updateCodeSourceServerPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; serverAvailable: boolean; error?: string }> {
  try {
    const token = getCodeSourceToken();
    const res = await fetch('/api/code-source/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, serverAvailable: false };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      token?: string;
      expiresInMs?: number;
      error?: string;
    };
    if (res.ok && data.ok) {
      if (data.token) setCodeSourceToken(data.token, data.expiresInMs);
      return { ok: true, serverAvailable: true };
    }
    return { ok: false, serverAvailable: true, error: data.error };
  } catch {
    return { ok: false, serverAvailable: false };
  }
}

export async function logoutCodeSourceServer(): Promise<void> {
  const token = getCodeSourceToken();
  clearCodeSourceToken();
  if (!token) return;
  try {
    await fetch('/api/code-source/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    // ignore network errors on static hosts
  }
}
