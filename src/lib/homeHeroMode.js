/**
 * Homepage hero layout experiment.
 *
 * Modes:
 * - "events"  — event-first hero + discover/search below (default while we evaluate)
 * - "classic" — original rotating landscape + search + weather card
 *
 * How to switch (survives merge):
 * 1. URL:  ?hero=classic  or  ?hero=events  (also saved to localStorage)
 * 2. localStorage key "uv-home-hero" = "classic" | "events"
 * 3. Change HOME_HERO_DEFAULT below to flip the site-wide default
 */
export const HOME_HERO_STORAGE_KEY = "uv-home-hero";
export const HOME_HERO_DEFAULT = "events";

export function resolveHomeHeroMode({
  search = typeof location !== "undefined" ? location.search : "",
  storage = typeof localStorage !== "undefined" ? localStorage : null,
  persistUrl = true,
} = {}) {
  const raw = String(search || "");
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  const fromUrl = params.get("hero");
  if (fromUrl === "classic" || fromUrl === "events") {
    if (persistUrl && storage) {
      try {
        storage.setItem(HOME_HERO_STORAGE_KEY, fromUrl);
      } catch {
        /* ignore quota / private mode */
      }
    }
    return fromUrl;
  }
  if (storage) {
    try {
      const saved = storage.getItem(HOME_HERO_STORAGE_KEY);
      if (saved === "classic" || saved === "events") return saved;
    } catch {
      /* ignore */
    }
  }
  return HOME_HERO_DEFAULT;
}
