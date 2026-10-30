export type PageId = 'home' | 'services' | 'about' | 'gallery' | 'contact' | 'admin';

export interface ServiceItem {
  id: string;
  title: string;
  subtitle?: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  badge?: string;
  features: string[];
  isApproved?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image?: string;
  initials: string;
  phone?: string;
  isApproved?: boolean;
}

export interface IslamicPillar {
  id: number;
  nameBn: string;
  nameAr: string;
  meaning: string;
  description: string;
  icon: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'all' | 'hajj' | 'umrah' | 'holysites' | 'groups';
  image: string;
  aspectRatio?: 'landscape' | 'portrait' | 'square';
  description?: string;
  isApproved?: boolean;
  submittedBy?: string;
}

export interface PrayerTime {
  nameBn: string;
  nameEn: string;
  time: string;
  isPassed?: boolean;
  isNext?: boolean;
}

export interface CompanyInfo {
  name: string;
  nameEn: string;
  slogan: string;
  taglineAr: string;
  address: string;
  phone1: string;
  phone1Display: string;
  phone2: string;
  phone2Display: string;
  email: string;
  facebook: string;
  youtube: string;
  whatsapp: string;
  mapEmbedUrl: string;
  announcementText?: string;
  showAnnouncement?: boolean;
}

export interface InquiryItem {
  id: string;
  name: string;
  phone: string;
  serviceId: string;
  serviceName: string;
  travelers: string;
  message?: string;
  date: string;
  status: 'pending' | 'approved' | 'contacted' | 'rejected';
  adminNotes?: string;
  approvedAt?: string;
  // Extended fields for Haji, Partner, and Sub-Admin registrations
  email?: string;
  registrationType?: 'haji' | 'partner' | 'sub_admin' | 'general';
  passportOrNid?: string;
  district?: string;
  roomPreference?: string;
  agencyName?: string;
  designation?: string;
  tradeLicense?: string;
  partnershipType?: string;
  registrationRef?: string;
  englishName?: string;
  subAdminPassword?: string;
  hajiUserId?: string;
  hajiPassword?: string;

  // Detailed Haji Registration Fields
  nameBn?: string;
  nameEn?: string;
  fatherNameBn?: string;
  fatherNameEn?: string;
  motherNameBn?: string;
  motherNameEn?: string;
  presentAddress?: string;
  presentPostCode?: string;
  permanentAddress?: string;
  permanentPostCode?: string;
  nidNo?: string;
  passportNo?: string;
  hajPartnerIdLink?: string;
  totalHajPartner?: string;
  partnerDetails?: string;
  dateOfBirth?: string;
  guardianPhone?: string;
  photoUrl?: string;
  signatureUrl?: string;
  nidDocUrl?: string;
  passportDocUrl?: string;
  pilgrimPhoto?: string;
  nidDocumentUrl?: string;
  passportDocumentUrl?: string;
  age?: number | string;
  gender?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  occupation?: string;
  passportExpiryDate?: string;
  policeStation?: string;
  alternatePhone?: string;

  // Pricing & Cost Breakdown Fields
  packageBasePrice?: number;
  roomPrice?: number;
  airfareOption?: string;
  airfarePrice?: number;
  incidentalItems?: { id: string; title: string; price: number }[];
  incidentalPrice?: number;
  perPersonTotal?: number;
  travelersCount?: number;
  subtotalAmount?: number;
  discountPercent?: number; // Custom admin discount percentage (e.g. 10 for 10%)
  discountAmount?: number;
  finalTotalAmount?: number;
  discountNote?: string;
  pricingUpdatedAt?: string;

  // Kafela Group Selection (সর্বোচ্চ ৫০ জন প্রতি গ্রুপে)
  selectedGroup?: string;

  // Linked Companions (সঙ্গী আইডি ও নাম)
  linkedCompanionIds?: string[];
  linkedCompanions?: {
    id: string;
    hajiUserId: string;
    name: string;
    phone?: string;
    group?: string;
  }[];

  // Payment / Deposit & Due Tracking Fields (টাকা জমা ও বকেয়া হিসাব)
  paymentDate?: string; // টাকা জমার তারিখ
  paidAmount?: number; // টাকা জমার পরিমাণ
  dueAmount?: number; // অবশিষ্ট বকেয়ার পরিমাণ (মোট টাকা - জমার টাকা)
  paymentReceiptUrl?: string; // টাকার রশিদ আপলোড URL
  paymentReceiptName?: string; // টাকার রশিদ ফাইলের নাম
  paymentMethod?: string; // টাকা জমার মাধ্যম (ব্যাংক ডিপোজিট, চেক, ক্যাশ ইত্যাদি)
}

