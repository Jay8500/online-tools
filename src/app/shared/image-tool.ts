import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, ElementRef, PLATFORM_ID, afterNextRender, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from './icon';
import { ConsentService } from '../core/consent.service';
import { CounterService } from '../core/counter.service';
import { DocKind } from '../core/exams';
import {
  Crop,
  ImageError,
  KB,
  Rotation,
  defaultCrop,
  encodeToRange,
  formatKb,
  loadImage,
  render,
  rotate,
  stampBand,
  todayDdMmYyyy,
} from '../core/image-engine';
import { ToastService, friendlyError } from '../core/toast.service';
import { Cropper } from './cropper';

/** What the tool should produce. `width/height` null = keep the cropped size (generic resizer). */
export interface ToolSpec {
  id: string;
  label: string;
  kind: DocKind | 'image';
  width: number | null;
  height: number | null;
  minKb: number;
  maxKb: number;
  stamp: boolean;
  pxRange?: string;
}

interface Result {
  url: string;
  blob: Blob;
  width: number;
  height: number;
  padded: number;
  /** Generic tool: we shrank the picture to reach the KB target. */
  shrunk: boolean;
}

const NAME_RE = /^[A-Za-z][A-Za-z .']{0,39}$/;
const DATE_RE = /^(0[1-9]|[12]\d|3[01])[/.-](0[1-9]|1[0-2])[/.-](19|20)\d\d$/;

@Component({
  selector: 'app-image-tool',
  imports: [FormsModule, Icon, Cropper],
  template: `
    <section class="card overflow-hidden" (dragover)="dragOver($event)" (dragleave)="dragging.set(false)" (drop)="drop($event)"
             [class.ring-4]="dragging()" [class.ring-brand]="dragging()" aria-label="Image resizer">
      <!-- Size summary + edit -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface-2 px-3 py-2 text-sm">
        @if (generic()) {
          <label for="kb" class="font-semibold">Target size</label>
          <div class="flex items-center gap-1.5">
            <input id="kb" class="input w-20 py-1.5 text-center" type="number" inputmode="numeric" min="1" max="5000"
                   [ngModel]="maxKb()" (ngModelChange)="setTargetKb($event)" [class.is-invalid]="!!kbError()" aria-describedby="kb-err" />
            <span class="text-muted">KB max</span>
          </div>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Quick sizes">
            @for (k of quickKb; track k) {
              <button type="button" class="chip min-h-8 px-2.5 text-xs" [attr.aria-pressed]="maxKb() === k" (click)="setTargetKb(k)">{{ k }} KB</button>
            }
          </div>
          @if (kbError()) {
            <p id="kb-err" class="w-full text-xs font-medium text-rose-600" role="alert">{{ kbError() }}</p>
          }
        } @else {
          <span class="flex items-center gap-1.5 font-semibold"><svg lucideIcon="ruler" [size]="16" class="text-brand" /> {{ width() }}×{{ height() }} px</span>
          <span class="text-muted">{{ minKb() }}–{{ maxKb() }} KB · JPG</span>
          <button type="button" class="ml-auto flex items-center gap-1 text-xs font-semibold text-brand hover:underline" (click)="editOpen.set(!editOpen())"
                  [attr.aria-expanded]="editOpen()" aria-controls="size-edit">
            <svg lucideIcon="sliders-horizontal" [size]="14" /> {{ editOpen() ? 'Done' : 'Change size' }}
          </button>
        }
      </div>

      @if (editOpen() && !generic()) {
        <div id="size-edit" class="grid grid-cols-2 gap-3 border-b border-line px-3 py-3 sm:grid-cols-4">
          @for (f of sizeFields; track f.key) {
            <div [class.field-invalid]="!!draftErrors()[f.key]">
              <label class="label" [for]="'f-' + f.key">{{ f.label }}</label>
              <input class="input py-1.5" type="number" inputmode="numeric" [id]="'f-' + f.key" [ngModel]="draft()[f.key]"
                     (ngModelChange)="setDraft(f.key, $event)" [attr.aria-describedby]="'e-' + f.key" />
              @if (draftErrors()[f.key]) {
                <p class="mt-1 text-xs font-medium text-rose-600" [id]="'e-' + f.key" role="alert">{{ draftErrors()[f.key] }}</p>
              }
            </div>
          }
          <p class="col-span-full text-xs text-muted">
            @if (spec().pxRange) { Allowed: {{ spec().pxRange }}. }
            Changes apply instantly. <button type="button" class="font-semibold text-brand hover:underline" (click)="resetSize()">Reset to official size</button>
          </p>
        </div>
      }

      @if (!source()) {
        <!-- Pick / take / paste / drop -->
        <div class="flex flex-col items-center gap-3 px-4 py-6 text-center sm:py-10">
          <span class="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand"><svg lucideIcon="image-up" [size]="24" /></span>
          <div class="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <button type="button" class="btn-primary flex-1 py-3 text-base" (click)="pick()" [disabled]="loading()">
              <svg lucideIcon="image-up" [size]="18" /> {{ loading() ? 'Opening…' : 'Choose ' + noun() }}
            </button>
            <button type="button" class="btn-ghost flex-1 py-3" (click)="camera()" [disabled]="loading()">
              <svg lucideIcon="camera" [size]="18" /> Take photo
            </button>
          </div>
          <p class="text-xs text-muted">or drag & drop, or paste (Ctrl+V) · JPG, PNG, WebP</p>
          <p class="flex items-center gap-1.5 text-xs font-medium text-accent">
            <svg lucideIcon="lock" [size]="14" /> Processed on your device — nothing is uploaded
          </p>
        </div>
      } @else {
        <div class="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_300px] md:gap-4">
          <!-- Editor -->
          <div class="min-w-0">
            <app-cropper [src]="rotated()!" [aspect]="cropAspect()" [(crop)]="crop" />
            <div class="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              <button type="button" class="btn-icon" (click)="turn(-90)" aria-label="Rotate left" title="Rotate left"><svg lucideIcon="rotate-ccw" [size]="18" /></button>
              <button type="button" class="btn-icon" (click)="turn(90)" aria-label="Rotate right" title="Rotate right"><svg lucideIcon="rotate-cw" [size]="18" /></button>
              <button type="button" class="btn-icon" (click)="resetCrop()" aria-label="Reset crop" title="Reset crop"><svg lucideIcon="crop" [size]="18" /></button>
              <button type="button" class="btn-ghost min-h-10" (click)="pick()"><svg lucideIcon="refresh-ccw" [size]="16" /> Change</button>
            </div>
          </div>

          <!-- Result + options -->
          <div class="flex min-w-0 flex-col gap-3">
            <div class="rounded-2xl border border-line bg-surface-2 p-3" aria-live="polite">
              <div class="flex gap-3">
                <div class="checker grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg ring-1 ring-line">
                  @if (result(); as r) {
                    <img [src]="r.url" alt="Resized result preview" class="max-h-full max-w-full object-contain" />
                  }
                </div>
                <div class="min-w-0 flex-1 text-sm">
                  @if (sizeInvalid()) {
                    <p class="flex items-start gap-1.5 font-semibold text-rose-600" role="alert"><svg lucideIcon="circle-x" [size]="16" class="mt-0.5 shrink-0" /> Fix the size fields above to continue.</p>
                  } @else if (busy()) {
                    <p class="font-semibold text-muted">Resizing…</p>
                  } @else if (failure()) {
                    <p class="flex items-start gap-1.5 font-semibold text-rose-600" role="alert"><svg lucideIcon="circle-x" [size]="16" class="mt-0.5 shrink-0" /> {{ failure() }}</p>
                  } @else if (result(); as r) {
                    <p class="text-lg leading-tight font-bold">{{ size(r.blob.size) }}</p>
                    <p class="text-muted">{{ r.width }}×{{ r.height }} px · JPG</p>
                    @if (!generic()) {
                      <p class="mt-1 flex items-center gap-1 text-xs font-semibold text-accent"><svg lucideIcon="circle-check" [size]="14" /> Meets {{ spec().label }} size</p>
                    } @else if (r.shrunk) {
                      <p class="mt-1 text-xs text-muted">Made smaller to fit {{ maxKb() }} KB.</p>
                    }
                  }
                </div>
              </div>
              <div class="mt-3 flex gap-2">
                <button type="button" class="btn-success flex-1 py-2.5 text-base" (click)="download()" [disabled]="!result() || busy() || !!failure() || sizeInvalid()">
                  <svg lucideIcon="download" [size]="18" /> Download
                </button>
                @if (canShare()) {
                  <button type="button" class="btn-icon size-11" (click)="share()" [disabled]="!result() || busy() || !!failure() || sizeInvalid()" aria-label="Share" title="Share">
                    <svg lucideIcon="share-2" [size]="18" />
                  </button>
                }
              </div>
            </div>

            <!-- Options -->
            <div class="flex flex-wrap gap-1.5" role="group" aria-label="Photo options">
              @if (isPhoto()) {
                <button type="button" class="chip" [attr.aria-pressed]="!!mask()" (click)="toggleBg()" [disabled]="removing()">
                  <svg lucideIcon="wand-sparkles" [size]="16" /> {{ removing() ? 'Working…' : 'White background' }}
                </button>
                <button type="button" class="chip" [attr.aria-pressed]="stampOn()" (click)="stampOn.set(!stampOn())">
                  <svg lucideIcon="type" [size]="16" /> Name & date
                </button>
              } @else {
                <button type="button" class="chip" [attr.aria-pressed]="cleanPaper()" (click)="cleanPaper.set(!cleanPaper())">
                  <svg lucideIcon="sparkles" [size]="16" /> Clean white paper
                </button>
              }
            </div>
            <div>
              <label for="bright" class="label flex justify-between"><span>Brightness</span><span>{{ brightness() > 0 ? '+' : '' }}{{ brightness() }}</span></label>
              <input id="bright" type="range" min="-40" max="40" step="5" class="w-full accent-brand" [ngModel]="brightness()" (ngModelChange)="brightness.set(+$event)" />
            </div>
            @if (isPhoto() && stampOn()) {
              <div class="grid grid-cols-2 gap-2">
                <div [class.field-invalid]="!!nameError()">
                  <label for="st-name" class="label">Name on photo</label>
                  <input id="st-name" class="input py-1.5" autocomplete="name" maxlength="40" [ngModel]="stampName()" (ngModelChange)="stampName.set($event)"
                         placeholder="Your name" aria-describedby="st-name-err" />
                  @if (nameError()) { <p id="st-name-err" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ nameError() }}</p> }
                </div>
                <div [class.field-invalid]="!!dateError()">
                  <label for="st-date" class="label">Date of photo</label>
                  <input id="st-date" class="input py-1.5" inputmode="numeric" maxlength="10" [ngModel]="stampDate()" (ngModelChange)="stampDate.set($event)"
                         placeholder="DD/MM/YYYY" aria-describedby="st-date-err" />
                  @if (dateError()) { <p id="st-date-err" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ dateError() }}</p> }
                </div>
              </div>
            }
          </div>
        </div>
      }
      <input #file type="file" accept="image/*" class="hidden" (change)="onFile($event)" />
      <input #cam type="file" accept="image/*" capture="user" class="hidden" (change)="onFile($event)" />
    </section>
  `,
})
export class ImageTool {
  readonly spec = input.required<ToolSpec>();

  private readonly toast = inject(ToastService);
  private readonly consent = inject(ConsentService);
  private readonly counter = inject(CounterService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('file');
  private readonly camInput = viewChild.required<ElementRef<HTMLInputElement>>('cam');

  protected readonly quickKb = [20, 50, 100, 200, 500];
  protected readonly sizeFields = [
    { key: 'width', label: 'Width (px)' },
    { key: 'height', label: 'Height (px)' },
    { key: 'minKb', label: 'Min KB' },
    { key: 'maxKb', label: 'Max KB' },
  ] as const;

  // ---- Size settings ----
  protected readonly generic = computed(() => this.spec().width === null);
  protected readonly width = signal(0);
  protected readonly height = signal(0);
  protected readonly minKb = signal(0);
  protected readonly maxKb = signal(50);
  protected readonly kbError = signal<string | null>(null);
  protected readonly editOpen = signal(false);
  protected readonly draft = signal<Record<'width' | 'height' | 'minKb' | 'maxKb', string>>({ width: '', height: '', minKb: '', maxKb: '' });
  protected readonly draftErrors = computed(() => {
    const d = this.draft();
    const e: Partial<Record<keyof typeof d, string>> = {};
    const int = (v: string) => (/^\d+$/.test(String(v).trim()) ? Number(v) : NaN);
    for (const k of ['width', 'height'] as const) {
      const n = int(d[k]);
      if (isNaN(n)) e[k] = 'Enter a whole number';
      else if (n < 20 || n > 3000) e[k] = 'Use 20 to 3000 px';
    }
    const min = int(d.minKb);
    const max = int(d.maxKb);
    if (isNaN(min)) e.minKb = 'Enter a whole number';
    if (isNaN(max) || max < 1) e.maxKb = 'Enter at least 1';
    else if (max > 5000) e.maxKb = 'Use 5000 KB or less';
    if (!e.minKb && !e.maxKb && min >= max) e.minKb = 'Must be less than max';
    return e;
  });
  /** A size field holds an invalid value → the shown result would not match what the visitor typed. */
  protected readonly sizeInvalid = computed(() => !this.generic() && Object.keys(this.draftErrors()).length > 0);

  // ---- Picture state ----
  protected readonly source = signal<HTMLCanvasElement | null>(null);
  protected readonly loading = signal(false);
  protected readonly rotation = signal<Rotation>(0);
  protected readonly rotated = computed(() => {
    const s = this.source();
    return s ? rotate(s, this.rotation()) : null;
  });
  protected readonly crop = signal<Crop>({ x: 0, y: 0, w: 1, h: 1 });
  protected readonly cleanPaper = signal(false);
  protected readonly brightness = signal(0);
  protected readonly mask = signal<HTMLCanvasElement | null>(null);
  protected readonly removing = signal(false);
  protected readonly stampOn = signal(false);
  protected readonly stampName = signal('');
  protected readonly stampDate = signal('');
  protected readonly dragging = signal(false);

  protected readonly isPhoto = computed(() => this.spec().kind === 'photo');
  protected readonly noun = computed(() => {
    const k = this.spec().kind;
    return k === 'photo' ? 'photo' : k === 'image' ? 'image' : k === 'signature' ? 'signature' : 'image';
  });
  protected readonly nameError = computed(() => {
    const v = this.stampName().trim();
    if (!v) return null;
    return NAME_RE.test(v) ? null : 'Letters, spaces and dots only';
  });
  protected readonly dateError = computed(() => {
    const v = this.stampDate().trim();
    if (!v) return 'Enter the date (DD/MM/YYYY)';
    return DATE_RE.test(v) ? null : 'Use DD/MM/YYYY';
  });
  /** Aspect of the picture area (the name/date band takes part of the height). */
  protected readonly cropAspect = computed(() => {
    if (this.generic()) return null;
    const h = this.height() - stampBand(this.height(), this.stamp());
    return this.width() / Math.max(1, h);
  });
  private readonly stamp = computed(() =>
    this.isPhoto() && this.stampOn() ? { name: this.nameError() ? '' : this.stampName(), date: this.dateError() ? '' : this.stampDate().replace(/[.-]/g, '/') } : null,
  );

  // ---- Output ----
  protected readonly result = signal<Result | null>(null);
  protected readonly failure = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly canShare = signal(false);
  private run = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Reset sizes whenever the page (spec) changes
    effect(() => {
      const s = this.spec();
      untracked(() => {
        this.applySpec(s);
        this.stampOn.set(s.stamp);
        this.cleanPaper.set(s.kind !== 'photo' && s.kind !== 'image');
      });
    });

    // Re-crop when the shape changes
    effect(() => {
      const img = this.rotated();
      const aspect = this.cropAspect();
      if (img) untracked(() => this.crop.set(defaultCrop(img.width, img.height, aspect)));
    });

    // Live result (debounced)
    effect(() => {
      const job = {
        img: this.rotated(),
        crop: this.crop(),
        w: this.width(),
        h: this.height(),
        min: this.minKb(),
        max: this.maxKb(),
        clean: this.cleanPaper(),
        bright: this.brightness(),
        stamp: this.stamp(),
        mask: this.mask(),
        generic: this.generic(),
        kbOk: !this.kbError(),
      };
      if (!job.img || !job.kbOk) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.process(job), 140);
    });

    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      this.canShare.set(typeof navigator.canShare === 'function');
      const paste = (e: ClipboardEvent) => {
        const f = Array.from(e.clipboardData?.files ?? []).find((x) => x.type.startsWith('image/'));
        if (f) {
          e.preventDefault();
          this.open(f);
        }
      };
      document.addEventListener('paste', paste);
      destroy.onDestroy(() => {
        document.removeEventListener('paste', paste);
        clearTimeout(this.timer);
        const r = this.result();
        if (r) URL.revokeObjectURL(r.url);
      });
    });
  }

  private applySpec(s: ToolSpec) {
    this.width.set(s.width ?? 0);
    this.height.set(s.height ?? 0);
    this.minKb.set(s.minKb);
    this.maxKb.set(s.maxKb);
    this.kbError.set(null);
    this.draft.set({ width: String(s.width ?? ''), height: String(s.height ?? ''), minKb: String(s.minKb), maxKb: String(s.maxKb) });
  }

  // ---- Size editing ----
  protected setDraft(key: 'width' | 'height' | 'minKb' | 'maxKb', v: string | number) {
    this.draft.update((d) => ({ ...d, [key]: String(v ?? '') }));
    const errs = this.draftErrors();
    if (Object.keys(errs).length) return;
    const d = this.draft();
    this.width.set(+d.width);
    this.height.set(+d.height);
    this.minKb.set(+d.minKb);
    this.maxKb.set(+d.maxKb);
  }

  protected resetSize() {
    this.applySpec(this.spec());
  }

  protected setTargetKb(v: string | number) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1) this.kbError.set('Enter a size of at least 1 KB');
    else if (n > 5000) this.kbError.set('Use 5000 KB or less');
    else {
      this.kbError.set(null);
      this.maxKb.set(n);
      return;
    }
  }

  // ---- Picking ----
  protected pick() {
    this.fileInput().nativeElement.click();
  }
  protected camera() {
    this.camInput().nativeElement.click();
  }
  protected onFile(e: Event) {
    const el = e.target as HTMLInputElement;
    const f = el.files?.[0];
    el.value = '';
    if (f) this.open(f);
  }
  protected dragOver(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(true);
  }
  protected drop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) this.open(f);
  }

  private async open(f: File) {
    this.loading.set(true);
    try {
      const img = await loadImage(f);
      this.mask.set(null);
      this.rotation.set(0);
      this.brightness.set(0);
      if (!this.stampDate()) this.stampDate.set(todayDdMmYyyy());
      this.source.set(img);
    } catch (e) {
      this.toast.error(e instanceof ImageError ? e.message : friendlyError(e, 'This image could not be opened. Try another photo.'));
    } finally {
      this.loading.set(false);
    }
  }

  // ---- Editing ----
  protected turn(deg: 90 | -90) {
    this.rotation.update((r) => (((r + deg + 360) % 360) as Rotation));
    this.mask.set(null); // mask belongs to the old orientation
  }
  protected resetCrop() {
    const img = this.rotated();
    if (img) this.crop.set(defaultCrop(img.width, img.height, this.cropAspect()));
  }

  protected async toggleBg() {
    if (this.mask()) return this.mask.set(null);
    const img = this.rotated();
    if (!img) return;
    this.removing.set(true);
    try {
      const { personMask } = await import('../core/bg-remove');
      this.mask.set(await personMask(img));
      this.toast.success('Background changed to white');
    } catch (e) {
      console.error(e);
      this.toast.error(
        navigator.onLine
          ? 'The background tool could not start on this browser. Try Chrome, or use a photo taken against a plain wall.'
          : 'The background tool needs internet once to download (about 4 MB). Connect and try again.',
      );
    } finally {
      this.removing.set(false);
    }
  }

  // ---- Output ----
  private async process(job: {
    img: HTMLCanvasElement | null;
    crop: Crop;
    w: number;
    h: number;
    min: number;
    max: number;
    clean: boolean;
    bright: number;
    stamp: { name: string; date: string } | null;
    mask: HTMLCanvasElement | null;
    generic: boolean;
  }) {
    const img = job.img!;
    const id = ++this.run;
    this.busy.set(true);
    this.failure.set(null);
    try {
      let w = job.w;
      let h = job.h;
      if (job.generic) {
        w = Math.round(job.crop.w * img.width);
        h = Math.round(job.crop.h * img.height);
      }
      let shrunk = false;
      for (let attempt = 0; ; attempt++) {
        const out = render(img, { width: w, height: h, crop: job.crop, cleanPaper: job.clean, brightness: job.bright, stamp: job.stamp, mask: job.mask });
        await new Promise((r) => setTimeout(r)); // keep the page responsive between steps
        if (id !== this.run) return;
        const enc = await encodeToRange(out, job.min, job.max);
        if (id !== this.run) return;
        if ('tooBig' in enc) {
          if (job.generic && attempt < 12 && w > 40 && h > 40) {
            // Generic tool: shrink until it fits.
            w = Math.round(w * 0.8);
            h = Math.round(h * 0.8);
            shrunk = true;
            continue;
          }
          this.setResult(null);
          this.failure.set(
            `Can’t reach ${job.max} KB at ${w}×${h} px (smallest is about ${enc.smallestKb} KB). Try smaller dimensions or a larger KB limit.`,
          );
          return;
        }
        this.setResult({ url: URL.createObjectURL(enc.blob), blob: enc.blob, width: w, height: h, padded: enc.padded, shrunk });
        return;
      }
    } catch (e) {
      if (id === this.run) this.failure.set(friendlyError(e, 'Could not resize this image. Try another photo.'));
    } finally {
      if (id === this.run) this.busy.set(false);
    }
  }

  private setResult(r: Result | null) {
    const old = this.result();
    if (old) URL.revokeObjectURL(old.url);
    this.result.set(r);
  }

  protected size(bytes: number) {
    return formatKb(bytes);
  }

  private fileName(r: Result) {
    return `${this.spec().id}-${r.width}x${r.height}-${Math.max(1, Math.round(r.blob.size / KB))}kb.jpg`;
  }

  private validStamp(): boolean {
    if (this.isPhoto() && this.stampOn() && (this.nameError() || this.dateError())) {
      this.toast.warn('Fix the name/date on the photo, or switch “Name & date” off.');
      return false;
    }
    return true;
  }

  protected download() {
    const r = this.result();
    if (!r || !this.browser || !this.validStamp()) return;
    const a = document.createElement('a');
    a.href = r.url;
    a.download = this.fileName(r);
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toast.success(`Saved ${formatKb(r.blob.size)} JPG`);
    this.counted('download');
  }

  protected async share() {
    const r = this.result();
    if (!r || !this.validStamp()) return;
    const file = new File([r.blob], this.fileName(r), { type: 'image/jpeg' });
    if (!navigator.canShare?.({ files: [file] })) {
      this.toast.info('Sharing files isn’t supported here — use Download instead.');
      return;
    }
    try {
      await navigator.share({ files: [file], title: this.spec().label });
      this.counted('share');
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') this.toast.fail(e);
    }
  }

  private counted(how: string) {
    this.consent.event('tool_use', { tool: this.spec().id, how });
    this.counter.hit(this.spec().id);
  }
}

