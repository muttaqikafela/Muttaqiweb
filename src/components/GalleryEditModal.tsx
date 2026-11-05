import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { GalleryItem } from '../types';
import { SupabaseService } from '../services/supabaseService';
import {
  X,
  Save,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Link2,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

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
  const { editingGalleryModal, closeGalleryModal, addGalleryItem, updateGalleryItem, showToast } =
    useAdmin();

  const [form, setForm] = useState<GalleryItem>({
    id: '',
    title: '',
    category: 'holysites',
    image: '',
    permanentLinkUrl: '',
    description: '',
    isApproved: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deviceImageSelected, setDeviceImageSelected] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (editingGalleryModal && editingGalleryModal !== 'new') {
      setForm(editingGalleryModal);
      setDeviceImageSelected(null);
      setUploadError(null);
      setIsLinkCopied(false);
    } else if (editingGalleryModal === 'new') {
      const newId = 'g-' + Date.now();
      setForm({
        id: newId,
        title: '',
        category: 'holysites',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
        permanentLinkUrl: '',
        description: '',
        isApproved: true
      });
      setDeviceImageSelected(null);
      setUploadError(null);
      setIsLinkCopied(false);
    }
  }, [editingGalleryModal]);

  if (!editingGalleryModal) return null;

  const isEditing = editingGalleryModal !== 'new';

  // Compress uploaded file to optimize storage and speed
  const processAndCompressFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1400;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('ছবি প্রসেস করতে ব্যর্থ হয়েছে'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('ফাইল পড়তে ব্যর্থ হয়েছে'));
      reader.readAsDataURL(file);
    });
  };

  const handleDeviceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('শুধুমাত্র ইমেজ ফাইল (JPG, PNG, WEBP) আপলোড করুন।');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('ছবির আকার সর্বোচ্চ ১৫ মেগাবাইট পর্যন্ত হতে পারে।');
      return;
    }

    setUploadError(null);
    try {
      const dataUrl = await processAndCompressFile(file);
      setDeviceImageSelected(dataUrl);
      // Auto-preview it immediately
      setForm((prev) => ({
        ...prev,
        image: dataUrl,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').slice(0, 40)
      }));
      showToast('ছবি সফলভাবে লোড হয়েছে! নিচের "স্থায়ী লিংক তৈরি করুন" বাটনে চাপুন।');
    } catch (err: any) {
      setUploadError('ছবি আপলোডে সমস্যা হয়েছে। অন্য একটি ছবি দিয়ে চেষ্টা করুন।');
    }
  };

  // Generate permanent link that persists even after local file removal
  const handleGeneratePermanentLink = async () => {
    const currentImg = deviceImageSelected || form.image;
    if (!currentImg) {
      setUploadError('প্রথমে ডিভাইস থেকে ছবি আপলোড করুন অথবা ছবির ইউআরএল দিন।');
      return;
    }

    setIsGeneratingLink(true);
    setUploadError(null);

    try {
      const permanentLink = await SupabaseService.savePermanentGalleryMedia(
        form.id || `g-${Date.now()}`,
        form.title || 'মুত্তাকী গ্যালারি ছবি',
        currentImg
      );

      setForm((prev) => ({
        ...prev,
        image: permanentLink,
        permanentLinkUrl: permanentLink
      }));

      showToast('✓ স্থায়ী ছবি লিংক সফলভাবে তৈরি হয়েছে! ডিভাইস থেকে ছবি মুছে দিলেও এটি আজীবন সক্রিয় থাকবে।');
    } catch (err: any) {
      setUploadError('স্থায়ী লিংক তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyPermanentLink = () => {
    const linkToCopy = form.permanentLinkUrl || form.image;
    if (!linkToCopy) return;

    navigator.clipboard.writeText(linkToCopy).then(() => {
      setIsLinkCopied(true);
      showToast('স্থায়ী ছবি লিংক ক্লিপবোর্ডে কপি করা হয়েছে!');
      setTimeout(() => setIsLinkCopied(false), 2500);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image.trim()) return;

    const finalItem: GalleryItem = {
      ...form,
      title: form.title.trim() || 'মুত্তাকী কাফেলা ছবি',
      image: form.image.trim(),
      permanentLinkUrl: form.permanentLinkUrl || form.image.trim(),
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
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473] my-8 max-h-[92vh] overflow-y-auto">
        <button
          onClick={closeGalleryModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b pb-4 mb-5">
          <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
            গ্যালারি নিয়ন্ত্রণ ও স্থায়ী ক্লাউড স্টোরেজ
          </span>
          <h3 className="text-xl font-bold text-[#0f2922]">
            {isEditing ? 'ছবির তথ্য সম্পাদন ও লিংক নিয়ন্ত্রণ' : 'নতুন ছবি আপলোড ও স্থায়ী লিংক তৈরি'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            ডিভাইস থেকে সরাসরি ছবি আপলোড করে স্থায়ী লিংক তৈরি করুন। পরবর্তীতে ডিভাইস থেকে ছবি মুছে ফেললেও লিংককৃত ছবি দৃশ্যমান থাকবে।
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

          {/* DEVICE UPLOAD & PERMANENT LINK CREATION SECTION */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-dashed border-[#DCB473]/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0f2922] flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#DCB473]" />
                <span>ডিভাইস থেকে ছবি আপলোড ও লিংক জেনারেটর</span>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                অফলাইন সেফ / পার্মানেন্ট
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDeviceFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-700 flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>📂 ডিভাইস থেকে ছবি আপলোড করুন</span>
              </button>

              <button
                type="button"
                onClick={handleGeneratePermanentLink}
                disabled={isGeneratingLink || (!deviceImageSelected && !form.image)}
                className="py-2.5 px-4 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-xs shrink-0"
              >
                <Link2 className="w-4 h-4" />
                <span>{isGeneratingLink ? 'লিংক তৈরি হচ্ছে...' : '🔗 স্থায়ী ছবি লিংক তৈরি করুন'}</span>
              </button>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </p>
            )}

            {/* Permanent Link Info Banner */}
            {form.permanentLinkUrl && (
              <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>✓ স্থায়ী ক্লাউড লিংক প্রস্তুত (ছবি রিমুভ করলেও দৃশ্যমান থাকবে)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPermanentLink}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs cursor-pointer"
                  >
                    {isLinkCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{isLinkCopied ? 'কপি হয়েছে' : 'লিংক কপি করুন'}</span>
                  </button>
                </div>
                <div className="p-1.5 bg-white rounded-lg border border-emerald-200 font-mono text-[10px] text-stone-600 truncate select-all">
                  {form.permanentLinkUrl}
                </div>
                <p className="text-[10px] text-emerald-800 leading-relaxed">
                  💡 <strong>নিশ্চয়তা:</strong> এই ছবির ডাটা স্থায়ীভাবে সিস্টেমে সংরক্ষিত হয়েছে। আপনার মোবাইল বা কম্পিউটার থেকে মূল ফাইলটি মুছে ফেললেও ওয়েবসাইটে ও গ্যালারিতে ছবিটি সবসময় প্রদর্শিত হবে।
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
              <span>ছবির কার্যকর লিংক (Image URL) *</span>
              {form.permanentLinkUrl && (
                <span className="text-[10px] text-emerald-700 font-semibold">
                  (স্থায়ী লিংক যুক্ত আছে)
                </span>
              )}
            </label>
            <input
              type="text"
              required
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="https://... অথবা উপরের স্থায়ী লিংক"
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
                      permanentLinkUrl: preset.url,
                      category: preset.category,
                      title: form.title || preset.label
                    });
                    setDeviceImageSelected(null);
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
              <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-[#DCB473]" />
                <span>লাইভ প্রিভিউ {form.permanentLinkUrl ? '(স্থায়ী লিংক সক্রিয়)' : ''}</span>
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
              <span>{isEditing ? 'পরিবর্তন সংরক্ষণ করুন' : 'ছবি ও লিংক সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
