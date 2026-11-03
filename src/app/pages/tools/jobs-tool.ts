import { Component, afterNextRender, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EXAMS, examPath } from '../../core/exams';

interface Notice {
  title: string;
  link: string;
}

/** Official recruitment websites — linked (some block automated readers), with our photo-size tool for each. */
const OFFICIAL = [
  { name: 'UPSC', what: 'Civil services, NDA, CDS, engineering', url: 'https://upsc.gov.in/', exam: 'upsc' },
  { name: 'APPSC', what: 'Andhra Pradesh state jobs (Groups, AE…)', url: 'https://psc.ap.gov.in/', exam: 'appsc' },
  { name: 'SSC', what: 'CGL, CHSL, MTS, GD constable', url: 'https://ssc.gov.in/', exam: 'ssc' },
  { name: 'IBPS', what: 'Bank PO, clerk, RRB bank jobs', url: 'https://www.ibps.in/', exam: 'ibps' },
  { name: 'RRB (Railways)', what: 'NTPC, Group D, ALP, JE', url: 'https://www.rrbapply.gov.in/', exam: 'rrb' },
  { name: 'TGPRB (Police)', what: 'Telangana police & SI recruitment', url: 'https://www.tgprb.in/', exam: '' },
  { name: 'Employment News', what: 'Weekly central govt job list', url: 'https://employmentnews.gov.in/', exam: '' },
];

@Component({
  selector: 'app-jobs-tool',
  imports: [RouterLink],
  template: `
    <section aria-labelledby="h-tg">
      <div class="flex items-baseline justify-between gap-2">
        <h2 id="h-tg" class="text-sm font-bold">TGPSC — latest notices</h2>
        <span class="text-[11px] text-muted">auto-updated from the official site</span>
      </div>
      <div class="mt-2" aria-live="polite">
        @if (state() === 'loading') {
          <p class="text-sm text-muted">Loading the latest TGPSC notices…</p>
        } @else if (state() === 'error') {
          <p class="text-sm text-muted">Couldn’t read the TGPSC site right now. <a class="text-brand underline" href="https://websitenew.tgpsc.gov.in/" target="_blank" rel="noopener">Open TGPSC website ↗</a></p>
        } @else {
          <ul class="divide-y divide-line overflow-hidden rounded-2xl border border-line">
            @for (n of shown(); track n.link) {
              <li class="bg-surface-2/50 p-3">
                <p class="line-clamp-3 text-sm font-medium">{{ n.title }}</p>
                <a class="mt-1 inline-flex text-xs font-semibold text-brand hover:underline" [href]="n.link" target="_blank" rel="noopener">Open official notice ↗</a>
              </li>
            }
          </ul>
          @if (items().length > shown().length) {
            <button type="button" class="btn-ghost mt-2 min-h-9 w-full text-sm" (click)="all.set(true)">Show all {{ items().length }} notices</button>
          }
        }
      </div>
      <p class="mt-2 text-xs text-muted">Need the photo & signature size? <a routerLink="/tspsc-photo-resize" class="font-semibold text-brand underline">TGPSC photo resizer</a></p>
    </section>

    <section class="mt-6 border-t border-line pt-4" aria-labelledby="h-off">
      <h2 id="h-off" class="text-sm font-bold">Other official recruitment sites</h2>
      <ul class="mt-2 grid gap-2 sm:grid-cols-2">
        @for (o of official; track o.name) {
          <li class="rounded-2xl border border-line bg-surface-2/50 p-3">
            <a [href]="o.url" target="_blank" rel="noopener" class="text-sm font-semibold hover:text-brand">{{ o.name }} ↗</a>
            <p class="text-xs text-muted">{{ o.what }}</p>
            @if (photo(o.exam); as p) { <a [routerLink]="'/' + p" class="mt-1 inline-flex text-xs font-semibold text-brand hover:underline">{{ o.name.split(' ')[0] }} photo size →</a> }
          </li>
        }
      </ul>
    </section>
  `,
})
export class JobsTool {
  protected readonly official = OFFICIAL;
  protected readonly items = signal<Notice[]>([]);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly all = signal(false);
  protected readonly shown = () => (this.all() ? this.items() : this.items().slice(0, 8));

  constructor() {
    afterNextRender(async () => {
      try {
        const r = await fetch('/api/jobs?src=tgpsc');
        const j = (await r.json()) as { items?: Notice[] };
        this.items.set(j.items ?? []);
        this.state.set(j.items?.length ? 'ready' : 'error');
      } catch {
        this.state.set('error');
      }
    });
  }

  protected photo(slug: string) {
    const e = EXAMS.find((x) => x.slug === slug);
    return e ? examPath(e, 'photo') : null;
  }
}
