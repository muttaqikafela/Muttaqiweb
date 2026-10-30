import React, { useState, useMemo } from 'react';
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
  Lock
} from 'lucide-react';

export const AdminFinanceManager: React.FC = () => {
  const {
    hajiFinanceRecords,
    officeExpenses,
    inquiries,
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
    requestConfirm,
    showToast,
    isSubAdmin,
    canEdit,
    activeSubAdmin
  } = useAdmin();

  // Sub-tabs
  type FinanceTab = 'overview' | 'hajj' | 'umrah' | 'office';
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'partial' | 'due'>('all');
  const [officeFilterType, setOfficeFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Expanded pilgrim row for expense and payment details
  const [expandedPilgrimId, setExpandedPilgrimId] = useState<string | null>(null);

  // Payment Modal state
  const [paymentModalHaji, setPaymentModalHaji] = useState<HajiFinanceRecord | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentDateInput, setPaymentDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>('bank');
  const [paymentVoucherInput, setPaymentVoucherInput] = useState<string>('');
  const [paymentReceivedByInput, setPaymentReceivedByInput] = useState<string>('মুত্তাকী ক্যাশিয়ার');
  const [paymentNoteInput, setPaymentNoteInput] = useState<string>('');

  // Edit Expense Modal state
  const [expenseModalHaji, setExpenseModalHaji] = useState<HajiFinanceRecord | null>(null);
  const [editedExpenses, setEditedExpenses] = useState<PilgrimExpenseItem[]>([]);

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
      if (yearFilter !== 'all' && !rec.yearSeason.includes(yearFilter)) return false;
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
      if (yearFilter !== 'all' && !rec.yearSeason.includes(yearFilter)) return false;
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

  const filteredOfficeExpenses = useMemo(() => {
    return officeExpenses.filter((exp) => {
      if (yearFilter !== 'all' && exp.yearSeason && !exp.yearSeason.includes(yearFilter)) return false;
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

  // Open Payment Modal
  const handleOpenPaymentModal = (record: HajiFinanceRecord) => {
    setPaymentModalHaji(record);
    setPaymentAmountInput(record.dueAmount > 0 ? record.dueAmount : 0);
    setPaymentDateInput(new Date().toISOString().split('T')[0]);
    setPaymentMethodInput('bank');
    setPaymentVoucherInput(`TRX-${Math.floor(1000 + Math.random() * 9000)}`);
    setPaymentReceivedByInput('মুত্তাকী ক্যাশিয়ার');
    setPaymentNoteInput('');
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
      note: paymentNoteInput
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

    addOfficeExpense({
      title: officeExpTitle,
      entryType: officeEntryType,
      category: officeExpCategory,
      amount: officeExpAmount,
      date: officeExpDate,
      expenseType: officeExpType,
      yearSeason: yearFilter !== 'all' ? yearFilter : '২০২৬',
      paidBy: officeExpPayer,
      voucherNo: officeExpVoucher || `VCH-${officeEntryType === 'income' ? 'INC' : 'EXP'}-${Math.floor(1000 + Math.random() * 9000)}`,
      note: officeExpNote
    });

    setIsOfficeExpModalOpen(false);
    setOfficeExpTitle('');
    setOfficeExpAmount(0);
    setOfficeExpVoucher('');
    setOfficeExpNote('');
    setOfficeEntryType('expense');
    showToast(`${officeEntryType === 'income' ? 'অন্যান্য আয়' : 'পরিচালন ব্যয়'} সফলভাবে সংরক্ষিত হয়েছে!`);
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
            {!isSubAdmin ? (
              <>
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

                <button
                  onClick={() => setIsAddPilgrimModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#DCB473] to-[#C99C53] hover:from-[#c99c53] hover:to-[#b88c42] text-[#0f2922] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন হাজী হিসাব</span>
                </button>

                <button
                  onClick={() => {
                    setOfficeEntryType('expense');
                    setIsOfficeExpModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-[#DCB473]" />
                  <span>অন্যান্য আয় / ব্যয় যোগ</span>
                </button>
              </>
            ) : (
              <span className="px-3.5 py-2 bg-amber-500/20 text-amber-200 border border-amber-400/40 font-bold rounded-xl text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>সাব-এডমিন (হিসাব রিড-অনলি মোড)</span>
              </span>
            )}

          </div>
        </div>
      </div>

      {/* 4 Core Financial Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: মূল হজ (Main Hajj) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200 hover:border-amber-400/50 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 text-amber-800" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
              মূল হজ ({summary.totalHajjPilgrims} জন)
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-stone-500 font-medium block">মোট জমা টাকা</span>
            <div className="text-xl sm:text-2xl font-black text-stone-900">
              {formatBDT(summary.hajjTotalDeposited)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-stone-400 block">মোট ব্যয়:</span>
              <span className="font-bold text-rose-600">{formatBDT(summary.hajjTotalExpense)}</span>
            </div>
            <div>
              <span className="text-stone-400 block">নিট লাভ:</span>
              <span className={`font-bold ${summary.hajjNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatBDT(summary.hajjNetProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: ওমরাহ্ হজ (Umrah) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200 hover:border-emerald-400/50 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-emerald-800" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
              ওমরাহ্ হজ ({summary.totalUmrahPilgrims} জন)
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-stone-500 font-medium block">মোট জমা টাকা</span>
            <div className="text-xl sm:text-2xl font-black text-stone-900">
              {formatBDT(summary.umrahTotalDeposited)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-stone-400 block">মোট ব্যয়:</span>
              <span className="font-bold text-rose-600">{formatBDT(summary.umrahTotalExpense)}</span>
            </div>
            <div>
              <span className="text-stone-400 block">নিট লাভ:</span>
              <span className={`font-bold ${summary.umrahNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatBDT(summary.umrahNetProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: অন্যান্য আয় ও পরিচালন ব্যয় (Other Income & Expenses) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200 hover:border-blue-400/50 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-800 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-blue-800" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
              অন্যান্য আয় ও ব্যয় ({officeExpenses.length})
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-stone-500 font-medium block">অন্যান্য পরিচালন ব্যয়</span>
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              {formatBDT(summary.totalOfficeExpense)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-stone-400 block">অন্যান্য আয়:</span>
              <span className="font-bold text-emerald-700">{formatBDT(summary.totalOtherIncome)}</span>
            </div>
            <div>
              <span className="text-stone-400 block">নিট স্থিতি:</span>
              <span className={`font-bold ${summary.netOtherBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatBDT(summary.netOtherBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: সার্বিক নিট লাভ / ক্ষতি ও মার্জিন (Grand Net Balance) */}
        <div className={`p-5 rounded-2xl shadow-xs border text-white transition-all ${
          summary.grandNetProfit >= 0
            ? 'bg-gradient-to-br from-[#0b3328] to-[#124d3d] border-emerald-500/40'
            : 'bg-gradient-to-br from-rose-900 to-rose-950 border-rose-500/40'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-[#DCB473]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full text-white">
              সার্বিক নিট লাভ
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-emerald-100 font-medium block">সর্বমোট আয় থেকে সর্বমোট খরচ বাদ</span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {formatBDT(summary.grandNetProfit)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-[11px]">
            <span className="text-stone-200">মোট আয়: {formatBDT(summary.grandTotalIncome)}</span>
            <span className="font-extrabold text-[#DCB473] bg-black/20 px-2 py-0.5 rounded-md">
              মার্জিন {summary.overallProfitMargin}%
            </span>
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
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as FinanceTab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
        {(activeTab === 'hajj' || activeTab === 'umrah' || activeTab === 'office') && (
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="হাজীর নাম, মোবাইল, পাসপোর্ট নং বা ভাউচার দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-[#0f2922] bg-stone-50"
              />
            </div>

            {activeTab !== 'office' && (
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

      {/* ======================================================== */}
      {/* SUB-TAB 1: সার্বিক ব্যালেন্স শিট (Grand Balance Sheet)    */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Complete Financial Overview Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200">
              <div>
                <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-[#DCB473]" />
                  <span>মুত্তাকী কাফেলা সার্বিক আয় ও ব্যয় বিবরণী (Balance Sheet)</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  মূল হজ, ওমরাহ্ এবং অফিস পরিচালনার সম্মিলিত আর্থিক স্থিতি
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>স্টেটমেন্ট প্রিন্ট করুন</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: মোট আয় ও প্রাপ্তি (Inflow / Income) */}
              <div className="bg-stone-50/80 p-5 rounded-2xl border border-stone-200 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-sm">
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    <span>মোট সংগৃহীত আয় ও প্রাপ্তি (Total Income & Inflows)</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {summary.totalPilgrims} জন যাত্রী + অন্যান্য খাত
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-600">মূল হজ যাত্রীদের থেকে প্রাপ্ত জমা:</span>
                    <span className="font-bold text-stone-900">{formatBDT(summary.hajjTotalDeposited)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-stone-600">ওমরাহ্ হজ যাত্রীদের থেকে প্রাপ্ত জমা:</span>
                    <span className="font-bold text-stone-900">{formatBDT(summary.umrahTotalDeposited)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                    <span className="text-emerald-900 font-medium">অন্যান্য সকল খাত থেকে আয় (সার্ভিস ফি, কনসালটেন্সি, কমিশন):</span>
                    <span className="font-bold text-emerald-700">+{formatBDT(summary.totalOtherIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                    <span>হাজীদের কাছে মোট বকেয়া টাকা (Due):</span>
                    <span className="font-bold">{formatBDT(summary.hajjTotalDue + summary.umrahTotalDue)}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-300 flex justify-between items-center font-bold text-stone-900 text-base">
                  <span>সর্বমোট অর্জিত আয় (Gross Total Income):</span>
                  <span className="text-emerald-700 font-extrabold text-lg">{formatBDT(summary.grandTotalIncome)}</span>
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

          {/* Pilgrims Table / Cards */}
          {(activeTab === 'hajj' ? filteredHajjRecords : filteredUmrahRecords).length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-stone-300 mx-auto" />
              <h4 className="font-bold text-stone-700">কোনো রেকর্ড পাওয়া যায়নি</h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                এই ফিল্টারে কোনো যাত্রী পাওয়া যায়নি।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(activeTab === 'hajj' ? filteredHajjRecords : filteredUmrahRecords).map((record) => {
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
                            <h4 className="font-extrabold text-stone-900 text-base">
                              {record.hajiName}
                            </h4>
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

                      {/* Middle: Financial Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-right bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                        <div>
                          <span className="text-[10px] text-stone-400 block">চুক্তি মূল্য</span>
                          <span className="font-bold text-stone-900 text-xs sm:text-sm">
                            {formatBDT(record.finalTotalAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">মোট জমা</span>
                          <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                            {formatBDT(record.totalDeposited)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">বকেয়া</span>
                          <span className={`font-bold text-xs sm:text-sm ${record.dueAmount > 0 ? 'text-rose-600' : 'text-stone-400'}`}>
                            {formatBDT(record.dueAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">ব্যয় / নিট লাভ</span>
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
                        {!isSubAdmin && (
                          <button
                            onClick={() => handleOpenPaymentModal(record)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="টাকা জমা নিন / পেমেন্ট এন্ট্রি"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>পেমেন্ট জমা</span>
                          </button>
                        )}

                        {!isSubAdmin && (
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

                        {!isSubAdmin && (
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
                              মোট জমা: <span className="text-emerald-700 font-extrabold">{formatBDT(record.totalDeposited)}</span>
                            </span>
                          </div>

                          {record.payments.length === 0 ? (
                            <div className="bg-white p-3 rounded-xl border border-stone-200 text-center text-xs text-stone-400">
                              এখনো কোনো টাকা জমা করা হয়নি।
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {record.payments.map((pmt) => (
                                <div
                                  key={pmt.id}
                                  className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs flex flex-wrap items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-stone-800">{pmt.date}</span>
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-semibold text-[11px] border border-emerald-200">
                                      {pmt.method.toUpperCase()}
                                    </span>
                                    {pmt.voucherNo && (
                                      <span className="font-mono text-stone-500 text-[11px]">
                                        ভাউচার: <b>{pmt.voucherNo}</b>
                                      </span>
                                    )}
                                    {pmt.note && <span className="text-stone-400 text-[11px] italic">({pmt.note})</span>}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <span className="font-black text-emerald-700 text-sm">
                                      +{formatBDT(pmt.amount)}
                                    </span>
                                    {!isSubAdmin && (
                                      <button
                                        onClick={() => {
                                          requestConfirm({
                                            title: 'পেমেন্ট ভাউচার মুছবেন?',
                                            message: `৳${pmt.amount} টাকার এই পেমেন্ট ভাউচারটি কি নিশ্চিতভাবে ডিলিট করবেন?`,
                                            onConfirm: () => deletePilgrimPayment(record.id, pmt.id)
                                          });
                                        }}
                                        className="text-stone-300 hover:text-rose-500 cursor-pointer transition-colors"
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
                            {!isSubAdmin ? (
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
                    {officeEntryType === 'income' ? 'নতুন আয় যুক্ত করুন' : 'নতুন পরিচালন ব্যয় যুক্ত করুন'}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {officeEntryType === 'income'
                      ? 'সার্ভিস চার্জ, কনসালটেন্সি ফি, কমিশন বা অনুদান'
                      : 'ভাড়া, বেতন, ইউটিলিটি, লাইসেন্স বা প্রচারণা খরচ'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOfficeExpModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOfficeExpense} className="space-y-3.5">
              {/* Income vs Expense Toggle */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">এন্ট্রির ধরণ নির্ধারণ *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOfficeEntryType('income');
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
                    onChange={(e) => setOfficeExpType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-stone-50"
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
                  onClick={() => setIsOfficeExpModalOpen(false)}
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

              {/* Financial Box */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-stone-500 block">মোট চুক্তি মূল্য</span>
                  <span className="font-black text-stone-900 text-sm">
                    {formatBDT(printPilgrim.finalTotalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">মোট জমা টাকা</span>
                  <span className="font-black text-emerald-700 text-sm">
                    {formatBDT(printPilgrim.totalDeposited)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">বকেয়া টাকা</span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatBDT(printPilgrim.dueAmount)}
                  </span>
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
    </div>
  );
};
