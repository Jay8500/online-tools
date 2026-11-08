import { Component, ElementRef, OnDestroy, afterNextRender, computed, signal, viewChild } from '@angular/core';
import { CoachLang, LANGS, phoneLang } from '../../core/langs';
import { GameFx, bubble, confetti, reducedMotion } from '../../core/game-fx';
import { PEERS, SUDOKU_TEXT, SudokuLevel, UNITS, makePuzzle, todayKey } from '../../core/sudoku';
import { Icon } from '../../shared/icon';

type Mode = SudokuLevel | 'daily';
interface Snap {
  vals: number[];
  notes: number[];
  marks: number[];
}
const MODES: { id: Mode; label: string }[] = [
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
  { id: 'daily', label: '📅 Today' },
];
const SAVE = 'sudoku-game';
const PREFS = 'sudoku-prefs';
const DAILY = 'sudoku-daily';
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const empty = () => new Array<number>(81).fill(0);

/** Sudoku with notes, hints, undo, a daily puzzle, soft sounds and bubble effects; help in 7 languages. */
@Component({
  selector: 'app-sudoku-tool',
  imports: [Icon],
  template: `
    <div class="sd">
      <p class="tip" aria-live="polite" [attr.lang]="lang()">{{ tipText() }}</p>

      <div class="bar flex items-center justify-between text-[13px] text-muted">
        <span><b class="text-ink">{{ modeLabel() }}</b>@if (streak()) { · 🔥 {{ streak() }} }</span>
        <span>❌ {{ mistakes() }} · ⏱ {{ clock() }}</span>
      </div>

      <div #board class="board" role="grid" aria-label="Sudoku board" (keydown)="key($event)">
        @for (v of vals(); track $index; let i = $index) {
          <button
            type="button"
            class="c"
            [class.bx]="i % 9 === 2 || i % 9 === 5"
            [class.by]="(i >= 18 && i < 27) || (i >= 45 && i < 54)"
            [class.g]="given()[i]"
            [class.bad]="v && !given()[i] && v !== answer()[i]"
            [class.hin]="marks()[i]"
            [class.peer]="peer()[i]"
            [class.same]="v && v === selVal()"
            [class.sel]="i === sel()"
            [attr.aria-label]="label(i)"
            (click)="pick(i, $event)"
          >
            @if (v) {
              {{ v }}
            } @else if (notes()[i]) {
              <span class="ns">@for (d of digits; track d) { <i>{{ hasNote(i, d) ? d : '' }}</i> }</span>
            }
          </button>
        }
        @if (done()) {
          <div class="over">
            <div>
              <p class="text-3xl font-extrabold">{{ text()['win'] }}</p>
              <p class="mt-1 text-sm opacity-90">{{ winSub() }}</p>
              <button type="button" class="btn-primary mt-4" (click)="newGame(mode() === 'daily' ? 'medium' : mode())"><svg lucideIcon="refresh-ccw" [size]="16" /> New puzzle</button>
            </div>
          </div>
        }
      </div>

      <div class="pad">
        @for (d of digits; track d) {
          <button type="button" [class.out]="!left()[d]" [attr.aria-label]="(notesMode() ? 'Note ' : 'Number ') + d" (click)="input(d)">
            {{ d }}<small>{{ left()[d] || '' }}</small>
          </button>
        }
      </div>

      <div class="acts">
        <button type="button" class="btn-ghost" (click)="undo()" [disabled]="!history().length"><svg lucideIcon="rotate-ccw" [size]="16" /> Undo</button>
        <button type="button" class="btn-ghost" (click)="erase()"><svg lucideIcon="eraser" [size]="16" /> Erase</button>
        <button type="button" [class]="notesMode() ? 'btn-primary' : 'btn-ghost'" [attr.aria-pressed]="notesMode()" (click)="toggleNotes()"><svg lucideIcon="pencil" [size]="16" /> Notes</button>
        <button type="button" class="btn-ghost" (click)="hint()" [disabled]="done()"><svg lucideIcon="sparkles" [size]="16" /> Hint</button>
      </div>

      <div class="opts grid gap-2">
        <div class="seg" role="group" aria-label="Level">
          @for (m of modes; track m.id) {
            <button type="button" [attr.aria-pressed]="mode() === m.id" (click)="newGame(m.id)">{{ m.label }}</button>
          }
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-ghost shrink-0" (click)="newGame(mode())"><svg lucideIcon="refresh-ccw" [size]="16" /> New</button>
          <select class="input min-w-0 flex-1" aria-label="Help language" (change)="setLang($any($event.target).value)">
            @for (l of langs; track l.id) {
              <option [value]="l.id" [selected]="lang() === l.id" [attr.lang]="l.id">{{ l.own }}</option>
            }
          </select>
          <button type="button" class="btn-icon" (click)="toggleSound()" [attr.aria-pressed]="sound()" [attr.aria-label]="sound() ? 'Sound on' : 'Sound off'" [title]="sound() ? 'Sound on' : 'Sound off'">
            {{ sound() ? '🔊' : '🔇' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .sd { display: grid; gap: 8px; grid-template-areas: 'tip' 'bar' 'board' 'pad' 'acts' 'opts'; }
    @media (min-width: 720px) {
      .sd { column-gap: 16px; align-items: start; grid-template-columns: min(calc(100dvh - 190px), 540px, calc(100% - 276px)) minmax(260px, 1fr);
        grid-template-areas: 'bar tip' 'board pad' 'board acts' 'board opts'; grid-template-rows: auto auto auto 1fr; }
      .tip { height: auto !important; min-height: 96px; } .bar { align-self: end; }
      .sd .pad { grid-template-columns: repeat(3, 1fr); gap: 6px; } .sd .pad button { aspect-ratio: auto; height: 52px; }
      .sd .acts { grid-template-columns: repeat(2, 1fr); }
    }
    .tip { grid-area: tip; margin: 0; height: 5.4em; overflow: auto; padding: 8px 12px; border-radius: 12px; font-size: 13.5px; line-height: 1.35;
      background: color-mix(in oklab, var(--brand) 14%, transparent); }
    .bar { grid-area: bar; } .pad { grid-area: pad; } .acts { grid-area: acts; } .opts { grid-area: opts; }
    .board { grid-area: board; position: relative; container-type: inline-size; display: grid; grid-template-columns: repeat(9, 1fr); aspect-ratio: 1;
      border: 2px solid var(--ink); border-radius: 12px; overflow: hidden; background: var(--surface); user-select: none;
      box-shadow: 0 14px 34px -16px rgb(13 60 55 / .5); }
    .c { position: relative; border: 0; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); background: none; padding: 0;
      font-size: calc(100cqw / 9 * .56); font-weight: 600; color: var(--brand); line-height: 1; cursor: pointer; transition: background .15s; }
    .c:nth-child(9n) { border-right: 0; } .c.bx { border-right: 2px solid var(--ink); } .c.by { border-bottom: 2px solid var(--ink); }
    .c.g { color: var(--ink); font-weight: 700; } .c.hin { color: #d97706; }
    .c.peer { background: color-mix(in oklab, var(--brand) 9%, transparent); }
    .c.same { background: color-mix(in oklab, var(--brand) 24%, transparent); }
    .c.sel { background: rgb(250 204 21 / .5); }
    .c.bad { color: #dc2626; background: rgb(239 68 68 / .14); }
    .c:focus-visible { outline: 3px solid #facc15; outline-offset: -3px; z-index: 1; }
    .ns { position: absolute; inset: 2px; display: grid; grid-template-columns: repeat(3, 1fr); font-size: calc(100cqw / 9 * .26); font-weight: 600; color: var(--muted); }
    .ns i { font-style: normal; display: grid; place-items: center; }
    .over { position: absolute; inset: 0; z-index: 9; display: grid; place-items: center; text-align: center; color: #fff; background: rgb(8 28 25 / .62); backdrop-filter: blur(2px); animation: fade .4s; }
    @keyframes fade { from { opacity: 0; } }
    .pad { display: grid; grid-template-columns: repeat(9, 1fr); gap: 4px; }
    .pad button { position: relative; aspect-ratio: 3 / 4; max-height: 64px; border: 0; border-radius: 10px; background: var(--surface-2); color: var(--brand);
      font-size: 22px; font-weight: 700; transition: transform .1s; }
    .pad button:active { transform: scale(.9); }
    .pad small { position: absolute; right: 4px; top: 2px; font-size: 9px; color: var(--muted); }
    .pad .out { opacity: .35; }
    .acts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; } .acts button { padding-inline: 4px; }
    .seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 3px; padding: 3px; border-radius: 12px; background: var(--surface-2); }
    .seg button { border: 0; background: none; color: var(--ink); padding: 7px 2px; border-radius: 9px; font-size: 13px; font-weight: 600; }
    .seg button[aria-pressed='true'] { background: var(--surface); color: var(--brand); box-shadow: 0 1px 3px rgb(0 0 0 / .15); }
    @media (prefers-reduced-motion: reduce) { .c, .pad button, .over { transition: none; animation: none; } }
  `,
})
export class SudokuTool implements OnDestroy {
  protected readonly modes = MODES;
  protected readonly digits = DIGITS;
  protected readonly langs = LANGS;
  private readonly boardEl = viewChild.required<ElementRef<HTMLElement>>('board');
  private readonly fx = new GameFx();
  private timer?: ReturnType<typeof setInterval>;
  private day = 0;

