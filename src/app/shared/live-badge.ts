import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, afterNextRender, inject, input, signal } from '@angular/core';

/** One shared request per page for every badge of the same kind. */
let metalsP: Promise<{ gold24PerG: number; silverPerKg: number } | null> | null = null;
let weatherP: Promise<{ place: string; temp: number } | null> | null = null;

function metals() {
  metalsP ??= fetch('/api/metals')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .finally(() => setTimeout(() => (metalsP = null), 55_000));
  return metalsP;
}

function weather(city: string) {
  weatherP ??= fetch(`/api/weather?city=${encodeURIComponent(city)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => (j && !j.error ? { place: j.place as string, temp: Math.round(j.now.temp as number) } : null))
    .catch(() => null);
  return weatherP;
}

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/**
 * Small live value shown on the right of a tool card (home / group pages).
 * Renders nothing until data arrives, so the card never shows a broken state.
 */
@Component({
  selector: 'app-live-badge',
  host: { class: 'ml-auto shrink-0 self-start' },
  template: `
    @if (text()) {
      <span class="flex flex-col items-end gap-0.5 text-right">
        <span class="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
          <span class="relative flex size-1.5" aria-hidden="true">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75"></span>
            <span class="relative inline-flex size-1.5 rounded-full bg-red-600"></span>
          </span>
          LIVE
        </span>
        <span class="text-sm font-bold whitespace-nowrap text-ink tabular-nums">{{ text() }}</span>
        @if (sub()) { <span class="text-[10px] whitespace-nowrap text-muted">{{ sub() }}</span> }
      </span>
    }
  `,
})
export class LiveBadge {
  readonly kind = input.required<'gold' | 'weather'>();
  protected readonly text = signal('');
  protected readonly sub = signal('');

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      if (!browser) return;
      void this.load();
      if (this.kind() === 'gold') {
        const t = setInterval(() => document.visibilityState === 'visible' && this.load(), 60_000);
        destroy.onDestroy(() => clearInterval(t));
      }
    });
  }

  private async load() {
    if (this.kind() === 'gold') {
      const m = await metals();
      if (m) {
        this.text.set(`₹${INR.format(m.gold24PerG * 10)}`);
        this.sub.set('24K · 10 g');
      }
    } else {
      let city = 'Hyderabad';
      try {
        city = localStorage.getItem('weather-city') || city;
      } catch {
        /* default city */
      }
      const w = await weather(city);
      if (w) {
        this.text.set(`${w.temp}°C`);
        this.sub.set(w.place);
      }
    }
  }
}
