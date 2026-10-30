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
import { AdminActionBar } from './components/AdminActionBar';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ServiceEditModal } from './components/ServiceEditModal';
import { GalleryEditModal } from './components/GalleryEditModal';
import { TeamEditModal } from './components/TeamEditModal';
import { ReviewEditModal } from './components/ReviewEditModal';
import { InquiryEditModal } from './components/InquiryEditModal';
import { HajiPortalModal } from './components/HajiPortalModal';
import { Phone, MessageCircle, CheckCircle } from 'lucide-react';

function AppContent() {
  const { companyInfo, isAdminLoggedIn, toastMessage, activeHajiSession, hajiLogout } = useAdmin();
  const { siteSettings } = useSite();
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState<boolean>(false);
  const [inquiryServiceId, setInquiryServiceId] = useState<string | undefined>(undefined);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Hash-based router listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as PageId;
      if (['home', 'services', 'about', 'gallery', 'contact', 'admin'].includes(hash)) {
        setCurrentPage(hash);
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: siteSettings.theme.background, color: siteSettings.theme.text }}>
      {/* Top Admin Action Bar for Live Site Editing */}
      <AdminActionBar currentPage={currentPage} setCurrentPage={handlePageChange} />

      {/* Navigation Header with Login & Admin Controls */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={handlePageChange}
        onOpenInquiry={handleOpenInquiry}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Main Page View */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            setCurrentPage={handlePageChange}
            onSelectService={handleSelectService}
            onOpenInquiry={handleOpenInquiry}
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

      {currentPage !== 'admin' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <AdRenderer page={currentPage} />
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
      />

      {/* Haji Portal Modal for logged-in Haji */}
      {activeHajiSession && (
        <HajiPortalModal
          haji={activeHajiSession}
          onClose={hajiLogout}
          onLogout={hajiLogout}
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

      {/* Floating Action Button for Quick Phone / WhatsApp Dialing */}
      {currentPage !== 'admin' && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2.5">
          <a
            href={companyInfo.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="w-6 h-6" />
          </a>
          <a
            href={`tel:${companyInfo.phone1}`}
            className="w-12 h-12 rounded-full bg-[#0f2922] text-[#DCB473] border border-[#DCB473]/40 flex items-center justify-center shadow-lg hover:scale-110 transition-transform hover:shadow-xl"
            aria-label="Direct Phone Call"
          >
            <Phone className="w-5 h-5" />
          </a>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <AdminProvider>
      <SiteProvider>
        <AppContent />
      </SiteProvider>
    </AdminProvider>
  );
}

export default App;
