import { Injectable, signal } from '@angular/core';

/** Opens the Spread Stories overlay (its code and stories load only when it opens, or quietly once the page is idle). */
@Injectable({ providedIn: 'root' })
export class StoriesService {
  readonly open = signal(false);
  /** Story to start on; `welcome` = opened from a shared link, so greet with a glitter shower. */
  readonly start = signal<{ col: string; slug: string; welcome: boolean } | null>(null);
  /** Screen point the overlay grows from (the header ring), so opening feels like it comes out of the button. */
  readonly origin = signal<{ x: number; y: number } | null>(null);
  private warmed = false;

  constructor() {
    // Fetch the overlay a few seconds after the page settles, so a tap opens it instantly.
    if (typeof window !== 'undefined') setTimeout(() => (window.requestIdleCallback ?? setTimeout)(() => this.warm()), 4000);
  }

  warm() {
    if (this.warmed) return;
    this.warmed = true;
    import('../shared/stories-overlay').catch(() => (this.warmed = false));
  }

  show(col = '', slug = '', welcome = false) {
    this.start.set(col ? { col, slug, welcome } : null);
    this.open.set(true);
  }

  showFrom(e: Event) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.origin.set({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    this.show();
  }

  close() {
    this.open.set(false);
  }
}
