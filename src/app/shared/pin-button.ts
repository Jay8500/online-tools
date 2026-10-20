import { Component, inject, input } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { UserTools } from '../core/user-tools';
import { Icon } from './icon';

/** Small pin toggle on a tool card (sits above the card's stretched link). */
@Component({
  selector: 'app-pin-button',
  imports: [Icon],
  host: { class: 'relative z-10 shrink-0' },
  template: `
    <button type="button" class="grid size-8 place-items-center rounded-full transition hover:bg-surface-2"
            [class]="on() ? 'text-brand' : 'text-muted/60 hover:text-brand'"
            [attr.aria-pressed]="on()" [attr.aria-label]="(on() ? 'Unpin ' : 'Pin ') + name() + (on() ? ' from' : ' to') + ' the top'"
            [title]="on() ? 'Pinned to top — tap to unpin' : 'Pin to top'" (click)="toggle($event)">
      <svg lucideIcon="pin" [size]="15" [class.fill-current]="on()" />
    </button>
  `,
})
export class PinButton {
  readonly path = input.required<string>();
  readonly name = input('this tool');
  private readonly tools = inject(UserTools);
  private readonly toast = inject(ToastService);

  protected on() {
    return this.tools.pinned().includes(this.path());
  }

  protected toggle(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    const pinned = this.tools.toggle(this.path());
    this.toast.show(pinned ? `📌 ${this.name()} pinned to the top of home` : `${this.name()} unpinned`, 'success', 2200);
  }
}
