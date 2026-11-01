import React, { useState } from 'react';
import { PageId, ServiceItem } from '../types';
import { useAdmin } from '../context/AdminContext';
import { useSite } from '../context/SiteContext';
import { Hero } from '../components/Hero';
import { NoticeBoard } from '../components/NoticeBoard';
import { HajiPrimaryRegistration } from '../components/HajiPrimaryRegistration';
import { HomeImageSlider } from '../components/HomeImageSlider';
import { IslamicPillars } from '../components/IslamicPillars';
import { PrayerTimes } from '../components/PrayerTimes';
import { ServicesGrid } from '../components/ServicesGrid';
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
  ChevronRight
} from 'lucide-react';

interface HomePageProps {
  setCurrentPage: (page: PageId) => void;
  onSelectService: (service: ServiceItem) => void;
  onOpenInquiry: (serviceId?: string) => void;
  onOpenLogin?: () => void;
}

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

      {/* 3. Haji Primary Registration Section (হাজী প্রাথমিক রেজিস্ট্রেশন) */}
      <div id="haji-registration-section" className="scroll-mt-16">
        <HajiPrimaryRegistration onOpenLogin={() => onOpenLogin && onOpenLogin()} />
      </div>

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
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>নির্ধারিত কাফেলা প্যাকেজ ও খরচ</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06231a] font-serif">
              {siteSettings.body.packagesTitle}
            </h2>
            <p className="mt-2 text-stone-600 text-sm">
              {siteSettings.body.packagesText}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingConfig.packages.slice(0, 3).map((pkg, idx) => (
              <div
                key={pkg.id}
                className="bg-[#faf8f5] rounded-3xl p-6 border-2 border-stone-200/90 hover:border-[#DCB473] transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-3 py-1 rounded-full bg-[#06231a] text-[#DCB473] text-xs font-bold">
                      {pkg.durationDays ? `${pkg.durationDays} দিনের সফর` : 'কাফেলা সফর'}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">{pkg.unit || 'জনপ্রতি'}</span>
                  </div>

                  <h3 className="text-xl font-bold text-stone-900 group-hover:text-[#06231a] transition-colors mb-2 font-serif">
                    {pkg.title}
                  </h3>

                  {pkg.subtitle && (
                    <p className="text-xs font-semibold text-[#8d6928] mb-3">{pkg.subtitle}</p>
                  )}

                  <p className="text-xs text-stone-600 leading-relaxed mb-6">
                    {pkg.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-200/80">
                  <div className="mb-4">
                    <span className="text-xs text-stone-500 block mb-0.5">প্যাকেজ মূল্য:</span>
                    <span className="text-2xl font-extrabold text-[#06231a] font-mono">
                      ৳{Number(pkg.price).toLocaleString('bn-BD')}
                    </span>
                    <span className="text-xs text-stone-500 ml-1">/ {pkg.unit || 'জনপ্রতি'}</span>
                  </div>

                  <button
                    onClick={() => onOpenInquiry('haji-full-registration')}
                    className="w-full py-2.5 bg-gradient-to-r from-[#06231a] to-[#0a382a] hover:from-[#0a382a] hover:to-[#0f4634] text-[#DCB473] font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group-hover:shadow"
                  >
                    <span>এই প্যাকেজে আবেদন করুন</span>
                    <ChevronRight className="w-4 h-4 text-[#DCB473]" />
                  </button>
                </div>
              </div>
            ))}
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

      {/* 4. Islamic Pillars Section */}
      <IslamicPillars />

      {/* 5. Services Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#b88e44] uppercase tracking-wider block mb-1">
              ইনশাআল্লাহ আমাদের সাথে নিরাপদ যাত্রা করুন
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#06231a] font-serif">
              মুত্তাকী হজ্ব ও কন্সাল্টেন্সির <span className="text-[#b88e44]">সেবাসমূহ</span>
            </h2>
            <p className="mt-2 text-stone-600 text-sm">
              হজ্ব, ওমরাহ, এয়ার টিকিট, ভিসা প্রসেসিং ও যাবতীয় বৈদেশিক ভ্রমণ সম্পর্কিত নির্ভরযোগ্য সমাধান।
            </p>
          </div>

          <ServicesGrid
            onSelectService={onSelectService}
            onInquire={onOpenInquiry}
          />

          <div className="mt-12 text-center">
            <button
              onClick={() => {
                setCurrentPage('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#06231a] hover:bg-[#0a382a] text-[#DCB473] font-bold rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer border border-[#DCB473]/30"
            >
              <span>সকল সেবার বিস্তারিত ও প্যাকেজ দেখুন</span>
              <ArrowRight className="w-4 h-4 text-[#DCB473]" />
            </button>
          </div>
        </div>
      </section>

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
    </div>
  );
};
