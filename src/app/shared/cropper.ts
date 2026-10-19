import { Component, ElementRef, OnDestroy, computed, effect, input, model, signal, viewChild } from '@angular/core';
import { Crop } from '../core/image-engine';

type Mode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

interface Drag {
  mode: Mode;
  x: number;
  y: number;
  crop: Crop;
  rect: DOMRect;
}

const MIN = 0.06;

/**
 * Lightweight crop box: drag to move, corner handles to resize (aspect kept when `aspect` is set),
 * arrow keys move, +/- resize. Crop is in 0..1 units of the image.
 */
@Component({
  selector: 'app-cropper',
  template: `
    <div #box class="relative mx-auto w-fit touch-none overflow-hidden rounded-xl bg-surface-2 select-none">
      @if (url()) {
        <img [src]="url()" alt="Your photo — drag the box to choose the part to keep" draggable="false"
             class="block max-h-[42vh] max-w-full sm:max-h-[56vh]" (load)="loaded.set(true)" />
      }
      @if (loaded()) {
        @let c = crop();
        <div class="absolute cursor-move rounded-xs outline-2 outline-white shadow-[0_0_0_9999px_rgba(2,6,23,0.55)] focus-visible:outline-brand"
             [style.left.%]="c.x * 100" [style.top.%]="c.y * 100" [style.width.%]="c.w * 100" [style.height.%]="c.h * 100"
             tabindex="0" role="slider" aria-label="Crop area. Use arrow keys to move, plus and minus to resize."
             [attr.aria-valuetext]="valueText()"
             (pointerdown)="down($event, 'move')" (keydown)="key($event)">
          <!-- rule-of-thirds guides -->
          <div class="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40">
            @for (i of cells; track i) {
              <div class="border-[0.5px] border-white/70"></div>
            }
          </div>
          @for (h of handles; track h.mode) {
            <span class="absolute size-10 {{ h.pos }} {{ h.cursor }}" (pointerdown)="down($event, h.mode)">
              <span class="absolute size-5 border-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] {{ h.mark }}"></span>
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class Cropper implements OnDestroy {
  readonly src = input.required<HTMLCanvasElement>();
  /** Output width / height in pixels; null = free crop. */
  readonly aspect = input<number | null>(null);
  readonly crop = model.required<Crop>();
  /** Fires when a drag ends (good moment to re-render the output). */
  private readonly box = viewChild.required<ElementRef<HTMLDivElement>>('box');

  protected readonly url = signal<string | null>(null);
  protected readonly loaded = signal(false);
  protected readonly cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  /** Corner handles sit inside the box (the image edge would clip them) with a 40px touch area. */
  protected readonly handles: { mode: Mode; pos: string; cursor: string; mark: string }[] = [
    { mode: 'nw', pos: '-top-1 -left-1', cursor: 'cursor-nwse-resize', mark: 'top-1 left-1 border-t-4 border-l-4' },
    { mode: 'ne', pos: '-top-1 -right-1', cursor: 'cursor-nesw-resize', mark: 'top-1 right-1 border-t-4 border-r-4' },
    { mode: 'sw', pos: '-bottom-1 -left-1', cursor: 'cursor-nesw-resize', mark: 'bottom-1 left-1 border-b-4 border-l-4' },
    { mode: 'se', pos: '-right-1 -bottom-1', cursor: 'cursor-nwse-resize', mark: 'right-1 bottom-1 border-r-4 border-b-4' },
  ];
  protected readonly valueText = computed(() => {
    const c = this.crop();
    return `${Math.round(c.w * 100)}% wide, ${Math.round(c.h * 100)}% tall`;
  });
  private drag: Drag | null = null;

  constructor() {
    // Show the working canvas as a lightweight JPEG preview.
    effect((onCleanup) => {
      const c = this.src();
      let url: string | null = null;
      let alive = true;
      this.loaded.set(false);
      c.toBlob(
        (b) => {
          if (!alive || !b) return;
          url = URL.createObjectURL(b);
          this.url.set(url);
        },
        'image/jpeg',
        0.85,
      );
      onCleanup(() => {
        alive = false;
        if (url) URL.revokeObjectURL(url);
      });
    });
  }

  ngOnDestroy() {
    this.detach();
  }

  /** Width/height ratio in 0..1 units for the current aspect. */
  private ratio(): number | null {
    const a = this.aspect();
    if (!a) return null;
    const s = this.src();
    return (a * s.height) / s.width;
  }

  protected down(e: PointerEvent, mode: Mode) {
    e.preventDefault();
    e.stopPropagation();
    this.drag = { mode, x: e.clientX, y: e.clientY, crop: { ...this.crop() }, rect: this.box().nativeElement.getBoundingClientRect() };
    window.addEventListener('pointermove', this.move);
    window.addEventListener('pointerup', this.up);
    window.addEventListener('pointercancel', this.up);
  }

  private readonly move = (e: PointerEvent) => {
    const d = this.drag;
    if (!d) return;
    const dx = (e.clientX - d.x) / d.rect.width;
    const dy = (e.clientY - d.y) / d.rect.height;
    const c = d.crop;
    if (d.mode === 'move') {
      this.crop.set({ ...c, x: clamp(c.x + dx, 0, 1 - c.w), y: clamp(c.y + dy, 0, 1 - c.h) });
      return;
    }
    const east = d.mode === 'ne' || d.mode === 'se';
    const south = d.mode === 'sw' || d.mode === 'se';
    // Fixed corner = the opposite one
    const ax = east ? c.x : c.x + c.w;
    const ay = south ? c.y : c.y + c.h;
    let w = (east ? c.w + dx : c.w - dx);
    let h = (south ? c.h + dy : c.h - dy);
    const maxW = east ? 1 - ax : ax;
    const maxH = south ? 1 - ay : ay;
    const r = this.ratio();
    if (r) {
      w = Math.max(w, h * r);
      w = Math.max(MIN, Math.min(w, maxW, maxH * r));
      h = w / r;
    } else {
      w = clamp(w, MIN, maxW);
      h = clamp(h, MIN, maxH);
    }
    this.crop.set({ x: east ? ax : ax - w, y: south ? ay : ay - h, w, h });
  };

  private readonly up = () => {
    this.drag = null;
    this.detach();
  };

  private detach() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('pointermove', this.move);
    window.removeEventListener('pointerup', this.up);
    window.removeEventListener('pointercancel', this.up);
  }

  protected key(e: KeyboardEvent) {
    const c = this.crop();
    const step = e.shiftKey ? 0.05 : 0.01;
    let next: Crop | null = null;
    if (e.key === 'ArrowLeft') next = { ...c, x: clamp(c.x - step, 0, 1 - c.w) };
    else if (e.key === 'ArrowRight') next = { ...c, x: clamp(c.x + step, 0, 1 - c.w) };
    else if (e.key === 'ArrowUp') next = { ...c, y: clamp(c.y - step, 0, 1 - c.h) };
    else if (e.key === 'ArrowDown') next = { ...c, y: clamp(c.y + step, 0, 1 - c.h) };
    else if (e.key === '+' || e.key === '=' || e.key === '-') next = this.zoom(c, e.key === '-' ? 1.05 : 0.95);
    if (next) {
      e.preventDefault();
      this.crop.set(next);
    }
  }

  /** Resize around the centre. */
  private zoom(c: Crop, k: number): Crop {
    const r = this.ratio();
    let w = clamp(c.w * k, MIN, 1);
    let h = r ? w / r : clamp(c.h * k, MIN, 1);
    if (h > 1) {
      h = 1;
      w = r ? h * r : w;
    }
    const cx = c.x + c.w / 2;
    const cy = c.y + c.h / 2;
    return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h };
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
