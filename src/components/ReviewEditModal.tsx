import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { ReviewItem } from '../types';
import { X, Save, Star } from 'lucide-react';

export const ReviewEditModal: React.FC = () => {
  const { editingReviewModal, closeReviewModal, addReview, updateReview } = useAdmin();

  const [form, setForm] = useState<ReviewItem>({
    id: '',
    name: '',
    location: '',
    packageTaken: 'পবিত্র ওমরাহ প্যাকেজ (১৫ দিন)',
    rating: 5,
    comment: '',
    date: new Date().toLocaleDateString('bn-BD'),
    isApproved: true
  });

  useEffect(() => {
    if (editingReviewModal && editingReviewModal !== 'new') {
      setForm(editingReviewModal);
    } else if (editingReviewModal === 'new') {
      setForm({
        id: 'rev-' + Date.now(),
        name: '',
        location: 'বগুড়া',
        packageTaken: 'পবিত্র ওমরাহ প্যাকেজ (১৫ দিন)',
        rating: 5,
        comment: '',
        date: new Date().toLocaleDateString('bn-BD'),
        isApproved: true
      });
    }
  }, [editingReviewModal]);

  if (!editingReviewModal) return null;

  const isEditing = editingReviewModal !== 'new';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.comment.trim()) return;

    const finalItem: ReviewItem = {
      ...form,
      name: form.name.trim(),
      location: form.location.trim() || 'বগুড়া',
      packageTaken: form.packageTaken.trim() || 'পবিত্র ওমরাহ প্যাকেজ',
      comment: form.comment.trim()
    };

    if (isEditing) {
      updateReview(finalItem);
    } else {
      addReview({
        name: finalItem.name,
        location: finalItem.location,
        packageTaken: finalItem.packageTaken,
        rating: finalItem.rating,
        comment: finalItem.comment
      });
    }
    closeReviewModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border-2 border-[#DCB473] my-8">
        <button
          onClick={closeReviewModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b pb-4 mb-6">
          <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
            মতামত ও রিভিউ নিয়ন্ত্রণ
          </span>
          <h3 className="text-xl font-bold text-[#0f2922]">
            {isEditing ? 'হাজীর মতামত সম্পাদন করুন' : 'নতুন রিভিউ যুক্ত করুন'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            হাজীদের অভিজ্ঞতা, রেটিং এবং অনুমোদন স্ট্যাটাস হালনাগাদ করুন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                হাজীর নাম *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="উদাঃ আলহাজ্ব মোঃ রফিকুল ইসলাম"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ঠিকানা / এলাকা
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="উদাঃ দুপচাঁচিয়া, বগুড়া"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                গৃহীত প্যাকেজের নাম
              </label>
              <input
                type="text"
                value={form.packageTaken}
                onChange={(e) => setForm({ ...form, packageTaken: e.target.value })}
                placeholder="উদাঃ পবিত্র ওমরাহ প্যাকেজ ২০২৬"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                রেটিং (স্টার)
              </label>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className={`text-xl transition-transform hover:scale-125 cursor-pointer ${
                      star <= form.rating ? 'text-amber-500' : 'text-stone-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs font-bold text-stone-600 ml-1">
                  ({form.rating}/৫)
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              অনুমোদন অবস্থা (ওয়েবসাইটে লাইভ প্রদর্শিত হবে কিনা)
            </label>
            <select
              value={form.isApproved ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, isApproved: e.target.value === 'true' })}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            >
              <option value="true">✓ অনুমোদিত (হোমপেজে লাইভ)</option>
              <option value="false">⏳ অননুমোদিত (ড্রাফট / অপেক্ষমাণ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              হাজীর মন্তব্য / রিভিউ বক্তব্য *
            </label>
            <textarea
              rows={4}
              required
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="মুত্তাকী কাফেলার সেবা নিয়ে অভিজ্ঞতা..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={closeReviewModal}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'পরিবর্তন সংরক্ষণ করুন' : 'রিভিউ যোগ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
