/**
 * Weekly facts catalog — JSON is the source of truth; helpers live in factsWeek.js.
 * Vite resolves the JSON import for the SPA; Node SEO uses the same module via Vitest/Vite
 * or reads facts.json with readFileSync in generate-seo when needed.
 */
import factsJson from "./facts.json";
import {
  FACTS_EPOCH,
  weekIndex,
  factIndexForWeek,
  factSlug,
  isSagen,
  currentFact as currentFactOf,
  factBySlug as factBySlugOf,
} from "../lib/factsWeek.js";

export const facts = factsJson;
export { FACTS_EPOCH, weekIndex, factIndexForWeek, factSlug, isSagen };

export function currentFact(todayISO, list = facts) {
  return currentFactOf(todayISO, list);
}

export function factBySlug(slug, list = facts) {
  return factBySlugOf(slug, list);
}
