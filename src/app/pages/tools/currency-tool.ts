import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { Icon } from '../../shared/icon';

interface Fx {
  updated: number;
  rates: Record<string, number>;
}

/** Currencies offered, Gulf first (most remittances to Telangana/AP come from there). */
const CUR: { code: string; name: string; flag: string }[] = [
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  { code: 'OMR', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'BHD', name: 'Bahraini Dinar', flag: '🇧🇭' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'LKR', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  { code: 'NPR', name: 'Nepalese Rupee', flag: '🇳🇵' },
  { code: 'BDT', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷' },
];
const QUICK = ['USD', 'AED', 'SAR', 'GBP', 'EUR', 'KWD', 'CAD', 'AUD'];

/** What banks and cards usually add over the market rate (typical published figures; your bank may differ). */
const WAYS = [
  { id: 'mid', label: 'Market rate', pct: 0, note: 'The rate you see on Google — no fees.' },
  { id: 'forex', label: 'Forex card / app', pct: 1, note: 'Travel forex cards and remittance apps usually add 0.5–1.5%.' },
  { id: 'bank', label: 'Bank transfer', pct: 2, note: 'Banks usually add 1–3% on wire transfers, plus a fixed fee.' },
  { id: 'card', label: 'Debit / credit card abroad', pct: 3.5 * 1.18, note: 'Most Indian cards charge 3.5% markup + 18% GST on it ≈ 4.13%.' },
];
const LAST = 'fx-pair';

@Component({
  selector: 'app-currency-tool',
  imports: [Icon],
  template: `
    <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
      <div>
        <label class="label" for="fx-amt">Amount</label>
        <div class="flex gap-2" [class.field-invalid]="!!amtErr()">
          <input id="fx-amt" class="input min-w-0 text-lg font-semibold" type="text" inputmode="decimal" autocomplete="off" [value]="amountText()" (input)="amountText.set(val($event))" />
          <select class="input w-28 shrink-0" aria-label="From currency" (change)="from.set(val($event)); save()">
            @for (c of cur; track c.code) { <option [value]="c.code" [selected]="c.code === from()">{{ c.flag }} {{ c.code }}</option> }
          </select>
        </div>
        @if (amtErr()) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ amtErr() }}</p> }
      </div>
      <button type="button" class="btn-icon justify-self-center" (click)="swap()" aria-label="Swap currencies"><svg lucideIcon="refresh-ccw" [size]="16" /></button>
      <div>
        <label class="label" for="fx-to">Convert to</label>
        <select id="fx-to" class="input" (change)="to.set(val($event)); save()">
          @for (c of cur; track c.code) { <option [value]="c.code" [selected]="c.code === to()">{{ c.flag }} {{ c.code }} — {{ c.name }}</option> }
        </select>
      </div>
    </div>
    <div class="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Popular currencies to rupees">
      @for (q of quick; track q) { <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="from() === q && to() === 'INR'" (click)="pair(q, 'INR')">{{ flag(q) }} {{ q }} → ₹</button> }
    </div>

    <div class="mt-4" aria-live="polite">
      @if (!fx() && !err()) {
        <div class="h-36 animate-pulse rounded-2xl bg-surface-2"></div>
      } @else if (!fx()) {
        <p class="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600" role="alert">{{ err() }}</p>
      } @else {
        <div class="rounded-2xl border border-line bg-gradient-to-br from-brand/10 to-transparent p-4">
          <p class="text-sm text-muted">{{ fmt(amount() ?? 0, from()) }} {{ from() }} =</p>
          <p class="text-3xl font-extrabold tabular-nums text-brand sm:text-4xl">{{ fmt(result(), to()) }} <span class="text-lg">{{ to() }}</span></p>
          <p class="mt-1 text-sm">1 {{ from() }} = <b>{{ fmt(rate(), to(), 4) }} {{ to() }}</b> · 1 {{ to() }} = {{ fmt(1 / rate(), from(), 4) }} {{ from() }}</p>
          @if (words()) { <p class="mt-1 text-xs text-muted">≈ {{ words() }}</p> }
          <p class="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
            <span class="relative flex size-1.5" aria-hidden="true"><span class="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75"></span><span class="relative inline-flex size-1.5 rounded-full bg-green-600"></span></span>
            Market rate updated {{ updated() }}{{ stale() ? ' (saved — you’re offline)' : '' }}
          </p>
        </div>

        <h3 class="mt-4 mb-2 text-sm font-bold">What you’ll actually get</h3>
        <div class="grid gap-2 sm:grid-cols-2">
          @for (w of ways; track w.id) {
            <div class="rounded-xl border border-line bg-surface p-3">
              <p class="flex items-baseline justify-between gap-2 text-sm font-semibold">{{ w.label }} <span class="text-xs font-normal text-muted">{{ w.pct ? '−' + pctText(w.pct) + '%' : 'no markup' }}</span></p>
              <p class="text-lg font-bold tabular-nums">{{ fmt(result() * (1 - w.pct / 100), to()) }} {{ to() }}</p>
              <p class="text-[11px] text-muted">{{ w.note }}</p>
            </div>
          }
        </div>

        <h3 class="mt-4 mb-2 text-sm font-bold">Quick table</h3>
        <div class="overflow-hidden rounded-2xl border border-line">
          <table class="w-full text-sm">
            <thead class="bg-surface-2 text-left text-xs text-muted"><tr><th class="px-3 py-2">{{ from() }}</th><th class="px-3 py-2 text-right">{{ to() }}</th></tr></thead>
            <tbody class="divide-y divide-line">
              @for (n of steps; track n) { <tr><td class="px-3 py-1.5 tabular-nums">{{ fmt(n, from()) }}</td><td class="px-3 py-1.5 text-right font-semibold tabular-nums">{{ fmt(n * rate(), to()) }}</td></tr> }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class CurrencyTool {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly cur = CUR;
  protected readonly quick = QUICK;
  protected readonly ways = WAYS;
  protected readonly steps = [1, 5, 10, 50, 100, 500, 1000, 5000];
  protected readonly amountText = signal('100');
  protected readonly from = signal('USD');
  protected readonly to = signal('INR');
  protected readonly fx = signal<Fx | null>(null);
  protected readonly err = signal<string | null>(null);
  protected readonly stale = signal(false);

  protected readonly amount = computed(() => {
    const t = this.amountText().replace(/,/g, '').trim();
    if (!/^\d{0,12}(\.\d{0,4})?$/.test(t) || t === '' || t === '.') return null;
    return Number(t);
  });
  protected readonly amtErr = computed(() => (this.amount() == null && this.amountText().trim() !== '' ? 'Enter a number, like 250 or 1,500.50' : null));
  protected readonly rate = computed(() => {
    const r = this.fx()?.rates;
    if (!r?.[this.from()] || !r[this.to()]) return 0;
    return r[this.to()] / r[this.from()];
  });
  protected readonly result = computed(() => (this.amount() ?? 0) * this.rate());
  protected readonly updated = computed(() => {
    const u = this.fx()?.updated;
    return u ? new Date(u).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
  });
  /** Rupee results in lakh/crore words, e.g. "₹1.2 lakh". */
  protected readonly words = computed(() => {
    if (this.to() !== 'INR') return '';
    const v = this.result();
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} crore`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} lakh`;
    if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)} thousand`;
    return '';
  });

  constructor() {
    afterNextRender(async () => {
      try {
        const p = JSON.parse(localStorage.getItem(LAST) || 'null') as [string, string] | null;
        if (p && CUR.some((c) => c.code === p[0]) && CUR.some((c) => c.code === p[1])) (this.from.set(p[0]), this.to.set(p[1]));
      } catch {
        /* defaults */
      }
      await this.load();
    });
  }

  private async load() {
    try {
      const r = await fetch('/api/fx');
      const j = (await r.json()) as Fx & { error?: string };
      if (!r.ok || j.error || !j.rates?.['INR']) throw new Error(j.error);
      this.fx.set(j);
      try {
        localStorage.setItem('fx-cache', JSON.stringify(j));
      } catch {
        /* fine */
      }
    } catch {
      // Offline or busy: last rates saved on this device, clearly marked
      try {
        const c = JSON.parse(localStorage.getItem('fx-cache') || 'null') as Fx | null;
        if (c?.rates) return (this.fx.set(c), this.stale.set(true));
      } catch {
        /* none */
      }
      this.err.set('Couldn’t load today’s rates. Check your internet and try again.');
    }
  }

  protected pair(f: string, t: string) {
    this.from.set(f);
    this.to.set(t);
    this.save();
  }
  protected swap() {
    this.pair(this.to(), this.from());
  }
  protected save() {
    try {
      localStorage.setItem(LAST, JSON.stringify([this.from(), this.to()]));
    } catch {
      /* fine */
    }
  }
  protected pctText(p: number) {
    return String(+p.toFixed(2));
  }
  protected flag(code: string) {
    return CUR.find((c) => c.code === code)?.flag ?? '';
  }
  protected fmt(n: number, code: string, max = 2) {
    if (!Number.isFinite(n)) return '—';
    const digits = n !== 0 && Math.abs(n) < 1 ? Math.max(max, 4) : max;
    return n.toLocaleString(code === 'INR' ? 'en-IN' : 'en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  }
  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
}
