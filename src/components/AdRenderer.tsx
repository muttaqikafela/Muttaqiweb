import React from 'react';
import { useSite } from '../context/SiteContext';

export const AdRenderer: React.FC<{ page: string }> = ({ page }) => {
  const { ads } = useSite();
  const visible = ads.filter((a) => a.isEnabled && (a.page === 'all' || a.page === page));
  if (visible.length === 0) return null;
  return (
    <div className="space-y-3">
      {visible.map((ad) => (
        <div key={ad.id} className="rounded-2xl border border-stone-200 bg-white p-3 shadow-xs">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Sponsored
          </p>
          {ad.adCode ? (
            <iframe
              title={`Sponsored: ${ad.slotName}`}
              sandbox="allow-scripts"
              srcDoc={ad.adCode}
              className="w-full border-0"
              style={{ minHeight: 90 }}
            />
          ) : ad.adLink ? (
            <a
              href={ad.adLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block text-sm font-bold text-[#0f2922] hover:underline"
            >
              {ad.slotName} — বিজ্ঞাপন দেখুন
            </a>
          ) : (
            <p className="text-sm font-bold text-stone-700">{ad.slotName}</p>
          )}
        </div>
      ))}
    </div>
  );
};
