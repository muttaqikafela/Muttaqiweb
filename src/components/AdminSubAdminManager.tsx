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
  SlidersHorizontal,
  Briefcase,
  Check
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
    isEmployee,
    activeSubAdmin
  } = useAdmin();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdminUser | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [roleFilter, setRoleFilter] = useState<'all' | 'sub_admin' | 'employee'>('all');

  // Form State
  const [formData, setFormData] = useState<{
    role: 'sub_admin' | 'employee';
    englishName: string;
    username: string;
    designation: string;
    email: string;
    password: string;
    phone: string;
    permissions: string[];
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    moduleRoles: Record<string, SubAdminModuleRole>;
  }>({
    role: 'sub_admin',
    englishName: '',
    username: '',
    designation: '',
    email: '',
    password: '',
    phone: '',
    permissions: ['approvals', 'finance', 'haji-registrations'],
    canAdd: true,
    canEdit: true,
    canDelete: false,
    moduleRoles: {
      'approvals': 'editor',
      'finance': 'editor',
      'haji-registrations': 'editor'
    }
  });
  const [formError, setFormError] = useState('');

  const AVAILABLE_ACCESS_OPTIONS = [
    { id: 'haji-registrations', label: 'হাজী নিবন্ধন ও কাফেলা গ্রুপ (Haji Registration & Kafela Groups)' },
    { id: 'finance', label: 'হজ ও ওমরাহ্ আয়-ব্যয় (Financial Ledger & Office Accounts)' },
    { id: 'approvals', label: 'অনুমোদন কেন্দ্র (Application & Modification Approvals)' },
    { id: 'notices', label: 'নোটিশ বোর্ড ও জরুরি বিজ্ঞপ্তি (Notice Board)' },
    { id: 'pricing', label: 'মূল্য নির্ধারণ (প্যাকেজ, রুম, বিমান, খরচ)' },
    { id: 'services', label: 'সেবাসমূহ ও প্যাকেজ বিবরণ (Services)' },
    { id: 'gallery', label: 'ফটো ও ভিডিও গ্যালারি (Gallery)' },
    { id: 'team', label: 'পরিচালনা পর্ষদ ও মোয়াল্লিম টিম (Team)' },
    { id: 'reviews', label: 'মতামত ও রিভিউ (Reviews)' },
    { id: 'prayers', label: 'নামাজের সময়সূচি (Prayer Times)' },
    { id: 'stats', label: 'পরিসংখ্যান ও রেকর্ড (Stats)' },
    { id: 'general', label: 'সাধারণ প্রতিষ্ঠান সেটিংস (General Settings)' }
  ];

  const subAdminCount = subAdmins.filter((s) => s.role !== 'employee').length;
  const employeeCount = subAdmins.filter((s) => s.role === 'employee').length;

  const filteredStaffList = subAdmins.filter((s) => {
    if (roleFilter === 'sub_admin') return s.role !== 'employee';
    if (roleFilter === 'employee') return s.role === 'employee';
    return true;
  });

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

  const handleOpenAddModal = (role: 'sub_admin' | 'employee' = 'sub_admin') => {
    setEditingSubAdmin(null);
    const countThisRole = subAdmins.filter((s) => (role === 'employee' ? s.role === 'employee' : s.role !== 'employee')).length + 1;
    const isEmp = role === 'employee';
    const defaultPerms = isEmp
      ? ['haji-registrations', 'finance', 'notices']
      : ['approvals', 'finance', 'haji-registrations'];

    setFormData({
      role,
      englishName: '',
      username: isEmp ? `emp${countThisRole}` : `subadmin${countThisRole}`,
      designation: isEmp ? 'অফিস সহকারী ও ডাটা অপারেটর' : 'সাব-এডমিন',
      email: isEmp ? `emp${countThisRole}@muttaqi.kafela` : '',
      password: 'Password123!',
      phone: '',
      permissions: defaultPerms,
      canAdd: true,
      canEdit: true,
      canDelete: isEmp, // Employees can edit, add, and delete in permitted options
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
    const perms = sub.permissions && sub.permissions.length > 0 ? sub.permissions : ['haji-registrations'];
    const roles: Record<string, SubAdminModuleRole> = {};
    perms.forEach((p) => {
      roles[p] = sub.moduleRoles?.[p] || 'editor';
    });

    setFormData({
      role: sub.role || 'sub_admin',
      englishName: sub.englishName,
      username: sub.username || sub.email.split('@')[0],
      designation: sub.designation || (sub.role === 'employee' ? 'কর্মচারী' : 'সাব-এডমিন'),
      email: sub.email,
      password: sub.password || '',
      phone: sub.phone || '',
      permissions: perms,
      canAdd: sub.canAdd !== undefined ? sub.canAdd : true,
      canEdit: sub.canEdit !== undefined ? sub.canEdit : true,
      canDelete: sub.canDelete !== undefined ? sub.canDelete : (sub.role === 'employee'),
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
    } else if (preset === 'haji-only') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['haji-registrations']
      }));
    } else if (preset === 'haji-finance') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['haji-registrations', 'finance']
      }));
    } else if (preset === 'finance-only') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['finance', 'pricing', 'stats']
      }));
    } else if (preset === 'content') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['services', 'gallery', 'team', 'reviews', 'notices', 'prayers']
      }));
    } else if (preset === 'approvals') {
      setFormData((prev) => ({
        ...prev,
        permissions: ['approvals', 'haji-registrations', 'finance']
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
      permissions: ['haji-registrations']
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
      setFormError('অনুগ্রহ করে পূর্ণ নাম (Full Name) লিখুন।');
      return;
    }

    if (!cleanUsername) {
      setFormError('অনুগ্রহ করে একটি ইউনিক ইউজার আইডি (Username) দিন।');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('সঠিক ইমেইল ঠিকানা দিন (লগইন বা নোটিফিকেশনের জন্য)।');
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
      setFormError('এই ইমেইল বা ইউজার আইডিটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্য আইডি দিন।');
      return;
    }

    if (editingSubAdmin) {
      updateSubAdmin({
        ...editingSubAdmin,
        role: formData.role,
        englishName: cleanName,
        username: cleanUsername,
        designation: formData.designation.trim() || undefined,
        employeeId: cleanUsername.toUpperCase(),
        email: cleanEmail,
        password: editingSubAdmin.isPasswordChanged ? editingSubAdmin.password : cleanPass,
        phone: formData.phone.trim() || undefined,
        permissions: formData.permissions,
        canAdd: formData.canAdd,
        canEdit: formData.canEdit,
        canDelete: formData.canDelete,
        moduleRoles: formData.moduleRoles
      });
    } else {
      registerSubAdmin({
        role: formData.role,
        englishName: cleanName,
        username: cleanUsername,
        designation: formData.designation.trim() || (formData.role === 'employee' ? 'কর্মচারী' : 'সাব-এডমিন'),
        employeeId: cleanUsername.toUpperCase(),
        email: cleanEmail,
        password: cleanPass,
        phone: formData.phone.trim() || undefined,
        permissions: formData.permissions,
        canAdd: formData.canAdd,
        canEdit: formData.canEdit,
        canDelete: formData.canDelete,
        moduleRoles: formData.moduleRoles
      });
    }

    setModalOpen(false);
  };

  const handleDelete = (sub: SubAdminUser) => {
    const isEmp = sub.role === 'employee';
    requestConfirm({
      title: isEmp ? 'কর্মচারী আইডি মুছে ফেলা' : 'সাব-এডমিন একাউন্ট মুছে ফেলা',
      message: `আপনি কি নিশ্চিতভাবে ${isEmp ? 'কর্মচারী' : 'সাব-এডমিন'} "${sub.englishName}" (${sub.username || sub.email}) এর একাউন্টটি মুছে ফেলতে চান? এর পর থেকে তিনি আর লগইন করতে পারবেন না।`,
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DCB473] bg-[#DCB473]/20 px-3 py-1 rounded-full border border-[#DCB473]/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#DCB473]" />
                লগিন আইডি ও পারমিশন কন্ট্রোল প্যানেল
              </span>
              <span className="text-xs font-bold text-blue-200 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/40 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-300" />
                কর্মচারী আইডি ও সাব-এডমিন
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
              <UserCheck className="w-7 h-7 text-[#DCB473]" />
              <span>সাব-এডমিন ও কর্মচারী আইডি ব্যবস্থাপনা</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              সুপার এডমিন তার প্যানেল থেকে প্রয়োজনীয় সংখ্যক সাব-এডমিন এবং কর্মচারীর লগিন আইডি তৈরি করতে পারবেন। কর্মচারী যে যে অপশনে অ্যাকসেস পাবে, অ্যাডমিনের অ্যাপ্রুফ পাওয়ার আগ পর্যন্ত সেই সেই অপশনগুলোতে তথ্য সংযোজন, এডিট ও ডিলিট করতে পারবে।
            </p>
          </div>

          {/* Quick Counter Cards & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 backdrop-blur-xs p-3 px-4 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-stone-300 block">সাব-এডমিন</span>
                <span className="text-xl font-bold text-[#DCB473] font-mono">{subAdminCount}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 px-4 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-blue-200 block">কর্মচারী আইডি</span>
                <span className="text-xl font-bold text-white font-mono">{employeeCount}</span>
              </div>
            </div>

            {!isSubAdmin && !isEmployee && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Button 1: সাব-এডমিন তৈরি */}
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('sub_admin')}
                  className="px-4 py-3 bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:shadow-lg"
                  title="নতুন সাব-এডমিন আইডি তৈরি করুন"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ সাব-অ্যাডমিন তৈরি</span>
                </button>

                {/* Button 2: কর্মচারী আইডি বাটন (RIGHT NEXT TO IT AS REQUESTED) */}
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('employee')}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:shadow-lg border border-blue-400/40"
                  title="কর্মচারীর জন্য লগিন আইডি তৈরি করুন"
                >
                  <Briefcase className="w-4 h-4 text-blue-200" />
                  <span>+ কর্মচারী আইডি</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Logged In Notice if Sub-Admin or Employee */}
      {(isSubAdmin || isEmployee) && (
        <div className={`border-2 p-4 rounded-2xl flex items-start gap-3 shadow-xs ${isEmployee ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-amber-50 border-amber-300 text-amber-900'}`}>
          {isEmployee ? (
            <Briefcase className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <span className="font-bold text-sm block">
              আপনার রোল: {isEmployee ? `কর্মচারী (${activeSubAdmin?.designation || 'স্টাফ'})` : 'সাব-এডমিন (Viewer & Auditor)'}
            </span>
            <p className="leading-relaxed">
              {isEmployee ? (
                <>আপনি কর্মচারী একাউন্ট (<strong>{activeSubAdmin?.englishName}</strong> - ইউজার আইডি: <strong>{activeSubAdmin?.username}</strong>) দিয়ে লগইন আছেন। অ্যাডমিন কর্তৃক নির্ধারিত অপশনসমূহে আপনি সংযোজন, এডিট ও ডিলিট করতে পারবেন।</>
              ) : (
                <>আপনি সাব-এডমিন একাউন্ট (<strong>{activeSubAdmin?.englishName}</strong>) দিয়ে লগইন আছেন। নীতিমালার অনুযায়ী আপনি ওয়েবসাইটের সকল তথ্য দেখতে ও পিডিএফ ডাউনলোড করতে পারবেন।</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* 3. Role & Permission Policy Summary Card */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <Info className="w-4 h-4 text-purple-700" />
          <h3 className="text-xs sm:text-sm font-bold text-[#0f2922]">
            সাব-এডমিন ও কর্মচারী অধিকার নীতিমালা (Access & Action Policy):
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Sub-Admin Policy */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-950 font-bold">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>১. সাব-এডমিন নীতি (Viewer & Dual Approval):</span>
            </div>
            <ul className="text-[11px] text-purple-900 space-y-1 list-disc list-inside">
              <li>ওয়েবসাইটের সকল তথ্য ও আর্থিক লেজার দেখতে এবং পিডিএফ ডাউনলোড করতে পারবেন।</li>
              <li>সুপার এডমিন কর্তৃক প্রেরিত কোনো তথ্য এডিট বা ডিলিটের ক্ষেত্রে "অনুমোদন কেন্দ্র" এ পরিবর্তন হিস্টোরি ও কারণ দেখে অনুমোদন করবেন।</li>
              <li>নিজে পাসওয়ার্ড পরিবর্তন না করা পর্যন্ত এডমিন প্রাথমিক পাসওয়ার্ড দেখতে পারবেন।</li>
            </ul>
          </div>

          {/* Employee Policy */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-950 font-bold">
              <Briefcase className="w-4 h-4 text-blue-700" />
              <span>২. কর্মচারী আইডি নীতি (Authorized Modules & Actions):</span>
            </div>
            <ul className="text-[11px] text-blue-900 space-y-1 list-disc list-inside">
              <li>অ্যাডমিন নির্ধারণ করবেন কর্মচারী ওয়েবসাইটের কি কি অপশনে এক্সেস পাবেন (যেমন: হাজী নিবন্ধন, হিসাব ইত্যাদি)।</li>
              <li><strong>বিঃদ্রঃ</strong> অ্যাডমিনের অ্যাপ্রুফ পাওয়ার আগ পর্যন্ত কর্মচারী যে যে অপশন এক্সেস পাবে সেই সেই অপশনগুলোতে এডিট, সংযোজন ও ডিলিট করতে পারবে।</li>
              <li>কর্মচারী তার নিজস্ব ইউজার আইডি ও পাসওয়ার্ড দিয়ে সাইটে প্রবেশ করে নির্ধারিত কাজ পরিচালনা করবেন।</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Staff Accounts List & Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#b88e44]" />
            <h3 className="text-sm font-bold text-[#0f2922]">
              নিবন্ধিত আইডি তালিকা ({filteredStaffList.length} জন)
            </h3>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 self-start sm:self-auto text-xs">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-white text-[#0f2922] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              সকল আইডি ({subAdmins.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('sub_admin')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                roleFilter === 'sub_admin'
                  ? 'bg-[#0f2922] text-[#DCB473] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>সাব-এডমিন ({subAdminCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('employee')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                roleFilter === 'employee'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>কর্মচারী আইডি ({employeeCount})</span>
            </button>
          </div>
        </div>

        {filteredStaffList.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-xs space-y-3">
            <UserCheck className="w-12 h-12 text-stone-300 mx-auto" />
            <h4 className="text-sm font-bold text-stone-700">
              {roleFilter === 'employee' ? 'কোনো কর্মচারী আইডি পাওয়া যায়নি' : roleFilter === 'sub_admin' ? 'কোনো সাব-এডমিন পাওয়া যায়নি' : 'কোনো আইডি পাওয়া যায়নি'}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              উপরে "+ সাব-অ্যাডমিন তৈরি" অথবা "+ কর্মচারী আইডি" বাটনে ক্লিক করে নতুন লগিন আইডি তৈরি করতে পারেন।
            </p>
            {!isSubAdmin && !isEmployee && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('employee')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>+ নতুন কর্মচারী আইডি তৈরি করুন</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStaffList.map((sub) => {
              const isEmp = sub.role === 'employee';
              const isPasswordVisible = !!showPasswordMap[sub.id];
              const displayUsername = sub.username || sub.email.split('@')[0];

              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-xs space-y-3.5 relative overflow-hidden ${
                    isEmp
                      ? 'border-blue-200 hover:border-blue-400'
                      : 'border-purple-200 hover:border-purple-400'
                  }`}
                >
                  {/* Top Bar with Name, Designation, and Role Badge */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shadow-2xs ${
                          isEmp
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {isEmp ? (
                          <Briefcase className="w-6 h-6 text-blue-700" />
                        ) : (
                          <User className="w-6 h-6 text-purple-700" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-base font-bold text-[#0f2922]">{sub.englishName}</h4>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isEmp
                                ? 'text-blue-900 bg-blue-100 border-blue-300'
                                : 'text-purple-900 bg-purple-100 border-purple-300'
                            }`}
                          >
                            {isEmp ? 'কর্মচারী আইডি (Employee)' : 'সাব-এডমিন (Viewer)'}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                          {sub.designation && (
                            <span className="font-semibold text-stone-700">পদবী: {sub.designation}</span>
                          )}
                          <span>| তৈরি: {sub.createdAt || '২০২৬-১১-১১'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
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
                        লগইন ইউজার আইডি (User ID):
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded border shadow-2xs ${isEmp ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-white text-[#0f2922] border-stone-200'}`}>
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
                        লগইন পাসওয়ার্ড:
                      </span>
                      <div className="flex items-center gap-1">
                        {sub.isPasswordChanged ? (
                          <span className="font-mono text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>•••••••• [{isEmp ? 'কর্মচারী' : 'সাব-এডমিন'} কর্তৃক পরিবর্তিত]</span>
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

                  {/* Capabilities & Permissions Badges */}
                  <div className={`p-3 rounded-2xl border space-y-2 ${isEmp ? 'bg-blue-50/60 border-blue-200' : 'bg-purple-50/50 border-purple-100'}`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <ShieldCheck className={`w-3.5 h-3.5 ${isEmp ? 'text-blue-700' : 'text-purple-700'}`} />
                        <span>অনুমোদিত অপশন ও অধিকার:</span>
                      </span>

                      {/* Action Capability Tags for Employee */}
                      {isEmp && (
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <span className={`px-1.5 py-0.5 rounded ${sub.canAdd !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}>
                            +সংযোজন
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${sub.canEdit !== false ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-400'}`}>
                            ✎এডিট
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${sub.canDelete !== false ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-400'}`}>
                            ✕ডিলিট
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(sub.permissions && sub.permissions.length > 0 ? sub.permissions : ['haji-registrations']).map((p) => {
                        const matched = AVAILABLE_ACCESS_OPTIONS.find((a) => a.id === p);
                        return (
                          <span
                            key={p}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
                              isEmp
                                ? 'bg-white text-blue-900 border-blue-200'
                                : 'bg-white text-purple-900 border-purple-200'
                            }`}
                          >
                            {matched?.label.split('(')[0].trim() || p}
                          </span>
                        );
                      })}
                    </div>

                    {isEmp && (
                      <p className="text-[10px] text-blue-900/90 font-medium pt-1 border-t border-blue-200/60">
                        ⚡ এই কর্মচারী অ্যাডমিনের অ্যাপ্রুফ পাওয়ার আগ পর্যন্ত উপরের অপশনগুলোতে এডিট, সংযোজন ও ডিলিট করতে পারবে।
                      </p>
                    )}
                  </div>

                  {/* Card Action Buttons (Only for Super Admin) */}
                  {!isSubAdmin && !isEmployee && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(sub)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>তথ্য ও পারমিশন পরিবর্তন</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sub)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl cursor-pointer transition-colors"
                        title="একাউন্টটি মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ADD / EDIT MODAL FOR SUB-ADMIN & EMPLOYEE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className={`bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative border-2 max-h-[92vh] overflow-y-auto ${formData.role === 'employee' ? 'border-blue-400' : 'border-purple-300'}`}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-4 space-y-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${formData.role === 'employee' ? 'text-blue-700' : 'text-purple-700'}`}>
                {formData.role === 'employee' ? <Briefcase className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                {formData.role === 'employee' ? 'কর্মচারী আইডি রেজিস্ট্রেশন ও পারমিশন ফরম' : 'সাব-এডমিন একাউন্ট ফরম'}
              </span>
              <h3 className="text-xl font-bold text-[#0f2922]">
                {editingSubAdmin
                  ? `"${editingSubAdmin.englishName}" (${formData.role === 'employee' ? 'কর্মচারী' : 'সাব-এডমিন'}) এর তথ্য পরিবর্তন`
                  : formData.role === 'employee'
                  ? 'নতুন কর্মচারী লগিন আইডি তৈরি করুন'
                  : 'নতুন সাব-এডমিন তৈরি করুন'}
              </h3>
              <p className="text-xs text-stone-500">
                {formData.role === 'employee'
                  ? 'কর্মচারী এই ইউজার আইডি ও পাসওয়ার্ড দিয়ে ওয়েবসাইটে প্রবেশ করতে পারবেন এবং অ্যাডমিনের অনুমোদন পূর্ব পর্যন্ত নির্ধারিত অপশনগুলোতে এডিট, সংযোজন ও ডিলিট করতে পারবেন।'
                  : 'সাব-এডমিন এই আইডি দিয়ে ওয়েবসাইটের সকল তথ্য দেখতে ও পিডিএফ ডাউনলোড করতে পারবেন।'}
              </p>
            </div>

            {/* Role Switcher Toggle (if creating new) */}
            {!editingSubAdmin && (
              <div className="mb-4 bg-stone-100 p-1.5 rounded-2xl flex items-center gap-2 border border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    const countSub = subAdmins.filter((s) => s.role !== 'employee').length + 1;
                    setFormData((prev) => ({
                      ...prev,
                      role: 'sub_admin',
                      username: `subadmin${countSub}`,
                      designation: 'সাব-এডমিন',
                      canDelete: false
                    }));
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    formData.role === 'sub_admin'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>সাব-এডমিন তৈরি</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const countEmp = subAdmins.filter((s) => s.role === 'employee').length + 1;
                    setFormData((prev) => ({
                      ...prev,
                      role: 'employee',
                      username: `emp${countEmp}`,
                      designation: 'অফিস সহকারী ও ডাটা অপারেটর',
                      canAdd: true,
                      canEdit: true,
                      canDelete: true
                    }));
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    formData.role === 'employee'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>কর্মচারী আইডি তৈরি</span>
                </button>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {formData.role === 'employee' ? 'কর্মচারীর পূর্ণ নাম *' : 'সাব-এডমিনের পূর্ণ নাম *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.englishName}
                    onChange={(e) => setFormData({ ...formData, englishName: e.target.value })}
                    placeholder="e.g. Md. Tariqul Islam"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    লগইন ইউজার আইডি (User ID / Username) *
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
                    placeholder="e.g. emp_tariqul"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-stone-800"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    লগইন পেজে এই ইউজার আইডি দিয়ে কর্মচারী প্রবেশ করবেন
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    পদবী / দায়িত্ব (Designation)
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="e.g. অফিস সহকারী / হিসাব রক্ষক / কাস্টমার কেয়ার"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                        ব্যবহারকারী নিজে তার পাসওয়ার্ড পরিবর্তন করেছেন। সিস্টেম নিরাপত্তা ও গোপনীয়তা রক্ষা নীতি অনুসারে এডমিন এটি দেখতে বা পরিবর্তন করতে পারবেন না।
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
                          className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
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
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-emerald-800"
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        শুরুতে এই পাসওয়ার্ড দিয়ে কর্মচারী লগইন করবেন এবং পরবর্তীতে নিজে পরিবর্তন করতে পারবেন
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
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Action Capabilities for Employee (Add, Edit, Delete) */}
              {formData.role === 'employee' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-blue-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-700" />
                      <span>কর্মচারীর কাজের অধিকার (Action Permissions):</span>
                    </label>
                    <span className="text-[10px] text-blue-800 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-300">
                      অ্যাডমিন অনুমোদিত
                    </span>
                  </div>

                  <p className="text-[11px] text-blue-900 leading-snug">
                    <strong>বিঃদ্রঃ</strong> অ্যাডমিনের অ্যাপ্রুফ পাওয়ার আগ পর্যন্ত কর্মচারী যে যে অপশন অ্যাকসেস পাবে সেই সেই অপশনগুলোতে এডিট, সংযোজন ও ডিলিট করতে পারবে।
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="checkbox"
                        checked={formData.canAdd}
                        onChange={(e) => setFormData({ ...formData, canAdd: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-stone-800">+ তথ্য সংযোজন (Add)</span>
                    </label>

                    <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="checkbox"
                        checked={formData.canEdit}
                        onChange={(e) => setFormData({ ...formData, canEdit: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-stone-800">✎ তথ্য এডিট (Edit)</span>
                    </label>

                    <label className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="checkbox"
                        checked={formData.canDelete}
                        onChange={(e) => setFormData({ ...formData, canDelete: e.target.checked })}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-rose-800">✕ তথ্য ডিলিট (Delete)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Module Access Selection */}
              <div className="pt-2 border-t border-stone-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block font-bold text-stone-800 text-xs sm:text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      অনুমোদিত বিভাগসমূহ নির্বাচন (Allowed Modules) *
                    </label>
                    <span className="text-[11px] text-stone-500 block">
                      কর্মচারী ওয়েবসাইট এর কি কি সেকশনে প্রবেশ ও কাজ করতে পারবে তা সিলেক্ট করুন:
                    </span>
                  </div>

                  {/* Dropdown Preset Selector */}
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <select
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="text-xs bg-blue-50 border border-blue-300 text-blue-900 rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>-- দ্রুত প্রি-সেট নির্বাচন --</option>
                      <option value="haji-only">শুধু হাজী নিবন্ধন ও কাফেলা</option>
                      <option value="haji-finance">হাজী নিবন্ধন + আয়-ব্যয় লেজার</option>
                      <option value="finance-only">হজ ও ওমরাহ্ হিসাব ও আয়-ব্যয়</option>
                      <option value="content">ওয়েবসাইট কনটেন্ট ও নোটিশ</option>
                      <option value="all">সকল বিভাগ (পূর্ণ এক্সেস)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-stone-500">অনুমতি দিতে বক্সে টিক দিন:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-blue-700 font-bold hover:underline cursor-pointer"
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

                {/* 12 Access Option Pills/Checkboxes */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 border border-stone-200 rounded-2xl p-2.5 bg-stone-50/60">
                  {AVAILABLE_ACCESS_OPTIONS.map((item) => {
                    const isChecked = formData.permissions.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => togglePermission(item.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                            : 'bg-white border-stone-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-blue-700" />
                            ) : (
                              <Square className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-800">{item.label}</p>
                            <span className="text-[10px] text-stone-400 font-mono">আইডি: {item.id}</span>
                          </div>
                        </div>

                        {isChecked && (
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-blue-700" />
                            অনুমোদিত
                          </span>
                        )}
                      </div>
                    );
                  })}
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
                  className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 ${
                    formData.role === 'employee'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-purple-700 hover:bg-purple-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {editingSubAdmin
                      ? 'আপডেট সংরক্ষণ করুন'
                      : formData.role === 'employee'
                      ? 'কর্মচারী আইডি তৈরি করুন'
                      : 'সাব-এডমিন তৈরি করুন'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
