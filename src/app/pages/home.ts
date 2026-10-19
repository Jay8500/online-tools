import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';
import { DOC_SHORT, DocKind, EXAMS, Exam, examPath } from '../core/exams';
import { CounterService } from '../core/counter.service';
import { SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { HUB_PATHS } from '../core/hub-paths';
import { TOOL_GROUPS, groupAnchor } from '../core/tools';
import { AdSlot } from '../shared/ad-slot';
import { LiveBadge } from '../shared/live-badge';
import { SOURCES } from '../core/sources';

const HOME_PER_GROUP = 4;
/** Rotating search hints — each one finds a tool when typed. */
const HINTS = [
  { icon: 'scale', text: 'gold rate' },
  { icon: 'scan-face', text: 'SSC photo' },
  { icon: 'calculator', text: 'EMI' },
  { icon: 'map-pin', text: 'train route' },
  { icon: 'thermometer', text: 'weather' },
  { icon: 'file-stack', text: 'merge PDF' },
  { icon: 'receipt', text: 'income tax' },
  { icon: 'ruler', text: 'acre to gunta' },
  { icon: 'qr-code', text: 'UPI QR' },
  { icon: 'heart-pulse', text: 'BMI' },
  { icon: 'languages', text: 'Telugu typing' },
  { icon: 'image-up', text: '20 KB photo' },
];
/** Everyday words people type, per tool path. */
const KEYWORDS: Record<string, string> = {
  'gold-price-calculator': 'gold rate today silver price jewellery 22k 24k',
  weather: 'weather temperature rain forecast climate',
  'travel-planner': 'travel route distance bus train flight trip journey stops',
  'land-area-converter': 'land acre to gunta cent ankanam gajam square yards plot',
  'number-converter': 'lakh crore million dozen',
  'emi-calculator': 'emi loan',
  'income-tax-calculator': 'income tax regime slab',
  'upi-qr-code-generator': 'upi qr payment gpay phonepe',
  'gst-invoice-generator': 'gst invoice bill',
  'bmi-calculator': 'bmi weight health',
  'telugu-typing': 'telugu typing',
  'resize-image-to-20kb': '20 kb photo',
  'resize-image-to-kb': 'photo kb compress image',
};
/** Every typed word must appear somewhere (so "acre to gunta" and "gold rate" work). */
function matches(q: string, hay: string): boolean {
  const h = hay.toLowerCase();
  return q.split(/\s+/).filter((w) => w && w !== 'to').every((w) => h.includes(w));
}

const HOME_EXAMS = 5;

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, Icon, AdSlot, LiveBadge],
  template: `
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-lg font-bold sm:text-2xl">Free online tools for India</h1>
        <p class="text-sm text-muted">Exam photo resizer, image to KB, EMI, SIP, income tax & more — fast, free, private.</p>
      </div>
      <label class="relative block sm:w-72">
        <span class="sr-only">Search tools</span>
        <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input class="input pl-9" type="search" aria-label="Search tools" [ngModel]="q()" (ngModelChange)="q.set($event)" (focus)="focused.set(true)" (blur)="focused.set(false)" />
        @if (!q() && !focused()) {
          <!-- Rotating hint (like quick-commerce apps): changes every 2.5 s, sits behind the input text -->
          <span class="pointer-events-none absolute inset-y-0 left-9 right-3 flex items-center overflow-hidden text-sm text-muted" aria-hidden="true">
            Search “
            @for (h of [hint()]; track h.text) {
              <span class="animate-hint mx-0.5 inline-flex items-center gap-1 font-medium text-ink"><svg [lucideIcon]="h.icon" [size]="14" class="text-brand" />{{ h.text }}</span>
            }
            ”
          </span>
        }
      </label>
    </div>

    <section id="exam-photo" class="mt-4 scroll-mt-16" aria-labelledby="h-exam">
      <div class="mb-2 flex items-baseline justify-between gap-2">
        <h2 id="h-exam" class="flex items-center gap-2 text-sm font-bold tracking-wide text-muted uppercase">
          <svg lucideIcon="scan-face" [size]="16" /> Exam photo & signature resizer
        </h2>
        <a routerLink="/exam-photo-signature-resize" class="shrink-0 text-xs font-semibold text-brand hover:underline">See all {{ examTotal }} exams + size table →</a>
      </div>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        @for (e of exams(); track e.slug) {
          <div class="card flex min-w-0 flex-col gap-2 p-2.5 sm:p-3">
            <a [routerLink]="'/' + path(e, 'photo')" class="group">
              <p class="font-bold group-hover:text-brand">{{ e.name }}</p>
              <p class="hidden text-xs text-muted sm:line-clamp-1">{{ e.full }}</p>
            </a>
            <div class="flex flex-wrap gap-1.5">
              @for (d of e.docs; track d.kind) {
                <a class="chip min-h-8 px-2 text-xs" [routerLink]="'/' + path(e, d.kind)">{{ short(d.kind) }}</a>
              }
            </div>
          </div>
        } @empty {
          <p class="text-sm text-muted">No exam matches “{{ q() }}”. Try the <a routerLink="/resize-image-to-kb" class="text-brand underline">resize to KB</a> tool.</p>
        }
      </div>
    </section>

    @for (g of groups(); track g.title) {
      <section class="mt-6 scroll-mt-16" [attr.aria-label]="g.title" [id]="anchor(g.title)">
        <div class="mb-2 flex items-baseline justify-between gap-2">
          <h2 class="text-sm font-bold tracking-wide text-muted uppercase">{{ g.title }}</h2>
          @if (hub(g.title); as hp) { <a [routerLink]="'/' + hp" class="shrink-0 text-xs font-semibold text-brand hover:underline">{{ g.total > g.tools.length ? 'See all ' + g.total + ' →' : 'Guide →' }}</a> }
        </div>
        <div class="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 md:grid-cols-4">
          @for (t of g.tools; track t.name) {
            @if (t.path) {
              <div class="card group relative flex items-center gap-3 p-3 transition hover:border-brand/50">
                <a [routerLink]="'/' + t.path" class="absolute inset-0 rounded-2xl" [attr.aria-label]="t.name"></a>
                <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><svg [lucideIcon]="t.icon" [size]="18" /></span>
                <span class="min-w-0"><span class="block text-sm font-semibold group-hover:text-brand">{{ t.name }}</span><span class="block text-xs text-muted">{{ t.blurb }}</span>
                @if (src(t.path); as ss) {
                  <span class="relative z-10 mt-0.5 block text-[10px] text-muted">Data: @for (s of ss; track s.url; let last = $last) {<a [href]="s.url" target="_blank" rel="noopener" class="underline decoration-dotted hover:text-brand">{{ s.name }}</a>@if (!last) {, }}</span>
                }</span>
                @if (live(t.path); as k) { <app-live-badge [kind]="k" /> }
              </div>
            } @else {
              <div class="card flex items-center gap-3 p-3 opacity-70">
                <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted"><svg [lucideIcon]="t.icon" [size]="18" /></span>
                <span class="min-w-0"><span class="block text-sm font-semibold">{{ t.name }}</span><span class="block text-xs text-muted">{{ t.blurb }} · coming soon</span></span>
              </div>
            }
          }
        </div>
      </section>
    }

    <app-ad-slot slot="top" />

    <section class="prose-tool mt-6 max-w-3xl">
      <h2>Why SpreadApps Tools?</h2>
      <p>
        Government and bank exam forms reject photos for the smallest reasons — wrong size in KB, wrong pixels, a grey background.
        These tools fix that in seconds on any phone. Everything runs inside your browser: your photos, signatures and documents
        are never uploaded, so they stay private. You can even install the site like an app and use it offline.
      </p>
    </section>
  `,
})
export class Home {
  protected readonly q = signal('');
  protected readonly focused = signal(false);
  private readonly hintIndex = signal(0);
  protected readonly hint = computed(() => HINTS[this.hintIndex() % HINTS.length]);
  /** Home is a quick menu: top picks per group; the group pages ("See all") have everything + guides. Search shows all matches. */
  protected readonly searching = computed(() => this.q().trim().length > 0);
  protected readonly examTotal = EXAMS.length;
  protected readonly exams = computed(() => {
    const q = this.q().trim().toLowerCase();
    if (!q) return EXAMS.slice(0, HOME_EXAMS);
    return EXAMS.filter((e) => matches(q, `${e.name} ${e.full} photo signature thumb declaration resize size kb exam`));
  });
  protected readonly groups = computed(() => {
    const q = this.q().trim().toLowerCase();
    if (!q) return TOOL_GROUPS.map((g) => ({ ...g, total: g.tools.length, tools: g.tools.slice(0, HOME_PER_GROUP) }));
    return TOOL_GROUPS.map((g) => ({ ...g, total: g.tools.length, tools: g.tools.filter((t) => matches(q, `${t.name} ${t.blurb} ${t.path ?? ''} ${KEYWORDS[t.path ?? ''] ?? ''}`)) })).filter((g) => g.tools.length);
  });

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      if (!browser || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const t = setInterval(() => this.hintIndex.update((i) => i + 1), 2500);
      destroy.onDestroy(() => clearInterval(t));
    });
    inject(CounterService).view('home');
    inject(SeoService).set({
      title: `${SITE.name} — Exam Photo Resizer, Image to KB & Free Indian Tools`,
      description:
        'Free tools for India: exam photo resizer, image to KB, EMI, SIP, income tax & GST calculators, PDF merge/compress, UPI QR, GST invoice, BMI and Telugu typing. Private, no upload.',
      path: '',
      jsonLd: [{ '@type': 'WebSite', name: SITE.name, url: SITE.url, inLanguage: 'en-IN' }],
    });
  }

  /** Third-party data credit (with links) for live tools. */
  protected src(path: string | null) {
    return path ? (SOURCES[path] ?? null) : null;
  }

  /** Cards that show a live value on the right (gold rate, weather). */
  protected live(path: string | null): 'gold' | 'weather' | null {
    return path === 'gold-price-calculator' ? 'gold' : path === 'weather' ? 'weather' : null;
  }

  protected hub(title: string) {
    return HUB_PATHS[title] ?? null;
  }

  protected anchor(title: string) {
    return groupAnchor(title);
  }

  protected path(e: Exam, k: DocKind) {
    return examPath(e, k);
  }
  protected short(k: DocKind) {
    return DOC_SHORT[k];
  }
}
