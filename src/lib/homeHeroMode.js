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
 *
 * Preview date (does not persist):
 *   ?date=2026-10-17  — pretend "today" is that ISO date (hero + event filters)
 *
 * Carousel QA on sparse days:
 *   ?heroPad=3  — pad hero slides with next upcoming events (preview only)
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

/** Optional YYYY-MM-DD from ?date= for previewing another "today". */
export function resolvePreviewTodayISO({
  search = typeof location !== "undefined" ? location.search : "",
} = {}) {
  const raw = String(search || "");
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  const d = params.get("date");
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return null;
}

/** Optional heroPad=N from URL — pad carousel for visual QA. */
export function resolveHeroPad({
  search = typeof location !== "undefined" ? location.search : "",
} = {}) {
  const raw = String(search || "");
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  const n = Number(params.get("heroPad"));
  if (Number.isFinite(n) && n >= 2 && n <= 6) return Math.floor(n);
  return 0;
}

/**
 * Events that share the featured hero day (today if any, else the next event's date).
 * When `padTo` > list length (preview QA), pad with the next upcoming events
 * so a carousel can be reviewed even on sparse days.
 */
export function homeHeroCarouselEvents(liveList, todayISO, { padTo = 0 } = {}) {
  const live = [...(liveList || [])]
    .filter((e) => e?.date && e.date >= todayISO)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        String(a.time || "").localeCompare(String(b.time || ""))
    );
  if (!live.length) return [];
  const featuredDate = live.find((e) => e.date === todayISO)?.date || live[0].date;
  const sameDay = live.filter((e) => e.date === featuredDate);
  if (!padTo || sameDay.length >= padTo) return sameDay;
  const seen = new Set(sameDay.map((e) => `${e.title}|${e.date}`));
  const padded = [...sameDay];
  for (const e of live) {
    if (padded.length >= padTo) break;
    const k = `${e.title}|${e.date}`;
    if (seen.has(k)) continue;
    seen.add(k);
    // Preview pad: treat as same featured day so the hero carousel looks like a multi-event day.
    padded.push({ ...e, date: featuredDate });
  }
  return padded;
}
