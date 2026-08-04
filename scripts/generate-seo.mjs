/**
 * Generates crawlable place + event pages and sitemap from data modules.
 * Run: node scripts/generate-seo.mjs  (also via npm prebuild)
 */
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { places, placeSlug, schemaTypeFor } from "../src/data/places.js";
import { PLACE_META } from "../src/data/placeMeta.js";
import { events, eventSlug } from "../src/data/events.js";
import { guides, seasonLabel } from "../src/data/guides.js";
import { SITE } from "../src/data/site.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const base = SITE.url.replace(/\/$/, "");
const DOW = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
/** Index matches PLACE_META.hours (0 = Sunday). */
const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const umamiScript = SITE.umamiWebsiteId
  ? `<script defer src="https://cloud.umami.is/script.js" data-website-id="${SITE.umamiWebsiteId}"></script>`
  : "";

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtSlot(slot) {
  if (slot === "always") return "Öppet dygnet runt";
  if (!slot) return "Stängt";
  const pad = (n) => String(n).padStart(2, "0");
  const c = slot.c >= 24 ? `${pad(slot.c - 24)}:00 (+1)` : `${pad(slot.c)}:00`;
  return `${pad(slot.o)}:00 – ${c}`;
}

function hoursRows(place) {
  const meta = PLACE_META[place.name] || {};
  const hours = meta.hours;
  if (!hours) {
    if (place.oh === 0 && place.ch === 24) {
      return DOW.map((d) => `<tr><td>${d}</td><td>Öppet dygnet runt</td></tr>`).join("");
    }
    return DOW.map((d) => `<tr><td>${d}</td><td>${fmtSlot({ o: place.oh, c: place.ch })}</td></tr>`).join("");
  }
  return DOW.map((d, i) => `<tr><td>${d}</td><td>${fmtSlot(hours[i])}</td></tr>`).join("");
}

function absImg(img) {
  if (!img) return `${base}${SITE.defaultOgImage}`;
  if (img.startsWith("http")) return img;
  return `${base}${img.startsWith("/") ? "" : "/"}${img}`;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** schema.org OpeningHoursSpecification from PLACE_META / place defaults. */
function openingHoursSpecification(place) {
  const meta = PLACE_META[place.name] || {};
  let slots = meta.hours;
  if (!slots) {
    if (place.oh === 0 && place.ch === 24) {
      slots = Array(7).fill("always");
    } else if (typeof place.oh === "number" && typeof place.ch === "number") {
      slots = Array(7).fill({ o: place.oh, c: place.ch });
    } else {
      return undefined;
    }
  }
  const specs = [];
  for (let i = 0; i < 7; i++) {
    const slot = slots[i];
    if (slot === "always") {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${SCHEMA_DAYS[i]}`,
        opens: "00:00",
        closes: "23:59",
      });
    } else if (slot && typeof slot === "object") {
      const closesH = slot.c >= 24 ? slot.c - 24 : slot.c;
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${SCHEMA_DAYS[i]}`,
        opens: `${pad2(slot.o)}:00`,
        closes: `${pad2(closesH)}:00`,
      });
    }
  }
  return specs.length ? specs : undefined;
}

