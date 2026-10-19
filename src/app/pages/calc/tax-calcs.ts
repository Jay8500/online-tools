import { Component, computed, signal, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgeGroup, GST_RATES, HRA_METROS, Regime, TaxResult, gst, hra, incomeTax, inWords, rupees, salary } from '../../core/finance';
import { Donut } from '../../shared/charts';
import { NumField } from '../../shared/num-field';

const STALE = `@if (invalid()) { <p class="mb-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600" role="alert">Fix the highlighted field — results show the last valid numbers.</p> }`;

/** Segmented two-option toggle styles */
const SEG = 'flex rounded-xl border border-line bg-surface-2 p-1 text-sm font-semibold';
const SEG_BTN = 'flex-1 rounded-lg px-3 py-1.5 transition';

// ---------------- Income tax: old vs new ----------------
@Component({
  selector: 'app-tax-calc',
  imports: [NumField, RouterLink],
  template: `
    <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div class="space-y-4">
        <app-num-field label="Total yearly income" prefix="₹" [(value)]="income" [min]="0" [max]="1000000000" [sliderMax]="5000000" [step]="10000" [rupeeWords]="true"
                       hint="Salary (gross, before deductions) + interest + other income." />
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label class="flex items-center gap-2 text-sm font-medium"><input type="checkbox" class="size-4 accent-brand" [checked]="salaried()" (change)="salaried.set(!salaried())" /> Salaried / pensioner</label>
          <label class="flex items-center gap-2 text-sm"><span class="text-muted">Age</span>
            <select class="input w-auto py-1.5" [value]="age()" (change)="setAge($event)">
              <option value="below60">Below 60</option><option value="60to80">60–80</option><option value="above80">80+</option>
            </select>
          </label>
        </div>
        <details class="rounded-2xl border border-line p-3">
          <summary class="cursor-pointer text-sm font-semibold">Deductions (old regime only) <span class="font-normal text-muted">· {{ money(deductionTotal()) }} entered</span></summary>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <app-num-field label="80C (PF, PPF, ELSS, LIC…)" prefix="₹" [(value)]="c80" [min]="0" [max]="150000" [step]="5000" [slider]="false" hint="Max ₹1.5 lakh" />
            <app-num-field label="80D health insurance" prefix="₹" [(value)]="d80" [min]="0" [max]="100000" [step]="1000" [slider]="false" hint="₹25k self, +₹50k senior parents" />
            <app-num-field label="HRA exemption" prefix="₹" [(value)]="hraEx" [min]="0" [max]="10000000" [step]="1000" [slider]="false" hint="Use the HRA calculator" />
            <app-num-field label="Home-loan interest (24b)" prefix="₹" [(value)]="homeLoan" [min]="0" [max]="200000" [step]="5000" [slider]="false" hint="Max ₹2 lakh, self-occupied" />
            <app-num-field label="NPS 80CCD(1B)" prefix="₹" [(value)]="nps" [min]="0" [max]="50000" [step]="1000" [slider]="false" hint="Max ₹50,000" />
            <app-num-field label="Other deductions" prefix="₹" [(value)]="other" [min]="0" [max]="10000000" [step]="1000" [slider]="false" hint="80E, 80G, 80TTA…" />
          </div>
        </details>
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border p-3 text-sm font-semibold" [class]="verdictClass()" aria-live="polite">{{ verdict() }}</div>
        <div class="mt-3 grid grid-cols-2 gap-2">
          @for (t of results(); track t.regime) {
            <div class="rounded-2xl border bg-surface-2 p-3" [class.border-brand]="t.regime === best()" [class.border-line]="t.regime !== best()">
              <p class="text-xs font-semibold text-muted">{{ t.regime === 'new' ? 'New regime' : 'Old regime' }}@if (t.regime === best()) { · <span class="text-brand">better</span> }</p>
              <p class="text-2xl font-bold tabular-nums">{{ money(t.total) }}</p>
              <p class="text-xs text-muted">{{ money(t.monthly) }}/month · {{ t.effectiveRate }}%</p>
              <dl class="mt-2 space-y-1 border-t border-line pt-2 text-xs tabular-nums">
                <div class="flex justify-between gap-2"><dt class="text-muted">Deductions</dt><dd>{{ money(t.deductions) }}</dd></div>
                <div class="flex justify-between gap-2"><dt class="text-muted">Taxable</dt><dd>{{ money(t.taxable) }}</dd></div>
                <div class="flex justify-between gap-2"><dt class="text-muted">Slab tax</dt><dd>{{ money(t.slabTax) }}</dd></div>
                @if (t.rebate) { <div class="flex justify-between gap-2"><dt class="text-muted">Rebate 87A</dt><dd>−{{ money(t.rebate) }}</dd></div> }
                @if (t.surcharge) { <div class="flex justify-between gap-2"><dt class="text-muted">Surcharge</dt><dd>{{ money(t.surcharge) }}</dd></div> }
                <div class="flex justify-between gap-2"><dt class="text-muted">Cess 4%</dt><dd>{{ money(t.cess) }}</dd></div>
              </dl>
            </div>
          }
        </div>
        <p class="mt-2 text-xs text-muted">Need the HRA figure? Try the <a routerLink="/hra-calculator" class="font-medium text-brand underline">HRA calculator</a>.</p>
      </div>
    </div>
  `,
})
export class TaxCalc {
  protected readonly income = signal(1500000);
  protected readonly salaried = signal(true);
  protected readonly age = signal<AgeGroup>('below60');
  protected readonly c80 = signal(150000);
  protected readonly d80 = signal(25000);
  protected readonly hraEx = signal(0);
  protected readonly homeLoan = signal(0);
  protected readonly nps = signal(0);
  protected readonly other = signal(0);
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly deductionTotal = computed(() => this.c80() + this.d80() + this.hraEx() + this.homeLoan() + this.nps() + this.other());

