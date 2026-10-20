/**
 * Telugu Panchangam, calculated (no data source): Sun & Moon positions from astronomy-engine (MIT),
 * Lahiri ayanamsa, amanta months (Telugu convention), sunrise-based day. Times in IST.
 * Loaded only on the panchangam page.
 */
import { Body, Observer, SearchMoonPhase, SearchRiseSet, SunPosition, EclipticGeoMoon } from 'astronomy-engine';

export const TITHI_TE = ['పాడ్యమి', 'విదియ', 'తదియ', 'చవితి', 'పంచమి', 'షష్ఠి', 'సప్తమి', 'అష్టమి', 'నవమి', 'దశమి', 'ఏకాదశి', 'ద్వాదశి', 'త్రయోదశి', 'చతుర్దశి'];
export const TITHI_EN = ['Padyami', 'Vidiya', 'Tadiya', 'Chavithi', 'Panchami', 'Shashti', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'];
const NAK_TE = ['అశ్విని', 'భరణి', 'కృత్తిక', 'రోహిణి', 'మృగశిర', 'ఆరుద్ర', 'పునర్వసు', 'పుష్యమి', 'ఆశ్లేష', 'మఖ', 'పుబ్బ', 'ఉత్తర', 'హస్త', 'చిత్త', 'స్వాతి', 'విశాఖ', 'అనూరాధ', 'జ్యేష్ఠ', 'మూల', 'పూర్వాషాఢ', 'ఉత్తరాషాఢ', 'శ్రవణం', 'ధనిష్ఠ', 'శతభిషం', 'పూర్వాభాద్ర', 'ఉత్తరాభాద్ర', 'రేవతి'];
const NAK_EN = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Arudra', 'Punarvasu', 'Pushyami', 'Ashlesha', 'Makha', 'Pubba', 'Uttara', 'Hasta', 'Chitta', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Moola', 'Purvashadha', 'Uttarashadha', 'Shravanam', 'Dhanishta', 'Shatabhisham', 'Purvabhadra', 'Uttarabhadra', 'Revati'];
const YOGA_TE = ['విష్కంభం', 'ప్రీతి', 'ఆయుష్మాన్', 'సౌభాగ్యం', 'శోభన', 'అతిగండ', 'సుకర్మ', 'ధృతి', 'శూల', 'గండ', 'వృద్ధి', 'ధ్రువ', 'వ్యాఘాత', 'హర్షణ', 'వజ్ర', 'సిద్ధి', 'వ్యతీపాత', 'వరీయాన్', 'పరిఘ', 'శివ', 'సిద్ధ', 'సాధ్య', 'శుభ', 'శుక్ల', 'బ్రహ్మ', 'ఐంద్ర', 'వైధృతి'];
const YOGA_EN = ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'];
const KARANA_TE = ['బవ', 'బాలవ', 'కౌలవ', 'తైతుల', 'గరజ', 'వణిజ', 'భద్ర'];
const KARANA_EN = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Garaja', 'Vanija', 'Bhadra (Vishti)'];
const MASA_TE = ['చైత్ర', 'వైశాఖ', 'జ్యేష్ఠ', 'ఆషాఢ', 'శ్రావణ', 'భాద్రపద', 'ఆశ్వయుజ', 'కార్తీక', 'మార్గశిర', 'పుష్య', 'మాఘ', 'ఫాల్గుణ'];
const MASA_EN = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashvayuja', 'Kartika', 'Margashira', 'Pushya', 'Magha', 'Phalguna'];
const VARA_TE = ['ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'];
const SAMVAT_TE = ['ప్రభవ', 'విభవ', 'శుక్ల', 'ప్రమోదూత', 'ప్రజోత్పత్తి', 'ఆంగీరస', 'శ్రీముఖ', 'భావ', 'యువ', 'ధాత', 'ఈశ్వర', 'బహుధాన్య', 'ప్రమాది', 'విక్రమ', 'వృష', 'చిత్రభాను', 'స్వభాను', 'తారణ', 'పార్థివ', 'వ్యయ', 'సర్వజిత్', 'సర్వధారి', 'విరోధి', 'వికృతి', 'ఖర', 'నందన', 'విజయ', 'జయ', 'మన్మథ', 'దుర్ముఖి', 'హేవిళంబి', 'విళంబి', 'వికారి', 'శార్వరి', 'ప్లవ', 'శుభకృత్', 'శోభకృత్', 'క్రోధి', 'విశ్వావసు', 'పరాభవ', 'ప్లవంగ', 'కీలక', 'సౌమ్య', 'సాధారణ', 'విరోధికృత్', 'పరీధావి', 'ప్రమాదీచ', 'ఆనంద', 'రాక్షస', 'నల', 'పింగళ', 'కాళయుక్తి', 'సిద్ధార్థి', 'రౌద్రి', 'దుర్మతి', 'దుందుభి', 'రుధిరోద్గారి', 'రక్తాక్షి', 'క్రోధన', 'అక్షయ'];
const SAMVAT_EN = ['Prabhava', 'Vibhava', 'Shukla', 'Pramoduta', 'Prajotpatti', 'Angirasa', 'Shrimukha', 'Bhava', 'Yuva', 'Dhata', 'Eeshwara', 'Bahudhanya', 'Pramadi', 'Vikrama', 'Vrisha', 'Chitrabhanu', 'Swabhanu', 'Tarana', 'Parthiva', 'Vyaya', 'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikriti', 'Khara', 'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukhi', 'Hevilambi', 'Vilambi', 'Vikari', 'Sharvari', 'Plava', 'Shubhakrit', 'Shobhakrit', 'Krodhi', 'Vishvavasu', 'Parabhava', 'Plavanga', 'Keelaka', 'Saumya', 'Sadharana', 'Virodhikrit', 'Paridhavi', 'Pramadicha', 'Ananda', 'Rakshasa', 'Nala', 'Pingala', 'Kalayukti', 'Siddharthi', 'Raudri', 'Durmati', 'Dundubhi', 'Rudhirodgari', 'Raktakshi', 'Krodhana', 'Akshaya'];

