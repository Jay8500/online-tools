import { Component, input } from '@angular/core';

/** SpreadApps logo + name, used on every page (header, footer, toasts, dialogs). */
@Component({
  selector: 'app-brand',
  host: { class: 'inline-flex items-center gap-2 font-bold tracking-tight' },
  template: `
    <img src="favicon.svg" alt="SpreadApps logo" [width]="size()" [height]="size()" [style.width.px]="size()" [style.height.px]="size()" />
    <span [class]="textClass()">SpreadApps</span>
    @if (tag()) {
      <span class="rounded-md bg-brand/10 px-1.5 py-0.5 text-[11px] leading-none font-bold text-brand uppercase">{{ tag() }}</span>
    }
  `,
})
export class Brand {
  readonly size = input(28);
  readonly tag = input('Tools');
  readonly textClass = input('text-[16px]');
}
