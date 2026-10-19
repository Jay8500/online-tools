import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOC_SHORT, EXAMS, KB_PRESETS, examPath, kbPath } from '../core/exams';
import { SeoService } from '../core/seo.service';
import { Icon } from '../shared/icon';

interface Day {
  date: string;
  views: number;
  uses: number;
  byTool: { v: Record<string, number>; u: Record<string, number> };
}
interface StatsData {
  tools: Record<string, { views: number; uses: number }>;
  days: Day[];
}
interface Row {
  id: string;
  name: string;
  path: string;
  views: number;
  uses: number;
  today: number;
}

/** Tool id (as counted) → readable name + page link. */
const NAMES: Record<string, { name: string; path: string }> = {
  home: { name: 'Home page', path: '' },
  'resize-kb': { name: 'Resize image to KB', path: 'resize-image-to-kb' },
  ...Object.fromEntries(KB_PRESETS.map((k) => [`resize-${k}kb`, { name: `Resize to ${k} KB`, path: kbPath(k) }])),
  ...Object.fromEntries(EXAMS.flatMap((e) => e.docs.map((d) => [`${e.slug}-${d.kind}`, { name: `${e.name} ${DOC_SHORT[d.kind].toLowerCase()}`, path: examPath(e, d.kind) }]))),
};

const KEY_STORE = 'stats-key';

