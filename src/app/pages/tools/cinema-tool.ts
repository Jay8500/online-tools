import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { CINEMAS, CINEMAS_AS_OF, PLACES } from '../../core/cinema-data';
import { CITIES, haversineKm } from '../../core/places';
import { Icon } from '../../shared/icon';

interface Origin {
  name: string;
  lat: number;
  lon: number;
}

const ALL = 'All TS & AP';
const LAST = 'cinema-city';
const PLACE_RE = /^[\p{L}0-9 .,'()-]{2,80}$/u;
const PAGE = 30;

/** Cities that have cinemas, biggest first (Hyderabad leads). */
const CITY_LIST = (() => {
  const n = new Map<string, number>();
  for (const c of CINEMAS) n.set(c[2], (n.get(c[2]) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
})();

@Component({
  selector: 'app-cinema-tool',
  imports: [Icon],
  template: `
    <div class="grid gap-3 sm:grid-cols-2">
      <div>
        <label class="label" for="c-city">City</label>
        <select id="c-city" class="input" (change)="pickCity(val($event))">
          @for (c of cityList; track c.name) { <option [value]="c.name" [selected]="c.name === city()">{{ c.name }} ({{ c.count }})</option> }
          <option [value]="all" [selected]="city() === all">{{ all }} ({{ total }})</option>
        </select>
      </div>
      <div class="relative">
        <label class="label" for="c-q">Theatre name</label>
        <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute bottom-3 left-3 text-muted" />
        <input id="c-q" class="input pl-9" type="search" placeholder="PVR, INOX, AMB, Prasads…" maxlength="40" [value]="q()" (input)="q.set(val($event)); shown.set(PAGE)" />
      </div>
    </div>

    <form class="mt-3" (submit)="$event.preventDefault(); setFrom()" novalidate>
      <label class="label" for="c-from">Distance from</label>
      <div class="flex gap-2" [class.field-invalid]="!!fromErr()">
        <input id="c-from" class="input" list="c-places" placeholder="Your area, e.g. Kukatpally" maxlength="80" autocomplete="off" [value]="fromText()" (input)="fromText.set(val($event))" />
        <datalist id="c-places">@for (p of places; track p[0]) { <option [value]="p[0]"></option> }</datalist>
        <button type="submit" class="btn-primary shrink-0" [disabled]="busy()">{{ busy() ? '…' : 'Go' }}</button>
        <button type="button" class="btn-ghost shrink-0" (click)="locate()" [disabled]="busy()" title="Use my location" aria-label="Use my location"><svg lucideIcon="locate-fixed" [size]="16" /></button>
      </div>
      @if (fromErr()) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ fromErr() }}</p> }
    </form>

    <div class="mt-4" aria-live="polite">
      <p class="mb-2 text-xs text-muted">
        {{ list().length }} {{ list().length === 1 ? 'cinema' : 'cinemas' }}
        @if (origin(); as o) { · nearest to <b class="text-ink">{{ o.name }}</b> · straight-line distance <button type="button" class="underline" (click)="clearFrom()">clear</button> }
        @else { · A–Z · add your area to sort by distance }
      </p>
      <ul class="space-y-2">
        @for (c of list().slice(0, shown()); track c.key) {
          <li class="rounded-xl border border-line bg-surface p-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold">{{ c.name }}</p>
                <p class="text-xs text-muted">{{ c.area ? c.area + ', ' : '' }}{{ c.city }}</p>
              </div>
              @if (c.km !== null) { <p class="shrink-0 text-right text-lg font-bold tabular-nums text-brand">{{ fmtKm(c.km) }}<span class="block text-[11px] font-normal text-muted">away</span></p> }
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <a class="btn-ghost min-h-8 text-xs" [href]="showtimes(c)" target="_blank" rel="noopener"><svg lucideIcon="clapperboard" [size]="14" /> Shows & tickets ↗</a>
              <a class="btn-ghost min-h-8 text-xs" [href]="directions(c)" target="_blank" rel="noopener"><svg lucideIcon="navigation" [size]="14" /> Directions ↗</a>
            </div>
          </li>
        } @empty {
          <li class="rounded-xl border border-line px-3 py-4 text-center text-sm text-muted">No cinema matches. Try another name or “{{ all }}”.</li>
        }
      </ul>
      @if (list().length > shown()) {
        <button type="button" class="btn-ghost mt-3 w-full" (click)="shown.set(shown() + PAGE)">Show more ({{ list().length - shown() }} left)</button>
      }
    </div>

    <div class="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
      <p><b class="text-ink">Showtimes & ticket prices</b> change every show, so we don’t copy them. Tap “Shows & tickets” for today’s shows and seat prices, or browse
        <a class="underline" [href]="districtUrl()" target="_blank" rel="noopener">District</a> and <a class="underline" href="https://in.bookmyshow.com/" target="_blank" rel="noopener">BookMyShow</a>.</p>
      <p class="mt-1">Cinema list from OpenStreetMap ({{ asOf }}). Theatre missing or closed? <a class="underline" href="https://www.openstreetmap.org/" target="_blank" rel="noopener">Fix it on OpenStreetMap</a> and it’ll appear here in our next update.</p>
    </div>
  `,
})
export class CinemaTool {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly PAGE = PAGE;
  protected readonly all = ALL;
  protected readonly cityList = CITY_LIST;
  protected readonly total = CINEMAS.length;
  protected readonly places = PLACES;
  protected readonly asOf = new Date(CINEMAS_AS_OF + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  protected readonly city = signal('Hyderabad');
  protected readonly q = signal('');
  protected readonly fromText = signal('');
  protected readonly origin = signal<Origin | null>(null);
  protected readonly fromErr = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly shown = signal(PAGE);

  protected readonly list = computed(() => {
    const city = this.city();
    const q = this.q().trim().toLowerCase();
    const o = this.origin();
    const rows = CINEMAS.filter((c) => (city === ALL || c[2] === city) && (!q || `${c[0]} ${c[1]}`.toLowerCase().includes(q))).map((c) => ({
      key: `${c[0]}|${c[3]}|${c[4]}`,
      name: c[0],
      area: c[1],
      city: c[2],
      lat: c[3],
      lon: c[4],
      km: o ? haversineKm(o, { lat: c[3], lon: c[4] }) : null,
    }));
    return o ? rows.sort((a, b) => a.km! - b.km!) : rows;
  });

  protected readonly districtUrl = computed(() =>
    this.city() === 'Hyderabad' ? 'https://www.district.in/movies/cinemas-in-hyderabad' : 'https://www.district.in/movies/',
  );

  constructor() {
    afterNextRender(() => {
      try {
        const c = localStorage.getItem(LAST);
        if (c && (c === ALL || CITY_LIST.some((x) => x.name === c))) this.city.set(c);
      } catch {
        /* ignore */
      }
    });
  }

  protected pickCity(c: string) {
    this.city.set(c);
    this.shown.set(PAGE);
    try {
      localStorage.setItem(LAST, c);
    } catch {
      /* ignore */
    }
  }

  /** Built-in places resolve on the device; anything else goes to the geocoder once. */
  protected async setFrom() {
    const text = this.fromText().trim().replace(/\s+/g, ' ');
    this.fromErr.set(null);
    if (!text) return this.clearFrom();
    if (!PLACE_RE.test(text)) return this.fromErr.set('Use letters and numbers only, e.g. Kukatpally.');
    // "Dilsukhnagar" = "Dilsukh Nagar", "L.B. Nagar" = "LB Nagar"
    const key = (s: string) => s.toLowerCase().replace(/[\s.]/g, '');
    const t = key(text);
    const p = PLACES.find((x) => key(x[0]) === t) ?? CITIES.find((x) => key(x.name) === t);
    if (p) return this.useOrigin(Array.isArray(p) ? { name: p[0], lat: p[1], lon: p[2] } : { name: p.name, lat: p.lat, lon: p.lon });

    this.busy.set(true);
    try {
      const focus = this.centre();
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(text)}${focus ? `&near=${focus.lat.toFixed(2)},${focus.lon.toFixed(2)}` : ''}`);
      const j = (await r.json().catch(() => ({}))) as { name?: string; lat?: number; lon?: number; error?: string };
      if (r.ok && j.lat != null && j.lon != null) this.useOrigin({ name: text, lat: j.lat, lon: j.lon });
      else if (j.error === 'not-configured' || r.status === 404 && !j.error) this.fromErr.set('Pick an area from the list, or tap the location button.');
      else this.fromErr.set(j.error || 'Couldn’t find that place. Try a nearby area.');
    } catch {
      this.fromErr.set('No internet connection. Pick an area from the list instead.');
    } finally {
      this.busy.set(false);
    }
  }

  /** Location stays on this device — distances are worked out here, nothing is sent. */
  protected locate() {
    if (!this.browser || !navigator.geolocation) return this.fromErr.set('Location isn’t available in this browser. Type your area instead.');
    this.busy.set(true);
    this.fromErr.set(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.busy.set(false);
        this.fromText.set('');
        this.useOrigin({ name: 'your location', lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        this.busy.set(false);
        this.fromErr.set('Location permission was denied. Type your area instead.');
      },
      { maximumAge: 600000, timeout: 10000 },
    );
  }

  protected clearFrom() {
    this.origin.set(null);
    this.fromText.set('');
    this.fromErr.set(null);
  }

  private useOrigin(o: Origin) {
    this.origin.set(o);
    this.shown.set(PAGE);
    // Far from the chosen city (e.g. Vizag while "Hyderabad" is selected)? Switch to the nearest city with cinemas.
    const near = this.list()[0];
    if (this.city() !== ALL && (!near || near.km! > 40)) {
      const best = CINEMAS.reduce((a, c) => (haversineKm(o, { lat: c[3], lon: c[4] }) < haversineKm(o, { lat: a[3], lon: a[4] }) ? c : a));
      this.city.set(best[2]);
    }
  }

  private centre() {
    const c = CITIES.find((x) => x.name === this.city());
    if (c) return c;
    const first = CINEMAS.find((x) => x[2] === this.city());
    return first ? { lat: first[3], lon: first[4] } : null;
  }

  protected showtimes(c: { name: string; area: string; city: string }) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${c.name} ${c.area} ${c.city} showtimes`)}`;
  }
  protected directions(c: { lat: number; lon: number }) {
    const o = this.origin();
    return `https://www.google.com/maps/dir/?api=1${o && o.name !== 'your location' ? `&origin=${o.lat},${o.lon}` : ''}&destination=${c.lat},${c.lon}`;
  }
  protected fmtKm(km: number) {
    return km < 1 ? `${Math.round(km * 1000 / 50) * 50} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  }
  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
}
