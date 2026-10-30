import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import { PageId } from '../types';
import { ShieldCheck, Plus, LayoutDashboard, LogOut, Image, Briefcase, Users, MessageSquareQuote } from 'lucide-react';

interface AdminActionBarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
}

export const AdminActionBar: React.FC<AdminActionBarProps> = ({
  currentPage,
  setCurrentPage
}) => {
  const {
    isAdminLoggedIn,
    logout,
    openServiceModal,
    openGalleryModal,
    openTeamModal,
    openReviewModal,
    inquiries,
    reviews,
    galleryItems,
    services,
    teamMembers
  } = useAdmin();
  const { isDeveloper, developerLogout } = useSite();

  if (!isAdminLoggedIn && !isDeveloper) return null;

  const pendingCount =
    inquiries.filter((i) => i.status === 'pending').length +
    reviews.filter((r) => !r.isApproved).length +
    galleryItems.filter((g) => g.isApproved === false).length +
    services.filter((s) => s.isApproved === false).length +
    teamMembers.filter((t) => t.isApproved === false).length;

  return (
    <div className="bg-[#0b1f1a] text-white border-b-2 border-[#DCB473] py-2 px-4 shadow-md sticky top-0 z-45">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex items-center gap-1.5 font-bold text-[#DCB473]">
            <ShieldCheck className="w-4 h-4" />
            <span>{isDeveloper ? 'ডেভেলপার মুড চালু:' : 'এডমিন মুড চালু:'}</span>
          </div>
          <span className="hidden md:inline text-stone-300 text-[11px]">
            {isDeveloper ? 'সকল অপশন এডিট, অনুমোদন ও নিয়ন্ত্রণের সম্পূর্ণ সুবিধা সক্রিয়' : 'আপনি সরাসরি সাইটের যেকোনো ডাটা অনুমোদন, সম্পাদন ও মুছতে পারবেন'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Add buttons */}
          <button
            onClick={() => openServiceModal('new')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#DCB473]" />
            <span>+ সেবা</span>
          </button>

          <button
            onClick={() => openGalleryModal('new')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#DCB473]" />
            <span>+ ছবি</span>
          </button>

          <button
            onClick={() => openTeamModal('new')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#DCB473]" />
            <span>+ সদস্য</span>
          </button>

          <button
            onClick={() => openReviewModal('new')}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#DCB473]" />
            <span>+ রিভিউ</span>
          </button>

          {/* Jump to Dashboard */}
          <button
            onClick={() => {
              setCurrentPage('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              currentPage === 'admin'
                ? 'bg-[#DCB473] text-[#0f2922]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{isDeveloper ? 'কন্ট্রোল সেন্টার' : 'এডমিন কন্ট্রোল সেন্টার'}</span>
            {pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (isDeveloper) developerLogout();
              logout();
            }}
            className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="লগআউট"
          >
            <LogOut className="w-3 h-3" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>
    </div>
  );
};
