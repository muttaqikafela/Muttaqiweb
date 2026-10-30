import React from 'react';
import { PageId, ServiceItem } from '../types';
import { useAdmin } from '../context/AdminContext';
import { ServicesGrid } from '../components/ServicesGrid';
import { PackageCalculator } from '../components/PackageCalculator';
import { CheckCircle2, Phone, ShieldCheck, HeartHandshake } from 'lucide-react';

interface ServicesPageProps {
  setCurrentPage: (page: PageId) => void;
  onSelectService: (service: ServiceItem) => void;
  onOpenInquiry: (serviceId?: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  setCurrentPage,
  onSelectService,
  onOpenInquiry
}) => {
  const { companyInfo } = useAdmin();

  return (
    <div className="bg-[#FAF8F5]">
      {/* Page Title & Breadcrumb Banner */}
      <section className="bg-gradient-to-r from-[#0a221b] via-[#0f2e26] to-[#0a221b] text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#DCB473_1px,transparent_1px)] opacity-10 [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            আমাদের সেবাসমূহ
          </h1>
          <nav className="flex justify-center items-center gap-2 text-sm text-stone-300">
            <button
              onClick={() => {
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#DCB473] transition-colors cursor-pointer"
            >
              হোম
            </button>
            <span className="text-[#DCB473]">/</span>
            <span className="text-[#DCB473] font-medium">আমাদের সেবাসমূহ</span>
          </nav>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
              মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0f2922]">
              আমরা আপনার জন্য যা <span>করছি</span>
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base">
              বিশ্বস্ততা ও সুনামের সাথে প্রতিটি সেবায় আমরা সর্বোচ্চ পেশাদারিত্ব ও সততা বজায় রাখি।
            </p>
          </div>

          <ServicesGrid
            onSelectService={onSelectService}
            onInquire={onOpenInquiry}
          />
        </div>
      </section>

      {/* Mission & Gateway Section */}
      <section className="py-16 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Block 1: We are on a mission */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 rounded-3xl overflow-hidden shadow-xl border-2 border-stone-100">
              <img
                src="https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&auto=format&fit=crop&q=80"
                alt="পবিত্র আল কুরআন ও মক্কা কাফেলা"
                className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#b88e44] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#DCB473]" />
                <span>আমাদের অঙ্গীকার</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f2922]">
                আমরা একটি মিশনে আছি
              </h2>
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
                আমাদের সেবা কেন্দ্রে, আমরা নিরবিচ্ছিন্ন ও নিরাপদ যাত্রা প্রদানের জন্য আন্তরিকভাবে প্রতিশ্রুতিবদ্ধ:
              </p>
              <ul className="space-y-3.5 text-stone-700 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>মক্কা ও মদিনায় সম্মানিত যাত্রীদের জন্য অভিজ্ঞ আলেমদের উপস্থিতিতে বিশেষজ্ঞ হজ্ব ও ওমরাহ সহায়তা।</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>ঝামেলামুক্ত ভ্রমণ বুকিং, আন্তর্জাতিক ও অভ্যন্তরীণ বিমান, মানসম্মত হোটেল ও উপযুক্ত ভ্রমণ প্যাকেজ সহ।</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>সব দেশের জন্য দ্রুত ও কার্যকর ভিসা ও পাসপোর্ট প্রক্রিয়াকরণ। ভ্রমণের স্বপ্নকে বাস্তবে পরিণত করতে আমাদের সাথে যুক্ত হোন!</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Block 2: Gateway to Exceptional Services */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#b88e44] uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-[#DCB473]" />
                <span>স্বাচ্ছন্দ্যময় অভিজ্ঞতা</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f2922]">
                সেরা সেবার জন্য আপনার প্রবেশদ্বার
              </h2>
              <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
                আমাদের সেবা কেন্দ্রে স্বাগতম, যেখানে আমরা সেরা সমাধান প্রদানে পারদর্শী ও সার্বক্ষণিক তৎপর:
              </p>
              <ul className="space-y-3.5 text-stone-700 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>আধ্যাত্মিকভাবে সমৃদ্ধ অভিজ্ঞতার জন্য উপযুক্ত, সাশ্রয়ী ও আরামদায়ক হজ্ব ও ওমরাহ সেবা।</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>হোটেল নিশ্চিতকরণ সহ আন্তর্জাতিক ও দেশীয় ভ্রমণ বুকিং, যা প্রতিটি পদক্ষেপে আরামদায়ক ও নিরাপদ যাত্রা নিশ্চিত করে।</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>ঝামেলামুক্ত ভ্রমণের জন্য সহজ ভিসা প্রক্রিয়াকরণ ও নির্ভুল পাসপোর্ট সহায়তা। অসাধারণ সেবার জন্য আমাদেরকে আপনার নির্ভরযোগ্য সহযোগী হতে দিন!</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 rounded-3xl overflow-hidden shadow-xl border-2 border-stone-100 order-1 lg:order-2">
              <img
                src="https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=800&auto=format&fit=crop&q=80"
                alt="মসজিদুল হারাম ও কাবা শরিফ জিয়ারত"
                className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Package Calculator */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PackageCalculator onOpenInquiry={onOpenInquiry} />
        </div>
      </section>

      {/* Quick Consultation Banner */}
      <section className="py-14 bg-[#0f2922] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              যেকোনো সেবার ব্যাপারে সরাসরি কথা বলতে চান?
            </h3>
            <p className="text-sm text-stone-300">
              আমাদের অভিজ্ঞ কনসালট্যান্টরা আপনার প্রশ্নের উত্তর দিতে সার্বক্ষণিক প্রস্তুত।
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenInquiry()}
              className="px-6 py-3 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold rounded-xl text-sm transition-colors shadow-md cursor-pointer"
            >
              অনুসন্ধান ফরম পূরণ করুন
            </button>
            <a
              href={`tel:${companyInfo.phone1}`}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl text-sm border border-white/20 transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#DCB473]" />
              <span>{companyInfo.phone1Display}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
