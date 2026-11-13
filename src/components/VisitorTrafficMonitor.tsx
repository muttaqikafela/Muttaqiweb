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
      <div className="bg-[#081713]/95 backdrop-blur-md text-white border border-[#DCB473]/45 rounded-xl shadow-md shadow-black/30 overflow-hidden transition-all hover:border-[#DCB473]/80 w-fit max-w-[235px]">
        {/* Compact Header Bar */}
        <div className="px-2.5 py-1 bg-black/30 border-b border-[#DCB473]/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-[#DCB473] tracking-wide flex items-center gap-1 whitespace-nowrap">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>ভিজিটর মনিটর</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-0.5 text-stone-300 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
            title={isMinimized ? 'মনিটর বড় করুন' : 'মনিটর ছোট করুন'}
            aria-label="Toggle visitor monitor"
          >
            {isMinimized ? (
              <ChevronDown className="w-3 h-3 text-[#DCB473]" />
            ) : (
              <ChevronUp className="w-3 h-3 text-[#DCB473]" />
            )}
          </button>
        </div>

        {/* Minimized Compact Strip */}
        {isMinimized ? (
          <div
            onClick={() => setIsMinimized(false)}
            className="px-2.5 py-1.5 flex items-center gap-2 text-[10px] cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            <span className="text-stone-300">
              দিন: <strong className="text-emerald-300">{toBengaliNumber(stats.todayCount)}</strong>
            </span>
            <span className="text-stone-600">•</span>
            <span className="text-stone-300">
              সপ্তাহ: <strong className="text-[#DCB473]">{toBengaliNumber(stats.weekCount)}</strong>
            </span>
            <span className="text-stone-600">•</span>
            <span className="text-stone-300">
              মাস: <strong className="text-teal-200">{toBengaliNumber(stats.monthCount)}</strong>
            </span>
          </div>
        ) : (
          /* Compact Expanded Monitor View */
          <div className="p-2 space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {/* সারাদিন */}
              <div className="bg-white/5 px-1.5 py-1 rounded-lg border border-emerald-500/25 flex flex-col items-center min-w-[60px]">
                <span className="flex items-center gap-0.5 text-[9px] text-emerald-300 font-semibold leading-tight">
                  <Users className="w-2.5 h-2.5 shrink-0" />
                  <span>সারাদিন</span>
                </span>
                <span className="text-xs font-extrabold text-white leading-tight mt-0.5">
                  {toBengaliNumber(stats.todayCount)}
                </span>
              </div>

              {/* এসপ্তাহে */}
              <div className="bg-white/5 px-1.5 py-1 rounded-lg border border-[#DCB473]/25 flex flex-col items-center min-w-[60px]">
                <span className="flex items-center gap-0.5 text-[9px] text-[#DCB473] font-semibold leading-tight">
                  <Calendar className="w-2.5 h-2.5 shrink-0" />
                  <span>এসপ্তাহে</span>
                </span>
                <span className="text-xs font-extrabold text-[#DCB473] leading-tight mt-0.5">
                  {toBengaliNumber(stats.weekCount)}
                </span>
              </div>

              {/* মাসে */}
              <div className="bg-white/5 px-1.5 py-1 rounded-lg border border-teal-500/25 flex flex-col items-center min-w-[60px]">
                <span className="flex items-center gap-0.5 text-[9px] text-teal-300 font-semibold leading-tight">
                  <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                  <span>মাসে</span>
                </span>
                <span className="text-xs font-extrabold text-teal-200 leading-tight mt-0.5">
                  {toBengaliNumber(stats.monthCount)}
                </span>
              </div>
            </div>

            {/* Tiny status bar */}
            <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[9px] text-stone-400 px-0.5">
              <span className="flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-emerald-400" />
                <span>মোট ভিজিটর:</span>
                <strong className="text-stone-200 font-bold">
                  {toBengaliNumber(stats.totalCount)} জন
                </strong>
              </span>
              <span className="text-[8px] text-emerald-400/90 font-semibold">লাইভ</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
