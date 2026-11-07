import { Component, ElementRef, OnDestroy, afterNextRender, computed, signal, viewChild } from '@angular/core';
import { Chess, Move, Square } from 'chess.js';
import { COACH, CoachLang, PIECE_NAME, PIECE_SVG, PIECE_TIP, PIECE_VALUE, PieceType } from '../../core/chess';
import { Icon } from '../../shared/icon';

type Color = 'w' | 'b';
interface PieceView {
  id: number;
  t: PieceType;
  c: Color;
  sq: Square;
}
type Coach = { key: string; p?: PieceType; sq?: string; n?: number } | { tip: PieceType };

const FILES = 'abcdefgh';
const LEVELS = [
  { id: 'easy', label: 'Easy', depth: 1, noise: 60, random: 0.3 },
  { id: 'medium', label: 'Medium', depth: 2, noise: 15, random: 0 },
  { id: 'hard', label: 'Hard', depth: 3, noise: 0, random: 0 },
] as const;
type LevelId = (typeof LEVELS)[number]['id'];
const SAVE = 'chess-game';
const PREFS = 'chess-prefs';
/** Shortest time the computer "thinks", so its move is easy to follow. */
const MIN_THINK = 450;

const xy = (sq: string) => [FILES.indexOf(sq[0]), 8 - +sq[1]] as const;
const at = (x: number, y: number) => (FILES[x] + (8 - y)) as Square;

