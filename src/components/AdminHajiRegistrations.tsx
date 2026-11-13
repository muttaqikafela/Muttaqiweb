import React, { useState, useMemo } from 'react';
import { InquiryItem, KafelaGroup } from '../types';
import { useAdmin } from '../context/AdminContext';
import {
  getAllGroupsOccupancy,
  matchesKafelaGroupFilter,
  MAX_PILGRIMS_PER_GROUP
} from '../data/kafelaGroups';
import { HajiIdCard } from './HajiIdCard';
import {
  Compass,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  Calendar,
  Shield,
  FileText,
  Link as LinkIcon,
  Users,
  Search,
  Filter,
  Check,
  X,
  Trash2,
  Edit,
  Edit3,
  Plus,
  Printer,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Lock,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  FileCheck,
  Sparkles,
  Download,
  BadgePercent,
  Calculator,
  Receipt,
  ChevronRight,
  ArrowLeft,
  Layers,
  FolderOpen
} from 'lucide-react';
import {
  extractItemType,
  extractItemYear,
  extractItemGroup,
  normalizeBengaliYear
} from '../utils/drillDownHelpers';

interface AdminHajiRegistrationsProps {
  onOpenHajiForm?: () => void;
}

const formatBDT = (amount: number): string => `৳ ${Math.round(amount || 0).toLocaleString('en-IN')}`;

