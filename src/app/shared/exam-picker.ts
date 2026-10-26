import { Component, computed, effect, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOC_SHORT, EXAMS, Exam, examPath } from '../core/exams';
import { Icon } from './icon';

let seq = 0;

/**
 * Searchable exam dropdown (combobox) + one button per document (photo, signature…) with its KB limit.
 * Replaces the heavy grid of exam cards on the home page: pick an exam, tap what you need.
 */
@Component({
  selector: 'app-exam-picker',
  imports: [RouterLink, Icon],
  template: `
    <div class="card p-3 sm:p-4">
      <label class="label" [for]="id">Which exam?</label>
      <div class="relative">
        <svg lucideIcon="search" [size]="16" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input [id]="id" class="input pr-9 pl-9" type="text" role="combobox" autocomplete="off" aria-autocomplete="list"
               [attr.aria-expanded]="open()" [attr.aria-controls]="id + '-list'" [attr.aria-activedescendant]="open() && list().length ? id + '-o' + active() : null"
               [placeholder]="selected().name + ' — type to search (SBI, RRB, NEET…)'" [value]="text()"
               (focus)="openList()" (input)="onType($event)" (keydown)="onKey($event)" (blur)="closeSoon()" />
        <svg lucideIcon="chevron-down" [size]="16" class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
        @if (open()) {
          <ul [id]="id + '-list'" role="listbox" class="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-xl">
            @for (e of list(); track e.slug; let i = $index) {
              <li [id]="id + '-o' + i" role="option" [attr.aria-selected]="e.slug === selected().slug"
                  class="cursor-pointer rounded-lg px-3 py-2" [class.bg-brand]="i === active()" [class.text-white]="i === active()"
                  (mousedown)="$event.preventDefault(); choose(e)" (mouseenter)="active.set(i)">
                <span class="block text-sm font-bold">{{ e.name }}</span>
                <span class="block truncate text-xs" [class.text-muted]="i !== active()">{{ e.full }}</span>
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm text-muted">No exam found. Use <a routerLink="/resize-image-to-kb" class="text-brand underline">Resize image to KB</a> with your form’s size.</li>
            }
          </ul>
        }
      </div>

      <p class="mt-3 text-xs text-muted"><b class="text-ink">{{ selected().name }}</b> · {{ selected().full }}</p>
      <div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        @for (d of selected().docs; track d.kind) {
          <a [routerLink]="'/' + path(d.kind)" class="group flex flex-col rounded-xl border border-line bg-surface-2 px-3 py-2.5 transition hover:border-brand/60">
            <span class="text-sm font-semibold group-hover:text-brand">{{ short(d.kind) }} →</span>
            <span class="text-xs text-muted">{{ d.minKb }}–{{ d.maxKb }} KB</span>
          </a>
        }
      </div>
    </div>
  `,
})
export class ExamPicker {
  /** Pre-select this exam (e.g. the first match of the home search). */
  readonly preset = input<Exam | null>(null);
  protected readonly id = `exam-pick-${++seq}`;
  protected readonly selected = signal<Exam>(EXAMS[0]);
  protected readonly text = signal('');
  protected readonly open = signal(false);
  protected readonly active = signal(0);
  protected readonly list = computed(() => {
    const q = this.text().trim().toLowerCase();
    if (!q) return EXAMS;
    return EXAMS.filter((e) => `${e.name} ${e.full} ${e.slug}`.toLowerCase().includes(q));
  });
  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const p = this.preset();
      if (p) this.selected.set(p);
    });
  }

  protected openList() {
    clearTimeout(this.closeTimer);
    this.open.set(true);
    this.active.set(Math.max(0, this.list().findIndex((e) => e.slug === this.selected().slug)));
  }
  protected onType(e: Event) {
    this.text.set((e.target as HTMLInputElement).value);
    this.open.set(true);
    this.active.set(0);
  }
  protected onKey(e: KeyboardEvent) {
    const n = this.list().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.open()) return this.openList();
      this.active.update((i) => (n ? (i + 1) % n : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.active.update((i) => (n ? (i - 1 + n) % n : 0));
    } else if (e.key === 'Enter' && this.open() && n) {
      e.preventDefault();
      this.choose(this.list()[this.active()]);
    } else if (e.key === 'Escape') {
      this.open.set(false);
    }
  }
  protected closeSoon() {
    this.closeTimer = setTimeout(() => this.open.set(false), 120);
  }
  protected choose(e: Exam) {
    this.selected.set(e);
    this.text.set('');
    this.open.set(false);
  }
  protected path(kind: Exam['docs'][number]['kind']) {
    return examPath(this.selected(), kind);
  }
  protected short(kind: Exam['docs'][number]['kind']) {
    return DOC_SHORT[kind];
  }
}
