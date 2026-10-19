import { Component, input } from '@angular/core';
import { Icon } from './icon';

/** One-word reasons to use the site — shown under the home heading and in the footer. */
const ITEMS = [
  { icon: 'sparkles', word: 'Free', title: 'Every tool is free' },
  { icon: 'lock', word: 'Private', title: 'Your files and numbers stay on your device' },
  { icon: 'gauge', word: 'Fast', title: 'Small pages that open quickly on any phone' },
  { icon: 'download', word: 'Offline', title: 'Install it like an app; most tools work without internet' },
  { icon: 'shield-check', word: 'No signup', title: 'No account, no login, no OTP' },
  { icon: 'languages', word: 'తెలుగు', title: 'Made for Telangana & Andhra Pradesh — Telugu typing, local exams, local prices' },
];

@Component({
  selector: 'app-benefits',
  imports: [Icon],
  template: `
    <ul class="flex flex-wrap gap-1.5" [class.justify-center]="center()" aria-label="Why use Spread Apps Tools">
      @for (b of items; track b.word) {
        <li class="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink" [title]="b.title">
          <svg [lucideIcon]="b.icon" [size]="13" class="text-brand" />{{ b.word }}
        </li>
      }
    </ul>
  `,
})
export class Benefits {
  readonly center = input(false);
  protected readonly items = ITEMS;
}
