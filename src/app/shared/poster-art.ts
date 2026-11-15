import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Tools that have their own drawn poster (others show their big icon instead). */
export const POSTER_PATHS = new Set(['resize-image-to-kb', 'gold-price-calculator', 'petrol-diesel-price', 'weather', 'emi-calculator', 'merge-pdf', 'telugu-panchangam', 'holiday-calendar', 'travel-planner', 'ott-subscription-prices', 'festival-wishes-card', 'games/chess', 'mobile-recharge-plans', 'ifsc-code-finder', 'ssc-photo-resize', 'petrol-bunk-near-me']);

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
    .rd { animation: pa-road 1.6s linear infinite; }
    .dr { stroke-dasharray: 60; animation: pa-draw 3.6s ease-in-out infinite; }
    .pp1, .pp2, .pp3 { animation: pa-pop 3.6s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .pp2 { animation-delay: .6s; } .pp3 { animation-delay: 1.2s; }
    .bl { animation: pa-bump .9s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
    .br { animation: pa-bump .9s ease-in-out infinite reverse; transform-origin: center; transform-box: fill-box; }
    .sw { animation: pa-sway 3s ease-in-out infinite; transform-origin: 50% 100%; transform-box: fill-box; }
    @keyframes pa-road { to { stroke-dashoffset: -22; } }
    @keyframes pa-draw { 0% { stroke-dashoffset: 60; } 40%, 80% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -60; } }
    @keyframes pa-pop { 0%, 100% { transform: scale(.6); opacity: 0; } 20%, 70% { transform: scale(1); opacity: 1; } }
    @keyframes pa-bump { 50% { transform: translateY(-7px) rotate(-6deg); } }
    @keyframes pa-sway { 50% { transform: rotate(5deg); } }
    @media (prefers-reduced-motion: reduce) { .fl, .sh, .sp, .rd, .dr, .pp1, .pp2, .pp3, .bl, .br, .sw { animation: none; } .dr { stroke-dashoffset: 0; } }
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
        @case ('play-chess') {
          <g opacity=".35" fill="#fff">@for (c of board; track $index) { <rect [attr.x]="c.x" [attr.y]="c.y" width="8" height="8" rx="1.5" /> }</g>
          <g class="fl" fill="#fff" stroke="#1e1b4b" stroke-width="3" stroke-linejoin="round">
            <path d="M40 102h50l-4-12H44z" /><path d="M48 90c0-14 4-22 12-30-8-2-14-10-10-20 4-10 18-12 26-4 8 8 8 26 2 40l4 14z" />
          </g>
          <circle class="fl" cx="62" cy="46" r="3" fill="#1e1b4b" />
          <path class="sh" d="M100 20l3-8 3 8 8 3-8 3-3 8-3-8-8-3z" fill="#fde047" />
        }
        @case ('play-sudoku') {
          <g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.5"><rect x="22" y="18" width="84" height="84" rx="8" /><path d="M50 18v84M78 18v84M22 46h84M22 74h84" /></g>
          <g font-size="20" font-weight="800" text-anchor="middle" fill="#fff"><text x="36" y="39">5</text><text x="92" y="67">7</text><text x="64" y="95">9</text></g>
          <g font-size="20" font-weight="800" text-anchor="middle" fill="#fde047"><text class="pp1" x="64" y="39">3</text><text class="pp2" x="36" y="67">8</text><text class="pp3" x="92" y="95">1</text></g>
        }
        @case ('play-ttt') {
          <g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"><path d="M50 22v76M78 22v76M24 48h80M24 74h80" /></g>
          <g fill="none" stroke-width="7" stroke-linecap="round">
            <path class="dr" d="M28 28l14 14M42 28L28 42" stroke="#fff" />
            <circle class="dr" cx="64" cy="61" r="9" stroke="#fde047" style="animation-delay:.5s" />
            <path class="dr" d="M86 80l14 14M100 80l-14 14" stroke="#fff" style="animation-delay:1s" />
          </g>
          <path class="dr" d="M22 22l84 84" stroke="#fde047" stroke-width="4" stroke-linecap="round" opacity=".8" style="animation-delay:1.6s" />
        }
        @case ('play-rps') {
          <text class="bl" x="18" y="74" font-size="40">✊</text>
          <text class="br" x="62" y="74" font-size="40">✋</text>
          <text class="fl" x="42" y="112" font-size="30">✌️</text>
          <path class="sh" d="M60 18l3-8 3 8 8 3-8 3-3 8-3-8-8-3z" fill="#fde047" />
        }
        @case ('play-stories') {
          <g class="sw">
            <path d="M62 112c0-30 2-60 4-92" stroke="#fde68a" stroke-width="3" fill="none" />
            <ellipse cx="64" cy="44" rx="22" ry="34" fill="#0d9488" />
            <ellipse cx="64" cy="44" rx="13" ry="20" fill="#2dd4bf" />
            <ellipse cx="64" cy="40" rx="8" ry="10" fill="#1e3a8a" />
            <circle cx="64" cy="38" r="4" fill="#fde047" />
          </g>
          <path class="sh" d="M100 22l3-8 3 8 8 3-8 3-3 8-3-8-8-3z" fill="#fde047" />
        }
        @case ('travel-planner') {
          <path d="M14 96c18-6 20-30 42-30s26-22 50-24" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round" opacity=".85" class="rd" />
          <g class="fl"><path d="M100 22c-9 0-16 7-16 16 0 12 16 28 16 28s16-16 16-28c0-9-7-16-16-16z" fill="#f43f5e" /><circle cx="100" cy="38" r="6" fill="#fff" /></g>
          <g class="fl" transform="translate(18 70)"><rect x="0" y="8" width="38" height="16" rx="6" fill="#fde047" /><path d="M6 8l6-9h16l6 9" fill="#facc15" /><circle cx="9" cy="25" r="5" fill="#1e293b" /><circle cx="29" cy="25" r="5" fill="#1e293b" /></g>
        }
        @case ('ott-subscription-prices') {
          <g class="fl">
            <rect x="16" y="26" width="84" height="56" rx="8" fill="#0f172a" stroke="#fff" stroke-width="4" />
            <path d="M50 42v24l20-12z" fill="#f43f5e" />
            <rect x="46" y="84" width="24" height="5" rx="2" fill="#fff" /><rect x="36" y="89" width="44" height="5" rx="2.5" fill="#fff" />
          </g>
          <circle class="sh" cx="96" cy="26" r="13" fill="#facc15" /><text x="96" y="31" text-anchor="middle" font-size="13" font-weight="800" fill="#1e1b4b">₹</text>
        }
        @case ('festival-wishes-card') {
          <g class="fl"><rect x="30" y="20" width="60" height="78" rx="8" fill="#fff" transform="rotate(-6 60 59)" />
            <g transform="rotate(-6 60 59)"><rect x="36" y="26" width="48" height="48" rx="5" fill="#7c3aed" /><path d="M60 40c-5 6-6 10-3 14a4 4 0 006 0c3-4 2-8-3-14z" fill="#fde047" /><ellipse cx="60" cy="58" rx="10" ry="4" fill="#f59e0b" />
            <rect x="40" y="80" width="40" height="4" rx="2" fill="#cbd5e1" /><rect x="46" y="88" width="28" height="4" rx="2" fill="#cbd5e1" /></g></g>
          <path class="sh" d="M98 24l3-8 3 8 8 3-8 3-3 8-3-8-8-3z" fill="#fff" /><path class="sh" d="M20 84l2-6 2 6 6 2-6 2-2 6-2-6-6-2z" fill="#fde047" style="animation-delay:1.2s" />
        }
        @case ('games/chess') {
          <g class="fl" fill="#fff" stroke="#1e1b4b" stroke-width="3" stroke-linejoin="round">
            <path d="M44 96h52l-4-12H48z" /><path d="M52 84c0-14 4-22 12-30-8-2-14-10-10-20 4-10 18-12 26-4 8 8 8 26 2 40l4 14z" />
          </g>
          <circle cx="66" cy="40" r="3" fill="#1e1b4b" />
          <g opacity=".5"><rect x="12" y="62" width="14" height="14" fill="#fff" /><rect x="26" y="76" width="14" height="14" fill="#fff" /><rect x="12" y="90" width="14" height="14" fill="#fff" /></g>
        }
        @case ('mobile-recharge-plans') {
          <g class="fl"><rect x="36" y="14" width="46" height="88" rx="9" fill="#0f172a" stroke="#fff" stroke-width="4" />
            <rect x="42" y="24" width="34" height="62" rx="3" fill="#0ea5e9" />
            @for (b of bars; track b.x) { <rect [attr.x]="b.x" [attr.y]="b.y" width="5" [attr.height]="76 - b.y" rx="1.5" fill="#fff" /> }
            <circle cx="59" cy="94" r="3" fill="#fff" /></g>
          <rect class="fl" x="76" y="64" width="34" height="18" rx="9" fill="#facc15" /><text x="93" y="77" text-anchor="middle" font-size="10" font-weight="800" fill="#1e1b4b">5G</text>
        }
        @case ('ifsc-code-finder') {
          <g class="fl"><path d="M22 46l38-22 38 22z" fill="#fff" /><rect x="22" y="46" width="76" height="6" fill="#e2e8f0" />
            @for (x of cols; track x) { <rect [attr.x]="x" y="56" width="8" height="28" rx="2" fill="#fff" /> }
            <rect x="18" y="86" width="84" height="8" rx="2" fill="#fff" /></g>
          <g transform="translate(80 70)"><circle r="14" fill="none" stroke="#facc15" stroke-width="5" /><path d="M10 10l12 12" stroke="#facc15" stroke-width="6" stroke-linecap="round" /></g>
        }
        @case ('ssc-photo-resize') {
          <g class="fl"><rect x="28" y="16" width="56" height="70" rx="6" fill="#fff" />
            <rect x="34" y="22" width="44" height="50" rx="3" fill="#bae6fd" /><circle cx="56" cy="40" r="10" fill="#fcd34d" /><path d="M38 72c2-12 9-18 18-18s16 6 18 18z" fill="#2563eb" />
            <rect x="40" y="76" width="32" height="5" rx="2" fill="#94a3b8" /></g>
          <rect x="70" y="80" width="40" height="22" rx="11" fill="#22c55e" /><text x="90" y="95.5" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">✓ SSC</text>
        }
        @case ('petrol-bunk-near-me') {
          <g class="fl"><path d="M60 14c-15 0-26 11-26 26 0 20 26 46 26 46s26-26 26-46c0-15-11-26-26-26z" fill="#f43f5e" />
            <rect x="50" y="28" width="16" height="22" rx="3" fill="#fff" /><rect x="53" y="31" width="10" height="7" rx="1" fill="#f43f5e" /><path d="M66 34h4v12a3 3 0 006 0V32l-4-4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" /></g>
          <ellipse cx="60" cy="100" rx="26" ry="6" fill="#000" opacity=".25" />
        }
      }
    </svg>
  `,
})
export class PosterArt {
  readonly path = input.required<string>();
  protected readonly rays = [0, 45, 90, 135, 180, 225, 270, 315];
  protected readonly board = [0, 2, 4, 6, 9, 11, 13, 15].map((i) => ({ x: 40 + (i % 4) * 16 + (Math.floor(i / 8) % 2) * 8, y: 104 + Math.floor(i / 8) * 8 }));
  protected readonly bars = [{ x: 47, y: 62 }, { x: 55, y: 54 }, { x: 63, y: 46 }, { x: 71, y: 38 }];
  protected readonly cols = [28, 42, 56, 70, 84];
  protected readonly cal = Array.from({ length: 12 }, (_, i) => ({ x: 30 + (i % 4) * 14, y: 54 + Math.floor(i / 4) * 12 }));
}
