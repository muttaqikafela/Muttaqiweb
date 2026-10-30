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
    id: 'fin-haji-001',
    registrationRef: 'MUT-HAJ-2026-01',
    hajiType: 'hajj',
    yearSeason: '২০২৬ (১৪৪৭ হি.)',
    hajiName: 'হাজী মো: রফিকুল ইসলাম',
    hajiNameBn: 'হাজী মো: রফিকুল ইসলাম',
    phone: '01712-345678',
    nidNo: '19821012345678901',
    passportNo: 'A08976543',
    district: 'বগুড়া (দুপচাঁচিয়া)',
    packageName: 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ (৪০ দিন)',
    packagePrice: 650000,
    discountAmount: 15000,
    finalTotalAmount: 635000,
    totalDeposited: 600000,
    dueAmount: 35000,
    paymentStatus: 'partial',
    payments: [
      { id: 'pay-1', amount: 200000, date: '2026-01-10', method: 'bank', voucherNo: 'TRX-9821', receivedBy: 'মুত্তাকী অফিস ক্যাশিয়ার', note: 'প্রাথমিক হজ বুকিং ও প্রাক-নিবন্ধন ফি' },
      { id: 'pay-2', amount: 300000, date: '2026-02-15', method: 'bank', voucherNo: 'TRX-1045', receivedBy: 'অ্যাকাউন্টস বিভাগ', note: 'বিমান টিকেট ও সৌদি ভিসা ফি বাবদ জমা' },
      { id: 'pay-3', amount: 100000, date: '2026-03-20', method: 'cash', voucherNo: 'CSH-045', receivedBy: 'ম্যানেজার', note: '৩য় কিস্তি নগদ পরিশোধ' }
    ],
    expenses: createDefaultHajjExpenses(175000, 160000, 75000),
    totalExpense: 579000,
    netProfit: 21000, // Deposited 600000 - Expense 579000
    notes: 'ভিআইপি ডাবল রুম প্রেফারেন্স। সমস্ত ডকুমেন্টস ও বায়োমেট্রিক সম্পন্ন হয়েছে।',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-03-20T14:30:00Z'
  },
  {
    id: 'fin-haji-002',
    registrationRef: 'MUT-HAJ-2026-02',
    hajiType: 'hajj',
    yearSeason: '২০২৬ (১৪৪৭ হি.)',
    hajiName: 'হাজী মোসাম্মৎ সেলিনা আক্তার',
    hajiNameBn: 'হাজী মোসাম্মৎ সেলিনা আক্তার',
    phone: '01819-876543',
    nidNo: '19871098765432100',
    passportNo: 'B01234567',
    district: 'নওগাঁ',
    packageName: 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ (৪০ দিন)',
    packagePrice: 650000,
    discountAmount: 15000,
    finalTotalAmount: 635000,
    totalDeposited: 635000,
    dueAmount: 0,
    paymentStatus: 'paid',
    payments: [
      { id: 'pay-4', amount: 250000, date: '2026-01-12', method: 'bank', voucherNo: 'TRX-9844', receivedBy: 'অ্যাকাউন্টস বিভাগ', note: '১ম কিস্তি ব্যাংক ট্রান্সফার' },
      { id: 'pay-5', amount: 385000, date: '2026-02-28', method: 'bank', voucherNo: 'TRX-1090', receivedBy: 'অ্যাকাউন্টস বিভাগ', note: 'বকেয়া সম্পূর্ণ পরিশোধ' }
    ],
    expenses: createDefaultHajjExpenses(175000, 160000, 75000),
    totalExpense: 579000,
    netProfit: 56000, // Deposited 635000 - Expense 579000
    notes: 'সম্পূর্ণ টাকা পরিশোধিত। মহিলা কাফেলা উইং এর সাথে থাকবেন।',
    createdAt: '2026-01-12T11:15:00Z',
    updatedAt: '2026-02-28T16:00:00Z'
  },
  {
    id: 'fin-haji-003',
    registrationRef: 'MUT-HAJ-2026-03',
    hajiType: 'hajj',
    yearSeason: '২০২৬ (১৪৪৭ হি.)',
    hajiName: 'মাওলানা মোঃ আব্দুর রহিম',
    hajiNameBn: 'মাওলানা মোঃ আব্দুর রহিম',
    phone: '01711-223344',
    nidNo: '19752691823712345',
    passportNo: 'A10293847',
    district: 'বগুড়া সদর',
    packageName: 'সরকারি স্ট্যান্ডার্ড হজ্ব প্যাকেজ (৩৮ দিন)',
    packagePrice: 520000,
    discountAmount: 20000,
    finalTotalAmount: 500000,
    totalDeposited: 450000,
    dueAmount: 50000,
    paymentStatus: 'partial',
    payments: [
      { id: 'pay-6', amount: 200000, date: '2026-01-20', method: 'bank', voucherNo: 'TRX-9901', receivedBy: 'ক্যাশিয়ার', note: 'হজ রেজিস্ট্রেশন কিস্তি' },
      { id: 'pay-7', amount: 250000, date: '2026-03-05', method: 'cash', voucherNo: 'CSH-062', receivedBy: 'ম্যানেজার', note: '২য় কিস্তি নগদ' }
    ],
    expenses: createDefaultHajjExpenses(165000, 125000, 60000),
    totalExpense: 509000,
    netProfit: -59000, // Currently -59000 because 50000 due remaining. When full paid: 500000 - 509000
    notes: 'কাফেলার সহকারী আলেম গাইড হিসেবে দায়িত্ব পালন করবেন।',
    createdAt: '2026-01-20T09:30:00Z',
    updatedAt: '2026-03-05T12:00:00Z'
  },

  // Umrah Pilgrims (ওমরাহ্ হজ যাত্রী)
  {
    id: 'fin-umrah-001',
    registrationRef: 'MUT-UMR-2026-01',
    hajiType: 'umrah',
    yearSeason: 'রমজান ওমরাহ্ ২০২৬',
    hajiName: 'জনাব মোহাম্মদ আব্দুল্লাহ',
    hajiNameBn: 'জনাব মোহাম্মদ আব্দুল্লাহ',
    phone: '01912-334455',
    nidNo: '19901019283746500',
    passportNo: 'A09871234',
    district: 'জয়পুরহাট',
    packageName: 'রমজান মোবারক ওমরাহ প্যাকেজ (২০ দিন)',
    packagePrice: 225000,
    discountAmount: 5000,
    finalTotalAmount: 220000,
    totalDeposited: 220000,
    dueAmount: 0,
    paymentStatus: 'paid',
    payments: [
      { id: 'upay-1', amount: 100000, date: '2026-02-01', method: 'bank', voucherNo: 'TRX-9932', receivedBy: 'ক্যাশিয়ার', note: 'ওমরাহ্ বুকিং এগ্রিমেন্ট' },
      { id: 'upay-2', amount: 120000, date: '2026-02-25', method: 'bkash', voucherNo: 'BK-7721', receivedBy: 'বিকাশ মার্চেন্ট', note: 'ভিসা ও টিকেট নিশ্চিতকরণ' }
    ],
    expenses: createDefaultUmrahExpenses(95000, 48000, 30000),
    totalExpense: 194000,
    netProfit: 26000, // 220000 - 194000
    notes: 'রমজানের শেষ দশ দিন মক্কায় অবস্থান করবেন। সম্পূর্ণ পরিশোধিত।',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-25T15:00:00Z'
  },
  {
    id: 'fin-umrah-002',
    registrationRef: 'MUT-UMR-2026-02',
    hajiType: 'umrah',
    yearSeason: 'শাওয়াল ওমরাহ্ ২০২৬',
    hajiName: 'হাজী মোঃ কামরুল হাসান',
    hajiNameBn: 'হাজী মোঃ কামরুল হাসান',
    phone: '01733-445566',
    nidNo: '19853829102938471',
    passportNo: 'B08761234',
    district: 'বগুড়া (দুপচাঁচিয়া)',
    packageName: 'পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)',
    packagePrice: 165000,
    discountAmount: 0,
    finalTotalAmount: 165000,
    totalDeposited: 120000,
    dueAmount: 45000,
    paymentStatus: 'partial',
    payments: [
      { id: 'upay-3', amount: 70000, date: '2026-03-01', method: 'cash', voucherNo: 'CSH-077', receivedBy: 'ম্যানেজার', note: 'ওমরাহ প্রাথমিক জমা' },
      { id: 'upay-4', amount: 50000, date: '2026-03-15', method: 'bank', voucherNo: 'TRX-1120', receivedBy: 'অ্যাকাউন্টস', note: 'টিকেট ইস্যু বাবদ জমা' }
    ],
    expenses: createDefaultUmrahExpenses(85000, 35000, 25000),
    totalExpense: 144000,
    netProfit: -24000, // when 45000 paid: net profit = +21000
    notes: 'পাসপোর্ট জমা নেওয়া হয়েছে। বাকি টাকা যাত্রার ১০ দিন পূর্বে দেবেন।',
    createdAt: '2026-03-01T11:00:00Z',
    updatedAt: '2026-03-15T16:00:00Z'
  },
  {
    id: 'fin-umrah-003',
    registrationRef: 'MUT-UMR-2026-03',
    hajiType: 'umrah',
    yearSeason: 'শাওয়াল ওমরাহ্ ২০২৬',
    hajiName: 'বেগম নাসিমা পারভীন',
    hajiNameBn: 'বেগম নাসিমা পারভীন',
    phone: '01844-556677',
    nidNo: '19894829102938472',
    passportNo: 'A19827364',
    district: 'বগুড়া',
    packageName: 'পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)',
    packagePrice: 165000,
    discountAmount: 5000,
    finalTotalAmount: 160000,
    totalDeposited: 160000,
    dueAmount: 0,
    paymentStatus: 'paid',
    payments: [
      { id: 'upay-5', amount: 160000, date: '2026-03-05', method: 'bank', voucherNo: 'TRX-1144', receivedBy: 'অ্যাকাউন্টস বিভাগ', note: 'এককালীন সম্পূর্ণ ফি পরিশোধ' }
    ],
    expenses: createDefaultUmrahExpenses(85000, 35000, 25000),
    totalExpense: 144000,
    netProfit: 16000, // 160000 - 144000
    notes: 'স্বামী হাজী মোঃ কামরুল হাসানের সাথে সফরসঙ্গী। সম্পূর্ণ পরিশোধিত।',
    createdAt: '2026-03-05T14:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z'
  }
];

