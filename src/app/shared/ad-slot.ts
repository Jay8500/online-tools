import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, inject, input, isDevMode } from '@angular/core';
import { SITE } from '../core/site.config';

/**
 * One AdSense unit with reserved height (no layout shift). Place it only below the tool's
 * download area or in the side column — never between controls and the download button.
 * Without an AdSense ID nothing renders (dev builds show a dashed placeholder to check layout).
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
    } @else if (dev) {
      <div class="my-4 grid place-items-center rounded-xl border-2 border-dashed border-line text-xs text-muted" [style.min-height.px]="minHeight()">
        Ad slot: {{ slot() }}
      </div>
    }
  `,
})
export class AdSlot {
  readonly slot = input.required<string>();
  readonly minHeight = input(100);
  protected readonly client = SITE.adsenseClient;
  protected readonly dev = isDevMode();
  protected get slotId() {
    return SITE.adSlots[this.slot()] ?? '';
  }

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      if (!browser || !this.client || !this.slotId) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* ad blockers — ignore */
      }
    });
  }
}
