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
- [x] "Used N times" counter: Netlify Function + Blobs (`netlify/functions/count.mts`)
- [x] PWA: installable, offline shell, "Update now" bar; dark/light theme
- [x] Browser tests at 320/390/768/1280 (50 checks, see "Testing")

## Needs you (owner)
- [x] GitHub repo `Jay8500/online-tools` linked to Netlify (auto deploy on push to main)
- [x] AdSense account created (ca-pub-1803903263399664, site spreadapps.in), payments info done, site verified via ads.txt, review requested 2026-10-19 (status "Getting ready"). After approval: ad-unit slot IDs (`adSlots`) + Google CMP message
- [x] ads.txt live at https://spreadapps.in/ads.txt (portfolio repo, 2026-10-19)
- [ ] AdSense → Privacy & messaging: create the Google-certified CMP message (EEA/UK) → then set `useGoogleCmp: true`
- [ ] GA4: create property → put `G-…` in `site.config.ts` (`ga4Id`)
- [ ] Google Search Console: verify tools.spreadapps.in (DNS TXT or HTML tag) and submit sitemap.xml
- [ ] Business name + address for Privacy/Terms (playbook §11); quick legal review before ads go live
- [ ] Netlify form notifications → set the email that receives contact messages (Site → Forms → Notifications)

## Phase 1 follow-ups
- [ ] Re-verify every exam size against the newest official notifications (values marked "checked 2026"); add source links per exam
- [ ] Self-host the MediaPipe wasm (now from jsDelivr, ~4 MB once) if CDN reliability is a problem
- [ ] More exams: CTET, KVS, NVS, Agniveer, State police (TS/AP), Post office GDS, UPSSSC, BPSC; "passport size photo" + "4×6 postcard photo" pages
- [ ] Combine photo + signature on one sheet (some forms ask for it); 3-signature sheet for UPSC
- [ ] DPI setting in JPEG header (some portals check 200/300 DPI)
- [ ] Telugu / Hindi versions of tool pages (hreflang)
- [ ] Lighthouse/PageSpeed run on the live URL (Core Web Vitals) after deploy

## Phase 2 — Indian money calculators
EMI, SIP, FD, PPF, income tax old vs new (FY 2026-27 slabs), GST, HRA, in-hand salary. Each: own page, charts, "estimates, not financial/tax advice" disclaimer, FAQ + JSON-LD.

## Phase 3 — PDF tools (lazy-loaded pdf-lib / pdf.js)
Merge, split, compress, image → PDF, PDF → image. All on device.

## Phase 4+
UPI QR generator → GST invoice maker (print/PDF) → health calculators (BMI, BMR, due date — "not medical advice") → Telugu typing.

## Testing (how phase 1 was verified)
`npm run build`, then a Netlify-like static server + Puppeteer script (kept in the session scratchpad):
no horizontal scroll at 320/390/768/1280 on 6 pages, "Choose photo" above the fold, consent flow, real portrait → SSC 350×450 43 KB,
rotate + keyboard + corner-drag crop, AI white background (corner pixel 255,255,255), unreachable-size error, inline validation,
wrong file type toast, IBPS signature 140×60 padded to 12 KB, UPSC name/date strip 400×500, generic 20 KB (3000×2200 noise → 1229×901 18 KB),
dark mode, 404 status, contact form validation, zero console/page errors.
Live checks on spreadapps-tools.netlify.app: pages 200 without redirect, 404 status, counter GET/POST + once-per-visitor-per-day + Origin/tool-id rejection, contact form detected by Netlify, security headers.
Not tested yet: a real contact-form submission, Android/iOS camera capture and share sheet on real phones.
