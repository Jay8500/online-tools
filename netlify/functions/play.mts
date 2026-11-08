import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

/**
 * Online games with a friend for Tic-Tac-Toe and Rock-Paper-Scissors (invite link / QR, no sign-up).
 * Seats: 'a' = the one who invited, 'b' = the friend. Every move is checked here.
 *  GET  /api/play?id=ROOM&t=TOKEN                      → room (marks this player as seen)
 *  POST /api/play { a: 'create', kind: 'ttt'|'rps', name, size?, best? } → { id, token, seat }
 *       { a: 'join', id, name, t? }                     → { token, seat }
 *       { a: 'move', id, t, cell }          (ttt)      → room
 *       { a: 'pick', id, t, hand: r|p|s }   (rps)      → room   (the other hand stays hidden until both have picked)
 *       { a: 'resign' | 'cancel' | 'claim' | 'rematch', id, t } → room
 *       { a: 'react', id, t, e }                        → room   (fixed emojis only — no chat)
 * Rooms live 24 hours; 40 new rooms per IP per day; rude names become "Player".
 */
type Seat = 'a' | 'b';
type Hand = 'r' | 'p' | 's';
interface Player {
  name: string;
  token: string;
  seen: number;
}
interface Room {
  id: string;
  kind: 'ttt' | 'rps';
  created: number;
  status: 'waiting' | 'playing' | 'over' | 'cancelled';
  players: Partial<Record<Seat, Player>>;
  result: { kind: 'win' | 'draw' | 'resign' | 'left'; winner?: Seat } | null;
  /** Match score across rematches. */
  score: { a: number; b: number; d: number };
  events: { n: number; by: Seat; e: string }[];
  ev: number;
  game: number;
  rev?: number;
  // Tic-Tac-Toe
  size?: number;
  board?: string;
  xSeat?: Seat;
  line?: number[];
  // Rock-Paper-Scissors
  best?: number;
  picks?: Partial<Record<Seat, Hand>>;
  rounds?: { a: Hand; b: Hand; w: Seat | null }[];
}

