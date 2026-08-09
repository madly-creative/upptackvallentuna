import { describe, it, expect } from "vitest";
import {
  FACTS_EPOCH,
  facts,
  weekIndex,
  factIndexForWeek,
  currentFact,
  factSlug,
  isSagen,
} from "../src/data/facts.js";

describe("factsWeek", () => {
  it("has 31 facts from JSON", () => {
    expect(facts).toHaveLength(31);
    expect(facts[0].title).toBe("Mannen som ägde hela Täby");
  });

  it("wired facts expose per-post image paths", () => {
    expect(facts[0].image).toBe("/assets/veckans-fakta/mannen-som-agde-hela-taby.webp");
    expect(facts[5].image).toContain("natten-blixten-brande-kyrktornet");
    expect(facts[6].image).toContain("kyrktuppen-som-blev-en-roman");
    expect(facts.find((f) => f.id === 12)?.image).toBeNull();
  });

  it("epoch week is 0", () => {
    expect(FACTS_EPOCH).toBe("2026-08-11");
    expect(weekIndex("2026-08-11")).toBe(0);
    expect(weekIndex("2026-08-17")).toBe(0);
    expect(weekIndex("2026-08-18")).toBe(1);
  });

  it("weekIndex stays sequential across year boundary (not ISO week)", () => {
    // 147 days after epoch = exactly 21 weeks
    expect(weekIndex("2027-01-05")).toBe(21);
    // Day before that is still week 20
    expect(weekIndex("2027-01-04")).toBe(20);
    // Mid-December continues the count (not reset at ISO week 1)
    const midDec = weekIndex("2026-12-15");
    const earlyJan = weekIndex("2027-01-05");
    expect(earlyJan).toBeGreaterThan(midDec);
    expect(earlyJan - midDec).toBe(3); // 21 days → 3 weeks
  });

  it("currentFact wraps with positive modulo", () => {
    expect(currentFact("2026-08-11")?.id).toBe(1);
    expect(currentFact("2026-08-18")?.id).toBe(2);
    expect(factIndexForWeek(31, 31)).toBe(0);
    // epoch + 31 weeks
    expect(weekIndex("2027-03-16")).toBe(31);
    expect(currentFact("2027-03-16")?.id).toBe(1);
  });

  it("currentFact stays on first fact before epoch (no wrap into sägen-tail)", () => {
    expect(weekIndex("2026-08-09")).toBeLessThan(0);
    expect(currentFact("2026-08-09")?.id).toBe(1);
    expect(currentFact("2026-08-10")?.id).toBe(1);
  });

  it("isSagen marks folktro posts", () => {
    const sagen = facts.find((f) => f.id === 27);
    const verified = facts.find((f) => f.id === 1);
    expect(isSagen(sagen)).toBe(true);
    expect(isSagen(verified)).toBe(false);
  });

  it("factSlug is url-safe", () => {
    expect(factSlug(facts[0])).toMatch(/^[a-z0-9-]+$/);
    expect(factSlug(facts[0])).toBe("mannen-som-agde-hela-taby");
  });
});
