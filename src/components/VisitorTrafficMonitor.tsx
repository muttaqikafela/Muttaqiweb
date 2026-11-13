import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, ChevronDown, ChevronUp, Globe, Activity } from 'lucide-react';
import { SupabaseService } from '../services/supabaseService';
import { VisitorTrafficStats } from '../types';

// Convert English numerals to Bengali digits
export const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const formatted = typeof num === 'number' ? num.toLocaleString('en-US') : String(num);
  return formatted.replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
};

export const VisitorTrafficMonitor: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [stats, setStats] = useState<VisitorTrafficStats>(() => {
    // Load local cached stats for instant display
    try {
      const cached = localStorage.getItem('muttaqi_traffic_stats_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const monthKey = todayDate.substring(0, 7);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    const weekStart = monday.toISOString().split('T')[0];

    return {
      todayDate,
      todayCount: 0,
      weekStart,
      weekCount: 0,
      monthKey,
      monthCount: 0,
      totalCount: 0,
      lastUpdated: new Date().toISOString()
    };
  });

  useEffect(() => {
    let isMounted = true;

    const recordOrFetch = async () => {
      try {
        const hasSessionHit = sessionStorage.getItem('muttaqi_visitor_recorded');
        let currentStats: VisitorTrafficStats | null = null;

        if (!hasSessionHit) {
          // New visit in this browser session -> record hit
          currentStats = await SupabaseService.recordVisitorTraffic();
          try {
            sessionStorage.setItem('muttaqi_visitor_recorded', 'true');
          } catch {}
        } else {
          // Already counted this session -> fetch latest counts
          currentStats = await SupabaseService.fetchVisitorTraffic();
        }

        if (isMounted && currentStats) {
          setStats(currentStats);
          try {
            localStorage.setItem('muttaqi_traffic_stats_cache', JSON.stringify(currentStats));
          } catch {}
        }
      } catch (err) {
        console.warn('Visitor monitor sync error:', err);
      }
    };

    recordOrFetch();

    // Poll every 35 seconds to keep counts live across active visitors
    const interval = setInterval(async () => {
      try {
        const latest = await SupabaseService.fetchVisitorTraffic();
        if (isMounted && latest) {
          setStats(latest);
          try {
            localStorage.setItem('muttaqi_traffic_stats_cache', JSON.stringify(latest));
          } catch {}
        }
      } catch {}
    }, 35000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="inline-block transition-all duration-300 font-sans"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="bg-gradient-to-br from-[#0c221c]/95 via-[#0f2922]/95 to-[#13332b]/95 backdrop-blur-md text-white border-2 border-[#DCB473]/60 rounded-2xl sm:rounded-3xl shadow-xl shadow-black/25 overflow-hidden transition-all hover:border-[#DCB473]">
        {/* Header Bar */}
        <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-black/25 border-b border-[#DCB473]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-400"></span>
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-[#DCB473] tracking-wide flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>লাইভ ভিজিটর মনিটর</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-stone-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/15 hidden sm:inline-block">
              রিয়েল-টাইম রিপোর্ট
            </span>
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-stone-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title={isMinimized ? 'মনিটর সম্প্রসারণ করুন' : 'মনিটর সংকুচিত করুন'}
              aria-label="Toggle visitor monitor"
            >
              {isMinimized ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#DCB473]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#DCB473]" />
              )}
            </button>
          </div>
        </div>

        {/* Minimized Compact View */}
        {isMinimized ? (
          <div
            onClick={() => setIsMinimized(false)}
            className="px-3 py-2 flex items-center gap-3 text-xs cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-stone-300 text-[10px]">সারাদিন:</span>
              <span className="font-extrabold text-emerald-300 text-xs">
                {toBengaliNumber(stats.todayCount)}
              </span>
            </div>
            <span className="text-stone-500">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-300 text-[10px]">এসপ্তাহে:</span>
              <span className="font-extrabold text-[#DCB473] text-xs">
                {toBengaliNumber(stats.weekCount)}
              </span>
            </div>
            <span className="text-stone-500">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-300 text-[10px]">মাসে:</span>
              <span className="font-extrabold text-amber-200 text-xs">
                {toBengaliNumber(stats.monthCount)}
              </span>
            </div>
          </div>
        ) : (
          /* Full Expanded Monitor View */
          <div className="p-3 sm:p-4 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              {/* Metric 1: সারাদিন (আজ) */}
              <div className="bg-white/5 hover:bg-white/10 p-2 sm:p-2.5 rounded-xl border border-emerald-500/30 transition-colors flex flex-col items-center">
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-300 font-semibold mb-0.5">
                  <Users className="w-3 h-3 shrink-0" />
                  <span>সারাদিন</span>
                </div>
                <div className="text-base sm:text-lg font-black text-white tracking-tight leading-none mt-0.5">
                  {toBengaliNumber(stats.todayCount)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-stone-300 mt-1">আজকের ভিজিটর</span>
              </div>

              {/* Metric 2: চলতি সপ্তাহ (এসপ্তাহে) */}
              <div className="bg-white/5 hover:bg-white/10 p-2 sm:p-2.5 rounded-xl border border-[#DCB473]/30 transition-colors flex flex-col items-center">
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#DCB473] font-semibold mb-0.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>এসপ্তাহে</span>
                </div>
                <div className="text-base sm:text-lg font-black text-[#DCB473] tracking-tight leading-none mt-0.5">
                  {toBengaliNumber(stats.weekCount)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-stone-300 mt-1">চলতি সপ্তাহে</span>
              </div>

              {/* Metric 3: চলতি মাস (মাসে) */}
              <div className="bg-white/5 hover:bg-white/10 p-2 sm:p-2.5 rounded-xl border border-teal-500/30 transition-colors flex flex-col items-center">
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-teal-300 font-semibold mb-0.5">
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>মাসে</span>
                </div>
                <div className="text-base sm:text-lg font-black text-teal-200 tracking-tight leading-none mt-0.5">
                  {toBengaliNumber(stats.monthCount)}
                </div>
                <span className="text-[9px] sm:text-[10px] text-stone-300 mt-1">চলতি মাসে</span>
              </div>
            </div>

            {/* Bottom mini status bar */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-stone-400 px-0.5">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>সর্বমোট ভিজিটর:</span>
                <strong className="text-stone-200 font-bold ml-0.5">
                  {toBengaliNumber(stats.totalCount)} জন
                </strong>
              </span>
              <span className="text-[9px] text-stone-400">
                স্বয়ংক্রিয় আপডেট
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
