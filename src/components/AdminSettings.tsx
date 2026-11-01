import React, { useState, useEffect } from 'react';
import { useSite, DEFAULT_SITE_SETTINGS, DEFAULT_TYPOGRAPHY, type SiteSettings, type DeveloperCredit } from '../context/SiteContext';
import { useAdmin } from '../context/AdminContext';
import {
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Check,
  Type,
  Code,
  User,
  Upload,
  ImageIcon
} from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300';
const labelCls = 'block text-xs font-bold text-stone-700 mb-1.5';

export const AdminSettings: React.FC = () => {
  const { siteSettings, saveSiteSettings, resetSiteSettings, developerCredit, saveDeveloperCredit } = useSite();
  const { companyInfo, updateCompanyInfo, showToast, isSubAdmin, adminCredentials, updateAdminCredentials } = useAdmin();
  const [form, setForm] = useState<SiteSettings>(siteSettings);
  const [companyForm, setCompanyForm] = useState(companyInfo);
  const [devCreditForm, setDevCreditForm] = useState<DeveloperCredit>(developerCredit);

  useEffect(() => {
    setDevCreditForm(developerCredit);
  }, [developerCredit]);

  // Admin login credentials state
  const [adminEmailInput, setAdminEmailInput] = useState(adminCredentials.email);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminPassConfirm, setAdminPassConfirm] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  const fileToDataUrl = (file: File, cb: (url: string) => void) => {
    const r = new FileReader();
    r.onload = () => cb(String(r.result));
    r.readAsDataURL(file);
  };

  const fileToCompressedDataUrl = (file: File, cb: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          cb(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          cb(String(e.target?.result));
        }
      };
      img.onerror = () => cb(String(e.target?.result));
      img.src = String(e.target?.result);
    };
    reader.readAsDataURL(file);
  };
  const setBody = (k: keyof SiteSettings['body'], v: string) =>
    setForm({ ...form, body: { ...form.body, [k]: v } });
  const setFooter = (k: keyof SiteSettings['footer'], v: string | SiteSettings['footer']['quickLinks']) =>
    setForm({ ...form, footer: { ...form.footer, [k]: v } as SiteSettings['footer'] });
  const setTheme = (k: keyof SiteSettings['theme'], v: string) =>
    setForm({ ...form, theme: { ...form.theme, [k]: v } });
  const setTypography = (k: keyof SiteSettings['typography'], v: string) =>
    setForm({ ...form, typography: { ...(form.typography || DEFAULT_TYPOGRAPHY), [k]: v } });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubAdmin) {
      showToast('সাব-এডমিন একাউন্ট থেকে তথ্য পরিবর্তন করা যাবে না (রিড-অনলি মোড)!');
      return;
    }
    await saveSiteSettings(form);
    updateCompanyInfo(companyForm);
    await saveDeveloperCredit(devCreditForm);
    showToast('সেটিংস ও ডেভেলপার তথ্য সফলভাবে সংরক্ষিত হয়েছে');
  };

  const handleSaveAdminCredentials = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSubAdmin) {
      showToast('সাব-এডমিন একাউন্ট থেকে এডমিন লগইন তথ্য পরিবর্তন করা যাবে না!');
      return;
    }
    const cleanEmail = adminEmailInput.trim();
    if (!cleanEmail) {
      showToast('ইউজার আইডি বা ইমেইল খালি রাখা যাবে না!');
      return;
    }
    if (adminPassInput) {
      if (adminPassInput.length < 6) {
        showToast('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!');
        return;
      }
      if (adminPassInput !== adminPassConfirm) {
        showToast('নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না!');
        return;
      }
      updateAdminCredentials({ email: cleanEmail, password: adminPassInput });
      setAdminPassInput('');
      setAdminPassConfirm('');
    } else {
      updateAdminCredentials({ email: cleanEmail, password: adminCredentials.password });
    }
  };

  const themeFields: [keyof SiteSettings['theme'], string][] = [
    ['primary', 'Primary'],
    ['accent', 'Accent'],
    ['headerBg', 'Header'],
    ['footerBg', 'Footer'],
    ['buttonBg', 'Button'],
    ['background', 'Background'],
    ['text', 'Text']
  ];

  return (
    <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#0f2922]">সাধারণ সেটিংস</h2>
          <p className="text-xs text-stone-500">সব সেটিংস একসাথে সংরক্ষণ করুন — সংরক্ষণের সাথে সাথে পাবলিক সাইটে প্রযোজ্য হবে।</p>
        </div>
      </div>

      {/* ADMIN LOGIN CREDENTIALS MANAGEMENT */}
      <section className="bg-gradient-to-r from-[#0f2922]/5 to-[#164438]/10 border-2 border-[#DCB473]/50 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-stone-200">
          <div className="w-8 h-8 rounded-xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center font-bold">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f2922]">এডমিন ইউজার আইডি ও পাসওয়ার্ড পরিবর্তন</h3>
            <p className="text-xs text-stone-500">
              আপনি আপনার এডমিন লগইন ইমেইল/ইউজার আইডি ও পাসওয়ার্ড যেকোনো সময় পরিবর্তন করতে পারবেন
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3.5">
          <div>
            <label className={labelCls}>এডমিন ইউজার আইডি / ইমেইল</label>
            <input
              type="text"
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              placeholder="এডমিন ইমেইল বা আইডি"
              className={inputCls}
            />
            <p className="text-[11px] text-stone-500 mt-1">
              বর্তমান আইডি: <strong className="font-mono text-[#0f2922]">{adminCredentials.email}</strong>
            </p>
          </div>

          <div>
            <label className={labelCls}>নতুন পাসওয়ার্ড (পরিবর্তন করতে চাইলে)</label>
            <div className="relative">
              <input
                type={showAdminPass ? 'text' : 'password'}
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setShowAdminPass(!showAdminPass)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>নতুন পাসওয়ার্ড পুনরায় লিখুন</label>
            <input
              type={showAdminPass ? 'text' : 'password'}
              value={adminPassConfirm}
              onChange={(e) => setAdminPassConfirm(e.target.value)}
              placeholder="পাসওয়ার্ড কনফার্ম করুন"
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveAdminCredentials}
            className="px-5 py-2.5 bg-[#0f2922] hover:bg-[#163c32] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>এডমিন আইডি ও পাসওয়ার্ড সংরক্ষণ করুন</span>
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold">১. হেডার ও লোগো</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>সাইটের নাম (বাংলা)</label>
            <input value={form.siteNameBn} onChange={(e) => setForm({ ...form, siteNameBn: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Site name (English)</label>
            <input value={form.siteNameEn} onChange={(e) => setForm({ ...form, siteNameEn: e.target.value })} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>ট্যাগলাইন</label>
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) fileToDataUrl(f, (u) => setForm({ ...form, logoUrl: u })); }} className="text-xs" />
          {form.logoUrl && (
            <>
              <img src={form.logoUrl} alt="logo preview" className="w-12 h-12 object-contain border rounded" />
              <button type="button" onClick={() => setForm({ ...form, logoUrl: '' })} className="text-xs font-bold text-rose-600">লোগো সরান</button>
            </>
          )}
        </div>
        <div className="p-4 rounded-2xl border" style={{ background: form.theme.headerBg, color: '#fff' }}>
          <p className="text-xs text-stone-300">লাইভ হেডার প্রিভিউ</p>
          <p className="font-bold">{form.siteNameBn} <span className="font-normal text-sm">— {form.tagline}</span></p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold">২. ডোমেইন ও ফেভিকন</h3>
        <div>
          <label className={labelCls}>ডোমেইন</label>
          <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className={inputCls} />
          <p className="text-xs text-stone-500 mt-1">হেডার, ফুটার ও যোগাযোগ পাতায় এই ডোমেইন দেখানো হবে।</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) fileToDataUrl(f, (u) => setForm({ ...form, faviconUrl: u })); }} className="text-xs" />
          {form.faviconUrl && (
            <>
              <img src={form.faviconUrl} alt="favicon preview" className="w-8 h-8 object-contain border rounded" />
              <button type="button" onClick={() => setForm({ ...form, faviconUrl: '' })} className="text-xs font-bold text-rose-600">ফেভিকন সরান</button>
            </>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold">৩. বডি কনটেন্ট</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {(Object.keys(form.body) as (keyof SiteSettings['body'])[]).map((k) => (
            <div key={k}>
              <label className={labelCls}>{k}</label>
              <input value={form.body[k]} onChange={(e) => setBody(k, e.target.value)} className={inputCls} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold">৪. ফুটার সেটআপ</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>পরিচিতি (Intro)</label>
            <textarea value={form.footer.intro} onChange={(e) => setFooter('intro', e.target.value)} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ঠিকানা</label>
            <input value={form.footer.address} onChange={(e) => setFooter('address', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ফোন / ইমেইল</label>
            <input value={form.footer.phone || companyForm.phone1Display} onChange={(e) => setFooter('phone', e.target.value)} className={inputCls} placeholder="ফোন" />
          </div>
          <div>
            <label className={labelCls}>ফেসবুক লিংক</label>
            <input value={form.footer.facebook} onChange={(e) => setFooter('facebook', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ইউটিউব লিংক</label>
            <input value={form.footer.youtube} onChange={(e) => setFooter('youtube', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>হোয়াটসঅ্যাপ লিংক</label>
            <input value={form.footer.whatsapp} onChange={(e) => setFooter('whatsapp', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>অফিস সময়</label>
            <input value={form.footer.officeHours} onChange={(e) => setFooter('officeHours', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>উক্তি (Quote)</label>
            <input value={form.footer.quote} onChange={(e) => setFooter('quote', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>কপিরাইট লাইন</label>
            <input value={form.footer.copyright} onChange={(e) => setFooter('copyright', e.target.value)} className={inputCls} placeholder="খালি থাকলে ডিফল্ট কপিরাইট দেখাবে" />
          </div>
        </div>
        <div>
          <label className={labelCls}>কুইক লিংক (প্রতি লাইনে একটি: লেবেল)</label>
          <textarea
            value={form.footer.quickLinks.map((q) => q.label).join('\n')}
            onChange={(e) =>
              setFooter(
                'quickLinks',
                e.target.value.split('\n').filter(Boolean).map((label, i) => ({
                  label,
                  page: form.footer.quickLinks[i]?.page || 'home'
                }))
              )
            }
            rows={5}
            className={inputCls}
          />
        </div>
        <div className="p-4 rounded-2xl border text-sm" style={{ background: form.theme.footerBg, color: '#e7e5e4' }}>
          <p className="text-xs text-stone-400">লাইভ ফুটার প্রিভিউ</p>
          <p className="font-bold text-white">{form.siteNameBn}</p>
          <p>{form.footer.intro}</p>
          <p>{form.footer.address} • {form.footer.officeHours}</p>
          <p className="italic">{form.footer.quote}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 border-t pt-4">
          <div>
            <label className={labelCls}>যোগাযোগ ফোন (কোম্পানি তথ্য)</label>
            <input value={companyForm.phone1Display} onChange={(e) => setCompanyForm({ ...companyForm, phone1Display: e.target.value, phone1: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>যোগাযোগ ইমেইল (কোম্পানি তথ্য)</label>
            <input value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} className={inputCls} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-bold">৫. ডিজাইন রঙ</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {themeFields.map(([k, label]) => (
            <div key={k} className="flex items-center gap-2">
              <input type="color" value={form.theme[k]} onChange={(e) => setTheme(k, e.target.value)} className="w-10 h-10 p-0 border rounded cursor-pointer" />
              <div className="flex-1">
                <label className={labelCls}>{label}</label>
                <input value={form.theme[k]} onChange={(e) => setTheme(k, e.target.value)} className={inputCls} />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-2xl border" style={{ background: form.theme.background, color: form.theme.text }}>
          <p className="font-bold" style={{ color: form.theme.primary }}>কম্বাইন্ড লাইভ প্রিভিউ</p>
          <p>হেডার/বাটন/ফুটার রঙ এখানে দেখা যাবে।</p>
          <button type="button" className="mt-2 px-4 py-2 rounded-xl text-white font-bold text-xs" style={{ background: form.theme.buttonBg }}>
            বাটন প্রিভিউ
          </button>
        </div>
        <button type="button" onClick={() => setForm({ ...form, theme: DEFAULT_SITE_SETTINGS.theme })} className="text-xs font-bold text-stone-600 underline">
          রঙ ডিফল্টে ফিরিয়ে আনুন
        </button>
      </section>

      {/* Section 6: Manual Font Customization for Header, Body, and Footer */}
      <section className="space-y-5 pt-4 border-t border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-[#0f2922] flex items-center gap-2">
              <Type className="w-5 h-5 text-[#DCB473]" />
              <span>৬. হেডার, বডি ও ফুটারের লেখার ফন্ট ম্যানুয়ালি নির্বাচন</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              হেডার মেনু, বডি কনটেন্ট এবং ফুটারের বাংলা লেখার জন্য আপনার পছন্দের ফন্ট স্টাইল নির্বাচন করুন।
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, typography: DEFAULT_TYPOGRAPHY })}
            className="text-xs font-bold text-[#b88e44] hover:underline self-start sm:self-auto cursor-pointer"
          >
            ফন্ট ডিফল্টে ফিরিয়ে আনুন
          </button>
        </div>

        {/* 3 Font Selectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Header Font Selector */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0f2922] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0f2922]" />
                <span>হেডার লেখার ফন্ট (Header)</span>
              </label>
              <span className="text-[10px] text-[#DCB473] font-bold bg-[#0f2922] px-2 py-0.5 rounded-md">
                মেনু ও লোগো
              </span>
            </div>
            <select
              value={form.typography?.headerFont || DEFAULT_TYPOGRAPHY.headerFont}
              onChange={(e) => setTypography('headerFont', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            >
              <option value="'Noto Serif Bengali', 'Tiro Bangla', serif">পত্রিকা সেরিফ (Noto Serif Bengali)</option>
              <option value="'Tiro Bangla', 'Noto Serif Bengali', serif">ক্ল্যাসিক্যাল পত্রিকা (Tiro Bangla)</option>
              <option value="'Hind Siliguri', sans-serif">আধুনিক সান্স-সেরিফ (Hind Siliguri)</option>
              <option value="'Noto Sans Bengali', sans-serif">পরিষ্কার সান্স (Noto Sans Bengali)</option>
              <option value="'Anek Bangla', sans-serif">আনেক বাংলা (Anek Bangla)</option>
              <option value="'Kalpurush', 'Noto Serif Bengali', serif">কালপুরুষ লিপিকার (Kalpurush)</option>
              <option value="'SolaimanLipi', 'Noto Serif Bengali', serif">সোলাইমান লিপি (SolaimanLipi)</option>
              <option value="Georgia, 'Noto Serif Bengali', serif">সিস্টেম ক্লাসিক সেরিফ (Georgia)</option>
              <option value="system-ui, -apple-system, sans-serif">সিস্টেম ডিফল্ট (System UI)</option>
            </select>
            <div
              className="p-3 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs"
              style={{ fontFamily: form.typography?.headerFont || DEFAULT_TYPOGRAPHY.headerFont }}
            >
              <p className="font-bold text-[#0f2922] text-sm">মুত্তাকী হজ্ব ও কন্সাল্টেন্সি</p>
              <p className="text-stone-500 text-[11px] mt-0.5">হোম • প্যাকেজ • সেবাসমূহ • গ্যালারি</p>
            </div>
          </div>

          {/* Body Font Selector */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0f2922] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>বডি লেখার ফন্ট (Body Content)</span>
              </label>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                মূল পেইজ ও লেখা
              </span>
            </div>
            <select
              value={form.typography?.bodyFont || DEFAULT_TYPOGRAPHY.bodyFont}
              onChange={(e) => setTypography('bodyFont', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            >
              <option value="'Noto Serif Bengali', 'Tiro Bangla', serif">পত্রিকা সেরিফ (Noto Serif Bengali)</option>
              <option value="'Tiro Bangla', 'Noto Serif Bengali', serif">ক্ল্যাসিক্যাল পত্রিকা (Tiro Bangla)</option>
              <option value="'Hind Siliguri', sans-serif">আধুনিক সান্স-সেরিফ (Hind Siliguri)</option>
              <option value="'Noto Sans Bengali', sans-serif">পরিষ্কার সান্স (Noto Sans Bengali)</option>
              <option value="'Anek Bangla', sans-serif">আনেক বাংলা (Anek Bangla)</option>
              <option value="'Kalpurush', 'Noto Serif Bengali', serif">কালপুরুষ লিপিকার (Kalpurush)</option>
              <option value="'SolaimanLipi', 'Noto Serif Bengali', serif">সোলাইমান লিপি (SolaimanLipi)</option>
              <option value="Georgia, 'Noto Serif Bengali', serif">সিস্টেম ক্লাসিক সেরিফ (Georgia)</option>
              <option value="system-ui, -apple-system, sans-serif">সিস্টেম ডিফল্ট (System UI)</option>
            </select>
            <div
              className="p-3 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs"
              style={{ fontFamily: form.typography?.bodyFont || DEFAULT_TYPOGRAPHY.bodyFont }}
            >
              <p className="font-bold text-stone-800">পবিত্র হজ্ব ও ওমরাহ সেবায় বিশ্বস্ত কাফেলা</p>
              <p className="text-stone-600 text-[11px] mt-0.5 leading-relaxed">
                অভিজ্ঞ আলেম ও মোয়াল্লিমদের সার্বক্ষণিক দিকনির্দেশনায় পবিত্র সফর সম্পন্ন করুন।
              </p>
            </div>
          </div>

          {/* Footer Font Selector */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0f2922] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b88e44]" />
                <span>ফুটার লেখার ফন্ট (Footer)</span>
              </label>
              <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                নিচের অংশ
              </span>
            </div>
            <select
              value={form.typography?.footerFont || DEFAULT_TYPOGRAPHY.footerFont}
              onChange={(e) => setTypography('footerFont', e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            >
              <option value="'Noto Serif Bengali', 'Tiro Bangla', serif">পত্রিকা সেরিফ (Noto Serif Bengali)</option>
              <option value="'Tiro Bangla', 'Noto Serif Bengali', serif">ক্ল্যাসিক্যাল পত্রিকা (Tiro Bangla)</option>
              <option value="'Hind Siliguri', sans-serif">আধুনিক সান্স-সেরিফ (Hind Siliguri)</option>
              <option value="'Noto Sans Bengali', sans-serif">পরিষ্কার সান্স (Noto Sans Bengali)</option>
              <option value="'Anek Bangla', sans-serif">আনেক বাংলা (Anek Bangla)</option>
              <option value="'Kalpurush', 'Noto Serif Bengali', serif">কালপুরুষ লিপিকার (Kalpurush)</option>
              <option value="'SolaimanLipi', 'Noto Serif Bengali', serif">সোলাইমান লিপি (SolaimanLipi)</option>
              <option value="Georgia, 'Noto Serif Bengali', serif">সিস্টেম ক্লাসিক সেরিফ (Georgia)</option>
              <option value="system-ui, -apple-system, sans-serif">সিস্টেম ডিফল্ট (System UI)</option>
            </select>
            <div
              className="p-3 rounded-xl bg-[#0b1e19] text-white border border-stone-700 text-xs shadow-2xs"
              style={{ fontFamily: form.typography?.footerFont || DEFAULT_TYPOGRAPHY.footerFont }}
            >
              <p className="font-bold text-[#DCB473]">আল্লাহর ঘরের মেহমানদের সেবাই আমাদের ইবাদত</p>
              <p className="text-stone-300 text-[11px] mt-0.5">মদিনা শপিং কমপ্লেক্স, দুপচাঁচিয়া, বগুড়া</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: DEVELOPER PROFILE & FOOTER CREDIT */}
      <section className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-bold text-base text-[#0f2922] flex items-center gap-2">
              <Code className="w-5 h-5 text-[#DCB473]" />
              <span>৭. ওয়েবসাইট ডেভেলপার পরিচিতি ও ফুটার ক্রেডিট</span>
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              ওয়েবসাইটের ফুটারে প্রদর্শিত ডেভেলপার নাম, ছবি, ঠিকানা ও যোগাযোগ তথ্য সম্পাদন করুন (ক্লাউডে স্থায়ীভাবে সংরক্ষিত থাকবে)
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <label className={labelCls}>ডেভেলপারের পূর্ণ নাম</label>
            <input
              type="text"
              value={devCreditForm.name}
              onChange={(e) => setDevCreditForm({ ...devCreditForm, name: e.target.value })}
              placeholder="যেমন: মোঃ সিহাবুল ইসলাম"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>যোগাযোগ ফোন নম্বর</label>
            <input
              type="text"
              value={devCreditForm.phone}
              onChange={(e) => setDevCreditForm({ ...devCreditForm, phone: e.target.value })}
              placeholder="যেমন: +8801700-000000"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>ডেভেলপার ইমেইল</label>
            <input
              type="email"
              value={devCreditForm.email}
              onChange={(e) => setDevCreditForm({ ...devCreditForm, email: e.target.value })}
              placeholder="যেমন: sizu111@gmail.com"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>ডেভেলপারের ঠিকানা (Address / Location)</label>
            <input
              type="text"
              value={devCreditForm.address || ''}
              onChange={(e) => setDevCreditForm({ ...devCreditForm, address: e.target.value })}
              placeholder="যেমন: দুপচাঁচিয়া, বগুড়া, বাংলাদেশ"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>হোয়াটসঅ্যাপ লিংক বা নম্বর</label>
            <input
              type="text"
              value={devCreditForm.whatsapp}
              onChange={(e) => setDevCreditForm({ ...devCreditForm, whatsapp: e.target.value })}
              placeholder="যেমন: https://wa.me/8801700000000"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>ফেসবুক প্রোফাইল URL</label>
            <input
              type="text"
              value={devCreditForm.facebook}
              onChange={(e) => setDevCreditForm({ ...devCreditForm, facebook: e.target.value })}
              placeholder="যেমন: https://facebook.com/username"
              className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>ইউটিউব চ্যানেল URL</label>
            <input
              type="text"
              value={devCreditForm.youtube}
              onChange={(e) => setDevCreditForm({ ...devCreditForm, youtube: e.target.value })}
              placeholder="যেমন: https://youtube.com/@channel"
              className={inputCls}
            />
          </div>

          {/* Photo */}
          <div className="sm:col-span-2 pt-1">
            <label className={labelCls}>ডেভেলপার ছবি (Photo)</label>
            <div className="flex flex-wrap items-center gap-4">
              {devCreditForm.photoUrl ? (
                <img
                  src={devCreditForm.photoUrl}
                  alt="Developer"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#DCB473] shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-[220px] space-y-2">
                <input
                  type="text"
                  value={devCreditForm.photoUrl}
                  onChange={(e) => setDevCreditForm({ ...devCreditForm, photoUrl: e.target.value })}
                  placeholder="ছবির সরাসরি অনলাইন URL দিন (অথবা নিচে আপলোড করুন)"
                  className={inputCls}
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
                        if (f) fileToCompressedDataUrl(f, (url) => setDevCreditForm({ ...devCreditForm, photoUrl: url }));
                      }}
                    />
                  </label>
                  {devCreditForm.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setDevCreditForm({ ...devCreditForm, photoUrl: '' })}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      ছবি সরান
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-between items-center border-t pt-4">
        <button type="button" onClick={() => { resetSiteSettings(); setForm(DEFAULT_SITE_SETTINGS); }} className="text-xs text-stone-500 hover:text-rose-600 font-bold">
          সব সেটিংস ডিফল্টে রিসেট করুন
        </button>
        <button type="submit" className="px-6 py-2.5 bg-[#0f2922] text-white font-bold rounded-xl text-sm">
          সব সেটিংস সংরক্ষণ করুন
        </button>
      </div>
    </form>
  );
};
