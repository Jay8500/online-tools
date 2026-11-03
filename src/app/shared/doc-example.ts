import { Component, input } from '@angular/core';

type Kind = 'photo' | 'signature' | 'thumb' | 'declaration' | 'image';

/**
 * "See a correct example" for exam uploads: a simple drawing of what's accepted (✅) and the usual
 * reasons forms reject the file (❌). Drawn with inline SVG — no real photos.
 */
@Component({
  selector: 'app-doc-example',
  template: `
    @if (kind() !== 'image') {
      <details class="group border-b border-line px-3 py-2 text-sm">
        <summary class="flex cursor-pointer list-none items-center gap-1.5 font-semibold text-brand">
          <span aria-hidden="true">👀</span> See a correct {{ label() }} example
          <span class="ml-auto text-xs text-muted transition group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>
        <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <!-- ✅ good -->
          <figure class="rounded-xl border-2 border-emerald-500/60 bg-emerald-500/5 p-2 text-center">
            <svg viewBox="0 0 120 140" class="mx-auto h-28 w-auto rounded-md bg-white" aria-hidden="true">
              @switch (kind()) {
                @case ('photo') {
                  <rect width="120" height="140" fill="#f8fafc" />
                  <ellipse cx="60" cy="58" rx="24" ry="30" fill="#e0b48a" />
                  <path d="M36 52c2-22 46-22 48 0-6-10-42-10-48 0z" fill="#3b2a20" />
                  <circle cx="51" cy="56" r="2.2" fill="#222" /><circle cx="69" cy="56" r="2.2" fill="#222" />
                  <path d="M53 72q7 5 14 0" stroke="#7a3e2b" stroke-width="2" fill="none" />
                  <path d="M18 140c4-30 24-40 42-40s38 10 42 40z" fill="#1d4ed8" />
                }
                @case ('signature') {
                  <rect width="120" height="140" fill="#fff" />
                  <path d="M14 82c10-24 18-26 20-8s4 18 12-6 10-20 14 2 8 14 16-4 10-6 14 6 8 6 16-6" stroke="#1e3a8a" stroke-width="3" fill="none" stroke-linecap="round" />
                }
                @case ('thumb') {
                  <rect width="120" height="140" fill="#fff" />
                  <ellipse cx="60" cy="72" rx="26" ry="36" fill="#1e3a8a" opacity="0.15" />
                  @for (r of rings; track r) { <ellipse cx="60" cy="72" [attr.rx]="r * 0.72" [attr.ry]="r" fill="none" stroke="#1e3a8a" stroke-width="1.6" /> }
                }
                @case ('declaration') {
                  <rect width="120" height="140" fill="#fff" />
                  @for (y of lines; track y) { <path [attr.d]="'M14 ' + y + ' q12 -6 24 0 t24 0 t24 0 t20 0'" stroke="#1e3a8a" stroke-width="2" fill="none" /> }
                  <path d="M60 122c6-10 10-10 12-2s6 6 12-4" stroke="#1e3a8a" stroke-width="2.4" fill="none" />
                }
              }
            </svg>
            <figcaption class="mt-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">✅ {{ good() }}</figcaption>
          </figure>
          <!-- ❌ common mistakes -->
          @for (m of mistakes(); track m) {
            <figure class="rounded-xl border border-line bg-surface-2 p-2 text-center">
              <svg viewBox="0 0 120 140" class="mx-auto h-28 w-auto rounded-md opacity-90" aria-hidden="true">
                @switch (m) {
                  @case ('Dark background') {
                    <rect width="120" height="140" fill="#334155" />
                    <ellipse cx="60" cy="58" rx="24" ry="30" fill="#c99a70" /><path d="M18 140c4-30 24-40 42-40s38 10 42 40z" fill="#0f172a" />
                  }
                  @case ('Cap / sunglasses') {
                    <rect width="120" height="140" fill="#f8fafc" />
                    <ellipse cx="60" cy="60" rx="24" ry="30" fill="#e0b48a" /><rect x="34" y="28" width="52" height="14" rx="6" fill="#dc2626" />
                    <rect x="42" y="52" width="14" height="8" rx="3" fill="#111" /><rect x="64" y="52" width="14" height="8" rx="3" fill="#111" />
                    <path d="M18 140c4-30 24-40 42-40s38 10 42 40z" fill="#1d4ed8" />
                  }
                  @case ('Face too small') {
                    <rect width="120" height="140" fill="#e2e8f0" />
                    <ellipse cx="60" cy="62" rx="9" ry="11" fill="#e0b48a" /><path d="M44 96c2-14 8-18 16-18s14 4 16 18z" fill="#1d4ed8" />
                  }
                  @case ('Lined paper / shadow') {
                    <rect width="120" height="140" fill="#fefce8" />
                    @for (y of lines; track y) { <line x1="0" [attr.y1]="y" x2="120" [attr.y2]="y" stroke="#93c5fd" /> }
                    <rect width="120" height="140" fill="url(#sh)" />
                    <defs><linearGradient id="sh"><stop offset="0" stop-color="#000" stop-opacity="0.25" /><stop offset="1" stop-color="#000" stop-opacity="0" /></linearGradient></defs>
                    <path d="M14 82c10-24 18-26 20-8s4 18 12-6 10-20 14 2" stroke="#1e3a8a" stroke-width="3" fill="none" />
                  }
                  @case ('Too small / far') {
                    <rect width="120" height="140" fill="#fff" />
                    <path d="M48 72c3-7 6-7 7-2s2 5 4-2 3-6 4 1" stroke="#1e3a8a" stroke-width="1.4" fill="none" />
                  }
                  @case ('Coloured / pencil') {
                    <rect width="120" height="140" fill="#fff" />
                    <path d="M14 82c10-24 18-26 20-8s4 18 12-6 10-20 14 2 8 14 16-4" stroke="#a3a3a3" stroke-width="2" fill="none" />
                  }
                  @case ('Smudged') {
                    <rect width="120" height="140" fill="#fff" />
                    <ellipse cx="60" cy="72" rx="30" ry="38" fill="#1e3a8a" opacity="0.55" />
                  }
                  @case ('Typed, not handwritten') {
                    <rect width="120" height="140" fill="#fff" />
                    @for (y of lines; track y) { <rect x="14" [attr.y]="y - 3" width="92" height="5" fill="#475569" /> }
                  }
                }
                <line x1="12" y1="12" x2="108" y2="128" stroke="#dc2626" stroke-width="4" opacity="0.7" />
              </svg>
              <figcaption class="mt-1 text-xs font-medium text-rose-600">❌ {{ m }}</figcaption>
            </figure>
          }
        </div>
        <p class="mt-2 text-xs text-muted">{{ tip() }}</p>
      </details>
    }
  `,
})
export class DocExample {
  readonly kind = input.required<Kind>();
  protected readonly rings = [8, 14, 20, 26, 32];
  protected readonly lines = [30, 44, 58, 72, 86, 100];

