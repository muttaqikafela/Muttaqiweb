import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { PageId, GalleryItem } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  CheckCircle2,
  Images,
  Compass
} from 'lucide-react';

interface HomeImageSliderProps {
  setCurrentPage?: (page: PageId) => void;
}

const FALLBACK_SLIDES: GalleryItem[] = [
  {
    id: 'f1',
    title: 'পবিত্র কাবা শরীফ - তাওয়াফ ও রূহানিয়াত',
    category: 'holysites',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&auto=format&fit=crop&q=85',
    description: 'মসজিদুল হারামে কাবা শরীফ প্রদক্ষিণ ও মহান আল্লাহর দরবারে আকুল দোয়া ও প্রার্থনা।'
  },
  {
    id: 'f2',
    title: 'মসজিদে নববী - শান্তির আলয় মদিনা মুনাওয়ারা',
    category: 'holysites',
    image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&auto=format&fit=crop&q=85',
    description: 'রাসুলে পাক (সা.)-এর পবিত্র রওজা মোবারক ও শান্তির সবুজ গম্বুজ প্রাঙ্গণ।'
  },
  {
    id: 'f3',
    title: 'মুত্তাকী কাফেলার হাজীদের সমবেত দোয়া ও মোনাজাত',
    category: 'hajj',
    image: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?w=1200&auto=format&fit=crop&q=85',
    description: 'আরাফাতের ময়দানে ও মিনা প্রাঙ্গণে কাফেলার হাজীদের সুশৃঙ্খল কাফেলা দল।'
  },
  {
    id: 'f4',
    title: 'ওমরাহ কাফেলা ও পবিত্র মদিনা জিয়ারত',
    category: 'umrah',
    image: 'https://images.unsplash.com/photo-1580418827493-f2b22c0a76cb?w=1200&auto=format&fit=crop&q=85',
    description: 'মদিনা শরীফের ঐতিহাসিক উহুদ পাহাড়, মসজিদে কুবা ও খন্দক প্রান্তর জিয়ারত।'
  }
];

export const HomeImageSlider: React.FC<HomeImageSliderProps> = ({ setCurrentPage }) => {
  const { galleryItems, companyInfo } = useAdmin();

  // Filter approved gallery items uploaded to the website
  const approvedItems = galleryItems.filter((g) => g.isApproved !== false);
  const slides: GalleryItem[] = approvedItems.length > 0 ? approvedItems : FALLBACK_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play slide timer
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, slides.length]);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div
      className="relative group w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Slider Container with Golden Islamic Frame */}
      <div className="relative h-88 sm:h-104 md:h-[430px] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#DCB473]/30 bg-slate-950">
        {/* Background Image with Smooth Cross-fade */}
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
            style={{ transition: 'opacity 0.7s ease-in-out, transform 4.5s ease-out' }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Rich cinematic gradient overlay for high contrast text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-900/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-slate-950/30" />
          </div>
        ))}

        {/* Top Badges Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-[#DCB473]/40 text-[#DCB473] text-xs font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span>মুত্তাকী কাফেলা গ্যালারি অ্যালবাম</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-xs font-mono font-semibold border border-white/20">
              {currentIndex + 1} / {slides.length}
            </span>

            {setCurrentPage && (
              <button
                onClick={() => {
                  setCurrentPage('gallery');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-1.5 rounded-full bg-slate-900/80 hover:bg-[#DCB473] text-white hover:text-slate-950 border border-white/20 transition-colors pointer-events-auto cursor-pointer shadow-md"
                title="সম্পূর্ণ গ্যালারি দেখুন"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-[#DCB473] text-white hover:text-slate-950 border border-white/20 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-sm opacity-80 group-hover:opacity-100"
              aria-label="পূর্ববর্তী ছবি"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-[#DCB473] text-white hover:text-slate-950 border border-white/20 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl backdrop-blur-sm opacity-80 group-hover:opacity-100"
              aria-label="পরবর্তী ছবি"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Bottom Content Caption Overlay */}
        <div className="absolute bottom-6 left-5 right-5 sm:right-28 z-20 text-white space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#DCB473] tracking-wide">
            <Compass className="w-3.5 h-3.5" />
            <span>পবিত্র সফর ও ঐতিহাসিক দৃশ্য</span>
          </div>

          <h3 className="text-lg sm:text-2xl font-bold font-serif text-white leading-snug drop-shadow-md">
            {currentSlide.title}
          </h3>

          {currentSlide.description && (
            <p className="text-xs sm:text-sm text-stone-200/95 line-clamp-2 max-w-xl leading-relaxed drop-shadow-sm">
              {currentSlide.description}
            </p>
          )}

          {/* Dots Indicator & Auto-play bar */}
          <div className="pt-3 flex items-center gap-2">
            {slides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setCurrentIndex(dotIdx)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  dotIdx === currentIndex
                    ? 'w-7 h-2 bg-[#DCB473] shadow-sm'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Trust Badge - Positioned cleanly on bottom-right */}
      <div className="absolute -bottom-6 -right-3 sm:-right-6 z-30 hidden sm:flex items-center gap-3.5 bg-gradient-to-r from-[#06231a] to-[#0a3427] text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border-2 border-[#DCB473]/50">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#DCB473] to-[#b88e44] text-[#06231a] flex items-center justify-center font-extrabold text-lg shadow-inner">
          ✓
        </div>
        <div>
          <span className="block text-[11px] font-semibold text-[#DCB473] uppercase tracking-wider">
            সরকারি নিয়মানুযায়ী
          </span>
          <span className="text-sm font-bold text-white drop-shadow-xs">বিশ্বস্ত কাফেলা</span>
        </div>
      </div>
    </div>
  );
};
