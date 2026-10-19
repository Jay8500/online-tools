import { Component, computed, signal } from '@angular/core';
import { FARE_BANDS, STATIONS, journey } from '../../core/metro';
import { METRO_LINES } from '../../core/metro-data';
import { Icon } from '../../shared/icon';

const DOT: Record<string, string> = { red: '#dc2626', blue: '#2563eb', green: '#16a34a' };

@Component({
  selector: 'app-metro-tool',
  imports: [Icon],
  template: `
    <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
      <div>
        <label class="label" for="m-from">From station</label>
        <select id="m-from" class="input" (change)="from.set(val($event))">
          @for (l of lines; track l.id) {
            <optgroup [label]="l.name">
              @for (s of l.stations; track s.name) { <option [value]="s.name" [selected]="s.name === from()">{{ s.name }}</option> }
            </optgroup>
          }
        </select>
      </div>
      <button type="button" class="btn-icon justify-self-center" (click)="swap()" aria-label="Swap stations"><svg lucideIcon="refresh-ccw" [size]="16" /></button>
      <div>
        <label class="label" for="m-to">To station</label>
        <select id="m-to" class="input" (change)="to.set(val($event))">
          @for (l of lines; track l.id) {
            <optgroup [label]="l.name">
              @for (s of l.stations; track s.name) { <option [value]="s.name" [selected]="s.name === to()">{{ s.name }}</option> }
            </optgroup>
          }
        </select>
      </div>
    </div>

    <div class="mt-4" aria-live="polite">
      @if (j(); as r) {
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-2xl border border-line bg-surface-2 p-4">
            <p class="text-xs font-semibold text-muted">Fare</p>
            <p class="text-3xl font-bold text-brand tabular-nums">₹{{ r.token }} <span class="text-sm font-semibold text-muted">token / QR</span></p>
            <p class="text-sm">₹{{ r.card }} with smart card</p>
            <dl class="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div class="rounded-xl bg-surface p-2"><dt class="text-[11px] text-muted">Distance</dt><dd class="font-semibold">{{ r.km }} km</dd></div>
              <div class="rounded-xl bg-surface p-2"><dt class="text-[11px] text-muted">Stations</dt><dd class="font-semibold">{{ r.stops }}</dd></div>
              <div class="rounded-xl bg-surface p-2"><dt class="text-[11px] text-muted">Time</dt><dd class="font-semibold">~{{ r.minutes }} min</dd></div>
            </dl>
            @if (r.legs.length > 1) {
              <p class="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">Change trains {{ r.legs.length - 1 === 1 ? 'once' : 'twice' }}: {{ changes() }}</p>
            }
          </div>
          <div class="rounded-2xl border border-line bg-surface p-4">
            <p class="mb-2 text-sm font-bold">Your route</p>
            <ol class="space-y-3">
              @for (l of r.legs; track $index) {
                <li class="rounded-xl border border-line p-2.5">
                  <p class="flex items-center gap-2 text-sm font-semibold"><span class="size-3 rounded-full" [style.background]="dot(l.line.id)"></span>{{ l.line.name }} · {{ l.km.toFixed(1) }} km</p>
                  <p class="mt-1 text-sm">{{ l.from }} → {{ l.to }} <span class="text-muted">({{ l.stops.length - 1 }} stations)</span></p>
                  <details class="mt-1">
                    <summary class="cursor-pointer text-xs text-brand">Show stations</summary>
                    <p class="mt-1 text-xs leading-relaxed text-muted">{{ l.stops.join(' · ') }}</p>
                  </details>
                </li>
              }
            </ol>
          </div>
        </div>
      } @else {
        <p class="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">Choose two different stations to see the fare.</p>
      }
    </div>

    <details class="mt-4 rounded-2xl border border-line p-3">
      <summary class="cursor-pointer text-sm font-semibold">Full fare chart</summary>
      <table class="mt-2 w-full text-sm tabular-nums">
        <thead class="text-left text-xs text-muted"><tr><th class="py-1">Distance</th><th class="py-1 text-right">Token / QR</th><th class="py-1 text-right">Smart card</th></tr></thead>
        <tbody class="divide-y divide-line">
          @for (b of bands; track b.upToKm; let i = $index) {
            <tr><td class="py-1">{{ bandLabel(i) }}</td><td class="py-1 text-right">₹{{ b.token }}</td><td class="py-1 text-right">₹{{ b.card }}</td></tr>
          }
        </tbody>
      </table>
    </details>
  `,
})
export class MetroTool {
  protected readonly lines = METRO_LINES;
  protected readonly bands = FARE_BANDS;
  protected readonly stationCount = STATIONS.length;
  protected readonly from = signal('Miyapur');
  protected readonly to = signal('HITEC City');
  protected readonly j = computed(() => journey(this.from(), this.to()));
  protected readonly changes = computed(() => {
    const r = this.j();
    return r ? r.legs.slice(0, -1).map((l, i) => `at ${l.to} to the ${r.legs[i + 1].line.name}`).join(', then ') : '';
  });

  protected val(e: Event) {
    return (e.target as HTMLSelectElement).value;
  }
  protected swap() {
    const f = this.from();
    this.from.set(this.to());
    this.to.set(f);
  }
  protected dot(id: string) {
    return DOT[id];
  }
  protected bandLabel(i: number) {
    const lo = i === 0 ? 0 : FARE_BANDS[i - 1].upToKm;
    const hi = FARE_BANDS[i].upToKm;
    return hi === Infinity ? `Over ${lo} km` : `${lo === 0 ? 'Up to' : `${lo}–`}${lo === 0 ? ' ' : ''}${hi} km`;
  }
}
