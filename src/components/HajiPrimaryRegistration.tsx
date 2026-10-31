import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { InquiryItem } from '../types';
import {
  Compass,
  CheckCircle2,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  LogIn
} from 'lucide-react';

interface HajiPrimaryRegistrationProps {
  onOpenLogin: () => void;
}

export const HajiPrimaryRegistration: React.FC<HajiPrimaryRegistrationProps> = ({ onOpenLogin }) => {
  const { inquiries, addInquiry, showToast } = useAdmin();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [packageType, setPackageType] = useState<'hajj' | 'umrah'>('hajj');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredData, setRegisteredData] = useState<{
    name: string;
    phone: string;
    trackingRef: string;
    packageType: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanPass = password.trim();

    if (!cleanName) {
      setError('অনুগ্রহ করে হাজীর পূর্ণ নাম লিখুন।');
      return;
    }

    // Phone validation (Bangladeshi 11-digit check)
    const phoneDigits = cleanPhone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 11) {
      setError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    // Check duplicate
    const existing = inquiries.find((inq) => {
      const inqDigits = (inq.phone || '').replace(/[^0-9]/g, '');
      return inqDigits && phoneDigits && (inqDigits === phoneDigits || inq.phone === cleanPhone);
    });

    if (existing) {
      if (existing.status === 'approved') {
        setError(
          'এই মোবাইল নম্বরে ইতিমধ্যে একটি অনুমোদিত হাজী একাউন্ট রয়েছে! আপনি সরাসরি উপরের "লগইন" বাটনে ক্লিক করে লগইন করতে পারেন।'
        );
      } else {
        setError(
          'এই মোবাইল নম্বরে ইতিমধ্যে একটি প্রাথমিক রেজিস্ট্রেশন জমা রয়েছে যা অ্যাডমিন অনুমোদনের অপেক্ষায় আছে। অ্যাডমিন অনুমোদন করার পর আপনি সরাসরি লগইন করতে পারবেন।'
        );
      }
      return;
    }

    setIsSubmitting(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingRef = `HAJI-2026-${randomSuffix}`;

    const newHaji: InquiryItem = {
      id: `haji-reg-${Date.now()}`,
      name: cleanName,
      nameBn: cleanName,
      phone: cleanPhone,
      email: `${phoneDigits}@muttaqi.haji`,
      serviceId: 'haji-full-registration',
      serviceName: packageType === 'umrah' ? 'পবিত্র ওমরাহ্ প্রাথমিক নিবন্ধন' : 'পবিত্র হজ্ব ২০২৬ প্রাথমিক নিবন্ধন',
      travelers: '1',
      registrationType: 'haji',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      hajiUserId: cleanPhone,
      hajiPassword: cleanPass,
      registrationRef: trackingRef,
      adminNotes: `হোমপেজ থেকে প্রাথমিক অনলাইন আবেদন। লগইন পাসওয়ার্ড: ${cleanPass}`,
      message: `হোমপেজ থেকে প্রাথমিক নিবন্ধন সম্পন্ন। সেবা: ${packageType === 'umrah' ? 'ওমরাহ্' : 'হজ্ব'}`
    };

    setTimeout(() => {
      addInquiry(newHaji);
      setIsSubmitting(false);
      setRegisteredData({
        name: cleanName,
        phone: cleanPhone,
        trackingRef,
        packageType: packageType === 'umrah' ? 'পবিত্র ওমরাহ্ কাফেলা' : 'পবিত্র হজ্ব ২০২৬ কাফেলা'
      });
      showToast('আলহামদুলিল্লাহ! আপনার প্রাথমিক হাজী রেজিস্ট্রেশন সফলভাবে গ্রহণ করা হয়েছে।');
    }, 400);
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setPassword('');
    setError(null);
    setRegisteredData(null);
  };

  return (
    <section id="haji-registration-section" className="py-12 sm:py-16 bg-gradient-to-b from-[#f8f5ee] via-white to-[#FAF8F5] border-y border-[#DCB473]/30 scroll-mt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0f2922] text-[#DCB473] text-xs font-bold tracking-wide uppercase shadow-xs mb-3 border border-[#DCB473]/40">
            <Compass className="w-4 h-4 text-[#DCB473] animate-spin" style={{ animationDuration: '10s' }} />
            <span>অনলাইন প্রাথমিক নিবন্ধন</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f2922] font-serif tracking-tight">
            হাজী প্রাথমিক রেজিস্ট্রেশন
          </h2>

          <p className="mt-2 text-stone-600 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            নাম, মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে ঘরে বসেই আপনার প্রাথমিক আবেদন জমা দিন। অ্যাডমিন প্যানেল থেকে তথ্য যাচাই ও <strong className="text-emerald-800">অনুমোদন (Approve)</strong> করার পর আপনি এই মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে ওয়েবসাইটে লগইন করতে পারবেন।
          </p>
        </div>

        {/* Form Container / Success Confirmation Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-xl border-2 border-[#DCB473]/40 relative overflow-hidden">
          {/* Decorative Corner Islamic Background Element */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-[#DCB473]/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          {registeredData ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="text-center py-4 sm:py-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-md">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  রেজিস্ট্রেশন সফল হয়েছে
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f2922] font-serif mt-2">
                  আলহামদুলিল্লাহ! আপনার আবেদন জমা হয়েছে
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
                  সম্মানিত হাজী <strong className="text-stone-900">{registeredData.name}</strong>, আপনার প্রাথমিক তথ্য সফলভাবে গ্রহণ করা হয়েছে।
                </p>
              </div>

              {/* Pilgrim Details Box */}
              <div className="bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-stone-200 text-left max-w-lg mx-auto space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">ট্র্যাকিং রেফারেন্স (Tracking ID):</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                    {registeredData.trackingRef}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">মোবাইল নম্বর (লগইন আইডি):</span>
                  <span className="font-mono font-bold text-stone-800">{registeredData.phone}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">কাফেলা সেবা:</span>
                  <span className="font-semibold text-stone-800">{registeredData.packageType}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">বর্তমান স্ট্যাটাস:</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 text-xs">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    এডমিন অনুমোদনের অপেক্ষায়
                  </span>
                </div>
              </div>

              {/* Instructions Banner */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-2xl text-xs text-amber-950 text-left max-w-lg mx-auto leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">লগইন করার নিয়ম:</strong>
                  মুত্তাকী হজ্ব কাফেলার অ্যাডমিন প্যানেল থেকে আপনার আবেদনটি যাচাই ও <strong>অনুমোদন (Approve)</strong> করার পর আপনি উপরে ডানপাশে থাকা <strong>"লগইন"</strong> বাটনে চাপ দিয়ে আপনার মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে সরাসরি লগইন করতে পারবেন।
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="px-6 py-2.5 bg-[#0f2922] hover:bg-[#183d34] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95 border border-[#DCB473]/40"
                >
                  <LogIn className="w-4 h-4 text-[#DCB473]" />
                  <span>লগইন উইন্ডো খুলুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  নতুন আরেকটি রেজিস্ট্রেশন
                </button>
              </div>
            </div>
          ) : (
            /* PRIMARY REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{error}</span>
                </div>
              )}

              {/* Package Selection Segment */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  নিবন্ধনের ধরণ নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPackageType('hajj')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      packageType === 'hajj'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Compass className={`w-4 h-4 ${packageType === 'hajj' ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm leading-tight">পবিত্র হজ্ব ২০২৬</div>
                      <span className="text-[10px] text-stone-500 font-normal">হজ্ব কাফেলা বুকিং</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPackageType('umrah')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      packageType === 'umrah'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 ${packageType === 'umrah' ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm leading-tight">পবিত্র ওমরাহ্</div>
                      <span className="text-[10px] text-stone-500 font-normal">চলতি কাফেলা বুকিং</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3 Main Fields (নাম, মোবাইল নং ও পাসওয়ার্ড) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>১. হাজীর পূর্ণ নাম (Full Name) *</span>
                    <span className="text-[10px] text-stone-400 font-normal">জাতীয় পরিচয়পত্র বা পাসপোর্ট অনুযায়ী</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="যেমন: মো: আব্দুল্লাহ বা Alhaj Md. Abdullah"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                    />
                  </div>
                </div>

                {/* 2. Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>২. মোবাইল নম্বর (Mobile No.) *</span>
                    <span className="text-[10px] text-stone-400 font-normal">এটিই হবে আপনার ইউজার আইডি</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="017xxxxxxxx বা ০১৭৮৮..."
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* 3. Password */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>৩. লগইন পাসওয়ার্ড (Password) *</span>
                    <span className="text-[10px] text-stone-400 font-normal">লগইনের জন্য মনে রাখুন</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="কমপক্ষে ৪-৬ অক্ষর"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                      title={showPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Information Note */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-[11px] text-emerald-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  নিবন্ধন সফল হলে আবেদনটি অ্যাডমিন প্যানেলে জমা হবে। অ্যাডমিন <strong>যাচাই ও অনুমোদন (Approve)</strong> করার সাথে সাথে আপনি আপনার দেওয়া মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে ওয়েবসাইটে লগইন করতে পারবেন।
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-[#0f2922] via-[#14372e] to-[#0f2922] hover:from-[#183d34] hover:to-[#183d34] text-[#DCB473] font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 border border-[#DCB473]/50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#DCB473] border-t-transparent rounded-full animate-spin" />
                      <span>আবেদন জমা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-[#DCB473]" />
                      <span>প্রাথমিক রেজিস্ট্রেশন সম্পন্ন করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
