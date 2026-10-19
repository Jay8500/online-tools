import type { Config } from '@netlify/functions';

/**
 * Road / walking / cycling route with towns along the way (OpenRouteService free plan, OpenStreetMap data).
 *  GET /api/route?from=Hyderabad&to=Vijayawada&mode=car|bike|bus|walk|cycle
 * Key in Netlify env ORS_API_KEY. Routes rarely change, so responses are CDN-cached for a day.
 * Each new route uses 2 geocodes + 1 directions + up to 5 reverse lookups (free plan: 1,000 geocodes / 2,000 routes a day).
 */
const ORS = 'https://api.openrouteservice.org';
const PLACE_RE = /^[\p{L}0-9 .,'()-]{2,80}$/u;
const PROFILE: Record<string, string> = { car: 'driving-car', bike: 'driving-car', bus: 'driving-car', walk: 'foot-walking', cycle: 'cycling-regular' };
/** ORS gives car-like times; buses and bikes in India are slower on average. */
const SLOWER: Record<string, number> = { bus: 1.25, bike: 1.1 };

export default async (req: Request) => {
  const key = Netlify.env.get('ORS_API_KEY');
  if (!key) return json({ error: 'not-configured', reason: 'no-key' }, 503, 'no-store');
  const u = new URL(req.url);
  const from = (u.searchParams.get('from') ?? '').trim();
  const to = (u.searchParams.get('to') ?? '').trim();
  const mode = u.searchParams.get('mode') ?? 'car';
  if (!PLACE_RE.test(from) || !PLACE_RE.test(to)) return json({ error: 'Enter both places using letters and numbers.' }, 400, 'no-store');
  if (!PROFILE[mode]) return json({ error: 'Choose car, bike, bus, walk or cycle.' }, 400, 'no-store');

  try {
    const [a, b] = await Promise.all([geocode(from, key), geocode(to, key)]);
    if (!a) return json({ error: `Couldn’t find “${from}”. Try adding the district, e.g. “Gachibowli, Hyderabad”.` }, 404, 'public, max-age=300');
    if (!b) return json({ error: `Couldn’t find “${to}”. Try adding the district.` }, 404, 'public, max-age=300');

    const r = await fetch(`${ORS}/v2/directions/${PROFILE[mode]}/geojson`, {
      method: 'POST',
      headers: { Authorization: key, 'content-type': 'application/json' },
      body: JSON.stringify({ coordinates: [a.coord, b.coord], instructions: true, language: 'en', units: 'km' }),
    });
    if (r.status === 401 || r.status === 403) return json({ error: 'not-configured', reason: 'key-rejected' }, 503, 'no-store');
    if (r.status === 429) return json({ error: 'Too many route requests right now. Please try again in a minute.' }, 429, 'no-store');
    if (!r.ok) {
      const t = await r.text();
      if (/distance|exceed/i.test(t)) return json({ error: 'This route is too long for walking or cycling. Try car or bus.' }, 400, 'public, max-age=3600');
      return json({ error: 'No road route found between these places.' }, 404, 'public, max-age=3600');
    }
    const g = (await r.json()) as RouteGeo;
    const f = g.features[0];
    const coords = f.geometry.coordinates;
    const seg = f.properties.segments[0];
    const factor = SLOWER[mode] ?? 1;
    const km = f.properties.summary.distance;
    const sec = f.properties.summary.duration * factor;

    // Cumulative km at each geometry point, to place towns along the way
    const cum = [0];
    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + hav(coords[i - 1], coords[i]));
    const scale = km / (cum[cum.length - 1] || 1);
    const samples = [0.17, 0.33, 0.5, 0.67, 0.83].map((p) => Math.floor(p * (coords.length - 1)));
    const towns = await Promise.all(samples.map((i) => reverse(coords[i], key)));
    const seen = new Set([a.name.split(',')[0], b.name.split(',')[0]]);
    const stops = samples
      .map((i, k) => ({ name: towns[k], km: Math.round(cum[i] * scale), min: Math.round(((cum[i] * scale) / km) * (sec / 60)) }))
      .filter((s) => s.name && !seen.has(s.name) && seen.add(s.name));

    // Thin the line to ≤ 300 points for the sketch
    const step = Math.max(1, Math.ceil(coords.length / 300));
    const line = coords.filter((_, i) => i % step === 0 || i === coords.length - 1).map(([lon, lat]) => [+lon.toFixed(4), +lat.toFixed(4)]);
    const roads = [...new Set(seg.steps.map((s) => s.name).filter((n) => n && n !== '-' && /^(NH|SH|AH|ORR|[A-Z]{1,3}\s?\d)/.test(n)))].slice(0, 6);

    return json(
      {
        from: a.name,
        to: b.name,
        mode,
        km: +km.toFixed(1),
        minutes: Math.round(sec / 60),
        stops,
        roads,
        line,
        steps: seg.steps.slice(0, 60).map((s) => ({ text: s.instruction, km: +s.distance.toFixed(1) })),
      },
      200,
      'public, max-age=3600',
      'public, s-maxage=86400, stale-while-revalidate=86400',
    );
  } catch {
    return json({ error: 'The route service is not reachable. Please try again.' }, 502, 'no-store');
  }
};

interface RouteGeo {
  features: {
    geometry: { coordinates: [number, number][] };
    properties: { summary: { distance: number; duration: number }; segments: { steps: { instruction: string; name: string; distance: number }[] }[] };
  }[];
}

async function geocode(text: string, key: string): Promise<{ coord: [number, number]; name: string } | null> {
  const r = await fetch(`${ORS}/geocode/search?api_key=${key}&text=${encodeURIComponent(text)}&boundary.country=IN&size=1`);
  if (!r.ok) return null;
  const j = (await r.json()) as { features: { geometry: { coordinates: [number, number] }; properties: { label: string } }[] };
  const f = j.features?.[0];
  return f ? { coord: f.geometry.coordinates, name: f.properties.label.replace(/, India$/, '') } : null;
}

async function reverse([lon, lat]: [number, number], key: string): Promise<string> {
  try {
    const r = await fetch(`${ORS}/geocode/reverse?api_key=${key}&point.lon=${lon}&point.lat=${lat}&size=1&layers=locality,localadmin,county`);
    if (!r.ok) return '';
    const j = (await r.json()) as { features: { properties: { locality?: string; localadmin?: string; county?: string; name?: string } }[] };
    const p = j.features?.[0]?.properties;
    return p?.locality || p?.localadmin || p?.county || p?.name || '';
  } catch {
    return '';
  }
}

function hav(a: [number, number], b: [number, number]) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b[1] - a[1]) / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function json(body: unknown, status: number, cache: string, cdn?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'Cache-Control': cache };
  if (cdn) headers['Netlify-CDN-Cache-Control'] = cdn;
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/route' };
