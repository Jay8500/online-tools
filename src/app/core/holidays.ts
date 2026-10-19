/**
 * Public holiday lists, copied from the official orders:
 *  - India (Central Govt, Delhi/New Delhi gazetted list): DoPT O.M. for 2026, and O.M. F.No.12/2/2023-JCA dated 16.07.2026 for 2027
 *  - Telangana 2026: G.O.Rt.No.1715 GA (Spl.E) dated 06.12.2025, Annexure-I (27 general holidays)
 *  - Andhra Pradesh 2026: G.O.Rt.No.2276 GA (Poll.B) dated 04.12.2025, Annexure-I (24 general holidays)
 * Moon-based dates (Eid, Muharram, Milad-un-Nabi) can shift by a day; governments announce the change in the media.
 * TS/AP lists for the next year usually come out in December — add them here then.
 */
export type Region = 'india' | 'telangana' | 'andhra';
export type HolidayKind = 'national' | 'hindu' | 'muslim' | 'christian' | 'sikh' | 'jain' | 'buddhist' | 'leader' | 'state';

export interface Holiday {
  date: string;
  name: string;
  kind: HolidayKind;
  /** Short line shown on the card */
  note?: string;
}

const h = (date: string, name: string, kind: HolidayKind, note?: string): Holiday => ({ date, name, kind, note });

const INDIA_2026: Holiday[] = [
  h('2026-01-26', 'Republic Day', 'national', 'Constitution came into force, 1950'),
  h('2026-03-04', 'Holi', 'hindu', 'Festival of colours'),
  h('2026-03-21', 'Id-ul-Fitr', 'muslim', 'End of Ramzan fasting'),
  h('2026-03-26', 'Ram Navami', 'hindu', 'Birth of Lord Rama'),
  h('2026-03-31', 'Mahavir Jayanti', 'jain', 'Birth of Lord Mahavira'),
  h('2026-04-03', 'Good Friday', 'christian'),
  h('2026-05-01', 'Buddha Purnima', 'buddhist', 'Birth of Gautama Buddha'),
  h('2026-05-27', 'Id-ul-Zuha (Bakrid)', 'muslim'),
  h('2026-06-26', 'Muharram', 'muslim'),
  h('2026-08-15', 'Independence Day', 'national', 'Freedom from British rule, 1947'),
  h('2026-08-26', 'Milad-un-Nabi', 'muslim', 'Birthday of Prophet Mohammad'),
  h('2026-09-04', 'Janmashtami', 'hindu', 'Birth of Lord Krishna'),
  h('2026-10-02', 'Gandhi Jayanti', 'national', 'Birthday of Mahatma Gandhi'),
  h('2026-10-20', 'Dussehra (Vijaya Dashami)', 'hindu', 'Victory of good over evil'),
  h('2026-11-08', 'Diwali (Deepavali)', 'hindu', 'Festival of lights'),
  h('2026-11-24', 'Guru Nanak Jayanti', 'sikh', 'Birth of Guru Nanak Dev'),
  h('2026-12-25', 'Christmas', 'christian'),
];

const INDIA_2027: Holiday[] = [
  h('2027-01-26', 'Republic Day', 'national', 'Constitution came into force, 1950'),
  h('2027-03-10', 'Id-ul-Fitr', 'muslim', 'End of Ramzan fasting'),
  h('2027-03-23', 'Holi', 'hindu', 'Festival of colours'),
  h('2027-03-26', 'Good Friday', 'christian'),
  h('2027-04-15', 'Ram Navami', 'hindu', 'Birth of Lord Rama'),
  h('2027-04-19', 'Mahavir Jayanti', 'jain', 'Birth of Lord Mahavira'),
  h('2027-05-17', 'Id-ul-Zuha (Bakrid)', 'muslim'),
  h('2027-05-20', 'Buddha Purnima', 'buddhist', 'Birth of Gautama Buddha'),
  h('2027-06-16', 'Muharram', 'muslim'),
  h('2027-08-15', 'Independence Day', 'national', 'Freedom from British rule, 1947'),
  h('2027-08-15', 'Milad-un-Nabi', 'muslim', 'Birthday of Prophet Mohammad (same day as Independence Day)'),
  h('2027-08-25', 'Janmashtami', 'hindu', 'Birth of Lord Krishna'),
  h('2027-10-02', 'Gandhi Jayanti', 'national', 'Birthday of Mahatma Gandhi'),
  h('2027-10-09', 'Dussehra (Vijaya Dashami)', 'hindu', 'Victory of good over evil'),
  h('2027-10-29', 'Diwali (Deepavali)', 'hindu', 'Festival of lights'),
  h('2027-11-14', 'Guru Nanak Jayanti', 'sikh', 'Birth of Guru Nanak Dev'),
  h('2027-12-25', 'Christmas', 'christian'),
];

