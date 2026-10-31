import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const ScrollNavigationButtons: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show buttons when scrolled at least 60px down
      const shouldShow = scrollY > 60;
      setIsVisible(shouldShow);
      setCanScrollUp(scrollY > 80);
      setCanScrollDown(scrollY + windowHeight < documentHeight - 80);

      // Keep buttons visible briefly during and after scroll
      clearTimeout(scrollTimeout);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleScrollUp = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleScrollDown = () => {
    // Scroll down by 80% of window height or to next section
    const currentScroll = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    const targetScroll = Math.min(
      documentHeight,
      currentScroll + windowHeight * 0.85
    );

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <div
      aria-label="পৃষ্ঠায় উপরে ও নিচে স্ক্রোল করুন"
      className="fixed right-4 sm:right-6 bottom-6 sm:bottom-8 z-40 flex flex-col items-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 pointer-events-auto"
    >
      {/* Scroll Up Button (ট্রান্সপারেন্ট হোভার আপ বাটন) */}
      {canScrollUp && (
        <button
          type="button"
          onClick={handleScrollUp}
          title="পৃষ্ঠার একদম উপরে যান (Scroll to Top)"
          className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full backdrop-blur-md bg-[#0f2922]/50 hover:bg-[#DCB473] text-white hover:text-[#0f2922] border border-white/30 hover:border-[#DCB473] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-y-0.5 stroke-[2.5]" />
          <span className="sr-only">উপরে যান</span>

          {/* Tooltip on hover */}
          <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-[#0f2922]/90 backdrop-blur-md text-[#DCB473] text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md border border-[#DCB473]/30 hidden sm:block">
            উপরে যান
          </span>
        </button>
      )}

      {/* Scroll Down Button (ট্রান্সপারেন্ট হোভার ডাউন বাটন) */}
      {canScrollDown && (
        <button
          type="button"
          onClick={handleScrollDown}
          title="পৃষ্ঠার নিচে স্ক্রোল করুন (Scroll Down)"
          className="group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full backdrop-blur-md bg-[#0f2922]/50 hover:bg-[#DCB473] text-white hover:text-[#0f2922] border border-white/30 hover:border-[#DCB473] shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-y-0.5 stroke-[2.5]" />
          <span className="sr-only">নিচে যান</span>

          {/* Tooltip on hover */}
          <span className="absolute right-full mr-2.5 px-2.5 py-1 rounded-lg bg-[#0f2922]/90 backdrop-blur-md text-[#DCB473] text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md border border-[#DCB473]/30 hidden sm:block">
            নিচে যান
          </span>
        </button>
      )}
    </div>
  );
};
