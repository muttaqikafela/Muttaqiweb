import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { PricingCategory, PricingItem } from '../types';
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
  AlertCircle
} from 'lucide-react';

export const AdminPricingManager: React.FC = () => {
  const {
    pricingConfig,
    addPricingItem,
    updatePricingItem,
    deletePricingItem,
    resetPricingToDefaults,
    requestConfirm,
    showToast,
    isSubAdmin
  } = useAdmin();

  const [activeCategory, setActiveCategory] = useState<PricingCategory>('package');
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state for modal
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  // Form for new item
  const [newItemForm, setNewItemForm] = useState({
    title: '',
    category: 'package' as PricingCategory,
    price: 0,
    subtitle: '',
    description: '',
    unit: 'জনপ্রতি',
    durationDays: 15
  });

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

  const currentItems = getCategoryItems(activeCategory);

  const filteredItems = currentItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  const categoryMeta: Record<
    PricingCategory,
    { label: string; icon: React.ComponentType<{ className?: string }>; desc: string; count: number }
  > = {
    package: {
      label: '১. হজ্ব ও ওমরাহ প্যাকেজ',
      icon: Layers,
      desc: 'হজ্ব ও ওমরাহ সফরের মূল প্যাকেজের ভিত্তি মূল্য নির্ধারণ (BDT ৳)',
      count: pricingConfig.packages.length
    },
    room: {
      label: '২. হোটেল রুম প্যাকেজ',
      icon: Building,
      desc: 'মক্কা ও মদিনায় ২-বেড, ৩-বেড, ৪-বেড বা শেয়ারিং রুম পছন্দের মূল্য',
      count: pricingConfig.rooms.length
    },
    airfare: {
      label: '৩. বিমান ভাড়া ও টিকিট',
      icon: Plane,
      desc: 'সরাসরি ফ্লাইট, ট্রানজিট ফ্লাইট অথবা বিজনেস ক্লাস টিকিটের খরচ',
      count: pricingConfig.airfares.length
    },
    incidental: {
      label: '৪. আনুসঙ্গিক খরচ',
      icon: Receipt,
      desc: 'ভিসা ও ইনস্যুরেন্স, মোয়াল্লিম ফি, মিনা-আরাফাত ক্যাম্প ও কুরবানি খরচ',
      count: pricingConfig.incidentals.length
    }
  };

  const handleOpenNewModal = () => {
    const defaultUnit =
      activeCategory === 'package'
        ? 'জনপ্রতি'
        : activeCategory === 'room'
        ? 'জনপ্রতি অতিরিক্ত'
        : activeCategory === 'airfare'
        ? 'জনপ্রতি টিকিট'
        : 'জনপ্রতি চার্জ';

    setNewItemForm({
      title: '',
      category: activeCategory,
      price: activeCategory === 'package' ? 150000 : activeCategory === 'airfare' ? 85000 : 15000,
      subtitle: '',
      description: '',
      unit: defaultUnit,
      durationDays: activeCategory === 'package' ? 15 : undefined as any
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

  const handleDelete = (item: PricingItem) => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0b1f1a] via-[#12362c] to-[#0f2922] text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DCB473]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DCB473] bg-[#DCB473]/20 px-3 py-1 rounded-full border border-[#DCB473]/40">
                মূল্য নির্ধারণ ও ফি কন্ট্রোল
              </span>
              <span className="text-[11px] text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                সরাসরি লাইভ ক্যালকুলেটর যুক্ত
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              প্যাকেজ, হোটেল, বিমান ও আনুসঙ্গিক খরচের মূল্য নির্ধারণ
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              এখানে নির্ধারিত মূল্য অনুযায়ী হাজী নিবন্ধন ফরম পূরণের সময় স্বয়ংক্রিয়ভাবে মোট খরচের লাইভ হিসাব প্রদর্শিত হবে। এছাড়া যেকোনো হাজীকে প্রয়োজনমাফিক ইচ্ছামত পার্সেন্ট (%) ডিসকাউন্ট দিয়ে মূল্য কমানো যাবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!isSubAdmin ? (
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
            ) : (
              <span className="px-3.5 py-2 bg-white/15 text-[#DCB473] font-bold text-xs rounded-xl border border-white/20">
                সাব-এডমিন (রিড-অনলি মোড)
              </span>
            )}
          </div>
        </div>

        {/* 4 Category Quick Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          {(Object.keys(categoryMeta) as PricingCategory[]).map((cat) => {
            const meta = categoryMeta[cat];
            const Icon = meta.icon;
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
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
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(Object.keys(categoryMeta) as PricingCategory[]).map((cat) => {
            const meta = categoryMeta[cat];
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {meta.label} ({meta.count})
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
            placeholder="আইটেম বা বিবরণ খুঁজুন..."
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

      {/* 3. Items Grid/List */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>{categoryMeta[activeCategory].label} তালিকা</span>
              <span className="text-xs text-stone-500 font-normal">
                ({filteredItems.length} টি আইটেম সক্রিয়)
              </span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {categoryMeta[activeCategory].desc}
            </p>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="px-3 py-1.5 bg-[#0f2922] hover:bg-[#153a30] text-[#DCB473] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন যোগ করুন</span>
          </button>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-700">কোনো আইটেম পাওয়া যায়নি</p>
            <p className="text-xs text-stone-500 mt-1">
              {searchTerm ? 'অনুসন্ধানের সাথে কোনো ফলাফল মেলেনি।' : 'এই ক্যাটাগরিতে এখনো কোনো আইটেম যোগ করা হয়নি।'}
            </p>
            <button
              onClick={handleOpenNewModal}
              className="mt-4 px-4 py-2 bg-[#DCB473] text-[#0f2922] text-xs font-bold rounded-xl"
            >
              নতুন আইটেম যোগ করুন
            </button>
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
                        onClick={() => handleDelete(item)}
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

      {/* 4. Haji Discount Feature Guidance Box */}
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

      {/* MODAL: Edit Existing Item */}
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
                {categoryMeta[newItemForm.category].label} তৈরি করুন
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
                  <option value="package">হজ্ব ও ওমরাহ প্যাকেজ (Package)</option>
                  <option value="room">হোটেল রুম প্যাকেজ (Hotel Room)</option>
                  <option value="airfare">বিমান ভাড়া ও টিকিট (Airfare)</option>
                  <option value="incidental">আনুসঙ্গিক খরচ (Incidental Expenses)</option>
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
