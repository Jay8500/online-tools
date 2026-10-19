/**
 * Prepaid recharge and OTT prices, copied by hand from each company's OFFICIAL page (checked date below).
 * Prices change — update this file and PLANS_CHECKED when they do. Only what the official page showed is listed.
 *  - Jio: jio.com prepaid plans list (all-India prices)
 *  - Airtel: airtel.in/recharge-online, circle “AP and Telangana”
 *  - Vi: myvi.in online recharge — page showed circle “Maharashtra & Goa” (AP/TS prices may differ slightly)
 *  - BSNL: bsnl.co.in prepaid tariff (popular plans; page updated 15 Oct 2026)
 *  - OTT: netflix help centre, amazon.in/amazonprime, hotstar.com paywall, zee5.com subscription, sonyliv.com subscription
 */
export const PLANS_CHECKED = '2026-10-20';

export type Operator = 'Jio' | 'Airtel' | 'Vi' | 'BSNL';

export interface Plan {
  op: Operator;
  price: number;
  /** Validity in days (calendar month counted as 30) */
  days: number;
  validity: string;
  /** Daily data in GB (null = total data or none) */
  perDay: number | null;
  data: string;
  /** Unlimited calls included */
  calls: boolean;
  fiveG?: boolean;
  perks?: string;
}

const p = (op: Operator, price: number, days: number, data: string, perDay: number | null, o: Partial<Plan> = {}): Plan => ({
  op,
  price,
  days,
  validity: o.validity ?? `${days} days`,
  data,
  perDay,
  calls: o.calls ?? true,
  fiveG: o.fiveG,
  perks: o.perks,
});