export interface HajiLoginResult {
  success: boolean;
  haji?: InquiryItem;
  error?: string;
  isPendingApproval?: boolean;
}

export interface KafelaGroup {
  id: string;
  name: string;
  type: 'hajj' | 'umrah' | 'both';
  category?: string;
  leader: string;
  maxCapacity: number; // 50 persons per group
  departureDate?: string;
  departureMonth?: string;
}

export type PricingCategory = 'package' | 'room' | 'airfare' | 'incidental';

export interface PricingItem {
  id: string;
  title: string;
  category: PricingCategory;
  price: number; // in BDT ৳
  description?: string;
  subtitle?: string;
  durationDays?: number;
  unit?: string;
  isDefault?: boolean;
}

export interface KafelaPricingConfig {
  packages: PricingItem[];
  rooms: PricingItem[];
  airfares: PricingItem[];
  incidentals: PricingItem[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email?: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
  status: 'pending' | 'approved' | 'contacted' | 'rejected';
  adminNotes?: string;
}

export interface SubAdminUser {
  id: string;
  englishName: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  role: 'sub_admin';
  permissions?: string[]; // Allowed tab IDs (e.g. 'haji-registrations', 'finance', 'approvals')
  createdAt: string;
  isApproved: boolean;
}

export interface ReviewItem {
  id: string;
  name: string;
  location: string;
  packageTaken: string;
  rating: number;
  comment: string;
  date: string;
  isApproved: boolean;
}

// ==========================================
// Financial & Accounting Types (হজ ও ওমরাহ্ আয়-ব্যয়)
// ==========================================

export type HajjType = 'hajj' | 'umrah';

export type PilgrimExpenseCategory =
  | 'air_ticket'        // বিমান টিকেট
  | 'visa_insurance'    // ভিসা ও ট্রাভেল ইন্স্যুরেন্স
  | 'hotel_makkah'      // মক্কা হোটেল
  | 'hotel_madinah'     // মদিনা হোটেল
  | 'muallim_tent'      // মোয়াল্লেম ফি ও মিনা-আরাফাত তাবু
  | 'food_catering'     // খাবার ও ক্যাটারিং
  | 'transport'         // অভ্যন্তরীণ বাস ও ট্রান্সপোর্ট (জেদ্দা-মক্কা-মদিনা)
  | 'qurbani'           // কোরবানি / হাদিয়া
  | 'ziyarah_guide'     // জিয়ারাহ ও গাইড
  | 'supplies_kit'      // এহরাম, ট্রলি ব্যাগ ও কিট সামগ্রী
  | 'misc';             // অন্যান্য বিবিধ খরচ

export interface PilgrimExpenseItem {
  id: string;
  category: PilgrimExpenseCategory;
  title: string;
  amount: number;       // ৳ (BDT)
  date?: string;
  note?: string;
}

export type PaymentMethod = 'cash' | 'bank' | 'bkash' | 'nagad' | 'check' | 'other';

export interface PaymentRecord {
  id: string;
  amount: number;       // ৳ (BDT)
  date: string;
  method: PaymentMethod;
  voucherNo?: string;
  receivedBy?: string;
  note?: string;
}

export interface HajiFinanceRecord {
  id: string;
  inquiryId?: string;           // Optional link to registration inquiry
  registrationRef?: string;     // Voucher / Reg ID e.g. "MUT-2026-001"
  hajiType: HajjType;           // 'hajj' (মূল হজ) | 'umrah' (ওমরাহ্ হজ)
  yearSeason: string;           // e.g. "২০২৬ (১৪৪৭ হি.)", "রমজান ওমরাহ্ ২০২৬"
  hajiName: string;
  hajiNameBn?: string;
  phone: string;
  email?: string;
  nidNo?: string;
  passportNo?: string;
  district?: string;
  packageName: string;
  packagePrice: number;         // প্যাকেজ নির্ধারিত মূল্য ৳
  discountAmount: number;       // বিশেষ ছাড় / ডিসকাউন্ট ৳
  finalTotalAmount: number;     // চুক্তি অনুযায়ী মোট প্রাপ্য ৳ (packagePrice - discountAmount)
  totalDeposited: number;       // মোট গৃহীত/জমা টাকা ৳
  dueAmount: number;            // বকেয়া টাকা ৳
  paymentStatus: 'paid' | 'partial' | 'due';
  payments: PaymentRecord[];    // কি কি তারিখে কি মাধ্যমে কত টাকা জমা হয়েছে
  
