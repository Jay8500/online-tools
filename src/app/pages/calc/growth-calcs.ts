import { Component, computed, input, linkedSignal, signal, viewChildren } from '@angular/core';
import { Compounding, PPF_MAX, PPF_MIN, PPF_RATE, emi, fd, inWords, lumpsum, ppf, rupees, sip } from '../../core/finance';
import { Bar, Donut, StackBars } from '../../shared/charts';
import { NumField } from '../../shared/num-field';

/** Shown above results while a field holds an invalid value. */
const STALE = `@if (invalid()) { <p class="mb-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600" role="alert">Fix the highlighted field — results show the last valid numbers.</p> }`;

// ---------------- EMI ----------------
@Component({
  selector: 'app-emi-calc',
  imports: [NumField, Donut, StackBars],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <app-num-field label="Loan amount" prefix="₹" [(value)]="amount" [min]="10000" [max]="100000000" [sliderMax]="sliderMax()" [step]="10000" [rupeeWords]="true" />
        <app-num-field label="Interest rate (yearly)" suffix="%" [(value)]="rate" [min]="1" [max]="36" [step]="0.05" />
        <app-num-field label="Tenure" suffix="years" [(value)]="years" [min]="1" [max]="30" [step]="1" />
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">Monthly EMI</p>
          <p class="text-3xl font-bold text-brand tabular-nums">{{ money(r().emi) }}</p>
          <div class="mt-3"><app-donut [slices]="slices()" /></div>
          <p class="mt-3 border-t border-line pt-2 text-sm">Total payment <strong class="tabular-nums">{{ money(r().totalPayment) }}</strong> ({{ words(r().totalPayment) }})</p>
        </div>
      </div>
    </div>
    <details class="mt-4 rounded-2xl border border-line bg-surface p-4">
      <summary class="cursor-pointer text-sm font-semibold">Year-wise repayment schedule</summary>
      <div class="mt-3"><app-stack-bars [bars]="bars()" aLabel="Principal" bLabel="Interest" /></div>
      <div class="mt-3 max-h-80 overflow-auto">
        <table class="w-full text-right text-sm tabular-nums">
          <thead class="sticky top-0 bg-surface text-xs text-muted"><tr><th class="py-1 text-left">Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead>
          <tbody class="divide-y divide-line">
            @for (y of r().years; track y.year) {
              <tr><td class="py-1 text-left">{{ y.year }}</td><td>{{ money(y.principal) }}</td><td>{{ money(y.interest) }}</td><td>{{ money(y.balance) }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </details>
  `,
})
export class EmiCalc {
  readonly defaults = input.required<{ amount: number; rate: number; years: number }>();
  protected readonly amount = linkedSignal(() => this.defaults().amount);
  protected readonly rate = linkedSignal(() => this.defaults().rate);
  protected readonly years = linkedSignal(() => this.defaults().years);
  protected readonly sliderMax = computed(() => Math.max(10000000, this.defaults().amount * 4));
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly r = computed(() => emi(this.amount(), this.rate(), Math.round(this.years() * 12)));
  protected readonly slices = computed(() => [
    { label: 'Principal', value: this.amount(), color: 'var(--brand)' },
    { label: 'Total interest', value: this.r().totalInterest, color: '#f59e0b' },
  ]);
  protected readonly bars = computed<Bar[]>(() => this.r().years.map((y) => ({ label: String(y.year), a: y.principal, b: y.interest })));
  protected money = rupees;
  protected words = inWords;
}

// ---------------- SIP / lumpsum ----------------
@Component({
  selector: 'app-growth-calc',
  imports: [NumField, Donut, StackBars],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        @if (mode() === 'sip') {
          <app-num-field label="Monthly investment" prefix="₹" [(value)]="amount" [min]="100" [max]="10000000" [sliderMax]="200000" [step]="500" [rupeeWords]="true" />
        } @else {
          <app-num-field label="One-time investment" prefix="₹" [(value)]="amount" [min]="1000" [max]="1000000000" [sliderMax]="10000000" [step]="1000" [rupeeWords]="true" />
        }
        <app-num-field label="Expected return (yearly)" suffix="%" [(value)]="rate" [min]="1" [max]="30" [step]="0.5" />
        <app-num-field label="Time period" suffix="years" [(value)]="years" [min]="1" [max]="40" [step]="1" />
        @if (mode() === 'sip') {
          <app-num-field label="Yearly step-up (optional)" suffix="%" [(value)]="stepUp" [min]="0" [max]="50" [step]="1" hint="Increase the SIP every year, e.g. 10% with your salary hike." />
        }
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">Estimated value after {{ years() }} years</p>
          <p class="text-3xl font-bold text-brand tabular-nums">{{ money(r().value) }}</p>
          <p class="text-sm text-muted">{{ words(r().value) }}</p>
          <div class="mt-3"><app-donut [slices]="slices()" /></div>
        </div>
      </div>
    </div>
    <div class="mt-4 rounded-2xl border border-line bg-surface p-4">
      <p class="mb-2 text-sm font-semibold">Growth by year</p>
      <app-stack-bars [bars]="bars()" aLabel="Invested" bLabel="Estimated returns" />
    </div>
  `,
})
export class GrowthCalc {
  readonly mode = input<'sip' | 'lumpsum'>('sip');
  protected readonly amount = linkedSignal(() => (this.mode() === 'sip' ? 5000 : 100000));
  protected readonly rate = signal(12);
  protected readonly years = signal(10);
  protected readonly stepUp = signal(0);
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly r = computed(() =>
    this.mode() === 'sip' ? sip(this.amount(), this.rate(), this.years(), this.stepUp()) : lumpsum(this.amount(), this.rate(), this.years()),
  );
  protected readonly slices = computed(() => [
    { label: 'Invested', value: this.r().invested, color: 'var(--brand)' },
    { label: 'Estimated returns', value: this.r().gain, color: '#f59e0b' },
  ]);
  protected readonly bars = computed<Bar[]>(() => this.r().years.map((y) => ({ label: String(y.year), a: y.invested, b: y.value - y.invested })));
  protected money = rupees;
  protected words = inWords;
}

// ---------------- FD ----------------
@Component({
  selector: 'app-fd-calc',
  imports: [NumField, Donut],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <app-num-field label="Deposit amount" prefix="₹" [(value)]="amount" [min]="1000" [max]="1000000000" [sliderMax]="10000000" [step]="1000" [rupeeWords]="true" />
        <app-num-field label="Interest rate (yearly)" suffix="%" [(value)]="rate" [min]="1" [max]="15" [step]="0.05" />
        <div class="grid grid-cols-2 gap-3">
          <app-num-field label="Years" suffix="yr" [(value)]="years" [min]="0" [max]="10" [step]="1" [slider]="false" />
          <app-num-field label="Months" suffix="mo" [(value)]="months" [min]="0" [max]="11" [step]="1" [slider]="false" />
        </div>
        <div>
          <label class="label" for="fd-comp">Interest compounded</label>
          <select id="fd-comp" class="input" [value]="perYear()" (change)="setPerYear($event)">
            <option value="4">Quarterly (most banks)</option>
            <option value="12">Monthly</option>
            <option value="2">Half-yearly</option>
            <option value="1">Yearly</option>
          </select>
        </div>
      </div>
      <div>
        ${STALE}
        @if (tenureMonths() < 1) {
          <p class="mb-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600" role="alert">Tenure must be at least 1 month.</p>
        }
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">Maturity amount</p>
          <p class="text-3xl font-bold text-brand tabular-nums">{{ money(r().value) }}</p>
          <p class="text-sm text-muted">{{ words(r().value) }}</p>
          <div class="mt-3"><app-donut [slices]="slices()" /></div>
        </div>
      </div>
    </div>
  `,
})
export class FdCalc {
  protected readonly amount = signal(100000);
  protected readonly rate = signal(7);
  protected readonly years = signal(5);
  protected readonly months = signal(0);
  protected readonly perYear = signal<Compounding>(4);
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly tenureMonths = computed(() => this.years() * 12 + this.months());
  protected readonly r = computed(() => fd(this.amount(), this.rate(), Math.max(1, this.tenureMonths()), this.perYear()));
  protected readonly slices = computed(() => [
    { label: 'Deposit', value: this.amount(), color: 'var(--brand)' },
    { label: 'Interest earned', value: this.r().gain, color: '#f59e0b' },
  ]);
  protected setPerYear(e: Event) {
    this.perYear.set(Number((e.target as HTMLSelectElement).value) as Compounding);
  }
  protected money = rupees;
  protected words = inWords;
}

// ---------------- PPF ----------------
@Component({
  selector: 'app-ppf-calc',
  imports: [NumField, Donut, StackBars],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <app-num-field label="Yearly deposit" prefix="₹" [(value)]="amount" [min]="min" [max]="max" [step]="500" [rupeeWords]="true" hint="₹500 to ₹1.5 lakh per financial year." />
        <app-num-field label="Interest rate" suffix="%" [(value)]="rate" [min]="1" [max]="15" [step]="0.05" [slider]="false" hint="Current rate {{ current }}% (Oct–Dec 2026), reviewed every quarter." />
        <div>
          <label class="label" for="ppf-years">Duration</label>
          <select id="ppf-years" class="input" [value]="years()" (change)="setYears($event)">
            @for (y of yearOptions; track y) { <option [value]="y" [selected]="y === years()">{{ y }} years{{ y === 15 ? ' (maturity)' : ' (extended)' }}</option> }
          </select>
        </div>
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">Maturity value (tax-free)</p>
          <p class="text-3xl font-bold text-brand tabular-nums">{{ money(r().value) }}</p>
          <p class="text-sm text-muted">{{ words(r().value) }}</p>
          <div class="mt-3"><app-donut [slices]="slices()" /></div>
        </div>
      </div>
    </div>
    <div class="mt-4 rounded-2xl border border-line bg-surface p-4">
      <p class="mb-2 text-sm font-semibold">Balance by year</p>
      <app-stack-bars [bars]="bars()" aLabel="Deposited" bLabel="Interest" />
    </div>
  `,
})
export class PpfCalc {
  protected readonly min = PPF_MIN;
  protected readonly max = PPF_MAX;
  protected readonly current = PPF_RATE;
  protected readonly yearOptions = [15, 20, 25, 30, 35, 40, 45, 50];
  protected readonly amount = signal(150000);
  protected readonly rate = signal(PPF_RATE);
  protected readonly years = signal(15);
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly r = computed(() => ppf(this.amount(), this.rate(), this.years()));
  protected readonly slices = computed(() => [
    { label: 'Total deposited', value: this.r().invested, color: 'var(--brand)' },
    { label: 'Interest earned', value: this.r().gain, color: '#f59e0b' },
  ]);
  protected readonly bars = computed<Bar[]>(() => this.r().years.map((y) => ({ label: String(y.year), a: y.invested, b: y.value - y.invested })));
  protected setYears(e: Event) {
    this.years.set(Number((e.target as HTMLSelectElement).value));
  }
  protected money = rupees;
  protected words = inWords;
}
