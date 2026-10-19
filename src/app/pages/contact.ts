import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../shared/icon';
import { SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';
import { ToastService } from '../core/toast.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L} .'-]{1,59}$/u;

/** Contact form handled by Netlify Forms (detected from the prerendered HTML) — no backend of our own. */
@Component({
  selector: 'app-contact',
  imports: [FormsModule, Icon],
  template: `
    <div class="mx-auto max-w-xl">
      <h1 class="text-xl font-bold sm:text-2xl">Contact us</h1>
      <p class="mt-1 text-sm text-muted">Found a wrong exam size, a bug, or want a new tool? Write to us — we reply within 2 working days.
        You can also email <a class="font-medium text-brand underline" [href]="'mailto:' + site.email">{{ site.email }}</a>.</p>

      @if (sent()) {
        <div class="card animate-fade-up mt-4 flex items-start gap-3 p-4">
          <svg lucideIcon="circle-check" [size]="22" class="shrink-0 text-accent" />
          <div><p class="font-semibold">Thanks, your message was sent.</p><p class="text-sm text-muted">We’ll reply to {{ email() }}.</p></div>
        </div>
      } @else {
        <form name="contact" method="POST" data-netlify="true" netlify-honeypot="company" class="card mt-4 space-y-3 p-4" (submit)="submit($event)" novalidate>
          <input type="hidden" name="form-name" value="contact" />
          <p class="hidden"><label>Company <input name="company" tabindex="-1" autocomplete="off" [(ngModel)]="hp" /></label></p>
          <div [class.field-invalid]="!!err().name">
            <label class="label" for="c-name">Your name <span class="text-rose-600">*</span></label>
            <input id="c-name" name="name" class="input" autocomplete="name" maxlength="60" [ngModel]="name()" (ngModelChange)="name.set($event)" aria-describedby="c-name-e" />
            @if (err().name) { <p id="c-name-e" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ err().name }}</p> }
          </div>
          <div [class.field-invalid]="!!err().email">
            <label class="label" for="c-email">Email <span class="text-rose-600">*</span></label>
            <input id="c-email" name="email" type="email" class="input" autocomplete="email" maxlength="120" [ngModel]="email()" (ngModelChange)="email.set($event)" aria-describedby="c-email-e" />
            @if (err().email) { <p id="c-email-e" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ err().email }}</p> }
          </div>
          <div [class.field-invalid]="!!err().message">
            <label class="label flex justify-between" for="c-msg"><span>Message <span class="text-rose-600">*</span></span><span>{{ message().length }}/2000</span></label>
            <textarea id="c-msg" name="message" rows="5" class="input" maxlength="2000" [ngModel]="message()" (ngModelChange)="message.set($event)" aria-describedby="c-msg-e"></textarea>
            @if (err().message) { <p id="c-msg-e" class="mt-1 text-xs font-medium text-rose-600" role="alert">{{ err().message }}</p> }
          </div>
          <p class="text-xs text-muted">Please don’t send photos or personal documents. We use your details only to reply.</p>
          <button type="submit" class="btn-primary w-full sm:w-auto" [disabled]="sending()"><svg lucideIcon="mail" [size]="16" /> {{ sending() ? 'Sending…' : 'Send message' }}</button>
        </form>
      }
    </div>
  `,
})
export class Contact {
  protected readonly site = SITE;
  private readonly toast = inject(ToastService);
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly message = signal('');
  protected hp = '';
  protected readonly submitted = signal(false);
  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  private readonly openedAt = Date.now();

  private readonly rawErr = computed(() => {
    const e: { name?: string; email?: string; message?: string } = {};
    const n = this.name().trim();
    if (!n) e.name = 'Enter your name';
    else if (!NAME_RE.test(n)) e.name = 'Use letters only (2–60)';
    const m = this.email().trim();
    if (!m) e.email = 'Enter your email';
    else if (!EMAIL_RE.test(m)) e.email = 'Enter a valid email, like name@gmail.com';
    const t = this.message().trim();
    if (t.length < 10) e.message = 'Write at least 10 characters';
    return e;
  });
  protected readonly err = computed(() => (this.submitted() ? this.rawErr() : {}));

  constructor() {
    inject(SeoService).set({ title: 'Contact Us', description: 'Contact SpreadApps Tools — report a wrong exam size, a bug, or suggest a new tool.', path: 'contact' });
  }

  async submit(ev: Event) {
    ev.preventDefault();
    this.submitted.set(true);
    const n = Object.keys(this.rawErr()).length;
    if (n) return this.toast.warn(`Fix ${n} field${n > 1 ? 's' : ''} to send`);
    // Bots: filled the hidden field or submitted in under 3 seconds
    if (this.hp || Date.now() - this.openedAt < 3000) return this.sent.set(true);
    this.sending.set(true);
    try {
      const body = new URLSearchParams({ 'form-name': 'contact', name: this.name().trim(), email: this.email().trim(), message: this.message().trim() });
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      if (!r.ok) throw new Error(`status ${r.status}`);
      this.sent.set(true);
    } catch (e) {
      this.toast.fail(e, 'Could not send right now. Please check your internet and try again.');
    } finally {
      this.sending.set(false);
    }
  }
}
