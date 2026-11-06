import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../context/AdminContext';
import { PageId, GalleryItem } from '../types';
import { SocialShareButtons, getSharePageUrl } from './SocialShareButtons';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
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
    title: 'আরাফাতের ময়দান - সমবেত দোয়া ও মোনাজাত',
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
  },
  {
    id: 'f5',
    title: 'মসজিদুল হারাম - কাবা চত্বরে রাতের আলোকচ্ছ্বটা',
    category: 'holysites',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=85',
    description: 'রাতের প্রহরে হারামে মক্কার অভূতপূর্ব দৃশ্য ও লাখো ধর্মপ্রাণ মানুষের তাওয়াফ।'
  },
  {
    id: 'f6',
    title: 'মদিনা শরীফ - মসজিদে কুবা প্রাঙ্গণ',
    category: 'holysites',
    image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1200&auto=format&fit=crop&q=85',
    description: 'ইসলামের ইতিহাসের প্রথম মসজিদ - যেখানে দুই রাকাত নামাজ এক ওমরাহর সমতুল্য।'
  },
  {
    id: 'f7',
    title: 'ঐতিহাসিক জাবালে নূর ও হেরা গুহা',
    category: 'holysites',
    image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=85',
    description: 'যেখানে নাযিল হয়েছিল মহাগ্রন্থ আল-কোরআনের প্রথম বাণী - পবিত্র মক্কা মুকাররমা।'
  },
  {
    id: 'f8',
    title: 'মুত্তাকী কাফেলা - সুশৃঙ্খল হাজী ব্যবস্থাপনা',
    category: 'hajj',
    image: 'https://images.unsplash.com/photo-1548625361-16a9d0d38e21?w=1200&auto=format&fit=crop&q=85',
    description: 'দক্ষ গাইড ও অভিজ্ঞ আলেমদের তত্ত্বাবধানে প্রতিটি পদক্ষেপে পূর্ণ যত্ন ও দিকনির্দেশনা।'
  }
];

const getItemsPerView = () => {
  if (typeof window === 'undefined') return 1;
  // 5 slides on desktop screens
  if (window.innerWidth >= 1280) return 5;
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 768) return 3;
  if (window.innerWidth >= 640) return 2;
  return 1;
};

const getImageIdentity = (image: string) => {
  const source = image.trim();
  try {
    const url = new URL(source, 'https://muttaqi.com.bd');
    ['w', 'width', 'h', 'height', 'q', 'quality', 'fit', 'auto', 'format', 'fm'].forEach((key) =>
      url.searchParams.delete(key)
    );
    url.searchParams.sort();
    return url.href;
  } catch {
    return source;
  }
};

