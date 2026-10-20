# SpreadApps Tools — roadmap (single pending list)

Live: https://tools.spreadapps.in (also https://spreadapps-tools.netlify.app) · Netlify site `spreadapps-tools` (id 20179a97-8cb0-4626-b30e-c8836e495f6e) · repo `Jay8500/online-tools`.
Stack: Angular 22 (standalone, signals, zoneless) · Tailwind v4 · static prerender (`outputMode: static`) · PWA (ngsw) · Netlify (+ 1 function).
No database, no login — files are processed in the browser.

## Phase 1 — Exam photo & signature resizer ✅ built (2026-10-19)
- [x] 30 prerendered tool pages: SSC, UPSC, IBPS, SBI, RRB, TSPSC, APPSC, NEET, JEE Main × photo/signature (+ IBPS/SBI thumb & declaration, NEET thumb)
- [x] Generic "resize image to KB" + 10/20/30/50/100/200/500 KB landing pages
- [x] Crop (aspect-locked, touch + keyboard), rotate, brightness, clean white paper (signatures), AI white background (MediaPipe, on device), name & date strip (UPSC)
- [x] Exact KB targeting (quality search + invisible JPEG padding up to the minimum KB), clear "can't reach" errors
- [x] Pick / camera / drag-drop / paste, one-tap Download + Share
- [x] SEO: unique title/description/H1, how-to, rules table, FAQ, JSON-LD (WebApplication, HowTo, FAQPage, Breadcrumb), canonical, OG image, sitemap.xml, robots.txt
- [x] Privacy, Terms, About, Contact (Netlify Forms + honeypot), 404
- [x] Consent banner + Consent Mode v2 defaults; GA4/AdSense loaders (switched off until IDs are set)
- [x] Counter: Netlify Function + Blobs — page views + uses (once per visitor/page/day), public "used N times" (≥25), private /stats page (key in Netlify env STATS_KEY; owner link in local .netlify/stats-link.txt)
- [x] PWA: installable, offline shell, "Update now" bar; dark/light theme
- [x] Browser tests at 320/390/768/1280 (50 checks, see "Testing")

## Needs you (owner)
- [x] GitHub repo `Jay8500/online-tools` linked to Netlify (auto deploy on push to main)
- [x] AdSense account created (ca-pub-1803903263399664, site spreadapps.in), payments info done, site verified via ads.txt, review requested 2026-10-19 (status "Getting ready"). After approval: ad-unit slot IDs (`adSlots`) + Google CMP message
- [x] ads.txt live at https://spreadapps.in/ads.txt (portfolio repo, 2026-10-19)
- [ ] AdSense → Privacy & messaging: create the Google-certified CMP message (EEA/UK) → then set `useGoogleCmp: true`
- [x] GA4 property "SpreadApps Tools" (G-DXSGQK0JV0) — loads only after "Accept all"; tool_use events on download/share
- [x] Search Console: covered by existing domain property sc-domain:spreadapps.in; sitemap submitted 2026-10-19 (first status "Couldn't fetch" = normal, recheck); indexing requested for /ssc-photo-resize
- [x] Operator details on Privacy/Terms/About/Contact: Lakkoju Jaya Krishna, Hyderabad, Telangana, jay.lakkoju@gmail.com (no company yet — update when registered)
- [ ] (on hold) contact@spreadapps.in via ImprovMX — site shows jay.lakkoju@gmail.com for now (owner choice 2026-10-19)
- [ ] Netlify form notifications → set the email that receives contact messages (Site → Forms → Notifications)

## When AdSense approval email arrives (REMIND OWNER)
- [ ] AdSense → Ads → By site → spreadapps.in → turn **Auto ads OFF** (or at least Vignette + Anchor off) — they can cover the photo tool
- [ ] Create 3 display ad units (top / inContent / sidebar) → put slot IDs in `site.config.ts` `adSlots`
- [ ] Privacy & messaging → publish EEA/UK consent message → `useGoogleCmp: true`

## Phase 1 follow-ups
- [ ] Re-verify every exam size against the newest official notifications (values marked "checked 2026"); add source links per exam
- [ ] Self-host the MediaPipe wasm (now from jsDelivr, ~4 MB once) if CDN reliability is a problem
- [ ] More exams: CTET, KVS, NVS, Agniveer, State police (TS/AP), Post office GDS, UPSSSC, BPSC; "passport size photo" + "4×6 postcard photo" pages
- [ ] Combine photo + signature on one sheet (some forms ask for it); 3-signature sheet for UPSC
- [ ] DPI setting in JPEG header (some portals check 200/300 DPI)
- [ ] Telugu / Hindi versions of tool pages (hreflang)
- [ ] Lighthouse/PageSpeed run on the live URL (Core Web Vitals) after deploy

