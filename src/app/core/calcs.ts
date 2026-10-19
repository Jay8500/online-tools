import { HRA_METROS, PPF_RATE, TAX_YEAR } from './finance';
import { Faq } from './seo.service';

/** One prerendered SEO page per entry. `kind` picks the calculator component. */
import { CalcKind } from './calc-links';

export interface CalcPage {
  id: string;
  path: string;
  kind: CalcKind;
  /** Short name for links and chips */
  name: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  steps: string[];
  faqs: Faq[];
  /** Starting values (EMI variants) */
  defaults?: { amount: number; rate: number; years: number };
}

const EMI_FAQ: Faq[] = [
  {
    q: 'How is EMI calculated?',
    a: 'EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r is the monthly interest rate (yearly rate ÷ 12 ÷ 100) and n is the number of months. Banks use this reducing-balance method.',
  },
  {
    q: 'Does a longer tenure reduce my total cost?',
    a: 'No. A longer tenure lowers the monthly EMI but you pay much more interest in total. Use the tenure slider to see the difference instantly.',
  },
  {
    q: 'What is not included in this EMI?',
    a: 'Processing fees, insurance, GST on fees and prepayment charges are not included. Ask your bank for the final repayment schedule before signing.',
  },
];

export const CALCS: CalcPage[] = [
  {
    id: 'emi',
    path: 'emi-calculator',
    kind: 'emi',
    name: 'EMI calculator',
    h1: 'EMI Calculator',
    title: 'EMI Calculator — Loan EMI, Interest & Yearly Schedule',
    description: 'Free EMI calculator for India: monthly EMI, total interest and year-wise repayment schedule for any loan. Instant results, works on mobile.',
    intro: 'Find the monthly EMI and total interest for any loan.',
    defaults: { amount: 1000000, rate: 9, years: 5 },
    steps: ['Enter the loan amount.', 'Enter the yearly interest rate your bank offers.', 'Choose the tenure in years.', 'Read the EMI, total interest and the year-wise schedule below.'],
    faqs: EMI_FAQ,
  },
  {
    id: 'home-loan-emi',
    path: 'home-loan-emi-calculator',
    kind: 'emi',
    name: 'Home loan EMI',
    h1: 'Home Loan EMI Calculator',
    title: 'Home Loan EMI Calculator — Monthly EMI & Total Interest',
    description: 'Calculate your home loan EMI, total interest and year-wise principal vs interest for SBI, HDFC, ICICI or any bank rate. Free and instant.',
    intro: 'Plan your home loan: EMI, total interest and how much principal you repay each year.',
    defaults: { amount: 5000000, rate: 8.5, years: 20 },
    steps: ['Enter the loan amount (property price minus down payment).', 'Enter the home loan rate, e.g. 8.5%.', 'Choose a tenure of up to 30 years.', 'Check the yearly schedule to see when principal starts going down faster.'],
    faqs: [
      ...EMI_FAQ,
      {
        q: 'Can I claim tax benefits on a home loan?',
        a: 'In the old tax regime, interest up to ₹2 lakh a year (self-occupied) and principal under Section 80C (within ₹1.5 lakh) can be deducted. The new regime does not allow these for a self-occupied house. Try our income tax calculator to compare.',
      },
    ],
  },
  {
    id: 'car-loan-emi',
    path: 'car-loan-emi-calculator',
    kind: 'emi',
    name: 'Car loan EMI',
    h1: 'Car Loan EMI Calculator',
    title: 'Car Loan EMI Calculator — Monthly EMI & Interest',
    description: 'Calculate car loan EMI and total interest for new or used cars. Change amount, rate and tenure to compare offers instantly.',
    intro: 'Compare car loan offers by EMI and total interest.',
    defaults: { amount: 800000, rate: 9.5, years: 5 },
    steps: ['Enter the on-road price minus your down payment.', 'Enter the interest rate from the dealer or bank.', 'Pick 1 to 7 years.', 'Compare the total interest across tenures before you decide.'],
    faqs: EMI_FAQ,
  },
  {
    id: 'personal-loan-emi',
    path: 'personal-loan-emi-calculator',
    kind: 'emi',
    name: 'Personal loan EMI',
    h1: 'Personal Loan EMI Calculator',
    title: 'Personal Loan EMI Calculator — EMI & Total Interest',
    description: 'Personal loan EMI calculator: see your monthly EMI and total interest for any amount, rate and tenure. Free, quick and private.',
    intro: 'Personal loans have high rates — see exactly what you will pay.',
    defaults: { amount: 300000, rate: 12, years: 3 },
    steps: ['Enter the amount you need.', 'Enter the rate offered (usually 10–24%).', 'Choose 1 to 5 years.', 'Check the total interest — a shorter tenure often saves a lot.'],
    faqs: EMI_FAQ,
  },
  {
    id: 'sip',
    path: 'sip-calculator',
    kind: 'sip',
    name: 'SIP calculator',
    h1: 'SIP Calculator',
    title: 'SIP Calculator — Mutual Fund SIP Returns with Step-up',
    description: 'Free SIP calculator: estimate mutual fund SIP returns with optional yearly step-up. See invested amount, gains and year-wise growth.',
    intro: 'Estimate what a monthly SIP can grow to, with an optional yearly increase.',
    steps: ['Enter your monthly SIP amount.', 'Enter the expected yearly return (equity funds have historically varied a lot; 10–12% is a common planning figure).', 'Choose the number of years.', 'Optionally add a yearly step-up, e.g. 10% when your salary grows.'],
    faqs: [
      {
        q: 'How does this SIP calculator work?',
        a: 'Each instalment is invested at the start of the month and grows at the monthly rate (yearly return ÷ 12). This is the method most fund houses use for illustrations.',
      },
      { q: 'Are SIP returns guaranteed?', a: 'No. Mutual fund returns depend on the market and can be negative. This calculator shows an estimate for planning, not a promise.' },
      { q: 'What is a step-up SIP?', a: 'You increase your SIP amount every year by a fixed percentage, for example 10%. Even a small step-up makes a big difference over 15–20 years.' },
      { q: 'Is tax included?', a: 'No. Equity fund gains above ₹1.25 lakh a year are taxed as long-term capital gains when you sell. Exit loads and expense ratios are also not included.' },
    ],
  },
  {
    id: 'lumpsum',
    path: 'lumpsum-calculator',
    kind: 'lumpsum',
    name: 'Lumpsum calculator',
    h1: 'Lumpsum Investment Calculator',
    title: 'Lumpsum Calculator — One-time Investment Returns',
    description: 'Calculate the future value of a one-time (lumpsum) investment in mutual funds or any asset with yearly compounding. Free and instant.',
    intro: 'See what a one-time investment can grow to.',
    steps: ['Enter the amount you invest once.', 'Enter the expected yearly return.', 'Choose how many years you will stay invested.', 'Compare with a monthly SIP using the SIP calculator.'],
    faqs: [
      { q: 'What formula is used?', a: 'Future value = amount × (1 + yearly return)^years, i.e. yearly compounding.' },
      { q: 'Lumpsum or SIP — which is better?', a: 'A lumpsum invests everything at once, so timing matters more. A SIP spreads purchases over time. Many people combine both.' },
      { q: 'Are returns guaranteed?', a: 'No. This is an estimate for planning; actual returns depend on the market.' },
    ],
  },
  {
    id: 'fd',
    path: 'fd-calculator',
    kind: 'fd',
    name: 'FD calculator',
    h1: 'FD Calculator',
    title: 'FD Calculator — Fixed Deposit Maturity & Interest',
    description: 'Fixed deposit calculator: maturity amount and interest with quarterly compounding, as used by SBI, HDFC, post office and other banks. Free.',
    intro: 'Find the maturity amount of a cumulative fixed deposit.',
    steps: ['Enter the deposit amount.', 'Enter the FD rate (senior citizens usually get about 0.5% more).', 'Choose the tenure in years and months.', 'Pick how often interest is compounded — most banks use quarterly.'],
    faqs: [
      { q: 'How is FD interest calculated?', a: 'Maturity = P × (1 + r/n)^(n × t), where n is how many times a year interest is compounded (4 for quarterly). This calculator is for cumulative (reinvestment) FDs.' },
      { q: 'Is FD interest taxable?', a: 'Yes, FD interest is added to your income and taxed at your slab rate. Banks deduct TDS when yearly interest crosses the limit, unless you submit Form 15G/15H where eligible.' },
      { q: 'Why is my bank’s figure slightly different?', a: 'Banks may count exact days and round each quarter. The difference is usually a few rupees.' },
    ],
  },
  {
    id: 'ppf',
    path: 'ppf-calculator',
    kind: 'ppf',
    name: 'PPF calculator',
    h1: 'PPF Calculator',
    title: `PPF Calculator — Maturity at ${PPF_RATE}% (Latest Rate)`,
    description: `PPF calculator with the current ${PPF_RATE}% rate: maturity amount, total interest and year-wise balance for 15 years or extended blocks. Free.`,
    intro: `Public Provident Fund at the current ${PPF_RATE}% rate (Oct–Dec 2026).`,
    steps: ['Enter how much you deposit each year (₹500 to ₹1.5 lakh).', `Keep the rate at ${PPF_RATE}% or change it to test other rates.`, 'Choose 15 years, or extend in 5-year blocks.', 'Deposit before 5 April each year to earn interest for the full year.'],
    faqs: [
      { q: `What is the PPF interest rate now?`, a: `${PPF_RATE}% a year for October–December 2026. The government reviews it every quarter; it has stayed at ${PPF_RATE}% since April 2020.` },
      { q: 'How much can I invest in PPF?', a: 'Minimum ₹500 and maximum ₹1.5 lakh in a financial year. The account matures after 15 full financial years and can be extended in blocks of 5 years.' },
      { q: 'Is PPF tax-free?', a: 'Yes, in the old tax regime the deposit qualifies for Section 80C, and the interest and maturity amount are tax-free (EEE). In the new regime there is no 80C deduction, but interest and maturity are still tax-free.' },
    ],
  },
  {
    id: 'income-tax',
    path: 'income-tax-calculator',
    kind: 'tax',
    name: 'Income tax: old vs new',
    h1: `Income Tax Calculator ${TAX_YEAR.split(' (')[0]} — Old vs New Regime`,
    title: `Income Tax Calculator ${TAX_YEAR.split(' (')[0]} — Old vs New Regime`,
    description: `Compare old vs new tax regime for ${TAX_YEAR}: tax payable, rebate up to ₹12 lakh, standard deduction, 80C, HRA and more. Free and instant.`,
    intro: `Which regime saves you more tax in ${TAX_YEAR}? Enter your income once and compare.`,
    steps: [
      'Enter your total yearly income (salary + interest + other income).',
      'Tick “Salaried” to apply the standard deduction (₹75,000 new, ₹50,000 old).',
      'For the old regime, add your deductions: 80C, 80D, HRA exemption, home-loan interest, NPS.',
      'See the tax under both regimes side by side and which one saves more.',
    ],
    faqs: [
      { q: 'Is income up to ₹12 lakh tax-free in the new regime?', a: 'Yes. If taxable income is up to ₹12 lakh, the Section 87A rebate makes the tax zero. For salaried people the ₹75,000 standard deduction makes it about ₹12.75 lakh of salary. Just above ₹12 lakh, marginal relief keeps the tax no higher than the income above ₹12 lakh.' },
      { q: `What are the new regime slabs for ${TAX_YEAR}?`, a: 'Up to ₹4 lakh: nil; ₹4–8 lakh: 5%; ₹8–12 lakh: 10%; ₹12–16 lakh: 15%; ₹16–20 lakh: 20%; ₹20–24 lakh: 25%; above ₹24 lakh: 30%. Health & education cess of 4% is added. Budget 2026 kept these unchanged.' },
      { q: 'When is the old regime better?', a: 'Usually when you have large deductions — for example full 80C, HRA in a big city, home-loan interest and health insurance. The calculator shows the exact difference for your numbers.' },
      { q: 'Does this include capital gains or special-rate income?', a: 'No. Capital gains, lottery and other special-rate income are taxed differently. Check with a tax professional for those.' },
    ],
  },
  {
    id: 'gst',
    path: 'gst-calculator',
    kind: 'gst',
    name: 'GST calculator',
    h1: 'GST Calculator',
    title: 'GST Calculator — Add or Remove GST (5%, 18%, 40%)',
    description: 'Free GST calculator for India: add GST to a price or remove GST from an inclusive amount, with CGST/SGST or IGST split. New GST 2.0 rates.',
    intro: 'Add GST to a price, or find the GST inside an amount — with CGST/SGST split.',
    steps: ['Enter the amount.', 'Choose “Add GST” if the amount is before tax, or “Remove GST” if it already includes tax.', 'Pick the GST rate: 5%, 18%, 40% (or 3% for gold, 0.25% for rough diamonds) or type your own.', 'Use CGST + SGST for sales within a state, IGST for sales to another state.'],
    faqs: [
      { q: 'What are the GST rates now?', a: 'Since 22 September 2025 (GST 2.0) most goods and services are taxed at 5% or 18%, with a 40% rate for luxury and sin goods. Special rates such as 3% (gold) and 0.25% (rough diamonds) continue. Check the exact rate for your HSN/SAC code.' },
      { q: 'How do I remove GST from a total?', a: 'Divide the total by (1 + rate ÷ 100). For example ₹1,180 including 18% GST = ₹1,180 ÷ 1.18 = ₹1,000 before tax, and ₹180 GST.' },
      { q: 'What is CGST, SGST and IGST?', a: 'For a sale within the same state, GST is split equally into Central GST and State GST. For a sale to another state, the full amount is charged as Integrated GST.' },
    ],
  },
  {
    id: 'hra',
    path: 'hra-calculator',
    kind: 'hra',
    name: 'HRA calculator',
    h1: 'HRA Exemption Calculator',
    title: 'HRA Calculator — HRA Exemption (New 8 Metro Cities)',
    description: `HRA exemption calculator with the new 50% metro list (${HRA_METROS.join(', ')}). See exempt and taxable HRA instantly. Old regime only.`,
    intro: 'Find how much of your house rent allowance is tax-free (old tax regime).',
    steps: ['Enter your yearly basic salary + DA.', 'Enter the HRA you receive in a year.', 'Enter the rent you actually pay in a year.', 'Choose whether you live in one of the 8 metro cities.'],
    faqs: [
      { q: 'How is HRA exemption calculated?', a: 'The exempt amount is the lowest of: (1) HRA received, (2) rent paid minus 10% of basic + DA, (3) 50% of basic + DA in a metro city or 40% elsewhere.' },
      { q: 'Which cities count as metro for HRA?', a: `From FY 2026-27, ${HRA_METROS.join(', ')} get the 50% limit under the Income-tax Rules 2026. Earlier only Delhi, Mumbai, Kolkata and Chennai did.` },
      { q: 'Can I claim HRA in the new tax regime?', a: 'No. HRA exemption is available only if you choose the old tax regime.' },
      { q: 'Do I need my landlord’s PAN?', a: 'If the rent you pay is more than ₹1 lakh a year, your employer will ask for the landlord’s PAN along with rent receipts.' },
    ],
  },
  {
    id: 'salary',
    path: 'salary-calculator',
    kind: 'salary',
    name: 'In-hand salary',
    h1: 'In-hand Salary Calculator',
    title: `In-hand Salary Calculator ${TAX_YEAR.split(' (')[0]} — CTC to Take-home`,
    description: `Convert CTC to monthly in-hand (take-home) salary for ${TAX_YEAR}: PF, professional tax and income tax under the new or old regime. Free.`,
    intro: 'Turn your CTC into the monthly amount that actually reaches your bank account.',
    steps: [
      'Enter your yearly CTC.',
      'Set basic salary as a % of CTC (usually 40–50%; check your offer letter).',
      'Choose PF on full basic or on the ₹15,000 wage ceiling, and whether gratuity is part of your CTC.',
      'Pick your tax regime and professional tax (₹2,400 a year in Telangana; ₹2,500 in many states).',
    ],
    faqs: [
      { q: 'Why is in-hand salary lower than CTC?', a: 'CTC includes the employer’s PF share and often gratuity, which you don’t get monthly. Your own PF, professional tax and income tax (TDS) are also deducted from your monthly pay.' },
      { q: 'How much PF is deducted?', a: '12% of basic salary from you and 12% from the employer. Many companies cap it at 12% of ₹15,000 (₹1,800 a month).' },
      { q: 'Is the result exact?', a: 'It is a close estimate. Actual pay depends on your salary structure, allowances, bonuses, investments and your employer’s rules.' },
    ],
  },
];

export function calcById(id: string): CalcPage | undefined {
  return CALCS.find((c) => c.id === id);
}