/** Private owner dashboard: /stats?key=… (key remembered on this device). Not in sitemap, noindex. */
@Component({
  selector: 'app-stats',
  imports: [DecimalPipe, RouterLink, Icon],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="flex items-center justify-between gap-2">
        <h1 class="text-xl font-bold">Site stats</h1>
        @if (data()) {
          <button class="btn-ghost min-h-9" (click)="load()" [disabled]="loading()"><svg lucideIcon="refresh-ccw" [size]="16" /> Refresh</button>
        }
      </div>
      <p class="mt-0.5 text-sm text-muted">Private. Views = visitors who opened a page (once per person per page per day). Uses = downloads/shares.</p>

      @if (loading() && !data()) {
        <p class="mt-6 text-sm text-muted">Loading…</p>
      } @else if (error()) {
        <div class="card mt-4 p-4 text-sm">
          <p class="flex items-center gap-2 font-semibold text-rose-600"><svg lucideIcon="lock" [size]="16" /> {{ error() }}</p>
          <p class="mt-1 text-muted">Open this page with the private link (…/stats?key=…).</p>
        </div>
      } @else if (data(); as d) {
        <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          @for (k of kpis(); track k.label) {
            <div class="card p-3">
              <p class="text-xs font-semibold text-muted">{{ k.label }}</p>
              <p class="mt-1 text-2xl font-bold">{{ k.value | number }}</p>
              <p class="text-xs text-muted">{{ k.sub }}</p>
            </div>
          }
        </div>

        <section class="card mt-4 p-4" aria-labelledby="h-days">
          <h2 id="h-days" class="text-sm font-bold">Last 14 days</h2>
          <div class="mt-3 flex h-36 items-end gap-1" role="img" [attr.aria-label]="chartLabel()">
            @for (day of chartDays(); track day.date) {
              <div class="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" [title]="day.date + ': ' + day.views + ' views, ' + day.uses + ' uses'">
                <span class="text-[10px] text-muted opacity-0 group-hover:opacity-100">{{ day.views }}</span>
                <div class="w-full rounded-t bg-brand/80" [style.height.%]="pct(day.views)"></div>
                <span class="text-[10px] text-muted">{{ day.date.slice(8) }}</span>
              </div>
            }
          </div>
        </section>

        <section class="card mt-4 overflow-hidden" aria-labelledby="h-tools">
          <h2 id="h-tools" class="px-4 pt-4 text-sm font-bold">By page</h2>
          @if (rows().length) {
            <div class="mt-2 overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-surface-2 text-left text-xs text-muted">
                  <tr><th class="px-4 py-2">Page</th><th class="px-3 py-2 text-right">Today</th><th class="px-3 py-2 text-right">Views</th><th class="px-4 py-2 text-right">Uses</th></tr>
                </thead>
                <tbody class="divide-y divide-line">
                  @for (r of rows(); track r.id) {
                    <tr>
                      <td class="px-4 py-2"><a [routerLink]="'/' + r.path" class="font-medium hover:text-brand">{{ r.name }}</a></td>
                      <td class="px-3 py-2 text-right">{{ r.today | number }}</td>
                      <td class="px-3 py-2 text-right font-semibold">{{ r.views | number }}</td>
                      <td class="px-4 py-2 text-right">{{ r.uses | number }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="px-4 py-4 text-sm text-muted">No visits counted yet. Numbers appear as soon as people open the tools.</p>
          }
        </section>
        <p class="mt-3 text-xs text-muted">More detail (countries, devices, search terms) is in Google Analytics → SpreadApps Tools.</p>
      }
    </div>
  `,
})
export class Stats {
  /** ?key=… from the private link */
  readonly key = input<string>();
  protected readonly data = signal<StatsData | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private secret = '';

  protected readonly rows = computed<Row[]>(() => {
    const d = this.data();
    if (!d) return [];
    const today = d.days[0]?.byTool.v ?? {};
    return Object.entries(d.tools)
      .map(([id, t]) => ({ id, name: NAMES[id]?.name ?? id, path: NAMES[id]?.path ?? '', views: t.views, uses: t.uses, today: today[id] ?? 0 }))
      .sort((a, b) => b.views - a.views || b.uses - a.uses);
  });
  protected readonly kpis = computed(() => {
    const d = this.data()!;
    const sum = (n: number, f: 'views' | 'uses') => d.days.slice(0, n).reduce((a, x) => a + x[f], 0);
    const total = (f: 'views' | 'uses') => Object.values(d.tools).reduce((a, t) => a + t[f], 0);
    return [
      { label: 'Views today', value: d.days[0]?.views ?? 0, sub: `${d.days[1]?.views ?? 0} yesterday` },
      { label: 'Views, 7 days', value: sum(7, 'views'), sub: `${total('views')} all time` },
      { label: 'Uses today', value: d.days[0]?.uses ?? 0, sub: `${d.days[1]?.uses ?? 0} yesterday` },
      { label: 'Uses, 7 days', value: sum(7, 'uses'), sub: `${total('uses')} all time` },
    ];
  });
  protected readonly chartDays = computed(() => [...(this.data()?.days ?? [])].reverse());
  private readonly maxViews = computed(() => Math.max(1, ...this.chartDays().map((d) => d.views)));
  protected readonly chartLabel = computed(() => this.chartDays().map((d) => `${d.date}: ${d.views} views`).join(', '));

  constructor() {
    inject(SeoService).set({ title: 'Stats', description: 'Private site statistics.', path: 'stats', noindex: true });
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      if (!browser) return;
      try {
        if (this.key()) localStorage.setItem(KEY_STORE, this.key()!);
        this.secret = this.key() || localStorage.getItem(KEY_STORE) || '';
      } catch {
        this.secret = this.key() ?? '';
      }
      // Don't leave the key in the address bar (screenshots, shoulder-surfing).
      if (this.key()) history.replaceState(null, '', '/stats');
      if (!this.secret) return this.error.set('This page is private.');
      this.load();
    });
  }

  protected pct(v: number) {
    return Math.max(2, Math.round((v / this.maxViews()) * 100));
  }

  async load() {
    this.loading.set(true);
    try {
      const r = await fetch(`/api/count?stats=1&key=${encodeURIComponent(this.secret)}`, { cache: 'no-store' });
      if (r.status === 401) {
        try {
          localStorage.removeItem(KEY_STORE);
        } catch {
          /* ignore */
        }
        this.error.set('Wrong or old key.');
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      this.error.set(null);
      this.data.set((await r.json()) as StatsData);
    } catch {
      this.error.set('Could not load stats. Check your internet and try again.');
    } finally {
      this.loading.set(false);
    }
  }
}