export const AdminHajiRegistrations: React.FC<AdminHajiRegistrationsProps> = () => {
  const {
    inquiries,
    hajiFinanceRecords,
    updateInquiryStatus,
    deleteInquiry,
    openInquiryModal,
    requestConfirm,
    showToast,
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
    isSubAdmin,
    canEdit,
    activeSubAdmin,
    hasPermission,
    canSubAdminAdd,
    canSubAdminEdit,
    canSubAdminDelete,
    getSubAdminModuleRole
  } = useAdmin();

  const [companionSelectMap, setCompanionSelectMap] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState<'all' | 'hajj' | 'umrah'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'contacted' | 'rejected'>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  // 4-Level Drill-Down System (ব্যবহারকারীর চাহিদা অনুযায়ী ধাপভিত্তিক নেভিগেশন):
  // ধাপ ১: হজের ধরন (১। মূল হজ / ২। ওমরাহ্ হজ)
  // ধাপ ২: হাজির রেজিস্ট্রেশনের সাল (যেমন: ২০২৬ সাল)
  // ধাপ ৩: রেজিস্ট্রেশনকৃত কাফেলা গ্রুপ (যেমন: Group-DECEMBER 2026)
  // ধাপ ৪: সেই গ্রুপে রেজিস্ট্রেশনকৃত হাজীদের তালিকা ও লেজার
  const [drillType, setDrillType] = useState<'hajj' | 'umrah' | null>(null);
  const [drillYear, setDrillYear] = useState<string | null>(null);
  const [drillGroup, setDrillGroup] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'drill' | 'flat'>('drill');

  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; hajiName: string } | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [printHaji, setPrintHaji] = useState<InquiryItem | null>(null);
  const [idCardHaji, setIdCardHaji] = useState<InquiryItem | null>(null);
  const [selectedProfileHaji, setSelectedProfileHaji] = useState<InquiryItem | null>(null);

  const activeProfileHaji = useMemo(() => {
    if (!selectedProfileHaji) return null;
    return inquiries.find((i) => i.id === selectedProfileHaji.id) || selectedProfileHaji;
  }, [selectedProfileHaji, inquiries]);

  // Discount Modal State
  const [discountHaji, setDiscountHaji] = useState<InquiryItem | null>(null);
  const [discountPercentInput, setDiscountPercentInput] = useState<number>(0);
  const [discountNoteInput, setDiscountNoteInput] = useState<string>('');

  // Group Management Modal State (এডমিন ইচ্ছামত গ্রুপ বাড়ানো ও কমানোর সুবিধা)
  const [groupModalOpen, setGroupModalOpen] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<KafelaGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    leader: '',
    maxCapacity: 50,
    category: 'হজ্ব ও ওমরাহ',
    departureDate: ''
  });

  // Groups Occupancy calculations (প্রকৃত রেজিস্টার্ড হাজীদের ভিত্তিতে গতিশীল হিসাব)
  const groupsOccupancy = useMemo(
    () => getAllGroupsOccupancy(kafelaGroups, inquiries),
    [kafelaGroups, inquiries]
  );

  const groupsOccupancyMap = useMemo(() => {
    const map: Record<string, number> = {};
    groupsOccupancy.forEach((item) => {
      map[item.group.name] = item.currentCount;
      map[item.group.id] = item.currentCount;
    });
    return map;
  }, [groupsOccupancy]);

  // Filter only Haji & Umrah Registrations (নিশ্চিত করা যে কোনো হাজী আবেদন মিস হবে না)
  const hajiList = useMemo(() => {
    const list = inquiries.filter(
      (inq) =>
        inq.registrationType === 'haji' ||
        inq.registrationType === 'umrah' ||
        inq.serviceId === 'haji-full-registration' ||
        inq.serviceId === 'hajj-umrah' ||
        /ওমরা|উমরা|umrah|হজ/i.test(`${inq.serviceName || ''} ${inq.serviceId || ''}`) ||
        !!inq.hajiUserId ||
        (!!inq.registrationRef && (inq.registrationRef.startsWith('HAJI-') || inq.registrationRef.startsWith('UMD') || inq.registrationRef.startsWith('MUT-')))
    );
    // পেন্ডিং আবেদনসমূহ সবার শীর্ষে দেখানো যাতে এডমিনের চোখে সহজে পড়ে
    return [...list].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return 0;
    });
  }, [inquiries]);

  const getRegistrationType = (haji: InquiryItem): 'hajj' | 'umrah' => {
    if (haji.registrationType === 'umrah') return 'umrah';
    const packageLabel = `${haji.serviceName || ''} ${haji.serviceId || ''}`.toLocaleLowerCase();
    if (/ওমরা|উমরা|umrah|omrah/i.test(packageLabel) || haji.serviceId === 'hajj-umrah') return 'umrah';
    if (/মূল\s*হজ|হজ্জ|হজ্ব/i.test(packageLabel) || haji.registrationType === 'haji') return 'hajj';
    const linkedFinance = hajiFinanceRecords.find(
      (record) =>
        (record.inquiryId && record.inquiryId === haji.id) ||
        (record.registrationRef && haji.registrationRef && record.registrationRef === haji.registrationRef)
    );
    return linkedFinance?.hajiType || 'hajj';
  };
  const hajjRegistrationCount = hajiList.filter((haji) => getRegistrationType(haji) === 'hajj').length;
  const umrahRegistrationCount = hajiList.filter((haji) => getRegistrationType(haji) === 'umrah').length;

  // Statistics
  const totalCount = hajiList.length;
  const pendingCount = hajiList.filter((h) => h.status === 'pending').length;
  const approvedCount = hajiList.filter((h) => h.status === 'approved').length;
  const contactedCount = hajiList.filter((h) => h.status === 'contacted').length;
  const rejectedCount = hajiList.filter((h) => h.status === 'rejected').length;

  // Available Registration Years for chosen drillType (Level 2)
  const availableDrillYears = useMemo(() => {
    if (!drillType) return [];
    const list = hajiList.filter((h) => getRegistrationType(h) === drillType);
    const yearCounts = new Map<string, number>();
    list.forEach((h) => {
      const yr = extractItemYear(h);
      yearCounts.set(yr, (yearCounts.get(yr) || 0) + 1);
    });
    // Ensure active season year '২০২৬' is always visible
    if (!yearCounts.has('২০২৬')) {
      yearCounts.set('২০২৬', 0);
    }
    return Array.from(yearCounts.entries()).map(([year, count]) => ({
      year,
      count
    }));
  }, [hajiList, drillType]);

  // Available Registered Groups for chosen drillType & drillYear (Level 3)
  const availableDrillGroups = useMemo(() => {
    if (!drillType || !drillYear) return [];
    const list = hajiList.filter((h) => {
      if (getRegistrationType(h) !== drillType) return false;
      const yr = extractItemYear(h);
      return yr === drillYear;
    });

    const groupMap = new Map<string, InquiryItem[]>();
    list.forEach((h) => {
      const grp = extractItemGroup(h, inquiries, kafelaGroups);
      if (!groupMap.has(grp)) groupMap.set(grp, []);
      groupMap.get(grp)!.push(h);
    });

    // Also include default kafela groups
    kafelaGroups.forEach((g) => {
      if (!groupMap.has(g.name)) {
        groupMap.set(g.name, []);
      }
    });

    return Array.from(groupMap.entries()).map(([groupName, pilgrims]) => {
      const matchingKafelaGroup = kafelaGroups.find((g) => g.name.toLowerCase() === groupName.toLowerCase());
      return {
        groupName,
        pilgrims,
        count: pilgrims.length,
        leader: matchingKafelaGroup?.leader || 'প্রধান মোয়াল্লেম / কাফেলা পরিচালক',
        maxCapacity: matchingKafelaGroup?.maxCapacity || 50,
        departureDate: matchingKafelaGroup?.departureDate || (drillType === 'umrah' ? 'ডিসেম্বর ২০২৬' : 'জিলহজ ১৪৪৭ হি.')
      };
    }).sort((a, b) => b.count - a.count);
  }, [hajiList, drillType, drillYear, inquiries, kafelaGroups]);

  // Filtered List based on search, drill-down and filters
  const filteredHajis = useMemo(() => {
    return hajiList.filter((haji) => {
      // Drill-down hierarchical enforcement
      if (viewMode === 'drill') {
        if (drillType && getRegistrationType(haji) !== drillType) return false;
        if (drillYear && extractItemYear(haji) !== drillYear) return false;
        if (drillGroup && extractItemGroup(haji, inquiries, kafelaGroups) !== drillGroup) return false;
      } else {
        if (registrationTypeFilter !== 'all' && getRegistrationType(haji) !== registrationTypeFilter) {
          return false;
        }
        // Group filter
        if (groupFilter !== 'all') {
          if (groupFilter === 'unassigned') {
            if (haji.selectedGroup && haji.selectedGroup.trim() !== '') return false;
          } else if (!matchesKafelaGroupFilter(haji, groupFilter, kafelaGroups)) {
            return false;
          }
        }
      }
      // Status filter
      if (statusFilter !== 'all' && haji.status !== statusFilter) {
        return false;
      }
      // Package filter
      if (packageFilter !== 'all' && haji.serviceName !== packageFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = (haji.nameBn || haji.name || '').toLowerCase().includes(query);
        const matchesNameEn = (haji.nameEn || '').toLowerCase().includes(query);
        const matchesPhone = (haji.phone || '').toLowerCase().includes(query);
        const matchesRef = (haji.registrationRef || '').toLowerCase().includes(query);
        const matchesUserId = (haji.hajiUserId || '').toLowerCase().includes(query);
        const matchesNid = (haji.nidNo || '').toLowerCase().includes(query);
        const matchesPassport = (haji.passportNo || '').toLowerCase().includes(query);
        const matchesAddress = (haji.presentAddress || '').toLowerCase().includes(query);

        return (
          matchesName ||
          matchesNameEn ||
          matchesPhone ||
          matchesRef ||
          matchesUserId ||
          matchesNid ||
          matchesPassport ||
          matchesAddress
        );
      }
      return true;
    });
  }, [
    hajiList,
    viewMode,
    drillType,
    drillYear,
    drillGroup,
    inquiries,
    kafelaGroups,
    registrationTypeFilter,
    statusFilter,
    packageFilter,
    groupFilter,
    searchTerm
  ]);

  // Financial summary for selected drillGroup
  const currentDrillGroupSummary = useMemo(() => {
    if (!drillType || !drillYear || !drillGroup) return null;
    const pilgrims = hajiList.filter((h) => {
      if (getRegistrationType(h) !== drillType) return false;
      if (extractItemYear(h) !== drillYear) return false;
      return extractItemGroup(h, inquiries, kafelaGroups) === drillGroup;
    });

    let totalContract = 0;
    let totalDeposited = 0;

    pilgrims.forEach((haji) => {
      const linkedFinance = hajiFinanceRecords.find(
        (rec) =>
          (rec.inquiryId && rec.inquiryId === haji.id) ||
          (rec.registrationRef && haji.registrationRef && rec.registrationRef === haji.registrationRef) ||
          (rec.phone && haji.phone && rec.phone === haji.phone)
      );
      const defaultBase = drillType === 'umrah' ? 123500 : 650000;
      const contract = haji.finalTotalAmount || haji.subtotalAmount || linkedFinance?.finalTotalAmount || defaultBase;
      const paid = haji.paidAmount !== undefined ? haji.paidAmount : (linkedFinance?.totalDeposited || 0);
      totalContract += contract;
      totalDeposited += paid;
    });

    const totalDue = Math.max(0, totalContract - totalDeposited);

    return {
      count: pilgrims.length,
      totalContract,
      totalDeposited,
      totalDue
    };
  }, [hajiList, drillType, drillYear, drillGroup, inquiries, kafelaGroups, hajiFinanceRecords]);

  // Distinct packages for filter dropdown
  const packageOptions = useMemo(() => {
    const set = new Set<string>();
    hajiList.forEach((h) => {
      if (h.serviceName) set.add(h.serviceName);
    });
    return Array.from(set);
  }, [hajiList]);

  // Handle Approve
  const handleApprove = (haji: InquiryItem) => {
    updateInquiryStatus(haji.id, 'approved', 'কাফেলা এডমিন কর্তৃক অনুমোদিত');
  };

  // Handle Delete
  const handleDelete = (haji: InquiryItem) => {
    requestConfirm({
      title: 'হাজী নিবন্ধন আবেদন বাতিল ও মুছে ফেলা',
      message: `আপনি কি নিশ্চিতভাবে "${haji.nameBn || haji.name}" এর নিবন্ধন আবেদনটি সম্পূর্ণ মুছে ফেলতে চান? এটি পুনরুদ্ধার করা যাবে না।`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => {
        deleteInquiry(haji.id);
      }
    });
  };

  // Toggle Password visibility
  const togglePassword = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy text helper
  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      showToast(`${label} ক্লিপবোর্ডে কপি করা হয়েছে!`);
    } catch {
      showToast(`${label}: ${text}`);
    }
  };

  // Kafela Group Action Handlers
  const handleOpenAddGroup = () => {
    const nextLetter = String.fromCharCode(65 + (kafelaGroups.length % 26));
    setEditingGroup(null);
    setGroupFormData({
      name: `Group-${nextLetter}`,
      leader: '',
      maxCapacity: 50,
      category: 'হজ্ব ও ওমরাহ',
      departureDate: ''
    });
    setGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: KafelaGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      leader: group.leader || '',
      maxCapacity: group.maxCapacity || 50,
      category: group.category || 'হজ্ব ও ওমরাহ',
      departureDate: group.departureDate || ''
    });
    setGroupModalOpen(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = groupFormData.name.trim();
    if (!cleanName) {
      showToast('অনুগ্রহ করে গ্রুপের নাম প্রদান করুন!');
      return;
    }
    const cap = Math.max(1, Number(groupFormData.maxCapacity) || 50);

    if (editingGroup) {
      updateKafelaGroup({
        ...editingGroup,
        name: cleanName,
        leader: groupFormData.leader.trim() || 'নির্ধারিত হয়নি',
        maxCapacity: cap,
        category: groupFormData.category,
        departureDate: groupFormData.departureDate.trim() || undefined
      });
    } else {
      addKafelaGroup({
        name: cleanName,
        leader: groupFormData.leader.trim() || 'নির্ধারিত হয়নি',
        maxCapacity: cap,
        type: 'both',
        category: groupFormData.category,
        departureDate: groupFormData.departureDate.trim() || undefined,
        departureMonth: `কাফেলা গ্রুপ (${cleanName})`
      });
    }
    setGroupModalOpen(false);
  };

  const handleDeleteGroup = (group: KafelaGroup) => {
    const registeredInGroup = inquiries.filter(
      (inq) =>
        (inq.registrationType === 'haji' || inq.serviceId === 'haji-full-registration') &&
        (inq.selectedGroup || '').toLowerCase() === group.name.toLowerCase()
    ).length;

    requestConfirm({
      title: 'কাফেলা গ্রুপ মুছে ফেলা',
      message: registeredInGroup > 0
        ? `সতর্কতা: "${group.name}" গ্রুপে বর্তমানে ${registeredInGroup} জন হজযাত্রী নিবন্ধিত আছেন! আপনি কি নিশ্চিতভাবে এই গ্রুপটি মুছে ফেলতে চান?`
        : `আপনি কি নিশ্চিতভাবে "${group.name}" গ্রুপটি তালিকা থেকে মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, গ্রুপ মুছুন',
      onConfirm: () => {
        deleteKafelaGroup(group.id);
        if (groupFilter === group.name) {
          setGroupFilter('all');
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Summary Stats */}
      <div className="bg-gradient-to-r from-[#0b1f1a] via-[#12362c] to-[#0f2922] text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DCB473]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DCB473] bg-[#DCB473]/20 px-3 py-1 rounded-full border border-[#DCB473]/40">
                কেন্দ্রীয় ডাটাবেজ
              </span>
              {pendingCount > 0 && (
                <span className="text-xs font-bold text-amber-200 bg-amber-500/30 px-3 py-1 rounded-full border border-amber-400/50 flex items-center gap-1 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{pendingCount} টি অপেক্ষমাণ আবেদন!</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
              <Compass className="w-7 h-7 text-[#DCB473]" />
              <span>হাজী নিবন্ধন আবেদন ও অনুমোদন ব্যবস্থাপনা</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              অনলাইন হাজী ফরম থেকে জমাকৃত সকল প্রাক-নিবন্ধন আবেদন। নতুন আবেদন পেন্ডিং অবস্থায় জমা হয়—যেখান থেকে আপনি তা অনুমোদন, তথ্য সম্পাদন এবং ব্যবস্থাপনা করতে পারবেন।
            </p>
            {canSubAdminAdd('haji-registrations') && (
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openInquiryModal('new-haji')}
                  className="px-4 py-2 bg-gradient-to-r from-[#DCB473] to-[#C99C53] hover:from-[#c99c53] hover:to-[#b88c42] text-[#0f2922] font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন হাজী যোগ করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Counter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-stone-300 block">মোট আবেদন</span>
              <span className="text-2xl font-bold text-white font-mono">{totalCount}</span>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-400/30 text-center">
              <span className="text-xs text-amber-200 font-semibold block">পেন্ডিং আবেদন</span>
              <span className="text-2xl font-bold text-amber-300 font-mono">{pendingCount}</span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-400/30 text-center">
              <span className="text-xs text-emerald-200 font-semibold block">অনুমোদিত</span>
              <span className="text-2xl font-bold text-emerald-300 font-mono">{approvedCount}</span>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-xs p-3.5 rounded-2xl border border-blue-400/30 text-center">
              <span className="text-xs text-blue-200 font-semibold block">যোগাযোগকৃত</span>
              <span className="text-2xl font-bold text-blue-300 font-mono">{contactedCount}</span>
            </div>
          </div>
        </div>

        {isSubAdmin && (
          <div className="mt-4 p-3.5 bg-amber-500/20 border border-amber-400/40 rounded-2xl flex items-center gap-2.5 text-xs text-amber-200">
            <Shield className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>সাব-এডমিন (শুধু দেখার ও পিডিএফ ডাউনলোডের অনুমতি):</strong>{' '}
              আপনি সকল হাজীর বিস্তারিত তথ্য, পাসপোর্ট, NID, আইডি কার্ড ও রশিদ দেখতে এবং পিডিএফ/প্রিন্ট ডাউনলোড করতে পারবেন (সংযোজন, এডিট বা ডিলিট অনুমোদিত নয়)।
            </span>
          </div>
        )}
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          {canSubAdminAdd('haji-registrations') && (
            <button
              type="button"
              onClick={() => openInquiryModal('new-haji')}
              className="px-4 py-2 bg-gradient-to-r from-[#0f2922] to-[#164438] hover:bg-[#0f2922] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer border border-[#DCB473]/40 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন হাজী যোগ করুন</span>
            </button>
          )}
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="হাজীর নাম, ইউজার আইডি, মোবাইল নম্বর, রেফারেন্স, NID বা পাসপোর্ট দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-stone-50/50 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Package Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400 shrink-0" />
            <select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-medium text-stone-700"
            >
              <option value="all">সকল প্যাকেজ ({hajiList.length})</option>
              {packageOptions.map((pkg) => (
                <option key={pkg} value={pkg}>
                  {pkg}
                </option>
              ))}
            </select>
          </div>

          {/* Kafela Group Filter */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600 shrink-0" />
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-purple-200 bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-purple-400 font-medium text-purple-900"
            >
              <option value="all">সকল কাফেলা গ্রুপ ({groupsOccupancy.length}টি)</option>
              <option value="unassigned">গ্রুপ বরাদ্দ বাকি / পেন্ডিং</option>
              {groupsOccupancy.map((item) => (
                <option key={item.group.id} value={item.group.name}>
                  {item.group.name} — {item.currentCount}/{item.maxCapacity} জন {item.isFull ? '(পূর্ণ)' : `(${item.seatsLeft}টি আসন খালি)`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4-Level Drill-Down Breadcrumbs & Navigation Bar */}
        <div className="bg-stone-50 p-3 sm:p-4 rounded-2xl border border-stone-200/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-stone-700">
            <span className="text-stone-400 font-medium mr-1 flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 text-[#DCB473]" />
              <span>নেভিগেশন:</span>
            </span>

            {/* Step 1 Crumb: All / Type */}
            <button
              type="button"
              onClick={() => {
                setDrillType(null);
                setDrillYear(null);
                setDrillGroup(null);
                setViewMode('drill');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                drillType === null && viewMode === 'drill'
                  ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>১. হজের ধরন</span>
            </button>

            {/* Step 2 Crumb: Year */}
            {drillType && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                <button
                  type="button"
                  onClick={() => {
                    setDrillYear(null);
                    setDrillGroup(null);
                    setViewMode('drill');
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    drillYear === null
                      ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-[#DCB473]" />
                  <span>
                    ২. {drillType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্ হজ'}:{' '}
                    {drillYear ? `${drillYear} সাল` : 'সাল নির্বাচন'}
                  </span>
                </button>
              </>
            )}

            {/* Step 3 Crumb: Group */}
            {drillType && drillYear && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                <button
                  type="button"
                  onClick={() => {
                    setDrillGroup(null);
                    setViewMode('drill');
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    drillGroup === null
                      ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>৩. গ্রুপ: {drillGroup || 'গ্রুপ নির্বাচন'}</span>
                </button>
              </>
            )}

            {/* Step 4 Crumb: Pilgrim List */}
            {drillType && drillYear && drillGroup && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                <span className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-extrabold shadow-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>৪. হাজীদের তালিকা ({filteredHajis.length} জন)</span>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'drill') {
                  setViewMode('flat');
                } else {
                  setViewMode('drill');
                }
              }}
              className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Layers className="w-3.5 h-3.5 text-[#0f2922]" />
              <span>{viewMode === 'drill' ? 'একত্রে সকল আবেদন দেখুন (ফ্ল্যাট তালিকা)' : 'ধাপে ধাপে ড্রিল-ডাউন নেভিগেশন'}</span>
            </button>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-100">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            সব আবেদন ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>পেন্ডিং / অপেক্ষমাণ ({pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>অনুমোদিত ({approvedCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('contacted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'contacted'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            যোগাযোগকৃত ({contactedCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            বাতিল ({rejectedCount})
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4-LEVEL HIERARCHY DRILL-DOWN CONSOLES                      */}
      {/* ======================================================== */}

      {/* STEP 1: হজের ধরন নির্বাচন (১। মূল হজ vs ২। ওমরাহ্ হজ) */}
      {viewMode === 'drill' && drillType === null && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2922] text-[#DCB473] text-xs font-extrabold uppercase">
              <Compass className="w-3.5 h-3.5" />
              <span>ধাপ ১: হজের ধরন নির্বাচন</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#0f2922]">
              হজের ধরন বাছাই করে রেজিস্ট্রেশন ও গ্রুপ দেখুন
            </h3>
            <p className="text-xs sm:text-sm text-stone-500">
              নিচের “১। মূল হজ” অথবা “২। ওমরাহ্ হজ” বাটনে ক্লিক করুন। এরপর হাজির রেজিস্ট্রেশনের সাল ও কাফেলা গ্রুপ নির্বাচন করে হাজীদের পূর্ণ তালিকা দেখতে পারবেন।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Card 1: মূল হজ */}
            <div
              onClick={() => {
                setDrillType('hajj');
                setDrillYear(null);
                setDrillGroup(null);
              }}
              className="group bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-300 hover:border-[#0f2922] hover:shadow-lg p-6 rounded-3xl transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center font-black text-xl shadow-xs">
                    ১
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                    {hajjRegistrationCount} জন নিবন্ধিত
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#0f2922] group-hover:text-amber-700 transition-colors flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#DCB473]" />
                    <span>১। মূল হজ</span>
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    সরকারি ও বেসরকারি মূল হজ প্যাকেজে আবেদনকৃত সকল হজযাত্রী। ক্লিক করে মূল হজের রেজিস্ট্রেশনের সাল ও গ্রুপ দেখুন।
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-amber-900 group-hover:text-[#0f2922]">
                <span>মূল হজের সাল নির্বাচন করুন</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">➔</span>
              </div>
            </div>

            {/* Card 2: ওমরাহ্ হজ */}
            <div
              onClick={() => {
                setDrillType('umrah');
                setDrillYear(null);
                setDrillGroup(null);
              }}
              className="group bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-2 border-emerald-300 hover:border-emerald-600 hover:shadow-lg p-6 rounded-3xl transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    ২
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold">
                    {umrahRegistrationCount} জন নিবন্ধিত
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-emerald-950 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    <span>২। ওমরাহ্ হজ</span>
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    ডিসেম্বর, রমজান ও সারা বছরের পবিত্র ওমরাহ্ কাফেলায় নিবন্ধিত হজযাত্রী। ক্লিক করে ওমরাহ্ রেজিস্ট্রেশনের সাল ও গ্রুপ দেখুন।
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-200/60 flex items-center justify-between text-xs font-bold text-emerald-900 group-hover:text-emerald-700">
                <span>ওমরাহ্ হজের সাল নির্বাচন করুন</span>
                <span className="text-base group-hover:translate-x-1 transition-transform">➔</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: রেজিস্ট্রেশনের সাল নির্বাচন */}
      {viewMode === 'drill' && drillType !== null && drillYear === null && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2922] text-[#DCB473] text-xs font-extrabold uppercase mb-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>ধাপ ২: হাজির রেজিস্ট্রেশনের সাল / বছর</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0f2922]">
                {drillType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্ হজ'}: রেজিস্ট্রেশনের সাল নির্বাচন করুন
              </h3>
              <p className="text-xs sm:text-sm text-stone-500">
                যে সালে হাজীরা রেজিস্ট্রেশন করেছেন সেই সালে ক্লিক করে রেজিস্ট্রেশনকৃত কাফেলা গ্রুপ দেখুন।
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDrillType(null);
                setDrillYear(null);
                setDrillGroup(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← হজের ধরন পরিবর্তন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            {availableDrillYears.map(({ year, count }) => (
              <div
                key={year}
                onClick={() => {
                  setDrillYear(year);
                  setDrillGroup(null);
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
                    {drillType === 'hajj' ? 'মূল হজ সেশন' : 'ওমরাহ্ হজ কাফেলা সেশন'}
                  </p>
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
      {viewMode === 'drill' && drillType !== null && drillYear !== null && drillGroup === null && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2922] text-[#DCB473] text-xs font-extrabold uppercase mb-1">
                <Users className="w-3.5 h-3.5" />
                <span>ধাপ ৩: রেজিস্ট্রেশনকৃত কাফেলা গ্রুপ নির্বাচন</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0f2922]">
                {drillType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্ হজ'} ({drillYear} সাল) — যে গ্রুপে রেজিস্ট্রেশন করেছে
              </h3>
              <p className="text-xs sm:text-sm text-stone-500">
                নির্দিষ্ট কাফেলা গ্রুপে ক্লিক করে সেই গ্রুপে রেজিস্ট্রেশনকৃত হাজীদের পূর্ণ তালিকা দেখুন।
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setDrillYear(null);
                  setDrillGroup(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← সাল পরিবর্তন</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDrillGroups.map((grp) => {
              const hasPilgrims = grp.count > 0;
              return (
                <div
                  key={grp.groupName}
                  onClick={() => setDrillGroup(grp.groupName)}
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
                        {grp.count} জন হাজী নিবন্ধিত
                      </span>
                    </div>

                    <h4 className="text-base font-black text-stone-900 group-hover:text-emerald-800">
                      {grp.groupName}
                    </h4>
                    <p className="text-xs text-stone-600 mt-1">
                      মোয়াল্লেম / গাইড: <b>{grp.leader}</b>
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      সফর সূচি: {grp.departureDate} · আসন ক্ষমতা: {grp.maxCapacity} জন
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-xs font-extrabold text-[#0f2922]">
                    <span>হাজীদের পূর্ণ তালিকা ও হিসাব দেখুন</span>
                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Group Header Banner with Financial Summary if in Drill Mode and Group is chosen */}
      {viewMode === 'drill' && drillGroup && (
        <div className="bg-gradient-to-br from-white via-[#FAF8F5] to-white rounded-3xl p-5 sm:p-6 shadow-md border-2 border-[#DCB473]/70 space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f2922] text-[#DCB473] text-[11px] font-bold tracking-wide uppercase shadow-xs mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#DCB473]" />
                <span>ধাপ ৪: গ্রুপে রেজিস্ট্রেশনকৃত হাজীদের তালিকা ও আর্থিক সমীকরণ</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#0f2922] flex items-center gap-2">
                <span>গ্রুপ: {drillGroup}</span>
                <span className="text-xs font-bold text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
                  {drillType === 'hajj' ? 'মূল হজ' : 'ওমরাহ্ হজ'} · {drillYear} সাল
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                এই গ্রুপে রেজিস্ট্রেশনকৃত হাজীদের তালিকা এবং নির্ধারিত, পরিশোধিত ও ডিউ টাকার হিসাব সমীকরণ।
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDrillGroup(null)}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← গ্রুপ পরিবর্তন</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrillYear(null);
                  setDrillGroup(null);
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
              >
                সাল পরিবর্তন
              </button>
            </div>
          </div>

          {/* 3 Prominent Calculation Cards for the selected Group */}
          {currentDrillGroupSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
              {/* ১. রেজিস্ট্রেশনকৃত টাকার পরিমাণ */}
              <div className="bg-white p-4 sm:p-4.5 rounded-2xl border-2 border-[#0f2922]/20 shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0f2922]">
                      <span className="w-5 h-5 rounded-full bg-[#0f2922] text-[#DCB473] text-[11px] flex items-center justify-center font-bold">১</span>
                      <span>রেজিস্ট্রেশনকৃত টাকার পরিমাণ</span>
                    </span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 font-bold px-2 py-0.5 rounded-full">
                      ধার্যকৃত মোট
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    {drillGroup} গ্রুপে হাজী রেজিস্ট্রেশনের সময় ধার্যকৃত টাকা
                  </p>
                  <div className="text-xl sm:text-2xl font-black text-[#0f2922]">
                    {formatBDT(currentDrillGroupSummary.totalContract)}
                  </div>
                </div>
              </div>

              {/* ২. পরিশোধিত টাকার পরিমাণ */}
              <div className="bg-emerald-50/50 p-4 sm:p-4.5 rounded-2xl border-2 border-emerald-300 shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] flex items-center justify-center font-bold">২</span>
                      <span>পরিশোধিত টাকার পরিমাণ</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      মোট জমা
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    এই গ্রুপের যাত্রীদের থেকে আদায়কৃত মোট জমা টাকা
                  </p>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700">
                    {formatBDT(currentDrillGroupSummary.totalDeposited)}
                  </div>
                </div>
              </div>

              {/* ৩. ডিউ টাকার পরিমাণ */}
              <div className="bg-rose-50/50 p-4 sm:p-4.5 rounded-2xl border-2 border-rose-300 shadow-xs relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-900">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center font-bold">৩</span>
                      <span>ডিউ টাকার পরিমাণ</span>
                    </span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                      মোট বকেয়া
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-1.5">
                    রেজিস্ট্রেশনকৃত টাকা − পরিশোধিত টাকা = মোট ডিউ
                  </p>
                  <div className="text-xl sm:text-2xl font-black text-rose-700">
                    {formatBDT(currentDrillGroupSummary.totalDue)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2.5. Kafela Groups Capacity Summary Widget (এডমিন ইচ্ছামত গ্রুপ বাড়াতে ও কমাতে পারবেন) */}
      {viewMode === 'flat' && (
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              <h3 className="text-sm sm:text-base font-bold text-[#0f2922]">
                কাফেলা গ্রুপভিত্তিক হজযাত্রী আসন ট্র্যাকার (গ্রুপ নিয়ন্ত্রণ ও আসন সংখ্যা)
              </h3>
            </div>
            <p className="text-[11px] text-stone-500">
              হাজীরা যে গ্রুপ সিলেক্ট করে আবেদন করেছেন শুধুমাত্র তাদেরই সংখ্যা গণনা হচ্ছে। এডমিন প্রয়োজনে যেকোনো গ্রুপ যোগ, সম্পাদনা বা মুছে ফেলতে পারেন।
            </p>
          </div>

          {(canSubAdminAdd('haji-registrations') || canSubAdminEdit('haji-registrations')) ? (
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {canSubAdminAdd('haji-registrations') && (
                <button
                  type="button"
                  onClick={handleOpenAddGroup}
                  className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ নতুন গ্রুপ যোগ করুন</span>
                </button>
              )}
              {canSubAdminEdit('haji-registrations') && (
                <button
                  type="button"
                  onClick={() => {
                    requestConfirm({
                      title: 'কাফেলা গ্রুপ ডিফল্ট রিসেট',
                      message: 'আপনি কি কাফেলা গ্রুপগুলো প্রাথমিক অবস্থায় (Group-A, Group-B, Group-C) রিসেট করতে চান?',
                      confirmText: 'হ্যাঁ, রিসেট করুন',
                      onConfirm: resetKafelaGroups
                    });
                  }}
                  title="ডিফল্ট গ্রুপ রিসেট"
                  className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-200/70 px-2.5 py-1 rounded-lg">
              রিড-অনলি মোড
            </span>
          )}
        </div>

        {/* Groups Occupancy Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {kafelaGroups.map((group) => {
            const count = groupsOccupancyMap[group.name] || 0;
            const max = group.maxCapacity || MAX_PILGRIMS_PER_GROUP;
            const pct = Math.min(100, Math.round((count / max) * 100));
            const isFull = count >= max;

            return (
              <div
                key={group.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  groupFilter === group.name
                    ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-200'
                    : 'border-stone-200 bg-stone-50/60 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    type="button"
                    onClick={() => setGroupFilter(groupFilter === group.name ? 'all' : group.name)}
                    className="font-bold text-xs text-stone-800 hover:text-purple-700 flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <Compass className="w-3.5 h-3.5 text-purple-600" />
                    <span>{group.name}</span>
                  </button>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFull
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {count}/{max}
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isFull ? 'bg-rose-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-500">
                  <span className="truncate max-w-[120px]">{group.leader || 'মোয়াল্লিম'}</span>
                  {!isSubAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditGroup(group)}
                        className="p-1 hover:bg-stone-200 rounded text-stone-600 cursor-pointer"
                        title="গ্রুপ সম্পাদনা"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group)}
                        className="p-1 hover:bg-rose-100 rounded text-rose-600 cursor-pointer"
                        title="গ্রুপ মুছুন"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 3. Haji Registrations List - Displayed in Flat Mode OR at Step 4 (when group is selected) */}
      {(viewMode === 'flat' || (drillType !== null && drillYear !== null && drillGroup !== null)) && (
      filteredHajis.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-700 mb-1">কোনো হাজী নিবন্ধন পাওয়া যায়নি</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all' || packageFilter !== 'all'
              ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো আবেদন পাওয়া যায়নি। ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।'
              : 'এখনও কোনো হাজী প্রাক-নিবন্ধন আবেদন জমা হয়নি। ওয়েবসাইট থেকে নতুন নিবন্ধন আসলে তা স্বয়ংক্রিয়ভাবে এখানে পেন্ডিং অবস্থায় জমা হবে।'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
          {/* Desktop & Tablet Table View (matches user screenshot) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3.5 px-4 w-36">USER ID</th>
                  <th className="py-3.5 px-4 min-w-[200px]">SHAREHOLDER NAME</th>
                  <th className="py-3.5 px-4 w-36">SHARES / প্যাকেজ</th>
                  <th className="py-3.5 px-4 min-w-[160px]">নির্ধারিত টাকার পরিমাণ</th>
                  <th className="py-3.5 px-4 min-w-[170px]">CONTACT & EMAIL</th>
                  <th className="py-3.5 px-4 w-32">STATUS</th>
                  <th className="py-3.5 px-4 text-right w-44">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredHajis.map((haji) => {
                  const isApproved = haji.status === 'approved';
                  const isPending = haji.status === 'pending';
                  const isRejected = haji.status === 'rejected';
                  const hasCredentials = !!haji.hajiPassword;
                  const displayUserId = haji.hajiUserId || haji.registrationRef || haji.phone;
                  const sharesCount = (haji.linkedCompanions?.length || 0) + (haji.travelersCount || 1);
                  const regType = getRegistrationType(haji);
                  const linkedFinance = hajiFinanceRecords.find(
                    (record) =>
                      (record.inquiryId && record.inquiryId === haji.id) ||
                      (record.registrationRef && haji.registrationRef && record.registrationRef === haji.registrationRef) ||
                      (record.phone && haji.phone && record.phone === haji.phone)
                  );
                  const defaultBasePrice = regType === 'umrah' ? 165000 : 650000;
                  const determinedTotal =
                    haji.finalTotalAmount ||
                    haji.subtotalAmount ||
                    linkedFinance?.finalTotalAmount ||
                    linkedFinance?.packagePrice ||
                    defaultBasePrice;
                  const paidAmt = haji.paidAmount !== undefined ? haji.paidAmount : (linkedFinance?.totalDeposited || 0);
                  const dueAmt =
                    haji.dueAmount !== undefined
                      ? haji.dueAmount
                      : linkedFinance?.dueAmount !== undefined
                      ? linkedFinance.dueAmount
                      : Math.max(0, determinedTotal - paidAmt);

                  return (
                    <tr
                      key={haji.id}
                      className="hover:bg-emerald-50/20 transition-colors group"
                    >
                      {/* 1. USER ID */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                          {displayUserId}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-medium mt-1">
                          {hasCredentials ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                              Credentials Set
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-stone-400">
                              <KeyRound className="w-3 h-3 text-stone-300 shrink-0" />
                              No Password
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. SHAREHOLDER NAME (Clickable to view full profile) */}
                      <td className="py-3.5 px-4 align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedProfileHaji(haji)}
                          className="text-left group/btn cursor-pointer focus:outline-none block w-full"
                          title="সম্পূর্ণ প্রোফাইল দেখতে ক্লিক করুন"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-stone-900 group-hover/btn:text-emerald-700 underline-offset-2 group-hover/btn:underline transition-colors uppercase">
                              {haji.nameEn || haji.name || haji.nameBn}
                            </span>
                            {haji.selectedGroup && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                {haji.selectedGroup}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-500 font-medium mt-0.5">
                            {haji.nameBn || haji.name}
                          </div>
                        </button>
                      </td>

                      {/* 3. SHARES */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-sm font-bold text-stone-900">
                          {sharesCount} <span className="text-xs font-normal text-stone-500">shares</span>
                        </div>
                        <div className="text-[11px] text-stone-500 truncate max-w-[140px]" title={haji.serviceName}>
                          {haji.serviceName || (regType === 'umrah' ? 'পবিত্র ওমরাহ কাফেলা প্যাকেজ' : 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ')}
                        </div>
                      </td>

                      {/* 4. নির্ধারিত টাকার পরিমাণ (Registration Determined Amount) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-sm font-black text-[#0f2922]">
                          ৳ {determinedTotal.toLocaleString('bn-BD')}
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px]">
                          {dueAmt <= 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              পরিশোধিত: ৳ {paidAmt.toLocaleString('bn-BD')}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-stone-500 font-medium">
                                জমা: <b className="text-emerald-700">৳ {paidAmt.toLocaleString('bn-BD')}</b>
                              </span>
                              <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 w-fit">
                                ডিউ: ৳ {dueAmt.toLocaleString('bn-BD')}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. CONTACT & EMAIL */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="text-xs font-semibold text-stone-900 font-mono">
                          {haji.phone}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5">
                          <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[160px]" title={haji.email || ''}>
                            {haji.email || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* 5. STATUS */}
                      <td className="py-3.5 px-4 align-top">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Approved
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            Contacted
                          </span>
                        )}
                      </td>

                      {/* 6. ACTIONS */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedProfileHaji(haji)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="সম্পূর্ণ প্রোফাইল দেখুন"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIdCardHaji(haji)}
                            className="p-1.5 text-[#b88e44] hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="হাজী আইডি কার্ড"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintHaji(haji)}
                            className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                            title="প্রিন্ট স্লিপ"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {canSubAdminEdit('haji-registrations') && (
                            <button
                              type="button"
                              onClick={() => openInquiryModal(haji)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="সম্পাদনা করুন"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canSubAdminDelete('haji-registrations') && (
                            <button
                              type="button"
                              onClick={() => handleDelete(haji)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Concise Cards View */}
          <div className="md:hidden divide-y divide-stone-100">
            {filteredHajis.map((haji) => {
              const isApproved = haji.status === 'approved';
              const isPending = haji.status === 'pending';
              const hasCredentials = !!haji.hajiPassword;
              const displayUserId = haji.hajiUserId || haji.registrationRef || haji.phone;
              const sharesCount = (haji.linkedCompanions?.length || 0) + (haji.travelersCount || 1);
              const regType = getRegistrationType(haji);
              const linkedFinance = hajiFinanceRecords.find(
                (record) =>
                  (record.inquiryId && record.inquiryId === haji.id) ||
                  (record.registrationRef && haji.registrationRef && record.registrationRef === haji.registrationRef) ||
                  (record.phone && haji.phone && record.phone === haji.phone)
              );
              const defaultBasePrice = regType === 'umrah' ? 165000 : 650000;
              const determinedTotal =
                haji.finalTotalAmount ||
                haji.subtotalAmount ||
                linkedFinance?.finalTotalAmount ||
                linkedFinance?.packagePrice ||
                defaultBasePrice;
              const paidAmt = haji.paidAmount !== undefined ? haji.paidAmount : (linkedFinance?.totalDeposited || 0);
              const dueAmt =
                haji.dueAmount !== undefined
                  ? haji.dueAmount
                  : linkedFinance?.dueAmount !== undefined
                  ? linkedFinance.dueAmount
                  : Math.max(0, determinedTotal - paidAmt);

              return (
                <div key={haji.id} className="p-4 hover:bg-emerald-50/10 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                        {displayUserId}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-medium mt-1">
                        {hasCredentials ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                            Credentials Set
                          </span>
                        ) : (
                          <span className="text-stone-400">No Password</span>
                        )}
                      </div>
                    </div>

                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" /> Approved
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="w-3 h-3 text-rose-600" /> Rejected
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProfileHaji(haji)}
                    className="text-left w-full group/btn cursor-pointer mb-2"
                  >
                    <div className="font-bold text-sm text-stone-900 group-hover/btn:text-emerald-700 uppercase">
                      {haji.nameEn || haji.name || haji.nameBn}
                    </div>
                    <div className="text-xs text-stone-500 font-medium">
                      {haji.nameBn || haji.name}
                    </div>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 pt-2 border-t border-stone-100 mb-3">
                    <div>
                      <span className="text-stone-400 text-[11px] block">Shares / গ্রুপ:</span>
                      <span className="font-semibold text-stone-800">{sharesCount} shares</span>
                      {haji.selectedGroup && (
                        <span className="ml-1 text-[10px] text-purple-700 font-bold">({haji.selectedGroup})</span>
                      )}
                      <span className="text-stone-400 text-[10px] block mt-0.5 truncate" title={haji.serviceName}>
                        {haji.serviceName || (regType === 'umrah' ? 'পবিত্র ওমরাহ কাফেলা প্যাকেজ' : 'বেসরকারি ভিআইপি হজ্ব প্যাকেজ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">নির্ধারিত টাকার পরিমাণ:</span>
                      <span className="font-black text-[#0f2922] text-sm block">
                        ৳ {determinedTotal.toLocaleString('bn-BD')}
                      </span>
                      {dueAmt <= 0 ? (
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                          পরিশোধিত (৳ {paidAmt.toLocaleString('bn-BD')})
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 inline-block mt-0.5">
                          বকেয়া: ৳ {dueAmt.toLocaleString('bn-BD')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setSelectedProfileHaji(haji)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> সম্পূর্ণ প্রোফাইল
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIdCardHaji(haji)}
                        className="p-1.5 text-[#b88e44] hover:bg-amber-50 rounded-lg"
                        title="আইডি কার্ড"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintHaji(haji)}
                        className="p-1.5 text-stone-600 hover:bg-stone-100 rounded-lg"
                        title="প্রিন্ট স্লিপ"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {canSubAdminEdit('haji-registrations') && (
                        <button
                          type="button"
                          onClick={() => openInquiryModal(haji)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canSubAdminDelete('haji-registrations') && (
                        <button
                          type="button"
                          onClick={() => handleDelete(haji)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* FULL HAJI PROFILE MODAL (Opens upon clicking name or full profile) */}
      {activeProfileHaji && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-stone-200 my-auto flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0b1f1a] via-[#12362c] to-[#0f2922] text-white flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {activeProfileHaji.pilgrimPhoto ? (
                    <img
                      src={activeProfileHaji.pilgrimPhoto}
                      alt={activeProfileHaji.nameBn || activeProfileHaji.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#DCB473] shadow-md cursor-pointer hover:opacity-90"
                      onClick={() =>
                        setPreviewDoc({
                          url: activeProfileHaji.pilgrimPhoto!,
                          title: 'হাজীর পাসপোর্ট সাইজ ছবি',
                          hajiName: activeProfileHaji.nameBn || activeProfileHaji.name
                        })
                      }
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border-2 border-[#DCB473]/50 flex items-center justify-center text-[#DCB473]">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  {activeProfileHaji.pilgrimPhoto && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: activeProfileHaji.pilgrimPhoto!,
                          title: 'হাজীর পাসপোর্ট সাইজ ছবি',
                          hajiName: activeProfileHaji.nameBn || activeProfileHaji.name
                        })
                      }
                      className="absolute -bottom-1 -right-1 p-1 bg-[#DCB473] text-[#0f2922] rounded-full shadow-sm hover:scale-105"
                      title="ছবি বড় করে দেখুন"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-bold bg-[#DCB473] text-[#0f2922] px-2.5 py-0.5 rounded-full">
                      ID: {activeProfileHaji.hajiUserId || activeProfileHaji.registrationRef || activeProfileHaji.phone}
                    </span>
                    <span className="text-[11px] text-stone-300 font-mono">
                      Ref: {activeProfileHaji.registrationRef || activeProfileHaji.id}
                    </span>
                    {activeProfileHaji.status === 'approved' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> অনুমোদিত (Approved)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> অপেক্ষমাণ (Pending)
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    {activeProfileHaji.nameBn || activeProfileHaji.name}
                  </h3>
                  {activeProfileHaji.nameEn && (
                    <p className="text-xs text-[#DCB473] font-mono tracking-wider">
                      {activeProfileHaji.nameEn}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfileHaji(null)}
                className="p-2 text-stone-300 hover:text-white rounded-full hover:bg-white/10 cursor-pointer shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable Profile Sections) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Portal Login Credentials Bar */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-sm">হাজী পোর্টাল লগইন ক্রেডেনশিয়াল</h4>
                    <p className="text-[11px] text-stone-600">হাজী এই তথ্য দিয়ে ওয়েবসাইটের লগইন প্যানেল থেকে নিজের একাউন্টে লগইন করতে পারবেন।</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                    <span className="text-stone-400 block text-[10px]">User ID:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {activeProfileHaji.hajiUserId || activeProfileHaji.phone}
                    </span>
                  </div>

                  <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs flex items-center gap-1.5">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Password:</span>
                      <span className="font-mono font-bold text-stone-900">
                        {showPasswordMap[activeProfileHaji.id]
                          ? (activeProfileHaji.hajiPassword || 'সেট করা নেই')
                          : (activeProfileHaji.hajiPassword ? '••••••••' : 'নেই')}
                      </span>
                    </div>
                    {activeProfileHaji.hajiPassword && (
                      <button
                        type="button"
                        onClick={() => togglePassword(activeProfileHaji.id)}
                        className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title={showPasswordMap[activeProfileHaji.id] ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                      >
                        {showPasswordMap[activeProfileHaji.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `User ID: ${activeProfileHaji.hajiUserId || activeProfileHaji.phone}\nPassword: ${activeProfileHaji.hajiPassword || ''}`,
                        'লগইন তথ্য'
                      )
                    }
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                    title="কপি করুন"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি</span>
                  </button>
                </div>
              </div>

              {/* Grid 1: Personal & Family Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-200 pb-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    ব্যক্তিগত তথ্য (Personal Information)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-stone-400 block text-[11px]">পিতার নাম:</span>
                      <span className="font-semibold text-stone-800">{activeProfileHaji.fatherNameBn || activeProfileHaji.fatherNameEn || '—'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">মাতার নাম:</span>
                      <span className="font-semibold text-stone-800">{activeProfileHaji.motherNameBn || activeProfileHaji.motherNameEn || '—'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">জন্ম তারিখ:</span>
                      <span className="font-semibold text-stone-800 font-mono">{activeProfileHaji.dateOfBirth || '—'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">বয়স ও লিঙ্গ:</span>
                      <span className="font-semibold text-stone-800">
                        {activeProfileHaji.age ? `${activeProfileHaji.age} বছর` : '—'} {activeProfileHaji.gender ? `(${activeProfileHaji.gender})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">বৈবাহিক অবস্থা:</span>
                      <span className="font-semibold text-stone-800">{activeProfileHaji.maritalStatus || '—'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">রক্তের গ্রুপ:</span>
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block font-mono">
                        {activeProfileHaji.bloodGroup || '—'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-stone-400 block text-[11px]">পেশা (Occupation):</span>
                      <span className="font-semibold text-stone-800">{activeProfileHaji.occupation || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Grid 2: Identity & Addresses */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-3">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-200 pb-2">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    পরিচয়পত্র ও ঠিকানা (ID & Address)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-stone-400 block text-[11px]">NID / স্মার্ট কার্ড নং:</span>
                      <span className="font-bold text-stone-900 font-mono bg-stone-200/60 px-2 py-0.5 rounded inline-block">
                        {activeProfileHaji.nidNo || 'নেই'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">পাসপোর্ট নম্বর:</span>
                      <span className="font-bold text-purple-900 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
                        {activeProfileHaji.passportNo || 'নেই'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-stone-400 block text-[11px]">পাসপোর্টের মেয়াদ:</span>
                      <span className="font-mono text-stone-800">{activeProfileHaji.passportExpiryDate || 'প্রদান করা হয়নি'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-stone-400 block text-[11px]">বর্তমান ঠিকানা:</span>
                      <span className="font-medium text-stone-800 block">{activeProfileHaji.presentAddress || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-stone-400 block text-[11px]">স্থায়ী ঠিকানা:</span>
                      <span className="font-medium text-stone-800 block">{activeProfileHaji.permanentAddress || '—'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">থানা / উপজেলা:</span>
                      <span className="font-semibold text-stone-800">{activeProfileHaji.policeStation || '—'}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[11px]">জেলা:</span>
                      <span className="font-semibold text-stone-800">{activeProfileHaji.district || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 3: Kafela Group, Package & Companions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kafela Group Assignment */}
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                    <h4 className="font-bold text-purple-950 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-700" />
                      কাফেলা গ্রুপ নির্ধারণ
                    </h4>
                    {activeProfileHaji.selectedGroup && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-200/80 text-purple-900 border border-purple-300">
                        {activeProfileHaji.selectedGroup}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-purple-800">
                    এই হাজীকে নির্দিষ্ট কাফেলা গ্রুপে অন্তর্ভুক্ত করুন (প্রতি গ্রুপে সর্বোচ্চ ৫০ জন হাজী রাখা যাবে)।
                  </p>

                  {canEdit && (
                    <div className="flex items-center gap-2 pt-1">
                      <select
                        value={activeProfileHaji.selectedGroup || ''}
                        onChange={(e) => assignHajiGroup(activeProfileHaji.id, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-purple-300 bg-white text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="">-- গ্রুপ নির্বাচন করুন (গ্রুপমুক্ত) --</option>
                        {kafelaGroups.map((grp) => {
                          const occ = groupsOccupancyMap[grp.name] || 0;
                          return (
                            <option key={grp.id} value={grp.name}>
                              {grp.name} ({occ}/{grp.maxCapacity || MAX_PILGRIMS_PER_GROUP} জন) - {grp.leader || 'মোয়াল্লিম'}
                            </option>
                          );
                        })}
                      </select>
                      {activeProfileHaji.selectedGroup && (
                        <button
                          type="button"
                          onClick={() => assignHajiGroup(activeProfileHaji.id, '')}
                          className="px-2.5 py-2 text-xs text-rose-700 hover:bg-rose-100 rounded-xl font-bold border border-rose-200 cursor-pointer"
                          title="গ্রুপ থেকে মুক্ত করুন"
                        >
                          রিমুভ
                        </button>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-purple-200/60 text-[11px] text-purple-900 flex justify-between">
                    <span>নির্বাচিত প্যাকেজ:</span>
                    <span className="font-bold">{activeProfileHaji.serviceName || 'সাধারণ হজ্ব/ওমরাহ'}</span>
                  </div>
                </div>

                {/* Companions & Mahram */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
                  <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2 border-b border-emerald-200 pb-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    যুক্তকৃত কাফেলা সঙ্গী ও মাহরাম ({activeProfileHaji.linkedCompanions?.length || 0} জন)
                  </h4>

                  {activeProfileHaji.linkedCompanions && activeProfileHaji.linkedCompanions.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {activeProfileHaji.linkedCompanions.map((comp) => (
                        <div
                          key={comp.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-200 text-xs"
                        >
                          <div>
                            <span className="font-bold text-stone-900 block">{comp.name}</span>
                            <span className="text-[11px] text-emerald-800 font-mono">
                              ID: {comp.hajiUserId} {comp.group ? `(${comp.group})` : ''}
                            </span>
                          </div>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                requestConfirm({
                                  title: 'সঙ্গী আনলিঙ্ক নিশ্চিতকরণ',
                                  message: `আপনি কি "${comp.name}" কে এই হাজির সঙ্গীদের তালিকা থেকে মুছে ফেলতে চান?`,
                                  confirmText: 'হ্যাঁ, আনলিঙ্ক করুন',
                                  onConfirm: () => unlinkHajiCompanion(activeProfileHaji.id, comp.id)
                                });
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="সঙ্গী বাদ দিন"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-800 italic">
                      বর্তমানে কোনো কাফেলা সঙ্গী যুক্ত নেই।
                    </p>
                  )}

                  {canEdit && (
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-2">
                      <select
                        value={companionSelectMap[activeProfileHaji.id] || ''}
                        onChange={(e) =>
                          setCompanionSelectMap((prev) => ({
                            ...prev,
                            [activeProfileHaji.id]: e.target.value
                          }))
                        }
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                      >
                        <option value="">-- সঙ্গী হিসেবে যোগ করতে হাজী নির্বাচন --</option>
                        {hajiList
                          .filter(
                            (other) =>
                              other.id !== activeProfileHaji.id &&
                              !activeProfileHaji.linkedCompanionIds?.includes(other.id)
                          )
                          .map((other) => (
                            <option key={other.id} value={other.id}>
                              [{other.hajiUserId || other.registrationRef || other.id}] {other.nameBn || other.name} ({other.phone})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = companionSelectMap[activeProfileHaji.id];
                          if (!targetId) {
                            showToast('অনুগ্রহ করে ড্রপডাউন থেকে একজন হাজী নির্বাচন করুন!');
                            return;
                          }
                          linkHajiCompanion(activeProfileHaji.id, targetId);
                          setCompanionSelectMap((prev) => ({ ...prev, [activeProfileHaji.id]: '' }));
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>যুক্ত</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 4: Financial Summary & Discount */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-50 to-amber-50/40 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#b88e44]" />
                    আর্থিক হিসাব ও এডমিন ছাড় (Financial Accounting)
                  </h4>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountHaji(activeProfileHaji);
                        setDiscountPercentInput(activeProfileHaji.discountPercent || 0);
                        setDiscountNoteInput(activeProfileHaji.discountNote || '');
                      }}
                      className="px-3 py-1 bg-[#0f2922] hover:bg-[#163d33] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <BadgePercent className="w-3.5 h-3.5" />
                      <span>{activeProfileHaji.discountPercent ? 'ছাড় পরিবর্তন করুন' : 'বিশেষ ছাড় (%) দিন'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                    <span className="text-stone-400 block text-[10px]">মূল প্যাকেজ ফি:</span>
                    <span className="font-mono font-bold text-stone-800 text-sm">
                      ৳ {(activeProfileHaji.subtotalAmount || (activeProfileHaji.finalTotalAmount ? activeProfileHaji.finalTotalAmount + (activeProfileHaji.discountAmount || 0) : 165000)).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                    <span className="text-amber-700 block text-[10px]">
                      এডমিন ছাড় {activeProfileHaji.discountPercent ? `(${activeProfileHaji.discountPercent}%)` : ''}:
                    </span>
                    <span className="font-mono font-bold text-sm">
                      ৳ {(activeProfileHaji.discountAmount || 0).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                    <span className="text-emerald-700 block text-[10px]">চূড়ান্ত নিট প্রদেয় ফি:</span>
                    <span className="font-mono font-extrabold text-sm text-emerald-800">
                      ৳ {(activeProfileHaji.finalTotalAmount || activeProfileHaji.subtotalAmount || 165000).toLocaleString('bn-BD')}
                    </span>
                  </div>

                  <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-950">
                    <span className="text-rose-700 block text-[10px]">অবশিষ্ট বকেয়া (Due):</span>
                    <span className="font-mono font-extrabold text-sm text-rose-800">
                      ৳ {(activeProfileHaji.dueAmount ?? Math.max(0, (activeProfileHaji.finalTotalAmount || activeProfileHaji.subtotalAmount || 165000) - (activeProfileHaji.paidAmount ?? 0))).toLocaleString('bn-BD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid 5: Attached Documents & Proofs */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 border-b border-stone-200 pb-2">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  সংযুক্ত ডকুমেন্টস ও প্রমাণপত্র (Attached Documents)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Photo */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 text-center space-y-2">
                    <span className="text-stone-500 font-semibold block text-xs">হাজীর পাসপোর্ট সাইজ ছবি</span>
                    {activeProfileHaji.pilgrimPhoto ? (
                      <div className="relative group">
                        <img
                          src={activeProfileHaji.pilgrimPhoto}
                          alt="হাজীর ছবি"
                          className="w-full h-28 object-cover rounded-lg border border-stone-200 cursor-pointer"
                          onClick={() =>
                            setPreviewDoc({
                              url: activeProfileHaji.pilgrimPhoto!,
                              title: 'হাজীর পাসপোর্ট সাইজ ছবি',
                              hajiName: activeProfileHaji.nameBn || activeProfileHaji.name
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              url: activeProfileHaji.pilgrimPhoto!,
                              title: 'হাজীর পাসপোর্ট সাইজ ছবি',
                              hajiName: activeProfileHaji.nameBn || activeProfileHaji.name
                            })
                          }
                          className="mt-2 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> বড় করে দেখুন
                        </button>
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-stone-400 bg-stone-50 rounded-lg border border-dashed border-stone-300">
                        ছবি দেওয়া হয়নি
                      </div>
                    )}
                  </div>

                  {/* NID Card */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 text-center space-y-2">
                    <span className="text-stone-500 font-semibold block text-xs">জাতীয় পরিচয়পত্র (NID) কপি</span>
                    {activeProfileHaji.nidDocumentUrl ? (
                      <div className="relative group">
                        <img
                          src={activeProfileHaji.nidDocumentUrl}
                          alt="NID ডকুমেন্ট"
                          className="w-full h-28 object-cover rounded-lg border border-stone-200 cursor-pointer"
                          onClick={() =>
                            setPreviewDoc({
                              url: activeProfileHaji.nidDocumentUrl!,
                              title: 'জাতীয় পরিচয়পত্র (NID) কপি',
                              hajiName: activeProfileHaji.nameBn || activeProfileHaji.name
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              url: activeProfileHaji.nidDocumentUrl!,
                              title: 'জাতীয় পরিচয়পত্র (NID) কপি',
                              hajiName: activeProfileHaji.nameBn || activeProfileHaji.name
                            })
                          }
                          className="mt-2 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> বড় করে দেখুন
                        </button>
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-stone-400 bg-stone-50 rounded-lg border border-dashed border-stone-300">
                        NID কপি দেওয়া হয়নি
                      </div>
                    )}
                  </div>

                  {/* Passport */}
                  <div className="p-3 bg-white rounded-xl border border-stone-200 text-center space-y-2">
                    <span className="text-stone-500 font-semibold block text-xs">পাসপোর্ট কপি</span>
                    {activeProfileHaji.passportDocumentUrl ? (
                      <div className="relative group">
                        <img
                          src={activeProfileHaji.passportDocumentUrl}
                          alt="পাসপোর্ট ডকুমেন্ট"
                          className="w-full h-28 object-cover rounded-lg border border-stone-200 cursor-pointer"
                          onClick={() =>
                            setPreviewDoc({
                              url: activeProfileHaji.passportDocumentUrl!,
                              title: 'পাসপোর্ট ডকুমেন্টের কপি',
                              hajiName: activeProfileHaji.nameBn || activeProfileHaji.name
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              url: activeProfileHaji.passportDocumentUrl!,
                              title: 'পাসপোর্ট ডকুমেন্টের কপি',
                              hajiName: activeProfileHaji.nameBn || activeProfileHaji.name
                            })
                          }
                          className="mt-2 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> বড় করে দেখুন
                        </button>
                      </div>
                    ) : (
                      <div className="h-28 flex items-center justify-center text-stone-400 bg-stone-50 rounded-lg border border-dashed border-stone-300">
                        পাসপোর্ট কপি দেওয়া হয়নি
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPrintHaji(activeProfileHaji)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-[#DCB473]" />
                  <span>রেজিস্ট্রেশন স্লিপ প্রিন্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIdCardHaji(activeProfileHaji)}
                  className="px-4 py-2 bg-[#0f2922] hover:bg-[#163d33] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs border border-[#DCB473]/30"
                >
                  <Receipt className="w-4 h-4" />
                  <span>হাজী আইডি কার্ড তৈরি</span>
                </button>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProfileHaji(null);
                      openInquiryModal(activeProfileHaji);
                    }}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>তথ্য সম্পাদনা (Edit)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <>
                    {activeProfileHaji.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleApprove(activeProfileHaji)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>আবেদন অনুমোদন করুন</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateInquiryStatus(activeProfileHaji.id, 'pending', 'পুনরায় অপেক্ষমাণ করা হলো')}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Clock className="w-4 h-4" />
                        <span>পুনরায় অপেক্ষমাণ (Pending) করুন</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfileHaji(null);
                        handleDelete(activeProfileHaji);
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      title="আবেদন মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>মুছুন</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedProfileHaji(null)}
                  className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {idCardHaji && (<HajiIdCard haji={idCardHaji} onClose={() => setIdCardHaji(null)} />)}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative border border-stone-200 space-y-3">
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <Compass className="w-5 h-5 text-[#b88e44]" />
              <div>
                <h4 className="font-bold text-sm text-[#0f2922]">{previewDoc.title}</h4>
                <p className="text-xs text-stone-500">হাজী: {previewDoc.hajiName}</p>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-stone-900 rounded-2xl p-2">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[65vh] w-auto rounded-xl object-contain shadow-md"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noreferrer"
                download="haji-doc.jpg"
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ডাউনলোড / নতুন ট্যাবে ওপেন</span>
              </a>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-[#0f2922] text-[#DCB473] font-bold rounded-xl text-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HAJI PRINT SLIP MODAL */}
      {printHaji && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473] max-h-[90vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setPrintHaji(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Header */}
            <div className="text-center pb-4 border-b-2 border-stone-800 space-y-1">
              <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider">
                মুত্তাকী হজ্ব কাফেলা ও ট্রাভেলস
              </span>
              <h3 className="text-xl font-bold text-[#0f2922]">
                হাজী প্রাক-নিবন্ধন আবেদন রশিদ ও সারসংক্ষেপ
              </h3>
              <p className="text-xs text-stone-500">
                হেড অফিস: দুপচাঁচিয়া বাসস্ট্যান্ড, বগুড়া | মোবাইল: ০১৭১১-২২৩৩৪৪
              </p>
            </div>

            {/* Slip Details Table */}
            <div className="border border-stone-300 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-2 bg-stone-100 p-2.5 font-bold border-b border-stone-300">
                <span>রেফারেন্স আইডি: {printHaji.registrationRef || printHaji.id}</span>
                <span className="text-right">আবেদনের তারিখ: {printHaji.date}</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-stone-500">হাজীর নাম:</span>
                  <span className="font-bold text-stone-900">{printHaji.nameBn || printHaji.name}</span>
                </div>
                {printHaji.nameEn && (
                  <div className="flex justify-between border-b pb-1 font-mono">
                    <span className="text-stone-500 font-sans">ইংরেজি নাম:</span>
                    <span className="font-semibold text-stone-800">{printHaji.nameEn}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-1">
                  <span className="text-stone-500">ইউজার আইডি (Login User ID):</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {printHaji.hajiUserId || printHaji.registrationRef || printHaji.phone}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-stone-500">মোবাইল নম্বর:</span>
                  <span className="font-mono font-bold text-stone-800">{printHaji.phone}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-stone-500">পাসপোর্ট নম্বর:</span>
                  <span className="font-mono text-stone-800">{printHaji.passportNo || 'নেই'}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-stone-500">NID নম্বর:</span>
                  <span className="font-mono text-stone-800">{printHaji.nidNo || 'নেই'}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-stone-500">নির্বাচিত প্যাকেজ:</span>
                  <span className="font-semibold text-emerald-900">{printHaji.serviceName}</span>
                </div>
                {printHaji.selectedGroup && (
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-stone-500">কাফেলা গ্রুপ:</span>
                    <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {printHaji.selectedGroup} (সর্বোচ্চ ৫০ জন)
                    </span>
                  </div>
                )}
                {printHaji.linkedCompanions && printHaji.linkedCompanions.length > 0 && (
                  <div className="border-b pb-1.5 space-y-1">
                    <span className="text-stone-500 block">যুক্তকৃত কাফেলা সঙ্গী/সহযাত্রীগণ:</span>
                    <div className="space-y-1">
                      {printHaji.linkedCompanions.map((comp) => (
                        <div key={comp.id} className="text-xs bg-emerald-50 text-emerald-950 px-2 py-1 rounded border border-emerald-200 flex justify-between">
                          <span className="font-bold">{comp.name}</span>
                          <span className="font-mono">আইডি: {comp.hajiUserId} {comp.group ? `(${comp.group})` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between border-b pb-1">
                  <span className="text-stone-500">মোট পার্টনার / যাত্রী:</span>
                  <span className="font-semibold text-stone-800">
                    {printHaji.totalHajPartner || '১ জন (একক)'}
                  </span>
                </div>
                {/* Pricing in Print Slip */}
                <div className="pt-2 border-t border-stone-200 space-y-1 bg-stone-50 p-2.5 rounded-xl text-stone-700">
                  <div className="flex justify-between">
                    <span>মূল প্রাক্কলিত ফি (Subtotal):</span>
                    <span className="font-mono font-bold text-stone-900">
                      ৳ {(printHaji.subtotalAmount || (printHaji.finalTotalAmount ? printHaji.finalTotalAmount + (printHaji.discountAmount || 0) : 0)).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  {printHaji.discountPercent && printHaji.discountPercent > 0 ? (
                    <>
                      <div className="flex justify-between text-amber-700 font-semibold">
                        <span>এডমিন বিশেষ ছাড় ({printHaji.discountPercent}%):</span>
                        <span className="font-mono tabular-nums">
                          - ৳ {(printHaji.discountAmount || 0).toLocaleString('bn-BD')}
                        </span>
                      </div>
                      {printHaji.discountNote && (
                        <div className="text-[10px] text-stone-500 italic">
                          নোট: {printHaji.discountNote}
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-emerald-950 text-sm pt-1 border-t border-stone-200">
                        <span>চূড়ান্ত নিট প্রদেয় ফি:</span>
                        <span className="font-mono font-extrabold text-emerald-800">
                          ৳ {(printHaji.finalTotalAmount || 0).toLocaleString('bn-BD')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between font-bold text-emerald-950 pt-1 border-t border-stone-200">
                      <span>মোট প্রদেয় ফি:</span>
                      <span className="font-mono font-extrabold text-emerald-800">
                        ৳ {(printHaji.subtotalAmount || printHaji.finalTotalAmount || 0).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment & Remaining Due in Print Slip */}
                <div className="pt-2 border-t border-stone-200 space-y-1 bg-amber-50/70 p-2.5 rounded-xl text-stone-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-600">টাকা জমার তারিখ:</span>
                    <span className="font-mono font-bold text-stone-900">{printHaji.paymentDate || printHaji.date}</span>
                  </div>
                  <div className="flex justify-between text-emerald-900 font-semibold">
                    <span>জমা দেওয়া টাকা (Paid Amount):</span>
                    <span className="font-mono font-bold text-sm">
                      ৳ {(printHaji.paidAmount ?? 0).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-950 font-bold border-t border-amber-200 pt-1">
                    <span>অবশিষ্ট বকেয়া (Due Balance):</span>
                    <span className="font-mono font-extrabold text-sm text-amber-900">
                      ৳ {(printHaji.dueAmount ?? Math.max(0, (printHaji.finalTotalAmount || printHaji.subtotalAmount || 0) - (printHaji.paidAmount ?? 0))).toLocaleString('bn-BD')}
                    </span>
                  </div>
                  {printHaji.paymentReceiptUrl && (
                    <div className="flex justify-between text-[11px] text-emerald-800 pt-0.5">
                      <span>টাকার রসিদ স্লিপ:</span>
                      <span className="font-semibold">সংযুক্ত ও সংরক্ষিত</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between border-b pb-1">
                  <span className="text-stone-500">বর্তমান স্ট্যাটাস:</span>
                  <span className="font-bold uppercase text-emerald-800">
                    {printHaji.status === 'approved' ? 'অনুমোদিত' : 'অপেক্ষমাণ (পেন্ডিং)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Seal and Signatures */}
            <div className="pt-6 flex justify-between items-end text-xs text-stone-600">
              <div className="text-center">
                <div className="w-28 border-b border-stone-400 mb-1" />
                <span>আবেদনকারী হাজীর স্বাক্ষর</span>
              </div>
              <div className="text-center">
                <div className="w-28 border-b border-stone-400 mb-1" />
                <span>কাফেলা পরিচালকের স্বাক্ষর ও সিল</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#0f2922] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>সরাসরি প্রিন্ট করুন</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintHaji(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HAJI DISCOUNT CONTROLLER MODAL */}
      {discountHaji && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473]">
            <button
              onClick={() => setDiscountHaji(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-4 space-y-1">
              <span className="text-[10px] font-bold text-[#b88e44] uppercase tracking-wider flex items-center gap-1">
                <BadgePercent className="w-3.5 h-3.5" />
                হাজীর জন্য বিশেষ ছাড় (%) নির্ধারণ ও মূল্য হ্রাস
              </span>
              <h3 className="text-lg font-bold text-[#0f2922]">
                {discountHaji.nameBn || discountHaji.name}
              </h3>
              <p className="text-xs text-stone-500">
                রেফারেন্স: <span className="font-mono font-semibold">{discountHaji.registrationRef || discountHaji.id}</span> | প্যাকেজ: {discountHaji.serviceName}
              </p>
            </div>

            {/* Modal Calculation logic */}
            {(() => {
              const subtotal = discountHaji.subtotalAmount || (discountHaji.finalTotalAmount ? discountHaji.finalTotalAmount + (discountHaji.discountAmount || 0) : 165000);
              const validPercent = Math.max(0, Math.min(100, Number(discountPercentInput) || 0));
              const discountAmt = Math.round((subtotal * validPercent) / 100);
              const finalTotal = Math.max(0, subtotal - discountAmt);

              return (
                <div className="space-y-4">
                  {/* Current Base Price display */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex justify-between items-center">
                    <span className="text-stone-600 font-semibold">মূল প্যাকেজ খরচ (Subtotal):</span>
                    <span className="font-mono text-base font-bold text-stone-900">
                      ৳ {subtotal.toLocaleString('bn-BD')}
                    </span>
                  </div>

                  {/* Discount Percentage Input & Quick Buttons */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                      <span>ছাড়ের হার (Discount Percentage %) *</span>
                      <span className="text-xs font-mono font-bold text-[#b88e44]">
                        {validPercent}% ছাড়
                      </span>
                    </label>

                    <div className="relative mb-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={discountPercentInput}
                        onChange={(e) => setDiscountPercentInput(Number(e.target.value) || 0)}
                        placeholder="যেকোনো পার্সেন্ট লিখুন (যেমন: ৫, ১০, ১৫)"
                        className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white text-stone-900"
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-stone-500 text-sm">
                        %
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[0, 5, 10, 15, 20, 25, 30, 50].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountPercentInput(pct)}
                          className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer border ${
                            discountPercentInput === pct
                              ? 'bg-[#0f2922] text-[#DCB473] border-[#0f2922]'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                          }`}
                        >
                          {pct === 0 ? '০% (রিমুভ)' : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Calculation Result Preview */}
                  <div className="p-4 bg-gradient-to-br from-[#0c241d] to-[#081813] text-white rounded-2xl border border-[#DCB473]/50 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-stone-300">
                      <span>মূল প্রাক্কলিত খরচ:</span>
                      <span className="font-mono tabular-nums">৳ {subtotal.toLocaleString('bn-BD')}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-300 font-bold">
                      <span>কর্তনকৃত ছাড়ের পরিমাণ ({validPercent}%):</span>
                      <span className="font-mono tabular-nums">- ৳ {discountAmt.toLocaleString('bn-BD')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/20 font-bold text-sm">
                      <span className="text-[#DCB473]">চূড়ান্ত নিট প্রদেয় মূল্য:</span>
                      <span className="font-mono text-lg font-extrabold text-[#DCB473] tabular-nums">
                        ৳ {finalTotal.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  </div>

                  {/* Optional Discount Note */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      ছাড়ের কারণ / রেফারেন্স নোট (ঐচ্ছিক)
                    </label>
                    <input
                      type="text"
                      value={discountNoteInput}
                      onChange={(e) => setDiscountNoteInput(e.target.value)}
                      placeholder="যেমন: পরিবার ভিত্তিক বিশেষ ছাড়, গ্রুপ কোটা, মুক্তিযোদ্ধা"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                    {discountHaji.discountPercent && discountHaji.discountPercent > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          removeHajiDiscount(discountHaji.id);
                          setDiscountHaji(null);
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ছাড় মুছে ফেলুন (০% রিসেট)</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDiscountHaji(null)}
                        className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                      >
                        বাতিল
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          applyHajiDiscount(discountHaji.id, validPercent, discountNoteInput);
                          setDiscountHaji(null);
                        }}
                        className="px-5 py-2 bg-[#0f2922] text-[#DCB473] hover:bg-[#184236] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>ছাড় সংরক্ষণ ও প্রয়োগ করুন</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* KAFELA GROUP ADD/EDIT MODAL */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative border-2 border-purple-300">
            <button
              type="button"
              onClick={() => setGroupModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-4 space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                কাফেলা গ্রুপ ব্যবস্থাপনা
              </span>
              <h3 className="text-lg font-bold text-[#0f2922]">
                {editingGroup ? `"${editingGroup.name}" সম্পাদনা ও আসন পরিবর্তন` : 'নতুন কাফেলা গ্রুপ তৈরি করুন'}
              </h3>
              <p className="text-xs text-stone-500">
                গ্রুপের নাম, সর্বোচ্চ যাত্রী ধারণক্ষমতা এবং দায়িত্বপ্রাপ্ত মোয়াল্লিম নির্ধারণ করুন।
              </p>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  গ্রুপের নাম * (যেমন: Group-A, Group-D, ইত্যাদি)
                </label>
                <input
                  type="text"
                  required
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                  placeholder="যেমন: Group-D"
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    সর্বোচ্চ আসন সংখ্যা *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={groupFormData.maxCapacity}
                    onChange={(e) =>
                      setGroupFormData({
                        ...groupFormData,
                        maxCapacity: Number(e.target.value) || 50
                      })
                    }
                    placeholder="৫০"
                    className="w-full px-3 py-2 font-mono font-bold text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={groupFormData.category}
                    onChange={(e) => setGroupFormData({ ...groupFormData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="হজ্ব ও ওমরাহ">হজ্ব ও ওমরাহ</option>
                    <option value="পবিত্র ওমরাহ">পবিত্র ওমরাহ</option>
                    <option value="পবিত্র হজ্ব">পবিত্র হজ্ব</option>
                    <option value="রমজান কাফেলা">রমজান কাফেলা</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  দায়িত্বপ্রাপ্ত মোয়াল্লিম / দলনেতার নাম
                </label>
                <input
                  type="text"
                  value={groupFormData.leader}
                  onChange={(e) => setGroupFormData({ ...groupFormData, leader: e.target.value })}
                  placeholder="যেমন: মাওলানা আব্দুর রহমান (মোয়াল্লেম)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  যাত্রার আনুমানিক তারিখ বা মৌসুম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={groupFormData.departureDate}
                  onChange={(e) => setGroupFormData({ ...groupFormData, departureDate: e.target.value })}
                  placeholder="যেমন: জিলহজ ১৪৪৭ হি. / রমজান ২০২৬"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingGroup ? 'আপডেট সংরক্ষণ' : 'গ্রুপ যোগ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
