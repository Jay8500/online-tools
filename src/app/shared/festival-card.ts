import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Festival } from '../core/celebrate';

/**
 * Greeting at the top of home on a festival day (big card + "Celebrate" shower), or a small
 * "Tomorrow: …" teaser 1–2 days before. Renders nothing on other days. Data loads on demand.
 */
@Component({
  selector: 'app-festival-card',
  imports: [RouterLink],
  template: `
    @if (fest(); as f) {
      @if (inDays() === 0) {
        <section class="festival-card animate-fade-up relative mb-3 overflow-hidden rounded-2xl border p-4 sm:p-5" [attr.data-theme]="f.theme" aria-label="Festival greeting">
          <span class="festival-glow" aria-hidden="true"></span>
          <div class="relative flex items-center gap-4">
            <span class="animate-float text-6xl sm:text-7xl" aria-hidden="true">@if (f.art === 'flag') { <span class="tricolour"></span> } @else { {{ f.art }} }</span>
            <div class="min-w-0">
              <p class="text-xs font-bold tracking-wide uppercase opacity-80">{{ f.mood === 'tribute' ? 'Today' : 'Today’s festival' }} · {{ dateText(f.date) }}</p>
              <h2 class="text-xl font-extrabold sm:text-2xl">{{ f.wish }}</h2>
              <p class="text-sm opacity-90">{{ f.mood === 'tribute' ? f.name + ' — a public holiday.' : 'From all of us at SpreadApps — have a safe and happy ' + f.name + '!' }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button type="button" class="btn-primary min-h-9 text-sm" (click)="celebrate()">{{ f.mood === 'tribute' ? '🌸 Pay tribute' : '🎉 Celebrate' }}</button>
                <a routerLink="/holiday-calendar" class="btn-ghost min-h-9 bg-surface/70 text-sm">All holidays →</a>
              </div>
            </div>
          </div>
        </section>
      } @else {
        <a routerLink="/holiday-calendar" class="animate-fade-up mb-3 flex items-center gap-3 rounded-2xl border border-line bg-gradient-to-r from-amber-400/20 via-rose-400/10 to-transparent px-3 py-2 text-sm hover:border-brand/50">
          <span class="animate-float text-2xl" aria-hidden="true">@if (f.art === 'flag') { <span class="tricolour"></span> } @else { {{ f.art }} }</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center gap-1.5 text-[10px] font-bold text-red-600 uppercase dark:text-red-400">
              <span class="relative flex size-1.5" aria-hidden="true"><span class="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75"></span><span class="relative inline-flex size-1.5 rounded-full bg-red-600"></span></span>
              {{ inDays() === 1 ? 'Tomorrow' : 'In ' + inDays() + ' days' }}
            </span>
            <b>{{ f.name }}</b><span class="text-muted">&nbsp;· {{ dateText(f.date) }} · holiday</span>
          </span>
          <span class="shrink-0 text-xs font-semibold text-brand">Holidays →</span>
        </a>
      }
    }
  `,
})
export class FestivalCard {
  protected readonly fest = signal<Festival | null>(null);
  protected readonly inDays = signal(0);

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(async () => {
      if (!browser) return;
      const { festivalNear } = await import('../core/celebrate');
      const n = festivalNear(2);
      if (n) {
        this.inDays.set(n.inDays);
        this.fest.set(n.f);
      }
    });
  }

  protected async celebrate() {
    const f = this.fest();
    if (!f) return;
    (await import('../core/celebrate')).shower(f.theme);
  }

  protected dateText(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
