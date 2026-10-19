import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { HOLIDAYS, Holiday, HolidayKind, REGIONS, Region, YEARS, holidayArt } from '../../core/holidays';
import { Icon } from '../../shared/icon';

interface Card extends Holiday {
  art: string;
  day: string;
  dm: string;
  days: number;
  weekend: boolean;
  longWeekend: boolean;
}

const LAST = 'holiday-region';
const DAY = 86_400_000;
/** Card colours per kind (soft gradient behind the picture). */
const TONE: Record<HolidayKind, string> = {
  national: 'from-orange-400/25 via-white/0 to-green-500/25',
  hindu: 'from-amber-400/30 to-rose-400/20',
  muslim: 'from-emerald-400/25 to-teal-500/20',
  christian: 'from-sky-400/25 to-indigo-400/20',
  sikh: 'from-orange-400/25 to-yellow-300/20',
  jain: 'from-yellow-300/30 to-orange-300/20',
  buddhist: 'from-yellow-300/30 to-amber-500/20',
  leader: 'from-blue-400/25 to-cyan-400/20',
  state: 'from-pink-400/30 to-fuchsia-400/20',
};

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-holiday-tool',
  imports: [Icon],
  template: `
    <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Region">
      @for (r of regions; track r.id) { <button type="button" class="chip min-h-9" [attr.aria-pressed]="region() === r.id" (click)="pickRegion(r.id)">{{ r.name }}</button> }
      <span class="chip min-h-9 cursor-default opacity-60" title="More states coming soon">More states soon</span>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="Year">
      @for (y of years; track y) { <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="year() === y" (click)="year.set(y)">{{ y }}</button> }
      <label class="ml-auto flex items-center gap-2 text-xs text-muted"><input type="checkbox" class="size-4 accent-[var(--brand)]" [checked]="hidePast()" (change)="hidePast.set(!hidePast())" /> Hide past</label>
    </div>

    @if (next(); as n) {
      <div class="relative mt-4 overflow-hidden rounded-2xl border border-line bg-gradient-to-br p-4 animate-fade-up" [class]="tone(n.kind)">
        <div class="flex items-center gap-4">
          <span class="animate-float text-5xl sm:text-6xl" aria-hidden="true">@if (n.art === 'flag') { <span class="tricolour"></span> } @else { {{ n.art }} }</span>
          <div class="min-w-0">
            <p class="flex items-center gap-2 text-xs font-bold tracking-wide text-red-600 uppercase dark:text-red-400">
              <span class="relative flex size-2" aria-hidden="true"><span class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75"></span><span class="relative inline-flex size-2 rounded-full bg-red-600"></span></span>
              {{ n.days === 0 ? 'Holiday today' : 'Next holiday' }}
            </p>
            <p class="text-xl font-bold sm:text-2xl">{{ n.name }}</p>
            <p class="text-sm">{{ n.day }}, {{ n.dm }} · <b>{{ when(n.days) }}</b>@if (n.longWeekend) { · 🏖️ long weekend }</p>
          </div>
        </div>
      </div>
    }

    @if (!list()) {
      <p class="mt-4 rounded-xl border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm">
        {{ regionName() }}’s {{ year() }} holiday list is usually announced in December. We’ll add it as soon as the government order is out.
        Meanwhile see <button type="button" class="underline" (click)="pickRegion('india')">India (Central Govt) {{ year() }}</button>.
      </p>
    } @else {
      <p class="mt-4 text-xs text-muted">{{ list()!.length }} general holidays · {{ upcoming() }} still to come · Source: <a class="underline" [href]="srcUrl()" target="_blank" rel="noopener">{{ srcName() }}</a></p>
      @for (m of months(); track m.name) {
        <h3 class="mt-4 mb-2 text-sm font-bold text-muted">{{ m.name }}</h3>
        <ul class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          @for (c of m.items; track c.date + c.name; let i = $index) {
            <li class="animate-fade-up relative flex items-center gap-3 overflow-hidden rounded-xl border border-line bg-gradient-to-br p-3 transition hover:-translate-y-0.5 hover:shadow-md"
                [class]="tone(c.kind)" [class.opacity-55]="c.days < 0" [style.animation-delay.ms]="i * 40">
              <span class="grid size-12 shrink-0 place-items-center rounded-xl bg-surface/80 text-3xl shadow-sm" [class.animate-float]="c.days >= 0 && c.days <= 7" aria-hidden="true">@if (c.art === 'flag') { <span class="tricolour"></span> } @else { {{ c.art }} }</span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold leading-tight">{{ c.name }}</p>
                <p class="text-xs text-muted">{{ c.day }}, {{ c.dm }}@if (c.note) { · {{ c.note }} }</p>
                <p class="mt-1 flex flex-wrap gap-1 text-[10px] font-bold">
                  @if (c.days >= 0 && c.days <= 7) {
                    <span class="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-red-600 dark:text-red-400">
                      <span class="relative flex size-1.5" aria-hidden="true"><span class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75"></span><span class="relative inline-flex size-1.5 rounded-full bg-red-600"></span></span>
                      {{ when(c.days) }}
                    </span>
                  } @else if (c.days > 7) {
                    <span class="rounded-full bg-surface-2 px-2 py-0.5 text-muted">{{ when(c.days) }}</span>
                  } @else {
                    <span class="rounded-full bg-surface-2 px-2 py-0.5 text-muted">Over</span>
                  }
                  @if (c.weekend) { <span class="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300">On {{ c.day }}</span> }
                  @if (c.longWeekend) { <span class="rounded-full bg-green-500/15 px-2 py-0.5 text-green-700 dark:text-green-300">Long weekend</span> }
                </p>
              </div>
            </li>
          }
        </ul>
      } @empty {
        <p class="mt-4 rounded-xl border border-line px-3 py-4 text-center text-sm text-muted">All {{ year() }} holidays are over. Pick {{ year() + 1 }} above.</p>
      }
      <button type="button" class="btn-ghost mt-4" (click)="ics()"><svg lucideIcon="download" [size]="16" /> Add to my calendar (.ics)</button>
    }
  `,
})
export class HolidayTool {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly regions = REGIONS;
  protected readonly years = YEARS;
  protected readonly region = signal<Region>('india');
  protected readonly year = signal(2026);
  protected readonly hidePast = signal(false);
  /** "Today" — the prerendered page uses build day; the browser updates it. */
  private readonly today = signal(iso(new Date()));

