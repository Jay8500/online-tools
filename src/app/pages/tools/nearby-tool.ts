import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { PLACES } from '../../core/cinema-data';
import { FUEL_BRANDS, NearbyKind, NearbyRow, loadNearby } from '../../core/nearby';
import { CITIES, haversineKm } from '../../core/places';
import { Icon } from '../../shared/icon';

interface Origin {
  name: string;
  lat: number;
  lon: number;
}

const PLACE_RE = /^[\p{L}0-9 .,'()-]{2,80}$/u;
const PAGE = 20;

/** Police stations or petrol bunks nearest to the visitor (OpenStreetMap data, distances on the device). */
@Component({
  selector: 'app-nearby-tool',
  imports: [Icon],
  template: `
    @if (kind() === 'police') {
      <div class="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-rose-300/60 bg-rose-500/10 p-3 text-sm" role="note">
        <b class="text-rose-700 dark:text-rose-300">Emergency?</b>
        <a href="tel:112" class="btn-primary min-h-9 bg-rose-600 text-sm hover:bg-rose-700">📞 112</a>
        <a href="tel:100" class="btn-ghost min-h-9 text-sm">Police 100</a>
        <a href="tel:1091" class="btn-ghost min-h-9 text-sm">Women 1091</a>
        <span class="text-xs text-muted">Free calls, work 24×7 from any phone.</span>
      </div>
    }

    <form (submit)="$event.preventDefault(); setFrom()" novalidate>
      <label class="label" for="n-from">Your location</label>
      <div class="flex gap-2" [class.field-invalid]="!!fromErr()">
        <input id="n-from" class="input" list="n-places" placeholder="Your area, e.g. Kukatpally" maxlength="80" autocomplete="off" [value]="fromText()" (input)="fromText.set(val($event))" />
        <datalist id="n-places">@for (p of places; track p[0]) { <option [value]="p[0]"></option> }</datalist>
        <button type="submit" class="btn-primary shrink-0" [disabled]="busy()">{{ busy() ? '…' : 'Go' }}</button>
        <button type="button" class="btn-ghost shrink-0" (click)="locate()" [disabled]="busy()" title="Use my location" aria-label="Use my location"><svg lucideIcon="locate-fixed" [size]="16" /></button>
      </div>
      @if (fromErr()) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ fromErr() }}</p> }
    </form>

    @if (kind() === 'fuel') {
      <div class="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap" role="group" aria-label="Brand">
        <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="!brand()" (click)="brand.set('')">All brands</button>
        @for (b of brands; track b) { <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="brand() === b" (click)="brand.set(brand() === b ? '' : b)">{{ b }}</button> }
      </div>
    }

    <div class="mt-4" aria-live="polite">
      @if (!rows()) {
        <div class="h-40 animate-pulse rounded-2xl bg-surface-2"></div>
      } @else if (!origin()) {
        <div class="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
          <svg lucideIcon="map-pin" [size]="28" class="mx-auto mb-2 text-brand" />
          Tap <b class="text-ink">📍</b> to use your location, or type your area — we’ll list the nearest {{ noun() }} with distance and directions.
        </div>
      } @else {
        <p class="mb-2 text-xs text-muted">Nearest {{ noun() }} to <b class="text-ink">{{ origin()!.name }}</b> · straight-line distance · <button type="button" class="underline" (click)="clearFrom()">change</button></p>
        <ul class="space-y-2">
          @for (r of list().slice(0, shown()); track r.key; let i = $index) {
            <li class="animate-fade-up rounded-xl border border-line bg-surface p-3" [style.animation-delay.ms]="i < 10 ? i * 30 : 0">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold">{{ r.name }}</p>
                  <p class="text-xs text-muted">{{ r.area ? r.area + ', ' : '' }}{{ r.city }}</p>
                  <p class="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold">
                    @if (r.brand) { <span class="rounded-full bg-surface-2 px-2 py-0.5">{{ r.brand }}</span> }
                    @if (r.h24) { <span class="rounded-full bg-green-500/15 px-2 py-0.5 text-green-700 dark:text-green-300">Open 24×7</span> }
                    @if (i === 0) { <span class="rounded-full bg-brand/15 px-2 py-0.5 text-brand">Nearest</span> }
                  </p>
                </div>
                <p class="shrink-0 text-right text-lg font-bold tabular-nums text-brand">{{ fmtKm(r.km) }}<span class="block text-[11px] font-normal text-muted">~{{ mins(r.km) }} min drive</span></p>
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                <a class="btn-ghost min-h-8 text-xs" [href]="directions(r)" target="_blank" rel="noopener"><svg lucideIcon="navigation" [size]="14" /> Directions ↗</a>
                @if (r.phone) { <a class="btn-ghost min-h-8 text-xs" [href]="'tel:' + r.phone.replace(' ', '')">📞 {{ r.phone }}</a> }
              </div>
            </li>
          } @empty {
            <li class="rounded-xl border border-line px-3 py-4 text-center text-sm text-muted">None found nearby{{ brand() ? ' for ' + brand() : '' }}. Try “All brands” or another area.</li>
          }
        </ul>
        @if (list().length > shown()) {
          <button type="button" class="btn-ghost mt-3 w-full" (click)="shown.set(shown() + PAGE)">Show more</button>
        }
      }
    </div>

    <p class="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
      {{ total() }} {{ noun() }} in Telangana & Andhra Pradesh from OpenStreetMap ({{ asOf() }}). Some may be missing or moved —
      {{ kind() === 'police' ? 'in an emergency always call 112.' : 'tap Directions to confirm on the map.' }}
      Your location stays on your phone. Missing place? <a class="underline" href="https://www.openstreetmap.org/" target="_blank" rel="noopener">Add it on OpenStreetMap</a>.
    </p>
  `,
})
export class NearbyTool {
  readonly kind = input.required<NearbyKind>();
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly PAGE = PAGE;
  protected readonly places = PLACES;
  protected readonly brands = FUEL_BRANDS;
  protected readonly rows = signal<NearbyRow[] | null>(null);
  protected readonly asOf = signal('');
  protected readonly fromText = signal('');
  protected readonly origin = signal<Origin | null>(null);
  protected readonly fromErr = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly brand = signal('');
  protected readonly shown = signal(PAGE);
  protected readonly noun = computed(() => (this.kind() === 'police' ? 'police stations' : 'petrol bunks'));
  protected readonly total = computed(() => this.rows()?.length ?? 0);

  /** Nearest first; only places within 60 km (beyond that the list isn't "near"). */
  protected readonly list = computed(() => {
    const o = this.origin();
    const rows = this.rows();
    if (!o || !rows) return [];
    const b = this.brand();
    return rows
      .filter((r) => !b || r[6] === b)
      .map((r) => ({ key: `${r[0]}|${r[3]}|${r[4]}`, name: r[0], area: r[1], city: r[2], lat: r[3], lon: r[4], brand: r[6], phone: r[7], h24: !!r[8], km: haversineKm(o, { lat: r[3], lon: r[4] }) }))
      .filter((r) => r.km <= 60)
      .sort((a, b) => a.km - b.km);
  });

  constructor() {
    afterNextRender(async () => {
      const d = await loadNearby(this.kind());
      this.rows.set(d.rows);
      this.asOf.set(new Date(d.asOf + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }));
    });
  }

  protected async setFrom() {
    const text = this.fromText().trim().replace(/\s+/g, ' ');
    this.fromErr.set(null);
    if (!text) return this.clearFrom();
    if (!PLACE_RE.test(text)) return this.fromErr.set('Use letters and numbers only, e.g. Kukatpally.');
    const key = (s: string) => s.toLowerCase().replace(/[\s.]/g, '');
    const t = key(text);
    const p = PLACES.find((x) => key(x[0]) === t) ?? CITIES.find((x) => key(x.name) === t);
    if (p) return this.use(Array.isArray(p) ? { name: p[0], lat: p[1], lon: p[2] } : { name: p.name, lat: p.lat, lon: p.lon });
    this.busy.set(true);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(text)}&near=17.39,78.49`);
      const j = (await r.json().catch(() => ({}))) as { lat?: number; lon?: number; error?: string };
      if (r.ok && j.lat != null && j.lon != null) this.use({ name: text, lat: j.lat, lon: j.lon });
      else if (j.error === 'not-configured') this.fromErr.set('Pick an area from the list, or tap the location button.');
      else this.fromErr.set(j.error || 'Couldn’t find that place. Try a nearby area.');
    } catch {
      this.fromErr.set('No internet connection. Pick an area from the list instead.');
    } finally {
      this.busy.set(false);
    }
  }

  /** Location stays on this device. */
  protected locate() {
    if (!this.browser || !navigator.geolocation) return this.fromErr.set('Location isn’t available in this browser. Type your area instead.');
    this.busy.set(true);
    this.fromErr.set(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.busy.set(false);
        this.fromText.set('');
        this.use({ name: 'your location', lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        this.busy.set(false);
        this.fromErr.set('Location permission was denied. Type your area instead.');
      },
      { maximumAge: 300000, timeout: 10000, enableHighAccuracy: true },
    );
  }

  protected clearFrom() {
    this.origin.set(null);
    this.fromText.set('');
    this.fromErr.set(null);
  }

  private use(o: Origin) {
    this.origin.set(o);
    this.shown.set(PAGE);
  }

  protected directions(r: { lat: number; lon: number }) {
    const o = this.origin();
    return `https://www.google.com/maps/dir/?api=1${o && o.name !== 'your location' ? `&origin=${o.lat},${o.lon}` : ''}&destination=${r.lat},${r.lon}`;
  }
  protected fmtKm(km: number) {
    return km < 1 ? `${Math.round((km * 1000) / 50) * 50} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  }
  /** Rough city drive time: road ≈ 1.3 × straight line at ~22 km/h. */
  protected mins(km: number) {
    return Math.max(1, Math.round(((km * 1.3) / 22) * 60));
  }
  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
}
