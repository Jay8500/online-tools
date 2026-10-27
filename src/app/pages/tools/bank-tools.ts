import { Component, afterNextRender, computed, signal } from '@angular/core';
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

// ---------------- IFSC: find by branch + check a code ----------------
/** One branch as shown on screen (from the live API or our static search data). */
interface Branch {
  bank: string;
  ifsc: string;
  branch: string;
  address: string;
  city: string;
  district: string;
  state: string;
  micr: string;
  neft: boolean;
  rtgs: boolean;
  imps: boolean;
  upi: boolean;
}
/** Static search data row: [IFSC, branch, district, city, address, micr, flags] (see scripts/update-ifsc.mjs) */
type Row = [string, string, string, string, string, string, number];
type StateIdx = [string, string, number, string[]];
const DATA = '/data/ifsc';
const PAGE = 30;

@Component({
  selector: 'app-ifsc-tool',
  imports: [Icon],
  template: `
    <div class="flex rounded-xl border border-line bg-surface-2 p-1 text-sm font-semibold" role="tablist" aria-label="IFSC tool">
      <button type="button" role="tab" class="flex-1 rounded-lg px-3 py-1.5 transition" [class]="mode() === 'find' ? 'bg-surface text-brand shadow-sm' : 'text-muted'" [attr.aria-selected]="mode() === 'find'" (click)="mode.set('find')">Find IFSC by branch</button>
      <button type="button" role="tab" class="flex-1 rounded-lg px-3 py-1.5 transition" [class]="mode() === 'check' ? 'bg-surface text-brand shadow-sm' : 'text-muted'" [attr.aria-selected]="mode() === 'check'" (click)="mode.set('check')">Check an IFSC</button>
    </div>

    @if (mode() === 'find') {
      <!-- 1. Bank (searchable) -->
      <div class="relative mt-4">
        <label class="label" for="ifsc-bank">Bank</label>
        <input id="ifsc-bank" class="input" role="combobox" autocomplete="off" [attr.aria-expanded]="bankOpen()" aria-controls="ifsc-bank-list"
               [placeholder]="bank()?.[1] ?? 'Type your bank — SBI, HDFC, Canara…'" [value]="bankText()"
               (focus)="bankOpen.set(true)" (input)="bankText.set(val($event)); bankOpen.set(true); active.set(0)" (keydown)="bankKey($event)" (blur)="closeBankSoon()" />
        @if (bankOpen()) {
          <ul id="ifsc-bank-list" role="listbox" class="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-xl">
            @if (!banks()) { <li class="px-3 py-2 text-sm text-muted">{{ banksError() ? 'Bank list is not available right now. Use “Check an IFSC”.' : 'Loading banks…' }}</li> }
            @for (b of bankMatches(); track b[0]; let i = $index) {
              <li role="option" [attr.aria-selected]="i === active()" class="flex cursor-pointer items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-sm"
                  [class.bg-brand]="i === active()" [class.text-white]="i === active()" (mousedown)="$event.preventDefault(); pickBank(b)" (mouseenter)="active.set(i)">
                <span class="font-semibold">{{ b[1] }}</span><span class="shrink-0 text-xs" [class.text-muted]="i !== active()">{{ n(b[2]) }} branches</span>
              </li>
            } @empty {
              @if (banks()) { <li class="px-3 py-2 text-sm text-muted">No bank matches “{{ bankText() }}”.</li> }
            }
          </ul>
        }
      </div>

      @if (bank()) {
        <!-- 2. State + district -->
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="ifsc-state">State</label>
            <select id="ifsc-state" class="input" (change)="pickState(val($event))" [disabled]="!states().length">
              @for (s of states(); track s[1]) { <option [value]="s[1]" [selected]="state()?.[1] === s[1]">{{ s[0] }} ({{ n(s[2]) }})</option> }
            </select>
          </div>
          <div>
            <label class="label" for="ifsc-district">District</label>
            <select id="ifsc-district" class="input" (change)="district.set(val($event)); shown.set(PAGE)" [disabled]="!state()">
              <option value="">All districts</option>
              @for (d of state()?.[3] ?? []; track d) { <option [value]="d" [selected]="district() === d">{{ d }}</option> }
            </select>
          </div>
        </div>

        <!-- 3. Branch / area -->
        <div class="relative mt-3">
          <label class="label" for="ifsc-q">Branch or area</label>
          <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute bottom-3.5 left-3 text-muted" />
          <input id="ifsc-q" class="input pl-9" type="search" placeholder="e.g. Kukatpally, Ameerpet, main branch" [value]="q()" (input)="q.set(val($event)); shown.set(PAGE)" />
        </div>

        <!-- Results -->
        <div class="mt-4" aria-live="polite">
          @if (loading()) {
            <p class="text-sm text-muted">Loading branches…</p>
          } @else if (rows()) {
            <p class="mb-2 text-xs font-semibold text-muted">{{ n(results().length) }} {{ results().length === 1 ? 'branch' : 'branches' }}{{ q().trim() ? ' match “' + q().trim() + '”' : '' }}</p>
            <ul class="space-y-1.5">
              @for (r of results().slice(0, shown()); track r[0]) {
                <li class="rounded-2xl border border-line bg-surface-2 transition" [class.!border-brand/60]="open() === r[0]">
                  <button type="button" class="flex w-full items-center gap-3 p-3 text-left" [attr.aria-expanded]="open() === r[0]" (click)="open.set(open() === r[0] ? null : r[0])">
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-sm font-semibold">{{ r[1] }}</span>
                      <span class="block text-xs text-muted">{{ r[2] }}{{ r[3] && r[3] !== r[2] ? ' · ' + r[3] : '' }}</span>
                    </span>
                    <span class="shrink-0 font-mono text-sm font-bold text-brand">{{ r[0] }}</span>
                  </button>
                  @if (open() === r[0]) {
                    <div class="border-t border-line px-3 pt-2 pb-3 text-sm">
                      <p>{{ r[4] }}</p>
                      <p class="mt-1 text-xs text-muted">MICR {{ r[5] || '—' }}</p>
                      <div class="mt-2 flex flex-wrap items-center gap-1.5">
                        @for (p of payFlags(r[6]); track p.name) {
                          <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="p.ok ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-600'">{{ p.ok ? '✓' : '✗' }} {{ p.name }}</span>
                        }
                        <button type="button" class="btn-ghost ml-auto min-h-8 px-3 text-xs" (click)="copy(fromRow(r))"><svg lucideIcon="copy" [size]="14" /> Copy</button>
                      </div>
                    </div>
                  }
                </li>
              } @empty {
                <li class="text-sm text-muted">No branch found. Try a shorter word, or choose “All districts”.</li>
              }
            </ul>
            @if (results().length > shown()) {
              <button type="button" class="btn-ghost mt-2 min-h-10 w-full text-sm" (click)="shown.set(shown() + PAGE)">Show more ({{ n(results().length - shown()) }} left)</button>
            }
          } @else if (rowsError()) {
            <p class="text-sm text-rose-600" role="alert">Couldn’t load branches right now. Please try again in a minute.</p>
          }
        </div>
      }
    } @else {
      <form class="mt-4 flex gap-2" (submit)="$event.preventDefault(); find()">
        <label class="sr-only" for="ifsc">IFSC code</label>
        <input id="ifsc" class="input flex-1 font-mono uppercase tracking-wider" maxlength="11" placeholder="SBIN0001234" autocomplete="off"
               [value]="code()" (input)="code.set(val($event))" />
        <button type="submit" class="btn-primary shrink-0" [disabled]="state2() === 'loading'">{{ state2() === 'loading' ? 'Checking…' : 'Check' }}</button>
      </form>
      <p class="mt-1 text-xs" [class.text-rose-600]="state2() === 'error'" [class.text-muted]="state2() !== 'error'" role="status">
        {{ state2() === 'error' ? msg() : 'IFSC is 11 characters: 4 letters, 0, then 6 letters/numbers. It is on your cheque book and passbook.' }}
      </p>
      @if (b(); as x) {
        <div class="mt-4 rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-lg font-bold">{{ x.bank }}</p>
              <p class="text-sm font-semibold text-brand">{{ x.branch }}</p>
            </div>
            <button type="button" class="btn-ghost min-h-9 shrink-0 px-3 text-xs" (click)="copy(x)"><svg lucideIcon="copy" [size]="14" /> Copy</button>
          </div>
          <p class="mt-2 text-sm">{{ x.address }}</p>
          <ul class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-2 text-sm">
            <li><span class="text-muted">IFSC</span> <b class="font-mono">{{ x.ifsc }}</b></li>
            <li><span class="text-muted">MICR</span> <b class="font-mono">{{ x.micr || '—' }}</b></li>
            <li><span class="text-muted">City</span> {{ x.city }}</li>
            <li><span class="text-muted">State</span> {{ x.state }}</li>
          </ul>
          <div class="mt-3 flex flex-wrap gap-1.5">
            @for (p of [{ name: 'NEFT', ok: x.neft }, { name: 'RTGS', ok: x.rtgs }, { name: 'IMPS', ok: x.imps }, { name: 'UPI', ok: x.upi }]; track p.name) {
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="p.ok ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-600'">{{ p.ok ? '✓' : '✗' }} {{ p.name }}</span>
            }
          </div>
        </div>
      }
    }
  `,
})
export class IfscTool {
  private readonly toast = inject(ToastService);
  protected readonly PAGE = PAGE;
  protected readonly mode = signal<'find' | 'check'>('find');