const TTL = 24 * 3600_000;
const AWAY = 90_000;
const EMOJI = ['👍', '😮', '😂', '👏', '🙏', '🔥'];
const BAD = /fuck|shit|bitch|sex|porn|dick|pussy|bastard|madarchod|bhenchod|chutiya|lanja|dengu|gandu|randi|lund|boothu|kutta/i;
const ORIGIN = /^https:\/\/(tools\.spreadapps\.in|[a-z0-9-]+--spreadapps-tools\.netlify\.app|spreadapps-tools\.netlify\.app)$/;
const BEATS: Record<Hand, Hand> = { r: 's', p: 'r', s: 'p' };

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'play', consistency: 'strong' });
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const room = await load(store, url.searchParams.get('id'));
    if (!room) return json({ error: 'gone' }, 410);
    const me = who(room, url.searchParams.get('t'));
    if (me) {
      room.players[me]!.seen = Date.now();
      await save(store, room);
    }
    return json(view(room, me), 200, { 'Cache-Control': 'no-store' });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const origin = req.headers.get('origin') ?? '';
  if (origin && !ORIGIN.test(origin)) return json({ error: 'Forbidden' }, 403);
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  const a = String(b['a'] ?? '');

  if (a === 'create') {
    const kind = b['kind'] === 'rps' ? 'rps' : b['kind'] === 'ttt' ? 'ttt' : null;
    if (!kind) return json({ error: 'Unknown game' }, 400);
    const day = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
    const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
    const seen = getStore({ name: 'seen', consistency: 'strong' });
    const key = `${day}/play-${await sha256(`${ip}|play|${day}`)}`;
    const n = Number((await seen.get(key)) ?? 0);
    if (n >= 40) return json({ error: 'Too many games today. Please try tomorrow.' }, 429);
    await seen.set(key, String(n + 1));
    const room: Room = { id: rid(), kind, created: Date.now(), status: 'waiting', players: { a: { name: clean(b['name']), token: tok(), seen: Date.now() } }, result: null, score: { a: 0, b: 0, d: 0 }, events: [], ev: 0, game: 1 };
    if (kind === 'ttt') {
      room.size = b['size'] === 4 ? 4 : 3;
      room.board = '.'.repeat(room.size * room.size);
      room.xSeat = Math.random() < 0.5 ? 'a' : 'b';
      room.line = [];
    } else {
      room.best = b['best'] === 5 ? 5 : 3;
      room.picks = {};
      room.rounds = [];
    }
    await save(store, room);
    return json({ id: room.id, token: room.players.a!.token, seat: 'a' });
  }

  const room = await load(store, String(b['id'] ?? ''));
  if (!room) return json({ error: 'This game link has expired.' }, 410);

  if (a === 'join') {
    const known = who(room, String(b['t'] ?? ''));
    if (known) return json({ token: room.players[known]!.token, seat: known });
    if (room.status !== 'waiting') return json({ error: room.status === 'cancelled' ? 'This invite was cancelled.' : 'This game already has two players.' }, 409);
    room.players.b = { name: clean(b['name']), token: tok(), seen: Date.now() };
    room.status = 'playing';
    await save(store, room);
    return json({ token: room.players.b.token, seat: 'b' });
  }

  const me = who(room, String(b['t'] ?? ''));
  if (!me) return json({ error: 'Not a player in this game.' }, 403);
  room.players[me]!.seen = Date.now();
  const them: Seat = me === 'a' ? 'b' : 'a';

  switch (a) {
    case 'move': {
      if (room.kind !== 'ttt' || room.status !== 'playing') return json({ error: 'The game is not running.', state: view(room, me) }, 409);
      const size = room.size!, cells = room.board!.split('');
      const turnMark = cells.filter((c) => c !== '.').length % 2 === 0 ? 'X' : 'O';
      const myMark = room.xSeat === me ? 'X' : 'O';
      const cell = Number(b['cell']);
      if (turnMark !== myMark) return json({ error: 'Not your turn', state: view(room, me) }, 409);
      if (!Number.isInteger(cell) || cell < 0 || cell >= size * size || cells[cell] !== '.') return json({ error: 'That square is taken', state: view(room, me) }, 409);
      cells[cell] = myMark;
      room.board = cells.join('');
      const line = winLine(cells, size);
      if (line) {
        room.line = line;
        finish(room, { kind: 'win', winner: me });
      } else if (!cells.includes('.')) finish(room, { kind: 'draw' });
      break;
    }
    case 'pick': {
      if (room.kind !== 'rps' || room.status !== 'playing') return json({ error: 'The game is not running.', state: view(room, me) }, 409);
      const hand = String(b['hand']) as Hand;
      if (!['r', 'p', 's'].includes(hand) || room.picks![me]) return json({ error: 'Already picked', state: view(room, me) }, 409);
      room.picks![me] = hand;
      const pa = room.picks!.a, pb = room.picks!.b;
      if (pa && pb) {
        const w: Seat | null = pa === pb ? null : BEATS[pa] === pb ? 'a' : 'b';
        room.rounds!.push({ a: pa, b: pb, w });
        room.picks = {};
        const need = Math.ceil(room.best! / 2);
        const wins = (s: Seat) => room.rounds!.filter((r) => r.w === s).length;
        if (wins('a') >= need) finish(room, { kind: 'win', winner: 'a' });
        else if (wins('b') >= need) finish(room, { kind: 'win', winner: 'b' });
      }
      break;
    }
    case 'resign':
      if (room.status === 'playing') finish(room, { kind: 'resign', winner: them });
      break;
    case 'cancel':
      if (room.status === 'waiting') room.status = 'cancelled';
      break;
    case 'claim': {
      const away = Date.now() - (room.players[them]?.seen ?? 0);
      if (room.status === 'playing' && away > AWAY) finish(room, { kind: 'left', winner: me });
      break;
    }
    case 'rematch':
      if (room.status !== 'over' || !room.players.a || !room.players.b) break;
      room.status = 'playing';
      room.result = null;
      room.game++;
      if (room.kind === 'ttt') {
        room.board = '.'.repeat(room.size! * room.size!);
        room.line = [];
        room.xSeat = room.xSeat === 'a' ? 'b' : 'a'; // the other player starts
      } else {
        room.picks = {};
        room.rounds = [];
      }
      break;
    case 'react': {
      const e = String(b['e'] ?? '');
      if (!EMOJI.includes(e)) return json({ error: 'Unknown reaction' }, 400);
      room.events = [...room.events.slice(-9), { n: ++room.ev, by: me, e }];
      break;
    }
    default:
      return json({ error: 'Unknown action' }, 400);
  }
  await save(store, room);
  return json(view(room, me));
};

