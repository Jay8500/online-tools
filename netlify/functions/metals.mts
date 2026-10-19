import type { Config } from '@netlify/functions';

/**
 * Live gold & silver — India estimate.
 *  GET /api/metals → { gold24PerG, gold22PerG, silverPerKg, … }
 * International spot (gold-api.com, free, commercial use allowed) × USD→INR (open.er-api.com, daily)
 * + India import duty 15% (10% BCD + 5% AIDC, from 13 May 2026). GST 3% shown separately.
 * CDN-cached for 60 s, so all visitors share one upstream call a minute.
 */
const OZ = 31.1034768;
const IMPORT_DUTY = 0.15;
const GST = 0.03;

export default async () => {
  try {
    const [g, s, fx] = await Promise.all([
      getJson<{ price: number; updatedAt: string }>('https://api.gold-api.com/price/XAU'),
      getJson<{ price: number; updatedAt: string }>('https://api.gold-api.com/price/XAG'),
      getJson<{ result: string; rates: Record<string, number>; time_last_update_utc: string }>('https://open.er-api.com/v6/latest/USD'),
    ]);
    const inr = fx.rates?.INR;
    if (!(g.price > 0) || !(s.price > 0) || !(inr > 0)) throw new Error('bad data');
    const perG = (usdPerOz: number) => (usdPerOz * inr) / OZ;
    const gold24 = perG(g.price) * (1 + IMPORT_DUTY);
    const silverG = perG(s.price) * (1 + IMPORT_DUTY);
    const r = (n: number) => Math.round(n);
    return json(
      {
        updatedAt: g.updatedAt,
        usdInr: +inr.toFixed(2),
        fxUpdated: fx.time_last_update_utc,
        spotUsd: { gold: +g.price.toFixed(2), silver: +s.price.toFixed(3) },
        dutyPct: IMPORT_DUTY * 100,
        gstPct: GST * 100,
        gold24PerG: r(gold24),
        gold22PerG: r(gold24 * 0.916),
        gold18PerG: r(gold24 * 0.75),
        silverPerG: +silverG.toFixed(2),
        silverPerKg: r(silverG * 1000),
      },
      200,
      'public, max-age=30',
      'public, s-maxage=60, stale-while-revalidate=120',
    );
  } catch {
    return json({ error: 'Live prices are not available right now. Please try again shortly.' }, 502, 'no-store');
  }
};

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return (await r.json()) as T;
}

function json(body: unknown, status: number, cache: string, cdn?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'Cache-Control': cache };
  if (cdn) headers['Netlify-CDN-Cache-Control'] = cdn;
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/metals' };
