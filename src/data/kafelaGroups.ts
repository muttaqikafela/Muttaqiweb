import { KafelaGroup, InquiryItem } from '../types';

export const MAX_PILGRIMS_PER_GROUP = 50;

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
      const isHaji = inq.registrationType === 'haji' || inq.serviceId === 'haji-full-registration';
      if (!isHaji) return false;
      const groupName = (group.name || '').toLowerCase().trim();
      const inqGroup = (inq.selectedGroup || '').toLowerCase().trim();
      return (
        inqGroup === groupName ||
        inqGroup === (group.id || '').toLowerCase().trim() ||
        (inq.serviceName && inq.serviceName.toLowerCase().includes(groupName))
      );
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

