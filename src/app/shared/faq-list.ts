import { Component, input } from '@angular/core';
import { Faq } from '../core/seo.service';

/** Native <details> FAQ — works without JS, matches the FAQPage JSON-LD. */
@Component({
  selector: 'app-faq-list',
  template: `
    <div class="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      @for (f of faqs(); track f.q) {
        <details class="group px-4 py-3">
          <summary class="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-ink">
            <h3>{{ f.q }}</h3>
            <span class="mt-0.5 text-muted transition group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-muted">{{ f.a }}</p>
        </details>
      }
    </div>
  `,
})
export class FaqList {
  readonly faqs = input.required<Faq[]>();
}
