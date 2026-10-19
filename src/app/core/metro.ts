import { METRO_LINES, type MetroLine } from './metro-data';

/**
 * Hyderabad Metro fares (after the 10% cut of 24 May 2025): distance bands, token and smart card.
 * Source: published HMRL fare chart as listed on city-rails.com and yometro.com (both agree). Check at the station.
 */
export const FARE_BANDS: { upToKm: number; token: number; card: number }[] = [
  { upToKm: 2, token: 11, card: 10 },
  { upToKm: 4, token: 17, card: 15 },
  { upToKm: 6, token: 28, card: 25 },
  { upToKm: 9, token: 37, card: 33 },
  { upToKm: 12, token: 47, card: 42 },
  { upToKm: 15, token: 51, card: 46 },
  { upToKm: 18, token: 56, card: 50 },
  { upToKm: 21, token: 61, card: 55 },
  { upToKm: 24, token: 65, card: 59 },
  { upToKm: Infinity, token: 69, card: 62 },
];

export function fareFor(km: number) {
  return FARE_BANDS.find((b) => km <= b.upToKm)!;
}

export interface StationRef {
  line: MetroLine['id'];
  name: string;
}

/** Station names that appear on two lines. */
export const INTERCHANGES = ['Ameerpet', 'Mahatma Gandhi Bus Station', 'Parade Grounds'];

export interface Leg {
  line: MetroLine;
  from: string;
  to: string;
  km: number;
  stops: string[]; // stations passed, including both ends
}

export interface Journey {
  km: number;
  legs: Leg[];
  stops: number; // stations travelled (not counting the start)
  minutes: number;
  token: number;
  card: number;
}

const LINE = Object.fromEntries(METRO_LINES.map((l) => [l.id, l]));

/** All station names (unique, sorted) with the lines they are on. */
export const STATIONS = [...new Set(METRO_LINES.flatMap((l) => l.stations.map((s) => s.name)))]
  .sort((a, b) => a.localeCompare(b))
  .map((name) => ({ name, lines: METRO_LINES.filter((l) => l.stations.some((s) => s.name === name)).map((l) => l.id) }));

function leg(line: MetroLine, a: string, b: string): Leg {
  const i = line.stations.findIndex((s) => s.name === a);
  const j = line.stations.findIndex((s) => s.name === b);
  const part = i <= j ? line.stations.slice(i, j + 1) : line.stations.slice(j, i + 1).reverse();
  return { line, from: a, to: b, km: Math.abs(line.stations[j].km - line.stations[i].km), stops: part.map((s) => s.name) };
}

const on = (line: MetroLine, name: string) => line.stations.some((s) => s.name === name);

/** Shortest journey: same line, one change, or two changes (the network is small enough to try all). */
export function journey(from: string, to: string): Journey | null {
  if (from === to) return null;
  const options: Leg[][] = [];
  for (const a of METRO_LINES) {
    if (!on(a, from)) continue;
    if (on(a, to)) options.push([leg(a, from, to)]);
    for (const x of INTERCHANGES) {
      if (!on(a, x) || x === from) continue;
      for (const b of METRO_LINES) {
        if (b === a || !on(b, x)) continue;
        if (on(b, to) && x !== to) options.push([leg(a, from, x), leg(b, x, to)]);
        for (const y of INTERCHANGES) {
          if (y === x || !on(b, y)) continue;
          for (const c of METRO_LINES) {
            if (c === a || c === b || !on(c, y) || !on(c, to) || y === to) continue;
            options.push([leg(a, from, x), leg(b, x, y), leg(c, y, to)]);
          }
        }
      }
    }
  }
  if (!options.length) return null;
  const best = options
    .map((legs) => ({ legs, km: legs.reduce((s, l) => s + l.km, 0) }))
    .sort((p, q) => p.km - q.km || p.legs.length - q.legs.length)[0];
  const km = +best.km.toFixed(1);
  const f = fareFor(km);
  const stops = best.legs.reduce((s, l) => s + l.stops.length - 1, 0);
  // ~34 km/h average incl. dwell time, +5 min per change of line
  const minutes = Math.round((km / 34) * 60 + 5 * (best.legs.length - 1));
  return { km, legs: best.legs, stops, minutes, token: f.token, card: f.card };
}

export { LINE as METRO_LINE_BY_ID };
