import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { FUEL, FUEL_AS_OF, FuelCity } from '../../core/fuel-data';
import { dailyRates } from '../../core/rates-client';

const DAY = 86400000;
/** A change in the last 7 days is "new" and gets a blinking alert. */
export function recentChange(c: FuelCity, now = Date.now()): boolean {
  return !!c.changedOn && now - new Date(c.changedOn + 'T06:00:00+05:30').getTime() < 7 * DAY;
}

@Component({
  selector: 'app-fuel-tool',
  template: `
    <div class="flex flex-wrap items-end gap-3">
      <div class="min-w-48 flex-1">
        <label class="label" for="f-city">Your city</label>
        <select id="f-city" class="input" (change)="setCity($event)">
          @for (c of rows(); track c.city) { <option [value]="c.city" [selected]="c.city === city()">{{ c.city }} ({{ c.state }})</option> }
        </select>
      </div>
      <p class="text-xs text-muted">Prices as on {{ asOf() }} · {{ auto() ? 'auto-updated daily at 7 am' : 'revised daily at 6 am' }}</p>
    </div>

    @if (sel(); as c) {
      <div class="mt-4 grid gap-3 sm:grid-cols-2" aria-live="polite">
        @for (f of fuels; track f.key) {
          @let now = c[f.key];
          @let prev = f.key === 'petrol' ? c.prevPetrol : c.prevDiesel;
          <div class="relative rounded-2xl border bg-surface-2 p-4" [class.border-line]="!isNew(c) || now === prev" [class.border-amber-400]="isNew(c) && now !== prev">
            @if (isNew(c) && now !== prev) {
              <span class="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" [class]="now > prev ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'">
                <span class="relative flex size-1.5"><span class="absolute inline-flex size-full animate-ping rounded-full opacity-75" [class]="now > prev ? 'bg-red-500' : 'bg-green-500'"></span><span class="relative inline-flex size-1.5 rounded-full" [class]="now > prev ? 'bg-red-600' : 'bg-green-600'"></span></span>
                PRICE {{ now > prev ? 'UP' : 'DOWN' }}
              </span>
            }
            <p class="text-xs font-semibold text-muted">{{ f.label }} · {{ c.city }}</p>
            <p class="text-3xl font-bold tabular-nums">₹{{ now.toFixed(2) }}<span class="text-base font-semibold text-muted">/litre</span></p>
            @if (now !== prev) {
              <p class="text-sm font-semibold" [class]="now > prev ? 'text-red-600' : 'text-green-600'">{{ now > prev ? '▲' : '▼' }} ₹{{ diff(now, prev) }} on {{ date(c.changedOn!) }} <span class="font-normal text-muted">(was ₹{{ prev.toFixed(2) }})</span></p>
            } @else {
              <p class="text-sm text-muted">● No change recently</p>
            }
          </div>
        }
      </div>
    }

    <div class="mt-4 overflow-x-auto rounded-2xl border border-line">
      <table class="w-full text-sm tabular-nums">
        <thead class="bg-surface-2 text-left text-xs text-muted"><tr><th class="px-3 py-2">City</th><th class="px-3 py-2 text-right">Petrol</th><th class="px-3 py-2 text-right">Diesel</th><th class="px-3 py-2">Last change</th></tr></thead>
        <tbody class="divide-y divide-line bg-surface">
          @for (c of rows(); track c.city) {
            <tr [class.bg-brand/5]="c.city === city()">
              <td class="px-3 py-2 font-medium">{{ c.city }}</td>
              <td class="px-3 py-2 text-right whitespace-nowrap">₹{{ c.petrol.toFixed(2) }} {{ arrow(c.petrol, c.prevPetrol) }}</td>
              <td class="px-3 py-2 text-right whitespace-nowrap">₹{{ c.diesel.toFixed(2) }} {{ arrow(c.diesel, c.prevDiesel) }}</td>
              <td class="px-3 py-2 text-xs text-muted">{{ c.changedOn ? date(c.changedOn) : '—' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class FuelTool {
  protected readonly rows = signal<FuelCity[]>(FUEL);
  private readonly asOfIso = signal(FUEL_AS_OF);
  protected readonly fuels = [
    { key: 'petrol' as const, label: 'Petrol' },
    { key: 'diesel' as const, label: 'Diesel' },
  ];
  protected readonly asOf = computed(() => new Date(this.asOfIso() + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  /** True once today's auto-updated prices have loaded */
  protected readonly auto = signal(false);
  protected readonly city = signal('Hyderabad');
  protected readonly sel = computed(() => this.rows().find((c) => c.city === this.city()));
  private readonly now = signal(new Date(FUEL_AS_OF + 'T12:00:00+05:30').getTime());

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      if (!browser) return;
      this.now.set(Date.now());
      dailyRates().then((r) => {
        if (!r) return;
        this.rows.set(r.fuel);
        if (r.fuelDate) this.asOfIso.set(r.fuelDate);
        this.auto.set(true);
      });
      try {
        const saved = localStorage.getItem('fuel-city');
        if (saved && FUEL.some((c) => c.city === saved)) this.city.set(saved);
      } catch {
        /* default city */
      }
    });
  }

  protected setCity(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    this.city.set(v);
    try {
      localStorage.setItem('fuel-city', v);
    } catch {
      /* not remembered */
    }
  }
  protected isNew(c: FuelCity) {
    return recentChange(c, this.now());
  }
  protected diff(a: number, b: number) {
    return Math.abs(a - b).toFixed(2);
  }
  protected arrow(a: number, b: number) {
    return a > b ? '▲' : a < b ? '▼' : '';
  }
  protected date(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
