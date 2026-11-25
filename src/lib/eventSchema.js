/**
 * Event-schema (schema.org/Event) och "har passerat"-logik för de statiska
 * evenemangssidorna. Ren logik utan DOM — körs i generate-seo.mjs och i tester.
 */
import { EVENT_VENUES } from "../data/eventVenues.js";

/** Sista söndagen i en månad (UTC-dag), för svensk sommartid. */
function lastSunday(year, monthIdx) {
  const d = new Date(Date.UTC(year, monthIdx + 1, 0));
  return d.getUTCDate() - d.getUTCDay();
}

/**
 * UTC-offset för Europe/Stockholm en viss dag och tid ("+01:00" / "+02:00").
 * Sommartid: sista söndagen i mars 02:00 → sista söndagen i oktober 03:00.
 */
export function stockholmOffset(dateISO, hhmm = "12:00") {
  const [y, m, d] = dateISO.split("-").map(Number);
  const h = Number(hhmm.slice(0, 2));
  const startDay = lastSunday(y, 2);
  const endDay = lastSunday(y, 9);
  let summer;
  if (m > 3 && m < 10) summer = true;
  else if (m < 3 || m > 10) summer = false;
  else if (m === 3) summer = d > startDay || (d === startDay && h >= 2);
  else summer = d < endDay || (d === endDay && h < 3);
  return summer ? "+02:00" : "+01:00";
}

/**
 * Klockslag ur `time`: "19:00 – 21:00" → {start, end}, "18:30" → {start}.
 * Fritext ("Vecka", "Matcher kväll/helg") och tider med tillägg som "(sön)"
 * ger inga klockslag — då anges bara datum.
 */
export function parseEventTime(time) {
  const m = String(time || "").trim().match(/^(\d{1,2}):(\d{2})(?:\s*[–-]\s*(\d{1,2}):(\d{2}))?$/);
  if (!m) return {};
  const fmt = (h, mm) => `${String(h).padStart(2, "0")}:${mm}`;
  return { start: fmt(m[1], m[2]), ...(m[3] ? { end: fmt(m[3], m[4]) } : {}) };
}

const withTime = (date, hhmm) => `${date}T${hhmm}:00${stockholmOffset(date, hhmm)}`;

/** startDate/endDate i ISO 8601 med tidszon när klockslag finns. */
export function eventDates(e) {
  const { start, end } = parseEventTime(e.time);
  const endDay = e.endDate || e.date;
  if (!start) return { startDate: e.date, ...(e.endDate ? { endDate: e.endDate } : {}) };
  return {
    startDate: withTime(e.date, start),
    ...(end ? { endDate: withTime(endDay, end) } : e.endDate ? { endDate: e.endDate } : {}),
  };
}

/** Sista dagen evenemanget pågår (flerdagars via `endDate`). */
export const eventLastDay = (e) => e.endDate || e.date;

/** Passerat = sista dagen är före idag (Stockholm-datum, YYYY-MM-DD). */
export const isPastEvent = (e, todayISO) => eventLastDay(e) < todayISO;

/** Serienamn: "Bio Halvåtta: Arkipelag" → "bio halvatta", "Jano — X" → "jano". */
export function eventSeriesKey(title) {
  return String(title)
    .split(/:\s| [—–-] /)[0]
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b20\d\d\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Nästa kommande tillfälle i samma serie (eller samma titel), annars null. */
export function nextEdition(e, list, todayISO) {
  const key = eventSeriesKey(e.title);
  if (!key) return null;
  return (
    list
      .filter((x) => x !== e && !isPastEvent(x, todayISO) && eventSeriesKey(x.title) === key)
      .sort((a, b) => a.date.localeCompare(b.date))[0] || null
  );
}

/** schema.org/Place för evenemangets plats (inte arrangören). */
export function eventLocation(e, { places = [], kommun = "Vallentuna", placeUrl } = {}) {
  const v = EVENT_VENUES[e.venue];
  if (!v) throw new Error(`Evenemang "${e.title}" (${e.date}) saknar känd venue: ${e.venue}`);
  const place = v.place ? places.find((p) => p.name === v.place) : null;
  return {
    "@type": "Place",
    name: v.name,
    address: {
      "@type": "PostalAddress",
      ...(v.streetAddress ? { streetAddress: v.streetAddress } : {}),
      ...(v.postalCode ? { postalCode: v.postalCode } : {}),
      addressLocality: v.addressLocality || kommun,
      addressRegion: "Stockholms län",
      addressCountry: "SE",
    },
    ...(place && typeof place.lat === "number"
      ? { geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng } }
      : {}),
    ...(place && placeUrl ? { url: placeUrl(place) } : {}),
  };
}

/** Fullt Event-objekt för JSON-LD. */
export function eventJsonLd(e, { canonical, image, places, kommun, placeUrl }) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.note,
    ...eventDates(e),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    image,
    url: canonical,
    location: eventLocation(e, { places, kommun, placeUrl }),
    organizer: { "@type": "Organization", name: e.host },
    ...(e.source ? { sameAs: [e.source] } : {}),
  };
}
