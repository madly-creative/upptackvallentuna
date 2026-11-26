# Butiken

Posters, inramade tryck och vykort med Juhas motiv. Sida: `butik.html`. Kassa: Stripe Checkout (kort, Klarna, Swish). Tryck och leverans: Gelato, beställs automatiskt när betalningen gått igenom.

## Så hänger det ihop

```
butik.html + src/shop/butik.js      varukorg i webbläsaren (localStorage)
        │  POST {items}
        ▼
netlify/functions/checkout.mjs      priser från src/data/shop.js → Stripe Checkout-session
        │  kunden betalar hos Stripe
        ▼
netlify/functions/stripe-webhook.mjs  betald → Gelato POST /v4/orders (src/data/shopPrint.js)
```

- **Priser, frakt, julsista dag:** `src/data/shop.js`. Ändra siffran, committa.
- **Gelato-produkter och tryckfiler:** `src/data/shopPrint.js` (bara server). Tryckfilerna ligger i `public/tryck/<hemlig mapp>/`, utan länkar och med `X-Robots-Tag: noindex`.
- **Webbilder och väggmockups:** `public/assets/butik/` (720/1400 px + ram i ek/svart/vit).
- **Nytt motiv:** lägg till i `MOTIFS`, lägg webbilder i `public/assets/butik/` och tryckfiler i tryckmappen. `npm test` kontrollerar att allt finns.

## Mockläge

Utan nycklar fungerar allt utom pengarna: "Till kassan" leder direkt till tack-vyn (`?order=mock`), och webhooken loggar Gelato-ordern i stället för att skicka den.

## Nycklar (Netlify → Site configuration → Environment variables)

| Variabel | Var den finns | Värde |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys | `sk_test_…` först, `sk_live_…` vid go-live |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → Add endpoint `https://upptackvallentuna.se/.netlify/functions/stripe-webhook`, händelser `checkout.session.completed` och `checkout.session.async_payment_succeeded` | `whsec_…` |
| `GELATO_API_KEY` | Gelato → Developer → API keys | nyckeln |
| `GELATO_ORDER_TYPE` | — | `draft` under test (ordern hamnar som utkast i Gelato), `order` vid go-live |

I Stripe → Settings → Payment methods: slå på **Kort, Klarna och Swish**. Kassan visar automatiskt de som är på.
I Stripe → Settings → Emails: slå på kvitton till kunden.

Kontrollera Gelato-kopplingen: `GELATO_API_KEY=… npm run gelato:check`.

## Go-live

1. Ta bort `<meta name="robots" content="noindex,nofollow">` i `butik.html` och `X-Robots-Tag` för `/butik.html` i `netlify.toml`.
2. Lägg till "Butik" i navigeringen på startsidan och de statiska sidorna, och `/butik.html` i sitemap (`scripts/generate-seo.mjs`).
3. Fyll i säljaruppgifter (Madly: org.nr, adress) under "Säljare" i `butik.html`.
4. Byt till `sk_live_…`, ny webhook i live-läge, `GELATO_ORDER_TYPE=order`.
5. Gör ett riktigt köp av ett vykort och kontrollera att ordern dyker upp i Gelato.
