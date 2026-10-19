import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import { rupees } from '../../core/finance';
import { CATEGORIES, LAND_FACTS, LAND_UNITS, UnitCategory, convert, fmtNum, landConvert } from '../../core/units';
import { Icon } from '../../shared/icon';
import { NumField } from '../../shared/num-field';

const SEG = 'flex rounded-xl border border-line bg-surface-2 p-1 text-sm font-semibold';
const SEG_BTN = 'flex-1 rounded-lg px-3 py-1.5 transition';

// ---------------- General unit converter ----------------
@Component({
  selector: 'app-unit-tool',
  imports: [NumField, Icon],
  template: `
    @let c = cat();
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        <app-num-field label="Value" [(value)]="value" [min]="c.id === 'temperature' ? -273.15 : 0" [max]="1e15" [step]="1" [slider]="false" />
        <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <label class="label" for="u-from">From</label>
            <select id="u-from" class="input" (change)="from.set(val($event))">
              @for (u of c.units; track u.id) { <option [value]="u.id" [selected]="u.id === from()">{{ u.name }}</option> }
            </select>
          </div>
          <button type="button" class="btn-icon mb-0.5" (click)="swap()" aria-label="Swap units" title="Swap"><svg lucideIcon="refresh-ccw" [size]="16" /></button>
          <div>
            <label class="label" for="u-to">To</label>
            <select id="u-to" class="input" (change)="to.set(val($event))">
              @for (u of c.units; track u.id) { <option [value]="u.id" [selected]="u.id === to()">{{ u.name }}</option> }
            </select>
          </div>
        </div>
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-sm text-muted">{{ fmt(value()) }} {{ sym(from()) }} =</p>
          <p class="text-3xl font-bold break-all text-brand tabular-nums">{{ fmt(result()) }} <span class="text-lg">{{ sym(to()) }}</span></p>
        </div>
      </div>
      <div>
        <p class="label">{{ fmt(value()) }} {{ sym(from()) }} in every unit</p>
        <table class="w-full text-sm tabular-nums">
          <tbody class="divide-y divide-line">
            @for (r of all(); track r.id) {
              <tr [class.font-semibold]="r.id === to()" [class.text-brand]="r.id === to()"><td class="py-1.5 pr-2">{{ r.name }}</td><td class="py-1.5 text-right break-all">{{ fmt(r.v) }} {{ r.sym }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 rounded-2xl border border-line p-3">
      <p class="mb-1 text-sm font-semibold">Quick answers</p>
      <ul class="grid gap-x-4 gap-y-1 text-sm text-muted sm:grid-cols-2">
        @for (f of c.facts; track f) { <li class="flex gap-2"><span class="text-brand">•</span>{{ f }}</li> }
      </ul>
    </div>
  `,
})
export class UnitTool {
  readonly category = input.required<UnitCategory>();
  protected readonly cat = computed(() => CATEGORIES[this.category()]);
  protected readonly value = linkedSignal(() => (this.category() === 'temperature' ? 37 : this.category() === 'count' ? 1 : 1));
  protected readonly from = linkedSignal(() => this.cat().from);
  protected readonly to = linkedSignal(() => this.cat().to);
  protected readonly result = computed(() => convert(this.category(), this.from(), this.to(), this.value()));
  protected readonly all = computed(() =>
    this.cat().units.map((u) => ({ id: u.id, name: u.name, sym: u.sym, v: convert(this.category(), this.from(), u.id, this.value()) })),
  );
  protected fmt = fmtNum;
  protected val(e: Event) {
    return (e.target as HTMLSelectElement).value;
  }
  protected sym(id: string) {
    return this.cat().units.find((u) => u.id === id)?.sym ?? '';
  }
  protected swap() {
    const f = this.from();
    this.from.set(this.to());
    this.to.set(f);
  }
}