/** Daytime is split into 8 parts; which part (1-8) is Rahu / Yama / Gulika for Sun..Sat. */
const RAHU = [8, 2, 7, 5, 6, 4, 3];
const YAMA = [5, 4, 3, 2, 1, 7, 6];
const GULIKA = [7, 6, 5, 4, 3, 2, 1];

const DAY = 86_400_000;
const IST = 5.5 * 3_600_000;
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Lahiri ayanamsa (degrees) — ~23.853° at J2000, precessing ~50.29″ a year. */
function ayanamsa(d: Date) {
  const years = (d.getTime() - Date.UTC(2000, 0, 1, 12)) / (365.25 * DAY);
  return 23.85295 + 0.0139697 * years;
}
const sunLon = (d: Date) => SunPosition(d).elon;
const moonLon = (d: Date) => EclipticGeoMoon(d).lon;
const sidereal = (lon: number, d: Date) => mod(lon - ayanamsa(d), 360);

/** Moon − Sun elongation (tithi), sidereal Moon (nakshatra), sidereal Sun + Moon (yoga). */
const elong = (d: Date) => mod(moonLon(d) - sunLon(d), 360);
const nakLon = (d: Date) => sidereal(moonLon(d), d);
const yogaLon = (d: Date) => mod(sidereal(moonLon(d), d) + sidereal(sunLon(d), d), 360);

/** When does f (a 0–360° angle that only grows) reach the next multiple of `step`? Hourly scan + bisection to ~1 min. */
function nextBoundary(f: (d: Date) => number, from: Date, step: number): Date {
  const target = (Math.floor(f(from) / step) + 1) * step;
  const gap = (d: Date) => mod(f(d) - target + 180, 360) - 180; // < 0 before the boundary, ≥ 0 after
  let a = from.getTime();
  let b = a + 3_600_000;
  while (gap(new Date(b)) < 0 && b - a < 3 * DAY) (a = b), (b += 3_600_000);
  while (b - a > 30_000) {
    const m = (a + b) / 2;
    if (gap(new Date(m)) < 0) a = m;
    else b = m;
  }
  return new Date(b);
}

export interface Span {
  start: Date;
  end: Date;
}
export interface Panchangam {
  date: string;
  sunrise: Date;
  sunset: Date;
  moonrise: Date | null;
  vaara: string;
  weekday: number;
  samvatsara: { te: string; en: string };
  masa: { te: string; en: string; adhika: boolean };
  paksha: { te: string; en: string };
  tithi: { te: string; en: string; num: number; end: Date; next: { te: string; en: string } };
  nakshatra: { te: string; en: string; end: Date; next: { te: string; en: string } };
  yoga: { te: string; en: string; end: Date };
  karana: { te: string; en: string; end: Date };
  rahu: Span;
  yama: Span;
  gulika: Span;
  abhijit: Span | null;
}

function tithiName(i: number) {
  // i = 0..29 → Shukla 1..15 (15 = Pournami), Krishna 1..15 (15 = Amavasya)
  const n = i % 15;
  if (i === 14) return { te: 'పౌర్ణమి', en: 'Pournami' };
  if (i === 29) return { te: 'అమావాస్య', en: 'Amavasya' };
  return { te: TITHI_TE[n], en: TITHI_EN[n] };
}

