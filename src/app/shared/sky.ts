import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type Scene = 'clear-day' | 'clear-night' | 'cloudy-day' | 'cloudy-night' | 'rain' | 'storm' | 'mist';

/** OpenWeatherMap icon code ("01d", "10n"…) → sky scene. */
export function sceneOf(icon: string | null | undefined): Scene {
  const c = (icon ?? '01d').slice(0, 2);
  const night = (icon ?? '').endsWith('n');
  if (c === '11') return 'storm';
  if (c === '09' || c === '10') return 'rain';
  if (c === '50' || c === '13') return 'mist';
  if (c === '01') return night ? 'clear-night' : 'clear-day';
  return night ? 'cloudy-night' : 'cloudy-day';
}

/**
 * Animated sky drawn with CSS only (no photos, no downloads): gradient + sun/moon + drifting clouds + rain/stars.
 * Sits behind content: put it inside a `relative overflow-hidden` box. Respects reduced-motion (styles.css).
 */
@Component({
  selector: 'app-sky',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sky pointer-events-none absolute inset-0 overflow-hidden', '[attr.data-scene]': 'scene()', 'aria-hidden': 'true' },
  styles: `
:host { background: linear-gradient(180deg, #3b8fd9 0%, #74b9ec 55%, #b9dcf5 100%); }
:host([data-scene='cloudy-day']) { background: linear-gradient(180deg, #5f88ad 0%, #8fb3cf 55%, #c7d9e6 100%); }
:host([data-scene='clear-night']) { background: linear-gradient(180deg, #0b1533 0%, #1b2d5c 60%, #2f4a7a 100%); }
:host([data-scene='cloudy-night']) { background: linear-gradient(180deg, #1a2238 0%, #2c3a57 60%, #44557a 100%); }
:host([data-scene='rain']) { background: linear-gradient(180deg, #46566b 0%, #6b7d92 60%, #95a5b5 100%); }
:host([data-scene='storm']) { background: linear-gradient(180deg, #23283a 0%, #3c4458 60%, #5d6679 100%); }
:host([data-scene='mist']) { background: linear-gradient(180deg, #8d9aa6 0%, #b3bdc5 60%, #d6dce0 100%); }

.sky-sun {
  position: absolute; top: -40px; right: -30px; width: 170px; height: 170px; border-radius: 50%;
  background: radial-gradient(circle, #fff7d1 0%, #ffe27a 35%, rgb(255 210 90 / 0.35) 60%, transparent 70%);
  animation: sky-glow 6s ease-in-out infinite;
}
.sky-moon {
  position: absolute; top: 18px; right: 28px; width: 46px; height: 46px; border-radius: 50%;
  background: #f4f1de; box-shadow: 0 0 30px 8px rgb(244 241 222 / 0.35), inset -10px -6px 0 0 #d9d4b8;
}
.sky-star { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #fff; animation: sky-twinkle 2.4s ease-in-out infinite; }
.sky-cloud {
  position: absolute; left: -50%; height: 46px; border-radius: 999px; background: #fff; filter: blur(6px);
  animation: sky-drift linear infinite;
}
.sky-cloud::before, .sky-cloud::after { content: ''; position: absolute; background: inherit; border-radius: 50%; }
.sky-cloud::before { width: 45%; height: 150%; left: 15%; top: -60%; }
.sky-cloud::after { width: 35%; height: 120%; left: 50%; top: -40%; }
:host([data-scene='rain']) .sky-cloud, :host([data-scene='storm']) .sky-cloud { background: #c9d1da; }
:host([data-scene$='night']) .sky-cloud { background: #8792ab; }
.sky-drop {
  position: absolute; top: -20px; width: 1.5px; height: 18px; border-radius: 2px;
  background: linear-gradient(transparent, rgb(255 255 255 / 0.8)); animation: sky-rain linear infinite;
}
.sky-flash { position: absolute; inset: 0; background: #fff; opacity: 0; animation: sky-flash 7s infinite; }
.sky-mist { position: absolute; left: -20%; right: -20%; height: 40%; top: 35%; background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.55), transparent); filter: blur(10px); animation: sky-mist 14s ease-in-out infinite alternate; }
.sky-mist-2 { top: 65%; animation-duration: 18s; animation-direction: alternate-reverse; }

@keyframes sky-drift { from { transform: translateX(0); } to { transform: translateX(260%); } }
@keyframes sky-glow { 0%, 100% { transform: scale(1); opacity: 0.95; } 50% { transform: scale(1.08); opacity: 1; } }
@keyframes sky-twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
@keyframes sky-rain { to { transform: translate(-30px, 420px); } }
@keyframes sky-flash { 0%, 91%, 95%, 100% { opacity: 0; } 92%, 94% { opacity: 0.55; } }
@keyframes sky-mist { from { transform: translateX(-8%); } to { transform: translateX(8%); } }
@media (prefers-reduced-motion: reduce) {
  .sky-sun, .sky-star, .sky-cloud, .sky-drop, .sky-flash, .sky-mist { animation: none; }
}
  `,
  template: `
    @if (scene() === 'clear-day' || scene() === 'cloudy-day') { <span class="sky-sun"></span> }
    @if (scene() === 'clear-night' || scene() === 'cloudy-night') {
      <span class="sky-moon"></span>
      @for (s of stars; track $index) { <span class="sky-star" [style.left.%]="s[0]" [style.top.%]="s[1]" [style.animation-delay.ms]="s[2]"></span> }
    }
    @if (scene() !== 'clear-night') {
      @for (c of clouds(); track $index) {
        <span class="sky-cloud" [style.top.%]="c[0]" [style.width.%]="c[1]" [style.animation-duration.s]="c[2]" [style.animation-delay.s]="-c[3]" [style.opacity]="c[4]"></span>
      }
    }
    @if (scene() === 'rain' || scene() === 'storm') {
      @for (r of drops; track $index) { <span class="sky-drop" [style.left.%]="r[0]" [style.animation-delay.ms]="r[1]" [style.animation-duration.ms]="r[2]"></span> }
    }
    @if (scene() === 'storm') { <span class="sky-flash"></span> }
    @if (scene() === 'mist') { <span class="sky-mist"></span><span class="sky-mist sky-mist-2"></span> }
  `,
})
export class Sky {
  readonly icon = input<string | null>(null);
  readonly scene = computed(() => sceneOf(this.icon()));
  /** [top %, width %, seconds per pass, start offset s, opacity] */
  protected readonly clouds = computed(() => {
    const heavy = /rain|storm|cloudy/.test(this.scene());
    const base: number[][] = [
      [8, 38, 48, 5, 0.9],
      [30, 30, 62, 30, 0.75],
      [55, 44, 55, 18, 0.6],
    ];
    return heavy ? [...base, [18, 50, 70, 45, 0.85], [42, 36, 58, 8, 0.7]] : base.slice(0, 2);
  });
  /** [left %, top %, twinkle delay ms] */
  protected readonly stars = [
    [8, 12, 0], [22, 30, 600], [35, 8, 1200], [48, 22, 300], [62, 12, 900], [74, 34, 1500], [86, 10, 450], [92, 28, 1100], [15, 48, 700], [55, 42, 200],
  ];
  /** [left %, delay ms, fall ms] */
  protected readonly drops = Array.from({ length: 28 }, (_, i) => [(i * 37) % 100, (i * 173) % 1200, 700 + ((i * 97) % 500)]);
}
