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
