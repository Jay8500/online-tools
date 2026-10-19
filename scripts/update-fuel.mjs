// Update one city's fuel prices: keeps the old price as "previous" so the site shows ▲/▼ and a change alert.
//   node scripts/update-fuel.mjs "Hyderabad" 116.15 104.23 [2026-10-19]
//   node scripts/update-fuel.mjs --as-of 2026-10-20        (prices checked, no change)
import { readFileSync, writeFileSync } from 'node:fs';

const file = new URL('../src/app/core/fuel-data.ts', import.meta.url);
let src = readFileSync(file, 'utf8');
const today = new Date().toISOString().slice(0, 10);
const args = process.argv.slice(2);

if (args[0] === '--as-of') {
  src = src.replace(/FUEL_AS_OF = '[\d-]+'/, `FUEL_AS_OF = '${args[1] || today}'`);
  writeFileSync(file, src);
  console.log('as-of date updated');
  process.exit(0);
}

const [city, p, d, date = today] = args;
const petrol = Number(p);
const diesel = Number(d);
if (!city || !(petrol > 50 && petrol < 200) || !(diesel > 50 && diesel < 200)) {
  console.error('Usage: node scripts/update-fuel.mjs "<City>" <petrol> <diesel> [YYYY-MM-DD]');
  process.exit(1);
}
const re = new RegExp(`\\{ city: '${city}', state: '([^']+)', petrol: ([\\d.]+), diesel: ([\\d.]+), prevPetrol: [\\d.]+, prevDiesel: [\\d.]+, changedOn: [^}]+\\}`);
const m = src.match(re);
if (!m) {
  console.error(`City "${city}" not found in fuel-data.ts`);
  process.exit(1);
}
const [, state, oldP, oldD] = m;
const changed = Number(oldP) !== petrol || Number(oldD) !== diesel;
const row = changed
  ? `{ city: '${city}', state: '${state}', petrol: ${petrol}, diesel: ${diesel}, prevPetrol: ${oldP}, prevDiesel: ${oldD}, changedOn: '${date}' }`
  : m[0];
src = src.replace(m[0], row).replace(/FUEL_AS_OF = '[\d-]+'/, `FUEL_AS_OF = '${date}'`);
writeFileSync(file, src);
console.log(changed ? `${city}: petrol ${oldP} → ${petrol}, diesel ${oldD} → ${diesel} (${date})` : `${city}: no change; as-of date set to ${date}`);
