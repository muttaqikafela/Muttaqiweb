import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'] as const;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Strictly in-memory token caching (never persisted in localStorage or sessionStorage)
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

onAuthStateChanged(auth, (user: User | null) => {
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
  // Emit current in-memory state immediately
  listener(cachedUser, cachedAccessToken);
  return () => {
    listeners.delete(listener);
  };
}

export async function signInWithGmail(
  loginHint?: string
): Promise<{ user: User; accessToken: string }> {
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
  try {
    await auth.signOut();
  } catch {
    // ignore sign-out errors
  }
  notifyListeners();
}
