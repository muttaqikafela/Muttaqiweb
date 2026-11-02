import React from 'react';
import { useSite, type AdSlot } from '../context/SiteContext';
import { ExternalLink, Sparkles, Megaphone } from 'lucide-react';

interface AdRendererProps {
  page: string;
  position?: 'top' | 'middle' | 'bottom' | 'any';
  className?: string;
}

export const AdRenderer: React.FC<AdRendererProps> = ({
  page,
  position = 'any',
  className = ''
}) => {
  const { ads } = useSite();

  const visible = ads.filter((a) => {
    if (!a.isEnabled) return false;
    const matchesPage = a.page === 'all' || a.page === page;
    if (!matchesPage) return false;

    if (!position || position === 'any') return true;
    return a.position === position || !a.position || a.position === 'all';
  });

  if (visible.length === 0) return null;

  const buildHtmlDoc = (code: string) => {
    // If it is already a full HTML document, use it
    if (code.includes('<html') || code.includes('<!DOCTYPE')) {
      return code;
    }
    // Otherwise wrap it in a proper responsive container with script support
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 8px;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
  };

  return (
    <div className={`space-y-4 my-4 w-full ${className}`}>
      {visible.map((ad: AdSlot) => (
        <div
          key={ad.id}
          className="rounded-2xl border-2 border-stone-200/90 hover:border-[#DCB473]/80 bg-gradient-to-r from-stone-50 via-white to-amber-50/30 p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden relative group"
        >
          {/* Header Tag */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/70 text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-stone-500">
              <Megaphone className="w-3.5 h-3.5 text-[#b88e44]" />
              <span className="uppercase tracking-wider">স্পন্সরড বিজ্ঞাপন (Sponsored Ad)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#DCB473]/15 text-[#8d6928] font-semibold text-[10px] border border-[#DCB473]/30">
              {ad.provider === 'adsterra'
                ? 'Adsterra Network'
                : ad.provider === 'google_ads'
                ? 'Google Ads'
                : 'Sponsored Partner'}
            </span>
          </div>

          {/* Ad Content */}
          {ad.adCode ? (
            <div className="w-full flex justify-center items-center overflow-x-auto min-h-[90px]">
              <iframe
                title={`Sponsored: ${ad.slotName}`}
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation-by-user-activation"
                srcDoc={buildHtmlDoc(ad.adCode)}
                className="w-full border-0 min-h-[90px] max-w-full"
                loading="lazy"
              />
            </div>
          ) : ad.adLink ? (
            <a
              href={ad.adLink}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-[#0f2922] via-[#163c32] to-[#0f2922] text-white hover:opacity-95 transition-all shadow-md group/link cursor-pointer border border-[#DCB473]/40"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#DCB473]/20 text-[#DCB473] text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>স্পন্সরড অফার ও লিংক</span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-white group-hover/link:text-[#DCB473] transition-colors">
                  {ad.slotName}
                </h4>
                <p className="text-xs text-stone-300">
                  বিজ্ঞাপনটির বিস্তারিত দেখতে ও অফার পেতে এখানে ক্লিক করুন।
                </p>
              </div>

              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#DCB473] hover:bg-[#c99f5e] text-[#0f2922] text-xs font-bold shrink-0 transition-transform group-hover/link:scale-105 shadow-sm">
                <span>বিজ্ঞাপন দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </a>
          ) : (
            <div className="p-3 text-center text-xs text-stone-600 bg-stone-100 rounded-xl">
              <span className="font-bold text-stone-800">{ad.slotName}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
