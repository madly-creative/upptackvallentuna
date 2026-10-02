import { describe, it, expect } from "vitest";
import {
  resolveHomeHeroMode,
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
});
