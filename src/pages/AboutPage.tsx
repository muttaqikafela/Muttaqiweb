import React from 'react';
import { PageId } from '../types';
import { useAdmin } from '../context/AdminContext';
import { BoardOfDirectorsSection } from '../components/BoardOfDirectorsSection';
import {
  Sparkles,
  Building,
  ShieldCheck
} from 'lucide-react';

interface AboutPageProps {
  setCurrentPage: (page: PageId) => void;
  onOpenInquiry: (serviceId?: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ setCurrentPage }) => {
  const { stats } = useAdmin();

  return (
    <div className="bg-[#FAF8F5]">
      {/* Page Title & Breadcrumb Banner */}
      <section className="bg-gradient-to-r from-[#0a221b] via-[#0f2e26] to-[#0a221b] text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#DCB473_1px,transparent_1px)] opacity-10 [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            আমাদের সম্পর্কে
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
            <span className="text-[#DCB473] font-medium">আমাদের সম্পর্কে</span>
          </nav>
        </div>
      </section>

      {/* Interactive Leadership Team Section (Zoom-In / Corner Zoom-Out) */}
      <BoardOfDirectorsSection
        id="about-board-of-directors"
        sectionClassName="py-16 sm:py-20 bg-white"
      />

      {/* About Company Story */}
      <section className="py-16 sm:py-20 bg-stone-50 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#b88e44] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#DCB473]" />
                <span>আমাদের পথচলা</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2922] leading-tight">
                <span>আল্লাহ</span> অসম্ভবকে সম্ভব করেন।
              </h2>
              <div className="text-stone-700 text-sm sm:text-base leading-relaxed space-y-4">
                <p>
                  আমাদের প্রতিষ্ঠান শুরু হয় অভিজ্ঞ ও নিষ্ঠাবান প্রতিষ্ঠাতা <strong>মোঃ রাজু মিয়া</strong>–এর নেতৃত্বে। তার দূরদর্শী দিকনির্দেশনায় আমরা দ্রুতই একটি নির্ভরযোগ্য ভ্রমণ ও ইমিগ্রেশন সেবা প্রতিষ্ঠান হিসেবে পরিচিতি লাভ করি।
                </p>
                <p>
                  বর্তমানে তার সঙ্গে যুক্ত রয়েছেন দক্ষ ব্যবস্থাপনা পরিচালকবৃন্দ— <strong>মোঃ শাহাদাৎ হোসেন খন্দকার সাগর</strong>, <strong>এ কে এম সাদিকুল আলম</strong>, <strong>মোঃ তাহিনুর রহমান</strong>, <strong>মোঃ মেহেদি হাসান</strong>, <strong>মোঃ হাবিবুর রহমান সুজন</strong>, <strong>মোঃ মাহফুজুর রহমান রোকন</strong> এবং <strong>মোঃ মেহেদি হাসান শান্ত</strong>। তাঁরা সকলেই অভিজ্ঞতা, পেশাদারিত্ব ও আন্তরিকতার সঙ্গে গ্রাহকদের সর্বোচ্চ মানের সেবা প্রদানে প্রতিশ্রুতিবদ্ধ।
                </p>
                <p>
                  আমরা বিশ্বাস করি, একটি সফল ভ্রমণের পেছনে রয়েছে নিখুঁত পরিকল্পনা ও দক্ষ ব্যবস্থাপনা। এই বিশ্বাসকে কেন্দ্র করে আমরা গড়ে তুলেছি এক ছাতার নিচে সমস্ত ভ্রমণ ও ইমিগ্রেশন সেবা — যার মধ্যে রয়েছে হজ্ব ও উমরাহ ব্যবস্থাপনা, আন্তর্জাতিক ও অভ্যন্তরীণ বিমান টিকিট বুকিং, হোটেল বুকিং নিশ্চিতকরণ, দেশি ও বিদেশি ট্যুর প্যাকেজ, বিশ্বের সকল দেশের জন্য ভিসা প্রসেসিং, পাসপোর্ট প্রক্রিয়াকরণ, জনশক্তি রপ্তানি সংক্রান্ত পরামর্শ ও সহায়তা, এবং ইমিগ্রেশন প্রক্রিয়ায় প্রয়োজনীয় দিকনির্দেশনা।
                </p>
                <p className="font-medium text-[#0f2922]">
                  আমাদের লক্ষ্য শুধুমাত্র সেবা প্রদান নয় — বরং আপনাকে একটি নির্ভরযোগ্য অভিজ্ঞতা উপহার দেওয়া, যেখানে আপনার প্রতিটি পদক্ষেপ হবে সহজ, সুরক্ষিত ও নিশ্চিন্ত।
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800">
                  <Building className="w-4 h-4 text-[#DCB473]" />
                  <span>দুপচাঁচিয়া, বগুড়া</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>শত শত সন্তুষ্ট যাত্রী</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs text-center hover:border-[#DCB473] transition-colors"
                  >
                    <span className="block text-3xl sm:text-4xl font-extrabold text-[#0f2922] font-mono mb-1">
                      {stat.value}
                    </span>
                    <span className="block text-sm font-bold text-stone-800 mb-0.5">
                      {stat.label}
                    </span>
                    <span className="block text-xs text-stone-500">
                      {stat.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
