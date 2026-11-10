import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { InquiryItem, PaymentRecord, PaymentMethod } from '../types';
import { useAdmin } from '../context/AdminContext';
import { prepareReceiptFile } from '../utils/receiptHelpers';
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
  Sparkles,
  Plus,
  Upload,
  Eye,
  ExternalLink,
  Check
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
  const { hajiFinanceRecords, addPilgrimPayment, showToast } = useAdmin();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Find linked finance record for live payments and calculations
  const financeRecord = hajiFinanceRecords.find(
    (f) =>
      (haji.registrationRef && f.registrationRef === haji.registrationRef) ||
      (haji.hajiUserId && f.hajiUserId === haji.hajiUserId) ||
      (haji.id && f.inquiryId === haji.id) ||
      (haji.phone && f.phone === haji.phone)
  );

  // Live calculations
  const packageTotal = financeRecord?.finalTotalAmount || haji.finalTotalAmount || haji.subtotalAmount || 0;
  const totalPaid = financeRecord?.totalDeposited ?? haji.paidAmount ?? 0;
  const totalDue = financeRecord?.dueAmount ?? haji.dueAmount ?? Math.max(0, packageTotal - totalPaid);

  // Combined payment records
  const paymentList: PaymentRecord[] = financeRecord?.payments && financeRecord.payments.length > 0
    ? financeRecord.payments
    : haji.paidAmount && haji.paidAmount > 0
    ? [
        {
          id: 'initial-reg-pay',
          amount: haji.paidAmount,
          date: haji.paymentDate || haji.date || '২০২৬-১০-২৫',
          method: (haji.paymentMethod as PaymentMethod) || 'bank',
          voucherNo: haji.registrationRef || 'REG-INIT',
          receivedBy: 'মুত্তাকী এডমিন (অনুমোদিত)',
          receiptDataUrl: haji.paymentReceiptUrl,
          receiptFileName: haji.paymentReceiptName || 'টাকার জমা রসিদ',
          status: 'approved',
          submittedBy: 'admin',
          note: 'নিবন্ধনকালীন পরিশোধিত জমা'
        }
      ]
    : [];

  // State for Haji Money Deposit Modal
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(totalDue > 0 ? totalDue : 0);
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>('bank');
  const [depositDate, setDepositDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [depositVoucher, setDepositVoucher] = useState<string>('');
  const [depositNote, setDepositNote] = useState<string>('');
  const [receiptDataUrl, setReceiptDataUrl] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [receiptMimeType, setReceiptMimeType] = useState<string>('');
  const [isReceiptUploading, setIsReceiptUploading] = useState<boolean>(false);

  // State for viewing Money Receipt in Lightbox
  const [viewingReceipt, setViewingReceipt] = useState<{
    url: string;
    fileName?: string;
    title: string;
    amount?: number;
    date?: string;
  } | null>(null);

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

  // Handle receipt upload for Haji
  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReceiptUploading(true);
    try {
      const receipt = await prepareReceiptFile(file);
      setReceiptDataUrl(receipt.dataUrl);
      setReceiptFileName(receipt.fileName);
      setReceiptMimeType(receipt.mimeType);
      showToast('মানি রিসিট ফাইলটি সফলভাবে প্রস্তুত হয়েছে!');
    } catch (err: any) {
      showToast(err?.message || 'রসিদ ফাইল প্রসেস করা যায়নি।');
    } finally {
      setIsReceiptUploading(false);
      e.target.value = '';
    }
  };

  // Handle Haji deposit submission
  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || depositAmount <= 0) {
      showToast('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন!');
      return;
    }

    if (!depositVoucher.trim()) {
      showToast('অনুগ্রহ করে ভাউচার নং / ট্রানজাকশন আইডি লিখুন!');
      return;
    }

    const targetFinanceId = financeRecord?.id || `fin-${haji.id}`;

    addPilgrimPayment(targetFinanceId, {
      amount: Number(depositAmount),
      date: depositDate,
      method: depositMethod,
      voucherNo: depositVoucher.trim(),
      note: depositNote.trim() || undefined,
      receiptDataUrl: receiptDataUrl || undefined,
      receiptFileName: receiptFileName || undefined,
      receiptMimeType: receiptMimeType || undefined,
      submittedBy: 'haji',
      status: 'pending' // As requested: pending approval for admin
    });

    // Reset and close
    setDepositAmount(0);
    setDepositVoucher('');
    setDepositNote('');
    setReceiptDataUrl('');
    setReceiptFileName('');
    setReceiptMimeType('');
    setIsDepositModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-7 shadow-2xl relative border border-[#DCB473]/30 max-h-[92vh] overflow-y-auto">
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
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-300">
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

        {/* ACTION BAR: DOWNLOAD PDF, PRINT SLIP & ADD PAYMENT */}
        <div className="bg-gradient-to-r from-[#0f2922] via-[#163f34] to-[#0f2922] text-white p-3.5 sm:p-4 rounded-2xl mb-4 border border-[#DCB473]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#DCB473]/20 text-[#DCB473] flex items-center justify-center shrink-0 border border-[#DCB473]/40">
              <Sparkles className="w-5 h-5 text-[#DCB473]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#DCB473]">
                হাজী রেজিস্ট্রেশন সনদ ও অনলাইন পেমেন্ট পোর্টাল
              </h4>
              <p className="text-[11px] text-stone-300">
                আপনার চুক্তি, জমার কিস্তি ও আপলোডকৃত মানি রিসিট নিচে দেখুন অথবা নতুন পেমেন্ট জমা দিন
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDepositAmount(totalDue > 0 ? totalDue : 0);
                setIsDepositModalOpen(true);
              }}
              className="px-3.5 py-2 bg-[#DCB473] hover:bg-[#c9a05e] text-[#0f2922] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>টাকা জমা ও রিসিট আপলোড</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-white/20 cursor-pointer disabled:opacity-60"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'তৈরি হচ্ছে...' : 'সনদ ডাউনলোড'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-white/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট</span>
            </button>
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
              <div>
                <span className="text-stone-500 block">পাসপোর্ট নম্বর:</span>
                <span className="font-mono font-bold text-stone-800">{haji.passportNo || 'অপেক্ষমান'}</span>
              </div>
            </div>
          </div>

          {/* 1. Payment & Remaining Due Ledger Card */}
          <div className="p-4 bg-gradient-to-br from-stone-900 via-[#0f2922] to-[#163f34] text-white rounded-2xl border border-[#DCB473]/50 shadow-md space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-white/10 gap-2">
              <h4 className="font-bold text-[#DCB473] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                পেমেন্ট ও বকেয়া হিসাব (Payment & Due Balance)
              </h4>
              {totalPaid >= packageTotal && packageTotal > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ✓ সম্পূর্ণ পরিশোধিত (Paid)
                </span>
              ) : totalPaid > 0 ? (
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
                <span className="text-stone-400 text-[10px] block">১. নির্ধারিত মোট চুক্তি মূল্য:</span>
                <span className="font-mono text-sm sm:text-base font-bold text-white block mt-0.5">
                  ৳ {packageTotal.toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-300 text-[10px] block">২. অনুমোদিত মোট জমা:</span>
                <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 block mt-0.5">
                  ৳ {totalPaid.toLocaleString('bn-BD')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-amber-300 text-[10px] block">৩. অবশিষ্ট ডিউ / বকেয়া:</span>
                <span className="font-mono text-sm sm:text-base font-bold text-[#DCB473] block mt-0.5">
                  ৳ {totalDue.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-[11px] text-stone-300">
              <span>টাকা পরিশোধের সূত্র: চুক্তি মূল্য − অনুমোদিত জমা = অবশিষ্ট ডিউ</span>
              <button
                type="button"
                onClick={() => {
                  setDepositAmount(totalDue > 0 ? totalDue : 0);
                  setIsDepositModalOpen(true);
                }}
                className="px-3 py-1 bg-[#DCB473] text-[#0f2922] font-bold rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                + টাকা জমা ও স্লিপ দিন
              </button>
            </div>
          </div>

          {/* 2. Deposit History & Money Receipts (জমা টাকার কিস্তি ও মানি রিসিট বিবরণী) */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/90 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-stone-200 gap-2">
              <div>
                <h4 className="font-bold text-[#0f2922] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                  জমা টাকার কিস্তিসমূহ ও মানি রিসিট তালিকা (Payment & Receipts)
                </h4>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  আপনার জমা দেওয়া কিস্তি ও ব্যাংক মানি রিসিটের লাইভ স্টেটমেন্ট
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDepositAmount(totalDue > 0 ? totalDue : 0);
                  setIsDepositModalOpen(true);
                }}
                className="px-2.5 py-1.5 bg-[#0f2922] hover:bg-[#163f34] text-[#DCB473] font-bold text-[11px] rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন জমা দিন</span>
              </button>
            </div>

            {paymentList.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-dashed border-stone-300 text-center text-stone-500">
                <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="font-bold text-stone-700">এখনো কোনো টাকা জমার রেকর্ড পাওয়া যায়নি।</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  উপরে "টাকা জমা ও রিসিট আপলোড" বাটনে ক্লিক করে আপনার ব্যাংক ডিপোজিট বা ট্রানজাকশন স্লিপ আপলোড করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paymentList.map((pmt, idx) => {
                  const isPending = pmt.status === 'pending';
                  const isRejected = pmt.status === 'rejected';
                  const isApproved = !isPending && !isRejected;

                  return (
                    <div
                      key={pmt.id || idx}
                      className={`p-3 rounded-2xl border bg-white shadow-2xs transition-all ${
                        isPending
                          ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-200'
                          : isRejected
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-stone-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-stone-400 text-[10px]">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-stone-900 text-xs">
                              {pmt.date}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200 uppercase">
                              {pmt.method}
                            </span>

                            {isApproved && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                অনুমোদিত (Approved)
                              </span>
                            )}

                            {isPending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                অনুমোদনের অপেক্ষায় (Pending)
                              </span>
                            )}

                            {isRejected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                বাতিল
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-500 font-mono">
                            {pmt.voucherNo && (
                              <span>
                                ভাউচার / স্লিপ নং: <b className="text-stone-800">{pmt.voucherNo}</b>
                              </span>
                            )}
                            {pmt.note && (
                              <span className="text-stone-600 italic font-sans">
                                ({pmt.note})
                              </span>
                            )}
                            {pmt.submittedBy === 'haji' && (
                              <span className="text-purple-700 font-sans font-semibold">
                                · হাজী কর্তৃক অনলাইনে জমা
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount & Receipt button */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block">জমার পরিমাণ</span>
                            <span className={`text-base font-extrabold font-mono ${isPending ? 'text-amber-700' : 'text-emerald-700'}`}>
                              +৳ {pmt.amount.toLocaleString('bn-BD')}
                            </span>
                          </div>

                          {/* View Receipt Button */}
                          {pmt.receiptDataUrl ? (
                            <button
                              type="button"
                              onClick={() =>
                                setViewingReceipt({
                                  url: pmt.receiptDataUrl!,
                                  fileName: pmt.receiptFileName || `Money-Receipt-${pmt.voucherNo || pmt.id}`,
                                  title: `মানি রিসিট (৳${pmt.amount.toLocaleString('bn-BD')})`,
                                  amount: pmt.amount,
                                  date: pmt.date
                                })
                              }
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border border-emerald-300 transition-colors cursor-pointer"
                              title="মানি রিসিট বড় করে দেখুন"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-700" />
                              <span>রসিদ দেখুন</span>
                            </button>
                          ) : haji.paymentReceiptUrl ? (
                            <a
                              href={haji.paymentReceiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-[11px] font-bold flex items-center gap-1 border border-stone-300 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>মূল রসিদ</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">রসিদ ফাইল নেই</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin-Linked Companions */}
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

          {/* Personal & Address Info */}
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
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-stone-200 flex justify-between items-center text-xs">
          <span className="text-stone-500 font-medium">
            জরুরি সহায়তা ও হেল্পলাইন: <a href="tel:01712497676" className="font-bold text-[#0f2922] hover:underline">০১৭২৪-৯৭৬৭৭৬</a>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0f2922] text-[#DCB473] font-bold rounded-xl hover:bg-[#163f34] transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: হাজী কর্তৃক টাকা জমা ও মানি রিসিট আপলোড ফরম        */}
      {/* ======================================================== */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative border-2 border-[#DCB473]">
            <button
              onClick={() => setIsDepositModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3 mb-4">
              <span className="text-[10px] font-bold text-[#b88e44] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                অনলাইন পেমেন্ট জমা ও ভাউচার আপলোড
              </span>
              <h3 className="text-lg font-bold text-[#0f2922]">
                টাকা জমা ও মানি রিসিট আপলোড করুন
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                ব্যাংক বা অনলাইনে টাকা পাঠিয়ে স্লিপের ছবি/পিডিএফ আপলোড করুন। এডমিন অনুমোদনের পর তা আপনার মূল হিসাবে যুক্ত হবে।
              </p>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-3.5">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex justify-between items-center text-xs">
                <span className="text-amber-900 font-medium">আপনার বর্তমান অবশিষ্ট বকেয়া:</span>
                <span className="font-black text-rose-700 text-sm font-mono">
                  ৳ {totalDue.toLocaleString('bn-BD')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  জমা টাকার পরিমাণ (৳ BDT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-stone-400 font-bold">৳</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={depositAmount || ''}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    placeholder="যেমন: ৫০,০০০"
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    টাকা পাঠানোর মাধ্যম *
                  </label>
                  <select
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  >
                    <option value="bank">ব্যাংক ডিপোজিট / ট্রান্সফার</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="cash">সরাসরি ক্যাশ</option>
                    <option value="check">ব্যাংক চেক</option>
                    <option value="other">অন্যান্য মাধ্যম</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    টাকা পাঠানোর তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ভাউচার নং / ট্রানজাকশন আইডি / ব্যাংক ডিপোজিট স্লিপ নং *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: TRX-99238 বা ব্যাংক ভাউচার নং"
                  value={depositVoucher}
                  onChange={(e) => setDepositVoucher(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              {/* Money Receipt File Upload */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মানি রিসিট / ব্যাংক জমা স্লিপ আপলোড (ছবি বা PDF)
                </label>

                {receiptDataUrl ? (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-emerald-950 truncate block">
                          {receiptFileName || 'মানি রিসিট ফাইল'}
                        </span>
                        <span className="text-[10px] text-emerald-700 block">
                          রসিদ সংযুক্ত হয়েছে (ক্লিক করে যাচাই করতে পারেন)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setViewingReceipt({
                            url: receiptDataUrl,
                            fileName: receiptFileName,
                            title: 'আপলোডকৃত মানি রিসিট প্রিভিউ'
                          })
                        }
                        className="px-2.5 py-1 text-[11px] font-bold bg-white text-emerald-800 rounded-lg border border-emerald-300 hover:bg-emerald-100"
                      >
                        প্রিভিউ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptDataUrl('');
                          setReceiptFileName('');
                          setReceiptMimeType('');
                        }}
                        className="px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 rounded-lg"
                      >
                        বাদ দিন
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-stone-300 hover:border-[#DCB473] bg-stone-50/60 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                    <Upload className="w-6 h-6 text-stone-400 mb-1" />
                    <span className="text-xs font-bold text-stone-700">
                      {isReceiptUploading ? 'ফাইল প্রসেসিং হচ্ছে...' : 'রসিদ বা স্লিপের ছবি/PDF নির্বাচন করুন'}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-0.5">
                      JPG, PNG, WEBP অথবা PDF (সর্বোচ্চ ৮ MB)
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={isReceiptUploading}
                      onChange={handleReceiptFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মন্তব্য / ব্যাংকের শাখা ও বিবরণ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ইসলামী ব্যাংক উত্তরা শাখা থেকে ট্রান্সফার"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#DCB473]"
                />
              </div>

              {/* Note about admin approval requirement */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>জরুরি তথ্য:</strong> আপনার সাবমিটকৃত টাকা এবং মানি রিসিট অ্যাডমিন প্যানেলে অনুমোদনের জন্য পেন্ডিং থাকবে। এডমিন কর্তৃপক্ষ ব্যাংক অ্যাকাউন্টের সাথে মিলিয়ে অনুমোদন প্রদান করলে স্বয়ংক্রিয়ভাবে আপনার ডিউ কমে যাবে।
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isReceiptUploading}
                  className="px-5 py-2 bg-[#0f2922] text-[#DCB473] hover:bg-[#163f34] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>জমা দিন (অনুমোদনের জন্য প্রেরণ)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: মানি রিসিট ভিউয়ার / লাইটবক্স (Receipt Lightbox)     */}
      {/* ======================================================== */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative border-2 border-[#DCB473] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0f2922]">
                    {viewingReceipt.title || 'মানি রিসিট প্রিভিউ'}
                  </h4>
                  {viewingReceipt.date && (
                    <span className="text-[10px] text-stone-500 font-mono">
                      তারিখ: {viewingReceipt.date}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={viewingReceipt.url}
                  download={viewingReceipt.fileName || 'Money-Receipt'}
                  className="px-3 py-1.5 bg-[#DCB473] text-[#0f2922] font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs hover:bg-white border border-[#DCB473] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ডাউনলোড</span>
                </a>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-stone-100 p-2 flex items-center justify-center min-h-[300px]">
              {viewingReceipt.url.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewingReceipt.url}
                  title="Money Receipt PDF"
                  className="w-full h-[550px] rounded-xl border border-stone-200"
                />
              ) : (
                <img
                  src={viewingReceipt.url}
                  alt="মানি রিসিট"
                  className="max-h-[600px] w-auto max-w-full rounded-xl object-contain shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
