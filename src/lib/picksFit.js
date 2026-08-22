/**
 * Weather-aware fit for Handplockat / ranking.
 * Rough → under tak. Hot → bad. Nice → ute.
 */

const BATH_RE = /\bbad(plats|sjö|et)?\b|utomhusbad|bassäng|beachvolley|sandstrand|brygga/i;
const OUTDOOR_CAT_RE = /\bbad\b|utomhus|natur\s*&/i;

const RAINY_CODES = [
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99,
];

/** Never feature these as Handplockat experiences (still on map / platsidor). */
const HANDPLOCK_NEVER = new Set([
  "AutoMat Kårsta", // matbutik — nyttig i katalogen, inte en upplevelse att highlighta
]);

export function isHandplockEligible(p) {
  if (!p?.name) return false;
  return !HANDPLOCK_NEVER.has(p.name);
}

/** Outdoor swim / beach. */
export function isOutdoorBathPlace(p) {

  if (!p) return false;
  const blob = [p.name, p.cat, p.short, p.blurb].filter(Boolean).join(" ");
  if (OUTDOOR_CAT_RE.test(p.cat || "") && BATH_RE.test(blob)) return true;
  if (BATH_RE.test(p.name || "")) return true;
  return false;
}

/** Stekhett + no rain → Handplockat should lean into swimming. */
export function isHotSwimWeather(temp, code) {
  if (temp == null || temp < 22) return false;
  if (code != null && RAINY_CODES.includes(code)) return false;
  return true;
}

/**
 * True if the place is a sensible Handplockat tip for this weather mood.
 * @param {{ type?: string, cat?: string, name?: string, short?: string, blurb?: string }} p
 * @param {"nice"|"mild"|"rough"|string} mood
 * @param {{ hasTag?: (p: object, tag: string) => boolean, temp?: number|null, code?: number|null }} [opts]
 */
export function placeFitsWeatherMood(p, mood, opts = {}) {
  if (!p) return false;
  if (mood === "rough") {
    if (isOutdoorBathPlace(p)) return false;
    if (p.type === "natur") return false;
    return true;
  }
  return true;
}

/** Filter a ranked list before Handplockat rotation. */
export function filterRankedForWeather(ranked, mood, opts = {}) {
  if (!ranked?.length) return [];
  const filtered = ranked.filter((x) => placeFitsWeatherMood(x.p, mood, opts));
  return filtered.length ? filtered : ranked;
}

/**
 * Soft score delta for weather (applied in app scoring).
 * Hard exclusions for picks live in placeFitsWeatherMood.
 */
export function weatherScoreDelta(p, mood, opts = {}) {
  if (!p || !mood) return 0;
  const hasTag = opts.hasTag || (() => false);
  const hot = isHotSwimWeather(opts.temp, opts.code);
  let d = 0;

  if (mood === "rough") {
    if (["fika", "butik"].includes(p.type)) d += 18;
    if (hasTag(p, "inomhus")) d += 14;
    if (isOutdoorBathPlace(p)) d -= 50;
    else if (p.type === "natur") d -= 35;
    else if (hasTag(p, "ute") && !hasTag(p, "inomhus")) d -= 12;
    return d;
  }

  if (hot && isOutdoorBathPlace(p)) {
    d += 42; // beat typical open shops so Handplockat actually features a bath
  } else if (mood === "nice") {
    if (isOutdoorBathPlace(p)) d += 20;
    if (["natur", "gard", "loppis"].includes(p.type)) d += 18;
    if (hasTag(p, "ute")) d += 8;
    if (p.type === "natur" && !isOutdoorBathPlace(p)) d += 6;
  } else if (mood === "mild") {
    if (hasTag(p, "ute")) d += 2;
    if (isOutdoorBathPlace(p) && opts.temp != null && opts.temp >= 18) d += 8;
  }

  return d;
}

/** Daypart type preferences, adjusted for weather. */
export function daypartTypesForMood(daypart, isWeekend, mood, opts = {}) {
  const hot = isHotSwimWeather(opts.temp, opts.code);
  let types;
  if (daypart === "morgon") types = ["fika", "gard"];
  else if (daypart === "lunch") types = hot ? ["natur", "fika"] : ["fika"];
  else if (daypart === "eftermiddag") {
    types = isWeekend
      ? ["natur", "gard", "loppis", "fika"]
      : ["butik", "gard", "fika"];
    if (hot && !types.includes("natur")) types = ["natur", ...types];
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

/**
 * Handplockat pool: weather filter, then on hot days bias so a bath can take feature.
 * Keeps diversity — only reorders baths ahead within the eligibility set.
 */
export function prepareRankedForPicks(ranked, mood, opts = {}) {
  const eligible = (ranked || []).filter((x) => isHandplockEligible(x?.p));
  let list = filterRankedForWeather(eligible, mood, opts);
  if (!isHotSwimWeather(opts.temp, opts.code) || list.length < 2) return list;

  const baths = [];
  const rest = [];
  for (const x of list) {
    if (isOutdoorBathPlace(x.p)) baths.push(x);
    else rest.push(x);
  }
  if (!baths.length) return list;

  // Highest-scoring bath first, then the rest (rotation still diversifies types)
  baths.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return [...baths, ...rest];
}

/** Copy hint for Handplockat eyebrow when weather drives the pitch. */
export function picksWhyForWeather({ mood, temp, weatherLabel, hot }) {
  const label = weatherLabel || (mood === "rough" ? "grått" : "fint");
  if (mood === "rough") {
    const kind = label.toLowerCase();
    const capped = kind[0].toUpperCase() + kind.slice(1);
    return temp != null
      ? `${capped} · ca ${temp}° — mysiga stopp under tak.`
      : "Lite gråare väder — här är mysiga stopp under tak.";
  }
  if (hot) {
    return temp != null
      ? `Stekhett · ca ${temp}° — dags för bad och svalka.`
      : "Stekhett — dags för bad och svalka.";
  }
  if (mood === "nice") {
    return temp != null
      ? `Soligt läge · ca ${temp}° — uteplatser och utflykter som passar idag.`
      : "Fint väder idag — här är ställena som passar ute.";
  }
  return null;
}
