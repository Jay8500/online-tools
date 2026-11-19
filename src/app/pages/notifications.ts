import { Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PushService, type Topic } from '../core/push.service';
import { SeoService } from '../core/seo.service';
import { ToastService } from '../core/toast.service';
import { BackLink } from '../shared/back-link';
import { METALS, readWatch, rupees, type Watch } from '../shared/price-watch';

/** /notifications — switch each alert on or off, send a test, or turn everything off. */
@Component({
  selector: 'app-notifications',
  imports: [RouterLink, BackLink],
  template: `
    <div class="mx-auto max-w-xl">
      <nav aria-label="Breadcrumb" class="mb-1 flex items-center gap-1 text-xs text-muted"><app-back-link /><a routerLink="/" class="hover:text-brand hover:underline">Home</a></nav>
      <h1 class="text-xl font-bold">🔔 My notifications</h1>
      <p class="mt-1 text-sm text-muted">Short alerts from <b>Spread Apps™ Tools</b> — only the ones you switch on, at most one a day each. No sign-up; turn off any time.</p>

      @if (!push.supported) {
        <p class="card mt-4 p-3 text-sm">
          This browser can’t get notifications while the site is closed.
          <b>iPhone:</b> tap Share → <i>Add to Home Screen</i>, open Spread Apps from there and come back here.
          <b>Android:</b> use Chrome.
        </p>
      }

      <section class="card mt-4 divide-y divide-line" aria-label="Alerts">
        <div class="flex items-center gap-3 p-3">
          <span class="text-2xl" aria-hidden="true">🥇</span>
          <div class="min-w-0 flex-1">
            <p class="font-semibold">Gold & silver price watch</p>
            <p class="text-xs text-muted">{{ watch() ? label(watch()!) : 'Set a target price on the gold page first' }}</p>
          </div>
          @if (watch()) {
            <button type="button" role="switch" class="sw" [attr.aria-checked]="has('gold')" [disabled]="busy() || !push.supported" (click)="toggle('gold')" aria-label="Gold price alerts"><i></i></button>
          } @else {
            <a routerLink="/gold-price-calculator" class="btn-ghost min-h-9 shrink-0 text-xs">Set target</a>
          }
        </div>
        @for (t of topics; track t.id) {
          <div class="flex items-center gap-3 p-3">
            <span class="text-2xl" aria-hidden="true">{{ t.icon }}</span>
            <div class="min-w-0 flex-1"><p class="font-semibold">{{ t.name }}</p><p class="text-xs text-muted">{{ t.note }}</p></div>
            <button type="button" role="switch" class="sw" [attr.aria-checked]="has(t.id)" [disabled]="busy() || !push.supported" (click)="toggle(t.id)" [attr.aria-label]="t.name"><i></i></button>
          </div>
          @if (t.id === 'walk' && has('walk')) {
            <label class="flex items-center justify-between gap-3 px-3 pb-3 pl-14 text-sm">
              <span class="text-muted">⏰ Remind me at</span>
              <select class="input min-h-10 w-auto" [value]="push.walkAt()" (change)="setWalk(+$any($event.target).value)" aria-label="Walk reminder time">
                @for (h of hours; track h) { <option [value]="h" [selected]="h === push.walkAt()">{{ hourLabel(h) }}</option> }
              </select>
            </label>
          }
        }
        <div class="flex items-center gap-3 p-3 opacity-60">
          <span class="text-2xl" aria-hidden="true">🧩</span>
          <div class="min-w-0 flex-1"><p class="font-semibold">Daily puzzle</p><p class="text-xs text-muted">Today’s Sudoku is ready</p></div>
          <span class="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold">Soon</span>
        </div>
      </section>

      @if (push.on()) {
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="btn-primary min-h-10" [disabled]="busy()" (click)="test()">Send me a test</button>
          <button type="button" class="btn-ghost min-h-10" [disabled]="busy()" (click)="off()">Turn off all notifications</button>
        </div>
      }
      <p class="mt-3 text-xs text-muted">Alerts arrive around 9:15 AM; the walk reminder comes at the time you pick. We keep only this phone’s push address and the alerts you chose — no name, no number. “Turn off” deletes them from our server.</p>
    </div>
  `,
  styles: `
    .sw { position: relative; width: 46px; height: 28px; flex-shrink: 0; border: 0; border-radius: 99px; background: var(--line); cursor: pointer; transition: background .2s; }
    .sw i { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgb(0 0 0 / .3); transition: transform .2s; }
    .sw[aria-checked='true'] { background: var(--brand); }
    .sw[aria-checked='true'] i { transform: translateX(18px); }
    .sw:disabled { opacity: .5; cursor: default; }
  `,
})
export class Notifications {
  protected readonly push = inject(PushService);
  private readonly toast = inject(ToastService);
  protected readonly watch = signal<Watch | null>(null);
  protected readonly busy = signal(false);
  protected readonly topics: { id: Topic; icon: string; name: string; note: string }[] = [
    { id: 'jobs', icon: '🏛️', name: 'Govt job notifications', note: 'When TGPSC posts a new notice' },
    { id: 'festival', icon: '🪔', name: 'Festival reminders', note: '2 days before — make your wishes card' },
    { id: 'news', icon: '📰', name: 'Morning news', note: 'One calm headline a day' },
    { id: 'walk', icon: '🚶', name: 'Walk reminder', note: 'Every day at the time you choose' },
  ];

  constructor() {
    inject(SeoService).set({ title: 'My notifications — Spread Apps Tools', description: 'Choose the alerts you get from Spread Apps Tools.', path: 'notifications', noindex: true });
    afterNextRender(() => this.watch.set(readWatch()));
  }

  /** 5 AM … 11 PM */
  protected readonly hours = Array.from({ length: 19 }, (_, i) => i + 5);
  protected hourLabel(h: number) {
    return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
  }
  protected async setWalk(h: number) {
    await this.run(async () => {
      await this.push.setWalkAt(h);
      this.toast.show(`🚶 Walk reminder at ${this.hourLabel(h)} every day.`, 'success');
    });
  }

  protected has(t: Topic) {
    return this.push.on() && this.push.topics().includes(t);
  }

  protected label(w: Watch) {
    const m = METALS.find((x) => x.id === w.metal)!;
    return `${m.label} at or below ${rupees(w.below)} ${m.unit}`;
  }

  protected async toggle(t: Topic) {
    const want = !this.has(t);
    const w = this.watch();
    await this.run(async () => {
      const ok = await this.push.setTopic(t, want, t === 'gold' && w ? { metal: w.metal, below: w.below } : undefined);
      if (want && ok) this.toast.show('On 🔔 You’ll get this alert on this phone.', 'success');
    });
  }

  protected async test() {
    await this.run(async () => {
      await this.push.test();
      this.toast.show('Sent — check your notifications.', 'success');
    });
  }

  protected async off() {
    await this.run(async () => {
      await this.push.disable();
      this.toast.show('All notifications are off.', 'success');
    });
  }

  private async run(f: () => Promise<void>) {
    this.busy.set(true);
    try {
      await f();
    } catch {
      this.toast.show('That didn’t work. Allow notifications for this site in your browser settings and try again.', 'error', 5000);
    } finally {
      this.busy.set(false);
    }
  }
}
