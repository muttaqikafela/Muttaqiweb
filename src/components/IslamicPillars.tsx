import React, { useState } from 'react';
import { ISLAMIC_PILLARS } from '../data/content';
import { IslamicPillar } from '../types';
import { Moon, Sparkles, HeartHandshake, Sun, Building2, CheckCircle2, X } from 'lucide-react';

export const IslamicPillars: React.FC = () => {
  const [selectedPillar, setSelectedPillar] = useState<IslamicPillar | null>(null);

  const getPillarIcon = (name: string) => {
    switch (name) {
      case 'Moon':
        return <Moon className="w-8 h-8 text-[#DCB473]" />;
      case 'Sparkles':
        return <Sparkles className="w-8 h-8 text-[#DCB473]" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-8 h-8 text-[#DCB473]" />;
      case 'Sun':
        return <Sun className="w-8 h-8 text-[#DCB473]" />;
      case 'Building2':
      default:
        return <Building2 className="w-8 h-8 text-[#DCB473]" />;
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-stone-50 border-y border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold text-[#b88e44] uppercase tracking-wider block mb-1">
            মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0f2922]">
            ইসলামের <span className="text-[#b88e44]">৫টি স্তম্ভ</span>
          </h2>
          <p className="mt-3 text-stone-600 text-base">
            ইসলামের মূল ভিত্তি পাঁচটি বিষয়ের ওপর প্রতিষ্ঠিত, যা একজন মুমিনের জীবনের অপরিহার্য স্তম্ভ।
          </p>
        </div>

        {/* 5 Pillars Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          {ISLAMIC_PILLARS.map((pillar) => (
            <button
              key={pillar.id}
              onClick={() => setSelectedPillar(pillar)}
              className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#DCB473] hover:-translate-y-1 transition-all duration-200 text-center flex flex-col items-center group cursor-pointer focus:outline-none"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#0f2922]/5 group-hover:bg-[#0f2922] flex items-center justify-center transition-colors duration-200 mb-4 border border-[#DCB473]/30">
                <div className="group-hover:scale-110 transition-transform">
                  {getPillarIcon(pillar.icon)}
                </div>
              </div>

              <span className="font-arabic text-lg text-[#b88e44] font-medium mb-1">
                {pillar.nameAr}
              </span>

              <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#0f2922]">
                {pillar.nameBn}
              </h3>

              <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                {pillar.meaning}
              </p>

              <span className="mt-3 text-xs text-[#b88e44] font-semibold flex items-center gap-1 group-hover:underline">
                বিস্তারিত জানুন ›
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pillar Detail Modal */}
      {selectedPillar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-[#DCB473]/40">
            <button
              onClick={() => setSelectedPillar(null)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-[#0f2922] mx-auto flex items-center justify-center mb-3 text-[#DCB473]">
                {getPillarIcon(selectedPillar.icon)}
              </div>
              <span className="font-arabic text-2xl text-[#b88e44] font-bold block mb-1">
                {selectedPillar.nameAr}
              </span>
              <h3 className="text-2xl font-bold text-[#0f2922]">
                {selectedPillar.nameBn} (ইসলামের {selectedPillar.id}ম স্তম্ভ)
              </h3>
              <p className="text-sm font-medium text-stone-600 mt-1 bg-stone-50 py-1 px-3 rounded-full inline-block">
                {selectedPillar.meaning}
              </p>
            </div>

            <div className="text-stone-700 text-sm leading-relaxed space-y-3 mb-6 bg-stone-50/70 p-4 rounded-xl border border-stone-200">
              <p>{selectedPillar.description}</p>
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>মুমিনের জীবনের সার্বিক কল্যাণ ও পরকালীন নাজাতের সোপান।</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPillar(null)}
              className="w-full py-2.5 bg-[#0f2922] hover:bg-[#1a4237] text-white font-medium rounded-xl transition-colors text-sm"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