  protected readonly regionName = computed(() => REGIONS.find((r) => r.id === this.region())!.name);
  protected readonly srcName = computed(() => (this.region() === 'india' && this.year() === 2027 ? 'DoPT O.M. dated 16.07.2026' : REGIONS.find((r) => r.id === this.region())!.source));
  protected readonly srcUrl = computed(() => REGIONS.find((r) => r.id === this.region())!.url);
  protected readonly list = computed(() => HOLIDAYS[this.region()][this.year()] ?? null);

  private readonly cards = computed<Card[]>(() => {
    const t = new Date(this.today() + 'T00:00:00').getTime();
    const all = this.list() ?? [];
    const set = new Set(all.map((x) => x.date));
    return all.map((x) => {
      const d = new Date(x.date + 'T00:00:00');
      const wd = d.getDay();
      const near = (o: number) => set.has(iso(new Date(d.getTime() + o * DAY)));
      return {
        ...x,
        art: holidayArt(x.name, x.kind),
        day: d.toLocaleDateString('en-IN', { weekday: 'long' }),
        dm: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        days: Math.round((d.getTime() - t) / DAY),
        weekend: wd === 0 || wd === 6,
        // Friday or Monday off (or next to another holiday that touches a weekend) → 3+ days in a row
        longWeekend: wd === 5 || wd === 1 || (wd === 4 && near(1)) || (wd === 2 && near(-1)),
      };
    });
  });

  protected readonly months = computed(() => {
    const out: { name: string; items: Card[] }[] = [];
    for (const c of this.cards()) {
      if (this.hidePast() && c.days < 0) continue;
      const name = new Date(c.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const last = out[out.length - 1];
      if (last?.name === name) last.items.push(c);
      else out.push({ name, items: [c] });
    }
    return out;
  });

  protected readonly upcoming = computed(() => this.cards().filter((c) => c.days >= 0).length);
  /** Next holiday across this year and next, so the banner never goes empty in December. */
  protected readonly next = computed(() => {
    const t = new Date(this.today() + 'T00:00:00').getTime();
    const pool = YEARS.flatMap((y) => HOLIDAYS[this.region()][y] ?? []);
    const n = pool.find((x) => new Date(x.date + 'T00:00:00').getTime() >= t);
    if (!n) return null;
    const d = new Date(n.date + 'T00:00:00');
    const wd = d.getDay();
    return {
      ...n,
      art: holidayArt(n.name, n.kind),
      day: d.toLocaleDateString('en-IN', { weekday: 'long' }),
      dm: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      days: Math.round((d.getTime() - t) / DAY),
      longWeekend: wd === 5 || wd === 1,
    };
  });

  constructor() {
    afterNextRender(() => {
      this.today.set(iso(new Date()));
      try {
        const r = localStorage.getItem(LAST) as Region | null;
        if (r && REGIONS.some((x) => x.id === r)) this.region.set(r);
      } catch {
        /* ignore */
      }
    });
  }

  protected pickRegion(r: Region) {
    this.region.set(r);
    try {
      localStorage.setItem(LAST, r);
    } catch {
      /* ignore */
    }
  }

  protected tone(k: HolidayKind) {
    return TONE[k];
  }

  protected when(days: number) {
    return days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days < 0 ? 'Over' : days <= 60 ? `in ${days} days` : `in ${Math.round(days / 30)} months`;
  }

  /** Calendar file (Google Calendar, iPhone, Outlook) — made on this device. */
  protected ics() {
    if (!this.browser) return;
    const list = this.list() ?? [];
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const esc = (s: string) => s.replace(/[\\,;]/g, (m) => '\\' + m);
    const ev = list.map((x) => {
      const d = x.date.replace(/-/g, '');
      const e = iso(new Date(new Date(x.date + 'T00:00:00').getTime() + DAY)).replace(/-/g, '');
      return ['BEGIN:VEVENT', `UID:${d}-${x.name.replace(/\W+/g, '')}-${this.region()}@tools.spreadapps.in`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${e}`, `SUMMARY:${esc(x.name)} (holiday)`, 'TRANSP:TRANSPARENT', 'END:VEVENT'].join('\r\n');
    });
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Spread Apps Tools//Holidays//EN', `X-WR-CALNAME:${esc(this.regionName())} holidays ${this.year()}`, ...ev, 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
    a.download = `${this.region()}-holidays-${this.year()}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}
