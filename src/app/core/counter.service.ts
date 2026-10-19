import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, isDevMode } from '@angular/core';

/**
 * Public "used N times" counter — a Netlify Function storing numbers in Netlify Blobs.
 * Only a tool id is sent (never files or personal data). Failures are silent: the counter is a nice-to-have.
 */
const NO_COUNT = 'no-count';

@Injectable({ providedIn: 'root' })
export class CounterService {
  private readonly on = isPlatformBrowser(inject(PLATFORM_ID)) && !isDevMode();
  private readonly counted = new Set<string>();

  async get(tool: string): Promise<number | null> {
    if (!this.on) return null;
    try {
      const r = await fetch(`/api/count?tool=${encodeURIComponent(tool)}`);
      if (!r.ok) return null;
      const j = (await r.json()) as { count?: number };
      return typeof j.count === 'number' ? j.count : null;
    } catch {
      return null;
    }
  }

  /** Count one successful use (download/share) per tool per page visit. */
  hit(tool: string) {
    this.send(tool, 'use');
  }

  /** Count a page view (the server keeps one per visitor per page per day). */
  view(tool: string) {
    this.send(tool, 'view');
  }

  /** The owner's devices (set on the /stats page) are never counted. */
  get excluded(): boolean {
    try {
      return localStorage.getItem(NO_COUNT) === '1';
    } catch {
      return false;
    }
  }

  setExcluded(on: boolean) {
    try {
      if (on) localStorage.setItem(NO_COUNT, '1');
      else localStorage.removeItem(NO_COUNT);
    } catch {
      /* storage blocked */
    }
  }

  private send(tool: string, kind: 'use' | 'view') {
    const key = `${kind}:${tool}`;
    if (!this.on || this.counted.has(key) || this.excluded) return;
    this.counted.add(key);
    fetch('/api/count', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tool, kind }), keepalive: true }).catch(
      () => undefined,
    );
  }
}
