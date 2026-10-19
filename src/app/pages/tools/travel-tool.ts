import { Component, computed, signal } from '@angular/core';
import { CITIES, MODES, TravelMode, estimate, findCity, fmtHours, haversineKm, travelLinks } from '../../core/places';
import { Icon } from '../../shared/icon';

interface Route {
  from: string;
  to: string;
  mode: string;
  km: number;
  minutes: number;
  stops: { name: string; km: number; min: number }[];
  roads: string[];
  line: [number, number][];
  steps: { text: string; km: number }[];
}

const PLACE_RE = /^[\p{L}0-9 .,'()-]{2,80}$/u;
const ROAD: TravelMode[] = ['car', 'bike', 'bus', 'walk', 'cycle'];

@Component({
  selector: 'app-travel-tool',
  imports: [Icon],
  template: `
    <form class="space-y-3" (submit)="$event.preventDefault(); go()" novalidate>
      <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div [class.field-invalid]="!!fromErr()">
          <label class="label" for="t-from">From</label>
          <input id="t-from" class="input" list="t-cities" placeholder="e.g. Hyderabad" maxlength="80" autocomplete="off" [value]="from()" (input)="from.set(val($event))" />
          @if (fromErr()) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ fromErr() }}</p> }
        </div>
        <button type="button" class="btn-icon justify-self-center" (click)="swap()" aria-label="Swap from and to"><svg lucideIcon="refresh-ccw" [size]="16" /></button>
        <div [class.field-invalid]="!!toErr()">
          <label class="label" for="t-to">To</label>
          <input id="t-to" class="input" list="t-cities" placeholder="e.g. Vijayawada" maxlength="80" autocomplete="off" [value]="to()" (input)="to.set(val($event))" />
          @if (toErr()) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ toErr() }}</p> }
        </div>
        <datalist id="t-cities">@for (c of cities; track c.name) { <option [value]="c.name">{{ c.state }}</option> }</datalist>
      </div>
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Travel mode">
        @for (m of modes; track m.id) {
          <button type="button" class="chip min-h-9" [attr.aria-pressed]="mode() === m.id" (click)="setMode(m.id)"><span aria-hidden="true">{{ m.icon }}</span> {{ m.label }}</button>
        }
      </div>
      <button type="submit" class="btn-primary" [disabled]="loading()"><svg lucideIcon="search" [size]="16" /> {{ loading() ? 'Finding route…' : 'Show journey' }}</button>
    </form>

    <div class="mt-4 space-y-4" aria-live="polite">
      @if (est(); as e) {
        <div class="rounded-2xl border border-line bg-surface-2 p-4">
          <p class="text-xs font-semibold text-muted">Typical {{ modeLabel() }} journey (estimate)</p>
          <p class="text-2xl font-bold text-brand">{{ hours(e.hours) }} <span class="text-base font-semibold text-ink">· about {{ e.km }} km</span></p>
          <p class="text-sm text-muted">{{ e.note }}. Straight-line distance {{ straight() }} km.</p>
          <div class="mt-3 flex flex-wrap gap-2">
            @for (l of links(); track l.url) { <a class="btn-ghost min-h-9 text-xs" [href]="l.url" target="_blank" rel="noopener">{{ l.label }} ↗</a> }
          </div>
        </div>
      }

      @if (routeError()) {
        <p class="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600" role="alert">{{ routeError() }}</p>
      }
      @if (routeOff()) {
        <p class="rounded-xl border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm">Detailed road routes with towns along the way are being switched on. The estimate and Google Maps link above work now.</p>
      }

      @if (route(); as r) {
        <div class="rounded-2xl border border-line bg-surface p-4">
          <p class="text-xs font-semibold text-muted">Road route ({{ modeLabel() }})</p>
          <p class="text-2xl font-bold">{{ hours(r.minutes / 60) }} <span class="text-base font-semibold">· {{ r.km }} km</span></p>
          @if (r.roads.length) { <p class="text-sm text-muted">Via {{ r.roads.join(', ') }}</p> }
          <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="mt-3 h-auto w-full rounded-xl bg-surface-2" role="img" [attr.aria-label]="'Route sketch from ' + r.from + ' to ' + r.to">
            <polyline [attr.points]="sketch().points" fill="none" stroke="var(--brand)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
            @for (s of sketch().stops; track s.name) {
              <circle [attr.cx]="s.x" [attr.cy]="s.y" r="4" fill="#f59e0b" stroke="white" stroke-width="1.5" />
            }
            <circle [attr.cx]="sketch().a[0]" [attr.cy]="sketch().a[1]" r="6" fill="#16a34a" stroke="white" stroke-width="2" />
            <circle [attr.cx]="sketch().b[0]" [attr.cy]="sketch().b[1]" r="6" fill="#dc2626" stroke="white" stroke-width="2" />
          </svg>
          <h3 class="mt-4 mb-2 text-sm font-bold">Journey timeline</h3>
          <ol class="relative ml-2 space-y-3 border-l-2 border-line pl-5 text-sm">
            <li><span class="absolute -left-[7px] mt-1 size-3 rounded-full bg-green-600"></span><b>Start:</b> {{ r.from }} <span class="text-muted">· 0 km</span></li>
            @for (s of r.stops; track s.name) {
              <li><span class="absolute -left-[6px] mt-1 size-2.5 rounded-full bg-amber-500"></span>{{ s.name }} <span class="text-muted">· {{ s.km }} km · ~{{ hours(s.min / 60) }}</span></li>
            }
            <li><span class="absolute -left-[7px] mt-1 size-3 rounded-full bg-red-600"></span><b>Arrive:</b> {{ r.to }} <span class="text-muted">· {{ r.km }} km · ~{{ hours(r.minutes / 60) }}</span></li>
          </ol>
          <details class="mt-4">
            <summary class="cursor-pointer text-sm font-semibold">Turn-by-turn directions ({{ r.steps.length }})</summary>
            <ol class="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
              @for (s of r.steps; track $index) { <li>{{ s.text }} <span class="text-xs">({{ s.km }} km)</span></li> }
            </ol>
          </details>
          <p class="mt-3 text-[11px] text-muted">Route © OpenStreetMap contributors, openrouteservice.org. Times exclude breaks; traffic and road works change them.</p>
        </div>
      }
    </div>
  `,
})
export class TravelTool {
  protected readonly cities = CITIES;
  protected readonly modes = MODES;
  protected readonly W = 320;
  protected readonly H = 200;
  protected readonly from = signal('Hyderabad');
  protected readonly to = signal('Vijayawada');
  protected readonly mode = signal<TravelMode>('car');
  private readonly submitted = signal(false);
  protected readonly loading = signal(false);
  protected readonly route = signal<Route | null>(null);
  protected readonly routeError = signal<string | null>(null);
  protected readonly routeOff = signal(false);
  /** Inputs at the time "Show journey" was pressed */
  private readonly asked = signal<{ from: string; to: string; mode: TravelMode } | null>(null);

  protected readonly fromErr = computed(() => (this.submitted() ? this.placeErr(this.from()) : null));
  protected readonly toErr = computed(() => {
    if (!this.submitted()) return null;
    const e = this.placeErr(this.to());
    if (e) return e;
    return this.from().trim().toLowerCase() === this.to().trim().toLowerCase() ? 'Choose a different destination' : null;
  });
  protected readonly straight = computed(() => {
    const q = this.asked();
    const a = q && findCity(q.from);
    const b = q && findCity(q.to);
    return a && b ? Math.round(haversineKm(a, b)) : null;
  });
  protected readonly est = computed(() => {
    const d = this.straight();
    const q = this.asked();
    return d !== null && q ? estimate(q.mode, d) : null;
  });
  protected readonly links = computed(() => {
    const q = this.asked();
    return q ? travelLinks(q.mode, q.from, q.to) : [];
  });
  protected readonly modeLabel = computed(() => MODES.find((m) => m.id === (this.asked()?.mode ?? this.mode()))?.label.toLowerCase() ?? '');

  /** Project the route onto the SVG box (simple equirectangular, good enough for a sketch). */
  protected readonly sketch = computed(() => {
    const r = this.route();
    if (!r) return { points: '', a: [0, 0], b: [0, 0], stops: [] as { name: string; x: number; y: number }[] };
    const lons = r.line.map((p) => p[0]);
    const lats = r.line.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
    const pad = 16;
    const k = Math.min((this.W - 2 * pad) / (maxX - minX || 1), (this.H - 2 * pad) / (maxY - minY || 1));
    const ox = (this.W - (maxX - minX) * k) / 2;
    const oy = (this.H - (maxY - minY) * k) / 2;
    const xy = (p: [number, number]) => [+(ox + (p[0] - minX) * k).toFixed(1), +(this.H - (oy + (p[1] - minY) * k)).toFixed(1)];
    const pts = r.line.map(xy);
    const stops = r.stops.map((s) => {
      const i = Math.min(pts.length - 1, Math.round((s.km / (r.km || 1)) * (pts.length - 1)));
      return { name: s.name, x: pts[i][0], y: pts[i][1] };
    });
    return { points: pts.map((p) => p.join(',')).join(' '), a: pts[0], b: pts[pts.length - 1], stops };
  });

  private placeErr(v: string): string | null {
    if (!v.trim()) return 'Enter a place';
    if (!PLACE_RE.test(v.trim())) return 'Use letters, numbers and commas only';
    return null;
  }

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  protected setMode(m: TravelMode) {
    this.mode.set(m);
    if (this.asked()) this.go();
  }
  protected swap() {
    const f = this.from();
    this.from.set(this.to());
    this.to.set(f);
  }
  protected hours(h: number) {
    return fmtHours(h);
  }

  async go() {
    this.submitted.set(true);
    if (this.fromErr() || this.toErr()) return;
    const q = { from: this.from().trim(), to: this.to().trim(), mode: this.mode() };
    this.asked.set(q);
    this.route.set(null);
    this.routeError.set(null);
    this.routeOff.set(false);
    if (!ROAD.includes(q.mode)) {
      if (this.straight() === null) this.routeError.set('Estimates for train and flight work for the cities in the list. Use the links for other places.');
      return;
    }
    this.loading.set(true);
    try {
      const r = await fetch(`/api/route?from=${encodeURIComponent(q.from)}&to=${encodeURIComponent(q.to)}&mode=${q.mode}`);
      const j = (await r.json().catch(() => ({}))) as Route & { error?: string };
      if (j.error === 'not-configured' || (r.status === 404 && !j.error)) this.routeOff.set(true);
      else if (!r.ok || j.error) this.routeError.set(j.error || 'Could not find a route. Please try again.');
      else this.route.set(j);
    } catch {
      this.routeError.set('No internet connection. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
