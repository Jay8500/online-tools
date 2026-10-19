/**
 * PDF helpers — everything runs in the browser. pdf-lib (build/merge/split) and pdf.js (render pages)
 * are loaded only when a PDF tool is used.
 */

type PdfLib = typeof import('pdf-lib');
type PdfJs = typeof import('pdfjs-dist');

export class PdfError extends Error {}

let pdfLibP: Promise<PdfLib> | null = null;
let pdfJsP: Promise<PdfJs> | null = null;

export function pdfLib(): Promise<PdfLib> {
  pdfLibP ??= import('pdf-lib').then((m) => ((m as unknown as { PDFDocument?: unknown }).PDFDocument ? m : (m as unknown as { default: PdfLib }).default));
  return pdfLibP;
}

export function pdfJs(): Promise<PdfJs> {
  pdfJsP ??= import('pdfjs-dist').then((m) => {
    m.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    return m;
  });
  return pdfJsP;
}

export const MAX_PDF_MB = 100;

export async function readFile(f: File): Promise<Uint8Array> {
  return new Uint8Array(await f.arrayBuffer());
}

export function isPdf(f: File) {
  return f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
}

async function openPdf(bytes: Uint8Array, name = 'This PDF') {
  const { PDFDocument } = await pdfLib();
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (/encrypt/i.test(msg)) throw new PdfError(`${name} is password-protected. Remove the password first (open it and “Print → Save as PDF”).`);
    throw new PdfError(`${name} could not be opened. It may be damaged or not a real PDF.`);
  }
}

export async function pageCount(bytes: Uint8Array, name?: string): Promise<number> {
  return (await openPdf(bytes, name)).getPageCount();
}

export async function mergePdfs(files: { name: string; bytes: Uint8Array }[]): Promise<Uint8Array> {
  const { PDFDocument } = await pdfLib();
  const out = await PDFDocument.create();
  for (const f of files) {
    const src = await openPdf(f.bytes, f.name);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save({ useObjectStreams: true });
}

/** "1-3, 5, 8-" → zero-based page indexes. Returns an error message when invalid. */
export function parseRanges(text: string, count: number): number[] | string {
  const out = new Set<number>();
  const parts = text.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return 'Enter pages, e.g. 1-3, 5';
  for (const p of parts) {
    const m = /^(\d+)?\s*(-)?\s*(\d+)?$/.exec(p);
    if (!m || (!m[1] && !m[3])) return `“${p}” isn’t a page or range`;
    const a = m[1] ? +m[1] : 1;
    const b = m[2] ? (m[3] ? +m[3] : count) : a;
    if (a < 1 || b < 1 || a > count || b > count) return `This PDF has ${count} pages — “${p}” is outside that`;
    if (a > b) return `“${p}”: the first page must be smaller`;
    for (let i = a; i <= b; i++) out.add(i - 1);
  }
  return [...out].sort((x, y) => x - y);
}

export async function extractPages(bytes: Uint8Array, indexes: number[]): Promise<Uint8Array> {
  const { PDFDocument } = await pdfLib();
  const src = await openPdf(bytes);
  const out = await PDFDocument.create();
  (await out.copyPages(src, indexes)).forEach((p) => out.addPage(p));
  return out.save({ useObjectStreams: true });
}

/** Each page as its own small PDF. */
export async function splitAll(bytes: Uint8Array): Promise<Uint8Array[]> {
  const src = await openPdf(bytes);
  const result: Uint8Array[] = [];
  for (const i of src.getPageIndices()) result.push(await extractPages(bytes, [i]));
  return result;
}

export type Strength = 'light' | 'medium' | 'strong';
const STRENGTH: Record<Exclude<Strength, 'light'>, { dpi: number; quality: number }> = {
  medium: { dpi: 120, quality: 0.7 },
  strong: { dpi: 90, quality: 0.5 },
};

/**
 * light  = re-save with object streams (text stays selectable, small gains)
 * medium/strong = re-draw every page as a JPEG (big gains for scans/photos; text is no longer selectable)
 */
export async function compressPdf(bytes: Uint8Array, strength: Strength, onPage?: (n: number, total: number) => void): Promise<Uint8Array> {
  if (strength === 'light') return (await openPdf(bytes)).save({ useObjectStreams: true });
  const { dpi, quality } = STRENGTH[strength];
  const { PDFDocument } = await pdfLib();
  await openPdf(bytes); // friendly errors for locked/damaged files
  const doc = await loadForRender(bytes);
  const out = await PDFDocument.create();
  for (let n = 1; n <= doc.numPages; n++) {
    onPage?.(n, doc.numPages);
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const canvas = await renderPage(page, dpi / 72);
    const jpg = await canvasBytes(canvas, 'image/jpeg', quality);
    const img = await out.embedJpg(jpg);
    out.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
    canvas.width = canvas.height = 0;
  }
  await doc.loadingTask.destroy();
  return out.save({ useObjectStreams: true });
}

async function loadForRender(bytes: Uint8Array) {
  const pdfjs = await pdfJs();
  try {
    return await pdfjs.getDocument({
      data: bytes.slice(), // pdf.js takes ownership of the buffer
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      wasmUrl: '/pdfjs/wasm/',
      iccUrl: '/pdfjs/iccs/',
    }).promise;
  } catch (e) {
    if ((e as { name?: string })?.name === 'PasswordException') throw new PdfError('This PDF is password-protected. Remove the password first.');
    throw new PdfError('This PDF could not be opened. It may be damaged.');
  }
}

type PdfPage = Awaited<ReturnType<Awaited<ReturnType<typeof loadForRender>>['getPage']>>;

async function renderPage(page: PdfPage, scale: number): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}

