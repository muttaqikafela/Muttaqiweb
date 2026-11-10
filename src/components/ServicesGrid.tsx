import React from 'react';
import { useAdmin } from '../context/AdminContext';
import { ServiceItem } from '../types';
import {
  Compass,
  Plane,
  FileCheck,
  BookUser,
  Users,
  Globe,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  EyeOff,
  Eye,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react';

interface ServicesGridProps {
  onSelectService: (service: ServiceItem) => void;
  onInquire: (serviceId: string) => void;
}

export const ServicesGrid: React.FC<ServicesGridProps> = ({
  onSelectService,
  onInquire
}) => {
  const {
    services,
    isAdminLoggedIn,
    toggleServiceApproval,
    openServiceModal,
    deleteService,
    requestConfirm
  } = useAdmin();

  // If public visitor, only show approved services. If admin, show all
  const displayServices = isAdminLoggedIn
    ? services
    : services.filter((s) => s.isApproved !== false);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Plane':
        return <Plane className="w-6 h-6 text-[#b88e44]" />;
      case 'Compass':
        return <Compass className="w-6 h-6 text-[#b88e44]" />;
      case 'FileCheck':
        return <FileCheck className="w-6 h-6 text-[#b88e44]" />;
      case 'BookUser':
        return <BookUser className="w-6 h-6 text-[#b88e44]" />;
      case 'Users':
        return <Users className="w-6 h-6 text-[#b88e44]" />;
      case 'Globe':
        return <Globe className="w-6 h-6 text-[#b88e44]" />;
      case 'Kaaba':
      default:
        return <Sparkles className="w-6 h-6 text-[#b88e44]" />;
    }
  };

  const handleDeleteService = (svc: ServiceItem) => {
    requestConfirm({
      title: 'সেবা মুছে ফেলার নিশ্চিতকরণ',
      message: `আপনি কি নিশ্চিতভাবে "${svc.title}" সেবাটি মুছে ফেলতে চান?`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => deleteService(svc.id)
    });
  };

  return (
    <div className="space-y-6">
      {/* Admin Quick Add Bar */}
      {isAdminLoggedIn && (
        <div className="p-4 bg-[#0f2922]/5 border-2 border-dashed border-[#DCB473] rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#0f2922]">
              এডমিন সেবা নিয়ন্ত্রণ: মোট {services.length}টি সেবা তালিকাভুক্ত
            </span>
          </div>

          <button
            onClick={() => openServiceModal('new')}
            className="px-4 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন সেবা যোগ করুন</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {displayServices.map((service) => (
          <div
            key={service.id}
            className={`bg-white rounded-2xl p-6 sm:p-7 border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden ${
              service.isApproved === false
                ? 'border-amber-400 bg-amber-50/20'
                : 'border-stone-200 hover:border-[#DCB473]/70 hover:-translate-y-1'
            }`}
          >
            {/* Top highlight bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DCB473] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Admin control bar on each card */}
            {isAdminLoggedIn && (
              <div className="mb-4 p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                {service.isApproved === false ? (
                  <span className="flex items-center gap-1 text-amber-800 font-bold text-[11px]">
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>লুকানো</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-800 font-bold text-[11px]">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>লাইভ</span>
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleServiceApproval(service.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                      service.isApproved === false
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-stone-200 hover:bg-amber-100 text-stone-700'
                    }`}
                    title={service.isApproved === false ? 'অনুমোদন দিন' : 'লুকিয়ে রাখুন'}
                  >
                    {service.isApproved === false ? 'অনুমোদন দিন' : 'ড্রাফট'}
                  </button>

                  <button
                    onClick={() => openServiceModal(service)}
                    className="p-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-md transition-colors cursor-pointer"
                    title="সম্পাদন করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteService(service)}
                    className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-md transition-colors cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {service.badge && (
              <span className="absolute top-4 right-4 bg-[#DCB473]/20 text-[#0f2922] font-semibold text-xs px-2.5 py-1 rounded-full border border-[#DCB473]/30">
                {service.badge}
              </span>
            )}

            <div>
              <div className="w-14 h-14 rounded-xl bg-stone-50 border border-stone-200 group-hover:bg-[#0f2922] group-hover:border-[#0f2922] flex items-center justify-center transition-colors duration-300 mb-5">
                <div className="group-hover:text-white transition-colors">
                  {getIcon(service.iconName)}
                </div>
              </div>

              <h3 className="text-xl font-bold text-stone-900 group-hover:text-[#0f2922] transition-colors mb-2">
                {service.title}
              </h3>

              {service.subtitle && (
                <p className="text-xs font-semibold text-[#b88e44] mb-3">
                  {service.subtitle}
                </p>
              )}

              <p className="text-sm text-stone-600 leading-relaxed mb-5">
                {service.shortDesc}
              </p>

              {/* Feature bullets snippet */}
              <ul className="space-y-1.5 mb-6 text-xs text-stone-600">
                {service.features.slice(0, 3).map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                onClick={() => onSelectService(service)}
                className="text-sm font-semibold text-[#0f2922] hover:text-[#b88e44] transition-colors flex items-center gap-1 group/btn cursor-pointer"
              >
                <span>বিস্তারিত দেখুন</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onInquire(service.id)}
                className="px-3.5 py-1.5 text-xs font-medium bg-[#DCB473] hover:bg-[#cba05f] text-[#0f2922] rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                পরামর্শ নিন
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
