import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { GalleryItem } from '../types';
import { X, Save, Image as ImageIcon, Sparkles } from 'lucide-react';

const PRESET_IMAGES = [
  {
    label: 'পবিত্র কাবা শরীফ (তাওয়াফ)',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    category: 'holysites' as const
  },
  {
    label: 'মসজিদে নববী (মদিনা মুনাওয়ারা)',
    url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&auto=format&fit=crop&q=80',
    category: 'holysites' as const
  },
  {
    label: 'পবিত্র মক্কার ক্লক টাওয়ার ও হারাম এলাকা',
    url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800&auto=format&fit=crop&q=80',
    category: 'holysites' as const
  },
  {
    label: 'আরাফাত ময়দান ও জাবালে রহমত',
    url: 'https://images.unsplash.com/photo-1565552684305-7e77a28e932b?w=800&auto=format&fit=crop&q=80',
    category: 'hajj' as const
  },
  {
    label: 'পবিত্র মিনা ও তাঁবুর শহর',
    url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800&auto=format&fit=crop&q=80',
    category: 'hajj' as const
  },
  {
    label: 'মুত্তাকী হাজী কাফেলা ও প্রশিক্ষণ',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
    category: 'groups' as const
  }
];

export const GalleryEditModal: React.FC = () => {
  const { editingGalleryModal, closeGalleryModal, addGalleryItem, updateGalleryItem } = useAdmin();

  const [form, setForm] = useState<GalleryItem>({
    id: '',
    title: '',
    category: 'holysites',
    image: '',
    description: '',
    isApproved: true
  });

  useEffect(() => {
    if (editingGalleryModal && editingGalleryModal !== 'new') {
      setForm(editingGalleryModal);
    } else if (editingGalleryModal === 'new') {
      setForm({
        id: 'g-' + Date.now(),
        title: '',
        category: 'holysites',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        description: '',
        isApproved: true
      });
    }
  }, [editingGalleryModal]);

  if (!editingGalleryModal) return null;

  const isEditing = editingGalleryModal !== 'new';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image.trim()) return;

    const finalItem: GalleryItem = {
      ...form,
      title: form.title.trim() || 'মুত্তাকী কাফেলা ছবি',
      image: form.image.trim(),
      description: form.description?.trim()
    };

    if (isEditing) {
      updateGalleryItem(finalItem);
    } else {
      addGalleryItem(finalItem);
    }
    closeGalleryModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473] my-8">
        <button
          onClick={closeGalleryModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b pb-4 mb-6">
          <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
            গ্যালারি নিয়ন্ত্রণ
          </span>
          <h3 className="text-xl font-bold text-[#0f2922]">
            {isEditing ? 'ছবির তথ্য সম্পাদন করুন' : 'নতুন ছবি যোগ করুন'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            পবিত্র স্থান, হজ্ব, ওমরাহ অথবা কাফেলার ছবি সরাসরি যুক্ত বা সম্পাদন করুন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              ছবির শিরোনাম *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="উদাঃ পবিত্র কাবা চত্বর ও হাজীদের তাওয়াফ"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ক্যাটাগরি
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              >
                <option value="holysites">পবিত্র স্থানসমূহ (মক্কা ও মদিনা)</option>
                <option value="hajj">পবিত্র হজ্ব কাফেলা</option>
                <option value="umrah">ওমরাহ ও জিয়ারত</option>
                <option value="groups">কাফেলা ও প্রশিক্ষণ</option>
              </select>
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
              ছবির লিংক (Image URL) *
            </label>
            <input
              type="url"
              required
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          {/* Quick Preset Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#b88e44]" />
              <span>বা একটি দ্রুত রেডি ছবি নির্বাচন করুন:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_IMAGES.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      image: preset.url,
                      category: preset.category,
                      title: form.title || preset.label
                    });
                  }}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 hover:border-[#DCB473] transition-colors cursor-pointer ${
                    form.image === preset.url ? 'border-[#0f2922] bg-[#DCB473]/10' : 'border-stone-200 bg-stone-50'
                  }`}
                >
                  <img src={preset.url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <span className="text-[10px] font-medium text-stone-700 line-clamp-1">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview */}
          {form.image && (
            <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 max-h-48">
              <img
                src={form.image}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-md">
                লাইভ প্রিভিউ
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              ছোট ক্যাপশন / বিবরণ (ঐচ্ছিক)
            </label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="ছবি সম্পর্কিত অতিরিক্ত তথ্য..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={closeGalleryModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'পরিবর্তন সংরক্ষণ করুন' : 'ছবি যোগ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
