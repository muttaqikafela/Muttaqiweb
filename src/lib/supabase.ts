import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nxsvorwevdbpdqyobvua.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_thSb5TCXSHldDKhKTOPFmQ_IMOJzbGF';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const SUPABASE_PROJECT_ID = 'nxsvorwevdbpdqyobvua';

export const CUSTOM_DOMAIN = 'muttaqi.com.bd';
export const PRIMARY_DOMAIN_URL = 'https://muttaqi.com.bd';

// Dynamic OAuth redirect URL helper that adapts to current browser origin or production custom domain
export const getAuthRedirectUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return PRIMARY_DOMAIN_URL;
};

// When no hosting configuration is provided (the normal local case),
// export a stub client whose queries fail gracefully instead of throwing.
// Local data is always kept, and a manual sync retries later.
function stubQuery() {
  const err = { message: 'not configured', code: 'NOT_CONFIGURED' };
  const chain: any = {
    select: async () => ({ data: null, error: err }),
    insert: async () => ({ data: null, error: err }),
    upsert: async () => ({ data: null, error: err }),
    update: async () => ({ data: null, error: err }),
    delete: async () => ({ data: null, error: err }),
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    single: async () => ({ data: null, error: err }),
  };
  return chain;
}
const stubClient: any = {
  from: () => stubQuery(),
  auth: {
    getSession: async () => ({ data: { session: null } }),
    signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: async () => ({ error: null })
  }
};

export const supabase: any = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'muttaqi_supabase_auth_token'
      }
    })
  : stubClient;

// Helper to trigger OAuth login with safe fallback redirect URL
export async function signInWithProvider(
  provider: 'google' | 'facebook' | 'github' | 'azure',
  customRedirect?: string
) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured yet');
  }
  const redirectUri = customRedirect || getAuthRedirectUrl();
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUri
    }
  });
}
