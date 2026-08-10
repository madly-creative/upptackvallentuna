/**
 * Weekly "Veckans Visste du att" rotation.
 * Week index is counted from a fixed epoch (not ISO week numbers).
 * Pure helpers — pass the facts list in (keeps Vite + Node import paths clean).
 */

/** First Monday after launch — rotation epoch (Europe/Stockholm calendar date). */
export const FACTS_EPOCH = "2026-08-11";

/** Parse YYYY-MM-DD as UTC midnight for stable day-diff math. */
export function parseISODateUTC(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return NaN;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Week index from epoch: floor((today − start) / 7 days).
 * Dates before epoch yield negative indices (caller may clamp).
 */
export function weekIndex(todayISO, epochISO = FACTS_EPOCH) {
  const today = parseISODateUTC(todayISO);
  const epoch = parseISODateUTC(epochISO);
  if (!Number.isFinite(today) || !Number.isFinite(epoch)) return 0;
  const diffMs = today - epoch;
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
}

/** Positive modulo for wrapping the fact list. */
export function factIndexForWeek(weekIdx, length) {
  const n = Math.max(1, Number(length) || 1);
  const i = Number(weekIdx) || 0;
  return ((i % n) + n) % n;
}

export function factSlug(fact) {
  const base = String(fact?.title || fact?.id || "fakta")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `fakta-${fact?.id ?? 0}`;
}

export function isSagen(fact) {
  return fact?.type === "sägen" || fact?.verified === false;
}

export function currentFact(todayISO, list) {
  if (!list?.length) return null;
  // Before epoch, stay on the first fact (avoid wrapping into the sägen-tail).
  const idx = factIndexForWeek(Math.max(0, weekIndex(todayISO)), list.length);
  return list[idx] || null;
}

export function factBySlug(slug, list) {
  if (!list?.length) return null;
  return list.find((f) => factSlug(f) === slug) || null;
}
