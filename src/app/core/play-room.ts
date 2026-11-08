import { computed, signal } from '@angular/core';
import { Router } from '@angular/router';

/** Room as the server sends it (netlify/functions/play.mts). Seat 'a' invited, 'b' joined. */
export type Seat = 'a' | 'b';
export interface PlayRoom {
  id: string;
  kind: 'ttt' | 'rps';
  status: 'waiting' | 'playing' | 'over' | 'cancelled';
  me: Seat | null;
  players: Record<Seat, { name: string; away: number } | null>;
  result: { kind: 'win' | 'draw' | 'resign' | 'left'; winner?: Seat } | null;
  score: { a: number; b: number; d: number };
  events: { n: number; by: Seat; e: string }[];
  game: number;
  rev: number;
  // Tic-Tac-Toe
  size?: number;
  board?: string;
  xSeat?: Seat;
  line?: number[];
  // Rock-Paper-Scissors
  best?: number;
  rounds?: { a: 'r' | 'p' | 's'; b: 'r' | 'p' | 's'; w: Seat | null }[];
  picked?: Record<Seat, boolean>;
  mine?: 'r' | 'p' | 's' | null;
}

const PATH: Record<PlayRoom['kind'], string> = { ttt: 'games/tic-tac-toe', rps: 'games/rock-paper-scissors' };

/**
 * Invite-a-friend plumbing shared by the small games: create / join / poll / act, QR and share.
 * Polls quickly while waiting for the friend, slowly otherwise, never in a background tab; an older
 * answer that arrives late never replaces a newer one.
 */
export class OnlineRoom {
  readonly room = signal<PlayRoom | null>(null);
  readonly err = signal('');
  readonly busy = signal(false);
  /** Opening someone's link: their name while this phone joins by itself. */
  readonly joining = signal<string | null>(null);
  readonly qr = signal('');
  readonly name = signal('');
  readonly oppSeat = computed<Seat>(() => (this.room()?.me === 'b' ? 'a' : 'b'));
  readonly oppName = computed(() => this.room()?.players[this.oppSeat()]?.name ?? 'Your friend');
  readonly myName = computed(() => this.room()?.players[this.room()?.me ?? 'a']?.name ?? 'You');
  /** Known as soon as the game is created (before the first answer from the server). */
  private readonly roomId = signal('');
  readonly inviteUrl = computed(() => (this.roomId() ? `https://tools.spreadapps.in/${PATH[this.kind]}?room=${this.roomId()}` : ''));
  private token = '';
  private id = '';
  private timer?: ReturnType<typeof setTimeout>;
  private lastEv = 0;
  private since = 0;

  constructor(
    private readonly kind: PlayRoom['kind'],
    private readonly router: Router,
    /** Called after every new state, with the one before it. */
    private readonly changed: (prev: PlayRoom | null, next: PlayRoom) => void,
    /** The friend sent an emoji. */
    private readonly reacted: (e: string) => void,
    /** True while it is this phone's turn (polls slower then). */
    private readonly myTurn: () => boolean,
  ) {
    try {
      this.name.set(localStorage.getItem('chess-name') ?? '');
    } catch {}
  }

