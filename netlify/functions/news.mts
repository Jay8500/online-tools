import type { Config } from '@netlify/functions';

/**
 * News headlines for the 📰 panel, from publishers' public RSS feeds.
 *  GET /api/news?cat=telangana|andhra|india|top|business|sports|tech|education|telugu → { items: [{ title, summary, link, source, at }] }
 * Only the headline, a short summary (max ~220 chars) and a link back to the publisher are shown — never the full article
 * or images. Cached on Netlify's CDN for 15 minutes, so publishers get at most a few requests an hour from us.
 */
const FEEDS: Record<string, { source: string; url: string }[]> = {
  telangana: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/news/national/telangana/feeder/default.rss' },
    { source: 'The Hindu', url: 'https://www.thehindu.com/news/cities/Hyderabad/feeder/default.rss' },
    { source: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128816011.cms' },
  ],
  business: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/business/feeder/default.rss' },
    { source: 'NDTV Profit', url: 'https://feeds.feedburner.com/ndtvprofit-latest' },
  ],
  sports: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/sport/feeder/default.rss' },
    { source: 'NDTV Sports', url: 'https://feeds.feedburner.com/ndtvsports-latest' },
  ],
  tech: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss' },
    { source: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/66949542.cms' },
  ],
  education: [
    { source: 'The Hindu', url: 'https://www.thehindu.com/education/feeder/default.rss' },
    { source: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms' },
  ],
  andhra: [{ source: 'The Hindu', url: 'https://www.thehindu.com/news/national/andhra-pradesh/feeder/default.rss' }],
  india: [{ source: 'The Hindu', url: 'https://www.thehindu.com/news/national/feeder/default.rss' }],
  top: [{ source: 'NDTV', url: 'https://feeds.feedburner.com/ndtvnews-top-stories' }],
  telugu: [{ source: 'Sakshi', url: 'https://www.sakshi.com/rss.xml' }],
};
const MAX = 25;
const UA = 'Mozilla/5.0 (compatible; SpreadAppsTools/1.0; +https://tools.spreadapps.in)';

interface Item {
  title: string;
  summary: string;
  link: string;
  source: string;
  at: string;
}

export default async (req: Request) => {
  const cat = new URL(req.url).searchParams.get('cat') ?? 'telangana';
  const feeds = FEEDS[cat];
  if (!feeds) return json({ error: 'Unknown category' }, 400);

  const lists = await Promise.all(feeds.map((f) => read(f.url, f.source).catch(() => [] as Item[])));
  const seen = new Set<string>();
  const items = lists
    .flat()
    .filter((i) => i.title && i.link && /^https:\/\//.test(i.link) && !seen.has(i.title.toLowerCase()) && seen.add(i.title.toLowerCase()))
    .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
    .slice(0, MAX);
  if (!items.length) return json({ items: [], error: 'News is not available right now.' }, 200, 60);
  // Stories without a summary get the publisher's own share description (og:description) — a short, simple explanation
  await Promise.all(items.filter((i) => !i.summary).slice(0, 15).map(async (i) => (i.summary = await shareDescription(i.link, i.title))));
  return json({ items }, 200, 900);
};

/** Reads only the <head> of the article page and returns its og:description / meta description (max ~220 chars). */
async function shareDescription(url: string, title: string): Promise<string> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000) });
    if (!r.ok || !r.body) return '';
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let head = '';
    while (head.length < 300_000 && !head.includes('</head>')) {
      const { done, value } = await reader.read();
      if (done) break;
      head += dec.decode(value, { stream: true });
    }
    reader.cancel().catch(() => undefined);
    const meta = (attr: string) =>
      head.match(new RegExp(`<meta[^>]+(?:property|name)=["']${attr}["'][^>]*content=["']([^"']+)["']`, 'i'))?.[1] ??
      head.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${attr}["']`, 'i'))?.[1] ??
      '';
    let d = text(meta('og:description') || meta('description'));
    if (!d || d.toLowerCase() === title.toLowerCase()) return '';
    if (d.length > 220) d = d.slice(0, 217).replace(/\s+\S*$/, '') + '…';
    return d;
  } catch {
    return '';
  }
}

async function read(url: string, source: string): Promise<Item[]> {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) return [];
  const xml = await r.text();
  return [...xml.matchAll(/<item\b[\s\S]*?<\/item>/g)].map(([it]) => {
    const tag = (n: string) => text(it.match(new RegExp(`<${n}\\b[^>]*>([\\s\\S]*?)</${n}>`))?.[1] ?? '');
    const when = new Date(tag('pubDate') || tag('dc:date'));
    const title = tag('title');
    let summary = tag('description');
    // Some feeds put only the title + author + date in the description — that's not a summary
    if (summary.startsWith(title.slice(0, 20))) summary = '';
    if (summary.length > 220) summary = summary.slice(0, 217).replace(/\s+\S*$/, '') + '…';
    return { title, summary, link: tag('link') || tag('guid'), source, at: isNaN(when.getTime()) ? '' : when.toISOString() };
  });
}

/** CDATA, HTML tags and entities → plain text */
function text(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ') // some feeds (Sakshi) escape their HTML — strip tags again after decoding
    .replace(/\s+/g, ' ')
    .trim();
}

function json(body: unknown, status = 200, cacheSeconds = 0) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cacheSeconds) {
    headers['Netlify-CDN-Cache-Control'] = `public, s-maxage=${cacheSeconds}, stale-while-revalidate=1800`;
    headers['Cache-Control'] = 'public, max-age=300';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/news' };
