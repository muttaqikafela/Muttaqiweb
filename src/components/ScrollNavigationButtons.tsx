import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const ScrollNavigationButtons: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Always visible if scrolled past 30px
      const hasScrolled = scrollY > 30;
      setIsVisible(hasScrolled);
      setCanScrollUp(scrollY > 40);
      setCanScrollDown(scrollY + windowHeight < docHeight - 40);

      // Keep active when scrolling starts
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleScrollUp = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleScrollDown = () => {
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const targetScroll = Math.min(docHeight, window.scrollY + windowHeight * 0.85);

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  return (
    <div
      aria-label="পৃষ্ঠায় উপরে ও নিচে স্ক্রোল করুন"
      className={`fixed right-4 sm:right-6 bottom-6 sm:bottom-8 z-[60] flex flex-col items-center gap-2 transition-all duration-300 ease-out pointer-events-auto ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-8 opacity-0 pointer-events-none scale-90'
      }`}
    >
      {/* Scroll Up Button (ট্রান্সপারেন্ট হোভার আপ বাটন) */}
      <button
        type="button"
        onClick={handleScrollUp}
        title="পৃষ্ঠার একদম উপরে যান (Scroll to Top)"
        className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full backdrop-blur-md transition-all duration-200 flex items-center justify-center hover:-translate-y-0.5 active:scale-90 cursor-pointer shadow-xl hover:shadow-2xl ${
          canScrollUp
            ? 'bg-[#0f2922]/60 hover:bg-[#DCB473] text-white hover:text-[#0f2922] border border-white/30 hover:border-[#DCB473]'
            : 'bg-[#0f2922]/40 hover:bg-[#DCB473] text-white/80 hover:text-[#0f2922] border border-white/20 hover:border-[#DCB473]'
        }`}
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-y-0.5 stroke-[2.5]" />
        <span className="sr-only">উপরে যান</span>

        {/* Tooltip */}
        <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-[#0f2922]/90 backdrop-blur-md text-[#DCB473] text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md border border-[#DCB473]/30 hidden sm:block">
          উপরে যান
        </span>
      </button>

      {/* Scroll Down Button (ট্রান্সপারেন্ট হোভার ডাউন বাটন) */}
      <button
        type="button"
        onClick={handleScrollDown}
        title="পৃষ্ঠার নিচে স্ক্রোল করুন (Scroll Down)"
        className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full backdrop-blur-md transition-all duration-200 flex items-center justify-center hover:translate-y-0.5 active:scale-90 cursor-pointer shadow-xl hover:shadow-2xl ${
          canScrollDown
            ? 'bg-[#0f2922]/60 hover:bg-[#DCB473] text-white hover:text-[#0f2922] border border-white/30 hover:border-[#DCB473]'
            : 'bg-[#0f2922]/40 hover:bg-[#DCB473] text-white/80 hover:text-[#0f2922] border border-white/20 hover:border-[#DCB473]'
        }`}
      >
        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-y-0.5 stroke-[2.5]" />
        <span className="sr-only">নিচে যান</span>

        {/* Tooltip */}
        <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-[#0f2922]/90 backdrop-blur-md text-[#DCB473] text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md border border-[#DCB473]/30 hidden sm:block">
          নিচে যান
        </span>
      </button>
    </div>
  );
};
