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
  postCode: string;
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

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const loadFromDataUrl = () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = (e.target?.result as string) || '';
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('ছবি লোড করতে সমস্যা হয়েছে।'));
        img.src = rawDataUrl;
      };
      reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে।'));
      reader.readAsDataURL(file);
    };

    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          loadFromDataUrl();
        };
        img.src = objectUrl;
        return;
      } catch {
        loadFromDataUrl();
        return;
      }
    }

    loadFromDataUrl();
  });
}

// Normalize giant phone camera photos once onto a max 2400px working canvas to prevent mobile browser memory errors
function normalizeSourceImage(img: HTMLImageElement): HTMLImageElement | HTMLCanvasElement {
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;
  const maxSourceDim = 2400;
  if (Math.max(natW, natH) <= maxSourceDim) {
    return img;
  }
  const scale = maxSourceDim / Math.max(natW, natH);
  const w = Math.max(10, Math.round(natW * scale));
  const h = Math.max(10, Math.round(natH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }
  return img;
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
  const chromas = new Uint8Array(totalPixels);

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxRgb = r > g ? (r > b ? r : b) : g > b ? g : b;
    const minRgb = r < g ? (r < b ? r : b) : g < b ? g : b;
    const chroma = maxRgb - minRgb;
    chromas[p] = chroma;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    // Gentle chroma weight (0.16) keeps thin tinted italic labels legible while weakening colored waves
    vals[p] = 0.50 * maxRgb + 0.50 * luma + 0.16 * chroma;
  }

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
      const p = rowOff + x;
      const v = vals[p];
      const chroma = chromas[p];
      const diff = localMean - v;

      // Balanced threshold (15) preserves thin italic labels ("Permanent Address:", "Name:") while suppressing background waves
      let out = 255;
      if (diff > 15) {
        out = Math.max(0, 255 - Math.round((diff - 15) * 4.2));
      }
      if (v < 90 && chroma < 42) {
        out = Math.min(out, Math.round(v * 1.35));
      }

      const idx = p * 4;
      data[idx] = out;
      data[idx + 1] = out;
      data[idx + 2] = out;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// Gentle global contrast stretch (used in backup pass if thin labels were faint)
function applyGentleContrastGrayscale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
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
  const lowTarget = totalPixels * 0.02;
  const highTarget = totalPixels * 0.98;

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
  source: HTMLImageElement | HTMLCanvasElement,
  sxFrac: number,
  syFrac: number,
  swFrac: number,
  shFrac: number,
  targetMaxDim = 1650,
  mode: 'watermark' | 'gentle' = 'watermark'
): HTMLCanvasElement {
  const natW = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
  const natH = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
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
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
    if (mode === 'gentle') {
      applyGentleContrastGrayscale(ctx, outW, outH);
    } else {
      applyWatermarkSuppressionAndNormalize(ctx, outW, outH);
    }
  }
  return canvas;
}

function buildUploadDataUrl(source: HTMLImageElement | HTMLCanvasElement): string {
  const maxDim = 1100;
  let w = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
  let h = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.8);
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
      data.presentAddress ||
      data.postCode
  );
}

let skipServerOcr = false;

async function tryServerExtractPassport(fileDataUrl: string): Promise<ExtractedPassportData | null> {
  if (skipServerOcr) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
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
      data?: Partial<ExtractedPassportData>;
      fallback?: string;
    };
    if (json?.fallback === 'browser-ocr') {
      skipServerOcr = true;
      return null;
    }
    if (json?.ok && json.data) {
      const addr = (json.data.presentAddress || '').trim();
      const normalized: ExtractedPassportData = {
        nameEn: (json.data.nameEn || '').trim(),
        dateOfBirth: (json.data.dateOfBirth || '').trim(),
        nidNo: (json.data.nidNo || '').trim(),
        passportNo: (json.data.passportNo || '').trim(),
        phone: (json.data.phone || '').trim(),
        fatherNameEn: (json.data.fatherNameEn || '').trim(),
        motherNameEn: (json.data.motherNameEn || '').trim(),
        presentAddress: addr,
        postCode:
          (json.data.postCode || '').trim() ||
          addr.match(/[-–]\s*([1-9]\d{3})\b/)?.[1] ||
          addr.match(/\b([1-9]\d{3})\b/)?.[1] ||
          ''
      };
      if (hasAnyExtractedField(normalized)) return normalized;
    }
    return null;
  } catch {
    skipServerOcr = true;
    return null;
  }
}

type TesseractWorkerBundle = {
  worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>;
  PSM: typeof import('tesseract.js')['PSM'];
};

let warmWorkerPromise: Promise<TesseractWorkerBundle> | null = null;
let ocrQueue: Promise<unknown> = Promise.resolve();

