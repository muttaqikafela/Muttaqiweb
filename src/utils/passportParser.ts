import type { ExtractedPassportData } from './passportOcr';

const MONTH_MAP: Record<string, string> = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  SEPT: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12'
};

function fixDigits(str: string): string {
  return str
    .toUpperCase()
    .replace(/[OQDU]/g, '0')
    .replace(/[IL|!]/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/G/g, '6')
    .replace(/B/g, '8');
}

function fixAlpha(str: string): string {
  return str
    .toUpperCase()
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/5/g, 'S')
    .replace(/8/g, 'B')
    .replace(/[^A-Z\s.\-']/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.\-']+|[\s.\-']+$/g, '')
    .trim();
}

// Clean stray OCR watermark tokens from English person names (e.g. "SMD ALTAF ALI", "AMIN SSK", "' LESABIBI A")
function cleanPersonNameTokens(rawName: string): string {
  const fixed = fixAlpha(rawName)
    .replace(/\b[S58]MD\b/g, 'MD')
    .replace(/\b[S58]MST\b/g, 'MST');

  const tokens = fixed
    .split(/\s+/)
    .map((t) => t.replace(/^[.\-']+|[.\-']+$/g, ''))
    .filter(Boolean);

  // Strip trailing non-word OCR watermark artifacts (e.g. "SSK", "LA", "A", "LL", "KK") when preceded by a real name
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1];
    const isSingleCharJunk = last.length === 1;
    const isConsonantClusterJunk = last.length >= 3 && !/[AEIOUY]/.test(last);
    const isRepeatedCharJunk = last.length >= 2 && /^(.)\1+$/.test(last);
    const isTwoLetterWatermarkJunk =
      tokens.length >= 2 &&
      last.length === 2 &&
      !/^(?:DE|HO|LI|WU|XU|YU|NA|OM|AL)$/i.test(last);
    if (
      isSingleCharJunk ||
      isConsonantClusterJunk ||
      isRepeatedCharJunk ||
      isTwoLetterWatermarkJunk
    ) {
      tokens.pop();
    } else {
      break;
    }
  }

  // Strip leading stray 1-2 letter watermark speck (especially before MD/MST/SK/MOHD)
  while (
    tokens.length > 1 &&
    tokens[0].length === 1 &&
    tokens[1].length > 1
  ) {
    tokens.shift();
  }
  const titleIdx = tokens.findIndex(
    (t, idx) =>
      idx > 0 &&
      idx <= 2 &&
      /^(?:MD|MST|SK|MOHD|ALHAJ|HAJI|KM|AK)$/.test(t) &&
      tokens.slice(0, idx).every((prev) => prev.length <= 2)
  );
  if (titleIdx > 0 && tokens.length - titleIdx >= 2) {
    tokens.splice(0, titleIdx);
  }

  // Fix common BD passport prefix OCR misread ("MO SHARIFUL ISLAM" -> "MD SHARIFUL ISLAM")
  if (tokens.length >= 2 && tokens[0] === 'MO') {
    tokens[0] = 'MD';
  }

  // Separate glued MD/MST prefix if Tesseract merged spaces (e.g. "MDTOZIMMAL" -> "MD TOZIMMAL")
  if (tokens.length >= 1 && /^(MD|MST)([A-Z]{5,})$/.test(tokens[0])) {
    const m = tokens[0].match(/^(MD|MST)([A-Z]{5,})$/);
    if (m) {
      tokens.splice(0, 1, m[1], m[2]);
    }
  }

  return tokens.join(' ').trim();
}

// Reconcile printed name with reliable OCR-B MRZ name
function reconcilePrintedAndMrzName(printedName: string, mrzName: string): string {
  const pClean = cleanPersonNameTokens(printedName);
  const mRaw = mrzName ? mrzName.replace(/\b(MD|MST)([A-Z]{3,})\b/g, '$1 $2').trim() : '';
  const mClean = mRaw ? cleanPersonNameTokens(mRaw) : '';

  if (!pClean) return mClean;
  if (!mClean) return pClean;

  const pCompact = pClean.replace(/\s+/g, '');
  const mCompact = mClean.replace(/\s+/g, '');

  // Identical letters -> prefer printed spacing
  if (pCompact === mCompact) {
    return pClean;
  }

  const pTokens = pClean.split(/\s+/).filter(Boolean);
  const mTokens = mClean.split(/\s+/).filter(Boolean);

  // If MRZ failed to split "<" (fewer tokens than printed, or cyclic Surname/Given with <=2 stray "<" noise chars like "BIBIK MST ZAHURA" vs "MST ZAHURA BIBI"), trust printed name!
  if (
    pTokens.length >= 2 &&
    (mTokens.length < pTokens.length || pCompact.length >= mCompact.length - 2) &&
    pTokens.every((t) => mCompact.includes(t))
  ) {
    return pClean;
  }

  // If MRZ dropped a real surname/word (e.g. mClean="MD ALTAF" while pClean="MD ALTAF ALI"), never discard the extra >=3-letter name word
  if (
    pTokens.length > mTokens.length &&
    mTokens.every((t) => pTokens.includes(t)) &&
    pTokens.slice(mTokens.length).every((t) => t.length >= 3)
  ) {
    return pClean;
  }

  // Printed has 1-3 stray edge characters around exact MRZ letters -> prefer clean MRZ (e.g. "SMD ALTAF ALI" -> "MD ALTAF ALI")
  if (pTokens.length === mTokens.length && pCompact.length <= mCompact.length + 3 && pCompact.includes(mCompact)) {
    return mClean;
  }

  // Very long name truncated by 39-char ICAO MRZ field -> keep full printed name if it extends MRZ prefix cleanly
  if (mCompact.length >= 26 && pCompact.startsWith(mCompact.slice(0, 18))) {
    return pClean;
  }

  // When MRZ has complete Given Name + Surname (>= 2 tokens, e.g. "MD ALTAF ALI"), reject corrupted extra words like "SIR AREN"
  if (mTokens.length >= 2) {
    const expanded: string[] = [];
    for (const mt of mTokens) {
      let splitMatch: string | null = null;
      for (let i = 0; i < pTokens.length; i++) {
        let joined = '';
        const slice: string[] = [];
        for (let j = i; j < pTokens.length && joined.length < mt.length; j++) {
          joined += pTokens[j];
          slice.push(pTokens[j]);
        }
        if (slice.length >= 2 && joined === mt) {
          splitMatch = slice.join(' ');
          break;
        }
      }
      if (!splitMatch && mt.length >= 5) {
        // Strip 1-2 stray "<" OCR misread chars (K/S/L/C) prepended/appended to an MRZ token if the inner word matches printed text
        const edgeTrimmedMatch = pTokens.find(
          (pt) =>
            pt.length >= 4 &&
            ((/^[KLCS]{1,2}[A-Z]+$/.test(mt) && mt.endsWith(pt)) ||
              (/^[A-Z]+[KLCS]{1,2}$/.test(mt) && mt.startsWith(pt))) &&
            mt.length - pt.length <= 2
        );
        if (edgeTrimmedMatch) {
          splitMatch = edgeTrimmedMatch;
        }
      }
      expanded.push(splitMatch || mt);
    }
    return expanded.join(' ').trim();
  }

  return pClean;
}