export const PLANS: Plan[] = [
  // Jio
  p('Jio', 448, 84, 'No data (voice + SMS)', null, { perks: 'Voice-only plan' }),
  p('Jio', 1748, 336, 'No data (voice + SMS)', null, { perks: 'Voice-only plan' }),
  p('Jio', 239, 22, '1.5 GB/day', 1.5),
  p('Jio', 299, 28, '1.5 GB/day', 1.5),
  p('Jio', 319, 30, '1.5 GB/day', 1.5, { validity: '1 calendar month' }),
  p('Jio', 329, 28, '1.5 GB/day', 1.5),
  p('Jio', 579, 56, '1.5 GB/day', 1.5),
  p('Jio', 666, 70, '1.5 GB/day', 1.5),
  p('Jio', 889, 84, '1.5 GB/day', 1.5),
  p('Jio', 198, 14, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Jio', 349, 28, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Jio', 445, 28, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Jio', 450, 36, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true, perks: 'JioHotstar' }),
  p('Jio', 500, 28, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true, perks: '12+ OTT apps' }),
  p('Jio', 629, 56, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Jio', 719, 70, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Jio', 859, 84, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Jio', 899, 90, 'Unlimited 5G + 2 GB/day + 20 GB', 2, { fiveG: true, perks: 'JioHotstar' }),
  p('Jio', 999, 98, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true, perks: 'JioHotstar' }),
  p('Jio', 1029, 84, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true, perks: 'Amazon Prime included' }),
  p('Jio', 399, 28, 'Unlimited 5G + 2.5 GB/day', 2.5, { fiveG: true }),
  p('Jio', 3599, 365, 'Unlimited 5G + 2.5 GB/day', 2.5, { fiveG: true }),
  p('Jio', 449, 28, 'Unlimited 5G + 3 GB/day', 3, { fiveG: true }),
  p('Jio', 1199, 84, 'Unlimited 5G + 3 GB/day', 3, { fiveG: true }),
  p('Jio', 1799, 84, 'Unlimited 5G + 3 GB/day', 3, { fiveG: true }),
  // Airtel (AP & Telangana)
  p('Airtel', 185, 28, 'No data', null),
  p('Airtel', 203, 30, 'No data', null),
  p('Airtel', 469, 84, 'No data', null),
  p('Airtel', 1849, 365, 'No data', null),
  p('Airtel', 199, 28, '2 GB total', null),
  p('Airtel', 219, 28, '3 GB total', null),
  p('Airtel', 548, 84, '7 GB total', null),
  p('Airtel', 2249, 365, '30 GB total', null),
  p('Airtel', 349, 28, 'Unlimited 5G + 1.5 GB/day', 1.5, { fiveG: true }),
  p('Airtel', 899, 84, '1.5 GB/day', 1.5),
  p('Airtel', 348, 28, '2 GB/day', 2),
  p('Airtel', 379, 30, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true, validity: '1 month' }),
  p('Airtel', 598, 28, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true, perks: 'Netflix Basic + JioHotstar Super' }),
  p('Airtel', 979, 84, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Airtel', 1729, 84, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true, perks: 'Netflix Basic + JioHotstar Super' }),
  p('Airtel', 3599, 365, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Airtel', 399, 28, 'Unlimited 5G + 2.5 GB/day', 2.5, { fiveG: true }),
  p('Airtel', 429, 30, 'Unlimited 5G + 2.5 GB/day', 2.5, { fiveG: true, validity: '1 month' }),
  p('Airtel', 1199, 84, 'Unlimited 5G + 2.5 GB/day', 2.5, { fiveG: true, perks: 'Amazon Prime Lite + SonyLIV & more' }),
  p('Airtel', 3999, 365, 'Unlimited 5G + 2.5 GB/day + 150 GB', 2.5, { fiveG: true }),
  p('Airtel', 838, 56, 'Unlimited 5G + 3 GB/day', 3, { fiveG: true, perks: 'Amazon Prime Lite + SonyLIV & more' }),
  p('Airtel', 1099, 84, 'Unlimited 5G + 3 GB/day', 3, { fiveG: true }),
  p('Airtel', 1798, 84, 'Unlimited 5G + 3 GB/day', 3, { fiveG: true, perks: 'Netflix Basic' }),
  p('Airtel', 449, 28, 'Unlimited 5G + 4 GB/day', 4, { fiveG: true }),
  // Vi (page showed Maharashtra & Goa circle)
  p('Vi', 199, 28, '2 GB total', null),
  p('Vi', 299, 28, '1 GB/day', 1),
  p('Vi', 349, 28, 'Unlimited 5G + 1.5 GB/day', 1.5, { fiveG: true }),
  p('Vi', 365, 28, '2 GB/day + night unlimited', 2),
  p('Vi', 399, 28, 'Unlimited 4G + 5G data', null, { fiveG: true, perks: 'JioHotstar Mobile' }),
  p('Vi', 3599, 365, 'Unlimited 5G + 2 GB/day', 2, { fiveG: true }),
  p('Vi', 3699, 365, '2 GB/day + night unlimited', 2, { perks: 'JioHotstar Mobile' }),
  // BSNL
  p('BSNL', 99, 14, '50 MB', null),
  p('BSNL', 107, 20, '3 GB total + 200 min calls', null, { calls: false }),
  p('BSNL', 153, 24, '1 GB/day', 1),
  p('BSNL', 1499, 300, '32 GB total', null),
  p('BSNL', 1999, 330, '1.5 GB/day', 1.5),
  p('BSNL', 2399, 365, '2 GB/day', 2),
];

export const RECHARGE_LINKS: Record<Operator, string> = {
  Jio: 'https://www.jio.com/selfcare/plans/mobility/prepaid-plans-list/',
  Airtel: 'https://www.airtel.in/recharge-online',
  Vi: 'https://www.myvi.in/prepaid/online-mobile-recharge',
  BSNL: 'https://www.bsnl.co.in/opencms/bsnl/BSNL/services/mobile/prepaid_plans.html',
};

export interface OttPlan {
  name: string;
  price: number;
  months: number;
  note: string;
}
export interface Ott {
  id: string;
  name: string;
  lang: string;
  url: string;
  plans: OttPlan[];
  /** Shown when the official page doesn't list prices without login */
  noPrice?: string;
  tip?: string;
}

const o = (name: string, price: number, months: number, note: string): OttPlan => ({ name, price, months, note });

export const OTT: Ott[] = [
  {
    id: 'netflix', name: 'Netflix', lang: 'All languages', url: 'https://help.netflix.com/en/node/24926',
    plans: [o('Mobile', 149, 1, '1 phone/tablet · 480p'), o('Basic', 199, 1, '1 device · 720p'), o('Standard', 499, 1, '2 devices · 1080p'), o('Premium', 649, 1, '4 devices · 4K + HDR')],
    tip: 'Monthly only — Netflix has no yearly plan in India.',
  },
  {
    id: 'prime', name: 'Amazon Prime', lang: 'All languages', url: 'https://www.amazon.in/amazonprime',
    plans: [o('Prime (monthly)', 299, 1, '5 devices · 4K · fast delivery'), o('Prime (yearly)', 1499, 12, '5 devices · 4K · fast delivery'), o('Prime Lite', 799, 12, '1 device (mobile or TV) · HD · with ads'), o('Shopping Edition', 399, 12, 'Delivery only — no Prime Video')],
  },
  {
    id: 'hotstar', name: 'JioHotstar', lang: 'All languages + cricket', url: 'https://www.hotstar.com/in/paywall',
    plans: [o('Super', 149, 1, '2 devices · 1080p · with ads'), o('Super', 349, 3, '2 devices · 1080p · with ads'), o('Super', 1099, 12, '2 devices · 1080p · with ads'), o('Premium', 299, 1, '4 devices · 4K · no ads (except live)'), o('Premium', 699, 3, '4 devices · 4K · no ads (except live)'), o('Premium', 2199, 12, '4 devices · 4K · no ads (except live)')],
  },
  {
    id: 'sonyliv', name: 'SonyLIV', lang: 'All languages + sports', url: 'https://www.sonyliv.com/subscription',
    plans: [o('LIV Premium', 399, 1, '2 devices · up to 4K · with ads'), o('LIV Premium', 1499, 12, '2 devices · up to 4K · with ads'), o('Mobile only', 699, 12, '1 device · 720p · with ads')],
  },
  {
    id: 'zee5', name: 'ZEE5', lang: 'All languages', url: 'https://www.zee5.com/myaccount/subscription',
    plans: [o('All access + sports', 399, 3, '2 devices · 4K'), o('All access + sports', 1699, 12, '2 devices · 4K'), o('Movies, series, live TV', 299, 1, 'Kids + international content'), o('Hindi pack', 199, 1, 'Hindi, Punjabi, Bhojpuri')],
  },
  { id: 'aha', name: 'aha', lang: 'Telugu & Tamil', url: 'https://www.aha.video/', plans: [], noPrice: 'aha shows prices only after you sign in — check in the aha app.' },
  { id: 'etv', name: 'ETV Win', lang: 'Telugu', url: 'https://www.etvwin.com/', plans: [], noPrice: 'ETV Win shows prices only after you sign in — check in the app.' },
  { id: 'sunnxt', name: 'Sun NXT', lang: 'Telugu, Tamil, Kannada, Malayalam', url: 'https://www.sunnxt.com/', plans: [], noPrice: 'Sun NXT shows prices only after you sign in — check in the app.' },
];
