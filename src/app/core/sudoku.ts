/**
 * Sudoku puzzles made on the device: a full grid is filled at random, then numbers are removed one
 * by one as long as the puzzle still has exactly one answer. A seed gives the same puzzle again
 * (used for the daily puzzle, the same for everyone).
 */
import type { CoachLang } from './chess';

export type SudokuLevel = 'easy' | 'medium' | 'hard';
/** Numbers left on the board for each level (hard stops earlier if a unique answer needs more). */
export const CLUES: Record<SudokuLevel, number> = { easy: 40, medium: 32, hard: 25 };

const ROW = (i: number) => Math.floor(i / 9);
const COL = (i: number) => i % 9;
const BOX = (i: number) => Math.floor(ROW(i) / 3) * 3 + Math.floor(COL(i) / 3);

/** Indexes of the 20 squares that share a row, column or box with each square. */
export const PEERS: number[][] = Array.from({ length: 81 }, (_, i) =>
  Array.from({ length: 81 }, (_, j) => j).filter((j) => j !== i && (ROW(j) === ROW(i) || COL(j) === COL(i) || BOX(j) === BOX(i))),
);
/** The 27 units: 9 rows, 9 columns, 9 boxes. */
export const UNITS: number[][] = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, b) => Array.from({ length: 9 }, (_, k) => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3))),
];

/** Small seeded random numbers (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(a: T[], rand: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const bits = (m: number) => {
  let n = 0;
  while (m) {
    m &= m - 1;
    n++;
  }
  return n;
};

/**
 * Counts answers (stops at `limit`). With `rand`, tries digits in random order and leaves the first
 * answer in `g` — that is how a full random grid is made.
 */
function solve(g: number[], limit: number, rand?: () => number): number {
  const rows = new Array(9).fill(0), cols = new Array(9).fill(0), boxes = new Array(9).fill(0);
  for (let i = 0; i < 81; i++)
    if (g[i]) {
      const b = 1 << g[i];
      rows[ROW(i)] |= b;
      cols[COL(i)] |= b;
      boxes[BOX(i)] |= b;
    }
  let found = 0;
  const step = (): boolean => {
    // The empty square with the fewest options first.
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const m = ~(rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)]) & 0x3fe;
      const n = bits(m);
      if (n < bestN) [best, bestMask, bestN] = [i, m, n];
      if (n === 0) return false;
    }
    if (best < 0) return ++found >= limit;
    let ds = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => bestMask & (1 << d));
    if (rand) ds = shuffle(ds, rand);
    const r = ROW(best), c = COL(best), x = BOX(best);
    for (const d of ds) {
      const b = 1 << d;
      g[best] = d;
      rows[r] |= b;
      cols[c] |= b;
      boxes[x] |= b;
      if (step()) return true;
      rows[r] &= ~b;
      cols[c] &= ~b;
      boxes[x] &= ~b;
    }
    g[best] = 0;
    return false;
  };
  step();
  return found;
}

export interface Puzzle {
  given: number[];
  answer: number[];
}

export function makePuzzle(level: SudokuLevel, seed = Math.floor(Math.random() * 2 ** 31)): Puzzle {
  const rand = rng(seed);
  const answer = new Array(81).fill(0);
  solve(answer, 1, rand);
  const given = answer.slice();
  let left = 81;
  for (const i of shuffle(Array.from({ length: 81 }, (_, k) => k), rand)) {
    if (left <= CLUES[level]) break;
    const keep = given[i];
    given[i] = 0;
    if (solve(given.slice(), 2) !== 1) given[i] = keep;
    else left--;
  }
  return { given, answer };
}

