import { parseBangladeshiPassportOcrText } from './passportParser';

export interface ExtractedPassportData {
  nameEn: string;
  dateOfBirth: string;
  nidNo: string;
  passportNo: string;
  phone: string;
  fatherNameEn: string;
  motherNameEn: string;
  presentAddress: string;
}

export interface PassportExtractionResult {
  ok: boolean;
  data?: ExtractedPassportData;
  error?: string;
  source?: 'server-ai' | 'browser-ocr';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে।'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(file: File): Promise<{ img: HTMLImageElement; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = (e.target?.result as string) || '';
      const img = new Image();
      img.onload = () => resolve({ img, dataUrl: rawDataUrl });
      img.onerror = () => reject(new Error('ছবি লোড করতে সমস্যা হয়েছে।'));
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে।'));
    reader.readAsDataURL(file);
  });
}

function applyContrastGrayscale(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const hist = new Uint32Array(256);
  const totalPixels = width * height;
  const lumas = new Uint8Array(totalPixels);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const luma = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    lumas[p] = luma;
    hist[luma]++;
  }

  let lowClip = 0;
  let highClip = 255;
  const lowTarget = totalPixels * 0.03;
  const highTarget = totalPixels * 0.97;

  let cumulative = 0;
  for (let v = 0; v < 256; v++) {
    cumulative += hist[v];
    if (cumulative >= lowTarget) {
      lowClip = v;
      break;
    }
  }
  cumulative = 0;
  for (let v = 0; v < 256; v++) {
    cumulative += hist[v];
    if (cumulative >= highTarget) {
      highClip = v;
      break;
    }
  }

  const range = Math.max(24, highClip - lowClip);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const stretched = Math.max(0, Math.min(255, Math.round(((lumas[p] - lowClip) * 255) / range)));
    data[i] = stretched;
    data[i + 1] = stretched;
    data[i + 2] = stretched;
  }

  ctx.putImageData(imageData, 0, 0);
}

function cropAndEnhanceCanvas(
  img: HTMLImageElement,
  sxFrac: number,
  syFrac: number,
  swFrac: number,
  shFrac: number,
  targetMaxDim = 1650
): HTMLCanvasElement {
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  const sx = Math.max(0, Math.round(natW * sxFrac));
  const sy = Math.max(0, Math.round(natH * syFrac));
  const sw = Math.max(10, Math.round(natW * swFrac));
  const sh = Math.max(10, Math.round(natH * shFrac));

  let outW = sw;
  let outH = sh;
  if (Math.max(outW, outH) < 1200) {
    const scale = Math.min(2.2, 1400 / Math.max(outW, outH));
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  } else if (Math.max(outW, outH) > targetMaxDim) {
    const scale = targetMaxDim / Math.max(outW, outH);
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    applyContrastGrayscale(ctx, outW, outH);
  }
  return canvas;
}

function buildUploadDataUrl(img: HTMLImageElement): string {
  const maxDim = 1800;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.86);
}

function hasAnyExtractedField(data?: ExtractedPassportData): boolean {
  if (!data) return false;
  return Boolean(
    data.nameEn ||
      data.dateOfBirth ||
      data.nidNo ||
      data.passportNo ||
      data.phone ||
      data.fatherNameEn ||
      data.motherNameEn ||
      data.presentAddress
  );
}

let skipServerOcr = false;

async function tryServerExtractPassport(fileDataUrl: string): Promise<ExtractedPassportData | null> {
  if (skipServerOcr) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    const response = await fetch('/api/extract-passport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileDataUrl }),
      signal: controller.signal
    });
    clearTimeout(timer);

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      skipServerOcr = true;
      return null;
    }

    const json = (await response.json()) as {
      ok?: boolean;
      data?: ExtractedPassportData;
      fallback?: string;
    };
    if (json?.fallback === 'browser-ocr') {
      skipServerOcr = true;
      return null;
    }
    if (json?.ok && json.data && hasAnyExtractedField(json.data)) {
      return json.data;
    }
    return null;
  } catch {
    skipServerOcr = true;
    return null;
  }
}

