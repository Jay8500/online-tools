import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, inject, input, isDevMode, signal } from '@angular/core';
import { SITE } from '../core/site.config';

/** Labels for the owner's preview of where ads will go (?adpreview=1). */
const NAMES: Record<string, string> = { top: 'Banner ad (below the tool)', inContent: 'In-article ad (between guide text)', sidebar: 'Side ad (desktop right column)' };

/**
 * One AdSense unit with reserved height (no layout shift). Place it only below the tool's
 * download area or in the side column — never between controls and the download button.
 * Without an AdSense ID nothing renders (dev builds show a dashed placeholder to check layout).
 * TEMPORARY: open any page with ?adpreview=1 to see the ad spaces (owner preview, this tab only).
 */
@Component({
  selector: 'app-ad-slot',
  template: `
    @if (client && slotId) {
      <div class="my-4 overflow-hidden text-center" [style.min-height.px]="minHeight()">
        <span class="mb-1 block text-[10px] tracking-wider text-muted/70 uppercase">Advertisement</span>
        <ins class="adsbygoogle block" [attr.data-ad-client]="client" [attr.data-ad-slot]="slotId" data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    } @else if (dev || preview()) {
      <div class="my-4 grid place-items-center rounded-xl border-2 border-dashed border-amber-400 bg-amber-400/10 p-3 text-center text-xs text-amber-800 dark:text-amber-200" [style.min-height.px]="minHeight()">
        <span><b class="block text-sm">📢 Google ad will appear here</b>{{ name() }} · preview only</span>
      </div>
    }
  `,
})
export class AdSlot {
  readonly slot = input.required<string>();
  readonly minHeight = input(100);
  protected readonly client = SITE.adsenseClient;
  protected readonly dev = isDevMode();
  protected readonly preview = signal(false);
  protected get slotId() {
    return SITE.adSlots[this.slot()] ?? '';
  }
  protected name() {
    return NAMES[this.slot()] ?? this.slot();
  }

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      if (!browser) return;
      try {
        if (location.search.includes('adpreview=1')) sessionStorage.setItem('adpreview', '1');
        this.preview.set(sessionStorage.getItem('adpreview') === '1');
      } catch {
        /* no preview */
      }
      if (!this.client || !this.slotId) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* ad blockers — ignore */
      }
    });
  }
}
