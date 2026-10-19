import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';
import { CounterService } from '../core/counter.service';
import { EXAMS, KB_PRESETS, examPath, kbPath } from '../core/exams';
import { Faq, SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { AdSlot } from '../shared/ad-slot';
import { FaqList } from '../shared/faq-list';
import { ImageTool, ToolSpec } from '../shared/image-tool';

@Component({
  selector: 'app-kb-tool',
  imports: [RouterLink, Icon, ImageTool, AdSlot, FaqList, DecimalPipe],
  template: `
    <div class="grid gap-x-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="min-w-0">
        <nav aria-label="Breadcrumb" class="mb-1 flex items-center gap-1 text-xs text-muted">
          <a routerLink="/" class="hover:text-brand hover:underline">Home</a><svg lucideIcon="chevron-right" [size]="12" />
          <a routerLink="/image-tools" class="hover:text-brand hover:underline">Image tools</a><svg lucideIcon="chevron-right" [size]="12" />
          <span aria-current="page" class="font-medium text-ink">{{ heading() }}</span>
        </nav>
        <h1 class="text-lg leading-snug font-bold sm:text-2xl">{{ heading() }} — free, no upload</h1>
        <p class="mt-0.5 mb-2 text-sm text-muted">
          Compress JPG, PNG or WebP to {{ generic() ? 'any size in KB' : 'under ' + kb() + ' KB' }} in seconds, right on your phone.
          @if (uses(); as n) { <span class="font-medium text-ink">Used {{ n | number }} times.</span> }
        </p>

        <app-image-tool [spec]="spec()" />

        <p class="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <svg lucideIcon="lock" [size]="14" class="mt-px shrink-0" /> Files are processed on your device and never uploaded.
        </p>

        <app-ad-slot slot="top" />

        <section class="mt-2" aria-labelledby="sizes">
          <h2 id="sizes" class="mb-2 text-sm font-bold">Other sizes & exam presets</h2>
          <div class="flex flex-wrap gap-1.5">
            @for (k of presets; track k) {
              <a class="chip min-h-8 text-xs" [routerLink]="'/' + pathFor(k)" [attr.aria-current]="!generic() && k === kb() ? 'page' : null">{{ k }} KB</a>
            }
            @for (e of exams; track e.slug) {
              <a class="chip min-h-8 text-xs" [routerLink]="'/' + photoPath(e)">{{ e.name }} photo</a>
            }
          </div>
        </section>

        <article class="prose-tool mt-4">
          <h2>How to resize an image to {{ generic() ? 'a size in KB' : kb() + ' KB' }}</h2>
          <ol class="list-decimal space-y-1 pl-5">
            @for (s of steps(); track $index) { <li>{{ s }}</li> }
          </ol>
          <h2>Why can’t every photo reach every size?</h2>
          <p>
            File size depends on the number of pixels and on the detail in the picture. A large, detailed photo cannot become
            10 KB without losing quality, so the tool first lowers JPG quality and then, if needed, reduces the width and height.
            It tells you the final size before you download. For exam forms with fixed pixel sizes, use the exam presets above.
          </p>
          <app-ad-slot slot="inContent" />
          <h2>Frequently asked questions</h2>
        </article>
        <app-faq-list [faqs]="faqs()" />
      </div>
      <aside class="mt-6 hidden lg:mt-0 lg:block" aria-label="More tools">
        <div class="sticky top-16"><app-ad-slot slot="sidebar" [minHeight]="250" /></div>
      </aside>
    </div>
  `,
})
export class KbTool {
  readonly kb = input(50, { transform: numberAttribute });
  readonly generic = input(false);

  private readonly seo = inject(SeoService);
  private readonly counter = inject(CounterService);
  protected readonly uses = signal<number | null>(null);
  protected readonly presets = KB_PRESETS;
  protected readonly exams = EXAMS;

  protected readonly path = computed(() => (this.generic() ? 'resize-image-to-kb' : kbPath(this.kb())));
  protected readonly heading = computed(() => (this.generic() ? 'Resize Image to KB' : `Resize Image to ${this.kb()} KB`));
  protected readonly spec = computed<ToolSpec>(() => ({
    id: this.generic() ? 'resize-kb' : `resize-${this.kb()}kb`,
    label: this.heading(),
    kind: 'image',
    width: null,
    height: null,
    minKb: 0,
    maxKb: this.kb(),
    stamp: false,
  }));

  protected readonly steps = computed(() => [
    'Tap “Choose image” or “Take photo”, or drag & drop / paste your picture.',
    this.generic() ? 'Type the size you need in KB, or tap a quick size like 20, 50 or 100 KB.' : `The target is already set to ${this.kb()} KB — change it any time.`,
    'Crop if you like (drag the box), rotate, or adjust brightness.',
    'Check the final size shown next to the preview and tap Download (or Share on your phone).',
  ]);

  protected readonly faqs = computed<Faq[]>(() => {
    const k = this.generic() ? 'a specific size' : `${this.kb()} KB`;
    return [
      {
        q: `How do I compress a photo to ${k}?`,
        a: `Choose your photo on this page${this.generic() ? ', type the KB size you need' : ''} and tap Download. The tool finds the best JPG quality under your limit and shrinks the dimensions only if it must.`,
      },
      { q: 'Is it free and safe?', a: 'Yes, it is completely free and your image never leaves your device — all processing happens inside your browser.' },
      { q: 'Which formats are supported?', a: 'You can open JPG, PNG, WebP, GIF and BMP files. The result is always a JPG, which every form and website accepts.' },
      {
        q: 'Does it work on mobile without an app?',
        a: 'Yes. It works in Chrome, Safari and other browsers on Android and iPhone. You can also install it like an app from the browser menu and use it offline.',
      },
      {
        q: 'Why is my iPhone photo not opening?',
        a: 'iPhones often save photos as HEIC. Share the photo as JPG first, or set Settings → Camera → Formats → Most Compatible.',
      },
    ];
  });

  constructor() {
    effect(() => {
      const title = this.generic() ? 'Resize Image to KB Online — Compress Photo to Exact Size' : `Resize Image to ${this.kb()} KB Online — Compress Photo Free`;
      const description = this.generic()
        ? 'Resize or compress any JPG, PNG or WebP photo to an exact size in KB — 10 KB, 20 KB, 50 KB, 100 KB or any size. Free, fast, works on mobile, no upload.'
        : `Compress any photo to under ${this.kb()} KB in seconds. Free online image resizer for forms and exams — works on mobile, nothing is uploaded.`;
      this.seo.set({
        title,
        description,
        path: this.path(),
        jsonLd: [
          SeoService.app(this.heading(), this.path(), description),
          SeoService.howTo(this.heading(), this.steps()),
          SeoService.faq(this.faqs()),
          SeoService.breadcrumbs([
            { name: 'Home', path: '' },
            { name: this.heading(), path: this.path() },
          ]),
        ],
      });
    });
    effect(() => {
      const id = this.spec().id;
      this.uses.set(null);
      this.counter.view(id);
      this.counter.get(id).then((n) => n !== null && n >= SITE.counterMinToShow && this.uses.set(n));
    });
  }

  protected pathFor(k: number) {
    return kbPath(k);
  }
  protected photoPath(e: (typeof EXAMS)[number]) {
    return examPath(e, 'photo');
  }
}
