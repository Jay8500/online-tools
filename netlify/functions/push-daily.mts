import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import webpush from 'web-push';
import { payload, vapid, type Sub } from './push.mts';

const LABEL: Record<string, string> = { gold22PerG: 'Gold 22K', gold24PerG: 'Gold 24K', silverPerKg: 'Silver' };
const UNIT: Record<string, string> = { gold22PerG: '/g', gold24PerG: '/g', silverPerKg: '/kg' };
const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Every morning (after the price update): one push to each device whose gold / silver target was reached. At most one a day per topic. */
export default async (_req: Request, context: Context) => {
  if (!vapid()) return new Response('VAPID keys missing', { status: 500 });
  const store = getStore({ name: 'push', consistency: 'strong' });
  const site = context.site?.url || 'https://tools.spreadapps.in';
  const prices = (await (await fetch(new URL('/api/metals', site))).json()) as Record<string, number>;
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  let sent = 0, gone = 0;
  const { blobs } = await store.list({ prefix: 's/' });
  for (const { key } of blobs) {
    const rec = (await store.get(key, { type: 'json' })) as Sub | null;
    if (!rec?.gold || !rec.topics.includes('gold') || rec.sent?.['gold'] === today) continue;
    const now = prices[rec.gold.metal];
    if (!(now > 0) || now > rec.gold.below) continue;
    const body = `🥇 ${LABEL[rec.gold.metal]} is ₹${INR.format(now)}${UNIT[rec.gold.metal]} — your ₹${INR.format(rec.gold.below)} target is here!`;
    try {
      await webpush.sendNotification(rec.sub, payload(body, '/gold-price-calculator?utm_source=push', 'gold'), { TTL: 6 * 3600 });
      await store.setJSON(key, { ...rec, sent: { ...rec.sent, gold: today } });
      sent++;
    } catch (e) {
      if ([404, 410].includes((e as { statusCode?: number }).statusCode ?? 0)) {
        await store.delete(key);
        gone++;
      }
    }
  }
  return new Response(JSON.stringify({ sent, gone, checked: blobs.length }), { headers: { 'content-type': 'application/json' } });
};

// 03:45 UTC = 9:15 AM IST, after the morning price update
export const config: Config = { schedule: '45 3 * * *' };
