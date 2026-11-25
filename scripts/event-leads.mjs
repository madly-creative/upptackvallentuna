#!/usr/bin/env node
/**
 * Hämtar kandidater till veckans evenemangsjakt (se docs/evenemangsjakt.md).
 *
 *   node scripts/event-leads.mjs            → tabell över kandidater från kommunens kalender, markerade NY / FINNS
 *   node scripts/event-leads.mjs --json     → samma som JSON
 *   node scripts/event-leads.mjs --all      → visa även de som redan finns på sajten
 *   node scripts/event-leads.mjs --page URL → läsbar text + externa länkar från en evenemangssida (för korrläsning)
 *
 * Kandidater är bara tips. Varje uppgift ska läsas på evenemangets egen sida (och helst arrangörens)
 * innan något läggs in i src/data/events.js.
 */
import { spawnSync } from "node:child_process";
import { events } from "../src/data/events.js";
import { similarity, stockholmToday } from "./event-check.mjs";

const KOMMUN = "https://www.vallentuna.se";
const KOMMUN_PAGES =
  "/appresource/4.2d6cb2d919d85cc2d2563f8/12.2d6cb2d919d85cc2d251d377/getPages?filters=%7B%7D&combinedFilters=%5B%5D&structureFilter=%5B%5D&fromDate=&toDate=&lastPublished=&query=&svAjaxReqParam=ajax&pageNum=";
const UA = "Mozilla/5.0 (UpptackVallentuna evenemangsjakt)";

// Återkommande programpunkter som sajten medvetet inte lägger upp som egna evenemang.
const SKIP = [/sagostund/i, /överraskningspås/i, /bibblan på/i, /kubenstories/i, /läxhjälp/i, /språkcafé/i, /bokcirkel/i, /bim,? bam/i];

function stripTags(s) {
  return String(s || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
}

export async function kommunLeads(fetchImpl = fetch) {
  const out = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetchImpl(KOMMUN + KOMMUN_PAGES + page, { headers: { "user-agent": UA } });
    if (!res.ok) throw new Error(`vallentuna.se svarade ${res.status}`);
    const data = await res.json();
    for (const p of data.pages || []) {
      const href = /href="([^"]+)"/.exec(p.linkHtml)?.[1];
      out.push({
        source: "kommunen",
        date: p.fromDateIso,
        endDate: p.toDateIso || undefined,
        title: stripTags(p.linkHtml),
        place: p.place,
        categories: p.categories,
        canceled: !!p.canceled,
        url: href ? KOMMUN + href : undefined,
        image: p.image?.usedFallbackImage ? undefined : p.image?.uri ? KOMMUN + p.image.uri : undefined,
      });
    }
    const pageSize = Number(data.pageSize || 9);
    if (!data.pages?.length || page * pageSize >= Number(data.numHits || 0)) break;
  }
  return out;
}

/** Slår ihop flera tillfällen av samma titel och markerar det som redan finns i events.js. */
export function classify(leads, list = events, today = stockholmToday()) {
  const seen = new Map();
  for (const l of leads) {
    if (!l.date || l.date < today || l.canceled) continue;
    if (SKIP.some((re) => re.test(l.title))) continue;
    const key = l.title.toLowerCase();
    const prev = seen.get(key);
    if (prev) {
      prev.dates.push(l.date);
      continue;
    }
    const match = list.find((e) => e.date === l.date && similarity(e.title, l.title) >= 0.5)
      || list.find((e) => e.source && l.url && e.source.replace(/\/\d{4}-\d{2}-\d{2}$/, "") === l.url.replace(/\/\d{4}-\d{2}-\d{2}$/, ""));
    seen.set(key, { ...l, dates: [l.date], known: match ? match.title : null });
  }
  return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Läsbar text ur en HTML-sida (huvudinnehållet) och dess externa länkar, t.ex. biljettlänk. */
export function pageText(html, baseUrl) {
  const ld = [];
  for (const m of String(html).matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      for (const e of [j, ...(j["@graph"] || []), ...(Array.isArray(j) ? j : [])].flat()) {
        if (e && /Event/.test(e["@type"] || "") && e.startDate) ld.push(`${e.startDate}${e.endDate ? ` → ${e.endDate}` : ""}  ${e.name || ""}  @ ${e.location?.name || ""}`);
      }
    } catch {
      for (const d of m[1].matchAll(/"startDate"\s*:\s*"([^"]+)"/g)) ld.push(`${d[1]}  (ur ld+json)`);
    }
  }
  let s = String(html);
  const i = s.search(/<main[\s>]/i);
  if (i > -1) s = s.slice(i);
  const j = s.search(/<\/main>/i);
  if (j > -1) s = s.slice(0, j);
  s = s.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, "");
  const host = new URL(baseUrl).host;
  const links = [...s.matchAll(/<a[^>]+href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: new URL(m[1].replace(/&amp;/g, "&"), baseUrl).href, text: stripTags(m[2]).replace(/\s+/g, " ") }))
    .filter((l) => !l.href.includes(host) && /^https?:/.test(l.href));
  const text = s
    .replace(/<(br|\/p|\/div|\/li|\/h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  const ogImage = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i.exec(String(html))?.[1];
  return { text, links, ld, ogImage: ogImage ? new URL(ogImage.replace(/&amp;/g, "&"), baseUrl).href : undefined };
}

async function main() {
  const pageUrl = process.argv[process.argv.indexOf("--page") + 1];
  if (process.argv.includes("--page") && pageUrl) {
    const res = await fetch(pageUrl, { headers: { "user-agent": UA } });
    if (!res.ok) throw new Error(`${pageUrl} svarade ${res.status}`);
    const { text, links, ld, ogImage } = pageText(await res.text(), res.url);
    console.log(text);
    if (ogImage) console.log(`\nDelningsbild (og:image): ${ogImage}`);
    if (ld.length) console.log("\nStrukturerade datum (Event-schema):\n" + [...new Set(ld)].map((l) => `  ${l}`).join("\n"));
    if (links.length) console.log("\nExterna länkar:\n" + links.map((l) => `  ${l.text || "(utan text)"} → ${l.href}`).join("\n"));
    return;
  }
  const all = process.argv.includes("--all");
  const leads = classify(await kommunLeads());
  const shown = all ? leads : leads.filter((l) => !l.known);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(shown, null, 2));
    return;
  }
  for (const l of shown) {
    const dates = l.dates.length > 1 ? ` (+${l.dates.length - 1} tillfällen)` : "";
    console.log(`${l.known ? "FINNS" : "NY   "} ${l.date}${dates}  ${l.title}  · ${l.place || "?"}\n      ${l.url}${l.image ? `\n      bild: ${l.image}` : ""}`);
  }
  console.log(`\n${leads.length} kommande i kommunens kalender, ${leads.filter((l) => !l.known).length} saknas på sajten.`);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  // Bakom proxy (HTTPS_PROXY) följer Nodes fetch den bara med NODE_USE_ENV_PROXY=1 → starta om med den.
  if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
    const r = spawnSync(process.execPath, ["--no-warnings", ...process.argv.slice(1)], { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
    process.exit(r.status ?? 1);
  }
  main().catch((err) => {
    console.error(`Fel: ${err.message}`);
    process.exit(1);
  });
}
