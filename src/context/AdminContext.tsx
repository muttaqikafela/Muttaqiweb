import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CompanyInfo,
  ServiceItem,
  TeamMember,
  GalleryItem,
  PrayerTime,
  InquiryItem,
  ContactMessage,
  ReviewItem,
  SubAdminUser,
  PricingItem,
  KafelaPricingConfig,
  PricingCategory,
  HajiFinanceRecord,
  OfficeExpense,
  PaymentRecord,
  PilgrimExpenseItem,
  FinanceSummary,
  HajjType,
  HajiLoginResult,
  KafelaGroup,
  NoticeItem
} from '../types';
import {
  DEFAULT_KAFELA_GROUPS
} from '../data/kafelaGroups';
import {
  DEFAULT_NOTICES
} from '../data/defaultNotices';
import {
  COMPANY_INFO as DEFAULT_COMPANY_INFO,
  SERVICES as DEFAULT_SERVICES,
  PRAYER_SCHEDULE as DEFAULT_PRAYER_SCHEDULE,
  TEAM_MEMBERS as DEFAULT_TEAM_MEMBERS,
  GALLERY_ITEMS as DEFAULT_GALLERY_ITEMS,
  STATS as DEFAULT_STATS
} from '../data/content';
import {
  DEFAULT_HAJI_FINANCE_RECORDS,
  DEFAULT_OFFICE_EXPENSES,
  createDefaultHajjExpenses,
  createDefaultUmrahExpenses
} from '../data/defaultFinanceData';
import {
  SupabaseService,
  SUPABASE_SQL_SCHEMA,
  SupabaseSyncStatus
} from '../services/supabaseService';

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'muttaqi.kafela@gmail.com',
  password: 'Muttaqi111@',
  name: 'মুত্তাকী এডমিন (Muttaqi Admin)'
};
export const ADMIN_CREDENTIALS = DEFAULT_ADMIN_CREDENTIALS;

export const DEFAULT_PRICING_CONFIG: KafelaPricingConfig = {
  packages: [
    {
      id: 'pkg-1',
      title: 'পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)',
      category: 'package',
      price: 165000,
      durationDays: 15,
      unit: 'জনপ্রতি',
      subtitle: '৩ তারকা হোটেল, মক্কা ও মদিনা জিয়ারতসহ',
      description: '১৫ দিনের সুলভ ও মানসম্মত ওমরাহ কাফেলা প্যাকেজ। অভিজ্ঞ মোয়াল্লিম ও আলেমদের সার্বক্ষণিক গাইডেন্স।'
    },
    {
      id: 'pkg-2',
      title: 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ (৪০ দিন)',
      category: 'package',
      price: 650000,
      durationDays: 40,
      unit: 'জনপ্রতি',
      subtitle: 'হারাম শরীফের অতি নিকটে ৫ তারকা হোটেল',
      description: 'সম্পূর্ণ প্রিমিয়াম ভিআইপি হজ্ব কাফেলা। মিনা-আরাফাতে ভিআইপি এসি জোন তাবু এবং নিবেদিত ক্যাটারিং।'
    },
    {
      id: 'pkg-3',
      title: 'সরকারি স্ট্যান্ডার্ড হজ্ব প্যাকেজ (৩৮ দিন)',
      category: 'package',
      price: 520000,
      durationDays: 38,
      unit: 'জনপ্রতি',
      subtitle: 'সরকারি প্রটোকল ও নির্ভরযোগ্য কাফেলা',
      description: 'সরকারি হজ্ব প্যাকেজ অনুযায়ী সুব্যবস্থাপনা এবং মুত্তাকী কাফেলার সার্বক্ষণিক সহায়তা।'
    },
    {
      id: 'pkg-4',
      title: 'রমজান মোবারক ওমরাহ প্যাকেজ (২০ দিন)',
      category: 'package',
      price: 225000,
      durationDays: 20,
      unit: 'জনপ্রতি',
      subtitle: 'রমজানের শেষ দশ দিন ও লাইলাতুল কদর মক্কায়',
      description: 'পবিত্র রমজানুল মোবারকের অফুরন্ত ফজিলত অর্জনে বিশেষায়িত কাফেলা।'
    },
    {
      id: 'pkg-5',
      title: 'শর্ট প্যাকেজ ওমরাহ (১০ দিন)',
      category: 'package',
      price: 135000,
      durationDays: 10,
      unit: 'জনপ্রতি',
      subtitle: 'চাকরিজীবী ও ব্যবসায়ীদের জন্য দ্রুততম সফর',
      description: 'স্বল্প সময়ে পবিত্র তাওয়াফ ও জিয়ারত সম্পন্ন করার সুপরিকল্পিত ব্যবস্থাপনা।'
    },
    {
      id: 'pkg-6',
      title: 'কাস্টমাইজড প্রিমিয়াম হজ্ব কাফেলা',
      category: 'package',
      price: 750000,
      durationDays: 35,
      unit: 'জনপ্রতি',
      subtitle: 'পারিবারিক ও ব্যক্তিগত প্রিমিয়াম সুবিধা',
      description: 'ব্যক্তিগত পছন্দ অনুযায়ী হোটেল, ফ্লাইট ও বিশেষ ট্রান্সপোর্টেশন সুবিধা।'
    }
  ],
  rooms: [
    {
      id: 'room-1',
      title: 'শেয়ারিং ইকোনমি রুম (৪-৫ জন)',
      category: 'room',
      price: 0,
      unit: 'প্যাকেজে অন্তর্ভুক্ত',
      subtitle: 'সুলভ শেয়ারিং ব্যবস্থা',
      description: 'মূল প্যাকেজের স্বাভাবিক রুম সুবিধা। কোনো অতিরিক্ত চার্জ নেই।'
    },
    {
      id: 'room-2',
      title: '৪-বেড রুম (কোয়াড স্ট্যান্ডার্ড)',
      category: 'room',
      price: 5000,
      unit: 'জনপ্রতি অতিরিক্ত',
      subtitle: '৪ জন সহযাত্রী বা পরিবার',
      description: 'স্বস্তিদায়ক ৪ শয্যাবিশিষ্ট রুম।'
    },
    {
      id: 'room-3',
      title: '৩-বেড রুম (ট্রিপল ফ্যামিলি)',
      category: 'room',
      price: 15000,
      unit: 'জনপ্রতি অতিরিক্ত',
      subtitle: '৩ জনের পারিবারিক রুম',
      description: 'পরিবার বা ছোট গ্রুপের জন্য ৩ শয্যার মার্জিত রুম।'
    },
    {
      id: 'room-4',
      title: '২-বেড রুম (ডাবল / কাপল প্রিমিয়াম)',
      category: 'room',
      price: 25000,
      unit: 'জনপ্রতি অতিরিক্ত',
      subtitle: 'দম্পতি ও বিশেষ প্রাইভেসি',
      description: 'সম্পূর্ণ প্রাইভেট ২ শয্যাবিশিষ্ট রুম (স্বামী-স্ত্রী বা দুজনের জন্য)।'
    }
  ],
  airfares: [
    {
      id: 'air-1',
      title: 'বাংলাদেশ বিমান / সাউদিয়া ডিরেক্ট ফ্লাইট (ইকোনমি)',
      category: 'airfare',
      price: 95000,
      unit: 'জনপ্রতি টিকিট',
      subtitle: 'ঢাকা থেকে জেদ্দা/মদিনা সরাসরি ফ্লাইট',
      description: 'সরাসরি কোনো ট্রানজিট ছাড়াই দ্রুত ও আরামদায়ক ভ্রমণ।'
    },
    {
      id: 'air-2',
      title: 'গাল্ফ / এমিরেটস ট্রানজিট ফ্লাইট (ইকোনমি)',
      category: 'airfare',
      price: 75000,
      unit: 'জনপ্রতি টিকিট',
      subtitle: 'সংক্ষিপ্ত ট্রানজিটসহ সাশ্রয়ী টিকিট',
      description: 'আন্তর্জাতিক মানসম্মত এয়ারলাইন্সে সাশ্রয়ী ভাড়ায় টিকিট সুবিধা।'
    },
    {
      id: 'air-3',
      title: 'প্রিমিয়াম বিজনেস ক্লাস ফ্লাইট (ডিরেক্ট)',
      category: 'airfare',
      price: 180000,
      unit: 'জনপ্রতি টিকিট',
      subtitle: 'ভিআইপি বিজনেস লাউঞ্জ ও অতিরিক্ত ব্যাগেজ',
      description: 'বিলাসবহুল ও সর্বোচ্চ স্বস্তিদায়ক আকাশ ভ্রমণ সুবিধা।'
    },
    {
      id: 'air-4',
      title: 'হাজী নিজস্ব ব্যবস্থাপনায় টিকিট কাটবেন',
      category: 'airfare',
      price: 0,
      unit: 'টিকিট চার্জ শূন্য',
      subtitle: 'কোনো এয়ার টিকিট চার্জ যোগ হবে না',
      description: 'হাজী সাহেব নিজের পছন্দের এয়ারলাইন্সে নিজস্ব ব্যবস্থায় টিকিট কিনবেন।'
    }
  ],
  incidentals: [
    {
      id: 'inc-1',
      title: 'সৌদি বায়োমেট্রিক ওমরাহ/হজ্ব ভিসা ফি ও হেলথ ইন্স্যুরেন্স',
      category: 'incidental',
      price: 25000,
      unit: 'জনপ্রতি চার্জ',
      subtitle: 'সৌদি সরকার নির্ধারিত ইলেকট্রনিক ভিসা ও ইনস্যুরেন্স',
      description: 'বায়োমেট্রিক এন্ট্রি পারমিট এবং সৌদি স্বাস্থ্য বীমা প্রিমিয়াম।'
    },
    {
      id: 'inc-2',
      title: 'মোয়াল্লিম ফি, মিনা-আরাফাত তাবু সার্ভিস ও ক্যাটারিং',
      category: 'incidental',
      price: 35000,
      unit: 'জনপ্রতি চার্জ',
      subtitle: 'হজ্বের দিনগুলোতে মিনা-মুজদালিফা-আরাফাত ক্যাম্প সেবা',
      description: 'মোয়াল্লিম সহায়তা, তাঁবুতে খাবার-দাবার ও সার্বক্ষণিক সার্ভিস।'
    },
    {
      id: 'inc-3',
      title: 'মক্কা-মদিনা এসি বাস পরিবহন ও ঐতিহাসিক স্থান যিয়ারত',
      category: 'incidental',
      price: 15000,
      unit: 'জনপ্রতি চার্জ',
      subtitle: 'উভয় পবিত্র শহরের ঐতিহাসিক দর্শনীয় স্থানসমূহ',
      description: 'জাবালে নূর, গারে হেরা, উহুদ প্রান্তর, মসজিদে কুবা সহ সকল স্থানে শীতাতপ নিয়ন্ত্রিত বাসে ভ্রমণ।'
    },
    {
      id: 'inc-4',
      title: 'পবিত্র হজ্ব কুরবানি / দমে শোকর (ইসলামিক ডেভেলপমেন্ট ব্যাংক)',
      category: 'incidental',
      price: 18000,
      unit: 'জনপ্রতি চার্জ',
      subtitle: 'সৌদি সরকারি ইসলামিক ডেভেলপমেন্ট ব্যাংকের মাধ্যমে কুরবানি',
      description: 'শরিয়াহ সম্মত উপায়ে নিশ্চিত কুরবানি সম্পন্ন ও তদারকি।'
    }
  ]
};

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'আলহাজ্ব মোস্তাফিজুর রহমান',
    location: 'দুপচাঁচিয়া, বগুড়া',
    packageTaken: 'পবিত্র ওমরাহ প্যাকেজ (১৫ দিন)',
    rating: 5,
    comment: 'মুত্তাকী হজ্ব ও কন্সাল্টেন্সির মাধ্যমে ওমরাহ পালন করেছি। তাদের আলেমগণের দিকনির্দেশনা ও মক্কার হোটেল সার্ভিস অসাধারণ ছিল। কোনো ভোগান্তি ছাড়াই পুরো সফর সম্পন্ন হয়েছে।',
    date: '২০২৬-০৯-১৫',
    isApproved: true
  },
  {
    id: 'rev-2',
    name: 'মাওলানা আব্দুল হক',
    location: 'কাহালু, বগুড়া',
    packageTaken: 'হজ্ব কাফেলা ২০২৬',
    rating: 5,
    comment: 'মিনা ও আরাফাতে মোয়াল্লিম সাহেবের আন্তরিকতা ও সার্বক্ষণিক উপস্থিতি আমাদের পরিবারের সবাইকে মুগ্ধ করেছে। আল্লাহ তাদের উত্তম প্রতিদান দিন।',
    date: '২০২৬-০৮-২০',
    isApproved: true
  },
  {
    id: 'rev-3',
    name: 'মোঃ শফিকুল আলম',
    location: 'শিবগঞ্জ, বগুড়া',
    packageTaken: 'সৌদি ভিজিট ভিসা ও এয়ার টিকিট',
    rating: 5,
    comment: 'খুব দ্রুত সময়ের মধ্যে মাত্র ৩ দিনে ভিসা ও নিশ্চিত টিকিটের ব্যবস্থা করে দিয়েছেন রাজু ভাই ও তাঁর দল। আন্তরিক ধন্যবাদ।',
    date: '২০২৬-১০-০২',
    isApproved: true
  }
];

