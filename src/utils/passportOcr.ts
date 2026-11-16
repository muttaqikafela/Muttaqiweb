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

function applyWatermarkSuppressionAndNormalize(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const totalPixels = width * height;
  const vals = new Float32Array(totalPixels);

  // Colored guilloche security waves stay bright in at least one RGB channel; dark printed ink stays dark across all channels
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxRgb = r > g ? (r > b ? r : b) : g > b ? g : b;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    vals[p] = 0.65 * maxRgb + 0.35 * luma;
  }

  // O(N) summed-area table (integral image) for fast adaptive local background estimation
  const iw = width + 1;
  const sat = new Float64Array(iw * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    const srcRow = y * width;
    const satRow = (y + 1) * iw;
    const prevSatRow = y * iw;
    for (let x = 0; x < width; x++) {
      rowSum += vals[srcRow + x];
      sat[satRow + x + 1] = sat[prevSatRow + x + 1] + rowSum;
    }
  }

  const radius = Math.max(14, Math.min(28, Math.round(Math.min(width, height) * 0.025)));
  for (let y = 0; y < height; y++) {
    const y0 = y > radius ? y - radius : 0;
    const y1 = y + radius < height ? y + radius : height - 1;
    const r0 = y0 * iw;
    const r1 = (y1 + 1) * iw;
    const rowOff = y * width;

    for (let x = 0; x < width; x++) {
      const x0 = x > radius ? x - radius : 0;
      const x1 = x + radius < width ? x + radius : width - 1;
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const localMean = (sat[r1 + x1 + 1] - sat[r0 + x1 + 1] - sat[r1 + x0] + sat[r0 + x0]) / area;
      const v = vals[rowOff + x];
      const diff = localMean - v;

      // Preserve anti-aliased gray edges on dark ink while turning paper folds & colored waves crisp white
      let out = 255;
      if (diff > 10) {
        out = Math.max(0, 255 - Math.round((diff - 10) * 4.4));
      }
      if (v < 85) {
        out = Math.min(out, Math.round(v * 1.35));
      }

      const idx = (rowOff + x) * 4;
      data[idx] = out;
      data[idx + 1] = out;
      data[idx + 2] = out;
    }
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
  const sw = Math.max(10, Math.min(natW - sx, Math.round(natW * swFrac)));
  const sh = Math.max(10, Math.min(natH - sy, Math.round(natH * shFrac)));

  let outW = sw;
  let outH = sh;
  if (Math.max(outW, outH) < 1200) {
    const scale = Math.min(2.2, 1450 / Math.max(outW, outH));
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
    applyWatermarkSuppressionAndNormalize(ctx, outW, outH);
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

function hasAllEightFields(data: ExtractedPassportData): boolean {
  return Boolean(
    data.nameEn &&
      data.dateOfBirth &&
      data.nidNo &&
      data.passportNo &&
      data.phone &&
      data.fatherNameEn &&
      data.motherNameEn &&
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

  // Tight ROI crops exclude perforation holes, right barcodes & ghost photos; backups rescue edge cases
  const primaryPageCanvases: HTMLCanvasElement[] = [];
  const backupPageCanvases: HTMLCanvasElement[] = [];
  const primaryMrzCanvases: HTMLCanvasElement[] = [];
  const backupMrzCanvases: HTMLCanvasElement[] = [];

  if (aspectRatio >= 1.35) {
    // Wide 2-page spread side-by-side
    primaryPageCanvases.push(cropAndEnhanceCanvas(img, 0.03, 0.03, 0.49, 0.94, 1650));
    primaryPageCanvases.push(cropAndEnhanceCanvas(img, 0.48, 0.03, 0.49, 0.94, 1650));
    backupPageCanvases.push(cropAndEnhanceCanvas(img, 0, 0, 1, 1, 1800));
    primaryMrzCanvases.push(cropAndEnhanceCanvas(img, 0.02, 0.62, 0.55, 0.37, 1750));
    backupMrzCanvases.push(cropAndEnhanceCanvas(img, 0, 0.65, 1, 0.35, 1800));
  } else if (aspectRatio <= 0.95) {
    // Portrait 2-page open booklet (Top: Personal/Emergency Data, Bottom: Bio + MRZ)
    primaryPageCanvases.push(cropAndEnhanceCanvas(img, 0.09, 0.07, 0.70, 0.39, 1650));
    primaryPageCanvases.push(cropAndEnhanceCanvas(img, 0.30, 0.51, 0.56, 0.34, 1650));
    backupPageCanvases.push(cropAndEnhanceCanvas(img, 0.02, 0.02, 0.96, 0.48, 1600));
    backupPageCanvases.push(cropAndEnhanceCanvas(img, 0.02, 0.49, 0.96, 0.38, 1600));
    primaryMrzCanvases.push(cropAndEnhanceCanvas(img, 0.03, 0.84, 0.94, 0.14, 1800));
    backupMrzCanvases.push(cropAndEnhanceCanvas(img, 0.02, 0.72, 0.96, 0.27, 1750));
  } else {
    // Single passport page (bio or personal data)
    primaryPageCanvases.push(cropAndEnhanceCanvas(img, 0.24, 0.04, 0.68, 0.78, 1650));
    primaryPageCanvases.push(cropAndEnhanceCanvas(img, 0.01, 0.01, 0.98, 0.98, 1750));
    primaryMrzCanvases.push(cropAndEnhanceCanvas(img, 0.02, 0.62, 0.96, 0.37, 1750));
  }

  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1'
    });

    const pageTexts: string[] = [];
    for (const canvas of primaryPageCanvases) {
      const res = await worker.recognize(canvas);
      if (res?.data?.text) pageTexts.push(res.data.text);
    }

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
    });
    const mrzTexts: string[] = [];
    for (const mrzCanvas of primaryMrzCanvases) {
      const res = await worker.recognize(mrzCanvas);
      if (res?.data?.text) mrzTexts.push(res.data.text);
    }

    let parsed = parseBangladeshiPassportOcrText(
      pageTexts.join('\n---PAGE_BREAK---\n'),
      mrzTexts.join('\n')
    );

    if (!hasAllEightFields(parsed) && (backupPageCanvases.length > 0 || backupMrzCanvases.length > 0)) {
      if (backupPageCanvases.length > 0) {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: '',
          preserve_interword_spaces: '1'
        });
        for (const canvas of backupPageCanvases) {
          const res = await worker.recognize(canvas);
          if (res?.data?.text) pageTexts.push(res.data.text);
        }
      }

      if (backupMrzCanvases.length > 0) {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
        });
        for (const mrzCanvas of backupMrzCanvases) {
          const res = await worker.recognize(mrzCanvas);
          if (res?.data?.text) mrzTexts.push(res.data.text);
        }
      }

      parsed = parseBangladeshiPassportOcrText(
        pageTexts.join('\n---PAGE_BREAK---\n'),
        mrzTexts.join('\n')
      );
    }

    return parsed;
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
