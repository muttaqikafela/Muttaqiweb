import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  PageId,
  ServiceItem,
  TeamMember,
  GalleryItem,
  PrayerTime,
  InquiryItem,
  ReviewItem
} from '../types';
import {
  Settings,
  Clock,
  Briefcase,
  Image as ImageIcon,
  Users,
  BarChart3,
  Inbox,
  LogOut,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Star,
  MessageSquareQuote,
  CheckCheck,
  Compass,
  BadgePercent,
  Database,
  Calculator,
  UserCheck,
  ShieldAlert,
  Edit3,
  Receipt,
  KeyRound,
  FileCheck,
  Printer,
  X,
  FileText,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Bell
} from 'lucide-react';
import { AdminHajiRegistrations } from '../components/AdminHajiRegistrations';
import { AdminPricingManager } from '../components/AdminPricingManager';
import { AdminFinanceManager } from '../components/AdminFinanceManager';
import { AdminSubAdminManager } from '../components/AdminSubAdminManager';
import { AdminSettings } from '../components/AdminSettings';
import { AdminNoticeManager } from '../components/AdminNoticeManager';
import { DeveloperPanel } from '../components/DeveloperPanel';
import { useSite } from '../context/SiteContext';

interface AdminDashboardProps {
  setCurrentPage: (page: PageId) => void;
}

