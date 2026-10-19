/** Nearby places (police stations, petrol bunks) — data rows live in nearby-*.ts and load only on their page. */
/** [name, area, city, lat, lon, state, brand, phone, open24h] */
export type NearbyRow = [string, string, string, number, number, 'TS' | 'AP', string, string, number];

export type NearbyKind = 'police' | 'fuel';

export async function loadNearby(kind: NearbyKind): Promise<{ rows: NearbyRow[]; asOf: string }> {
  const m = kind === 'police' ? await import('./nearby-police') : await import('./nearby-fuel');
  return { rows: m.ROWS, asOf: m.AS_OF };
}

export const FUEL_BRANDS = ['Indian Oil', 'HP', 'Bharat Petroleum', 'Jio-bp', 'Nayara', 'Shell'];
