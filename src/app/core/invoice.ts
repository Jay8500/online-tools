/** GST invoice helpers — pure functions. */

export const GST_STATES: { code: string; name: string }[] = [
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '18', name: 'Assam' },
  { code: '10', name: 'Bihar' },
  { code: '04', name: 'Chandigarh' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '07', name: 'Delhi' },
  { code: '30', name: 'Goa' },
  { code: '24', name: 'Gujarat' },
  { code: '06', name: 'Haryana' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '20', name: 'Jharkhand' },
  { code: '29', name: 'Karnataka' },
  { code: '32', name: 'Kerala' },
  { code: '38', name: 'Ladakh' },
  { code: '31', name: 'Lakshadweep' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '27', name: 'Maharashtra' },
  { code: '14', name: 'Manipur' },
  { code: '17', name: 'Meghalaya' },
  { code: '15', name: 'Mizoram' },
  { code: '13', name: 'Nagaland' },
  { code: '21', name: 'Odisha' },
  { code: '34', name: 'Puducherry' },
  { code: '03', name: 'Punjab' },
  { code: '08', name: 'Rajasthan' },
  { code: '11', name: 'Sikkim' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '16', name: 'Tripura' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '19', name: 'West Bengal' },
];

export function stateName(code: string): string {
  return GST_STATES.find((s) => s.code === code)?.name ?? '';
}

const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Returns an error message, or null when the GSTIN is valid (format + check digit). */
export function gstinError(raw: string): string | null {
  const g = raw.trim().toUpperCase();
  if (!g) return null;
  if (g.length !== 15) return 'GSTIN has 15 characters';
  if (!GSTIN_RE.test(g)) return 'Format: 2-digit state code + PAN + 1Z + check digit';
  if (!GST_STATES.some((s) => s.code === g.slice(0, 2)) && g.slice(0, 2) !== '97') return 'First two digits must be a state code';
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const p = GSTIN_CHARS.indexOf(g[i]) * (i % 2 ? 2 : 1);
    sum += Math.floor(p / 36) + (p % 36);
  }
  const check = GSTIN_CHARS[(36 - (sum % 36)) % 36];
  return check === g[14] ? null : 'This GSTIN’s check digit is wrong — please re-check it';
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below100(n: number): string {
  return n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`;
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', r ? below100(r) : ''].filter(Boolean).join(' ');
}

/** Indian system: 12,34,567.50 → "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven Rupees and Fifty Paise Only" */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  const parts: string[] = [];
  let n = rupees;
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${crore >= 100 ? amountInWords(crore).replace(/ Rupees Only$/, '') : below100(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  const words = parts.join(' ') || 'Zero';
  return `${words} Rupees${paise ? ` and ${below100(paise)} Paise` : ''} Only`;
}

export interface InvoiceItem {
  desc: string;
  hsn: string;
  qty: number;
  rate: number;
  gst: number;
}

export interface InvoiceTotals {
  lines: { taxable: number; tax: number; total: number }[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  total: number;
  byRate: { rate: number; taxable: number; tax: number }[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function invoiceTotals(items: InvoiceItem[], interState: boolean): InvoiceTotals {
  const lines = items.map((i) => {
    const taxable = r2(i.qty * i.rate);
    const tax = r2((taxable * i.gst) / 100);
    return { taxable, tax, total: r2(taxable + tax) };
  });
  const taxable = r2(lines.reduce((a, l) => a + l.taxable, 0));
  const tax = r2(lines.reduce((a, l) => a + l.tax, 0));
  const byRateMap = new Map<number, { rate: number; taxable: number; tax: number }>();
  items.forEach((it, k) => {
    const m = byRateMap.get(it.gst) ?? { rate: it.gst, taxable: 0, tax: 0 };
    m.taxable = r2(m.taxable + lines[k].taxable);
    m.tax = r2(m.tax + lines[k].tax);
    byRateMap.set(it.gst, m);
  });
  const exact = taxable + tax;
  const total = Math.round(exact);
  return {
    lines,
    taxable,
    cgst: interState ? 0 : r2(tax / 2),
    sgst: interState ? 0 : r2(tax - r2(tax / 2)),
    igst: interState ? tax : 0,
    roundOff: r2(total - exact),
    total,
    byRate: [...byRateMap.values()].sort((a, b) => a.rate - b.rate),
  };
}