  protected label() {
    return { photo: 'photo', signature: 'signature', thumb: 'thumb impression', declaration: 'declaration', image: '' }[this.kind()];
  }
  protected good() {
    return { photo: 'Light plain background, face clear', signature: 'Black/blue ink on white', thumb: 'Clear, on white paper', declaration: 'Your own handwriting', image: '' }[this.kind()];
  }
  protected mistakes(): string[] {
    switch (this.kind()) {
      case 'photo': return ['Dark background', 'Cap / sunglasses', 'Face too small'];
      case 'signature': return ['Lined paper / shadow', 'Too small / far', 'Coloured / pencil'];
      case 'thumb': return ['Smudged', 'Lined paper / shadow'];
      case 'declaration': return ['Typed, not handwritten', 'Lined paper / shadow'];
      default: return [];
    }
  }
  protected tip() {
    return {
      photo: 'Face straight to the camera, both ears visible, no shadow on the face. Recent photo (within 3 months). Crop so the face fills about 70% of the height.',
      signature: 'Sign on plain white paper with a black or blue pen, take the photo in daylight from straight above, and crop close to the signature.',
      thumb: 'Use a blue/black stamp pad, press once firmly on white paper, and photograph it in good light.',
      declaration: 'Write the exact text from the notification in your own handwriting (English), sign below, and photograph on plain white paper.',
      image: '',
    }[this.kind()];
  }
}
