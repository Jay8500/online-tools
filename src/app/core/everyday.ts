/** Age and percentage maths for the everyday tools (pure functions, no Angular). */

export interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
  bornOn: string;
  nextBirthday: Date;
  daysToBirthday: number;
}

const DAY = 86400000;
const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

/** Exact age between two local dates (years, months, days, borrowing days from the previous month). */
export function age(dob: Date, on: Date): AgeResult | null {
  if (utc(dob) > utc(on)) return null;
  // Whole months completed, then the days since that "month-iversary" (31 Jan + 1 month = 28/29 Feb).
  let totalMonths = (on.getFullYear() - dob.getFullYear()) * 12 + on.getMonth() - dob.getMonth();
  if (on.getDate() < dob.getDate()) totalMonths--;
  const y = dob.getFullYear() + Math.floor((dob.getMonth() + totalMonths) / 12);
  const m = (dob.getMonth() + totalMonths) % 12;
  const anchor = new Date(y, m, Math.min(dob.getDate(), new Date(y, m + 1, 0).getDate()));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const days = Math.round((utc(on) - utc(anchor)) / DAY);
  const totalDays = Math.round((utc(on) - utc(dob)) / DAY);
  // Next birthday (29 Feb birthdays fall on 1 Mar in non-leap years, as JS dates roll over)
  let next = new Date(on.getFullYear(), dob.getMonth(), dob.getDate());
  if (utc(next) < utc(on)) next = new Date(on.getFullYear() + 1, dob.getMonth(), dob.getDate());
  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths,
    bornOn: dob.toLocaleDateString('en-IN', { weekday: 'long' }),
    nextBirthday: next,
    daysToBirthday: Math.round((utc(next) - utc(on)) / DAY),
  };
}

export interface DaysResult {
  days: number;
  weeks: number;
  weekDays: number;
  /** Monday–Friday count (start and end included when `inclusive`) */
  workingDays: number;
  past: boolean;
}

/** Days between two local dates; `inclusive` counts both the start and end day. */
export function daysBetween(a: Date, b: Date, inclusive = false): DaysResult {
  const past = utc(b) < utc(a);
  const [from, to] = past ? [b, a] : [a, b];
  const days = Math.round((utc(to) - utc(from)) / DAY) + (inclusive ? 1 : 0);
  let workingDays = 0;
  for (let i = 0; i < days; i++) {
    const wd = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i + (inclusive ? 0 : 1)).getDay();
    if (wd !== 0 && wd !== 6) workingDays++;
  }
  return { days, weeks: Math.floor(days / 7), weekDays: days % 7, workingDays, past };
}

/** X% of Y */
export const percentOf = (pct: number, of: number) => (pct / 100) * of;
/** X is what % of Y (marks: 450 of 600 = 75%) */
export const whatPercent = (part: number, whole: number) => (whole === 0 ? null : (part / whole) * 100);
/** % change from A to B (positive = increase) */
export const percentChange = (from: number, to: number) => (from === 0 ? null : ((to - from) / Math.abs(from)) * 100);

/** CGPA → percentage formulas (10-point scale). The university's own regulation is always final. */
export const CGPA_FORMULAS = [
  { id: 'cbse', label: 'CBSE (× 9.5)', mul: 9.5, sub: 0 },
  { id: 'jntuh', label: 'JNTUH ((CGPA − 0.5) × 10)', mul: 10, sub: 0.5 },
  { id: 'aicte', label: 'AICTE / VTU ((CGPA − 0.75) × 10)', mul: 10, sub: 0.75 },
  { id: 'x10', label: 'Anna Univ / simple (× 10)', mul: 10, sub: 0 },
] as const;

export const cgpaToPercent = (cgpa: number, mul: number, sub: number) => Math.max(0, Math.min(100, (cgpa - sub) * mul));

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/** Equal split: who pays whom, with the fewest transfers (greedy, rounded to the rupee). */
export function settle(people: { name: string; paid: number }[]): { total: number; share: number; transfers: Transfer[] } {
  const total = people.reduce((s, p) => s + p.paid, 0);
  const share = people.length ? total / people.length : 0;
  const bal = people.map((p) => ({ name: p.name, v: p.paid - share }));
  const give = bal.filter((b) => b.v < -0.5).sort((a, b) => a.v - b.v);
  const get = bal.filter((b) => b.v > 0.5).sort((a, b) => b.v - a.v);
  const transfers: Transfer[] = [];
  let i = 0, j = 0;
  while (i < give.length && j < get.length) {
    const amt = Math.min(-give[i].v, get[j].v);
    if (Math.round(amt) > 0) transfers.push({ from: give[i].name, to: get[j].name, amount: Math.round(amt) });
    give[i].v += amt;
    get[j].v -= amt;
    if (give[i].v > -0.5) i++;
    if (get[j].v < 0.5) j++;
  }
  return { total, share, transfers };
}