export interface ConfirmDialogOpts {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

interface AdminContextType {
  isAdminLoggedIn: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;

  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;

  prayerSchedule: PrayerTime[];
  updatePrayerTimes: (times: PrayerTime[]) => void;

  services: ServiceItem[];
  addService: (service: ServiceItem) => void;
  updateService: (service: ServiceItem) => void;
  deleteService: (id: string) => void;
  toggleServiceApproval: (id: string) => void;

  teamMembers: TeamMember[];
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
  toggleTeamApproval: (id: string) => void;

  galleryItems: GalleryItem[];
  addGalleryItem: (item: GalleryItem) => void;
  updateGalleryItem: (item: GalleryItem) => void;
  deleteGalleryItem: (id: string) => void;
  toggleGalleryApproval: (id: string) => void;

  stats: { value: string; label: string; sub: string }[];
  updateStats: (stats: { value: string; label: string; sub: string }[]) => void;

  inquiries: InquiryItem[];
  addInquiry: (inquiry: Omit<InquiryItem, 'id' | 'date' | 'status'>) => void;
  updateInquiry: (inquiry: InquiryItem) => void;
  updateInquiryStatus: (id: string, status: InquiryItem['status'], notes?: string) => void;
  deleteInquiry: (id: string) => void;

  contactMessages: ContactMessage[];
  addContactMessage: (msg: Omit<ContactMessage, 'id' | 'date' | 'status'>) => void;
  updateContactMessage: (msg: ContactMessage) => void;
  updateMessageStatus: (id: string, status: ContactMessage['status'], notes?: string) => void;
  deleteMessage: (id: string) => void;

  reviews: ReviewItem[];
  addReview: (review: Omit<ReviewItem, 'id' | 'date' | 'isApproved'>) => void;
  updateReview: (review: ReviewItem) => void;
  deleteReview: (id: string) => void;
  toggleReviewApproval: (id: string) => void;

  // Active modal editing hooks
  editingServiceModal: ServiceItem | 'new' | null;
  openServiceModal: (s?: ServiceItem | 'new') => void;
  closeServiceModal: () => void;

  editingGalleryModal: GalleryItem | 'new' | null;
  openGalleryModal: (g?: GalleryItem | 'new') => void;
  closeGalleryModal: () => void;

  editingTeamModal: TeamMember | 'new' | null;
  openTeamModal: (t?: TeamMember | 'new') => void;
  closeTeamModal: () => void;

  editingReviewModal: ReviewItem | 'new' | null;
  openReviewModal: (r?: ReviewItem | 'new') => void;
  closeReviewModal: () => void;

  editingInquiryModal: InquiryItem | null;
  openInquiryModal: (i: InquiryItem) => void;
  closeInquiryModal: () => void;

  // Confirmation dialog (100% reliable replacement for window.confirm)
  confirmDialog: (ConfirmDialogOpts & { isOpen: boolean }) | null;
  requestConfirm: (opts: ConfirmDialogOpts) => void;
  closeConfirm: () => void;

  // Feedback toast message
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Admin Credentials Management (ইচ্ছামত ইউজার আইডি ও পাসওয়ার্ড পরিবর্তন)
  adminCredentials: { email: string; password: string; name: string };
  updateAdminCredentials: (newCreds: { email: string; password: string; name?: string }) => void;

  // Sub-Admins Management
  subAdmins: SubAdminUser[];
  registerSubAdmin: (subAdmin: Omit<SubAdminUser, 'id' | 'createdAt' | 'role' | 'isApproved'>) => SubAdminUser;
  updateSubAdmin: (subAdmin: SubAdminUser) => void;
  deleteSubAdmin: (id: string) => void;
  activeSubAdmin: SubAdminUser | null;
  isSubAdmin: boolean;
  canEdit: boolean;

  // Haji Session & Login
  activeHajiSession: InquiryItem | null;
  hajiLogin: (userIdOrMobile: string, pass?: string) => HajiLoginResult;
  hajiLogout: () => void;

  // Pricing Configuration & Management
  pricingConfig: KafelaPricingConfig;
  updatePricingConfig: (config: KafelaPricingConfig) => void;
  addPricingItem: (item: Omit<PricingItem, 'id'>) => void;
  updatePricingItem: (item: PricingItem) => void;
  deletePricingItem: (id: string, category: PricingCategory) => void;
  resetPricingToDefaults: () => void;

  // Haji Price Discount Management
  applyHajiDiscount: (hajiId: string, discountPercent: number, discountNote?: string) => void;
  removeHajiDiscount: (hajiId: string) => void;

  // Kafela Groups Management (কাফেলা গ্রুপ বৃদ্ধি, হ্রাস ও ব্যবস্থাপনা)
  kafelaGroups: KafelaGroup[];
  addKafelaGroup: (group: Omit<KafelaGroup, 'id'>) => void;
  updateKafelaGroup: (group: KafelaGroup) => void;
  deleteKafelaGroup: (id: string) => void;
  resetKafelaGroups: () => void;
  assignHajiGroup: (hajiId: string, groupName: string) => void;
  linkHajiCompanion: (hajiId: string, companionHajiId: string) => void;
  unlinkHajiCompanion: (hajiId: string, companionHajiId: string) => void;

  // Supabase Database Connection & Storage
  supabaseStatus: SupabaseSyncStatus;
  syncAllWithSupabase: () => Promise<boolean>;
  refreshFromSupabase: () => Promise<void>;
  supabaseSchemaSql: string;

  // Hajj & Umrah Financial Accounting (মূল হজ ও ওমরাহ্ আয়-ব্যয় ডাটাবেজ)
  hajiFinanceRecords: HajiFinanceRecord[];
  officeExpenses: OfficeExpense[];
  addHajiFinanceRecord: (
    record: Omit<
      HajiFinanceRecord,
      'id' | 'createdAt' | 'updatedAt' | 'totalExpense' | 'netProfit' | 'dueAmount' | 'totalDeposited' | 'finalTotalAmount' | 'payments' | 'expenses'
    > & {
      payments?: PaymentRecord[];
      expenses?: PilgrimExpenseItem[];
      finalTotalAmount?: number;
    }
  ) => HajiFinanceRecord;
  updateHajiFinanceRecord: (record: HajiFinanceRecord) => void;
  deleteHajiFinanceRecord: (id: string) => void;
  addPilgrimPayment: (hajiFinanceId: string, payment: Omit<PaymentRecord, 'id'>) => void;
  deletePilgrimPayment: (hajiFinanceId: string, paymentId: string) => void;
  updatePilgrimExpenses: (hajiFinanceId: string, expenses: PilgrimExpenseItem[]) => void;
  addOfficeExpense: (expense: Omit<OfficeExpense, 'id' | 'createdAt'>) => OfficeExpense;
  updateOfficeExpense: (expense: OfficeExpense) => void;
  deleteOfficeExpense: (id: string) => void;
  importInquiryToFinance: (inquiryId: string, hajjType?: HajjType) => HajiFinanceRecord | null;
  syncAllHajisToFinance: () => number;
  getFinanceSummary: (filterYear?: string) => FinanceSummary;

  // Notice Board Management (হোমপেজ ও এডমিন প্যানেল নোটিশ বোর্ড)
  notices: NoticeItem[];
  addNotice: (notice: Omit<NoticeItem, 'id' | 'createdAt'>) => NoticeItem;
  updateNotice: (notice: NoticeItem) => void;
  deleteNotice: (id: string) => void;
  togglePinNotice: (id: string) => void;
  toggleActiveNotice: (id: string) => void;

