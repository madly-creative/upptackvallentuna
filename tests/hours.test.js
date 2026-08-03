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

  it("Kvarnbadet closes 19:00 Mon–Thu during v.33–35", () => {
    const bad = places.find((p) => p.name === "Kvarnbadet");
    const meta = PLACE_META.Kvarnbadet;
    const monAug10 = new Date(2026, 7, 10, 20, 0); // Mon 20:00 — closed under override
    expect(monAug10.getDay()).toBe(1);
    expect(isOpenAt(bad, meta, monAug10)).toBe(false);
    expect(daySlot(bad, meta, 1, monAug10).c).toBe(19);
    // Before override window: Mon 3 Aug 20:00 still open until 21
    const monAug3 = new Date(2026, 7, 3, 20, 0);
    expect(isOpenAt(bad, meta, monAug3)).toBe(true);
    expect(daySlot(bad, meta, 1, monAug3).c).toBe(21);
  });
});