type TabType =
  | 'approvals'
  | 'finance'
  | 'haji-registrations'
  | 'notices'
  | 'sub-admins'
  | 'pricing'
  | 'general'
  | 'prayers'
  | 'services'
  | 'gallery'
  | 'team'
  | 'stats'
  | 'inquiries'
  | 'reviews';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentPage }) => {
  const {
    isAdminLoggedIn,
    logout,
    companyInfo,
    updateCompanyInfo,
    prayerSchedule,
    updatePrayerTimes,
    services,
    deleteService,
    toggleServiceApproval,
    teamMembers,
    deleteTeamMember,
    toggleTeamApproval,
    galleryItems,
    deleteGalleryItem,
    toggleGalleryApproval,
    stats,
    updateStats,
    inquiries,
    updateInquiryStatus,
    deleteInquiry,
    contactMessages,
    deleteMessage,
    reviews,
    deleteReview,
    toggleReviewApproval,
    openServiceModal,
    openGalleryModal,
    openTeamModal,
    openReviewModal,
    openInquiryModal,
    requestConfirm,
    showToast,
    syncAllWithSupabase,
    hajiFinanceRecords,
    resetToDefaults,
    subAdmins,
    isSubAdmin,
    canEdit,
    activeSubAdmin,
    kafelaGroups,
    assignHajiGroup,
    adminCredentials,
    notices
  } = useAdmin();
  const { isDeveloper, developerEmail, developerLogout, syncStatus, setSyncStatus, syncSiteData } = useSite();
  const [showDevPanel, setShowDevPanel] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('approvals');
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; hajiName: string } | null>(null);

  // General Settings Form state
  const [generalForm, setGeneralForm] = useState(companyInfo);

  // Prayers Form state
  const [prayersForm, setPrayersForm] = useState<PrayerTime[]>(prayerSchedule);

  // Stats Form state
  const [statsForm, setStatsForm] = useState(stats);

  // Haji registrations (সম্পূর্ণ যাচাইকৃত ফিল্টার)
  const hajiRegistrations = inquiries.filter(
    (i) =>
      i.registrationType === 'haji' ||
      i.serviceId === 'haji-full-registration' ||
      !!i.hajiUserId ||
      (i.registrationRef && i.registrationRef.startsWith('HAJI-'))
  );
  const pendingHajis = hajiRegistrations.filter((h) => h.status === 'pending');
  const pendingHajiCount = pendingHajis.length;

  // Non-Haji general booking inquiries
  const generalPendingInquiries = inquiries.filter(
    (i) =>
      i.status === 'pending' &&
      i.registrationType !== 'haji' &&
      i.serviceId !== 'haji-full-registration' &&
      !i.hajiUserId &&
      !(i.registrationRef && i.registrationRef.startsWith('HAJI-'))
  );

  // Pending counts for badge
  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'pending').length;
  const pendingReviewsCount = reviews.filter((r) => !r.isApproved).length;
  const unapprovedGalleryCount = galleryItems.filter((g) => g.isApproved === false).length;
  const unapprovedServicesCount = services.filter((s) => s.isApproved === false).length;
  const unapprovedTeamCount = teamMembers.filter((t) => t.isApproved === false).length;
  const totalPendingCount =
    pendingInquiriesCount +
    pendingReviewsCount +
    unapprovedGalleryCount +
    unapprovedServicesCount +
    unapprovedTeamCount;

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubAdmin) {
      showToast('সাব-এডমিন একাউন্ট থেকে তথ্য পরিবর্তন বা সংরক্ষণ করা যাবে না (রিড-অনলি মোড)!');
      return;
    }
    updateCompanyInfo(generalForm);
  };

  const handleSavePrayers = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubAdmin) {
      showToast('সাব-এডমিন একাউন্ট থেকে নামাজের সময় পরিবর্তন করা যাবে না (রিড-অনলি মোড)!');
      return;
    }
    updatePrayerTimes(prayersForm);
  };

  const handleSaveStats = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubAdmin) {
      showToast('সাব-এডমিন একাউন্ট থেকে পরিসংখ্যান পরিবর্তন করা যাবে না (রিড-অনলি মোড)!');
      return;
    }
    updateStats(statsForm);
  };

  if (!isAdminLoggedIn && !isDeveloper) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-xl text-center border border-stone-200">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-2">প্রবেশাধিকার সংরক্ষিত</h2>
          <p className="text-sm text-stone-600 mb-6">
            এই ড্যাশবোর্ডটি অ্যাক্সেস করার জন্য আপনাকে এডমিন হিসেবে লগইন করতে হবে।
          </p>
          <button
            onClick={() => setCurrentPage('home')}
            className="w-full py-2.5 bg-[#0f2922] text-[#DCB473] font-semibold rounded-xl"
          >
            হোম পেইজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/90 text-stone-800 pb-20">
      {/* Admin Header Bar */}
      <div className="bg-[#0b1f1a] text-white border-b border-[#DCB473]/30 sticky top-10 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCB473] text-[#0f2922] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">মুত্তাকী এডমিন কন্ট্রোল সেন্টার</h1>
                {isSubAdmin ? (
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                    <ShieldAlert className="w-2.5 h-2.5" />
                    <span>সাব-এডমিন (রিড-অনলি মোড)</span>
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>{isDeveloper ? 'ডেভেলপার কন্ট্রোল' : 'সুপার এডমিন (সম্পূর্ণ নিয়ন্ত্রণ)'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300">
                {isSubAdmin ? (
                  <>
                    সাব-এডমিন: <span className="font-semibold text-white">{activeSubAdmin?.englishName}</span> | ইউজার আইডি: <span className="font-mono text-[#DCB473]">{activeSubAdmin?.username || activeSubAdmin?.email}</span>
                  </>
                ) : isDeveloper ? (
                  <>
                    ডেভেলপার আইডি: <span className="font-mono text-amber-300">{developerEmail}</span>
                  </>
                ) : (
                  <>
                    এডমিন আইডি: <span className="font-mono text-[#DCB473]">{adminCredentials.email}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ওয়েবসাইটে দেখুন</span>
            </button>

            {syncStatus.lastSyncTime && (
              <span className="text-[11px] text-stone-300">শেষ সিঙ্ক: {syncStatus.lastSyncTime}{syncStatus.lastResult === 'success' ? ' — সফল হয়েছে' : syncStatus.lastResult === 'failed' ? ' — ব্যর্থ হয়েছে' : ''}</span>
            )}
            <button
              onClick={async () => {
                setSyncStatus({ ...syncStatus, pending: true });
                const ok = await syncAllWithSupabase();
                await syncSiteData();
                setSyncStatus({ lastSyncTime: new Date().toLocaleTimeString('bn-BD'), lastResult: ok ? 'success' : 'failed', pending: false });
              }}
              disabled={syncStatus.pending}
              className="px-4 py-2 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>সব ডাটা সিঙ্ক করুন</span>
            </button>
            {isDeveloper && (
              <button
                onClick={() => setShowDevPanel(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>ডেভেলপার প্যানেল</span>
              </button>
            )}
            <button
              onClick={() => {
                developerLogout();
                logout();
                setCurrentPage('home');
              }}
              className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-2 rounded-2xl shadow-xs border border-stone-200">
          {[
            {
              id: 'approvals',
              label: `অনুমোদন কেন্দ্র (${totalPendingCount})`,
              icon: ShieldCheck,
              highlight: totalPendingCount > 0
            },
            {
              id: 'finance',
              label: `হজ ও ওমরাহ্ আয়-ব্যয় (${hajiFinanceRecords.length})`,
              icon: Calculator,
              highlight: true
            },
            {
              id: 'haji-registrations',
              label: `হাজী নিবন্ধন (${hajiRegistrations.length})`,
              icon: Compass,
              highlight: pendingHajiCount > 0
            },
            {
              id: 'notices',
              label: `নোটিশ বোর্ড (${notices.length})`,
              icon: Bell,
              highlight: notices.some((n) => n.isPinned)
            },
            {
              id: 'sub-admins',
              label: `সাব-এডমিন (${subAdmins.length})`,
              icon: UserCheck
            },
            {
              id: 'pricing',
              label: 'মূল্য নির্ধারণ (প্যাকেজ, রুম, বিমান, খরচ)',
              icon: BadgePercent
            },
            { id: 'services', label: `সেবাসমূহ (${services.length})`, icon: Briefcase },
            { id: 'gallery', label: `গ্যালারি (${galleryItems.length})`, icon: ImageIcon },
            { id: 'team', label: `পরিচালনা পর্ষদ (${teamMembers.length})`, icon: Users },
            { id: 'reviews', label: `মতামত ও রিভিউ (${reviews.length})`, icon: MessageSquareQuote },
            { id: 'prayers', label: 'নামাজের সময়', icon: Clock },
            { id: 'stats', label: 'পরিসংখ্যান', icon: BarChart3 },
            { id: 'general', label: 'সাধারণ সেটিংস', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-[#0f2922] text-[#DCB473] shadow-md'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                } ${tab.highlight && !isActive ? 'border border-amber-400 bg-amber-50/60 text-amber-900' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Sub-Admin Read-Only Notice Banner */}
        {isSubAdmin && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-amber-950">
                    সাব-এডমিন ভিউয়ার মোড (Sub-Admin Read-Only Access)
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-400">
                    রিড-অনলি ভিউ
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-0.5">
                  লগইনকৃত সাব-এডমিন: <strong>{activeSubAdmin?.englishName}</strong> (ইউজার আইডি: <code>{activeSubAdmin?.username || activeSubAdmin?.email}</code>)। আপনি ওয়েবসাইটের সকল তথ্য দেখতে ও রিপোর্ট প্রিন্ট করতে পারবেন, কিন্তু কোনো তথ্য <strong>এডিট, অনুমোদন (Approve) বা ডিলিট</strong> করতে পারবেন না।
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 0: APPROVAL CENTER (অনুমোদন কেন্দ্র)                 */}
        {/* ======================================================== */}
        {activeTab === 'approvals' && (
          <div className="space-y-8">
            {/* Summary Banner */}
            <div className="bg-gradient-to-r from-[#0f2922] to-[#164438] text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DCB473]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#DCB473] font-bold block mb-1">
                  কেন্দ্রীয় নিয়ন্ত্রণ
                </span>
                <h2 className="text-2xl font-bold">সকল ডাটা অনুমোদন ও নিয়ন্ত্রণ কেন্দ্র</h2>
                <p className="text-xs sm:text-sm text-stone-300 mt-1">
                  এখানে আপনি বুকিং অনুরোধ, রিভিউ, নতুন সেবা, গ্যালারি ছবি ও টিম মেম্বার অনুমোদন, সম্পাদন অথবা মুছে ফেলতে পারবেন।
                </p>
              </div>

              <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
                <span className="block text-2xl font-extrabold text-[#DCB473]">{totalPendingCount}</span>
                <span className="text-[11px] text-stone-200">অপেক্ষমাণ আইটেম</span>
              </div>
            </div>

            {/* 1. DEDICATED PENDING HAJI REGISTRATIONS SECTION */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#DCB473]/60 shadow-md space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-300 flex items-center justify-center font-bold shrink-0">
                    <Compass className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#0f2922]">
                        অনুমোদনের অপেক্ষায় হাজী প্রাক-নিবন্ধন আবেদনসমূহ
                      </h3>
                      <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full animate-pulse">
                        {pendingHajiCount} টি অপেক্ষমাণ
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      হাজী আবেদনকারীদের ছবি, পাসপোর্ট ও NID যাচাইপূর্বক এক ক্লিকে অনুমোদন, কাফেলা গ্রুপ নির্বাচন, এডিট বা ডিলিট করুন।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('haji-registrations')}
                  className="px-4 py-2 bg-gradient-to-r from-[#0f2922] to-[#1a4438] hover:from-[#14352c] hover:to-[#225749] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>সম্পূর্ণ হাজী রেজিস্ট্রি প্যানেল</span>
                  <ExternalLink className="w-3 h-3 text-stone-300" />
                </button>
              </div>

              {pendingHajis.length === 0 ? (
                <div className="p-8 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-emerald-950">বর্তমানে কোনো হাজী আবেদন অপেক্ষমাণ (পেন্ডিং) নেই</h4>
                  <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
                    লগইন প্যানেল বা ওয়েবসাইট থেকে নতুন কোনো হাজী রেজিস্ট্রেশন সম্পন্ন করা মাত্রই স্বয়ংক্রিয়ভাবে তার সকল তথ্য, ছবি ও স্লিপসহ এখানে পেন্ডিং হিসেবে যুক্ত হবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingHajis.map((haji) => {
                    const displayUserId = haji.hajiUserId || haji.registrationRef || haji.phone;
                    const calculatedSubtotal = haji.subtotalAmount || haji.finalTotalAmount || 0;
                    const paid = Number(haji.paidAmount) || 0;
                    const due = haji.dueAmount !== undefined ? Number(haji.dueAmount) : Math.max(0, calculatedSubtotal - paid);

                    return (
                      <div
                        key={haji.id}
                        className="p-5 rounded-3xl bg-amber-50/40 border-2 border-amber-300/80 shadow-xs hover:shadow-md transition-all space-y-4"
                      >
                        {/* Top Bar: Photo, Name, Status, and Credentials */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-amber-200/80">
                          <div className="flex items-start sm:items-center gap-3.5">
                            {haji.photoUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: haji.photoUrl!,
                                    title: 'হাজীর পাসপোর্ট সাইজ ছবি',
                                    hajiName: haji.nameBn || haji.name
                                  })
                                }
                                className="relative group cursor-pointer shrink-0"
                                title="ছবি বড় করে দেখুন"
                              >
                                <img
                                  src={haji.photoUrl}
                                  alt="হাজীর ছবি"
                                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#DCB473] shadow-xs group-hover:opacity-90 transition-opacity"
                                />
                                <span className="absolute inset-0 rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                                  জুম
                                </span>
                              </button>
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                                <Compass className="w-7 h-7" />
                              </div>
                            )}

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base sm:text-lg font-bold text-[#0f2922]">
                                  {haji.nameBn || haji.name}
                                </h4>
                                {haji.nameEn && (
                                  <span className="text-xs font-mono font-semibold text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                                    {haji.nameEn}
                                  </span>
                                )}
                                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>পেন্ডিং (অনুমোদনের অপেক্ষায়)</span>
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-600">
                                <span className="font-semibold text-emerald-950 bg-emerald-100/70 px-2 py-0.5 rounded">
                                  {haji.serviceName || 'ওমরাহ/হজ্ব কাফেলা'}
                                </span>
                                {haji.selectedGroup && (
                                  <span className="font-semibold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                                    গ্রুপ: {haji.selectedGroup}
                                  </span>
                                )}
                                <span className="text-stone-400">•</span>
                                <span>আবেদনের তারিখ: {haji.date}</span>
                              </div>
                            </div>
                          </div>

                          {/* Login Credentials Box */}
                          <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center gap-3 shrink-0">
                            <div>
                              <span className="text-[10px] font-bold text-stone-500 block uppercase">হাজী ইউজার আইডি:</span>
                              <span className="font-mono font-bold text-emerald-900 text-xs sm:text-sm">
                                {displayUserId}
                              </span>
                            </div>
                            <div className="border-l border-stone-200 pl-3">
                              <span className="text-[10px] font-bold text-stone-500 block uppercase">পাসওয়ার্ড:</span>
                              <span className="font-mono font-bold text-stone-800 text-xs sm:text-sm">
                                {haji.hajiPassword || 'Haji12'}
                              </span>
                            </div>
                            {haji.registrationRef && (
                              <div className="border-l border-stone-200 pl-3">
                                <span className="text-[10px] font-bold text-stone-500 block uppercase">রেজিস্ট্রেশন রেফ:</span>
                                <span className="font-mono font-semibold text-[#b88e44] text-xs">
                                  {haji.registrationRef}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 4-Column Grid: Comprehensive Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          {/* Col 1: Contact */}
                          <div className="p-3 bg-white rounded-2xl border border-stone-200 space-y-1.5">
                            <span className="font-bold text-[#0f2922] block border-b border-stone-100 pb-1">
                              ১. ব্যক্তিগত ও যোগাযোগ
                            </span>
                            <div>
                              <span className="text-stone-500 block">মোবাইল নম্বর:</span>
                              <span className="font-mono font-bold text-stone-900">{haji.phone}</span>
                            </div>
                            {haji.guardianPhone && (
                              <div>
                                <span className="text-stone-500 block">অভিভাবকের মোবাইল:</span>
                                <span className="font-mono font-semibold text-stone-800">{haji.guardianPhone}</span>
                              </div>
                            )}
                            {haji.email && (
                              <div>
                                <span className="text-stone-500 block">ইমেইল:</span>
                                <span className="text-stone-800 truncate block">{haji.email}</span>
                              </div>
                            )}
                            {haji.dateOfBirth && (
                              <div>
                                <span className="text-stone-500 block">জন্ম তারিখ:</span>
                                <span className="font-mono text-stone-800">{haji.dateOfBirth}</span>
                              </div>
                            )}
                          </div>

                          {/* Col 2: Parents */}
                          <div className="p-3 bg-white rounded-2xl border border-stone-200 space-y-1.5">
                            <span className="font-bold text-[#0f2922] block border-b border-stone-100 pb-1">
                              ২. পিতা ও মাতার নাম
                            </span>
                            <div>
                              <span className="text-stone-500 block">পিতার নাম (বাংলা):</span>
                              <span className="font-semibold text-stone-900">{haji.fatherNameBn || 'দেওয়া হয়নি'}</span>
                            </div>
                            {haji.fatherNameEn && (
                              <div>
                                <span className="text-stone-500 block">পিতার নাম (ইংরেজি):</span>
                                <span className="font-mono text-stone-800">{haji.fatherNameEn}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-stone-500 block">মাতার নাম (বাংলা):</span>
                              <span className="font-semibold text-stone-900">{haji.motherNameBn || 'দেওয়া হয়নি'}</span>
                            </div>
                            {haji.motherNameEn && (
                              <div>
                                <span className="text-stone-500 block">মাতার নাম (ইংরেজি):</span>
                                <span className="font-mono text-stone-800">{haji.motherNameEn}</span>
                              </div>
                            )}
                          </div>

                          {/* Col 3: Addresses & Identity */}
                          <div className="p-3 bg-white rounded-2xl border border-stone-200 space-y-1.5">
                            <span className="font-bold text-[#0f2922] block border-b border-stone-100 pb-1">
                              ৩. ঠিকানা ও পরিচয়পত্র
                            </span>
                            <div>
                              <span className="text-stone-500 block">বর্তমান ঠিকানা:</span>
                              <span className="text-stone-800 leading-tight block">
                                {haji.presentAddress || haji.district || 'দেওয়া হয়নি'}
                                {haji.presentPostCode && ` (পোস্ট: ${haji.presentPostCode})`}
                              </span>
                            </div>
                            {haji.permanentAddress && (
                              <div>
                                <span className="text-stone-500 block">স্থায়ী ঠিকানা:</span>
                                <span className="text-stone-700 leading-tight block">
                                  {haji.permanentAddress}
                                  {haji.permanentPostCode && ` (পোস্ট: ${haji.permanentPostCode})`}
                                </span>
                              </div>
                            )}
                            <div className="pt-1 border-t border-stone-100">
                              <span className="text-stone-500 block">NID নম্বর:</span>
                              <span className="font-mono font-bold text-stone-900">{haji.nidNo || 'নেই'}</span>
                            </div>
                            <div>
                              <span className="text-stone-500 block">পাসপোর্ট নম্বর:</span>
                              <span className="font-mono font-bold text-stone-900">{haji.passportNo || 'নেই'}</span>
                            </div>
                          </div>

                          {/* Col 4: Kafela Group Selection & Partners */}
                          <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-2">
                            <span className="font-bold text-purple-950 block border-b border-purple-200 pb-1">
                              ৪. কাফেলা গ্রুপ বরাদ্দ (Group Selection)
                            </span>

                            {/* Group Dropdown */}
                            <div>
                              <label className="text-[11px] font-bold text-stone-700 block mb-1">
                                কাফেলা গ্রুপ নির্বাচন করুন:
                              </label>
                              <select
                                value={haji.selectedGroup || ''}
                                disabled={isSubAdmin}
                                onChange={(e) => assignHajiGroup(haji.id, e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-purple-300 bg-white font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-[#DCB473] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-2xs"
                              >
                                <option value="">-- গ্রুপ বরাদ্দ করুন --</option>
                                {kafelaGroups.map((grp) => (
                                  <option key={grp.id} value={grp.name}>
                                    {grp.name} ({grp.category || 'কাফেলা'})
                                  </option>
                                ))}
                              </select>
                              {haji.selectedGroup ? (
                                <span className="text-[10px] text-purple-900 font-bold mt-1 inline-block bg-purple-200/80 px-2 py-0.5 rounded border border-purple-300">
                                  ✓ নির্ধারিত: {haji.selectedGroup}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-800 font-semibold mt-1 inline-block">
                                  ⚠️ এখনও কোনো গ্রুপ বরাদ্দ করা হয়নি
                                </span>
                              )}
                            </div>

                            <div>
                              <span className="text-stone-500 block">আবেদনে উল্লিখিত সহযাত্রী:</span>
                              <span className="font-bold text-stone-800">{haji.totalHajPartner || '০ জন (একক)'}</span>
                            </div>
                            {haji.partnerDetails && (
                              <div>
                                <span className="text-stone-500 block">সহযাত্রীদের নাম:</span>
                                <p className="text-[11px] text-stone-700 bg-white p-1.5 rounded border border-purple-200 leading-snug">
                                  {haji.partnerDetails}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Package & Payment Financial Bar */}
                        <div className="p-3.5 rounded-2xl bg-stone-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="text-[#DCB473] font-bold">প্যাকেজ: {haji.serviceName}</span>
                            {haji.roomPreference && <span>• রুম: {haji.roomPreference}</span>}
                            {haji.airfareOption && <span>• ফ্লাইট: {haji.airfareOption}</span>}
                            <span>• যাত্রী: {haji.travelersCount || 1} জন</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-800">
                            <div>
                              <span className="text-[10px] text-stone-400 block">মোট প্রাক্কলিত খরচ:</span>
                              <span className="font-mono font-bold text-sm text-stone-100">
                                ৳ {calculatedSubtotal.toLocaleString('bn-BD')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-400 block">জমা দেওয়া হয়েছে:</span>
                              <span className="font-mono font-bold text-sm text-emerald-400">
                                ৳ {paid.toLocaleString('bn-BD')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-amber-400 block">অবশিষ্ট বকেয়া (Due):</span>
                              <span className="font-mono font-bold text-sm text-amber-300">
                                ৳ {due.toLocaleString('bn-BD')}
                              </span>
                            </div>
                            {haji.paymentReceiptUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: haji.paymentReceiptUrl!,
                                    title: 'টাকা জমার ব্যাংক স্লিপ / মানি রিসিট',
                                    hajiName: haji.nameBn || haji.name
                                  })
                                }
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                              >
                                <Receipt className="w-3.5 h-3.5 text-emerald-200" />
                                <span>টাকার রসিদ দেখুন</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Uploaded Documents Strip */}
                        {(haji.photoUrl || haji.signatureUrl || haji.nidDocUrl || haji.passportDocUrl || haji.paymentReceiptUrl) && (
                          <div className="p-2.5 bg-white rounded-2xl border border-stone-200 flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-stone-700 flex items-center gap-1 mr-1">
                              <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                              সংযুক্ত ডকুমেন্টস:
                            </span>

                            {haji.photoUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: haji.photoUrl!,
                                    title: 'হাজীর পাসপোর্ট সাইজ ছবি',
                                    hajiName: haji.nameBn || haji.name
                                  })
                                }
                                className="px-2.5 py-1 bg-stone-50 hover:bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-emerald-600" />
                                <span>ছবি</span>
                              </button>
                            )}

                            {haji.signatureUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: haji.signatureUrl!,
                                    title: 'আবেদনকারীর স্বাক্ষর',
                                    hajiName: haji.nameBn || haji.name
                                  })
                                }
                                className="px-2.5 py-1 bg-stone-50 hover:bg-blue-50 text-blue-900 rounded-lg border border-blue-200 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-blue-600" />
                                <span>স্বাক্ষর</span>
                              </button>
                            )}

                            {haji.nidDocUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: haji.nidDocUrl!,
                                    title: 'জাতীয় পরিচয়পত্র (NID)',
                                    hajiName: haji.nameBn || haji.name
                                  })
                                }
                                className="px-2.5 py-1 bg-stone-50 hover:bg-amber-50 text-amber-900 rounded-lg border border-amber-200 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-amber-600" />
                                <span>NID স্ক্যান</span>
                              </button>
                            )}

                            {haji.passportDocUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: haji.passportDocUrl!,
                                    title: 'পাসপোর্ট স্ক্যান কপি',
                                    hajiName: haji.nameBn || haji.name
                                  })
                                }
                                className="px-2.5 py-1 bg-stone-50 hover:bg-purple-50 text-purple-900 rounded-lg border border-purple-200 font-medium flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-purple-600" />
                                <span>পাসপোর্ট স্ক্যান</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Action Buttons: Approve, Edit, Delete */}
                        <div className="p-3 bg-white rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {!isSubAdmin ? (
                              <button
                                type="button"
                                onClick={() => updateInquiryStatus(haji.id, 'approved')}
                                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                <span>অনুমোদন করুন (Approve)</span>
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl">
                                সাব-এডমিন (রিড-অনলি মোড)
                              </span>
                            )}

                            <span className="text-[11px] text-stone-500">
                              💡 অনুমোদন করার সাথে সাথে হাজী তার ইউজার আইডি ও পাসওয়ার্ড দিয়ে ওয়েবসাইটে প্রবেশ করতে পারবেন।
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {!isSubAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openInquiryModal(haji)}
                                  className="px-3.5 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                                  title="সম্পূর্ণ তথ্য সম্পাদনা করুন"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>সম্পাদনা (Edit)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    requestConfirm({
                                      title: 'হাজী প্রাক-নিবন্ধন মুছে ফেলা',
                                      message: `আপনি কি নিশ্চিতভাবে "${haji.nameBn || haji.name}" এর আবেদনটি মুছে ফেলতে চান?`,
                                      confirmText: 'হ্যাঁ, মুছে ফেলুন',
                                      onConfirm: () => deleteInquiry(haji.id)
                                    });
                                  }}
                                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                                  title="আবেদন মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>মুছুন (Delete)</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-stone-400">রিড-অনলি ভিউয়ার</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. GENERAL PENDING INQUIRIES SECTION (Non-Haji bookings) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg text-[#0f2922] flex items-center gap-2">
                  <span>সাধারণ বুকিং ও অন্যান্য অনুসন্ধানসমূহ</span>
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {generalPendingInquiries.length}
                  </span>
                </h3>
              </div>

              {generalPendingInquiries.length === 0 ? (
                <p className="text-xs text-stone-500 py-3">বর্তমানে কোনো সাধারণ বুকিং অনুরোধ অনুমোদনের অপেক্ষায় নেই।</p>
              ) : (
                <div className="space-y-3">
                  {generalPendingInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">{inq.name}</span>
                          <span className="font-mono text-xs font-bold text-[#0f2922] bg-white px-2 py-0.5 rounded-md border">
                            {inq.phone}
                          </span>
                          <span className="text-xs text-stone-400">({inq.date})</span>
                        </div>
                        <p className="text-xs text-stone-700">
                          <strong>সেবা:</strong> {inq.serviceName} | <strong>যাত্রী:</strong> {inq.travelers}
                        </p>
                        {inq.message && (
                          <p className="text-xs text-stone-600 bg-white p-2 rounded-lg border border-amber-200 max-w-xl">
                            &ldquo;{inq.message}&rdquo;
                          </p>
                        )}
                        {inq.adminNotes && (
                          <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            <strong>এডমিন নোট:</strong> {inq.adminNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isSubAdmin ? (
                          <>
                            <button
                              onClick={() => {
                                updateInquiryStatus(inq.id, 'approved');
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>অনুমোদন করুন</span>
                            </button>
                            <button
                              onClick={() => openInquiryModal(inq)}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>সম্পাদন</span>
                            </button>
                            <button
                              onClick={() => {
                                requestConfirm({
                                  title: 'বুকিং মুছে ফেলা',
                                  message: `আপনি কি "${inq.name}" এর বুকিং অনুরোধটি মুছে ফেলতে চান?`,
                                  confirmText: 'হ্যাঁ, মুছে ফেলুন',
                                  onConfirm: () => deleteInquiry(inq.id)
                                });
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
                              title="মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-xl">
                            রিড-অনলি মোড
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Reviews Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg text-[#0f2922] flex items-center gap-2">
                  <span>অনুমোদনের অপেক্ষায় গ্রাহক মতামত / রিভিউ</span>
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {pendingReviewsCount}
                  </span>
                </h3>
              </div>

              {reviews.filter((r) => !r.isApproved).length === 0 ? (
                <p className="text-xs text-stone-500 py-3">বর্তমানে কোনো রিভিউ অনুমোদনের অপেক্ষায় নেই।</p>
              ) : (
                <div className="space-y-3">
                  {reviews
                    .filter((r) => !r.isApproved)
                    .map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900">{rev.name}</span>
                            <span className="text-xs text-stone-500">({rev.location})</span>
                            <span className="text-xs text-amber-600 font-bold flex items-center">
                              ★ {rev.rating}/৫
                            </span>
                          </div>
                          <p className="text-xs text-stone-600">
                            <strong>প্যাকেজ:</strong> {rev.packageTaken}
                          </p>
                          <p className="text-xs text-stone-700 bg-white p-2 rounded-lg border border-amber-200 max-w-xl">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!isSubAdmin ? (
                            <>
                              <button
                                onClick={() => {
                                  toggleReviewApproval(rev.id);
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>অনুমোদন ও লাইভ করুন</span>
                              </button>
                              <button
                                onClick={() => openReviewModal(rev)}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>সম্পাদন</span>
                              </button>
                              <button
                                onClick={() => {
                                  requestConfirm({
                                    title: 'রিভিউ মুছে ফেলা',
                                    message: `আপনি কি "${rev.name}" এর রিভিউটি মুছে ফেলতে চান?`,
                                    confirmText: 'হ্যাঁ, মুছে ফেলুন',
                                    onConfirm: () => deleteReview(rev.id)
                                  });
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer"
                                title="মুছুন"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-xl">
                              রিড-অনলি মোড
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Unapproved / Hidden Services & Gallery Images */}
            {(unapprovedGalleryCount > 0 || unapprovedServicesCount > 0 || unapprovedTeamCount > 0) && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
                <h3 className="font-bold text-lg text-[#0f2922]">
                  অন্যান্য ড্রাফট / লুকানো আইটেম
                </h3>

                {unapprovedServicesCount > 0 && (
                  <div className="p-4 bg-stone-50 rounded-2xl border space-y-2">
                    <span className="text-xs font-bold text-stone-700">ড্রাফট সেবাসমূহ:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {services
                        .filter((s) => s.isApproved === false)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="p-3 bg-white border rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <span className="font-semibold text-stone-900">{s.title}</span>
                            <div className="flex items-center gap-1.5">
                              {!isSubAdmin ? (
                                <>
                                  <button
                                    onClick={() => toggleServiceApproval(s.id)}
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                                  >
                                    অনুমোদন
                                  </button>
                                  <button
                                    onClick={() => openServiceModal(s)}
                                    className="p-1 bg-stone-100 text-stone-700 rounded-lg cursor-pointer"
                                    title="সম্পাদন"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      requestConfirm({
                                        title: 'সেবা মুছে ফেলা',
                                        message: `আপনি কি "${s.title}" সেবাটি মুছে ফেলতে চান?`,
                                        confirmText: 'হ্যাঁ, মুছে ফেলুন',
                                        onConfirm: () => deleteService(s.id)
                                      });
                                    }}
                                    className="p-1 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                                    title="মুছুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-semibold">রিড-অনলি</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {unapprovedGalleryCount > 0 && (
                  <div className="p-4 bg-stone-50 rounded-2xl border space-y-2">
                    <span className="text-xs font-bold text-stone-700">ড্রাফট গ্যালারি ছবি:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {galleryItems
                        .filter((g) => g.isApproved === false)
                        .map((g) => (
                          <div
                            key={g.id}
                            className="p-3 bg-white border rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="flex items-center gap-2">
                              <img src={g.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              <span className="font-semibold text-stone-900 line-clamp-1">{g.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {!isSubAdmin ? (
                                <>
                                  <button
                                    onClick={() => toggleGalleryApproval(g.id)}
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] cursor-pointer"
                                  >
                                    অনুমোদন
                                  </button>
                                  <button
                                    onClick={() => openGalleryModal(g)}
                                    className="p-1 bg-stone-100 text-stone-700 rounded-lg cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      requestConfirm({
                                        title: 'ছবি মুছে ফেলা',
                                        message: `আপনি কি "${g.title}" ছবিটি মুছে ফেলতে চান?`,
                                        confirmText: 'হ্যাঁ, মুছে ফেলুন',
                                        onConfirm: () => deleteGalleryItem(g.id)
                                      });
                                    }}
                                    className="p-1 bg-rose-50 text-rose-600 rounded-lg cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-semibold">রিড-অনলি</span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB: HAJJ & UMRAH INCOME & EXPENSE FINANCIAL LEDGER     */}
        {/* ======================================================== */}
        {activeTab === 'finance' && (
          <AdminFinanceManager />
        )}

        {/* ======================================================== */}
        {/* TAB: HAJI REGISTRATIONS MANAGEMENT                     */}
        {/* ======================================================== */}
        {activeTab === 'haji-registrations' && (
          <AdminHajiRegistrations />
        )}

        {/* ======================================================== */}
        {/* TAB: SUB-ADMINS MANAGEMENT                               */}
        {/* ======================================================== */}
        {activeTab === 'sub-admins' && (
          <AdminSubAdminManager />
        )}

        {/* ======================================================== */}
        {/* TAB: PRICING MANAGEMENT (Packages, Rooms, Flights, Etc.) */}
        {/* ======================================================== */}
        {activeTab === 'pricing' && (
          <AdminPricingManager />
        )}

        {/* ======================================================== */}
        {/* TAB 1: SERVICES MANAGEMENT (Approve, Edit, Delete)       */}
        {/* ======================================================== */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]">সেবাসমূহ ও প্যাকেজ নিয়ন্ত্রণ ({services.length})</h2>
                <p className="text-xs text-stone-500">
                  যেকোনো সেবা অনুমোদন, সম্পাদন অথবা মুছে ফেলুন। অননুমোদিত সেবাগুলো পাবলিক ওয়েবসাইটে প্রদর্শিত হবে না।
                </p>
              </div>
              {!isSubAdmin && (
                <button
                  onClick={() => openServiceModal('new')}
                  className="px-4 py-2.5 bg-[#0f2922] text-[#DCB473] hover:bg-[#184236] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন সেবা যুক্ত করুন</span>
                </button>
              )}
            </div>

            {/* List of Services with Approval, Edit, Delete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-all ${
                    svc.isApproved === false ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900 text-base">{svc.title}</h3>
                        {svc.isApproved === false ? (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5" />
                            <span>অননুমোদিত (ড্রাফট)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            <span>অনুমোদিত ও লাইভ</span>
                          </span>
                        )}
                      </div>
                      {svc.badge && (
                        <span className="text-[10px] bg-[#DCB473]/20 text-[#0f2922] font-bold px-2 py-0.5 rounded-full">
                          {svc.badge}
                        </span>
                      )}
                    </div>

                    {svc.subtitle && <p className="text-xs text-[#b88e44] font-semibold mb-2">{svc.subtitle}</p>}
                    <p className="text-xs text-stone-600 line-clamp-2 mb-3">{svc.shortDesc}</p>
                    <ul className="text-[11px] text-stone-500 space-y-1 mb-4">
                      {svc.features.slice(0, 3).map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Controls: Approve, Edit, Delete */}
                  {!isSubAdmin ? (
                    <div className="pt-3 border-t flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleServiceApproval(svc.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer ${
                          svc.isApproved === false
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-stone-100 text-stone-700 hover:bg-amber-100 hover:text-amber-900'
                        }`}
                      >
                        {svc.isApproved === false ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>অনুমোদন দিন</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>ড্রাফট করুন</span>
                          </>
                        )}
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openServiceModal(svc)}
                          className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>সম্পাদন</span>
                        </button>

                        <button
                          onClick={() => {
                            requestConfirm({
                              title: 'সেবা মুছে ফেলা',
                              message: `আপনি কি "${svc.title}" সেবাটি মুছে ফেলতে চান?`,
                              confirmText: 'হ্যাঁ, মুছে ফেলুন',
                              onConfirm: () => deleteService(svc.id)
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>মুছুন</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t text-right">
                      <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg">
                        সাব-এডমিন (রিড-অনলি)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: GALLERY MANAGEMENT (Approve, Edit, Delete)        */}
        {/* ======================================================== */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]">ফটো গ্যালারি নিয়ন্ত্রণ ({galleryItems.length})</h2>
                <p className="text-xs text-stone-500">
                  ওয়েবসাইটে প্রদর্শিত পবিত্র স্থানসমূহ ও কাফেলার ছবি সরাসরি যুক্ত বা সম্পাদন করুন
                </p>
              </div>

              {!isSubAdmin && (
                <button
                  onClick={() => openGalleryModal('new')}
                  className="px-4 py-2.5 bg-[#0f2922] text-[#DCB473] hover:bg-[#184236] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন ছবি যোগ করুন</span>
                </button>
              )}
            </div>

            {/* Gallery Grid with Approve/Unapprove, Edit, Delete */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl overflow-hidden border shadow-xs group relative flex flex-col justify-between transition-all ${
                    item.isApproved === false ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200'
                  }`}
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />

                    <div className="absolute top-2 left-2 flex gap-1">
                      {item.isApproved === false ? (
                        <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-md shadow">
                          অননুমোদিত
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md shadow">
                          অনুমোদিত
                        </span>
                      )}
                    </div>

                    {!isSubAdmin && (
                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <button
                          onClick={() => openGalleryModal(item)}
                          className="p-1.5 bg-white/90 hover:bg-white text-stone-800 rounded-lg shadow-md cursor-pointer"
                          title="সম্পাদন করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            requestConfirm({
                              title: 'ছবি মুছে ফেলা',
                              message: `আপনি কি "${item.title}" ছবিটি মুছতে চান?`,
                              confirmText: 'হ্যাঁ, মুছে ফেলুন',
                              onConfirm: () => deleteGalleryItem(item.id)
                            });
                          }}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md cursor-pointer"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h4 className="font-bold text-xs text-stone-800 line-clamp-1">{item.title}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-[#b88e44] font-medium">{item.category}</span>
                      {!isSubAdmin ? (
                        <button
                          onClick={() => toggleGalleryApproval(item.id)}
                          className="text-[11px] font-bold text-stone-600 hover:text-[#0f2922] underline cursor-pointer"
                        >
                          {item.isApproved === false ? 'অনুমোদন দিন' : 'লুকিয়ে রাখুন'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-semibold">রিড-অনলি</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TEAM MANAGEMENT (Approve, Edit, Delete)           */}
        {/* ======================================================== */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]">পরিচালনা পর্ষদ নিয়ন্ত্রণ ({teamMembers.length})</h2>
                <p className="text-xs text-stone-500">
                  আমাদের সম্পর্কে পেইজে প্রদর্শিত প্রতিষ্ঠাতা ও ব্যবস্থাপনা পরিচালকদের প্রোফাইল নিয়ন্ত্রণ করুন
                </p>
              </div>
              {!isSubAdmin && (
                <button
                  onClick={() => openTeamModal('new')}
                  className="px-4 py-2.5 bg-[#0f2922] text-[#DCB473] hover:bg-[#184236] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন সদস্য যুক্ত করুন</span>
                </button>
              )}
            </div>

            {/* Team Grid with Approve, Edit, Delete */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={`bg-white rounded-2xl p-4 border shadow-xs flex items-center justify-between gap-3 ${
                    member.isApproved === false ? 'border-amber-300 bg-amber-50/20' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-stone-900">{member.name}</h4>
                      <p className="text-[10px] text-[#b88e44] font-semibold">{member.role}</p>
                      <span className="text-[10px] text-stone-400">
                        {member.isApproved === false ? 'অননুমোদিত' : 'অনুমোদিত'}
                      </span>
                    </div>
                  </div>

                  {!isSubAdmin ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleTeamApproval(member.id)}
                        className="p-1 text-xs text-stone-500 hover:text-emerald-700 cursor-pointer"
                        title={member.isApproved === false ? 'অনুমোদন দিন' : 'লুকান'}
                      >
                        {member.isApproved === false ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => openTeamModal(member)}
                        className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                        title="সম্পাদন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          requestConfirm({
                            title: 'সদস্য মুছে ফেলা',
                            message: `আপনি কি "${member.name}" কে মুছে ফেলতে চান?`,
                            confirmText: 'হ্যাঁ, মুছে ফেলুন',
                            onConfirm: () => deleteTeamMember(member.id)
                          });
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                        title="মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-semibold">রিড-অনলি</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: REVIEWS & TESTIMONIALS (Approve, Edit, Delete)     */}
        {/* ======================================================== */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]">গ্রাহক মতামত ও রিভিউ নিয়ন্ত্রণ ({reviews.length})</h2>
                <p className="text-xs text-stone-500">
                  হাজীদের প্রদত্ত মতামত অনুমোদন করুন অথবা নতুন মতামত যুক্ত করুন
                </p>
              </div>
              {!isSubAdmin && (
                <button
                  onClick={() => openReviewModal('new')}
                  className="px-4 py-2.5 bg-[#0f2922] text-[#DCB473] hover:bg-[#184236] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন রিভিউ যোগ করুন</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
                    rev.isApproved ? 'border-stone-200' : 'border-amber-400 bg-amber-50/25'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-stone-900">{rev.name}</span>
                      <span className="text-xs text-amber-500 font-bold">★ {rev.rating}/৫</span>
                    </div>
                    <p className="text-xs text-stone-500 mb-1">{rev.location} | {rev.packageTaken}</p>
                    <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border mb-3">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  {!isSubAdmin ? (
                    <div className="pt-3 border-t flex items-center justify-between">
                      <button
                        onClick={() => toggleReviewApproval(rev.id)}
                        className="text-xs font-bold text-stone-700 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{rev.isApproved ? 'লুকিয়ে রাখুন' : 'অনুমোদন দিন'}</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openReviewModal(rev)}
                          className="p-1.5 text-xs text-stone-600 hover:text-stone-900 border rounded-lg cursor-pointer"
                          title="সম্পাদন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            requestConfirm({
                              title: 'রিভিউ মুছে ফেলা',
                              message: `আপনি কি "${rev.name}" এর রিভিউটি মুছে ফেলতে চান?`,
                              confirmText: 'হ্যাঁ, মুছে ফেলুন',
                              onConfirm: () => deleteReview(rev.id)
                            });
                          }}
                          className="p-1.5 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 rounded-lg cursor-pointer"
                          title="মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t text-right">
                      <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg">
                        সাব-এডমিন (রিড-অনলি)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: INBOX (INQUIRIES & CONTACT MESSAGES)              */}
        {/* ======================================================== */}
        {activeTab === 'inquiries' && (
          <div className="space-y-8">
            {/* Inquiries */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0f2922]">
                    প্যাকেজ অনুসন্ধান ও আবেদন তালিকা ({inquiries.length})
                  </h2>
                  <p className="text-xs text-stone-500">অনলাইন থেকে গ্রাহকদের পাঠানো প্যাকেজ কোটেশন অনুরোধসমূহ</p>
                </div>
              </div>

              {inquiries.length === 0 ? (
                <p className="text-center py-6 text-stone-400 text-sm">কোনো অনুসন্ধান অনুরোধ নেই।</p>
              ) : (
                <div className="space-y-3">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        inq.status === 'pending'
                          ? 'border-amber-300 bg-amber-50/40'
                          : inq.status === 'approved'
                          ? 'border-emerald-300 bg-emerald-50/30'
                          : 'border-stone-200 bg-stone-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">{inq.name}</span>
                          <span className="font-mono text-xs font-bold text-[#0f2922] bg-white px-2 py-0.5 rounded-md border">
                            {inq.phone}
                          </span>
                          <span className="text-xs text-stone-400">({inq.date})</span>

                          {/* Registration Type Badges */}
                          {inq.registrationType === 'haji' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-white shadow-xs">
                              হাজী নিবন্ধন
                            </span>
                          )}
                          {inq.registrationType === 'partner' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0f2922] text-[#DCB473] shadow-xs">
                              পার্টনার নিবন্ধন
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inq.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inq.status === 'contacted'
                                ? 'bg-blue-100 text-blue-800'
                                : inq.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {inq.status === 'approved'
                              ? 'অনুমোদিত'
                              : inq.status === 'contacted'
                              ? 'যোগাযোগ সম্পন্ন'
                              : inq.status === 'pending'
                              ? 'অপেক্ষমাণ'
                              : 'সম্পন্ন'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">
                          <strong>সেবা/ক্যাটাগরি:</strong> {inq.serviceName} | <strong>যাত্রী/ভলিউম:</strong> {inq.travelers}
                          {inq.registrationRef && (
                            <span className="ml-2 font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                              রেফ: {inq.registrationRef}
                            </span>
                          )}
                        </p>
                        {/* Haji/Partner extra details badge row */}
                        {(inq.photoUrl || inq.hajiUserId || inq.totalHajPartner || inq.hajPartnerIdLink || inq.passportNo || inq.nidNo) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {inq.photoUrl && (
                              <img
                                src={inq.photoUrl}
                                alt="হাজীর ছবি"
                                className="w-8 h-8 rounded-lg object-cover border border-emerald-400 shadow-xs"
                                title="হাজীর পাসপোর্ট সাইজ ছবি"
                              />
                            )}
                            {inq.hajiUserId && (
                              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 font-bold">
                                🔑 আইডি: {inq.hajiUserId}
                              </span>
                            )}
                            {inq.totalHajPartner && !inq.totalHajPartner.includes('০ জন') && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                                👥 মোট পার্টনার: {inq.totalHajPartner}
                              </span>
                            )}
                            {inq.passportNo && (
                              <span className="text-[10px] font-mono bg-purple-50 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                                পাসপোর্ট: {inq.passportNo}
                              </span>
                            )}
                            {inq.nidNo && (
                              <span className="text-[10px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                                NID: {inq.nidNo}
                              </span>
                            )}
                            {inq.hajPartnerIdLink && (
                              <span className="text-[10px] font-semibold bg-[#DCB473]/20 text-[#0f2922] px-2 py-0.5 rounded border border-[#DCB473]/40">
                                পার্টনার/সঙ্গী আইডি: {inq.hajPartnerIdLink}
                              </span>
                            )}
                            {(inq.signatureUrl || inq.nidDocUrl || inq.passportDocUrl) && (
                              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                📎 ডকুমেন্টস সংযুক্ত
                              </span>
                            )}
                          </div>
                        )}

                        {inq.message && (
                          <p className="text-xs text-stone-700 bg-white p-2 rounded-lg border max-w-xl">
                            &ldquo;{inq.message}&rdquo;
                          </p>
                        )}
                        {inq.adminNotes && (
                          <p className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                            নোট: {inq.adminNotes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isSubAdmin ? (
                          <>
                            {inq.status !== 'approved' && (
                              <button
                                onClick={() => updateInquiryStatus(inq.id, 'approved')}
                                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>অনুমোদন</span>
                              </button>
                            )}
                            <button
                              onClick={() => openInquiryModal(inq)}
                              className="px-3 py-1.5 bg-white border border-stone-200 text-stone-800 font-semibold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>সম্পাদন</span>
                            </button>
                            <button
                              onClick={() => {
                                requestConfirm({
                                  title: 'অনুরোধ মুছে ফেলা',
                                  message: `আপনি কি "${inq.name}" এর অনুরোধটি মুছে ফেলতে চান?`,
                                  confirmText: 'হ্যাঁ, মুছে ফেলুন',
                                  onConfirm: () => deleteInquiry(inq.id)
                                });
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-xl">
                            রিড-অনলি মোড
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Messages */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-[#0f2922]">
                  যোগাযোগ পাতা থেকে প্রাপ্ত বার্তা ({contactMessages.length})
                </h2>
              </div>

              {contactMessages.length === 0 ? (
                <p className="text-center py-6 text-stone-400 text-sm">কোনো বার্তা নেই।</p>
              ) : (
                <div className="space-y-3">
                  {contactMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-stone-900">{msg.name}</span>
                          <span className="font-mono text-xs font-bold text-[#0f2922] bg-white px-2 py-0.5 rounded-md border">
                            {msg.phone}
                          </span>
                          {msg.email && <span className="text-xs text-stone-500">{msg.email}</span>}
                        </div>
                        {!isSubAdmin && (
                          <button
                            onClick={() => {
                              requestConfirm({
                                title: 'বার্তা মুছে ফেলা',
                                message: `আপনি কি "${msg.name}" এর বার্তাটি মুছে ফেলতে চান?`,
                                confirmText: 'হ্যাঁ, মুছে ফেলুন',
                                onConfirm: () => deleteMessage(msg.id)
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#0f2922] font-bold">বিষয়: {msg.subject}</p>
                      <p className="text-xs text-stone-700 bg-white p-2 rounded-lg border mt-1">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: PRAYER TIMES                                      */}
        {/* ======================================================== */}
        {activeTab === 'prayers' && (
          <form onSubmit={handleSavePrayers} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]">আজকের নামাজের সময়সূচী নিয়ন্ত্রণ</h2>
                <p className="text-xs text-stone-500">দুপচাঁচিয়া ও বগুড়া এলাকার স্থানীয় সময় অনুযায়ী সময় সম্পাদন করুন</p>
              </div>
              {!isSubAdmin ? (
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>সময়সূচী সংরক্ষণ করুন</span>
                </button>
              ) : (
                <span className="px-4 py-2 bg-stone-100 text-stone-500 font-semibold rounded-xl text-xs">
                  সাব-এডমিন (রিড-অনলি)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {prayersForm.map((prayer, index) => (
                <div key={prayer.nameEn} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-base text-[#0f2922]">{prayer.nameBn}</span>
                    <span className="text-xs text-stone-400 font-mono uppercase">{prayer.nameEn}</span>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-500 mb-1 font-semibold">ওয়াক্তের সময়:</label>
                    <input
                      type="text"
                      disabled={isSubAdmin}
                      value={prayer.time}
                      onChange={(e) => {
                        const updated = [...prayersForm];
                        updated[index] = { ...updated[index], time: e.target.value };
                        setPrayersForm(updated);
                      }}
                      className="w-full px-3.5 py-2 bg-white font-mono font-bold text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] disabled:bg-stone-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 7: STATS                                             */}
        {/* ======================================================== */}
        {activeTab === 'stats' && (
          <form onSubmit={handleSaveStats} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[#0f2922]">পরিসংখ্যান ও মাইলফলক কাউন্টার</h2>
                <p className="text-xs text-stone-500">আমাদের সম্পর্কে পেইজে প্রদর্শিত ৪টি প্রধান সংখ্যা সম্পাদন করুন</p>
              </div>
              {!isSubAdmin ? (
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              ) : (
                <span className="px-4 py-2 bg-stone-100 text-stone-500 font-semibold rounded-xl text-xs">
                  সাব-এডমিন (রিড-অনলি)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsForm.map((st, index) => (
                <div key={index} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">মান / সংখ্যা *</label>
                    <input
                      type="text"
                      disabled={isSubAdmin}
                      value={st.value}
                      onChange={(e) => {
                        const updated = [...statsForm];
                        updated[index] = { ...updated[index], value: e.target.value };
                        setStatsForm(updated);
                      }}
                      className="w-full px-3 py-2 font-mono font-bold text-sm rounded-xl border border-stone-300 disabled:bg-stone-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">লেবেল *</label>
                    <input
                      type="text"
                      disabled={isSubAdmin}
                      value={st.label}
                      onChange={(e) => {
                        const updated = [...statsForm];
                        updated[index] = { ...updated[index], label: e.target.value };
                        setStatsForm(updated);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 disabled:bg-stone-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">ছোট বিবরণ</label>
                    <input
                      type="text"
                      disabled={isSubAdmin}
                      value={st.sub}
                      onChange={(e) => {
                        const updated = [...statsForm];
                        updated[index] = { ...updated[index], sub: e.target.value };
                        setStatsForm(updated);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 disabled:bg-stone-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ))}
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB: NOTICES & CIRCULARS (নোটিশ বোর্ড ও ফটো বিজ্ঞপ্তি)    */}
        {/* ======================================================== */}
        {activeTab === 'notices' && <AdminNoticeManager />}

        {/* ======================================================== */}
        {/* TAB 8: GENERAL SETTINGS                                  */}
        {/* ======================================================== */}
        {activeTab === 'general' && (<AdminSettings />)}
      </div>

            {isDeveloper && showDevPanel && (<DeveloperPanel onClose={() => setShowDevPanel(false)} />)}

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
                <h4 className="font-bold text-[#0f2922] text-sm sm:text-base">{previewDoc.title}</h4>
                <p className="text-xs text-stone-500">হাজী: {previewDoc.hajiName}</p>
              </div>
            </div>
            <div className="flex items-center justify-center bg-stone-900 rounded-2xl p-2 min-h-[300px] max-h-[60vh] overflow-hidden">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[58vh] max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <a
                href={previewDoc.url}
                download="document.jpg"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                <span>ডকুমেন্ট ডাউনলোড বা নতুন ট্যাবে খুলুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {showDevPanel && isDeveloper && <DeveloperPanel onClose={() => setShowDevPanel(false)} />}
    </div>
  );
};
