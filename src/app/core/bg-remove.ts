import { canvas } from './image-engine';

/**
 * AI background remover (MediaPipe selfie segmenter), loaded only when the visitor taps it.
 * Runs on the device: the engine (~4 MB, cached by the browser) comes from jsDelivr,
 * the 250 KB model from our own site. The photo itself never leaves the device.
 */
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm';
const MODEL = '/models/selfie_segmenter.tflite';
/** Segment at this size at most — plenty for a passport photo, quick on cheap phones. */
const MAX_SIDE = 1024;

type Segmenter = import('@mediapipe/tasks-vision').ImageSegmenter;
let segmenter: Promise<Segmenter> | null = null;

function getSegmenter(): Promise<Segmenter> {
  segmenter ??= (async () => {
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
    const files = await FilesetResolver.forVisionTasks(WASM);
    const make = (delegate: 'GPU' | 'CPU') =>
      ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: 'IMAGE',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
    try {
      return await make('GPU');
    } catch {
      return await make('CPU');
    }
  })().catch((e) => {
    segmenter = null; // allow a retry (e.g. after the network comes back)
    throw e;
  });
  return segmenter;
}

/** Returns an alpha mask canvas (white = person) for the given image. */
export async function personMask(src: HTMLCanvasElement): Promise<HTMLCanvasElement> {
  const seg = await getSegmenter();
  const k = Math.min(1, MAX_SIDE / Math.max(src.width, src.height));
  const small = canvas(src.width * k, src.height * k);
  small.getContext('2d')!.drawImage(src, 0, 0, small.width, small.height);

  const result = seg.segment(small);
  const conf = result.confidenceMasks?.[0];
  if (!conf) throw new Error('No mask');
  const values = conf.getAsFloat32Array();
  const w = conf.width;
  const h = conf.height;
  result.close();

  // The model's single mask is "person" for selfie_segmenter; check the corners just in case and flip if needed.
  const corner = (values[0] + values[w - 1] + values[(h - 1) * w] + values[h * w - 1]) / 4;
  const center = values[Math.floor(h / 2) * w + Math.floor(w / 2)];
  const invert = corner > center;

  const mask = canvas(w, h);
  const ctx = mask.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < values.length; i++) {
    let p = invert ? 1 - values[i] : values[i];
    // Soft, slightly tightened edge
    p = Math.min(1, Math.max(0, (p - 0.35) / 0.4));
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = Math.round(p * 255);
  }
  ctx.putImageData(img, 0, 0);
  mask.dataset['srcWidth'] = String(src.width);
  return mask;
}
