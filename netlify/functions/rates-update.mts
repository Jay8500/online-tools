import type { Config } from '@netlify/functions';
import { updateRates } from '../lib/rates';

/** Runs every day at 7:00 am IST (01:30 UTC), after oil companies publish 6 am prices. */
export default async () => {
  const r = await updateRates();
  console.log(`rates updated: ${r.fuel.length} fuel cities, ${r.eggs.length} egg cities, ${r.errors.length} errors`, r.errors.join(' | '));
};

export const config: Config = { schedule: '30 1 * * *' };