async function initPassportWorker(): Promise<TesseractWorkerBundle> {
  const { createWorker, OEM, PSM } = await import('tesseract.js');
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  const ocrRoot = new URL(`${basePath}ocr/`, window.location.href).toString().replace(/\/$/, '');

  // Pass directory as corePath so tesseract.js picks Relaxed-SIMD / SIMD WASM automatically (~2.5x faster)
  const localOpts = {
    workerPath: `${ocrRoot}/worker.min.js`,
    corePath: ocrRoot,
    langPath: ocrRoot,
    cacheMethod: 'none',
    gzip: true,
    errorHandler: () => {}
  };

  let worker;
  try {
    worker = await createWorker('eng', OEM.LSTM_ONLY, {
      ...localOpts,
      workerBlobURL: false
    });
  } catch {
    try {
      worker = await createWorker('eng', OEM.LSTM_ONLY, {
        ...localOpts,
        workerBlobURL: true
      });
    } catch {
      worker = await createWorker('eng', OEM.LSTM_ONLY, {
        cacheMethod: 'none',
        errorHandler: () => {}
      });
    }
  }

  return { worker, PSM };
}

function getWarmPassportWorker(): Promise<TesseractWorkerBundle> {
  if (!warmWorkerPromise) {
    warmWorkerPromise = initPassportWorker().catch((err) => {
      warmWorkerPromise = null;
      throw err;
    });
  }
  return warmWorkerPromise;
}

export function preloadPassportOcr(): void {
  if (typeof window === 'undefined') return;
  void getWarmPassportWorker().catch(() => {
    // Silent warm-up; errors will be handled cleanly on actual upload
  });
}

async function runBrowserPassportOcr(
  source: HTMLImageElement | HTMLCanvasElement
): Promise<ExtractedPassportData> {
  const natW = source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
  const natH = source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
  const aspectRatio = natW / Math.max(1, natH);

  const { worker, PSM } = await getWarmPassportWorker();
  const pageTexts: string[] = [];
  const mrzTexts: string[] = [];

  try {
    if (aspectRatio <= 0.95) {
      // Portrait 2-page open booklet:
      // 1) Fast MRZ pass (~250ms) gives passportNo, dateOfBirth, nidNo & nameEn immediately
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        preserve_interword_spaces: '1'
      });
      const mrzRes = await worker.recognize(
        cropAndEnhanceCanvas(source, 0.03, 0.84, 0.94, 0.14, 1300, 'watermark')
      );
      if (mrzRes?.data?.text) mrzTexts.push(mrzRes.data.text);

      // 2) Top Page Table pass (~1s) gives Name, Father's Name, Mother's Name, Permanent Address, Post Code & Phone
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_char_whitelist: '',
        preserve_interword_spaces: '1'
      });
      const topRes = await worker.recognize(
        cropAndEnhanceCanvas(source, 0.11, 0.06, 0.69, 0.41, 1250, 'watermark')
      );
      if (topRes?.data?.text) pageTexts.push(topRes.data.text);

      let parsed = parseBangladeshiPassportOcrText(
        pageTexts.join('\n---PAGE_BREAK---\n'),
        mrzTexts.join('\n')
      );

      // 3) Surgical backups ONLY for whichever section still has missing/glued fields
      const missingTop =
        !parsed.fatherNameEn ||
        !parsed.motherNameEn ||
        !parsed.presentAddress ||
        !parsed.phone ||
        !parsed.nameEn ||
        !/\s/.test(parsed.nameEn);
      const missingBio =
        !parsed.nameEn ||
        !/\s/.test(parsed.nameEn) ||
        !parsed.passportNo ||
        !parsed.dateOfBirth ||
        !parsed.nidNo;

      if (missingTop) {
        const topBackup = await worker.recognize(
          cropAndEnhanceCanvas(source, 0.04, 0.03, 0.88, 0.44, 1250, 'gentle')
        );
        if (topBackup?.data?.text) pageTexts.push(topBackup.data.text);
      }

      if (missingBio) {
        const bioBackup = await worker.recognize(
          cropAndEnhanceCanvas(source, 0.28, 0.51, 0.60, 0.34, 1200, 'gentle')
        );
        if (bioBackup?.data?.text) pageTexts.push(bioBackup.data.text);

        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
        });
        const mrzBackup = await worker.recognize(
          cropAndEnhanceCanvas(source, 0.02, 0.72, 0.96, 0.27, 1350, 'gentle')
        );
        if (mrzBackup?.data?.text) mrzTexts.push(mrzBackup.data.text);
      }

      if (missingTop || missingBio) {
        parsed = parseBangladeshiPassportOcrText(
          pageTexts.join('\n---PAGE_BREAK---\n'),
          mrzTexts.join('\n')
        );
      }

      return parsed;
    }

    if (aspectRatio >= 1.35) {
      // Wide 2-page spread side-by-side
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
        preserve_interword_spaces: '1'
      });
      const mrzRes = await worker.recognize(
        cropAndEnhanceCanvas(source, 0.02, 0.64, 0.55, 0.34, 1300, 'watermark')
      );
      if (mrzRes?.data?.text) mrzTexts.push(mrzRes.data.text);

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        tessedit_char_whitelist: '',
        preserve_interword_spaces: '1'
      });
      const rightRes = await worker.recognize(
        cropAndEnhanceCanvas(source, 0.49, 0.04, 0.47, 0.92, 1250, 'watermark')
      );
      if (rightRes?.data?.text) pageTexts.push(rightRes.data.text);

      let parsed = parseBangladeshiPassportOcrText(
        pageTexts.join('\n---PAGE_BREAK---\n'),
        mrzTexts.join('\n')
      );

      const missingTop =
        !parsed.fatherNameEn || !parsed.motherNameEn || !parsed.presentAddress || !parsed.phone;
      const missingBio =
        !parsed.nameEn || !parsed.passportNo || !parsed.dateOfBirth || !parsed.nidNo;

      if (missingTop || missingBio) {
        const leftRes = await worker.recognize(
          cropAndEnhanceCanvas(source, 0.03, 0.04, 0.48, 0.92, 1250, 'gentle')
        );
        if (leftRes?.data?.text) pageTexts.push(leftRes.data.text);

        if (missingTop) {
          const rightGentle = await worker.recognize(
            cropAndEnhanceCanvas(source, 0.49, 0.04, 0.47, 0.92, 1250, 'gentle')
          );
          if (rightGentle?.data?.text) pageTexts.push(rightGentle.data.text);
        }

        if (missingBio) {
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
          });
          const mrzWide = await worker.recognize(
            cropAndEnhanceCanvas(source, 0, 0.65, 1, 0.35, 1350, 'gentle')
          );
          if (mrzWide?.data?.text) mrzTexts.push(mrzWide.data.text);
        }

        parsed = parseBangladeshiPassportOcrText(
          pageTexts.join('\n---PAGE_BREAK---\n'),
          mrzTexts.join('\n')
        );
      }

      return parsed;
    }

    // Single passport page (bio or personal data)
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
      preserve_interword_spaces: '1'
    });
    const mrzRes = await worker.recognize(
      cropAndEnhanceCanvas(source, 0.02, 0.64, 0.96, 0.34, 1300, 'watermark')
    );
    if (mrzRes?.data?.text) mrzTexts.push(mrzRes.data.text);

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      tessedit_char_whitelist: '',
      preserve_interword_spaces: '1'
    });
    const mainRes = await worker.recognize(
      cropAndEnhanceCanvas(source, 0.02, 0.02, 0.96, 0.94, 1250, 'watermark')
    );
    if (mainRes?.data?.text) pageTexts.push(mainRes.data.text);

    let parsed = parseBangladeshiPassportOcrText(
      pageTexts.join('\n---PAGE_BREAK---\n'),
      mrzTexts.join('\n')
    );

    const anyKeyMissing =
      !parsed.nameEn ||
      (!parsed.passportNo && !parsed.fatherNameEn && !parsed.presentAddress);
    if (anyKeyMissing) {
      const gentleRes = await worker.recognize(
        cropAndEnhanceCanvas(source, 0.02, 0.02, 0.96, 0.94, 1250, 'gentle')
      );
      if (gentleRes?.data?.text) pageTexts.push(gentleRes.data.text);
      parsed = parseBangladeshiPassportOcrText(
        pageTexts.join('\n---PAGE_BREAK---\n'),
        mrzTexts.join('\n')
      );
    }

    return parsed;
  } catch (err) {
    // Reset cached worker if it entered a bad state
    warmWorkerPromise = null;
    try {
      await worker.terminate();
    } catch {
      // Ignore cleanup error
    }
    throw err;
  }
}

