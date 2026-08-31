import { describe, expect, it } from "vitest";
import { places, placeBySlug, placeHasType, placeTypes } from "../src/data/places.js";
import { placeSearchPrimary } from "../src/lib/searchMatch.js";
import { matchesPrimaryOrSecondary } from "../src/lib/searchMatch.js";

describe("Hökeriet and Orkesta Granby Gård (split)", () => {
  const gard = placeBySlug("orkesta-granby-gard") || places.find((p) => p.name === "Orkesta Granby Gård");
  const hok = placeBySlug("hokeriet") || places.find((p) => p.name === "Hökeriet");

  it("lists both as separate places", () => {
    expect(gard).toBeTruthy();
    expect(hok).toBeTruthy();
    expect(gard.name).toBe("Orkesta Granby Gård");
    expect(hok.name).toBe("Hökeriet");
    expect(gard.slug).not.toBe(hok.slug);
  });

  it("keeps the farm under Handla lokalt without fika alias", () => {
    expect(placeTypes(gard)).toEqual(["gard"]);
    expect(placeHasType(gard, "gard")).toBe(true);
    expect(placeHasType(gard, "fika")).toBe(false);
    expect(gard.url).toContain("granbygard.com");
    expect(gard.aka || []).not.toContain("Hökeriet");
  });

  it("lists Hökeriet under fika and Handla lokalt", () => {
    expect(placeTypes(hok)).toEqual(expect.arrayContaining(["fika", "gard"]));
    expect(placeHasType(hok, "fika")).toBe(true);
    expect(placeHasType(hok, "gard")).toBe(true);
    expect(hok.url).toContain("hokeriet.se");
  });

  it("finds Hökeriet by name in primary search", () => {
    const primary = placeSearchPrimary(hok);
    expect(primary.toLowerCase()).toContain("hökeriet");
    expect(matchesPrimaryOrSecondary(primary, "", "hökeriet")).toBe(true);
  });

  it("uses a broader category for the farm than café", () => {
    expect(gard.cat).toMatch(/gård|lantbruk/i);
    expect(gard.cat.toLowerCase()).not.toContain("kafé");
  });
});
