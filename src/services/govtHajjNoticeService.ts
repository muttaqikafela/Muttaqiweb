import type { GovtHajjNoticeItem } from '../context/SiteContext';

export interface GovtHajjFetchResult {
  ok: boolean;
  sourceUrl: string;
  syncedAt: string;
  notices: GovtHajjNoticeItem[];
  via: 'api' | 'cors-proxy' | 'direct' | 'none';
  error?: string;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveAbsoluteUrl(href: string, origin: string): string {
  try {
    return new URL(href.trim(), origin).toString();
  } catch {
    return origin;
  }
}

function parseHajjGovBdHtmlClient(html: string, origin: string): GovtHajjNoticeItem[] {
  const notices: GovtHajjNoticeItem[] = [];
  const seen = new Set<string>();

  const rowPattern =
    /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<p[^>]*class=["'][^"']*news-list-title[^"']*["'][^>]*>([\s\S]*?)<span[^>]*class=["'][^"']*news-list-date[^"']*["'][^>]*>([^<]+)<\/span>[\s\S]*?<\/p>[\s\S]*?<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const url = resolveAbsoluteUrl(match[1], origin);
    const title = stripTags(match[2]);
    const date = stripTags(match[3]);
    if (!title || title.length < 4) continue;
    const key = `${title}::${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    notices.push({
      id: `govt-live-${notices.length + 1}`,
      title,
      url,
      date: date || 'সাম্প্রতিক বিজ্ঞপ্তি',
      isPdf: /\.pdf($|\?)/i.test(url)
    });
  }
  return notices;
}

function parseGenericClientHtmlOrRss(body: string, origin: string): GovtHajjNoticeItem[] {
  const notices: GovtHajjNoticeItem[] = [];
  const seen = new Set<string>();

  const rssPattern = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
  let rssMatch: RegExpExecArray | null;
  while ((rssMatch = rssPattern.exec(body)) !== null) {
    const block = rssMatch[1];
    const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkHrefMatch = block.match(/<link[^>]*href=["']([^"']+)["']/i);
    const linkTextMatch = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const dateMatch = block.match(/<(?:pubDate|updated|published)[^>]*>([\s\S]*?)<\/(?:pubDate|updated|published)>/i);
    const title = titleMatch ? stripTags(titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '')) : '';
    const rawHref = (linkHrefMatch?.[1] || linkTextMatch?.[1] || '').trim();
    if (!title || !rawHref) continue;
    const url = resolveAbsoluteUrl(rawHref, origin);
    const key = `${title}::${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    notices.push({
      id: `govt-rss-${notices.length + 1}`,
      title,
      url,
      date: dateMatch ? stripTags(dateMatch[1]).slice(0, 24) : 'সাম্প্রতিক',
      isPdf: /\.pdf($|\?)/i.test(url)
    });
  }
  if (notices.length > 0) return notices.slice(0, 25);

  const anchorPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch: RegExpExecArray | null;
  while ((anchorMatch = anchorPattern.exec(body)) !== null) {
    const rawHref = anchorMatch[1].trim();
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) continue;
    const text = stripTags(anchorMatch[2]);
    if (!text || text.length < 12) continue;
    const looksLikeNotice =
      /\.pdf($|\?)/i.test(rawHref) ||
      /notice|circular|news|announcement|নোটিশ|বিজ্ঞপ্তি|সার্কুলার|প্রজ্ঞাপন|হজ/i.test(`${rawHref} ${text}`);
    if (!looksLikeNotice) continue;
    const url = resolveAbsoluteUrl(rawHref, origin);
    const key = `${text}::${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    notices.push({
      id: `govt-link-${notices.length + 1}`,
      title: text,
      url,
      date: 'অফিশিয়াল বিজ্ঞপ্তি',
      isPdf: /\.pdf($|\?)/i.test(url)
    });
    if (notices.length >= 25) break;
  }

  return notices;
}

export async function fetchLiveGovtHajjNotices(portalUrl: string): Promise<GovtHajjFetchResult> {
  const cleanUrl = (portalUrl || 'https://www.hajj.gov.bd/').trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
  } catch {
    return {
      ok: false,
      sourceUrl: cleanUrl,
      syncedAt: new Date().toISOString(),
      notices: [],
      via: 'none',
      error: 'সঠিক ওয়েবসাইট লিংক দিন (যেমন: https://www.hajj.gov.bd/)'
    };
  }

  // 1. Primary: Server-side proxy endpoint (works in AI Studio / Node / Vercel)
  {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `/api/govt-hajj-notices?url=${encodeURIComponent(parsedUrl.toString())}&_t=${Date.now()}`,
        {
          signal: controller.signal,
          cache: 'no-store'
        }
      );

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.ok && Array.isArray(data.notices) && data.notices.length > 0) {
          return {
            ok: true,
            sourceUrl: data.sourceUrl || parsedUrl.toString(),
            syncedAt: data.syncedAt || new Date().toISOString(),
            notices: data.notices,
            via: 'api'
          };
        }
      }
    } catch {
      // Static host (e.g., GitHub Pages) - proceed to CORS fallback
    } finally {
      clearTimeout(timer);
    }
  }

  // 2. Static-host fallback: CORS relay (for GitHub Pages / static CDN)
  const isHajjGovBd =
    parsedUrl.hostname.toLowerCase() === 'hajj.gov.bd' ||
    parsedUrl.hostname.toLowerCase().endsWith('.hajj.gov.bd');

  const currentYear = new Date().getFullYear();
  const targetUrls = isHajjGovBd
    ? [
        `https://www.hajj.gov.bd/get-selected-news/${currentYear}`,
        `https://www.hajj.gov.bd/get-selected-news/${currentYear - 1}`,
        'https://www.hajj.gov.bd/get-selected-news/2026',
        'https://www.hajj.gov.bd/all-news'
      ].filter((u, idx, arr) => arr.indexOf(u) === idx)
    : [parsedUrl.toString()];

  const bust = Date.now();
  for (const target of targetUrls) {
    const sep = target.includes('?') ? '&' : '?';
    const bustedTarget = `${target}${sep}_t=${bust}`;
    const relayEndpoints = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(bustedTarget)}`,
      `https://corsproxy.io/?${encodeURIComponent(bustedTarget)}`
    ];

