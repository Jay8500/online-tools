import { Component, input } from '@angular/core';

/**
 * Our own products ("house ads"), clearly labelled as Spread Apps products — never styled like Google ads,
 * never placed next to an ad slot (AdSense policy). `footer` = small strip; `health` = one AI-Lab line.
 */
const PRODUCTS = [
  // Hidden while employed elsewhere (similar to the employer's software) — set hidden: false to show again
  { name: 'Spread Apps AI-Lab', emoji: '🧪', line: 'Lab software: patient tokens, sample tracking, instant reports on WhatsApp', url: 'https://ailab.spreadapps.in/?ref=tools', hidden: true },
  { name: 'Circles', emoji: '⭕', line: 'Project management app — every project, one circle', url: 'https://circles.spreadapps.in/?ref=tools', hidden: false },
];
const SHOWN = PRODUCTS.filter((p) => !p.hidden);
/** The AI-Lab line on health pages follows the AI-Lab switch above */
const SHOW_LAB = !PRODUCTS[0].hidden;

@Component({
  selector: 'app-more-from',
  template: `
    @if (variant() === 'health') {
      @if (showLab) {
      <p class="mt-6 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs text-muted">
        <span aria-hidden="true">🧪</span> Run a diagnostic lab? Our sister product <a [href]="products[0].url" target="_blank" rel="noopener" class="font-semibold text-brand underline">Spread Apps AI-Lab</a> handles tokens, sample tracking and instant reports on WhatsApp.
      </p>
      }
    } @else {
      <section class="mx-auto max-w-6xl px-4 pb-6 text-sm" aria-labelledby="more-from-h">
        <p id="more-from-h" class="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">More from Spread Apps</p>
        <div class="grid gap-2" [class.sm:grid-cols-2]="shown.length > 1">
          @for (p of shown; track p.name) {
            <a [href]="p.url" target="_blank" rel="noopener" class="flex items-center gap-3 rounded-xl border border-line px-3 py-2 hover:border-brand/50">
              <span class="text-2xl" aria-hidden="true">{{ p.emoji }}</span>
              <span class="min-w-0"><b class="block">{{ p.name }} <span class="font-normal text-muted">↗</span></b><span class="block text-xs text-muted">{{ p.line }}</span></span>
            </a>
          }
        </div>
      </section>
    }
  `,
})
export class MoreFrom {
  readonly variant = input<'footer' | 'health'>('footer');
  protected readonly products = PRODUCTS;
  protected readonly shown = SHOWN;
  protected readonly showLab = SHOW_LAB;
}
