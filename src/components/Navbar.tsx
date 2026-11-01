import React, { useState } from 'react';
import { PageId } from '../types';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import {
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  MessageCircle,
  Compass,
  Lock,
  UserCheck,
  LogOut,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { FacebookIcon, YoutubeIcon } from './BrandIcons';

interface NavbarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  onOpenInquiry: (serviceId?: string) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  onOpenInquiry,
  onOpenLogin
}) => {
  const { isAdminLoggedIn, logout, companyInfo, activeHajiSession, hajiLogout } = useAdmin();
  const { siteSettings, developerLogout } = useSite();
  const handleLogout = () => { developerLogout(); logout(); };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: PageId; label: string }[] = [
    { id: 'home', label: 'হোম' },
    { id: 'services', label: 'সেবাসমূহ' },
    { id: 'gallery', label: 'গ্যালারি' },
    { id: 'about', label: 'আমাদের সম্পর্কে' },
    { id: 'contact', label: 'যোগাযোগ' }
  ];

  const handleNavClick = (id: PageId) => {
    setCurrentPage(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-[#DCB473]/30" style={{ fontFamily: 'var(--font-header)' }}>
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Branding */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-3 text-left group focus:outline-none cursor-pointer min-w-0 flex-1 sm:flex-initial"
          >
            {siteSettings.logoUrl ? (
              <img src={siteSettings.logoUrl} alt="logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full bg-white shrink-0" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#DCB473] to-[#997334] p-0.5 shadow-md group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full rounded-full bg-[#0f2922] flex items-center justify-center text-[#DCB473]">
                  <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                </div>
              </div>
            )}
            <div className="min-w-0 pr-1">
              <span className="block text-sm sm:text-xl lg:text-2xl font-bold tracking-tight text-[#0f2922] truncate leading-tight">
                {siteSettings.siteNameBn}
              </span>
              <span className="block text-[9px] sm:text-[11px] font-medium text-stone-500 tracking-wider truncate">
                {siteSettings.siteNameEn.toUpperCase()}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3.5 py-2 text-[15px] font-medium rounded-md transition-all relative cursor-pointer ${
                    isActive
                      ? 'text-[#0f2922] font-semibold bg-[#DCB473]/15'
                      : 'text-stone-700 hover:text-[#0f2922] hover:bg-stone-100/80'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#DCB473] rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Admin page link if logged in */}
            {isAdminLoggedIn && (
              <button
                onClick={() => handleNavClick('admin')}
                className={`px-3.5 py-2 text-[14px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentPage === 'admin'
                    ? 'bg-[#0f2922] text-[#DCB473] shadow-md'
                    : 'bg-[#DCB473]/20 text-[#0f2922] hover:bg-[#DCB473]/30 border border-[#DCB473]/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#b88e44]" />
                <span>এডমিন প্যানেল</span>
              </button>
            )}
          </nav>

          {/* Header Action Buttons (WhatsApp, Login, Call, Mobile Menu) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* 1. WhatsApp Button (হোয়াটস অ্যাপ বাটন) */}
            <a
              href={
                companyInfo.whatsapp ||
                `https://wa.me/${(companyInfo.phone1 || '01768232501').replace(/[^0-9]/g, '')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-[#25D366] hover:bg-[#20ba59] rounded-full shadow-xs transition-all hover:shadow active:scale-95 cursor-pointer shrink-0"
              title="হোয়াটসঅ্যাপে চ্যাট করুন"
            >
              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
              <span className="hidden sm:inline">হোয়াটসঅ্যাপ</span>
            </a>

            {/* 2. Login Button (লগইন বাটন - হাজী ও এডমিন) */}
            {activeHajiSession ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onOpenLogin}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="হাজী পোর্টাল দেখুন"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="max-w-[80px] sm:max-w-[130px] truncate">
                    {activeHajiSession.nameBn || activeHajiSession.name}
                  </span>
                </button>
                <button
                  onClick={hajiLogout}
                  className="p-1.5 text-stone-500 hover:text-rose-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                  title="হাজী লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isAdminLoggedIn ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleNavClick('admin')}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-[#0f2922] bg-[#DCB473] hover:bg-[#c99f5e] rounded-full shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="এডমিন ড্যাশবোর্ড"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">এডমিন</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-stone-500 hover:text-rose-600 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                  title="এডমিন লগআউট"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#0f2922] bg-[#DCB473]/20 hover:bg-[#DCB473]/35 border border-[#DCB473]/70 rounded-full transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer shrink-0"
                title="লগইন করুন"
              >
                <Lock className="w-3.5 h-3.5 text-[#8d6928]" />
                <span>লগইন</span>
              </button>
            )}

            {/* 3. Call Button (কল করুন) */}
            <a
              href={`tel:${companyInfo.phone1}`}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#0f2922] hover:bg-[#183d34] rounded-full shadow-xs transition-all hover:shadow active:scale-95 border border-[#DCB473]/30"
              title="সরাসরি কল করুন"
            >
              <Phone className="w-3.5 h-3.5 text-[#DCB473]" />
              <span>কল করুন</span>
            </a>

            {/* 4. Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-700 hover:text-stone-900 hover:bg-stone-100 focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#0f2922]" />
              ) : (
                <Menu className="w-6 h-6 text-[#0f2922]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-[#DCB473]/20 text-[#0f2922] font-semibold'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {/* Mobile Admin Link */}
            {isAdminLoggedIn && (
              <button
                onClick={() => handleNavClick('admin')}
                className="w-full text-left px-4 py-3 rounded-lg text-base font-bold bg-[#0f2922] text-[#DCB473] flex items-center justify-between"
              >
                <span>এডমিন ড্যাশবোর্ড</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col gap-2.5">
            {activeHajiSession ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="flex-1 py-2.5 px-4 bg-emerald-100 text-emerald-950 font-bold rounded-lg text-center text-sm flex items-center justify-center gap-1.5 border border-emerald-300"
                >
                  <Compass className="w-4 h-4 text-emerald-700" />
                  <span>হাজী পোর্টাল ({activeHajiSession.nameBn || activeHajiSession.name})</span>
                </button>
                <button
                  onClick={() => {
                    hajiLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-4 bg-rose-50 text-rose-600 font-semibold rounded-lg text-center text-sm"
                >
                  লগআউট
                </button>
              </div>
            ) : isAdminLoggedIn ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleNavClick('admin')}
                  className="flex-1 py-2.5 px-4 bg-[#0f2922] text-[#DCB473] font-bold rounded-lg text-center text-sm"
                >
                  এডমিন প্যানেল
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-4 bg-rose-50 text-rose-600 font-semibold rounded-lg text-center text-sm"
                >
                  লগআউট
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-[#0f2922] font-bold rounded-lg text-center flex items-center justify-center gap-2 text-sm border border-stone-200"
              >
                <Lock className="w-4 h-4 text-[#b88e44]" />
                <span>লগইন (হাজী ও এডমিন পোর্টাল)</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInquiry();
              }}
              className="w-full py-2.5 px-4 bg-[#DCB473] text-[#0f2922] font-semibold rounded-lg text-center shadow-sm"
            >
              প্যাকেজ অনুসন্ধান করুন
            </button>

            <a
              href={
                companyInfo.whatsapp ||
                `https://wa.me/${(companyInfo.phone1 || '01768232501').replace(/[^0-9]/g, '')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-lg text-center flex items-center justify-center gap-2 text-sm shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>হোয়াটসঅ্যাপে চ্যাট করুন</span>
            </a>

            <a
              href={`tel:${companyInfo.phone1}`}
              className="w-full py-2.5 px-4 bg-[#0f2922] text-white font-medium rounded-lg text-center flex items-center justify-center gap-2 text-sm"
            >
              <Phone className="w-4 h-4 text-[#DCB473]" />
              <span>সরাসরি কল: {companyInfo.phone1Display}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