/** Play chess against the computer with a coach that explains each piece (Telugu / English). */
@Component({
  selector: 'app-chess-tool',
  imports: [Icon],
  template: `
    <div class="chess">
      <p class="coach" aria-live="polite">{{ coachText() }}</p>

      <div class="who top">
        <span><b>Computer</b> · {{ level().label }}</span>
        <span class="caps">@for (t of lost().w; track $index) { <svg viewBox="0 0 100 100" class="w"><path [attr.d]="svg[t].d" /></svg> }</span>
      </div>

      <div
        #board
        class="board"
        (pointerdown)="down($event)"
        (pointermove)="drag($event)"
        (pointerup)="up($event)"
        (pointercancel)="cancelDrag()"
      >
        @for (s of squares; track s.sq) {
          <button
            type="button"
            class="sq"
            [class.d]="s.dark"
            [class.last]="s.sq === last()?.from || s.sq === last()?.to"
            [class.sel]="s.sq === selected()"
            [class.hint]="s.sq === hint()?.to"
            [style.left.%]="s.x * 12.5"
            [style.top.%]="s.y * 12.5"
            [attr.aria-label]="label(s.sq)"
            (click)="keyPick(s.sq, $event)"
          >
            @if (s.y === 7) { <span class="co f">{{ s.sq[0] }}</span> }
            @if (s.x === 0) { <span class="co r">{{ s.sq[1] }}</span> }
          </button>
        }
        @for (d of targets(); track d.sq) {
          <span class="dot" [class.cap]="d.cap" [style.left.%]="d.x * 12.5" [style.top.%]="d.y * 12.5"></span>
        }
        @for (p of pieces(); track p.id) {
          <svg
            viewBox="-6 -6 112 112"
            class="pc"
            [class.w]="p.c === 'w'"
            [class.lift]="dragging()?.id === p.id"
            [class.chk]="p.t === 'k' && p.c === checked()"
            [style.transform]="place(p)"
            aria-hidden="true"
          >
            <path [attr.d]="svg[p.t].d" /><path class="det" [attr.d]="svg[p.t].det" />
          </svg>
        }
        @if (result(); as r) {
          <div class="over">
            <div>
              <p class="text-3xl font-extrabold">{{ r.title }}</p>
              <p>{{ r.sub }}</p>
              <button type="button" class="btn-primary mt-3" (click)="newGame()">Play again</button>
            </div>
          </div>
        }
      </div>

      <div class="who bottom">
        <span><b>You</b> · White</span>
        <span class="caps">@for (t of lost().b; track $index) { <svg viewBox="0 0 100 100"><path [attr.d]="svg[t].d" /></svg> }</span>
      </div>

      <div class="btns">
        <button type="button" class="btn-primary" (click)="askHint()" [disabled]="!myTurn()"><svg lucideIcon="sparkles" [size]="16" /> Hint</button>
        <button type="button" class="btn-ghost" (click)="undo()" [disabled]="!movePairs().length"><svg lucideIcon="rotate-ccw" [size]="16" /> Undo</button>
        <button type="button" class="btn-ghost" (click)="newGame()"><svg lucideIcon="refresh-ccw" [size]="16" /> New</button>
      </div>

      <div class="opts">
        <p class="font-bold text-brand">{{ status() }}</p>
        <div class="seg" role="group" aria-label="Computer level">
          @for (l of levels; track l.id) {
            <button type="button" [attr.aria-pressed]="level().id === l.id" (click)="setLevel(l.id)">{{ l.label }}</button>
          }
        </div>
        <div class="row">
          <div class="seg" role="group" aria-label="Coach language">
            <button type="button" [attr.aria-pressed]="lang() === 'te'" (click)="setLang('te')">తెలుగు</button>
            <button type="button" [attr.aria-pressed]="lang() === 'en'" (click)="setLang('en')">English</button>
          </div>
          <button type="button" class="btn-icon" (click)="toggleSound()" [attr.aria-pressed]="sound()" [attr.aria-label]="sound() ? 'Sound on' : 'Sound off'" [title]="sound() ? 'Sound on' : 'Sound off'">
            {{ sound() ? '🔊' : '🔇' }}
          </button>
        </div>
      </div>

      <ol class="moves" aria-label="Moves">
        @for (m of movePairs(); track $index) {
          <li><span>{{ $index + 1 }}.</span><span>{{ m[0] }}</span><span>{{ m[1] }}</span></li>
        }
      </ol>
    </div>
  `,
  styles: `
    .chess { --l: #e4efec; --d: #6fa79c; --wp: #fdfdfb; --we: #23403b; --bp: #1f2e2c; --be: #0a1312; --bd: #9cc0b8;
      display: grid; gap: 8px; grid-template-areas: 'coach' 'top' 'board' 'bottom' 'btns' 'opts' 'moves'; }
    :host-context(.dark) .chess { --l: #a9c7c0; --d: #3f7a6f; }
    @media (min-width: 720px) {
      .chess { column-gap: 16px; align-items: start;
        grid-template-columns: min(calc(100dvh - 190px), 540px, calc(100% - 276px)) minmax(260px, 1fr);
        grid-template-areas: 'top coach' 'board btns' 'board opts' 'board moves' 'bottom .'; grid-template-rows: auto auto auto 1fr auto; }
      .top { align-self: end; }
      .coach { height: auto !important; min-height: 96px; }
      .moves { max-height: 180px; }
    }
    .coach { grid-area: coach; margin: 0; height: 5.4em; overflow: auto; padding: 8px 12px; border-radius: 12px; font-size: 13.5px; line-height: 1.35;
      background: color-mix(in oklab, var(--brand) 14%, transparent); }
    .who { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--muted); min-height: 22px; }
    .who b { color: var(--ink); }
    .top { grid-area: top; } .bottom { grid-area: bottom; }
    .caps { display: flex; } .caps svg { width: 16px; height: 16px; margin-left: -4px; fill: var(--bp); } .caps svg.w { fill: var(--wp); stroke: var(--we); stroke-width: 5; }
    .board { grid-area: board; position: relative; width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; touch-action: none; user-select: none;
      box-shadow: 0 14px 34px -16px rgb(13 60 55 / .5); }
    .sq { position: absolute; width: 12.5%; height: 12.5%; background: var(--l); border: 0; padding: 0; cursor: pointer; }
    .sq.d { background: var(--d); }
    .sq.last { box-shadow: inset 0 0 0 999px rgb(250 204 21 / .35); }
    .sq.sel { box-shadow: inset 0 0 0 999px rgb(250 204 21 / .6); }
    .sq.hint { animation: hint 1s ease-in-out infinite; }
    @keyframes hint { 50% { box-shadow: inset 0 0 0 6px var(--brand); } }
    .sq:focus-visible { outline: 3px solid #facc15; outline-offset: -3px; }
    .co { position: absolute; font-size: 10px; font-weight: 600; color: var(--d); pointer-events: none; }
    .sq.d .co { color: var(--l); } .co.f { right: 3px; bottom: 1px; } .co.r { left: 3px; top: 1px; }
    .dot { position: absolute; width: 12.5%; height: 12.5%; display: grid; place-items: center; pointer-events: none; }
    .dot::before { content: ''; width: 28%; height: 28%; border-radius: 50%; background: rgb(15 40 36 / .3); animation: pop .15s ease-out; }
    .dot.cap::before { width: 82%; height: 82%; background: none; border: 5px solid rgb(15 40 36 / .3); }
    @keyframes pop { from { transform: scale(0); } }
    .pc { position: absolute; left: 0; top: 0; width: 12.5%; height: 12.5%; pointer-events: none; z-index: 2;
      transition: transform .26s cubic-bezier(.2, .8, .2, 1); fill: var(--bp); stroke: var(--be); stroke-width: 3; stroke-linejoin: round;
      filter: drop-shadow(0 2px 2px rgb(0 0 0 / .3)); }
    .pc.w { fill: var(--wp); stroke: var(--we); }
    .pc .det { fill: none; stroke: var(--bd); stroke-linecap: round; } .pc.w .det { stroke: var(--we); }
    .pc.lift { transition: none; z-index: 5; filter: drop-shadow(0 10px 8px rgb(0 0 0 / .35)); }
    .pc.chk { animation: chk .45s ease-in-out 2; }
    .pc.chk path:first-child { stroke: #ef4444; stroke-width: 6; }
    @keyframes chk { 25% { translate: -3px 0; } 75% { translate: 3px 0; } }
    .over { position: absolute; inset: 0; z-index: 9; display: grid; place-items: center; text-align: center; color: #fff; background: rgb(8 28 25 / .6); backdrop-filter: blur(2px); animation: fade .3s; }
    @keyframes fade { from { opacity: 0; } }
    .btns { grid-area: btns; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .opts { grid-area: opts; display: grid; gap: 8px; }
    .row { display: flex; gap: 8px; } .row .seg { flex: 1; }
    .seg { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 3px; padding: 3px; border-radius: 12px; background: var(--surface-2); }
    .seg button { border: 0; background: none; color: var(--ink); padding: 7px 4px; border-radius: 9px; font-size: 13px; font-weight: 600; }
    .seg button[aria-pressed='true'] { background: var(--surface); color: var(--brand); box-shadow: 0 1px 3px rgb(0 0 0 / .15); }
    .moves { grid-area: moves; margin: 0; padding: 0; list-style: none; max-height: 120px; overflow: auto; font-size: 13px; font-variant-numeric: tabular-nums; }
    .moves li { display: grid; grid-template-columns: 32px 1fr 1fr; } .moves li span:first-child { color: var(--muted); }
    @media (prefers-reduced-motion: reduce) { .pc, .dot::before, .sq.hint, .pc.chk { transition: none; animation: none; } }
  `,
})
export class ChessTool implements OnDestroy {
  protected readonly svg = PIECE_SVG;
  protected readonly levels = LEVELS;
  protected readonly squares = Array.from({ length: 64 }, (_, i) => {
    const x = i % 8, y = Math.floor(i / 8);
    return { x, y, sq: at(x, y), dark: (x + y) % 2 === 1 };
  });

