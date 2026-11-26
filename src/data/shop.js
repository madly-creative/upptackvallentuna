/**
 * Butiken — en enda källa för motiv, produkter och priser.
 * Används av både butikssidan (butik.html) och Netlify-funktionerna (checkout, stripe-webhook),
 * så ett pris som ändras här gäller överallt. Priser i hela kronor inkl. moms.
 *
 * ÄNDRA PRIS: byt siffran i `price` nedan, committa, klart.
 */

export const SHOP = {
  currency: "sek",
  /** Länder vi skickar till (ISO 3166-1 alpha-2). Gelato trycker lokalt i Norden. */
  shipTo: ["SE", "NO", "DK", "FI"],
  /** Frakt per order: högsta fraktklassen i varukorgen gäller. Fri frakt över gränsen. */
  shipping: {
    small: { label: "Frakt, brev", price: 29 },
    standard: { label: "Frakt", price: 79 },
    freeOver: 999,
  },
  /** Sista beställningsdag för leverans före jul (visas på sidan; tom sträng = dölj). */
  christmasDeadline: "2026-12-14",
};

/** Produkter. Gelato-koppling och tryckfiler ligger i src/data/shopPrint.js (bara på servern). */
export const PRODUCTS = {
  poster: {
    name: "Poster 50×70 cm",
    short: "Matt 200 g papper, utan ram",
    price: 449,
    shipping: "standard",
  },
  "poster-ram-svart": {
    name: "Poster 50×70 cm med ram, svart",
    short: "Träram i svart, plexiglas, klar att hänga",
    price: 949,
    shipping: "standard",
    frame: "svart",
  },
  "poster-ram-vit": {
    name: "Poster 50×70 cm med ram, vit",
    short: "Träram i vitt, plexiglas, klar att hänga",
    price: 949,
    shipping: "standard",
    frame: "vit",
  },
  "poster-ram-ek": {
    name: "Poster 50×70 cm med ram, ek",
    short: "Träram i naturligt trä, plexiglas, klar att hänga",
    price: 949,
    shipping: "standard",
    frame: "ek",
  },
  vykort: {
    name: "Vykort A6, 4-pack",
    short: "Fyra kort av samma motiv, 350 g",
    price: 89,
    shipping: "small",
    packOf: 4,
  },
};

/** Motiv i den ordning de visas. `products` = vilka produkter motivet säljs som. */
export const MOTIFS = [
  {
    slug: "vallentuna-kollage",
    title: "Vallentuna",
    kicker: "Bygden i en bild",
    text:
      "Kyrkan, Väsby kvarn, herrgården, ruinen och Roslagsbanan som rullar förbi runstenarna vid sjön. Allt det som gör Vallentuna till Vallentuna, samlat på ett ark.",
    place: { label: "Upptäck runstenarna vid sjön", href: "/plats/risbyle-runstenar.html" },
    products: ["poster", "poster-ram-svart", "poster-ram-vit", "poster-ram-ek", "vykort"],
  },
  {
    slug: "vasby-kvarn",
    title: "Väsby kvarn",
    kicker: "Den röda holländaren",
    text:
      "Den röda holländaren vid Kvarnbadet är byns landmärke, och på sommarlördagar står dörren öppen. Här i vinterskrud, när snön lagt sig över backen.",
    place: { label: "Kvarnen står vid Kvarnbadet", href: "/plats/kvarnbadet.html" },
    products: ["poster", "poster-ram-svart", "poster-ram-vit", "poster-ram-ek", "vykort"],
  },
  {
    slug: "vallentuna-kyrka",
    title: "Vallentuna kyrka",
    kicker: "Medeltid mitt i byn",
    text:
      "Medeltidskyrkan mitt i byn, med runinskrifter i torn och mur. En sommardag vid stenmuren, på väg upp mot kyrkporten.",
    place: { label: "Läs om Vallentuna kyrka", href: "/plats/vallentuna-kyrka.html" },
    products: ["poster", "poster-ram-svart", "poster-ram-vit", "poster-ram-ek", "vykort"],
  },
  {
    slug: "vallentuna-karta",
    title: "Kartan",
    kicker: "Från Kårsta till Vallentunasjön",
    text:
      "En handritad karta över kommunen med Arkils tingstad, Össeby kyrkoruin, Lindö säteri och Roslagsbanan på väg mot Kårsta. Kartunderlag från OpenStreetMap.",
    place: { label: "Besök Arkils tingstad", href: "/plats/arkils-tingstad.html" },
    products: ["poster", "poster-ram-svart", "poster-ram-vit", "poster-ram-ek", "vykort"],
  },
];

/** Bildvägar för webben (genererade, se scripts/shop-images.py i PR-beskrivningen). */
export function motifImages(slug) {
  return {
    small: `/assets/butik/${slug}-720.webp`,
    large: `/assets/butik/${slug}-1400.webp`,
    framed: (frame) => `/assets/butik/${slug}-ram-${frame}.webp`,
  };
}

/** Validerar en varukorgsrad och returnerar motiv + produkt, eller null. */
export function resolveLine(line) {
  if (!line || typeof line !== "object") return null;
  const motif = MOTIFS.find((m) => m.slug === line.motif);
  const product = PRODUCTS[line.product];
  const qty = Number(line.qty);
  if (!motif || !product || !motif.products.includes(line.product)) return null;
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) return null;
  return { motif, product, productKey: line.product, qty };
}

/** Frakt för en lista av validerade rader (se resolveLine). */
export function shippingFor(lines) {
  if (!lines.length) return null;
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const cls = lines.some((l) => l.product.shipping === "standard") ? "standard" : "small";
  const opt = SHOP.shipping[cls];
  if (SHOP.shipping.freeOver && subtotal >= SHOP.shipping.freeOver) return { label: "Fri frakt", price: 0, subtotal };
  return { label: opt.label, price: opt.price, subtotal };
}