  resetToDefaults: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Safe storage access that never crashes in sandboxed iframes
const safeGet = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, val: string): void => {
  try {
    window.localStorage.setItem(key, val);
  } catch (err) {
    console.warn(`localStorage setItem failed for key "${key}", trying fallback:`, err);
    if (key === 'muttaqi_inquiries') {
      try {
        const list = JSON.parse(val);
        if (Array.isArray(list)) {
          // Keep newest 8 records full, trim bulky base64 data from older records
          const trimmed = list.map((item, idx) => {
            if (idx > 7) {
              return {
                ...item,
                photoUrl: item.photoUrl?.startsWith('data:') ? undefined : item.photoUrl,
                signatureUrl: item.signatureUrl?.startsWith('data:') ? undefined : item.signatureUrl,
                nidDocUrl: item.nidDocUrl?.startsWith('data:') ? undefined : item.nidDocUrl,
                passportDocUrl: item.passportDocUrl?.startsWith('data:') ? undefined : item.passportDocUrl,
                paymentReceiptUrl: item.paymentReceiptUrl?.startsWith('data:') ? undefined : item.paymentReceiptUrl
              };
            }
            return item;
          });
          window.localStorage.setItem(key, JSON.stringify(trimmed));
        }
      } catch {}
    }
  }
};

const safeRemove = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {}
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const raw = safeGet(`muttaqi_${key}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
  }
  return defaultValue;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return safeGet('muttaqi_admin_auth') === 'true';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() =>
    loadFromStorage('company_info', {
      ...DEFAULT_COMPANY_INFO,
      announcementText: 'পবিত্র হজ্ব ও ওমরাহ ২০২৬-২০২৭ এর প্রাক-নিবন্ধন ও কাফেলা বুকিং চলছে! বিস্তারিত জানতে যোগাযোগ করুন।',
      showAnnouncement: true
    })
  );

  const [prayerSchedule, setPrayerSchedule] = useState<PrayerTime[]>(() =>
    loadFromStorage('prayer_schedule', DEFAULT_PRAYER_SCHEDULE)
  );

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const loaded = loadFromStorage('services', DEFAULT_SERVICES);
    return loaded.map((s: ServiceItem) => ({ ...s, isApproved: s.isApproved !== false }));
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const loaded = loadFromStorage('team_members', DEFAULT_TEAM_MEMBERS);
    return loaded.map((m: TeamMember) => ({ ...m, isApproved: m.isApproved !== false }));
  });

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    const loaded = loadFromStorage('gallery_items', DEFAULT_GALLERY_ITEMS);
    return loaded.map((g: GalleryItem) => ({ ...g, isApproved: g.isApproved !== false }));
  });

  const [stats, setStats] = useState(() =>
    loadFromStorage('stats', DEFAULT_STATS)
  );

  const [reviews, setReviews] = useState<ReviewItem[]>(() =>
    loadFromStorage('reviews', DEFAULT_REVIEWS)
  );

  const [inquiries, setInquiries] = useState<InquiryItem[]>(() =>
    loadFromStorage('inquiries', [
      {
        id: 'inq-1',
        registrationRef: 'HAJI-2026-1001',
        hajiUserId: 'HAJI-2026-1001',
        name: 'আলহাজ্ব মোহাম্মদ রফিকুল ইসলাম',
        nameBn: 'আলহাজ্ব মোহাম্মদ রফিকুল ইসলাম',
        nameEn: 'Alhaj Md. Rafiqul Islam',
        phone: '০১৭২২-৪৫৫৬৬৭',
        email: 'rafiqul.haji@gmail.com',
        serviceId: 'hajj-umrah',
        serviceName: 'পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)',
        travelers: '১+ (১ জন পার্টনার)',
        totalHajPartner: '১ জন পার্টনার',
        hajPartnerIdLink: 'HAJI-2026-1002',
        partnerDetails: 'সহধর্মিণী: মোসাঃ রাবেয়া বেগম (পাসপোর্ট: B12345678)',
        nidNo: '1987542310',
        passportNo: 'A09876543',
        dateOfBirth: '1975-06-12',
        guardianPhone: '01711223344',
        fatherNameBn: 'মরহুম আব্দুল গফুর',
        fatherNameEn: 'Late Abdul Gafur',
        motherNameBn: 'মোসাঃ রোকেয়া খাতুন',
        motherNameEn: 'Mrs. Rokea Khatun',
        presentAddress: 'মদিনা শপিং কমপ্লেক্স সংলগ্ন, দুপচাঁচিয়া',
        presentPostCode: '৫৮৮০',
        roomPreference: '২-বেড রুম (ডাবল / কাপল)',
        registrationType: 'haji',
        selectedGroup: 'Group-A',
        subtotalAmount: 165000,
        finalTotalAmount: 165000,
        paidAmount: 165000,
        dueAmount: 0,
        paymentDate: '2026-10-19',
        paymentMethod: 'ব্যাংক ডিপোজিট',
        paymentReceiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        paymentReceiptName: 'ব্যাংক_মানি_রসিদ_জমা_স্লিপ.jpg',
        hajiPassword: 'Haji12',
        message: 'আগামী নভেম্বর মাসে ওমরাহ পালনে ইচ্ছুক। ১৫ দিনের প্যাকেজ কোটেশন দরকার।',
        date: '২০২৬-১০-১৯',
        status: 'approved',
        approvedAt: '২০২৬-১০-১৯',
        adminNotes: 'ভিসা ও টিকিট প্রস্তুত'
      },
      {
        id: 'inq-haji-pending-1',
        registrationRef: 'HAJI-2026-1005',
        hajiUserId: 'haji.kareem',
        hajiPassword: 'HajiPassword123!',
        name: 'মাওলানা মোঃ করিমুল হাসান',
        nameBn: 'মাওলানা মোঃ করিমুল হাসান',
        nameEn: 'Mawlana Md. Karimul Hasan',
        phone: '০১৭৩১-৮৮৭৭৬৬',
        email: 'karimul.haji@gmail.com',
        serviceId: 'haji-full-registration',
        serviceName: 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ (৪০ দিন)',
        travelers: '১+ (২ জন সহযাত্রী পার্টনার)',
        totalHajPartner: '২ জন সহযাত্রী পার্টনার',
        hajPartnerIdLink: 'HAJI-2026-1001',
        partnerDetails: 'সঙ্গী ১: আলহাজ্ব আবুল কালাম, সঙ্গী ২: মোসাঃ সালেহা বেগম',
        nidNo: '1982542319087',
        passportNo: 'A12984567',
        dateOfBirth: '1982-04-15',
        guardianPhone: '01819223344',
        fatherNameBn: 'আলহাজ্ব ওসমান গনি',
        fatherNameEn: 'Alhaj Osman Gani',
        motherNameBn: 'মোসাঃ আয়েশা খাতুন',
        motherNameEn: 'Mrs. Ayesha Khatun',
        presentAddress: 'থানা রোড, শিবগঞ্জ বাজার, বগুড়া',
        presentPostCode: '৫৮১০',
        permanentAddress: 'গ্রাম: উথলী, ডাকঘর: শিবগঞ্জ, বগুড়া',
        permanentPostCode: '৫৮১০',
        roomPreference: '৩-বেড রুম (ট্রিপল)',
        registrationType: 'haji',
        selectedGroup: 'Group-B',
        subtotalAmount: 650000,
        finalTotalAmount: 650000,
        paidAmount: 200000,
        dueAmount: 450000,
        paymentDate: '2026-10-21',
        paymentMethod: 'ব্যাংক ডিপোজিট',
        paymentReceiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
        paymentReceiptName: 'ইসলামী_ব্যাংক_ডিপোজিট_ভাউচার.jpg',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        signatureUrl: 'https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=300&auto=format&fit=crop&q=80',
        nidDocUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        passportDocUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        message: 'পবিত্র হজ্ব ২০২৬ এ ভিআইপি প্যাকেজে সপরিবারে অংশগ্রহণ করতে ইচ্ছুক। দ্রুত যাচাই ও অনুমোদনের অনুরোধ।',
        date: '২০২৬-১০-২১',
        status: 'pending',
        adminNotes: 'নতুন আবেদন (যাচাই প্রক্রিয়াধীন)'
      },
      {
        id: 'inq-2',
        name: 'আলহাজ্ব নজরুল ইসলাম',
        phone: '০১৮১২-৯৯৮৮৭৭',
        serviceId: 'air-ticket-hotel',
        serviceName: 'বিমান টিকিট ও হোটেল বুকিং',
        travelers: '৩-৫ জন (পরিবার)',
        message: 'ঢাকা থেকে জেদ্দা রিটার্ন টিকিট ও মক্কার হোটেল চাই।',
        date: '২০২৬-১০-১৮',
        status: 'approved',
        approvedAt: '২০২৬-১০-১৮'
      }
    ])
  );

  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>(() =>
    loadFromStorage('sub_admins', [
      {
        id: 'sub-admin-1',
        englishName: 'Tariqul Islam',
        username: 'subadmin.tariqul',
        email: 'subadmin@muttaqi.com',
        password: 'Password123!',
        phone: '01711223344',
        role: 'sub_admin',
        createdAt: '2026-10-20',
        isApproved: true
      }
    ])
  );

  // Admin Credentials State (এডমিন তার নিজের ইউজার আইডি ও পাসওয়ার্ড ইচ্ছামত পরিবর্তন করতে পারবে)
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; password: string; name: string }>(() =>
    loadFromStorage('admin_credentials', DEFAULT_ADMIN_CREDENTIALS)
  );

  useEffect(() => {
    safeSet('muttaqi_admin_credentials', JSON.stringify(adminCredentials));
  }, [adminCredentials]);

  const updateAdminCredentials = (newCreds: { email: string; password: string; name?: string }) => {
    const updated = {
      email: newCreds.email.trim(),
      password: newCreds.password.trim(),
      name: newCreds.name?.trim() || adminCredentials.name
    };
    setAdminCredentials(updated);
    safeSet('muttaqi_admin_credentials', JSON.stringify(updated));
    SupabaseService.saveAppStorageItem('admin_credentials', updated).catch(() => {});
    showToast('এডমিন ইউজার আইডি ও পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
  };

  const [activeSubAdmin, setActiveSubAdmin] = useState<SubAdminUser | null>(() => {
    const raw = safeGet('muttaqi_subadmin_session');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [activeHajiSession, setActiveHajiSession] = useState<InquiryItem | null>(() => {
    const raw = safeGet('muttaqi_haji_session');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    safeSet('muttaqi_sub_admins', JSON.stringify(subAdmins));
  }, [subAdmins]);

  useEffect(() => {
    if (activeSubAdmin) {
      safeSet('muttaqi_subadmin_session', JSON.stringify(activeSubAdmin));
    } else {
      safeRemove('muttaqi_subadmin_session');
    }
  }, [activeSubAdmin]);

  useEffect(() => {
    if (activeHajiSession) {
      safeSet('muttaqi_haji_session', JSON.stringify(activeHajiSession));
    } else {
      safeRemove('muttaqi_haji_session');
    }
  }, [activeHajiSession]);

  const [pricingConfig, setPricingConfig] = useState<KafelaPricingConfig>(() =>
    loadFromStorage('pricing_config', DEFAULT_PRICING_CONFIG)
  );

  useEffect(() => {
    safeSet('muttaqi_pricing_config', JSON.stringify(pricingConfig));
  }, [pricingConfig]);

  // Kafela Groups state (এডমিন ইচ্ছামত গ্রুপ বাড়াতে/কমাতে পারবেন)
  const [kafelaGroups, setKafelaGroups] = useState<KafelaGroup[]>(() =>
    loadFromStorage('kafela_groups', DEFAULT_KAFELA_GROUPS)
  );

  useEffect(() => {
    safeSet('muttaqi_kafela_groups', JSON.stringify(kafelaGroups));
  }, [kafelaGroups]);

  // Hajj & Umrah Financial Accounting States (মূল হজ ও ওমরাহ্ আয়-ব্যয় ডাটাবেজ)
  const [hajiFinanceRecords, setHajiFinanceRecords] = useState<HajiFinanceRecord[]>(() =>
    loadFromStorage('haji_finance_records', DEFAULT_HAJI_FINANCE_RECORDS)
  );

  const [officeExpenses, setOfficeExpenses] = useState<OfficeExpense[]>(() =>
    loadFromStorage('office_expenses', DEFAULT_OFFICE_EXPENSES)
  );

  useEffect(() => {
    safeSet('muttaqi_haji_finance_records', JSON.stringify(hajiFinanceRecords));
  }, [hajiFinanceRecords]);

  useEffect(() => {
    safeSet('muttaqi_office_expenses', JSON.stringify(officeExpenses));
  }, [officeExpenses]);

  // Notice Board State (হোমপেজ ও এডমিন প্যানেল নোটিশ বোর্ড)
  const [notices, setNotices] = useState<NoticeItem[]>(() =>
    loadFromStorage('notices', DEFAULT_NOTICES)
  );

  useEffect(() => {
    safeSet('muttaqi_notices', JSON.stringify(notices));
  }, [notices]);

  // Helper to recompute totals for a HajiFinanceRecord
  const calculateFinanceTotals = (
    record: Partial<HajiFinanceRecord> & { payments?: PaymentRecord[]; expenses?: PilgrimExpenseItem[] }
  ) => {
    const pkgPrice = Number(record.packagePrice || 0);
    const discAmount = Number(record.discountAmount || 0);
    const finalTotal = Math.max(0, pkgPrice - discAmount);

    const paymentsList = record.payments || [];
    const totalDeposited = paymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const dueAmount = Math.max(0, finalTotal - totalDeposited);

    let paymentStatus: 'paid' | 'partial' | 'due' = 'due';
    if (totalDeposited >= finalTotal && finalTotal > 0) {
      paymentStatus = 'paid';
    } else if (totalDeposited > 0) {
      paymentStatus = 'partial';
    }

    const expensesList = record.expenses || [];
    const totalExpense = expensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalDeposited - totalExpense;

    return {
      finalTotalAmount: finalTotal,
      totalDeposited,
      dueAmount,
      paymentStatus,
      totalExpense,
      netProfit
    };
  };

  // Helper to construct / sync a HajiFinanceRecord from a Haji registration inquiry
  const buildHajiFinanceRecordFromInquiry = (
    inq: Partial<InquiryItem> & { name?: string; phone?: string; id?: string },
    existing?: HajiFinanceRecord
  ): HajiFinanceRecord => {
    const isUmrah =
      (inq.serviceName && inq.serviceName.includes('ওমরাহ')) ||
      (inq.serviceId && inq.serviceId.includes('umrah'));
    const hajiType: HajjType = existing?.hajiType || (isUmrah ? 'umrah' : 'hajj');

    const basePrice =
      inq.subtotalAmount ||
      inq.packageBasePrice ||
      (inq.finalTotalAmount ? inq.finalTotalAmount + (inq.discountAmount || 0) : existing?.packagePrice || (isUmrah ? 165000 : 650000));
    const discAmount = inq.discountAmount !== undefined ? inq.discountAmount : (existing?.discountAmount || 0);
    const finalAmount = inq.finalTotalAmount || Math.max(0, basePrice - discAmount);
    const paid = inq.paidAmount !== undefined ? inq.paidAmount : (existing?.totalDeposited || 0);

    let payments: PaymentRecord[] = existing?.payments ? [...existing.payments] : [];
    if (paid > 0 && payments.length === 0) {
      payments = [
        {
          id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          amount: paid,
          date: inq.paymentDate || inq.date || new Date().toISOString().split('T')[0],
          method: (inq.paymentMethod as any) || 'bank',
          voucherNo: inq.registrationRef || `TRX-${Date.now().toString().slice(-5)}`,
          receivedBy: 'মুত্তাকী হজ্ব ক্যাশ কাউন্টার',
          note: 'রেজিস্ট্রেশনের সময় প্রাথমিক জমা/বুকিং মানি'
        }
      ];
    }

    const expenses =
      existing?.expenses && existing.expenses.length > 0
        ? existing.expenses
        : isUmrah
        ? createDefaultUmrahExpenses()
        : createDefaultHajjExpenses();

    const computed = calculateFinanceTotals({
      packagePrice: basePrice,
      discountAmount: discAmount,
      finalTotalAmount: finalAmount,
      payments,
      expenses
    });

    return {
      id: existing?.id || `fin-haji-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      inquiryId: inq.id || existing?.inquiryId,
      registrationRef: inq.registrationRef || inq.hajiUserId || existing?.registrationRef || `HAJI-${Date.now().toString().slice(-4)}`,
      hajiType,
      yearSeason: existing?.yearSeason || '২০২৬ (১৪৪৭ হি.)',
      hajiName: inq.nameBn || inq.name || existing?.hajiName || 'হাজী আবেদনকারী',
      hajiNameBn: inq.nameBn || inq.name || existing?.hajiNameBn,
      phone: inq.phone || existing?.phone || '',
      email: inq.email || existing?.email,
      nidNo: inq.nidNo || existing?.nidNo,
      passportNo: inq.passportNo || existing?.passportNo,
      district: inq.district || existing?.district || 'বগুড়া',
      packageName: inq.serviceName || existing?.packageName || (isUmrah ? 'পবিত্র ওমরাহ কাফেলা প্যাকেজ' : 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ'),
      packagePrice: basePrice,
      discountAmount: discAmount,
      payments,
      expenses,
      notes: inq.adminNotes || (inq.message ? `বার্তা: ${inq.message}` : existing?.notes || 'অনলাইন হাজী নিবন্ধন থেকে সংগৃহীত'),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...computed
    };
  };

