import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';
import { CounterService } from '../core/counter.service';
import { DOC_LABEL, DOC_SHORT, DocKind, DocSpec, EXAMS, Exam, examPath } from '../core/exams';
import { Faq, SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { AdSlot } from '../shared/ad-slot';
import { FaqList } from '../shared/faq-list';
import { ImageTool, ToolSpec } from '../shared/image-tool';

@Component({
  selector: 'app-exam-tool',
  imports: [RouterLink, Icon, ImageTool, AdSlot, FaqList, DecimalPipe],
  template: `
    @let e = examData();
    @let d = doc();
    <div class="grid gap-x-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="min-w-0">
        <nav aria-label="Breadcrumb" class="mb-1 flex items-center gap-1 text-xs text-muted">
          <a routerLink="/" class="hover:text-brand hover:underline">Home</a><svg lucideIcon="chevron-right" [size]="12" />
          <a routerLink="/" fragment="exam-photo" class="hover:text-brand hover:underline">Exam photos</a><svg lucideIcon="chevron-right" [size]="12" />
          <span aria-current="page" class="font-medium text-ink">{{ e.name }} {{ docShort() }}</span>
        </nav>
        <h1 class="text-lg leading-snug font-bold sm:text-2xl">{{ e.name }} {{ docLabel() }} Resize — {{ d.width }}×{{ d.height }} px, {{ d.minKb }}–{{ d.maxKb }} KB</h1>
        <p class="mt-0.5 mb-2 text-sm text-muted">
          For {{ e.full }}. Free, on your device.
          @if (uses(); as n) { <span class="font-medium text-ink">Used {{ n | number }} times.</span> }
        </p>

        @if (e.docs.length > 1) {
          <div class="mb-2 flex flex-wrap gap-1.5" role="navigation" [attr.aria-label]="e.name + ' documents'">
            @for (x of e.docs; track x.kind) {
              <a class="chip min-h-8 text-xs" [routerLink]="'/' + pathFor(e, x.kind)" [attr.aria-current]="x.kind === d.kind ? 'page' : null">{{ short(x.kind) }}</a>
            }
          </div>
        }

        <app-image-tool [spec]="toolSpec()" />

        <p class="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <svg lucideIcon="info" [size]="14" class="mt-px shrink-0" />
          Sizes are from the latest {{ e.name }} notifications we checked ({{ e.checked }}). Check the official notification for the latest size rules before you apply.
        </p>

        <app-ad-slot slot="top" />

        <section class="mt-2" aria-labelledby="other-exams">
          <h2 id="other-exams" class="mb-2 text-sm font-bold">{{ docLabel() }} resize for other exams</h2>
          <div class="flex flex-wrap gap-1.5">
            @for (o of otherExams(); track o.slug) {
              <a class="chip min-h-8 text-xs" [routerLink]="'/' + pathFor(o, d.kind)">{{ o.name }}</a>
            }
            <a class="chip min-h-8 text-xs" routerLink="/resize-image-to-kb">Any size (KB)</a>
          </div>
        </section>

        <article class="prose-tool mt-4">
          <h2>How to resize your {{ e.name }} {{ docLower() }}</h2>
          <ol class="list-decimal space-y-1 pl-5">
            @for (s of steps(); track $index) { <li>{{ s }}</li> }
          </ol>

          <h2>{{ e.name }} {{ docLower() }} size rules</h2>
          <div class="overflow-x-auto rounded-xl border border-line">
            <table class="w-full text-left text-sm">
              <tbody class="divide-y divide-line">
                <tr><th class="w-36 bg-surface-2 px-3 py-2 font-semibold text-ink">File size</th><td class="px-3 py-2">{{ d.minKb }} KB to {{ d.maxKb }} KB</td></tr>
                <tr><th class="bg-surface-2 px-3 py-2 font-semibold text-ink">Dimensions</th><td class="px-3 py-2">{{ d.width }} × {{ d.height }} pixels (width × height){{ d.pxRange ? ' — allowed ' + d.pxRange : '' }}</td></tr>
                <tr><th class="bg-surface-2 px-3 py-2 font-semibold text-ink">Format</th><td class="px-3 py-2">JPG / JPEG</td></tr>
                <tr><th class="bg-surface-2 px-3 py-2 font-semibold text-ink">Other rules</th><td class="px-3 py-2">{{ d.note }}</td></tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 rounded-xl border border-amber-300/50 bg-amber-500/10 p-3 text-ink"><strong>Tip:</strong> {{ e.tip }}</p>

          <app-ad-slot slot="inContent" />

          <h2>Frequently asked questions</h2>
        </article>
        <app-faq-list [faqs]="faqs()" />
      </div>

      <aside class="mt-6 hidden lg:mt-0 lg:block" aria-label="More tools">
        <div class="sticky top-16 space-y-4">
          <div class="card p-4 text-sm">
            <p class="flex items-center gap-2 font-semibold"><svg lucideIcon="shield-check" [size]="18" class="text-accent" /> Private by design</p>
            <p class="mt-1 text-muted">Your photo is processed inside your browser. It is never uploaded or stored by us.</p>
          </div>
          <app-ad-slot slot="sidebar" [minHeight]="250" />
        </div>
      </aside>
    </div>
  `,
})
export class ExamTool {
  /** From route data */
  readonly exam = input.required<string>();
  readonly kind = input.required<DocKind>();

  private readonly seo = inject(SeoService);
  private readonly counter = inject(CounterService);
  protected readonly uses = signal<number | null>(null);

  protected readonly examData = computed(() => EXAMS.find((e) => e.slug === this.exam())!);
  protected readonly doc = computed(() => this.examData().docs.find((d) => d.kind === this.kind())!);
  protected readonly docLabel = computed(() => DOC_LABEL[this.kind()]);
  protected readonly docShort = computed(() => DOC_SHORT[this.kind()]);
  protected readonly docLower = computed(() => this.docLabel().toLowerCase());
  protected readonly otherExams = computed(() => EXAMS.filter((e) => e.slug !== this.exam() && e.docs.some((d) => d.kind === this.kind())));
  protected readonly path = computed(() => examPath(this.examData(), this.kind()));

  protected readonly toolSpec = computed<ToolSpec>(() => {
    const e = this.examData();
    const d = this.doc();
    return {
      id: `${e.slug}-${d.kind}`,
      label: `${e.name} ${DOC_SHORT[d.kind].toLowerCase()}`,
      kind: d.kind,
      width: d.width,
      height: d.height,
      minKb: d.minKb,
      maxKb: d.maxKb,
      stamp: !!d.stamp,
      pxRange: d.pxRange,
    };
  });

  protected readonly steps = computed(() => stepsFor(this.examData(), this.doc()));
  protected readonly faqs = computed(() => faqsFor(this.examData(), this.doc()));

  constructor() {
    effect(() => {
      const e = this.examData();
      const d = this.doc();
      const label = DOC_LABEL[d.kind];
      const title = `${e.name} ${label} Resize to ${d.minKb}–${d.maxKb} KB (${d.width}×${d.height} px)`;
      const description = `Free ${e.name} ${label.toLowerCase()} resizer: get ${d.width}×${d.height} px, ${d.minKb}–${d.maxKb} KB JPG in seconds. Crop, rotate, white background. Works on phone, nothing uploaded.`;
      this.seo.set({
        title,
        description,
        path: this.path(),
        jsonLd: [
          SeoService.app(`${e.name} ${label} Resizer`, this.path(), description),
          SeoService.howTo(`How to resize ${e.name} ${label.toLowerCase()}`, this.steps()),
          SeoService.faq(this.faqs()),
          SeoService.breadcrumbs([
            { name: 'Home', path: '' },
            { name: `${e.name} ${label} resize`, path: this.path() },
          ]),
        ],
      });
    });
    effect(() => {
      const id = this.toolSpec().id;
      this.uses.set(null);
      this.counter.view(id);
      this.counter.get(id).then((n) => n !== null && n >= SITE.counterMinToShow && this.uses.set(n));
    });
  }

  protected pathFor(e: Exam, k: DocKind) {
    return examPath(e, k);
  }
  protected short(k: DocKind) {
    return DOC_SHORT[k];
  }
}

function stepsFor(e: Exam, d: DocSpec): string[] {
  const noun = DOC_LABEL[d.kind].toLowerCase();
  const steps = [
    `Tap “Choose ${d.kind === 'photo' ? 'photo' : 'image'}” or “Take photo” and pick your ${noun}. You can also drag & drop or paste it.`,
    `Drag the box to choose the part to keep — it is already the right shape for ${d.width}×${d.height} px. Rotate if needed.`,
  ];
  if (d.kind === 'photo') steps.push('Tap “White background” if your background is not plain, and “Name & date” if the form asks for it.');
  else steps.push('Keep “Clean white paper” on so the paper turns pure white and the ink stays sharp.');
  steps.push(`Check the result says ${d.minKb}–${d.maxKb} KB, then tap Download and upload the JPG on the ${e.name} website.`);
  return steps;
}

function faqsFor(e: Exam, d: DocSpec): Faq[] {
  const label = DOC_LABEL[d.kind].toLowerCase();
  const faqs: Faq[] = [
    {
      q: `What is the ${e.name} ${label} size?`,
      a: `${d.width} × ${d.height} pixels and ${d.minKb} KB to ${d.maxKb} KB in JPG format${d.pxRange ? ` (the portal accepts ${d.pxRange})` : ''}. ${d.note} Always confirm with the latest official ${e.name} notification.`,
    },
    {
      q: `How do I reduce my ${e.name} ${label} to ${d.maxKb} KB?`,
      a: `Open this page, choose your ${label}, adjust the crop and tap Download. The tool picks the best JPG quality that stays under ${d.maxKb} KB automatically.`,
    },
    {
      q: `My file is smaller than ${d.minKb} KB. Will it be rejected?`,
      a: `This tool makes sure the file is at least ${d.minKb} KB. If the picture is naturally smaller, it adds invisible padding inside the JPG, so the image looks exactly the same but meets the minimum size.`,
    },
    {
      q: 'Is my photo uploaded to your server?',
      a: 'No. Everything happens inside your browser on your own phone or computer. Your photo is never uploaded, stored or seen by us.',
    },
  ];
  if (d.kind === 'photo') {
    faqs.push({
      q: 'Can I make the photo background white?',
      a: 'Yes. Tap “White background” — an AI model running on your device separates you from the background and puts you on plain white. It needs internet once to download (about 4 MB).',
    });
    if (d.stamp)
      faqs.push({
        q: `How do I add my name and date on the ${e.name} photo?`,
        a: 'Turn on “Name & date”, type your name and the date the photo was taken (DD/MM/YYYY). They are printed in black on a white strip at the bottom of the photo.',
      });
  } else {
    faqs.push({
      q: `My ${label} looks grey or dull. How do I fix it?`,
      a: 'Keep “Clean white paper” switched on. It turns the paper pure white and darkens the ink so it stays clear after compression. Use the brightness slider for fine control.',
    });
  }
  return faqs;
}
