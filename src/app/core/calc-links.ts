/** Light list of calculator pages for routes, nav and footer (content lives in calcs.ts, loaded lazily). */
export type CalcKind = 'emi' | 'sip' | 'lumpsum' | 'fd' | 'ppf' | 'tax' | 'gst' | 'hra' | 'salary';

export interface CalcLink {
  id: string;
  path: string;
  kind: CalcKind;
  name: string;
}

export const CALC_LINKS: CalcLink[] = [
  { id: 'emi', path: 'emi-calculator', kind: 'emi', name: 'EMI calculator' },
  { id: 'home-loan-emi', path: 'home-loan-emi-calculator', kind: 'emi', name: 'Home loan EMI' },
  { id: 'car-loan-emi', path: 'car-loan-emi-calculator', kind: 'emi', name: 'Car loan EMI' },
  { id: 'personal-loan-emi', path: 'personal-loan-emi-calculator', kind: 'emi', name: 'Personal loan EMI' },
  { id: 'sip', path: 'sip-calculator', kind: 'sip', name: 'SIP calculator' },
  { id: 'lumpsum', path: 'lumpsum-calculator', kind: 'lumpsum', name: 'Lumpsum calculator' },
  { id: 'fd', path: 'fd-calculator', kind: 'fd', name: 'FD calculator' },
  { id: 'ppf', path: 'ppf-calculator', kind: 'ppf', name: 'PPF calculator' },
  { id: 'income-tax', path: 'income-tax-calculator', kind: 'tax', name: 'Income tax: old vs new' },
  { id: 'gst', path: 'gst-calculator', kind: 'gst', name: 'GST calculator' },
  { id: 'hra', path: 'hra-calculator', kind: 'hra', name: 'HRA calculator' },
  { id: 'salary', path: 'salary-calculator', kind: 'salary', name: 'In-hand salary' },
];
