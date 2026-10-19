import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { DialogService } from '../../core/dialog.service';
import { GST_STATES, InvoiceItem, amountInWords, gstinError, invoiceTotals, stateName } from '../../core/invoice';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

interface Party {
  name: string;
  address: string;
  gstin: string;
  state: string;
  phone: string;
}

interface Invoice {
  seller: Party;
  buyer: Party;
  number: string;
  date: string;
  items: InvoiceItem[];
  notes: string;
  bank: string;
  logo: string;
}

const DRAFT = 'gst-invoice-draft';
const RATES = [0, 5, 18, 40, 3, 0.25];
const today = () => new Date().toISOString().slice(0, 10);

function blank(): Invoice {
  return {
    seller: { name: '', address: '', gstin: '', state: '36', phone: '' },
    buyer: { name: '', address: '', gstin: '', state: '36', phone: '' },
    number: 'INV-001',
    date: today(),
    items: [{ desc: '', hsn: '', qty: 1, rate: 0, gst: 18 }],
    notes: 'Thank you for your business.',
    bank: '',
    logo: '',
  };
}

@Component({
  selector: 'app-invoice-tool',
  imports: [Icon],
  template: `
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <!-- Form -->
      <form class="space-y-4 print:hidden" (submit)="$event.preventDefault(); print()" novalidate>
        @for (side of sides; track side.key) {
          @let p = inv()[side.key];
          <fieldset class="rounded-2xl border border-line p-3">
            <legend class="px-1 text-sm font-semibold">{{ side.title }}</legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2" [class.field-invalid]="!!errs()[side.key + 'Name']">
                <label class="label" [for]="side.key + '-name'">{{ side.key === 'seller' ? 'Business name' : 'Customer name' }} <span class="text-rose-600">*</span></label>
                <input class="input" [id]="side.key + '-name'" maxlength="80" [value]="p.name" (input)="setParty(side.key, 'name', $event)" />
                @if (errs()[side.key + 'Name']) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ errs()[side.key + 'Name'] }}</p> }
              </div>
              <div class="sm:col-span-2">
                <label class="label" [for]="side.key + '-addr'">Address</label>
                <textarea class="input" rows="2" [id]="side.key + '-addr'" maxlength="200" [value]="p.address" (input)="setParty(side.key, 'address', $event)"></textarea>
              </div>
              <div [class.field-invalid]="!!errs()[side.key + 'Gstin']">
                <label class="label" [for]="side.key + '-gstin'">GSTIN {{ side.key === 'buyer' ? '(if registered)' : '' }}</label>
                <input class="input font-mono uppercase" [id]="side.key + '-gstin'" maxlength="15" placeholder="36ABCDE1234F1Z5" [value]="p.gstin" (input)="setParty(side.key, 'gstin', $event)" />
                @if (errs()[side.key + 'Gstin']) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ errs()[side.key + 'Gstin'] }}</p> }
              </div>
              <div>
                <label class="label" [for]="side.key + '-state'">{{ side.key === 'buyer' ? 'Place of supply' : 'State' }}</label>
                <select class="input" [id]="side.key + '-state'" [value]="p.state" (change)="setParty(side.key, 'state', $event)">
                  @for (s of states; track s.code) { <option [value]="s.code" [selected]="s.code === p.state">{{ s.code }} · {{ s.name }}</option> }
                </select>
              </div>
              <div [class.field-invalid]="!!errs()[side.key + 'Phone']">
                <label class="label" [for]="side.key + '-phone'">Phone</label>
                <input class="input" [id]="side.key + '-phone'" inputmode="tel" maxlength="10" [value]="p.phone" (input)="setParty(side.key, 'phone', $event)" />
                @if (errs()[side.key + 'Phone']) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ errs()[side.key + 'Phone'] }}</p> }
              </div>
              @if (side.key === 'seller') {
                <div>
                  <span class="label">Logo (optional)</span>
                  <label class="btn-ghost w-full cursor-pointer"><svg lucideIcon="upload" [size]="16" /> {{ inv().logo ? 'Change logo' : 'Add logo' }}
                    <input type="file" accept="image/png,image/jpeg,image/webp" class="hidden" (change)="setLogo($event)" /></label>
                </div>
              }
            </div>
          </fieldset>
        }

        <fieldset class="rounded-2xl border border-line p-3">
          <legend class="px-1 text-sm font-semibold">Invoice</legend>
          <div class="grid grid-cols-2 gap-3">
            <div [class.field-invalid]="!!errs()['number']">
              <label class="label" for="inv-no">Invoice no. <span class="text-rose-600">*</span></label>
              <input id="inv-no" class="input" maxlength="16" [value]="inv().number" (input)="set('number', $event)" />
              @if (errs()['number']) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ errs()['number'] }}</p> }
            </div>
            <div>
              <label class="label" for="inv-date">Date</label>
              <input id="inv-date" type="date" class="input" [value]="inv().date" (input)="set('date', $event)" />
            </div>
          </div>
        </fieldset>

        <fieldset class="rounded-2xl border border-line p-3">
          <legend class="px-1 text-sm font-semibold">Items</legend>
          <div class="space-y-3">
            @for (it of inv().items; track $index; let i = $index) {
              <div class="rounded-xl bg-surface-2 p-2.5">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-muted">{{ i + 1 }}</span>
                  <input class="input flex-1" placeholder="Item or service" maxlength="100" [value]="it.desc" (input)="setItem(i, 'desc', $event)"
                         [class.is-invalid]="!!errs()['item' + i]" [attr.aria-label]="'Item ' + (i + 1) + ' description'" />
                  <button type="button" class="btn-icon size-9" (click)="removeItem(i)" [disabled]="inv().items.length === 1" [attr.aria-label]="'Remove item ' + (i + 1)"><svg lucideIcon="trash-2" [size]="16" /></button>
                </div>
                @if (errs()['item' + i]) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ errs()['item' + i] }}</p> }
                <div class="mt-2 grid grid-cols-4 gap-2">
                  <label class="text-[11px] text-muted">HSN/SAC<input class="input mt-0.5 px-2 py-1.5" inputmode="numeric" maxlength="8" [value]="it.hsn" (input)="setItem(i, 'hsn', $event)" /></label>
                  <label class="text-[11px] text-muted">Qty<input class="input mt-0.5 px-2 py-1.5 text-right" inputmode="decimal" (focus)="selectAll($event)" [value]="it.qty" (input)="setItem(i, 'qty', $event)" /></label>
                  <label class="text-[11px] text-muted">Rate ₹<input class="input mt-0.5 px-2 py-1.5 text-right" inputmode="decimal" (focus)="selectAll($event)" [value]="it.rate" (input)="setItem(i, 'rate', $event)" /></label>
                  <label class="text-[11px] text-muted">GST %
                    <select class="input mt-0.5 px-1 py-1.5" [value]="it.gst" (change)="setItem(i, 'gst', $event)">
                      @for (r of rates; track r) { <option [value]="r" [selected]="r === it.gst">{{ r }}%</option> }
                    </select>
                  </label>
                </div>
              </div>
            }
          </div>
          <button type="button" class="btn-ghost mt-3" (click)="addItem()" [disabled]="inv().items.length >= 30"><svg lucideIcon="plus" [size]="16" /> Add item</button>
        </fieldset>

        <fieldset class="rounded-2xl border border-line p-3">
          <legend class="px-1 text-sm font-semibold">Extra (optional)</legend>
          <label class="label" for="inv-bank">Bank / UPI details</label>
          <textarea id="inv-bank" class="input" rows="2" maxlength="200" placeholder="A/c 1234…, IFSC SBIN0001234, UPI shop@okaxis" [value]="inv().bank" (input)="set('bank', $event)"></textarea>
          <label class="label mt-3" for="inv-notes">Notes / terms</label>
          <textarea id="inv-notes" class="input" rows="2" maxlength="300" [value]="inv().notes" (input)="set('notes', $event)"></textarea>
        </fieldset>

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn-primary"><svg lucideIcon="printer" [size]="16" /> Print / Save PDF</button>
          <button type="button" class="btn-ghost" (click)="newInvoice()"><svg lucideIcon="plus" [size]="16" /> New invoice</button>
          <button type="button" class="btn-ghost" (click)="reset()"><svg lucideIcon="eraser" [size]="16" /> Clear all</button>
        </div>
        <p class="text-xs text-muted">Your invoice is saved only on this device (browser storage) — nothing is uploaded.</p>
      </form>

      <!-- Preview / print area -->
      <div class="min-w-0">
        <p class="label print:hidden">Preview</p>
        <div class="print-area overflow-x-auto rounded-xl border border-line bg-white p-4 text-[12px] leading-snug text-slate-900 shadow-sm sm:p-6">
          @let s = inv().seller;
          @let b = inv().buyer;
          @let t = totals();
          <div class="flex items-start justify-between gap-4 border-b-2 border-slate-800 pb-3">
            <div class="flex min-w-0 gap-3">
              @if (inv().logo) { <img [src]="inv().logo" alt="" class="max-h-14 max-w-24 object-contain" /> }
              <div class="min-w-0">
                <p class="text-base font-bold">{{ s.name || 'Your business name' }}</p>
                <p class="whitespace-pre-line text-slate-600">{{ s.address }}</p>
                @if (s.gstin) { <p><b>GSTIN:</b> {{ s.gstin.toUpperCase() }}</p> }
                <p class="text-slate-600">{{ stateLabel(s.state) }}@if (s.phone) { · {{ s.phone }} }</p>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-lg font-bold tracking-wide">TAX INVOICE</p>
              <p><b>No:</b> {{ inv().number }}</p>
              <p><b>Date:</b> {{ dateLabel() }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 border-b border-slate-300 py-3">
            <div>
              <p class="text-[10px] font-bold text-slate-500 uppercase">Bill to</p>
              <p class="font-semibold">{{ b.name || 'Customer name' }}</p>
              <p class="whitespace-pre-line text-slate-600">{{ b.address }}</p>
              @if (b.gstin) { <p><b>GSTIN:</b> {{ b.gstin.toUpperCase() }}</p> }
              @if (b.phone) { <p class="text-slate-600">{{ b.phone }}</p> }
            </div>
            <div class="text-right">
              <p class="text-[10px] font-bold text-slate-500 uppercase">Place of supply</p>
              <p>{{ stateLabel(b.state) }}</p>
              <p class="mt-1 text-slate-600">{{ inter() ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)' }}</p>
            </div>
          </div>
          <table class="mt-3 w-full border-collapse">
            <thead><tr class="bg-slate-100 text-left text-[11px]">
              <th class="border border-slate-300 px-1.5 py-1">#</th><th class="border border-slate-300 px-1.5 py-1">Item</th><th class="border border-slate-300 px-1.5 py-1">HSN/SAC</th>
              <th class="border border-slate-300 px-1.5 py-1 text-right">Qty</th><th class="border border-slate-300 px-1.5 py-1 text-right">Rate</th>
              <th class="border border-slate-300 px-1.5 py-1 text-right">Taxable</th><th class="border border-slate-300 px-1.5 py-1 text-right">GST</th><th class="border border-slate-300 px-1.5 py-1 text-right">Amount</th>
            </tr></thead>
            <tbody>
              @for (it of inv().items; track $index; let i = $index) {
                <tr>
                  <td class="border border-slate-300 px-1.5 py-1">{{ i + 1 }}</td><td class="border border-slate-300 px-1.5 py-1">{{ it.desc }}</td>
                  <td class="border border-slate-300 px-1.5 py-1">{{ it.hsn }}</td><td class="border border-slate-300 px-1.5 py-1 text-right">{{ it.qty }}</td>
                  <td class="border border-slate-300 px-1.5 py-1 text-right">{{ money(it.rate) }}</td><td class="border border-slate-300 px-1.5 py-1 text-right">{{ money(t.lines[i].taxable) }}</td>
                  <td class="border border-slate-300 px-1.5 py-1 text-right">{{ it.gst }}%</td><td class="border border-slate-300 px-1.5 py-1 text-right">{{ money(t.lines[i].total) }}</td>
                </tr>
              }
            </tbody>
          </table>
          <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <table class="text-[11px]">
              <thead><tr class="text-slate-500"><th class="pr-3 text-left">GST rate</th><th class="pr-3 text-right">Taxable</th><th class="text-right">Tax</th></tr></thead>
              <tbody>@for (g of t.byRate; track g.rate) { <tr><td class="pr-3">{{ g.rate }}%</td><td class="pr-3 text-right">{{ money(g.taxable) }}</td><td class="text-right">{{ money(g.tax) }}</td></tr> }</tbody>
            </table>
            <dl class="min-w-48 space-y-0.5">
              <div class="flex justify-between gap-4"><dt>Taxable value</dt><dd>{{ money(t.taxable) }}</dd></div>
              @if (inter()) {
                <div class="flex justify-between gap-4"><dt>IGST</dt><dd>{{ money(t.igst) }}</dd></div>
              } @else {
                <div class="flex justify-between gap-4"><dt>CGST</dt><dd>{{ money(t.cgst) }}</dd></div>
                <div class="flex justify-between gap-4"><dt>SGST</dt><dd>{{ money(t.sgst) }}</dd></div>
              }
              @if (t.roundOff) { <div class="flex justify-between gap-4"><dt>Round off</dt><dd>{{ money(t.roundOff) }}</dd></div> }
              <div class="flex justify-between gap-4 border-t-2 border-slate-800 pt-1 text-sm font-bold"><dt>Total</dt><dd>₹{{ money(t.total) }}</dd></div>
            </dl>
          </div>
          <p class="mt-2 border-t border-slate-300 pt-2"><b>Amount in words:</b> {{ words() }}</p>
          @if (inv().bank) { <p class="mt-2 whitespace-pre-line"><b>Payment details:</b> {{ inv().bank }}</p> }
          @if (inv().notes) { <p class="mt-2 whitespace-pre-line text-slate-600">{{ inv().notes }}</p> }
          <div class="mt-8 flex justify-end"><div class="text-center"><div class="h-10"></div><p class="border-t border-slate-400 px-6 pt-1">Authorised signatory<br />{{ s.name }}</p></div></div>
          <p class="mt-4 text-center text-[9px] text-slate-400">This is a computer-generated invoice.</p>
        </div>
      </div>
    </div>
  `,
})
export class InvoiceTool {
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly states = GST_STATES;
  protected readonly rates = RATES;
  protected readonly sides = [
    { key: 'seller' as const, title: 'From (your business)' },
    { key: 'buyer' as const, title: 'Bill to (customer)' },
  ];
  protected readonly inv = signal<Invoice>(blank());
  private readonly submitted = signal(false);
  private loaded = false;