export const DEFAULT_OFFICE_EXPENSES: OfficeExpense[] = [
  {
    id: 'off-exp-001',
    title: 'অফিস ভাড়া (মদিনা শপিং কমপ্লেক্স, দুপচাঁচিয়া - জানুয়ারি ও ফেব্রুয়ারি)',
    category: 'rent',
    amount: 30000,
    date: '2026-02-01',
    expenseType: 'general',
    yearSeason: '২০২৬',
    paidBy: 'মুত্তাকী কর্তৃপক্ষ',
    voucherNo: 'VCH-RENT-01',
    note: 'মাসিক ১৫,০০০ টাকা হারে দুই মাসের অফিস স্পেস ভাড়া পরিশোধ।',
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'off-exp-002',
    title: 'অফিস স্টাফ ও অ্যাকাউন্টস ম্যানেজারের মাসিক সম্মানী / বেতন',
    category: 'salary',
    amount: 45000,
    date: '2026-02-28',
    expenseType: 'general',
    yearSeason: '২০২৬',
    paidBy: 'পরিচালক (অর্থ)',
    voucherNo: 'VCH-SAL-02',
    note: '২ জন অফিস এক্সিকিউটিভ ও ১ জন কাস্টমার সাপোর্ট স্টাফের বেতন।',
    createdAt: '2026-02-28T18:00:00Z'
  },
  {
    id: 'off-exp-003',
    title: 'হজ ও ওমরাহ্ বিশেষ প্রচারণামূলক লিফলেট, ব্যানার ও ফেসবুক বুস্টিং',
    category: 'marketing',
    amount: 18500,
    date: '2026-01-15',
    expenseType: 'general',
    yearSeason: '২০২৬',
    paidBy: 'মার্কেটিং উইং',
    voucherNo: 'VCH-MKT-03',
    note: 'বগুড়া ও নওগাঁ জেলায় ৪টি মসজিদে ব্যানার ও ৩০০০ লিফলেট বিতরণ।',
    createdAt: '2026-01-15T12:00:00Z'
  },
  {
    id: 'off-exp-004',
    title: 'অফিস বিদ্যুৎ বিল, ওয়াইফাই ইন্টারনেট ও অফিশিয়াল হটলাইন মোবাইল রিচার্জ',
    category: 'utility',
    amount: 6800,
    date: '2026-02-20',
    expenseType: 'general',
    yearSeason: '২০২৬',
    paidBy: 'অফিস সহকারী',
    voucherNo: 'VCH-UTL-04',
    note: 'অফিস অপটিক্যাল ফাইবার ইন্টারনেট ও পল্লী বিদ্যুৎ বিল।',
    createdAt: '2026-02-20T11:00:00Z'
  },
  {
    id: 'off-exp-005',
    title: 'ধর্ম মন্ত্রণালয় ও হাব (HAAB) বাৎসরিক এজেন্সি লাইসেন্স রিনিউ ও ট্যাক্স',
    category: 'legal_license',
    amount: 35000,
    date: '2026-01-05',
    expenseType: 'hajj_overhead',
    yearSeason: '২০২৬ (১৪৪৭ হি.)',
    paidBy: 'ব্যবস্থাপনা পরিচালক',
    voucherNo: 'VCH-LGL-05',
    note: 'হজ কাফেলা পরিচালন সরকারি অনুমোদন ও সমিতি ফি।',
    createdAt: '2026-01-05T09:30:00Z'
  },
  {
    id: 'off-exp-006',
    title: 'হাজীদের জন্য প্রাক-হজ প্রশিক্ষণ সেমিনার ও মেহমানদারি আপ্যায়ন',
    category: 'stationery',
    amount: 12500,
    date: '2026-03-10',
    expenseType: 'hajj_overhead',
    yearSeason: '২০২৬ (১৪৪৭ হি.)',
    paidBy: 'প্রোগ্রাম কো-অর্ডিনেটর',
    voucherNo: 'VCH-SEM-06',
    note: 'হজ প্রশিক্ষণ কর্মশালায় ৫০ জন হাজী ও ওলামায়ে কেরামের দুপুরের তাবাররুক ও নাস্তা।',
    createdAt: '2026-03-10T16:00:00Z'
  },
  {
    id: 'off-inc-001',
    title: 'পাসপোর্ট প্রসেসিং ও জরুরি কনসালটেন্সি সার্ভিস চার্জ (১০ জন যাত্রী)',
    category: 'service_charge',
    entryType: 'income',
    amount: 15000,
    date: '2026-02-12',
    expenseType: 'general',
    yearSeason: '২০২৬',
    paidBy: 'মুত্তাকী সার্ভিস কাউন্টার',
    voucherNo: 'INC-SRV-01',
    note: 'জরুরি পাসপোর্ট ও নোটারি সার্ভিস বাবদ অর্জিত সার্ভিস চার্জ।',
    createdAt: '2026-02-12T11:00:00Z'
  },
  {
    id: 'off-inc-002',
    title: 'এয়ারলাইন্স গ্রুপ টিকিট বুকিং প্রণোদনা / কমিশন আয়',
    category: 'commission',
    entryType: 'income',
    amount: 28000,
    date: '2026-02-25',
    expenseType: 'hajj_overhead',
    yearSeason: '২০২৬',
    paidBy: 'এয়ারলাইন্স জিডিএস পার্টনার',
    voucherNo: 'INC-AIR-02',
    note: 'সাউদিয়া ও বিমান বাংলাদেশ এয়ারলাইন্স গ্রুপ সিট বুকিং ইনসেন্টিভ।',
    createdAt: '2026-02-25T15:00:00Z'
  }
];
