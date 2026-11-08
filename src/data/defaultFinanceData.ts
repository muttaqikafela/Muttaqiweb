import { HajiFinanceRecord, OfficeExpense, PilgrimExpenseItem } from '../types';

// Default Expense template for Main Hajj (মূল হজ)
export const createDefaultHajjExpenses = (baseTicket = 175000, hotelMakkah = 160000, hotelMadinah = 75000): PilgrimExpenseItem[] => [
  { id: 'exp-1', category: 'air_ticket', title: 'ঢাকা-জেদ্দা-মদিনা-ঢাকা বিমান টিকেট (সাউদিয়া / বিমান)', amount: baseTicket, note: 'ডিরেক্ট ফ্লাইট কনফার্ম' },
  { id: 'exp-2', category: 'visa_insurance', title: 'সৌদি হজ ভিসা ও স্বাস্থ্য ইন্স্যুরেন্স', amount: 45000, note: 'সৌদি হজ মন্ত্রণালয় ফি' },
  { id: 'exp-3', category: 'hotel_makkah', title: 'মক্কা হোটেল রুম ভাড়া (হারাম সংলগ্ন)', amount: hotelMakkah, note: '১৮ রাত শেয়ারিং' },
  { id: 'exp-4', category: 'hotel_madinah', title: 'মদিনা মোনাওয়ারা হোটেল রুম ভাড়া', amount: hotelMadinah, note: '৮ রাত মারকাজিয়া' },
  { id: 'exp-5', category: 'muallim_tent', title: 'মোয়াল্লেম সার্ভিস ও মিনা-আরাফাত এসি তাবু ফি', amount: 95000, note: 'ডি জোন মোয়াল্লেম ফি' },
  { id: 'exp-6', category: 'food_catering', title: 'তিন বেলা তিন তারকা দেশি খাবার ও ক্যাটারিং', amount: 35000, note: 'দৈনিক বুফে / প্যাকেট খাবার' },
  { id: 'exp-7', category: 'transport', title: 'জেদ্দা-মক্কা-মদিনা-মাশাএর অভ্যন্তরীণ এসি বাস', amount: 22000, note: 'সার্বক্ষণিক প্রাইভেট কাফেলা বাস' },
  { id: 'exp-8', category: 'qurbani', title: 'আল-রাজী ব্যাংক অফিসিয়াল কোরবানি কুপন', amount: 24000, note: 'হজ কোরবানির হাদিয়া' },
  { id: 'exp-9', category: 'ziyarah_guide', title: 'মক্কা ও মদিনা ঐতিহাসিক স্থানসমূহ জিয়ারাহ ও গাইড', amount: 6000, note: 'অভিজ্ঞ আলেম দ্বারা গাইডেন্স' },
  { id: 'exp-10', category: 'supplies_kit', title: 'মুত্তাকী এহরাম কাপড়, ট্রলি ব্যাগ, আইডি কার্ড ও কিট', amount: 8000, note: 'কাফেলা ব্রান্ডেড কিট বক্স' },
  { id: 'exp-11', category: 'misc', title: 'জমজম পানি ৫ লিটার ও ট্রাভেল সাপোর্ট মিসলেনিয়াস', amount: 4000, note: 'বিমানবন্দর জমজম ড্রপ' }
];

