import type { Config } from '@netlify/functions';

/**
 * Weather proxy for the /weather page (OpenWeatherMap free plan).
 *  GET /api/weather?city=Hyderabad         or   ?lat=17.38&lon=78.48
 * The API key stays on the server (Netlify env OPENWEATHER_API_KEY). Responses are cached on the CDN for
 * 20 minutes per city / rounded location, which keeps us far inside the free quota.
 */
const OWM = 'https://api.openweathermap.org';
const CITY_RE = /^[\p{L} .'-]{2,60}$/u;

export default async (req: Request) => {
  const key = Netlify.env.get('OPENWEATHER_API_KEY');
  if (!key) return json({ error: 'not-configured', reason: 'no-key' }, 503, 'no-store');

  const url = new URL(req.url);
  const city = (url.searchParams.get('city') ?? '').trim();
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  let where: string;
  if (city) {
    if (!CITY_RE.test(city)) return json({ error: 'Enter a city name using letters only.' }, 400, 'no-store');
    where = `q=${encodeURIComponent(city)},IN`;
  } else if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    // ~1 km rounding: better cache hits and we never pass an exact location on
    where = `lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;
  } else {
    return json({ error: 'Choose a city or allow location.' }, 400, 'no-store');
  }

  const q = `${where}&units=metric&appid=${key}`;
  try {
    const [cur, fc] = await Promise.all([fetch(`${OWM}/data/2.5/weather?${q}`), fetch(`${OWM}/data/2.5/forecast?${q}`)]);
    if (cur.status === 404) return json({ error: 'City not found. Check the spelling, e.g. Visakhapatnam.' }, 404, 'public, max-age=300');
    // Key present but OpenWeather refuses it (new keys take up to 2 h to activate)
    if (cur.status === 401) return json({ error: 'not-configured', reason: 'key-rejected' }, 503, 'no-store');
    if (!cur.ok || !fc.ok) return json({ error: 'Weather service is busy. Please try again in a minute.' }, 502, 'no-store');
    const c = (await cur.json()) as OwmCurrent;
    const f = (await fc.json()) as { list: OwmItem[]; city: { timezone: number } };
    return json(shape(c, f), 200, 'public, max-age=300', 'public, s-maxage=1200, stale-while-revalidate=600');
  } catch {
    return json({ error: 'Weather service is not reachable. Please try again.' }, 502, 'no-store');
  }
};

interface OwmCurrent {
  name: string;
  dt: number;
  timezone: number;
  main: { temp: number; feels_like: number; humidity: number; temp_min: number; temp_max: number; pressure: number };
  weather: { main: string; description: string; icon: string }[];
  wind: { speed: number };
  visibility?: number;
  clouds?: { all: number };
  rain?: { '1h'?: number };
  sys: { sunrise: number; sunset: number };
}
interface OwmItem {
  dt: number;
  main: { temp_min: number; temp_max: number; humidity: number };
  weather: { main: string; description: string; icon: string }[];
  pop: number;
  rain?: { '3h'?: number };
}

/** Only the fields the page needs; daily min/max built from 3-hour steps in the city's local time. */
function shape(c: OwmCurrent, f: { list: OwmItem[]; city: { timezone: number } }) {
  const tz = f.city.timezone;
  const days = new Map<string, { date: string; min: number; max: number; pop: number; rain: number; icon: string; text: string }>();
  for (const it of f.list) {
    const local = new Date((it.dt + tz) * 1000);
    const date = local.toISOString().slice(0, 10);
    const hour = local.getUTCHours();
    const d = days.get(date) ?? { date, min: Infinity, max: -Infinity, pop: 0, rain: 0, icon: it.weather[0].icon, text: it.weather[0].description };
    d.min = Math.min(d.min, it.main.temp_min);
    d.max = Math.max(d.max, it.main.temp_max);
    d.pop = Math.max(d.pop, it.pop);
    d.rain += it.rain?.['3h'] ?? 0;
    if (hour >= 11 && hour <= 14) {
      d.icon = it.weather[0].icon;
      d.text = it.weather[0].description;
    }
    days.set(date, d);
  }
  return {
    place: c.name,
    updated: c.dt,
    tz: c.timezone,
    now: {
      temp: c.main.temp,
      feels: c.main.feels_like,
      humidity: c.main.humidity,
      wind: c.wind.speed,
      text: c.weather[0]?.description ?? '',
      icon: c.weather[0]?.icon ?? '01d',
      clouds: c.clouds?.all ?? 0,
      rain1h: c.rain?.['1h'] ?? 0,
      visibility: c.visibility ?? null,
      sunrise: c.sys.sunrise,
      sunset: c.sys.sunset,
    },
    hours: f.list.slice(0, 8).map((it) => ({ t: it.dt, temp: it.main.temp_max, icon: it.weather[0].icon, pop: it.pop })),
    days: [...days.values()].slice(0, 5).map((d) => ({ ...d, min: Math.round(d.min), max: Math.round(d.max), rain: +d.rain.toFixed(1) })),
  };
}

function json(body: unknown, status: number, cache: string, cdn?: string) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'Cache-Control': cache };
  if (cdn) headers['Netlify-CDN-Cache-Control'] = cdn;
  return new Response(JSON.stringify(body), { status, headers });
}

export const config: Config = { path: '/api/weather' };
