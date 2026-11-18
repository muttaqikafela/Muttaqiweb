import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  ImageDown,
  Save,
  RotateCcw,
  Upload,
  SlidersHorizontal,
  Check,
  User,
  QrCode,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { HajiIdCardData, InquiryItem } from '../types';

const ID_CARD_DEFAULTS_STORAGE_KEY = 'muttaqi_haji_id_card_defaults_v1';
const UNIVERSAL_VISA_QR_URL = '/assets/id-card/visa-inquiry-qr.png';
const MUTTAQI_EMBLEM_URL = '/assets/id-card/muttaqi-emblem.png';
const CORNER_ORNAMENT_URL = '/assets/id-card/corner-ornament.png';
const NAME_PLAQUE_URL = '/assets/id-card/name-plaque.png';
const SAUDI_EMBLEM_URL = '/assets/id-card/saudi-emblem.png';

interface SharedGuideDefaults {
  guideName: string;
  saudiContact: string;
  bdContact: string;
  pilgrimLabel: string;
  nationality: string;
}

const BASE_SHARED_DEFAULTS: SharedGuideDefaults = {
  guideName: 'MD RAJU MIA',
  saudiContact: '+966 56 521 3812',
  bdContact: '+88 01746 900 513',
  pilgrimLabel: 'PILGRIM OF\nBANGLADESH',
  nationality: 'Bangladeshi'
};

function readSharedDefaults(): SharedGuideDefaults {
  try {
    const raw = localStorage.getItem(ID_CARD_DEFAULTS_STORAGE_KEY);
    if (!raw) return BASE_SHARED_DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      guideName: parsed.guideName || BASE_SHARED_DEFAULTS.guideName,
      saudiContact: parsed.saudiContact || BASE_SHARED_DEFAULTS.saudiContact,
      bdContact: parsed.bdContact || BASE_SHARED_DEFAULTS.bdContact,
      pilgrimLabel: parsed.pilgrimLabel || BASE_SHARED_DEFAULTS.pilgrimLabel,
      nationality: parsed.nationality || BASE_SHARED_DEFAULTS.nationality
    };
  } catch {
    return BASE_SHARED_DEFAULTS;
  }
}

interface HajiIdCardProps {
  haji: InquiryItem;
  hajiType?: 'hajj' | 'umrah';
  onSave?: (hajiId: string, data: HajiIdCardData) => void;
  onClose: () => void;
  headlessExportJpg?: boolean;
  onHeadlessExportDone?: (success: boolean, fileName?: string) => void;
}

interface EditableCardState {
  pilgrimLabel: string;
  fullName: string;
  nationality: string;
  passportNo: string;
  visaNo: string;
  travelPurpose: string;
  visaBannerTitle: string;
  visaBannerSubtitle: string;
  guideTitle: string;
  guideName: string;
  saudiContact: string;
  bdContact: string;
  photoUrl: string;
  photoZoom: number;
  photoPositionY: number;
}

function buildInitialCardState(
  haji: InquiryItem,
  hajiType: 'hajj' | 'umrah',
  sharedDefaults: SharedGuideDefaults
): EditableCardState {
  const saved = haji.idCardData || {};
  const isUmrah = hajiType === 'umrah';
  const rawName =
    saved.fullName ||
    haji.nameEn ||
    haji.englishName ||
    haji.name ||
    haji.nameBn ||
    '';

  return {
    pilgrimLabel: saved.pilgrimLabel || sharedDefaults.pilgrimLabel,
    fullName: rawName.trim().toUpperCase(),
    nationality: saved.nationality || sharedDefaults.nationality,
    passportNo: saved.passportNo ?? haji.passportNo ?? haji.passportOrNid ?? '',
    visaNo: saved.visaNo ?? haji.visaNo ?? '',
    travelPurpose:
      saved.travelPurpose ||
      (isUmrah ? 'Travel Purposes Holy Umrah' : 'Travel Purposes Holy Hajj'),
    visaBannerTitle: saved.visaBannerTitle || 'For Visa Inquiry',
    visaBannerSubtitle: saved.visaBannerSubtitle || 'Please Scan the QR Code',
    guideTitle: saved.guideTitle || (isUmrah ? 'Umrah Guide' : 'Hajj Guide'),
    guideName: saved.guideName || sharedDefaults.guideName,
    saudiContact: saved.saudiContact || sharedDefaults.saudiContact,
    bdContact: saved.bdContact || sharedDefaults.bdContact,
    photoUrl: saved.photoUrl || haji.photoUrl || haji.pilgrimPhoto || '',
    photoZoom: typeof saved.photoZoom === 'number' ? saved.photoZoom : 100,
    photoPositionY: typeof saved.photoPositionY === 'number' ? saved.photoPositionY : 20
  };
}

function getNameFontSize(name: string): number {
  const clean = name.trim();
  const lines = clean.split('\n').filter(Boolean);
  const longestLine = lines.reduce((m, l) => Math.max(m, l.length), 0);
  if (lines.length === 1) {
    if (clean.length <= 15) return 21;
    if (clean.length <= 21) return 18.5;
    if (clean.length <= 32) return 17.5;
    return 15;
  }
  if (longestLine <= 19) return 18;
  if (longestLine <= 24) return 16;
  return 14.2;
}

