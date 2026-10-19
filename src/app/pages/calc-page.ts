import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CALCS, CalcPage as CalcInfo, calcById } from '../core/calcs';
import { ConsentService } from '../core/consent.service';
import { CounterService } from '../core/counter.service';
import { TAX_YEAR } from '../core/finance';
import { SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { AdSlot } from '../shared/ad-slot';
import { FaqList } from '../shared/faq-list';
import { Icon } from '../shared/icon';
import { EmiCalc, FdCalc, GrowthCalc, PpfCalc } from './calc/growth-calcs';
import { GstCalc, HraCalc, SalaryCalc, TaxCalc } from './calc/tax-calcs';

/** One page per calculator (route data `calc` = id from core/calcs.ts). */
@Component({
  selector: 'app-calc-page',
  imports: [RouterLink, DecimalPipe, Icon, AdSlot, FaqList, EmiCalc, GrowthCalc, FdCalc, PpfCalc, TaxCalc, GstCalc, HraCalc, SalaryCalc],
  template: `
    @let c = info();
    <div class="grid gap-x-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="min-w-0">
        <nav aria-label="Breadcrumb" class="mb-1 flex items-center gap-1 text-xs text-muted">
          <a routerLink="/" class="hover:text-brand hover:underline">Home</a><svg lucideIcon="chevron-right" [size]="12" />
          <a routerLink="/" fragment="calculators" class="hover:text-brand hover:underline">Calculators</a><svg lucideIcon="chevron-right" [size]="12" />
          <span aria-current="page" class="font-medium text-ink">{{ c.name }}</span>
        </nav>
        <h1 class="text-lg leading-snug font-bold sm:text-2xl">{{ c.h1 }}</h1>
        <p class="mt-0.5 mb-3 text-sm text-muted">
          {{ c.intro }}
          @if (uses(); as n) { <span class="font-medium text-ink">Used {{ n | number }} times.</span> }
        </p>

        <section class="card p-3 sm:p-4" (input)="used()" (change)="used()" (click)="usedIfButton($event)" aria-label="Calculator">
          @switch (c.kind) {
            @case ('emi') { <app-emi-calc [defaults]="c.defaults!" /> }
            @case ('sip') { <app-growth-calc mode="sip" /> }
            @case ('lumpsum') { <app-growth-calc mode="lumpsum" /> }
            @case ('fd') { <app-fd-calc /> }
            @case ('ppf') { <app-ppf-calc /> }
            @case ('tax') { <app-tax-calc /> }
            @case ('gst') { <app-gst-calc /> }
            @case ('hra') { <app-hra-calc /> }
            @case ('salary') { <app-salary-calc /> }
          }
        </section>

        <p class="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <svg lucideIcon="info" [size]="14" class="mt-px shrink-0" />
          {{ disclaimer() }}
        </p>

        <app-ad-slot slot="top" />

        <section class="mt-2" aria-labelledby="more-calcs">
          <h2 id="more-calcs" class="mb-2 text-sm font-bold">More calculators</h2>
          <div class="flex flex-wrap gap-1.5">
            @for (o of others(); track o.id) {
              <a class="chip min-h-8 text-xs" [routerLink]="'/' + o.path">{{ o.name }}</a>
            }
          </div>
        </section>

        <article class="prose-tool mt-4">
          <h2>How to use the {{ c.name }}</h2>
          <ol class="list-decimal space-y-1 pl-5">
            @for (s of c.steps; track $index) { <li>{{ s }}</li> }
          </ol>
          <app-ad-slot slot="inContent" />
          <h2>Frequently asked questions</h2>
        </article>
        <app-faq-list [faqs]="c.faqs" />
      </div>
      <aside class="mt-6 hidden lg:mt-0 lg:block" aria-label="More tools">
        <div class="sticky top-16 space-y-4">
          <div class="card p-4 text-sm">
            <p class="flex items-center gap-2 font-semibold"><svg lucideIcon="shield-check" [size]="18" class="text-accent" /> Private</p>
            <p class="mt-1 text-muted">Calculations run in your browser. Your numbers are never sent or stored.</p>
          </div>
          <app-ad-slot slot="sidebar" [minHeight]="250" />
        </div>
      </aside>
    </div>
  `,
})
export class CalcPageView {
  /** From route data */
  readonly calc = input.required<string>();
  private readonly seo = inject(SeoService);
  private readonly counter = inject(CounterService);
  private readonly consent = inject(ConsentService);
  protected readonly uses = signal<number | null>(null);
  private counted = false;

  protected readonly info = computed<CalcInfo>(() => calcById(this.calc())!);
  protected readonly others = computed(() => CALCS.filter((c) => c.id !== this.calc()));
  protected readonly disclaimer = computed(() => {
    const k = this.info().kind;
    const tax = k === 'tax' || k === 'hra' || k === 'salary' ? ` Tax rules: ${TAX_YEAR}.` : '';
    return `Calculators give estimates, not financial or tax advice.${tax} Check with your bank, employer or a CA before deciding.`;
  });

  constructor() {
    effect(() => {
      const c = this.info();
      this.seo.set({
        title: c.title,
        description: c.description,
        path: c.path,
        jsonLd: [
          SeoService.app(c.h1, c.path, c.description),
          SeoService.howTo(`How to use the ${c.name}`, c.steps),
          SeoService.faq(c.faqs),
          SeoService.breadcrumbs([
            { name: 'Home', path: '' },
            { name: c.name, path: c.path },
          ]),
        ],
      });
    });
    effect(() => {
      const id = this.info().id;
      this.counted = false;
      this.uses.set(null);
      this.counter.view(id);
      this.counter.get(id).then((n) => n !== null && n >= SITE.counterMinToShow && this.uses.set(n));
    });
  }

  /** First real interaction with the calculator = one "use". */
  protected used() {
    if (this.counted) return;
    this.counted = true;
    this.counter.hit(this.info().id);
    this.consent.event('tool_use', { tool: this.info().id, how: 'calculate' });
  }

  protected usedIfButton(e: Event) {
    if ((e.target as HTMLElement).closest('button')) this.used();
  }
}