  protected readonly inter = computed(() => this.inv().seller.state !== this.inv().buyer.state);
  protected readonly totals = computed(() => invoiceTotals(this.inv().items, this.inter()));
  protected readonly words = computed(() => amountInWords(this.totals().total));
  protected readonly dateLabel = computed(() => {
    const d = new Date(this.inv().date + 'T00:00:00');
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  });

  /** GSTIN and phone errors show live; required fields only after the first Print attempt. */
  protected readonly errs = computed(() => {
    const v = this.inv();
    const e: Record<string, string> = {};
    for (const k of ['seller', 'buyer'] as const) {
      const g = gstinError(v[k].gstin);
      if (g) e[k + 'Gstin'] = g;
      else if (v[k].gstin && v[k].gstin.slice(0, 2) !== v[k].state) e[k + 'Gstin'] = 'GSTIN state code doesn’t match the selected state';
      if (v[k].phone && !/^[6-9]\d{9}$/.test(v[k].phone)) e[k + 'Phone'] = 'Enter a 10-digit mobile number';
      if (this.submitted() && !v[k].name.trim()) e[k + 'Name'] = 'Required';
    }
    if (this.submitted() && !v.number.trim()) e['number'] = 'Required';
    v.items.forEach((it, i) => {
      if (this.submitted() && !it.desc.trim()) e['item' + i] = 'Describe the item';
      else if (!(it.qty > 0)) e['item' + i] = 'Quantity must be more than 0';
      else if (it.rate < 0 || !Number.isFinite(it.rate)) e['item' + i] = 'Enter a valid rate';
    });
    return e;
  });

