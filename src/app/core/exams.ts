/**
 * Exam upload rules. One SEO page is generated per exam × document (e.g. /ssc-photo-resize).
 * Values follow the latest notifications we checked (see `checked`) — every page also tells
 * visitors to confirm with the official notification, and lets them edit the size.
 */
export type DocKind = 'photo' | 'signature' | 'thumb' | 'declaration';

export interface DocSpec {
  kind: DocKind;
  width: number;
  height: number;
  /** File size limits in KB (1 KB = 1024 bytes, as exam portals count it). */
  minKb: number;
  maxKb: number;
  /** Extra rule shown under the size (cm size, background, etc.). */
  note: string;
  /** Print name + date on the photo by default (UPSC asks for this). */
  stamp?: boolean;
  /** Pixel range the portal accepts, if it is a range rather than an exact size. */
  pxRange?: string;
}

export interface Exam {
  slug: string;
  /** Short name used in titles: "SSC" */
  name: string;
  /** Full name + exams covered */
  full: string;
  docs: DocSpec[];
  /** One exam-specific tip that makes each page genuinely useful (and unique). */
  tip: string;
  checked: string;
}

export const DOC_LABEL: Record<DocKind, string> = {
  photo: 'Photo',
  signature: 'Signature',
  thumb: 'Left thumb impression',
  declaration: 'Handwritten declaration',
};
export const DOC_SHORT: Record<DocKind, string> = {
  photo: 'Photo',
  signature: 'Signature',
  thumb: 'Thumb',
  declaration: 'Declaration',
};
export const DOC_SLUG: Record<DocKind, string> = {
  photo: 'photo',
  signature: 'signature',
  thumb: 'thumb',
  declaration: 'declaration',
};

const PHOTO_NOTE = 'Recent colour photo, light/white background, face clearly visible, no cap or dark glasses.';
const SIGN_NOTE = 'Sign with a black or blue pen on white paper. Signature in CAPITAL letters is not accepted.';

