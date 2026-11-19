import { Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PushService } from '../core/push.service';
import { SeoService } from '../core/seo.service';
import { ToastService } from '../core/toast.service';
import { BackLink } from '../shared/back-link';
import { METALS, readWatch, rupees, type Watch } from '../shared/price-watch';

/** /notifications — what this phone gets, a test message and one switch to turn everything off. */
@Component({
  selector: 'app-notifications',
  imports: [RouterLink, BackLink],
  template: `
    <div class="mx-auto max-w-xl">
      <nav aria-label="Breadcrumb" class="mb-1 flex items-center gap-1 text-xs text-muted"><app-back-link /><a routerLink="/" class="hover:text-brand hover:underline">Home</a></nav>
      <h1 class="text-xl font-bold">🔔 My notifications</h1>
      <p class="mt-1 text-sm text-muted">Short alerts from <b>Spread Apps™ Tools</b> — only the ones you turn on, at most one a day per alert. No sign-up; turn off any time.</p>

      @if (!push.supported) {
        <p class="card mt-4 p-3 text-sm">
          This browser can’t get notifications while the site is closed.
          <b>iPhone:</b> tap Share → <i>Add to Home Screen</i>, open Spread Apps from there and come back here.
          <b>Android:</b> use Chrome. Alerts still show when you open the site.
        </p>
      }

      <section class="card mt-4 divide-y divide-line">
        <div class="flex items-center gap-3 p-3">
          <span class="text-2xl" aria-hidden="true">🥇</span>
          <div class="min-w-0 flex-1">
            <p class="font-semibold">Gold & silver price watch</p>
            <p class="text-xs text-muted">{{ watch() ? label(watch()!) : 'No target set yet' }}</p>
          </div>
          <a routerLink="/gold-price-calculator" class="btn-ghost min-h-9 shrink-0 text-xs">{{ watch() ? 'Change' : 'Set target' }}</a>
        </div>
        @for (t of soon; track t.name) {
          <div class="flex items-center gap-3 p-3 opacity-60">
            <span class="text-2xl" aria-hidden="true">{{ t.icon }}</span>
            <div class="min-w-0 flex-1"><p class="font-semibold">{{ t.name }}</p><p class="text-xs text-muted">{{ t.note }}</p></div>
            <span class="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold">Soon</span>
          </div>
        }
      </section>

      <div class="mt-4 flex flex-wrap gap-2">
        @if (push.on()) {
          <button type="button" class="btn-primary min-h-10" [disabled]="busy()" (click)="test()">Send me a test</button>
          <button type="button" class="btn-ghost min-h-10" [disabled]="busy()" (click)="off()">Turn off all notifications</button>
        } @else if (push.supported) {
          <button type="button" class="btn-primary min-h-10" [disabled]="busy()" (click)="turnOn()">🔔 Turn on notifications</button>
        }
      </div>
      <p class="mt-3 text-xs text-muted">We keep only this phone’s push address and the alerts you chose — no name, no number. “Turn off” deletes them from our server.</p>
    </div>
  `,
})
export class Notifications {
  protected readonly push = inject(PushService);
  private readonly toast = inject(ToastService);
  protected readonly watch = signal<Watch | null>(null);
  protected readonly busy = signal(false);
  protected readonly soon = [
    { icon: '🏛️', name: 'Govt job notifications', note: 'New TGPSC / APPSC notices' },
    { icon: '🪔', name: 'Festival reminders', note: 'Make your wishes card 2 days before' },
    { icon: '🧩', name: 'Daily puzzle', note: 'Today’s Sudoku is ready' },
  ];

  constructor() {
    inject(SeoService).set({ title: 'My notifications — Spread Apps Tools', description: 'Choose the alerts you get from Spread Apps Tools.', path: 'notifications', noindex: true });
    afterNextRender(() => this.watch.set(readWatch()));
  }

  protected label(w: Watch) {
    const m = METALS.find((x) => x.id === w.metal)!;
    return `${m.label} at or below ${rupees(w.below)} ${m.unit}`;
  }

  protected async turnOn() {
    await this.run(async () => {
      const w = this.watch();
      await this.push.enable(w ? { metal: w.metal, below: w.below } : undefined);
      this.toast.show('Notifications are on 🔔', 'success');
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
