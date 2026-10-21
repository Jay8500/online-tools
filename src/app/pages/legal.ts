import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsentService } from '../core/consent.service';
import { DialogService } from '../core/dialog.service';
import { ToastService } from '../core/toast.service';
import { SeoService } from '../core/seo.service';
import { SITE } from '../core/site.config';

const UPDATED = '19 October 2026';

@Component({
  selector: 'app-privacy',
  imports: [RouterLink],
  template: `
    <article class="prose-tool mx-auto max-w-3xl">
      <h1 class="text-xl font-bold text-ink sm:text-2xl">Privacy policy</h1>
      <p class="text-xs">Last updated: {{ updated }}</p>

      <h2>The short version</h2>
      <p>
        Our tools run inside your browser. <strong>Photos, signatures, documents and numbers you enter are processed on your own
        device and are never uploaded to us.</strong> We use Google Analytics (only if you accept) and Google AdSense to keep the
        site free.
      </p>

      <h2>Who we are</h2>
      <p>
        Spread Apps Tools (tools.spreadapps.in) is run by <strong>{{ site.operator }}</strong>, an independent developer based in
        {{ site.location }}, under the brand name Spread Apps. Email: <a [href]="'mailto:' + site.email">{{ site.email }}</a>.
      </p>

      <h2>1. Files and data you use in the tools</h2>
      <p>
        When you open a photo or file, it is read by your browser and processed with JavaScript on your device. It is not sent to
        our servers or anyone else, and it disappears when you close the page. The optional “White background” feature downloads
        an AI model to your browser (from our site and the jsDelivr CDN); your photo still stays on your device.
      </p>

      <h2>2. Cookies and similar technology</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li><strong>Necessary:</strong> your theme and cookie choice are saved in your browser’s local storage. The app is cached for offline use.</li>
        <li><strong>Analytics (Google Analytics 4):</strong> only after you click “Accept all”. It counts visits, pages and tool use with an anonymised IP.</li>
        <li>
          <strong>Advertising (Google AdSense):</strong> Google and its partners may use cookies to show ads. Without your consent,
          Google shows non-personalised ads. Learn how Google uses data at
          <a href="https://policies.google.com/technologies/partner-sites" rel="noopener" target="_blank">policies.google.com/technologies/partner-sites</a>.
          You can turn off personalised ads at <a href="https://adssettings.google.com" rel="noopener" target="_blank">adssettings.google.com</a>.
        </li>
      </ul>
      <p>You can change your choice any time: <button class="font-medium text-brand underline" (click)="consent.openSettings()">Cookie settings</button>.</p>

      <h2>2b. Weather</h2>
      <p>
        When you check the weather, the city you choose — or, if you allow it, your location rounded to about 1 km — is sent
        through our server to OpenWeather to get the forecast. We don’t store it. Your last city is remembered only in your browser.
      </p>

      <h2>2c. Travel planner</h2>
      <p>The start and destination you type are sent through our server to OpenRouteService (OpenStreetMap data) to work out the route. We don’t store them.</p>

      <h2>2d. Cinemas, police stations & petrol bunks near me</h2>
      <p>If you tap the location button, your position is used only on your device to sort cinemas by distance — it is never sent. An area you type that isn’t in our built-in list is sent through our server to OpenRouteService once to find it on the map. We don’t store it.</p>

      <h2>3. Usage counter</h2>
      <p>
        Some pages show how many times a tool was used. When you download a result, your browser sends only the tool’s name.
        To stop spam, a one-way hash of your IP address is kept for one day. Nothing else is stored.
      </p>
      <p>
        The “Love it” button works the same way: it sends only the page name, so we can count likes and get a short anonymous note.
        Your browser remembers that you liked a page, so you can like each page once.
      </p>
      <p>
        The “Suggest” box sends only the page name and the words you type, by email to us, so we can fix or add tools. We don’t ask for your
        name, phone or email there — please don’t type personal details. “Share on WhatsApp” simply opens WhatsApp with the page link; we see nothing you share.
      </p>

      <h2>4. Contact form</h2>
      <p>
        If you write to us through the <a routerLink="/contact">contact form</a>, we receive your name, email and message
        (stored by our host, Netlify) and use them only to reply. Ask us any time to delete them.
      </p>

      <h2>5. Hosting</h2>
      <p>The site is hosted by Netlify, which keeps standard server logs (such as IP address and browser type) for security.</p>

      <h2>6. Children</h2>
      <p>The tools are suitable for students. We do not knowingly collect personal data from anyone, including children.</p>

      <h2>7. Your rights</h2>
      <p>
        Under India’s Digital Personal Data Protection Act, 2023 you may ask us what personal data we hold about you, ask for it
        to be corrected or deleted, and raise a grievance. Grievance contact: {{ site.operator }},
        <a [href]="'mailto:' + site.email">{{ site.email }}</a> (or the <a routerLink="/contact">contact page</a>). We reply within 30 days.
      </p>
      <div class="not-prose my-4 rounded-2xl border border-line bg-surface-2 p-4">
        <p class="font-semibold text-ink">🗑️ Delete my data on this device</p>
        <p class="mt-1 text-sm text-muted">Clears everything this site saved in your browser: pinned and recent tools, likes, cookie choice, step counts and typed text. Nothing is stored on our servers to delete.</p>
        <button type="button" class="btn-ghost mt-3 min-h-10 border-rose-300 text-rose-600" (click)="wipe()">Delete my data</button>
      </div>

      <h2>8. Changes</h2>
      <p>We will update this page if anything changes and show the new date at the top.</p>
    </article>
  `,
})
export class Privacy {
  protected readonly site = SITE;
  protected readonly consent = inject(ConsentService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);

