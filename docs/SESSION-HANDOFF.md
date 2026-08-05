# SESSION-HANDOFF — Upptäck Vallentuna

Levande handoff för dig själv och framtida agenter. Läs detta innan ny session om du saknar kontext.

**Senast uppdaterad:** 2026-08-05  
**Live:** https://upptackvallentuna.se  
**Repo:** https://github.com/madly-creative/upptackvallentuna (git-root = `site/`)  
**Hosting:** Netlify (build `npm run build`, publish `dist/`)

---

## Vad

**Upptäck Vallentuna** är en kurerad lokal guide till Vallentuna kommun: fik, gårdar, natur, loppis, evenemang och redaktionella “ögonblick”. Inte en kommunportal och inte en katalog över kedjor — fokus på det lokala och handplockade.

Ett konto / en sajt. Besökaren kan vara både nyfiken gäst och tipsgivare (formulär → `info@upptackvallentuna.se`).

## Varför

Google och kedjekataloger missar små verksamheter, gårdsinitiativ och tillfälliga evenemang. Sajten lyfter det som gör bygden levande — med öppettider, karta, guider och kalender, och med tydlig källhänvisning när tider kan ändras.

## Hur (arkitektur i korthet)

| Lager | Teknik |
|--------|--------|
| App-skal | Vite + vanilla JS SPA (`index.html` + `src/js/app.js`) |
| Data | `src/data/*.js` (platser, events, guider, meta) — källa till sanning |
| SEO | `scripts/generate-seo.mjs` → statiska `/plats/*`, `/evenemang/*`, `/guide/*`, sitemap |
| Formulär | Netlify Function → Loopia SMTP (fallback FormSubmit) |
| Karta | Leaflet (laddas **on demand** när kartan öppnas) |
| Analytics | Umami Cloud (idle-load på startsidan) |
| PWA | `manifest.webmanifest` + `sw.js` + kvarn-ikoner i `public/icons/` |
| Design | Playfair Display (rubriker) + DM Sans; tokens i `src/styles/main.css` |

**Repo-layout (viktigt):** Git ligger i `site/`, inte parent-mappen `Vallentuna/`. Parent har äldre monolit-HTML och `docs/LAUNCH-CHECKLIST.md` (delvis föråldrad).

```
site/
  index.html              # SPA
  evenemang.html          # genereras från events.js
  om.html / integritet.html
  netlify.toml
  netlify/functions/      # contact.mjs
  public/assets/          # webp-bilder (följer med deploy)
  public/icons/           # mark.svg → PWA + favicon
  public/plats|evenemang|guide/  # genererade SEO-sidor
  src/data/events.js      # evenemangskälla
  src/data/places.js
  src/data/placeMeta.js   # öppettider, tags, district
  src/data/guides.js
  src/data/eventCategories.js
  src/js/app.js           # UI-logik, levererar-moments, CONTENT
  src/lib/hours.js
  scripts/generate-seo.mjs
  docs/SESSION-HANDOFF.md # ← denna fil
```

---

## Arbetsflöde (live-säkert)

Sajten är **live**. Gör inte ändringar direkt på `main` utan anledning.

1. `git checkout main && git pull`
2. `git checkout -b event/kort-slug` (eller `fix/…`, `docs/…`)
3. Ändra data/assets, kör `npm test` + `npm run build`
4. Commit + `git push -u origin HEAD`
5. `gh pr create` → Netlify **Deploy Preview**
6. Granska preview → **Merge** → production deploy

Deploy preview-URL-mönster: `https://deploy-preview-<N>--upptackvallentuna.netlify.app`

---

## Lägga till evenemang (vanligaste uppgiften)

När tipset kommer (mejl/inbox):

1. **Hämta fakta** från arrangörslänk (titel, datum, tid, plats, pris, biljettlänk, kort beskrivning).
2. **Bild:** spara cover som WebP under  
   `public/assets/evenemang/<slug>/cover.webp`  
   (`cwebp -q 80`, maxbredd ~1400, **skala inte upp** små original).
3. **Lägg objekt** i `src/data/events.js`:
   - `host` — helst samma namn som i `places.js` om platsen finns (kopplar “Visa plats”)
   - `title`, `date` (`YYYY-MM-DD`), `when`, `time`, `cat` (`KULTUR` | `FESTIVAL` | `MAT` | `FIKA` | `MARKNAD` | `SPORT` | `NATUR`)
   - `note` — kort teaser
   - `img` — sökväg till cover
   - `source` — kanonisk boknings-/arrangörs-URL