  protected readonly mode = signal<Mode>('easy');
  protected readonly given = signal<number[]>(empty());
  protected readonly answer = signal<number[]>(empty());
  protected readonly vals = signal<number[]>(empty());
  protected readonly notes = signal<number[]>(empty());
  /** 1 = filled by Hint. */
  protected readonly marks = signal<number[]>(empty());
  protected readonly history = signal<Snap[]>([]);
  protected readonly sel = signal(-1);
  protected readonly notesMode = signal(false);
  protected readonly mistakes = signal(0);
  protected readonly secs = signal(0);
  protected readonly done = signal(false);
  protected readonly streak = signal(0);
  protected readonly lang = signal<CoachLang>('te');
  protected readonly sound = signal(true);
  protected readonly tip = signal<{ key: string; n?: number }>({ key: 'start' });

  protected readonly text = computed(() => SUDOKU_TEXT[this.lang()]);
  protected readonly tipText = computed(() => this.text()[this.tip().key].replace('{n}', String(this.tip().n ?? '')));
  protected readonly winSub = computed(() => this.text()['winSub'].replace('{t}', this.clock()).replace('{m}', String(this.mistakes())));
  protected readonly modeLabel = computed(() => MODES.find((m) => m.id === this.mode())!.label);
  protected readonly clock = computed(() => {
    const s = this.secs();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });
  protected readonly selVal = computed(() => (this.sel() < 0 ? 0 : this.vals()[this.sel()]));
  /** Squares sharing a row, column or box with the selected one. */
  protected readonly peer = computed(() => {
    const p = new Array<boolean>(81).fill(false);
    if (this.sel() >= 0) for (const j of PEERS[this.sel()]) p[j] = true;
    return p;
  });
  /** How many of each digit are still to be placed (correctly). */
  protected readonly left = computed(() => {
    const n = new Array<number>(10).fill(9);
    const a = this.answer();
    this.vals().forEach((v, i) => v && v === a[i] && n[v]--);
    return n;
  });

