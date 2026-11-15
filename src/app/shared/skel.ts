import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Loading skeleton shown while a tool's code is still loading: a title bar, an input row and a big
 * result card with a soft shimmer. Give it the tool's usual height with a class, e.g.
 * `<app-skel class="h-96" />`, so nothing jumps when the tool appears.
 */
@Component({
  selector: 'app-skel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-busy': 'true', 'aria-label': 'Loading the tool', role: 'status' },
  template: `<i class="a"></i><span class="r"><i></i><i></i></span><i class="b"></i><i class="c"></i>`,
  styles: `
    :host { display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
    i { display: block; border-radius: 14px; background: var(--surface-2);
      background-image: linear-gradient(90deg, transparent, color-mix(in oklab, var(--surface) 65%, transparent), transparent);
      background-size: 200% 100%; background-repeat: no-repeat; animation: sk 1.3s ease-in-out infinite; }
    .a { height: 18px; width: 55%; border-radius: 8px; }
    .r { display: grid; grid-template-columns: 2fr 1fr; gap: 10px; }
    .r i { height: 46px; }
    .b { flex: 1; min-height: 120px; }
    .c { height: 46px; width: 40%; }
    @keyframes sk { from { background-position: 150% 0; } to { background-position: -50% 0; } }
    @media (prefers-reduced-motion: reduce) { i { animation: none; } }
  `,
})
export class Skel {}
