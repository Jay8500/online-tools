/// <reference lib="webworker" />
import { Chess, Move } from 'chess.js';

/**
 * Small chess engine for the chess tool: alpha-beta (negamax) + capture search, material and
 * piece-square tables. Runs in a worker so the board keeps animating while it thinks.
 * Message in: { id, kind, t0, fen, depth, noise, random } → out: the same id, kind and t0 + { from, to, promotion }.
 */
type P = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
const VAL: Record<P, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 100000;

// From White's side, index = row * 8 + file with row 0 = rank 8.
const PST: Record<P, number[]> = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
};

/** Score for the side to move. */
function evaluate(c: Chess): number {
  let s = 0;
  const rows = c.board();
  for (let r = 0; r < 8; r++)
    for (let f = 0; f < 8; f++) {
      const p = rows[r][f];
      if (!p) continue;
      const v = VAL[p.type] + PST[p.type][p.color === 'w' ? r * 8 + f : (7 - r) * 8 + f];
      s += p.color === 'w' ? v : -v;
    }
  return c.turn() === 'w' ? s : -s;
}

/** Captures first, biggest victim with the smallest attacker (MVV-LVA), then promotions. */
function order(ms: Move[]): Move[] {
  const key = (m: Move) => (m.captured ? 10 * VAL[m.captured] - VAL[m.piece] + 1000 : 0) + (m.promotion ? 800 : 0);
  return ms.sort((a, b) => key(b) - key(a));
}

function quiesce(c: Chess, alpha: number, beta: number, qd: number): number {
  const stand = evaluate(c);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (qd >= 3) return alpha;
  for (const m of order(c.moves({ verbose: true }).filter((m) => m.captured))) {
    c.move(m);
    const s = -quiesce(c, -beta, -alpha, qd + 1);
    c.undo();
    if (s >= beta) return beta;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

/** Hard level stops looking deeper after this long and plays its best move so far. */
const TIME_LIMIT = 2000;
let deadline = Infinity;
class TimeUp extends Error {}

function negamax(c: Chess, depth: number, alpha: number, beta: number, ply: number): number {
  if (Date.now() > deadline) throw new TimeUp();
  const ms = c.moves({ verbose: true });
  if (!ms.length) return c.inCheck() ? -MATE + ply : 0;
  if (c.isDraw()) return 0;
  if (depth === 0) return quiesce(c, alpha, beta, 0);
  for (const m of order(ms)) {
    c.move(m);
    const s = -negamax(c, depth - 1, -beta, -alpha, ply + 1);
    c.undo();
    if (s >= beta) return beta;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

function best(fen: string, depth: number, noise: number, random: number): Move {
  const c = new Chess(fen);
  const ms = c.moves({ verbose: true });
  if (Math.random() < random) return ms[Math.floor(Math.random() * ms.length)];
  // Search 1, 2, … plies deep; if time runs out keep the last finished answer.
  deadline = Date.now() + TIME_LIMIT;
  let found = order(ms)[0];
  for (let d = 1; d <= depth; d++) {
    try {
      found = search(c, ms, d, noise, found);
    } catch (e) {
      if (!(e instanceof TimeUp)) throw e;
      break;
    }
  }
  return found;
}

/** Best root move at a fixed depth; the previous best is tried first so pruning works well. */
function search(c: Chess, ms: Move[], depth: number, noise: number, prev: Move): Move {
  let top = prev;
  let topScore = -Infinity;
  for (const m of [prev, ...order(ms).filter((x) => x !== prev)]) {
    c.move(m);
    // Without noise the best score so far can prune the rest; with noise every move needs a true score.
    const floor = noise || topScore === -Infinity ? -MATE - 1 : topScore;
    const s = -negamax(c, depth - 1, -MATE - 1, -floor, 1) + (Math.random() * 2 - 1) * noise;
    c.undo();
    if (s > topScore) [top, topScore] = [m, s];
  }
  return top;
}

addEventListener('message', ({ data }: MessageEvent<{ id: number; kind: string; t0: number; fen: string; depth: number; noise: number; random: number }>) => {
  const m = best(data.fen, data.depth, data.noise, data.random);
  postMessage({ id: data.id, kind: data.kind, t0: data.t0, from: m.from, to: m.to, promotion: m.promotion });
});
