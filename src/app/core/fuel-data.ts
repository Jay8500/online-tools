/**
 * Retail petrol & diesel prices (₹/litre). Oil companies revise at 6 am; prices change rarely.
 * Update with: node scripts/update-fuel.mjs "<City>" <petrol> <diesel> [YYYY-MM-DD]
 * Source: IOCL/BPCL/HPCL rates as published by Business Today and Goodreturns (cross-checked 19 Oct 2026).
 */
export interface FuelCity {
  city: string;
  state: string;
  petrol: number;
  diesel: number;
  /** Price before the last change (same as current if no recent change is known) */
  prevPetrol: number;
  prevDiesel: number;
  /** Date of the last known change, or null */
  changedOn: string | null;
}

export const FUEL_AS_OF = '2026-10-19';

export const FUEL: FuelCity[] = [
  { city: 'Hyderabad', state: 'Telangana', petrol: 116.15, diesel: 104.23, prevPetrol: 115.69, prevDiesel: 103.82, changedOn: '2026-10-13' },
  { city: 'Warangal', state: 'Telangana', petrol: 115.62, diesel: 103.74, prevPetrol: 115.71, prevDiesel: 103.82, changedOn: '2026-10-13' },
  { city: 'Vijayawada', state: 'Andhra Pradesh', petrol: 117.25, diesel: 104.96, prevPetrol: 117.25, prevDiesel: 104.96, changedOn: null },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh', petrol: 116.39, diesel: 104.11, prevPetrol: 116.39, prevDiesel: 104.11, changedOn: null },
  { city: 'Guntur', state: 'Andhra Pradesh', petrol: 117.68, diesel: 105.36, prevPetrol: 117.68, prevDiesel: 105.36, changedOn: null },
  { city: 'Tirupati', state: 'Andhra Pradesh', petrol: 117.88, diesel: 105.49, prevPetrol: 117.88, prevDiesel: 105.49, changedOn: null },
  { city: 'Bengaluru', state: 'Karnataka', petrol: 111.68, diesel: 99.56, prevPetrol: 111.68, prevDiesel: 99.56, changedOn: null },
  { city: 'Chennai', state: 'Tamil Nadu', petrol: 107.76, diesel: 99.55, prevPetrol: 107.76, prevDiesel: 99.55, changedOn: null },
  { city: 'Mumbai', state: 'Maharashtra', petrol: 111.21, diesel: 97.83, prevPetrol: 111.21, prevDiesel: 97.83, changedOn: null },
  { city: 'Delhi', state: 'Delhi', petrol: 102.12, diesel: 95.2, prevPetrol: 102.12, prevDiesel: 95.2, changedOn: null },
  { city: 'Kolkata', state: 'West Bengal', petrol: 113.51, diesel: 99.82, prevPetrol: 113.51, prevDiesel: 99.82, changedOn: null },
];
