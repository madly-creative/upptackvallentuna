import { describe, it, expect } from "vitest";
import {
  hashStr,
  picksRotationSeed,
  rotatePoolOrder,
  selectRotatedDiversePicks,
} from "../src/lib/picksRotate.js";

describe("picksRotate", () => {
  it("hashStr is stable", () => {
    expect(hashStr("Ellen's Corner|2026-08-07")).toBe(hashStr("Ellen's Corner|2026-08-07"));
    expect(hashStr("a")).not.toBe(hashStr("b"));
  });

  it("seed changes with date, daypart and mood", () => {
    const a = picksRotationSeed({
      todayISO: "2026-08-07",
      daypart: "eftermiddag",
      mood: "nice",
      weatherCode: 0,
    });
    const b = picksRotationSeed({
      todayISO: "2026-08-08",
      daypart: "eftermiddag",
      mood: "nice",
      weatherCode: 0,
    });
    const c = picksRotationSeed({
      todayISO: "2026-08-07",
      daypart: "lunch",
      mood: "nice",
      weatherCode: 0,
    });
    const d = picksRotationSeed({
      todayISO: "2026-08-07",
      daypart: "eftermiddag",
      mood: "rough",
      weatherCode: 61,
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
  });

  it("rotatePoolOrder ignores score and sorts by seed hash", () => {
    const pool = [
      { p: { name: "Gästis Kök & Bar", type: "fika" }, score: 90 },
      { p: { name: "Ellen's Corner", type: "butik" }, score: 55 },
      { p: { name: "Vallboden", type: "butik" }, score: 54 },
    ];
    const a = rotatePoolOrder(pool, "2026-08-07|eftermiddag|mild|");
    const b = rotatePoolOrder(pool, "2026-08-08|eftermiddag|mild|");
    expect(a.map((x) => x.p.name)).not.toEqual(b.map((x) => x.p.name));
    // Highest score is not guaranteed first
    expect(a.some((x) => x.score < 90 && a.indexOf(x) === 0) || a[0].p.name !== "Gästis Kök & Bar" || b[0].p.name !== "Gästis Kök & Bar").toBe(true);
  });

  it("high scorer alone in score band still shares feature slot across days", () => {
    const ranked = [
      { p: { name: "Gästis Kök & Bar", type: "fika" }, score: 90, open: true },
      { p: { name: "Ellen's Corner", type: "butik" }, score: 55, open: true },
      { p: { name: "Silver & Sånt", type: "butik" }, score: 54, open: true },
      { p: { name: "Vallboden", type: "butik" }, score: 53, open: true },
      { p: { name: "Tarby Gårdsbutik", type: "gard" }, score: 52, open: true },
      { p: { name: "Lindra Second Hand", type: "loppis" }, score: 51, open: true },
      { p: { name: "Langhard Lantbruk", type: "gard" }, score: 50, open: true },
      { p: { name: "Antikladan", type: "loppis" }, score: 49, open: true },
      { p: { name: "Ormsta Café", type: "fika" }, score: 48, open: true },
      { p: { name: "Kårsta Café", type: "fika" }, score: 47, open: true },
    ];
    const features = new Set();
    for (let d = 1; d <= 14; d++) {
      const day = String(d).padStart(2, "0");
      const picks = selectRotatedDiversePicks(ranked, {
        seed: picksRotationSeed({
          todayISO: `2026-08-${day}`,
          daypart: "eftermiddag",
          mood: "mild",
        }),
        count: 3,
        band: 45,
      });
      features.add(picks[0]?.p.name);
    }
    // Gästis must not be feature every day when pool has many open places
    expect(features.size).toBeGreaterThan(1);
    expect(features.has("Gästis Kök & Bar")).toBe(true); // still eligible sometimes
  });

  it("different days rotate among near-tied open places", () => {
    const ranked = [
      { p: { name: "Ellen's Corner", type: "butik" }, score: 66, open: true },
      { p: { name: "Gästis Kök & Bar", type: "fika" }, score: 64, open: true },
      { p: { name: "Silver & Sånt", type: "butik" }, score: 62, open: true },
      { p: { name: "Vallboden", type: "butik" }, score: 61, open: true },
      { p: { name: "Tarby Gårdsbutik", type: "gard" }, score: 60, open: true },
      { p: { name: "Lindra Second Hand", type: "loppis" }, score: 59, open: true },
      { p: { name: "Langhard Lantbruk", type: "gard" }, score: 58, open: true },
      { p: { name: "Antikladan", type: "loppis" }, score: 57, open: true },
    ];
    const day1 = selectRotatedDiversePicks(ranked, {
      seed: picksRotationSeed({
        todayISO: "2026-08-07",
        daypart: "eftermiddag",
        mood: "mild",
      }),
      count: 3,
    }).map((x) => x.p.name);
    const day2 = selectRotatedDiversePicks(ranked, {
      seed: picksRotationSeed({
        todayISO: "2026-08-08",
        daypart: "eftermiddag",
        mood: "mild",
      }),
      count: 3,
    }).map((x) => x.p.name);
    expect(day1).toHaveLength(3);
    expect(day2).toHaveLength(3);
    expect(day1.join("|")).not.toBe(day2.join("|"));
  });
});
