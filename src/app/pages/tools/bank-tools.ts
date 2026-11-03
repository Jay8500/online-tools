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
/**
 * RBI lists branches by official name and street, so locality names people search for may not appear.
 * Each area also matches its PIN code and main road (Hyderabad first — most of our visitors).
 */
const AREA_ALIASES: Record<string, string[]> = {
  somajiguda: ['raj bhavan', 'rajbhavan', '500082'],
  punjagutta: ['panjagutta', '500082'],
  panjagutta: ['punjagutta', '500082'],
  'banjara hills': ['banjara', '500034'],
  'jubilee hills': ['jubilee', '500033'],
  madhapur: ['hitec', 'hitech', '500081'],
  'hitech city': ['hitec', 'madhapur', '500081'],
  'hitec city': ['hitech', 'madhapur', '500081'],
  gachibowli: ['500032'],
  kondapur: ['500084'],
  kukatpally: ['kphb', '500072'],
  ameerpet: ['500016'],
  begumpet: ['500016'],
  khairatabad: ['500004'],
  himayatnagar: ['himayat nagar', '500029'],
  abids: ['500001'],
  dilsukhnagar: ['dilsukh nagar', '500060'],
  'lb nagar': ['l b nagar', '500074'],
  secunderabad: ['500003'],
};
const PAGE = 30;
/** Short names people type → bank code (the full names in banks.json also match). */
const BANK_ALIASES: Record<string, string> = {
  sbi: 'SBIN', 'state bank': 'SBIN', hdfc: 'HDFC', icici: 'ICIC', axis: 'UTIB', canara: 'CNRB', union: 'UBIN', pnb: 'PUNB',
  kotak: 'KKBK', bob: 'BARB', baroda: 'BARB', 'indian bank': 'IDIB', iob: 'IOBA', boi: 'BKID', 'bank of india': 'BKID',
  central: 'CBIN', yes: 'YESB', idbi: 'IBKL', federal: 'FDRL', 'standard chartered': 'SCBL', 'karnataka bank': 'KARB',
  kvb: 'KVBL', 'karur vysya': 'KVBL', citi: 'CITI', hsbc: 'HSBC', au: 'AUBL', idfc: 'IDFB', bandhan: 'BDBL', uco: 'UCBA',
  indusind: 'INDB', 'south indian': 'SIBL', tmb: 'TMBL', 'city union': 'CIUB', rbl: 'RATN', dcb: 'DCBL',
  'bank of maharashtra': 'MAHB', 'punjab sind': 'PSIB', 'telangana grameena': 'TGRB', tgb: 'TGRB',
  'telangana cooperative': 'TSAB', tscab: 'TSAB', 'ap cooperative': 'APBL', apcob: 'APBL',
};
const TS_AP = ['telangana', 'andhra-pradesh'];

