import { describe, it, expect } from "vitest";
import { events, upcomingEvents, eventSlug, EVENT_CONTENT } from "../src/data/events.js";

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
    expect(live.some((e) => e.title.includes("Skörde"))).toBe(true);
  });

  it("has EVENT_CONTENT for flagship events", () => {
    expect(EVENT_CONTENT["Smaka på Vallentuna"]).toBeTruthy();
    expect(EVENT_CONTENT["Skördefest i Lindholmen"]).toBeTruthy();
  });

  it("eventSlug is url-safe", () => {
    const s = eventSlug(events[0]);
    expect(s).toMatch(/^[a-z0-9-]+$/);
  });
});