  constructor() {
    afterNextRender(() => {
      let resumed = false;
      try {
        const p = JSON.parse(localStorage.getItem(PREFS) ?? '{}');
        const chessLang = JSON.parse(localStorage.getItem('chess-prefs') ?? '{}').lang;
        const l = [p.lang, chessLang].find((x) => LANGS.some((y) => y.id === x));
        this.lang.set(l ?? phoneLang());
        if (p.sound === false) this.sound.set(false);
        if (MODES.some((m) => m.id === p.mode)) this.mode.set(p.mode);
        const s = JSON.parse(localStorage.getItem(SAVE) ?? 'null');
        if (s?.given?.length === 81) {
          this.mode.set(s.mode);
          this.day = s.day ?? 0;
          this.given.set(s.given);
          this.answer.set(s.answer);
          this.vals.set(s.vals);
          this.notes.set(s.notes);
          this.marks.set(s.marks ?? empty());
          this.mistakes.set(s.mistakes ?? 0);
          this.secs.set(s.secs ?? 0);
          this.tip.set({ key: 'resumed' });
          resumed = true;
        }
      } catch {}
      this.fx.on = this.sound();
      this.streak.set(this.countStreak());
      if (!resumed) this.newGame(this.mode());
      this.timer = setInterval(() => {
        if (this.done() || document.visibilityState !== 'visible') return;
        this.secs.update((s) => s + 1);
        if (this.secs() % 10 === 0) this.save();
      }, 1000);
      addEventListener('pagehide', this.onHide);
    });
  }

  ngOnDestroy() {
    clearInterval(this.timer);
    if (typeof removeEventListener !== 'undefined') removeEventListener('pagehide', this.onHide);
    this.save();
  }

  private readonly onHide = () => this.save();

  protected hasNote(i: number, d: number) {
    return (this.notes()[i] >> d) & 1;
  }

