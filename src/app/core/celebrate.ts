/**
 * Festival greetings, Google-doodle style: on a holiday the site shows a greeting card on home and
 * a short shower of confetti / sparkles / petals on the first page of the visit.
 * Loaded on demand (dynamic import) so it never weighs on the first page load.
 */
import { HOLIDAYS, Holiday, YEARS, holidayArt } from './holidays';

export type Mood = 'celebrate' | 'tribute';
export type Theme = 'national' | 'diwali' | 'holi' | 'christmas' | 'eid' | 'flowers' | 'kites' | 'festive' | 'petals';

export interface Festival {
  date: string;
  name: string;
  art: string;
  wish: string;
  mood: Mood;
  theme: Theme;
}

/** Days that are not celebrations (mourning / solemn) or just "day after" offs get no greeting. */
const SKIP = /muharram|good friday|day after|boxing/i;
const TRIBUTE = /gandhi|ambedkar|jagjivan/i;

function themeOf(h: Holiday): Theme {
  const n = h.name.toLowerCase();
  if (TRIBUTE.test(n)) return 'petals';
  if (h.kind === 'national') return 'national';
  if (/diwali|deepavali/.test(n)) return 'diwali';
  if (/holi\b/.test(n)) return 'holi';
  if (/christmas/.test(n)) return 'christmas';
  if (/fitr|ramzan|bakrid|zuha|azha|adha|milad/.test(n)) return 'eid';
  if (/bathukamma|ugadi|varalakshmi|bonalu|durga/.test(n)) return 'flowers';
  if (/sankranti|pongal|bhogi|kanuma/.test(n)) return 'kites';
  return 'festive';
}

function wishOf(h: Holiday): string {
  const n = h.name.toLowerCase();
  if (TRIBUTE.test(n)) return `Remembering on ${clean(h.name)}`;
  if (/independence/.test(n)) return 'Happy Independence Day! Jai Hind 🇮🇳';
  if (/republic/.test(n)) return 'Happy Republic Day! Jai Hind';
  if (/fitr|ramzan|bakrid|zuha|azha|adha/.test(n)) return 'Eid Mubarak!';
  if (/christmas/.test(n)) return 'Merry Christmas!';
  if (/ugadi/.test(n)) return 'Ugadi Subhakankshalu! Happy Telugu New Year';
  if (/sankranti|pongal/.test(n)) return 'Happy Sankranti!';
  if (/bathukamma/.test(n)) return 'Happy Bathukamma!';
  if (/dasami|dussehra|dasara/.test(n)) return 'Happy Dasara! Victory of good over evil';
  if (/diwali|deepavali/.test(n)) return 'Happy Deepavali! May your home be full of light';
  return `Happy ${clean(h.name)}!`;
}

const clean = (s: string) => s.replace(/\s*\(.*\)$/, '').replace(/^Dr\. /, 'Dr. ');

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Festival on a date (any of our lists: India, Telangana, Andhra Pradesh). */
export function festivalOn(date: string): Festival | null {
  for (const region of ['india', 'telangana', 'andhra'] as const) {
    for (const y of YEARS) {
      const h = HOLIDAYS[region][y]?.find((x) => x.date === date && !SKIP.test(x.name));
      if (h) return { date, name: clean(h.name), art: holidayArt(h.name, h.kind), wish: wishOf(h), mood: TRIBUTE.test(h.name) ? 'tribute' : 'celebrate', theme: themeOf(h) };
    }
  }
  return null;
}

/** Today's festival, or the next one within `days` (for a "tomorrow" teaser). */
export function festivalNear(days = 2, now = new Date()): { f: Festival; inDays: number } | null {
  for (let i = 0; i <= days; i++) {
    const f = festivalOn(iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)));
    if (f) return { f, inDays: i };
  }
  return null;
}

export const todayIso = () => iso(new Date());

const COLORS: Record<Theme, string[]> = {
  national: ['#FF9933', '#FFFFFF', '#138808', '#000080'],
  diwali: ['#FFD700', '#FFB300', '#FFF3B0', '#FF7043'],
  holi: ['#FF1493', '#00C853', '#FFD600', '#2979FF', '#AA00FF', '#FF6D00'],
  christmas: ['#D32F2F', '#2E7D32', '#FFFFFF', '#FFD700'],
  eid: ['#2E7D32', '#FFD700', '#FFFFFF', '#00897B'],
  flowers: ['#FFD54F', '#FF80AB', '#BA68C8', '#FF8A65', '#AED581'],
  kites: ['#E53935', '#FDD835', '#1E88E5', '#43A047', '#8E24AA'],
  festive: ['#FF5252', '#FFD740', '#69F0AE', '#40C4FF', '#E040FB'],
  petals: ['#FFFFFF', '#FFE0B2', '#FFCC80'],
};
const EMOJI: Partial<Record<Theme, string[]>> = {
  diwali: ['✨', '🪔'],
  christmas: ['❄️', '⭐'],
  eid: ['🌙', '⭐'],
  flowers: ['🌼', '🌸'],
  kites: ['🪁'],
  petals: ['🌸', '🌼'],
  festive: ['✨'],
};

/**
 * Shower of confetti/sparkles on a full-screen canvas that ignores clicks, then removes itself.
 * Petals (tribute days) fall slowly and sparsely. Skipped for reduced-motion users.
 */
export function shower(theme: Theme, ms = 6000): void {
  if (typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.getElementById('festival-shower')?.remove();
  const c = document.createElement('canvas');
  c.id = 'festival-shower';
  c.setAttribute('aria-hidden', 'true');
  Object.assign(c.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '60' });
  document.body.appendChild(c);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = innerWidth;
  const H = innerHeight;
  c.width = W * dpr;
  c.height = H * dpr;
  const ctx = c.getContext('2d')!;
  ctx.scale(dpr, dpr);
  const colors = COLORS[theme];
  const emoji = EMOJI[theme] ?? [];
  const gentle = theme === 'petals';
  const count = gentle ? 40 : W < 500 ? 90 : 160;
  type P = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; color: string; shape: number; e: string; sway: number };
  const ps: P[] = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: -20 - Math.random() * H * 0.9,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (gentle ? 0.7 : 1.6) + Math.random() * (gentle ? 0.8 : 2.2),
    r: 4 + Math.random() * 5,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: Math.floor(Math.random() * 3),
    e: emoji.length && Math.random() < (gentle ? 1 : 0.25) ? emoji[Math.floor(Math.random() * emoji.length)] : '',
    sway: Math.random() * Math.PI * 2,
  }));
  const start = performance.now();
  const frame = (t: number) => {
    const el = t - start;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = el > ms - 1200 ? Math.max(0, (ms - el) / 1200) : 1;
    for (const p of ps) {
      p.sway += 0.03;
      p.x += p.vx + Math.sin(p.sway) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > H + 20 && el < ms - 2000) (p.y = -20), (p.x = Math.random() * W);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.e) {
        ctx.font = `${p.r * 3}px serif`;
        ctx.fillText(p.e, -p.r, p.r);
      } else {
        ctx.fillStyle = p.color;
        if (theme === 'diwali' || p.shape === 2) {
          // four-point sparkle
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (i * Math.PI) / 4;
            const rr = i % 2 ? p.r * 0.35 : p.r;
            ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.fill();
        } else if (p.shape === 1 || theme === 'holi') {
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        }
      }
      ctx.restore();
    }
    if (el < ms) requestAnimationFrame(frame);
    else c.remove();
  };
  requestAnimationFrame(frame);
}
