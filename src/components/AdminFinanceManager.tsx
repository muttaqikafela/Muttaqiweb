import React, { useState, useMemo, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  HajiFinanceRecord,
  OfficeExpense,
  PilgrimExpenseItem,
  PaymentRecord,
  HajjType,
  OfficeExpenseCategory,
  PilgrimExpenseCategory,
  PaymentMethod
} from '../types';
import {
  Calculator,
  Receipt,
  Plus,
  Search,
  Filter,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Phone,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Sparkles,
  Database,
  RefreshCw,
  BadgePercent,
  Check,
  Lock,
  ChevronRight,
  ArrowLeft,
  Layers,
  FolderOpen,
  Eye,
  Upload,
  X,
  User,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import {
  extractItemType,
  normalizeBengaliYear,
  extractItemYear,
  extractItemGroup
} from '../utils/drillDownHelpers';
import { prepareReceiptFile } from '../utils/receiptHelpers';

const PILGRIM_EXPENSE_CATEGORY_LABELS: Record<PilgrimExpenseCategory, string> = {
  air_ticket: 'বিমান টিকেট',
  visa_insurance: 'ভিসা ও ট্রাভেল ইন্স্যুরেন্স',
  hotel_makkah: 'মক্কা হোটেল',
  hotel_madinah: 'মদিনা হোটেল',
  muallim_tent: 'মোয়াল্লেম ফি ও মিনা-আরাফাত তাবু',
  food_catering: 'খাবার ও ক্যাটারিং',
  transport: 'বাস ও ট্রান্সপোর্ট',
  qurbani: 'কোরবানি / হাদিয়া',
  ziyarah_guide: 'জিয়ারাহ ও গাইড',
  supplies_kit: 'এহরাম, ট্রলি ব্যাগ ও কিট',
  misc: 'অন্যান্য বিবিধ খরচ'
};
const PILGRIM_EXPENSE_CATEGORIES = Object.keys(PILGRIM_EXPENSE_CATEGORY_LABELS) as PilgrimExpenseCategory[];
const getPilgrimExpenseCategoryLabel = (item: Pick<PilgrimExpenseItem, 'category' | 'customCategoryName'>): string =>
  item.customCategoryName?.trim() || PILGRIM_EXPENSE_CATEGORY_LABELS[item.category] || item.category;
type ManualExpenseLineDraft = {
  category: PilgrimExpenseCategory;
  customCategoryName: string;
  amount: number;
  voucherNo: string;
  receiptDataUrl: string;
  receiptFileName: string;
  receiptMimeType: string;
  isReceiptUploading: boolean;
};
const createEmptyManualExpenseLine = (category: PilgrimExpenseCategory): ManualExpenseLineDraft => ({
  category,
  customCategoryName: '',
  amount: 0,
  voucherNo: '',
  receiptDataUrl: '',
  receiptFileName: '',
  receiptMimeType: '',
  isReceiptUploading: false
});
const createEmptyManualExpenseLines = (): Record<string, ManualExpenseLineDraft> =>
  Object.fromEntries(PILGRIM_EXPENSE_CATEGORIES.map((category) => [category, createEmptyManualExpenseLine(category)]));

const MAX_MANUAL_RECEIPT_DATA_URL_CHARS = 1_000_000;
const MAX_MANUAL_RECEIPTS_TOTAL_CHARS = 2_000_000;
const isSafeManualReceiptDataUrl = (value?: string): value is string =>
  Boolean(value && /^data:(?:image\/(?:jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(value));

const readBlobAsDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('ফাইলটি পড়া যায়নি।'));
  reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('ফাইলটি পড়া যায়নি।'));
  reader.readAsDataURL(blob);
});

const prepareManualReceiptFile = async (file: File): Promise<{ dataUrl: string; fileName: string; mimeType: string }> => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (file.type !== 'application/pdf' && !allowedImageTypes.includes(file.type)) {
    throw new Error('শুধু JPG, PNG, WEBP ছবি অথবা PDF রসিদ আপলোড করা যাবে।');
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('রসিদের ছবির ফাইল ৮ MB-এর মধ্যে রাখুন।');
  if (file.type === 'application/pdf') {
    if (file.size > 700 * 1024) throw new Error('PDF রসিদ ৭০০ KB-এর মধ্যে রাখুন।');
    return { dataUrl: await readBlobAsDataUrl(file), fileName: file.name, mimeType: file.type };
  }

  const sourceUrl = await readBlobAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('ছবিটি খোলা যায়নি। JPG, PNG বা WEBP ছবি ব্যবহার করুন।'));
    img.src = sourceUrl;
  });
  const makeCompressedImage = (maxSide: number, quality: number) => {
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('ছবিটি সংকুচিত করা যায়নি।');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  };
  let dataUrl = makeCompressedImage(1800, 0.82);
  if (dataUrl.length > MAX_MANUAL_RECEIPT_DATA_URL_CHARS) dataUrl = makeCompressedImage(1400, 0.68);
  if (dataUrl.length > MAX_MANUAL_RECEIPT_DATA_URL_CHARS) throw new Error('সংকুচিত ছবিটি ১ MB-এর মধ্যে রাখা যাচ্ছে না।');
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'money-receipt';
  return { dataUrl, fileName: `${baseName}.jpg`, mimeType: 'image/jpeg' };
};

