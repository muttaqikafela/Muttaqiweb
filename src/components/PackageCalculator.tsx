import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  Calculator,
  Building2,
  Plane,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Phone,
  MessageCircle,
  HelpCircle,
  Clock,
  Compass,
  ShieldCheck,
  Utensils
} from 'lucide-react';

interface PackageCalculatorProps {
  onOpenInquiry?: (serviceId?: string) => void;
  className?: string;
}

export const PackageCalculator: React.FC<PackageCalculatorProps> = ({
  onOpenInquiry,
  className = ''
}) => {
  const { pricingConfig, companyInfo } = useAdmin();

  // 1. Pilgrimage Type
  const [pilgrimageType, setPilgrimageType] = useState<'all' | 'hajj' | 'umrah'>('umrah');

  // Filter packages based on type
  const availablePackages = useMemo(() => {
    const list = pricingConfig?.packages || [];
    if (pilgrimageType === 'all') return list;
    if (pilgrimageType === 'hajj') {
      return list.filter((p) => p.title.includes('হজ্ব') || p.title.toLowerCase().includes('hajj'));
    }
    return list.filter((p) => p.title.includes('ওমরাহ') || p.title.toLowerCase().includes('umrah'));
  }, [pricingConfig, pilgrimageType]);

  // Selected Package ID
  const [selectedPackageId, setSelectedPackageId] = useState<string>(() => {
    return availablePackages[0]?.id || 'pkg-1';
  });

  // Keep selected package in sync when changing type
  const selectedPackage = useMemo(() => {
    return (
      availablePackages.find((p) => p.id === selectedPackageId) ||
      availablePackages[0] || {
        id: 'pkg-default',
        title: 'পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)',
        price: 165000,
        durationDays: 15,
        unit: 'জনপ্রতি',
        subtitle: '৩ তারকা হোটেল, মক্কা ও মদিনা জিয়ারতসহ'
      }
    );
  }, [availablePackages, selectedPackageId]);

  // 2. Hotel & Room Category Selection
  const hotelOptions = [
    {
      id: 'hotel-eco',
      name: 'শেয়ারিং রুম (ইকোনমি ৩ তারকা হোটেল)',
      distance: 'হারাম শরীফ ৫০০-৮০০ মিটার',
      extraPrice: 0,
      description: 'মূল প্যাকেজে অন্তর্ভুক্ত স্বাভাবিক সুলভ শেয়ারিং ব্যবস্থা।'
    },
    {
      id: 'hotel-quad',
      name: '৪-বেড স্ট্যান্ডার্ড রুম (৪ তারকা হোটেল)',
      distance: 'হারাম শরীফ ২৫০-৪০০ মিটার',
      extraPrice: 5000,
      description: '৪ জন সহযাত্রী বা পরিবারের জন্য মানসম্মত ৪ শয্যাবিশিষ্ট রুম।'
    },
    {
      id: 'hotel-triple',
      name: '৩-বেড ট্রিপল ফ্যামিলি রুম (৪ তারকা)',
      distance: 'হারাম শরীফ ২০০-৩৫০ মিটার',
      extraPrice: 15000,
      description: 'পরিবার বা ছোট গ্রুপের জন্য ৩ শয্যার আরামদায়ক রুম।'
    },
    {
      id: 'hotel-double',
      name: '২-বেড ডাবল / কাপল প্রিমিয়াম রুম',
      distance: 'হারাম শরীফ ১৫০-৩০০ মিটার',
      extraPrice: 25000,
      description: 'সম্পূর্ণ প্রাইভেট ২ শয্যাবিশিষ্ট রুম (দম্পতি বা স্বামী-স্ত্রীর জন্য)।'
    },
    {
      id: 'hotel-vip',
      name: '৫ তারকা ভিআইপি হারামের সম্মুখের হোটেল',
      distance: 'হারাম শরীফের সামনে (৫০-১০০ মি.)',
      extraPrice: 65000,
      description: 'মসজিদুল হারাম ও মসজিদে নববীর অতি সন্নিকটে লাক্সারি স্যুট।'
    }
  ];

  const [selectedHotelId, setSelectedHotelId] = useState<string>('hotel-eco');
  const selectedHotel = hotelOptions.find((h) => h.id === selectedHotelId) || hotelOptions[0];

  // 3. Airplane & Flight Selection
  const planeOptions = [
    {
      id: 'plane-biman',
      name: 'বাংলাদেশ বিমান (সরাসরি ডাইরেক্ট হজ্ব ফ্লাইট)',
      route: 'ঢাকা ➔ জেদ্দা / মদিনা ➔ ঢাকা',
      extraPrice: 0,
      description: 'কনফার্মড রিটার্ন ডাইরেক্ট ফ্লাইট ও ব্যাগেজ সুবিধা।'
    },
    {
      id: 'plane-saudia',
      name: 'সাউদিয়া এয়ারলাইন্স (প্রিমিয়াম ডাইরেক্ট ফ্লাইট)',
      route: 'ঢাকা ➔ মদিনা / জেদ্দা ➔ ঢাকা',
      extraPrice: 15000,
      description: 'সৌদি অ্যারাবিয়ান এয়ারলাইন্সের সুপরিসর আরামদায়ক ফ্লাইট।'
    },
    {
      id: 'plane-transit',
      name: 'ট্রানজিট এয়ারলাইন্স (বাজেট সাশ্রয়ী ফ্লাইট)',
      route: '১ ট্রানজিট সহ আন্তর্জাতিক রুট',
      extraPrice: -10000,
      description: 'সুলভ বাজেটে খরচ সাশ্রয়ী ও আরামদায়ক সফর।'
    },
    {
      id: 'plane-business',
      name: 'ভিআইপি বিজনেস ক্লাস ফ্লাইট',
      route: 'লাক্সারি কেবিন ও এক্সক্লুসিভ লাউঞ্জ',
      extraPrice: 85000,
      description: 'সম্পূর্ণ বিজনেস ক্লাস আসন ও প্রায়োরিটি সুবিধা।'
    }
  ];

  const [selectedPlaneId, setSelectedPlaneId] = useState<string>('plane-biman');
  const selectedPlane = planeOptions.find((p) => p.id === selectedPlaneId) || planeOptions[0];

  // 4. Travelers Count (যাত্রী সংখ্যা)
  const [travelersCount, setTravelersCount] = useState<number>(1);

  // 5. Additional Services
  const [includeFood, setIncludeFood] = useState<boolean>(true);
  const [includeZiyarah, setIncludeZiyarah] = useState<boolean>(true);
  const [includeQurbani, setIncludeQurbani] = useState<boolean>(false);

  // Cost Calculations
  const basePricePerPerson = Number(selectedPackage.price) || 0;
  const hotelExtraPerPerson = selectedHotel.extraPrice || 0;
  const planeExtraPerPerson = selectedPlane.extraPrice || 0;
  const qurbaniPricePerPerson = includeQurbani ? 22000 : 0;

  const totalPerPerson = Math.max(
    0,
    basePricePerPerson + hotelExtraPerPerson + planeExtraPerPerson + qurbaniPricePerPerson
  );

  const grandTotal = totalPerPerson * travelersCount;

  // Generate WhatsApp Message
  const whatsappText = `আসসালামু আলাইকুম, আমি মুত্তাকী কাফেলার ওয়েবসাইট থেকে হজ্ব ও ওমরাহ খরচ হিসাব করেছি:
• প্যাকেজ: ${selectedPackage.title}
• হোটেল প্যাকেজ: ${selectedHotel.name} (${selectedHotel.distance})
• বিমান প্যাকেজ: ${selectedPlane.name}
• যাত্রী সংখ্যা: ${travelersCount} জন
• আনুমানিক জনপ্রতি খরচ: ৳${totalPerPerson.toLocaleString('bn-BD')}
• সর্বমোট খরচ: ৳${grandTotal.toLocaleString('bn-BD')}
দয়া করে বিস্তারিত পরামর্শ ও বুকিং প্রক্রিয়া জানাবেন।`;

  const handleApplyClick = () => {
    // If on homepage, try to scroll to registration form smoothly, or trigger inquiry
    const el = document.getElementById('haji-registration-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onOpenInquiry) {
      onOpenInquiry('haji-full-registration');
    }
  };

  return (
    <section className={`py-12 sm:py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#06231a] text-[#DCB473] text-xs font-bold uppercase tracking-wider mb-3 shadow-xs border border-[#DCB473]/30">
            <Calculator className="w-4 h-4 text-[#DCB473]" />
            <span>লাইভ প্যাকেজ, হোটেল ও বিমান খরচ ক্যালকুলেটর</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#06231a] font-serif leading-tight">
            আপনার পছন্দের <span className="text-[#b88e44]">হজ্ব ও ওমরাহ প্যাকেজ</span> ও খরচ হিসাব
          </h2>
          <p className="mt-2 text-stone-600 text-xs sm:text-sm leading-relaxed">
            প্যাকেজের ধরন, পছন্দসই হোটেল ও বিমানের টিকিট নির্বাচন করে সাথে সাথে দেখুন আপনার হজের সর্বমোট কত খরচ হবে।
          </p>
        </div>

        {/* Main Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT 7 COLUMNS: Selection Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Pilgrimage & Package Selection */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    ১
                  </div>
                  <h3 className="font-bold text-base text-[#06231a]">
                    মূল সফর ও কাফেলা প্যাকেজ নির্বাচন
                  </h3>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setPilgrimageType('umrah');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      pilgrimageType === 'umrah'
                        ? 'bg-[#06231a] text-[#DCB473] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    ওমরাহ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPilgrimageType('hajj');
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      pilgrimageType === 'hajj'
                        ? 'bg-[#06231a] text-[#DCB473] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    হজ্ব
                  </button>
                  <button
                    type="button"
                    onClick={() => setPilgrimageType('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      pilgrimageType === 'all'
                        ? 'bg-[#06231a] text-[#DCB473] shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    সকল
                  </button>
                </div>
              </div>

              {/* Package Select Options */}
              <div className="space-y-2.5">
                {availablePackages.map((pkg) => {
                  const isSelected = selectedPackage.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#06231a] bg-emerald-50/50 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[#06231a] bg-[#06231a]'
                                : 'border-stone-400'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#DCB473]" />}
                          </span>
                          <span className="font-bold text-sm sm:text-base text-stone-900">
                            {pkg.title}
                          </span>
                          {pkg.durationDays && (
                            <span className="text-[10px] font-bold bg-[#06231a] text-[#DCB473] px-2 py-0.5 rounded-full">
                              {pkg.durationDays} দিন
                            </span>
                          )}
                        </div>
                        {pkg.subtitle && (
                          <p className="text-xs text-stone-500 pl-6">{pkg.subtitle}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-extrabold text-base sm:text-lg text-[#06231a] block">
                          ৳{Number(pkg.price).toLocaleString('bn-BD')}
                        </span>
                        <span className="text-[10px] text-stone-500">মূল প্যাকেজ খরচ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Hotel & Room Category Selection */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold text-sm">
                  ২
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#06231a] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#b88e44]" />
                    <span>হোটেল ও রুম ক্যাটাগরি প্যাকেজ</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    মক্কা ও মদিনায় আপনার পছন্দসই আবাসন ও শয্যা ব্যবস্থা নির্বাচন করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hotelOptions.map((hotel) => {
                  const isSelected = selectedHotel.id === hotel.id;
                  return (
                    <div
                      key={hotel.id}
                      onClick={() => setSelectedHotelId(hotel.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#06231a] bg-amber-50/40 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs sm:text-sm text-stone-900">
                            {hotel.name}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[#06231a] bg-[#06231a]'
                                : 'border-stone-400'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#DCB473]" />}
                          </span>
                        </div>
                        <span className="inline-block text-[11px] font-bold text-[#8d6928] bg-[#DCB473]/15 px-2 py-0.5 rounded-md mb-1.5">
                          {hotel.distance}
                        </span>
                        <p className="text-[11px] text-stone-500 leading-snug">
                          {hotel.description}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-500 text-[11px]">হোটেল খরচ:</span>
                        <span className="font-mono font-bold text-stone-800">
                          {hotel.extraPrice === 0
                            ? 'প্যাকেজে অন্তর্ভুক্ত'
                            : `+ ৳${hotel.extraPrice.toLocaleString('bn-BD')}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Airplane & Flight Selection */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold text-sm">
                  ৩
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#06231a] flex items-center gap-2">
                    <Plane className="w-4 h-4 text-blue-600" />
                    <span>বিমান ও এয়ার টিকিট প্যাকেজ</span>
                  </h3>
                  <p className="text-xs text-stone-500">
                    আপনার পছন্দের এয়ারলাইন্স ও ফ্লাইট রুট নির্বাচন করুন
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {planeOptions.map((plane) => {
                  const isSelected = selectedPlane.id === plane.id;
                  return (
                    <div
                      key={plane.id}
                      onClick={() => setSelectedPlaneId(plane.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#06231a] bg-blue-50/40 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs sm:text-sm text-stone-900">
                            {plane.name}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[#06231a] bg-[#06231a]'
                                : 'border-stone-400'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#DCB473]" />}
                          </span>
                        </div>
                        <span className="inline-block text-[11px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded-md mb-1.5">
                          {plane.route}
                        </span>
                        <p className="text-[11px] text-stone-500 leading-snug">
                          {plane.description}
                        </p>
                      </div>

                      <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-500 text-[11px]">ফ্লাইট সমন্বয়:</span>
                        <span className="font-mono font-bold text-stone-800">
                          {plane.extraPrice === 0
                            ? 'প্যাকেজে অন্তর্ভুক্ত'
                            : plane.extraPrice > 0
                            ? `+ ৳${plane.extraPrice.toLocaleString('bn-BD')}`
                            : `- ৳${Math.abs(plane.extraPrice).toLocaleString('bn-BD')} (সাশ্রয়)`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Travelers Count & Inclusions */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-stone-200/90 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-stone-200">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold text-sm">
                  ৪
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#06231a] flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>যাত্রীর সংখ্যা ও অন্যান্য সুবিধা</span>
                  </h3>
                </div>
              </div>

              {/* Travelers Counter */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-stone-800 block">
                    মোট হজ্ব / ওমরাহ যাত্রী সংখ্যা:
                  </span>
                  <span className="text-[11px] text-stone-500">
                    পরিবার বা সহযাত্রীসহ মোট আসন সংখ্যা নির্বাচন করুন
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setTravelersCount(cnt)}
                      className={`w-9 h-9 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        travelersCount === cnt
                          ? 'bg-[#06231a] text-[#DCB473] shadow-md'
                          : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 pl-2">
                    <span className="text-xs text-stone-500">জন</span>
                  </div>
                </div>
              </div>

              {/* Inclusions checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer text-xs text-stone-800 hover:bg-stone-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeFood}
                    onChange={(e) => setIncludeFood(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#06231a]"
                  />
                  <div>
                    <span className="font-bold block">৩ বেলা দেশীয় পুষ্টিকর খাবার</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">প্যাকেজে অন্তর্ভুক্ত (ফ্রি)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer text-xs text-stone-800 hover:bg-stone-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeZiyarah}
                    onChange={(e) => setIncludeZiyarah(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#06231a]"
                  />
                  <div>
                    <span className="font-bold block">মক্কা ও মদিনার সকল পবিত্র জিয়ারত</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">গাইডসহ অন্তর্ভুক্ত (ফ্রি)</span>
                  </div>
                </label>

                {pilgrimageType === 'hajj' && (
                  <label className="sm:col-span-2 flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200 cursor-pointer text-xs text-stone-800 hover:bg-amber-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeQurbani}
                      onChange={(e) => setIncludeQurbani(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#06231a]"
                    />
                    <div>
                      <span className="font-bold block">শরিয়াহ সম্মত কোরবানি / দমে শোকর ব্যবস্থা</span>
                      <span className="text-[10px] text-[#8d6928] font-semibold">+ ৳২২,০০০ (ইসলামিক ব্যাংক অনুমোদিত)</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: Live Cost Breakdown & Action Card */}
          <div className="lg:col-span-5 sticky top-20 space-y-5">
            <div className="bg-gradient-to-b from-[#06231a] via-[#092d22] to-[#06231a] text-white rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-[#DCB473]/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#DCB473]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-5">
                {/* Header Tag */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-[#DCB473] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#DCB473]" />
                    <span>লাইভ হিসাব বিবরণী</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-stone-200 text-[11px] font-bold border border-white/20">
                    ১০০% স্বচ্ছ খরচ
                  </span>
                </div>

                {/* Selected Summary Overview */}
                <div className="space-y-2 text-xs text-stone-300 bg-white/5 p-3.5 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-stone-400">নির্বাচিত প্যাকেজ:</span>
                    <strong className="text-white text-right font-medium">{selectedPackage.title}</strong>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-stone-400">হোটেল সুবিধা:</span>
                    <strong className="text-[#DCB473] text-right font-medium">{selectedHotel.name}</strong>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-stone-400">বিমান ফ্লাইট:</span>
                    <strong className="text-blue-300 text-right font-medium">{selectedPlane.name}</strong>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-stone-400">মোট যাত্রী সংখ্যা:</span>
                    <strong className="text-white font-mono text-sm">{travelersCount} জন</strong>
                  </div>
                </div>

                {/* Price Calculation Numbers */}
                <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
                  <div className="flex justify-between text-stone-300">
                    <span>মূল প্যাকেজ খরচ (জনপ্রতি):</span>
                    <span className="font-mono">৳{basePricePerPerson.toLocaleString('bn-BD')}</span>
                  </div>

                  {hotelExtraPerPerson !== 0 && (
                    <div className="flex justify-between text-stone-300">
                      <span>হোটেল ক্যাটাগরি সমন্বয়:</span>
                      <span className="font-mono text-amber-300">
                        + ৳{hotelExtraPerPerson.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}

                  {planeExtraPerPerson !== 0 && (
                    <div className="flex justify-between text-stone-300">
                      <span>বিমান টিকিট সমন্বয়:</span>
                      <span className={`font-mono ${planeExtraPerPerson > 0 ? 'text-blue-300' : 'text-emerald-300'}`}>
                        {planeExtraPerPerson > 0 ? '+' : '-'} ৳{Math.abs(planeExtraPerPerson).toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}

                  {qurbaniPricePerPerson > 0 && (
                    <div className="flex justify-between text-stone-300">
                      <span>কোরবানি / দম:</span>
                      <span className="font-mono text-amber-300">
                        + ৳{qurbaniPricePerPerson.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}

                  {/* Per Person Total Banner */}
                  <div className="pt-3 border-t border-white/15 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-stone-300 font-bold block">
                        জনপ্রতি সর্বমোট খরচ:
                      </span>
                      <span className="text-[10px] text-emerald-400">ভিসা + হোটেল + বিমান + গাইডসহ</span>
                    </div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#DCB473] font-mono">
                      ৳{totalPerPerson.toLocaleString('bn-BD')}
                    </span>
                  </div>

                  {/* Grand Total if multiple travelers */}
                  {travelersCount > 1 && (
                    <div className="p-3 rounded-xl bg-white/10 border border-[#DCB473]/30 flex items-center justify-between mt-2">
                      <div>
                        <span className="text-xs text-stone-300 block">
                          সর্বমোট চুক্তি মূল্য ({travelersCount} জন):
                        </span>
                        <span className="text-[10px] text-stone-400">সকল যাত্রীর একত্র মোট খরচ</span>
                      </div>
                      <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                        ৳{grandTotal.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Action Button */}
                <div className="space-y-2.5 pt-3">
                  <button
                    type="button"
                    onClick={handleApplyClick}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-[#DCB473] to-[#c99f5e] hover:from-[#c99f5e] hover:to-[#b88e44] text-[#06231a] font-extrabold rounded-2xl text-sm transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                  >
                    <span>এই খরচে প্রাথমিক আবেদন ও কাফেলা বুকিং</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* WhatsApp consultation button */}
                  <a
                    href={
                      companyInfo.whatsapp ||
                      `https://wa.me/${(companyInfo.phone1 || '01768232501').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        whatsappText
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>হোয়াটসঅ্যাপে এই প্যাকেজ পাঠান ও পরামর্শ নিন</span>
                  </a>

                  {/* Direct Phone Call */}
                  <a
                    href={`tel:${(companyInfo.phone1 || '01768232501').replace(/[^0-9+]/g, '')}`}
                    className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors border border-white/15"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#DCB473]" />
                    <span>সরাসরি কথা বলুন: {companyInfo.phone1Display || companyInfo.phone1 || '০১৭৬৮-২৩২৫০১'}</span>
                  </a>
                </div>

                {/* Guarantees Checklist */}
                <div className="pt-3 border-t border-white/10 space-y-1.5 text-[11px] text-stone-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>কোনো লুকানো বা অপ্রকাশিত ফি নেই</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>অভিজ্ঞ আলেম ও মোয়াল্লিম দ্বারা সার্বক্ষণিক যত্ন</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>বায়োমেট্রিক ভিসা ও নিশ্চিত রিটার্ন বিমান টিকিট</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