## Phase 2 — Indian money calculators ✅ built (2026-10-19)
- [x] 12 prerendered pages: EMI (+ home/car/personal loan), SIP (step-up), lumpsum, FD, PPF (7.1%), income tax old vs new (FY 2026-27, 87A + marginal relief + surcharge relief), GST (GST 2.0 5/18/40, CGST/SGST/IGST), HRA (new 8-metro list), in-hand salary
- [x] Formulas in `core/finance.ts` checked against reference values (23 checks); browser test 24 checks at 320/390/768/1280
- [ ] After every Budget / quarter: update `TAX_YEAR`, slabs, `PPF_RATE`, GST rates in `core/finance.ts`
- [ ] Later: shareable result links (?amount=…), prepayment in EMI, capital-gains tax, NPS/EPF/SSY/RD calculators, Hindi/Telugu

## Phase 3+ — PDF, business, health, language ✅ built (2026-10-19)
- [x] PDF (on device; pdf-lib + pdf.js lazy, worker/fonts self-hosted in /pdfjs): merge, split (keep/remove/every page), compress (light / image 120 dpi / 90 dpi), JPG→PDF (A4/Letter/fit), PDF→JPG/PNG
- [x] UPI QR generator (upi://pay link, VPA validation, printable A6 poster PNG, share)
- [x] GST invoice maker (GSTIN check digit, state from GSTIN, CGST/SGST vs IGST, HSN, amount in words, logo, draft on device, print → PDF)
- [x] Health: BMI (Indian/Asian bands), calories (Mifflin–St Jeor), ideal weight, pregnancy due date — "not medical advice"
- [x] Telugu typing (RTS/Lekhini-style phonetic, copy/WhatsApp, draft on device)
- [x] 7 category pages (/exam-photo-signature-resize, /image-tools, /money-calculators, /pdf-tools, /business-tools, /health-calculators, /language-tools) with CollectionPage JSON-LD; breadcrumbs, header, home "See all" and footer link to them
- [x] Converters group (/unit-converters): land area & price for Telangana/AP (acre, gunta, cent, ankanam, gajam, plot L×W, rate→total), length, weight (tola, quintal), volume, temperature, speed, data size, lakh/crore/dozen
- [x] Daily tools (/daily-tools): gold & silver jewellery price calculator (visitor enters today’s rate; grams/tola/sovereign; 24K–14K, 999/925; wastage, making, 3% GST)
- [x] Weather page + Netlify function /api/weather (OpenWeatherMap, CDN cache 20 min per city) — [ ] OWNER: create free OpenWeatherMap key and set Netlify env OPENWEATHER_API_KEY
- [ ] Later: live gold/silver rate from a metals API key (shown as approximate)
- [x] Travel planner (/travel-planner): estimates for car/bike/bus/train/flight/walk/cycle + IRCTC/NTES/TGSRTC/APSRTC/Google links; road route + towns timeline via netlify/functions/route.mts — [ ] OWNER: free OpenRouteService key → Netlify env ORS_API_KEY
- [x] Hyderabad Metro fare (/hyderabad-metro-fare): 57 stations from OSM, track km, shortest route incl. 2 changes, ₹11–₹69 chart (24 May 2025)
- [x] Petrol & diesel (/petrol-diesel-price): 11 cities, ▲▼ + blinking alert for 7 days after a change — auto-updated daily 7:00 IST by netlify/functions/rates-update.mts (Goodreturns city pages + NECC egg rate → Blobs → /api/rates; static fuel-data.ts is the fallback; manual: node scripts/update-fuel.mjs). Owner can force a refresh: POST /api/rates?key=STATS_KEY
- [ ] When income allows: paid fuel API (option 2) to replace page reading
- [x] Vegetable & grocery prices (/vegetable-prices-today): govt mandi/Rythu Bazar data via netlify/functions/mandi.mts — [ ] OWNER: data.gov.in key → Netlify env DATA_GOV_IN_API_KEY; milk/egg reference table in core/grocery-data.ts (update by hand)
- [x] Live gold/silver estimate (/api/metals: gold-api.com + ExchangeRate-API + 15% duty) with LIVE badges on cards; data-source credits on cards/pages
- [x] Home search: rotating hints with icons, multi-word search
- [ ] Later: nutrition facts (protein, minerals) for vegetables/groceries from USDA/IFCT; curd prices
- [x] Cinemas near me (/cinemas-near-me): 352 cinemas in TS/AP from OSM (112 Hyderabad), distance from typed area (1,094 built-in places, else /api/geocode via ORS) or device location; Shows & tickets = Google showtimes search, District/BookMyShow links. No showtimes/prices copied (booking sites have no public API; scraping breaks ToS). Refresh data: scripts/cinemas/build-cinemas.cjs (few times a year)
- [x] Holiday calendar (/holiday-calendar): India central 2026+2027 (DoPT), Telangana 2026 (G.O.Rt.1715), AP 2026 (G.O.Rt.2276); next-holiday banner + NEXT badge on card, long weekends, .ics download — [ ] DECEMBER: add TS & AP 2027 lists to core/holidays.ts when the GOs come out; more states later
- [x] Traffic fines & rules (/traffic-challan-fines): MV Act 2019 amounts (sections), TS/AP e-challan links + 10 rule cards — [ ] add per-state compounding amounts only from an official notification; more states later
- [x] Vegetable page: market controls hidden while DATA_GOV_IN_API_KEY is missing; egg per piece/dozen/tray and milk per litre shown
- [ ] Milk: only Vijaya + Heritage have verifiable prices; add Dodla/Jersey/Amul when a dated source (pack MRP photo or official notice) is available
- [ ] Initial bundle ~423 kB (warning raised to 440 kB): if it grows, lazy-load tool page text (tool-pages.ts)
- [x] Festival celebration: on holidays (India/TS/AP lists) a greeting card tops home + confetti/sparkle/petal shower once per visit on any page (core/celebrate.ts, lazy); tribute style for Gandhi/Ambedkar/Jagjivan Ram; none for Muharram/Good Friday; teaser 1–2 days before
- [x] Police station near me + Petrol bunk near me (OSM: 450 police, 3,336 pumps; brand filter; 112/100/1091 call buttons) — refresh: scripts/nearby/build-nearby.cjs
- [x] Home filter chips + no-results card; animated weather sky (shared/sky.ts)
- [x] Step counter & calories (/step-counter): DeviceMotion peak detection while page open + wake lock; manual steps from health app; km/kcal/min from height & weight; 7-day chart on device
- [x] Weather card on home/Daily tools uses the solid live sky (sky-card)
- [x] Fixed: pregnancy due date + GST invoice used UTC date (wrong day 00:00–05:30 IST) → core/dates.ts localIso
- [x] Currency converter (/api/fx, open.er-api daily, 25 currencies, bank/card/forex markup view, offline cache)
- [x] Computer full forms (122 terms, core/tech-terms.ts) + data size ladder + download-time calc
- [x] Mobile recharge plans + OTT prices (core/plans.ts, hand-copied from OFFICIAL sites 20 Oct 2026 via local Chrome) — [ ] re-check monthly (PLANS_CHECKED); aha/ETV Win/Sun NXT need sign-in to see prices
- [x] Scroll-to-top bubble with SpreadApps logo; sky/festival CSS moved into components (initial 437 kB)
- [x] One-time install-as-app tip (Android/iPhone/desktop steps, browser install button, ✕ remembers) — @defer with scroll-top
- [x] Terms: names & trademarks + third-party prices notes
- [ ] OWNER later: register SpreadApps (Udyam/company), trademark name+logo (check ipindia first), GST only if turnover > ₹20 lakh, report AdSense income in ITR (ask a CA)
- [ ] Consider replacing Goodreturns page-reading with paid fuel API (already planned)
- [x] Vegetable prices LIVE (20 Oct 2026): browser fetches data.gov.in directly (gov blocks non-Indian servers); /api/mandi serves the key
- [x] Fixed Permissions-Policy: geolocation=(self) so location buttons work on the live site
- [ ] On hold: movie finder / cast & crew (TMDB is non-commercial only; needs commercial licence or paid API)
- [x] Declined: song lyrics (copyrighted; would break AdSense policy)
- [x] Home = quick menu (top 4 per group / 5 exams, "See all N"); group pages carry guides (exam size table, tax slabs, Indian BMI chart, land unit table, GST invoice checklist, PDF task table, gold purity, Telugu letters)
- [x] Back button on every non-home page (history back, or home when landed directly)
- [ ] Later: Hindi typing, PDF password unlock/protect, page reorder/rotate thumbnails, invoice multi-template + saved customers, UPI QR with logo, HEIC support

## Testing (how phase 1 was verified)
`npm run build`, then a Netlify-like static server + Puppeteer script (kept in the session scratchpad):
no horizontal scroll at 320/390/768/1280 on 6 pages, "Choose photo" above the fold, consent flow, real portrait → SSC 350×450 43 KB,
rotate + keyboard + corner-drag crop, AI white background (corner pixel 255,255,255), unreachable-size error, inline validation,
wrong file type toast, IBPS signature 140×60 padded to 12 KB, UPSC name/date strip 400×500, generic 20 KB (3000×2200 noise → 1229×901 18 KB),
dark mode, 404 status, contact form validation, zero console/page errors.
Live checks on spreadapps-tools.netlify.app: pages 200 without redirect, 404 status, counter GET/POST + once-per-visitor-per-day + Origin/tool-id rejection, contact form detected by Netlify, security headers.
Not tested yet: a real contact-form submission, Android/iOS camera capture and share sheet on real phones.
