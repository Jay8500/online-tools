import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

/**
 * Usage + view counter (Netlify Blobs, no database).
 *  GET  /api/count?tool=ssc-photo         → { count }  public "used N times" (CDN-cached 10 min)
 *  POST /api/count { tool, kind }          → kind 'use' (download/share) or 'view' (page opened);
 *                                            one per IP per tool per kind per day (IP hashed, kept 1 day)
 *  GET  /api/count?stats=1&key=STATS_KEY   → private totals + last 14 days for the /stats page
 * Keys: c/<tool> = uses, v/<tool> = views, d/<YYYY-MM-DD> = { v: {tool: n}, u: {tool: n} }
 */
const TOOL_RE = /^[a-z0-9-]{2,40}$/;
type Day = { v: Record<string, number>; u: Record<string, number> };

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'counts', consistency: 'strong' });
  const url = new URL(req.url);

  if (req.method === 'GET' && url.searchParams.has('stats')) return stats(url, store);

  if (req.method === 'GET') {
    const tool = url.searchParams.get('tool') ?? '';
    if (!TOOL_RE.test(tool)) return json({ error: 'Unknown tool' }, 400);
    const count = Number((await store.get(`c/${tool}`)) ?? 0);
    return json({ count }, 200, { 'Netlify-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600', 'Cache-Control': 'public, max-age=60' });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const origin = req.headers.get('origin') ?? '';
  if (origin && !/^https:\/\/(tools\.spreadapps\.in|[a-z0-9-]+--spreadapps-tools\.netlify\.app|spreadapps-tools\.netlify\.app)$/.test(origin)) {
    return json({ error: 'Forbidden' }, 403);
  }
  let tool = '';
  let kind = 'use';
  try {
    const body = (await req.json()) as { tool?: unknown; kind?: unknown };
    tool = String(body.tool ?? '');
    kind = body.kind === 'view' ? 'view' : 'use';
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  if (!TOOL_RE.test(tool)) return json({ error: 'Unknown tool' }, 400);

  const day = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10); // India date
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const hash = await sha256(`${ip}|${tool}|${kind}|${day}`);
  const seen = getStore({ name: 'seen', consistency: 'strong' });
  if (await seen.get(`${day}/${hash}`)) return json({ ok: true, counted: false });
  await seen.set(`${day}/${hash}`, '1');
  // Now and then, delete hashes from earlier days (privacy policy promises 1 day).
  if (Math.random() < 0.05) {
    const { blobs } = await seen.list();
    await Promise.all(blobs.filter((b) => !b.key.startsWith(`${day}/`)).map((b) => seen.delete(b.key)));
  }

  const key = `${kind === 'view' ? 'v' : 'c'}/${tool}`;
  await store.set(key, String(Number((await store.get(key)) ?? 0) + 1));
  const d = ((await store.get(`d/${day}`, { type: 'json' })) as Day | null) ?? { v: {}, u: {} };
  const bucket = kind === 'view' ? d.v : d.u;
  bucket[tool] = (bucket[tool] ?? 0) + 1;
  await store.setJSON(`d/${day}`, d);
  return json({ ok: true, counted: true });
};

async function stats(url: URL, store: ReturnType<typeof getStore>) {
  const secret = Netlify.env.get('STATS_KEY') ?? '';
  const key = url.searchParams.get('key') ?? '';
  if (!secret || !(await sameText(key, secret))) return json({ error: 'Wrong key' }, 401, { 'Cache-Control': 'no-store' });

  const tools: Record<string, { views: number; uses: number }> = {};
  const add = async (prefix: 'v/' | 'c/', field: 'views' | 'uses') => {
    const { blobs } = await store.list({ prefix });
    await Promise.all(
      blobs.map(async (b) => {
        const t = b.key.slice(2);
        tools[t] ??= { views: 0, uses: 0 };
        tools[t][field] = Number((await store.get(b.key)) ?? 0);
      }),
    );
  };
  await Promise.all([add('v/', 'views'), add('c/', 'uses')]);

  const days: { date: string; views: number; uses: number; byTool: Day }[] = [];
  const now = Date.now() + 5.5 * 3600_000;
  for (let i = 0; i < 14; i++) {
    const date = new Date(now - i * 86400_000).toISOString().slice(0, 10);
    const d = ((await store.get(`d/${date}`, { type: 'json' })) as Day | null) ?? { v: {}, u: {} };
    const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
    days.push({ date, views: sum(d.v), uses: sum(d.u), byTool: d });
  }
  return json({ tools, days }, 200, { 'Cache-Control': 'no-store' });
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compare via hashes so the time taken doesn't leak how much of the key was right. */
async function sameText(a: string, b: string) {
  return (await sha256(a)) === (await sha256(b));
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

export const config: Config = { path: '/api/count' };
