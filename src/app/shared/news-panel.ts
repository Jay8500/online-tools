import { Component, ElementRef, OnDestroy, ViewEncapsulation, afterNextRender, computed, inject, input, output, signal, viewChild } from '@angular/core';

interface News {
  title: string;
  summary: string;
  link: string;
  source: string;
  at: string;
}

/** Each category has its own colours and symbol — our own design, never the publishers' photos. */
const CATS = [
  { id: 'telangana', label: 'Telangana', icon: '🏛️', a: '#0f766e', b: '#042f2e' },
  { id: 'andhra', label: 'Andhra Pradesh', icon: '🌊', a: '#1d4ed8', b: '#0b1a3f' },
  { id: 'india', label: 'India', icon: '🇮🇳', a: '#c2410c', b: '#1f3d1a' },
  { id: 'top', label: 'Top stories', icon: '🔥', a: '#b91c1c', b: '#2a0610' },
  { id: 'business', label: 'Business', icon: '📈', a: '#047857', b: '#022c22' },
  { id: 'sports', label: 'Sports', icon: '🏏', a: '#6d28d9', b: '#160f33' },
  { id: 'tech', label: 'Tech', icon: '💻', a: '#0369a1', b: '#08111f' },
  { id: 'education', label: 'Education & jobs', icon: '🎓', a: '#a16207', b: '#2a1505' },
  { id: 'telugu', label: 'తెలుగు', icon: '📰', a: '#be185d', b: '#2e0530' },
];
type Cat = (typeof CATS)[number];
/** Andhra Pradesh cities — a visitor whose weather city is one of these starts on AP news. */
const AP_CITIES = /vijayawada|visakhapatnam|vizag|guntur|tirupati|nellore|kurnool|kakinada|rajahmundry|rajamahendravaram|anantapur|kadapa|eluru|ongole|srikakulam|vizianagaram|machilipatnam|chittoor|amaravati/i;
const KEY = 'news-cat';

