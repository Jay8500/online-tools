import { Component, ElementRef, OnDestroy, ViewEncapsulation, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService } from '../../core/dialog.service';
import { GameFx, confetti, reducedMotion } from '../../core/game-fx';
import { OnlineRoom, PlayRoom } from '../../core/play-room';
import { ToastService } from '../../core/toast.service';

type Hand = 'r' | 'p' | 's';
type Mode = 'cpu' | 'local' | 'online';
type Side = 'a' | 'b';
interface Round { a: Hand; b: Hand; w: Side | null }

const HANDS: Hand[] = ['r', 'p', 's'];
const ICON: Record<Hand, string> = { r: '✊', p: '✋', s: '✌️' };
const NAME: Record<Hand, string> = { r: 'Rock', p: 'Paper', s: 'Scissors' };
const BEATS: Record<Hand, Hand> = { r: 's', p: 'r', s: 'p' };
const WHY: Record<Hand, string> = { r: '✊ Rock breaks ✌️ Scissors', p: '✋ Paper covers ✊ Rock', s: '✌️ Scissors cut ✋ Paper' };
const judge = (a: Hand, b: Hand): Side | null => (a === b ? null : BEATS[a] === b ? 'a' : 'b');

const CSS = `
.rp{display:grid;gap:10px;max-width:460px;margin:0 auto}
.rp-status{margin:0;text-align:center;font-weight:800;font-size:1.05rem;color:var(--brand);min-height:1.5em}
.rp-score{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;font-size:13px}
.rp-score>div{display:grid;gap:3px;padding:6px 10px;border-radius:14px;background:var(--surface-2);min-width:0}
.rp-score>div:last-child{text-align:right;justify-items:end}
.rp-score i{font-style:normal;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rp-score em{font-style:normal;color:var(--muted);font-size:12px;text-align:center}
.rp-dots{display:flex;gap:4px}.rp-dots span{width:11px;height:11px;border-radius:50%;background:color-mix(in oklab,var(--muted) 30%,transparent);transition:background .3s,transform .3s}
.rp-dots span.on{background:#f59e0b;transform:scale(1.15)}
.rp-arena{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;min-height:230px;padding:18px 10px 34px;border-radius:20px;background:radial-gradient(circle at 50% 40%,#4c1d95,#1e1b4b);color:#fff;overflow:hidden;box-shadow:0 18px 36px -18px rgb(30 27 75/.7)}
.rp-hand{display:grid;justify-items:center;gap:6px;font-size:88px;line-height:1;transition:opacity .3s,transform .3s,filter .3s}
.rp-hand small{font-size:13px;font-weight:700;opacity:.9;max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rp-hand .e{display:inline-block}.rp-hand.l .e{transform:scaleX(-1) rotate(90deg)}.rp-hand.r .e{transform:rotate(-90deg)}
.rp-hand.l.shake .e{animation:rp-shl .35s ease-in-out infinite}.rp-hand.r.shake .e{animation:rp-shr .35s ease-in-out infinite}
@keyframes rp-shl{50%{transform:scaleX(-1) rotate(90deg) translateX(-26px)}}
@keyframes rp-shr{50%{transform:rotate(-90deg) translateX(-26px)}}
.rp-hand.show .e{animation:rp-in .35s cubic-bezier(.3,1.6,.6,1)}
@keyframes rp-in{from{scale:.4;opacity:.2}}
.rp-hand.won{filter:drop-shadow(0 0 18px #facc15)}.rp-hand.won .e{scale:1.12}
.rp-hand.lost{opacity:.4;filter:grayscale(.7)}
.rp-vs{font-weight:900;font-size:15px;opacity:.6}
.rp-call{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-weight:800;font-size:15px}
.rp-call.big{bottom:auto;top:12px;font-size:22px;letter-spacing:.02em;color:#fde68a;animation:rp-in .3s}
.rp-picks{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.rp-picks button{display:grid;justify-items:center;gap:2px;padding:12px 4px;border-radius:18px;border:2px solid var(--line);background:var(--surface);color:var(--ink);font-weight:700;font-size:13px;transition:transform .15s,border-color .2s,background .2s;touch-action:manipulation}
.rp-picks button span{font-size:44px;line-height:1.1}
.rp-picks button:not(:disabled):hover{border-color:var(--brand);transform:translateY(-3px)}
.rp-picks button:not(:disabled):active{transform:scale(.93)}
.rp-picks button:disabled{opacity:.45}.rp-picks button.sel{opacity:1;border-color:var(--brand);background:color-mix(in oklab,var(--brand) 14%,var(--surface))}
.rp-over{position:absolute;inset:0;z-index:5;display:grid;place-items:center;text-align:center;color:#fff;border-radius:20px;background:rgb(15 12 45/.8);backdrop-filter:blur(2px);animation:rp-fade .3s;padding:16px}
@keyframes rp-fade{from{opacity:0}}
.rp-react{position:absolute;left:50%;top:30%;transform:translateX(-50%);z-index:6;font-size:64px;pointer-events:none;animation:rp-in .5s}
.rp .seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:3px;padding:3px;border-radius:12px;background:var(--surface-2)}
.rp .seg button{border:0;background:none;color:var(--ink);padding:7px 4px;border-radius:9px;font-size:13px;font-weight:600}
.rp .seg button:disabled{opacity:.4;cursor:not-allowed}
.rp .seg button[aria-pressed=true]{background:var(--surface);color:var(--brand);box-shadow:0 1px 3px rgb(0 0 0/.15)}
.rp-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
@media (prefers-reduced-motion:reduce){.rp *{animation:none!important;transition:none!important}}
`;

