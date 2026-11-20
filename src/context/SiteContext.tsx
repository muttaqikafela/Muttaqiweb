import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { SupabaseService } from '../services/supabaseService';
import { fetchLiveGovtHajjNotices, type GovtHajjFetchResult } from '../services/govtHajjNoticeService';
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
export interface SiteTypography {
  headerFont: string;
  bodyFont: string;
  footerFont: string;
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
export interface GovtHajjNoticeItem {
  id: string;
  title: string;
  url: string;
  date: string;
  isPdf?: boolean;
  isCustom?: boolean;
}
export interface GovtHajjNoticeConfig {
  enabled: boolean;
  portalName: string;
  portalUrl: string;
  helpline: string;
  maxItems: number;
  autoRefreshMinutes: number;
  lastSyncedAt: string;
  notices: GovtHajjNoticeItem[];
}
export interface HajjFlightTicketLink {
  id: string;
  airlineName: string;
  websiteUrl: string;
  flightType: 'direct' | 'transit' | 'both';
  route: string;
  note: string;
  isActive?: boolean;
}
export interface HajjFlightTicketsConfig {
  enabled: boolean;
  sectionTitle: string;
  sectionSubtitle: string;
  links: HajjFlightTicketLink[];
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
  typography: SiteTypography;
  govtHajjNotice?: GovtHajjNoticeConfig;
  hajjFlightTickets?: HajjFlightTicketsConfig;
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
  address?: string;
  facebook: string;
  youtube: string;
  whatsapp: string;
}

export const DEFAULT_ADS_SLOTS: AdSlot[] = [
  {
    id: 'adsterra-native-top',
    slotName: 'Adsterra Native ব্যানার (শীর্ষ / Top)',
    provider: 'adsterra',
    page: 'all',
    position: 'top',
    isEnabled: true,
    adLink: '',
    adCode: `<script async="async" data-cfasync="false" src="https://bauval.org/21/064f6d12a215be7d1e32baef9e60b2b8"></script>\n<div id="container-064f6d12a215be7d1e32baef9e60b2b8"></div>`
  },
  {
    id: 'adsterra-300x250-middle',
    slotName: 'Adsterra 300x250 ব্যানার (মাঝখানে / Middle)',
    provider: 'adsterra',
    page: 'all',
    position: 'middle',
    isEnabled: true,
    adLink: '',
    adCode: `<script>\n  atOptions = {\n    'key' : '6ad875b1eeed05f304236c80fff49285',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script src="https://bauval.org/22/6ad875b1eeed05f304236c80fff49285"></script>`
  },
  {
    id: 'adsterra-300x250-bottom',
    slotName: 'Adsterra 300x250 ব্যানার (ফুটার / Bottom)',
    provider: 'adsterra',
    page: 'all',
    position: 'bottom',
    isEnabled: true,
    adLink: '',
    adCode: `<script>\n  atOptions = {\n    'key' : '6ad875b1eeed05f304236c80fff49285',\n    'format' : 'iframe',\n    'height' : 250,\n    'width' : 300,\n    'params' : {}\n  };\n</script>\n<script src="https://bauval.org/22/6ad875b1eeed05f304236c80fff49285"></script>`
  }
];

export const DEFAULT_THEME: SiteTheme = {
  primary: '#DCB473',
  accent: '#b88e44',
  headerBg: '#0f2922',
  footerBg: '#0b1e19',
  buttonBg: '#0f2922',
  background: '#FAF8F5',
  text: '#1c1917'
};

export const DEFAULT_TYPOGRAPHY: SiteTypography = {
  headerFont: "'Noto Serif Bengali', 'Tiro Bangla', serif",
  bodyFont: "'Noto Serif Bengali', 'Tiro Bangla', serif",
  footerFont: "'Noto Serif Bengali', 'Tiro Bangla', serif"
};

export const DEFAULT_GOVT_HAJJ_NOTICE_CONFIG: GovtHajjNoticeConfig = {
  enabled: true,
  portalName: 'বাংলাদেশ সরকারি হজ পোর্টাল (hajj.gov.bd)',
  portalUrl: 'https://www.hajj.gov.bd/',
  helpline: '১৬১৩৬',
  maxItems: 10,
  autoRefreshMinutes: 15,
  lastSyncedAt: '',
  notices: [
    {
      id: 'govt-seed-1',
      title: 'হিজরি ১৪৪৮/২০২৭ সনের হজ মৌসুমে জেলা পর্যায়ে হজযাত্রীদের প্রশিক্ষণ প্রদানের লক্ষ্যে প্রশিক্ষক মনোনয়নপূর্বক নামের তালিকা প্রেরণ।',
      url: 'https://ehaj.hajj.gov.bd/news/uploads/6ae871dfa50a70.676010001793618399.pdf',
      date: 'November 01, 2026',
      isPdf: true
    },
    {
      id: 'govt-seed-2',
      title: 'হিজরি ১৪৪৭/২০২৬ সনের হজের সরকারি ও বেসরকারি মাধ্যমের প্রাক-নিবন্ধন, নিবন্ধন ও ব্যবস্থাপনা সংক্রান্ত সরকারি নোটিশ ও সার্কুলারসমূহ।',
      url: 'https://www.hajj.gov.bd/',
      date: 'হজ পোর্টাল আপডেট',
      isPdf: false
    },
    {
      id: 'govt-seed-3',
      title: 'সরকারি ও বেসরকারি হজ ব্যবস্থাপনা সম্পর্কিত সকল সাম্প্রতিক বিজ্ঞপ্তি ও অফিস আদেশ দেখুন (ধর্ম বিষয়ক মন্ত্রণালয়)।',
      url: 'https://www.hajj.gov.bd/all-news',
      date: 'অফিশিয়াল আর্কাইভ',
      isPdf: false
    }
  ]
};

export const DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG: HajjFlightTicketsConfig = {
  enabled: true,
  sectionTitle: 'সৌদি আরব হজ বিমান টিকিট ও ফ্লাইট আপডেট (ডাইরেক্ট ও ট্রানজিট)',
  sectionSubtitle:
    'বাংলাদেশ থেকে সৌদি আরবের জেদ্দা (JED) ও মদিনা (MED) রুটে হজ ও ওমরাহর ডাইরেক্ট এবং ট্রানজিট বিমানের টিকিট ও ফ্লাইট শিডিউলের সর্বশেষ তথ্য দেখুন।',
  links: [
    {
      id: 'flight-biman',
      airlineName: 'বিমান বাংলাদেশ এয়ারলাইন্স',
      websiteUrl: 'https://www.biman-airlines.com/',
      flightType: 'direct',
      route: 'ঢাকা / চট্টগ্রাম / সিলেট → জেদ্দা ও মদিনা',
      note: 'সরকারি ও বেসরকারি হজ ডাইরেক্ট ফ্লাইট শিডিউল ও টিকিট আপডেট',
      isActive: true
    },
    {
      id: 'flight-saudia',
      airlineName: 'সৌদিয়া এয়ারলাইন্স (Saudia)',
      websiteUrl: 'https://www.saudia.com/',
      flightType: 'direct',
      route: 'ঢাকা (DAC) → জেদ্দা (JED) / মদিনা (MED)',
      note: 'সৌদি জাতীয় বিমান সংস্থা — ডাইরেক্ট হজ ও ওমরাহ টিকিট চেক',
      isActive: true
    },
    {
      id: 'flight-flynas',
      airlineName: 'ফ্লাইনাস (flynas)',
      websiteUrl: 'https://www.flynas.com/en',
      flightType: 'both',
      route: 'ঢাকা → রিয়াদ / জেদ্দা / দাম্মাম',
      note: 'ডাইরেক্ট ও সৌদি অভ্যন্তরীণ কানেক্টিং হজ/ওমরাহ টিকিট',
      isActive: true
    },
    {
      id: 'flight-qatar',
      airlineName: 'কাতার এয়ারওয়েজ (Qatar Airways)',
      websiteUrl: 'https://www.qatarairways.com/',
      flightType: 'transit',
      route: 'ঢাকা → দোহা (ট্রানজিট) → জেদ্দা / মদিনা',
      note: 'দোহা হামাদ এয়ারপোর্ট হয়ে প্রিমিয়াম ট্রানজিট ফ্লাইট আপডেট',
      isActive: true
    },
    {
      id: 'flight-emirates',
      airlineName: 'এমিরেটস এয়ারলাইন্স (Emirates)',
      websiteUrl: 'https://www.emirates.com/',
      flightType: 'transit',
      route: 'ঢাকা → দুবাই (ট্রানজিট) → জেদ্দা / মদিনা',
      note: 'দুবাই ট্রানজিট হয়ে আরামদায়ক হজ ও ওমরাহ টিকিট তথ্য',
      isActive: true
    },
    {
      id: 'flight-gulfair',
      airlineName: 'গালফ এয়ার (Gulf Air)',
      websiteUrl: 'https://www.gulfair.com/',
      flightType: 'transit',
      route: 'ঢাকা → বাহরাইন (ট্রানজিট) → জেদ্দা / মদিনা',
      note: 'কম সময়ে বাহরাইন ট্রানজিট ও সাশ্রয়ী হজ/ওমরাহ ফেয়ার',
      isActive: true
    },
    {
      id: 'flight-jazeera',
      airlineName: 'জাজিরা এয়ারওয়েজ (Jazeera)',
      websiteUrl: 'https://www.jazeeraairways.com/',
      flightType: 'transit',
      route: 'ঢাকা / চট্টগ্রাম → কুয়েত (ট্রানজিট) → জেদ্দা / মদিনা',
      note: 'সাশ্রয়ী বাজেটে কুয়েত ট্রানজিট হজ ও ওমরাহ টিকিট আপডেট',
      isActive: true
    },
    {
      id: 'flight-hajj-portal',
      airlineName: 'সরকারি হজ ফ্লাইট ও যাত্রী তথ্য',
      websiteUrl: 'https://www.hajj.gov.bd/',
      flightType: 'both',
      route: 'সকল হজ ফ্লাইট শিডিউল (বাংলাদেশ পোর্টাল)',
      note: 'প্রতিদিনের হজ ফ্লাইট সময়সূচি ও ফ্লাইট-সংক্রান্ত সরকারি বিজ্ঞপ্তি',
      isActive: true
    }
  ]
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
  theme: DEFAULT_THEME,
  typography: DEFAULT_TYPOGRAPHY,
  govtHajjNotice: DEFAULT_GOVT_HAJJ_NOTICE_CONFIG,
  hajjFlightTickets: DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG
};

interface SiteContextType {
  siteSettings: SiteSettings;
  saveSiteSettings: (next: SiteSettings) => Promise<boolean>;
  resetSiteSettings: () => void;
  refreshGovtHajjNotices: (customUrl?: string) => Promise<GovtHajjFetchResult>;
  isRefreshingGovtNotices: boolean;
  ads: AdSlot[];
  saveAds: (next: AdSlot[]) => Promise<boolean>;
  deleteAd: (id: string) => Promise<boolean>;
  clearAllAds: () => Promise<boolean>;
  developerCredit: DeveloperCredit;
  saveDeveloperCredit: (next: DeveloperCredit) => Promise<boolean>;
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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...fallback, ...parsed } as T;
      }
    }
  } catch {}
  return fallback;
}
function save(key: string, val: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

function normalizeSiteSettings(raw: Partial<SiteSettings> | null | undefined): SiteSettings {
  const src: Partial<SiteSettings> = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const rawBody: Partial<SiteBody> = src.body && typeof src.body === 'object' ? src.body : {};
  const rawFooter: Partial<SiteFooterSettings> = src.footer && typeof src.footer === 'object' ? src.footer : {};
  const rawTheme: Partial<SiteTheme> = src.theme && typeof src.theme === 'object' ? src.theme : {};
  const rawTypography: Partial<SiteTypography> = src.typography && typeof src.typography === 'object' ? src.typography : {};
  const rawGovt: Partial<GovtHajjNoticeConfig> = src.govtHajjNotice && typeof src.govtHajjNotice === 'object' ? src.govtHajjNotice : {};
  const rawFlights: Partial<HajjFlightTicketsConfig> = src.hajjFlightTickets && typeof src.hajjFlightTickets === 'object' ? src.hajjFlightTickets : {};

  const validNotices = Array.isArray(rawGovt.notices)
    ? rawGovt.notices.filter((n: unknown): n is GovtHajjNoticeItem =>
        Boolean(n && typeof n === 'object' && (n as GovtHajjNoticeItem).title && (n as GovtHajjNoticeItem).url)
      )
    : [];
  const validFlightLinks = Array.isArray(rawFlights.links)
    ? rawFlights.links.filter((l: unknown): l is HajjFlightTicketLink =>
        Boolean(l && typeof l === 'object' && (l as HajjFlightTicketLink).airlineName && (l as HajjFlightTicketLink).websiteUrl)
      )
    : [];
  const validQuickLinks = Array.isArray(rawFooter.quickLinks) && rawFooter.quickLinks.length > 0
    ? rawFooter.quickLinks.filter((q: unknown): q is QuickLink =>
        Boolean(q && typeof q === 'object' && (q as QuickLink).label && (q as QuickLink).page)
      )
    : DEFAULT_SITE_SETTINGS.footer.quickLinks;

  return {
    ...DEFAULT_SITE_SETTINGS,
    ...src,
    logoUrl: typeof src.logoUrl === 'string' ? src.logoUrl : DEFAULT_SITE_SETTINGS.logoUrl,
    faviconUrl: typeof src.faviconUrl === 'string' ? src.faviconUrl : DEFAULT_SITE_SETTINGS.faviconUrl,
    siteNameBn: typeof src.siteNameBn === 'string' && src.siteNameBn ? src.siteNameBn : DEFAULT_SITE_SETTINGS.siteNameBn,
    siteNameEn: typeof src.siteNameEn === 'string' && src.siteNameEn ? src.siteNameEn : DEFAULT_SITE_SETTINGS.siteNameEn,
    tagline: typeof src.tagline === 'string' && src.tagline ? src.tagline : DEFAULT_SITE_SETTINGS.tagline,
    domain: typeof src.domain === 'string' && src.domain ? src.domain : DEFAULT_SITE_SETTINGS.domain,
    body: { ...DEFAULT_SITE_SETTINGS.body, ...rawBody },
    footer: {
      ...DEFAULT_SITE_SETTINGS.footer,
      ...rawFooter,
      quickLinks: validQuickLinks
    },
    theme: { ...DEFAULT_SITE_SETTINGS.theme, ...rawTheme },
    typography: { ...DEFAULT_TYPOGRAPHY, ...rawTypography },
    govtHajjNotice: {
      ...DEFAULT_GOVT_HAJJ_NOTICE_CONFIG,
      ...rawGovt,
      notices: validNotices.length > 0 ? validNotices : DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.notices
    },
    hajjFlightTickets: {
      ...DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG,
      ...rawFlights,
      links: validFlightLinks.length > 0 ? validFlightLinks : DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.links
    }
  };
}

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const loaded = load<SiteSettings>('muttaqi_site_settings_v1', DEFAULT_SITE_SETTINGS);
    return normalizeSiteSettings(loaded);
  });
  const [isRefreshingGovtNotices, setIsRefreshingGovtNotices] = useState(false);
  const siteSettingsRef = useRef(siteSettings);
  useEffect(() => {
    siteSettingsRef.current = siteSettings;
  }, [siteSettings]);
  const [ads, setAds] = useState<AdSlot[]>(() => {
    try {
      const raw = window.localStorage.getItem('muttaqi_ads_slots_v1');
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((a): a is AdSlot => Boolean(a && typeof a === 'object' && a.id));
        }
      }
    } catch {}
    return [];
  });
  const [developerCredit, setDeveloperCredit] = useState<DeveloperCredit>(() =>
    load<DeveloperCredit>('muttaqi_developer_credit_v1', {
      name: '',
      photoUrl: '',
      phone: '',
      email: DEVELOPER_EMAIL,
      address: '',
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

    // Apply custom fonts dynamically
    const typo = siteSettings.typography || DEFAULT_TYPOGRAPHY;
    root.style.setProperty('--font-header', typo.headerFont || DEFAULT_TYPOGRAPHY.headerFont);
    root.style.setProperty('--font-body', typo.bodyFont || DEFAULT_TYPOGRAPHY.bodyFont);
    root.style.setProperty('--font-footer', typo.footerFont || DEFAULT_TYPOGRAPHY.footerFont);

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

  const refreshGovtHajjNotices = useCallback(async (customUrl?: string): Promise<GovtHajjFetchResult> => {
    const currentConfig = siteSettingsRef.current.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
    const targetUrl = String(customUrl || currentConfig.portalUrl || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.portalUrl).trim();
    setIsRefreshingGovtNotices(true);
    try {
      const result = await fetchLiveGovtHajjNotices(targetUrl);
      if (result.ok && result.notices.length > 0) {
        let mergedPayload: {
          sourceUrl: string;
          syncedAt: string;
          notices: GovtHajjNoticeItem[];
        } | null = null;

        setSiteSettings((prev) => {
          const prevConfig = prev.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
          const customItems = (prevConfig.notices || []).filter((item) => item.isCustom);
          const customKeys = new Set(customItems.map((c) => `${c.title}::${c.url}`));
          const liveItems = result.notices.filter((n) => !customKeys.has(`${n.title}::${n.url}`));
          const combined = [...customItems, ...liveItems].slice(0, 30);

          mergedPayload = {
            sourceUrl: result.sourceUrl,
            syncedAt: result.syncedAt,
            notices: combined
          };

          const updated: SiteSettings = {
            ...prev,
            govtHajjNotice: {
              ...prevConfig,
              portalUrl: targetUrl,
              lastSyncedAt: result.syncedAt,
              notices: combined
            }
          };
          save('muttaqi_site_settings_v1', updated);
          return updated;
        });

        if (mergedPayload) {
          SupabaseService.saveGovtHajjNoticesCache(mergedPayload).catch(() => {});
        }
      }
      return result;
    } finally {
      setIsRefreshingGovtNotices(false);
    }
  }, []);

  // Load latest site settings and developer credit from Supabase so every browser gets identical data
  useEffect(() => {
    let active = true;
    SupabaseService.fetchSiteSettings().then((remoteSettings) => {
      if (!active || !remoteSettings || typeof remoteSettings !== 'object') return;
      const remoteObj = remoteSettings as Partial<SiteSettings>;
      const remoteGovt = remoteObj.govtHajjNotice;
      const remoteFlights = remoteObj.hajjFlightTickets;
      setSiteSettings((prev) => {
        const merged = normalizeSiteSettings({
          ...prev,
          ...remoteObj,
          body: { ...prev.body, ...(remoteObj.body || {}) },
          footer: { ...prev.footer, ...(remoteObj.footer || {}) },
          theme: { ...prev.theme, ...(remoteObj.theme || {}) },
          typography: { ...DEFAULT_TYPOGRAPHY, ...(prev.typography || {}), ...(remoteObj.typography || {}) },
          govtHajjNotice: {
            ...DEFAULT_GOVT_HAJJ_NOTICE_CONFIG,
            ...(prev.govtHajjNotice || {}),
            ...(remoteGovt || {}),
            notices:
              Array.isArray(remoteGovt?.notices) && remoteGovt.notices.length > 0
                ? remoteGovt.notices
                : prev.govtHajjNotice?.notices || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.notices
          },
          hajjFlightTickets: {
            ...DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG,
            ...(prev.hajjFlightTickets || {}),
            ...(remoteFlights || {}),
            links:
              Array.isArray(remoteFlights?.links) && remoteFlights.links.length > 0
                ? remoteFlights.links
                : prev.hajjFlightTickets?.links || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.links
          }
        });
        save('muttaqi_site_settings_v1', merged);
        return merged;
      });
    }).catch(() => {});

    // Load cached Govt Hajj notices from Supabase; refresh in background if stale
    SupabaseService.fetchGovtHajjNoticesCache()
      .then((cache) => {
        if (!active) return;
        if (cache && Array.isArray(cache.notices) && cache.notices.length > 0) {
          setSiteSettings((prev) => {
            const prevConfig = prev.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
            const customItems = (prevConfig.notices || []).filter((i) => i.isCustom);
            const customKeys = new Set(customItems.map((c) => `${c.title}::${c.url}`));
            const merged = [...customItems, ...cache.notices.filter((n) => !customKeys.has(`${n.title}::${n.url}`))];
            const updated: SiteSettings = {
              ...prev,
              govtHajjNotice: {
                ...prevConfig,
                lastSyncedAt: cache.syncedAt || prevConfig.lastSyncedAt,
                notices: merged
              }
            };
            save('muttaqi_site_settings_v1', updated);
            return updated;
          });
        }

        const cfg = siteSettingsRef.current.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
        if (!cfg.enabled) return;
        const intervalMs = Math.max(5, cfg.autoRefreshMinutes || 15) * 60 * 1000;
        const syncedTime = cache?.syncedAt
          ? new Date(cache.syncedAt).getTime()
          : cfg.lastSyncedAt
            ? new Date(cfg.lastSyncedAt).getTime()
            : 0;
        if (!syncedTime || Date.now() - syncedTime > intervalMs) {
          refreshGovtHajjNotices(cfg.portalUrl).catch(() => {});
        }
      })
      .catch(() => {
        const cfg = siteSettingsRef.current.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
        if (active && cfg.enabled) {
          refreshGovtHajjNotices(cfg.portalUrl).catch(() => {});
        }
      });

    // Fetch developer credit from Supabase cloud
    SupabaseService.fetchDeveloperCredit().then((remoteCredit) => {
      if (!active || !remoteCredit) return;
      setDeveloperCredit((prev) => {
        const merged: DeveloperCredit = {
          ...prev,
          ...(remoteCredit as DeveloperCredit),
          address: (remoteCredit as any).address || prev.address || ''
        };
        save('muttaqi_developer_credit_v1', merged);
        return merged;
      });
    }).catch(() => {});

    // Fetch ads from Supabase cloud so all devices & browsers get developer ad links
    SupabaseService.fetchAdsSlots().then((remoteAds) => {
      if (!active) return;
      if (remoteAds !== null && Array.isArray(remoteAds)) {
        setAds(remoteAds);
        save('muttaqi_ads_slots_v1', remoteAds);
      }
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, [refreshGovtHajjNotices]);

  // Periodic background auto-refresh & visibility check for Government Hajj Notices
  useEffect(() => {
    const cfg = siteSettings.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
    if (!cfg.enabled) return;
    const intervalMs = Math.max(5, cfg.autoRefreshMinutes || 15) * 60 * 1000;
    const checkAndRefresh = () => {
      const latestCfg = siteSettingsRef.current.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
      const syncedTime = latestCfg.lastSyncedAt ? new Date(latestCfg.lastSyncedAt).getTime() : 0;
      if (!syncedTime || Date.now() - syncedTime >= intervalMs) {
        refreshGovtHajjNotices(latestCfg.portalUrl).catch(() => {});
      }
    };
    const timer = window.setInterval(() => {
      refreshGovtHajjNotices(cfg.portalUrl).catch(() => {});
    }, intervalMs);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkAndRefresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    siteSettings.govtHajjNotice?.enabled,
    siteSettings.govtHajjNotice?.autoRefreshMinutes,
    siteSettings.govtHajjNotice?.portalUrl,
    refreshGovtHajjNotices
  ]);

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
  const saveAds = async (next: AdSlot[]): Promise<boolean> => {
    setAds(next);
    save('muttaqi_ads_slots_v1', next);
    try {
      const ok = await SupabaseService.saveAdsSlots(next);
      return ok;
    } catch {
      return false;
    }
  };
  const deleteAd = async (id: string): Promise<boolean> => {
    const next = ads.filter((a) => a.id !== id);
    setAds(next);
    save('muttaqi_ads_slots_v1', next);
    try {
      await SupabaseService.deleteAdSlot(id);
      await SupabaseService.saveAdsSlots(next);
      return true;
    } catch {
      return false;
    }
  };
  const clearAllAds = async (): Promise<boolean> => {
    setAds([]);
    save('muttaqi_ads_slots_v1', []);
    try {
      await SupabaseService.saveAdsSlots([]);
      return true;
    } catch {
      return false;
    }
  };
  const saveDeveloperCredit = async (next: DeveloperCredit): Promise<boolean> => {
    setDeveloperCredit(next);
    save('muttaqi_developer_credit_v1', next);
    try {
      const ok = await SupabaseService.saveDeveloperCredit(next);
      return ok;
    } catch {
      return false;
    }
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
      refreshGovtHajjNotices,
      isRefreshingGovtNotices,
      ads,
      saveAds,
      deleteAd,
      clearAllAds,
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
    [siteSettings, ads, developerCredit, isDeveloper, syncStatus, isRefreshingGovtNotices, refreshGovtHajjNotices]
  );
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export function useSite(): SiteContextType {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used within SiteProvider');
  return ctx;
}
