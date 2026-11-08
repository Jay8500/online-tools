import { Component, ElementRef, OnDestroy, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { Chess, Move, Square } from 'chess.js';
import { COACH, CoachLang, LANGS, PIECE_NAME, PIECE_SVG, PIECE_TIP, PIECE_VALUE, PieceType, phoneLang } from '../../core/chess';
import { Icon } from '../../shared/icon';
import { DialogService } from '../../core/dialog.service';
import { ToastService } from '../../core/toast.service';
import { Router } from '@angular/router';

type Color = 'w' | 'b';
interface PieceView {
  id: number;
  t: PieceType;
  c: Color;
  sq: Square;
}
type Coach = { key: string; p?: PieceType; sq?: string; n?: number; who?: string } | { tip: PieceType };
interface RoomView {
  id: string;
  status: 'waiting' | 'playing' | 'over' | 'cancelled';
  me: Color | null;
  host: Color;
  players: Record<Color, { name: string; away: number } | null>;
  moves: string[];
  result: { kind: 'mate' | 'resign' | 'draw' | 'stalemate' | 'left' | 'time'; winner?: Color } | null;
  drawOffer: Color | null;
  events: { n: number; by: Color; e: string }[];
  game: number;
  rev: number;
  /** ms left per player when the server answered; `run` = whose clock is ticking */
  clock: { w: number; b: number; run: Color | null } | null;
}

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

/** Play chess against the computer with a coach that explains each piece in 7 languages (Telugu, English, Hindi, Tamil, Kannada, Marathi, Odia). */
@Component({
  selector: 'app-chess-tool',
  imports: [Icon],
  template: `
    <div class="chess">
      <p class="coach" aria-live="polite" [attr.lang]="lang()">{{ coachText() }}</p>

      <div class="who top">
        <span [style.background]="activeSide() === topSide() ? 'color-mix(in oklab, var(--brand) 16%, transparent)' : null" style="border-radius:999px;padding:2px 8px;margin-left:-8px;transition:background .3s">
          @if (mode() === 'cpu') { <b>Computer</b> · {{ level().label }} } @else { <b>{{ nameOf(topSide()) }}</b>@if (activeSide() === topSide()) { <i class="ml-1.5 inline-block size-2 rounded-full bg-brand align-middle ring-2 ring-brand/25"></i> } }
          @if (showClock()) {
            <b class="ml-2 rounded-md px-1.5 py-0.5 font-mono text-xs" [style.background]="clockLow(topSide()) ? '#dc2626' : clockRun() === topSide() ? 'var(--brand)' : 'var(--surface-2)'" [style.color]="clockLow(topSide()) || clockRun() === topSide() ? '#fff' : 'var(--ink)'">⏱ {{ clockText(topSide()) }}</b>
          }
        </span>
        <span class="caps" style="margin-right:auto;margin-left:10px;align-items:center" [attr.aria-label]="'Captured: ' + lost()[bottomSide()].length">@for (t of lost()[bottomSide()]; track $index) { <svg viewBox="0 0 100 100" [class.w]="bottomSide() === 'w'"><path [attr.d]="svg[t].d" /></svg> }@if (lead(topSide()) > 0) { <small style="margin-left:4px;font-weight:700;color:var(--ink)">+{{ lead(topSide()) }}</small> }</span>
        @if (!room() && !joining()) {
          <button type="button" class="btn-primary min-h-8 shrink-0 px-3 text-xs" [disabled]="waitingNet()" (click)="quickInvite()" aria-label="Invite a friend to play online">👥 Invite</button>
        }
      </div>

      <div
        #board
        class="board"
        (pointerdown)="down($event)"
        (pointermove)="drag($event)"
        (pointerup)="up($event)"
        (pointercancel)="cancelDrag()"
      >
        @for (s of squares(); track s.sq) {
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
        @if (reaction(); as rc) {
          <div class="animate-fade-up" style="position:absolute;left:50%;top:38%;transform:translateX(-50%);z-index:8;font-size:64px;pointer-events:none;filter:drop-shadow(0 6px 10px rgb(0 0 0/.35))">{{ rc.e }}</div>
        }
        @if (mode() === 'online' && room()?.status === 'waiting') {
          <div class="over">
            <div class="grid justify-items-center gap-2 px-4">
              <p class="text-lg font-extrabold">Waiting for your friend…</p>
              @if (qr()) { <img [src]="qr()" alt="QR code to join this game" width="150" height="150" style="border-radius:12px;background:#fff;padding:5px" /> }
              <p class="text-xs opacity-90">They tap the link or scan this — the game starts by itself.</p>
              <div class="flex flex-wrap justify-center gap-2">
                <button type="button" class="btn-primary" (click)="shareInvite()">📤 Share link</button>
                <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="copyInvite()">Copy</button>
                <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="cancelInvite()">Cancel</button>
              </div>
            </div>
          </div>
        }
        @if (joining()) {
          <div class="over"><p class="text-lg font-extrabold">♟️ Joining {{ joining() }}’s game…</p></div>
        }
        @if (result(); as r) {
          <div class="over">
            <div>
              <p class="text-3xl font-extrabold">{{ r.title }}</p>
              <p>{{ r.sub }}</p>
              @if (mode() === 'online') {
                <div class="mt-3 flex justify-center gap-2">
                  <button type="button" class="btn-primary" (click)="act('rematch')">Rematch</button>
                  <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="leaveOnline()">Leave</button>
                </div>
              } @else {
                <button type="button" class="btn-primary mt-3" (click)="newGame()">Play again</button>
              }
            </div>
          </div>
        }
      </div>

      <div class="who bottom">
        <span [style.background]="activeSide() === bottomSide() ? 'color-mix(in oklab, var(--brand) 16%, transparent)' : null" style="border-radius:999px;padding:2px 8px;margin-left:-8px;transition:background .3s">
          @if (mode() === 'cpu') { <b>You</b> · White } @else { <b>{{ nameOf(bottomSide()) }}</b>@if (activeSide() === bottomSide()) { <i class="ml-1.5 inline-block size-2 rounded-full bg-brand align-middle ring-2 ring-brand/25"></i> } }
          @if (showClock()) {
            <b class="ml-2 rounded-md px-1.5 py-0.5 font-mono text-xs" [style.background]="clockLow(bottomSide()) ? '#dc2626' : clockRun() === bottomSide() ? 'var(--brand)' : 'var(--surface-2)'" [style.color]="clockLow(bottomSide()) || clockRun() === bottomSide() ? '#fff' : 'var(--ink)'">⏱ {{ clockText(bottomSide()) }}</b>
          }
        </span>
        <span class="caps" style="margin-right:auto;margin-left:10px;align-items:center" [attr.aria-label]="'Captured: ' + lost()[topSide()].length">@for (t of lost()[topSide()]; track $index) { <svg viewBox="0 0 100 100" [class.w]="topSide() === 'w'"><path [attr.d]="svg[t].d" /></svg> }@if (lead(bottomSide()) > 0) { <small style="margin-left:4px;font-weight:700;color:var(--ink)">+{{ lead(bottomSide()) }}</small> }</span>
      </div>

      <div class="btns">
        @if (mode() === 'online') {
          <button type="button" class="btn-ghost" (click)="resign()" [disabled]="room()?.status !== 'playing'">🏳️ Resign</button>
          <button type="button" [class]="room()?.drawOffer && room()?.drawOffer !== room()?.me ? 'btn-primary' : 'btn-ghost'" (click)="act('draw')" [disabled]="room()?.status !== 'playing' || room()?.drawOffer === room()?.me">
            🤝 {{ room()?.drawOffer && room()?.drawOffer !== room()?.me ? 'Accept draw' : room()?.drawOffer === room()?.me ? 'Offered' : 'Draw' }}
          </button>
          <button type="button" class="btn-ghost" (click)="leaveOnline(true)">Leave</button>
        } @else {
          <button type="button" class="btn-primary" (click)="askHint()" [disabled]="!myTurn()"><svg lucideIcon="sparkles" [size]="16" /> Hint</button>
          <button type="button" class="btn-ghost" (click)="undo()" [disabled]="!movePairs().length"><svg lucideIcon="rotate-ccw" [size]="16" /> Undo</button>
          <button type="button" class="btn-ghost" (click)="newGame()"><svg lucideIcon="refresh-ccw" [size]="16" /> New</button>
        }
      </div>

      <div class="opts">
        <p class="font-bold text-brand">{{ status() }}</p>
        <div class="seg" role="group" aria-label="Play against">
          <button type="button" [attr.aria-pressed]="mode() === 'cpu'" (click)="setMode('cpu')">🤖 Computer</button>
          <button type="button" [attr.aria-pressed]="mode() === 'local'" (click)="setMode('local')">👥 Friend</button>
          <button type="button" [attr.aria-pressed]="mode() === 'online'" (click)="setMode('online')">🔗 Online</button>
        </div>
        @if (mode() === 'local') {
          <div class="seg" role="group" aria-label="Chess clock">
            @for (m of timers; track m) { <button type="button" [attr.aria-pressed]="activeMins() === m" (click)="setMins(m)">{{ m ? '⏱ ' + m + ' min' : 'No timer' }}</button> }
          </div>
        }
        @if (mode() === 'online') {
          <div class="card grid gap-2 p-3 text-sm">
            @if (onlineErr()) { <p class="font-semibold text-rose-600" role="alert">{{ onlineErr() }}</p> }
            @if (joinFor(); as host) {
              <p><b>{{ host }}</b> invited you to a game of chess ♟️</p>
              <input class="input" maxlength="20" placeholder="Your name" aria-label="Your name" [value]="myName()" (input)="myName.set($any($event.target).value)" />
              <button type="button" class="btn-primary" [disabled]="waitingNet()" (click)="join()">Join game</button>
            } @else if (!room()) {
              <p>Play with a friend on their own phone. Send them a link or let them scan the QR — no sign-up.</p>
              <input class="input" maxlength="20" placeholder="Your name" aria-label="Your name" [value]="myName()" (input)="myName.set($any($event.target).value)" />
              <div class="seg" role="group" aria-label="Chess clock">
            @for (m of timers; track m) { <button type="button" [attr.aria-pressed]="activeMins() === m" (click)="setMins(m)">{{ m ? '⏱ ' + m + ' min' : 'No timer' }}</button> }
          </div>
              <button type="button" class="btn-primary" [disabled]="waitingNet()" (click)="create()">Create invite</button>
            } @else if (room()!.status === 'waiting') {
              <p class="break-all text-xs text-muted">Invite link: {{ inviteUrl() }}</p>
            } @else {
              @if (oppAway() > 45 && room()!.status === 'playing') {
                <p>⏳ {{ nameOf(oppSide()) }} seems away…</p>
                @if (oppAway() > 90) { <button type="button" class="btn-ghost" (click)="act('claim')">Claim the win</button> }
              }
              @if (room()!.status === 'playing') {
                <div class="flex justify-between gap-1" role="group" aria-label="Send a reaction">
                  @for (e of emojis; track e) { <button type="button" class="btn-ghost px-2 text-lg" [attr.aria-label]="'Send ' + e" (click)="react(e)">{{ e }}</button> }
                </div>
              }
            }
          </div>
        }
        @if (mode() === 'cpu') {
          <div class="seg" role="group" aria-label="Computer level">
            @for (l of levels; track l.id) {
              <button type="button" [attr.aria-pressed]="level().id === l.id" (click)="setLevel(l.id)">{{ l.label }}</button>
            }
          </div>
          <div class="seg" role="group" aria-label="Chess clock">
            @for (m of timers; track m) { <button type="button" [attr.aria-pressed]="activeMins() === m" (click)="setMins(m)">{{ m ? '⏱ ' + m + ' min' : 'No timer' }}</button> }
          </div>
        }
        <div class="row">
          <select class="input min-w-0 flex-1" aria-label="Coach language" (change)="setLang($any($event.target).value)">
            @for (l of langs; track l.id) {
              <option [value]="l.id" [selected]="lang() === l.id" [attr.lang]="l.id">{{ l.own }}</option>
            }
          </select>
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
    .caps { display: flex; } .caps svg { width: 19px; height: 19px; margin-left: -5px; fill: var(--bp); } .caps svg.w { fill: var(--wp); stroke: var(--we); stroke-width: 5; }
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
  /** 'cpu' = against the computer; 'local' = two players on one phone, the board turns to whoever moves. */
  protected readonly mode = signal<'cpu' | 'local' | 'online'>('cpu');
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  /** Online game with a friend: the room as the server sees it (see netlify/functions/chess.mts). */
  protected readonly room = signal<RoomView | null>(null);
  private roomToken = '';
  private roomId = '';
  private gameNo = 0;
  private lastEv = 0;
  private turnSince = 0;
  private pollTimer?: ReturnType<typeof setTimeout>;
  private reactTimer?: ReturnType<typeof setTimeout>;
  protected readonly myName = signal('');
  protected readonly qr = signal('');
  protected readonly onlineErr = signal('');
  protected readonly waitingNet = signal(false);
  /** Someone opened an invite link: the host's name until they join. */
  protected readonly joinFor = signal<string | null>(null);
  /** Opening an invite link: the host's name while this phone joins by itself. */
  protected readonly joining = signal<string | null>(null);
  private joinId = '';
  protected readonly reaction = signal<{ e: string } | null>(null);
  protected readonly emojis = ['👍', '😮', '😂', '👏', '🙏', '🔥'];
  /** Chess clock minutes per player (0 = no clock). */
  protected readonly timers = [0, 3, 5, 10];
  protected readonly mins = signal(10);
  protected readonly cpuMins = signal(0);
  protected readonly activeMins = computed(() => (this.mode() === 'cpu' ? this.cpuMins() : this.mins()));
  /** Ticks while a clock runs, so the numbers count down. */
  protected readonly now = signal(Date.now());
  private roomAt = 0;
  private tickTimer?: ReturnType<typeof setInterval>;
  private flagAsked = false;
  /** One-phone game clock; `run` = whose time is going. */
  protected readonly lclock = signal<{ w: number; b: number; at: number; run: Color } | null>(null);
  protected readonly localFlag = signal<Color | null>(null);
  private baseTitle = '';
  protected readonly showClock = computed(() => (this.mode() === 'online' ? !!this.room()?.clock && this.room()!.status !== 'waiting' : this.activeMins() > 0));
  protected readonly clockRun = computed<Color | null>(() => {
    if (this.mode() === 'online') return this.room()?.clock?.run ?? null;
    if (this.localFlag() || this.result()) return null;
    return this.lclock()?.run ?? null;
  });
  /** Whose move it is (highlighted label), or nobody once the game is over. */
  protected readonly activeSide = computed<Color | null>(() => {
    if ((this.mode() === 'cpu' && !this.showClock()) || this.result()) return null;
    if (this.mode() === 'online' && this.room()?.status !== 'playing') return null;
    return this.turn();
  });
  protected readonly oppSide = computed<Color>(() => (this.room()?.me === 'b' ? 'w' : 'b'));
  protected readonly oppAway = computed(() => this.room()?.players[this.oppSide()]?.away ?? 0);
  protected readonly inviteUrl = computed(() => (this.room() ? `https://tools.spreadapps.in/games/chess?room=${this.room()!.id}` : ''));
  /** Board seen from Black's side (turned 180°). */
  protected readonly flip = signal(false);
  protected readonly squares = computed(() =>
    Array.from({ length: 64 }, (_, i) => {
      const x = i % 8, y = Math.floor(i / 8);
      return { x, y, sq: this.atv(x, y), dark: (x + y) % 2 === 1 };
    }),
  );
  protected readonly topSide = computed<Color>(() => (this.flip() ? 'w' : 'b'));
  protected readonly bottomSide = computed<Color>(() => (this.flip() ? 'b' : 'w'));
  private flipTimer?: ReturnType<typeof setTimeout>;

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
  protected readonly langs = LANGS;
  protected readonly sound = signal(true);
  protected readonly coach = signal<Coach>({ key: 'start' });

  protected readonly level = computed(() => LEVELS.find((l) => l.id === this.levelId())!);
  protected readonly turn = computed<Color>(() => (this.ver(), this.chess.turn()));
  protected readonly myTurn = computed(() => {
    this.ver();
    if (this.busy() || this.chess.isGameOver() || this.localFlag()) return false;
    if (this.mode() === 'online') return this.room()?.status === 'playing' && this.chess.turn() === this.room()?.me;
    return this.mode() === 'local' || this.chess.turn() === 'w';
  });
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
  /** Material lead of a side (pawn 1, knight/bishop 3, rook 5, queen 9), shown as "+3" by its captures. */
  protected lead(side: Color) {
    const l = this.lost(), v = (list: PieceType[]) => list.reduce((n, t) => n + PIECE_VALUE[t], 0);
    const other: Color = side === 'w' ? 'b' : 'w';
    return v(l[other]) - v(l[side]);
  }

  protected readonly targets = computed(() => {
    const s = this.selected();
    this.ver();
    if (!s) return [];
    return this.chess.moves({ square: s, verbose: true }).map((m) => {
      const [x, y] = this.xyv(m.to);
      return { sq: m.to, x, y, cap: !!m.captured };
    });
  });
  protected readonly result = computed(() => {
    this.ver();
    const c = this.chess, t = COACH[this.lang()];
    // Online, resign / draw / a friend leaving end the game without the board being over.
    if (this.mode() === 'online') return this.onlineResult();
    if (this.mode() === 'cpu' && this.localFlag()) {
      return this.localFlag() === 'w' ? { title: t['lose'], sub: '⏱ Your time ran out — the computer wins.' } : { title: t['win'], sub: '⏱ The computer ran out of time!' };
    }
    if (this.mode() === 'local' && this.localFlag()) {
      const lost = this.localFlag()!;
      return { title: t[lost === 'w' ? 'blackWins' : 'whiteWins'], sub: `⏱ ${this.sideName(lost)} ran out of time.` };
    }
    if (!c.isGameOver()) return null;
    if (c.isCheckmate() && this.mode() === 'local') return { title: c.turn() === 'b' ? t['whiteWins'] : t['blackWins'], sub: t['winSub'] };
    if (c.isCheckmate()) return c.turn() === 'b' ? { title: t['win'], sub: t['winSub'] } : { title: t['lose'], sub: t['loseSub'] };
    return { title: t['draw'], sub: c.isStalemate() ? t['stalemate'] : t['drawSub'] };
  });
  protected readonly status = computed(() => {
    const t = COACH[this.lang()];
    if (this.result()) return this.result()!.title;
    if (this.mode() === 'online') {
      const r = this.room();
      if (!r) return '🔗 Online';
      if (r.status === 'waiting') return 'Waiting for your friend to join…';
      return this.myTurn() ? '🟢 Your move' : `⏳ ${this.oppName()}’s move`;
    }
    if (this.mode() === 'local') return t[this.turn() === 'w' ? 'turnWhite' : 'turnBlack'];
    return t[this.busy() ? 'thinking' : 'yourTurn'];
  });
  protected readonly coachText = computed(() => {
    const c = this.coach(), lang = this.lang();
    if ('tip' in c) return `${PIECE_NAME[lang][c.tip]}: ${PIECE_TIP[lang][c.tip]}`;
    return COACH[lang][c.key]
      .replace('{p}', c.p ? PIECE_NAME[lang][c.p].replace(/ \(.*\)/, '') : '')
      .replace('{sq}', c.sq ?? '')
      .replace('{n}', String(c.n ?? ''))
      .replace('{name}', c.who ?? '');
  });

  constructor() {
    afterNextRender(() => {
      try {
        const p = JSON.parse(localStorage.getItem(PREFS) ?? '{}');
        if (LEVELS.some((l) => l.id === p.level)) this.levelId.set(p.level);
        if (p.mode === 'local') this.mode.set('local');
        this.lang.set(LANGS.some((l) => l.id === p.lang) ? p.lang : phoneLang());
        if (p.sound === false) this.sound.set(false);
        const pgn = localStorage.getItem(SAVE);
        if (pgn) {
          this.chess.loadPgn(pgn);
          this.pieces.set(this.fromBoard());
          const h = this.chess.history({ verbose: true }).at(-1);
          this.last.set(h ? { from: h.from, to: h.to } : null);
          this.coach.set({ key: 'resumed' });
          this.ver.update((v) => v + 1);
          if (this.mode() === 'local') this.flip.set(this.chess.turn() === 'b');
        }
      } catch {
        this.chess.reset();
      }
      if (typeof Worker !== 'undefined') {
        this.worker = new Worker(new URL('./chess.worker', import.meta.url), { type: 'module' });
        this.worker.onmessage = (e) => this.onEngine(e.data);
      }
      if (this.mode() === 'cpu' && this.chess.turn() === 'b' && !this.chess.isGameOver()) this.computerMove();
      try {
        this.myName.set(localStorage.getItem('chess-name') ?? '');
      } catch {}
      const id = new URLSearchParams(location.search).get('room');
      if (id && /^[a-z0-9]{8}$/.test(id)) this.openRoom(id);
      document.addEventListener('visibilitychange', this.onVisible);
      this.baseTitle = document.title;
      try {
        const m = Number(localStorage.getItem('chess-mins') ?? 10);
        if (this.timers.includes(m)) this.mins.set(m);
        const cm = Number(localStorage.getItem('chess-cpu-mins') ?? 0);
        if (this.timers.includes(cm)) this.cpuMins.set(cm);
      } catch {}
      this.tickTimer = setInterval(() => this.tick(), 250);
    });
  }

  ngOnDestroy() {
    this.worker?.terminate();
    this.audio?.close();
    clearTimeout(this.flipTimer);
    clearTimeout(this.pollTimer);
    clearTimeout(this.reactTimer);
    clearInterval(this.tickTimer);
    if (this.baseTitle && typeof document !== 'undefined') document.title = this.baseTitle;
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.onVisible);
  }

  protected label(sq: Square) {
    const p = this.chess.get(sq);
    return p ? `${sq} ${p.color === 'w' ? 'white' : 'black'} ${PIECE_NAME.en[p.type]}` : sq;
  }

  /** Screen column/row of a square (0..7), turned when the board is seen from Black. */
  private xyv(sq: string): readonly [number, number] {
    const [x, y] = xy(sq);
    return this.flip() ? [7 - x, 7 - y] : [x, y];
  }

  private atv(x: number, y: number): Square {
    return this.flip() ? at(7 - x, 7 - y) : at(x, y);
  }

  protected sideName(c: Color) {
    const n: Record<string, [string, string]> = { te: ['తెల్ల పావులు', 'నల్ల పావులు'], en: ['White', 'Black'], hi: ['सफ़ेद', 'काले'], ta: ['வெள்ளை', 'கருப்பு'], kn: ['ಬಿಳಿ', 'ಕಪ್ಪು'], mr: ['पांढरे', 'काळे'], or: ['ଧଳା', 'କଳା'] };
    const [w, b] = n[this.lang()] ?? n['en'];
    return c === 'w' ? '⚪ ' + w : '⚫ ' + b;
  }

  protected nameOf(c: Color) {
    if (this.mode() !== 'online') return this.sideName(c);
    const p = this.room()?.players[c];
    return (c === 'w' ? '⚪ ' : '⚫ ') + (p?.name ?? '…') + (this.room()?.me === c ? ' (you)' : '');
  }

  protected place(p: PieceView) {
    const d = this.dragging();
    if (d?.id === p.id) return `translate(${d.x * 100}%, ${d.y * 100}%) scale(1.15)`;
    const [x, y] = this.xyv(p.sq);
    return `translate(${x * 100}%, ${y * 100}%)`;
  }

  // --- input: tap a piece then a square, or drag it ---

  private squareAt(e: PointerEvent, rect: DOMRect): Square | null {
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 8), y = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
    return x >= 0 && x < 8 && y >= 0 && y < 8 ? this.atv(x, y) : null;
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
    const me = this.chess.turn();
    if (sel && sel !== sq && p?.color !== me) {
      this.tryMove(sel, sq);
      return;
    }
    if (p?.color !== me) return this.selected.set(null);
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
    if (this.mode() === 'online') this.sendMove(m);
    else if (this.mode() === 'local') {
      this.runLocalClock(m.color);
      this.turnBoard();
    } else {
      this.runLocalClock(m.color);
      if (!this.chess.isGameOver()) this.computerMove();
    }
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
    else if (m.captured) this.coach.set(mine ? { key: 'youTook', p: m.captured, n: PIECE_VALUE[m.captured] } : this.mode() === 'online' ? { key: 'friendTook', p: m.captured, who: this.oppName() } : { key: 'theyTook', p: m.captured });
    else if (!mine && !('tip' in this.coach())) this.coach.set({ key: 'start' });
    if (this.chess.inCheck() && !this.chess.isGameOver()) this.coach.set({ key: mine ? 'youCheck' : 'inCheck' });
  }

  /** Two players on one phone: after the move has slid, turn the board to the next player. */
  private turnBoard(delay = 650) {
    clearTimeout(this.flipTimer);
    if (this.chess.isGameOver()) return;
    this.flipTimer = setTimeout(() => this.flip.set(this.chess.turn() === 'b'), delay);
  }

  protected setMode(m: 'cpu' | 'local' | 'online') {
    if (m === this.mode()) return;
    if (this.mode() === 'online') this.leaveOnline();
    this.mode.set(m);
    this.newGame();
    this.coach.set({ key: m === 'local' ? 'passPlay' : 'start' });
    this.savePrefs();
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
      if (this.localFlag()) return; // time already ran out
      this.apply(this.chess.move({ from: r.from, to: r.to, promotion: r.promotion }), false);
      this.runLocalClock('b');
    }, r.kind === 'move' ? Math.max(0, MIN_THINK - (Date.now() - r.t0)) : 0);
  }

  protected undo() {
    const h = this.history();
    if (!this.chess.history().length) return;
    this.reqId++;
    this.busy.set(false);
    // Take back the computer's reply too, so it is the player's turn again.
    const steps = this.mode() === 'cpu' && this.chess.turn() === 'w' && this.chess.history().length >= 2 ? 2 : 1;
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
    if (this.mode() === 'local') this.turnBoard(250);
    else if (this.chess.turn() === 'b') this.computerMove();
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
    clearTimeout(this.flipTimer);
    this.flip.set(false);
    this.lclock.set(null);
    this.localFlag.set(null);
    this.coach.set({ key: this.mode() === 'local' ? 'passPlay' : 'start' });
    this.ver.update((v) => v + 1);
    this.save();
  }

  // --- online game with a friend ---

  private readonly onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    if (this.baseTitle) document.title = this.baseTitle;
    if (this.room()) this.poll(0);
  };

  private async api(body: Record<string, unknown>) {
    const r = await fetch('/api/chess', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, j };
  }

  private rememberName() {
    if (this.myName().trim() === 'Friend') return; // the stand-in name for a quick join is not theirs
    try {
      localStorage.setItem('chess-name', this.myName().trim());
    } catch {}
  }

  /** One tap above the board: (ask the name the first time) → create the invite → open the share sheet. */
  protected async quickInvite() {
    let name = this.myName().trim();
    if (name.length < 2) {
      const v = await this.dialog.prompt({ title: 'Invite a friend', message: 'Your friend will see this name.', label: 'Your name', placeholder: 'e.g. Jay', confirmText: 'Create invite', validate: (x) => (x.trim().length < 2 ? 'Please type at least 2 letters.' : null) });
      if (!v) return;
      name = v.trim();
      this.myName.set(name);
    }
    if (this.mode() !== 'online') this.setMode('online');
    await this.create();
    if (this.room() || this.roomId) {
      this.boardInView();
      this.shareInvite();
    }
  }

  private boardInView() {
    setTimeout(() => document.querySelector('app-chess-tool .board')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }

  protected async create() {
    this.onlineErr.set('');
    this.waitingNet.set(true);
    this.rememberName();
    try {
      const { ok, j } = await this.api({ a: 'create', name: this.myName(), mins: this.mins() });
      if (!ok) throw new Error(j.error);
      this.enterRoom(j.id, j.token);
      this.room.set({ id: j.id, status: 'waiting', me: j.color, host: j.color, players: { w: null, b: null, [j.color]: { name: this.myName().trim() || 'Player', away: 0 } } as RoomView['players'], moves: [], result: null, drawOffer: null, events: [], game: 0, rev: 0, clock: null });
    } catch (e) {
      this.onlineErr.set((e as Error).message || 'Could not create the game. Check your internet and try again.');
    } finally {
      this.waitingNet.set(false);
    }
  }

  /** Opened from an invite link: resume if this phone is already a player, else offer to join. */
  private async openRoom(id: string) {
    try {
      this.myName.set(localStorage.getItem('chess-name') ?? '');
    } catch {}
    this.mode.set('online');
    this.newGame();
    let token = '';
    try {
      token = localStorage.getItem('chess-room-' + id) ?? '';
    } catch {}
    if (token) return this.enterRoom(id, token);
    try {
      const r = await fetch(`/api/chess?id=${id}`);
      if (!r.ok) throw new Error();
      const v = (await r.json()) as RoomView;
      if (v.status !== 'waiting') return this.onlineErr.set(v.status === 'cancelled' ? 'This invite was cancelled.' : 'This game already has two players.');
      this.joinId = id;
      const host = v.players[v.host]?.name ?? 'Your friend';
      if (this.myName().trim().length < 2) this.myName.set('Friend');
      this.joining.set(host);
      this.boardInView();
      await this.join();
      this.joining.set(null);
      if (!this.room() && !this.roomId) this.joinFor.set(host); // could not join by itself: show the Join button
    } catch {
      this.onlineErr.set('This game link has expired. Ask your friend for a new one.');
    }
  }

  protected async join() {
    this.onlineErr.set('');
    this.waitingNet.set(true);
    this.rememberName();
    try {
      const { ok, j } = await this.api({ a: 'join', id: this.joinId, name: this.myName() });
      if (!ok) throw new Error(j.error);
      this.joinFor.set(null);
      this.enterRoom(this.joinId, j.token);
    } catch (e) {
      this.onlineErr.set((e as Error).message || 'Could not join. Check your internet and try again.');
    } finally {
      this.waitingNet.set(false);
    }
  }

  private enterRoom(id: string, token: string) {
    this.roomToken = token;
    this.roomId = id;
    try {
      localStorage.setItem('chess-room-' + id, token);
    } catch {}
    this.router.navigate([], { queryParams: { room: id }, replaceUrl: true });
    this.gameNo = 0;
    this.lastEv = 0;
    this.poll(0);
    import('qrcode').then((m) => ((m as unknown as { default?: typeof m }).default ?? m).toDataURL(`https://tools.spreadapps.in/games/chess?room=${id}`, { margin: 1, width: 360 })).then((u) => this.qr.set(u)).catch(() => undefined);
  }

  /** Ask the server for the room; quick while waiting for the friend's move, slower otherwise, paused in the background. */
  private poll(delay: number) {
    clearTimeout(this.pollTimer);
    this.pollTimer = setTimeout(async () => {
      const id = this.roomId;
      if (!id || !this.roomToken) return;
      if (document.visibilityState === 'visible') {
        try {
          const r = await fetch(`/api/chess?id=${id}&t=${this.roomToken}`);
          if (r.status === 410) return this.endOnline('This game has ended or expired.');
          if (r.ok) this.applyRoom((await r.json()) as RoomView);
        } catch {}
      }
      this.poll(this.nextDelay());
    }, delay);
  }

  private nextDelay() {
    const r = this.room();
    if (!r || r.status === 'cancelled') return 8000;
    if (r.status === 'over') return 3000; // waiting to see if the friend asks for a rematch
    if (r.status === 'waiting') return 2500;
    if (this.myTurn()) return 4000;
    const t = Date.now() - this.turnSince;
    return t < 30_000 ? 1500 : t < 120_000 ? 3000 : 6000;
  }

  private applyRoom(v: RoomView): void {
    // A slower, older answer (e.g. a poll that started before my move) must not undo a newer one.
    const cur = this.room();
    if (cur && cur.id === v.id && v.rev < cur.rev) return;
    if (v.game !== this.gameNo) {
      // first look, or a rematch with colours swapped
      this.gameNo = v.game;
      this.reqId++;
      this.chess.reset();
      for (const u of v.moves) this.chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined });
      this.pieces.set(this.fromBoard());
      this.history.set([]);
      const h = this.chess.history({ verbose: true }).at(-1);
      this.last.set(h ? { from: h.from, to: h.to } : null);
      this.ver.update((x) => x + 1);
      this.turnSince = Date.now();
    } else if (v.moves.length > this.chess.history().length) {
      for (const u of v.moves.slice(this.chess.history().length)) {
        this.apply(this.chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined }), false);
      }
      this.turnSince = Date.now();
    } else if (v.moves.length < this.chess.history().length) {
      this.gameNo = -1; // out of step: rebuild from the server next time
      return this.applyRoom(v);
    }
    this.flip.set(v.me === 'b');
    const fresh = v.events.filter((e) => e.n > this.lastEv);
    if (fresh.length) {
      this.lastEv = Math.max(...fresh.map((e) => e.n));
      const theirs = fresh.filter((e) => e.by !== v.me).at(-1);
      if (theirs && this.gameNo) this.showReaction(theirs.e);
    }
    const before = this.room();
    const friendMoved = !!before && before.game === v.game && v.moves.length > before.moves.length && v.moves.length % 2 === (v.me === 'w' ? 0 : 1);
    this.roomAt = Date.now();
    this.flagAsked = false;
    this.room.set(v);
    if (friendMoved && v.status === 'playing') this.yourMoveCue();
    if (before?.status === 'waiting' && v.status === 'playing') this.feedback(false);
  }

  private async sendMove(m: Move) {
    const r = this.room();
    if (!r) return;
    const ply = this.chess.history().length - 1;
    const { ok, j } = await this.api({ a: 'move', id: r.id, t: this.roomToken, ply, uci: m.from + m.to + (m.promotion ?? '') }).catch(() => ({ ok: false, j: {} as Record<string, unknown> }));
    if (ok) this.applyRoom(j as RoomView);
    else if (j['state']) {
      this.gameNo = -1;
      this.applyRoom(j['state'] as RoomView);
    } else this.onlineErr.set('Your move did not reach your friend. Check your internet.');
    this.turnSince = Date.now();
    this.poll(1500);
  }

  protected async act(a: 'draw' | 'claim' | 'rematch') {
    const r = this.room();
    if (!r) return;
    const { ok, j } = await this.api({ a, id: r.id, t: this.roomToken });
    if (ok) this.applyRoom(j as RoomView);
  }

  protected async resign() {
    if (!(await this.dialog.confirm({ title: 'Resign this game?', message: 'Your friend wins this game. You can ask for a rematch.', confirmText: 'Resign', tone: 'danger' }))) return;
    const r = this.room();
    if (!r) return;
    const { ok, j } = await this.api({ a: 'resign', id: r.id, t: this.roomToken });
    if (ok) this.applyRoom(j as RoomView);
  }

  protected async react(e: string) {
    const r = this.room();
    if (!r) return;
    this.showReaction(e);
    const { ok, j } = await this.api({ a: 'react', id: r.id, t: this.roomToken, e });
    if (ok) {
      this.lastEv = Math.max(this.lastEv, ...(j as RoomView).events.map((x) => x.n));
      this.applyRoom(j as RoomView);
    }
  }

  private showReaction(e: string) {
    clearTimeout(this.reactTimer);
    this.reaction.set({ e });
    this.reactTimer = setTimeout(() => this.reaction.set(null), 2500);
  }

  protected async shareInvite() {
    const url = this.inviteUrl();
    const text = `♟️ Play chess with me on Spread Apps — tap to join: ${url}`;
    try {
      if (navigator.share) return await navigator.share({ title: 'Play chess with me', text, url });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  protected async copyInvite() {
    try {
      await navigator.clipboard.writeText(this.inviteUrl());
      this.onlineErr.set('');
      this.toast.show('Link copied — paste it in WhatsApp.', 'success');
    } catch {}
  }

  protected async cancelInvite() {
    const r = this.room();
    if (r) await this.api({ a: 'cancel', id: r.id, t: this.roomToken }).catch(() => undefined);
    this.leaveOnline();
  }

  /** Leave the online game (back to the computer). Mid-game, confirm first — the friend can then claim the win. */
  protected async leaveOnline(ask = false) {
    if (ask && this.room()?.status === 'playing' && !(await this.dialog.confirm({ title: 'Leave this game?', message: 'Your friend can claim the win if you do not come back.', confirmText: 'Leave', tone: 'warning' }))) return;
    clearTimeout(this.pollTimer);
    this.room.set(null);
    this.roomToken = '';
    this.roomId = '';
    this.qr.set('');
    this.joinFor.set(null);
    this.onlineErr.set('');
    if (new URLSearchParams(location.search).has('room')) this.router.navigate([], { queryParams: {}, replaceUrl: true });
    if (this.mode() === 'online') {
      this.mode.set('cpu');
      this.newGame();
    }
  }

  private endOnline(msg: string) {
    clearTimeout(this.pollTimer);
    this.onlineErr.set(msg);
  }

  private onlineResult() {
    const r = this.room(), t = COACH[this.lang()];
    if (!r) return null;
    const opp = r.players[this.oppSide()]?.name ?? 'Your friend';
    // The board can show mate a moment before the server's answer arrives.
    const res = r.result ?? (this.chess.isCheckmate() ? { kind: 'mate' as const, winner: (this.chess.turn() === 'w' ? 'b' : 'w') as Color } : null);
    if (!res) return null;
    const won = res.winner === r.me;
    switch (res.kind) {
      case 'time':
        return won ? { title: t['win'], sub: `⏱ ${opp} ran out of time.` } : { title: `${opp} won the game`, sub: '⏱ Your time ran out. Rematch?' };
      case 'mate':
        return won ? { title: t['win'], sub: `Checkmate! You beat ${opp}.` } : { title: `${opp} won the game`, sub: 'Checkmate. Good game — tap Rematch to play again.' };
      case 'resign':
        return won ? { title: t['win'], sub: `${opp} resigned.` } : { title: `${opp} won the game`, sub: 'You resigned.' };
      case 'left':
        return won ? { title: t['win'], sub: `${opp} left the game.` } : { title: `${opp} won the game`, sub: 'You were away too long.' };
      default:
        return { title: t['draw'], sub: res.kind === 'stalemate' ? t['stalemate'] : t['drawSub'] };
    }
  }

  // --- chess clock & turn cues ---

  protected setMins(m: number) {
    const cpu = this.mode() === 'cpu';
    (cpu ? this.cpuMins : this.mins).set(m);
    try {
      localStorage.setItem(cpu ? 'chess-cpu-mins' : 'chess-mins', String(m));
    } catch {}
    if (this.mode() !== 'online') this.newGame();
  }

  protected oppName() {
    return this.room()?.players[this.oppSide()]?.name ?? 'Your friend';
  }

  /** Milliseconds left on a side's clock right now. */
  private clockLeft(c: Color) {
    const now = this.now();
    if (this.mode() === 'online') {
      const ck = this.room()?.clock;
      if (!ck) return 0;
      return Math.max(0, ck[c] - (ck.run === c ? now - this.roomAt : 0));
    }
    const lc = this.lclock();
    if (!lc) return this.activeMins() * 60_000;
    return Math.max(0, lc[c] - (lc.run === c && !this.localFlag() && !this.chess.isGameOver() ? now - lc.at : 0));
  }

  protected clockText(c: Color) {
    const s = Math.ceil(this.clockLeft(c) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  protected clockLow(c: Color) {
    return this.showClock() && this.clockRun() === c && this.clockLeft(c) < 20_000;
  }

  /** One-phone game: the mover's clock stops, the other side's starts (it begins with White's first move). */
  private runLocalClock(mover: Color) {
    if (!this.activeMins()) return;
    const now = Date.now(), base = this.activeMins() * 60_000;
    const lc = this.lclock() ?? { w: base, b: base, at: now, run: mover };
    const spent = lc.run === mover ? now - lc.at : 0;
    this.lclock.set({ ...lc, [mover]: Math.max(0, lc[mover] - spent), at: now, run: mover === 'w' ? 'b' : 'w' });
  }

  private tick() {
    if (!this.clockRun()) return;
    this.now.set(Date.now());
    const run = this.clockRun()!;
    if (this.clockLeft(run) > 0) return;
    if (this.mode() !== 'online') {
      this.localFlag.set(run);
      this.reqId++; // a computer reply still thinking is dropped
      this.busy.set(false);
      this.ver.update((v) => v + 1);
    } else if (this.mode() === 'online' && !this.flagAsked) {
      this.flagAsked = true; // the server decides; ask it now
      this.poll(0);
    }
  }

  /** Your friend just moved: a buzz, the move sound, and a title hint when the tab is in the background. */
  private yourMoveCue() {
    if (this.sound()) navigator.vibrate?.([25, 40, 25]);
    if (document.hidden && this.baseTitle) document.title = 'Your move ♟️ · ' + this.baseTitle;
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
      localStorage.setItem(PREFS, JSON.stringify({ level: this.levelId(), lang: this.lang(), sound: this.sound(), mode: this.mode() }));
    } catch {}
  }

  private save() {
    if (this.mode() === 'online') return;
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
