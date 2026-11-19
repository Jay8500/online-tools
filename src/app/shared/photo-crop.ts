import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, afterNextRender, effect, input, output, signal, viewChild } from '@angular/core';
import { BackLayer, pushLayer } from '../core/back-layer';

/** Where the photo sits inside a round frame: the point of the photo at the frame's centre (0–1) and the zoom (1 = just covers). */
export interface Crop {
  fx: number;
  fy: number;
  zoom: number;
}
export const NO_CROP: Crop = { fx: 0.5, fy: 0.5, zoom: 1 };

/** Keeps the frame fully covered by the photo for a given zoom. */
export function clampCrop(c: Crop, w: number, h: number): Crop {
  const zoom = Math.min(5, Math.max(1, c.zoom));
  const s = Math.max(1 / w, 1 / h) * zoom; // frame diameter = 1
  const hx = 0.5 / (w * s), hy = 0.5 / (h * s);
  return { zoom, fx: Math.min(1 - hx, Math.max(hx, c.fx)), fy: Math.min(1 - hy, Math.max(hy, c.fy)) };
}

/** Draws `img` into a circle of radius r at (cx, cy) using the crop. */
export function drawCropped(g: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, crop: Crop, cx: number, cy: number, r: number) {
  const c = clampCrop(crop, img.width, img.height);
  const s = Math.max((2 * r) / img.width, (2 * r) / img.height) * c.zoom;
  g.drawImage(img, cx - c.fx * img.width * s, cy - c.fy * img.height * s, img.width * s, img.height * s);
}

/**
 * Full-screen "Adjust photo" step, like WhatsApp: drag to move, pinch / wheel / slider to zoom, inside a round frame.
 * Phone back = Cancel.
 */
@Component({
  selector: 'app-photo-crop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pc" role="dialog" aria-modal="true" aria-label="Adjust photo">
      <p class="pc-t">Move and zoom your photo</p>
      <div class="pc-stage" #stage (pointerdown)="down($event)" (pointermove)="move($event)" (pointerup)="up($event)" (pointercancel)="up($event)" (wheel)="wheel($event)">
        <canvas #cv width="640" height="640"></canvas>
      </div>
      <label class="pc-z"><span aria-hidden="true">−</span>
        <input type="range" min="1" max="5" step="0.01" [value]="crop().zoom" (input)="zoomTo(+$any($event.target).value)" aria-label="Zoom" />
        <span aria-hidden="true">+</span></label>
      <p class="pc-h">Drag to move · pinch or slide to zoom</p>
      <div class="pc-b">
        <button type="button" class="pc-btn ghost" (click)="cancelled.emit()">Cancel</button>
        <button type="button" class="pc-btn ghost" (click)="reset()">Reset</button>
        <button type="button" class="pc-btn" (click)="done.emit(crop())">Done</button>
      </div>
    </div>
  `,
  styles: `
    .pc { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 16px; background: #0b1214; color: #fff; animation: pc-in .2s ease-out; }
    @keyframes pc-in { from { opacity: 0; } }
    .pc-t { margin: 0; font-weight: 700; font-size: 17px; }
    .pc-stage { width: min(86vw, 52vh, 380px); aspect-ratio: 1; touch-action: none; cursor: grab; border-radius: 16px; overflow: hidden; }
    .pc-stage:active { cursor: grabbing; }
    canvas { width: 100%; height: 100%; display: block; }
    .pc-z { display: flex; align-items: center; gap: 10px; width: min(86vw, 380px); font-size: 22px; }
    .pc-z input { flex: 1; accent-color: #2dd4bf; }
    .pc-h { margin: 0; font-size: 13px; opacity: .75; }
    .pc-b { display: flex; gap: 10px; }
    .pc-btn { min-height: 44px; padding: 0 22px; border-radius: 12px; border: 0; font-weight: 700; font-size: 15px; background: #14b8a6; color: #fff; cursor: pointer; }
    .pc-btn.ghost { background: rgb(255 255 255 / .14); }
  `,
})
export class PhotoCrop implements OnDestroy {
  readonly image = input.required<ImageBitmap>();
  readonly start = input<Crop>(NO_CROP);
  readonly done = output<Crop>();
  readonly cancelled = output<void>();
  protected readonly crop = signal<Crop>(NO_CROP);
  private readonly cv = viewChild<ElementRef<HTMLCanvasElement>>('cv');
  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly pts = new Map<number, { x: number; y: number }>();
  private pinch = 0;
  private layer?: BackLayer;

  constructor() {
    afterNextRender(() => {
      const img = this.image();
      this.crop.set(clampCrop(this.start(), img.width, img.height));
      this.layer = pushLayer(() => this.cancelled.emit());
    });
    effect(() => this.paint(this.crop()));
  }

  ngOnDestroy() {
    this.layer?.release();
  }

  private paint(c: Crop) {
    const cv = this.cv()?.nativeElement;
    const img = this.image();
    if (!cv) return;
    const g = cv.getContext('2d')!, S = cv.width, r = S * 0.42;
    g.fillStyle = '#0b1214';
    g.fillRect(0, 0, S, S);
    // whole photo, dimmed outside the frame
    drawCropped(g, img, c, S / 2, S / 2, r);
    g.fillStyle = 'rgb(0 0 0 / .55)';
    g.beginPath();
    g.rect(0, 0, S, S);
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2, true);
    g.fill('evenodd');
    g.strokeStyle = '#fff';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    g.stroke();
  }

  /** Screen pixels → fraction of the photo, at the current zoom. */
  private perPx() {
    const img = this.image(), el = this.stage()!.nativeElement, d = el.clientWidth * 0.84;
    const s = Math.max(d / img.width, d / img.height) * this.crop().zoom;
    return { x: 1 / (img.width * s), y: 1 / (img.height * s) };
  }

  protected down(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    this.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pts.size === 2) this.pinch = this.gap();
  }

  protected move(e: PointerEvent) {
    const p = this.pts.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    this.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pts.size === 2) {
      const g = this.gap();
      if (this.pinch) this.zoomTo(this.crop().zoom * (g / this.pinch));
      this.pinch = g;
      return;
    }
    const k = this.perPx(), c = this.crop(), img = this.image();
    this.crop.set(clampCrop({ ...c, fx: c.fx - dx * k.x, fy: c.fy - dy * k.y }, img.width, img.height));
  }

  protected up(e: PointerEvent) {
    this.pts.delete(e.pointerId);
    this.pinch = 0;
  }

  protected wheel(e: WheelEvent) {
    e.preventDefault();
    this.zoomTo(this.crop().zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
  }

  protected zoomTo(z: number) {
    const img = this.image();
    this.crop.set(clampCrop({ ...this.crop(), zoom: z }, img.width, img.height));
  }

  protected reset() {
    this.crop.set(NO_CROP);
  }

  private gap() {
    const [a, b] = [...this.pts.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
