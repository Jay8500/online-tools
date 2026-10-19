import { Component, computed, model, signal, viewChildren } from '@angular/core';
import { daysAgoIso, localIso } from '../../core/dates';
import { ACTIVITY, BMI_BANDS, bmi, bmiBand, bmr, devine, dueDate, fmtDate, ftInToCm, healthyWeight, whoBmiLabel } from '../../core/health';
import { NumField } from '../../shared/num-field';

const SEG = 'flex rounded-xl border border-line bg-surface-2 p-1 text-sm font-semibold';
const SEG_BTN = 'flex-1 rounded-lg px-3 py-1.5 transition';
const STALE = `@if (invalid()) { <p class="mb-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600" role="alert">Fix the highlighted field — results show the last valid numbers.</p> }`;

/** Height in cm, typed either as cm or feet + inches. */
@Component({
  selector: 'app-height-input',
  imports: [NumField],
  template: `
    <div>
      <div class="mb-1 flex items-center justify-between">
        <span class="label mb-0">Height</span>
        <div class="flex gap-1 text-xs" role="group" aria-label="Height unit">
          <button type="button" class="chip min-h-7 px-2 text-xs" [attr.aria-pressed]="unit() === 'ft'" (click)="setUnit('ft')">ft / in</button>
          <button type="button" class="chip min-h-7 px-2 text-xs" [attr.aria-pressed]="unit() === 'cm'" (click)="setUnit('cm')">cm</button>
        </div>
      </div>
      @if (unit() === 'cm') {
        <app-num-field label="Height in cm" suffix="cm" [value]="cm()" (valueChange)="cm.set($event)" [min]="50" [max]="250" [step]="1" />
      } @else {
        <div class="grid grid-cols-2 gap-3">
          <app-num-field label="Feet" suffix="ft" [value]="ft()" (valueChange)="setFt($event)" [min]="2" [max]="8" [step]="1" [slider]="false" />
          <app-num-field label="Inches" suffix="in" [value]="inch()" (valueChange)="setIn($event)" [min]="0" [max]="11.9" [step]="0.5" [slider]="false" />
        </div>
      }
    </div>
  `,
})
export class HeightInput {
  readonly cm = model.required<number>();
  protected readonly unit = signal<'cm' | 'ft'>('ft');
  protected readonly ft = computed(() => Math.floor(this.cm() / 2.54 / 12));
  protected readonly inch = computed(() => Math.round((this.cm() / 2.54 - this.ft() * 12) * 2) / 2);
  protected setUnit(u: 'cm' | 'ft') {
    this.unit.set(u);
  }
  protected setFt(v: number) {
    this.cm.set(ftInToCm(v, this.inch()));
  }
  protected setIn(v: number) {
    this.cm.set(ftInToCm(this.ft(), v));
  }
}

// ---------------- BMI ----------------
@Component({
  selector: 'app-bmi-tool',
  imports: [NumField, HeightInput],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <app-height-input [(cm)]="cm" />
        <app-num-field label="Weight" suffix="kg" [(value)]="kg" [min]="10" [max]="300" [step]="0.5" />
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">Your BMI</p>
          <p class="text-4xl font-bold tabular-nums" [style.color]="band().color">{{ value() }}</p>
          <p class="font-semibold" [style.color]="band().color">{{ band().label }} <span class="text-xs font-normal text-muted">(Indian / Asian range)</span></p>
          <div class="relative mt-4 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
            @for (b of bands; track b.label) { <div class="h-full" [style.background]="b.color" [style.width.%]="bandWidth(b.from, b.to)"></div> }
          </div>
          <div class="relative h-4" aria-hidden="true"><span class="absolute -top-1 -translate-x-1/2 text-xs" [style.left.%]="markerPos()">▲</span></div>
          <div class="flex justify-between text-[10px] text-muted"><span>15</span><span>18.5</span><span>23</span><span>25</span><span>35</span></div>
          <dl class="mt-3 space-y-1 border-t border-line pt-2 text-sm">
            <div class="flex justify-between gap-2"><dt class="text-muted">Healthy weight for you</dt><dd class="font-semibold">{{ healthy().min }}–{{ healthy().max }} kg</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted">WHO international category</dt><dd>{{ who() }}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  `,
})
export class BmiTool {
  protected readonly bands = BMI_BANDS;
  protected readonly cm = signal(165);
  protected readonly kg = signal(65);
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly value = computed(() => bmi(this.kg(), this.cm()));
  protected readonly band = computed(() => bmiBand(this.value()));
  protected readonly healthy = computed(() => healthyWeight(this.cm()));
  protected readonly who = computed(() => whoBmiLabel(this.value()));
  protected readonly markerPos = computed(() => Math.min(100, Math.max(0, ((this.value() - 15) / 20) * 100)));
  protected bandWidth(from: number, to: number) {
    return ((Math.min(to, 35) - Math.max(from, 15)) / 20) * 100;
  }
}