  protected readonly results = computed<TaxResult[]>(() => {
    const inp = {
      income: this.income(),
      salaried: this.salaried(),
      age: this.age(),
      sec80c: this.c80(),
      sec80d: this.d80(),
      hraExempt: this.hraEx(),
      homeLoanInterest: this.homeLoan(),
      nps80ccd1b: this.nps(),
      otherDeductions: this.other(),
      professionalTax: this.salaried() ? 2500 : 0,
    };
    return [incomeTax(inp, 'new'), incomeTax(inp, 'old')];
  });
  protected readonly best = computed<Regime | null>(() => {
    const [n, o] = this.results();
    return n.total === o.total ? null : n.total < o.total ? 'new' : 'old';
  });
  protected readonly verdict = computed(() => {
    const [n, o] = this.results();
    if (n.total === o.total) return n.total === 0 ? 'No tax under either regime.' : 'Both regimes cost the same.';
    const diff = Math.abs(n.total - o.total);
    return `${n.total < o.total ? 'New' : 'Old'} regime saves you ${rupees(diff)} a year (${rupees(diff / 12)}/month).`;
  });
  protected readonly verdictClass = computed(() => (this.best() ? 'border-brand/40 bg-brand/10 text-brand' : 'border-line bg-surface-2'));
  protected setAge(e: Event) {
    this.age.set((e.target as HTMLSelectElement).value as AgeGroup);
  }
  protected money = rupees;
}

