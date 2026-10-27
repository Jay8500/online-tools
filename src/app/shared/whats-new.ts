import { Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_VERSION } from '../core/version';
import { Icon } from './icon';

/** Bottom sheet listing recently added tools. Loaded only when opened (@defer in home). */
@Component({
  selector: 'app-whats-new',
  imports: [RouterLink, Icon],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="wn-title">
      <button type="button" class="backdrop absolute inset-0 bg-black/40" aria-label="Close" tabindex="-1" (click)="closed.emit()"></button>
      <div class="sheet relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-4 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-5">
        <div class="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden="true"></div>
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 id="wn-title" class="text-lg font-bold">✨ New on Spread Apps Tools</h2>
            <p class="text-xs text-muted">{{ tools().length }} tools added recently — tap to try. <span class="font-mono">v{{ ver.version }}</span></p>
          </div>
          <button type="button" class="close grid size-9 shrink-0 place-items-center rounded-full hover:bg-surface-2" aria-label="Close" (click)="closed.emit()">
            <svg lucideIcon="x" [size]="18" />
          </button>
        </div>
        <ul class="mt-3 space-y-1.5">
          @for (t of tools(); track t.path; let i = $index) {
            <li class="item" [style.animation-delay.ms]="60 + i * 40">
              <a [routerLink]="'/' + t.path" (click)="closed.emit()" class="group flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-brand/50">
                <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><svg [lucideIcon]="t.icon" [size]="18" /></span>
                <span class="min-w-0 flex-1"><span class="block text-sm font-semibold group-hover:text-brand">{{ t.name }}</span><span class="block truncate text-xs text-muted">{{ t.blurb }}</span></span>
                <svg lucideIcon="chevron-right" [size]="16" class="shrink-0 text-muted" />
              </a>
            </li>
          }
        </ul>
        <p class="mt-4 text-center text-xs text-muted">Want a tool we don’t have? Use <b>Suggest</b> at the bottom of any page.</p>
      </div>
    </div>
  `,
  styles: `
    .backdrop { animation: fade 0.2s ease-out both; }
    .sheet { animation: rise 0.3s cubic-bezier(0.2, 0.9, 0.3, 1) both; }
    .item { animation: rise 0.35s ease-out both; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes rise { from { opacity: 0; transform: translateY(24px); } }
    @media (prefers-reduced-motion: reduce) { .backdrop, .sheet, .item { animation: none; } }
  `,
})
export class WhatsNew {
  readonly tools = input.required<{ path: string; name: string; icon: string; blurb: string }[]>();
  readonly closed = output<void>();
  protected readonly ver = APP_VERSION;

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    afterNextRender(() => host.querySelector('button.close')?.focus());
  }
}