// ---------------- Calories (BMR / TDEE) ----------------
@Component({
  selector: 'app-calorie-tool',
  imports: [NumField, HeightInput],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <div class="${SEG}" role="group" aria-label="Sex">
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="male()" [class.shadow-sm]="male()" [attr.aria-pressed]="male()" (click)="male.set(true)">Male</button>
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="!male()" [class.shadow-sm]="!male()" [attr.aria-pressed]="!male()" (click)="male.set(false)">Female</button>
        </div>
        <app-num-field label="Age" suffix="years" [(value)]="age" [min]="15" [max]="90" [step]="1" />
        <app-height-input [(cm)]="cm" />
        <app-num-field label="Weight" suffix="kg" [(value)]="kg" [min]="30" [max]="250" [step]="0.5" />
        <div>
          <label class="label" for="act">Activity</label>
          <select id="act" class="input" [value]="activity()" (change)="setActivity($event)">
            @for (a of activities; track a.id) { <option [value]="a.id" [selected]="a.id === activity()">{{ a.label }}</option> }
          </select>
        </div>
      </div>
      <div>
        ${STALE}
        <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <p class="text-xs font-semibold text-muted">Calories to maintain your weight</p>
          <p class="text-3xl font-bold text-brand tabular-nums">{{ tdee() }} <span class="text-base font-semibold">kcal/day</span></p>
          <p class="text-sm text-muted">BMR (at complete rest): {{ base() }} kcal/day</p>
          <dl class="mt-3 space-y-1.5 border-t border-line pt-2 text-sm tabular-nums">
            <div class="flex justify-between gap-2"><dt class="text-muted">Lose ~0.5 kg a week</dt><dd class="font-semibold">{{ lose() }} kcal</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted">Lose ~0.25 kg a week</dt><dd>{{ tdee() - 250 }} kcal</dd></div>
            <div class="flex justify-between gap-2"><dt class="text-muted">Gain ~0.25 kg a week</dt><dd>{{ tdee() + 250 }} kcal</dd></div>
          </dl>
          <p class="mt-2 text-xs text-muted">Don’t go below about {{ male() ? 1500 : 1200 }} kcal a day without a doctor or dietitian.</p>
        </div>
      </div>
    </div>
  `,
})
export class CalorieTool {
  protected readonly activities = ACTIVITY;
  protected readonly male = signal(true);
  protected readonly age = signal(30);
  protected readonly cm = signal(170);
  protected readonly kg = signal(70);
  protected readonly activity = signal('light');
  private readonly fields = viewChildren(NumField);
  protected readonly invalid = computed(() => this.fields().some((f) => !!f.error()));
  protected readonly base = computed(() => bmr(this.kg(), this.cm(), this.age(), this.male()));
  protected readonly tdee = computed(() => Math.round(this.base() * (ACTIVITY.find((a) => a.id === this.activity())?.factor ?? 1.2)));
  protected readonly lose = computed(() => Math.max(this.male() ? 1500 : 1200, this.tdee() - 500));
  protected setActivity(e: Event) {
    this.activity.set((e.target as HTMLSelectElement).value);
  }
}

// ---------------- Ideal weight ----------------
@Component({
  selector: 'app-ideal-weight-tool',
  imports: [HeightInput],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <div class="${SEG}" role="group" aria-label="Sex">
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="male()" [class.shadow-sm]="male()" [attr.aria-pressed]="male()" (click)="male.set(true)">Male</button>
          <button type="button" class="${SEG_BTN}" [class.bg-surface]="!male()" [class.shadow-sm]="!male()" [attr.aria-pressed]="!male()" (click)="male.set(false)">Female</button>
        </div>
        <app-height-input [(cm)]="cm" />
      </div>
      <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
        <p class="text-xs font-semibold text-muted">Healthy weight range (Indian BMI 18.5–22.9)</p>
        <p class="text-3xl font-bold text-brand tabular-nums">{{ range().min }}–{{ range().max }} kg</p>
        <p class="text-sm text-muted">For a height of {{ cm() }} cm</p>
        <dl class="mt-3 space-y-1 border-t border-line pt-2 text-sm">
          <div class="flex justify-between gap-2"><dt class="text-muted">Devine formula (single figure)</dt><dd class="font-semibold">{{ dev() }} kg</dd></div>
        </dl>
        <p class="mt-2 text-xs text-muted">Muscle, frame size and age matter too — use the range, not one number.</p>
      </div>
    </div>
  `,
})
export class IdealWeightTool {
  protected readonly male = signal(true);
  protected readonly cm = signal(170);
  protected readonly range = computed(() => healthyWeight(this.cm()));
  protected readonly dev = computed(() => devine(this.cm(), this.male()));
}

