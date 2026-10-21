import { Component, computed, signal } from '@angular/core';
import { localIso } from '../../core/dates';
import { CGPA_FORMULAS, age, cgpaToPercent, daysBetween, percentChange, percentOf, settle, whatPercent } from '../../core/everyday';
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

// ---------------- Days counter ----------------
@Component({
  selector: 'app-days-tool',
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <div>
          <label class="label" for="d-from">From</label>
          <input id="d-from" type="date" class="input" [value]="from()" (input)="from.set(val($event) || today)" />
        </div>
        <div>
          <label class="label" for="d-to">To (exam, EMI, trip, event…)</label>
          <input id="d-to" type="date" class="input" [value]="to()" (input)="to.set(val($event) || today)" />
        </div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" class="size-4 accent-brand" [checked]="inclusive()" (change)="inclusive.set(!inclusive())" /> Count the end day too</label>
      </div>
      <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
        @let d = r();
        <p class="text-xs font-semibold text-muted">{{ d.days === 0 ? 'Same day' : d.past ? 'That date was' : 'Days left' }}</p>
        <p class="text-2xl font-bold text-brand">{{ n(d.days) }} {{ d.days === 1 ? 'day' : 'days' }}{{ d.past && d.days ? ' ago' : '' }}</p>
        <ul class="mt-3 space-y-1 border-t border-line pt-2 text-sm">
          <li class="flex justify-between gap-2"><span class="text-muted">Weeks</span><span>{{ d.weeks }} weeks {{ d.weekDays }} days</span></li>
          <li class="flex justify-between gap-2"><span class="text-muted">Working days (Mon–Fri)</span><span class="tabular-nums">{{ n(d.workingDays) }}</span></li>
          <li class="flex justify-between gap-2"><span class="text-muted">Target date</span><span>{{ fmt(toDate()) }}</span></li>
        </ul>
      </div>
    </div>
  `,
})
export class DaysTool {
  protected readonly today = localIso();
  protected readonly from = signal(this.today);
  protected readonly to = signal(localIso(new Date(new Date().getFullYear(), 11, 31)));
  protected readonly inclusive = signal(false);
  protected readonly toDate = computed(() => new Date(this.to() + 'T00:00:00'));
  protected readonly r = computed(() => daysBetween(new Date(this.from() + 'T00:00:00'), this.toDate(), this.inclusive()));
  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  protected n(v: number) {
    return NUM.format(v);
  }
  protected fmt = fmtDate;
}

// ---------------- CGPA to percentage ----------------
@Component({
  selector: 'app-cgpa-tool',
  imports: [NumField],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-4">
        <app-num-field label="Your CGPA / SGPA (out of 10)" [(value)]="cgpa" [min]="0" [max]="10" [step]="0.01" />
        <div>
          <label class="label" for="cg-f">Board / university</label>
          <select id="cg-f" class="input" (change)="formula.set(val($event))">
            @for (f of formulas; track f.id) { <option [value]="f.id" [selected]="formula() === f.id">{{ f.label }}</option> }
            <option value="custom" [selected]="formula() === 'custom'">Other — type my formula</option>
          </select>
        </div>
        @if (formula() === 'custom') {
          <div class="grid grid-cols-2 gap-3">
            <app-num-field label="Subtract" [(value)]="sub" [min]="0" [max]="5" [step]="0.01" />
            <app-num-field label="Then multiply by" [(value)]="mul" [min]="1" [max]="20" [step]="0.01" />
          </div>
          <p class="text-xs text-muted">Your marks memo or university regulation shows the formula, e.g. “(CGPA − 0.5) × 10”.</p>
        }
      </div>
      <div class="rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
        <p class="text-xs font-semibold text-muted">Percentage</p>
        <p class="text-2xl font-bold text-brand">{{ pct() }}%</p>
        <p class="mt-1 text-sm text-muted">{{ how() }}</p>
        <ul class="mt-3 space-y-1 border-t border-line pt-2 text-sm">
          @for (f of formulas; track f.id) {
            <li class="flex justify-between gap-2"><span class="text-muted">{{ f.label }}</span><span class="tabular-nums">{{ one(f.mul, f.sub) }}%</span></li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class CgpaTool {
  protected readonly formulas = CGPA_FORMULAS;
  protected readonly cgpa = signal(8.2);
  protected readonly formula = signal<string>('jntuh');
  protected readonly sub = signal(0.5);
  protected readonly mul = signal(10);
  private readonly f = computed(() => CGPA_FORMULAS.find((x) => x.id === this.formula()) ?? { mul: this.mul(), sub: this.sub() });
  protected readonly pct = computed(() => NUM.format(cgpaToPercent(this.cgpa(), this.f().mul, this.f().sub)));
  protected readonly how = computed(() => {
    const { mul, sub } = this.f();
    return sub ? `(${this.cgpa()} − ${sub}) × ${mul} = ${this.pct()}%` : `${this.cgpa()} × ${mul} = ${this.pct()}%`;
  });
  protected one(mul: number, sub: number) {
    return NUM.format(cgpaToPercent(this.cgpa(), mul, sub));
  }
  protected val(e: Event) {
    return (e.target as HTMLSelectElement).value;
  }
}

// ---------------- Split bill ----------------
@Component({
  selector: 'app-split-tool',
  template: `
    <p class="mb-2 text-sm text-muted">Add everyone and what each person paid (0 if they paid nothing).</p>
    <ul class="space-y-2">
      @for (p of people(); track $index; let i = $index) {
        <li class="flex items-center gap-2">
          <input class="input min-w-0 flex-1" [value]="p.name" maxlength="20" [attr.aria-label]="'Name ' + (i + 1)" (input)="setName(i, $event)" />
          <div class="relative w-32 shrink-0">
            <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">₹</span>
            <input class="input pl-7 text-right tabular-nums" type="number" inputmode="decimal" min="0" [value]="p.paid || ''" placeholder="0"
                   [attr.aria-label]="'Amount paid by ' + p.name" (input)="setPaid(i, $event)" />
          </div>
          <button type="button" class="btn-ghost min-h-10 shrink-0 px-3" [disabled]="people().length <= 2" (click)="remove(i)" [attr.aria-label]="'Remove ' + p.name">✕</button>
        </li>
      }
    </ul>
    <button type="button" class="btn-ghost mt-2 min-h-10 text-sm" [disabled]="people().length >= 15" (click)="add()">+ Add person</button>

    <div class="mt-4 rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
      @let r = result();
      <div class="flex flex-wrap justify-between gap-2">
        <p><span class="text-xs font-semibold text-muted">Total</span><br /><span class="text-xl font-bold">₹{{ n(r.total) }}</span></p>
        <p class="text-right"><span class="text-xs font-semibold text-muted">Each person’s share</span><br /><span class="text-xl font-bold text-brand">₹{{ n(r.share) }}</span></p>
      </div>
      <p class="mt-3 border-t border-line pt-2 text-xs font-semibold text-muted">Who pays whom</p>
      @for (t of r.transfers; track $index) {
        <p class="mt-1 text-sm"><b>{{ t.from }}</b> pays <b>{{ t.to }}</b> <span class="font-bold text-brand">₹{{ n(t.amount) }}</span></p>
      } @empty {
        <p class="mt-1 text-sm text-muted">{{ r.total ? 'All settled — everyone paid their share 🎉' : 'Type the amounts above.' }}</p>
      }
      @if (r.transfers.length) {
        <a class="btn-primary mt-3 min-h-10 w-full" [href]="share()" target="_blank" rel="noopener">Send to WhatsApp group</a>
      }
    </div>
  `,
})
export class SplitTool {
  protected readonly people = signal([
    { name: 'Me', paid: 1200 },
    { name: 'Friend 1', paid: 0 },
    { name: 'Friend 2', paid: 300 },
  ]);
  protected readonly result = computed(() => settle(this.people().map((p) => ({ name: p.name.trim() || 'Someone', paid: p.paid }))));
  protected readonly share = computed(() => {
    const r = this.result();
    const lines = [`Bill split: total ₹${this.n(r.total)}, each ₹${this.n(r.share)}`, ...r.transfers.map((t) => `• ${t.from} → ${t.to}: ₹${this.n(t.amount)}`), 'Split with tools.spreadapps.in/split-bill-calculator'];
    return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
  });
  protected setName(i: number, e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.people.update((ps) => ps.map((p, j) => (j === i ? { ...p, name: v } : p)));
  }
  protected setPaid(i: number, e: Event) {
    const v = Math.max(0, Math.min(1e8, Number((e.target as HTMLInputElement).value) || 0));
    this.people.update((ps) => ps.map((p, j) => (j === i ? { ...p, paid: v } : p)));
  }
  protected add() {
    this.people.update((ps) => [...ps, { name: `Friend ${ps.length}`, paid: 0 }]);
  }
  protected remove(i: number) {
    this.people.update((ps) => ps.filter((_, j) => j !== i));
  }
  protected n(v: number) {
    return NUM.format(Math.round(v * 100) / 100);
  }
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
