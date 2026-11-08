import { Component, Directive, ElementRef, OnDestroy, ViewEncapsulation, afterNextRender, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { GameFx } from '../core/game-fx';
import { LANGS, phoneLang } from '../core/langs';
import { storyArt } from '../core/story-art';
import { LESSON_WORD, STORIES, STORY_COL_INFO, StoryLang } from '../core/stories';
import { StoriesService } from '../core/stories.service';
import { ToastService } from '../core/toast.service';

const LANG_KEY = 'stories-lang';
const LIKED_KEY = 'stories-liked';
const HINT_KEY = 'stories-hinted';
const SITE = 'https://tools.spreadapps.in';

/**
 * Spread Stories overlay: swipe cards of short lessons. Styles are added to the page the first time
 * it opens (they ship in this lazy chunk, not in the site's CSS). Picture classes: `ss-a-*`.
 */
const CSS = `
.ss{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;gap:14px;background:#05040f;color:#fff4dc;animation:ss-in .3s cubic-bezier(.2,.8,.2,1);user-select:none}
@keyframes ss-in{from{opacity:0;transform:scale(.97)}}
.ss-panel{position:relative;width:min(440px,100vw);height:100dvh;background:#0c0a1f;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto minmax(0,1fr);overflow:hidden}
@media (min-width:600px){.ss-panel{height:min(calc(100dvh - 32px),880px);border-radius:24px;box-shadow:0 30px 80px rgb(0 0 0/.6)}}
.ss-nav{display:none;width:40px;height:40px;border-radius:50%;border:1px solid rgb(255 244 220/.2);background:rgb(255 255 255/.06);color:#fff4dc;font-size:22px;cursor:pointer}
@media (min-width:600px){.ss-nav{display:grid;place-items:center}}
.ss-nav:disabled{opacity:.25;cursor:default}
.ss-bars{display:flex;gap:4px;align-items:center;padding:10px 14px 0}
.ss-bars i{flex:1;height:3px;border-radius:3px;background:rgb(255 255 255/.22)}.ss-bars i.on{background:#fff4dc}
.ss-bars em{font:500 11px system-ui;font-style:normal;color:rgb(255 244 220/.6);margin-left:6px;font-variant-numeric:tabular-nums}
.ss-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:6px;padding:8px 12px 2px}
.ss-mark{display:flex;align-items:center;gap:6px;font:700 16px Georgia,serif;white-space:nowrap}
.ss-mark i{width:16px;height:16px;border-radius:50%;background:conic-gradient(#f6a623,#e8436b,#8b5cf6,#0d9488,#f6a623);box-shadow:0 0 10px rgb(246 166 35/.6)}
.ss-right{display:flex;gap:6px;justify-content:flex-end}
.ss-ib,.ss-lang{height:30px;border-radius:999px;border:1px solid rgb(255 244 220/.14);background:rgb(255 255 255/.07);color:#fff4dc;cursor:pointer;display:grid;place-items:center;padding:0}
.ss-ib{width:30px}.ss-ib svg,.ss-lang svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ss-lang{justify-self:start;display:flex;gap:4px;padding:0 9px 0 7px;font:600 12.5px "Noto Sans Telugu","Nirmala UI",system-ui}
.ss-lang .car{width:10px;height:10px;transition:rotate .25s}.ss-lang[aria-expanded=true] .car{rotate:180deg}
.ss-pop{position:absolute;left:12px;top:72px;z-index:32;display:grid;grid-template-columns:1fr 1fr;gap:2px;width:min(260px,calc(100% - 24px));max-height:calc(100% - 90px);overflow:auto;padding:6px;border-radius:16px;background:#fff9ee;color:#1d1530;box-shadow:0 20px 40px rgb(0 0 0/.45);transform-origin:24px 0;animation:ss-swing .55s cubic-bezier(.2,1.3,.4,1)}
@keyframes ss-swing{0%{opacity:0;transform:perspective(500px) rotateX(-80deg)}60%{opacity:1;transform:perspective(500px) rotateX(10deg)}100%{transform:perspective(500px) rotateX(0)}}
.ss-pop button{display:flex;justify-content:space-between;align-items:center;gap:4px;border:0;background:none;padding:8px 9px;border-radius:10px;font:500 14px system-ui;color:#1d1530;cursor:pointer}
.ss-pop button:hover:not(:disabled){background:#f3e6cd}.ss-pop button[aria-checked=true]{background:#1d1530;color:#fff9ee}.ss-pop button:disabled{opacity:.55;cursor:default}
.ss-pop small{font-size:10px;opacity:.7}
.ss-chips{display:flex;gap:6px;overflow-x:auto;padding:6px 12px 8px;scrollbar-width:none;justify-content:safe center}
.ss-chips::-webkit-scrollbar{display:none}
.ss-chip{flex:none;border:1px solid rgb(255 244 220/.2);background:rgb(255 255 255/.06);color:#fff4dc;border-radius:999px;padding:5px 11px;font:500 13px "Noto Sans Telugu","Nirmala UI",system-ui;cursor:pointer;transition:background .2s,transform .15s}
.ss-chip:active{transform:scale(.94)}.ss-chip[aria-pressed=true]{background:#f6a623;border-color:#f6a623;color:#0c0a1f;font-weight:700}
.ss button:focus-visible{outline:3px solid #facc15;outline-offset:2px}
.ss-stage{position:relative;overflow:hidden;min-height:0;cursor:grab}
.ss-stage{touch-action:pan-y}.ss-track{display:flex;height:100%;will-change:transform;transform:translate3d(0,0,0);backface-visibility:hidden}.ss-track.snap{transition:transform .38s cubic-bezier(.22,.9,.3,1)}
.ss-card{position:relative;flex:0 0 100%;height:100%;overflow:hidden}
.ss-art{position:absolute;inset:0 0 auto;height:60%;overflow:hidden}.ss-art svg{width:100%;height:100%;display:block}
.ss-art::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgb(12 10 31/.25),transparent 25%,transparent 55%,#0c0a1f)}
.ss-tag{position:absolute;left:12px;top:8px;z-index:1;font:600 10px system-ui;letter-spacing:.08em;text-transform:uppercase;background:rgb(12 10 31/.5);padding:4px 8px;border-radius:999px}
.ss-txt{position:absolute;inset:46% 0 0;padding:0 54px 18px 16px;display:flex;flex-direction:column;gap:7px;overflow:auto;scrollbar-width:none}
.ss-txt::-webkit-scrollbar{display:none}
@media (max-height:760px){.ss-art{height:52%}.ss-txt{top:37%}}
.ss-src{font:700 11px system-ui;color:#f2c14e;letter-spacing:.04em;text-transform:uppercase;text-shadow:0 1px 6px rgb(0 0 0/.8)}
.ss-ttl{margin:0;font:700 23px/1.35 "Noto Sans Telugu","Nirmala UI",system-ui;text-wrap:balance;text-shadow:0 2px 14px rgb(0 0 0/.9)}
.ss-txt[lang=en] .ss-ttl{font:700 25px/1.15 Georgia,"Times New Roman",serif}
.ss-story{margin:0;font:400 15.5px/1.6 "Noto Sans Telugu","Nirmala UI",system-ui;color:rgb(255 244 220/.86)}
.ss-txt[lang=en] .ss-story{line-height:1.5}
.ss-lesson{margin:2px 0 0;padding:9px 12px;border-radius:14px;background:linear-gradient(135deg,rgb(246 166 35/.2),rgb(232 67 107/.14));border:1px solid rgb(246 166 35/.38);font:700 15px/1.45 "Noto Sans Telugu","Nirmala UI",system-ui}
.ss-lesson small{display:block;font:700 10px system-ui;letter-spacing:.1em;text-transform:uppercase;color:#f2c14e;margin-bottom:2px}
.ss-card.in .ss-ttl,.ss-card.in .ss-lesson{animation:ss-rise .5s cubic-bezier(.2,.8,.2,1) both}.ss-card.in .ss-lesson{animation-delay:.12s}
@keyframes ss-rise{from{opacity:0;translate:0 8px}}
.ss-rail{position:absolute;right:8px;bottom:18px;display:flex;flex-direction:column;gap:10px;z-index:4}
.ss-rail button{width:38px;border:0;background:none;color:#fff4dc;cursor:pointer;display:grid;justify-items:center;gap:2px;font:500 9.5px system-ui;padding:0}
.ss-rail span{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:rgb(255 255 255/.1);border:1px solid rgb(255 244 220/.16);transition:transform .15s,background .2s}
.ss-rail button:hover span{background:rgb(255 255 255/.18)}.ss-rail button:active span{transform:scale(.85)}
.ss-rail svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ss-rail .liked span{background:rgb(232 67 107/.28);border-color:rgb(255 90 122/.5)}.ss-rail .liked svg{fill:#ff5a7a;stroke:#ff5a7a;animation:ss-pop .4s}
@keyframes ss-pop{40%{transform:scale(1.4)}}
.ss-hint{position:absolute;left:50%;top:22%;translate:-50% 0;z-index:4;pointer-events:none;display:grid;justify-items:center;gap:6px;font:600 13px system-ui}
.ss-hint b{font-size:34px;animation:ss-swipe 1.6s ease-in-out infinite;filter:drop-shadow(0 4px 6px rgb(0 0 0/.5))}
.ss-hint span{background:rgb(12 10 31/.7);padding:5px 10px;border-radius:999px;white-space:nowrap}
@keyframes ss-swipe{0%,100%{translate:34px 0;rotate:8deg}50%{translate:-34px 0;rotate:-8deg}}
.ss-scrim{position:absolute;inset:0;z-index:29;background:rgb(6 4 18/.5);animation:ss-fade .25s}.ss-scrim.clear{background:transparent}
@keyframes ss-fade{from{opacity:0}}
.ss-sheet{position:absolute;inset:auto 0 0;z-index:30;background:#fff9ee;color:#1d1530;border-radius:22px 22px 0 0;padding:10px 16px 20px;box-shadow:0 -20px 40px rgb(0 0 0/.35);animation:ss-up .32s cubic-bezier(.2,.9,.3,1.1)}
.ss-sheet::before{content:"";display:block;width:38px;height:4px;border-radius:4px;background:#d9cbb0;margin:0 auto 12px}
@keyframes ss-up{from{translate:0 100%}}
.ss-sheet h3{margin:0 0 10px;font:700 16px system-ui}
.ss-sheet textarea{width:100%;box-sizing:border-box;min-height:80px;border-radius:12px;border:1px solid #e3d5bb;padding:10px;font:15px "Noto Sans Telugu","Nirmala UI",system-ui;background:#fff;color:#1d1530;resize:none}
.ss-sheet p{font:12px system-ui;color:#6b5f7a;margin:6px 0 10px}
.ss-big{width:100%;border:0;border-radius:14px;padding:12px;font:700 14px system-ui;background:linear-gradient(135deg,#f6a623,#e8436b);color:#fff;cursor:pointer}.ss-big:disabled{opacity:.6}
.ss-a-float{animation:ss-float 4.5s ease-in-out infinite}.ss-a-fly{animation:ss-fly 3.2s ease-in-out infinite}
.ss-a-sway{animation:ss-sway 5s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
.ss-a-spin{animation:ss-spin 26s linear infinite;transform-box:fill-box;transform-origin:center}
.ss-a-glow{animation:ss-glow 3.5s ease-in-out infinite}.ss-a-tw{animation:ss-tw 2.4s ease-in-out infinite}
.ss-a-drift{animation:ss-drift 6s linear infinite}.ss-a-fall{animation:ss-fall 7s linear infinite}
.ss-a-rip{animation:ss-rip 3.6s ease-out infinite;transform-box:fill-box;transform-origin:center}
.ss-a-wind{animation:ss-wind 1.8s linear infinite}.ss-a-breathe{animation:ss-breathe 4s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes ss-float{50%{translate:0 -8px}}@keyframes ss-fly{50%{translate:-6px -10px}}@keyframes ss-sway{50%{rotate:4deg}}@keyframes ss-spin{to{rotate:360deg}}
@keyframes ss-glow{50%{opacity:.6}}@keyframes ss-tw{50%{opacity:.2}}
@keyframes ss-drift{from{translate:0 0;opacity:0}15%{opacity:1}to{translate:40px -150px;opacity:0}}
@keyframes ss-fall{from{translate:0 -40px;rotate:0deg;opacity:0}10%{opacity:1}to{translate:-60px 320px;rotate:300deg;opacity:0}}
@keyframes ss-rip{from{scale:.4;opacity:.8}to{scale:1.6;opacity:0}}
@keyframes ss-wind{from{translate:120px 0;opacity:0}30%{opacity:.8}to{translate:-220px 0;opacity:0}}
@keyframes ss-breathe{50%{scale:1.015}}
@media (prefers-reduced-motion:reduce){.ss *,.ss{animation:none!important;transition:none!important}}
`;

/** Puts one of our own constant SVG drawings into the element (no user input involved). */
@Directive({ selector: '[ssArt]' })
export class StoryArtHost {
  readonly ssArt = input.required<string>();
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    effect(() => (this.el.nativeElement.innerHTML = this.ssArt()));
  }
}