  private async api(body: Record<string, unknown>) {
    const r = await fetch('/api/play', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    return { ok: r.ok, j };
  }

  private remember() {
    const n = this.name().trim();
    if (n === 'Friend' || n.length < 2) return; // the stand-in name for a quick join is not theirs
    try {
      localStorage.setItem('chess-name', n);
    } catch {}
  }

  async create(opts: Record<string, unknown>) {
    this.err.set('');
    this.busy.set(true);
    this.remember();
    try {
      const { ok, j } = await this.api({ a: 'create', kind: this.kind, name: this.name(), ...opts });
      if (!ok) throw new Error(j.error);
      this.enter(j.id, j.token);
      return true;
    } catch (e) {
      this.err.set((e as Error).message || 'Could not create the game. Check your internet and try again.');
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  /** From an invite link: resume if this phone already plays here, else join straight away. */
  async open(id: string) {
    let token = '';
    try {
      token = localStorage.getItem(`${this.kind}-room-${id}`) ?? '';
    } catch {}
    if (token) return this.enter(id, token);
    try {
      const r = await fetch(`/api/play?id=${id}`);
      if (!r.ok) throw new Error();
      const v = (await r.json()) as PlayRoom;
      if (v.status !== 'waiting') return this.err.set(v.status === 'cancelled' ? 'This invite was cancelled.' : 'This game already has two players.');
      if (this.name().trim().length < 2) this.name.set('Friend');
      this.joining.set(v.players.a?.name ?? 'Your friend');
      const { ok, j } = await this.api({ a: 'join', id, name: this.name() });
      this.joining.set(null);
      if (!ok) return this.err.set(j.error || 'Could not join. Check your internet and try again.');
      this.remember();
      this.enter(id, j.token);
    } catch {
      this.joining.set(null);
      this.err.set('This game link has expired. Ask your friend for a new one.');
    }
  }

  private enter(id: string, token: string) {
    this.id = id;
    this.roomId.set(id);
    this.token = token;
    try {
      localStorage.setItem(`${this.kind}-room-${id}`, token);
    } catch {}
    this.router.navigate([], { queryParams: { room: id }, replaceUrl: true });
    this.lastEv = 0;
    this.poll(0);
    import('qrcode')
      .then((m) => ((m as unknown as { default?: typeof m }).default ?? m).toDataURL(`https://tools.spreadapps.in/${PATH[this.kind]}?room=${id}`, { margin: 1, width: 360 }))
      .then((u) => this.qr.set(u))
      .catch(() => undefined);
  }

  /** Send an action (move, pick, resign, rematch…) and show the answer. */
  async act(a: string, extra: Record<string, unknown> = {}) {
    if (!this.id) return;
    try {
      const { ok, j } = await this.api({ a, id: this.id, t: this.token, ...extra });
      if (ok) this.apply(j as PlayRoom);
      else if (j['state']) this.apply(j['state'] as PlayRoom, true);
      else if (j['error']) this.err.set(j['error']);
    } catch {
      this.err.set('That did not reach your friend. Check your internet.');
    }
    this.since = Date.now();
    this.poll(1500);
  }

  react(e: string) {
    return this.act('react', { e });
  }

  poll(delay: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      if (!this.id) return;
      if (document.visibilityState === 'visible') {
        try {
          const r = await fetch(`/api/play?id=${this.id}&t=${this.token}`);
          if (r.status === 410) {
            this.err.set('This game has ended or expired.');
            return;
          }
          if (r.ok) this.apply((await r.json()) as PlayRoom);
        } catch {}
      }
      this.poll(this.delay());
    }, delay);
  }

  private delay() {
    const r = this.room();
    if (!r || r.status === 'cancelled') return 8000;
    if (r.status === 'over') return 3000; // watching for a rematch
    if (r.status === 'waiting') return 2500;
    if (this.myTurn()) return 4000;
    const t = Date.now() - this.since;
    return t < 30_000 ? 1500 : t < 120_000 ? 3000 : 6000;
  }

  private apply(v: PlayRoom, force = false) {
    const prev = this.room();
    if (!force && prev && prev.id === v.id && v.rev < prev.rev) return; // older answer arriving late
    const fresh = v.events.filter((e) => e.n > this.lastEv);
    if (fresh.length) {
      const theirs = fresh.filter((e) => e.by !== v.me).at(-1);
      if (theirs && this.lastEv) this.reacted(theirs.e);
      this.lastEv = Math.max(...fresh.map((e) => e.n));
    }
    if (!this.lastEv) this.lastEv = Math.max(0, ...v.events.map((e) => e.n));
    if (!prev || prev.game !== v.game || JSON.stringify(prev.board ?? prev.rounds) !== JSON.stringify(v.board ?? v.rounds)) this.since = Date.now();
    this.room.set(v);
    this.changed(prev, v);
  }

  async share() {
    const url = this.inviteUrl();
    const what = this.kind === 'ttt' ? '⭕❌ Tic-Tac-Toe' : '✊✋✌️ Rock-Paper-Scissors';
    const text = `${what} — play with me on Spread Apps. Tap to join: ${url}`;
    try {
      if (navigator.share) return await navigator.share({ title: 'Play with me', text, url });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.inviteUrl());
      return true;
    } catch {
      return false;
    }
  }

  async cancel() {
    if (this.room()?.status === 'waiting') await this.act('cancel');
    this.leave();
  }

  leave() {
    clearTimeout(this.timer);
    this.id = '';
    this.roomId.set('');
    this.token = '';
    this.room.set(null);
    this.qr.set('');
    this.err.set('');
    this.joining.set(null);
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('room')) this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  stop() {
    clearTimeout(this.timer);
  }
}
