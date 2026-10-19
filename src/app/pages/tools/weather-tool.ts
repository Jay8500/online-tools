import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { Icon } from '../../shared/icon';
import { Sky } from '../../shared/sky';

interface Day {
  date: string;
  min: number;
  max: number;
  pop: number;
  rain: number;
  icon: string;
  text: string;
}
interface Weather {
  place: string;
  updated: number;
  tz: number;
  now: { temp: number; feels: number; humidity: number; wind: number; text: string; icon: string; clouds: number; rain1h: number; visibility: number | null; sunrise: number; sunset: number };
  hours: { t: number; temp: number; icon: string; pop: number }[];
  days: Day[];
}

const CITIES = ['Hyderabad', 'Warangal', 'Vijayawada', 'Visakhapatnam', 'Tirupati', 'Guntur', 'Bengaluru', 'Chennai', 'Mumbai', 'Delhi', 'Kolkata'];
const LAST = 'weather-city';
const CITY_RE = /^[\p{L} .'-]{2,60}$/u;

/** OpenWeatherMap icon code → emoji (no third-party image requests). */
function emoji(icon: string): string {
  const code = icon.slice(0, 2);
  const night = icon.endsWith('n');
  return (
    { '01': night ? '🌙' : '☀️', '02': night ? '☁️' : '🌤️', '03': '☁️', '04': '☁️', '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️' } as Record<string, string>
  )[code] ?? '🌡️';
}

@Component({
  selector: 'app-weather-tool',
  imports: [Icon, Sky],
  template: `
    <form class="flex gap-2" (submit)="$event.preventDefault(); search()" role="search">
      <label class="sr-only" for="w-city">City</label>
      <input id="w-city" class="input" placeholder="City, e.g. Hyderabad" maxlength="60" autocomplete="address-level2" [value]="city()" (input)="city.set(val($event))" />
      <button type="submit" class="btn-primary" [disabled]="loading()"><svg lucideIcon="search" [size]="16" /> <span class="hidden sm:inline">Show</span></button>
      <button type="button" class="btn-ghost" (click)="locate()" [disabled]="loading()" title="Use my location" aria-label="Use my location"><svg lucideIcon="map-pin" [size]="16" /></button>
    </form>
    <div class="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Quick cities">
      @for (c of cities; track c) { <button type="button" class="chip min-h-8 text-xs" (click)="pick(c)">{{ c }}</button> }
    </div>

    <div class="mt-4" aria-live="polite">
      @if (loading()) {
        <div class="h-48 animate-pulse rounded-2xl bg-surface-2"></div>
      } @else if (error()) {
        <p class="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600" role="alert">{{ error() }}</p>
      } @else if (notReady()) {
        <div class="rounded-2xl border border-amber-300/50 bg-amber-500/10 p-4 text-sm">
          <p class="font-semibold">Live weather is being switched on.</p>
          <p class="mt-1 text-muted">Please check back soon. Meanwhile, try our other free tools.</p>
        </div>
      } @else if (w(); as d) {
        <!-- Live sky behind today's weather: changes with sun, clouds, rain, storm, mist, night -->
        <div class="relative isolate overflow-hidden rounded-2xl border border-white/20 p-4 text-white shadow-lg [text-shadow:0_1px_3px_rgb(0_0_0/0.35)]">
          <app-sky [icon]="d.now.icon" />
          <div class="relative z-10">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold">{{ d.place }}</h2>
              <p class="text-xs text-white/85">Updated {{ time(d.updated, d.tz) }} (local time)</p>
            </div>
            <span class="animate-float text-5xl leading-none" aria-hidden="true">{{ em(d.now.icon) }}</span>
          </div>
          <p class="mt-2 text-5xl font-bold tabular-nums">{{ round(d.now.temp) }}°<span class="text-2xl">C</span></p>
          <p class="capitalize">{{ d.now.text }} · feels like {{ round(d.now.feels) }}°C</p>
          <dl class="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div class="rounded-xl bg-white/20 p-2 backdrop-blur-sm"><dt class="text-xs text-white/85">Humidity</dt><dd class="font-semibold">{{ d.now.humidity }}%</dd></div>
            <div class="rounded-xl bg-white/20 p-2 backdrop-blur-sm"><dt class="text-xs text-white/85">Wind</dt><dd class="font-semibold">{{ kmh(d.now.wind) }} km/h</dd></div>
            <div class="rounded-xl bg-white/20 p-2 backdrop-blur-sm"><dt class="text-xs text-white/85">Sunrise</dt><dd class="font-semibold">{{ time(d.now.sunrise, d.tz) }}</dd></div>
            <div class="rounded-xl bg-white/20 p-2 backdrop-blur-sm"><dt class="text-xs text-white/85">Sunset</dt><dd class="font-semibold">{{ time(d.now.sunset, d.tz) }}</dd></div>
          </dl>
          </div>
        </div>
        <h3 class="mt-4 mb-2 text-sm font-bold">Next 24 hours</h3>
        <div class="flex gap-2 overflow-x-auto pb-1">
          @for (h of d.hours; track h.t) {
            <div class="min-w-16 shrink-0 rounded-xl border border-line bg-surface p-2 text-center text-xs">
              <p class="text-muted">{{ time(h.t, d.tz) }}</p>
              <p class="text-xl" aria-hidden="true">{{ em(h.icon) }}</p>
              <p class="font-semibold">{{ round(h.temp) }}°</p>
              @if (h.pop >= 0.2) { <p class="text-sky-600">{{ pct(h.pop) }}%</p> }
            </div>
          }
        </div>
        <h3 class="mt-4 mb-2 text-sm font-bold">5-day forecast</h3>
        <ul class="divide-y divide-line overflow-hidden rounded-2xl border border-line">
          @for (day of d.days; track day.date) {
            <li class="flex items-center gap-3 bg-surface px-3 py-2 text-sm">
              <span class="w-20 font-medium">{{ dayName(day.date) }}</span>
              <span class="text-xl" aria-hidden="true">{{ em(day.icon) }}</span>
              <span class="min-w-0 flex-1 truncate text-muted capitalize">{{ day.text }}@if (day.pop >= 0.2) { · {{ pct(day.pop) }}% rain }</span>
              <span class="tabular-nums"><b>{{ day.max }}°</b> <span class="text-muted">{{ day.min }}°</span></span>
            </li>
          }
        </ul>
        <p class="mt-2 text-[11px] text-muted">Weather data © <a href="https://openweathermap.org" target="_blank" rel="noopener" class="underline">OpenWeather</a>. For storm, cyclone and heavy-rain warnings follow IMD (mausam.imd.gov.in).</p>
      }
    </div>
  `,
})
export class WeatherTool {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly cities = CITIES;
  protected readonly city = signal('Hyderabad');
  protected readonly w = signal<Weather | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notReady = signal(false);

  constructor() {
    afterNextRender(() => {
      try {
        this.city.set(localStorage.getItem(LAST) || 'Hyderabad');
      } catch {
        /* ignore */
      }
      this.search();
    });
  }

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }

  protected pick(c: string) {
    this.city.set(c);
    this.search();
  }

  protected search() {
    const c = this.city().trim();
    if (!CITY_RE.test(c)) return this.error.set('Enter a city name using letters, e.g. Warangal.');
    try {
      localStorage.setItem(LAST, c);
    } catch {
      /* ignore */
    }
    this.load(`city=${encodeURIComponent(c)}`);
  }

  protected locate() {
    if (!this.browser || !navigator.geolocation) return this.error.set('Location isn’t available in this browser. Type your city instead.');
    this.loading.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => this.load(`lat=${pos.coords.latitude.toFixed(2)}&lon=${pos.coords.longitude.toFixed(2)}`),
      () => {
        this.loading.set(false);
        this.error.set('Location permission was denied. Type your city instead.');
      },
      { maximumAge: 600000, timeout: 10000 },
    );
  }

  private async load(q: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const r = await fetch(`/api/weather?${q}`);
      const j = (await r.json().catch(() => ({}))) as Weather & { error?: string };
      // 'not-configured' = API key not set yet; a bare 404 = function not deployed (local dev)
      if (j.error === 'not-configured' || (r.status === 404 && !j.error)) {
        this.notReady.set(true);
      } else if (!r.ok || j.error) {
        this.error.set(j.error || 'Could not load the weather. Please try again.');
      } else {
        this.notReady.set(false);
        this.w.set(j);
        this.city.set(j.place);
      }
    } catch {
      this.error.set('No internet connection. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected em = emoji;
  protected round(n: number) {
    return Math.round(n);
  }
  protected kmh(ms: number) {
    return Math.round(ms * 3.6);
  }
  protected pct(p: number) {
    return Math.round(p * 100);
  }
  /** Unix seconds + city offset → "6:12 am" in the city's local time. */
  protected time(unix: number, tz: number) {
    const d = new Date((unix + tz) * 1000);
    let h = d.getUTCHours();
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    const ap = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${m} ${ap}`;
  }
  protected dayName(iso: string) {
    const d = new Date(iso + 'T12:00:00Z');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', timeZone: 'UTC' });
  }
}
