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


export const EXAMS: Exam[] = [
  {
    slug: 'ssc',
    name: 'SSC',
    full: 'Staff Selection Commission — CGL, CHSL, MTS, GD Constable, CPO, Steno',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 20, maxKb: 50 },
      { kind: 'signature', width: 400, height: 200, minKb: 10, maxKb: 20 },
    ],
  },
  {
    slug: 'upsc',
    name: 'UPSC',
    full: 'Union Public Service Commission — Civil Services (IAS/IPS), CDS, NDA, CAPF, ESE',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 400, height: 500, minKb: 20, maxKb: 300, pxRange: '350 to 1000 px on each side', stamp: true },
      { kind: 'signature', width: 700, height: 350, minKb: 20, maxKb: 300, pxRange: '350 to 1000 px on each side' },
    ],
  },
  {
    slug: 'ibps',
    name: 'IBPS',
    full: 'IBPS PO, Clerk, SO and RRB (Office Assistant & Officer Scale)',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 200, height: 230, minKb: 20, maxKb: 50 },
      { kind: 'signature', width: 140, height: 60, minKb: 10, maxKb: 20 },
      { kind: 'thumb', width: 240, height: 240, minKb: 20, maxKb: 50 },
      { kind: 'declaration', width: 800, height: 400, minKb: 50, maxKb: 100 },
    ],
  },
  {
    slug: 'sbi',
    name: 'SBI',
    full: 'State Bank of India — PO, Clerk (Junior Associate), SO',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 200, height: 230, minKb: 20, maxKb: 50 },
      { kind: 'signature', width: 140, height: 60, minKb: 10, maxKb: 20 },
      { kind: 'thumb', width: 240, height: 240, minKb: 20, maxKb: 50 },
      { kind: 'declaration', width: 800, height: 400, minKb: 50, maxKb: 100 },
    ],
  },
  {
    slug: 'rrb',
    name: 'RRB',
    full: 'Railway Recruitment Boards — NTPC, Group D, ALP, JE, Technician',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 30, maxKb: 70 },
      { kind: 'signature', width: 500, height: 200, minKb: 30, maxKb: 70 },
    ],
  },
  {
    slug: 'tspsc',
    name: 'TSPSC',
    full: 'Telangana Public Service Commission (TGPSC) — Group 1, 2, 3, 4 and OTR',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 10, maxKb: 50 },
      { kind: 'signature', width: 350, height: 150, minKb: 5, maxKb: 30 },
    ],
  },
  {
    slug: 'appsc',
    name: 'APPSC',
    full: 'Andhra Pradesh Public Service Commission — Group 1, 2 and OTPR',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 10, maxKb: 50 },
      { kind: 'signature', width: 350, height: 150, minKb: 5, maxKb: 50 },
    ],
  },
  {
    slug: 'neet',
    name: 'NEET',
    full: 'NEET UG (National Testing Agency)',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 10, maxKb: 200 },
      { kind: 'signature', width: 400, height: 150, minKb: 4, maxKb: 30 },
      { kind: 'thumb', width: 300, height: 300, minKb: 10, maxKb: 200 },
    ],
  },
  {
    slug: 'jee-main',
    name: 'JEE Main',
    full: 'JEE Main (National Testing Agency)',
    checked: '2026',
    docs: [
      { kind: 'photo', width: 350, height: 450, minKb: 10, maxKb: 200 },
      { kind: 'signature', width: 400, height: 150, minKb: 4, maxKb: 30 },
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
