import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

interface ParsedGovtNotice {
  id: string;
  title: string;
  url: string;
  date: string;
  isPdf: boolean;
}

function isAllowedPublicHttpUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function resolveAbsoluteUrl(href: string, base: URL): string {
  try {
    return new URL(href.trim(), base.origin).toString();
  } catch {
    return base.toString();
  }
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

function parseHajjGovBdHtml(html: string, base: URL): ParsedGovtNotice[] {
  const notices: ParsedGovtNotice[] = [];
  const seen = new Set<string>();

  const rowPattern =
    /<a[^>]+href=["']([^"']+)["'][^>]*>[\s\S]*?<p[^>]*class=["'][^"']*news-list-title[^"']*["'][^>]*>([\s\S]*?)<span[^>]*class=["'][^"']*news-list-date[^"']*["'][^>]*>([^<]+)<\/span>[\s\S]*?<\/p>[\s\S]*?<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html)) !== null) {
    const absUrl = resolveAbsoluteUrl(match[1], base);
    const title = stripTags(match[2]);
    const date = stripTags(match[3]);
    if (!title || title.length < 4) continue;
    const dedupeKey = `${title}::${absUrl}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    notices.push({
      id: `govt-${notices.length + 1}-${Buffer.from(dedupeKey).toString('base64').slice(0, 10)}`,
      title,
      url: absUrl,
      date: date || 'সাম্প্রতিক বিজ্ঞপ্তি',
      isPdf: /\.pdf($|\?)/i.test(absUrl)
    });
  }

  return notices;
}

function parseGenericHtmlOrRss(body: string, base: URL): ParsedGovtNotice[] {
  const notices: ParsedGovtNotice[] = [];
  const seen = new Set<string>();

  // 1. Check RSS/Atom <item> or <entry>
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
    const absUrl = resolveAbsoluteUrl(rawHref, base);
    const dedupeKey = `${title}::${absUrl}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    notices.push({
      id: `govt-rss-${notices.length + 1}`,
      title,
      url: absUrl,
      date: dateMatch ? stripTags(dateMatch[1]).slice(0, 24) : 'সাম্প্রতিক',
      isPdf: /\.pdf($|\?)/i.test(absUrl)
    });
  }
  if (notices.length > 0) return notices.slice(0, 25);

  // 2. Fallback generic notice/PDF anchor extraction
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
    const absUrl = resolveAbsoluteUrl(rawHref, base);
    const dedupeKey = `${text}::${absUrl}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    notices.push({
      id: `govt-link-${notices.length + 1}`,
      title: text,
      url: absUrl,
      date: 'অফিশিয়াল বিজ্ঞপ্তি',
      isPdf: /\.pdf($|\?)/i.test(absUrl)
    });
    if (notices.length >= 25) break;
  }

  return notices;
}

async function fetchJsonOrText(url: string): Promise<{ text: string; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'MuttaqiHajjPortalReader/1.0 (+https://muttaqi.com.bd)',
        'Cache-Control': 'no-cache',
        Accept: 'application/json, text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const text = await response.text();
    return { text, contentType: response.headers.get('content-type') || '' };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchGovtNoticesFromSource(targetUrl: URL): Promise<ParsedGovtNotice[]> {
  const host = targetUrl.hostname.toLowerCase();
  const isHajjGovBd = host === 'hajj.gov.bd' || host.endsWith('.hajj.gov.bd');

  if (isHajjGovBd) {
    const origin = 'https://www.hajj.gov.bd';
    const currentYear = new Date().getFullYear();
    const candidateYears = [currentYear, currentYear - 1, 2026, 2025].filter(
      (y, idx, arr) => arr.indexOf(y) === idx
    );

    for (const yr of candidateYears) {
      try {
        const { text } = await fetchJsonOrText(`${origin}/get-selected-news/${yr}`);
        const payload = JSON.parse(text) as { responseCode?: number; html?: string };
        if (payload && typeof payload.html === 'string') {
          const parsed = parseHajjGovBdHtml(payload.html, new URL(origin));
          if (parsed.length > 0) return parsed.slice(0, 25);
        }
      } catch {
        // Try next year endpoint
      }
    }

    // Fallback to /all-news on hajj.gov.bd
    try {
      const { text } = await fetchJsonOrText(`${origin}/all-news`);
      const payload = JSON.parse(text) as { html?: string };
      if (payload && typeof payload.html === 'string') {
        const parsed = parseHajjGovBdHtml(payload.html, new URL(origin));
        if (parsed.length > 0) return parsed.slice(0, 25);
      }
    } catch {
      // Fall through to HTML parsing
    }
  }

  const { text } = await fetchJsonOrText(targetUrl.toString());
  try {
    const parsedJson = JSON.parse(text) as { html?: string };
    if (parsedJson && typeof parsedJson.html === 'string') {
      const govNotices = parseHajjGovBdHtml(parsedJson.html, targetUrl);
      if (govNotices.length > 0) return govNotices.slice(0, 25);
      return parseGenericHtmlOrRss(parsedJson.html, targetUrl);
    }
  } catch {
    // Standard HTML or RSS response
  }

  const specific = parseHajjGovBdHtml(text, targetUrl);
  if (specific.length > 0) return specific.slice(0, 25);
  return parseGenericHtmlOrRss(text, targetUrl);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/govt-hajj-notices', async (req: Request, res: Response) => {
    const requestedUrl =
      typeof req.query.url === 'string' && req.query.url.trim()
        ? req.query.url.trim()
        : 'https://www.hajj.gov.bd/';

    const targetUrl = isAllowedPublicHttpUrl(requestedUrl);
    if (!targetUrl) {
      res.status(400).json({
        ok: false,
        error: 'Invalid or disallowed portal URL. Must be a public http/https URL.'
      });
      return;
    }

    try {
      const notices = await fetchGovtNoticesFromSource(targetUrl);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.json({
        ok: true,
        sourceUrl: targetUrl.toString(),
        syncedAt: new Date().toISOString(),
        notices
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notices';
      res.status(502).json({
        ok: false,
        sourceUrl: targetUrl.toString(),
        error: message,
        notices: []
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*path}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
