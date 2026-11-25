#!/usr/bin/env node
/**
 * Kontroll för veckans evenemangsjakt (se docs/evenemangsjakt.md).
 *
 *   node scripts/event-check.mjs --known            → JSON med alla kommande evenemang (för dubblettkoll innan sökning)
 *   node scripts/event-check.mjs                    → kontrollera evenemang med addedDate = idag
 *   node scripts/event-check.mjs --since 2026-11-29 → kontrollera evenemang tillagda från och med datumet
 *   node scripts/event-check.mjs --today 2026-11-29 → låtsas att idag är ett annat datum (tester)
 *
 * Fel (exit 1) = något som skulle ge fel uppgift på sajten. Varningar = något Juha ska titta på i PR:en.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { events, EVENT_CONTENT, eventSlug } from "../src/data/events.js";
import { EVENT_VENUES } from "../src/data/eventVenues.js";
import { parseEventTime } from "../src/lib/eventSchema.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FALLBACK_IMG = "/assets/hero/2.webp";
const WEEKDAYS = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

export function stockholmToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
}

function words(s) {
  return new Set(
    String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !["med", "och", "for", "the", "kyrka", "vallentuna"].includes(w))
  );
}

export function similarity(a, b) {
  const A = words(a);
  const B = words(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  for (const w of A) if (B.has(w)) n++;
  return n / Math.min(A.size, B.size);
}

/** "Lör 12 dec · 15–16" ska stämma med date. Fritextformat ("21–27 sep") godtas. */
export function checkWhen(e) {
  const m = /^(mån|tis|ons|tor|fre|lör|sön)\s+(\d{1,2})\s+([a-zåäö]{3})/i.exec(e.when || "");
  if (!m) return null;
  const d = new Date(`${e.date}T12:00:00Z`);
  const wd = WEEKDAYS[d.getUTCDay()];
  const problems = [];
  if (m[1].toLowerCase() !== wd) problems.push(`veckodag "${m[1]}" men ${e.date} är en ${wd}`);
  if (Number(m[2]) !== d.getUTCDate()) problems.push(`dag ${m[2]} men date säger ${d.getUTCDate()}`);
  if (m[3].toLowerCase() !== MONTHS[d.getUTCMonth()]) problems.push(`månad "${m[3]}" men date säger ${MONTHS[d.getUTCMonth()]}`);
  return problems.length ? problems.join(", ") : null;
}

export function checkEvent(e, { today, list = events, content = EVENT_CONTENT, venues = EVENT_VENUES, fileExists = existsSync } = {}) {
  const errors = [];
  const warnings = [];
  for (const f of ["title", "host", "venue", "date", "when", "time", "cat", "note", "source", "addedDate"]) {
    if (!e[f]) errors.push(`saknar ${f}`);
  }
  if (e.date && !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) errors.push(`date "${e.date}" är inte ÅÅÅÅ-MM-DD`);
  if (e.date && today && e.date < today) errors.push(`date ${e.date} har redan passerat`);
  if (e.endDate && e.endDate < e.date) errors.push("endDate före date");
  if (e.venue && !venues[e.venue]) errors.push(`venue "${e.venue}" finns inte i eventVenues.js`);
  if (e.source && !/^https:\/\//.test(e.source)) errors.push("source ska vara en https-länk till arrangören eller kalendern");
  if (/facebook\.com/.test(e.source || "")) warnings.push("enda källan är Facebook: dubbelkolla mot en öppen sida");
  const w = checkWhen(e);
  if (w) errors.push(`when stämmer inte: ${w}`);
  if (e.time && /\d/.test(e.time) && !parseEventTime(e.time).start) {
    warnings.push(`time "${e.time}" går inte att läsa som klockslag, schemat får bara datum`);
  }
  if (!e.img || e.img === FALLBACK_IMG) {
    warnings.push("ingen egen bild (reservbilden visas)");
  } else if (!fileExists(join(root, "public", e.img))) {
    errors.push(`bilden ${e.img} finns inte i public/`);
  }
  const body = content[e.title]?.body;
  if (!body) warnings.push("saknar EVENT_CONTENT (bara note visas på sidan)");
  else if (!/Källa|källa|href=/.test(body)) warnings.push("EVENT_CONTENT anger ingen källa");
  if (e.img && e.img !== FALLBACK_IMG && body && !/Foto|foto|Bild|bild/.test(body)) {
    warnings.push("bilden saknar fotokredit i EVENT_CONTENT");
  }
  if (/\b(troligen|preliminärt?|prel\.|ungefär kl|ca kl|cirka kl)/i.test(`${e.when} ${e.time} ${e.note}`)) {
    warnings.push("texten innehåller en osäker uppgift (ca/troligen/preliminär)");
  }
  for (const o of list) {
    if (o === e) continue;
    const sameDay = o.date === e.date;
    const sim = similarity(o.title, e.title);
    const sameStart = o.venue === e.venue && parseEventTime(o.time).start && parseEventTime(o.time).start === parseEventTime(e.time).start;
    if (sameDay && (sim >= 0.6 || sameStart)) {
      warnings.push(`möjlig dubblett: "${o.title}" (${o.date}, ${o.venue})`);
    } else if (sim >= 0.8 && Math.abs(Date.parse(o.date) - Date.parse(e.date)) < 3 * 864e5) {
      warnings.push(`möjlig dubblett med annat datum: "${o.title}" (${o.date})`);
    }
  }
  return { errors, warnings };
}

function main() {
  const today = arg("--today") || stockholmToday();
  if (process.argv.includes("--known")) {
    const known = events
      .filter((e) => (e.endDate || e.date) >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => ({ date: e.date, title: e.title, host: e.host, venue: e.venue, source: e.source, slug: eventSlug(e) }));
    console.log(JSON.stringify({ today, venues: Object.keys(EVENT_VENUES), known }, null, 2));
    return;
  }
  const since = arg("--since") || today;
  const fresh = events.filter((e) => e.addedDate && e.addedDate >= since);
  if (!fresh.length) {
    console.log(`Inga evenemang med addedDate >= ${since}.`);
    return;
  }
  let failed = 0;
  for (const e of fresh) {
    const { errors, warnings } = checkEvent(e, { today });
    const mark = errors.length ? "FEL " : warnings.length ? "OBS " : "OK  ";
    console.log(`${mark} ${e.date}  ${e.title}  → /evenemang/${eventSlug(e)}.html`);
    for (const m of errors) console.log(`       ✗ ${m}`);
    for (const m of warnings) console.log(`       ! ${m}`);
    if (errors.length) failed++;
  }
  console.log(`\n${fresh.length} nya, ${failed} med fel.`);
  if (failed) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
