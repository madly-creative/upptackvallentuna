/**
 * "Nära dig" — filter nearby places by walking distance from the visitor.
 * Position stays in-memory only; this module never touches storage or analytics.
 */

export const WALK_KMH = 5;
export const NEAR_WALK_MINUTES = 10;
/** ≈ 0.833 km — 10 min walk @ 5 km/h */
export const NEAR_RADIUS_KM = (NEAR_WALK_MINUTES / 60) * WALK_KMH;

export const NEAR_PIN_COLORS = {
  fika: "#a85a3a",
  natur: "#3d4f3a",
  butik: "#2a3228",
  gard: "#c4a882",
  loppis: "#c4a882",
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

/** @returns {string[]|null} null = all types */
export function nearFilterTypes(filterKey) {
  if (filterKey === "mer") return ["gard", "loppis"];
  if (filterKey === "fika" || filterKey === "natur" || filterKey === "butik") {
    return [filterKey];
  }
  return null;
}

/**
 * @param {Array<{lat:number,lng:number,type:string}>} places
 * @param {{lat:number,lng:number}} origin
 * @param {(a:number,b:number,c:number,d:number)=>number} haversineKm
 * @param {{filterKey?:string, openNowOnly?:boolean, isOpenFn?:(p:any)=>boolean}} [opts]
 */
export function filterPlacesNear(places, origin, haversineKm, opts = {}) {
  const filterKey = opts.filterKey || "alla";
  const openNowOnly = !!opts.openNowOnly;
  const isOpenFn = opts.isOpenFn || (() => true);
  const types = nearFilterTypes(filterKey);
  const radius = NEAR_RADIUS_KM;

  return places
    .map((p) => {
      const km = haversineKm(origin.lat, origin.lng, p.lat, p.lng);
      return { place: p, km, walkMin: walkMinutesFromKm(km) };
    })
    .filter(({ place, km }) => {
      if (km > radius) return false;
      if (types && !types.includes(place.type)) return false;
      if (openNowOnly && !isOpenFn(place)) return false;
      return true;
    })
    .sort((a, b) => a.km - b.km);
}

export function summarizeNearGroups(hits) {
  const places = hits.map((h) => h.place);
  return NEAR_SUMMARY_GROUPS.map((g) => ({
    ...g,
    count: places.filter((p) => g.types.includes(p.type)).length,
  })).filter((g) => g.count > 0);
}