function canvasBytes(c: HTMLCanvasElement, type: string, q?: number): Promise<Uint8Array> {
  return new Promise((res, rej) => c.toBlob(async (b) => (b ? res(new Uint8Array(await b.arrayBuffer())) : rej(new PdfError('Could not create the image.'))), type, q));
}

export interface PageImage {
  page: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

/** Render pages to JPG/PNG. dpi 150 is good for sharing, 200–300 for printing. */
export async function pdfToImages(bytes: Uint8Array, dpi: number, type: 'image/jpeg' | 'image/png', onPage?: (n: number, total: number) => void): Promise<PageImage[]> {
  const doc = await loadForRender(bytes);
  if (doc.numPages > 200) throw new PdfError('This PDF has more than 200 pages. Split it first.');
  const out: PageImage[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    onPage?.(n, doc.numPages);
    const canvas = await renderPage(await doc.getPage(n), dpi / 72);
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new PdfError('Could not create the image.'))), type, 0.9));
    out.push({ page: n, blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height });
    canvas.width = canvas.height = 0;
  }
  await doc.loadingTask.destroy();
  return out;
}

export type PageSize = 'a4' | 'letter' | 'fit';
const SIZES: Record<Exclude<PageSize, 'fit'>, [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] };

/** Photos/scans → one PDF. Images are downscaled to ≤ 2000 px and saved as JPEG to keep the file small. */
export async function imagesToPdf(files: File[], size: PageSize, marginPt: number, onImage?: (n: number, total: number) => void): Promise<Uint8Array> {
  const { PDFDocument } = await pdfLib();
  const out = await PDFDocument.create();
  for (let i = 0; i < files.length; i++) {
    onImage?.(i + 1, files.length);
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(files[i], { imageOrientation: 'from-image' });
    } catch {
      throw new PdfError(`“${files[i].name}” could not be opened. Use JPG, PNG or WebP images.`);
    }
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    const img = await out.embedJpg(await canvasBytes(c, 'image/jpeg', 0.85));
    let [pw, ph] = size === 'fit' ? [img.width * 0.75 + marginPt * 2, img.height * 0.75 + marginPt * 2] : SIZES[size];
    // Landscape photos go on landscape pages
    if (size !== 'fit' && img.width > img.height) [pw, ph] = [ph, pw];
    const s = Math.min((pw - marginPt * 2) / img.width, (ph - marginPt * 2) / img.height);
    const w = img.width * s;
    const h = img.height * s;
    out.addPage([pw, ph]).drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  return out.save({ useObjectStreams: true });
}

export function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function sizeLabel(bytes: number): string {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
