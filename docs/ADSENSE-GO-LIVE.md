# AdSense — ads ni live cheyadam (Claude lekunda kuda)

AdSense lo **Sites → spreadapps.in = "Ready"** ani vachina tarvata ee steps cheyandi. Total ~10 min.

## 1. AdSense lo 3 ad units create cheyandi

1. adsense.google.com → **Ads** → **By ad unit** → **Display ads**
2. Name: `tools-top` → shape **Responsive** alage vadileyandi → **Create**
3. Vachina code lo `data-ad-slot="1234567890"` ane **number copy** chesukondi
4. Same ga inka 2: `tools-in-content`, `tools-sidebar`

Mee daggara 3 numbers untayi (prathi okkati 10 digits).

> Auto ads, Auto optimize **OFF** lone undali (Ads → By site → spreadapps.in ✏️). Google tools madhyalo ads pettakunda.

## 2. Code lo pettandi

VS Code lo `d:\freelance\tools\src\app\core\site.config.ts` open chesi, ee 2 lines marchandi:

```ts
  adsLive: false,
  adSlots: { top: '', inContent: '', sidebar: '' } as Record<string, string>,
```

ilaa (mee numbers tho):

```ts
  adsLive: true,
  adSlots: { top: '1111111111', inContent: '2222222222', sidebar: '3333333333' } as Record<string, string>,
```

- `top` = tools-top number, `inContent` = tools-in-content, `sidebar` = tools-sidebar
- Quotes `' '` alage undali, numbers matrame marchandi. Save (Ctrl + S).

## 3. Live ki pampandi

VS Code terminal (Ctrl + `) lo:

```bash
cd d:\freelance\tools
npm run build
git add src/app/core/site.config.ts
git commit -m "Ads live: AdSense units added"
git push
```

- `npm run build` lo **ERROR** vasthe push cheyakandi — mee number lo quote/comma miss ayyindemo chudandi.
- Push tarvata Netlify **2–3 min** lo live. Ads kanipinchadaniki Google ki konni gantalu (max 1 day) padutundi.

## 4. Check

- tools.spreadapps.in lo edaina tool open cheyandi → tool **kinda** "Advertisement" box vastundi (tool madhyalo kaadu).
- **Mee own ads eppudu click cheyakandi** — account ban avutundi. Friends ki kuda click cheyamani cheppakandi.

## Later (optional)

- AdSense → **Privacy & messaging** → India/global ki consent message create chesthe, `site.config.ts` lo `useGoogleCmp: true` pettandi (same build → commit → push steps).
- engine.spreadapps.in lo ads kavalante `d:\freelance\spread-engine\src\app\shared\site.config.ts` lo `adSlots` (afterFeatures, afterCode) same ga.

## Ads rule (always)

Ads **khaali space lo matrame** — tool kinda, article madhyalo, desktop sidebar. Inputs ↔ download button madhya, popups lopala, screen paina sticky ga **eppudu kaadu**.
