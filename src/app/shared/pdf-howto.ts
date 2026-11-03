import { Component, computed, input } from '@angular/core';

type Kind = 'merge' | 'split' | 'compress' | 'image-to-pdf' | 'pdf-to-image';
interface Box {
  label: string;
  sub: string;
  pdf: boolean;
}

/** One-line picture of what goes in and what comes out (e.g. 3 pages + 2 pages → 5 pages). */
@Component({
  selector: 'app-pdf-howto',
  template: `
    <div class="mb-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-surface-2/60 px-3 py-2.5 text-xs" aria-label="Example">
      <span class="mr-1 font-semibold text-muted">Example:</span>
      @for (b of flow().input; track $index; let last = $last) {
        <span class="flex flex-col items-center">
          <span class="grid h-11 w-9 place-items-center rounded-md border text-[10px] font-bold" [class]="b.pdf ? 'border-rose-300 bg-rose-500/10 text-rose-600' : 'border-sky-300 bg-sky-500/10 text-sky-600'">{{ b.label }}</span>
          <span class="mt-0.5 text-[10px] text-muted">{{ b.sub }}</span>
        </span>
        @if (!last) { <span class="font-bold text-muted">{{ flow().join }}</span> }
      }
      <span class="mx-1 text-lg text-brand" aria-hidden="true">→</span>
      @for (b of flow().output; track $index) {
        <span class="flex flex-col items-center">
          <span class="grid h-11 w-9 place-items-center rounded-md border-2 text-[10px] font-bold" [class]="b.pdf ? 'border-emerald-400 bg-emerald-500/10 text-emerald-700' : 'border-emerald-400 bg-emerald-500/10 text-emerald-700'">{{ b.label }}</span>
          <span class="mt-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">{{ b.sub }}</span>
        </span>
      }
    </div>
  `,
})
export class PdfHowto {
  readonly kind = input.required<Kind>();
  protected readonly flow = computed((): { input: Box[]; join: string; output: Box[] } => {
    switch (this.kind()) {
      case 'merge':
        return { input: [{ label: 'PDF', sub: '3 pages', pdf: true }, { label: 'PDF', sub: '2 pages', pdf: true }], join: '+', output: [{ label: 'PDF', sub: '5 pages, one file', pdf: true }] };
      case 'split':
        return { input: [{ label: 'PDF', sub: '10 pages', pdf: true }], join: '', output: [{ label: 'PDF', sub: 'pages 2–4 only', pdf: true }] };
      case 'compress':
        return { input: [{ label: 'PDF', sub: '5.2 MB', pdf: true }], join: '', output: [{ label: 'PDF', sub: '≈ 1.4 MB', pdf: true }] };
      case 'image-to-pdf':
        return { input: [{ label: 'JPG', sub: 'page 1', pdf: false }, { label: 'JPG', sub: 'page 2', pdf: false }], join: '+', output: [{ label: 'PDF', sub: '2 pages, A4', pdf: true }] };
      case 'pdf-to-image':
        return { input: [{ label: 'PDF', sub: '3 pages', pdf: true }], join: '', output: [{ label: 'JPG', sub: '3 images', pdf: false }] };
    }
  });
}
