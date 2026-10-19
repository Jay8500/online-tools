import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { ConsentService } from '../core/consent.service';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
type Kind = 'prompt' | 'ios' | 'android' | 'desktop';

const KEY = 'install-hint';

/**
 * One-time "install as an app" tip for first-time visitors, with the right steps for their device.
 * Uses the browser's own install prompt where available (Chrome/Edge/Android). Closing it (✕) hides it for good.
 * Never shown when already installed, before the cookie choice, or in browsers that can't install.
 */
@Component({
  selector: 'app-install-hint',
  template: `
    @if (visible()) {
      <aside class="install-hint fixed inset-x-3 z-40 mx-auto max-w-md rounded-2xl border border-brand/30 bg-surface p-3 shadow-2xl shadow-brand/20 sm:left-auto sm:right-5 sm:mx-0" role="dialog" aria-labelledby="ih-title">
        <button type="button" class="absolute top-2 right-2 grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink" (click)="close()" aria-label="Close install tip">✕</button>
        <div class="flex gap-3 pr-6">
          <img src="favicon.svg" alt="" width="40" height="40" class="mt-0.5 size-10 shrink-0 rounded-xl bg-brand/10 p-1.5" />
          <div class="min-w-0">
            <p id="ih-title" class="font-bold">Install SpreadApps Tools 📲</p>
            <p class="text-xs text-muted">Opens like an app from your home screen, works offline, no Play Store needed.</p>
            @switch (kind()) {
              @case ('prompt') {
                <button type="button" class="btn-primary mt-2 min-h-9 text-sm" (click)="install()">Install app — free</button>
              }
              @case ('ios') {
                <p class="mt-2 text-sm">Tap <b>Share</b>&nbsp;<span aria-hidden="true">⬆️</span> at the bottom, then <b>“Add to Home Screen”</b>&nbsp;<span aria-hidden="true">➕</span>.</p>
              }
              @case ('android') {
                <p class="mt-2 text-sm">Tap the <b>⋮ menu</b> at the top-right, then <b>“Install app”</b> or <b>“Add to Home screen”</b>.</p>
              }
              @case ('desktop') {
                <p class="mt-2 text-sm">Click the <b>install icon</b> <span aria-hidden="true">⊕</span> at the right end of the address bar (or <b>⋮ → Install</b>).</p>
              }
            }
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
  protected readonly kind = signal<Kind | null>(null);
  private deferred: InstallEvent | null = null;

  /** Waits for the cookie banner to be answered so two bottom cards never stack. */
  protected readonly visible = computed(() => this.ready() && !this.done() && !!this.kind() && !this.consent.showBanner);

  constructor() {
    if (!this.browser) return;
    this.deferred = ((window as { __installEvent?: Event }).__installEvent as InstallEvent) ?? null;
    // Chrome/Edge/Android fire this when the site can be installed — keep it for our button
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as InstallEvent;
      if (this.kind() !== null) this.kind.set('prompt');
    });
    window.addEventListener('appinstalled', () => this.remember('installed'));
    afterNextRender(() => {
      if (this.seen() || matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone) return;
      const ua = navigator.userAgent;
      const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      const android = /Android/.test(ua);
      const chromium = /Chrome|Chromium|Edg\//.test(ua) && !/OPR\//.test(ua);
      // iPhone: only Safari (and Chrome on iOS 16.4+) can add to home screen; desktop Firefox/Safari can't install
      const k: Kind | null = this.deferred ? 'prompt' : ios ? 'ios' : android ? 'android' : chromium ? 'desktop' : null;
      if (!k) return;
      // Let people use the page first
      setTimeout(() => {
        this.kind.set(this.deferred ? 'prompt' : k);
        this.ready.set(true);
      }, 6000);
    });
  }

  protected async install() {
    if (!this.deferred) return;
    await this.deferred.prompt();
    const { outcome } = await this.deferred.userChoice;
    this.deferred = null;
    this.remember(outcome === 'accepted' ? 'installed' : 'dismissed');
  }

  protected close() {
    this.remember('dismissed');
  }

  private remember(v: string) {
    this.done.set(true);
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
