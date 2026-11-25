#!/usr/bin/env node
/**
 * Veckorapport från Umami Cloud — dataunderlaget som veckoanalysen bygger på.
 * Trackingplan: docs/trackingplan.md
 *
 *   UMAMI_API_KEY=… node scripts/umami-report.mjs [--days 7] [--end 2026-11-30] [--json]
 *
 * Nyckeln läses ur miljön (eller injiceras av en nätverkshemlighet för api.umami.is) och skrivs aldrig ut.
 * Utdata: Markdown med tabeller + regelbaserade signaler. --json ger rådata för vidare analys.
 * Tål både Umami v2- och v3-API:ets svarsformat (url/path, värde-objekt, rapport-endpoints).
 */
import { spawnSync } from "node:child_process";
// Bakom proxy (HTTPS_PROXY): Nodes fetch följer den bara med NODE_USE_ENV_PROXY=1 → starta om med den.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, ["--no-warnings", ...process.argv.slice(1)], { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  process.exit(r.status ?? 1);
}
const API = process.env.UMAMI_API_URL || "https://api.umami.is/v1";
const SITE = process.env.UMAMI_WEBSITE_ID || "f52ab92f-5136-450c-b9b7-cef84fe73c02";
const KEY = process.env.UMAMI_API_KEY || "";
const TZ = "Europe/Stockholm";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const DAYS = Number(opt("days", 7));
const endDate = opt("end") ? new Date(`${opt("end")}T23:59:59+01:00`) : startOfTodayStockholm();
const endAt = endDate.getTime() - (opt("end") ? 0 : 1); // till och med i går om inget anges
const startAt = endAt - DAYS * 86400000 + 1;
const prevEnd = startAt - 1;
const prevStart = prevEnd - DAYS * 86400000 + 1;

function startOfTodayStockholm() {
  const d = new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
  const off = new Intl.DateTimeFormat("en", { timeZone: TZ, timeZoneName: "shortOffset" }).format(new Date()).includes("GMT+2") ? "+02:00" : "+01:00";
  return new Date(`${d}T00:00:00${off}`);
}
const day = (ms) => new Date(ms).toLocaleDateString("sv-SE", { timeZone: TZ });

async function get(path, params = {}) {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Accept: "application/json", ...(KEY ? { "x-umami-api-key": KEY } : {}) } });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}
async function post(path, body) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...(KEY ? { "x-umami-api-key": KEY } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}
const quiet = async (p, fallback = null) => { try { return await p; } catch (e) { warnings.push(e.message); return fallback; } };
const warnings = [];

const num = (v) => (v && typeof v === "object" ? Number(v.value ?? 0) : Number(v ?? 0));
const rows = (r) => (Array.isArray(r) ? r : r?.data || []).map((x) => ({
  key: x.x ?? x.value ?? x.name ?? x.propertyName ?? "",
  n: Number(x.y ?? x.total ?? x.count ?? 0),
}));

const range = (s, e) => ({ startAt: s, endAt: e });
async function stats(s, e) {
  const r = await get(`/websites/${SITE}/stats`, range(s, e));
  return { pageviews: num(r.pageviews), visitors: num(r.visitors), visits: num(r.visits), bounces: num(r.bounces), totaltime: num(r.totaltime) };
}
async function metric(type, extra = {}, s = startAt, e = endAt) {
  // v3 heter "path", v2 "url"
  const types = type === "path" ? ["path", "url"] : [type];
  for (const t of types) {
    try { return rows(await get(`/websites/${SITE}/metrics`, { ...range(s, e), type: t, limit: 500, ...extra })); }
    catch (err) { if (t === types.at(-1)) throw err; }
  }
}
async function values(event, propertyName, extra = {}) {
  return rows(await get(`/websites/${SITE}/event-data/values`, { ...range(startAt, endAt), event, propertyName, ...extra }));
}
async function journeys() {
  const startDate = new Date(startAt).toISOString(), endDate = new Date(endAt).toISOString();
  const attempts = [
    () => post(`/reports/journey`, { websiteId: SITE, type: "journey", filters: {}, parameters: { startDate, endDate, steps: 4 } }),
    () => post(`/reports/journey`, { websiteId: SITE, dateRange: { startDate, endDate }, steps: 4 }),
  ];
  for (const a of attempts) { try { const r = await a(); if (r) return Array.isArray(r) ? r : r.data || r; } catch (e) { warnings.push(e.message); } }
  return null;
}

