import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import { DEVELOPER_EMAIL } from '../lib/developerAuth';
import {
  X,
  Lock,
  Mail,
  ShieldAlert,
  KeyRound,
  Compass,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Clock
} from 'lucide-react';
import { HajiRegistrationForm } from './HajiRegistrationForm';
import { SubAdminRegistrationForm } from './SubAdminRegistrationForm';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'login' | 'haji' | 'sub_admin';
  initialTab?: 'haji' | 'admin';
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialTab = 'haji'
}) => {
  const { login, hajiLogin, logout, subAdminResetPassword, setIsAdminLoggedIn } = useAdmin();
  const { developerLogin, developerSetup, developerLogout } = useSite();
  const [devSetupMode, setDevSetupMode] = useState(false);
  const [devSetupPass, setDevSetupPass] = useState('');
  const [devSetupConfirm, setDevSetupConfirm] = useState('');
  const [viewMode, setViewMode] = useState<'login' | 'haji' | 'sub_admin'>(initialMode);
  const [loginTab, setLoginTab] = useState<'haji' | 'admin'>(initialTab);

  // Sub-Admin Forgot Password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // Admin login states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Haji login states (User ID and Password)
  const [hajiUserId, setHajiUserId] = useState('');
  const [hajiPassword, setHajiPassword] = useState('');
  const [showHajiPass, setShowHajiPass] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Purge all input state whenever modal is opened or closed or tab/mode changes
    setHajiUserId('');
    setHajiPassword('');
    setShowHajiPass(false);
    setAdminEmail('');
    setAdminPassword('');
    setShowAdminPass(false);
    setForgotEmail('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setDevSetupPass('');
    setDevSetupConfirm('');
    if (isOpen) {
      setViewMode(initialMode);
      setLoginTab(initialTab);
      setError(null);
      setIsPendingApproval(false);
      setIsForgotPassword(false);
      setForgotSuccess(null);
    }
  }, [isOpen, initialMode, initialTab]);

  // Global logout listener: When any user logs out, purge all credentials immediately
  useEffect(() => {
    const purgeAllCredentials = () => {
      setHajiUserId('');
      setHajiPassword('');
      setShowHajiPass(false);
      setAdminEmail('');
      setAdminPassword('');
      setShowAdminPass(false);
      setForgotEmail('');
      setForgotNewPass('');
      setForgotConfirmPass('');
      setError(null);
    };

    window.addEventListener('muttaqi_admin_logout', purgeAllCredentials);
    window.addEventListener('muttaqi_haji_logout', purgeAllCredentials);
    return () => {
      window.removeEventListener('muttaqi_admin_logout', purgeAllCredentials);
      window.removeEventListener('muttaqi_haji_logout', purgeAllCredentials);
    };
  }, []);

  if (!isOpen) return null;

  // Handle Haji Login (User ID + Password)
  const handleHajiLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hajiUserId.trim().toLowerCase() === DEVELOPER_EMAIL) {
      setLoginTab('admin');
      setAdminEmail(hajiUserId.trim());
      setError('ডেভেলপার লগইনের জন্য এডমিন ট্যাব ব্যবহার করুন।');
      return;
    }
    setError(null);
    setIsPendingApproval(false);
    setIsSubmitting(true);

    const targetUser = hajiUserId.trim();
    const targetPass = hajiPassword.trim();

    // Clear state inputs immediately so they never linger
    setHajiUserId('');
    setHajiPassword('');

    try {
      const res = await hajiLogin(targetUser, targetPass);
      setIsSubmitting(false);
      if (res && res.success && res.haji) {
        onClose();
      } else {
        setIsPendingApproval(!!res?.isPendingApproval);
        setError(
          res?.error ||
          'ভুল হাজী ইউজার আইডি অথবা পাসওয়ার্ড। সঠিক ইউজার আইডি ও পাসওয়ার্ড দিন।'
        );
      }
    } catch {
      setIsSubmitting(false);
      setError('লগইন প্রক্রিয়ায় ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }
  };

  // Handle Admin / Sub-Admin / Developer Login (same panel)
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetEmail = adminEmail.trim();
    const targetPass = adminPassword.trim();

    // Clear state inputs immediately
    setAdminEmail('');
    setAdminPassword('');

    if (targetEmail.toLowerCase() === DEVELOPER_EMAIL) {
      setIsSubmitting(true);
      const res = await developerLogin(targetEmail, targetPass);
      setIsSubmitting(false);
      if (res.needsSetup) {
        setDevSetupMode(true);
        setError('প্রথম ডেভেলপার লগইন: নিচে নতুন পাসওয়ার্ড সেট করুন। শুধুমাত্র হ্যাশ সংরক্ষিত হবে।');
        return;
      }
      if (res.ok) {
        setIsAdminLoggedIn(true);
        try {
          localStorage.setItem('muttaqi_admin_auth', 'true');
        } catch {
          // ignore
        }
        onSuccess();
        onClose();
      } else {
        setError('ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।');
      }
      return;
    }

    // Normal Admin / Sub-Admin Login:
    developerLogout();

    setIsSubmitting(true);
    try {
      const success = await login(targetEmail, targetPass);
      setIsSubmitting(false);
      if (success) {
        onSuccess();
        onClose();
      } else {
        setError('ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।');
      }
    } catch {
      setIsSubmitting(false);
      setError('লগইন প্রক্রিয়ায় ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }
  };

  const handleDeveloperSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (devSetupPass.length < 4 || devSetupPass !== devSetupConfirm) {
      setError('পাসওয়ার্ড মিলছে না বা খুব ছোট (কমপক্ষে ৪ অক্ষর)।');
      return;
    }
    await developerSetup(devSetupPass);
    setIsAdminLoggedIn(true);
    try {
      localStorage.setItem('muttaqi_admin_auth', 'true');
    } catch {
      // ignore
    }
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-3xl ${
          viewMode === 'login'
            ? 'max-w-md'
            : viewMode === 'haji'
            ? 'max-w-3xl'
            : 'max-w-xl'
        } w-full p-5 sm:p-7 shadow-2xl relative border border-[#DCB473]/30 max-h-[92vh] overflow-y-auto transition-all`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors z-10 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* View Mode 1: LOGIN PORTAL (Tabs: Haji Login & Admin Login) */}
        {viewMode === 'login' && (
          <div>
            {/* Header Login Tabs Switcher */}
            <div className="flex items-center justify-center mb-5">
              <div className="inline-flex p-1 bg-stone-100 rounded-2xl border border-stone-200 shadow-inner w-full">
                {/* Tab 1: Haji Login */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginTab('haji');
                    setError(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginTab === 'haji'
                      ? 'bg-[#0f2922] text-[#DCB473] shadow-md'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>হাজী লগইন (Haji Login)</span>
                </button>

                {/* Tab 2: Admin Login */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginTab('admin');
                    setError(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    loginTab === 'admin'
                      ? 'bg-[#0f2922] text-[#DCB473] shadow-md'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>এডমিন লগইন (Admin)</span>
                </button>
              </div>
            </div>

            {/* ERROR / PENDING APPROVAL ALERT */}
            {error && (
              <div className={`mb-4 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
                isPendingApproval
                  ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {isPendingApproval ? (
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">
                  <p className="font-bold text-xs">
                    {isPendingApproval ? 'আবেদন অনুমোদনের অপেক্ষায় আছে (Pending Approval)' : 'লগইন ত্রুটি'}
                  </p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 1: HAJI LOGIN (User ID & Password) */}
            {loginTab === 'haji' && (
              <div className="animate-in fade-in duration-150">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Compass className="w-6 h-6 text-emerald-700" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0f2922]">
                    হাজী লগইন (Haji Login)
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    আপনার ইউজার আইডি ও পাসওয়ার্ড দিয়ে প্রোফাইলে প্রবেশ করুন
                  </p>
                </div>

                <form onSubmit={handleHajiLoginSubmit} autoComplete="off" className="space-y-3.5">
                  {/* Field 1: User ID or Mobile (Never save or autofill) */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                      <span>মোবাইল নম্বর বা ইউজার আইডি (Mobile / User ID) *</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        রেজিস্ট্রেশনের মোবাইল নম্বর
                      </span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        name="haji_login_uid_nosave"
                        id="haji_login_uid_nosave"
                        autoComplete="off"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        value={hajiUserId}
                        onChange={(e) => setHajiUserId(e.target.value)}
                        placeholder="আপনার ১১ ডিজিটের মোবাইল নম্বর (যেমন: 017xxxxxxxx)"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password (Never save or remember) */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                      <span>পাসওয়ার্ড (Password) *</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        গোপন পাসওয়ার্ড
                      </span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                      <input
                        type={showHajiPass ? 'text' : 'password'}
                        required
                        name="haji_login_pwd_nosave"
                        id="haji_login_pwd_nosave"
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-1p-ignore="true"
                        data-bwignore="true"
                        value={hajiPassword}
                        onChange={(e) => setHajiPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowHajiPass(!showHajiPass)}
                        className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showHajiPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 sm:py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {isSubmitting ? (
                      <span>যাচাই করা হচ্ছে...</span>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-[#DCB473]" />
                        <span>হাজী পোর্টালে লগইন করুন</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT 2: ADMIN & SUB-ADMIN LOGIN */}
            {loginTab === 'admin' && (
              <div className="animate-in fade-in duration-150">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0f2922]">
                    এডমিন ও সাব-এডমিন লগইন
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    কন্ট্রোল প্যানেলে প্রবেশের জন্য আপনার ইমেইল ও পাসওয়ার্ড লিখুন
                  </p>
                </div>

                {isForgotPassword ? (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 animate-in fade-in duration-150 text-left">
                    <div className="flex items-center gap-2 mb-2 text-[#0f2922] font-bold text-sm">
                      <KeyRound className="w-4 h-4 text-[#DCB473]" />
                      <span>সাব-এডমিন পাসওয়ার্ড পরিবর্তন / রিকভারি</span>
                    </div>
                    <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                      আপনার নিবন্ধিত সাব-এডমিন ইমেইল ঠিকানা প্রদান করে সরাসরি নতুন পাসওয়ার্ড সেট করুন।
                    </p>

                    {forgotSuccess ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl font-medium mb-3">
                        {forgotSuccess}
                      </div>
                    ) : (
                      <form
                        autoComplete="off"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setError(null);
                          if (!forgotEmail.trim()) {
                            setError('আপনার নিবন্ধিত ইমেইল বা ইউজার আইডি দিন।');
                            return;
                          }
                          if (forgotNewPass.length < 6) {
                            setError('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
                            return;
                          }
                          if (forgotNewPass !== forgotConfirmPass) {
                            setError('পাসওয়ার্ড দুটি মিলছে না! সতর্কতার সাথে লিখুন।');
                            return;
                          }
                          setIsSubmitting(true);
                          const ok = await subAdminResetPassword(forgotEmail, forgotNewPass);
                          setIsSubmitting(false);
                          if (ok) {
                            setForgotSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
                            setForgotEmail('');
                            setForgotNewPass('');
                            setForgotConfirmPass('');
                            setAdminEmail('');
                            setAdminPassword('');
                            setTimeout(() => {
                              setIsForgotPassword(false);
                              setForgotSuccess(null);
                            }, 2000);
                          } else {
                            setError('প্রদত্ত ইমেইল বা ইউজার আইডি দিয়ে কোনো সাব-এডমিন একাউন্ট পাওয়া যায়নি!');
                          }
                        }}
                        className="space-y-3"
                      >
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            রেজিস্ট্রেশনকৃত সাব-এডমিন ইমেইল বা ইউজার আইডি *
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                            <input
                              type="text"
                              required
                              autoComplete="off"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="subadmin@muttaqi.com বা ইউজার আইডি"
                              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর) *
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                            <input
                              type="password"
                              required
                              value={forgotNewPass}
                              onChange={(e) => setForgotNewPass(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            নতুন পাসওয়ার্ড নিশ্চিত করুন *
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                            <input
                              type="password"
                              required
                              value={forgotConfirmPass}
                              onChange={(e) => setForgotConfirmPass(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm shadow-sm cursor-pointer"
                          >
                            পাসওয়ার্ড সংরক্ষণ করুন
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(false);
                              setError(null);
                            }}
                            className="px-3.5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                          >
                            ফিরে যান
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleAdminLoginSubmit} autoComplete="off" className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                          <span>এডমিন / সাব-এডমিন ইউজার আইডি বা ইমেইল *</span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            User ID / Email
                          </span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            name="admin_login_user_nosave"
                            id="admin_login_user_nosave"
                            autoComplete="off"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-bwignore="true"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@muttaqi.com বা সাব-এডমিন ইউজার আইডি (যেমন: subadmin.tariqul)"
                            className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473] bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                          <span>পাসওয়ার্ড *</span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            Security Key
                          </span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                          <input
                            type={showAdminPass ? 'text' : 'password'}
                            required
                            name="admin_login_pass_nosave"
                            id="admin_login_pass_nosave"
                            autoComplete="new-password"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-bwignore="true"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] focus:border-[#DCB473] bg-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPass(!showAdminPass)}
                            className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                            aria-label="Toggle password visibility"
                          >
                            {showAdminPass ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 sm:py-3 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
                      >
                        {isSubmitting ? (
                          <span>যাচাই করা হচ্ছে...</span>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" />
                            <span>এডমিন প্যানেলে লগইন করুন</span>
                          </>
                        )}
                      </button>
                    </form>

                    <div className="flex items-center justify-between mt-3 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setForgotEmail(adminEmail);
                          setError(null);
                        }}
                        className="text-stone-600 hover:text-emerald-700 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        পাসওয়ার্ড ভুলে গেছেন? (ফরগেট পাসওয়ার্ড)
                      </button>
                      <span className="text-[10px] text-stone-400">সাব-এডমিন একাউন্ট</span>
                    </div>
                  </>
                )}

            {devSetupMode && (
              <form onSubmit={handleDeveloperSetup} className="mt-4 space-y-3 border border-[#DCB473]/40 rounded-2xl p-4 bg-amber-50/50">
                <p className="text-xs font-bold text-[#0f2922]">ডেভেলপার প্রথম লগইন — পাসওয়ার্ড সেট করুন</p>
                <input type="password" value={devSetupPass} onChange={(e) => setDevSetupPass(e.target.value)} placeholder="নতুন পাসওয়ার্ড" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300" />
                <input type="password" value={devSetupConfirm} onChange={(e) => setDevSetupConfirm(e.target.value)} placeholder="পাসওয়ার্ড আবার" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300" />
                <button type="submit" className="w-full py-2.5 bg-[#0f2922] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm">পাসওয়ার্ড সেট করে লগইন করুন</button>
              </form>
            )}
          </div>
        )}

            {/* SEPARATOR & REGISTRATION BUTTONS */}
            <div className="mt-5 pt-4 border-t border-stone-200">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-px bg-stone-200 flex-1" />
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  অথবা অনলাইন নিবন্ধন করুন
                </span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>

              <div>
                {/* Button: Registration as "A Haji" */}
                <button
                  type="button"
                  onClick={() => setViewMode('haji')}
                  className="w-full p-3.5 text-left bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-300 hover:border-emerald-500 rounded-2xl transition-all shadow-xs hover:shadow-md group cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#0f2922] block leading-tight">
                        Registration as "A Haji" (হাজী হিসেবে প্রাক-নিবন্ধন)
                      </span>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        পবিত্র হজ্ব ও ওমরাহ পালনে ইচ্ছুক ভাই ও বোনদের জন্য অনলাইন আবেদন ফরম
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0 hidden sm:inline-block">
                    আবেদন করুন →
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: HAJI REGISTRATION FORM */}
        {viewMode === 'haji' && (
          <HajiRegistrationForm
            onBackToLogin={() => setViewMode('login')}
            onCloseModal={onClose}
          />
        )}

        {/* View Mode 3: SUB ADMIN REGISTRATION FORM */}
        {viewMode === 'sub_admin' && (
          <SubAdminRegistrationForm
            onBackToLogin={() => setViewMode('login')}
            onSuccessRedirectToLogin={() => {
              setViewMode('login');
              setLoginTab('admin');
            }}
          />
        )}
      </div>
    </div>
  );
};