// ---------------- Land area converter + price (Telangana & AP) ----------------
@Component({
  selector: 'app-land-tool',
  imports: [NumField],
  template: `
    <div class="${SEG}" role="group" aria-label="Mode">
      <button type="button" class="${SEG_BTN}" [class.bg-surface]="mode() === 'area'" [class.shadow-sm]="mode() === 'area'" [attr.aria-pressed]="mode() === 'area'" (click)="mode.set('area')">I know the area</button>
      <button type="button" class="${SEG_BTN}" [class.bg-surface]="mode() === 'plot'" [class.shadow-sm]="mode() === 'plot'" [attr.aria-pressed]="mode() === 'plot'" (click)="mode.set('plot')">Plot length × width</button>
    </div>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        @if (mode() === 'area') {
          <app-num-field label="Area" [(value)]="area" [min]="0" [max]="1e9" [step]="1" [slider]="false" />
          <div>
            <label class="label" for="land-unit">Unit</label>
            <select id="land-unit" class="input" (change)="unit.set(val($event))">
              @for (u of units; track u.id) { <option [value]="u.id" [selected]="u.id === unit()">{{ u.name }}</option> }
            </select>
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-3">
            <app-num-field label="Length" [suffix]="dimUnit()" [(value)]="len" [min]="0" [max]="100000" [step]="1" [slider]="false" />
            <app-num-field label="Width" [suffix]="dimUnit()" [(value)]="wid" [min]="0" [max]="100000" [step]="1" [slider]="false" />
          </div>
          <div class="flex gap-1.5" role="group" aria-label="Length unit">
            <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="dimUnit() === 'ft'" (click)="dimUnit.set('ft')">Feet</button>
            <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="dimUnit() === 'm'" (click)="dimUnit.set('m')">Metres</button>
            <button type="button" class="chip min-h-8 text-xs" [attr.aria-pressed]="dimUnit() === 'yd'" (click)="dimUnit.set('yd')">Yards</button>
          </div>
        }
        <div class="rounded-2xl border border-line p-3">
          <p class="mb-2 text-sm font-semibold">Land price (optional)</p>
          <div class="grid grid-cols-[1fr_auto] items-end gap-2">
            <app-num-field label="Rate" prefix="₹" [(value)]="rate" [min]="0" [max]="1e12" [step]="100" [slider]="false" />
            <div>
              <label class="label" for="rate-unit">per</label>
              <select id="rate-unit" class="input w-auto" (change)="rateUnit.set(val($event))">
                @for (u of units; track u.id) { <option [value]="u.id" [selected]="u.id === rateUnit()">{{ u.sym }}</option> }
              </select>
            </div>
          </div>
          @if (rate() > 0) {
            <p class="mt-3 text-xs text-muted">Total value</p>
            <p class="text-2xl font-bold text-brand tabular-nums" aria-live="polite">{{ money(total()) }}</p>
            <p class="text-xs text-muted">{{ words(total()) }} · excludes stamp duty & registration</p>
          }
        </div>
      </div>
      <div>
        <p class="label">{{ fmt(rows()[0].value) }} sq ft in every unit</p>
        <table class="w-full text-sm tabular-nums">
          <tbody class="divide-y divide-line">
            @for (r of rows(); track r.unit.id) {
              <tr [class.font-semibold]="r.unit.id === highlight()" [class.text-brand]="r.unit.id === highlight()">
                <td class="py-1.5 pr-2">{{ r.unit.name }}</td><td class="py-1.5 text-right">{{ fmt(r.value) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    <div class="mt-4 rounded-2xl border border-line p-3">
      <p class="mb-1 text-sm font-semibold">Telangana & Andhra Pradesh land units</p>
      <ul class="grid gap-x-4 gap-y-1 text-sm text-muted sm:grid-cols-2">
        @for (f of facts; track f) { <li class="flex gap-2"><span class="text-brand">•</span>{{ f }}</li> }
      </ul>
    </div>
  `,
})
export class LandTool {
  protected readonly units = LAND_UNITS;
  protected readonly facts = LAND_FACTS;
  protected readonly mode = signal<'area' | 'plot'>('area');
  protected readonly area = signal(1);
  protected readonly unit = signal('acre');
  protected readonly len = signal(30);
  protected readonly wid = signal(40);
  protected readonly dimUnit = signal<'ft' | 'm' | 'yd'>('ft');
  protected readonly rate = signal(0);
  protected readonly rateUnit = signal('sqyd');

  private readonly sqft = computed(() => {
    if (this.mode() === 'area') return this.area() * LAND_UNITS.find((u) => u.id === this.unit())!.f;
    const k = { ft: 1, m: 3.280839895, yd: 3 }[this.dimUnit()];
    return this.len() * k * (this.wid() * k);
  });
  protected readonly rows = computed(() => landConvert('sqft', this.sqft()));
  protected readonly highlight = computed(() => (this.mode() === 'area' ? this.unit() : 'sqyd'));
  protected readonly total = computed(() => (this.sqft() / LAND_UNITS.find((u) => u.id === this.rateUnit())!.f) * this.rate());

  protected val(e: Event) {
    return (e.target as HTMLSelectElement).value;
  }
  protected fmt = fmtNum;
  protected money = rupees;
  protected words(n: number) {
    if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)} crore`;
    if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)} lakh`;
    return rupees(n);
  }
}
