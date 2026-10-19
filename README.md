# SpreadApps Tools

Free online tools for India at **https://tools.spreadapps.in**. Everything runs in the browser, so files are never uploaded.

- Angular 22 (standalone, signals, zoneless) + Tailwind v4
- Every page is prerendered to static HTML for SEO (`outputMode: static`)
- PWA via Angular service worker, with an "Update now" bar
- Netlify hosting; one function (`netlify/functions/count.mts`) runs the public usage counter on Netlify Blobs

## Commands
```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build + sitemap.xml + 404.html (scripts/postbuild.mjs)
```

## Where things live
| What | File |
|---|---|
| Exam sizes (one page per exam × document) | `src/app/core/exams.ts` |
| Image pipeline (crop, clean, stamp, exact-KB JPEG) | `src/app/core/image-engine.ts` |
| AI white background (MediaPipe, lazy) | `src/app/core/bg-remove.ts` |
| Tool UI | `src/app/shared/image-tool.ts`, `cropper.ts` |
| SEO (title, canonical, JSON-LD) | `src/app/core/seo.service.ts` |
| GA4 / AdSense / consent IDs | `src/app/core/site.config.ts` |
| Pending work | `docs/ROADMAP.md` |

To add an exam, add it to `EXAMS` in `exams.ts`. Its routes, prerendered pages, sitemap entries and internal links are generated from that entry.