// ---------------- Pregnancy due date ----------------
@Component({
  selector: 'app-due-date-tool',
  imports: [NumField],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <div [class.field-invalid]="!!lmpError()">
          <label class="label" for="lmp">First day of your last period</label>
          <input id="lmp" type="date" class="input" [value]="lmp()" [max]="today" (input)="setLmp($event)" aria-describedby="lmp-msg" />
          @if (lmpError()) { <p id="lmp-msg" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ lmpError() }}</p> }
        </div>
        <app-num-field label="Usual cycle length" suffix="days" [(value)]="cycle" [min]="21" [max]="40" [step]="1" hint="28 days is average." />
      </div>
      <div>
        @if (r(); as d) {
          <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
            <p class="text-xs font-semibold text-muted">Estimated due date</p>
            <p class="text-2xl font-bold text-brand">{{ fmt(d.due) }}</p>
            @if (d.weeks !== null) {
              <p class="text-sm">You are <strong>{{ d.weeks }} weeks {{ d.days }} days</strong> pregnant · trimester {{ d.trimester }}</p>
            }
            <ul class="mt-3 space-y-1 border-t border-line pt-2 text-sm">
              <li class="flex justify-between gap-2"><span class="text-muted">Likely conception</span><span>{{ fmt(d.conception) }}</span></li>
              @for (m of d.milestones; track m.label) {
                <li class="flex justify-between gap-2"><span class="text-muted">{{ m.label }}</span><span>{{ fmt(m.date) }}</span></li>
              }
            </ul>
          </div>
        }
      </div>
    </div>
  `,
})
export class DueDateTool {
  protected readonly today = localIso();
  protected readonly lmp = signal(daysAgoIso(70));
  protected readonly cycle = signal(28);
  protected readonly lmpError = computed(() => {
    const v = this.lmp();
    if (!v) return 'Pick a date';
    const d = new Date(v);
    if (isNaN(d.getTime())) return 'Pick a valid date';
    if (d.getTime() > Date.now()) return 'The date can’t be in the future';
    if (Date.now() - d.getTime() > 300 * 86400000) return 'That is more than 42 weeks ago — check the date';
    return null;
  });
  protected readonly r = computed(() => (this.lmpError() ? null : dueDate(new Date(this.lmp() + 'T00:00:00'), this.cycle())));
  protected setLmp(e: Event) {
    this.lmp.set((e.target as HTMLInputElement).value);
  }
  protected fmt = fmtDate;
}
