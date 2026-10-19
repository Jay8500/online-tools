import { Component, computed, linkedSignal, signal } from '@angular/core';
import { rupees } from '../../core/finance';
import { NumField } from '../../shared/num-field';

const SEG = 'flex rounded-xl border border-line bg-surface-2 p-1 text-sm font-semibold';
const SEG_BTN = 'flex-1 rounded-lg px-3 py-1.5 transition';

type Metal = 'gold' | 'silver';

/** Purity as a fraction of pure metal. */
const GOLD_PURITY = [
  { id: '24', label: '24K (99.9%)', f: 0.999 },
  { id: '22', label: '22K (91.6%)', f: 0.916 },
  { id: '20', label: '20K (83.3%)', f: 0.833 },
  { id: '18', label: '18K (75%)', f: 0.75 },
  { id: '14', label: '14K (58.5%)', f: 0.585 },
];
const SILVER_PURITY = [
  { id: '999', label: 'Fine 999', f: 0.999 },
  { id: '925', label: 'Sterling 925', f: 0.925 },
  { id: '800', label: '800', f: 0.8 },
];
/** grams per unit */
const WEIGHT_UNITS = [
  { id: 'g', label: 'grams', g: 1 },
  { id: 'sov', label: 'sovereign / pavan (8 g)', g: 8 },
  { id: 'tola', label: 'tola (11.66 g)', g: 11.6638038 },
  { id: 'kg', label: 'kg', g: 1000 },
];

/**
 * Jewellery value: metal value (weight × rate adjusted for purity) + wastage + making charges + 3% GST.
 * The visitor types today's rate from their jeweller, so the result matches that shop.
 */
