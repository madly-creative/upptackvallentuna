# Bildassets — Upptäck Vallentuna

Varje redaktionell enhet har **egen mapp**. Lägg bilderna där, peka sedan på sökvägen i HTML-datan.

## Mappstruktur

```
assets/
  hero/                 Hero-karusell på startsidan
  levererar/<slug>/     Vallentuna levererar (egna ögonblick)
  roester/<slug>/       Bygdens röster (porträtt)
  evenemang/<slug>/     Evenemang
  upplev/<slug>/        Platser under Upplev Vallentuna
  shared/               Gemensamma bilder (logotyper, ikoner m.m.)
```

## Namnkonvention

- **Slug** = kebab-case, utan å/ä/ö (`å→a`, `ä→a`, `ö→o`), inga mellanslag.
  - `En bilträff ur tomma intet` → `biltraff-ur-tomma-intet`
  - `Vallentuna Stenugnsbageri` → `vallentuna-stenugnsbageri`
  - Porträtt använder redan `slug` i datan (`stenugnsbageriet-bagaren`).
- **Filnamn** (rekommenderat):
  - `cover.jpg` / `cover.png` — huvudbild (kort, teaser, event)
  - `hero.jpg` — bred hero (porträtt / platsdetalj)
  - `portratt.jpg` — personporträtt (Bygdens röster)
  - `01.jpg`, `02.jpg`… eller beskrivande namn (`brod.png`, `lunch.png`) för galleri
- Format: JPG eller WebP för foto, PNG när transparens behövs. Sikta på webbanpassad storlek (~1200–1800 px bred).

## Exempel i data

```js
// Vallentuna levererar
{ title: "…", img: "assets/levererar/biltraff-ur-tomma-intet/cover.jpg", … }

// Bygdens röster
{ slug: "stenugnsbageriet-bagaren", heroImg: "assets/roester/stenugnsbageriet-bagaren/hero.png",
  portraitImg: "assets/roester/stenugnsbageriet-bagaren/portratt.png", … }

// Evenemang
{ title: "Kanelbullens dag", img: "assets/evenemang/kanelbullens-dag/cover.png", … }

// Upplev (plats)
{ name: "Vallentuna Stenugnsbageri", img: "assets/upplev/vallentuna-stenugnsbageri/cover.png", … }

// Hero-karusell
const heroImages = [
  "assets/hero/kvarn.jpg",
  "assets/hero/hantverkare.jpg",
  "assets/hero/hastar.jpg",
  "assets/hero/sjön.jpg"
];
```

Tom `img` / `heroImg` i datan = befintlig fallback (Unsplash m.m.) — mapparna kan stå tomma tills du har egna foton.

## Arbetsflöde

1. Skapa mapp under rätt sektion (eller använd den som redan finns).
2. Lägg in bilderna med tydliga filnamn.
3. Uppdatera sökvägen i `upptack-vallentuna-v19_2.html`.
4. Låt inte bilder ligga löst i `assets/`-roten.
