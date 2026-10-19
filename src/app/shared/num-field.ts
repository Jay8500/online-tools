import { Component, computed, effect, input, model, signal } from '@angular/core';

const FMT = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
let seq = 0;

/**
 * Number input for calculators: Indian digit grouping (12,34,567), ₹/%/years affixes, optional slider,
 * inline validation. `value` only changes when the typed number is valid, so results never show junk.
 */
@Component({
  selector: 'app-num-field',
  template: `
    <div [class.field-invalid]="!!error()">
      <div class="mb-1 flex items-baseline justify-between gap-2">
        <label class="label mb-0" [for]="id">{{ label() }}</label>
        @if (words()) { <span class="text-[11px] text-muted">{{ words() }}</span> }
      </div>
      <div class="relative">
        @if (prefix()) { <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted">{{ prefix() }}</span> }
        <input class="input text-right font-semibold tabular-nums" [class.pl-7]="!!prefix()" [class.pr-14]="!!suffix()"
               [id]="id" type="text" [attr.inputmode]="min() < 0 ? 'text' : 'decimal'" autocomplete="off" [value]="text()"
               (input)="onInput($event)" (focus)="focused.set(true)" (blur)="onBlur()" [attr.aria-describedby]="id + '-msg'"
               [attr.aria-invalid]="!!error()" />
        @if (suffix()) { <span class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted">{{ suffix() }}</span> }
      </div>
      @if (slider()) {
        <input type="range" class="mt-2 w-full accent-brand" [min]="min()" [max]="sliderMax() ?? max()" [step]="step()" [value]="value()"
               (input)="onSlide($event)" [attr.aria-label]="label() + ' slider'" />
      }
      @if (error()) {
        <p class="mt-1 text-xs font-medium text-rose-600" [id]="id + '-msg'" role="alert">{{ error() }}</p>
      } @else if (hint()) {
        <p class="mt-1 text-xs text-muted" [id]="id + '-msg'">{{ hint() }}</p>
      }
    </div>
  `,
})
export class NumField {
  readonly label = input.required<string>();
  readonly value = model.required<number>();
  readonly min = input(0);
  readonly max = input(1e12);
  /** Slider can stop earlier than the typed max (e.g. loans up to ₹5 cr typed, ₹1 cr on the slider). */
  readonly sliderMax = input<number>();
  readonly step = input(1);
  readonly prefix = input('');
  readonly suffix = input('');
  readonly hint = input('');
  readonly slider = input(true);
  /** Show "12.5 lakh" helper next to rupee amounts. */
  readonly rupeeWords = input(false);

  protected readonly id = `nf-${++seq}`;
  protected readonly focused = signal(false);
  private readonly raw = signal('');
  readonly error = signal<string | null>(null);

  protected readonly text = computed(() => (this.focused() || this.error() ? this.raw() : FMT.format(this.value())));
  protected readonly words = computed(() => {
    if (!this.rupeeWords()) return '';
    const v = this.value();
    if (v >= 1e7) return `₹${+(v / 1e7).toFixed(2)} crore`;
    if (v >= 1e5) return `₹${+(v / 1e5).toFixed(2)} lakh`;
    return '';
  });

  constructor() {
    // Keep the editable text in sync when the value changes from outside (slider, presets).
    effect(() => {
      const v = this.value();
      if (!this.focused()) this.raw.set(String(v));
    });
  }

  protected onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    // Allow digits, one dot; drop commas/spaces people type or paste.
    // A leading minus is kept only where negatives are valid (e.g. −10 °C).
    const neg = this.min() < 0 && el.value.trim().startsWith('-');
    const cleaned = (neg ? '-' : '') + el.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    if (cleaned !== el.value) el.value = cleaned;
    this.raw.set(cleaned);
    this.check(cleaned);
  }

  protected onBlur() {
    this.focused.set(false);
    if (!this.error()) this.raw.set(String(this.value()));
  }

  protected onSlide(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    this.error.set(null);
    this.raw.set(String(v));
    this.value.set(v);
  }

  private check(s: string) {
    if (!s || s === '-') return this.error.set('Enter a number');
    const v = Number(s);
    if (!Number.isFinite(v)) return this.error.set('Enter a valid number');
    const fmt = (n: number) => `${this.prefix()}${FMT.format(n)}${this.suffix() ? ' ' + this.suffix() : ''}`;
    if (v < this.min() || v > this.max()) return this.error.set(`Enter between ${fmt(this.min())} and ${fmt(this.max())}`);
    this.error.set(null);
    this.value.set(v);
  }
}
