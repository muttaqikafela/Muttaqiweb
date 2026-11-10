import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ServiceItem } from '../types';
import { X, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const ServiceEditModal: React.FC = () => {
  const { editingServiceModal, closeServiceModal, addService, updateService } = useAdmin();

  const [form, setForm] = useState<ServiceItem>({
    id: '',
    title: '',
    subtitle: '',
    shortDesc: '',
    fullDesc: '',
    iconName: 'Sparkles',
    badge: '',
    features: ['', ''],
    isApproved: true
  });

  useEffect(() => {
    if (editingServiceModal && editingServiceModal !== 'new') {
      setForm({
        ...editingServiceModal,
        features: editingServiceModal.features?.length ? editingServiceModal.features : ['', '']
      });
    } else if (editingServiceModal === 'new') {
      setForm({
        id: 'svc-' + Date.now(),
        title: '',
        subtitle: '',
        shortDesc: '',
        fullDesc: '',
        iconName: 'Sparkles',
        badge: '',
        features: ['', ''],
        isApproved: true
      });
    }
  }, [editingServiceModal]);

  if (!editingServiceModal) return null;

  const isEditing = editingServiceModal !== 'new';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const cleanedFeatures = form.features.map((f) => f.trim()).filter(Boolean);
    const finalItem: ServiceItem = {
      ...form,
      title: form.title.trim(),
      shortDesc: form.shortDesc.trim(),
      fullDesc: form.fullDesc.trim() || form.shortDesc.trim(),
      features: cleanedFeatures.length > 0 ? cleanedFeatures : ['বিশেষ সুযোগ-সুবিধা ও সার্বক্ষণিক দিকনির্দেশনা']
    };

    if (isEditing) {
      updateService(finalItem);
    } else {
      addService(finalItem);
    }
    closeServiceModal();
  };

  const handleAddFeature = () => {
    setForm({ ...form, features: [...form.features, ''] });
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...form.features];
    updated[index] = val;
    setForm({ ...form, features: updated });
  };

  const handleRemoveFeature = (index: number) => {
    setForm({
      ...form,
      features: form.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473] my-8">
        <button
          onClick={closeServiceModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b pb-4 mb-6">
          <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
            এডমিন কন্ট্রোল
          </span>
          <h3 className="text-xl font-bold text-[#0f2922]">
            {isEditing ? `"${form.title}" সেবা সম্পাদন করুন` : 'নতুন সেবা যুক্ত করুন'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            সেবার শিরোনাম, বিবরণ, আইকন ও বৈশিষ্ট্যসমূহ আপডেট করুন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                সেবার শিরোনাম *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="উদাঃ পবিত্র হজ্ব ও ওমরাহ সেবা"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                উপশিরোনাম (Subtitle)
              </label>
              <input
                type="text"
                value={form.subtitle || ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="উদাঃ নির্ভরযোগ্য কাফেলা ও মোয়াল্লিম সেবা"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                আইকন নির্বাচন
              </label>
              <select
                value={form.iconName}
                onChange={(e) => setForm({ ...form, iconName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              >
                <option value="Kaaba">কাবা শরীফ (Kaaba)</option>
                <option value="Plane">বিমান (Plane)</option>
                <option value="FileCheck">ভিসা ফাইল (FileCheck)</option>
                <option value="Compass">কম্পাস (Compass)</option>
                <option value="Globe">বিশ্বভ্রমণ (Globe)</option>
                <option value="Users">গ্রুপ / কাফেলা (Users)</option>
                <option value="BookUser">গাইডলাইন (BookUser)</option>
                <option value="Sparkles">স্টার / স্পার্কল (Sparkles)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ব্যাজ / হাইলাইট ট্যাগ
              </label>
              <input
                type="text"
                value={form.badge || ''}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                placeholder="উদাঃ প্রাক-নিবন্ধন চলছে"
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
              সংক্ষিপ্ত বিবরণ (কার্ডে দেখাবে) *
            </label>
            <textarea
              rows={2}
              required
              value={form.shortDesc}
              onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
              placeholder="সংক্ষেপে সেবার মূল বিষয়..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              বিস্তারিত বিবরণ (মডালে দেখাবে) *
            </label>
            <textarea
              rows={4}
              required
              value={form.fullDesc}
              onChange={(e) => setForm({ ...form, fullDesc: e.target.value })}
              placeholder="সেবাটির পূর্ণাঙ্গ তথ্যাবলী..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          {/* Features Bullets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-stone-700">
                মূল বৈশিষ্ট্যসমূহ (Bullet points)
              </label>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-xs text-[#0f2922] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>আরেকটি লাইন যোগ করুন</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto p-1">
              {form.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-stone-400 font-mono w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder={`বৈশিষ্ট্য বা অফার ${idx + 1}`}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#DCB473]"
                  />
                  {form.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={closeServiceModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'পরিবর্তন সংরক্ষণ করুন' : 'নতুন সেবা যোগ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
