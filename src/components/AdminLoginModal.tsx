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
  User,
  Eye,
  EyeOff,
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

type StaggerStyle = React.CSSProperties & {
  '--in'?: number;
  '--out'?: number;
};

const stagger = (order: number): StaggerStyle => ({
  '--in': order,
  '--out': order
});

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  initialTab = 'haji'
}) => {
  const { login, hajiLogin, subAdminResetPassword, setIsAdminLoggedIn } = useAdmin();
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
      setDevSetupMode(false);
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

  const switchLoginTab = (nextTab: 'haji' | 'admin') => {
    setLoginTab(nextTab);
    setError(null);
    setIsPendingApproval(false);
    setIsForgotPassword(false);
    setForgotSuccess(null);
  };

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
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
      setForgotSuccess(
        'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
      );
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
  };

  const isAdminActive = loginTab === 'admin';

  // View Mode 2 & 3: Registration Forms keep spacious light modal shell
  if (viewMode !== 'login') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div
          className={`bg-white rounded-3xl ${
            viewMode === 'haji' ? 'max-w-3xl' : 'max-w-xl'
          } w-full p-5 sm:p-7 shadow-2xl relative border border-[#DCB473]/30 max-h-[92vh] overflow-y-auto transition-all`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors z-10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {viewMode === 'haji' && (
            <HajiRegistrationForm
              onBackToLogin={() => setViewMode('login')}
              onCloseModal={onClose}
            />
          )}

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
  }

  // Shared Error Alert Banner (dark-obsidian themed)
  const renderErrorAlert = () =>
    error ? (
      <div
        className={`mb-3 p-2.5 rounded-xl text-[11px] flex items-start gap-2 border ${
          isPendingApproval
            ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
            : 'bg-rose-500/15 border-rose-400/50 text-rose-200'
        }`}
      >
        {isPendingApproval ? (
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        )}
        <div className="leading-snug">
          <p className="font-bold">
            {isPendingApproval
              ? 'আবেদন অনুমোদনের অপেক্ষায় আছে (Pending Approval)'
              : 'লগইন ত্রুটি'}
          </p>
          <p className="mt-0.5 opacity-95">{error}</p>
        </div>
      </div>
    ) : null;

  // View Mode 1: ANIMATED DIAGONAL-SWEEP LOGIN PANEL (Mobile + Desktop full video animation)
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`auth-neon-shell my-auto rounded-xl w-full max-w-[430px] md:max-w-[790px] md:min-h-[560px] ${
          isAdminActive ? 'is-active' : ''
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/35 hover:bg-black/60 border border-white/25 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dual Diagonal Sweeping Curtains — Active on BOTH Mobile & Desktop */}
        <div className="auth-curved-shape" aria-hidden="true" />
        <div className="auth-curved-shape2" aria-hidden="true" />

        {/* ============================================================
            WELCOME PANEL (RIGHT / TOP-RIGHT OVER ORANGE — Haji Mode)
           ============================================================ */}
        <div
          aria-hidden={isAdminActive}
          className={`auth-welcome-right absolute top-0 left-0 right-0 h-[146px] md:h-auto md:inset-y-0 md:left-auto md:right-0 md:w-1/2 z-10 flex flex-col justify-center items-end text-right pt-8 pb-3 pr-5 pl-12 md:pt-0 md:pb-0 md:pr-10 md:pl-16 ${
            isAdminActive ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          <p
            className="auth-anim text-[10px] md:text-[11px] font-bold tracking-[0.18em] uppercase text-white/85 mb-1 md:mb-2"
            style={stagger(0)}
          >
            মুত্তাকী হজ্ব ও কন্সাল্টেন্সি
          </p>
          <h2
            className="auth-anim text-[24px] md:text-[34px] font-extrabold leading-[1.08] uppercase text-white drop-shadow-sm"
            style={stagger(1)}
          >
            WELCOME
            <br className="hidden md:block" /> BACK!
          </h2>
          <p
            className="auth-anim text-[11px] md:text-xs text-white/92 mt-1.5 md:mt-3 max-w-[240px] leading-relaxed"
            style={stagger(2)}
          >
            আপনার ইউজার আইডি ও পাসওয়ার্ড দিয়ে হাজী প্রোফাইলে প্রবেশ করুন।
          </p>
        </div>

        {/* ============================================================
            WELCOME PANEL (LEFT / TOP-LEFT OVER ORANGE — Admin Mode)
           ============================================================ */}
        <div
          aria-hidden={!isAdminActive}
          className={`auth-welcome-left absolute top-0 left-0 right-0 h-[146px] md:h-auto md:inset-y-0 md:right-auto md:left-0 md:w-1/2 z-10 flex flex-col justify-center items-start text-left pt-8 pb-3 pl-5 pr-12 md:pt-0 md:pb-0 md:pl-10 md:pr-16 ${
            isAdminActive ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <p
            className="auth-anim text-[10px] md:text-[11px] font-bold tracking-[0.18em] uppercase text-white/85 mb-1 md:mb-2"
            style={stagger(0)}
          >
            কন্ট্রোল প্যানেল
          </p>
          <h2
            className="auth-anim text-[24px] md:text-[34px] font-extrabold leading-[1.08] uppercase text-white drop-shadow-sm"
            style={stagger(1)}
          >
            WELCOME!
          </h2>
          <p
            className="auth-anim text-[11px] md:text-xs text-white/92 mt-1.5 md:mt-3 max-w-[240px] leading-relaxed"
            style={stagger(2)}
          >
            এডমিন ও সাব-এডমিন কন্ট্রোল প্যানেলে আপনাকে স্বাগতম।
          </p>
        </div>

        {/* Unified Grid Layer so BOTH forms stay mounted & animate smoothly on mobile + desktop */}
        <div className="grid grid-cols-1 md:block">
          {/* ============================================================
              PANEL 1 (LEFT SIDE): HAJI LOGIN FORM (Default active view)
             ============================================================ */}
          <div
            aria-hidden={isAdminActive}
            className={`auth-panel-left col-start-1 row-start-1 relative md:absolute md:inset-y-0 md:left-0 md:w-1/2 z-10 flex flex-col md:overflow-y-auto pt-[162px] pb-6 px-5 md:pt-7 md:pb-7 md:px-9 ${
              isAdminActive ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
          >
            <div className="my-auto w-full">
              {/* Top role toggle bar */}
              <div
                className="auth-anim grid grid-cols-2 gap-1 p-1 mb-4 rounded-full bg-white/5 border border-white/15"
                style={stagger(0)}
              >
                <button
                  type="button"
                  onClick={() => switchLoginTab('haji')}
                  className="py-1.5 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 bg-[#e46033] text-white cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>হাজী লগইন</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchLoginTab('admin')}
                  className="py-1.5 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 text-white/75 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>এডমিন লগইন</span>
                </button>
              </div>

              <h2
                className="auth-anim text-2xl sm:text-[26px] font-extrabold text-center text-white tracking-tight mb-1"
                style={stagger(1)}
              >
                হাজী লগইন
              </h2>
              <p
                className="auth-anim text-[11px] text-center text-white/65 mb-4"
                style={stagger(1)}
              >
                Haji Portal Login · রেজিস্ট্রেশনের মোবাইল নম্বর বা ইউজার আইডি
              </p>

              {!isAdminActive && (
                <div className="auth-anim" style={stagger(2)}>
                  {renderErrorAlert()}
                </div>
              )}

              <form onSubmit={handleHajiLoginSubmit} autoComplete="off" className="space-y-4">
                {/* Floating Input 1: Haji User ID / Mobile */}
                <div
                  className={`auth-anim auth-input-box ${hajiUserId ? 'has-value' : ''}`}
                  style={stagger(2)}
                >
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
                  />
                  <label htmlFor="haji_login_uid_nosave">
                    মোবাইল নম্বর বা ইউজার আইডি (Mobile / User ID)
                  </label>
                  <User className="auth-input-icon w-4 h-4 pointer-events-none" />
                </div>

                {/* Floating Input 2: Haji Password */}
                <div
                  className={`auth-anim auth-input-box ${hajiPassword ? 'has-value' : ''}`}
                  style={stagger(3)}
                >
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
                    className="font-mono"
                  />
                  <label htmlFor="haji_login_pwd_nosave">পাসওয়ার্ড (Password)</label>
                  <button
                    type="button"
                    onClick={() => setShowHajiPass(!showHajiPass)}
                    className="auth-input-icon cursor-pointer hover:text-[#e46033]"
                    aria-label="Toggle password visibility"
                  >
                    {showHajiPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Glossy Glowing Orange Submit Button */}
                <div className="auth-anim pt-2" style={stagger(4)}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="auth-neon-btn flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>যাচাই করা হচ্ছে...</span>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>হাজী পোর্টালে লগইন করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Switch & Haji Registration Links */}
              <div className="auth-anim mt-4 space-y-3 text-center" style={stagger(5)}>
                <p className="text-xs text-white/80">
                  এডমিন বা সাব-এডমিন হিসেবে প্রবেশ করতে চান?{' '}
                  <button
                    type="button"
                    onClick={() => switchLoginTab('admin')}
                    className="text-[#e46033] hover:underline font-bold cursor-pointer"
                  >
                    এডমিন লগইন
                  </button>
                </p>

                <div className="pt-3 border-t border-white/12">
                  <button
                    type="button"
                    onClick={() => setViewMode('haji')}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-[#e46033]/18 border border-[#e46033]/50 hover:border-[#e46033] text-left transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-[#e46033]/20 text-[#ff8b60] flex items-center justify-center shrink-0">
                        <Compass className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          Registration as &quot;A Haji&quot;
                        </span>
                        <span className="text-[10px] text-white/65 block truncate">
                          হাজী হিসেবে অনলাইন প্রাক-নিবন্ধন ফরম
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#ff8b60] group-hover:translate-x-0.5 transition-transform whitespace-nowrap shrink-0">
                      আবেদন করুন →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              PANEL 2 (RIGHT SIDE): ADMIN & SUB-ADMIN LOGIN / RECOVERY
             ============================================================ */}
          <div
            aria-hidden={!isAdminActive}
            className={`auth-panel-right col-start-1 row-start-1 relative md:absolute md:inset-y-0 md:right-0 md:w-1/2 z-10 flex flex-col md:overflow-y-auto pt-[162px] pb-6 px-5 md:pt-11 md:pb-7 md:px-9 ${
              isAdminActive ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            <div className="my-auto w-full">
              {/* Top role toggle bar */}
              <div
                className="auth-anim grid grid-cols-2 gap-1 p-1 mb-4 rounded-full bg-white/5 border border-white/15"
                style={stagger(0)}
              >
                <button
                  type="button"
                  onClick={() => switchLoginTab('haji')}
                  className="py-1.5 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 text-white/75 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>হাজী লগইন</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchLoginTab('admin')}
                  className="py-1.5 px-2.5 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 bg-[#e46033] text-white cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>এডমিন লগইন</span>
                </button>
              </div>

              <h2
                className="auth-anim text-2xl sm:text-[25px] font-extrabold text-center text-white tracking-tight mb-1"
                style={stagger(1)}
              >
                {isForgotPassword ? 'পাসওয়ার্ড রিকভারি' : 'এডমিন লগইন'}
              </h2>
              <p
                className="auth-anim text-[11px] text-center text-white/65 mb-4"
                style={stagger(1)}
              >
                {isForgotPassword
                  ? 'সাব-এডমিন পাসওয়ার্ড পরিবর্তন / রিকভারি'
                  : 'এডমিন ও সাব-এডমিন কন্ট্রোল প্যানেল'}
              </p>

              {isAdminActive && (
                <div className="auth-anim" style={stagger(2)}>
                  {renderErrorAlert()}
                </div>
              )}

              {isForgotPassword ? (
                <div className="auth-anim space-y-3" style={stagger(2)}>
                  {forgotSuccess ? (
                    <div className="p-3 bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 text-xs rounded-xl font-medium">
                      {forgotSuccess}
                    </div>
                  ) : (
                    <form autoComplete="off" onSubmit={handleForgotSubmit} className="space-y-3.5">
                      <div className={`auth-input-box ${forgotEmail ? 'has-value' : ''}`}>
                        <input
                          type="text"
                          required
                          id="forgot_subadmin_email"
                          autoComplete="off"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                        />
                        <label htmlFor="forgot_subadmin_email">
                          সাব-এডমিন ইমেইল বা ইউজার আইডি
                        </label>
                        <Mail className="auth-input-icon w-4 h-4 pointer-events-none" />
                      </div>

                      <div className={`auth-input-box ${forgotNewPass ? 'has-value' : ''}`}>
                        <input
                          type="password"
                          required
                          id="forgot_subadmin_newpass"
                          value={forgotNewPass}
                          onChange={(e) => setForgotNewPass(e.target.value)}
                          className="font-mono"
                        />
                        <label htmlFor="forgot_subadmin_newpass">
                          নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                        </label>
                        <Lock className="auth-input-icon w-4 h-4 pointer-events-none" />
                      </div>

                      <div className={`auth-input-box ${forgotConfirmPass ? 'has-value' : ''}`}>
                        <input
                          type="password"
                          required
                          id="forgot_subadmin_confirmpass"
                          value={forgotConfirmPass}
                          onChange={(e) => setForgotConfirmPass(e.target.value)}
                          className="font-mono"
                        />
                        <label htmlFor="forgot_subadmin_confirmpass">
                          নতুন পাসওয়ার্ড নিশ্চিত করুন
                        </label>
                        <Lock className="auth-input-icon w-4 h-4 pointer-events-none" />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="auth-neon-btn flex-1 text-xs"
                        >
                          পাসওয়ার্ড সংরক্ষণ করুন
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(false);
                            setError(null);
                          }}
                          className="px-4 h-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          ফিরে যান
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  <form onSubmit={handleAdminLoginSubmit} autoComplete="off" className="space-y-4">
                    <div
                      className={`auth-anim auth-input-box ${adminEmail ? 'has-value' : ''}`}
                      style={stagger(2)}
                    >
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
                      />
                      <label htmlFor="admin_login_user_nosave">
                        এডমিন / সাব-এডমিন ইউজার আইডি বা ইমেইল
                      </label>
                      <User className="auth-input-icon w-4 h-4 pointer-events-none" />
                    </div>

                    <div
                      className={`auth-anim auth-input-box ${adminPassword ? 'has-value' : ''}`}
                      style={stagger(3)}
                    >
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
                        className="font-mono"
                      />
                      <label htmlFor="admin_login_pass_nosave">পাসওয়ার্ড (Security Key)</label>
                      <button
                        type="button"
                        onClick={() => setShowAdminPass(!showAdminPass)}
                        className="auth-input-icon cursor-pointer hover:text-[#e46033]"
                        aria-label="Toggle password visibility"
                      >
                        {showAdminPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="auth-anim pt-2" style={stagger(4)}>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="auth-neon-btn flex items-center justify-center gap-2 disabled:opacity-50"
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
                    </div>
                  </form>

                  <div
                    className="auth-anim flex items-center justify-between mt-3 text-[11px]"
                    style={stagger(5)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotEmail(adminEmail);
                        setError(null);
                      }}
                      className="text-[#ff8b60] hover:text-[#e46033] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                    <span className="text-white/50">সাব-এডমিন একাউন্ট</span>
                  </div>
                </>
              )}

              {devSetupMode && (
                <form
                  onSubmit={handleDeveloperSetup}
                  className="mt-3 space-y-2.5 border border-[#e46033]/50 rounded-xl p-3 bg-black/30"
                >
                  <p className="text-[11px] font-bold text-[#ff8b60]">
                    ডেভেলপার প্রথম লগইন — পাসওয়ার্ড সেট করুন
                  </p>
                  <input
                    type="password"
                    value={devSetupPass}
                    onChange={(e) => setDevSetupPass(e.target.value)}
                    placeholder="নতুন পাসওয়ার্ড"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/25 text-white placeholder:text-white/45"
                  />
                  <input
                    type="password"
                    value={devSetupConfirm}
                    onChange={(e) => setDevSetupConfirm(e.target.value)}
                    placeholder="পাসওয়ার্ড আবার"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/25 text-white placeholder:text-white/45"
                  />
                  <button type="submit" className="auth-neon-btn text-xs">
                    পাসওয়ার্ড সেট করে লগইন করুন
                  </button>
                </form>
              )}

              {/* Bottom Switch & Haji Registration Links */}
              <div className="auth-anim mt-4 space-y-2.5 text-center" style={stagger(6)}>
                <p className="text-xs text-white/80">
                  হাজী প্রোফাইলে প্রবেশ করতে চান?{' '}
                  <button
                    type="button"
                    onClick={() => switchLoginTab('haji')}
                    className="text-[#e46033] hover:underline font-bold cursor-pointer"
                  >
                    হাজী লগইন
                  </button>
                </p>

                <div className="pt-2.5 border-t border-white/12">
                  <button
                    type="button"
                    onClick={() => setViewMode('haji')}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-[#e46033]/18 border border-[#e46033]/45 hover:border-[#e46033] text-left transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Compass className="w-4 h-4 text-[#ff8b60] shrink-0" />
                      <span className="text-[11px] font-bold text-white truncate">
                        Registration as &quot;A Haji&quot; (প্রাক-নিবন্ধন)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#ff8b60] whitespace-nowrap shrink-0">
                      আবেদন →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
