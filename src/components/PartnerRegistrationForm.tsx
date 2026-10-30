import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import {
  Briefcase,
  ArrowLeft,
  CheckCircle2,
  Building2,
  User,
  Phone,
  Mail,
  FileCheck2,
  MapPin,
  TrendingUp,
  Send,
  Award
} from 'lucide-react';

interface PartnerRegistrationFormProps {
  onBackToLogin: () => void;
  onCloseModal?: () => void;
}

export const PartnerRegistrationForm: React.FC<PartnerRegistrationFormProps> = ({
  onBackToLogin,
  onCloseModal
}) => {
  const { addInquiry } = useAdmin();

  const [formData, setFormData] = useState({
    agencyName: '',
    contactPerson: '',
    designation: '',
    phone: '',
    email: '',
    partnershipType: 'B2B সাব-এজেন্ট (B2B Sub-Agency)',
    tradeLicense: '',
    officeAddress: '',
    yearlyVolume: '১০ - ২৫ জন যাত্রী',
    proposalMessage: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedRef, setGeneratedRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ref = `PARTNER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedRef(ref);

    setTimeout(() => {
      addInquiry({
        name: `${formData.contactPerson} (${formData.agencyName})`,
        phone: formData.phone,
        email: formData.email,
        serviceId: 'partner-reg',
        serviceName: `পার্টনার: ${formData.partnershipType}`,
        travelers: formData.yearlyVolume,
        agencyName: formData.agencyName,
        designation: formData.designation,
        tradeLicense: formData.tradeLicense,
        partnershipType: formData.partnershipType,
        district: formData.officeAddress,
        registrationType: 'partner',
        registrationRef: ref,
        message: `[পার্টনার আবেদন - ${ref}] প্রতিষ্ঠান: ${formData.agencyName} | পদবী: ${formData.designation} | লাইসেন্স: ${formData.tradeLicense || 'প্রক্রিয়াধীন'} | ঠিকানা: ${formData.officeAddress} | প্রস্তাবনা: ${formData.proposalMessage || 'সরাসরি পার্টনারশিপ আলোচনা'}`
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 450);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-4 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-full bg-[#0f2922] text-[#DCB473] flex items-center justify-center mx-auto mb-4 shadow-md">
          <Award className="w-9 h-9" />
        </div>
        <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
          মুত্তাকী পার্টনারশিপ নেটওয়ার্ক
        </span>
        <h4 className="text-2xl font-bold text-[#0f2922] mb-2">
          পার্টনার নিবন্ধন গ্রহণ সম্পন্ন!
        </h4>
        <p className="text-xs text-stone-600 max-w-sm mx-auto mb-4">
          আপনার এজেন্সির পার্টনারশিপ আবেদন সফলভাবে নথিভুক্ত হয়েছে। আমাদের বিজনেস ডেভেলপমেন্ট টিম শীঘ্রই আপনার সাথে চুক্তিনামা ও কমিশন পলিসি নিয়ে আলোচনা করবে।
        </p>

        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 max-w-xs mx-auto mb-6 text-left">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-stone-500">পার্টনার রেফারেন্স:</span>
            <span className="font-mono font-bold text-[#0f2922] bg-[#DCB473]/20 text-[#0f2922] px-2 py-0.5 rounded border border-[#DCB473]/40">
              {generatedRef}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-stone-500">প্রতিষ্ঠান:</span>
            <span className="font-bold text-stone-800 truncate max-w-[140px]">
              {formData.agencyName}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-stone-500">প্রতিনিধি:</span>
            <span className="font-semibold text-stone-700 truncate max-w-[140px]">
              {formData.contactPerson}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500">মোবাইল:</span>
            <span className="font-mono text-stone-700">{formData.phone}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={() => {
              setIsSubmitted(false);
              setFormData({
                agencyName: '',
                contactPerson: '',
                designation: '',
                phone: '',
                email: '',
                partnershipType: 'B2B সাব-এজেন্ট (B2B Sub-Agency)',
                tradeLicense: '',
                officeAddress: '',
                yearlyVolume: '১০ - ২৫ জন যাত্রী',
                proposalMessage: ''
              });
            }}
            className="px-4 py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            নতুন আবেদন
          </button>
          <button
            type="button"
            onClick={onBackToLogin}
            className="px-5 py-2.5 text-xs font-bold text-[#0f2922] bg-[#DCB473] hover:bg-[#c99f5e] rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            লগইন পেজে ফিরে যান
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#0f2922] transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>লগইনে ফিরে যান</span>
        </button>

        <span className="text-[11px] font-bold text-[#0f2922] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
          Registration as "Partner"
        </span>
      </div>

      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Briefcase className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-[#0f2922]">
          পার্টনার হিসেবে নিবন্ধন (Registration as "Partner")
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          বিটুবি সাব-এজেন্ট, আঞ্চলিক কাফেলা প্রতিনিধি ও কর্পোরেট পার্টনারশিপ ফরম
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[62vh] overflow-y-auto pr-1">
        {/* Agency Name & Designation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              প্রতিষ্ঠান / এজেন্সির নাম *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                placeholder="যেমন: আল-আমীন ট্রাভেলস"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              আপনার পদবী / দায়িত্ব *
            </label>
            <input
              type="text"
              required
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="যেমন: স্বত্বাধিকারী / পরিচালক"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>
        </div>

        {/* Contact Person & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              যোগাযোগকারী প্রতিনিধির নাম *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="পূর্ণ নাম"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              মোবাইল / হোয়াটসঅ্যাপ নম্বর *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="০১৭১১-XXXXXX"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>
        </div>

        {/* Email & Trade License */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ব্যবসায়িক ইমেইল এড্রেস *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="partner@agency.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              ট্রেড লাইসেন্স বা হাব/মন্ত্রণালয় লাইসেন্স নং
            </label>
            <div className="relative">
              <FileCheck2 className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={formData.tradeLicense}
                onChange={(e) => setFormData({ ...formData, tradeLicense: e.target.value })}
                placeholder="TR-XXXXXX (ঐচ্ছিক)"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              />
            </div>
          </div>
        </div>

        {/* Partnership Category & Yearly Volume */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              পার্টনারশিপের ধরণ *
            </label>
            <select
              value={formData.partnershipType}
              onChange={(e) => setFormData({ ...formData, partnershipType: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            >
              <option value="B2B সাব-এজেন্ট (B2B Sub-Agency)">B2B সাব-এজেন্ট (B2B Sub-Agency)</option>
              <option value="জেলা / উপজেলা আঞ্চলিক প্রতিনিধি">জেলা / উপজেলা আঞ্চলিক প্রতিনিধি</option>
              <option value="ট্যুর ও হজ্ব অপারেটর পার্টনার">ট্যুর ও হজ্ব অপারেটর পার্টনার</option>
              <option value="করপোরেট গ্রুপ বুকিং পার্টনার">করপোরেট গ্রুপ বুকিং পার্টনার</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              বাৎসরিক সম্ভাব্য যাত্রী/হাজী সংখ্যা
            </label>
            <div className="relative">
              <TrendingUp className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <select
                value={formData.yearlyVolume}
                onChange={(e) => setFormData({ ...formData, yearlyVolume: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
              >
                <option value="৫ - ১০ জন যাত্রী">৫ - ১০ জন যাত্রী</option>
                <option value="১০ - ২৫ জন যাত্রী">১০ - ২৫ জন যাত্রী</option>
                <option value="২৫ - ৫০ জন যাত্রী">২৫ - ৫০ জন যাত্রী</option>
                <option value="৫০+ জন যাত্রী">৫০+ জন যাত্রী</option>
              </select>
            </div>
          </div>
        </div>

        {/* Office Address */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            অফিসের ঠিকানা ও জেলা *
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              value={formData.officeAddress}
              onChange={(e) => setFormData({ ...formData, officeAddress: e.target.value })}
              placeholder="রোড নং, মার্কেট/ভবন, থানা ও জেলা"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
            />
          </div>
        </div>

        {/* Collaboration Proposal */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">
            পার্টনারশিপ প্রস্তাবনা বা বিশেষ বার্তা (ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            value={formData.proposalMessage}
            onChange={(e) => setFormData({ ...formData, proposalMessage: e.target.value })}
            placeholder="আপনার এজেন্সির অভিজ্ঞতা বা কাফেলার সাথে কীভাবে কাজ করতে চান..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#0f2922] hover:bg-[#184236] text-[#DCB473] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isSubmitting ? (
            <span>আবেদন গ্রহণ করা হচ্ছে...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>পার্টনার হিসেবে নিবন্ধন জমা দিন (Register as Partner)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
