import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

/** Known browser / network messages → short, human text. First match wins. */
const FRIENDLY: [RegExp, string][] = [
  [/failed to fetch|networkerror|network request failed|load failed|fetch failed/i, 'No internet connection. Please try again.'],
  [/quota|out of memory|allocation failed/i, 'Your device ran out of memory. Close other apps or pick a smaller photo.'],
  [/aborterror|share canceled|cancell?ed/i, 'Cancelled.'],
  [/timeout|timed out/i, 'This took too long. Please try again.'],
];

/** Words that mean the message is technical and should never be shown as-is. */
const TECHNICAL = /undefined|null|exception|stack|typeerror|referenceerror|json|token|wasm|webgl|\bcode\b/i;

/** Turns any error into a short message that is safe to show to visitors. */
export function friendlyError(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const raw = typeof e === 'string' ? e : ((e as { message?: string })?.message ?? '');
  if (!raw) return fallback;
  for (const [re, msg] of FRIENDLY) if (re.test(raw)) return msg;
  if (raw.length <= 160 && !TECHNICAL.test(raw)) return raw;
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  show(text: string, kind: ToastKind = 'info', ms = 3200): void {
    // Same message already on screen → don't stack duplicates
    if (this.toasts().some((t) => t.text === text && t.kind === kind)) return;
    const id = ++this.seq;
    this.toasts.update((t) => [...t.slice(-2), { id, kind, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }

  success(text: string) {
    this.show(text, 'success');
  }
  /** Validation / "please fix this" messages */
  warn(text: string) {
    this.show(text, 'warning', 4000);
  }
  info(text: string) {
    this.show(text, 'info');
  }
  /** Plain error text you wrote yourself */
  error(text: string) {
    this.show(text, 'error', 5000);
  }
  /** Any caught error → friendly text (never raw technical messages) */
  fail(e: unknown, fallback?: string) {
    if (e) console.error(e);
    this.show(friendlyError(e, fallback), 'error', 5000);
  }

  dismiss(id: number) {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
