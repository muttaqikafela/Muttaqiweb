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
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Send
} from 'lucide-react';
import { HajiRegistrationForm } from './HajiRegistrationForm';
import { SubAdminRegistrationForm } from './SubAdminRegistrationForm';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onHajiSuccess?: () => void;
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
  onHajiSuccess,
  initialMode = 'login',
  initialTab = 'haji'
}) => {
  const { login, hajiLogin, setIsAdminLoggedIn, showToast } = useAdmin();
  const { siteSettings, developerLogin, developerSetup, developerLogout } = useSite();
  const [devSetupMode, setDevSetupMode] = useState(false);
  const [devSetupPass, setDevSetupPass] = useState('');
  const [devSetupConfirm, setDevSetupConfirm] = useState('');
  const [viewMode, setViewMode] = useState<'login' | 'haji' | 'sub_admin'>(initialMode);
  const [loginTab, setLoginTab] = useState<'haji' | 'admin'>(initialTab);

  // Forget Password (User ID + Email -> Previous Password via Email) state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResult, setForgotResult] = useState<{
    deliveredToEmail: boolean;
    maskedEmail: string;
    accountType?: 'haji' | 'admin' | 'sub_admin' | 'employee';
    accountName?: string;
    roleLabel?: string;
    displayUserId?: string;
    sentAt?: string;
    emailMessage?: {
      to: string;
      from: string;
      subject: string;
      accountName: string;
      roleLabel: string;
      displayUserId: string;
      previousPassword: string;
      sentAt: string;
    };
  } | null>(null);
  const [showRecoveredPass, setShowRecoveredPass] = useState(true);
  const [copiedRecoveredPass, setCopiedRecoveredPass] = useState(false);

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
    setForgotUserId('');
    setForgotEmail('');
    setForgotResult(null);
    setCopiedRecoveredPass(false);
    setDevSetupPass('');
    setDevSetupConfirm('');
    if (isOpen) {
      setViewMode(initialMode);
      setLoginTab(initialTab);
      setError(null);
      setIsPendingApproval(false);
      setIsForgotPassword(false);
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
      setForgotUserId('');
      setForgotEmail('');
      setForgotResult(null);
      setCopiedRecoveredPass(false);
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
    setForgotResult(null);
    setCopiedRecoveredPass(false);
  };

  const openForgetPasswordView = (prefillValue?: string) => {
    const trimmed = prefillValue?.trim() || '';
    const looksLikeEmail = trimmed.includes('@');
    setIsForgotPassword(true);
    setForgotUserId(looksLikeEmail ? '' : trimmed);
    setForgotEmail(looksLikeEmail ? trimmed : '');
    setForgotResult(null);
    setCopiedRecoveredPass(false);
    setShowRecoveredPass(true);
    setError(null);
    setIsPendingApproval(false);
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
        onHajiSuccess?.();
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
    setForgotResult(null);

    const cleanUid = forgotUserId.trim();
    const cleanEmail = forgotEmail.trim();

    if (!cleanUid) {
      setError('অনুগ্রহ করে আপনার ইউজার আইডি দিন।');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('অনুগ্রহ করে আপনার সঠিক নিবন্ধিত ইমেইল ঠিকানা দিন।');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanUid,
          email: cleanEmail,
          scope: loginTab
        })
      });
      const data = await response.json();
      setIsSubmitting(false);

      if (!response.ok || !data?.ok) {
        setError(
          data?.error ||
            'প্রদত্ত ইউজার আইডি ও ইমেইল মিলেনি! অনুগ্রহ করে নিবন্ধিত সঠিক তথ্য দিন।'
        );
        return;
      }

      setForgotResult({
        deliveredToEmail: Boolean(data.deliveredToEmail),
        maskedEmail: data.maskedEmail || cleanEmail,
        accountType: data.accountType,
        accountName: data.accountName || data.emailMessage?.accountName,
        roleLabel: data.roleLabel || data.emailMessage?.roleLabel,
        displayUserId: data.displayUserId || data.emailMessage?.displayUserId,
        sentAt: data.sentAt || data.emailMessage?.sentAt,
        emailMessage: data.emailMessage
      });
      setForgotUserId('');
      setForgotEmail('');

      if (data.deliveredToEmail) {
        showToast(`আপনার ইমেইলে (${data.maskedEmail}) পূর্বের পাসওয়ার্ড পাঠানো হয়েছে!`);
      } else {
        showToast('ইউজার আইডি ও ইমেইল সফলভাবে যাচাই হয়েছে! আপনার পূর্বের পাসওয়ার্ড নিচে প্রদর্শিত হয়েছে।');
      }
    } catch {
      setIsSubmitting(false);
      setError('সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    }
  };

  const handleCopyRecoveredPassword = (pwd: string) => {
    try {
      navigator.clipboard.writeText(pwd);
      setCopiedRecoveredPass(true);
      showToast('পূর্বের পাসওয়ার্ড কপি হয়েছে!');
      setTimeout(() => setCopiedRecoveredPass(false), 2000);
    } catch {
      showToast('কপি করা যায়নি — ম্যানুয়ালি কপি করুন।');
    }
  };

  const renderForgetPasswordPanel = (tabIdPrefix: 'haji' | 'admin') => (
    <div className="auth-anim space-y-3" style={stagger(2)}>
      {forgotResult ? (
        <div className="space-y-3">
          {forgotResult.deliveredToEmail ? (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-400/50 text-emerald-100 text-xs rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>ইমেইলে পূর্বের পাসওয়ার্ড পাঠানো হয়েছে!</span>
              </div>
              <p className="leading-relaxed text-white/90">
                আপনার নিবন্ধিত ইমেইল{' '}
                <strong className="text-[#EAC471] font-mono">{forgotResult.maskedEmail}</strong>-এ
                পূর্বের পাসওয়ার্ড পাঠিয়ে দেওয়া হয়েছে। অনুগ্রহ করে ইমেইলের <strong>Inbox</strong> বা{' '}
                <strong>Spam</strong> ফোল্ডার চেক করুন।
              </p>
              {forgotResult.accountName && (
                <p className="text-[11px] text-white/75">
                  একাউন্ট: <strong className="text-white">{forgotResult.accountName}</strong> (
                  {forgotResult.roleLabel})
                </p>
              )}
            </div>
          ) : (
            forgotResult.emailMessage && (
              <div className="rounded-xl border border-[#EAC471]/60 bg-white/5 overflow-hidden text-xs">
                <div className="px-3.5 py-2 bg-gradient-to-r from-[#EAC471]/25 to-[#C09663]/20 border-b border-[#EAC471]/35 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[#EAC471] font-bold">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>ইমেইল বার্তা (পূর্বের পাসওয়ার্ড)</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    যাচাই সম্পন্ন
                  </span>
                </div>

                <div className="p-3.5 space-y-2 text-white/90">
                  <div className="space-y-1 text-[11px] border-b border-white/10 pb-2">
                    <p className="truncate">
                      <span className="text-white/55">প্রাপক (Email): </span>
                      <span className="font-mono font-bold text-[#EAC471]">
                        {forgotResult.emailMessage.to}
                      </span>
                    </p>
                    <p className="truncate">
                      <span className="text-white/55">একাউন্ট: </span>
                      <strong className="text-white">{forgotResult.emailMessage.accountName}</strong>{' '}
                      <span className="text-white/60">({forgotResult.emailMessage.roleLabel})</span>
                    </p>
                    <p>
                      <span className="text-white/55">ইউজার আইডি: </span>
                      <span className="font-mono text-white">
                        {forgotResult.emailMessage.displayUserId}
                      </span>
                    </p>
                  </div>

                  <div className="pt-0.5">
                    <span className="block text-[10px] uppercase tracking-wider text-white/60 mb-1">
                      আপনার পূর্বের পাসওয়ার্ড (Previous Password)
                    </span>
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#231F20] border border-[#EAC471]/60">
                      <span className="font-mono text-sm font-extrabold text-[#EAC471] tracking-wider break-all">
                        {showRecoveredPass
                          ? forgotResult.emailMessage.previousPassword
                          : '••••••••'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowRecoveredPass((v) => !v)}
                          className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/80 cursor-pointer"
                          title={showRecoveredPass ? 'লুকান' : 'দেখুন'}
                        >
                          {showRecoveredPass ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyRecoveredPassword(forgotResult.emailMessage!.previousPassword)
                          }
                          className="p-1.5 rounded-md bg-[#EAC471]/20 hover:bg-[#EAC471]/35 text-[#EAC471] cursor-pointer"
                          title="পাসওয়ার্ড কপি করুন"
                        >
                          {copiedRecoveredPass ? (
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/60 leading-snug pt-1">
                    দ্রষ্টব্য: সার্ভারে SMTP ইমেইল কনফিগারেশন যুক্ত করা হলে এই একই বার্তা সরাসরি আপনার
                    ইমেইল ইনবক্সে স্বয়ংক্রিয়ভাবে পাঠানো হবে।
                  </p>
                </div>
              </div>
            )
          )}

          <button
            type="button"
            onClick={() => {
              const matchedTab = forgotResult.accountType === 'haji' ? 'haji' : 'admin';
              setIsForgotPassword(false);
              setForgotResult(null);
              setError(null);
              if (forgotResult.accountType) {
                setLoginTab(matchedTab);
              }
            }}
            className="auth-neon-btn flex items-center justify-center gap-2 text-xs"
          >
            <KeyRound className="w-4 h-4" />
            <span>লগইন প্যানেলে ফিরে যান</span>
          </button>
        </div>
      ) : (
        <form autoComplete="off" onSubmit={handleForgotSubmit} className="space-y-4">
          <div className={`auth-input-box ${forgotUserId ? 'has-value' : ''}`}>
            <input
              type="text"
              required
              id={`forgot_${tabIdPrefix}_userid`}
              autoComplete="off"
              data-lpignore="true"
              value={forgotUserId}
              onChange={(e) => setForgotUserId(e.target.value)}
            />
            <label htmlFor={`forgot_${tabIdPrefix}_userid`}>
              ইউজার আইডি (User ID / মোবাইল)
            </label>
            <User className="auth-input-icon w-4 h-4 pointer-events-none" />
          </div>

          <div className={`auth-input-box ${forgotEmail ? 'has-value' : ''}`}>
            <input
              type="email"
              required
              id={`forgot_${tabIdPrefix}_email`}
              autoComplete="off"
              data-lpignore="true"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <label htmlFor={`forgot_${tabIdPrefix}_email`}>নিবন্ধিত ইমেইল (Email)</label>
            <Mail className="auth-input-icon w-4 h-4 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-neon-btn flex-1 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>যাচাই করা হচ্ছে...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>কনফার্ম করুন</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setForgotResult(null);
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
  );

  const isAdminActive = loginTab === 'admin';

  // View Mode 2 & 3: Registration Forms keep spacious light modal shell
  if (viewMode !== 'login') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div
          className={`bg-white rounded-3xl ${
            viewMode === 'haji' ? 'max-w-3xl' : 'max-w-xl'
          } w-full p-5 sm:p-7 shadow-2xl relative border border-[#C09663]/40 max-h-[92vh] overflow-y-auto transition-all`}
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
              : isForgotPassword
              ? 'পাসওয়ার্ড রিকভারি ত্রুটি'
              : 'লগইন ত্রুটি'}
          </p>
          <p className="mt-0.5 opacity-95">{error}</p>
        </div>
      </div>
    ) : null;

  const talbiyahQuote =
    "লাব্বাইক আল্লাহুম্মা লাব্বাইক, লাব্বাইকা লা শারিকা লাকা লাব্বাইক, ইন্নাল হামদা ওয়ান নি'মাতা লাকা ওয়াল মুলক, লা শারিকা লাক।";
  const siteBrandBn = siteSettings.siteNameBn || 'মুত্তাকী হজ্ব ও কন্সাল্টেন্সি';
  const siteBrandEn = (siteSettings.siteNameEn || 'Muttaqi Hajj & Consultancy').toUpperCase();

  const renderWebsiteLogo = (sizeClass = 'w-11 h-11 md:w-20 md:h-20') =>
    siteSettings.logoUrl ? (
      <div
        className={`${sizeClass} rounded-full bg-white p-1 ring-2 ring-[#231F20]/30 shadow-[0_6px_20px_rgba(35,31,32,0.35)] flex items-center justify-center overflow-hidden shrink-0`}
      >
        <img
          src={siteSettings.logoUrl}
          alt={siteBrandBn}
          className="w-full h-full object-contain rounded-full"
        />
      </div>
    ) : (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-[#EAC471] to-[#C09663] p-0.5 ring-2 ring-[#231F20]/35 shadow-[0_6px_20px_rgba(35,31,32,0.35)] shrink-0`}
      >
        <div className="w-full h-full rounded-full bg-[#231F20] flex items-center justify-center text-[#EAC471]">
          <Compass className="w-6 h-6 md:w-9 md:h-9" />
        </div>
      </div>
    );

  // View Mode 1: ANIMATED DIAGONAL-SWEEP LOGIN PANEL (Mobile + Desktop full video animation)
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className={`auth-neon-shell my-auto rounded-xl w-full max-w-[430px] md:max-w-[820px] md:min-h-[580px] ${
          isAdminActive ? 'is-active' : ''
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-[#231F20]/80 hover:bg-[#231F20] border border-[#EAC471]/60 text-[#EAC471] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dual Diagonal Sweeping Curtains — Active on BOTH Mobile & Desktop */}
        <div className="auth-curved-shape" aria-hidden="true" />
        <div className="auth-curved-shape2" aria-hidden="true" />

        {/* ============================================================
            WELCOME PANEL (RIGHT / TOP OVER GOLD — Haji Mode)
           ============================================================ */}
        <div
          aria-hidden={isAdminActive}
          className={`auth-welcome-right absolute top-0 left-0 right-0 h-[184px] md:h-auto md:inset-y-0 md:left-auto md:right-0 md:w-1/2 z-10 flex flex-col justify-center md:justify-start items-start md:items-end text-left md:text-right pt-5 pb-3 pl-4 pr-12 md:pt-4 md:pb-8 md:pr-14 md:pl-10 ${
            isAdminActive ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          {/* Website Logo & Brand Name */}
          <div
            className="auth-anim flex items-center md:flex-col md:items-end gap-2.5 md:gap-2 mb-2 md:mb-5"
            style={stagger(0)}
          >
            {renderWebsiteLogo()}
            <div className="min-w-0">
              <p className="text-[13px] md:text-lg font-extrabold text-[#231F20] leading-tight">
                {siteBrandBn}
              </p>
              <p className="text-[9px] md:text-[10px] font-bold tracking-[0.14em] uppercase text-[#231F20]/80 truncate mt-0.5">
                {siteBrandEn}
              </p>
            </div>
          </div>

          {/* Talbiyah Quote Block */}
          <blockquote
            className="auth-anim w-full md:max-w-[300px] bg-[#231F20]/90 backdrop-blur-xs border border-[#EAC471]/80 rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3.5 shadow-lg"
            style={stagger(1)}
          >
            <div className="hidden md:block w-10 h-0.5 bg-gradient-to-r from-[#EAC471] to-[#C09663] rounded-full ml-auto mb-2" />
            <p className="text-[11px] md:text-[13.5px] font-semibold text-white leading-[1.48] md:leading-[1.72]">
              &ldquo;{talbiyahQuote}&rdquo;
            </p>
          </blockquote>

          <p
            className="auth-anim hidden md:block text-[11px] font-semibold text-[#231F20]/90 mt-3.5 max-w-[260px] leading-relaxed"
            style={stagger(2)}
          >
            আপনার ইউজার আইডি ও পাসওয়ার্ড দিয়ে হাজী প্রোফাইলে প্রবেশ করুন।
          </p>
        </div>

        {/* ============================================================
            WELCOME PANEL (LEFT / TOP OVER GOLD — Admin Mode)
           ============================================================ */}
        <div
          aria-hidden={!isAdminActive}
          className={`auth-welcome-left absolute top-0 left-0 right-0 h-[184px] md:h-auto md:inset-y-0 md:right-auto md:left-0 md:w-1/2 z-10 flex flex-col justify-center md:justify-start items-start text-left pt-5 pb-3 pl-4 pr-12 md:pt-4 md:pb-8 md:pl-9 md:pr-14 ${
            isAdminActive ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {/* Website Logo & Brand Name */}
          <div
            className="auth-anim flex items-center md:flex-col md:items-start gap-2.5 md:gap-2 mb-2 md:mb-5"
            style={stagger(0)}
          >
            {renderWebsiteLogo()}
            <div className="min-w-0">
              <p className="text-[13px] md:text-lg font-extrabold text-[#231F20] leading-tight">
                {siteBrandBn}
              </p>
              <p className="text-[9px] md:text-[10px] font-bold tracking-[0.14em] uppercase text-[#231F20]/80 truncate mt-0.5">
                {siteBrandEn}
              </p>
            </div>
          </div>

          {/* Talbiyah Quote Block */}
          <blockquote
            className="auth-anim w-full md:max-w-[300px] bg-[#231F20]/90 backdrop-blur-xs border border-[#EAC471]/80 rounded-xl md:rounded-2xl px-3 py-2 md:px-4 md:py-3.5 shadow-lg"
            style={stagger(1)}
          >
            <div className="hidden md:block w-10 h-0.5 bg-gradient-to-r from-[#EAC471] to-[#C09663] rounded-full mr-auto mb-2" />
            <p className="text-[11px] md:text-[13.5px] font-semibold text-white leading-[1.48] md:leading-[1.72]">
              &ldquo;{talbiyahQuote}&rdquo;
            </p>
          </blockquote>

          <p
            className="auth-anim hidden md:block text-[11px] font-semibold text-[#231F20]/90 mt-3.5 max-w-[260px] leading-relaxed"
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
            className={`auth-panel-left col-start-1 row-start-1 relative md:absolute md:inset-y-0 md:left-0 md:w-1/2 z-10 flex flex-col md:overflow-y-auto pt-[198px] pb-6 px-5 md:pt-7 md:pb-7 md:px-9 ${
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
                  className="py-1.5 px-2.5 rounded-full text-[11px] font-extrabold flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#EAC471] to-[#C09663] text-[#231F20] shadow-xs cursor-pointer whitespace-nowrap"
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
                {isForgotPassword && !isAdminActive ? 'Forget password' : 'হাজী লগইন'}
              </h2>
              <p
                className="auth-anim text-[11px] text-center text-white/65 mb-4"
                style={stagger(1)}
              >
                {isForgotPassword && !isAdminActive
                  ? 'ইউজার আইডি ও ইমেইল কনফার্ম করে পূর্বের পাসওয়ার্ড দেখুন'
                  : 'Haji Portal Login · রেজিস্ট্রেশনের মোবাইল নম্বর বা ইউজার আইডি'}
              </p>

              {!isAdminActive && (
                <div className="auth-anim" style={stagger(2)}>
                  {renderErrorAlert()}
                </div>
              )}

              {isForgotPassword && !isAdminActive ? (
                renderForgetPasswordPanel('haji')
              ) : (
                <>
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
                        className="auth-input-icon cursor-pointer hover:text-[#EAC471]"
                        aria-label="Toggle password visibility"
                      >
                        {showHajiPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Glossy Glowing Gold Submit Button */}
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

                  <div
                    className="auth-anim flex items-center justify-between mt-3 text-[11px]"
                    style={stagger(4)}
                  >
                    <button
                      type="button"
                      onClick={() => openForgetPasswordView(hajiUserId)}
                      className="text-[#EAC471] hover:text-[#C09663] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Forget password
                    </button>
                    <span className="text-white/50">ইমেইলে পূর্বের পাসওয়ার্ড</span>
                  </div>
                </>
              )}

              {/* Bottom Switch & Haji Registration Links */}
              <div className="auth-anim mt-4 space-y-3 text-center" style={stagger(5)}>
                <p className="text-xs text-white/80">
                  এডমিন বা সাব-এডমিন হিসেবে প্রবেশ করতে চান?{' '}
                  <button
                    type="button"
                    onClick={() => switchLoginTab('admin')}
                    className="text-[#EAC471] hover:text-[#C09663] hover:underline font-bold cursor-pointer"
                  >
                    এডমিন লগইন
                  </button>
                </p>

                <div className="pt-3 border-t border-white/12">
                  <button
                    type="button"
                    onClick={() => setViewMode('haji')}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-[#EAC471]/15 border border-[#C09663]/55 hover:border-[#EAC471] text-left transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EAC471]/25 to-[#C09663]/25 text-[#EAC471] flex items-center justify-center shrink-0">
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
                    <span className="text-[11px] font-bold text-[#EAC471] group-hover:translate-x-0.5 transition-transform whitespace-nowrap shrink-0">
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
            className={`auth-panel-right col-start-1 row-start-1 relative md:absolute md:inset-y-0 md:right-0 md:w-1/2 z-10 flex flex-col md:overflow-y-auto pt-[198px] pb-6 px-5 md:pt-11 md:pb-7 md:px-9 ${
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
                  className="py-1.5 px-2.5 rounded-full text-[11px] font-extrabold flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#EAC471] to-[#C09663] text-[#231F20] shadow-xs cursor-pointer whitespace-nowrap"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>এডমিন লগইন</span>
                </button>
              </div>

              <h2
                className="auth-anim text-2xl sm:text-[25px] font-extrabold text-center text-white tracking-tight mb-1"
                style={stagger(1)}
              >
                {isForgotPassword && isAdminActive ? 'Forget password' : 'এডমিন লগইন'}
              </h2>
              <p
                className="auth-anim text-[11px] text-center text-white/65 mb-4"
                style={stagger(1)}
              >
                {isForgotPassword && isAdminActive
                  ? 'ইউজার আইডি ও ইমেইল কনফার্ম করে পূর্বের পাসওয়ার্ড দেখুন'
                  : 'এডমিন ও সাব-এডমিন কন্ট্রোল প্যানেল'}
              </p>

              {isAdminActive && (
                <div className="auth-anim" style={stagger(2)}>
                  {renderErrorAlert()}
                </div>
              )}

              {isForgotPassword && isAdminActive ? (
                renderForgetPasswordPanel('admin')
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
                        className="auth-input-icon cursor-pointer hover:text-[#EAC471]"
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
                      onClick={() => openForgetPasswordView(adminEmail)}
                      className="text-[#EAC471] hover:text-[#C09663] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Forget password
                    </button>
                    <span className="text-white/50">ইমেইলে পূর্বের পাসওয়ার্ড</span>
                  </div>
                </>
              )}

              {devSetupMode && (
                <form
                  onSubmit={handleDeveloperSetup}
                  className="mt-3 space-y-2.5 border border-[#C09663]/60 rounded-xl p-3 bg-[#231F20]/80"
                >
                  <p className="text-[11px] font-bold text-[#EAC471]">
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
                    className="text-[#EAC471] hover:text-[#C09663] hover:underline font-bold cursor-pointer"
                  >
                    হাজী লগইন
                  </button>
                </p>

                <div className="pt-2.5 border-t border-white/12">
                  <button
                    type="button"
                    onClick={() => setViewMode('haji')}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-[#EAC471]/15 border border-[#C09663]/55 hover:border-[#EAC471] text-left transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Compass className="w-4 h-4 text-[#EAC471] shrink-0" />
                      <span className="text-[11px] font-bold text-white truncate">
                        Registration as &quot;A Haji&quot; (প্রাক-নিবন্ধন)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-[#EAC471] whitespace-nowrap shrink-0">
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