  constructor() {
    afterNextRender(() => {
      try {
        const saved = localStorage.getItem(DRAFT);
        if (saved) this.inv.set({ ...blank(), ...(JSON.parse(saved) as Invoice) });
      } catch {
        /* ignore broken draft */
      }
      this.loaded = true;
    });
    effect(() => {
      const v = this.inv();
      if (!this.browser || !this.loaded) return;
      try {
        localStorage.setItem(DRAFT, JSON.stringify(v));
      } catch {
        /* storage full (big logo) — draft just isn't saved */
      }
    });
  }

  private value(e: Event) {
    return (e.target as HTMLInputElement).value;
  }

  protected set(key: 'number' | 'date' | 'bank' | 'notes', e: Event) {
    const v = this.value(e);
    this.inv.update((x) => ({ ...x, [key]: v }));
  }

  protected setParty(side: 'seller' | 'buyer', key: keyof Party, e: Event) {
    let v = this.value(e);
    if (key === 'gstin') v = v.toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (key === 'phone') v = v.replace(/\D/g, '');
    const el = e.target as HTMLInputElement;
    if (el.value !== v) el.value = v;
    this.inv.update((x) => {
      const p = { ...x[side], [key]: v };
      // A valid GSTIN tells us the state — pick it automatically.
      if (key === 'gstin' && v.length >= 2 && GST_STATES.some((s) => s.code === v.slice(0, 2))) p.state = v.slice(0, 2);
      return { ...x, [side]: p };
    });
  }

