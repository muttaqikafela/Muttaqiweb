import React, { useState, useEffect } from 'react';
import { PageId, ServiceItem } from './types';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { SiteProvider, useSite } from './context/SiteContext';
import { AdRenderer } from './components/AdRenderer';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { AboutPage } from './pages/AboutPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ServiceInquiryModal } from './components/ServiceInquiryModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ServiceEditModal } from './components/ServiceEditModal';
import { GalleryEditModal } from './components/GalleryEditModal';
import { TeamEditModal } from './components/TeamEditModal';
import { ReviewEditModal } from './components/ReviewEditModal';
import { InquiryEditModal } from './components/InquiryEditModal';
import { HajiPortalModal } from './components/HajiPortalModal';
import { ScrollNavigationButtons } from './components/ScrollNavigationButtons';
import { CheckCircle, AlertTriangle, RotateCcw, Home, User, Receipt } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Muttaqi App Runtime Error:', error, info);
  }

  handleResetLocalCacheAndReload = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('muttaqi_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {}
    try {
      window.sessionStorage.clear();
    } catch {}
    try {
      window.location.hash = 'home';
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-[#DCB473]/60 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-[#0f2922]">পেইজ লোড করতে সমস্যা হয়েছে</h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                ব্রাউজারের পুরোনো ক্যাশ অথবা সাময়িক ত্রুটির কারণে পেইজটি প্রদর্শিত হতে পারেনি। নিচের বাটনে ক্লিক করে পুনরায় লোড করুন।
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-mono text-rose-800 break-words text-left">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-[#0f2922] hover:bg-[#173d33] text-[#DCB473] font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>পুনরায় রিফ্রেশ করুন</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetLocalCacheAndReload}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>লোকাল ক্যাশ রিসেট করে হোমে ফিরুন</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { isAdminLoggedIn, toastMessage, activeHajiSession, hajiLogout, hajiFinanceRecords } = useAdmin();
  const { siteSettings } = useSite();
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState<boolean>(false);
  const [inquiryServiceId, setInquiryServiceId] = useState<string | undefined>(undefined);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);
  const [hajiProfileOpen, setHajiProfileOpen] = useState<boolean>(false);

  // Hash-based router listener
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = (window.location.hash || '').replace(/^#/, '').split('?')[0].trim().toLowerCase();
      if (['home', 'services', 'about', 'gallery', 'contact', 'admin'].includes(rawHash)) {
        setCurrentPage(rawHash as PageId);
      } else if (!rawHash) {
        setCurrentPage('home');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handlePageChange = (page: PageId) => {
    setCurrentPage(page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenInquiry = (serviceId?: string) => {
    setInquiryServiceId(serviceId);
    setInquiryModalOpen(true);
  };

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service);
  };

  const handleLoginSuccess = () => {
    handlePageChange('admin');
  };

  const handleHajiLoginSuccess = () => {
    setHajiProfileOpen(false);
    handlePageChange('home');
  };

  const activeHajiFinance = activeHajiSession
    ? hajiFinanceRecords.find(
        (f) =>
          (activeHajiSession.id && f.inquiryId === activeHajiSession.id) ||
          (activeHajiSession.registrationRef && f.registrationRef === activeHajiSession.registrationRef) ||
          (activeHajiSession.hajiUserId && f.hajiUserId === activeHajiSession.hajiUserId)
      )
    : undefined;
  const activeHajiPendingCount = activeHajiFinance
    ? (activeHajiFinance.payments || []).filter((p) => p.status === 'pending').length
    : 0;

  const themeBg = siteSettings?.theme?.background || '#FAF8F5';
  const themeText = siteSettings?.theme?.text || '#1c1917';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: themeBg, color: themeText, fontFamily: 'var(--font-body)' }}>
      {/* Navigation Header with Login & Admin Controls */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        onOpenInquiry={handleOpenInquiry}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenHajiProfile={() => setHajiProfileOpen(true)}
      />

      {/* Slim Logged-in Haji Profile Bar on Homepage & Public Pages */}
      {activeHajiSession && currentPage !== 'admin' && (
        <div className="bg-[#0f2922] text-white border-b border-[#DCB473]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {activeHajiSession.photoUrl ? (
                <img
                  src={activeHajiSession.photoUrl}
                  alt={activeHajiSession.nameBn || activeHajiSession.name}
                  className="w-8 h-8 rounded-full object-cover border border-[#DCB473] shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#DCB473]/20 text-[#DCB473] border border-[#DCB473]/50 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white truncate">
                  আসসালামু আলাইকুম, <span className="text-[#DCB473]">{activeHajiSession.nameBn || activeHajiSession.name}</span>
                </p>
                <p className="text-[10px] sm:text-xs text-stone-300 truncate">
                  আইডি: {activeHajiSession.hajiUserId || activeHajiSession.registrationRef || activeHajiSession.phone}
                  {activeHajiPendingCount > 0 && (
                    <span className="ml-2 text-amber-300 font-semibold">
                      • {activeHajiPendingCount}টি পেমেন্ট অনুমোদনের অপেক্ষায়
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHajiProfileOpen(true)}
              className="px-3.5 py-1.5 bg-[#DCB473] hover:bg-[#e5c285] text-[#0f2922] font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>প্রোফাইল হিস্টোরি ও টাকা জমা</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Sponsored Ad (if configured for top) */}
      {currentPage !== 'admin' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 w-full">
          <AdRenderer page={currentPage} position="top" />
        </div>
      )}

      {/* Main Page View */}
      <main className="flex-1" style={{ fontFamily: 'var(--font-body)' }}>
        {currentPage === 'home' && (
          <HomePage
            setCurrentPage={handlePageChange}
            onSelectService={handleSelectService}
            onOpenInquiry={handleOpenInquiry}
            onOpenLogin={() => setLoginModalOpen(true)}
          />
        )}
        {currentPage === 'services' && (
          <ServicesPage
            setCurrentPage={handlePageChange}
            onSelectService={handleSelectService}
            onOpenInquiry={handleOpenInquiry}
          />
        )}
        {currentPage === 'about' && (
          <AboutPage
            setCurrentPage={handlePageChange}
            onOpenInquiry={handleOpenInquiry}
          />
        )}
        {currentPage === 'gallery' && (
          <GalleryPage
            setCurrentPage={handlePageChange}
          />
        )}
        {currentPage === 'contact' && (
          <ContactPage
            setCurrentPage={handlePageChange}
          />
        )}
        {currentPage === 'admin' && (
          <AdminDashboard
            setCurrentPage={handlePageChange}
          />
        )}
      </main>

      {/* Bottom Sponsored Ad (if configured for bottom or all) */}
      {currentPage !== 'admin' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
          <AdRenderer page={currentPage} position="bottom" />
        </div>
      )}

      {/* Footer */}
      <Footer
        setCurrentPage={handlePageChange}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Service Detail Modal */}
      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onInquire={handleOpenInquiry}
      />

      {/* Inquiry Form Modal */}
      <ServiceInquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        defaultServiceId={inquiryServiceId}
      />

      {/* Admin & Haji Login Modal */}
      <AdminLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        onHajiSuccess={handleHajiLoginSuccess}
      />

      {/* Haji Portal Modal (Opens when logged-in Haji clicks their Profile) */}
      {activeHajiSession && hajiProfileOpen && (
        <HajiPortalModal
          haji={activeHajiSession}
          onClose={() => setHajiProfileOpen(false)}
          onLogout={() => {
            setHajiProfileOpen(false);
            hajiLogout();
          }}
        />
      )}

      {/* Global Admin Modals (Usable from any page or dashboard) */}
      <ServiceEditModal />
      <GalleryEditModal />
      <TeamEditModal />
      <ReviewEditModal />
      <InquiryEditModal />
      <ConfirmDeleteModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-[90] bg-[#0f2922] text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-[#DCB473] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Global Transparent Float-up Scroll Navigation Buttons */}
      <ScrollNavigationButtons />
    </div>
  );
}

export function App() {
  return (
    <AppErrorBoundary>
      <AdminProvider>
        <SiteProvider>
          <AppErrorBoundary>
            <AppContent />
          </AppErrorBoundary>
        </SiteProvider>
      </AdminProvider>
    </AppErrorBoundary>
  );
}

export default App;
