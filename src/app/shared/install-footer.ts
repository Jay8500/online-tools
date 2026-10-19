import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { InstallKind, installKind, isInstalled, promptInstall } from '../core/install';
import { InstallSteps } from './install-steps';

/** Permanent "Install as app" box in the footer — same steps as the one-time tip; says “installed” once done. */
@Component({
  selector: 'app-install-footer',
  imports: [InstallSteps],
  template: `
    @if (installed()) {
      <p class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-300">✓ Installed as an app on this device</p>
    } @else if (kind(); as k) {
      <div class="mt-3 rounded-xl border border-brand/25 bg-brand/5 p-3">
        <p class="flex items-center gap-1.5 font-semibold"><span aria-hidden="true">📲</span> Use it like an app</p>
        <p class="text-xs text-muted">Free, opens from your home screen, works offline.</p>
        <app-install-steps [kind]="k" (install)="install()" />
      </div>
    }
  `,
})
export class InstallFooter {
  protected readonly kind = signal<InstallKind | null>(null);
  protected readonly installed = signal(false);

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    if (!browser) return;
    window.addEventListener('beforeinstallprompt', () => this.kind.set('prompt'));
    window.addEventListener('appinstalled', () => this.installed.set(true));
    afterNextRender(() => {
      if (isInstalled()) return this.installed.set(true);
      this.kind.set(installKind());
    });
  }

  protected async install() {
    if (await promptInstall()) this.installed.set(true);
  }
}