  protected label(i: number) {
    const v = this.vals()[i];
    return `Row ${Math.floor(i / 9) + 1}, column ${(i % 9) + 1}: ${v || 'empty'}${this.given()[i] ? ' (given)' : ''}`;
  }

  protected newGame(mode: Mode) {
    this.mode.set(mode);
    this.day = mode === 'daily' ? todayKey() : 0;
    const p = makePuzzle(mode === 'daily' ? 'medium' : mode, this.day || undefined);
    this.given.set(p.given);
    this.answer.set(p.answer);
    this.vals.set(p.given.slice());
    this.notes.set(empty());
    this.marks.set(empty());
    this.history.set([]);
    this.sel.set(-1);
    this.mistakes.set(0);
    this.secs.set(0);
    this.done.set(false);
    this.notesMode.set(false);
    this.tip.set({ key: mode === 'daily' ? 'daily' : 'start' });
    this.save();
    this.savePrefs();
  }

  private cell(i: number) {
    return this.boardEl().nativeElement.children[i] as HTMLElement | undefined;
  }

  private anim(i: number, frames: Keyframe[], opts: KeyframeAnimationOptions) {
    if (!reducedMotion()) this.cell(i)?.animate(frames, opts);
  }

  protected pick(i: number, e: MouseEvent) {
    this.fx.unlock();
    this.sel.set(i);
    this.fx.tik();
    const r = this.cell(i)!.getBoundingClientRect();
    const tap = e.detail > 0 && e.clientX;
    bubble(this.boardEl().nativeElement, tap ? e.clientX : r.left + r.width / 2, tap ? e.clientY : r.top + r.height / 2);
  }

  private snap() {
    this.history.update((h) => [...h.slice(-199), { vals: this.vals().slice(), notes: this.notes().slice(), marks: this.marks().slice() }]);
  }

  /** The selected square, if a number can go there. */
  private target(): number {
    const i = this.sel();
    if (this.done()) return -1;
    if (i < 0 || this.given()[i]) {
      this.tip.set({ key: 'pick' });
      return -1;
    }
    return i;
  }

  protected input(d: number) {
    this.fx.unlock();
    const i = this.target();
    if (i < 0) return;
    if (this.notesMode() && !this.vals()[i]) {
      this.snap();
      this.notes.update((n) => n.map((m, k) => (k === i ? m ^ (1 << d) : m)));
      this.fx.soft();
      this.save();
      return;
    }
    if (this.vals()[i] === d) return;
    this.snap();
    this.place(i, d, false);
  }

  private place(i: number, d: number, hinted: boolean) {
    const before = this.complete();
    this.vals.update((v) => v.map((x, k) => (k === i ? d : x)));
    this.marks.update((m) => m.map((x, k) => (k === i ? (hinted ? 1 : 0) : x)));
    const ok = d === this.answer()[i];
    // A right number clears that note from the square and its row, column and box.
    this.notes.update((n) => n.map((m, k) => (k === i ? 0 : ok && PEERS[i].includes(k) ? m & ~(1 << d) : m)));
    if (!ok) {
      this.mistakes.update((m) => m + 1);
      this.fx.thud();
      this.anim(i, [{ translate: '0' }, { translate: '-4px' }, { translate: '4px' }, { translate: '-3px' }, { translate: '0' }], { duration: 320 });
      this.tip.set({ key: 'mistake' });
      this.save();
      return;
    }
    this.anim(i, [{ transform: 'scale(.6)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out' });
    const fresh = this.complete().filter((u) => !before.includes(u));
    if (this.vals().every((v, k) => v === this.answer()[k])) return this.win();
    if (fresh.length) {
      this.fx.chime();
      for (const u of fresh)
        UNITS[u].forEach((k, n) =>
          this.anim(k, [{ boxShadow: 'inset 0 0 0 99px rgb(20 184 166 / 0)' }, { boxShadow: 'inset 0 0 0 99px rgb(20 184 166 / .45)' }, { boxShadow: 'inset 0 0 0 99px rgb(20 184 166 / 0)' }], {
            duration: 520,
            delay: n * 40,
          }),
        );
      this.tip.set({ key: 'line' });
    } else {
      this.fx.pop();
      if (hinted) this.tip.set({ key: 'hint', n: d });
      else if (this.tip().key !== 'start' && this.tip().key !== 'daily') this.tip.set({ key: this.notesMode() ? 'notes' : 'start' });
    }
    this.save();
  }

  /** Units (rows, columns, boxes) that are fully and correctly filled. */
  private complete(): number[] {
    const v = this.vals(), a = this.answer();
    return UNITS.map((u, n) => (u.every((k) => v[k] === a[k]) ? n : -1)).filter((n) => n >= 0);
  }

  private win() {
    this.done.set(true);
    this.sel.set(-1);
    this.fx.win();
    confetti(this.boardEl().nativeElement);
    this.tip.set({ key: 'win' });
    if (this.day) {
      try {
        const days: number[] = JSON.parse(localStorage.getItem(DAILY) ?? '[]');
        if (!days.includes(this.day)) localStorage.setItem(DAILY, JSON.stringify([...days, this.day].slice(-90)));
      } catch {}
      this.streak.set(this.countStreak());
    }
    this.save();
  }

  /** Days in a row the daily puzzle was solved, ending today or yesterday. */
  private countStreak(): number {
    try {
      const days = new Set<number>(JSON.parse(localStorage.getItem(DAILY) ?? '[]'));
      const d = new Date();
      if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);
      let n = 0;
      while (days.has(todayKey(d))) {
        n++;
        d.setDate(d.getDate() - 1);
      }
      return n;
    } catch {
      return 0;
    }
  }

