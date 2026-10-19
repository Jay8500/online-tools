import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../core/consent.service';
import { CounterService } from '../core/counter.service';
import { SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { TOOL_LINKS } from '../core/tool-links';
import { SOURCES } from '../core/sources';
import { HUB_PATHS } from '../core/hub-paths';
import { DISCLAIMERS, ToolPageInfo, toolPage } from '../core/tool-pages';
import { AdSlot } from '../shared/ad-slot';
import { FaqList } from '../shared/faq-list';
import { Icon } from '../shared/icon';
import { BmiTool, CalorieTool, DueDateTool, IdealWeightTool } from './tools/health-tools';
import { InvoiceTool } from './tools/invoice-tool';
import { ImageToPdf, PdfCompress, PdfMerge, PdfSplit, PdfToImage } from './tools/pdf-tools';
import { TeluguTool } from './tools/telugu-tool';
import { UpiQrTool } from './tools/upi-qr-tool';
import { LandTool, UnitTool } from './tools/convert-tools';
import { GoldTool } from './tools/gold-tool';
import { WeatherTool } from './tools/weather-tool';
import { TravelTool } from './tools/travel-tool';

/** Pages for PDF, business, health and language tools (route data `tool` = id from core/tool-links.ts). */
@Component({
  selector: 'app-tool-page',
  imports: [
    RouterLink,
    DecimalPipe,
    Icon,
    AdSlot,
    FaqList,
    BmiTool,
    CalorieTool,
    IdealWeightTool,
    DueDateTool,
    UpiQrTool,
    TeluguTool,
    InvoiceTool,
    PdfMerge,
    PdfSplit,
    PdfCompress,
    ImageToPdf,
    PdfToImage,
    LandTool,
    UnitTool,
    GoldTool,
    WeatherTool,
    TravelTool,
  ],
  template: `
    @let t = info();
    <div [class]="wide() ? 'grid gap-x-6' : 'grid gap-x-6 lg:grid-cols-[minmax(0,1fr)_300px]'">
      <div class="min-w-0">
        <nav aria-label="Breadcrumb" class="mb-1 flex items-center gap-1 text-xs text-muted">
          <a routerLink="/" class="hover:text-brand hover:underline">Home</a><svg lucideIcon="chevron-right" [size]="12" />
          <a [routerLink]="'/' + hubPath()" class="hover:text-brand hover:underline">{{ t.group }}</a><svg lucideIcon="chevron-right" [size]="12" />
          <span aria-current="page" class="font-medium text-ink">{{ t.name }}</span>
        </nav>
        <h1 class="text-lg leading-snug font-bold sm:text-2xl">{{ t.h1 }}</h1>
        <p class="mt-0.5 mb-3 text-sm text-muted">
          {{ t.intro }}
          @if (uses(); as n) { <span class="font-medium text-ink">Used {{ n | number }} times.</span> }
        </p>

        <section class="card p-3 sm:p-4" (input)="used()" (change)="used()" aria-label="Tool">
          @switch (t.id) {
            @case ('bmi') { @defer (on immediate) { <app-bmi-tool /> } @placeholder { <div class="h-72"></div> } }
            @case ('calorie') { @defer (on immediate) { <app-calorie-tool /> } @placeholder { <div class="h-96"></div> } }
            @case ('ideal-weight') { @defer (on immediate) { <app-ideal-weight-tool /> } @placeholder { <div class="h-56"></div> } }
            @case ('due-date') { @defer (on immediate) { <app-due-date-tool /> } @placeholder { <div class="h-72"></div> } }
            @case ('upi-qr') { @defer (on immediate) { <app-upi-qr-tool /> } @placeholder { <div class="h-96"></div> } }
            @case ('telugu') { @defer (on immediate) { <app-telugu-tool /> } @placeholder { <div class="h-80"></div> } }
            @case ('gst-invoice') { @defer (on immediate) { <app-invoice-tool /> } @placeholder { <div class="h-[60rem]"></div> } }
            @case ('pdf-merge') { @defer (on immediate) { <app-pdf-merge /> } @placeholder { <div class="h-48"></div> } }
            @case ('pdf-split') { @defer (on immediate) { <app-pdf-split /> } @placeholder { <div class="h-48"></div> } }
            @case ('pdf-compress') { @defer (on immediate) { <app-pdf-compress /> } @placeholder { <div class="h-48"></div> } }
            @case ('image-to-pdf') { @defer (on immediate) { <app-image-to-pdf /> } @placeholder { <div class="h-48"></div> } }
            @case ('gold') { @defer (on immediate) { <app-gold-tool /> } @placeholder { <div class="h-[36rem]"></div> } }
            @case ('travel') { @defer (on immediate) { <app-travel-tool /> } @placeholder { <div class="h-96"></div> } }
            @case ('weather') { @defer (on immediate) { <app-weather-tool /> } @placeholder { <div class="h-96"></div> } }
            @case ('land') { @defer (on immediate) { <app-land-tool /> } @placeholder { <div class="h-96"></div> } }
            @case ('length') { @defer (on immediate) { <app-unit-tool category="length" /> } @placeholder { <div class="h-96"></div> } }
            @case ('weight') { @defer (on immediate) { <app-unit-tool category="weight" /> } @placeholder { <div class="h-96"></div> } }
            @case ('volume') { @defer (on immediate) { <app-unit-tool category="volume" /> } @placeholder { <div class="h-96"></div> } }
            @case ('temperature') { @defer (on immediate) { <app-unit-tool category="temperature" /> } @placeholder { <div class="h-96"></div> } }
            @case ('speed') { @defer (on immediate) { <app-unit-tool category="speed" /> } @placeholder { <div class="h-96"></div> } }
            @case ('data') { @defer (on immediate) { <app-unit-tool category="data" /> } @placeholder { <div class="h-96"></div> } }
            @case ('count') { @defer (on immediate) { <app-unit-tool category="count" /> } @placeholder { <div class="h-96"></div> } }
            @case ('pdf-to-image') { @defer (on immediate) { <app-pdf-to-image /> } @placeholder { <div class="h-48"></div> } }
          }
        </section>

        <p class="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <svg lucideIcon="info" [size]="14" class="mt-px shrink-0" /> {{ disclaimer() }}
        </p>
        @if (sources(); as ss) {
          <p class="mt-1 pl-5 text-xs text-muted">Data sources: @for (s of ss; track s.url; let last = $last) {<a [href]="s.url" target="_blank" rel="noopener" class="font-medium text-brand underline">{{ s.name }}</a>@if (!last) {, }}</p>
        }

        <app-ad-slot slot="top" />

        <section class="mt-2" aria-labelledby="more-tools">
          <h2 id="more-tools" class="mb-2 text-sm font-bold">More {{ t.group.toLowerCase() }}</h2>
          <div class="flex flex-wrap gap-1.5">
            @for (o of related(); track o.id) { <a class="chip min-h-8 text-xs" [routerLink]="'/' + o.path">{{ o.name }}</a> }
            <a class="chip min-h-8 text-xs" [routerLink]="'/' + hubPath()">All {{ t.group.toLowerCase() }}</a>
            <a class="chip min-h-8 text-xs" routerLink="/">All tools</a>
          </div>
        </section>

        <article class="prose-tool mt-4">
          <h2>How to use the {{ t.name }}</h2>
          <ol class="list-decimal space-y-1 pl-5">
            @for (s of t.steps; track $index) { <li>{{ s }}</li> }
          </ol>
          <app-ad-slot slot="inContent" />
          <h2>Frequently asked questions</h2>
        </article>
        <app-faq-list [faqs]="t.faqs" />
      </div>
      @if (!wide()) {
        <aside class="mt-6 hidden lg:mt-0 lg:block" aria-label="More tools">
          <div class="sticky top-16 space-y-4">
            <div class="card p-4 text-sm">
              <p class="flex items-center gap-2 font-semibold"><svg lucideIcon="shield-check" [size]="18" class="text-accent" /> Private</p>
              <p class="mt-1 text-muted">Everything runs in your browser. Nothing you type or open is uploaded.</p>
            </div>
            <app-ad-slot slot="sidebar" [minHeight]="250" />
          </div>
        </aside>
      }
    </div>
  `,
})
export class ToolPageView {
  readonly tool = input.required<string>();
  private readonly seo = inject(SeoService);
  private readonly counter = inject(CounterService);
  private readonly consent = inject(ConsentService);
  protected readonly uses = signal<number | null>(null);
  private counted = false;

  protected readonly info = computed<ToolPageInfo>(() => toolPage(this.tool())!);
  /** The invoice maker needs the full width for form + preview. */
  protected readonly wide = computed(() => this.info().id === 'gst-invoice');
  protected readonly related = computed(() => TOOL_LINKS.filter((t) => t.group === this.info().group && t.id !== this.info().id));
  protected readonly hubPath = computed(() => HUB_PATHS[this.info().group]);
  protected readonly sources = computed(() => SOURCES[this.info().path] ?? null);
  protected readonly disclaimer = computed(() => DISCLAIMERS[this.info().disclaimer]);

  constructor() {
    effect(() => {
      const t = this.info();
      this.seo.set({
        title: t.title,
        description: t.description,
        path: t.path,
        jsonLd: [
          SeoService.app(t.h1, t.path, t.description),
          SeoService.howTo(`How to use the ${t.name}`, t.steps),
          SeoService.faq(t.faqs),
          SeoService.breadcrumbs([
            { name: 'Home', path: '' },
            { name: t.name, path: t.path },
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

  protected used() {
    if (this.counted) return;
    this.counted = true;
    this.counter.hit(this.info().id);
    this.consent.event('tool_use', { tool: this.info().id, how: 'use' });
  }
}
