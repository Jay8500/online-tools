import { Injectable, signal } from '@angular/core';

/** Opens the Spread Stories overlay (its code and stories load only when it opens). */
@Injectable({ providedIn: 'root' })
export class StoriesService {
  readonly open = signal(false);
  /** Story to start on; `welcome` = opened from a shared link, so greet with a glitter shower. */
  readonly start = signal<{ col: string; slug: string; welcome: boolean } | null>(null);

  show(col = '', slug = '', welcome = false) {
    this.start.set(col ? { col, slug, welcome } : null);
    this.open.set(true);
  }

  close() {
    this.open.set(false);
  }
}
