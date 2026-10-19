import { getStore } from '@netlify/blobs';
import { FUEL } from '../../src/app/core/fuel-data';

/**
 * Daily rates collector: petrol/diesel (Goodreturns city pages, which republish the oil companies' 6 am prices)
 * and the NECC egg rate. Results live in Netlify Blobs; the site reads them via /api/rates and falls back to the
 * prices built into the app if anything fails. Each source is read once a day, politely, with a clear user agent.
 */
const UA = 'Mozilla/5.0 (compatible; SpreadAppsTools/1.0; +https://tools.spreadapps.in)';
const SLUG: Record<string, string> = {
  Hyderabad: 'hyderabad',
  Warangal: 'warangal',
  Vijayawada: 'vijayawada',
  Visakhapatnam: 'visakhapatnam',
  Guntur: 'guntur',
  Tirupati: 'tirupati',
  Bengaluru: 'bangalore',
  Chennai: 'chennai',
  Mumbai: 'mumbai',
  Delhi: 'new-delhi',
  Kolkata: 'kolkata',
};
const EGG_CITIES = ['Hyderabad', 'Warangal', 'Vijayawada', 'Chittoor', 'E.Godavari'];

export interface FuelRow {
  city: string;
  state: string;
  petrol: number;
  diesel: number;
  prevPetrol: number;
  prevDiesel: number;
  changedOn: string | null;
}
export interface EggRow {
  city: string;
  per100: number;
  prev: number;
  changedOn: string | null;
}
export interface Rates {
  updatedAt: string;
  fuelDate: string;
  fuel: FuelRow[];
  eggDate: string;
  eggs: EggRow[];
  errors: string[];
}

const store = () => getStore({ name: 'rates', consistency: 'strong' });

export async function readRates(): Promise<Rates | null> {
  return ((await store().get('latest', { type: 'json' })) as Rates | null) ?? null;
}

async function page(url: string): Promise<string> {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

/** "Rate Today (19th Oct, 2026), Rs. 116.15/Ltr" or "Rate Today (19th Oct 2026) - Rs. 104.23/Ltr" */
function fuelFromTitle(html: string): { price: number; date: string } | null {
  const m = html.match(/Rate Today \(([^)]+)\),? (?:- )?Rs\. ([\d.]+)\/Ltr/);
  if (!m) return null;
  const price = Number(m[2]);
  const d = new Date(m[1].replace(/(\d+)(st|nd|rd|th)/, '$1').replace(',', ''));
  return price > 50 && price < 200 ? { price, date: isNaN(d.getTime()) ? '' : iso(d) } : null;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch everything, compare with yesterday, keep the previous value when something changed, save. */
export async function updateRates(): Promise<Rates> {
  const old = await readRates();
  const errors: string[] = [];
  const today = iso(new Date(Date.now() + 5.5 * 3600_000));

  // Start from yesterday's saved rows, or the prices built into the app on the very first run
  const base: FuelRow[] = old?.fuel ?? FUEL.map((f) => ({ ...f }));
  const fuel: FuelRow[] = [];
  let fuelDate = old?.fuelDate ?? '';
  for (const row of base) {
    const slug = SLUG[row.city];
    let next = { ...row };
    try {
      const [p, d] = [fuelFromTitle(await page(`https://www.goodreturns.in/petrol-price-in-${slug}.html`)), fuelFromTitle(await page(`https://www.goodreturns.in/diesel-price-in-${slug}.html`))];
      if (!p || !d) throw new Error(`no price found for ${row.city}`);
      fuelDate = p.date || fuelDate;
      if (p.price !== row.petrol || d.price !== row.diesel) {
        next = { ...row, petrol: p.price, diesel: d.price, prevPetrol: row.petrol, prevDiesel: row.diesel, changedOn: p.date || today };
      }
    } catch (e) {
      errors.push(`fuel ${row.city}: ${(e as Error).message}`); // keep yesterday's numbers
    }
    fuel.push(next);
    await sleep(400);
  }

  const baseEggs: EggRow[] = old?.eggs ?? [{ city: 'Hyderabad', per100: 545, prev: 545, changedOn: null }];
  let eggs = baseEggs;
  let eggDate = old?.eggDate ?? '';
  try {
    const html = (await page('https://www.e2necc.com/')).replace(/\s+/g, ' ');
    eggDate = (html.match(/Prices On:\s*(?:<[^>]+>\s*)*(\d{2}-\d{2}-\d{4})/)?.[1] ?? '').split('-').reverse().join('-') || eggDate;
    eggs = EGG_CITIES.map((city) => {
      // First non-zero value for the city (the page repeats lists; 0.00 means "not declared today")
      const vals = [...html.matchAll(new RegExp(`${city.replace('.', '\\.')}\\s*:\\s*([\\d.]+)`, 'g'))].map((m) => Number(m[1])).filter((v) => v > 0);
      const prevRow = baseEggs.find((e) => e.city === city);
      const v = vals[0];
      if (!v) return prevRow ?? { city, per100: 0, prev: 0, changedOn: null };
      if (!prevRow || prevRow.per100 === 0) return { city, per100: v, prev: v, changedOn: null };
      return v === prevRow.per100 ? prevRow : { city, per100: v, prev: prevRow.per100, changedOn: eggDate || today };
    }).filter((e) => e.per100 > 0);
  } catch (e) {
    errors.push(`eggs: ${(e as Error).message}`);
  }

  const rates: Rates = { updatedAt: new Date().toISOString(), fuelDate, fuel, eggDate, eggs, errors };
  await store().setJSON('latest', rates);
  return rates;
}
