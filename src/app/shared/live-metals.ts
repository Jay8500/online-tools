import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, afterNextRender, inject, output, signal } from '@angular/core';

export interface MetalPrices {
  updatedAt: string;
  usdInr: number;
  spotUsd: { gold: number; silver: number };
  dutyPct: number;
  gstPct: number;
  gold24PerG: number;
  gold22PerG: number;
  gold18PerG: number;
  silverPerG: number;
  silverPerKg: number;
}

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Live India gold/silver estimate with a blinking "LIVE" dot; refreshes every minute while the tab is visible. */
@Component({
  selector: 'app-live-metals',
  template: `
    <div class="rounded-2xl border border-line bg-surface p-3" aria-live="polite">
      <div class="flex items-center justify-between gap-2">
        <p class="flex items-center gap-2 text-sm font-bold">
          <span class="relative flex size-2.5" aria-hidden="true">
            @if (data() && !stale()) { <span class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75"></span> }
            <span class="relative inline-flex size-2.5 rounded-full" [class.bg-red-600]="data() && !stale()" [class.bg-slate-400]="!data() || stale()"></span>
          </span>
          {{ data() && !stale() ? 'LIVE' : 'Prices' }} · India estimate
        </p>
        @if (data(); as d) { <span class="text-[11px] text-muted">Updated {{ ago() }}</span> }
      </div>
      @if (error()) {
        <p class="mt-2 text-sm text-rose-600" role="alert">{{ error() }}</p>
      } @else if (data(); as d) {
        <div class="mt-2 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-xl bg-surface-2 p-2"><p class="text-[11px] text-muted">Gold 24K · 10 g</p><p class="font-bold tabular-nums">₹{{ n(d.gold24PerG * 10) }}</p></div>
          <div class="rounded-xl bg-surface-2 p-2"><p class="text-[11px] text-muted">Gold 22K · 10 g</p><p class="font-bold tabular-nums">₹{{ n(d.gold22PerG * 10) }}</p></div>
          <div class="rounded-xl bg-surface-2 p-2"><p class="text-[11px] text-muted">Silver · 1 kg</p><p class="font-bold tabular-nums">₹{{ n(d.silverPerKg) }}</p></div>
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" class="btn-ghost min-h-8 px-2.5 text-xs" (click)="use.emit(d)">Use this rate below</button>
          <span class="text-[11px] text-muted">Excludes 3% GST. International price \${{ d.spotUsd.gold }}/oz gold · ₹{{ d.usdInr }}/$ · incl. {{ d.dutyPct }}% import duty.</span>
        </div>
      } @else {
        <div class="mt-2 h-16 animate-pulse rounded-xl bg-surface-2"></div>
      }
    </div>
  `,
})
export class LiveMetals {
  readonly use = output<MetalPrices>();
  protected readonly data = signal<MetalPrices | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly ago = signal('just now');
  protected readonly stale = signal(false);

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      if (!browser) return;
      void this.load();
      const refresh = setInterval(() => document.visibilityState === 'visible' && this.load(), 60_000);
      const tick = setInterval(() => this.updateAgo(), 10_000);
      destroy.onDestroy(() => {
        clearInterval(refresh);
        clearInterval(tick);
      });
    });
  }

  private async load() {
    try {
      const r = await fetch('/api/metals');
      const j = (await r.json().catch(() => ({}))) as MetalPrices & { error?: string };
      if (!r.ok || j.error) throw new Error(j.error || 'Live prices are not available right now.');
      this.data.set(j);
      this.error.set(null);
      this.updateAgo();
    } catch (e) {
      if (!this.data()) this.error.set((e as Error).message || 'Live prices are not available right now.');
    }
  }

  private updateAgo() {
    const d = this.data();
    if (!d) return;
    const s = Math.max(0, Math.round((Date.now() - new Date(d.updatedAt).getTime()) / 1000));
    this.stale.set(s > 30 * 60); // markets closed / feed paused → no blinking
    this.ago.set(s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : new Date(d.updatedAt).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }));
  }

  protected n(v: number) {
    return INR.format(v);
  }
}
