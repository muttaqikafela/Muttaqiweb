import React from 'react';
import { PageId } from '../types';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import {
  Phone,
  Sparkles,
  Moon,
  ShieldCheck,
  HeartHandshake,
  Award,
  UserCheck
} from 'lucide-react';

interface HeroProps {
  setCurrentPage: (page: PageId) => void;
  onOpenInquiry?: (serviceId?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ setCurrentPage }) => {
  const { companyInfo } = useAdmin();
  const { siteSettings } = useSite();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#051c15] via-[#092c21] to-[#062018] text-white py-16 sm:py-24 lg:py-28 border-b border-[#DCB473]/20">
      {/* Background Islamic Geometric and Glow Accents */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#DCB473_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#DCB473]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-[#105641]/40 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Arabic Dua Banner */}
        <div className="inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-gradient-to-r from-[#DCB473]/20 via-[#DCB473]/10 to-[#DCB473]/20 border border-[#DCB473]/50 text-[#DCB473] mb-6 shadow-lg backdrop-blur-md">
          <Moon className="w-4 h-4 text-[#DCB473]" />
          <span className="font-arabic text-lg sm:text-2xl tracking-wide font-medium">
            {companyInfo.taglineAr}
          </span>
          <Sparkles className="w-4 h-4 text-[#DCB473]" />
        </div>

        {/* Main Bengali Title with Islamic Gold Gradient */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 font-serif">
          {siteSettings.body.heroTitle}
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-emerald-100/90 leading-relaxed mb-10 font-normal">
          {siteSettings.body.heroText}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-14">
          <a
            href="#haji-registration-section"
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById('haji-registration-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-7 py-3.5 bg-gradient-to-r from-[#DCB473] via-[#e2c185] to-[#c79a52] hover:from-[#c79a52] hover:to-[#b88e44] text-[#062018] font-bold text-base rounded-full shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 cursor-pointer border border-[#DCB473]"
          >
            <UserCheck className="w-5 h-5 text-[#062018]" />
            <span>হাজী প্রাথমিক রেজিস্ট্রেশন</span>
          </a>

          <button
            onClick={() => {
              setCurrentPage('services');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-base rounded-full border border-white/25 backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            প্যাকেজ ও সেবাসমূহ
          </button>

          <a
            href={`tel:${companyInfo.phone1}`}
            className="px-7 py-3.5 bg-emerald-900/80 hover:bg-emerald-800 text-white font-medium text-base rounded-full border border-emerald-500/40 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Phone className="w-4 h-4 text-[#DCB473]" />
            <span>{companyInfo.phone1Display || companyInfo.phone1}</span>
          </a>
        </div>

        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-[#DCB473]/20 text-left">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <ShieldCheck className="w-7 h-7 text-[#DCB473] shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">সরকারি অনুমোদিত</h4>
              <p className="text-xs text-emerald-200/70">১০০% নিরাপদ ও নির্ভরযোগ্য</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <HeartHandshake className="w-7 h-7 text-[#DCB473] shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">বিজ্ঞ মোয়াল্লিম গাইড</h4>
              <p className="text-xs text-emerald-200/70">মক্কা-মদিনায় সার্বক্ষণিক সেবা</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <Award className="w-7 h-7 text-[#DCB473] shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">কাছের হোটেল</h4>
              <p className="text-xs text-emerald-200/70">হারাম শরীফের অতি নিকটে</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <Phone className="w-7 h-7 text-[#DCB473] shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-white">২৪/৭ জরুরি হেল্প</h4>
              <p className="text-xs text-emerald-200/70">যেকোনো তথ্যে সার্বক্ষণিক পাশে</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
