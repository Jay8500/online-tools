import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import webpush from 'web-push';

/**
 * Web push for Spread Apps Tools (no third-party push service: the browser's own push server via `web-push`).
 *  POST /api/push { a: 'sub', sub: PushSubscriptionJSON, topics: string[], gold?: { metal, below } } → { ok }
 *       { a: 'unsub', endpoint }                                                                       → { ok }
 *       { a: 'test', endpoint }                                                                        → { ok }  (one "notifications are on" message)
 * Stored per device (key = hash of the endpoint): the push address, chosen topics and a gold target. Nothing else.
 * Removing the alert / turning notifications off deletes it. Dead addresses are removed when a push fails with 404/410.
 */
/** gold = price target, jobs = new TGPSC notice, festival = 2 days before a festival with a wishes card, news = one morning headline, walk = 6 PM walk reminder. */
export const TOPICS = ['gold', 'jobs', 'festival', 'news', 'walk'] as const;
const METALS = ['gold22PerG', 'gold24PerG', 'silverPerKg'];
const PUSH_HOSTS = /^https:\/\/([a-z0-9-]+\.)*(googleapis\.com|mozilla\.com|mozaws\.net|push\.apple\.com|notify\.windows\.com)\//;

export interface Sub {
  sub: { endpoint: string; keys: { p256dh: string; auth: string } };
  topics: string[];
  gold?: { metal: string; below: number };
  /** Walk reminder hour, India time (0–23); 18 = 6 PM when not chosen. */
  walkAt?: number;
  sent?: Record<string, string>;
  at: number;
}

export function vapid() {
  const pub = Netlify.env.get('VAPID_PUBLIC_KEY'), priv = Netlify.env.get('VAPID_PRIVATE_KEY');
  if (!pub || !priv) return false;
  webpush.setVapidDetails('https://tools.spreadapps.in', pub, priv);
  return true;
}

/** Short, branded notification; tapping opens `url` on the site. */
export function payload(body: string, url: string, tag: string) {
  return JSON.stringify({
    notification: {
      title: 'Spread Apps™ Tools',
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-96.png',
      tag,
      data: { onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url } } },
    },
  });
}

export async function keyOf(endpoint: string) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return 's/' + [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 40);
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const store = getStore({ name: 'push', consistency: 'strong' });
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  // a few changes per device a day is plenty
  const day = new Date().toISOString().slice(0, 10), ipKey = `ip/${day}/${context.ip ?? 'x'}`;
  const n = Number((await store.get(ipKey)) ?? 0);
  if (n > 40) return json({ error: 'Too many requests today' }, 429);
  await store.set(ipKey, String(n + 1));

  if (b['a'] === 'sub') {
    const s = b['sub'] as Sub['sub'] | undefined;
    if (!s || typeof s.endpoint !== 'string' || !PUSH_HOSTS.test(s.endpoint) || s.endpoint.length > 600 || typeof s.keys?.p256dh !== 'string' || typeof s.keys?.auth !== 'string')
      return json({ error: 'Not a push address' }, 400);
    const topics = (Array.isArray(b['topics']) ? b['topics'] : []).filter((t): t is string => TOPICS.includes(t as never));
    const g = b['gold'] as { metal?: unknown; below?: unknown } | undefined;
    const gold = g && METALS.includes(String(g.metal)) && Number(g.below) > 0 && Number(g.below) < 1e8 ? { metal: String(g.metal), below: Math.round(Number(g.below)) } : undefined;
    const key = await keyOf(s.endpoint);
    const old = (await store.get(key, { type: 'json' })) as Sub | null;
    const w = Number(b['walkAt']);
    const walkAt = Number.isInteger(w) && w >= 0 && w <= 23 ? w : undefined;
    const rec: Sub = { sub: { endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth } }, topics, gold, walkAt, sent: old?.sent ?? {}, at: Date.now() };
    await store.setJSON(key, rec); // kept while notifications are on, even with no topic yet (for the test message)
    return json({ ok: true });
  }
  if (b['a'] === 'unsub' || b['a'] === 'test') {
    const endpoint = String(b['endpoint'] ?? '');
    if (!PUSH_HOSTS.test(endpoint)) return json({ error: 'Not a push address' }, 400);
    const key = await keyOf(endpoint);
    if (b['a'] === 'unsub') {
      await store.delete(key);
      return json({ ok: true });
    }
    const rec = (await store.get(key, { type: 'json' })) as Sub | null;
    if (!rec || !vapid()) return json({ error: 'Not subscribed' }, 404);
    try {
      await webpush.sendNotification(rec.sub, payload('🔔 Notifications are on — we will tell you only what you chose.', '/notifications', 'test'), { TTL: 600 });
    } catch (e) {
      if ([404, 410].includes((e as { statusCode?: number }).statusCode ?? 0)) await store.delete(key);
      return json({ error: 'Could not send' }, 502);
    }
    return json({ ok: true });
  }
  return json({ error: 'Unknown action' }, 400);
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'Cache-Control': 'no-store' } });
}

export const config: Config = { path: '/api/push' };
