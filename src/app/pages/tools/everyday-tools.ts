import { Component, computed, signal } from '@angular/core';
import { localIso } from '../../core/dates';
import { age, percentChange, percentOf, whatPercent } from '../../core/everyday';
import { fmtDate } from '../../core/health';
import { NumField } from '../../shared/num-field';

const SEG = 'flex rounded-xl border border-line bg-surface-2 p-1 text-sm font-semibold';
const SEG_BTN = 'flex-1 rounded-lg px-2 py-1.5 transition';
const NUM = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

// ---------------- Age calculator ----------------
@Component({
  selector: 'app-age-tool',
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <div [class.field-invalid]="!!error()">
          <label class="label" for="dob">Date of birth</label>
          <input id="dob" type="date" class="input" [value]="dob()" [max]="on()" (input)="dob.set(val($event))" aria-describedby="dob-msg" />
          @if (error()) { <p id="dob-msg" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ error() }}</p> }
        </div>
        <div>
          <label class="label" for="on">Age on (default: today)</label>
          <input id="on" type="date" class="input" [value]="on()" (input)="on.set(val($event) || today)" />
          <p class="mt-1 text-xs text-muted">Change this for an exam cut-off date, e.g. “age as on 1 Aug”.</p>
        </div>
      </div>
      <div aria-live="polite">
        @if (r(); as a) {
          <div class="rounded-2xl border border-line bg-surface-2 p-4">
            <p class="text-xs font-semibold text-muted">Your age</p>
            <p class="text-2xl font-bold text-brand">{{ a.years }} {{ a.years === 1 ? 'year' : 'years' }} {{ a.months }} {{ a.months === 1 ? 'month' : 'months' }} {{ a.days }} {{ a.days === 1 ? 'day' : 'days' }}</p>
            <p class="text-sm text-muted">Born on a {{ a.bornOn }}</p>
            <ul class="mt-3 space-y-1 border-t border-line pt-2 text-sm">
              <li class="flex justify-between gap-2"><span class="text-muted">🎂 Next birthday</span><span>{{ a.daysToBirthday === 0 ? 'Today! Happy birthday 🎉' : 'in ' + a.daysToBirthday + ' days' }}</span></li>
              <li class="flex justify-between gap-2"><span class="text-muted">On</span><span>{{ fmt(a.nextBirthday) }}</span></li>
              <li class="flex justify-between gap-2"><span class="text-muted">Total months</span><span class="tabular-nums">{{ n(a.totalMonths) }}</span></li>
              <li class="flex justify-between gap-2"><span class="text-muted">Total weeks</span><span class="tabular-nums">{{ n(a.totalWeeks) }}</span></li>
              <li class="flex justify-between gap-2"><span class="text-muted">Total days</span><span class="tabular-nums">{{ n(a.totalDays) }}</span></li>
            </ul>
          </div>
        }
      </div>
    </div>
  `,
})
export class AgeTool {
  protected readonly today = localIso();
  protected readonly dob = signal('2000-01-01');
  protected readonly on = signal(this.today);
  protected readonly error = computed(() => {
    const d = new Date(this.dob() + 'T00:00:00');
    if (!this.dob() || isNaN(d.getTime())) return 'Pick your date of birth';
    if (this.dob() > this.on()) return 'Date of birth must be before the “age on” date';
    return null;
  });
  protected readonly r = computed(() => (this.error() ? null : age(new Date(this.dob() + 'T00:00:00'), new Date(this.on() + 'T00:00:00'))));
  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  protected n(v: number) {
    return NUM.format(v);
  }
  protected fmt = fmtDate;
}

// ---------------- Percentage calculator ----------------
type Mode = 'of' | 'what' | 'change';

@Component({
  selector: 'app-percent-tool',
  imports: [NumField],
  template: `
    <div class="${SEG}" role="group" aria-label="What do you want to find?">
      @for (m of modes; track m.id) {
        <button type="button" class="${SEG_BTN}" [class]="mode() === m.id ? 'bg-surface text-brand shadow-sm' : 'text-muted'" [attr.aria-pressed]="mode() === m.id" (click)="mode.set(m.id)">{{ m.label }}</button>
      }
    </div>
    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        @switch (mode()) {
          @case ('of') {
            <app-num-field label="Percentage" suffix="%" [(value)]="a" [min]="-1000000" [max]="1000000" />
            <app-num-field label="Of this number" [(value)]="b" [min]="-1000000000" [max]="1000000000" hint="e.g. 20% discount on ₹1,500" />
          }
          @case ('what') {
            <app-num-field label="Marks / part" [(value)]="a" [min]="-1000000000" [max]="1000000000" />
            <app-num-field label="Out of / total" [(value)]="b" [min]="-1000000000" [max]="1000000000" hint="e.g. 450 out of 600 marks" />
          }
          @case ('change') {
            <app-num-field label="Old value" [(value)]="a" [min]="-1000000000" [max]="1000000000" />
            <app-num-field label="New value" [(value)]="b" [min]="-1000000000" [max]="1000000000" hint="e.g. salary ₹30,000 → ₹36,000" />
          }
        }
      </div>
      <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
        <p class="text-xs font-semibold text-muted">Answer</p>
        <p class="text-2xl font-bold text-brand">{{ answer() }}</p>
        <p class="mt-1 text-sm text-muted">{{ explain() }}</p>
      </div>
    </div>
  `,
})
export class PercentTool {
  protected readonly modes: { id: Mode; label: string }[] = [
    { id: 'what', label: 'Marks %' },
    { id: 'of', label: '% of a number' },
    { id: 'change', label: '% increase' },
  ];
  protected readonly mode = signal<Mode>('what');
  protected readonly a = signal(450);
  protected readonly b = signal(600);

  private readonly result = computed(() => {
    const a = this.a(), b = this.b();
    return this.mode() === 'of' ? percentOf(a, b) : this.mode() === 'what' ? whatPercent(a, b) : percentChange(a, b);
  });
  protected readonly answer = computed(() => {
    const r = this.result();
    if (r === null) return '—';
    if (this.mode() === 'of') return NUM.format(r);
    if (this.mode() === 'change') return `${r >= 0 ? '▲' : '▼'} ${NUM.format(Math.abs(r))}%`;
    return `${NUM.format(r)}%`;
  });
  protected readonly explain = computed(() => {
    const a = NUM.format(this.a()), b = NUM.format(this.b()), r = this.result();
    if (r === null) return this.mode() === 'what' ? 'The total can’t be 0.' : 'The old value can’t be 0.';
    if (this.mode() === 'of') return `${a}% of ${b} = ${NUM.format(r)}. After a ${a}% discount you pay ${NUM.format(this.b() - r)}.`;
    if (this.mode() === 'what') return `${a} out of ${b} = ${NUM.format(r)}%.`;
    return `From ${a} to ${b} is a ${NUM.format(Math.abs(r))}% ${r >= 0 ? 'increase' : 'decrease'}.`;
  });
}