const TELANGANA_2026: Holiday[] = [
  h('2026-01-14', 'Bhogi', 'hindu', 'Bonfire day before Sankranti'),
  h('2026-01-15', 'Sankranti / Pongal', 'hindu', 'Harvest festival, kites & rangoli'),
  h('2026-01-26', 'Republic Day', 'national', 'Constitution came into force, 1950'),
  h('2026-02-15', 'Maha Shivaratri', 'hindu', 'Night of Lord Shiva'),
  h('2026-03-03', 'Holi', 'hindu', 'Festival of colours'),
  h('2026-03-19', 'Ugadi', 'hindu', 'Telugu New Year'),
  h('2026-03-21', 'Eid-ul-Fitr (Ramzan)', 'muslim', 'End of Ramzan fasting'),
  h('2026-03-22', 'Day after Ramzan', 'muslim'),
  h('2026-03-27', 'Sri Rama Navami', 'hindu', 'Birth of Lord Rama'),
  h('2026-04-03', 'Good Friday', 'christian'),
  h('2026-04-05', 'Babu Jagjivan Ram Jayanti', 'leader'),
  h('2026-04-14', 'Dr. B.R. Ambedkar Jayanti', 'leader', 'Architect of the Constitution'),
  h('2026-05-27', 'Eid-ul-Azha (Bakrid)', 'muslim'),
  h('2026-06-26', 'Muharram (Shahadat Imam Hussain)', 'muslim'),
  h('2026-08-10', 'Bonalu', 'state', 'Telangana’s festival for Goddess Mahakali'),
  h('2026-08-15', 'Independence Day', 'national', 'Freedom from British rule, 1947'),
  h('2026-08-26', 'Eid Milad-un-Nabi', 'muslim', 'Birthday of Prophet Mohammad'),
  h('2026-09-04', 'Sri Krishna Ashtami', 'hindu', 'Birth of Lord Krishna'),
  h('2026-09-14', 'Vinayaka Chavithi', 'hindu', 'Ganesh festival'),
  h('2026-10-02', 'Gandhi Jayanti', 'national', 'Birthday of Mahatma Gandhi'),
  h('2026-10-18', 'Saddula Bathukamma', 'state', 'Grand finale of the flower festival'),
  h('2026-10-20', 'Vijaya Dasami (Dasara)', 'hindu', 'Victory of good over evil'),
  h('2026-10-21', 'Day after Vijaya Dasami', 'hindu'),
  h('2026-11-08', 'Deepavali', 'hindu', 'Festival of lights'),
  h('2026-11-24', 'Kartika Purnima / Guru Nanak Jayanti', 'sikh'),
  h('2026-12-25', 'Christmas', 'christian'),
  h('2026-12-26', 'Day after Christmas (Boxing Day)', 'christian'),
];

