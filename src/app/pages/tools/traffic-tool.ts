import { Component, afterNextRender, computed, signal } from '@angular/core';
import { FINES, RULES, STATES } from '../../core/traffic';
import { Icon } from '../../shared/icon';

const LAST = 'traffic-state';

@Component({
  selector: 'app-traffic-tool',
  imports: [Icon],
  template: `
    <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="State">
      @for (s of states; track s.id) { <button type="button" class="chip min-h-9" [attr.aria-pressed]="state() === s.id" (click)="pick(s.id)">{{ s.name }}</button> }
      <span class="chip min-h-9 cursor-default opacity-60" title="More states coming soon">Other states soon</span>
    </div>

    <div class="mt-3 rounded-2xl border border-line bg-surface-2 p-3 text-sm animate-fade-up">
      <p class="font-semibold">Check or pay your challan in {{ info().name }}</p>
      <a class="btn-primary mt-2 min-h-9 max-w-full text-left text-sm whitespace-normal" [href]="info().portal.url" target="_blank" rel="noopener"><svg lucideIcon="search" [size]="16" /> {{ info().portal.label }} ↗</a>
      <ul class="mt-2 list-disc space-y-0.5 pl-5 text-xs text-muted">
        @for (n of info().notes; track n) { <li>{{ n }}</li> }
      </ul>
    </div>

    <div class="relative mt-4">
      <label class="sr-only" for="t-q">Find a fine</label>
      <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
      <input id="t-q" class="input pl-9" type="search" placeholder="Helmet, drunk, signal, parking…" maxlength="40" [value]="q()" (input)="q.set(val($event))" />
    </div>

    <ul class="mt-3 grid gap-2 sm:grid-cols-2" aria-live="polite">
      @for (f of list(); track f.id; let i = $index) {
        <li class="animate-fade-up rounded-xl border border-line bg-surface p-3 transition hover:-translate-y-0.5 hover:shadow-md" [style.animation-delay.ms]="i * 35">
          <div class="flex items-start gap-3">
            <span class="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl" aria-hidden="true">{{ f.icon }}</span>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <p class="font-semibold leading-tight">{{ f.title }}</p>
                <span class="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted" [title]="'Motor Vehicles Act section ' + f.section">Sec {{ f.section }}</span>
              </div>
              <p class="text-xs text-muted">{{ f.who }}</p>
              <p class="mt-1 text-lg font-bold text-rose-600 tabular-nums dark:text-rose-400">{{ f.first }}</p>
              @if (f.repeat) { <p class="text-xs"><span class="text-muted">Again:&nbsp;</span><b>{{ f.repeat }}</b></p> }
              @if (f.also) { <p class="text-xs text-muted">+ {{ f.also }}</p> }
            </div>
          </div>
        </li>
      } @empty {
        <li class="rounded-xl border border-line px-3 py-4 text-center text-sm text-muted sm:col-span-2">No match. Try “helmet”, “signal” or “parking”.</li>
      }
    </ul>
    <p class="mt-2 text-xs text-muted">Amounts are the fines in the Motor Vehicles Act (2019 amendment). Police may settle some offences for less — your e-challan shows the exact amount.</p>

    <section class="mt-6" aria-labelledby="rules-h">
      <h3 id="rules-h" class="mb-2 text-base font-bold">Traffic rules in one look</h3>
      <ul class="grid grid-cols-2 gap-2 lg:grid-cols-5">
        @for (r of rules; track r.title; let i = $index) {
          <li class="animate-fade-up rounded-xl border border-line bg-gradient-to-br from-brand/10 to-transparent p-3 transition hover:-translate-y-0.5 hover:shadow-md" [style.animation-delay.ms]="i * 50">
            <span class="animate-float inline-block text-2xl" [style.animation-delay.ms]="i * 200" aria-hidden="true">{{ r.icon }}</span>
            <p class="mt-1 text-sm font-semibold leading-tight">{{ r.title }}</p>
            <p class="mt-0.5 text-xs text-muted">{{ r.text }}</p>
          </li>
        }
      </ul>
    </section>
  `,
})
export class TrafficTool {
  protected readonly states = STATES;
  protected readonly rules = RULES;
  protected readonly state = signal('telangana');
  protected readonly q = signal('');
  protected readonly info = computed(() => STATES.find((s) => s.id === this.state()) ?? STATES[0]);
  protected readonly list = computed(() => {
    const words = this.q().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return FINES.filter((f) => words.every((w) => `${f.title} ${f.who} ${f.tags}`.toLowerCase().includes(w)));
  });

  constructor() {
    afterNextRender(() => {
      try {
        const s = localStorage.getItem(LAST);
        if (s && STATES.some((x) => x.id === s)) this.state.set(s);
      } catch {
        /* ignore */
      }
    });
  }

  protected pick(id: string) {
    this.state.set(id);
    try {
      localStorage.setItem(LAST, id);
    } catch {
      /* ignore */
    }
  }
  protected val(e: Event) {
    return (e.target as HTMLInputElement).value;
  }
}
