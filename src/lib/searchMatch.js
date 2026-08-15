/**
 * Shared helpers for global search (places + events + recurring + producers).
 */

function normalizeQuery(q) {
  return String(q || "")
    .trim()
    .toLowerCase();
}

function queryTokens(q) {
  const query = normalizeQuery(q);
  if (!query) return [];
  return query.split(/\s+/).filter(Boolean);
}

function hayWords(hay) {
  return String(hay || "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * Loose substring match — good for compound names ("bad" → "Kvarnbadet").
 * Every whitespace-separated token in q must appear somewhere in hay.
 */
export function textMatchesQuery(hay, q) {
  const tokens = queryTokens(q);
  if (!tokens.length) return false;
  const h = String(hay || "").toLowerCase();
  return tokens.every((w) => h.includes(w));
}

/**
 * Strict word/prefix match — avoids "bad" hitting inside "Kvarnbadet" in long notes.
 * Each query token must equal a whole word or be a prefix of one.
 */
export function textMatchesQueryStrict(hay, q) {
  const tokens = queryTokens(q);
  if (!tokens.length) return false;
  const words = hayWords(hay);
  return tokens.every((token) =>
    words.some((w) => w === token || w.startsWith(token))
  );
}

/** Primary fields: loose. Secondary (notes/blurbs): strict only. */
export function matchesPrimaryOrSecondary(primary, secondary, q) {
  if (textMatchesQuery(primary, q)) return true;
  if (secondary && textMatchesQueryStrict(secondary, q)) return true;
  return false;
}

export function eventSearchPrimary(e) {
  return [e?.title, e?.host, e?.cat].filter(Boolean).join(" ");
}

export function eventSearchSecondary(e) {
  return [e?.note, e?.when, e?.time, e?.date].filter(Boolean).join(" ");
}

/** @deprecated prefer primary/secondary — kept for older call sites/tests */
export function eventSearchHay(e) {
  return [eventSearchPrimary(e), eventSearchSecondary(e)].filter(Boolean).join(" ");
}

export function recurringSearchPrimary(r) {
  return [r?.title, r?.place, r?.host, "återkommande", "varje vecka"]
    .filter(Boolean)
    .join(" ");
}

export function recurringSearchSecondary(r) {
  return [r?.note, r?.whenLabel].filter(Boolean).join(" ");
}

export function recurringSearchHay(r) {
  return [recurringSearchPrimary(r), recurringSearchSecondary(r)]
    .filter(Boolean)
    .join(" ");
}

export function placeSearchPrimary(p, extras = {}) {
  return [p?.name, p?.cat, p?.type, extras.district, extras.tags]
    .filter(Boolean)
    .join(" ");
}

export function placeSearchSecondary(p, extras = {}) {
  return [p?.blurb, p?.short, extras.address].filter(Boolean).join(" ");
}

export function placeSearchHay(p, extras = {}) {
  return [placeSearchPrimary(p, extras), placeSearchSecondary(p, extras)]
    .filter(Boolean)
    .join(" ");
}

export function producerSearchPrimary(pr) {
  const sold = (pr?.soldAt || [])
    .map((s) => [s?.label, s?.name, s?.placeSlug].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" ");
  return [
    pr?.name,
    pr?.cat,
    pr?.slug,
    sold,
    "producent",
    "verksamhet",
    "mathantverk",
  ]
    .filter(Boolean)
    .join(" ");
}

export function producerSearchSecondary(pr) {
  return [pr?.blurb, pr?.short].filter(Boolean).join(" ");
}

/** Haystack for address-free producers (verksamheter). */
export function producerSearchHay(pr) {
  return [producerSearchPrimary(pr), producerSearchSecondary(pr)]
    .filter(Boolean)
    .join(" ");
}