  // ---- find by branch ----
  protected readonly banks = signal<[string, string, number][] | null>(null);
  protected readonly banksError = signal(false);
  protected readonly bank = signal<[string, string, number] | null>(null);
  protected readonly bankText = signal('');
  protected readonly bankOpen = signal(false);
  protected readonly active = signal(0);
  protected readonly states = signal<StateIdx[]>([]);
  protected readonly state = signal<StateIdx | null>(null);
  protected readonly district = signal('');
  protected readonly q = signal('');
  protected readonly rows = signal<Row[] | null>(null);
  protected readonly rowsError = signal(false);
  protected readonly loading = signal(false);
  protected readonly shown = signal(PAGE);
  protected readonly open = signal<string | null>(null);
  private bankTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly bankMatches = computed(() => {
    const list = this.banks() ?? [];
    const t = this.bankText().trim().toLowerCase();
    if (!t) return list.slice(0, 40);
    return list.filter((b) => b[1].toLowerCase().includes(t) || b[0].toLowerCase().startsWith(t)).slice(0, 40);
  });
  protected readonly results = computed(() => {
    const rows = this.rows() ?? [];
    const d = this.district();
    const words = this.q().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((r) => (!d || r[2] === d) && words.every((w) => `${r[1]} ${r[3]} ${r[4]} ${r[0]}`.toLowerCase().includes(w)));
  });

