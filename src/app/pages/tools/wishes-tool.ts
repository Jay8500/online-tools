import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, afterNextRender, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

type Lang = 'te' | 'en';
interface Fest {
  id: string;
  name: string;
  emoji: string;
  /** background gradient top → bottom, and the accent for the sparkles */
  bg: [string, string];
  glow: string;
  te: [string, string];
  en: [string, string];
  /** next dates (yyyy-mm-dd), used only to pick the default festival */
  dates: string[];
}

const FESTS: Fest[] = [
  { id: 'diwali', name: 'Diwali', emoji: '🪔', bg: ['#2a0845', '#6441a5'], glow: '#ffcf5a', te: ['దీపావళి శుభాకాంక్షలు', 'మీ జీవితం వెలుగులతో నిండాలి'], en: ['Happy Diwali', 'May your life shine bright with joy and prosperity'], dates: ['2026-11-08', '2027-10-29'] },
  { id: 'christmas', name: 'Christmas', emoji: '🎄', bg: ['#0b3d2e', '#14532d'], glow: '#fde68a', te: ['క్రిస్మస్ శుభాకాంక్షలు', 'ప్రేమ, శాంతి, సంతోషం మీ వెంటే ఉండాలి'], en: ['Merry Christmas', 'Wishing you love, peace and joy'], dates: ['2026-12-25', '2027-12-25'] },
  { id: 'newyear', name: 'New Year', emoji: '🎆', bg: ['#0f172a', '#1e3a8a'], glow: '#93c5fd', te: ['నూతన సంవత్సర శుభాకాంక్షలు', 'కొత్త ఏడాది మీకు అన్నీ శుభాలే తేవాలి'], en: ['Happy New Year', 'Wishing you a year full of happiness and success'], dates: ['2027-01-01', '2028-01-01'] },
  { id: 'sankranti', name: 'Sankranti', emoji: '🪁', bg: ['#f97316', '#facc15'], glow: '#fff7ed', te: ['సంక్రాంతి శుభాకాంక్షలు', 'పంటల పండుగ మీ ఇంట సిరులు నింపాలి'], en: ['Happy Sankranti', 'May the harvest festival bring you joy and plenty'], dates: ['2027-01-14'] },
  { id: 'ugadi', name: 'Ugadi', emoji: '🌿', bg: ['#065f46', '#84cc16'], glow: '#fef9c3', te: ['ఉగాది శుభాకాంక్షలు', 'కొత్త సంవత్సరం మీకు ఆనందం తేవాలి'], en: ['Happy Ugadi', 'Wishing you a sweet and happy new year'], dates: [] },
  { id: 'ramzan', name: 'Ramzan', emoji: '🌙', bg: ['#064e3b', '#0f766e'], glow: '#fde68a', te: ['రంజాన్ శుభాకాంక్షలు', 'మీకు, మీ కుటుంబానికి శాంతి, సంతోషం'], en: ['Eid Mubarak', 'Wishing you peace, joy and blessings'], dates: ['2027-03-10'] },
  { id: 'dasara', name: 'Dasara', emoji: '🏹', bg: ['#7c2d12', '#dc2626'], glow: '#fde68a', te: ['దసరా శుభాకాంక్షలు', 'చెడుపై మంచి గెలుపు మీకు విజయం తేవాలి'], en: ['Happy Dasara', 'May good always win in your life'], dates: ['2027-10-09'] },
  { id: 'birthday', name: 'Birthday', emoji: '🎂', bg: ['#be185d', '#7c3aed'], glow: '#fbcfe8', te: ['పుట్టినరోజు శుభాకాంక్షలు', 'నిండు నూరేళ్లు సంతోషంగా ఉండాలి'], en: ['Happy Birthday', 'Wishing you a wonderful year ahead'], dates: [] },
];
const SIZE = 1080;
const TE_FONT = '"Noto Sans Telugu", "Nirmala UI", "Gautami", "Mallanna", sans-serif';
const EN_FONT = 'Inter, "Segoe UI", Roboto, system-ui, sans-serif';

/** Pick the festival whose next date is soonest (within ~6 weeks), else Diwali. */
function defaultFest(today = new Date().toISOString().slice(0, 10)): string {
  let best = { id: 'diwali', d: '9999' };
  for (const f of FESTS) for (const d of f.dates) if (d >= today && d < best.d) best = { id: f.id, d };
  const days = (new Date(best.d).getTime() - new Date(today).getTime()) / 86400000;
  return days <= 45 ? best.id : 'diwali';
}

