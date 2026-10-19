import { Component, input, output } from '@angular/core';
import type { InstallKind } from '../core/install';

/** The device-specific "how to install" line (or the one-tap button when the browser offers install). */
@Component({
  selector: 'app-install-steps',
  template: `
    @switch (kind()) {
      @case ('prompt') {
        <button type="button" class="btn-primary mt-2 min-h-9 text-sm" (click)="install.emit()">Install app — free</button>
      }
      @case ('ios') {
        <p class="mt-2 text-sm">Tap <b>Share</b>&nbsp;<span aria-hidden="true">⬆️</span> at the bottom, then <b>“Add to Home Screen”</b>&nbsp;<span aria-hidden="true">➕</span>.</p>
      }
      @case ('android') {
        <p class="mt-2 text-sm">Tap the <b>⋮ menu</b> at the top-right, then <b>“Install app”</b> or <b>“Add to Home screen”</b>.</p>
      }
      @case ('desktop') {
        <p class="mt-2 text-sm">Click the <b>install icon</b> <span aria-hidden="true">⊕</span> at the right end of the address bar (or <b>⋮ → Install</b>).</p>
      }
    }
  `,
})
export class InstallSteps {
  readonly kind = input.required<InstallKind>();
  readonly install = output<void>();
}
