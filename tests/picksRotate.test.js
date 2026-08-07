import { describe, it, expect } from "vitest";
import {
  hashStr,
  picksRotationSeed,
  rotateScoredCandidates,
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

  it("keeps higher score buckets ahead after rotation", () => {
    const ranked = [
      { p: { name: "A", type: "fika" }, score: 70 },
      { p: { name: "B", type: "butik" }, score: 68 },
      { p: { name: "C", type: "gard" }, score: 40 },
    ];
    const rotated = rotateScoredCandidates(ranked, "seed");
    expect(rotated[0].score).toBeGreaterThanOrEqual(60);
    expect(rotated.at(-1).p.name).toBe("C");
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
    expect(new Set(day1.map((_, i) => ranked.find((r) => r.p.name === day1[i]).p.type)).size).toBeGreaterThan(1);
    // Not identical every day among a near-tied pool
    expect(day1.join("|")).not.toBe(day2.join("|"));
  });
});
