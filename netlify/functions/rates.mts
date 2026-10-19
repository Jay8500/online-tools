import type { Config } from '@netlify/functions';
import { readRates, updateRates } from '../lib/rates';

/**
 * GET  /api/rates                         → latest daily fuel & egg rates (CDN-cached 10 min)
 * POST /api/rates?key=STATS_KEY           → owner-only: refresh now (normally the 7 am schedule does it)
 */
export default async (req: Request) => {
  if (req.method === 'POST') {
    const key = new URL(req.url).searchParams.get('key') ?? '';
    const secret = Netlify.env.get('STATS_KEY')?.trim() ?? '';
    if (!secret || key !== secret) return json({ error: 'Forbidden' }, 403, 'no-store');
    const r = await updateRates();
    return json({ ok: true, fuelCities: r.fuel.length, eggCities: r.eggs.length, fuelDate: r.fuelDate, eggDate: r.eggDate, errors: r.errors }, 200, 'no-store');
  }
  const r = await readRates();
  if (!r) return json({ error: 'not-ready' }, 503, 'no-store');
  return json(r, 200, 'public, max-age=300', 'public, s-maxage=600, stale-while-revalidate=3600');
};

function json(body: unknown, status: number, cache: string, cdn?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'Cache-Control': cache };
  if (cdn) headers['Netlify-CDN-Cache-Control'] = cdn;
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/rates' };
