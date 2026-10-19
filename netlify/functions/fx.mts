import type { Config } from '@netlify/functions';

/**
 * Currency rates for the converter: open.er-api.com (free, commercial use allowed with attribution, updates daily).
 *  GET /api/fx → { base: 'USD', updated, rates: { INR: 83.1, AED: 3.67, … } } — trimmed to the currencies the page offers.
 * CDN-cached for an hour, so one upstream call serves every visitor.
 */
const KEEP = ['USD', 'INR', 'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'GBP', 'EUR', 'CAD', 'AUD', 'NZD', 'SGD', 'MYR', 'THB', 'JPY', 'CNY', 'HKD', 'CHF', 'ZAR', 'LKR', 'NPR', 'BDT', 'IDR', 'PHP', 'KRW', 'SEK', 'RUB', 'TRY'];

export default async () => {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(String(r.status));
    const j = (await r.json()) as { result: string; rates: Record<string, number>; time_last_update_unix: number };
    if (j.result !== 'success' || !j.rates?.INR) throw new Error('bad data');
    const rates = Object.fromEntries(KEEP.filter((c) => j.rates[c]).map((c) => [c, j.rates[c]]));
    return json({ base: 'USD', updated: j.time_last_update_unix * 1000, rates }, 200, 'public, max-age=600', 'public, max-age=3600');
  } catch {
    return json({ error: 'Rates are busy. Please try again in a minute.' }, 502, 'no-store');
  }
};

function json(body: unknown, status: number, cache: string, cdn?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'Cache-Control': cache };
  if (cdn) headers['Netlify-CDN-Cache-Control'] = cdn;
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/fx' };