  constructor() {
    afterNextRender(() =>
      fetch(`${DATA}/banks.json`)
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((b) => this.banks.set(b))
        .catch(() => this.banksError.set(true)),
    );
  }

  protected bankKey(e: KeyboardEvent) {
    const n = this.bankMatches().length;
    if (e.key === 'ArrowDown') (e.preventDefault(), this.bankOpen.set(true), this.active.update((i) => (n ? (i + 1) % n : 0)));
    else if (e.key === 'ArrowUp') (e.preventDefault(), this.active.update((i) => (n ? (i - 1 + n) % n : 0)));
    else if (e.key === 'Enter' && this.bankOpen() && n) (e.preventDefault(), this.pickBank(this.bankMatches()[this.active()]));
    else if (e.key === 'Escape') this.bankOpen.set(false);
  }
  protected closeBankSoon() {
    clearTimeout(this.bankTimer);
    this.bankTimer = setTimeout(() => this.bankOpen.set(false), 120);
  }
  protected async pickBank(b: [string, string, number]) {
    this.bank.set(b);
    this.bankText.set('');
    this.bankOpen.set(false);
    this.states.set([]);
    this.state.set(null);
    this.rows.set(null);
    try {
      const r = await fetch(`${DATA}/${b[0]}/index.json`);
      if (!r.ok) throw new Error();
      const idx = (await r.json()) as StateIdx[];
      this.states.set(idx);
      // Most visitors are from Telangana / AP — start there when the bank has branches in it
      const start = idx.find((s) => s[1] === 'telangana') ?? idx.find((s) => s[1] === 'andhra-pradesh') ?? [...idx].sort((a, z) => z[2] - a[2])[0];
      if (start) await this.pickState(start[1]);
    } catch {
      this.rowsError.set(true);
    }
  }
  protected async pickState(slug: string) {
    const s = this.states().find((x) => x[1] === slug) ?? null;
    const b = this.bank();
    this.state.set(s);
    this.district.set('');
    this.shown.set(PAGE);
    this.open.set(null);
    if (!s || !b) return;
    this.loading.set(true);
    this.rowsError.set(false);
    try {
      const r = await fetch(`${DATA}/${b[0]}/${s[1]}.json`);
      if (!r.ok) throw new Error();
      if (this.state() === s) this.rows.set((await r.json()) as Row[]);
    } catch {
      this.rows.set(null);
      this.rowsError.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  protected payFlags(f: number) {
    return [
      { name: 'NEFT', ok: !!(f & 1) },
      { name: 'RTGS', ok: !!(f & 2) },
      { name: 'IMPS', ok: !!(f & 4) },
      { name: 'UPI', ok: !!(f & 8) },
    ];
  }
  protected fromRow(r: Row): Branch {
    return { bank: this.bank()?.[1] ?? '', ifsc: r[0], branch: r[1], district: r[2], city: r[3], address: r[4], micr: r[5], state: this.state()?.[0] ?? '', neft: !!(r[6] & 1), rtgs: !!(r[6] & 2), imps: !!(r[6] & 4), upi: !!(r[6] & 8) };
  }

  // ---- check a code ----
  protected readonly code = signal('');
  protected readonly b = signal<Branch | null>(null);
  protected readonly state2 = signal<'idle' | 'loading' | 'error'>('idle');
  protected readonly msg = signal('');

  protected async find() {
    const c = this.code().trim().toUpperCase().replace(/\s+/g, '');
    this.code.set(c);
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(c)) {
      this.b.set(null);
      this.msg.set('That doesn’t look like an IFSC. Example: SBIN0001234 (5th character is always zero).');
      return this.state2.set('error');
    }
    this.state2.set('loading');
    try {
      const r = await fetch(`https://ifsc.razorpay.com/${c}`, { signal: AbortSignal.timeout(10000) });
      if (r.status === 404) throw new Error('notfound');
      if (!r.ok) throw new Error('server');
      const x = await r.json();
      this.b.set({ bank: x.BANK, ifsc: x.IFSC, branch: x.BRANCH, address: x.ADDRESS, city: x.CITY, district: x.DISTRICT, state: x.STATE, micr: x.MICR ?? '', neft: x.NEFT, rtgs: x.RTGS, imps: x.IMPS, upi: x.UPI });
      this.state2.set('idle');
    } catch (e) {
      this.b.set(null);
      this.msg.set((e as Error).message === 'notfound' ? `No branch found for ${c}. Check the code on your cheque or passbook.` : 'Couldn’t check right now. Please try again in a minute.');
      this.state2.set('error');
    }
  }

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
  protected n(v: number) {
    return INR.format(v);
  }
  protected async copy(x: Branch) {
    try {
      await navigator.clipboard.writeText(`${x.bank}, ${x.branch}\nIFSC: ${x.ifsc}\nMICR: ${x.micr || '-'}\n${x.address}`);
      this.toast.show('Copied', 'success', 1500);
    } catch {
      /* clipboard blocked */
    }
  }
}
