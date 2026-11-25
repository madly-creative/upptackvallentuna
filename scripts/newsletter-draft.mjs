#!/usr/bin/env node
/**
 * Veckans utkast till "Brev från Juha" — körs torsdagar inför helgen.
 *
 *   node scripts/newsletter-draft.mjs                 # hämtar Umami, skapar/uppdaterar UTKAST i Brevo
 *   node scripts/newsletter-draft.mjs --dry-run       # bara HTML till fil, inget mot Brevo
 *   node scripts/newsletter-draft.mjs --json          # dataunderlaget (för att skriva egen intro)
 *   node scripts/newsletter-draft.mjs --intro intro.txt --subject "…"
 *
 * Flaggor: --today ÅÅÅÅ-MM-DD (låtsas att det är en annan dag), --out fil.html, --no-umami.
 * --intro: textfil, ett stycke per tomrad, i Juhas jag-form. Utan den används en mall.
 *
 * SKICKAR ALDRIG. Kampanjen skapas utan scheduledAt och ligger som Draft i Brevo tills Juha
 * själv trycker skicka. Körs den igen samma dag uppdateras samma utkast i stället för ett nytt.
 *
 * Nycklar läses ur miljön (BREVO_API_KEY, UMAMI_API_KEY) eller injiceras av nätverkshemligheter
 * för api.brevo.com (header api-key) och api.umami.is (header x-umami-api-key). Skrivs aldrig ut.
 * Lista/avsändare: BREVO_LIST_ID (4), NEWSLETTER_SENDER_EMAIL (info@upptackvallentuna.se).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
// Bakom proxy: Nodes fetch följer HTTPS_PROXY bara med NODE_USE_ENV_PROXY=1 → starta om med den.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, ["--no-warnings", ...process.argv.slice(1)], { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  process.exit(r.status ?? 1);
}
const { buildDraft } = await import("./lib/newsletter.mjs");

const TZ = "Europe/Stockholm";
const args = process.argv.slice(2);
const has = (f) => args.includes(`--${f}`);
const opt = (f, d) => { const i = args.indexOf(`--${f}`); return i >= 0 ? args[i + 1] : d; };

const todayISO = opt("today") || new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
const warnings = [];

/* ---------------- Umami: mest visade sidor senaste 7 dagarna ---------------- */
async function umamiPages() {
  const API = process.env.UMAMI_API_URL || "https://api.umami.is/v1";
  const SITE = process.env.UMAMI_WEBSITE_ID || "f52ab92f-5136-450c-b9b7-cef84fe73c02";
  const KEY = process.env.UMAMI_API_KEY || "";
  const endAt = Date.now();
  const startAt = endAt - 7 * 86400000;
  for (const type of ["path", "url"]) { // v3 "path", v2 "url"
    const url = new URL(`${API}/websites/${SITE}/metrics`);
    Object.entries({ startAt, endAt, type, limit: 500 }).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url, { headers: { Accept: "application/json", ...(KEY ? { "x-umami-api-key": KEY } : {}) } });
    if (!res.ok) { if (type === "url") throw new Error(`Umami ${res.status}`); continue; }
    const r = await res.json();
    return (Array.isArray(r) ? r : r.data || []).map((x) => ({ key: x.x ?? x.value ?? "", n: Number(x.y ?? x.count ?? 0) }));
  }
  return [];
}

let pages = [];
if (!has("no-umami")) {
  try { pages = await umamiPages(); } catch (e) { warnings.push(`Umami gick inte att läsa (${e.message}); brevet byggs utan "mest läst".`); }
}

const intro = opt("intro") ? readFileSync(opt("intro"), "utf8").split(/\n\s*\n/).map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean) : null;
const draft = buildDraft({ todayISO, pages, intro, subject: opt("subject") });

if (has("json")) {
  const slim = (e) => ({ title: e.title, date: e.date, endDate: e.endDate, when: e.when, venue: e.venue, cat: e.cat, kids: !!e.kids, note: e.note });
  console.log(JSON.stringify({ todayISO, windows: draft.windows, subject: draft.subject, intro: draft.intro, weekend: draft.weekend.map(slim), ahead: draft.ahead.map(slim), readersTop: draft.top, warnings }, null, 2));
  process.exit(0);
}

const out = opt("out", `newsletter-draft-${todayISO}.html`);
writeFileSync(out, draft.html);
console.log(`Ämne: ${draft.subject}\nI helgen: ${draft.weekend.length} · Längre fram: ${draft.ahead.length} · Mest läst: ${draft.top.length}\nHTML: ${out}`);
warnings.forEach((w) => console.warn(`⚠ ${w}`));
if (has("dry-run")) process.exit(0);

/* ---------------- Brevo: skapa eller uppdatera UTKAST (aldrig skicka) ---------------- */
const BREVO = "https://api.brevo.com/v3";
const KEY = process.env.BREVO_API_KEY || "";
const brevo = async (path, init = {}) => {
  const res = await fetch(BREVO + path, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(KEY ? { "api-key": KEY } : {}), ...init.headers },
  });
  const body = res.status === 204 ? {} : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Brevo ${res.status} ${path}: ${body.code || ""} ${body.message || ""}`.trim());
  return body;
};

const name = `Brev från Juha – utkast ${todayISO}`;
const payload = {
  name,
  subject: draft.subject,
  previewText: draft.preview,
  sender: { name: process.env.NEWSLETTER_SENDER_NAME || "Juha på Upptäck Vallentuna", email: process.env.NEWSLETTER_SENDER_EMAIL || "info@upptackvallentuna.se" },
  replyTo: process.env.NEWSLETTER_REPLY_TO || "info@upptackvallentuna.se",
  recipients: { listIds: [Number(process.env.BREVO_LIST_ID || 4)] },
  htmlContent: draft.html,
  // Ingen scheduledAt och inget anrop till /sendNow: kampanjen stannar som Draft.
};

try {
  const list = await brevo(`/emailCampaigns?type=classic&status=draft&limit=100&sort=desc`);
  const existing = (list.campaigns || []).find((c) => c.name === name);
  let id;
  if (existing) {
    await brevo(`/emailCampaigns/${existing.id}`, { method: "PUT", body: JSON.stringify(payload) });
    id = existing.id;
    console.log(`Uppdaterade befintligt utkast #${id}.`);
  } else {
    ({ id } = await brevo(`/emailCampaigns`, { method: "POST", body: JSON.stringify(payload) }));
    console.log(`Skapade utkast #${id}.`);
  }
  console.log(`BREVO_URL=https://app.brevo.com/marketing-campaign/edit/${id}`);
} catch (e) {
  console.error(`${e.message}\nSaknas nyckeln? Lägg Brevo-nyckeln som nätverkshemlighet för api.brevo.com (header api-key) eller sätt BREVO_API_KEY.`);
  process.exit(2);
}
