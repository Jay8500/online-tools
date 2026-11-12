import { Component, ElementRef, OnDestroy, ViewEncapsulation, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '../../core/dialog.service';
import { GameFx, confetti } from '../../core/game-fx';
import { OnlineRoom, PlayRoom } from '../../core/play-room';
import { ToastService } from '../../core/toast.service';

type Mark = 'X' | 'O';
type Mode = 'cpu' | 'local' | 'online';
type Level = 'easy' | 'medium' | 'hard';

/** All rows, columns and both diagonals (3 in a row on 3×3, 4 in a row on 4×4). */
function linesOf(n: number): number[][] {
  const l: number[][] = [];
  for (let i = 0; i < n; i++) {
    l.push(Array.from({ length: n }, (_, j) => i * n + j));
    l.push(Array.from({ length: n }, (_, j) => j * n + i));
  }
  l.push(Array.from({ length: n }, (_, j) => j * n + j));
  l.push(Array.from({ length: n }, (_, j) => j * n + (n - 1 - j)));
  return l;
}
function winner(b: string[], lines: number[][]): { m: Mark; line: number[] } | null {
  for (const l of lines) if (b[l[0]] && l.every((k) => b[k] === b[l[0]])) return { m: b[l[0]] as Mark, line: l };
  return null;
}

const CSS = `
.tt{display:grid;gap:10px;max-width:460px;margin:0 auto}
.tt-status{margin:0;text-align:center;font-weight:800;font-size:1.05rem;color:var(--brand);min-height:1.5em}
.tt-score{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;font-size:13px}
.tt-score>span{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:var(--surface-2);transition:background .3s,box-shadow .3s;min-width:0}
.tt-score>span:last-child{justify-content:flex-end}
.tt-score>span.on{background:color-mix(in oklab,var(--brand) 18%,transparent);box-shadow:0 0 0 2px color-mix(in oklab,var(--brand) 40%,transparent)}
.tt-score b{font-size:15px}.tt-score i{font-style:normal;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tt-score em{font-style:normal;color:var(--muted);font-size:12px;text-align:center}
.tt-board{position:relative;display:grid;grid-template-columns:repeat(var(--n),1fr);gap:8px;aspect-ratio:1;padding:10px;border-radius:20px;background:linear-gradient(145deg,#0f766e,#134e4a);box-shadow:0 18px 36px -18px rgb(13 60 55/.6);user-select:none;touch-action:manipulation}
.tt-c{position:relative;border:0;border-radius:14px;background:rgb(255 255 255/.94);cursor:pointer;padding:0;transition:transform .15s,background .2s}
.tt-c:not(:disabled):hover{background:#fff;transform:translateY(-2px)}
.tt-c:not(:disabled):active{transform:scale(.94)}.tt-c:disabled{cursor:default}
.tt-c:focus-visible{outline:3px solid #facc15;outline-offset:2px}
.tt-c.win{background:#fef9c3}
.tt-mk{position:absolute;inset:14%;width:72%;height:72%;fill:none;stroke-width:12;stroke-linecap:round}
.tt-mk.x{stroke:#e11d48}.tt-mk.o{stroke:#2563eb}
.tt-mk path,.tt-mk circle{stroke-dasharray:200;stroke-dashoffset:200;animation:tt-draw .35s ease-out forwards}
.tt-mk path+path{animation-delay:.12s}
@keyframes tt-draw{to{stroke-dashoffset:0}}
.tt-ghost{opacity:0;transition:opacity .15s}.tt-c:not(:disabled):hover .tt-ghost{opacity:.18}
.tt-ghost path,.tt-ghost circle{animation:none;stroke-dashoffset:0}
.tt-line{position:absolute;inset:10px;width:calc(100% - 20px);height:calc(100% - 20px);pointer-events:none;z-index:3}
.tt-line line{stroke:#facc15;stroke-width:3.2;stroke-linecap:round;filter:drop-shadow(0 0 4px #facc15);stroke-dasharray:160;stroke-dashoffset:160;animation:tt-draw .5s .15s ease-out forwards}
.tt-over{position:absolute;inset:0;z-index:5;display:grid;place-items:center;text-align:center;color:#fff;border-radius:20px;background:rgb(8 28 25/.72);backdrop-filter:blur(2px);animation:tt-fade .3s;padding:16px}
@keyframes tt-fade{from{opacity:0}}
.tt-react{position:absolute;left:50%;top:40%;transform:translateX(-50%);z-index:6;font-size:64px;pointer-events:none;animation:tt-pop .5s}
@keyframes tt-pop{from{transform:translateX(-50%) scale(.3);opacity:0}}
.tt .seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:3px;padding:3px;border-radius:12px;background:var(--surface-2)}
.tt .seg button{border:0;background:none;color:var(--ink);padding:7px 4px;border-radius:9px;font-size:13px;font-weight:600}
.tt .seg button:disabled{opacity:.4;cursor:not-allowed}
.tt .seg button[aria-pressed=true]{background:var(--surface);color:var(--brand);box-shadow:0 1px 3px rgb(0 0 0/.15)}
.tt-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
@media (prefers-reduced-motion:reduce){.tt *{animation:none!important;transition:none!important}.tt-mk path,.tt-mk circle,.tt-line line{stroke-dashoffset:0}}
`;

/**
 * Tic-Tac-Toe: the computer (Easy, Medium, Unbeatable), a friend on one phone, or a friend online
 * with a link. 3×3 (three in a row) or 4×4 (four in a row). X always starts; starters alternate.
 */
@Component({
  selector: 'app-ttt-tool',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="tt">
      <p class="tt-status" aria-live="polite">{{ status() }}</p>

      <div class="tt-score" aria-label="Score">
        @for (m of sides(); track $index; let i = $index) {
          @if (i === 1) { <em>Draws {{ draws() }}</em> }
          <span [class.on]="activeMark() === m">
            @if (i === 0) { <b [style.color]="m === 'X' ? '#e11d48' : '#2563eb'">{{ m === 'X' ? '✕' : '◯' }}</b><i>{{ nameOf(m) }}</i><b>{{ scoreOf(m) }}</b> }
            @else { <b>{{ scoreOf(m) }}</b><i>{{ nameOf(m) }}</i><b [style.color]="m === 'X' ? '#e11d48' : '#2563eb'">{{ m === 'X' ? '✕' : '◯' }}</b> }
          </span>
        }
      </div>

      <div class="tt-board" #grid [style.--n]="size()" role="grid" aria-label="Tic-Tac-Toe board">
        @for (c of board(); track $index; let i = $index) {
          <button type="button" class="tt-c" [class.win]="line().includes(i)" [disabled]="!canPlay(i)" [attr.aria-label]="'Square ' + (i + 1) + (c ? ': ' + c : ': empty')" (click)="play(i)">
            @if (c === 'X') { <svg class="tt-mk x" viewBox="0 0 100 100"><path d="M22 22L78 78" /><path d="M78 22L22 78" /></svg> }
            @else if (c === 'O') { <svg class="tt-mk o" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" /></svg> }
            @else if (myMark() === 'X') { <svg class="tt-mk x tt-ghost" viewBox="0 0 100 100"><path d="M22 22L78 78" /><path d="M78 22L22 78" /></svg> }
            @else { <svg class="tt-mk o tt-ghost" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" /></svg> }
          </button>
        }
        @if (strike(); as s) {
          <svg class="tt-line" viewBox="0 0 100 100" preserveAspectRatio="none"><line [attr.x1]="s[0]" [attr.y1]="s[1]" [attr.x2]="s[2]" [attr.y2]="s[3]" /></svg>
        }
        @if (reaction(); as e) { <div class="tt-react">{{ e }}</div> }
        @if (mode() === 'online' && online.room()?.status === 'waiting') {
          <div class="tt-over"><div class="grid justify-items-center gap-2">
            <p class="text-lg font-extrabold">Waiting for your friend…</p>
            @if (online.qr()) { <img [src]="online.qr()" alt="QR code to join this game" width="140" height="140" style="border-radius:12px;background:#fff;padding:5px" /> }
            <p class="text-xs opacity-90">They tap the link or scan this — the game starts by itself.</p>
            <div class="tt-row">
              <button type="button" class="btn-primary" (click)="online.share()">📤 Share link</button>
              <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="copy()">Copy</button>
              <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="online.cancel()">Cancel</button>
            </div>
          </div></div>
        } @else if (online.joining(); as host) {
          <div class="tt-over"><p class="text-lg font-extrabold">Joining {{ host }}’s game…</p></div>
        } @else if (mode() === 'online' && online.err() && !online.room()) {
          <div class="tt-over"><div class="grid justify-items-center gap-3">
            <p class="text-lg font-extrabold">{{ online.err() }}</p>
            <div class="tt-row">
              <button type="button" class="btn-primary" (click)="online.err.set(''); invite()">👥 Start my own game</button>
              <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="setMode('cpu')">🤖 Play the computer</button>
            </div>
          </div></div>
        } @else if (result(); as r) {
          <div class="tt-over"><div>
            <p class="text-3xl font-extrabold">{{ r.title }}</p>
            <p class="mt-1 text-sm opacity-90">{{ r.sub }}</p>
            <div class="tt-row mt-3">
              @if (mode() === 'online') {
                <button type="button" class="btn-primary" (click)="online.act('rematch')">Rematch</button>
                <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="setMode('cpu')">Leave</button>
              } @else {
                <button type="button" class="btn-primary" (click)="newGame()">Play again</button>
              }
            </div>
          </div></div>
        }
      </div>

      @if (mode() === 'online' && online.room()?.status === 'playing') {
        <div class="tt-row">
          @for (e of emojis; track e) { <button type="button" class="btn-ghost px-2 text-lg" [attr.aria-label]="'Send ' + e" (click)="react(e)">{{ e }}</button> }
          <button type="button" class="btn-ghost text-sm" (click)="resign()">🏳️ Resign</button>
        </div>
        @if (oppAway() > 45) {
          <p class="text-center text-sm">⏳ {{ online.oppName() }} seems away… @if (oppAway() > 90) { <button type="button" class="btn-ghost ml-1 text-sm" (click)="online.act('claim')">Claim the win</button> }</p>
        }
      }

      <div class="seg" role="group" aria-label="Play against">
        <button type="button" [attr.aria-pressed]="mode() === 'cpu'" [disabled]="locked() && mode() !== 'cpu'" (click)="setMode('cpu')">🤖 Computer</button>
        <button type="button" [attr.aria-pressed]="mode() === 'local'" [disabled]="locked() && mode() !== 'local'" (click)="setMode('local')">👥 Friend</button>
        <button type="button" [attr.aria-pressed]="mode() === 'online'" [disabled]="locked() && mode() !== 'online'" (click)="setMode('online')">🔗 Online</button>
      </div>
      @if (locked()) { <p class="text-center text-xs text-muted">🔒 Game in progress — finish it, or tap {{ mode() === 'online' ? 'Leave online game' : 'New game' }} to switch.</p> }
      @if (mode() === 'cpu') {
        <div class="seg" role="group" aria-label="Computer level">
          @for (l of levels; track l) { <button type="button" [attr.aria-pressed]="level() === l" (click)="setLevel(l)">{{ levelName(l) }}</button> }
        </div>
      }
      @if (!online.room()) {
        <div class="seg" role="group" aria-label="Board size">
          <button type="button" [attr.aria-pressed]="size() === 3" (click)="setSize(3)">3 × 3 · three in a row</button>
          <button type="button" [attr.aria-pressed]="size() === 4" (click)="setSize(4)">4 × 4 · four in a row</button>
        </div>
      }
      <div class="tt-row">
        @if (mode() !== 'online') { <button type="button" class="btn-ghost" (click)="newGame()">↻ New game</button> }
        @if (!online.room()) { <button type="button" class="btn-primary" [disabled]="online.busy()" (click)="invite()">👥 Invite a friend online</button> }
        @else { <button type="button" class="btn-ghost" (click)="setMode('cpu')">Leave online game</button> }
      </div>
    </div>
  `,
})
export class TttTool implements OnDestroy {
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly boardEl = viewChild<ElementRef<HTMLElement>>('grid');
  private readonly fx = new GameFx();
  protected readonly levels: Level[] = ['easy', 'medium', 'hard'];
  protected readonly emojis = ['👍', '😮', '😂', '👏', '🙏', '🔥'];

  protected readonly mode = signal<Mode>('cpu');
  protected readonly level = signal<Level>('medium');
  protected readonly localSize = signal(3);
  protected readonly cells = signal<string[]>(Array(9).fill(''));
  /** Against the computer: which mark the player has this game (they alternate who starts). */
  protected readonly youX = signal(true);
  private readonly tally = signal({ X: 0, O: 0, d: 0 });
  protected readonly thinking = signal(false);
  protected readonly reaction = signal<string | null>(null);
  private reactTimer?: ReturnType<typeof setTimeout>;
  private aiTimer?: ReturnType<typeof setTimeout>;

  protected readonly online: OnlineRoom = new OnlineRoom(
    'ttt',
    inject(Router),
    (prev, next) => this.onRoom(prev, next),
    (e) => this.showReaction(e),
    () => this.myTurn(),
  );

  protected readonly size = computed(() => this.online.room()?.size ?? this.localSize());
  private readonly lines = computed(() => linesOf(this.size()));
  protected readonly board = computed<string[]>(() => {
    const r = this.online.room();
    return r?.board ? r.board.split('').map((c) => (c === '.' ? '' : c)) : this.cells();
  });
  protected readonly turn = computed<Mark>(() => (this.board().filter(Boolean).length % 2 === 0 ? 'X' : 'O'));
  private readonly win = computed(() => winner(this.board(), this.lines()));
  protected readonly line = computed(() => this.online.room()?.line ?? this.win()?.line ?? []);
  protected readonly full = computed(() => this.board().every(Boolean));
  /** The mark this phone plays (in Friend mode, whoever's turn it is). */
  protected readonly myMark = computed<Mark>(() => {
    const r = this.online.room();
    if (this.mode() === 'online' && r?.me) return r.xSeat === r.me ? 'X' : 'O';
    if (this.mode() === 'cpu') return this.youX() ? 'X' : 'O';
    return this.turn();
  });
  /** Score row: you always on the left (on one phone, ✕ on the left). */
  protected readonly sides = computed<Mark[]>(() => (this.mode() === 'local' || (this.mode() === 'online' && !this.online.room()?.me) ? ['X', 'O'] : this.myMark() === 'X' ? ['X', 'O'] : ['O', 'X']));
  protected readonly locked = computed<boolean>(() => {
    const r = this.online.room();
    if (this.mode() === 'online') return !!r && (r.status === 'waiting' || r.status === 'playing');
    return this.cells().some(Boolean) && !this.over();
  });
  protected readonly over = computed<boolean>(() => (this.mode() === 'online' ? this.online.room()?.status === 'over' : !!this.win() || this.full()));
  protected readonly myTurn = computed<boolean>(() => {
    if (this.over() || this.thinking()) return false;
    if (this.mode() === 'online') return this.online.room()?.status === 'playing' && this.turn() === this.myMark();
    return this.mode() === 'local' || this.turn() === this.myMark();
  });
  protected readonly activeMark = computed<Mark | null>(() => (this.over() || (this.mode() === 'online' && this.online.room()?.status !== 'playing') ? null : this.turn()));
  protected readonly oppAway = computed(() => this.online.room()?.players[this.online.oppSeat()]?.away ?? 0);

  protected readonly strike = computed(() => {
    const l = this.line(), n = this.size();
    if (!l.length) return null;
    const c = (k: number) => [((k % n) + 0.5) * (100 / n), (Math.floor(k / n) + 0.5) * (100 / n)];
    const [x1, y1] = c(l[0]), [x2, y2] = c(l[l.length - 1]);
    // run a little past the outer cells
    const dx = (x2 - x1) * 0.12, dy = (y2 - y1) * 0.12;
    return [x1 - dx, y1 - dy, x2 + dx, y2 + dy];
  });

  protected readonly result = computed(() => {
    if (this.mode() === 'online') {
      const r = this.online.room();
      if (!r?.result) return null;
      const opp = this.online.oppName(), won = r.result.winner === r.me;
      if (r.result.kind === 'draw') return { title: 'Draw 🤝', sub: 'Nobody got a line. Rematch?' };
      if (r.result.kind === 'resign') return won ? { title: 'You won! 🎉', sub: `${opp} resigned.` } : { title: `${opp} won the game`, sub: 'You resigned.' };
      if (r.result.kind === 'left') return won ? { title: 'You won! 🎉', sub: `${opp} left the game.` } : { title: `${opp} won the game`, sub: 'You were away too long.' };
      return won ? { title: 'You won! 🎉', sub: `You beat ${opp}.` } : { title: `${opp} won the game`, sub: 'Good game — tap Rematch to play again.' };
    }
    const w = this.win();
    if (!w && !this.full()) return null;
    if (!w) return { title: 'Draw 🤝', sub: this.mode() === 'cpu' && this.level() === 'hard' && this.size() === 3 ? 'That is the best anyone can do against Unbeatable!' : 'Nobody got a line.' };
    if (this.mode() === 'local') return { title: `${w.m === 'X' ? '✕' : '◯'} wins! 🎉`, sub: `${this.nameOf(w.m)} got ${this.size()} in a row.` };
    return w.m === this.myMark() ? { title: 'You won! 🎉', sub: this.level() === 'easy' ? 'Try Medium next.' : 'Great game!' } : { title: 'Computer wins', sub: this.youX() ? 'Tap Play again — the computer starts next.' : 'Tap Play again — you start next.' };
  });

  protected readonly status = computed(() => {
    if (this.result()) return this.result()!.title;
    if (this.mode() === 'online') {
      const r = this.online.room();
      if (!r) return '🔗 Play a friend on their own phone';
      if (r.status === 'waiting') return 'Waiting for your friend to join…';
      return this.myTurn() ? `🟢 Your move (${this.myMark() === 'X' ? '✕' : '◯'})` : `⏳ ${this.online.oppName()}’s move`;
    }
    if (this.mode() === 'local') return `${this.turn() === 'X' ? '✕' : '◯'}’s turn — pass the phone`;
    return this.thinking() ? '🤖 Computer is thinking…' : `🟢 Your move (${this.myMark() === 'X' ? '✕' : '◯'})`;
  });

  constructor() {
    if (typeof document !== 'undefined' && !document.getElementById('tt-css')) {
      const st = document.createElement('style');
      st.id = 'tt-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    afterNextRender(() => {
      try {
        const p = JSON.parse(localStorage.getItem('ttt-prefs') ?? '{}');
        if (this.levels.includes(p.level)) this.level.set(p.level);
        if (p.size === 4) this.localSize.set(4);
      } catch {}
      this.newGame();
      const id = new URLSearchParams(location.search).get('room');
      if (id && /^[a-z0-9]{8}$/.test(id)) {
        this.mode.set('online');
        this.online.open(id);
        this.boardInView();
      }
    });
  }

  ngOnDestroy() {
    this.online.stop();
    clearTimeout(this.aiTimer);
    clearTimeout(this.reactTimer);
  }

  protected levelName(l: Level) {
    return l === 'easy' ? 'Easy' : l === 'medium' ? 'Medium' : this.size() === 3 ? 'Unbeatable' : 'Hard';
  }

  protected nameOf(m: Mark) {
    if (this.mode() === 'online') {
      const r = this.online.room();
      if (!r) return m === 'X' ? 'You' : 'Friend';
      const seat = m === 'X' ? r.xSeat! : r.xSeat === 'a' ? 'b' : 'a';
      return (r.players[seat]?.name ?? '…') + (seat === r.me ? ' (you)' : '');
    }
    if (this.mode() === 'local') return m === 'X' ? 'Player ✕' : 'Player ◯';
    return m === this.myMark() ? 'You' : 'Computer';
  }

  protected scoreOf(m: Mark) {
    if (this.mode() === 'online') {
      const r = this.online.room();
      if (!r) return 0;
      // the match score belongs to people, not marks (marks swap each rematch)
      const seat = m === 'X' ? r.xSeat! : r.xSeat === 'a' ? 'b' : 'a';
      return r.score[seat];
    }
    if (this.mode() === 'cpu') return m === this.myMark() ? this.tally().X : this.tally().O; // X = you, O = computer here
    return this.tally()[m];
  }

  protected draws() {
    return this.mode() === 'online' ? (this.online.room()?.score.d ?? 0) : this.tally().d;
  }

  protected canPlay(i: number) {
    return this.myTurn() && !this.board()[i];
  }

  protected play(i: number) {
    if (!this.canPlay(i)) return;
    this.fx.unlock();
    this.fx.pop();
    if (this.mode() === 'online') {
      // show it at once; the server's answer confirms it
      const r = this.online.room()!;
      const b = r.board!.split('');
      b[i] = this.myMark();
      this.online.room.set({ ...r, board: b.join('') });
      this.online.act('move', { cell: i });
      return;
    }
    this.place(i, this.turn());
    if (!this.over() && this.mode() === 'cpu') this.computerMove();
  }

  private place(i: number, m: Mark) {
    const b = [...this.cells()];
    b[i] = m;
    this.cells.set(b);
    this.afterMove();
  }

  private afterMove() {
    const w = this.win();
    if (!w && !this.full()) return;
    const t = { ...this.tally() };
    if (!w) t.d++;
    else if (this.mode() === 'cpu') w.m === this.myMark() ? t.X++ : t.O++;
    else t[w.m]++;
    this.tally.set(t);
    this.celebrate(w ? (this.mode() === 'local' || w.m === this.myMark() ? 'win' : 'lose') : 'draw');
  }

  private celebrate(kind: 'win' | 'lose' | 'draw') {
    if (kind === 'win') {
      this.fx.win();
      const el = this.boardEl()?.nativeElement;
      if (el) setTimeout(() => confetti(el), 250);
    } else if (kind === 'lose') this.fx.thud();
    else this.fx.soft();
  }

  // --- computer ---

  private computerMove() {
    this.thinking.set(true);
    clearTimeout(this.aiTimer);
    this.aiTimer = setTimeout(() => {
      this.thinking.set(false);
      const i = this.pickCell();
      if (i < 0) return;
      this.fx.soft();
      this.place(i, this.turn());
    }, 450 + Math.random() * 300);
  }

  private pickCell(): number {
    const b = this.board(), me = this.turn(), you: Mark = me === 'X' ? 'O' : 'X', lines = this.lines();
    const free = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
    if (!free.length) return -1;
    const rand = () => free[Math.floor(Math.random() * free.length)];
    const finishing = (m: Mark) => free.find((i) => {
      const t = [...b];
      t[i] = m;
      return !!winner(t, lines);
    });
    const lvl = this.level();
    if (lvl === 'easy' && Math.random() < 0.6) return rand();
    const win = finishing(me);
    if (win !== undefined) return win;
    const block = finishing(you);
    if (block !== undefined && (lvl !== 'easy' || Math.random() < 0.5)) return block;
    if (lvl !== 'hard') {
      const n = this.size(), centers = n === 3 ? [4] : [5, 6, 9, 10];
      const c = centers.filter((i) => !b[i]);
      return c.length && Math.random() < 0.7 ? c[Math.floor(Math.random() * c.length)] : rand();
    }
    return this.best(b, me, lines);
  }

  /** Minimax with alpha-beta: perfect on 3×3, a few moves deep with a line score on 4×4. */
  private best(b: string[], me: Mark, lines: number[][]): number {
    const you: Mark = me === 'X' ? 'O' : 'X', n = this.size(), depthMax = n === 3 ? 9 : 4;
    const score = (t: string[]) => {
      let s = 0;
      for (const l of lines) {
        const mine = l.filter((k) => t[k] === me).length, theirs = l.filter((k) => t[k] === you).length;
        if (mine && !theirs) s += mine * mine;
        if (theirs && !mine) s -= theirs * theirs;
      }
      return s;
    };
    const search = (t: string[], turn: Mark, depth: number, alpha: number, beta: number): number => {
      const w = winner(t, lines);
      if (w) return w.m === me ? 1000 - depth : depth - 1000;
      if (t.every(Boolean)) return 0;
      if (depth >= depthMax) return score(t);
      let best = turn === me ? -Infinity : Infinity;
      for (let i = 0; i < t.length; i++) {
        if (t[i]) continue;
        t[i] = turn;
        const v = search(t, turn === me ? you : me, depth + 1, alpha, beta);
        t[i] = '';
        if (turn === me) {
          best = Math.max(best, v);
          alpha = Math.max(alpha, v);
        } else {
          best = Math.min(best, v);
          beta = Math.min(beta, v);
        }
        if (beta <= alpha) break;
      }
      return best;
    };
    let bestI = -1, bestV = -Infinity;
    const order = b.map((_, i) => i).filter((i) => !b[i]).sort(() => Math.random() - 0.5); // equal moves vary
    for (const i of order) {
      const t = [...b];
      t[i] = me;
      const v = search(t, you, 1, -Infinity, Infinity);
      if (v > bestV) [bestV, bestI] = [v, i];
    }
    return bestI;
  }

  // --- games, modes, settings ---

  protected newGame() {
    clearTimeout(this.aiTimer);
    this.thinking.set(false);
    const n = this.localSize();
    const wasPlayed = this.cells().some(Boolean);
    this.cells.set(Array(n * n).fill(''));
    if (this.mode() === 'cpu') {
      if (wasPlayed) this.youX.update((x) => !x); // take turns starting
      if (!this.youX()) this.computerMove();
    }
  }

  protected setMode(m: Mode) {
    if (this.mode() === 'online' && m !== 'online') this.online.leave();
    this.mode.set(m);
    this.tally.set({ X: 0, O: 0, d: 0 });
    this.youX.set(true);
    this.cells.set(Array(this.localSize() ** 2).fill(''));
    if (m !== 'online') this.newGame();
  }

  protected setLevel(l: Level) {
    this.level.set(l);
    this.savePrefs();
    this.tally.set({ X: 0, O: 0, d: 0 });
    this.youX.set(true);
    this.cells.set(Array(this.localSize() ** 2).fill(''));
    this.newGame();
  }

  protected setSize(n: number) {
    this.localSize.set(n);
    this.savePrefs();
    this.tally.set({ X: 0, O: 0, d: 0 });
    this.youX.set(true);
    this.cells.set(Array(n * n).fill(''));
    if (this.mode() !== 'online') this.newGame();
  }

  private savePrefs() {
    try {
      localStorage.setItem('ttt-prefs', JSON.stringify({ level: this.level(), size: this.localSize() }));
    } catch {}
  }

  // --- online ---

  /** One tap: ask the name the first time → create the game → share the link. */
  protected async invite() {
    if (this.mode() !== 'online' && this.locked() && !(await this.dialog.confirm({ title: 'Play a friend online?', message: 'Your current game will end and a new online game starts.', confirmText: 'Invite a friend' }))) return;
    let name = this.online.name().trim();
    if (name.length < 2 || name === 'Friend') {
      const v = await this.dialog.prompt({ title: 'Invite a friend', message: 'Your friend will see this name.', label: 'Your name', placeholder: 'e.g. Jay', confirmText: 'Create invite', validate: (x) => (x.trim().length < 2 ? 'Please type at least 2 letters.' : null) });
      if (!v) return;
      name = v.trim();
      this.online.name.set(name);
    }
    this.mode.set('online');
    if (await this.online.create({ size: this.localSize() })) {
      this.boardInView();
      this.online.share();
    }
  }

  private onRoom(prev: PlayRoom | null, next: PlayRoom) {
    if (!prev || next.status !== 'playing' && next.status !== 'over') return;
    const before = (prev.board ?? '').replace(/\./g, '').length, now = (next.board ?? '').replace(/\./g, '').length;
    if (prev.game === next.game && now > before && this.turn() === this.myMark() && next.status === 'playing') {
      this.fx.soft();
      if (this.fx.on) navigator.vibrate?.([25, 40, 25]);
    }
    if (prev.status !== 'over' && next.status === 'over') this.celebrate(!next.result?.winner ? 'draw' : next.result.winner === next.me ? 'win' : 'lose');
    if (prev.status === 'waiting' && next.status === 'playing') this.fx.chime();
  }

  protected async resign() {
    if (!(await this.dialog.confirm({ title: 'Resign this game?', message: 'Your friend wins this game. You can ask for a rematch.', confirmText: 'Resign', tone: 'danger' }))) return;
    this.online.act('resign');
  }

  protected react(e: string) {
    this.showReaction(e);
    this.online.react(e);
  }

  private showReaction(e: string) {
    clearTimeout(this.reactTimer);
    this.reaction.set(e);
    this.reactTimer = setTimeout(() => this.reaction.set(null), 2500);
  }

  protected async copy() {
    if (await this.online.copy()) this.toast.show('Link copied — paste it in WhatsApp.', 'success');
  }

  private boardInView() {
    setTimeout(() => this.boardEl()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }
}
