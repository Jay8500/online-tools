// Builds src/app/core/cinema-data.ts from OpenStreetMap exports. To refresh (a few times a year):
//   curl --data-urlencode data@scripts/cinemas/cinemas.overpassql https://overpass-api.de/api/interpreter -o scripts/cinemas/raw.json
//   curl --data-urlencode data@scripts/cinemas/places.overpassql https://overpass-api.de/api/interpreter -o scripts/cinemas/places.json
//   node scripts/cinemas/build-cinemas.cjs src/app/core/cinema-data.ts
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const raw = JSON.parse(fs.readFileSync(path.join(dir, 'raw.json'), 'utf8')).elements;
const places = JSON.parse(fs.readFileSync(path.join(dir, 'places.json'), 'utf8')).elements;

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
const km = (a, b) => {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const HYD = { lat: 17.385, lon: 78.487 };
// Our built-in city list (src/app/core/places.ts) gives clean city + state names
const CITY = [...fs.readFileSync(path.join(dir, '../../src/app/core/places.ts'), 'utf8').matchAll(/name: '([^']+)', state: '([^']+)', lat: ([\d.]+), lon: ([\d.]+)/g)]
  .map((m) => ({ name: m[1], state: m[2], lat: +m[3], lon: +m[4] }))
  .filter((c) => c.state === 'Telangana' || c.state === 'Andhra Pradesh');
const latin = (s) => s && /^[\x20-\x7E–’]+$/.test(s);
const nm = (t) => (latin(t.name) ? t.name : t['name:en'] || null);

const local = places.filter((p) => /suburb|quarter|neighbourhood/.test(p.tags.place) && nm(p.tags));
const towns = places.filter((p) => /city|town/.test(p.tags.place) && nm(p.tags));
const near = (pt, list, max) => {
  let best = null;
  let d = max;
  for (const p of list) {
    const k = km(pt, p);
    if (k < d) (d = k), (best = p);
  }
  return best;
};

// State from the place nodes is not tagged; split by the TS/AP border using the nearest town's addr if any — fallback: AP if south/east of Telangana's main towns
const TS_TOWNS = new Set();
const seen = new Set();
const out = [];
for (const e of raw) {
  const t = e.tags;
  const name = nm(t)?.split(';')[0].trim();
  const lat = e.lat ?? e.center?.lat;
  const lon = e.lon ?? e.center?.lon;
  if (!name || lat == null) continue;
  const pt = { lat, lon };
  const key = `${name}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const inHyd = km(pt, HYD) < 25;
  const town = near(pt, towns, 25);
  const big = near(pt, CITY, 12);
  const city = inHyd ? 'Hyderabad' : big ? big.name : town ? nm(town.tags) : t['addr:city'] && latin(t['addr:city']) ? t['addr:city'].trim() : '';
  const state = (inHyd ? 'Telangana' : near(pt, CITY, 999).state) === 'Telangana' ? 'TS' : 'AP';
  const loc = near(pt, local, 2.5);
  if (!city) continue;
  let area = (latin(t['addr:suburb']) && t['addr:suburb']) || (loc ? nm(loc.tags) : '') || (latin(t['addr:street']) ? t['addr:street'] : '');
  if (area && city && area.toLowerCase() === city.toLowerCase()) area = '';
  out.push([name.replace(/\s+/g, ' ').trim(), area, city || '', +lat.toFixed(5), +lon.toFixed(5), state]);
}
out.sort((a, b) => a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]));

// Place names users can type (resolved on the device, no API): Hyderabad localities + all towns/cities near a cinema
const pl = new Map();
for (const p of [...towns, ...local.filter((p) => km(p, HYD) < 35)]) {
  const n = nm(p.tags);
  if (!pl.has(n.toLowerCase())) pl.set(n.toLowerCase(), [n, +p.lat.toFixed(4), +p.lon.toFixed(4)]);
}
const placesOut = [...pl.values()].sort((a, b) => a[0].localeCompare(b[0]));

const today = new Date().toISOString().slice(0, 10);
const ts = `/**
 * Cinemas in Telangana & Andhra Pradesh and place names for distance search.
 * Generated from OpenStreetMap (© OpenStreetMap contributors, ODbL) on ${today} — do not edit by hand.
 */
/** [name, area, city, lat, lon, state] */
export type CinemaRow = [string, string, string, number, number, 'TS' | 'AP'];
/** [name, lat, lon] */
export type PlaceRow = [string, number, number];

export const CINEMAS_AS_OF = '${today}';

export const CINEMAS: CinemaRow[] = ${JSON.stringify(out)};

export const PLACES: PlaceRow[] = ${JSON.stringify(placesOut)};
`;
fs.writeFileSync(process.argv[2], ts);
const byCity = {};
out.forEach((r) => (byCity[r[2] || '?'] = (byCity[r[2] || '?'] || 0) + 1));
console.log('cinemas', out.length, 'places', placesOut.length, 'bytes', ts.length);
console.log(Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 25));
console.log(out.filter((r) => r[2] === 'Hyderabad').slice(0, 15));
