import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useSite, type AdSlot, type DeveloperCredit } from '../context/SiteContext';
import {
  Code,
  Globe,
  Radio,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Phone,
  Mail,
  Share2,
  Layout,
  MessageSquare
} from 'lucide-react';

export const DeveloperPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    inquiries,
    updateInquiryStatus,
    deleteInquiry,
    openInquiryModal,
    services,
    toggleServiceApproval,
    deleteService,
    openServiceModal,
    teamMembers,
    toggleTeamApproval,
    deleteTeamMember,
    openTeamModal,
    galleryItems,
    toggleGalleryApproval,
    deleteGalleryItem,
    openGalleryModal,
    reviews,
    toggleReviewApproval,
    deleteReview,
    openReviewModal,
    contactMessages,
    deleteMessage,
    showToast
  } = useAdmin();

  const {
    developerCredit,
    saveDeveloperCredit,
    ads,
    saveAds,
    developerChangePassword
  } = useSite();

  const [tab, setTab] = useState<'credit' | 'ads' | 'global' | 'password'>('credit');
  const [credit, setCredit] = useState<DeveloperCredit>(developerCredit);
  const [newAd, setNewAd] = useState<Partial<AdSlot>>({
    page: 'all',
    provider: 'adsterra',
    slotName: '',
    adCode: '',
    adLink: '',
    position: 'top',
    isEnabled: true
  });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const fileToDataUrl = (file: File, cb: (url: string) => void) => {
    const r = new FileReader();
    r.onload = () => cb(String(r.result));
    r.readAsDataURL(file);
  };

  const handleSaveCredit = () => {
    saveDeveloperCredit(credit);
    showToast('ডেভেলপার তথ্য ও ফুটার ক্রেডিট সফলভাবে সংরক্ষিত হয়েছে।');
  };

  const handleSaveAd = () => {
    if (!newAd.slotName) {
      showToast('বিজ্ঞাপন স্লট নাম দিন।');
      return;
    }

    if (editingAdId) {
      saveAds(
        ads.map((a) => (a.id === editingAdId ? ({ ...a, ...newAd, id: editingAdId } as AdSlot) : a))
      );
      setEditingAdId(null);
      showToast('বিজ্ঞাপন স্লট আপডেট করা হয়েছে।');
    } else {
      saveAds([
        ...ads,
        {
          ...(newAd as AdSlot),
          id: 'ad-' + Date.now(),
          isEnabled: true
        }
      ]);
      showToast('নতুন বিজ্ঞাপন সফলভাবে যুক্ত হয়েছে।');
    }

    setNewAd({
      page: 'all',
      provider: 'adsterra',
      slotName: '',
      adCode: '',
      adLink: '',
      position: 'top',
      isEnabled: true
    });
  };

  const handleEditAd = (ad: AdSlot) => {
    setEditingAdId(ad.id);
    setNewAd({ ...ad });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditAd = () => {
    setEditingAdId(null);
    setNewAd({
      page: 'all',
      provider: 'adsterra',
      slotName: '',
      adCode: '',
      adLink: '',
      position: 'top',
      isEnabled: true
    });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto border border-[#DCB473]/40">
        {/* Top Header */}
        <div className="flex justify-between items-center pb-4 mb-5 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center font-bold">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0f2922]">
                ডেভেলপার কন্ট্রোল প্যানেল
              </h2>
              <p className="text-xs text-stone-500">
                বিজ্ঞাপন লিংক, ফুটার ডেভেলপার পরিচিতি ও সম্পূর্ণ ডাটাবেজ নিয়ন্ত্রণ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 mb-6 bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
          {[
            { id: 'credit', label: 'ডেভেলপার ফুটার পরিচিতি', icon: Globe },
            { id: 'ads', label: `বিজ্ঞাপন নেটওয়ার্ক ও লিংক (${ads.length})`, icon: Radio },
            { id: 'global', label: 'গ্লোবাল কন্টেন্ট কন্ট্রোল', icon: Layout },
            { id: 'password', label: 'পাসওয়ার্ড পরিবর্তন', icon: KeyRound }
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0f2922] text-[#DCB473] shadow-md'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DEVELOPER CREDITS IN FOOTER */}
        {tab === 'credit' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
              <strong>ফুটার ডেভেলপার প্রোফাইল:</strong> এখানে প্রদত্ত আপনার নাম, ছবি, যোগাযোগ নম্বর, ইমেইল ও সোশ্যাল প্রোফাইল লিংক ওয়েবসাইটের ফুটারে ক্রেডিটে প্রদর্শিত হবে।
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ডেভেলপারের পূর্ণ নাম</label>
                <input
                  type="text"
                  value={credit.name}
                  onChange={(e) => setCredit({ ...credit, name: e.target.value })}
                  placeholder="যেমন: মোঃ সিহাবুল ইসলাম"
                  className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#DCB473] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">যোগাযোগ ফোন নম্বর</label>
                <input
                  type="text"
                  value={credit.phone}
                  onChange={(e) => setCredit({ ...credit, phone: e.target.value })}
                  placeholder="যেমন: +8801700-000000"
                  className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#DCB473] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ডেভেলপার ইমেইল</label>
                <input
                  type="email"
                  value={credit.email}
                  onChange={(e) => setCredit({ ...credit, email: e.target.value })}
                  placeholder="যেমন: sizu111@gmail.com"
                  className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#DCB473] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">হোয়াটসঅ্যাপ লিংক বা নম্বর</label>
                <input
                  type="text"
                  value={credit.whatsapp}
                  onChange={(e) => setCredit({ ...credit, whatsapp: e.target.value })}
                  placeholder="যেমন: https://wa.me/8801700000000"
                  className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#DCB473] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ফেসবুক প্রোফাইল URL</label>
                <input
                  type="text"
                  value={credit.facebook}
                  onChange={(e) => setCredit({ ...credit, facebook: e.target.value })}
                  placeholder="যেমন: https://facebook.com/username"
                  className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#DCB473] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ইউটিউব চ্যানেল URL</label>
                <input
                  type="text"
                  value={credit.youtube}
                  onChange={(e) => setCredit({ ...credit, youtube: e.target.value })}
                  placeholder="যেমন: https://youtube.com/@channel"
                  className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#DCB473] outline-none"
                />
              </div>
            </div>

            {/* Photo Section */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">ডেভেলপার ছবি (Photo)</label>
              <div className="flex flex-wrap items-center gap-4">
                {credit.photoUrl ? (
                  <img
                    src={credit.photoUrl}
                    alt="Developer Profile"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#DCB473] shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-[240px] space-y-2">
                  <input
                    type="text"
                    value={credit.photoUrl}
                    onChange={(e) => setCredit({ ...credit, photoUrl: e.target.value })}
                    placeholder="ছবির সরাসরি অনলাইন URL দিন (অথবা নিচে আপলোড করুন)"
                    className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-xl outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#DCB473]" />
                      <span>ডিভাইস থেকে ছবি আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) fileToDataUrl(f, (url) => setCredit({ ...credit, photoUrl: url }));
                        }}
                      />
                    </label>
                    {credit.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setCredit({ ...credit, photoUrl: '' })}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        ছবি সরান
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleSaveCredit}
                className="px-6 py-2.5 bg-[#0f2922] hover:bg-[#163c32] text-[#DCB473] font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>ফুটার ক্রেডিট সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ADS NETWORK & LINKS */}
        {tab === 'ads' && (
          <div className="space-y-6">
            {/* Form for new/editing ad */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0f2922]">
                  {editingAdId ? 'বিজ্ঞাপন স্লট সম্পাদনা' : 'নতুন বিজ্ঞাপন স্লট / লিংক যুক্ত করুন'}
                </h3>
                {editingAdId && (
                  <button
                    onClick={handleCancelEditAd}
                    className="text-xs text-stone-500 hover:text-stone-800 underline"
                  >
                    বাতিল করুন
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিজ্ঞাপনের নাম / শিরোনাম</label>
                  <input
                    value={newAd.slotName || ''}
                    onChange={(e) => setNewAd({ ...newAd, slotName: e.target.value })}
                    placeholder="যেমন: Adsterra ব্যানার / Google Ads শীর্ষ"
                    className="w-full px-3 py-2 text-sm border bg-white rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">প্রোভাইডার</label>
                  <select
                    value={newAd.provider || 'adsterra'}
                    onChange={(e) => setNewAd({ ...newAd, provider: e.target.value as AdSlot['provider'] })}
                    className="w-full px-3 py-2 text-sm border bg-white rounded-xl outline-none"
                  >
                    <option value="adsterra">Adsterra</option>
                    <option value="google_ads">Google AdSense / Ads</option>
                    <option value="custom">Custom Banner / Affiliate</option>
                    <option value="other">Other Network</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">কোন পেইজে দেখাবে</label>
                  <select
                    value={newAd.page || 'all'}
                    onChange={(e) => setNewAd({ ...newAd, page: e.target.value })}
                    className="w-full px-3 py-2 text-sm border bg-white rounded-xl outline-none"
                  >
                    <option value="all">সকল পেইজ (All Pages)</option>
                    <option value="home">হোম পেইজ (Home)</option>
                    <option value="services">সেবাসমূহ পেইজ (Services)</option>
                    <option value="about">আমাদের সম্পর্কে পেইজ (About)</option>
                    <option value="gallery">গ্যালারি পেইজ (Gallery)</option>
                    <option value="contact">যোগাযোগ পেইজ (Contact)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">অবস্থান (Position)</label>
                  <select
                    value={newAd.position || 'top'}
                    onChange={(e) => setNewAd({ ...newAd, position: e.target.value })}
                    className="w-full px-3 py-2 text-sm border bg-white rounded-xl outline-none"
                  >
                    <option value="top">শীর্ষে (Top)</option>
                    <option value="middle">মাঝখানে (Middle)</option>
                    <option value="bottom">নিচে (Bottom)</option>
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">ক্লিক লিংক URL (Ad Link)</label>
                  <input
                    value={newAd.adLink || ''}
                    onChange={(e) => setNewAd({ ...newAd, adLink: e.target.value })}
                    placeholder="যেমন: https://your-affiliate-or-adsterra-direct-link.com"
                    className="w-full px-3 py-2 text-sm border bg-white rounded-xl outline-none"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-stone-700 mb-1">বিজ্ঞাপন স্ক্রিপ্ট বা HTML কোড (ঐচ্ছিক)</label>
                  <textarea
                    value={newAd.adCode || ''}
                    onChange={(e) => setNewAd({ ...newAd, adCode: e.target.value })}
                    placeholder="Adsterra / Google AdSense স্ক্রিপ্ট বা আইফ্রেম কোড পেস্ট করুন"
                    rows={3}
                    className="w-full px-3 py-2 text-xs font-mono border bg-white rounded-xl outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveAd}
                className="px-5 py-2.5 bg-[#0f2922] hover:bg-[#163c32] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm cursor-pointer shadow-sm transition-all"
              >
                {editingAdId ? 'বিজ্ঞাপন স্লট আপডেট করুন' : '+ বিজ্ঞাপন স্লট যুক্ত করুন'}
              </button>
            </div>

            {/* List of active ads */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-sm text-stone-800">
                সংরক্ষিত বিজ্ঞাপন স্লটসমূহ ({ads.length})
              </h4>
              {ads.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
                  এখনও কোনো বিজ্ঞাপন স্লট যুক্ত করা হয়নি। উপরের ফর্ম থেকে Adsterra বা Google Ads লিংক যুক্ত করুন।
                </div>
              ) : (
                ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex flex-col sm:flex-row justify-between sm:items-center p-3.5 border border-stone-200 rounded-2xl bg-white gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0f2922]">{ad.slotName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ad.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {ad.isEnabled ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয়'}
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                          {ad.provider}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">
                        পেইজ: <strong>{ad.page}</strong> | অবস্থান: <strong>{ad.position}</strong>
                        {ad.adLink && <span className="ml-2 text-blue-600 truncate max-w-xs inline-block align-bottom">{ad.adLink}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          saveAds(ads.map((x) => (x.id === ad.id ? { ...x, isEnabled: !x.isEnabled } : x)))
                        }
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold text-stone-700 cursor-pointer"
                      >
                        {ad.isEnabled ? 'বন্ধ করুন' : 'চালু করুন'}
                      </button>
                      <button
                        onClick={() => handleEditAd(ad)}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        এডিট
                      </button>
                      <button
                        onClick={() => saveAds(ads.filter((x) => x.id !== ad.id))}
                        className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL DATA MANAGEMENT */}
        {tab === 'global' && (
          <div className="space-y-6 text-xs sm:text-sm">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950">
              <strong>ডেভেলপার গ্লোবাল ম্যানেজমেন্ট:</strong> আপনি ওয়েবসাইটের সকল ডাটা (হাজী নিবন্ধন, সেবাসমূহ, টিম মেম্বার, ফটো গ্যালারি, রিভিউ ও যোগাযোগ বার্তা) সরাসরি অনুমোদন, পেন্ডিং, এডিট বা ডিলিট করতে পারবেন।
            </div>

            {/* Inquiries / Haji */}
            <section className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
              <h3 className="font-bold text-sm text-[#0f2922]">
                হাজী নিবন্ধন ও আবেদন ({inquiries.length})
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {inquiries.slice(0, 30).map((i) => (
                  <div key={i.id} className="flex justify-between items-center bg-white border border-stone-200 rounded-xl p-2.5 text-xs">
                    <div>
                      <span className="font-bold text-stone-800">{i.name}</span>
                      <span className="text-stone-500 ml-2">({i.phone})</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${i.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {i.status}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => updateInquiryStatus(i.id, 'approved')} className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-bold">Approve</button>
                      <button onClick={() => updateInquiryStatus(i.id, 'pending')} className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold">Pending</button>
                      <button onClick={() => openInquiryModal(i)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">Edit</button>
                      <button onClick={() => deleteInquiry(i.id)} className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Services */}
            <section className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
              <h3 className="font-bold text-sm text-[#0f2922]">
                সেবাসমূহ ({services.length})
              </h3>
              <div className="space-y-1.5">
                {services.map((s) => (
                  <div key={s.id} className="flex justify-between items-center bg-white border border-stone-200 rounded-xl p-2.5 text-xs">
                    <div>
                      <span className="font-bold text-stone-800">{s.title}</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${s.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {s.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleServiceApproval(s.id)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">
                        {s.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button onClick={() => openServiceModal(s)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">Edit</button>
                      <button onClick={() => deleteService(s.id)} className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Team Members */}
            <section className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
              <h3 className="font-bold text-sm text-[#0f2922]">
                পরিচালনা পর্ষদ ও সদস্য ({teamMembers.length})
              </h3>
              <div className="space-y-1.5">
                {teamMembers.map((m) => (
                  <div key={m.id} className="flex justify-between items-center bg-white border border-stone-200 rounded-xl p-2.5 text-xs">
                    <div>
                      <span className="font-bold text-stone-800">{m.name}</span>
                      <span className="text-stone-500 ml-1">({m.role})</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${m.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {m.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleTeamApproval(m.id)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">
                        {m.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button onClick={() => openTeamModal(m)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">Edit</button>
                      <button onClick={() => deleteTeamMember(m.id)} className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Gallery Items */}
            <section className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
              <h3 className="font-bold text-sm text-[#0f2922]">
                ফটো গ্যালারি ({galleryItems.length})
              </h3>
              <div className="space-y-1.5">
                {galleryItems.map((g) => (
                  <div key={g.id} className="flex justify-between items-center bg-white border border-stone-200 rounded-xl p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      {g.image && <img src={g.image} alt={g.title} className="w-8 h-8 rounded-lg object-cover" />}
                      <span className="font-bold text-stone-800">{g.title}</span>
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${g.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {g.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleGalleryApproval(g.id)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">
                        {g.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button onClick={() => openGalleryModal(g)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">Edit</button>
                      <button onClick={() => deleteGalleryItem(g.id)} className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
              <h3 className="font-bold text-sm text-[#0f2922]">
                রিভিউ ও হাজীদের মন্তব্য ({reviews.length})
              </h3>
              <div className="space-y-1.5">
                {reviews.map((r) => (
                  <div key={r.id} className="flex justify-between items-center bg-white border border-stone-200 rounded-xl p-2.5 text-xs">
                    <div>
                      <span className="font-bold text-stone-800">{r.name}</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${r.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {r.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleReviewApproval(r.id)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">
                        {r.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button onClick={() => openReviewModal(r)} className="px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg font-bold">Edit</button>
                      <button onClick={() => deleteReview(r.id)} className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Messages */}
            <section className="bg-stone-50 border border-stone-200 p-4 rounded-2xl space-y-2">
              <h3 className="font-bold text-sm text-[#0f2922]">
                যোগাযোগ বার্তা ({contactMessages.length})
              </h3>
              <div className="space-y-1.5">
                {contactMessages.map((msg) => (
                  <div key={msg.id} className="flex justify-between items-center bg-white border border-stone-200 rounded-xl p-2.5 text-xs">
                    <div>
                      <span className="font-bold text-stone-800">{msg.name}</span>
                      <span className="text-stone-500 ml-2">({msg.phone || msg.email})</span>
                      <p className="text-stone-600 text-[11px] truncate max-w-sm">{msg.message}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => deleteMessage(msg.id)} className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 4: PASSWORD CHANGE */}
        {tab === 'password' && (
          <div className="space-y-3.5 max-w-md">
            <p className="text-xs text-stone-500">
              ডেভেলপারের নতুন পাসওয়ার্ড সেট করতে নিচে বর্তমান পাসওয়ার্ড ও নতুন পাসওয়ার্ড দিন। শুধুমাত্র সল্টেড SHA-256 হ্যাশ সংরক্ষিত থাকে।
            </p>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">বর্তমান পাসওয়ার্ড</label>
              <input
                type="password"
                value={cur}
                onChange={(e) => setCur(e.target.value)}
                placeholder="বর্তমান পাসওয়ার্ড দিন"
                className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">নতুন পাসওয়ার্ড</label>
              <input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর)"
                className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">নতুন পাসওয়ার্ড নিশ্চিতকরণ</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                className="w-full px-3.5 py-2 text-sm border border-stone-200 rounded-xl outline-none"
              />
            </div>
            <button
              onClick={async () => {
                if (next !== confirm || next.length < 4) {
                  showToast('নতুন পাসওয়ার্ড মিলছে না বা খুব ছোট (কমপক্ষে ৪ অক্ষর)।');
                  return;
                }
                const ok = await developerChangePassword(cur, next);
                showToast(ok ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।' : 'বর্তমান পাসওয়ার্ড ভুল হয়েছে।');
                if (ok) {
                  setCur('');
                  setNext('');
                  setConfirm('');
                }
              }}
              className="px-5 py-2.5 bg-[#0f2922] hover:bg-[#163c32] text-[#DCB473] font-bold rounded-xl text-sm transition-all shadow-md cursor-pointer"
            >
              পাসওয়ার্ড পরিবর্তন করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
