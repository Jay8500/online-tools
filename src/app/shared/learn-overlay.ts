import { Component, ElementRef, OnDestroy, ViewEncapsulation, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { BackLayer, pushLayer } from '../core/back-layer';
import { GameFx } from '../core/game-fx';
import { phoneLang } from '../core/langs';
import { LEARN_IMG } from '../core/learn/learn-img';
import { CARDS, COUNTRIES, FIELDS, TOPICS, UI } from '../core/learn/topics';
import type { LearnCard, LearnLang, LearnTopic, TopicId } from '../core/learn/types';
import { LearnService } from '../core/learn.service';
import { ToastService } from '../core/toast.service';

const LANG_KEY = 'learn-lang';
const HINT_KEY = 'learn-hinted';
const SITE = 'https://tools.spreadapps.in';

/** Styles ship in this lazy chunk and are added the first time Spread Learn opens. */
const CSS = `
.sl{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:#05060f;color:#f5f3ff;--ox:50%;--oy:0%;animation:sl-reveal .55s cubic-bezier(.7,0,.3,1) both;-webkit-tap-highlight-color:transparent}
.sl.out{animation:sl-hide .3s cubic-bezier(.7,0,.3,1) both}
@keyframes sl-reveal{from{clip-path:circle(0 at var(--ox) var(--oy))}to{clip-path:circle(150vmax at var(--ox) var(--oy))}}
@keyframes sl-hide{from{clip-path:circle(150vmax at var(--ox) var(--oy))}to{clip-path:circle(0 at var(--ox) var(--oy))}}
.sl button{font-family:inherit}
.sl button:focus-visible,.sl a:focus-visible{outline:3px solid #facc15;outline-offset:2px}
.sl-te{font-family:"Noto Sans Telugu","Nirmala UI",system-ui,sans-serif}
.sl-ib{width:34px;height:34px;flex:none;border-radius:50%;border:1px solid rgb(255 255 255/.16);background:rgb(255 255 255/.08);color:#f5f3ff;display:grid;place-items:center;cursor:pointer;padding:0;transition:transform .15s,background .2s}
.sl-ib:active{transform:scale(.88)}.sl-ib:hover{background:rgb(255 255 255/.16)}
.sl-ib svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.sl-ib.on{background:#facc15;color:#111;border-color:#facc15}
.sl-mark{display:flex;align-items:center;gap:7px;font:800 17px Georgia,serif;white-space:nowrap}
.sl-mark i{width:16px;height:16px;border-radius:50%;background:conic-gradient(#38bdf8,#a78bfa,#f472b6,#facc15,#38bdf8);box-shadow:0 0 12px rgb(56 189 248/.6)}
.sl-lang{height:34px;border-radius:999px;border:1px solid rgb(255 255 255/.16);background:rgb(255 255 255/.08);color:#f5f3ff;padding:0 12px;font:700 13px "Noto Sans Telugu","Nirmala UI",system-ui;cursor:pointer}
/* home */
.sl-home{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:none;background:#05060f}
.sl-home::-webkit-scrollbar{display:none}
.sl-hb{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px 26px;background:linear-gradient(#05060f,rgb(5 6 15/.8) 50%,transparent)}
.sl-hb .r{display:flex;gap:8px}
.sl-hero{position:relative;height:min(58dvh,520px);margin-top:-72px;overflow:hidden;cursor:pointer}
.sl-hero img,.sl-hero .sl-emo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:sl-kb 16s ease-out both}
@keyframes sl-kb{from{transform:scale(1.02)}to{transform:scale(1.1)}}
.sl-hero img{object-position:center 22%}
.sl-hero .sl-w{justify-self:start}
.sl-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,#05060f 4%,rgb(5 6 15/.55) 38%,transparent 70%)}
.sl-hero-t{position:absolute;left:16px;right:16px;bottom:18px;z-index:1;display:grid;gap:8px;max-width:560px}
.sl-badge{justify-self:start;font:800 10.5px system-ui;letter-spacing:.14em;text-transform:uppercase;color:#05060f;background:linear-gradient(135deg,#38bdf8,#a78bfa);padding:3px 8px;border-radius:4px}
.sl-hero h2{margin:0;font:800 clamp(28px,7vw,48px)/1.15 "Noto Sans Telugu","Nirmala UI",Georgia,serif;text-shadow:0 2px 20px rgb(0 0 0/.9)}
.sl-go{justify-self:start;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:8px;padding:10px 20px;background:#f5f3ff;color:#05060f;font:800 15px "Noto Sans Telugu","Nirmala UI",system-ui;cursor:pointer}
.sl-go:active{transform:scale(.95)}
.sl-topics{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px 16px 4px}
@media (min-width:760px){.sl-topics{grid-template-columns:repeat(4,1fr);padding:18px 4vw 4px}.sl-topic{aspect-ratio:4/3}.sl-hero{height:min(66dvh,600px)}.sl-hero-t{left:4vw;bottom:6vh}.sl-row h3,.sl-hb{padding-left:4vw;padding-right:4vw}.sl-tiles{padding-left:4vw!important}}
.sl-topic{position:relative;aspect-ratio:4/5;border:0;padding:0;border-radius:16px;overflow:hidden;cursor:pointer;color:#fff;text-align:left;box-shadow:0 10px 30px rgb(0 0 0/.45);transition:transform .25s cubic-bezier(.2,.8,.2,1)}
.sl-topic:active{transform:scale(.96)}
@media (hover:hover){.sl-topic:hover{transform:translateY(-4px)}}
.sl-topic img,.sl-topic .sl-emo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sl-topic::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgb(0 0 0/.88),rgb(0 0 0/.1) 60%)}
.sl-topic div{position:absolute;left:12px;right:12px;bottom:12px;z-index:1;display:grid;gap:3px}
.sl-topic b{font:800 19px/1.2 "Noto Sans Telugu","Nirmala UI",system-ui}
.sl-topic small{font:500 12px/1.35 "Noto Sans Telugu","Nirmala UI",system-ui;opacity:.85}
.sl-topic em{position:absolute;top:10px;right:10px;z-index:1;font:700 11px system-ui;font-style:normal;background:rgb(0 0 0/.45);padding:3px 8px;border-radius:999px}
.sl-row{padding:14px 0 2px}
.sl-row h3{margin:0 16px 6px;font:700 16px "Noto Sans Telugu","Nirmala UI",system-ui}
.sl-tiles{display:flex;gap:8px;overflow-x:auto;padding:4px 16px 12px;scroll-snap-type:x mandatory;scrollbar-width:none}
.sl-tiles::-webkit-scrollbar{display:none}
.sl-tile{position:relative;flex:0 0 clamp(128px,36vw,190px);aspect-ratio:3/4;border:0;padding:0;border-radius:12px;overflow:hidden;background:#151729;color:#fff;cursor:pointer;scroll-snap-align:start;text-align:left}
.sl-tile img,.sl-tile .sl-emo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sl-tile::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgb(0 0 0/.9),transparent 60%)}
.sl-tile span{position:absolute;left:8px;right:8px;bottom:8px;z-index:1;display:grid;gap:2px;font:700 13px/1.25 "Noto Sans Telugu","Nirmala UI",system-ui}
.sl-tile i{font:600 10.5px system-ui;font-style:normal;color:#7dd3fc}
.sl-tile:active{transform:scale(.95)}
.sl-foot{padding:10px 16px 30px;font:12px/1.5 system-ui;color:rgb(245 243 255/.5)}
/* emoji art (body, first aid, missing photos) */
.sl-emo{display:grid;place-items:center;overflow:hidden;font-size:clamp(90px,30vw,150px);line-height:1}
.sl-emo::before,.sl-emo::after{content:"";position:absolute;border-radius:50%;border:2px solid rgb(255 255 255/.1)}
.sl-emo::before{width:120%;aspect-ratio:1;top:-30%;left:-10%}
.sl-emo::after{width:70%;aspect-ratio:1;top:6%;left:15%;background:radial-gradient(rgb(255 255 255/.14),transparent 70%)}
.sl-emo span{position:relative;z-index:1;margin-top:-30%;filter:drop-shadow(0 12px 24px rgb(0 0 0/.45))}
.sl-tile .sl-emo,.sl-topic .sl-emo{font-size:64px}.sl-tile .sl-emo span,.sl-topic .sl-emo span{margin-top:-22%}
/* reader */
.sl-panel{position:relative;width:min(480px,100vw);height:100dvh;display:grid;grid-template-rows:auto auto auto minmax(0,1fr) auto;background:#05060f;overflow:hidden}
@media (min-width:600px){.sl-panel{height:min(calc(100dvh - 32px),900px);border-radius:24px;box-shadow:0 30px 80px rgb(0 0 0/.6),0 0 0 1px rgb(255 255 255/.08)}}
.sl-top{display:flex;align-items:center;gap:8px;padding:10px 12px 6px}
.sl-top h2{flex:1;min-width:0;margin:0;font:800 16px "Noto Sans Telugu","Nirmala UI",system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 12px 8px;scrollbar-width:none}
.sl-chips::-webkit-scrollbar{display:none}
.sl-chip{flex:none;border:1px solid rgb(255 255 255/.16);background:rgb(255 255 255/.06);color:#f5f3ff;border-radius:999px;padding:6px 12px;font:600 13px "Noto Sans Telugu","Nirmala UI",system-ui;cursor:pointer;transition:background .2s,transform .15s}
.sl-chip:active{transform:scale(.94)}.sl-chip[aria-pressed=true]{background:#f5f3ff;color:#05060f;border-color:#f5f3ff}
.sl-chip.f{background:rgb(250 204 21/.16);border-color:rgb(250 204 21/.5);color:#fde68a}
.sl-prog{height:3px;margin:0 12px 8px;border-radius:3px;background:rgb(255 255 255/.14);overflow:hidden}
.sl-prog i{display:block;height:100%;background:linear-gradient(90deg,#38bdf8,#a78bfa,#f472b6);border-radius:3px;transition:width .35s cubic-bezier(.2,.8,.2,1)}
.sl-stage{position:relative;overflow:hidden;min-height:0;margin:0 10px;border-radius:20px;touch-action:pan-y;cursor:grab;background:#0d0f1f}
.sl-track{display:flex;height:100%;will-change:transform;backface-visibility:hidden}
.sl-track.snap{transition:transform .38s cubic-bezier(.22,.9,.3,1)}
.sl-card{position:relative;flex:0 0 100%;height:100%;overflow:hidden}
.sl-art{position:absolute;inset:0}
.sl-art img{width:100%;height:100%;object-fit:cover;object-position:center 30%;display:block}
.sl-art .sl-emo{position:absolute;inset:0;height:100%;place-items:start center;padding-top:7%;font-size:clamp(76px,22vw,112px)}
.sl-art .sl-emo span{margin-top:0}
.sl-card.in .sl-art img,.sl-card.in .sl-art .sl-emo{animation:sl-kb 14s ease-out both}
.sl-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(0deg,#05060f 0%,rgb(5 6 15/.92) 34%,rgb(5 6 15/.35) 58%,transparent 78%)}
.sl-credit{position:absolute;top:8px;right:8px;z-index:3;max-width:70%;font:500 10px/1.3 system-ui;color:rgb(255 255 255/.85);background:rgb(0 0 0/.45);padding:3px 8px;border-radius:999px;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl-body{position:absolute;left:0;right:0;bottom:0;z-index:2;max-height:76%;overflow-y:auto;padding:18px 16px 16px;display:flex;flex-direction:column;gap:9px;scrollbar-width:none;overscroll-behavior:contain}
.sl-body::-webkit-scrollbar{display:none}
.sl-tag{align-self:flex-start;font:700 11px "Noto Sans Telugu","Nirmala UI",system-ui;letter-spacing:.04em;color:#bae6fd;background:rgb(56 189 248/.16);border:1px solid rgb(56 189 248/.35);padding:3px 9px;border-radius:999px}
.sl-life{font:600 12px system-ui;color:rgb(245 243 255/.7)}
.sl-t{margin:0;font:800 27px/1.2 "Noto Sans Telugu","Nirmala UI",system-ui;text-wrap:balance;text-shadow:0 2px 16px rgb(0 0 0/.8)}
[lang=en] .sl-t{font-family:Georgia,"Times New Roman",serif;line-height:1.1}
.sl-w{align-self:flex-start;display:flex;align-items:baseline;gap:8px;padding:7px 13px;border-radius:12px;background:linear-gradient(135deg,rgb(56 189 248/.22),rgb(167 139 250/.22));border:1px solid rgb(167 139 250/.45)}
.sl-w small{font:700 10px system-ui;letter-spacing:.1em;text-transform:uppercase;color:#c4b5fd}
.sl-w b{font:800 18px "Noto Sans Telugu","Nirmala UI",system-ui;color:#fff}
.sl-s{margin:0;font:400 15.5px/1.65 "Noto Sans Telugu","Nirmala UI",system-ui;color:rgb(245 243 255/.9)}
[lang=en] .sl-s{line-height:1.5}
.sl-f{margin:0;padding:10px 12px;border-radius:14px;background:rgb(250 204 21/.1);border:1px solid rgb(250 204 21/.35);font:500 14.5px/1.55 "Noto Sans Telugu","Nirmala UI",system-ui}
.sl-f small,.sl-list small{display:block;font:800 10px system-ui;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px;color:#fde047}
.sl-list{margin:0;padding:10px 12px;border-radius:14px;list-style:none;display:grid;gap:7px;font:500 14.5px/1.5 "Noto Sans Telugu","Nirmala UI",system-ui}
.sl-list li{display:grid;grid-template-columns:20px 1fr;gap:6px}
.sl-list li::before{font-weight:800}
.sl-list.do{background:rgb(34 197 94/.12);border:1px solid rgb(34 197 94/.4)}.sl-list.do small{color:#86efac}.sl-list.do li::before{content:"✓";color:#4ade80}
.sl-list.no{background:rgb(239 68 68/.12);border:1px solid rgb(239 68 68/.4)}.sl-list.no small{color:#fca5a5}.sl-list.no li::before{content:"✕";color:#f87171}
.sl-call{align-self:flex-start;display:inline-flex;gap:6px;align-items:center;border-radius:999px;padding:8px 14px;background:#dc2626;color:#fff;font:800 14px system-ui;text-decoration:none}
.sl-ctl{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 16px calc(12px + env(safe-area-inset-bottom))}
.sl-nav{width:52px;height:52px;border-radius:50%;border:0;background:#f5f3ff;color:#05060f;display:grid;place-items:center;cursor:pointer;box-shadow:0 6px 20px rgb(0 0 0/.4);transition:transform .15s,opacity .2s}
.sl-nav svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.sl-nav:active{transform:scale(.88)}.sl-nav:disabled{opacity:.25;cursor:default}
.sl-nav.ghost{background:rgb(255 255 255/.1);color:#f5f3ff;box-shadow:none;border:1px solid rgb(255 255 255/.16)}
.sl-count{font:700 14px system-ui;font-variant-numeric:tabular-nums;color:rgb(245 243 255/.75);text-align:center}
.sl-count small{display:block;font:500 11px "Noto Sans Telugu","Nirmala UI",system-ui;opacity:.75}
.sl-hint{position:absolute;left:50%;top:30%;translate:-50% 0;z-index:4;pointer-events:none;display:grid;justify-items:center;gap:6px;font:600 13px "Noto Sans Telugu","Nirmala UI",system-ui}
.sl-hint b{font-size:36px;animation:sl-swipe 1.6s ease-in-out infinite;filter:drop-shadow(0 4px 6px rgb(0 0 0/.5))}
.sl-hint span{background:rgb(5 6 15/.75);padding:5px 11px;border-radius:999px;white-space:nowrap}
@keyframes sl-swipe{0%,100%{translate:34px 0;rotate:8deg}50%{translate:-34px 0;rotate:-8deg}}
.sl-card.in .sl-t,.sl-card.in .sl-w,.sl-card.in .sl-s{animation:sl-rise .45s cubic-bezier(.2,.8,.2,1) both}
.sl-card.in .sl-w{animation-delay:.06s}.sl-card.in .sl-s{animation-delay:.12s}
@keyframes sl-rise{from{opacity:0;translate:0 10px}}
/* list / timeline */
.sl-lv{position:absolute;inset:0;z-index:20;background:#05060f;overflow-y:auto;overscroll-behavior:contain;padding:0 0 28px;animation:sl-up .3s cubic-bezier(.2,.9,.3,1)}
@keyframes sl-up{from{opacity:0;translate:0 24px}}
.sl-lv .sl-top{position:sticky;top:0;z-index:2;background:#05060f}
.sl-lv h4{margin:16px 16px 8px;font:700 14px "Noto Sans Telugu","Nirmala UI",system-ui;color:rgb(245 243 255/.75)}
.sl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:0 12px}
.sl-grid .sl-tile{flex:auto;width:100%}
.sl-tl{position:relative;margin:8px 12px 0 22px;padding-left:22px;border-left:2px solid rgb(167 139 250/.4)}
.sl-tlr{position:relative;display:grid;grid-template-columns:46px 1fr;gap:10px;align-items:center;width:100%;border:0;background:rgb(255 255 255/.04);color:#f5f3ff;text-align:left;padding:8px 10px;border-radius:14px;margin:0 0 10px;cursor:pointer;transition:background .2s,transform .15s}
.sl-tlr:hover{background:rgb(255 255 255/.09)}.sl-tlr:active{transform:scale(.98)}
.sl-tlr::before{content:"";position:absolute;left:-29px;top:50%;width:12px;height:12px;margin-top:-6px;border-radius:50%;background:#a78bfa;box-shadow:0 0 0 4px #05060f}
.sl-tlr .ph{width:46px;height:46px;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-size:24px;background:#1e1b4b}
.sl-tlr .ph img{width:100%;height:100%;object-fit:cover}
.sl-tlr b{display:block;font:700 15px/1.25 "Noto Sans Telugu","Nirmala UI",system-ui}
.sl-tlr span{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:3px;font:500 12px system-ui;color:rgb(245 243 255/.65)}
.sl-tlr em{font-style:normal;font:700 11px "Noto Sans Telugu","Nirmala UI",system-ui;color:#c4b5fd;background:rgb(167 139 250/.16);padding:2px 7px;border-radius:999px}
.sl-yr{display:inline-block;margin:6px 0 8px -40px;font:800 12px system-ui;color:#05060f;background:#a78bfa;padding:2px 8px;border-radius:999px}
.sl-empty{padding:40px 20px;text-align:center;font:500 15px "Noto Sans Telugu","Nirmala UI",system-ui;color:rgb(245 243 255/.7)}
/* filter sheet */
.sl-scrim{position:absolute;inset:0;z-index:29;background:rgb(0 0 0/.5);animation:sl-fade .2s}
@keyframes sl-fade{from{opacity:0}}
.sl-sheet{position:absolute;inset:auto 0 0;z-index:30;max-height:80%;overflow:auto;background:#12142a;border-radius:22px 22px 0 0;padding:10px 16px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -20px 40px rgb(0 0 0/.45);animation:sl-sheet .3s cubic-bezier(.2,.9,.3,1.1)}
@keyframes sl-sheet{from{translate:0 100%}}
.sl-sheet::before{content:"";display:block;width:38px;height:4px;border-radius:4px;background:rgb(255 255 255/.25);margin:0 auto 12px}
.sl-sheet h5{margin:12px 0 8px;font:700 13px "Noto Sans Telugu","Nirmala UI",system-ui;color:rgb(245 243 255/.7)}
.sl-sheet .wrap{display:flex;flex-wrap:wrap;gap:6px}
.sl-big{width:100%;margin-top:16px;border:0;border-radius:14px;padding:13px;font:800 15px "Noto Sans Telugu","Nirmala UI",system-ui;background:linear-gradient(135deg,#38bdf8,#a78bfa);color:#05060f;cursor:pointer}
@media (prefers-reduced-motion:reduce){.sl,.sl *{animation:none!important;transition:none!important}}
`;

type Mode = 'home' | 'read' | 'list';

@Component({
  selector: 'app-learn',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="sl" role="dialog" aria-modal="true" aria-label="Spread Learn" [class.out]="leaving()" [style.--ox]="ox" [style.--oy]="oy" [attr.lang]="lang()" (click)="backdrop($event)">
      @if (mode() === 'home') {
        <div class="sl-home">
          <div class="sl-hb">
            <div class="sl-mark" aria-hidden="true"><i></i>Spread Learn</div>
            <div class="r">
              <button type="button" class="sl-lang" (click)="toggleLang()" [attr.aria-label]="'Language: ' + (lang() === 'te' ? 'Telugu' : 'English')">{{ lang() === 'te' ? 'తెలుగు ⇄ EN' : 'English ⇄ తె' }}</button>
              <button type="button" class="sl-ib" aria-label="Close" (click)="close()"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
            </div>
          </div>
          @let d = daily;
          <section class="sl-hero" (click)="openCard(d.topic, d.card.id)" [attr.aria-label]="d.card[lang()].t">
            @if (img(d.card); as im) { <img [src]="im[0]" alt="" decoding="async" /> } @else { <div class="sl-emo" [style.background]="emoBg(d.card, d.topic)"><span>{{ d.card.emoji }}</span></div> }
            <div class="sl-hero-t">
              <span class="sl-badge">{{ ui().day }} · {{ topicOf(d.topic).n[lang()] }}</span>
              <h2>{{ d.card[lang()].t }}</h2>
              <div class="sl-w"><small>{{ ui().word }}</small><b>{{ d.card[lang()].w }}</b></div>
              <button type="button" class="sl-go" (click)="openCard(d.topic, d.card.id); $event.stopPropagation()">▶ {{ ui().read }}</button>
            </div>
          </section>
          <div class="sl-topics">
            @for (t of topics; track t.id) {
              <button type="button" class="sl-topic" (click)="openTopic(t.id)">
                @if (t.cover && LEARN_IMG[t.cover]) { <img [src]="LEARN_IMG[t.cover][0]" alt="" loading="lazy" decoding="async" /> } @else { <div class="sl-emo" [style.background]="grad(t.bg)"><span>{{ t.icon }}</span></div> }
                <em>{{ cards[t.id].length }} {{ ui().cards }}</em>
                <div><b>{{ t.icon }} {{ t.n[lang()] }}</b><small>{{ t.blurb[lang()] }}</small></div>
              </button>
            }
          </div>
          @for (t of topics; track t.id) {
            <section class="sl-row" [attr.aria-label]="t.n[lang()]">
              <h3>{{ t.icon }} {{ t.n[lang()] }}</h3>
              <div class="sl-tiles">
                @for (c of cards[t.id]; track c.id) {
                  <button type="button" class="sl-tile" (click)="openCard(t.id, c.id)">
                    @if (img(c); as im) { <img [src]="im[0]" alt="" loading="lazy" decoding="async" /> } @else { <div class="sl-emo" [style.background]="emoBg(c, t.id)"><span>{{ c.emoji }}</span></div> }
                    <span>{{ c[lang()].t }}<i>{{ c[lang()].w }}</i></span>
                  </button>
                }
              </div>
            </section>
          }
          <p class="sl-foot">{{ lang() === 'te' ? 'ఫొటోలు: NASA, ESA, ISRO, Wikimedia Commons — ప్రతి కార్డుపై క్రెడిట్ ఉంది. ఆరోగ్య కార్డులు సాధారణ సమాచారం మాత్రమే; అత్యవసరంలో 108కి కాల్ చేయండి.' : 'Photos: NASA, ESA, ISRO and Wikimedia Commons — credited on each card. Health cards are general information; in an emergency call 108.' }}</p>
        </div>
      } @else {
        <div class="sl-panel" #panel>
          <div class="sl-top">
            <button type="button" class="sl-ib" aria-label="All topics" (click)="toHome()"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg></button>
            <h2>{{ topic().icon }} {{ topic().n[lang()] }}</h2>
            <button type="button" class="sl-ib" [class.on]="mode() === 'list'" [attr.aria-label]="topic().id === 'science' ? ui().timeline : ui().list" [title]="topic().id === 'science' ? ui().timeline : ui().list" (click)="toggleList()">
              @if (topic().id === 'science') { <svg viewBox="0 0 24 24"><path d="M12 3v18M12 7h6M12 12H6M12 17h6" /></svg> } @else { <svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg> }
            </button>
            <button type="button" class="sl-ib" [attr.aria-label]="ui().share" (click)="share()"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></svg></button>
            <button type="button" class="sl-lang" (click)="toggleLang()" aria-label="Change language">{{ lang() === 'te' ? 'EN' : 'తె' }}</button>
            <button type="button" class="sl-ib" aria-label="Close" (click)="close()"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          </div>
          <div class="sl-chips" #chips role="group" [attr.aria-label]="topic().n[lang()]">
            @if (topic().id === 'science') {
              <button type="button" class="sl-chip" [class.f]="filtered()" (click)="openFilter()">⚙️ {{ filterLabel() }}</button>
            }
            @for (g of topic().groups; track g.id) {
              @if (hasGroup(g.id)) { <button type="button" class="sl-chip" [attr.aria-pressed]="cur()?.g === g.id" (click)="jumpGroup(g.id)">{{ g.icon }} {{ g.n[lang()] }}</button> }
            }
          </div>
          <div class="sl-prog" aria-hidden="true"><i [style.width.%]="list().length ? ((idx() + 1) / list().length) * 100 : 0"></i></div>
          <div class="sl-stage" #stage>
            @if (!list().length) { <p class="sl-empty">{{ ui().none }}</p> }
            <div class="sl-track" #track>
              @for (c of list(); track c.id; let i = $index) {
                <article class="sl-card" [class.in]="i === idx()" [attr.aria-hidden]="i !== idx()" aria-roledescription="card">
                  @if (i >= idx() - 1 && i <= idx() + 1) {
                    <div class="sl-art">
                      @if (img(c); as im) { <img [src]="im[0]" [alt]="c[lang()].t" decoding="async" /> } @else { <div class="sl-emo" [style.background]="emoBg(c, topic().id)"><span>{{ c.emoji }}</span></div> }
                    </div>
                    @if (img(c); as im) { <a class="sl-credit" [href]="im[2]" target="_blank" rel="noopener" [tabindex]="i === idx() ? 0 : -1">📷 {{ im[1] }}</a> }
                  }
                  <div class="sl-shade"></div>
                  <div class="sl-body">
                    <span class="sl-tag">{{ groupOf(c.g)?.icon }} {{ groupOf(c.g)?.n?.[lang()] }}@if (c.y !== undefined) { · {{ yearText(c.y) }} }</span>
                    @if (c.life) { <span class="sl-life">{{ c.life }}@if (c.c) { · {{ countryName(c.c) }} }@if (c.k) { · {{ fieldName(c.k) }} }</span> }
                    <h3 class="sl-t">{{ c[lang()].t }}</h3>
                    <div class="sl-w"><small>{{ ui().word }}</small><b>{{ c[lang()].w }}</b></div>
                    <p class="sl-s">{{ c[lang()].s }}</p>
                    @if (c[lang()].d; as d) { <ul class="sl-list do"><small>{{ ui().do }}</small>@for (x of d; track $index) { <li>{{ x }}</li> }</ul> }
                    @if (c[lang()].x; as x) { <ul class="sl-list no"><small>{{ ui().dont }}</small>@for (y of x; track $index) { <li>{{ y }}</li> }</ul> }
                    @if (c[lang()].f; as f) { <p class="sl-f"><small>{{ ui().fact }}</small>{{ f }}</p> }
                    @if (topic().id === 'firstaid') { <a class="sl-call" href="tel:108" [tabindex]="i === idx() ? 0 : -1">📞 108</a> }
                  </div>
                </article>
              }
            </div>
            @if (hint()) { <div class="sl-hint" aria-hidden="true"><b>👆</b><span>{{ ui().swipe }}</span></div> }
          </div>
          <div class="sl-ctl">
            <button type="button" class="sl-nav ghost" [disabled]="idx() === 0" aria-label="Previous card" (click)="step(-1)"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg></button>
            <div class="sl-count" aria-live="polite">{{ list().length ? idx() + 1 : 0 }} / {{ list().length }}@if (cur(); as c) { <small>{{ groupOf(c.g)?.n?.[lang()] }}</small> }</div>
            <button type="button" class="sl-nav" [attr.aria-label]="idx() === list().length - 1 ? 'Finish' : 'Next card'" (click)="next()">
              @if (idx() === list().length - 1) { <svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10" /></svg> } @else { <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg> }
            </button>
          </div>

          @if (mode() === 'list') {
            <div class="sl-lv">
              <div class="sl-top">
                <button type="button" class="sl-ib" aria-label="Back to cards" (click)="toggleList()"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg></button>
                <h2>{{ topic().icon }} {{ topic().id === 'science' ? ui().timeline : ui().list }}</h2>
                @if (topic().id === 'science') { <button type="button" class="sl-chip" [class.f]="filtered()" (click)="openFilter()">⚙️ {{ filterLabel() }}</button> }
              </div>
              @if (topic().id === 'science') {
                @if (!list().length) { <p class="sl-empty">{{ ui().none }}</p> }
                <div class="sl-tl">
                  @for (c of list(); track c.id; let i = $index) {
                    @if (i === 0 || era(list()[i - 1]) !== era(c)) { <span class="sl-yr">{{ eraText(c) }}</span> }
                    <button type="button" class="sl-tlr" (click)="openAt(i)">
                      <div class="ph">@if (img(c); as im) { <img [src]="im[0]" alt="" loading="lazy" decoding="async" /> } @else { {{ c.emoji }} }</div>
                      <div><b>{{ c[lang()].t }}</b><span><em>{{ c[lang()].w }}</em>{{ yearText(c.y!) }} · {{ countryName(c.c!) }} · {{ fieldName(c.k!) }}</span></div>
                    </button>
                  }
                </div>
              } @else {
                @for (g of topic().groups; track g.id) {
                  <h4>{{ g.icon }} {{ g.n[lang()] }}</h4>
                  <div class="sl-grid">
                    @for (c of list(); track c.id; let i = $index) {
                      @if (c.g === g.id) {
                        <button type="button" class="sl-tile" (click)="openAt(i)">
                          @if (img(c); as im) { <img [src]="im[0]" alt="" loading="lazy" decoding="async" /> } @else { <div class="sl-emo" [style.background]="emoBg(c, topic().id)"><span>{{ c.emoji }}</span></div> }
                          <span>{{ c[lang()].t }}<i>{{ c[lang()].w }}</i></span>
                        </button>
                      }
                    }
                  </div>
                }
              }
              @if (topic().note; as n) { <p class="sl-foot">{{ n[lang()] }}</p> }
            </div>
          }

          @if (filterOpen()) {
            <div class="sl-scrim" (click)="closeFilter()"></div>
            <div class="sl-sheet" role="dialog" [attr.aria-label]="ui().filter">
              <h5>{{ ui().country }}</h5>
              <div class="wrap">
                <button type="button" class="sl-chip" [attr.aria-pressed]="country() === ''" (click)="setCountry('')">{{ ui().all }}</button>
                @for (x of countries; track x.id) { <button type="button" class="sl-chip" [attr.aria-pressed]="country() === x.id" (click)="setCountry(x.id)">{{ x.n[lang()] }} <small>{{ countOf(x.id, field()) }}</small></button> }
              </div>
              <h5>{{ ui().field }}</h5>
              <div class="wrap">
                <button type="button" class="sl-chip" [attr.aria-pressed]="field() === ''" (click)="setField('')">{{ ui().all }}</button>
                @for (x of fields; track x.id) { <button type="button" class="sl-chip" [attr.aria-pressed]="field() === x.id" (click)="setField(x.id)">{{ x.icon }} {{ x.n[lang()] }} <small>{{ countOf(country(), x.id) }}</small></button> }
              </div>
              <button type="button" class="sl-big" (click)="closeFilter()">{{ lang() === 'te' ? list().length + ' మంది చూడండి' : 'Show ' + list().length }}</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class LearnOverlay implements OnDestroy {
  private readonly svc = inject(LearnService);
  private readonly toast = inject(ToastService);
  private readonly stageEl = viewChild<ElementRef<HTMLElement>>('stage');
  private readonly trackEl = viewChild<ElementRef<HTMLElement>>('track');
  private readonly chipsEl = viewChild<ElementRef<HTMLElement>>('chips');
  private readonly fx = new GameFx();
  /** Finger state outside signals so a moving swipe never re-renders the cards. */
  private drag: { id: number; x0: number; y0: number; t0: number; dx: number; mode: 'wait' | 'drag' | 'off' } | null = null;
  private frame = 0;
  private wiredOn?: HTMLElement;
  private overflow = '';
  private homeL?: BackLayer;
  private readL?: BackLayer;
  private listL?: BackLayer;
  private sheetL?: BackLayer;
  private readonly onResize = () => this.place(0, false);

  protected readonly LEARN_IMG = LEARN_IMG;
  protected readonly topics = TOPICS;
  protected readonly cards = CARDS;
  protected readonly countries = COUNTRIES;
  protected readonly fields = FIELDS;
  protected readonly lang = signal<LearnLang>('te');
  protected readonly ui = computed(() => UI[this.lang()]);
  protected readonly mode = signal<Mode>('home');
  protected readonly topicId = signal<TopicId>('universe');
  protected readonly topic = computed(() => this.topicOf(this.topicId()));
  protected readonly country = signal('');
  protected readonly field = signal('');
  protected readonly filtered = computed(() => !!(this.country() || this.field()));
  protected readonly list = computed(() => {
    const all = CARDS[this.topicId()];
    if (this.topicId() !== 'science') return all;
    return all.filter((c) => (!this.country() || c.c === this.country()) && (!this.field() || c.k === this.field()));
  });
  protected readonly idx = signal(0);
  protected readonly cur = computed<LearnCard | undefined>(() => this.list()[this.idx()]);
  protected readonly hint = signal(false);
  protected readonly filterOpen = signal(false);
  protected readonly leaving = signal(false);
  protected readonly ox = this.svc.origin() ? this.svc.origin()!.x + 'px' : '50%';
  protected readonly oy = this.svc.origin() ? this.svc.origin()!.y + 'px' : '20%';
  /** Card of the day for the hero — a photo card, the same for everyone that day. */
  protected readonly daily = (() => {
    const pool = TOPICS.flatMap((t) => CARDS[t.id].filter((c) => c.img).map((card) => ({ topic: t.id, card })));
    return pool[Math.floor(Date.now() / 86400000) % pool.length];
  })();
  protected readonly filterLabel = computed(() => {
    const parts = [this.country() && this.countryName(this.country()), this.field() && this.fieldName(this.field())].filter(Boolean);
    return parts.length ? parts.join(' · ') : this.ui().filter;
  });

  constructor() {
    if (typeof document !== 'undefined' && !document.getElementById('sl-css')) {
      const st = document.createElement('style');
      st.id = 'sl-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    afterNextRender(() => {
      this.overflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      try {
        const l = localStorage.getItem(LANG_KEY);
        this.lang.set(l === 'te' || l === 'en' ? l : phoneLang() === 'te' ? 'te' : 'en');
      } catch {}
      this.fx.unlock();
      this.homeL = pushLayer(() => {
        this.homeL = this.readL = this.listL = this.sheetL = undefined;
        this.shut();
      });
      const st = this.svc.start();
      if (st && TOPICS.some((t) => t.id === st.topic)) this.openCard(st.topic as TopicId, st.id);
      addEventListener('resize', this.onResize);
    });
  }

  ngOnDestroy() {
    if (typeof document === 'undefined') return;
    document.documentElement.style.overflow = this.overflow;
    removeEventListener('resize', this.onResize);
    cancelAnimationFrame(this.frame);
  }

  // ---------- helpers for the template ----------
  protected topicOf(id: string): LearnTopic {
    return TOPICS.find((t) => t.id === id) ?? TOPICS[0];
  }
  protected groupOf(g: string) {
    return this.topic().groups.find((x) => x.id === g);
  }
  protected hasGroup(g: string) {
    return this.list().some((c) => c.g === g);
  }
  protected img(c: LearnCard) {
    return c.img ? LEARN_IMG[c.img] : undefined;
  }
  protected grad(bg: [string, string]) {
    return `radial-gradient(120% 90% at 50% 20%, ${bg[0]}, ${bg[1]})`;
  }
  protected emoBg(c: LearnCard, t: string) {
    return this.grad(c.bg ?? this.topicOf(t).bg);
  }
  protected countryName(id: string) {
    return COUNTRIES.find((x) => x.id === id)?.n[this.lang()] ?? '';
  }
  protected fieldName(id: string) {
    return FIELDS.find((x) => x.id === id)?.n[this.lang()] ?? '';
  }
  protected yearText(y: number) {
    return y < 0 ? (this.lang() === 'te' ? `${this.ui().bce} ${-y}` : `${-y} ${this.ui().bce}`) : String(y);
  }
  /** Timeline headings: BCE, then centuries. */
  protected era(c: LearnCard) {
    const y = c.y ?? 0;
    return y < 0 ? -1 : Math.floor(y / 100);
  }
  protected eraText(c: LearnCard) {
    const e = this.era(c);
    if (e < 0) return this.lang() === 'te' ? 'క్రీస్తు పూర్వం' : 'Before CE';
    return this.lang() === 'te' ? `${e * 100}లు` : `${e * 100}s`;
  }
  protected countOf(country: string, field: string) {
    return CARDS.science.filter((c) => (!country || c.c === country) && (!field || c.k === field)).length;
  }

  // ---------- navigation ----------
  protected openTopic(id: TopicId) {
    this.openCard(id, CARDS[id][0].id);
  }

  protected openCard(topic: TopicId, id: string) {
    this.fx.unlock();
    this.fx.pop();
    if (topic !== this.topicId()) {
      this.country.set('');
      this.field.set('');
    }
    this.topicId.set(topic);
    const at = Math.max(0, this.list().findIndex((c) => c.id === id));
    this.idx.set(at);
    if (!this.readL)
      this.readL = pushLayer(() => {
        this.readL = this.listL = undefined;
        this.fx.soft();
        this.mode.set('home');
      });
    this.mode.set('read');
    this.showHint();
    setTimeout(() => {
      this.wireSwipe();
      this.place(0, false);
      this.centerChip();
    });
  }

  protected toHome() {
    const l = this.readL, li = this.listL;
    this.readL = this.listL = undefined;
    li?.release();
    l?.release();
    this.fx.soft();
    this.mode.set('home');
  }

  protected toggleList() {
    this.fx.tik();
    if (this.mode() === 'list') {
      const l = this.listL;
      this.listL = undefined;
      l?.release();
      this.mode.set('read');
      setTimeout(() => this.place(0, false));
      return;
    }
    this.mode.set('list');
    this.listL = pushLayer(() => {
      this.listL = undefined;
      this.mode.set('read');
      setTimeout(() => this.place(0, false));
    });
  }

  protected openAt(i: number) {
    if (this.mode() === 'list') this.toggleList();
    this.idx.set(i);
    this.fx.pop();
    setTimeout(() => {
      this.place(0, false);
      this.centerChip();
    });
  }

  protected go(i: number) {
    const n = Math.max(0, Math.min(this.list().length - 1, i));
    if (n !== this.idx()) this.fx.whoosh();
    this.idx.set(n);
    this.place(0, true);
    this.centerChip();
  }

  protected step(d: number) {
    this.fx.unlock();
    this.go(this.idx() + d);
    this.hideHint();
  }

  /** Last card → back to the topics with a cheer. */
  protected next() {
    if (this.idx() < this.list().length - 1) return this.step(1);
    this.fx.chime();
    this.toast.show(this.ui().done, 'success', 2500);
    this.toHome();
  }

  protected jumpGroup(g: string) {
    this.fx.tik();
    this.go(this.list().findIndex((c) => c.g === g));
    this.hideHint();
  }

  private centerChip() {
    setTimeout(() => {
      const row = this.chipsEl()?.nativeElement;
      const ch = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (row && ch) row.scrollTo({ left: ch.offsetLeft - (row.clientWidth - ch.offsetWidth) / 2, behavior: 'smooth' });
    });
  }

  // ---------- swipe ----------
  private place(px: number, animate: boolean) {
    const t = this.trackEl()?.nativeElement, w = this.stageEl()?.nativeElement.clientWidth ?? 0;
    if (!t) return;
    t.classList.toggle('snap', animate);
    t.style.transform = `translate3d(${-this.idx() * w + px}px,0,0)`;
  }

  /** Native pointer listeners (no change detection per move); vertical drags scroll the card text. */
  private wireSwipe() {
    const st = this.stageEl()?.nativeElement;
    if (!st || this.wiredOn === st) return;
    this.wiredOn = st;
    st.addEventListener('pointerdown', (e) => {
      if (this.drag || (e.target as HTMLElement).closest('a')) return;
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
        this.hideHint();
      }
      const raw = e.clientX - d.x0;
      const edge = (this.idx() === 0 && raw > 0) || (this.idx() === this.list().length - 1 && raw < 0);
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

  private showHint() {
    try {
      if (localStorage.getItem(HINT_KEY)) return;
    } catch {
      return;
    }
    this.hint.set(true);
    setTimeout(() => this.hideHint(), 4500);
  }

  private hideHint() {
    if (!this.hint()) return;
    this.hint.set(false);
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {}
  }

  // ---------- filters (scientists) ----------
  protected openFilter() {
    this.fx.soft();
    this.filterOpen.set(true);
    this.sheetL = pushLayer(() => {
      this.sheetL = undefined;
      this.filterOpen.set(false);
    });
  }

  protected closeFilter() {
    this.filterOpen.set(false);
    const l = this.sheetL;
    this.sheetL = undefined;
    l?.release();
    setTimeout(() => this.place(0, false));
  }

  protected setCountry(id: string) {
    this.fx.tik();
    this.country.set(id);
    this.idx.set(0);
  }

  protected setField(id: string) {
    this.fx.tik();
    this.field.set(id);
    this.idx.set(0);
  }

  // ---------- language, share, close ----------
  protected toggleLang() {
    this.lang.update((l) => (l === 'te' ? 'en' : 'te'));
    this.fx.pop();
    try {
      localStorage.setItem(LANG_KEY, this.lang());
    } catch {}
  }

  protected async share() {
    const c = this.cur();
    if (!c) return;
    this.fx.tik();
    const t = c[this.lang()];
    const url = `${SITE}/?learn=${this.topicId()}.${c.id}`;
    const text = `${t.t} — ${t.w} ✨\n${t.s}`;
    try {
      if (navigator.share) return await navigator.share({ title: `${t.t} · Spread Learn`, text, url });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      this.toast.show(this.ui().copied, 'success');
    } catch {
      open('https://wa.me/?text=' + encodeURIComponent(`${text}\n${url}`), '_blank', 'noopener');
    }
  }

  protected onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if (this.filterOpen()) this.closeFilter();
      else if (this.mode() === 'list') this.toggleList();
      else if (this.mode() === 'read') this.toHome();
      else this.close();
      return;
    }
    if (this.mode() !== 'read' || this.filterOpen()) return;
    if (e.key === 'ArrowRight') this.step(1);
    if (e.key === 'ArrowLeft') this.step(-1);
  }

  /** On laptops, a click on the dark area beside the cards closes Spread Learn. */
  protected backdrop(e: MouseEvent) {
    if (e.target === e.currentTarget && this.mode() !== 'home') this.close();
  }

  protected close() {
    if (this.leaving()) return;
    const l = this.homeL;
    this.homeL = this.readL = this.listL = this.sheetL = undefined;
    l?.release();
    this.shut();
  }

  private shut() {
    if (this.leaving()) return;
    this.fx.soft();
    this.leaving.set(true);
    const quick = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => this.svc.close(), quick ? 0 : 280);
  }
}
