import React, { useState } from 'react';
import { PageId, ServiceItem, PricingItem } from '../types';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import { Hero } from '../components/Hero';
import { NoticeBoard } from '../components/NoticeBoard';
import { HajiPrimaryRegistration } from '../components/HajiPrimaryRegistration';
import { HomeImageSlider } from '../components/HomeImageSlider';
import { IslamicPillars } from '../components/IslamicPillars';
import { PrayerTimes } from '../components/PrayerTimes';
import { AdRenderer } from '../components/AdRenderer';
import {
  ArrowRight,
  CheckCircle2,
  Phone,
  Sparkles,
  Plane,
  FileCheck,
  Star,
  Plus,
  Compass,
  Building2,
  MapPin,
  Calendar,
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  Eye,
  Info,
  X,
  MessageCircle,
  Clock,
  Utensils,
  Users
} from 'lucide-react';

interface HomePageProps {
  setCurrentPage: (page: PageId) => void;
  onSelectService: (service: ServiceItem) => void;
  onOpenInquiry: (serviceId?: string) => void;
  onOpenLogin?: () => void;
}

export const HOTEL_PACKAGE_OPTIONS = [
  {
    id: 'room-sharing',
    name: 'শেয়ারিং ইকোনমি রুম (৩★)',
    distance: 'হারাম ৫০০-৮০০ মিটার',
    extraPrice: 0,
    tag: 'মূল প্যাকেজে অন্তর্ভুক্ত'
  },
  {
    id: 'room-quad',
    name: '৪-বেড ফ্যামিলি রুম (৪★)',
    distance: 'হারাম ৩০০-৪০০ মিটার',
    extraPrice: 5000,
    tag: '+৳৫,০০০'
  },
  {
    id: 'room-triple',
    name: '৩-বেড ট্রিপল রুম (৪★)',
    distance: 'হারাম ২০০-৩৫০ মিটার',
    extraPrice: 15000,
    tag: '+৳১৫,০০০'
  },
  {
    id: 'room-double',
    name: '২-বেড কাপল / ডাবল রুম (৪★)',
    distance: 'হারাম ১৫০-৩০০ মিটার',
    extraPrice: 25000,
    tag: '+৳২৫,০০০'
  },
  {
    id: 'room-vip',
    name: '৫★ ভিআইপি হারামের সম্মুখের লাক্সারি',
    distance: 'হারামের সামনে ৫০-১০০ মি.',
    extraPrice: 65000,
    tag: '+৳৬৫,০০০'
  }
];

export const PLANE_PACKAGE_OPTIONS = [
  {
    id: 'plane-biman',
    name: 'বাংলাদেশ বিমান (সরাসরি ফ্লাইট)',
    route: 'ঢাকা ➔ জেদ্দা/মদিনা ডাইরেক্ট',
    extraPrice: 0,
    tag: 'মূল প্যাকেজে অন্তর্ভুক্ত'
  },
  {
    id: 'plane-saudia',
    name: 'সাউদিয়া এয়ারলাইন্স (প্রিমিয়াম ডাইরেক্ট)',
    route: 'ঢাকা ➔ মদিনা/জেদ্দা প্রিমিয়াম',
    extraPrice: 15000,
    tag: '+৳১৫,০০০'
  },
  {
    id: 'plane-transit',
    name: 'ট্রানজিট এয়ারলাইন্স (বাজেট সাশ্রয়ী)',
    route: 'সংক্ষিপ্ত ট্রানজিট সহ আন্তর্জাতিক',
    extraPrice: -10000,
    tag: '-৳১০,০০০ ছাড়'
  },
  {
    id: 'plane-business',
    name: 'ভিআইপি বিজনেস ক্লাস ফ্লাইট',
    route: 'লাক্সারি কেবিন ও বিজনেস লাউঞ্জ',
    extraPrice: 85000,
    tag: '+৳৮৫,০০০'
  }
];

