import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { InquiryItem } from '../types';
import {
  X,
  Compass,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  Home,
  Users,
  Link as LinkIcon,
  FileText,
  LogOut,
  MapPin,
  Calendar,
  Shield,
  Download,
  AlertCircle,
  CreditCard,
  Receipt,
  Printer,
  Sparkles
} from 'lucide-react';

interface HajiPortalModalProps {
  haji: InquiryItem;
  onClose: () => void;
  onLogout: () => void;
}

export const HajiPortalModal: React.FC<HajiPortalModalProps> = ({
  haji,
  onClose,
  onLogout
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    const element = document.getElementById('haji-printable-profile-slip');
    if (!element) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Haji_Registration_${haji.registrationRef || haji.hajiUserId || haji.id}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative border border-[#DCB473]/30 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors z-10 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Haji status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-stone-200 gap-3">
          <div className="flex items-center gap-3">
            {haji.photoUrl ? (
              <img
                src={haji.photoUrl}
                alt="হাজীর ছবি"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#DCB473] shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#0f2922] text-[#DCB473] flex items-center justify-center font-bold text-lg shadow-xs">
                <Compass className="w-7 h-7" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-[#0f2922]">
                  {haji.nameBn || haji.name}
                </h3>
                {haji.status === 'approved' ? (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    অনুমোদিত (Approved)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-600" />
                    যাচাই প্রক্রিয়াধীন
                  </span>
                )}
              </div>
              {haji.nameEn && (
                <p className="text-xs font-mono font-medium text-stone-500 uppercase">
                  {haji.nameEn}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs font-mono">
                {haji.hajiUserId && (
                  <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ইউজার আইডি: {haji.hajiUserId}
                  </span>
                )}
                <span className="text-[#b88e44] font-bold">
                  রেফারেন্স: {haji.registrationRef || haji.id}
                </span>
                {haji.approvedAt && (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    অনুমোদন: {haji.approvedAt}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="self-start sm:self-center px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>

        {/* ACTION BAR: DOWNLOAD PDF & PRINT SLIP */}
        <div className="bg-gradient-to-r from-[#0f2922] via-[#163f34] to-[#0f2922] text-white p-3.5 sm:p-4 rounded-2xl mb-4 border border-[#DCB473]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DCB473]/20 text-[#DCB473] flex items-center justify-center shrink-0 border border-[#DCB473]/40">
              <Sparkles className="w-5 h-5 text-[#DCB473]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#DCB473]">
                হাজী রেজিস্ট্রেশন সনদ ও তথ্য স্লিপ
              </h4>
              <p className="text-[11px] text-stone-300">
                আপনার অনুমোদিত নিবন্ধনের সকল বিবরণ ও পেমেন্ট স্লিপ ডাউনলোড করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 bg-[#DCB473] hover:bg-white text-[#0f2922] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'পিডিএফ তৈরি হচ্ছে...' : 'পিডিএফ ডাউনলোড (PDF)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>সরাসরি প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl mb-4 text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">
                মুত্তাকী হজ্ব ও ওমরাহ কাফেলায় স্বাগতম! (আবেদন অনুমোদিত)
              </p>
              <p className="text-stone-600 mt-0.5 leading-relaxed">
                আলহামদুলিল্লাহ! আপনার কাফেলা প্রাক-নিবন্ধন আবেদনটি কাফেলা প্রশাসন কর্তৃক আনুষ্ঠানিকভাবে অনুমোদিত হয়েছে। নিচে আপনার সম্পূর্ণ নিবন্ধিত বিবরণ ও পেমেন্ট হিসাব প্রদর্শিত হচ্ছে।
              </p>
            </div>
          </div>
        </div>

        {/* PRINTABLE CONTAINER (Covered in PDF) */}
        <div id="haji-printable-profile-slip" className="space-y-4 bg-white p-1 rounded-2xl">
          {/* Package & Pilgrimage Details */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
            <h4 className="font-bold text-[#0f2922] uppercase tracking-wider text-[11px] pb-1.5 border-b border-stone-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#DCB473]" />
              নির্বাচিত প্যাকেজ ও কাফেলা বিবরণ
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <span className="text-stone-500 block">প্যাকেজের নাম:</span>
                <span className="font-bold text-stone-900">{haji.serviceName}</span>
              </div>
              {haji.selectedGroup && (
                <div>
                  <span className="text-stone-500 block">কাফেলা গ্রুপ:</span>
                  <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded text-[11px] inline-block border border-purple-200">
                    🏷️ {haji.selectedGroup} (সর্বোচ্চ ৫০ জন)
                  </span>
                </div>
              )}
              <div>
                <span className="text-stone-500 block">রুম পছন্দ:</span>
                <span className="font-semibold text-stone-800">{haji.roomPreference || 'সাধারণ রুম'}</span>
              </div>
              <div>
                <span className="text-stone-500 block">নিবন্ধনের তারিখ:</span>
                <span className="font-mono text-stone-800">{haji.date}</span>
              </div>
              <div>
                <span className="text-stone-500 block">জরুরি যোগাযোগ / ফোন:</span>
                <span className="font-mono font-bold text-stone-800">{haji.phone}</span>
              </div>
            </div>
          </div>

          {/* Payment & Remaining Due Ledger */}
          <div className="p-4 bg-gradient-to-br from-stone-900 via-[#0f2922] to-[#163f34] text-white rounded-2xl border border-[#DCB473]/50 shadow-md space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-white/10 gap-2">
              <h4 className="font-bold text-[#DCB473] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                পেমেন্ট ও বকেয়া হিসাব (Payment & Due Balance)
              </h4>
              {(haji.paidAmount ?? 0) >= (haji.finalTotalAmount || haji.subtotalAmount || 0) && (haji.finalTotalAmount || haji.subtotalAmount || 0) > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✓ সম্পূর্ণ পরিশোধিত (Paid)
                </span>
              ) : (haji.paidAmount ?? 0) > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ⏳ আংশিক জমা (Partial Paid)
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  ⚠️ বকেয়া অপরিশোধিত (Unpaid)
                </span>
              )}
            </div>

            {/* 3-card ledger summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-stone-400 text-[10px] block">মোট প্যাকেজ মূল্য:</span>
                <span className="font-mono text-sm sm:text-base font-bold text-white block mt-0.5">
                  ৳ {(haji.finalTotalAmount || haji.subtotalAmount || 0).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-300 text-[10px] block">জমা দেওয়া টাকা:</span>
                <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 block mt-0.5">
                  ৳ {(haji.paidAmount ?? 0).toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-amber-300 text-[10px] block">অবশিষ্ট বকেয়া (Due):</span>
                <span className="font-mono text-sm sm:text-base font-bold text-[#DCB473] block mt-0.5">
                  ৳ {(haji.dueAmount !== undefined ? haji.dueAmount : Math.max(0, (haji.finalTotalAmount || haji.subtotalAmount || 0) - (haji.paidAmount ?? 0))).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            {/* Payment Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[11px]">
              <div>
                <span className="text-stone-400">টাকা জমার তারিখ: </span>
                <span className="font-mono text-stone-200 font-semibold">{haji.paymentDate || 'নিবন্ধনের সময়'}</span>
              </div>
              <div>
                <span className="text-stone-400">পরিশোধের মাধ্যম: </span>
                <span className="text-stone-200 font-semibold">{haji.paymentMethod || 'ব্যাংক জমা / অনলাইন'}</span>
              </div>
            </div>

            {/* Receipt link/button if uploaded */}
            {haji.paymentReceiptUrl && (
              <div className="p-2.5 rounded-xl bg-white/10 border border-[#DCB473]/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CreditCard className="w-4 h-4 text-[#DCB473] shrink-0" />
                  <span className="truncate text-[11px] text-stone-200 font-medium">
                    টাকার জমা রসিদ: {haji.paymentReceiptName || 'রসিদ কপি সংযুক্ত'}
                  </span>
                </div>
                <a
                  href={haji.paymentReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-[#DCB473] text-[#0f2922] font-bold text-[11px] rounded-lg hover:bg-white transition-colors shrink-0 shadow-xs"
                >
                  রসিদ দেখুন
                </a>
              </div>
            )}
          </div>

          {/* Admin-Linked Companions (এডমিন কর্তৃক সিঙ্ককৃত সঙ্গী তালিকা) */}
          {haji.linkedCompanions && haji.linkedCompanions.length > 0 && (
            <div className="p-4 bg-emerald-50/90 rounded-2xl border-2 border-emerald-300 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  কাফেলা নিবন্ধিত যুক্ত সঙ্গী ও সহযাত্রীগণ (Linked Companions)
                </h4>
                <span className="text-[10px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">
                  মোট {haji.linkedCompanions.length} জন সঙ্গী
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {haji.linkedCompanions.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#0f2922]">{comp.name}</span>
                      {comp.group && (
                        <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-200">
                          {comp.group}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-600 font-mono">
                      <span>আইডি: <strong className="text-emerald-800 font-bold">{comp.hajiUserId}</strong></span>
                      {comp.phone && <span className="text-stone-500 font-sans">মোবাইল: {comp.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Haj Partner & Total Partner Details */}
          {(haji.totalHajPartner || haji.partnerDetails) && (
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2 text-xs">
              <h4 className="font-bold text-amber-950 uppercase tracking-wider text-[11px] pb-1.5 border-b border-amber-200/80 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                আবেদনে উল্লিখিত সহযাত্রী বিবরণ
              </h4>

              <div className="pt-1">
                <span className="text-amber-800 block">মোট আবেদনকৃত সহযাত্রী:</span>
                <span className="font-bold text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                  {haji.totalHajPartner || 'একক'}
                </span>
              </div>

              {haji.partnerDetails && (
                <div className="pt-1.5 border-t border-amber-200/60">
                  <span className="text-amber-800 block mb-0.5 font-medium">সহযাত্রীদের নাম ও পরিচিতি:</span>
                  <p className="bg-white/80 p-2 rounded-lg text-stone-800">
                    {haji.partnerDetails}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Personal & Parent Information */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
            <h4 className="font-bold text-[#0f2922] uppercase tracking-wider text-[11px] pb-1.5 border-b border-stone-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#DCB473]" />
              ব্যক্তিগত ও পরিচয়পত্র তথ্য
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {haji.fatherNameBn && (
                <div>
                  <span className="text-stone-500 block">পিতার নাম:</span>
                  <span className="font-semibold text-stone-800">{haji.fatherNameBn}</span>
                </div>
              )}
              {haji.motherNameBn && (
                <div>
                  <span className="text-stone-500 block">মাতার নাম:</span>
                  <span className="font-semibold text-stone-800">{haji.motherNameBn}</span>
                </div>
              )}
              {haji.passportNo && (
                <div>
                  <span className="text-stone-500 block">পাসপোর্ট নম্বর:</span>
                  <span className="font-mono font-bold text-stone-800">{haji.passportNo}</span>
                </div>
              )}
              {haji.nidNo && (
                <div>
                  <span className="text-stone-500 block">এনআইডি নম্বর:</span>
                  <span className="font-mono font-bold text-stone-800">{haji.nidNo}</span>
                </div>
              )}
              {haji.guardianPhone && (
                <div>
                  <span className="text-stone-500 block">অভিভাবকের মোবাইল:</span>
                  <span className="font-mono text-stone-800">{haji.guardianPhone}</span>
                </div>
              )}
              {haji.dateOfBirth && (
                <div>
                  <span className="text-stone-500 block">জন্ম তারিখ:</span>
                  <span className="font-mono text-stone-800">{haji.dateOfBirth}</span>
                </div>
              )}
            </div>

            {haji.presentAddress && (
              <div className="pt-2 border-t border-stone-200">
                <span className="text-stone-500 block">বর্তমান ঠিকানা:</span>
                <span className="text-stone-800 font-medium">
                  {haji.presentAddress} {haji.presentPostCode ? `(পোস্ট কোড: ${haji.presentPostCode})` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Attached Documents Gallery */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
            <h4 className="font-bold text-[#0f2922] uppercase tracking-wider text-[11px] pb-1.5 border-b border-stone-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#DCB473]" />
              আপনার আপলোডকৃত ডকুমেন্টস
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200 text-center">
                <span className="text-[10px] font-bold text-stone-600 block mb-1">পাসপোর্ট ছবি</span>
                {haji.photoUrl ? (
                  <a href={haji.photoUrl} target="_blank" rel="noreferrer" className="block group">
                    <img src={haji.photoUrl} alt="হাজীর ছবি" className="w-14 h-14 mx-auto rounded-lg object-cover border group-hover:opacity-80 transition-opacity" />
                    <span className="text-[9px] text-blue-600 underline mt-1 block">বড় করে দেখুন</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-stone-400 block py-3">সংযুক্ত নেই</span>
                )}
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-stone-200 text-center">
                <span className="text-[10px] font-bold text-stone-600 block mb-1">স্বাক্ষর</span>
                {haji.signatureUrl ? (
                  <a href={haji.signatureUrl} target="_blank" rel="noreferrer" className="block group">
                    <img src={haji.signatureUrl} alt="স্বাক্ষর" className="w-14 h-14 mx-auto rounded-lg object-contain bg-stone-50 border group-hover:opacity-80 transition-opacity" />
                    <span className="text-[9px] text-blue-600 underline mt-1 block">বড় করে দেখুন</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-stone-400 block py-3">সংযুক্ত নেই</span>
                )}
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-stone-200 text-center">
                <span className="text-[10px] font-bold text-stone-600 block mb-1">এনআইডি কপি</span>
                {haji.nidDocUrl ? (
                  <a href={haji.nidDocUrl} target="_blank" rel="noreferrer" className="block group">
                    <img src={haji.nidDocUrl} alt="NID" className="w-14 h-14 mx-auto rounded-lg object-cover border group-hover:opacity-80 transition-opacity" />
                    <span className="text-[9px] text-blue-600 underline mt-1 block">বড় করে দেখুন</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-stone-400 block py-3">সংযুক্ত নেই</span>
                )}
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-stone-200 text-center">
                <span className="text-[10px] font-bold text-stone-600 block mb-1">পাসপোর্ট কপি</span>
                {haji.passportDocUrl ? (
                  <a href={haji.passportDocUrl} target="_blank" rel="noreferrer" className="block group">
                    <img src={haji.passportDocUrl} alt="Passport" className="w-14 h-14 mx-auto rounded-lg object-cover border group-hover:opacity-80 transition-opacity" />
                    <span className="text-[9px] text-blue-600 underline mt-1 block">বড় করে দেখুন</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-stone-400 block py-3">সংযুক্ত নেই</span>
                )}
              </div>

              <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-300 text-center">
                <span className="text-[10px] font-bold text-emerald-900 block mb-1">টাকার রসিদ</span>
                {haji.paymentReceiptUrl ? (
                  <a href={haji.paymentReceiptUrl} target="_blank" rel="noreferrer" className="block group">
                    <img src={haji.paymentReceiptUrl} alt="Payment Receipt" className="w-14 h-14 mx-auto rounded-lg object-cover border border-emerald-400 group-hover:opacity-80 transition-opacity" />
                    <span className="text-[9px] text-emerald-700 font-bold underline mt-1 block">রসিদ দেখুন</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-stone-400 block py-3">রসিদ নেই</span>
                )}
              </div>
            </div>
          </div>

          {/* Official Verification Seal & Signatures for Certificate / PDF */}
          <div className="p-4 bg-gradient-to-r from-stone-50 via-emerald-50/30 to-stone-50 rounded-2xl border-2 border-[#DCB473]/40 text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-stone-200 gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-[#0f2922]">
                  মুত্তাকী হজ্ব কাফেলা ও ট্রাভেলস — কেন্দ্রীয় অনুমোদন সনদ
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#b88e44] font-bold">
                সনদ নং: CERT-{haji.registrationRef || haji.id}
              </span>
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed">
              এই মর্মে প্রত্যায়ন করা যাচ্ছে যে, <strong className="text-stone-900">{haji.nameBn || haji.name}</strong> মুত্তাকী কাফেলার কেন্দ্রীয় ডাটাবেজে <strong className="text-purple-900">{haji.selectedGroup || 'কাফেলা গ্রুপ'}</strong>-এ অনুমোদিত হাজী হিসেবে নিবন্ধিত হয়েছেন।
            </p>

            <div className="pt-3 flex justify-between items-end text-[11px] text-stone-600 border-t border-stone-200">
              <div className="text-center">
                <div className="w-24 border-b border-stone-400 mb-1 mx-auto" />
                <span>নিবন্ধিত হাজির স্বাক্ষর</span>
              </div>
              <div className="text-center">
                <div className="inline-block p-1 bg-emerald-100/60 rounded-lg border border-emerald-300 text-emerald-900 font-bold text-[10px] mb-1">
                  ✓ ভেরিফাইড ও সিলমোহরকৃত
                </div>
                <div className="w-28 border-b border-stone-400 mb-1 mx-auto" />
                <span>কাফেলা মোয়াল্লিম ও পরিচালক</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-stone-200 flex justify-between items-center text-xs">
          <span className="text-stone-500 font-medium">
            জরুরি সহায়তা: <a href="tel:01712497676" className="font-bold text-[#0f2922] hover:underline">০১৭২৪-৯৭৬৭৭৬</a>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0f2922] text-[#DCB473] font-bold rounded-xl hover:bg-[#163f34] transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
