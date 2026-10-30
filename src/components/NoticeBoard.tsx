import React, { useState, useId } from 'react';
import {
  Bell,
  Pin,
  Calendar,
  Image as ImageIcon,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  X,
  Upload,
  Printer,
  Share2,
  ShieldAlert,
  Plane,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { NoticeItem, NoticeCategory } from '../types';

export const NoticeBoard: React.FC = () => {
  const {
    notices,
    addNotice,
    updateNotice,
    deleteNotice,
    togglePinNotice,
    toggleActiveNotice,
    isAdminLoggedIn,
    isSubAdmin,
    activeSubAdmin,
    adminCredentials,
    requestConfirm,
    showToast
  } = useAdmin();

  const fileInputId = useId();

  // Active filter tab
  const [activeCategory, setActiveCategory] = useState<'all' | NoticeCategory | 'photos'>('all');

  // Modal states
  const [readingNotice, setReadingNotice] = useState<NoticeItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);

  // Form states for editor
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('general');
  const [formDate, setFormDate] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [hasPhoto, setHasPhoto] = useState<boolean>(false);

  const canManageNotices = isAdminLoggedIn || isSubAdmin;
  const currentPublisherName = activeSubAdmin
    ? activeSubAdmin.englishName || activeSubAdmin.username
    : adminCredentials?.name || 'মুত্তাকী এডমিন';

  // Open editor for creating or editing
  const handleOpenCreateModal = () => {
    setEditingNotice(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('general');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormImageUrl('');
    setFormIsPinned(false);
    setFormIsActive(true);
    setHasPhoto(false);
    setIsEditorOpen(true);
  };

  const handleOpenEditModal = (notice: NoticeItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNotice(notice);
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormCategory(notice.category);
    setFormDate(notice.date);
    setFormImageUrl(notice.imageUrl || '');
    setFormIsPinned(!!notice.isPinned);
    setFormIsActive(notice.isActive !== false);
    setHasPhoto(!!notice.imageUrl);
    setIsEditorOpen(true);
  };

  // Image file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('ছবিটির সাইজ ৫ মেগাবাইটের কম হতে হবে');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormImageUrl(result);
      setHasPhoto(true);
      showToast('ছবি সফলভাবে আপলোড হয়েছে!');
    };
    reader.readAsDataURL(file);
  };

  // Submit form
  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('দয়া করে নোটিশের শিরোনাম লিখুন');
      return;
    }
    if (!formContent.trim()) {
      showToast('দয়া করে নোটিশের বিবরণ লিখুন');
      return;
    }

    const noticePayload = {
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      date: formDate || new Date().toISOString().split('T')[0],
      imageUrl: hasPhoto && formImageUrl.trim() ? formImageUrl.trim() : undefined,
      isPinned: formIsPinned,
      isActive: formIsActive,
      publishedBy: currentPublisherName,
      publishedRole: (isSubAdmin ? 'sub_admin' : 'admin') as 'admin' | 'sub_admin'
    };

    if (editingNotice) {
      updateNotice({
        ...editingNotice,
        ...noticePayload
      });
    } else {
      addNotice(noticePayload);
    }

    setIsEditorOpen(false);
  };

  // Delete notice with confirmation dialog
  const handleDeleteNotice = (notice: NoticeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    requestConfirm({
      title: 'নোটিশ মুছে ফেলতে চান?',
      message: `"${notice.title}" নোটিশটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?`,
      confirmText: 'হ্যাঁ, মুছুন',
      onConfirm: () => {
        deleteNotice(notice.id);
      }
    });
  };

  // Copy notice text to clipboard
  const handleCopyNotice = (notice: NoticeItem) => {
    const textToCopy = `[মুত্তাকী কাফেলা নোটিশ - ${notice.title}]\nতারিখ: ${notice.date}\nবিবরণ: ${notice.content}\nওয়েবসাইট: muttaqi.com.bd`;
    navigator.clipboard?.writeText(textToCopy);
    showToast('নোটিশের বিবরণ কপি করা হয়েছে!');
  };

  // Print notice
  const handlePrintNotice = () => {
    window.print();
  };

  // Filtered notices
  const activeNotices = notices.filter((n) => canManageNotices || n.isActive !== false);

  const filteredNotices = activeNotices.filter((n) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'photos') return !!n.imageUrl;
    return n.category === activeCategory;
  });

  // Sort pinned first, then newest date
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Find topmost pinned urgent notice for ticker
  const pinnedUrgentNotice = activeNotices.find((n) => n.isPinned && n.isActive !== false);

  const getCategoryBadge = (cat: NoticeCategory) => {
    switch (cat) {
      case 'urgent':
        return {
          label: 'জরুরি বিজ্ঞপ্তি',
          bg: 'bg-red-500/15 text-red-700 border-red-300',
          dot: 'bg-red-500',
          icon: ShieldAlert
        };
      case 'flight':
        return {
          label: 'ফ্লাইট ও সফর সূচি',
          bg: 'bg-blue-500/15 text-blue-700 border-blue-300',
          dot: 'bg-blue-500',
          icon: Plane
        };
      case 'circular':
        return {
          label: 'সরকারি সার্কুলার',
          bg: 'bg-purple-500/15 text-purple-700 border-purple-300',
          dot: 'bg-purple-500',
          icon: FileText
        };
      case 'general':
      default:
        return {
          label: 'সাধারণ নোটিশ',
          bg: 'bg-emerald-500/15 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          icon: Bell
        };
    }
  };

  return (
    <section id="notice-board" className="py-14 bg-gradient-to-b from-[#f8faf8] via-white to-[#f4f7f4] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Pinned Urgent Ticker */}
        {pinnedUrgentNotice && (
          <div className="mb-8 bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-lg shadow-red-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-red-400/40">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  জরুরি ঘোষণা
                </span>
                <p className="text-sm sm:text-base font-semibold line-clamp-1">
                  {pinnedUrgentNotice.title}
                </p>
              </div>
            </div>
            <button
              onClick={() => setReadingNotice(pinnedUrgentNotice)}
              className="text-xs sm:text-sm font-semibold bg-white text-red-700 hover:bg-amber-50 px-4 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto"
            >
              বিস্তারিত পড়ুন
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
              <span>মুত্তাকী বুলেটিন ও আপডেট</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0D3B2E] tracking-tight">
              কাফেলা নোটিশ বোর্ড ও ফটো বিজ্ঞপ্তি
            </h2>
            <p className="mt-1 text-sm sm:text-base text-gray-600 max-w-2xl">
              পবিত্র হজ্ব ও ওমরাহর সর্বশেষ সময়সূচি, মোয়াল্লেম ঘোষণা, ফ্লাইট আপডেট এবং গুরুত্বপূর্ণ দিকনির্দেশনা।
            </p>
          </div>

          {/* Action Bar for Admin/Sub-Admin */}
          <div className="flex items-center gap-3 flex-wrap">
            {canManageNotices && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  {isSubAdmin ? 'সাব-এডমিন মোড' : 'এডমিন মোড'}
                </span>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#0D3B2E] to-[#165b47] text-white hover:from-[#114b3b] hover:to-[#1c7058] shadow-md hover:shadow-lg transition transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  নতুন নোটিশ প্রকাশ করুন
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#0D3B2E] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            সকল নোটিশ ({activeNotices.length})
          </button>
          <button
            onClick={() => setActiveCategory('urgent')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'urgent'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-red-50 border border-gray-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            জরুরি বিজ্ঞপ্তি
          </button>
          <button
            onClick={() => setActiveCategory('photos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'photos'
                ? 'bg-[#b8860b] text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            ফটো বিজ্ঞপ্তি
          </button>
          <button
            onClick={() => setActiveCategory('flight')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'flight'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            ফ্লাইট ও সফর
          </button>
          <button
            onClick={() => setActiveCategory('circular')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === 'circular'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            সার্কুলার
          </button>
        </div>

        {/* Notice Cards Grid */}
        {sortedNotices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700">বর্তমানে কোনো নোটিশ পাওয়া যায়নি</h3>
            <p className="text-sm text-gray-500 mt-1">
              {activeCategory !== 'all' ? 'অন্য ক্যাটাগরি নির্বাচন করুন অথবা সকল নোটিশ দেখুন।' : 'শীঘ্রই নতুন নোটিশ প্রকাশিত হবে।'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedNotices.map((notice) => {
              const catBadge = getCategoryBadge(notice.category);
              const CatIcon = catBadge.icon;
              const isInactive = notice.isActive === false;

              return (
                <div
                  key={notice.id}
                  onClick={() => setReadingNotice(notice)}
                  className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between relative ${
                    notice.isPinned
                      ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-md'
                      : 'border-gray-200 hover:border-emerald-300'
                  } ${isInactive ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  {/* Pinned Tag */}
                  {notice.isPinned && (
                    <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-white" />
                      পিন করা
                    </div>
                  )}

                  {/* Photo Section if exists */}
                  {notice.imageUrl ? (
                    <div className="relative h-48 sm:h-52 w-full bg-gray-900 overflow-hidden">
                      <img
                        src={notice.imageUrl}
                        alt={notice.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        ফটো নোটিশ
                      </div>
                    </div>
                  ) : (
                    <div className="h-3 bg-gradient-to-r from-emerald-600 via-[#0D3B2E] to-teal-700" />
                  )}

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta badges: Category & Date */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${catBadge.bg}`}
                        >
                          <CatIcon className="w-3.5 h-3.5" />
                          {catBadge.label}
                        </span>
                        <div className="flex items-center text-xs text-gray-500 font-medium gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{notice.date}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#0D3B2E] transition line-clamp-2 mb-2 leading-snug">
                        {notice.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {notice.content}
                      </p>
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">{notice.publishedBy || 'মুত্তাকী কর্তৃপক্ষ'}</span>
                        {notice.publishedRole === 'sub_admin' && (
                          <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                            সাব-এডমিন
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs group-hover:translate-x-0.5 transition">
                        <span>সম্পূর্ণ পড়ুন</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Admin Quick Control overlay buttons */}
                  {canManageNotices && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-2 bg-gray-50/90 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600"
                    >
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePinNotice(notice.id)}
                          title={notice.isPinned ? 'আন-পিন করুন' : 'পিন করুন'}
                          className={`p-1.5 rounded-lg border transition ${
                            notice.isPinned
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-white hover:bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActiveNotice(notice.id)}
                          title={notice.isActive !== false ? 'হাইড করুন' : 'সক্রিয় করুন'}
                          className={`p-1.5 rounded-lg border transition ${
                            notice.isActive !== false
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-gray-200 text-gray-500 border-gray-300'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditModal(notice, e)}
                          title="সম্পাদনা করুন"
                          className="p-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-gray-200 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteNotice(notice, e)}
                          title="মুছে ফেলুন"
                          className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-gray-200 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* FULL NOTICE READER MODAL */}
      {readingNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setReadingNotice(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 animate-scale-up"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-[#0D3B2E] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                      মুত্তাকী কাফেলা নোটিশ
                    </span>
                    {readingNotice.isPinned && (
                      <span className="text-[10px] bg-amber-400 text-[#0D3B2E] font-extrabold px-2 py-0.5 rounded-full">
                        পিন করা
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold line-clamp-1">{readingNotice.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setReadingNotice(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* Meta bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold border ${
                      getCategoryBadge(readingNotice.category).bg
                    }`}
                  >
                    {getCategoryBadge(readingNotice.category).label}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 font-medium">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>প্রকাশের তারিখ: {readingNotice.date}</span>
                  </div>
                </div>

                <div className="text-gray-700 font-medium">
                  প্রকাশক:{' '}
                  <span className="font-bold text-[#0D3B2E]">{readingNotice.publishedBy || 'মুত্তাকী এডমিন'}</span>
                  {readingNotice.publishedRole === 'sub_admin' && (
                    <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      সাব-এডমিন
                    </span>
                  )}
                </div>
              </div>

              {/* Title Large */}
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
                {readingNotice.title}
              </h1>

              {/* Notice Photo Display */}
              {readingNotice.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-950 shadow-inner group relative">
                  <img
                    src={readingNotice.imageUrl}
                    alt={readingNotice.title}
                    className="w-full max-h-[460px] object-contain mx-auto"
                  />
                  <a
                    href={readingNotice.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-1.5 rounded-xl backdrop-blur-sm flex items-center gap-1.5 font-semibold transition shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    মূল ছবি বড় করে দেখুন
                  </a>
                </div>
              )}

              {/* Full Content */}
              <div className="bg-[#fcfdfc] p-6 rounded-2xl border border-emerald-100/60">
                <p className="text-base sm:text-lg text-gray-800 leading-relaxed whitespace-pre-line font-normal">
                  {readingNotice.content}
                </p>
              </div>

              {/* Office Contact Note */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">জরুরি তথ্যের জন্য যোগাযোগ করুন:</p>
                  <p className="mt-0.5">
                    মুত্তাকী হজ্ব ও কন্সাল্টেন্সি হেল্পলাইন: <strong>০১৭৬৮-২৩২৫০৮</strong> | প্রধান কার্যালয়: এ-১৬, মদিনা শপিং কমপ্লেক্স, দুপচাঁচিয়া, বগুড়া।
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyNotice(readingNotice)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-gray-500" />
                  কপি করুন
                </button>
                <button
                  onClick={handlePrintNotice}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition shadow-sm"
                >
                  <Printer className="w-4 h-4 text-gray-500" />
                  প্রিন্ট
                </button>
              </div>

              <div className="flex items-center gap-2">
                {canManageNotices && (
                  <button
                    onClick={() => {
                      const toEdit = readingNotice;
                      setReadingNotice(null);
                      handleOpenEditModal(toEdit);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    সম্পাদনা
                  </button>
                )}
                <button
                  onClick={() => setReadingNotice(null)}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0D3B2E] text-white hover:bg-[#144b3c] transition shadow-sm"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE PUBLISH / EDIT MODAL (FOR ADMIN & SUB-ADMIN) */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsEditorOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 animate-scale-up"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0D3B2E] to-[#175b48] text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  {editingNotice ? 'নোটিশ সম্পাদনা করুন' : 'নতুন নোটিশ বা ফটো বিজ্ঞপ্তি প্রকাশ করুন'}
                </h3>
                <p className="text-xs text-emerald-200 mt-1">
                  প্রকাশক: <strong>{currentPublisherName}</strong> ({isSubAdmin ? 'সাব-এডমিন' : 'প্রধান এডমিন'})
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNotice} className="p-6 sm:p-8 overflow-y-auto space-y-5">
              
              {/* Notice Title */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                  নোটিশের শিরোনাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="যেমন: ২০২৬ সালের হজ্ব প্রাক-নিবন্ধনের সময়সীমা বৃদ্ধি সংক্রান্ত বিজ্ঞপ্তি"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D3B2E] focus:border-[#0D3B2E] text-sm text-gray-900 shadow-sm"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                    ক্যাটাগরি
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as NoticeCategory)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D3B2E] focus:border-[#0D3B2E] text-sm text-gray-900 shadow-sm bg-white"
                  >
                    <option value="general">সাধারণ নোটিশ (General)</option>
                    <option value="urgent">জরুরি বিজ্ঞপ্তি (Urgent)</option>
                    <option value="flight">ফ্লাইট ও সফর সূচি (Flight Schedule)</option>
                    <option value="circular">সরকারি সার্কুলার (Circular)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                    প্রকাশের তারিখ
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D3B2E] focus:border-[#0D3B2E] text-sm text-gray-900 shadow-sm bg-white"
                  />
                </div>
              </div>

              {/* Photo Toggle & Upload */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    ফটো বা ব্যানার নোটিশ সংযুক্ত করবেন?
                  </label>
                  <input
                    type="checkbox"
                    checked={hasPhoto}
                    onChange={(e) => setHasPhoto(e.target.checked)}
                    className="w-4 h-4 text-[#0D3B2E] rounded border-gray-300 focus:ring-[#0D3B2E]"
                  />
                </div>

                {hasPhoto && (
                  <div className="pt-2 border-t border-gray-200 space-y-3 animate-fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        সরাসরি ডিভাইস থেকে ছবি আপলোড করুন:
                      </label>
                      <label
                        htmlFor={fileInputId}
                        className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/40 transition"
                      >
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs font-bold text-gray-700">ফটো ফাইল নির্বাচন করুন (JPG / PNG)</span>
                        <span className="text-[10px] text-gray-500">সর্বোচ্চ ৫ মেগাবাইট</span>
                        <input
                          id={fileInputId}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        অথবা ছবির অনলাইন লিংক (URL) দিন:
                      </label>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:ring-2 focus:ring-[#0D3B2E]"
                      />
                    </div>

                    {/* Image Preview */}
                    {formImageUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-gray-300 h-36 bg-gray-900 flex items-center justify-center">
                        <img
                          src={formImageUrl}
                          alt="Notice preview"
                          className="h-full w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                  নোটিশের বিস্তারিত বিবরণ <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="নোটিশের সম্পূর্ণ বিষয়বস্তু ও নির্দেশনা এখানে লিখুন..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#0D3B2E] focus:border-[#0D3B2E] text-sm text-gray-900 shadow-sm leading-relaxed"
                />
              </div>

              {/* Pinned & Active Checkboxes */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-gray-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <Pin className="w-3.5 h-3.5 text-amber-600" />
                  শীর্ষে পিন করে রাখুন (Pinned)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-gray-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  হোমপেজে সক্রিয় রাখুন (Active)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#0D3B2E] hover:bg-[#144b3c] text-white shadow-md hover:shadow-lg transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  {editingNotice ? 'আপডেট সম্পন্ন করুন' : 'নোটিশ প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
