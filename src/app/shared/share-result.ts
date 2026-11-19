import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from './icon';

/**
 * "Share result" under a calculator answer: sends a short summary + a link to the same tool to WhatsApp or the
 * phone's share sheet. Only the numbers shown on screen are shared — nothing is stored.
 */
@Component({
  selector: 'app-share-result',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" class="btn-ghost mt-3 min-h-9 w-full text-sm" (click)="share()"><svg lucideIcon="share-2" [size]="15" /> Share result</button>`,
})
export class ShareResult {
  /** The summary lines (no link — it is added). */
  readonly text = input.required<string>();
  /** Page path, e.g. "emi-calculator" (default: the page you are on). */
  readonly path = input<string>('');

  protected async share() {
    const url = `https://tools.spreadapps.in/${this.path() || location.pathname.replace(/^\//, '')}?utm_source=result-share`;
    const text = `${this.text()}\n\nCalculate yours free: ${url}`;
    try {
      if (navigator.share) return await navigator.share({ text });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
}
