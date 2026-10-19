import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Icon } from './shared/icon';
import { ConsentService } from './core/consent.service';
import { EXAMS, examPath } from './core/exams';
import { ThemeService } from './core/theme.service';
import { ConsentBanner } from './shared/consent-banner';
import { DialogHost } from './shared/dialog-host';
import { ToastHost } from './shared/toast-host';
import { UpdateBanner } from './shared/update-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Icon, ToastHost, DialogHost, UpdateBanner, ConsentBanner],
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-ink">Skip to tool</a>
    <header class="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div class="mx-auto flex h-12 max-w-6xl items-center gap-2 px-3 sm:px-4">
        <a routerLink="/" class="flex items-center gap-2 font-bold tracking-tight" aria-label="SpreadApps Tools home">
          <img src="favicon.svg" alt="" width="28" height="28" class="size-7" />
          <span class="text-[15px]">SpreadApps <span class="text-brand">Tools</span></span>
        </a>
        <nav class="ml-auto flex items-center gap-1 text-sm font-medium" aria-label="Main">
          <a routerLink="/" fragment="exam-photo" class="hidden rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-ink sm:block">Exam photos</a>
          <a routerLink="/resize-image-to-kb" class="hidden rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-ink sm:block">Resize to KB</a>
          <button class="btn-icon size-9 border-transparent bg-transparent" (click)="theme.toggle()"
                  [attr.aria-label]="theme.dark() ? 'Switch to light theme' : 'Switch to dark theme'">
            <svg [lucideIcon]="theme.dark() ? 'sun' : 'moon'" [size]="18" />
          </button>
        </nav>
      </div>
    </header>

    <main id="main" class="mx-auto min-h-[70vh] max-w-6xl px-3 pt-3 pb-8 sm:px-4">
      <router-outlet />
    </main>

    <footer class="border-t border-line bg-surface">
      <div class="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
        <div>
          <p class="flex items-center gap-2 font-bold"><img src="favicon.svg" alt="" width="20" height="20" class="size-5" /> SpreadApps Tools</p>
          <p class="mt-2 flex items-start gap-1.5 text-muted">
            <svg lucideIcon="shield-check" [size]="16" class="mt-0.5 shrink-0 text-accent" />
            Free tools that run in your browser. Your photos and files never leave your device.
          </p>
        </div>
        <nav aria-label="Exam photo tools">
          <p class="mb-2 font-semibold">Exam photo & signature</p>
          <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-muted">
            @for (e of exams; track e.slug) {
              <li><a [routerLink]="'/' + photoPath(e)" class="hover:text-brand">{{ e.name }} photo</a></li>
            }
          </ul>
        </nav>
        <nav aria-label="About this site">
          <p class="mb-2 font-semibold">About</p>
          <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-muted">
            <li><a routerLink="/about" class="hover:text-brand">About us</a></li>
            <li><a routerLink="/contact" class="hover:text-brand">Contact</a></li>
            <li><a routerLink="/privacy" class="hover:text-brand">Privacy policy</a></li>
            <li><a routerLink="/terms" class="hover:text-brand">Terms of use</a></li>
            <li><button class="text-left hover:text-brand" (click)="consent.openSettings()">Cookie settings</button></li>
          </ul>
        </nav>
      </div>
      <p class="border-t border-line px-4 py-3 text-center text-xs text-muted">
        © {{ year }} <a href="https://spreadapps.in" class="hover:text-brand">SpreadApps</a> · Made in India
      </p>
    </footer>

    <app-consent-banner />
    <app-update-banner />
    <app-toast-host />
    <app-dialog-host />
  `,
})
export class App {
  protected readonly theme = inject(ThemeService);
  protected readonly consent = inject(ConsentService);
  protected readonly exams = EXAMS;
  protected readonly year = new Date().getFullYear();

  constructor() {
    this.consent.init();
  }

  protected photoPath(e: (typeof EXAMS)[number]) {
    return examPath(e, 'photo');
  }
}
