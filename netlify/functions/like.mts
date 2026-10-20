import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

/**
 * "❤️ Love this tool" button (Netlify Blobs + Resend email, no database).
 *  GET  /api/like?page=emi-calculator → { count }   public total (CDN-cached 10 min)
 *  POST /api/like { page, name }      → counts one like and emails the owner.
 * The browser sends a like only once per page (localStorage); the server also keeps one per IP per page per day
 * (IP hashed, kept 1 day — same as the usage counter) and sends at most LIKE_DAILY_MAX emails a day.
 * Env: RESEND_API_KEY, LIKE_EMAIL_TO (owner inbox), optional LIKE_EMAIL_FROM (address on a domain verified in Resend),
 * LIKE_DAILY_MAX (default 50). Without the key or inbox, likes are still counted — just no email.
 * Keys: l/<page> = likes, e/<YYYY-MM-DD> = emails sent that day.
 */
const PAGE_RE = /^[a-z0-9-]{2,60}$/;
const SITE = 'https://tools.spreadapps.in';

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'likes', consistency: 'strong' });
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const page = url.searchParams.get('page') ?? '';
    if (!PAGE_RE.test(page)) return json({ error: 'Unknown page' }, 400);
    const count = Number((await store.get(`l/${page}`)) ?? 0);
    return json({ count }, 200, { 'Netlify-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600', 'Cache-Control': 'public, max-age=60' });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const origin = req.headers.get('origin') ?? '';
  if (origin && !/^https:\/\/(tools\.spreadapps\.in|[a-z0-9-]+--spreadapps-tools\.netlify\.app|spreadapps-tools\.netlify\.app)$/.test(origin)) {
    return json({ error: 'Forbidden' }, 403);
  }
  let page = '';
  let name = '';
  try {
    const body = (await req.json()) as { page?: unknown; name?: unknown };
    page = String(body.page ?? '');
    name = String(body.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  if (!PAGE_RE.test(page)) return json({ error: 'Unknown page' }, 400);

  const day = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10); // India date
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const seen = getStore({ name: 'seen', consistency: 'strong' });
  const hash = await sha256(`${ip}|like|${page}|${day}`);
  if (await seen.get(`${day}/${hash}`)) return json({ ok: true, counted: false });
  await seen.set(`${day}/${hash}`, '1');

  const count = Number((await store.get(`l/${page}`)) ?? 0) + 1;
  await store.set(`l/${page}`, String(count));

  const key = Netlify.env.get('RESEND_API_KEY')?.trim();
  const to = Netlify.env.get('LIKE_EMAIL_TO')?.trim();
  const max = Number(Netlify.env.get('LIKE_DAILY_MAX') ?? 50) || 50;
  const sent = Number((await store.get(`e/${day}`)) ?? 0);
  let emailed = false;
  if (key && to && sent < max) {
    await store.set(`e/${day}`, String(sent + 1));
    emailed = await sendEmail(key, to, page, name || page, count, day);
  }
  return json({ ok: true, counted: true, count, emailed });
};

async function sendEmail(key: string, to: string, page: string, name: string, count: number, day: string) {
  const from = Netlify.env.get('LIKE_EMAIL_FROM')?.trim() || 'Spread Apps Tools <tools@mail.spreadapps.in>'; // mail.spreadapps.in is the domain verified in Resend
  const link = `${SITE}/${page === 'home' ? '' : page}`;
  const time = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(11, 16);
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">
    <p style="font-size:28px;margin:0">❤️</p>
    <p>Someone just loved <b>${esc(name)}</b> on Spread Apps Tools.</p>
    <p>Total likes for this page: <b>${count}</b><br>${day} · ${time} IST</p>
    <p><a href="${link}">${esc(link)}</a></p>
    <p style="color:#888;font-size:12px">No personal details are collected — this is an anonymous like.</p></div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: `❤️ Someone loved ${name} (${count})`, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error('resend', r.status, (await r.text()).slice(0, 200));
    return r.ok;
  } catch (e) {
    console.error('resend', e);
    return false;
  }
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

export const config: Config = { path: '/api/like' };
