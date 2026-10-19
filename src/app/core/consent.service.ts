import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { SITE } from './site.config';

export type ConsentChoice = 'all' | 'necessary';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    adsbygoogle: unknown[];
  }
}

/**
 * Cookie consent + Google Consent Mode v2, GA4 and AdSense loading.
 * Defaults (all denied) are set by the inline script in index.html before anything loads.
 * GA4 loads only after "Accept all". AdSense loads either way — without consent Google serves
 * non-personalised ads without ad cookies.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly doc = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  /** null = visitor hasn't chosen yet */
  readonly choice = signal<ConsentChoice | null>(null);
  readonly settingsOpen = signal(false);
  /** True once the saved choice has been read in the browser — the prerendered HTML never contains the banner. */
  private readonly ready = signal(false);
  private gaLoaded = false;
  private adsLoaded = false;

  init() {
    if (!this.browser) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('consent');
    } catch {
      /* storage blocked */
    }
    if (saved === 'all' || saved === 'necessary') this.choice.set(saved);
    this.ready.set(true);
    // Wait until the page is idle so ads/analytics never slow down the first paint.
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 4000 }) : setTimeout(cb, 2500));
    idle(() => {
      this.loadAds();
      if (this.choice() === 'all') this.loadGa();
    });
  }

  /** Our banner is hidden when Google's certified CMP is in charge. */
  get showBanner() {
    return this.ready() && !SITE.useGoogleCmp && this.choice() === null;
  }

  choose(c: ConsentChoice) {
    this.choice.set(c);
    this.settingsOpen.set(false);
    try {
      localStorage.setItem('consent', c);
    } catch {
      /* not remembered */
    }
    const v = c === 'all' ? 'granted' : 'denied';
    window.gtag?.('consent', 'update', { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
    if (c === 'all') this.loadGa();
  }

  openSettings() {
    this.settingsOpen.set(true);
  }

  event(name: string, params: Record<string, string | number> = {}) {
    if (!this.browser || !this.gaLoaded) return;
    window.gtag('event', name, params);
  }

  private loadGa() {
    if (this.gaLoaded || !SITE.ga4Id) return;
    this.gaLoaded = true;
    this.script(`https://www.googletagmanager.com/gtag/js?id=${SITE.ga4Id}`);
    window.gtag('js', new Date());
    window.gtag('config', SITE.ga4Id, { anonymize_ip: true });
  }

  private loadAds() {
    if (this.adsLoaded || !SITE.adsenseClient) return;
    this.adsLoaded = true;
    this.script(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClient}`, true);
  }

  private script(src: string, crossorigin = false) {
    const s = this.doc.createElement('script');
    s.async = true;
    s.src = src;
    if (crossorigin) s.crossOrigin = 'anonymous';
    this.doc.head.appendChild(s);
  }
}