  /** DPDP: one tap to erase everything this site keeps in this browser. */
  protected async wipe() {
    if (!(await this.dialog.confirm({ title: 'Delete my data?', message: 'Pins, recent tools, likes, cookie choice and saved text on this device will be removed.', confirmText: 'Delete', tone: 'danger' }))) return;
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* storage blocked — nothing saved */
    }
    this.toast.show('🗑️ Done — your data on this device is deleted.', 'success', 2500);
    setTimeout(() => location.reload(), 1200);
  }
  protected readonly updated = UPDATED;
  constructor() {
    inject(SeoService).set({ title: 'Privacy Policy', description: 'How Spread Apps Tools handles your data: files never leave your device; analytics only with consent; AdSense cookies explained.', path: 'privacy' });
  }
}

@Component({
  selector: 'app-terms',
  imports: [RouterLink],
  template: `
    <article class="prose-tool mx-auto max-w-3xl">
      <h1 class="text-xl font-bold text-ink sm:text-2xl">Terms of use</h1>
      <p class="text-xs">Last updated: {{ updated }}</p>
      <p>
        These terms are an agreement between you and {{ site.operator }} ({{ site.location }}), who runs Spread Apps Tools under
        the brand name Spread Apps.
      </p>
      <h2>Using the tools</h2>
      <p>Spread Apps Tools is free to use for personal and business purposes. Please don’t misuse the site, try to break it, or copy it in bulk.</p>
      <h2>No guarantee</h2>
      <p>
        We work hard to keep size rules and calculations correct, but exam bodies change their rules often.
        <strong>Always check the official notification for the latest size rules</strong> before you apply. You are responsible
        for checking a file before you upload it to any portal.
      </p>
      <ul class="list-disc space-y-1 pl-5">
        <li>Calculators give estimates, not financial or tax advice.</li>
        <li>Health tools are not medical advice — talk to a doctor.</li>
        <li>Files are processed on your device; keep your own copy of originals.</li>
        <li>Prices, rates, plans, fines and holiday dates are copied from official or public sources on the date shown and can change — confirm with the source before you pay or decide.</li>
        <li>Traffic rules and fines are general information, not legal advice.</li>
      </ul>
      <h2>Names and trademarks</h2>
      <p>
        Company, app and product names shown (for example Jio, Airtel, Netflix, Amazon Prime, JioHotstar, PVR or Indian Oil) belong to their owners
        and are used only to identify them. Spread Apps is independent and not linked to, sponsored or endorsed by any of them.
        Map data © OpenStreetMap contributors; other data sources are credited on each tool.
      </p>
      <h2>Liability</h2>
      <p>The tools are provided “as is”. To the extent the law allows, Spread Apps is not liable for any loss from using them, including a rejected application.</p>
      <h2>Ads and links</h2>
      <p>We show ads from Google AdSense. We are not responsible for advertisers’ products or for other websites we link to.</p>
      <h2>Law</h2>
      <p>These terms are governed by the laws of India; courts in Hyderabad, Telangana have jurisdiction. Questions? Email <a [href]="'mailto:' + site.email">{{ site.email }}</a> or use the <a routerLink="/contact">contact page</a>.</p>
    </article>
  `,
})
export class Terms {
  protected readonly site = SITE;
  protected readonly updated = UPDATED;
  constructor() {
    inject(SeoService).set({ title: 'Terms of Use', description: 'Terms of use for Spread Apps Tools — free online tools for India.', path: 'terms' });
  }
}

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  template: `
    <article class="prose-tool mx-auto max-w-3xl">
      <h1 class="text-xl font-bold text-ink sm:text-2xl">About Spread Apps Tools</h1>
      <p>
        Spread Apps Tools is a free collection of everyday tools for India, made by <a href="https://spreadapps.in">Spread Apps</a>,
        the brand of {{ site.operator }}, an independent developer from {{ site.location }}. We started with the problem every student knows: an exam form that keeps rejecting your photo
        because it is 52 KB instead of 50 KB.
      </p>
      <h2>What makes it different</h2>
      <ul class="list-disc space-y-1 pl-5">
        <li><strong>Private:</strong> files are processed on your device — nothing is uploaded.</li>
        <li><strong>Fast on any phone:</strong> small pages that open quickly even on slow connections, and work offline once installed.</li>
        <li><strong>Made for India:</strong> exam photo presets (SSC, UPSC, IBPS, SBI, RRB, TSPSC, APPSC, NEET, JEE), money and tax calculators, PDF tools, UPI QR, GST invoices, health calculators and Telugu typing.</li>
      </ul>
      <h2>Coming next</h2>
      <p>More exams, Hindi and Telugu versions of every page, and more everyday tools. Tell us what you need.</p>
      <p>Have an idea or found a wrong size? <a routerLink="/contact">Tell us</a> — we read every message.</p>
    </article>
  `,
})
export class About {
  protected readonly site = SITE;
  constructor() {
    inject(SeoService).set({ title: 'About Us', description: 'Spread Apps Tools: free, private, fast online tools for India — exam photo resizer, image to KB and more.', path: 'about' });
  }
}

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-md py-12 text-center">
      <p class="text-5xl font-bold text-brand">404</p>
      <h1 class="mt-2 text-lg font-bold">This page doesn’t exist</h1>
      <p class="mt-1 text-sm text-muted">It may have moved. Try one of our tools instead.</p>
      <div class="mt-4 flex justify-center gap-2">
        <a routerLink="/" class="btn-primary">All tools</a>
        <a routerLink="/resize-image-to-kb" class="btn-ghost">Resize to KB</a>
      </div>
    </div>
  `,
})
export class NotFound {
  constructor() {
    inject(SeoService).set({ title: 'Page not found', description: 'This page does not exist.', path: '404', noindex: true });
  }
}