  private readonly chess = new Chess();
  private readonly boardEl = viewChild.required<ElementRef<HTMLElement>>('board');
  private nextId = 0;
  private worker?: Worker;
  private reqId = 0;
  private audio?: AudioContext;
  private dragState?: { from: Square; id: number; rect: DOMRect; x0: number; y0: number; moved: boolean; touch: boolean };

  /** Bumped after every change to the game so computed views refresh. */
  private readonly ver = signal(0);
  protected readonly pieces = signal<PieceView[]>(this.fromBoard());
  /** Piece lists before each move, so Undo slides pieces back. */
  protected readonly history = signal<PieceView[][]>([]);
  protected readonly selected = signal<Square | null>(null);
  protected readonly last = signal<{ from: string; to: string } | null>(null);
  protected readonly hint = signal<{ from: string; to: string } | null>(null);
  protected readonly dragging = signal<{ id: number; x: number; y: number } | null>(null);
  protected readonly busy = signal(false);
  protected readonly levelId = signal<LevelId>('easy');
  protected readonly lang = signal<CoachLang>('te');
  protected readonly sound = signal(true);
  protected readonly coach = signal<Coach>({ key: 'start' });

  protected readonly level = computed(() => LEVELS.find((l) => l.id === this.levelId())!);
  protected readonly myTurn = computed(() => (this.ver(), !this.busy() && this.chess.turn() === 'w' && !this.chess.isGameOver()));
  protected readonly checked = computed<Color | null>(() => (this.ver(), this.chess.inCheck() ? this.chess.turn() : null));
  protected readonly movePairs = computed(() => {
    this.ver();
    const h = this.chess.history();
    return Array.from({ length: Math.ceil(h.length / 2) }, (_, i) => [h[2 * i], h[2 * i + 1] ?? '']);
  });
  /** Pieces each side has lost, biggest first. */
  protected readonly lost = computed(() => {
    const start: Record<string, number> = { q: 1, r: 2, b: 2, n: 2, p: 8 };
    const have = { w: { ...start }, b: { ...start } };
    for (const p of this.pieces()) if (p.t !== 'k') have[p.c][p.t]--;
    const list = (c: Color) => (Object.keys(start) as PieceType[]).flatMap((t) => Array<PieceType>(Math.max(0, have[c][t])).fill(t));
    return { w: list('w'), b: list('b') };
  });
  protected readonly targets = computed(() => {
    const s = this.selected();
    this.ver();
    if (!s) return [];
    return this.chess.moves({ square: s, verbose: true }).map((m) => {
      const [x, y] = xy(m.to);
      return { sq: m.to, x, y, cap: !!m.captured };
    });
  });
  protected readonly result = computed(() => {
    this.ver();
    const c = this.chess, t = COACH[this.lang()];
    if (!c.isGameOver()) return null;
    if (c.isCheckmate()) return c.turn() === 'b' ? { title: t['win'], sub: t['winSub'] } : { title: t['lose'], sub: t['loseSub'] };
    return { title: t['draw'], sub: c.isStalemate() ? t['stalemate'] : t['drawSub'] };
  });
  protected readonly status = computed(() => this.result()?.title ?? COACH[this.lang()][this.busy() ? 'thinking' : 'yourTurn']);
  protected readonly coachText = computed(() => {
    const c = this.coach(), lang = this.lang();
    if ('tip' in c) return `${PIECE_NAME[lang][c.tip]}: ${PIECE_TIP[lang][c.tip]}`;
    return COACH[lang][c.key]
      .replace('{p}', c.p ? PIECE_NAME[lang][c.p].replace(/ \(.*\)/, '') : '')
      .replace('{sq}', c.sq ?? '')
      .replace('{n}', String(c.n ?? ''));
  });