/** Styles ship in this lazy chunk and are added the first time the news opens. */
const CSS = `
.nw{position:fixed;inset:0;z-index:100;background:#0b0b0f;color:#f5f0e6;--ox:50%;--oy:0%;animation:nw-reveal .55s cubic-bezier(.7,0,.3,1) both;font-family:system-ui,"Noto Sans Telugu","Nirmala UI",sans-serif}
.nw.out{animation:nw-hide .3s cubic-bezier(.7,0,.3,1) both}
@keyframes nw-reveal{from{clip-path:circle(0 at var(--ox) var(--oy))}to{clip-path:circle(150vmax at var(--ox) var(--oy))}}
@keyframes nw-hide{from{clip-path:circle(150vmax at var(--ox) var(--oy))}to{clip-path:circle(0 at var(--ox) var(--oy))}}
.nw-home{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain}
.nw-home::-webkit-scrollbar{display:none}
.nw-bh{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;padding:12px max(14px,4vw) 22px;background:linear-gradient(#0b0b0f,rgb(11 11 15/.75) 45%,transparent)}
.nw-mark{display:flex;align-items:center;gap:7px;font:700 17px Georgia,serif}
.nw-mark i{font-style:normal;font-size:18px}
.nw-x,.nw-back{width:32px;height:32px;border-radius:50%;border:1px solid rgb(245 240 230/.16);background:rgb(255 255 255/.08);color:inherit;display:grid;place-items:center;cursor:pointer;padding:0}
.nw-x svg,.nw-back svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.nw-hero{position:relative;height:min(62dvh,560px);margin-top:-66px;overflow:hidden;background:linear-gradient(150deg,var(--a),var(--b))}
.nw-hero .nw-sym{position:absolute;right:-4%;top:12%;font-size:min(56vw,340px);line-height:1;opacity:.28;filter:blur(1px);animation:nw-drift 18s ease-in-out infinite alternate}
@keyframes nw-drift{to{transform:translate(-4%,3%) scale(1.08) rotate(-4deg)}}
.nw-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgb(255 255 255/.18),transparent 45%)}
.nw-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#0b0b0f 3%,rgb(11 11 15/.55) 35%,transparent 70%),linear-gradient(90deg,rgb(11 11 15/.65),transparent 65%)}
.nw-ht{position:absolute;left:max(16px,4vw);right:16px;bottom:6%;z-index:1;max-width:640px;display:grid;gap:8px}
.nw-badge{justify-self:start;font:800 10.5px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#0b0b0f;background:linear-gradient(135deg,#f6a623,#f2c14e);padding:3px 8px;border-radius:4px}
.nw-src{font:700 12px system-ui;color:#f2c14e;letter-spacing:.03em}
.nw-ttl{margin:0;font:800 clamp(22px,5.6vw,40px)/1.2 system-ui,"Noto Sans Telugu",sans-serif;text-shadow:0 2px 20px rgb(0 0 0/.8);text-wrap:balance;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.nw-sum{margin:0;font:400 15px/1.5 system-ui,"Noto Sans Telugu",sans-serif;color:rgb(245 240 230/.82);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nw-btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}
.nw-play,.nw-ghost{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:6px;padding:9px 16px;font:800 14.5px system-ui;cursor:pointer;text-decoration:none;transition:transform .15s,background .2s}
.nw-play{background:#f5f0e6;color:#0b0b0f}.nw-play:hover{background:#fff}.nw-ghost{background:rgb(255 255 255/.16);color:#f5f0e6}.nw-ghost:hover{background:rgb(255 255 255/.26)}
.nw-play:active,.nw-ghost:active{transform:scale(.95)}
.nw-play svg,.nw-ghost svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.nw-row{padding:4px 0 8px;animation:nw-rise .55s cubic-bezier(.2,.8,.2,1) both}
@keyframes nw-rise{from{opacity:0;transform:translateY(12px)}}
.nw-row h3{margin:0 max(16px,4vw) 6px;font:700 16px system-ui,"Noto Sans Telugu",sans-serif;display:flex;gap:6px;align-items:center}
.nw-tiles{display:flex;gap:8px;overflow-x:auto;padding:6px max(16px,4vw) 14px;scroll-snap-type:x mandatory;scroll-padding:max(16px,4vw);scrollbar-width:none}
.nw-tiles::-webkit-scrollbar{display:none}
.nw-tile{position:relative;flex:0 0 clamp(170px,46vw,280px);aspect-ratio:16/10;border:0;padding:10px;border-radius:8px;overflow:hidden;cursor:pointer;scroll-snap-align:start;color:#f5f0e6;text-align:left;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;background:linear-gradient(150deg,var(--a),var(--b));transition:transform .32s cubic-bezier(.2,.8,.2,1),box-shadow .32s}
.nw-tile .nw-sym{position:absolute;right:-6px;top:-4px;font-size:64px;opacity:.3;transition:transform .5s}
.nw-tile::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgb(0 0 0/.6),transparent 70%);pointer-events:none}
.nw-tile b{position:relative;z-index:1;font:700 13.5px/1.3 system-ui,"Noto Sans Telugu",sans-serif;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.nw-tile small{position:relative;z-index:1;font:600 10.5px system-ui;color:rgb(245 240 230/.75)}
@media (hover:hover){.nw-tile:hover{transform:scale(1.07);z-index:2;box-shadow:0 16px 34px rgb(0 0 0/.7)}.nw-tile:hover .nw-sym{transform:scale(1.15) rotate(-6deg)}}
.nw-tile:active{transform:scale(.96)}
.nw-sk{flex:0 0 clamp(170px,46vw,280px);aspect-ratio:16/10;border-radius:8px;background:linear-gradient(90deg,#17151f 0,#221f2c 40%,#17151f 80%);background-size:200% 100%;animation:nw-shim 1.2s linear infinite}
@keyframes nw-shim{to{background-position:-200% 0}}
.nw-note{padding:6px max(16px,4vw) 28px;font:11px system-ui;color:rgb(245 240 230/.45)}
.nw-read{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;background-color:#0b0b0f;background-image:linear-gradient(170deg,var(--a,#1a1626) -20%,#0b0b0f 45%);animation:nw-in .4s cubic-bezier(.2,.8,.2,1) both}
@keyframes nw-in{from{opacity:0;transform:scale(.97)}}
.nw-rtop{display:flex;align-items:center;gap:10px;padding:12px max(14px,4vw)}
.nw-rtop span{font:700 15px system-ui,"Noto Sans Telugu",sans-serif}.nw-rtop em{margin-left:auto;font:500 12px system-ui;font-style:normal;color:rgb(245 240 230/.6)}
.nw-feed{flex:1;overflow-y:auto;scroll-snap-type:y mandatory;overscroll-behavior:contain;scrollbar-width:none}
.nw-feed::-webkit-scrollbar{display:none}
.nw-card{height:100%;scroll-snap-align:start;display:flex;flex-direction:column;justify-content:center;gap:12px;padding:20px max(20px,calc(50vw - 300px));box-sizing:border-box}
.nw-card .nw-ttl{-webkit-line-clamp:6}.nw-card .nw-sum{-webkit-line-clamp:6;font-size:16px}
.nw-hint{text-align:center;font:12px system-ui;color:rgb(245 240 230/.55);animation:nw-nudge 1.6s ease-in-out 3}
@keyframes nw-nudge{50%{transform:translateY(-5px)}}
.nw button:focus-visible,.nw a:focus-visible{outline:3px solid #facc15;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.nw,.nw *{animation:none!important;transition:none!important}}
`;

