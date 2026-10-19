import type { Config } from '@netlify/functions';

/**
 * Place name → coordinates (OpenRouteService geocoder, OpenStreetMap data), for "cinemas near me" distances.
 *  GET /api/geocode?q=Kukatpally&near=17.39,78.49   (near = optional focus point, e.g. the chosen city)
 * Only used when the typed place isn't in the built-in list. Key in Netlify env ORS_API_KEY; CDN-cached for a week.
 */
const ORS = 'https://api.openrouteservice.org';
const PLACE_RE = /^[\p{L}0-9 .,'()-]{2,80}$/u;
const NEAR_RE = /^-?\d{1,2}(\.\d+)?,-?\d{1,3}(\.\d+)?$/;

export default async (req: Request) => {
  const key = Netlify.env.get('ORS_API_KEY')?.trim();
  if (!key) return json({ error: 'not-configured' }, 503, 'no-store');
  const u = new URL(req.url);
  const q = (u.searchParams.get('q') ?? '').trim();
  const near = u.searchParams.get('near') ?? '';
  if (!PLACE_RE.test(q)) return json({ error: 'Type a place name using letters and numbers.' }, 400, 'no-store');

  let url = `${ORS}/geocode/search?api_key=${key}&text=${encodeURIComponent(q)}&boundary.country=IN&size=1`;
  if (NEAR_RE.test(near)) {
    const [lat, lon] = near.split(',');
    url += `&focus.point.lat=${lat}&focus.point.lon=${lon}`;
  }
  try {
    const r = await fetch(url);
    if (r.status === 401 || r.status === 403) return json({ error: 'not-configured' }, 503, 'no-store');
    if (!r.ok) return json({ error: 'Place search is busy. Please try again.' }, 502, 'no-store');
    const j = (await r.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: { label: string } }[] };
    const f = j.features?.[0];
    if (!f) return json({ error: `Couldn’t find “${q}”. Try a nearby area or landmark.` }, 404, 'public, max-age=3600', 'public, max-age=86400');
    const [lon, lat] = f.geometry.coordinates;
    return json({ name: f.properties.label.replace(/, India$/, ''), lat, lon }, 200, 'public, max-age=86400', 'public, max-age=604800');
  } catch {
    return json({ error: 'Place search is busy. Please try again.' }, 502, 'no-store');
  }
};

function json(body: unknown, status: number, cache: string, cdn?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'Cache-Control': cache };
  if (cdn) headers['Netlify-CDN-Cache-Control'] = cdn;
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/geocode' };
