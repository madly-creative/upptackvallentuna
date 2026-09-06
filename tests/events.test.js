import { describe, it, expect } from "vitest";
import {
  events,
  upcomingEvents,
  eventSlug,
  EVENT_CONTENT,
  groupEventsByMonth,
  eventMonthLabel,
  addDaysISO,
  weekendRangeISO,
  eventMatchesTimeFilter,
  nearestEvents,
} from "../src/data/events.js";

describe("events calendar", () => {
  it("has a filled calendar (10+ events)", () => {
    expect(events.length).toBeGreaterThanOrEqual(10);
  });

  it("every event has required fields", () => {
    for (const e of events) {
      expect(e.title).toBeTruthy();
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(e.host).toBeTruthy();
      expect(e.cat).toBeTruthy();
      expect(e.img).toMatch(/^\//);
    }
  });

  it("events are unique by title+date", () => {
    const keys = events.map((e) => `${e.title}||${e.date}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("upcomingEvents filters past dates", () => {
    const live = upcomingEvents("2026-09-01");
    expect(live.every((e) => e.date >= "2026-09-01")).toBe(true);
    expect(live.some((e) => e.title.includes("Smaka"))).toBe(false);
    expect(live.some((e) => e.title === "Vallentuna Höstmarknad")).toBe(true);
  });

  it("groups upcoming events by month in order", () => {
    expect(eventMonthLabel("2026-09")).toBe("September");
    expect(eventMonthLabel("2026-12", { showYear: true })).toBe("December 2026");
    const groups = groupEventsByMonth(upcomingEvents("2026-09-01"));
    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(groups[0].label).toBe("September");
    expect(groups.every((g, i) => i === 0 || g.key >= groups[i - 1].key)).toBe(true);
    expect(groups.flatMap((g) => g.events).length).toBe(upcomingEvents("2026-09-01").length);
  });

  it("weekend and time filters work", () => {
    expect(addDaysISO("2026-09-04", 1)).toBe("2026-09-05");
    // Friday 4 Sep 2026
    expect(weekendRangeISO("2026-09-04")).toEqual({ start: "2026-09-04", end: "2026-09-06" });
    // Wednesday 2 Sep → upcoming Fri–Sun
    expect(weekendRangeISO("2026-09-02")).toEqual({ start: "2026-09-04", end: "2026-09-06" });
    // Sunday clips start to today
    expect(weekendRangeISO("2026-09-06")).toEqual({ start: "2026-09-06", end: "2026-09-06" });

    const host = { date: "2026-09-19", title: "Vallentuna Höstmarknad" };
    const jul = { date: "2026-12-12", title: "Jul" };
    expect(eventMatchesTimeFilter(host, "manad", "2026-09-01")).toBe(true);
    expect(eventMatchesTimeFilter(jul, "manad", "2026-09-01")).toBe(false);
    expect(eventMatchesTimeFilter(jul, "senare", "2026-09-01")).toBe(true);
    expect(eventMatchesTimeFilter(host, "helg", "2026-09-18")).toBe(true);
    expect(eventMatchesTimeFilter(host, "helg", "2026-09-04")).toBe(false);
  });

  it("nearestEvents prefers the coming week", () => {
    const live = upcomingEvents("2026-09-01");
    const next = nearestEvents(live, "2026-09-01", { withinDays: 7, limit: 3 });
    expect(next.length).toBeGreaterThan(0);
    expect(next.length).toBeLessThanOrEqual(3);
    expect(next.every((e) => e.date >= "2026-09-01")).toBe(true);
  });

  it("has EVENT_CONTENT for flagship events", () => {
    expect(EVENT_CONTENT["Smaka på Vallentuna"]).toBeTruthy();
    expect(EVENT_CONTENT["Höstfest / Skördefest i Lindholmen"]).toBeTruthy();
    expect(EVENT_CONTENT["Vallentuna Höstmarknad"]).toBeTruthy();
    expect(EVENT_CONTENT["Vallentuna Julmarknad"]).toBeTruthy();
    expect(EVENT_CONTENT["Jano — Sylvia Vrethammar"]).toBeTruthy();
    expect(EVENT_CONTENT["Sommarbuffé på Hökeriet"]).toBeTruthy();
    expect(EVENT_CONTENT["Granby Vikingagård — guidad visning"]).toBeTruthy();
  });

  it("Hemmaplan marknader match official 2026 dates", () => {
    const host = events.find((e) => e.title === "Vallentuna Höstmarknad");
    const jul = events.find((e) => e.title === "Vallentuna Julmarknad");
    expect(host?.date).toBe("2026-09-19");
    expect(host?.source).toContain("hemmaplanmedia.se");
    expect(jul?.date).toBe("2026-12-12");
    expect(jul?.source).toContain("hemmaplanmedia.se");
    expect(events.some((e) => /skördefest/i.test(e.title) && e.host.includes("Centrum"))).toBe(
      false
    );
  });

  it("eventSlug is url-safe", () => {
    const s = eventSlug(events[0]);
    expect(s).toMatch(/^[a-z0-9-]+$/);
  });
});
