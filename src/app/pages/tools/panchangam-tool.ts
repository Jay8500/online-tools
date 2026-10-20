import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { localIso } from '../../core/dates';
import { CITIES } from '../../core/places';
import type { Panchangam, Span } from '../../core/panchangam';
import { Icon } from '../../shared/icon';

const LAST = 'panchangam-city';
/** Telugu-speaking states first, then the big metros Telugu families live in. */
const PLACES = [
  ...CITIES.filter((c) => c.state === 'Telangana' || c.state === 'Andhra Pradesh'),
  ...CITIES.filter((c) => ['Bengaluru', 'Chennai', 'Mumbai', 'Pune', 'Delhi'].includes(c.name)),
];

@Component({
  selector: 'app-panchangam-tool',
  imports: [Icon],
  template: `
    <div class="flex flex-wrap items-center gap-2">
      <select class="input w-auto min-w-36 flex-1 sm:flex-none" aria-label="City" (change)="pickCity(val($event))">
        @for (c of places; track c.name) { <option [value]="c.name" [selected]="c.name === city()">{{ c.name }}</option> }
      </select>
      <div class="flex items-center gap-1">
        <button type="button" class="btn-icon" (click)="shift(-1)" aria-label="Previous day"><svg lucideIcon="chevron-down" [size]="16" class="rotate-90" /></button>
        <input type="date" class="input w-auto" aria-label="Date" [value]="date()" (change)="setDate(val($event))" />
        <button type="button" class="btn-icon" (click)="shift(1)" aria-label="Next day"><svg lucideIcon="chevron-down" [size]="16" class="-rotate-90" /></button>
      </div>
      @if (!isToday()) { <button type="button" class="chip min-h-9 text-xs" (click)="setDate(today())">Today</button> }
      @if (p()) { <a class="btn-ghost min-h-9 text-sm sm:ml-auto" [href]="shareUrl()" target="_blank" rel="noopener"><svg lucideIcon="share-2" [size]="16" /> WhatsApp</a> }
    </div>

    @if (p(); as d) {
      <!-- Hero -->
      <section class="hero animate-fade-up relative mt-3 overflow-hidden rounded-2xl p-4 text-white sm:p-5">
        <span class="animate-float absolute top-3 right-4 text-4xl opacity-90" aria-hidden="true">🪔</span>
        <p class="text-xs font-semibold opacity-90">శ్రీ {{ d.samvatsara.te }} నామ సంవత్సరం · {{ d.masa.te }} మాసం@if (d.masa.adhika) { (అధిక) }</p>
        <h2 class="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{{ d.paksha.te.split(' ')[0] }} {{ d.tithi.te }}</h2>
        <p class="mt-1 text-sm opacity-95">{{ d.vaara }} · {{ dateText() }}</p>
        <p class="text-xs opacity-80">{{ d.paksha.en }} {{ d.tithi.en }} till {{ time(d.tithi.end) }} → {{ d.tithi.next.en }} · {{ d.samvatsara.en }} year, {{ d.masa.en }} month</p>
        @if (festival(); as f) { <p class="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">🎉 {{ f }}</p> }
      </section>

      <!-- Five limbs -->
      <div class="mt-3 grid grid-cols-2 gap-2">
        @for (c of limbs(); track c.k) {
          <div class="animate-fade-up rounded-xl border border-line bg-surface p-3" [style.animation-delay.ms]="$index * 50">
            <p class="text-[11px] font-semibold text-muted">{{ c.k }}</p>
            <p class="text-lg font-bold leading-tight">{{ c.te }}</p>
            <p class="text-[11px] text-muted">{{ c.en }} · till {{ time(c.end) }}</p>
          </div>
        }
      </div>

      <!-- Sun & moon -->
      <div class="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
        <div class="rounded-xl bg-amber-500/10 p-2"><span class="text-lg" aria-hidden="true">🌅</span><p class="font-bold">{{ time(d.sunrise) }}</p><p class="text-muted">Sunrise</p></div>
        <div class="rounded-xl bg-orange-500/10 p-2"><span class="text-lg" aria-hidden="true">🌇</span><p class="font-bold">{{ time(d.sunset) }}</p><p class="text-muted">Sunset</p></div>
        <div class="rounded-xl bg-indigo-500/10 p-2"><span class="text-lg" aria-hidden="true">🌙</span><p class="font-bold">{{ d.moonrise ? time(d.moonrise) : '—' }}</p><p class="text-muted">Moonrise</p></div>
      </div>

      <!-- Times to avoid / good time -->
      <div class="mt-2 grid grid-cols-2 gap-2">
        @for (t of times(); track t.k) {
          <div class="relative rounded-xl border p-3" [class]="t.good ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/30 bg-red-500/5'">
            @if (t.now) {
              <span class="absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" [class]="t.good ? 'bg-green-600 text-white' : 'bg-red-600 text-white'">
                <span class="relative flex size-1.5"><span class="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75"></span><span class="relative inline-flex size-1.5 rounded-full bg-white"></span></span>NOW
              </span>
            }
            <p class="text-[11px] font-semibold" [class.pr-14]="t.now" [class]="t.good ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'">{{ t.k }}</p>
            <p class="font-bold tabular-nums">{{ time(t.s.start) }} – {{ time(t.s.end) }}</p>
          </div>
        }
      </div>
      <p class="mt-3 text-[11px] text-muted">Calculated for {{ city() }} (Lahiri, amanta). Timings may differ by a few minutes from printed calendars — for muhurtham, ask your purohit.</p>
    } @else {
      <div class="mt-3 h-64 animate-pulse rounded-2xl bg-surface-2"></div>
      <div class="mt-2 h-40 animate-pulse rounded-2xl bg-surface-2"></div>
    }
  `,
  styles: `
    .hero { background: linear-gradient(135deg, #b4370b 0%, #d9480f 45%, #f59f00 100%); box-shadow: 0 14px 30px -18px rgb(180 55 11 / 0.7); }
  `,
})
export class PanchangamTool {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly places = PLACES;
  protected readonly today = signal(localIso());
  protected readonly date = signal(localIso());
  protected readonly city = signal('Hyderabad');
  protected readonly p = signal<Panchangam | null>(null);
  protected readonly festival = signal<string | null>(null);
  private readonly now = signal(Date.now());
  private calc?: typeof import('../../core/panchangam').panchangam;

