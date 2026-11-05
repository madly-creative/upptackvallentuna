import { describe, it, expect } from "vitest";
import {
  swedishHoliday,
  isOpenAt,
  H,
  ALWAYS,
  easterSunday,
  localISO,
  daySlot,
} from "../src/lib/hours.js";
import { PLACE_META } from "../src/data/placeMeta.js";
import { places } from "../src/data/places.js";

describe("swedish holidays", () => {
  it("flags Christmas Eve", () => {
    expect(swedishHoliday(new Date(2026, 11, 24))).toBe("Julafton");
  });

  it("computes Easter Sunday 2026", () => {
    expect(localISO(easterSunday(2026))).toBe("2026-04-05");
  });

  it("flags Good Friday from Easter", () => {
    expect(swedishHoliday(new Date(2026, 3, 3))).toBe("Långfredagen");
  });
});

describe("isOpenAt", () => {
  const cafe = { name: "Testfik", oh: 10, ch: 17 };
  const meta = {
    hours: [null, H(10, 17), H(10, 17), H(10, 17), H(10, 17), H(10, 17), H(10, 15)],
    holidayClosed: true,
  };

  it("open on a normal Tuesday morning", () => {
    // 2026-08-04 is a Tuesday
    const at = new Date(2026, 7, 4, 11, 0);
    expect(at.getDay()).toBe(2);
    expect(isOpenAt(cafe, meta, at)).toBe(true);
  });

  it("closed before opening", () => {
    const at = new Date(2026, 7, 4, 9, 0);
    expect(isOpenAt(cafe, meta, at)).toBe(false);
  });

  it("closed on Sunday when hours say null", () => {
    const at = new Date(2026, 7, 2, 12, 0); // Sunday
    expect(at.getDay()).toBe(0);
    expect(isOpenAt(cafe, meta, at)).toBe(false);
  });

  it("closed on Christmas Eve when holidayClosed", () => {
    const at = new Date(2026, 11, 24, 12, 0);
    expect(isOpenAt(cafe, meta, at)).toBe(false);
  });

  it("always-open outdoors stay open", () => {
    const park = { name: "Natur", oh: 0, ch: 24 };
    const at = new Date(2026, 11, 24, 12, 0);
    expect(isOpenAt(park, { hours: Array(7).fill(ALWAYS), holidayClosed: true }, at)).toBe(true);
  });

  it("stays open past midnight when close hour > 24", () => {
    // Fri 9–25 (= Sat 01:00). Sat 00:30 should still be open via overnight spill.
    const bar = { name: "Gästis", oh: 9, ch: 22 };
    const meta = {
      hours: [H(12, 22), H(9, 22), H(9, 22), H(9, 22), H(9, 22), H(9, 25), H(12, 25)],
      holidayClosed: true,
    };
    const satNight = new Date(2026, 7, 8, 0, 30); // Saturday 00:30
    expect(satNight.getDay()).toBe(6);
    expect(isOpenAt(bar, meta, satNight)).toBe(true);
    const satLate = new Date(2026, 7, 8, 1, 30); // after spill ends
    expect(isOpenAt(bar, meta, satLate)).toBe(false);
  });

  it("respects closedFrom/closedTo for Grävelsta and Kulturhus", () => {
    const gravelsta = places.find((p) => p.name === "Grävelsta Gård");
    const kulturhus = places.find((p) => p.name === "Vallentuna Kulturhus");
    const satAug8 = new Date(2026, 7, 8, 12, 0);
    expect(satAug8.getDay()).toBe(6);
    expect(isOpenAt(gravelsta, PLACE_META["Grävelsta Gård"], satAug8)).toBe(false);
    expect(isOpenAt(kulturhus, PLACE_META["Vallentuna Kulturhus"], satAug8)).toBe(false);
    // Grävelsta opens again after 29/8 — Saturday 5 Sep 12:00
    const satSep5 = new Date(2026, 8, 5, 12, 0);
    expect(satSep5.getDay()).toBe(6);
    expect(isOpenAt(gravelsta, PLACE_META["Grävelsta Gård"], satSep5)).toBe(true);
  });

  it("Kvarnbadet is closed; season is June–August", () => {
    const bad = places.find((p) => p.name === "Kvarnbadet");
    const meta = PLACE_META.Kvarnbadet;
    expect(meta.hours.every((slot) => slot == null)).toBe(true);
    expect(meta.seasonNote).toMatch(/juni–augusti/);
    const thuNov5 = new Date(2026, 10, 5, 12, 0);
    expect(thuNov5.getDay()).toBe(4);
    expect(isOpenAt(bad, meta, thuNov5)).toBe(false);
    expect(daySlot(bad, meta, 4, thuNov5)).toBe(null);
  });

  it("Gästis, Kristorante, Jano, Hökeriet and Roslagsloppis match November 2026 hours", () => {
    const gastis = places.find((p) => p.name === "Gästis Kök & Bar");
    const kristo = places.find((p) => p.name === "Kristorante");
    const jano = places.find((p) => p.name === "Jano");
    const hok = places.find((p) => p.name === "Hökeriet");
    const loppis = places.find((p) => p.name === "Roslagsloppis");
    const thuNov5 = new Date(2026, 10, 5, 12, 0);
    const friLate = new Date(2026, 10, 7, 2, 0); // Saturday 02:00, still Friday's 10–03
    const monLunch = new Date(2026, 10, 2, 13, 0);
    const monAfter = new Date(2026, 10, 2, 15, 0);
    const sunNov8 = new Date(2026, 10, 8, 12, 0);
    const satNov7 = new Date(2026, 10, 7, 13, 0);

    expect(isOpenAt(gastis, PLACE_META["Gästis Kök & Bar"], thuNov5)).toBe(true);
    expect(isOpenAt(gastis, PLACE_META["Gästis Kök & Bar"], friLate)).toBe(true);
    expect(daySlot(gastis, PLACE_META["Gästis Kök & Bar"], 5).c).toBe(27);

    expect(isOpenAt(kristo, PLACE_META.Kristorante, monLunch)).toBe(true);
    expect(isOpenAt(kristo, PLACE_META.Kristorante, monAfter)).toBe(false);
    expect(daySlot(kristo, PLACE_META.Kristorante, 0)).toEqual(H(11, 21));

    expect(isOpenAt(jano, PLACE_META.Jano, sunNov8)).toBe(false);
    expect(PLACE_META.Jano.hours.every((slot) => slot == null)).toBe(true);

    expect(isOpenAt(hok, PLACE_META.Hökeriet, satNov7)).toBe(true);
    expect(isOpenAt(hok, PLACE_META.Hökeriet, thuNov5)).toBe(false);
    expect(PLACE_META.Hökeriet.seasonNote).not.toMatch(/sommar/i);

    expect(isOpenAt(loppis, PLACE_META.Roslagsloppis, sunNov8)).toBe(false);
    expect(PLACE_META.Roslagsloppis.hours[0]).toBe(null);
  });
});
