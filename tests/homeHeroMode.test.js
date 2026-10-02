import { describe, it, expect } from "vitest";
import {
  resolveHomeHeroMode,
  resolvePreviewTodayISO,
  resolveHeroPad,
  homeHeroCarouselEvents,
  HOME_HERO_DEFAULT,
  HOME_HERO_STORAGE_KEY,
} from "../src/lib/homeHeroMode.js";

describe("homeHeroMode", () => {
  it("defaults to the experiment mode", () => {
    expect(HOME_HERO_DEFAULT).toBe("events");
    expect(resolveHomeHeroMode({ search: "", storage: null })).toBe("events");
  });

  it("URL param wins and can persist", () => {
    const store = {
      data: {},
      getItem(k) {
        return this.data[k] ?? null;
      },
      setItem(k, v) {
        this.data[k] = String(v);
      },
    };
    expect(resolveHomeHeroMode({ search: "?hero=classic", storage: store })).toBe("classic");
    expect(store.data[HOME_HERO_STORAGE_KEY]).toBe("classic");
    expect(resolveHomeHeroMode({ search: "", storage: store })).toBe("classic");
    expect(resolveHomeHeroMode({ search: "?hero=events", storage: store })).toBe("events");
  });

  it("ignores unknown hero values", () => {
    expect(resolveHomeHeroMode({ search: "?hero=weird", storage: null })).toBe(HOME_HERO_DEFAULT);
  });

  it("resolves preview date and pad", () => {
    expect(resolvePreviewTodayISO({ search: "?date=2026-10-17" })).toBe("2026-10-17");
    expect(resolvePreviewTodayISO({ search: "?date=nope" })).toBe(null);
    expect(resolveHeroPad({ search: "?heroPad=3" })).toBe(3);
    expect(resolveHeroPad({ search: "" })).toBe(0);
  });

  it("groups same-day hero events and can pad", () => {
    const list = [
      { title: "A", date: "2026-10-17", time: "12:00" },
      { title: "B", date: "2026-10-17", time: "19:00" },
      { title: "C", date: "2026-10-18", time: "18:30" },
      { title: "D", date: "2026-10-23", time: "19:00" },
    ];
    const same = homeHeroCarouselEvents(list, "2026-10-17");
    expect(same.map((e) => e.title)).toEqual(["A", "B"]);
    const padded = homeHeroCarouselEvents(list, "2026-10-17", { padTo: 3 });
    expect(padded.map((e) => e.title)).toEqual(["A", "B", "C"]);
    expect(padded.every((e) => e.date === "2026-10-17")).toBe(true);
  });
});
