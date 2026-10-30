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
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { NoticeItem, NoticeCategory } from '../types';

export const AdminNoticeManager: React.FC = () => {
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

  // Filter state
  const [filterCategory, setFilterCategory] = useState<'all' | NoticeCategory | 'photos'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [readingNotice, setReadingNotice] = useState<NoticeItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('general');
  const [formDate, setFormDate] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [hasPhoto, setHasPhoto] = useState<boolean>(false);

  const currentPublisherName = activeSubAdmin
    ? activeSubAdmin.englishName || activeSubAdmin.username
    : adminCredentials?.name || 'মুত্তাকী এডমিন';

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

  const handleOpenEditModal = (notice: NoticeItem) => {
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

    const payload = {
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
        ...payload
      });
    } else {
      addNotice(payload);
    }

    setIsEditorOpen(false);
  };

  const handleDeleteNotice = (notice: NoticeItem) => {
    requestConfirm({
      title: 'নোটিশ মুছে ফেলতে চান?',
      message: `"${notice.title}" নোটিশটি স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?`,
      confirmText: 'হ্যাঁ, মুছুন',
      onConfirm: () => {
        deleteNotice(notice.id);
      }
    });
  };

  // Filtered & searched notices
  const filtered = notices.filter((n) => {
    if (filterCategory === 'photos' && !n.imageUrl) return false;
    if (filterCategory !== 'all' && filterCategory !== 'photos' && n.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.publishedBy && n.publishedBy.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getCategoryBadge = (cat: NoticeCategory) => {
    switch (cat) {
      case 'urgent':
        return { label: 'জরুরি বিজ্ঞপ্তি', bg: 'bg-red-100 text-red-800 border-red-300' };
      case 'flight':
        return { label: 'ফ্লাইট সূচি', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'circular':
        return { label: 'সার্কুলার', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'general':
      default:
        return { label: 'সাধারণ', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0f2922] to-[#1a4438] text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DCB473]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#DCB473] font-bold block mb-1">
            বিজ্ঞপ্তি ও সার্কুলার সেন্টার
          </span>
          <h2 className="text-2xl font-bold">হোমপেজ নোটিশ বোর্ড ও ফটো বিজ্ঞপ্তি ব্যবস্থাপনা</h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            এডমিন ও সাব-এডমিন এখান থেকে লিখিত নোটিশ ও ছবিসহ বিজ্ঞপ্তি প্রকাশ, সম্পাদনা, পিন ও মুছে ফেলতে পারবেন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-5 py-3 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition shadow-md shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন নোটিশ প্রকাশ করুন</span>
        </button>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'all'
                ? 'bg-[#0f2922] text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            সকল ({notices.length})
          </button>
          <button
            onClick={() => setFilterCategory('urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'urgent'
                ? 'bg-red-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-red-50'
            }`}
          >
            জরুরি
          </button>
          <button
            onClick={() => setFilterCategory('photos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'photos'
                ? 'bg-amber-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-amber-50'
            }`}
          >
            ফটো বিজ্ঞপ্তি
          </button>
          <button
            onClick={() => setFilterCategory('flight')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'flight'
                ? 'bg-blue-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-blue-50'
            }`}
          >
            ফ্লাইট সূচি
          </button>
          <button
            onClick={() => setFilterCategory('circular')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === 'circular'
                ? 'bg-purple-600 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-purple-50'
            }`}
          >
            সার্কুলার
          </button>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নোটিশ খুঁজুন..."
            className="w-full px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:ring-2 focus:ring-[#0f2922]"
          />
        </div>
      </div>

      {/* Notices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">ছবি/টাইপ</th>
                <th className="py-3 px-4">শিরোনাম ও বিবরণ</th>
                <th className="py-3 px-4">ক্যাটাগরি</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">প্রকাশক</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস / পিন</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-stone-500">
                    কোনো নোটিশ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const cat = getCategoryBadge(item.category);
                  return (
                    <tr key={item.id} className="hover:bg-stone-50/70 transition">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4 w-20">
                        {item.imageUrl ? (
                          <div
                            onClick={() => setReadingNotice(item)}
                            className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 bg-stone-900 cursor-pointer hover:opacity-80 transition shrink-0"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center text-stone-400">
                            <FileText className="w-5 h-5 text-emerald-800" />
                            <span className="text-[9px] mt-0.5 text-stone-500">লিখিত</span>
                          </div>
                        )}
                      </td>

                      {/* Title & Preview */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          {item.isPinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                              <Pin className="w-2.5 h-2.5 fill-amber-700" />
                              পিন করা
                            </span>
                          )}
                          <h4
                            onClick={() => setReadingNotice(item)}
                            className="font-bold text-stone-900 hover:text-emerald-800 cursor-pointer line-clamp-1 text-sm"
                          >
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-stone-500 line-clamp-2 leading-relaxed text-[11px]">
                          {item.content}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cat.bg}`}>
                          {cat.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{item.date}</span>
                        </div>
                      </td>

                      {/* Published By */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-stone-800 block">{item.publishedBy || 'এডমিন'}</span>
                        <span className="text-[10px] text-stone-500">
                          {item.publishedRole === 'sub_admin' ? 'সাব-এডমিন' : 'প্রধান এডমিন'}
                        </span>
                      </td>

                      {/* Status / Pin Toggles */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => togglePinNotice(item.id)}
                            title={item.isPinned ? 'আন-পিন করুন' : 'পিন করুন'}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              item.isPinned
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-stone-50 text-stone-400 hover:bg-stone-100 border-stone-200'
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActiveNotice(item.id)}
                            title={item.isActive !== false ? 'হাইড করুন' : 'সক্রিয় করুন'}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              item.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-stone-200 text-stone-500 border-stone-300'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setReadingNotice(item)}
                            title="সম্পূর্ণ নোটিশ দেখুন"
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            title="সম্পাদনা করুন"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNotice(item)}
                            title="মুছে ফেলুন"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: VIEW NOTICE */}
      {readingNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setReadingNotice(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-200"
          >
            <div className="p-5 bg-[#0f2922] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#DCB473] uppercase font-bold tracking-wider">নোটিশ প্রিভিউ</span>
                <h3 className="text-base sm:text-lg font-bold line-clamp-1">{readingNotice.title}</h3>
              </div>
              <button
                onClick={() => setReadingNotice(null)}
                className="p-1.5 text-stone-300 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 pb-3 border-b border-stone-100">
                <span>তারিখ: <strong>{readingNotice.date}</strong></span>
                <span>প্রকাশক: <strong>{readingNotice.publishedBy}</strong></span>
              </div>

              {readingNotice.imageUrl && (
                <div className="rounded-2xl overflow-hidden bg-stone-900 border border-stone-200">
                  <img
                    src={readingNotice.imageUrl}
                    alt={readingNotice.title}
                    className="w-full max-h-80 object-contain mx-auto"
                  />
                </div>
              )}

              <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line bg-stone-50 p-4 rounded-xl border border-stone-200">
                {readingNotice.content}
              </p>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  const toEdit = readingNotice;
                  setReadingNotice(null);
                  handleOpenEditModal(toEdit);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                সম্পাদনা
              </button>
              <button
                onClick={() => setReadingNotice(null)}
                className="px-4 py-2 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE / EDIT NOTICE */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsEditorOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-stone-200"
          >
            <div className="p-5 bg-gradient-to-r from-[#0f2922] to-[#1a4438] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {editingNotice ? 'নোটিশ সম্পাদনা করুন' : 'নতুন নোটিশ বা ফটো বিজ্ঞপ্তি প্রকাশ করুন'}
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  প্রকাশক: <strong>{currentPublisherName}</strong> ({isSubAdmin ? 'সাব-এডমিন' : 'এডমিন'})
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-stone-300 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  নোটিশের শিরোনাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="যেমন: ২০২৬ সালের হজ্ব প্রাক-নিবন্ধন সংক্রান্ত বিজ্ঞপ্তি"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:ring-2 focus:ring-[#0f2922]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as NoticeCategory)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
                  >
                    <option value="general">সাধারণ নোটিশ</option>
                    <option value="urgent">জরুরি বিজ্ঞপ্তি</option>
                    <option value="flight">ফ্লাইট ও সফর সূচি</option>
                    <option value="circular">সরকারি সার্কুলার</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">প্রকাশের তারিখ</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
                  />
                </div>
              </div>

              {/* Photo Upload Section */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-800" />
                    ফটো বা ব্যানার নোটিশ সংযুক্ত করবেন?
                  </label>
                  <input
                    type="checkbox"
                    checked={hasPhoto}
                    onChange={(e) => setHasPhoto(e.target.checked)}
                    className="w-4 h-4 text-[#0f2922] rounded border-stone-300"
                  />
                </div>

                {hasPhoto && (
                  <div className="pt-2 border-t border-stone-200 space-y-2">
                    <label
                      htmlFor={fileInputId}
                      className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-emerald-600 transition bg-white"
                    >
                      <Upload className="w-5 h-5 text-stone-400 mb-1" />
                      <span className="text-xs font-bold text-stone-700">ডিভাইস থেকে ফটো নির্বাচন করুন</span>
                      <input
                        id={fileInputId}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="অথবা ছবির URL দিন: https://..."
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                    />

                    {formImageUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-stone-300 h-28 bg-stone-900 flex items-center justify-center">
                        <img src={formImageUrl} alt="Preview" className="h-full w-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  নোটিশের বিস্তারিত বিবরণ <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="নোটিশের সম্পূর্ণ বিষয়বস্তু..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-stone-300"
                  />
                  <span>শীর্ষে পিন করুন</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-stone-300"
                  />
                  <span>সক্রিয় রাখুন</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f2922] hover:bg-[#1a4438] text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {editingNotice ? 'আপডেট করুন' : 'প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
