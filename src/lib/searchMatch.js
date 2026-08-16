/**
 * Shared helpers for global search (places + events + recurring + producers).
 * Intent-aware: light Swedish stemming + synonym clusters so "bada" finds badplatser.
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

/** Strip common Swedish inflection endings (conservative). */
export function lightStemSv(word) {
  const w = String(word || "").toLowerCase();
  if (w.length < 4) return w;
  const suffixes = [
    "ningarna",
    "ningen",
    "ningar",
    "andet",
    "endes",
    "ande",
    "ende",
    "arna",
    "erna",
    "orna",
    "ades",
    "ade",
    "are",
    "ast",
    "ens",
    "ets",
    "en",
    "et",
    "ar",
    "er",
    "or",
    "na",
    "as",
    "a",
  ];
  for (const suf of suffixes) {
    if (w.length - suf.length >= 3 && w.endsWith(suf)) {
      return w.slice(0, -suf.length);
    }
  }
  return w;
}

/**
 * Synonym / near-meaning clusters for visitor intent.
 * Matching any member expands to the whole cluster (plus stems).
 */
export const SEARCH_SYNONYM_CLUSTERS = [
  [
    "bad",
    "bada",
    "badar",
    "bader",
    "badat",
    "badning",
    "badplats",
    "badplatser",
    "badet",
    "badsjö",
    "badvatten",
    "utomhusbad",
    "inomhusbad",
    "bassäng",
    "bassänger",
    "simma",
    "simning",
    "simhall",
    "strand",
    "brygga",
  ],
  [
    "fika",
    "fik",
    "fikar",
    "fikat",
    "café",
    "cafe",
    "kaffe",
    "bageri",
    "konditori",
    "bulle",
    "kanelbulle",
  ],
  ["äta", "mat", "lunch", "middag", "restaurang", "krog", "meny"],
  ["loppis", "loppmarknad", "secondhand", "second-hand", "återbruk", "fynda", "fynd"],
  ["hund", "hunden", "hundar", "hundvänlig", "hundrast"],
  ["barn", "barnen", "barnvänlig", "familj", "familjen", "lekplats"],
  ["natur", "skog", "friluft", "friluftsliv", "vandring", "promenad", "ute", "utomhus"],
  ["gård", "gårdsbutik", "lantbruk", "odling", "handelsträdgård"],
  ["evenemang", "event", "konsert", "marknad", "festival", "föreställning"],
  ["jazz", "musik", "konsert", "live"],
];

/**
 * Expand one query token into related forms (self + stem + synonym cluster).
 * @returns {string[]}
 */
export function expandSearchToken(token) {
  const t = normalizeQuery(token);
  if (!t) return [];
  const out = new Set();
  const add = (x) => {
    const v = normalizeQuery(x);
    if (v && v.length >= 2) out.add(v);
    const st = lightStemSv(v);
    if (st && st.length >= 2) out.add(st);
  };
  add(t);
  const stem = lightStemSv(t);
  for (const cluster of SEARCH_SYNONYM_CLUSTERS) {
    const hit = cluster.some((c) => {
      const cs = lightStemSv(c);
      return c === t || cs === stem || c.startsWith(t) || t.startsWith(c) || cs.startsWith(stem) || stem.startsWith(cs);
    });
    if (hit) cluster.forEach(add);
  }
  return [...out];
}

/** Each original token → list of acceptable alternate forms. */
export function expandQuery(q) {
  return queryTokens(q).map(expandSearchToken).filter((alts) => alts.length > 0);
}

function altHitsHayLoose(hayLower, alt) {
  if (!alt || alt.length < 2) return false;
  if (hayLower.includes(alt)) return true;
  // Compound-friendly: stemmed hay words containing alt (bad ⊂ kvarnbadet already covered by includes)
  return false;
}

function altHitsWordStrict(word, alt) {
  if (!alt || alt.length < 2 || !word) return false;
  if (word === alt || word.startsWith(alt)) return true;
  const ws = lightStemSv(word);
  const as = lightStemSv(alt);
  if (!ws || !as || as.length < 2) return false;
  // Same stem, or word-stem starts with query-stem ("bad" → "badplats").
  // Do NOT use as.startsWith(ws): "i".startsWith would false-hit "inomhusbad".
  return ws === as || (as.length >= 3 && ws.startsWith(as));
}

/**
 * Loose substring/synonym match — good for compound names ("bada"/"bad" → "Kvarnbadet").
 * Every original query token must match via at least one expanded form.
 */
export function textMatchesQuery(hay, q) {
  const groups = expandQuery(q);
  if (!groups.length) return false;
  const h = String(hay || "").toLowerCase();
  return groups.every((alts) => alts.some((a) => altHitsHayLoose(h, a)));
}

/**
 * Strict word/prefix/synonym match — avoids "bad" hitting mid-compound in long notes
 * unless a whole word equals/starts with an expanded form (e.g. "badplats").
 */
export function textMatchesQueryStrict(hay, q) {
  const groups = expandQuery(q);
  if (!groups.length) return false;
  const words = hayWords(hay);
  return groups.every((alts) =>
    words.some((w) => alts.some((a) => altHitsWordStrict(w, a)))
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
