import { Component, inject } from '@angular/core';
import { Icon } from './icon';
import { ToastKind, ToastService } from '../core/toast.service';

const STYLE: Record<ToastKind, { icon: string; box: string; badge: string }> = {
  success: { icon: 'circle-check', box: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100', badge: 'bg-emerald-500' },
  error: { icon: 'circle-x', box: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100', badge: 'bg-rose-500' },
  warning: { icon: 'triangle-alert', box: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100', badge: 'bg-amber-500' },
  info: { icon: 'info', box: 'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-100', badge: 'bg-teal-600' },
};

@Component({
  selector: 'app-toast-host',
  imports: [Icon],
  template: `
    <div class="pointer-events-none fixed inset-x-0 top-2 z-[100] flex flex-col items-center gap-2 px-3 sm:top-auto sm:right-5 sm:bottom-5 sm:left-auto sm:items-end"
         aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        @let s = style[t.kind];
        <div class="animate-fade-up pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border py-2 pr-2 pl-3 text-sm font-medium shadow-lg shadow-slate-900/10 {{ s.box }}"
             [attr.role]="t.kind === 'error' ? 'alert' : 'status'">
          <span class="grid size-6 shrink-0 place-items-center rounded-full text-white {{ s.badge }}">
            <svg [lucideIcon]="s.icon" [size]="14" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="mb-0.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase opacity-60">
              <img src="favicon.svg" alt="" width="14" height="14" class="size-3.5" /> Spread Apps
            </span>
            <span class="block">{{ t.text }}</span>
          </span>
          <button class="rounded-lg p-1.5 opacity-60 transition hover:bg-black/5 hover:opacity-100" (click)="toasts.dismiss(t.id)" aria-label="Dismiss">
            <svg lucideIcon="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected readonly toasts = inject(ToastService);
  protected readonly style = STYLE;
}