/* ---------------- Hämta ---------------- */
const now = await quiet(stats(startAt, endAt));
if (!now) {
  console.error(`Kunde inte läsa Umami (${warnings.join("; ")}). Saknas UMAMI_API_KEY eller nätverksåtkomst till ${new URL(API).host}?`);
  process.exit(2);
}
const prev = await quiet(stats(prevStart, prevEnd), null);
const [pages, entries, exits, refs, devices, events] = await Promise.all([
  quiet(metric("path"), []),
  quiet(metric("entry"), []),
  quiet(metric("exit"), []),
  quiet(metric("referrer"), []),
  quiet(metric("device"), []),
  quiet(metric("event"), []),
]);
const ev = Object.fromEntries(events.map((r) => [r.key, r.n]));
const [clickSec, clickEl, seenRaw, depthHome, outKind, outDest, outName, searches, filters, actions, actionItems] = await Promise.all([
  quiet(values("click", "sec"), []),
  quiet(values("click", "el"), []),
  quiet(values("page_summary", "seen", { path: "/", url: "/" }), []),
  quiet(values("page_summary", "depth", { path: "/", url: "/" }), []),
  quiet(values("outbound", "kind"), []),
  quiet(values("outbound", "dest"), []),
  quiet(values("outbound", "name"), []),
  quiet(values("search", "q"), []),
  quiet(values("filter", "value"), []),
  quiet(values("action", "type"), []),
  quiet(values("action", "item"), []),
]);
const searchHits = await quiet(values("search", "hits"), []);
const journey = await journeys();

/* ---------------- Bearbeta ---------------- */
// "seen" är en kommalista per sidvisning → räkna varje sektion
const seen = {};
for (const r of seenRaw) for (const s of String(r.key).split(",")) if (s && s !== "-") seen[s] = (seen[s] || 0) + r.n;
const homeSummaries = seenRaw.reduce((a, r) => a + r.n, 0);
const clicksBySec = Object.fromEntries(clickSec.map((r) => [r.key, r.n]));
const sections = Object.keys({ ...seen, ...clicksBySec })
  .filter((s) => seen[s])
  .map((s) => ({ sec: s, seen: seen[s], reach: homeSummaries ? seen[s] / homeSummaries : 0, clicks: clicksBySec[s] || 0, ctr: (clicksBySec[s] || 0) / seen[s] }))
  .sort((a, b) => b.seen - a.seen);

// Normalisera statiska sidor (/plats/x.html) och SPA-vyer (/app/plats/x) till en innehållstyp
const typeOf = (p) => {
  const m = String(p).match(/^\/(?:app\/)?([a-zåäö-]+)/i);
  return p === "/" ? "start" : m ? m[1].replace(/\.html$/, "") : "övrigt";
};
const byType = {};
for (const r of pages) byType[typeOf(r.key)] = (byType[typeOf(r.key)] || 0) + r.n;

const pct = (x) => `${Math.round(x * 100)} %`;
const delta = (a, b) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)} %` : "–");
const tbl = (head, list) => list.length ? [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...list.map((r) => `| ${r.join(" | ")} |`)].join("\n") : "_(ingen data)_";
const top = (list, n = 10) => list.slice(0, n);

/* ---------------- Signaler (regelbaserade, för analysen att pröva) ---------------- */
const signals = [];
const depthTotal = depthHome.reduce((a, r) => a + r.n, 0);
const deep = depthHome.filter((r) => Number(r.key) >= 75).reduce((a, r) => a + r.n, 0);
if (depthTotal) signals.push(`${pct(deep / depthTotal)} av startsidans visningar scrollar till minst 75 %.`);
for (const s of sections) {
  if (s.seen >= 20 && s.ctr < 0.02) signals.push(`Sektion **${s.sec}** ses ${s.seen} ggr men får nästan inga klick (${pct(s.ctr)}) → kandidat att ignoreras.`);
  if (s.seen >= 20 && s.ctr >= 0.15) signals.push(`Sektion **${s.sec}** fungerar: ${pct(s.ctr)} klick per visning.`);
  if (homeSummaries >= 30 && s.reach < 0.25) signals.push(`Sektion **${s.sec}** når bara ${pct(s.reach)} av startsidesbesökarna (ligger för långt ned?).`);
}
const zero = searchHits.find((r) => r.key === "0");
const allSearch = searchHits.reduce((a, r) => a + r.n, 0);
if (zero && allSearch) signals.push(`${pct(zero.n / allSearch)} av sökningarna gav noll träffar — se sökord nedan.`);
if (prev && prev.visitors) signals.push(`Besökare ${now.visitors} (${delta(now.visitors, prev.visitors)} mot veckan innan).`);

/* ---------------- Utdata ---------------- */
const data = { period: { start: day(startAt), end: day(endAt), days: DAYS }, now, prev, byType, pages: top(pages, 25), entries: top(entries), exits: top(exits), refs: top(refs), devices, events: ev, sections, clickEl: top(clickEl, 25), outbound: { kind: outKind, dest: top(outDest), name: top(outName) }, searches: top(searches, 25), searchHits, filters, actions, actionItems: top(actionItems, 15), depthHome, journey: Array.isArray(journey) ? journey.slice(0, 15) : journey, signals, warnings };
if (args.includes("--json")) { console.log(JSON.stringify(data, null, 2)); process.exit(0); }

const bounce = now.visits ? now.bounces / now.visits : 0;
const avgVisit = now.visits ? Math.round(now.totaltime / now.visits) : 0;
const md = `# Upptäck Vallentuna — dataunderlag ${data.period.start} – ${data.period.end}

