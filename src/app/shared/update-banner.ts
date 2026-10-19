import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Icon } from './icon';
import { filter } from 'rxjs';

/**
 * PWA: the service worker keeps serving the old build until a reload. When a new
 * version has been downloaded, offer a one-tap update (checked on focus and every 15 min).
 */
@Component({
  selector: 'app-update-banner',
  imports: [Icon],
  template: `
    @if (ready()) {
      <div class="animate-fade-up fixed inset-x-3 bottom-3 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-xl ring-1 ring-white/10"
           role="status">
        <svg lucideIcon="sparkles" [size]="16" class="shrink-0 text-amber-300" />
        <span class="flex-1">A new version is ready.</span>
        <button class="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-100" (click)="reload()">Update now</button>
        <button class="p-1 text-white/60 hover:text-white" (click)="ready.set(false)" aria-label="Later"><svg lucideIcon="x" [size]="16" /></button>
      </div>
    }
  `,
})
export class UpdateBanner {
  private readonly sw = inject(SwUpdate);
  private readonly doc = inject(DOCUMENT);
  protected readonly ready = signal(false);

  constructor() {
    if (!this.sw.isEnabled) return;
    this.sw.versionUpdates.pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY')).subscribe(() => this.ready.set(true));
    this.sw.unrecoverable.subscribe(() => this.doc.location.reload());
    const check = () => this.sw.checkForUpdate().catch(() => undefined);
    setInterval(check, 15 * 60_000);
    this.doc.addEventListener('visibilitychange', () => this.doc.visibilityState === 'visible' && check());
  }

  async reload() {
    await this.sw.activateUpdate().catch(() => undefined);
    this.doc.location.reload();
  }
}
