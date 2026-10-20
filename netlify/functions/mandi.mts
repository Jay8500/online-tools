import type { Config } from '@netlify/functions';

/**
 * data.gov.in refuses connections from servers outside India (Netlify functions and edge both get ECONNREFUSED),
 * so visitors' browsers (in India) fetch "Current Daily Price of Various Commodities from Various Markets (Mandi)"
 * directly — the API allows it (Access-Control-Allow-Origin: *). This endpoint only hands out the API key.
 * The key reads free public data only; if it is ever misused, generate a new one on data.gov.in and update
 * Netlify env DATA_GOV_IN_API_KEY (owner decision, 20 Oct 2026).
 *  GET /api/mandi → { key, resource }
 */
const RESOURCE = '9ef84268-d588-465a-a308-a864a43d0070';

export default async () => {
  const key = Netlify.env.get('DATA_GOV_IN_API_KEY')?.trim();
  if (!key) return json({ error: 'not-configured', reason: 'no-key' }, 503, 'no-store');
  return json({ key, resource: RESOURCE }, 200, 'public, max-age=3600', 'public, max-age=3600');
};

function json(body: unknown, status: number, cache: string, cdn?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'Cache-Control': cache };
  if (cdn) headers['Netlify-CDN-Cache-Control'] = cdn;
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/mandi' };