function chrome({ title, description, canonical, ogImage, jsonLd, body, current }) {
  const nav = [
    ["/", "Startsida", current === "start"],
    ["/evenemang.html", "Evenemang", current === "evenemang"],
    ["/om.html", "Om", current === "om"],
    ["/integritet.html", "Integritet", current === "integritet"],
  ]
    .map(
      ([href, label, on]) =>
        `<a href="${href}"${on ? ' aria-current="page"' : ""}>${label}</a>`
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="sv_SE">
  <meta property="og:site_name" content="${esc(SITE.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
  <meta name="theme-color" content="#37472f">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Vallentuna">
  <link rel="icon" href="/assets/shared/logo.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/seo.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <script src="/pwa-boot.js" defer></script>
  ${umamiScript}
</head>
<body class="seo-page">
  <header class="seo-top">
    <a class="seo-brand" href="/">${esc(SITE.name)}</a>
    <nav aria-label="Sekundär">
      ${nav}
    </nav>
  </header>
  <main class="seo-main">
${body}
  </main>
  <footer class="seo-foot">
    <a href="/">Startsida</a>
    <span>·</span>
    <a href="/evenemang.html">Evenemang</a>
    <span>·</span>
    <a href="/om.html">Om Upptäck Vallentuna</a>
    <span>·</span>
    <a href="/integritet.html">Integritet</a>
    <span>·</span>
    <a href="mailto:${esc(SITE.contactEmail)}">Tips</a>
  </footer>
  <p class="built-by"><a href="https://www.fvno.se/" target="_blank" rel="noopener">Byggd av Formverket Norrort</a></p>
</body>
</html>
`;
}

mkdirSync(join(root, "public/css"), { recursive: true });
const seoCss =
  readFileSync(join(root, "src/styles/seo-pages.css"), "utf8") +
  `
.seo-hero-img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:18px;margin:0 0 22px;background:#e8e0d4}
.seo-meta{font-size:13px;color:var(--ink-soft,#5c5648);margin-bottom:18px}
.seo-meta span+span::before{content:" · "}
.hours-table{width:100%;border-collapse:collapse;font-size:14px;margin:16px 0 24px}
.hours-table td{padding:8px 0;border-bottom:1px solid rgba(40,34,24,.08)}
.hours-table td:last-child{text-align:right;font-variant-numeric:tabular-nums}
.built-by{text-align:center;font-size:11px;letter-spacing:.04em;color:var(--ink-soft,#5c5648);opacity:.72;padding:8px 20px 28px;margin:0}
.built-by a{color:inherit;text-decoration:none;border-bottom:1px solid transparent}
.built-by a:hover{border-bottom-color:currentColor;opacity:1}
.seo-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.seo-actions a{font-size:14px;font-weight:600;color:var(--rust,#a85a3a)}
.seo-guide-stops{margin:16px 0 24px;padding-left:1.25em}
.seo-guide-stops li{margin:0 0 18px}
.seo-guide-stops h3{font-family:var(--font-serif,Georgia,serif);font-size:1.15rem;font-weight:600;margin:0 0 6px}
.seo-guide-stops h3 a{color:var(--rust,#a85a3a)}
`;
writeFileSync(join(root, "public/css/seo.css"), seoCss, "utf8");

const platsDir = join(root, "public/plats");
if (existsSync(platsDir)) rmSync(platsDir, { recursive: true });
mkdirSync(platsDir, { recursive: true });

const placeUrls = [];
for (const p of places) {
  const slug = placeSlug(p.name);
  const meta = PLACE_META[p.name] || {};
  const path = `/plats/${slug}.html`;
  const canonical = `${base}${path}`;
  const desc = (p.short || p.blurb || "").slice(0, 160);
  const ogImage = absImg(p.img);
  const schemaType = schemaTypeFor(p);

  const hoursSpec = openingHoursSpecification(p);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: p.name,
    description: p.blurb,
    image: ogImage,
    url: canonical,
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(p.url ? { sameAs: [p.url] } : {}),
    geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
    address: {
      "@type": "PostalAddress",
      addressLocality: meta.district || SITE.kommun,
      addressRegion: "Stockholm",
      addressCountry: "SE",
    },
    areaServed: SITE.kommun,
    ...(hoursSpec ? { openingHoursSpecification: hoursSpec } : {}),
  };

  const links = [];
  if (p.url) links.push(`<a href="${esc(p.url)}" target="_blank" rel="noopener">Webbplats</a>`);
  links.push(`<a href="/?plats=${encodeURIComponent(slug)}">Öppna i guiden</a>`);
  links.push(
    `<a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener">Hitta hit</a>`
  );

  const body = `
    <img class="seo-hero-img" src="${esc(p.img)}" alt="${esc(p.name)}" width="1200" height="675" loading="eager">
    <p class="seo-meta"><span>${esc(p.cat)}</span>${meta.district ? `<span>${esc(meta.district)}</span>` : ""}<span>${esc(SITE.kommun)}</span></p>
    <h1>${esc(p.name)}</h1>
    <p class="lede">${esc(p.blurb)}</p>
    ${p.short && p.short !== p.blurb ? `<p>${esc(p.short)}</p>` : ""}
    <h2>Öppettider</h2>
    <table class="hours-table"><tbody>${hoursRows(p)}</tbody></table>
    <p class="seo-meta">Öppettider kan ändras — dubbelkolla med stället innan du åker.</p>
    ${meta.seasonNote ? `<p><em>${esc(meta.seasonNote)}</em></p>` : ""}
    <div class="seo-actions">${links.join("")}</div>
    <p class="seo-cta" style="margin-top:36px"><a href="/">← Alla ställen i ${esc(SITE.kommun)}</a></p>
  `;

  writeFileSync(
    join(platsDir, `${slug}.html`),
    chrome({
      title: `${p.name} — ${SITE.name}`,
      description: desc,
      canonical,
      ogImage,
      jsonLd,
      body,
      current: "start",
    }),
    "utf8"
  );
  placeUrls.push({ loc: canonical, priority: "0.8" });
}

const evDir = join(root, "public/evenemang");
if (existsSync(evDir)) rmSync(evDir, { recursive: true });
mkdirSync(evDir, { recursive: true });
const eventUrls = [];

for (const e of events) {
  const slug = eventSlug(e);
  const path = `/evenemang/${slug}.html`;
  const canonical = `${base}${path}`;
  const ogImage = absImg(e.img);
  const desc = (e.note || e.title).slice(0, 160);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.note,
    startDate: e.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image: ogImage,
    url: canonical,
    location: {
      "@type": "Place",
      name: e.host,
      address: {
        "@type": "PostalAddress",
        addressLocality: SITE.kommun,
        addressCountry: "SE",
      },
    },
    organizer: { "@type": "Organization", name: e.host },
    ...(e.source ? { sameAs: [e.source] } : {}),
  };

  const body = `
    <p class="seo-meta"><time datetime="${esc(e.date)}">${esc(e.when)}</time><span>${esc(e.cat)}</span></p>
    <h1>${esc(e.title)}</h1>
    <p class="lede">${esc(e.host)} · ${esc(e.time)}</p>
    <p>${esc(e.note)}</p>
    <div class="seo-actions">
      <a href="/evenemang.html">Alla evenemang</a>
      <a href="/?view=hander">Öppna i guiden</a>
      ${e.source ? `<a href="${esc(e.source)}" target="_blank" rel="noopener">Källa / mer info</a>` : ""}
    </div>
  `;

  writeFileSync(
    join(evDir, `${slug}.html`),
    chrome({
      title: `${e.title} — Evenemang i ${SITE.kommun}`,
      description: desc,
      canonical,
      ogImage,
      jsonLd,
      body,
      current: "evenemang",
    }),
    "utf8"
  );
  eventUrls.push({ loc: canonical, priority: "0.7" });
}

const guideDir = join(root, "public/guide");
if (existsSync(guideDir)) rmSync(guideDir, { recursive: true });
mkdirSync(guideDir, { recursive: true });
const guideUrls = [];

for (const g of guides) {
  const path = `/guide/${g.slug}.html`;
  const canonical = `${base}${path}`;
  const ogImage = absImg(g.heroImg);
  const desc = (g.intro || g.lead || g.title).slice(0, 160);
  const stopList = g.stops
    .map((s) => {
      const place = places.find((p) => p.name === s.place);
      const href = place ? `/plats/${placeSlug(place.name)}.html` : "/";
      return `    <li>
      <h3><a href="${esc(href)}">${esc(s.place)}</a></h3>
      <p>${esc(s.text)}</p>
    </li>`;
    })
    .join("\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: desc,
    image: ogImage,
    url: canonical,
    inLanguage: "sv-SE",
    about: { "@type": "Place", name: SITE.kommun },
    isPartOf: { "@type": "WebSite", name: SITE.name, url: `${base}/` },
  };

  const body = `
    <img class="seo-hero-img" src="${esc(g.heroImg)}" alt="${esc(g.title)}" width="1200" height="675" loading="eager">
    <p class="seo-meta"><span>${esc(seasonLabel(g.season))}</span><span>Guide</span><span>${esc(SITE.kommun)}</span></p>
    <h1>${esc(g.title)}</h1>
    <p class="lede">${esc(g.lead || g.intro)}</p>
    ${g.intro && g.lead && g.intro !== g.lead ? `<p>${esc(g.intro)}</p>` : ""}
    <h2>Stoppen</h2>
    <ol class="seo-guide-stops">
${stopList}
    </ol>
    ${g.outro ? `<p>${esc(g.outro)}</p>` : ""}
    ${g.signature ? `<p><em>${esc(g.signature)}</em></p>` : ""}
    <div class="seo-actions">
      <a href="/">Öppna i guiden</a>
      <a href="/evenemang.html">Evenemang</a>
    </div>
    <p class="seo-cta" style="margin-top:36px"><a href="/">← Alla ställen i ${esc(SITE.kommun)}</a></p>
  `;

  writeFileSync(
    join(guideDir, `${g.slug}.html`),
    chrome({
      title: `${g.title} — ${SITE.name}`,
      description: desc,
      canonical,
      ogImage,
      jsonLd,
      body,
      current: "start",
    }),
    "utf8"
  );
  guideUrls.push({ loc: canonical, priority: "0.75" });
}

const urls = [
  { loc: `${base}/`, priority: "1.0", changefreq: "daily" },
  { loc: `${base}/evenemang.html`, priority: "0.9", changefreq: "weekly" },
  { loc: `${base}/om.html`, priority: "0.6", changefreq: "monthly" },
  { loc: `${base}/integritet.html`, priority: "0.3", changefreq: "yearly" },
  ...placeUrls.map((u) => ({ ...u, changefreq: "weekly" })),
  ...eventUrls.map((u) => ({ ...u, changefreq: "weekly" })),
  ...guideUrls.map((u) => ({ ...u, changefreq: "monthly" })),
];

writeFileSync(
  join(root, "public/sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`,
  "utf8"
);

/** Keep Vite entry evenemang.html in sync with events.js (no hand-maintained drift). */
const evListJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `Evenemang i ${SITE.kommun}`,
  url: `${base}/evenemang.html`,
  isPartOf: { "@type": "WebSite", name: SITE.name, url: `${base}/` },
};
const evArticles = events
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((e) => {
    const slug = eventSlug(e);
    return `    <article class="ev-seo">
      <time datetime="${esc(e.date)}">${esc(e.when)}</time>
      <span class="cat">${esc(e.cat)}</span>
      <h2><a href="/evenemang/${slug}.html">${esc(e.title)}</a></h2>
      <p class="host">${esc(e.host)}${e.time ? ` · ${esc(e.time)}` : ""}</p>
      <p>${esc(e.note)}</p>
    </article>`;
  })
  .join("\n");

writeFileSync(
  join(root, "evenemang.html"),
  `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Evenemang i ${esc(SITE.kommun)} 2026 — ${esc(SITE.name)}</title>
  <meta name="description" content="Marknader, matdagar, kultur och julmarknader i ${esc(SITE.kommun)}. Handplockad evenemangskalender för bygden.">
  <link rel="canonical" href="${base}/evenemang.html">
  <meta property="og:title" content="Evenemang i ${esc(SITE.kommun)} 2026">
  <meta property="og:description" content="Marknader, matdagar och kultur i ${esc(SITE.kommun)} — handplockad kalender.">
  <meta property="og:url" content="${base}/evenemang.html">
  <meta property="og:image" content="${base}${SITE.defaultOgImage}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="sv_SE">
  <meta name="theme-color" content="#37472f">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Vallentuna">
  <link rel="icon" href="/assets/shared/logo.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/src/styles/main.css">
  <link rel="stylesheet" href="/src/styles/seo-pages.css">
  <script type="application/ld+json">${JSON.stringify(evListJsonLd)}</script>
  <script src="/pwa-boot.js" defer></script>
  ${umamiScript}
</head>
<body class="seo-page">
  <header class="seo-top">
    <a class="seo-brand" href="/">${esc(SITE.name)}</a>
    <nav aria-label="Sekundär">
      <a href="/">Startsida</a>
      <a href="/evenemang.html" aria-current="page">Evenemang</a>
      <a href="/om.html">Om Upptäck Vallentuna</a>
      <a href="/integritet.html">Integritet</a>
    </nav>
  </header>
  <main class="seo-main">
    <h1>Evenemang i ${esc(SITE.kommun)}</h1>
    <p class="lede">Handplockade marknader, matdagar och kultur i bygden. Uppgifter är hämtade från arrangörerna — kolla alltid källan närmare datum.</p>
    <div class="ev-seo-list">
${evArticles}
    </div>
    <p class="seo-cta"><a href="/#hander">Öppna den interaktiva kalendern →</a> · <a href="/#skicka">Tipsa om ett event</a></p>
  </main>
  <footer class="seo-foot">
    <a href="/">Startsida</a>
    <span>·</span>
    <a href="/om.html">Om Upptäck Vallentuna</a>
    <span>·</span>
    <a href="/integritet.html">Integritet</a>
    <span>·</span>
    <a href="mailto:${esc(SITE.contactEmail)}">Tips</a>
  </footer>
  <p class="built-by"><a href="https://www.fvno.se/" target="_blank" rel="noopener">Byggd av Formverket Norrort</a></p>
</body>
</html>
`,
  "utf8"
);

/** Inject crawlable place links into index.html (noscript — SPA JS never touches this). */
const indexPath = join(root, "index.html");
const placeListItems = places
  .map((p) => `      <li><a href="/plats/${placeSlug(p.name)}.html">${esc(p.name)}</a></li>`)
  .join("\n");
const guideListItems = guides
  .map((g) => `      <li><a href="/guide/${g.slug}.html">${esc(g.title)}</a></li>`)
  .join("\n");
const seoPlacesBlock = `<!--seo-places-->
<noscript>
  <nav class="seo-crawl-places" aria-label="Alla platser i ${esc(SITE.kommun)}">
    <h2>Platser i guiden</h2>
    <ul>
${placeListItems}
    </ul>
    <h2>Guider</h2>
    <ul>
${guideListItems}
    </ul>
  </nav>
</noscript>
<!--/seo-places-->`;

let indexHtml = readFileSync(indexPath, "utf8");
if (!/<!--seo-places-->[\s\S]*?<!--\/seo-places-->/.test(indexHtml)) {
  throw new Error("index.html saknar <!--seo-places-->…<!--/seo-places-->-markörer");
}
indexHtml = indexHtml.replace(/<!--seo-places-->[\s\S]*?<!--\/seo-places-->/, seoPlacesBlock);
writeFileSync(indexPath, indexHtml, "utf8");

console.log(
  `SEO generate: ${places.length} plats-sidor, ${events.length} event-sidor, ${guides.length} guide-sidor, index.html platslista, evenemang.html synkad, sitemap ${urls.length} URL:er`
);