@Component({
  selector: 'app-wishes-tool',
  imports: [Icon],
  template: `
    <div class="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div class="space-y-4">
        <div>
          <p class="label">Festival</p>
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Festival">
            @for (f of fests; track f.id) {
              <button type="button" class="chip min-h-9 text-sm" [attr.aria-pressed]="fest() === f.id" (click)="fest.set(f.id)">{{ f.emoji }} {{ f.name }}</button>
            }
          </div>
        </div>
        <div>
          <p class="label">Language</p>
          <div class="flex rounded-xl border border-line bg-surface-2 p-1 text-sm font-semibold" role="group" aria-label="Language">
            <button type="button" class="flex-1 rounded-lg px-3 py-1.5 transition" [class]="lang() === 'te' ? 'bg-surface text-brand shadow-sm' : 'text-muted'" [attr.aria-pressed]="lang() === 'te'" (click)="lang.set('te')">తెలుగు</button>
            <button type="button" class="flex-1 rounded-lg px-3 py-1.5 transition" [class]="lang() === 'en' ? 'bg-surface text-brand shadow-sm' : 'text-muted'" [attr.aria-pressed]="lang() === 'en'" (click)="lang.set('en')">English</button>
          </div>
        </div>
        <div>
          <label class="label" for="w-name">{{ cur().id === 'birthday' ? 'Birthday person’s name' : 'Your name (shown as “From”)' }}</label>
          <input id="w-name" class="input" maxlength="30" placeholder="e.g. Ravi & family" [value]="name()" (input)="name.set(val($event))" />
        </div>
        <div>
          <p class="label">Photo (optional)</p>
          <div class="flex items-center gap-2">
            <label class="btn-ghost min-h-10 cursor-pointer text-sm">
              <svg lucideIcon="image-up" [size]="16" /> {{ photo() ? 'Change photo' : 'Add photo' }}
              <input type="file" accept="image/*" class="sr-only" (change)="pick($event)" />
            </label>
            @if (photo()) { <button type="button" class="btn-ghost min-h-10 text-sm" (click)="photo.set(null)">Remove</button> }
          </div>
          <p class="mt-1 text-xs text-muted">Your photo stays on your phone — it is never uploaded.</p>
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          <button type="button" class="btn-primary min-h-11" (click)="share()"><svg lucideIcon="share-2" [size]="16" /> Share on WhatsApp</button>
          <button type="button" class="btn-ghost min-h-11" (click)="download()"><svg lucideIcon="download" [size]="16" /> Download</button>
        </div>
      </div>
      <div>
        <p class="label">Preview</p>
        <canvas #cv [width]="size" [height]="size" class="aspect-square w-full max-w-[440px] rounded-2xl border border-line shadow-lg" role="img" [attr.aria-label]="cur().name + ' greeting card preview'"></canvas>
      </div>
    </div>
  `,
})
export class WishesTool {
  private readonly toast = inject(ToastService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly cv = viewChild<ElementRef<HTMLCanvasElement>>('cv');
  protected readonly size = SIZE;
  protected readonly fests = FESTS;
  protected readonly fest = signal(defaultFest());
  protected readonly lang = signal<Lang>('te');
  protected readonly name = signal('');
  protected readonly photo = signal<ImageBitmap | null>(null);
  private readonly fontsReady = signal(false);
  protected readonly cur = computed(() => FESTS.find((f) => f.id === this.fest()) ?? FESTS[0]);

  constructor() {
    afterNextRender(() => {
      document.fonts?.ready.then(() => this.fontsReady.set(true));
      this.fontsReady.set(true);
    });
    effect(() => {
      const c = this.cv()?.nativeElement;
      if (!this.browser || !c || !this.fontsReady()) return;
      this.draw(c, this.cur(), this.lang(), this.name().trim(), this.photo());
    });
  }

  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }

