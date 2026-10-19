/**
 * Unit data for the converters. Each unit has a factor to the category's base unit
 * (temperature uses formulas). Values are exact definitions unless marked.
 */

export interface Unit {
  id: string;
  name: string;
  /** Short symbol shown after numbers */
  sym: string;
  /** How many base units one of this unit is */
  f: number;
}

export interface Category {
  id: UnitCategory;
  name: string;
  base: string;
  units: Unit[];
  /** Default "from" and "to" */
  from: string;
  to: string;
  /** Quick-answer facts for the page (also good for search) */
  facts: string[];
}

export type UnitCategory = 'length' | 'weight' | 'volume' | 'temperature' | 'speed' | 'data' | 'count';

export const CATEGORIES: Record<UnitCategory, Category> = {
  length: {
    id: 'length',
    name: 'Length',
    base: 'm',
    from: 'km',
    to: 'mi',
    units: [
      { id: 'mm', name: 'Millimetre', sym: 'mm', f: 0.001 },
      { id: 'cm', name: 'Centimetre', sym: 'cm', f: 0.01 },
      { id: 'm', name: 'Metre', sym: 'm', f: 1 },
      { id: 'km', name: 'Kilometre', sym: 'km', f: 1000 },
      { id: 'in', name: 'Inch', sym: 'in', f: 0.0254 },
      { id: 'ft', name: 'Foot', sym: 'ft', f: 0.3048 },
      { id: 'yd', name: 'Yard (gajam)', sym: 'yd', f: 0.9144 },
      { id: 'mi', name: 'Mile', sym: 'mi', f: 1609.344 },
      { id: 'nmi', name: 'Nautical mile', sym: 'nmi', f: 1852 },
    ],
    facts: ['1 km = 1,000 m = 0.6214 miles', '1 mile = 1.609 km', '1 foot = 12 inches = 30.48 cm', '1 metre = 3.281 feet = 39.37 inches', '1 yard = 3 feet = 0.9144 m', '1 inch = 2.54 cm'],
  },
  weight: {
    id: 'weight',
    name: 'Weight',
    base: 'g',
    from: 'kg',
    to: 'lb',
    units: [
      { id: 'mg', name: 'Milligram', sym: 'mg', f: 0.001 },
      { id: 'g', name: 'Gram', sym: 'g', f: 1 },
      { id: 'kg', name: 'Kilogram', sym: 'kg', f: 1000 },
      { id: 'q', name: 'Quintal', sym: 'q', f: 100000 },
      { id: 't', name: 'Tonne', sym: 't', f: 1000000 },
      { id: 'tola', name: 'Tola', sym: 'tola', f: 11.6638038 },
      { id: 'ct', name: 'Carat (gems)', sym: 'ct', f: 0.2 },
      { id: 'oz', name: 'Ounce', sym: 'oz', f: 28.349523125 },
      { id: 'ozt', name: 'Troy ounce (gold)', sym: 'oz t', f: 31.1034768 },
      { id: 'lb', name: 'Pound', sym: 'lb', f: 453.59237 },
    ],
    facts: ['1 kg = 1,000 g = 2.2046 pounds', '1 tola = 11.664 g', '1 quintal = 100 kg', '1 tonne = 1,000 kg = 10 quintals', '1 troy ounce (gold price unit) = 31.103 g', '1 carat = 0.2 g'],
  },
  volume: {
    id: 'volume',
    name: 'Volume',
    base: 'l',
    from: 'l',
    to: 'galus',
    units: [
      { id: 'ml', name: 'Millilitre', sym: 'ml', f: 0.001 },
      { id: 'l', name: 'Litre', sym: 'L', f: 1 },
      { id: 'm3', name: 'Cubic metre', sym: 'm³', f: 1000 },
      { id: 'ft3', name: 'Cubic foot', sym: 'ft³', f: 28.316846592 },
      { id: 'tsp', name: 'Teaspoon', sym: 'tsp', f: 0.005 },
      { id: 'tbsp', name: 'Tablespoon', sym: 'tbsp', f: 0.015 },
      { id: 'cup', name: 'Cup (metric)', sym: 'cup', f: 0.25 },
      { id: 'galus', name: 'US gallon', sym: 'gal', f: 3.785411784 },
      { id: 'galuk', name: 'UK gallon', sym: 'gal (UK)', f: 4.54609 },
    ],
    facts: ['1 litre = 1,000 ml', '1 cubic metre = 1,000 litres', '1 US gallon = 3.785 litres', '1 cubic foot = 28.32 litres', '1 cup (metric) = 250 ml'],
  },
  temperature: {
    id: 'temperature',
    name: 'Temperature',
    base: 'c',
    from: 'c',
    to: 'f',
    units: [
      { id: 'c', name: 'Celsius', sym: '°C', f: 1 },
      { id: 'f', name: 'Fahrenheit', sym: '°F', f: 1 },
      { id: 'k', name: 'Kelvin', sym: 'K', f: 1 },
    ],
    facts: ['°F = °C × 9/5 + 32', '37 °C (normal body temperature) = 98.6 °F', '100 °C = 212 °F (water boils)', '0 °C = 32 °F (water freezes)', '40 °C = 104 °F'],
  },
  speed: {
    id: 'speed',
    name: 'Speed',
    base: 'mps',
    from: 'kmph',
    to: 'mph',
    units: [
      { id: 'mps', name: 'Metres per second', sym: 'm/s', f: 1 },
      { id: 'kmph', name: 'Kilometres per hour', sym: 'km/h', f: 1000 / 3600 },
      { id: 'mph', name: 'Miles per hour', sym: 'mph', f: 1609.344 / 3600 },
      { id: 'kn', name: 'Knot', sym: 'kn', f: 1852 / 3600 },
    ],
    facts: ['100 km/h = 62.14 mph = 27.78 m/s', '1 m/s = 3.6 km/h', '1 knot = 1.852 km/h'],
  },
  data: {
    id: 'data',
    name: 'Data size',
    base: 'B',
    from: 'MB',
    to: 'KB',
    units: [
      { id: 'B', name: 'Byte', sym: 'B', f: 1 },
      { id: 'KB', name: 'Kilobyte (1024 B)', sym: 'KB', f: 1024 },
      { id: 'MB', name: 'Megabyte', sym: 'MB', f: 1024 ** 2 },
      { id: 'GB', name: 'Gigabyte', sym: 'GB', f: 1024 ** 3 },
      { id: 'TB', name: 'Terabyte', sym: 'TB', f: 1024 ** 4 },
      { id: 'bit', name: 'Bit', sym: 'bit', f: 1 / 8 },
      { id: 'Mbit', name: 'Megabit (internet speed)', sym: 'Mb', f: 1e6 / 8 },
    ],
    facts: ['1 MB = 1,024 KB (as exam portals and Windows count)', '1 GB = 1,024 MB', '100 Mbps internet ≈ 11.9 MB per second', '1 byte = 8 bits'],
  },
  count: {
    id: 'count',
    name: 'Numbers & counting',
    base: 'one',
    from: 'lakh',
    to: 'million',
    units: [
      { id: 'one', name: 'One (units)', sym: '', f: 1 },
      { id: 'dozen', name: 'Dozen', sym: 'dozen', f: 12 },
      { id: 'score', name: 'Score', sym: 'score', f: 20 },
      { id: 'gross', name: 'Gross', sym: 'gross', f: 144 },
      { id: 'hundred', name: 'Hundred', sym: 'hundred', f: 100 },
      { id: 'thousand', name: 'Thousand', sym: 'thousand', f: 1000 },
      { id: 'lakh', name: 'Lakh', sym: 'lakh', f: 1e5 },
      { id: 'million', name: 'Million', sym: 'million', f: 1e6 },
      { id: 'crore', name: 'Crore', sym: 'crore', f: 1e7 },
      { id: 'billion', name: 'Billion', sym: 'billion', f: 1e9 },
    ],
    facts: ['1 dozen = 12', '1 score = 20', '1 gross = 12 dozen = 144', '1 lakh = 1,00,000 = 100 thousand', '10 lakh = 1 million', '1 crore = 100 lakh = 10 million', '100 crore = 1 billion'],
  },
};

