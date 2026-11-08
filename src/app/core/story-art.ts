/**
 * Spread Stories pictures — our own drawings: shadow-puppet (tholu bomma) figures without faces,
 * and symbols. Each returns an SVG string; `v` picks a colour variant. Animations use the
 * `ss-a-*` classes defined in the stories overlay.
 */
const SK = (id: string, a: string, b: string) =>
  `<defs><radialGradient id="${id}" cx=".7" cy=".2" r="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs><rect width="400" height="300" fill="url(#${id})"/>`;
const LG = (id: string, a: string, b: string) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/>`;
const stars = (n: number, seed: number) => {
  let s = seed, o = '';
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) o += `<circle class="ss-a-tw" style="animation-delay:${(r() * 2).toFixed(2)}s" cx="${(r() * 400) | 0}" cy="${(r() * 170) | 0}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="#fff4dc"/>`;
  return o;
};
const halo = (x: number, y: number, r: number, c: string) => `<circle class="ss-a-glow" cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".9"/><circle cx="${x}" cy="${y}" r="${r * 1.6}" fill="${c}" opacity=".18"/>`;
const FIG = 'fill="#1c0c16" stroke="#ffd68c" stroke-opacity=".75" stroke-width="1.3" stroke-linejoin="round"';
const notes = (x: number, y: number) => ['♪', '♫', '♪'].map((n, i) => `<text class="ss-a-drift" style="animation-delay:${i * 2}s" x="${x + i * 44}" y="${y}" font-size="22" fill="#fde9b0">${n}</text>`).join('');
const feather = (x: number, y: number) =>
  `<g transform="translate(${x} ${y})"><path d="M0 150 C -4 100 -8 50 4 0" stroke="#c8a24a" stroke-width="3" fill="none"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${2 - i * 0.6} ${20 + i * 14} q -26 -6 -38 -22 M${2 - i * 0.6} ${20 + i * 14} q 26 -6 38 -22" stroke="#2f8f5b" stroke-width="2" fill="none" opacity=".8"/>`).join('')}<ellipse cx="4" cy="6" rx="30" ry="44" fill="#1f7a4d"/><ellipse cx="4" cy="6" rx="21" ry="31" fill="#2aa198"/><ellipse cx="4" cy="8" rx="13" ry="19" fill="#f2c14e"/><ellipse cx="4" cy="9" rx="8.5" ry="12" fill="#1e3a8a"/><ellipse cx="4" cy="10" rx="4" ry="6" fill="#0b1033"/></g>`;
const svg = (body: string) => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
const pick = <T>(list: T[], v: number) => list[v % list.length];

export const STORY_ART: Record<string, (v: number) => string> = {
  feather: (v) => {
    const [a, b, moonX] = pick<[string, string, number]>([['#3b4cca', '#0b1033', 315], ['#1e6091', '#081a2e', 90], ['#5b2a86', '#140b2b', 300]], v);
    return svg(`${SK('sf' + v, a, b)}${stars(26, 7 + v)}${halo(moonX, 62, 28, '#fde9b0')}<g class="ss-a-float">${feather(200, 70)}</g>
      <g transform="rotate(${v === 1 ? 14 : -16} 200 230)"><rect x="70" y="222" width="260" height="15" rx="7.5" fill="#8b5a2b"/><rect x="88" y="222" width="10" height="15" fill="#f2c14e"/><rect x="300" y="222" width="10" height="15" fill="#f2c14e"/>${[150, 175, 200, 225, 250, 275].map((x) => `<circle cx="${x}" cy="229.5" r="3.6" fill="#3b2412"/>`).join('')}</g>${notes(140, 210)}`);
  },
  krishna: (v) =>
    svg(`${SK('sk' + v, v ? '#2b6cb0' : '#4f3dbd', '#0b1033')}${stars(22, 11 + v)}${halo(200, 120, 70, v ? '#2c5c8f' : '#3c3a9e')}${halo(96, 58, 22, '#fde9b0')}
      <path d="M0 262 Q 100 250 200 262 T 400 258 V300 H0z" fill="#101645"/>${[0, 1.4].map((d) => `<ellipse class="ss-a-rip" style="animation-delay:${d}s" cx="200" cy="276" rx="80" ry="7" fill="none" stroke="#6d7bf0" stroke-width="1.5"/>`).join('')}
      <g class="ss-a-sway">
        <ellipse cx="207" cy="52" rx="5" ry="11" fill="#2aa198" transform="rotate(18 207 52)"/><ellipse cx="207" cy="54" rx="2.5" ry="5" fill="#f2c14e" transform="rotate(18 207 54)"/>
        <path ${FIG} d="M187 72 L191 60 L200 66 L209 60 L213 72 Z"/><circle ${FIG} cx="200" cy="84" r="13"/>
        <path ${FIG} d="M186 100 Q200 94 214 100 L210 152 L190 152 Z"/>
        <path ${FIG} d="M190 150 L210 150 L215 200 L223 264 L208 264 L202 214 L197 264 L181 264 L186 200 Z"/>
        <path ${FIG} d="M190 104 L198 124 L232 98 L228 91 Z"/><path ${FIG} d="M210 104 L220 120 L258 92 L254 85 Z"/>
        <path d="M190 152 C 174 172 180 202 188 216" stroke="#f2c14e" stroke-width="4" fill="none"/>
      </g><line x1="208" y1="99" x2="296" y2="78" stroke="#e0b24a" stroke-width="5" stroke-linecap="round"/>${notes(276, 96)}`),
  rama: (v) =>
    svg(`${LG('sr' + v, v ? '#ffb347' : '#ff9a3c', v ? '#5b1d4a' : '#7a1f3d')}
      <g class="ss-a-spin" style="transform-origin:200px 170px">${Array.from({ length: 16 }, (_, i) => `<rect x="198" y="40" width="4" height="40" rx="2" fill="#ffe6a8" opacity=".5" transform="rotate(${i * 22.5} 200 170)"/>`).join('')}</g>
      ${halo(200, 170, 82, '#ffd27a')}<path d="M0 262 Q 100 240 200 258 T 400 250 V300 H0z" fill="#3a0f1f"/>
      <g class="ss-a-breathe">
        <path ${FIG} d="M160 98 L168 94 L178 150 L170 152 Z"/><path d="M162 96 l-4 -12 M167 94 l-2 -13" stroke="#ffd68c" stroke-width="1.6"/>
        <path ${FIG} d="M171 74 L175 56 L179 66 L185 48 L191 66 L195 56 L199 74 Z"/><circle ${FIG} cx="185" cy="86" r="13"/>
        <path ${FIG} d="M168 106 Q185 100 202 106 L196 160 L174 160 Z"/>
        <path ${FIG} d="M174 158 L196 158 L206 266 L190 266 L185 202 L180 266 L164 266 Z"/>
        <path ${FIG} d="M200 108 L238 132 L236 140 L198 120 Z"/><path ${FIG} d="M170 108 L160 152 L166 154 L176 118 Z"/>
        <path d="M202 106 C 222 126 214 170 206 186" stroke="#f2c14e" stroke-width="4" fill="none" opacity=".8"/>
        <path d="M234 56 Q 284 150 234 244" stroke="#1c0c16" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M234 56 Q 284 150 234 244" stroke="#ffd68c" stroke-opacity=".6" stroke-width="1" fill="none"/>
        <line x1="234" y1="56" x2="234" y2="244" stroke="#fff4dc" stroke-width="1.2"/>
      </g>`),
  padukas: () =>
    svg(`${LG('sp', '#ffb347', '#7a1f3d')}${halo(200, 120, 60, '#ffd27a')}<path d="M0 250 Q 100 215 200 240 T 400 232 V300 H0z" fill="#4a1426"/>
      <rect x="120" y="196" width="160" height="24" rx="6" fill="#6b2a12"/><rect x="132" y="176" width="136" height="22" rx="6" fill="#8a3a18"/>
      <g class="ss-a-float"><path d="M156 172 c -2 -16 6 -28 18 -28 c 12 0 18 14 14 28 z" fill="#c8a24a"/><path d="M212 172 c -4 -14 2 -28 16 -28 c 12 0 18 12 16 28 z" fill="#c8a24a"/><path d="M160 150 c 6 -6 16 -6 22 0 M216 150 c 6 -6 16 -6 22 0" stroke="#fff4dc" stroke-width="2" fill="none"/></g>
      ${[0, 1, 2, 3, 4].map((i) => `<circle class="ss-a-fall" style="animation-delay:${i * 1.3}s" cx="${100 + i * 55}" cy="20" r="4" fill="#ffd27a"/>`).join('')}`),
  hanuman: (v) =>
    svg(`${LG('sh' + v, '#ffb347', v ? '#9f1239' : '#e14d2a')}
      ${[60, 120, 190, 240].map((y, i) => `<rect class="ss-a-wind" style="animation-delay:${i * 0.45}s" x="240" y="${y}" width="${60 + i * 12}" height="3" rx="1.5" fill="#fff4dc" opacity=".7"/>`).join('')}
      <g class="ss-a-fly">
        <path d="M84 96 L118 42 L134 66 L150 48 L180 96 Z" fill="#2f6b3a" stroke="#1d4426" stroke-width="3"/>${[0, 1, 2, 3].map((i) => `<circle class="ss-a-tw" style="animation-delay:${i * 0.5}s" cx="${106 + i * 18}" cy="${84 - (i % 2) * 10}" r="4.5" fill="#b8ff8a"/>`).join('')}
        <path ${FIG} d="M150 128 L122 96 L130 90 L160 124 Z"/><path ${FIG} d="M140 110 L146 98 L152 106 L158 98 L162 110 Z"/><circle ${FIG} cx="151" cy="121" r="12.5"/>
        <path ${FIG} d="M158 124 L214 148 L208 170 L152 144 Z"/><path ${FIG} d="M212 152 L282 160 L280 170 L210 168 Z"/><path ${FIG} d="M206 162 L270 188 L264 196 L202 174 Z"/>
        <path ${FIG} d="M156 140 L110 152 L112 160 L160 148 Z"/>
        <circle cx="102" cy="154" r="13" fill="#f2c14e" stroke="#b07d1a" stroke-width="2.5"/><path d="M96 142 v24 M108 142 v24" stroke="#b07d1a" stroke-width="2"/>
        <path ${FIG} d="M278 164 C 330 152 336 98 304 94 C 290 94 286 108 296 114 C 310 106 318 122 306 142 C 296 154 286 158 276 160 Z"/>
      </g>`),
  sita: () =>
    svg(`${LG('ss', '#f9a8d4', '#4c1d3d')}${halo(214, 130, 64, '#ffe1ef')}<path d="M0 264 Q 120 250 240 262 T 400 258 V300 H0z" fill="#3b1430"/>
      <rect x="62" y="120" width="12" height="146" fill="#3b1a12"/><circle cx="68" cy="104" r="48" fill="#2f5d3a"/><circle cx="40" cy="128" r="30" fill="#2f5d3a"/><circle cx="100" cy="126" r="32" fill="#2f5d3a"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${38 + i * 13}" cy="${96 + (i % 3) * 14}" r="4" fill="#ff7a45"/>`).join('')}
      ${[0, 1, 2, 3].map((i) => `<ellipse class="ss-a-fall" style="animation-delay:${i * 1.6}s" cx="${90 + i * 60}" cy="40" rx="4" ry="2.5" fill="#ff9a6a"/>`).join('')}
      <g class="ss-a-breathe">
        <path ${FIG} d="M222 92 C 232 120 228 170 224 196 L219 196 C 221 160 223 124 213 100 Z"/><circle ${FIG} cx="214" cy="92" r="12"/>
        <path ${FIG} d="M203 106 Q214 101 225 106 L232 158 L250 266 L178 266 L196 158 Z"/>
        <path d="M224 106 C 246 128 246 180 238 214 L230 210 C 236 176 236 138 218 116 Z" fill="#f2c14e" opacity=".45"/>
        <g transform="translate(212 138)">${[-40, -15, 15, 40].map((a) => `<ellipse cx="0" cy="-7" rx="4" ry="9" fill="#f472b6" transform="rotate(${a})"/>`).join('')}<ellipse cx="0" cy="-8" rx="4" ry="10" fill="#ec4899"/></g>
      </g>`),
  gada: (v) => {
    const x = v ? 280 : 120;
    return svg(`${LG('sg' + v, v ? '#fcd34d' : '#ffb347', v ? '#b45309' : '#c2410c')}${halo(x, 120, 70, '#fff1c2')}
      ${[70, 150, 230].map((y, i) => `<rect class="ss-a-wind" style="animation-delay:${i * 0.6}s" x="200" y="${y}" width="90" height="3" rx="1.5" fill="#fff4dc" opacity=".6"/>`).join('')}
      <g class="ss-a-sway"><rect x="${x - 7}" y="150" width="14" height="120" rx="6" fill="#7a4a12"/><circle cx="${x}" cy="130" r="50" fill="#f2c14e"/><circle cx="${x}" cy="130" r="50" fill="none" stroke="#b07d1a" stroke-width="5"/>${[-26, 0, 26].map((d) => `<path d="M${x + d} 84 v92" stroke="#b07d1a" stroke-width="3.5"/>`).join('')}<circle cx="${x}" cy="76" r="9" fill="#f2c14e"/></g>`);
  },
  lotus: (v) =>
    svg(`${LG('sl' + v, v ? '#0e7490' : '#065f46', '#022c22')}${v ? stars(10, 5) : ''}
      <g class="ss-a-float"><path d="M260 70 q 20 -14 36 0 q -16 4 -18 16 q -2 -12 -18 -16z" fill="#fff4dc"/><path d="M300 92 q 16 -10 28 0 q -12 3 -14 12 q -2 -9 -14 -12z" fill="#fff4dc" opacity=".7"/></g>
      <rect y="210" width="400" height="90" fill="#04382d"/>${[0, 1.2, 2.4].map((d) => `<ellipse class="ss-a-rip" style="animation-delay:${d}s" cx="200" cy="236" rx="90" ry="14" fill="none" stroke="#7fd1c0" stroke-width="2"/>`).join('')}
      <g class="ss-a-float">${[-60, -35, -12, 12, 35, 60].map((a) => `<ellipse cx="200" cy="200" rx="15" ry="42" fill="${Math.abs(a) > 40 ? '#f9a8d4' : '#f472b6'}" transform="rotate(${a} 200 238)"/>`).join('')}<ellipse cx="200" cy="198" rx="15" ry="44" fill="#ec4899"/><ellipse cx="200" cy="240" rx="40" ry="8" fill="#2f8f5b"/></g>`),
  om: () =>
    svg(`${LG('so', '#0f766e', '#022c22')}<text class="ss-a-glow" x="200" y="140" text-anchor="middle" font-size="110" fill="#fde9b0" font-family="Nirmala UI, Noto Sans Devanagari, serif">ॐ</text>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="198" y="20" width="4" height="26" rx="2" fill="#fde9b0" opacity=".3" transform="rotate(${i * 30} 200 104)"/>`).join('')}
      <rect y="220" width="400" height="80" fill="#04382d"/><path class="ss-a-glow" d="M186 236 h28 l-4 12 h-20z" fill="#c8a24a"/><path d="M200 236 c -6 -10 2 -18 0 -26 c 8 8 8 18 0 26z" fill="#ffb347"/>`),
  wheel: () =>
    svg(`${SK('sw', '#4338ca', '#3b0f0a')}${stars(14, 3)}<path d="M0 255 H400 V300 H0z" fill="#2a0e09"/>
      <g class="ss-a-spin" style="transform-origin:200px 165px"><circle cx="200" cy="165" r="82" fill="none" stroke="#d4a24c" stroke-width="11"/><circle cx="200" cy="165" r="70" fill="none" stroke="#8a5a1c" stroke-width="2"/>${Array.from({ length: 12 }, (_, i) => `<line x1="200" y1="165" x2="200" y2="95" stroke="#d4a24c" stroke-width="5" transform="rotate(${i * 30} 200 165)"/>`).join('')}<circle cx="200" cy="165" r="16" fill="#f2c14e"/></g>`),
  conch: () =>
    svg(`${SK('sc', '#1d4ed8', '#0b1033')}${stars(16, 13)}${halo(200, 140, 74, '#93c5fd')}<path d="M0 255 H400 V300 H0z" fill="#0b1440"/>
      <g class="ss-a-float"><path d="M168 96 c 54 -8 86 34 74 82 c -8 30 -40 46 -64 34 c -20 -10 -24 -40 -10 -58 c -12 -10 -16 -40 0 -58z" fill="#fff4dc"/><path d="M200 120 c 18 6 22 30 8 42 c -10 8 -24 2 -24 -10" stroke="#c8a24a" stroke-width="3" fill="none"/><path d="M234 186 l 22 22" stroke="#fff4dc" stroke-width="8" stroke-linecap="round"/></g>
      ${[0, 1, 2].map((i) => `<path class="ss-a-drift" style="animation-delay:${i * 1.8}s" d="M${250 + i * 10} 120 q 10 -8 20 0" stroke="#fde9b0" stroke-width="2" fill="none"/>`).join('')}`),
  armour: () =>
    svg(`${SK('sa', '#f59e0b', '#7c2d12')}${halo(200, 110, 90, '#fde68a')}<path d="M0 255 H400 V300 H0z" fill="#451a03"/>
      <g class="ss-a-breathe"><path d="M150 112 a50 50 0 0 1 100 0 v58 c 0 30 -24 50 -50 58 c -26 -8 -50 -28 -50 -58z" fill="#d4a24c" stroke="#8a5a1c" stroke-width="4"/>${[170, 185, 200, 215, 230].map((x) => `<path d="M${x} 74 v150" stroke="#8a5a1c" stroke-width="2" opacity=".7"/>`).join('')}<circle cx="200" cy="140" r="16" fill="#fff1c2"/>
      <circle class="ss-a-glow" cx="124" cy="150" r="13" fill="#fde68a" stroke="#b07d1a" stroke-width="3"/><circle class="ss-a-glow" cx="276" cy="150" r="13" fill="#fde68a" stroke="#b07d1a" stroke-width="3"/></g>`),
  eye: () =>
    svg(`${LG('se', '#7dd3fc', '#065f46')}<rect x="270" y="80" width="14" height="190" fill="#3b2412"/><path d="M276 120 q -60 -10 -110 -40" stroke="#3b2412" stroke-width="9" fill="none"/>
      <circle cx="300" cy="80" r="56" fill="#2f6b3a"/><circle cx="240" cy="96" r="40" fill="#2f6b3a"/><circle cx="330" cy="120" r="36" fill="#2f6b3a"/>
      <g class="ss-a-float"><path d="M154 76 c 10 -14 28 -14 36 -2 l 12 -4 -8 10 c -6 12 -26 16 -40 6z" fill="#1c0c16"/><circle cx="182" cy="76" r="3.4" fill="#fde047"/></g>
      ${[0, 1, 2].map((i) => `<circle class="ss-a-rip" style="animation-delay:${i * 1.1}s" cx="182" cy="76" r="14" fill="none" stroke="#fde047" stroke-width="2"/>`).join('')}
      <line x1="30" y1="220" x2="164" y2="86" stroke="#1c0c16" stroke-width="3" stroke-dasharray="6 6"/><path d="M30 220 l 4 -14 10 10z" fill="#1c0c16"/>`),
  birds: (v) =>
    svg(`${SK('sb' + v, v ? '#be185d' : '#334155', v ? '#3b0a1e' : '#0f172a')}${stars(18, 21 + v)}${halo(v ? 300 : 110, 70, 26, '#fde9b0')}
      <path d="M40 210 q 160 -40 330 -10" stroke="#3b2412" stroke-width="8" fill="none"/>
      <g class="ss-a-breathe"><path d="M150 200 c 0 -24 20 -38 40 -30 c 10 -16 26 -14 30 -4 c -10 -2 -18 4 -20 12 c 2 16 -12 26 -30 26z" fill="#1c0c16" stroke="#ffd68c" stroke-opacity=".7" stroke-width="1.2"/>
      <path d="M232 196 c 2 -22 22 -34 40 -26 c 10 -14 24 -12 28 -2 c -9 -2 -16 4 -18 11 c 2 14 -12 24 -28 24z" fill="#1c0c16" stroke="#ffd68c" stroke-opacity=".7" stroke-width="1.2"/></g>
      ${v ? '' : `<path class="ss-a-drift" d="M220 150 q 4 -10 10 0 q 6 -10 10 0 q -10 14 -10 14 q 0 0 -10 -14z" fill="#f472b6"/>`}`),
  bridge: () =>
    svg(`${LG('sbr', '#38bdf8', '#0c4a6e')}${halo(320, 60, 26, '#fef9c3')}<rect y="190" width="400" height="110" fill="#075985"/>
      ${[0, 1, 2].map((d) => `<ellipse class="ss-a-rip" style="animation-delay:${d}s" cx="${120 + d * 80}" cy="246" rx="60" ry="8" fill="none" stroke="#7dd3fc" stroke-width="1.5"/>`).join('')}
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${10 + i * 44}" y="${186 - Math.sin((i / 8) * Math.PI) * 26}" width="40" height="22" rx="8" fill="#a8a29e" stroke="#57534e" stroke-width="2"/>`).join('')}
      <g class="ss-a-float"><path d="M196 164 c -8 -2 -14 -10 -10 -18 c 4 -8 16 -8 20 0 c 10 -4 22 2 22 14 c 0 10 -10 14 -32 4z" fill="#1c0c16" stroke="#ffd68c" stroke-opacity=".7" stroke-width="1.2"/><path d="M228 160 c 18 -6 22 -30 6 -36 c -8 -2 -12 6 -6 10 c 6 2 6 14 -4 18z" fill="#1c0c16" stroke="#ffd68c" stroke-opacity=".7" stroke-width="1.2"/></g>
      ${[0, 1, 2, 3].map((i) => `<circle class="ss-a-fall" style="animation-delay:${i * 1.2}s" cx="${180 + i * 12}" cy="150" r="2" fill="#fde68a"/>`).join('')}`),
  lamp: () =>
    svg(`${SK('sla', '#312e81', '#05050f')}${stars(30, 17)}${halo(200, 170, 70, '#fbbf24')}<path d="M0 250 H400 V300 H0z" fill="#120d24"/>
      <path d="M150 210 q 50 30 100 0 l -8 18 q -42 18 -84 0z" fill="#b45309"/><ellipse cx="200" cy="210" rx="50" ry="8" fill="#92400e"/>
      <path class="ss-a-glow" d="M200 206 c -16 -16 -6 -44 0 -60 c 6 16 16 44 0 60z" fill="#fde047"/><path d="M200 200 c -7 -9 -3 -24 0 -32 c 3 8 7 23 0 32z" fill="#fff7cc"/>`),
  axe: () =>
    svg(`${LG('sx', '#fda4af', '#4c0519')}${halo(110, 170, 70, '#fff1f2')}<path d="M180 270 L270 120 L320 190 L360 150 L400 220 V300 H180z" fill="#3f0d1c"/><path d="M0 262 Q 100 248 200 260 T 400 256 V300 H0z" fill="#2a0712"/>
      <g class="ss-a-breathe"><rect x="96" y="150" width="12" height="114" rx="5" transform="rotate(-30 102 207)" fill="#7a4a12"/><path d="M118 140 c 30 -10 48 10 42 36 c -18 -8 -30 -4 -40 6z" fill="#cbd5e1" stroke="#64748b" stroke-width="2" transform="rotate(-30 130 160)"/></g>
      ${[0, 1, 2, 3].map((i) => `<ellipse class="ss-a-fall" style="animation-delay:${i * 1.5}s" cx="${140 + i * 60}" cy="30" rx="4" ry="2.5" fill="#fecdd3"/>`).join('')}`),
};

export function storyArt(key: string, v: number): string {
  return (STORY_ART[key] ?? STORY_ART['om'])(v);
}
