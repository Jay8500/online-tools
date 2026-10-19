import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { REF_PRICES } from '../../core/grocery-data';
import { Icon } from '../../shared/icon';

interface Rec {
  d: string;
  m: string;
  c: string;
  v: string;
  date: string;
  min: number;
  max: number;
  modal: number;
}

const STATES = ['Telangana', 'Andhra Pradesh', 'Karnataka', 'Tamil Nadu', 'Maharashtra'];
const kg = (perQuintal: number) => perQuintal / 100;

@Component({
  selector: 'app-grocery-tool',
  imports: [Icon],
  template: `
    <div class="flex flex-wrap gap-1.5" role="group" aria-label="State">
      @for (s of states; track s) { <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="state() === s" (click)="pickState(s)">{{ s }}</button> }
    </div>
    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <div>
        <label class="label" for="g-district">District</label>
        <select id="g-district" class="input" (change)="district.set(val($event))" [disabled]="!districts().length">
          <option value="" [selected]="!district()">All districts</option>
          @for (d of districts(); track d) { <option [value]="d" [selected]="d === district()">{{ d }}</option> }
        </select>
      </div>
      <div class="relative">
        <label class="label" for="g-q">Find an item</label>
        <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute bottom-3 left-3 text-muted" />
        <input id="g-q" class="input pl-9" type="search" placeholder="Tomato, onion, rice…" [value]="q()" (input)="q.set(val($event))" />
      </div>
    </div>

    <div class="mt-4" aria-live="polite">
      @if (loading()) {
        <div class="h-40 animate-pulse rounded-2xl bg-surface-2"></div>
      } @else if (off()) {
        <p class="rounded-xl border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm">Live market prices are being switched on. The milk and egg prices below are already available.</p>
      } @else if (error()) {
        <p class="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600" role="alert">{{ error() }}</p>
      } @else {
        <p class="mb-2 flex items-center gap-2 text-xs text-muted">
          <span class="relative flex size-2"><span class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75"></span><span class="relative inline-flex size-2 rounded-full bg-red-600"></span></span>
          {{ rows().length }} prices · {{ state() }} · market date {{ date() }} · ₹ per kg (modal price, range in brackets)
        </p>
        <div class="max-h-[32rem] overflow-auto rounded-2xl border border-line">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-surface-2 text-left text-xs text-muted"><tr><th class="px-3 py-2">Item</th><th class="px-3 py-2">Market</th><th class="px-3 py-2 text-right">₹/kg</th></tr></thead>
            <tbody class="divide-y divide-line bg-surface">
              @for (r of rows(); track $index) {
                <tr>
                  <td class="px-3 py-1.5"><span class="font-medium">{{ r.c }}</span>@if (r.v && r.v !== r.c && r.v !== 'Other') { <span class="block text-[11px] text-muted">{{ r.v }}</span> }</td>
                  <td class="px-3 py-1.5 text-xs">{{ r.m }}<span class="block text-[11px] text-muted">{{ r.d }}</span></td>
                  <td class="px-3 py-1.5 text-right tabular-nums"><b>₹{{ n(r.modal) }}</b>@if (r.min !== r.max) { <span class="block text-[11px] text-muted">({{ n(r.min) }}–{{ n(r.max) }})</span> }</td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="px-3 py-4 text-center text-muted">No match. Try another item or “All districts”.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <section class="mt-5" aria-labelledby="ref-h">
      <h3 id="ref-h" class="mb-2 text-sm font-bold">Milk & eggs in Hyderabad</h3>
      <div class="grid gap-2 sm:grid-cols-2">
        @for (p of ref; track p.item) {
          <div class="rounded-xl border border-line bg-surface p-3">
            <p class="text-sm font-semibold">{{ p.item }}</p>
            <p class="text-lg font-bold tabular-nums">₹{{ p.price }} <span class="text-xs font-normal text-muted">/ {{ p.pack }}</span>
              @if (p.prev && p.prev !== p.price) { <span class="text-xs font-semibold" [class]="p.price > p.prev ? 'text-red-600' : 'text-green-600'">{{ p.price > p.prev ? '▲' : '▼' }} ₹{{ abs(p.price - p.prev) }} on {{ day(p.changedOn!) }}</span> }
            </p>
            <p class="text-[11px] text-muted">Source: <a [href]="p.url" target="_blank" rel="noopener" class="underline">{{ p.source }}</a> · checked {{ day(p.checked) }}</p>
          </div>
        }
      </div>
      <p class="mt-2 text-xs text-muted">NECC egg rate is the wholesale benchmark; shops usually add ₹0.50–₹1.50 per egg.</p>
    </section>
  `,
})
export class GroceryTool {
  protected readonly states = STATES;
  protected readonly ref = REF_PRICES;
  protected readonly state = signal('Telangana');
  protected readonly district = signal('Hyderabad');
  protected readonly q = signal('');
  private readonly data = signal<Rec[]>([]);
  protected readonly date = signal('');
  protected readonly loading = signal(true);
  protected readonly off = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly districts = computed(() => [...new Set(this.data().map((r) => r.d))].sort());
  protected readonly rows = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.data()
      .filter((r) => !this.district() || r.d === this.district())
      .filter((r) => !q || `${r.c} ${r.v}`.toLowerCase().includes(q))
      .sort((a, b) => a.c.localeCompare(b.c) || a.modal - b.modal);
  });

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => browser && this.load());
  }

  protected pickState(s: string) {
    if (s === this.state()) return;
    this.state.set(s);
    this.district.set('');
    void this.load();
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const r = await fetch(`/api/mandi?state=${encodeURIComponent(this.state())}`);
      const j = (await r.json().catch(() => ({}))) as { records?: Rec[]; date?: string; error?: string };
      if (j.error === 'not-configured' || (r.status === 404 && !j.error)) this.off.set(true);
      else if (!r.ok || j.error) this.error.set(j.error || 'Could not load prices. Please try again.');
      else {
        this.off.set(false);
        this.data.set(j.records ?? []);
        this.date.set(j.date ?? '');
        if (this.district() && !this.districts().includes(this.district())) this.district.set('');
      }
    } catch {
      this.error.set('No internet connection. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  protected n(perQuintal: number) {
    const v = kg(perQuintal);
    return v >= 100 ? Math.round(v).toLocaleString('en-IN') : v.toLocaleString('en-IN', { maximumFractionDigits: 1 });
  }
  protected abs(n: number) {
    return Math.abs(n);
  }
  protected day(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
