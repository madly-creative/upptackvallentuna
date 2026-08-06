/**
 * Återkommande aktiviteter — en post per aktivitet (inte per tillfälle).
 * weekday: 0 = söndag … 6 = lördag (Europe/Stockholm “idag” uses the same).
 */
import { formatWeekday } from "./stockholm.js";

export const recurring = [
  {
    slug: "socialdans-tisdag",
    title: "Socialdans",
    weekday: 2,
    start: "19:00",
    end: "22:00",
    whenLabel: "Varje tisdag 19–22",
    place: "Vallentuna Kulturhus",
    host: "Dans i Vallentuna",
    note: "Öppen socialdans för alla nivåer. Kom som du är — ingen partner krävs. Kolla anslagstavlan i foajén för eventuella uppehåll.",
    img: "/assets/upplev/vallentuna-kulturhus/cover.webp",
    source: "",
  },
];

export function recurringSlug(r) {
  return r.slug || String(r.title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function recurringToday(weekday, list = recurring) {
  return list.filter((r) => Number(r.weekday) === Number(weekday));
}

/** Display line from structured fields when whenLabel is missing. */
export function recurringWhenLine(r) {
  if (r.whenLabel) return r.whenLabel;
  const day = formatWeekday(r.weekday, { capitalize: true });
  if (r.start && r.end) return `Varje ${day.toLowerCase()} ${r.start}–${r.end}`;
  if (r.start) return `Varje ${day.toLowerCase()} från ${r.start}`;
  return day ? `Varje ${day.toLowerCase()}` : "";
}
