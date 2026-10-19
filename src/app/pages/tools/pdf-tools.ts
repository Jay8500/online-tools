import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, computed, inject, input, output, signal } from '@angular/core';
import {
  MAX_PDF_MB,
  PageImage,
  PageSize,
  PdfError,
  Strength,
  compressPdf,
  download,
  extractPages,
  imagesToPdf,
  isPdf,
  mergePdfs,
  pageCount,
  parseRanges,
  pdfBlob,
  pdfToImages,
  readFile,
  sizeLabel,
  splitAll,
} from '../../core/pdf';
import { ToastService, friendlyError } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

function errorText(e: unknown, fallback: string) {
  return e instanceof PdfError ? e.message : friendlyError(e, fallback);
}

/** Pick / drop files. Validates type and size and reports problems inline. */
@Component({
  selector: 'app-file-drop',
  imports: [Icon],
  template: `
    <label class="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition"
           [class.border-brand]="over()" [class.bg-brand/5]="over()" [class.border-line]="!over()"
           (dragover)="$event.preventDefault(); over.set(true)" (dragleave)="over.set(false)" (drop)="drop($event)">
      <span class="grid size-11 place-items-center rounded-2xl bg-brand/10 text-brand"><svg lucideIcon="file-up" [size]="22" /></span>
      <span class="btn-primary pointer-events-none">{{ label() }}</span>
      <span class="text-xs text-muted">or drag & drop here · {{ hint() }}</span>
      <span class="flex items-center gap-1 text-xs font-medium text-accent"><svg lucideIcon="lock" [size]="12" /> Stays on your device — nothing is uploaded</span>
      <input type="file" class="hidden" [accept]="accept()" [multiple]="multiple()" (change)="picked($event)" />
    </label>
  `,
})
export class FileDrop {
  readonly label = input('Choose files');
  readonly accept = input('application/pdf,.pdf');
  readonly hint = input('PDF');
  readonly multiple = input(true);
  readonly kind = input<'pdf' | 'image'>('pdf');
  readonly files = output<File[]>();
  private readonly toast = inject(ToastService);
  protected readonly over = signal(false);

  protected picked(e: Event) {
    const el = e.target as HTMLInputElement;
    this.take(Array.from(el.files ?? []));
    el.value = '';
  }
  protected drop(e: DragEvent) {
    e.preventDefault();
    this.over.set(false);
    this.take(Array.from(e.dataTransfer?.files ?? []));
  }
  private take(list: File[]) {
    const ok = list.filter((f) => (this.kind() === 'pdf' ? isPdf(f) : /^image\/(jpeg|png|webp|gif|bmp)$/.test(f.type)));
    if (ok.length < list.length) this.toast.warn(this.kind() === 'pdf' ? 'Only PDF files can be added here.' : 'Only JPG, PNG or WebP images can be added.');
    const small = ok.filter((f) => f.size <= MAX_PDF_MB * 1048576);
    if (small.length < ok.length) this.toast.warn(`Files over ${MAX_PDF_MB} MB were skipped.`);
    if (small.length) this.files.emit(this.multiple() ? small : small.slice(0, 1));
  }
}

interface Item {
  id: number;
  file: File;
  pages: number | null;
  error: string | null;
}

let seq = 0;

/** Ordered file list with move up/down/remove. */
@Component({
  selector: 'app-file-list',
  imports: [Icon],
  template: `
    <ul class="divide-y divide-line overflow-hidden rounded-2xl border border-line">
      @for (it of items(); track it.id; let i = $index; let last = $last) {
        <li class="flex items-center gap-2 bg-surface px-3 py-2">
          <span class="w-5 text-xs font-bold text-muted">{{ i + 1 }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-medium">{{ it.file.name }}</span>
            <span class="block text-xs" [class.text-rose-600]="!!it.error" [class.text-muted]="!it.error">
              {{ it.error ?? (size(it.file.size) + (it.pages !== null ? ' · ' + it.pages + ' page' + (it.pages === 1 ? '' : 's') : '')) }}
            </span>
          </span>
          <button type="button" class="btn-icon size-8" (click)="move.emit([i, -1])" [disabled]="i === 0" aria-label="Move up"><svg lucideIcon="arrow-up" [size]="14" /></button>
          <button type="button" class="btn-icon size-8" (click)="move.emit([i, 1])" [disabled]="last" aria-label="Move down"><svg lucideIcon="arrow-down" [size]="14" /></button>
          <button type="button" class="btn-icon size-8" (click)="remove.emit(i)" aria-label="Remove"><svg lucideIcon="x" [size]="14" /></button>
        </li>
      }
    </ul>
  `,
})
export class FileList {
  readonly items = input.required<Item[]>();
  readonly move = output<[number, number]>();
  readonly remove = output<number>();
  protected size = sizeLabel;
}

