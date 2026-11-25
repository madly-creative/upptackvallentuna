#!/usr/bin/env node
/**
 * Lägger in verifierade evenemang i src/data/events.js (se docs/evenemangsjakt.md).
 *
 *   node scripts/event-add.mjs nya.json
 *
 * nya.json = lista med objekt i samma form som i events.js, plus valfritt `body` (HTML till EVENT_CONTENT).
 * Varje evenemang hamnar i datumordning i listan och får addedDate = idag (Stockholm) om det saknas.
 * Skriptet gissar ingenting: saknade fält stoppas sedan av `node scripts/event-check.mjs`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stockholmToday } from "./event-check.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const file = join(root, "src/data/events.js");
const ORDER = ["host", "venue", "title", "date", "endDate", "addedDate", "when", "time", "cat", "kids", "note", "img", "imgFit", "source"];

const q = (v) => (typeof v === "string" ? JSON.stringify(v) : String(v));

export function entrySource(e) {
  const keys = [...ORDER.filter((k) => e[k] !== undefined), ...Object.keys(e).filter((k) => !ORDER.includes(k) && k !== "body")];
  return `  {\n${keys.map((k) => `    ${k}: ${q(e[k])},`).join("\n")}\n  },\n`;
}

export function insertEvents(src, list, today = stockholmToday()) {
  const start = src.indexOf("export const events = [\n") + "export const events = [\n".length;
  const end = src.indexOf("].map((e) => ({");
  if (start < 24 || end < 0) throw new Error("Hittar inte events-listan i events.js");
  let body = src.slice(start, end);
  let content = "";
  for (const raw of [...list].sort((a, b) => a.date.localeCompare(b.date))) {
    const e = { addedDate: today, ...raw };
    if (src.includes(`title: ${JSON.stringify(e.title)},\n    date: ${JSON.stringify(e.date)}`) || body.includes(`title: ${JSON.stringify(e.title)},\n    date: ${JSON.stringify(e.date)}`)) {
      throw new Error(`Finns redan: ${e.title} ${e.date}`);
    }
    // Före första befintliga evenemang med senare datum.
    const re = /\n    date: "(\d{4}-\d{2}-\d{2})"/g;
    let at = body.length;
    let m;
    while ((m = re.exec(body))) {
      if (m[1] > e.date) {
        at = body.lastIndexOf("  {\n", m.index);
        break;
      }
    }
    body = body.slice(0, at) + entrySource(e) + body.slice(at);
    if (raw.body) content += `  ${JSON.stringify(e.title)}: {\n    body: \`${raw.body.replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\`,\n  },\n`;
  }
  let out = src.slice(0, start) + body + src.slice(end);
  if (content) {
    const marker = "export const EVENT_CONTENT = {\n";
    const i = out.indexOf(marker) + marker.length;
    out = out.slice(0, i) + content + out.slice(i);
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const input = process.argv[2];
  if (!input) {
    console.error("Ange en JSON-fil: node scripts/event-add.mjs nya.json");
    process.exit(1);
  }
  const list = JSON.parse(readFileSync(input, "utf8"));
  writeFileSync(file, insertEvents(readFileSync(file, "utf8"), list));
  console.log(`La in ${list.length} evenemang i src/data/events.js. Kör nu: node scripts/event-check.mjs`);
}
