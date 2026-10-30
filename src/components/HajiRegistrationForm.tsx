import React, { useState, useMemo } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  DEFAULT_KAFELA_GROUPS,
  getAllGroupsOccupancy,
  MAX_PILGRIMS_PER_GROUP
} from '../data/kafelaGroups';
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  Calendar,
  Shield,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  FileCheck,
  X,
  Sparkles,
  Send,
  Home,
  Users,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Clock,
  Plane,
  Receipt,
  Calculator,
  BadgePercent,
  Check,
  Wallet,
  CreditCard
} from 'lucide-react';

interface HajiRegistrationFormProps {
  onBackToLogin: () => void;
  onCloseModal?: () => void;
}

// Preset samples for fast testing
const SAMPLE_DOCS = {
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  signature: 'https://images.unsplash.com/photo-1583521214690-73421a1829a9?w=300&auto=format&fit=crop&q=80',
  nid: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
  passport: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
  receipt: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
};

export const HajiRegistrationForm: React.FC<HajiRegistrationFormProps> = ({
  onBackToLogin
}) => {
  const { addInquiry, pricingConfig, inquiries, kafelaGroups } = useAdmin();

  // Kafela Groups Occupancy (হাজী রেজিস্ট্রেশনের সিলেকশন অনুযায়ী বাস্তব সংখ্যা)
  const groupsOccupancy = useMemo(
    () => getAllGroupsOccupancy(kafelaGroups, inquiries),
    [kafelaGroups, inquiries]
  );

  // First available non-full group as default
  const defaultGroup = useMemo(() => {
    const available = groupsOccupancy.find((g) => !g.isFull);
    return available ? available.group.name : (kafelaGroups[0]?.name || 'Group-A');
  }, [groupsOccupancy, kafelaGroups]);

  const [formData, setFormData] = useState({
    nameBn: '',
    nameEn: '',
    fatherNameBn: '',
    fatherNameEn: '',
    motherNameBn: '',
    motherNameEn: '',
    presentAddress: '',
    presentPostCode: '',
    permanentAddress: '',
    permanentPostCode: '',
    sameAsPresent: false,
    nidNo: '',
    passportNo: '',
    phone: '',
    email: '',
    guardianPhone: '',
    dateOfBirth: '',
    totalHajPartner: '০ জন (একক হাজী)',
    hajPartnerIdLink: '',
    partnerDetails: '',
    serviceName: pricingConfig.packages[0]?.title || 'পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)',
    selectedGroup: '',
    roomPreference: pricingConfig.rooms[0]?.title || 'শেয়ারিং ইকোনমি রুম (৪-৫ জন)',
    airfareOption: pricingConfig.airfares[0]?.title || 'বাংলাদেশ বিমান / সাউদিয়া ডিরেক্ট ফ্লাইট (ইকোনমি)',
    specialNotes: '',
    photoUrl: '',
    photoName: '',
    signatureUrl: '',
    signatureName: '',
    nidDocUrl: '',
    nidDocName: '',
    passportDocUrl: '',
    passportDocName: '',
    // Payment & Deposit fields (টাকা জমার তারিখ, পরিমাণ ও রশিদ)
    paymentDate: new Date().toISOString().split('T')[0],
    paidAmount: '',
    paymentMethod: 'ব্যাংক ডিপোজিট / অনলাইন ট্রান্সফার',
    paymentReceiptUrl: '',
    paymentReceiptName: '',
    // Haji Login Credentials
    hajiUserId: '',
    hajiPassword: '',
    confirmPassword: ''
  });

  // Selected Incidental Services IDs (default first 3 included)
  const [selectedIncidentalIds, setSelectedIncidentalIds] = useState<string[]>(() =>
    pricingConfig.incidentals.slice(0, 3).map((i) => i.id)
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedRef, setGeneratedRef] = useState('');

  // Real-time calculation helpers
  const getPartnerCount = (partnerStr: string): number => {
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

  const selectedPackage =
    pricingConfig.packages.find((p) => p.title === formData.serviceName) ||
    pricingConfig.packages[0];

  const selectedRoom =
    pricingConfig.rooms.find((r) => r.title === formData.roomPreference) ||
    pricingConfig.rooms[0];

  const selectedAirfare =
    pricingConfig.airfares.find((a) => a.title === formData.airfareOption) ||
    pricingConfig.airfares[0];

  const selectedIncidentals = pricingConfig.incidentals.filter((inc) =>
    selectedIncidentalIds.includes(inc.id)
  );

  const incidentalsTotalPerPerson = selectedIncidentals.reduce(
    (sum, item) => sum + item.price,
    0
  );

  const partnerCount = getPartnerCount(formData.totalHajPartner);
  const travelersCount = 1 + partnerCount;
  const packagePrice = selectedPackage?.price || 0;
  const roomPrice = selectedRoom?.price || 0;
  const airfarePrice = selectedAirfare?.price || 0;

  const perPersonTotal = packagePrice + roomPrice + airfarePrice + incidentalsTotalPerPerson;
  const calculatedSubtotal = perPersonTotal * travelersCount;

  // Real-time Payment & Due Calculation (টাকা জমা ও অবশিষ্ট বকেয়া হিসাব)
  const paidAmountNumber = Math.max(0, Number(formData.paidAmount) || 0);
  const calculatedDue = Math.max(0, calculatedSubtotal - paidAmountNumber);

  // Client-side image compression helper to keep storage lightweight
  const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
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

  // File upload helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'photo' | 'signature' | 'nid' | 'passport' | 'receipt'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await compressImage(file, 800, 0.72);
      if (type === 'photo') {
        setFormData((prev) => ({ ...prev, photoUrl: result, photoName: file.name }));
      } else if (type === 'signature') {
        setFormData((prev) => ({ ...prev, signatureUrl: result, signatureName: file.name }));
      } else if (type === 'nid') {
        setFormData((prev) => ({ ...prev, nidDocUrl: result, nidDocName: file.name }));
      } else if (type === 'passport') {
        setFormData((prev) => ({ ...prev, passportDocUrl: result, passportDocName: file.name }));
      } else if (type === 'receipt') {
        setFormData((prev) => ({ ...prev, paymentReceiptUrl: result, paymentReceiptName: file.name }));
      }
    } catch {
      // Fallback to standard reader
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === 'photo') setFormData((prev) => ({ ...prev, photoUrl: result, photoName: file.name }));
        else if (type === 'signature') setFormData((prev) => ({ ...prev, signatureUrl: result, signatureName: file.name }));
        else if (type === 'nid') setFormData((prev) => ({ ...prev, nidDocUrl: result, nidDocName: file.name }));
        else if (type === 'passport') setFormData((prev) => ({ ...prev, passportDocUrl: result, passportDocName: file.name }));
        else if (type === 'receipt') setFormData((prev) => ({ ...prev, paymentReceiptUrl: result, paymentReceiptName: file.name }));
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = (type: 'photo' | 'signature' | 'nid' | 'passport' | 'receipt') => {
    if (type === 'photo') {
      setFormData((prev) => ({ ...prev, photoUrl: '', photoName: '' }));
    } else if (type === 'signature') {
      setFormData((prev) => ({ ...prev, signatureUrl: '', signatureName: '' }));
    } else if (type === 'nid') {
      setFormData((prev) => ({ ...prev, nidDocUrl: '', nidDocName: '' }));
    } else if (type === 'passport') {
      setFormData((prev) => ({ ...prev, passportDocUrl: '', passportDocName: '' }));
    } else if (type === 'receipt') {
      setFormData((prev) => ({ ...prev, paymentReceiptUrl: '', paymentReceiptName: '' }));
    }
  };

  const applySampleFiles = () => {
    setFormData((prev) => ({
      ...prev,
      photoUrl: SAMPLE_DOCS.photo,
      photoName: 'passport_photo_sample.jpg',
      signatureUrl: SAMPLE_DOCS.signature,
      signatureName: 'applicant_signature.jpg',
      nidDocUrl: SAMPLE_DOCS.nid,
      nidDocName: 'national_id_card.jpg',
      passportDocUrl: SAMPLE_DOCS.passport,
      passportDocName: 'bangladesh_passport_copy.jpg',
      paymentDate: new Date().toISOString().split('T')[0],
      paidAmount: '50000',
      paymentMethod: 'ব্যাংক ডিপোজিট / অনলাইন ট্রান্সফার',
      paymentReceiptUrl: SAMPLE_DOCS.receipt,
      paymentReceiptName: 'bank_money_receipt_50000.jpg',
      hajiUserId: prev.hajiUserId || 'haji.abdullah',
      hajiPassword: prev.hajiPassword || 'Haji12',
      confirmPassword: prev.confirmPassword || 'Haji12'
    }));
  };

  const handleSameAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      sameAsPresent: checked,
      permanentAddress: checked ? prev.presentAddress : prev.permanentAddress,
      permanentPostCode: checked ? prev.presentPostCode : prev.permanentPostCode
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPass = formData.hajiPassword.trim();
    const cleanConfirm = formData.confirmPassword.trim();

    if (cleanPass && cleanPass.length < 6) {
      setFormError('হাজী লগইন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (cleanPass && cleanConfirm && cleanPass !== cleanConfirm) {
      setFormError('পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড দুটি একই হতে হবে।');
      return;
    }

    // Validate Kafela Group capacity (সর্বোচ্চ ৫০ জন প্রতি গ্রুপে)
    const chosenGroupOccupancy = groupsOccupancy.find((g) => g.group.name === formData.selectedGroup);
    if (chosenGroupOccupancy && chosenGroupOccupancy.isFull) {
      setFormError(`দুঃখিত! "${formData.selectedGroup}" গ্রুপটিতে ৫০ জন হাজী পূর্ণ হয়ে গেছে। অনুগ্রহ করে আসন খালি থাকা অন্য একটি গ্রুপ নির্বাচন করুন।`);
      return;
    }

    setIsSubmitting(true);

    const ref = `HAJI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedRef(ref);

    const finalUserId = formData.hajiUserId.trim() || formData.phone.trim() || ref;
    const finalPassword = cleanPass || 'Haji12';

    setTimeout(() => {
      addInquiry({
        name: formData.nameBn || formData.nameEn || 'হাজী আবেদনকারী',
        phone: formData.phone,
        email: formData.email || undefined,
        serviceId: 'haji-full-registration',
        serviceName: formData.serviceName,
        selectedGroup: formData.selectedGroup,
        travelers: formData.totalHajPartner && !formData.totalHajPartner.includes('০ জন') ? `১+ (${formData.totalHajPartner})` : '১ জন (নিবন্ধনকৃত)',
        district: formData.presentAddress ? `${formData.presentAddress} (পোস্ট: ${formData.presentPostCode})` : undefined,
        passportOrNid: formData.passportNo || formData.nidNo || undefined,
        roomPreference: formData.roomPreference,
        registrationType: 'haji',
        registrationRef: ref,
        hajiUserId: finalUserId,
        hajiPassword: finalPassword,

        // Pricing & Real-time Calculation Data
        packageBasePrice: packagePrice,
        roomPrice: roomPrice,
        airfareOption: formData.airfareOption,
        airfarePrice: airfarePrice,
        incidentalItems: selectedIncidentals.map((i) => ({ id: i.id, title: i.title, price: i.price })),
        incidentalPrice: incidentalsTotalPerPerson,
        perPersonTotal: perPersonTotal,
        travelersCount: travelersCount,
        subtotalAmount: calculatedSubtotal,
        finalTotalAmount: calculatedSubtotal,
        discountPercent: 0,
        discountAmount: 0,

        // Payment & Deposit Details (টাকা জমা ও অবশিষ্ট বকেয়া হিসাব)
        paymentDate: formData.paymentDate,
        paidAmount: paidAmountNumber,
        dueAmount: calculatedDue,
        paymentReceiptUrl: formData.paymentReceiptUrl || undefined,
        paymentReceiptName: formData.paymentReceiptName || undefined,
        paymentMethod: formData.paymentMethod || undefined,

        // Detailed fields
        nameBn: formData.nameBn,
        nameEn: formData.nameEn,
        fatherNameBn: formData.fatherNameBn,
        fatherNameEn: formData.fatherNameEn,
        motherNameBn: formData.motherNameBn,
        motherNameEn: formData.motherNameEn,
        presentAddress: formData.presentAddress,
        presentPostCode: formData.presentPostCode,
        permanentAddress: formData.sameAsPresent ? formData.presentAddress : formData.permanentAddress,
        permanentPostCode: formData.sameAsPresent ? formData.presentPostCode : formData.permanentPostCode,
        nidNo: formData.nidNo,
        passportNo: formData.passportNo,
        guardianPhone: formData.guardianPhone,
        dateOfBirth: formData.dateOfBirth,
        totalHajPartner: formData.totalHajPartner,
        hajPartnerIdLink: formData.hajPartnerIdLink,
        partnerDetails: formData.partnerDetails,
        photoUrl: formData.photoUrl || undefined,
        signatureUrl: formData.signatureUrl || undefined,
        nidDocUrl: formData.nidDocUrl || undefined,
        passportDocUrl: formData.passportDocUrl || undefined,

        message: `[হাজী প্রাক-নিবন্ধন - ${ref}] ইউজার আইডি: ${finalUserId} | প্যাকেজ: ${formData.serviceName} (৳${packagePrice.toLocaleString('bn-BD')}) | রুম: ${formData.roomPreference} | ফ্লাইট: ${formData.airfareOption} | যাত্রী: ${travelersCount} জন | প্রাক্কলিত সর্বমোট: ৳${calculatedSubtotal.toLocaleString('bn-BD')} | মোট পার্টনার: ${formData.totalHajPartner || 'একক'} | পার্টনার আইডি/লিংক: ${formData.hajPartnerIdLink || 'নেই'} | NID: ${formData.nidNo || 'নেই'} | পাসপোর্ট: ${formData.passportNo || 'নেই'} | অভিভাবকের ফোন: ${formData.guardianPhone || 'নেই'} | জন্ম তারিখ: ${formData.dateOfBirth || 'নেই'}`
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 450);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
          আলহামদুলিল্লাহ
        </span>
        <h4 className="text-2xl font-bold text-[#0f2922] mb-2">
          হাজী নিবন্ধন সফলভাবে সম্পন্ন হয়েছে!
        </h4>
        <p className="text-xs text-stone-600 max-w-md mx-auto mb-5 leading-relaxed">
          আপনার প্রদত্ত সকল তথ্য ও আপলোডকৃত ডকুমেন্টস এডমিন প্যানেলে <strong>অপেক্ষমাণ (পেন্ডিং)</strong> তালিকায় জমা হয়েছে। কাফেলা পরিচালক তথ্যসমূহ যাচাইপূর্বক অনুমোদন করবেন।
        </p>

        <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5 max-w-md mx-auto mb-6 text-left space-y-2">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-stone-200">
            <span className="text-stone-500 font-medium">নিবন্ধন রেফারেন্স আইডি:</span>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              {generatedRef}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pb-1 border-b border-stone-100">
            <span className="text-stone-500 font-medium">বর্তমান স্ট্যাটাস:</span>
            <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>পেন্ডিং / অপেক্ষমাণ (Admin Approval Pending)</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">হাজীর নাম (বাংলা):</span>
            <span className="font-bold text-stone-900 truncate max-w-[200px]">
              {formData.nameBn}
            </span>
          </div>

          {formData.nameEn && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500">নাম (ইংরেজি):</span>
              <span className="font-mono font-semibold text-stone-800 truncate max-w-[200px]">
                {formData.nameEn}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">মোবাইল নম্বর:</span>
            <span className="font-mono font-bold text-stone-800">{formData.phone}</span>
          </div>

          {formData.passportNo && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500">পাসপোর্ট নম্বর:</span>
              <span className="font-mono text-stone-700">{formData.passportNo}</span>
            </div>
          )}

          {formData.totalHajPartner && !formData.totalHajPartner.includes('০ জন') && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500">মোট হজ্ব পার্টনার:</span>
              <span className="font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                {formData.totalHajPartner}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">কাফেলা গ্রুপ:</span>
            <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200">
              এডমিন অনুমোদনকালে গ্রুপ বরাদ্দ করবেন
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-200">
            <span className="text-stone-500">আপলোডকৃত ডকুমেন্ট:</span>
            <span className="text-[11px] font-semibold text-emerald-700">
              {[formData.photoUrl && 'ছবি', formData.signatureUrl && 'স্বাক্ষর', formData.nidDocUrl && 'NID', formData.passportDocUrl && 'পাসপোর্ট'].filter(Boolean).join(', ') || 'কোনো ফাইল আপলোড হয়নি'}
            </span>
          </div>

          {/* Pricing & Cost Calculation Summary */}
          <div className="pt-2 border-t border-stone-200 space-y-1 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-xs">
            <div className="flex justify-between items-center text-stone-700">
              <span>প্যাকেজ ও রুম:</span>
              <span className="font-semibold text-stone-900 truncate max-w-[210px]">{formData.serviceName} ({formData.roomPreference})</span>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span>মোট হাজী যাত্রী:</span>
              <span className="font-bold text-stone-900">{travelersCount} জন ({travelersCount > 1 ? `আবেদনকারী + ${partnerCount} জন` : 'একক'})</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-emerald-200 font-bold text-emerald-950">
              <span>সর্বমোট খরচ:</span>
              <span className="font-mono text-base font-extrabold text-emerald-800">৳ {calculatedSubtotal.toLocaleString('bn-BD')}</span>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span>টাকা জমার তারিখ:</span>
              <span className="font-mono text-stone-900">{formData.paymentDate}</span>
            </div>
            <div className="flex justify-between items-center text-stone-700">
              <span>টাকা জমা দেওয়া হয়েছে:</span>
              <span className="font-mono font-bold text-emerald-800">
                {paidAmountNumber > 0 ? `৳ ${paidAmountNumber.toLocaleString('bn-BD')}` : '৳ ০ (বকেয়া)'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-emerald-200 font-bold text-emerald-950">
              <span>অবশিষ্ট বকেয়া (Due):</span>
              <span className={`font-mono text-base font-extrabold ${calculatedDue > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                ৳ {calculatedDue.toLocaleString('bn-BD')} {calculatedDue === 0 && paidAmountNumber > 0 ? '(পরিশোধিত)' : ''}
              </span>
            </div>
            {formData.paymentReceiptUrl && (
              <div className="flex justify-between items-center text-stone-700 pt-1 text-[11px]">
                <span>টাকার রশিদ / ব্যাংক স্লিপ:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> আপলোডকৃত ({formData.paymentReceiptName || 'রশিদ'})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PROMINENT HAJI LOGIN CREDENTIALS CARD */}
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/80 rounded-3xl border-2 border-emerald-400 max-w-md mx-auto mb-6 text-left shadow-sm space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              আপনার হাজী লগইন তথ্য (Haji Login Credentials):
            </span>
            <span className="text-[10px] bg-emerald-200/90 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              সংরক্ষণ রাখুন
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] text-stone-500 block">হাজী ইউজার আইডি (User ID):</span>
              <span className="font-mono font-bold text-emerald-900 text-sm">
                {formData.hajiUserId || generatedRef}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] text-stone-500 block">পাসওয়ার্ড (Password):</span>
              <span className="font-mono font-bold text-stone-800 text-sm">
                {formData.hajiPassword || 'Haji12'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-emerald-900/90 leading-relaxed pt-1">
            💡 এই ইউজার আইডি এবং পাসওয়ার্ড দিয়ে আপনি যেকোনো সময় ওয়েবসাইটের <strong className="text-emerald-950">"লগইন"</strong> থেকে আপনার আবেদন, ভিসা, পাসপোর্ট এবং ওমরাহ/হজ্ব কাফেলা তথ্য দেখতে পারবেন।
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="px-6 py-2.5 text-xs font-bold text-[#0f2922] bg-[#DCB473] hover:bg-[#c99f5e] rounded-xl transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" />
            <span>এখনই হাজী পোর্টালে লগইন করুন</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                nameBn: '',
                nameEn: '',
                fatherNameBn: '',
                fatherNameEn: '',
                motherNameBn: '',
                motherNameEn: '',
                presentAddress: '',
                presentPostCode: '',
                permanentAddress: '',
                permanentPostCode: '',
                sameAsPresent: false,
                nidNo: '',
                passportNo: '',
                phone: '',
                email: '',
                guardianPhone: '',
                dateOfBirth: '',
                totalHajPartner: '০ জন (একক হাজী)',
                hajPartnerIdLink: '',
                partnerDetails: '',
                serviceName: pricingConfig.packages[0]?.title || 'পবিত্র ওমরাহ কাফেলা প্যাকেজ (১৫ দিন)',
                selectedGroup: defaultGroup,
                roomPreference: pricingConfig.rooms[0]?.title || 'শেয়ারিং ইকোনমি রুম (৪-৫ জন)',
                airfareOption: pricingConfig.airfares[0]?.title || 'বাংলাদেশ বিমান / সাউদিয়া ডিরেক্ট ফ্লাইট (ইকোনমি)',
                specialNotes: '',
                photoUrl: '',
                photoName: '',
                signatureUrl: '',
                signatureName: '',
                nidDocUrl: '',
                nidDocName: '',
                passportDocUrl: '',
                passportDocName: '',
                paymentDate: new Date().toISOString().split('T')[0],
                paidAmount: '',
                paymentMethod: 'ব্যাংক ডিপোজিট / অনলাইন ট্রান্সফার',
                paymentReceiptUrl: '',
                paymentReceiptName: '',
                hajiUserId: '',
                hajiPassword: '',
                confirmPassword: ''
              });
            }}
            className="px-5 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            নতুন আরেকটি নিবন্ধন ফরম
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
        <button
          type="button"
          onClick={onBackToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#0f2922] transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-stone-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>লগইনে ফিরে যান</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={applySampleFiles}
            className="text-[11px] font-semibold text-[#b88e44] hover:text-[#8f6d2e] underline cursor-pointer"
            title="পরীক্ষার সুবিধার্থে অটো স্যাম্পল ফাইল ও ডকুমেন্টস সংযুক্ত করুন"
          >
            নমুনা ডকুমেন্টস যোগ করুন
          </button>
          <span className="text-[11px] font-bold text-[#0f2922] bg-[#DCB473]/20 border border-[#DCB473]/50 px-2.5 py-0.5 rounded-full">
            Registration as "A Haji"
          </span>
        </div>
      </div>

      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Compass className="w-6 h-6" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-[#0f2922]">
          হাজী হিসেবে নিবন্ধন ফরম (Registration as "A Haji")
        </h3>
        <p className="text-xs text-stone-500 mt-1 max-w-lg mx-auto">
          পবিত্র হজ্ব ও ওমরাহ পালনে ইচ্ছুক ভাই ও বোনদের জন্য সরকারি ও বেসরকারি কাফেলা প্রাক-নিবন্ধন আবেদন
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-h-[68vh] overflow-y-auto pr-1.5">

        {/* SECTION 1: PERSONAL INFORMATION */}
        <div className="bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 text-[#0f2922]">
            <User className="w-4 h-4 text-[#DCB473]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              ১. আবেদনকারী হাজীর ব্যক্তিগত তথ্য (Personal Details)
            </h4>
          </div>

          {/* Bangla & English Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                হাজীর পূর্ণ নাম (বাংলায়) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.nameBn}
                  onChange={(e) => setFormData({ ...formData, nameBn: e.target.value })}
                  placeholder="যেমন: আলহাজ্ব মো: আব্দুল্লাহ"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                হাজীর নাম (ইংরেজিতে - পাসপোর্টের অনুরূপ) *
              </label>
              <input
                type="text"
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value.toUpperCase() })}
                placeholder="e.g. MOHAMMAD ABDULLAH"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono uppercase"
              />
            </div>
          </div>

          {/* Date of Birth & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                জন্ম তারিখ (Date of Birth) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                মোবাইল নম্বর (Mobile No.) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="০১৭১১-XXXXXX"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* NID No. & Passport No. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                জাতীয় পরিচয়পত্র নম্বর (NID No.) *
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.nidNo}
                  onChange={(e) => setFormData({ ...formData, nidNo: e.target.value })}
                  placeholder="১০ অথবা ১৭ ডিজিটের এনআইডি নং"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                পাসপোর্ট নম্বর (Passport No.) *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.passportNo}
                  onChange={(e) => setFormData({ ...formData, passportNo: e.target.value.toUpperCase() })}
                  placeholder="A01234567"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PARENTS & GUARDIAN */}
        <div className="bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 text-[#0f2922]">
            <Users className="w-4 h-4 text-[#DCB473]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              ২. পিতা, মাতা ও অভিভাবকের তথ্য (Parents & Guardian Information)
            </h4>
          </div>

          {/* Father's Bangla & English Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                পিতার নাম (বাংলায়) *
              </label>
              <input
                type="text"
                required
                value={formData.fatherNameBn}
                onChange={(e) => setFormData({ ...formData, fatherNameBn: e.target.value })}
                placeholder="পিতার নাম বাংলায়"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                পিতার নাম (ইংরেজিতে) *
              </label>
              <input
                type="text"
                required
                value={formData.fatherNameEn}
                onChange={(e) => setFormData({ ...formData, fatherNameEn: e.target.value.toUpperCase() })}
                placeholder="FATHER'S NAME IN ENGLISH"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono uppercase"
              />
            </div>
          </div>

          {/* Mother's Bangla & English Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                মাতার নাম (বাংলায়) *
              </label>
              <input
                type="text"
                required
                value={formData.motherNameBn}
                onChange={(e) => setFormData({ ...formData, motherNameBn: e.target.value })}
                placeholder="মাতার নাম বাংলায়"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                মাতার নাম (ইংরেজিতে) *
              </label>
              <input
                type="text"
                required
                value={formData.motherNameEn}
                onChange={(e) => setFormData({ ...formData, motherNameEn: e.target.value.toUpperCase() })}
                placeholder="MOTHER'S NAME IN ENGLISH"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono uppercase"
              />
            </div>
          </div>

          {/* Guardian Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                অভিভাবকের মোবাইল নম্বর (Guardian's Mobile No.) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  placeholder="জরুরি যোগাযোগের অভিভাবক মোবাইল নং"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ইমেইল এড্রেস (ঐচ্ছিক)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="haji@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRESENT & PERMANENT ADDRESS */}
        <div className="bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200 text-[#0f2922]">
            <Home className="w-4 h-4 text-[#DCB473]" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              ৩. ঠিকানা সংক্রান্ত তথ্য (Present & Permanent Address)
            </h4>
          </div>

          {/* Present Address with Post Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                বর্তমান ঠিকানা (Present Address) *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.presentAddress}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      presentAddress: val,
                      permanentAddress: prev.sameAsPresent ? val : prev.permanentAddress
                    }));
                  }}
                  placeholder="বাড়ি/হোল্ডিং, গ্রাম/মহল্লা, থানা ও জেলা"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                বর্তমান পোস্ট কোড (Post Code) *
              </label>
              <input
                type="text"
                required
                value={formData.presentPostCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    presentPostCode: val,
                    permanentPostCode: prev.sameAsPresent ? val : prev.permanentPostCode
                  }));
                }}
                placeholder="যেমন: ৫৮৮০"
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono"
              />
            </div>
          </div>

          {/* Same as present checkbox */}
          <div className="pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#0f2922]">
              <input
                type="checkbox"
                checked={formData.sameAsPresent}
                onChange={handleSameAddressChange}
                className="w-4 h-4 rounded text-[#0f2922] focus:ring-[#DCB473] border-stone-300 cursor-pointer"
              />
              <span>স্থায়ী ঠিকানা বর্তমান ঠিকানার অনুরূপ (Same as Present Address)</span>
            </label>
          </div>

          {/* Permanent Address with Post Code */}
          {!formData.sameAsPresent && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 animate-in fade-in duration-150">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  স্থায়ী ঠিকানা (Permanent Address) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required={!formData.sameAsPresent}
                    value={formData.permanentAddress}
                    onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                    placeholder="স্থায়ী গ্রামের নাম, ডাকঘর, থানা ও জেলা"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  স্থায়ী পোস্ট কোড (Post Code) *
                </label>
                <input
                  type="text"
                  required={!formData.sameAsPresent}
                  value={formData.permanentPostCode}
                  onChange={(e) => setFormData({ ...formData, permanentPostCode: e.target.value })}
                  placeholder="যেমন: ৫৮৮০"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: PACKAGE & TOTAL HAJ PARTNERS */}
        <div className="bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-[#0f2922]">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#DCB473]" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                ৪. প্যাকেজ, রুম, বিমান ও আনুসঙ্গিক খরচ নির্বাচন (Package & Cost Options)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              লাইভ খরচ হিসাব
            </span>
          </div>

          {/* Row 1: Package Selection & Room Preference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>১. আগ্রহী হজ্ব/ওমরাহ প্যাকেজ *</span>
                <span className="text-[11px] font-mono font-bold text-emerald-700">
                  ৳ {packagePrice.toLocaleString('bn-BD')}
                </span>
              </label>
              <select
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-medium text-stone-900"
              >
                {pricingConfig.packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.title}>
                    {pkg.title} — ৳ {pkg.price.toLocaleString('bn-BD')}
                  </option>
                ))}
              </select>
              {selectedPackage?.description && (
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                  {selectedPackage.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>২. মক্কা ও মদিনা হোটেল রুম পছন্দ *</span>
                <span className="text-[11px] font-mono font-bold text-emerald-700">
                  {roomPrice === 0 ? 'অন্তর্ভুক্ত' : `+ ৳ ${roomPrice.toLocaleString('bn-BD')}`}
                </span>
              </label>
              <select
                value={formData.roomPreference}
                onChange={(e) => setFormData({ ...formData, roomPreference: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-medium text-stone-900"
              >
                {pricingConfig.rooms.map((room) => (
                  <option key={room.id} value={room.title}>
                    {room.title} — {room.price === 0 ? 'প্যাকেজে অন্তর্ভুক্ত (৳ ০)' : `+ ৳ ${room.price.toLocaleString('bn-BD')}`}
                  </option>
                ))}
              </select>
              {selectedRoom?.description && (
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                  {selectedRoom.description}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Airfare Selection & Total Haj Partner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5 text-blue-600" />
                  ৩. বিমান ফ্লাইট ও টিকিট ক্যাটাগরি *
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-700">
                  {airfarePrice === 0 ? 'টিকিট চার্জ ০' : `+ ৳ ${airfarePrice.toLocaleString('bn-BD')}`}
                </span>
              </label>
              <select
                value={formData.airfareOption}
                onChange={(e) => setFormData({ ...formData, airfareOption: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-medium text-stone-900"
              >
                {pricingConfig.airfares.map((air) => (
                  <option key={air.id} value={air.title}>
                    {air.title} — {air.price === 0 ? '৳ ০ (নিজস্ব টিকিট)' : `৳ ${air.price.toLocaleString('bn-BD')}`}
                  </option>
                ))}
              </select>
              {selectedAirfare?.description && (
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                  {selectedAirfare.description}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#b88e44]" />
                  ৪. মোট হজ্ব পার্টনার (সহযাত্রী সংখ্যা) *
                </label>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  মোট {travelersCount} জন হাজী
                </span>
              </div>
              <select
                value={formData.totalHajPartner}
                onChange={(e) => setFormData({ ...formData, totalHajPartner: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-medium text-stone-900"
              >
                <option value="০ জন (একক হাজী / একা ভ্রমণ)">০ জন (একক হাজী / একা ভ্রমণ)</option>
                <option value="১ জন সহযাত্রী পার্টনার">১ জন সহযাত্রী পার্টনার (মোট ২ জন)</option>
                <option value="২ জন সহযাত্রী পার্টনার">২ জন সহযাত্রী পার্টনার (মোট ৩ জন)</option>
                <option value="৩ জন সহযাত্রী পার্টনার">৩ জন সহযাত্রী পার্টনার (মোট ৪ জন)</option>
                <option value="৪ জন সহযাত্রী পার্টনার">৪ জন সহযাত্রী পার্টনার (মোট ৫ জন)</option>
                <option value="৫ জন সহযাত্রী পার্টনার">৫ জন সহযাত্রী পার্টনার (মোট ৬ জন)</option>
                <option value="৬+ জন পার্টনার (ফ্যামিলি বা গ্রুপ কাফেলা)">৬+ জন পার্টনার (ফ্যামিলি বা গ্রুপ কাফেলা)</option>
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                আপনার সাথে কতজন সহযাত্রী যাচ্ছেন তা নির্ধারণ করুন।
              </p>
            </div>
          </div>

          {/* Row 3: Incidental Expenses Selection (Checkboxes) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#b88e44]" />
                ৫. আনুসঙ্গিক সেবা ও ফি পছন্দ (Incidental Expenses)
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                নির্বাচিত ফি: ৳ {incidentalsTotalPerPerson.toLocaleString('bn-BD')} / জন
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pricingConfig.incidentals.map((inc) => {
                const isChecked = selectedIncidentalIds.includes(inc.id);
                return (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        setSelectedIncidentalIds((prev) => prev.filter((id) => id !== inc.id));
                      } else {
                        setSelectedIncidentalIds((prev) => [...prev, inc.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/40'
                        : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked ? 'bg-emerald-700 text-white' : 'border border-stone-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {inc.title}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-800 shrink-0 tabular-nums">
                          ৳ {inc.price.toLocaleString('bn-BD')}
                        </span>
                      </div>
                      {inc.subtitle && (
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {inc.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 4: Partner Details (যদি সহযাত্রী নির্বাচন করা থাকে) */}
          {formData.totalHajPartner && !formData.totalHajPartner.includes('০ জন') && (
            <div className="pt-1">
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-bold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#b88e44]" />
                    সহযাত্রীদের নাম ও সংক্ষিপ্ত পরিচিতি (Partner Names & Info):
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full">
                    {partnerCount} জন পার্টনার
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={formData.partnerDetails}
                  onChange={(e) => setFormData({ ...formData, partnerDetails: e.target.value })}
                  placeholder="যেমন: ১. স্ত্রী মোছাঃ কুলসুম বেগম (পাসপোর্ট/NID নং...), ২. সন্তান আহমেদ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473] bg-white text-stone-800"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* REAL-TIME LIVE TOTAL COST CALCULATOR CARD                */}
          {/* ======================================================== */}
          <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c241d] to-[#081813] text-white border-2 border-[#DCB473]/70 shadow-lg space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#DCB473]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DCB473] text-[#0f2922] flex items-center justify-center font-bold">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>লাইভ মোট খরচের হিসাব (Real-Time Cost Breakdown)</span>
                  </h5>
                  <p className="text-[11px] text-stone-300">
                    আপনার নির্বাচিত অপশন অনুযায়ী স্বয়ংক্রিয় প্রাক্কলন
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-[#DCB473] font-semibold bg-[#DCB473]/20 px-2.5 py-1 rounded-full border border-[#DCB473]/40">
                  যাত্রী সংখ্যা: {travelersCount} জন ({travelersCount > 1 ? `আপনি + ${partnerCount} জন` : 'একক'})
                </span>
              </div>
            </div>

            {/* Breakdown Table Rows */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-stone-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DCB473]"></span>
                  {selectedPackage?.title || 'নির্বাচিত হজ্ব/ওমরাহ প্যাকেজ'}:
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  ৳ {packagePrice.toLocaleString('bn-BD')}
                </span>
              </div>

              {formData.selectedGroup && (
                <div className="flex items-center justify-between py-1 border-b border-white/10">
                  <span className="text-stone-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DCB473]"></span>
                    কাফেলা গ্রুপ:
                  </span>
                  <span className="font-semibold text-[#DCB473] text-right truncate max-w-[240px]">
                    {formData.selectedGroup}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-stone-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DCB473]"></span>
                  হোটেল রুম চার্জ ({selectedRoom?.title}):
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {roomPrice === 0 ? '৳ ০ (প্যাকেজে অন্তর্ভুক্ত)' : `+ ৳ ${roomPrice.toLocaleString('bn-BD')}`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-stone-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DCB473]"></span>
                  বিমান ভাড়া টিকিট ({selectedAirfare?.title}):
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {airfarePrice === 0 ? '৳ ০ (নিজস্ব টিকিট)' : `+ ৳ ${airfarePrice.toLocaleString('bn-BD')}`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-stone-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DCB473]"></span>
                  আনুসঙ্গিক সেবা ও ফি ({selectedIncidentals.length} টি নির্বাচিত):
                </span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {incidentalsTotalPerPerson === 0 ? '৳ ০' : `+ ৳ ${incidentalsTotalPerPerson.toLocaleString('bn-BD')}`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 bg-white/5 px-2.5 rounded-lg font-semibold text-stone-200">
                <span>জনপ্রতি প্রাক্কলিত উপ-মোট (Subtotal per person):</span>
                <span className="font-mono font-bold text-[#DCB473] tabular-nums">
                  ৳ {perPersonTotal.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {/* Final Subtotal & Multiplier Box */}
            <div className="p-3 bg-gradient-to-r from-[#DCB473]/20 via-[#DCB473]/10 to-transparent rounded-xl border border-[#DCB473]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-[#DCB473] font-bold block uppercase tracking-wider">
                  সর্বমোট প্রাক্কলিত খরচ (Grand Total)
                </span>
                <div className="text-xs text-stone-300">
                  ৳ {perPersonTotal.toLocaleString('bn-BD')} × {travelersCount} জন হাজী
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl sm:text-2xl font-extrabold text-[#DCB473] font-mono tabular-nums">
                  ৳ {calculatedSubtotal.toLocaleString('bn-BD')}
                </div>
                <div className="text-[10px] text-stone-300">
                  (বাংলাদেশি টাকা)
                </div>
              </div>
            </div>

            {/* Payment & Due Live Summary in Calculator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-emerald-200 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  জমা দেওয়া টাকা:
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  {paidAmountNumber > 0 ? `৳ ${paidAmountNumber.toLocaleString('bn-BD')}` : '৳ ০'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
                <span className="text-amber-200 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  অবশিষ্ট বকেয়া (Due):
                </span>
                <span className={`font-mono font-bold ${calculatedDue > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  ৳ {calculatedDue.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {/* Admin Discount Notice */}
            <div className="flex items-center gap-2 text-[11px] text-stone-300 bg-white/5 p-2 rounded-lg">
              <BadgePercent className="w-4 h-4 text-[#DCB473] shrink-0" />
              <span>
                <strong>এডমিন বিশেষ ছাড়:</strong> ফরম জমা হওয়ার পর কাফেলা এডমিন আপনার আবেদন পর্যালোচনা করে বিশেষ পার্সেন্ট (%) ছাড় বা মূল্য কমিয়ে দেওয়ার সুবিধা দিতে পারেন।
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 5: PAYMENT, MONEY RECEIPT & DUE BALANCE SECTION  */}
        {/* ======================================================== */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-[#DCB473]/70 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#0f2922]">
                  ৫. টাকা জমার তথ্য ও রসিদ আপলোড (Payment & Due Balance)
                </h4>
                <p className="text-[11px] text-stone-500">
                  টাকা জমা সংক্রান্ত তথ্য দিন এবং ব্যাংক জমার স্লিপ বা মানি রিসিটের ছবি আপলোড করুন
                </p>
              </div>
            </div>

            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
              calculatedDue === 0 && paidAmountNumber > 0
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : paidAmountNumber > 0
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-stone-100 text-stone-700 border-stone-300'
            }`}>
              {calculatedDue === 0 && paidAmountNumber > 0
                ? '✓ সম্পূর্ণ পরিশোধিত'
                : paidAmountNumber > 0
                ? `বকেয়া: ৳ ${calculatedDue.toLocaleString('bn-BD')}`
                : 'সম্পূর্ণ বকেয়া'}
            </span>
          </div>

          {/* Real-time 3-Card Balance Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Box 1: Total Fee */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <span className="text-[11px] text-stone-500 font-semibold block">
                ১. সর্বমোট প্রদেয় খরচ (Grand Total)
              </span>
              <div className="text-lg font-bold font-mono text-[#0f2922] mt-0.5">
                ৳ {calculatedSubtotal.toLocaleString('bn-BD')}
              </div>
              <span className="text-[10px] text-stone-400">
                {travelersCount} জন হাজির সর্বমোট প্যাকেজ খরচ
              </span>
            </div>

            {/* Box 2: Paid Amount */}
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-semibold block">
                ২. টাকা জমা দিয়েছেন (Paid Amount)
              </span>
              <div className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
                ৳ {paidAmountNumber.toLocaleString('bn-BD')}
              </div>
              <span className="text-[10px] text-emerald-700">
                {paidAmountNumber > 0 ? 'জমা হিসেবে অন্তর্ভুক্ত' : 'এখনো কোনো টাকা জমা হয়নি'}
              </span>
            </div>

            {/* Box 3: Due Amount */}
            <div className={`p-3.5 rounded-2xl border ${
              calculatedDue === 0 && paidAmountNumber > 0
                ? 'bg-teal-50/80 border-teal-300'
                : 'bg-amber-50/90 border-amber-300'
            }`}>
              <span className="text-[11px] font-semibold block text-amber-900">
                ৩. অবশিষ্ট বকেয়া (Due Amount)
              </span>
              <div className={`text-lg font-bold font-mono mt-0.5 ${
                calculatedDue === 0 && paidAmountNumber > 0 ? 'text-teal-900' : 'text-amber-950'
              }`}>
                ৳ {calculatedDue.toLocaleString('bn-BD')}
              </div>
              <span className="text-[10px] text-amber-800">
                {calculatedDue === 0 && paidAmountNumber > 0
                  ? 'কোনো বকেয়া নেই (পরিশোধিত)'
                  : 'মোট টাকা থেকে জমার টাকা বাদে অবশিষ্ট'}
              </span>
            </div>
          </div>

          {/* Input Fields: Payment Date & Paid Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Payment Date */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#b88e44]" />
                <span>টাকা জমার তারিখ (Deposit Date) *</span>
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-medium text-stone-900"
              />
            </div>

            {/* Paid Amount */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#b88e44]" />
                  <span>টাকা জমার পরিমাণ (৳) *</span>
                </span>
                <span className="text-[10px] text-stone-400">টাকার অংক</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-stone-500">৳</span>
                <input
                  type="number"
                  min="0"
                  max={calculatedSubtotal}
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="যেমন: ৫০,০০০ বা ১,০০,০০০"
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-mono font-bold text-stone-900"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paidAmount: '25000' })}
                  className="px-2 py-0.5 text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-mono cursor-pointer"
                >
                  ৳ ২৫,০০০
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paidAmount: '50000' })}
                  className="px-2 py-0.5 text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-mono cursor-pointer"
                >
                  ৳ ৫০,০০০
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paidAmount: '100000' })}
                  className="px-2 py-0.5 text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-mono cursor-pointer"
                >
                  ৳ ১,০০,০০০
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paidAmount: String(calculatedSubtotal) })}
                  className="px-2 py-0.5 text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md font-bold cursor-pointer"
                >
                  সম্পূর্ণ ফি
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paidAmount: '0' })}
                  className="px-2 py-0.5 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md font-medium cursor-pointer"
                >
                  ০ (বকেয়া)
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-[#b88e44]" />
                <span>টাকা জমার মাধ্যম (Method)</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473] font-medium text-stone-900"
              >
                <option value="ব্যাংক ডিপোজিট / অনলাইন ট্রান্সফার">ব্যাংক ডিপোজিট / অনলাইন ট্রান্সফার</option>
                <option value="নগদ / সরাসরি অফিসে জমা">নগদ / সরাসরি অফিসে জমা</option>
                <option value="চেক / পে-অর্ডার">চেক / পে-অর্ডার</option>
                <option value="বিকাশ / নগদ / রকেট">বিকাশ / নগদ / রকেট</option>
              </select>
            </div>
          </div>

          {/* Payment Receipt Upload Box */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>টাকার রশিদ আপলোড (Payment Receipt / Bank Deposit Voucher) *</span>
              </label>
              <span className="text-[10px] text-stone-400">রশিদের ছবি বা স্ক্যান কপি (JPG/PNG/PDF)</span>
            </div>

            {formData.paymentReceiptUrl ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50/80 rounded-2xl border-2 border-emerald-300 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={formData.paymentReceiptUrl}
                    alt="টাকার রশিদ"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-emerald-400 shadow-xs shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-950 truncate">
                      {formData.paymentReceiptName || 'money_receipt.jpg'}
                    </p>
                    <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> টাকার রশিদ আপলোড সম্পন্ন হয়েছে
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={formData.paymentReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
                  >
                    বড় করে দেখুন
                  </a>
                  <button
                    type="button"
                    onClick={() => clearFile('receipt')}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="রশিদ পরিবর্তন / মুছে ফেলুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#DCB473]/70 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/30 transition-all text-center group">
                <div className="w-10 h-10 rounded-full bg-[#DCB473]/10 group-hover:bg-emerald-100 flex items-center justify-center text-[#b88e44] group-hover:text-emerald-700 mb-1.5 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-stone-800 group-hover:text-emerald-900">
                  টাকার জমার রসিদ বা ব্যাংক স্লিপ এখানে আপলোড করুন
                </span>
                <span className="text-[11px] text-stone-500 mt-0.5">
                  ক্লিক করে ডিভাইস থেকে রশিদের ছবি বাছাই করুন
                </span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'receipt')}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* SECTION 6: DOCUMENT & PHOTO UPLOADS */}
        <div className="bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200 text-[#0f2922]">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#DCB473]" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                ৬. ছবি ও অন্যান্য ডকুমেন্ট আপলোড (Document & Photo Uploads)
              </h4>
            </div>
            <span className="text-[10px] text-stone-500">JPG, PNG বা স্ক্যান কপি</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* 1. Photo Upload Option */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  হাজীর ছবি (Photo Upload Option)
                </span>
                {formData.photoUrl && (
                  <button
                    type="button"
                    onClick={() => clearFile('photo')}
                    className="text-stone-400 hover:text-rose-500 text-xs p-1"
                    title="রিমুভ করুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {formData.photoUrl ? (
                <div className="flex items-center gap-3 p-2 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <img
                    src={formData.photoUrl}
                    alt="হাজীর ছবি"
                    className="w-12 h-12 rounded-lg object-cover border border-emerald-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-emerald-900 truncate">
                      {formData.photoName || 'photo.jpg'}
                    </p>
                    <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> আপলোড সম্পন্ন
                    </span>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-stone-300 hover:border-[#DCB473] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors text-center">
                  <Upload className="w-5 h-5 text-stone-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-700">ছবি বাছাই করুন</span>
                  <span className="text-[10px] text-stone-400">পাসপোর্ট সাইজ ছবি</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'photo')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 2. Signature Upload Option */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                  স্বাক্ষর (Signature Upload Option)
                </span>
                {formData.signatureUrl && (
                  <button
                    type="button"
                    onClick={() => clearFile('signature')}
                    className="text-stone-400 hover:text-rose-500 text-xs p-1"
                    title="রিমুভ করুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {formData.signatureUrl ? (
                <div className="flex items-center gap-3 p-2 bg-blue-50/60 rounded-xl border border-blue-200">
                  <img
                    src={formData.signatureUrl}
                    alt="স্বাক্ষর"
                    className="w-16 h-10 rounded-lg object-contain bg-white border border-blue-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-blue-900 truncate">
                      {formData.signatureName || 'signature.jpg'}
                    </p>
                    <span className="text-[10px] text-blue-700 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> আপলোড সম্পন্ন
                    </span>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-stone-300 hover:border-[#DCB473] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors text-center">
                  <Upload className="w-5 h-5 text-stone-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-700">স্বাক্ষর বাছাই করুন</span>
                  <span className="text-[10px] text-stone-400">সাদা কাগজে স্পষ্ট স্বাক্ষর</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'signature')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 3. NID Upload Option */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  এনআইডি কার্ড (NID Upload Option)
                </span>
                {formData.nidDocUrl && (
                  <button
                    type="button"
                    onClick={() => clearFile('nid')}
                    className="text-stone-400 hover:text-rose-500 text-xs p-1"
                    title="রিমুভ করুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {formData.nidDocUrl ? (
                <div className="flex items-center gap-3 p-2 bg-amber-50/60 rounded-xl border border-amber-200">
                  <img
                    src={formData.nidDocUrl}
                    alt="NID কার্ড"
                    className="w-14 h-10 rounded-lg object-cover border border-amber-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-amber-900 truncate">
                      {formData.nidDocName || 'nid_copy.jpg'}
                    </p>
                    <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> আপলোড সম্পন্ন
                    </span>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-stone-300 hover:border-[#DCB473] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors text-center">
                  <Upload className="w-5 h-5 text-stone-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-700">NID কপি আপলোড</span>
                  <span className="text-[10px] text-stone-400">উভয় পিঠের স্ক্যান বা স্পষ্ট ছবি</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'nid')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 4. Passport Upload Option */}
            <div className="p-3.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  পাসপোর্ট কপি (Passport Upload Option)
                </span>
                {formData.passportDocUrl && (
                  <button
                    type="button"
                    onClick={() => clearFile('passport')}
                    className="text-stone-400 hover:text-rose-500 text-xs p-1"
                    title="রিমুভ করুন"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {formData.passportDocUrl ? (
                <div className="flex items-center gap-3 p-2 bg-purple-50/60 rounded-xl border border-purple-200">
                  <img
                    src={formData.passportDocUrl}
                    alt="পাসপোর্ট কপি"
                    className="w-14 h-10 rounded-lg object-cover border border-purple-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-purple-900 truncate">
                      {formData.passportDocName || 'passport_scan.jpg'}
                    </p>
                    <span className="text-[10px] text-purple-700 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> আপলোড সম্পন্ন
                    </span>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-stone-300 hover:border-[#DCB473] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-colors text-center">
                  <Upload className="w-5 h-5 text-stone-400 mb-1" />
                  <span className="text-xs font-semibold text-stone-700">পাসপোর্ট আপলোড</span>
                  <span className="text-[10px] text-stone-400">তথ্য পাতার মূল স্ক্যান কপি</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'passport')}
                    className="hidden"
                  />
                </label>
              )}
            </div>

          </div>
        </div>

        {/* SECTION 7: HAJI LOGIN CREDENTIALS (USER ID & PASSWORD) */}
        <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-emerald-50/90 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200 text-[#0f2922]">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                ৭. হাজী লগইন একাউন্ট তথ্য (Haji Login - User ID & Password)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              ভবিষ্যত লগইনের জন্য
            </span>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            রেজিস্ট্রেশন শেষে আপনার হজ্ব ও ওমরাহ প্রোফাইল, প্যাকেজ বুকিং স্ট্যাটাস এবং প্রয়োজনীয় তথ্যাবলী দেখতে এই ইউজার আইডি ও পাসওয়ার্ড দিয়ে লগইন করবেন।
          </p>

          {/* User ID Field with Quick Fill Helpers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>হাজী ইউজার আইডি (Haji User ID) *</span>
              </label>
              <div className="flex items-center gap-1.5">
                {formData.phone && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, hajiUserId: prev.phone }))}
                    className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="মোবাইল নম্বরটি ইউজার আইডি হিসেবে সেট করুন"
                  >
                    মোবাইল নম্বর ব্যবহার করুন
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const autoId = `HAJI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                    setFormData((prev) => ({ ...prev, hajiUserId: autoId }));
                  }}
                  className="text-[10px] font-semibold text-[#b88e44] hover:text-[#8f6d2e] bg-white px-2 py-0.5 rounded-md border border-[#DCB473] hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  অটো আইডি
                </button>
              </div>
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.hajiUserId}
                onChange={(e) => setFormData({ ...formData, hajiUserId: e.target.value })}
                placeholder="যেমন: haji.abdullah অথবা ০১৭২২-৪৫৫৬৬৭"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-mono text-stone-800"
              />
            </div>
            <span className="text-[10px] text-stone-500 mt-1 block">
              💡 আপনি আপনার মোবাইল নম্বর, নাম বা যেকোনো পছন্দসই ইউজার আইডি এখানে লিখতে পারেন।
            </span>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Field: Password */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  <span>পাসওয়ার্ড (Password) *</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal">কমপক্ষে ৬ অক্ষর</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.hajiPassword}
                  onChange={(e) => setFormData({ ...formData, hajiPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field: Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>পাসওয়ার্ড নিশ্চিত করুন (Confirm) *</span>
                </span>
                {formData.confirmPassword && formData.hajiPassword === formData.confirmPassword && (
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> মিল রয়েছে
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••••••"
                  className={`w-full pl-9 pr-9 py-2 text-xs rounded-xl border bg-white font-mono focus:outline-none focus:ring-2 ${
                    formData.confirmPassword && formData.hajiPassword !== formData.confirmPassword
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-stone-300 focus:ring-emerald-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert if any */}
        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-semibold">{formError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
        >
          {isSubmitting ? (
            <span>নিবন্ধন গ্রহণ ও আপলোড প্রক্রিয়াকরণ হচ্ছে...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>হাজী নিবন্ধন সম্পূর্ণ জমা দিন (Submit Haji Registration)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
