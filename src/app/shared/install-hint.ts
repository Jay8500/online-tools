import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { ConsentService } from '../core/consent.service';
import { InstallKind, installEvent, installKind, isInstalled, promptInstall } from '../core/install';
import { InstallSteps } from './install-steps';

const KEY = 'install-hint';

/**
 * One-time "install as an app" tip for first-time visitors, with the right steps for their device.
 * Shown once per device (even if ignored it hides after 20 s); the footer keeps a permanent install box.
 * Never shown when already installed, before the cookie choice, or in browsers that can't install.
 */
@Component({
  selector: 'app-install-hint',
  imports: [InstallSteps],
  template: `
    @if (visible()) {
      <aside class="install-hint fixed inset-x-3 z-40 mx-auto max-w-md rounded-2xl border border-brand/30 bg-surface p-3 shadow-2xl shadow-brand/20 sm:left-auto sm:right-5 sm:mx-0" role="dialog" aria-labelledby="ih-title">
        <button type="button" class="absolute top-2 right-2 grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink" (click)="close()" aria-label="Close install tip">✕</button>
        <div class="flex gap-3 pr-6">
          <img src="favicon.svg" alt="" width="40" height="40" class="mt-0.5 size-10 shrink-0 rounded-xl bg-brand/10 p-1.5" />
          <div class="min-w-0">
            <p id="ih-title" class="font-bold">Install SpreadApps Tools 📲</p>
            <p class="text-xs text-muted">Opens like an app from your home screen, works offline, no Play Store needed.</p>
            <app-install-steps [kind]="kind()!" (install)="install()" />
          </div>
        </div>
      </aside>
    }
  `,
  styles: `
    .install-hint { bottom: calc(0.75rem + env(safe-area-inset-bottom)); animation: ih-up 0.45s cubic-bezier(0.2, 1.2, 0.4, 1) both; }
    @keyframes ih-up { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: none; } }
    @media (prefers-reduced-motion: reduce) { .install-hint { animation: none; } }
  `,
})
export class InstallHint {
  private readonly consent = inject(ConsentService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ready = signal(false);
  private readonly done = signal(false);
  protected readonly kind = signal<InstallKind | null>(null);

  /** Waits for the cookie banner to be answered so two bottom cards never stack. */
  protected readonly visible = computed(() => this.ready() && !this.done() && !!this.kind() && !this.consent.showBanner);

  constructor() {
    if (!this.browser) return;
    window.addEventListener('beforeinstallprompt', () => this.kind() && this.kind.set('prompt'));
    window.addEventListener('appinstalled', () => this.remember('installed'));
    afterNextRender(() => {
      if (this.seen() || isInstalled() || !installKind()) return;
      // Let people use the page first
      setTimeout(() => {
        // Wait (without counting) while the cookie banner is open, then show once — ever
        const show = () => {
          if (this.consent.showBanner) return void setTimeout(show, 3000);
          this.kind.set(installEvent() ? 'prompt' : installKind());
          this.ready.set(true);
          this.save('shown');
          // Slides away by itself if ignored; the footer keeps the steps
          setTimeout(() => this.done.set(true), 20000);
        };
        show();
      }, 6000);
    });
  }

  protected async install() {
    this.remember((await promptInstall()) ? 'installed' : 'dismissed');
  }

  protected close() {
    this.remember('dismissed');
  }

  private remember(v: string) {
    this.done.set(true);
    this.save(v);
  }

  private save(v: string) {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* hidden for this visit anyway */
    }
  }

  private seen() {
    try {
      return !!localStorage.getItem(KEY);
    } catch {
      return false;
    }
  }
}
