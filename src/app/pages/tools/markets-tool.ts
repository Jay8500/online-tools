import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { Icon } from '../../shared/icon';

/** US market tab + US symbols in the ticker; hidden for now (owner decision 22 Oct 2026) — set true to show again. */
const SHOW_US = false;

type Tab = 'india' | 'us' | 'world';

/**
 * Markets today: free TradingView widgets (licensed for embedding on websites) for India, US and world markets,
 * plus plain-language explainers. Not investment advice. NSE/BSE data can't be shown from free APIs legally
 * (exchange licence needed), so all numbers come from the widgets.
 */
@Component({
  selector: 'app-markets-tool',
  imports: [Icon],
  template: `
    <!-- Bull / bear explainer -->
    <div class="grid grid-cols-2 gap-2">
      <div class="relative isolate min-h-36 overflow-hidden rounded-2xl border border-green-500/25 bg-gradient-to-br from-green-50 to-emerald-100/70 p-3 dark:from-green-950/70 dark:to-emerald-900/30">
        <!-- Background: rising graph + big bull, see-through -->
        <svg class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-green-500/20 dark:text-green-400/15" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0 56 30 46l25 5 30-18 25 6 30-20 30 4 30-19v62H0z" />
          <path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" d="M0 56 30 46l25 5 30-18 25 6 30-20 30 4 30-19" />
        </svg>
        <span class="pointer-events-none absolute -top-1 -right-4 -z-10 text-green-600 opacity-25 dark:text-green-400 dark:opacity-30" aria-hidden="true">
          <!-- Bull head: horns up -->
          <svg class="bull" viewBox="0 0 64 64" width="112" height="112">
            <path fill="currentColor" d="M5 9c0 11 8 18 17 16v-5c-6 1-11-3-12-11z" />
            <path fill="currentColor" d="M59 9c0 11-8 18-17 16v-5c6 1 11-3 12-11z" />
            <ellipse fill="currentColor" cx="13" cy="29" rx="6" ry="3.2" transform="rotate(-20 13 29)" />
            <ellipse fill="currentColor" cx="51" cy="29" rx="6" ry="3.2" transform="rotate(20 51 29)" />
            <path fill="currentColor" d="M20 21q12-6 24 0l2 19q0 11-7 15H25q-7-4-7-15z" />
            <ellipse fill="#fff" fill-opacity=".28" cx="32" cy="47" rx="10" ry="7" />
            <circle fill="#000" fill-opacity=".35" cx="28" cy="48" r="1.8" />
            <circle fill="#000" fill-opacity=".35" cx="36" cy="48" r="1.8" />
            <circle fill="#fff" cx="26" cy="32" r="2.2" /><circle fill="#000" fill-opacity=".7" cx="26.4" cy="32.3" r="1" />
            <circle fill="#fff" cx="38" cy="32" r="2.2" /><circle fill="#000" fill-opacity=".7" cx="38.4" cy="32.3" r="1" />
          </svg>
        </span>
        <span class="grid size-9 place-items-center rounded-full bg-white/80 text-green-700 shadow-sm ring-1 ring-green-500/30 dark:bg-white/10 dark:text-green-300" aria-hidden="true">
          <svg lucideIcon="trending-up" [size]="18" />
        </span>
        <p class="mt-2 text-base font-extrabold text-green-800 dark:text-green-200">Bull market ▲</p>
        <p class="mt-0.5 max-w-44 text-xs leading-snug text-green-900/75 dark:text-green-100/75">Prices going up, people buying</p>
      </div>
      <div class="relative isolate min-h-36 overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-50 to-pink-100/70 p-3 dark:from-rose-950/70 dark:to-pink-900/30">
        <!-- Background: falling graph + big bear, see-through -->
        <svg class="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-rose-500/20 dark:text-rose-400/15" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
          <path fill="currentColor" d="M0 6 30 14l25-4 30 18 25-5 30 20 30-3 30 18v16H0z" />
          <path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" d="M0 6 30 14l25-4 30 18 25-5 30 20 30-3 30 18" />
        </svg>
        <span class="pointer-events-none absolute -top-1 -right-4 -z-10 text-rose-600 opacity-25 dark:text-rose-400 dark:opacity-30" aria-hidden="true">
          <!-- Bear head: round ears -->
          <svg class="bear" viewBox="0 0 64 64" width="112" height="112">
            <circle fill="currentColor" cx="17" cy="17" r="8" />
            <circle fill="currentColor" cx="47" cy="17" r="8" />
            <circle fill="#fff" fill-opacity=".28" cx="17" cy="17" r="4" />
            <circle fill="#fff" fill-opacity=".28" cx="47" cy="17" r="4" />
            <circle fill="currentColor" cx="32" cy="36" r="21" />
            <ellipse fill="#fff" fill-opacity=".28" cx="32" cy="45" rx="10" ry="8" />
            <ellipse fill="#000" fill-opacity=".45" cx="32" cy="41" rx="4" ry="2.8" />
            <path d="M28 48q4 3 8 0" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round" />
            <circle fill="#fff" cx="24.5" cy="32" r="2.2" /><circle fill="#000" fill-opacity=".7" cx="24.9" cy="32.3" r="1" />
            <circle fill="#fff" cx="39.5" cy="32" r="2.2" /><circle fill="#000" fill-opacity=".7" cx="39.9" cy="32.3" r="1" />
          </svg>
        </span>
        <span class="grid size-9 place-items-center rounded-full bg-white/80 text-rose-700 shadow-sm ring-1 ring-rose-500/30 dark:bg-white/10 dark:text-rose-300" aria-hidden="true">
          <svg lucideIcon="trending-down" [size]="18" />
        </span>
        <p class="mt-2 text-base font-extrabold text-rose-800 dark:text-rose-200">Bear market ▼</p>
        <p class="mt-0.5 max-w-44 text-xs leading-snug text-rose-900/75 dark:text-rose-100/75">Prices going down, people selling</p>
      </div>
    </div>

    <!-- Ticker -->
    <div class="mt-3 overflow-hidden rounded-2xl border border-line" #ticker aria-label="Live market ticker" style="color-scheme: light"></div>

    <!-- Tabs -->
    <div class="mt-4 flex gap-1.5" role="tablist" aria-label="Market">
      @for (t of tabs; track t.id) {
        <button type="button" role="tab" class="chip min-h-9" [attr.aria-selected]="tab() === t.id" [attr.aria-pressed]="tab() === t.id" (click)="show(t.id)">{{ t.label }}</button>
      }
    </div>
    <p class="mt-2 text-xs text-muted">{{ hint() }} Tap or hover a chart to see the value on that day.</p>
    <div class="mt-2 min-h-[460px] overflow-hidden rounded-2xl border border-line" #chart style="color-scheme: light"></div>
    <p class="mt-1 text-[11px] text-muted">Indian prices are BSE closing prices (marked E — end of day); NSE/Nifty can't be shown on free websites. Other prices (marked D) are about 15 minutes delayed. Charts & prices by <a href="https://www.tradingview.com/" target="_blank" rel="noopener" class="underline">TradingView</a>.</p>

    <!-- Words in simple language -->
    <h2 class="mt-6 mb-2 text-base font-bold">Market words, in simple language</h2>
    <div class="grid gap-2 sm:grid-cols-2">
      @for (w of words; track w.t) {
        <details class="rounded-xl bg-surface-2 p-3 text-sm">
          <summary class="cursor-pointer font-semibold">ⓘ {{ w.t }}</summary>
          <p class="mt-1 text-muted">{{ w.d }}</p>
        </details>
      }
    </div>

    <!-- IPOs -->
    <h2 class="mt-6 mb-2 text-base font-bold">🆕 IPOs</h2>
    <div class="rounded-2xl border border-line p-4 text-sm">
      <p class="font-semibold">IPO = when a company sells its shares to the public for the first time.</p>
      <ol class="mt-2 list-decimal space-y-1 pl-5 text-muted">
        <li>Open your broker or bank app (UPI mandate) during the IPO dates.</li>
        <li>Apply for at least 1 lot at the price band. Money is only blocked, not taken.</li>
        <li>If you get shares (allotment), they reach your demat account before listing day.</li>
        <li>On listing day the share starts trading — the price can go up or down.</li>
      </ol>
      <div class="mt-3 flex flex-wrap gap-2">
        <a class="chip min-h-9" href="https://www.nseindia.com/market-data/all-upcoming-issues-ipo" target="_blank" rel="noopener">NSE current & upcoming IPOs ↗</a>
        <a class="chip min-h-9" href="https://www.bseindia.com/publicissue.html" target="_blank" rel="noopener">BSE public issues ↗</a>
        <a class="chip min-h-9" href="https://www.sebi.gov.in/filings/public-issues.html" target="_blank" rel="noopener">SEBI filings ↗</a>
      </div>
      <p class="mt-2 text-xs text-muted">Recent IPO cards with logos and listing gains are coming soon.</p>
    </div>
  `,
  styles: `
    .bull { display: block; animation: charge 2.2s ease-in-out infinite; }
    .bear { display: block; animation: sway 2.6s ease-in-out infinite; }
    @keyframes charge { 0%, 100% { transform: translateX(-4px) rotate(-3deg); } 50% { transform: translateX(4px) rotate(3deg) translateY(-3px); } }
    @keyframes sway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg) translateY(2px); } }
    @media (prefers-reduced-motion: reduce) { .bull, .bear { animation: none; } }
  `,
})
export class MarketsTool {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ticker = viewChild<ElementRef<HTMLElement>>('ticker');
  private readonly chart = viewChild<ElementRef<HTMLElement>>('chart');
  protected readonly tab = signal<Tab>('india');
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'india' as Tab, label: '🇮🇳 India' },
    { id: 'us' as Tab, label: '🇺🇸 US' },
    { id: 'world' as Tab, label: '🌍 World' },
  ].filter((t) => SHOW_US || t.id !== 'us');
  protected readonly words = [
    { t: 'Nifty 50', d: 'The 50 biggest companies on the National Stock Exchange (NSE). If Nifty is up, most big Indian companies went up today.' },
    { t: 'Sensex', d: 'The 30 biggest companies on the Bombay Stock Exchange (BSE). India’s oldest market index.' },
    { t: '▲ 1.2% / ▼ 0.8%', d: 'How much the price went up (green ▲) or down (red ▼) compared with the last close.' },
    { t: 'Bull vs Bear', d: 'Bull = prices rising for a while. Bear = prices falling for a while (usually 20% or more from the top).' },
    { t: 'IPO, lot, price band', d: 'IPO is a company’s first share sale. A lot is the minimum number of shares you can apply for. Price band is the price range.' },
  ];
  private readonly sets: Record<Tab, { hint: string; symbols: [string, string][] }> = {
    india: { hint: 'Sensex and big Indian companies (BSE).', symbols: [['BSE:SENSEX', 'Sensex'], ['BSE:RELIANCE', 'Reliance'], ['BSE:TCS', 'TCS'], ['BSE:HDFCBANK', 'HDFC Bank'], ['BSE:INFY', 'Infosys'], ['BSE:ICICIBANK', 'ICICI Bank']] },
    us: { hint: 'The main US indices and the biggest US companies.', symbols: [['FOREXCOM:SPXUSD', 'S&P 500'], ['FOREXCOM:NSXUSD', 'Nasdaq 100'], ['FOREXCOM:DJI', 'Dow Jones'], ['NASDAQ:AAPL', 'Apple'], ['NASDAQ:MSFT', 'Microsoft'], ['NASDAQ:NVDA', 'Nvidia'], ['NASDAQ:GOOGL', 'Google']] },
    world: { hint: 'Japan, UK, Germany, the dollar, gold and crude oil.', symbols: [['INDEX:NKY', 'Nikkei 225 (Japan)'], ['FOREXCOM:UKXGBP', 'FTSE 100 (UK)'], ['INDEX:DEU40', 'DAX (Germany)'], ['FX_IDC:USDINR', 'US Dollar → ₹'], ['OANDA:XAUUSD', 'Gold (per ounce, $)'], ['OANDA:WTICOUSD', 'Crude oil ($)']] },
  };
  protected readonly hint = signal(this.sets.india.hint);

  constructor() {
    afterNextRender(() => {
      this.mountTicker();
      this.mountChart();
    });
  }

  protected show(t: Tab) {
    this.tab.set(t);
    this.hint.set(this.sets[t].hint);
    this.mountChart();
  }

  private dark() {
    return document.documentElement.classList.contains('dark');
  }

  /** TradingView widgets read their settings from the JSON inside their script tag. */
  private embed(host: HTMLElement | undefined, src: string, config: object) {
    if (!this.browser || !host) return;
    host.replaceChildren();
    const box = document.createElement('div');
    box.className = 'tradingview-widget-container';
    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    box.appendChild(inner);
    const s = document.createElement('script');
    s.src = `https://s3.tradingview.com/external-embedding/${src}`;
    s.async = true;
    s.textContent = JSON.stringify(config);
    box.appendChild(s);
    host.appendChild(box);
  }

  private mountTicker() {
    const all = [...this.sets.india.symbols.slice(0, 4), ...(SHOW_US ? this.sets.us.symbols.slice(0, 3) : this.sets.world.symbols.slice(0, 2)), ['FX_IDC:USDINR', 'USD → ₹'], ['OANDA:XAUUSD', 'Gold']];
    this.embed(this.ticker()?.nativeElement, 'embed-widget-ticker-tape.js', {
      symbols: all.map(([proName, title]) => ({ proName, title })),
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: this.dark() ? 'dark' : 'light',
      locale: 'en',
    });
  }

  private mountChart() {
    const set = this.sets[this.tab()];
    this.embed(this.chart()?.nativeElement, 'embed-widget-market-overview.js', {
      colorTheme: this.dark() ? 'dark' : 'light',
      dateRange: '1M',
      showChart: true,
      locale: 'en',
      width: '100%',
      height: 460,
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      plotLineColorGrowing: '#16a34a',
      plotLineColorFalling: '#e11d48',
      gridLineColor: 'rgba(120,120,120,0.08)',
      scaleFontColor: this.dark() ? '#cbd5e1' : '#475569',
      belowLineFillColorGrowing: 'rgba(22,163,74,0.12)',
      belowLineFillColorFalling: 'rgba(225,29,72,0.12)',
      tabs: [{ title: this.tabs.find((t) => t.id === this.tab())!.label, symbols: set.symbols.map(([s, d]) => ({ s, d })) }],
    });
  }
}
