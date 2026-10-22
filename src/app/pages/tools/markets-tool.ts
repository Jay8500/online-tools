import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, afterNextRender, inject, signal, viewChild } from '@angular/core';

type Tab = 'india' | 'us' | 'world';

/**
 * Markets today: free TradingView widgets (licensed for embedding on websites) for India, US and world markets,
 * plus plain-language explainers. Not investment advice. NSE/BSE data can't be shown from free APIs legally
 * (exchange licence needed), so all numbers come from the widgets.
 */
@Component({
  selector: 'app-markets-tool',
  template: `
    <!-- Bull / bear explainer -->
    <div class="grid grid-cols-2 gap-2">
      <div class="mood rounded-2xl bg-green-500/10 p-3 text-center">
        <span class="bull text-4xl" aria-hidden="true">🐂</span>
        <p class="mt-1 text-sm font-bold text-green-700 dark:text-green-300">Bull market ▲</p>
        <p class="text-xs text-muted">Prices going up, people buying</p>
      </div>
      <div class="mood rounded-2xl bg-rose-500/10 p-3 text-center">
        <span class="bear text-4xl" aria-hidden="true">🐻</span>
        <p class="mt-1 text-sm font-bold text-rose-700 dark:text-rose-300">Bear market ▼</p>
        <p class="text-xs text-muted">Prices going down, people selling</p>
      </div>
    </div>

    <!-- Ticker -->
    <div class="mt-3 overflow-hidden rounded-2xl border border-line" #ticker aria-label="Live market ticker"></div>

    <!-- Tabs -->
    <div class="mt-4 flex gap-1.5" role="tablist" aria-label="Market">
      @for (t of tabs; track t.id) {
        <button type="button" role="tab" class="chip min-h-9" [attr.aria-selected]="tab() === t.id" [attr.aria-pressed]="tab() === t.id" (click)="show(t.id)">{{ t.label }}</button>
      }
    </div>
    <p class="mt-2 text-xs text-muted">{{ hint() }} Tap or hover a chart to see the value on that day.</p>
    <div class="mt-2 min-h-[460px] overflow-hidden rounded-2xl border border-line" #chart></div>
    <p class="mt-1 text-[11px] text-muted">Indian prices are BSE closing prices (marked E — end of day); NSE/Nifty can't be shown on free websites. US prices (marked D) are about 15 minutes delayed. Charts & prices by <a href="https://www.tradingview.com/" target="_blank" rel="noopener" class="underline">TradingView</a>.</p>

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
    .bull { display: inline-block; animation: charge 2.2s ease-in-out infinite; }
    .bear { display: inline-block; animation: sway 2.6s ease-in-out infinite; }
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
    { id: 'india', label: '🇮🇳 India' },
    { id: 'us', label: '🇺🇸 US' },
    { id: 'world', label: '🌍 World' },
  ];
  protected readonly words = [
    { t: 'Nifty 50', d: 'The 50 biggest companies on the National Stock Exchange (NSE). If Nifty is up, most big Indian companies went up today.' },
    { t: 'Sensex', d: 'The 30 biggest companies on the Bombay Stock Exchange (BSE). India’s oldest market index.' },
    { t: 'S&P 500 / Nasdaq / Dow', d: 'The main US market indices. They often move Indian markets the next morning.' },
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
    const all = [...this.sets.india.symbols.slice(0, 3), ...this.sets.us.symbols.slice(0, 3), ['FX_IDC:USDINR', 'USD → ₹'], ['OANDA:XAUUSD', 'Gold']];
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