export const HomePage: React.FC<HomePageProps> = ({
  setCurrentPage,
  onSelectService,
  onOpenInquiry,
  onOpenLogin
}) => {
  const {
    companyInfo,
    pricingConfig,
    reviews,
    addReview,
    isAdminLoggedIn,
    toggleReviewApproval,
    openReviewModal,
    deleteReview,
    requestConfirm
  } = useAdmin();
  const { siteSettings } = useSite();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewLocation, setReviewLocation] = useState('');
  const [reviewPackage, setReviewPackage] = useState('পবিত্র ওমরাহ প্যাকেজ');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  
  // Package Selection & Customization (Hotel & Plane calculation on Homepage)
  const [packageCategoryTab, setPackageCategoryTab] = useState<'all' | 'hajj' | 'umrah'>('all');
  const [packageCustomizations, setPackageCustomizations] = useState<
    Record<string, { hotelId: string; planeId: string; travelers: number }>
  >({});
  const [selectedCustomizedPackage, setSelectedCustomizedPackage] = useState<{
    pkg: PricingItem;
    hotel: { id: string; name: string; distance: string; extraPrice: number; tag: string };
    plane: { id: string; name: string; route: string; extraPrice: number; tag: string };
    travelers: number;
    perPersonPrice: number;
    totalPrice: number;
  } | null>(null);

  // Backward compatibility modal state
  const [selectedPackage, setSelectedPackage] = useState<PricingItem | null>(null);

  const getPackageCustom = (pkgId: string) => {
    return (
      packageCustomizations[pkgId] || {
        hotelId: 'room-sharing',
        planeId: 'plane-biman',
        travelers: 1
      }
    );
  };

  const updatePackageCustom = (
    pkgId: string,
    patch: Partial<{ hotelId: string; planeId: string; travelers: number }>
  ) => {
    setPackageCustomizations((prev) => ({
      ...prev,
      [pkgId]: {
        ...getPackageCustom(pkgId),
        ...patch
      }
    }));
  };

  // If public visitor, only show approved reviews. If admin, show all
  const displayReviews = isAdminLoggedIn
    ? reviews
    : reviews.filter((r) => r.isApproved);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReview({
      name: reviewName.trim(),
      location: reviewLocation.trim() || 'বগুড়া',
      packageTaken: reviewPackage,
      rating: reviewRating,
      comment: reviewComment.trim()
    });
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setReviewModalOpen(false);
      setReviewName('');
      setReviewLocation('');
      setReviewComment('');
    }, 2000);
  };

  return (
    <div className="space-y-0 bg-[#faf8f5]">
      {/* 1. Hero Section */}
      <Hero setCurrentPage={setCurrentPage} onOpenInquiry={onOpenInquiry} />

      {/* 2. Notice Board & Photo Announcements (নোটিশ বোর্ড ও ফটো বিজ্ঞপ্তি) */}
      <NoticeBoard />

      {/* 3. About Us Section with Dynamic Gallery Picture Slider */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-[#fbf9f6] to-[#f4efe8] border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Visual Slider: Showing Uploaded Website Pictures in Continuous Carousel */}
            <div className="lg:col-span-6 relative">
              <HomeImageSlider setCurrentPage={setCurrentPage} />
            </div>

            {/* Content text */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCB473]/15 border border-[#DCB473]/40 text-[#8d6928] text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#b88e44]" />
                <span>মুত্তাকী হজ্ব ও কন্সাল্টেন্সি সম্পর্কে</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-4xl font-extrabold text-[#06231a] leading-tight font-serif">
                পবিত্রতার কাফেলা ও <span className="text-[#b88e44]">বিশ্বস্ত সেবা</span>
              </h2>

              <p className="text-stone-700 leading-relaxed text-sm sm:text-base">
                মুত্তাকী হজ্ব ও কন্সাল্টেন্সির সাথে পবিত্র কাবা ও মসজিদে নববীর উদ্দেশ্যে যাত্রা করুন নিশ্চিন্তে। অভিজ্ঞ আলেম ও মোয়াল্লিমদের সার্বক্ষণিক দিকনির্দেশনায় হজ্ব, ওমরাহ, জরুরি ভিসা প্রসেসিং, কম খরচে এয়ার টিকিট এবং মক্কা-মদিনায় প্রিমিয়াম হোটেল বুকিং নিশ্চিত করাই আমাদের লক্ষ্য।
              </p>

              {/* Feature Points Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">বিজ্ঞ আলেম ও মোয়াল্লিম</h4>
                    <p className="text-[11px] text-stone-500">শরিয়াহ সম্মত প্রশিক্ষণ ও গাইডেন্স</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">হারামের সন্নিকটে হোটেল</h4>
                    <p className="text-[11px] text-stone-500">৩, ৪ ও ৫ তারকা মার্জিত আবাসন</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">নিশ্চিত বিমান টিকিট</h4>
                    <p className="text-[11px] text-stone-500">সাউদিয়া ও বাংলাদেশ বিমান</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">ঐতিহাসিক স্থান জিয়ারত</h4>
                    <p className="text-[11px] text-stone-500">মক্কা ও মদিনার বরকতময় জিয়ারা</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    setCurrentPage('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-3 bg-[#06231a] hover:bg-[#0a382a] text-[#DCB473] font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer border border-[#DCB473]/40"
                >
                  <span>আমাদের সম্পর্কে বিস্তারিত</span>
                  <ArrowRight className="w-4 h-4 text-[#DCB473]" />
                </button>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Pricing Packages Showcase (হজ ও ওমরাহ কাফেলা প্যাকেজ) */}
      <section className="py-16 sm:py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>নির্ধারিত কাফেলা প্যাকেজ ও পছন্দমতো খরচ</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06231a] font-serif">
              {siteSettings.body.packagesTitle}
            </h2>
            <p className="mt-2 text-stone-600 text-sm">
              প্যাকেজের সাথে আপনার সুবিধাজনক <strong>হোটেল ক্যাটাগরি</strong> ও <strong>বিমান টিকিট</strong> নির্বাচন করে সরাসরি মোট খরচ দেখতে পারবেন।
            </p>

            {/* Category Filter Tabs */}
            <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
              <button
                type="button"
                onClick={() => setPackageCategoryTab('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  packageCategoryTab === 'all'
                    ? 'bg-[#06231a] text-[#DCB473] shadow-md'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                সকল প্যাকেজসমূহ
              </button>
              <button
                type="button"
                onClick={() => setPackageCategoryTab('hajj')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  packageCategoryTab === 'hajj'
                    ? 'bg-[#06231a] text-[#DCB473] shadow-md'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>পবিত্র হজ্ব প্যাকেজ</span>
              </button>
              <button
                type="button"
                onClick={() => setPackageCategoryTab('umrah')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  packageCategoryTab === 'umrah'
                    ? 'bg-[#06231a] text-[#DCB473] shadow-md'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <span>পবিত্র ওমরাহ প্যাকেজ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {(pricingConfig.packages || [])
              .filter((p) => {
                if (packageCategoryTab === 'all') return true;
                if (packageCategoryTab === 'hajj') {
                  return p.title.includes('হজ্ব') || p.title.toLowerCase().includes('hajj');
                }
                return p.title.includes('ওমরাহ') || p.title.toLowerCase().includes('umrah');
              })
              .slice(0, packageCategoryTab === 'all' ? 3 : 6)
              .map((pkg, idx) => {
                const custom = getPackageCustom(pkg.id);
                const selectedHotel =
                  HOTEL_PACKAGE_OPTIONS.find((h) => h.id === custom.hotelId) || HOTEL_PACKAGE_OPTIONS[0];
                const selectedPlane =
                  PLANE_PACKAGE_OPTIONS.find((p) => p.id === custom.planeId) || PLANE_PACKAGE_OPTIONS[0];
                const basePrice = Number(pkg.price) || 0;
                const perPersonPrice = Math.max(0, basePrice + selectedHotel.extraPrice + selectedPlane.extraPrice);
                const travelers = custom.travelers || 1;
                const totalPrice = perPersonPrice * travelers;

                return (
                  <div
                    key={pkg.id}
                    className="group relative bg-[#faf8f5] hover:bg-gradient-to-b hover:from-white hover:to-[#fbf8f2] rounded-3xl p-6 sm:p-7 border-2 border-stone-200/90 hover:border-[#DCB473] transition-all duration-300 ease-out transform hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:z-20 flex flex-col justify-between"
                  >
                    {/* Popular or Featured Badge */}
                    {idx === 0 && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-extrabold rounded-full shadow-md tracking-wider uppercase border border-amber-300 flex items-center gap-1 z-10">
                        <Sparkles className="w-3 h-3 text-amber-200" />
                        <span>জনপ্রিয় কাফেলা চয়েস</span>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="px-3 py-1 rounded-full bg-[#06231a] text-[#DCB473] text-xs font-bold shadow-xs group-hover:bg-[#0f3a2c] transition-colors">
                          {pkg.durationDays ? `${pkg.durationDays} দিনের সফর` : 'কাফেলা সফর'}
                        </span>
                        <span className="text-xs text-stone-500 font-semibold bg-stone-100 px-2.5 py-0.5 rounded-full">
                          {pkg.unit || 'জনপ্রতি'}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-[#06231a] transition-colors mb-2 font-serif">
                        {pkg.title}
                      </h3>

                      {pkg.subtitle && (
                        <p className="text-xs font-bold text-[#8d6928] mb-3 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-[#b88e44] shrink-0" />
                          <span>{pkg.subtitle}</span>
                        </p>
                      )}

                      <p className="text-xs text-stone-600 leading-relaxed mb-4">
                        {pkg.description}
                      </p>

                      {/* Inclusions Highlights */}
                      <div className="space-y-1.5 py-2.5 border-t border-b border-stone-200/70 my-3 text-xs text-stone-700 bg-white/70 p-3 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>মক্কা ও মদিনায় মানসম্মত আরামদায়ক হোটেল</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Plane className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>বাংলাদেশ বিমান / সাউদিয়া নিশ্চিত এয়ার টিকিট</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>তিন বেলা মানসম্মত পুষ্টিকর খাবার ও ক্যাটারিং</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>বায়োমেট্রিক ভিসা ও স্বাস্থ্য ট্রাভেল ইনস্যুরেন্স</span>
                        </div>
                      </div>

                      {/* Hotel & Plane Selection Box (কাস্টমাইজেশন ও লাইভ খরচ নির্বাচন) */}
                      <div className="my-3.5 p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-[#06231a] flex items-center gap-1 text-[11px]">
                            <Sparkles className="w-3 h-3 text-amber-600" />
                            <span>হোটেল ও বিমান নির্বাচন করুন:</span>
                          </span>
                          <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-full">
                            লাইভ খরচ গণনা
                          </span>
                        </div>

                        {/* Hotel Selection */}
                        <div className="mb-2.5">
                          <label className="text-[10px] font-bold text-stone-600 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-emerald-700" />
                              <span>হোটেল রুম:</span>
                            </span>
                            <span className="text-[10px] text-emerald-800 font-medium">{selectedHotel.distance}</span>
                          </label>
                          <select
                            value={custom.hotelId}
                            onChange={(e) => updatePackageCustom(pkg.id, { hotelId: e.target.value })}
                            className="w-full text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 transition-colors cursor-pointer"
                          >
                            {HOTEL_PACKAGE_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} ({opt.tag})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Plane Selection */}
                        <div className="mb-2.5">
                          <label className="text-[10px] font-bold text-stone-600 mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Plane className="w-3 h-3 text-blue-700" />
                              <span>বিমান ও ফ্লাইট:</span>
                            </span>
                            <span className="text-[10px] text-blue-800 font-medium">{selectedPlane.route}</span>
                          </label>
                          <select
                            value={custom.planeId}
                            onChange={(e) => updatePackageCustom(pkg.id, { planeId: e.target.value })}
                            className="w-full text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-colors cursor-pointer"
                          >
                            {PLANE_PACKAGE_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} ({opt.tag})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Travelers Counter */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-bold text-stone-600 flex items-center gap-1">
                            <Users className="w-3 h-3 text-purple-700" />
                            <span>যাত্রী সংখ্যা:</span>
                          </span>
                          <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => updatePackageCustom(pkg.id, { travelers: Math.max(1, travelers - 1) })}
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="যাত্রী কমান"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-[#06231a] px-2 min-w-8 text-center">
                              {travelers} জন
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePackageCustom(pkg.id, { travelers: Math.min(25, travelers + 1) })}
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="যাত্রী বাড়ান"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      {/* Live Calculated Price Box */}
                      <div className="mb-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-3.5 rounded-2xl border border-emerald-200 flex flex-col justify-between shadow-2xs">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-[11px] text-stone-600 font-semibold block">
                              আপনার নির্বাচনে সর্বমোট খরচ:
                            </span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                              <span className="text-2xl font-black text-[#06231a] font-mono">
                                ৳{totalPrice.toLocaleString('bn-BD')}
                              </span>
                              {travelers > 1 && (
                                <span className="text-[11px] font-bold text-emerald-800">
                                  (মোট {travelers} জনের)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-500 font-medium block mt-0.5">
                              জনপ্রতি: ৳{perPersonPrice.toLocaleString('bn-BD')}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-800 font-bold bg-white px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                            {travelers} জন হাজী
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: Details Button & Apply Button */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomizedPackage({
                              pkg,
                              hotel: selectedHotel,
                              plane: selectedPlane,
                              travelers,
                              perPersonPrice,
                              totalPrice
                            });
                          }}
                          className="py-2.5 px-3 bg-white hover:bg-stone-100 text-[#06231a] border border-stone-300 hover:border-[#DCB473] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#b88e44]" />
                          <span>বিস্তারিত দেখুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onOpenInquiry('haji-full-registration');
                          }}
                          className="py-2.5 px-3 bg-gradient-to-r from-[#06231a] to-[#0a382a] hover:from-[#0a382a] hover:to-[#0f4634] text-[#DCB473] font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm group-hover:shadow"
                        >
                          <span>আবেদন করুন</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#DCB473]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => {
                setCurrentPage('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-800 hover:text-[#06231a] border border-stone-300 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-xs hover:shadow cursor-pointer"
            >
              <span>সকল হজ্ব, ওমরাহ, হোটেল ও বিমান প্যাকেজ দেখুন</span>
              <ArrowRight className="w-4 h-4 text-[#b88e44]" />
            </button>
          </div>
        </div>
      </section>

      {/* Haji/Umrah registration choices and form, placed below the homepage packages */}
      <div id="haji-registration-section" className="scroll-mt-16">
        <HajiPrimaryRegistration onOpenLogin={() => onOpenLogin && onOpenLogin()} />
      </div>

      {/* Middle Sponsored Ad (if configured for middle or home) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <AdRenderer page="home" position="middle" />
      </div>

      {/* 4. Islamic Pillars Section */}
      <IslamicPillars />



      {/* 6. Prayer Times Schedule */}
      <PrayerTimes />

      {/* 7. Approved Pilgrim Testimonials / Reviews Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-stone-50 to-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
            <div>
              <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
                গ্রাহকদের সন্তুষ্টি
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06231a] font-serif">
                হাজীদের অভিজ্ঞতা ও <span className="text-[#b88e44]">মতামত</span>
              </h2>
              <p className="mt-2 text-stone-600 text-sm">
                মুত্তাকী কাফেলার সাথে সফর সম্পন্ন করা সম্মানিত হাজীদের মূল্যবান অনুভূতি।
              </p>
            </div>

            <button
              onClick={() => setReviewModalOpen(true)}
              className="px-5 py-2.5 bg-[#06231a] text-[#DCB473] hover:bg-[#0d382b] font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer shrink-0 border border-[#DCB473]/30"
            >
              <Plus className="w-4 h-4" />
              <span>আপনার অভিজ্ঞতা জানান</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-500 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-stone-400 font-mono">{rev.date}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic mb-4">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">{rev.name}</h4>
                    <p className="text-xs text-stone-500">
                      {rev.location} {rev.packageTaken ? `• ${rev.packageTaken}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Call to Action (CTA) Banner */}
      <section className="py-14 bg-gradient-to-r from-[#051c15] via-[#092c21] to-[#062018] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#DCB473]/15 border border-[#DCB473]/40 text-[#DCB473] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>পবিত্র সফর ২০২৬-২০২৭ প্রাক-নিবন্ধন</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold font-serif">
            {siteSettings.body.ctaTitle}
          </h2>

          <p className="max-w-2xl mx-auto text-emerald-100/90 text-sm sm:text-base leading-relaxed">
            {siteSettings.body.ctaText}
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a
              href={`tel:${companyInfo.phone1}`}
              className="px-8 py-3.5 bg-gradient-to-r from-[#e5c165] via-[#DCB473] to-[#c59846] text-[#051c15] font-extrabold rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Phone className="w-5 h-5 text-[#051c15]" />
              <span>{companyInfo.phone1Display || companyInfo.phone1}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Review Submission Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-[#DCB473]/30">
            {reviewSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-stone-900 mb-1">ধন্যবাদ!</h3>
                <p className="text-xs text-stone-600">
                  আপনার মতামত সফলভাবে জমা হয়েছে। এডমিন অনুমোদনের পর তা ওয়েবসাইটে প্রদর্শিত হবে।
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-base text-[#06231a]">আপনার মূল্যবান মতামত দিন</h3>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">আপনার নাম *</label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="উদাঃ মোঃ আব্দুল করিম"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">এলাকা / জেলা</label>
                    <input
                      type="text"
                      value={reviewLocation}
                      onChange={(e) => setReviewLocation(e.target.value)}
                      placeholder="উদাঃ দুপচাঁচিয়া, বগুড়া"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">রেটিং</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                    >
                      <option value={5}>★★★★★ (৫ স্টার)</option>
                      <option value={4}>★★★★☆ (৪ স্টার)</option>
                      <option value={3}>★★★☆☆ (৩ স্টার)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">গৃহীত সেবা / প্যাকেজ</label>
                  <input
                    type="text"
                    value={reviewPackage}
                    onChange={(e) => setReviewPackage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">আপনার অভিজ্ঞতা লিখুন *</label>
                  <textarea
                    rows={3}
                    required
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="মুত্তাকী কাফেলার সাথে আপনার অভিজ্ঞতা কেমন ছিল..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-3 py-1.5 border rounded-lg text-xs cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#06231a] text-[#DCB473] font-bold rounded-lg text-xs cursor-pointer"
                  >
                    মতামত জমা দিন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Interactive Package Details Modal (বিস্তারিত বিবরণ ও নির্বাচিত খরচ মডাল) */}
      {(selectedCustomizedPackage || selectedPackage) && (
        (() => {
          const activePkg = selectedCustomizedPackage
            ? selectedCustomizedPackage.pkg
            : selectedPackage!;
          const hotel = selectedCustomizedPackage
            ? selectedCustomizedPackage.hotel
            : HOTEL_PACKAGE_OPTIONS[0];
          const plane = selectedCustomizedPackage
            ? selectedCustomizedPackage.plane
            : PLANE_PACKAGE_OPTIONS[0];
          const travelers = selectedCustomizedPackage
            ? selectedCustomizedPackage.travelers
            : 1;
          const perPersonPrice = selectedCustomizedPackage
            ? selectedCustomizedPackage.perPersonPrice
            : Number(activePkg.price) || 0;
          const totalPrice = selectedCustomizedPackage
            ? selectedCustomizedPackage.totalPrice
            : perPersonPrice * travelers;

          const closeModal = () => {
            setSelectedCustomizedPackage(null);
            setSelectedPackage(null);
          };

          return (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
              onClick={closeModal}
            >
              <div
                className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-[#DCB473]/50 max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200 text-stone-800"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute top-5 right-5 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                  title="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Header / Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3.5 py-1 rounded-full bg-[#06231a] text-[#DCB473] text-xs font-bold shadow-xs">
                    {activePkg.durationDays ? `${activePkg.durationDays} দিনের সফর` : 'কাফেলা সফর'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                    মুত্তাকী প্রিমিয়াম কাফেলা
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                    {activePkg.unit || 'জনপ্রতি'}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#06231a] font-serif mb-2">
                  {activePkg.title}
                </h3>

                {activePkg.subtitle && (
                  <p className="text-sm font-bold text-[#8d6928] mb-4 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#b88e44]" />
                    <span>{activePkg.subtitle}</span>
                  </p>
                )}

                <p className="text-sm text-stone-600 leading-relaxed mb-5">
                  {activePkg.description}
                </p>

                {/* Selected Hotel & Flight Customization Box */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 mb-5 space-y-2.5">
                  <span className="text-xs font-bold text-[#06231a] uppercase tracking-wider block flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>আপনার নির্বাচিত আবাসন ও বিমান বিবরণ:</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                      <div className="flex items-center gap-2 font-bold text-stone-900 mb-0.5">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>হোটেল ক্যাটাগরি:</span>
                      </div>
                      <p className="text-emerald-800 font-semibold">{hotel.name}</p>
                      <span className="text-[11px] text-stone-500">দূরত্ব: {hotel.distance}</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                      <div className="flex items-center gap-2 font-bold text-stone-900 mb-0.5">
                        <Plane className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>বিমান ও এয়ারলাইন্স:</span>
                      </div>
                      <p className="text-blue-800 font-semibold">{plane.name}</p>
                      <span className="text-[11px] text-stone-500">রুট: {plane.route}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs text-stone-700">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-700" />
                      <span>যাত্রী সংখ্যা: <strong>{travelers} জন</strong></span>
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      জনপ্রতি হিসেব: ৳{perPersonPrice.toLocaleString('bn-BD')}
                    </span>
                  </div>
                </div>

                {/* Pricing Summary Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#06231a] to-[#0f3a2c] text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 shadow-md border border-[#DCB473]/40">
                  <div>
                    <span className="text-xs text-[#DCB473] uppercase tracking-wider font-semibold block">
                      পছন্দ অনুযায়ী মোট প্রাক্কলিত চুক্তি মূল্য
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                        ৳{totalPrice.toLocaleString('bn-BD')}
                      </span>
                      {travelers > 1 ? (
                        <span className="text-xs text-stone-300">
                          (মোট {travelers} জনের খরচ)
                        </span>
                      ) : (
                        <span className="text-xs text-stone-300">
                          / {activePkg.unit || 'জনপ্রতি'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-[11px] text-stone-300 border-t sm:border-t-0 sm:border-l border-white/20 pt-2 sm:pt-0 sm:pl-4">
                    <span className="text-emerald-300 font-bold block">✓ কোনো গোপন চার্জ নেই</span>
                    <span>হোটেল, ফ্লাইট ও ক্যাটারিং অন্তর্ভুক্ত</span>
                  </div>
                </div>

                {/* Comprehensive Inclusions Checklist */}
                <div className="space-y-3 mb-6">
                  <h4 className="font-extrabold text-sm text-[#06231a] uppercase tracking-wider flex items-center gap-2 border-b border-stone-200 pb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>প্যাকেজে অন্তর্ভুক্ত সুবিধাসমূহ (Inclusions)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-stone-900">মানসম্মত আবাসন ও হোটেল</strong>
                        <span>মক্কায় হারাম শরীফের কাছে এবং মদিনায় মসজিদে নববীর সন্নিকটে আরামদায়ক হোটেল।</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <Plane className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-stone-900">নিশ্চিত বিমান টিকিট</strong>
                        <span>বাংলাদেশ বিমান অথবা সাউদিয়া এয়ারলাইন্সের কনফার্মড রিটার্ন এয়ার টিকিট।</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <Utensils className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-stone-900">৩ বেলা দেশীয় পুষ্টিকর খাবার</strong>
                        <span>সকাল, দুপুর ও রাতে অভিজ্ঞ বাবুর্চি দ্বারা প্রস্তুতকৃত মানসম্মত বুফে বা ক্যাটারিং।</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-stone-900">ভিসা ও ট্রাভেল ইনস্যুরেন্স</strong>
                        <span>সৌদি সরকারের অনুমোদিত বায়োমেট্রিক ওমরাহ/হজ ভিসা ও পূর্ণ স্বাস্থ্য বীমা।</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <Compass className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-stone-900">ঐতিহাসিক পবিত্র স্থান জিয়ারত</strong>
                        <span>মক্কা ও মদিনার পুণ্যময় স্থানসমূহ (জাবালে নূর, সাওর, মিনা, বদর) গাইডসহ দর্শন।</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                      <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-stone-900">বিজ্ঞ আলেম ও মোয়াল্লিম গাইড</strong>
                        <span>শরিয়াহ সম্মত তাওয়াফ, সায়ী ও হজের সকল রুকন সম্পাদনে সার্বক্ষণিক দিকনির্দেশনা।</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      closeModal();
                      onOpenInquiry('haji-full-registration');
                    }}
                    className="flex-1 py-3 px-5 bg-gradient-to-r from-[#06231a] to-[#0a382a] hover:from-[#0a382a] hover:to-[#0f4634] text-[#DCB473] font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <span>এই প্যাকেজে আবেদন ও প্রাক-নিবন্ধন</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <a
                    href={
                      companyInfo.whatsapp ||
                      `https://wa.me/${(companyInfo.phone1 || '01768232501').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `আসসালামু আলাইকুম, আমি মুত্তাকী কাফেলার "${activePkg.title}" এর জন্য [হোটেল: ${hotel.name}], [বিমান: ${plane.name}], [যাত্রী: ${travelers} জন] পছন্দ করেছি। আনুমানিক মোট খরচ ৳${totalPrice.toLocaleString('bn-BD')}। আমি এই প্যাকেজে বিস্তারিত ও বুকিং করতে আগ্রহী।`
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>হোয়াটসঅ্যাপে বুকিং বার্তা</span>
                  </a>

                  <a
                    href={`tel:${(companyInfo.phone1 || '01768232501').replace(/[^0-9+]/g, '')}`}
                    className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-emerald-700" />
                    <span>কল করুন</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
