import { Injectable, signal } from '@angular/core';

/** Opens Spread Learn (its code, cards and pictures load only when it opens, or quietly once the page is idle). */
@Injectable({ providedIn: 'root' })
export class LearnService {
  readonly open = signal(false);
  /** Card to start on, e.g. from a shared link `?learn=universe.mars`. */
  readonly start = signal<{ topic: string; id: string } | null>(null);
  /** Screen point the overlay grows from (the header button). */
  readonly origin = signal<{ x: number; y: number } | null>(null);
  private warmed = false;

  warm() {
    if (this.warmed) return;
    this.warmed = true;
    import('../shared/learn-overlay').catch(() => (this.warmed = false));
  }

  show(topic = '', id = '') {
    this.start.set(topic ? { topic, id } : null);
    this.open.set(true);
  }

  showFrom(e: Event) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    this.origin.set({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    this.show();
  }

  close() {
    this.open.set(false);
    this.origin.set(null);
  }
}
