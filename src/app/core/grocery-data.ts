/**
 * Shop prices that no live source publishes — checked by hand, with the date and where they came from.
 * Update when dairies / NECC revise rates.
 */
export interface RefPrice {
  item: string;
  pack: string;
  price: number;
  prev?: number;
  changedOn?: string;
  source: string;
  url: string;
  checked: string;
}

export const REF_PRICES: RefPrice[] = [
  { item: 'Vijaya standardised milk', pack: '500 ml', price: 35, prev: 34, changedOn: '2026-10-17', source: 'Siasat (Vijaya notice)', url: 'https://www.siasat.com/vijaya-milk-gets-costlier-by-rs-2-a-litre-from-october-17-3559319/', checked: '2026-10-19' },
  { item: 'Vijaya whole milk', pack: '500 ml', price: 40, prev: 39, changedOn: '2026-10-17', source: 'Siasat (Vijaya notice)', url: 'https://www.siasat.com/vijaya-milk-gets-costlier-by-rs-2-a-litre-from-october-17-3559319/', checked: '2026-10-19' },
  { item: 'Heritage toned milk (Daily Health)', pack: '500 ml', price: 27, source: 'Instamart listing (Jul 2026)', url: 'https://instamart.in/cb/heritage/milk', checked: '2026-10-19' },
  { item: 'Eggs — NECC Hyderabad rate', pack: '100 eggs', price: 545, source: 'NECC daily rate, 19 Oct 2026', url: 'https://www.e2necc.com/', checked: '2026-10-19' },
];