  protected erase() {
    this.fx.unlock();
    const i = this.target();
    if (i < 0 || (!this.vals()[i] && !this.notes()[i])) return;
    this.snap();
    this.vals.update((v) => v.map((x, k) => (k === i ? 0 : x)));
    this.notes.update((n) => n.map((m, k) => (k === i ? 0 : m)));
    this.marks.update((m) => m.map((x, k) => (k === i ? 0 : x)));
    this.fx.soft();
    this.save();
  }

  protected undo() {
    const h = this.history();
    if (!h.length || this.done()) return;
    const s = h[h.length - 1];
    this.history.set(h.slice(0, -1));
    this.vals.set(s.vals);
    this.notes.set(s.notes);
    this.marks.set(s.marks);
    this.fx.soft();
    this.save();
  }

  protected toggleNotes() {
    this.fx.unlock();
    this.notesMode.update((n) => !n);
    this.tip.set({ key: this.notesMode() ? 'notes' : 'start' });
    this.fx.tik();
  }

  /** Fills the selected square (if it is empty or wrong), else the easiest empty square. */
  protected hint() {
    this.fx.unlock();
    if (this.done()) return;
    const v = this.vals(), a = this.answer(), g = this.given();
    let i = this.sel();
    if (i < 0 || g[i] || v[i] === a[i]) {
      let best = 10;
      i = -1;
      for (let k = 0; k < 81; k++) {
        if (v[k] === a[k]) continue;
        const used = new Set(PEERS[k].map((j) => v[j]));
        const n = DIGITS.filter((d) => !used.has(d)).length;
        if (n < best) [best, i] = [n, k];
      }
    }
    if (i < 0) return;
    this.snap();
    this.sel.set(i);
    this.place(i, a[i], true);
  }

  protected key(e: KeyboardEvent) {
    const d = +e.key;
    if (d >= 1 && d <= 9) this.input(d);
    else if (['Backspace', 'Delete', '0'].includes(e.key)) this.erase();
    else if (e.key === 'n' || e.key === 'N') this.toggleNotes();
    else {
      const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 };
      if (!(e.key in step)) return;
      const i = Math.min(80, Math.max(0, (this.sel() < 0 ? 40 : this.sel()) + step[e.key]));
      this.sel.set(i);
      this.cell(i)?.focus();
    }
    e.preventDefault();
  }

  protected setLang(l: CoachLang) {
    this.lang.set(l);
    this.savePrefs();
  }

  protected toggleSound() {
    this.sound.update((s) => !s);
    this.fx.on = this.sound();
    this.fx.unlock();
    this.fx.tik();
    this.savePrefs();
  }

  private savePrefs() {
    try {
      localStorage.setItem(PREFS, JSON.stringify({ mode: this.mode(), lang: this.lang(), sound: this.sound() }));
    } catch {}
  }

  private save() {
    try {
      if (this.done()) return localStorage.removeItem(SAVE);
      localStorage.setItem(
        SAVE,
        JSON.stringify({ mode: this.mode(), day: this.day, given: this.given(), answer: this.answer(), vals: this.vals(), notes: this.notes(), marks: this.marks(), mistakes: this.mistakes(), secs: this.secs() }),
      );
    } catch {}
  }
}
