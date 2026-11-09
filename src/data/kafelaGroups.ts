import { KafelaGroup, InquiryItem } from '../types';

export const MAX_PILGRIMS_PER_GROUP = 50;

const normalizeGroupKey = (value?: string): string => (value || '').trim().toLocaleLowerCase();

export const isInquiryAssignedToGroup = (inquiry: InquiryItem, group: KafelaGroup): boolean => {
  const assignedGroup = normalizeGroupKey(inquiry.selectedGroup);
  return !!assignedGroup && (
    assignedGroup === normalizeGroupKey(group.name) ||
    assignedGroup === normalizeGroupKey(group.id)
  );
};

export const matchesKafelaGroupFilter = (
  inquiry: InquiryItem,
  groupFilter: string,
  groups: KafelaGroup[]
): boolean => {
  const filterKey = normalizeGroupKey(groupFilter);
  const group = groups.find((candidate) =>
    normalizeGroupKey(candidate.name) === filterKey ||
    normalizeGroupKey(candidate.id) === filterKey
  );
  return group
    ? isInquiryAssignedToGroup(inquiry, group)
    : normalizeGroupKey(inquiry.selectedGroup) === filterKey;
};

export const DEFAULT_KAFELA_GROUPS: KafelaGroup[] = [
  {
    id: 'grp-a',
    name: 'Group-A',
    type: 'both',
    category: 'হজ্ব ও ওমরাহ',
    leader: 'মাওলানা আব্দুল হক (প্রধান মোয়াল্লেম)',
    maxCapacity: 50,
    departureDate: 'জিলহজ ১৪৪৭ হি. / রমজান ২০২৬',
    departureMonth: 'কাফেলা গ্রুপ - এ (Group-A)'
  },
  {
    id: 'grp-b',
    name: 'Group-B',
    type: 'both',
    category: 'হজ্ব ও ওমরাহ',
    leader: 'আলহাজ্ব মো: রফিকুল ইসলাম (পরিচালক)',
    maxCapacity: 50,
    departureDate: 'জিলহজ ১৪৪৭ হি. / শাওয়াল ২০২৬',
    departureMonth: 'কাফেলা গ্রুপ - বি (Group-B)'
  },
  {
    id: 'grp-c',
    name: 'Group-C',
    type: 'both',
    category: 'হজ্ব ও ওমরাহ',
    leader: 'মুফতি মাওলানা সাইফুল ইসলাম',
    maxCapacity: 50,
    departureDate: 'রমজান ও শীতকালীন কাফেলা ২০২৬',
    departureMonth: 'কাফেলা গ্রুপ - সি (Group-C)'
  },
  {
    id: 'grp-dec-2026',
    name: 'Group-DECEMBER 2026',
    type: 'umrah',
    category: 'পবিত্র ওমরাহ কাফেলা',
    leader: 'হাফেজ মাওলানা মোঃ আব্দুল মালেক',
    maxCapacity: 50,
    departureDate: 'ডিসেম্বর ২০২৬',
    departureMonth: 'কাফেলা গ্রুপ - ডিসেম্বর ২০২৬ (Group-DECEMBER 2026)'
  },
  {
    id: 'grp-december-2026',
    name: 'December 2026',
    type: 'umrah',
    category: 'পবিত্র ওমরাহ কাফেলা',
    leader: 'হাফেজ মাওলানা মোঃ আব্দুল মালেক',
    maxCapacity: 50,
    departureDate: 'ডিসেম্বর ২০২৬',
    departureMonth: 'কাফেলা - ডিসেম্বর ২০২৬ (December 2026)'
  },
  {
    id: 'grp-december-dash-2026',
    name: 'December- 2026',
    type: 'umrah',
    category: 'পবিত্র ওমরাহ কাফেলা',
    leader: 'আলহাজ্ব মো: রফিকুল ইসলাম (পরিচালক)',
    maxCapacity: 50,
    departureDate: 'ডিসেম্বর ২০২৬',
    departureMonth: 'কাফেলা - ডিসেম্বর ২০২৬ (December- 2026)'
  }
];

export interface GroupOccupancy {
  group: KafelaGroup;
  currentCount: number;
  maxCapacity: number;
  seatsLeft: number;
  isFull: boolean;
  progressPercent: number;
}

export const getGroupOccupancy = (
  group: KafelaGroup,
  inquiries: InquiryItem[] = []
): GroupOccupancy => {
  // Count REAL inquiries registered into this group
  // Calculate total pilgrims (traveler + partners)
  const currentCount = inquiries
    .filter((inq) => {
      const isHaji =
        inq.registrationType === 'haji' ||
        inq.registrationType === 'umrah' ||
        inq.serviceId === 'haji-full-registration' ||
        inq.serviceId === 'hajj-umrah';
      if (!isHaji) return false;
      return isInquiryAssignedToGroup(inq, group);
    })
    .reduce((sum, inq) => {
      const travelers = Number(inq.travelersCount) || 1;
      return sum + travelers;
    }, 0);

  const capacity = group.maxCapacity || MAX_PILGRIMS_PER_GROUP;
  const seatsLeft = Math.max(0, capacity - currentCount);
  const isFull = currentCount >= capacity;
  const progressPercent = Math.min(100, Math.round((currentCount / capacity) * 100));

  return {
    group,
    currentCount,
    maxCapacity: capacity,
    seatsLeft,
    isFull,
    progressPercent
  };
};

export const getAllGroupsOccupancy = (
  groups: KafelaGroup[] = DEFAULT_KAFELA_GROUPS,
  inquiries: InquiryItem[] = []
): GroupOccupancy[] => {
  return groups.map((g) => getGroupOccupancy(g, inquiries));
};
