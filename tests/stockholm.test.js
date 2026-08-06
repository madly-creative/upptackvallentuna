import { describe, it, expect } from "vitest";
import {
  formatWeekday,
  schemaWeekday,
  stockholmWeekday,
  stockholmTodayISO,
} from "../src/data/stockholm.js";

describe("stockholm weekday helpers", () => {
  it("formats 0–6 in Swedish", () => {
    expect(formatWeekday(0)).toBe("söndag");
    expect(formatWeekday(2, { capitalize: true })).toBe("Tisdag");
    expect(formatWeekday(9)).toBe("");
  });

  it("maps schema.org weekday URLs", () => {
    expect(schemaWeekday(2)).toBe("https://schema.org/Tuesday");
  });

  it("computes today ISO in Europe/Stockholm", () => {
    const iso = stockholmTodayISO(new Date("2026-08-04T22:30:00Z")); // Tue evening UTC → Wed in Stockholm
    expect(iso).toBe("2026-08-05");
    expect(stockholmWeekday(new Date("2026-08-04T22:30:00Z"))).toBe(3); // Wednesday
  });
});
