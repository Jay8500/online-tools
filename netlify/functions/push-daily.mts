import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import webpush from 'web-push';
import { festivalNear } from '../../src/app/core/celebrate.ts';
import { payload, vapid, type Sub } from './push.mts';

const LABEL: Record<string, string> = { gold22PerG: 'Gold 22K', gold24PerG: 'Gold 24K', silverPerKg: 'Silver' };
const UNIT: Record<string, string> = { gold22PerG: '/g', gold24PerG: '/g', silverPerKg: '/kg' };
const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
/** Festivals that have a card in the wishes maker. */
const WISH: [RegExp, string][] = [
  [/diwali|deepavali/i, 'diwali'],
  [/christmas/i, 'christmas'],
  [/new year/i, 'newyear'],
  [/sankranti|pongal/i, 'sankranti'],
  [/ugadi|gudi padwa/i, 'ugadi'],
  [/fitr|ramzan/i, 'ramzan'],
  [/dussehra|dasara|vijaya/i, 'dasara'],
];
/** A morning headline should not be a tragedy pushed to someone's lock screen. */
const SAD = /dead|death|dies|died|kill|murder|suicide|rape|accident|shot|crash|body|assault|attack|blast|injur|arrest|fire|drown|missing/i;
const short = (t: string, n = 110) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

type Msg = { body: string; url: string } | null;

/**
 * Every morning (9:15 AM IST): at most one push per topic per device —
 * gold/silver target reached · new TGPSC notice · festival in 2 days (make a card) · one calm news headline.
 */
export default async (_req: Request, context: Context) => {
  if (!vapid()) return new Response('VAPID keys missing', { status: 500 });
  const store = getStore({ name: 'push', consistency: 'strong' });
  const site = context.site?.url || 'https://tools.spreadapps.in';
  const get = async (p: string) => (await fetch(new URL(p, site))).json().catch(() => null);
  const ist = new Date(Date.now() + 5.5 * 3600_000), today = ist.toISOString().slice(0, 10);

  // ---- one message per topic for everybody (gold is per device) ----
  const prices = ((await get('/api/metals')) ?? {}) as Record<string, number>;

  let jobs: Msg = null;
  const notices = ((await get('/api/jobs'))?.items ?? []) as { title: string; link: string }[];
  if (notices.length) {
    const seen = new Set(((await store.get('state/jobs', { type: 'json' })) as string[] | null) ?? []);
    const fresh = notices.filter((n) => !seen.has(n.title));
    if (seen.size && fresh.length) jobs = { body: fresh.length === 1 ? `🏛️ New TGPSC notice: ${short(fresh[0].title, 90)}` : `🏛️ ${fresh.length} new TGPSC notices — tap to see them`, url: '/govt-job-notifications?utm_source=push' };
    await store.setJSON('state/jobs', [...new Set([...notices.map((n) => n.title), ...seen])].slice(0, 200)); // first run only remembers
  }

  let festival: Msg = null;
  const near = festivalNear(2, ist);
  const wish = near && near.inDays === 2 && near.f.mood === 'celebrate' ? WISH.find(([re]) => re.test(near.f.name))?.[1] : undefined;
  if (near && wish) festival = { body: `${near.f.art} ${near.f.name} is in 2 days — make your wishes card with your name and photo ✨`, url: `/festival-wishes-card?fest=${wish}&utm_source=push` };

  let news: Msg = null;
  const head = (((await get('/api/news'))?.items ?? []) as { title: string }[]).find((n) => !SAD.test(n.title));
  if (head) news = { body: `📰 ${short(head.title)}`, url: '/?news=1&utm_source=push' };

  // ---- send ----
  let sent = 0, gone = 0;
  const { blobs } = await store.list({ prefix: 's/' });
  for (const { key } of blobs) {
    const rec = (await store.get(key, { type: 'json' })) as Sub | null;
    if (!rec) continue;
    const out: [string, Msg][] = [];
    if (rec.topics.includes('gold') && rec.gold) {
      const now = prices[rec.gold.metal];
      if (now > 0 && now <= rec.gold.below) out.push(['gold', { body: `🥇 ${LABEL[rec.gold.metal]} is ₹${INR.format(now)}${UNIT[rec.gold.metal]} — your ₹${INR.format(rec.gold.below)} target is here!`, url: '/gold-price-calculator?utm_source=push' }]);
    }
    if (rec.topics.includes('jobs')) out.push(['jobs', jobs]);
    if (rec.topics.includes('festival')) out.push(['festival', festival]);
    if (rec.topics.includes('news')) out.push(['news', news]);
    const sentNow: Record<string, string> = {};
    let dead = false;
    for (const [topic, m] of out) {
      if (!m || rec.sent?.[topic] === today) continue;
      try {
        await webpush.sendNotification(rec.sub, payload(m.body, m.url, topic), { TTL: 6 * 3600 });
        sentNow[topic] = today;
        sent++;
      } catch (e) {
        if ([404, 410].includes((e as { statusCode?: number }).statusCode ?? 0)) {
          await store.delete(key);
          gone++;
          dead = true;
          break;
        }
      }
    }
    if (!dead && Object.keys(sentNow).length) await store.setJSON(key, { ...rec, sent: { ...rec.sent, ...sentNow } });
  }
  return new Response(JSON.stringify({ sent, gone, checked: blobs.length, jobs: !!jobs, festival: !!festival, news: !!news }), { headers: { 'content-type': 'application/json' } });
};

// 03:45 UTC = 9:15 AM IST, after the morning price update
export const config: Config = { schedule: '45 3 * * *' };
