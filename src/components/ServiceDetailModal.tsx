import React from 'react';
import { ServiceItem } from '../types';
import { useAdmin } from '../context/AdminContext';
import { X, CheckCircle2, Phone, ArrowRight } from 'lucide-react';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onInquire: (serviceId: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onInquire
}) => {
  const { companyInfo } = useAdmin();

  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-[#DCB473]/30 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
            {service.subtitle || 'মুত্তাকী হজ্ব ও কন্সাল্টেন্সি'}
          </span>
          <h3 className="text-2xl font-bold text-[#0f2922]">
            {service.title}
          </h3>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
          {service.fullDesc}
        </p>

        <div className="mb-6">
          <h4 className="text-sm font-bold text-stone-900 mb-3">
            এই সেবার মূল সুবিধাসমূহ:
          </h4>
          <ul className="space-y-2">
            {service.features.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-stone-100">
          <button
            onClick={() => {
              onClose();
              onInquire(service.id);
            }}
            className="w-full sm:flex-1 py-2.5 px-4 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>প্যাকেজ বুকিং / পরামর্শ চান</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href={`tel:${companyInfo.phone1}`}
            className="w-full sm:w-auto py-2.5 px-4 bg-[#0f2922] hover:bg-[#1a4237] text-white font-medium rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-[#DCB473]" />
            <span>সরাসরি কল</span>
          </a>
        </div>
      </div>
    </div>
  );
};
