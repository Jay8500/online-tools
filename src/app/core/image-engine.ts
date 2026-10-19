/**
 * Pure browser image pipeline — nothing is uploaded anywhere.
 * load → rotate → crop → (background / clean paper / brightness) → resize → name+date band → JPEG at a target KB.
 */

export const KB = 1024;
/** Longest side kept in memory after loading; exam outputs are tiny, this keeps cheap phones fast. */
const MAX_WORKING_SIDE = 3000;
export const MAX_FILE_MB = 30;

export type Rotation = 0 | 90 | 180 | 270;

/** Crop rectangle in 0..1 units of the rotated image. */
export interface Crop {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Stamp {
  name: string;
  date: string;
}

export interface RenderOptions {
  width: number;
  height: number;
  crop: Crop;
  /** Turn light-grey paper white and darken ink (signatures, thumbs). */
  cleanPaper: boolean;
  /** -50..50 */
  brightness: number;
  stamp: Stamp | null;
  /** Person mask (alpha) for the rotated image, from the AI background remover. */
  mask: HTMLCanvasElement | null;
}

export class ImageError extends Error {}

const ACCEPTED = /^image\/(jpeg|jpg|png|webp|gif|bmp|avif)$/i;
const HEIC = /heic|heif/i;

/** Decode a picked/dropped/pasted file into a working canvas (EXIF rotation applied). */
export async function loadImage(file: File): Promise<HTMLCanvasElement> {
  if (HEIC.test(file.type) || /\.(heic|heif)$/i.test(file.name)) {
    throw new ImageError('iPhone HEIC photos can’t be opened here. Share the photo as JPG (or set Camera → Formats → Most Compatible) and try again.');
  }
  if (!ACCEPTED.test(file.type) && !/\.(jpe?g|png|webp|gif|bmp|avif)$/i.test(file.name)) {
    throw new ImageError('File must be a JPG, PNG or WebP image.');
  }
  if (file.size > MAX_FILE_MB * KB * KB) throw new ImageError(`This file is larger than ${MAX_FILE_MB} MB. Please pick a smaller photo.`);

  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageError('This image could not be opened. It may be damaged — try another photo.');
  }
  const scale = Math.min(1, MAX_WORKING_SIDE / Math.max(bmp.width, bmp.height));
  const c = canvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return c;
}

export function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export function rotate(src: HTMLCanvasElement, r: Rotation): HTMLCanvasElement {
  if (r === 0) return src;
  const swap = r === 90 || r === 270;
  const c = canvas(swap ? src.height : src.width, swap ? src.width : src.height);
  const ctx = c.getContext('2d')!;
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((r * Math.PI) / 180);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return c;
}

/** Largest centred crop with the given aspect (width / height in pixels); null = whole image. */
export function defaultCrop(imgW: number, imgH: number, aspect: number | null): Crop {
  if (!aspect) return { x: 0, y: 0, w: 1, h: 1 };
  const imgAspect = imgW / imgH;
  if (imgAspect > aspect) {
    const w = aspect / imgAspect;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
  }
  const h = imgAspect / aspect;
  // Photos: keep a little more of the top (faces sit in the upper half)
  return { x: 0, y: Math.max(0, (1 - h) * 0.35), w: 1, h };
}

/** Height of the name/date band for a given output height. */
export function stampBand(height: number, stamp: Stamp | null): number {
  if (!stamp || (!stamp.name.trim() && !stamp.date.trim())) return 0;
  const lines = (stamp.name.trim() ? 1 : 0) + (stamp.date.trim() ? 1 : 0);
  return Math.round(height * (lines === 2 ? 0.2 : 0.12));
}

/** Draw the final picture (before encoding). */
export function render(src: HTMLCanvasElement, o: RenderOptions): HTMLCanvasElement {
  const out = canvas(o.width, o.height);
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, out.width, out.height);

  const band = stampBand(o.height, o.stamp);
  const areaH = out.height - band;
  const sx = o.crop.x * src.width;
  const sy = o.crop.y * src.height;
  const sw = Math.max(1, o.crop.w * src.width);
  const sh = Math.max(1, o.crop.h * src.height);

  let picture = downscale(src, sx, sy, sw, sh, out.width, areaH);
  if (o.mask) picture = applyMask(picture, o.mask, sx, sy, sw, sh);
  ctx.drawImage(picture, 0, 0);

  if (o.cleanPaper || o.brightness) adjustPixels(ctx, out.width, areaH, o.cleanPaper, o.brightness);
  if (band) drawStamp(ctx, out.width, areaH, band, o.stamp!);
  return out;
}

/** High-quality shrink: halve in steps so text and hair stay sharp (canvas smoothing alone gets jagged). */
function downscale(src: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number, w: number, h: number): HTMLCanvasElement {
  let cur = canvas(sw, sh);
  cur.getContext('2d')!.drawImage(src, sx, sy, sw, sh, 0, 0, cur.width, cur.height);
  while (cur.width / 2 >= w && cur.height / 2 >= h) {
    const half = canvas(cur.width / 2, cur.height / 2);
    const hc = half.getContext('2d')!;
    hc.imageSmoothingQuality = 'high';
    hc.drawImage(cur, 0, 0, half.width, half.height);
    cur = half;
  }
  const out = canvas(w, h);
  const oc = out.getContext('2d')!;
  oc.imageSmoothingQuality = 'high';
  oc.fillStyle = '#fff';
  oc.fillRect(0, 0, w, h);
  oc.drawImage(cur, 0, 0, w, h);
  return out;
}

