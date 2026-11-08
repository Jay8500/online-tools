import { Injectable, signal } from '@angular/core';
import { BackLayer, pushLayer } from './back-layer';

export type DialogTone = 'primary' | 'danger' | 'warning' | 'success';

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Optional bullet points under the message (e.g. what will be deleted). */
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  tone?: DialogTone;
  /** lucide icon name; defaults by tone */
  icon?: string;
}

export interface PromptOptions extends ConfirmOptions {
  label: string;
  value?: string;
  placeholder?: string;
  hint?: string;
  type?: 'text' | 'email' | 'password';
  mono?: boolean;
  /** Return an error message to block confirming, or null when valid. */
  validate?: (value: string) => string | null;
  /** Type-to-confirm: the value must equal this exactly. */
  requireMatch?: string;
}

export interface DialogState extends PromptOptions {
  kind: 'confirm' | 'prompt';
  resolve: (value: string | boolean | null) => void;
}

/** In-app replacement for window.confirm / window.prompt, rendered by <app-dialog-host>. */
@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly current = signal<DialogState | null>(null);
  private layer?: BackLayer;

  confirm(o: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.current()?.resolve(this.current()!.kind === 'confirm' ? false : null);
      this.current.set({ label: '', ...o, kind: 'confirm', resolve: (v) => resolve(v === true) });
      this.guard();
    });
  }

  prompt(o: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      this.current()?.resolve(this.current()!.kind === 'confirm' ? false : null);
      this.current.set({ ...o, kind: 'prompt', resolve: (v) => resolve(typeof v === 'string' ? v : null) });
      this.guard();
    });
  }

  /** Phone Back closes the dialog like Cancel. */
  private guard() {
    this.layer ??= pushLayer(() => {
      this.layer = undefined;
      const d = this.current();
      if (!d) return;
      this.current.set(null);
      d.resolve(d.kind === 'confirm' ? false : null);
    });
  }

  /** Called by the host. */
  close(value: string | boolean | null) {
    const d = this.current();
    if (!d) return;
    this.current.set(null);
    const l = this.layer;
    this.layer = undefined;
    if (l) l.release().then(() => d.resolve(value));
    else d.resolve(value);
  }
}