function toBase(cat: UnitCategory, unit: Unit, v: number): number {
  if (cat !== 'temperature') return v * unit.f;
  return unit.id === 'f' ? ((v - 32) * 5) / 9 : unit.id === 'k' ? v - 273.15 : v;
}

function fromBase(cat: UnitCategory, unit: Unit, c: number): number {
  if (cat !== 'temperature') return c / unit.f;
  return unit.id === 'f' ? (c * 9) / 5 + 32 : unit.id === 'k' ? c + 273.15 : c;
}

export function convert(cat: UnitCategory, from: string, to: string, value: number): number {
  const c = CATEGORIES[cat];
  const a = c.units.find((u) => u.id === from)!;
  const b = c.units.find((u) => u.id === to)!;
  return fromBase(cat, b, toBase(cat, a, value));
}

/** Readable number: up to 6 significant decimals, Indian grouping, no trailing zeros. */
export function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs !== 0 && (abs < 1e-6 || abs >= 1e15)) return n.toExponential(4);
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return n.toLocaleString('en-IN', { maximumFractionDigits: decimals });
}

// ---------------- Land (Telangana & Andhra Pradesh units) ----------------

/** All in square feet. Gunta = kunta = 121 sq yd; cent = 1/100 acre; ankanam = 72 sq ft (AP). */
export const LAND_UNITS: Unit[] = [
  { id: 'sqft', name: 'Square feet', sym: 'sq ft', f: 1 },
  { id: 'sqyd', name: 'Square yards (gajam)', sym: 'sq yd', f: 9 },
  { id: 'sqm', name: 'Square metres', sym: 'sq m', f: 10.763910417 },
  { id: 'ankanam', name: 'Ankanam (AP)', sym: 'ankanam', f: 72 },
  { id: 'cent', name: 'Cent', sym: 'cent', f: 435.6 },
  { id: 'gunta', name: 'Gunta / Kunta (TS)', sym: 'gunta', f: 1089 },
  { id: 'ground', name: 'Ground (Chennai)', sym: 'ground', f: 2400 },
  { id: 'acre', name: 'Acre', sym: 'acre', f: 43560 },
  { id: 'hectare', name: 'Hectare', sym: 'ha', f: 107639.10417 },
];

export const LAND_FACTS = [
  '1 acre = 40 guntas = 100 cents = 4,840 sq yards = 43,560 sq ft',
  '1 gunta (kunta) = 121 sq yards = 1,089 sq ft',
  '1 cent = 48.4 sq yards = 435.6 sq ft',
  '1 ankanam = 8 sq yards = 72 sq ft',
  '1 sq yard (gajam) = 9 sq ft',
  '1 hectare = 2.471 acres',
  '30 × 40 ft plot = 1,200 sq ft = 133.33 sq yards',
];

export function landConvert(from: string, value: number): { unit: Unit; value: number }[] {
  const a = LAND_UNITS.find((u) => u.id === from)!;
  const sqft = value * a.f;
  return LAND_UNITS.map((u) => ({ unit: u, value: sqft / u.f }));
}