export const EXAMS: Exam[] = [
  {
    slug: 'ssc',
    name: 'SSC',
    full: 'Staff Selection Commission — CGL, CHSL, MTS, GD Constable, CPO, Steno',
    checked: '2026',
    tip: 'SSC now captures a live photo through the webcam in many forms. Use this resizer for the OTR or any SSC form that still asks you to upload a photo, and always for the signature.',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 20, maxKb: 50, note: `About 3.5 cm × 4.5 cm, JPG. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 400, height: 200, minKb: 10, maxKb: 20, note: `About 4 cm × 2 cm, JPG. ${SIGN_NOTE}` },
    ],
  },
  {
    slug: 'upsc',
    name: 'UPSC',
    full: 'Union Public Service Commission — Civil Services (IAS/IPS), CDS, NDA, CAPF, ESE',
    checked: '2026',
    tip: 'UPSC asks for the candidate’s name and the date the photo was taken printed on the photo, and the photo must not be older than 10 days. Turn on “Name & date on photo” below.',
    docs: [
      { kind: 'photo', width: 400, height: 500, minKb: 20, maxKb: 300, pxRange: '350 to 1000 px on each side', stamp: true, note: `JPG, name and date of photo printed at the bottom. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 700, height: 350, minKb: 20, maxKb: 300, pxRange: '350 to 1000 px on each side', note: `JPG. Upload 3 signatures one below another if the form asks. ${SIGN_NOTE}` },
    ],
  },
  {
    slug: 'ibps',
    name: 'IBPS',
    full: 'IBPS PO, Clerk, SO and RRB (Office Assistant & Officer Scale)',
    checked: '2026',
    tip: 'IBPS also asks for a left thumb impression and a handwritten declaration in English — use the tabs above for those. The declaration must be in your own handwriting, not in capital letters.',
    docs: [
      { kind: 'photo', width: 200, height: 230, minKb: 20, maxKb: 50, note: `4.5 cm × 3.5 cm, JPG. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 140, height: 60, minKb: 10, maxKb: 20, note: `JPG. ${SIGN_NOTE}` },
      { kind: 'thumb', width: 240, height: 240, minKb: 20, maxKb: 50, note: 'Left thumb with blue or black ink on white paper, 3 cm × 3 cm, JPG.' },
      { kind: 'declaration', width: 800, height: 400, minKb: 50, maxKb: 100, note: 'Declaration text in English in your own handwriting (not capitals), 10 cm × 5 cm, JPG.' },
    ],
  },
  {
    slug: 'sbi',
    name: 'SBI',
    full: 'State Bank of India — PO, Clerk (Junior Associate), SO',
    checked: '2026',
    tip: 'SBI uses the same sizes as IBPS. Blurred or group photos are rejected — crop tightly around your face and shoulders.',
    docs: [
      { kind: 'photo', width: 200, height: 230, minKb: 20, maxKb: 50, note: `JPG. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 140, height: 60, minKb: 10, maxKb: 20, note: `JPG. ${SIGN_NOTE}` },
      { kind: 'thumb', width: 240, height: 240, minKb: 20, maxKb: 50, note: 'Left thumb with blue or black ink on white paper, JPG.' },
      { kind: 'declaration', width: 800, height: 400, minKb: 50, maxKb: 100, note: 'Declaration in English in your own handwriting, JPG.' },
    ],
  },
  {
    slug: 'rrb',
    name: 'RRB',
    full: 'Railway Recruitment Boards — NTPC, Group D, ALP, JE, Technician',
    checked: '2026',
    tip: 'RRB forms reject photos with caps, sunglasses or a dark background. The same photo is used on your admit card, so use a clear, recent one.',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 30, maxKb: 70, note: `35 mm × 45 mm, JPG. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 500, height: 200, minKb: 30, maxKb: 70, note: `50 mm × 20 mm, JPG. ${SIGN_NOTE}` },
    ],
  },
  {
    slug: 'tspsc',
    name: 'TSPSC',
    full: 'Telangana Public Service Commission (TGPSC) — Group 1, 2, 3, 4 and OTR',
    checked: '2026',
    tip: 'Update your photo and signature once in the TGPSC OTR — every application then uses them. Keep the original high-quality photo in case the size rules change.',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 10, maxKb: 50, note: `3.5 cm × 4.5 cm, JPG. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 350, height: 150, minKb: 5, maxKb: 30, note: `3.5 cm × 1.5 cm, JPG. ${SIGN_NOTE}` },
    ],
  },
  {
    slug: 'appsc',
    name: 'APPSC',
    full: 'Andhra Pradesh Public Service Commission — Group 1, 2 and OTPR',
    checked: '2026',
    tip: 'APPSC OTPR keeps one photo and signature for all applications. The photo should be taken in the last few months and match how you will look at the exam.',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 10, maxKb: 50, note: `3.5 cm × 4.5 cm, JPG. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 350, height: 150, minKb: 5, maxKb: 50, note: `3.5 cm × 1.5 cm, JPG. ${SIGN_NOTE}` },
    ],
  },
  {
    slug: 'neet',
    name: 'NEET',
    full: 'NEET UG (National Testing Agency)',
    checked: '2026',
    tip: 'NEET also asks for a postcard-size (4″ × 6″) photo — upload that as it is if it is already under 200 KB, or use the generic resizer below.',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 10, maxKb: 200, note: `Passport size, JPG, 80% face coverage, white background. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 400, height: 150, minKb: 4, maxKb: 30, note: `JPG. ${SIGN_NOTE}` },
      { kind: 'thumb', width: 300, height: 300, minKb: 10, maxKb: 200, note: 'Left thumb impression in blue/black ink on white paper, JPG.' },
    ],
  },
  {
    slug: 'jee-main',
    name: 'JEE Main',
    full: 'JEE Main (National Testing Agency)',
    checked: '2026',
    tip: 'NTA rejects photos with a cap, goggles or a selfie-style angle. Ask someone to take the photo straight on against a plain wall.',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 10, maxKb: 200, note: `Passport size, JPG, white background. ${PHOTO_NOTE}` },
      { kind: 'signature', width: 400, height: 150, minKb: 4, maxKb: 30, note: `JPG. ${SIGN_NOTE}` },
    ],
  },
];

export function examPath(exam: Exam, kind: DocKind): string {
  return `${exam.slug}-${DOC_SLUG[kind]}-resize`;
}

/** Generic "resize image to N KB" landing pages (high-volume searches). */
export const KB_PRESETS = [10, 20, 30, 50, 100, 200, 500];
export function kbPath(kb: number): string {
  return `resize-image-to-${kb}kb`;
}
