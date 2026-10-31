import { Component, ElementRef, afterNextRender, inject, output, signal, viewChild } from '@angular/core';
import { Icon } from './icon';

interface News {
  title: string;
  summary: string;
  link: string;
  source: string;
  at: string;
}

const CATS = [
  { id: 'telangana', label: 'Telangana' },
  { id: 'andhra', label: 'Andhra Pradesh' },
  { id: 'india', label: 'India' },
  { id: 'top', label: 'Top stories' },
  { id: 'telugu', label: 'తెలుగు' },
];
const KEY = 'news-cat';

/**
 * 📰 News panel (opened from the header; loaded only when opened). One headline per screen —
 * swipe / scroll up for the next one, like short-news apps. Headlines link back to the publisher.
 */
@Component({
  selector: 'app-news-panel',
  imports: [Icon],
  host: { '(document:keydown)': 'key($event)' },
  template: `
    <div class="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="news-title">
      <button type="button" class="backdrop absolute inset-0 bg-black/45" aria-label="Close news" tabindex="-1" (click)="closed.emit()"></button>
      <div class="sheet relative flex h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:h-[80dvh] sm:max-w-md sm:rounded-3xl">
        <div class="flex items-center gap-2 px-4 pt-3">
          <h2 id="news-title" class="flex items-center gap-1.5 text-base font-bold"><svg lucideIcon="newspaper" [size]="18" class="text-brand" /> News</h2>
          <span class="text-xs text-muted">{{ items().length ? index() + 1 + ' / ' + items().length : '' }}</span>
          <button type="button" class="close ml-auto grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Close news" (click)="closed.emit()">
            <svg lucideIcon="x" [size]="18" />
          </button>
        </div>
        <div class="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none]" role="tablist" aria-label="News category">
          @for (c of cats; track c.id) {
            <button type="button" role="tab" class="chip min-h-8 shrink-0 text-xs" [attr.aria-selected]="cat() === c.id" [attr.aria-pressed]="cat() === c.id" (click)="load(c.id)">{{ c.label }}</button>
          }
        </div>

        <div #feed class="feed relative flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain" (scroll)="onScroll()" aria-live="polite">
          @if (state() === 'loading') {
            <div class="grid h-full place-items-center text-sm text-muted">Loading news…</div>
          } @else if (state() === 'error') {
            <div class="grid h-full place-items-center px-6 text-center text-sm text-muted">News is not available right now.<br />Please try again in a few minutes.</div>
          } @else {
            @for (n of items(); track n.link; let i = $index) {
              <article class="flex h-full snap-start flex-col justify-center gap-3 border-b border-line px-5 py-6">
                <p class="text-xs font-semibold text-brand">{{ n.source }}{{ n.at ? ' · ' + ago(n.at) : '' }}</p>
                <h3 class="text-xl leading-snug font-bold sm:text-2xl">{{ n.title }}</h3>
                @if (n.summary && n.summary !== n.title) { <p class="text-base leading-relaxed text-muted">{{ n.summary }}</p> }
                <a [href]="n.link" target="_blank" rel="noopener noreferrer" class="btn-ghost mt-1 min-h-10 self-start text-sm">Read full story <svg lucideIcon="chevron-right" [size]="16" /></a>
                @if (i === 0 && items().length > 1) { <p class="hint mt-6 text-center text-xs text-muted">Swipe up for the next story ↑</p> }
              </article>
            }
          }
        </div>
        <p class="border-t border-line px-4 py-2 text-center text-[10px] text-muted">Headlines from the publishers’ public feeds · tap “Read full story” to read on their site</p>
      </div>
    </div>
  `,
  styles: `
    .backdrop { animation: fade 0.2s ease-out both; }
    .sheet { animation: rise 0.3s cubic-bezier(0.2, 0.9, 0.3, 1) both; }
    .hint { animation: nudge 1.6s ease-in-out 3; }
    @keyframes fade { from { opacity: 0; } }
    @keyframes rise { from { opacity: 0; transform: translateY(24px); } }
    @keyframes nudge { 50% { transform: translateY(-4px); } }
    @media (prefers-reduced-motion: reduce) { .backdrop, .sheet, .hint { animation: none; } }
  `,
})
export class NewsPanel {
  readonly closed = output<void>();
  protected readonly cats = CATS;
  protected readonly cat = signal('telangana');
  protected readonly items = signal<News[]>([]);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly index = signal(0);
  private readonly feed = viewChild<ElementRef<HTMLElement>>('feed');

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    afterNextRender(() => {
      host.querySelector<HTMLButtonElement>('button.close')?.focus();
      let start = 'telangana';
      try {
        start = localStorage.getItem(KEY) || start;
      } catch {
        /* default */
      }
      this.load(CATS.some((c) => c.id === start) ? start : 'telangana');
    });
  }

  protected async load(id: string) {
    this.cat.set(id);
    this.state.set('loading');
    this.index.set(0);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* not remembered */
    }
    try {
      const r = await fetch(`/api/news?cat=${id}`);
      const j = (await r.json()) as { items?: News[] };
      if (this.cat() !== id) return;
      this.items.set(j.items ?? []);
      this.state.set(j.items?.length ? 'ready' : 'error');
      this.feed()?.nativeElement.scrollTo({ top: 0 });
    } catch {
      if (this.cat() === id) this.state.set('error');
    }
  }

  protected onScroll() {
    const el = this.feed()?.nativeElement;
    if (el) this.index.set(Math.round(el.scrollTop / Math.max(1, el.clientHeight)));
  }

  protected key(e: KeyboardEvent) {
    if (e.key === 'Escape') return this.closed.emit();
    const el = this.feed()?.nativeElement;
    if (!el || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    el.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * el.clientHeight, behavior: 'smooth' });
  }

  protected ago(iso: string) {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
    const d = Math.round(h / 24);
    return `${d} day${d > 1 ? 's' : ''} ago`;
  }
}
