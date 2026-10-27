import { Component, computed, signal } from '@angular/core';
import { localIso } from '../../core/dates';
import { amountInWords } from '../../core/invoice';
import { ToastService } from '../../core/toast.service';
import { inject } from '@angular/core';
import { Icon } from '../../shared/icon';
import { NumField } from '../../shared/num-field';

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const MONTH = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });

// ---------------- Rent receipt generator ----------------
type Mode = 'UPI' | 'Bank transfer' | 'Cash' | 'Cheque';

@Component({
  selector: 'app-rent-receipt-tool',
  imports: [NumField, Icon],
  template: `
    <div class="grid gap-4 lg:grid-cols-2">
      <form class="space-y-3 print:hidden" (submit)="$event.preventDefault(); print()" novalidate>
        <div class="grid gap-3 sm:grid-cols-2">
          <div [class.field-invalid]="tried() && !tenant().trim()">
            <label class="label" for="rr-tenant">Tenant name <span class="text-rose-600">*</span></label>
            <input id="rr-tenant" class="input" maxlength="60" [value]="tenant()" (input)="tenant.set(val($event))" />
          </div>
          <div [class.field-invalid]="tried() && !owner().trim()">
            <label class="label" for="rr-owner">Owner (landlord) name <span class="text-rose-600">*</span></label>
            <input id="rr-owner" class="input" maxlength="60" [value]="owner()" (input)="owner.set(val($event))" />
          </div>
        </div>
        <div [class.field-invalid]="tried() && !address().trim()">
          <label class="label" for="rr-addr">House address <span class="text-rose-600">*</span></label>
          <textarea id="rr-addr" class="input min-h-16 py-2" maxlength="200" [value]="address()" (input)="address.set(val($event))"></textarea>
        </div>
        <app-num-field label="Monthly rent" prefix="₹" [(value)]="rent" [min]="1" [max]="10000000" [step]="500" [slider]="false" />
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="rr-from">From month</label>
            <input id="rr-from" type="month" class="input" [value]="from()" (input)="from.set(val($event) || from())" />
          </div>
          <div>
            <label class="label" for="rr-to">To month</label>
            <input id="rr-to" type="month" class="input" [value]="to()" (input)="to.set(val($event) || to())" />
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="label" for="rr-mode">Paid by</label>
            <select id="rr-mode" class="input" (change)="mode.set($any(val($event)))">
              @for (m of modes; track m) { <option [value]="m" [selected]="mode() === m">{{ m }}</option> }
            </select>
          </div>
          <div [class.field-invalid]="tried() && panNeeded() && !panOk()">
            <label class="label" for="rr-pan">Owner PAN {{ panNeeded() ? '(needed)' : '(optional)' }}</label>
            <input id="rr-pan" class="input uppercase" maxlength="10" placeholder="ABCDE1234F" [value]="pan()" (input)="pan.set(val($event).toUpperCase())" />
          </div>
        </div>
        @if (panNeeded()) { <p class="text-xs text-muted">Yearly rent is over ₹1 lakh, so employers ask for the owner’s PAN.</p> }
        @if (tried() && problem(); as p) { <p class="text-xs font-medium text-rose-600" role="alert">{{ p }}</p> }
        <button type="submit" class="btn-primary w-full"><svg lucideIcon="printer" [size]="16" /> Print / Save PDF ({{ months().length }} {{ months().length === 1 ? 'receipt' : 'receipts' }})</button>
      </form>

      <div>
        <p class="label print:hidden">Preview</p>
        <div class="print-area space-y-3">
          @for (m of months(); track m) {
            <div class="break-inside-avoid rounded-xl border border-slate-300 bg-white p-4 text-[13px] leading-relaxed text-slate-900">
              <div class="flex items-baseline justify-between border-b border-slate-200 pb-1">
                <b class="text-base">RENT RECEIPT</b><span class="text-xs">{{ m }}</span>
              </div>
              <p class="mt-2">
                Received with thanks from <b>{{ tenant() || '______' }}</b> the sum of <b>₹{{ inr(rent()) }}</b>
                ({{ words() }}) by <b>{{ mode() }}</b> towards rent of <b>{{ address() || '______' }}</b> for the month of <b>{{ m }}</b>.
              </p>
              <div class="mt-3 flex items-end justify-between gap-3">
                <div class="text-xs">
                  <p>Owner: <b>{{ owner() || '______' }}</b></p>
                  @if (pan()) { <p>PAN: <b>{{ pan() }}</b></p> }
                </div>
                <div class="flex items-end gap-3">
                  @if (mode() === 'Cash' && rent() > 5000) { <div class="grid size-14 place-items-center border border-dashed border-slate-400 text-center text-[9px]">Revenue<br />stamp</div> }
                  <div class="w-32 border-t border-slate-400 pt-1 text-center text-[11px]">Owner’s signature</div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class RentReceiptTool {
  private readonly toast = inject(ToastService);
  protected readonly modes: Mode[] = ['UPI', 'Bank transfer', 'Cash', 'Cheque'];
  protected readonly tenant = signal('');
  protected readonly owner = signal('');
  protected readonly address = signal('');
  protected readonly pan = signal('');
  protected readonly rent = signal(15000);
  protected readonly mode = signal<Mode>('UPI');
  // Default: this financial year, April → the current month
  protected readonly from = signal(fyStart());
  protected readonly to = signal(localIso().slice(0, 7));
  protected readonly tried = signal(false);

  protected readonly months = computed(() => {
    const [fy, fm] = this.from().split('-').map(Number);
    const [ty, tm] = this.to().split('-').map(Number);
    const out: string[] = [];
    for (let y = fy, m = fm; (y < ty || (y === ty && m <= tm)) && out.length < 24; m === 12 ? (y++, (m = 1)) : m++) {
      out.push(MONTH.format(new Date(y, m - 1, 1)));
    }
    return out;
  });
  protected readonly words = computed(() => amountInWords(this.rent()));
  protected readonly panNeeded = computed(() => this.rent() * 12 > 100000);
  protected readonly panOk = computed(() => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(this.pan()));
  protected readonly problem = computed(() => {
    if (!this.tenant().trim() || !this.owner().trim() || !this.address().trim()) return 'Fill tenant, owner and address.';
    if (!this.months().length) return '“From month” must be before “To month”.';
    if (this.panNeeded() && !this.panOk()) return 'Enter the owner’s PAN like ABCDE1234F.';
    if (!this.panNeeded() && this.pan() && !this.panOk()) return 'PAN looks wrong — it is like ABCDE1234F.';
    return null;
  });

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  protected inr(v: number) {
    return INR.format(v);
  }
  protected print() {
    this.tried.set(true);
    const p = this.problem();
    if (p) return this.toast.warn(p);
    window.print();
  }
}

function fyStart() {
  const d = new Date();
  return `${d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1}-04`;
}

// ---------------- IFSC code lookup ----------------
interface Branch {
  BANK: string;
  BRANCH: string;
  ADDRESS: string;
  CITY: string;
  DISTRICT: string;
  STATE: string;
  MICR: string | null;
  IFSC: string;
  NEFT: boolean;
  RTGS: boolean;
  IMPS: boolean;
  UPI: boolean;
}

@Component({
  selector: 'app-ifsc-tool',
  imports: [Icon],
  template: `
    <form class="flex gap-2" (submit)="$event.preventDefault(); find()">
      <label class="sr-only" for="ifsc">IFSC code</label>
      <input id="ifsc" class="input flex-1 font-mono uppercase tracking-wider" maxlength="11" placeholder="SBIN0001234" autocomplete="off"
             [value]="code()" (input)="code.set(val($event))" />
      <button type="submit" class="btn-primary shrink-0" [disabled]="state() === 'loading'">{{ state() === 'loading' ? 'Checking…' : 'Check' }}</button>
    </form>
    <p class="mt-1 text-xs" [class.text-rose-600]="state() === 'error'" [class.text-muted]="state() !== 'error'" role="status">
      {{ state() === 'error' ? msg() : 'IFSC is 11 characters: 4 letters, 0, then 6 letters/numbers. It is on your cheque book and passbook.' }}
    </p>

    @if (b(); as x) {
      <div class="mt-4 rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-lg font-bold">{{ x.BANK }}</p>
            <p class="text-sm font-semibold text-brand">{{ x.BRANCH }}</p>
          </div>
          <button type="button" class="btn-ghost min-h-9 shrink-0 px-3 text-xs" (click)="copy(x)"><svg lucideIcon="copy" [size]="14" /> Copy</button>
        </div>
        <p class="mt-2 text-sm">{{ x.ADDRESS }}</p>
        <ul class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-2 text-sm">
          <li><span class="text-muted">IFSC</span> <b class="font-mono">{{ x.IFSC }}</b></li>
          <li><span class="text-muted">MICR</span> <b class="font-mono">{{ x.MICR || '—' }}</b></li>
          <li><span class="text-muted">City</span> {{ x.CITY }}</li>
          <li><span class="text-muted">State</span> {{ x.STATE }}</li>
        </ul>
        <div class="mt-3 flex flex-wrap gap-1.5">
          @for (p of pay(x); track p.name) {
            <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="p.ok ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-600'">{{ p.ok ? '✓' : '✗' }} {{ p.name }}</span>
          }
        </div>
      </div>
    }
  `,
})
export class IfscTool {
  private readonly toast = inject(ToastService);
  protected readonly code = signal('');
  protected readonly b = signal<Branch | null>(null);
  protected readonly state = signal<'idle' | 'loading' | 'error'>('idle');
  protected readonly msg = signal('');

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  protected async find() {
    const c = this.code().trim().toUpperCase().replace(/\s+/g, '');
    this.code.set(c);
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(c)) {
      this.b.set(null);
      this.msg.set('That doesn’t look like an IFSC. Example: SBIN0001234 (5th character is always zero).');
      return this.state.set('error');
    }
    this.state.set('loading');
    try {
      const r = await fetch(`https://ifsc.razorpay.com/${c}`, { signal: AbortSignal.timeout(10000) });
      if (r.status === 404) throw new Error('notfound');
      if (!r.ok) throw new Error('server');
      this.b.set((await r.json()) as Branch);
      this.state.set('idle');
    } catch (e) {
      this.b.set(null);
      this.msg.set((e as Error).message === 'notfound' ? `No branch found for ${c}. Check the code on your cheque or passbook.` : 'Couldn’t check right now. Please try again in a minute.');
      this.state.set('error');
    }
  }
  protected pay(x: Branch) {
    return [
      { name: 'NEFT', ok: x.NEFT },
      { name: 'RTGS', ok: x.RTGS },
      { name: 'IMPS', ok: x.IMPS },
      { name: 'UPI', ok: x.UPI },
    ];
  }
  protected async copy(x: Branch) {
    try {
      await navigator.clipboard.writeText(`${x.BANK}, ${x.BRANCH}\nIFSC: ${x.IFSC}\nMICR: ${x.MICR ?? '-'}\n${x.ADDRESS}`);
      this.toast.show('Copied', 'success', 1500);
    } catch {
      /* clipboard blocked */
    }
  }
}
