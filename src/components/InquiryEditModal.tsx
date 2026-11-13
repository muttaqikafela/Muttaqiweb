import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Wallet,
  Upload,
  Trash2,
  Plus,
  Calendar,
  Mail,
  MapPin,
  Check,
  Clock,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

export const InquiryEditModal: React.FC = () => {
  const {
    editingInquiryModal,
    closeInquiryModal,
    updateInquiry,
    addInquiry,
    inquiries,
    kafelaGroups,
    pricingConfig,
    linkHajiCompanion,
    unlinkHajiCompanion,
    isSubAdmin,
    showToast
  } = useAdmin();

  const groupsOccupancy = useMemo(
    () => getAllGroupsOccupancy(kafelaGroups, inquiries),
    [kafelaGroups, inquiries]
  );

  const isCreateMode = editingInquiryModal === 'new-haji';
  const [form, setForm] = useState<InquiryItem | null>(null);
  const [modalCompanionSelect, setModalCompanionSelect] = useState<string>('');
  const [selectedIncidentalIds, setSelectedIncidentalIds] = useState<string[]>([]);
  const [sameAsPresent, setSameAsPresent] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Client-side image compression helper to keep storage lightweight
  const compressImage = (file: File, maxWidth = 800, quality = 0.72): Promise<string> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = (e.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'photo' | 'signature' | 'nid' | 'passport' | 'receipt'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !form) return;

    try {
      const result = await compressImage(file, 800, 0.75);
      if (type === 'photo') {
        setForm((prev) => prev ? { ...prev, photoUrl: result } : null);
      } else if (type === 'signature') {
        setForm((prev) => prev ? { ...prev, signatureUrl: result } : null);
      } else if (type === 'nid') {
        setForm((prev) => prev ? { ...prev, nidDocUrl: result } : null);
      } else if (type === 'passport') {
        setForm((prev) => prev ? { ...prev, passportDocUrl: result } : null);
      } else if (type === 'receipt') {
        setForm((prev) => prev ? { ...prev, paymentReceiptUrl: result, paymentReceiptName: file.name } : null);
      }
      showToast('ফাইল সফলভাবে আপলোড করা হয়েছে!');
    } catch {
      showToast('ফাইল আপলোড করতে সমস্যা হয়েছে!');
    }
  };

  const clearFile = (type: 'photo' | 'signature' | 'nid' | 'passport' | 'receipt') => {
    if (!form) return;
    if (type === 'photo') {
      setForm((prev) => prev ? { ...prev, photoUrl: undefined } : null);
    } else if (type === 'signature') {
      setForm((prev) => prev ? { ...prev, signatureUrl: undefined } : null);
    } else if (type === 'nid') {
      setForm((prev) => prev ? { ...prev, nidDocUrl: undefined } : null);
    } else if (type === 'passport') {
      setForm((prev) => prev ? { ...prev, passportDocUrl: undefined } : null);
    } else if (type === 'receipt') {
      setForm((prev) => prev ? { ...prev, paymentReceiptUrl: undefined, paymentReceiptName: undefined } : null);
    }
  };

  // Partner count parser
  const getPartnerCount = (partnerStr?: string): number => {
    if (!partnerStr || partnerStr.includes('০ জন')) return 0;
    if (partnerStr.includes('১ জন')) return 1;
    if (partnerStr.includes('২ জন')) return 2;
    if (partnerStr.includes('৩ জন')) return 3;
    if (partnerStr.includes('৪ জন')) return 4;
    if (partnerStr.includes('৫ জন')) return 5;
    if (partnerStr.includes('৬+ জন')) return 6;
    const match = partnerStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Initialize or update form
  useEffect(() => {
    if (editingInquiryModal === 'new-haji') {
      const pkg = pricingConfig.packages[0];
      const room = pricingConfig.rooms[0];
      const air = pricingConfig.airfares[0];
      const defaultIncidentals = pricingConfig.incidentals.slice(0, 3);
      const incTotal = defaultIncidentals.reduce((sum, item) => sum + item.price, 0);
      const initialPerPerson = (pkg?.price || 0) + (room?.price || 0) + (air?.price || 0) + incTotal;
      const ref = `HAJI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      setForm({
        id: `inq-${Date.now()}`,
        name: '',
        nameBn: '',
        nameEn: '',
        phone: '',
        email: '',
        fatherNameBn: '',
        fatherNameEn: '',
        motherNameBn: '',
        motherNameEn: '',
        presentAddress: '',
        presentPostCode: '',
        permanentAddress: '',
        permanentPostCode: '',
        nidNo: '',
        passportNo: '',
        guardianPhone: '',
        dateOfBirth: '',
        totalHajPartner: '০ জন (একক হাজী)',
        hajPartnerIdLink: '',
        partnerDetails: '',
        serviceId: 'haji-full-registration',
        serviceName: pkg?.title || 'পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)',
        selectedGroup: kafelaGroups[0]?.name || 'Group-A',
        roomPreference: room?.title || 'শেয়ারিং ইকোনমি রুম (৪-৫ জন)',
        airfareOption: air?.title || 'বাংলাদেশ বিমান / সাউদিয়া ডিরেক্ট ফ্লাইট (ইকোনমি)',
        travelers: '১ জন (নিবন্ধনকৃত)',
        travelersCount: 1,
        packageBasePrice: pkg?.price || 0,
        roomPrice: room?.price || 0,
        airfarePrice: air?.price || 0,
        incidentalItems: defaultIncidentals.map((i) => ({ id: i.id, title: i.title, price: i.price })),
        incidentalPrice: incTotal,
        perPersonTotal: initialPerPerson,
        subtotalAmount: initialPerPerson,
        finalTotalAmount: initialPerPerson,
        discountPercent: 0,
        discountAmount: 0,
        paidAmount: 0,
        dueAmount: initialPerPerson,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'ব্যাংক ডিপোজিট',
        registrationType: 'haji',
        registrationRef: ref,
        hajiUserId: ref,
        hajiPassword: 'Haji12',
        date: new Date().toLocaleDateString('bn-BD'),
        status: 'approved',
        adminNotes: 'এডমিন কর্তৃক সরাসরি নিবন্ধিত'
      });
      setSelectedIncidentalIds(defaultIncidentals.map((i) => i.id));
      setSameAsPresent(false);
    } else if (editingInquiryModal) {
      const latest = inquiries.find((i) => i.id === editingInquiryModal.id) || editingInquiryModal;
      setForm(latest);
      if (latest.incidentalItems && latest.incidentalItems.length > 0) {
        setSelectedIncidentalIds(latest.incidentalItems.map((i) => i.id));
      } else {
        setSelectedIncidentalIds(pricingConfig.incidentals.slice(0, 3).map((i) => i.id));
      }
      setSameAsPresent(
        Boolean(
          latest.presentAddress &&
          latest.permanentAddress &&
          latest.presentAddress === latest.permanentAddress
        )
      );
    }
  }, [editingInquiryModal, inquiries, pricingConfig, kafelaGroups]);

  if (!editingInquiryModal || !form || isSubAdmin) return null;

  // Selected package, room, airfare, incidentals
  const selectedPackage =
    pricingConfig.packages.find((p) => p.title === form.serviceName) ||
    pricingConfig.packages[0];

  const selectedRoom =
    pricingConfig.rooms.find((r) => r.title === form.roomPreference) ||
    pricingConfig.rooms[0];

  const selectedAirfare =
    pricingConfig.airfares.find((a) => a.title === form.airfareOption) ||
    pricingConfig.airfares[0];

  const selectedIncidentals = pricingConfig.incidentals.filter((inc) =>
    selectedIncidentalIds.includes(inc.id)
  );

  const recalculateAmounts = (
    updatedFields: Partial<InquiryItem>,
    customIncidentalIds?: string[]
  ) => {
    const current = { ...form, ...updatedFields };
    const incIds = customIncidentalIds !== undefined ? customIncidentalIds : selectedIncidentalIds;
    const currentIncidentals = pricingConfig.incidentals.filter((inc) => incIds.includes(inc.id));
    const incTotal = currentIncidentals.reduce((sum, item) => sum + item.price, 0);

    const curPkg = pricingConfig.packages.find((p) => p.title === current.serviceName) || selectedPackage;
    const curRoom = pricingConfig.rooms.find((r) => r.title === current.roomPreference) || selectedRoom;
    const curAir = pricingConfig.airfares.find((a) => a.title === current.airfareOption) || selectedAirfare;

    const pCount = getPartnerCount(current.totalHajPartner);
    const travelersCount = 1 + pCount;

    const pkgPrice = curPkg?.price || 0;
    const roomPrice = curRoom?.price || 0;
    const airPrice = curAir?.price || 0;

    const perPerson = pkgPrice + roomPrice + airPrice + incTotal;
    const subtotal = perPerson * travelersCount;

    const pct = Math.max(0, Math.min(100, Number(current.discountPercent) || 0));
    const discAmt = Math.round((subtotal * pct) / 100);
    const finalTotal = Math.max(0, subtotal - discAmt);
    const paid = Math.max(0, Number(current.paidAmount) || 0);
    const due = Math.max(0, finalTotal - paid);

    setForm({
      ...current,
      packageBasePrice: pkgPrice,
      roomPrice,
      airfarePrice: airPrice,
      incidentalItems: currentIncidentals.map((i) => ({ id: i.id, title: i.title, price: i.price })),
      incidentalPrice: incTotal,
      perPersonTotal: perPerson,
      travelersCount,
      travelers: current.totalHajPartner && !current.totalHajPartner.includes('০ জন')
        ? `১+ (${current.totalHajPartner})`
        : '১ জন (নিবন্ধনকৃত)',
      subtotalAmount: subtotal,
      discountAmount: discAmt,
      finalTotalAmount: finalTotal,
      paidAmount: paid,
      dueAmount: due
    });
  };

  const handlePackageChange = (packageName: string) => {
    recalculateAmounts({ serviceName: packageName });
  };

  const handleRoomChange = (roomTitle: string) => {
    recalculateAmounts({ roomPreference: roomTitle });
  };

  const handleAirfareChange = (airTitle: string) => {
    recalculateAmounts({ airfareOption: airTitle });
  };

  const handlePartnerChange = (partnerStr: string) => {
    recalculateAmounts({ totalHajPartner: partnerStr });
  };

  const toggleIncidental = (incId: string) => {
    const next = selectedIncidentalIds.includes(incId)
      ? selectedIncidentalIds.filter((id) => id !== incId)
      : [...selectedIncidentalIds, incId];
    setSelectedIncidentalIds(next);
    recalculateAmounts({}, next);
  };

  const handleSameAddressToggle = (checked: boolean) => {
    setSameAsPresent(checked);
    if (checked && form) {
      setForm({
        ...form,
        permanentAddress: form.presentAddress,
        permanentPostCode: form.presentPostCode
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nameBn?.trim() && !form.name?.trim()) {
      showToast('অনুগ্রহ করে হাজীর নাম প্রদান করুন!');
      return;
    }
    if (!form.phone?.trim()) {
      showToast('অনুগ্রহ করে মোবাইল নম্বর প্রদান করুন!');
      return;
    }

    const finalName = form.nameBn?.trim() || form.name?.trim() || 'হাজী আবেদনকারী';
    const finalUserId = form.hajiUserId?.trim() || form.phone?.trim() || form.registrationRef;

    if (isCreateMode) {
      addInquiry({
        ...form,
        name: finalName,
        nameBn: finalName,
        phone: form.phone.trim(),
        hajiUserId: finalUserId,
        hajiPassword: form.hajiPassword?.trim() || 'Haji12',
        registrationType: 'haji',
        serviceId: 'haji-full-registration',
        status: form.status || 'approved',
        approvedAt: form.status === 'approved' ? new Date().toLocaleDateString('bn-BD') : undefined
      });
      showToast(`আলহাজ্ব "${finalName}" সফলভাবে ডাটাবেজে যুক্ত ও অনুমোদিত হয়েছে!`);
    } else {
      updateInquiry({
        ...form,
        name: finalName,
        nameBn: finalName,
        phone: form.phone.trim(),
        hajiUserId: finalUserId,
        approvedAt:
          form.status === 'approved' && !form.approvedAt
            ? new Date().toLocaleDateString('bn-BD')
            : form.approvedAt
      });
      showToast(`আলহাজ্ব "${finalName}" এর তথ্য সফলভাবে আপডেট হয়েছে!`);
    }
    closeInquiryModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative border-2 border-[#DCB473] my-6 max-h-[92vh] overflow-y-auto">
        <button
          onClick={closeInquiryModal}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Banner */}
        <div className="border-b pb-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider">
              {isCreateMode ? 'নতুন হাজী নিবন্ধন' : 'বুকিং ও আবেদন ব্যবস্থাপনা'}
            </span>
            <span className="text-[10px] font-bold bg-emerald-700 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              হাজী পূর্ণাঙ্গ রেজিস্ট্রেশন ফরম
            </span>
            {form.registrationRef && (
              <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                রেফ: {form.registrationRef}
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#0f2922]">
            {isCreateMode
              ? 'নতুন হাজী নিবন্ধন ও হিসাব তৈরি (Add New Haji)'
              : 'হাজীর বিস্তারিত তথ্য ও ডকুমেন্টস (Admin Edit Mode)'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            হোমপেজের হাজী রেজিস্ট্রেশন ফরমের সকল ফিল্ড, প্যাকেজ রেট, রুম, বিমান, ডকুমেন্টস এবং পেমেন্ট লেজার এখানে সম্পূর্ণরূপে সংরক্ষিত ও সম্পাদনযোগ্য।
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ======================================================== */}
          {/* SECTION 1: ব্যক্তিগত তথ্য (Personal Information)          */}
          {/* ======================================================== */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-[#0f2922] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
              <User className="w-4 h-4 text-emerald-700" />
              ১. ব্যক্তিগত তথ্য (Personal Information)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  যাত্রী / আবেদনকারীর পূর্ণ নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আলহাজ্ব মো: রফিকুল ইসলাম"
                  value={form.nameBn || form.name}
                  onChange={(e) => setForm({ ...form, nameBn: e.target.value, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  নাম (ইংরেজি / Passport Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ALHAJ MD. RAFIQUL ISLAM"
                  value={form.nameEn || ''}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  পিতার নাম (বাংলা)
                </label>
                <input
                  type="text"
                  placeholder="পিতার নাম লিখুন"
                  value={form.fatherNameBn || ''}
                  onChange={(e) => setForm({ ...form, fatherNameBn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  পিতার নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  placeholder="Father Name (English)"
                  value={form.fatherNameEn || ''}
                  onChange={(e) => setForm({ ...form, fatherNameEn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মাতার নাম (বাংলা)
                </label>
                <input
                  type="text"
                  placeholder="মাতার নাম লিখুন"
                  value={form.motherNameBn || ''}
                  onChange={(e) => setForm({ ...form, motherNameBn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মাতার নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  placeholder="Mother Name (English)"
                  value={form.motherNameEn || ''}
                  onChange={(e) => setForm({ ...form, motherNameEn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  placeholder="01712-XXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  অভিভাবক / জরুরি যোগাযোগের মোবাইল নং
                </label>
                <input
                  type="text"
                  placeholder="০১৭০০-০০০০০০"
                  value={form.guardianPhone || ''}
                  onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  জাতীয় পরিচয়পত্র নম্বর (NID)
                </label>
                <input
                  type="text"
                  placeholder="NID নম্বর"
                  value={form.nidNo || ''}
                  onChange={(e) => setForm({ ...form, nidNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  পাসপোর্ট নম্বর
                </label>
                <input
                  type="text"
                  placeholder="পাসপোর্ট নম্বর"
                  value={form.passportNo || ''}
                  onChange={(e) => setForm({ ...form, passportNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  জন্ম তারিখ (DOB)
                </label>
                <input
                  type="date"
                  value={form.dateOfBirth || ''}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ইমেইল ঠিকানা (Email)
                </label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 2: ঠিকানা বিবরণী (Address Information)           */}
          {/* ======================================================== */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h4 className="text-xs font-bold text-[#0f2922] uppercase tracking-wider flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-700" />
                ২. ঠিকানা বিবরণী (Address Information)
              </h4>
              <label className="flex items-center gap-1.5 text-xs font-bold text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPresent}
                  onChange={(e) => handleSameAddressToggle(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>স্থায়ী ঠিকানা বর্তমান ঠিকানার অনুরূপ</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  বর্তমান ঠিকানা
                </label>
                <textarea
                  rows={2}
                  placeholder="গ্রাম / এলাকা, ডাকঘর, থানা ও জেলা"
                  value={form.presentAddress || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({
                      ...form,
                      presentAddress: val,
                      permanentAddress: sameAsPresent ? val : form.permanentAddress
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] text-stone-500 font-medium">পোস্ট কোড:</span>
                  <input
                    type="text"
                    placeholder="৫৮০০"
                    value={form.presentPostCode || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({
                        ...form,
                        presentPostCode: val,
                        permanentPostCode: sameAsPresent ? val : form.permanentPostCode
                      });
                    }}
                    className="w-24 px-2 py-0.5 text-xs font-mono rounded border border-stone-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  স্থায়ী ঠিকানা
                </label>
                <textarea
                  rows={2}
                  disabled={sameAsPresent}
                  placeholder="স্থায়ী ঠিকানা লিখুন"
                  value={sameAsPresent ? form.presentAddress : (form.permanentAddress || '')}
                  onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white disabled:bg-stone-100 disabled:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] text-stone-500 font-medium">পোস্ট কোড:</span>
                  <input
                    type="text"
                    disabled={sameAsPresent}
                    placeholder="৫৮০০"
                    value={sameAsPresent ? form.presentPostCode : (form.permanentPostCode || '')}
                    onChange={(e) => setForm({ ...form, permanentPostCode: e.target.value })}
                    className="w-24 px-2 py-0.5 text-xs font-mono rounded border border-stone-300 bg-white disabled:bg-stone-100 disabled:text-stone-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 3: কাফেলা গ্রুপ ও সহযাত্রী তথ্য                   */}
          {/* ======================================================== */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
            <h4 className="text-xs font-bold text-[#0f2922] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-emerald-200">
              <Users className="w-4 h-4 text-emerald-700" />
              ৩. কাফেলা গ্রুপ ও সহযাত্রী তথ্য (Kafela & Companions)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>কাফেলা গ্রুপ নির্বাচন *</span>
                  <span className="text-[10px] text-emerald-800 font-semibold">(সর্বোচ্চ ৫০ জন প্রতি গ্রুপ)</span>
                </label>
                <select
                  value={form.selectedGroup || ''}
                  onChange={(e) => setForm({ ...form, selectedGroup: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                >
                  <option value="">গ্রুপ নির্ধারণ করা নেই</option>
                  {groupsOccupancy.map((g) => (
                    <option key={g.group.id} value={g.group.name}>
                      {g.group.name} — {g.currentCount}/{g.maxCapacity} জন {g.isFull ? '(পূর্ণ)' : `(${g.seatsLeft}টি আসন খালি)`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  সহযাত্রী / পার্টনার সংখ্যা (Travelers Count)
                </label>
                <select
                  value={form.totalHajPartner || '০ জন (একক হাজী)'}
                  onChange={(e) => handlePartnerChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                >
                  <option value="০ জন (একক হাজী)">০ জন (একক হাজী)</option>
                  <option value="১ জন সহযাত্রী পার্টনার">১ জন সহযাত্রী পার্টনার (মোট ২ জন)</option>
                  <option value="২ জন সহযাত্রী পার্টনার">২ জন সহযাত্রী পার্টনার (মোট ৩ জন)</option>
                  <option value="৩ জন সহযাত্রী পার্টনার">৩ জন সহযাত্রী পার্টনার (মোট ৪ জন)</option>
                  <option value="৪ জন সহযাত্রী পার্টনার">৪ জন সহযাত্রী পার্টনার (মোট ৫ জন)</option>
                  <option value="৫ জন সহযাত্রী পার্টনার">৫ জন সহযাত্রী পার্টনার (মোট ৬ জন)</option>
                  <option value="৬+ জন সহযাত্রী পার্টনার">৬+ জন সহযাত্রী পার্টনার (পরিবার/দল)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                সহযাত্রীদের নাম ও পরিচিতি (আবেদনের তথ্য)
              </label>
              <textarea
                rows={2}
                placeholder="যেমন: সহধর্মিণী: মোসাঃ রাবেয়া বেগম (পাসপোর্ট: B12345678), ভাই: মো: আব্দুল্লাহ..."
                value={form.partnerDetails || ''}
                onChange={(e) => setForm({ ...form, partnerDetails: e.target.value })}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>

            {/* Linked Haji Companions (for existing records) */}
            {!isCreateMode && (
              <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <span className="text-xs font-bold text-[#0f2922] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-emerald-700" />
                    কাফেলা নিবন্ধিত যুক্ত সঙ্গী হাজীদের তালিকা (Linked Companions)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                    {form.linkedCompanions?.length || 0} জন সঙ্গী যুক্ত
                  </span>
                </div>

                {form.linkedCompanions && form.linkedCompanions.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {form.linkedCompanions.map((comp) => (
                      <div
                        key={comp.id}
                        className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between gap-1.5 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#0f2922] truncate">{comp.name}</div>
                          <div className="text-[10px] text-stone-600 font-mono">
                            আইডি: <strong>{comp.hajiUserId}</strong>
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
                  <p className="text-[11px] text-stone-500 italic">বর্তমানে কোনো সঙ্গী হাজীর আইডি লিংক করা নেই।</p>
                )}

                {!isSubAdmin && (
                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                    <select
                      value={modalCompanionSelect}
                      onChange={(e) => setModalCompanionSelect(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-xl border border-stone-300 bg-white font-medium"
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
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SECTION 4: প্যাকেজ, রুম, বিমান ও আনুষঙ্গিক সেবা         */}
          {/* ======================================================== */}
          <div className="p-4 bg-stone-900 text-white rounded-2xl border border-[#DCB473]/50 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-xs font-bold text-[#DCB473] uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#DCB473]" />
                ৪. প্যাকেজ, রুম, বিমান ও আনুষঙ্গিক সেবা (Package & Real-Time Cost)
              </h4>
              <span className="text-[10px] text-stone-300">
                যাত্রী সংখ্যা: {1 + getPartnerCount(form.totalHajPartner)} জন
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  প্যাকেজ নির্বাচন *
                </label>
                <select
                  value={form.serviceName}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                >
                  {pricingConfig.packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.title}>
                      {pkg.title} (৳{pkg.price.toLocaleString('bn-BD')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  রুমের ধরন *
                </label>
                <select
                  value={form.roomPreference || ''}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                >
                  {pricingConfig.rooms.map((room) => (
                    <option key={room.id} value={room.title}>
                      {room.title} {room.price > 0 ? `(+৳${room.price.toLocaleString('bn-BD')})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  বিমান টিকিট ও ফ্লাইট অপশন *
                </label>
                <select
                  value={form.airfareOption || ''}
                  onChange={(e) => handleAirfareChange(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-stone-700 bg-stone-800 text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                >
                  {pricingConfig.airfares.map((air) => (
                    <option key={air.id} value={air.title}>
                      {air.title} {air.price > 0 ? `(+৳${air.price.toLocaleString('bn-BD')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Incidentals checklist */}
            <div>
              <span className="block text-[11px] font-bold text-stone-300 mb-1.5">
                আনুষঙ্গিক সেবাসমূহ (Incidentals Services):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {pricingConfig.incidentals.map((inc) => {
                  const isChecked = selectedIncidentalIds.includes(inc.id);
                  return (
                    <label
                      key={inc.id}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/70 border-emerald-500/60 text-white'
                          : 'bg-stone-800/80 border-stone-700 text-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIncidental(inc.id)}
                          className="rounded text-emerald-500 focus:ring-emerald-400"
                        />
                        <span className="text-[11px] font-bold">{inc.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#DCB473]">
                        +৳{inc.price.toLocaleString('bn-BD')}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Calculations & Discount Controls */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-black/30 rounded-lg">
                  <span className="text-[10px] text-stone-400 block">জনপ্রতি সর্বমোট:</span>
                  <span className="font-mono font-bold text-[#DCB473]">
                    ৳{(form.perPersonTotal || 0).toLocaleString('bn-BD')}
                  </span>
                </div>
                <div className="p-2 bg-black/30 rounded-lg">
                  <span className="text-[10px] text-stone-400 block">মোট যাত্রী:</span>
                  <span className="font-mono font-bold text-white">
                    {1 + getPartnerCount(form.totalHajPartner)} জন
                  </span>
                </div>
                <div className="p-2 bg-black/30 rounded-lg">
                  <span className="text-[10px] text-stone-400 block">মূল খরচ (Subtotal):</span>
                  <span className="font-mono font-bold text-white">
                    ৳{(form.subtotalAmount || 0).toLocaleString('bn-BD')}
                  </span>
                </div>
                <div className="p-2 bg-emerald-950/60 rounded-lg border border-emerald-500/40">
                  <span className="text-[10px] text-emerald-300 block">চূড়ান্ত মূল্য (Net Total):</span>
                  <span className="font-mono font-black text-emerald-400">
                    ৳{(form.finalTotalAmount || form.subtotalAmount || 0).toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1 flex items-center justify-between">
                    <span>বিশেষ ছাড় (Discount %):</span>
                    <span className="text-[#DCB473] font-mono font-bold">{form.discountPercent || 0}% ছাড়</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={form.discountPercent || 0}
                    onChange={(e) => {
                      const newPct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      recalculateAmounts({ discountPercent: newPct });
                    }}
                    className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-stone-600 bg-stone-800 text-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-300 mb-1">
                    ছাড়ের কারণ / নোট:
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: বিশেষ কর্পোরেট কোটা, পারিবারিক ছাড়..."
                    value={form.discountNote || ''}
                    onChange={(e) => setForm({ ...form, discountNote: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-600 bg-stone-800 text-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 5: টাকা জমা ও অবশিষ্ট বকেয়া লেজার                */}
          {/* ======================================================== */}
          <div className="p-4 bg-emerald-950 text-white rounded-2xl border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#DCB473]" />
                ৫. টাকা জমা ও অবশিষ্ট বকেয়া লেজার (Payment & Due Balance)
              </h4>
              <span className="text-[10px] font-mono font-bold">
                {(form.paidAmount || 0) >= (form.finalTotalAmount || form.subtotalAmount || 0) && (form.finalTotalAmount || form.subtotalAmount || 0) > 0 ? (
                  <span className="text-emerald-300 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-500/50">
                    ✓ সম্পূর্ণ পরিশোধিত
                  </span>
                ) : (
                  <span className="text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50">
                    বকেয়া রয়েছে
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
                  <option value="ব্যাংক ডিপোজিট">ব্যাংক ডিপোজিট (Bank Deposit)</option>
                  <option value="অনলাইন ট্রান্সফার">অনলাইন ট্রান্সফার (Online Transfer)</option>
                  <option value="ক্যাশ / নগদ">ক্যাশ / নগদ কাউন্টার (Cash)</option>
                  <option value="বিকাশ / নগদ (MFS)">বিকাশ / নগদ (Mobile Banking)</option>
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
                  ৳ {Math.max(0, (form.finalTotalAmount || form.subtotalAmount || 0) - (form.paidAmount ?? 0)).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 6: ছবি ও ডকুমেন্টস সরাসরি ডিভাইস থেকে আপলোড      */}
          {/* ======================================================== */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-[#0f2922] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
              <Upload className="w-4 h-4 text-emerald-700" />
              ৬. ছবি ও ডকুমেন্টস সরাসরি ডিভাইস থেকে আপলোড ও প্রিভিউ (Direct Device Uploads)
            </h4>
            <p className="text-[11px] text-stone-500">
              যেকোনো মোবাইল বা কম্পিউটার থেকে সরাসরি ছবি, স্বাক্ষর, NID, পাসপোর্ট ও জমার রশিদ আপলোড অথবা পরিবর্তন করতে পারবেন।
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Photo Upload */}
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">১. পাসপোর্ট সাইজ ছবি</span>
                  {form.photoUrl && (
                    <button
                      type="button"
                      onClick={() => clearFile('photo')}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      মুছুন ✕
                    </button>
                  )}
                </div>
                {form.photoUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={form.photoUrl}
                      alt="ছবি"
                      className="w-16 h-16 object-cover rounded-lg border border-stone-300"
                    />
                    <a
                      href={form.photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline font-bold"
                    >
                      বড় করে দেখুন
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-16 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-xs text-stone-400">
                    ছবি সংযুক্ত নেই
                  </div>
                )}
                <label className="block w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold text-center rounded-lg border border-stone-300 cursor-pointer transition-colors">
                  <span>{form.photoUrl ? 'ছবি পরিবর্তন করুন' : 'ডিভাইস থেকে ছবি আপলোড'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Signature Upload */}
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">২. আবেদনকারীর স্বাক্ষর</span>
                  {form.signatureUrl && (
                    <button
                      type="button"
                      onClick={() => clearFile('signature')}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      মুছুন ✕
                    </button>
                  )}
                </div>
                {form.signatureUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={form.signatureUrl}
                      alt="স্বাক্ষর"
                      className="w-16 h-16 object-contain bg-stone-50 rounded-lg border border-stone-300"
                    />
                    <a
                      href={form.signatureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline font-bold"
                    >
                      বড় করে দেখুন
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-16 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-xs text-stone-400">
                    স্বাক্ষর সংযুক্ত নেই
                  </div>
                )}
                <label className="block w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold text-center rounded-lg border border-stone-300 cursor-pointer transition-colors">
                  <span>{form.signatureUrl ? 'স্বাক্ষর পরিবর্তন করুন' : 'ডিভাইস থেকে স্বাক্ষর আপলোড'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'signature')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* NID Upload */}
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">৩. জাতীয় পরিচয়পত্র (NID) কপি</span>
                  {form.nidDocUrl && (
                    <button
                      type="button"
                      onClick={() => clearFile('nid')}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      মুছুন ✕
                    </button>
                  )}
                </div>
                {form.nidDocUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={form.nidDocUrl}
                      alt="NID"
                      className="w-16 h-16 object-cover rounded-lg border border-stone-300"
                    />
                    <a
                      href={form.nidDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline font-bold"
                    >
                      বড় করে দেখুন
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-16 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-xs text-stone-400">
                    NID সংযুক্ত নেই
                  </div>
                )}
                <label className="block w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold text-center rounded-lg border border-stone-300 cursor-pointer transition-colors">
                  <span>{form.nidDocUrl ? 'NID কপি পরিবর্তন করুন' : 'ডিভাইস থেকে NID আপলোড'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'nid')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Passport Upload */}
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">৪. পাসপোর্ট কপি</span>
                  {form.passportDocUrl && (
                    <button
                      type="button"
                      onClick={() => clearFile('passport')}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      মুছুন ✕
                    </button>
                  )}
                </div>
                {form.passportDocUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={form.passportDocUrl}
                      alt="পাসপোর্ট"
                      className="w-16 h-16 object-cover rounded-lg border border-stone-300"
                    />
                    <a
                      href={form.passportDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 underline font-bold"
                    >
                      বড় করে দেখুন
                    </a>
                  </div>
                ) : (
                  <div className="w-full h-16 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-xs text-stone-400">
                    পাসপোর্ট সংযুক্ত নেই
                  </div>
                )}
                <label className="block w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold text-center rounded-lg border border-stone-300 cursor-pointer transition-colors">
                  <span>{form.passportDocUrl ? 'পাসপোর্ট কপি পরিবর্তন করুন' : 'ডিভাইস থেকে পাসপোর্ট আপলোড'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'passport')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Money Receipt Upload */}
              <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2 sm:col-span-2 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">৫. টাকা জমার ব্যাংক স্লিপ / মানি রিসিট</span>
                  {form.paymentReceiptUrl && (
                    <button
                      type="button"
                      onClick={() => clearFile('receipt')}
                      className="text-[10px] text-rose-600 hover:underline font-bold"
                    >
                      মুছুন ✕
                    </button>
                  )}
                </div>
                {form.paymentReceiptUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={form.paymentReceiptUrl}
                      alt="টাকার রসিদ"
                      className="w-16 h-16 object-cover rounded-lg border border-emerald-300"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-800 block">
                        {form.paymentReceiptName || 'ব্যাংক রসিদ ফাইল'}
                      </span>
                      <a
                        href={form.paymentReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 underline font-bold mt-1 inline-block"
                      >
                        রসিদ বড় করে দেখুন
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-16 rounded-lg border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-xs text-stone-400">
                    রসিদ সংযুক্ত নেই
                  </div>
                )}
                <label className="block w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold text-center rounded-lg border border-emerald-300 cursor-pointer transition-colors">
                  <span>{form.paymentReceiptUrl ? 'রসিদ ফাইল পরিবর্তন করুন' : 'ডিভাইস থেকে ব্যাংক রসিদ আপলোড'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'receipt')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 7: হাজী লগইন একাউন্ট তথ্য (Credentials)           */}
          {/* ======================================================== */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
            <h4 className="text-xs font-bold text-[#0f2922] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-emerald-200">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              ৭. হাজী পোর্টাল লগইন একাউন্ট তথ্য (Haji Login Credentials)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  হাজী ইউজার আইডি (User ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UMD26-BELAL বা মোবাইল নম্বর"
                  value={form.hajiUserId || form.registrationRef || ''}
                  onChange={(e) => setForm({ ...form, hajiUserId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  লগইন পাসওয়ার্ড (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={form.hajiPassword || ''}
                    onChange={(e) => setForm({ ...form, hajiPassword: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-[#DCB473] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 8: স্ট্যাটাস ও এডমিন নোট                         */}
          {/* ======================================================== */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <h4 className="text-xs font-bold text-[#0f2922] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ৮. অনুমোদন স্ট্যাটাস ও এডমিন মন্তব্য
            </h4>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                বর্তমান অবস্থা (Status) *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              >
                <option value="approved">✓ অনুমোদিত (Approved — হাজী পোর্টালে লগইন করতে পারবেন)</option>
                <option value="pending">⏳ অননুমোদিত (অপেক্ষমাণ / Pending)</option>
                <option value="contacted">📞 যোগাযোগ সম্পন্ন (Contacted)</option>
                <option value="rejected">✕ বাতিল / ক্লোজড (Closed)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                এডমিন নোট / ব্যক্তিগত মন্তব্য
              </label>
              <textarea
                rows={2}
                value={form.adminNotes || ''}
                onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                placeholder="যেমন: পাসপোর্ট ও প্রয়োজনীয় ডকুমেন্টস যাচাই সম্পন্ন, টিকিট কনফার্ম..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          {/* Submit / Cancel Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={closeInquiryModal}
              className="px-5 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 bg-[#0f2922] hover:bg-[#164438] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isCreateMode ? 'নতুন হাজী ডাটাবেজে সংরক্ষণ করুন' : 'সকল তথ্য হালনাগাদ সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
