/**
 * Indian money maths — pure functions, no Angular. Every page shows "estimates, not financial/tax advice".
 * Tax rules: FY 2026-27 (AY 2027-28). Budget 2026 kept FY 2025-26 slabs, rebate and standard deduction unchanged.
 * Checked 2026-10-19 — update TAX_YEAR + the tables below after each Budget.
 */

export const TAX_YEAR = 'FY 2026-27 (AY 2027-28)';

// ---------- Formatting ----------
const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹12,34,567 */
export function rupees(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `${n < 0 ? '−' : ''}₹${INR.format(Math.round(Math.abs(n)))}`;
}

/** 12.35 lakh / 1.2 crore / 45,000 */
export function inWords(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return `₹${trim(a / 1e7)} crore`;
  if (a >= 1e5) return `₹${trim(a / 1e5)} lakh`;
  return rupees(a);
}

function trim(x: number) {
  return x.toFixed(2).replace(/\.?0+$/, '');
}

const round = (n: number) => Math.round(n);

// ---------- EMI ----------
export interface EmiYear {
  year: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface EmiResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  years: EmiYear[];
}

/** Reducing-balance EMI. rate = yearly %, months = tenure. */
export function emi(principal: number, rate: number, months: number): EmiResult {
  const r = rate / 12 / 100;
  const e = r === 0 ? principal / months : (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);
  const years: EmiYear[] = [];
  let balance = principal;
  let y: EmiYear = { year: 1, principal: 0, interest: 0, balance };
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const princ = Math.min(balance, e - interest);
    balance -= princ;
    y.principal += princ;
    y.interest += interest;
    y.balance = Math.max(0, balance);
    if (m % 12 === 0 || m === months) {
      years.push({ year: y.year, principal: round(y.principal), interest: round(y.interest), balance: round(y.balance) });
      y = { year: y.year + 1, principal: 0, interest: 0, balance };
    }
  }
  const total = e * months;
  return { emi: round(e), totalInterest: round(total - principal), totalPayment: round(total), years };
}

// ---------- SIP / lump sum ----------
export interface GrowthYear {
  year: number;
  invested: number;
  value: number;
}

export interface GrowthResult {
  invested: number;
  value: number;
  gain: number;
  years: GrowthYear[];
}

/** Monthly SIP paid at the start of each month, monthly compounding at rate/12; optional yearly step-up %. */
export function sip(monthly: number, rate: number, years: number, stepUp = 0): GrowthResult {
  const i = rate / 12 / 100;
  let value = 0;
  let invested = 0;
  const out: GrowthYear[] = [];
  for (let m = 0; m < years * 12; m++) {
    const amt = monthly * (1 + stepUp / 100) ** Math.floor(m / 12);
    invested += amt;
    value = (value + amt) * (1 + i);
    if ((m + 1) % 12 === 0) out.push({ year: (m + 1) / 12, invested: round(invested), value: round(value) });
  }
  return { invested: round(invested), value: round(value), gain: round(value - invested), years: out };
}

/** One-time investment, yearly compounding. */
export function lumpsum(amount: number, rate: number, years: number): GrowthResult {
  const out: GrowthYear[] = [];
  for (let y = 1; y <= years; y++) out.push({ year: y, invested: amount, value: round(amount * (1 + rate / 100) ** y) });
  const value = amount * (1 + rate / 100) ** years;
  return { invested: amount, value: round(value), gain: round(value - amount), years: out };
}

// ---------- FD ----------
export type Compounding = 1 | 2 | 4 | 12;

/** Cumulative FD: interest compounded `perYear` times a year (banks: quarterly). */
export function fd(principal: number, rate: number, months: number, perYear: Compounding = 4): GrowthResult {
  const t = months / 12;
  const value = principal * (1 + rate / 100 / perYear) ** (perYear * t);
  const out: GrowthYear[] = [];
  for (let y = 1; y <= Math.ceil(t); y++) {
    const ty = Math.min(y, t);
    out.push({ year: y, invested: principal, value: round(principal * (1 + rate / 100 / perYear) ** (perYear * ty)) });
  }
  return { invested: principal, value: round(value), gain: round(value - principal), years: out };
}

// ---------- PPF ----------
export const PPF_RATE = 7.1; // Oct–Dec 2026 quarter
export const PPF_MIN = 500;
export const PPF_MAX = 150000;