// Default Expense template for Umrah (ওমরাহ্ হজ)
export const createDefaultUmrahExpenses = (baseTicket = 85000, hotelMakkah = 35000, hotelMadinah = 25000): PilgrimExpenseItem[] => [
  { id: 'uexp-1', category: 'air_ticket', title: 'ঢাকা-জেদ্দা-ঢাকা এয়ার টিকেট (ফ্লাইট)', amount: baseTicket, note: 'ইকোনমি রিটার্ন টিকেট' },
  { id: 'uexp-2', category: 'visa_insurance', title: 'সৌদি ওমরাহ্ ইলেকট্রনিক ভিসা ও ইন্স্যুরেন্স', amount: 22000, note: '১ বছরের মাল্টিপল / ৯০ দিনের ভিসা' },
  { id: 'uexp-3', category: 'hotel_makkah', title: 'মক্কা মুকাররমা হোটেল রুম (৩ স্টার)', amount: hotelMakkah, note: '৮ রাত কোয়াড/শেয়ারিং' },
  { id: 'uexp-4', category: 'hotel_madinah', title: 'মদিনা মোনাওয়ারা হোটেল রুম', amount: hotelMadinah, note: '৫ রাত মারকাজিয়া' },
  { id: 'uexp-5', category: 'food_catering', title: 'খাবার ও ক্যাটারিং সার্ভিস (সকাল, দুপুর, রাত)', amount: 14000, note: 'বাঙালি বাবুর্চি দ্বারা রান্না' },
  { id: 'uexp-6', category: 'transport', title: 'জেদ্দা এয়ারপোর্ট পিকআপ, মক্কা-মদিনা বাস ট্রান্সপোর্ট', amount: 9000, note: 'গ্রুপ লাক্সারি বাস' },
  { id: 'uexp-7', category: 'ziyarah_guide', title: 'মক্কা ও মদিনার পবিত্র স্থানসমূহ জিয়ারাহ', amount: 4000, note: 'ঐতিহাসিক বদর, উহুদ, কুবা সফর' },
  { id: 'uexp-8', category: 'supplies_kit', title: 'মুত্তাকী ওমরাহ্ ব্যাগ, এহরাম ও গাইড বই', amount: 3500, note: 'ওমরাহ্ কিট' },
  { id: 'uexp-9', category: 'misc', title: 'জমজম পানি ও মিসলেনিয়াস চার্জেস', amount: 2500, note: 'সৌদি মোয়াল্লেম পোর্টাল ফি' }
];

export const DEFAULT_HAJI_FINANCE_RECORDS: HajiFinanceRecord[] = [
  {
    id: 'fin-umrah-ruzina',
    inquiryId: 'inq-umd26-ruzina',
    registrationRef: 'UMD26-RUZINA',
    hajiUserId: 'UMD26-RUZINA',
    hajiType: 'umrah',
    yearSeason: 'Group-DECEMBER 2026 / ২০২৬',
    hajiName: 'MST RUZINA BEGUM',
    hajiNameBn: 'মোছাঃ রুজিনা বেগম',
    phone: '01734781894',
    district: 'বগুড়া',
    packageName: 'ডিসেম্বর উমরাহ প্যাকেজ (2 shares)',
    packagePrice: 123500,
    discountAmount: 0,
    finalTotalAmount: 123500,
    totalDeposited: 50000,
    dueAmount: 73500,
    paymentStatus: 'partial',
    payments: [
      {
        id: 'pay-ruzina-1',
        amount: 50000,
        date: '2026-10-25',
        method: 'bank',
        voucherNo: 'UMD26-RUZINA',
        receivedBy: 'মুত্তাকী হজ্ব ক্যাশ কাউন্টার',
        note: 'রেজিস্ট্রেশনের সময় প্রাথমিক জমা/বুকিং মানি'
      }
    ],
    expenses: createDefaultUmrahExpenses(55000, 22000, 15000),
    totalExpense: 115000,
    netProfit: -65000,
    notes: 'ডিসেম্বর উমরাহ প্যাকেজ (Group-DECEMBER 2026), ২ জন শেয়ার। নির্ধারিত: ৳১,২৩,৫০০, জমা: ৳৫০,০০০, ডিউ: ৳৭৩,৫০০',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z'
  },
  {
    id: 'fin-umrah-belal',
    inquiryId: 'inq-umd26-belal',
    registrationRef: 'UMD26-BELAL',
    hajiUserId: 'UMD26-BELAL',
    hajiType: 'umrah',
    yearSeason: 'Group-DECEMBER 2026 / ২০২৬',
    hajiName: 'MD BELAL HOSSAIN',
    hajiNameBn: 'মোঃ বেলাল হোসেন',
    phone: '01734781894',
    district: 'বগুড়া',
    packageName: 'ডিসেম্বর উমরাহ প্যাকেজ (2 shares)',
    packagePrice: 123500,
    discountAmount: 0,
    finalTotalAmount: 123500,
    totalDeposited: 0,
    dueAmount: 123500,
    paymentStatus: 'due',
    payments: [],
    expenses: createDefaultUmrahExpenses(55000, 22000, 15000),
    totalExpense: 115000,
    netProfit: -115000,
    notes: 'ডিসেম্বর উমরাহ প্যাকেজ (Group-DECEMBER 2026), ২ জন শেয়ার। নির্ধারিত: ৳১,২৩,৫০০, জমা: ৳০, ডিউ: ৳১,২৩,৫০০',
    createdAt: '2026-10-25T10:00:00Z',
    updatedAt: '2026-10-25T10:00:00Z'
  }
];

export const DEFAULT_OFFICE_EXPENSES: OfficeExpense[] = [];

