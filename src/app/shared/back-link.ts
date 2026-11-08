import { Component, inject } from '@angular/core';
import { NavBack } from '../core/nav-back.service';
import { Icon } from './icon';

/** "← Back" as the first item of a breadcrumb line, so back and the path share one row. */
@Component({
  selector: 'app-back-link',
  imports: [Icon],
  host: { class: 'contents' },
  template: `
    <button type="button" class="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 font-semibold text-muted transition hover:bg-surface-2 hover:text-ink"
            (click)="nav.back()" [attr.aria-label]="nav.canGoBack() ? 'Go back' : 'Go to all tools'">
      <svg lucideIcon="arrow-left" [size]="14" /> Back
    </button>
    <span class="mx-0.5 text-line" aria-hidden="true">|</span>
  `,
})
export class BackLink {
  protected readonly nav = inject(NavBack);
}
