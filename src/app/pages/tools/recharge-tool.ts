import { Component, computed, signal } from '@angular/core';
import { Operator, PLANS, PLANS_CHECKED, RECHARGE_LINKS } from '../../core/plans';

const OPS: { id: Operator; color: string }[] = [
  { id: 'Jio', color: 'bg-blue-600' },
  { id: 'Airtel', color: 'bg-red-600' },
  { id: 'Vi', color: 'bg-fuchsia-600' },
  { id: 'BSNL', color: 'bg-orange-500' },
];
const VALIDITY = [
  { id: 'all', label: 'Any validity' },
  { id: 'month', label: '~1 month' },
  { id: '56', label: '56–70 days' },
  { id: '84', label: '84–98 days' },
  { id: 'year', label: '300+ days' },
];
const DATA = [
  { id: 'all', label: 'Any data' },
  { id: 'none', label: 'Calls only' },
  { id: '1.5', label: '1.5 GB/day' },
  { id: '2', label: '2 GB/day' },
  { id: '3', label: '3 GB+/day' },
  { id: 'ott', label: 'With OTT' },
];

@Component({
  selector: 'app-recharge-tool',
  template: `
    <div class="flex flex-wrap gap-1.5" role="group" aria-label="Operator">
      @for (o of ops; track o.id) {
        <button type="button" class="chip min-h-9" [attr.aria-pressed]="picked().includes(o.id)" (click)="toggle(o.id)"><span class="size-2.5 rounded-full" [class]="o.color" aria-hidden="true"></span> {{ o.id }}</button>
      }
    </div>
    <div class="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap" role="group" aria-label="Validity">
      @for (v of validity; track v.id) { <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="val() === v.id" (click)="val.set(v.id)">{{ v.label }}</button> }
    </div>
    <div class="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap" role="group" aria-label="Data">
      @for (d of dataOpts; track d.id) { <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="data() === d.id" (click)="data.set(d.id)">{{ d.label }}</button> }
    </div>
    <div class="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
      <span aria-live="polite">{{ list().length }} plans · sorted by {{ sort() === 'day' ? 'cost per day' : 'price' }}</span>
      <button type="button" class="underline" (click)="sort.set(sort() === 'day' ? 'price' : 'day')">Sort by {{ sort() === 'day' ? 'price' : 'cost per day' }}</button>
    </div>

    <ul class="mt-2 grid gap-2 sm:grid-cols-2">
      @for (p of list(); track p.op + p.price; let i = $index) {
        <li class="animate-fade-up relative overflow-hidden rounded-xl border bg-surface p-3" [class]="p.best ? 'border-green-500/60' : 'border-line'" [style.animation-delay.ms]="i < 10 ? i * 30 : 0">
          <span class="absolute inset-y-0 left-0 w-1" [class]="color(p.op)" aria-hidden="true"></span>
          <div class="flex items-start justify-between gap-2 pl-1.5">
            <div class="min-w-0">
              <p class="text-xs font-bold text-muted">{{ p.op }}@if (p.fiveG) { <span class="ml-1 rounded bg-brand/15 px-1 text-[10px] text-brand">5G</span> }</p>
              <p class="text-2xl font-extrabold tabular-nums">₹{{ p.price }}</p>
              <p class="text-sm font-semibold">{{ p.data }}</p>
              <p class="text-xs text-muted">{{ p.validity }}{{ p.calls ? ' · unlimited calls' : '' }}</p>
              @if (p.perks) { <p class="mt-1 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300">🎬 {{ p.perks }}</p> }
            </div>
            <div class="shrink-0 text-right">
              <p class="text-lg font-bold tabular-nums text-brand">₹{{ p.perDayCost }}</p>
              <p class="text-[10px] text-muted">per day</p>
              @if (p.monthly) { <p class="mt-1 text-[10px] text-muted">≈ ₹{{ p.monthly }}/month</p> }
              @if (p.best) { <p class="mt-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-300">Best value</p> }
            </div>
          </div>
        </li>
      } @empty {
        <li class="rounded-xl border border-line px-3 py-4 text-center text-sm text-muted sm:col-span-2">No plan matches. Try “Any validity” or another operator.</li>
      }
    </ul>

    <div class="mt-4 rounded-xl border border-line bg-surface-2 p-3 text-xs text-muted">
      <p>Prices from each operator’s official website, checked {{ checked }}. Airtel prices are for the AP & Telangana circle; Vi’s site showed the Maharashtra circle (AP/TS can differ slightly). Plans change often — confirm before paying.</p>
      <p class="mt-2 flex flex-wrap gap-2">
        @for (o of ops; track o.id) { <a class="btn-ghost min-h-8 text-xs" [href]="links[o.id]" target="_blank" rel="noopener">{{ o.id }} plans ↗</a> }
      </p>
    </div>
  `,
})
export class RechargeTool {
  protected readonly ops = OPS;
  protected readonly validity = VALIDITY;
  protected readonly dataOpts = DATA;
  protected readonly links = RECHARGE_LINKS;
  protected readonly checked = new Date(PLANS_CHECKED + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  protected readonly picked = signal<Operator[]>([]);
  protected readonly val = signal('all');
  protected readonly data = signal('all');
  protected readonly sort = signal<'day' | 'price'>('day');

  protected readonly list = computed(() => {
    const ops = this.picked();
    const v = this.val();
    const d = this.data();
    const rows = PLANS.filter((p) => !ops.length || ops.includes(p.op))
      .filter((p) => v === 'all' || (v === 'month' && p.days >= 22 && p.days <= 36) || (v === '56' && p.days >= 56 && p.days <= 77) || (v === '84' && p.days >= 84 && p.days <= 98) || (v === 'year' && p.days >= 300))
      .filter((p) => d === 'all' || (d === 'none' && p.perDay == null && /no data/i.test(p.data)) || (d === '1.5' && p.perDay === 1.5) || (d === '2' && p.perDay === 2) || (d === '3' && (p.perDay ?? 0) >= 3) || (d === 'ott' && !!p.perks && !/voice/i.test(p.perks)))
      .map((p) => ({ ...p, perDayCost: +(p.price / p.days).toFixed(1), monthly: p.days >= 50 ? Math.round((p.price / p.days) * 30) : 0, best: false }));
    // "Best value" = cheapest per day within the same data-per-day group
    const groups = new Map<string, number>();
    for (const r of rows) {
      const k = String(r.perDay ?? r.data);
      groups.set(k, Math.min(groups.get(k) ?? Infinity, r.perDayCost));
    }
    for (const r of rows) r.best = rows.filter((x) => String(x.perDay ?? x.data) === String(r.perDay ?? r.data)).length > 1 && r.perDayCost === groups.get(String(r.perDay ?? r.data));
    return rows.sort((a, b) => (this.sort() === 'day' ? a.perDayCost - b.perDayCost : a.price - b.price));
  });

  protected toggle(op: Operator) {
    this.picked.update((p) => (p.includes(op) ? p.filter((x) => x !== op) : [...p, op]));
  }
  protected color(op: Operator) {
    return OPS.find((o) => o.id === op)!.color;
  }
}
