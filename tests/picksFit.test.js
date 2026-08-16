import { describe, expect, it } from "vitest";
import {
  isOutdoorBathPlace,
  placeFitsWeatherMood,
  filterRankedForWeather,
  weatherScoreDelta,
  daypartTypesForMood,
} from "../src/lib/picksFit.js";
import { selectRotatedDiversePicks, picksRotationSeed } from "../src/lib/picksRotate.js";

const kvarnbadet = {
  name: "Kvarnbadet",
  cat: "Bad & Utomhus",
  type: "natur",
  short: "Utomhusbad med bassänger, beachvolley och kiosk.",
};
const mjolkrummet = {
  name: "Gårdsbutiken Gamla Mjölkrummet",
  cat: "Gårdsbutik",
  type: "gard",
  short: "Nära gårdsbutik med ägg, ost och kött.",
};
const automat = {
  name: "AutoMat Kårsta",
  cat: "Matbutik",
  type: "butik",
  short: "Obemannad matbutik.",
};
const angarn = {
  name: "Angarnssjöängen",
  cat: "Natur & Utflykt",
  type: "natur",
  short: "Fågelliv och spänger.",
};

describe("picksFit weather", () => {
  it("detects outdoor baths", () => {
    expect(isOutdoorBathPlace(kvarnbadet)).toBe(true);
    expect(isOutdoorBathPlace(mjolkrummet)).toBe(false);
    expect(isOutdoorBathPlace(angarn)).toBe(false);
  });

  it("excludes baths and natur from rough Handplockat", () => {
    expect(placeFitsWeatherMood(kvarnbadet, "rough")).toBe(false);
    expect(placeFitsWeatherMood(angarn, "rough")).toBe(false);
    expect(placeFitsWeatherMood(mjolkrummet, "rough")).toBe(true);
    expect(placeFitsWeatherMood(automat, "rough")).toBe(true);
    expect(placeFitsWeatherMood(kvarnbadet, "nice")).toBe(true);
  });

  it("filterRankedForWeather drops Kvarnbadet in rain", () => {
    const ranked = [
      { p: kvarnbadet, score: 70, open: true },
      { p: mjolkrummet, score: 65, open: true },
      { p: automat, score: 60, open: true },
      { p: angarn, score: 55, open: true },
    ];
    const out = filterRankedForWeather(ranked, "rough");
    expect(out.map((x) => x.p.name)).toEqual([
      "Gårdsbutiken Gamla Mjölkrummet",
      "AutoMat Kårsta",
    ]);
  });

  it("rough Handplockat rotation never picks Kvarnbadet for diversity", () => {
    const ranked = [
      { p: mjolkrummet, score: 80, open: true },
      { p: automat, score: 75, open: true },
      { p: { name: "Vallboden", cat: "Butik", type: "butik", short: "Keramik" }, score: 70, open: true },
      { p: kvarnbadet, score: 68, open: true },
      { p: { name: "Lindra Second Hand", cat: "Second Hand", type: "loppis", short: "Fynd" }, score: 66, open: true },
      { p: { name: "Stenugnsbageri", cat: "Bageri", type: "fika", short: "Buller" }, score: 64, open: true },
      { p: angarn, score: 50, open: true },
      { p: { name: "Ellen's Corner", cat: "Mode", type: "butik", short: "Boutique" }, score: 62, open: true },
    ];
    const filtered = filterRankedForWeather(ranked, "rough");
    const picks = selectRotatedDiversePicks(filtered, {
      seed: picksRotationSeed({
        todayISO: "2026-08-16",
        daypart: "eftermiddag",
        mood: "rough",
        weatherCode: 61,
      }),
      count: 3,
    });
    const names = picks.map((x) => x.p.name);
    expect(names).not.toContain("Kvarnbadet");
    expect(names).not.toContain("Angarnssjöängen");
    expect(names.length).toBe(3);
  });

  it("penalizes outdoor baths hard in rough scoring delta", () => {
    expect(weatherScoreDelta(kvarnbadet, "rough")).toBeLessThanOrEqual(-50);
    expect(weatherScoreDelta(automat, "rough", { hasTag: () => true })).toBeGreaterThan(0);
  });

  it("drops natur from daypart types when rough", () => {
    const nice = daypartTypesForMood("eftermiddag", true, "nice");
    const rough = daypartTypesForMood("eftermiddag", true, "rough");
    expect(nice).toContain("natur");
    expect(rough).not.toContain("natur");
    expect(rough).toContain("fika");
  });
});