@Component({
  selector: 'app-ifsc-tool',
  imports: [Icon],
  template: `
    <div class="relative">
      <label class="sr-only" for="ifsc-q">Bank and area, or IFSC code</label>
      <svg lucideIcon="search" [size]="18" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input id="ifsc-q" class="input min-h-12 rounded-2xl pl-10 text-base" type="search" autocomplete="off" spellcheck="false"
             placeholder="sbi ameerpet  ·  hdfc kukatpally  ·  SBIN0001234" [value]="q()" (input)="onInput(val($event))" />
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <span class="text-muted">Try:</span>
      @for (ex of examples; track ex) { <button type="button" class="chip min-h-7 text-xs" (click)="onInput(ex)">{{ ex }}</button> }
      <label class="ml-auto flex items-center gap-1 text-muted">
        In
        <select class="rounded-lg border border-line bg-surface px-1.5 py-1 text-xs text-ink" aria-label="State" (change)="setState(val($event))">
          <option value="ts-ap" [selected]="where() === 'ts-ap'">Telangana & AP</option>
          @for (s of allStates(); track s) { <option [value]="s" [selected]="where() === s">{{ title(s) }}</option> }
        </select>
      </label>
    </div>

    <div class="mt-4" aria-live="polite">
      @if (code(); as x) {
        <!-- IFSC typed: show that branch -->
        @if (codeState() === 'loading') { <p class="text-sm text-muted">Checking {{ q().trim().toUpperCase() }}…</p> }
        @else if (codeState() === 'error') { <p class="text-sm text-rose-600" role="alert">{{ codeMsg() }}</p> }
        @else if (x.ifsc) {
          <div class="rounded-2xl border border-line bg-surface-2 p-4">
            <div class="flex items-start justify-between gap-2">
              <div><p class="text-lg font-bold">{{ x.bank }}</p><p class="text-sm font-semibold text-brand">{{ x.branch }}</p></div>
              <button type="button" class="btn-ghost min-h-9 shrink-0 px-3 text-xs" (click)="copy(x)"><svg lucideIcon="copy" [size]="14" /> Copy</button>
            </div>
            <p class="mt-2 text-sm">{{ x.address }}</p>
            <p class="mt-2 text-xs text-muted">IFSC <b class="font-mono text-ink">{{ x.ifsc }}</b> · MICR <b class="font-mono text-ink">{{ x.micr || '—' }}</b> · {{ x.city }}, {{ x.state }}</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              @for (p of flags(x); track p.name) { <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="p.ok ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-600'">{{ p.ok ? '✓' : '✗' }} {{ p.name }}</span> }
            </div>
          </div>
        }
      } @else if (!q().trim()) {
        <p class="text-sm text-muted">Type the <b>bank name and the area</b> together — like <i>sbi ameerpet</i> — or paste an IFSC code to check it.</p>
      } @else if (!bank()) {
        <p class="text-sm text-muted">Start with the bank name, e.g. <i>sbi</i>, <i>hdfc</i>, <i>canara</i>, then the area.</p>
        @if (bankHints().length) {
          <div class="mt-2 flex flex-wrap gap-1.5">
            @for (b of bankHints(); track b[0]) { <button type="button" class="chip min-h-8 text-xs" (click)="onInput(b[1] + ' ')">{{ b[1] }}</button> }
          </div>
        }
      } @else if (loading()) {
        <p class="text-sm text-muted">Loading {{ bank()![1] }} branches…</p>
      } @else {
        <p class="mb-2 text-xs font-semibold text-muted">
          {{ bank()![1] }} · {{ n(results().length) }} {{ results().length === 1 ? 'branch' : 'branches' }}{{ area() ? ' matching “' + area() + '”' : '' }} · {{ whereLabel() }}
        </p>
        <ul class="space-y-1.5">
          @for (r of results().slice(0, shown()); track r.row[0]) {
            <li class="rounded-2xl border border-line bg-surface-2 transition" [class.!border-brand/60]="open() === r.row[0]">
              <button type="button" class="flex w-full items-center gap-3 p-3 text-left" [attr.aria-expanded]="open() === r.row[0]" (click)="open.set(open() === r.row[0] ? null : r.row[0])">
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-semibold">{{ r.row[1] }}</span>
                  <span class="block truncate text-xs text-muted">{{ r.row[2] }}{{ r.row[3] && r.row[3] !== r.row[2] ? ' · ' + r.row[3] : '' }}</span>
                </span>
                <span class="shrink-0 font-mono text-sm font-bold text-brand">{{ r.row[0] }}</span>
              </button>
              @if (open() === r.row[0]) {
                <div class="border-t border-line px-3 pt-2 pb-3 text-sm">
                  <p>{{ r.row[4] }}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-1.5">
                    <span class="text-xs text-muted">MICR {{ r.row[5] || '—' }}</span>
                    @for (p of flags(rowToBranch(r)); track p.name) { <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="p.ok ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-600'">{{ p.ok ? '✓' : '✗' }} {{ p.name }}</span> }
                    <button type="button" class="btn-ghost ml-auto min-h-8 px-3 text-xs" (click)="copy(rowToBranch(r))"><svg lucideIcon="copy" [size]="14" /> Copy</button>
                  </div>
                </div>
              }
            </li>
          } @empty {
            <li class="rounded-2xl border border-dashed border-line p-4 text-sm">
              <p class="font-semibold">No {{ bank()![1] }} branch matches “{{ area() }}” in {{ whereLabel() }}.</p>
              <p class="mt-1 text-muted">RBI lists branches by their official name and road. Try a nearby area, the road name or PIN code — or change the state above.</p>
            </li>
          }
        </ul>
        @if (results().length > shown()) {
          <button type="button" class="btn-ghost mt-2 min-h-10 w-full text-sm" (click)="shown.set(shown() + PAGE)">Show more ({{ n(results().length - shown()) }} left)</button>
        }
      }
    </div>
  `,
})
export class IfscTool {
  private readonly toast = inject(ToastService);
  protected readonly PAGE = PAGE;
  protected readonly examples = ['sbi ameerpet', 'hdfc kukatpally', 'icici gachibowli'];
  protected readonly q = signal('');
  protected readonly where = signal('ts-ap');
  protected readonly banks = signal<[string, string, number][]>([]);
  protected readonly allStates = signal<string[]>([]);
  protected readonly bank = signal<[string, string, number] | null>(null);
  protected readonly area = signal('');
  protected readonly rows = signal<{ row: Row; state: string }[]>([]);
  protected readonly loading = signal(false);
  protected readonly shown = signal(PAGE);
  protected readonly open = signal<string | null>(null);
  // IFSC-code path
  protected readonly code = signal<Branch | null>(null);
  protected readonly codeState = signal<'idle' | 'loading' | 'error'>('idle');
  protected readonly codeMsg = signal('');
  private readonly cache = new Map<string, Row[]>();
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly bankHints = computed(() => {
    const t = this.q().trim().toLowerCase();
    return t.length < 2 ? [] : this.banks().filter((b) => b[1].toLowerCase().includes(t)).slice(0, 6);
  });
  protected readonly results = computed(() => {
    const raw = this.area().toLowerCase();
    const words = raw.split(/\s+/).filter(Boolean);
    const alias = AREA_ALIASES[raw] ?? [];
    return this.rows().filter(({ row }) => {
      if (!words.length) return true;
      const text = `${row[1]} ${row[2]} ${row[3]} ${row[4]}`.toLowerCase();
      return words.every((w) => text.includes(w)) || alias.some((a) => text.includes(a));
    });
  });
  protected readonly whereLabel = computed(() => (this.where() === 'ts-ap' ? 'Telangana & AP' : this.title(this.where())));

