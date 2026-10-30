import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import { InquiryItem } from '../types';
import { getAllGroupsOccupancy } from '../data/kafelaGroups';
import {
  X,
  Save,
  CheckCircle2,
  Phone,
  User,
  Home,
  FileText,
  Shield,
  Link as LinkIcon,
  Image as ImageIcon,
  ExternalLink,
  Users,
  KeyRound,
  Lock,
  BadgePercent,
  Receipt,
  CreditCard,
  Wallet
} from 'lucide-react';

export const InquiryEditModal: React.FC = () => {
  const {
    editingInquiryModal,
    closeInquiryModal,
    updateInquiry,
    inquiries,
    kafelaGroups,
    linkHajiCompanion,
    unlinkHajiCompanion,
    isSubAdmin
  } = useAdmin();
  const groupsOccupancy = useMemo(() => getAllGroupsOccupancy(kafelaGroups, inquiries), [kafelaGroups, inquiries]);

  const [form, setForm] = useState<InquiryItem | null>(null);
  const [modalCompanionSelect, setModalCompanionSelect] = useState<string>('');

  useEffect(() => {
    if (editingInquiryModal) {
      const latest = inquiries.find((i) => i.id === editingInquiryModal.id) || editingInquiryModal;
      setForm(latest);
    }
  }, [editingInquiryModal, inquiries]);

  if (!editingInquiryModal || !form) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    updateInquiry({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      approvedAt: form.status === 'approved' && !form.approvedAt ? new Date().toLocaleDateString('bn-BD') : form.approvedAt
    });
    closeInquiryModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473] my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeInquiryModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b pb-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider">
              বুকিং ও আবেদন ব্যবস্থাপনা
            </span>
            {form.registrationType === 'haji' && (
              <span className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                হাজী প্রাক-নিবন্ধন
              </span>
            )}
            {form.registrationType === 'partner' && (
              <span className="text-[10px] font-bold bg-[#0f2922] text-[#DCB473] px-2 py-0.5 rounded-full">
                পার্টনার আবেদন
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-[#0f2922]">
            {form.registrationType === 'haji' ? 'হাজীর বিস্তারিত তথ্য ও ডকুমেন্টস' : 'আবেদনকারীর তথ্য সম্পাদন'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            আইডি: <span className="font-mono">{form.id}</span>
            {form.registrationRef && (
              <span className="ml-2 font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                রেফ: {form.registrationRef}
              </span>
            )}
            <span className="ml-2">| তারিখ: {form.date}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                যাত্রী / আবেদনকারীর নাম (বাংলা) *
              </label>
              <input
                type="text"
                required
                value={form.nameBn || form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, nameBn: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                নাম (ইংরেজি / Passport Name)
              </label>
              <input
                type="text"
                value={form.nameEn || ''}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                placeholder="e.g. ALHAJ MD. RAFIQUL ISLAM"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ইমেইল ঠিকানা (Email)
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@gmail.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          {/* HAJI DETAILED FIELDS (If Haji registration) */}
          {form.registrationType === 'haji' && (
            <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-[#0f2922] flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  হাজী রেজিস্ট্রেশনের সকল তথ্যাবলী (এডমিন এডিট মোড)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                  রেফ: {form.registrationRef || form.id}
                </span>
              </h4>

              {/* Parents (Editable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">পিতার নাম (বাংলা):</label>
                  <input
                    type="text"
                    value={form.fatherNameBn || ''}
                    onChange={(e) => setForm({ ...form, fatherNameBn: e.target.value })}
                    placeholder="পিতার নাম লিখুন"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">পিতার নাম (ইংরেজি):</label>
                  <input
                    type="text"
                    value={form.fatherNameEn || ''}
                    onChange={(e) => setForm({ ...form, fatherNameEn: e.target.value })}
                    placeholder="Father Name (English)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">মাতার নাম (বাংলা):</label>
                  <input
                    type="text"
                    value={form.motherNameBn || ''}
                    onChange={(e) => setForm({ ...form, motherNameBn: e.target.value })}
                    placeholder="মাতার নাম লিখুন"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">মাতার নাম (ইংরেজি):</label>
                  <input
                    type="text"
                    value={form.motherNameEn || ''}
                    onChange={(e) => setForm({ ...form, motherNameEn: e.target.value })}
                    placeholder="Mother Name (English)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Guardian phone & DoB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">অভিভাবকের মোবাইল নং:</label>
                  <input
                    type="text"
                    value={form.guardianPhone || ''}
                    onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                    placeholder="০১৭০০-০০০০০০"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">জন্ম তারিখ (DOB):</label>
                  <input
                    type="date"
                    value={form.dateOfBirth || ''}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono"
                  />
                </div>
              </div>

              {/* NID & Passport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">এনআইডি নম্বর (NID):</label>
                  <input
                    type="text"
                    value={form.nidNo || ''}
                    onChange={(e) => setForm({ ...form, nidNo: e.target.value })}
                    placeholder="NID নম্বর"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">পাসপোর্ট নম্বর:</label>
                  <input
                    type="text"
                    value={form.passportNo || ''}
                    onChange={(e) => setForm({ ...form, passportNo: e.target.value })}
                    placeholder="পাসপোর্ট নম্বর"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Addresses (Editable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-emerald-200">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">বর্তমান ঠিকানা:</label>
                  <textarea
                    rows={2}
                    value={form.presentAddress || ''}
                    onChange={(e) => setForm({ ...form, presentAddress: e.target.value })}
                    placeholder="বর্তমান ঠিকানা লিখুন"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="mt-1">
                    <span className="text-[11px] text-stone-500 font-medium">পোস্ট কোড: </span>
                    <input
                      type="text"
                      value={form.presentPostCode || ''}
                      onChange={(e) => setForm({ ...form, presentPostCode: e.target.value })}
                      placeholder="পোস্ট কোড"
                      className="px-2 py-0.5 rounded border border-stone-300 bg-white text-xs font-mono w-24 ml-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">স্থায়ী ঠিকানা:</label>
                  <textarea
                    rows={2}
                    value={form.permanentAddress || ''}
                    onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                    placeholder="স্থায়ী ঠিকানা লিখুন"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white"
                  />
                  <div className="mt-1">
                    <span className="text-[11px] text-stone-500 font-medium">পোস্ট কোড: </span>
                    <input
                      type="text"
                      value={form.permanentPostCode || ''}
                      onChange={(e) => setForm({ ...form, permanentPostCode: e.target.value })}
                      placeholder="পোস্ট কোড"
                      className="px-2 py-0.5 rounded border border-stone-300 bg-white text-xs font-mono w-24 ml-1"
                    />
                  </div>
                </div>
              </div>

              {/* Linked Haji Companions (এডমিন কর্তৃক সিঙ্ককৃত সঙ্গী তালিকা) */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 rounded-2xl border-2 border-emerald-300 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                  <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    কাফেলা নিবন্ধিত যুক্ত সঙ্গী হাজীদের তালিকা (Linked Companions)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                    {form.linkedCompanions?.length || 0} জন সঙ্গী যুক্ত
                  </span>
                </div>

                {/* Companions Badges List */}
                {form.linkedCompanions && form.linkedCompanions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {form.linkedCompanions.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-2 bg-white rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between gap-1.5"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#0f2922] truncate text-xs">
                            {comp.name}
                          </div>
                          <div className="text-[10px] text-stone-600 font-mono">
                            আইডি: <strong className="text-emerald-800">{comp.hajiUserId}</strong>
                            {comp.group && <span className="ml-1 text-purple-700">({comp.group})</span>}
                          </div>
                        </div>
                        {!isSubAdmin && (
                          <button
                            type="button"
                            onClick={() => unlinkHajiCompanion(form.id, comp.id)}
                            className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors"
                            title="সঙ্গী বাদ দিন"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-stone-500 bg-white/70 p-2 rounded-xl border border-dashed border-emerald-200">
                    বর্তমানে কোনো সঙ্গী হাজীর আইডি লিংক করা নেই।
                  </div>
                )}

                {/* Add Companion Dropdown inside modal */}
                {!isSubAdmin && (
                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/80">
                    <select
                      value={modalCompanionSelect}
                      onChange={(e) => setModalCompanionSelect(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-xl border border-stone-300 bg-white text-stone-800 font-medium"
                    >
                      <option value="">-- সঙ্গী হিসেবে যোগ করতে হাজী নির্বাচন করুন --</option>
                      {inquiries
                        .filter(
                          (other) =>
                            (other.registrationType === 'haji' || other.serviceId === 'haji-full-registration') &&
                            other.id !== form.id &&
                            !form.linkedCompanionIds?.includes(other.id)
                        )
                        .map((other) => (
                          <option key={other.id} value={other.id}>
                            [{other.hajiUserId || other.registrationRef || other.id}] {other.nameBn || other.name} ({other.phone})
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!modalCompanionSelect}
                      onClick={() => {
                        if (modalCompanionSelect) {
                          linkHajiCompanion(form.id, modalCompanionSelect);
                          setModalCompanionSelect('');
                        }
                      }}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                    >
                      + যোগ করুন
                    </button>
                  </div>
                )}

                {/* Partner Details notes */}
                <div className="pt-1.5 border-t border-emerald-200/80">
                  <label className="block text-[11px] text-stone-600 font-semibold mb-0.5">সহযাত্রীদের নাম ও পরিচিতি (আবেদনের তথ্য):</label>
                  <textarea
                    rows={2}
                    value={form.partnerDetails || ''}
                    onChange={(e) => setForm({ ...form, partnerDetails: e.target.value })}
                    placeholder="যেমন: সহধর্মিণী: মোসাঃ রাবেয়া বেগম (পাসপোর্ট: B12345678)"
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              {/* Haji Login Credentials */}
              {(form.hajiUserId || form.hajiPassword || form.registrationRef) && (
                <div className="p-3 bg-white rounded-xl border border-emerald-300 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                      হাজী লগইন একাউন্ট তথ্য (Haji Login Credentials):
                    </span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      লগইন এক্সেস
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-stone-500 text-[11px] block font-medium">হাজী ইউজার আইডি (User ID):</span>
                      <input
                        type="text"
                        value={form.hajiUserId || form.registrationRef || ''}
                        onChange={(e) => setForm({ ...form, hajiUserId: e.target.value })}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-300 font-mono text-stone-800 mt-0.5"
                      />
                    </div>
                    <div>
                      <span className="text-stone-500 text-[11px] block font-medium">পাসওয়ার্ড (Password):</span>
                      <input
                        type="text"
                        value={form.hajiPassword || ''}
                        onChange={(e) => setForm({ ...form, hajiPassword: e.target.value })}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-300 font-mono text-stone-800 mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOADED DOCUMENTS VIEWER */}
              <div className="pt-2 border-t border-emerald-200">
                <span className="text-xs font-bold text-[#0f2922] block mb-2">
                  আপলোডকৃত ডকুমেন্টস ও ছবি (Uploaded Documents):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {/* Photo */}
                  <div className="p-2 bg-white rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] font-bold text-stone-600 block mb-1">হাজীর ছবি</span>
                    {form.photoUrl ? (
                      <a href={form.photoUrl} target="_blank" rel="noreferrer" className="block group">
                        <img src={form.photoUrl} alt="হাজীর ছবি" className="w-16 h-16 mx-auto rounded-lg object-cover border group-hover:opacity-80 transition-opacity" />
                        <span className="text-[9px] text-blue-600 underline mt-1 block">বড় করে দেখুন</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-stone-400 block py-4">সংযুক্ত নেই</span>
                    )}
                  </div>

                  {/* Signature */}
                  <div className="p-2 bg-white rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] font-bold text-stone-600 block mb-1">স্বাক্ষর</span>
                    {form.signatureUrl ? (
                      <a href={form.signatureUrl} target="_blank" rel="noreferrer" className="block group">
                        <img src={form.signatureUrl} alt="স্বাক্ষর" className="w-16 h-16 mx-auto rounded-lg object-contain bg-stone-50 border group-hover:opacity-80 transition-opacity" />
                        <span className="text-[9px] text-blue-600 underline mt-1 block">বড় করে দেখুন</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-stone-400 block py-4">সংযুক্ত নেই</span>
                    )}
                  </div>

                  {/* NID */}
                  <div className="p-2 bg-white rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] font-bold text-stone-600 block mb-1">NID কপি</span>
                    {form.nidDocUrl ? (
                      <a href={form.nidDocUrl} target="_blank" rel="noreferrer" className="block group">
                        <img src={form.nidDocUrl} alt="NID কপি" className="w-16 h-16 mx-auto rounded-lg object-cover border group-hover:opacity-80 transition-opacity" />
                        <span className="text-[9px] text-blue-600 underline mt-1 block">বড় করে দেখুন</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-stone-400 block py-4">সংযুক্ত নেই</span>
                    )}
                  </div>

                  {/* Passport */}
                  <div className="p-2 bg-white rounded-xl border border-stone-200 text-center">
                    <span className="text-[10px] font-bold text-stone-600 block mb-1">পাসপোর্ট কপি</span>
                    {form.passportDocUrl ? (
                      <a href={form.passportDocUrl} target="_blank" rel="noreferrer" className="block group">
                        <img src={form.passportDocUrl} alt="পাসপোর্ট কপি" className="w-16 h-16 mx-auto rounded-lg object-cover border group-hover:opacity-80 transition-opacity" />
                        <span className="text-[9px] text-blue-600 underline mt-1 block">বড় করে দেখুন</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-stone-400 block py-4">সংযুক্ত নেই</span>
                    )}
                  </div>

                  {/* Money Receipt */}
                  <div className="p-2 bg-emerald-50/50 rounded-xl border border-emerald-300 text-center">
                    <span className="text-[10px] font-bold text-emerald-900 block mb-1">টাকার রসিদ</span>
                    {form.paymentReceiptUrl ? (
                      <a href={form.paymentReceiptUrl} target="_blank" rel="noreferrer" className="block group">
                        <img src={form.paymentReceiptUrl} alt="টাকার রসিদ" className="w-16 h-16 mx-auto rounded-lg object-cover border border-emerald-400 group-hover:opacity-80 transition-opacity" />
                        <span className="text-[9px] text-emerald-700 font-bold underline mt-1 block">রসিদ দেখুন</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-stone-400 block py-4">রসিদ নেই</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service, Kafela Group & Travelers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                আবেদিত সেবা / প্যাকেজ
              </label>
              <input
                type="text"
                value={form.serviceName}
                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>কাফেলা গ্রুপ</span>
                <span className="text-[10px] text-amber-700 font-semibold">(সর্বোচ্চ ৫০ জন)</span>
              </label>
              <select
                value={form.selectedGroup || ''}
                onChange={(e) => setForm({ ...form, selectedGroup: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-medium text-stone-800"
              >
                <option value="">গ্রুপ নির্ধারণ করা নেই</option>
                {groupsOccupancy.map((g) => (
                  <option key={g.group.id} value={g.group.name}>
                    {g.group.name} ({g.currentCount}/50 জন)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                যাত্রী সংখ্যা / রুম
              </label>
              <input
                type="text"
                value={form.travelers}
                onChange={(e) => setForm({ ...form, travelers: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          {/* PRICING & DISCOUNT CONTROLLER */}
          <div className="p-3.5 bg-gradient-to-r from-stone-900 via-[#0f2922] to-[#14352b] text-white rounded-2xl border border-[#DCB473]/50 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-[#DCB473] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                প্যাকেজের মূল্য ও বিশেষ ছাড় (%) নির্ধারণ
              </span>
              <span className="text-[10px] text-stone-300">
                এডমিন মূল্য ও ডিসকাউন্ট
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  মূল মোট প্রাক্কলিত খরচ (Subtotal ৳):
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.subtotalAmount || form.finalTotalAmount || 0}
                  onChange={(e) => {
                    const newSubtotal = Number(e.target.value) || 0;
                    const pct = form.discountPercent || 0;
                    const discAmt = Math.round((newSubtotal * pct) / 100);
                    setForm({
                      ...form,
                      subtotalAmount: newSubtotal,
                      discountAmount: discAmt,
                      finalTotalAmount: Math.max(0, newSubtotal - discAmt)
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-600 bg-stone-800 text-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1 flex items-center justify-between">
                  <span>বিশেষ ছাড় (Discount %):</span>
                  <span className="text-amber-300 font-mono font-bold">{form.discountPercent || 0}%</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={form.discountPercent || 0}
                  onChange={(e) => {
                    const newPct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                    const base = form.subtotalAmount || form.finalTotalAmount || 0;
                    const discAmt = Math.round((base * newPct) / 100);
                    setForm({
                      ...form,
                      discountPercent: newPct,
                      discountAmount: discAmt,
                      finalTotalAmount: Math.max(0, base - discAmt)
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-600 bg-stone-800 text-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-xs">
              <span className="text-stone-300">
                ছাড়ের পর চূড়ান্ত প্রদেয় মূল্য (Final Net Total):
              </span>
              <span className="text-[#DCB473] font-mono text-base font-extrabold tabular-nums">
                ৳ {(form.finalTotalAmount || form.subtotalAmount || 0).toLocaleString('bn-BD')}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                ছাড়ের কারণ / রেফারেন্স মন্তব্য:
              </label>
              <input
                type="text"
                value={form.discountNote || ''}
                onChange={(e) => setForm({ ...form, discountNote: e.target.value })}
                placeholder="যেমন: পরিবার ভিত্তিক বিশেষ ছাড়, গ্রুপ কোটা..."
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-stone-600 bg-stone-800 text-stone-200 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          {/* PAYMENT & DUE BALANCE CONTROLLER */}
          <div className="p-3.5 bg-emerald-950 text-white rounded-2xl border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#DCB473]" />
                টাকা জমা ও অবশিষ্ট বকেয়া লেজার (Payment & Due Balance)
              </span>
              <span className="text-[10px] text-emerald-200 font-mono">
                {form.paidAmount && form.paidAmount >= (form.finalTotalAmount || form.subtotalAmount || 0) && (form.finalTotalAmount || form.subtotalAmount || 0) > 0 ? (
                  <span className="text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/50">
                    ✓ পরিশোধিত
                  </span>
                ) : (
                  <span className="text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/50">
                    বকেয়া আছে
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                  টাকা জমার তারিখ:
                </label>
                <input
                  type="date"
                  value={form.paymentDate || ''}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-emerald-700 bg-emerald-900/60 text-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                  জমা টাকার পরিমাণ (৳):
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.paidAmount ?? 0}
                  onChange={(e) => {
                    const paid = Math.max(0, Number(e.target.value) || 0);
                    const netTotal = form.finalTotalAmount || form.subtotalAmount || 0;
                    setForm({
                      ...form,
                      paidAmount: paid,
                      dueAmount: Math.max(0, netTotal - paid)
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-emerald-700 bg-emerald-900/60 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                  টাকা জমার মাধ্যম:
                </label>
                <select
                  value={form.paymentMethod || 'ব্যাংক ডিপোজিট'}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-700 bg-emerald-900/60 text-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                >
                  <option value="ব্যাংক ডিপোজিট">ব্যাংক ডিপোজিট (Bank)</option>
                  <option value="ক্যাশ / নগদ">ক্যাশ / নগদ (Cash)</option>
                  <option value="বিকাশ / নগদ (MFS)">বিকাশ / নগদ (MFS)</option>
                  <option value="চেক / পে-অর্ডার">চেক / পে-অর্ডার (Cheque)</option>
                </select>
              </div>
            </div>

            {/* Real-time Calculation Ledger */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-800/80 text-center text-xs">
              <div className="bg-white/5 p-2 rounded-lg">
                <span className="text-[10px] text-stone-300 block">মোট খরচ (Net Total):</span>
                <span className="font-mono font-bold text-white text-xs sm:text-sm">
                  ৳ {(form.finalTotalAmount || form.subtotalAmount || 0).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="bg-emerald-900/50 p-2 rounded-lg border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 block">জমা করা টাকা:</span>
                <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                  ৳ {(form.paidAmount ?? 0).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-500/40">
                <span className="text-[10px] text-amber-300 block">অবশিষ্ট বকেয়া (Due):</span>
                <span className="font-mono font-bold text-[#DCB473] text-xs sm:text-sm">
                  ৳ {(form.dueAmount !== undefined ? form.dueAmount : Math.max(0, (form.finalTotalAmount || form.subtotalAmount || 0) - (form.paidAmount ?? 0))).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {form.paymentReceiptUrl && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-900/40 border border-emerald-700 text-xs">
                <span className="text-emerald-200 text-[11px] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#DCB473]" />
                  টাকার রসিদ ফাইল সংযুক্ত আছে ({form.paymentReceiptName || 'রসিদ'})
                </span>
                <a
                  href={form.paymentReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-[#DCB473] text-[#0f2922] font-bold rounded text-[10px] hover:bg-white transition-colors"
                >
                  রসিদ ভাউচার দেখুন
                </a>
              </div>
            )}
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              বর্তমান অবস্থা (Status) *
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            >
              <option value="pending">⏳ অননুমোদিত (অপেক্ষমাণ / Pending)</option>
              <option value="approved">✓ অনুমোদিত (Approved)</option>
              <option value="contacted">📞 যোগাযোগ সম্পন্ন (Contacted)</option>
              <option value="rejected">✕ সম্পন্ন / বাতিল (Closed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              মূল বার্তা বা নোট
            </label>
            <textarea
              rows={2}
              value={form.message || ''}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              এডমিন নোট / ব্যক্তিগত মন্তব্য
            </label>
            <textarea
              rows={2}
              value={form.adminNotes || ''}
              onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
              placeholder="উদাঃ প্রয়োজনীয় কাগজপত্র যাচাই সম্পন্ন, পাসপোর্টের মেয়াদ ঠিক আছে..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={closeInquiryModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
