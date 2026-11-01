import { Component, afterNextRender, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

interface Today {
  date: string;
  tithi: string;
  tithiTe: string;
  tithiTill: string;
  nakshatra: string;
  rahu: string;
  sun: string;
  holiday: { name: string; days: number } | null;
}

const HYD = { lat: 17.385, lon: 78.4867 };
const T = (d: Date) => d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).replace(/\s?(am|pm)/i, (m) => ' ' + m.trim().toUpperCase());

/**
 * "Today" strip on the home page: date, tithi, nakshatram, Rahu kalam, sunrise/sunset and the next holiday.
 * Everything is worked out on the device (Hyderabad timings); the panchangam and holiday code load only here.
 */
@Component({
  selector: 'app-today-card',
  imports: [RouterLink, Icon],
  template: `
    @if (t(); as d) {
      <section class="card today mt-5 p-3 sm:p-4" aria-labelledby="h-today">
        <div class="flex items-baseline justify-between gap-2">
          <h2 id="h-today" class="flex items-center gap-1.5 text-sm font-bold"><svg lucideIcon="sun" [size]="16" class="text-amber-500" /> Today · {{ d.date }}</h2>
          <a routerLink="/telugu-panchangam" class="shrink-0 text-xs font-semibold text-brand hover:underline">Full panchangam →</a>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <a routerLink="/telugu-panchangam" class="min-w-0 hover:text-brand">
            <span class="block text-[11px] text-muted">Tithi · తిథి</span>
            <span class="block truncate font-semibold">{{ d.tithiTe }} · {{ d.tithi }}</span>
            <span class="block text-[11px] text-muted">till {{ d.tithiTill }}</span>
          </a>
          <a routerLink="/telugu-panchangam" class="min-w-0 hover:text-brand">
            <span class="block text-[11px] text-muted">Nakshatram</span>
            <span class="block truncate font-semibold">{{ d.nakshatra }}</span>
          </a>
          <a routerLink="/telugu-panchangam" class="min-w-0 hover:text-brand">
            <span class="block text-[11px] text-muted">Rahu kalam</span>
            <span class="block font-semibold">{{ d.rahu }}</span>
            <span class="block text-[11px] text-muted">☀ {{ d.sun }}</span>
          </a>
          @if (d.holiday; as h) {
            <a routerLink="/holiday-calendar" class="min-w-0 hover:text-brand">
              <span class="block text-[11px] text-muted">Next holiday</span>
              <span class="block truncate font-semibold">{{ h.name }}</span>
              <span class="block text-[11px] font-semibold text-rose-600">{{ h.days === 0 ? 'Today 🎉' : h.days === 1 ? 'Tomorrow' : 'in ' + h.days + ' days' }}</span>
            </a>
          }
        </div>
      </section>
    } @else {
      <div class="mt-5 h-[7.5rem] sm:h-24" aria-hidden="true"></div>
    }
  `,
  styles: `
    .today { animation: in 0.35s ease-out both; }
    @keyframes in { from { opacity: 0; transform: translateY(6px); } }
    @media (prefers-reduced-motion: reduce) { .today { animation: none; } }
  `,
})
export class TodayCard {
  protected readonly t = signal<Today | null>(null);

  constructor() {
    afterNextRender(async () => {
      try {
        const [{ panchangam }, { HOLIDAYS, YEARS }] = await Promise.all([import('../core/panchangam'), import('../core/holidays')]);
        const now = new Date();
        const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const p = panchangam(iso, HYD.lat, HYD.lon);
        let region: 'india' | 'telangana' | 'andhra' = 'telangana';
        try {
          region = (localStorage.getItem('holiday-region') as typeof region) || region;
        } catch {
          /* default */
        }
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const next = YEARS.flatMap((y) => HOLIDAYS[region]?.[y] ?? []).find((x) => new Date(x.date + 'T00:00:00').getTime() >= today);
        this.t.set({
          date: now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
          tithi: `${p.paksha.en.replace(/\s*paksha/i, '')} ${p.tithi.en}`,
          tithiTe: p.tithi.te,
          tithiTill: T(p.tithi.end),
          nakshatra: `${p.nakshatra.te} · ${p.nakshatra.en}`,
          rahu: `${T(p.rahu.start)} – ${T(p.rahu.end)}`,
          sun: `${T(p.sunrise)} · ${T(p.sunset)}`,
          holiday: next ? { name: next.name, days: Math.round((new Date(next.date + 'T00:00:00').getTime() - today) / 86400000) } : null,
        });
      } catch {
        /* the strip simply doesn't show */
      }
    });
  }
}
