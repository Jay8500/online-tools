import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

/**
 * Public "used N times" counter.
 *  GET  /api/count?tool=ssc-photo  → { count }   (CDN-cached 10 min, so it costs almost nothing)
 *  POST /api/count { tool }        → counts one use; one per IP per tool per day (IP is hashed, kept 1 day)
 */
const TOOL_RE = /^[a-z0-9-]{2,40}$/;

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'counts', consistency: 'strong' });

  if (req.method === 'GET') {
    const tool = new URL(req.url).searchParams.get('tool') ?? '';
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
  try {
    tool = String(((await req.json()) as { tool?: unknown }).tool ?? '');
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  if (!TOOL_RE.test(tool)) return json({ error: 'Unknown tool' }, 400);

  const day = new Date().toISOString().slice(0, 10);
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const hash = await sha256(`${ip}|${tool}|${day}`);
  const seen = getStore({ name: 'seen' });
  if (await seen.get(`${day}/${hash}`)) return json({ ok: true, counted: false });
  await seen.set(`${day}/${hash}`, '1');
  // Now and then, delete hashes from earlier days (privacy policy promises 1 day).
  if (Math.random() < 0.05) {
    const { blobs } = await seen.list();
    await Promise.all(blobs.filter((b) => !b.key.startsWith(`${day}/`)).map((b) => seen.delete(b.key)));
  }

  const key = `c/${tool}`;
  const next = Number((await store.get(key)) ?? 0) + 1;
  await store.set(key, String(next));
  return json({ ok: true, counted: true });
};

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

export const config: Config = { path: '/api/count' };
