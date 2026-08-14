/**
 * Shared helpers for global search (places + events + recurring + producers).
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

/** Haystack for address-free producers (verksamheter). */
export function producerSearchHay(pr) {
  const sold = (pr?.soldAt || [])
    .map((s) => [s?.label, s?.name, s?.placeSlug].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" ");
  return [
    pr?.name,
    pr?.cat,
    pr?.blurb,
    pr?.short,
    pr?.slug,
    sold,
    "producent",
    "verksamhet",
    "mathantverk",
  ]
    .filter(Boolean)
    .join(" ");
}
