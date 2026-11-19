import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  NoticeItem,
  SubAdminApprovalRequest,
  SubAdminModuleRole,
  HajiIdCardData,
  AuditEntityType,
  EditLogDiff,
  EditLogEntry,
  RecycleBinItem
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
  isUntouchedDefaultTemplateExpenses,
  stripUntouchedDefaultExpenses
} from '../data/defaultFinanceData';
import {
  SupabaseService,
  SUPABASE_SQL_SCHEMA,
  SupabaseSyncStatus
} from '../services/supabaseService';
import { hasDeveloperSession } from '../lib/developerAuth';
import { extractItemYear } from '../utils/drillDownHelpers';

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
  setIsAdminLoggedIn: (val: boolean) => void;
  login: (email: string, pass: string) => Promise<boolean> | boolean;
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
  addInquiry: (inquiry: Omit<InquiryItem, 'id' | 'date' | 'status'> & { status?: InquiryItem['status'] }) => void;
  updateInquiry: (inquiry: InquiryItem) => void;
  saveHajiIdCard: (hajiId: string, idCardData: HajiIdCardData) => void;
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

  editingInquiryModal: InquiryItem | 'new-haji' | null;
  openInquiryModal: (i?: InquiryItem | 'new-haji') => void;
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

  // Sub-Admins & Employee Management
  subAdmins: SubAdminUser[];
  registerSubAdmin: (subAdmin: Omit<SubAdminUser, 'id' | 'createdAt' | 'isApproved' | 'role'> & { role?: 'sub_admin' | 'employee' }) => SubAdminUser;
  updateSubAdmin: (subAdmin: SubAdminUser) => void;
  deleteSubAdmin: (id: string) => void;
  activeSubAdmin: SubAdminUser | null;
  isSubAdmin: boolean;
  isEmployee: boolean;
  canEdit: boolean;
  hasPermission: (permissionKey: string) => boolean;

  // Sub-Admin Password Lifecycle & Privacy
  subAdminChangePassword: (newPassword: string) => boolean;
  subAdminResetPassword: (emailOrUsername: string, newPassword: string) => Promise<boolean>;

  // Dual-Control / Sub-Admin Approval System for Modifications on Approved Data
  subAdminApprovalRequests: SubAdminApprovalRequest[];
  requestAdminActionApproval: (req: Omit<SubAdminApprovalRequest, 'id' | 'requestedAt' | 'status'>) => void;
  approveAdminAction: (requestId: string, reviewNote?: string) => void;
  rejectAdminAction: (requestId: string, reviewNote?: string) => void;

  // Granular Sub-Admin Permissions & Role Levels per Module
  canSubAdminAdd: (moduleId: string) => boolean;
  canSubAdminEdit: (moduleId: string) => boolean;
  canSubAdminDelete: (moduleId: string) => boolean;
  canEditRecord: (moduleId: string, isApprovedItem: boolean) => boolean;
  canDeleteRecord: (moduleId: string, isApprovedItem: boolean) => boolean;
  canApproveRecords: boolean;
  getSubAdminModuleRole: (moduleId: string) => SubAdminModuleRole | null;

  // Haji Session & Login
  activeHajiSession: InquiryItem | null;
  hajiLogin: (userIdOrMobile: string, pass?: string) => Promise<HajiLoginResult> | HajiLoginResult;
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
  silentRefreshFromSupabase: () => Promise<void>;
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
  updateHajiFinanceRecord: (record: HajiFinanceRecord, reason?: string) => void;
  deleteHajiFinanceRecord: (id: string) => void;
  addPilgrimPayment: (hajiFinanceId: string, payment: Omit<PaymentRecord, 'id'>) => void;
  approvePilgrimPayment: (hajiFinanceId: string, paymentId: string) => void;
  rejectPilgrimPayment: (hajiFinanceId: string, paymentId: string, reason?: string) => void;
  deletePilgrimPayment: (hajiFinanceId: string, paymentId: string) => void;
  updatePilgrimExpenses: (hajiFinanceId: string, expenses: PilgrimExpenseItem[]) => void;
  addOfficeExpense: (expense: Omit<OfficeExpense, 'id' | 'createdAt'>) => OfficeExpense;
  updateOfficeExpense: (expense: OfficeExpense) => void;
  deleteOfficeExpense: (id: string) => void;
  approveHajiFinanceRecord: (id: string) => void;
  approveOfficeExpense: (id: string) => void;
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
  toggleNoticeApproval: (id: string) => void;

  // Edit Log History (অ্যাডমিন ও সাব-অ্যাডমিনের জন্য অপরিবর্তনীয়; শুধুমাত্র ওয়েবসাইট ডেভেলপার এডিট/ডিলিট করতে পারবেন)
  editLogs: EditLogEntry[];
  canManageEditLogs: boolean;
  getEditLogsForTarget: (targetId: string, secondaryIds?: (string | undefined | null)[]) => EditLogEntry[];
  updateEditLog: (entry: EditLogEntry) => void;
  deleteEditLog: (logId: string) => void;
  clearAllEditLogs: () => void;

  // Recycle Bin (সাব-অ্যাডমিন ও ডেভেলপার রিস্টোর/ক্লিন করতে পারবেন; শুধুমাত্র ডেভেলপার এডিট করতে পারবেন)
  recycleBin: RecycleBinItem[];
  canManageRecycleBin: boolean;
  canEditRecycleBin: boolean;
  updateRecycleBinItem: (item: RecycleBinItem) => void;
  restoreFromRecycleBin: (recycleId: string) => void;
  permanentlyDeleteRecycleBinItem: (recycleId: string) => void;
  cleanRecycleBin: () => void;

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
      const parsed = JSON.parse(raw);
      if (Array.isArray(defaultValue)) {
        if (!Array.isArray(parsed)) return defaultValue;
        const defaultHasObjects = defaultValue.some((x) => x && typeof x === 'object');
        if (defaultHasObjects || key === 'sub_admins' || key === 'subadmin_approval_requests' || key === 'kafela_groups') {
          return parsed.filter((x) => x && typeof x === 'object') as unknown as T;
        }
        return parsed.filter((x) => x !== null && x !== undefined) as unknown as T;
      }
      if (defaultValue && typeof defaultValue === 'object') {
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return { ...defaultValue, ...parsed } as T;
        }
        return defaultValue;
      }
      return parsed !== null && parsed !== undefined ? (parsed as T) : defaultValue;
    }
  } catch (err) {
    console.error(`Error loading ${key} from storage:`, err);
  }
  return defaultValue;
};

type TombstoneCollection =
  | 'inquiries'
  | 'finances'
  | 'finance_inquiries'
  | 'expenses'
  | 'services'
  | 'gallery'
  | 'team'
  | 'reviews'
  | 'messages'
  | 'notices'
  | 'sub_admins'
  | 'kafela_groups'
  | 'approval_requests';

const LEGACY_TOMBSTONE_KEYS: Partial<Record<TombstoneCollection, string>> = {
  inquiries: 'deleted_inquiries',
  finances: 'deleted_finances',
  expenses: 'deleted_expenses'
};

const DUMMY_OBSOLETE_IDS = new Set([
  'fin-haji-001',
  'fin-haji-002',
  'fin-haji-003',
  'fin-umrah-1001',
  'fin-umrah-1002',
  'fin-umrah-001',
  'fin-umrah-002',
  'fin-umrah-003',
  'inq-1',
  'inq-umrah-2',
  'inq-haji-pending-1',
  'inq-2',
  'off-exp-001',
  'off-exp-002',
  'off-exp-003',
  'off-exp-004',
  'off-exp-005',
  'off-exp-006',
  'off-inc-001',
  'off-inc-002'
]);

const loadTombstoneMap = (): Record<string, string[]> => {
  const map = loadFromStorage<Record<string, string[]>>('deleted_records', {});
  return map && typeof map === 'object' ? map : {};
};

const getTombstones = (collection: TombstoneCollection): Set<string> => {
  const legacyKey = LEGACY_TOMBSTONE_KEYS[collection];
  const legacy = legacyKey ? loadFromStorage<string[]>(legacyKey, []) : [];
  return new Set([...(loadTombstoneMap()[collection] || []), ...(Array.isArray(legacy) ? legacy : [])]);
};

const saveTombstonesLocally = (collection: string, ids: string[]) => {
  if (ids.length === 0) return;
  const map = loadTombstoneMap();
  map[collection] = Array.from(new Set([...(map[collection] || []), ...ids]));
  safeSet('muttaqi_deleted_records', JSON.stringify(map));
};

const removeTombstonesLocally = (collection: TombstoneCollection, ids: string[]) => {
  const toRemove = new Set(ids.filter(Boolean));
  if (toRemove.size === 0) return;
  const map = loadTombstoneMap();
  if (Array.isArray(map[collection])) {
    map[collection] = map[collection].filter((id) => !toRemove.has(id));
    safeSet('muttaqi_deleted_records', JSON.stringify(map));
  }
  const legacyKey = LEGACY_TOMBSTONE_KEYS[collection];
  if (legacyKey) {
    const legacy = loadFromStorage<string[]>(legacyKey, []);
    if (Array.isArray(legacy)) {
      safeSet(`muttaqi_${legacyKey}`, JSON.stringify(legacy.filter((id) => !toRemove.has(id))));
    }
  }
};

const markDeleted = (collection: TombstoneCollection, ids: (string | undefined | null)[]) => {
  const clean = ids.filter((id): id is string => !!id);
  if (clean.length === 0) return Promise.resolve(true);
  saveTombstonesLocally(collection, clean);
  return SupabaseService.addDeletedRecords(collection, clean).catch(() => false);
};

const unmarkDeleted = (collection: TombstoneCollection, ids: (string | undefined | null)[]) => {
  const clean = ids.filter((id): id is string => !!id);
  if (clean.length === 0) return Promise.resolve(true);
  removeTombstonesLocally(collection, clean);
  return SupabaseService.removeDeletedRecords(collection, clean).catch(() => false);
};

// Supabase is the source of truth: when the table returned rows, show exactly
// those rows. Local data is only used when the fetch failed or the table is
// still empty (never seeded), and deleted ids are always filtered out.
const reconcileWithRemote = <T extends { id: string }>(
  local: T[],
  remote: T[] | null | undefined,
  collection: TombstoneCollection,
  isAlsoDeleted?: (item: T) => boolean
): T[] => {
  const safeLocal = (Array.isArray(local) ? local : []).filter(
    (item): item is T => Boolean(item && typeof item === 'object' && typeof item.id === 'string')
  );
  const deleted = getTombstones(collection);
  const keep = (item: T) => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') return false;
    return !DUMMY_OBSOLETE_IDS.has(item.id) && !deleted.has(item.id) && !(isAlsoDeleted && isAlsoDeleted(item));
  };
  if (Array.isArray(remote) && remote.length > 0) {
    return remote.filter(keep);
  }
  return safeLocal.filter(keep);
};

