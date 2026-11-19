import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PushService } from '../core/push.service';

/** Saved on this phone only. */
export interface Watch {
  metal: 'gold22PerG' | 'gold24PerG' | 'silverPerKg';
  below: number;
  notified?: string;
}
const KEY = 'price-watch';
export const METALS: { id: Watch['metal']; label: string; unit: string }[] = [
  { id: 'gold22PerG', label: 'Gold 22K', unit: 'per gram' },
  { id: 'gold24PerG', label: 'Gold 24K', unit: 'per gram' },
  { id: 'silverPerKg', label: 'Silver', unit: 'per kg' },
];
const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const rupees = (n: number) => '₹' + INR.format(n);

export function readWatch(): Watch | null {
  try {
    const w = JSON.parse(localStorage.getItem(KEY) || 'null');
    return w && METALS.some((m) => m.id === w.metal) && w.below > 0 ? w : null;
  } catch {
    return null;
  }
}

/**
 * When the site opens and today's price is at or below the target: a phone notification (if allowed),
 * once a day. Returns the message (for a toast) or null.
 */
export async function checkWatch(): Promise<string | null> {
  const w = readWatch();
  if (!w) return null;
  try {
    const p = await (await fetch('/api/metals')).json();
    const now = p?.[w.metal];
    if (!(now > 0) || now > w.below) return null;
    const m = METALS.find((x) => x.id === w.metal)!;
    const msg = `🔔 ${m.label} is ${rupees(now)} ${m.unit} — at or below your target ${rupees(w.below)}`;
    const today = new Date().toISOString().slice(0, 10);
    if (w.notified !== today) {
      if ('Notification' in window && Notification.permission === 'granted') new Notification('Price watch', { body: msg, icon: '/icons/icon-192x192.png' });
      localStorage.setItem(KEY, JSON.stringify({ ...w, notified: today }));
    }
    return msg;
  } catch {
    return null;
  }
}

/** "🔔 Price watch" on the gold page: pick a metal and a target; checked whenever the site is opened. */
@Component({
  selector: 'app-price-watch',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card p-3" aria-labelledby="pw-h">
      <h2 id="pw-h" class="text-sm font-bold">🔔 Price watch</h2>
      <p class="mt-0.5 text-xs text-muted">Tell me when the price falls to my target. Checked every time you open Spread Apps — saved only on this phone.</p>
      <div class="mt-2 flex flex-wrap items-end gap-2">
        <label class="grid gap-1 text-xs font-semibold" style="flex-basis:100%">Metal
          <select class="input min-h-10" [value]="metal()" (change)="metal.set($any($event.target).value)">
            @for (m of metals; track m.id) { <option [value]="m.id">{{ m.label }} ({{ m.unit }})</option> }
          </select>
        </label>
        <label class="grid min-w-0 flex-1 gap-1 text-xs font-semibold">Alert at or below (₹)
          <input class="input min-h-10" type="number" inputmode="numeric" min="1" [value]="target() || ''" (input)="target.set(+$any($event.target).value)" [placeholder]="now() ? 'e.g. ' + suggest() : 'e.g. 11500'" />
        </label>
        <button type="button" class="btn-primary min-h-10" [disabled]="!(target() > 0)" (click)="save()">{{ saved() ? 'Update' : 'Set alert' }}</button>
      </div>
      @if (saved(); as w) {
        <p class="mt-2 rounded-xl px-3 py-2 text-sm" [class]="reached() ? 'bg-green-500/15 font-semibold text-green-700 dark:text-green-400' : 'bg-surface-2'">
          @if (reached()) { 🎉 {{ label(w.metal) }} is {{ money(now()!) }} — at or below your {{ money(w.below) }} target! }
          @else if (now()) { Now {{ money(now()!) }} · target {{ money(w.below) }} · {{ money(now()! - w.below) }} to go }
          @else { Watching {{ label(w.metal) }} for {{ money(w.below) }} }
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          @if (pushOn()) { <a routerLink="/notifications" class="btn-ghost min-h-9 text-xs">🔔 Notifications on · manage</a> }
          @else if (canNotify()) { <button type="button" class="btn-primary min-h-9 text-xs" [disabled]="busy()" (click)="allow()">🔔 Notify me on this phone</button> }
          <button type="button" class="btn-ghost min-h-9 text-xs" (click)="clear()">Remove alert</button>
        </div>
      }
    </section>
  `,
})
export class PriceWatch {
  protected readonly metals = METALS;
  protected readonly metal = signal<Watch['metal']>('gold22PerG');
  protected readonly target = signal(0);
  protected readonly saved = signal<Watch | null>(null);
  private readonly prices = signal<Record<string, number> | null>(null);
  protected readonly perm = signal<NotificationPermission | 'none'>('none');
  protected readonly canNotify = signal(false);
  private readonly push = inject(PushService);
  protected readonly pushOn = computed(() => (this.push.on() && this.push.topics().includes('gold')) || (!this.push.supported && this.perm() === 'granted'));
  protected readonly busy = signal(false);
  protected readonly now = computed(() => this.prices()?.[this.saved()?.metal ?? this.metal()] ?? null);
  protected readonly reached = computed(() => !!this.saved() && !!this.now() && this.now()! <= this.saved()!.below);
  /** A target ~2% under today's price, as a hint. */
  protected readonly suggest = computed(() => INR.format(Math.round(((this.prices()?.[this.metal()] ?? 0) * 0.98) / 10) * 10));

  constructor() {
    afterNextRender(async () => {
      this.canNotify.set('Notification' in window);
      if ('Notification' in window) this.perm.set(Notification.permission);
      const w = readWatch();
      if (w) {
        this.saved.set(w);
        this.metal.set(w.metal);
        this.target.set(w.below);
      }
      try {
        this.prices.set(await (await fetch('/api/metals')).json());
      } catch {}
    });
  }

  protected label(id: Watch['metal']) {
    return METALS.find((m) => m.id === id)?.label ?? '';
  }
  protected money(n: number) {
    return rupees(n);
  }

  protected save() {
    const w: Watch = { metal: this.metal(), below: Math.round(this.target()) };
    this.saved.set(w);
    this.push.updateGold(w);
    try {
      localStorage.setItem(KEY, JSON.stringify(w));
    } catch {}
  }

  /** Real push (works while the site is closed) where supported; otherwise a notification when the site is opened. */
  protected async allow() {
    this.busy.set(true);
    try {
      if (this.push.supported) await this.push.setTopic('gold', true, this.saved() ?? undefined);
      else await Notification.requestPermission();
    } catch {
      /* permission refused or offline */
    } finally {
      if ('Notification' in window) this.perm.set(Notification.permission);
      this.busy.set(false);
    }
  }


  protected clear() {
    this.push.updateGold(null);
    this.saved.set(null);
    this.target.set(0);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }
}