    for (const relayUrl of relayEndpoints) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7500);
      try {
        const res = await fetch(relayUrl, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) continue;

        const text = await res.text();
        let rawHtml = text;
        try {
          const maybeJson = JSON.parse(text) as { html?: string };
          if (maybeJson && typeof maybeJson.html === 'string') {
            rawHtml = maybeJson.html;
          }
        } catch {
          // Plain HTML or RSS
        }

        const parsedNotices = parseHajjGovBdHtmlClient(rawHtml, parsedUrl.origin);
        const finalNotices =
          parsedNotices.length > 0 ? parsedNotices : parseGenericClientHtmlOrRss(rawHtml, parsedUrl.origin);

        if (finalNotices.length > 0) {
          return {
            ok: true,
            sourceUrl: parsedUrl.toString(),
            syncedAt: new Date().toISOString(),
            notices: finalNotices.slice(0, 25),
            via: 'cors-proxy'
          };
        }
      } catch {
        // Try next relay
      } finally {
        clearTimeout(timer);
      }
    }
  }

  return {
    ok: false,
    sourceUrl: parsedUrl.toString(),
    syncedAt: new Date().toISOString(),
    notices: [],
    via: 'none',
    error: 'লাইভ সংযোগে সাময়িক বিলম্ব হচ্ছে — সর্বশেষ সংরক্ষিত সরকারি নোটিশ প্রদর্শিত হচ্ছে।'
  };
}
