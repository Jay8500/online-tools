import { Component, afterNextRender, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo.service';
import { STORIES, STORY_COL_INFO } from '../core/stories';
import { StoriesService } from '../core/stories.service';

/**
 * /stories (all collections) and /stories/:col/:slug (one story, readable by Google). A story page
 * opens the swipe view on its own — that is what a friend sees after tapping a shared link.
 */
@Component({
  selector: 'app-story-page',
  imports: [RouterLink],
  template: `
    @if (story(); as s) {
      <article class="mx-auto max-w-2xl">
        <p class="text-xs font-bold tracking-wide text-amber-700 uppercase dark:text-amber-400">
          <a routerLink="/stories" class="hover:underline">Spread Stories</a> · {{ colOf(s.c).icon }} {{ colOf(s.c).n.en }} · {{ s.en.src }}
        </p>
        <h1 class="mt-1 text-2xl font-extrabold sm:text-3xl" lang="te">{{ s.te.t }}</h1>
        <p class="text-lg font-semibold text-muted">{{ s.en.t }}</p>
        <div class="card mt-4 space-y-3 p-4" lang="te">
          <p class="leading-relaxed">{{ s.te.s }}</p>
          <p class="rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 font-bold"><span class="block text-[11px] tracking-wider text-amber-700 uppercase dark:text-amber-400">నేర్చుకోవాల్సింది</span>{{ s.te.l }}</p>
          <p class="text-xs text-muted">మూలం: {{ s.te.src }}</p>
        </div>
        <div class="card mt-3 space-y-3 p-4" lang="en">
          <p class="leading-relaxed">{{ s.en.s }}</p>
          <p class="rounded-xl border border-amber-400/50 bg-amber-400/10 p-3 font-bold"><span class="block text-[11px] tracking-wider text-amber-700 uppercase dark:text-amber-400">Lesson</span>{{ s.en.l }}</p>
          <p class="text-xs text-muted">Source: {{ s.en.src }}</p>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" class="btn-primary min-h-11" (click)="open(s.c, s.slug)">▶ Swipe more stories</button>
          <a routerLink="/stories" class="btn-ghost min-h-11">All stories</a>
        </div>
        <nav class="mt-4 flex justify-between gap-2 text-sm" aria-label="More stories">
          @if (prev(); as p) { <a [routerLink]="'/stories/' + p.c + '/' + p.slug" class="text-brand hover:underline">← {{ p.en.t }}</a> } @else { <span></span> }
          @if (next(); as n) { <a [routerLink]="'/stories/' + n.c + '/' + n.slug" class="text-right text-brand hover:underline">{{ n.en.t }} →</a> }
        </nav>
      </article>
    } @else {
      <section class="mx-auto max-w-3xl">
        <h1 class="text-2xl font-extrabold sm:text-3xl">Spread Stories</h1>
        <p class="mt-1 text-muted">Short lessons from the Bhagavad Gita, Ramayanam, Hanuman, Mahabharatam and the rishis — in Telugu and English. Swipe, learn one good thing, share it.</p>
        <p class="mt-1 text-muted" lang="te">భగవద్గీత, రామాయణం, మహాభారతం నుంచి చిన్న కథలు — ఒక్కో కథలో ఒక మంచి పాఠం.</p>
        <button type="button" class="btn-primary mt-4 min-h-11" (click)="open()">▶ Open Spread Stories</button>
        @for (c of cols; track c.id) {
          <h2 class="mt-6 mb-2 text-lg font-bold">{{ c.icon }} {{ c.n.en }} <span class="text-muted" lang="te">· {{ c.n.te }}</span></h2>
          <ul class="grid gap-2 sm:grid-cols-2">
            @for (s of byCol(c.id); track s.slug) {
              <li>
                <a [routerLink]="'/stories/' + s.c + '/' + s.slug" class="card block p-3 hover:border-brand/50">
                  <b class="block" lang="te">{{ s.te.t }}</b>
                  <span class="text-sm text-muted">{{ s.en.t }} · {{ s.en.src }}</span>
                </a>
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
})
export class StoryPage {
  readonly col = input<string>();
  readonly slug = input<string>();
  private readonly seo = inject(SeoService);
  private readonly stories = inject(StoriesService);
  protected readonly cols = STORY_COL_INFO;

  protected readonly at = computed(() => STORIES.findIndex((s) => s.c === this.col() && s.slug === this.slug()));
  protected readonly story = computed(() => STORIES[this.at()] ?? null);
  protected readonly prev = computed(() => (this.at() > 0 ? STORIES[this.at() - 1] : null));
  protected readonly next = computed(() => (this.at() >= 0 && this.at() < STORIES.length - 1 ? STORIES[this.at() + 1] : null));

  constructor() {
    effect(() => {
      const s = this.story();
      if (s) {
        const path = `stories/${s.c}/${s.slug}`;
        this.seo.set({
          title: `${s.en.t} — ${s.en.src} | Lesson in Telugu & English`,
          description: `${s.en.s} Lesson: ${s.en.l} ${s.te.t} — ${s.te.l}`.slice(0, 300),
          path,
          jsonLd: [
            { '@type': 'Article', headline: s.en.t, inLanguage: ['te', 'en'], about: s.en.src, description: s.en.l, url: `https://tools.spreadapps.in/${path}` },
            SeoService.breadcrumbs([
              { name: 'Home', path: '' },
              { name: 'Spread Stories', path: 'stories' },
              { name: s.en.t, path },
            ]),
          ],
        });
      } else {
        this.seo.set({
          title: 'Spread Stories — Short Lessons from Gita, Ramayanam & Mahabharatam in Telugu',
          description: 'Swipe short stories from the Bhagavad Gita, Ramayanam, Hanuman, Mahabharatam and the rishis, each with one simple lesson — in Telugu and English. Free, safe for kids.',
          path: 'stories',
          jsonLd: [SeoService.breadcrumbs([{ name: 'Home', path: '' }, { name: 'Spread Stories', path: 'stories' }])],
        });
      }
    });
    // A shared story link opens straight into the swipe view, with a little welcome shower.
    afterNextRender(() => {
      const s = this.story();
      if (s) this.stories.show(s.c, s.slug, true);
    });
  }

  protected byCol(id: string) {
    return STORIES.filter((s) => s.c === id);
  }

  protected colOf(id: string) {
    return STORY_COL_INFO.find((c) => c.id === id)!;
  }

  protected open(col = '', slug = '') {
    this.stories.show(col, slug);
  }
}
