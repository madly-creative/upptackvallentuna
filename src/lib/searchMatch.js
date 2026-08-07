/**
 * Shared helpers for global search (places + events + recurring).
 */

/** True when every whitespace-separated token in q appears in hay (case-insensitive). */
export function textMatchesQuery(hay, q) {
  const query = String(q || "")
    .trim()
    .toLowerCase();
  if (!query) return false;
  const h = String(hay || "").toLowerCase();
  return query.split(/\s+/).every((w) => h.includes(w));
}

export function eventSearchHay(e) {
  return [e?.title, e?.host, e?.note, e?.cat, e?.when, e?.time, e?.date]
    .filter(Boolean)
    .join(" ");
}

export function recurringSearchHay(r) {
  return [r?.title, r?.place, r?.host, r?.note, r?.whenLabel, "återkommande", "varje vecka"]
    .filter(Boolean)
    .join(" ");
}

export function placeSearchHay(p, extras = {}) {
  return [
    p?.name,
    p?.cat,
    p?.blurb,
    p?.short,
    p?.type,
    extras.district,
    extras.tags,
    extras.address,
  ]
    .filter(Boolean)
    .join(" ");
}
