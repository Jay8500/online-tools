import { Component, computed, signal } from '@angular/core';
import { TERMS, TERM_CATS, TermCat } from '../../core/tech-terms';
import { Icon } from '../../shared/icon';

/** Data size units (binary, as Windows/phones show them). */
const UNITS = [
  { u: 'Bit', v: '0 or 1 — the smallest unit' },
  { u: 'Byte', v: '8 bits (one letter of text)' },
  { u: '1 KB', v: '1,024 bytes' },
  { u: '1 MB', v: '1,024 KB ≈ 10 lakh bytes' },
  { u: '1 GB', v: '1,024 MB ≈ 107 crore bytes' },
  { u: '1 TB', v: '1,024 GB' },
  { u: '1 PB', v: '1,024 TB' },
];
const SIZE_UNITS: Record<string, number> = { MB: 1, GB: 1024 };

@Component({
  selector: 'app-tech-terms-tool',
  imports: [Icon],
  template: `
    <div class="relative">
      <label class="sr-only" for="tt-q">Search abbreviation</label>
      <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input id="tt-q" class="input pl-9" type="search" placeholder="CPU, RAM, URL, OTP, IMEI…" maxlength="40" [value]="q()" (input)="q.set(val($event))" />
    </div>
    <div class="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap" role="group" aria-label="Category">
      <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="!cat()" (click)="cat.set(null)">All ({{ total }})</button>
      @for (c of cats; track c) { <button type="button" class="chip min-h-8 shrink-0 text-xs" [attr.aria-pressed]="cat() === c" (click)="cat.set(cat() === c ? null : c)">{{ c }}</button> }
    </div>

    <p class="mt-3 mb-2 text-xs text-muted" aria-live="polite">{{ list().length }} terms</p>
    <ul class="grid gap-2 sm:grid-cols-2">
      @for (x of list(); track x.a; let i = $index) {
        <li class="animate-fade-up rounded-xl border border-line bg-surface p-3" [style.animation-delay.ms]="i < 12 ? i * 25 : 0">
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-lg font-extrabold text-brand">{{ x.a }}</p>
            <span class="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">{{ x.cat }}</span>
          </div>
          <p class="text-sm font-semibold">{{ x.full }}</p>
          <p class="text-xs text-muted">{{ x.meaning }}</p>
        </li>
      } @empty {
        <li class="rounded-xl border border-line px-3 py-4 text-center text-sm text-muted sm:col-span-2">No term found. Try a shorter word like “RAM” or “USB”.</li>
      }
    </ul>

    <section class="mt-6" aria-labelledby="calc-h">
      <h3 id="calc-h" class="mb-2 text-base font-bold">Calculations made simple</h3>
      <div class="grid gap-3 md:grid-cols-2">
        <div class="rounded-2xl border border-line p-3">
          <p class="mb-2 text-sm font-semibold">Data size ladder</p>
          <table class="w-full text-sm">
            <tbody class="divide-y divide-line">
              @for (u of units; track u.u) { <tr><td class="py-1 pr-2 font-semibold">{{ u.u }}</td><td class="py-1 text-muted">{{ u.v }}</td></tr> }
            </tbody>
          </table>
          <p class="mt-2 text-[11px] text-muted">Hard-disk makers count 1 GB = 1,000 MB, so a “1 TB” disk shows about 931 GB on your computer.</p>
        </div>
        <div class="rounded-2xl border border-line p-3">
          <p class="mb-2 text-sm font-semibold">How long will a download take?</p>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="label" for="dl-size">File size</label>
              <div class="flex gap-1">
                <input id="dl-size" class="input min-w-0" type="number" inputmode="decimal" min="0" [value]="size()" (input)="size.set(num($event))" />
                <select class="input w-20 shrink-0" aria-label="Size unit" (change)="sizeUnit.set(val($event))">
                  <option value="MB" [selected]="sizeUnit() === 'MB'">MB</option>
                  <option value="GB" [selected]="sizeUnit() === 'GB'">GB</option>
                </select>
              </div>
            </div>
            <div>
              <label class="label" for="dl-speed">Speed (Mbps)</label>
              <input id="dl-speed" class="input" type="number" inputmode="decimal" min="0" [value]="speed()" (input)="speed.set(num($event))" />
            </div>
          </div>
          @if (dl(); as d) {
            <p class="mt-3 text-2xl font-bold text-brand">{{ d.time }}</p>
            <p class="text-xs text-muted">{{ speed() }} Mbps = {{ d.mbs }} MB per second (divide Mbps by 8). Real speed is often 70–90% of the plan.</p>
          } @else {
            <p class="mt-3 text-xs text-rose-600" role="alert">Enter a file size and a speed above 0.</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class TechTermsTool {
  protected readonly cats = TERM_CATS;
  protected readonly total = TERMS.length;
  protected readonly units = UNITS;
  protected readonly q = signal('');
  protected readonly cat = signal<TermCat | null>(null);
  protected readonly size = signal<number | null>(2);
  protected readonly sizeUnit = signal('GB');
  protected readonly speed = signal<number | null>(50);

  protected readonly list = computed(() => {
    const q = this.q().trim().toLowerCase();
    const c = this.cat();
    const rows = TERMS.filter((x) => (!c || x.cat === c) && (!q || `${x.a} ${x.full} ${x.meaning}`.toLowerCase().includes(q)));
    // Exact abbreviation match first
    return q ? rows.sort((a, b) => +b.a.toLowerCase().startsWith(q) - +a.a.toLowerCase().startsWith(q)) : rows;
  });

  protected readonly dl = computed(() => {
    const s = this.size();
    const v = this.speed();
    if (!s || !v || s <= 0 || v <= 0) return null;
    const mb = s * SIZE_UNITS[this.sizeUnit()];
    const mbs = v / 8;
    const sec = mb / mbs;
    const time = sec < 60 ? `${Math.max(1, Math.round(sec))} seconds` : sec < 3600 ? `${Math.floor(sec / 60)} min ${Math.round(sec % 60)} sec` : `${Math.floor(sec / 3600)} h ${Math.round((sec % 3600) / 60)} min`;
    return { time, mbs: +mbs.toFixed(2) };
  });

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  protected num(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    return v === '' ? null : Number(v);
  }
}
