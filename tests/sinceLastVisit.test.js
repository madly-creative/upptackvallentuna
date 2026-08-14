import { describe, it, expect } from "vitest";
import {
  LS_LAST_VISIT,
  isKnownVisitor,
  resolveVisitState,
  writeLastVisit,
  isAfterLastVisit,
  collectSinceLastDelta,
  deltaIsEmpty,
  placeGroupLabel,
  eventGroupLabel,
} from "../src/lib/sinceLastVisit.js";

function mockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    _map: map,
  };
}

describe("sinceLastVisit", () => {
  it("detects known visitors via existing keys", () => {
    expect(isKnownVisitor(mockStorage({ vii_favs_v1: "[]" }))).toBe(true);
    expect(isKnownVisitor(mockStorage({ uv_lists_v1: "{}" }))).toBe(true);
    expect(isKnownVisitor(mockStorage({}))).toBe(false);
    expect(isKnownVisitor(null)).toBe(false);
  });

  it("bootstraps when uv_last_visit is missing (first visit)", () => {
    const s = mockStorage({});
    const state = resolveVisitState(s);
    expect(state.mode).toBe("bootstrap");
    expect(state.knownVisitor).toBe(false);
  });

  it("bootstraps known visitor missing uv_last_visit (launch migration)", () => {
    const s = mockStorage({
      vii_favs_v1: JSON.stringify(["Jano"]),
      vii_last_place_v1: JSON.stringify({ name: "Jano", at: "2026-08-01T10:00:00.000Z" }),
    });
    const state = resolveVisitState(s);
    expect(state.mode).toBe("bootstrap");
    expect(state.knownVisitor).toBe(true);
    // Must NOT use last_place.at for comparison — would false-delta seeded addedDates.
    expect(state.lastVisitISO).toBeUndefined();
  });

  it("compares when uv_last_visit exists", () => {
    const s = mockStorage({ [LS_LAST_VISIT]: "2026-08-01T12:00:00.000Z" });
    const state = resolveVisitState(s);
    expect(state.mode).toBe("compare");
    expect(state.lastVisitISO).toBe("2026-08-01T12:00:00.000Z");
  });

  it("bootstraps when storage is unavailable", () => {
    expect(resolveVisitState(null).mode).toBe("bootstrap");
  });

  it("isAfterLastVisit compares Stockholm calendar days", () => {
    // Visit Aug 1 → Aug 14 listing is new
    expect(isAfterLastVisit("2026-08-14", "2026-08-01T12:00:00.000Z")).toBe(true);
    // Visit Aug 14 → same-day listing is NOT new (avoids noon race)
    expect(isAfterLastVisit("2026-08-14", "2026-08-14T08:00:00.000Z")).toBe(false);
    expect(isAfterLastVisit("2026-07-10", "2026-08-01T12:00:00.000Z")).toBe(false);
    expect(isAfterLastVisit(undefined, "2026-08-01T12:00:00.000Z")).toBe(false);
  });

  it("collectSinceLastDelta only includes items with addedDate after visit", () => {
    const places = [{ name: "Vasakullen" }, { name: "Jano" }, { name: "Old Place" }];
    const placeMeta = {
      Vasakullen: { addedDate: "2026-08-14" },
      Jano: { addedDate: "2026-08-06" },
      // Old Place: no addedDate
    };
    const events = [
      { title: "Living Room Concert", date: "2026-08-18", addedDate: "2026-08-14" },
      { title: "Old Jazz", date: "2026-08-07" }, // no addedDate
    ];
    const delta = collectSinceLastDelta({
      places,
      placeMeta,
      events,
      lastVisitISO: "2026-08-10T12:00:00.000Z",
    });
    expect(delta.places.map((p) => p.name)).toEqual(["Vasakullen"]);
    expect(delta.events.map((e) => e.title)).toEqual(["Living Room Concert"]);
    expect(deltaIsEmpty(delta)).toBe(false);
  });

  it("empty delta when nothing newer", () => {
    const delta = collectSinceLastDelta({
      places: [{ name: "Jano" }],
      placeMeta: { Jano: { addedDate: "2026-08-06" } },
      events: [],
      lastVisitISO: "2026-08-20T12:00:00.000Z",
    });
    expect(deltaIsEmpty(delta)).toBe(true);
  });

  it("writeLastVisit stores ISO string", () => {
    const s = mockStorage({});
    const now = new Date("2026-08-14T15:30:00.000Z");
    expect(writeLastVisit(s, now)).toBe(true);
    expect(s.getItem(LS_LAST_VISIT)).toBe("2026-08-14T15:30:00.000Z");
  });

  it("labels pluralize in Swedish", () => {
    expect(placeGroupLabel(1)).toBe("1 nytt ställe");
    expect(placeGroupLabel(3)).toBe("3 nya ställen");
    expect(eventGroupLabel(1)).toBe("1 nytt evenemang");
    expect(eventGroupLabel(2)).toBe("2 nya evenemang");
  });

  it("launch path: known visitor + seeded history → bootstrap then no false delta", () => {
    const s = mockStorage({ vii_favs_v1: "[]" });
    const state = resolveVisitState(s);
    expect(state.mode).toBe("bootstrap");
    const now = new Date("2026-08-14T11:00:00.000Z");
    writeLastVisit(s, now);
    // Even with many historical addedDates, after bootstrap compare against *now* → empty
    const delta = collectSinceLastDelta({
      places: [{ name: "Vasakullen" }, { name: "Antikladan" }],
      placeMeta: {
        Vasakullen: { addedDate: "2026-08-14" },
        Antikladan: { addedDate: "2026-06-28" },
      },
      events: [{ title: "X", date: "2026-08-18", addedDate: "2026-08-10" }],
      lastVisitISO: s.getItem(LS_LAST_VISIT),
    });
    expect(deltaIsEmpty(delta)).toBe(true);
  });
});