  protected async pick(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      this.photo.set(await createImageBitmap(file));
    } catch {
      this.toast.show('Couldn’t open that photo. Try a JPG or PNG.', 'error', 2500);
    }
  }

  private draw(c: HTMLCanvasElement, f: Fest, lang: Lang, name: string, photo: ImageBitmap | null) {
    const g = c.getContext('2d')!;
    const S = SIZE;
    // Background + soft light dots (fixed pattern so the card looks the same every time)
    const grad = g.createLinearGradient(0, 0, S * 0.4, S);
    grad.addColorStop(0, f.bg[0]);
    grad.addColorStop(1, f.bg[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    let seed = f.id.length * 97;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 46; i++) {
      const x = rnd() * S, y = rnd() * S, r = 4 + rnd() * 26;
      const dot = g.createRadialGradient(x, y, 0, x, y, r);
      dot.addColorStop(0, f.glow + 'cc');
      dot.addColorStop(1, f.glow + '00');
      g.fillStyle = dot;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // Inner frame
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 4;
    g.strokeRect(40, 40, S - 80, S - 80);

    const [title, line] = f[lang];
    const font = lang === 'te' ? TE_FONT : EN_FONT;
    const dark = f.id === 'sankranti'; // light background → dark text
    const ink = dark ? '#3b1d00' : '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';

    let y = photo ? 210 : 300;
    g.font = `${photo ? 150 : 210}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    g.fillText(f.emoji, S / 2, y);

    if (photo) {
      const r = 150, cx = S / 2, cy = 470;
      g.save();
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.closePath();
      g.clip();
      const scale = Math.max((r * 2) / photo.width, (r * 2) / photo.height);
      g.drawImage(photo, cx - (photo.width * scale) / 2, cy - (photo.height * scale) / 2, photo.width * scale, photo.height * scale);
      g.restore();
      g.strokeStyle = '#ffffff';
      g.lineWidth = 10;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
      y = 700;
    } else {
      y = 560;
    }

    g.fillStyle = ink;
    g.shadowColor = 'rgba(0,0,0,0.35)';
    g.shadowBlur = dark ? 0 : 18;
    y = this.wrap(g, title, S / 2, y, S - 160, lang === 'te' ? 92 : 104, `800`, font);
    g.shadowBlur = 0;
    g.globalAlpha = 0.92;
    // Telugu letters have tall vowel signs and conjuncts below the line — give them more room
    y = this.wrap(g, line, S / 2, y + (lang === 'te' ? 56 : 20), S - 200, 44, '500', font);
    g.globalAlpha = 1;

    if (name) {
      g.font = `700 50px ${lang === 'te' ? TE_FONT : EN_FONT}`;
      const who = f.id === 'birthday' ? (lang === 'te' ? `ప్రియమైన ${name}` : `Dear ${name}`) : `— ${name}`;
      g.fillText(who, S / 2, Math.min(y + 70, S - 140), S - 160);
    }
    // Small credit — the card is free to share
    g.globalAlpha = 0.7;
    g.font = `500 26px ${EN_FONT}`;
    g.fillText('Made free at tools.spreadapps.in', S / 2, S - 72);
    g.globalAlpha = 1;
  }

  /** Centered multi-line text that shrinks to fit 2 lines; returns the y below the last line. */
  private wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, size: number, weight: string, font: string) {
    let s = size, lines: string[] = [];
    for (; s >= size * 0.6; s -= 4) {
      g.font = `${weight} ${s}px ${font}`;
      lines = [];
      let cur = '';
      for (const w of text.split(' ')) {
        const t = cur ? cur + ' ' + w : w;
        if (g.measureText(t).width > max && cur) (lines.push(cur), (cur = w));
        else cur = t;
      }
      if (cur) lines.push(cur);
      if (lines.length <= 2) break;
    }
    const lh = s * (/[ఀ-౿]/.test(text) ? 1.45 : 1.25);
    lines.forEach((l, i) => g.fillText(l, x, y + i * lh, max));
    return y + (lines.length - 1) * lh + s * 0.6;
  }

  private blob(): Promise<Blob | null> {
    const c = this.cv()?.nativeElement;
    return new Promise((res) => (c ? c.toBlob((b) => res(b), 'image/png') : res(null)));
  }

  protected async download() {
    const b = await this.blob();
    if (!b) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `${this.cur().id}-wishes.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  protected async share() {
    const b = await this.blob();
    if (!b) return;
    const file = new File([b], `${this.cur().id}-wishes.png`, { type: 'image/png' });
    const text = `${this.cur()[this.lang()][0]} 🎉\nMake yours free: tools.spreadapps.in/festival-wishes-card`;
    try {
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text });
    } catch {
      return; // share sheet closed
    }
    await this.download();
    this.toast.show('Card saved — open WhatsApp and attach it from your gallery.', 'success', 3500);
  }
}