export const HomeImageSlider: React.FC<HomeImageSliderProps> = ({ setCurrentPage }) => {
  const { galleryItems, showToast } = useAdmin();

  // Filter approved gallery items uploaded to the website
  const seenImages = new Set<string>();
  const approvedItems = galleryItems.filter((item) => {
    if (item.isApproved === false || !(item.image || '').trim()) return false;
    const imageIdentity = getImageIdentity(item.image);
    if (seenImages.has(imageIdentity)) return false;
    seenImages.add(imageIdentity);
    return true;
  });
  const slides: GalleryItem[] = approvedItems.length > 0 ? approvedItems : FALLBACK_SLIDES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleResize = () => setItemsPerView(getItemsPerView());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentIndex((index) => (slides.length ? index % slides.length : 0));
  }, [slides.length]);

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

  const visibleSlidesCount = Math.min(itemsPerView, slides.length);
  const visibleSlides = Array.from(
    { length: visibleSlidesCount },
    (_, offset) => slides[(currentIndex + offset) % slides.length]
  );

  const handleGoToHome = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.share-btn-group')) {
      return;
    }
    if (setCurrentPage) {
      setCurrentPage('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="relative group w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Slider Container with Soft White Background & Golden Islamic Frame */}
      <div className="relative h-[380px] sm:h-[400px] md:h-[430px] rounded-3xl overflow-hidden shadow-xl border-2 sm:border-3 border-[#DCB473]/50 bg-gradient-to-br from-white via-[#FCFBF9] to-[#F5EFE6]">

        {/* Top Badges Bar */}
        <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#DCB473]/50 text-[#8d6928] text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#b88e44]" />
            <span>মুত্তাকী কাফেলা গ্যালারি অ্যালবাম (৫টি ছবি স্লাইডার)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-stone-700 text-xs font-mono font-bold border border-stone-200 shadow-xs">
              {currentIndex + 1} / {slides.length}
            </span>

            {setCurrentPage && (
              <button
                onClick={() => {
                  setCurrentPage('gallery');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-1.5 rounded-full bg-white/95 hover:bg-[#DCB473] text-stone-700 hover:text-white border border-stone-200 transition-colors pointer-events-auto cursor-pointer shadow-xs"
                title="সম্পূর্ণ গ্যালারি দেখুন"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5-Slide Display Grid Container */}
        <div
          className={`absolute inset-x-3 sm:inset-x-4 top-15 bottom-14 z-10 grid gap-2.5 sm:gap-3 ${
            visibleSlidesCount >= 5
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : visibleSlidesCount === 4
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : visibleSlidesCount === 3
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              : visibleSlidesCount === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {visibleSlides.map((slide, idx) => (
            <article
              key={`${slide.id}-${currentIndex}-${idx}`}
              onClick={handleGoToHome}
              title="ওয়েবসাইটের হোমপেজ ভিজিট করতে ক্লিক করুন"
              className="relative min-w-0 h-full overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col group/card cursor-pointer"
            >
              {/* Photo */}
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />

              {/* Single Social Share Button */}
              <div
                className="absolute right-2 top-2 z-30"
                onClick={(e) => e.stopPropagation()}
              >
                <SocialShareButtons
                  compact
                  content={{
                    title: slide.title,
                    text: slide.description,
                    url: getSharePageUrl('home-gallery'),
                    imageUrl: slide.image
                  }}
                  onMessage={showToast}
                />
              </div>

              {/* Soft overlay on the image for high-contrast legible text */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent pointer-events-none" />

              {/* Bottom Caption Overlay */}
              <div className="absolute inset-x-2.5 bottom-2.5 text-white pointer-events-none">
                <div className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#DCB473]">
                  <Compass className="h-3 w-3 shrink-0" />
                  <span className="truncate">পবিত্র সফর ও ঐতিহাসিক দৃশ্য</span>
                </div>
                <h3 className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug drop-shadow-sm text-white">
                  {slide.title}
                </h3>
                {slide.description && (
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-stone-200/90 leading-tight">
                    {slide.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Carousel navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1.5 sm:left-2.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-300/90 bg-white/95 text-stone-800 shadow-md backdrop-blur-sm transition-all hover:bg-[#DCB473] hover:text-stone-950 sm:h-10 sm:w-10 cursor-pointer"
              aria-label="পূর্ববর্তী ছবি"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1.5 sm:right-2.5 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-stone-300/90 bg-white/95 text-stone-800 shadow-md backdrop-blur-sm transition-all hover:bg-[#DCB473] hover:text-stone-950 sm:h-10 sm:w-10 cursor-pointer"
              aria-label="পরবর্তী ছবি"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Slide indicators */}
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/90 border border-stone-200/90 px-3 py-1.5 backdrop-blur-sm shadow-xs">
          {slides.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => setCurrentIndex(dotIdx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                dotIdx === currentIndex ? 'w-6 bg-[#DCB473]' : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
              aria-label={`ছবি ${dotIdx + 1} দেখুন`}
            />
          ))}
        </div>
      </div>

      {/* Floating Trust Badge - Positioned cleanly on bottom-right with soft white styling */}
      <div className="absolute -bottom-5 -right-2 sm:-right-4 z-30 hidden sm:flex items-center gap-3 bg-white/95 text-stone-900 p-3 sm:p-3.5 rounded-2xl shadow-xl border-2 border-[#DCB473]/60 backdrop-blur-md">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DCB473] to-[#b88e44] text-[#06231a] flex items-center justify-center font-extrabold text-lg shadow-inner">
          ✓
        </div>
        <div>
          <span className="block text-[10px] font-bold text-[#8d6928] uppercase tracking-wider">
            সরকারি নিয়মানুযায়ী
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-stone-900">বিশ্বস্ত কাফেলা</span>
        </div>
      </div>
    </div>
  );
};
