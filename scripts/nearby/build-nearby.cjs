// Builds src/app/core/nearby-police.ts and nearby-fuel.ts from OpenStreetMap exports. To refresh (a few times a year):
//   curl --data-urlencode data@scripts/nearby/pois.overpassql https://overpass-api.de/api/interpreter -o scripts/nearby/q.json
//   curl --data-urlencode data@scripts/nearby/places.overpassql https://overpass-api.de/api/interpreter -o scripts/nearby/qp.json
//   node scripts/nearby/build-nearby.cjs
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const root = path.join(dir, '../..');
const pois = JSON.parse(fs.readFileSync(path.join(dir, 'q.json'), 'utf8')).elements;
const places = JSON.parse(fs.readFileSync(path.join(dir, 'qp.json'), 'utf8')).elements;

const rad = (d) => (d * Math.PI) / 180;
const km = (a, b) => 2 * 6371 * Math.asin(Math.sqrt(Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2));
const HYD = { lat: 17.385, lon: 78.487 };
const latin = (s) => !!s && /^[\x20-\x7E–’]+$/.test(s);
const nm = (t) => (latin(t.name) ? t.name : latin(t['name:en']) ? t['name:en'] : null);
const CITY = [...fs.readFileSync(path.join(root, 'src/app/core/places.ts'), 'utf8').matchAll(/name: '([^']+)', state: '([^']+)', lat: ([\d.]+), lon: ([\d.]+)/g)]
  .map((m) => ({ name: m[1], state: m[2], lat: +m[3], lon: +m[4] }))
  .filter((c) => c.state === 'Telangana' || c.state === 'Andhra Pradesh');

// Grid index so 3,800 points × 37,000 places stays fast
const cell = (lat, lon) => `${Math.floor(lat * 10)}|${Math.floor(lon * 10)}`;
const grid = new Map();
for (const p of places) {
  if (!nm(p.tags)) continue;
  const k = cell(p.lat, p.lon);
  if (!grid.has(k)) grid.set(k, []);
  grid.get(k).push(p);
}
function nearPlace(pt, kinds, max) {
  let best = null;
  let d = max;
  const la = Math.floor(pt.lat * 10);
  const lo = Math.floor(pt.lon * 10);
  for (let i = -3; i <= 3; i++)
    for (let j = -3; j <= 3; j++)
      for (const p of grid.get(`${la + i}|${lo + j}`) ?? []) {
        if (!kinds.test(p.tags.place)) continue;
        const k = km(pt, p);
        if (k < d) (d = k), (best = p);
      }
  return best;
}
const nearCity = (pt, max) => {
  let best = null;
  let d = max;
  for (const c of CITY) {
    const k = km(pt, c);
    if (k < d) (d = k), (best = c);
  }
  return best;
};

const BRANDS = [
  [/jio[- ]?bp|reliance/i, 'Jio-bp'],
  [/indian ?oil|\bindian\b|iocl?\b|servo/i, 'Indian Oil'],
  [/\bhp\b|hindustan petroleum|hpcl/i, 'HP'],
  [/bharat|bpcl|\bbp\b/i, 'Bharat Petroleum'],
  [/nayara|essar/i, 'Nayara'],
  [/shell/i, 'Shell'],
];
const brandOf = (t) => {
  const s = [t.brand, t.operator, t.name, t['brand:en']].filter(latin).join(' ');
  return BRANDS.find(([re]) => re.test(s))?.[1] ?? '';
};

function build(amenity) {
  const out = [];
  const seen = new Set();
  for (const e of pois) {
    const t = e.tags;
    if (t.amenity !== amenity) continue;
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (lat == null) continue;
    const pt = { lat, lon };
    const brand = amenity === 'fuel' ? brandOf(t) : '';
    let name = nm(t)?.split(';')[0].trim().replace(/\s+/g, ' ');
    if (!name) name = amenity === 'fuel' ? (brand ? `${brand} petrol bunk` : 'Petrol bunk') : 'Police station';
    const key = `${name}|${lat.toFixed(3)}|${lon.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const inHyd = km(pt, HYD) < 25;
    const big = nearCity(pt, 12);
    const town = nearPlace(pt, /^(city|town)$/, 20);
    const village = nearPlace(pt, /^village$/, 4);
    const city = inHyd ? 'Hyderabad' : big ? big.name : town ? nm(town.tags) : village ? nm(village.tags) : '';
    if (!city) continue;
    const loc = nearPlace(pt, /^(suburb|quarter|neighbourhood|village)$/, 2.5);
    let area = (latin(t['addr:suburb']) && t['addr:suburb']) || (loc ? nm(loc.tags) : '') || (latin(t['addr:street']) ? t['addr:street'] : '');
    if (area && area.toLowerCase() === city.toLowerCase()) area = '';
    const state = inHyd ? 'TS' : nearCity(pt, 9999).state === 'Telangana' ? 'TS' : 'AP';
    const phone = latin(t.phone) ? t.phone.replace(/[^\d+ ]/g, '').trim().slice(0, 20) : latin(t['contact:phone']) ? t['contact:phone'].replace(/[^\d+ ]/g, '').trim().slice(0, 20) : '';
    const h24 = t.opening_hours === '24/7' ? 1 : 0;
    out.push([name, area, city, +lat.toFixed(5), +lon.toFixed(5), state, brand, phone, h24]);
  }
  return out.sort((a, b) => a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]));
}

const today = new Date().toISOString().slice(0, 10);
for (const [amenity, file, label] of [
  ['police', 'nearby-police.ts', 'Police stations'],
  ['fuel', 'nearby-fuel.ts', 'Petrol bunks'],
]) {
  const rows = build(amenity);
  const ts = `/**
 * ${label} in Telangana & Andhra Pradesh. Generated from OpenStreetMap (© OpenStreetMap contributors, ODbL) on ${today} by scripts/nearby/build-nearby.cjs — do not edit by hand.
 * Row: [name, area, city, lat, lon, state, brand, phone, open24h]
 */
import type { NearbyRow } from './nearby';

export const AS_OF = '${today}';
export const ROWS: NearbyRow[] = ${JSON.stringify(rows)};
`;
  fs.writeFileSync(path.join(root, 'src/app/core', file), ts);
  const byCity = {};
  rows.forEach((r) => (byCity[r[2]] = (byCity[r[2]] || 0) + 1));
  console.log(amenity, rows.length, 'bytes', ts.length, Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 8));
}
