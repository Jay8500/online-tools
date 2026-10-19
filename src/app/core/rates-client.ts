import type { FuelCity } from './fuel-data';

/** Daily-updated fuel & egg rates from /api/rates (7 am IST job). One request per page; null if unavailable. */
export interface DailyRates {
  updatedAt: string;
  fuelDate: string;
  fuel: FuelCity[];
  eggDate: string;
  eggs: { city: string; per100: number; prev: number; changedOn: string | null }[];
}

let p: Promise<DailyRates | null> | null = null;

export function dailyRates(): Promise<DailyRates | null> {
  p ??= fetch('/api/rates')
    .then((r) => (r.ok ? (r.json() as Promise<DailyRates>) : null))
    .then((j) => (j && Array.isArray(j.fuel) && j.fuel.length ? j : null))
    .catch(() => null);
  return p;
}
