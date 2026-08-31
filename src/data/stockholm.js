/** Calendar helpers in Europe/Stockholm (site locale). */

const TZ = "Europe/Stockholm";

/** weekday 0 = Sunday … 6 = Saturday (JS / schema convention). */
const WEEKDAY_SV = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const WEEKDAY_SV_CAP = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
const WEEKDAY_SCHEMA = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Display order for hours tables: Monday → Sunday (Swedish convention). */
export const WEEKDAY_ORDER_MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

/** Single formatter for stored weekday numbers 0–6. */
export function formatWeekday(n, { capitalize = false } = {}) {
  const i = Number(n);
  if (!Number.isInteger(i) || i < 0 || i > 6) return "";
  return capitalize ? WEEKDAY_SV_CAP[i] : WEEKDAY_SV[i];
}

export function schemaWeekday(n) {
  const i = Number(n);
  if (!Number.isInteger(i) || i < 0 || i > 6) return null;
  return `https://schema.org/${WEEKDAY_SCHEMA[i]}`;
}

/** Weekday 0–6 in Europe/Stockholm for an instant (default: now). */
export function stockholmWeekday(date = new Date()) {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}

/** YYYY-MM-DD in Europe/Stockholm. */
export function stockholmTodayISO(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function stockholmHourMinute(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return { hour, minute };
}

/** 0-based month in Europe/Stockholm. */
export function stockholmMonth(date = new Date()) {
  return (
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        month: "numeric",
      }).format(date)
    ) - 1
  );
}
