import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { TeamMember } from '../types';
import { X, Save, Users, Sparkles, Upload, Image as ImageIcon, Trash2, Phone, Mail, CheckCircle2 } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'
];

export const TeamEditModal: React.FC = () => {
  const { editingTeamModal, closeTeamModal, addTeamMember, updateTeamMember, showToast } = useAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<TeamMember>({
    id: '',
    name: '',
    role: 'ব্যবস্থাপনা পরিচালক',
    image: PRESET_AVATARS[0],
    initials: 'ম',
    phone: '',
    isApproved: true
  });

  const [customUrl, setCustomUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (editingTeamModal && editingTeamModal !== 'new') {
      setForm(editingTeamModal);
      setCustomUrl(editingTeamModal.image || '');
    } else if (editingTeamModal === 'new') {
      const defaultId = 'team-' + Date.now();
      setForm({
        id: defaultId,
        name: '',
        role: 'ব্যবস্থাপনা পরিচালক',
        image: PRESET_AVATARS[0],
        initials: 'ম',
        phone: '',
        isApproved: true
      });
      setCustomUrl(PRESET_AVATARS[0]);
    }
  }, [editingTeamModal]);

  if (!editingTeamModal) return null;

  const isEditing = editingTeamModal !== 'new';

  // Device file upload with high-quality client-side compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('দয়া করে একটি সঠিক ইমেজ ফাইল (.jpg, .png, .webp) নির্বাচন করুন');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setForm((prev) => ({ ...prev, image: compressedDataUrl }));
          setCustomUrl(compressedDataUrl);
          showToast('পরিচালকের ছবি সফলভাবে আপলোড হয়েছে!');
        }
        setIsUploading(false);
      };
      img.onerror = () => {
        setIsUploading(false);
        showToast('ছবি প্রসেসিংয়ে সমস্যা হয়েছে, আবার চেষ্টা করুন');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    setCustomUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('দয়া করে পরিচালকের পুরো নাম লিখুন');
      return;
    }

    const finalImage = form.image?.trim() || customUrl.trim() || PRESET_AVATARS[0];

    const finalMember: TeamMember = {
      ...form,
      name: form.name.trim(),
      role: form.role.trim() || 'পরিচালনা পর্ষদ সদস্য',
      initials: form.name.trim().charAt(0) || 'ম',
      image: finalImage,
      phone: form.phone?.trim() || ''
    };

    if (isEditing) {
      updateTeamMember(finalMember);
    } else {
      addTeamMember(finalMember);
    }
    closeTeamModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473] my-8">
        <button
          onClick={closeTeamModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b pb-4 mb-5">
          <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
            পরিচালনা পর্ষদ নিয়ন্ত্রণ
          </span>
          <h3 className="text-xl font-bold text-[#0f2922]">
            {isEditing ? 'পরিচালকের তথ্য ও ছবি সম্পাদন' : 'নতুন পরিচালক / সদস্য যোগ করুন'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            আমাদের সম্পর্কে ও পরিচালনা পর্ষদ সেকশনে প্রদর্শিত পরিচালকদের তথ্য ও ছবি আপডেট করুন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              পরিচালকের পুরো নাম *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="উদাঃ আলহাজ্ব মোঃ রাজু মিয়া"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                পদবী / দায়িত্ব *
              </label>
              <input
                type="text"
                required
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="উদাঃ প্রতিষ্ঠাতা ও চেয়ারম্যান / ব্যবস্থাপনা পরিচালক"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                অনুমোদন স্ট্যাটাস
              </label>
              <select
                value={form.isApproved !== false ? 'true' : 'false'}
                onChange={(e) => setForm({ ...form, isApproved: e.target.value === 'true' })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              >
                <option value="true">✓ অনুমোদিত ও ওয়েবসাইটে দৃশ্যমান</option>
                <option value="false">⏳ ড্রাফট / লুকানো</option>
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              যোগাযোগ ফোন নম্বর (ঐচ্ছিক)
            </label>
            <input
              type="tel"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="উদাঃ 01768232501"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          {/* Photo Upload Section */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <label className="block text-xs font-bold text-stone-800">
              পরিচালকের ছবি (Device Upload & URL)
            </label>

            {/* Current Photo Preview and Actions */}
            <div className="flex items-center gap-4">
              {form.image ? (
                <div className="relative group shrink-0">
                  <img
                    src={form.image}
                    alt={form.name || 'Preview'}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#DCB473] shadow-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-md hover:bg-rose-700 transition-colors"
                    title="ছবি মুছুন"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-stone-200 border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1.5 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'প্রসেসিং হচ্ছে...' : 'মোবাইল / কম্পিউটার থেকে ছবি আপলোড'}</span>
                </button>
                <p className="text-[11px] text-stone-500">
                  জেপিজি, পিএনজি বা ওয়েবপি ফাইল নির্বাচন করুন (অটো কম্প্রেস হয়ে সেভ হবে)।
                </p>
              </div>
            </div>

            {/* Or Online Image Link */}
            <div className="pt-2 border-t border-stone-200/80">
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                অথবা ছবির অনলাইন লিঙ্ক (Image URL):
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setForm({ ...form, image: e.target.value });
                }}
                placeholder="https://images.unsplash.com/... বা অন্য কোনো ছবির লিংক"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#DCB473]"
              />
            </div>

            {/* Quick Presets */}
            <div className="pt-1">
              <span className="text-[11px] text-stone-500 block mb-1">বা ডিফল্ট ডামি ছবি বাছাই করুন:</span>
              <div className="flex gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, image: url });
                      setCustomUrl(url);
                    }}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      form.image === url ? 'border-[#0f2922] scale-105 shadow-md' : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={closeTeamModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'তথ্য সংরক্ষণ করুন' : 'পরিচালক যুক্ত করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
