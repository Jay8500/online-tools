import { DOCUMENT } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Light / dark theme. The first paint is handled by the inline script in index.html. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly dark = signal(false);

  constructor() {
    if (this.browser) this.dark.set(this.doc.documentElement.classList.contains('dark'));
  }

  toggle() {
    const dark = !this.dark();
    this.dark.set(dark);
    this.doc.documentElement.classList.toggle('dark', dark);
    this.doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a1414' : '#0d9488');
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch {
      /* private mode — theme just isn't remembered */
    }
  }
}
