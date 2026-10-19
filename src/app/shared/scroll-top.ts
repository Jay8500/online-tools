import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';

/**
 * "Back to top" bubble with the Spread Apps logo — appears after scrolling down a screen or so,
 * bobs gently, and glides to the top. Bottom-right, small, above the safe area so it never covers a tool's buttons.
 */
@Component({
  selector: 'app-scroll-top',
  template: `
    @if (show()) {
      <button type="button" (click)="top()" aria-label="Back to top" title="Back to top"
              class="scroll-top group fixed right-3 z-30 grid size-12 place-items-center rounded-full border border-brand/30 bg-surface shadow-lg shadow-brand/20 transition hover:-translate-y-1 hover:shadow-xl sm:right-5">
        <img src="favicon.svg" alt="" width="26" height="26" class="transition group-hover:scale-110" />
        <span class="absolute -top-1.5 -right-1 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-ink shadow" aria-hidden="true">↑</span>
      </button>
    }
  `,
  styles: `
    .scroll-top { bottom: calc(1rem + env(safe-area-inset-bottom)); animation: pop 0.35s cubic-bezier(0.2, 1.4, 0.4, 1) both, bob 2.8s ease-in-out 0.4s infinite; }
    @keyframes pop { from { opacity: 0; transform: scale(0.4) translateY(12px); } to { opacity: 1; transform: none; } }
    @keyframes bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -3px; } }
    @media (prefers-reduced-motion: reduce) { .scroll-top { animation: none; } }
  `,
})
export class ScrollTop {
  protected readonly show = signal(false);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const win = this.doc.defaultView!;
      let ticking = false;
      const check = () => {
        ticking = false;
        this.show.set(win.scrollY > win.innerHeight * 0.8);
      };
      const onScroll = () => {
        if (!ticking) (ticking = true), win.requestAnimationFrame(check);
      };
      win.addEventListener('scroll', onScroll, { passive: true });
      destroy.onDestroy(() => win.removeEventListener('scroll', onScroll));
    });
  }

  protected top() {
    const win = this.doc.defaultView!;
    const smooth = !win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    win.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    // Move keyboard focus to the top too (screen readers / keyboard users)
    this.doc.getElementById('main')?.focus({ preventScroll: true });
  }
}
