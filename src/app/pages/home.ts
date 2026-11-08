import { isPlatformBrowser } from '@angular/common';
import { afterNextRender, Component, computed, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';
import { DOC_SHORT, DocKind, EXAMS, Exam, examPath } from '../core/exams';
import { CounterService } from '../core/counter.service';
import { SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { HUB_PATHS } from '../core/hub-paths';
import { TOOL_GROUPS, groupAnchor } from '../core/tools';
import { TOOL_LINKS } from '../core/tool-links';
import { CALC_LINKS } from '../core/calc-links';
import { AdSlot } from '../shared/ad-slot';
import { LiveBadge, WEATHER_ICON } from '../shared/live-badge';
import { Sky } from '../shared/sky';
import { MarketArt } from '../shared/market-art';
import { FestivalCard } from '../shared/festival-card';
import { PinButton } from '../shared/pin-button';
import { ExamPicker } from '../shared/exam-picker';
import { ToolTicker } from '../shared/tool-ticker';
import { WhatsNew } from '../shared/whats-new';
import { TodayCard } from '../shared/today-card';
import { LATEST_ADDED, NEW_TOOLS, freshPaths } from '../core/new-tools';
import { UserTools } from '../core/user-tools';
import { SOURCES } from '../core/sources';
import { StoriesService } from '../core/stories.service';

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
  { key: 'Games', label: 'Games', icon: 'crown' },
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
  'govt-job-notifications': 'job jobs notification notifications recruitment vacancy govt government tgpsc tspsc appsc upsc ssc ibps rrb railway police exam hall ticket result key',
  'festival-wishes-card': 'diwali deepavali wishes greeting card image happy sankranti pongal ugadi christmas new year ramzan eid dasara dussehra birthday shubhakankshalu telugu whatsapp status photo name',
  'rent-receipt-generator': 'rent receipt hra house rent landlord owner tenant pdf print format',
  'ifsc-code-finder': 'ifsc code bank branch micr neft rtgs imps sbi hdfc icici address finder',
  'pf-balance-check': 'pf epf provident fund balance check uan passbook missed call sms epfo umang pension eps',
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
/** Words people add that don't help find a tool ("how to check pf online" → "pf"). */
const FILLER = new Set(['to', 'how', 'the', 'a', 'an', 'for', 'of', 'in', 'my', 'me', 'online', 'free', 'tool', 'tools', 'app', 'check', 'find', 'get', 'make', 'maker', 'calculate', 'calculator', 'today', 'ela', 'enti', 'cheyali', 'please']);
const words = (q: string) => {
  const all = q.toLowerCase().split(/[^a-z0-9\u0C00-\u0C7F]+/).filter(Boolean);
  const kept = all.filter((w) => !FILLER.has(w));
  return kept.length ? kept : all;
};
/** Every typed word must appear (so "acre to gunta" and "gold rate" work); plurals like "wishes"/"cards" also match their singular. */
function matches(q: string, hay: string): boolean {
  const h = hay.toLowerCase();
  return words(q).every((w) => h.includes(w) || (w.length > 3 && w.endsWith('s') && h.includes(w.slice(0, -1))));
}
/** Looser fallback when nothing matches all words: any meaningful word (4+ letters) is enough. */
function matchesAny(q: string, hay: string): boolean {
  const h = hay.toLowerCase();
  return words(q).some((w) => w.length >= 4 && h.includes(w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w));
}

const HOME_EXAMS = 5;
const ALL_TOOLS = TOOL_GROUPS.flatMap((g) => g.tools).filter((t) => !!t.path);
/** Default "Popular" tab: the few tools most people open first (keeps the first screen simple). */
const POPULAR = ['resize-image-to-kb', 'gold-price-calculator', 'petrol-diesel-price', 'weather', 'emi-calculator', 'merge-pdf', 'telugu-panchangam', 'holiday-calendar'];

@Component({
  selector: 'app-home',
  styles: `
    .pl-row { display: flex; gap: 10px; margin: 0 -12px; padding: 0 12px 4px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 12px; scrollbar-width: none; }
    .pl-row::-webkit-scrollbar, .pop-row::-webkit-scrollbar { display: none; }
    .pl-card { position: relative; isolation: isolate; flex: 0 0 78%; height: 10rem; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; gap: 1px;
      overflow: hidden; border: 0; border-radius: 1rem; padding: 1rem; color: #fff; text-align: left; scroll-snap-align: start; cursor: pointer;
      box-shadow: 0 12px 26px -14px rgb(15 23 42 / 0.6); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s; }
    .pl-card::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(0deg, rgb(0 0 0 / 0.55), transparent 70%); }
    .pl-card:hover { transform: translateY(-2px); box-shadow: 0 18px 32px -14px rgb(15 23 42 / 0.7); }
    .pl-card:active { transform: scale(0.98); }
    .pl-card small { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #fcd34d; }
    .pl-card b { font-size: 1.125rem; line-height: 1.25; }
    .pl-card span:not(.pl-art) { font-size: 0.75rem; color: rgb(255 255 255 / 0.78); }
    .pl-card em { margin-top: 8px; font-style: normal; font-size: 0.75rem; font-weight: 700; color: #0f172a; background: #fff; border-radius: 6px; padding: 4px 12px; }
    .pl-art { position: absolute; z-index: -1; line-height: 1; opacity: 0.25; transition: transform 0.5s; }
    .pl-card:hover .pl-art { transform: scale(1.1) rotate(-5deg); }
    .pl-knight { top: -12px; right: 8px; font-size: 8.5rem; color: #fff; opacity: 0.16; }
    .pl-peacock { top: -4px; right: 12px; font-size: 6.5rem; opacity: 0.3; }
    .pl-grid { top: 12px; right: 12px; display: grid; grid-template-columns: repeat(3, 1.75rem); gap: 4px; opacity: 0.32; }
    .pl-grid i { display: grid; place-items: center; height: 1.75rem; border: 1px solid rgb(255 255 255 / 0.5); border-radius: 6px; font-style: normal; font-weight: 700; font-size: 0.85rem; }
    .pop-row { display: grid; grid-auto-flow: column; grid-template-rows: repeat(2, auto); grid-auto-columns: 82%; gap: 8px; margin: 0 -12px; padding: 0 12px 4px;
      overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 12px; scrollbar-width: none; }
    .pop-row > * { scroll-snap-align: start; }
    @media (min-width: 400px) { .pop-row { grid-auto-columns: 62%; } }
    @media (min-width: 768px) {
      .pl-row { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0; padding: 0; overflow: visible; }
      .pl-card { flex: none; }
      .pop-row { grid-auto-flow: row; grid-template-columns: repeat(4, 1fr); grid-template-rows: none; grid-auto-columns: auto; margin: 0; padding: 0; overflow: visible; }
    }
    @media (prefers-reduced-motion: reduce) { .pl-card, .pl-art { transition: none; } }
  `,
  imports: [RouterLink, FormsModule, Icon, AdSlot, LiveBadge, Sky, MarketArt, FestivalCard, PinButton, ExamPicker, ToolTicker, WhatsNew, TodayCard],
  template: `
    <app-festival-card />
    @if (sheetOpen()) {
      @defer { <app-whats-new [tools]="freshTools" (closed)="sheetOpen.set(false)" /> }
    }
    <div class="mx-auto mt-1 max-w-2xl text-center">
      <h1 class="text-xl font-bold sm:text-3xl">Free online tools for India</h1>
      <p class="mt-1 text-xs text-muted sm:text-sm">Free · Private · No signup · Works offline</p>
      @if (freshTools.length) {
        <button type="button" class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition hover:-translate-y-0.5 hover:bg-brand/15 active:scale-95"
                (click)="openNew()" aria-haspopup="dialog">
          @if (!seen()) { <span class="relative flex size-2" aria-hidden="true"><span class="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60"></span><span class="relative inline-flex size-2 rounded-full bg-brand"></span></span> }
          ✨ {{ freshTools.length }} new tools <svg lucideIcon="chevron-right" [size]="14" />
        </button>
      }
      <label class="relative mt-3 block">
        <span class="sr-only">Search tools</span>
        <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input class="input min-h-12 rounded-2xl pl-9 text-base shadow-sm" type="search" aria-label="Search tools" [ngModel]="q()" (ngModelChange)="q.set($event)" (keydown.enter)="openFirst()" enterkeyhint="go" (focus)="focused.set(true)" (blur)="focused.set(false)" />
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

    @if (popularMode()) {
      @defer (on idle) { <app-tool-ticker [items]="tickerItems" /> } @placeholder { <div class="mt-3 h-11" aria-hidden="true"></div> }
    }

    <!-- Tabs appear once a type or All is open; the default Popular home stays minimal -->
    <span id="tool-tabs" class="block scroll-mt-16"></span>
    @if (tab() !== 'popular') {
    <div class="-mx-3 mt-4 flex gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none]" role="group" aria-label="Show tools by type">
      <button type="button" class="chip min-h-8 shrink-0 text-xs" (click)="tab.set('popular')">← Home</button>
      <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="tab() === 'all'" (click)="tab.set('all')">All</button>
      @for (c of chips; track c.key) {
        <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="tab() === c.key" (click)="tab.set(c.key)"><svg [lucideIcon]="c.icon" [size]="14" /> {{ c.label }}</button>
      }
    </div>
    }

    @if (!searching() && tab() === 'popular' && (pins().length || recents().length)) {
      <section class="mt-5 flex items-center gap-2" aria-label="Your tools">
        <span class="shrink-0 text-xs font-bold text-muted">Your tools</span>
        <div class="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          @for (t of pins(); track t.path) { <a class="chip min-h-8 shrink-0 border-brand/40 bg-brand/5 text-xs" [routerLink]="'/' + t.path"><span aria-hidden="true">📌</span> {{ t.name }}</a> }
          @for (t of recents(); track t.path) { <a class="chip min-h-8 shrink-0 text-xs" [routerLink]="'/' + t.path"><svg [lucideIcon]="t.icon" [size]="14" /> {{ t.name }}</a> }
        </div>
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
      @defer (on idle) { <app-today-card /> } @placeholder { <div class="mt-5 h-[7.5rem] sm:h-24" aria-hidden="true"></div> }

      <!-- Play & learn: big cinema-style cards so visitors see the games and stories at once -->
      <section class="mt-5" aria-labelledby="h-play">
        <div class="mb-2 flex items-baseline justify-between gap-2">
          <h2 id="h-play" class="text-xs font-bold tracking-wide text-muted uppercase">🎮 Play & learn</h2>
          <a routerLink="/games" class="shrink-0 text-xs font-semibold text-brand hover:underline">All games →</a>
        </div>
        <div class="pl-row">
          <a routerLink="/games/chess" class="pl-card"
             style="background: radial-gradient(circle at 78% 18%, #4f5bd5, #141a4a 58%, #0b0f2e)">
            <span class="pl-art pl-knight" aria-hidden="true">♞</span>
            <small>Game · NEW</small><b>Chess vs computer</b><span>Easy to Hard · coach in 7 languages</span><em>▶ Play</em>
          </a>
          <a routerLink="/games/sudoku" class="pl-card"
             style="background: radial-gradient(circle at 80% 15%, #14b8a6, #0b4f4a 55%, #052926)">
            <span class="pl-art pl-grid" aria-hidden="true">@for (d of sudokuArt; track $index) { <i>{{ d }}</i> }</span>
            <small>Game · Daily puzzle</small><b>Sudoku</b><span>A new puzzle every day · notes & hints</span><em>▶ Play today’s</em>
          </a>
          <button type="button" (click)="stories.show()" class="pl-card"
             style="background: radial-gradient(circle at 80% 20%, #f6a623, #7a1f3d 55%, #1a0b1f)">
            <span class="pl-art pl-peacock" aria-hidden="true">🦚</span>
            <small>Spread Stories</small><b>Gita, Ramayanam & more</b><span>One short lesson per story · తెలుగు & English</span><em>▶ Watch</em>
          </button>
        </div>
      </section>

      <section class="mt-5" aria-labelledby="h-popular">
        <h2 id="h-popular" class="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Popular</h2>
        <!-- Phones: two rows that swipe sideways (like streaming apps); larger screens: a grid -->
        <div class="pop-row">
          @for (t of popular(); track t.path) {
            <div class="card group relative isolate flex items-center gap-3 overflow-hidden p-3 transition hover:border-brand/50" [class.sky-card]="t.path === 'weather' && !!skyIcon()">
              @if (t.path === 'weather' && skyIcon()) { <app-sky [icon]="skyIcon()" class="-z-10" /> }
              @if (t.path === 'stock-market-today') { @defer (on idle) { <app-market-art /> } }
              <a [routerLink]="'/' + t.path" class="absolute inset-0 rounded-2xl" [attr.aria-label]="t.name"></a>
              <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><svg [lucideIcon]="t.icon" [size]="18" /></span>
              <span class="min-w-0"><span class="block text-sm font-semibold group-hover:text-brand">{{ t.name }}@if (fresh.has(t.path!)) { <span class="ml-1 inline-block rounded-full bg-brand px-1.5 align-middle text-[9px] leading-4 font-bold text-white">NEW</span> }</span><span class="hidden text-xs text-muted sm:block">{{ t.blurb }}</span></span>
              <span class="-my-1.5 -mr-1.5 ml-auto flex shrink-0 flex-col items-end gap-0.5 self-start">
                <app-pin-button [path]="t.path!" [name]="t.name" />
                @if (live(t.path); as k) { <app-live-badge [kind]="k" class="mr-1.5" /> }
              </span>
            </div>
          }
        </div>
      </section>

      <section class="mt-6" aria-labelledby="h-browse">
        <h2 id="h-browse" class="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Browse by type</h2>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          @for (c of browse; track c.key) {
            <button type="button" class="card group flex flex-col items-center gap-1 px-1 py-3 text-center transition hover:border-brand/50" (click)="openTab(c.key)">
              <svg [lucideIcon]="c.icon" [size]="20" class="text-brand" />
              <span class="text-xs font-semibold leading-tight group-hover:text-brand">{{ c.label }}</span>
              <span class="text-[10px] text-muted">{{ c.count }}</span>
            </button>
          }
          <button type="button" class="card group flex flex-col items-center gap-1 px-1 py-3 text-center transition hover:border-brand/50" (click)="openTab('all')">
            <svg lucideIcon="layout-grid" [size]="20" class="text-brand" />
            <span class="text-xs font-semibold leading-tight group-hover:text-brand">All tools</span>
            <span class="text-[10px] text-muted">{{ toolTotal }}</span>
          </button>
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
      <app-exam-picker [preset]="examPick()" />
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
                <span class="min-w-0"><span class="block text-sm font-semibold group-hover:text-brand">{{ t.name }}@if (fresh.has(t.path!)) { <span class="ml-1 inline-block rounded-full bg-brand px-1.5 align-middle text-[9px] leading-4 font-bold text-white">NEW</span> }</span><span class="block text-xs text-muted">{{ t.blurb }}</span>
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
  /** Recently added tools: NEW badges, the What's-new sheet and the front of the ticker. */
  protected readonly fresh = new Set(freshPaths());
  protected readonly freshTools = NEW_TOOLS.filter((n) => this.fresh.has(n.path)).map((n) => ALL_TOOLS.find((t) => t.path === n.path)).filter((t) => !!t).map((t) => ({ path: t.path!, name: t.name, icon: t.icon, blurb: t.blurb }));
  protected readonly tickerItems = [...new Set([...this.freshTools.map((t) => t.path), ...POPULAR, ...ALL_TOOLS.map((t) => t.path!)])]
    .slice(0, 18)
    .map((p) => ALL_TOOLS.find((t) => t.path === p))
    .filter((t) => !!t)
    .map((t) => ({ path: t.path!, name: t.name, icon: t.icon, fresh: this.fresh.has(t.path!) }));
  /** Pill pulses until this visitor has opened the latest What's new (checked after hydration). */
  protected readonly seen = signal(true);
  protected readonly sheetOpen = signal(false);
  /** Counter ids (e.g. "ssc-photo", "emi", "resize-kb") → tool paths. */
  private idToPath(id: string): string | null {
    const link = TOOL_LINKS.find((t) => t.id === id) ?? CALC_LINKS.find((t) => t.id === id);
    if (link) return link.path;
    if (id === 'resize-kb') return 'resize-image-to-kb';
    const kb = id.match(/^resize-(\d+)kb$/);
    if (kb) return `resize-image-to-${kb[1]}kb`;
    for (const e of EXAMS) for (const d of e.docs) if (id === `${e.slug}-${d.kind}`) return examPath(e, d.kind);
    return null;
  }

  private async loadPopular() {
    try {
      const r = await fetch('/api/count?popular=1');
      if (!r.ok) return;
      const { top } = (await r.json()) as { top?: [string, number][] };
      const picked = (top ?? [])
        .filter(([, n]) => n >= 3) // ignore one-off visits
        .map(([id]) => this.idToPath(id))
        .map((p) => (p ? ALL_TOOLS.find((t) => t.path === p) : undefined))
        .filter((t) => !!t);
      if (picked.length < 3) return; // not enough real data yet — keep the hand-picked list
      const list = [...new Map([...picked, ...this.popular()].map((t) => [t.path, t])).values()].slice(0, POPULAR.length);
      this.popular.set(list);
    } catch {
      /* keep the hand-picked list */
    }
  }

  protected openNew() {
    this.sheetOpen.set(true);
    this.seen.set(true);
    try {
      localStorage.setItem('whatsnew-seen', LATEST_ADDED);
    } catch {
      /* not remembered */
    }
  }
  protected readonly toolTotal = TOOL_GROUPS.reduce((n, g) => n + g.tools.length, 0) + EXAMS.length;
  private readonly userTools = inject(UserTools);
  protected readonly stories = inject(StoriesService);
  /** Little number grid drawn on the Sudoku card. */
  protected readonly sudokuArt = ['5', '', '3', '', '7', '', '9', '', '1'];
  private readonly router = inject(Router);
  /** Enter in the search box opens the best match straight away (one step less). */
  protected openFirst() {
    if (!this.searching()) return;
    const tool = this.groups()[0]?.tools.find((t) => !!t.path);
    const exam = this.showExams() ? this.examPick() : null;
    const path = exam ? examPath(exam, 'photo') : tool?.path;
    if (path) this.router.navigateByUrl('/' + path);
  }
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
  /** Hand-picked at first; after load, the most-viewed tools of the last 14 days (topped up from the hand-picked list). */
  protected readonly popular = signal(POPULAR.map((p) => ALL_TOOLS.find((t) => t.path === p)).filter((t) => !!t));
  /** "Browse by type" tiles: topics first, then every group, with tool counts. */
  protected readonly browse = this.chips.map((c) => ({
    ...c,
    count: c.key === EXAM_KEY ? EXAMS.length : (TOPICS.find((t) => t.key === c.key)?.paths.length ?? TOOL_GROUPS.find((g) => g.title === c.key)?.tools.length ?? 0),
  }));
  /** Exam to pre-select in the picker while searching: exact name ("rrb") first, then the first match. */
  protected readonly examPick = computed(() => {
    if (!this.searching()) return null;
    const q = this.q().trim().toLowerCase();
    return this.exams().find((e) => e.slug === q || e.name.toLowerCase() === q) ?? this.exams()[0] ?? null;
  });
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
    const hay = (t: { name: string; blurb: string; path: string | null }) => `${t.name} ${t.blurb} ${t.path ?? ''} ${KEYWORDS[t.path ?? ''] ?? ''}`;
    const strict = inPick.map((g) => ({ ...g, total: g.tools.length, tools: g.tools.filter((t) => matches(q, hay(t))) })).filter((g) => g.tools.length);
    if (strict.length) return strict;
    // Nothing matched every word ("diwali greeting photo") — show tools matching any meaningful word instead
    return inPick.map((g) => ({ ...g, total: g.tools.length, tools: g.tools.filter((t) => matchesAny(q, hay(t))) })).filter((g) => g.tools.length);
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
      this.loadPopular();
      try {
        this.seen.set(localStorage.getItem('whatsnew-seen') === LATEST_ADDED);
      } catch {
        /* storage blocked — keep the quiet pill */
      }
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
