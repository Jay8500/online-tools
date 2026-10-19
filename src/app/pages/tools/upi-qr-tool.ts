import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

/** UPI IDs look like name@bank (letters, digits, dot, dash, underscore before @; a handle after). */
const VPA_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
const NAME_RE = /^[\p{L}0-9][\p{L}0-9 .&'-]{0,49}$/u;

type QrLib = typeof import('qrcode');

/** Load the CommonJS qrcode package tolerantly (named export or default). */
async function qrLib(): Promise<QrLib> {
  const mod = (await import('qrcode')) as unknown as Partial<QrLib> & { default?: QrLib };
  return (typeof mod.toCanvas === 'function' ? mod : mod.default) as QrLib;
}

/** Standard UPI deep link — any UPI app (GPay, PhonePe, Paytm, BHIM) can read it. */
export function upiLink(vpa: string, name: string, amount: number | null, note: string): string {
  const p = new URLSearchParams({ pa: vpa.trim(), pn: name.trim(), cu: 'INR' });
  if (amount) p.set('am', amount.toFixed(2));
  if (note.trim()) p.set('tn', note.trim());
  return `upi://pay?${p.toString().replace(/\+/g, '%20')}`;
}

@Component({
  selector: 'app-upi-qr-tool',
  imports: [Icon],
  template: `
    <div class="grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        <div [class.field-invalid]="!!err().vpa">
          <label class="label" for="vpa">UPI ID <span class="text-rose-600">*</span></label>
          <input id="vpa" class="input" placeholder="yourname@okaxis" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="100"
                 [value]="vpa()" (input)="vpa.set(val($event)); touched.set(true)" aria-describedby="vpa-msg" />
          @if (err().vpa) { <p id="vpa-msg" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ err().vpa }}</p> }
          @else { <p id="vpa-msg" class="mt-1 text-xs text-muted">Find it in your UPI app under Profile → UPI ID.</p> }
        </div>
        <div [class.field-invalid]="!!err().name">
          <label class="label" for="pn">Name shown to the payer <span class="text-rose-600">*</span></label>
          <input id="pn" class="input" placeholder="Sri Sai Kirana Store" maxlength="50" [value]="name()" (input)="name.set(val($event)); touched.set(true)" aria-describedby="pn-msg" />
          @if (err().name) { <p id="pn-msg" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ err().name }}</p> }
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div [class.field-invalid]="!!err().amount">
            <label class="label" for="am">Fixed amount (optional)</label>
            <input id="am" class="input" inputmode="decimal" placeholder="Any amount" [value]="amountText()" (input)="setAmount($event)" aria-describedby="am-msg" />
            @if (err().amount) { <p id="am-msg" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ err().amount }}</p> }
          </div>
          <div>
            <label class="label" for="tn">Note (optional)</label>
            <input id="tn" class="input" placeholder="Bill no. / purpose" maxlength="40" [value]="note()" (input)="note.set(val($event))" />
          </div>
        </div>
        <p class="rounded-xl bg-amber-500/10 p-3 text-xs text-ink">
          <strong>Before printing:</strong> scan the QR with your own UPI app and check that your name shows correctly. A wrong UPI ID sends money to someone else.
        </p>
      </div>

      <div class="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-2 p-4" aria-live="polite">
        <div class="grid aspect-square w-full max-w-[260px] place-items-center rounded-xl bg-white p-3 shadow-sm">
          <canvas #qr class="h-auto w-full" [class.opacity-20]="!ready()" aria-label="UPI payment QR code"></canvas>
        </div>
        @if (ready()) {
          <p class="text-center text-sm"><strong>{{ name() }}</strong><br /><span class="text-muted">{{ vpa() }}</span>
            @if (amount()) { <br /><span class="font-semibold">₹{{ amount() }}</span> }</p>
        } @else {
          <p class="text-center text-sm text-muted">Enter a valid UPI ID and name to see your QR.</p>
        }
        <div class="flex w-full flex-wrap justify-center gap-2">
          <button type="button" class="btn-primary" (click)="downloadQr()" [disabled]="!ready()"><svg lucideIcon="download" [size]="16" /> QR image</button>
          <button type="button" class="btn-success" (click)="downloadPoster()" [disabled]="!ready()"><svg lucideIcon="printer" [size]="16" /> Shop poster</button>
          @if (canShare()) {
            <button type="button" class="btn-icon" (click)="share()" [disabled]="!ready()" aria-label="Share QR"><svg lucideIcon="share-2" [size]="18" /></button>
          }
        </div>
      </div>
    </div>
  `,
})
export class UpiQrTool {
  private readonly toast = inject(ToastService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('qr');
  protected readonly vpa = signal('');
  protected readonly name = signal('');
  protected readonly amountText = signal('');
  protected readonly note = signal('');
  protected readonly touched = signal(false);
  protected readonly canShare = signal(false);

  protected readonly amount = computed(() => {
    const n = Number(this.amountText());
    return this.amountText() && Number.isFinite(n) && n > 0 ? n : null;
  });
  protected readonly err = computed(() => {
    const e: { vpa?: string; name?: string; amount?: string } = {};
    const show = this.touched();
    const v = this.vpa().trim();
    if (show && !v) e.vpa = 'Enter your UPI ID';
    else if (v && !VPA_RE.test(v)) e.vpa = 'UPI ID looks like name@bank, e.g. 9876543210@ybl';
    const n = this.name().trim();
    if (show && !n) e.name = 'Enter the name';
    else if (n && !NAME_RE.test(n)) e.name = 'Use letters, numbers and spaces only';
    const a = this.amountText();
    if (a && (!this.amount() || this.amount()! > 100000)) e.amount = 'Enter ₹1 to ₹1,00,000, or leave empty';
    return e;
  });
  protected readonly ready = computed(() => VPA_RE.test(this.vpa().trim()) && NAME_RE.test(this.name().trim()) && !this.err().amount);
  protected readonly link = computed(() => (this.ready() ? upiLink(this.vpa(), this.name(), this.amount(), this.note()) : 'upi://pay'));

  constructor() {
    effect(() => {
      const text = this.link();
      const c = this.canvas().nativeElement;
      if (!this.browser) return;
      qrLib()
        .then((q) => q.toCanvas(c, text, { width: 520, margin: 1, errorCorrectionLevel: 'M' }))
        // qrcode sets a fixed inline size; let CSS make it responsive instead
        .then(() => c.removeAttribute('style'))
        .catch((e) => this.toast.fail(e, 'Could not draw the QR code.'));
    });
    if (this.browser) this.canShare.set(typeof navigator.canShare === 'function');
  }

  protected setAmount(e: Event) {
    const el = e.target as HTMLInputElement;
    el.value = el.value.replace(/[^0-9.]/g, '');
    this.amountText.set(el.value);
  }

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }

  private fileBase() {
    return `upi-qr-${this.vpa().split('@')[0].replace(/[^a-z0-9]/gi, '').slice(0, 20) || 'pay'}`;
  }

  protected downloadQr() {
    this.save(this.canvas().nativeElement, `${this.fileBase()}.png`);
  }

  /** A6-ratio printable poster: name, QR, UPI ID, amount. */
  private poster(): HTMLCanvasElement {
    const W = 1240;
    const H = 1748;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d')!;
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, W, H);
    x.fillStyle = '#0d9488';
    x.fillRect(0, 0, W, 230);
    x.fillStyle = '#ffffff';
    x.textAlign = 'center';
    x.font = '700 64px Arial, sans-serif';
    x.fillText('Scan & Pay with any UPI app', W / 2, 140);
    x.fillStyle = '#0f172a';
    let size = 76;
    x.font = `800 ${size}px Arial, sans-serif`;
    while (x.measureText(this.name()).width > W - 120 && size > 36) x.font = `800 ${--size}px Arial, sans-serif`;
    x.fillText(this.name(), W / 2, 360);
    const q = 900;
    x.drawImage(this.canvas().nativeElement, (W - q) / 2, 420, q, q);
    x.font = '600 52px Arial, sans-serif';
    x.fillStyle = '#334155';
    x.fillText(this.vpa(), W / 2, 1420);
    if (this.amount()) {
      x.font = '800 70px Arial, sans-serif';
      x.fillStyle = '#0f172a';
      x.fillText(`₹ ${this.amount()!.toLocaleString('en-IN')}`, W / 2, 1520);
    }
    x.font = '500 38px Arial, sans-serif';
    x.fillStyle = '#64748b';
    x.fillText('GPay · PhonePe · Paytm · BHIM · any bank app', W / 2, 1640);
    x.font = '400 28px Arial, sans-serif';
    x.fillText('Made free at tools.spreadapps.in', W / 2, 1710);
    return c;
  }

  protected downloadPoster() {
    this.save(this.poster(), `${this.fileBase()}-poster.png`);
  }

  protected async share() {
    const blob = await new Promise<Blob | null>((r) => this.poster().toBlob(r, 'image/png'));
    if (!blob) return;
    const file = new File([blob], `${this.fileBase()}-poster.png`, { type: 'image/png' });
    try {
      if (!navigator.canShare?.({ files: [file] })) return this.toast.info('Sharing images isn’t supported here — use Download.');
      await navigator.share({ files: [file], title: 'UPI payment QR' });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') this.toast.fail(e);
    }
  }

  private save(c: HTMLCanvasElement, name: string) {
    c.toBlob((b) => {
      if (!b) return this.toast.error('Could not create the image.');
      const url = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      this.toast.success('Saved ' + name);
    }, 'image/png');
  }
}
