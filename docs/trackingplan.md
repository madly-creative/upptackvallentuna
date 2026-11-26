# Trackingplan — Upptäck Vallentuna (Umami)

Mål: förstå **hur** besökare rör sig på sajten och **vad som fungerar eller ignoreras**, inte bara hur många som kommer.
Principer: få eventnamn, egenskaper i stället för nya namn, automatik före handpåläggning, cookiefritt.

## Frågor → mätning

| Fråga | Hur vi svarar | Var i Umami |
|---|---|---|
| Vilka vägar tar folk genom sajten? | Egen sidvisning per SPA-vy (`/app/guider`, `/app/plats/<slug>` …) | Journeys, Pages, Entry/Exit |
| Vilka sektioner på startsidan ses, och vilka klickas? | `page_summary.seen` + `click.sec` → klick per visning | Events → Properties, veckorapport |
| Hur långt ned scrollar man? | `page_summary.depth` (0/25/50/75/100) per sida | Events → Properties (filtrera sida) |
| Vad klickar man på? | `click {sec, el}` fångas automatiskt för alla knappar och länkar | Events → click |
| Skickar vi vidare trafik till verksamheterna? | `outbound {kind, dest, name}` för hemsida, karta/rutt, telefon, mejl, sociala | Events → outbound |
| Vad söker folk efter som vi inte har? | `search {q, hits}` där `hits=0` = lucka i innehållet | Events → search |
| Används evenemangsfiltren? | `filter {kind: evenemang, value}` | Events → filter |
| Sparar/planerar man? | `action {type, item}`: fav_add, list_add, reminder, event_open, submit_* … | Events → action |
| Fungerar nyhetsbrevet? | `action` `submit_newsletter` (item = sektion: `nyhetsbrev`, `nyhetsbrev-om`, `nyhetsbrev-sida`) delat med `page_summary.seen` för sektionen; `newsletter_confirmed` = bekräftad länk; `newsletter_error` (item = felkod) | Events → action, veckorapport |
| Säljer butiken? | Sidvisning `/butik.html` → `action` `shop_add` (item = `motiv:produkt`) → `shop_checkout` → `shop_purchase` (item = varukorg, `revenue` + `currency=SEK`). `shop_cancel` = avbrutet i Stripe. Sektioner `butik-<motiv>` i `page_summary.seen` visar vilka motiv som faktiskt ses | Funnel "butik", Events → action, Revenue |
| Spelar herofilmen någon roll? | Herons `seen` vs. klick i `sec=hero` (sök, genvägar) jämfört med andra sektioner | Veckorapport |

## Eventkatalog (sex namn, inga fler utan att uppdatera denna fil)

| Event | Egenskaper | Skickas när |
|---|---|---|
| (sidvisning) | url, title, referrer | Statiska sidor: automatiskt. SPA: `ut.page()` vid varje vybyte |
| `click` | `sec`, `el`, `page` | Klick på knapp/länk (delegerat, automatiskt) |
| `outbound` | `kind` (web/maps/phone/mail/social), `dest` (domän), `sec`, `name` | Länk som lämnar sajten, eller `ut.outbound()` vid `window.open` |
| `search` | `q` (gemener, max 60 tecken), `hits` (0 / 1-3 / 4+) | 1,5 s efter att man slutat skriva |
| `filter` | `kind`, `value` | Filterval |
| `action` | `type`, `item` | Avsiktlig handling (favorit, lista, påminn, tips, geo …) |
| `page_summary` | `page`, `depth`, `seen` (kommalista), `time` (intervall) | **En** rad per sidvisning: vid vybyte eller när fliken göms |

`page_summary` ersätter separata scroll- och synlighetsevent: en rad i stället för ~10 per sidvisning. Det håller nere eventvolymen (Umami Cloud räknar event mot planens tak).

## Sektioner

Märk ett block med `data-sec="namn"` så räknas det automatiskt (synlighet + klick). Startsidan har:
`hero`, `hero-evenemang`, `vart-vill-du`, `helgen`, `handplockat`, `nara-dig`, `veckans-guide`, `rutt`, `berattelser`, `visste-du`, `tipsa`, `nyhetsbrev`, samt `nav`, `nav-mobil`, `footer`, `evenemang-modal` (klick, inte synlighet).
Omärkta block får vyns id (`hander`, `plats` …) eller närmaste sektions-id.

## Implementation

- `src/shop/butik.js` — butiken (`butik.html`). Mäter `shop_add`, `shop_checkout`, `shop_purchase`, `shop_cancel` som `action`; `revenue`/`currency` på köp så att Umamis intäktsrapport fungerar.

- `public/nyhetsbrev.js` — formulär med `data-nyhetsbrev` (startsidan, Om, `/nyhetsbrev.html`). Skickar till `netlify/functions/subscribe.mjs` (Brevo, double opt-in) och mäter enligt ovan.

- `public/ut.js` — hela mätlagret (kö tills Umami laddat, klick/utgående, sammanfattning, `window.ut`-API).
- `index.html` — Umami med `data-auto-track="false"`; `ut.js` med `data-spa`. Vyer skickar `ut.page()` från `showView()` i `src/js/app.js`.
- Statiska sidor (genererade av `scripts/generate-seo.mjs`, samt om/integritet/evenemang) laddar `ut.js` efter Umami.
- `e2e/tracking.spec.js` — kontraktstest: tillåtna eventnamn, SPA-sidvisningar, filter, sök, utgående.

## Rekommenderade rapporter i Umami (Reports)

1. **Journey** — start `/`, 4 steg. Visar de vanligaste vägarna.
2. **Funnel "evenemang"** — `/` → `/app/hander` → event `action` (event_open) → event `outbound`.
3. **Funnel "butik"** — `/butik.html` → `action` shop_add → shop_checkout → shop_purchase.
4. **Funnel "plats"** — `/` → `/app/kategori/*` → `/app/plats/*` → event `outbound`.
5. **Goals** — `outbound` och `action` med `type=reminder` som veckomål.

## Egen trafik

Kör en gång i varje egen webbläsare: `localStorage.setItem('umami.disabled','1')` (gäller både Umami och `ut.js`).

## Veckorapport

`scripts/umami-report.mjs` hämtar veckans data via Umami API (kräver `UMAMI_API_KEY`) och skriver ett dataunderlag med tabeller och regelbaserade signaler. En schemalagd uppgift kör den måndagar och skriver en tolkad rapport.
