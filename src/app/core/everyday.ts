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
