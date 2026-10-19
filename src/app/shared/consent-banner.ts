import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';
import { ConsentService } from '../core/consent.service';

/** Small bottom bar — never covers the tool for long, and the page reserves space while it's open. */
@Component({
  selector: 'app-consent-banner',
  imports: [RouterLink, Icon],
  template: `
    @if (consent.showBanner || consent.settingsOpen()) {
      <div class="h-40 sm:h-20" aria-hidden="true"></div>
      <section class="animate-fade-up fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface/95 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur pb-safe"
               aria-label="Cookie choices">
        <div class="mx-auto flex max-w-5xl flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center">
          <svg lucideIcon="cookie" [size]="20" class="hidden shrink-0 text-brand sm:block" />
          <p class="flex-1 text-xs leading-relaxed text-muted sm:text-sm">
            We use cookies for visitor statistics (Google Analytics) and ads (Google AdSense) that keep these tools free.
            Your photos and files are never uploaded. <a routerLink="/privacy" class="font-medium text-brand underline">Privacy policy</a>
          </p>
          <div class="flex gap-2">
            <button class="btn-ghost flex-1 sm:flex-none" (click)="consent.choose('necessary')">Only necessary</button>
            <button class="btn-primary flex-1 sm:flex-none" (click)="consent.choose('all')">Accept all</button>
          </div>
        </div>
      </section>
    }
  `,
})
export class ConsentBanner {
  protected readonly consent = inject(ConsentService);
}