/** Today's date as a number like 20261108 (the phone's local date). */
export const todayKey = (d = new Date()) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/** Help lines. `{n}` = a number, `{t}` = time, `{m}` = mistakes. */
export const SUDOKU_TEXT: Record<CoachLang, Record<string, string>> = {
  te: {
    start: 'ప్రతి వరుస, నిలువు వరుస, 3×3 బాక్స్‌లో 1 నుంచి 9 వరకు ఒక్కో నంబర్ ఒకసారే రావాలి. ఖాళీ గడిని తాకి, కింద నంబర్ నొక్కండి.',
    notes: 'నోట్స్ ఆన్ ✏️ అనుమానం ఉన్న నంబర్లను చిన్నగా రాసుకోండి.',
    hint: 'సూచన 💡 ఈ గడిలో {n} వస్తుంది.',
    mistake: 'ఈ నంబర్ ఇక్కడ రాదు — అదే వరుస, నిలువు వరుస, బాక్స్ చూడండి.',
    line: 'సూపర్! ఒక లైన్ పూర్తయింది ✨',
    win: 'పజిల్ పూర్తి! 🎉',
    winSub: '{t}లో పూర్తి చేశారు · {m} తప్పులు',
    daily: 'ఈ రోజు పజిల్ 📅 అందరికీ ఇదే. రేపు కొత్తది వస్తుంది.',
    resumed: 'మీ పాత ఆట కొనసాగుతోంది. కొత్తది కావాలంటే New నొక్కండి.',
    pick: 'ముందు ఒక ఖాళీ గడిని ఎంచుకోండి.',
  },
  en: {
    start: 'Fill the grid so every row, column and 3×3 box has 1 to 9 exactly once. Tap an empty square, then a number below.',
    notes: 'Notes on ✏️ Jot small candidate numbers in a square.',
    hint: 'Hint 💡 This square is {n}.',
    mistake: 'That number doesn’t fit here — check the row, column and box.',
    line: 'Nice! A line is complete ✨',
    win: 'Puzzle solved! 🎉',
    winSub: 'Done in {t} · {m} mistakes',
    daily: 'Today’s puzzle 📅 The same for everyone. A new one comes tomorrow.',
    resumed: 'Your last game is back. Tap New for a fresh one.',
    pick: 'Pick an empty square first.',
  },
  hi: {
    start: 'हर पंक्ति, हर कॉलम और हर 3×3 बॉक्स में 1 से 9 तक हर अंक सिर्फ़ एक बार आए। खाली खाना छुएँ, फिर नीचे अंक दबाएँ।',
    notes: 'नोट्स चालू ✏️ संभावित अंक छोटे-छोटे लिख लें।',
    hint: 'सुझाव 💡 इस खाने में {n} आएगा।',
    mistake: 'यह अंक यहाँ नहीं आता — पंक्ति, कॉलम और बॉक्स देखें।',
    line: 'बढ़िया! एक लाइन पूरी हुई ✨',
    win: 'पहेली पूरी! 🎉',
    winSub: '{t} में पूरी · {m} गलतियाँ',
    daily: 'आज की पहेली 📅 सबके लिए यही। कल नई आएगी।',
    resumed: 'आपका पिछला खेल वापस आ गया। नया चाहिए तो New दबाएँ।',
    pick: 'पहले कोई खाली खाना चुनें।',
  },
  ta: {
    start: 'ஒவ்வொரு வரிசை, நெடுவரிசை, 3×3 பெட்டியிலும் 1 முதல் 9 வரை ஒவ்வொரு எண்ணும் ஒரு முறை மட்டும் வர வேண்டும். காலி கட்டத்தைத் தொட்டு, கீழே எண்ணை அழுத்துங்கள்.',
    notes: 'குறிப்புகள் இயக்கம் ✏️ சாத்தியமான எண்களைச் சிறியதாக எழுதுங்கள்.',
    hint: 'குறிப்பு 💡 இந்தக் கட்டத்தில் {n} வரும்.',
    mistake: 'இந்த எண் இங்கே வராது — வரிசை, நெடுவரிசை, பெட்டியைப் பாருங்கள்.',
    line: 'அருமை! ஒரு வரி முடிந்தது ✨',
    win: 'புதிர் முடிந்தது! 🎉',
    winSub: '{t} நேரத்தில் · {m} தவறுகள்',
    daily: 'இன்றைய புதிர் 📅 எல்லோருக்கும் இதுவே. நாளை புதியது வரும்.',
    resumed: 'உங்கள் பழைய ஆட்டம் தொடர்கிறது. புதியது வேண்டுமானால் New அழுத்துங்கள்.',
    pick: 'முதலில் ஒரு காலி கட்டத்தைத் தேர்ந்தெடுங்கள்.',
  },
  kn: {
    start: 'ಪ್ರತಿ ಸಾಲು, ಕಾಲಮ್ ಮತ್ತು 3×3 ಬಾಕ್ಸ್‌ನಲ್ಲಿ 1 ರಿಂದ 9 ರವರೆಗೆ ಪ್ರತಿ ಸಂಖ್ಯೆ ಒಮ್ಮೆ ಮಾತ್ರ ಬರಬೇಕು. ಖಾಲಿ ಮನೆಯನ್ನು ಮುಟ್ಟಿ, ಕೆಳಗೆ ಸಂಖ್ಯೆ ಒತ್ತಿ.',
    notes: 'ನೋಟ್ಸ್ ಆನ್ ✏️ ಸಾಧ್ಯವಿರುವ ಸಂಖ್ಯೆಗಳನ್ನು ಚಿಕ್ಕದಾಗಿ ಬರೆಯಿರಿ.',
    hint: 'ಸಲಹೆ 💡 ಈ ಮನೆಯಲ್ಲಿ {n} ಬರುತ್ತದೆ.',
    mistake: 'ಈ ಸಂಖ್ಯೆ ಇಲ್ಲಿ ಬರುವುದಿಲ್ಲ — ಸಾಲು, ಕಾಲಮ್, ಬಾಕ್ಸ್ ನೋಡಿ.',
    line: 'ಚೆನ್ನಾಗಿದೆ! ಒಂದು ಸಾಲು ಪೂರ್ಣ ✨',
    win: 'ಒಗಟು ಪೂರ್ಣ! 🎉',
    winSub: '{t} ಸಮಯದಲ್ಲಿ · {m} ತಪ್ಪುಗಳು',
    daily: 'ಇಂದಿನ ಒಗಟು 📅 ಎಲ್ಲರಿಗೂ ಇದೇ. ನಾಳೆ ಹೊಸದು ಬರುತ್ತದೆ.',
    resumed: 'ನಿಮ್ಮ ಹಳೆಯ ಆಟ ಮುಂದುವರಿಯುತ್ತಿದೆ. ಹೊಸದು ಬೇಕಾದರೆ New ಒತ್ತಿ.',
    pick: 'ಮೊದಲು ಒಂದು ಖಾಲಿ ಮನೆಯನ್ನು ಆರಿಸಿ.',
  },
  mr: {
    start: 'प्रत्येक ओळ, स्तंभ आणि 3×3 चौकटीत 1 ते 9 प्रत्येक अंक एकदाच यायला हवा. रिकामे घर दाबा, मग खाली अंक दाबा.',
    notes: 'नोट्स चालू ✏️ शक्य अंक लहान लिहून ठेवा.',
    hint: 'सूचना 💡 या घरात {n} येईल.',
    mistake: 'हा अंक इथे येत नाही — ओळ, स्तंभ आणि चौकट पाहा.',
    line: 'छान! एक ओळ पूर्ण झाली ✨',
    win: 'कोडे पूर्ण! 🎉',
    winSub: '{t} मध्ये पूर्ण · {m} चुका',
    daily: 'आजचे कोडे 📅 सर्वांसाठी हेच. उद्या नवे येईल.',
    resumed: 'तुमचा मागचा खेळ परत आला. नवा हवा असेल तर New दाबा.',
    pick: 'आधी एक रिकामे घर निवडा.',
  },
  or: {
    start: 'ପ୍ରତି ଧାଡ଼ି, ସ୍ତମ୍ଭ ଓ 3×3 ବାକ୍ସରେ 1 ରୁ 9 ପ୍ରତି ସଂଖ୍ୟା କେବଳ ଥରେ ଆସିବା ଦରକାର। ଖାଲି ଘର ଛୁଅଁନ୍ତୁ, ତା’ପରେ ତଳେ ସଂଖ୍ୟା ଦବାନ୍ତୁ।',
    notes: 'ନୋଟ୍ସ ଚାଲୁ ✏️ ସମ୍ଭାବ୍ୟ ସଂଖ୍ୟା ଛୋଟ କରି ଲେଖନ୍ତୁ।',
    hint: 'ପରାମର୍ଶ 💡 ଏହି ଘରେ {n} ଆସିବ।',
    mistake: 'ଏହି ସଂଖ୍ୟା ଏଠାରେ ଆସେ ନାହିଁ — ଧାଡ଼ି, ସ୍ତମ୍ଭ ଓ ବାକ୍ସ ଦେଖନ୍ତୁ।',
    line: 'ବହୁତ ଭଲ! ଗୋଟିଏ ଲାଇନ ପୂରା ହେଲା ✨',
    win: 'ପଜଲ୍ ପୂରା! 🎉',
    winSub: '{t}ରେ ପୂରା · {m} ଭୁଲ',
    daily: 'ଆଜିର ପଜଲ୍ 📅 ସମସ୍ତଙ୍କ ପାଇଁ ଏହା। କାଲି ନୂଆ ଆସିବ।',
    resumed: 'ଆପଣଙ୍କ ପୁରୁଣା ଖେଳ ଜାରି ରହିଛି। ନୂଆ ଚାହିଁଲେ New ଦବାନ୍ତୁ।',
    pick: 'ପ୍ରଥମେ ଗୋଟିଏ ଖାଲି ଘର ବାଛନ୍ତୁ।',
  },
};