@Component({
  selector: 'app-gold-tool',
  imports: [NumField],
  template: `
    <div class="${SEG}" role="group" aria-label="Metal">
      <button type="button" class="${SEG_BTN}" [class.bg-surface]="metal() === 'gold'" [class.shadow-sm]="metal() === 'gold'" [attr.aria-pressed]="metal() === 'gold'" (click)="metal.set('gold')">Gold</button>
      <button type="button" class="${SEG_BTN}" [class.bg-surface]="metal() === 'silver'" [class.shadow-sm]="metal() === 'silver'" [attr.aria-pressed]="metal() === 'silver'" (click)="metal.set('silver')">Silver</button>
    </div>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        <div class="grid grid-cols-[1fr_auto] items-end gap-2">
          <app-num-field [label]="'Today’s rate (' + rateBasisLabel() + ')'" prefix="₹" [(value)]="rate" [min]="1" [max]="100000000" [step]="10" [slider]="false"
                         hint="Example value — type today’s rate from your jeweller." />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="rate-per">Rate is per</label>
            <select id="rate-per" class="input" (change)="ratePer.set(val($event))">
              @for (r of ratePers(); track r.id) { <option [value]="r.id" [selected]="r.id === ratePer()">{{ r.label }}</option> }
            </select>
          </div>
          <div>
            <label class="label" for="rate-purity">Rate is for</label>
            <select id="rate-purity" class="input" (change)="ratePurity.set(val($event))">
              @for (p of purities(); track p.id) { <option [value]="p.id" [selected]="p.id === ratePurity()">{{ p.label }}</option> }
            </select>
          </div>
        </div>
        <div class="grid grid-cols-[1fr_auto] items-end gap-2">
          <app-num-field label="Weight of the item" [(value)]="weight" [min]="0.001" [max]="100000" [step]="0.1" [slider]="false" />
          <div>
            <label class="label" for="w-unit">Unit</label>
            <select id="w-unit" class="input w-auto" (change)="wUnit.set(val($event))">
              @for (u of units; track u.id) { <option [value]="u.id" [selected]="u.id === wUnit()">{{ u.label }}</option> }
            </select>
          </div>
        </div>
        <div>
          <label class="label" for="item-purity">Purity of the item</label>
          <select id="item-purity" class="input" (change)="itemPurity.set(val($event))">
            @for (p of purities(); track p.id) { <option [value]="p.id" [selected]="p.id === itemPurity()">{{ p.label }}</option> }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <app-num-field label="Wastage / VA" suffix="%" [(value)]="wastage" [min]="0" [max]="50" [step]="0.5" [slider]="false" />
          <app-num-field label="Making charges" [suffix]="makingMode() === 'pct' ? '%' : '₹/g'" [(value)]="making" [min]="0" [max]="100000" [step]="1" [slider]="false" />
        </div>
        <div class="flex gap-1.5" role="group" aria-label="Making charge type">
          <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="makingMode() === 'pct'" (click)="makingMode.set('pct')">Making as %</button>
          <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="makingMode() === 'perg'" (click)="makingMode.set('perg')">Making ₹ per gram</button>
        </div>
      </div>
      <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
        <p class="text-xs font-semibold text-muted">Estimated price to pay</p>
        <p class="text-3xl font-bold text-brand tabular-nums">{{ money(r().total) }}</p>
        <p class="text-sm text-muted">{{ fmtG(r().grams) }} g of {{ itemLabel() }}</p>
        <dl class="mt-3 space-y-1.5 border-t border-line pt-2 text-sm tabular-nums">
          <div class="flex justify-between gap-2"><dt class="text-muted">{{ metal() === 'gold' ? 'Gold' : 'Silver' }} value</dt><dd>{{ money(r().metal) }}</dd></div>
          @if (r().wastage) { <div class="flex justify-between gap-2"><dt class="text-muted">Wastage ({{ wastage() }}%)</dt><dd>{{ money(r().wastage) }}</dd></div> }
          @if (r().making) { <div class="flex justify-between gap-2"><dt class="text-muted">Making charges</dt><dd>{{ money(r().making) }}</dd></div> }
          <div class="flex justify-between gap-2"><dt class="text-muted">GST 3%</dt><dd>{{ money(r().gst) }}</dd></div>
          <div class="flex justify-between gap-2 border-t border-line pt-1.5 font-semibold"><dt>Total</dt><dd>{{ money(r().total) }}</dd></div>
        </dl>
        <p class="mt-3 text-xs text-muted">Pure-metal rate used: {{ money(r().pureRatePerG) }} per gram of 99.9%. Rates change during the day — confirm at the shop. BIS hallmarking (HUID) is mandatory for gold jewellery.</p>
      </div>
    </div>
  `,
})
export class GoldTool {
  protected readonly units = WEIGHT_UNITS;
  protected readonly metal = signal<Metal>('gold');
  protected readonly purities = computed(() => (this.metal() === 'gold' ? GOLD_PURITY : SILVER_PURITY));
  protected readonly ratePers = computed(() =>
    this.metal() === 'gold'
      ? [
          { id: '10g', label: '10 grams', g: 10 },
          { id: 'g', label: '1 gram', g: 1 },
          { id: 'sov', label: '1 sovereign (8 g)', g: 8 },
        ]
      : [
          { id: 'kg', label: '1 kg', g: 1000 },
          { id: 'g', label: '1 gram', g: 1 },
          { id: '10g', label: '10 grams', g: 10 },
        ],
  );
  // Sensible starting values; the visitor overwrites the rate with today's.
  protected readonly rate = linkedSignal(() => (this.metal() === 'gold' ? 110000 : 140000));
  protected readonly ratePer = linkedSignal<string>(() => (this.metal() === 'gold' ? '10g' : 'kg'));
  protected readonly ratePurity = linkedSignal<string>(() => (this.metal() === 'gold' ? '22' : '999'));
  protected readonly itemPurity = linkedSignal<string>(() => (this.metal() === 'gold' ? '22' : '925'));
  protected readonly weight = linkedSignal(() => (this.metal() === 'gold' ? 10 : 50));
  /** Switching metal resets the unit (sovereign/tola are gold units). */
  protected readonly wUnit = linkedSignal<string>(() => (this.metal() === 'gold' ? 'g' : 'g'));
  protected readonly wastage = linkedSignal(() => (this.metal() === 'gold' ? 8 : 0));
  protected readonly making = linkedSignal(() => (this.metal() === 'gold' ? 0 : 10));
  protected readonly makingMode = signal<'pct' | 'perg'>('pct');

  protected readonly rateBasisLabel = computed(() => this.ratePers().find((r) => r.id === this.ratePer())?.label ?? '');
  protected readonly itemLabel = computed(() => this.purities().find((p) => p.id === this.itemPurity())?.label ?? '');

  protected readonly r = computed(() => {
    const per = this.ratePers().find((x) => x.id === this.ratePer())!.g;
    const rp = this.purities().find((p) => p.id === this.ratePurity())!.f;
    const ip = this.purities().find((p) => p.id === this.itemPurity())!.f;
    const grams = this.weight() * WEIGHT_UNITS.find((u) => u.id === this.wUnit())!.g;
    const pureRatePerG = this.rate() / per / rp;
    const metal = grams * pureRatePerG * ip;
    const wastage = (metal * this.wastage()) / 100;
    const making = this.makingMode() === 'pct' ? ((metal + wastage) * this.making()) / 100 : grams * this.making();
    const gst = ((metal + wastage + making) * 3) / 100;
    return { grams, pureRatePerG, metal, wastage, making, gst, total: metal + wastage + making + gst };
  });

  protected val(e: Event) {
    return (e.target as HTMLSelectElement).value;
  }
  protected money = rupees;
  protected fmtG(n: number) {
    return n.toLocaleString('en-IN', { maximumFractionDigits: 3 });
  }
}