// Remove OCR watermark fragments like "-fl", "s1171)", "3ii", "oo" from uppercase name values BEFORE uppercasing
function stripLowercaseNoiseTokens(raw: string): string {
  return raw
    .replace(/[-\s]+[a-z]{1,4}\b/g, ' ')
    .replace(/\b[a-z]{1,4}[-\s]+/g, ' ')
    .replace(/\b[a-z0-9]{1,3}[)\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDateString(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/,/g, ' ').replace(/\s+/g, ' ');
  if (!cleaned) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  const dMonY = cleaned.match(/(\d{1,2})[\s\-\/.]+([A-Z]{3,4})[\s\-\/.]+(\d{4})/);
  if (dMonY) {
    const dayNum = Number(dMonY[1]);
    const month = MONTH_MAP[dMonY[2]];
    const yearNum = Number(dMonY[3]);
    if (month && dayNum >= 1 && dayNum <= 31 && yearNum >= 1900 && yearNum <= 2100) {
      return `${yearNum}-${month}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  const dmy = cleaned.match(/(\d{1,2})[\s\-\/.]+(\d{1,2})[\s\-\/.]+(\d{4})/);
  if (dmy) {
    const dayNum = Number(dmy[1]);
    const monNum = Number(dmy[2]);
    const yearNum = Number(dmy[3]);
    if (monNum >= 1 && monNum <= 12 && dayNum >= 1 && dayNum <= 31 && yearNum >= 1900 && yearNum <= 2100) {
      return `${yearNum}-${String(monNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  return '';
}

function parseMrzYYMMDD(yymmddRaw: string): string {
  const digits = fixDigits(yymmddRaw).replace(/\D/g, '');
  if (digits.length !== 6) return '';
  const yy = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const dd = Number(digits.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return '';
  const currentYY = new Date().getFullYear() % 100;
  const fullYear = yy > currentYY + 1 ? 1900 + yy : 2000 + yy;
  return `${fullYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

function stripMrzFillerNoise(raw: string): string {
  const cleaned = raw
    .toUpperCase()
    .replace(/[LCKE<]{3,}[A-Z0-9<]*$/g, '')
    .replace(/(?:^|<|\s)(?:[LCK]{3,}|[A-Z]*L{3,}[A-Z]*|C+L{2,}[A-Z]*)(?=$|<|\s)/g, '<')
    .replace(/<+/g, ' ')
    .trim();

  const tokens = cleaned
    .split(/\s+/)
    .map((t) => fixAlpha(t))
    .filter(Boolean)
    .filter((t) => !/^(?:L{2,}|C{2,}|K{2,}|[LCK]{3,})$/.test(t));

  while (tokens.length > 1 && tokens[0].length === 1 && !['A', 'I', 'M'].includes(tokens[0])) {
    tokens.shift();
  }
  while (tokens.length > 1 && tokens[tokens.length - 1].length === 1) {
    tokens.pop();
  }

  return tokens.join(' ').trim();
}

function cleanMrzNameSegment(seg: string): string {
  return stripMrzFillerNoise(seg);
}

function isMrzLine(line: string): boolean {
  const compact = line.toUpperCase().replace(/\s+/g, '');
  if (compact.length < 18) return false;
  if (/^P[A-Z0-9<]{1,2}(?:BGD|8GD|B6D|BGO|BG0|BED)/.test(compact)) return true;
  if (/^[A-Z0-9<]{8,11}(?:BGD|8GD|B6D|BGO|BG0|BED)[A-Z0-9<]{10,}/.test(compact)) return true;
  if ((compact.match(/</g) || []).length >= 4) return true;
  if (/L{4,}|C{4,}/.test(compact)) return true;
  return false;
}

interface MrzParsed {
  nameEn: string;
  passportNo: string;
  dateOfBirth: string;
  nidNo: string;
}

function parseMrzFromText(text: string): MrzParsed {
  const result: MrzParsed = {
    nameEn: '',
    passportNo: '',
    dateOfBirth: '',
    nidNo: ''
  };

  // Also search anywhere inside a line (in case junk preceded P<BGD on the same OCR line)
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9<]/g, '<'))
    .filter((l) => l.length >= 16);

  // Line 1: P<BGD... (tolerant of P/F/R/D or BGD OCR variants)
  const bgdPat = '(?:BGD|8GD|B6D|BGO|BG0|BED|86D|BCD|B0D|RGD|EGD|B60|8GO)';
  for (const line of rawLines) {
    const m1 =
      line.match(new RegExp(`[PFRD][A-Z0-9<]{1,2}${bgdPat}([A-Z0-9<]{6,})`)) ||
      line.match(new RegExp(`^[^0-9]*${bgdPat}([A-Z<]{3,}(?:<{2,}|<[LCK]<)[A-Z<]{3,})`));
    if (m1) {
      // Truncate if MRZ Line 2 got concatenated on the same line
      const line1Only = m1[1].replace(new RegExp(`[A-Z]{1,2}\\d{7,8}${bgdPat}.*$`), '');
      // Strip trailing MRZ filler ("<<LLLLLL" / "LLLLLL" / "<<<") without matching 4-char "<K<K" name separators
      const namePayload = line1Only.replace(/(?:<{2,}[LCKE<]{2,}|[LCKE<]{6,}|<{3,})[A-Z0-9<]*$/, '');
      // Handle << as well as OCR misreads like <K<K, <K<, K<, CK, LK before common prefixes
      const parts = namePayload
        .split(/(?:<{2,}|(?:<[LCK])+<?|L{3,}|(?:[LCK]{1,2}<|<[LCK]|[LCK]{2})(?=(?:MD|MST|MOHD|ALHAJ|HAJI|SK)[A-Z<]))/)
        .filter(Boolean);
      if (parts.length >= 2) {
        const surname = cleanMrzNameSegment(parts[0]);
        const given = cleanMrzNameSegment(parts.slice(1).join(' '));
        if (given && surname && given !== surname) {
          result.nameEn = `${given} ${surname}`.trim();
        } else {
          result.nameEn = (given || surname).trim();
        }
      } else if (parts.length === 1) {
        result.nameEn = cleanMrzNameSegment(parts[0]);
      }
      break;
    }
  }

  // Line 2: [DocNo 9][Chk][Nat BGD][DOB 6][Chk][Sex][Exp 6][Chk][Optional...] (require 6 DOB-like chars after BGD so Line 1 never matches)
  for (const line of rawLines) {
    const m2 = line.match(new RegExp(`([A-Z0-9<]{8,11})${bgdPat}(?=[0-9OQDUILZSG<]{6})([A-Z0-9<]{14,})`));
    if (!m2) continue;

    // Take trailing 10 chars right before BGD in case junk preceded passport number
    const rawDocAndChk = m2[1].slice(-10);
    const docRaw = rawDocAndChk.slice(0, Math.min(9, rawDocAndChk.length)).replace(/</g, '');
    if (docRaw.length >= 7) {
      const bdFormat = docRaw.match(/^([A-Z]{1,2})([A-Z0-9]{6,8})$/);
      if (bdFormat) {
        result.passportNo = `${bdFormat[1]}${fixDigits(bdFormat[2])}`;
      } else {
        result.passportNo = docRaw;
      }
    }

    const rest = m2[2];
    if (rest.length >= 6) {
      const dob = parseMrzYYMMDD(rest.slice(0, 6));
      if (dob) result.dateOfBirth = dob;
    }

    if (rest.length > 16) {
      const optionalSection = rest.slice(15).split('<')[0];
      const optionalDigits = fixDigits(optionalSection).replace(/\D/g, '');
      if (optionalDigits.length === 10 || optionalDigits.length === 13) {
        result.nidNo = optionalDigits;
      } else if (optionalDigits.length >= 11 && optionalDigits.length <= 14) {
        result.nidNo = optionalDigits;
      }
    }
    break;
  }

  return result;
}

const RELATION_LABEL_PATTERN =
  '(?:relationship|\\br[eco][l1tfioea]{1,3}[aeo]?tion(?:s[a-z0-9]{1,4})?\\b|\\brel[a-z0-9]{4,9}(?:ip|lp|hp)\\b|\\br[eco][il1][aeo]t[il1][o0][nm]?[s5]?h[il1]p\\b|\\br[eco][il1][aeo]t[il1][o0]n\\b)';

const LABEL_STOP_WORDS_RE = new RegExp(
  `(?:\\b(?:surname|sur\\s*name|sumame|given\\s*name|nationality|nationalit|date\\s*of\\s*birth|sex|gender|place\\s*of\\s*birth|date\\s*of\\s*issue|date\\s*of\\s*expiry|issuing\\s*authority|personal\\s*no|passport\\s*no|father'?s?\\s*n[ae]m[ec]|mother'?s?\\s*n[ae]m[ec]|spouse'?s?\\s*n[ae]m[ec]|legal\\s*guardian|legar\\s*guardian|guardian'?s?\\s*n[ae]m[ec]|permanent\\s*address|present\\s*address|emergency\\s*contact|telephone|taleptions|mobile|phone|email|signature|country\\s*code|peoples\\s*republic)\\b|${RELATION_LABEL_PATTERN}|(?:^|[^A-Za-z])(?:n[ae]m[ec]|address|[4a]d{1,2}r[ecao][s5]{1,2})\\s*[:;.\\-]|(?:^|\\s)\\b(?:address)\\b)`,
  'i'
);

const NON_NAME_VALUE_RE =
  /\b(bangladeshi|bangladesh|republic|passport|male|female|single|married|none|nil|null)\b/i;

function cleanAsciiFieldLine(raw: string): string {
  return raw
    .replace(/[|/\\_*~`^[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeRealNameOrText(
  text: string,
  allowLowercaseAddress = false,
  isAddressContinuation = false
): boolean {
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3) return false;
  if (/^(?:n\/a|na|nil|none|---)$/i.test(text.trim())) return false;
  const upperLetters = text.replace(/[^A-Z]/g, '');
  const digits = text.replace(/[^0-9]/g, '');
  const ratio = upperLetters.length / letters.length;
  if (isAddressContinuation) {
    // Continuation lines of BD passport addresses (e.g. "BOGURA", "SAVAR, DHAKA - 1340") must be uppercase words, not watermark junk like "Lo, Wey AN or B 5"
    return ratio >= 0.78 && (/[A-Z]{3,}/.test(text) || /\b[1-9]\d{3}\b/.test(text));
  }
  if (allowLowercaseAddress) {
    if (upperLetters.length < 2 && digits.length === 0) return false;
    const words = text.trim().split(/\s+/).filter((w) => /[A-Za-z0-9]{2,}/.test(w));
    return words.length >= 1 && (words.length >= 2 || ratio >= 0.6);
  }
  return ratio >= 0.55;
}

function truncateAtNextLabel(text: string): string {
  const stopMatch = text.match(LABEL_STOP_WORDS_RE);
  if (stopMatch && stopMatch.index !== undefined) {
    return text.slice(0, stopMatch.index);
  }
  return text;
}

function extractValueAfterLabel(
  lines: string[],
  labelRegex: RegExp,
  options?: {
    allowMultiLine?: number;
    stripDigits?: boolean;
    allowLowercaseAddress?: boolean;
    rejectNonNameValues?: boolean;
  }
): string {
  const maxExtraLines = options?.allowMultiLine ?? 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isMrzLine(line)) continue;
    const match = line.match(labelRegex);
    if (!match) continue;

    const afterRaw = line.slice((match.index ?? 0) + match[0].length);
    // Truncate before any subsequent label on the same line (e.g., "Father's Name: AMIN | Mother's Name: ...")
    const afterLabel = truncateAtNextLabel(afterRaw);
    const trimmedAfterLeading = afterLabel.replace(/^[\s:.;\-/()'"“”‘’~=*|©®°•·]+/, '');

    // Split wide 4+ space column gaps so leading watermark specks ("le     MD SHARIFUL ISLAM     SE") don't kill the real value, while preserving normal name spacing
    let beforeWideGap = trimmedAfterLeading;
    if (!options?.allowLowercaseAddress) {
      const gapChunks = trimmedAfterLeading
        .split(/\s{4,}/)
        .map((c) => c.replace(/\s+(?:[-~=|]+\s+.*|[-~=]{2,}.*)$/, '').trim())
        .filter(Boolean);
      const validChunk =
        gapChunks.find((chunk) => {
          const stripped = stripLowercaseNoiseTokens(chunk);
          return /[A-Z]{2,}/.test(stripped) && looksLikeRealNameOrText(stripped, false, false);
        }) || gapChunks[0] || '';
      beforeWideGap = validChunk;
    }

    const sameLineNoNoise = options?.allowLowercaseAddress
      ? beforeWideGap
      : stripLowercaseNoiseTokens(beforeWideGap);
    const sameLineClean = cleanAsciiFieldLine(
      sameLineNoNoise.replace(/^[\s:.;\-/()']+/, '')
    );

    const collected: string[] = [];
    if (
      sameLineClean &&
      sameLineClean.length >= 2 &&
      (!options?.rejectNonNameValues || !NON_NAME_VALUE_RE.test(sameLineClean)) &&
      looksLikeRealNameOrText(sameLineClean, options?.allowLowercaseAddress, false)
    ) {
      collected.push(sameLineClean);
    }

    if (collected.length === 0 || maxExtraLines > 0) {
      const limit = collected.length === 0 ? 3 + maxExtraLines : maxExtraLines;
      for (let offset = 1; offset <= limit && i + offset < lines.length; offset++) {
        const rawNext = lines[i + offset];
        if (rawNext.includes('---PAGE_BREAK---') || isMrzLine(rawNext)) break;
        if (LABEL_STOP_WORDS_RE.test(rawNext)) {
          // Stop before next label unless there's partial address text before it
          const beforeStop = cleanAsciiFieldLine(truncateAtNextLabel(rawNext));
          if (
            beforeStop &&
            maxExtraLines > 0 &&
            looksLikeRealNameOrText(beforeStop, options?.allowLowercaseAddress, Boolean(options?.allowLowercaseAddress))
          ) {
            collected.push(beforeStop);
          }
          break;
        }
        const nextNoNoise = options?.allowLowercaseAddress
          ? rawNext
          : stripLowercaseNoiseTokens(rawNext);
        const nextLine = cleanAsciiFieldLine(nextNoNoise);
        if (!nextLine || nextLine.length < 2) continue;
        if (options?.rejectNonNameValues && NON_NAME_VALUE_RE.test(nextLine)) continue;
        if (!looksLikeRealNameOrText(nextLine, options?.allowLowercaseAddress, Boolean(options?.allowLowercaseAddress))) continue;
        collected.push(nextLine);
        if (maxExtraLines === 0) break;
      }
    }

    if (collected.length > 0) {
      let joined = collected
        .join(', ')
        .replace(/[.,;]+\s*,+/g, ',')
        .replace(/,\s*,+/g, ', ')
        .replace(/[.,\s]+$/, '')
        .trim();
      if (options?.stripDigits) {
        joined = joined.replace(/[0-9]/g, '').replace(/\s+/g, ' ').trim();
      }
      if (joined.length >= 2) return joined;
    }
  }

  return '';
}

function matchStrictBdMobile(text: string): string {
  // Handle +88013..., 88013..., 80013... (if +88 was slightly misread), or 013...
  const candidateRe = /(?<!\d)\+?(?:8[80][\s\-]?)?(0?1[3-9](?:[\s\-]?\d){8})(?!\d)/g;
  let m: RegExpExecArray | null;
  while ((m = candidateRe.exec(text)) !== null) {
    const digitsOnly = m[1].replace(/\D/g, '');
    if (digitsOnly.length === 11 && /^01[3-9]\d{8}$/.test(digitsOnly)) {
      return digitsOnly;
    }
    if (digitsOnly.length === 10 && /^1[3-9]\d{8}$/.test(digitsOnly)) {
      return `0${digitsOnly}`;
    }
  }
  return '';
}

function extractPhoneNumber(lines: string[]): string {
  const nonMrzLines = lines.filter((l) => !isMrzLine(l));
  const fullText = nonMrzLines.join('\n');

  for (let i = 0; i < nonMrzLines.length; i++) {
    if (/(t[ec]l[ec]ph[o0]n[ec]|t[ae]l[ec]pt[il1][o0]ns?|ph[o0]n[ec]|m[o0]b[il1]l[ec]|c[o0]nt[ae]ct|\btel\b|\bcell\b)/i.test(nonMrzLines[i])) {
      const windowText = [nonMrzLines[i], nonMrzLines[i + 1] || ''].join(' ');
      const found = matchStrictBdMobile(windowText);
      if (found) return found;
    }
  }

  return matchStrictBdMobile(fullText);
}

function isLikelyPhoneNumberDigits(d: string): boolean {
  return /^(?:8801|8001|01)[3-9]\d{8,9}$/.test(d);
}

function extractNidNumber(lines: string[], mrzNid: string): string {
  const nonMrzLines = lines.filter((l) => !isMrzLine(l));

  // 1. Explicit Personal No / NID label check
  for (let i = 0; i < nonMrzLines.length; i++) {
    if (/(p[ec]rs[o0]n[ae]l\s*n[o0]|national\s*id|nid\s*no|\bnid\b|identity\s*no)/i.test(nonMrzLines[i])) {
      const windowText = [nonMrzLines[i], nonMrzLines[i + 1] || ''].join(' ');
      const compactDigits = fixDigits(windowText).replace(/[^\d\s]/g, ' ');
      const matches = compactDigits.match(/\b\d{10,17}\b/g);
      if (matches && matches.length > 0) {
        const exact = matches.find(
          (d) => (d.length === 17 || d.length === 13 || d.length === 10) && !isLikelyPhoneNumberDigits(d)
        );
        if (exact) return exact;
      }
    }
  }

  // 2. Prefer MRZ Personal No / NID (extremely reliable in Bangladeshi e-Passports/MRPs) over un-labeled numbers
  if (mrzNid && !isLikelyPhoneNumberDigits(mrzNid)) {
    return mrzNid;
  }

  // 3. Last resort standalone 10/13/17-digit number (never grabbing 8801/8001/01 phone lookalikes)
  for (const line of nonMrzLines) {
    if (/passport|telephone|taleptions|phone|mobile|contact/i.test(line)) continue;
    const nums = line.replace(/[^\d\s]/g, ' ').match(/\b\d{10,17}\b/g);
    if (nums) {
      const candidate = nums.find(
        (d) => (d.length === 10 || d.length === 13 || d.length === 17) && !isLikelyPhoneNumberDigits(d)
      );
      if (candidate) return candidate;
    }
  }

  return '';
}

export function parseBangladeshiPassportOcrText(
  fullOcrText: string,
  mrzOcrText = ''
): ExtractedPassportData {
  const combinedForMrz = [mrzOcrText, fullOcrText].filter(Boolean).join('\n');
  const mrz = parseMrzFromText(combinedForMrz);

  const lines = fullOcrText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Passport No
  let passportNo = mrz.passportNo;
  if (!passportNo) {
    const labeledDoc = extractValueAfterLabel(lines, /(?:passport\s*no\.?|passport\s*number|document\s*no\.?)/i);
    const docMatch = labeledDoc.toUpperCase().match(/\b([A-Z]{1,2})\s*([A-Z0-9]{7})\b/);
    if (docMatch) {
      passportNo = `${docMatch[1]}${fixDigits(docMatch[2])}`;
    } else {
      const anyBdPassport = fullOcrText.toUpperCase().match(/\b([A-Z]{1,2}\d{7})\b/);
      if (anyBdPassport) passportNo = anyBdPassport[1];
    }
  }

  // 2. English Name: isolate pre-emergency lines per page chunk while keeping break markers
  const pageChunks = fullOcrText.split('---PAGE_BREAK---');
  const holderInfoLines: string[] = [];
  for (let c = 0; c < pageChunks.length; c++) {
    const chunkLines = pageChunks[c]
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const emergIdx = chunkLines.findIndex(
      (l) => /emergency\s*contact/i.test(l) && !/personal\s*data|and\s+emergency/i.test(l)
    );
    if (emergIdx >= 0) {
      holderInfoLines.push(...chunkLines.slice(0, emergIdx), '---PAGE_BREAK---');
    } else {
      holderInfoLines.push(...chunkLines, '---PAGE_BREAK---');
    }
  }

  // Match Personal Info Page "Name:" (even if punch-hole/border symbols precede it, excluding Father's/Mother's/Guardian's/Sur/Given Name)
  const personalNameCandidates: string[] = [];
  for (const l of holderInfoLines) {
    if (l === '---PAGE_BREAK---' || isMrzLine(l)) continue;
    const nmMatch = l.match(/(?:^|[^A-Za-z])n[ae]m[ec]\s*[:;.\-]?/i);
    if (!nmMatch || nmMatch.index === undefined) continue;
    const prefixLower = l.slice(0, nmMatch.index + nmMatch[0].length).toLowerCase();
    if (/(?:father|mother|guardian|spouse|sur|given|holder|full|emergency)/.test(prefixLower)) {
      continue;
    }
    personalNameCandidates.push(l.slice(nmMatch.index));
  }
  const personalPageNameCandidates: string[] = [];
  for (const cand of personalNameCandidates) {
    const extracted = extractValueAfterLabel([cand], /n[ae]m[ec]\b/i, {
      stripDigits: true,
      rejectNonNameValues: true
    });
    if (extracted) {
      const cleaned = cleanPersonNameTokens(extracted);
      if (cleaned) personalPageNameCandidates.push(cleaned);
    }
  }
  const mrzUpperCompact = mrz.nameEn.replace(/[^A-Z]/g, '');
  const scorePersonalName = (n: string) => {
    const parts = n.split(/\s+/).filter(Boolean);
    const compact = n.replace(/[^A-Z]/g, '');
    const mrzOverlap = mrzUpperCompact && (compact.includes(mrzUpperCompact) || mrzUpperCompact.includes(compact)) ? 50 : 0;
    return parts.length * 100 + mrzOverlap + Math.min(35, compact.length);
  };
  const personalPageName =
    personalPageNameCandidates.sort((a, b) => scorePersonalName(b) - scorePersonalName(a))[0] || '';

  // Also grab clean UPPERCASE line right above Father's Name if red-box/border hid the "Name:" label
  let preFatherPageName = '';
  if (!personalPageName) {
    const fatherLineIdx = holderInfoLines.findIndex((l) =>
      /(?:^|[^A-Za-z]|[0-9o])(?:f[aeo]th[ecao]r|fat[bh][ec]r|falher|eather|w[ae]t[ec]rs?)(?:'?s?)?(?:\s*\/\s*husband'?s?)?\s*(?:n[ae]m[ec]|narne|namo|neme|ame)/i.test(l)
    );
    for (let k = fatherLineIdx - 1; k >= Math.max(0, fatherLineIdx - 2); k--) {
      const cand = holderInfoLines[k];
      if (!cand || cand === '---PAGE_BREAK---' || isMrzLine(cand)) continue;
      if (/personal\s*data|emergency|passport|republic/i.test(cand)) continue;
      const cleaned = cleanPersonNameTokens(stripLowercaseNoiseTokens(cand.replace(/^[^A-Z]*[a-z]{0,6}[:;.\-\s]+/, '')));
      if (cleaned && cleaned.split(/\s+/).length >= 2 && looksLikeRealNameOrText(cleaned)) {
        preFatherPageName = cleaned;
        break;
      }
    }
  }

  const givenName = extractValueAfterLabel(lines, /g[il1]v[ec]n\s*n[ae]m[ec](?:\(?s\)?)?|chen\s*name/i, {
    stripDigits: true,
    rejectNonNameValues: true
  });
  const surname = extractValueAfterLabel(lines, /\b(?:sur\s*n[ae]m[ec]|sumame)\b/i, {
    stripDigits: true,
    rejectNonNameValues: true
  });

  let printedName = '';
  const topPageName = personalPageName || preFatherPageName;
  if (topPageName && topPageName.split(/\s+/).length >= 2) {
    printedName = fixAlpha(topPageName);
  } else if (givenName && surname) {
    const gClean = fixAlpha(givenName);
    const sClean = fixAlpha(surname);
    if (gClean && sClean && !gClean.includes(sClean)) {
      printedName = `${gClean} ${sClean}`.trim();
    } else {
      printedName = (gClean || sClean).trim();
    }
  } else {
    const holderName = extractValueAfterLabel(holderInfoLines, /(?:full\s*name|holder'?s?\s*name)/i, {
      stripDigits: true,
      rejectNonNameValues: true
    });
    if (holderName) printedName = fixAlpha(holderName);
  }

  // Fallback: if MRZ name exists (possibly glued) and printed line has the clean spaced form
  if (!printedName && mrz.nameEn) {
    const mrzCompact = mrz.nameEn.replace(/[^A-Z]/g, '');
    if (mrzCompact.length >= 4) {
      for (const line of holderInfoLines) {
        if (isMrzLine(line)) continue;
        const noNoise = cleanAsciiFieldLine(stripLowercaseNoiseTokens(line));
        const tokens = noNoise
          .split(/\s+/)
          .filter((t) => /^[A-Z]{2,}$/.test(t));
        for (let start = 0; start < tokens.length; start++) {
          for (let end = start + 2; end <= tokens.length; end++) {
            const slice = tokens.slice(start, end);
            if (slice.join('') === mrzCompact) {
              printedName = slice.join(' ');
              break;
            }
          }
          if (printedName) break;
        }
        if (printedName) break;
      }
    }
  }

  const nameEn = reconcilePrintedAndMrzName(printedName, mrz.nameEn);

  // 3. Date of Birth
  let dateOfBirth = mrz.dateOfBirth;
  if (!dateOfBirth) {
    const dobRaw = extractValueAfterLabel(lines, /(?:date\s*of\s*birth|\bdob\b)/i);
    dateOfBirth = normalizeDateString(dobRaw);
    if (!dateOfBirth) {
      for (const line of lines) {
        if (!isMrzLine(line) && /birth/i.test(line)) {
          const d = normalizeDateString(line);
          if (d) {
            dateOfBirth = d;
            break;
          }
        }
      }
    }
  }

  // 4. NID No
  const nidNo = extractNidNumber(lines, mrz.nidNo);

  // 5. Father's Name (English) — tolerant of punch-hole prefixes and subtle italic OCR misreads
  const fatherRaw = extractValueAfterLabel(
    holderInfoLines,
    /(?:f[aeo]th[ecao]r|fat[bh][ec]r|falher|eather|w[ae]t[ec]rs?)(?:'?s?)?(?:\s*\/\s*husband'?s?)?\s*(?:n[ae]m[ec]|narne|namo|neme|ame)/i,
    { stripDigits: true, rejectNonNameValues: true }
  );
  const fatherNameEn = fatherRaw ? cleanPersonNameTokens(fatherRaw) : '';

  // 6. Mother's Name (English)
  const motherRaw = extractValueAfterLabel(
    holderInfoLines,
    /m[o0a]th[ecao]r(?:'?s?)?\s*(?:n[ae]m[ec]|narne|namo|neme|ame)/i,
    { stripDigits: true, rejectNonNameValues: true }
  );
  const motherNameEn = motherRaw ? cleanPersonNameTokens(motherRaw) : '';

  // 7. Guardian / Emergency Contact (Name, Relationship & Telephone No.)
  const emergencyLines: string[] = [];
  for (let c = 0; c < pageChunks.length; c++) {
    const chunkLines = pageChunks[c]
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    let emergStart = chunkLines.findIndex(
      (l) => /em[ec]rg[ec]ncy\s*c[o0]nt[ae]ct/i.test(l) && !/personal\s*data|and\s+emergency/i.test(l)
    );
    if (emergStart < 0) {
      const permAddrIdx = chunkLines.findIndex((l) =>
        /p[ae]rm[ae]n[aeo][nm][tf]\s*[ae]d{1,2}r[ecao][s5]{1,2}/i.test(l)
      );
      const relIdx = chunkLines.findIndex((l) =>
        new RegExp(RELATION_LABEL_PATTERN, 'i').test(l)
      );
      if (relIdx >= 0) {
        emergStart = Math.max(permAddrIdx >= 0 ? permAddrIdx + 1 : 0, relIdx - 2);
      } else if (permAddrIdx >= 0) {
        emergStart = permAddrIdx + 1;
      }
    }
    if (emergStart >= 0) {
      emergencyLines.push(...chunkLines.slice(emergStart), '---PAGE_BREAK---');
    }
  }

  const emergNameCandidates: string[] = [];
  for (const l of emergencyLines) {
    if (l === '---PAGE_BREAK---' || isMrzLine(l)) continue;
    const nmMatch = l.match(/(?:^|[^A-Za-z])n[ae]m[ec]\s*[:;.\-]?/i);
    if (!nmMatch || nmMatch.index === undefined) continue;
    const prefixLower = l.slice(0, nmMatch.index + nmMatch[0].length).toLowerCase();
    if (/(?:father|mother|spouse|sur|given|holder|full)/.test(prefixLower)) {
      continue;
    }
    emergNameCandidates.push(l.slice(nmMatch.index));
  }
  const guardianNameCandidates: string[] = [];
  for (let i = 0; i < emergNameCandidates.length; i++) {
    const singleSlice = [emergNameCandidates[i]];
    const candidateRaw = extractValueAfterLabel(singleSlice, /n[ae]m[ec]\b/i, {
      stripDigits: true,
      rejectNonNameValues: true
    });
    if (candidateRaw) {
      const cleaned = cleanPersonNameTokens(candidateRaw);
      if (cleaned) guardianNameCandidates.push(cleaned);
    }
  }
  if (guardianNameCandidates.length === 0) {
    const emergRelIdx = emergencyLines.findIndex((l) =>
      new RegExp(RELATION_LABEL_PATTERN, 'i').test(l)
    );
    if (emergRelIdx > 0) {
      for (let back = emergRelIdx - 1; back >= Math.max(0, emergRelIdx - 2); back--) {
        const cand = emergencyLines[back];
        if (
          !cand ||
          cand === '---PAGE_BREAK---' ||
          isMrzLine(cand) ||
          LABEL_STOP_WORDS_RE.test(cand)
        ) {
          continue;
        }
        const stripped = cand
          .replace(/^[^A-Za-z0-9]+/, '')
          .split(/\s{3,}/)
          .find((c) => /[A-Z]{4,}/.test(c)) || '';
        const cleaned = stripped ? cleanPersonNameTokens(stripLowercaseNoiseTokens(stripped)) : '';
        if (cleaned && cleaned.replace(/[^A-Z]/g, '').length >= 5 && looksLikeRealNameOrText(cleaned)) {
          guardianNameCandidates.push(cleaned);
          break;
        }
      }
    }
  }
  if (guardianNameCandidates.length === 0) {
    const legalRaw = extractValueAfterLabel(
      holderInfoLines,
      /(?:legal|legar)\s*guardian(?:'?s?)?\s*(?:n[ae]m[ec]|narne|namo|neme)/i,
      { stripDigits: true, rejectNonNameValues: true }
    );
    if (legalRaw) {
      const cleaned = cleanPersonNameTokens(legalRaw);
      if (cleaned) guardianNameCandidates.push(cleaned);
    }
  }
  const scoreGuardianName = (name: string) => {
    const parts = name.split(/\s+/).filter(Boolean);
    const hasMdPrefix = /^(?:MD|MST|MOHD|SK|ALHAJ|HAJI)\b/.test(name) ? 10 : 0;
    return parts.length * 100 + hasMdPrefix + Math.min(30, name.length);
  };
  const guardianName =
    guardianNameCandidates.sort((a, b) => scoreGuardianName(b) - scoreGuardianName(a))[0] || '';

  const relationLabelRe = new RegExp(RELATION_LABEL_PATTERN, 'i');

  const normalizeRelationshipValue = (raw: string): string => {
    if (!raw) return '';
    // Do NOT strip lowercase words here: OCR can read "> son" in lowercase!
    const normalized = raw
      .toUpperCase()
      .replace(/0/g, 'O')
      .replace(/1/g, 'I')
      .replace(/5/g, 'S')
      .replace(/8/g, 'B')
      .replace(/4/g, 'A')
      .replace(/6/g, 'G')
      .replace(/[^A-Z\s\-']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!normalized) return '';

    const canonicalPhrases = [
      'FATHER IN LAW',
      'MOTHER IN LAW',
      'BROTHER IN LAW',
      'SISTER IN LAW',
      'SON IN LAW',
      'DAUGHTER IN LAW',
      'GRANDFATHER',
      'GRANDMOTHER',
      'GRANDSON',
      'GRANDDAUGHTER',
      'HUSBAND',
      'WIFE',
      'SPOUSE',
      'FATHER',
      'MOTHER',
      'SON',
      'DAUGHTER',
      'BROTHER',
      'SISTER',
      'UNCLE',
      'AUNT',
      'NEPHEW',
      'NIECE',
      'COUSIN',
      'GUARDIAN',
      'RELATIVE',
      'FRIEND',
      'SELF',
      'PARENTS'
    ];
    for (const phrase of canonicalPhrases) {
      if (new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'i').test(normalized)) {
        return phrase;
      }
    }

    // Common short OCR misreads for BD passport relationships (never accept ADDRESS/location words)
    const fuzzyAliases: Array<[RegExp, string]> = [
      [/\b(?:SDN|SQN|SCN|SOH|S0N|SOM)\b/, 'SON'],
      [/\b(?:WIF|VVIFE|WIFB|W1FE)\b/, 'WIFE'],
      [/\b(?:HUSBANO|HUSBND|HUSBAN[DO])\b/, 'HUSBAND'],
      [/\b(?:DAUGIITER|DAUGHTR|DAUGTHER)\b/, 'DAUGHTER'],
      [/\b(?:FATIIER|FATHR)\b/, 'FATHER'],
      [/\b(?:MOTIIER|MOTHR)\b/, 'MOTHER'],
      [/\b(?:BROTIIER|BROTHR)\b/, 'BROTHER'],
      [/\b(?:SISTFR|SISTR)\b/, 'SISTER']
    ];
    for (const [re, canonical] of fuzzyAliases) {
      if (re.test(normalized)) {
        return canonical;
      }
    }

    return '';
  };

  const extractRelFromSegment = (segment: string): string => {
    const chunks = segment
      .split(/\s{3,}/)
      .map((c) => c.replace(/\s+(?:[-~=|]+\s+.*|[-~=]{2,}.*)$/, '').trim())
      .filter(Boolean);
    for (const chunk of chunks) {
      const rel = normalizeRelationshipValue(chunk);
      if (rel) return rel;
    }
    return normalizeRelationshipValue(segment);
  };

  const relationSource = emergencyLines.length > 0 ? emergencyLines : lines;
  let guardianRelation = '';
  for (let i = 0; i < relationSource.length; i++) {
    const line = relationSource[i];
    if (line === '---PAGE_BREAK---' || isMrzLine(line)) continue;
    const match = line.match(relationLabelRe);
    if (!match || match.index === undefined) continue;

    const afterRaw = line.slice(match.index + match[0].length);
    const beforeNextLabel = truncateAtNextLabel(afterRaw).replace(/^[\s:.;\-/()'"“”‘’~=*|>]+/, '');

    const directRel = extractRelFromSegment(beforeNextLabel);
    if (directRel) {
      guardianRelation = directRel;
      break;
    }

    // Only inspect up to 2 subsequent lines if they are NOT Address/Name/Telephone lines and contain a canonical relationship
    for (let offset = 1; offset <= 2 && i + offset < relationSource.length; offset++) {
      const nextLine = relationSource[i + offset];
      if (
        !nextLine ||
        nextLine === '---PAGE_BREAK---' ||
        isMrzLine(nextLine) ||
        LABEL_STOP_WORDS_RE.test(nextLine) ||
        /[0-9]{4}|,/.test(nextLine)
      ) {
        break;
      }
      const nextRel = extractRelFromSegment(nextLine);
      if (nextRel) {
        guardianRelation = nextRel;
        break;
      }
    }
    if (guardianRelation) break;
  }

  // Fallback for 2-column OCR splits or un-matched labels inside emergencyLines
  if (!guardianRelation && emergencyLines.length > 0) {
    for (const l of emergencyLines) {
      if (
        !l ||
        l === '---PAGE_BREAK---' ||
        isMrzLine(l) ||
        /,|\d{3,}/.test(l)
      ) {
        continue;
      }
      // If Address/Telephone got merged on the same line, inspect only the portion before it
      const safePortion = truncateAtNextLabel(l.replace(relationLabelRe, ''));
      const rel = extractRelFromSegment(safePortion);
      if (rel) {
        guardianRelation = rel;
        break;
      }
    }
  }

  const guardianPhone = extractPhoneNumber(lines);

  // 8. Present / Holder's Address (Priority: Present Address -> Permanent Address -> Permanent keyword -> Address line with village/postcode)
  let presentAddress = extractValueAfterLabel(holderInfoLines, /pr[ec]s[ec]n[tf]\s*[ae]d{1,2}r[ecao][s5]{1,2}/i, {
    allowMultiLine: 2,
    allowLowercaseAddress: true
  });
  if (!presentAddress) {
    presentAddress = extractValueAfterLabel(holderInfoLines, /p[ae]rm[ae]n[aeo][nm][tf]\s*[ae]d{1,2}r[ecao][s5]{1,2}/i, {
      allowMultiLine: 2,
      allowLowercaseAddress: true
    });
  }
  if (!presentAddress) {
    presentAddress = extractValueAfterLabel(holderInfoLines, /\bp[ae]rm[ae]n[aeo][nm][tf]\b(?:\s*[A-Za-z]{4,10}[:;]?)?/i, {
      allowMultiLine: 2,
      allowLowercaseAddress: true
    });
  }
  if (!presentAddress) {
    presentAddress = extractValueAfterLabel(holderInfoLines, /\b[ae]d{1,2}r[ecao][s5]{1,2}\b/i, {
      allowMultiLine: 2,
      allowLowercaseAddress: true
    });
  }
  if (!presentAddress) {
    for (let i = 0; i < holderInfoLines.length; i++) {
      const l = holderInfoLines[i];
      if (
        l === '---PAGE_BREAK---' ||
        isMrzLine(l) ||
        LABEL_STOP_WORDS_RE.test(l)
      ) {
        continue;
      }
      if (/[A-Z]{3,},[\sA-Z0-9,\-.]*[-–]\s*[1-9]\d{3}\b/.test(l)) {
        const cleanedLine = cleanAsciiFieldLine(l.replace(/^[^A-Z0-9]+/, ''));
        const nextL = holderInfoLines[i + 1];
        if (
          nextL &&
          nextL !== '---PAGE_BREAK---' &&
          !isMrzLine(nextL) &&
          !LABEL_STOP_WORDS_RE.test(nextL) &&
          looksLikeRealNameOrText(cleanAsciiFieldLine(nextL), true, true)
        ) {
          presentAddress = `${cleanedLine.replace(/[.,\s]+$/, '')}, ${cleanAsciiFieldLine(nextL)}`;
        } else {
          presentAddress = cleanedLine;
        }
        break;
      }
    }
  }
  if (!presentAddress) {
    presentAddress = extractValueAfterLabel(lines, /\b[ae]d{1,2}r[ecao][s5]{1,2}\b/i, {
      allowMultiLine: 2,
      allowLowercaseAddress: true
    });
  }

  // Clean minor address OCR artifacts (e.g. "TINDIGH!" -> "TINDIGHI", trailing watermark " rr IN")
  if (presentAddress) {
    presentAddress = presentAddress
      .replace(/([A-Z]{2,})[!|](?=[A-Z\s,.-]|$)/g, '$1I')
      .replace(/\s+[a-z]{1,3}(?:\s+[A-Z0-9]{1,2})?$/, '')
      .replace(/[.,\s]+$/, '')
      .trim();
  }

  // 9. Post Code: 4-digit Bangladeshi postal code inside the extracted address (e.g. "BURIGANJ - 5810" -> "5810")
  const postCodeFromAddress =
    presentAddress.match(/[-–]\s*([1-9]\d{3})\b/)?.[1] ||
    presentAddress.match(/\b([1-9]\d{3})\b/)?.[1] ||
    '';
  const postCodeFallback =
    !postCodeFromAddress
      ? holderInfoLines
          .find((l) => /address/i.test(l) && /[-–]\s*[1-9]\d{3}\b/.test(l))
          ?.match(/[-–]\s*([1-9]\d{3})\b/)?.[1] || ''
      : '';
  const postCode = postCodeFromAddress || postCodeFallback;

  return {
    nameEn,
    dateOfBirth,
    nidNo,
    passportNo,
    guardianPhone,
    guardianName,
    guardianRelation,
    fatherNameEn,
    motherNameEn,
    presentAddress,
    postCode
  };
}
