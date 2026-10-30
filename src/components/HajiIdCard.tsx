import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { InquiryItem } from '../types';
import { useSite } from '../context/SiteContext';

const MISSING = 'প্রদান করা হয়নি';
const NO_DOC = 'সংযুক্ত নেই';

export const HajiIdCard: React.FC<{ haji: InquiryItem; onClose: () => void }> = ({
  haji,
  onClose
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { siteSettings } = useSite();
  const val = (v?: string | number | null) =>
    v === undefined || v === null || String(v).trim() === '' ? MISSING : String(v);
  const docBox = (label: string, url?: string) => (
    <div className="border border-stone-300 rounded-xl p-2 text-center">
      <p className="text-[10px] font-bold text-stone-500">{label}</p>
      {url ? (
        <img src={url} alt={label} className="mx-auto mt-1 h-16 w-auto object-cover rounded" />
      ) : (
        <p className="text-xs text-stone-500 mt-2">{NO_DOC}</p>
      )}
    </div>
  );
  const members =
    haji.linkedCompanions && haji.linkedCompanions.length > 0
      ? haji.linkedCompanions
      : haji.linkedCompanionIds && haji.linkedCompanionIds.length > 0
        ? haji.linkedCompanionIds.map((id) => ({ id, hajiUserId: id, name: MISSING }))
        : [];

  const handlePrint = () => window.print();
  const handlePdf = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = 180;
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, 'PNG', 15, 15, w, Math.min(h, 260));
    pdf.save(`haji-id-card-${haji.id}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
          aria-label="Close ID card"
        >
          <X className="w-5 h-5" />
        </button>
        <div ref={cardRef} className="bg-white border-2 border-[#DCB473] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 border-b pb-3">
            {siteSettings.logoUrl ? (
              <img src={siteSettings.logoUrl} alt="logo" className="w-12 h-12 object-contain rounded" />
            ) : null}
            <div>
              <h3 className="font-extrabold text-[#0f2922]">{siteSettings.siteNameBn}</h3>
              <p className="text-xs text-stone-500">হাজী পরিচয়পত্র (Haji ID Card)</p>
            </div>
          </div>
          <div className="flex gap-4">
            {haji.photoUrl ? (
              <img src={haji.photoUrl} alt="haji" className="w-24 h-28 object-cover rounded-xl border" />
            ) : (
              <div className="w-24 h-28 rounded-xl border bg-stone-100 flex items-center justify-center text-xs text-stone-500 text-center px-2">
                ছবি {MISSING}
              </div>
            )}
            <div className="text-sm space-y-1 flex-1">
              <p><b>নাম:</b> {val(haji.nameBn || haji.name)}</p>
              <p><b>হাজী আইডি:</b> {val(haji.hajiUserId || haji.registrationRef || haji.id)}</p>
              <p><b>প্যাকেজ:</b> {val(haji.serviceName)}</p>
              <p><b>গ্রুপ:</b> {val(haji.selectedGroup)}</p>
              <p><b>রুম:</b> {val(haji.roomPreference)}</p>
              <p><b>ফোন:</b> {val(haji.phone)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><b>পাসপোর্ট:</b> {val(haji.passportNo)}</p>
            <p><b>NID:</b> {val(haji.nidNo)}</p>
            <p><b>জন্ম তারিখ:</b> {val(haji.dateOfBirth)}</p>
            <p><b>পিতা:</b> {val(haji.fatherNameBn || haji.fatherNameEn)}</p>
            <p><b>মাতা:</b> {val(haji.motherNameBn || haji.motherNameEn)}</p>
            <p><b>ইমেইল:</b> {val(haji.email)}</p>
            <p><b>অভিভাবক ফোন:</b> {val(haji.guardianPhone)}</p>
            <p><b>ঠিকানা:</b> {val(haji.presentAddress || haji.permanentAddress)}</p>
          </div>
          {members.length > 0 && (
            <div>
              <h4 className="font-bold text-sm mb-2">সঙ্গী সদস্যবৃন্দ</h4>
              <ul className="text-sm space-y-1">
                {members.map((m) => (
                  <li key={m.id}>
                    {m.name} — আইডি: {m.hajiUserId || m.id}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {docBox('NID', haji.nidDocUrl)}
            {docBox('পাসপোর্ট', haji.passportDocUrl)}
            {docBox('রশিদ', haji.paymentReceiptUrl)}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-[#0f2922] text-[#DCB473] font-bold rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" /> প্রিন্ট
          </button>
          <button
            onClick={handlePdf}
            className="flex-1 py-2.5 bg-[#DCB473] text-[#0f2922] font-bold rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> PDF ডাউনলোড
          </button>
        </div>
      </div>
    </div>
  );
};
