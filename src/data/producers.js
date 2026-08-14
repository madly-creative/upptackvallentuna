/**
 * Verksamheter utan egen besöksadress (eller med koppling till andras platser).
 * — Aldrig lat/lng/address här.
 * — soldAt: { placeSlug } (länkas) eller { name } (visas utan länk).
 * — label (optional) on placeSlug entries overrides the place name in the UI.
 */
export const producers = [
  {
    slug: "mosters-goda",
    name: "Mosters Goda",
    cat: "Mathantverk",
    blurb:
      "Anna Oliw skapar marmelader, mjölksyrade och picklade grönsaker samt saft i sitt kök i Vallentuna — lokala råvaror, hantverksmässiga metoder. Ingen egen butik att besöka; produkterna finns hos återförsäljare i bygden, på marknader och via förbeställning.",
    short:
      "Sylt, surkål och saft från Mosters kök — finns hos Hökeriet, Langhard och Café Valkyria.",
    img: "/assets/verksamhet/mosters-goda/cover.webp",
    gallery: [
      {
        url: "/assets/verksamhet/mosters-goda/sommarsylt.webp",
        alt: "Sommarsylt rabarber & jordgubbar från Mosters Goda",
      },
      {
        url: "/assets/verksamhet/mosters-goda/flader-citron.webp",
        alt: "Fläder-citron saft från Mosters Goda",
      },
      {
        url: "/assets/verksamhet/mosters-goda/cover.webp",
        alt: "Enbär från bygden — lokala råvaror",
      },
    ],
    url: "https://www.mostersgoda.se/",
    email: "kontakt@mostersgoda.se",
    phone: "073-776 73 96",
    soldAt: [
      { placeSlug: "orkesta-granby-gard", label: "Hökeriet (Orkesta Granby Gård)" },
      { placeSlug: "langhard-lantbruk" },
      { placeSlug: "cafe-valkyria" },
      { name: "Marknader i bygden" },
    ],
  },
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
  {
    slug: "surgubbens-hantverksbageri",
    name: "Surgubbens Hantverksbageri",
    cat: "Hemmabageri",
    blurb:
      "Anders Borgmark bakar stenugnsbakat surdegsbröd på ekologiskt kulturspannmål i Brottby — bara mjöl, vatten, surdeg och salt. Beställ senast torsdag lunch; uthämtning lördagar. Ingen öppen butik utan beställning.",
    short: "Surdegsbröd från Brottby — beställ och hämta på lördag.",
    img: "/assets/verksamhet/surgubbens-hantverksbageri/cover.webp",
    gallery: [
      {
        url: "/assets/verksamhet/surgubbens-hantverksbageri/cover.webp",
        alt: "Surdegsfrallor från Surgubbens Hantverksbageri",
      },
      {
        url: "/assets/verksamhet/surgubbens-hantverksbageri/brod.webp",
        alt: "Samling surdegsbröd från Surgubben",
      },
    ],
    url: "https://surgubbensbageri.se/",
    soldAt: [
      { name: "Uthämtning Spånlöt 18, Brottby (lör 8–11 efter beställning)" },
    ],
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
