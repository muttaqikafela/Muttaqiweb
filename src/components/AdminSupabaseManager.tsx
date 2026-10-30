import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  Server,
  ShieldCheck,
  Check,
  Layers,
  Users,
  DollarSign,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { SUPABASE_PROJECT_ID, SUPABASE_URL } from '../lib/supabase';

export const AdminSupabaseManager: React.FC = () => {
  const {
    supabaseStatus,
    syncAllWithSupabase,
    refreshFromSupabase,
    supabaseSchemaSql,
    inquiries,
    pricingConfig,
    contactMessages,
    reviews,
    showToast
  } = useAdmin();

  const [isCopied, setIsCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSchemaSql);
    setIsCopied(true);
    showToast('SQL স্ক্রিপ্ট ক্লিপবোর্ডে কপি করা হয়েছে!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncAllWithSupabase();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromSupabase();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-semibold text-emerald-300">
              <Database className="w-3.5 h-3.5" />
              <span>ক্লাউড ডাটাবেজ ইন্টিগ্রেশন (PostgreSQL)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-amber-300">
              Supabase ডাটা স্টোরেজ কানেকশন
            </h2>
            <p className="text-emerald-100/90 text-sm max-w-2xl leading-relaxed">
              আপনার কাফেলার নতুন ও সম্পাদিত সকল ডাটা (হাজী রেজিস্ট্রেশন, মূল্য নির্ধারণ, ডিসকাউন্ট, বার্তা ও রিভিউ) সরাসরি আপনার Supabase ক্লাউড ডাটাবেজে স্বয়ংক্রিয়ভাবে সংরক্ষিত হচ্ছে।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-slate-950 font-bold rounded-xl shadow-lg transition duration-200 cursor-pointer"
            >
              <UploadCloud className={`w-5 h-5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'সব ডাটা ক্লাউডে পাঠান'}</span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl transition duration-200 cursor-pointer"
            >
              <DownloadCloud className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'রিফ্রেশ হচ্ছে...' : 'ক্লাউড থেকে রিলোড'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Connection Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">কানেকশন স্ট্যাটাস</h3>
                <p className="text-xs text-slate-500">Supabase ক্লায়েন্ট লাইভ সংযোগ</p>
              </div>
            </div>
            {supabaseStatus.isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                সংযুক্ত
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                সংযোগ চেক হচ্ছে
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Project ID:</span>
              <span className="font-mono font-semibold text-slate-800">{SUPABASE_PROJECT_ID}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">প্রজেক্ট লিঙ্ক:</span>
              <span className="font-mono text-xs text-emerald-700 truncate max-w-[180px]">
                {SUPABASE_URL}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">সর্বশেষ সিঙ্ক:</span>
              <span className="text-slate-700 font-medium">
                {supabaseStatus.lastSyncTime || 'এখনই সক্রিয়'}
              </span>
            </div>
          </div>
        </div>

        {/* Data Sync Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">সিঙ্কযোগ্য রেকর্ড সংখ্যা</h3>
              <p className="text-xs text-slate-500">লাইভ ডাটাবেজ কাউন্ট</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>হাজী আবেদন:</span>
              </div>
              <div className="text-lg font-bold text-slate-800">{inquiries.length} জন</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>প্যাকেজ রেট:</span>
              </div>
              <div className="text-lg font-bold text-slate-800">
                {pricingConfig.packages.length +
                  pricingConfig.rooms.length +
                  pricingConfig.airfares.length +
                  pricingConfig.incidentals.length}{' '}
                টি
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                <span>বার্তা সমূহ:</span>
              </div>
              <div className="text-lg font-bold text-slate-800">{contactMessages.length} টি</div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>রিভিউ:</span>
              </div>
              <div className="text-lg font-bold text-slate-800">{reviews.length} টি</div>
            </div>
          </div>
        </div>

        {/* Security & RLS Policy */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">ক্লাউড সুরক্ষা ও নিরাপত্তা</h3>
                <p className="text-xs text-slate-500">Row Level Security (RLS)</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              সরাসরি Supabase-এর শপিং-গ্রেড PostgreSQL ক্লাস্টার ব্যবহার করা হচ্ছে। আপনার পাবলিশেবল এপিআই কি দিয়ে নিরাপদে এনক্রিপ্টেড TLS 1.3 এর মাধ্যমে ডাটা ট্রান্সফার সম্পন্ন হয়।
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>TLS এনক্রিপশন সক্রিয়</span>
            </span>
            <span className="text-slate-400">PostgreSQL 15</span>
          </div>
        </div>
      </div>

      {/* SQL Setup Instructions & Code Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">
                Supabase ডাটাবেজ টেবিল সেটআপ (SQL Schema)
              </h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                একবার রান করলেই যথেষ্ট
              </span>
            </div>
            <p className="text-xs text-slate-600">
              আপনার Supabase অ্যাকাউন্টে টেবিলগুলো তৈরি করতে নিচের SQL স্ক্রিপ্টটি কপি করে Supabase SQL Editor-এ রান করুন।
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition duration-150 cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'কপি হয়েছে!' : 'SQL কোড কপি করুন'}</span>
            </button>

            <a
              href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm transition duration-150"
            >
              <span>Supabase SQL Editor খুলুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Step-by-step Quick Guide */}
        <div className="p-6 bg-amber-50/50 border-b border-amber-200/60">
          <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>সহজ ৩-ধাপের নির্দেশিকা:</span>
          </h4>
          <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside">
            <li>
              উপরে <strong>"SQL কোড কপি করুন"</strong> বাটনে ক্লিক করুন।
            </li>
            <li>
              <strong>"Supabase SQL Editor খুলুন"</strong> বাটনে ক্লিক করে আপনার Supabase প্রোজেক্টের নতুন কোয়েরি এডিটরে যান।
            </li>
            <li>
              কপি করা কোডটি পেস্ট করে নিচের সবুজ <strong>"RUN"</strong> বাটনে চাপুন। সাথে সাথে আপনার প্রজেক্টের সমস্ত টেবিল প্রস্তুত হয়ে যাবে!
            </li>
          </ol>
        </div>

        {/* Code Block Container */}
        <div className="relative bg-slate-950 p-4 overflow-x-auto max-h-[380px]">
          <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre">
            {supabaseSchemaSql}
          </pre>
        </div>
      </div>
    </div>
  );
};
