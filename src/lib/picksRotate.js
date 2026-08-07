/**
 * Deterministic daily rotation for Handplockat picks.
 *
 * Score only decides who is eligible (top band / top N).
 * Within that pool, order is driven by seed (Stockholm calendar day +
 * daypart + weather) — so a chronically high scorer like Gästis is not
 * locked as feature every day.
 */

/** FNV-1a 32-bit — stable across JS engines. */
export function hashStr(s) {
  let h = 2166136261;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Seed that changes by Stockholm calendar day (YYYY-MM-DD in Europe/Stockholm),
 * daypart and weather mood — not UTC midnight.
 */
export function picksRotationSeed({ todayISO, daypart, mood, weatherCode }) {
  return `${todayISO || ""}|${daypart || ""}|${mood || "mild"}|${weatherCode ?? ""}`;
}

/**
 * Reorder a pool by daily hash only (score already used for eligibility).
 * @param {{ p: { name: string }, score?: number }[]} candidates
 * @param {string} seed
 */
export function rotatePoolOrder(candidates, seed) {
  return [...candidates].sort((a, b) => {
    const ha = hashStr(`${a.p?.name || ""}|${seed}`);
    const hb = hashStr(`${b.p?.name || ""}|${seed}`);
    if (ha !== hb) return ha - hb;
    return String(a.p?.name || "").localeCompare(String(b.p?.name || ""), "sv");
  });
}

/** @deprecated Prefer rotatePoolOrder — kept for older call sites/tests. */
export function rotateScoredCandidates(candidates, seed, _bucketSize) {
  return rotatePoolOrder(candidates, seed);
}

/**
 * Build a candidate pool from ranked list (score = eligibility), then
 * rotate the whole pool by seed before diversifying types.
 * @param {{ p: { name: string, type: string }, score: number, open?: boolean }[]} ranked
 * @param {{ seed: string, count?: number, band?: number, minPool?: number, maxPool?: number, preferOpenTimed?: (x)=>boolean }} opts
 */
export function selectRotatedDiversePicks(ranked, opts = {}) {
  const count = opts.count ?? 3;
  const band = opts.band ?? 45;
  const minPool = opts.minPool ?? 8;
  const maxPool = opts.maxPool ?? 14;
  const seed = opts.seed || "";
  if (!ranked?.length) return [];

  const openFirst = opts.preferOpenTimed
    ? ranked.filter(opts.preferOpenTimed)
    : ranked;
  const pool = openFirst.length >= count ? openFirst : ranked;
  if (!pool.length) return [];

  const top = pool[0].score ?? 0;
  let candidates = pool.filter((x) => (x.score ?? 0) >= top - band);
  if (candidates.length < minPool) {
    candidates = pool.slice(0, Math.min(maxPool, pool.length));
  } else {
    candidates = candidates.slice(0, maxPool);
  }

  const rotated = rotatePoolOrder(candidates, seed);

  const picked = [rotated[0]];
  const types = new Set([rotated[0].p.type]);
  const names = new Set([rotated[0].p.name]);
  for (const x of rotated.slice(1)) {
    if (picked.length >= count) break;
    if (names.has(x.p.name) || types.has(x.p.type)) continue;
    picked.push(x);
    types.add(x.p.type);
    names.add(x.p.name);
  }
  for (const x of rotated.slice(1)) {
    if (picked.length >= count) break;
    if (names.has(x.p.name)) continue;
    picked.push(x);
    names.add(x.p.name);
  }
  return picked;
}
