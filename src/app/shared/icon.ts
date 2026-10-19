import { ChangeDetectionStrategy, Component, computed, input, isDevMode } from '@angular/core';
import { ICONS } from '../icons';

/**
 * Lucide icon as inline SVG: `<svg lucideIcon="camera" [size]="18" />`.
 * Our own tiny renderer over the tree-shakable `lucide` data (the Angular package bundled every icon).
 */
@Component({
  selector: 'svg[lucideIcon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
    '[attr.width]': 'size()',
    '[attr.height]': 'size()',
    class: 'shrink-0',
  },
  template: `
    @for (n of nodes(); track $index) {
      @let a = n[1];
      @switch (n[0]) {
        @case ('path') { <svg:path [attr.d]="a['d']" /> }
        @case ('circle') { <svg:circle [attr.cx]="a['cx']" [attr.cy]="a['cy']" [attr.r]="a['r']" /> }
        @case ('rect') { <svg:rect [attr.x]="a['x']" [attr.y]="a['y']" [attr.width]="a['width']" [attr.height]="a['height']" [attr.rx]="a['rx']" [attr.ry]="a['ry']" /> }
        @case ('line') { <svg:line [attr.x1]="a['x1']" [attr.y1]="a['y1']" [attr.x2]="a['x2']" [attr.y2]="a['y2']" /> }
        @case ('polyline') { <svg:polyline [attr.points]="a['points']" /> }
        @case ('polygon') { <svg:polygon [attr.points]="a['points']" /> }
        @case ('ellipse') { <svg:ellipse [attr.cx]="a['cx']" [attr.cy]="a['cy']" [attr.rx]="a['rx']" [attr.ry]="a['ry']" /> }
      }
    }
  `,
})
export class Icon {
  readonly lucideIcon = input.required<string>();
  readonly size = input(24);
  protected readonly nodes = computed(() => {
    const n = ICONS[this.lucideIcon()];
    if (!n && isDevMode()) console.warn(`Icon "${this.lucideIcon()}" is not registered in icons.ts`);
    return (n ?? []) as unknown as [string, Record<string, string>][];
  });
}
