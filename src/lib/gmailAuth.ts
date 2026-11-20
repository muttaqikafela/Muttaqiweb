import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type Auth,
  type User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'] as const;

// Strictly in-memory token caching (never persisted in localStorage or sessionStorage)
let authInstance: Auth | null = null;
let authListenerBound = false;
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

type AuthListener = (user: User | null, token: string | null) => void;
const listeners = new Set<AuthListener>();

function notifyListeners() {
  for (const listener of listeners) {
    listener(cachedUser, cachedAccessToken);
  }
}

// Lazily initialize Firebase Auth only when the user actually initiates Google Sign-In
// so initial page load never injects cross-origin gapi/auth scripts prematurely.
function ensureFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  }
  if (!authListenerBound && authInstance) {
    authListenerBound = true;
    onAuthStateChanged(authInstance, (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          cachedUser = user;
          notifyListeners();
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          cachedUser = null;
          notifyListeners();
        }
      } else {
        cachedAccessToken = null;
        cachedUser = null;
        notifyListeners();
      }
    });
  }
  return authInstance;
}

export function subscribeGmailAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
): () => void {
  const listener: AuthListener = (user, token) => {
    if (user && token) {
      onAuthSuccess?.(user, token);
    } else {
      onAuthFailure?.();
    }
  };
  listeners.add(listener);
  // Emit current in-memory state immediately without triggering eager Firebase script loads
  listener(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
}

export function getGmailAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google সাইন ইন পপআপ বন্ধ করা হয়েছে। ইমেইল পাঠাতে পুনরায় চেষ্টা করুন।';
  }
  if (code === 'auth/popup-blocked') {
    return 'ব্রাউজার পপআপ ব্লক করেছে। অনুগ্রহ করে পপআপ অনুমতি দিয়ে আবার চেষ্টা করুন।';
  }
  if (code === 'auth/network-request-failed') {
    return 'নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। ইন্টারনেট যাচাই করে পুনরায় চেষ্টা করুন।';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'এই ডোমেইনে Google সাইন ইন অনুমোদিত নয়। অনুগ্রহ করে অ্যাডমিনের মাধ্যমে ইমেইলে পাঠাতে অনুরোধ করুন।';
  }
  return 'Google সাইন ইন করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা অ্যাডমিনের মাধ্যমে ইমেইলে পাঠাতে অনুরোধ করুন।';
}

export async function signInWithGmail(
  loginHint?: string
): Promise<{ user: User; accessToken: string }> {
  const auth = ensureFirebaseAuth();
  const provider = new GoogleAuthProvider();
  for (const scope of GMAIL_SCOPES) {
    provider.addScope(scope);
  }
  const customParams: Record<string, string> = {
    prompt: 'select_account'
  };
  if (loginHint && loginHint.includes('@')) {
    customParams.login_hint = loginHint.trim();
  }
  provider.setCustomParameters(customParams);

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google থেকে Gmail অনুমোদন টোকেন পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    notifyListeners();
    return { user: result.user, accessToken: credential.accessToken };
  } finally {
    isSigningIn = false;
  }
}

export function getGmailAccessToken(): string | null {
  return cachedAccessToken;
}

export function getGmailUser(): User | null {
  return cachedUser;
}

export async function signOutGmail(): Promise<void> {
  cachedAccessToken = null;
  cachedUser = null;
  if (authInstance) {
    try {
      await authInstance.signOut();
    } catch {
      // ignore sign-out errors
    }
  }
  notifyListeners();
}
