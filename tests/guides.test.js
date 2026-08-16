import { describe, it, expect } from "vitest";
import {
  guides,
  currentSeasonKey,
  featuredGuide,
  guideBySlug,
  GUIDE_HOME_FILTERS,
  guidesForHomeFilter,
} from "../src/data/guides.js";
import { places } from "../src/data/places.js";

describe("guides", () => {
  it("has a curated set with resolvable places", () => {
    expect(guides.length).toBeGreaterThanOrEqual(10);
    const g = guideBySlug("perfekt-sommarsondag");
    expect(g).toBeTruthy();
    expect(g.season).toBe("sommar");
    expect(g.stops.length).toBeGreaterThanOrEqual(3);
    const placeNames = places.map((p) => p.name);
    for (const guide of guides) {
      expect(guide.stops.length).toBeGreaterThanOrEqual(3);
      expect(guide.kicker).toBeTruthy();
      expect(Array.isArray(guide.themes)).toBe(true);
      expect(guide.themes.length).toBeGreaterThan(0);
      for (const s of guide.stops) {
        expect(placeNames).toContain(s.place);
      }
    }
  });

  it("is late-summer focused for now (all sommar)", () => {
    expect(guides.every((g) => g.season === "sommar")).toBe(true);
  });

  it("maps months to season keys like the app", () => {
    expect(currentSeasonKey(5)).toBe("sommar"); // juni
    expect(currentSeasonKey(7)).toBe("sommar"); // augusti
    expect(currentSeasonKey(8)).toBe("höst");
    expect(currentSeasonKey(0)).toBe("vinter");
    expect(currentSeasonKey(3)).toBe("vår");
  });

  it("features a summer guide in August", () => {
    const g = featuredGuide(guides, 7); // augusti
    expect(g?.season).toBe("sommar");
    expect(g?.slug).toBe("perfekt-sommarsondag");
  });

  it("home filters map to themed guide cards", () => {
    expect(GUIDE_HOME_FILTERS.map((f) => f.key)).toEqual([
      "popular",
      "barn",
      "natur",
      "fika",
      "historia",
      "gratis",
    ]);
    const popular = guidesForHomeFilter(guides, "popular", 7, 3);
    expect(popular).toHaveLength(3);
    expect(popular[0].slug).toBe("perfekt-sommarsondag");
    const barn = guidesForHomeFilter(guides, "barn", 7, 3);
    expect(barn.some((g) => g.slug === "en-dag-med-barnen")).toBe(true);
    expect(barn.every((g) => g.themes.includes("barn"))).toBe(true);
  });
});
