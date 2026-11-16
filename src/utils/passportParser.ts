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

// Strip MRZ filler sequences where '<' was OCR'd as L, C, K, E, X, or R
function stripMrzFillerNoise(raw: string): string {
  let cleaned = raw
    .toUpperCase()
    // Remove any run of 3+ repeated filler-like letters (e.g. LLL, LLLCLLLLLLLLLR, CCC, KKK)
    .replace(/[LCKE<]{3,}[A-Z0-9<]*$/g, '')
    .replace(/(?:^|<|\s)(?:[LCK]{3,}|[A-Z]*L{3,}[A-Z]*|C+L{2,}[A-Z]*)(?=$|<|\s)/g, '<')
    .replace(/<+/g, ' ')
    .trim();

  // Filter tokens: drop lone 1-char consonant noise at start/end (e.g. stray 'K' from '<' right after BGD)
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
  if (/^P[A-Z0-9<]{1,2}(?:BGD|8GD|B6D|BGO|BG0)/.test(compact)) return true;
  if (/^[A-Z0-9<]{8,11}(?:BGD|8GD|B6D|BGO|BG0)[A-Z0-9<]{10,}/.test(compact)) return true;
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

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9<]/g, '<'))
    .filter((l) => l.length >= 16);

  // Line 1: P<BGD...
  for (const line of lines) {
    const m1 = line.match(/^P[A-Z0-9<]{1,2}(?:BGD|8GD|B6D|BGO|BG0)([A-Z0-9<]{6,})$/);
    if (m1) {
      // Strip trailing filler noise first so '<<' split stays clean
      const namePayload = m1[1].replace(/[LCKE<]{4,}[A-Z0-9<]*$/, '');
      const parts = namePayload.split(/<{2,}|<[LCK]<|L{3,}/).filter(Boolean);
      if (parts.length >= 2) {
        const surname = cleanMrzNameSegment(parts[0]);
        const given = cleanMrzNameSegment(parts.slice(1).join(' '));
        // Avoid duplicating tokens
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

  // Line 2: [DocNo 9][Chk][Nat BGD][DOB 6][Chk][Sex][Exp 6][Chk][Optional...]
  for (const line of lines) {
    const m2 = line.match(/^([A-Z0-9<]{8,11})(?:BGD|8GD|B6D|BGO|BG0)([A-Z0-9<]{14,})$/);
    if (!m2) continue;

    const rawDocAndChk = m2[1];
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

const LABEL_STOP_WORDS_RE =
  /\b(surname|sur\s*name|sumame|given\s*name|nationality|date\s*of\s*birth|sex|gender|place\s*of\s*birth|date\s*of\s*issue|date\s*of\s*expiry|issuing\s*authority|personal\s*no|passport\s*no|father|mother|spouse|legal\s*guardian|permanent\s*address|present\s*address|emergency\s*contact|relationship|telephone|mobile|phone|email|signature|country\s*code|peoples\s*republic)\b/i;

const NON_NAME_VALUE_RE =
  /\b(bangladeshi|bangladesh|republic|passport|male|female|dhaka|single|married|none|nil|null)\b/i;

function cleanAsciiFieldLine(raw: string): string {
  return raw
    .replace(/[|/\\_*~`^[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeRealNameOrText(text: string, allowLowercaseAddress = false): boolean {
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3) return false;
  if (/^(?:n\/a|na|nil|none|---)$/i.test(text.trim())) return false;
  const upperLetters = text.replace(/[^A-Z]/g, '');
  const digits = text.replace(/[^0-9]/g, '');
  const ratio = upperLetters.length / letters.length;
  if (allowLowercaseAddress) {
    // Reject all-lowercase OCR gibberish from Bengali labels (e.g. "atat fast"); real passport addresses have UPPERCASE or digits
    if (upperLetters.length < 2 && digits.length === 0) return false;
    const words = text.trim().split(/\s+/).filter((w) => /[A-Za-z0-9]{2,}/.test(w));
    return words.length >= 2 || ratio >= 0.45;
  }
  return ratio >= 0.55;
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

    const afterLabel = line.slice((match.index ?? 0) + match[0].length);
    const sameLineClean = cleanAsciiFieldLine(
      afterLabel.replace(/^[\s:.\-/()]+/, '')
    );

    const collected: string[] = [];
    if (
      sameLineClean &&
      sameLineClean.length >= 2 &&
      !LABEL_STOP_WORDS_RE.test(sameLineClean) &&
      (!options?.rejectNonNameValues || !NON_NAME_VALUE_RE.test(sameLineClean)) &&
      looksLikeRealNameOrText(sameLineClean, options?.allowLowercaseAddress)
    ) {
      collected.push(sameLineClean);
    }

    if (collected.length === 0 || maxExtraLines > 0) {
      const limit = collected.length === 0 ? 3 + maxExtraLines : maxExtraLines;
      for (let offset = 1; offset <= limit && i + offset < lines.length; offset++) {
        const rawNext = lines[i + offset];
        if (rawNext.includes('---PAGE_BREAK---') || isMrzLine(rawNext)) break;
        const nextLine = cleanAsciiFieldLine(rawNext);
        if (!nextLine || nextLine.length < 2) continue;
        if (LABEL_STOP_WORDS_RE.test(nextLine)) break;
        if (options?.rejectNonNameValues && NON_NAME_VALUE_RE.test(nextLine)) continue;
        if (!looksLikeRealNameOrText(nextLine, options?.allowLowercaseAddress)) continue;
        collected.push(nextLine);
        if (maxExtraLines === 0) break;
      }
    }

    if (collected.length > 0) {
      let joined = collected.join(', ').replace(/,\s*,+/g, ', ').trim();
      if (options?.stripDigits) {
        joined = joined.replace(/[0-9]/g, '').replace(/\s+/g, ' ').trim();
      }
      if (joined.length >= 2) return joined;
    }
  }

  return '';
}

function matchStrictBdMobile(text: string): string {
  // Match phone-like token with optional spaces/dashes, ensuring not embedded inside a longer NID/digit sequence
  const candidateRe = /(?<!\d)\+?(?:88[\s\-]?)?(0?1[3-9](?:[\s\-]?\d){8})(?!\d)/g;
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

  // 1. Prefer lines explicitly mentioning telephone/mobile/phone/contact
  for (let i = 0; i < nonMrzLines.length; i++) {
    if (/(t[ec]l[ec]ph[o0]n[ec]|ph[o0]n[ec]|m[o0]b[il1]l[ec]|c[o0]nt[ae]ct|\btel\b|\bcell\b)/i.test(nonMrzLines[i])) {
      const windowText = [nonMrzLines[i], nonMrzLines[i + 1] || ''].join(' ');
      const found = matchStrictBdMobile(windowText);
      if (found) return found;
    }
  }

  // 2. Fallback anywhere in non-MRZ text
  return matchStrictBdMobile(fullText);
}

function extractNidNumber(lines: string[], mrzNid: string): string {
  const nonMrzLines = lines.filter((l) => !isMrzLine(l));

  for (let i = 0; i < nonMrzLines.length; i++) {
    if (/(p[ec]rs[o0]n[ae]l\s*n[o0]|national\s*id|nid\s*no|\bnid\b|identity\s*no)/i.test(nonMrzLines[i])) {
      const windowText = [nonMrzLines[i], nonMrzLines[i + 1] || ''].join(' ');
      const compactDigits = fixDigits(windowText).replace(/[^\d\s]/g, ' ');
      const matches = compactDigits.match(/\b\d{10,17}\b/g);
      if (matches && matches.length > 0) {
        const exact = matches.find((d) => d.length === 17 || d.length === 13 || d.length === 10);
        if (exact) return exact;
        return matches[0];
      }
    }
  }

  for (const line of nonMrzLines) {
    if (/passport/i.test(line)) continue;
    const nums = line.replace(/[^\d\s]/g, ' ').match(/\b\d{10,17}\b/g);
    if (nums) {
      const candidate = nums.find(
        (d) => (d.length === 10 || d.length === 13 || d.length === 17) && !/^01[3-9]\d{8}$/.test(d)
      );
      if (candidate) return candidate;
    }
  }

  return mrzNid;
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
    const labeledDoc = extractValueAfterLabel(lines, /(?:passport\s*no\.?|document\s*no\.?)/i);
    const docMatch = labeledDoc.toUpperCase().match(/\b([A-Z]{1,2})\s*([A-Z0-9]{7})\b/);
    if (docMatch) {
      passportNo = `${docMatch[1]}${fixDigits(docMatch[2])}`;
    } else {
      const anyBdPassport = fullOcrText.toUpperCase().match(/\b([A-Z]{1,2}\d{7})\b/);
      if (anyBdPassport) passportNo = anyBdPassport[1];
    }
  }

  // 2. English Name: strongly prefer clean printed Given Name + Surname over noisy MRZ Line 1
  const givenName = extractValueAfterLabel(lines, /g[il1]ven\s*n[ae]m[ec](?:\(?s\)?)?/i, {
    stripDigits: true,
    rejectNonNameValues: true
  });
  const surname = extractValueAfterLabel(lines, /\b(?:sur\s*n[ae]m[ec]|sumame)\b/i, {
    stripDigits: true,
    rejectNonNameValues: true
  });

  let printedName = '';
  if (givenName || surname) {
    const gClean = fixAlpha(givenName);
    const sClean = fixAlpha(surname);
    if (gClean && sClean && !gClean.includes(sClean)) {
      printedName = `${gClean} ${sClean}`.trim();
    } else {
      printedName = (gClean || sClean).trim();
    }
  } else {
    const holderName = extractValueAfterLabel(lines, /(?:full\s*name|holder'?s?\s*name)/i, {
      stripDigits: true,
      rejectNonNameValues: true
    });
    if (holderName) printedName = fixAlpha(holderName);
  }

  const nameEn = (printedName || mrz.nameEn || '').toUpperCase().replace(/\s+/g, ' ').trim();

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

  // 5. Father's Name (English)
  const fatherRaw = extractValueAfterLabel(
    lines,
    /f[ae]th[ec]r(?:'?s|\s*\/\s*husband'?s?)?\s*n[ae]m[ec]/i,
    { stripDigits: true, rejectNonNameValues: true }
  );
  const fatherNameEn = fatherRaw ? fixAlpha(fatherRaw) : '';

  // 6. Mother's Name (English)
  const motherRaw = extractValueAfterLabel(lines, /m[o0]th[ec]r'?s?\s*n[ae]m[ec]/i, {
    stripDigits: true,
    rejectNonNameValues: true
  });
  const motherNameEn = motherRaw ? fixAlpha(motherRaw) : '';

  // 7. Mobile Number
  const phone = extractPhoneNumber(lines);

  // 8. Present / Holder's Address (Priority: Present Address -> Permanent Address -> Address before Emergency Contact)
  let presentAddress = extractValueAfterLabel(lines, /pr[ec]s[ec]nt\s*[ae]ddr[ec]ss/i, {
    allowMultiLine: 2,
    allowLowercaseAddress: true
  });
  if (!presentAddress) {
    presentAddress = extractValueAfterLabel(lines, /p[ec]rm[ae]n[ec]nt\s*[ae]ddr[ec]ss/i, {
      allowMultiLine: 2,
      allowLowercaseAddress: true
    });
  }
  if (!presentAddress) {
    // Fallback generic Address (avoid Emergency Contact section if possible)
    const emergIdx = lines.findIndex((l) => /emergency\s*contact/i.test(l));
    const holderLines = emergIdx > 0 ? lines.slice(0, emergIdx) : lines;
    presentAddress = extractValueAfterLabel(holderLines, /\b[ae]ddr[ec]ss\b/i, {
      allowMultiLine: 2,
      allowLowercaseAddress: true
    });
    if (!presentAddress) {
      presentAddress = extractValueAfterLabel(lines, /\b[ae]ddr[ec]ss\b/i, {
        allowMultiLine: 2,
        allowLowercaseAddress: true
      });
    }
  }

  return {
    nameEn,
    dateOfBirth,
    nidNo,
    passportNo,
    phone,
    fatherNameEn,
    motherNameEn,
    presentAddress
  };
}