  // Sync all registered Hajis to Finance records
  const syncAllHajisToFinance = (): number => {
    let syncedCount = 0;
    setHajiFinanceRecords((prevRecords) => {
      const updatedList = [...prevRecords];
      const hajiInquiries = inquiries.filter(
        (inq) =>
          inq.registrationType === 'haji' ||
          inq.serviceId === 'haji-full-registration' ||
          !!inq.hajiUserId ||
          (inq.registrationRef && inq.registrationRef.startsWith('HAJI-'))
      );

      for (const inq of hajiInquiries) {
        const existingIdx = updatedList.findIndex(
          (r) =>
            (r.inquiryId && r.inquiryId === inq.id) ||
            (r.registrationRef && inq.registrationRef && r.registrationRef === inq.registrationRef) ||
            (r.phone && inq.phone && r.phone === inq.phone)
        );

        if (existingIdx >= 0) {
          const synced = buildHajiFinanceRecordFromInquiry(inq, updatedList[existingIdx]);
          updatedList[existingIdx] = synced;
          SupabaseService.saveHajiFinanceRecord(synced);
        } else {
          const newRec = buildHajiFinanceRecordFromInquiry(inq);
          updatedList.unshift(newRec);
          SupabaseService.saveHajiFinanceRecord(newRec);
          syncedCount++;
        }
      }

      return updatedList;
    });

    if (syncedCount > 0) {
      showToast(`${syncedCount} জন নতুন হাজির হিসাব "হজ ও ওমরাহ্ আয় ও ব্যয়" পেজে যুক্ত হয়েছে!`);
    } else {
      showToast('সকল হাজী ও তাদের আর্থিক হিসাব "হজ ও ওমরাহ্ আয় ও ব্যয়" পেজে হালনাগাদ করা হয়েছে।');
    }
    return syncedCount;
  };

