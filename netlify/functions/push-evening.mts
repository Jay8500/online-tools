import { getStore } from '@netlify/blobs';
import type { Config } from '@netlify/functions';
import webpush from 'web-push';
import { payload, vapid, type Sub } from './push.mts';

/** A few friendly lines, one per weekday, so the reminder doesn't feel like the same robot every evening. */
const EVENING = [
  '🚶 Did you walk today? A 20-minute walk is about 2,000 steps — tap to count yours 👟',
  '👟 Evening walk time! Open the step counter and keep the streak going.',
  '🌇 Nice evening for a short walk — your steps and calories are one tap away.',
  '💪 Small walks add up. Track today’s steps with the Spread Apps step counter.',
  '🚶‍♀️ Walk after dinner? Count it — tap to start the step counter.',
  '🌿 10 minutes of walking clears the mind. Tap to count your steps.',
  '🎯 Did you reach your step goal today? Tap to check.',
];
const MORNING = [
  '🌅 Good morning! A short walk is a great start — tap to count your steps 👟',
  '🚶 Morning walk time. Open the step counter and set the pace for the day.',
  '☀️ Fresh air, fresh start — track this morning’s walk with Spread Apps.',
  '💪 Small walks add up. Start today’s steps now.',
  '🌿 10 minutes of walking clears the mind. Tap to count your steps.',
  '🎯 New day, new step goal — tap to start counting.',
  '👟 Ready for your morning walk? Your steps and calories are one tap away.',
];

/** Every 15 minutes: the walk reminder to devices whose chosen time (India) falls in this quarter hour (default 6 PM), once a day. */
export default async () => {
  if (!vapid()) return new Response('VAPID keys missing', { status: 500 });
  const store = getStore({ name: 'push', consistency: 'strong' });
  const ist = new Date(Date.now() + 5.5 * 3600_000), today = ist.toISOString().slice(0, 10);
  const hour = ist.getUTCHours(), slot = hour * 60 + Math.floor(ist.getUTCMinutes() / 15) * 15;
  const body = (hour < 12 ? MORNING : EVENING)[ist.getUTCDay()];
  let sent = 0, gone = 0;
  const { blobs } = await store.list({ prefix: 's/' });
  for (const { key } of blobs) {
    const rec = (await store.get(key, { type: 'json' })) as Sub | null;
    if (!rec?.topics.includes('walk') || (rec.walkAt ?? 1080) !== slot || rec.sent?.['walk'] === today) continue;
    try {
      await webpush.sendNotification(rec.sub, payload(body, '/step-counter?utm_source=push', 'walk'), { TTL: 2 * 3600 });
      await store.setJSON(key, { ...rec, sent: { ...rec.sent, walk: today } });
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

// every quarter hour (India is UTC+5:30, so UTC quarters are India quarters too)
export const config: Config = { schedule: '*/15 * * * *' };