const ANDHRA_2026: Holiday[] = [
  h('2026-01-14', 'Bhogi', 'hindu', 'Bonfire day before Sankranti'),
  h('2026-01-15', 'Makara Sankranti', 'hindu', 'Harvest festival, kites & rangoli'),
  h('2026-01-16', 'Kanuma', 'hindu', 'Day to honour cattle'),
  h('2026-01-26', 'Republic Day', 'national', 'Constitution came into force, 1950'),
  h('2026-02-15', 'Maha Sivaratri', 'hindu', 'Night of Lord Shiva'),
  h('2026-03-03', 'Holi', 'hindu', 'Festival of colours'),
  h('2026-03-19', 'Ugadi', 'hindu', 'Telugu New Year'),
  h('2026-03-20', 'Eid-ul-Fitr (Ramzan)', 'muslim', 'End of Ramzan fasting'),
  h('2026-03-27', 'Sri Rama Navami', 'hindu', 'Birth of Lord Rama'),
  h('2026-04-03', 'Good Friday', 'christian'),
  h('2026-04-05', 'Babu Jagjivan Ram Jayanti', 'leader'),
  h('2026-04-14', 'Dr. B.R. Ambedkar Jayanti', 'leader', 'Architect of the Constitution'),
  h('2026-05-27', 'Eid-ul-Adha (Bakrid)', 'muslim'),
  h('2026-06-25', 'Muharram', 'muslim'),
  h('2026-08-15', 'Independence Day', 'national', 'Freedom from British rule, 1947'),
  h('2026-08-21', 'Varalakshmi Vratham', 'hindu', 'Prayers to Goddess Lakshmi'),
  h('2026-08-25', 'Milad-un-Nabi', 'muslim', 'Birthday of Prophet Mohammad'),
  h('2026-09-04', 'Sri Krishna Ashtami', 'hindu', 'Birth of Lord Krishna'),
  h('2026-09-14', 'Vinayaka Chavithi', 'hindu', 'Ganesh festival'),
  h('2026-10-02', 'Gandhi Jayanti', 'national', 'Birthday of Mahatma Gandhi'),
  h('2026-10-18', 'Durgashtami', 'hindu', 'Eighth day of Navaratri'),
  h('2026-10-20', 'Vijaya Dasami', 'hindu', 'Victory of good over evil'),
  h('2026-11-08', 'Deepavali', 'hindu', 'Festival of lights'),
  h('2026-12-25', 'Christmas', 'christian'),
];

export const REGIONS: { id: Region; name: string; source: string; url: string }[] = [
  { id: 'india', name: 'India (Central Govt)', source: 'DoPT holiday list (Delhi/New Delhi offices)', url: 'https://dopt.gov.in/' },
  { id: 'telangana', name: 'Telangana', source: 'G.O.Rt.No.1715, GA Dept, 06.12.2025', url: 'https://www.telangana.gov.in/' },
  { id: 'andhra', name: 'Andhra Pradesh', source: 'G.O.Rt.No.2276, GA Dept, 04.12.2025', url: 'https://goir.ap.gov.in/' },
];

export const HOLIDAYS: Record<Region, Record<number, Holiday[]>> = {
  india: { 2026: INDIA_2026, 2027: INDIA_2027 },
  telangana: { 2026: TELANGANA_2026 },
  andhra: { 2026: ANDHRA_2026 },
};

export const YEARS = [2026, 2027];

/** Picture for each holiday (emoji art — no copyrighted photos). 'flag' = drawn tricolour (flag emoji shows as “IN” on Windows). */
export function holidayArt(name: string, kind: HolidayKind): string {
  const n = name.toLowerCase();
  const pick: [RegExp, string][] = [
    [/republic|independence/, 'flag'],
    [/gandhi/, '🕊️'],
    [/ambedkar|jagjivan/, '📘'],
    [/holi/, '🎨'],
    [/diwali|deepavali/, '🪔'],
    [/dussehra|dasami|dasara|durga/, '🏹'],
    [/bathukamma/, '🌼'],
    [/bonalu/, '🏺'],
    [/sankranti|pongal/, '🪁'],
    [/bhogi/, '🔥'],
    [/kanuma/, '🐄'],
    [/ugadi/, '🥭'],
    [/shiv|sivaratri/, '🔱'],
    [/ram navami|rama navami/, '🏹'],
    [/krishna|janmashtami/, '🦚'],
    [/vinayaka|ganesh/, '🐘'],
    [/varalakshmi/, '🌺'],
    [/christmas/, '🎄'],
    [/good friday/, '✝️'],
    [/guru nanak|kartika/, '🙏'],
    [/buddha/, '☸️'],
    [/mahavir/, '🕉️'],
    [/fitr|ramzan/, '🌙'],
    [/bakrid|zuha|azha|adha/, '🌙'],
    [/muharram/, '🕌'],
    [/milad/, '🕌'],
  ];
  return pick.find(([re]) => re.test(n))?.[1] ?? (kind === 'national' ? 'flag' : '🎉');
}
