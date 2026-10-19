import { Component, ElementRef, HostListener, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Icon } from './icon';
import { DialogService, DialogTone } from '../core/dialog.service';

const TONES: Record<DialogTone, { icon: string; badge: string; button: string }> = {
  primary: { icon: 'info', badge: 'bg-brand/10 text-brand', button: 'bg-brand text-brand-ink hover:brightness-110' },
  danger: { icon: 'triangle-alert', badge: 'bg-rose-500/10 text-rose-600', button: 'bg-rose-600 text-white hover:bg-rose-700' },
  warning: { icon: 'triangle-alert', badge: 'bg-amber-500/10 text-amber-600', button: 'bg-amber-500 text-white hover:bg-amber-600' },
  success: { icon: 'circle-check', badge: 'bg-emerald-500/10 text-emerald-600', button: 'bg-emerald-600 text-white hover:bg-emerald-700' },
};

/** Branded confirm / prompt dialog — replaces window.confirm / prompt. */
@Component({
  selector: 'app-dialog-host',
  imports: [Icon],
  template: `
    @if (dialog.current(); as d) {
      @let t = tone();
      <div class="animate-fade-in fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-[2px]" (click)="cancel()"></div>
      <div class="pointer-events-none fixed inset-0 z-[91] flex items-end justify-center sm:items-center sm:p-6">
        <div class="animate-fade-up pointer-events-auto w-full max-w-md overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl"
             role="alertdialog" aria-modal="true" aria-labelledby="dlg-title">
          <div class="flex items-center gap-2 border-b border-line bg-surface-2 px-5 py-2.5">
            <img src="favicon.svg" alt="" width="20" height="20" class="size-5 rounded-md" />
            <span class="text-sm font-bold">SpreadApps Tools</span>
          </div>
          <form class="p-5 pb-safe" (submit)="$event.preventDefault(); ok()" novalidate>
            <div class="flex items-start gap-3.5">
              <span class="grid size-10 shrink-0 place-items-center rounded-2xl {{ t.badge }}">
                <svg [lucideIcon]="d.icon || t.icon" [size]="20" />
              </span>
              <div class="min-w-0 flex-1">
                <h2 id="dlg-title" class="text-base font-bold">{{ d.title }}</h2>
                @if (d.message) {
                  <p class="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted">{{ d.message }}</p>
                }
                @if (d.details?.length) {
                  <ul class="mt-2 space-y-1 text-sm text-muted">
                    @for (x of d.details; track $index) {
                      <li class="flex gap-2"><span class="mt-2 size-1.5 shrink-0 rounded-full bg-muted/50"></span>{{ x }}</li>
                    }
                  </ul>
                }
              </div>
            </div>
            @if (d.kind === 'prompt') {
              <div class="mt-4" [class.field-invalid]="!!error()">
                <label class="label" for="dlg-input">{{ d.label }}</label>
                <input #field id="dlg-input" class="input" [type]="d.type || 'text'" name="v"
                       [value]="value()" (input)="onInput($event)" [placeholder]="d.placeholder || ''" autocomplete="off" />
                @if (error()) {
                  <p class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ error() }}</p>
                } @else if (d.hint) {
                  <p class="mt-1 text-xs text-muted">{{ d.hint }}</p>
                }
              </div>
            }
            <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" class="btn-ghost" (click)="cancel()">{{ d.cancelText || 'Cancel' }}</button>
              <button type="submit" class="btn shadow-sm {{ t.button }}">{{ d.confirmText || 'OK' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class DialogHost {
  protected readonly dialog = inject(DialogService);
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  protected readonly value = signal('');
  protected readonly touched = signal(false);
  private readonly submitted = signal(false);
  protected readonly tone = computed(() => TONES[this.dialog.current()?.tone ?? 'primary']);

  private readonly rawError = computed(() => {
    const d = this.dialog.current();
    if (!d || d.kind !== 'prompt') return null;
    return d.validate ? d.validate(this.value().trim()) : null;
  });
  protected readonly error = computed(() => (this.touched() || this.submitted() ? this.rawError() : null));

  constructor() {
    effect(() => {
      const d = this.dialog.current();
      if (!d) return;
      this.value.set(d.value ?? '');
      this.touched.set(false);
      this.submitted.set(false);
      setTimeout(() => this.field()?.nativeElement.focus(), 50);
    });
  }

  protected onInput(e: Event) {
    this.value.set((e.target as HTMLInputElement).value);
    this.touched.set(true);
  }

  @HostListener('document:keydown.escape')
  cancel() {
    const d = this.dialog.current();
    if (d) this.dialog.close(d.kind === 'confirm' ? false : null);
  }

  ok() {
    const d = this.dialog.current();
    if (!d) return;
    if (d.kind === 'confirm') return this.dialog.close(true);
    this.submitted.set(true);
    if (this.rawError()) return;
    this.dialog.close(this.value().trim());
  }
}
