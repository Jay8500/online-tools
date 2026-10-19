/**
 * Health maths — pure functions. Every page says "not medical advice".
 * BMI cut-offs: Asia-Pacific / Indian consensus (lower than WHO international) because Indians
 * carry more health risk at a lower BMI.
 */

export interface BmiBand {
  label: string;
  from: number;
  to: number;
  color: string;
}

/** Indian / Asia-Pacific BMI categories */
export const BMI_BANDS: BmiBand[] = [
  { label: 'Underweight', from: 0, to: 18.5, color: '#38bdf8' },
  { label: 'Normal', from: 18.5, to: 23, color: '#22c55e' },
  { label: 'Overweight', from: 23, to: 25, color: '#f59e0b' },
  { label: 'Obese', from: 25, to: 100, color: '#ef4444' },
];

/** WHO international categories (shown for comparison) */
export function whoBmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function bmi(kg: number, cm: number): number {
  const m = cm / 100;
  return +(kg / (m * m)).toFixed(1);
}

export function bmiBand(value: number): BmiBand {
  return BMI_BANDS.find((b) => value >= b.from && value < b.to) ?? BMI_BANDS[BMI_BANDS.length - 1];
}

/** Healthy weight range (kg) for a height using the Indian normal BMI band 18.5–22.9. */
export function healthyWeight(cm: number): { min: number; max: number } {
  const m2 = (cm / 100) ** 2;
  return { min: +(18.5 * m2).toFixed(1), max: +(22.9 * m2).toFixed(1) };
}

/** Devine formula (kg) — a commonly quoted single "ideal" figure. */
export function devine(cm: number, male: boolean): number {
  const inchesOver5ft = Math.max(0, cm / 2.54 - 60);
  return +((male ? 50 : 45.5) + 2.3 * inchesOver5ft).toFixed(1);
}

export const ACTIVITY = [
  { id: 'sedentary', label: 'Little or no exercise', factor: 1.2 },
  { id: 'light', label: 'Light exercise 1–3 days/week', factor: 1.375 },
  { id: 'moderate', label: 'Moderate exercise 3–5 days/week', factor: 1.55 },
  { id: 'active', label: 'Hard exercise 6–7 days/week', factor: 1.725 },
  { id: 'very', label: 'Very hard exercise / physical job', factor: 1.9 },
];

/** Mifflin–St Jeor BMR (kcal/day). */
export function bmr(kg: number, cm: number, age: number, male: boolean): number {
  return Math.round(10 * kg + 6.25 * cm - 5 * age + (male ? 5 : -161));
}

export function ftInToCm(ft: number, inch: number): number {
  return +((ft * 12 + inch) * 2.54).toFixed(1);
}

// ---------- Pregnancy ----------
const DAY = 86400000;

export interface DueDateResult {
  due: Date;
  conception: Date;
  /** Weeks + days pregnant today (null if LMP is in the future / > 42 weeks ago). */
  weeks: number | null;
  days: number | null;
  trimester: 1 | 2 | 3 | null;
  milestones: { label: string; date: Date }[];
}

/** Naegele's rule adjusted for cycle length: due = LMP + 280 days + (cycle − 28). */
export function dueDate(lmp: Date, cycle = 28, today = new Date()): DueDateResult {
  const shift = cycle - 28;
  const due = new Date(lmp.getTime() + (280 + shift) * DAY);
  const conception = new Date(lmp.getTime() + (14 + shift) * DAY);
  const ga = Math.floor((startOfDay(today).getTime() - startOfDay(lmp).getTime()) / DAY) - shift;
  const valid = ga >= 0 && ga <= 42 * 7;
  const weeks = valid ? Math.floor(ga / 7) : null;
  const at = (w: number) => new Date(lmp.getTime() + (w * 7 + shift) * DAY);
  return {
    due,
    conception,
    weeks,
    days: valid ? ga % 7 : null,
    trimester: weeks === null ? null : weeks < 13 ? 1 : weeks < 27 ? 2 : 3,
    milestones: [
      { label: 'First scan (dating) usually', date: at(7) },
      { label: 'NT scan window opens (11 weeks)', date: at(11) },
      { label: 'End of first trimester (13 weeks)', date: at(13) },
      { label: 'Anomaly scan around (19–20 weeks)', date: at(19) },
      { label: 'End of second trimester (27 weeks)', date: at(27) },
      { label: 'Full term (37 weeks)', date: at(37) },
    ],
  };
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
}
