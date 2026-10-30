import React, { useState } from 'react';
import { Calculator, Check, Sparkles, Send } from 'lucide-react';

interface PackageCalculatorProps {
  onOpenInquiry: (serviceId?: string) => void;
}

export const PackageCalculator: React.FC<PackageCalculatorProps> = ({ onOpenInquiry }) => {
  const [pilgrimageType, setPilgrimageType] = useState<'umrah' | 'hajj'>('umrah');
  const [duration, setDuration] = useState<number>(15);
  const [hotelCategory, setHotelCategory] = useState<'standard' | 'deluxe' | 'luxury'>('deluxe');
  const [travelers, setTravelers] = useState<number>(2);
  const [includeFood, setIncludeFood] = useState<boolean>(true);
  const [includeZiyarah, setIncludeZiyarah] = useState<boolean>(true);

  return (
    <div className="bg-gradient-to-br from-[#0e2922] to-[#12362c] text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#DCB473]/30 my-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCB473]/20 text-[#DCB473] text-xs font-semibold mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>প্যাকেজ ক্যালকুলেটর</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white">
            আপনার পছন্দের <span className="text-[#DCB473]">হজ্ব ও ওমরাহ</span> প্যাকেজ পরিকল্পনা
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 mt-2">
            পছন্দমত দিন, হোটেল ক্যাটাগরি ও যাত্রীর সংখ্যা নির্বাচন করে তাত্ক্ষণিক আনুমানিক ধারণা নিন
          </p>
        </div>

        <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
          {/* Pilgrimage Type */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              যাত্রার ধরণ নির্বাচন করুন:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPilgrimageType('umrah')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  pilgrimageType === 'umrah'
                    ? 'bg-[#DCB473] text-[#0f2922] shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                পবিত্র ওমরাহ প্যাকেজ
              </button>
              <button
                type="button"
                onClick={() => setPilgrimageType('hajj')}
                className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  pilgrimageType === 'hajj'
                    ? 'bg-[#DCB473] text-[#0f2922] shadow-md'
                    : 'bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                পবিত্র ফরজ হজ্ব প্যাকেজ
              </button>
            </div>
          </div>

          {/* Duration & Travelers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                ভ্রমণের সময়কাল:
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#0f2922] text-white border border-white/20 rounded-xl text-sm focus:outline-none focus:border-[#DCB473]"
              >
                {pilgrimageType === 'umrah' ? (
                  <>
                    <option value={10}>১০ দিন (সংক্ষিপ্ত ওমরাহ)</option>
                    <option value={15}>১৫ দিন (জনপ্রিয় ওমরাহ)</option>
                    <option value={21}>২১ দিন (প্রসারিত ওমরাহ)</option>
                    <option value={30}>৩০ দিন (পুরো মাস)</option>
                  </>
                ) : (
                  <>
                    <option value={35}>৩৫ দিন (স্ট্যান্ডার্ড হজ্ব)</option>
                    <option value={40}>৪০ দিন (সম্পূর্ণ হজ্ব)</option>
                    <option value={45}>৪৫ দিন (প্রিমিয়াম হজ্ব)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-2">
                মোট যাত্রীর সংখ্যা:
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={travelers}
                onChange={(e) => setTravelers(Math.max(1, Number(e.target.value)))}
                className="w-full px-3.5 py-2 bg-[#0f2922] text-white border border-white/20 rounded-xl text-sm focus:outline-none focus:border-[#DCB473]"
              />
            </div>
          </div>

          {/* Hotel Category */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              হোটেলের দূরত্ব ও মান:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'standard', name: 'ইকোনমি (৩ তারকা)', distance: '৫০০-৮০০ মিটার' },
                { id: 'deluxe', name: 'ডিলাক্স (৪ তারকা)', distance: '২০০-৪০০ মিটার' },
                { id: 'luxury', name: 'ভিআইপি (৫ তারকা)', distance: 'হারাম শরীফের সামনে' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setHotelCategory(cat.id as any)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    hotelCategory === cat.id
                      ? 'border-[#DCB473] bg-[#DCB473]/15 text-white'
                      : 'border-white/10 bg-white/5 text-stone-300 hover:bg-white/10'
                  }`}
                >
                  <span className="block text-xs font-bold">{cat.name}</span>
                  <span className="block text-[10px] text-[#DCB473] mt-0.5">{cat.distance}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Inclusions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFood}
                onChange={(e) => setIncludeFood(e.target.checked)}
                className="rounded accent-[#DCB473]"
              />
              <span>৩ বেলা দেশীয় সুস্বাদু খাবার</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-stone-200 cursor-pointer">
              <input
                type="checkbox"
                checked={includeZiyarah}
                onChange={(e) => setIncludeZiyarah(e.target.checked)}
                className="rounded accent-[#DCB473]"
              />
              <span>মক্কা ও মদিনার সম্পূর্ণ জিয়ারত</span>
            </label>
          </div>

          {/* Calculated Summary Box */}
          <div className="bg-white/10 rounded-xl p-4 border border-[#DCB473]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[#DCB473] text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>প্যাকেজ সুবিধাদি অন্তর্ভুক্ত:</span>
              </div>
              <p className="text-xs text-stone-200">
                ভিসা + রিটার্ন এয়ার টিকিট + {duration} দিনের আবাসন + যাতায়াত + মোয়াল্লিম গাইড
              </p>
            </div>

            <button
              onClick={() => onOpenInquiry(pilgrimageType === 'hajj' ? 'hajj-umrah' : 'hajj-umrah')}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>এই প্যাকেজের কোটেশন নিন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
