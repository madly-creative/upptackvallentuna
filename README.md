# Upptäck Vallentuna (site/)

Vite-baserad guide — inte längre en enda HTML-fil.

**Handoff / full kontext:** [`docs/SESSION-HANDOFF.md`](docs/SESSION-HANDOFF.md) — vad, varför, hur, live-workflow, evenemangstips, gotchas. Läs den vid ny session.

Live: https://upptackvallentuna.se · GitHub: https://github.com/madly-creative/upptackvallentuna

## Kom igång

```bash
cd site
cp .env.example .env   # fyll i mejl + Formspree
npm install
npm run generate:seo   # plats-/event-sidor + synkar evenemang.html
npm run dev            # http://localhost:5173
npm test               # Vitest
npm run build          # prebuild → SEO + vite → dist/
npm run test:e2e       # Playwright (kräver npx playwright install)
```

## Struktur

```
site/
  index.html           # SPA-start
  evenemang.html       # SEO-kalender (genereras från events.js)
  om.html / integritet.html
  public/              # robots, sitemap, genererade plats/event-sidor
  public/assets/       # bilder (riktig mapp — måste följa med i deploy)
  src/
    data/events.js     # evenemangskälla
    data/places.js     # platskatalog
    data/guides.js     # dagsguider
    data/site.js       # domän, mejl, Formspree
    lib/hours.js       # öppettider (testbar)
    lib/forms.js       # Formspree / mailto
    js/app.js          # app-logik
    styles/
  scripts/generate-seo.mjs
  tests/               # Vitest
  e2e/                 # Playwright smoke
```

## Blockers → status

| Blocker | Status |
|--------|--------|
| Inte en monolit-HTML | ✅ Vite + flera sidor |
| Formulär | ✅ Netlify function → Loopia SMTP (eller FormSubmit) |
| Integritetspolicy | ✅ `integritet.html` |
| SEO (meta/OG/sitemap/plats) | ✅ inkl. `/plats/*` + `/evenemang/*` |
| Guider + Maps-rutt | ✅ |
| Öppettider-disclaimer | ✅ |
| Automatiska tester + CI | ✅ |
| Deploy / domän | ⬜ hosta `dist/` + peka domän |
| Loopia SMTP i Netlify | ⬜ sätt SMTP_USER + SMTP_PASS |
| Unsplash-covers (8 platser) | ⬜ byt till egna foton |
| Assets-symlink | ✅ relativ `../../assets` |
| PWA (hemskärm) | ✅ manifest + SW + ikoner (HTTPS krävs) |

## PWA

Sajten är installerbar som app på hemskärmen (Android/Chrome + iOS Safari “Lägg till på hemskärmen”).

- `public/manifest.webmanifest` — namn, tema `#37472f`, bakgrund `#f5f1e8`
- `public/sw.js` — cachar bara skalet; Open-Meteo och CARTO-tiles hämtas alltid live
- `public/icons/` — kvarnmärke (192 / 512 / maskable / apple-touch). Regenerera: `npm run generate:icons`
- Diskret “Lägg till”-hint via `beforeinstallprompt` (återkommande besök, Android)

Ingen push, ingen bakgrundssynk. Install kräver **HTTPS** (eller localhost).

## Deploy (Netlify / Cloudflare Pages / nginx)

1. Build command: `npm run build` (se `netlify.toml`)
2. Publish directory: `dist`
3. Formulär → Loopia: sätt i Netlify env `SMTP_USER` + `SMTP_PASS` för `info@upptackvallentuna.se`
   (utan SMTP används FormSubmit till samma adress — bekräfta aktiveringsmejlet en gång)
4. Bekräfta att `https://upptackvallentuna.se` matchar canonical
5. Skicka in `https://upptackvallentuna.se/sitemap.xml` i Search Console