/**
 * 📰 News, cinema style: a full-screen home with the top headline as a hero and a row of tiles per
 * category; a tile opens the one-headline-per-screen reader. Headlines link back to the publisher.
 */
@Component({
  selector: 'app-news-panel',
  encapsulation: ViewEncapsulation.None,
  host: { '(document:keydown)': 'key($event)' },
  template: `
    <div class="nw" [class.out]="leaving()" [style.--ox]="ox()" [style.--oy]="oy()" role="dialog" aria-modal="true" aria-label="News">
      <div class="nw-home">
        <div class="nw-bh">
          <div class="nw-mark"><i>📰</i>Spread News</div>
          <button type="button" class="nw-x" aria-label="Close news" (click)="close()"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
        @if (hero(); as h) {
          <section class="nw-hero" [style.--a]="h.cat.a" [style.--b]="h.cat.b">
            <span class="nw-sym" aria-hidden="true">{{ h.cat.icon }}</span>
            <div class="nw-ht">
              <span class="nw-badge">{{ h.cat.label }} · Top story</span>
              <div class="nw-src">{{ h.n.source }}{{ h.n.at ? ' · ' + ago(h.n.at) : '' }}</div>
              <h2 class="nw-ttl">{{ h.n.title }}</h2>
              @if (h.n.summary && h.n.summary !== h.n.title) { <p class="nw-sum">{{ h.n.summary }}</p> }
              <div class="nw-btns">
                <button type="button" class="nw-play" (click)="openCat(h.cat.id, 0)"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10" /></svg>Read</button>
                <a class="nw-ghost" [href]="h.n.link" target="_blank" rel="noopener noreferrer">Full story <svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8" /></svg></a>
                <button type="button" class="nw-ghost" (click)="share(h.n)"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg>Share</button>
              </div>
            </div>
          </section>
        } @else {
          <section class="nw-hero" style="--a:#1a1626;--b:#0b0b0f"></section>
        }
        @for (c of ordered(); track c.id; let r = $index) {
          @if (rows()[c.id] !== null) {
            <section class="nw-row" [style.animation-delay.ms]="150 + r * 70" [attr.aria-label]="c.label">
              <h3><span aria-hidden="true">{{ c.icon }}</span> {{ c.label }}</h3>
              <div class="nw-tiles">
                @if (rows()[c.id]; as list) {
                  @for (n of list; track n.link; let i = $index) {
                    <button type="button" class="nw-tile" [style.--a]="c.a" [style.--b]="c.b" (click)="openCat(c.id, i)">
                      <span class="nw-sym" aria-hidden="true">{{ c.icon }}</span>
                      <small>{{ n.source }}{{ n.at ? ' · ' + ago(n.at) : '' }}</small>
                      <b>{{ n.title }}</b>
                    </button>
                  }
                } @else {
                  @for (k of [1, 2, 3]; track k) { <div class="nw-sk" aria-hidden="true"></div> }
                }
              </div>
            </section>
          }
        }
        <p class="nw-note">Headlines and short summaries from the publishers’ public feeds — tap “Full story” to read on their site. Colours and symbols are our own design.</p>
      </div>

      @if (reading(); as rd) {
        <div class="nw-read" [style.--a]="rd.cat.a">
          <div class="nw-rtop">
            <button type="button" class="nw-back" aria-label="All news" (click)="toHome()"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg></button>
            <span>{{ rd.cat.icon }} {{ rd.cat.label }}</span>
            <em>{{ index() + 1 }} / {{ rd.list.length }}</em>
            <button type="button" class="nw-x" aria-label="Close news" (click)="close()"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
          <div #feed class="nw-feed" (scroll)="onScroll()" aria-live="polite">
            @for (n of rd.list; track n.link; let i = $index) {
              <article class="nw-card">
                <div class="nw-src">{{ n.source }}{{ n.at ? ' · ' + ago(n.at) : '' }}</div>
                <h3 class="nw-ttl">{{ n.title }}</h3>
                @if (n.summary && n.summary !== n.title) { <p class="nw-sum">{{ n.summary }}</p> }
                <div class="nw-btns">
                  <a class="nw-play" [href]="n.link" target="_blank" rel="noopener noreferrer">Read full story <svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8" /></svg></a>
                  <button type="button" class="nw-ghost" (click)="share(n)"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg>Share</button>
                </div>
                @if (i === 0 && rd.list.length > 1) { <p class="nw-hint">Swipe up for the next story ↑</p> }
              </article>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class NewsPanel implements OnDestroy {
  readonly closed = output<void>();
  /** Screen point to grow from (the 📰 button). */
  readonly origin = input<{ x: number; y: number } | null>(null);
  protected readonly ox = computed(() => (this.origin() ? this.origin()!.x + 'px' : '50%'));
  protected readonly oy = computed(() => (this.origin() ? this.origin()!.y + 'px' : '0%'));

  /** Headlines per category: undefined = loading, null = not available (row hidden). */
  protected readonly rows = signal<Record<string, News[] | null | undefined>>({});
  protected readonly first = signal('telangana');
  protected readonly ordered = computed(() => [CATS.find((c) => c.id === this.first())!, ...CATS.filter((c) => c.id !== this.first())]);
  protected readonly hero = computed(() => {
    for (const c of this.ordered()) {
      const list = this.rows()[c.id];
      if (list?.length) return { cat: c, n: list[0] };
    }
    return null;
  });
  protected readonly readCat = signal<string | null>(null);
  protected readonly reading = computed(() => {
    const id = this.readCat(), list = id ? this.rows()[id] : null;
    return id && list ? { cat: CATS.find((c) => c.id === id) as Cat, list } : null;
  });
  protected readonly index = signal(0);
  protected readonly leaving = signal(false);
  private readonly feed = viewChild<ElementRef<HTMLElement>>('feed');
  private overflow = '';
  /** Phone Back: 1 = open, 2 = reading a category — Back steps out instead of leaving the site. */
  private depth = 0;
  private readonly onPop = () => {
    if (this.depth === 2) {
      this.depth = 1;
      this.readCat.set(null);
    } else if (this.depth === 1) {
      this.depth = 0;
      this.shut();
    }
  };

  constructor() {
    if (typeof document !== 'undefined' && !document.getElementById('nw-css')) {
      const st = document.createElement('style');
      st.id = 'nw-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    afterNextRender(() => {
      this.overflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      // The visitor's own state first: last category read, else from the weather city (default Telangana)
      let start = 'telangana';
      try {
        start = localStorage.getItem(KEY) || (AP_CITIES.test(localStorage.getItem('weather-city') ?? '') ? 'andhra' : 'telangana');
      } catch {}
      this.first.set(CATS.some((c) => c.id === start) ? start : 'telangana');
      // Load the rows in the order shown (the CDN caches each feed for 15 minutes).
      this.ordered().forEach((c, i) => setTimeout(() => this.load(c.id), i * 60));
      this.depth = 1;
      history.pushState({ ...(history.state ?? {}), nw: 1 }, '');
      addEventListener('popstate', this.onPop);
    });
  }

  ngOnDestroy() {
    if (typeof document === 'undefined') return;
    document.documentElement.style.overflow = this.overflow;
    removeEventListener('popstate', this.onPop);
  }

  private async load(id: string) {
    try {
      const r = await fetch(`/api/news?cat=${id}`);
      const j = (await r.json()) as { items?: News[] };
      this.rows.update((m) => ({ ...m, [id]: j.items?.length ? j.items : null }));
    } catch {
      this.rows.update((m) => ({ ...m, [id]: null }));
    }
  }

  protected openCat(id: string, i: number) {
    try {
      localStorage.setItem(KEY, id);
    } catch {}
    if (this.depth === 1) {
      this.depth = 2;
      history.pushState({ ...(history.state ?? {}), nw: 2 }, '');
    }
    this.readCat.set(id);
    this.index.set(i);
    setTimeout(() => {
      const el = this.feed()?.nativeElement;
      if (el) el.scrollTo({ top: i * el.clientHeight });
    });
  }

  protected toHome() {
    if (this.depth === 2) return history.back();
    this.readCat.set(null);
  }

  protected close() {
    if (this.leaving()) return;
    const d = this.depth;
    this.depth = 0;
    if (d) history.go(-d);
    this.shut();
  }

  private shut() {
    if (this.leaving()) return;
    this.leaving.set(true);
    const quick = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => this.closed.emit(), quick ? 0 : 280);
  }

  protected onScroll() {
    const el = this.feed()?.nativeElement;
    if (el) this.index.set(Math.round(el.scrollTop / Math.max(1, el.clientHeight)));
  }

  protected key(e: KeyboardEvent) {
    if (e.key === 'Escape') return this.reading() ? this.toHome() : this.close();
    const el = this.feed()?.nativeElement;
    if (!el || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    e.preventDefault();
    el.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * el.clientHeight, behavior: 'smooth' });
  }

  protected async share(n: News) {
    const text = `${n.title}\n\n📰 More news: tools.spreadapps.in`;
    try {
      if (navigator.share) return await navigator.share({ title: n.title, text, url: n.link });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    open(`https://wa.me/?text=${encodeURIComponent(`${n.title}\n${n.link}\n\n📰 More news: tools.spreadapps.in`)}`, '_blank', 'noopener');
  }

  protected ago(iso: string) {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
    const d = Math.round(h / 24);
    return `${d} day${d > 1 ? 's' : ''} ago`;
  }
}
