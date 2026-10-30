import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound
} from 'lucide-react';

interface SubAdminRegistrationFormProps {
  onBackToLogin: () => void;
  onSuccessRedirectToLogin?: () => void;
}

export const SubAdminRegistrationForm: React.FC<SubAdminRegistrationFormProps> = ({
  onBackToLogin,
  onSuccessRedirectToLogin
}) => {
  const { registerSubAdmin } = useAdmin();

  const [englishName, setEnglishName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = englishName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName) {
      setError('অনুগ্রহ করে ইংরেজিতে আপনার পূর্ণ নাম (English Name) লিখুন।');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('সঠিক ইমেইল এড্রেস (Email Address) লিখুন।');
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      registerSubAdmin({
        englishName: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        phone: phone.trim() || undefined
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 400);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
          আলহামদুলিল্লাহ
        </span>
        <h4 className="text-2xl font-bold text-[#0f2922] mb-2">
          সাব-এডমিন নিবন্ধন সফল হয়েছে!
        </h4>
        <p className="text-xs text-stone-600 max-w-md mx-auto mb-5 leading-relaxed">
          আপনার সাব-এডমিন একাউন্টটি সফলভাবে তৈরি হয়েছে। এখন আপনি আপনার ইমেইল ও পাসওয়ার্ড দিয়ে মূল লগইন ফরম থেকে সরাসরি সিস্টেমে প্রবেশ করতে পারবেন।
        </p>

        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 max-w-sm mx-auto mb-6 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-stone-200">
            <span className="text-stone-500 font-medium">রোল (Role):</span>
            <span className="font-bold text-[#0f2922] bg-[#DCB473]/20 px-2 py-0.5 rounded">
              Sub Admin (সাব-এডমিন)
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-500 font-medium">English Name:</span>
            <span className="font-semibold text-stone-800">{englishName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-stone-500 font-medium">Email:</span>
            <span className="font-mono text-stone-800">{email}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            type="button"
            onClick={onSuccessRedirectToLogin || onBackToLogin}
            className="px-6 py-2.5 text-xs font-bold text-[#0f2922] bg-[#DCB473] hover:bg-[#c99f5e] rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" />
            <span>এখনই লগইন করুন</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#0f2922] transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-stone-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>লগইনে ফিরে যান</span>
        </button>

        <span className="text-[11px] font-bold text-[#0f2922] bg-[#DCB473]/20 border border-[#DCB473]/50 px-2.5 py-0.5 rounded-full">
          Registration as "Sub Admin"
        </span>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center mx-auto mb-2 shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-[#0f2922]">
          সাব-এডমিন নিবন্ধন ফরম (Sub Admin Registration)
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          মুত্তাকী কাফেলার কন্ট্রোল ও ডাটা ব্যবস্থাপনার জন্য আপনার সাব-এডমিন তথ্য প্রদান করুন
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field 1: English Name */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
            <span>English Name (ইংরেজিতে নাম) *</span>
            <span className="text-[10px] text-stone-400 font-normal">Full Legal Name</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={englishName}
              onChange={(e) => setEnglishName(e.target.value)}
              placeholder="e.g. Md. Tariqul Islam"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-medium"
            />
          </div>
        </div>

        {/* Field 2: Email */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
            <span>Email (ইমেইল এড্রেস) *</span>
            <span className="text-[10px] text-stone-400 font-normal">Login ID</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="subadmin@muttaqi.com"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white"
            />
          </div>
        </div>

        {/* Field 3: Password */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
            <span>Password (পাসওয়ার্ড) *</span>
            <span className="text-[10px] text-stone-400 font-normal">Min 6 characters</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Optional Phone */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
            <span>মোবাইল নম্বর (Phone No.)</span>
            <span className="text-[10px] text-stone-400 font-normal">ঐচ্ছিক</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="017XXXXXXXX"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isSubmitting ? (
            <span>নিবন্ধন সম্পন্ন করা হচ্ছে...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>সাব-এডমিন হিসেবে নিবন্ধন করুন</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