/**
 * Rock-Paper-Scissors, best of 3 or 5: the computer (Easy = random, Smart = learns your habits),
 * a friend on one phone (picks stay hidden while you pass it), or a friend online (the server keeps
 * each hand secret until both have picked).
 */
@Component({
  selector: 'app-rps-tool',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="rp">
      <p class="rp-status" aria-live="polite">{{ status() }}</p>

      <div class="rp-score" aria-label="Score">
        <div><i>{{ leftName() }}</i><span class="rp-dots">@for (d of dots(); track $index) { <span [class.on]="d < wins().l"></span> }</span></div>
        <em>Best of {{ best() }}@if (matches(); as m) {<br />Matches {{ m }}}</em>
        <div><i>{{ rightName() }}</i><span class="rp-dots">@for (d of dots(); track $index) { <span [class.on]="d < wins().r"></span> }</span></div>
      </div>

      <div class="rp-arena" #arena>
        <div class="rp-hand l" [class.shake]="phase() === 'shoot'" [class.show]="phase() === 'show'" [class.won]="phase() === 'show' && shown()?.w === 'l'" [class.lost]="phase() === 'show' && shown()?.w === 'r'">
          <span class="e">{{ phase() === 'show' && shown() ? icon(shown()!.l) : '✊' }}</span><small>{{ leftName() }}</small>
        </div>
        <span class="rp-vs">VS</span>
        <div class="rp-hand r" [class.shake]="phase() === 'shoot'" [class.show]="phase() === 'show'" [class.won]="phase() === 'show' && shown()?.w === 'r'" [class.lost]="phase() === 'show' && shown()?.w === 'l'">
          <span class="e">{{ phase() === 'show' && shown() ? icon(shown()!.r) : '✊' }}</span><small>{{ rightName() }}</small>
        </div>
        @if (phase() === 'shoot') { <p class="rp-call big">{{ call() }}</p> }
        @else if (phase() === 'show' && shown(); as s) { <p class="rp-call">{{ s.w ? why(s) : 'Same hand — a tie! Go again.' }}</p> }
        @else if (waitText()) { <p class="rp-call">{{ waitText() }}</p> }

        @if (reaction(); as e) { <div class="rp-react">{{ e }}</div> }
        @if (mode() === 'local' && pass()) {
          <div class="rp-over"><div class="grid justify-items-center gap-3">
            <p class="text-xl font-extrabold">Player 1 has picked 🤫</p>
            <p class="text-sm opacity-90">Give the phone to Player 2 — no peeking!</p>
            <button type="button" class="btn-primary" (click)="pass.set(false)">I’m Player 2 — ready</button>
          </div></div>
        } @else if (mode() === 'online' && online.room()?.status === 'waiting') {
          <div class="rp-over"><div class="grid justify-items-center gap-2">
            <p class="text-lg font-extrabold">Waiting for your friend…</p>
            @if (online.qr()) { <img [src]="online.qr()" alt="QR code to join this game" width="130" height="130" style="border-radius:12px;background:#fff;padding:5px" /> }
            <p class="text-xs opacity-90">They tap the link or scan this — the game starts by itself.</p>
            <div class="rp-row">
              <button type="button" class="btn-primary" (click)="online.share()">📤 Share link</button>
              <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="copy()">Copy</button>
              <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="online.cancel()">Cancel</button>
            </div>
          </div></div>
        } @else if (online.joining(); as host) {
          <div class="rp-over"><p class="text-lg font-extrabold">Joining {{ host }}’s game…</p></div>
        } @else if (mode() === 'online' && online.err() && !online.room()) {
          <div class="rp-over"><div class="grid justify-items-center gap-3">
            <p class="text-lg font-extrabold">{{ online.err() }}</p>
            <div class="rp-row">
              <button type="button" class="btn-primary" (click)="online.err.set(''); invite()">👥 Start my own game</button>
              <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="setMode('cpu')">🤖 Play the computer</button>
            </div>
          </div></div>
        } @else if (result(); as r) {
          <div class="rp-over"><div>
            <p class="text-3xl font-extrabold">{{ r.title }}</p>
            <p class="mt-1 text-sm opacity-90">{{ r.sub }}</p>
            <div class="rp-row mt-3">
              @if (mode() === 'online') {
                <button type="button" class="btn-primary" (click)="online.act('rematch')">Rematch</button>
                <button type="button" class="btn-ghost bg-white/90 text-slate-900" (click)="setMode('cpu')">Leave</button>
              } @else {
                <button type="button" class="btn-primary" (click)="newMatch()">Play again</button>
              }
            </div>
          </div></div>
        }
      </div>

      <div class="rp-picks" role="group" aria-label="Pick your hand">
        @for (h of hands; track h) {
          <button type="button" [class.sel]="picked() === h" [disabled]="!canPick()" [attr.aria-label]="name(h)" (click)="pick(h)"><span>{{ icon(h) }}</span>{{ name(h) }}</button>
        }
      </div>

      @if (mode() === 'online' && online.room()?.status === 'playing') {
        <div class="rp-row">
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
      @if (locked()) { <p class="text-center text-xs text-muted">🔒 Game in progress — finish it, or tap {{ mode() === 'online' ? 'Leave online game' : 'New match' }} to switch.</p> }
      @if (mode() === 'cpu') {
        <div class="seg" role="group" aria-label="Computer level">
          <button type="button" [attr.aria-pressed]="!smart()" (click)="setSmart(false)">Easy · random</button>
          <button type="button" [attr.aria-pressed]="smart()" (click)="setSmart(true)">Smart · learns your habits</button>
        </div>
      }
      @if (!online.room()) {
        <div class="seg" role="group" aria-label="Match length">
          <button type="button" [attr.aria-pressed]="localBest() === 3" (click)="setBest(3)">Best of 3</button>
          <button type="button" [attr.aria-pressed]="localBest() === 5" (click)="setBest(5)">Best of 5</button>
        </div>
      }
      <div class="rp-row">
        @if (mode() !== 'online') { <button type="button" class="btn-ghost" (click)="newMatch()">↻ New match</button> }
        @if (!online.room()) { <button type="button" class="btn-primary" [disabled]="online.busy()" (click)="invite()">👥 Invite a friend online</button> }
        @else { <button type="button" class="btn-ghost" (click)="setMode('cpu')">Leave online game</button> }
      </div>
    </div>
  `,
})
export class RpsTool implements OnDestroy {
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly arenaEl = viewChild<ElementRef<HTMLElement>>('arena');
  private readonly fx = new GameFx();
  protected readonly hands = HANDS;
  protected readonly emojis = ['👍', '😮', '😂', '👏', '🙏', '🔥'];

  protected readonly mode = signal<Mode>('cpu');
  protected readonly smart = signal(true);
  protected readonly localBest = signal(3);
  /** Computer / one-phone rounds; 'a' = you (or Player 1), 'b' = computer (or Player 2). */
  private readonly rounds = signal<Round[]>([]);
  /** One phone: Player 1's hidden hand while Player 2 picks. */
  private readonly first = signal<Hand | null>(null);
  protected readonly pass = signal(false);
  private readonly tally = signal({ a: 0, b: 0 });
  /** 'pick' → 'shoot' (countdown) → 'show' (both hands). */
  protected readonly phase = signal<'pick' | 'shoot' | 'show'>('pick');
  protected readonly call = signal('');
  /** The round on screen, from this phone's side: l = me / Player 1, r = them. */
  protected readonly shown = signal<{ l: Hand; r: Hand; w: 'l' | 'r' | null } | null>(null);
  /** How many rounds have been revealed (the result waits for the animation). */
  private readonly revealed = signal(0);
  protected readonly reaction = signal<string | null>(null);
  private timers: ReturnType<typeof setTimeout>[] = [];
  private reactTimer?: ReturnType<typeof setTimeout>;
  /** Your past hands, for the Smart computer. */
  private history: Hand[] = [];

  protected readonly online: OnlineRoom = new OnlineRoom(
    'rps',
    inject(Router),
    (prev, next) => this.onRoom(prev, next),
    (e) => this.showReaction(e),
    () => this.canPick(),
  );

  protected readonly best = computed<number>(() => this.online.room()?.best ?? this.localBest());
  private readonly need = computed(() => Math.ceil(this.best() / 2));
  protected readonly dots = computed(() => Array.from({ length: this.need() }, (_, i) => i));
  /** Rounds from this phone's side, only those already revealed. */
  private readonly myRounds = computed(() => {
    const r = this.online.room();
    if (this.mode() === 'online') {
      if (!r?.rounds || !r.me) return [];
      const me = r.me, op: Side = me === 'a' ? 'b' : 'a';
      return r.rounds.slice(0, this.revealed()).map((x) => ({ l: x[me], r: x[op], w: x.w === me ? 'l' : x.w ? 'r' : null }));
    }
    return this.rounds().slice(0, this.revealed()).map((x) => ({ l: x.a, r: x.b, w: x.w === 'a' ? 'l' : x.w ? 'r' : null }));
  });
  protected readonly wins = computed(() => {
    const rs = this.myRounds();
    return { l: rs.filter((x) => x.w === 'l').length, r: rs.filter((x) => x.w === 'r').length };
  });
  private readonly matchDone = computed(() => this.phase() !== 'shoot' && Math.max(this.wins().l, this.wins().r) >= this.need());

  protected readonly picked = computed<Hand | null>(() => (this.mode() === 'online' ? (this.online.room()?.mine ?? null) : null));
  protected readonly locked = computed<boolean>(() => {
    const r = this.online.room();
    if (this.mode() === 'online') return !!r && (r.status === 'waiting' || r.status === 'playing');
    return (this.rounds().length > 0 || !!this.first()) && !this.matchDone();
  });
  protected readonly canPick = computed<boolean>(() => {
    if (this.phase() === 'shoot' || this.pass()) return false;
    if (this.mode() === 'online') {
      const r = this.online.room();
      return r?.status === 'playing' && !r.mine && this.revealed() >= (r.rounds?.length ?? 0);
    }
    return !this.matchDone();
  });
  protected readonly oppAway = computed(() => this.online.room()?.players[this.online.oppSeat()]?.away ?? 0);

  protected readonly leftName = computed(() => {
    if (this.mode() === 'online') return this.online.room() ? this.online.myName() + ' (you)' : 'You';
    return this.mode() === 'local' ? 'Player 1' : 'You';
  });
  protected readonly rightName = computed(() => {
    if (this.mode() === 'online') return this.online.room() ? this.online.oppName() : 'Friend';
    return this.mode() === 'local' ? 'Player 2' : 'Computer';
  });
  protected readonly matches = computed(() => {
    let l: number, r: number;
    const room = this.online.room();
    if (this.mode() === 'online') {
      if (!room?.me) return '';
      l = room.score[room.me];
      r = room.score[room.me === 'a' ? 'b' : 'a'];
    } else ({ a: l, b: r } = this.tally());
    return l + r ? `${l} – ${r}` : '';
  });

  protected readonly result = computed(() => {
    const { l, r } = this.wins(), score = `${Math.max(l, r)}–${Math.min(l, r)}`;
    if (this.mode() === 'online') {
      const room = this.online.room();
      if (!room?.result || this.revealed() < (room.rounds?.length ?? 0)) return null;
      const opp = this.online.oppName(), won = room.result.winner === room.me;
      if (room.result.kind === 'resign') return won ? { title: 'You won! 🎉', sub: `${opp} resigned.` } : { title: `${opp} won the match`, sub: 'You resigned.' };
      if (room.result.kind === 'left') return won ? { title: 'You won! 🎉', sub: `${opp} left the game.` } : { title: `${opp} won the match`, sub: 'You were away too long.' };
      return won ? { title: 'You won! 🎉', sub: `You beat ${opp} ${score}.` } : { title: `${opp} won the match`, sub: `${score} — tap Rematch for another go.` };
    }
    if (!this.matchDone()) return null;
    if (this.mode() === 'local') return { title: `${l > r ? 'Player 1' : 'Player 2'} wins! 🎉`, sub: `Won the match ${score}.` };
    return l > r ? { title: 'You won! 🎉', sub: `You beat the computer ${score}.` } : { title: 'Computer wins', sub: `${score} — ${this.smart() ? 'it spotted a habit. Mix it up!' : 'try again!'}` };
  });

  protected readonly waitText = computed(() => {
    if (this.mode() !== 'online') return '';
    const r = this.online.room();
    if (r?.status !== 'playing' || this.phase() === 'shoot') return '';
    const opp = this.online.oppName(), theyPicked = r.picked?.[this.online.oppSeat()];
    if (r.mine) return `You picked ${ICON[r.mine]} — waiting for ${opp}…`;
    if (this.phase() === 'show') return '';
    return theyPicked ? `${opp} has picked ✓ — your turn!` : '';
  });

  protected readonly status = computed(() => {
    if (this.phase() === 'shoot') return this.call();
    const res = this.result();
    if (res) return res.title;
    if (this.mode() === 'online') {
      const r = this.online.room();
      if (!r) return '🔗 Play a friend on their own phone';
      if (r.status === 'waiting') return 'Waiting for your friend to join…';
      if (r.mine) return `⏳ Waiting for ${this.online.oppName()}`;
      return r.picked?.[this.online.oppSeat()] ? `🟢 Your pick — ${this.online.oppName()} is ready ✓` : '🟢 Pick your hand';
    }
    if (this.mode() === 'local') return this.first() ? 'Player 2 — pick your hand' : 'Player 1 — pick your hand (keep it secret)';
    return '🟢 Pick your hand';
  });

  constructor() {
    if (typeof document !== 'undefined' && !document.getElementById('rp-css')) {
      const st = document.createElement('style');
      st.id = 'rp-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    afterNextRender(() => {
      try {
        const p = JSON.parse(localStorage.getItem('rps-prefs') ?? '{}');
        if (p.best === 5) this.localBest.set(5);
        if (p.smart === false) this.smart.set(false);
      } catch {}
      const id = new URLSearchParams(location.search).get('room');
      if (id && /^[a-z0-9]{8}$/.test(id)) {
        this.mode.set('online');
        this.online.open(id);
        this.arenaInView();
      }
    });
  }

  ngOnDestroy() {
    this.online.stop();
    this.clearTimers();
    clearTimeout(this.reactTimer);
  }

  protected icon(h: Hand) {
    return ICON[h];
  }
  protected name(h: Hand) {
    return NAME[h];
  }
  protected why(s: { l: Hand; r: Hand; w: 'l' | 'r' | null }) {
    return WHY[s.w === 'l' ? s.l : s.r];
  }

  protected pick(h: Hand) {
    if (!this.canPick()) return;
    this.fx.unlock();
    this.fx.pop();
    if (this.mode() === 'online') {
      const r = this.online.room()!;
      this.online.room.set({ ...r, mine: h }); // shows at once; the server keeps it hidden from the friend
      this.phase.set('pick');
      this.online.act('pick', { hand: h });
      return;
    }
    if (this.matchDone() || this.phase() === 'show') this.phase.set('pick');
    if (this.mode() === 'local') {
      if (!this.first()) {
        this.first.set(h);
        this.pass.set(true);
        this.shown.set(null);
        return;
      }
      const a = this.first()!;
      this.first.set(null);
      return this.addRound(a, h);
    }
    const c = this.computerHand();
    this.history.push(h);
    this.addRound(h, c);
  }

  private addRound(a: Hand, b: Hand) {
    const round: Round = { a, b, w: judge(a, b) };
    this.rounds.update((rs) => [...rs, round]);
    this.reveal({ l: a, r: b, w: round.w === 'a' ? 'l' : round.w ? 'r' : null }, () => {
      if (this.matchDone()) {
        const { l } = this.wins(), youWon = l >= this.need();
        this.tally.update((t) => (youWon ? { ...t, a: t.a + 1 } : { ...t, b: t.b + 1 }));
        this.celebrate(this.mode() === 'local' || youWon);
      }
    });
  }

  /** "Rock… Paper… Scissors… Shoot!" then both hands. */
  private reveal(s: { l: Hand; r: Hand; w: 'l' | 'r' | null }, done?: () => void) {
    this.clearTimers();
    const fast = reducedMotion(), beat = fast ? 0 : 330;
    this.phase.set('shoot');
    const words = ['Rock…', 'Paper…', 'Scissors…'];
    words.forEach((w, i) => this.later(i * beat, () => {
      this.call.set(w);
      this.fx.tik();
    }));
    this.later(words.length * beat, () => {
      this.call.set('Shoot!');
      this.fx.whoosh();
    });
    this.later(words.length * beat + (fast ? 0 : 220), () => {
      this.shown.set(s);
      this.phase.set('show');
      this.revealed.update((n) => n + 1);
      if (s.w === 'l') this.fx.chime();
      else if (s.w === 'r') this.fx.thud();
      else this.fx.soft();
      done?.();
    });
  }

  private celebrate(win: boolean) {
    if (win) {
      this.later(350, () => {
        this.fx.win();
        const el = this.arenaEl()?.nativeElement;
        if (el) confetti(el);
      });
    } else this.later(350, () => this.fx.tadum());
  }

  private later(ms: number, f: () => void) {
    this.timers.push(setTimeout(f, ms));
  }
  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  /** Easy: random. Smart: guesses your next hand from what you usually play after your last one. */
  private computerHand(): Hand {
    const rand = HANDS[Math.floor(Math.random() * 3)];
    const h = this.history;
    if (!this.smart() || h.length < 2 || Math.random() < 0.25) return rand;
    const last = h[h.length - 1], next: Record<Hand, number> = { r: 0, p: 0, s: 0 };
    for (let i = 1; i < h.length; i++) next[h[i]] += h[i - 1] === last ? 3 : 1; // recent pattern counts more
    const guess = HANDS.reduce((x, y) => (next[y] > next[x] ? y : x));
    if (next[guess] === 0) return rand;
    return HANDS.find((x) => BEATS[x] === guess)!; // the hand that beats their guess
  }

  // --- matches, modes, settings ---

  protected newMatch() {
    this.clearTimers();
    this.rounds.set([]);
    this.revealed.set(0);
    this.first.set(null);
    this.pass.set(false);
    this.shown.set(null);
    this.phase.set('pick');
  }

  protected setMode(m: Mode) {
    if (this.mode() === 'online' && m !== 'online') this.online.leave();
    this.mode.set(m);
    this.tally.set({ a: 0, b: 0 });
    this.newMatch();
  }

  protected setSmart(v: boolean) {
    this.smart.set(v);
    this.savePrefs();
    this.tally.set({ a: 0, b: 0 });
    this.newMatch();
  }

  protected setBest(n: number) {
    this.localBest.set(n);
    this.savePrefs();
    this.tally.set({ a: 0, b: 0 });
    this.newMatch();
  }

  private savePrefs() {
    try {
      localStorage.setItem('rps-prefs', JSON.stringify({ best: this.localBest(), smart: this.smart() }));
    } catch {}
  }

  // --- online ---

  protected async invite() {
    if (this.mode() !== 'online' && this.locked() && !(await this.dialog.confirm({ title: 'Play a friend online?', message: 'Your current match will end and a new online game starts.', confirmText: 'Invite a friend' }))) return;
    let name = this.online.name().trim();
    if (name.length < 2 || name === 'Friend') {
      const v = await this.dialog.prompt({ title: 'Invite a friend', message: 'Your friend will see this name.', label: 'Your name', placeholder: 'e.g. Jay', confirmText: 'Create invite', validate: (x) => (x.trim().length < 2 ? 'Please type at least 2 letters.' : null) });
      if (!v) return;
      name = v.trim();
      this.online.name.set(name);
    }
    this.mode.set('online');
    this.newMatch();
    if (await this.online.create({ best: this.localBest() })) {
      this.arenaInView();
      this.online.share();
    }
  }

  private onRoom(prev: PlayRoom | null, next: PlayRoom) {
    const n = next.rounds?.length ?? 0;
    // first look at a game (or a new rematch): everything so far counts as already seen
    if (!prev || prev.game !== next.game) {
      this.clearTimers();
      this.revealed.set(n);
      this.shown.set(null);
      this.phase.set('pick');
      if (prev && prev.game !== next.game) this.fx.chime();
      return;
    }
    if (prev.status === 'waiting' && next.status === 'playing') this.fx.chime();
    const theirs = this.online.oppSeat();
    if (!prev.picked?.[theirs] && next.picked?.[theirs] && !next.mine && this.fx.on) navigator.vibrate?.(20);
    if (n > this.revealed() && this.phase() !== 'shoot') {
      const x = next.rounds![n - 1], me = next.me!;
      this.revealed.set(n - 1); // older rounds (if the phone was away) count as seen; animate the newest
      this.reveal({ l: x[me], r: x[theirs], w: x.w === me ? 'l' : x.w ? 'r' : null }, () => {
        if (next.status === 'over') this.celebrate(next.result?.winner === me);
      });
      return;
    }
    if (prev.status !== 'over' && next.status === 'over' && next.result?.kind !== 'win') this.celebrate(next.result?.winner === next.me);
  }

  protected async resign() {
    if (!(await this.dialog.confirm({ title: 'Resign this match?', message: 'Your friend wins this match. You can ask for a rematch.', confirmText: 'Resign', tone: 'danger' }))) return;
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

  private arenaInView() {
    setTimeout(() => this.arenaEl()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  }
}