  constructor() {
    afterNextRender(() => {
      try {
        const p = JSON.parse(localStorage.getItem(PREFS) ?? '{}');
        if (LEVELS.some((l) => l.id === p.level)) this.levelId.set(p.level);
        if (p.lang === 'en' || p.lang === 'te') this.lang.set(p.lang);
        if (p.sound === false) this.sound.set(false);
        const pgn = localStorage.getItem(SAVE);
        if (pgn) {
          this.chess.loadPgn(pgn);
          this.pieces.set(this.fromBoard());
          const h = this.chess.history({ verbose: true }).at(-1);
          this.last.set(h ? { from: h.from, to: h.to } : null);
          this.coach.set({ key: 'resumed' });
          this.ver.update((v) => v + 1);
        }
      } catch {
        this.chess.reset();
      }
      if (typeof Worker !== 'undefined') {
        this.worker = new Worker(new URL('./chess.worker', import.meta.url), { type: 'module' });
        this.worker.onmessage = (e) => this.onEngine(e.data);
      }
      if (this.chess.turn() === 'b' && !this.chess.isGameOver()) this.computerMove();
    });
  }

  ngOnDestroy() {
    this.worker?.terminate();
    this.audio?.close();
  }

  protected label(sq: Square) {
    const p = this.chess.get(sq);
    return p ? `${sq} ${p.color === 'w' ? 'white' : 'black'} ${PIECE_NAME.en[p.type]}` : sq;
  }

  protected place(p: PieceView) {
    const d = this.dragging();
    if (d?.id === p.id) return `translate(${d.x * 100}%, ${d.y * 100}%) scale(1.15)`;
    const [x, y] = xy(p.sq);
    return `translate(${x * 100}%, ${y * 100}%)`;
  }

  // --- input: tap a piece then a square, or drag it ---