export const HajiIdCard: React.FC<HajiIdCardProps> = ({
  haji,
  hajiType = 'umrah',
  onSave,
  onClose,
  headlessExportJpg = false,
  onHeadlessExportDone
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const headlessTriggeredRef = useRef<string | null>(null);

  const [form, setForm] = useState<EditableCardState>(() =>
    buildInitialCardState(haji, hajiType, readSharedDefaults())
  );
  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [printSize, setPrintSize] = useState<'standard' | 'large'>('standard');
  const [previewScale, setPreviewScale] = useState<number>(0.76);
  const [isExporting, setIsExporting] = useState<'jpg' | 'png' | 'pdf' | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Sync state if user opens another pilgrim while modal is mounted
  useEffect(() => {
    setForm(buildInitialCardState(haji, hajiType, readSharedDefaults()));
  }, [haji.id, hajiType]);

  // Toggle isolated print class on document.body (only for visible modal, not headless export)
  useEffect(() => {
    if (headlessExportJpg || typeof document === 'undefined') return;
    document.body.classList.add('has-haji-id-card-print');
    return () => {
      document.body.classList.remove('has-haji-id-card-print');
    };
  }, [headlessExportJpg]);

  // Keep the 550x800 ID card master proportionally scaled inside the preview pane
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const updateScale = () => {
      const availW = Math.max(260, el.clientWidth - 24);
      const maxCardW = showEditor ? 425 : 470;
      const targetW = Math.min(availW, maxCardW);
      setPreviewScale(Math.min(0.86, Math.max(0.48, targetW / 550)));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showEditor]);

  const flashNotice = (msg: string) => {
    setSavedNotice(msg);
    window.setTimeout(() => setSavedNotice(null), 2600);
  };

  const updateField = <K extends keyof EditableCardState>(key: K, value: EditableCardState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('photoUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveCard = () => {
    const payload: HajiIdCardData = {
      pilgrimLabel: form.pilgrimLabel,
      fullName: form.fullName,
      nationality: form.nationality,
      passportNo: form.passportNo,
      visaNo: form.visaNo,
      travelPurpose: form.travelPurpose,
      visaBannerTitle: form.visaBannerTitle,
      visaBannerSubtitle: form.visaBannerSubtitle,
      guideTitle: form.guideTitle,
      guideName: form.guideName,
      saudiContact: form.saudiContact,
      bdContact: form.bdContact,
      photoUrl: form.photoUrl,
      photoZoom: form.photoZoom,
      photoPositionY: form.photoPositionY
    };
    onSave?.(haji.id, payload);
    flashNotice('আইডি কার্ডের পরিবর্তন সংরক্ষিত হয়েছে');
  };

  const handleSaveSharedDefaults = () => {
    try {
      const nextDefaults: SharedGuideDefaults = {
        guideName: form.guideName.trim() || BASE_SHARED_DEFAULTS.guideName,
        saudiContact: form.saudiContact.trim() || BASE_SHARED_DEFAULTS.saudiContact,
        bdContact: form.bdContact.trim() || BASE_SHARED_DEFAULTS.bdContact,
        pilgrimLabel: form.pilgrimLabel.trim() || BASE_SHARED_DEFAULTS.pilgrimLabel,
        nationality: form.nationality.trim() || BASE_SHARED_DEFAULTS.nationality
      };
      localStorage.setItem(ID_CARD_DEFAULTS_STORAGE_KEY, JSON.stringify(nextDefaults));
      flashNotice('গাইড ও যোগাযোগ নম্বর সকল নতুন কার্ডের ডিফল্ট হিসেবে সেট হয়েছে');
    } catch {
      flashNotice('ডিফল্ট সংরক্ষণ করা যায়নি');
    }
  };

  const handleResetToOriginal = () => {
    const isUmrah = hajiType === 'umrah';
    const rawName = haji.nameEn || haji.englishName || haji.name || haji.nameBn || '';
    setForm({
      pilgrimLabel: BASE_SHARED_DEFAULTS.pilgrimLabel,
      fullName: rawName.trim().toUpperCase(),
      nationality: BASE_SHARED_DEFAULTS.nationality,
      passportNo: haji.passportNo || haji.passportOrNid || '',
      visaNo: haji.visaNo || '',
      travelPurpose: isUmrah ? 'Travel Purposes Holy Umrah' : 'Travel Purposes Holy Hajj',
      visaBannerTitle: 'For Visa Inquiry',
      visaBannerSubtitle: 'Please Scan the QR Code',
      guideTitle: isUmrah ? 'Umrah Guide' : 'Hajj Guide',
      guideName: BASE_SHARED_DEFAULTS.guideName,
      saudiContact: BASE_SHARED_DEFAULTS.saudiContact,
      bdContact: BASE_SHARED_DEFAULTS.bdContact,
      photoUrl: haji.photoUrl || haji.pilgrimPhoto || '',
      photoZoom: 100,
      photoPositionY: 20
    });
    flashNotice('মূল হাজীর তথ্য ও ডিফল্ট ফরম্যাটে রিসেট হয়েছে');
  };

  const waitForCardImages = async (container: HTMLElement) => {
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          window.setTimeout(done, 3000);
        });
      })
    );
  };

  const captureCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await waitForCardImages(cardRef.current);

    return html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      width: 550,
      height: 800,
      windowWidth: 550,
      windowHeight: 800,
      onclone: (clonedDoc) => {
        // Sanitize Tailwind v4 oklch/oklab/color-mix rules inside temporary clone so html2canvas never fails
        clonedDoc.querySelectorAll('style').forEach((styleTag) => {
          if (!styleTag.textContent) return;
          if (/okl(?:ch|ab)|color-mix/i.test(styleTag.textContent)) {
            styleTag.textContent = styleTag.textContent
              .replace(/okl(?:ch|ab)\([^)]*\)/gi, 'rgb(15, 41, 34)')
              .replace(/color-mix\([^;{}]*\)/gi, 'transparent');
          }
        });

        clonedDoc.documentElement.style.color = '#000000';
        clonedDoc.documentElement.style.backgroundColor = '#ffffff';
        clonedDoc.body.style.color = '#000000';
        clonedDoc.body.style.backgroundColor = '#ffffff';
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';

        const clonedEl = clonedDoc.querySelector(
          '[data-haji-id-canvas="true"]'
        ) as HTMLElement | null;
        if (clonedEl) {
          // Neutralize transforms, blurs, shadows & offscreen positioning on ancestors in the clone
          let ancestor = clonedEl.parentElement;
          while (ancestor && ancestor !== clonedDoc.body) {
            ancestor.style.position = 'static';
            ancestor.style.left = '0';
            ancestor.style.top = '0';
            ancestor.style.transform = 'none';
            ancestor.style.backgroundColor = '#ffffff';
            ancestor.style.boxShadow = 'none';
            ancestor.style.backdropFilter = 'none';
            ancestor.style.borderColor = 'transparent';
            ancestor = ancestor.parentElement;
          }

          clonedEl.style.transform = 'none';
          clonedEl.style.position = 'relative';
          clonedEl.style.left = '0';
          clonedEl.style.top = '0';
          clonedEl.style.margin = '0';
          clonedEl.style.color = '#005051';
          clonedEl.style.backgroundColor = '#ffffff';

          const view = clonedDoc.defaultView;
          if (view) {
            clonedEl.querySelectorAll('*').forEach((node) => {
              if (!(node instanceof HTMLElement)) return;
              const cs = view.getComputedStyle(node);
              if (/okl(?:ch|ab)|color-mix/i.test(cs.color)) node.style.color = '#005051';
              if (/okl(?:ch|ab)|color-mix/i.test(cs.backgroundColor)) node.style.backgroundColor = 'transparent';
              if (/okl(?:ch|ab)|color-mix/i.test(cs.borderColor)) node.style.borderColor = 'transparent';
              if (/okl(?:ch|ab)|color-mix/i.test(cs.outlineColor)) node.style.outlineColor = 'transparent';
            });
          }
        }
      }
    });
  };

  const getSafeFileSlug = () => {
    const raw = (form.fullName || haji.registrationRef || haji.id || 'pilgrim')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return raw || haji.id;
  };

  const triggerCanvasFileDownload = async (
    canvas: HTMLCanvasElement,
    mimeType: 'image/jpeg' | 'image/png',
    fileName: string,
    quality = 0.96
  ) => {
    const blob = await new Promise<Blob | null>((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), mimeType, quality);
      } catch {
        resolve(null);
      }
    });

    const link = document.createElement('a');
    link.download = fileName;
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } else {
      link.href = canvas.toDataURL(mimeType, quality);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadJpg = async (): Promise<{ ok: boolean; fileName?: string }> => {
    setIsExporting('jpg');
    try {
      const captured = await captureCardCanvas();
      if (!captured) return { ok: false };

      // Composite onto an opaque solid-white canvas so JPEG has zero transparency artifacts
      const jpgCanvas = document.createElement('canvas');
      jpgCanvas.width = captured.width;
      jpgCanvas.height = captured.height;
      const ctx = jpgCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
        ctx.drawImage(captured, 0, 0);
      }

      const fileName = `muttaqi-id-card-${getSafeFileSlug()}.jpg`;
      await triggerCanvasFileDownload(ctx ? jpgCanvas : captured, 'image/jpeg', fileName, 0.96);
      if (!headlessExportJpg) {
        flashNotice('আইডি কার্ডটি JPG আকারে ডাউনলোড হয়েছে');
      }
      return { ok: true, fileName };
    } catch (err) {
      console.error('Haji ID Card JPG export error:', err);
      if (!headlessExportJpg) {
        flashNotice('JPG ডাউনলোড করতে সমস্যা হয়েছে — আবার চেষ্টা করুন');
      }
      return { ok: false };
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadPng = async () => {
    setIsExporting('png');
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;
      const fileName = `muttaqi-id-card-${getSafeFileSlug()}.png`;
      await triggerCanvasFileDownload(canvas, 'image/png', fileName, 1.0);
      flashNotice('আইডি কার্ডটি PNG আকারে ডাউনলোড হয়েছে');
    } catch (err) {
      console.error('Haji ID Card PNG export error:', err);
      flashNotice('PNG ডাউনলোড করতে সমস্যা হয়েছে — আবার চেষ্টা করুন');
    } finally {
      setIsExporting(null);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting('pdf');
    try {
      const canvas = await captureCardCanvas();
      if (!canvas) return;
      const imgData = canvas.toDataURL('image/png', 1.0);
      if (printSize === 'standard') {
        // Standard physical Hajj/Umrah lanyard ID card: 95mm x 138.18mm centered on A4
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const cardW = 95;
        const cardH = (800 / 550) * cardW; // 138.18mm
        const x = (210 - cardW) / 2;
        const y = 25.4; // 1 inch top margin
        pdf.addImage(imgData, 'PNG', x, y, cardW, cardH, undefined, 'FAST');
        pdf.save(`muttaqi-id-card-${getSafeFileSlug()}.pdf`);
      } else {
        // Large A4 presentation print with 1-inch margin
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const cardW = 148;
        const cardH = (800 / 550) * cardW; // 215.27mm
        const x = (210 - cardW) / 2;
        const y = (297 - cardH) / 2;
        pdf.addImage(imgData, 'PNG', x, y, cardW, cardH, undefined, 'FAST');
        pdf.save(`muttaqi-id-card-a4-${getSafeFileSlug()}.pdf`);
      }
      flashNotice('আইডি কার্ডটি PDF আকারে ডাউনলোড হয়েছে');
    } catch (err) {
      console.error('Haji ID Card PDF export error:', err);
      flashNotice('PDF ডাউনলোড করতে সমস্যা হয়েছে — আবার চেষ্টা করুন');
    } finally {
      setIsExporting(null);
    }
  };

  // Automatic 1-click headless JPG download when invoked directly from the Haji List
  useEffect(() => {
    if (!headlessExportJpg) return;
    if (headlessTriggeredRef.current === haji.id) return;
    headlessTriggeredRef.current = haji.id;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      if (cancelled) return;
      const result = await handleDownloadJpg();
      if (!cancelled) {
        onHeadlessExportDone?.(result.ok, result.fileName);
        onClose();
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [headlessExportJpg, haji.id]);

  const handlePrint = () => {
    window.print();
  };

  const displayFullName = form.fullName.trim() || 'PILGRIM FULL NAME';
  const nameFontSize = getNameFontSize(displayFullName);
  const scaledWidth = Math.round(550 * previewScale);
  const scaledHeight = Math.round(800 * previewScale);

  const modalContent = (
    <div
      className={`haji-id-card-print-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto ${
        printSize === 'standard' ? 'haji-id-card-print-standard' : 'haji-id-card-print-large'
      }`}
    >
      <div className="haji-id-card-modal-shell bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header (Hidden in Print) */}
        <div className="print:hidden px-4 sm:px-6 py-3.5 bg-[#0f2922] text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-[#DCB473] leading-tight">
              হাজী আইডি কার্ড তৈরি ও সম্পাদনা
            </h3>
            <p className="text-xs text-emerald-100/80 truncate mt-0.5">
              {haji.nameBn || haji.name} · {hajiType === 'umrah' ? 'ওমরাহ্ হজ' : 'মূল হজ'} · রেফারেন্স: {haji.registrationRef || haji.id}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowEditor((prev) => !prev)}
              className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showEditor
                  ? 'bg-[#DCB473] text-[#0f2922]'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showEditor ? 'এডিট প্যানেল লুকান' : 'এডিট করুন'}</span>
            </button>

            {onSave && (
              <button
                type="button"
                onClick={handleSaveCard}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                void handleDownloadJpg();
              }}
              disabled={isExporting !== null}
              className="px-3.5 py-2 bg-[#DCB473]/20 hover:bg-[#DCB473]/35 border border-[#DCB473]/70 disabled:opacity-60 text-[#F0D59E] rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="উচ্চমানের JPG ছবি হিসেবে ডাউনলোড করুন"
            >
              <ImageDown className="w-3.5 h-3.5 text-[#DCB473]" />
              <span>{isExporting === 'jpg' ? 'JPG তৈরি হচ্ছে...' : 'JPG ডাউনলোড'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting !== null}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ImageDown className="w-3.5 h-3.5 text-[#DCB473]" />
              <span>{isExporting === 'png' ? 'তৈরি হচ্ছে...' : 'PNG'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting !== null}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#DCB473]" />
              <span>{isExporting === 'pdf' ? 'তৈরি হচ্ছে...' : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-[#DCB473] hover:bg-[#e7c488] text-[#0f2922] rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-emerald-100/75 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save confirmation banner */}
        {savedNotice && (
          <div className="print:hidden px-5 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Workspace Body: Left Live ID Card Preview + Right Editor Controls */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT: LIVE ID CARD PREVIEW STAGE */}
          <div
            ref={previewContainerRef}
            className="haji-id-card-preview-stage flex-1 bg-stone-100/90 p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-start gap-4"
          >
            {/* Print Size Segmented Control */}
            <div className="print:hidden flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-stone-500 font-medium">প্রিন্ট / PDF সাইজ:</span>
              <div className="inline-flex items-center gap-1 p-1 bg-white border border-stone-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPrintSize('standard')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    printSize === 'standard'
                      ? 'bg-[#0f2922] text-[#DCB473]'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  স্ট্যান্ডার্ড আইডি (৯.৫ × ১৩.৮ সে.মি.)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSize('large')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    printSize === 'large'
                      ? 'bg-[#0f2922] text-[#DCB473]'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  বড় A4 প্রিন্ট
                </button>
              </div>
            </div>

            {/* Exact-Ratio Scaled Frame Holding the Canonical 550x800 ID Card */}
            <div
              className="haji-id-card-scale-frame relative shrink-0 shadow-[0_18px_45px_rgba(15,41,34,0.22)] bg-[#ffffff]"
              style={{
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`
              }}
            >
              {/* CANONICAL 550 x 800 ID CARD CANVAS (Exact 1:2 Replica of 1100 x 1600 Reference) */}
              <div
                ref={cardRef}
                data-haji-id-canvas="true"
                className="haji-id-card-canvas font-id-card relative bg-[#ffffff] overflow-hidden select-none"
                style={{
                  width: '550px',
                  height: '800px',
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left'
                }}
              >
                {/* OUTER SOLID TEAL BORDER BAND (#1d6e65) */}
                <div className="absolute top-0 left-0 right-0 h-[19.5px] bg-[#1d6e65]" />
                <div className="absolute bottom-0 left-0 right-0 h-[19.5px] bg-[#1d6e65]" />
                <div className="absolute top-0 bottom-0 left-0 w-[12.5px] bg-[#1d6e65]" />
                <div className="absolute top-0 bottom-0 right-0 w-[12.5px] bg-[#1d6e65]" />

                {/* INNER SOLID TEAL BORDER LINE (#1d6e65) WITH 1.5px WHITE GAP */}
                <div className="absolute top-[21px] left-[14px] right-[14px] h-[10px] bg-[#1d6e65]" />
                <div className="absolute bottom-[21px] left-[14px] right-[14px] h-[7.5px] bg-[#1d6e65]" />
                <div className="absolute top-[21px] bottom-[21px] left-[14px] w-[6px] bg-[#1d6e65]" />
                <div className="absolute top-[21px] bottom-[21px] right-[14px] w-[6px] bg-[#1d6e65]" />

                {/* TOP-RIGHT ISLAMIC GEOMETRIC CORNER ORNAMENT */}
                <img
                  src={CORNER_ORNAMENT_URL}
                  alt=""
                  crossOrigin="anonymous"
                  className="absolute top-0 right-0 w-[178px] h-[168px] block pointer-events-none z-20"
                />

                {/* TOP-LEFT MUTTAQI CIRCULAR EMBLEM */}
                <img
                  src={MUTTAQI_EMBLEM_URL}
                  alt="Muttaqi Hajj & Consultancy"
                  crossOrigin="anonymous"
                  className="absolute left-[37px] top-[43px] w-[86px] h-[86px] object-contain block z-10"
                />

                {/* TOP-LEFT BANGLADESH FLAG */}
                <div className="absolute left-[42px] top-[145px] w-[85px] h-[54.5px] z-10 overflow-hidden">
                  <svg
                    viewBox="0 0 85 55"
                    className="w-full h-full block"
                    aria-label="Bangladesh Flag"
                  >
                    <rect width="85" height="55" fill="#006a4e" />
                    <circle cx="38.5" cy="27.5" r="17" fill="#f52b41" />
                  </svg>
                </div>

                {/* TOP-LEFT PILGRIM OF BANGLADESH LABEL */}
                <div className="absolute left-[42px] top-[204px] w-[145px] z-10 text-[15px] font-extrabold leading-[1.15] text-[#005051] uppercase whitespace-pre-line">
                  {form.pilgrimLabel}
                </div>

                {/* TOP-CENTER PILGRIM PORTRAIT PHOTO FRAME */}
                <div className="absolute left-[202.5px] top-[62px] w-[144.5px] h-[197.5px] rounded-[12px] border-[3.5px] border-[#a5beba] bg-[#f4f7f6] overflow-hidden z-10 flex items-center justify-center">
                  {form.photoUrl ? (
                    <img
                      src={form.photoUrl}
                      alt={displayFullName}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover block"
                      style={{
                        objectPosition: `50% ${form.photoPositionY}%`,
                        transform: `scale(${form.photoZoom / 100})`,
                        transformOrigin: 'center center'
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#7b9a96] px-2 text-center">
                      <User className="w-12 h-12 mb-1 opacity-60" />
                      <span className="text-[11px] font-semibold leading-tight">
                        Pilgrim Photo
                      </span>
                    </div>
                  )}
                </div>

                {/* ORNATE ISLAMIC CROWN & TEAL/GOLD NAME PLAQUE */}
                <div className="absolute left-[78px] top-[246px] w-[394px] h-[160px] z-10">
                  <img
                    src={NAME_PLAQUE_URL}
                    alt=""
                    crossOrigin="anonymous"
                    className="w-full h-full block"
                  />
                  <div className="absolute top-[78px] left-[50px] right-[50px] h-[56px] flex items-center justify-center text-center px-1">
                    <div
                      className="text-[#ffffff] font-bold uppercase leading-[1.2] tracking-[0.02em] whitespace-pre-line break-words w-full"
                      style={{ fontSize: `${nameFontSize}px` }}
                    >
                      {displayFullName}
                    </div>
                  </div>
                </div>

                {/* DETAILS GRID: NATIONALITY / PASSPORT NO / VISA NO */}
                <div className="absolute left-[124px] top-[409px] w-[356px] z-10 grid grid-cols-[126px_18px_1fr] gap-y-[9px] items-baseline text-[#005051]">
                  <span className="text-[19px] font-bold leading-[1.25]">Nationality</span>
                  <span className="text-[19px] font-semibold leading-[1.25] text-center">:</span>
                  <span className="text-[19px] font-normal leading-[1.25] truncate">
                    {form.nationality || 'Bangladeshi'}
                  </span>

                  <span className="text-[19px] font-bold leading-[1.25]">Passport No</span>
                  <span className="text-[19px] font-semibold leading-[1.25] text-center">:</span>
                  <span className="text-[19px] font-normal leading-[1.25] tabular-nums truncate">
                    {form.passportNo || '—'}
                  </span>

                  <span className="text-[19px] font-bold leading-[1.25]">Visa No</span>
                  <span className="text-[19px] font-semibold leading-[1.25] text-center">:</span>
                  <span className="text-[19px] font-normal leading-[1.25] tabular-nums truncate">
                    {form.visaNo || '—'}
                  </span>
                </div>

                {/* TRAVEL PURPOSE LABEL ABOVE GREEN BANNER */}
                <div className="absolute left-[102.5px] top-[528px] w-[244.5px] text-center text-[13.8px] font-medium text-[#111111] leading-tight z-10">
                  {form.travelPurpose}
                </div>

                {/* SOLID GREEN VISA INQUIRY BANNER */}
                <div className="absolute left-[102.5px] top-[551px] w-[244.5px] h-[72.5px] bg-[#1e7265] px-[12px] flex flex-col justify-center z-10">
                  <div className="text-[22.5px] font-bold text-[#ffffff] leading-[1.12] tracking-[-0.01em] truncate">
                    {form.visaBannerTitle}
                  </div>
                  <div className="text-[13px] font-bold text-[#ffffff] leading-[1.2] mt-[3px] truncate">
                    {form.visaBannerSubtitle}
                  </div>
                </div>

                {/* UNIVERSAL VISA INQUIRY QR CODE BOX (IDENTICAL ACROSS ALL CARDS) */}
                <div className="absolute left-[347px] top-[529.5px] w-[115px] h-[115px] bg-[#ffffff] border-[1.8px] border-[#1e7265] p-[5px] flex items-center justify-center z-10">
                  <img
                    src={UNIVERSAL_VISA_QR_URL}
                    alt="Visa Inquiry QR Code"
                    crossOrigin="anonymous"
                    className="w-full h-full object-contain block"
                  />
                </div>

                {/* BOTTOM GUIDE ROLE TITLE (RED BOLD UNDERLINED) */}
                <div className="absolute top-[645px] left-[40px] right-[40px] flex justify-center z-10">
                  <span className="text-[16.5px] font-bold text-[#fd332f] border-b-[2px] border-[#fd332f] pb-[0.5px] leading-[1.15]">
                    {form.guideTitle}
                  </span>
                </div>

                {/* BOTTOM GUIDE NAME (BIG BOLD TEAL) */}
                <div className="absolute top-[668px] left-[36px] right-[36px] text-center text-[27px] font-extrabold text-[#1e6e65] uppercase tracking-[0.02em] leading-[1.15] z-10 truncate">
                  {form.guideName}
                </div>

                {/* CONTACT ROW 1: SAUDI NUMBER + SAUDI EMBLEM */}
                <div className="absolute top-[703px] left-[81px] right-[77px] flex items-center justify-between z-10">
                  <div className="flex items-baseline gap-[6px]">
                    <span className="text-[21px] font-bold text-[#005051] leading-none">
                      Contact :
                    </span>
                    <span className="text-[21px] font-bold text-[#000000] tabular-nums leading-none">
                      {form.saudiContact}
                    </span>
                  </div>
                  <img
                    src={SAUDI_EMBLEM_URL}
                    alt="Saudi Emblem"
                    crossOrigin="anonymous"
                    className="w-[30px] h-[31px] object-contain block shrink-0"
                  />
                </div>

                {/* CONTACT ROW 2: WHATSAPP ICON + BD NUMBER + CIRCULAR BD FLAG */}
                <div className="absolute top-[737px] left-[160px] right-[77px] flex items-center justify-between z-10">
                  <div className="flex items-center gap-[9px]">
                    <svg
                      viewBox="0 0 32 32"
                      className="w-[27px] h-[27px] shrink-0 block"
                      fill="none"
                      aria-label="WhatsApp"
                    >
                      <path
                        d="M16 3.2C8.93 3.2 3.2 8.93 3.2 16c0 2.38.65 4.61 1.78 6.52L3.3 28.7l6.36-1.64A12.74 12.74 0 0 0 16 28.8c7.07 0 12.8-5.73 12.8-12.8S23.07 3.2 16 3.2Z"
                        stroke="#000000"
                        strokeWidth="2.3"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12.35 10.6c-.28-.62-.58-.64-.85-.65h-.73c-.25 0-.66.1-1 .47-.35.38-1.32 1.29-1.32 3.14 0 1.86 1.35 3.65 1.54 3.9.19.25 2.61 4.18 6.45 5.7 3.19 1.26 3.84 1.01 4.53.94.69-.06 2.23-.91 2.55-1.79.31-.88.31-1.64.22-1.79-.1-.16-.35-.25-.73-.44-.38-.19-2.23-1.1-2.58-1.23-.35-.13-.6-.19-.85.19-.25.38-.97 1.23-1.19 1.48-.22.25-.44.28-.82.09-.38-.19-1.59-.59-3.03-1.87-1.12-1-1.88-2.23-2.1-2.61-.22-.38-.02-.58.17-.77.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.1-.19-.83-2.06-1.16-2.81Z"
                        fill="#000000"
                      />
                    </svg>
                    <span className="text-[21.5px] font-bold text-[#000000] tabular-nums leading-none">
                      {form.bdContact}
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 32 32"
                    className="w-[27px] h-[27px] shrink-0 block"
                    aria-label="Bangladesh"
                  >
                    <circle cx="16" cy="16" r="15" fill="#006a4e" />
                    <circle cx="15.2" cy="16" r="7.5" fill="#f52b41" />
                  </svg>
                </div>
              </div>
            </div>

            <p className="print:hidden text-[11px] text-stone-500 text-center max-w-md">
              সকল আইডি কার্ডে নির্ধারিত ভিসা ইনকোয়ারি QR কোডটি স্থায়ীভাবে যুক্ত রয়েছে। ডানপাশের এডিট প্যানেলে যেকোনো তথ্য পরিবর্তন করলেই সাথে সাথে প্রিভিউ আপডেট হবে।
            </p>
          </div>

          {/* RIGHT: LIVE EDITOR SIDEBAR (Hidden in Print) */}
          {showEditor && (
            <aside className="print:hidden w-full lg:w-[370px] xl:w-[395px] border-t lg:border-t-0 lg:border-l border-stone-200 bg-white overflow-y-auto p-4 sm:p-5 space-y-5 shrink-0">
              {/* Section 1: Photo & Name */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0f2922]">১. হাজীর ছবি ও নাম</h4>
                  <button
                    type="button"
                    onClick={handleResetToOriginal}
                    className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>ডিফল্ট রিসেট</span>
                  </button>
                </div>

                {/* Photo upload & positioning */}
                <div className="flex items-center gap-3 p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                  <div className="w-12 h-16 rounded-lg border border-stone-300 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                    {form.photoUrl ? (
                      <img
                        src={form.photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#0f2922]" />
                      <span>{form.photoUrl ? 'ছবি পরিবর্তন করুন' : 'হাজীর ছবি আপলোড করুন'}</span>
                    </button>
                    {form.photoUrl && (
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <label className="block">
                          <span className="text-[10px] text-stone-500 font-medium block">
                            জুম ({form.photoZoom}%)
                          </span>
                          <input
                            type="range"
                            min={100}
                            max={150}
                            value={form.photoZoom}
                            onChange={(e) => updateField('photoZoom', Number(e.target.value))}
                            className="w-full accent-[#0f2922] h-1.5"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] text-stone-500 font-medium block">
                            উপর-নিচ ({form.photoPositionY}%)
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={form.photoPositionY}
                            onChange={(e) => updateField('photoPositionY', Number(e.target.value))}
                            className="w-full accent-[#0f2922] h-1.5"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    হাজীর নাম (ইংরেজি — ২ লাইন করতে Enter চাপুন)
                  </label>
                  <textarea
                    rows={2}
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value.toUpperCase())}
                    placeholder="MD SAHADAT HOSSAIN KHANDAKAR"
                    className="w-full px-3 py-2 text-xs font-semibold uppercase rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    বাম পাশের পতাকার নিচের লেখা
                  </label>
                  <textarea
                    rows={2}
                    value={form.pilgrimLabel}
                    onChange={(e) => updateField('pilgrimLabel', e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 text-xs font-semibold uppercase rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65] resize-none"
                  />
                </div>
              </div>

              {/* Section 2: Passport & Visa Info */}
              <div className="pt-4 border-t border-stone-100 space-y-3">
                <h4 className="text-xs font-bold text-[#0f2922]">২. পাসপোর্ট ও ভিসা তথ্য</h4>

                <div className="grid grid-cols-1 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      Nationality (জাতীয়তা)
                    </label>
                    <input
                      type="text"
                      value={form.nationality}
                      onChange={(e) => updateField('nationality', e.target.value)}
                      placeholder="Bangladeshi"
                      className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        Passport No
                      </label>
                      <input
                        type="text"
                        value={form.passportNo}
                        onChange={(e) => updateField('passportNo', e.target.value.toUpperCase())}
                        placeholder="A12345678"
                        className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">
                        Visa No
                      </label>
                      <input
                        type="text"
                        value={form.visaNo}
                        onChange={(e) => updateField('visaNo', e.target.value)}
                        placeholder="123456789"
                        className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Travel Purpose & Visa QR */}
              <div className="pt-4 border-t border-stone-100 space-y-2.5">
                <h4 className="text-xs font-bold text-[#0f2922]">৩. ভ্রমণের উদ্দেশ্য ও ভিসা ব্যানার</h4>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Travel Purpose
                  </label>
                  <input
                    type="text"
                    value={form.travelPurpose}
                    onChange={(e) => updateField('travelPurpose', e.target.value)}
                    placeholder="Travel Purposes Holy Umrah"
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      ব্যানার শিরোনাম
                    </label>
                    <input
                      type="text"
                      value={form.visaBannerTitle}
                      onChange={(e) => updateField('visaBannerTitle', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      ব্যানার সাব-টেক্সট
                    </label>
                    <input
                      type="text"
                      value={form.visaBannerSubtitle}
                      onChange={(e) => updateField('visaBannerSubtitle', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-950">
                  <QrCode className="w-4 h-4 text-[#1e7265] shrink-0" />
                  <span>
                    ভিসা ইনকোয়ারির নির্ধারিত QR কোডটি স্বয়ংক্রিয়ভাবে সকল হাজীর আইডি কার্ডে সংযুক্ত থাকবে।
                  </span>
                </div>
              </div>

              {/* Section 4: Guide & Contact */}
              <div className="pt-4 border-t border-stone-100 space-y-2.5">
                <h4 className="text-xs font-bold text-[#0f2922]">৪. গাইড ও যোগাযোগ নম্বর</h4>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      গাইড শিরোনাম (লাল)
                    </label>
                    <input
                      type="text"
                      value={form.guideTitle}
                      onChange={(e) => updateField('guideTitle', e.target.value)}
                      placeholder="Umrah Guide"
                      className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      গাইডের নাম
                    </label>
                    <input
                      type="text"
                      value={form.guideName}
                      onChange={(e) => updateField('guideName', e.target.value.toUpperCase())}
                      placeholder="MD RAJU MIA"
                      className="w-full px-2.5 py-1.5 text-xs font-semibold uppercase rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      সৌদি নম্বর (Contact)
                    </label>
                    <input
                      type="text"
                      value={form.saudiContact}
                      onChange={(e) => updateField('saudiContact', e.target.value)}
                      placeholder="+966 56 521 3812"
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      বাংলাদেশ WhatsApp নম্বর
                    </label>
                    <input
                      type="text"
                      value={form.bdContact}
                      onChange={(e) => updateField('bdContact', e.target.value)}
                      placeholder="+88 01746 900 513"
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#1d6e65]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveSharedDefaults}
                  className="w-full mt-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#b88e44]" />
                  <span>এই গাইড ও নম্বর সকল নতুন কার্ডের ডিফল্ট করুন</span>
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;

  if (headlessExportJpg) {
    return createPortal(
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0px',
          width: '550px',
          height: '800px',
          overflow: 'hidden',
          pointerEvents: 'none',
          backgroundColor: '#ffffff',
          zIndex: -1
        }}
      >
        <div
          ref={cardRef}
          data-haji-id-canvas="true"
          className="haji-id-card-canvas font-id-card relative bg-[#ffffff] overflow-hidden select-none"
          style={{ width: '550px', height: '800px' }}
        >
          <div className="absolute top-0 left-0 right-0 h-[19.5px] bg-[#1d6e65]" />
          <div className="absolute bottom-0 left-0 right-0 h-[19.5px] bg-[#1d6e65]" />
          <div className="absolute top-0 bottom-0 left-0 w-[12.5px] bg-[#1d6e65]" />
          <div className="absolute top-0 bottom-0 right-0 w-[12.5px] bg-[#1d6e65]" />
          <div className="absolute top-[21px] left-[14px] right-[14px] h-[10px] bg-[#1d6e65]" />
          <div className="absolute bottom-[21px] left-[14px] right-[14px] h-[7.5px] bg-[#1d6e65]" />
          <div className="absolute top-[21px] bottom-[21px] left-[14px] w-[6px] bg-[#1d6e65]" />
          <div className="absolute top-[21px] bottom-[21px] right-[14px] w-[6px] bg-[#1d6e65]" />

          <img
            src={CORNER_ORNAMENT_URL}
            alt=""
            crossOrigin="anonymous"
            className="absolute top-0 right-0 w-[178px] h-[168px] block pointer-events-none z-20"
          />
          <img
            src={MUTTAQI_EMBLEM_URL}
            alt="Muttaqi Hajj & Consultancy"
            crossOrigin="anonymous"
            className="absolute left-[37px] top-[43px] w-[86px] h-[86px] object-contain block z-10"
          />
          <div className="absolute left-[42px] top-[145px] w-[85px] h-[54.5px] z-10 overflow-hidden">
            <svg viewBox="0 0 85 55" className="w-full h-full block" aria-label="Bangladesh Flag">
              <rect width="85" height="55" fill="#006a4e" />
              <circle cx="38.5" cy="27.5" r="17" fill="#f52b41" />
            </svg>
          </div>
          <div className="absolute left-[42px] top-[204px] w-[145px] z-10 text-[15px] font-extrabold leading-[1.15] text-[#005051] uppercase whitespace-pre-line">
            {form.pilgrimLabel}
          </div>
          <div className="absolute left-[202.5px] top-[62px] w-[144.5px] h-[197.5px] rounded-[12px] border-[3.5px] border-[#a5beba] bg-[#f4f7f6] overflow-hidden z-10 flex items-center justify-center">
            {form.photoUrl ? (
              <img
                src={form.photoUrl}
                alt={displayFullName}
                crossOrigin="anonymous"
                className="w-full h-full object-cover block"
                style={{
                  objectPosition: `50% ${form.photoPositionY}%`,
                  transform: `scale(${form.photoZoom / 100})`,
                  transformOrigin: 'center center'
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#7b9a96] px-2 text-center">
                <User className="w-12 h-12 mb-1 opacity-60" />
                <span className="text-[11px] font-semibold leading-tight">Pilgrim Photo</span>
              </div>
            )}
          </div>
          <div className="absolute left-[78px] top-[246px] w-[394px] h-[160px] z-10">
            <img src={NAME_PLAQUE_URL} alt="" crossOrigin="anonymous" className="w-full h-full block" />
            <div className="absolute top-[78px] left-[50px] right-[50px] h-[56px] flex items-center justify-center text-center px-1">
              <div
                className="text-[#ffffff] font-bold uppercase leading-[1.2] tracking-[0.02em] whitespace-pre-line break-words w-full"
                style={{ fontSize: `${nameFontSize}px` }}
              >
                {displayFullName}
              </div>
            </div>
          </div>
          <div className="absolute left-[124px] top-[409px] w-[356px] z-10 grid grid-cols-[126px_18px_1fr] gap-y-[9px] items-baseline text-[#005051]">
            <span className="text-[19px] font-bold leading-[1.25]">Nationality</span>
            <span className="text-[19px] font-semibold leading-[1.25] text-center">:</span>
            <span className="text-[19px] font-normal leading-[1.25] truncate">
              {form.nationality || 'Bangladeshi'}
            </span>
            <span className="text-[19px] font-bold leading-[1.25]">Passport No</span>
            <span className="text-[19px] font-semibold leading-[1.25] text-center">:</span>
            <span className="text-[19px] font-normal leading-[1.25] tabular-nums truncate">
              {form.passportNo || '—'}
            </span>
            <span className="text-[19px] font-bold leading-[1.25]">Visa No</span>
            <span className="text-[19px] font-semibold leading-[1.25] text-center">:</span>
            <span className="text-[19px] font-normal leading-[1.25] tabular-nums truncate">
              {form.visaNo || '—'}
            </span>
          </div>
          <div className="absolute left-[102.5px] top-[528px] w-[244.5px] text-center text-[13.8px] font-medium text-[#111111] leading-tight z-10">
            {form.travelPurpose}
          </div>
          <div className="absolute left-[102.5px] top-[551px] w-[244.5px] h-[72.5px] bg-[#1e7265] px-[12px] flex flex-col justify-center z-10">
            <div className="text-[22.5px] font-bold text-[#ffffff] leading-[1.12] tracking-[-0.01em] truncate">
              {form.visaBannerTitle}
            </div>
            <div className="text-[13px] font-bold text-[#ffffff] leading-[1.2] mt-[3px] truncate">
              {form.visaBannerSubtitle}
            </div>
          </div>
          <div className="absolute left-[347px] top-[529.5px] w-[115px] h-[115px] bg-[#ffffff] border-[1.8px] border-[#1e7265] p-[5px] flex items-center justify-center z-10">
            <img
              src={UNIVERSAL_VISA_QR_URL}
              alt="Visa Inquiry QR Code"
              crossOrigin="anonymous"
              className="w-full h-full object-contain block"
            />
          </div>
          <div className="absolute top-[645px] left-[40px] right-[40px] flex justify-center z-10">
            <span className="text-[16.5px] font-bold text-[#fd332f] border-b-[2px] border-[#fd332f] pb-[0.5px] leading-[1.15]">
              {form.guideTitle}
            </span>
          </div>
          <div className="absolute top-[668px] left-[36px] right-[36px] text-center text-[27px] font-extrabold text-[#1e6e65] uppercase tracking-[0.02em] leading-[1.15] z-10 truncate">
            {form.guideName}
          </div>
          <div className="absolute top-[703px] left-[81px] right-[77px] flex items-center justify-between z-10">
            <div className="flex items-baseline gap-[6px]">
              <span className="text-[21px] font-bold text-[#005051] leading-none">Contact :</span>
              <span className="text-[21px] font-bold text-[#000000] tabular-nums leading-none">
                {form.saudiContact}
              </span>
            </div>
            <img
              src={SAUDI_EMBLEM_URL}
              alt="Saudi Emblem"
              crossOrigin="anonymous"
              className="w-[30px] h-[31px] object-contain block shrink-0"
            />
          </div>
          <div className="absolute top-[737px] left-[160px] right-[77px] flex items-center justify-between z-10">
            <div className="flex items-center gap-[9px]">
              <svg viewBox="0 0 32 32" className="w-[27px] h-[27px] shrink-0 block" fill="none" aria-label="WhatsApp">
                <path
                  d="M16 3.2C8.93 3.2 3.2 8.93 3.2 16c0 2.38.65 4.61 1.78 6.52L3.3 28.7l6.36-1.64A12.74 12.74 0 0 0 16 28.8c7.07 0 12.8-5.73 12.8-12.8S23.07 3.2 16 3.2Z"
                  stroke="#000000"
                  strokeWidth="2.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.35 10.6c-.28-.62-.58-.64-.85-.65h-.73c-.25 0-.66.1-1 .47-.35.38-1.32 1.29-1.32 3.14 0 1.86 1.35 3.65 1.54 3.9.19.25 2.61 4.18 6.45 5.7 3.19 1.26 3.84 1.01 4.53.94.69-.06 2.23-.91 2.55-1.79.31-.88.31-1.64.22-1.79-.1-.16-.35-.25-.73-.44-.38-.19-2.23-1.1-2.58-1.23-.35-.13-.6-.19-.85.19-.25.38-.97 1.23-1.19 1.48-.22.25-.44.28-.82.09-.38-.19-1.59-.59-3.03-1.87-1.12-1-1.88-2.23-2.1-2.61-.22-.38-.02-.58.17-.77.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.1-.19-.83-2.06-1.16-2.81Z"
                  fill="#000000"
                />
              </svg>
              <span className="text-[21.5px] font-bold text-[#000000] tabular-nums leading-none">
                {form.bdContact}
              </span>
            </div>
            <svg viewBox="0 0 32 32" className="w-[27px] h-[27px] shrink-0 block" aria-label="Bangladesh">
              <circle cx="16" cy="16" r="15" fill="#006a4e" />
              <circle cx="15.2" cy="16" r="7.5" fill="#f52b41" />
            </svg>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(modalContent, document.body);
};