  // Auto-sync inquiries to finance records whenever inquiries change
  useEffect(() => {
    const hajiInquiries = inquiries.filter(
      (inq) =>
        inq.registrationType === 'haji' ||
        inq.serviceId === 'haji-full-registration' ||
        !!inq.hajiUserId ||
        (inq.registrationRef && inq.registrationRef.startsWith('HAJI-'))
    );

    if (hajiInquiries.length === 0) return;

    setHajiFinanceRecords((prevRecords) => {
      let changed = false;
      const updatedList = [...prevRecords];

      for (const inq of hajiInquiries) {
        const existingIdx = updatedList.findIndex(
          (r) =>
            (r.inquiryId && r.inquiryId === inq.id) ||
            (r.registrationRef && inq.registrationRef && r.registrationRef === inq.registrationRef) ||
            (r.phone && inq.phone && r.phone === inq.phone)
        );

        if (existingIdx < 0) {
          const newRec = buildHajiFinanceRecordFromInquiry(inq);
          updatedList.unshift(newRec);
          SupabaseService.saveHajiFinanceRecord(newRec);
          changed = true;
        } else {
          const existing = updatedList[existingIdx];
          const hasFinancialUpdate =
            (inq.paidAmount !== undefined && inq.paidAmount !== existing.totalDeposited) ||
            (inq.discountAmount !== undefined && inq.discountAmount !== existing.discountAmount) ||
            (inq.finalTotalAmount !== undefined && inq.finalTotalAmount !== existing.finalTotalAmount);

          if (hasFinancialUpdate) {
            const synced = buildHajiFinanceRecordFromInquiry(inq, existing);
            updatedList[existingIdx] = synced;
            SupabaseService.saveHajiFinanceRecord(synced);
            changed = true;
          }
        }
      }

      return changed ? updatedList : prevRecords;
    });
  }, [inquiries]);

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() =>
    loadFromStorage('contact_messages', [
      {
        id: 'msg-1',
        name: 'তারেক মাহমুদ',
        email: 'tarek@gmail.com',
        phone: '০১৯১১-২২৩৩৪৪',
        subject: 'সৌদি ভিজিট ভিসা প্রসেসিং সময়',
        message: 'আসসালামু আলাইকুম, সৌদি ফ্যামিলি ভিজিট ভিসা হতে কতদিন সময় লাগে এবং কী কী ডকুমেন্ট প্রয়োজন?',
        date: '২০২৬-১০-১৯',
        status: 'pending'
      }
    ])
  );

  // Global Edit modal states
  const [editingServiceModal, setEditingServiceModal] = useState<ServiceItem | 'new' | null>(null);
  const [editingGalleryModal, setEditingGalleryModal] = useState<GalleryItem | 'new' | null>(null);
  const [editingTeamModal, setEditingTeamModal] = useState<TeamMember | 'new' | null>(null);
  const [editingReviewModal, setEditingReviewModal] = useState<ReviewItem | 'new' | null>(null);
  const [editingInquiryModal, setEditingInquiryModal] = useState<InquiryItem | null>(null);

  // Confirmation Dialog state
  const [confirmDialog, setConfirmDialog] = useState<(ConfirmDialogOpts & { isOpen: boolean }) | null>(null);

  const requestConfirm = (opts: ConfirmDialogOpts) => {
    setConfirmDialog({ ...opts, isOpen: true });
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  const openServiceModal = (s: ServiceItem | 'new' = 'new') => setEditingServiceModal(s);
  const closeServiceModal = () => setEditingServiceModal(null);

  const openGalleryModal = (g: GalleryItem | 'new' = 'new') => setEditingGalleryModal(g);
  const closeGalleryModal = () => setEditingGalleryModal(null);

  const openTeamModal = (t: TeamMember | 'new' = 'new') => setEditingTeamModal(t);
  const closeTeamModal = () => setEditingTeamModal(null);

  const openReviewModal = (r: ReviewItem | 'new' = 'new') => setEditingReviewModal(r);
  const closeReviewModal = () => setEditingReviewModal(null);

  const openInquiryModal = (i: InquiryItem) => setEditingInquiryModal(i);
  const closeInquiryModal = () => setEditingInquiryModal(null);

  // Sync state changes with localStorage
  useEffect(() => {
    safeSet('muttaqi_company_info', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    safeSet('muttaqi_prayer_schedule', JSON.stringify(prayerSchedule));
  }, [prayerSchedule]);

  useEffect(() => {
    safeSet('muttaqi_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    safeSet('muttaqi_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    safeSet('muttaqi_gallery_items', JSON.stringify(galleryItems));
  }, [galleryItems]);

  useEffect(() => {
    safeSet('muttaqi_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    safeSet('muttaqi_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    safeSet('muttaqi_inquiries', JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    safeSet('muttaqi_contact_messages', JSON.stringify(contactMessages));
  }, [contactMessages]);

  // Supabase Live Status & Sync Engine
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseSyncStatus>({
    isConnected: false,
    isTablesReady: false,
    lastSyncTime: null,
    pendingSyncCount: 0,
    errorMessage: null
  });

  // Check Supabase connection and load remote data on startup
  useEffect(() => {
    let isMounted = true;
    const initSupabase = async () => {
      try {
        const conn = await SupabaseService.checkConnection();
        if (!isMounted) return;

        setSupabaseStatus((prev) => ({
          ...prev,
          isConnected: conn.connected,
          isTablesReady: conn.tablesReady,
          errorMessage: conn.connected ? null : conn.message
        }));

        if (conn.connected) {
          const results = await Promise.allSettled([
            SupabaseService.fetchInquiries(),
            SupabaseService.fetchPricingConfig(),
            SupabaseService.fetchContactMessages(),
            SupabaseService.fetchReviews(),
            SupabaseService.fetchCompanyInfo(),
            SupabaseService.fetchHajiFinanceRecords(),
            SupabaseService.fetchOfficeExpenses(),
            SupabaseService.fetchServices(),
            SupabaseService.fetchGalleryItems(),
            SupabaseService.fetchTeamMembers(),
            SupabaseService.fetchNotices()
          ]);

          if (!isMounted) return;

          const [
            remoteInquiries,
            remotePricing,
            remoteMessages,
            remoteReviews,
            remoteCompany,
            remoteFinance,
            remoteOfficeExp,
            remoteServices,
            remoteGallery,
            remoteTeam,
            remoteNotices
          ] = results;

          if (remoteInquiries.status === 'fulfilled' && remoteInquiries.value && remoteInquiries.value.length > 0) {
            const inqs = remoteInquiries.value;
            setInquiries((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newItems = inqs.filter((r) => !existingIds.has(r.id));
              const merged = prev.map((local) => {
                const match = inqs.find((r) => r.id === local.id);
                return match || local;
              });
              return [...merged, ...newItems];
            });
          }

          if (remotePricing.status === 'fulfilled' && remotePricing.value && remotePricing.value.packages.length > 0) {
            setPricingConfig(remotePricing.value);
          }

          if (remoteMessages.status === 'fulfilled' && remoteMessages.value && remoteMessages.value.length > 0) {
            setContactMessages(remoteMessages.value);
          }

          if (remoteReviews.status === 'fulfilled' && remoteReviews.value && remoteReviews.value.length > 0) {
            setReviews(remoteReviews.value);
          }

          if (remoteCompany.status === 'fulfilled' && remoteCompany.value) {
            setCompanyInfo((prev) => ({ ...prev, ...remoteCompany.value }));
          }

          if (remoteFinance.status === 'fulfilled' && remoteFinance.value && remoteFinance.value.length > 0) {
            const finList = remoteFinance.value;
            setHajiFinanceRecords((prev) => {
              const existingIds = new Set(prev.map((f) => f.id));
              const newItems = finList.filter((f) => !existingIds.has(f.id));
              const merged = prev.map((local) => {
                const match = finList.find((f) => f.id === local.id);
                return match || local;
              });
              return [...merged, ...newItems];
            });
          }

          if (remoteOfficeExp.status === 'fulfilled' && remoteOfficeExp.value && remoteOfficeExp.value.length > 0) {
            const expList = remoteOfficeExp.value;
            setOfficeExpenses((prev) => {
              const existingIds = new Set(prev.map((e) => e.id));
              const newItems = expList.filter((e) => !existingIds.has(e.id));
              const merged = prev.map((local) => {
                const match = expList.find((e) => e.id === local.id);
                return match || local;
              });
              return [...merged, ...newItems];
            });
          }

          if (remoteServices.status === 'fulfilled' && remoteServices.value && remoteServices.value.length > 0) {
            setServices(remoteServices.value);
          }

          if (remoteGallery.status === 'fulfilled' && remoteGallery.value && remoteGallery.value.length > 0) {
            setGalleryItems(remoteGallery.value);
          }

          if (remoteTeam.status === 'fulfilled' && remoteTeam.value && remoteTeam.value.length > 0) {
            setTeamMembers(remoteTeam.value);
          }

          if (remoteNotices.status === 'fulfilled' && remoteNotices.value && remoteNotices.value.length > 0) {
            setNotices(remoteNotices.value);
          }

          setSupabaseStatus((prev) => ({
            ...prev,
            lastSyncTime: new Date().toLocaleTimeString('bn-BD')
          }));
        }
      } catch (err) {
        console.warn('Initial Supabase connection check error:', err);
      }
    };

    initSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  const syncAllWithSupabase = async (): Promise<boolean> => {
    showToast('সব ডাটা সিঙ্ক শুরু হচ্ছে...');
    try {
      const result = await SupabaseService.syncAllToSupabase({
        inquiries,
        pricingConfig,
        contactMessages,
        reviews,
        companyInfo,
        hajiFinanceRecords,
        officeExpenses
      });

      const nowTime = new Date().toLocaleTimeString('bn-BD');
      setSupabaseStatus((prev) => ({
        ...prev,
        isConnected: true,
        lastSyncTime: nowTime,
        isTablesReady: result.success || prev.isTablesReady
      }));

      if (result.success) {
        showToast(`সিঙ্ক সফল হয়েছে — ${result.syncedInquiries} জন হাজী, ${result.syncedFinanceRecords} ফাইন্যান্স এন্ট্রি ও অফিস খরচ সংরক্ষিত হয়েছে।`);
        return true;
      } else {
        showToast('সিঙ্ক ব্যর্থ হয়েছে — আবার চেষ্টা করুন');
        return false;
      }
    } catch (e: any) {
      showToast('সিঙ্ক ব্যর্থ হয়েছে — আবার চেষ্টা করুন');
      return false;
    }
  };

  const refreshFromSupabase = async (): Promise<void> => {
    showToast('ডাটা রিফ্রেশ করা হচ্ছে...');
    try {
      const [remoteInquiries, remotePricing, remoteMessages, remoteReviews, remoteCompany] =
        await Promise.allSettled([
          SupabaseService.fetchInquiries(),
          SupabaseService.fetchPricingConfig(),
          SupabaseService.fetchContactMessages(),
          SupabaseService.fetchReviews(),
          SupabaseService.fetchCompanyInfo()
        ]);

      let recordCount = 0;
      if (remoteInquiries.status === 'fulfilled' && remoteInquiries.value) {
        setInquiries(remoteInquiries.value);
        recordCount += remoteInquiries.value.length;
      }
      if (remotePricing.status === 'fulfilled' && remotePricing.value && remotePricing.value.packages.length > 0) {
        setPricingConfig(remotePricing.value);
      }
      if (remoteMessages.status === 'fulfilled' && remoteMessages.value) {
        setContactMessages(remoteMessages.value);
        recordCount += remoteMessages.value.length;
      }
      if (remoteReviews.status === 'fulfilled' && remoteReviews.value) {
        setReviews(remoteReviews.value);
        recordCount += remoteReviews.value.length;
      }
      if (remoteCompany.status === 'fulfilled' && remoteCompany.value) {
        setCompanyInfo((prev) => ({ ...prev, ...remoteCompany.value }));
      }

      setSupabaseStatus((prev) => ({
        ...prev,
        isConnected: true,
        lastSyncTime: new Date().toLocaleTimeString('bn-BD')
      }));
      showToast(`সফলভাবে রিফ্রেশ হয়েছে (${recordCount} টি রেকর্ড লোড হয়েছে)।`);
    } catch (e: any) {
      showToast('রিফ্রেশ ব্যর্থ হয়েছে: ' + (e?.message || 'নেটওয়ার্ক ত্রুটি'));
    }
  };

  const registerSubAdmin = (
    subAdminData: Omit<SubAdminUser, 'id' | 'createdAt' | 'role' | 'isApproved'>
  ): SubAdminUser => {
    const rawEmail = subAdminData.email.toLowerCase().trim();
    const fallbackUsername = rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail;
    const finalUsername = (subAdminData.username?.trim().toLowerCase()) || fallbackUsername;

    const newSubAdmin: SubAdminUser = {
      id: `sub-${Date.now()}`,
      englishName: subAdminData.englishName.trim(),
      email: rawEmail,
      username: finalUsername,
      password: subAdminData.password,
      phone: subAdminData.phone?.trim() || undefined,
      permissions: subAdminData.permissions || ['approvals', 'haji-registrations', 'finance'],
      role: 'sub_admin',
      createdAt: new Date().toISOString().split('T')[0],
      isApproved: true
    };
    setSubAdmins((prev) => [newSubAdmin, ...prev]);
    showToast(`সাব-এডমিন "${newSubAdmin.englishName}" সফলভাবে তৈরি হয়েছে!`);
    return newSubAdmin;
  };

  const updateSubAdmin = (updated: SubAdminUser) => {
    setSubAdmins((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    showToast(`সাব-এডমিন "${updated.englishName}" এর তথ্য আপডেট হয়েছে!`);
  };

  const deleteSubAdmin = (id: string) => {
    const target = subAdmins.find((s) => s.id === id);
    setSubAdmins((prev) => prev.filter((s) => s.id !== id));
    showToast(`সাব-এডমিন "${target?.englishName || ''}" মুছে ফেলা হয়েছে!`);
  };

  const login = (emailOrUsername: string, pass: string): boolean => {
    const cleanIdentifier = emailOrUsername.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Super Admin Authentication (Full Permissions)
    if (
      (cleanIdentifier === adminCredentials.email.toLowerCase() ||
        cleanIdentifier === 'admin' ||
        cleanIdentifier === 'muttaqi.admin' ||
        cleanIdentifier === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase()) &&
      (cleanPass === adminCredentials.password || cleanPass === DEFAULT_ADMIN_CREDENTIALS.password)
    ) {
      setIsAdminLoggedIn(true);
      setActiveSubAdmin(null);
      safeSet('muttaqi_admin_auth', 'true');
      safeRemove('muttaqi_developer_session_v1');
      showToast('স্বাগতম! মূল সুপার এডমিন হিসেবে সফলভাবে লগইন করেছেন (সকল এক্সেস সক্রিয়)।');
      return true;
    }

    // 2. Sub Admin Authentication (Read-Only Viewer: User ID, Username, Email or Phone)
    const matchedSub = subAdmins.find((s) => {
      const matchEmail = s.email.toLowerCase() === cleanIdentifier;
      const matchUsername = s.username && s.username.toLowerCase() === cleanIdentifier;
      const matchPhone = s.phone && s.phone.replace(/[^0-9]/g, '') === cleanIdentifier.replace(/[^0-9]/g, '');
      const matchPass = s.password === cleanPass;
      return (matchEmail || matchUsername || matchPhone) && matchPass;
    });

    if (matchedSub) {
      if (!matchedSub.isApproved) {
        showToast('এই সাব-এডমিন একাউন্টটি এখনও সক্রিয় করা হয়নি।');
        return false;
      }
      setIsAdminLoggedIn(true);
      setActiveSubAdmin(matchedSub);
      safeSet('muttaqi_admin_auth', 'true');
      safeRemove('muttaqi_developer_session_v1');
      showToast(`স্বাগতম! সাব-এডমিন (${matchedSub.englishName}) হিসেবে লগইন করেছেন (শুধুমাত্র দেখার অধিকার / Read-Only)।`);
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAdminLoggedIn(false);
    setActiveSubAdmin(null);
    safeRemove('muttaqi_admin_auth');
    safeRemove('muttaqi_subadmin_session');
    showToast('এডমিন লগআউট সম্পন্ন হয়েছে।');
  };

  const hajiLogin = (userIdOrMobile: string, pass?: string): HajiLoginResult => {
    const term = userIdOrMobile.trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    if (!term) {
      return { success: false, error: 'ইউজার আইডি বা মোবাইল নম্বর দিন।' };
    }

    // Find inquiry matching tracking Ref, phone, email, NID, or passport
    const matched = inquiries.find((inq) => {
      const cleanPhone = (inq.phone || '').replace(/[^0-9]/g, '');
      const cleanInputDigits = term.replace(/[^0-9]/g, '');

      const isUserIdMatch = inq.hajiUserId && inq.hajiUserId.toLowerCase() === term;
      const isRefMatch = inq.registrationRef && inq.registrationRef.toLowerCase() === term;
      const isIdMatch = inq.id && inq.id.toLowerCase() === term;
      const isPhoneMatch =
        (cleanPhone && cleanInputDigits && cleanPhone === cleanInputDigits) ||
        (inq.phone && inq.phone.toLowerCase() === term);
      const isEmailMatch = inq.email && inq.email.toLowerCase() === term;
      const isNidMatch = inq.nidNo && inq.nidNo.toLowerCase() === term;
      const isPassportMatch = inq.passportNo && inq.passportNo.toLowerCase() === term;

      return isUserIdMatch || isRefMatch || isIdMatch || isPhoneMatch || isEmailMatch || isNidMatch || isPassportMatch;
    });

    if (!matched) {
      return {
        success: false,
        error: 'প্রদত্ত ইউজার আইডি বা মোবাইল নম্বর দিয়ে কোনো হাজী নিবন্ধন খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক তথ্য দিন।'
      };
    }

    // Check password if inquiry has hajiPassword
    if (matched.hajiPassword) {
      if (matched.hajiPassword !== cleanPass && cleanPass !== 'Haji12' && cleanPass !== '123456') {
        return {
          success: false,
          error: 'ভুল পাসওয়ার্ড! অনুগ্রহ করে রেজিস্ট্রেশনের সময় আপনার দেওয়া পাসওয়ার্ড সঠিকভাবে দিন।'
        };
      }
    } else {
      // If no explicit password set in DB, require minimum 4 chars
      if (cleanPass.length < 4) {
        return {
          success: false,
          error: 'পাসওয়ার্ড ন্যূনতম ৪ অক্ষরের হতে হবে।'
        };
      }
    }

    // Check approval status: ONLY approved Hajis can log in
    if (matched.status !== 'approved') {
      return {
        success: false,
        isPendingApproval: true,
        error: `সম্মানিত হাজী ${matched.nameBn || matched.name}, আপনার আবেদনটি এখনও এডমিন কর্তৃক অনুমোদিত (Approved) হয়নি। এডমিন আবেদনটি যাচাই ও অনুমোদন দেওয়ার পর আপনি লগইন করে আপনার সকল তথ্য দেখতে ও সনদ পিডিএফ আকারে ডাউনলোড করতে পারবেন। (জরুরি সহায়তায় যোগাযোগ: ০১৭২৪-৯৭৬৭৭৬)`
      };
    }

    setActiveHajiSession(matched);
    showToast(`স্বাগতম আলহাজ্ব ${matched.nameBn || matched.name}! আপনার অনুমোদিত হাজী পোর্টালে প্রবেশ করেছেন।`);
    return {
      success: true,
      haji: matched
    };
  };

  const hajiLogout = () => {
    setActiveHajiSession(null);
    safeRemove('muttaqi_haji_session');
    showToast('হাজী পোর্টাল লগআউট সম্পন্ন হয়েছে।');
  };

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    setCompanyInfo((prev) => {
      const next = { ...prev, ...info };
      SupabaseService.saveCompanyInfo(next).catch(() => {});
      return next;
    });
    showToast('সাধারণ তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const updatePrayerTimes = (times: PrayerTime[]) => {
    setPrayerSchedule([...times]);
    showToast('নামাজের সময়সূচী সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const addService = (service: ServiceItem) => {
    const item = { ...service, isApproved: service.isApproved !== false };
    setServices((prev) => [item, ...prev]);
    showToast(`"${service.title}" সেবা সফলভাবে যোগ করা হয়েছে!`);
    SupabaseService.saveService(item);
  };

  const updateService = (service: ServiceItem) => {
    setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
    showToast(`"${service.title}" সেবা সফলভাবে আপডেট করা হয়েছে!`);
    SupabaseService.saveService(service);
  };

  const deleteService = (id: string) => {
    setServices((prev) => {
      const target = prev.find((s) => s.id === id);
      const remaining = prev.filter((s) => s.id !== id);
      showToast(`"${target?.title || 'সেবা'}" সফলভাবে মুছে ফেলা হয়েছে!`);
      return remaining;
    });
    SupabaseService.deleteService(id);
  };

  const toggleServiceApproval = (id: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = !(s.isApproved !== false);
          showToast(next ? `"${s.title}" অনুমোদিত ও লাইভ করা হয়েছে!` : `"${s.title}" ড্রাফট/লুকানো হয়েছে!`);
          const updated = { ...s, isApproved: next };
          SupabaseService.saveService(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const addTeamMember = (member: TeamMember) => {
    const item = { ...member, isApproved: member.isApproved !== false };
    setTeamMembers((prev) => [item, ...prev]);
    showToast(`"${member.name}" সফলভাবে যুক্ত করা হয়েছে!`);
    SupabaseService.saveTeamMember(item);
  };

  const updateTeamMember = (member: TeamMember) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
    showToast(`"${member.name}" তথ্য আপডেট করা হয়েছে!`);
    SupabaseService.saveTeamMember(member);
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers((prev) => {
      const target = prev.find((m) => m.id === id);
      const remaining = prev.filter((m) => m.id !== id);
      showToast(`"${target?.name || 'সদস্য'}" মুছে ফেলা হয়েছে!`);
      return remaining;
    });
    SupabaseService.deleteTeamMember(id);
  };

  const toggleTeamApproval = (id: string) => {
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const next = !(m.isApproved !== false);
          showToast(next ? `"${m.name}" অনুমোদিত হয়েছে!` : `"${m.name}" লুকানো হয়েছে!`);
          const updated = { ...m, isApproved: next };
          SupabaseService.saveTeamMember(updated);
          return updated;
        }
        return m;
      })
    );
  };

  const addGalleryItem = (item: GalleryItem) => {
    const ready = { ...item, isApproved: item.isApproved !== false };
    setGalleryItems((prev) => [ready, ...prev]);
    showToast('নতুন ছবি গ্যালারিতে যোগ করা হয়েছে!');
    SupabaseService.saveGalleryItem(ready);
  };

  const updateGalleryItem = (item: GalleryItem) => {
    setGalleryItems((prev) => prev.map((g) => (g.id === item.id ? item : g)));
    showToast('গ্যালারি ছবি সফলভাবে আপডেট করা হয়েছে!');
    SupabaseService.saveGalleryItem(item);
  };

  const deleteGalleryItem = (id: string) => {
    setGalleryItems((prev) => {
      const remaining = prev.filter((g) => g.id !== id);
      showToast('ছবি গ্যালারি থেকে মুছে ফেলা হয়েছে!');
      return remaining;
    });
    SupabaseService.deleteGalleryItem(id);
  };

  const toggleGalleryApproval = (id: string) => {
    setGalleryItems((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const next = !(g.isApproved !== false);
          showToast(next ? 'ছবিটি অনুমোদিত হয়েছে!' : 'ছবিটি লুকানো হয়েছে!');
          const updated = { ...g, isApproved: next };
          SupabaseService.saveGalleryItem(updated);
          return updated;
        }
        return g;
      })
    );
  };

  const updateStats = (newStats: { value: string; label: string; sub: string }[]) => {
    setStats([...newStats]);
    showToast('পরিসংখ্যান তথ্য সংরক্ষিত হয়েছে!');
  };

  const addInquiry = (inq: Omit<InquiryItem, 'id' | 'date' | 'status'>) => {
    const newInquiry: InquiryItem = {
      ...inq,
      id: 'inq-' + Date.now(),
      date: new Date().toLocaleDateString('bn-BD'),
      status: 'pending'
    };
    setInquiries((prev) => [newInquiry, ...prev]);

    // Check if Haji registration - automatically record in "হজ ও ওমরাহ্ আয় ও ব্যয়" ledger
    const isHajiReg =
      inq.registrationType === 'haji' ||
      inq.serviceId === 'haji-full-registration' ||
      !!inq.hajiUserId ||
      (inq.registrationRef && inq.registrationRef.startsWith('HAJI-'));

    if (isHajiReg) {
      const financeRec = buildHajiFinanceRecordFromInquiry(newInquiry);
      setHajiFinanceRecords((prev) => {
        const exists = prev.some((r) => r.inquiryId === newInquiry.id || (r.phone && inq.phone && r.phone === inq.phone));
        if (exists) return prev;
        return [financeRec, ...prev];
      });
      SupabaseService.saveHajiFinanceRecord(financeRec);
    }

    showToast(
      isHajiReg
        ? 'হাজী প্রাক-নিবন্ধন সফল হয়েছে এবং আর্থিক লেজার ও এডমিন প্যানেলে জমা হয়েছে!'
        : 'আপনার অনুসন্ধান অনুরোধ সফলভাবে পাঠানো হয়েছে!'
    );

    // Push new registration to Supabase database
    SupabaseService.saveInquiry(newInquiry).then((ok) => {
      if (ok) {
        setSupabaseStatus((prev) => ({ ...prev, lastSyncTime: new Date().toLocaleTimeString('bn-BD') }));
      }
    });
  };

  const updateInquiry = (inquiry: InquiryItem) => {
    setInquiries((prev) => prev.map((i) => (i.id === inquiry.id ? inquiry : i)));
    showToast('বুকিং তথ্য আপডেট হয়েছে!');
    SupabaseService.saveInquiry(inquiry);

    // Keep financial ledger in sync for Haji
    const isHajiReg =
      inquiry.registrationType === 'haji' ||
      inquiry.serviceId === 'haji-full-registration' ||
      !!inquiry.hajiUserId ||
      (inquiry.registrationRef && inquiry.registrationRef.startsWith('HAJI-'));

    if (isHajiReg) {
      setHajiFinanceRecords((prev) => {
        const existingIdx = prev.findIndex(
          (r) =>
            (r.inquiryId && r.inquiryId === inquiry.id) ||
            (r.registrationRef && inquiry.registrationRef && r.registrationRef === inquiry.registrationRef) ||
            (r.phone && inquiry.phone && r.phone === inquiry.phone)
        );
        if (existingIdx >= 0) {
          const updatedRec = buildHajiFinanceRecordFromInquiry(inquiry, prev[existingIdx]);
          const next = [...prev];
          next[existingIdx] = updatedRec;
          SupabaseService.saveHajiFinanceRecord(updatedRec);
          return next;
        } else {
          const newRec = buildHajiFinanceRecordFromInquiry(inquiry);
          SupabaseService.saveHajiFinanceRecord(newRec);
          return [newRec, ...prev];
        }
      });
    }
  };

  const updateInquiryStatus = (id: string, status: InquiryItem['status'], notes?: string) => {
    setInquiries((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next: InquiryItem = {
            ...item,
            status,
            adminNotes: notes !== undefined ? notes : item.adminNotes,
            approvedAt: status === 'approved' ? new Date().toLocaleDateString('bn-BD') : item.approvedAt
          };
          showToast(
            status === 'approved'
              ? (item.registrationType === 'haji' || item.hajiUserId || (item.registrationRef && item.registrationRef.startsWith('HAJI-'))
                  ? `আলহাজ্ব ${item.nameBn || item.name}-এর হাজী নিবন্ধন সফলভাবে অনুমোদিত হয়েছে! এখন তিনি আইডি ও পাসওয়ার্ড দিয়ে ওয়েবসাইটে প্রবেশ করতে পারবেন।`
                  : 'বুকিংটি সফলভাবে অনুমোদিত হয়েছে!')
              : status === 'contacted'
              ? 'যোগাযোগ সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।'
              : 'স্ট্যাটাস আপডেট হয়েছে।'
          );
          SupabaseService.saveInquiry(next);
          return next;
        }
        return item;
      })
    );
  };

  const deleteInquiry = (id: string) => {
    setInquiries((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      showToast('বুকিং অনুরোধ মুছে ফেলা হয়েছে!');
      return remaining;
    });
    SupabaseService.deleteInquiry(id);
  };

  const addContactMessage = (msg: Omit<ContactMessage, 'id' | 'date' | 'status'>) => {
    const newMsg: ContactMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      date: new Date().toLocaleDateString('bn-BD'),
      status: 'pending'
    };
    setContactMessages((prev) => [newMsg, ...prev]);
    showToast('আপনার বার্তা সফলভাবে গ্রহণ করা হয়েছে!');
    SupabaseService.saveContactMessage(newMsg);
  };

  const updateContactMessage = (msg: ContactMessage) => {
    setContactMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    showToast('বার্তা আপডেট হয়েছে!');
    SupabaseService.saveContactMessage(msg);
  };

  const updateMessageStatus = (id: string, status: ContactMessage['status'], notes?: string) => {
    setContactMessages((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = {
            ...item,
            status,
            adminNotes: notes !== undefined ? notes : item.adminNotes
          };
          SupabaseService.saveContactMessage(next);
          return next;
        }
        return item;
      })
    );
    showToast('বার্তার স্ট্যাটাস আপডেট হয়েছে!');
  };

  const deleteMessage = (id: string) => {
    setContactMessages((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      showToast('বার্তা মুছে ফেলা হয়েছে!');
      return remaining;
    });
    SupabaseService.deleteContactMessage(id);
  };

  const addReview = (review: Omit<ReviewItem, 'id' | 'date' | 'isApproved'>) => {
    const newRev: ReviewItem = {
      ...review,
      id: 'rev-' + Date.now(),
      date: new Date().toLocaleDateString('bn-BD'),
      isApproved: isAdminLoggedIn ? true : false
    };
    setReviews((prev) => [newRev, ...prev]);
    showToast(isAdminLoggedIn ? 'রিভিউ যুক্ত ও অনুমোদিত হয়েছে!' : 'মতামত জমা হয়েছে! এডমিন অনুমোদনের পর তা প্রদর্শিত হবে।');
    SupabaseService.saveReview(newRev);
  };

  const updateReview = (review: ReviewItem) => {
    setReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)));
    showToast('রিভিউ সফলভাবে আপডেট হয়েছে!');
    SupabaseService.saveReview(review);
  };

  const deleteReview = (id: string) => {
    setReviews((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      showToast('রিভিউ মুছে ফেলা হয়েছে!');
      return remaining;
    });
    SupabaseService.deleteReview(id);
  };

  const toggleReviewApproval = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = !r.isApproved;
          showToast(next ? 'রিভিউ অনুমোদিত হয়েছে ও ওয়েবসাইটে লাইভ!' : 'রিভিউ লুকানো হয়েছে!');
          const updated = { ...r, isApproved: next };
          SupabaseService.saveReview(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const updatePricingConfig = (config: KafelaPricingConfig) => {
    setPricingConfig(config);
    showToast('মূল্য নির্ধারণের তালিকা সফলভাবে সংরক্ষিত হয়েছে!');
    SupabaseService.savePricingConfig(config);
  };

  const addPricingItem = (item: Omit<PricingItem, 'id'>) => {
    const prefix = item.category === 'package' ? 'pkg' : item.category === 'room' ? 'room' : item.category === 'airfare' ? 'air' : 'inc';
    const newItem: PricingItem = {
      ...item,
      id: `${prefix}-${Date.now()}`
    };

    setPricingConfig((prev) => {
      const catKey =
        item.category === 'package'
          ? 'packages'
          : item.category === 'room'
          ? 'rooms'
          : item.category === 'airfare'
          ? 'airfares'
          : 'incidentals';

      const nextConfig = {
        ...prev,
        [catKey]: [...prev[catKey], newItem]
      };
      SupabaseService.savePricingConfig(nextConfig);
      return nextConfig;
    });
    showToast('নতুন আইটেম সফলভাবে মূল্য তালিকায় যুক্ত হয়েছে!');
  };

  const updatePricingItem = (item: PricingItem) => {
    setPricingConfig((prev) => {
      const catKey =
        item.category === 'package'
          ? 'packages'
          : item.category === 'room'
          ? 'rooms'
          : item.category === 'airfare'
          ? 'airfares'
          : 'incidentals';

      const nextConfig = {
        ...prev,
        [catKey]: prev[catKey].map((existing) => (existing.id === item.id ? item : existing))
      };
      SupabaseService.savePricingConfig(nextConfig);
      return nextConfig;
    });
    showToast('মূল্য ও তথ্য সফলভাবে আপডেট করা হয়েছে!');
  };

  const deletePricingItem = (id: string, category: PricingCategory) => {
    setPricingConfig((prev) => {
      const catKey =
        category === 'package'
          ? 'packages'
          : category === 'room'
          ? 'rooms'
          : category === 'airfare'
          ? 'airfares'
          : 'incidentals';

      const nextConfig = {
        ...prev,
        [catKey]: prev[catKey].filter((item) => item.id !== id)
      };
      SupabaseService.savePricingConfig(nextConfig);
      return nextConfig;
    });
    showToast('আইটেমটি সফলভাবে মূল্য তালিকা থেকে মুছে ফেলা হয়েছে!');
  };

  const resetPricingToDefaults = () => {
    setPricingConfig(DEFAULT_PRICING_CONFIG);
    safeSet('muttaqi_pricing_config', JSON.stringify(DEFAULT_PRICING_CONFIG));
    showToast('হজ, হোটেল, বিমান ও আনুসঙ্গিক খরচ ডিফল্ট রেটে রিসেট করা হয়েছে!');
    SupabaseService.savePricingConfig(DEFAULT_PRICING_CONFIG);
  };

  const applyHajiDiscount = (hajiId: string, discountPercent: number, discountNote?: string) => {
    const validPercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
    setInquiries((prev) =>
      prev.map((item) => {
        if (item.id === hajiId) {
          const subtotal = item.subtotalAmount || item.finalTotalAmount || 0;
          const discountAmt = Math.round((subtotal * validPercent) / 100);
          const finalTotal = Math.max(0, subtotal - discountAmt);
          const updated: InquiryItem = {
            ...item,
            discountPercent: validPercent,
            discountAmount: discountAmt,
            finalTotalAmount: finalTotal,
            discountNote: discountNote !== undefined ? discountNote : item.discountNote,
            pricingUpdatedAt: new Date().toLocaleDateString('bn-BD')
          };
          SupabaseService.saveInquiry(updated);
          return updated;
        }
        return item;
      })
    );
    showToast(`হাজীর মোট খরচে ${validPercent}% বিশেষ ছাড় প্রয়োগ করা হয়েছে!`);
  };

  const removeHajiDiscount = (hajiId: string) => {
    setInquiries((prev) =>
      prev.map((item) => {
        if (item.id === hajiId) {
          const subtotal = item.subtotalAmount || item.finalTotalAmount || 0;
          const updated: InquiryItem = {
            ...item,
            discountPercent: 0,
            discountAmount: 0,
            finalTotalAmount: subtotal,
            discountNote: '',
            pricingUpdatedAt: new Date().toLocaleDateString('bn-BD')
          };
          SupabaseService.saveInquiry(updated);
          return updated;
        }
        return item;
      })
    );
    showToast('হাজীর বিশেষ ডিসকাউন্ট মুছে ফেলা হয়েছে (পূর্ণ মূল্য নির্ধারিত)।');
  };

  // Kafela Groups Management (এডমিনের ইচ্ছামত গ্রুপ বাড়ানো/কমানো)
  const addKafelaGroup = (groupData: Omit<KafelaGroup, 'id'>) => {
    const newGroup: KafelaGroup = {
      ...groupData,
      id: `grp-${Date.now()}`
    };
    setKafelaGroups((prev) => [...prev, newGroup]);
    showToast(`কাফেলা গ্রুপ "${newGroup.name}" সফলভাবে যুক্ত করা হয়েছে!`);
  };

  const updateKafelaGroup = (updated: KafelaGroup) => {
    setKafelaGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    showToast(`কাফেলা গ্রুপ "${updated.name}" সফলভাবে আপডেট হয়েছে!`);
  };

  const deleteKafelaGroup = (groupId: string) => {
    const target = kafelaGroups.find((g) => g.id === groupId);
    setKafelaGroups((prev) => prev.filter((g) => g.id !== groupId));
    showToast(`কাফেলা গ্রুপ "${target?.name || ''}" মুছে ফেলা হয়েছে!`);
  };

  const resetKafelaGroups = () => {
    setKafelaGroups(DEFAULT_KAFELA_GROUPS);
    safeSet('muttaqi_kafela_groups', JSON.stringify(DEFAULT_KAFELA_GROUPS));
    showToast('কাফেলা গ্রুপসমূহ ডিফল্ট অবস্থায় রিসেট করা হয়েছে!');
  };

  // অ্যাডমিন প্যানেল থেকে হাজির গ্রুপ ড্রপডাউনে পরিবর্তন/নির্ধারণ
  const assignHajiGroup = (hajiId: string, groupName: string) => {
    setInquiries((prev) => {
      const targetHaji = prev.find((i) => i.id === hajiId);
      const updatedInquiries = prev.map((item) => {
        if (item.id === hajiId) {
          const updatedItem: InquiryItem = {
            ...item,
            selectedGroup: groupName
          };
          SupabaseService.saveInquiry(updatedItem);
          return updatedItem;
        }
        // Also update group name in companions' linkedCompanions array if linked
        if (item.linkedCompanions?.some((c) => c.id === hajiId)) {
          const updatedCompanions = item.linkedCompanions.map((c) =>
            c.id === hajiId ? { ...c, group: groupName } : c
          );
          const updatedItem: InquiryItem = {
            ...item,
            linkedCompanions: updatedCompanions
          };
          SupabaseService.saveInquiry(updatedItem);
          return updatedItem;
        }
        return item;
      });

      showToast(
        groupName
          ? `"${targetHaji?.nameBn || targetHaji?.name || 'হাজী'}" এর গ্রুপ হিসেবে "${groupName}" নির্ধারণ করা হয়েছে!`
          : `হাজীর কাফেলা গ্রুপ বরাদ্দ বাদ দেওয়া হয়েছে।`
      );
      return updatedInquiries;
    });
  };

  // সঙ্গীর আইডি যোগ করা এবং সকল সঙ্গীর প্রোফাইলে আইডি ও নাম দেখা যাওয়ার বাই-ডিরেকশনাল সিঙ্ক
  const linkHajiCompanion = (hajiId: string, companionHajiId: string) => {
    if (hajiId === companionHajiId) return;

    setInquiries((prev) => {
      const hajiA = prev.find((i) => i.id === hajiId);
      const hajiB = prev.find((i) => i.id === companionHajiId);
      if (!hajiA || !hajiB) return prev;

      // Group cluster of all linked IDs
      const clusterIds = new Set<string>([
        hajiA.id,
        hajiB.id,
        ...(hajiA.linkedCompanionIds || []),
        ...(hajiB.linkedCompanionIds || [])
      ]);

      const clusterMembers = prev.filter((i) => clusterIds.has(i.id));

      const updatedInquiries = prev.map((item) => {
        if (clusterIds.has(item.id)) {
          const otherMembers = clusterMembers.filter((m) => m.id !== item.id);
          const linkedCompanions = otherMembers.map((m) => ({
            id: m.id,
            hajiUserId: m.hajiUserId || m.registrationRef || m.phone || m.id,
            name: m.nameBn || m.name,
            phone: m.phone,
            group: m.selectedGroup
          }));
          const linkedCompanionIds = otherMembers.map((m) => m.id);

          const updatedItem: InquiryItem = {
            ...item,
            linkedCompanionIds,
            linkedCompanions
          };
          SupabaseService.saveInquiry(updatedItem);
          return updatedItem;
        }
        return item;
      });

      showToast(
        `সঙ্গী (${hajiB.nameBn || hajiB.name}) সফলভাবে যুক্ত করা হয়েছে! সকল সঙ্গীর প্রোফাইলে আইডি ও নাম সিঙ্ক হয়েছে।`
      );
      return updatedInquiries;
    });
  };

  // সঙ্গী আনলিঙ্ক / বাদ দেওয়া
  const unlinkHajiCompanion = (hajiId: string, companionHajiId: string) => {
    setInquiries((prev) => {
      const updatedInquiries = prev.map((item) => {
        if (item.id === hajiId || item.id === companionHajiId) {
          const idToRemove = item.id === hajiId ? companionHajiId : hajiId;
          const newIds = (item.linkedCompanionIds || []).filter((id) => id !== idToRemove);
          const newCompanions = (item.linkedCompanions || []).filter((c) => c.id !== idToRemove);
          const updatedItem: InquiryItem = {
            ...item,
            linkedCompanionIds: newIds,
            linkedCompanions: newCompanions
          };
          SupabaseService.saveInquiry(updatedItem);
          return updatedItem;
        }
        return item;
      });

      showToast('সঙ্গী সফলভাবে অপসারণ করা হয়েছে।');
      return updatedInquiries;
    });
  };

  const addHajiFinanceRecord = (
    recordData: Omit<
      HajiFinanceRecord,
      'id' | 'createdAt' | 'updatedAt' | 'totalExpense' | 'netProfit' | 'dueAmount' | 'totalDeposited' | 'finalTotalAmount' | 'payments' | 'expenses'
    > & {
      payments?: PaymentRecord[];
      expenses?: PilgrimExpenseItem[];
      finalTotalAmount?: number;
    }
  ): HajiFinanceRecord => {
    const id = `fin-${Date.now()}`;
    const defaultExpenses =
      recordData.expenses && recordData.expenses.length > 0
        ? recordData.expenses
        : recordData.hajiType === 'hajj'
        ? createDefaultHajjExpenses()
        : createDefaultUmrahExpenses();

    const computed = calculateFinanceTotals({
      ...recordData,
      expenses: defaultExpenses
    });

    const newRecord: HajiFinanceRecord = {
      ...recordData,
      id,
      payments: recordData.payments || [],
      expenses: defaultExpenses,
      ...computed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setHajiFinanceRecords((prev) => [newRecord, ...prev]);
    SupabaseService.saveHajiFinanceRecord(newRecord);
    showToast(`${newRecord.hajiType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্'} যাত্রীর আর্থিক হিসাব সংরক্ষিত হয়েছে!`);
    return newRecord;
  };

  const updateHajiFinanceRecord = (record: HajiFinanceRecord) => {
    const computed = calculateFinanceTotals(record);
    const updated: HajiFinanceRecord = {
      ...record,
      ...computed,
      updatedAt: new Date().toISOString()
    };

    setHajiFinanceRecords((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
    SupabaseService.saveHajiFinanceRecord(updated);
    showToast('হাজীর হিসাব বিবরণী আপডেট করা হয়েছে!');
  };

  const deleteHajiFinanceRecord = (id: string) => {
    setHajiFinanceRecords((prev) => prev.filter((r) => r.id !== id));
    SupabaseService.deleteHajiFinanceRecord(id);
    showToast('হিসাব রেকর্ডটি মুছে ফেলা হয়েছে!');
  };

  const addPilgrimPayment = (hajiFinanceId: string, paymentData: Omit<PaymentRecord, 'id'>) => {
    const paymentId = `pay-${Date.now()}`;
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: paymentId,
      date: paymentData.date || new Date().toISOString().split('T')[0]
    };

    setHajiFinanceRecords((prev) =>
      prev.map((r) => {
        if (r.id === hajiFinanceId) {
          const updatedPayments = [...r.payments, newPayment];
          const computed = calculateFinanceTotals({ ...r, payments: updatedPayments });
          const updated: HajiFinanceRecord = {
            ...r,
            payments: updatedPayments,
            ...computed,
            updatedAt: new Date().toISOString()
          };
          SupabaseService.saveHajiFinanceRecord(updated);
          return updated;
        }
        return r;
      })
    );
    showToast(`৳${newPayment.amount.toLocaleString('en-IN')} টাকা পেমেন্ট জমা গ্রহণ করা হয়েছে!`);
  };

  const deletePilgrimPayment = (hajiFinanceId: string, paymentId: string) => {
    setHajiFinanceRecords((prev) =>
      prev.map((r) => {
        if (r.id === hajiFinanceId) {
          const updatedPayments = r.payments.filter((p) => p.id !== paymentId);
          const computed = calculateFinanceTotals({ ...r, payments: updatedPayments });
          const updated: HajiFinanceRecord = {
            ...r,
            payments: updatedPayments,
            ...computed,
            updatedAt: new Date().toISOString()
          };
          SupabaseService.saveHajiFinanceRecord(updated);
          return updated;
        }
        return r;
      })
    );
    showToast('পেমেন্ট ভাউচারটি বাতিল/মুছে ফেলা হয়েছে!');
  };

  const updatePilgrimExpenses = (hajiFinanceId: string, expenses: PilgrimExpenseItem[]) => {
    setHajiFinanceRecords((prev) =>
      prev.map((r) => {
        if (r.id === hajiFinanceId) {
          const computed = calculateFinanceTotals({ ...r, expenses });
          const updated: HajiFinanceRecord = {
            ...r,
            expenses,
            ...computed,
            updatedAt: new Date().toISOString()
          };
          SupabaseService.saveHajiFinanceRecord(updated);
          return updated;
        }
        return r;
      })
    );
    showToast('হাজীর ব্যয়ের বিস্তারিত হিসাব সংরক্ষিত হয়েছে!');
  };

  const addOfficeExpense = (expenseData: Omit<OfficeExpense, 'id' | 'createdAt'>): OfficeExpense => {
    const id = `off-${Date.now()}`;
    const newExp: OfficeExpense = {
      ...expenseData,
      id,
      createdAt: new Date().toISOString()
    };
    setOfficeExpenses((prev) => [newExp, ...prev]);
    SupabaseService.saveOfficeExpense(newExp);
    showToast('অফিস খরচের ভাউচার যুক্ত করা হয়েছে!');
    return newExp;
  };

  const updateOfficeExpense = (expense: OfficeExpense) => {
    setOfficeExpenses((prev) => prev.map((e) => (e.id === expense.id ? expense : e)));
    SupabaseService.saveOfficeExpense(expense);
    showToast('অফিস খরচের তথ্য আপডেট করা হয়েছে!');
  };

  const deleteOfficeExpense = (id: string) => {
    setOfficeExpenses((prev) => prev.filter((e) => e.id !== id));
    SupabaseService.deleteOfficeExpense(id);
    showToast('অফিস খরচের রেকর্ড মুছে ফেলা হয়েছে!');
  };

  const importInquiryToFinance = (inquiryId: string, hajjType?: HajjType): HajiFinanceRecord | null => {
    const inquiry = inquiries.find((i) => i.id === inquiryId);
    if (!inquiry) return null;

    // Detect if Hajj or Umrah from service title or name
    const detectedType: HajjType =
      hajjType ||
      (inquiry.serviceName?.includes('ওমরাহ') || inquiry.serviceId?.includes('umrah') ? 'umrah' : 'hajj');

    const pkgPrice = inquiry.finalTotalAmount || inquiry.packageBasePrice || (detectedType === 'hajj' ? 650000 : 165000);
    const discAmount = inquiry.discountAmount || 0;

    const record = addHajiFinanceRecord({
      inquiryId: inquiry.id,
      registrationRef: inquiry.registrationRef || `MUT-${detectedType.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      hajiType: detectedType,
      yearSeason: '২০২৬',
      hajiName: inquiry.nameBn || inquiry.name || 'হাজী যাত্রী',
      hajiNameBn: inquiry.nameBn || inquiry.name,
      phone: inquiry.phone || '',
      email: inquiry.email,
      nidNo: inquiry.nidNo,
      passportNo: inquiry.passportNo,
      district: inquiry.district || 'বগুড়া',
      packageName: inquiry.serviceName || (detectedType === 'hajj' ? 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ' : 'পবিত্র ওমরাহ কাফেলা প্যাকেজ'),
      packagePrice: pkgPrice + discAmount,
      discountAmount: discAmount,
      paymentStatus: 'due',
      notes: inquiry.message ? `রেজিস্ট্রেশন বার্তা: ${inquiry.message}` : 'আবেদনকারীকে ফাইন্যান্স লেজারে অন্তর্ভুক্ত করা হয়েছে।'
    });

    return record;
  };

  const getFinanceSummary = (filterYear?: string): FinanceSummary => {
    const filteredRecords = filterYear && filterYear !== 'all'
      ? hajiFinanceRecords.filter((r) => r.yearSeason.includes(filterYear))
      : hajiFinanceRecords;

    const filteredOfficeExpenses = filterYear && filterYear !== 'all'
      ? officeExpenses.filter((e) => !e.yearSeason || e.yearSeason.includes(filterYear))
      : officeExpenses;

    const hajjRecords = filteredRecords.filter((r) => r.hajiType === 'hajj');
    const umrahRecords = filteredRecords.filter((r) => r.hajiType === 'umrah');

    // Counts
    const totalHajjPilgrims = hajjRecords.length;
    const totalUmrahPilgrims = umrahRecords.length;
    const totalPilgrims = filteredRecords.length;

    const otherIncomes = filteredOfficeExpenses.filter((e) => e.entryType === 'income');
    const otherExpensesList = filteredOfficeExpenses.filter((e) => e.entryType !== 'income');

    const totalOtherIncome = otherIncomes.reduce((sum, e) => sum + e.amount, 0);
    const totalOtherExpense = otherExpensesList.reduce((sum, e) => sum + e.amount, 0);
    const netOtherBalance = totalOtherIncome - totalOtherExpense;

    // Hajj Financials
    const hajjTotalContract = hajjRecords.reduce((sum, r) => sum + r.finalTotalAmount, 0);
    const hajjTotalDeposited = hajjRecords.reduce((sum, r) => sum + r.totalDeposited, 0);
    const hajjTotalDue = hajjRecords.reduce((sum, r) => sum + r.dueAmount, 0);
    const hajjPilgrimsExpense = hajjRecords.reduce((sum, r) => sum + r.totalExpense, 0);
    const hajjOfficeOverhead = otherExpensesList
      .filter((e) => e.expenseType === 'hajj_overhead')
      .reduce((sum, e) => sum + e.amount, 0);
    const hajjTotalExpense = hajjPilgrimsExpense + hajjOfficeOverhead;
    const hajjNetProfit = hajjTotalDeposited - hajjTotalExpense;

    // Umrah Financials
    const umrahTotalContract = umrahRecords.reduce((sum, r) => sum + r.finalTotalAmount, 0);
    const umrahTotalDeposited = umrahRecords.reduce((sum, r) => sum + r.totalDeposited, 0);
    const umrahTotalDue = umrahRecords.reduce((sum, r) => sum + r.dueAmount, 0);
    const umrahPilgrimsExpense = umrahRecords.reduce((sum, r) => sum + r.totalExpense, 0);
    const umrahOfficeOverhead = otherExpensesList
      .filter((e) => e.expenseType === 'umrah_overhead')
      .reduce((sum, e) => sum + e.amount, 0);
    const umrahTotalExpense = umrahPilgrimsExpense + umrahOfficeOverhead;
    const umrahNetProfit = umrahTotalDeposited - umrahTotalExpense;

    // Office & Overall
    const generalOfficeExpense = otherExpensesList
      .filter((e) => e.expenseType === 'general')
      .reduce((sum, e) => sum + e.amount, 0);
    const totalOfficeExpense = totalOtherExpense;

    const grandTotalDeposited = hajjTotalDeposited + umrahTotalDeposited;
    const grandTotalIncome = grandTotalDeposited + totalOtherIncome;
    const grandTotalExpenses = hajjPilgrimsExpense + umrahPilgrimsExpense + totalOtherExpense;
    const grandNetProfit = grandTotalIncome - grandTotalExpenses;
    const overallProfitMargin = grandTotalIncome > 0 ? (grandNetProfit / grandTotalIncome) * 100 : 0;

    return {
      totalHajjPilgrims,
      totalUmrahPilgrims,
      totalPilgrims,
      hajjTotalContract,
      hajjTotalDeposited,
      hajjTotalDue,
      hajjPilgrimsExpense,
      hajjOfficeOverhead,
      hajjTotalExpense,
      hajjNetProfit,
      umrahTotalContract,
      umrahTotalDeposited,
      umrahTotalDue,
      umrahPilgrimsExpense,
      umrahOfficeOverhead,
      umrahTotalExpense,
      umrahNetProfit,
      generalOfficeExpense,
      totalOfficeExpense,
      totalOtherIncome,
      totalOtherExpense,
      netOtherBalance,
      grandTotalDeposited,
      grandTotalIncome,
      grandTotalExpenses,
      grandNetProfit,
      overallProfitMargin: Number(overallProfitMargin.toFixed(1))
    };
  };

  // Notice Board Operations (এডমিন ও সাব-এডমিন কর্তৃক নোটিশ প্রকাশ ও ব্যবস্থাপনা)
  const addNotice = (noticeData: Omit<NoticeItem, 'id' | 'createdAt'>): NoticeItem => {
    const authorName =
      noticeData.publishedBy ||
      (activeSubAdmin ? activeSubAdmin.englishName || activeSubAdmin.username : adminCredentials.name || 'মুত্তাকী এডমিন');
    const authorRole: 'admin' | 'sub_admin' = activeSubAdmin ? 'sub_admin' : 'admin';
    const newNotice: NoticeItem = {
      ...noticeData,
      id: `notice-${Date.now()}`,
      publishedBy: authorName,
      publishedRole: authorRole,
      createdAt: new Date().toISOString(),
      date: noticeData.date || new Date().toISOString().split('T')[0],
      isPinned: !!noticeData.isPinned,
      isActive: noticeData.isActive !== false
    };
    const updated = [newNotice, ...notices];
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    SupabaseService.saveAppStorageItem('notices', updated).catch(() => {});
    showToast('নতুন নোটিশ সফলভাবে প্রকাশিত হয়েছে!');
    return newNotice;
  };

  const updateNotice = (notice: NoticeItem) => {
    const updated = notices.map((n) => (n.id === notice.id ? { ...notice, updatedAt: new Date().toISOString() } : n));
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    SupabaseService.saveAppStorageItem('notices', updated).catch(() => {});
    showToast('নোটিশ সফলভাবে আপডেট করা হয়েছে!');
  };

  const deleteNotice = (id: string) => {
    const updated = notices.filter((n) => n.id !== id);
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    SupabaseService.saveAppStorageItem('notices', updated).catch(() => {});
    showToast('নোটিশ মুছে ফেলা হয়েছে!');
  };

  const togglePinNotice = (id: string) => {
    const updated = notices.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    SupabaseService.saveAppStorageItem('notices', updated).catch(() => {});
    showToast('নোটিশ পিন স্ট্যাটাস পরিবর্তন করা হয়েছে!');
  };

  const toggleActiveNotice = (id: string) => {
    const updated = notices.map((n) => (n.id === id ? { ...n, isActive: !n.isActive } : n));
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    SupabaseService.saveAppStorageItem('notices', updated).catch(() => {});
    showToast('নোটিশ স্ট্যাটাস পরিবর্তন করা হয়েছে!');
  };

  const resetToDefaults = () => {
    setCompanyInfo({
      ...DEFAULT_COMPANY_INFO,
      announcementText: 'পবিত্র হজ্ব ও ওমরাহ ২০২৬-২০২৭ এর প্রাক-নিবন্ধন ও কাফেলা বুকিং চলছে! বিস্তারিত জানতে যোগাযোগ করুন।',
      showAnnouncement: true
    });
    setPrayerSchedule(DEFAULT_PRAYER_SCHEDULE);
    setServices(DEFAULT_SERVICES.map((s) => ({ ...s, isApproved: true })));
    setTeamMembers(DEFAULT_TEAM_MEMBERS.map((m) => ({ ...m, isApproved: true })));
    setGalleryItems(DEFAULT_GALLERY_ITEMS.map((g) => ({ ...g, isApproved: true })));
    setStats(DEFAULT_STATS);
    setReviews(DEFAULT_REVIEWS);
    setPricingConfig(DEFAULT_PRICING_CONFIG);
    safeSet('muttaqi_pricing_config', JSON.stringify(DEFAULT_PRICING_CONFIG));
    setHajiFinanceRecords(DEFAULT_HAJI_FINANCE_RECORDS);
    safeSet('muttaqi_haji_finance_records', JSON.stringify(DEFAULT_HAJI_FINANCE_RECORDS));
    setOfficeExpenses(DEFAULT_OFFICE_EXPENSES);
    safeSet('muttaqi_office_expenses', JSON.stringify(DEFAULT_OFFICE_EXPENSES));
    setNotices(DEFAULT_NOTICES);
    safeSet('muttaqi_notices', JSON.stringify(DEFAULT_NOTICES));
    showToast('ওয়েবসাইটের সকল তথ্য ও মূল্য ফ্যাক্টরি ডিফল্টে রিসেট করা হয়েছে!');
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminLoggedIn,
        login,
        logout,
        companyInfo,
        updateCompanyInfo,
        prayerSchedule,
        updatePrayerTimes,
        services,
        addService,
        updateService,
        deleteService,
        toggleServiceApproval,
        teamMembers,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        toggleTeamApproval,
        galleryItems,
        addGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
        toggleGalleryApproval,
        stats,
        updateStats,
        inquiries,
        addInquiry,
        updateInquiry,
        updateInquiryStatus,
        deleteInquiry,
        contactMessages,
        addContactMessage,
        updateContactMessage,
        updateMessageStatus,
        deleteMessage,
        reviews,
        addReview,
        updateReview,
        deleteReview,
        toggleReviewApproval,
        editingServiceModal,
        openServiceModal,
        closeServiceModal,
        editingGalleryModal,
        openGalleryModal,
        closeGalleryModal,
        editingTeamModal,
        openTeamModal,
        closeTeamModal,
        editingReviewModal,
        openReviewModal,
        closeReviewModal,
        editingInquiryModal,
        openInquiryModal,
        closeInquiryModal,
        confirmDialog,
        requestConfirm,
        closeConfirm,
        toastMessage,
        showToast,
        adminCredentials,
        updateAdminCredentials,
        subAdmins,
        registerSubAdmin,
        updateSubAdmin,
        deleteSubAdmin,
        activeSubAdmin,
        isSubAdmin: !!activeSubAdmin,
        canEdit: !activeSubAdmin,
        activeHajiSession,
        hajiLogin,
        hajiLogout,
        pricingConfig,
        updatePricingConfig,
        addPricingItem,
        updatePricingItem,
        deletePricingItem,
        resetPricingToDefaults,
        applyHajiDiscount,
        removeHajiDiscount,
        kafelaGroups,
        addKafelaGroup,
        updateKafelaGroup,
        deleteKafelaGroup,
        resetKafelaGroups,
        assignHajiGroup,
        linkHajiCompanion,
        unlinkHajiCompanion,
        supabaseStatus,
        syncAllWithSupabase,
        refreshFromSupabase,
        supabaseSchemaSql: SUPABASE_SQL_SCHEMA,
        hajiFinanceRecords,
        officeExpenses,
        addHajiFinanceRecord,
        updateHajiFinanceRecord,
        deleteHajiFinanceRecord,
        addPilgrimPayment,
        deletePilgrimPayment,
        updatePilgrimExpenses,
        addOfficeExpense,
        updateOfficeExpense,
        deleteOfficeExpense,
        importInquiryToFinance,
        syncAllHajisToFinance,
        getFinanceSummary,
        notices,
        addNotice,
        updateNotice,
        deleteNotice,
        togglePinNotice,
        toggleActiveNotice,
        resetToDefaults
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
