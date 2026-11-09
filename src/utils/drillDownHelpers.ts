import { InquiryItem, HajiFinanceRecord, KafelaGroup } from '../types';

/**
 * Extracts and normalizes the Hajj Type ('hajj' | 'umrah') for an inquiry or finance record
 */
export const extractItemType = (
  item: InquiryItem | HajiFinanceRecord | Partial<InquiryItem> | Partial<HajiFinanceRecord>
): 'hajj' | 'umrah' => {
  if ('hajiType' in item && item.hajiType) {
    return item.hajiType === 'umrah' ? 'umrah' : 'hajj';
  }
  if ('registrationType' in item && item.registrationType) {
    return item.registrationType === 'umrah' ? 'umrah' : 'hajj';
  }
  const label = `${(item as any).serviceName || ''} ${(item as any).serviceId || ''} ${(item as any).packageName || ''}`.toLowerCase();
  if (/ওমরা|উমরা|umrah|omrah/i.test(label) || (item as any).serviceId === 'hajj-umrah') {
    return 'umrah';
  }
  return 'hajj';
};

/**
 * Normalizes year strings to consistent Bengali digits (e.g., '২০২৬')
 */
export const normalizeBengaliYear = (yearStr?: string): string => {
  if (!yearStr) return '২০২৬';
  if (/2027|২০২৭/.test(yearStr)) return '২০২৭';
  if (/2026|২০২৬/.test(yearStr)) return '২০২৬';
  if (/2025|২০২৫/.test(yearStr)) return '২০২৫';
  if (/2024|২০২৪/.test(yearStr)) return '২০২৪';
  const match = yearStr.match(/\d{4}/);
  if (match) {
    return match[0].replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d, 10)]);
  }
  return '২০২৬';
};

/**
 * Extracts the registration year from an inquiry or finance record
 */
export const extractItemYear = (
  item: InquiryItem | HajiFinanceRecord | Partial<InquiryItem> | Partial<HajiFinanceRecord>
): string => {
  const text = `${(item as any).date || ''} ${(item as any).yearSeason || ''} ${(item as any).createdAt || ''}`;
  return normalizeBengaliYear(text);
};

/**
 * Extracts the group name for an inquiry or finance record
 */
export const extractItemGroup = (
  item: InquiryItem | HajiFinanceRecord | Partial<InquiryItem> | Partial<HajiFinanceRecord>,
  allInquiries: InquiryItem[] = [],
  kafelaGroups: KafelaGroup[] = []
): string => {
  // 1. Direct selectedGroup field
  if ((item as any).selectedGroup && String((item as any).selectedGroup).trim()) {
    return String((item as any).selectedGroup).trim();
  }
  // 2. Direct groupName field
  if ((item as any).groupName && String((item as any).groupName).trim()) {
    return String((item as any).groupName).trim();
  }
  // 3. Link via inquiryId or registrationRef
  if ('inquiryId' in item && item.inquiryId) {
    const linked = allInquiries.find((inq) => inq.id === item.inquiryId);
    if (linked?.selectedGroup && linked.selectedGroup.trim()) {
      return linked.selectedGroup.trim();
    }
  }
  if ('registrationRef' in item && item.registrationRef) {
    const linked = allInquiries.find(
      (inq) => inq.registrationRef === item.registrationRef || inq.hajiUserId === item.registrationRef
    );
    if (linked?.selectedGroup && linked.selectedGroup.trim()) {
      return linked.selectedGroup.trim();
    }
  }

  // 4. Inspect text for known group names
  const fullText = `${(item as any).yearSeason || ''} ${(item as any).notes || ''} ${(item as any).packageName || ''}`;
  for (const group of kafelaGroups) {
    if (group.name && fullText.toLowerCase().includes(group.name.toLowerCase())) {
      return group.name;
    }
  }
  if (/Group-DECEMBER\s*2026|december\s*2026/i.test(fullText)) {
    return 'Group-DECEMBER 2026';
  }
  if (/Group-A\b/i.test(fullText)) return 'Group-A';
  if (/Group-B\b/i.test(fullText)) return 'Group-B';
  if (/Group-C\b/i.test(fullText)) return 'Group-C';

  return 'সাধারণ / আনঅ্যাসাইন্ড গ্রুপ';
};

export interface YearGroupSummary {
  year: string;
  count: number;
  totalContract: number;
  totalDeposited: number;
  totalDue: number;
}

export interface KafelaGroupSummary {
  groupName: string;
  count: number;
  totalContract: number;
  totalDeposited: number;
  totalDue: number;
  leader?: string;
  maxCapacity?: number;
}
