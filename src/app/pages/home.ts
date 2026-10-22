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
import { LiveBadge, WEATHER_ICON } from '../shared/live-badge';
import { Sky } from '../shared/sky';
import { MarketArt } from '../shared/market-art';
import { Benefits } from '../shared/benefits';
import { FestivalCard } from '../shared/festival-card';
import { PinButton } from '../shared/pin-button';
import { UserTools } from '../core/user-tools';
import { SOURCES } from '../core/sources';

const HOME_PER_GROUP = 4;
const EXAM_KEY = 'Exam photos';
/** Filter chips under the search box (keys = group titles). */
const CHIPS: { key: string; label: string; icon: string }[] = [
  { key: EXAM_KEY, label: 'Exam photos', icon: 'scan-face' },
  { key: 'Image tools', label: 'Image', icon: 'image-up' },
  { key: 'Money calculators', label: 'Money', icon: 'calculator' },
  { key: 'Daily tools', label: 'Daily', icon: 'calendar-days' },
  { key: 'PDF tools', label: 'PDF', icon: 'file-stack' },
  { key: 'Converters', label: 'Converters', icon: 'ruler' },
  { key: 'Business tools', label: 'Business', icon: 'receipt' },
  { key: 'Health calculators', label: 'Health', icon: 'heart-pulse' },
  { key: 'Language tools', label: 'Language', icon: 'languages' },
];
/** Topic chips: related tools picked across groups (shown first, after "All"). */
const TOPICS: { key: string; label: string; icon: string; title: string; paths: string[] }[] = [
  { key: 'topic:prices', label: 'Prices', icon: 'banknote', title: 'Prices today', paths: ['gold-price-calculator', 'stock-market-today', 'petrol-diesel-price', 'vegetable-prices-today', 'mobile-recharge-plans', 'ott-subscription-prices', 'currency-converter'] },
  { key: 'topic:near', label: 'Near me', icon: 'map-pin', title: 'Near me & travel', paths: ['cinemas-near-me', 'police-station-near-me', 'petrol-bunk-near-me', 'hyderabad-metro-fare', 'travel-planner'] },
  { key: 'topic:calendar', label: 'Calendar', icon: 'sun', title: 'Calendar & weather', paths: ['telugu-panchangam', 'holiday-calendar', 'weather'] },
];
/** Rotating search hints — each one finds a tool when typed. */
const HINTS = [
  { icon: 'scale', text: 'gold rate' },
  { icon: 'scan-face', text: 'SSC photo' },
  { icon: 'calculator', text: 'EMI' },
  { icon: 'map-pin', text: 'train route' },
  { icon: 'thermometer', text: 'weather' },
  { icon: 'clapperboard', text: 'cinemas near me' },
  { icon: 'sun', text: 'today’s tithi' },
  { icon: 'calendar-days', text: 'holidays 2026' },
  { icon: 'traffic-cone', text: 'helmet fine' },
  { icon: 'shield-check', text: 'police station near me' },
  { icon: 'gauge', text: 'petrol bunk near me' },
  { icon: 'file-stack', text: 'merge PDF' },
  { icon: 'receipt', text: 'income tax' },
  { icon: 'ruler', text: 'acre to gunta' },
  { icon: 'qr-code', text: 'UPI QR' },
  { icon: 'heart-pulse', text: 'BMI' },
  { icon: 'footprints', text: 'step counter' },
  { icon: 'banknote', text: 'dollar to rupee' },
  { icon: 'smartphone', text: 'Jio recharge' },
  { icon: 'tv', text: 'Netflix price' },
  { icon: 'cpu', text: 'RAM full form' },
  { icon: 'cake', text: 'age calculator' },
  { icon: 'graduation-cap', text: 'CGPA to %' },
  { icon: 'users', text: 'split bill' },
  { icon: 'percent', text: 'marks percentage' },
  { icon: 'languages', text: 'Telugu typing' },
  { icon: 'image-up', text: '20 KB photo' },
];
/** Everyday words people type, per tool path. */
const KEYWORDS: Record<string, string> = {
  'age-calculator': 'age calculator date of birth dob birthday years old exam cut-off',
  'cgpa-to-percentage-calculator': 'cgpa sgpa gpa percentage convert marks jntu jntuh cbse aicte vtu btech degree',
  'split-bill-calculator': 'split bill expense trip party friends share who pays owe rent hisaab',
  'days-calculator': 'days counter calculator between dates countdown left exam emi date difference working days',
  'percentage-calculator': 'percentage percent marks discount increase decrease hike salary',
  'gold-price-calculator': 'gold rate today silver price jewellery 22k 24k',
  weather: 'weather temperature rain forecast climate',
  'holiday-calendar': 'holiday holidays calendar festival leave list government public 2026 2027 diwali dasara sankranti',
  'traffic-challan-fines': 'traffic challan fine penalty helmet drunk signal rules licence police',
  'telugu-panchangam': 'panchangam panchang telugu calendar tithi nakshatram rahu kalam rahukalam yamagandam muhurtham today amavasya pournami ekadashi',
  'currency-converter': 'currency converter dollar usd dirham aed riyal sar pound euro exchange rate rupee inr forex',
  'computer-abbreviations': 'computer full form abbreviation cpu ram rom url otp imei it terms meaning',
  'mobile-recharge-plans': 'mobile recharge plan jio airtel vi bsnl prepaid data 5g',
  'stock-market-today': 'stock market share nifty sensex bank nifty nse bse ipo us stocks nasdaq dow s&p bull bear trading investment',
  'ott-subscription-prices': 'ott netflix prime video amazon hotstar jiohotstar aha zee5 sonyliv etv sun nxt subscription price',
  'step-counter': 'step steps counter pedometer walking walk calories burn km distance fitness',
  'police-station-near-me': 'police station near me nearest emergency 100 112 complaint',
  'petrol-bunk-near-me': 'petrol bunk pump fuel station near me nearest diesel cng indian oil hp bharat',
  'cinemas-near-me': 'cinema movie theatre theater film show ticket pvr inox near me',
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
/** Default "Popular" tab: the few tools most people open first (keeps the first screen simple). */
const POPULAR = ['resize-image-to-kb', 'gold-price-calculator', 'petrol-diesel-price', 'weather', 'emi-calculator', 'merge-pdf', 'telugu-panchangam', 'holiday-calendar'];

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, Icon, AdSlot, LiveBadge, Sky, MarketArt, Benefits, FestivalCard, PinButton],
  template: `
    <app-festival-card />
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-lg font-bold sm:text-2xl">Free online tools for India</h1>
        <p class="text-sm text-muted">Exam photo resizer, image to KB, EMI, SIP, income tax & more — fast, free, private.</p>
        <div class="mt-2"><app-benefits /></div>
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

    <!-- Tabs: Popular (default, short) · All · one type at a time -->
    <div id="tool-tabs" class="-mx-3 mt-3 flex scroll-mt-16 gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Show tools by type">
      <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="tab() === 'popular'" (click)="tab.set('popular')"><svg lucideIcon="sparkles" [size]="14" /> Popular</button>
      <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="tab() === 'all'" (click)="tab.set('all')">All</button>
      @for (c of chips; track c.key) {
        <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="tab() === c.key" (click)="tab.set(c.key)"><svg [lucideIcon]="c.icon" [size]="14" /> {{ c.label }}</button>
      }
    </div>

    @if (!searching() && tab() === 'popular' && (pins().length || recents().length)) {
      <section class="mt-3 space-y-2" aria-label="Your tools">
        @if (pins().length) {
          <div class="flex items-center gap-2">
            <span class="shrink-0 text-xs font-bold text-muted">📌 Pinned</span>
            <div class="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              @for (t of pins(); track t.path) { <a class="chip min-h-8 shrink-0 border-brand/40 bg-brand/5 text-xs" [routerLink]="'/' + t.path"><svg [lucideIcon]="t.icon" [size]="14" class="text-brand" /> {{ t.name }}</a> }
            </div>
          </div>
        }
        @if (recents().length) {
          <div class="flex items-center gap-2">
            <span class="shrink-0 text-xs font-bold text-muted">🕘 Recent</span>
            <div class="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
              @for (t of recents(); track t.path) { <a class="chip min-h-8 shrink-0 text-xs" [routerLink]="'/' + t.path"><svg [lucideIcon]="t.icon" [size]="14" /> {{ t.name }}</a> }
            </div>
          </div>
        }
      </section>
    }

    @if (nothing()) {
      <div class="card mt-4 flex flex-col items-center gap-2 p-6 text-center animate-fade-up">
        <svg lucideIcon="search" [size]="28" class="text-muted" />
        <p class="font-semibold">No tools found for “{{ q().trim() }}”{{ picked().length ? ' in the chosen types' : '' }}</p>
        <p class="text-sm text-muted">Try a simpler word like “photo”, “EMI”, “PDF” or “gold”@if (picked().length) {, or <button type="button" class="text-brand underline" (click)="tab.set('all')">search all types</button>}.</p>
        <div class="mt-1 flex flex-wrap justify-center gap-2">
          <button type="button" class="btn-ghost min-h-9 text-sm" (click)="q.set('')">Clear search</button>
          <a routerLink="/contact" class="btn-ghost min-h-9 text-sm">Ask for this tool</a>
        </div>
      </div>
    }

    @if (popularMode()) {
      <section class="mt-4" aria-labelledby="h-popular">
        <h2 id="h-popular" class="mb-2 text-sm font-bold tracking-wide text-muted uppercase">Popular tools</h2>
        <div class="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 md:grid-cols-4">
          @for (t of popular; track t.path) {
            <div class="card group relative isolate flex items-center gap-3 overflow-hidden p-3 transition hover:border-brand/50" [class.sky-card]="t.path === 'weather' && !!skyIcon()">
              @if (t.path === 'weather' && skyIcon()) { <app-sky [icon]="skyIcon()" class="-z-10" /> }
              @if (t.path === 'stock-market-today') { @defer (on idle) { <app-market-art /> } }
              <a [routerLink]="'/' + t.path" class="absolute inset-0 rounded-2xl" [attr.aria-label]="t.name"></a>
              <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><svg [lucideIcon]="t.icon" [size]="18" /></span>
              <span class="min-w-0"><span class="block text-sm font-semibold group-hover:text-brand">{{ t.name }}</span><span class="block text-xs text-muted">{{ t.blurb }}</span></span>
              <span class="-my-1.5 -mr-1.5 ml-auto flex shrink-0 flex-col items-end gap-0.5 self-start">
                <app-pin-button [path]="t.path!" [name]="t.name" />
                @if (live(t.path); as k) { <app-live-badge [kind]="k" class="mr-1.5" /> }
              </span>
            </div>
          }
        </div>
      </section>

      <section class="mt-6" aria-labelledby="h-browse">
        <h2 id="h-browse" class="mb-2 text-sm font-bold tracking-wide text-muted uppercase">Browse by type</h2>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          @for (c of browse; track c.key) {
            <button type="button" class="card group flex items-center gap-3 p-3 text-left transition hover:border-brand/50" (click)="openTab(c.key)">
              <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><svg [lucideIcon]="c.icon" [size]="18" /></span>
              <span class="min-w-0"><span class="block text-sm font-semibold group-hover:text-brand">{{ c.label }}</span><span class="block text-xs text-muted">{{ c.count }} tools</span></span>
              <svg lucideIcon="chevron-right" [size]="16" class="ml-auto shrink-0 text-muted" />
            </button>
          }
        </div>
      </section>
    }

    @if (showExams()) {
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
    }

    @for (g of popularMode() ? [] : groups(); track g.title) {
      <section class="mt-6 scroll-mt-16" [attr.aria-label]="g.title" [id]="anchor(g.title)">
        <div class="mb-2 flex items-baseline justify-between gap-2">
          <h2 class="text-sm font-bold tracking-wide text-muted uppercase">{{ g.title }}</h2>
          @if (hub(g.title); as hp) { <a [routerLink]="'/' + hp" class="shrink-0 text-xs font-semibold text-brand hover:underline">{{ g.total > g.tools.length ? 'See all ' + g.total + ' →' : 'Guide →' }}</a> }
        </div>
        <div class="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 md:grid-cols-4">
          @for (t of g.tools; track t.name) {
            @if (t.path) {
              <div class="card group relative flex items-center gap-3 p-3 transition hover:border-brand/50 isolate overflow-hidden" [class.sky-card]="t.path === 'weather' && !!skyIcon()">
                @if (t.path === 'weather' && skyIcon()) { <app-sky [icon]="skyIcon()" class="-z-10" /> }
              @if (t.path === 'stock-market-today') { @defer (on idle) { <app-market-art /> } }
                <a [routerLink]="'/' + t.path" class="absolute inset-0 rounded-2xl" [attr.aria-label]="t.name"></a>
                <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><svg [lucideIcon]="t.icon" [size]="18" /></span>
                <span class="min-w-0"><span class="block text-sm font-semibold group-hover:text-brand">{{ t.name }}</span><span class="block text-xs text-muted">{{ t.blurb }}</span>
                @if (src(t.path); as ss) {
                  <span class="relative z-10 mt-0.5 block text-[10px] text-muted">Data: @for (s of ss; track s.url; let last = $last) {<a [href]="s.url" target="_blank" rel="noopener" class="underline decoration-dotted hover:text-brand">{{ s.name }}</a>@if (!last) {, }}</span>
                }</span>
                <span class="-my-1.5 -mr-1.5 ml-auto flex shrink-0 flex-col items-end gap-0.5 self-start">
                  <app-pin-button [path]="t.path" [name]="t.name" />
                  @if (live(t.path); as k) { <app-live-badge [kind]="k" class="mr-1.5" /> }
                </span>
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
      <h2>Why Spread Apps Tools?</h2>
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
  private readonly userTools = inject(UserTools);
  /** Pinned tools, then recently opened ones (not already pinned) — this browser only */
  protected readonly pins = computed(() => this.userTools.pinned().map((p) => this.userTools.ref(p)).filter((t) => !!t));
  protected readonly recents = computed(() => this.userTools.recent().filter((p) => !this.userTools.pinned().includes(p)).slice(0, 6).map((p) => this.userTools.ref(p)).filter((t) => !!t));
  protected readonly chips = [...TOPICS.map(({ key, label, icon }) => ({ key, label, icon })), ...CHIPS];
  /** Sky behind the weather card once its badge has loaded */
  protected readonly skyIcon = WEATHER_ICON;
  /** Open tab: 'popular' (default, short list), 'all' (quick menu of every group) or one chip key. */
  protected readonly tab = signal<string>('popular');
  /** Groups the visitor picked; empty = everything (the normal quick menu). */
  protected readonly picked = computed(() => (this.tab() === 'popular' || this.tab() === 'all' ? [] : [this.tab()]));
  protected readonly popularMode = computed(() => this.tab() === 'popular' && !this.searching());
  protected readonly popular = POPULAR.map((p) => TOOL_GROUPS.flatMap((g) => g.tools).find((t) => t.path === p)).filter((t) => !!t);
  /** "Browse by type" tiles: topics first, then every group, with tool counts. */
  protected readonly browse = this.chips.map((c) => ({
    ...c,
    count: c.key === EXAM_KEY ? EXAMS.length : (TOPICS.find((t) => t.key === c.key)?.paths.length ?? TOOL_GROUPS.find((g) => g.title === c.key)?.tools.length ?? 0),
  }));
  protected readonly exams = computed(() => {
    const q = this.q().trim().toLowerCase();
    if (!q) return this.picked().length ? EXAMS : EXAMS.slice(0, HOME_EXAMS);
    return EXAMS.filter((e) => matches(q, `${e.name} ${e.full} photo signature thumb declaration resize size kb exam`));
  });
  /** While searching, a group with no match is hidden instead of showing an empty heading. */
  protected readonly showExams = computed(() => !this.popularMode() && (!this.picked().length || this.picked().includes(EXAM_KEY)) && (!this.searching() || this.exams().length > 0));
  protected readonly groups = computed(() => {
    const q = this.q().trim().toLowerCase();
    const p = this.picked();
    const all = TOOL_GROUPS.flatMap((g) => g.tools);
    const topics = TOPICS.filter((t) => p.includes(t.key)).map((t) => ({ title: t.title, tools: t.paths.map((path) => all.find((x) => x.path === path)).filter((x) => !!x) }));
    const inPick = [...topics, ...TOOL_GROUPS.filter((g) => !p.length || p.includes(g.title))];
    // A picked group shows all its tools; the default menu shows the top few per group
    if (!q) return inPick.map((g) => ({ ...g, total: g.tools.length, tools: p.length ? g.tools : g.tools.slice(0, HOME_PER_GROUP) }));
    return inPick.map((g) => ({ ...g, total: g.tools.length, tools: g.tools.filter((t) => matches(q, `${t.name} ${t.blurb} ${t.path ?? ''} ${KEYWORDS[t.path ?? ''] ?? ''}`)) })).filter((g) => g.tools.length);
  });
  protected readonly nothing = computed(() => this.searching() && !this.showExams() && !this.groups().length);

  /** Tile click: open that type and bring the tabs to the top so the list starts on screen. */
  protected openTab(key: string) {
    this.tab.set(key);
    document.getElementById('tool-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      this.userTools.load();
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
  protected live(path: string | null): 'gold' | 'weather' | 'fuel' | 'holiday' | null {
    return path === 'gold-price-calculator' ? 'gold' : path === 'weather' ? 'weather' : path === 'petrol-diesel-price' ? 'fuel' : path === 'holiday-calendar' ? 'holiday' : null;
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
