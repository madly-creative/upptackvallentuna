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

  it("keeps summer guides and three autumn ones", () => {
    expect(guides.some((g) => g.season === "sommar")).toBe(true);
    expect(guides.filter((g) => g.season === "höst").map((g) => g.slug)).toEqual([
      "vikingasparet",
      "sensommar-pa-garden",
      "centrum-pa-foten",
    ]);
  });

  it("maps months to season keys", () => {
    expect(currentSeasonKey(5)).toBe("sommar"); // juni
    expect(currentSeasonKey(7)).toBe("sommar"); // augusti
    expect(currentSeasonKey(8)).toBe("höst"); // september
    expect(currentSeasonKey(10)).toBe("höst"); // november
    expect(currentSeasonKey(11)).toBe("vinter"); // december
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
    const november = guidesForHomeFilter(guides, "popular", 10, 3);
    expect(november.map((g) => g.slug)).toEqual([
      "vikingasparet",
      "sensommar-pa-garden",
      "centrum-pa-foten",
    ]);
    for (const g of november) {
      expect(g.season).toBe("höst");
      expect(`${g.title} ${g.kicker} ${g.intro}`.toLowerCase()).not.toMatch(/sommar/);
    }
    expect(november[0].kicker).toBe("Höstens vandring");
    const barn = guidesForHomeFilter(guides, "barn", 7, 3);
    expect(barn.some((g) => g.slug === "en-dag-med-barnen")).toBe(true);
    expect(barn.every((g) => g.themes.includes("barn"))).toBe(true);
  });
});
