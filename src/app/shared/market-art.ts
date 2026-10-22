import { Component } from '@angular/core';

/** Bull head (horns up), drawn in currentColor: `<svg appBull [attr.width]="64" />`. */
@Component({
  selector: 'svg[appBull]',
  host: { viewBox: '0 0 64 64', 'aria-hidden': 'true' },
  template: `
    <svg:path fill="currentColor" d="M5 9c0 11 8 18 17 16v-5c-6 1-11-3-12-11z" />
    <svg:path fill="currentColor" d="M59 9c0 11-8 18-17 16v-5c6 1 11-3 12-11z" />
    <svg:ellipse fill="currentColor" cx="13" cy="29" rx="6" ry="3.2" transform="rotate(-20 13 29)" />
    <svg:ellipse fill="currentColor" cx="51" cy="29" rx="6" ry="3.2" transform="rotate(20 51 29)" />
    <svg:path fill="currentColor" d="M20 21q12-6 24 0l2 19q0 11-7 15H25q-7-4-7-15z" />
    <svg:ellipse fill="#fff" fill-opacity=".28" cx="32" cy="47" rx="10" ry="7" />
    <svg:circle fill="#000" fill-opacity=".35" cx="28" cy="48" r="1.8" />
    <svg:circle fill="#000" fill-opacity=".35" cx="36" cy="48" r="1.8" />
    <svg:circle fill="#fff" cx="26" cy="32" r="2.2" /><svg:circle fill="#000" fill-opacity=".7" cx="26.4" cy="32.3" r="1" />
    <svg:circle fill="#fff" cx="38" cy="32" r="2.2" /><svg:circle fill="#000" fill-opacity=".7" cx="38.4" cy="32.3" r="1" />
  `,
})
export class BullHead {}

/** Bear head (round ears), drawn in currentColor: `<svg appBear [attr.width]="64" />`. */
@Component({
  selector: 'svg[appBear]',
  host: { viewBox: '0 0 64 64', 'aria-hidden': 'true' },
  template: `
    <svg:circle fill="currentColor" cx="17" cy="17" r="8" />
    <svg:circle fill="currentColor" cx="47" cy="17" r="8" />
    <svg:circle fill="#fff" fill-opacity=".28" cx="17" cy="17" r="4" />
    <svg:circle fill="#fff" fill-opacity=".28" cx="47" cy="17" r="4" />
    <svg:circle fill="currentColor" cx="32" cy="36" r="21" />
    <svg:ellipse fill="#fff" fill-opacity=".28" cx="32" cy="45" rx="10" ry="8" />
    <svg:ellipse fill="#000" fill-opacity=".45" cx="32" cy="41" rx="4" ry="2.8" />
    <svg:path d="M28 48q4 3 8 0" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round" />
    <svg:circle fill="#fff" cx="24.5" cy="32" r="2.2" /><svg:circle fill="#000" fill-opacity=".7" cx="24.9" cy="32.3" r="1" />
    <svg:circle fill="#fff" cx="39.5" cy="32" r="2.2" /><svg:circle fill="#000" fill-opacity=".7" cx="39.9" cy="32.3" r="1" />
  `,
})
export class BearHead {}

/** See-through market background for the "Stock market today" tool card (like the weather sky). */
@Component({
  selector: 'app-market-art',
  imports: [BullHead, BearHead],
  host: { class: 'pointer-events-none absolute inset-0 -z-10 overflow-hidden', 'aria-hidden': 'true' },
  template: `
    <div class="absolute inset-0 bg-gradient-to-r from-green-500/12 via-transparent to-rose-500/12 dark:from-green-500/15 dark:to-rose-500/15"></div>
    <svg class="absolute inset-x-0 bottom-0 h-3/5 w-full" viewBox="0 0 200 60" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mk-line" x1="0" x2="1">
          <stop offset="0" stop-color="#16a34a" /><stop offset=".6" stop-color="#16a34a" /><stop offset="1" stop-color="#e11d48" />
        </linearGradient>
      </defs>
      <path fill="url(#mk-line)" fill-opacity=".12" d="M0 52 22 44l18 5 22-16 18 6 24-20 20 8 22-18 20 10 34 18v35H0z" />
      <path fill="none" stroke="url(#mk-line)" stroke-opacity=".45" stroke-width="1.6" stroke-linejoin="round" d="M0 52 22 44l18 5 22-16 18 6 24-20 20 8 22-18 20 10 34 18" />
    </svg>
    <svg appBull class="bull absolute top-1/2 right-12 size-20 -translate-y-1/2 text-green-600 opacity-20 dark:text-green-400 dark:opacity-25"></svg>
    <svg appBear class="bear absolute -right-3 bottom-0 size-14 text-rose-600 opacity-20 dark:text-rose-400 dark:opacity-25"></svg>
  `,
  styles: `
    .bull { animation: charge 2.4s ease-in-out infinite; }
    .bear { animation: sway 2.8s ease-in-out infinite; }
    @keyframes charge { 0%, 100% { translate: -3px -50%; } 50% { translate: 3px calc(-50% - 2px); } }
    @keyframes sway { 0%, 100% { rotate: -5deg; } 50% { rotate: 5deg; } }
    @media (prefers-reduced-motion: reduce) { .bull, .bear { animation: none; } }
  `,
})
export class MarketArt {}
