import { Location, ViewportScroller } from '@angular/common';
import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Icon } from './shared/icon';
import { ConsentService } from './core/consent.service';
import { CALC_LINKS } from './core/calc-links';
import { TOOL_LINKS } from './core/tool-links';
import { EXAMS, examPath } from './core/exams';
import { ThemeService } from './core/theme.service';
import { Brand } from './shared/brand';
import { Benefits } from './shared/benefits';
import { ConsentBanner } from './shared/consent-banner';
import { DialogHost } from './shared/dialog-host';
import { ToastHost } from './shared/toast-host';
import { UpdateBanner } from './shared/update-banner';
import { ScrollTop } from './shared/scroll-top';
import { InstallHint } from './shared/install-hint';
import { InstallFooter } from './shared/install-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, Icon, Brand, Benefits, ToastHost, DialogHost, UpdateBanner, ConsentBanner, ScrollTop, InstallHint, InstallFooter],
  template: `
    <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-3 focus:py-2 focus:text-brand-ink">Skip to tool</a>
    <header class="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div class="mx-auto flex h-12 max-w-6xl items-center gap-2 px-3 sm:px-4">
        <a routerLink="/" aria-label="SpreadApps Tools home"><app-brand [size]="30" /></a>
        <nav class="ml-auto flex items-center gap-1 text-sm font-medium" aria-label="Main">
          <a routerLink="/exam-photo-signature-resize" class="hidden rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-ink sm:block">Exam photos</a>
          <a routerLink="/resize-image-to-kb" class="hidden rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-ink sm:block">Resize to KB</a>
          <a routerLink="/money-calculators" class="hidden rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-ink sm:block">Calculators</a>
          <button class="btn-icon size-9 border-transparent bg-transparent" (click)="theme.toggle()"
                  [attr.aria-label]="theme.dark() ? 'Switch to light theme' : 'Switch to dark theme'">
            <svg [lucideIcon]="theme.dark() ? 'sun' : 'moon'" [size]="18" />
          </button>
        </nav>
      </div>
    </header>

    <main id="main" class="mx-auto min-h-[70vh] max-w-6xl px-3 pt-3 pb-8 sm:px-4">
      @if (!isHome()) {
        <button type="button" class="mb-2 -ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-ink"
                (click)="back()" [attr.aria-label]="canGoBack() ? 'Go back' : 'Go to all tools'">
          <svg lucideIcon="arrow-left" [size]="16" /> {{ canGoBack() ? 'Back' : 'All tools' }}
        </button>
      }
      <router-outlet />
    </main>

    <footer class="border-t border-line bg-surface">
      <div class="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <a href="https://spreadapps.in" aria-label="SpreadApps website"><app-brand [size]="26" /></a>
          <p class="mt-2 flex items-start gap-1.5 text-muted">
            <svg lucideIcon="shield-check" [size]="16" class="mt-0.5 shrink-0 text-accent" />
            Free tools that run in your browser. Your photos and files never leave your device.
          </p>
          @defer (on idle) { <app-install-footer /> }
        </div>
        <nav aria-label="Exam photo tools">
          <a routerLink="/exam-photo-signature-resize" class="mb-2 block font-semibold hover:text-brand">Exam photo & signature</a>
          <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-muted">
            @for (e of exams; track e.slug) {
              <li><a [routerLink]="'/' + photoPath(e)" class="hover:text-brand">{{ e.name }} photo</a></li>
            }
          </ul>
        </nav>
        <nav aria-label="Money calculators">
          <a routerLink="/money-calculators" class="mb-2 block font-semibold hover:text-brand">Money calculators</a>
          <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-muted">
            @for (c of calcs; track c.id) {
              <li><a [routerLink]="'/' + c.path" class="hover:text-brand">{{ c.name }}</a></li>
            }
          </ul>
        </nav>
        <nav aria-label="More free tools">
          <p class="mb-2 font-semibold">PDF, business & more</p>
          <p class="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"><a routerLink="/pdf-tools" class="text-brand hover:underline">PDF tools</a><a routerLink="/business-tools" class="text-brand hover:underline">Business</a><a routerLink="/health-calculators" class="text-brand hover:underline">Health</a><a routerLink="/language-tools" class="text-brand hover:underline">Language</a><a routerLink="/unit-converters" class="text-brand hover:underline">Converters</a><a routerLink="/daily-tools" class="text-brand hover:underline">Daily</a></p>
          <ul class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-muted">
            @for (t of tools; track t.id) {
              <li><a [routerLink]="'/' + t.path" class="hover:text-brand">{{ t.name }}</a></li>
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
      <div class="border-t border-line px-4 py-3"><app-benefits [center]="true" /></div>
      <p class="border-t border-line px-4 py-3 text-center text-xs text-muted">
        © {{ year }} <a href="https://spreadapps.in" class="font-semibold hover:text-brand">SpreadApps</a> · A SpreadApps product · Made in India
      </p>
    </footer>

    <app-consent-banner />
    <app-update-banner />
    @defer (on idle) {
      <app-scroll-top />
      <app-install-hint />
    }
    <app-toast-host />
    <app-dialog-host />
  `,
})
export class App {
  protected readonly theme = inject(ThemeService);
  protected readonly consent = inject(ConsentService);
  protected readonly exams = EXAMS;
  protected readonly tools = TOOL_LINKS;
  protected readonly calcs = CALC_LINKS.filter((c) => !/-loan-emi$/.test(c.id));
  protected readonly year = new Date().getFullYear();

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly url = signal('/');
  /** Pages opened inside the app this visit (1 = landed directly, e.g. from Google). */
  private navs = 0;
  protected readonly canGoBack = signal(false);
  protected readonly isHome = computed(() => this.url().split(/[?#]/)[0] === '/');

  constructor() {
    // Anchor links (#health-calculators…) stop below the sticky 48px header
    inject(ViewportScroller).setOffset([0, 60]);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      this.url.set(e.urlAfterRedirects);
      this.navs++;
      this.canGoBack.set(this.navs > 1);
    });
    this.consent.init();
    // Keep the browser's install offer for our own install tip (loads a moment later)
    if (typeof window !== 'undefined')
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        (window as { __installEvent?: Event }).__installEvent = e;
      });
    // Festival day: a short shower of confetti/sparkles on the first page of the visit (code loads only then)
    afterNextRender(() => {
      setTimeout(async () => {
        const c = await import('./core/celebrate');
        const today = c.todayIso();
        const f = c.festivalOn(today);
        if (!f) return;
        try {
          if (sessionStorage.getItem('celebrated') === today) return;
          sessionStorage.setItem('celebrated', today);
        } catch {
          /* still show once */
        }
        c.shower(f.theme);
      }, 900);
    });
  }

  /** Back to the previous page in the app; if the visitor landed here directly, go to the home page. */
  protected back() {
    if (this.canGoBack()) this.location.back();
    else this.router.navigateByUrl('/');
  }

  protected photoPath(e: (typeof EXAMS)[number]) {
    return examPath(e, 'photo');
  }
}
