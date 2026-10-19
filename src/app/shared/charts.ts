import { Component, computed, input } from '@angular/core';
import { rupees } from '../core/finance';

export interface Slice {
  label: string;
  value: number;
  /** CSS colour (use var(--brand) etc. so dark mode works) */
  color: string;
}

/** Two/three-part donut with legend. Pure SVG, no chart library. */
@Component({
  selector: 'app-donut',
  template: `
    <div class="flex items-center gap-4">
      <svg viewBox="0 0 42 42" class="size-28 shrink-0 -rotate-90" role="img" [attr.aria-label]="aria()">
        <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--surface-2)" stroke-width="6" />
        @for (a of arcs(); track a.label) {
          <circle cx="21" cy="21" r="15.915" fill="none" [attr.stroke]="a.color" stroke-width="6"
                  [attr.stroke-dasharray]="a.dash" [attr.stroke-dashoffset]="a.offset" />
        }
      </svg>
      <ul class="min-w-0 space-y-1.5 text-sm">
        @for (s of slices(); track s.label) {
          <li class="flex items-start gap-2">
            <span class="mt-1.5 size-2.5 shrink-0 rounded-full" [style.background]="s.color"></span>
            <span class="min-w-0"><span class="block text-xs text-muted">{{ s.label }}</span><span class="font-semibold tabular-nums">{{ money(s.value) }}</span></span>
          </li>
        }
      </ul>
    </div>
  `,
})
export class Donut {
  readonly slices = input.required<Slice[]>();
  protected readonly arcs = computed(() => {
    const list = this.slices();
    const total = list.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
    let acc = 0;
    return list.map((s) => {
      const pct = (Math.max(0, s.value) / total) * 100;
      const arc = { label: s.label, color: s.color, dash: `${pct} ${100 - pct}`, offset: -acc };
      acc += pct;
      return arc;
    });
  });
  protected readonly aria = computed(() => this.slices().map((s) => `${s.label} ${rupees(s.value)}`).join(', '));
  protected money(n: number) {
    return rupees(n);
  }
}

export interface Bar {
  label: string;
  /** Bottom part (e.g. invested / principal) */
  a: number;
  /** Top part (e.g. returns / interest) */
  b: number;
}

/** Stacked yearly bars (CSS only). Shows at most ~30 bars; thins labels on small screens. */
@Component({
  selector: 'app-stack-bars',
  template: `
    <div>
      <div class="flex h-36 items-end gap-[2px] sm:gap-1" role="img" [attr.aria-label]="aLabel() + ' and ' + bLabel() + ' by year'">
        @for (bar of bars(); track bar.label; let i = $index) {
          <div class="flex h-full min-w-0 flex-1 flex-col justify-end" [title]="bar.label + ': ' + money(bar.a) + ' + ' + money(bar.b)">
            <div class="w-full rounded-t-sm" [style.height.%]="pct(bar.b)" [style.background]="bColor()"></div>
            <div class="w-full" [style.height.%]="pct(bar.a)" [style.background]="aColor()"></div>
          </div>
        }
      </div>
      <div class="mt-1 flex gap-[2px] sm:gap-1">
        @for (bar of bars(); track bar.label; let i = $index) {
          <span class="min-w-0 flex-1 text-center text-[10px] text-muted">{{ showLabel(i) ? bar.label : '' }}</span>
        }
      </div>
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm" [style.background]="aColor()"></span>{{ aLabel() }}</span>
        <span class="flex items-center gap-1.5"><span class="size-2.5 rounded-sm" [style.background]="bColor()"></span>{{ bLabel() }}</span>
      </div>
    </div>
  `,
})
export class StackBars {
  readonly bars = input.required<Bar[]>();
  readonly aLabel = input('Invested');
  readonly bLabel = input('Returns');
  readonly aColor = input('var(--brand)');
  readonly bColor = input('#f59e0b');
  private readonly max = computed(() => Math.max(1, ...this.bars().map((b) => b.a + b.b)));
  protected pct(v: number) {
    return (Math.max(0, v) / this.max()) * 100;
  }
  protected showLabel(i: number) {
    const n = this.bars().length;
    const every = n <= 10 ? 1 : n <= 20 ? 2 : 5;
    return i === 0 || (i + 1) % every === 0;
  }
  protected money(n: number) {
    return rupees(n);
  }
}