// ---------------- GST ----------------
@Component({
  selector: 'app-gst-calc',
  imports: [NumField],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <div class="${SEG}" role="group" aria-label="GST mode">
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="mode() === 'add'" [class.shadow-sm]="mode() === 'add'" [attr.aria-pressed]="mode() === 'add'" (click)="mode.set('add')">Add GST</button>
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="mode() === 'remove'" [class.shadow-sm]="mode() === 'remove'" [attr.aria-pressed]="mode() === 'remove'" (click)="mode.set('remove')">Remove GST</button>
        </div>
        <app-num-field [label]="mode() === 'add' ? 'Amount before GST' : 'Amount including GST'" prefix="₹" [(value)]="amount" [min]="0" [max]="10000000000" [sliderMax]="1000000" [step]="100" />
        <div>
          <p class="label">GST rate</p>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="GST rate">
            @for (r of rates; track r) {
              <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="rate() === r" (click)="rate.set(r)">{{ r }}%</button>
            }
          </div>
          <div class="mt-3"><app-num-field label="Or type a rate" suffix="%" [(value)]="rate" [min]="0" [max]="100" [step]="0.25" [slider]="false" /></div>
        </div>
        <div class="${SEG}" role="group" aria-label="Type of supply">
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="!inter()" [class.shadow-sm]="!inter()" [attr.aria-pressed]="!inter()" (click)="inter.set(false)">Same state</button>
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="inter()" [class.shadow-sm]="inter()" [attr.aria-pressed]="inter()" (click)="inter.set(true)">Other state</button>
        </div>
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">{{ mode() === 'add' ? 'Total with GST' : 'Amount before GST' }}</p>
          <p class="text-3xl font-bold text-brand tabular-nums">{{ money2(mode() === 'add' ? r().gross : r().net) }}</p>
          <dl class="mt-3 space-y-1.5 border-t border-line pt-3 text-sm tabular-nums">
            <div class="flex justify-between"><dt class="text-muted">Amount before GST</dt><dd>{{ money2(r().net) }}</dd></div>
            @if (inter()) {
              <div class="flex justify-between"><dt class="text-muted">IGST {{ rate() }}%</dt><dd>{{ money2(r().gst) }}</dd></div>
            } @else {
              <div class="flex justify-between"><dt class="text-muted">CGST {{ rate() / 2 }}%</dt><dd>{{ money2(r().half) }}</dd></div>
              <div class="flex justify-between"><dt class="text-muted">SGST {{ rate() / 2 }}%</dt><dd>{{ money2(r().half) }}</dd></div>
            }
            <div class="flex justify-between font-semibold"><dt>Total GST</dt><dd>{{ money2(r().gst) }}</dd></div>
            <div class="flex justify-between border-t border-line pt-1.5 font-semibold"><dt>Total amount</dt><dd>{{ money2(r().gross) }}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  `,
})
export class GstCalc {
  protected readonly rates = GST_RATES;
  protected readonly amount = signal(10000);
  protected readonly rate = signal(18);
  protected readonly mode = signal<'add' | 'remove'>('add');
  protected readonly inter = signal(false);
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly r = computed(() => gst(this.amount(), this.rate(), this.mode()));
  protected money2(n: number) {
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// ---------------- HRA ----------------
@Component({
  selector: 'app-hra-calc',
  imports: [NumField, RouterLink],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <app-num-field label="Basic salary + DA (per month)" prefix="₹" [(value)]="basic" [min]="0" [max]="10000000" [sliderMax]="300000" [step]="1000" />
        <app-num-field label="HRA received (per month)" prefix="₹" [(value)]="hraReceived" [min]="0" [max]="10000000" [sliderMax]="150000" [step]="500" />
        <app-num-field label="Rent paid (per month)" prefix="₹" [(value)]="rent" [min]="0" [max]="10000000" [sliderMax]="150000" [step]="500" />
        <div>
          <label class="label" for="hra-city">City you live in</label>
          <select id="hra-city" class="input" [value]="city()" (change)="setCity($event)">
            @for (c of metros; track c) { <option [value]="c">{{ c }} (metro, 50%)</option> }
            <option value="other">Any other city (40%)</option>
          </select>
        </div>
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">Tax-free HRA per year</p>
          <p class="text-3xl font-bold text-brand tabular-nums">{{ money(r().exempt) }}</p>
          <p class="text-sm text-muted">{{ money(r().exempt / 12) }} a month · taxable HRA {{ money(r().taxable) }}/year</p>
          <p class="mt-3 border-t border-line pt-2 text-xs font-semibold text-muted">Lowest of these three (yearly):</p>
          <ul class="mt-1 space-y-1 text-sm tabular-nums">
            @for (l of r().limits; track l.label) {
              <li class="flex justify-between gap-2" [class.font-semibold]="l.value === r().exempt" [class.text-brand]="l.value === r().exempt">
                <span>{{ l.label }}</span><span>{{ money(l.value) }}</span>
              </li>
            }
          </ul>
        </div>
        <p class="mt-2 text-xs text-muted">HRA exemption works only in the old regime. Put this figure in the <a routerLink="/income-tax-calculator" class="font-medium text-brand underline">income tax calculator</a> to compare regimes.</p>
      </div>
    </div>
  `,
})
export class HraCalc {
  protected readonly metros = HRA_METROS;
  protected readonly basic = signal(50000);
  protected readonly hraReceived = signal(20000);
  protected readonly rent = signal(18000);
  protected readonly city = signal('Hyderabad');
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly r = computed(() => hra(this.basic() * 12, this.hraReceived() * 12, this.rent() * 12, this.city() !== 'other'));
  protected setCity(e: Event) {
    this.city.set((e.target as HTMLSelectElement).value);
  }
  protected money = rupees;
}

