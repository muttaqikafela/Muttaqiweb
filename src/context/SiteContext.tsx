import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { SupabaseService } from '../services/supabaseService';
import {
  DEVELOPER_EMAIL,
  hasDeveloperAuth,
  hasDeveloperSession,
  clearDeveloperSession,
  setupDeveloperPassword,
  verifyDeveloperPassword,
  startDeveloperSession,
  changeDeveloperPassword
} from '../lib/developerAuth';

export interface SiteTheme {
  primary: string;
  accent: string;
  headerBg: string;
  footerBg: string;
  buttonBg: string;
  background: string;
  text: string;
}
export interface SiteBody {
  heroTitle: string;
  heroText: string;
  aboutTitle: string;
  aboutText: string;
  packagesTitle: string;
  packagesText: string;
  servicesTitle: string;
  servicesText: string;
  reviewsTitle: string;
  reviewsText: string;
  ctaTitle: string;
  ctaText: string;
}
export interface QuickLink {
  label: string;
  page: 'home' | 'services' | 'about' | 'gallery' | 'contact';
}
export interface SiteFooterSettings {
  intro: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  youtube: string;
  whatsapp: string;
  quickLinks: QuickLink[];
  officeHours: string;
  quote: string;
  copyright: string;
}
export interface SiteSettings {
  logoUrl: string;
  faviconUrl: string;
  siteNameBn: string;
  siteNameEn: string;
  tagline: string;
  domain: string;
  body: SiteBody;
  footer: SiteFooterSettings;
  theme: SiteTheme;
}
export interface AdSlot {
  id: string;
  page: string; // home | services | about | gallery | contact | all
  provider: 'adsterra' | 'google_ads' | 'custom' | 'other';
  slotName: string;
  adCode: string;
  adLink: string;
  position: string;
  isEnabled: boolean;
}
export interface DeveloperCredit {
  name: string;
  photoUrl: string;
  phone: string;
  email: string;
  facebook: string;
  youtube: string;
  whatsapp: string;
}

export const DEFAULT_THEME: SiteTheme = {
  primary: '#DCB473',
  accent: '#b88e44',
  headerBg: '#0f2922',
  footerBg: '#0b1e19',
  buttonBg: '#0f2922',
  background: '#FAF8F5',
  text: '#1c1917'
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logoUrl: '',
  faviconUrl: '',
  siteNameBn: 'মুত্তাকী হজ্ব ও কন্সাল্টেন্সি',
  siteNameEn: 'Muttaqi Hajj & Consultancy',
  tagline: 'পবিত্র হজ্ব ও ওমরাহ সেবায় আপনার নির্ভরযোগ্য কাফেলা',
  domain: 'muttaqi.com.bd',
  body: {
    heroTitle: 'মুত্তাকী হজ্ব ও কন্সাল্টেন্সি',
    heroText:
      'অভিজ্ঞ আলেম ও মোয়াল্লিমদের সার্বক্ষণিক দিকনির্দেশনায় পবিত্র হজ্ব, সুলভ ওমরাহ, এয়ার টিকিট, নিশ্চিত হোটেল ও ভিসা সেবায় আপনার নির্ভরযোগ্য কাফেলা।',
    aboutTitle: 'পবিত্রতার কাফেলা ও বিশ্বস্ত সেবা',
    aboutText:
      'মুত্তাকী হজ্ব ও কন্সাল্টেন্সির সাথে পবিত্র কাবা ও মসজিদে নববীর উদ্দেশ্যে যাত্রা করুন নিশ্চিন্তে।',
    packagesTitle: 'পবিত্র হজ্ব ও ওমরাহ প্যাকেজসমূহ',
    packagesText: 'আপনার বাজেট ও সুবিধানুযায়ী মানসম্মত আবাসন, ফ্লাইট ও সম্পূর্ণ কাফেলা ব্যবস্থাপনা।',
    servicesTitle: 'আমাদের সেবাসমূহ',
    servicesText: 'হজ্ব, ওমরাহ, ভিসা, এয়ার টিকিট ও হোটেল বুকিং — সব সেবা এক জায়গায়।',
    reviewsTitle: 'হাজীদের মতামত',
    reviewsText: 'আমাদের কাফেলার হাজীদের অভিজ্ঞতা ও মতামত।',
    ctaTitle: 'আজই প্রাক-নিবন্ধন করুন',
    ctaText: 'পবিত্র যাত্রার জন্য আসন সীমিত — দেরি না করে যোগাযোগ করুন।'
  },
  footer: {
    intro: 'আপনার আধ্যাত্মিক যাত্রাকে সহজ, নিরাপদ ও স্মরণীয় করে তোলাই আমাদের সর্বোচ্চ অঙ্গীকার।',
    address: 'দুপচাঁচিয়া, বগুড়া, বাংলাদেশ',
    phone: '',
    email: '',
    facebook: '',
    youtube: '',
    whatsapp: '',
    quickLinks: [
      { label: 'হোম পেইজ', page: 'home' },
      { label: 'আমাদের সেবাসমূহ', page: 'services' },
      { label: 'ফটো গ্যালারি', page: 'gallery' },
      { label: 'আমাদের সম্পর্কে', page: 'about' },
      { label: 'যোগাযোগ', page: 'contact' }
    ],
    officeHours: 'সকাল ৯টা — রাত ৯টা (প্রতিদিন)',
    quote: 'আল্লাহর ঘরের মেহমানদের সেবাই আমাদের ইবাদত।',
    copyright: ''
  },
  theme: DEFAULT_THEME
};

