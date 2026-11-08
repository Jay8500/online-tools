import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';
import { Chess } from 'chess.js';

/**
 * Online chess with a friend (invite link / QR). No sign-up: a room holds two names and two secret
 * tokens. Every move is checked with chess.js here, so both phones always agree.
 *  GET  /api/chess?id=ROOM&t=TOKEN → room state (and marks this player as "seen")
 *  POST /api/chess { a: 'create', name }            → { id, token, color }
 *       { a: 'join', id, name }                      → { token, color }
 *       { a: 'move', id, t, ply, uci }               → state
 *       { a: 'resign' | 'draw' | 'cancel' | 'claim' | 'rematch', id, t } → state
 *       { a: 'react', id, t, e }                     → state   (a few fixed emojis — no chat, safe for kids)
 * Rooms live 24 hours. At most 40 new rooms per IP per day.
 */
type Color = 'w' | 'b';
interface Player {
  name: string;
  token: string;
  seen: number;
}
interface Room {
  id: string;
  created: number;
  status: 'waiting' | 'playing' | 'over' | 'cancelled';
  host: Color;
  players: Partial<Record<Color, Player>>;
  moves: string[];
  result: { kind: 'mate' | 'resign' | 'draw' | 'stalemate' | 'left'; winner?: Color } | null;
  drawOffer: Color | null;
  events: { n: number; by: Color; e: string }[];
  ev: number;
  game: number;
  /** Bumped on every save, so a phone can ignore an older answer that arrives late. */
  rev?: number;
}

const TTL = 24 * 3600_000;
const AWAY = 90_000; // opponent silent this long → the other player may claim the game
const EMOJI = ['👍', '😮', '😂', '👏', '🙏', '🔥'];
const BAD = /fuck|shit|bitch|sex|porn|dick|pussy|bastard|madarchod|bhenchod|chutiya|lanja|dengu|gandu|randi|lund|boothu|kutta/i;
const ORIGIN = /^https:\/\/(tools\.spreadapps\.in|[a-z0-9-]+--spreadapps-tools\.netlify\.app|spreadapps-tools\.netlify\.app)$/;

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'chess', consistency: 'strong' });
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
    const day = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
    const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
    const seen = getStore({ name: 'seen', consistency: 'strong' });
    const key = `${day}/chess-${await sha256(`${ip}|chess|${day}`)}`;
    const n = Number((await seen.get(key)) ?? 0);
    if (n >= 40) return json({ error: 'Too many games today. Please try tomorrow.' }, 429);
    await seen.set(key, String(n + 1));
    const host: Color = Math.random() < 0.5 ? 'w' : 'b';
    const room: Room = { id: rid(), created: Date.now(), status: 'waiting', host, players: { [host]: { name: clean(b['name']), token: tok(), seen: Date.now() } }, moves: [], result: null, drawOffer: null, events: [], ev: 0, game: 1 };
    await save(store, room);
    return json({ id: room.id, token: room.players[host]!.token, color: host });
  }

  const room = await load(store, String(b['id'] ?? ''));
  if (!room) return json({ error: 'This game link has expired.' }, 410);

  if (a === 'join') {
    const known = who(room, String(b['t'] ?? ''));
    if (known) return json({ token: room.players[known]!.token, color: known });
    if (room.status !== 'waiting') return json({ error: room.status === 'cancelled' ? 'This invite was cancelled.' : 'This game already has two players.' }, 409);
    const color: Color = room.host === 'w' ? 'b' : 'w';
    room.players[color] = { name: clean(b['name']), token: tok(), seen: Date.now() };
    room.status = 'playing';
    await save(store, room);
    return json({ token: room.players[color]!.token, color });
  }

  const me = who(room, String(b['t'] ?? ''));
  if (!me) return json({ error: 'Not a player in this game.' }, 403);
  room.players[me]!.seen = Date.now();
  const them: Color = me === 'w' ? 'b' : 'w';

  switch (a) {
    case 'move': {
      if (room.status !== 'playing') return json({ error: 'The game is not running.', state: view(room, me) }, 409);
      const ply = Number(b['ply']), uci = String(b['uci'] ?? '');
      if (ply !== room.moves.length || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return json({ error: 'Out of sync', state: view(room, me) }, 409);
      const c = replay(room.moves);
      if (c.turn() !== me) return json({ error: 'Not your turn', state: view(room, me) }, 409);
      try {
        c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined });
      } catch {
        return json({ error: 'Illegal move', state: view(room, me) }, 409);
      }
      room.moves.push(uci);
      room.drawOffer = null;
      if (c.isCheckmate()) finish(room, { kind: 'mate', winner: me });
      else if (c.isStalemate()) finish(room, { kind: 'stalemate' });
      else if (c.isDraw()) finish(room, { kind: 'draw' });
      break;
    }
    case 'resign':
      if (room.status === 'playing') finish(room, { kind: 'resign', winner: them });
      break;
    case 'draw':
      if (room.status !== 'playing') break;
      if (room.drawOffer === them) finish(room, { kind: 'draw' });
      else room.drawOffer = me;
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
      if (room.status !== 'over' || !room.players.w || !room.players.b) break;
      // Same two players, colours swapped.
      room.players = { w: room.players.b, b: room.players.w };
      room.host = room.host === 'w' ? 'b' : 'w';
      room.moves = [];
      room.result = null;
      room.drawOffer = null;
      room.status = 'playing';
      room.game++;
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
  const meNow = who(room, String(b['t'] ?? ''));
  return json(view(room, meNow));
};

function finish(room: Room, r: Room['result']) {
  room.status = 'over';
  room.result = r;
  room.drawOffer = null;
}

function replay(moves: string[]) {
  const c = new Chess();
  for (const m of moves) c.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] || undefined });
  return c;
}

function who(room: Room, t: string | null): Color | null {
  if (!t) return null;
  return room.players.w?.token === t ? 'w' : room.players.b?.token === t ? 'b' : null;
}

/** What a phone may see: never the tokens. */
function view(room: Room, me: Color | null) {
  const now = Date.now();
  const p = (c: Color) => (room.players[c] ? { name: room.players[c]!.name, away: Math.round((now - room.players[c]!.seen) / 1000) } : null);
  return { id: room.id, status: room.status, me, host: room.host, players: { w: p('w'), b: p('b') }, moves: room.moves, result: room.result, drawOffer: room.drawOffer, events: room.events, game: room.game, rev: room.rev ?? 0 };
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

export const config: Config = { path: '/api/chess' };