async function runBrowserPassportOcr(img: HTMLImageElement): Promise<ExtractedPassportData> {
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  const aspectRatio = natW / Math.max(1, natH);

  // Isolate individual pages for multi-page spreads so left/right or top/bottom pages never bleed into the same line
  const pageCanvases: HTMLCanvasElement[] = [];
  const mrzCanvases: HTMLCanvasElement[] = [];

  if (aspectRatio >= 1.35) {
    // Wide passport photo (often 2 pages side-by-side: Bio Page + Personal/Emergency Info Page)
    pageCanvases.push(cropAndEnhanceCanvas(img, 0, 0, 0.52, 1, 1650));
    pageCanvases.push(cropAndEnhanceCanvas(img, 0.48, 0, 0.52, 1, 1650));
    // Also keep full image as backup in case it's a single wide bio page
    pageCanvases.push(cropAndEnhanceCanvas(img, 0, 0, 1, 1, 1800));
    mrzCanvases.push(cropAndEnhanceCanvas(img, 0, 0.62, 0.55, 0.38, 1600));
    mrzCanvases.push(cropAndEnhanceCanvas(img, 0, 0.65, 1, 0.35, 1800));
  } else if (aspectRatio <= 0.95) {
    // Tall vertical 2-page open passport booklet (Top Page + Bottom Page)
    pageCanvases.push(cropAndEnhanceCanvas(img, 0, 0, 1, 0.54, 1650));
    pageCanvases.push(cropAndEnhanceCanvas(img, 0, 0.46, 1, 0.54, 1650));
    mrzCanvases.push(cropAndEnhanceCanvas(img, 0, 0.72, 1, 0.28, 1750));
  } else {
    // Standard single page: full page + zoomed text region (right 70%, top 75%)
    pageCanvases.push(cropAndEnhanceCanvas(img, 0, 0, 1, 1, 1800));
    pageCanvases.push(cropAndEnhanceCanvas(img, 0.25, 0, 0.75, 0.78, 1600));
    mrzCanvases.push(cropAndEnhanceCanvas(img, 0, 0.62, 1, 0.38, 1750));
  }

  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const pageTexts: string[] = [];
    for (const canvas of pageCanvases) {
      const res = await worker.recognize(canvas);
      if (res?.data?.text) pageTexts.push(res.data.text);
    }

    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
    });
    const mrzTexts: string[] = [];
    for (const mrzCanvas of mrzCanvases) {
      const res = await worker.recognize(mrzCanvas);
      if (res?.data?.text) mrzTexts.push(res.data.text);
    }

    return parseBangladeshiPassportOcrText(
      pageTexts.join('\n---PAGE_BREAK---\n'),
      mrzTexts.join('\n')
    );
  } finally {
    await worker.terminate();
  }
}

export async function extractPassportDetailsFromFile(
  file: File
): Promise<PassportExtractionResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf && file.size > 10 * 1024 * 1024) {
    return {
      ok: false,
      error: 'PDF ফাইল ১০ MB এর বেশি হওয়ায় অটো-স্ক্যান করা যায়নি। অনুগ্রহ করে ছোট ফাইল বা ছবি আপলোড করুন।'
    };
  }

  if (isPdf) {
    try {
      const fileDataUrl = await readFileAsDataUrl(file);
      const serverData = await tryServerExtractPassport(fileDataUrl);
      if (serverData) {
        return { ok: true, data: serverData, source: 'server-ai' };
      }
      return {
        ok: false,
        error:
          'PDF ফাইল থেকে এই মুহূর্তে অটো-স্ক্যান সম্ভব হচ্ছে না। অনুগ্রহ করে পাসপোর্টের স্পষ্ট ছবি (JPG/PNG) আপলোড করুন অথবা হাতে পূরণ করুন।'
      };
    } catch {
      return {
        ok: false,
        error: 'পাসপোর্ট ফাইলটি প্রসেস করা যায়নি।'
      };
    }
  }

  let loaded: { img: HTMLImageElement; dataUrl: string };
  try {
    loaded = await loadImageElement(file);
  } catch {
    return {
      ok: false,
      error: 'পাসপোর্টের ছবিটি পড়া যায়নি। অনুগ্রহ করে JPG বা PNG ছবি আপলোড করুন।'
    };
  }

  const uploadDataUrl = buildUploadDataUrl(loaded.img);

  // 1. Try server-side Gemini endpoint first (if active & configured)
  const serverData = await tryServerExtractPassport(uploadDataUrl);
  if (serverData) {
    return { ok: true, data: serverData, source: 'server-ai' };
  }

  // 2. Client-side Tesseract OCR + Bangladeshi multi-page passport parser
  try {
    const browserData = await runBrowserPassportOcr(loaded.img);
    return {
      ok: true,
      data: browserData,
      source: 'browser-ocr'
    };
  } catch {
    return {
      ok: false,
      error: 'পাসপোর্টের ছবি থেকে তথ্য পড়া যায়নি। আরও স্পষ্ট ছবি আপলোড করুন অথবা হাতে তথ্য পূরণ করুন।'
    };
  }
}

export const PASSPORT_FIELD_LABELS_BN: Array<{
  key: keyof ExtractedPassportData;
  label: string;
}> = [
  { key: 'nameEn', label: 'হাজীর নাম (ইংরেজি)' },
  { key: 'dateOfBirth', label: 'জন্ম তারিখ' },
  { key: 'nidNo', label: 'জাতীয় পরিচয়পত্র (NID)' },
  { key: 'passportNo', label: 'পাসপোর্ট নাম্বার' },
  { key: 'phone', label: 'মোবাইল নাম্বার' },
  { key: 'fatherNameEn', label: 'বাবার নাম (ইংরেজি)' },
  { key: 'motherNameEn', label: 'মায়ের নাম (ইংরেজি)' },
  { key: 'presentAddress', label: 'বর্তমান ঠিকানা' }
];