/** Keep only the person (mask alpha), put them on white. */
function applyMask(picture: HTMLCanvasElement, mask: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number): HTMLCanvasElement {
  // The mask was made for the full rotated image, possibly at a smaller size.
  const fg = canvas(picture.width, picture.height);
  const fc = fg.getContext('2d')!;
  fc.drawImage(picture, 0, 0);
  fc.globalCompositeOperation = 'destination-in';
  fc.imageSmoothingQuality = 'high';
  const r = mask.width / maskSourceWidth(mask);
  fc.drawImage(mask, sx * r, sy * r, sw * r, sh * r, 0, 0, fg.width, fg.height);
  const out = canvas(picture.width, picture.height);
  const oc = out.getContext('2d')!;
  oc.fillStyle = '#fff';
  oc.fillRect(0, 0, out.width, out.height);
  oc.drawImage(fg, 0, 0);
  return out;
}

/** Masks remember the width of the image they were made from. */
export function maskSourceWidth(mask: HTMLCanvasElement): number {
  return Number(mask.dataset['srcWidth']) || mask.width;
}

function adjustPixels(ctx: CanvasRenderingContext2D, w: number, h: number, clean: boolean, brightness: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  let paper = 255;
  if (clean) {
    // Paper level = 90th percentile of brightness; ink stays, paper becomes pure white.
    const hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) hist[(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0]++;
    const target = (d.length / 4) * 0.9;
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= target) {
        paper = Math.max(v, 80);
        break;
      }
    }
  }
  const gain = 255 / paper;
  const add = brightness * 1.6;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] * gain + add;
    let g = d[i + 1] * gain + add;
    let b = d[i + 2] * gain + add;
    if (clean) {
      const l = r * 0.299 + g * 0.587 + b * 0.114;
      if (l > 225) r = g = b = 255;
      else {
        // Deepen the ink a little so thin pen strokes survive JPEG compression
        const k = 0.85;
        r *= k;
        g *= k;
        b *= k;
      }
    }
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
}

function drawStamp(ctx: CanvasRenderingContext2D, w: number, top: number, band: number, s: Stamp) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, top, w, band);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = [s.name.trim().toUpperCase(), s.date.trim()].filter(Boolean);
  const lineH = band / lines.length;
  lines.forEach((text, i) => {
    let size = Math.floor(lineH * 0.62);
    ctx.font = `600 ${size}px Arial, Helvetica, sans-serif`;
    while (size > 6 && ctx.measureText(text).width > w * 0.94) {
      size--;
      ctx.font = `600 ${size}px Arial, Helvetica, sans-serif`;
    }
    ctx.fillText(text, w / 2, top + lineH * i + lineH / 2 + 1);
  });
}

export interface EncodeResult {
  blob: Blob;
  quality: number;
  /** Bytes added as an invisible JPEG comment to reach the minimum size. */
  padded: number;
}

export type EncodeFailure = { tooBig: true; smallestKb: number };

function toBlob(c: HTMLCanvasElement, q: number): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new ImageError('Your browser could not create the JPG.'))), 'image/jpeg', q));
}

/**
 * Find the best JPEG quality that fits under maxKb, then pad up to minKb if the file is too small.
 * Returns a failure (with the smallest size we could reach) when even low quality is too big.
 */
export async function encodeToRange(c: HTMLCanvasElement, minKb: number, maxKb: number): Promise<EncodeResult | EncodeFailure> {
  const max = maxKb * KB - 256; // small safety margin under the limit
  let best = await toBlob(c, 0.92);
  let bestQ = 0.92;
  if (best.size > max) {
    let lo = 0.1;
    let hi = 0.92;
    let found: Blob | null = null;
    let foundQ = lo;
    for (let i = 0; i < 7; i++) {
      const q = (lo + hi) / 2;
      const b = await toBlob(c, q);
      if (b.size <= max) {
        found = b;
        foundQ = q;
        lo = q;
      } else hi = q;
    }
    if (!found) {
      const smallest = await toBlob(c, 0.1);
      if (smallest.size > max) return { tooBig: true, smallestKb: Math.ceil(smallest.size / KB) };
      found = smallest;
      foundQ = 0.1;
    }
    best = found;
    bestQ = foundQ;
  }
  const min = minKb * KB;
  if (minKb > 0 && best.size < min) {
    // Aim a bit above the minimum (portals sometimes round down), never above the maximum.
    const target = Math.min(max, Math.round(min + Math.min(4 * KB, (max - min) * 0.2)));
    const padded = await padJpeg(best, target);
    return { blob: padded, quality: bestQ, padded: padded.size - best.size };
  }
  return { blob: best, quality: bestQ, padded: 0 };
}

/** Insert JPEG comment (COM) segments right after the SOI marker — viewers ignore them, the picture is unchanged. */
async function padJpeg(blob: Blob, targetBytes: number): Promise<Blob> {
  const src = new Uint8Array(await blob.arrayBuffer());
  let need = targetBytes - src.length;
  const parts: Uint8Array[] = [src.subarray(0, 2)];
  while (need > 4) {
    const dataLen = Math.min(65533, need - 4);
    const seg = new Uint8Array(dataLen + 4);
    seg[0] = 0xff;
    seg[1] = 0xfe;
    seg[2] = ((dataLen + 2) >> 8) & 0xff;
    seg[3] = (dataLen + 2) & 0xff;
    seg.fill(0x20, 4); // spaces
    parts.push(seg);
    need -= seg.length;
  }
  parts.push(src.subarray(2));
  return new Blob(parts as BlobPart[], { type: 'image/jpeg' });
}

export function formatKb(bytes: number): string {
  const kb = bytes / KB;
  return kb >= 1000 ? `${(kb / KB).toFixed(2)} MB` : `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
}

export function todayDdMmYyyy(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
