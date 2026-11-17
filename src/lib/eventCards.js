/**
 * Gemensam kortmall för evenemangskalendern (evx-*): används både av den statiska
 * evenemang.html (scripts/generate-seo.mjs) och av appens vy "Händer i …" (src/js/app.js).
 * Beteendet (datumremsa, filter, omgruppering) ligger i src/lib/eventsPage.js.
 */
import { eventSlug, groupEventsByMonth } from "../data/events.js";

const DAYS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const evxIsFree = (e) => /fri entré|gratis/i.test(e.note || "");
export const evxIsJul = (e) => /jul/i.test(e.title || "");

/** "17:00 – 19:00" → "17–19"; flerdagars ("Fre–sön 14–16 aug") visas som de står. */
export function evxShortTime(e) {
  const when = String(e.when || "");
  if (when && !when.includes(" · ")) return when;
  const t = String(e.time || when.split(" · ")[1] || "");
  return t.replace(/:00/g, "").replace(/\s*–\s*/, "–");
}

export function evxCardHTML(e) {
  const d = new Date(`${e.date}T12:00:00`);
  const free = evxIsFree(e);
  const jul = evxIsJul(e);
  const badges = [free && "Gratis", e.kids && "Barn"].filter(Boolean);
  return `<a class="evx-card" href="/evenemang/${eventSlug(e)}.html" data-date="${esc(e.date)}" data-end="${esc(e.endDate || e.date)}" data-key="${esc(`${e.title}||${e.date}`)}"${free ? " data-free" : ""}${e.kids ? " data-kids" : ""}${jul ? " data-jul" : ""}>
          <span class="evx-ph"><img src="${esc(e.img)}" alt="" loading="lazy" decoding="async" width="560" height="420"><span class="evx-cal"><b>${d.getDate()}</b><span>${DAYS[d.getDay()]}</span></span>${badges.length ? `<span class="evx-badges">${badges.map((x) => `<i>${x}</i>`).join("")}</span>` : ""}</span>
          <span class="evx-body"><span class="evx-time">${esc(evxShortTime(e))}</span><h3>${esc(e.title)}</h3><span class="evx-host">${esc(String(e.host || "").split(" / ")[0])}</span></span>
        </a>`;
}

const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const noon = (iso) => new Date(`${iso}T12:00:00`);

/** Den här veckan, nästa vecka, sedan per månad (samma regler som eventsPage.js). */
export function evxGroups(list, todayISO) {
  const t = noon(todayISO);
  const mon = new Date(t);
  mon.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  const next = new Date(mon);
  next.setDate(mon.getDate() + 7);
  const after = new Date(mon);
  after.setDate(mon.getDate() + 14);
  const groups = [];
  for (const e of list) {
    const d = noon(e.date) < t ? t : noon(e.date);
    let key;
    let label;
    if (d < next) [key, label] = ["vecka", "Den här veckan"];
    else if (d < after) [key, label] = ["nasta", "Nästa vecka"];
    else {
      key = e.date.slice(0, 7);
      const m = MONTHS[d.getMonth()];
      label = m[0].toUpperCase() + m.slice(1) + (d.getFullYear() !== t.getFullYear() ? ` ${d.getFullYear()}` : "");
    }
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, label, events: [] }));
    g.events.push(e);
  }
  return groups;
}

/**
 * Hela kalendern: rubrik, remsa, filter, kortrader, arkiv och tips.
 * @param {object[]} allEvents alla evenemang (passerade hamnar i arkivet)
 * @param {{ todayISO: string, title: string, tipHref?: string }} opts
 */
export function evxPageHTML(allEvents, { todayISO, title, tipHref = "/#skicka" }) {
  const sorted = allEvents
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.time || "").localeCompare(String(b.time || "")));
  const upcoming = sorted.filter((e) => (e.endDate || e.date) >= todayISO);
  const past = sorted.filter((e) => (e.endDate || e.date) < todayISO);
  const rails = evxGroups(upcoming, todayISO)
    .map(
      (g) => `    <section class="evx-grp" data-key="${esc(g.key)}" aria-labelledby="evx-h-${esc(g.key)}">
      <div class="evx-grp-h"><h2 id="evx-h-${esc(g.key)}">${esc(g.label)} <small>${g.events.length} st</small></h2><div class="evx-nav" hidden><button type="button" data-dir="-1" aria-label="Föregående">←</button><button type="button" data-dir="1" aria-label="Nästa">→</button></div></div>
      <div class="evx-rail">
        ${g.events.map(evxCardHTML).join("\n        ")}
      </div>
    </section>`
    )
    .join("\n");
  const archive = groupEventsByMonth(past)
    .map(
      (g) => `        <li><b>${esc(g.label)}</b> ${g.events
        .map((e) => `<a href="/evenemang/${eventSlug(e)}.html">${esc(e.title)}</a>`)
        .join('<span aria-hidden="true"> · </span>')}</li>`
    )
    .join("\n");
  return `    <div class="evx-head">
      <h1>${title}</h1>
      <p class="evx-next">${upcoming.length} evenemang på gång i bygden, handplockade från arrangörerna.</p>
    </div>
    <div class="evx-bar">
      <div class="evx-strip" aria-label="Datum de kommande sex veckorna"></div>
      <div class="evx-chips" role="group" aria-label="Filtrera evenemang">
        <button type="button" class="evx-chip" data-f="alla" aria-pressed="true">Alla</button>
        <button type="button" class="evx-chip" data-f="helg" aria-pressed="false">I helgen <em></em></button>
        <button type="button" class="evx-chip" data-f="gratis" aria-pressed="false">Gratis <em></em></button>
        <button type="button" class="evx-chip" data-f="barn" aria-pressed="false">Med barn <em></em></button>
        <button type="button" class="evx-chip" data-f="jul" aria-pressed="false">Jul <em></em></button>
      </div>
    </div>
    <div class="evx-list">
${rails}
    </div>
    <p class="evx-empty" hidden>Inget som matchar just nu. <button type="button" class="lnk" data-f="alla">Visa alla</button></p>
    <div class="evx-extra"></div>
    <div class="evx-foot">
      <details class="evx-archive">
        <summary><b>Tidigare i år</b> <span class="evx-past-count">${past.length}</span> evenemang som redan har varit</summary>
        <ul>
${archive}
        </ul>
      </details>
      <a class="evx-tip" href="${esc(tipHref)}"><b>Saknas något?</b><span>Tipsa om ett evenemang så lägger vi in det. Uppgifterna kommer från arrangörerna, så kolla alltid källan närmare datum.</span></a>
    </div>
`;
}
