/**
 * "Sen sist du var här" — delta since last visit (localStorage).
 *
 * Launch migration: missing `uv_last_visit` always bootstraps to *now* and
 * never shows a section — including known returning visitors who already have
 * other keys (favs, last place, lists, …). Seeded historical `addedDate` values
 * must not produce a one-shot false "12 nya ställen" dump on feature go-live.
 * Never fall back to `vii_last_place_v1.at` (or any other timestamp) for comparison.
 */

import { stockholmTodayISO } from "../data/stockholm.js";

export const LS_LAST_VISIT = "uv_last_visit";

/** Keys that mean the visitor used the site before this feature existed. */
export const KNOWN_VISITOR_KEYS = [
  "vii_favs_v1",
  "vii_last_place_v1",
  "vii_interest_v1",
  "vii_geo_asked_v1",
  "uv_lists_v1",
  "uv_notify_seen_v1",
  "uv_pending_events_v1",
  "uv_reports_v1",
  "uv_pwa_visits",
];

export function isKnownVisitor(storage) {
  if (!storage) return false;
  try {
    for (const k of KNOWN_VISITOR_KEYS) {
      if (storage.getItem(k) != null) return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * @returns {{ mode: 'bootstrap' | 'compare', lastVisitISO?: string, knownVisitor?: boolean }}
 */
export function resolveVisitState(storage, _now = new Date()) {
  if (!storage) return { mode: "bootstrap", knownVisitor: false };
  let raw;
  try {
    raw = storage.getItem(LS_LAST_VISIT);
  } catch {
    return { mode: "bootstrap", knownVisitor: false };
  }
  if (raw == null || raw === "") {
    // First-time visitors AND known users missing the new field: same path.
    return { mode: "bootstrap", knownVisitor: isKnownVisitor(storage) };
  }
  const t = Date.parse(raw);
  if (Number.isNaN(t)) {
    return { mode: "bootstrap", knownVisitor: isKnownVisitor(storage) };
  }
  return { mode: "compare", lastVisitISO: raw };
}

export function writeLastVisit(storage, now = new Date()) {
  if (!storage) return false;
  try {
    storage.setItem(LS_LAST_VISIT, now.toISOString());
    return true;
  } catch {
    return false;
  }
}

/**
 * True when editorial addedDate (YYYY-MM-DD) is on a Stockholm calendar day
 * strictly after the day of lastVisit. Same-day listings do not reappear.
 */
export function isAfterLastVisit(addedDate, lastVisitISO) {
  if (!addedDate || !lastVisitISO) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(addedDate)) return false;
  const t = Date.parse(lastVisitISO);
  if (Number.isNaN(t)) return false;
  const visitDay = stockholmTodayISO(new Date(t));
  return addedDate > visitDay;
}

/**
 * @returns {{ places: Array<{kind:'place', name:string, addedDate:string}>, events: Array<{kind:'event', title:string, date:string, addedDate:string, host?:string}> }}
 */
export function collectSinceLastDelta({ places = [], placeMeta = {}, events = [], lastVisitISO }) {
  const placeHits = [];
  for (const p of places) {
    const d = placeMeta[p.name]?.addedDate;
    if (isAfterLastVisit(d, lastVisitISO)) {
      placeHits.push({ kind: "place", name: p.name, addedDate: d });
    }
  }
  const eventHits = [];
  for (const e of events) {
    if (isAfterLastVisit(e.addedDate, lastVisitISO)) {
      eventHits.push({
        kind: "event",
        title: e.title,
        date: e.date,
        addedDate: e.addedDate,
        host: e.host,
      });
    }
  }
  placeHits.sort((a, b) => b.addedDate.localeCompare(a.addedDate) || a.name.localeCompare(b.name, "sv"));
  eventHits.sort(
    (a, b) =>
      b.addedDate.localeCompare(a.addedDate) ||
      b.date.localeCompare(a.date) ||
      a.title.localeCompare(b.title, "sv")
  );
  return { places: placeHits, events: eventHits };
}

export function deltaIsEmpty(delta) {
  return !delta?.places?.length && !delta?.events?.length;
}

export function placeGroupLabel(n) {
  return n === 1 ? "1 nytt ställe" : `${n} nya ställen`;
}

export function eventGroupLabel(n) {
  return n === 1 ? "1 nytt evenemang" : `${n} nya evenemang`;
}
