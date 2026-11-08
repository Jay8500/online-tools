import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tools that have their own drawn poster (others show their big icon instead). */
export const POSTER_PATHS = new Set(['resize-image-to-kb', 'gold-price-calculator', 'petrol-diesel-price', 'weather', 'emi-calculator', 'merge-pdf', 'telugu-panchangam', 'holiday-calendar']);

/**
 * Small drawn "poster" pictures for the home cards, streaming-app style: sits on the right of a card,
 * behind the text. Our own simple SVG shapes — no photos, nothing downloaded.
 */
@Component({
  selector: 'app-poster-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'poster-art', 'aria-hidden': 'true' },
  styles: `
    :host { position: absolute; z-index: -1; right: -6px; top: 50%; width: 120px; height: 120px; transform: translateY(-50%); pointer-events: none; opacity: 0.9; transition: transform 0.5s; }
    svg { width: 100%; height: 100%; overflow: visible; }
    .fl { animation: pa-float 4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .sh { animation: pa-shine 3.2s ease-in-out infinite; }
    .sp { animation: pa-spin 24s linear infinite; transform-origin: center; transform-box: fill-box; }
    @keyframes pa-float { 50% { transform: translateY(-5px); } }
    @keyframes pa-shine { 0%, 60% { opacity: 0; } 75% { opacity: 0.9; } 100% { opacity: 0; } }
    @keyframes pa-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .fl, .sh, .sp { animation: none; } }
  `,
  template: `
    <svg viewBox="0 0 120 120">
      @switch (path()) {
        @case ('resize-image-to-kb') {
          <g class="fl">
            <rect x="22" y="26" width="72" height="58" rx="8" fill="#fff" opacity=".95" transform="rotate(-6 58 55)" />
            <g transform="rotate(-6 58 55)">
              <rect x="28" y="32" width="60" height="40" rx="4" fill="#7dd3fc" />
              <circle cx="76" cy="42" r="6" fill="#fde047" />
              <path d="M28 72l18-20 12 12 9-8 21 16z" fill="#16a34a" />
            </g>
          </g>
          <rect x="70" y="80" width="40" height="22" rx="11" fill="#facc15" />
          <text x="90" y="95.5" text-anchor="middle" font-size="12" font-weight="800" fill="#1e1b4b">20 KB</text>
        }
        @case ('gold-price-calculator') {
          <g class="fl">
            <path d="M18 92h44l-7-18H25z" fill="#f59e0b" /><path d="M25 74h30l-4-6H29z" fill="#fde68a" />
            <path d="M58 92h44l-7-18H65z" fill="#fbbf24" /><path d="M65 74h30l-4-6H69z" fill="#fef3c7" />
            <path d="M38 72h44l-7-18H45z" fill="#fcd34d" /><path d="M45 54h30l-4-6H49z" fill="#fffbeb" />
            <circle cx="92" cy="34" r="16" fill="#e5e7eb" /><circle cx="92" cy="34" r="11" fill="none" stroke="#9ca3af" stroke-width="2" />
            <text x="92" y="39" text-anchor="middle" font-size="13" font-weight="800" fill="#6b7280">Ag</text>
          </g>
          <path class="sh" d="M50 50l4-10 4 10 10 4-10 4-4 10-4-10-10-4z" fill="#fff" />
        }
        @case ('petrol-diesel-price') {
          <g class="fl">
            <rect x="30" y="24" width="46" height="74" rx="8" fill="#f8fafc" />
            <rect x="38" y="32" width="30" height="20" rx="3" fill="#0f172a" />
            <text x="53" y="46" text-anchor="middle" font-size="10" font-weight="800" fill="#4ade80">₹ 1 0 7</text>
            <rect x="24" y="96" width="58" height="8" rx="4" fill="#e2e8f0" />
            <path d="M76 44h10a6 6 0 016 6v30a5 5 0 0010 0V48l-8-10" fill="none" stroke="#f8fafc" stroke-width="5" stroke-linecap="round" />
          </g>
          <path class="fl" d="M53 60c-6 8-9 12-9 17a9 9 0 0018 0c0-5-3-9-9-17z" fill="#f59e0b" />
        }
        @case ('weather') {
          <circle class="sp" cx="76" cy="40" r="22" fill="#fde047" />
          <g class="sp" style="transform-origin:76px 40px" stroke="#fde047" stroke-width="4" stroke-linecap="round">
            <path d="M76 6v8M76 66v8M42 40h8M102 40h8M52 16l6 6M94 58l6 6M52 64l6-6M94 22l6-6" />
          </g>
          <g class="fl"><path d="M24 92h58a16 16 0 000-32 22 22 0 00-42-4 15 15 0 00-16 36z" fill="#fff" opacity=".95" /></g>
        }
        @case ('emi-calculator') {
          <g class="fl">
            <path d="M18 62l34-28 34 28" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" />
            <rect x="28" y="58" width="48" height="38" rx="3" fill="#fff" />
            <rect x="46" y="72" width="12" height="24" fill="#2563eb" /><rect x="33" y="65" width="10" height="9" fill="#93c5fd" /><rect x="61" y="65" width="10" height="9" fill="#93c5fd" />
          </g>
          <g><ellipse cx="94" cy="96" rx="16" ry="5" fill="#d97706" /><ellipse cx="94" cy="90" rx="16" ry="5" fill="#f59e0b" /><ellipse cx="94" cy="84" rx="16" ry="5" fill="#fbbf24" />
            <ellipse cx="94" cy="78" rx="16" ry="5" fill="#fcd34d" /><text x="94" y="81" text-anchor="middle" font-size="8" font-weight="800" fill="#92400e">₹</text></g>
        }
        @case ('merge-pdf') {
          <g class="fl">
            <rect x="14" y="22" width="40" height="52" rx="5" fill="#fff" transform="rotate(-10 34 48)" />
            <rect x="66" y="22" width="40" height="52" rx="5" fill="#fff" transform="rotate(10 86 48)" />
            <rect x="38" y="46" width="44" height="58" rx="5" fill="#fff" />
            <rect x="44" y="52" width="32" height="10" rx="2" fill="#dc2626" /><text x="60" y="60" text-anchor="middle" font-size="8" font-weight="800" fill="#fff">PDF</text>
            <path d="M45 70h30M45 78h30M45 86h20" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" />
          </g>
        }
        @case ('telugu-panchangam') {
          <g class="sp" style="transform-origin:60px 60px">
            @for (a of rays; track a) { <path [attr.transform]="'rotate(' + a + ' 60 60)'" d="M60 8l6 18h-12z" fill="#fbbf24" /> }
          </g>
          <circle cx="60" cy="60" r="26" fill="#f59e0b" />
          <path d="M70 44a18 18 0 100 32 22 22 0 010-32z" fill="#fef3c7" />
          <circle class="sh" cx="60" cy="60" r="30" fill="none" stroke="#fff" stroke-width="2" />
        }
        @case ('holiday-calendar') {
          <g class="fl">
            <rect x="22" y="26" width="68" height="70" rx="8" fill="#fff" />
            <rect x="22" y="26" width="68" height="20" rx="8" fill="#e11d48" /><rect x="22" y="38" width="68" height="8" fill="#e11d48" />
            <rect x="36" y="18" width="6" height="16" rx="3" fill="#475569" /><rect x="70" y="18" width="6" height="16" rx="3" fill="#475569" />
            @for (c of cal; track $index) { <rect [attr.x]="c.x" [attr.y]="c.y" width="9" height="7" rx="2" [attr.fill]="$index === 6 ? '#f59e0b' : '#e2e8f0'" /> }
          </g>
          <g transform="translate(86 82)"><ellipse cx="0" cy="10" rx="16" ry="7" fill="#b45309" /><path class="fl" d="M0-14c-6 8-7 13-4 18a5 5 0 008 0c3-5 2-10-4-18z" fill="#fde047" /></g>
        }
      }
    </svg>
  `,
})
export class PosterArt {
  readonly path = input.required<string>();
  protected readonly rays = [0, 45, 90, 135, 180, 225, 270, 315];
  protected readonly cal = Array.from({ length: 12 }, (_, i) => ({ x: 30 + (i % 4) * 14, y: 54 + Math.floor(i / 4) * 12 }));
}
