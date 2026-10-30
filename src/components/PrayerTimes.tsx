import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Moon, Sun, Clock, MapPin, Bell } from 'lucide-react';

export const PrayerTimes: React.FC = () => {
  const { prayerSchedule } = useAdmin();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [activePrayerIndex, setActivePrayerIndex] = useState<number>(2);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );

      const hours = now.getHours();
      if (hours >= 4 && hours < 6) setActivePrayerIndex(0);
      else if (hours >= 6 && hours < 12) setActivePrayerIndex(1);
      else if (hours >= 12 && hours < 16) setActivePrayerIndex(2);
      else if (hours >= 16 && hours < 18) setActivePrayerIndex(3);
      else if (hours >= 18 && hours < 19) setActivePrayerIndex(4);
      else setActivePrayerIndex(5);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 bg-gradient-to-br from-[#0c261f] via-[#0f2e26] to-[#0a1e18] text-white relative overflow-hidden">
      {/* Decorative background motifs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#DCB473]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#DCB473] text-sm font-semibold mb-2">
              <Moon className="w-4 h-4" />
              <span>আসসালামু আলাইকুম</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              আজকের নামাজের <span className="text-[#DCB473]">সময়সূচী</span>
            </h2>
            <div className="flex items-center gap-2 text-stone-300 text-sm mt-2">
              <MapPin className="w-4 h-4 text-[#DCB473]" />
              <span>দুপচাঁচিয়া, বগুড়া ও পার্শ্ববর্তী এলাকা</span>
            </div>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-2xl px-5 py-3 flex items-center gap-4 backdrop-blur-md self-start md:self-auto">
            <Clock className="w-5 h-5 text-[#DCB473] animate-pulse" />
            <div>
              <span className="text-xs text-stone-300 block">বর্তমান সময়</span>
              <span className="text-lg font-bold text-white font-mono">{currentTime || 'সময় লোড হচ্ছে...'}</span>
            </div>
          </div>
        </div>

        {/* Prayer Times Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {prayerSchedule.map((prayer, idx) => {
            const isActive = idx === activePrayerIndex;
            return (
              <div
                key={prayer.nameEn}
                className={`rounded-2xl p-4 sm:p-5 transition-all duration-200 border text-center flex flex-col items-center relative ${
                  isActive
                    ? 'bg-gradient-to-b from-[#DCB473]/30 to-[#DCB473]/10 border-[#DCB473] shadow-lg shadow-[#DCB473]/10 scale-105 z-10'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-2.5 bg-[#DCB473] text-[#0f2922] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    চলমান
                  </span>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  isActive ? 'bg-[#DCB473] text-[#0f2922]' : 'bg-white/10 text-[#DCB473]'
                }`}>
                  {prayer.nameEn === 'Sunrise' ? (
                    <Sun className="w-6 h-6" />
                  ) : prayer.nameEn === 'Fajr' || prayer.nameEn === 'Isha' ? (
                    <Moon className="w-6 h-6" />
                  ) : (
                    <Bell className="w-6 h-6" />
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-0.5">
                  {prayer.nameBn}
                </h3>
                <span className="text-xs text-stone-300 mb-2 font-medium">
                  {prayer.nameEn}
                </span>

                <div className={`mt-auto px-3 py-1 rounded-lg text-sm font-bold font-mono tracking-wide ${
                  isActive ? 'bg-white text-[#0f2922]' : 'bg-white/10 text-[#DCB473]'
                }`}>
                  {prayer.time}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs text-stone-400">
          * স্থানীয় মসজিদ ভেদে জামাতের সময়সূচীতে সামান্য পার্থক্য হতে পারে। নামাজের ৫ মিনিট পূর্বে মসজিদে উপস্থিত হওয়া উত্তম।
        </div>
      </div>
    </section>
  );
};