  // Per-pilgrim detailed expenses breakdown (তাদের প্রতিজনের জন্য কি কি পারপাজে খরচ হয়েছে)
  expenses: PilgrimExpenseItem[];
  totalExpense: number;         // মোট প্রতিজনে ব্যয় ৳
  netProfit: number;            // নিট লাভ / ক্ষতি (totalDeposited - totalExpense)
  
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LedgerEntryType = 'expense' | 'income';

export type OfficeExpenseCategory =
  | 'rent'              // অফিস ভাড়া
  | 'salary'            // কর্মচারী বেতন ও মোয়াল্লেম কমিশন
  | 'utility'           // বিদ্যুৎ, ইন্টারনেট ও টেলিফোন
  | 'marketing'         // সোশ্যাল মিডিয়া, ব্যানার ও লিফলেট
  | 'stationery'        // স্টেশনারি ও অফিস আপ্যায়ন
  | 'legal_license'     // লাইসেন্স নবায়ন ও সরকারি ফি
  | 'consultancy_fee'   // কনসালটেন্সি ও গাইডেন্স ফি (অন্যান্য আয়)
  | 'service_charge'    // পাসপোর্ট ও ভিসা সার্ভিস চার্জ (অন্যান্য আয়)
  | 'commission'        // এয়ার টিকিট ও হোটেল কমিশন (অন্যান্য আয়)
  | 'donation_sponsor'  // অনুদান ও স্পন্সরশিপ (অন্যান্য আয়)
  | 'other';            // বিবিধ

export interface OfficeExpense {
  id: string;
  title: string;                // যেমন "অফিস ভাড়া - অক্টোবর", "স্টাফ বেতন", "প্রচারণা বিল", "সার্ভিস ফি আয়"
  entryType?: LedgerEntryType;  // 'expense' (ব্যয়) | 'income' (আয়) - ডিফল্ট 'expense'
  category: OfficeExpenseCategory;
  amount: number;               // ৳ (BDT)
  date: string;
  expenseType: 'general' | 'hajj_overhead' | 'umrah_overhead'; // সাধারণ অফিস খরচ নাকি নির্দিষ্ট হজের
  yearSeason?: string;
  paidBy?: string;
  voucherNo?: string;
  note?: string;
  createdAt: string;
}

export interface FinanceSummary {
  // Counts
  totalHajjPilgrims: number;
  totalUmrahPilgrims: number;
  totalPilgrims: number;
  
  // Hajj Financials
  hajjTotalContract: number;
  hajjTotalDeposited: number;
  hajjTotalDue: number;
  hajjPilgrimsExpense: number;
  hajjOfficeOverhead: number;
  hajjTotalExpense: number;
  hajjNetProfit: number;
  
  // Umrah Financials
  umrahTotalContract: number;
  umrahTotalDeposited: number;
  umrahTotalDue: number;
  umrahPilgrimsExpense: number;
  umrahOfficeOverhead: number;
  umrahTotalExpense: number;
  umrahNetProfit: number;
  
  // Office & Other Operating Incomes & Expenses
  generalOfficeExpense: number;
  totalOfficeExpense: number;
  totalOtherIncome: number;      // অন্যান্য খাত থেকে অর্জিত মোট আয়
  totalOtherExpense: number;     // অন্যান্য পরিচালন মোট ব্যয়
  netOtherBalance: number;       // অন্যান্য নিট স্থিতি (totalOtherIncome - totalOtherExpense)
  
  // Grand Combined Totals
  grandTotalDeposited: number;   // হজযাত্রীদের থেকে গৃহীত মোট জমা
  grandTotalIncome: number;      // হাজীদের জমা + অন্যান্য সকল আয়
  grandTotalExpenses: number;    // হাজীদের খরচ + অন্যান্য সকল খরচ
  grandNetProfit: number;        // সর্বমোট নিট লাভ / উদ্বৃত্ত
  overallProfitMargin: number;   // % লাভ হার
}

export type NoticeCategory = 'urgent' | 'general' | 'flight' | 'circular';

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  category: NoticeCategory;
  date: string;
  isPinned?: boolean;
  isActive?: boolean;
  publishedBy?: string;
  publishedRole?: 'admin' | 'sub_admin';
  createdAt: string;
  updatedAt?: string;
}