  protected setItem(i: number, key: keyof InvoiceItem, e: Event) {
    const raw = this.value(e);
    const v = key === 'desc' || key === 'hsn' ? (key === 'hsn' ? raw.replace(/\D/g, '') : raw) : Number(raw.replace(/[^0-9.]/g, '')) || 0;
    this.inv.update((x) => ({ ...x, items: x.items.map((it, k) => (k === i ? { ...it, [key]: v } : it)) }));
  }

  /** Tapping a number box selects it, so typing replaces the old value. */
  protected selectAll(e: Event) {
    (e.target as HTMLInputElement).select();
  }

  protected addItem() {
    this.inv.update((x) => ({ ...x, items: [...x.items, { desc: '', hsn: '', qty: 1, rate: 0, gst: x.items.at(-1)?.gst ?? 18 }] }));
  }

  protected removeItem(i: number) {
    this.inv.update((x) => ({ ...x, items: x.items.filter((_, k) => k !== i) }));
  }

  protected setLogo(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return this.toast.error('Logo must be a PNG, JPG or WebP image.');
    if (f.size > 2 * 1024 * 1024) return this.toast.error('Logo must be smaller than 2 MB.');
    const img = new Image();
    img.onload = () => {
      // Shrink to a small PNG so the draft fits in browser storage
      const k = Math.min(1, 240 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      this.inv.update((x) => ({ ...x, logo: c.toDataURL('image/png') }));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  }

  protected print() {
    this.submitted.set(true);
    const n = Object.keys(this.errs()).length;
    if (n) return this.toast.warn(`Fix ${n} field${n > 1 ? 's' : ''} before printing`);
    window.print();
  }

  /** Keep your business details, clear the customer and items, bump the invoice number. */
  protected newInvoice() {
    this.submitted.set(false);
    this.inv.update((x) => ({
      ...blank(),
      seller: x.seller,
      logo: x.logo,
      bank: x.bank,
      notes: x.notes,
      buyer: { ...blank().buyer, state: x.seller.state },
      number: x.number.replace(/(\d+)(?!.*\d)/, (m) => String(Number(m) + 1).padStart(m.length, '0')),
    }));
    this.toast.info('New invoice started — your business details were kept.');
  }

  protected async reset() {
    const ok = await this.dialog.confirm({ title: 'Clear everything?', message: 'This removes your business details, customer and items from this device.', confirmText: 'Clear all', tone: 'danger' });
    if (!ok) return;
    this.submitted.set(false);
    this.inv.set(blank());
  }

  protected stateLabel(code: string) {
    return code ? `${stateName(code)} (${code})` : '';
  }

  protected money(n: number) {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
