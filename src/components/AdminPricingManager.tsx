import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { PricingCategory, PricingItem, KafelaGroup } from '../types';
import { getAllGroupsOccupancy, MAX_PILGRIMS_PER_GROUP } from '../data/kafelaGroups';
import {
  BadgePercent,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  RotateCcw,
  Building,
  Plane,
  Receipt,
  Layers,
  Search,
  Sparkles,
  HelpCircle,
  X,
  Save,
  Check,
  AlertCircle,
  Users,
  Calendar,
  Compass,
  ShieldCheck,
  UserCheck,
  Clock,
  MapPin,
  Tag,
  ArrowRight
} from 'lucide-react';

export type PricingTab = PricingCategory | 'group';

export const AdminPricingManager: React.FC = () => {
  const {
    pricingConfig,
    addPricingItem,
    updatePricingItem,
    deletePricingItem,
    resetPricingToDefaults,
    kafelaGroups,
    addKafelaGroup,
    updateKafelaGroup,
    deleteKafelaGroup,
    resetKafelaGroups,
    inquiries,
    requestConfirm,
    showToast,
    isSubAdmin
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<PricingTab>('package');
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state for pricing items modal
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // Group Management states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<KafelaGroup | null>(null);
  const [groupFilterType, setGroupFilterType] = useState<'all' | 'hajj' | 'umrah' | 'both'>('all');

  const [groupForm, setGroupForm] = useState({
    name: '',
    type: 'both' as 'hajj' | 'umrah' | 'both',
    category: 'হজ্ব ও ওমরাহ কাফেলা',
    leader: '',
    maxCapacity: MAX_PILGRIMS_PER_GROUP,
    departureDate: '',
    departureMonth: ''
  });

  // Form for new pricing item
  const [newItemForm, setNewItemForm] = useState({
    title: '',
    category: 'package' as PricingCategory,
    price: 0,
    subtitle: '',
    description: '',
    unit: 'জনপ্রতি',
    durationDays: 15
  });

  // Calculate live occupancy for all kafela groups
  const groupsOccupancy = useMemo(
    () => getAllGroupsOccupancy(kafelaGroups, inquiries),
    [kafelaGroups, inquiries]
  );

  const totalGroupCapacity = useMemo(
    () => groupsOccupancy.reduce((sum, g) => sum + g.maxCapacity, 0),
    [groupsOccupancy]
  );

  const totalRegisteredInGroups = useMemo(
    () => groupsOccupancy.reduce((sum, g) => sum + g.currentCount, 0),
    [groupsOccupancy]
  );

  const totalSeatsLeftInGroups = useMemo(
    () => groupsOccupancy.reduce((sum, g) => sum + g.seatsLeft, 0),
    [groupsOccupancy]
  );

  const getCategoryItems = (cat: PricingCategory): PricingItem[] => {
    switch (cat) {
      case 'package':
        return pricingConfig.packages;
      case 'room':
        return pricingConfig.rooms;
      case 'airfare':
        return pricingConfig.airfares;
      case 'incidental':
        return pricingConfig.incidentals;
      default:
        return [];
    }
  };

  const currentItems = activeTab !== 'group' ? getCategoryItems(activeTab as PricingCategory) : [];

  const filteredItems = currentItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const filteredGroupsOccupancy = groupsOccupancy.filter(({ group }) => {
    if (groupFilterType !== 'all') {
      if (groupFilterType === 'both' && group.type !== 'both') return false;
      if (groupFilterType === 'hajj' && group.type !== 'hajj' && group.type !== 'both') return false;
      if (groupFilterType === 'umrah' && group.type !== 'umrah' && group.type !== 'both') return false;
    }
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      group.name.toLowerCase().includes(q) ||
      group.leader.toLowerCase().includes(q) ||
      (group.departureDate && group.departureDate.toLowerCase().includes(q)) ||
      (group.category && group.category.toLowerCase().includes(q))
    );
  });

  const tabMeta: Record<
    PricingTab,
    { label: string; icon: React.ComponentType<{ className?: string }>; desc: string; count: number }
  > = {
    package: {
      label: 'হজ ও ওমরাহ্',
      icon: Layers,
      desc: 'হজ্ব ও ওমরাহ সফরের মূল প্যাকেজের ভিত্তি মূল্য নির্ধারণ (BDT ৳)',
      count: pricingConfig.packages.length
    },
    room: {
      label: 'হোটেল রুম',
      icon: Building,
      desc: 'মক্কা ও মদিনায় ২-বেড, ৩-বেড, ৪-বেড বা শেয়ারিং রুম পছন্দের মূল্য',
      count: pricingConfig.rooms.length
    },
    airfare: {
      label: 'বিমান ও টিকিট',
      icon: Plane,
      desc: 'সরাসরি ফ্লাইট, ট্রানজিট ফ্লাইট অথবা বিজনেস ক্লাস টিকিটের খরচ',
      count: pricingConfig.airfares.length
    },
    incidental: {
      label: 'আনুষঙ্গিক খরচ',
      icon: Receipt,
      desc: 'ভিসা ও ইনস্যুরেন্স, মোয়াল্লিম ফি, মিনা-আরাফাত ক্যাম্প ও কুরবানি খরচ',
      count: pricingConfig.incidentals.length
    },
    group: {
      label: 'গ্রুপ তৈরি',
      icon: Users,
      desc: 'কাফেলা গ্রুপ তৈরি, এডিট ও আসন সংখ্যা নিয়ন্ত্রণ (৫০ জন/গ্রুপ)',
      count: kafelaGroups.length
    }
  };

  const handleOpenNewModal = () => {
    if (activeTab === 'group') {
      handleOpenCreateGroup();
      return;
    }

    const cat = activeTab as PricingCategory;
    const defaultUnit =
      cat === 'package'
        ? 'জনপ্রতি'
        : cat === 'room'
        ? 'জনপ্রতি অতিরিক্ত'
        : cat === 'airfare'
        ? 'জনপ্রতি টিকিট'
        : 'জনপ্রতি চার্জ';

    setNewItemForm({
      title: '',
      category: cat,
      price: cat === 'package' ? 150000 : cat === 'airfare' ? 85000 : 15000,
      subtitle: '',
      description: '',
      unit: defaultUnit,
      durationDays: cat === 'package' ? 15 : (undefined as any)
    });
    setIsNewItemModalOpen(true);
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.title.trim()) {
      showToast('অনুগ্রহ করে আইটেমের নাম/শিরোনাম লিখুন!');
      return;
    }

    addPricingItem({
      title: newItemForm.title.trim(),
      category: newItemForm.category,
      price: Math.max(0, Number(newItemForm.price) || 0),
      subtitle: newItemForm.subtitle.trim() || undefined,
      description: newItemForm.description.trim() || undefined,
      unit: newItemForm.unit.trim() || undefined,
      durationDays: newItemForm.category === 'package' ? Number(newItemForm.durationDays) || undefined : undefined
    });

    setIsNewItemModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    updatePricingItem({
      ...editingItem,
      title: editingItem.title.trim(),
      price: Math.max(0, Number(editingItem.price) || 0)
    });
    setEditingItem(null);
  };

  const handleDeleteItem = (item: PricingItem) => {
    requestConfirm({
      title: 'মূল্য আইটেম মুছে ফেলা',
      message: `আপনি কি নিশ্চিতভাবে "${item.title}" তালিকা থেকে মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => {
        deletePricingItem(item.id, item.category);
      }
    });
  };

  const handleResetDefaults = () => {
    requestConfirm({
      title: 'ডিফল্ট মূল্যে রিসেট',
      message: 'আপনি কি নিশ্চিত যে হজ্ব, হোটেল, বিমান ও আনুসঙ্গিক খরচের সকল রেট পূর্বনির্ধারিত ফ্যাক্টরি মানে রিসেট করতে চান?',
      confirmText: 'হ্যাঁ, রিসেট করুন',
      onConfirm: () => {
        resetPricingToDefaults();
      }
    });
  };

  // Group Handlers
  const handleOpenCreateGroup = () => {
    const nextLetter = String.fromCharCode(65 + (kafelaGroups.length % 26));
    setEditingGroup(null);
    setGroupForm({
      name: `Group-${nextLetter}`,
      type: 'both',
      category: 'হজ্ব ও ওমরাহ কাফেলা',
      leader: '',
      maxCapacity: MAX_PILGRIMS_PER_GROUP,
      departureDate: 'রমজান ও হজ ২০২৬',
      departureMonth: `কাফেলা গ্রুপ - ${nextLetter} (Group-${nextLetter})`
    });
    setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: KafelaGroup) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      type: group.type,
      category: group.category || 'হজ্ব ও ওমরাহ কাফেলা',
      leader: group.leader,
      maxCapacity: group.maxCapacity || MAX_PILGRIMS_PER_GROUP,
      departureDate: group.departureDate || '',
      departureMonth: group.departureMonth || ''
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      showToast('অনুগ্রহ করে গ্রুপের নাম লিখুন (যেমন: Group-D)!');
      return;
    }
    if (!groupForm.leader.trim()) {
      showToast('অনুগ্রহ করে প্রধান মোয়াল্লেম বা কাফেলা পরিচালকের নাম লিখুন!');
      return;
    }

    if (editingGroup) {
      updateKafelaGroup({
        ...editingGroup,
        name: groupForm.name.trim(),
        type: groupForm.type,
        category: groupForm.category.trim() || undefined,
        leader: groupForm.leader.trim(),
        maxCapacity: Math.max(1, Number(groupForm.maxCapacity) || MAX_PILGRIMS_PER_GROUP),
        departureDate: groupForm.departureDate.trim() || undefined,
        departureMonth: groupForm.departureMonth.trim() || undefined
      });
    } else {
      const duplicate = kafelaGroups.find(
        (g) => g.name.toLowerCase().trim() === groupForm.name.toLowerCase().trim()
      );
      if (duplicate) {
        showToast(`"${groupForm.name}" নামের গ্রুপ ইতিমধ্যে বিদ্যমান। ভিন্ন নাম ব্যবহার করুন।`);
        return;
      }
      addKafelaGroup({
        name: groupForm.name.trim(),
        type: groupForm.type,
        category: groupForm.category.trim() || undefined,
        leader: groupForm.leader.trim(),
        maxCapacity: Math.max(1, Number(groupForm.maxCapacity) || MAX_PILGRIMS_PER_GROUP),
        departureDate: groupForm.departureDate.trim() || undefined,
        departureMonth: groupForm.departureMonth.trim() || undefined
      });
    }
    setIsGroupModalOpen(false);
  };

  const handleDeleteGroup = (group: KafelaGroup) => {
    const occ = groupsOccupancy.find((g) => g.group.id === group.id);
    const pilgrimCount = occ ? occ.currentCount : 0;

    requestConfirm({
      title: 'কাফেলা গ্রুপ মুছে ফেলা',
      message:
        pilgrimCount > 0
          ? `সতর্কতা: "${group.name}" গ্রুপে বর্তমানে ${pilgrimCount} জন হাজী নিবন্ধিত আছেন! আপনি কি নিশ্চিতভাবে এই গ্রুপটি মুছে ফেলতে চান?`
          : `আপনি কি নিশ্চিতভাবে "${group.name}" গ্রুপটি মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => {
        deleteKafelaGroup(group.id);
      }
    });
  };

  const handleResetGroups = () => {
    requestConfirm({
      title: 'ডিফল্ট গ্রুপ রিসেট',
      message:
        'আপনি কি নিশ্চিত যে সকল কাফেলা গ্রুপ পূর্বনির্ধারিত ডিফল্ট তালিকায় (Group-A, B, C ও DEC 2026) রিসেট করতে চান?',
      confirmText: 'হ্যাঁ, রিসেট করুন',
      onConfirm: () => {
        resetKafelaGroups();
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1f1a] via-[#12362c] to-[#0f2922] text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DCB473]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DCB473] bg-[#DCB473]/20 px-3 py-1 rounded-full border border-[#DCB473]/40">
                মূল্য নির্ধারণ ও গ্রুপ কন্ট্রোল
              </span>
              <span className="text-[11px] text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                সরাসরি লাইভ ক্যালকুলেটর ও রেজিস্ট্রেশন যুক্ত
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              হজ ও ওমরাহ্, হোটেল, বিমান, খরচ এবং কাফেলা গ্রুপ তৈরি
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              এখানে নির্ধারিত মূল্য অনুযায়ী এবং তৈরিকৃত কাফেলা গ্রুপ হাজী নিবন্ধন ফরমের ৩ নম্বর অপশনে 'কাফেলা গ্রুপ নির্বাচন' ড্রপডাউনে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে। প্রতিটি গ্রুপে সর্বোচ্চ ৫০ জন হাজী অন্তর্ভুক্ত হতে পারেন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!isSubAdmin ? (
              <>
                {activeTab === 'group' ? (
                  <>
                    <button
                      onClick={handleResetGroups}
                      className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-stone-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                      title="ডিফল্ট কাফেলা গ্রুপে রিসেট"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-stone-300" />
                      <span>ডিফল্ট গ্রুপ রিসেট</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleOpenNewModal}
                      className="px-4 py-2.5 bg-[#DCB473] hover:bg-[#c9a05e] text-[#0f2922] font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>নতুন মূল্য নির্ধারণ করুন</span>
                    </button>
                    <button
                      onClick={handleResetDefaults}
                      className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-stone-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                      title="ডিফল্ট মূল্যে রিসেট"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-stone-300" />
                      <span>ডিফল্ট রিসেট</span>
                    </button>
                  </>
                )}
              </>
            ) : (
              <span className="px-3.5 py-2 bg-white/15 text-[#DCB473] font-bold text-xs rounded-xl border border-white/20">
                সাব-এডমিন (রিড-অনলি মোড)
              </span>
            )}
          </div>
        </div>

        {/* 5 Tabs Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          {(Object.keys(tabMeta) as PricingTab[]).map((tab) => {
            const meta = tabMeta[tab];
            const Icon = meta.icon;
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-left p-3.5 rounded-2xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white/20 border-[#DCB473] text-white shadow-sm ring-1 ring-[#DCB473]/50'
                    : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#DCB473]' : 'text-stone-400'}`} />
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-black/20 text-[#DCB473]">
                    {meta.count} টি
                  </span>
                </div>
                <div className="text-xs font-bold truncate text-white">{meta.label}</div>
                <div className="text-[10px] text-stone-300 line-clamp-1 mt-0.5">{meta.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Tabs (All 5 options) */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(Object.keys(tabMeta) as PricingTab[]).map((tab) => {
            const meta = tabMeta[tab];
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>{meta.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-[#DCB473] text-[#0f2922]' : 'bg-stone-100 text-stone-500'
                }`}>
                  {meta.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'group' ? 'গ্রুপ বা মোয়াল্লেম খুঁজুন...' : 'আইটেম বা বিবরণ খুঁজুন...'}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-stone-50/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. MAIN CONTENT: GROUP MANAGEMENT or PRICING ITEMS */}
      {activeTab === 'group' ? (
        <div className="space-y-6">
          {/* Group Capacity Stats Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>মোট কাফেলা গ্রুপ</span>
                <Users className="w-4 h-4 text-[#b88e44]" />
              </div>
              <div className="text-xl font-bold text-stone-900 font-mono">
                {kafelaGroups.length} টি গ্রুপ
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">নিবন্ধন ড্রপডাউনে অন্তর্ভুক্ত</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>মোট আসন ক্ষমতা</span>
                <Compass className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-700 font-mono">
                {totalGroupCapacity} জন
              </div>
              <p className="text-[10px] text-emerald-600 mt-0.5">প্রতি গ্রুপে ৫০ জন সর্বোচ্চ</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>বর্তমান হাজী নিবন্ধন</span>
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-700 font-mono">
                {totalRegisteredInGroups} জন
              </div>
              <p className="text-[10px] text-blue-500 mt-0.5">আবেদনে গ্রুপ সিলেক্ট করেছেন</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-semibold mb-1">
                <span>খালি আসন সংখ্যা</span>
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-amber-700 font-mono">
                {totalSeatsLeftInGroups} টি আসন
              </div>
              <p className="text-[10px] text-amber-600 mt-0.5">নতুন নিবন্ধনের জন্য অবশিষ্ট</p>
            </div>
          </div>

          {/* Group Filter Sub-bar */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#b88e44]" />
                  <span>কাফেলা গ্রুপ তৈরি ও নিয়ন্ত্রণ তালিকা</span>
                  <span className="text-xs text-stone-500 font-normal">
                    ({filteredGroupsOccupancy.length} টি গ্রুপ প্রদর্শিত)
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  এখানে গ্রুপ তৈরি বা এডিট করলে স্বয়ংক্রিয়ভাবে হাজী নিবন্ধন ফরম ও হজ-ওমরাহ আয়-ব্যয় শিটের ড্রপডাউনে যুক্ত হবে।
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs font-semibold">
                  <button
                    onClick={() => setGroupFilterType('all')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      groupFilterType === 'all'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    সব ({groupsOccupancy.length})
                  </button>
                  <button
                    onClick={() => setGroupFilterType('hajj')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      groupFilterType === 'hajj'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    মূল হজ
                  </button>
                  <button
                    onClick={() => setGroupFilterType('umrah')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      groupFilterType === 'umrah'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    ওমরাহ্ হজ
                  </button>
                  <button
                    onClick={() => setGroupFilterType('both')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      groupFilterType === 'both'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    উভয়
                  </button>
                </div>

              </div>
            </div>

            {filteredGroupsOccupancy.length === 0 ? (
              <div className="p-12 text-center text-stone-500">
                <Users className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-stone-700">কোনো কাফেলা গ্রুপ পাওয়া যায়নি</p>
                <p className="text-xs text-stone-500 mt-1">
                  {searchTerm ? 'অনুসন্ধানের সাথে কোনো গ্রুপ মেলেনি।' : 'নতুন একটি কাফেলা গ্রুপ তৈরি করুন।'}
                </p>
                {!isSubAdmin && (
                  <button
                    onClick={handleOpenCreateGroup}
                    className="mt-4 px-4 py-2 bg-[#DCB473] text-[#0f2922] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    + নতুন গ্রুপ তৈরি করুন
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filteredGroupsOccupancy.map(({ group, currentCount, maxCapacity, seatsLeft, isFull, progressPercent }, idx) => (
                  <div
                    key={group.id}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-stone-400">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                            {group.name}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            group.type === 'hajj'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : group.type === 'umrah'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {group.type === 'hajj'
                            ? 'মূল হজ্ব কাফেলা'
                            : group.type === 'umrah'
                            ? 'পবিত্র ওমরাহ্ কাফেলা'
                            : 'হজ্ব ও ওমরাহ উভয়'}
                        </span>

                        {isFull ? (
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                            আসন পূর্ণ (৫০/৫০)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {seatsLeft} টি আসন খালি
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                        <span className="flex items-center gap-1 text-stone-800 font-medium">
                          <Compass className="w-3.5 h-3.5 text-[#b88e44]" />
                          <span>পরিচালক / মোয়াল্লেম: <b>{group.leader}</b></span>
                        </span>

                        {group.departureDate && (
                          <span className="flex items-center gap-1 text-stone-600">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>সফর: {group.departureDate}</span>
                          </span>
                        )}

                        {group.category && (
                          <span className="flex items-center gap-1 text-stone-500">
                            <Tag className="w-3.5 h-3.5 text-stone-400" />
                            <span>{group.category}</span>
                          </span>
                        )}
                      </div>

                      {/* Visual Capacity Bar */}
                      <div className="pt-1 max-w-md">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-stone-500">
                            আসন ধারণক্ষমতা: <b className="text-stone-900">{currentCount}</b> / {maxCapacity} জন
                          </span>
                          <span className="font-mono text-stone-600 font-semibold">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFull
                                ? 'bg-rose-500'
                                : progressPercent > 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                      <div className="text-right">
                        <div className="text-xs font-bold text-stone-700">
                          হাজী রেজিস্ট্রেশন
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ড্রপডাউনে দৃশ্যমান</span>
                        </div>
                      </div>

                      {!isSubAdmin ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditGroup(group)}
                            className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                            title="গ্রুপ সম্পাদনা"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group)}
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="গ্রুপ মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-stone-400 px-2 py-1 bg-stone-100 rounded-lg">
                          রিড-অনলি
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isSubAdmin && filteredGroupsOccupancy.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#DCB473]/40 bg-[#fffaf0] p-4">
              <div>
                <p className="text-sm font-bold text-stone-900">আরেকটি গ্রুপ তৈরি করতে চান?</p>
                <p className="mt-0.5 text-xs text-stone-600">উপরের বিদ্যমান গ্রুপগুলো পর্যালোচনা বা এডিট/ডিলিট করার পর নিচের বাটন দিয়ে নতুন গ্রুপ যোগ করুন।</p>
              </div>
              <button
                onClick={handleOpenCreateGroup}
                className="shrink-0 px-4 py-2.5 bg-[#DCB473] hover:bg-[#c9a05e] text-[#0f2922] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন গ্রুপ তৈরি করুন</span>
              </button>
            </div>
          )}

          {/* Group Integration Notice Box */}
          <div className="bg-purple-50/70 border border-purple-200/90 rounded-3xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
              <Users className="w-5 h-5 text-purple-700" />
              <span>কাফেলা গ্রুপ ড্রপডাউন ও হাজী রেজিস্ট্রেশন সংযোগ নির্দেশিকা</span>
            </div>
            <p className="text-xs text-purple-900 leading-relaxed">
              আপনি এখানে যেকোনো নতুন কাফেলা গ্রুপ তৈরি, এডিট বা ডিলিট করলে সাথে সাথেই তা সমগ্র অ্যাপ্লিকেশনে কার্যকর হয়:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3 bg-white/80 rounded-xl border border-purple-200 text-stone-700">
                <span className="font-bold text-stone-900 block mb-1">১. হাজী নিবন্ধন ফরম</span>
                ওয়েবসাইটে লাইভ রেজিস্ট্রেশন ফরমের <strong>৩. কাফেলা গ্রুপ নির্বাচন</strong> ড্রপডাউনে তাৎক্ষণিক প্রদর্শিত হবে।
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-purple-200 text-stone-700">
                <span className="font-bold text-stone-900 block mb-1">২. এডমিন হাজী আবেদন</span>
                এডমিন প্যানেলে <strong>"হাজী নিবন্ধন"</strong> ও <strong>"নতুন হাজী যোগ করুন"</strong> মডালে উক্ত গ্রুপ সিলেক্ট করে হাজী এন্ট্রি দেওয়া যাবে।
              </div>
              <div className="p-3 bg-white/80 rounded-xl border border-purple-200 text-stone-700">
                <span className="font-bold text-stone-900 block mb-1">৩. আয়-ব্যয় ও আসন সীমা</span>
                <strong>"হজ ও ওমরাহ্ আয়-ব্যয়"</strong> সেকশনে গ্রুপভিত্তিক ফিল্টারিং কাজ করবে এবং ৫০ জনের বেশি হলে আসন পূর্ণ সতর্কবার্তা দিবে।
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 4. PRICING ITEMS LIST (Package, Room, Airfare, Incidental) */
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>{tabMeta[activeTab].label} তালিকা</span>
                <span className="text-xs text-stone-500 font-normal">
                  ({filteredItems.length} টি আইটেম সক্রিয়)
                </span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {tabMeta[activeTab].desc}
              </p>
            </div>

            {!isSubAdmin && (
              <button
                onClick={handleOpenNewModal}
                className="px-3 py-1.5 bg-[#0f2922] hover:bg-[#153a30] text-[#DCB473] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন যোগ করুন</span>
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-stone-500">
              <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700">কোনো আইটেম পাওয়া যায়নি</p>
              <p className="text-xs text-stone-500 mt-1">
                {searchTerm ? 'অনুসন্ধানের সাথে কোনো ফলাফল মেলেনি।' : 'এই ক্যাটাগরিতে এখনো কোনো আইটেম যোগ করা হয়নি।'}
              </p>
              {!isSubAdmin && (
                <button
                  onClick={handleOpenNewModal}
                  className="mt-4 px-4 py-2 bg-[#DCB473] text-[#0f2922] text-xs font-bold rounded-xl cursor-pointer"
                >
                  নতুন আইটেম যোগ করুন
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-400">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900">{item.title}</h4>
                      {item.durationDays && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                          {item.durationDays} দিন
                        </span>
                      )}
                      {item.price === 0 && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                          প্যাকেজে অন্তর্ভুক্ত (বিনামূল্যে)
                        </span>
                      )}
                    </div>

                    {item.subtitle && (
                      <p className="text-xs font-medium text-[#b88e44]">{item.subtitle}</p>
                    )}

                    {item.description && (
                      <p className="text-xs text-stone-600 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Price Tag */}
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-bold text-[#0f2922] font-mono tabular-nums">
                        {item.price === 0 ? '৳ ০ (০ টাকা)' : `৳ ${item.price.toLocaleString('bn-BD')}`}
                      </div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {item.unit || 'জনপ্রতি'}
                      </div>
                    </div>

                    {/* Actions */}
                    {!isSubAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingItem({ ...item })}
                          className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                          title="মূল্য ও তথ্য সম্পাদনা"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-stone-400 px-2 py-1 bg-stone-100 rounded-lg">
                        রিড-অনলি
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Haji Discount Feature Guidance Box */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-3xl p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
          <BadgePercent className="w-5 h-5 text-amber-700" />
          <span>হাজীদের জন্য বিশেষ ছাড় (ডিসকাউন্ট) পার্সেন্ট নিয়ন্ত্রণ নির্দেশিকা</span>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          প্রতিটি নিবন্ধিত হাজীর প্রোফাইলে (<strong>"হাজী নিবন্ধন"</strong> ট্যাবে) যেকোনো হাজীর মোট খরচের ওপর এডমিন ইচ্ছামত যেকোনো শতাংশ (যেমন ৫%, ১০%, ১৫%, ২০% ইত্যাদি) বিশেষ ছাড় বা ডিসকাউন্ট প্রদান করতে পারেন। ডিসকাউন্ট দেওয়ার পর স্বয়ংক্রিয়ভাবে মোট প্রদেয় মূল্য সমন্বয় হয়ে যাবে এবং যেকোনো সময় এই ছাড় পরিবর্তন (এডিট) বা ডিলিট করা সম্ভব।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-stone-700">
            <span className="font-bold text-stone-900 block mb-1">১. ফরমের হিসাব সংরক্ষণ</span>
            হাজী নিবন্ধন ফরম পূরণের সময় выбран প্যাকেজ, রুম, বিমান ও সেবা অনুযায়ী মোট মূল্যের হিসাব কেন্দ্রীয়ভাবে ডেটাবেজে জমা থাকে।
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-stone-700">
            <span className="font-bold text-stone-900 block mb-1">২. পার্সেন্টেজ ডিসকাউন্ট</span>
            এডমিন প্যানেলে সংশ্লিষ্ট হাজীর কার্ড থেকে সরাসরি "পার্সেন্ট ছাড় (%)" বাটনে ক্লিক করে ছাড় যুক্ত করতে পারবেন।
          </div>
          <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-stone-700">
            <span className="font-bold text-stone-900 block mb-1">৩. রিসিপ্ট প্রিন্ট ও এডিট</span>
            প্রিন্টেবল রসিদে মূল খরচ, ডিসকাউন্ট পার্সেন্ট এবং কর্তনকৃত নিট পরিশোধযোগ্য মূল্য স্বচ্ছভাবে দেখানো হয়।
          </div>
        </div>
      </div>

      {/* MODAL: Create or Edit Kafela Group */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473]">
            <button
              onClick={() => setIsGroupModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-4">
              <span className="text-[10px] font-bold text-[#b88e44] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                কাফেলা গ্রুপ ব্যবস্থাপনা
              </span>
              <h3 className="text-lg font-bold text-[#0f2922]">
                {editingGroup ? `গ্রুপ "${editingGroup.name}" সম্পাদনা` : 'নতুন কাফেলা গ্রুপ তৈরি করুন'}
              </h3>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    গ্রুপের নাম (Group Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: Group-D"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    কাফেলার ধরন *
                  </label>
                  <select
                    value={groupForm.type}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        type: e.target.value as 'hajj' | 'umrah' | 'both'
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  >
                    <option value="both">উভয় (হজ্ব ও ওমরাহ কাফেলা)</option>
                    <option value="hajj">মূল হজ্ব কাফেলা (Hajj)</option>
                    <option value="umrah">পবিত্র ওমরাহ কাফেলা (Umrah)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  প্রধান মোয়াল্লেম / কাফেলা পরিচালক *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাওলানা আব্দুল হক (প্রধান মোয়াল্লেম)"
                  value={groupForm.leader}
                  onChange={(e) => setGroupForm({ ...groupForm, leader: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    সর্বোচ্চ আসন সংখ্যা (Capacity)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={groupForm.maxCapacity}
                    onChange={(e) =>
                      setGroupForm({
                        ...groupForm,
                        maxCapacity: Number(e.target.value) || MAX_PILGRIMS_PER_GROUP
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">ডিফল্ট: ৫০ জন প্রতি গ্রুপ</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ক্যাটাগরি / ট্যাগ
                  </label>
                  <input
                    type="text"
                    value={groupForm.category}
                    onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}
                    placeholder="হজ্ব ও ওমরাহ কাফেলা"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  সম্ভাব্য সফর বা ফ্লাইটের সময়কাল
                </label>
                <input
                  type="text"
                  placeholder="যেমন: রমজান ও শীতকালীন কাফেলা ২০২৬ বা জিলহজ ১৪৪৭ হি."
                  value={groupForm.departureDate}
                  onChange={(e) => setGroupForm({ ...groupForm, departureDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ড্রপডাউন প্রদর্শনী লেবেল (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder={`কাফেলা গ্রুপ - ${groupForm.name}`}
                  value={groupForm.departureMonth}
                  onChange={(e) => setGroupForm({ ...groupForm, departureMonth: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 space-y-1">
                <span className="font-bold text-stone-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  স্বয়ংক্রিয় সিঙ্ক্রোনাইজেশন:
                </span>
                <p>
                  এই গ্রুপটি সেভ হওয়ার সাথে সাথে হাজী নিবন্ধন ফরম (Section 3: কাফেলা গ্রুপ নির্বাচন) এবং এডমিন রেজিস্ট্রেশন লিস্টে লাইভ যুক্ত হয়ে যাবে।
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f2922] text-[#DCB473] hover:bg-[#163a30] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {editingGroup ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{editingGroup ? 'পরিবর্তন সংরক্ষণ করুন' : 'গ্রুপ তৈরি করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Existing Pricing Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473]">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-4">
              <span className="text-[10px] font-bold text-[#b88e44] uppercase tracking-wider">
                মূল্য নির্ধারণ ও তথ্য সম্পাদনা
              </span>
              <h3 className="text-lg font-bold text-[#0f2922]">
                {editingItem.title}
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  শিরোনাম / প্যাকেজের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    নির্ধারিত মূল্য (BDT ৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, price: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    একক (Unit)
                  </label>
                  <input
                    type="text"
                    value={editingItem.unit || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    placeholder="যেমন: জনপ্রতি"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>
              </div>

              {editingItem.category === 'package' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    সফরের স্থায়িত্বকাল (Duration in Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.durationDays || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        durationDays: Number(e.target.value) || undefined
                      })
                    }
                    placeholder="যেমন: ১৫ বা ৪০"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  উপ-শিরোনাম (Subtitle / Key Feature)
                </label>
                <input
                  type="text"
                  value={editingItem.subtitle || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                  placeholder="সংক্ষিপ্ত বৈশিষ্ট্য"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  বিস্তারিত বিবরণ (Description)
                </label>
                <textarea
                  rows={3}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="প্যাকেজ বা খরচের সুযোগ-সুবিধা লিখুন..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f2922] text-[#DCB473] hover:bg-[#163a30] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>পরিবর্তন সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Pricing Item */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473]">
            <button
              onClick={() => setIsNewItemModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-4">
              <span className="text-[10px] font-bold text-[#b88e44] uppercase tracking-wider">
                নতুন মূল্য সংযোজন
              </span>
              <h3 className="text-lg font-bold text-[#0f2922]">
                {tabMeta[newItemForm.category].label} তৈরি করুন
              </h3>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ক্যাটাগরি নির্বাচন *
                </label>
                <select
                  value={newItemForm.category}
                  onChange={(e) =>
                    setNewItemForm({
                      ...newItemForm,
                      category: e.target.value as PricingCategory
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                >
                  <option value="package">হজ ও ওমরাহ্ প্যাকেজ (Package)</option>
                  <option value="room">হোটেল রুম প্যাকেজ (Hotel Room)</option>
                  <option value="airfare">বিমান ও টিকিট (Airfare)</option>
                  <option value="incidental">আনুষঙ্গিক খরচ (Incidental Expenses)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  শিরোনাম / আইটেমের নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: এক্সক্লুসিভ ওমরাহ প্যাকেজ (১২ দিন)"
                  value={newItemForm.title}
                  onChange={(e) => setNewItemForm({ ...newItemForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    নির্ধারিত মূল্য (BDT ৳) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemForm.price}
                    onChange={(e) =>
                      setNewItemForm({ ...newItemForm, price: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    একক (Unit)
                  </label>
                  <input
                    type="text"
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    placeholder="যেমন: জনপ্রতি"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>
              </div>

              {newItemForm.category === 'package' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    স্থায়িত্বকাল (দিন)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemForm.durationDays || ''}
                    onChange={(e) =>
                      setNewItemForm({
                        ...newItemForm,
                        durationDays: Number(e.target.value) || 15
                      })
                    }
                    placeholder="১৫"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  সংক্ষিপ্ত উপ-শিরোনাম
                </label>
                <input
                  type="text"
                  value={newItemForm.subtitle}
                  onChange={(e) => setNewItemForm({ ...newItemForm, subtitle: e.target.value })}
                  placeholder="যেমন: ৫ তারকা হোটেল ও এক্সক্লুসিভ সুবিধা"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  বিস্তারিত বিবরণ
                </label>
                <textarea
                  rows={3}
                  value={newItemForm.description}
                  onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                  placeholder="এই ফি বা প্যাকেজের মধ্যে কী কী অন্তর্ভুক্ত রয়েছে..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f2922] text-[#DCB473] hover:bg-[#163a30] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>তালিকাভুক্ত করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
