import { describe, expect, it } from "vitest";
import {
  SMULTRON_FILTER_MIN,
  countPlacesOfType,
  isSmultronFilterVisible,
  schemaTypeFor,
} from "../src/data/places.js";

describe("smultronstalle category helpers", () => {
  it("hides filter until the minimum count is reached", () => {
    const few = Array.from({ length: SMULTRON_FILTER_MIN - 1 }, (_, i) => ({
      name: `S${i}`,
      type: "smultronstalle",
    }));
    const enough = [
      ...few,
      { name: "S-last", type: "smultronstalle" },
      { name: "Fika", type: "fika" },
    ];
    expect(countPlacesOfType(few, "smultronstalle")).toBe(SMULTRON_FILTER_MIN - 1);
    expect(isSmultronFilterVisible(few)).toBe(false);
    expect(isSmultronFilterVisible(enough)).toBe(true);
  });

  it("maps schema type like other attractions", () => {
    expect(schemaTypeFor({ type: "smultronstalle" })).toBe("TouristAttraction");
  });
});
