/**
 * "Nära dig" / Utforska — filter places by category; optional distance sort when origin set.
 * Position stays in-memory only; this module never touches storage or analytics.
 */

export const WALK_KMH = 5;

export const NEAR_PIN_COLORS = {
  fika: "#a85a3a",
  natur: "#3d4f3a",
  butik: "#2a3228",
  gard: "#c4a882",
  loppis: "#c4a882",
};

/** Inline SVG glyphs for map pins (white on colored circle). */
export const NEAR_PIN_ICONS = {
  fika: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#fff" d="M7 2v9a2 2 0 0 0 2 2v9h2V13a2 2 0 0 0 2-2V2h-2v7h-2V2H7zm10 0c-1.1 0-2 .9-2 2v5c0 1.66 1.34 3 3 3v10h2V2h-3zm0 8c-.55 0-1-.45-1-1V5h1v5z"/></svg>`,
  natur: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#fff" d="M12 2L6.5 10h3.2L6 16h3.5v6h5v-6H18l-3.7-6h3.2L12 2z"/></svg>`,
  butik: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#fff" d="M6 8V6a6 6 0 1 1 12 0v2h2v14H4V8h2zm2 0h8V6a4 4 0 1 0-8 0v2z"/></svg>`,
  gard: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#fff" d="M12 2.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17.4l.9-5.4-3.9-3.8 5.4-.8L12 2.5z"/></svg>`,
  loppis: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#fff" d="M12 2.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8 7.2 17.4l.9-5.4-3.9-3.8 5.4-.8L12 2.5z"/></svg>`,
};

/** Category chips (Öppet nu is a separate additive toggle). */
export const NEAR_FILTERS = [
  { key: "alla", label: "Allt" },
  { key: "fika", label: "Fika & mat" },
  { key: "natur", label: "Natur" },
  { key: "butik", label: "Butiker" },
  { key: "mer", label: "Mer" },
];

/** Summary rows in the floating panel (counts only). */
export const NEAR_SUMMARY_GROUPS = [
  { key: "fika", label: "Fika & mat", types: ["fika"], color: NEAR_PIN_COLORS.fika },
  { key: "natur", label: "Natur & bad", types: ["natur"], color: NEAR_PIN_COLORS.natur },
  { key: "butik", label: "Butiker", types: ["butik"], color: NEAR_PIN_COLORS.butik },
  { key: "mer", label: "Mer", types: ["gard", "loppis"], color: NEAR_PIN_COLORS.loppis },
];

export function walkMinutesFromKm(km) {
  if (km == null || Number.isNaN(km)) return null;
  return Math.max(1, Math.round((km / WALK_KMH) * 60));
}

export function pinColorForType(type) {
  return NEAR_PIN_COLORS[type] || NEAR_PIN_COLORS.butik;
}

export function pinIconSvgForType(type) {
  return NEAR_PIN_ICONS[type] || NEAR_PIN_ICONS.butik;
}

/** @returns {string[]|null} null = all types */
export function nearFilterTypes(filterKey) {
  if (filterKey === "mer") return ["gard", "loppis"];
  if (filterKey === "fika" || filterKey === "natur" || filterKey === "butik") {
    return [filterKey];
  }
  return null;
}

/**
 * Filter catalog places. With origin, sorts nearest-first (no hard radius cut-off).
 * @param {Array<{lat:number,lng:number,type:string}>} places
 * @param {{lat:number,lng:number}|null} origin
 * @param {(a:number,b:number,c:number,d:number)=>number} haversineKm
 * @param {{filterKey?:string, openNowOnly?:boolean, isOpenFn?:(p:any)=>boolean}} [opts]
 */
export function filterPlacesNear(places, origin, haversineKm, opts = {}) {
  const filterKey = opts.filterKey || "alla";
  const openNowOnly = !!opts.openNowOnly;
  const isOpenFn = opts.isOpenFn || (() => true);
  const types = nearFilterTypes(filterKey);

  return places
    .map((p) => {
      const km = origin
        ? haversineKm(origin.lat, origin.lng, p.lat, p.lng)
        : null;
      return {
        place: p,
        km,
        walkMin: km == null ? null : walkMinutesFromKm(km),
      };
    })
    .filter(({ place }) => {
      if (types && !types.includes(place.type)) return false;
      if (openNowOnly && !isOpenFn(place)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.km == null && b.km == null) return a.place.name.localeCompare(b.place.name, "sv");
      if (a.km == null) return 1;
      if (b.km == null) return -1;
      return a.km - b.km;
    });
}

export function summarizeNearGroups(hits) {
  const places = hits.map((h) => h.place);
  return NEAR_SUMMARY_GROUPS.map((g) => ({
    ...g,
    count: places.filter((p) => g.types.includes(p.type)).length,
  })).filter((g) => g.count > 0);
}