function karanaName(k: number) {
  // k = 0..59 half-tithis; fixed karanas at the ends of the lunar month
  if (k === 0) return { te: 'కింస్తుఘ్నం', en: 'Kimstughna' };
  if (k === 57) return { te: 'శకుని', en: 'Shakuni' };
  if (k === 58) return { te: 'చతుష్పాత్', en: 'Chatushpada' };
  if (k === 59) return { te: 'నాగవం', en: 'Naga' };
  const i = (k - 1) % 7;
  return { te: KARANA_TE[i], en: KARANA_EN[i] };
}

/** Lunar month (amanta) of the new moon before `d`: named after the sign the Sun is in at that new moon. */
function lunarMonth(d: Date) {
  const prevNew = SearchMoonPhase(0, new Date(d.getTime() - 31 * DAY), 32);
  let nm = prevNew!.date;
  // make sure it's the latest new moon not after d
  for (;;) {
    const next = SearchMoonPhase(0, new Date(nm.getTime() + DAY), 32)!.date;
    if (next.getTime() > d.getTime()) break;
    nm = next;
  }
  const nextNm = SearchMoonPhase(0, new Date(nm.getTime() + DAY), 32)!.date;
  const sign = Math.floor(sidereal(sunLon(nm), nm) / 30);
  const signNext = Math.floor(sidereal(sunLon(nextNm), nextNm) / 30);
  // Sun in Meena (11) at the new moon → Chaitra (0)
  const idx = mod(sign + 1, 12);
  return { idx, adhika: sign === signNext, newMoon: nm };
}

function span(sunrise: Date, part: number, len: number): Span {
  const start = new Date(sunrise.getTime() + (part - 1) * len);
  return { start, end: new Date(start.getTime() + len) };
}

/** Panchangam for a calendar date (YYYY-MM-DD, IST) at a place. */
export function panchangam(dateIso: string, lat: number, lon: number): Panchangam {
  const [y, m, d] = dateIso.split('-').map(Number);
  const midnightIst = new Date(Date.UTC(y, m - 1, d) - IST);
  const obs = new Observer(lat, lon, 0);
  const sunrise = SearchRiseSet(Body.Sun, obs, +1, midnightIst, 1)!.date;
  const sunset = SearchRiseSet(Body.Sun, obs, -1, sunrise, 1)!.date;
  const moonRise = SearchRiseSet(Body.Moon, obs, +1, midnightIst, 1);
  const moonrise = moonRise && moonRise.date.getTime() < midnightIst.getTime() + DAY ? moonRise.date : null;
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

  const ti = Math.floor(elong(sunrise) / 12);
  const ni = Math.floor(nakLon(sunrise) / (360 / 27));
  const yi = Math.floor(yogaLon(sunrise) / (360 / 27));
  const ki = Math.floor(elong(sunrise) / 6);

  const month = lunarMonth(sunrise);
  // Telugu year begins at Chaitra; Prabhava = 1987–88
  const chaitraStart = new Date(month.newMoon.getTime() - month.idx * 29.53 * DAY);
  const yearIdx = mod(new Date(chaitraStart.getTime() + IST).getUTCFullYear() - 1987, 60);

  const dayLen = sunset.getTime() - sunrise.getTime();
  const eighth = dayLen / 8;
  const muhurta = dayLen / 15;
  return {
    date: dateIso,
    sunrise,
    sunset,
    moonrise,
    weekday,
    vaara: VARA_TE[weekday],
    samvatsara: { te: SAMVAT_TE[yearIdx], en: SAMVAT_EN[yearIdx] },
    masa: { te: MASA_TE[month.idx], en: MASA_EN[month.idx], adhika: month.adhika },
    paksha: ti < 15 ? { te: 'శుక్ల పక్షం', en: 'Shukla paksha' } : { te: 'కృష్ణ పక్షం', en: 'Krishna paksha' },
    tithi: { ...tithiName(ti), num: ti, end: nextBoundary(elong, sunrise, 12), next: tithiName((ti + 1) % 30) },
    nakshatra: { te: NAK_TE[ni], en: NAK_EN[ni], end: nextBoundary(nakLon, sunrise, 360 / 27), next: { te: NAK_TE[(ni + 1) % 27], en: NAK_EN[(ni + 1) % 27] } },
    yoga: { te: YOGA_TE[yi], en: YOGA_EN[yi], end: nextBoundary(yogaLon, sunrise, 360 / 27) },
    karana: { ...karanaName(ki), end: nextBoundary(elong, sunrise, 6) },
    rahu: span(sunrise, RAHU[weekday], eighth),
    yama: span(sunrise, YAMA[weekday], eighth),
    gulika: span(sunrise, GULIKA[weekday], eighth),
    // Abhijit = 8th of 15 daytime muhurtas (traditionally not observed on Wednesday)
    abhijit: weekday === 3 ? null : span(sunrise, 8, muhurta),
  };
}