  protected readonly isToday = computed(() => this.date() === this.today());
  protected readonly dateText = computed(() => new Date(this.date() + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
  protected readonly limbs = computed(() => {
    const d = this.p();
    if (!d) return [];
    return [
      { k: 'తిథి · Tithi', te: d.tithi.te, en: d.tithi.en, end: d.tithi.end },
      { k: 'నక్షత్రం · Nakshatram', te: d.nakshatra.te, en: d.nakshatra.en, end: d.nakshatra.end },
      { k: 'యోగం · Yogam', te: d.yoga.te, en: d.yoga.en, end: d.yoga.end },
      { k: 'కరణం · Karanam', te: d.karana.te, en: d.karana.en, end: d.karana.end },
    ];
  });
  protected readonly times = computed(() => {
    const d = this.p();
    if (!d) return [];
    const n = this.now();
    const live = this.isToday();
    const row = (k: string, s: Span, good = false) => ({ k, s, good, now: live && n >= s.start.getTime() && n < s.end.getTime() });
    return [
      row('రాహుకాలం · Rahu kalam', d.rahu),
      row('యమగండం · Yamagandam', d.yama),
      row('గుళిక · Gulika', d.gulika),
      ...(d.abhijit ? [row('అభిజిత్ · Abhijit (good)', d.abhijit, true)] : []),
    ];
  });
  protected readonly shareUrl = computed(() => {
    const d = this.p();
    if (!d) return '';
    const text = [
      `🪔 తెలుగు పంచాంగం — ${this.dateText()} (${this.city()})`,
      `${d.vaara} · ${d.masa.te} మాసం`,
      `తిథి: ${d.paksha.te.split(' ')[0]} ${d.tithi.te} (${this.time(d.tithi.end)} వరకు)`,
      `నక్షత్రం: ${d.nakshatra.te} (${this.time(d.nakshatra.end)} వరకు)`,
      `రాహుకాలం: ${this.time(d.rahu.start)} – ${this.time(d.rahu.end)}`,
      `🌅 ${this.time(d.sunrise)}  🌇 ${this.time(d.sunset)}`,
      'https://tools.spreadapps.in/telugu-panchangam',
    ].join('\n');
    return 'https://wa.me/?text=' + encodeURIComponent(text);
  });

  constructor() {
    afterNextRender(async () => {
      try {
        const c = localStorage.getItem(LAST);
        if (c && PLACES.some((x) => x.name === c)) this.city.set(c);
      } catch {
        /* default */
      }
      this.today.set(localIso());
      this.date.set(localIso());
      this.calc = (await import('../../core/panchangam')).panchangam;
      this.run();
      // keep the NOW tags honest while the page is open
      const t = setInterval(() => this.now.set(Date.now()), 60_000);
      addEventListener('pagehide', () => clearInterval(t), { once: true });
    });
  }

  private async run() {
    if (!this.browser || !this.calc) return;
    const c = PLACES.find((x) => x.name === this.city()) ?? PLACES[0];
    this.p.set(this.calc(this.date(), c.lat, c.lon));
    const { festivalOn } = await import('../../core/celebrate');
    this.festival.set(festivalOn(this.date())?.name ?? null);
  }

  protected pickCity(name: string) {
    this.city.set(name);
    try {
      localStorage.setItem(LAST, name);
    } catch {
      /* fine */
    }
    this.run();
  }
  protected setDate(v: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    this.date.set(v);
    this.run();
  }
  protected shift(days: number) {
    const d = new Date(this.date() + 'T00:00:00');
    d.setDate(d.getDate() + days);
    this.setDate(localIso(d));
  }
  /** IST clock time; adds the date when it falls on another day. */
  protected time(d: Date) {
    const t = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });
    const day = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return day === this.date() ? t : `${t}, ${new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  }
  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
}
