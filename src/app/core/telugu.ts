/**
 * English (phonetic) → Telugu script, RTS/Lekhini-style:
 *   amma → అమ్మ, telugu → తెలుగు, nEnu → నేను, namaskAram → నమస్కారం, kRshNa → కృష్ణ
 * Capital letters pick the "harder" sound: T ట, D డ, N ణ, L ళ, S శ, Sh ష, E ఏ, O ఓ, A ఆ, I ఈ, U ఊ.
 */

const VIRAMA = '్';
const ANUSVARA = 'ం';
const VISARGA = 'ః';

/** [typed, independent vowel, vowel sign after a consonant] — longest keys first. */
const VOWELS: [string, string, string][] = [
  ['aa', 'ఆ', 'ా'],
  ['ai', 'ఐ', 'ై'],
  ['au', 'ఔ', 'ౌ'],
  ['ou', 'ఔ', 'ౌ'],
  ['ee', 'ఈ', 'ీ'],
  ['ii', 'ఈ', 'ీ'],
  ['oo', 'ఊ', 'ూ'],
  ['uu', 'ఊ', 'ూ'],
  ['Ru', 'ఋ', 'ృ'],
  ['A', 'ఆ', 'ా'],
  ['I', 'ఈ', 'ీ'],
  ['U', 'ఊ', 'ూ'],
  ['E', 'ఏ', 'ే'],
  ['O', 'ఓ', 'ో'],
  ['a', 'అ', ''],
  ['i', 'ఇ', 'ి'],
  ['u', 'ఉ', 'ు'],
  ['e', 'ఎ', 'ె'],
  ['o', 'ఒ', 'ొ'],
];

const CONSONANTS: [string, string][] = [
  ['ksh', 'క్ష'],
  ['chh', 'ఛ'],
  ['kh', 'ఖ'],
  ['gh', 'ఘ'],
  ['ch', 'చ'],
  ['Ch', 'ఛ'],
  ['jh', 'ఝ'],
  ['Th', 'ఠ'],
  ['Dh', 'ఢ'],
  ['th', 'థ'],
  ['dh', 'ధ'],
  ['ph', 'ఫ'],
  ['bh', 'భ'],
  ['sh', 'శ'],
  ['Sh', 'ష'],
  ['~g', 'ఙ'],
  ['~j', 'ఞ'],
  ['k', 'క'],
  ['g', 'గ'],
  ['c', 'చ'],
  ['j', 'జ'],
  ['z', 'జ'],
  ['T', 'ట'],
  ['D', 'డ'],
  ['N', 'ణ'],
  ['t', 'త'],
  ['d', 'ద'],
  ['n', 'న'],
  ['p', 'ప'],
  ['f', 'ఫ'],
  ['b', 'బ'],
  ['m', 'మ'],
  ['y', 'య'],
  ['r', 'ర'],
  ['R', 'ఱ'],
  ['l', 'ల'],
  ['L', 'ళ'],
  ['v', 'వ'],
  ['w', 'వ'],
  ['S', 'శ'],
  ['s', 'స'],
  ['h', 'హ'],
  ['x', 'క్ష'],
  ['q', 'క'],
];

function match<T extends [string, ...string[]]>(list: T[], text: string, i: number): T | undefined {
  return list.find(([k]) => text.startsWith(k, i));
}

const LETTER = /[A-Za-z~]/;

export function toTelugu(text: string): string {
  let out = '';
  let pending = false; // last output was a bare consonant (inherent "a" not yet decided)
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (!LETTER.test(ch)) {
      if (pending) out += VIRAMA;
      pending = false;
      out += ch;
      i++;
      continue;
    }
    // Word-final "m" after a vowel → anusvara (pustakam → పుస్తకం)
    if (ch === 'm' && !pending && i > 0 && LETTER.test(text[i - 1]) && (i + 1 >= text.length || !LETTER.test(text[i + 1]))) {
      out += ANUSVARA;
      i++;
      continue;
    }
    if (ch === 'M' || ch === 'H') {
      out += ch === 'M' ? ANUSVARA : VISARGA;
      pending = false;
      i++;
      continue;
    }
    const v = match(VOWELS, text, i);
    // Prefer the vowel "Ru" (ఋ/ృ) over consonant R + u
    if (v) {
      out += pending ? v[2] : v[1];
      pending = false;
      i += v[0].length;
      continue;
    }
    const c = match(CONSONANTS, text, i);
    if (c) {
      if (pending) out += VIRAMA;
      out += c[1];
      pending = true;
      i += c[0].length;
      continue;
    }
    // Anything else (unmapped letter) passes through unchanged
    if (pending) out += VIRAMA;
    pending = false;
    out += ch;
    i++;
  }
  if (pending) out += VIRAMA;
  return out;
}

/** Cheat sheet shown under the typing box. */
export const TELUGU_HELP: { en: string; te: string }[] = [
  { en: 'a A/aa', te: 'అ ఆ' },
  { en: 'i I/ee', te: 'ఇ ఈ' },
  { en: 'u U/oo', te: 'ఉ ఊ' },
  { en: 'e E', te: 'ఎ ఏ' },
  { en: 'ai', te: 'ఐ' },
  { en: 'o O', te: 'ఒ ఓ' },
  { en: 'au', te: 'ఔ' },
  { en: 'Ru', te: 'ఋ' },
  { en: 'M H', te: 'ం ః' },
  { en: 'k kh g gh', te: 'క ఖ గ ఘ' },
  { en: 'ch Ch j jh', te: 'చ ఛ జ ఝ' },
  { en: 'T Th D Dh N', te: 'ట ఠ డ ఢ ణ' },
  { en: 't th d dh n', te: 'త థ ద ధ న' },
  { en: 'p ph b bh m', te: 'ప ఫ బ భ మ' },
  { en: 'y r l v', te: 'య ర ల వ' },
  { en: 'S/sh Sh s h', te: 'శ ష స హ' },
  { en: 'L x/ksh R', te: 'ళ క్ష ఱ' },
];
