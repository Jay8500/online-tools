import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';
import { DOC_SHORT, DocKind, EXAMS, Exam, examPath } from '../core/exams';
import { CounterService } from '../core/counter.service';
import { SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { TOOL_GROUPS } from '../core/tools';
import { AdSlot } from '../shared/ad-slot';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, Icon, AdSlot],
  template: `
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-lg font-bold sm:text-2xl">Free online tools for India</h1>
        <p class="text-sm text-muted">Exam photo & signature resizer, image to KB and more — fast, free, nothing uploaded.</p>
      </div>
      <label class="relative block sm:w-72">
        <span class="sr-only">Search tools</span>
        <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input class="input pl-9" type="search" placeholder="Search: SSC, signature, 50 KB…" [ngModel]="q()" (ngModelChange)="q.set($event)" />
      </label>
    </div>

    <section id="exam-photo" class="mt-4 scroll-mt-16" aria-labelledby="h-exam">
      <h2 id="h-exam" class="mb-2 flex items-center gap-2 text-sm font-bold tracking-wide text-muted uppercase">
        <svg lucideIcon="scan-face" [size]="16" /> Exam photo & signature resizer
      </h2>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
        @for (e of exams(); track e.slug) {
          <div class="card flex min-w-0 flex-col gap-2 p-2.5 sm:p-3">
            <a [routerLink]="'/' + path(e, 'photo')" class="group">
              <p class="font-bold group-hover:text-brand">{{ e.name }}</p>
              <p class="hidden text-xs text-muted sm:line-clamp-1">{{ e.full }}</p>
            </a>
            <div class="flex flex-wrap gap-1.5">
              @for (d of e.docs; track d.kind) {
                <a class="chip min-h-8 px-2 text-xs" [routerLink]="'/' + path(e, d.kind)">{{ short(d.kind) }}</a>
              }
            </div>
          </div>
        } @empty {
          <p class="text-sm text-muted">No exam matches “{{ q() }}”. Try the <a routerLink="/resize-image-to-kb" class="text-brand underline">resize to KB</a> tool.</p>
        }
      </div>
    </section>

    @for (g of groups(); track g.title) {
      <section class="mt-6" [attr.aria-label]="g.title">
        <h2 class="mb-2 text-sm font-bold tracking-wide text-muted uppercase">{{ g.title }}</h2>
        <div class="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2 md:grid-cols-4">
          @for (t of g.tools; track t.name) {
            @if (t.path) {
              <a [routerLink]="'/' + t.path" class="card group flex items-center gap-3 p-3 transition hover:border-brand/50">
                <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><svg [lucideIcon]="t.icon" [size]="18" /></span>
                <span class="min-w-0"><span class="block text-sm font-semibold group-hover:text-brand">{{ t.name }}</span><span class="block text-xs text-muted">{{ t.blurb }}</span></span>
              </a>
            } @else {
              <div class="card flex items-center gap-3 p-3 opacity-70">
                <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted"><svg [lucideIcon]="t.icon" [size]="18" /></span>
                <span class="min-w-0"><span class="block text-sm font-semibold">{{ t.name }}</span><span class="block text-xs text-muted">{{ t.blurb }} · coming soon</span></span>
              </div>
            }
          }
        </div>
      </section>
    }

    <app-ad-slot slot="top" />

    <section class="prose-tool mt-6 max-w-3xl">
      <h2>Why SpreadApps Tools?</h2>
      <p>
        Government and bank exam forms reject photos for the smallest reasons — wrong size in KB, wrong pixels, a grey background.
        These tools fix that in seconds on any phone. Everything runs inside your browser: your photos, signatures and documents
        are never uploaded, so they stay private. You can even install the site like an app and use it offline.
      </p>
    </section>
  `,
})
export class Home {
  protected readonly q = signal('');
  protected readonly exams = computed(() => {
    const q = this.q().trim().toLowerCase();
    if (!q) return EXAMS;
    return EXAMS.filter((e) => `${e.name} ${e.full} photo signature thumb`.toLowerCase().includes(q));
  });
  protected readonly groups = computed(() => {
    const q = this.q().trim().toLowerCase();
    if (!q) return TOOL_GROUPS;
    return TOOL_GROUPS.map((g) => ({ ...g, tools: g.tools.filter((t) => `${t.name} ${t.blurb}`.toLowerCase().includes(q)) })).filter((g) => g.tools.length);
  });

  constructor() {
    inject(CounterService).view('home');
    inject(SeoService).set({
      title: `${SITE.name} — Exam Photo Resizer, Image to KB & Free Indian Tools`,
      description:
        'Free tools for Indian students and families: resize photo and signature for SSC, UPSC, IBPS, SBI, RRB, TSPSC, APPSC, NEET, JEE; compress image to KB. Works on mobile, nothing uploaded.',
      path: '',
      jsonLd: [{ '@type': 'WebSite', name: SITE.name, url: SITE.url, inLanguage: 'en-IN' }],
    });
  }

  protected path(e: Exam, k: DocKind) {
    return examPath(e, k);
  }
  protected short(k: DocKind) {
    return DOC_SHORT[k];
  }
}
