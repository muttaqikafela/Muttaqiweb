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
  Filter,
  Globe,
  RefreshCw,
  Landmark,
  Save
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import {
  useSite,
  DEFAULT_GOVT_HAJJ_NOTICE_CONFIG,
  DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG,
  type GovtHajjNoticeItem,
  type HajjFlightTicketLink
} from '../context/SiteContext';
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
    canSubAdminAdd,
    canSubAdminEdit,
    canSubAdminDelete,
    requestConfirm,
    showToast
  } = useAdmin();

  const {
    siteSettings,
    saveSiteSettings,
    refreshGovtHajjNotices,
    isRefreshingGovtNotices
  } = useSite();

  const fileInputId = useId();
  const canEditGovtConfig = !isSubAdmin && canSubAdminEdit('notices');

  const govtConfig = siteSettings.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
  const [govtEnabled, setGovtEnabled] = useState<boolean>(govtConfig.enabled !== false);
  const [govtPortalName, setGovtPortalName] = useState<string>(govtConfig.portalName || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.portalName);
  const [govtPortalUrl, setGovtPortalUrl] = useState<string>(govtConfig.portalUrl || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.portalUrl);
  const [govtHelpline, setGovtHelpline] = useState<string>(govtConfig.helpline || '১৬১৩৬');
  const [govtAutoRefreshMins, setGovtAutoRefreshMins] = useState<number>(govtConfig.autoRefreshMinutes || 15);
  const [customGovtTitle, setCustomGovtTitle] = useState<string>('');
  const [customGovtUrl, setCustomGovtUrl] = useState<string>('');
  const [customGovtDate, setCustomGovtDate] = useState<string>('');

  React.useEffect(() => {
    const cfg = siteSettings.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG;
    setGovtEnabled(cfg.enabled !== false);
    setGovtPortalName(cfg.portalName || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.portalName);
    setGovtPortalUrl(cfg.portalUrl || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.portalUrl);
    setGovtHelpline(cfg.helpline || '১৬১৩৬');
    setGovtAutoRefreshMins(cfg.autoRefreshMinutes || 15);
  }, [
    siteSettings.govtHajjNotice?.enabled,
    siteSettings.govtHajjNotice?.portalName,
    siteSettings.govtHajjNotice?.portalUrl,
    siteSettings.govtHajjNotice?.helpline,
    siteSettings.govtHajjNotice?.autoRefreshMinutes
  ]);

  const handleSaveGovtPortalConfig = async () => {
    if (!canEditGovtConfig) {
      showToast('সাব-এডমিন মোডে সেটিংস পরিবর্তন করা যাবে না।');
      return;
    }
    const cleanUrl = govtPortalUrl.trim() || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.portalUrl;
    const normalizedUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
    const updatedConfig = {
      ...(siteSettings.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG),
      enabled: govtEnabled,
      portalName: govtPortalName.trim() || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG.portalName,
      portalUrl: normalizedUrl,
      helpline: govtHelpline.trim() || '১৬১৩৬',
      autoRefreshMinutes: Math.max(5, Number(govtAutoRefreshMins) || 15)
    };
    await saveSiteSettings({
      ...siteSettings,
      govtHajjNotice: updatedConfig
    });
    const res = await refreshGovtHajjNotices(normalizedUrl);
    if (res.ok) {
      showToast(`সরকারি ওয়েবসাইট লিংক সংরক্ষিত ও ${res.notices.length}টি লাইভ নোটিশ আপডেট হয়েছে!`);
    } else {
      showToast('সেটিংস সংরক্ষিত হয়েছে। লাইভ সিঙ্ক ব্যাকগ্রাউন্ডে চেষ্টা করবে।');
    }
  };

  const handleAddCustomGovtNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditGovtConfig) return;
    if (!customGovtTitle.trim() || !customGovtUrl.trim()) {
      showToast('নোটিশের শিরোনাম এবং সরকারি PDF বা পেজের লিংক দিন।');
      return;
    }
    const urlStr = customGovtUrl.trim().startsWith('http') ? customGovtUrl.trim() : `https://${customGovtUrl.trim()}`;
    const newItem: GovtHajjNoticeItem = {
      id: `govt-custom-${Date.now()}`,
      title: customGovtTitle.trim(),
      url: urlStr,
      date: customGovtDate.trim() || new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
      isPdf: /\.pdf($|\?)/i.test(urlStr),
      isCustom: true
    };
    const nextConfig = {
      ...(siteSettings.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG),
      notices: [newItem, ...(siteSettings.govtHajjNotice?.notices || [])].slice(0, 30)
    };
    await saveSiteSettings({
      ...siteSettings,
      govtHajjNotice: nextConfig
    });
    setCustomGovtTitle('');
    setCustomGovtUrl('');
    setCustomGovtDate('');
    showToast('কাস্টম সরকারি নোটিশ লিংক যুক্ত হয়েছে!');
  };

  const handleRemoveCustomGovtNotice = async (id: string) => {
    if (!canEditGovtConfig) return;
    const nextConfig = {
      ...(siteSettings.govtHajjNotice || DEFAULT_GOVT_HAJJ_NOTICE_CONFIG),
      notices: (siteSettings.govtHajjNotice?.notices || []).filter((item) => item.id !== id)
    };
    await saveSiteSettings({
      ...siteSettings,
      govtHajjNotice: nextConfig
    });
    showToast('পিন্ড সরকারি নোটিশটি মুছে ফেলা হয়েছে।');
  };

  // Saudi Arabia Hajj Direct & Transit Flight Ticket Website Links Config
  const flightConfig = siteSettings.hajjFlightTickets || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG;
  const [flightEnabled, setFlightEnabled] = useState<boolean>(flightConfig.enabled !== false);
  const [flightTitle, setFlightTitle] = useState<string>(
    flightConfig.sectionTitle || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.sectionTitle
  );
  const [flightSubtitle, setFlightSubtitle] = useState<string>(
    flightConfig.sectionSubtitle || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.sectionSubtitle
  );
  const [newAirlineName, setNewAirlineName] = useState<string>('');
  const [newAirlineUrl, setNewAirlineUrl] = useState<string>('');
  const [newFlightType, setNewFlightType] = useState<'direct' | 'transit' | 'both'>('direct');
  const [newFlightRoute, setNewFlightRoute] = useState<string>('');
  const [newFlightNote, setNewFlightNote] = useState<string>('');

  React.useEffect(() => {
    const cfg = siteSettings.hajjFlightTickets || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG;
    setFlightEnabled(cfg.enabled !== false);
    setFlightTitle(cfg.sectionTitle || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.sectionTitle);
    setFlightSubtitle(cfg.sectionSubtitle || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.sectionSubtitle);
  }, [
    siteSettings.hajjFlightTickets?.enabled,
    siteSettings.hajjFlightTickets?.sectionTitle,
    siteSettings.hajjFlightTickets?.sectionSubtitle
  ]);

  const handleSaveFlightHeaderConfig = async () => {
    if (!canEditGovtConfig) {
      showToast('সাব-এডমিন মোডে সেটিংস পরিবর্তন করা যাবে না।');
      return;
    }
    await saveSiteSettings({
      ...siteSettings,
      hajjFlightTickets: {
        ...(siteSettings.hajjFlightTickets || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG),
        enabled: flightEnabled,
        sectionTitle: flightTitle.trim() || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.sectionTitle,
        sectionSubtitle: flightSubtitle.trim() || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.sectionSubtitle
      }
    });
    showToast('সৌদি হজ বিমান টিকিট প্যানেল সেটিংস সংরক্ষিত হয়েছে!');
  };

  const handleAddFlightTicketLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditGovtConfig) return;
    if (!newAirlineName.trim() || !newAirlineUrl.trim()) {
      showToast('এয়ারলাইন্স বা ওয়েবসাইটের নাম এবং লিংক (URL) দিন।');
      return;
    }
    const cleanUrl = newAirlineUrl.trim().startsWith('http')
      ? newAirlineUrl.trim()
      : `https://${newAirlineUrl.trim()}`;
    const newItem: HajjFlightTicketLink = {
      id: `flight-${Date.now()}`,
      airlineName: newAirlineName.trim(),
      websiteUrl: cleanUrl,
      flightType: newFlightType,
      route: newFlightRoute.trim() || 'বাংলাদেশ → সৌদি আরব (জেদ্দা / মদিনা)',
      note: newFlightNote.trim() || 'ডাইরেক্ট ও ট্রানজিট হজ/ওমরাহ ফ্লাইট টিকিট আপডেট',
      isActive: true
    };
    const nextConfig = {
      ...(siteSettings.hajjFlightTickets || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG),
      enabled: flightEnabled,
      links: [newItem, ...(siteSettings.hajjFlightTickets?.links || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.links)]
    };
    await saveSiteSettings({
      ...siteSettings,
      hajjFlightTickets: nextConfig
    });
    setNewAirlineName('');
    setNewAirlineUrl('');
    setNewFlightRoute('');
    setNewFlightNote('');
    showToast('নতুন বিমান টিকিট ওয়েবসাইট লিংক যুক্ত হয়েছে!');
  };

  const handleToggleFlightLink = async (id: string) => {
    if (!canEditGovtConfig) return;
    const currentLinks = siteSettings.hajjFlightTickets?.links || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.links;
    const nextLinks = currentLinks.map((item) =>
      item.id === id ? { ...item, isActive: item.isActive === false } : item
    );
    await saveSiteSettings({
      ...siteSettings,
      hajjFlightTickets: {
        ...(siteSettings.hajjFlightTickets || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG),
        links: nextLinks
      }
    });
    showToast('ফ্লাইট লিংক স্ট্যাটাস আপডেট হয়েছে।');
  };

  const handleRemoveFlightLink = async (id: string) => {
    if (!canEditGovtConfig) return;
    const currentLinks = siteSettings.hajjFlightTickets?.links || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG.links;
    const nextLinks = currentLinks.filter((item) => item.id !== id);
    await saveSiteSettings({
      ...siteSettings,
      hajjFlightTickets: {
        ...(siteSettings.hajjFlightTickets || DEFAULT_HAJJ_FLIGHT_TICKETS_CONFIG),
        links: nextLinks
      }
    });
    showToast('বিমান টিকিট লিংকটি মুছে ফেলা হয়েছে।');
  };

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
            {isSubAdmin
              ? 'সাব-এডমিন মোড (রিড-অনলি): আপনি এখান থেকে সকল প্রকাশিত ও ড্রাফট নোটিশ ও ছবি বিস্তারিত দেখতে পারবেন।'
              : 'এডমিন ও অনুমোদিত কর্মচারী এখান থেকে লিখিত নোটিশ ও ছবিসহ বিজ্ঞপ্তি প্রকাশ, সম্পাদনা, পিন ও মুছে ফেলতে পারবেন।'}
          </p>
        </div>

        {canSubAdminAdd('notices') ? (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-3 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition shadow-md shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন নোটিশ প্রকাশ করুন</span>
          </button>
        ) : (
          <span className="px-4 py-2 bg-amber-500/20 text-amber-200 border border-amber-400/40 rounded-2xl text-xs font-bold shrink-0">
            রিড-অনলি মোড
          </span>
        )}
      </div>

      {/* Government Hajj Portal Live Notice Integration Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#DCB473]/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-950/5 via-amber-50/50 to-emerald-950/5 px-5 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0f2922]">
                সরকারি হজ ওয়েবসাইট লিংক ও লাইভ নোটিশ সেটাপ
              </h3>
              <p className="text-[11px] text-stone-600">
                হোমপেজে কাফেলা নোটিশ বোর্ডের ঠিক পাশে সরকারি হজ পোর্টালের সর্বশেষ বিজ্ঞপ্তি স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
              govtEnabled
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-stone-100 text-stone-600 border-stone-300'
            }`}
          >
            {govtEnabled ? 'হোমপেজে চালু আছে' : 'বন্ধ রাখা হয়েছে'}
          </span>
        </div>

        <fieldset disabled={!canEditGovtConfig} className="p-5 space-y-4 disabled:opacity-75">
          <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={govtEnabled}
                onChange={(e) => setGovtEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-[#0f2922]"
              />
              <span>হোমপেজে নোটিশ বোর্ডের পাশে &quot;সরকারি হজ ওয়েবসাইটের নোটিশ&quot; বক্স দেখান</span>
            </label>
            <span className="text-[11px] text-stone-500 hidden sm:inline">
              মোট সংরক্ষিত নোটিশ: {(govtConfig.notices || []).length}টি
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-stone-700 mb-1">পোর্টালের শিরোনাম</label>
              <input
                type="text"
                value={govtPortalName}
                onChange={(e) => setGovtPortalName(e.target.value)}
                placeholder="বাংলাদেশ সরকারি হজ পোর্টাল (hajj.gov.bd)"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
              />
            </div>
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                সরকারি হজ ওয়েবসাইট লিংক (URL)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={govtPortalUrl}
                  onChange={(e) => setGovtPortalUrl(e.target.value)}
                  placeholder="https://www.hajj.gov.bd/"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-stone-700 mb-1">হেল্পলাইন</label>
              <input
                type="text"
                value={govtHelpline}
                onChange={(e) => setGovtHelpline(e.target.value)}
                placeholder="১৬১৩৬"
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">অটো-আপডেট</label>
              <select
                value={govtAutoRefreshMins}
                onChange={(e) => setGovtAutoRefreshMins(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
              >
                <option value={5}>প্রতি ৫ মিনিট</option>
                <option value={15}>প্রতি ১৫ মিনিট</option>
                <option value={30}>প্রতি ৩০ মিনিট</option>
                <option value={60}>প্রতি ১ ঘণ্টা</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-stone-500">
              {govtConfig.lastSyncedAt
                ? `সর্বশেষ লাইভ সিঙ্ক: ${new Date(govtConfig.lastSyncedAt).toLocaleString('bn-BD')}`
                : 'সর্বশেষ লাইভ সিঙ্ক: স্বয়ংক্রিয়ভাবে চলমান'}
            </p>
            {canEditGovtConfig && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isRefreshingGovtNotices}
                  onClick={async () => {
                    const res = await refreshGovtHajjNotices(govtPortalUrl);
                    if (res.ok) {
                      showToast(`সরকারি পোর্টাল থেকে ${res.notices.length}টি নোটিশ আপডেট হয়েছে!`);
                    } else {
                      showToast(res.error || 'লাইভ সিঙ্ক সম্পন্ন হতে পারেনি।');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingGovtNotices ? 'animate-spin' : ''}`} />
                  <span>এখনই রিফ্রেশ করুন</span>
                </button>
                <button
                  type="button"
                  disabled={isRefreshingGovtNotices}
                  onClick={handleSaveGovtPortalConfig}
                  className="px-4 py-2 rounded-xl bg-[#0f2922] hover:bg-[#1a4438] text-[#DCB473] text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>সংরক্ষণ ও লাইভ নোটিশ আপডেট করুন</span>
                </button>
              </div>
            )}
          </div>
        </fieldset>

        {/* Optional Custom Official Circular Links Manager */}
        {canEditGovtConfig && (
          <div className="px-5 pb-5 pt-3 border-t border-stone-100 bg-stone-50/60 space-y-3">
            <p className="text-xs font-bold text-stone-700">
              গুরুত্বপূর্ণ সরকারি সার্কুলার / PDF লিংক পিন করুন (ঐচ্ছিক):
            </p>
            <form onSubmit={handleAddCustomGovtNotice} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={customGovtTitle}
                onChange={(e) => setCustomGovtTitle(e.target.value)}
                placeholder="সার্কুলার বা নোটিশের শিরোনাম"
                className="sm:col-span-5 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
              <input
                type="url"
                value={customGovtUrl}
                onChange={(e) => setCustomGovtUrl(e.target.value)}
                placeholder="অফিশিয়াল লিংক বা PDF URL (https://...)"
                className="sm:col-span-4 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
              <input
                type="text"
                value={customGovtDate}
                onChange={(e) => setCustomGovtDate(e.target.value)}
                placeholder="তারিখ (ঐচ্ছিক)"
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
              <button
                type="submit"
                className="sm:col-span-1 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>যোগ</span>
              </button>
            </form>

            {(govtConfig.notices || []).some((n) => n.isCustom) && (
              <div className="space-y-1.5 pt-1">
                {(govtConfig.notices || [])
                  .filter((n) => n.isCustom)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-amber-200 text-xs"
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-stone-800 hover:text-emerald-800 truncate flex-1"
                      >
                        {item.title} ({item.date})
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomGovtNotice(item.id)}
                        className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saudi Arabia Hajj Direct & Transit Flight Ticket Website Links Setup Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-sky-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f2922]/5 via-sky-50/70 to-emerald-50/40 px-5 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0f2922]">
                সৌদি আরব হজ বিমান টিকিট (ডাইরেক্ট ও ট্রানজিট) ওয়েবসাইট লিংক সেটাপ
              </h3>
              <p className="text-[11px] text-stone-600">
                হোমপেজ নোটিশ বোর্ডের নিচে ডাইরেক্ট ও ট্রানজিট ফ্লাইটের টিকিট আপডেট ওয়েবসাইটগুলো এখান থেকে যুক্ত বা পরিবর্তন করুন।
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
              flightEnabled
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-stone-100 text-stone-600 border-stone-300'
            }`}
          >
            {flightEnabled ? `চালু আছে (${(flightConfig.links || []).length}টি লিংক)` : 'বন্ধ রাখা হয়েছে'}
          </span>
        </div>

        <fieldset disabled={!canEditGovtConfig} className="p-5 space-y-4 disabled:opacity-75">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={flightEnabled}
                onChange={(e) => setFlightEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-[#0f2922]"
              />
              <span>হোমপেজ নোটিশ বোর্ডের নিচে সৌদি হজ ডাইরেক্ট ও ট্রানজিট বিমান টিকিট লিংক প্যানেল দেখান</span>
            </label>
            {canEditGovtConfig && (
              <button
                type="button"
                onClick={handleSaveFlightHeaderConfig}
                className="px-3.5 py-1.5 rounded-xl bg-[#0f2922] hover:bg-[#1a4438] text-[#DCB473] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>প্যানেল সেটিংস সংরক্ষণ করুন</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">প্যানেলের শিরোনাম</label>
              <input
                type="text"
                value={flightTitle}
                onChange={(e) => setFlightTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">উপ-শিরোনাম / বিবরণ</label>
              <input
                type="text"
                value={flightSubtitle}
                onChange={(e) => setFlightSubtitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
              />
            </div>
          </div>

          {/* Existing Flight Ticket Website Links List */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-stone-700">
              যুক্তকৃত ডাইরেক্ট ও ট্রানজিট এয়ারলাইন্স / টিকিট পোর্টালসমূহ:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {(flightConfig.links || []).map((link) => (
                <div
                  key={link.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs ${
                    link.isActive === false
                      ? 'bg-stone-100 border-stone-200 opacity-60'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          link.flightType === 'direct'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : link.flightType === 'transit'
                              ? 'bg-sky-100 text-sky-800 border-sky-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {link.flightType === 'direct'
                          ? 'ডাইরেক্ট'
                          : link.flightType === 'transit'
                            ? 'ট্রানজিট'
                            : 'ডাইরেক্ট ও ট্রানজিট'}
                      </span>
                      <a
                        href={link.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-stone-900 hover:text-emerald-800 truncate"
                      >
                        {link.airlineName}
                      </a>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">{link.route}</p>
                    <p className="text-[10px] text-stone-400 font-mono truncate">{link.websiteUrl}</p>
                  </div>

                  {canEditGovtConfig && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFlightLink(link.id)}
                        title={link.isActive === false ? 'সক্রিয় করুন' : 'লুকান'}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          link.isActive === false
                            ? 'bg-stone-200 text-stone-600 border-stone-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFlightLink(link.id)}
                        title="মুছে ফেলুন"
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </fieldset>

        {/* Add New Flight Ticket Website Link Form */}
        {canEditGovtConfig && (
          <form
            onSubmit={handleAddFlightTicketLink}
            className="px-5 pb-5 pt-3 border-t border-stone-100 bg-stone-50/70 space-y-2.5"
          >
            <p className="text-xs font-bold text-stone-800">
              + নতুন এয়ারলাইন্স বা হজ ফ্লাইট টিকিট ওয়েবসাইটের লিংক যুক্ত করুন:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={newAirlineName}
                onChange={(e) => setNewAirlineName(e.target.value)}
                placeholder="এয়ারলাইন্স / পোর্টালের নাম (যেমন: ইউএস-বাংলা)"
                className="sm:col-span-3 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
              <input
                type="url"
                value={newAirlineUrl}
                onChange={(e) => setNewAirlineUrl(e.target.value)}
                placeholder="ওয়েবসাইট লিংক (https://...)"
                className="sm:col-span-3 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
              <select
                value={newFlightType}
                onChange={(e) => setNewFlightType(e.target.value as 'direct' | 'transit' | 'both')}
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              >
                <option value="direct">ডাইরেক্ট ফ্লাইট</option>
                <option value="transit">ট্রানজিট ফ্লাইট</option>
                <option value="both">ডাইরেক্ট ও ট্রানজিট</option>
              </select>
              <input
                type="text"
                value={newFlightRoute}
                onChange={(e) => setNewFlightRoute(e.target.value)}
                placeholder="রুট (ঢাকা → জেদ্দা/মদিনা)"
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
              <input
                type="text"
                value={newFlightNote}
                onChange={(e) => setNewFlightNote(e.target.value)}
                placeholder="আপডেট তথ্য / নোট"
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#0f2922] hover:bg-[#1a4438] text-[#DCB473] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>বিমান টিকিটের ওয়েবসাইট লিংক যুক্ত করুন</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Search Bar (Red-marked category buttons removed as requested) */}
      <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-stone-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নোটিশের শিরোনাম বা বিবরণ দিয়ে খুঁজুন..."
            className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:ring-2 focus:ring-[#0f2922] outline-hidden placeholder:text-stone-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
            >
              মুছুন
            </button>
          )}
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
                        {canSubAdminEdit('notices') ? (
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
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                            {item.isActive !== false ? 'সক্রিয়' : 'লুকানো'}
                          </span>
                        )}
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
                          {canSubAdminEdit('notices') && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              title="সম্পাদনা করুন"
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canSubAdminDelete('notices') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteNotice(item)}
                              title="মুছে ফেলুন"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
              {canSubAdminEdit('notices') && (
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
              )}
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
