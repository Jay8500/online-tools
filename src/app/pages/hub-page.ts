import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOC_SHORT, DocKind, EXAMS, Exam, examPath } from '../core/exams';
import { HUB_GUIDES } from '../core/hub-guides';
import { HUBS, Hub } from '../core/hubs';
import { SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { AdSlot } from '../shared/ad-slot';
import { FaqList } from '../shared/faq-list';
import { Icon } from '../shared/icon';
import { LiveBadge, WEATHER_ICON } from '../shared/live-badge';
import { Sky } from '../shared/sky';
import { SOURCES } from '../core/sources';

/** Category page, e.g. /health-calculators — intro + every tool in the group + other groups. */
@Component({
  selector: 'app-hub-page',
  imports: [RouterLink, Icon, AdSlot, FaqList, LiveBadge, Sky],
  template: `
    @let h = hub();
    <nav aria-label="Breadcrumb" class="mb-1 flex items-center gap-1 text-xs text-muted">
      <a routerLink="/" class="hover:text-brand hover:underline">Home</a><svg lucideIcon="chevron-right" [size]="12" />
      <span aria-current="page" class="font-medium text-ink">{{ h.h1 }}</span>
    </nav>
    <h1 class="text-lg font-bold sm:text-2xl">{{ h.h1 }}</h1>
    <p class="mt-0.5 max-w-3xl text-sm text-muted">{{ h.intro }}</p>

    @if (h.id === 'exam') {
      <div class="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        @for (e of exams; track e.slug) {
          <div class="card flex min-w-0 flex-col gap-2 p-2.5 sm:p-3">
            <a [routerLink]="'/' + path(e, 'photo')" class="group">
              <h2 class="font-bold group-hover:text-brand">{{ e.name }}</h2>
              <p class="hidden text-xs text-muted sm:line-clamp-2">{{ e.full }}</p>
            </a>
            <div class="flex flex-wrap gap-1.5">
              @for (d of e.docs; track d.kind) { <a class="chip min-h-8 px-2 text-xs" [routerLink]="'/' + path(e, d.kind)">{{ short(d.kind) }}</a> }
            </div>
          </div>
        }
      </div>
    } @else {
      <ul class="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3">
        @for (t of h.items; track t.path) {
          <li>
            <div class="card group relative flex h-full items-center gap-3 p-3 transition hover:border-brand/50 isolate overflow-hidden" [class.sky-card]="t.path === 'weather' && !!skyIcon()">
                @if (t.path === 'weather' && skyIcon()) { <app-sky [icon]="skyIcon()" class="-z-10" /> }
              <a [routerLink]="'/' + t.path" class="absolute inset-0 rounded-2xl" [attr.aria-label]="t.name"></a>
              <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><svg [lucideIcon]="t.icon" [size]="20" /></span>
              <span class="min-w-0">
                <h2 class="text-sm font-semibold group-hover:text-brand">{{ t.name }}</h2>
                <span class="block text-xs text-muted">{{ t.blurb }}</span>
                @if (src(t.path); as ss) {
                  <span class="relative z-10 mt-0.5 block text-[10px] text-muted">Data: @for (s of ss; track s.url; let last = $last) {<a [href]="s.url" target="_blank" rel="noopener" class="underline decoration-dotted hover:text-brand">{{ s.name }}</a>@if (!last) {, }}</span>
                }
              </span>
              @if (live(t.path); as k) { <app-live-badge [kind]="k" /> }
            </div>
          </li>
        }
      </ul>
    }

    @for (g of guide(); track g.h) {
      <section class="mt-6 max-w-4xl">
        <h2 class="text-base font-bold">{{ g.h }}</h2>
        @if (g.p) { <p class="mt-1 text-sm text-muted">{{ g.p }}</p> }
        @if (g.table; as t) {
          <div class="mt-2 overflow-x-auto rounded-xl border border-line">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface-2 text-xs text-muted"><tr>@for (c of t.head; track c) { <th class="px-3 py-2 font-semibold whitespace-nowrap">{{ c }}</th> }</tr></thead>
              <tbody class="divide-y divide-line bg-surface">
                @for (r of t.rows; track $index) {
                  <tr>@for (c of r; track $index; let first = $first) { <td class="px-3 py-2" [class.font-semibold]="first" [class.whitespace-nowrap]="!first">{{ c }}</td> }</tr>
                }
              </tbody>
            </table>
          </div>
        }
        @if (g.list?.length) {
          <ul class="mt-2 space-y-1 text-sm text-muted">
            @for (li of g.list; track li) { <li class="flex gap-2"><span class="text-brand">•</span><span>{{ li }}</span></li> }
          </ul>
        }
      </section>
      @if ($first) { <app-ad-slot slot="inContent" /> }
    }

    <app-ad-slot slot="top" />

    <section class="mt-2" aria-labelledby="other-groups">
      <h2 id="other-groups" class="mb-2 text-sm font-bold">Other free tools</h2>
      <div class="flex flex-wrap gap-1.5">
        @for (o of others(); track o.id) { <a class="chip min-h-8 text-xs" [routerLink]="'/' + o.path">{{ o.h1 }}</a> }
      </div>
    </section>

    <section class="mt-6 max-w-3xl" aria-labelledby="hub-faq">
      <h2 id="hub-faq" class="mb-2 text-base font-bold">Frequently asked questions</h2>
      <app-faq-list [faqs]="h.faqs" />
    </section>
  `,
})
export class HubPage {
  /** Sky behind the weather card once its badge has loaded */
  protected readonly skyIcon = WEATHER_ICON;
  /** From route data */
  readonly hubPath = input.required<string>();
  protected readonly exams = EXAMS;
  protected readonly hub = computed<Hub>(() => HUBS.find((h) => h.path === this.hubPath())!);
  protected readonly guide = computed(() => HUB_GUIDES[this.hub().id] ?? []);
  protected readonly others = computed(() => HUBS.filter((h) => h.id !== this.hub().id));

  constructor() {
    const seo = inject(SeoService);
    effect(() => {
      const h = this.hub();
      const items = h.id === 'exam' ? EXAMS.map((e) => ({ name: `${e.name} photo resize`, path: examPath(e, 'photo') })) : h.items;
      seo.set({
        title: h.title,
        description: h.description,
        path: h.path,
        jsonLd: [
          {
            '@type': 'CollectionPage',
            name: h.h1,
            url: `${SITE.url}/${h.path}`,
            description: h.description,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: `${SITE.url}/${it.path}` })),
            },
          },
          SeoService.faq(h.faqs),
          SeoService.breadcrumbs([
            { name: 'Home', path: '' },
            { name: h.h1, path: h.path },
          ]),
        ],
      });
    });
  }

  /** Third-party data credit (with links) for live tools. */
  protected src(path: string | null) {
    return path ? (SOURCES[path] ?? null) : null;
  }

  /** Cards that show a live value on the right (gold rate, weather). */
  protected live(path: string | null): 'gold' | 'weather' | 'fuel' | 'holiday' | null {
    return path === 'gold-price-calculator' ? 'gold' : path === 'weather' ? 'weather' : path === 'petrol-diesel-price' ? 'fuel' : path === 'holiday-calendar' ? 'holiday' : null;
  }

  protected path(e: Exam, k: DocKind) {
    return examPath(e, k);
  }
  protected short(k: DocKind) {
    return DOC_SHORT[k];
  }
}