function finish(room: Room, r: Room['result']) {
  room.status = 'over';
  room.result = r;
  if (r?.winner) room.score[r.winner]++;
  else room.score.d++;
}

/** Winning line (cell indexes) for 3 in a row on 3×3 or 4 in a row on 4×4, else null. */
function winLine(c: string[], size: number): number[] | null {
  const lines: number[][] = [];
  for (let i = 0; i < size; i++) {
    lines.push(Array.from({ length: size }, (_, j) => i * size + j));
    lines.push(Array.from({ length: size }, (_, j) => j * size + i));
  }
  lines.push(Array.from({ length: size }, (_, j) => j * size + j));
  lines.push(Array.from({ length: size }, (_, j) => j * size + (size - 1 - j)));
  return lines.find((l) => c[l[0]] !== '.' && l.every((k) => c[k] === c[l[0]])) ?? null;
}

function who(room: Room, t: string | null): Seat | null {
  if (!t) return null;
  return room.players.a?.token === t ? 'a' : room.players.b?.token === t ? 'b' : null;
}

/** What a phone may see: never tokens, and never the other player's hand before both have picked. */
function view(room: Room, me: Seat | null) {
  const now = Date.now();
  const p = (s: Seat) => (room.players[s] ? { name: room.players[s]!.name, away: Math.round((now - room.players[s]!.seen) / 1000) } : null);
  const base = { id: room.id, kind: room.kind, status: room.status, me, players: { a: p('a'), b: p('b') }, result: room.result, score: room.score, events: room.events, game: room.game, rev: room.rev ?? 0 };
  if (room.kind === 'ttt') return { ...base, size: room.size, board: room.board, xSeat: room.xSeat, line: room.line ?? [] };
  return { ...base, best: room.best, rounds: room.rounds ?? [], picked: { a: !!room.picks?.a, b: !!room.picks?.b }, mine: me ? (room.picks?.[me] ?? null) : null };
}

async function load(store: ReturnType<typeof getStore>, id: string | null): Promise<Room | null> {
  if (!id || !/^[a-z0-9]{8}$/.test(id)) return null;
  const room = (await store.get(`r/${id}`, { type: 'json' })) as Room | null;
  if (!room || Date.now() - room.created > TTL) return null;
  return room;
}

function save(store: ReturnType<typeof getStore>, room: Room) {
  room.rev = (room.rev ?? 0) + 1;
  return store.setJSON(`r/${room.id}`, room);
}

function clean(v: unknown) {
  const s = String(v ?? '').replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  return s.length < 2 || BAD.test(s.replace(/[\s._-]/g, '')) ? 'Player' : s;
}

function rid() {
  const a = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => a[x % a.length]).join('');
}

function tok() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (x) => x.toString(16).padStart(2, '0')).join('');
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (x) => x.toString(16).padStart(2, '0')).join('');
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

export const config: Config = { path: '/api/play' };
