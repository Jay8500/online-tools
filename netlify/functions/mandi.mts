import type { Config } from '@netlify/functions';

/**
 * Today's vegetable / grain prices from Rythu Bazars and APMC mandis (Government of India open data, data.gov.in:
 * "Current Daily Price of Various Commodities from Various Markets (Mandi)", Ministry of Agriculture).
 *  GET /api/mandi?state=Telangana   → { date, records: [{ d, m, c, v, min, max, modal }] }   (₹ per quintal)
 * Key in Netlify env DATA_GOV_IN_API_KEY. CDN-cached for 1 hour (the source updates once a day).
 */
const RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';
const STATES = ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra'];

export default async (req: Request) => {
  const key = Netlify.env.get('DATA_GOV_IN_API_KEY')?.trim();
  if (!key) return json({ error: 'not-configured', reason: 'no-key' }, 503, 'no-store');
  const state = new URL(req.url).searchParams.get('state') ?? 'Telangana';
  if (!STATES.includes(state)) return json({ error: 'Choose a state from the list.' }, 400, 'no-store');

  try {
    const records: Raw[] = [];
    // The API pages results; 1,000 rows a call is plenty for one state's daily data.
    for (let offset = 0; offset < 3000; offset += 1000) {
      const u = `https://api.data.gov.in/resource/${RESOURCE}?api-key=${key}&format=json&limit=1000&offset=${offset}&filters%5Bstate.keyword%5D=${encodeURIComponent(state)}`;
      const r = await fetch(u);
      if (r.status === 401 || r.status === 403) return json({ error: 'not-configured', reason: 'key-rejected' }, 503, 'no-store');
      if (!r.ok) throw new Error(String(r.status));
      const j = (await r.json()) as { records?: Raw[] };
      const page = j.records ?? [];
      records.push(...page);
      if (page.length < 1000) break;
    }
    if (!records.length) return json({ error: 'No prices published for this state today yet. Please check again later.' }, 404, 'public, max-age=600');
    const slim = records
      .map((r) => ({ d: r.district, m: tidy(r.market), c: r.commodity, v: r.variety, date: r.arrival_date, min: +r.min_price, max: +r.max_price, modal: +r.modal_price }))
      .filter((r) => r.modal > 0);
    const latest = slim.map((r) => r.date).sort((a, b) => toIso(b).localeCompare(toIso(a)))[0];
    return json({ state, date: latest, records: slim }, 200, 'public, max-age=600', 'public, s-maxage=3600, stale-while-revalidate=7200');
  } catch {
    return json({ error: 'The government price service is not reachable right now. Please try again later.' }, 502, 'no-store');
  }
};

interface Raw {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
}

/** "RYTHU BAZAR FALAKNUMA" → "Rythu Bazar Falaknuma" */
function tidy(s: string) {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bRbz\b/g, 'Rythu Bazar').replace(/\bApmc\b/g, 'APMC');
}

/** dd/mm/yyyy → yyyy-mm-dd */
function toIso(d: string) {
  const [dd, mm, yy] = d.split('/');
  return `${yy}-${mm}-${dd}`;
}

function json(body: unknown, status: number, cache: string, cdn?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'Cache-Control': cache };
  if (cdn) headers['Netlify-CDN-Cache-Control'] = cdn;
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/mandi' };
