import { Component, computed, signal } from '@angular/core';
import { OTT, PLANS, PLANS_CHECKED } from '../../core/plans';

@Component({
  selector: 'app-ott-tool',
  template: `
    <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Show">
      <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="!telugu()" (click)="telugu.set(false)">All apps</button>
      <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="telugu()" (click)="telugu.set(true)">Telugu-first apps</button>
      <label class="ml-auto flex items-center gap-2 text-xs text-muted"><input type="checkbox" class="size-4 accent-[var(--brand)]" [checked]="yearly()" (change)="yearly.set(!yearly())" /> Show cost per month</label>
    </div>

    <div class="mt-3 grid gap-3 md:grid-cols-2">
      @for (s of list(); track s.id; let i = $index) {
        <section class="animate-fade-up rounded-2xl border border-line bg-surface p-3" [style.animation-delay.ms]="i * 50" [attr.aria-label]="s.name">
          <div class="mb-2 flex items-baseline justify-between gap-2">
            <h3 class="text-lg font-extrabold">{{ s.name }}</h3>
            <span class="text-[11px] text-muted">{{ s.lang }}</span>
          </div>
          @if (s.plans.length) {
            <ul class="divide-y divide-line">
              @for (p of s.plans; track p.name + p.months) {
                <li class="flex items-center justify-between gap-2 py-1.5">
                  <span class="min-w-0"><span class="block text-sm font-semibold">{{ p.name }} <span class="text-xs font-normal text-muted">· {{ per(p.months) }}</span></span><span class="block text-[11px] text-muted">{{ p.note }}</span></span>
                  <span class="shrink-0 text-right tabular-nums"><b>₹{{ p.price.toLocaleString('en-IN') }}</b>@if (yearly() && p.months > 1) { <span class="block text-[10px] text-green-700 dark:text-green-300">≈ ₹{{ month(p.price, p.months) }}/month</span> }</span>
                </li>
              }
            </ul>
            @if (s.tip) { <p class="mt-1 text-[11px] text-muted">{{ s.tip }}</p> }
          } @else {
            <p class="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">{{ s.noPrice }}</p>
          }
          @if (free(s.name); as f) { <p class="mt-2 rounded-lg bg-fuchsia-500/10 px-2 py-1 text-[11px] text-fuchsia-800 dark:text-fuchsia-200">💡 Free with: {{ f }}</p> }
          <a class="mt-2 inline-block text-xs font-semibold text-brand underline" [href]="s.url" target="_blank" rel="noopener">Official {{ s.name }} prices ↗</a>
        </section>
      }
    </div>
    <p class="mt-3 text-xs text-muted">Prices from each app’s official website (India), checked {{ checked }}. Offers and prices change — confirm in the app before paying.</p>
  `,
})
export class OttTool {
  protected readonly telugu = signal(false);
  protected readonly yearly = signal(true);
  protected readonly checked = new Date(PLANS_CHECKED + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  protected readonly list = computed(() => (this.telugu() ? OTT.filter((s) => /telugu/i.test(s.lang)) : OTT));

  /** Recharge plans (from our recharge page data) that include this OTT. */
  protected free(name: string): string {
    const key = name === 'Amazon Prime' ? /prime/i : name === 'JioHotstar' ? /hotstar/i : name === 'SonyLIV' ? /sonyliv/i : new RegExp(name, 'i');
    const hits = PLANS.filter((p) => p.perks && key.test(p.perks)).map((p) => `${p.op} ₹${p.price}`);
    return hits.slice(0, 4).join(', ');
  }
  protected per(m: number) {
    return m === 1 ? 'monthly' : m === 3 ? '3 months' : m === 12 ? 'yearly' : `${m} months`;
  }
  protected month(price: number, months: number) {
    return Math.round(price / months);
  }
}
