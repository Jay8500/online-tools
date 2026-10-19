import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, isDevMode } from '@angular/core';

/**
 * Public "used N times" counter — a Netlify Function storing numbers in Netlify Blobs.
 * Only a tool id is sent (never files or personal data). Failures are silent: the counter is a nice-to-have.
 */
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

  /** Count one successful use per tool per page visit. */
  hit(tool: string) {
    if (!this.on || this.counted.has(tool)) return;
    this.counted.add(tool);
    fetch('/api/count', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tool }), keepalive: true }).catch(
      () => undefined,
    );
  }
}