  constructor() {
    afterNextRender(() =>
      fetch(`${DATA}/banks.json`)
        .then((r) => r.json())
        .then((b: [string, string, number][]) => this.banks.set(b))
        .catch(() => undefined),
    );
  }

  protected val(e: Event) {
    return (e.target as HTMLInputElement | HTMLSelectElement).value;
  }
  protected title(slug: string) {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\b(And|Of)\b/g, (m) => m.toLowerCase());
  }
  protected n(v: number) {
    return INR.format(v);
  }

  protected onInput(v: string) {
    this.q.set(v);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.run(), 220);
  }
  protected setState(s: string) {
    this.where.set(s);
    this.run();
  }

  /** IFSC code → live check; otherwise split "bank + area" and search that bank's branches in the chosen state(s). */
  private async run() {
    const text = this.q().trim();
    this.open.set(null);
    this.shown.set(PAGE);
    const compact = text.toUpperCase().replace(/\s+/g, '');
    if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(compact)) return this.check(compact);
    this.code.set(null);
    const found = this.matchBank(text.toLowerCase());
    this.bank.set(found?.bank ?? null);
    this.area.set(found?.rest ?? '');
    if (!found) return this.rows.set([]);
    await this.loadRows(found.bank[0]);
  }

  private matchBank(t: string): { bank: [string, string, number]; rest: string } | null {
    const banks = this.banks();
    if (!t || !banks.length) return null;
    // Longest alias or bank name the text starts with
    const cands: { code: string; len: number }[] = [];
    for (const [a, c] of Object.entries(BANK_ALIASES)) if (t === a || t.startsWith(a + ' ')) cands.push({ code: c, len: a.length });
    for (const b of banks) {
      const name = b[1].toLowerCase();
      if (t === name || t.startsWith(name + ' ')) cands.push({ code: b[0], len: name.length });
      const c = b[0].toLowerCase();
      if (t === c || t.startsWith(c + ' ')) cands.push({ code: b[0], len: c.length });
    }
    const best = cands.sort((x, y) => y.len - x.len)[0];
    const bank = best && banks.find((b) => b[0] === best.code);
    return bank ? { bank, rest: t.slice(best.len).trim() } : null;
  }

  private async loadRows(code: string) {
    this.loading.set(true);
    try {
      const idx = (await this.json(`${DATA}/${code}/index.json`)) as StateIdx[];
      this.allStates.set([...new Set([...this.allStates(), ...idx.map((s) => s[1])])].sort());
      const slugs = this.where() === 'ts-ap' ? TS_AP : [this.where()];
      const lists = await Promise.all(
        slugs.filter((s) => idx.some((i) => i[1] === s)).map(async (s) => ((await this.json(`${DATA}/${code}/${s}.json`)) as Row[]).map((row) => ({ row, state: s }))),
      );
      if (this.bank()?.[0] === code) this.rows.set(lists.flat());
    } catch {
      this.rows.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async json(url: string) {
    if (this.cache.has(url)) return this.cache.get(url)!;
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    this.cache.set(url, j);
    return j;
  }

  private async check(c: string) {
    this.code.set({ ifsc: '' } as Branch);
    this.codeState.set('loading');
    try {
      const r = await fetch(`https://ifsc.razorpay.com/${c}`, { signal: AbortSignal.timeout(10000) });
      if (r.status === 404) throw new Error('notfound');
      if (!r.ok) throw new Error('server');
      const x = await r.json();
      this.code.set({ bank: x.BANK, ifsc: x.IFSC, branch: x.BRANCH, address: x.ADDRESS, city: x.CITY, district: x.DISTRICT, state: x.STATE, micr: x.MICR ?? '', neft: x.NEFT, rtgs: x.RTGS, imps: x.IMPS, upi: x.UPI });
      this.codeState.set('idle');
    } catch (e) {
      this.codeMsg.set((e as Error).message === 'notfound' ? `No branch found for ${c}. Check the code on your cheque or passbook.` : 'Couldn’t check right now. Please try again in a minute.');
      this.codeState.set('error');
    }
  }

  protected rowToBranch(r: { row: Row; state: string }): Branch {
    const f = r.row[6];
    return { bank: this.bank()?.[1] ?? '', ifsc: r.row[0], branch: r.row[1], district: r.row[2], city: r.row[3], address: r.row[4], micr: r.row[5], state: this.title(r.state), neft: !!(f & 1), rtgs: !!(f & 2), imps: !!(f & 4), upi: !!(f & 8) };
  }
  protected flags(x: Branch) {
    return [
      { name: 'NEFT', ok: x.neft },
      { name: 'RTGS', ok: x.rtgs },
      { name: 'IMPS', ok: x.imps },
      { name: 'UPI', ok: x.upi },
    ];
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