export async function extractPassportDetailsFromFile(
  file: File
): Promise<PassportExtractionResult> {
  const lowerName = file.name.toLowerCase();
  const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
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

  let img: HTMLImageElement;
  try {
    img = await loadImageElement(file);
  } catch {
    const isHeic = /\.(heic|heif)$/i.test(lowerName) || file.type.toLowerCase().includes('heic');
    return {
      ok: false,
      error: isHeic
        ? 'HEIC ফরম্যাটের ছবি এই ব্রাউজারে সাপোর্ট করছে না। অনুগ্রহ করে JPG বা PNG ছবি আপলোড করুন।'
        : 'পাসপোর্টের ছবিটি পড়া যায়নি। অনুগ্রহ করে JPG বা PNG ছবি আপলোড করুন।'
    };
  }

  const workingSource = normalizeSourceImage(img);

  // 1. Try server-side Gemini endpoint first (only when active & configured)
  if (!skipServerOcr) {
    const uploadDataUrl = buildUploadDataUrl(workingSource);
    const serverData = await tryServerExtractPassport(uploadDataUrl);
    if (serverData) {
      return { ok: true, data: serverData, source: 'server-ai' };
    }
  }

  // 2. Client-side SIMD Tesseract OCR (serialized safely on warm worker)
  try {
    const job = ocrQueue.then(() => runBrowserPassportOcr(workingSource));
    ocrQueue = job.catch(() => undefined);
    const browserData = await job;
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
  { key: 'presentAddress', label: 'বর্তমান ঠিকানা' },
  { key: 'postCode', label: 'পোস্ট কোড' }
];