4. **EVENT_CONTENT[title]** — längre HTML-body med länk.
5. Kör `npm run generate:seo` (eller `npm run build`) så SEO-sida + `evenemang.html` + sitemap uppdateras.
6. Branch + PR som ovan.

**Filterchips:** `src/data/eventCategories.js` — lägg inte till 50 kategorier; mappa nya events till befintliga `cat`.

**Passerade datum** döljs automatiskt i appen (`upcomingEvents`).

---

## Vallentuna levererar

Redaktionella ögonblick i `src/js/app.js` → `moments[]`.

- **`datePublished`:** ISO `YYYY-MM-DD` — källa för sortering, visning, framtida JSON-LD/arkiv.
- Visa aldrig lagrat “visningsdatum”; härled med `formatMomentDate`.
- Bilder: `public/assets/levererar/<id>/…`
- Deep link: `#levererar=<id>`

## Platser

- Katalog: `src/data/places.js`
- Öppettider/tags: `src/data/placeMeta.js` + `src/lib/hours.js`
- Rich text/galleri: `CONTENT` i `src/js/app.js`
- **Alltid-öppna** platser (natur, kyrka utan tider) → status **“Alltid tillgänglig”**, inte “Öppet nu”
- Deep link `?plats=<slug>` rensas när man lämnar platssidan (annars reload öppnar platsen igen)

## Brand / ikoner

| Asset | Användning |
|--------|------------|
| `public/assets/shared/logo.svg` | Header/footer wordmark |
| `public/icons/mark.svg` | Favicon + PWA (kvarnen) |
| `npm run generate:icons` | Regenererar PNG från mark |

Typsnitt: **Playfair Display** (rubriker), **DM Sans** (bröd).

---

## Kommandon

```bash
cd site
npm install
npm run dev              # localhost:5173 (+ predev SEO)
npm test                 # Vitest
npm run build            # SEO + Vite → dist/
npm run generate:seo
npm run generate:icons
npm run test:e2e         # Playwright
```

## Miljö / mejl

Se `.env.example` och `netlify.toml`. Live: Loopia via  
`SMTP_HOST=mailcluster.loopia.se`, `SMTP_PORT=465`, plus `SMTP_USER` / `SMTP_PASS` i Netlify UI.

---

## Gotchas (kostade tid)

- **Partial npm installs** / peer deps: `site/.npmrc` har `legacy-peer-deps=true`.
- **Bilder:** alltid WebP i `public/assets/`; PNG-botanical byttes till webp av prestandaskäl.
- **Leaflet/fonts/Umami** på startsidan: deferred/non-blocking för LCP — lägg inte tillbaka synkron Leaflet i `<head>`.
- **Service worker:** bumpa `CACHE` i `public/sw.js` när skalet/ikoner ändras.
- **generate-seo** skriver om `evenemang.html`, `public/plats|evenemang|guide`, `sitemap.xml` — committa genererade filer tillsammans med dataändringen.
- Parent-mappen `Vallentuna/assets` vs `site/public/assets` — deploy använder **public/**.

---

## Status snapshot (2026-08-05)

| Område | Status |
|--------|--------|
| Live på egen domän | ✅ |
| Auth / betalt | N/A (statisk guide) |
| Evenemangskalender + SEO | ✅ |
| Guider | ✅ |
| Karta + öppettider | ✅ |
| Vallentuna levererar + datum | ✅ |
| Bygdens röster | Gated (`VOICES_COMING_SOON = true`) — Unsplash-porträtt, vänta på riktiga foton |
| Prestanda mobil | ~75 PSI efter LCP-arbete; mer critical CSS kan vänta |
| Admin-panel | Finns inte — tips via mejl/formulär |

---

## Resume-prompt (klistra in i ny chat)

```
Du arbetar i Upptäck Vallentuna (git-root: site/).
Läs docs/SESSION-HANDOFF.md först.
Sajten är live på upptackvallentuna.se — använd feature-branch + PR + Netlify Deploy Preview, merge till main först när det är granskat.
Uppgift: …
```

---

## Relaterade filer

- `README.md` — snabbstart (vissa “blockers” kan vara inaktuella; lita på denna handoff för live-status)
- `../docs/LAUNCH-CHECKLIST.md` — äldre checklista i parent (historik)
- Designreferens utanför repo kan finnas lokalt; UI-tokens lever i `src/styles/main.css`
