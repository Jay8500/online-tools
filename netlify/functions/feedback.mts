import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

/**
 * "Suggest" box under every tool page (no database, no personal data asked).
 *  POST /api/feedback { page, name, text, website (honeypot) } → emails the owner.
 * At most 5 suggestions per IP per day (IP hashed, kept 1 day — same as likes) and FEEDBACK_DAILY_MAX emails a day.
 * Env: RESEND_API_KEY, LIKE_EMAIL_TO (owner inbox, shared with likes), optional FEEDBACK_DAILY_MAX (default 50).
 */
const PAGE_RE = /^[a-z0-9-]{2,60}$/;
const SITE = 'https://tools.spreadapps.in';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const origin = req.headers.get('origin') ?? '';
  if (origin && !/^https:\/\/(tools\.spreadapps\.in|[a-z0-9-]+--spreadapps-tools\.netlify\.app|spreadapps-tools\.netlify\.app)$/.test(origin)) {
    return json({ error: 'Forbidden' }, 403);
  }
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  if (String(b['website'] ?? '').trim()) return json({ ok: true }); // bots fill the hidden field
  const page = String(b['page'] ?? '');
  const name = String(b['name'] ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const text = String(b['text'] ?? '').replace(/\r/g, '').trim().slice(0, 400);
  if (!PAGE_RE.test(page) || text.length < 3) return json({ error: 'Please write a few words.' }, 400);

  const day = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10); // India date
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const seen = getStore({ name: 'seen', consistency: 'strong' });
  const key = `${day}/fb-${await sha256(`${ip}|feedback|${day}`)}`;
  const mine = Number((await seen.get(key)) ?? 0);
  if (mine >= 5) return json({ error: 'Too many suggestions today. Thank you!' }, 429);
  await seen.set(key, String(mine + 1));

  const store = getStore({ name: 'likes', consistency: 'strong' });
  const max = Number(Netlify.env.get('FEEDBACK_DAILY_MAX') ?? 50) || 50;
  const sent = Number((await store.get(`fe/${day}`)) ?? 0);
  const resend = Netlify.env.get('RESEND_API_KEY')?.trim();
  const to = Netlify.env.get('LIKE_EMAIL_TO')?.trim();
  if (!resend || !to || sent >= max) return json({ ok: true, emailed: false });
  await store.set(`fe/${day}`, String(sent + 1));

  const link = `${SITE}/${page === 'home' ? '' : page}`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">
    <p style="font-size:28px;margin:0">💬</p>
    <p>New suggestion on <b>${esc(name || page)}</b>:</p>
    <blockquote style="margin:0;padding:8px 12px;border-left:4px solid #0d9488;background:#f0fdfa;white-space:pre-wrap">${esc(text)}</blockquote>
    <p><a href="${link}">${esc(link)}</a><br>${day} IST</p>
    <p style="color:#888;font-size:12px">Anonymous — no name, phone or email is collected.</p></div>`;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resend}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: 'Spread Apps Tools <tools@mail.spreadapps.in>', to: [to], subject: `💬 Suggestion: ${name || page}`, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) console.error('resend', r.status, (await r.text()).slice(0, 200));
    return json({ ok: true, emailed: r.ok });
  } catch (e) {
    console.error('resend', e);
    return json({ ok: true, emailed: false });
  }
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store' } });
}

export const config: Config = { path: '/api/feedback' };