// ---------------- In-hand salary ----------------
@Component({
  selector: 'app-salary-calc',
  imports: [NumField, Donut],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <app-num-field label="Yearly CTC" prefix="₹" [(value)]="ctc" [min]="100000" [max]="1000000000" [sliderMax]="5000000" [step]="10000" [rupeeWords]="true" />
        <app-num-field label="Basic salary (% of CTC)" suffix="%" [(value)]="basicPct" [min]="10" [max]="80" [step]="1" />
        <div class="${SEG}" role="group" aria-label="Tax regime">
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="regime() === 'new'" [class.shadow-sm]="regime() === 'new'" [attr.aria-pressed]="regime() === 'new'" (click)="regime.set('new')">New regime</button>
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="regime() === 'old'" [class.shadow-sm]="regime() === 'old'" [attr.aria-pressed]="regime() === 'old'" (click)="regime.set('old')">Old regime</button>
        </div>
        <div class="space-y-2 text-sm">
          <label class="flex items-center gap-2"><input type="checkbox" class="size-4 accent-brand" [checked]="pfCap()" (change)="pfCap.set(!pfCap())" /> PF only on ₹15,000 basic (₹1,800/month)</label>
          <label class="flex items-center gap-2"><input type="checkbox" class="size-4 accent-brand" [checked]="gratuity()" (change)="gratuity.set(!gratuity())" /> Gratuity is included in my CTC</label>
        </div>
        <app-num-field label="Professional tax (per year)" prefix="₹" [(value)]="pt" [min]="0" [max]="2500" [step]="100" [slider]="false" hint="Telangana ₹2,400 · Karnataka/Maharashtra ₹2,500 · Delhi/UP ₹0" />
        @if (regime() === 'old') {
          <app-num-field label="Other 80C investments (besides PF)" prefix="₹" [(value)]="extra80c" [min]="0" [max]="150000" [step]="5000" [slider]="false" />
        }
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">Monthly in-hand salary</p>
          <p class="text-3xl font-bold text-brand tabular-nums">{{ money(r().inHandMonth) }}</p>
          <p class="text-sm text-muted">{{ money(r().inHandYear) }} a year</p>
          <div class="mt-3"><app-donut [slices]="slices()" /></div>
          <dl class="mt-3 space-y-1 border-t border-line pt-2 text-sm tabular-nums">
            <div class="flex justify-between gap-2"><dt class="text-muted">CTC</dt><dd>{{ money(ctc()) }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted">− Employer PF</dt><dd>{{ money(r().employerPf) }}</dd></div>
            @if (r().gratuity) { <div class="flex justify-between gap-2"><dt class="text-muted">− Gratuity</dt><dd>{{ money(r().gratuity) }}</dd></div> }
            <div class="flex justify-between gap-2 font-semibold"><dt>Gross salary</dt><dd>{{ money(r().gross) }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted">− Your PF</dt><dd>{{ money(r().employeePf) }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted">− Professional tax</dt><dd>{{ money(r().professionalTax) }}</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted">− Income tax ({{ regime() }})</dt><dd>{{ money(r().tax.total) }}</dd></div>
            <div class="flex justify-between gap-2 border-t border-line pt-1 font-semibold"><dt>In-hand (year)</dt><dd>{{ money(r().inHandYear) }}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  `,
})
export class SalaryCalc {
  protected readonly ctc = signal(1200000);
  protected readonly basicPct = signal(50);
  protected readonly regime = signal<Regime>('new');
  protected readonly pfCap = signal(false);
  protected readonly gratuity = signal(false);
  protected readonly pt = signal(2400);
  protected readonly extra80c = signal(0);
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly r = computed(() =>
    salary({ ctc: this.ctc(), basicPct: this.basicPct(), pfOnCappedWage: this.pfCap(), gratuityInCtc: this.gratuity(), professionalTax: this.pt(), regime: this.regime(), extra80c: this.extra80c() }),
  );
  protected readonly slices = computed(() => [
    { label: 'In-hand', value: this.r().inHandYear, color: 'var(--brand)' },
    { label: 'PF (yours + employer)', value: this.r().employeePf + this.r().employerPf, color: '#6366f1' },
    { label: 'Tax + professional tax', value: this.r().tax.total + this.r().professionalTax, color: '#f59e0b' },
  ]);
  protected money = rupees;
  protected words = inWords;
}
