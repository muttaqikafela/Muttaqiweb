export const readBlobAsDataUrl = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('ফাইলটি পড়া যায়নি।'));
    reader.readAsDataURL(file);
  });
};

export const prepareReceiptFile = async (
  file: File
): Promise<{ dataUrl: string; fileName: string; mimeType: string }> => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (file.type !== 'application/pdf' && !allowedImageTypes.includes(file.type)) {
    throw new Error('শুধু JPG, PNG, WEBP ছবি অথবা PDF রসিদ আপলোড করা যাবে।');
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('রসিদের ফাইলের আকার সর্বোচ্চ ৮ MB হতে পারবে।');
  }

  // Handle PDF files
  if (file.type === 'application/pdf') {
    if (file.size > 1.2 * 1024 * 1024) {
      throw new Error('PDF রসিদের আকার ১.২ MB-এর মধ্যে রাখুন।');
    }
    const dataUrl = await readBlobAsDataUrl(file);
    return { dataUrl, fileName: file.name, mimeType: file.type };
  }

  // Handle Image files with client-side canvas compression
  const sourceUrl = await readBlobAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('ছবিটি খোলা যায়নি। সঠিক ছবি ব্যবহার করুন।'));
    img.src = sourceUrl;
  });

  const makeCompressedImage = (maxSide: number, quality: number) => {
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('ছবিটি প্রসেস করা যায়নি।');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  };

  let dataUrl = makeCompressedImage(1600, 0.82);
  if (dataUrl.length > 900_000) {
    dataUrl = makeCompressedImage(1200, 0.68);
  }
  if (dataUrl.length > 950_000) {
    dataUrl = makeCompressedImage(1000, 0.55);
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'money-receipt';
  return {
    dataUrl,
    fileName: `${baseName}.jpg`,
    mimeType: 'image/jpeg'
  };
};