interface SiteContextType {
  siteSettings: SiteSettings;
  saveSiteSettings: (next: SiteSettings) => Promise<boolean>;
  resetSiteSettings: () => void;
  ads: AdSlot[];
  saveAds: (next: AdSlot[]) => void;
  developerCredit: DeveloperCredit;
  saveDeveloperCredit: (next: DeveloperCredit) => void;
  isDeveloper: boolean;
  developerEmail: string;
  developerNeedsSetup: boolean;
  developerLogin: (email: string, password: string) => Promise<{ ok: boolean; needsSetup: boolean }>;
  developerSetup: (password: string) => Promise<void>;
  developerChangePassword: (current: string, next: string) => Promise<boolean>;
  developerLogout: () => void;
  syncStatus: { lastSyncTime: string | null; lastResult: 'idle' | 'success' | 'failed'; pending: boolean };
  setSyncStatus: (s: { lastSyncTime: string | null; lastResult: 'idle' | 'success' | 'failed'; pending: boolean }) => void;
  syncSiteData: () => Promise<boolean>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {}
  return fallback;
}
function loadArray<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    }
  } catch {}
  return [];
}
function save(key: string, val: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const loaded = load<SiteSettings>('muttaqi_site_settings_v1', DEFAULT_SITE_SETTINGS);
    // Deep-merge nested objects so older saved settings keep new defaults.
    return {
      ...DEFAULT_SITE_SETTINGS,
      ...loaded,
      body: { ...DEFAULT_SITE_SETTINGS.body, ...(loaded.body || {}) },
      footer: { ...DEFAULT_SITE_SETTINGS.footer, ...(loaded.footer || {}) },
      theme: { ...DEFAULT_SITE_SETTINGS.theme, ...(loaded.theme || {}) }
    };
  });
  const [ads, setAds] = useState<AdSlot[]>(() => loadArray<AdSlot>('muttaqi_ads_slots_v1'));
  const [developerCredit, setDeveloperCredit] = useState<DeveloperCredit>(() =>
    load<DeveloperCredit>('muttaqi_developer_credit_v1', {
      name: '',
      photoUrl: '',
      phone: '',
      email: DEVELOPER_EMAIL,
      facebook: '',
      youtube: '',
      whatsapp: ''
    })
  );
  const [isDeveloper, setIsDeveloper] = useState<boolean>(() => hasDeveloperSession());
  const [syncStatus, setSyncStatus] = useState<{
    lastSyncTime: string | null;
    lastResult: 'idle' | 'success' | 'failed';
    pending: boolean;
  }>({ lastSyncTime: null, lastResult: 'idle', pending: false });

  // Apply theme as CSS variables, plus title + favicon, immediately.
  useEffect(() => {
    const root = document.documentElement;
    const t = siteSettings.theme;
    root.style.setProperty('--theme-primary', t.primary);
    root.style.setProperty('--theme-accent', t.accent);
    root.style.setProperty('--theme-header-bg', t.headerBg);
    root.style.setProperty('--theme-footer-bg', t.footerBg);
    root.style.setProperty('--theme-button-bg', t.buttonBg);
    root.style.setProperty('--theme-background', t.background);
    root.style.setProperty('--theme-text', t.text);
    document.title = siteSettings.siteNameBn;
    const faviconUrl = siteSettings.faviconUrl || siteSettings.logoUrl;
    if (faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [siteSettings]);

  const saveSiteSettings = async (next: SiteSettings): Promise<boolean> => {
    setSiteSettings(next);
    save('muttaqi_site_settings_v1', next);
    // Auto-sync to hosting when available; local data is never lost on failure.
    try {
      await SupabaseService.saveSiteSettings(next);
    } catch {}
    return true;
  };
  const resetSiteSettings = () => {
    setSiteSettings(DEFAULT_SITE_SETTINGS);
    save('muttaqi_site_settings_v1', DEFAULT_SITE_SETTINGS);
  };
  const saveAds = (next: AdSlot[]) => {
    setAds(next);
    save('muttaqi_ads_slots_v1', next);
    SupabaseService.saveAdsSlots(next).catch(() => {});
  };
  const saveDeveloperCredit = (next: DeveloperCredit) => {
    setDeveloperCredit(next);
    save('muttaqi_developer_credit_v1', next);
    SupabaseService.saveDeveloperCredit(next).catch(() => {});
  };
  const syncSiteData = async (): Promise<boolean> => {
    try {
      const ok1 = await SupabaseService.saveSiteSettings(siteSettings);
      const ok2 = await SupabaseService.saveAdsSlots(ads);
      const ok3 = await SupabaseService.saveDeveloperCredit(developerCredit);
      return ok1 || ok2 || ok3;
    } catch {
      return false;
    }
  };

  const developerLogin = async (email: string, password: string) => {
    if (email.trim().toLowerCase() !== DEVELOPER_EMAIL) {
      return { ok: false, needsSetup: false };
    }
    const ok = await verifyDeveloperPassword(password);
    if (ok) {
      startDeveloperSession();
      setIsDeveloper(true);
      return { ok: true, needsSetup: false };
    }
    if (!hasDeveloperAuth()) return { ok: false, needsSetup: true };
    return { ok, needsSetup: false };
  };
  const developerSetup = async (password: string) => {
    await setupDeveloperPassword(password);
    setIsDeveloper(true);
  };
  const developerChangePassword = async (current: string, next: string) => {
    return changeDeveloperPassword(current, next);
  };
  const developerLogout = () => {
    clearDeveloperSession();
    setIsDeveloper(false);
  };

  const value = useMemo(
    () => ({
      siteSettings,
      saveSiteSettings,
      resetSiteSettings,
      ads,
      saveAds,
      developerCredit,
      saveDeveloperCredit,
      isDeveloper,
      developerEmail: DEVELOPER_EMAIL,
      developerNeedsSetup: !hasDeveloperAuth(),
      developerLogin,
      developerSetup,
      developerChangePassword,
      developerLogout,
      syncStatus,
      setSyncStatus,
      syncSiteData
    }),
    [siteSettings, ads, developerCredit, isDeveloper, syncStatus]
  );
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export function useSite(): SiteContextType {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
