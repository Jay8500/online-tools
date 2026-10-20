import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ToastService } from '../core/toast.service';
import { UserTools } from '../core/user-tools';
import { Icon } from './icon';

const LIKED_KEY = 'liked-pages';
/** Pages without a like button (policy, contact and owner pages). */
const SKIP = new Set(['about', 'privacy', 'terms', 'contact', 'stats', '404', 'brand']);

/**
 * "Was this helpful? ❤️" at the bottom of every tool page. One like per page per browser;
 * the server counts it and emails the owner (see netlify/functions/like.mts).
 */
@Component({
  selector: 'app-like-box',
  imports: [Icon],
  template: `
    @if (page(); as p) {
      <div class="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 text-sm">
        <span class="text-muted">{{ liked() ? 'Thanks for the love!' : 'Was this helpful?' }}</span>
        <button type="button" class="like-btn inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 font-semibold transition"
                [class]="liked() ? 'border-rose-300 bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'border-line bg-surface hover:border-rose-300 hover:text-rose-600'"
                [class.pop]="popped()" [attr.aria-pressed]="liked()" [disabled]="liked()"
                [attr.aria-label]="liked() ? 'You loved this page' : 'Love this page'" (click)="like(p)">
          <svg lucideIcon="heart" [size]="18" [class.fill-current]="liked()" />
          {{ liked() ? 'Loved' : 'Love it' }}
          @if (count() > 0) { <span class="tabular-nums text-xs opacity-80">· {{ count() }}</span> }
        </button>
      </div>
    }
  `,
  styles: `
    .pop { animation: pop 0.45s ease-out; }
    @keyframes pop { 0% { transform: scale(1); } 40% { transform: scale(1.18); } 100% { transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .pop { animation: none; } }
  `,
})
export class LikeBox {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly tools = inject(UserTools);
  protected readonly page = signal<string | null>(null);
  protected readonly liked = signal(false);
  protected readonly count = signal(0);
  protected readonly popped = signal(false);

  constructor() {
    this.update(this.router.url);
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => this.update(e.urlAfterRedirects));
  }

  private update(url: string) {
    const path = url.split(/[?#]/)[0].replace(/^\//, '') || 'home';
    const p = /^[a-z0-9-]{2,60}$/.test(path) && !SKIP.has(path) ? path : null;
    this.page.set(p);
    this.popped.set(false);
    this.count.set(0);
    if (!p) return;
    this.liked.set(this.likedPages().includes(p));
    fetch(`/api/like?page=${p}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { count?: number } | null) => this.page() === p && this.count.set(Number(d?.count) || 0))
      .catch(() => undefined);
  }

  private likedPages(): string[] {
    try {
      const v = JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  protected like(p: string) {
    if (this.liked()) return;
    this.liked.set(true);
    this.popped.set(true);
    this.count.update((c) => c + 1);
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify([...this.likedPages(), p].slice(-200)));
    } catch {
      /* this visit only */
    }
    const name = this.tools.ref(p)?.name ?? (p === 'home' ? 'Home page' : document.querySelector('h1')?.textContent?.trim() || p);
    fetch('/api/like', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ page: p, name }), keepalive: true }).catch(() => undefined);
    this.toast.show('❤️ Thank you! Glad it helped.', 'success', 2200);
  }
}
