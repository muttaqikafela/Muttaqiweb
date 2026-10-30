import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { TeamMember } from '../types';
import { X, Save, Users, Sparkles } from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80'
];

export const TeamEditModal: React.FC = () => {
  const { editingTeamModal, closeTeamModal, addTeamMember, updateTeamMember } = useAdmin();

  const [form, setForm] = useState<TeamMember>({
    id: '',
    name: '',
    role: 'ব্যবস্থাপনা পরিচালক',
    image: PRESET_AVATARS[0],
    initials: 'ম',
    isApproved: true
  });

  useEffect(() => {
    if (editingTeamModal && editingTeamModal !== 'new') {
      setForm(editingTeamModal);
    } else if (editingTeamModal === 'new') {
      setForm({
        id: 'team-' + Date.now(),
        name: '',
        role: 'ব্যবস্থাপনা পরিচালক',
        image: PRESET_AVATARS[0],
        initials: 'ম',
        isApproved: true
      });
    }
  }, [editingTeamModal]);

  if (!editingTeamModal) return null;

  const isEditing = editingTeamModal !== 'new';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const finalMember: TeamMember = {
      ...form,
      name: form.name.trim(),
      role: form.role.trim() || 'পরিচালনা পর্ষদ সদস্য',
      initials: form.name.trim().charAt(0) || 'ম',
      image: form.image?.trim() || PRESET_AVATARS[0]
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
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b pb-4 mb-6">
          <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
            পরিচালনা পর্ষদ নিয়ন্ত্রণ
          </span>
          <h3 className="text-xl font-bold text-[#0f2922]">
            {isEditing ? 'সদস্যের তথ্য সম্পাদন করুন' : 'নতুন পরিচালনা সদস্য যুক্ত করুন'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            আমাদের সম্পর্কে পাতায় প্রদর্শিত পরিচালনা পর্ষদের সদস্য তালিকা নিয়ন্ত্রণ করুন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              সদস্যের পুরো নাম *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="উদাঃ মোঃ রাজু মিয়া"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <option value="true">✓ অনুমোদিত ও লাইভ</option>
                <option value="false">⏳ ড্রাফট / লুকানো</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              প্রোফাইল ছবি লিংক (Image URL) *
            </label>
            <input
              type="url"
              required
              value={form.image || ''}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          {/* Quick Avatar presets */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#b88e44]" />
              <span>বা একটি ডিফল্ট প্রোফাইল ছবি নির্বাচন করুন:</span>
            </label>
            <div className="flex gap-2">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, image: url })}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    form.image === url ? 'border-[#0f2922] scale-105 shadow-md' : 'border-stone-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {form.image && (
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <img
                src={form.image}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#DCB473]"
              />
              <div>
                <p className="text-xs font-bold text-stone-900">{form.name || 'সদস্যের নাম'}</p>
                <p className="text-[11px] text-[#b88e44]">{form.role || 'পদবী'}</p>
              </div>
            </div>
          )}

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
              className="px-6 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'পরিবর্তন সংরক্ষণ করুন' : 'সদস্য যোগ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
