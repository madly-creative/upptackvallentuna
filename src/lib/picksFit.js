/**
 * Weather-aware fit for Handplockat / ranking.
 * Keeps copy ("mysiga stopp under tak") honest when mood is rough.
 */

const BATH_RE = /\bbad(plats|sjö|et)?\b|utomhusbad|bassäng|beachvolley|sandstrand|brygga/i;
const OUTDOOR_CAT_RE = /\bbad\b|utomhus|natur\s*&/i;

/** Outdoor swim / beach — never "under tak". */
export function isOutdoorBathPlace(p) {
  if (!p) return false;
  const blob = [p.name, p.cat, p.short, p.blurb].filter(Boolean).join(" ");
  if (OUTDOOR_CAT_RE.test(p.cat || "") && BATH_RE.test(blob)) return true;
  if (BATH_RE.test(p.name || "")) return true;
  return false;
}

/**
 * True if the place is a sensible Handplockat tip for this weather mood.
 * @param {{ type?: string, cat?: string, name?: string, short?: string, blurb?: string }} p
 * @param {"nice"|"mild"|"rough"|string} mood
 * @param {{ hasTag?: (p: object, tag: string) => boolean }} [opts]
 */
export function placeFitsWeatherMood(p, mood, opts = {}) {
  if (!p) return false;
  const hasTag = opts.hasTag || (() => false);
  if (mood === "rough") {
    // Hard no: baths and open-air natur — contradicts "under tak"
    if (isOutdoorBathPlace(p)) return false;
    if (p.type === "natur") return false;
    // Prefer not to feature pure outdoor-only spots (ute without inomhus)
    if (hasTag(p, "ute") && !hasTag(p, "inomhus") && p.type === "loppis") {
      // Covered barns/loppises are often OK in light rain — keep eligible
      return true;
    }
    return true;
  }
  return true;
}

/** Filter a ranked list before Handplockat rotation. */
export function filterRankedForWeather(ranked, mood, opts = {}) {
  if (!ranked?.length) return [];
  const filtered = ranked.filter((x) => placeFitsWeatherMood(x.p, mood, opts));
  // Never empty the pool — fall back if weather filter was too aggressive
  return filtered.length ? filtered : ranked;
}

/**
 * Soft score delta for weather (applied in app scoring).
 * Hard exclusions for picks live in placeFitsWeatherMood.
 */
export function weatherScoreDelta(p, mood, opts = {}) {
  if (!p || !mood) return 0;
  const hasTag = opts.hasTag || (() => false);
  let d = 0;
  if (mood === "nice") {
    if (["natur", "gard", "loppis"].includes(p.type)) d += 18;
    if (hasTag(p, "ute")) d += 8;
    if (p.type === "natur") d += 6;
  } else if (mood === "rough") {
    if (["fika", "butik"].includes(p.type)) d += 18;
    if (hasTag(p, "inomhus")) d += 14;
    if (isOutdoorBathPlace(p)) d -= 50;
    else if (p.type === "natur") d -= 35;
    else if (hasTag(p, "ute") && !hasTag(p, "inomhus")) d -= 12;
  } else if (mood === "mild") {
    if (hasTag(p, "ute")) d += 2;
  }
  return d;
}

/** Daypart type preferences, adjusted for rough weather (no outdoor natur push). */
export function daypartTypesForMood(daypart, isWeekend, mood) {
  let types;
  if (daypart === "morgon") types = ["fika", "gard"];
  else if (daypart === "lunch") types = ["fika"];
  else if (daypart === "eftermiddag") {
    types = isWeekend
      ? ["natur", "gard", "loppis", "fika"]
      : ["butik", "gard", "fika"];
  } else {
    types = isWeekend ? ["fika", "natur"] : ["fika", "butik"];
  }
  if (mood === "rough") {
    types = types.filter((t) => t !== "natur");
    if (!types.includes("fika")) types = ["fika", ...types];
    if (!types.includes("butik")) types = [...types, "butik"];
  }
  return types;
}