  private squareAt(e: PointerEvent, rect: DOMRect): Square | null {
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 8), y = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
    return x >= 0 && x < 8 && y >= 0 && y < 8 ? at(x, y) : null;
  }

  protected down(e: PointerEvent) {
    if (e.button > 0 || !this.myTurn()) return;
    const rect = this.boardEl().nativeElement.getBoundingClientRect();
    const sq = this.squareAt(e, rect);
    if (sq) this.pick(sq, e, rect);
  }

  /** Keyboard users press Enter/Space on a square (pointer taps are handled in down()). */
  protected keyPick(sq: Square, e: MouseEvent) {
    if (e.detail === 0 && this.myTurn()) this.pick(sq);
  }

  private pick(sq: Square, e?: PointerEvent, rect?: DOMRect) {
    const p = this.chess.get(sq);
    const sel = this.selected();
    if (sel && sel !== sq && p?.color !== 'w') {
      this.tryMove(sel, sq);
      return;
    }
    if (p?.color !== 'w') return this.selected.set(null);
    this.hint.set(null);
    this.selected.set(sq);
    this.coach.set({ tip: p.type });
    this.unlockAudio();
    if (e && rect) {
      const id = this.pieces().find((x) => x.sq === sq)!.id;
      this.dragState = { from: sq, id, rect, x0: e.clientX, y0: e.clientY, moved: false, touch: e.pointerType === 'touch' };
      this.boardEl().nativeElement.setPointerCapture(e.pointerId);
    }
  }

  protected drag(e: PointerEvent) {
    const d = this.dragState;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6) return;
    d.moved = true;
    // On touch the piece rides above the finger so it stays visible.
    const lift = d.touch ? 0.7 : 0;
    this.dragging.set({ id: d.id, x: ((e.clientX - d.rect.left) / d.rect.width) * 8 - 0.5, y: ((e.clientY - d.rect.top) / d.rect.height) * 8 - 0.5 - lift });
  }

  protected up(e: PointerEvent) {
    const d = this.dragState;
    this.dragState = undefined;
    if (!d?.moved) return;
    const to = this.squareAt(e, d.rect);
    // Let the dragged piece land where it was dropped instead of sliding back first.
    if (to && to !== d.from && this.tryMove(d.from, to)) {
      requestAnimationFrame(() => this.dragging.set(null));
      return;
    }
    this.dragging.set(null);
  }

  protected cancelDrag() {
    this.dragState = undefined;
    this.dragging.set(null);
  }

  // --- moves ---

  private tryMove(from: Square, to: Square): boolean {
    const p = this.chess.get(from);
    const promo = p?.type === 'p' && (to[1] === '8' || to[1] === '1') ? 'q' : undefined;
    let m: Move;
    try {
      m = this.chess.move({ from, to, promotion: promo });
    } catch {
      this.selected.set(null);
      return false;
    }
    this.apply(m, true);
    if (!this.chess.isGameOver()) this.computerMove();
    return true;
  }

  private apply(m: Move, mine: boolean) {
    const before = this.pieces();
    this.history.update((h) => [...h, before]);
    const capSq = m.isEnPassant() ? ((m.to[0] + m.from[1]) as Square) : m.to;
    let next = before.filter((p) => !(m.captured && p.sq === capSq));
    next = next.map((p) => (p.sq === m.from ? { ...p, sq: m.to, t: (m.promotion as PieceType) ?? p.t } : p));
    if (m.isKingsideCastle() || m.isQueensideCastle()) {
      const r = m.from[1];
      const [rf, rt] = m.isKingsideCastle() ? ['h' + r, 'f' + r] : ['a' + r, 'd' + r];
      next = next.map((p) => (p.sq === rf ? { ...p, sq: rt as Square } : p));
    }
    this.pieces.set(next);
    this.selected.set(null);
    this.hint.set(null);
    this.last.set({ from: m.from, to: m.to });
    this.ver.update((v) => v + 1);
    this.save();
    this.feedback(!!m.captured);

    if (m.isKingsideCastle() || m.isQueensideCastle()) this.coach.set({ key: 'castle' });
    else if (m.promotion) this.coach.set({ key: 'promote' });
    else if (m.captured) this.coach.set(mine ? { key: 'youTook', p: m.captured, n: PIECE_VALUE[m.captured] } : { key: 'theyTook', p: m.captured });
    else if (!mine && !('tip' in this.coach())) this.coach.set({ key: 'start' });
    if (this.chess.inCheck() && !this.chess.isGameOver()) this.coach.set({ key: mine ? 'youCheck' : 'inCheck' });
  }

  private computerMove() {
    if (!this.worker) return;
    const l = this.level();
    this.busy.set(true);
    this.worker.postMessage({ id: ++this.reqId, kind: 'move', t0: Date.now(), fen: this.chess.fen(), depth: l.depth, noise: l.noise, random: l.random });
  }

  protected askHint() {
    if (!this.worker || !this.myTurn()) return;
    this.busy.set(true);
    this.worker.postMessage({ id: ++this.reqId, kind: 'hint', t0: Date.now(), fen: this.chess.fen(), depth: 2, noise: 0, random: 0 });
  }

  private onEngine(r: { id: number; kind: 'move' | 'hint'; t0: number; from: Square; to: Square; promotion?: string }) {
    if (r.id !== this.reqId) return; // answer for a game that was undone or restarted
    setTimeout(() => {
      if (r.id !== this.reqId) return;
      this.busy.set(false);
      if (r.kind === 'hint') {
        const p = this.chess.get(r.from)!;
        const cap = !!this.chess.get(r.to);
        this.selected.set(r.from);
        this.hint.set({ from: r.from, to: r.to });
        this.coach.set({ key: cap ? 'hintTake' : 'hint', p: p.type, sq: r.to });
        return;
      }
      this.apply(this.chess.move({ from: r.from, to: r.to, promotion: r.promotion }), false);
    }, r.kind === 'move' ? Math.max(0, MIN_THINK - (Date.now() - r.t0)) : 0);
  }

  protected undo() {
    const h = this.history();
    if (!this.chess.history().length) return;
    this.reqId++;
    this.busy.set(false);
    // Take back the computer's reply too, so it is the player's turn again.
    const steps = this.chess.turn() === 'w' && this.chess.history().length >= 2 ? 2 : 1;
    for (let i = 0; i < steps; i++) this.chess.undo();
    // A game restored from storage has no saved piece lists, so rebuild from the board then.
    this.pieces.set(h.length >= steps ? h[h.length - steps] : this.fromBoard());
    this.history.set(h.slice(0, Math.max(0, h.length - steps)));
    const prev = this.chess.history({ verbose: true }).at(-1);
    this.last.set(prev ? { from: prev.from, to: prev.to } : null);
    this.selected.set(null);
    this.hint.set(null);
    this.coach.set({ key: 'undo' });
    this.ver.update((v) => v + 1);
    this.save();
    if (this.chess.turn() === 'b') this.computerMove();
  }

  protected newGame() {
    this.reqId++;
    this.busy.set(false);
    this.chess.reset();
    this.pieces.set(this.fromBoard());
    this.history.set([]);
    this.last.set(null);
    this.selected.set(null);
    this.hint.set(null);
    this.coach.set({ key: 'start' });
    this.ver.update((v) => v + 1);
    this.save();
  }

  private fromBoard(): PieceView[] {
    return this.chess.board().flat().filter((p) => !!p).map((p) => ({ id: this.nextId++, t: p.type, c: p.color, sq: p.square }));
  }

  // --- settings, saving, sound ---

  protected setLevel(id: LevelId) {
    this.levelId.set(id);
    this.savePrefs();
  }

  protected setLang(l: CoachLang) {
    this.lang.set(l);
    this.savePrefs();
  }

  protected toggleSound() {
    this.sound.update((s) => !s);
    this.savePrefs();
  }

  private savePrefs() {
    try {
      localStorage.setItem(PREFS, JSON.stringify({ level: this.levelId(), lang: this.lang(), sound: this.sound() }));
    } catch {}
  }

  private save() {
    try {
      if (this.chess.history().length && !this.chess.isGameOver()) localStorage.setItem(SAVE, this.chess.pgn());
      else localStorage.removeItem(SAVE);
    } catch {}
  }

  private unlockAudio() {
    if (!this.audio && this.sound() && typeof AudioContext !== 'undefined') this.audio = new AudioContext();
  }

  /** A short wooden "tok" (lower for captures) and a light buzz on phones. */
  private feedback(capture: boolean) {
    if (!this.sound()) return;
    navigator.vibrate?.(capture ? 30 : 12);
    const ctx = this.audio;
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
    const src = ctx.createBufferSource();
    const band = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = buf;
    band.type = 'bandpass';
    band.frequency.value = capture ? 700 : 1400;
    band.Q.value = 1.2;
    gain.gain.value = 0.9;
    src.connect(band).connect(gain).connect(ctx.destination);
    src.start();
  }
}