/** Yearly deposit made before 5 April (earns the full year's interest), compounded yearly. */
export function ppf(yearly: number, rate: number, years: number): GrowthResult {
  let value = 0;
  const out: GrowthYear[] = [];
  for (let y = 1; y <= years; y++) {
    value = (value + yearly) * (1 + rate / 100);
    out.push({ year: y, invested: yearly * y, value: round(value) });
  }
  return { invested: yearly * years, value: round(value), gain: round(value - yearly * years), years: out };
}

// ---------- GST ----------
export const GST_RATES = [5, 18, 40, 3, 0.25];

export interface GstResult {
  net: number;
  gst: number;
  gross: number;
  half: number;
}

/** mode 'add' = amount is before GST; 'remove' = amount already includes GST. */
export function gst(amount: number, rate: number, mode: 'add' | 'remove'): GstResult {
  const net = mode === 'add' ? amount : amount / (1 + rate / 100);
  const tax = net * (rate / 100);
  return { net: +net.toFixed(2), gst: +tax.toFixed(2), gross: +(net + tax).toFixed(2), half: +(tax / 2).toFixed(2) };
}

// ---------- HRA ----------
/** From FY 2026-27 these 8 cities get the 50% limit (Income-tax Rules 2026); others 40%. */
export const HRA_METROS = ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Hyderabad', 'Pune', 'Ahmedabad'];

export interface HraResult {
  exempt: number;
  taxable: number;
  /** The three limits; the smallest one wins. */
  limits: { label: string; value: number }[];
}

/** All amounts yearly. salary = basic + DA (forming part of retirement benefits). */
export function hra(salary: number, hraReceived: number, rentPaid: number, metro: boolean): HraResult {
  const limits = [
    { label: 'HRA actually received', value: hraReceived },
    { label: 'Rent paid minus 10% of basic + DA', value: Math.max(0, rentPaid - 0.1 * salary) },
    { label: `${metro ? '50' : '40'}% of basic + DA (${metro ? 'metro' : 'non-metro'})`, value: (metro ? 0.5 : 0.4) * salary },
  ].map((l) => ({ ...l, value: round(l.value) }));
  const exempt = Math.min(...limits.map((l) => l.value));
  return { exempt, taxable: round(hraReceived - exempt), limits };
}

// ---------- Income tax ----------
export type Regime = 'new' | 'old';
export type AgeGroup = 'below60' | '60to80' | 'above80';

interface Slab {
  upTo: number;
  rate: number;
}

const NEW_SLABS: Slab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 5 },
  { upTo: 1200000, rate: 10 },
  { upTo: 1600000, rate: 15 },
  { upTo: 2000000, rate: 20 },
  { upTo: 2400000, rate: 25 },
  { upTo: Infinity, rate: 30 },
];

function oldSlabs(age: AgeGroup): Slab[] {
  const exempt = age === 'above80' ? 500000 : age === '60to80' ? 300000 : 250000;
  return [
    { upTo: exempt, rate: 0 },
    ...(exempt < 500000 ? [{ upTo: 500000, rate: 5 }] : []),
    { upTo: 1000000, rate: 20 },
    { upTo: Infinity, rate: 30 },
  ];
}

export const STD_DEDUCTION: Record<Regime, number> = { new: 75000, old: 50000 };
const REBATE: Record<Regime, { limit: number; max: number }> = { new: { limit: 1200000, max: 60000 }, old: { limit: 500000, max: 12500 } };
const LIMIT_80C = 150000;
const LIMIT_HOME_LOAN = 200000;
const LIMIT_NPS_1B = 50000;

function slabTax(income: number, slabs: Slab[]): number {
  let tax = 0;
  let prev = 0;
  for (const s of slabs) {
    if (income <= prev) break;
    tax += ((Math.min(income, s.upTo) - prev) * s.rate) / 100;
    prev = s.upTo;
  }
  return tax;
}

/** Surcharge brackets on taxable income; the new regime is capped at 25%. */
function surchargeRate(income: number, regime: Regime): number {
  if (income > 50000000) return regime === 'new' ? 25 : 37;
  if (income > 20000000) return 25;
  if (income > 10000000) return 15;
  if (income > 5000000) return 10;
  return 0;
}

const SURCHARGE_STEPS = [5000000, 10000000, 20000000, 50000000];

export interface TaxInput {
  /** Gross yearly income (salary + other income). */
  income: number;
  salaried: boolean;
  age: AgeGroup;
  /** Old-regime only */
  sec80c: number;
  sec80d: number;
  hraExempt: number;
  homeLoanInterest: number;
  nps80ccd1b: number;
  otherDeductions: number;
  /** Professional tax paid (deductible only in the old regime). */
  professionalTax: number;
}

