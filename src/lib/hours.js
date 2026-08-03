/** Pure opening-hours helpers (testable, timezone-local Date). */

export function easterSunday(y) {
  const a = y % 19,
    b = Math.floor(y / 100),
    c = y % 100,
    d = Math.floor(b / 4),
    e = b % 4,
    f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30,
    i = Math.floor(c / 4),
    k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7,
    m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31),
    date = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, date);
}

export function localISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function swedishHoliday(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear(),
    m = d.getMonth() + 1,
    dd = d.getDate();
  const fixed = {
    "01-01": "Nyårsdagen",
    "01-06": "Trettondedag jul",
    "05-01": "Första maj",
    "06-06": "Nationaldagen",
    "12-24": "Julafton",
    "12-25": "Juldagen",
    "12-26": "Annandag jul",
    "12-31": "Nyårsafton",
  };
  const key = String(m).padStart(2, "0") + "-" + String(dd).padStart(2, "0");
  if (fixed[key]) return fixed[key];
  if (m === 6 && dd >= 19 && dd <= 25 && d.getDay() === 5) return "Midsommarafton";
  if (m === 6 && dd >= 20 && dd <= 26 && d.getDay() === 6) return "Midsommardagen";
  const easter = easterSunday(y);
  const map = [
    [addDays(easter, -2), "Långfredagen"],
    [addDays(easter, 0), "Påskdagen"],
    [addDays(easter, 1), "Annandag påsk"],
    [addDays(easter, 39), "Kristi himmelsfärdsdag"],
    [addDays(easter, 49), "Pingstdagen"],
  ];
  for (const [dt, name] of map) {
    if (localISO(dt) === localISO(d)) return name;
  }
  if (m === 10 && dd === 4) return "Kanelbullens dag";
  if (m === 11 && dd >= 27 && d.getDay() === 0) return "Första advent";
  if (m === 12 && dd <= 3 && d.getDay() === 0) return "Första advent";
  return null;
}

export const ALWAYS = "always";
export function H(o, c) {
  return { o, c };
}

/** Inclusive YYYY-MM-DD range check (local calendar date). */
export function inDateRange(at, from, to) {
  if (!from && !to) return false;
  const iso = localISO(at);
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

/** Temporary full closure (e.g. summer shutdown, renovation). */
export function isTemporarilyClosed(meta, at) {
  if (!meta?.closedFrom && !meta?.closedTo) return false;
  return inDateRange(at, meta.closedFrom || null, meta.closedTo || null);
}

/**
 * @param {object} place { oh, ch, name }
 * @param {object|null} meta PLACE_META row with optional hours[0..6]
 * @param {number} dow 0=Sun
 * @param {Date|null} at optional date for hoursOverride window
 */
export function daySlot(place, meta, dow, at = null) {
  let hours = meta?.hours;
  if (
    at instanceof Date &&
    meta?.hoursOverride?.hours &&
    inDateRange(at, meta.hoursOverride.from, meta.hoursOverride.to)
  ) {
    hours = meta.hoursOverride.hours;
  }
  if (hours) return hours[dow];
  if (place.oh === 0 && place.ch === 24) return ALWAYS;
  return H(place.oh, place.ch);
}

export function isOpenAt(place, meta, at) {
  if (!(at instanceof Date)) return false;
  if (isTemporarilyClosed(meta, at)) return false;
  const hol = swedishHoliday(at);
  const slot = daySlot(place, meta, at.getDay(), at);
  if (hol && meta?.holidayClosed !== false && meta?.hours && slot !== ALWAYS) {
    return false;
  }
  if (slot === ALWAYS) return true;
  const mins = at.getHours() * 60 + at.getMinutes();
  if (slot && mins >= slot.o * 60 && mins < slot.c * 60) return true;
  // Overnight spill: c > 24 means open past midnight (e.g. 25 → 01:00)
  const prev = daySlot(place, meta, (at.getDay() + 6) % 7, at);
  if (prev && prev !== ALWAYS && prev?.c > 24 && mins < (prev.c - 24) * 60) {
    if (hol && meta?.holidayClosed !== false && meta?.hours) return false;
    return true;
  }
  return false;
}
