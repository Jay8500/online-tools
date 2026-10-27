import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { ConsentService } from '../core/consent.service';
import { ToastService } from '../core/toast.service';
import { UserTools } from '../core/user-tools';
import { Icon } from './icon';

const LIKED_KEY = 'liked-pages';
/** Pages without a like button (policy, contact and owner pages). */
const SKIP = new Set(['about', 'privacy', 'terms', 'contact', 'stats', '404', 'brand']);

/**
 * "Was this helpful? ❤️ · Suggest · Share on WhatsApp" at the bottom of every tool page. One like per page per browser;
 * the server counts it and emails the owner (netlify/functions/like.mts). Suggestions go to netlify/functions/feedback.mts.
 */
@Component({
  selector: 'app-like-box',
  imports: [Icon, RouterLink],
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
        <button type="button" class="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 font-semibold transition hover:border-brand/50 hover:text-brand"
                [attr.aria-expanded]="open()" (click)="open.set(!open())">
          <svg lucideIcon="message-square" [size]="17" /> Suggest
        </button>
        <a class="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-4 font-semibold transition hover:border-emerald-400 hover:text-emerald-600"
           [href]="shareUrl()" target="_blank" rel="noopener" (click)="shared()">
          <svg lucideIcon="share-2" [size]="17" /> Share on WhatsApp
        </a>
      </div>
      @if (open()) {
        <form class="mx-auto mb-8 -mt-4 max-w-md px-3" (submit)="send($event, p)">
          <label class="label" for="fb-text">What should we fix or add?</label>
          <textarea id="fb-text" class="input min-h-24 py-2" maxlength="400" placeholder="e.g. Add TSPSC Group 4 photo size" [value]="text()" (input)="text.set(val($event))"></textarea>
          <!-- Hidden from people; bots fill it -->
          <input class="absolute -left-[9999px] size-px opacity-0" tabindex="-1" autocomplete="off" aria-hidden="true" [value]="honey()" (input)="honey.set(val($event))" />
          <label class="label mt-3" for="fb-email">Your email <span class="font-normal text-muted">(optional — only if you want a reply)</span></label>
          <input id="fb-email" class="input" type="email" inputmode="email" autocomplete="email" maxlength="120" placeholder="you@example.com" [value]="email()" (input)="email.set(val($event))" />
          @if (email().trim()) {
            <label class="mt-2 flex items-start gap-2 text-xs text-muted">
              <input type="checkbox" class="mt-0.5 size-4 accent-brand" [checked]="agree()" (change)="agree.set(!agree())" />
              <span>Spread Apps may email me about this suggestion. Used only to reply, deleted after 6 months (<a routerLink="/privacy" class="text-brand underline">privacy</a>).</span>
            </label>
            @if (emailBad()) { <p class="mt-1 text-xs font-medium text-rose-600" role="alert">Please check the email address.</p> }
          } @else {
            <p class="mt-1 text-xs text-muted">No name or phone needed. Leave email empty to stay anonymous.</p>
          }
          <div class="mt-2 flex gap-2">
            <button type="submit" class="btn-primary min-h-10 flex-1" [disabled]="sending() || text().trim().length < 3 || (!!email().trim() && (emailBad() || !agree()))">{{ sending() ? 'Sending…' : 'Send' }}</button>
            <button type="button" class="btn-ghost min-h-10" (click)="open.set(false)">Cancel</button>
          </div>
        </form>
      }
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
  private readonly consent = inject(ConsentService);
  protected readonly page = signal<string | null>(null);
  protected readonly liked = signal(false);
  protected readonly count = signal(0);
  protected readonly popped = signal(false);
  protected readonly open = signal(false);
  protected readonly text = signal('');
  protected readonly honey = signal('');
  protected readonly email = signal('');
  protected readonly agree = signal(false);
  protected readonly emailBad = computed(() => !!this.email().trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email().trim()));
  protected readonly sending = signal(false);
  private readonly url = signal('https://tools.spreadapps.in/');
  protected readonly shareUrl = computed(() => {
    const p = this.page();
    const name = p === 'home' || !p ? 'Spread Apps Tools — free tools for India' : `${this.tools.ref(p)?.name ?? 'This free tool'} (free, no signup)`;
    return `https://wa.me/?text=${encodeURIComponent(`${name}: ${this.url()}`)}`;
  });

  constructor() {
    this.update(this.router.url);
    if (typeof window !== 'undefined') {
      window.addEventListener('open-suggest', (e) => {
        this.text.set(String((e as CustomEvent).detail ?? ''));
        this.open.set(true);
        setTimeout(() => {
          const t = document.getElementById('fb-text') as HTMLTextAreaElement | null;
          t?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          t?.focus();
        }, 50);
      });
    }
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => this.update(e.urlAfterRedirects));
  }

  private update(url: string) {
    const path = url.split(/[?#]/)[0].replace(/^\//, '') || 'home';
    const p = /^[a-z0-9-]{2,60}$/.test(path) && !SKIP.has(path) ? path : null;
    this.page.set(p);
    this.popped.set(false);
    this.open.set(false);
    this.count.set(0);
    this.url.set(`https://tools.spreadapps.in/${p && p !== 'home' ? p : ''}`);
    if (!p) return;
    this.liked.set(this.likedPages().includes(p));
    fetch(`/api/like?page=${p}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { count?: number } | null) => this.page() === p && this.count.set(Number(d?.count) || 0))
      .catch(() => undefined);
  }

  protected val(e: Event) {
    return (e.target as HTMLTextAreaElement).value;
  }

  protected shared() {
    this.consent.event('share', { method: 'whatsapp', page: this.page() ?? '' });
  }

  protected async send(e: Event, p: string) {
    e.preventDefault();
    const text = this.text().trim();
    if (text.length < 3 || this.sending()) return;
    this.sending.set(true);
    const name = this.tools.ref(p)?.name ?? (p === 'home' ? 'Home page' : document.querySelector('h1')?.textContent?.trim() || p);
    try {
      const r = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ page: p, name, text, email: this.agree() ? this.email().trim() : '', consent: this.agree(), website: this.honey() }) });
      if (!r.ok) throw new Error(String(r.status));
      this.text.set('');
      this.email.set('');
      this.agree.set(false);
      this.open.set(false);
      this.toast.show('🙏 Thanks! We read every suggestion.', 'success', 2600);
    } catch {
      this.toast.show('Couldn’t send right now. Please try again in a minute.', 'error', 3000);
    } finally {
      this.sending.set(false);
    }
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
