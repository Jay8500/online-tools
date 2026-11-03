import type { Config } from '@netlify/functions';

/**
 * Latest recruitment notices from official commission websites (public information), for the job notifications page.
 *  GET /api/jobs?src=tgpsc → { items: [{ title, link }], source, site }
 * Only the notice title and the official link are shown; dates must be checked on the official notice.
 * Cached on Netlify's CDN for 3 hours. (UPSC blocks automated readers, so it is linked, not read.)
 */
const UA = 'Mozilla/5.0 (compatible; SpreadAppsTools/1.0; +https://tools.spreadapps.in)';
const MAX = 20;

const SOURCES: Record<string, { name: string; site: string; read: () => Promise<{ title: string; link: string }[]> }> = {
  tgpsc: {
    name: 'TGPSC (Telangana)',
    site: 'https://websitenew.tgpsc.gov.in/',
    async read() {
      const html = await page('https://websitenew.tgpsc.gov.in/');
      // Notice rows: <td><a target="_blank" href = "preview/…"><i …></i>&nbsp;&nbsp;TITLE</a>
      return [...html.matchAll(/<a[^>]*href\s*=\s*"(preview\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(([, href, inner]) => ({
        title: clean(inner),
        link: new URL(href, 'https://websitenew.tgpsc.gov.in/').href,
      }));
    },
  },
};

export default async (req: Request) => {
  const src = new URL(req.url).searchParams.get('src') ?? 'tgpsc';
  const s = SOURCES[src];
  if (!s) return json({ error: 'Unknown source' }, 400);
  try {
    const seen = new Set<string>();
    const items = (await s.read())
      .filter((i) => i.title.length > 12 && !seen.has(i.title.toLowerCase()) && seen.add(i.title.toLowerCase()))
      .slice(0, MAX)
      .map((i) => ({ ...i, title: sentence(i.title) }));
    if (!items.length) throw new Error('empty');
    return json({ items, source: s.name, site: s.site }, 200, 10800);
  } catch {
    return json({ items: [], source: s.name, site: s.site, error: 'Couldn’t read the official site right now.' }, 200, 300);
  }
};

async function page(url: string) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(9000) });
  if (!r.ok) throw new Error(String(r.status));
  return r.text();
}

function clean(s: string) {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*(web note|web link)\.?\s*$/i, '')
    .trim();
}

/** ALL-CAPS notice titles → readable sentence case; codes like "NO.07/G/ES/2026" and known acronyms stay as they are. */
const KEEP = new Set(['TGPSC', 'TSPSC', 'APPSC', 'UPSC', 'SSC', 'JE', 'CBRT', 'CBT', 'OMR', 'II', 'III', 'IV', 'AEE', 'AE', 'GNCTD', 'IAS', 'IFS', 'IPS', 'CSE', 'NDA', 'CDS', 'ESE', 'CMS', 'EPFO', 'ESIC', 'UPSC-ORA', 'ORA', 'PDF']);
function sentence(t: string) {
  if (t !== t.toUpperCase()) return t; // already mixed case
  const out = t
    .toLowerCase()
    .split(' ')
    .map((w) => {
      const up = w.toUpperCase();
      return KEEP.has(up.replace(/[^A-Z-]/g, '')) || /\d/.test(w) ? up : w;
    })
    .join(' ');
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function json(body: unknown, status = 200, cacheSeconds = 0) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cacheSeconds) {
    headers['Netlify-CDN-Cache-Control'] = `public, s-maxage=${cacheSeconds}, stale-while-revalidate=3600`;
    headers['Cache-Control'] = 'public, max-age=600';
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/jobs' };