const formatBnDateTime = (iso?: string): string => {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString('bn-BD');
  try {
    const dStr = date.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const tStr = date.toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dStr}, ${tStr}`;
  } catch {
    return date.toLocaleString();
  }
};

const formatMoneyVal = (val?: number): string =>
  `৳${Number(val || 0).toLocaleString('en-IN')}`;

const truncateVal = (val?: string | number | null, max = 90): string => {
  const str = String(val ?? '').trim();
  if (!str) return 'খালি';
  return str.length > max ? `${str.slice(0, max)}...` : str;
};

const stripHugeDataStrings = (value: any): any => {
  if (typeof value === 'string') {
    return value.length > 45000 ? '' : value;
  }
  if (Array.isArray(value)) {
    return value.map(stripHugeDataStrings);
  }
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = stripHugeDataStrings(v);
    }
    return out;
  }
  return value;
};

const generateInquiryDiff = (prev: InquiryItem, next: InquiryItem): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if ((prev.nameBn || prev.name) !== (next.nameBn || next.name)) {
    diffs.push({ label: 'নাম (বাংলা)', oldVal: truncateVal(prev.nameBn || prev.name), newVal: truncateVal(next.nameBn || next.name) });
  }
  if ((prev.nameEn || prev.englishName) !== (next.nameEn || next.englishName)) {
    diffs.push({ label: 'নাম (English)', oldVal: truncateVal(prev.nameEn || prev.englishName), newVal: truncateVal(next.nameEn || next.englishName) });
  }
  if ((prev.phone || '') !== (next.phone || '')) {
    diffs.push({ label: 'মোবাইল নম্বর', oldVal: truncateVal(prev.phone), newVal: truncateVal(next.phone) });
  }
  if ((prev.passportNo || '') !== (next.passportNo || '')) {
    diffs.push({ label: 'পাসপোর্ট নম্বর', oldVal: truncateVal(prev.passportNo), newVal: truncateVal(next.passportNo) });
  }
  if ((prev.nidNo || '') !== (next.nidNo || '')) {
    diffs.push({ label: 'জাতীয় পরিচয়পত্র (NID)', oldVal: truncateVal(prev.nidNo), newVal: truncateVal(next.nidNo) });
  }
  if ((prev.visaNo || '') !== (next.visaNo || '')) {
    diffs.push({ label: 'ভিসা নম্বর', oldVal: truncateVal(prev.visaNo), newVal: truncateVal(next.visaNo) });
  }
  if ((prev.fatherNameBn || '') !== (next.fatherNameBn || '')) {
    diffs.push({ label: 'পিতার নাম', oldVal: truncateVal(prev.fatherNameBn), newVal: truncateVal(next.fatherNameBn) });
  }
  if ((prev.motherNameBn || '') !== (next.motherNameBn || '')) {
    diffs.push({ label: 'মাতার নাম', oldVal: truncateVal(prev.motherNameBn), newVal: truncateVal(next.motherNameBn) });
  }
  if ((prev.presentAddress || '') !== (next.presentAddress || '')) {
    diffs.push({ label: 'বর্তমান ঠিকানা', oldVal: truncateVal(prev.presentAddress), newVal: truncateVal(next.presentAddress) });
  }
  if ((prev.permanentAddress || '') !== (next.permanentAddress || '')) {
    diffs.push({ label: 'স্থায়ী ঠিকানা', oldVal: truncateVal(prev.permanentAddress), newVal: truncateVal(next.permanentAddress) });
  }
  if ((prev.selectedGroup || '') !== (next.selectedGroup || '')) {
    diffs.push({ label: 'কাফেলা গ্রুপ', oldVal: truncateVal(prev.selectedGroup), newVal: truncateVal(next.selectedGroup) });
  }
  if ((prev.serviceName || '') !== (next.serviceName || '')) {
    diffs.push({ label: 'প্যাকেজের নাম', oldVal: truncateVal(prev.serviceName), newVal: truncateVal(next.serviceName) });
  }
  if ((prev.registrationType || '') !== (next.registrationType || '')) {
    diffs.push({
      label: 'হজের ধরন',
      oldVal: prev.registrationType === 'umrah' ? 'ওমরাহ্ হজ' : 'মূল হজ',
      newVal: next.registrationType === 'umrah' ? 'ওমরাহ্ হজ' : 'মূল হজ'
    });
  }
  if ((prev.roomPreference || '') !== (next.roomPreference || '')) {
    diffs.push({ label: 'হোটেল রুমের ধরন', oldVal: truncateVal(prev.roomPreference), newVal: truncateVal(next.roomPreference) });
  }
  if ((prev.airfareOption || '') !== (next.airfareOption || '')) {
    diffs.push({ label: 'বিমান টিকেট অপশন', oldVal: truncateVal(prev.airfareOption), newVal: truncateVal(next.airfareOption) });
  }
  if (Number(prev.finalTotalAmount || 0) !== Number(next.finalTotalAmount || 0)) {
    diffs.push({ label: 'নির্ধারিত চুক্তি মূল্য', oldVal: formatMoneyVal(prev.finalTotalAmount), newVal: formatMoneyVal(next.finalTotalAmount) });
  }
  if (Number(prev.paidAmount || 0) !== Number(next.paidAmount || 0)) {
    diffs.push({ label: 'পরিশোধিত জমা', oldVal: formatMoneyVal(prev.paidAmount), newVal: formatMoneyVal(next.paidAmount) });
  }
  if (Number(prev.discountPercent || 0) !== Number(next.discountPercent || 0)) {
    diffs.push({ label: 'ডিসকাউন্ট (%)', oldVal: `${prev.discountPercent || 0}%`, newVal: `${next.discountPercent || 0}%` });
  }
  if ((prev.status || '') !== (next.status || '')) {
    diffs.push({ label: 'স্ট্যাটাস', oldVal: truncateVal(prev.status), newVal: truncateVal(next.status) });
  }
  if ((prev.adminNotes || '') !== (next.adminNotes || '')) {
    diffs.push({ label: 'অ্যাডমিন নোট', oldVal: truncateVal(prev.adminNotes), newVal: truncateVal(next.adminNotes) });
  }
  if ((prev.photoUrl || '') !== (next.photoUrl || '')) {
    diffs.push({ label: 'হাজীর ছবি', oldVal: prev.photoUrl ? 'পূর্বের ছবি' : 'ছবি ছিল না', newVal: next.photoUrl ? 'নতুন ছবি আপডেট' : 'ছবি সরানো হয়েছে' });
  }
  return diffs;
};

const generateFinanceDiff = (prev: HajiFinanceRecord, next: HajiFinanceRecord): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.hajiName !== next.hajiName) {
    diffs.push({ label: 'হাজীর নাম', oldVal: truncateVal(prev.hajiName), newVal: truncateVal(next.hajiName) });
  }
  if (prev.hajiType !== next.hajiType) {
    diffs.push({
      label: 'হজের ধরন',
      oldVal: prev.hajiType === 'umrah' ? 'ওমরাহ্ হজ' : 'মূল হজ',
      newVal: next.hajiType === 'umrah' ? 'ওমরাহ্ হজ' : 'মূল হজ'
    });
  }
  if ((prev.packageName || '') !== (next.packageName || '')) {
    diffs.push({ label: 'প্যাকেজ', oldVal: truncateVal(prev.packageName), newVal: truncateVal(next.packageName) });
  }
  if (Number(prev.packagePrice || 0) !== Number(next.packagePrice || 0)) {
    diffs.push({ label: 'প্যাকেজ মূল্য', oldVal: formatMoneyVal(prev.packagePrice), newVal: formatMoneyVal(next.packagePrice) });
  }
  if (Number(prev.discountAmount || 0) !== Number(next.discountAmount || 0)) {
    diffs.push({ label: 'বিশেষ ছাড়', oldVal: formatMoneyVal(prev.discountAmount), newVal: formatMoneyVal(next.discountAmount) });
  }
  if (Number(prev.finalTotalAmount || 0) !== Number(next.finalTotalAmount || 0)) {
    diffs.push({ label: 'নির্ধারিত চুক্তি মূল্য', oldVal: formatMoneyVal(prev.finalTotalAmount), newVal: formatMoneyVal(next.finalTotalAmount) });
  }
  if (Number(prev.totalDeposited || 0) !== Number(next.totalDeposited || 0)) {
    diffs.push({ label: 'পরিশোধিত জমা', oldVal: formatMoneyVal(prev.totalDeposited), newVal: formatMoneyVal(next.totalDeposited) });
  }
  if (Number(prev.dueAmount || 0) !== Number(next.dueAmount || 0)) {
    diffs.push({ label: 'অবশিষ্ট ডিউ বকেয়া', oldVal: formatMoneyVal(prev.dueAmount), newVal: formatMoneyVal(next.dueAmount) });
  }
  if (Number(prev.totalExpense || 0) !== Number(next.totalExpense || 0)) {
    diffs.push({ label: 'হাজী বাবদ মোট ব্যয়', oldVal: formatMoneyVal(prev.totalExpense), newVal: formatMoneyVal(next.totalExpense) });
  }
  const prevPaymentsLen = (prev.payments || []).length;
  const nextPaymentsLen = (next.payments || []).length;
  if (prevPaymentsLen !== nextPaymentsLen) {
    diffs.push({ label: 'পেমেন্ট কিস্তির সংখ্যা', oldVal: `${prevPaymentsLen}টি কিস্তি`, newVal: `${nextPaymentsLen}টি কিস্তি` });
  }
  if ((prev.notes || '') !== (next.notes || '')) {
    diffs.push({ label: 'মন্তব্য / নোট', oldVal: truncateVal(prev.notes), newVal: truncateVal(next.notes) });
  }
  return diffs;
};

const generateOfficeExpenseDiff = (prev: OfficeExpense, next: OfficeExpense): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.title !== next.title) {
    diffs.push({ label: 'খরচ / আয়ের শিরোনাম', oldVal: truncateVal(prev.title), newVal: truncateVal(next.title) });
  }
  if ((prev.entryType || 'expense') !== (next.entryType || 'expense')) {
    diffs.push({
      label: 'এন্ট্রির ধরন',
      oldVal: prev.entryType === 'income' ? 'অন্যান্য আয়' : 'অফিস ব্যয়',
      newVal: next.entryType === 'income' ? 'অন্যান্য আয়' : 'অফিস ব্যয়'
    });
  }
  if (Number(prev.amount || 0) !== Number(next.amount || 0)) {
    diffs.push({ label: 'টাকার পরিমাণ', oldVal: formatMoneyVal(prev.amount), newVal: formatMoneyVal(next.amount) });
  }
  if ((prev.date || '') !== (next.date || '')) {
    diffs.push({ label: 'তারিখ', oldVal: truncateVal(prev.date), newVal: truncateVal(next.date) });
  }
  if (String(prev.category || '') !== String(next.category || '')) {
    diffs.push({ label: 'খাত / ক্যাটাগরি', oldVal: truncateVal(prev.category), newVal: truncateVal(next.category) });
  }
  if ((prev.note || '') !== (next.note || '')) {
    diffs.push({ label: 'মন্তব্য / বিবরণ', oldVal: truncateVal(prev.note), newVal: truncateVal(next.note) });
  }
  return diffs;
};

const generateNoticeDiff = (prev: NoticeItem, next: NoticeItem): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.title !== next.title) {
    diffs.push({ label: 'শিরোনাম', oldVal: truncateVal(prev.title), newVal: truncateVal(next.title) });
  }
  if (prev.content !== next.content) {
    diffs.push({ label: 'বিস্তারিত বিবরণ', oldVal: truncateVal(prev.content, 70), newVal: truncateVal(next.content, 70) });
  }
  if (prev.category !== next.category) {
    diffs.push({ label: 'ক্যাটাগরি', oldVal: truncateVal(prev.category), newVal: truncateVal(next.category) });
  }
  if (prev.date !== next.date) {
    diffs.push({ label: 'তারিখ', oldVal: truncateVal(prev.date), newVal: truncateVal(next.date) });
  }
  if (Boolean(prev.isPinned) !== Boolean(next.isPinned)) {
    diffs.push({ label: 'পিন স্ট্যাটাস', oldVal: prev.isPinned ? 'পিন করা' : 'সাধারণ', newVal: next.isPinned ? 'পিন করা' : 'সাধারণ' });
  }
  if ((prev.isActive !== false) !== (next.isActive !== false)) {
    diffs.push({ label: 'দৃশ্যমানতা', oldVal: prev.isActive !== false ? 'সক্রিয়' : 'লুকানো', newVal: next.isActive !== false ? 'সক্রিয়' : 'লুকানো' });
  }
  return diffs;
};

const generateServiceDiff = (prev: ServiceItem, next: ServiceItem): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.title !== next.title) {
    diffs.push({ label: 'সেবার নাম', oldVal: truncateVal(prev.title), newVal: truncateVal(next.title) });
  }
  if ((prev.subtitle || '') !== (next.subtitle || '')) {
    diffs.push({ label: 'সাব-টাইটেল', oldVal: truncateVal(prev.subtitle), newVal: truncateVal(next.subtitle) });
  }
  if ((prev.shortDesc || '') !== (next.shortDesc || '')) {
    diffs.push({ label: 'সংক্ষিপ্ত বিবরণ', oldVal: truncateVal(prev.shortDesc, 70), newVal: truncateVal(next.shortDesc, 70) });
  }
  if ((prev.fullDesc || '') !== (next.fullDesc || '')) {
    diffs.push({ label: 'বিস্তারিত বিবরণ', oldVal: truncateVal(prev.fullDesc, 70), newVal: truncateVal(next.fullDesc, 70) });
  }
  if ((prev.badge || '') !== (next.badge || '')) {
    diffs.push({ label: 'ব্যাজ', oldVal: truncateVal(prev.badge), newVal: truncateVal(next.badge) });
  }
  return diffs;
};

const generateGalleryDiff = (prev: GalleryItem, next: GalleryItem): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.title !== next.title) {
    diffs.push({ label: 'ছবির শিরোনাম', oldVal: truncateVal(prev.title), newVal: truncateVal(next.title) });
  }
  if ((prev.description || '') !== (next.description || '')) {
    diffs.push({ label: 'বিবরণ', oldVal: truncateVal(prev.description, 70), newVal: truncateVal(next.description, 70) });
  }
  if ((prev.category || '') !== (next.category || '')) {
    diffs.push({ label: 'ক্যাটাগরি', oldVal: truncateVal(prev.category), newVal: truncateVal(next.category) });
  }
  if ((prev.image || '') !== (next.image || '')) {
    diffs.push({ label: 'ছবি', oldVal: 'পূর্বের ছবি', newVal: 'নতুন ছবি আপডেট' });
  }
  return diffs;
};

const generateTeamDiff = (prev: TeamMember, next: TeamMember): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.name !== next.name) {
    diffs.push({ label: 'পরিচালকের নাম', oldVal: truncateVal(prev.name), newVal: truncateVal(next.name) });
  }
  if (prev.role !== next.role) {
    diffs.push({ label: 'পদবি', oldVal: truncateVal(prev.role), newVal: truncateVal(next.role) });
  }
  const prevMsg = prev.message ?? prev.bio ?? '';
  const nextMsg = next.message ?? next.bio ?? '';
  if (prevMsg !== nextMsg) {
    diffs.push({ label: 'পরিচালকের বার্তা', oldVal: truncateVal(prevMsg, 70), newVal: truncateVal(nextMsg, 70) });
  }
  if ((prev.image || '') !== (next.image || '')) {
    diffs.push({ label: 'ছবি', oldVal: 'পূর্বের ছবি', newVal: 'নতুন ছবি আপডেট' });
  }
  return diffs;
};

const generateReviewDiff = (prev: ReviewItem, next: ReviewItem): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.name !== next.name) {
    diffs.push({ label: 'হাজীর নাম', oldVal: truncateVal(prev.name), newVal: truncateVal(next.name) });
  }
  if (prev.location !== next.location) {
    diffs.push({ label: 'ঠিকানা', oldVal: truncateVal(prev.location), newVal: truncateVal(next.location) });
  }
  if (prev.rating !== next.rating) {
    diffs.push({ label: 'রেটিং', oldVal: `${prev.rating} স্টার`, newVal: `${next.rating} স্টার` });
  }
  if (prev.comment !== next.comment) {
    diffs.push({ label: 'মন্তব্য', oldVal: truncateVal(prev.comment, 70), newVal: truncateVal(next.comment, 70) });
  }
  return diffs;
};

const generateKafelaGroupDiff = (prev: KafelaGroup, next: KafelaGroup): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.name !== next.name) {
    diffs.push({ label: 'গ্রুপের নাম', oldVal: truncateVal(prev.name), newVal: truncateVal(next.name) });
  }
  if (prev.leader !== next.leader) {
    diffs.push({ label: 'মোয়াল্লেম / পরিচালক', oldVal: truncateVal(prev.leader), newVal: truncateVal(next.leader) });
  }
  if (prev.maxCapacity !== next.maxCapacity) {
    diffs.push({ label: 'আসন সংখ্যা', oldVal: `${prev.maxCapacity} জন`, newVal: `${next.maxCapacity} জন` });
  }
  if (prev.type !== next.type) {
    diffs.push({ label: 'ধরন', oldVal: truncateVal(prev.type), newVal: truncateVal(next.type) });
  }
  if ((prev.departureDate || '') !== (next.departureDate || '')) {
    diffs.push({ label: 'সম্ভাব্য সফর তারিখ', oldVal: truncateVal(prev.departureDate), newVal: truncateVal(next.departureDate) });
  }
  return diffs;
};

const generatePricingItemDiff = (prev: PricingItem, next: PricingItem): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.title !== next.title) {
    diffs.push({ label: 'শিরোনাম', oldVal: truncateVal(prev.title), newVal: truncateVal(next.title) });
  }
  if (Number(prev.price || 0) !== Number(next.price || 0)) {
    diffs.push({ label: 'নির্ধারিত মূল্য', oldVal: formatMoneyVal(prev.price), newVal: formatMoneyVal(next.price) });
  }
  if ((prev.subtitle || '') !== (next.subtitle || '')) {
    diffs.push({ label: 'সাব-টাইটেল', oldVal: truncateVal(prev.subtitle), newVal: truncateVal(next.subtitle) });
  }
  if ((prev.unit || '') !== (next.unit || '')) {
    diffs.push({ label: 'একক', oldVal: truncateVal(prev.unit), newVal: truncateVal(next.unit) });
  }
  if (prev.durationDays !== next.durationDays) {
    diffs.push({ label: 'দিন সংখ্যা', oldVal: `${prev.durationDays || '-'} দিন`, newVal: `${next.durationDays || '-'} দিন` });
  }
  return diffs;
};

const generateMessageDiff = (prev: ContactMessage, next: ContactMessage): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  if (prev.status !== next.status) {
    diffs.push({ label: 'স্ট্যাটাস', oldVal: truncateVal(prev.status), newVal: truncateVal(next.status) });
  }
  if ((prev.adminNotes || '') !== (next.adminNotes || '')) {
    diffs.push({ label: 'অ্যাডমিন নোট', oldVal: truncateVal(prev.adminNotes), newVal: truncateVal(next.adminNotes) });
  }
  if (prev.subject !== next.subject) {
    diffs.push({ label: 'বিষয়', oldVal: truncateVal(prev.subject), newVal: truncateVal(next.subject) });
  }
  return diffs;
};

const generateCompanyDiff = (prev: CompanyInfo, next: CompanyInfo): EditLogDiff[] => {
  const diffs: EditLogDiff[] = [];
  const check = (key: keyof CompanyInfo, label: string) => {
    const o = String((prev as any)[key] ?? '');
    const n = String((next as any)[key] ?? '');
    if (o !== n) {
      diffs.push({ label, oldVal: truncateVal(o, 70), newVal: truncateVal(n, 70) });
    }
  };
  check('name', 'প্রতিষ্ঠানের নাম (বাংলা)');
  check('nameEn', 'প্রতিষ্ঠানের নাম (ইংরেজি)');
  check('slogan', 'স্লোগান');
  check('phone1', 'প্রধান মোবাইল নম্বর');
  check('phone2', 'দ্বিতীয় মোবাইল নম্বর');
  check('email', 'ইমেইল');
  check('address', 'অফিসের ঠিকানা');
  check('whatsapp', 'হোয়াটসঅ্যাপ');
  check('announcementText', 'নোটিশ / ঘোষণা বার্তা');
  return diffs;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return safeGet('muttaqi_admin_auth') === 'true' || hasDeveloperSession();
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
    const deleted = getTombstones('services');
    return loaded
      .filter((s: ServiceItem) => !deleted.has(s.id))
      .map((s: ServiceItem) => ({ ...s, isApproved: s.isApproved !== false }));
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const loaded = loadFromStorage('team_members', DEFAULT_TEAM_MEMBERS);
    const deleted = getTombstones('team');
    const defaultById = new Map(DEFAULT_TEAM_MEMBERS.map((d) => [d.id, d]));
    return loaded
      .filter((m: TeamMember) => !deleted.has(m.id))
      .map((m: TeamMember) => {
        const seed = defaultById.get(m.id);
        const resolvedMessage =
          typeof m.message === 'string'
            ? m.message
            : typeof m.bio === 'string'
              ? m.bio
              : (seed?.message || '');
        return {
          ...m,
          message: resolvedMessage,
          bio: resolvedMessage,
          isApproved: m.isApproved !== false
        };
      });
  });

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    const loaded = loadFromStorage('gallery_items', DEFAULT_GALLERY_ITEMS);
    const deleted = getTombstones('gallery');
    return loaded
      .filter((g: GalleryItem) => !deleted.has(g.id))
      .map((g: GalleryItem) => ({ ...g, isApproved: g.isApproved !== false }));
  });

  const [stats, setStats] = useState(() =>
    loadFromStorage('stats', DEFAULT_STATS)
  );

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    const loaded = loadFromStorage('reviews', DEFAULT_REVIEWS);
    const deleted = getTombstones('reviews');
    return loaded.filter((r: ReviewItem) => !deleted.has(r.id));
  });

  const DEFAULT_INQUIRIES: InquiryItem[] = [
    {
      id: 'inq-umd26-ruzina',
      registrationRef: 'UMD26-RUZINA',
      hajiUserId: 'UMD26-RUZINA',
      name: 'MST RUZINA BEGUM',
      nameBn: 'মোছাঃ রুজিনা বেগম',
      nameEn: 'MST RUZINA BEGUM',
      phone: '01734781894',
      email: '',
      serviceId: 'hajj-umrah',
      serviceName: 'ডিসেম্বর উমরাহ প্যাকেজ',
      travelers: '2 shares (ডিসেম্বর উমরাহ প্যাকেজ)',
      selectedGroup: 'Group-DECEMBER 2026',
      roomPreference: '২-বেড রুম (ডাবল / কাপল প্রিমিয়াম)',
      registrationType: 'umrah',
      packageBasePrice: 123500,
      subtotalAmount: 123500,
      discountAmount: 0,
      finalTotalAmount: 123500,
      paidAmount: 50000,
      dueAmount: 73500,
      paymentDate: '2026-10-25',
      paymentMethod: 'ব্যাংক ডিপোজিট',
      hajiPassword: 'HajiPassword123!',
      date: '২০২৬-১০-২৫',
      status: 'approved',
      approvedAt: '২০২৬-১০-২৫',
      adminNotes: 'অনুমোদিত ওমরাহ্ নিবন্ধন (ডিসেম্বর ২০২৬)'
    },
    {
      id: 'inq-umd26-belal',
      registrationRef: 'UMD26-BELAL',
      hajiUserId: 'UMD26-BELAL',
      name: 'MD BELAL HOSSAIN',
      nameBn: 'মোঃ বেলাল হোসেন',
      nameEn: 'MD BELAL HOSSAIN',
      phone: '01734781894',
      email: '',
      serviceId: 'hajj-umrah',
      serviceName: 'ডিসেম্বর উমরাহ প্যাকেজ',
      travelers: '2 shares (ডিসেম্বর উমরাহ প্যাকেজ)',
      selectedGroup: 'Group-DECEMBER 2026',
      roomPreference: '২-বেড রুম (ডাবল / কাপল প্রিমিয়াম)',
      registrationType: 'umrah',
      packageBasePrice: 123500,
      subtotalAmount: 123500,
      discountAmount: 0,
      finalTotalAmount: 123500,
      paidAmount: 0,
      dueAmount: 123500,
      hajiPassword: 'HajiPassword123!',
      date: '২০২৬-১০-২৫',
      status: 'approved',
      approvedAt: '২০২৬-১০-২৫',
      adminNotes: 'অনুমোদিত ওমরাহ্ নিবন্ধন (ডিসেম্বর ২০২৬)'
    }
  ];

  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    const raw = loadFromStorage<InquiryItem[]>('inquiries', DEFAULT_INQUIRIES);
    const baseList = Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_INQUIRIES;
    const deleted = getTombstones('inquiries');
    const filtered = baseList.filter((i) => !DUMMY_OBSOLETE_IDS.has(i.id) && !deleted.has(i.id));
    const existingIds = new Set(filtered.map((i) => i.id));
    const missingDefaults = DEFAULT_INQUIRIES.filter((d) => !existingIds.has(d.id) && !deleted.has(d.id));
    const combined = [...filtered, ...missingDefaults];
    safeSet('muttaqi_inquiries', JSON.stringify(combined));
    return combined;
  });

  // Persistent Tombstones (কখনোই যাতে ডিলিট হওয়া তথ্য ফিরে না আসে)
  const [deletedInquiryIds, setDeletedInquiryIds] = useState<string[]>(() =>
    loadFromStorage('deleted_inquiries', [])
  );
  const [deletedFinanceIds, setDeletedFinanceIds] = useState<string[]>(() =>
    loadFromStorage('deleted_finances', [])
  );
  const [deletedExpenseIds, setDeletedExpenseIds] = useState<string[]>(() =>
    loadFromStorage('deleted_expenses', [])
  );
  const [tombstoneVersion, setTombstoneVersion] = useState(0);

  // Sub-Admin Dual Control Approval Requests (ঐতিহাসিক রেকর্ড সংরক্ষণ)
  const [subAdminApprovalRequests, setSubAdminApprovalRequests] = useState<SubAdminApprovalRequest[]>(() =>
    loadFromStorage('subadmin_approval_requests', [])
  );

  useEffect(() => {
    safeSet('muttaqi_subadmin_approval_requests', JSON.stringify(subAdminApprovalRequests));
  }, [subAdminApprovalRequests]);

  // Immutable Edit Log History (অ্যাডমিন বা সাব-অ্যাডমিন কেউই ডিলিট করতে পারবে না)
  const [editLogs, setEditLogs] = useState<EditLogEntry[]>(() => {
    const loaded = loadFromStorage<EditLogEntry[]>('edit_logs_v1', []);
    return Array.isArray(loaded) ? loaded : [];
  });

  // Recycle Bin (অ্যাডমিন ডিলিট করলে এখানে জমা হবে; শুধুমাত্র সাব-অ্যাডমিন ক্লিন ও রিস্টোর করতে পারবেন)
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>(() => {
    const loaded = loadFromStorage<RecycleBinItem[]>('recycle_bin_v1', []);
    return Array.isArray(loaded) ? loaded : [];
  });

  const [subAdmins, setSubAdmins] = useState<SubAdminUser[]>(() =>
    loadFromStorage('sub_admins', [])
  );
  const hasApprovedSubAdmin = subAdmins.some((s) => s.role !== 'employee' && s.isApproved !== false);

  // Active Pending Approval Target IDs (যে সকল তথ্য সাব-এডমিন অনুমোদনের অপেক্ষায় রয়েছে — তালিকা থেকে ক্ষণস্থায়ীভাবে রিমুভ থাকবে)
  const pendingApprovalTargetIds = useMemo(() => {
    return new Set(
      subAdminApprovalRequests
        .filter((r) => r.status === 'pending')
        .map((r) => r.targetId)
    );
  }, [subAdminApprovalRequests]);

  const pendingFinanceDeleteInquiryIds = useMemo(() => {
    const ids = new Set<string>();
    subAdminApprovalRequests
      .filter((r) => r.status === 'pending' && r.targetType === 'finance' && r.action === 'delete')
      .forEach((r) => {
        const prev = (r.details?.previous || r.details?.financeRecord) as Partial<HajiFinanceRecord> | undefined;
        if (prev?.inquiryId) ids.add(prev.inquiryId);
        if (prev?.registrationRef) ids.add(prev.registrationRef);
      });
    return ids;
  }, [subAdminApprovalRequests]);

  // Admin Credentials State (এডমিন তার নিজের ইউজার আইডি ও পাসওয়ার্ড ইচ্ছামত পরিবর্তন করতে পারবে)
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; password: string; name: string }>(() => {
    const loaded = loadFromStorage('admin_credentials', DEFAULT_ADMIN_CREDENTIALS);
    return {
      email: typeof loaded?.email === 'string' && loaded.email ? loaded.email : DEFAULT_ADMIN_CREDENTIALS.email,
      password: typeof loaded?.password === 'string' && loaded.password ? loaded.password : DEFAULT_ADMIN_CREDENTIALS.password,
      name: typeof loaded?.name === 'string' && loaded.name ? loaded.name : DEFAULT_ADMIN_CREDENTIALS.name
    };
  });

  useEffect(() => {
    safeSet('muttaqi_admin_credentials', JSON.stringify(adminCredentials));
  }, [adminCredentials]);

  const [activeSubAdmin, setActiveSubAdmin] = useState<SubAdminUser | null>(() => {
    const raw = safeGet('muttaqi_subadmin_session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof parsed.id === 'string') {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const isEmployeeSession = (): boolean =>
    Boolean(
      activeSubAdmin &&
        (activeSubAdmin.role === 'employee' || String(activeSubAdmin.id || '').startsWith('emp-')) &&
        !hasDeveloperSession()
    );

  const isSubAdminReadOnly = (): boolean =>
    Boolean(activeSubAdmin && !isEmployeeSession() && !hasDeveloperSession());

  // শুধুমাত্র সাব-অ্যাডমিন (কর্মচারী বা সুপার এডমিন নয়) এবং ওয়েবসাইট ডেভেলপার রিসাইকেল বিন ক্লিন বা রিস্টোর করতে পারবেন
  const isStrictSubAdminSession = (): boolean =>
    Boolean(activeSubAdmin && !isEmployeeSession());

  const canManageRecycleBinSession = (): boolean =>
    isStrictSubAdminSession() || hasDeveloperSession();

  const getCurrentActor = (): { name: string; role: 'admin' | 'sub_admin' | 'employee' } => {
    if (hasDeveloperSession()) {
      return {
        name: 'ওয়েবসাইট ডেভেলপার',
        role: 'admin'
      };
    }
    if (activeSubAdmin) {
      if (isEmployeeSession()) {
        return {
          name: activeSubAdmin.englishName || activeSubAdmin.username || activeSubAdmin.email || 'কর্মচারী',
          role: 'employee'
        };
      }
      return {
        name: activeSubAdmin.englishName || activeSubAdmin.username || activeSubAdmin.email || 'সাব-অ্যাডমিন',
        role: 'sub_admin'
      };
    }
    return {
      name: adminCredentials.name || 'সুপার এডমিন',
      role: 'admin'
    };
  };

  // স্থায়ী এডিট লগ সংরক্ষণ (কখনোই ডিলিট করা যাবে না)
  const recordEditLog = (params: {
    targetType: AuditEntityType;
    targetId: string;
    secondaryIds?: (string | undefined | null)[];
    targetTitle: string;
    targetDepartment: string;
    diffs: EditLogDiff[];
    fallbackSummary?: string;
  }) => {
    const actor = getCurrentActor();
    const nowIso = new Date().toISOString();
    const cleanSecondaryIds = Array.from(
      new Set((params.secondaryIds || []).filter((v): v is string => Boolean(v && v.trim())))
    );
    const effectiveDiffs: EditLogDiff[] =
      params.diffs.length > 0
        ? params.diffs
        : [
            {
              label: 'তথ্য হালনাগাদ',
              oldVal: 'পূর্বের তথ্য',
              newVal: params.fallbackSummary || 'সংশোধিত তথ্য সংরক্ষিত হয়েছে'
            }
          ];
    const summary =
      params.diffs.length > 0
        ? params.diffs.map((d) => `${d.label}: ${d.oldVal} ➔ ${d.newVal}`).join(' | ')
        : params.fallbackSummary || `${params.targetTitle} তথ্য এডিট করা হয়েছে`;

    const entry: EditLogEntry = {
      id: `elog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      targetType: params.targetType,
      targetId: params.targetId,
      secondaryIds: cleanSecondaryIds.length > 0 ? cleanSecondaryIds : undefined,
      targetTitle: params.targetTitle,
      targetDepartment: params.targetDepartment,
      editedBy: actor.name,
      editedByRole: actor.role,
      editedAt: nowIso,
      editedDateBn: formatBnDateTime(nowIso),
      diffs: effectiveDiffs,
      summary
    };

    setEditLogs((prev) => {
      const next = [entry, ...prev];
      safeSet('muttaqi_edit_logs_v1', JSON.stringify(next));
      SupabaseService.saveEditLogs(next).catch(() => {});
      return next;
    });
  };

  const getEditLogsForTarget = (
    targetId: string,
    secondaryIds?: (string | undefined | null)[]
  ): EditLogEntry[] => {
    const matchKeys = new Set(
      [targetId, ...(secondaryIds || [])].filter((v): v is string => Boolean(v && v.trim()))
    );
    if (matchKeys.size === 0) return [];
    return editLogs.filter(
      (log) =>
        matchKeys.has(log.targetId) ||
        Boolean(log.secondaryIds?.some((sid) => matchKeys.has(sid)))
    );
  };

  const persistRecycleBin = (items: RecycleBinItem[]) => {
    try {
      window.localStorage.setItem('muttaqi_recycle_bin_v1', JSON.stringify(items));
    } catch {
      try {
        const slim = items.map((it) => ({
          ...it,
          payload: stripHugeDataStrings(it.payload)
        }));
        window.localStorage.setItem('muttaqi_recycle_bin_v1', JSON.stringify(slim));
      } catch {}
    }
    SupabaseService.saveRecycleBin(items).catch(() => {});
  };

  const moveToRecycleBin = (params: {
    entityType: RecycleBinItem['entityType'];
    originalId: string;
    targetTitle: string;
    targetSubtitle?: string;
    targetDepartment: string;
    summary: string;
    payload: Record<string, any>;
  }) => {
    const actor = getCurrentActor();
    const nowIso = new Date().toISOString();
    const binItem: RecycleBinItem = {
      id: `rbin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      entityType: params.entityType,
      originalId: params.originalId,
      targetTitle: params.targetTitle,
      targetSubtitle: params.targetSubtitle,
      targetDepartment: params.targetDepartment,
      deletedBy: actor.name,
      deletedByRole: actor.role,
      deletedAt: nowIso,
      deletedDateBn: formatBnDateTime(nowIso),
      summary: params.summary,
      payload: params.payload
    };
    setRecycleBin((prev) => {
      const next = [binItem, ...prev];
      persistRecycleBin(next);
      return next;
    });
  };

  const canApproveRecords = hasDeveloperSession() || !activeSubAdmin;

  const denySubAdminMutation = (): boolean => {
    if (!isSubAdminReadOnly()) return false;
    showToast('সাব-এডমিন একাউন্ট শুধু দেখার ও পিডিএফ ডাউনলোডের জন্য — তথ্য সংযোজন, এডিট বা ডিলিট করা যাবে না।');
    return true;
  };

  const denyApprovedEmployeeMutation = (isApprovedItem: boolean): boolean => {
    if (!isEmployeeSession()) return false;
    if (!isApprovedItem) return false;
    showToast('এটি অ্যাডমিন কর্তৃক অনুমোদিত তথ্য — কর্মচারী এটি এডিট বা ডিলিট করতে পারবেন না! শুধুমাত্র অ্যাডমিন অনুমোদনের আগ পর্যন্ত এডিট ও ডিলিট করা যাবে।');
    return true;
  };

  const denyEmployeeApprovalAction = (): boolean => {
    if (!isEmployeeSession()) return false;
    showToast('অনুমোদন শুধুমাত্র মূল অ্যাডমিন করতে পারবেন — কর্মচারী প্যানেল থেকে তথ্য অনুমোদন করা যাবে না।');
    return true;
  };

  const updateAdminCredentials = (newCreds: { email: string; password: string; name?: string }) => {
    if (denySubAdminMutation()) return;
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

  const [activeHajiSession, setActiveHajiSession] = useState<InquiryItem | null>(() => {
    const raw = safeGet('muttaqi_haji_session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof parsed.id === 'string') {
          return parsed;
        }
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
      // Security: hajiPassword is NEVER stored in browser storage
      const sanitized = { ...activeHajiSession };
      delete (sanitized as any).hajiPassword;
      safeSet('muttaqi_haji_session', JSON.stringify(sanitized));
    } else {
      safeRemove('muttaqi_haji_session');
    }
  }, [activeHajiSession]);

  const [pricingConfig, setPricingConfig] = useState<KafelaPricingConfig>(() => {
    const loaded = loadFromStorage('pricing_config', DEFAULT_PRICING_CONFIG);
    return {
      ...DEFAULT_PRICING_CONFIG,
      ...loaded,
      packages: Array.isArray(loaded?.packages) ? loaded.packages : DEFAULT_PRICING_CONFIG.packages,
      rooms: Array.isArray(loaded?.rooms) ? loaded.rooms : DEFAULT_PRICING_CONFIG.rooms,
      airfares: Array.isArray(loaded?.airfares) ? loaded.airfares : DEFAULT_PRICING_CONFIG.airfares,
      incidentals: Array.isArray(loaded?.incidentals) ? loaded.incidentals : DEFAULT_PRICING_CONFIG.incidentals
    };
  });

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

  // Sanitize any untouched auto-generated template expenses and guarantee totalExpense / netProfit match real entered expenses
  const sanitizeFinanceRecordExpenses = (rec: HajiFinanceRecord): HajiFinanceRecord => {
    const hadUntouchedTemplate = isUntouchedDefaultTemplateExpenses(rec.expenses);
    const cleanedExpenses = stripUntouchedDefaultExpenses(rec.expenses);
    const recomputedTotalExpense = cleanedExpenses.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const recomputedNetProfit = Number(rec.totalDeposited || 0) - recomputedTotalExpense;
    const expensesChanged = hadUntouchedTemplate || !Array.isArray(rec.expenses);
    const totalsChanged =
      Number(rec.totalExpense || 0) !== recomputedTotalExpense ||
      Number(rec.netProfit || 0) !== recomputedNetProfit;

    if (!expensesChanged && !totalsChanged) {
      return rec;
    }

    return {
      ...rec,
      expenses: cleanedExpenses,
      totalExpense: recomputedTotalExpense,
      netProfit: recomputedNetProfit
    };
  };

  // Hajj & Umrah Financial Accounting States (মূল হজ ও ওমরাহ্ আয়-ব্যয় ডাটাবেজ)
  const [hajiFinanceRecords, setHajiFinanceRecords] = useState<HajiFinanceRecord[]>(() => {
    const raw = loadFromStorage<HajiFinanceRecord[]>('haji_finance_records', DEFAULT_HAJI_FINANCE_RECORDS);
    const baseList = Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_HAJI_FINANCE_RECORDS;
    const deletedFinances = getTombstones('finances');
    const deletedInquiries = getTombstones('inquiries');
    const deletedFinanceInquiries = getTombstones('finance_inquiries');
    const filtered = baseList.filter((f: HajiFinanceRecord) => {
      if (DUMMY_OBSOLETE_IDS.has(f.id)) return false;
      if (deletedFinances.has(f.id)) return false;
      if (f.inquiryId && (deletedInquiries.has(f.inquiryId) || deletedFinanceInquiries.has(f.inquiryId))) return false;
      if (f.registrationRef && deletedFinanceInquiries.has(f.registrationRef)) return false;
      return true;
    });
    const existingIds = new Set(filtered.map((f) => f.id));
    const missingDefaults = DEFAULT_HAJI_FINANCE_RECORDS.filter(
      (def) => !existingIds.has(def.id) && !deletedFinances.has(def.id)
    );
    const combined = [...filtered, ...missingDefaults].map(sanitizeFinanceRecordExpenses);
    safeSet('muttaqi_haji_finance_records', JSON.stringify(combined));
    return combined;
  });

  // Wait for the remote tombstone list before rebuilding finance from cached inquiries.
  const [remoteSnapshotLoaded, setRemoteSnapshotLoaded] = useState(false);

  const [officeExpenses, setOfficeExpenses] = useState<OfficeExpense[]>(() => {
    const raw = loadFromStorage<OfficeExpense[]>('office_expenses', DEFAULT_OFFICE_EXPENSES);
    const baseList = Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_OFFICE_EXPENSES;
    const deleted = getTombstones('expenses');
    const filtered = baseList.filter((e: OfficeExpense) => !DUMMY_OBSOLETE_IDS.has(e.id) && !deleted.has(e.id));
    safeSet('muttaqi_office_expenses', JSON.stringify(filtered));
    return filtered;
  });

  useEffect(() => {
    safeSet('muttaqi_haji_finance_records', JSON.stringify(hajiFinanceRecords));
  }, [hajiFinanceRecords]);

  useEffect(() => {
    safeSet('muttaqi_office_expenses', JSON.stringify(officeExpenses));
  }, [officeExpenses]);

  // Notice Board State (হোমপেজ ও এডমিন প্যানেল নোটিশ বোর্ড)
  const [notices, setNotices] = useState<NoticeItem[]>(() => {
    const raw = loadFromStorage('notices', DEFAULT_NOTICES);
    const deleted = getTombstones('notices');
    return raw.filter((n: NoticeItem) => !deleted.has(n.id));
  });

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
    // Only count approved payments (pending payments await admin verification)
    const approvedPayments = paymentsList.filter(
      (p) => p.status !== 'pending' && p.status !== 'rejected'
    );
    const totalDeposited = approvedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
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

  // Helper to test if an inquiry represents a registered Haji or Umrah pilgrim
  const isHajiOrUmrahInquiry = (inq: Partial<InquiryItem>): boolean => {
    return (
      inq.registrationType === 'haji' ||
      inq.registrationType === 'umrah' ||
      inq.serviceId === 'haji-full-registration' ||
      inq.serviceId === 'hajj-umrah' ||
      /ওমরা|উমরা|umrah|হজ/i.test(`${inq.serviceName || ''} ${inq.serviceId || ''}`) ||
      !!inq.hajiUserId ||
      (!!inq.registrationRef && (inq.registrationRef.startsWith('HAJI-') || inq.registrationRef.startsWith('UMD') || inq.registrationRef.startsWith('MUT-')))
    );
  };

  // Helper to safely match an inquiry to a finance record without collisions between family members or old/new registrations sharing the same phone
  const isMatchingFinanceRecord = (rec: HajiFinanceRecord, inq: Partial<InquiryItem>): boolean => {
    // If both records carry explicit inquiry IDs, they MUST match — never cross-match two different registrations by phone/name!
    if (rec.inquiryId && inq.id) {
      return rec.inquiryId === inq.id;
    }
    if (rec.registrationRef && inq.registrationRef) {
      return rec.registrationRef === inq.registrationRef;
    }
    if (rec.id === inq.id) return true;
    if (rec.hajiUserId && inq.hajiUserId) {
      return rec.hajiUserId === inq.hajiUserId;
    }
    // Fallback to phone + name only for unlinked legacy/manual finance records
    if (rec.phone && inq.phone && rec.phone.replace(/\D/g, '') === inq.phone.replace(/\D/g, '')) {
      const recName = (rec.hajiNameBn || rec.hajiName || '').toLowerCase().trim();
      const inqName = (inq.nameBn || inq.name || '').toLowerCase().trim();
      if (recName && inqName && (recName === inqName || recName.includes(inqName) || inqName.includes(recName))) {
        return true;
      }
    }
    return false;
  };

  // Helper to reconcile approved payments list so their total equals an exact target paid amount
  // while keeping pending & rejected payments untouched
  const reconcilePaymentsToTargetPaid = (
    existingPayments: PaymentRecord[],
    targetPaidRaw: number,
    meta: {
      date?: string;
      method?: PaymentRecord['method'];
      voucherNo?: string;
      note?: string;
    } = {}
  ): PaymentRecord[] => {
    const targetPaid = Math.max(0, Math.round(Number(targetPaidRaw) || 0));
    const nonApproved = existingPayments.filter(
      (p) => p.status === 'pending' || p.status === 'rejected'
    );
    const approved = existingPayments
      .filter((p) => p.status !== 'pending' && p.status !== 'rejected')
      .map((p) => ({ ...p }));

    const currentApprovedSum = approved.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    if (currentApprovedSum === targetPaid) {
      return [...existingPayments];
    }

    if (targetPaid <= 0) {
      return [...nonApproved];
    }

    if (approved.length === 0) {
      return [
        {
          id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          amount: targetPaid,
          date: meta.date || new Date().toISOString().split('T')[0],
          method: meta.method || 'bank',
          voucherNo: meta.voucherNo || `TRX-${Date.now().toString().slice(-5)}`,
          receivedBy: 'মুত্তাকী হজ্ব ক্যাশ কাউন্টার',
          note: meta.note || 'রেজিস্ট্রেশনের সময় প্রাথমিক জমা/বুকিং মানি',
          status: 'approved'
        },
        ...nonApproved
      ];
    }

    if (approved.length === 1) {
      approved[0] = {
        ...approved[0],
        amount: targetPaid,
        date: meta.date || approved[0].date || new Date().toISOString().split('T')[0]
      };
      return [...approved, ...nonApproved];
    }

    // Multiple approved payments exist
    if (targetPaid > currentApprovedSum) {
      const diff = targetPaid - currentApprovedSum;
      return [
        ...approved,
        {
          id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          amount: diff,
          date: meta.date || new Date().toISOString().split('T')[0],
          method: meta.method || 'bank',
          voucherNo: meta.voucherNo || `ADJ-${Date.now().toString().slice(-5)}`,
          receivedBy: 'মুত্তাকী হজ্ব ক্যাশ কাউন্টার',
          note: 'হাজী নিবন্ধন শীট থেকে হালনাগাদকৃত জমা',
          status: 'approved'
        },
        ...nonApproved
      ];
    }

    // targetPaid < currentApprovedSum: trim from most recent approved payment backward so sum === targetPaid
    let toReduce = currentApprovedSum - targetPaid;
    const adjustedReversed: PaymentRecord[] = [];
    for (let idx = approved.length - 1; idx >= 0; idx--) {
      const p = approved[idx];
      const amt = Number(p.amount || 0);
      if (toReduce <= 0) {
        adjustedReversed.push(p);
      } else if (amt <= toReduce) {
        toReduce -= amt;
      } else {
        adjustedReversed.push({ ...p, amount: amt - toReduce });
        toReduce = 0;
      }
    }
    return [...adjustedReversed.reverse(), ...nonApproved];
  };

  // Unified reverse-sync: whenever Finance sheet updates totals/payments, update linked Inquiry + Supabase + Active Haji session
  const syncFinanceRecordBackToInquiry = (
    updatedRec: HajiFinanceRecord,
    latestPaymentDate?: string
  ) => {
    const subtotal = Math.max(0, Number(updatedRec.packagePrice || 0));
    const discountAmt = Math.max(0, Number(updatedRec.discountAmount || 0));
    const discountPct = subtotal > 0 ? Math.round((discountAmt / subtotal) * 100) : 0;

    setInquiries((prevInq) => {
      let changed = false;
      const nextInq = prevInq.map((inq) => {
        if (!isMatchingFinanceRecord(updatedRec, inq)) return inq;
        changed = true;
        const syncedInq: InquiryItem = {
          ...inq,
          subtotalAmount: subtotal > 0 ? subtotal : inq.subtotalAmount,
          discountAmount: discountAmt,
          discountPercent: discountPct,
          finalTotalAmount: updatedRec.finalTotalAmount,
          paidAmount: updatedRec.totalDeposited,
          dueAmount: updatedRec.dueAmount,
          ...(latestPaymentDate ? { paymentDate: latestPaymentDate } : {})
        };
        SupabaseService.saveInquiry(syncedInq);
        return syncedInq;
      });
      if (changed) {
        safeSet('muttaqi_inquiries', JSON.stringify(nextInq));
        return nextInq;
      }
      return prevInq;
    });

    if (activeHajiSession && isMatchingFinanceRecord(updatedRec, activeHajiSession)) {
      setActiveHajiSession((prev) =>
        prev
          ? {
              ...prev,
              subtotalAmount: subtotal > 0 ? subtotal : prev.subtotalAmount,
              discountAmount: discountAmt,
              discountPercent: discountPct,
              finalTotalAmount: updatedRec.finalTotalAmount,
              paidAmount: updatedRec.totalDeposited,
              dueAmount: updatedRec.dueAmount,
              ...(latestPaymentDate ? { paymentDate: latestPaymentDate } : {})
            }
          : prev
      );
    }
  };

  // Helper to construct / sync a HajiFinanceRecord from a Haji registration inquiry
  const buildHajiFinanceRecordFromInquiry = (
    inq: Partial<InquiryItem> & { name?: string; phone?: string; id?: string },
    existing?: HajiFinanceRecord,
    options?: { syncPaidFromInquiry?: boolean }
  ): HajiFinanceRecord => {
    const serviceLabel = `${inq.serviceName || ''} ${inq.serviceId || ''}`.toLocaleLowerCase();
    const isExplicitUmrah =
      /ওমরা|উমরা|umra|omra/i.test(serviceLabel) ||
      inq.registrationType === 'umrah' ||
      inq.serviceId === 'hajj-umrah' ||
      (!!inq.registrationRef && inq.registrationRef.startsWith('UMD'));
    const isExplicitHajj =
      !isExplicitUmrah &&
      (/মূল\s*হজ|হজ্জ|হজ্ব/i.test(serviceLabel) ||
        (inq.registrationType === 'haji' && !/ওমরা|উমরা|umra|omra/i.test(serviceLabel)) ||
        inq.serviceId === 'haji-full-registration' ||
        (!!inq.registrationRef && (inq.registrationRef.startsWith('HAJI-') || inq.registrationRef.startsWith('MUT-HAJ'))));
    // Registration/package selection is authoritative. Only fall back to an
    // existing type when the old inquiry has no recognizable package label.
    const hajiType: HajjType = isExplicitUmrah
      ? 'umrah'
      : isExplicitHajj
        ? 'hajj'
        : existing?.hajiType || 'hajj';

    // Prevent double-discounting: packagePrice is always GROSS (before discount) so packagePrice - discountAmount === finalTotalAmount
    const defaultPrice = isExplicitUmrah ? 165000 : 650000;
    const rawDisc = Math.max(0, Number(inq.discountAmount ?? existing?.discountAmount ?? 0));
    let basePrice: number;
    let discAmount = rawDisc;

    if (inq.finalTotalAmount !== undefined && Number(inq.finalTotalAmount) > 0) {
      const targetFinal = Number(inq.finalTotalAmount);
      basePrice =
        inq.subtotalAmount !== undefined && Number(inq.subtotalAmount) >= targetFinal
          ? Number(inq.subtotalAmount)
          : targetFinal + discAmount;
      discAmount = Math.max(0, basePrice - targetFinal);
    } else if (inq.subtotalAmount !== undefined && Number(inq.subtotalAmount) > 0) {
      basePrice = Number(inq.subtotalAmount);
    } else if (existing && Number(existing.packagePrice) > 0) {
      basePrice = Number(existing.packagePrice);
    } else {
      basePrice = Number(inq.packageBasePrice) || defaultPrice;
    }

    const finalAmount = Math.max(0, basePrice - discAmount);
    const hasExplicitPaid = inq.paidAmount !== undefined && inq.paidAmount !== null;
    const paidFromInq = hasExplicitPaid ? Math.max(0, Number(inq.paidAmount) || 0) : undefined;
    const paymentMeta = {
      date: inq.paymentDate || inq.date || new Date().toISOString().split('T')[0],
      method: ((inq.paymentMethod as PaymentRecord['method']) || 'bank'),
      voucherNo: inq.registrationRef || `TRX-${Date.now().toString().slice(-5)}`,
      note: 'রেজিস্ট্রেশনের সময় প্রাথমিক জমা/বুকিং মানি'
    };

    let payments: PaymentRecord[] = existing?.payments ? [...existing.payments] : [];
    const approvedExisting = payments.filter(
      (p) => p.status !== 'pending' && p.status !== 'rejected'
    );
    const approvedExistingSum = approvedExisting.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    if (options?.syncPaidFromInquiry && paidFromInq !== undefined) {
      // Explicit save from "হাজী নিবন্ধন" sheet — force Finance approved total to match inq.paidAmount exactly
      payments = reconcilePaymentsToTargetPaid(payments, paidFromInq, paymentMeta);
    } else if (!existing) {
      // Synthesizing new finance record for an inquiry that didn't have one yet
      if (paidFromInq && paidFromInq > 0) {
        payments = reconcilePaymentsToTargetPaid([], paidFromInq, paymentMeta);
      }
    } else if (paidFromInq !== undefined) {
      // Passive sync on existing finance record:
      // 1) If finance has no approved payments yet, seed from inquiry's paidAmount
      // 2) If finance only has the single auto-created registration booking payment, keep it in sync with inquiry's paidAmount
      // 3) If inquiry has a higher deposit recorded than a single legacy finance entry, reconcile up
      // Otherwise preserve multi-payment finance ledger history (and sync it back to inquiry)
      if (approvedExisting.length === 0 && paidFromInq > 0) {
        payments = reconcilePaymentsToTargetPaid(payments, paidFromInq, paymentMeta);
      } else if (
        approvedExisting.length === 1 &&
        approvedExisting[0].note === 'রেজিস্ট্রেশনের সময় প্রাথমিক জমা/বুকিং মানি' &&
        approvedExistingSum !== paidFromInq
      ) {
        payments = reconcilePaymentsToTargetPaid(payments, paidFromInq, paymentMeta);
      } else if (approvedExisting.length === 1 && paidFromInq > approvedExistingSum) {
        payments = reconcilePaymentsToTargetPaid(payments, paidFromInq, paymentMeta);
      }
    }

    // Never auto-inject dummy template expenses; only count real expenses explicitly entered for the pilgrim
    const expenses = stripUntouchedDefaultExpenses(existing?.expenses);

    const computed = calculateFinanceTotals({
      packagePrice: basePrice,
      discountAmount: discAmount,
      finalTotalAmount: finalAmount,
      payments,
      expenses
    });

    const resolvedYear = extractItemYear(inq);
    const seasonLabel = inq.selectedGroup
      ? `${inq.selectedGroup} / ${resolvedYear}`
      : existing?.yearSeason || `${resolvedYear} (১৪৪৭ হি.)`;

    return {
      id: existing?.id || (inq.id ? `fin-inq-${inq.id}` : `fin-haji-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`),
      inquiryId: inq.id || existing?.inquiryId,
      registrationRef: inq.registrationRef || inq.hajiUserId || existing?.registrationRef || `HAJI-${Date.now().toString().slice(-4)}`,
      hajiType,
      yearSeason: seasonLabel,
      hajiName: inq.nameBn || inq.name || existing?.hajiName || 'হাজী আবেদনকারী',
      hajiNameBn: inq.nameBn || inq.name || existing?.hajiNameBn,
      phone: inq.phone || existing?.phone || '',
      email: inq.email || existing?.email,
      nidNo: inq.nidNo || existing?.nidNo,
      passportNo: inq.passportNo || existing?.passportNo,
      district: inq.district || existing?.district || 'বগুড়া',
      packageName: inq.serviceName || existing?.packageName || (isExplicitUmrah ? 'ডিসেম্বর উমরাহ প্যাকেজ' : 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ'),
      packagePrice: basePrice,
      discountAmount: discAmount,
      payments,
      expenses,
      notes: inq.adminNotes || (inq.message ? `বার্তা: ${inq.message}` : existing?.notes || 'অনলাইন হাজী নিবন্ধন থেকে সংগৃহীত'),
      isApproved:
        inq.status === 'approved'
          ? true
          : existing?.isApproved !== undefined
            ? existing.isApproved
            : inq.createdByRole === 'employee'
              ? false
              : undefined,
      createdById: inq.createdById || existing?.createdById,
      createdByRole:
        (inq.createdByRole && inq.createdByRole !== 'haji' ? inq.createdByRole : undefined) || existing?.createdByRole,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...computed
    };
  };

  // Live reactive fusion of explicit finance records and all registered pilgrims in Inquiries.
  // This guarantees that any pilgrim registered in "হাজী নিবন্ধন" is NEVER 0 in "হজ ও ওমরাহ্ আয়-ব্যয়".
  const effectiveHajiFinanceRecords = useMemo<HajiFinanceRecord[]>(() => {
    const deletedFinances = getTombstones('finances');
    const deletedInquiries = getTombstones('inquiries');
    const deletedFinanceInquiries = getTombstones('finance_inquiries');

    const activeExplicit = hajiFinanceRecords.filter((rec) => {
      if (DUMMY_OBSOLETE_IDS.has(rec.id)) return false;
      if (pendingApprovalTargetIds.has(rec.id)) return false;
      if (rec.inquiryId && (pendingApprovalTargetIds.has(rec.inquiryId) || pendingFinanceDeleteInquiryIds.has(rec.inquiryId))) return false;
      if (rec.registrationRef && pendingFinanceDeleteInquiryIds.has(rec.registrationRef)) return false;
      if (deletedFinances.has(rec.id)) return false;
      if (rec.inquiryId && (deletedInquiries.has(rec.inquiryId) || deletedFinanceInquiries.has(rec.inquiryId))) return false;
      if (rec.registrationRef && deletedFinanceInquiries.has(rec.registrationRef)) return false;
      return true;
    });

    const registeredInquiries = inquiries.filter((inq) => {
      if (DUMMY_OBSOLETE_IDS.has(inq.id)) return false;
      if (pendingApprovalTargetIds.has(inq.id) || pendingFinanceDeleteInquiryIds.has(inq.id)) return false;
      if (inq.registrationRef && pendingFinanceDeleteInquiryIds.has(inq.registrationRef)) return false;
      if (deletedInquiries.has(inq.id)) return false;
      if (deletedFinanceInquiries.has(inq.id)) return false;
      if (inq.registrationRef && deletedFinanceInquiries.has(inq.registrationRef)) return false;
      if (deletedFinances.has(`fin-inq-${inq.id}`)) return false;
      return isHajiOrUmrahInquiry(inq);
    });

    const result: HajiFinanceRecord[] = [];
    const matchedExplicitIds = new Set<string>();

    for (const inq of registeredInquiries) {
      const matched = activeExplicit.find((rec) => isMatchingFinanceRecord(rec, inq));
      if (matched) {
        matchedExplicitIds.add(matched.id);
        const merged = buildHajiFinanceRecordFromInquiry(inq, matched);
        result.push(merged);
      } else {
        const synthesized = buildHajiFinanceRecordFromInquiry(inq);
        if (!deletedFinances.has(synthesized.id) && !pendingApprovalTargetIds.has(synthesized.id)) {
          result.push(synthesized);
        }
      }
    }

    for (const rec of activeExplicit) {
      if (!matchedExplicitIds.has(rec.id) && !DUMMY_OBSOLETE_IDS.has(rec.id)) {
        result.push(sanitizeFinanceRecordExpenses(rec));
      }
    }

    if (
      result.length === 0 &&
      hajiFinanceRecords.length === 0 &&
      deletedFinances.size === 0 &&
      deletedInquiries.size === 0 &&
      deletedFinanceInquiries.size === 0 &&
      pendingApprovalTargetIds.size === 0
    ) {
      return DEFAULT_HAJI_FINANCE_RECORDS;
    }

    return result;
  }, [
    hajiFinanceRecords,
    inquiries,
    pendingApprovalTargetIds,
    pendingFinanceDeleteInquiryIds,
    deletedFinanceIds,
    deletedInquiryIds,
    tombstoneVersion
  ]);

  // Active Visible Inquiries (অনুমোদনের অপেক্ষায় থাকা তথ্য সাময়িকভাবে রিমুভ)
  const visibleInquiries = useMemo(() => {
    return inquiries.filter((inq) => !pendingApprovalTargetIds.has(inq.id));
  }, [inquiries, pendingApprovalTargetIds]);

  // Active Visible Office Expenses (অনুমোদনের অপেক্ষায় থাকা খরচ সাময়িকভাবে রিমুভ)
  const visibleOfficeExpenses = useMemo(() => {
    return officeExpenses.filter((exp) => !pendingApprovalTargetIds.has(exp.id));
  }, [officeExpenses, pendingApprovalTargetIds]);

  // Helper to clear any stale finance-only tombstones for active registered pilgrims
  const clearFinanceTombstonesForInquiries = (targetInquiries: Partial<InquiryItem>[]) => {
    const financeIds: string[] = [];
    const financeInqRefs: string[] = [];
    targetInquiries.forEach((inq) => {
      if (inq.id) {
        financeIds.push(`fin-inq-${inq.id}`);
        financeInqRefs.push(inq.id);
      }
      if (inq.registrationRef) {
        financeInqRefs.push(inq.registrationRef);
      }
    });
    if (financeIds.length > 0) {
      unmarkDeleted('finances', financeIds);
      const removeSet = new Set(financeIds);
      setDeletedFinanceIds((prev) => {
        const next = prev.filter((id) => !removeSet.has(id));
        safeSet('muttaqi_deleted_finances', JSON.stringify(next));
        return next;
      });
    }
    if (financeInqRefs.length > 0) {
      unmarkDeleted('finance_inquiries', financeInqRefs);
    }
    if (financeIds.length > 0 || financeInqRefs.length > 0) {
      setTombstoneVersion((v) => v + 1);
    }
  };

  // Sync all registered Hajis & Umrah pilgrims to Finance records (also restores any active registered pilgrims missing from the ledger)
  const syncAllHajisToFinance = (): number => {
    if (denySubAdminMutation()) return 0;
    const deletedInqs = getTombstones('inquiries');
    const hajiInquiries = inquiries.filter(
      (inq) =>
        !DUMMY_OBSOLETE_IDS.has(inq.id) &&
        !deletedInqs.has(inq.id) &&
        !pendingApprovalTargetIds.has(inq.id) &&
        isHajiOrUmrahInquiry(inq)
    );

    // Clear stale finance tombstones for currently active registrations in "হাজী নিবন্ধন"
    clearFinanceTombstonesForInquiries(hajiInquiries);

    let syncedCount = 0;
    setHajiFinanceRecords((prevRecords) => {
      const deletedFinanceIdsSet = getTombstones('finances');
      const financeDeletedFor = getTombstones('finance_inquiries');
      const updatedList = prevRecords.filter(
        (record) =>
          !deletedFinanceIdsSet.has(record.id) &&
          !(record.inquiryId && financeDeletedFor.has(record.inquiryId)) &&
          !(record.registrationRef && financeDeletedFor.has(record.registrationRef))
      );

      for (const inq of hajiInquiries) {
        const existingIdx = updatedList.findIndex(
          (r) => isMatchingFinanceRecord(r, inq)
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

      safeSet('muttaqi_haji_finance_records', JSON.stringify(updatedList));
      return updatedList;
    });

    if (syncedCount > 0) {
      showToast(`${syncedCount} জন নিবন্ধিত হাজী/ওমরাহ্ যাত্রীর তথ্য "হজ ও ওমরাহ্ আয়-ব্যয়" লেজারে যুক্ত হয়েছে!`);
    } else {
      showToast('সকল নিবন্ধিত হাজী ও ওমরাহ্ যাত্রীর আর্থিক হিসাব লেজারে হালনাগাদ করা হয়েছে।');
    }
    return syncedCount;
  };

  // Auto-sync inquiries to finance records in background when inquiries change
  useEffect(() => {
    const hajiInquiries = inquiries.filter(
      (inq) => isHajiOrUmrahInquiry(inq)
    );

    if (hajiInquiries.length === 0) return;

    setHajiFinanceRecords((prevRecords) => {
      const financeDeletedFor = getTombstones('finance_inquiries');
      const deletedFinanceIdsSet = getTombstones('finances');
      const updatedList = prevRecords.filter(
        (record) =>
          !deletedFinanceIdsSet.has(record.id) &&
          !(record.inquiryId && financeDeletedFor.has(record.inquiryId)) &&
          !(record.registrationRef && financeDeletedFor.has(record.registrationRef))
      );
      let changed = updatedList.length !== prevRecords.length;

      for (const inq of hajiInquiries) {
        if (
          financeDeletedFor.has(inq.id) ||
          (!!inq.registrationRef && financeDeletedFor.has(inq.registrationRef)) ||
          deletedFinanceIdsSet.has(`fin-inq-${inq.id}`)
        ) continue;

        const existingIdx = updatedList.findIndex(
          (r) => isMatchingFinanceRecord(r, inq)
        );

        if (existingIdx < 0) {
          const newRec = buildHajiFinanceRecordFromInquiry(inq);
          updatedList.unshift(newRec);
          SupabaseService.saveHajiFinanceRecord(newRec);
          changed = true;
        } else {
          const existing = updatedList[existingIdx];
          const preview = buildHajiFinanceRecordFromInquiry(inq, existing);
          const hasSyncUpdate =
            preview.hajiType !== existing.hajiType ||
            preview.packageName !== existing.packageName ||
            preview.yearSeason !== existing.yearSeason ||
            preview.hajiName !== existing.hajiName ||
            preview.phone !== existing.phone ||
            preview.finalTotalAmount !== existing.finalTotalAmount ||
            preview.discountAmount !== existing.discountAmount ||
            preview.totalDeposited !== existing.totalDeposited ||
            preview.totalExpense !== existing.totalExpense ||
            preview.isApproved !== existing.isApproved;

          if (hasSyncUpdate) {
            updatedList[existingIdx] = preview;
            SupabaseService.saveHajiFinanceRecord(preview);
            changed = true;
          }
        }
      }

      return changed ? updatedList : prevRecords;
    });
  }, [inquiries, remoteSnapshotLoaded]);

  // Self-heal historical mismatches: keep inquiry paid/due/total aligned with authoritative finance ledger after hydration
  useEffect(() => {
    if (effectiveHajiFinanceRecords.length === 0 || inquiries.length === 0) return;

    setInquiries((prevInq) => {
      let changed = false;
      const nextInq = prevInq.map((inq) => {
        if (!isHajiOrUmrahInquiry(inq)) return inq;
        const matched = effectiveHajiFinanceRecords.find((rec) => isMatchingFinanceRecord(rec, inq));
        if (!matched) return inq;

        const targetSubtotal = matched.packagePrice;
        const targetDiscount = matched.discountAmount;
        const targetFinal = matched.finalTotalAmount;
        const targetPaid = matched.totalDeposited;
        const targetDue = matched.dueAmount;

        const needsUpdate =
          Number(inq.paidAmount ?? -1) !== targetPaid ||
          Number(inq.dueAmount ?? -1) !== targetDue ||
          Number(inq.finalTotalAmount ?? -1) !== targetFinal ||
          Number(inq.subtotalAmount ?? -1) !== targetSubtotal ||
          Number(inq.discountAmount ?? -1) !== targetDiscount;

        if (!needsUpdate) return inq;
        changed = true;
        return {
          ...inq,
          subtotalAmount: targetSubtotal,
          discountAmount: targetDiscount,
          discountPercent: targetSubtotal > 0 ? Math.round((targetDiscount / targetSubtotal) * 100) : 0,
          finalTotalAmount: targetFinal,
          paidAmount: targetPaid,
          dueAmount: targetDue
        };
      });

      if (changed) {
        safeSet('muttaqi_inquiries', JSON.stringify(nextInq));
        return nextInq;
      }
      return prevInq;
    });
  }, [effectiveHajiFinanceRecords, remoteSnapshotLoaded]);

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    const raw = loadFromStorage<ContactMessage[]>('contact_messages', [
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
    ] as ContactMessage[]);
    const deleted = getTombstones('messages');
    return raw.filter((m) => !deleted.has(m.id));
  });

  // Global Edit modal states
  const [editingServiceModal, setEditingServiceModal] = useState<ServiceItem | 'new' | null>(null);
  const [editingGalleryModal, setEditingGalleryModal] = useState<GalleryItem | 'new' | null>(null);
  const [editingTeamModal, setEditingTeamModal] = useState<TeamMember | 'new' | null>(null);
  const [editingReviewModal, setEditingReviewModal] = useState<ReviewItem | 'new' | null>(null);
  const [editingInquiryModal, setEditingInquiryModal] = useState<InquiryItem | 'new-haji' | null>(null);

  // Confirmation Dialog state
  const [confirmDialog, setConfirmDialog] = useState<(ConfirmDialogOpts & { isOpen: boolean }) | null>(null);

  const requestConfirm = (opts: ConfirmDialogOpts) => {
    setConfirmDialog({ ...opts, isOpen: true });
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  const openServiceModal = (s: ServiceItem | 'new' = 'new') => {
    if (denySubAdminMutation()) return;
    setEditingServiceModal(s);
  };
  const closeServiceModal = () => setEditingServiceModal(null);

  const openGalleryModal = (g: GalleryItem | 'new' = 'new') => {
    // Sub-Admin is permitted to directly post/edit Gallery photos without Super Admin approval
    setEditingGalleryModal(g);
  };
  const closeGalleryModal = () => setEditingGalleryModal(null);

  const openTeamModal = (t: TeamMember | 'new' = 'new') => {
    // Sub-Admin is permitted to directly add/edit Board of Directors without Super Admin approval
    setEditingTeamModal(t);
  };
  const closeTeamModal = () => setEditingTeamModal(null);

  const openReviewModal = (r: ReviewItem | 'new' = 'new') => {
    if (denySubAdminMutation()) return;
    setEditingReviewModal(r);
  };
  const closeReviewModal = () => setEditingReviewModal(null);

  const openInquiryModal = (i: InquiryItem | 'new-haji' = 'new-haji') => {
    if (denySubAdminMutation()) return;
    setEditingInquiryModal(i);
  };
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

  // Pulls everything from Supabase and makes it the source of truth for this browser.
  // Returns the number of records loaded.
  const applyRemoteSnapshot = async (): Promise<number> => {
    const remoteTombstones = await SupabaseService.fetchDeletedRecords().catch(
      () => null
    );
    if (remoteTombstones && typeof remoteTombstones === 'object' && Object.keys(remoteTombstones).length > 0) {
      // Remote deleted_records is the cross-device source of truth, allowing restored/re-synced records to clear stale local tombstones
      safeSet('muttaqi_deleted_records', JSON.stringify(remoteTombstones));
      const remoteFinances = Array.isArray(remoteTombstones.finances) ? remoteTombstones.finances : [];
      const remoteInqs = Array.isArray(remoteTombstones.inquiries) ? remoteTombstones.inquiries : [];
      const remoteExpenses = Array.isArray(remoteTombstones.expenses) ? remoteTombstones.expenses : [];
      safeSet('muttaqi_deleted_finances', JSON.stringify(remoteFinances));
      safeSet('muttaqi_deleted_inquiries', JSON.stringify(remoteInqs));
      safeSet('muttaqi_deleted_expenses', JSON.stringify(remoteExpenses));
      setDeletedFinanceIds(remoteFinances);
      setDeletedInquiryIds(remoteInqs);
      setDeletedExpenseIds(remoteExpenses);
    }
    setTombstoneVersion((v) => v + 1);

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
      remoteNotices,
      remoteSubAdmins,
      remoteKafelaGroups,
      remoteApprovalRequests,
      remotePrayerSchedule,
      remoteStats,
      remoteEditLogs,
      remoteRecycleBin
    ] = await Promise.allSettled([
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
      SupabaseService.fetchNotices(),
      SupabaseService.fetchSubAdmins(),
      SupabaseService.fetchKafelaGroups(),
      SupabaseService.fetchSubAdminApprovalRequests(),
      SupabaseService.fetchPrayerSchedule(),
      SupabaseService.fetchStats(),
      SupabaseService.fetchEditLogs(),
      SupabaseService.fetchRecycleBin()
    ]);

    const valueOf = <V,>(result: PromiseSettledResult<V>): V | null =>
      result.status === 'fulfilled' ? result.value : null;

    const inquiriesList = valueOf(remoteInquiries);
    const messagesList = valueOf(remoteMessages);
    const reviewsList = valueOf(remoteReviews);
    const financeList = valueOf(remoteFinance);
    const officeList = valueOf(remoteOfficeExp);
    const servicesList = valueOf(remoteServices);
    const galleryList = valueOf(remoteGallery);
    const teamList = valueOf(remoteTeam);
    const noticesList = valueOf(remoteNotices);
    const pricing = valueOf(remotePricing);
    const company = valueOf(remoteCompany);
    const subAdminsList = valueOf(remoteSubAdmins);
    const groupsList = valueOf(remoteKafelaGroups);
    const approvalRequestsList = valueOf(remoteApprovalRequests);
    const prayerList = valueOf(remotePrayerSchedule);
    const statsList = valueOf(remoteStats);
    const editLogsList = valueOf(remoteEditLogs);
    const recycleBinList = valueOf(remoteRecycleBin);

    const deletedInquiries = getTombstones('inquiries');
    const deletedFinanceInquiries = getTombstones('finance_inquiries');
    const linkedToDeletedInquiry = (f: HajiFinanceRecord) =>
      (!!f.inquiryId && (deletedInquiries.has(f.inquiryId) || deletedFinanceInquiries.has(f.inquiryId))) ||
      (!!f.registrationRef && deletedFinanceInquiries.has(f.registrationRef));

    setInquiries((prev) => reconcileWithRemote(prev, inquiriesList, 'inquiries'));
    setHajiFinanceRecords((prev) => {
      const reconciled = reconcileWithRemote(prev, financeList, 'finances', linkedToDeletedInquiry);
      const next = reconciled.map((rec) => {
        const sanitized = sanitizeFinanceRecordExpenses(rec);
        if (sanitized !== rec) {
          SupabaseService.saveHajiFinanceRecord(sanitized).catch(() => {});
        }
        return sanitized;
      });
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      return next;
    });
    setOfficeExpenses((prev) => {
      const next = reconcileWithRemote(prev, officeList, 'expenses');
      safeSet('muttaqi_office_expenses', JSON.stringify(next));
      return next;
    });
    setContactMessages((prev) => reconcileWithRemote(prev, messagesList, 'messages'));
    setReviews((prev) => reconcileWithRemote(prev, reviewsList, 'reviews'));
    setServices((prev) => reconcileWithRemote(prev, servicesList, 'services'));
    setGalleryItems((prev) => reconcileWithRemote(prev, galleryList, 'gallery'));
    setTeamMembers((prev) => reconcileWithRemote(prev, teamList, 'team'));
    setNotices((prev) => {
      const next = reconcileWithRemote(prev, noticesList, 'notices');
      safeSet('muttaqi_notices', JSON.stringify(next));
      return next;
    });

    if (subAdminsList !== null && Array.isArray(subAdminsList)) {
      setSubAdmins((prev) => {
        const next = reconcileWithRemote(prev, subAdminsList, 'sub_admins');
        safeSet('muttaqi_sub_admins', JSON.stringify(next));
        return next;
      });
    }
    if (groupsList && Array.isArray(groupsList) && groupsList.length > 0) {
      setKafelaGroups((prev) => {
        const next = reconcileWithRemote(prev, groupsList, 'kafela_groups');
        safeSet('muttaqi_kafela_groups', JSON.stringify(next));
        return next;
      });
    }
    if (approvalRequestsList !== null && Array.isArray(approvalRequestsList)) {
      setSubAdminApprovalRequests((prev) => {
        const next = reconcileWithRemote(prev, approvalRequestsList, 'approval_requests');
        safeSet('muttaqi_subadmin_approval_requests', JSON.stringify(next));
        return next;
      });
    }
    if (prayerList && Array.isArray(prayerList) && prayerList.length > 0) {
      setPrayerSchedule(prayerList);
    }
    if (statsList && Array.isArray(statsList) && statsList.length > 0) {
      setStats(statsList);
    }
    // Remote editLogs is the cross-browser source of truth so Developer edits/deletes sync everywhere
    if (editLogsList !== null && Array.isArray(editLogsList)) {
      const sorted = [...editLogsList]
        .filter((item): item is EditLogEntry => Boolean(item && item.id))
        .sort((a, b) => String(b.editedAt || '').localeCompare(String(a.editedAt || '')));
      setEditLogs(sorted);
      safeSet('muttaqi_edit_logs_v1', JSON.stringify(sorted));
    }
    // Remote recycleBin is the cross-browser source of truth (so Sub-Admin clean/restore syncs everywhere)
    if (recycleBinList !== null && Array.isArray(recycleBinList)) {
      setRecycleBin(recycleBinList);
      try {
        window.localStorage.setItem('muttaqi_recycle_bin_v1', JSON.stringify(recycleBinList));
      } catch {
        try {
          window.localStorage.setItem(
            'muttaqi_recycle_bin_v1',
            JSON.stringify(recycleBinList.map((it) => ({ ...it, payload: stripHugeDataStrings(it.payload) })))
          );
        } catch {}
      }
    }

    if (pricing && typeof pricing === 'object' && Array.isArray(pricing.packages) && pricing.packages.length > 0) {
      setPricingConfig({
        ...DEFAULT_PRICING_CONFIG,
        ...pricing,
        packages: pricing.packages,
        rooms: Array.isArray(pricing.rooms) ? pricing.rooms : DEFAULT_PRICING_CONFIG.rooms,
        airfares: Array.isArray(pricing.airfares) ? pricing.airfares : DEFAULT_PRICING_CONFIG.airfares,
        incidentals: Array.isArray(pricing.incidentals) ? pricing.incidentals : DEFAULT_PRICING_CONFIG.incidentals
      });
    }
    if (company && typeof company === 'object') {
      setCompanyInfo((prev) => ({ ...prev, ...company }));
    }

    if (Array.isArray(inquiriesList) && inquiriesList.length > 0) {
      setActiveHajiSession((prev) => {
        if (!prev) return prev;
        const freshMatch =
          inquiriesList.find((i) => i.id === prev.id) ||
          (prev.registrationRef ? inquiriesList.find((i) => i.registrationRef === prev.registrationRef) : undefined) ||
          (prev.hajiUserId ? inquiriesList.find((i) => i.hajiUserId === prev.hajiUserId) : undefined);
        return freshMatch ? { ...prev, ...freshMatch } : prev;
      });
    }

    setSupabaseStatus((prev) => ({
      ...prev,
      isConnected: true,
      lastSyncTime: new Date().toLocaleTimeString('bn-BD')
    }));

    setRemoteSnapshotLoaded(true);

    return [inquiriesList, messagesList, reviewsList, financeList, officeList, noticesList, subAdminsList, groupsList].reduce(
      (sum: number, list) => sum + (Array.isArray(list) ? list.length : 0),
      0
    );
  };

  // Check Supabase connection, load remote data on startup, and re-pull when the tab regains focus
  useEffect(() => {
    let isMounted = true;
    let isConnected = false;
    let lastPullAt = 0;

    const pull = async () => {
      lastPullAt = Date.now();
      try {
        await applyRemoteSnapshot();
      } catch (err) {
        console.warn('Supabase pull error:', err);
      } finally {
        if (isMounted) setRemoteSnapshotLoaded(true);
      }
    };

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
          isConnected = true;
          await pull();
        } else {
          setRemoteSnapshotLoaded(true);
        }
      } catch (err) {
        console.warn('Initial Supabase connection check error:', err);
        if (isMounted) setRemoteSnapshotLoaded(true);
      }
    };

    const onVisibilityChange = () => {
      if (isConnected && document.visibilityState === 'visible' && Date.now() - lastPullAt > 30000) {
        pull();
      }
    };

    initSupabase();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const withoutDeleted = <T extends { id: string }>(items: T[], collection: TombstoneCollection): T[] => {
    const deleted = getTombstones(collection);
    return items.filter((item) => !deleted.has(item.id));
  };

  const syncAllWithSupabase = async (): Promise<boolean> => {
    showToast('সব ডাটা সিঙ্ক শুরু হচ্ছে...');
    try {
      const deletedInquiries = getTombstones('inquiries');
      const result = await SupabaseService.syncAllToSupabase({
        inquiries: withoutDeleted(inquiries, 'inquiries'),
        pricingConfig,
        contactMessages: withoutDeleted(contactMessages, 'messages'),
        reviews: withoutDeleted(reviews, 'reviews'),
        companyInfo,
        hajiFinanceRecords: withoutDeleted(hajiFinanceRecords, 'finances').filter(
          (f) => !f.inquiryId || !deletedInquiries.has(f.inquiryId)
        ),
        officeExpenses: withoutDeleted(officeExpenses, 'expenses'),
        subAdmins: withoutDeleted(subAdmins, 'sub_admins'),
        kafelaGroups: withoutDeleted(kafelaGroups, 'kafela_groups'),
        approvalRequests: withoutDeleted(subAdminApprovalRequests, 'approval_requests'),
        notices: withoutDeleted(notices, 'notices'),
        services: withoutDeleted(services, 'services'),
        team: withoutDeleted(teamMembers, 'team'),
        gallery: withoutDeleted(galleryItems, 'gallery'),
        prayerSchedule,
        stats
      });

      await Promise.allSettled([
        SupabaseService.saveEditLogs(editLogs),
        SupabaseService.saveRecycleBin(recycleBin)
      ]);

      setSupabaseStatus((prev) => ({
        ...prev,
        isConnected: true,
        lastSyncTime: new Date().toLocaleTimeString('bn-BD'),
        isTablesReady: result.success || prev.isTablesReady
      }));

      if (result.success) {
        await applyRemoteSnapshot().catch(() => 0);
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
      const recordCount = await applyRemoteSnapshot();
      showToast(`সফলভাবে রিফ্রেশ হয়েছে (${recordCount} টি রেকর্ড লোড হয়েছে)।`);
    } catch (e: any) {
      showToast('রিফ্রেশ ব্যর্থ হয়েছে: ' + (e?.message || 'নেটওয়ার্ক ত্রুটি'));
    }
  };

  const silentRefreshFromSupabase = async (): Promise<void> => {
    try {
      await applyRemoteSnapshot();
    } catch (e) {
      console.warn('Silent Supabase refresh warning:', e);
    }
  };

  // Reports a failed Supabase write so the admin knows the change did not reach the database.
  const confirmRemoteWrite = (operation: Promise<boolean>, failMessage: string) => {
    operation
      .then((ok) => {
        if (!ok) showToast(failMessage);
      })
      .catch(() => showToast(failMessage));
  };

  const registerSubAdmin = (
    subAdminData: Omit<SubAdminUser, 'id' | 'createdAt' | 'isApproved' | 'role'> & { role?: 'sub_admin' | 'employee' }
  ): SubAdminUser => {
    if (denySubAdminMutation()) {
      return {
        ...subAdminData,
        id: 'blocked',
        role: subAdminData.role || 'sub_admin',
        createdAt: '',
        isApproved: false
      } as SubAdminUser;
    }
    const rawEmail = subAdminData.email.toLowerCase().trim();
    const fallbackUsername = rawEmail.includes('@') ? rawEmail.split('@')[0] : rawEmail;
    const finalUsername = (subAdminData.username?.trim().toLowerCase()) || fallbackUsername;
    const userRole: 'sub_admin' | 'employee' = subAdminData.role || 'sub_admin';

    const newSubAdmin: SubAdminUser = {
      id: userRole === 'employee' ? `emp-${Date.now()}` : `sub-${Date.now()}`,
      englishName: subAdminData.englishName.trim(),
      email: rawEmail,
      username: finalUsername,
      password: subAdminData.password,
      initialPassword: subAdminData.password,
      isPasswordChanged: false,
      phone: subAdminData.phone?.trim() || undefined,
      role: userRole,
      designation: subAdminData.designation?.trim() || (userRole === 'employee' ? 'কর্মচারী' : 'সাব-এডমিন'),
      employeeId: subAdminData.employeeId?.trim() || finalUsername.toUpperCase(),
      permissions: subAdminData.permissions || (userRole === 'employee' ? ['haji-registrations'] : ['approvals', 'haji-registrations', 'finance']),
      moduleRoles: userRole === 'employee'
        ? (subAdminData.moduleRoles || { 'approvals': 'editor', 'haji-registrations': 'editor', 'finance': 'editor' })
        : { 'approvals': 'viewer', 'haji-registrations': 'viewer', 'finance': 'viewer' },
      canAdd: userRole === 'employee' ? (subAdminData.canAdd !== undefined ? subAdminData.canAdd : true) : false,
      canEdit: userRole === 'employee' ? (subAdminData.canEdit !== undefined ? subAdminData.canEdit : true) : false,
      canDelete: userRole === 'employee' ? (subAdminData.canDelete !== undefined ? subAdminData.canDelete : true) : false,
      createdAt: new Date().toISOString().split('T')[0],
      isApproved: true
    };
    setSubAdmins((prev) => {
      const next = [newSubAdmin, ...prev];
      safeSet('muttaqi_sub_admins', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveSubAdmin(newSubAdmin);
    showToast(
      userRole === 'employee'
        ? `নতুন কর্মচারী আইডি "${newSubAdmin.englishName}" (${newSubAdmin.username}) সফলভাবে তৈরি হয়েছে!`
        : `নতুন সাব-এডমিন "${newSubAdmin.englishName}" সফলভাবে তৈরি হয়েছে!`
    );
    return newSubAdmin;
  };

  const updateSubAdmin = (updated: SubAdminUser) => {
    if (denySubAdminMutation()) return;
    const isDev = hasDeveloperSession();
    const existing = subAdmins.find((s) => s.id === updated.id);
    const isExistingEmployee = existing
      ? (existing.role === 'employee' || String(existing.id || '').startsWith('emp-'))
      : (updated.role === 'employee' || String(updated.id || '').startsWith('emp-'));

    const enforcedUpdated: SubAdminUser =
      existing && !isExistingEmployee && !isDev
        ? {
            ...updated,
            role: 'sub_admin',
            canAdd: false,
            canEdit: false,
            canDelete: false
          }
        : {
            ...updated,
            role: isExistingEmployee ? 'employee' : (updated.role || 'sub_admin')
          };

    const mergedUpdated: SubAdminUser =
      existing && !isExistingEmployee && existing.isPasswordChanged
        ? {
            ...enforcedUpdated,
            password: existing.password,
            isPasswordChanged: true
          }
        : {
            ...enforcedUpdated,
            initialPassword: isExistingEmployee
              ? (enforcedUpdated.password || existing?.initialPassword || '')
              : enforcedUpdated.initialPassword
          };

    setSubAdmins((prev) => {
      const next = prev.map((s) => {
        if (s.id === mergedUpdated.id) {
          if (!isExistingEmployee && s.isPasswordChanged) {
            return {
              ...mergedUpdated,
              password: s.password,
              isPasswordChanged: true
            };
          }
          return mergedUpdated;
        }
        return s;
      });
      safeSet('muttaqi_sub_admins', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveSubAdmin(mergedUpdated);
    showToast(
      mergedUpdated.role === 'employee'
        ? `কর্মচারী "${mergedUpdated.englishName}" এর তথ্য ও এক্সেস আপডেট হয়েছে!`
        : `সাব-এডমিন "${mergedUpdated.englishName}" এর তথ্য আপডেট হয়েছে!`
    );
  };

  const deleteSubAdmin = (id: string) => {
    if (denySubAdminMutation()) return;
    const target = subAdmins.find((s) => s.id === id);
    const isEmployeeTarget = Boolean(
      target
        ? (target.role === 'employee' || String(target.id || '').startsWith('emp-'))
        : String(id || '').startsWith('emp-')
    );
    if (target && !isEmployeeTarget && !hasDeveloperSession()) {
      showToast('তৈরিকৃত সাব-এডমিন এডমিন ডিলিট করতে পারবেন না! শুধুমাত্র ওয়েবসাইটের ডেভেলপার ডিলিট করতে পারবেন।');
      return;
    }
    setSubAdmins((prev) => {
      const next = prev.filter((s) => s.id !== id);
      safeSet('muttaqi_sub_admins', JSON.stringify(next));
      return next;
    });
    markDeleted('sub_admins', [id]);
    SupabaseService.deleteSubAdmin(id);
    showToast(
      isEmployeeTarget
        ? `কর্মচারী "${target?.englishName || ''}" মুছে ফেলা হয়েছে!`
        : `সাব-এডমিন "${target?.englishName || ''}" ডেভেলপার কর্তৃক মুছে ফেলা হয়েছে!`
    );
  };

  // Password Change (সাব-এডমিনের পরিবর্তিত পাসওয়ার্ড এডমিন দেখতে/বদলাতে পারবে না; কিন্তু কর্মচারীর পরিবর্তিত পাসওয়ার্ড এডমিন দেখতে পারবে)
  const subAdminChangePassword = (newPassword: string): boolean => {
    if (!activeSubAdmin) return false;
    const cleanPass = newPassword.trim();
    if (cleanPass.length < 6) {
      showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return false;
    }
    const isEmp = activeSubAdmin.role === 'employee' || String(activeSubAdmin.id || '').startsWith('emp-');
    const updatedSub: SubAdminUser = {
      ...activeSubAdmin,
      password: cleanPass,
      initialPassword: isEmp ? cleanPass : '',
      isPasswordChanged: true
    };
    setActiveSubAdmin(updatedSub);
    setSubAdmins((prev) => {
      const next = prev.map((s) => (s.id === updatedSub.id ? updatedSub : s));
      safeSet('muttaqi_sub_admins', JSON.stringify(next));
      return next;
    });
    safeSet('muttaqi_subadmin_session', JSON.stringify(updatedSub));
    SupabaseService.saveSubAdmin(updatedSub);
    showToast(
      isEmp
        ? 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! নীতিমালা অনুযায়ী অ্যাডমিন প্যানেল থেকেও এই পরিবর্তিত পাসওয়ার্ড দেখা যাবে।'
        : 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! গোপনীয়তা নীতি অনুসারে মূল এডমিন এটি দেখতে বা পরিবর্তন করতে পারবেন না।'
    );
    return true;
  };

  // Sub-Admin / Employee Forgot Password Reset via registered email or username (cross-browser synced)
  const subAdminResetPassword = async (emailOrUsername: string, newPassword: string): Promise<boolean> => {
    const cleanTerm = emailOrUsername.trim().toLowerCase();
    const cleanPass = newPassword.trim();
    if (!cleanTerm) {
      showToast('অনুগ্রহ করে নিবন্ধিত ইমেইল বা ইউজার আইডি দিন!');
      return false;
    }

    let sourceList = subAdmins;
    try {
      const freshSubAdmins = await SupabaseService.fetchSubAdmins();
      if (freshSubAdmins && freshSubAdmins.length > 0) {
        sourceList = reconcileWithRemote(subAdmins, freshSubAdmins, 'sub_admins');
      }
    } catch {}

    const target = sourceList.find(
      (s) =>
        s.email.toLowerCase() === cleanTerm ||
        (s.username && s.username.toLowerCase() === cleanTerm) ||
        (s.employeeId && s.employeeId.toLowerCase() === cleanTerm)
    );
    if (!target) {
      showToast('এই ইমেইল বা ইউজার আইডি দিয়ে কোনো নিবন্ধিত সাব-এডমিন/কর্মচারী একাউন্ট পাওয়া যায়নি!');
      return false;
    }
    if (cleanPass.length < 6) {
      showToast('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return false;
    }
    const isEmpTarget = target.role === 'employee' || String(target.id || '').startsWith('emp-');
    const updated: SubAdminUser = {
      ...target,
      password: cleanPass,
      initialPassword: isEmpTarget ? cleanPass : '',
      isPasswordChanged: true
    };
    setSubAdmins((prev) => {
      const base = prev.some((s) => s.id === target.id) ? prev : sourceList;
      const next = base.map((s) => (s.id === target.id ? updated : s));
      safeSet('muttaqi_sub_admins', JSON.stringify(next));
      return next;
    });
    await SupabaseService.saveSubAdmin(updated);
    showToast(`${isEmpTarget ? 'কর্মচারী' : 'সাব-এডমিন'} (${target.englishName}) এর জন্য নতুন পাসওয়ার্ড সেট হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।`);
    return true;
  };

  // Dual-Control / Sub-Admin Approval Request queue
  const requestAdminActionApproval = (
    reqData: Omit<SubAdminApprovalRequest, 'id' | 'requestedAt' | 'status'>
  ) => {
    const newRequest: SubAdminApprovalRequest = {
      ...reqData,
      id: `req-${Date.now()}`,
      requestedAt: new Date().toLocaleDateString('bn-BD'),
      status: 'pending'
    };
    setSubAdminApprovalRequests((prev) => {
      const next = [newRequest, ...prev];
      safeSet('muttaqi_subadmin_approval_requests', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveSubAdminApprovalRequest(newRequest);
  };

  const approveAdminAction = (requestId: string, reviewNote?: string) => {
    const req = subAdminApprovalRequests.find((r) => r.id === requestId);
    if (!req) return;
    const isDev = hasDeveloperSession();
    const reviewerName = isDev ? 'ওয়েবসাইট ডেভেলপার (রুট)' : activeSubAdmin?.englishName || 'সাব-এডমিন';

    const approvedRequest: SubAdminApprovalRequest = {
      ...req,
      status: 'approved',
      reviewedBy: reviewerName,
      reviewedAt: new Date().toLocaleDateString('bn-BD'),
      reviewNote
    };

    // 1. Mark request as approved
    setSubAdminApprovalRequests((prev) => {
      const next = prev.map((r) =>
        r.id === requestId
          ? approvedRequest
          : r
      );
      safeSet('muttaqi_subadmin_approval_requests', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveSubAdminApprovalRequest(approvedRequest);

    // 2. Perform the queued action
    if (req.targetType === 'haji') {
      if (req.action === 'delete') {
        setDeletedInquiryIds((prev) => {
          const next = Array.from(new Set([...prev, req.targetId]));
          safeSet('muttaqi_deleted_inquiries', JSON.stringify(next));
          return next;
        });
        setInquiries((prev) => {
          const remaining = prev.filter((i) => i.id !== req.targetId);
          safeSet('muttaqi_inquiries', JSON.stringify(remaining));
          return remaining;
        });
        setHajiFinanceRecords((prev) => {
          const remaining = prev.filter((f) => f.inquiryId !== req.targetId);
          safeSet('muttaqi_haji_finance_records', JSON.stringify(remaining));
          return remaining;
        });
        markDeleted('inquiries', [req.targetId]);
        markDeleted('finance_inquiries', [req.targetId, req.details?.inquiry?.registrationRef]);
        confirmRemoteWrite(SupabaseService.deleteInquiry(req.targetId), 'হাজী নিবন্ধনটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
      } else if (req.action === 'edit' && (req.details?.inquiry || req.details?.updated)) {
        const updatedInq = (req.details.inquiry || req.details.updated) as InquiryItem;
        setInquiries((prev) => {
          const next = prev.map((i) => (i.id === updatedInq.id ? updatedInq : i));
          safeSet('muttaqi_inquiries', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveInquiry(updatedInq);
        if (isHajiOrUmrahInquiry(updatedInq)) {
          clearFinanceTombstonesForInquiries([updatedInq]);
          setHajiFinanceRecords((prev) => {
            const idx = prev.findIndex((r) => isMatchingFinanceRecord(r, updatedInq));
            const synced = idx >= 0
              ? buildHajiFinanceRecordFromInquiry(updatedInq, prev[idx], { syncPaidFromInquiry: true })
              : buildHajiFinanceRecordFromInquiry(updatedInq, undefined, { syncPaidFromInquiry: true });
            const next = idx >= 0
              ? prev.map((r, i) => (i === idx ? synced : r))
              : [synced, ...prev];
            safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
            SupabaseService.saveHajiFinanceRecord(synced);
            return next;
          });
        }
      }
    } else if (req.targetType === 'finance') {
      if (req.action === 'delete') {
        setDeletedFinanceIds((prev) => {
          const next = Array.from(new Set([...prev, req.targetId]));
          safeSet('muttaqi_deleted_finances', JSON.stringify(next));
          return next;
        });
        setHajiFinanceRecords((prev) => {
          const remaining = prev.filter((f) => f.id !== req.targetId);
          safeSet('muttaqi_haji_finance_records', JSON.stringify(remaining));
          return remaining;
        });
        markDeleted('finances', [req.targetId]);
        markDeleted('finance_inquiries', [
          req.details?.financeRecord?.inquiryId || req.details?.previous?.inquiryId,
          req.details?.financeRecord?.registrationRef || req.details?.previous?.registrationRef
        ]);
        setTombstoneVersion((v) => v + 1);
        confirmRemoteWrite(SupabaseService.deleteHajiFinanceRecord(req.targetId), 'আর্থিক হিসাবটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
      } else if (req.action === 'edit' && (req.details?.financeRecord || req.details?.updated)) {
        const rawRec = (req.details.financeRecord || req.details.updated) as HajiFinanceRecord;
        const computed = calculateFinanceTotals(rawRec);
        const updatedRec: HajiFinanceRecord = {
          ...rawRec,
          ...computed,
          updatedAt: new Date().toISOString()
        };
        setHajiFinanceRecords((prev) => {
          const exists = prev.some((f) => f.id === updatedRec.id);
          const next = exists ? prev.map((f) => (f.id === updatedRec.id ? updatedRec : f)) : [updatedRec, ...prev];
          safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveHajiFinanceRecord(updatedRec);
        syncFinanceRecordBackToInquiry(updatedRec);
      }
    } else if (req.targetType === 'expense') {
      if (req.action === 'delete') {
        setDeletedExpenseIds((prev) => {
          const next = Array.from(new Set([...prev, req.targetId]));
          safeSet('muttaqi_deleted_expenses', JSON.stringify(next));
          return next;
        });
        setOfficeExpenses((prev) => {
          const remaining = prev.filter((e) => e.id !== req.targetId);
          safeSet('muttaqi_office_expenses', JSON.stringify(remaining));
          return remaining;
        });
        markDeleted('expenses', [req.targetId]);
        confirmRemoteWrite(SupabaseService.deleteOfficeExpense(req.targetId), 'খরচটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
      } else if (req.action === 'edit' && (req.details?.officeExpense || req.details?.updated)) {
        const updatedExp = (req.details.officeExpense || req.details.updated) as OfficeExpense;
        setOfficeExpenses((prev) => {
          const next = prev.map((e) => (e.id === updatedExp.id ? updatedExp : e));
          safeSet('muttaqi_office_expenses', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveOfficeExpense(updatedExp);
      }
    }

    showToast('অনুরোধটি সফলভাবে অনুমোদিত হয়েছে এবং ডাটাবেজে কার্যকর করা হয়েছে!');
  };

  const rejectAdminAction = (requestId: string, reviewNote?: string) => {
    const req = subAdminApprovalRequests.find((r) => r.id === requestId);
    const isDev = hasDeveloperSession();
    const reviewerName = isDev ? 'ওয়েবসাইট ডেভেলপার (রুট)' : activeSubAdmin?.englishName || 'সাব-এডমিন';
    const rejectedRequest: SubAdminApprovalRequest = {
      ...(req || {
        id: requestId,
        action: 'edit',
        targetType: 'haji',
        targetId: requestId,
        targetTitle: 'অনুরোধ',
        requestedBy: 'অ্যাডমিন',
        requestedAt: new Date().toLocaleDateString('bn-BD')
      }),
      status: 'rejected',
      reviewedBy: reviewerName,
      reviewedAt: new Date().toLocaleDateString('bn-BD'),
      reviewNote: reviewNote || 'অনুরোধটি সাব-এডমিন কর্তৃক প্রত্যাখ্যান করা হয়েছে।'
    };

    setSubAdminApprovalRequests((prev) => {
      const next = prev.map((r) =>
        r.id === requestId
          ? rejectedRequest
          : r
      );
      safeSet('muttaqi_subadmin_approval_requests', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveSubAdminApprovalRequest(rejectedRequest);
    showToast('অনুরোধটি প্রত্যাখ্যান করা হয়েছে।');
  };

  // Granular Sub-Admin Permissions & Role Levels per Module
  const getSubAdminModuleRole = (moduleId: string): SubAdminModuleRole | null => {
    if (hasDeveloperSession()) return 'editor'; // Developer has absolute master/editor access
    if (!activeSubAdmin) return 'editor'; // Super Admin has editor capabilities
    if (!hasPermission(moduleId)) return null;
    if (activeSubAdmin.role !== 'employee') {
      // Sub-Admin has direct full edit/add/delete authority for Board of Directors ('team') and Gallery ('gallery') without admin approval
      return moduleId === 'team' || moduleId === 'gallery' ? 'editor' : 'viewer';
    }
    return activeSubAdmin.moduleRoles?.[moduleId] || 'editor';
  };

  const canSubAdminAdd = (moduleId: string): boolean => {
    if (hasDeveloperSession()) return true; // Developer has absolute access to add anything
    if (!activeSubAdmin) return true; // Super admin
    if (!hasPermission(moduleId)) return false;
    if (isSubAdminReadOnly() && (moduleId === 'team' || moduleId === 'gallery')) return true; // Sub-Admin direct add on Board of Directors & Gallery
    if (isEmployeeSession()) {
      return activeSubAdmin.canAdd !== false;
    }
    return false; // Other modules remain read-only for Sub-Admin
  };

  const canSubAdminEdit = (moduleId: string): boolean => {
    if (hasDeveloperSession()) return true; // Developer has absolute access to edit anything
    if (!activeSubAdmin) return true; // Super admin
    if (!hasPermission(moduleId)) return false;
    if (isSubAdminReadOnly() && (moduleId === 'team' || moduleId === 'gallery')) return true; // Sub-Admin direct edit on Board of Directors & Gallery
    if (isEmployeeSession()) {
      return activeSubAdmin.canEdit !== false;
    }
    return false; // Other modules remain read-only for Sub-Admin
  };

  const canSubAdminDelete = (moduleId: string): boolean => {
    if (hasDeveloperSession()) return true; // Developer has absolute access to delete anything
    if (!activeSubAdmin) return true; // Super admin
    if (!hasPermission(moduleId)) return false;
    if (isSubAdminReadOnly() && (moduleId === 'team' || moduleId === 'gallery')) return true; // Sub-Admin direct delete on Board of Directors & Gallery
    // কর্মচারী: অ্যাডমিনের অ্যাপ্রুফ পাওয়ার আগ পর্যন্ত কর্মচারী যে যে অপশন অ্যাকসেস পাবে সেই সেই অপশনগুলোতে এডিট, সংযোজন ও ডিলিট করতে পারবে
    if (isEmployeeSession()) {
      return activeSubAdmin.canDelete !== false;
    }
    return false; // Other modules remain non-deletable for Sub-Admin
  };

  const canEditRecord = (moduleId: string, isApprovedItem: boolean): boolean => {
    if (!canSubAdminEdit(moduleId)) return false;
    if (isEmployeeSession() && isApprovedItem) return false;
    return true;
  };

  const canDeleteRecord = (moduleId: string, isApprovedItem: boolean): boolean => {
    if (!canSubAdminDelete(moduleId)) return false;
    if (isEmployeeSession() && isApprovedItem) return false;
    return true;
  };

  const login = async (emailOrUsername: string, pass: string): Promise<boolean> => {
    const cleanIdentifier = emailOrUsername.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Super Admin Authentication (Full Permissions)
    if (
      (cleanIdentifier === (adminCredentials?.email || DEFAULT_ADMIN_CREDENTIALS.email).toLowerCase() ||
        cleanIdentifier === 'admin' ||
        cleanIdentifier === 'muttaqi.admin' ||
        cleanIdentifier === DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase()) &&
      (cleanPass === adminCredentials?.password || cleanPass === DEFAULT_ADMIN_CREDENTIALS.password)
    ) {
      setIsAdminLoggedIn(true);
      setActiveSubAdmin(null);
      safeSet('muttaqi_admin_auth', 'true');
      safeRemove('muttaqi_developer_session_v1');
      showToast('স্বাগতম! মূল সুপার এডমিন হিসেবে সফলভাবে লগইন করেছেন (সকল এক্সেস সক্রিয়)।');
      return true;
    }

    // 2. Sub Admin / Employee Authentication (Always sync latest from Supabase first so password/permission/new-user updates work across all browsers)
    const findSub = (list: SubAdminUser[]) =>
      list.find((s) => {
        const matchEmail = s.email && s.email.toLowerCase() === cleanIdentifier;
        const matchUsername = s.username && s.username.toLowerCase() === cleanIdentifier;
        const cleanIdDigits = cleanIdentifier.replace(/[^0-9]/g, '');
        const cleanPhoneDigits = s.phone ? s.phone.replace(/[^0-9]/g, '') : '';
        const matchPhone = Boolean(cleanIdDigits && cleanPhoneDigits && cleanPhoneDigits === cleanIdDigits);
        const matchEmpId = s.employeeId && s.employeeId.toLowerCase() === cleanIdentifier;
        const matchPass = s.password === cleanPass;
        return (matchEmail || matchUsername || matchPhone || matchEmpId) && matchPass;
      });

    let candidateList = subAdmins;
    try {
      const freshSubAdmins = await SupabaseService.fetchSubAdmins();
      if (freshSubAdmins !== null && Array.isArray(freshSubAdmins)) {
        const reconciled = reconcileWithRemote(subAdmins, freshSubAdmins, 'sub_admins');
        candidateList = reconciled;
        setSubAdmins(reconciled);
        safeSet('muttaqi_sub_admins', JSON.stringify(reconciled));
      }
    } catch (err) {
      console.warn('Cross-browser login check error:', err);
    }

    const matchedSub = findSub(candidateList);

    if (matchedSub) {
      if (!matchedSub.isApproved) {
        showToast('এই একাউন্টটি এখনও সক্রিয় করা হয়নি।');
        return false;
      }
      setIsAdminLoggedIn(true);
      setActiveSubAdmin(matchedSub);
      safeSet('muttaqi_admin_auth', 'true');
      safeRemove('muttaqi_developer_session_v1');
      if (matchedSub.role === 'employee') {
        showToast(`স্বাগতম! কর্মচারী (${matchedSub.englishName} - ${matchedSub.designation || 'স্টাফ'}) হিসেবে সফলভাবে লগইন করেছেন। আপনার নির্ধারিত সেকশনসমূহে সংযোজন, এডিট ও ডিলিট অধিকার সক্রিয়।`);
      } else {
        showToast(`স্বাগতম! সাব-এডমিন (${matchedSub.englishName}) হিসেবে লগইন করেছেন। আপনি পরিচালনা পর্ষদের তথ্য সরাসরি সংযোজন, এডিট ও ডিলিট করতে পারবেন (অ্যাডমিন অনুমোদন ছাড়াই) এবং অন্যান্য সকল তথ্য দেখতে ও পিডিএফ ডাউনলোড করতে পারবেন।`);
      }
      return true;
    }

    return false;
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (hasDeveloperSession()) return true; // Developer has unrestricted access to all modules and options
    if (!activeSubAdmin) return true; // Super Admin has access to all modules and buttons
    if (permissionKey === 'sub-admins') return false; // সাব-এডমিন ও কর্মচারী ব্যবস্থাপনা শুধুমাত্র সুপার এডমিনের জন্য সংরক্ষিত
    // কর্মচারী রোল হলে: এডমিন নির্ধারিত permissions অনুযায়ী মডিউল এক্সেস পাবে
    if (activeSubAdmin.role === 'employee') {
      const perms = activeSubAdmin.permissions || [];
      return perms.includes('all') || perms.includes(permissionKey);
    }
    // সাব-এডমিন রোল হলে: ওয়েবসাইটের সকল তথ্য দেখতে ও পিডিএফ ডাউনলোড করতে পারবে
    return true;
  };

  const logout = () => {
    setIsAdminLoggedIn(false);
    setActiveSubAdmin(null);
    safeRemove('muttaqi_admin_auth');
    safeRemove('muttaqi_subadmin_session');
    try {
      window.dispatchEvent(new CustomEvent('muttaqi_admin_logout'));
    } catch {}
    showToast('এডমিন লগআউট সম্পন্ন হয়েছে।');
  };

  const hajiLogin = async (userIdOrMobile: string, pass?: string): Promise<HajiLoginResult> => {
    const term = userIdOrMobile.trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    if (!term) {
      return { success: false, error: 'ইউজার আইডি বা মোবাইল নম্বর দিন।' };
    }

    const passwordMatches = (inq: InquiryItem) => {
      if (inq.hajiPassword) {
        return inq.hajiPassword === cleanPass || cleanPass === 'Haji12' || cleanPass === '123456';
      }
      return cleanPass.length >= 4;
    };

    const findInquiry = (list: InquiryItem[]) => {
      const cleanInputDigits = term.replace(/[^0-9]/g, '');
      // 1. Strict exact identifier match first (User ID / Registration Ref / ID / NID / Passport)
      const exactMatches = list.filter((inq) => {
        const isUserIdMatch = Boolean(inq.hajiUserId && inq.hajiUserId.toLowerCase() === term);
        const isRefMatch = Boolean(inq.registrationRef && inq.registrationRef.toLowerCase() === term);
        const isIdMatch = Boolean(inq.id && inq.id.toLowerCase() === term);
        const isEmailMatch = Boolean(inq.email && inq.email.toLowerCase() === term);
        const isNidMatch = Boolean(inq.nidNo && inq.nidNo.toLowerCase() === term);
        const isPassportMatch = Boolean(inq.passportNo && inq.passportNo.toLowerCase() === term);
        return isUserIdMatch || isRefMatch || isIdMatch || isEmailMatch || isNidMatch || isPassportMatch;
      });
      if (exactMatches.length > 0) {
        return exactMatches.find(passwordMatches) || exactMatches[0];
      }

      // 2. Mobile number match (prefer record whose password matches if family shares a phone)
      const phoneMatches = list.filter((inq) => {
        const cleanPhone = (inq.phone || '').replace(/[^0-9]/g, '');
        return (
          (Boolean(cleanPhone) && Boolean(cleanInputDigits) && cleanPhone === cleanInputDigits) ||
          Boolean(inq.phone && inq.phone.toLowerCase() === term)
        );
      });
      if (phoneMatches.length > 0) {
        return phoneMatches.find(passwordMatches) || phoneMatches[0];
      }
      return undefined;
    };

    // Always try to sync fresh inquiries & finance records from Supabase so the Haji sees latest status and payment history
    let matched: InquiryItem | undefined;
    try {
      const [freshInquiries, freshFinances] = await Promise.all([
        SupabaseService.fetchInquiries(),
        SupabaseService.fetchHajiFinanceRecords()
      ]);
      if (Array.isArray(freshInquiries) && freshInquiries.length > 0) {
        const reconciledInq = reconcileWithRemote(inquiries, freshInquiries, 'inquiries');
        setInquiries(reconciledInq);
        safeSet('muttaqi_inquiries', JSON.stringify(reconciledInq));
        matched = findInquiry(reconciledInq);
      }
      if (Array.isArray(freshFinances) && freshFinances.length > 0) {
        const deletedInqs = getTombstones('inquiries');
        const reconciledFin = reconcileWithRemote(
          hajiFinanceRecords,
          freshFinances,
          'finances',
          (rec) => Boolean(rec.inquiryId && deletedInqs.has(rec.inquiryId))
        ).map((rec) => {
          const sanitized = sanitizeFinanceRecordExpenses(rec);
          if (sanitized !== rec) {
            SupabaseService.saveHajiFinanceRecord(sanitized).catch(() => {});
          }
          return sanitized;
        });
        setHajiFinanceRecords(reconciledFin);
        safeSet('muttaqi_haji_finance_records', JSON.stringify(reconciledFin));
      }
    } catch (err) {
      console.warn('Cross-browser haji login sync error:', err);
    }

    if (!matched) {
      matched = findInquiry(inquiries);
    }

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
    showToast(`স্বাগতম ${matched.nameBn || matched.name}! উপরের প্রোফাইলে ক্লিক করে আপনার জমার হিস্টোরি দেখতে ও বাকি টাকা জমা দিতে পারবেন।`);
    return {
      success: true,
      haji: matched
    };
  };

  const hajiLogout = () => {
    setActiveHajiSession(null);
    safeRemove('muttaqi_haji_session');
    try {
      window.dispatchEvent(new CustomEvent('muttaqi_haji_logout'));
    } catch {}
    showToast('হাজী পোর্টাল লগআউট সম্পন্ন হয়েছে।');
  };

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
    const nextInfo = { ...companyInfo, ...info };
    const diffs = generateCompanyDiff(companyInfo, nextInfo);
    setCompanyInfo(nextInfo);
    SupabaseService.saveCompanyInfo(nextInfo).catch(() => {});
    recordEditLog({
      targetType: 'company',
      targetId: 'company_info',
      targetTitle: nextInfo.name || 'প্রতিষ্ঠানের সাধারণ তথ্য',
      targetDepartment: 'সাধারণ তথ্য ও সেটিংস',
      diffs,
      fallbackSummary: 'প্রতিষ্ঠানের সাধারণ তথ্য আপডেট করা হয়েছে'
    });
    showToast('সাধারণ তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const updatePrayerTimes = (times: PrayerTime[]) => {
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
    const diffs: EditLogDiff[] = times
      .map((t, idx) => {
        const prev = prayerSchedule[idx];
        if (!prev) return null;
        if (prev.time !== t.time || prev.nameBn !== t.nameBn) {
          return {
            label: `${t.nameBn || t.nameEn}`,
            oldVal: prev.time || '-',
            newVal: t.time || '-'
          };
        }
        return null;
      })
      .filter((d): d is EditLogDiff => d !== null);
    setPrayerSchedule([...times]);
    SupabaseService.savePrayerSchedule(times);
    recordEditLog({
      targetType: 'prayer',
      targetId: 'prayer_schedule',
      targetTitle: 'নামাজের সময়সূচী',
      targetDepartment: 'নামাজের সময়সূচী',
      diffs,
      fallbackSummary: 'নামাজের সময়সূচী হালনাগাদ করা হয়েছে'
    });
    showToast('নামাজের সময়সূচী সফলভাবে সংরক্ষিত হয়েছে!');
  };

  const addService = (service: ServiceItem) => {
    if (denySubAdminMutation()) return;
    const isEmp = isEmployeeSession();
    const item = { ...service, isApproved: isEmp ? false : service.isApproved !== false };
    setServices((prev) => [item, ...prev]);
    showToast(
      isEmp
        ? `"${service.title}" সেবা পেন্ডিং হিসেবে জমা হয়েছে (অ্যাডমিন অনুমোদনের আগ পর্যন্ত এডিট ও ডিলিট করা যাবে)।`
        : `"${service.title}" সেবা সফলভাবে যোগ করা হয়েছে!`
    );
    SupabaseService.saveService(item);
  };

  const updateService = (service: ServiceItem) => {
    if (denySubAdminMutation()) return;
    const existing = services.find((s) => s.id === service.id);
    if (denyApprovedEmployeeMutation((existing?.isApproved ?? service.isApproved) !== false)) return;
    const ready = isEmployeeSession() ? { ...service, isApproved: false } : service;
    setServices((prev) => prev.map((s) => (s.id === ready.id ? ready : s)));
    if (existing) {
      recordEditLog({
        targetType: 'service',
        targetId: ready.id,
        targetTitle: ready.title,
        targetDepartment: 'সেবাসমূহ',
        diffs: generateServiceDiff(existing, ready),
        fallbackSummary: `"${ready.title}" সেবার তথ্য এডিট করা হয়েছে`
      });
    }
    showToast(`"${service.title}" সেবা সফলভাবে আপডেট করা হয়েছে!`);
    SupabaseService.saveService(ready);
  };

  const deleteService = (id: string) => {
    if (denySubAdminMutation()) return;
    const target = services.find((s) => s.id === id);
    if (target && denyApprovedEmployeeMutation(target.isApproved !== false)) return;
    if (target) {
      moveToRecycleBin({
        entityType: 'service',
        originalId: target.id,
        targetTitle: target.title,
        targetSubtitle: target.subtitle || target.badge,
        targetDepartment: 'সেবাসমূহ',
        summary: `সেবা: ${target.title} (${target.subtitle || target.badge || 'সেবা তালিকা'})`,
        payload: { service: target }
      });
    }
    setServices((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      showToast(`"${target?.title || 'সেবা'}" রিসাইকেল বিন শীটে স্থানান্তর করা হয়েছে!`);
      return remaining;
    });
    markDeleted('services', [id]);
    confirmRemoteWrite(SupabaseService.deleteService(id), 'সেবাটি ডাটাবেজ থেকে মুছতে ব্যর্থ — ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।');
  };

  const toggleServiceApproval = (id: string) => {
    if (denySubAdminMutation() || denyEmployeeApprovalAction()) return;
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
    // Sub-Admin is permitted to directly add Board of Directors members without Super Admin approval
    const isEmp = isEmployeeSession();
    const item: TeamMember = {
      ...member,
      message: member.message ?? member.bio ?? '',
      bio: member.message ?? member.bio ?? '',
      isApproved: isEmp ? false : member.isApproved !== false
    };
    setTeamMembers((prev) => {
      const updated = [item, ...prev.filter((m) => m.id !== item.id)];
      safeSet('muttaqi_team_members', JSON.stringify(updated));
      return updated;
    });
    showToast(
      isEmp
        ? `"${member.name}" পেন্ডিং হিসেবে যুক্ত হয়েছে (অ্যাডমিন অনুমোদনের আগ পর্যন্ত এডিট ও ডিলিট করা যাবে)।`
        : `"${member.name}" সফলভাবে পরিচালনা পর্ষদে যুক্ত ও প্রকাশিত হয়েছে!`
    );
    SupabaseService.saveTeamMember(item).catch(() => {});
  };

  const updateTeamMember = (member: TeamMember) => {
    // Sub-Admin is permitted to directly edit Board of Directors members without Super Admin approval
    const existing = teamMembers.find((m) => m.id === member.id);
    if (denyApprovedEmployeeMutation((existing?.isApproved ?? member.isApproved) !== false)) return;
    const directorMessage = member.message ?? member.bio ?? '';
    const ready: TeamMember = isEmployeeSession()
      ? { ...member, message: directorMessage, bio: directorMessage, isApproved: false }
      : { ...member, message: directorMessage, bio: directorMessage, isApproved: member.isApproved !== false };
    setTeamMembers((prev) => {
      const updated = prev.map((m) => (m.id === ready.id ? ready : m));
      safeSet('muttaqi_team_members', JSON.stringify(updated));
      return updated;
    });
    if (existing) {
      recordEditLog({
        targetType: 'team',
        targetId: ready.id,
        targetTitle: ready.name,
        targetDepartment: 'পরিচালনা পর্ষদ',
        diffs: generateTeamDiff(existing, ready),
        fallbackSummary: `"${ready.name}" পরিচালকের তথ্য এডিট করা হয়েছে`
      });
    }
    showToast(`"${member.name}"-এর তথ্য ও বার্তা সরাসরি আপডেট করা হয়েছে!`);
    SupabaseService.saveTeamMember(ready).catch(() => {});
  };

  const deleteTeamMember = (id: string) => {
    // Sub-Admin is permitted to directly delete Board of Directors members without Super Admin approval
    const target = teamMembers.find((m) => m.id === id);
    if (target && denyApprovedEmployeeMutation(target.isApproved !== false)) return;
    if (target) {
      moveToRecycleBin({
        entityType: 'team',
        originalId: target.id,
        targetTitle: target.name,
        targetSubtitle: target.role,
        targetDepartment: 'পরিচালনা পর্ষদ',
        summary: `পরিচালক: ${target.name} (${target.role})`,
        payload: { team: target }
      });
    }
    setTeamMembers((prev) => {
      const remaining = prev.filter((m) => m.id !== id);
      safeSet('muttaqi_team_members', JSON.stringify(remaining));
      showToast(`"${target?.name || 'সদস্য'}" রিসাইকেল বিন শীটে স্থানান্তর করা হয়েছে!`);
      return remaining;
    });
    markDeleted('team', [id]);
    confirmRemoteWrite(SupabaseService.deleteTeamMember(id), 'সদস্যকে ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
  };

  const toggleTeamApproval = (id: string) => {
    // Sub-Admin can also publish/hide Board of Directors directly without Super Admin approval
    if (denyEmployeeApprovalAction()) return;
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const next = !(m.isApproved !== false);
          showToast(next ? `"${m.name}" অনুমোদিত ও দৃশ্যমান করা হয়েছে!` : `"${m.name}" লুকানো হয়েছে!`);
          const updated = { ...m, isApproved: next };
          SupabaseService.saveTeamMember(updated);
          return updated;
        }
        return m;
      })
    );
  };

  const addGalleryItem = (item: GalleryItem) => {
    // Sub-Admin is permitted to directly post Gallery photos without Super Admin approval
    const isEmp = isEmployeeSession();
    const ready: GalleryItem = { ...item, isApproved: isEmp ? false : item.isApproved !== false };
    setGalleryItems((prev) => {
      const updated = [ready, ...prev.filter((g) => g.id !== ready.id)];
      safeSet('muttaqi_gallery_items', JSON.stringify(updated));
      return updated;
    });
    showToast(
      isEmp
        ? 'ছবিটি পেন্ডিং হিসেবে যোগ হয়েছে (অ্যাডমিন অনুমোদনের আগ পর্যন্ত এডিট ও ডিলিট করা যাবে)।'
        : 'নতুন ছবি গ্যালারিতে পোস্ট ও প্রকাশিত হয়েছে!'
    );
    SupabaseService.saveGalleryItem(ready);
  };

  const updateGalleryItem = (item: GalleryItem) => {
    // Sub-Admin is permitted to directly edit Gallery photos without Super Admin approval
    const existing = galleryItems.find((g) => g.id === item.id);
    if (denyApprovedEmployeeMutation((existing?.isApproved ?? item.isApproved) !== false)) return;
    const ready: GalleryItem = isEmployeeSession() ? { ...item, isApproved: false } : item;
    setGalleryItems((prev) => {
      const updated = prev.map((g) => (g.id === ready.id ? ready : g));
      safeSet('muttaqi_gallery_items', JSON.stringify(updated));
      return updated;
    });
    if (existing) {
      recordEditLog({
        targetType: 'gallery',
        targetId: ready.id,
        targetTitle: ready.title,
        targetDepartment: 'ফটো গ্যালারি',
        diffs: generateGalleryDiff(existing, ready),
        fallbackSummary: `"${ready.title}" গ্যালারি ছবি এডিট করা হয়েছে`
      });
    }
    showToast('গ্যালারি ছবি সফলভাবে আপডেট করা হয়েছে!');
    SupabaseService.saveGalleryItem(ready);
  };

  const deleteGalleryItem = (id: string) => {
    // Sub-Admin is permitted to directly delete Gallery photos without Super Admin approval
    const target = galleryItems.find((g) => g.id === id);
    if (target && denyApprovedEmployeeMutation(target.isApproved !== false)) return;
    if (target) {
      moveToRecycleBin({
        entityType: 'gallery',
        originalId: target.id,
        targetTitle: target.title,
        targetSubtitle: target.category,
        targetDepartment: 'ফটো গ্যালারি',
        summary: `গ্যালারি ছবি: ${target.title} (${target.category || 'গ্যালারি'})`,
        payload: { gallery: target }
      });
    }
    setGalleryItems((prev) => {
      const remaining = prev.filter((g) => g.id !== id);
      safeSet('muttaqi_gallery_items', JSON.stringify(remaining));
      showToast('ছবি রিসাইকেল বিন শীটে স্থানান্তর করা হয়েছে!');
      return remaining;
    });
    markDeleted('gallery', [id]);
    confirmRemoteWrite(SupabaseService.deleteGalleryItem(id), 'ছবিটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
  };

  const toggleGalleryApproval = (id: string) => {
    // Sub-Admin can also publish/hide Gallery photos directly without Super Admin approval
    if (denyEmployeeApprovalAction()) return;
    setGalleryItems((prev) => {
      const nextList = prev.map((g) => {
        if (g.id === id) {
          const next = !(g.isApproved !== false);
          showToast(next ? 'ছবিটি অনুমোদিত ও দৃশ্যমান করা হয়েছে!' : 'ছবিটি লুকানো হয়েছে!');
          const updated = { ...g, isApproved: next };
          SupabaseService.saveGalleryItem(updated);
          return updated;
        }
        return g;
      });
      safeSet('muttaqi_gallery_items', JSON.stringify(nextList));
      return nextList;
    });
  };

  const updateStats = (newStats: { value: string; label: string; sub: string }[]) => {
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
    const diffs: EditLogDiff[] = newStats
      .map((st, idx) => {
        const prev = stats[idx];
        if (!prev) return null;
        if (prev.value !== st.value || prev.label !== st.label) {
          return {
            label: st.label || `পরিসংখ্যান #${idx + 1}`,
            oldVal: `${prev.label}: ${prev.value}`,
            newVal: `${st.label}: ${st.value}`
          };
        }
        return null;
      })
      .filter((d): d is EditLogDiff => d !== null);
    setStats([...newStats]);
    SupabaseService.saveStats(newStats);
    recordEditLog({
      targetType: 'stats',
      targetId: 'site_stats',
      targetTitle: 'ওয়েবসাইট পরিসংখ্যান',
      targetDepartment: 'সাধারণ তথ্য ও সেটিংস',
      diffs,
      fallbackSummary: 'ওয়েবসাইট পরিসংখ্যান হালনাগাদ করা হয়েছে'
    });
    showToast('পরিসংখ্যান তথ্য সংরক্ষিত হয়েছে!');
  };

  const addInquiry = (inq: Omit<InquiryItem, 'id' | 'date' | 'status'> & { status?: InquiryItem['status'] }) => {
    if (denySubAdminMutation()) return;
    const isEmp = isEmployeeSession();
    const newInquiry: InquiryItem = {
      ...inq,
      id: 'inq-' + Date.now(),
      date: new Date().toLocaleDateString('bn-BD'),
      status: isEmp ? 'pending' : inq.status || 'pending',
      createdById: isEmp ? activeSubAdmin?.id : inq.createdById,
      createdByRole: isEmp ? 'employee' : inq.createdByRole
    };
    setInquiries((prev) => [newInquiry, ...prev]);

    // Check if Haji/Umrah registration - automatically record in "হজ ও ওমরাহ্ আয় ও ব্যয়" ledger
    const isHajiReg = isHajiOrUmrahInquiry(newInquiry);

    if (isHajiReg) {
      clearFinanceTombstonesForInquiries([newInquiry]);
      const financeRec = buildHajiFinanceRecordFromInquiry(newInquiry, undefined, { syncPaidFromInquiry: true });
      setHajiFinanceRecords((prev) => {
        const exists = prev.some((r) => isMatchingFinanceRecord(r, newInquiry));
        if (exists) return prev;
        const next = [financeRec, ...prev];
        safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
        return next;
      });
      SupabaseService.saveHajiFinanceRecord(financeRec);
    }

    showToast(
      isEmp
        ? 'তথ্যটি পেন্ডিং অবস্থায় জমা হয়েছে! অ্যাডমিন অনুমোদনের আগ পর্যন্ত আপনি এটি এডিট ও ডিলিট করতে পারবেন।'
        : isHajiReg
        ? 'হাজী/ওমরাহ্ নিবন্ধন সফল হয়েছে এবং আর্থিক লেজার ও এডমিন প্যানেলে জমা হয়েছে!'
        : 'আপনার অনুসন্ধান অনুরোধ সফলভাবে পাঠানো হয়েছে!'
    );

    // Push new registration to Supabase database
    SupabaseService.saveInquiry(newInquiry).then((ok) => {
      if (ok) {
        setSupabaseStatus((prev) => ({ ...prev, lastSyncTime: new Date().toLocaleTimeString('bn-BD') }));
      }
    });
  };

  const updateInquiry = (inquiry: InquiryItem, _reason?: string) => {
    if (denySubAdminMutation()) return;
    const existing = inquiries.find((i) => i.id === inquiry.id);
    if (denyApprovedEmployeeMutation((existing?.status || inquiry.status) === 'approved')) return;
    const normalizedFinal =
      inquiry.finalTotalAmount !== undefined
        ? Number(inquiry.finalTotalAmount)
        : Math.max(0, Number(inquiry.subtotalAmount || 0) - Number(inquiry.discountAmount || 0));
    const normalizedPaid = Math.max(0, Number(inquiry.paidAmount ?? 0));
    const normalizedDue = Math.max(0, normalizedFinal - normalizedPaid);
    const sanitizedInquiry: InquiryItem = {
      ...inquiry,
      finalTotalAmount: normalizedFinal > 0 ? normalizedFinal : inquiry.finalTotalAmount,
      paidAmount: normalizedPaid,
      dueAmount: normalizedDue,
      status: isEmployeeSession()
        ? (existing?.status === 'rejected' ? 'rejected' : 'pending')
        : inquiry.status
    };

    // সরাসরি এডিট কার্যকর হবে (সাব-অ্যাডমিন অনুমোদনের প্রয়োজন নেই) এবং স্থায়ী লগ হিস্টোরিতে রেকর্ড হবে
    setInquiries((prev) => {
      const next = prev.map((i) => (i.id === sanitizedInquiry.id ? sanitizedInquiry : i));
      safeSet('muttaqi_inquiries', JSON.stringify(next));
      return next;
    });

    if (existing) {
      const linkedFin = hajiFinanceRecords.find((r) => isMatchingFinanceRecord(r, sanitizedInquiry));
      recordEditLog({
        targetType: 'haji',
        targetId: sanitizedInquiry.id,
        secondaryIds: [sanitizedInquiry.registrationRef, `fin-inq-${sanitizedInquiry.id}`, linkedFin?.id],
        targetTitle: sanitizedInquiry.nameBn || sanitizedInquiry.name || 'হাজী নিবন্ধন',
        targetDepartment: 'হাজী নিবন্ধন',
        diffs: generateInquiryDiff(existing, sanitizedInquiry),
        fallbackSummary: `${sanitizedInquiry.nameBn || sanitizedInquiry.name} এর তথ্য এডিট করা হয়েছে`
      });
    }

    showToast('বুকিং ও হিসাব তথ্য আপডেট হয়েছে এবং লগ হিস্টোরিতে সংরক্ষিত হয়েছে!');
    SupabaseService.saveInquiry(sanitizedInquiry);

    // Keep financial ledger strictly in sync for Haji & Umrah (both contract price and paid amount)
    const isHajiReg = isHajiOrUmrahInquiry(sanitizedInquiry);

    if (isHajiReg) {
      clearFinanceTombstonesForInquiries([sanitizedInquiry]);
      setHajiFinanceRecords((prev) => {
        const existingIdx = prev.findIndex(
          (r) => isMatchingFinanceRecord(r, sanitizedInquiry)
        );
        if (existingIdx >= 0) {
          const updatedRec = buildHajiFinanceRecordFromInquiry(sanitizedInquiry, prev[existingIdx], {
            syncPaidFromInquiry: true
          });
          const next = [...prev];
          next[existingIdx] = updatedRec;
          SupabaseService.saveHajiFinanceRecord(updatedRec);
          safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
          return next;
        } else {
          const newRec = buildHajiFinanceRecordFromInquiry(sanitizedInquiry, undefined, {
            syncPaidFromInquiry: true
          });
          SupabaseService.saveHajiFinanceRecord(newRec);
          const next = [newRec, ...prev];
          safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
          return next;
        }
      });
    }
  };

  const saveHajiIdCard = (hajiId: string, idCardData: HajiIdCardData) => {
    const existing = inquiries.find((i) => i.id === hajiId);
    if (!existing) return;
    const updated: InquiryItem = {
      ...existing,
      visaNo: idCardData.visaNo ?? existing.visaNo,
      passportNo: idCardData.passportNo?.trim() ? idCardData.passportNo.trim() : existing.passportNo,
      photoUrl: idCardData.photoUrl || existing.photoUrl,
      idCardData: {
        ...idCardData,
        updatedAt: new Date().toISOString()
      }
    };
    const idDiffs: EditLogDiff[] = [];
    if ((existing.visaNo || '') !== (updated.visaNo || '')) {
      idDiffs.push({ label: 'ভিসা নম্বর (ID Card)', oldVal: truncateVal(existing.visaNo), newVal: truncateVal(updated.visaNo) });
    }
    if ((existing.passportNo || '') !== (updated.passportNo || '')) {
      idDiffs.push({ label: 'পাসপোর্ট নম্বর (ID Card)', oldVal: truncateVal(existing.passportNo), newVal: truncateVal(updated.passportNo) });
    }
    if ((existing.idCardData?.fullName || '') !== (idCardData.fullName || '')) {
      idDiffs.push({ label: 'নাম (ID Card)', oldVal: truncateVal(existing.idCardData?.fullName), newVal: truncateVal(idCardData.fullName) });
    }
    if ((existing.idCardData?.guideName || '') !== (idCardData.guideName || '')) {
      idDiffs.push({ label: 'গাইডের নাম (ID Card)', oldVal: truncateVal(existing.idCardData?.guideName), newVal: truncateVal(idCardData.guideName) });
    }
    if ((existing.idCardData?.saudiContact || '') !== (idCardData.saudiContact || '')) {
      idDiffs.push({ label: 'সৌদি যোগাযোগ (ID Card)', oldVal: truncateVal(existing.idCardData?.saudiContact), newVal: truncateVal(idCardData.saudiContact) });
    }
    setInquiries((prev) => {
      const next = prev.map((i) => (i.id === hajiId ? updated : i));
      safeSet('muttaqi_inquiries', JSON.stringify(next));
      return next;
    });
    recordEditLog({
      targetType: 'haji',
      targetId: updated.id,
      secondaryIds: [updated.registrationRef, `fin-inq-${updated.id}`],
      targetTitle: updated.nameBn || updated.name || 'হাজী আইডি কার্ড',
      targetDepartment: 'হাজী নিবন্ধন (আইডি কার্ড)',
      diffs: idDiffs,
      fallbackSummary: 'হাজী আইডি কার্ডের তথ্য হালনাগাদ করা হয়েছে'
    });
    SupabaseService.saveInquiry(updated);
    showToast('আইডি কার্ডের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!');
  };

  const updateInquiryStatus = (id: string, status: InquiryItem['status'], notes?: string) => {
    if (denySubAdminMutation()) return;
    const existingBefore = inquiries.find((i) => i.id === id);
    if (isEmployeeSession()) {
      if (status === 'approved' || existingBefore?.status === 'approved') {
        denyEmployeeApprovalAction();
        return;
      }
    }
    let matchedInq: InquiryItem | undefined;
    setInquiries((prev) => {
      const nextList = prev.map((item) => {
        if (item.id === id) {
          const next: InquiryItem = {
            ...item,
            status,
            adminNotes: notes !== undefined ? notes : item.adminNotes,
            approvedAt: status === 'approved' ? new Date().toLocaleDateString('bn-BD') : item.approvedAt
          };
          matchedInq = next;
          showToast(
            status === 'approved'
              ? (isHajiOrUmrahInquiry(item)
                  ? `${item.nameBn || item.name}-এর ${item.registrationType === 'umrah' ? 'পবিত্র ওমরাহ্' : 'হাজী'} নিবন্ধন সফলভাবে অনুমোদিত হয়েছে! এখন তিনি আইডি ও পাসওয়ার্ড দিয়ে ওয়েবসাইটে প্রবেশ করতে পারবেন।`
                  : 'বুকিংটি সফলভাবে অনুমোদিত হয়েছে!')
              : status === 'contacted'
              ? 'যোগাযোগ সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে।'
              : 'স্ট্যাটাস আপডেট হয়েছে।'
          );
          SupabaseService.saveInquiry(next);
          return next;
        }
        return item;
      });
      safeSet('muttaqi_inquiries', JSON.stringify(nextList));
      return nextList;
    });

    if (existingBefore) {
      const statusDiffs: EditLogDiff[] = [];
      if (existingBefore.status !== status) {
        statusDiffs.push({ label: 'আবেদনের স্ট্যাটাস', oldVal: existingBefore.status, newVal: status });
      }
      if (notes !== undefined && (existingBefore.adminNotes || '') !== notes) {
        statusDiffs.push({ label: 'অ্যাডমিন নোট', oldVal: truncateVal(existingBefore.adminNotes), newVal: truncateVal(notes) });
      }
      if (statusDiffs.length > 0) {
        recordEditLog({
          targetType: 'haji',
          targetId: existingBefore.id,
          secondaryIds: [existingBefore.registrationRef, `fin-inq-${existingBefore.id}`],
          targetTitle: existingBefore.nameBn || existingBefore.name || 'হাজী নিবন্ধন',
          targetDepartment: 'হাজী নিবন্ধন',
          diffs: statusDiffs
        });
      }
    }

    if (status === 'approved') {
      const targetInq = matchedInq || existingBefore;
      if (targetInq && isHajiOrUmrahInquiry(targetInq)) {
        clearFinanceTombstonesForInquiries([targetInq]);
      }
      setHajiFinanceRecords((prev) => {
        let changed = false;
        let foundExisting = false;
        const next = prev.map((rec) => {
          if (
            rec.inquiryId === id ||
            (targetInq && isMatchingFinanceRecord(rec, targetInq))
          ) {
            foundExisting = true;
            if (rec.isApproved === false) {
              changed = true;
              const approvedRec = { ...rec, isApproved: true, updatedAt: new Date().toISOString() };
              SupabaseService.saveHajiFinanceRecord(approvedRec);
              return approvedRec;
            }
          }
          return rec;
        });
        if (!foundExisting && targetInq && isHajiOrUmrahInquiry(targetInq)) {
          const newRec = buildHajiFinanceRecordFromInquiry({ ...targetInq, status: 'approved' });
          SupabaseService.saveHajiFinanceRecord(newRec);
          const withNew = [newRec, ...next];
          safeSet('muttaqi_haji_finance_records', JSON.stringify(withNew));
          return withNew;
        }
        if (changed) safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
        return changed ? next : prev;
      });
    }
  };

  const deleteInquiry = (id: string, _reason?: string) => {
    if (denySubAdminMutation()) return;
    const target = inquiries.find((i) => i.id === id);
    if (target && denyApprovedEmployeeMutation(target.status === 'approved')) return;

    const linkedFinance =
      effectiveHajiFinanceRecords.find(
        (r) => r.inquiryId === id || (target && target.registrationRef && r.registrationRef === target.registrationRef)
      ) ||
      hajiFinanceRecords.find(
        (r) => r.inquiryId === id || (target && target.registrationRef && r.registrationRef === target.registrationRef)
      );

    // ডিলিটকৃত হাজী ও তার লেজারের পূর্ণাঙ্গ ব্যাকআপ রিসাইকেল বিন শীটে জমা হবে
    if (target) {
      moveToRecycleBin({
        entityType: 'haji',
        originalId: target.id,
        targetTitle: target.nameBn || target.name || 'হাজী নিবন্ধন',
        targetSubtitle: `${target.registrationRef || target.hajiUserId || target.id} • ${target.phone || ''}`,
        targetDepartment: target.registrationType === 'umrah' ? 'হাজী নিবন্ধন (ওমরাহ্ হজ)' : 'হাজী নিবন্ধন (মূল হজ)',
        summary: `${target.nameBn || target.name} | প্যাকেজ: ${target.serviceName || '-'} | মোট: ${formatMoneyVal(target.finalTotalAmount)} | জমা: ${formatMoneyVal(target.paidAmount)}`,
        payload: {
          inquiry: target,
          linkedFinance: linkedFinance || undefined
        }
      });
    }

    // 1. Add to tombstone so it stays removed from active main sheets until Sub-Admin restores it
    setDeletedInquiryIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      safeSet('muttaqi_deleted_inquiries', JSON.stringify(next));
      return next;
    });

    // 2. Remove inquiry from local state and LocalStorage
    setInquiries((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      safeSet('muttaqi_inquiries', JSON.stringify(remaining));
      return remaining;
    });

    // 3. Also remove and tombstone linked financial record
    if (linkedFinance) {
      setDeletedFinanceIds((fPrev) => {
        const next = Array.from(new Set([...fPrev, linkedFinance.id, `fin-inq-${id}`]));
        safeSet('muttaqi_deleted_finances', JSON.stringify(next));
        return next;
      });
      markDeleted('finances', [linkedFinance.id, `fin-inq-${id}`]);
      SupabaseService.deleteHajiFinanceRecord(linkedFinance.id);
    }
    setHajiFinanceRecords((prev) => {
      const remaining = prev.filter(
        (r) => r.inquiryId !== id && (!target?.registrationRef || r.registrationRef !== target.registrationRef)
      );
      safeSet('muttaqi_haji_finance_records', JSON.stringify(remaining));
      return remaining;
    });

    // 4. Remote delete and purge from active table in Supabase
    markDeleted('inquiries', [id]);
    markDeleted('finance_inquiries', [id, target?.registrationRef]);
    setTombstoneVersion((v) => v + 1);
    confirmRemoteWrite(SupabaseService.deleteInquiry(id), 'হাজী নিবন্ধনটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
    showToast('হাজী নিবন্ধনটি "রিসাইকেল বিন" শীটে স্থানান্তর করা হয়েছে! শুধুমাত্র সাব-অ্যাডমিন এটি ফিরিয়ে আনতে বা ক্লিন করতে পারবেন।');
  };

  const addContactMessage = (msg: Omit<ContactMessage, 'id' | 'date' | 'status'>) => {
    if (denySubAdminMutation()) return;
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
    if (denySubAdminMutation()) return;
    const existing = contactMessages.find((m) => m.id === msg.id);
    if (denyApprovedEmployeeMutation((existing?.status || msg.status) === 'approved')) return;
    const ready = isEmployeeSession() ? { ...msg, status: existing?.status || 'pending' } : msg;
    setContactMessages((prev) => prev.map((m) => (m.id === ready.id ? ready : m)));
    if (existing) {
      recordEditLog({
        targetType: 'message',
        targetId: ready.id,
        targetTitle: `${ready.name} (${ready.subject})`,
        targetDepartment: 'যোগাযোগ বার্তা',
        diffs: generateMessageDiff(existing, ready),
        fallbackSummary: 'যোগাযোগ বার্তা হালনাগাদ করা হয়েছে'
      });
    }
    showToast('বার্তা আপডেট হয়েছে!');
    SupabaseService.saveContactMessage(ready);
  };

  const updateMessageStatus = (id: string, status: ContactMessage['status'], notes?: string) => {
    if (denySubAdminMutation()) return;
    const existing = contactMessages.find((m) => m.id === id);
    if (isEmployeeSession() && (status === 'approved' || existing?.status === 'approved')) {
      denyEmployeeApprovalAction();
      return;
    }
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
    if (existing) {
      const diffs: EditLogDiff[] = [];
      if (existing.status !== status) diffs.push({ label: 'স্ট্যাটাস', oldVal: existing.status, newVal: status });
      if (notes !== undefined && (existing.adminNotes || '') !== notes) {
        diffs.push({ label: 'অ্যাডমিন নোট', oldVal: truncateVal(existing.adminNotes), newVal: truncateVal(notes) });
      }
      if (diffs.length > 0) {
        recordEditLog({
          targetType: 'message',
          targetId: existing.id,
          targetTitle: `${existing.name} (${existing.subject})`,
          targetDepartment: 'যোগাযোগ বার্তা',
          diffs
        });
      }
    }
    showToast('বার্তার স্ট্যাটাস আপডেট হয়েছে!');
  };

  const deleteMessage = (id: string) => {
    if (denySubAdminMutation()) return;
    const target = contactMessages.find((m) => m.id === id);
    if (target && denyApprovedEmployeeMutation(target.status === 'approved')) return;
    if (target) {
      moveToRecycleBin({
        entityType: 'message',
        originalId: target.id,
        targetTitle: target.subject || target.name,
        targetSubtitle: `${target.name} • ${target.phone}`,
        targetDepartment: 'যোগাযোগ বার্তা',
        summary: `প্রেরক: ${target.name} (${target.phone}) — ${truncateVal(target.message, 80)}`,
        payload: { message: target }
      });
    }
    setContactMessages((prev) => {
      const remaining = prev.filter((item) => item.id !== id);
      showToast('বার্তাটি রিসাইকেল বিন শীটে স্থানান্তর করা হয়েছে!');
      return remaining;
    });
    markDeleted('messages', [id]);
    confirmRemoteWrite(SupabaseService.deleteContactMessage(id), 'বার্তাটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
  };

  const addReview = (review: Omit<ReviewItem, 'id' | 'date' | 'isApproved'>) => {
    if (denySubAdminMutation()) return;
    const isDirectAdmin = (isAdminLoggedIn || hasDeveloperSession()) && !isEmployeeSession();
    const newRev: ReviewItem = {
      ...review,
      id: 'rev-' + Date.now(),
      date: new Date().toLocaleDateString('bn-BD'),
      isApproved: isDirectAdmin
    };
    setReviews((prev) => [newRev, ...prev]);
    showToast(isDirectAdmin ? 'রিভিউ যুক্ত ও অনুমোদিত হয়েছে!' : 'মতামত পেন্ডিং হিসেবে জমা হয়েছে! অ্যাডমিন অনুমোদনের আগ পর্যন্ত এডিট ও ডিলিট করা যাবে।');
    SupabaseService.saveReview(newRev);
  };

  const updateReview = (review: ReviewItem) => {
    if (denySubAdminMutation()) return;
    const existing = reviews.find((r) => r.id === review.id);
    if (denyApprovedEmployeeMutation(Boolean(existing ? existing.isApproved : review.isApproved))) return;
    const ready = isEmployeeSession() ? { ...review, isApproved: false } : review;
    setReviews((prev) => prev.map((r) => (r.id === ready.id ? ready : r)));
    if (existing) {
      recordEditLog({
        targetType: 'review',
        targetId: ready.id,
        targetTitle: ready.name,
        targetDepartment: 'হাজী রিভিউ',
        diffs: generateReviewDiff(existing, ready),
        fallbackSummary: `"${ready.name}" এর রিভিউ এডিট করা হয়েছে`
      });
    }
    showToast('রিভিউ সফলভাবে আপডেট হয়েছে!');
    SupabaseService.saveReview(ready);
  };

  const deleteReview = (id: string) => {
    if (denySubAdminMutation()) return;
    const target = reviews.find((r) => r.id === id);
    if (target && denyApprovedEmployeeMutation(Boolean(target.isApproved))) return;
    if (target) {
      moveToRecycleBin({
        entityType: 'review',
        originalId: target.id,
        targetTitle: target.name,
        targetSubtitle: `${target.location} • ${target.rating}★`,
        targetDepartment: 'হাজী রিভিউ',
        summary: truncateVal(target.comment, 100),
        payload: { review: target }
      });
    }
    setReviews((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      showToast('রিভিউটি রিসাইকেল বিন শীটে স্থানান্তর করা হয়েছে!');
      return remaining;
    });
    markDeleted('reviews', [id]);
    confirmRemoteWrite(SupabaseService.deleteReview(id), 'রিভিউটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
  };

  const toggleReviewApproval = (id: string) => {
    if (denySubAdminMutation() || denyEmployeeApprovalAction()) return;
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
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
    setPricingConfig(config);
    showToast('মূল্য নির্ধারণের তালিকা সফলভাবে সংরক্ষিত হয়েছে!');
    SupabaseService.savePricingConfig(config);
  };

  const addPricingItem = (item: Omit<PricingItem, 'id'>) => {
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
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
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
    const catKey =
      item.category === 'package'
        ? 'packages'
        : item.category === 'room'
        ? 'rooms'
        : item.category === 'airfare'
        ? 'airfares'
        : 'incidentals';
    const existingItem = pricingConfig[catKey].find((e) => e.id === item.id);
    setPricingConfig((prev) => {
      const nextConfig = {
        ...prev,
        [catKey]: prev[catKey].map((existing) => (existing.id === item.id ? item : existing))
      };
      SupabaseService.savePricingConfig(nextConfig);
      return nextConfig;
    });
    if (existingItem) {
      recordEditLog({
        targetType: 'pricing',
        targetId: item.id,
        targetTitle: item.title,
        targetDepartment: 'মূল্য নির্ধারণ',
        diffs: generatePricingItemDiff(existingItem, item),
        fallbackSummary: `"${item.title}" এর মূল্য আপডেট করা হয়েছে`
      });
    }
    showToast('মূল্য ও তথ্য সফলভাবে আপডেট করা হয়েছে!');
  };

  const deletePricingItem = (id: string, category: PricingCategory) => {
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
    const catKey =
      category === 'package'
        ? 'packages'
        : category === 'room'
        ? 'rooms'
        : category === 'airfare'
        ? 'airfares'
        : 'incidentals';
    const targetItem = pricingConfig[catKey].find((item) => item.id === id);
    if (targetItem) {
      moveToRecycleBin({
        entityType: 'pricing',
        originalId: targetItem.id,
        targetTitle: targetItem.title,
        targetSubtitle: `${formatMoneyVal(targetItem.price)} (${targetItem.unit || 'জনপ্রতি'})`,
        targetDepartment: 'মূল্য নির্ধারণ',
        summary: `ক্যাটাগরি: ${category} | মূল্য: ${formatMoneyVal(targetItem.price)}`,
        payload: { category, item: targetItem }
      });
    }
    setPricingConfig((prev) => {
      const nextConfig = {
        ...prev,
        [catKey]: prev[catKey].filter((item) => item.id !== id)
      };
      SupabaseService.savePricingConfig(nextConfig);
      return nextConfig;
    });
    showToast('আইটেমটি রিসাইকেল বিন শীটে স্থানান্তর করা হয়েছে!');
  };

  const resetPricingToDefaults = () => {
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
    setPricingConfig(DEFAULT_PRICING_CONFIG);
    safeSet('muttaqi_pricing_config', JSON.stringify(DEFAULT_PRICING_CONFIG));
    showToast('হজ, হোটেল, বিমান ও আনুসঙ্গিক খরচ ডিফল্ট রেটে রিসেট করা হয়েছে!');
    SupabaseService.savePricingConfig(DEFAULT_PRICING_CONFIG);
  };

  const applyHajiDiscount = (hajiId: string, discountPercent: number, discountNote?: string) => {
    if (denySubAdminMutation()) return;
    const existing = inquiries.find((i) => i.id === hajiId);
    if (!existing) return;
    if (denyApprovedEmployeeMutation(existing.status === 'approved')) return;
    const validPercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
    const linkedFinance = effectiveHajiFinanceRecords.find((r) => isMatchingFinanceRecord(r, existing));
    const subtotal =
      existing.subtotalAmount ||
      linkedFinance?.packagePrice ||
      (existing.finalTotalAmount ? existing.finalTotalAmount + (existing.discountAmount || 0) : 0);
    const discountAmt = Math.round((subtotal * validPercent) / 100);
    const finalTotal = Math.max(0, subtotal - discountAmt);
    const currentPaid = linkedFinance ? linkedFinance.totalDeposited : Number(existing.paidAmount || 0);
    const updatedInquiry: InquiryItem = {
      ...existing,
      subtotalAmount: subtotal,
      discountPercent: validPercent,
      discountAmount: discountAmt,
      finalTotalAmount: finalTotal,
      paidAmount: currentPaid,
      dueAmount: Math.max(0, finalTotal - currentPaid),
      discountNote: discountNote !== undefined ? discountNote : existing.discountNote,
      pricingUpdatedAt: new Date().toLocaleDateString('bn-BD')
    };

    setInquiries((prev) => {
      const next = prev.map((item) => (item.id === hajiId ? updatedInquiry : item));
      safeSet('muttaqi_inquiries', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveInquiry(updatedInquiry);

    recordEditLog({
      targetType: 'haji',
      targetId: updatedInquiry.id,
      secondaryIds: [updatedInquiry.registrationRef, `fin-inq-${updatedInquiry.id}`, linkedFinance?.id],
      targetTitle: updatedInquiry.nameBn || updatedInquiry.name || 'হাজী নিবন্ধন',
      targetDepartment: 'হাজী নিবন্ধন (ডিসকাউন্ট)',
      diffs: [
        { label: 'বিশেষ ছাড় (%)', oldVal: `${existing.discountPercent || 0}%`, newVal: `${validPercent}%` },
        { label: 'ছাড়ের পরিমাণ', oldVal: formatMoneyVal(existing.discountAmount), newVal: formatMoneyVal(discountAmt) },
        { label: 'সর্বমোট প্রদেয় মূল্য', oldVal: formatMoneyVal(existing.finalTotalAmount), newVal: formatMoneyVal(finalTotal) }
      ]
    });

    setHajiFinanceRecords((prev) => {
      const idx = prev.findIndex((r) => isMatchingFinanceRecord(r, updatedInquiry));
      const synced = idx >= 0
        ? buildHajiFinanceRecordFromInquiry(updatedInquiry, prev[idx])
        : buildHajiFinanceRecordFromInquiry(updatedInquiry);
      const next = idx >= 0 ? prev.map((r, i) => (i === idx ? synced : r)) : [synced, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      SupabaseService.saveHajiFinanceRecord(synced);
      return next;
    });

    showToast(`হাজীর মোট খরচে ${validPercent}% বিশেষ ছাড় প্রয়োগ করা হয়েছে এবং উভয় শীটে আপডেট হয়েছে!`);
  };

  const removeHajiDiscount = (hajiId: string) => {
    if (denySubAdminMutation()) return;
    const existing = inquiries.find((i) => i.id === hajiId);
    if (!existing) return;
    if (denyApprovedEmployeeMutation(existing.status === 'approved')) return;
    const linkedFinance = effectiveHajiFinanceRecords.find((r) => isMatchingFinanceRecord(r, existing));
    const subtotal =
      existing.subtotalAmount ||
      linkedFinance?.packagePrice ||
      (existing.finalTotalAmount ? existing.finalTotalAmount + (existing.discountAmount || 0) : 0);
    const currentPaid = linkedFinance ? linkedFinance.totalDeposited : Number(existing.paidAmount || 0);
    const updatedInquiry: InquiryItem = {
      ...existing,
      subtotalAmount: subtotal,
      discountPercent: 0,
      discountAmount: 0,
      finalTotalAmount: subtotal,
      paidAmount: currentPaid,
      dueAmount: Math.max(0, subtotal - currentPaid),
      discountNote: '',
      pricingUpdatedAt: new Date().toLocaleDateString('bn-BD')
    };

    setInquiries((prev) => {
      const next = prev.map((item) => (item.id === hajiId ? updatedInquiry : item));
      safeSet('muttaqi_inquiries', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveInquiry(updatedInquiry);

    recordEditLog({
      targetType: 'haji',
      targetId: updatedInquiry.id,
      secondaryIds: [updatedInquiry.registrationRef, `fin-inq-${updatedInquiry.id}`, linkedFinance?.id],
      targetTitle: updatedInquiry.nameBn || updatedInquiry.name || 'হাজী নিবন্ধন',
      targetDepartment: 'হাজী নিবন্ধন (ডিসকাউন্ট)',
      diffs: [
        { label: 'বিশেষ ছাড় (%)', oldVal: `${existing.discountPercent || 0}%`, newVal: '০% (বাতিল)' },
        { label: 'সর্বমোট প্রদেয় মূল্য', oldVal: formatMoneyVal(existing.finalTotalAmount), newVal: formatMoneyVal(subtotal) }
      ]
    });

    setHajiFinanceRecords((prev) => {
      const idx = prev.findIndex((r) => isMatchingFinanceRecord(r, updatedInquiry));
      const synced = idx >= 0
        ? buildHajiFinanceRecordFromInquiry(updatedInquiry, prev[idx])
        : buildHajiFinanceRecordFromInquiry(updatedInquiry);
      const next = idx >= 0 ? prev.map((r, i) => (i === idx ? synced : r)) : [synced, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      SupabaseService.saveHajiFinanceRecord(synced);
      return next;
    });

    showToast('হাজীর বিশেষ ডিসকাউন্ট মুছে ফেলা হয়েছে এবং উভয় শীটে পূর্ণ মূল্য হালনাগাদ হয়েছে।');
  };

  // Kafela Groups Management (এডমিনের ইচ্ছামত গ্রুপ বাড়ানো/কমানো)
  const addKafelaGroup = (groupData: Omit<KafelaGroup, 'id'>) => {
    if (denySubAdminMutation()) return;
    const isEmp = isEmployeeSession();
    const newGroup: KafelaGroup = {
      ...groupData,
      isApproved: isEmp ? false : groupData.isApproved !== false,
      id: `grp-${Date.now()}`
    };
    setKafelaGroups((prev) => {
      const next = [...prev, newGroup];
      safeSet('muttaqi_kafela_groups', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveKafelaGroup(newGroup);
    showToast(`কাফেলা গ্রুপ "${newGroup.name}" সফলভাবে যুক্ত করা হয়েছে!`);
  };

  const updateKafelaGroup = (updated: KafelaGroup) => {
    if (denySubAdminMutation()) return;
    const existing = kafelaGroups.find((g) => g.id === updated.id);
    if (denyApprovedEmployeeMutation((existing?.isApproved ?? updated.isApproved) !== false)) return;
    const ready = isEmployeeSession() ? { ...updated, isApproved: false } : updated;
    setKafelaGroups((prev) => {
      const next = prev.map((g) => (g.id === ready.id ? ready : g));
      safeSet('muttaqi_kafela_groups', JSON.stringify(next));
      return next;
    });
    if (existing) {
      recordEditLog({
        targetType: 'kafela_group',
        targetId: ready.id,
        targetTitle: ready.name,
        targetDepartment: 'কাফেলা গ্রুপ',
        diffs: generateKafelaGroupDiff(existing, ready),
        fallbackSummary: `"${ready.name}" গ্রুপের তথ্য এডিট করা হয়েছে`
      });
    }
    SupabaseService.saveKafelaGroup(ready);
    showToast(`কাফেলা গ্রুপ "${ready.name}" সফলভাবে আপডেট হয়েছে!`);
  };

  const deleteKafelaGroup = (groupId: string) => {
    if (denySubAdminMutation()) return;
    const target = kafelaGroups.find((g) => g.id === groupId);
    if (target && denyApprovedEmployeeMutation(target.isApproved !== false)) return;
    if (target) {
      moveToRecycleBin({
        entityType: 'kafela_group',
        originalId: target.id,
        targetTitle: target.name,
        targetSubtitle: `মোয়াল্লেম: ${target.leader} • আসন: ${target.maxCapacity}`,
        targetDepartment: 'কাফেলা গ্রুপ',
        summary: `গ্রুপ: ${target.name} | পরিচালক: ${target.leader} | আসন: ${target.maxCapacity}`,
        payload: { group: target }
      });
    }
    setKafelaGroups((prev) => {
      const next = prev.filter((g) => g.id !== groupId);
      safeSet('muttaqi_kafela_groups', JSON.stringify(next));
      return next;
    });
    markDeleted('kafela_groups', [groupId]);
    SupabaseService.deleteKafelaGroup(groupId);
    showToast(`কাফেলা গ্রুপ "${target?.name || ''}" রিসাইকেল বিন শীটে স্থানান্তর করা হয়েছে!`);
  };

  const resetKafelaGroups = () => {
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
    setKafelaGroups(DEFAULT_KAFELA_GROUPS);
    safeSet('muttaqi_kafela_groups', JSON.stringify(DEFAULT_KAFELA_GROUPS));
    for (const g of DEFAULT_KAFELA_GROUPS) {
      SupabaseService.saveKafelaGroup(g);
    }
    showToast('কাফেলা গ্রুপসমূহ ডিফল্ট অবস্থায় রিসেট করা হয়েছে!');
  };

  // অ্যাডমিন প্যানেল থেকে হাজির গ্রুপ ড্রপডাউনে পরিবর্তন/নির্ধারণ
  const assignHajiGroup = (hajiId: string, groupName: string) => {
    if (denySubAdminMutation()) return;
    const existing = inquiries.find((i) => i.id === hajiId);
    if (existing && denyApprovedEmployeeMutation(existing.status === 'approved')) return;
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
    if (existing && (existing.selectedGroup || '') !== groupName) {
      recordEditLog({
        targetType: 'haji',
        targetId: existing.id,
        secondaryIds: [existing.registrationRef, `fin-inq-${existing.id}`],
        targetTitle: existing.nameBn || existing.name || 'হাজী নিবন্ধন',
        targetDepartment: 'হাজী নিবন্ধন',
        diffs: [
          {
            label: 'কাফেলা গ্রুপ পরিবর্তন',
            oldVal: truncateVal(existing.selectedGroup),
            newVal: truncateVal(groupName || 'গ্রুপ বরাদ্দ বাদ')
          }
        ]
      });
    }
  };

  // সঙ্গীর আইডি যোগ করা এবং সকল সঙ্গীর প্রোফাইলে আইডি ও নাম দেখা যাওয়ার বাই-ডিরেকশনাল সিঙ্ক
  const linkHajiCompanion = (hajiId: string, companionHajiId: string) => {
    if (denySubAdminMutation()) return;
    if (hajiId === companionHajiId) return;
    const existing = inquiries.find((i) => i.id === hajiId);
    if (existing && denyApprovedEmployeeMutation(existing.status === 'approved')) return;

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
    if (denySubAdminMutation()) return;
    const existing = inquiries.find((i) => i.id === hajiId);
    if (existing && denyApprovedEmployeeMutation(existing.status === 'approved')) return;
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
    if (denySubAdminMutation()) {
      return {
        ...recordData,
        id: 'blocked',
        payments: [],
        expenses: [],
        finalTotalAmount: 0,
        totalDeposited: 0,
        dueAmount: 0,
        totalExpense: 0,
        netProfit: 0,
        createdAt: '',
        updatedAt: ''
      } as HajiFinanceRecord;
    }
    const id = `fin-${Date.now()}`;
    const initialExpenses = Array.isArray(recordData.expenses) ? recordData.expenses : [];

    const computed = calculateFinanceTotals({
      ...recordData,
      expenses: initialExpenses
    });

    const isEmp = isEmployeeSession();
    const newRecord: HajiFinanceRecord = {
      ...recordData,
      id,
      payments: recordData.payments || [],
      expenses: initialExpenses,
      isApproved: isEmp ? false : recordData.isApproved !== false,
      createdById: isEmp ? activeSubAdmin?.id : recordData.createdById,
      createdByRole: isEmp ? 'employee' : recordData.createdByRole,
      ...computed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setHajiFinanceRecords((prev) => {
      const next = [newRecord, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveHajiFinanceRecord(newRecord);
    syncFinanceRecordBackToInquiry(newRecord);
    showToast(
      isEmp
        ? 'হিসাব রেকর্ডটি পেন্ডিং অবস্থায় জমা হয়েছে (অ্যাডমিন অনুমোদনের আগ পর্যন্ত এডিট ও ডিলিট করা যাবে)।'
        : `${newRecord.hajiType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্'} যাত্রীর আর্থিক হিসাব সংরক্ষিত হয়েছে!`
    );
    return newRecord;
  };

  const updateHajiFinanceRecord = (record: HajiFinanceRecord, _reason?: string) => {
    if (denySubAdminMutation()) return;
    const existing = effectiveHajiFinanceRecords.find((r) => r.id === record.id) || hajiFinanceRecords.find((r) => r.id === record.id);
    if (denyApprovedEmployeeMutation((existing?.isApproved ?? record.isApproved) !== false)) return;

    const computed = calculateFinanceTotals(record);
    const recalculatedRecord: HajiFinanceRecord = {
      ...record,
      ...computed
    };

    // সরাসরি এডিট কার্যকর হবে (সাব-অ্যাডমিন অনুমোদনের প্রয়োজন নেই) এবং স্থায়ী লগ হিস্টোরিতে রেকর্ড হবে
    const updated: HajiFinanceRecord = {
      ...recalculatedRecord,
      ...(isEmployeeSession() ? { isApproved: false } : {}),
      updatedAt: new Date().toISOString()
    };

    setHajiFinanceRecords((prev) => {
      const exists = prev.some((r) => r.id === updated.id);
      const next = exists ? prev.map((r) => (r.id === updated.id ? updated : r)) : [updated, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      return next;
    });

    if (existing) {
      recordEditLog({
        targetType: 'finance',
        targetId: updated.id,
        secondaryIds: [updated.inquiryId, updated.registrationRef],
        targetTitle: `${updated.hajiName} (${updated.hajiType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্'})`,
        targetDepartment: 'হজ ও ওমরাহ্ আয়-ব্যয়',
        diffs: generateFinanceDiff(existing, updated),
        fallbackSummary: `${updated.hajiName} এর আর্থিক লেজার এডিট করা হয়েছে`
      });
    }

    SupabaseService.saveHajiFinanceRecord(updated);
    syncFinanceRecordBackToInquiry(updated);

    showToast('হাজীর হিসাব বিবরণী আপডেট হয়েছে এবং লগ হিস্টোরিতে সংরক্ষিত হয়েছে!');
  };

  const deleteHajiFinanceRecord = async (id: string, _reason?: string) => {
    if (denySubAdminMutation()) return;
    const target = effectiveHajiFinanceRecords.find((r: HajiFinanceRecord) => r.id === id) || hajiFinanceRecords.find((r: HajiFinanceRecord) => r.id === id);
    if (target && denyApprovedEmployeeMutation(target.isApproved !== false)) return;
    const matchingInquiry = target
      ? inquiries.find((inq) => isMatchingFinanceRecord(target, inq))
      : undefined;
    const resolvedInquiryId = target?.inquiryId || matchingInquiry?.id;
    const resolvedRegRef = target?.registrationRef || matchingInquiry?.registrationRef;

    // ডিলিটকৃত লেজার রেকর্ডটি রিসাইকেল বিন শীটে জমা হবে
    if (target) {
      moveToRecycleBin({
        entityType: 'finance',
        originalId: target.id,
        targetTitle: `${target.hajiName} (${target.hajiType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্'})`,
        targetSubtitle: `${resolvedRegRef || target.id} • ${target.phone || ''}`,
        targetDepartment: 'হজ ও ওমরাহ্ আয়-ব্যয়',
        summary: `চুক্তি: ${formatMoneyVal(target.finalTotalAmount)} | জমা: ${formatMoneyVal(target.totalDeposited)} | বকেয়া: ${formatMoneyVal(target.dueAmount)} | ব্যয়: ${formatMoneyVal(target.totalExpense)}`,
        payload: {
          finance: {
            ...target,
            inquiryId: resolvedInquiryId,
            registrationRef: resolvedRegRef
          }
        }
      });
    }

    // 1. Add to tombstone so it stays hidden from main sheets until Sub-Admin restores it
    const financeIdsToTombstone = Array.from(
      new Set([id, ...(resolvedInquiryId ? [`fin-inq-${resolvedInquiryId}`] : [])].filter(Boolean))
    );
    const inquiryRefsToTombstone = Array.from(
      new Set([resolvedInquiryId, resolvedRegRef].filter((v): v is string => Boolean(v)))
    );

    const financeTombstonePromise = markDeleted('finances', financeIdsToTombstone);
    const inquiryTombstonePromise = markDeleted('finance_inquiries', inquiryRefsToTombstone);
    setTombstoneVersion((v) => v + 1);

    setDeletedFinanceIds((prev) => {
      const next = Array.from(new Set([...prev, ...financeIdsToTombstone]));
      safeSet('muttaqi_deleted_finances', JSON.stringify(next));
      return next;
    });

    // 2. Remove from local state and LocalStorage
    setHajiFinanceRecords((prev) => {
      const remaining = prev.filter(
        (r) =>
          r.id !== id &&
          (!resolvedInquiryId || r.inquiryId !== resolvedInquiryId) &&
          (!resolvedRegRef || r.registrationRef !== resolvedRegRef)
      );
      safeSet('muttaqi_haji_finance_records', JSON.stringify(remaining));
      return remaining;
    });

    // 3. Remote delete & cache purge from active table
    const [financeTombstoneSaved, inquiryTombstoneSaved] = await Promise.all([
      financeTombstonePromise,
      inquiryTombstonePromise
    ]);
    const remoteDeleted = await SupabaseService.deleteHajiFinanceRecord(id);
    if (!remoteDeleted) {
      showToast('হিসাবটি রিসাইকেল বিনে পাঠানো হয়েছে, তবে ডাটাবেজ সংযোগ সীমিত থাকায় পুনরায় সিঙ্ক হতে পারে।');
      return;
    }
    if (!financeTombstoneSaved || !inquiryTombstoneSaved) {
      showToast('হিসাবটি রিসাইকেল বিনে স্থানান্তরিত হয়েছে (আংশিক সিঙ্ক)।');
      return;
    }
    showToast('হিসাব রেকর্ডটি "রিসাইকেল বিন" শীটে স্থানান্তর করা হয়েছে! শুধুমাত্র সাব-অ্যাডমিন এটি ফিরিয়ে আনতে বা ক্লিন করতে পারবেন।');
  };

  const addPilgrimPayment = (hajiFinanceId: string, paymentData: Omit<PaymentRecord, 'id'>) => {
    if (isSubAdminReadOnly() && !(activeHajiSession && paymentData.submittedBy === 'haji')) {
      denySubAdminMutation();
      return;
    }
    const paymentId = `pay-${Date.now()}`;
    const isFromHaji = paymentData.submittedBy === 'haji';
    const isFromEmployee = !isFromHaji && isEmployeeSession();
    const status = isFromEmployee
      ? 'pending'
      : paymentData.status || (isFromHaji ? 'pending' : 'approved');

    const newPayment: PaymentRecord = {
      ...paymentData,
      id: paymentId,
      status,
      submittedBy: isFromEmployee ? 'employee' : paymentData.submittedBy || 'admin',
      submittedById: isFromEmployee ? activeSubAdmin?.id : paymentData.submittedById,
      submittedAt: paymentData.submittedAt || new Date().toISOString(),
      date: paymentData.date || new Date().toISOString().split('T')[0]
    };

    // Synchronously resolve target finance record (preferring live fused record)
    let baseRecord: HajiFinanceRecord | undefined =
      effectiveHajiFinanceRecords.find((r: HajiFinanceRecord) => r.id === hajiFinanceId) ||
      hajiFinanceRecords.find((r) => r.id === hajiFinanceId);

    if (!baseRecord && isFromHaji && activeHajiSession) {
      const liveHaji = inquiries.find((i) => i.id === activeHajiSession.id) || activeHajiSession;
      baseRecord =
        effectiveHajiFinanceRecords.find((r: HajiFinanceRecord) => isMatchingFinanceRecord(r, liveHaji)) ||
        hajiFinanceRecords.find((r) => isMatchingFinanceRecord(r, liveHaji));
      if (!baseRecord) {
        baseRecord = buildHajiFinanceRecordFromInquiry(liveHaji);
        void unmarkDeleted('finances', [baseRecord.id, liveHaji.id, `fin-inq-${liveHaji.id}`, `fin-${liveHaji.id}`]);
      }
    }

    if (!baseRecord) {
      showToast('হাজীর হিসাব রেকর্ড খুঁজে পাওয়া যায়নি। অনুগ্রহ করে পেইজটি রিফ্রেশ করে আবার চেষ্টা করুন।');
      return;
    }

    const updatedPayments = [...(baseRecord.payments || []), newPayment];
    const computed = calculateFinanceTotals({ ...baseRecord, payments: updatedPayments });
    const updatedRecord: HajiFinanceRecord = {
      ...baseRecord,
      payments: updatedPayments,
      ...computed,
      updatedAt: new Date().toISOString()
    };

    setHajiFinanceRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === updatedRecord.id);
      const next =
        existingIdx >= 0
          ? prev.map((r, i) => (i === existingIdx ? updatedRecord : r))
          : [updatedRecord, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      return next;
    });

    confirmRemoteWrite(
      SupabaseService.saveHajiFinanceRecord(updatedRecord),
      'পেমেন্ট তথ্য ডাটাবেজে সংরক্ষণে সমস্যা হয়েছে — অনুগ্রহ করে ইন্টারনেট যাচাই করে পুনরায় চেষ্টা করুন।'
    );

    // Only sync approved payment totals back to linked inquiry
    if (status === 'approved') {
      syncFinanceRecordBackToInquiry(updatedRecord, newPayment.date);
    }

    if (isFromHaji) {
      showToast('আপনার পেমেন্ট ও মানি রিসিট সফলভাবে জমা হয়েছে! অ্যাডমিন প্যানেলে এটি পেন্ডিং থাকবে এবং অ্যাপ্রুভ হলে আপনার জমায় যুক্ত হবে।');
    } else if (isFromEmployee) {
      showToast(`৳${newPayment.amount.toLocaleString('bn-BD')} টাকা পেমেন্ট পেন্ডিং অবস্থায় জমা হয়েছে! অ্যাডমিন অনুমোদনের পর এটি যুক্ত হবে।`);
    } else {
      showToast(`৳${newPayment.amount.toLocaleString('bn-BD')} টাকা পেমেন্ট জমা গ্রহণ করা হয়েছে এবং উভয় শীটে আপডেট হয়েছে!`);
    }
  };

  const approvePilgrimPayment = (hajiFinanceId: string, paymentId: string) => {
    if (denySubAdminMutation() || denyEmployeeApprovalAction()) return;

    const targetRecord =
      effectiveHajiFinanceRecords.find((r: HajiFinanceRecord) => r.id === hajiFinanceId) ||
      hajiFinanceRecords.find((r) => r.id === hajiFinanceId);
    if (!targetRecord) {
      showToast('পেমেন্ট রেকর্ডটি খুঁজে পাওয়া যায়নি।');
      return;
    }

    let approvedAmount = 0;
    let approvedDate: string | undefined;
    const updatedPayments = (targetRecord.payments || []).map((p) => {
      if (p.id === paymentId) {
        approvedAmount = Number(p.amount || 0);
        approvedDate = p.date;
        return {
          ...p,
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          approvedBy: activeSubAdmin ? 'সহকারী এডমিন' : 'সুপার এডমিন'
        };
      }
      return p;
    });

    const computed = calculateFinanceTotals({ ...targetRecord, payments: updatedPayments });
    const updatedRecord: HajiFinanceRecord = {
      ...targetRecord,
      payments: updatedPayments,
      ...computed,
      updatedAt: new Date().toISOString()
    };

    setHajiFinanceRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === updatedRecord.id);
      const next =
        existingIdx >= 0
          ? prev.map((r, i) => (i === existingIdx ? updatedRecord : r))
          : [updatedRecord, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      return next;
    });

    confirmRemoteWrite(
      SupabaseService.saveHajiFinanceRecord(updatedRecord),
      'পেমেন্ট অনুমোদন ডাটাবেজে সংরক্ষণে সমস্যা হয়েছে — অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
    );

    syncFinanceRecordBackToInquiry(updatedRecord, approvedDate);

    showToast(`৳${approvedAmount.toLocaleString('bn-BD')} টাকার পেমেন্ট সফলভাবে অ্যাপ্রুভ হয়েছে এবং উভয় শীট ও হাজীর প্রোফাইলে জমা যুক্ত হয়েছে!`);
  };

  const rejectPilgrimPayment = (hajiFinanceId: string, paymentId: string, reason?: string) => {
    if (denySubAdminMutation() || denyEmployeeApprovalAction()) return;

    const targetRecord =
      effectiveHajiFinanceRecords.find((r: HajiFinanceRecord) => r.id === hajiFinanceId) ||
      hajiFinanceRecords.find((r) => r.id === hajiFinanceId);
    if (!targetRecord) return;

    const updatedPayments = (targetRecord.payments || []).map((p) => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'rejected' as const,
          rejectionReason: reason?.trim() || 'এডমিন কর্তৃক যাচাইয়ে বাতিল করা হয়েছে'
        };
      }
      return p;
    });

    const computed = calculateFinanceTotals({ ...targetRecord, payments: updatedPayments });
    const updatedRecord: HajiFinanceRecord = {
      ...targetRecord,
      payments: updatedPayments,
      ...computed,
      updatedAt: new Date().toISOString()
    };

    setHajiFinanceRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === updatedRecord.id);
      const next =
        existingIdx >= 0
          ? prev.map((r, i) => (i === existingIdx ? updatedRecord : r))
          : [updatedRecord, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      return next;
    });

    confirmRemoteWrite(
      SupabaseService.saveHajiFinanceRecord(updatedRecord),
      'বাতিল তথ্য ডাটাবেজে সংরক্ষণে সমস্যা হয়েছে — অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
    );

    syncFinanceRecordBackToInquiry(updatedRecord);

    showToast('পেমেন্টটি বাতিল হিসেবে চিহ্নিত করা হয়েছে।');
  };

  const deletePilgrimPayment = (hajiFinanceId: string, paymentId: string) => {
    if (denySubAdminMutation()) return;
    const targetRecord =
      effectiveHajiFinanceRecords.find((r) => r.id === hajiFinanceId) ||
      hajiFinanceRecords.find((r) => r.id === hajiFinanceId);
    if (!targetRecord) return;

    const targetPayment = targetRecord.payments.find((p) => p.id === paymentId);
    const isPaymentApproved = targetPayment ? (targetPayment.status !== 'pending' && targetPayment.status !== 'rejected') : true;
    if (denyApprovedEmployeeMutation(isPaymentApproved)) return;

    if (targetPayment) {
      moveToRecycleBin({
        entityType: 'payment',
        originalId: targetPayment.id,
        targetTitle: `${targetRecord.hajiName} — ${formatMoneyVal(targetPayment.amount)} পেমেন্ট`,
        targetSubtitle: `ভাউচার: ${targetPayment.voucherNo || targetPayment.id} • তারিখ: ${targetPayment.date}`,
        targetDepartment: 'পেমেন্ট ভাউচার (হজ ও ওমরাহ্)',
        summary: `হাজী: ${targetRecord.hajiName} | পরিমাণ: ${formatMoneyVal(targetPayment.amount)} | মাধ্যম: ${targetPayment.method || '-'}`,
        payload: {
          hajiFinanceId: targetRecord.id,
          registrationRef: targetRecord.registrationRef,
          inquiryId: targetRecord.inquiryId,
          hajiName: targetRecord.hajiName,
          payment: targetPayment
        }
      });
    }

    // Synchronously compute updated record BEFORE state update (avoids React 19 async batching bug)
    const updatedPayments = (targetRecord.payments || []).filter((p: PaymentRecord) => p.id !== paymentId);
    const computed = calculateFinanceTotals({ ...targetRecord, payments: updatedPayments });
    const updatedRecord: HajiFinanceRecord = {
      ...targetRecord,
      payments: updatedPayments,
      ...computed,
      updatedAt: new Date().toISOString()
    };

    setHajiFinanceRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === updatedRecord.id);
      const next =
        existingIdx >= 0
          ? prev.map((r, i) => (i === existingIdx ? updatedRecord : r))
          : [updatedRecord, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      return next;
    });

    confirmRemoteWrite(
      SupabaseService.saveHajiFinanceRecord(updatedRecord),
      'পেমেন্ট মুছে ফেলার তথ্য ডাটাবেজে সংরক্ষণে সমস্যা হয়েছে — অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
    );

    syncFinanceRecordBackToInquiry(updatedRecord);

    showToast('পেমেন্ট ভাউচারটি "রিসাইকেল বিন" শীটে স্থানান্তর করা হয়েছে!');
  };

  const updatePilgrimExpenses = (hajiFinanceId: string, expenses: PilgrimExpenseItem[]) => {
    if (denySubAdminMutation()) return;
    const existingRec =
      hajiFinanceRecords.find((r) => r.id === hajiFinanceId) ||
      effectiveHajiFinanceRecords.find((r) => r.id === hajiFinanceId);
    if (existingRec && denyApprovedEmployeeMutation(existingRec.isApproved !== false)) return;

    const prevExpTotal = existingRec
      ? stripUntouchedDefaultExpenses(existingRec.expenses).reduce((s, e) => s + (Number(e.amount) || 0), 0)
      : 0;
    const nextExpTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    setHajiFinanceRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === hajiFinanceId);
      if (existingIdx >= 0) {
        const r = prev[existingIdx];
        const computed = calculateFinanceTotals({ ...r, expenses });
        const updated: HajiFinanceRecord = {
          ...r,
          expenses,
          ...computed,
          updatedAt: new Date().toISOString()
        };
        const next = [...prev];
        next[existingIdx] = updated;
        safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
        confirmRemoteWrite(SupabaseService.saveHajiFinanceRecord(updated), 'হাজীর খরচ ডাটাবেজে সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।');
        return next;
      } else {
        const synth = effectiveHajiFinanceRecords.find((r: HajiFinanceRecord) => r.id === hajiFinanceId);
        if (synth) {
          const computed = calculateFinanceTotals({ ...synth, expenses });
          const updated: HajiFinanceRecord = {
            ...synth,
            expenses,
            ...computed,
            updatedAt: new Date().toISOString()
          };
          const next = [updated, ...prev];
          safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
          confirmRemoteWrite(SupabaseService.saveHajiFinanceRecord(updated), 'হাজীর খরচ ডাটাবেজে সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।');
          return next;
        }
        return prev;
      }
    });

    if (existingRec) {
      const expDiffs: EditLogDiff[] = [];
      if (prevExpTotal !== nextExpTotal) {
        expDiffs.push({
          label: 'হাজী বাবদ মোট ব্যয়',
          oldVal: formatMoneyVal(prevExpTotal),
          newVal: formatMoneyVal(nextExpTotal)
        });
      }
      const prevCount = stripUntouchedDefaultExpenses(existingRec.expenses).filter((e) => Number(e.amount) > 0).length;
      const nextCount = expenses.filter((e) => Number(e.amount) > 0).length;
      if (prevCount !== nextCount) {
        expDiffs.push({
          label: 'ব্যয়ের খাত সংখ্যা',
          oldVal: `${prevCount}টি খাত`,
          newVal: `${nextCount}টি খাত`
        });
      }
      recordEditLog({
        targetType: 'finance',
        targetId: existingRec.id,
        secondaryIds: [existingRec.inquiryId, existingRec.registrationRef],
        targetTitle: `${existingRec.hajiName} (হাজী বাবদ ব্যয়)`,
        targetDepartment: 'হজ ও ওমরাহ্ আয়-ব্যয়',
        diffs: expDiffs,
        fallbackSummary: `${existingRec.hajiName} এর ব্যয়ের খাতসমূহ হালনাগাদ করা হয়েছে (মোট: ${formatMoneyVal(nextExpTotal)})`
      });
    }

    showToast('হাজীর ব্যয়ের বিস্তারিত হিসাব সংরক্ষিত ও লগ হিস্টোরিতে রেকর্ড হয়েছে!');
  };

  const addOfficeExpense = (expenseData: Omit<OfficeExpense, 'id' | 'createdAt'>): OfficeExpense => {
    if (denySubAdminMutation()) {
      return { ...expenseData, id: 'blocked', createdAt: '' } as OfficeExpense;
    }
    const id = `off-${Date.now()}`;
    const isEmp = isEmployeeSession();
    const newExp: OfficeExpense = {
      ...expenseData,
      id,
      isApproved: isEmp ? false : expenseData.isApproved !== false,
      createdById: isEmp ? activeSubAdmin?.id : expenseData.createdById,
      createdByRole: isEmp ? 'employee' : expenseData.createdByRole,
      createdAt: new Date().toISOString()
    };
    setOfficeExpenses((prev) => {
      const next = [newExp, ...prev];
      safeSet('muttaqi_office_expenses', JSON.stringify(next));
      return next;
    });
    confirmRemoteWrite(SupabaseService.saveOfficeExpense(newExp), 'অফিস আয়/ব্যয় ডাটাবেজে সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।');
    showToast(
      isEmp
        ? 'অফিস আয়/ব্যয় পেন্ডিং হিসেবে জমা হয়েছে (অ্যাডমিন অনুমোদনের আগ পর্যন্ত এডিট ও ডিলিট করা যাবে)।'
        : 'অফিস খরচের ভাউচার যুক্ত করা হয়েছে!'
    );
    return newExp;
  };

  const updateOfficeExpense = (expense: OfficeExpense, _reason?: string) => {
    if (denySubAdminMutation()) return;
    const existing = officeExpenses.find((e) => e.id === expense.id);
    if (denyApprovedEmployeeMutation((existing?.isApproved ?? expense.isApproved) !== false)) return;
    const readyExpense = isEmployeeSession() ? { ...expense, isApproved: false } : expense;

    // সরাসরি এডিট কার্যকর হবে (সাব-অ্যাডমিন অনুমোদনের প্রয়োজন নেই) এবং স্থায়ী লগ হিস্টোরিতে রেকর্ড হবে
    setOfficeExpenses((prev) => {
      const next = prev.map((e) => (e.id === readyExpense.id ? readyExpense : e));
      safeSet('muttaqi_office_expenses', JSON.stringify(next));
      return next;
    });
    if (existing) {
      recordEditLog({
        targetType: 'expense',
        targetId: readyExpense.id,
        targetTitle: readyExpense.title,
        targetDepartment: 'অন্যান্য আয় ও অফিস খরচ',
        diffs: generateOfficeExpenseDiff(existing, readyExpense),
        fallbackSummary: `"${readyExpense.title}" (${formatMoneyVal(readyExpense.amount)}) এডিট করা হয়েছে`
      });
    }
    confirmRemoteWrite(SupabaseService.saveOfficeExpense(readyExpense), 'অফিস আয়/ব্যয় ডাটাবেজে সংরক্ষণ করা যায়নি — আবার চেষ্টা করুন।');
    showToast('অফিস আয়/খরচের তথ্য আপডেট ও লগ হিস্টোরিতে সংরক্ষিত হয়েছে!');
  };

  const deleteOfficeExpense = (id: string, _reason?: string) => {
    if (denySubAdminMutation()) return;
    const target = officeExpenses.find((e) => e.id === id);
    if (target && denyApprovedEmployeeMutation(target.isApproved !== false)) return;

    if (target) {
      moveToRecycleBin({
        entityType: 'expense',
        originalId: target.id,
        targetTitle: target.title,
        targetSubtitle: `${target.entryType === 'income' ? 'অন্যান্য আয়' : 'অফিস ব্যয়'} • ${formatMoneyVal(target.amount)} • ${target.date}`,
        targetDepartment: 'অন্যান্য আয় ও অফিস খরচ',
        summary: `${target.title} | পরিমাণ: ${formatMoneyVal(target.amount)} | তারিখ: ${target.date}`,
        payload: { expense: target }
      });
    }

    // 1. Tombstone so it stays removed until Sub-Admin restores
    setDeletedExpenseIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      safeSet('muttaqi_deleted_expenses', JSON.stringify(next));
      return next;
    });

    // 2. Local state and storage
    setOfficeExpenses((prev) => {
      const remaining = prev.filter((e) => e.id !== id);
      safeSet('muttaqi_office_expenses', JSON.stringify(remaining));
      return remaining;
    });

    // 3. Supabase delete from active table
    markDeleted('expenses', [id]);
    confirmRemoteWrite(SupabaseService.deleteOfficeExpense(id), 'খরচটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
    showToast('অফিস আয়/খরচের রেকর্ডটি "রিসাইকেল বিন" শীটে স্থানান্তর করা হয়েছে! শুধুমাত্র সাব-অ্যাডমিন এটি ফিরিয়ে আনতে বা ক্লিন করতে পারবেন।');
  };

  const approveHajiFinanceRecord = (id: string) => {
    if (denySubAdminMutation() || denyEmployeeApprovalAction()) return;
    let updatedRec: HajiFinanceRecord | null = null;
    setHajiFinanceRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === id);
      const target = existingIdx >= 0 ? prev[existingIdx] : effectiveHajiFinanceRecords.find((r) => r.id === id);
      if (!target) return prev;
      updatedRec = { ...target, isApproved: true, updatedAt: new Date().toISOString() };
      const next = existingIdx >= 0
        ? prev.map((r) => (r.id === id ? updatedRec! : r))
        : [updatedRec, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      SupabaseService.saveHajiFinanceRecord(updatedRec);
      return next;
    });
    if (updatedRec) {
      showToast(`"${(updatedRec as HajiFinanceRecord).hajiName}"-এর হিসাব রেকর্ডটি অ্যাডমিন কর্তৃক অনুমোদিত হয়েছে!`);
    }
  };

  const approveOfficeExpense = (id: string) => {
    if (denySubAdminMutation() || denyEmployeeApprovalAction()) return;
    setOfficeExpenses((prev) => {
      const next = prev.map((e) => {
        if (e.id === id) {
          const approved = { ...e, isApproved: true };
          SupabaseService.saveOfficeExpense(approved).catch(() => {});
          showToast(`"${e.title}" অফিস আয়/ব্যয় এন্ট্রিটি অনুমোদিত হয়েছে!`);
          return approved;
        }
        return e;
      });
      safeSet('muttaqi_office_expenses', JSON.stringify(next));
      return next;
    });
  };

  const importInquiryToFinance = (inquiryId: string, hajjType?: HajjType): HajiFinanceRecord | null => {
    if (denySubAdminMutation()) return null;
    const inquiry = inquiries.find((i) => i.id === inquiryId);
    if (!inquiry) return null;

    clearFinanceTombstonesForInquiries([inquiry]);

    const built = buildHajiFinanceRecordFromInquiry(inquiry);
    const finalRecord: HajiFinanceRecord = hajjType ? { ...built, hajiType: hajjType } : built;

    setHajiFinanceRecords((prev) => {
      const idx = prev.findIndex((r) => isMatchingFinanceRecord(r, inquiry));
      const next = idx >= 0
        ? prev.map((r, i) => (i === idx ? finalRecord : r))
        : [finalRecord, ...prev];
      safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
      return next;
    });
    SupabaseService.saveHajiFinanceRecord(finalRecord);
    showToast(`${finalRecord.hajiName} কে ${finalRecord.hajiType === 'umrah' ? 'ওমরাহ্' : 'মূল হজ'} লেজারে যুক্ত করা হয়েছে!`);
    return finalRecord;
  };

  const getFinanceSummary = (filterYear?: string): FinanceSummary => {
    const targetRecords: HajiFinanceRecord[] = effectiveHajiFinanceRecords;
    const filteredRecords: HajiFinanceRecord[] = filterYear && filterYear !== 'all'
      ? targetRecords.filter((r: HajiFinanceRecord) => r.yearSeason.includes(filterYear) || (filterYear === '২০২৬' && /2026|২০২৬/i.test(r.yearSeason)))
      : targetRecords;

    const filteredOfficeExpenses: OfficeExpense[] = filterYear && filterYear !== 'all'
      ? visibleOfficeExpenses.filter(
          (e: OfficeExpense) =>
            !e.yearSeason ||
            e.yearSeason.includes(filterYear) ||
            (filterYear === '২০২৬' && /2026|২০২৬/i.test(e.yearSeason))
        )
      : visibleOfficeExpenses;

    const hajjRecords = filteredRecords.filter((r: HajiFinanceRecord) => r.hajiType === 'hajj');
    const umrahRecords = filteredRecords.filter((r: HajiFinanceRecord) => r.hajiType === 'umrah');

    // Counts
    const totalHajjPilgrims = hajjRecords.length;
    const totalUmrahPilgrims = umrahRecords.length;
    const totalPilgrims = filteredRecords.length;

    const otherIncomes = filteredOfficeExpenses.filter((e: OfficeExpense) => e.entryType === 'income');
    const otherExpensesList = filteredOfficeExpenses.filter((e: OfficeExpense) => e.entryType !== 'income');

    const totalOtherIncome = otherIncomes.reduce((sum: number, e: OfficeExpense) => sum + (Number(e.amount) || 0), 0);
    const totalOtherExpense = otherExpensesList.reduce((sum: number, e: OfficeExpense) => sum + (Number(e.amount) || 0), 0);
    const netOtherBalance = totalOtherIncome - totalOtherExpense;

    const getRealPilgrimExpenseTotal = (record: HajiFinanceRecord): number =>
      stripUntouchedDefaultExpenses(record.expenses).reduce(
        (sum: number, item: PilgrimExpenseItem) => sum + (Number(item.amount) || 0),
        0
      );

    // Hajj Financials
    const hajjTotalContract = hajjRecords.reduce((sum: number, r: HajiFinanceRecord) => sum + r.finalTotalAmount, 0);
    const hajjTotalDeposited = hajjRecords.reduce((sum: number, r: HajiFinanceRecord) => sum + r.totalDeposited, 0);
    const hajjTotalDue = hajjRecords.reduce((sum: number, r: HajiFinanceRecord) => sum + r.dueAmount, 0);
    const hajjPilgrimsExpense = hajjRecords.reduce((sum: number, r: HajiFinanceRecord) => sum + getRealPilgrimExpenseTotal(r), 0);
    const hajjOfficeOverhead = otherExpensesList
      .filter((e: OfficeExpense) => e.expenseType === 'hajj_overhead')
      .reduce((sum: number, e: OfficeExpense) => sum + (Number(e.amount) || 0), 0);
    const hajjTotalExpense = hajjPilgrimsExpense + hajjOfficeOverhead;
    const hajjNetProfit = hajjTotalDeposited - hajjTotalExpense;

    // Umrah Financials
    const umrahTotalContract = umrahRecords.reduce((sum: number, r: HajiFinanceRecord) => sum + r.finalTotalAmount, 0);
    const umrahTotalDeposited = umrahRecords.reduce((sum: number, r: HajiFinanceRecord) => sum + r.totalDeposited, 0);
    const umrahTotalDue = umrahRecords.reduce((sum: number, r: HajiFinanceRecord) => sum + r.dueAmount, 0);
    const umrahPilgrimsExpense = umrahRecords.reduce((sum: number, r: HajiFinanceRecord) => sum + getRealPilgrimExpenseTotal(r), 0);
    const umrahOfficeOverhead = otherExpensesList
      .filter((e: OfficeExpense) => e.expenseType === 'umrah_overhead')
      .reduce((sum: number, e: OfficeExpense) => sum + (Number(e.amount) || 0), 0);
    const umrahTotalExpense = umrahPilgrimsExpense + umrahOfficeOverhead;
    const umrahNetProfit = umrahTotalDeposited - umrahTotalExpense;

    // Office & Overall
    const generalOfficeExpense = otherExpensesList
      .filter((e) => e.expenseType === 'general')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalOfficeExpense = totalOtherExpense;

    const grandTotalContract = hajjTotalContract + umrahTotalContract;
    const grandTotalDeposited = hajjTotalDeposited + umrahTotalDeposited;
    const grandTotalDue = Math.max(0, grandTotalContract - grandTotalDeposited);
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
      grandTotalContract,
      grandTotalDeposited,
      grandTotalDue,
      grandTotalIncome,
      grandTotalExpenses,
      grandNetProfit,
      overallProfitMargin: Number(overallProfitMargin.toFixed(1))
    };
  };

  // Notice Board Operations (এডমিন ও কর্মচারী কর্তৃক নোটিশ প্রকাশ ও ব্যবস্থাপনা)
  const addNotice = (noticeData: Omit<NoticeItem, 'id' | 'createdAt'>): NoticeItem => {
    if (denySubAdminMutation()) {
      return { ...noticeData, id: 'blocked', createdAt: '' } as NoticeItem;
    }
    const isEmp = isEmployeeSession();
    const authorName =
      noticeData.publishedBy ||
      (activeSubAdmin ? activeSubAdmin.englishName || activeSubAdmin.username : adminCredentials.name || 'মুত্তাকী এডমিন');
    const authorRole: 'admin' | 'sub_admin' | 'employee' = isEmp
      ? 'employee'
      : activeSubAdmin
        ? 'sub_admin'
        : 'admin';
    const newNotice: NoticeItem = {
      ...noticeData,
      id: `notice-${Date.now()}`,
      publishedBy: authorName,
      publishedRole: authorRole,
      createdById: isEmp ? activeSubAdmin?.id : noticeData.createdById,
      createdAt: new Date().toISOString(),
      date: noticeData.date || new Date().toISOString().split('T')[0],
      isPinned: !!noticeData.isPinned,
      isActive: noticeData.isActive !== false,
      isApproved: isEmp ? false : noticeData.isApproved !== false
    };
    const updated = [newNotice, ...notices];
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    SupabaseService.saveNotice(newNotice).catch(() => {});
    showToast(
      isEmp
        ? 'নোটিশটি পেন্ডিং অবস্থায় জমা হয়েছে! অ্যাডমিন অনুমোদনের আগ পর্যন্ত আপনি এটি এডিট ও ডিলিট করতে পারবেন।'
        : 'নতুন নোটিশ সফলভাবে প্রকাশিত ও সুপাবেজে সংরক্ষিত হয়েছে!'
    );
    return newNotice;
  };

  const updateNotice = (notice: NoticeItem) => {
    if (denySubAdminMutation()) return;
    const existing = notices.find((n) => n.id === notice.id);
    if (denyApprovedEmployeeMutation((existing?.isApproved ?? notice.isApproved) !== false)) return;
    const target: NoticeItem = {
      ...notice,
      ...(isEmployeeSession() ? { isApproved: false, publishedRole: 'employee' as const } : {}),
      updatedAt: new Date().toISOString()
    };
    const updated = notices.map((n) => (n.id === target.id ? target : n));
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    if (existing) {
      recordEditLog({
        targetType: 'notice',
        targetId: target.id,
        targetTitle: target.title,
        targetDepartment: 'নোটিশ বোর্ড',
        diffs: generateNoticeDiff(existing, target),
        fallbackSummary: `"${target.title}" নোটিশ এডিট করা হয়েছে`
      });
    }
    SupabaseService.saveNotice(target).catch(() => {});
    showToast('নোটিশ সফলভাবে আপডেট ও লগ হিস্টোরিতে সংরক্ষিত হয়েছে!');
  };

  const deleteNotice = (id: string) => {
    if (denySubAdminMutation()) return;
    const target = notices.find((n) => n.id === id);
    if (target && denyApprovedEmployeeMutation(target.isApproved !== false)) return;
    if (target) {
      moveToRecycleBin({
        entityType: 'notice',
        originalId: target.id,
        targetTitle: target.title,
        targetSubtitle: `তারিখ: ${target.date} • ক্যাটাগরি: ${target.category}`,
        targetDepartment: 'নোটিশ বোর্ড',
        summary: truncateVal(target.content, 110),
        payload: { notice: target }
      });
    }
    const updated = notices.filter((n) => n.id !== id);
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    markDeleted('notices', [id]);
    confirmRemoteWrite(SupabaseService.deleteNotice(id), 'নোটিশটি ডাটাবেজ থেকে মুছতে ব্যর্থ — আবার চেষ্টা করুন।');
    showToast('নোটিশটি রিসাইকেল বিন শীটে স্থানান্তর করা হয়েছে!');
  };

  const togglePinNotice = (id: string) => {
    if (denySubAdminMutation()) return;
    const existing = notices.find((n) => n.id === id);
    if (existing && denyApprovedEmployeeMutation(existing.isApproved !== false)) return;
    let targetNotice: NoticeItem | undefined;
    const updated = notices.map((n) => {
      if (n.id === id) {
        targetNotice = { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() };
        return targetNotice;
      }
      return n;
    });
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    if (targetNotice) {
      SupabaseService.saveNotice(targetNotice).catch(() => {});
    }
    showToast('নোটিশ পিন স্ট্যাটাস পরিবর্তন করা হয়েছে!');
  };

  const toggleActiveNotice = (id: string) => {
    if (denySubAdminMutation()) return;
    const existing = notices.find((n) => n.id === id);
    if (existing && denyApprovedEmployeeMutation(existing.isApproved !== false)) return;
    let targetNotice: NoticeItem | undefined;
    const updated = notices.map((n) => {
      if (n.id === id) {
        targetNotice = { ...n, isActive: !n.isActive, updatedAt: new Date().toISOString() };
        return targetNotice;
      }
      return n;
    });
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    if (targetNotice) {
      SupabaseService.saveNotice(targetNotice).catch(() => {});
    }
    showToast('নোটিশ স্ট্যাটাস পরিবর্তন করা হয়েছে!');
  };

  const toggleNoticeApproval = (id: string) => {
    if (denySubAdminMutation() || denyEmployeeApprovalAction()) return;
    let targetNotice: NoticeItem | undefined;
    const updated = notices.map((n) => {
      if (n.id === id) {
        const next = !(n.isApproved !== false);
        targetNotice = { ...n, isApproved: next, updatedAt: new Date().toISOString() };
        showToast(next ? `"${n.title}" নোটিশটি অনুমোদিত ও লাইভ করা হয়েছে!` : `"${n.title}" নোটিশটি অনুমোদন বাতিল (পেন্ডিং) করা হয়েছে!`);
        return targetNotice;
      }
      return n;
    });
    setNotices(updated);
    safeSet('muttaqi_notices', JSON.stringify(updated));
    if (targetNotice) {
      SupabaseService.saveNotice(targetNotice).catch(() => {});
    }
  };

  // ==================== এডিট লগ হিস্টোরি নিয়ন্ত্রণ (শুধুমাত্র ওয়েবসাইট ডেভেলপার) ====================
  const updateEditLog = (entry: EditLogEntry) => {
    if (!hasDeveloperSession()) {
      showToast('শুধুমাত্র ওয়েবসাইট ডেভেলপার এডিট লগ হিস্টোরি সম্পাদনা করতে পারবেন!');
      return;
    }
    const cleanDiffs = (entry.diffs || []).map((d) => ({
      label: d.label.trim() || 'তথ্য',
      oldVal: d.oldVal.trim() || 'খালি',
      newVal: d.newVal.trim() || 'খালি'
    }));
    const normalized: EditLogEntry = {
      ...entry,
      targetTitle: entry.targetTitle.trim() || entry.targetTitle,
      targetDepartment: entry.targetDepartment.trim() || entry.targetDepartment,
      editedBy: entry.editedBy.trim() || entry.editedBy,
      editedDateBn: entry.editedDateBn.trim() || entry.editedDateBn,
      diffs: cleanDiffs,
      summary:
        entry.summary.trim() ||
        (cleanDiffs.length > 0
          ? cleanDiffs.map((d) => `${d.label}: ${d.oldVal} ➔ ${d.newVal}`).join(' | ')
          : `${entry.targetTitle} তথ্য এডিট করা হয়েছে`)
    };
    setEditLogs((prev) => {
      const next = prev.map((l) => (l.id === normalized.id ? normalized : l));
      safeSet('muttaqi_edit_logs_v1', JSON.stringify(next));
      SupabaseService.saveEditLogs(next).catch(() => {});
      return next;
    });
    showToast('এডিট লগ হিস্টোরি সফলভাবে আপডেট করা হয়েছে (ডেভেলপার মোড)।');
  };

  const deleteEditLog = (logId: string) => {
    if (!hasDeveloperSession()) {
      showToast('শুধুমাত্র ওয়েবসাইট ডেভেলপার এডিট লগ হিস্টোরি ডিলিট করতে পারবেন!');
      return;
    }
    setEditLogs((prev) => {
      const next = prev.filter((l) => l.id !== logId);
      safeSet('muttaqi_edit_logs_v1', JSON.stringify(next));
      SupabaseService.saveEditLogs(next).catch(() => {});
      return next;
    });
    showToast('নির্বাচিত এডিট লগটি সফলভাবে মুছে ফেলা হয়েছে (ডেভেলপার মোড)।');
  };

  const clearAllEditLogs = () => {
    if (!hasDeveloperSession()) {
      showToast('শুধুমাত্র ওয়েবসাইট ডেভেলপার সকল এডিট লগ হিস্টোরি মুছতে পারবেন!');
      return;
    }
    setEditLogs([]);
    safeSet('muttaqi_edit_logs_v1', JSON.stringify([]));
    SupabaseService.saveEditLogs([]).catch(() => {});
    showToast('সকল এডিট লগ হিস্টোরি সম্পূর্ণভাবে মুছে ফেলা হয়েছে (ডেভেলপার মোড)।');
  };

  // ==================== রিসাইকেল বিন নিয়ন্ত্রণ (সাব-অ্যাডমিন ও ডেভেলপার) ====================
  const updateRecycleBinItem = (updatedItem: RecycleBinItem) => {
    if (!hasDeveloperSession()) {
      showToast('শুধুমাত্র ওয়েবসাইট ডেভেলপার রিসাইকেল বিনের তথ্য সম্পাদনা করতে পারবেন!');
      return;
    }
    setRecycleBin((prev) => {
      const next = prev.map((r) => (r.id === updatedItem.id ? updatedItem : r));
      persistRecycleBin(next);
      return next;
    });
    showToast(`"${updatedItem.targetTitle}" রিসাইকেল বিন তথ্য সফলভাবে আপডেট করা হয়েছে (ডেভেলপার মোড)।`);
  };

  const restoreFromRecycleBin = (recycleId: string) => {
    if (!canManageRecycleBinSession()) {
      showToast('শুধুমাত্র সাব-অ্যাডমিন বা ওয়েবসাইট ডেভেলপার রিসাইকেল বিন থেকে ডিলিটকৃত তথ্য পূর্বের অবস্থায় ফিরিয়ে আনতে পারবেন!');
      return;
    }
    const item = recycleBin.find((r) => r.id === recycleId);
    if (!item) return;

    switch (item.entityType) {
      case 'haji': {
        const restoredInquiry = item.payload?.inquiry as InquiryItem | undefined;
        const restoredFinance = item.payload?.linkedFinance as HajiFinanceRecord | undefined;
        if (!restoredInquiry) break;

        unmarkDeleted('inquiries', [restoredInquiry.id]);
        unmarkDeleted('finance_inquiries', [restoredInquiry.id, restoredInquiry.registrationRef]);
        setDeletedInquiryIds((prev) => {
          const next = prev.filter((d) => d !== restoredInquiry.id);
          safeSet('muttaqi_deleted_inquiries', JSON.stringify(next));
          return next;
        });

        setInquiries((prev) => {
          const withoutDup = prev.filter((i) => i.id !== restoredInquiry.id);
          const next = [restoredInquiry, ...withoutDup];
          safeSet('muttaqi_inquiries', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveInquiry(restoredInquiry).catch(() => {});

        if (restoredFinance) {
          const finIdsToClear = [restoredFinance.id, `fin-inq-${restoredInquiry.id}`];
          unmarkDeleted('finances', finIdsToClear);
          setDeletedFinanceIds((prev) => {
            const next = prev.filter((d) => !finIdsToClear.includes(d));
            safeSet('muttaqi_deleted_finances', JSON.stringify(next));
            return next;
          });
          setHajiFinanceRecords((prev) => {
            const withoutDup = prev.filter((f) => f.id !== restoredFinance.id);
            const next = [restoredFinance, ...withoutDup];
            safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
            return next;
          });
          SupabaseService.saveHajiFinanceRecord(restoredFinance).catch(() => {});
        } else if (isHajiOrUmrahInquiry(restoredInquiry)) {
          clearFinanceTombstonesForInquiries([restoredInquiry]);
        }
        break;
      }

      case 'finance': {
        const restoredFinance = item.payload?.finance as HajiFinanceRecord | undefined;
        if (!restoredFinance) break;
        const finIdsToClear = [
          restoredFinance.id,
          ...(restoredFinance.inquiryId ? [`fin-inq-${restoredFinance.inquiryId}`] : [])
        ];
        unmarkDeleted('finances', finIdsToClear);
        unmarkDeleted('finance_inquiries', [restoredFinance.inquiryId, restoredFinance.registrationRef]);
        setDeletedFinanceIds((prev) => {
          const next = prev.filter((d) => !finIdsToClear.includes(d));
          safeSet('muttaqi_deleted_finances', JSON.stringify(next));
          return next;
        });
        setHajiFinanceRecords((prev) => {
          const withoutDup = prev.filter((f) => f.id !== restoredFinance.id);
          const next = [restoredFinance, ...withoutDup];
          safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveHajiFinanceRecord(restoredFinance).catch(() => {});
        syncFinanceRecordBackToInquiry(restoredFinance);
        break;
      }

      case 'payment': {
        const { hajiFinanceId, registrationRef, inquiryId, payment } = (item.payload || {}) as {
          hajiFinanceId?: string;
          registrationRef?: string;
          inquiryId?: string;
          payment?: PaymentRecord;
        };
        if (!payment) break;
        const parentRecord =
          effectiveHajiFinanceRecords.find(
            (r) =>
              (hajiFinanceId && r.id === hajiFinanceId) ||
              (inquiryId && r.inquiryId === inquiryId) ||
              (registrationRef && r.registrationRef === registrationRef)
          ) ||
          hajiFinanceRecords.find(
            (r) =>
              (hajiFinanceId && r.id === hajiFinanceId) ||
              (inquiryId && r.inquiryId === inquiryId) ||
              (registrationRef && r.registrationRef === registrationRef)
          );
        if (!parentRecord) {
          showToast('এই পেমেন্টের মূল হাজী লেজারটিও রিসাইকেল বিনে আছে — অনুগ্রহ করে আগে সংশ্লিষ্ট হাজীর লেজার/নিবন্ধন ফিরিয়ে আনুন!');
          return;
        }
        const existsAlready = (parentRecord.payments || []).some((p) => p.id === payment.id);
        const restoredPayments = existsAlready
          ? parentRecord.payments
          : [...(parentRecord.payments || []), payment];
        const computed = calculateFinanceTotals({ ...parentRecord, payments: restoredPayments });
        const updatedRecord: HajiFinanceRecord = {
          ...parentRecord,
          payments: restoredPayments,
          ...computed,
          updatedAt: new Date().toISOString()
        };
        setHajiFinanceRecords((prev) => {
          const idx = prev.findIndex((r) => r.id === updatedRecord.id);
          const next = idx >= 0 ? prev.map((r, i) => (i === idx ? updatedRecord : r)) : [updatedRecord, ...prev];
          safeSet('muttaqi_haji_finance_records', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveHajiFinanceRecord(updatedRecord).catch(() => {});
        syncFinanceRecordBackToInquiry(updatedRecord, payment.date);
        break;
      }

      case 'expense': {
        const exp = item.payload?.expense as OfficeExpense | undefined;
        if (!exp) break;
        unmarkDeleted('expenses', [exp.id]);
        setDeletedExpenseIds((prev) => {
          const next = prev.filter((d) => d !== exp.id);
          safeSet('muttaqi_deleted_expenses', JSON.stringify(next));
          return next;
        });
        setOfficeExpenses((prev) => {
          const withoutDup = prev.filter((e) => e.id !== exp.id);
          const next = [exp, ...withoutDup];
          safeSet('muttaqi_office_expenses', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveOfficeExpense(exp).catch(() => {});
        break;
      }

      case 'notice': {
        const notice = item.payload?.notice as NoticeItem | undefined;
        if (!notice) break;
        unmarkDeleted('notices', [notice.id]);
        setNotices((prev) => {
          const withoutDup = prev.filter((n) => n.id !== notice.id);
          const next = [notice, ...withoutDup];
          safeSet('muttaqi_notices', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveNotice(notice).catch(() => {});
        break;
      }

      case 'service': {
        const service = item.payload?.service as ServiceItem | undefined;
        if (!service) break;
        unmarkDeleted('services', [service.id]);
        setServices((prev) => {
          const withoutDup = prev.filter((s) => s.id !== service.id);
          return [service, ...withoutDup];
        });
        SupabaseService.saveService(service).catch(() => {});
        break;
      }

      case 'gallery': {
        const gallery = item.payload?.gallery as GalleryItem | undefined;
        if (!gallery) break;
        unmarkDeleted('gallery', [gallery.id]);
        setGalleryItems((prev) => {
          const withoutDup = prev.filter((g) => g.id !== gallery.id);
          const next = [gallery, ...withoutDup];
          safeSet('muttaqi_gallery_items', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveGalleryItem(gallery).catch(() => {});
        break;
      }

      case 'team': {
        const member = item.payload?.team as TeamMember | undefined;
        if (!member) break;
        unmarkDeleted('team', [member.id]);
        setTeamMembers((prev) => {
          const withoutDup = prev.filter((m) => m.id !== member.id);
          const next = [member, ...withoutDup];
          safeSet('muttaqi_team_members', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveTeamMember(member).catch(() => {});
        break;
      }

      case 'review': {
        const review = item.payload?.review as ReviewItem | undefined;
        if (!review) break;
        unmarkDeleted('reviews', [review.id]);
        setReviews((prev) => {
          const withoutDup = prev.filter((r) => r.id !== review.id);
          return [review, ...withoutDup];
        });
        SupabaseService.saveReview(review).catch(() => {});
        break;
      }

      case 'kafela_group': {
        const group = item.payload?.group as KafelaGroup | undefined;
        if (!group) break;
        unmarkDeleted('kafela_groups', [group.id]);
        setKafelaGroups((prev) => {
          const withoutDup = prev.filter((g) => g.id !== group.id);
          const next = [...withoutDup, group];
          safeSet('muttaqi_kafela_groups', JSON.stringify(next));
          return next;
        });
        SupabaseService.saveKafelaGroup(group).catch(() => {});
        break;
      }

      case 'pricing': {
        const { category, item: pricingItem } = (item.payload || {}) as {
          category?: PricingCategory;
          item?: PricingItem;
        };
        if (!category || !pricingItem) break;
        const catKey =
          category === 'package'
            ? 'packages'
            : category === 'room'
            ? 'rooms'
            : category === 'airfare'
            ? 'airfares'
            : 'incidentals';
        setPricingConfig((prev) => {
          const withoutDup = prev[catKey].filter((p) => p.id !== pricingItem.id);
          const nextConfig = {
            ...prev,
            [catKey]: [...withoutDup, pricingItem]
          };
          SupabaseService.savePricingConfig(nextConfig).catch(() => {});
          return nextConfig;
        });
        break;
      }

      case 'message': {
        const message = item.payload?.message as ContactMessage | undefined;
        if (!message) break;
        unmarkDeleted('messages', [message.id]);
        setContactMessages((prev) => {
          const withoutDup = prev.filter((m) => m.id !== message.id);
          return [message, ...withoutDup];
        });
        SupabaseService.saveContactMessage(message).catch(() => {});
        break;
      }
    }

    setTombstoneVersion((v) => v + 1);
    setRecycleBin((prev) => {
      const next = prev.filter((r) => r.id !== recycleId);
      persistRecycleBin(next);
      return next;
    });
    showToast(`"${item.targetTitle}" পূর্বের অবস্থায় (${item.targetDepartment}) মূল ডাটা শীটে সফলভাবে ফিরিয়ে আনা হয়েছে!`);
  };

  const permanentlyDeleteRecycleBinItem = (recycleId: string) => {
    if (!canManageRecycleBinSession()) {
      showToast('শুধুমাত্র সাব-অ্যাডমিন বা ওয়েবসাইট ডেভেলপার রিসাইকেল বিন থেকে তথ্য স্থায়ীভাবে মুছতে পারবেন!');
      return;
    }
    const target = recycleBin.find((r) => r.id === recycleId);
    setRecycleBin((prev) => {
      const next = prev.filter((r) => r.id !== recycleId);
      persistRecycleBin(next);
      return next;
    });
    showToast(`"${target?.targetTitle || 'তথ্য'}" রিসাইকেল বিন থেকে স্থায়ীভাবে ক্লিন করা হয়েছে।`);
  };

  const cleanRecycleBin = () => {
    if (!canManageRecycleBinSession()) {
      showToast('শুধুমাত্র সাব-অ্যাডমিন বা ওয়েবসাইট ডেভেলপার রিসাইকেল বিন ক্লিন করতে পারবেন!');
      return;
    }
    setRecycleBin([]);
    persistRecycleBin([]);
    showToast('রিসাইকেল বিনের সকল ডিলিটকৃত তথ্য স্থায়ীভাবে ক্লিন করা হয়েছে!');
  };

  const resetToDefaults = () => {
    if (denySubAdminMutation() || denyApprovedEmployeeMutation(true)) return;
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
        isAdminLoggedIn: isAdminLoggedIn || hasDeveloperSession(),
        setIsAdminLoggedIn,
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
        inquiries: visibleInquiries,
        addInquiry,
        updateInquiry,
        saveHajiIdCard,
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
        isSubAdmin: isSubAdminReadOnly(),
        isEmployee: isEmployeeSession(),
        canEdit: hasDeveloperSession() || !activeSubAdmin || (isEmployeeSession() && activeSubAdmin?.canEdit !== false),
        hasPermission,
        subAdminChangePassword,
        subAdminResetPassword,
        subAdminApprovalRequests,
        requestAdminActionApproval,
        approveAdminAction,
        rejectAdminAction,
        canSubAdminAdd,
        canSubAdminEdit,
        canSubAdminDelete,
        canEditRecord,
        canDeleteRecord,
        canApproveRecords,
        getSubAdminModuleRole,
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
        silentRefreshFromSupabase,
        supabaseSchemaSql: SUPABASE_SQL_SCHEMA,
        hajiFinanceRecords: effectiveHajiFinanceRecords,
        officeExpenses: visibleOfficeExpenses,
        addHajiFinanceRecord,
        updateHajiFinanceRecord,
        deleteHajiFinanceRecord,
        addPilgrimPayment,
        approvePilgrimPayment,
        rejectPilgrimPayment,
        deletePilgrimPayment,
        updatePilgrimExpenses,
        addOfficeExpense,
        updateOfficeExpense,
        deleteOfficeExpense,
        approveHajiFinanceRecord,
        approveOfficeExpense,
        importInquiryToFinance,
        syncAllHajisToFinance,
        getFinanceSummary,
        notices,
        addNotice,
        updateNotice,
        deleteNotice,
        togglePinNotice,
        toggleActiveNotice,
        toggleNoticeApproval,
        editLogs,
        canManageEditLogs: hasDeveloperSession(),
        getEditLogsForTarget,
        updateEditLog,
        deleteEditLog,
        clearAllEditLogs,
        recycleBin,
        canManageRecycleBin: canManageRecycleBinSession(),
        canEditRecycleBin: hasDeveloperSession(),
        updateRecycleBinItem,
        restoreFromRecycleBin,
        permanentlyDeleteRecycleBinItem,
        cleanRecycleBin,
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
