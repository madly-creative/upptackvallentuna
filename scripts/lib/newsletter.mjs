/**
 * Byggstenar för "Brev från Juha" — rena funktioner utan nätverk, så de går att testa.
 * Används av scripts/newsletter-draft.mjs.
 *
 * Tonen: jag-form, kort, konkret, varm. Inga utropstecken i rad, inga säljord.
 * Allt utom intro och ämnesrad är data (evenemang + vad läsarna tittat på).
 */
import { events as ALL_EVENTS, eventSlug, addDaysISO } from "../../src/data/events.js";
import { EVENT_VENUES } from "../../src/data/eventVenues.js";
import { places, placeBySlug } from "../../src/data/places.js";

export const SITE = "https://upptackvallentuna.se";
const WEEKDAY = ["sön", "mån", "tis", "ons", "tor", "fre", "lör"];
const MONTH = ["jan", "feb", "mars", "april", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"];

/** Veckodag 0–6 för ett ISO-datum (lokal middag → inga sommartidsfel). */
const dow = (iso) => new Date(`${iso}T12:00:00`).getDay();
export const dayLabel = (iso) => `${WEEKDAY[dow(iso)]} ${Number(iso.slice(8, 10))} ${MONTH[Number(iso.slice(5, 7)) - 1]}`;

/**
 * Fönster räknat från körningsdagen (torsdag):
 *   helgen   = i dag t.o.m. närmaste söndag
 *   framåt   = måndagen efter t.o.m. söndagen veckan därpå (≈ 1,5 vecka)
 */
export function windows(todayISO) {
  const toSunday = (7 - dow(todayISO)) % 7;
  const weekendEnd = addDaysISO(todayISO, toSunday);
  return {
    weekend: { start: todayISO, end: weekendEnd },
    ahead: { start: addDaysISO(weekendEnd, 1), end: addDaysISO(weekendEnd, 14) },
  };
}

const overlaps = (e, { start, end }) => e.date <= end && (e.endDate || e.date) >= start;
const byDate = (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "sv");

/** Första meningen i notisen, högst ~170 tecken. */
export function teaser(note = "") {
  const clean = String(note).replace(/\s+/g, " ").trim();
  const first = clean.match(/^.+?[.!?](\s|$)/)?.[0].trim() || clean;
  return first.length > 170 ? `${first.slice(0, 167).replace(/\s+\S*$/, "")} …` : first;
}

export const eventUrl = (e) => `${SITE}/evenemang/${eventSlug(e)}.html`;
export const venueName = (e) => EVENT_VENUES[e.venue]?.name || e.host || "";

/**
 * Välj evenemang. Populära (många visningar i Umami) lyfts först inom sitt fönster,
 * sedan datumordning. Max `limit` per fönster.
 */
export function pickEvents(todayISO, { list = ALL_EVENTS, popularity = {}, limit = 6 } = {}) {
  const w = windows(todayISO);
  const score = (e) => popularity[eventSlug(e)] || 0;
  const pick = (win, exclude = new Set()) => {
    const hits = list.filter((e) => overlaps(e, win) && !exclude.has(e));
    const top = [...hits].sort((a, b) => score(b) - score(a) || byDate(a, b)).slice(0, limit);
    return top.sort(byDate);
  };
  const weekend = pick(w.weekend);
  const ahead = pick(w.ahead, new Set(weekend));
  return { windows: w, weekend, ahead };
}

/**
 * Översätt Umamis sidlista till innehåll: evenemang och platser.
 * Tål både statiska sidor (/evenemang/x.html, /plats/x) och SPA-vyer (/app/evenemang/x).
 */
export function readerFavourites(pages = [], { todayISO, list = ALL_EVENTS } = {}) {
  const bySlug = new Map(list.map((e) => [eventSlug(e), e]));
  const popularity = {};
  const items = new Map();
  for (const { key, n } of pages) {
    const m = String(key).match(/^\/(?:app\/)?(evenemang|plats)\/([a-z0-9-]+?)(?:\.html)?\/?$/i);
    if (!m) continue;
    const [, kind, slug] = m;
    if (kind === "evenemang") {
      const e = bySlug.get(slug);
      if (!e) continue;
      popularity[slug] = (popularity[slug] || 0) + n;
      if ((e.endDate || e.date) < todayISO) continue; // passerade tipsar vi inte om
      const id = `e:${slug}`;
      const prev = items.get(id);
      items.set(id, { kind, title: e.title, url: eventUrl(e), when: dayLabel(e.date), n: (prev?.n || 0) + n });
    } else {
      const p = placeBySlug(slug, places);
      if (!p) continue;
      const id = `p:${p.slug}`;
      const prev = items.get(id);
      items.set(id, { kind, title: p.name, url: `${SITE}/plats/${p.slug}.html`, short: p.short || "", n: (prev?.n || 0) + n });
    }
  }
  const top = [...items.values()].sort((a, b) => b.n - a.n).slice(0, 3);
  return { popularity, top };
}

/** Standardintro i jag-form när ingen handskriven intro skickas in. */
export function defaultIntro({ weekend, ahead, top }) {
  const p = [];
  const star = weekend[0] && [...weekend].sort((a, b) => /fri entré|gratis/i.test(b.note) - /fri entré|gratis/i.test(a.note))[0];
  const NUM = ["noll", "en", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio"];
  if (weekend.length) {
    const many = weekend.length > 1 ? `Jag har valt ut ${NUM[weekend.length] || weekend.length} saker, och hinner jag bara med en blir det nog ${star.title}.` : `Kalendern är lugn, men ${star.title} tänker jag inte missa.`;
    p.push(`Hej! Det här är vad jag har koll på inför helgen. ${many}`);
  } else {
    p.push(`Hej! Den här helgen är ovanligt tom i kalendern, så jag tittar lite längre fram i stället.`);
  }
  const hotEvent = top.find((t) => t.kind === "evenemang");
  if (hotEvent) p.push(`Många av er har klickat in på ${hotEvent.title} den senaste veckan. Jag förstår varför.`);
  else if (top[0]) p.push(`Det som lästs mest på sajten den senaste veckan är ${top[0].title}. Kul att se.`);
  if (ahead.length) p.push(`Längre ned hittar du också det som händer veckan efter, så du hinner planera.`);
  return p;
}

export function defaultSubject({ weekend, ahead }, todayISO) {
  const first = weekend[0] || ahead[0];
  if (!first) return "Brev från Juha: veckan i Vallentuna";
  return weekend.length > 1
    ? `Helgen i Vallentuna: ${first.title} och ${weekend.length - 1} till`
    : `Helgen i Vallentuna: ${first.title}`;
}

/* ---------------- HTML ---------------- */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export function utm(url, campaign) {
  const u = new URL(url);
  u.searchParams.set("utm_source", "nyhetsbrev");
  u.searchParams.set("utm_medium", "email");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

const C = { paper: "#F8F6F0", ink: "#16241B", soft: "#4C5A50", moss: "#2E6A45", line: "#E2DDD0", raps: "#F3C63F" };
const FONT = "Figtree,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

function eventBlock(e, campaign) {
  const where = venueName(e);
  const when = e.when || dayLabel(e.date);
  return `<tr><td style="padding:0 0 22px">
  <p style="margin:0 0 2px;font:600 12px/1.4 ${FONT};letter-spacing:.04em;text-transform:uppercase;color:${C.moss}">${esc(when)}${where ? ` · ${esc(where)}` : ""}</p>
  <p style="margin:0 0 4px;font:700 18px/1.3 ${FONT};color:${C.ink}"><a href="${esc(utm(eventUrl(e), campaign))}" style="color:${C.ink};text-decoration:none">${esc(e.title)}</a></p>
  <p style="margin:0;font:400 15px/1.55 ${FONT};color:${C.soft}">${esc(teaser(e.note))} <a href="${esc(utm(eventUrl(e), campaign))}" style="color:${C.moss}">Läs mer</a></p>
</td></tr>`;
}

const heading = (t) => `<tr><td style="padding:14px 0 14px"><p style="margin:0;font:700 13px/1.3 ${FONT};letter-spacing:.08em;text-transform:uppercase;color:${C.ink};border-bottom:2px solid ${C.raps};display:inline-block;padding-bottom:4px">${esc(t)}</p></td></tr>`;
const para = (t) => `<p style="margin:0 0 14px;font:400 16px/1.6 ${FONT};color:${C.ink}">${esc(t)}</p>`;

/**
 * Hela mejlet. Brevo ersätter {{ unsubscribe }} och {{ mirror }} vid utskick.
 */
export function renderHtml({ subject, preview, intro, weekend, ahead, top, campaign }) {
  const fav = top.length
    ? `${heading("Det ni läst mest den senaste veckan")}
<tr><td style="padding:0 0 18px"><ul style="margin:0;padding:0 0 0 18px;font:400 15px/1.6 ${FONT};color:${C.soft}">${top
        .map((t) => `<li style="margin:0 0 6px"><a href="${esc(utm(t.url, campaign))}" style="color:${C.moss};font-weight:600">${esc(t.title)}</a>${t.when ? ` (${esc(t.when)})` : t.short ? ` — ${esc(t.short)}` : ""}</li>`)
        .join("")}</ul></td></tr>`
    : "";
  return `<!doctype html>
<html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.paper}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 0 22px"><p style="margin:0;font:700 13px/1.3 ${FONT};letter-spacing:.08em;text-transform:uppercase;color:${C.moss}">Brev från Juha · Upptäck Vallentuna</p></td></tr>
<tr><td>${intro.map(para).join("\n")}</td></tr>
${weekend.length ? heading("I helgen") + weekend.map((e) => eventBlock(e, campaign)).join("\n") : ""}
${ahead.length ? heading("Lite längre fram") + ahead.map((e) => eventBlock(e, campaign)).join("\n") : ""}
${fav}
<tr><td style="padding:8px 0 26px">${para("Vet du något som borde vara med? Svara på det här mejlet, jag läser allt.")}${para("Vi ses därute,")}<p style="margin:0;font:700 16px/1.6 ${FONT};color:${C.ink}">Juha</p></td></tr>
<tr><td style="border-top:1px solid ${C.line};padding:16px 0 0;font:400 12px/1.6 ${FONT};color:${C.soft}">
Du får det här för att du anmält dig på <a href="${esc(utm(SITE, campaign))}" style="color:${C.soft}">upptackvallentuna.se</a>. Inga annonser, inget betalt. <a href="{{ unsubscribe }}" style="color:${C.soft}">Avsluta prenumerationen</a> · <a href="{{ mirror }}" style="color:${C.soft}">Visa i webbläsaren</a>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

/** Allt i ett: data in, utkast ut. */
export function buildDraft({ todayISO, pages = [], intro, subject, list = ALL_EVENTS }) {
  const fav = readerFavourites(pages, { todayISO, list });
  const picked = pickEvents(todayISO, { list, popularity: fav.popularity });
  const ctx = { ...picked, top: fav.top };
  const campaign = `brev-${todayISO}`;
  const introParas = intro?.length ? intro : defaultIntro(ctx);
  const subj = subject || defaultSubject(ctx, todayISO);
  const names = [...ctx.weekend, ...ctx.ahead].slice(0, 3).map((e) => e.title);
  const preview = (names.length ? `${names.join(", ")} och mer, utvalt av mig.` : teaser(introParas[0])).slice(0, 140);
  const html = renderHtml({ subject: subj, preview, intro: introParas, ...ctx, campaign });
  return { subject: subj, preview, intro: introParas, campaign, ...ctx, html };
}
