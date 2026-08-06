/**
 * Verksamheter utan egen besöksadress (eller med koppling till andras platser).
 * — Aldrig lat/lng/address här.
 * — soldAt: { placeSlug } (länkas) eller { name } (visas utan länk).
 */
export const producers = [
  {
    slug: "markims-honung",
    name: "Markims honung",
    cat: "Lokalt hantverk",
    blurb:
      "Småskalig biodling i Markim — honung skördad och tappad hemma, såld hos gårdsbutiker i bygden. Ingen egen butik att besöka; hitta burkarna där du redan handlar lokalt.",
    short: "Honung från Markim — finns hos gårdsbutikerna.",
    img: "/assets/upplev/markims-bergby/cover.webp",
    url: "",
    soldAt: [
      { placeSlug: "markims-bergby" },
      { placeSlug: "tarby-gardsbutik" },
      { name: "Säsongens marknader i Brottby" },
    ],
  },
  {
    slug: "soderbydal-keramik",
    name: "Söderbydal keramik",
    cat: "Hantverk",
    blurb:
      "Drejat och glaserat i hemstudion i Söderbydal. Skålar, muggar och fat — säljs via utvalda hyllor i centrum, inte via öppet hus hos keramikern.",
    short: "Hemmagjord keramik som finns i centrum.",
    img: "/assets/upplev/vallboden/cover.webp",
    url: "",
    soldAt: [{ placeSlug: "vallboden" }, { name: "Tillfälliga pop-ups i Tuna Torg" }],
  },
];

export function producerSlug(p) {
  return p.slug || String(p.name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function producerBySlug(slug, list = producers) {
  return list.find((p) => producerSlug(p) === slug) || null;
}

/** Producers that list this place slug in soldAt. */
export function producersAtPlaceSlug(placeSlug, list = producers) {
  if (!placeSlug) return [];
  return list.filter((p) =>
    (p.soldAt || []).some((s) => s && s.placeSlug === placeSlug)
  );
}
