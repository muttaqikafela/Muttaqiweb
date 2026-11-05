import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { SubAdminUser, SubAdminModuleRole } from '../types';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Mail,
  User,
  Phone,
  CheckCircle2,
  X,
  AlertCircle,
  ShieldAlert,
  Info,
  Sparkles,
  CheckSquare,
  Square,
  SlidersHorizontal
} from 'lucide-react';

export const AdminSubAdminManager: React.FC = () => {
  const {
    subAdmins,
    registerSubAdmin,
    updateSubAdmin,
    deleteSubAdmin,
    requestConfirm,
    showToast,
    isSubAdmin,
    activeSubAdmin
  } = useAdmin();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdminUser | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Form State
  const [formData, setFormData] = useState<{
    englishName: string;
    username: string;
    email: string;
    password: string;
    phone: string;
    permissions: string[];
    moduleRoles: Record<string, SubAdminModuleRole>;
  }>({
    englishName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    permissions: ['approvals', 'finance', 'haji-registrations'],
    moduleRoles: {
      'approvals': 'editor',
      'finance': 'editor',
      'haji-registrations': 'editor'
    }
  });
  const [formError, setFormError] = useState('');

  const AVAILABLE_ACCESS_OPTIONS = [
    { id: 'approvals', label: 'অনুমোদন কেন্দ্র (আবেদন অনুমোদন ও ট্র্যাকিং)' },
    { id: 'finance', label: 'হজ ও ওমরাহ্ আয়-ব্যয় (সার্বিক লেজার ও ব্যালেন্স শিট)' },
    { id: 'haji-registrations', label: 'হাজী নিবন্ধন ও কাফেলা গ্রুপ' },
    { id: 'notices', label: 'নোটিশ বোর্ড ও জরুরি বিজ্ঞপ্তি' },
    { id: 'pricing', label: 'মূল্য নির্ধারণ (প্যাকেজ, রুম, বিমান, খরচ)' },
    { id: 'services', label: 'সেবাসমূহ ও প্যাকেজ বিবরণ' },
    { id: 'gallery', label: 'ফটো ও ভিডিও গ্যালারি' },
    { id: 'team', label: 'পরিচালনা পর্ষদ ও মোয়াল্লিম টিম' },
    { id: 'reviews', label: 'মতামত ও রিভিউ' },
    { id: 'prayers', label: 'নামাজের সময়সূচি' },
    { id: 'stats', label: 'পরিসংখ্যান ও রেকর্ড' },
    { id: 'general', label: 'সাধারণ প্রতিষ্ঠান সেটিংস' }
  ];

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      showToast(`${label} ক্লিপবোর্ডে কপি করা হয়েছে!`);
    } catch {
      showToast(`${label}: ${text}`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSubAdmin(null);
    const nextNum = subAdmins.length + 1;
    const defaultPerms = ['approvals', 'finance', 'haji-registrations'];
    setFormData({
      englishName: '',
      username: `subadmin${nextNum}`,
      email: '',
      password: 'Password123!',
      phone: '',
      permissions: defaultPerms,
      moduleRoles: {
        'approvals': 'editor',
        'finance': 'editor',
        'haji-registrations': 'editor'
      }
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (sub: SubAdminUser) => {
    setEditingSubAdmin(sub);
    const perms = sub.permissions && sub.permissions.length > 0 ? sub.permissions : ['approvals', 'finance', 'haji-registrations'];
    const roles: Record<string, SubAdminModuleRole> = {};
    perms.forEach((p) => {
      roles[p] = sub.moduleRoles?.[p] || 'editor';
    });
    setFormData({
      englishName: sub.englishName,
      username: sub.username || sub.email.split('@')[0],
      email: sub.email,
      password: sub.password || '',
      phone: sub.phone || '',
      permissions: perms,
      moduleRoles: roles
    });
    setFormError('');
    setModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
  };

  const handlePresetChange = (preset: string) => {
    if (preset === 'all') {
      setFormData((prev) => ({
        ...prev,
        permissions: AVAILABLE_ACCESS_OPTIONS.map((a) => a.id)
      }));
    } else if (preset === 'approvals-haji') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['approvals', 'haji-registrations', 'notices']
      }));
    } else if (preset === 'finance') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['finance', 'pricing', 'stats']
      }));
    } else if (preset === 'content') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['services', 'gallery', 'team', 'reviews', 'notices', 'prayers']
      }));
    } else if (preset === 'minimal') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['approvals']
      }));
    }
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      if (exists) {
        if (prev.permissions.length === 1) {
          showToast('কমপক্ষে ১টি সেকশনের অনুমতি থাকতে হবে');
          return prev;
        }
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => p !== permId)
        };
      } else {
        return {
          ...prev,
          permissions: [...prev.permissions, permId]
        };
      }
    });
  };

  const selectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: AVAILABLE_ACCESS_OPTIONS.map((a) => a.id)
    }));
  };

  const clearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: ['approvals']
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanName = formData.englishName.trim();
    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '.');
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPass = formData.password.trim();

    if (!cleanName) {
      setFormError('অনুগ্রহ করে সাব-এডমিনের নাম (English Name) লিখুন।');
      return;
    }

    if (!cleanUsername) {
      setFormError('অনুগ্রহ করে একটি ইউনিক ইউজার আইডি (Username) দিন।');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('সঠিক ইমেইল ঠিকানা দিন।');
      return;
    }

    if (!cleanPass || cleanPass.length < 6) {
      setFormError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    // Check duplicate username or email (excluding current when editing)
    const duplicate = subAdmins.find(
      (s) =>
        s.id !== editingSubAdmin?.id &&
        (s.email.toLowerCase() === cleanEmail ||
          (s.username && s.username.toLowerCase() === cleanUsername))
    );

    if (duplicate) {
      setFormError('এই ইমেইল বা ইউজার আইডিটি ইতিমধ্যে অন্য একজন সাব-এডমিনের জন্য ব্যবহৃত হয়েছে।');
      return;
    }

    if (editingSubAdmin) {
      updateSubAdmin({
        ...editingSubAdmin,
        englishName: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: editingSubAdmin.isPasswordChanged ? editingSubAdmin.password : cleanPass,
        phone: formData.phone.trim() || undefined,
        permissions: formData.permissions,
        moduleRoles: formData.moduleRoles
      });
    } else {
      registerSubAdmin({
        englishName: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPass,
        phone: formData.phone.trim() || undefined,
        permissions: formData.permissions,
        moduleRoles: formData.moduleRoles
      });
    }

    setModalOpen(false);
  };

  const handleDelete = (sub: SubAdminUser) => {
    requestConfirm({
      title: 'সাব-এডমিন একাউন্ট মুছে ফেলা',
      message: `আপনি কি নিশ্চিতভাবে সাব-এডমিন "${sub.englishName}" (${sub.username || sub.email}) এর একাউন্টটি মুছে ফেলতে চান? এর পর থেকে তিনি আর লগইন করতে পারবেন না।`,
      confirmText: 'হ্যাঁ, মুছে ফেলুন',
      onConfirm: () => {
        deleteSubAdmin(sub.id);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2922] via-[#153e33] to-[#0f2922] text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#DCB473]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DCB473] bg-[#DCB473]/20 px-3 py-1 rounded-full border border-[#DCB473]/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#DCB473]" />
                সাব-এডমিন ম্যানেজমেন্ট ও অ্যাক্সেস কন্ট্রোল
              </span>
              <span className="text-xs font-bold text-amber-200 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-400/40">
                রিড-অনলি মোড (Viewer Only)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
              <UserCheck className="w-7 h-7 text-[#DCB473]" />
              <span>সাব-এডমিন একাউন্ট ও পারমিশন নিয়ন্ত্রণ</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              সুপার এডমিন তার ইচ্ছামত একাধিক সাব-এডমিন তৈরি করতে পারবেন। সাব-এডমিন তাদের ইউজার আইডি ও পাসওয়ার্ড দিয়ে লগইন করলে ওয়েবসাইটের সকল কিছুই দেখতে পারবেন কিন্তু তথ্য এডিট, অনুমোদন (Approve) বা ডিলিট করতে পারবেন না।
            </p>
          </div>

          {/* Quick Counter Cards & Add Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 px-5 rounded-2xl border border-white/10 text-center">
              <span className="text-xs text-stone-300 block">মোট সাব-এডমিন</span>
              <span className="text-2xl font-bold text-white font-mono">{subAdmins.length}</span>
            </div>

            {!isSubAdmin && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-5 py-3.5 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>+ নতুন সাব-এডমিন তৈরি করুন</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sub-Admin Warning if Logged In as Sub-Admin */}
      {isSubAdmin && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl text-amber-900 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-amber-950 block text-sm">
              আপনার রোল: সাব-এডমিন (Read-Only Viewer)
            </span>
            <p className="leading-relaxed">
              আপনি বর্তমানে সাব-এডমিন একাউন্ট (<strong>{activeSubAdmin?.englishName}</strong>) দিয়ে লগইন আছেন। নীতিমালার অনুযায়ী আপনি ওয়েবসাইটের সকল তথ্য দেখতে পারবেন, কিন্তু নতুন সাব-এডমিন তৈরি, পাসওয়ার্ড পরিবর্তন বা ডিলিট করার অধিকার শুধুমাত্র মূল সুপার এডমিনের।
            </p>
          </div>
        </div>
      )}

      {/* 3. Sub-Admin Role & Permission Rules Summary Card */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <Info className="w-4 h-4 text-purple-700" />
          <h3 className="text-xs sm:text-sm font-bold text-[#0f2922]">
            সাব-এডমিন পারমিশন পলিসি (Role-Based Access Matrix):
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>সাব-এডমিন যা যা দেখতে পারবেন (অনুমোদিত):</span>
            </div>
            <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
              <li>ওয়েবসাইটের সকল পৃষ্ঠা, সেবা ও প্যাকেজ বিবরণী দেখা</li>
              <li>হাজী নিবন্ধন ফর্ম থেকে জমাকৃত সকল আবেদন ও ডকুমেন্ট জুম করে দেখা</li>
              <li>হাজীদের পাসপোর্ট, NID, পিতা-মাতার নাম ও যোগাযোগের বিস্তারিত দেখা</li>
              <li>হজ ও ওমরাহ্ আয়-ব্যয় এবং হজযাত্রী ভিত্তিক আর্থিক লেজার দেখা</li>
              <li>হাজী ভাউচার স্লিপ ও প্রত্যয়ন সরাসরি প্রিন্ট করা</li>
              <li>গ্রুপভিত্তিক হজযাত্রী আসন সংখ্যা ও মোয়াল্লিম তালিকা দেখা</li>
            </ul>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-rose-900 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-700" />
              <span>সাব-এডমিন যা যা করতে পারবেন না (নিষিদ্ধ / সংরক্ষিত):</span>
            </div>
            <ul className="text-[11px] text-rose-800 space-y-1 list-disc list-inside">
              <li>কোনো হাজীর আবেদন অনুমোদন (Approve) বা বাতিল করা নিষেধ</li>
              <li>হাজীর নিবন্ধন তথ্য এডিট (Edit) বা মুছে ফেলা (Delete) নিষেধ</li>
              <li>মূল্য নির্ধারণ বা হাজীকে কোনো বিশেষ ছাড় (%) দেওয়া নিষেধ</li>
              <li>কোনো আর্থিক হিসাব, পেমেন্ট ভাউচার বা খরচ এডিট/মুছে ফেলা নিষেধ</li>
              <li>নতুন গ্রুপ যোগ করা বা মোয়াল্লিম পরিবর্তন নিষেধ</li>
              <li>অন্য কোনো সাব-এডমিন তৈরি বা পরিবর্তন করার ক্ষমতা নেই</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Sub-Admins List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f2922] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#b88e44]" />
            <span>সক্রিয় সাব-এডমিন তালিকা ({subAdmins.length} জন)</span>
          </h3>
          <span className="text-[11px] text-stone-500">
            লগইনের জন্য ইউজার আইডি বা ইমেইল এবং পাসওয়ার্ড ব্যবহার করা যাবে
          </span>
        </div>

        {subAdmins.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-xs">
            <UserCheck className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-stone-700">কোনো সাব-এডমিন পাওয়া যায়নি</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              উপরে "+ নতুন সাব-এডমিন তৈরি করুন" বাটনে ক্লিক করে আপনার ইচ্ছামত যেকোনো সাব-এডমিন যোগ করতে পারেন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subAdmins.map((sub) => {
              const isPasswordVisible = !!showPasswordMap[sub.id];
              const displayUsername = sub.username || sub.email.split('@')[0];

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-3xl p-5 border-2 border-stone-200 hover:border-purple-300 transition-all shadow-xs space-y-3.5 relative overflow-hidden"
                >
                  {/* Top Bar with Name & Status */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-base shadow-2xs">
                        <User className="w-6 h-6 text-purple-700" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-[#0f2922]">{sub.englishName}</h4>
                          <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                            সাব-এডমিন (ভিউয়ার)
                          </span>
                        </div>
                        <span className="text-xs text-stone-500">
                          তৈরি: {sub.createdAt || '২০২৬-১০-২০'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        সক্রিয়
                      </span>
                    </div>
                  </div>

                  {/* Credentials Grid */}
                  <div className="bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200 space-y-2 text-xs">
                    {/* Username / User ID */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        ইউজার আইডি (User ID):
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-[#0f2922] bg-white px-2 py-0.5 rounded border border-stone-200 shadow-2xs">
                          {displayUsername}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(displayUsername, 'ইউজার আইডি')}
                          className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                          title="ইউজার আইডি কপি করুন"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        ইমেইল (Email):
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200 text-[11px]">
                          {sub.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(sub.email, 'ইমেইল')}
                          className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                          title="ইমেইল কপি করুন"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                        পাসওয়ার্ড (Password):
                      </span>
                      <div className="flex items-center gap-1">
                        {sub.isPasswordChanged ? (
                          <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>•••••••• [গোপনীয় - সাব-এডমিন কর্তৃক পরিবর্তিত]</span>
                          </span>
                        ) : (
                          <>
                            <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                              {isPasswordVisible ? (sub.initialPassword || sub.password || '••••••') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(sub.id)}
                              className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                              title={isPasswordVisible ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                            >
                              {isPasswordVisible ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(sub.initialPassword || sub.password || '', 'প্রাথমিক পাসওয়ার্ড')}
                              className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                              title="পাসওয়ার্ড কপি করুন"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Mobile Phone */}
                    {sub.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 font-medium flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          মোবাইল:
                        </span>
                        <span className="font-mono text-stone-700">{sub.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Assigned Permissions & Role Badges */}
                  <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-purple-950 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                        অনুমোদিত মডিউল ও রোল ({sub.permissions?.length || AVAILABLE_ACCESS_OPTIONS.length}টি):
                      </span>
                      <span className="text-[10px] text-purple-600 font-medium">
                        {(sub.permissions?.length || AVAILABLE_ACCESS_OPTIONS.length) === AVAILABLE_ACCESS_OPTIONS.length ? 'সকল মডিউল' : 'নির্দিষ্ট মডিউল'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(sub.permissions && sub.permissions.length > 0
                        ? sub.permissions
                        : AVAILABLE_ACCESS_OPTIONS.map((a) => a.id)
                      ).map((permId) => {
                        const opt = AVAILABLE_ACCESS_OPTIONS.find((a) => a.id === permId);
                        if (!opt) return null;
                        const shortName = opt.label.split(' (')[0];
                        const role = sub.moduleRoles?.[permId] || 'editor';
                        const roleLabel =
                          role === 'editor'
                            ? 'এডিটর'
                            : role === 'contributor'
                            ? 'তথ্য সংযোজক'
                            : 'শুধু ভিউয়ার';
                        const roleBadgeColor =
                          role === 'editor'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : role === 'contributor'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-100 text-stone-700 border-stone-200';

                        return (
                          <div
                            key={permId}
                            className="text-[10px] bg-white text-purple-950 border border-purple-200 px-2 py-0.5 rounded-lg shadow-2xs flex items-center gap-1"
                          >
                            <span className="font-medium">{shortName}</span>
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded border ${roleBadgeColor}`}>
                              {roleLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Super Admin Action Buttons */}
                  {!isSubAdmin && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(sub)}
                        className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>তথ্য / পাসওয়ার্ড এডিট</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sub)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ডিলিট</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ADD / EDIT SUB-ADMIN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative border-2 border-purple-300 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-4 space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                সাব-এডমিন একাউন্ট ফরম
              </span>
              <h3 className="text-xl font-bold text-[#0f2922]">
                {editingSubAdmin ? `"${editingSubAdmin.englishName}" এর তথ্য পরিবর্তন` : 'নতুন সাব-এডমিন তৈরি করুন'}
              </h3>
              <p className="text-xs text-stone-500">
                এই একাউন্টটি ব্যবহার করে সাব-এডমিন ওয়েবসাইটে লগইন করতে পারবেন। তিনি সকল তথ্য দেখতে পাবেন কিন্তু এডিট, অ্যাপ্রুফ বা ডিলিট করতে পারবেন না।
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  সাব-এডমিনের পূর্ণ নাম (English Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.englishName}
                  onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                  placeholder="e.g. Md. Tariqul Islam"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    ইউজার আইডি (User ID / Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '.')
                      })
                    }
                    placeholder="e.g. subadmin.tariqul"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    লগইনের সময় ইউজার আইডি ব্যবহারযোগ্য
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    ইমেইল এড্রেস (Email Address) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. tariqul@muttaqi.com"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  {editingSubAdmin?.isPasswordChanged ? (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>পাসওয়ার্ড সুরক্ষিত (গোপনীয়)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        এই সাব-এডমিন নিজে তার পাসওয়ার্ড পরিবর্তন করেছেন। সিস্টেম নিরাপত্তা ও ব্যবহারকারীর গোপনীয়তা রক্ষা নীতি অনুসারে এডমিন এটি দেখতে বা পরিবর্তন করতে পারবেন না।
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-stone-700">
                          লগইন পাসওয়ার্ড *
                        </label>
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          অটো জেনারেট
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold text-emerald-800"
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        শুরুতে এই পাসওয়ার্ড দিয়ে সাব-এডমিন লগইন করবেন এবং পরবর্তীতে নিজে পরিবর্তন করতে পারবেন
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    মোবাইল নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Permission & Access Matrix Section */}
              <div className="pt-2 border-t border-stone-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-stone-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-700" />
                      মডিউল এক্সেস ও রোল নির্বাচন (Access & Role Matrix) *
                    </label>
                    <span className="text-[11px] text-stone-500 block">
                      সাব-এডমিন কেবল নির্বাচিত মডিউল দেখতে পারবেন এবং প্রতিটি মডিউলে তার নির্দিষ্ট দায়িত্ব (এডিটর, তথ্য সংযোজক, শুধু ভিউয়ার) নির্ধারণ করুন:
                    </span>
                  </div>

                  {/* Dropdown Preset Selector */}
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <select
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="text-xs bg-purple-50 border border-purple-300 text-purple-900 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>-- দ্রুত অ্যাক্সেস ড্রপডাউন --</option>
                      <option value="all">সকল সেকশন (Full Access - ১২টি)</option>
                      <option value="approvals-haji">অনুমোদন ও হাজী নিবন্ধন</option>
                      <option value="finance">হজ ও ওমরাহ্ হিসাব ও আয়-ব্যয়</option>
                      <option value="content">ওয়েবসাইট কনটেন্ট ও নোটিশ</option>
                      <option value="minimal">ন্যূনতম (শুধু অনুমোদন কেন্দ্র)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-stone-500">মডিউল চালু করতে টিক দিন এবং পাশে রোল নির্বাচন করুন:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-purple-700 font-bold hover:underline cursor-pointer"
                    >
                      সব নির্বাচন
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-stone-500 font-medium hover:underline cursor-pointer"
                    >
                      রিসেট
                    </button>
                  </div>
                </div>

                {/* 12 Access Option Pills/Checkboxes with granular role selector */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 border border-stone-200 rounded-2xl p-2.5 bg-stone-50/60">
                  {AVAILABLE_ACCESS_OPTIONS.map((item) => {
                    const isChecked = formData.permissions.includes(item.id);
                    const currentRole = formData.moduleRoles[item.id] || 'editor';

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-purple-50/80 border-purple-300 shadow-2xs'
                            : 'bg-white border-stone-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => togglePermission(item.id)}
                            className="flex items-start gap-2 text-left cursor-pointer flex-1"
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-purple-700" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-stone-800">{item.label}</p>
                              <span className="text-[10px] text-stone-400 font-mono">id: {item.id}</span>
                            </div>
                          </button>

                          {/* Role Selector when module is checked */}
                          {isChecked && (
                            <div className="flex items-center gap-1 shrink-0 bg-white p-1 rounded-lg border border-purple-200">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    moduleRoles: { ...prev.moduleRoles, [item.id]: 'editor' }
                                  }))
                                }
                                title="এডিটর: শুধু এডিট করতে পারবে কিন্তু ডিলিট করতে পারবেনা, সাবমিট করার পর পেন্ডিং থাকবে যা এডমিন এপ্রুভ করবে"
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  currentRole === 'editor'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-stone-600 hover:bg-stone-100'
                                }`}
                              >
                                এডিটর
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    moduleRoles: { ...prev.moduleRoles, [item.id]: 'contributor' }
                                  }))
                                }
                                title="তথ্য সংযোজক: শুধু তথ্য যোগ করে সাবমিট করবে এবং সেটি এডমিন এপ্রুভ করবে"
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  currentRole === 'contributor'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-stone-600 hover:bg-stone-100'
                                }`}
                              >
                                তথ্য সংযোজক
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    moduleRoles: { ...prev.moduleRoles, [item.id]: 'viewer' }
                                  }))
                                }
                                title="শুধু ভিউয়ার: শুধুমাত্র দেখতে পারবে"
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  currentRole === 'viewer'
                                    ? 'bg-stone-700 text-white shadow-xs'
                                    : 'text-stone-600 hover:bg-stone-100'
                                }`}
                              >
                                শুধু ভিউয়ার
                              </button>
                            </div>
                          )}
                        </div>

                        {isChecked && (
                          <div className="mt-1.5 pt-1.5 border-t border-purple-200/60 pl-6 text-[10px] text-purple-900">
                            {currentRole === 'editor' && (
                              <span className="text-blue-900">
                                ✎ <strong>এডিটর রোল:</strong> এই মডিউলের বিদ্যমান তথ্য এডিট করতে পারবে কিন্তু ডিলিট করতে পারবে না। সাবমিট করার পর তথ্য পেন্ডিং থাকবে যা এডমিন এপ্রুভ করবে।
                              </span>
                            )}
                            {currentRole === 'contributor' && (
                              <span className="text-emerald-900">
                                ＋ <strong>তথ্য সংযোজক রোল:</strong> এই মডিউলে শুধুমাত্র নতুন তথ্য যোগ করে সাবমিট করতে পারবে (এডিট বা ডিলিট নয়)। যোগকৃত তথ্য এডমিন এপ্রুভ করবেন।
                              </span>
                            )}
                            {currentRole === 'viewer' && (
                              <span className="text-stone-600">
                                👁 <strong>শুধু ভিউয়ার রোল:</strong> শুধুমাত্র তথ্য ও প্রতিবেদন দেখতে পারবে; কোনো যোগ, এডিট বা ডিলিট করতে পারবে না।
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Permission Matrix Highlight Box */}
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-[11px] text-purple-950 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                    সাব-এডমিন এক্সেস নীতি:
                  </span>
                  <p className="leading-snug text-purple-900/90">
                    সাব-এডমিনকে যে যে এক্সেস দেওয়া থাকবে, সাব-এডমিন কেবল মাত্র সেই সেই অপশন দেখতে পারবে এবং পাশের রোল (এডিটর, তথ্য সংযোজক, শুধু ভিউয়ার) অনুযায়ী কার্যক্রম পরিচালনা করতে পারবে।
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingSubAdmin ? 'আপডেট সংরক্ষণ' : 'সাব-এডমিন একাউন্ট তৈরি করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
