import { describe, expect, it } from "vitest";
import { places, placeBySlug, placeHasType, placeTypes } from "../src/data/places.js";
import { placeSearchPrimary } from "../src/lib/searchMatch.js";
import { matchesPrimaryOrSecondary } from "../src/lib/searchMatch.js";

describe("Orkesta Granby Gård / Hökeriet", () => {
  const g = placeBySlug("orkesta-granby-gard") || places.find((p) => p.name === "Orkesta Granby Gård");

  it("is listed under Handla lokalt and Äta & fika", () => {
    expect(g).toBeTruthy();
    expect(placeTypes(g)).toEqual(expect.arrayContaining(["gard", "fika"]));
    expect(placeHasType(g, "gard")).toBe(true);
    expect(placeHasType(g, "fika")).toBe(true);
  });

  it("is findable as Hökeriet in primary search", () => {
    const primary = placeSearchPrimary(g);
    expect(primary.toLowerCase()).toContain("hökeriet");
    expect(matchesPrimaryOrSecondary(primary, "", "hökeriet")).toBe(true);
  });

  it("uses a broader category label than just café", () => {
    expect(g.cat).toMatch(/gård/i);
    expect(g.cat.toLowerCase()).not.toContain("kafé");
  });
});