export const AdminFinanceManager: React.FC = () => {
  const {
    hajiFinanceRecords,
    officeExpenses,
    inquiries,
    kafelaGroups,
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
    importInquiryToFinance,
    syncAllHajisToFinance,
    getFinanceSummary,
    requestConfirm,
    showToast,
    isSubAdmin,
    canEdit,
    activeSubAdmin,
    canSubAdminAdd,
    canSubAdminEdit,
    canSubAdminDelete,
    getSubAdminModuleRole
  } = useAdmin();

  // Sub-tabs
  type FinanceTab = 'overview' | 'hajj' | 'umrah' | 'office' | 'pilgrim-expenses';
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [pilgrimExpenseType, setPilgrimExpenseType] = useState<HajjType | null>(null);
  const [isGeneratingExpensePdf, setIsGeneratingExpensePdf] = useState(false);

  // Pilgrim Profile Modal state (সম্পূর্ণ তথ্য, প্যাকেজ, রুম, ফ্লাইট ও মানি রিসিট স্টেটমেন্ট)
  const [profilePilgrim, setProfilePilgrim] = useState<HajiFinanceRecord | null>(null);

  // Receipt Lightbox Viewer state (মানি রিসিট বড় করে দেখার লাইটবক্স)
  const [receiptViewer, setReceiptViewer] = useState<{
    url: string;
    fileName?: string;
    title: string;
    amount?: number;
    date?: string;
  } | null>(null);

  // 4-Level Drill-Down State for Hajj & Umrah Finance Ledgers
  // Level 1: activeTab ('hajj' | 'umrah')
  // Level 2: finDrillYear ('২০২৬', etc.)
  // Level 3: finDrillGroup ('Group-DECEMBER 2026', etc.)
  // Level 4: Group Financial Ledger & Pilgrims Table
  const [finDrillYear, setFinDrillYear] = useState<string | null>(null);
  const [finDrillGroup, setFinDrillGroup] = useState<string | null>(null);
  const [finViewMode, setFinViewMode] = useState<'drill' | 'flat'>('drill');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'partial' | 'due'>('all');
  const [officeFilterType, setOfficeFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Expanded pilgrim row for expense and payment details
  const [expandedPilgrimId, setExpandedPilgrimId] = useState<string | null>(null);

  // Payment Modal state (with Money Receipt upload)
  const [paymentModalHaji, setPaymentModalHaji] = useState<HajiFinanceRecord | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentDateInput, setPaymentDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>('bank');
  const [paymentVoucherInput, setPaymentVoucherInput] = useState<string>('');
  const [paymentReceivedByInput, setPaymentReceivedByInput] = useState<string>('মুত্তাকী ক্যাশিয়ার');
  const [paymentNoteInput, setPaymentNoteInput] = useState<string>('');
  const [paymentReceiptDataUrl, setPaymentReceiptDataUrl] = useState<string>('');
  const [paymentReceiptFileName, setPaymentReceiptFileName] = useState<string>('');
  const [paymentReceiptMimeType, setPaymentReceiptMimeType] = useState<string>('');
  const [isPaymentReceiptUploading, setIsPaymentReceiptUploading] = useState<boolean>(false);

  // Edit Expense Modal state
  const [expenseModalHaji, setExpenseModalHaji] = useState<HajiFinanceRecord | null>(null);
  const [editedExpenses, setEditedExpenses] = useState<PilgrimExpenseItem[]>([]);
  const [isManualPilgrimExpenseModalOpen, setIsManualPilgrimExpenseModalOpen] = useState(false);
  const [manualExpenseRecordId, setManualExpenseRecordId] = useState('');
  const [manualExpenseLines, setManualExpenseLines] = useState<Record<string, ManualExpenseLineDraft>>(createEmptyManualExpenseLines);
  const manualExpenseLinesRef = useRef(manualExpenseLines);
  manualExpenseLinesRef.current = manualExpenseLines;
  const updateManualExpenseLine = (lineKey: string, patch: Partial<ManualExpenseLineDraft>) => {
    const next = {
      ...manualExpenseLinesRef.current,
      [lineKey]: { ...manualExpenseLinesRef.current[lineKey], ...patch }
    };
    manualExpenseLinesRef.current = next;
    setManualExpenseLines(next);
  };
  const manualCustomCategoryCount = Object.keys(manualExpenseLines).filter((key) => key.startsWith('custom:')).length;
  const isAnyManualReceiptUploading = Object.values(manualExpenseLines).some((line) => line.isReceiptUploading);
  const [manualExpenseDate, setManualExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualExpenseNote, setManualExpenseNote] = useState('');

  // Add New Pilgrim Modal
  const [isAddPilgrimModalOpen, setIsAddPilgrimModalOpen] = useState(false);
  const [newPilgrimType, setNewPilgrimType] = useState<HajjType>('hajj');
  const [newPilgrimName, setNewPilgrimName] = useState('');
  const [newPilgrimPhone, setNewPilgrimPhone] = useState('');
  const [newPilgrimNid, setNewPilgrimNid] = useState('');
  const [newPilgrimPassport, setNewPilgrimPassport] = useState('');
  const [newPilgrimDistrict, setNewPilgrimDistrict] = useState('বগুড়া');
  const [newPilgrimYear, setNewPilgrimYear] = useState('২০২৬ (১৪৪৭ হি.)');
  const [newPilgrimPackage, setNewPilgrimPackage] = useState('বেসরকারি ভিআইপি হজ্ব প্যাকেজ (৪০ দিন)');
  const [newPilgrimPrice, setNewPilgrimPrice] = useState<number>(650000);
  const [newPilgrimDiscount, setNewPilgrimDiscount] = useState<number>(0);
  const [newPilgrimInitialDeposit, setNewPilgrimInitialDeposit] = useState<number>(200000);

  // Office / Other Incomes & Expenses Modal state
  const [isOfficeExpModalOpen, setIsOfficeExpModalOpen] = useState(false);
  const [isOfficeOverheadEntry, setIsOfficeOverheadEntry] = useState(false);
  const [officeEntryType, setOfficeEntryType] = useState<'expense' | 'income'>('expense');
  const [officeExpTitle, setOfficeExpTitle] = useState('');
  const [officeExpCategory, setOfficeExpCategory] = useState<OfficeExpenseCategory>('rent');
  const [officeExpAmount, setOfficeExpAmount] = useState<number>(0);
  const [officeExpDate, setOfficeExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [officeExpType, setOfficeExpType] = useState<'general' | 'hajj_overhead' | 'umrah_overhead'>('general');
  const [officeExpVoucher, setOfficeExpVoucher] = useState('');
  const [officeExpPayer, setOfficeExpPayer] = useState('অফিস অ্যাকাউন্টস');
  const [officeExpNote, setOfficeExpNote] = useState('');

  // Printable Voucher / Receipt Modal state
  const [printPilgrim, setPrintPilgrim] = useState<HajiFinanceRecord | null>(null);

  // Compute live financial summary
  const summary = useMemo(() => {
    return getFinanceSummary(yearFilter);
  }, [getFinanceSummary, yearFilter, hajiFinanceRecords, officeExpenses]);

  // Filtered lists
  const filteredHajjRecords = useMemo(() => {
    return hajiFinanceRecords.filter((rec) => {
      if (rec.hajiType !== 'hajj') return false;
      if (yearFilter !== 'all' && !rec.yearSeason.includes(yearFilter) && !(yearFilter === '২০২৬' && /2026|২০২৬/i.test(rec.yearSeason))) return false;
      if (paymentStatusFilter !== 'all' && rec.paymentStatus !== paymentStatusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          rec.hajiName.toLowerCase().includes(q) ||
          (rec.phone || '').includes(q) ||
          (rec.registrationRef || '').toLowerCase().includes(q) ||
          (rec.passportNo || '').toLowerCase().includes(q) ||
          (rec.nidNo || '').includes(q)
        );
      }
      return true;
    });
  }, [hajiFinanceRecords, yearFilter, paymentStatusFilter, searchTerm]);

  const filteredUmrahRecords = useMemo(() => {
    return hajiFinanceRecords.filter((rec) => {
      if (rec.hajiType !== 'umrah') return false;
      if (yearFilter !== 'all' && !rec.yearSeason.includes(yearFilter) && !(yearFilter === '২০২৬' && /2026|২০২৬/i.test(rec.yearSeason))) return false;
      if (paymentStatusFilter !== 'all' && rec.paymentStatus !== paymentStatusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          rec.hajiName.toLowerCase().includes(q) ||
          (rec.phone || '').includes(q) ||
          (rec.registrationRef || '').toLowerCase().includes(q) ||
          (rec.passportNo || '').toLowerCase().includes(q) ||
          (rec.nidNo || '').includes(q)
        );
      }
      return true;
    });
  }, [hajiFinanceRecords, yearFilter, paymentStatusFilter, searchTerm]);

  // Active type for current ledger tab
  const currentLedgerType: 'hajj' | 'umrah' = activeTab === 'hajj' ? 'hajj' : 'umrah';

  // Available Registration Years for active ledger tab (Level 2)
  const availableFinYears = useMemo(() => {
    if (activeTab !== 'hajj' && activeTab !== 'umrah') return [];
    const list = hajiFinanceRecords.filter((rec) => rec.hajiType === currentLedgerType);
    const yearMap = new Map<string, { count: number; totalContract: number; totalDeposited: number; totalDue: number }>();

    list.forEach((rec) => {
      const yr = extractItemYear(rec);
      const curr = yearMap.get(yr) || { count: 0, totalContract: 0, totalDeposited: 0, totalDue: 0 };
      yearMap.set(yr, {
        count: curr.count + 1,
        totalContract: curr.totalContract + (Number(rec.finalTotalAmount) || 0),
        totalDeposited: curr.totalDeposited + (Number(rec.totalDeposited) || 0),
        totalDue: curr.totalDue + (Number(rec.dueAmount) || 0)
      });
    });

    if (!yearMap.has('২০২৬')) {
      yearMap.set('২০২৬', { count: 0, totalContract: 0, totalDeposited: 0, totalDue: 0 });
    }

    return Array.from(yearMap.entries()).map(([year, data]) => ({
      year,
      ...data
    }));
  }, [hajiFinanceRecords, activeTab, currentLedgerType]);

  // Available Groups for chosen activeTab & finDrillYear (Level 3)
  const availableFinGroups = useMemo(() => {
    if ((activeTab !== 'hajj' && activeTab !== 'umrah') || !finDrillYear) return [];
    const list = hajiFinanceRecords.filter((rec) => {
      if (rec.hajiType !== currentLedgerType) return false;
      const yr = extractItemYear(rec);
      return yr === finDrillYear;
    });

    const groupMap = new Map<string, HajiFinanceRecord[]>();
    list.forEach((rec) => {
      const grp = extractItemGroup(rec, inquiries, kafelaGroups);
      if (!groupMap.has(grp)) groupMap.set(grp, []);
      groupMap.get(grp)!.push(rec);
    });

    // Include configured kafela groups
    kafelaGroups.forEach((g) => {
      if (!groupMap.has(g.name)) {
        groupMap.set(g.name, []);
      }
    });

    return Array.from(groupMap.entries()).map(([groupName, records]) => {
      const matchingKafelaGroup = kafelaGroups.find((g) => g.name.toLowerCase() === groupName.toLowerCase());
      const totalContract = records.reduce((sum, r) => sum + (Number(r.finalTotalAmount) || 0), 0);
      const totalDeposited = records.reduce((sum, r) => sum + (Number(r.totalDeposited) || 0), 0);
      const totalDue = Math.max(0, totalContract - totalDeposited);

      return {
        groupName,
        records,
        count: records.length,
        totalContract,
        totalDeposited,
        totalDue,
        leader: matchingKafelaGroup?.leader || 'প্রধান মোয়াল্লেম / কাফেলা পরিচালক',
        maxCapacity: matchingKafelaGroup?.maxCapacity || 50,
        departureDate: matchingKafelaGroup?.departureDate || (currentLedgerType === 'umrah' ? 'ডিসেম্বর ২০২৬' : 'জিলহজ ১৪৪৭ হি.')
      };
    }).sort((a, b) => b.count - a.count);
  }, [hajiFinanceRecords, activeTab, currentLedgerType, finDrillYear, inquiries, kafelaGroups]);

  // Current selected group summary (Level 4)
  const currentFinGroupSummary = useMemo(() => {
    if (!finDrillGroup) return null;
    const targetGroup = availableFinGroups.find((g) => g.groupName === finDrillGroup);
    if (!targetGroup) return null;
    return targetGroup;
  }, [availableFinGroups, finDrillGroup]);

  // Filtered records to display for the ledger
  const displayedLedgerRecords = useMemo(() => {
    const baseList = activeTab === 'hajj' ? filteredHajjRecords : filteredUmrahRecords;
    if (finViewMode === 'flat') {
      return baseList;
    }
    if (finDrillYear && finDrillGroup) {
      return baseList.filter((rec) => {
        const yr = extractItemYear(rec);
        const grp = extractItemGroup(rec, inquiries, kafelaGroups);
        return yr === finDrillYear && grp === finDrillGroup;
      });
    }
    return baseList;
  }, [activeTab, filteredHajjRecords, filteredUmrahRecords, finViewMode, finDrillYear, finDrillGroup, inquiries, kafelaGroups]);

  const getPilgrimExpenseAmount = (record: HajiFinanceRecord): number => {
    const expenseItems = Array.isArray(record.expenses) ? record.expenses : [];
    return expenseItems.length > 0
      ? expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : Number(record.totalExpense) || 0;
  };

  const filteredPilgrimExpenseRecords = useMemo(() => {
    if (!pilgrimExpenseType) return [];
    return hajiFinanceRecords.filter((rec) => {
      if (rec.hajiType !== pilgrimExpenseType) return false;
      if (yearFilter !== 'all' && !rec.yearSeason.includes(yearFilter) && !(yearFilter === '২০২৬' && /2026|২০২৬/i.test(rec.yearSeason))) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          rec.hajiName.toLowerCase().includes(q) ||
          (rec.hajiNameBn || '').toLowerCase().includes(q) ||
          (rec.phone || '').includes(q) ||
          (rec.registrationRef || '').toLowerCase().includes(q) ||
          (rec.passportNo || '').toLowerCase().includes(q) ||
          (rec.nidNo || '').includes(q)
        );
      }
      return true;
    });
  }, [hajiFinanceRecords, pilgrimExpenseType, yearFilter, searchTerm]);

  const manualExpenseCandidates = useMemo(() => {
    if (!pilgrimExpenseType) return [];
    return hajiFinanceRecords.filter((record) =>
      record.hajiType === pilgrimExpenseType &&
      (yearFilter === 'all' || record.yearSeason.includes(yearFilter) || (yearFilter === '২০২৬' && /2026|২০২৬/i.test(record.yearSeason)))
    );
  }, [hajiFinanceRecords, pilgrimExpenseType, yearFilter]);

  const pilgrimExpenseTotal = useMemo(
    () => filteredPilgrimExpenseRecords.reduce((sum, record) => sum + getPilgrimExpenseAmount(record), 0),
    [filteredPilgrimExpenseRecords]
  );

  const pilgrimExpenseCategorySummary = useMemo(() => {
    const totals = new Map<string, { name: string; amount: number; entries: number }>();
    filteredPilgrimExpenseRecords.forEach((record) => {
      (Array.isArray(record.expenses) ? record.expenses : []).forEach((item) => {
        const amount = Number(item.amount) || 0;
        if (amount <= 0) return;
        const name = getPilgrimExpenseCategoryLabel(item);
        const current = totals.get(name) || { name, amount: 0, entries: 0 };
        totals.set(name, { name, amount: current.amount + amount, entries: current.entries + 1 });
      });
    });
    return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredPilgrimExpenseRecords]);

  const topPilgrimExpenseRecords = useMemo(() =>
    filteredPilgrimExpenseRecords
      .map((record) => ({ record, amount: getPilgrimExpenseAmount(record) }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
  [filteredPilgrimExpenseRecords]);

  const filteredPilgrimOfficeOverheads = useMemo(() => {
    if (!pilgrimExpenseType) return [];
    const expenseType = pilgrimExpenseType === 'hajj' ? 'hajj_overhead' : 'umrah_overhead';
    return officeExpenses.filter((expense) => {
      if (expense.entryType === 'income' || expense.expenseType !== expenseType) return false;
      if (yearFilter !== 'all' && expense.yearSeason && !expense.yearSeason.includes(yearFilter) && !(yearFilter === '২০২৬' && /2026|২০২৬/i.test(expense.yearSeason))) return false;
      return true;
    });
  }, [officeExpenses, pilgrimExpenseType, yearFilter]);

  const pilgrimOfficeOverheadTotal = useMemo(
    () => filteredPilgrimOfficeOverheads.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0),
    [filteredPilgrimOfficeOverheads]
  );

  const filteredOfficeExpenses = useMemo(() => {
    return officeExpenses.filter((exp) => {
      if (yearFilter !== 'all' && exp.yearSeason && !exp.yearSeason.includes(yearFilter) && !(yearFilter === '২০২৬' && /2026|২০২৬/i.test(exp.yearSeason))) return false;
      if (officeFilterType === 'income' && exp.entryType !== 'income') return false;
      if (officeFilterType === 'expense' && exp.entryType === 'income') return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          exp.title.toLowerCase().includes(q) ||
          (exp.voucherNo || '').toLowerCase().includes(q) ||
          (exp.paidBy || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [officeExpenses, yearFilter, officeFilterType, searchTerm]);

  // Non-imported registrations available for quick import
  const unimportedInquiries = useMemo(() => {
    const existingInqIds = new Set(
      hajiFinanceRecords.filter((r) => r.inquiryId).map((r) => r.inquiryId)
    );
    return inquiries.filter((inq) => !existingInqIds.has(inq.id));
  }, [inquiries, hajiFinanceRecords]);


  // Format currency in Bengali BDT
  const formatBDT = (amount: number): string => {
    return `৳${Math.round(amount).toLocaleString('en-IN')}`;
  };

  const handleExportPilgrimExpensesCsv = () => {
    if (!pilgrimExpenseType) return;
    const typeLabel = pilgrimExpenseType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্ হজ';
    const rows: string[][] = [
      ['বিভাগ', 'হাজীর নাম', 'রেজিস্ট্রেশন নম্বর', 'সেশন', 'খরচের ক্যাটাগরি', 'খরচের বিবরণ', 'নোট', 'ভাউচার নং', 'মানি রিসিট ফাইল', 'তারিখ', 'পরিমাণ (BDT)']
    ];
    filteredPilgrimExpenseRecords.forEach((record) => {
      const expenses = Array.isArray(record.expenses) ? record.expenses : [];
      if (expenses.length === 0) {
        rows.push(['হাজী বাবদ খরচ', record.hajiNameBn || record.hajiName, record.registrationRef || record.id, record.yearSeason, 'বিস্তারিত নেই', 'সংরক্ষিত মোট খরচ', '', '', '', '', String(getPilgrimExpenseAmount(record))]);
      } else {
        expenses.forEach((item) => rows.push([
          'হাজী বাবদ খরচ', record.hajiNameBn || record.hajiName, record.registrationRef || record.id,
          record.yearSeason, getPilgrimExpenseCategoryLabel(item),
          item.title === getPilgrimExpenseCategoryLabel(item) ? '' : item.title,
          item.note || '', item.voucherNo || '', item.receiptFileName || '', item.date || '', String(Number(item.amount) || 0)
        ]));
      }
    });
    rows.push(['', '', '', '', '', '', '', '', '', 'হাজী বাবদ মোট', String(pilgrimExpenseTotal)]);
    rows.push(['', '', '', '', '', '', '', '', '', '', '']);
    rows.push(['অফিস ওভারহেড', 'তারিখ', 'বিবরণ', 'ক্যাটাগরি', 'ভাউচার নম্বর', 'পরিশোধকারী', 'নোট', '', '', '', 'পরিমাণ (BDT)']);
    filteredPilgrimOfficeOverheads.forEach((expense) => rows.push([
      'অফিস ওভারহেড', expense.date, expense.title, expense.category, expense.voucherNo || '', expense.paidBy || '', expense.note || '', '', '', '', String(Number(expense.amount) || 0)
    ]));
    rows.push(['', '', '', '', '', '', '', '', '', 'অফিস ওভারহেড মোট', String(pilgrimOfficeOverheadTotal)]);

    const csv = [
      ['হজ ও ওমরাহ্ হাজী বাবদ খরচ', typeLabel, 'সেশন', yearFilter === 'all' ? 'সকল সেশন' : yearFilter],
      ...rows
    ].map((row) => row.map((cell) => {
      const value = String(cell ?? '');
      const safeValue = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
      return `"${safeValue.replace(/"/g, '""')}"`;
    }).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pilgrimExpenseType === 'hajj' ? 'hajj' : 'umrah'}-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportPilgrimExpensesPdf = () => {
    if (!pilgrimExpenseType) return;
    const typeLabel = pilgrimExpenseType === 'hajj' ? 'মূল হজের খরচ' : 'ওমরাহ্ হজের খরচ';
    const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char] || char));
    const money = (amount: number) => `৳${Math.round(amount || 0).toLocaleString('en-IN')}`;
    const pilgrimRows = filteredPilgrimExpenseRecords.map((record) => {
      const expenses = Array.isArray(record.expenses) ? record.expenses : [];
      const detailRows = expenses.length
        ? expenses.map((item) => `<tr><td>${escapeHtml(getPilgrimExpenseCategoryLabel(item))}</td><td>${escapeHtml(item.title === getPilgrimExpenseCategoryLabel(item) ? '' : item.title)}${item.note ? `<small>${escapeHtml(item.note)}</small>` : ''}</td><td>${escapeHtml(item.voucherNo || '')}</td><td>${escapeHtml(item.receiptFileName || (item.receiptDataUrl ? 'আপলোড হয়েছে' : ''))}</td><td>${escapeHtml(item.date || '')}</td><td class="amount">${money(Number(item.amount) || 0)}</td></tr>`).join('')
        : `<tr><td colspan="5">বিস্তারিত খাত নেই</td><td class="amount">${money(getPilgrimExpenseAmount(record))}</td></tr>`;
      return `<section class="pilgrim"><h2>${escapeHtml(record.hajiNameBn || record.hajiName)}</h2><p>রেজিস্ট্রেশন: ${escapeHtml(record.registrationRef || record.id)} · ${escapeHtml(record.yearSeason)}</p><table><thead><tr><th>ক্যাটাগরি</th><th>খরচের বিবরণ</th><th>ভাউচার নং</th><th>মানি রিসিট</th><th>তারিখ</th><th class="amount">পরিমাণ</th></tr></thead><tbody>${detailRows}<tr class="total"><td colspan="5">হাজী বাবদ মোট</td><td class="amount">${money(getPilgrimExpenseAmount(record))}</td></tr></tbody></table></section>`;
    }).join('');
    const overheadRows = filteredPilgrimOfficeOverheads.map((expense) => `<tr><td>${escapeHtml(expense.date)}</td><td>${escapeHtml(expense.title)}</td><td>${escapeHtml(expense.voucherNo || '')}</td><td class="amount">${money(Number(expense.amount) || 0)}</td></tr>`).join('');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('পিডিএফ তৈরির উইন্ডো খোলা যায়নি। ব্রাউজারের popup অনুমতি দিন।');
      return;
    }
    setIsGeneratingExpensePdf(true);
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${escapeHtml(typeLabel)}</title><style>body{font-family:Arial,sans-serif;color:#171717;margin:24px;font-size:12px}h1{font-size:22px;margin:0 0 6px}h2{font-size:15px;margin:0 0 4px}.meta{color:#555;margin:0 0 18px}.summary{padding:12px;background:#f8f1e6;border:1px solid #dcb473;margin:14px 0;font-weight:bold}table{width:100%;border-collapse:collapse;margin:8px 0 18px}th,td{border:1px solid #ccc;padding:7px;text-align:left}th{background:#f5f5f5}.amount{text-align:right;white-space:nowrap}.total{font-weight:bold;background:#fafafa}small{display:block;color:#666}.pilgrim{break-inside:avoid;margin-bottom:18px}@media print{body{margin:12mm}.pilgrim{break-inside:avoid}button{display:none}}</style></head><body><h1>হজ ও ওমরাহ্ হাজী বাবদ খরচ</h1><p class="meta">${escapeHtml(typeLabel)} · সেশন: ${escapeHtml(yearFilter === 'all' ? 'সকল সেশন' : yearFilter)} · তৈরি: ${new Date().toLocaleDateString('bn-BD')}</p><div class="summary">হাজীর ব্যক্তিগত খরচ — ${money(pilgrimExpenseTotal)} (${filteredPilgrimExpenseRecords.length} জন)</div>${pilgrimRows || '<p>এই ফিল্টারে কোনো হাজীর খরচ পাওয়া যায়নি।</p>'}<h2>অফিস ওভারহেড (আলাদা হিসাব)</h2><table><thead><tr><th>তারিখ</th><th>বিবরণ</th><th>ভাউচার</th><th class="amount">পরিমাণ</th></tr></thead><tbody>${overheadRows || '<tr><td colspan="4">কোনো ওভারহেড এন্ট্রি নেই</td></tr>'}<tr class="total"><td colspan="3">অফিস ওভারহেড মোট</td><td class="amount">${money(pilgrimOfficeOverheadTotal)}</td></tr></tbody></table><script>window.onload=function(){window.focus();window.print();};window.onafterprint=function(){window.close();};</script></body></html>`);
    printWindow.document.close();
    window.setTimeout(() => setIsGeneratingExpensePdf(false), 1500);
  };

  // Open Payment Modal (টাকা জমা গ্রহণ ও মানি রিসিট আপলোড)
  const handleOpenPaymentModal = (record: HajiFinanceRecord) => {
    setPaymentModalHaji(record);
    setPaymentAmountInput(record.dueAmount > 0 ? record.dueAmount : 0);
    setPaymentDateInput(new Date().toISOString().split('T')[0]);
    setPaymentMethodInput('bank');
    setPaymentVoucherInput(`TRX-${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentReceivedByInput('মুত্তাকী ক্যাশিয়ার');
    setPaymentNoteInput('');
    setPaymentReceiptDataUrl('');
    setPaymentReceiptFileName('');
    setPaymentReceiptMimeType('');
    setIsPaymentReceiptUploading(false);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalHaji) return;
    if (paymentAmountInput <= 0) {
      showToast('অনুগ্রহ করে সঠিক পেমেন্টের পরিমাণ লিখুন!');
      return;
    }

    addPilgrimPayment(paymentModalHaji.id, {
      amount: paymentAmountInput,
      date: paymentDateInput,
      method: paymentMethodInput,
      voucherNo: paymentVoucherInput,
      receivedBy: paymentReceivedByInput,
      note: paymentNoteInput,
      receiptDataUrl: paymentReceiptDataUrl || undefined,
      receiptFileName: paymentReceiptFileName || undefined,
      receiptMimeType: paymentReceiptMimeType || undefined,
      submittedBy: 'admin',
      status: 'approved'
    });

    setPaymentModalHaji(null);
  };

  // Open Expense Editing Modal
  const handleOpenExpenseModal = (record: HajiFinanceRecord) => {
    setExpenseModalHaji(record);
    setEditedExpenses(JSON.parse(JSON.stringify(record.expenses)));
  };

  const handleUpdateExpenseItemAmount = (id: string, amount: number) => {
    setEditedExpenses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, amount: Math.max(0, amount) } : item))
    );
  };

  const handleAddCustomExpenseItem = () => {
    const newItem: PilgrimExpenseItem = {
      id: `exp-custom-${Date.now()}`,
      category: 'misc',
      title: 'নতুন ব্যয়ের খাত / বিবরণ',
      amount: 5000,
      note: 'অতিরিক্ত খরচ'
    };
    setEditedExpenses((prev) => [...prev, newItem]);
  };

  const handleRemoveExpenseItem = (id: string) => {
    setEditedExpenses((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveEditedExpenses = () => {
    if (!expenseModalHaji) return;
    updatePilgrimExpenses(expenseModalHaji.id, editedExpenses);
    setExpenseModalHaji(null);
  };

  const handleManualExpenseReceiptUpload = async (lineKey: string, file: File | null) => {
    if (!file) return;
    updateManualExpenseLine(lineKey, { isReceiptUploading: true });
    try {
      const receipt = await prepareManualReceiptFile(file);
      const otherReceiptSize = Object.entries(manualExpenseLinesRef.current).reduce((total, [key, line]) =>
        total + (key === lineKey ? 0 : line.receiptDataUrl.length), 0);
      if (otherReceiptSize + receipt.dataUrl.length > MAX_MANUAL_RECEIPTS_TOTAL_CHARS) {
        throw new Error('সব রসিদ মিলিয়ে ২ MB-এর মধ্যে রাখুন।');
      }
      updateManualExpenseLine(lineKey, {
        receiptDataUrl: receipt.dataUrl,
        receiptFileName: receipt.fileName,
        receiptMimeType: receipt.mimeType,
        isReceiptUploading: false
      });
    } catch (error) {
      updateManualExpenseLine(lineKey, { isReceiptUploading: false });
      showToast(error instanceof Error ? error.message : 'রসিদ ফাইল প্রস্তুত করা যায়নি।');
    }
  };

  const handleRemoveManualExpenseReceipt = (lineKey: string) => {
    updateManualExpenseLine(lineKey, { receiptDataUrl: '', receiptFileName: '', receiptMimeType: '' });
  };

  const handleAddCustomManualExpenseLine = () => {
    if (manualCustomCategoryCount >= 10) {
      showToast('একবারে সর্বোচ্চ ১০টি নতুন খাত যোগ করা যাবে।');
      return;
    }
    const lineKey = `custom:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = { ...manualExpenseLinesRef.current, [lineKey]: createEmptyManualExpenseLine('misc') };
    manualExpenseLinesRef.current = next;
    setManualExpenseLines(next);
  };

  const handleRemoveCustomManualExpenseLine = (lineKey: string) => {
    if (!lineKey.startsWith('custom:') || manualExpenseLinesRef.current[lineKey]?.isReceiptUploading) return;
    const next = { ...manualExpenseLinesRef.current };
    delete next[lineKey];
    manualExpenseLinesRef.current = next;
    setManualExpenseLines(next);
  };

  const handleSaveManualPilgrimExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const target = manualExpenseCandidates.find((record) => record.id === manualExpenseRecordId);
    if (!target) {
      showToast('অনুগ্রহ করে সঠিক হাজী নির্বাচন করুন।');
      return;
    }
    if (isAnyManualReceiptUploading) {
      showToast('রসিদ ফাইল প্রস্তুত হওয়া পর্যন্ত অপেক্ষা করুন।');
      return;
    }
    const activeCustomLines = Object.entries(manualExpenseLines).filter(([key, line]) =>
      key.startsWith('custom:') && Number(line.amount) > 0
    );
    if (activeCustomLines.some(([, line]) => !line.customCategoryName.trim())) {
      showToast('পরিমাণ দেওয়া প্রতিটি নতুন খাতের নাম লিখুন।');
      return;
    }
    const customNames = activeCustomLines.map(([, line]) => line.customCategoryName.trim().toLocaleLowerCase());
    if (new Set(customNames).size !== customNames.length) {
      showToast('একই ফর্মে নতুন খাতের নাম আলাদা করে লিখুন।');
      return;
    }
    const timestamp = Date.now();
    const manualExpenses = Object.entries(manualExpenseLines).flatMap(([lineKey, line]) => {
      const amount = Number(line.amount);
      if (!Number.isFinite(amount) || amount <= 0) return [];
      const customCategoryName = lineKey.startsWith('custom:') ? line.customCategoryName.trim() : '';
      return [{
        id: `exp-manual-${timestamp}-${Math.random().toString(36).slice(2, 7)}`,
        category: line.category,
        title: customCategoryName || PILGRIM_EXPENSE_CATEGORY_LABELS[line.category],
        customCategoryName: customCategoryName || undefined,
        amount,
        date: manualExpenseDate,
        note: manualExpenseNote.trim() || undefined,
        voucherNo: line.voucherNo.trim() || undefined,
        receiptDataUrl: line.receiptDataUrl || undefined,
        receiptFileName: line.receiptFileName || undefined,
        receiptMimeType: line.receiptMimeType || undefined
      }];
    });
    if (manualExpenses.length === 0) {
      showToast('কমপক্ষে একটি খরচের খাতে শূন্যের বেশি টাকার পরিমাণ দিন।');
      return;
    }

    updatePilgrimExpenses(target.id, [...(Array.isArray(target.expenses) ? target.expenses : []), ...manualExpenses]);
    setIsManualPilgrimExpenseModalOpen(false);
    setManualExpenseRecordId('');
    const emptyManualExpenseLines = createEmptyManualExpenseLines();
    manualExpenseLinesRef.current = emptyManualExpenseLines;
    setManualExpenseLines(emptyManualExpenseLines);
    setManualExpenseDate(new Date().toISOString().split('T')[0]);
    setManualExpenseNote('');
  };

  const renderManualExpenseLine = (lineKey: string, line: ManualExpenseLineDraft, isCustom = false) => {
    const safeKey = lineKey.replace(/[^a-zA-Z0-9_-]/g, '-');
    const amountInputId = `manual-expense-amount-${safeKey}`;
    const categoryLabel = isCustom ? line.customCategoryName.trim() || 'নতুন খরচের খাত' : PILGRIM_EXPENSE_CATEGORY_LABELS[line.category];
    return (
      <div key={lineKey} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_140px] sm:grid-cols-[minmax(0,1fr)_180px] items-center gap-3">
          {isCustom ? (
            <div>
              <label htmlFor={`manual-expense-name-${safeKey}`} className="block text-[11px] font-semibold text-stone-600 mb-1">নতুন খাতের নাম *</label>
              <input
                id={`manual-expense-name-${safeKey}`}
                type="text"
                maxLength={60}
                required={line.amount > 0}
                value={line.customCategoryName}
                onChange={(e) => updateManualExpenseLine(lineKey, { customCategoryName: e.target.value })}
                placeholder="যেমন: ওষুধ / অতিরিক্ত লাগেজ"
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>
          ) : (
            <label htmlFor={amountInputId} className="text-xs font-semibold text-stone-800">{categoryLabel}</label>
          )}
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-500">৳</span>
            <input
              id={amountInputId}
              aria-label={`${categoryLabel} খরচের পরিমাণ`}
              type="number"
              min="0"
              step="1"
              value={line.amount || ''}
              onChange={(e) => updateManualExpenseLine(lineKey, { amount: Number(e.target.value) || 0 })}
              placeholder="০"
              className="w-full pl-7 pr-2.5 py-2 text-sm font-bold rounded-lg border border-stone-300 bg-white text-right focus:outline-none focus:ring-1 focus:ring-[#0f2922]"
            />
          </div>
        </div>
        {isCustom && (
          <button type="button" disabled={line.isReceiptUploading} onClick={() => handleRemoveCustomManualExpenseLine(lineKey)} className="text-[10px] text-rose-700 underline disabled:opacity-50">নতুন খাতটি বাদ দিন</button>
        )}
        {line.amount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-stone-200 pt-2">
            <div>
              <label htmlFor={`manual-expense-voucher-${safeKey}`} className="block text-[11px] font-semibold text-stone-600 mb-1">ভাউচার নং (ঐচ্ছিক)</label>
              <input
                id={`manual-expense-voucher-${safeKey}`}
                type="text"
                maxLength={60}
                value={line.voucherNo}
                onChange={(e) => updateManualExpenseLine(lineKey, { voucherNo: e.target.value })}
                placeholder="যেমন: VCH-102"
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-stone-300 bg-white"
              />
            </div>
            <div>
              <label htmlFor={`manual-expense-receipt-${safeKey}`} className="block text-[11px] font-semibold text-stone-600 mb-1">মানি রিসিট (ঐচ্ছিক)</label>
              <input
                id={`manual-expense-receipt-${safeKey}`}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={line.isReceiptUploading}
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0] || null;
                  e.currentTarget.value = '';
                  void handleManualExpenseReceiptUpload(lineKey, file);
                }}
                className="w-full text-[11px] file:mr-2 file:px-2 file:py-1.5 file:rounded-md file:border-0 file:bg-white file:text-stone-700 file:font-semibold"
              />
              {line.isReceiptUploading ? (
                <p className="mt-1 text-[10px] text-amber-700">রসিদ প্রস্তুত হচ্ছে...</p>
              ) : line.receiptDataUrl ? (
                <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                  <a href={line.receiptDataUrl} download={line.receiptFileName || 'money-receipt'} className="truncate text-emerald-800 underline">{line.receiptFileName || 'রসিদ ডাউনলোড করুন'}</a>
                  <button type="button" onClick={() => handleRemoveManualExpenseReceipt(lineKey)} className="shrink-0 text-rose-700 underline">বাদ দিন</button>
                </div>
              ) : (
                <p className="mt-1 text-[10px] text-stone-500">JPG/PNG/WEBP: ৮ MB পর্যন্ত, সংকুচিত হবে; PDF: ৭০০ KB পর্যন্ত। সব রসিদ মিলিয়ে ২ MB সীমা।</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Save New Pilgrim Record
  const handleSaveNewPilgrim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPilgrimName.trim()) {
      showToast('অনুগ্রহ করে যাত্রীর নাম লিখুন!');
      return;
    }

    const initialPayments: PaymentRecord[] = [];
    if (newPilgrimInitialDeposit > 0) {
      initialPayments.push({
        id: `pay-${Date.now()}`,
        amount: newPilgrimInitialDeposit,
        date: new Date().toISOString().split('T')[0],
        method: 'bank',
        voucherNo: `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
        receivedBy: 'মুত্তাকী অ্যাকাউন্টস',
        note: 'প্রাথমিক নিবন্ধন কিস্তি'
      });
    }

    addHajiFinanceRecord({
      hajiType: newPilgrimType,
      hajiName: newPilgrimName,
      hajiNameBn: newPilgrimName,
      phone: newPilgrimPhone,
      nidNo: newPilgrimNid,
      passportNo: newPilgrimPassport,
      district: newPilgrimDistrict,
      yearSeason: newPilgrimYear,
      packageName: newPilgrimPackage,
      packagePrice: newPilgrimPrice,
      discountAmount: newPilgrimDiscount,
      paymentStatus: 'due',
      registrationRef: `MUT-${newPilgrimType.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      payments: initialPayments
    });

    setIsAddPilgrimModalOpen(false);
    setNewPilgrimName('');
    setNewPilgrimPhone('');
    setNewPilgrimNid('');
    setNewPilgrimPassport('');
    setNewPilgrimInitialDeposit(0);
  };

  // Save Office / Other Income & Expense
  const handleSaveOfficeExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeExpTitle.trim() || officeExpAmount <= 0) {
      showToast('অনুগ্রহ করে বিবরণ ও সঠিক পরিমাণ লিখুন!');
      return;
    }

    const savedEntryType = isOfficeOverheadEntry ? 'expense' : officeEntryType;
    const savedExpenseType = isOfficeOverheadEntry
      ? (pilgrimExpenseType === 'umrah' ? 'umrah_overhead' : 'hajj_overhead')
      : savedEntryType === 'income' ? 'general' : officeExpType;

    addOfficeExpense({
      title: officeExpTitle,
      entryType: savedEntryType,
      category: officeExpCategory,
      amount: officeExpAmount,
      date: officeExpDate,
      expenseType: savedExpenseType,
      yearSeason: yearFilter !== 'all' ? yearFilter : '২০২৬',
      paidBy: officeExpPayer,
      voucherNo: officeExpVoucher || `VCH-${savedEntryType === 'income' ? 'INC' : 'EXP'}-${Math.floor(1000 + Math.random() * 9000)}`,
      note: officeExpNote
    });

    setIsOfficeExpModalOpen(false);
    setOfficeExpTitle('');
    setOfficeExpAmount(0);
    setOfficeExpVoucher('');
    setOfficeExpNote('');
    setOfficeEntryType('expense');
    setIsOfficeOverheadEntry(false);
    showToast(`${savedEntryType === 'income' ? 'অন্যান্য আয়' : 'পরিচালন ব্যয়'} সফলভাবে সংরক্ষিত হয়েছে!`);
  };


  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#091b15] via-[#0f2922] to-[#143a30] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-[#DCB473]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#DCB473]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#DCB473]/20 border border-[#DCB473]/40 text-[#DCB473] text-xs font-bold rounded-full flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>হজ ও ওমরাহ্ কাফেলা ফিন্যান্সিয়াল লেজার</span>
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>রিয়েল-টাইম অডিট সিস্টেম</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              মূল হজ ও ওমরাহ্ পৃথক আয়-ব্যয় ও অফিস হিসাব
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              কাফেলা থেকে কতজন ওমরাহ্ ও কতজন মূল হজ সম্পন্ন করেছেন, প্রতি হাজীর টিকেট, ভিসা, হোটেল, মোয়াল্লেম, খাবার ও লোকাল ট্রান্সপোর্ট খরচ, 
              জমা হওয়া টাকা ও বকেয়া, এবং অফিসের অন্যান্য সকল আয় ও ব্যয়ের স্বয়ংক্রিয় হিসাব।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {canSubAdminAdd('finance') && (
              <button
                onClick={() => {
                  setIsOfficeOverheadEntry(false);
                  setOfficeEntryType('expense');
                  setIsOfficeExpModalOpen(true);
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#DCB473]" />
                <span>অন্যান্য আয় / ব্যয় যোগ</span>
              </button>
            )}
            {!isSubAdmin && (
              <button
                onClick={() => {
                  syncAllHajisToFinance();
                  showToast('সকল নিবন্ধিত হাজির আয় ও ব্যয়ের হিসাব সফলভাবে সিঙ্ক হয়েছে!');
                }}
                className="px-3.5 py-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-emerald-400/40 transition-all cursor-pointer shadow-xs"
                title="নিবন্ধিত সকল হাজির আয় ও ব্যয়ের তথ্য স্বয়ংক্রিয়ভাবে লেজারে যুক্ত করুন"
              >
                <RefreshCw className="w-4 h-4 text-emerald-200" />
                <span>হাজী ডাটাবেজ সিঙ্ক</span>
              </button>
            )}
            {isSubAdmin && (() => {
              const role = getSubAdminModuleRole('finance') || 'editor';
              return (
                <span className="px-3.5 py-2 bg-amber-500/20 text-amber-200 border border-amber-400/40 font-bold rounded-xl text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>সাব-এডমিন ভূমিকা: {role === 'editor' ? 'এডিটর' : role === 'contributor' ? 'তথ্য সংযোজক' : 'শুধু ভিউয়ার'}</span>
                </span>
              );
            })()}

          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filtering Toolbar */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-stone-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sub-Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'overview', label: 'সার্বিক ব্যালেন্স শিট', icon: Calculator },
              { id: 'hajj', label: `মূল হজ লেজার (${filteredHajjRecords.length})`, icon: Compass },
              { id: 'umrah', label: `ওমরাহ্ লেজার (${filteredUmrahRecords.length})`, icon: Users },
              { id: 'office', label: `অন্যান্য আয় ও ব্যয়ের হিসাব (${filteredOfficeExpenses.length})`, icon: Building2 },
              { id: 'pilgrim-expenses', label: 'হাজী বাবদ খরচ', icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as FinanceTab);
                    if (tab.id === 'pilgrim-expenses') setPilgrimExpenseType(null);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Year / Season Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium hidden sm:inline">সেশন:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#0f2922]"
            >
              <option value="all">সকল বছর / সেশন</option>
              <option value="২০২৬">২০২৬ (১৪৪৭ হি.)</option>
              <option value="রমজান">রমজান সেশন</option>
              <option value="শাওয়াল">শাওয়াল সেশন</option>
            </select>
          </div>
        </div>

        {/* Search & Status Bar for Table Views */}
        {(activeTab === 'hajj' || activeTab === 'umrah' || activeTab === 'office' || (activeTab === 'pilgrim-expenses' && pilgrimExpenseType !== null)) && (
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={activeTab === 'pilgrim-expenses' ? 'নির্দিষ্ট হাজীর নাম বা রেজিস্ট্রেশন নম্বর দিয়ে খুঁজুন...' : 'হাজীর নাম, মোবাইল, পাসপোর্ট নং বা ভাউচার দিয়ে খুঁজুন...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#0f2922] bg-stone-50"
              />
            </div>

            {(activeTab === 'hajj' || activeTab === 'umrah') && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">পেমেন্ট স্ট্যাটাস:</span>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value as any)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700"
                >
                  <option value="all">সকল স্ট্যাটাস</option>
                  <option value="paid">সম্পূর্ণ পরিশোধিত (Paid)</option>
                  <option value="partial">আংশিক জমা (Partial)</option>
                  <option value="due">বকেয়া (Due)</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'pilgrim-expenses' && (
        <section className="space-y-5" aria-labelledby="pilgrim-expenses-heading">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <h3 id="pilgrim-expenses-heading" className="text-lg sm:text-xl font-extrabold text-[#0f2922]">হাজী বাবদ খরচ</h3>
              <p className="mt-1 text-xs sm:text-sm text-stone-500">নিবন্ধিত হাজীর ব্যক্তিগত খরচের খাত ও পরিমাণ দেখুন। অফিসের সাধারণ বা overhead খরচ এই হিসাবে অন্তর্ভুক্ত নয়।</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="হাজীর ধরন অনুযায়ী খরচ বাছাই">
              <button
                type="button"
                onClick={() => setPilgrimExpenseType('hajj')}
                aria-pressed={pilgrimExpenseType === 'hajj'}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${pilgrimExpenseType === 'hajj' ? 'bg-[#0f2922] text-[#DCB473] border-[#0f2922]' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'}`}
              >
                মূল হজের খরচ
              </button>
              <button
                type="button"
                onClick={() => setPilgrimExpenseType('umrah')}
                aria-pressed={pilgrimExpenseType === 'umrah'}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${pilgrimExpenseType === 'umrah' ? 'bg-[#0f2922] text-[#DCB473] border-[#0f2922]' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'}`}
              >
                ওমরাহ্ হজের খরচ
              </button>
            </div>
          </div>

          {pilgrimExpenseType && (
            <>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-rose-950">{pilgrimExpenseType === 'hajj' ? 'মূল হজের খরচ' : 'ওমরাহ্ হজের খরচ'}</h4>
                  <p className="text-xs text-rose-800 mt-1">{filteredPilgrimExpenseRecords.length} জন হাজীর নিবন্ধিত ব্যক্তিগত খরচ</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xl sm:text-2xl font-black text-rose-700 mr-2">{formatBDT(pilgrimExpenseTotal)}</div>
                  <button
                    type="button"
                    onClick={handleExportPilgrimExpensesCsv}
                    className="px-3 py-2 rounded-lg bg-white border border-rose-200 text-rose-900 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Excel/CSV ডাউনলোড
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPilgrimExpensesPdf}
                    disabled={isGeneratingExpensePdf}
                    className="px-3 py-2 rounded-lg bg-white border border-rose-200 text-rose-900 text-xs font-bold hover:bg-rose-100 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Printer className="w-3.5 h-3.5" /> {isGeneratingExpensePdf ? 'পিডিএফ প্রস্তুত হচ্ছে...' : 'PDF / প্রিন্ট'}
                  </button>
                  {canSubAdminAdd('finance') && (
                    <button
                      type="button"
                      disabled={manualExpenseCandidates.length === 0}
                      onClick={() => {
                        setManualExpenseRecordId('');
                        const emptyManualExpenseLines = createEmptyManualExpenseLines();
                        manualExpenseLinesRef.current = emptyManualExpenseLines;
                        setManualExpenseLines(emptyManualExpenseLines);
                        setManualExpenseDate(new Date().toISOString().split('T')[0]);
                        setManualExpenseNote('');
                        setIsManualPilgrimExpenseModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" /> হাজীর খরচ ম্যানুয়ালি যোগ
                    </button>
                  )}
                  {canSubAdminAdd('finance') && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOfficeOverheadEntry(true);
                        setOfficeEntryType('expense');
                        setOfficeExpCategory('rent');
                        setOfficeExpType(pilgrimExpenseType === 'hajj' ? 'hajj_overhead' : 'umrah_overhead');
                        setOfficeExpPayer('অফিস অ্যাকাউন্টস');
                        setIsOfficeExpModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-lg bg-[#0f2922] text-[#DCB473] text-xs font-bold hover:bg-[#164438] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> অফিস ওভারহেড যোগ
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5" aria-labelledby="pilgrim-expense-summary-heading">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-rose-50 p-2 text-rose-700"><BarChart3 className="w-5 h-5" aria-hidden="true" /></div>
                  <div>
                    <h4 id="pilgrim-expense-summary-heading" className="font-extrabold text-stone-900">খরচের সামারি ও গ্রাফ</h4>
                    <p className="mt-1 text-xs text-stone-500">ব্যক্তিগত হিসাব বর্তমান হজ/ওমরাহ, সেশন ও হাজীর সার্চ অনুযায়ী; অফিস ওভারহেড আলাদা দেখানো হয়েছে।</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-3"><p className="text-[11px] text-rose-800">ব্যক্তিগত খরচের মোট</p><p className="mt-1 text-lg font-black text-rose-900">{formatBDT(pilgrimExpenseTotal)}</p></div>
                  <div className="rounded-xl bg-stone-50 border border-stone-200 p-3"><p className="text-[11px] text-stone-600">গড় / নিবন্ধিত হাজী</p><p className="mt-1 text-lg font-black text-stone-900">{formatBDT(filteredPilgrimExpenseRecords.length ? pilgrimExpenseTotal / filteredPilgrimExpenseRecords.length : 0)}</p></div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3"><p className="text-[11px] text-amber-800">অফিস ওভারহেড (আলাদা)</p><p className="mt-1 text-lg font-black text-amber-900">{formatBDT(pilgrimOfficeOverheadTotal)}</p></div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3"><p className="text-[11px] text-emerald-800">খরচের খাত</p><p className="mt-1 text-lg font-black text-emerald-900">{pilgrimExpenseCategorySummary.length}টি</p></div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="rounded-xl border border-stone-200 p-4">
                    <h5 className="text-sm font-bold text-stone-800">খাতভিত্তিক খরচ</h5>
                    {pilgrimExpenseCategorySummary.length === 0 ? <p className="mt-3 text-xs text-stone-500">খাতভিত্তিক বিস্তারিত খরচ পাওয়া যায়নি।</p> : (
                      <div className="mt-3 space-y-3" role="group" aria-label="খাতভিত্তিক খরচের বার চার্ট">
                        {pilgrimExpenseCategorySummary.map((item) => (
                          <div key={item.name}>
                            <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate text-stone-700">{item.name} <span className="text-stone-400">({item.entries}টি)</span></span><strong className="shrink-0 text-stone-900">{formatBDT(item.amount)}</strong></div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-rose-600" style={{ width: `${Math.max(2, (item.amount / (pilgrimExpenseCategorySummary[0]?.amount || 1)) * 100)}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl border border-stone-200 p-4">
                    <h5 className="text-sm font-bold text-stone-800">সর্বোচ্চ খরচের হাজী (শীর্ষ ৫)</h5>
                    {topPilgrimExpenseRecords.length === 0 ? <p className="mt-3 text-xs text-stone-500">দেখানোর মতো কোনো খরচ নেই।</p> : (
                      <div className="mt-3 space-y-3" role="group" aria-label="হাজীভিত্তিক মোট খরচের বার চার্ট">
                        {topPilgrimExpenseRecords.map(({ record, amount }) => (
                          <div key={record.id}>
                            <div className="mb-1 flex justify-between gap-3 text-xs"><span className="truncate text-stone-700">{record.hajiNameBn || record.hajiName}</span><strong className="shrink-0 text-stone-900">{formatBDT(amount)}</strong></div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${Math.max(2, (amount / (topPilgrimExpenseRecords[0]?.amount || 1)) * 100)}%` }} /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">খাতভিত্তিক গ্রাফ বিস্তারিত expense item থেকে; পুরোনো যেসব রেকর্ডে শুধু মোট খরচ আছে, সেগুলো মোট সামারিতে আছে কিন্তু খাতের গ্রাফে নেই।</p>
              </div>

              {filteredPilgrimExpenseRecords.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center text-sm text-stone-500">
                  এই বছর/সেশন বা সার্চে কোনো হাজীর খরচ পাওয়া যায়নি।
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPilgrimExpenseRecords.map((record) => {
                    const expenseItems = Array.isArray(record.expenses) ? record.expenses : [];
                    return (
                      <article key={record.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h5 className="font-extrabold text-stone-900">{record.hajiNameBn || record.hajiName}</h5>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
                              <span>রেজি: {record.registrationRef || record.id}</span>
                              {record.phone && <span>মোবাইল: {record.phone}</span>}
                              <span>{record.yearSeason}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-right">
                              <span className="block text-[11px] text-stone-500">মোট হাজী বাবদ খরচ</span>
                              <strong className="text-lg font-black text-rose-700">{formatBDT(getPilgrimExpenseAmount(record))}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedPilgrimId(expandedPilgrimId === record.id ? null : record.id)}
                              aria-expanded={expandedPilgrimId === record.id}
                              className="px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              {expandedPilgrimId === record.id ? 'বিস্তারিত বন্ধ' : 'খরচের বিস্তারিত'}
                            </button>
                          </div>
                        </div>
                        {expandedPilgrimId === record.id && (
                          <div className="border-t border-stone-200 bg-stone-50/70 p-4 sm:p-5">
                            {expenseItems.length === 0 ? (
                              <p className="text-sm text-stone-500">এই রেকর্ডে আলাদা খরচের খাতের বিবরণ নেই।</p>
                            ) : (
                              <div className="divide-y divide-stone-200">
                                {expenseItems.map((item) => (
                                  <div key={item.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                                    <div>
                                      <span className="mr-2 inline-flex rounded-md bg-white border border-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">{getPilgrimExpenseCategoryLabel(item)}</span>
                                      {item.title !== getPilgrimExpenseCategoryLabel(item) && <span className="font-semibold text-stone-800">{item.title}</span>}
                                      {item.note && <span className="ml-2 text-xs text-stone-500">{item.note}</span>}
                                      {item.date && <span className="ml-2 text-xs text-stone-400">{item.date}</span>}
                                      {item.voucherNo && <span className="ml-2 text-xs font-semibold text-stone-600">ভাউচার নং: {item.voucherNo}</span>}
                                      {isSafeManualReceiptDataUrl(item.receiptDataUrl) && (
                                        <a href={item.receiptDataUrl} download={item.receiptFileName || 'money-receipt'} className="ml-2 text-xs font-semibold text-emerald-800 underline">মানি রিসিট ডাউনলোড</a>
                                      )}
                                    </div>
                                    <span className="font-bold text-rose-700">{formatBDT(Number(item.amount) || 0)}</span>
                                  </div>
                                ))}
                                <div className="pt-3 flex justify-between gap-2 font-extrabold text-stone-900">
                                  <span>মোট</span>
                                  <span className="text-rose-700">{formatBDT(getPilgrimExpenseAmount(record))}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              <section className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs" aria-labelledby="office-overhead-heading">
                <div className="p-4 sm:p-5 bg-amber-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 id="office-overhead-heading" className="font-extrabold text-amber-950">অফিস ওভারহেড — হাজীর খরচ থেকে আলাদা</h4>
                    <p className="text-xs text-amber-800 mt-1">{filteredPilgrimOfficeOverheads.length}টি অফিস খরচ · এই রিপোর্টের হাজীভিত্তিক মোটে যোগ করা হয়নি</p>
                  </div>
                  <div className="text-lg font-black text-amber-900">{formatBDT(pilgrimOfficeOverheadTotal)}</div>
                </div>
                {filteredPilgrimOfficeOverheads.length === 0 ? (
                  <p className="p-4 text-sm text-stone-500">এই বছর/সেশনে কোনো অফিস ওভারহেড এন্ট্রি নেই।</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-stone-700">
                      <thead className="bg-stone-50 border-y border-stone-200 text-[11px] font-bold text-stone-500">
                        <tr><th className="p-3">তারিখ</th><th className="p-3">বিবরণ</th><th className="p-3">ভাউচার</th><th className="p-3">পরিশোধকারী</th><th className="p-3 text-right">পরিমাণ</th></tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredPilgrimOfficeOverheads.map((expense) => (
                          <tr key={expense.id}>
                            <td className="p-3 whitespace-nowrap">{expense.date}</td>
                            <td className="p-3 font-semibold">{expense.title}{expense.note && <span className="block text-[11px] text-stone-500">{expense.note}</span>}</td>
                            <td className="p-3">{expense.voucherNo || '-'}</td>
                            <td className="p-3">{expense.paidBy || '-'}</td>
                            <td className="p-3 text-right font-bold text-amber-900 whitespace-nowrap">{formatBDT(Number(expense.amount) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 1: সার্বিক ব্যালেন্স শিট (Grand Balance Sheet)    */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* ১. রেজিস্ট্রেশনকৃত টাকার পরিমাণ, ২. পরিশোধিত ও ডিউ টাকার সার্বিক হিসাব সমীকরণ */}
          {/* সূত্র: রেজিস্ট্রেশনকৃত টাকার পরিমাণ - পরিশোধিত টাকার পরিমাণ = ডিউ টাকার পরিমাণ */}
          <div className="bg-gradient-to-br from-white via-[#FAF8F5] to-white rounded-3xl p-5 sm:p-7 shadow-md border-2 border-[#DCB473]/60 relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2922] text-[#DCB473] text-[11px] font-bold tracking-wide uppercase shadow-xs mb-1">
                  <Calculator className="w-3.5 h-3.5 text-[#DCB473]" />
                  <span>সার্বিক নিবন্ধন ও বকেয়া লেজার সমীকরণ</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-[#0f2922]">
                  হজ ও ওমরাহ্ নিবন্ধনকৃত টাকার সার্বিক হিসাব
                </h3>
                <p className="text-xs text-stone-500">
                  রেজিস্ট্রেশনের সময় ধার্যকৃত মোট টাকা থেকে আদায়কৃত পরিশোধিত টাকা বাদ দিয়ে স্বয়ংক্রিয়ভাবে মোট ডিউ টাকার পরিমাণ হিসাব করা হয়েছে।
                </p>
              </div>

              <div className="inline-flex items-center gap-2 bg-[#0f2922]/5 px-3.5 py-2 rounded-2xl border border-[#0f2922]/10 text-xs font-bold text-[#0f2922] self-start sm:self-auto">
                <span>মোট হজযাত্রী:</span>
                <span className="bg-[#0f2922] text-[#DCB473] px-2.5 py-0.5 rounded-lg font-mono">
                  {summary.totalPilgrims} জন
                </span>
              </div>
            </div>

            {/* 3 Prominent Calculation Cards with Exact Requested Names */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {/* ১. রেজিস্ট্রেশনকৃত টাকার পরিমাণ */}
              <div className="bg-white p-5 rounded-2xl border-2 border-[#0f2922]/20 shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0f2922] uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-[#0f2922] text-[#DCB473] text-[11px] flex items-center justify-center font-bold">১</span>
                      <span>রেজিস্ট্রেশনকৃত টাকার পরিমাণ</span>
                    </span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded-full">
                      ধার্যকৃত মোট টাকা
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-2">
                    সকল হাজী রেজিস্ট্রেশনের সময় যে ধার্যকৃত টাকার পরিমাণ
                  </p>
                  <div className="text-2xl sm:text-3xl font-black text-[#0f2922] tracking-tight">
                    {formatBDT(summary.grandTotalContract)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>মূল হজ: <b className="text-stone-800">{formatBDT(summary.hajjTotalContract)}</b></span>
                  <span>ওমরাহ্: <b className="text-stone-800">{formatBDT(summary.umrahTotalContract)}</b></span>
                </div>
              </div>

              {/* ২. পরিশোধিত টাকার পরিমাণ */}
              <div className="bg-emerald-50/50 p-5 rounded-2xl border-2 border-emerald-300 shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center font-bold">২</span>
                      <span>পরিশোধিত টাকার পরিমাণ</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      মোট আদায়কৃত
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-2">
                    যাত্রীদের থেকে এ পর্যন্ত ক্যাশ/ব্যাংকে জমাকৃত টাকা
                  </p>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                    {formatBDT(summary.grandTotalDeposited)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-stone-600">
                  <span>হজ জমা: <b className="text-emerald-800">{formatBDT(summary.hajjTotalDeposited)}</b></span>
                  <span>ওমরাহ্ জমা: <b className="text-emerald-800">{formatBDT(summary.umrahTotalDeposited)}</b></span>
                </div>
              </div>

              {/* ৩. ডিউ টাকার পরিমাণ */}
              <div className="bg-rose-50/60 p-5 rounded-2xl border-2 border-rose-300 shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-900 uppercase tracking-wide">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center font-bold">৩</span>
                      <span>ডিউ টাকার পরিমাণ</span>
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                      মোট বকেয়া
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-2">
                    রেজিস্ট্রেশনকৃত টাকা − পরিশোধিত টাকা = মোট ডিউ
                  </p>
                  <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                    {formatBDT(summary.grandTotalDue)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-stone-600">
                  <span>হজ ডিউ: <b className="text-rose-700">{formatBDT(summary.hajjTotalDue)}</b></span>
                  <span>ওমরাহ্ ডিউ: <b className="text-rose-700">{formatBDT(summary.umrahTotalDue)}</b></span>
                </div>
              </div>
            </div>

            {/* Formula Badge Footer */}
            <div className="p-3 bg-stone-100/90 rounded-2xl border border-stone-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-stone-700 font-semibold">
                <span className="font-bold text-[#0f2922]">হিসাব সূত্র:</span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-bold text-[#0f2922]">
                  রেজিস্ট্রেশনকৃত টাকার পরিমাণ ({formatBDT(summary.grandTotalContract)})
                </span>
                <span className="text-stone-500 font-black">−</span>
                <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 font-bold">
                  পরিশোধিত টাকার পরিমাণ ({formatBDT(summary.grandTotalDeposited)})
                </span>
                <span className="text-stone-500 font-black">=</span>
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 font-black">
                  ডিউ টাকার পরিমাণ ({formatBDT(summary.grandTotalDue)})
                </span>
              </div>
              <span className="text-[11px] text-stone-500 italic">
                সেশন ফিল্টার অনুযায়ী স্বয়ংক্রিয় সমন্বিত
              </span>
            </div>
          </div>
          {/* সার্বিক আয়-ব্যয় ও লাভ/লসের পৃথক ড্যাশবোর্ড */}
          <section className="space-y-3" aria-labelledby="overall-finance-dashboard-heading">
            <div>
              <h3 id="overall-finance-dashboard-heading" className="text-lg sm:text-xl font-black text-[#0f2922]">সার্বিক আয়-ব্যয় ও লাভ / লস</h3>
              <p className="text-xs text-stone-500">মূল হজ ও ওমরাহ্ লেজারের আদায়কৃত অর্থ এবং অন্যান্য আয়-ব্যয়ের এন্ট্রি মিলিয়ে হিসাব।</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-5 shadow-xs">
                <p className="text-sm font-extrabold text-emerald-900">মোট আয়</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-emerald-700">{formatBDT(summary.grandTotalIncome)}</p>
                <div className="mt-4 space-y-1 border-t border-emerald-200 pt-3 text-xs text-stone-700">
                  <p className="flex justify-between gap-2"><span>মূল হজ লেজার</span><b>{formatBDT(summary.hajjTotalDeposited)}</b></p>
                  <p className="flex justify-between gap-2"><span>ওমরাহ্ লেজার</span><b>{formatBDT(summary.umrahTotalDeposited)}</b></p>
                  <p className="flex justify-between gap-2"><span>অন্যান্য আয় এন্ট্রি</span><b>{formatBDT(summary.totalOtherIncome)}</b></p>
                </div>
              </article>

              <article className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-5 shadow-xs">
                <p className="text-sm font-extrabold text-rose-900">মোট ব্যয়</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-rose-700">{formatBDT(summary.grandTotalExpenses)}</p>
                <div className="mt-4 space-y-1 border-t border-rose-200 pt-3 text-xs text-stone-700">
                  <p className="flex justify-between gap-2"><span>হাজী বাবদ খরচ (হজ + ওমরাহ্)</span><b>{formatBDT(summary.hajjPilgrimsExpense + summary.umrahPilgrimsExpense)}</b></p>
                  <p className="flex justify-between gap-2"><span>অন্যান্য ব্যয় এন্ট্রি</span><b>{formatBDT(summary.totalOtherExpense)}</b></p>
                </div>
              </article>

              <article className={`rounded-2xl border-2 p-5 shadow-xs ${summary.grandNetProfit >= 0 ? 'border-[#DCB473] bg-[#0f2922] text-white' : 'border-rose-300 bg-rose-50'}`}>
                <p className={`text-sm font-extrabold ${summary.grandNetProfit >= 0 ? 'text-[#DCB473]' : 'text-rose-900'}`}>লাভ / লস</p>
                <p className={`mt-2 text-3xl font-black tracking-tight ${summary.grandNetProfit >= 0 ? 'text-white' : 'text-rose-700'}`}>{formatBDT(summary.grandNetProfit)}</p>
                <p className={`mt-4 border-t pt-3 text-xs ${summary.grandNetProfit >= 0 ? 'border-white/20 text-stone-200' : 'border-rose-200 text-stone-700'}`}>
                  মোট আয় {formatBDT(summary.grandTotalIncome)} − মোট ব্যয় {formatBDT(summary.grandTotalExpenses)}
                </p>
              </article>
            </div>
          </section>

          {/* Complete Financial Overview Statement */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: সর্বমোট অর্জিত আয় (Gross Total Income) */}
              <div className="bg-stone-50/80 p-5 rounded-2xl border border-stone-200 flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    <span>সর্বমোট অর্জিত আয় (Gross Total Income)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {summary.totalPilgrims} জন যাত্রী + অন্যান্য
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                      title="স্টেটমেন্ট প্রিন্ট করুন"
                    >
                      <Printer className="w-3 h-3" />
                      <span>প্রিন্ট</span>
                    </button>
                  </div>
                </div>

                <div className="py-6 space-y-2">
                  <span className="text-xs text-stone-500 block">হাজীদের পরিশোধিত টাকা ও অন্যান্য সকল খাতের সম্মিলিত আয়</span>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                    {formatBDT(summary.grandTotalIncome)}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-200 text-xs text-stone-500 flex justify-between">
                  <span>হাজীদের মোট পরিশোধিত: <b className="text-emerald-800">{formatBDT(summary.grandTotalDeposited)}</b></span>
                  <span>অন্যান্য আয়: <b className="text-emerald-800">{formatBDT(summary.totalOtherIncome)}</b></span>
                </div>
              </div>

              {/* Right Column: মোট ব্যয় ও খরচ (Outflow / Expenses) */}
              <div className="bg-stone-50/80 p-5 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <span className="font-bold text-rose-800 flex items-center gap-1.5 text-sm">
                    <ArrowUpRight className="w-4 h-4 text-rose-600" />
                    <span>মোট ব্যয় ও পরিচালন খরচ (Total Expenses)</span>
                  </span>
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    হাজী বাবদ ও অন্যান্য সকল খাত
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-600">মূল হজ বাবদ প্রত্যক্ষ ব্যয় (টিকেট, হোটেল, ভিসা ইত্যাদি):</span>
                    <span className="font-bold text-stone-900">{formatBDT(summary.hajjPilgrimsExpense)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-600">ওমরাহ্ হজ বাবদ প্রত্যক্ষ ব্যয়:</span>
                    <span className="font-bold text-stone-900">{formatBDT(summary.umrahPilgrimsExpense)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                    <span className="text-rose-900 font-medium">অফিস ভাড়া, বেতন, ইউটিলিটি ও অন্যান্য ব্যয়:</span>
                    <span className="font-bold text-rose-600">{formatBDT(summary.totalOfficeExpense)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-300 flex justify-between items-center font-bold text-stone-900 text-base">
                  <span>সর্বমোট ব্যয় (Gross Outflow):</span>
                  <span className="text-rose-600 font-extrabold text-lg">{formatBDT(summary.grandTotalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Net Margin Summary Card */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-[#0b1f1a] to-[#164438] text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-[#DCB473]/40">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-xs uppercase tracking-wider text-[#DCB473] font-bold">
                  চূড়ান্ত ব্যালেন্স ও নিট মুনাফা
                </span>
                <h4 className="text-xl sm:text-2xl font-black">
                  মোট নিট লাভ / উদ্বৃত্ত: {formatBDT(summary.grandNetProfit)}
                </h4>
                <p className="text-xs text-stone-300">
                  সর্বমোট আয় {formatBDT(summary.grandTotalIncome)} - সর্বমোট ব্যয় {formatBDT(summary.grandTotalExpenses)}
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-2xl border border-white/20 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] text-stone-300 block">প্রফিট মার্জিন</span>
                  <span className="text-2xl font-black text-[#DCB473]">{summary.overallProfitMargin}%</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#DCB473] text-[#0f2922] flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: মূল হজ লেজার (Main Hajj) & SUB-TAB 3: ওমরাহ্  */}
      {/* ======================================================== */}
      {(activeTab === 'hajj' || activeTab === 'umrah') && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-bold text-stone-900 text-base sm:text-lg flex items-center gap-2">
                {activeTab === 'hajj' ? (
                  <>
                    <Compass className="w-5 h-5 text-amber-600" />
                    <span>মূল হজ যাত্রী লেজার তালিকা (Main Hajj Pilgrims Ledger)</span>
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span>পবিত্র ওমরাহ্ যাত্রী লেজার তালিকা (Umrah Pilgrims Ledger)</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-stone-500">
                প্রতিজন যাত্রীর নির্ধারিত মূল্য, জমা টাকা, ব্যয়ের বিস্তারিত খাত এবং মাথাপিছু লাভ-ক্ষতি
              </p>
            </div>

            <button
              onClick={() => {
                setNewPilgrimType(activeTab);
                setIsAddPilgrimModalOpen(true);
              }}
              className="px-3.5 py-2 bg-[#0f2922] hover:bg-[#164438] text-[#DCB473] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{activeTab === 'hajj' ? 'নতুন হজ যাত্রী যোগ করুন' : 'নতুন ওমরাহ্ যাত্রী যোগ করুন'}</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* HIERARCHICAL DRILL-DOWN BREADCRUMBS & NAVIGATION TOOLBAR */}
          {/* ১. হজের ধরন > ২. সাল > ৩. গ্রুপ > ৪. হাজীদের লেজার হিসাব   */}
          {/* ======================================================== */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Breadcrumb Path */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-stone-600">
                <span className="text-stone-400 font-semibold mr-1">নেভিগেশন:</span>

                {/* Level 1: Hajj Type */}
                <div className="inline-flex rounded-xl bg-stone-100 p-0.5 border border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('hajj');
                      setFinDrillYear(null);
                      setFinDrillGroup(null);
                      setFinViewMode('drill');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === 'hajj'
                        ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>১। মূল হজ ({filteredHajjRecords.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('umrah');
                      setFinDrillYear(null);
                      setFinDrillGroup(null);
                      setFinViewMode('drill');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === 'umrah'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>২। ওমরাহ্ হজ ({filteredUmrahRecords.length})</span>
                  </button>
                </div>

                {/* Level 2: Year */}
                {finDrillYear && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                    <button
                      type="button"
                      onClick={() => {
                        setFinDrillGroup(null);
                        setFinViewMode('drill');
                      }}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        finDrillGroup === null
                          ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#DCB473]" />
                      <span>২. সাল: {finDrillYear}</span>
                    </button>
                  </>
                )}

                {/* Level 3: Group */}
                {finDrillYear && finDrillGroup && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                    <button
                      type="button"
                      onClick={() => {
                        setFinViewMode('drill');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 border border-purple-200 shadow-xs flex items-center gap-1.5 font-bold cursor-pointer hover:bg-purple-200"
                    >
                      <Users className="w-3.5 h-3.5 text-purple-700" />
                      <span>৩. গ্রুপ: {finDrillGroup}</span>
                    </button>
                  </>
                )}

                {/* Level 4: Ledger Pilgrims */}
                {finDrillYear && finDrillGroup && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-extrabold shadow-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>৪. হাজীদের লেজার হিসাব ({displayedLedgerRecords.length} জন)</span>
                    </span>
                  </>
                )}
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFinViewMode(finViewMode === 'drill' ? 'flat' : 'drill');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5 text-[#0f2922]" />
                  <span>{finViewMode === 'drill' ? 'একত্রে সকল রেকর্ড দেখুন (ফ্ল্যাট তালিকা)' : 'ধাপে ধাপে ড্রিল-ডাউন নেভিগেশন'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: রেজিস্ট্রেশনের সাল নির্বাচন */}
          {finViewMode === 'drill' && finDrillYear === null && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2922] text-[#DCB473] text-xs font-extrabold uppercase mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>ধাপ ২: হাজির রেজিস্ট্রেশনের সাল / বছর</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0f2922]">
                    {activeTab === 'hajj' ? '১। মূল হজ' : '২। ওমরাহ্ হজ'}: রেজিস্ট্রেশনের সাল নির্বাচন করুন
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500">
                    যে সালে হাজীরা রেজিস্ট্রেশন করেছেন সেই সালে ক্লিক করে রেজিস্ট্রেশনকৃত কাফেলা গ্রুপ ও তাদের লেজার হিসাব দেখুন।
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
                {availableFinYears.map(({ year, count, totalContract, totalDeposited, totalDue }) => (
                  <div
                    key={year}
                    onClick={() => {
                      setFinDrillYear(year);
                      setFinDrillGroup(null);
                    }}
                    className="group bg-gradient-to-br from-stone-50 to-white hover:from-amber-50/50 hover:to-white border-2 border-stone-200 hover:border-[#DCB473] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-6 h-6 text-[#DCB473]" />
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0f2922] text-[#DCB473] text-xs font-mono font-bold">
                          {count} জন যাত্রী
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-[#0f2922] group-hover:text-amber-800">
                        {year} সাল (১৪৪৭ হি.)
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-1">
                        {activeTab === 'hajj' ? 'মূল হজ সেশন লেজার' : 'ওমরাহ্ হজ সেশন লেজার'}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-stone-100 text-[11px] space-y-1">
                        <div className="flex justify-between text-stone-600">
                          <span>নির্ধারিত মোট:</span>
                          <b className="text-stone-900">{formatBDT(totalContract)}</b>
                        </div>
                        <div className="flex justify-between text-emerald-700">
                          <span>পরিশোধিত জমা:</span>
                          <b>{formatBDT(totalDeposited)}</b>
                        </div>
                        <div className="flex justify-between text-rose-700">
                          <span>মোট ডিউ:</span>
                          <b>{formatBDT(totalDue)}</b>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-700 group-hover:text-[#0f2922]">
                      <span>রেজিস্ট্রেশনকৃত গ্রুপ দেখুন</span>
                      <span className="group-hover:translate-x-1 transition-transform">➔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: রেজিস্ট্রেশনকৃত কাফেলা গ্রুপ নির্বাচন */}
          {finViewMode === 'drill' && finDrillYear !== null && finDrillGroup === null && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2922] text-[#DCB473] text-xs font-extrabold uppercase mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>ধাপ ৩: রেজিস্ট্রেশনকৃত কাফেলা গ্রুপ নির্বাচন</span>
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0f2922]">
                    {activeTab === 'hajj' ? 'মূল হজ' : 'ওমরাহ্ হজ'} ({finDrillYear} সাল) — যে গ্রুপে রেজিস্ট্রেশন করেছে
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500">
                    নির্দিষ্ট কাফেলা গ্রুপে ক্লিক করে সেই গ্রুপের আর্থিক সমীকরণ ও হাজীদের লেজার হিসাব দেখুন।
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setFinDrillYear(null);
                      setFinDrillGroup(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>← সাল পরিবর্তন</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFinGroups.map((grp) => {
                  const hasPilgrims = grp.count > 0;
                  return (
                    <div
                      key={grp.groupName}
                      onClick={() => setFinDrillGroup(grp.groupName)}
                      className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        hasPilgrims
                          ? 'bg-gradient-to-br from-emerald-50/70 via-white to-purple-50/30 border-emerald-400 hover:border-[#0f2922] shadow-xs hover:shadow-md'
                          : 'bg-stone-50/80 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-bold text-[#0f2922] bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs">
                            {grp.groupName}
                          </span>
                          <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              hasPilgrims
                                ? 'bg-emerald-600 text-white font-mono'
                                : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {grp.count} জন হাজী
                          </span>
                        </div>

                        <h4 className="text-base font-black text-stone-900 group-hover:text-emerald-800">
                          {grp.groupName}
                        </h4>
                        <p className="text-xs text-stone-600 mt-1">
                          মোয়াল্লেম / গাইড: <b>{grp.leader}</b>
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          সফর: {grp.departureDate} · আসন: {grp.maxCapacity} জন
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-stone-200/60 text-xs space-y-1">
                          <div className="flex justify-between text-stone-700">
                            <span>১. নির্ধারিত টাকা:</span>
                            <b className="font-black text-stone-900">{formatBDT(grp.totalContract)}</b>
                          </div>
                          <div className="flex justify-between text-emerald-800">
                            <span>২. পরিশোধিত টাকা:</span>
                            <b className="font-black text-emerald-700">{formatBDT(grp.totalDeposited)}</b>
                          </div>
                          <div className="flex justify-between text-rose-800">
                            <span>৩. ডিউ টাকা:</span>
                            <b className="font-black text-rose-700">{formatBDT(grp.totalDue)}</b>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs font-extrabold text-[#0f2922]">
                        <span>গ্রুপের লেজার ও হাজীদের হিসাব</span>
                        <span className="group-hover:translate-x-1 transition-transform">➔</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Group Header & 3 Calculation Cards + Pilgrims Ledger */}
          {(finViewMode === 'flat' || (finDrillYear !== null && finDrillGroup !== null)) && (
            <div className="space-y-4">
              {/* Group Header Banner if in Drill Mode */}
              {finViewMode === 'drill' && finDrillGroup && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#0f2922] text-[#DCB473] text-[11px] font-bold uppercase tracking-wide mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#DCB473]" />
                      <span>ধাপ ৪: গ্রুপের আর্থিক সমীকরণ ও নিবন্ধিত হাজীদের লেজার</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-[#0f2922] flex items-center gap-2">
                      <span>গ্রুপ: {finDrillGroup}</span>
                      <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                        {activeTab === 'hajj' ? 'মূল হজ' : 'ওমরাহ্ হজ'} · {finDrillYear} সাল
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFinDrillGroup(null)}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← গ্রুপ পরিবর্তন</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFinDrillYear(null);
                        setFinDrillGroup(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
                    >
                      সাল পরিবর্তন
                    </button>
                  </div>
                </div>
              )}

              {/* 3 Prominent Calculation Cards with Exact Requested Names */}
              {/* সূত্র: রেজিস্ট্রেশনকৃত টাকার পরিমাণ - পরিশোধিত টাকার পরিমাণ = ডিউ টাকার পরিমাণ */}
              <div className="bg-gradient-to-br from-white via-[#FAF8F5] to-white rounded-3xl p-5 sm:p-7 shadow-md border-2 border-[#DCB473]/60 relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2922] text-[#DCB473] text-[11px] font-bold tracking-wide uppercase shadow-xs mb-1">
                      {activeTab === 'hajj' ? <Compass className="w-3.5 h-3.5 text-[#DCB473]" /> : <Users className="w-3.5 h-3.5 text-[#DCB473]" />}
                      <span>
                        {finViewMode === 'drill' && finDrillGroup
                          ? `${finDrillGroup} গ্রুপের লেজার সমীকরণ`
                          : (activeTab === 'hajj' ? 'মূল হজ নিবন্ধন ও বকেয়া লেজার সমীকরণ' : 'ওমরাহ্ নিবন্ধন ও বকেয়া লেজার সমীকরণ')}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-[#0f2922]">
                      {finViewMode === 'drill' && finDrillGroup
                        ? `${finDrillGroup} — নিবন্ধিত টাকার আর্থিক হিসাব`
                        : (activeTab === 'hajj' ? 'মূল হজ নিবন্ধনকৃত টাকার সার্বিক হিসাব' : 'পবিত্র ওমরাহ্ নিবন্ধনকৃত টাকার সার্বিক হিসাব')}
                    </h3>
                    <p className="text-xs text-stone-500">
                      রেজিস্ট্রেশনের সময় ধার্যকৃত মোট টাকা থেকে আদায়কৃত পরিশোধিত টাকা বাদ দিয়ে স্বয়ংক্রিয়ভাবে মোট ডিউ টাকার পরিমাণ হিসাব করা হয়েছে।
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-[#0f2922]/5 px-3.5 py-2 rounded-2xl border border-[#0f2922]/10 text-xs font-bold text-[#0f2922] self-start sm:self-auto">
                    <span>যাত্রী সংখ্যা:</span>
                    <span className="bg-[#0f2922] text-[#DCB473] px-2.5 py-0.5 rounded-lg font-mono">
                      {displayedLedgerRecords.length} জন
                    </span>
                  </div>
                </div>

                {/* 3 Prominent Calculation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {/* ১. রেজিস্ট্রেশনকৃত টাকার পরিমাণ */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-[#0f2922]/20 shadow-xs relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0f2922] uppercase tracking-wide">
                          <span className="w-5 h-5 rounded-full bg-[#0f2922] text-[#DCB473] text-[11px] flex items-center justify-center font-bold">১</span>
                          <span>রেজিস্ট্রেশনকৃত টাকার পরিমাণ</span>
                        </span>
                        <span className="text-[10px] bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded-full">
                          ধার্যকৃত মোট টাকা
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mb-2">
                        {finViewMode === 'drill' && finDrillGroup
                          ? `${finDrillGroup} গ্রুপে হাজী রেজিস্ট্রেশনের সময় ধার্যকৃত টাকা`
                          : (activeTab === 'hajj' ? 'মূল হজ সকল হাজির রেজিস্ট্রেশনের সময় ধার্যকৃত টাকা' : 'ওমরাহ্ সকল হাজির রেজিস্ট্রেশনের সময় ধার্যকৃত টাকা')}
                      </p>
                      <div className="text-2xl sm:text-3xl font-black text-[#0f2922] tracking-tight">
                        {formatBDT(
                          finViewMode === 'drill' && currentFinGroupSummary
                            ? currentFinGroupSummary.totalContract
                            : (activeTab === 'hajj' ? summary.hajjTotalContract : summary.umrahTotalContract)
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span>যাত্রী সংখ্যা: {displayedLedgerRecords.length} জন</span>
                      <span className="font-bold text-stone-700">প্যাকেজ চুক্তি অনুযায়ী</span>
                    </div>
                  </div>

                  {/* ২. পরিশোধিত টাকার পরিমাণ */}
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border-2 border-emerald-300 shadow-xs relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                          <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center font-bold">২</span>
                          <span>পরিশোধিত টাকার পরিমাণ</span>
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          মোট আদায়কৃত
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mb-2">
                        যাত্রীদের থেকে এ পর্যন্ত ক্যাশ ও ব্যাংকে জমাকৃত মোট টাকা
                      </p>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                        {formatBDT(
                          finViewMode === 'drill' && currentFinGroupSummary
                            ? currentFinGroupSummary.totalDeposited
                            : (activeTab === 'hajj' ? summary.hajjTotalDeposited : summary.umrahTotalDeposited)
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-stone-600">
                      <span>আদায় সম্পন্ন:</span>
                      <span className="font-bold text-emerald-800">
                        {(() => {
                          const contract = finViewMode === 'drill' && currentFinGroupSummary
                            ? currentFinGroupSummary.totalContract
                            : (activeTab === 'hajj' ? summary.hajjTotalContract : summary.umrahTotalContract);
                          const deposited = finViewMode === 'drill' && currentFinGroupSummary
                            ? currentFinGroupSummary.totalDeposited
                            : (activeTab === 'hajj' ? summary.hajjTotalDeposited : summary.umrahTotalDeposited);
                          return contract > 0 ? `${Math.round((deposited / contract) * 100)}% পরিশোধিত` : '০%';
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* ৩. ডিউ টাকার পরিমাণ */}
                  <div className="bg-rose-50/60 p-5 rounded-2xl border-2 border-rose-300 shadow-xs relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-900 uppercase tracking-wide">
                          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center font-bold">৩</span>
                          <span>ডিউ টাকার পরিমাণ</span>
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                          মোট বকেয়া
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mb-2">
                        রেজিস্ট্রেশনকৃত টাকা − পরিশোধিত টাকা = মোট ডিউ
                      </p>
                      <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                        {formatBDT(
                          finViewMode === 'drill' && currentFinGroupSummary
                            ? currentFinGroupSummary.totalDue
                            : (activeTab === 'hajj' ? summary.hajjTotalDue : summary.umrahTotalDue)
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-stone-600">
                      <span>বকেয়া অনুপাত:</span>
                      <span className="font-bold text-rose-700">
                        {(() => {
                          const contract = finViewMode === 'drill' && currentFinGroupSummary
                            ? currentFinGroupSummary.totalContract
                            : (activeTab === 'hajj' ? summary.hajjTotalContract : summary.umrahTotalContract);
                          const due = finViewMode === 'drill' && currentFinGroupSummary
                            ? currentFinGroupSummary.totalDue
                            : (activeTab === 'hajj' ? summary.hajjTotalDue : summary.umrahTotalDue);
                          return contract > 0 ? `${Math.round((due / contract) * 100)}% অবশিষ্ট` : '০%';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formula Badge Footer */}
                {(() => {
                  const contract = finViewMode === 'drill' && currentFinGroupSummary
                    ? currentFinGroupSummary.totalContract
                    : (activeTab === 'hajj' ? summary.hajjTotalContract : summary.umrahTotalContract);
                  const deposited = finViewMode === 'drill' && currentFinGroupSummary
                    ? currentFinGroupSummary.totalDeposited
                    : (activeTab === 'hajj' ? summary.hajjTotalDeposited : summary.umrahTotalDeposited);
                  const due = finViewMode === 'drill' && currentFinGroupSummary
                    ? currentFinGroupSummary.totalDue
                    : (activeTab === 'hajj' ? summary.hajjTotalDue : summary.umrahTotalDue);

                  return (
                    <div className="p-3 bg-stone-100/90 rounded-2xl border border-stone-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-stone-700 font-semibold">
                        <span className="font-bold text-[#0f2922]">হিসাব সূত্র:</span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 font-bold text-[#0f2922]">
                          রেজিস্ট্রেশনকৃত টাকার পরিমাণ ({formatBDT(contract)})
                        </span>
                        <span className="text-stone-500 font-black">−</span>
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 font-bold">
                          পরিশোধিত টাকার পরিমাণ ({formatBDT(deposited)})
                        </span>
                        <span className="text-stone-500 font-black">=</span>
                        <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 font-black">
                          ডিউ টাকার পরিমাণ ({formatBDT(due)})
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 italic">
                        {finViewMode === 'drill' && finDrillGroup ? `${finDrillGroup} গ্রুপ অনুযায়ী স্বয়ংক্রিয় সমন্বিত` : 'স্বয়ংক্রিয় সমন্বিত লেজার'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Pilgrims Table / Cards */}
              {displayedLedgerRecords.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-stone-300 mx-auto" />
                  <h4 className="font-bold text-stone-700">
                    {activeTab === 'hajj' ? 'কোনো মূল হজ যাত্রী নিবন্ধিত নেই' : 'কোনো ওমরাহ্ যাত্রী পাওয়া যায়নি'}
                  </h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                    {activeTab === 'hajj'
                      ? 'বর্তমানে কোনো মূল হজ যাত্রী নিবন্ধিত নেই। "হাজী নিবন্ধন" থেকে নতুন মূল হজ যাত্রী অনুমোদিত হলে বা "নতুন হজ যাত্রী যোগ করুন" বাটনে ক্লিক করে যুক্ত করলে উল্লেখিত সূত্র অনুযায়ী স্বয়ংক্রিয়ভাবে তার নির্ধারিত টাকা, পরিশোধিত ও ডিউ টাকার পৃথক স্টেটমেন্ট এখানে প্রদর্শিত হবে।'
                      : 'এই ফিল্টারে কোনো ওমরাহ্ যাত্রী পাওয়া যায়নি।'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedLedgerRecords.map((record) => {
                    const isExpanded = expandedPilgrimId === record.id;
                return (
                  <div
                    key={record.id}
                    className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-[#DCB473]/50 transition-all overflow-hidden"
                  >
                    {/* Row Summary */}
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Pilgrim Basic Info */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                            record.hajiType === 'hajj'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {record.hajiType === 'hajj' ? 'হজ' : 'ওমরাহ'}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setProfilePilgrim(record)}
                              className="font-extrabold text-stone-900 text-base hover:text-emerald-700 hover:underline cursor-pointer text-left flex items-center gap-1.5 group"
                              title="হাজীর সম্পূর্ণ প্রোফাইল, তথ্য ও মানি রিসিট দেখতে ক্লিক করুন"
                            >
                              <span>{record.hajiName}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700" />
                            </button>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                              {record.registrationRef || record.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                record.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : record.paymentStatus === 'partial'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {record.paymentStatus === 'paid'
                                ? 'পরিশোধিত'
                                : record.paymentStatus === 'partial'
                                ? 'আংশিক জমা'
                                : 'বকেয়া'}
                            </span>
                            {record.payments.some((p) => p.status === 'pending') && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>পেমেন্ট অ্যাপ্রুভাল পেন্ডিং ({record.payments.filter((p) => p.status === 'pending').length})</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{record.phone}</span>
                            </span>
                            {record.passportNo && (
                              <span className="flex items-center gap-1 font-mono">
                                <span>পাসপোর্ট:</span>
                                <b>{record.passportNo}</b>
                              </span>
                            )}
                            <span className="text-stone-400">|</span>
                            <span className="text-stone-600 font-medium">{record.packageName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Financial Metrics (Exact requested 1. রেজিস্ট্রেশনকৃত, 2. পরিশোধিত, 3. ডিউ) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-right bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        <div>
                          <span className="text-[10px] text-stone-500 block font-semibold">১. রেজিস্ট্রেশনকৃত টাকা</span>
                          <span className="font-bold text-stone-900 text-xs sm:text-sm">
                            {formatBDT(record.finalTotalAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 block font-semibold">২. পরিশোধিত টাকা</span>
                          <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                            {formatBDT(record.totalDeposited)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-rose-600 block font-semibold">৩. ডিউ টাকা</span>
                          <span className={`font-bold text-xs sm:text-sm ${record.dueAmount > 0 ? 'text-rose-600' : 'text-stone-400'}`}>
                            {formatBDT(record.dueAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block font-semibold">ব্যয় / নিট লাভ</span>
                          <span
                            className={`font-black text-xs sm:text-sm ${
                              record.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {formatBDT(record.netProfit)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          onClick={() => setProfilePilgrim(record)}
                          className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          title="হাজীর সম্পূর্ণ প্রোফাইল ও বিবরণী দেখুন"
                        >
                          <User className="w-3.5 h-3.5 text-stone-300" />
                          <span>প্রোফাইল</span>
                        </button>

                        {(canSubAdminAdd('finance') || canSubAdminEdit('finance')) && (
                          <button
                            onClick={() => handleOpenPaymentModal(record)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            title="টাকা জমা নিন / পেমেন্ট এন্ট্রি"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>পেমেন্ট জমা</span>
                          </button>
                        )}

                        {canSubAdminEdit('finance') && (
                          <button
                            onClick={() => handleOpenExpenseModal(record)}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="এই হাজীর খরচের খাতসমূহ সম্পাদন করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                            <span>খরচ এডিট</span>
                          </button>
                        )}

                        <button
                          onClick={() => setPrintPilgrim(record)}
                          className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs transition-colors cursor-pointer"
                          title="মানি রিসিট ও খরচ বিবরণী প্রিন্ট"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {canSubAdminDelete('finance') && (
                          <button
                            onClick={() => {
                              requestConfirm({
                                title: 'হিসাব মুছে ফেলতে নিশ্চিত?',
                                message: `আপনি কি "${record.hajiName}"-এর হিসাব রেকর্ডটি নিশ্চিতভাবে মুছে ফেলতে চান?`,
                                onConfirm: () => deleteHajiFinanceRecord(record.id)
                              });
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs transition-colors cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedPilgrimId(isExpanded ? null : record.id)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer transition-colors"
                          title="খরচের বিস্তারিত ও পেমেন্ট হিস্ট্রি দেখুন"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Details: Per-Person Purpose Expense Items & Payment Records */}
                    {isExpanded && (
                      <div className="border-t border-stone-200 bg-stone-50/70 p-5 space-y-5">
                        {/* 1. Itemized Expenses Breakdown (কি কি পারপাজে খরচ হয়েছে) */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-stone-800 text-xs sm:text-sm flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-[#DCB473]" />
                              <span>এই যাত্রীর পেছনে খরচসমূহ (Itemized Expenses Breakdown)</span>
                            </h5>
                            <span className="text-xs font-bold text-stone-700">
                              মোট ব্যয়: <span className="text-rose-600 font-extrabold">{formatBDT(record.totalExpense)}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {record.expenses.map((exp) => (
                              <div
                                key={exp.id}
                                className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs flex justify-between items-start gap-2"
                              >
                                <div>
                                  <span className="font-bold text-stone-800 block">{exp.title}</span>
                                  {exp.note && <span className="text-[10px] text-stone-400 block">{exp.note}</span>}
                                </div>
                                <span className="font-bold text-rose-600 shrink-0">{formatBDT(exp.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2. Payment Deposit History (জমা হওয়া টাকার কিস্তি তালিকা) */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-stone-800 text-xs sm:text-sm flex items-center gap-1.5">
                              <Receipt className="w-4 h-4 text-emerald-600" />
                              <span>জমা হওয়া কিস্তিসমূহ (Deposit Records)</span>
                            </h5>
                            <span className="text-xs font-bold text-stone-700">
                              মোট অনুমোদিত জমা: <span className="text-emerald-700 font-extrabold">{formatBDT(record.totalDeposited)}</span>
                            </span>
                          </div>

                          {record.payments.length === 0 ? (
                            <div className="bg-white p-3 rounded-xl border border-stone-200 text-center text-xs text-stone-400">
                              এখনো কোনো টাকা জমা করা হয়নি।
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {record.payments.map((pmt) => (
                                <div
                                  key={pmt.id}
                                  className="bg-white p-3 rounded-xl border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                                >
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="font-bold text-stone-800">{pmt.date}</span>
                                    <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded font-semibold text-[11px] border border-stone-200">
                                      {pmt.method.toUpperCase()}
                                    </span>
                                    {pmt.voucherNo && (
                                      <span className="font-mono text-stone-600 text-[11px]">
                                        ভাউচার: <b>{pmt.voucherNo}</b>
                                      </span>
                                    )}
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        pmt.status === 'pending'
                                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                                          : pmt.status === 'rejected'
                                          ? 'bg-rose-100 text-rose-800 border-rose-300 line-through'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}
                                    >
                                      {pmt.status === 'pending'
                                        ? 'অনুমোদনের অপেক্ষায়'
                                        : pmt.status === 'rejected'
                                        ? 'বাতিল'
                                        : 'অনুমোদিত'}
                                    </span>
                                    {pmt.submittedBy === 'haji' && (
                                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                                        হাজী পোর্টাল হতে
                                      </span>
                                    )}
                                    {pmt.note && <span className="text-stone-400 text-[11px] italic">({pmt.note})</span>}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`font-black text-sm ${
                                        pmt.status === 'pending'
                                          ? 'text-amber-700'
                                          : pmt.status === 'rejected'
                                          ? 'text-stone-400 line-through'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      +{formatBDT(pmt.amount)}
                                    </span>

                                    {pmt.receiptDataUrl && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setReceiptViewer({
                                            url: pmt.receiptDataUrl!,
                                            fileName: pmt.receiptFileName,
                                            title: `${record.hajiName} - মানি রিসিট (${pmt.voucherNo || pmt.date})`,
                                            amount: pmt.amount,
                                            date: pmt.date
                                          })
                                        }
                                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-md text-[11px] font-bold border border-amber-200 flex items-center gap-1 cursor-pointer transition-colors"
                                        title="মানি রিসিট বড় করে দেখুন"
                                      >
                                        <Eye className="w-3 h-3 text-amber-700" />
                                        <span>রসিদ</span>
                                      </button>
                                    )}

                                    {pmt.status === 'pending' && canSubAdminEdit('finance') && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => approvePilgrimPayment(record.id, pmt.id)}
                                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                          title="পেমেন্ট অনুমোদন করুন"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>অনুমোদন</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const reason = prompt('বাতিলের কারণ লিখুন (ঐচ্ছিক):') || undefined;
                                            rejectPilgrimPayment(record.id, pmt.id, reason);
                                          }}
                                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-rose-200"
                                          title="পেমেন্ট বাতিল করুন"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>বাতিল</span>
                                        </button>
                                      </div>
                                    )}

                                    {!isSubAdmin && (
                                      <button
                                        onClick={() => {
                                          requestConfirm({
                                            title: 'পেমেন্ট ভাউচার মুছবেন?',
                                            message: `৳${pmt.amount} টাকার এই পেমেন্ট ভাউচারটি কি নিশ্চিতভাবে ডিলিট করবেন?`,
                                            onConfirm: () => deletePilgrimPayment(record.id, pmt.id)
                                          });
                                        }}
                                        className="p-1 text-stone-300 hover:text-rose-500 cursor-pointer transition-colors rounded"
                                        title="ভাউচার বাতিল"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: অন্যান্য আয় ও ব্যয়ের হিসাব (Other Incomes & Expenses) */}
      {/* ======================================================== */}
      {activeTab === 'office' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-bold text-stone-900 text-base sm:text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>অন্যান্য আয় ও পরিচালন ব্যয়ের হিসাব</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                কাফেলার অন্যান্য সকল আয় (কনসালটেন্সি, সার্ভিস চার্জ, কমিশন) ও সকল পরিচালন ব্যয়ের সমন্বিত হিসাব
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                <span className="text-stone-500 font-medium">আয়:</span>
                <span className="font-bold text-emerald-700">+{formatBDT(summary.totalOtherIncome)}</span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500 font-medium">ব্যয়:</span>
                <span className="font-bold text-rose-600">-{formatBDT(summary.totalOfficeExpense)}</span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500 font-medium">স্থিতি:</span>
                <span className={`font-black ${summary.netOtherBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatBDT(summary.netOtherBalance)}
                </span>
              </div>

              {!isSubAdmin && (
                <button
                  onClick={() => {
                    setIsOfficeOverheadEntry(false);
                    setOfficeEntryType('income');
                    setIsOfficeExpModalOpen(true);
                  }}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ আয় এন্ট্রি</span>
                </button>
              )}

              {!isSubAdmin && (
                <button
                  onClick={() => {
                    setIsOfficeOverheadEntry(false);
                    setOfficeEntryType('expense');
                    setIsOfficeExpModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-[#0f2922] hover:bg-[#164438] text-[#DCB473] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>- ব্যয় এন্ট্রি</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar for Other Income / Expense */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-stone-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-medium">ফিল্টার:</span>
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setOfficeFilterType('all')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    officeFilterType === 'all'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  সকল হিসাব ({officeExpenses.length})
                </button>
                <button
                  onClick={() => setOfficeFilterType('income')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    officeFilterType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  শুধু আয় (+ {formatBDT(summary.totalOtherIncome)})
                </button>
                <button
                  onClick={() => setOfficeFilterType('expense')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                    officeFilterType === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 hover:text-rose-900'
                  }`}
                >
                  শুধু ব্যয় (- {formatBDT(summary.totalOfficeExpense)})
                </button>
              </div>
            </div>

            <span className="text-[11px] text-stone-400">
              মোট প্রদর্শিত এন্ট্রি: {filteredOfficeExpenses.length} টি
            </span>
          </div>

          {filteredOfficeExpenses.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
              <Building2 className="w-10 h-10 text-stone-300 mx-auto" />
              <h4 className="font-bold text-stone-700">কোনো আয় বা ব্যয়ের রেকর্ড পাওয়া যায়নি</h4>
              <p className="text-xs text-stone-400">নতুন আয় বা খরচের ভাউচার যোগ করতে উপরের বাটন চাপুন।</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase">
                    <tr>
                      <th className="p-3.5">তারিখ</th>
                      <th className="p-3.5">ধরণ</th>
                      <th className="p-3.5">বিবরণ / খাত</th>
                      <th className="p-3.5">ক্যাটাগরি</th>
                      <th className="p-3.5">ভাউচার নং</th>
                      <th className="p-3.5">পরিশোধকারী / গ্রহীতা</th>
                      <th className="p-3.5 text-right">পরিমাণ (৳)</th>
                      <th className="p-3.5 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOfficeExpenses.map((exp) => {
                      const isIncome = exp.entryType === 'income';
                      return (
                        <tr key={exp.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="p-3.5 font-bold text-stone-800 whitespace-nowrap">{exp.date}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                isIncome
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {isIncome ? '+ আয় (Income)' : '- ব্যয় (Expense)'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-stone-900 block">{exp.title}</span>
                            {exp.note && <span className="text-[11px] text-stone-400 block">{exp.note}</span>}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-stone-100 text-stone-700 border border-stone-200">
                              {exp.category === 'rent'
                                ? 'অফিস ভাড়া'
                                : exp.category === 'salary'
                                ? 'স্টাফ বেতন'
                                : exp.category === 'utility'
                                ? 'ইউটিলিটি ও বিল'
                                : exp.category === 'marketing'
                                ? 'বিজ্ঞাপন ও প্রচার'
                                : exp.category === 'stationery'
                                ? 'আপ্যায়ন ও স্টেশনারি'
                                : exp.category === 'legal_license'
                                ? 'লাইসেন্স ও সরকারি ফি'
                                : exp.category === 'consultancy_fee'
                                ? 'কনসালটেন্সি ফি'
                                : exp.category === 'service_charge'
                                ? 'সার্ভিস চার্জ'
                                : exp.category === 'commission'
                                ? 'কমিশন ও ইনসেন্টিভ'
                                : exp.category === 'donation_sponsor'
                                ? 'অনুদান ও স্পন্সর'
                                : 'অন্যান্য খাত'}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-stone-600">{exp.voucherNo || '-'}</td>
                          <td className="p-3.5 text-stone-600">{exp.paidBy || '-'}</td>
                          <td
                            className={`p-3.5 text-right font-black text-sm whitespace-nowrap ${
                              isIncome ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? `+ ${formatBDT(exp.amount)}` : `- ${formatBDT(exp.amount)}`}
                          </td>
                          <td className="p-3.5 text-center">
                            {canSubAdminDelete('finance') ? (
                              <button
                                onClick={() => {
                                  requestConfirm({
                                    title: `${isIncome ? 'আয়' : 'ব্যয়'} হিসাব মুছবেন?`,
                                    message: `আপনি কি "${exp.title}" এর রেকর্ডটি নিশ্চিতভাবে মুছে ফেলতে চান?`,
                                    onConfirm: () => deleteOfficeExpense(exp.id)
                                  });
                                }}
                                className="p-1 text-stone-300 hover:text-rose-500 cursor-pointer transition-colors"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-stone-300 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: পেমেন্ট জমা গ্রহণ (Add Deposit Payment)         */}
      {/* ======================================================== */}
      {paymentModalHaji && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">হাজী পেমেন্ট জমা গ্রহণ</h4>
                  <p className="text-[11px] text-stone-500">{paymentModalHaji.hajiName}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalHaji(null)}
                className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex justify-between items-center text-xs">
                <span className="text-stone-500">বাকি বকেয়া রয়েছে:</span>
                <span className="font-black text-rose-600 text-sm">
                  {formatBDT(paymentModalHaji.dueAmount)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  জমা টাকার পরিমাণ (৳ BDT) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmountInput || ''}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0f2922]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">পরিশোধের মাধ্যম</label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                  >
                    <option value="bank">ব্যাংক ট্রান্সফার</option>
                    <option value="cash">নগদ ক্যাশ</option>
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ মোবাইল মানি</option>
                    <option value="check">ব্যাংক চেক</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={paymentDateInput}
                    onChange={(e) => setPaymentDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ভাউচার / ট্রানজেকশন আইডি নং
                </label>
                <input
                  type="text"
                  value={paymentVoucherInput}
                  onChange={(e) => setPaymentVoucherInput(e.target.value)}
                  placeholder="যেমন: TRX-8842 / রসিদ নং"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">গ্রহীতা / কর্মকর্তা</label>
                <input
                  type="text"
                  value={paymentReceivedByInput}
                  onChange={(e) => setPaymentReceivedByInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">মন্তব্য / নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={paymentNoteInput}
                  onChange={(e) => setPaymentNoteInput(e.target.value)}
                  placeholder="যেমন: ২য় কিস্তি পরিশোধ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মানি রিসিট / ব্যাংক স্লিপ আপলোড (ছবি বা PDF)
                </label>
                {paymentReceiptDataUrl ? (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {paymentReceiptMimeType === 'application/pdf' ? (
                        <FileText className="w-6 h-6 text-rose-600 shrink-0" />
                      ) : (
                        <img
                          src={paymentReceiptDataUrl}
                          alt="রসিদ প্রিভিউ"
                          className="w-10 h-10 object-cover rounded-lg border border-stone-200 shrink-0"
                        />
                      )}
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-stone-800 truncate">
                          {paymentReceiptFileName || 'মানি রিসিট'}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {paymentReceiptMimeType === 'application/pdf' ? 'PDF ডকুমেন্ট' : 'ছবি ডকুমেন্ট'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setReceiptViewer({
                            url: paymentReceiptDataUrl,
                            fileName: paymentReceiptFileName,
                            title: `${paymentModalHaji.hajiName} - মানি রিসিট প্রিভিউ`,
                            amount: paymentAmountInput,
                            date: paymentDateInput
                          })
                        }
                        className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs cursor-pointer"
                        title="বড় করে দেখুন"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentReceiptDataUrl('');
                          setPaymentReceiptFileName('');
                          setPaymentReceiptMimeType('');
                        }}
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="border-2 border-dashed border-stone-300 hover:border-emerald-600 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-stone-50 hover:bg-emerald-50/40 transition-colors">
                      <Upload className="w-5 h-5 text-stone-400" />
                      <span className="text-xs font-semibold text-stone-600">
                        {isPaymentReceiptUploading ? 'রসিদ প্রসেস হচ্ছে...' : 'রসিদ বা ব্যাংক স্লিপ নির্বাচন করুন'}
                      </span>
                      <span className="text-[10px] text-stone-400">JPG, PNG, WebP বা PDF (সর্বোচ্চ ১.২ MB)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        disabled={isPaymentReceiptUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setIsPaymentReceiptUploading(true);
                            const processed = await prepareReceiptFile(file);
                            setPaymentReceiptDataUrl(processed.dataUrl);
                            setPaymentReceiptFileName(processed.fileName);
                            setPaymentReceiptMimeType(processed.mimeType);
                          } catch (err: any) {
                            showToast(err.message || 'রসিদ আপলোড করা সম্ভব হয়নি');
                          } finally {
                            setIsPaymentReceiptUploading(false);
                            e.target.value = '';
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalHaji(null)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  জমা নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: প্রতিজনের খরচের খাত এডিট (Customize Expenses)   */}
      {/* ======================================================== */}
      {expenseModalHaji && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100 shrink-0">
              <div>
                <h4 className="font-extrabold text-stone-900 text-base">
                  ব্যয়ের খাতসমূহ সম্পাদন ({expenseModalHaji.hajiName})
                </h4>
                <p className="text-xs text-stone-500">
                  {expenseModalHaji.hajiType === 'hajj' ? 'মূল হজ প্যাকেজ ব্যয়' : 'ওমরাহ্ প্যাকেজ ব্যয়'}
                </p>
              </div>
              <button
                onClick={() => setExpenseModalHaji(null)}
                className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-2.5 flex-1">
              {editedExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex-1">
                    <span className="font-bold text-stone-800 block">{exp.title}</span>
                    {exp.note && <span className="text-[10px] text-stone-400">{exp.note}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-medium">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={exp.amount}
                      onChange={(e) => handleUpdateExpenseItemAmount(exp.id, Number(e.target.value))}
                      className="w-28 px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-300 bg-white text-right focus:outline-none focus:ring-1 focus:ring-[#0f2922]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExpenseItem(exp.id)}
                      className="text-stone-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCustomExpenseItem}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-dashed border-stone-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ব্যয়ের খাত যোগ করুন</span>
              </button>
            </div>

            <div className="pt-4 mt-3 border-t border-stone-200 flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs text-stone-500 block">সংশোধিত মোট ব্যয়:</span>
                <span className="text-lg font-black text-rose-600">
                  {formatBDT(editedExpenses.reduce((s, e) => s + e.amount, 0))}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseModalHaji(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedExpenses}
                  className="px-5 py-2 bg-[#0f2922] hover:bg-[#164438] text-[#DCB473] font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  খরচ সংরক্ষণ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isManualPilgrimExpenseModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="manual-pilgrim-expense-title" className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100">
              <div>
                <h4 id="manual-pilgrim-expense-title" className="font-extrabold text-stone-900 text-base">হাজীর খরচ ম্যানুয়ালি যোগ</h4>
                <p className="text-xs text-stone-500 mt-1">{pilgrimExpenseType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্ হজ'} হাজীর খরচের খাত</p>
              </div>
              <button type="button" onClick={() => setIsManualPilgrimExpenseModalOpen(false)} disabled={isAnyManualReceiptUploading} aria-label="বন্ধ করুন" className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">✕</button>
            </div>

            <form onSubmit={handleSaveManualPilgrimExpense} className="space-y-3.5">
              <div>
                <label htmlFor="manual-expense-pilgrim" className="block text-xs font-bold text-stone-700 mb-1">হাজী নির্বাচন করুন *</label>
                <select id="manual-expense-pilgrim" required value={manualExpenseRecordId} onChange={(e) => setManualExpenseRecordId(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50">
                  <option value="">হাজীর নাম / রেজিস্ট্রেশন নম্বর নির্বাচন করুন</option>
                  {manualExpenseCandidates.map((record) => (
                    <option key={record.id} value={record.id}>{record.hajiNameBn || record.hajiName} · {record.registrationRef || record.id} · {record.yearSeason}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-stone-500">বর্তমান রিপোর্টের সেশন অনুযায়ী হাজীর তালিকা দেখানো হচ্ছে।</p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-stone-600">যে যে খাতে খরচ হয়েছে, প্রতিটির পাশে টাকার পরিমাণ লিখুন। ফাঁকা বা ০ টাকা দেওয়া খাত সংরক্ষণ হবে না।</p>
                  <button type="button" onClick={handleAddCustomManualExpenseLine} disabled={manualCustomCategoryCount >= 10} className="shrink-0 inline-flex items-center justify-center gap-1 rounded-lg border border-dashed border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"><Plus className="h-3.5 w-3.5" />নিজস্ব নতুন খাত যোগ</button>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {PILGRIM_EXPENSE_CATEGORIES.map((category) => {
                    const inputId = `manual-expense-amount-${category}`;
                    const line = manualExpenseLines[category];
                    return (
                      <div key={category} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 space-y-2">
                        <div className="grid grid-cols-[minmax(0,1fr)_140px] sm:grid-cols-[minmax(0,1fr)_180px] items-center gap-3">
                          <label htmlFor={inputId} className="text-xs font-semibold text-stone-800">{PILGRIM_EXPENSE_CATEGORY_LABELS[category]}</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-500">৳</span>
                            <input
                              id={inputId}
                              aria-label={`${PILGRIM_EXPENSE_CATEGORY_LABELS[category]} খরচের পরিমাণ`}
                              type="number"
                              min="0"
                              step="1"
                              value={line.amount || ''}
                              onChange={(e) => updateManualExpenseLine(category, { amount: Number(e.target.value) || 0 })}
                              placeholder="০"
                              className="w-full pl-7 pr-2.5 py-2 text-sm font-bold rounded-lg border border-stone-300 bg-white text-right focus:outline-none focus:ring-1 focus:ring-[#0f2922]"
                            />
                          </div>
                        </div>
                        {line.amount > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-stone-200 pt-2">
                            <div>
                              <label htmlFor={`manual-expense-voucher-${category}`} className="block text-[11px] font-semibold text-stone-600 mb-1">ভাউচার নং (ঐচ্ছিক)</label>
                              <input
                                id={`manual-expense-voucher-${category}`}
                                type="text"
                                maxLength={60}
                                value={line.voucherNo}
                                onChange={(e) => updateManualExpenseLine(category, { voucherNo: e.target.value })}
                                placeholder="যেমন: VCH-102"
                                className="w-full px-2.5 py-2 text-xs rounded-lg border border-stone-300 bg-white"
                              />
                            </div>
                            <div>
                              <label htmlFor={`manual-expense-receipt-${category}`} className="block text-[11px] font-semibold text-stone-600 mb-1">মানি রিসিট (ঐচ্ছিক)</label>
                              <input
                                id={`manual-expense-receipt-${category}`}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                disabled={line.isReceiptUploading}
                                onChange={(e) => {
                                  const file = e.currentTarget.files?.[0] || null;
                                  e.currentTarget.value = '';
                                  void handleManualExpenseReceiptUpload(category, file);
                                }}
                                className="w-full text-[11px] file:mr-2 file:px-2 file:py-1.5 file:rounded-md file:border-0 file:bg-white file:text-stone-700 file:font-semibold"
                              />
                              {line.isReceiptUploading ? (
                                <p className="mt-1 text-[10px] text-amber-700">রসিদ প্রস্তুত হচ্ছে...</p>
                              ) : line.receiptDataUrl ? (
                                <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                                  <a href={line.receiptDataUrl} download={line.receiptFileName || 'money-receipt'} className="truncate text-emerald-800 underline">{line.receiptFileName || 'রসিদ ডাউনলোড করুন'}</a>
                                  <button type="button" onClick={() => handleRemoveManualExpenseReceipt(category)} className="shrink-0 text-rose-700 underline">বাদ দিন</button>
                                </div>
                              ) : (
                                <p className="mt-1 text-[10px] text-stone-500">JPG/PNG/WEBP: ৮ MB পর্যন্ত, সংকুচিত হবে; PDF: ৭০০ KB পর্যন্ত। সব রসিদ মিলিয়ে ২ MB সীমা।</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {Object.entries(manualExpenseLines).filter(([lineKey]) => lineKey.startsWith('custom:')).map(([lineKey, line]) => renderManualExpenseLine(lineKey, line, true))}
                </div>
                <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800">
                  <span>এই ফর্মের মোট</span>
                  <span>{formatBDT(Object.values(manualExpenseLines).reduce((sum, line) => sum + Math.max(0, Number(line.amount) || 0), 0))}</span>
                </div>
              </div>

              <div>
                <label htmlFor="manual-expense-date" className="block text-xs font-bold text-stone-700 mb-1">তারিখ *</label>
                <input id="manual-expense-date" required type="date" value={manualExpenseDate} onChange={(e) => setManualExpenseDate(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50" />
              </div>

              <div>
                <label htmlFor="manual-expense-note" className="block text-xs font-bold text-stone-700 mb-1">সব যোগ করা খরচের নোট (ঐচ্ছিক)</label>
                <input id="manual-expense-note" type="text" maxLength={300} value={manualExpenseNote} onChange={(e) => setManualExpenseNote(e.target.value)} placeholder="খরচ সম্পর্কে অতিরিক্ত তথ্য" className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300" />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsManualPilgrimExpenseModalOpen(false)} disabled={isAnyManualReceiptUploading} className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">বাতিল</button>
                <button type="submit" disabled={isAnyManualReceiptUploading} className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">{isAnyManualReceiptUploading ? 'রসিদ প্রস্তুত হচ্ছে...' : 'খরচগুলো সংরক্ষণ করুন'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: নতুন হাজী হিসাব যোগ (Add New Pilgrim Record)     */}
      {/* ======================================================== */}
      {isAddPilgrimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#DCB473]/20 text-[#0f2922] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">নতুন হাজী / ওমরাহ্ হিসাব তৈরি</h4>
                  <p className="text-[11px] text-stone-500">যাত্রীর নাম, প্যাকেজ রেট ও খরচ বিবরণী</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPilgrimModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewPilgrim} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ক্যাটাগরি নির্ধারণ *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPilgrimType('hajj');
                      setNewPilgrimPrice(650000);
                      setNewPilgrimPackage('বেসরকারি ভিআইপি হজ্ব প্যাকেজ (৪০ দিন)');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newPilgrimType === 'hajj'
                        ? 'bg-[#0f2922] text-[#DCB473] border-[#0f2922]'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    মূল হজ (Main Hajj)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPilgrimType('umrah');
                      setNewPilgrimPrice(165000);
                      setNewPilgrimPackage('পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      newPilgrimType === 'umrah'
                        ? 'bg-[#0f2922] text-[#DCB473] border-[#0f2922]'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    ওমরাহ্ হজ (Umrah)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">হাজীর পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আলহাজ্ব মো: আব্দুস সামাদ"
                  value={newPilgrimName}
                  onChange={(e) => setNewPilgrimName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#0f2922]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    required
                    placeholder="01712-XXXXXX"
                    value={newPilgrimPhone}
                    onChange={(e) => setNewPilgrimPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">জেলা / ঠিকানা</label>
                  <input
                    type="text"
                    value={newPilgrimDistrict}
                    onChange={(e) => setNewPilgrimDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">পাসপোর্ট নম্বর</label>
                  <input
                    type="text"
                    placeholder="A09876543"
                    value={newPilgrimPassport}
                    onChange={(e) => setNewPilgrimPassport(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">এনআইডি নম্বর</label>
                  <input
                    type="text"
                    placeholder="জাতীয় পরিচয়পত্র নং"
                    value={newPilgrimNid}
                    onChange={(e) => setNewPilgrimNid(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">প্যাকেজের নাম</label>
                <input
                  type="text"
                  value={newPilgrimPackage}
                  onChange={(e) => setNewPilgrimPackage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">প্যাকেজ মূল্য (৳)</label>
                  <input
                    type="number"
                    required
                    value={newPilgrimPrice}
                    onChange={(e) => setNewPilgrimPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিশেষ ছাড় (৳)</label>
                  <input
                    type="number"
                    value={newPilgrimDiscount}
                    onChange={(e) => setNewPilgrimDiscount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 text-right text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">প্রাথমিক জমা (৳)</label>
                  <input
                    type="number"
                    value={newPilgrimInitialDeposit}
                    onChange={(e) => setNewPilgrimInitialDeposit(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-stone-300 text-right text-emerald-700"
                  />
                </div>
              </div>

              <p className="text-[11px] text-stone-400 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                💡 এন্ট্রি করার সাথে সাথে এই যাত্রীর জন্য বিমান টিকেট, ভিসা, মক্কা ও মদিনা হোটেল, মোয়াল্লেম ফি ও ক্যাটারিংয়ের স্বয়ংক্রিয় খরচের হিসাব রেডি হয়ে যাবে, যা আপনি পরবর্তীতে যে কোনো সময় কাস্টমাইজ করতে পারবেন।
              </p>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPilgrimModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0f2922] hover:bg-[#164438] text-[#DCB473] font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                >
                  হিসাব তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: অন্যান্য আয় ও পরিচালন ব্যয় যোগ (Add Income/Expense) */}
      {/* ======================================================== */}
      {isOfficeExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    officeEntryType === 'income'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">
                    {isOfficeOverheadEntry ? 'নতুন অফিস ওভারহেড ব্যয় যুক্ত করুন' : officeEntryType === 'income' ? 'নতুন আয় যুক্ত করুন' : 'নতুন পরিচালন ব্যয় যুক্ত করুন'}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {isOfficeOverheadEntry
                      ? officeExpType === 'hajj_overhead' ? 'শুধু মূল হজের অফিস ওভারহেড হিসেবে সংরক্ষিত হবে' : 'শুধু ওমরাহ্ হজের অফিস ওভারহেড হিসেবে সংরক্ষিত হবে'
                      : officeEntryType === 'income'
                      ? 'সার্ভিস চার্জ, কনসালটেন্সি ফি, কমিশন বা অনুদান'
                      : 'ভাড়া, বেতন, ইউটিলিটি, লাইসেন্স বা প্রচারণা খরচ'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOfficeExpModalOpen(false);
                  setIsOfficeOverheadEntry(false);
                }}
                className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOfficeExpense} className="space-y-3.5">
              {/* Income vs Expense Toggle */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">এন্ট্রির ধরণ নির্ধারণ *</label>
                {isOfficeOverheadEntry ? (
                  <div className="py-2 text-xs font-bold rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-center">
                    − অফিস ওভারহেড ব্যয় · {officeExpType === 'hajj_overhead' ? 'মূল হজ' : 'ওমরাহ্ হজ'}
                  </div>
                ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOfficeEntryType('income');
                      setOfficeExpType('general');
                      setOfficeExpCategory('consultancy_fee');
                      setOfficeExpPayer('মুত্তাকী ক্যাশিয়ার');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      officeEntryType === 'income'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ অন্যান্য আয় (Income)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficeEntryType('expense');
                      setOfficeExpCategory('rent');
                      setOfficeExpPayer('অফিস অ্যাকাউন্টস');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      officeEntryType === 'expense'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    <span>- পরিচালন ব্যয় (Expense)</span>
                  </button>
                </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {officeEntryType === 'income' ? 'আয়ের বিবরণ / খাত *' : 'ব্যয়ের বিবরণ / টাইটেল *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    officeEntryType === 'income'
                      ? 'যেমন: হজ গাইডেন্স ও কনসালটেন্সি ফি / এয়ার টিকিট সার্ভিস কমিশন'
                      : 'যেমন: অফিস ভাড়া - অক্টোবর / স্টাফ বেতন / বিদ্যুৎ বিল'
                  }
                  value={officeExpTitle}
                  onChange={(e) => setOfficeExpTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#0f2922]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={officeExpCategory}
                    onChange={(e) => setOfficeExpCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                  >
                    {officeEntryType === 'income' ? (
                      <>
                        <option value="consultancy_fee">কনসালটেন্সি ফি</option>
                        <option value="service_charge">সার্ভিস ও প্রসেসিং চার্জ</option>
                        <option value="commission">কমিশন ও ইনসেন্টিভ</option>
                        <option value="donation_sponsor">অনুদান ও স্পন্সরশিপ</option>
                        <option value="other">অন্যান্য আয়</option>
                      </>
                    ) : (
                      <>
                        <option value="rent">অফিস ভাড়া</option>
                        <option value="salary">স্টাফ বেতন</option>
                        <option value="utility">বিদ্যুৎ ও ইন্টারনেট</option>
                        <option value="marketing">বিজ্ঞাপন ও প্রচারণা</option>
                        <option value="stationery">আপ্যায়ন ও স্টেশনারি</option>
                        <option value="legal_license">লাইসেন্স ও সরকারি ফি</option>
                        <option value="other">অন্যান্য ব্যয়</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">হিসাবের ধরন</label>
                  <select
                    value={officeExpType}
                    disabled={isOfficeOverheadEntry}
                    onChange={(e) => setOfficeExpType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50 disabled:opacity-70"
                  >
                    <option value="general">সাধারণ কাফেলা হিসাব</option>
                    <option value="hajj_overhead">মূল হজ ওভারহেড</option>
                    <option value="umrah_overhead">ওমরাহ্ ওভারহেড</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    টাকার পরিমাণ (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="টাকার অংক"
                    value={officeExpAmount || ''}
                    onChange={(e) => setOfficeExpAmount(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs font-bold rounded-xl border border-stone-300 text-right ${
                      officeEntryType === 'income' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">তারিখ</label>
                  <input
                    type="date"
                    required
                    value={officeExpDate}
                    onChange={(e) => setOfficeExpDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ভাউচার / রসিদ নং</label>
                  <input
                    type="text"
                    placeholder={officeEntryType === 'income' ? 'REC-201' : 'VCH-102'}
                    value={officeExpVoucher}
                    onChange={(e) => setOfficeExpVoucher(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {officeEntryType === 'income' ? 'গ্রহীতা / কর্মকর্তা' : 'পরিশোধকারী'}
                  </label>
                  <input
                    type="text"
                    value={officeExpPayer}
                    onChange={(e) => setOfficeExpPayer(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">বিস্তারিত নোট</label>
                <input
                  type="text"
                  placeholder="অতিরিক্ত কোনো তথ্য"
                  value={officeExpNote}
                  onChange={(e) => setOfficeExpNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOfficeExpModalOpen(false);
                    setIsOfficeOverheadEntry(false);
                  }}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm ${
                    officeEntryType === 'income'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-[#0f2922] hover:bg-[#164438] text-[#DCB473]'
                  }`}
                >
                  {officeEntryType === 'income' ? 'আয় সংরক্ষণ করুন' : 'খরচ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: পেশাদার মানি রিসিট ও ভাউচার প্রিন্ট / ডাউনলোড    */}
      {/* ======================================================== */}
      {printPilgrim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-stone-200 print:hidden">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                অফিশিয়াল মানি রিসিট ও ব্যয় বিবরণী প্রিভিউ
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#0f2922] hover:bg-[#164438] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট / PDF সংরক্ষণ</span>
                </button>
                <button
                  onClick={() => setPrintPilgrim(null)}
                  className="text-stone-400 hover:text-stone-700 text-xl font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div className="p-6 bg-[#fffdf9] rounded-2xl border border-[#DCB473]/30 space-y-6 text-stone-800">
              {/* Header */}
              <div className="text-center pb-4 border-b-2 border-[#0f2922]">
                <h2 className="text-2xl font-black text-[#0f2922] tracking-wide">
                  মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
                </h2>
                <p className="text-xs text-stone-600 font-medium">
                  এ-১৬, মদিনা শপিং কমপ্লেক্স, দুপচাঁচিয়া, বগুড়া | হটলাইন: ০১৭১১-২২৩৩৪৪, ০১৭৬৮-২৩২৫০১
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-[#0f2922] text-[#DCB473] text-xs font-bold rounded-full uppercase tracking-wider">
                  মানি রিসিট ও হজযাত্রী হিসাব বিবরণী
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-stone-400 block">রেজিস্ট্রেশন নং:</span>
                  <span className="font-mono font-bold text-sm text-stone-900">
                    {printPilgrim.registrationRef || printPilgrim.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block">তারিখ:</span>
                  <span className="font-bold text-stone-800">
                    {new Date().toLocaleDateString('bn-BD')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block">যাত্রীর নাম:</span>
                  <span className="font-extrabold text-sm text-stone-900">{printPilgrim.hajiName}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block">মোবাইল নম্বর:</span>
                  <span className="font-bold text-stone-800">{printPilgrim.phone}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">পাসপোর্ট নং:</span>
                  <span className="font-mono font-bold text-stone-800">{printPilgrim.passportNo || 'প্রক্রিয়াধীন'}</span>
                </div>
                <div className="text-right">
                  <span className="text-stone-400 block">প্যাকেজের বিবরণ:</span>
                  <span className="font-bold text-[#0f2922]">{printPilgrim.packageName}</span>
                </div>
              </div>

              {/* Financial Box with Explicit 1. রেজিস্ট্রেশনকৃত, 2. পরিশোধিত, 3. ডিউ and Formula */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white rounded-lg border border-stone-200">
                    <span className="text-[11px] text-stone-500 font-bold block mb-0.5">১. রেজিস্ট্রেশনকৃত টাকার পরিমাণ</span>
                    <span className="font-black text-[#0f2922] text-sm">
                      {formatBDT(printPilgrim.finalTotalAmount)}
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-50/70 rounded-lg border border-emerald-200">
                    <span className="text-[11px] text-emerald-800 font-bold block mb-0.5">২. পরিশোধিত টাকার পরিমাণ</span>
                    <span className="font-black text-emerald-700 text-sm">
                      {formatBDT(printPilgrim.totalDeposited)}
                    </span>
                  </div>
                  <div className="p-2 bg-rose-50/70 rounded-lg border border-rose-200">
                    <span className="text-[11px] text-rose-800 font-bold block mb-0.5">৩. ডিউ টাকার পরিমাণ</span>
                    <span className="font-black text-rose-600 text-sm">
                      {formatBDT(printPilgrim.dueAmount)}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-center text-[11px] font-semibold text-stone-600 bg-stone-100/80 py-1 px-2 rounded-md">
                  হিসাব সূত্র: <span className="font-bold text-stone-800">রেজিস্ট্রেশনকৃত টাকার পরিমাণ</span> − <span className="font-bold text-emerald-700">পরিশোধিত টাকার পরিমাণ</span> = <span className="font-bold text-rose-700">ডিউ টাকার পরিমাণ</span>
                </div>
              </div>

              {/* Itemized Expenses Table */}
              <div>
                <h5 className="font-bold text-xs text-stone-700 mb-2 uppercase tracking-wide">
                  ব্যয়ের খাতসমূহ (Cost Incurred per Haji):
                </h5>
                <div className="border border-stone-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-100 text-stone-600 font-bold">
                      <tr>
                        <th className="p-2.5">খাতের বিবরণ</th>
                        <th className="p-2.5 text-right">পরিমাণ (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {printPilgrim.expenses.map((e) => (
                        <tr key={e.id}>
                          <td className="p-2.5">{e.title}</td>
                          <td className="p-2.5 text-right font-bold text-stone-800">{formatBDT(e.amount)}</td>
                        </tr>
                      ))}
                      <tr className="bg-stone-50 font-black">
                        <td className="p-2.5 text-stone-900">মোট প্রতিজনে ব্যয়</td>
                        <td className="p-2.5 text-right text-rose-600">{formatBDT(printPilgrim.totalExpense)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-10 flex justify-between items-end text-xs text-stone-600">
                <div className="text-center">
                  <div className="w-36 border-b border-stone-400 mb-1"></div>
                  <span>হাজীর স্বাক্ষর</span>
                </div>
                <div className="text-center">
                  <div className="w-36 border-b border-stone-400 mb-1"></div>
                  <span>মুত্তাকী অ্যাকাউন্টস সিল ও স্বাক্ষর</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: হাজীর সম্পূর্ণ প্রোফাইল ও মানি রিসিট বিবরণী       */}
      {/* ======================================================== */}
      {profilePilgrim && (() => {
        const livePilgrim = hajiFinanceRecords.find((r) => r.id === profilePilgrim.id) || profilePilgrim;
        const liveInquiry = inquiries.find(
          (i) =>
            (livePilgrim.inquiryId && i.id === livePilgrim.inquiryId) ||
            (livePilgrim.registrationRef && i.registrationRef === livePilgrim.registrationRef) ||
            (livePilgrim.hajiUserId && i.hajiUserId === livePilgrim.hajiUserId) ||
            i.phone === livePilgrim.phone
        );
        const photoUrl = liveInquiry?.photoUrl || liveInquiry?.pilgrimPhoto || liveInquiry?.passportDocUrl;
        const pendingCount = livePilgrim.payments.filter((p) => p.status === 'pending').length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl border border-stone-200 my-8 max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-stone-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 shadow-xs">
                    {photoUrl ? (
                      <img src={photoUrl} alt={livePilgrim.hajiName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-stone-900 text-lg sm:text-xl">
                        {livePilgrim.hajiName}
                      </h3>
                      {(liveInquiry?.nameEn || liveInquiry?.englishName) && (
                        <span className="text-xs text-stone-500 font-semibold font-mono">
                          ({liveInquiry.nameEn || liveInquiry.englishName})
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          livePilgrim.hajiType === 'hajj'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {livePilgrim.hajiType === 'hajj' ? 'মূল হজ্ব' : 'ওমরাহ্ হজ্ব'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-500">
                      <span className="font-mono bg-stone-100 px-2 py-0.5 rounded font-bold text-stone-700 border border-stone-200">
                        আইডি: {liveInquiry?.hajiUserId || livePilgrim.hajiUserId || livePilgrim.registrationRef || livePilgrim.id}
                      </span>
                      <span>•</span>
                      <span>রেজিঃ {livePilgrim.registrationRef || 'প্রক্রিয়াধীন'}</span>
                      {liveInquiry?.selectedGroup && (
                        <>
                          <span>•</span>
                          <span className="text-stone-700 font-semibold">গ্রুপ: {liveInquiry.selectedGroup}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintPilgrim(livePilgrim)}
                    className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="প্রিন্ট বা PDF রসিদ"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">প্রিন্ট</span>
                  </button>
                  <button
                    onClick={() => setProfilePilgrim(null)}
                    className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 text-lg cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto pr-1 space-y-6 pt-4 flex-1">
                {/* 3-Card Financial Metrics */}
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-black text-stone-800 text-sm flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-emerald-700" />
                      <span>আর্থিক হিসাব ও জমার সার্বিক স্থিতি</span>
                    </h4>
                    <span className="text-[11px] text-stone-500 font-medium">
                      প্যাকেজ: <b className="text-stone-800">{livePilgrim.packageName}</b>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
                      <span className="text-[11px] text-stone-500 font-bold block mb-1">
                        ১. রেজিস্ট্রেশনকৃত টাকার পরিমাণ
                      </span>
                      <span className="text-lg sm:text-xl font-black text-[#0f2922]">
                        {formatBDT(livePilgrim.finalTotalAmount)}
                      </span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">চুক্তি অনুযায়ী মোট মূল্য</span>
                    </div>

                    <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
                      <span className="text-[11px] text-emerald-800 font-bold block mb-1">
                        ২. অনুমোদিত পরিশোধিত টাকা
                      </span>
                      <span className="text-lg sm:text-xl font-black text-emerald-700">
                        {formatBDT(livePilgrim.totalDeposited)}
                      </span>
                      <span className="text-[10px] text-emerald-600 block mt-0.5">অ্যাকাউন্টে গৃহীত মোট জমা</span>
                    </div>

                    <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 shadow-2xs">
                      <span className="text-[11px] text-rose-800 font-bold block mb-1">
                        ৩. অবশিষ্ট ডিউ টাকার পরিমাণ
                      </span>
                      <span className={`text-lg sm:text-xl font-black ${livePilgrim.dueAmount > 0 ? 'text-rose-600' : 'text-stone-500'}`}>
                        {formatBDT(livePilgrim.dueAmount)}
                      </span>
                      <span className="text-[10px] text-rose-600 block mt-0.5">পরিশোধের জন্য বাকি বকেয়া</span>
                    </div>
                  </div>

                  <div className="mt-3 text-center text-xs font-semibold text-stone-600 bg-white py-1.5 px-3 rounded-lg border border-stone-200">
                    হিসাব সূত্র: <span className="font-bold text-stone-900">{formatBDT(livePilgrim.finalTotalAmount)}</span> − <span className="font-bold text-emerald-700">{formatBDT(livePilgrim.totalDeposited)}</span> = <span className="font-extrabold text-rose-700">{formatBDT(livePilgrim.dueAmount)}</span>
                  </div>
                </div>

                {/* Pending Approval Notification Banner */}
                {pendingCount > 0 && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-center justify-between gap-3 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-700 shrink-0 animate-spin" />
                      <div>
                        <span className="font-extrabold block">
                          {pendingCount}টি পেমেন্ট জমা অনুমোদনের অপেক্ষায় রয়েছে!
                        </span>
                        <span className="text-[11px] text-amber-800">
                          হাজী পোর্টাল হতে জমা দেওয়া হয়েছে। নিচের তালিকা হতে মানি রিসিট দেখে অনুমোদন বা বাতিল করতে পারেন।
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pilgrim Information & Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic & Passport Information */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5 border-b border-stone-200 pb-2">
                      <User className="w-4 h-4 text-stone-600" />
                      <span>ব্যক্তিগত ও পাসপোর্ট তথ্য</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[11px]">পিতার নাম:</span>
                        <span className="font-semibold text-stone-800">
                          {liveInquiry?.fatherNameBn || 'উল্লেখ নেই'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">মাতার নাম:</span>
                        <span className="font-semibold text-stone-800">
                          {liveInquiry?.motherNameBn || 'উল্লেখ নেই'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">মোবাইল নম্বর:</span>
                        <a
                          href={`tel:${livePilgrim.phone}`}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          {livePilgrim.phone}
                        </a>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">পাসপোর্ট নম্বর:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {livePilgrim.passportNo || liveInquiry?.passportNo || 'প্রক্রিয়াধীন'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">জাতীয় পরিচয়পত্র (NID):</span>
                        <span className="font-mono text-stone-800">
                          {liveInquiry?.nidNo || liveInquiry?.passportOrNid || 'তথ্য নেই'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">পাসপোর্ট মেয়াদ:</span>
                        <span className="font-mono text-stone-800">
                          {liveInquiry?.passportExpiryDate || 'তথ্য নেই'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">জন্ম তারিখ:</span>
                        <span className="text-stone-800">
                          {liveInquiry?.dateOfBirth || 'তথ্য নেই'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">রক্তের গ্রুপ:</span>
                        <span className="font-bold text-rose-700">
                          {liveInquiry?.bloodGroup || 'তথ্য নেই'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-stone-400 block text-[11px]">স্থায়ী ঠিকানা:</span>
                        <span className="text-stone-800">
                          {liveInquiry?.permanentAddress || 'দুপচাঁচিয়া, বগুড়া'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Logistics & Accommodations */}
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5 border-b border-stone-200 pb-2">
                      <Building2 className="w-4 h-4 text-stone-600" />
                      <span>কাফেলা গ্রুপ, হোটেল ও ভ্রমণ তথ্য</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <span className="text-stone-400 block text-[11px]">রেজিস্ট্রেশন গ্রুপ:</span>
                        <span className="font-bold text-[#0f2922]">
                          {liveInquiry?.selectedGroup || extractItemGroup(livePilgrim, inquiries, kafelaGroups) || 'Group-DECEMBER 2026'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">রেজিস্ট্রেশন সাল:</span>
                        <span className="font-bold text-stone-800">
                          {extractItemYear(livePilgrim) || '২০২৬'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">মক্কা হোটেল রুম:</span>
                        <span className="text-stone-800 font-medium">
                          {liveInquiry?.roomPreference || '৪ সিট বিশিষ্ট শেয়ারিং রুম'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">মদিনা হোটেল রুম:</span>
                        <span className="text-stone-800 font-medium">
                          {liveInquiry?.roomPreference || '৪ সিট বিশিষ্ট শেয়ারিং রুম'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">এয়ারলাইন্স / টিকিট:</span>
                        <span className="text-stone-800 font-medium">
                          {liveInquiry?.airfareOption || 'সাউদিয়া এয়ারলাইন্স (প্রক্রিয়াধীন)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[11px]">জরুরি যোগাযোগ:</span>
                        <span className="text-stone-800">
                          {liveInquiry?.guardianPhone || liveInquiry?.alternatePhone || '০১৭৬৮-২৩২৫০১'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-stone-400 block text-[11px]">ইউজার পোর্টাল লগইন:</span>
                        <span className="font-mono text-[11px] bg-white px-2 py-1 rounded border border-stone-200 block mt-0.5 text-stone-700">
                          ইউজার আইডি: <b>{liveInquiry?.hajiUserId || livePilgrim.hajiUserId || 'নির্ধারিত'}</b> | পাসওয়ার্ড: <b>HajiPassword123!</b>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complete Deposit / Payment History & Receipts */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-black text-stone-900 text-sm sm:text-base flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-700" />
                        <span>জমা হওয়া কিস্তিসমূহ ও মানি রিসিট স্টেটমেন্ট</span>
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        হাজীর জমা দেওয়া প্রতিটি কিস্তির তারিখ, মাধ্যম, ভাউচার ও মানি রিসিট
                      </p>
                    </div>

                    {(canSubAdminAdd('finance') || canSubAdminEdit('finance')) && (
                      <button
                        type="button"
                        onClick={() => handleOpenPaymentModal(livePilgrim)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>পেমেন্ট জমা ও রসিদ যোগ</span>
                      </button>
                    )}
                  </div>

                  {livePilgrim.payments.length === 0 ? (
                    <div className="p-8 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-stone-400 space-y-2">
                      <Receipt className="w-8 h-8 text-stone-300 mx-auto" />
                      <p>এই হাজীর নামে এখনো কোনো কিস্তির টাকা জমা রেকর্ড করা হয়নি।</p>
                      <button
                        onClick={() => handleOpenPaymentModal(livePilgrim)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>প্রথম কিস্তি জমা নিন</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {livePilgrim.payments.map((pmt, idx) => (
                        <div
                          key={pmt.id}
                          className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-stone-900 text-xs sm:text-sm">
                                  {pmt.date}
                                </span>
                                <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded text-[11px] font-bold border border-stone-200 uppercase">
                                  {pmt.method}
                                </span>
                                {pmt.voucherNo && (
                                  <span className="font-mono text-stone-600 text-[11px]">
                                    ভাউচার: <b>{pmt.voucherNo}</b>
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    pmt.status === 'pending'
                                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                                      : pmt.status === 'rejected'
                                      ? 'bg-rose-100 text-rose-800 border-rose-300 line-through'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {pmt.status === 'pending'
                                    ? 'অনুমোদনের অপেক্ষায়'
                                    : pmt.status === 'rejected'
                                    ? 'বাতিল'
                                    : 'অনুমোদিত'}
                                </span>
                                {pmt.submittedBy === 'haji' && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                                    হাজী পোর্টাল হতে দাখিলকৃত
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-2">
                                {pmt.receivedBy && <span>গ্রহীতা: {pmt.receivedBy}</span>}
                                {pmt.note && <span className="text-stone-400 italic">({pmt.note})</span>}
                                {pmt.rejectionReason && (
                                  <span className="text-rose-600 font-medium">কারণ: {pmt.rejectionReason}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                            <span
                              className={`font-black text-base ${
                                pmt.status === 'pending'
                                  ? 'text-amber-700'
                                  : pmt.status === 'rejected'
                                  ? 'text-stone-400 line-through'
                                  : 'text-emerald-700'
                              }`}
                            >
                              +{formatBDT(pmt.amount)}
                            </span>

                            {pmt.receiptDataUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReceiptViewer({
                                    url: pmt.receiptDataUrl!,
                                    fileName: pmt.receiptFileName,
                                    title: `${livePilgrim.hajiName} - মানি রিসিট (${pmt.voucherNo || pmt.date})`,
                                    amount: pmt.amount,
                                    date: pmt.date
                                  })
                                }
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold border border-amber-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                                title="মানি রিসিট বড় করে দেখুন"
                              >
                                <Eye className="w-3.5 h-3.5 text-amber-700" />
                                <span>মানি রিসিট</span>
                              </button>
                            )}

                            {pmt.status === 'pending' && canSubAdminEdit('finance') && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => approvePilgrimPayment(livePilgrim.id, pmt.id)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                  title="পেমেন্ট অনুমোদন করুন"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>অনুমোদন</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt('বাতিলের কারণ লিখুন (ঐচ্ছিক):') || undefined;
                                    rejectPilgrimPayment(livePilgrim.id, pmt.id, reason);
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-rose-200"
                                  title="পেমেন্ট বাতিল করুন"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>বাতিল</span>
                                </button>
                              </div>
                            )}

                            {!isSubAdmin && (
                              <button
                                onClick={() => {
                                  requestConfirm({
                                    title: 'পেমেন্ট ভাউচার মুছবেন?',
                                    message: `৳${pmt.amount} টাকার এই পেমেন্ট ভাউচারটি কি নিশ্চিতভাবে ডিলিট করবেন?`,
                                    onConfirm: () => deletePilgrimPayment(livePilgrim.id, pmt.id)
                                  });
                                }}
                                className="p-1.5 text-stone-300 hover:text-rose-500 cursor-pointer transition-colors rounded-lg"
                                title="ভাউচার বাতিল"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-stone-100 flex justify-between items-center shrink-0">
                <span className="text-xs text-stone-400">
                  মুত্তাকী কাফেলা ক্লাউড ডাটাবেজ • সার্বক্ষণিক সিঙ্ক
                </span>
                <button
                  type="button"
                  onClick={() => setProfilePilgrim(null)}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* MODAL 5: মানি রিসিট বড় করে দেখার লাইটবক্স (Receipt Lightbox) */}
      {/* ======================================================== */}
      {receiptViewer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Lightbox Header */}
            <div className="p-4 sm:p-5 bg-stone-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[#DCB473]/20 text-[#DCB473] flex items-center justify-center font-bold shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-sm text-white truncate">{receiptViewer.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-stone-300">
                    {receiptViewer.amount && <span>পরিমাণ: ৳{receiptViewer.amount.toLocaleString('en-IN')}</span>}
                    {receiptViewer.date && <span>• তারিখ: {receiptViewer.date}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={receiptViewer.url}
                  download={receiptViewer.fileName || 'money-receipt'}
                  className="px-3 py-1.5 bg-[#DCB473] hover:bg-[#c99f5e] text-stone-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড</span>
                </a>
                <button
                  type="button"
                  onClick={() => setReceiptViewer(null)}
                  className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lightbox Content */}
            <div className="p-4 sm:p-6 bg-stone-100 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
              {receiptViewer.url.startsWith('data:application/pdf') ? (
                <iframe
                  src={receiptViewer.url}
                  className="w-full h-[65vh] rounded-xl border border-stone-300 bg-white shadow-sm"
                  title={receiptViewer.title}
                />
              ) : (
                <div className="max-h-[70vh] flex items-center justify-center">
                  <img
                    src={receiptViewer.url}
                    alt={receiptViewer.title}
                    className="max-h-[70vh] max-w-full object-contain rounded-xl border border-stone-300 shadow-md bg-white"
                  />
                </div>
              )}
            </div>

            {/* Lightbox Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 text-center text-xs text-stone-500 shrink-0">
              মুত্তাকী হজ্ব ও কন্সাল্টেন্সি • ডিজিটাল মানি রিসিট ভিউয়ার
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
