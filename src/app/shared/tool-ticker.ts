import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from './icon';

/**
 * A slow, endless strip of tool chips under the home search — shows at a glance how much is here.
 * Pure CSS: the list is drawn twice and slides by half its width. Pauses on hover, touch or keyboard focus;
 * with "reduce motion" it becomes a normal swipeable row.
 */
@Component({
  selector: 'app-tool-ticker',
  imports: [RouterLink, Icon],
  template: `
    <div class="ticker relative -mx-3 mt-3 overflow-hidden px-3 sm:mx-0 sm:px-0" role="region" aria-label="Some of our tools">
      <ul class="track flex w-max gap-2 py-1">
        @for (copy of [0, 1]; track copy) {
          @for (t of items(); track t.path) {
            <li [attr.aria-hidden]="copy === 1 ? 'true' : null">
              <a class="chip min-h-8 gap-1.5 text-xs whitespace-nowrap" [routerLink]="'/' + t.path" [attr.tabindex]="copy === 1 ? -1 : null">
                <svg [lucideIcon]="t.icon" [size]="14" class="text-brand" /> {{ t.name }}
                @if (t.fresh) { <span class="rounded-full bg-brand px-1.5 text-[9px] leading-4 font-bold text-white">NEW</span> }
              </a>
            </li>
          }
        }
      </ul>
    </div>
  `,
  styles: `
    .ticker { mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
    .track { animation: slide 60s linear infinite; }
    .ticker:hover .track, .ticker:focus-within .track, .ticker:active .track { animation-play-state: paused; }
    @keyframes slide { to { transform: translateX(calc(-50% - 0.25rem)); } }
    @media (prefers-reduced-motion: reduce) {
      .ticker { overflow-x: auto; mask-image: none; scrollbar-width: none; }
      .track { animation: none; }
      li[aria-hidden='true'] { display: none; }
    }
  `,
})
export class ToolTicker {
  readonly items = input.required<{ path: string; name: string; icon: string; fresh: boolean }[]>();
}
