import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, effect, inject, signal } from '@angular/core';
import { TELUGU_HELP, toTelugu } from '../../core/telugu';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../../shared/icon';

const DRAFT = 'telugu-draft';

@Component({
  selector: 'app-telugu-tool',
  imports: [Icon],
  template: `
    <div class="grid gap-3 md:grid-cols-2">
      <div>
        <label class="label" for="en">Type in English letters</label>
        <textarea id="en" class="input min-h-40 font-mono text-base" rows="6" placeholder="nEnu telugu nErchukuMTunnAnu" spellcheck="false"
                  autocapitalize="none" autocomplete="off" [value]="text()" (input)="setText($event)"></textarea>
        <p class="mt-1 text-xs text-muted">Capital letters matter: <b>t</b> త but <b>T</b> ట, <b>e</b> ఎ but <b>E</b> ఏ.</p>
      </div>
      <div>
        <p class="label">తెలుగు</p>
        <div class="min-h-40 rounded-xl border border-line bg-surface-2 p-3 text-xl leading-relaxed break-words whitespace-pre-wrap" lang="te" aria-live="polite">{{ telugu() || 'మీ తెలుగు ఇక్కడ కనిపిస్తుంది' }}</div>
        <div class="mt-2 flex flex-wrap gap-2">
          <button type="button" class="btn-primary" (click)="copy()" [disabled]="!telugu()"><svg lucideIcon="copy" [size]="16" /> Copy</button>
          <a class="btn-success" [class.pointer-events-none]="!telugu()" [class.opacity-50]="!telugu()" [href]="whatsapp()" target="_blank" rel="noopener">
            <svg lucideIcon="message-circle" [size]="16" /> WhatsApp
          </a>
          <button type="button" class="btn-ghost" (click)="clear()" [disabled]="!text()"><svg lucideIcon="eraser" [size]="16" /> Clear</button>
        </div>
      </div>
    </div>
    <details class="mt-4 rounded-2xl border border-line p-3" [open]="true">
      <summary class="cursor-pointer text-sm font-semibold">Letter guide</summary>
      <div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        @for (h of help; track h.en) {
          <div class="flex justify-between gap-2 border-b border-line py-1"><code class="text-muted">{{ h.en }}</code><span lang="te">{{ h.te }}</span></div>
        }
      </div>
      <p class="mt-2 text-xs text-muted">Examples: amma → అమ్మ · SrI → శ్రీ · kRuShNa → కృష్ణ · haidarAbAd → హైదరాబాద్ · annaM → అన్నం</p>
    </details>
  `,
})
export class TeluguTool {
  private readonly toast = inject(ToastService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly help = TELUGU_HELP;
  protected readonly text = signal('');
  protected readonly telugu = computed(() => toTelugu(this.text()));
  private loaded = false;
  protected readonly whatsapp = computed(() => `https://wa.me/?text=${encodeURIComponent(this.telugu())}`);

  constructor() {
    // Keep the draft on this device only (never sent anywhere)
    afterNextRender(() => {
      try {
        this.text.set(localStorage.getItem(DRAFT) ?? '');
      } catch {
        /* storage blocked */
      }
      this.loaded = true;
    });
    effect(() => {
      const t = this.text();
      // Don't save until the old draft has been restored, or we'd overwrite it with ''
      if (!this.browser || !this.loaded) return;
      try {
        localStorage.setItem(DRAFT, t);
      } catch {
        /* ignore */
      }
    });
  }

  protected setText(e: Event) {
    this.text.set((e.target as HTMLTextAreaElement).value);
  }

  protected async copy() {
    try {
      await navigator.clipboard.writeText(this.telugu());
      this.toast.success('Copied — paste it anywhere');
    } catch {
      this.toast.error('Copy is blocked here. Select the Telugu text and copy it manually.');
    }
  }

  protected clear() {
    this.text.set('');
  }
}
