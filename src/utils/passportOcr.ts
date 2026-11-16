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
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে।'));
    reader.readAsDataURL(file);
  });
}

function resizeImageForOcr(file: File, maxDimension = 1600, quality = 0.86): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      readFileAsDataUrl(file).then(resolve).catch(reject);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = (e.target?.result as string) || '';
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error('ছবি লোড করতে সমস্যা হয়েছে।'));
    reader.readAsDataURL(file);
  });
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

  let fileDataUrl = '';
  try {
    fileDataUrl = isPdf
      ? await readFileAsDataUrl(file)
      : await resizeImageForOcr(file, 1600, 0.86);
  } catch {
    return {
      ok: false,
      error: 'পাসপোর্ট ফাইলটি প্রসেস করা যায়নি।'
    };
  }

  if (!fileDataUrl) {
    return {
      ok: false,
      error: 'ফাইল খালি পাওয়া গেছে।'
    };
  }

  try {
    const response = await fetch('/api/extract-passport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileDataUrl })
    });

    const json = (await response.json()) as PassportExtractionResult;
    if (!response.ok || !json.ok || !json.data) {
      return {
        ok: false,
        error: json.error || 'পাসপোর্ট থেকে তথ্য পড়া যায়নি।'
      };
    }

    return json;
  } catch {
    return {
      ok: false,
      error: 'সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে। অনুগ্রহ করে হাতে তথ্য পূরণ করুন।'
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
