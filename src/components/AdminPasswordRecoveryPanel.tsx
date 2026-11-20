import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  Trash2,
  LogOut,
  ShieldAlert,
  KeyRound,
  X
} from 'lucide-react';
import {
  subscribeGmailAuth,
  signInWithGmail,
  signOutGmail,
  getGmailAccessToken
} from '../lib/gmailAuth';
import { GoogleSignInButton } from './GoogleSignInButton';

export interface PasswordRecoveryRequestItem {
  id: string;
  userId: string;
  email: string;
  maskedEmail: string;
  accountName: string;
  accountType: 'haji' | 'admin' | 'sub_admin' | 'employee';
  roleLabel: string;
  requestedAt: string;
  status: 'pending' | 'sent';
  sentAt?: string;
  sentBy?: string;
}

interface AdminPasswordRecoveryPanelProps {
  adminEmailHint?: string;
  compactWhenEmpty?: boolean;
  onToast?: (msg: string) => void;
}

export const AdminPasswordRecoveryPanel: React.FC<AdminPasswordRecoveryPanelProps> = ({
  adminEmailHint,
  compactWhenEmpty = false,
  onToast
}) => {
  const [requests, setRequests] = useState<PasswordRecoveryRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gmailUser, setGmailUser] = useState<User | null>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mandatory explicit confirmation dialog before sending any Gmail message
  const [confirmSendItem, setConfirmSendItem] = useState<PasswordRecoveryRequestItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<PasswordRecoveryRequestItem | null>(null);

  useEffect(() => {
    return subscribeGmailAuth(
      (user, token) => {
        setGmailUser(user);
        setGmailToken(token);
      },
      () => {
        setGmailUser(null);
        setGmailToken(null);
      }
    );
  }, []);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/password-recovery-requests', { cache: 'no-store' });
      const data = await resp.json();
      if (resp.ok && data?.ok && Array.isArray(data.requests)) {
        setRequests(data.requests);
      }
    } catch {
      // ignore transient network errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleConnectGmail = async () => {
    setErrorMsg(null);
    setIsConnectingGmail(true);
    try {
      const res = await signInWithGmail(adminEmailHint);
      setGmailUser(res.user);
      setGmailToken(res.accessToken);
      onToast?.(`Gmail যুক্ত হয়েছে (${res.user.email || 'Connected'})`);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google সাইন ইন পপআপ বন্ধ করা হয়েছে। Gmail যুক্ত করতে পুনরায় চেষ্টা করুন।');
      } else {
        setErrorMsg('Gmail যুক্ত করতে সমস্যা হয়েছে। পপআপ ব্লক থাকলে অনুমতি দিয়ে আবার চেষ্টা করুন।');
      }
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = async () => {
    await signOutGmail();
    setGmailUser(null);
    setGmailToken(null);
    onToast?.('Gmail সংযোগ বিচ্ছিন্ন করা হয়েছে।');
  };

  const handleConfirmSendEmail = async () => {
    if (!confirmSendItem) return;
    const target = confirmSendItem;
    setConfirmSendItem(null);
    setErrorMsg(null);
    setSendingId(target.id);

    try {
      const token = gmailToken || getGmailAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const resp = await fetch(`/api/password-recovery-requests/${encodeURIComponent(target.id)}/send`, {
        method: 'POST',
        headers
      });
      const data = await resp.json();

      if (!resp.ok || !data?.ok) {
        if (resp.status === 401) {
          await signOutGmail();
        }
        setErrorMsg(data?.error || 'ইমেইল পাঠানো যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
        return;
      }

      onToast?.(`${target.accountName}-এর ইমেইল ইনবক্সে (${target.maskedEmail}) পূর্বের পাসওয়ার্ড পাঠানো হয়েছে!`);
      await loadRequests();
    } catch {
      setErrorMsg('সার্ভারের সাথে সংযোগে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setSendingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteItem) return;
    const target = confirmDeleteItem;
    setConfirmDeleteItem(null);
    try {
      const resp = await fetch(`/api/password-recovery-requests/${encodeURIComponent(target.id)}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== target.id));
        onToast?.('পাসওয়ার্ড রিকভারি অনুরোধ তালিকা থেকে সরানো হয়েছে।');
      }
    } catch {
      setErrorMsg('অনুরোধ মুছে ফেলতে সমস্যা হয়েছে।');
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (compactWhenEmpty && !isLoading && pendingCount === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#DCB473]/70 shadow-sm space-y-5">
      {/* Header + Gmail Connection Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-[#0f2922]">
                পাসওয়ার্ড রিকভারি ইমেইল অনুরোধ (Gmail ডিসপ্যাচ)
              </h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  pendingCount > 0
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {pendingCount} টি অপেক্ষমাণ
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              যেসব হাজী বা স্টাফ Forget password অনুরোধ পাঠিয়েছেন, আপনার Gmail যুক্ত করে এক ক্লিকে সরাসরি তাদের ইমেইল ইনবক্সে পূর্বের পাসওয়ার্ড পাঠাতে পারবেন।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {gmailUser && gmailToken ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-full pl-3 pr-1.5 py-1">
              <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-xs font-bold text-emerald-900 truncate max-w-[200px]">
                {gmailUser.email}
              </span>
              <button
                type="button"
                onClick={handleDisconnectGmail}
                className="p-1.5 rounded-full hover:bg-emerald-200/70 text-emerald-800 transition-colors cursor-pointer"
                title="Gmail সংযোগ বিচ্ছিন্ন করুন"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={handleConnectGmail}
              disabled={isConnectingGmail}
              label={isConnectingGmail ? 'সংযুক্ত হচ্ছে...' : 'Sign in with Google'}
            />
          )}

          <button
            type="button"
            onClick={loadRequests}
            disabled={isLoading}
            className="p-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
            title="তালিকা রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-xs text-stone-500">অনুরোধ লোড হচ্ছে...</div>
      ) : requests.length === 0 ? (
        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center">
          <p className="text-sm font-bold text-stone-700">কোনো পাসওয়ার্ড রিকভারি অনুরোধ নেই</p>
          <p className="text-xs text-stone-500 mt-1">
            কেউ Forget password থেকে অ্যাডমিনের মাধ্যমে ইমেইল পাঠানোর অনুরোধ করলে এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                req.status === 'pending'
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-emerald-200 bg-emerald-50/40'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-stone-900">{req.accountName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0f2922] text-[#DCB473]">
                    {req.roleLabel}
                  </span>
                  {req.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      <Clock className="w-3 h-3" />
                      অপেক্ষমাণ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      ইমেইলে পাঠানো হয়েছে
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span>
                    <strong>ইউজার আইডি:</strong>{' '}
                    <span className="font-mono text-stone-900">{req.userId}</span>
                  </span>
                  <span>
                    <strong>ইমেইল:</strong>{' '}
                    <span className="font-mono text-stone-900">{req.email}</span>
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  অনুরোধের সময়: {req.requestedAt}
                  {req.sentAt ? ` · পাঠানো হয়েছে: ${req.sentAt}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={sendingId === req.id}
                  onClick={() => {
                    if (!gmailToken) {
                      setErrorMsg(
                        'ইমেইল পাঠাতে প্রথমে উপরে "Sign in with Google" বাটনে ক্লিক করে আপনার সুপার অ্যাডমিন Gmail একাউন্ট যুক্ত করুন।'
                      );
                      return;
                    }
                    setConfirmSendItem(req);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0f2922] hover:bg-[#173f34] text-[#DCB473] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {sendingId === req.id
                      ? 'পাঠানো হচ্ছে...'
                      : req.status === 'sent'
                      ? 'আবার ইমেইলে পাঠান'
                      : 'Gmail দিয়ে ইনবক্সে পাঠান'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteItem(req)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="অনুরোধ মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandatory Explicit Confirmation Dialog for Sending Gmail */}
      {confirmSendItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCB473] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#0f2922]">ইমেইল পাঠানোর নিশ্চিতকরণ</h4>
                <p className="text-xs text-stone-500">Gmail-এর মাধ্যমে সরাসরি ইনবক্সে ডেলিভারি</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1.5 leading-relaxed">
              <p>
                আপনি কি আপনার যুক্ত Gmail (
                <strong className="font-mono text-[#0f2922]">{gmailUser?.email}</strong>) থেকে{' '}
                <strong>{confirmSendItem.accountName}</strong>-এর নিবন্ধিত ইমেইল (
                <strong className="font-mono text-[#0f2922]">{confirmSendItem.email}</strong>)-এ
                তাঁর পূর্বের পাসওয়ার্ডের বার্তা পাঠাতে চান?
              </p>
              <p className="text-[11px] text-stone-500">
                পাসওয়ার্ডটি স্ক্রিনে দেখানো হবে না—সার্ভার থেকে সরাসরি প্রাপকের ইমেইল ইনবক্সে চলে যাবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmSendItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmSendEmail}
                className="px-4 py-2 rounded-xl bg-[#0f2922] hover:bg-[#173f34] text-[#DCB473] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>হ্যাঁ, ইমেইলে পাঠান</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting a Recovery Request */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <h4 className="font-bold text-base text-stone-900">অনুরোধটি মুছে ফেলবেন?</h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              <strong>{confirmDeleteItem.accountName}</strong> ({confirmDeleteItem.email})-এর
              পাসওয়ার্ড রিকভারি অনুরোধটি তালিকা থেকে স্থায়ীভাবে সরানো হবে।
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