@Component({
  selector: 'app-stories',
  imports: [StoryArtHost],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="ss" role="dialog" aria-modal="true" aria-label="Spread Stories" (click)="backdrop($event)">
      <button type="button" class="ss-nav" aria-label="Previous story" [disabled]="idx() === 0" (click)="step(-1)">‹</button>
      <div class="ss-panel" #panel>
        <div class="ss-bars" aria-hidden="true">
          @for (k of colIdx(); track k) { <i [class.on]="k <= idx()"></i> }
          <em>{{ idx() + 1 }}/{{ stories.length }}</em>
        </div>
        <div class="ss-top">
          <button type="button" class="ss-lang" aria-haspopup="true" aria-label="Language" [attr.aria-expanded]="menu()" (click)="toggleMenu()">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></svg>
            <span>{{ langName() }}</span>
            <svg class="car" viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" /></svg>
          </button>
          <div class="ss-mark" aria-hidden="true"><i></i>Spread Stories</div>
          <div class="ss-right">
            <button type="button" class="ss-ib" aria-label="Close stories" (click)="close()"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
        </div>
        <div class="ss-chips" #chips role="group" aria-label="Collections">
          @for (c of cols; track c.id) {
            <button type="button" class="ss-chip" [attr.aria-pressed]="cur().c === c.id" (click)="jump(c.id)">{{ c.icon }} <span>{{ c.n[uiLang()] }}</span></button>
          }
        </div>
        <div class="ss-stage" #stage>
          <div class="ss-track" #track>
            @for (s of stories; track s.slug; let i = $index) {
              <article class="ss-card" [class.in]="i === idx()" [attr.aria-hidden]="i !== idx()" aria-roledescription="story">
                @if (i >= idx() - 1 && i <= idx() + 1) { <div class="ss-art" [ssArt]="art(i)"></div> }
                <span class="ss-tag">{{ colOf(s.c).icon }} {{ colOf(s.c).n[uiLang()] }}</span>
                <div class="ss-txt" [attr.lang]="lang()">
                  <div class="ss-src">{{ s[lang()].src }}</div>
                  <h2 class="ss-ttl">{{ s[lang()].t }}</h2>
                  <p class="ss-story">{{ s[lang()].s }}</p>
                  <p class="ss-lesson"><small>{{ lessonWord() }}</small>{{ s[lang()].l }}</p>
                </div>
              </article>
            }
          </div>
          <div class="ss-rail">
            <button type="button" [class.liked]="liked()[key()]" [attr.aria-pressed]="!!liked()[key()]" aria-label="Like this story" (click)="like()">
              <span><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg></span>{{ likeCount() }}
            </button>
            <button type="button" aria-label="Share this story" (click)="share()">
              <span><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg></span>Share
            </button>
            <button type="button" aria-label="Suggest a story" (click)="openSuggest()">
              <span><svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg></span>Suggest
            </button>
          </div>
          @if (hint()) { <div class="ss-hint" aria-hidden="true"><b>👆</b><span>{{ lang() === 'te' ? 'తదుపరి కథకు స్వైప్ చేయండి' : 'Swipe for the next story' }}</span></div> }
        </div>

        @if (menu()) {
          <div class="ss-scrim clear" (click)="menu.set(false)"></div>
          <div class="ss-pop" role="menu" aria-label="Language">
            @for (l of langs; track l.id) {
              <button type="button" role="menuitemradio" [attr.lang]="l.id" [attr.aria-checked]="uiLang() === l.id" [disabled]="l.id !== 'te' && l.id !== 'en'" (click)="setLang(l.id)">
                {{ l.own }}@if (l.id !== 'te' && l.id !== 'en') { <small>soon</small> }
              </button>
            }
          </div>
        }
        @if (suggesting()) {
          <div class="ss-scrim" (click)="suggesting.set(false)"></div>
          <div class="ss-sheet" role="dialog" aria-label="Suggest a story">
            <h3>{{ lang() === 'te' ? 'ఏ కథ కావాలి?' : 'Which story should we add?' }}</h3>
            <textarea #sug maxlength="400" [placeholder]="lang() === 'te' ? 'ఉదా: ప్రహ్లాదుడి కథ' : 'e.g. Prahlada’s story'" aria-label="Your story idea"></textarea>
            <p>{{ lang() === 'te' ? 'మీ సూచన నేరుగా Spread Apps టీమ్‌కు వెళ్తుంది. మీ పేరు, ఫోన్ అడగం.' : 'Your idea goes straight to the Spread Apps team. We don’t ask your name or phone.' }}</p>
            <button type="button" class="ss-big" [disabled]="sending()" (click)="sendSuggest(sug.value)">{{ lang() === 'te' ? 'పంపండి' : 'Send' }}</button>
          </div>
        }
      </div>
      <button type="button" class="ss-nav" aria-label="Next story" [disabled]="idx() === stories.length - 1" (click)="step(1)">›</button>
    </div>
  `,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class StoriesOverlay implements OnDestroy {
  private readonly svc = inject(StoriesService);
  private readonly toast = inject(ToastService);
  private readonly chipsEl = viewChild<ElementRef<HTMLElement>>('chips');
  private readonly stageEl = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly trackEl = viewChild<ElementRef<HTMLElement>>('track');
  /** Swipe state lives outside signals so a moving finger never re-renders the cards. */
  private drag: { id: number; x0: number; y0: number; t0: number; dx: number; mode: 'wait' | 'drag' | 'off' } | null = null;
  private frame = 0;
  private readonly onResize = () => this.place(0, false);
  private readonly fx = new GameFx();
  private readonly arts = new Map<number, string>();
  private overflow = '';

  protected readonly stories = STORIES;
  protected readonly cols = STORY_COL_INFO;
  protected readonly langs = LANGS;
  protected readonly idx = signal(0);
  protected readonly lang = signal<StoryLang>('te');
  protected readonly menu = signal(false);
  protected readonly suggesting = signal(false);
  protected readonly sending = signal(false);
  protected readonly hint = signal(false);
  protected readonly liked = signal<Record<string, boolean>>({});
  private readonly counts = signal<Record<string, number>>({});

  protected readonly uiLang = this.lang;
  protected readonly cur = computed(() => STORIES[this.idx()]);
  protected readonly key = computed(() => `story-${this.cur().c}-${this.cur().slug}`);
  protected readonly colIdx = computed(() => STORIES.map((s, i) => (s.c === this.cur().c ? i : -1)).filter((i) => i >= 0));
  protected readonly langName = computed(() => LANGS.find((l) => l.id === this.lang())!.own);
  protected readonly lessonWord = computed(() => LESSON_WORD[this.lang()]);
  protected readonly likeCount = computed(() => {
    const n = (this.counts()[this.key()] ?? 0) + (this.liked()[this.key()] ? 1 : 0);
    return n ? String(n) : this.lang() === 'te' ? 'నచ్చింది' : 'Like';
  });

  constructor() {
    if (typeof document !== 'undefined' && !document.getElementById('ss-css')) {
      const st = document.createElement('style');
      st.id = 'ss-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    afterNextRender(() => {
      this.overflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      try {
        const l = localStorage.getItem(LANG_KEY);
        this.lang.set(l === 'en' || l === 'te' ? l : phoneLang() === 'te' ? 'te' : 'en');
        this.liked.set(Object.fromEntries((JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]') as string[]).map((k) => [k, true])));
        if (!localStorage.getItem(HINT_KEY)) {
          this.hint.set(true);
          setTimeout(() => this.hideHint(), 5000);
        }
      } catch {}
      this.fx.unlock();
      const st = this.svc.start();
      const at = st ? STORIES.findIndex((s) => s.c === st.col && (!st.slug || s.slug === st.slug)) : -1;
      if (at >= 0) this.idx.set(at);
      this.place(0, false);
      this.wireSwipe();
      addEventListener('resize', this.onResize);
      if (st?.welcome) {
        import('../core/celebrate').then((c) => c.shower('festive', 4500));
        setTimeout(() => this.fx.chime(), 300);
      }
      this.centerChip();
    });
    // Like totals for the story on screen (cached by the CDN).
    effect(() => {
      const k = this.key();
      if (typeof fetch === 'undefined' || k in this.counts()) return;
      this.counts.update((c) => ({ ...c, [k]: 0 }));
      fetch(`/api/like?page=${k}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && typeof d.count === 'number' && this.counts.update((c) => ({ ...c, [k]: d.count })))
        .catch(() => undefined);
    });
  }

  ngOnDestroy() {
    if (typeof document === 'undefined') return;
    document.documentElement.style.overflow = this.overflow;
    removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.frame);
  }

  /** Moves the strip of cards: the current card plus `px` of finger travel. */
  private place(px: number, animate: boolean) {
    const t = this.trackEl()?.nativeElement, w = this.stageEl()?.nativeElement.clientWidth ?? 0;
    if (!t) return;
    t.classList.toggle('snap', animate);
    t.style.transform = `translate3d(${-this.idx() * w + px}px,0,0)`;
  }

  /** Native pointer listeners (no change detection per move); a vertical drag is left to text scrolling. */
  private wireSwipe() {
    const st = this.stageEl()?.nativeElement;
    if (!st) return;
    st.addEventListener('pointerdown', (e) => {
      if (this.drag || (e.target as HTMLElement).closest('.ss-rail')) return;
      this.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), dx: 0, mode: 'wait' };
    });
    st.addEventListener('pointermove', (e) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId || d.mode === 'off') return;
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (d.mode === 'wait') {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) return void (d.mode = 'off');
        d.mode = 'drag';
        d.x0 = e.clientX;
        d.t0 = performance.now();
        st.setPointerCapture(e.pointerId);
        this.fx.unlock();
        this.hideHint();
      }
      const raw = e.clientX - d.x0;
      const edge = (this.idx() === 0 && raw > 0) || (this.idx() === STORIES.length - 1 && raw < 0);
      d.dx = edge ? raw / 3 : raw;
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.place(d.dx, false));
    });
    const end = (e: PointerEvent) => {
      const d = this.drag;
      if (!d || d.id !== e.pointerId) return;
      this.drag = null;
      cancelAnimationFrame(this.frame);
      if (d.mode !== 'drag') return;
      const w = st.clientWidth, v = d.dx / Math.max(1, performance.now() - d.t0);
      if (d.dx < -w * 0.18 || v < -0.4) this.step(1);
      else if (d.dx > w * 0.18 || v > 0.4) this.step(-1);
      else this.place(0, true);
    };
    st.addEventListener('pointerup', end);
    st.addEventListener('pointercancel', end);
  }

  protected art(i: number): string {
    let a = this.arts.get(i);
    if (!a) {
      a = storyArt(STORIES[i].art, STORIES[i].v);
      this.arts.set(i, a);
    }
    return a;
  }

  protected colOf(id: string) {
    return STORY_COL_INFO.find((c) => c.id === id)!;
  }

  protected go(i: number) {
    const n = Math.max(0, Math.min(STORIES.length - 1, i));
    if (n !== this.idx()) {
      this.fx.unlock();
      this.fx.whoosh();
    }
    this.idx.set(n);
    this.place(0, true);
    this.centerChip();
  }

  protected step(d: number) {
    this.go(this.idx() + d);
    this.hideHint();
  }

  protected jump(col: string) {
    this.fx.unlock();
    this.fx.tik();
    this.go(STORIES.findIndex((s) => s.c === col));
    this.hideHint();
  }

  private centerChip() {
    setTimeout(() => {
      const row = this.chipsEl()?.nativeElement;
      const ch = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (row && ch) row.scrollTo({ left: ch.offsetLeft - (row.clientWidth - ch.offsetWidth) / 2, behavior: 'smooth' });
    });
  }

  private hideHint() {
    if (!this.hint()) return;
    this.hint.set(false);
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {}
  }

  protected onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.menu() || this.suggesting()) {
        this.menu.set(false);
        this.suggesting.set(false);
      } else this.close();
      return;
    }
    if (this.menu() || this.suggesting()) return;
    if (e.key === 'ArrowRight') this.step(1);
    if (e.key === 'ArrowLeft') this.step(-1);
  }

  /** A click on the dark area around the panel (laptops) closes the stories. */
  protected backdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) this.close();
  }

  protected close() {
    this.fx.tik();
    this.svc.close();
  }

  protected toggleMenu() {
    this.fx.unlock();
    this.menu.update((m) => !m);
    if (this.menu()) this.fx.soft();
  }

  protected setLang(l: string) {
    if (l !== 'te' && l !== 'en') return;
    this.lang.set(l);
    this.menu.set(false);
    this.fx.pop();
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {}
  }

  protected like() {
    this.fx.unlock();
    const k = this.key();
    if (this.liked()[k]) return this.fx.tik();
    this.liked.update((l) => ({ ...l, [k]: true }));
    this.fx.pop();
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify(Object.keys(this.liked())));
    } catch {}
    fetch('/api/like', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ page: k, name: `Story: ${this.cur().en.t}` }), keepalive: true }).catch(() => undefined);
  }

  protected async share() {
    this.fx.unlock();
    this.fx.tik();
    const s = this.cur(), t = s[this.lang()];
    const url = `${SITE}/stories/${s.c}/${s.slug}?utm_source=story-share&utm_medium=social`;
    const text = `${t.t} ✨\n${t.l}`;
    try {
      if (navigator.share) return await navigator.share({ title: `${t.t} · Spread Stories`, text, url });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      this.toast.show(this.lang() === 'te' ? 'లింక్ కాపీ అయింది — WhatsAppలో పేస్ట్ చేయండి' : 'Link copied — paste it in WhatsApp', 'success');
    } catch {
      open('https://wa.me/?text=' + encodeURIComponent(`${text}\n${url}`), '_blank', 'noopener');
    }
  }

  protected openSuggest() {
    this.fx.unlock();
    this.fx.soft();
    this.suggesting.set(true);
    setTimeout(() => document.querySelector<HTMLTextAreaElement>('.ss-sheet textarea')?.focus(), 300);
  }

  protected async sendSuggest(text: string) {
    const te = this.lang() === 'te';
    if (text.trim().length < 3) return this.toast.show(te ? 'కొన్ని మాటలు రాయండి' : 'Please write a few words', 'warning');
    this.sending.set(true);
    try {
      const r = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ page: 'spread-stories', name: 'Spread Stories', text: text.trim(), website: '' }) });
      if (!r.ok) throw new Error();
      this.suggesting.set(false);
      this.fx.chime();
      this.toast.show(te ? 'ధన్యవాదాలు! మీ సూచన మాకు చేరింది 🙏' : 'Thank you! Your idea reached us 🙏', 'success');
    } catch {
      this.toast.show(te ? 'పంపలేకపోయాం. కాసేపాగి మళ్లీ ప్రయత్నించండి.' : 'Couldn’t send. Please try again in a while.', 'warning');
    } finally {
      this.sending.set(false);
    }
  }
}