export interface TaxResult {
  regime: Regime;
  deductions: number;
  taxable: number;
  slabTax: number;
  rebate: number;
  surcharge: number;
  cess: number;
  total: number;
  monthly: number;
  effectiveRate: number;
}

export function incomeTax(inp: TaxInput, regime: Regime): TaxResult {
  const std = inp.salaried ? STD_DEDUCTION[regime] : 0;
  const deductions =
    regime === 'new'
      ? std
      : std +
        Math.min(inp.sec80c, LIMIT_80C) +
        inp.sec80d +
        inp.hraExempt +
        Math.min(inp.homeLoanInterest, LIMIT_HOME_LOAN) +
        Math.min(inp.nps80ccd1b, LIMIT_NPS_1B) +
        inp.otherDeductions +
        (inp.salaried ? Math.min(inp.professionalTax, 2500) : 0);
  const taxable = Math.max(0, Math.floor((inp.income - deductions) / 10) * 10); // rounded down to ₹10 (Sec 288A)
  const slabs = regime === 'new' ? NEW_SLABS : oldSlabs(inp.age);
  const base = slabTax(taxable, slabs);

  // Section 87A rebate (+ marginal relief just above ₹12 lakh in the new regime)
  let rebate = 0;
  const rb = REBATE[regime];
  if (taxable <= rb.limit) rebate = Math.min(base, rb.max);
  else if (regime === 'new' && base > taxable - rb.limit) rebate = base - (taxable - rb.limit);
  const afterRebate = base - rebate;

  // Surcharge with marginal relief (extra tax can't exceed the income above the bracket start)
  let surcharge = 0;
  const sr = surchargeRate(taxable, regime);
  if (sr) {
    surcharge = (afterRebate * sr) / 100;
    const step = [...SURCHARGE_STEPS].reverse().find((s) => taxable > s)!;
    const atStep = slabTax(step, slabs);
    const prevRate = surchargeRate(step, regime);
    const cap = atStep * (1 + prevRate / 100) + (taxable - step);
    if (afterRebate + surcharge > cap) surcharge = Math.max(0, cap - afterRebate);
  }
  const cess = ((afterRebate + surcharge) * 4) / 100;
  const total = round(afterRebate + surcharge + cess);
  return {
    regime,
    deductions: round(deductions),
    taxable,
    slabTax: round(base),
    rebate: round(rebate),
    surcharge: round(surcharge),
    cess: round(cess),
    total,
    monthly: round(total / 12),
    effectiveRate: inp.income > 0 ? +((total / inp.income) * 100).toFixed(2) : 0,
  };
}

// ---------- In-hand salary ----------
export interface SalaryInput {
  ctc: number;
  basicPct: number;
  /** Employer PF is part of CTC (most companies). */
  pfOnCappedWage: boolean;
  gratuityInCtc: boolean;
  professionalTax: number;
  regime: Regime;
  /** Old regime: extra 80C on top of employee PF, other deductions. */
  extra80c: number;
}

export interface SalaryResult {
  basic: number;
  employerPf: number;
  gratuity: number;
  gross: number;
  employeePf: number;
  professionalTax: number;
  tax: TaxResult;
  inHandYear: number;
  inHandMonth: number;
}

const PF_WAGE_CAP = 15000 * 12;

export function salary(s: SalaryInput): SalaryResult {
  const basic = round((s.ctc * s.basicPct) / 100);
  const pfWage = s.pfOnCappedWage ? Math.min(basic, PF_WAGE_CAP) : basic;
  const employerPf = round(pfWage * 0.12);
  const gratuity = s.gratuityInCtc ? round(basic * 0.0481) : 0;
  const gross = Math.max(0, s.ctc - employerPf - gratuity);
  const employeePf = employerPf;
  const tax = incomeTax(
    {
      income: gross,
      salaried: true,
      age: 'below60',
      sec80c: employeePf + s.extra80c,
      sec80d: 0,
      hraExempt: 0,
      homeLoanInterest: 0,
      nps80ccd1b: 0,
      otherDeductions: 0,
      professionalTax: s.professionalTax,
    },
    s.regime,
  );
  const inHandYear = gross - employeePf - s.professionalTax - tax.total;
  return { basic, employerPf, gratuity, gross, employeePf, professionalTax: s.professionalTax, tax, inHandYear: round(inHandYear), inHandMonth: round(inHandYear / 12) };
}