function moved<T>(arr: T[], i: number, d: number): T[] {
  const a = [...arr];
  const j = i + d;
  if (j < 0 || j >= a.length) return a;
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

const RESULT = 'mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3';

// ---------------- Merge ----------------
@Component({
  selector: 'app-pdf-merge',
  imports: [FileDrop, FileList, Icon],
  template: `
    <app-file-drop label="Choose PDFs" hint="pick 2 or more PDFs" (files)="add($event)" />
    @if (items().length) {
      <div class="mt-3"><app-file-list [items]="items()" (move)="move($event)" (remove)="remove($event)" /></div>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" class="btn-success" (click)="run()" [disabled]="busy() || items().length < 2 || hasError()">
          <svg lucideIcon="file-stack" [size]="16" /> {{ busy() ? 'Merging…' : 'Merge ' + items().length + ' PDFs' }}
        </button>
        @if (items().length < 2) { <span class="text-xs text-muted">Add at least 2 PDFs.</span> }
        @if (hasError()) { <span class="text-xs font-medium text-rose-600">Remove the files marked in red.</span> }
      </div>
    }
  `,
})
export class PdfMerge {
  private readonly toast = inject(ToastService);
  protected readonly items = signal<Item[]>([]);
  protected readonly busy = signal(false);
  protected readonly hasError = computed(() => this.items().some((i) => !!i.error));

  async add(files: File[]) {
    const fresh = files.map((file) => ({ id: ++seq, file, pages: null, error: null }) as Item);
    this.items.update((x) => [...x, ...fresh].slice(0, 50));
    for (const it of fresh) {
      try {
        const pages = await pageCount(await readFile(it.file), `“${it.file.name}”`);
        this.items.update((x) => x.map((y) => (y.id === it.id ? { ...y, pages } : y)));
      } catch (e) {
        this.items.update((x) => x.map((y) => (y.id === it.id ? { ...y, error: errorText(e, 'Could not open this PDF') } : y)));
      }
    }
  }
  move([i, d]: [number, number]) {
    this.items.update((x) => moved(x, i, d));
  }
  remove(i: number) {
    this.items.update((x) => x.filter((_, k) => k !== i));
  }
  async run() {
    this.busy.set(true);
    try {
      const files = await Promise.all(this.items().map(async (i) => ({ name: i.file.name, bytes: await readFile(i.file) })));
      const out = await mergePdfs(files);
      download(pdfBlob(out), 'merged.pdf');
      this.toast.success(`Merged ${files.length} PDFs (${sizeLabel(out.length)})`);
    } catch (e) {
      this.toast.error(errorText(e, 'Could not merge these PDFs.'));
    } finally {
      this.busy.set(false);
    }
  }
}

// ---------------- Split ----------------
@Component({
  selector: 'app-pdf-split',
  imports: [FileDrop, Icon],
  template: `
    @if (!file()) {
      <app-file-drop label="Choose a PDF" hint="one PDF" [multiple]="false" (files)="open($event[0])" />
    } @else {
      <div class="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 p-3">
        <svg lucideIcon="file-text" [size]="20" class="text-brand" />
        <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ file()!.name }}</span><span class="text-xs text-muted">{{ count() }} pages</span></span>
        <button type="button" class="btn-ghost min-h-9" (click)="reset()">Change</button>
      </div>
      <div class="mt-3 space-y-3">
        <div class="flex rounded-xl border border-line bg-surface-2 p-1 text-sm font-semibold" role="group" aria-label="Split mode">
          @for (m of modes; track m.id) {
            <button type="button" class="flex-1 rounded-lg px-2 py-1.5" [class.bg-surface]="mode() === m.id" [class.shadow-sm]="mode() === m.id" [attr.aria-pressed]="mode() === m.id" (click)="mode.set(m.id)">{{ m.label }}</button>
          }
        </div>
        @if (mode() !== 'all') {
          <div [class.field-invalid]="!!rangeError()">
            <label class="label" for="ranges">{{ mode() === 'keep' ? 'Pages to keep' : 'Pages to remove' }}</label>
            <input id="ranges" class="input" placeholder="e.g. 1-3, 5, 8-" [value]="ranges()" (input)="setRanges($event)" aria-describedby="ranges-msg" />
            @if (rangeError()) { <p id="ranges-msg" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ rangeError() }}</p> }
            @else { <p id="ranges-msg" class="mt-1 text-xs text-muted">Result will have {{ resultPages() }} of {{ count() }} pages.</p> }
          </div>
        }
        <button type="button" class="btn-success" (click)="run()" [disabled]="busy() || (mode() !== 'all' && !!rangeError())">
          <svg lucideIcon="scissors" [size]="16" /> {{ busy() ? 'Working…' : mode() === 'all' ? 'Split into ' + count() + ' files' : 'Create PDF' }}
        </button>
        @if (parts().length) {
          <div class="${RESULT}">
            <p class="w-full text-sm font-semibold">Tap each page to download:</p>
            @for (p of parts(); track $index; let i = $index) {
              <button type="button" class="chip min-h-8 text-xs" (click)="savePart(i)">Page {{ i + 1 }}</button>
            }
          </div>
        }
      </div>
    }
  `,
})
export class PdfSplit {
  private readonly toast = inject(ToastService);
  protected readonly modes = [
    { id: 'keep' as const, label: 'Keep pages' },
    { id: 'remove' as const, label: 'Remove pages' },
    { id: 'all' as const, label: 'Every page' },
  ];
  protected readonly file = signal<File | null>(null);
  private bytes: Uint8Array | null = null;
  protected readonly count = signal(0);
  protected readonly mode = signal<'keep' | 'remove' | 'all'>('keep');
  protected readonly ranges = signal('1');
  protected readonly busy = signal(false);
  protected readonly parts = signal<Uint8Array[]>([]);
  private readonly parsed = computed(() => parseRanges(this.ranges(), this.count()));
  protected readonly rangeError = computed(() => {
    const p = this.parsed();
    if (typeof p === 'string') return p;
    if (this.mode() === 'remove' && p.length >= this.count()) return 'You can’t remove every page';
    return null;
  });
  private readonly indexes = computed(() => {
    const p = this.parsed();
    if (typeof p === 'string') return [];
    return this.mode() === 'keep' ? p : [...Array(this.count()).keys()].filter((i) => !p.includes(i));
  });
  protected readonly resultPages = computed(() => this.indexes().length);

  async open(f: File) {
    try {
      const bytes = await readFile(f);
      const n = await pageCount(bytes, `“${f.name}”`);
      this.bytes = bytes;
      this.count.set(n);
      this.ranges.set(n > 1 ? `1-${Math.min(n, 2)}` : '1');
      this.parts.set([]);
      this.file.set(f);
    } catch (e) {
      this.toast.error(errorText(e, 'Could not open this PDF.'));
    }
  }
  reset() {
    this.file.set(null);
    this.bytes = null;
    this.parts.set([]);
  }
  setRanges(e: Event) {
    this.ranges.set((e.target as HTMLInputElement).value);
  }
  private base() {
    return this.file()!.name.replace(/\.pdf$/i, '');
  }
  async run() {
    if (!this.bytes) return;
    this.busy.set(true);
    try {
      if (this.mode() === 'all') {
        this.parts.set(await splitAll(this.bytes));
        this.toast.success(`Split into ${this.parts().length} files`);
      } else {
        const out = await extractPages(this.bytes, this.indexes());
        download(pdfBlob(out), `${this.base()}-pages.pdf`);
        this.toast.success(`Saved ${this.indexes().length} pages (${sizeLabel(out.length)})`);
      }
    } catch (e) {
      this.toast.error(errorText(e, 'Could not split this PDF.'));
    } finally {
      this.busy.set(false);
    }
  }
  savePart(i: number) {
    download(pdfBlob(this.parts()[i]), `${this.base()}-page-${i + 1}.pdf`);
  }
}

// ---------------- Compress ----------------
@Component({
  selector: 'app-pdf-compress',
  imports: [FileDrop, Icon],
  template: `
    @if (!file()) {
      <app-file-drop label="Choose a PDF" hint="one PDF" [multiple]="false" (files)="pick($event[0])" />
    } @else {
      <div class="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 p-3">
        <svg lucideIcon="file-text" [size]="20" class="text-brand" />
        <span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium">{{ file()!.name }}</span><span class="text-xs text-muted">{{ size(file()!.size) }}</span></span>
        <button type="button" class="btn-ghost min-h-9" (click)="file.set(null); result.set(null)">Change</button>
      </div>
      <fieldset class="mt-3 space-y-2">
        <legend class="label">Compression</legend>
        @for (s of strengths; track s.id) {
          <label class="flex cursor-pointer items-start gap-2 rounded-xl border p-2.5 text-sm" [class.border-brand]="strength() === s.id" [class.border-line]="strength() !== s.id">
            <input type="radio" name="strength" class="mt-1 accent-brand" [checked]="strength() === s.id" (change)="strength.set(s.id); result.set(null)" />
            <span><b>{{ s.label }}</b><span class="block text-xs text-muted">{{ s.hint }}</span></span>
          </label>
        }
      </fieldset>
      <button type="button" class="btn-success mt-3" (click)="run()" [disabled]="busy()">
        <svg lucideIcon="file-down" [size]="16" /> {{ busy() ? progress() : 'Compress PDF' }}
      </button>
      @if (result(); as r) {
        <div class="${RESULT}" aria-live="polite">
          @if (r.length < file()!.size) {
            <p class="flex-1 text-sm"><b>{{ size(file()!.size) }} → {{ size(r.length) }}</b> ({{ saved(r.length) }}% smaller)</p>
            <button type="button" class="btn-primary" (click)="save()"><svg lucideIcon="download" [size]="16" /> Download</button>
          } @else {
            <p class="text-sm">This PDF is already well compressed ({{ size(r.length) }} with this setting). Try a stronger level.</p>
          }
        </div>
      }
    }
  `,
})
export class PdfCompress {
  private readonly toast = inject(ToastService);
  protected readonly strengths = [
    { id: 'light' as Strength, label: 'Light', hint: 'Keeps text selectable. Small savings.' },
    { id: 'medium' as Strength, label: 'Recommended', hint: 'Pages become images (120 dpi). Good for scans and forms. Text is no longer selectable.' },
    { id: 'strong' as Strength, label: 'Strong', hint: 'Smallest file (90 dpi). Fine for viewing on screen; print may look soft.' },
  ];
  protected readonly file = signal<File | null>(null);
  protected readonly strength = signal<Strength>('medium');
  protected readonly busy = signal(false);
  protected readonly progress = signal('Compressing…');
  protected readonly result = signal<Uint8Array | null>(null);
  protected size = sizeLabel;

  pick(f: File) {
    this.file.set(f);
    this.result.set(null);
  }
  protected saved(n: number) {
    return Math.round((1 - n / this.file()!.size) * 100);
  }
  async run() {
    this.busy.set(true);
    this.result.set(null);
    try {
      const out = await compressPdf(await readFile(this.file()!), this.strength(), (n, t) => this.progress.set(`Page ${n} of ${t}…`));
      this.result.set(out);
    } catch (e) {
      this.toast.error(errorText(e, 'Could not compress this PDF.'));
    } finally {
      this.busy.set(false);
      this.progress.set('Compressing…');
    }
  }
  save() {
    download(pdfBlob(this.result()!), this.file()!.name.replace(/\.pdf$/i, '') + '-compressed.pdf');
  }
}

// ---------------- Images → PDF ----------------
@Component({
  selector: 'app-image-to-pdf',
  imports: [FileDrop, FileList, Icon],
  template: `
    <app-file-drop label="Choose images" hint="JPG, PNG, WebP" accept="image/*" kind="image" (files)="add($event)" />
    @if (items().length) {
      <div class="mt-3"><app-file-list [items]="items()" (move)="move($event)" (remove)="remove($event)" /></div>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label class="label" for="psize">Page size</label>
          <select id="psize" class="input" [value]="size()" (change)="setSize($event)">
            <option value="a4">A4</option><option value="letter">Letter</option><option value="fit">Same as image</option>
          </select>
        </div>
        <div>
          <label class="label" for="margin">Margin</label>
          <select id="margin" class="input" [value]="margin()" (change)="setMargin($event)">
            <option value="0">None</option><option value="18">Small</option><option value="36">Normal</option>
          </select>
        </div>
      </div>
      <button type="button" class="btn-success mt-3" (click)="run()" [disabled]="busy()">
        <svg lucideIcon="file-image" [size]="16" /> {{ busy() ? progress() : 'Create PDF (' + items().length + ' page' + (items().length === 1 ? '' : 's') + ')' }}
      </button>
    }
  `,
})
export class ImageToPdf {
  private readonly toast = inject(ToastService);
  protected readonly items = signal<Item[]>([]);
  protected readonly size = signal<PageSize>('a4');
  protected readonly margin = signal(18);
  protected readonly busy = signal(false);
  protected readonly progress = signal('');
  add(files: File[]) {
    this.items.update((x) => [...x, ...files.map((file) => ({ id: ++seq, file, pages: null, error: null }))].slice(0, 100));
  }
  move([i, d]: [number, number]) {
    this.items.update((x) => moved(x, i, d));
  }
  remove(i: number) {
    this.items.update((x) => x.filter((_, k) => k !== i));
  }
  setSize(e: Event) {
    this.size.set((e.target as HTMLSelectElement).value as PageSize);
  }
  setMargin(e: Event) {
    this.margin.set(Number((e.target as HTMLSelectElement).value));
  }
  async run() {
    this.busy.set(true);
    try {
      const out = await imagesToPdf(
        this.items().map((i) => i.file),
        this.size(),
        this.margin(),
        (n, t) => this.progress.set(`Image ${n} of ${t}…`),
      );
      download(pdfBlob(out), 'images.pdf');
      this.toast.success(`Created a ${this.items().length}-page PDF (${sizeLabel(out.length)})`);
    } catch (e) {
      this.toast.error(errorText(e, 'Could not create the PDF.'));
    } finally {
      this.busy.set(false);
    }
  }
}

// ---------------- PDF → images ----------------
@Component({
  selector: 'app-pdf-to-image',
  imports: [FileDrop, Icon],
  template: `
    @if (!file()) {
      <app-file-drop label="Choose a PDF" hint="one PDF" [multiple]="false" (files)="pick($event[0])" />
    } @else {
      <div class="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 p-3">
        <svg lucideIcon="file-text" [size]="20" class="text-brand" />
        <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ file()!.name }}</span>
        <button type="button" class="btn-ghost min-h-9" (click)="reset()">Change</button>
      </div>
      <div class="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label class="label" for="fmt">Format</label>
          <select id="fmt" class="input" [value]="type()" (change)="setType($event)"><option value="image/jpeg">JPG (smaller)</option><option value="image/png">PNG (sharp text)</option></select>
        </div>
        <div>
          <label class="label" for="dpi">Quality</label>
          <select id="dpi" class="input" [value]="dpi()" (change)="setDpi($event)"><option value="100">Screen (100 dpi)</option><option value="150">Good (150 dpi)</option><option value="200">Print (200 dpi)</option></select>
        </div>
      </div>
      <button type="button" class="btn-success mt-3" (click)="run()" [disabled]="busy()"><svg lucideIcon="image-up" [size]="16" /> {{ busy() ? progress() : 'Convert to images' }}</button>
      @if (pages().length) {
        <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          @for (p of pages(); track p.page) {
            <button type="button" class="group overflow-hidden rounded-xl border border-line bg-white text-left" (click)="save(p)" [attr.aria-label]="'Download page ' + p.page">
              <img [src]="p.url" [alt]="'Page ' + p.page" class="aspect-[3/4] w-full object-contain" loading="lazy" />
              <span class="flex items-center justify-between bg-surface-2 px-2 py-1 text-xs text-ink">Page {{ p.page }} <svg lucideIcon="download" [size]="14" /></span>
            </button>
          }
        </div>
      }
    }
  `,
})
export class PdfToImage {
  private readonly toast = inject(ToastService);
  protected readonly file = signal<File | null>(null);
  protected readonly type = signal<'image/jpeg' | 'image/png'>('image/jpeg');
  protected readonly dpi = signal(150);
  protected readonly busy = signal(false);
  protected readonly progress = signal('');
  protected readonly pages = signal<PageImage[]>([]);

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    inject(DestroyRef).onDestroy(() => browser && this.clearPages());
  }
  pick(f: File) {
    this.clearPages();
    this.file.set(f);
  }
  reset() {
    this.clearPages();
    this.file.set(null);
  }
  private clearPages() {
    this.pages().forEach((p) => URL.revokeObjectURL(p.url));
    this.pages.set([]);
  }
  setType(e: Event) {
    this.type.set((e.target as HTMLSelectElement).value as 'image/jpeg' | 'image/png');
  }
  setDpi(e: Event) {
    this.dpi.set(Number((e.target as HTMLSelectElement).value));
  }
  async run() {
    this.busy.set(true);
    this.clearPages();
    try {
      this.pages.set(await pdfToImages(await readFile(this.file()!), this.dpi(), this.type(), (n, t) => this.progress.set(`Page ${n} of ${t}…`)));
      this.toast.success(`${this.pages().length} page${this.pages().length === 1 ? '' : 's'} ready — tap one to download`);
    } catch (e) {
      this.toast.error(errorText(e, 'Could not convert this PDF.'));
    } finally {
      this.busy.set(false);
    }
  }
  save(p: PageImage) {
    download(p.blob, `${this.file()!.name.replace(/\.pdf$/i, '')}-page-${p.page}.${this.type() === 'image/png' ? 'png' : 'jpg'}`);
  }
}
