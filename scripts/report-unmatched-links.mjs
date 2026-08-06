/**
 * Resolve guide stops + event hosts against place slugs; print warnings.
 * Returns { guides: [...], events: [...] } unmatched rows.
 */
import { pathToFileURL } from "node:url";
import { places, resolvePlaceRef } from "../src/data/places.js";
import { events } from "../src/data/events.js";
import { guides } from "../src/data/guides.js";

export function collectUnmatchedLinks() {
  const guideMiss = [];
  for (const g of guides) {
    for (const stop of g.stops || []) {
      const ref = stop.place;
      if (!resolvePlaceRef(ref, places)) {
        guideMiss.push({ guide: g.slug, place: ref });
      }
    }
  }
  const eventMiss = [];
  for (const e of events) {
    if (!resolvePlaceRef(e.host, places)) {
      eventMiss.push({ title: e.title, date: e.date, host: e.host });
    }
  }
  return { guides: guideMiss, events: eventMiss };
}

export function printUnmatchedLinks(unmatched = collectUnmatchedLinks()) {
  console.log("\n=== Unmatched place links (name/slug → no place) ===");
  if (!unmatched.guides.length && !unmatched.events.length) {
    console.log("(none)");
    return unmatched;
  }
  if (unmatched.guides.length) {
    console.log(`\nGuides (${unmatched.guides.length}):`);
    for (const row of unmatched.guides) {
      console.warn(`  WARN guide "${row.guide}" stop place="${row.place}"`);
    }
  }
  if (unmatched.events.length) {
    console.log(`\nEvents (${unmatched.events.length}):`);
    for (const row of unmatched.events) {
      console.warn(`  WARN event "${row.title}" (${row.date}) host="${row.host}"`);
    }
  }
  console.log("");
  return unmatched;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) printUnmatchedLinks();
