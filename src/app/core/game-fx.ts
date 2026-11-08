/**
 * Soft "feel good" game sounds made with WebAudio (no sound files) plus a light buzz on phones,
 * and small bubble / confetti effects. Shared by the games (Sudoku, Merge…).
 */
export class GameFx {
  on = true;
  private ctx?: AudioContext;

  /** Call from a tap: browsers only allow audio after the user touches the page. */
  unlock() {
    if (!this.ctx && this.on && typeof AudioContext !== 'undefined') this.ctx = new AudioContext();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  /** One soft sine note: frequency glides from f0 to f1 over `len` seconds. */
  private note(f0: number, f1: number, len: number, vol: number, delay = 0, type: OscillatorType = 'sine') {
    const c = this.ctx;
    if (!this.on || !c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + len + 0.02);
  }

  private buzz(ms: number | number[]) {
    if (this.on) navigator.vibrate?.(ms);
  }

  /** Selecting a square. */
  tik() {
    this.note(1500, 1100, 0.035, 0.05);
    this.buzz(6);
  }
  /** Placing a number: a little bubble pop. */
  pop() {
    this.note(380, 950, 0.07, 0.22);
    this.note(1900, 2400, 0.03, 0.04, 0.035);
    this.buzz(12);
  }
  /** Notes / erase: quieter pop. */
  soft() {
    this.note(600, 800, 0.05, 0.08);
    this.buzz(5);
  }
  /** A row, column or box finished. */
  chime() {
    [1047, 1319, 1568].forEach((f, i) => this.note(f, f, 0.32, 0.09, i * 0.07, 'triangle'));
    this.buzz([10, 40, 10]);
  }
  /** Wrong number: a gentle low thud, not a harsh buzzer. */
  thud() {
    this.note(190, 90, 0.16, 0.25);
    this.buzz(40);
  }
  /** Puzzle solved. */
  win() {
    [784, 988, 1175, 1568, 1976].forEach((f, i) => this.note(f, f, 0.45, 0.1, i * 0.09, 'triangle'));
    this.buzz([20, 60, 20, 60, 40]);
  }
}

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A bubble that grows out from the tap point inside `host` (position: relative). */
export function bubble(host: HTMLElement, x: number, y: number, color = 'var(--brand)') {
  if (reducedMotion()) return;
  const r = host.getBoundingClientRect();
  const b = document.createElement('span');
  const size = Math.max(r.width, r.height) / 7;
  b.style.cssText = `position:absolute;left:${x - r.left - size / 2}px;top:${y - r.top - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;z-index:4;border:2px solid ${color};background:color-mix(in oklab,${color} 18%,transparent)`;
  host.appendChild(b);
  b.animate([{ transform: 'scale(.2)', opacity: 0.9 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => b.remove();
}

/** Floating bubbles + confetti over `host` for a win. */
export function confetti(host: HTMLElement) {
  if (reducedMotion()) return;
  const colors = ['#14b8a6', '#facc15', '#f472b6', '#60a5fa', '#a78bfa', '#34d399'];
  for (let i = 0; i < 36; i++) {
    const d = document.createElement('span');
    const s = 6 + Math.random() * 12;
    const round = i % 3 !== 0;
    d.style.cssText = `position:absolute;left:${Math.random() * 100}%;bottom:-20px;width:${s}px;height:${round ? s : s / 2}px;border-radius:${round ? '50%' : '2px'};background:${colors[i % colors.length]};opacity:.9;pointer-events:none;z-index:8`;
    host.appendChild(d);
    const rise = host.clientHeight * (0.6 + Math.random() * 0.5);
    d.animate(
      [{ transform: 'translate(0,0) rotate(0)', opacity: 0.95 }, { transform: `translate(${(Math.random() - 0.5) * 120}px,${-rise}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }],
      { duration: 1400 + Math.random() * 1200, delay: Math.random() * 400, easing: 'cubic-bezier(.15,.7,.3,1)' },
    ).onfinish = () => d.remove();
  }
}