## Nyckeltal
${tbl(["", "Denna period", "Föregående", "Förändring"], [
  ["Besökare", now.visitors, prev?.visitors ?? "–", delta(now.visitors, prev?.visitors)],
  ["Besök", now.visits, prev?.visits ?? "–", delta(now.visits, prev?.visits)],
  ["Sidvisningar", now.pageviews, prev?.pageviews ?? "–", delta(now.pageviews, prev?.pageviews)],
  ["Sidor per besök", now.visits ? (now.pageviews / now.visits).toFixed(1) : "–", prev?.visits ? (prev.pageviews / prev.visits).toFixed(1) : "–", ""],
  ["Avvisningsfrekvens", pct(bounce), prev?.visits ? pct(prev.bounces / prev.visits) : "–", ""],
  ["Snittid per besök", `${avgVisit} s`, prev?.visits ? `${Math.round(prev.totaltime / prev.visits)} s` : "–", ""],
])}

## Signaler
${signals.map((s) => `- ${s}`).join("\n") || "_(för lite data för signaler)_"}

## Startsidans sektioner (sedd → klick)
${tbl(["Sektion", "Sedd", "Når % av startsidesvisningar", "Klick", "Klick/visning"], sections.map((s) => [s.sec, s.seen, pct(s.reach), s.clicks, pct(s.ctr)]))}

Scrolldjup startsidan: ${depthHome.map((r) => `${r.key} %: ${r.n}`).join(" · ") || "–"}

## Innehållstyper (sidvisningar)
${tbl(["Typ", "Visningar"], Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]))}

## Mest visade sidor
${tbl(["Sida", "Visningar"], top(pages, 15).map((r) => [r.key, r.n]))}

## Ingångar och utgångar
${tbl(["Ingångssida", "Besök"], top(entries, 8).map((r) => [r.key, r.n]))}

${tbl(["Utgångssida", "Besök"], top(exits, 8).map((r) => [r.key, r.n]))}

## Vägar genom sajten (Journeys)
${Array.isArray(journey) && journey.length ? tbl(["Väg", "Besök"], journey.slice(0, 10).map((j) => [(j.items || j.path || []).filter(Boolean).join(" → "), j.count ?? j.y ?? ""])) : "_(Journey-rapporten gick inte att hämta via API — se Umami → Reports → Journey)_"}

## Mest klickat (element)
${tbl(["Element", "Klick"], top(clickEl, 15).map((r) => [r.key, r.n]))}

## Utgående (värde vi skickar vidare)
${tbl(["Typ", "Antal"], outKind.map((r) => [r.key, r.n]))}

${tbl(["Verksamhet/evenemang", "Utgående klick"], top(outName, 10).map((r) => [r.key, r.n]))}

## Sökningar
${tbl(["Sökord", "Antal"], top(searches, 15).map((r) => [r.key, r.n]))}

Träffar: ${searchHits.map((r) => `${r.key}: ${r.n}`).join(" · ") || "–"}

## Filter och handlingar
${tbl(["Evenemangsfilter", "Antal"], filters.map((r) => [r.key, r.n]))}

${tbl(["Handling", "Antal"], actions.map((r) => [r.key, r.n]))}

## Trafikkällor och enheter
${tbl(["Källa", "Besök"], top(refs, 10).map((r) => [r.key || "(direkt)", r.n]))}

${tbl(["Enhet", "Besök"], devices.map((r) => [r.key, r.n]))}
${warnings.length ? `\n<sub>API-varningar: ${[...new Set(warnings)].join("; ")}</sub>\n` : ""}`;
console.log(md);
