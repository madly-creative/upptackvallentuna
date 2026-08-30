import { describe, expect, it } from "vitest";
import {
  WALK_KMH,
  filterPlacesNear,
  nearFilterTypes,
  summarizeNearGroups,
  walkMinutesFromKm,
  pinColorForType,
} from "../src/lib/nearYou.js";

function haversineKm(a, b, c, d) {
  const R = 6371;
  const toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(c - a);
  const dLon = toR(d - b);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a)) * Math.cos(toR(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const origin = { lat: 59.534, lng: 18.077 };
const sample = [
  { name: "A Fika", type: "fika", lat: 59.5342, lng: 18.0773 },
  { name: "B Natur", type: "natur", lat: 59.5345, lng: 18.0775 },
  { name: "C Butik", type: "butik", lat: 59.5341, lng: 18.0771 },
  { name: "D Loppis", type: "loppis", lat: 59.5343, lng: 18.0772 },
  { name: "E Gård", type: "gard", lat: 59.5344, lng: 18.0774 },
  { name: "Far", type: "fika", lat: 59.55, lng: 18.12 },
];

describe("walkMinutesFromKm", () => {
  it("uses 5 km/h and rounds sensibly", () => {
    expect(WALK_KMH).toBe(5);
    expect(walkMinutesFromKm(5 / 6)).toBe(10);
    expect(walkMinutesFromKm(0)).toBe(1);
  });
});

describe("nearFilterTypes", () => {
  it("maps Mer to gard+loppis", () => {
    expect(nearFilterTypes("mer")).toEqual(["gard", "loppis"]);
  });
  it("maps primary filters 1:1", () => {
    expect(nearFilterTypes("fika")).toEqual(["fika"]);
    expect(nearFilterTypes("alla")).toBeNull();
  });
});

describe("filterPlacesNear", () => {
  it("keeps all places and sorts nearest-first when origin set", () => {
    const hits = filterPlacesNear(sample, origin, haversineKm);
    expect(hits.map((h) => h.place.name)).toContain("Far");
    expect(hits.length).toBe(6);
    expect(hits[0].km).toBeLessThanOrEqual(hits[hits.length - 1].km);
  });

  it("filters by category and additive open-now", () => {
    const open = new Set(["A Fika", "D Loppis"]);
    const fika = filterPlacesNear(sample, origin, haversineKm, {
      filterKey: "fika",
    });
    expect(fika.map((h) => h.place.name)).toEqual(["A Fika", "Far"]);

    const merOpen = filterPlacesNear(sample, origin, haversineKm, {
      filterKey: "mer",
      openNowOnly: true,
      isOpenFn: (p) => open.has(p.name),
    });
    expect(merOpen.map((h) => h.place.name)).toEqual(["D Loppis"]);
  });
});

describe("summarizeNearGroups", () => {
  it("returns compact non-zero group counts", () => {
    const hits = filterPlacesNear(sample, origin, haversineKm);
    const groups = summarizeNearGroups(hits);
    expect(groups.find((g) => g.key === "fika")?.count).toBe(2);
    expect(groups.find((g) => g.key === "mer")?.count).toBe(2);
    expect(groups.every((g) => g.count > 0)).toBe(true);
  });
});

describe("pinColorForType", () => {
  it("uses distinct colors per taxonomy bucket", () => {
    expect(pinColorForType("fika")).not.toBe(pinColorForType("natur"));
    expect(pinColorForType("butik")).toBe("#2a3228");
    expect(pinColorForType("loppis")).toBe(pinColorForType("gard"));
    expect(pinColorForType("smultronstalle")).toBe("#c4454a");
    expect(pinColorForType("smultronstalle")).not.toBe(pinColorForType("fika"));
  });
});

describe("nearFilterTypes smultronstalle", () => {
  it("maps smultronstalle 1:1", () => {
    expect(nearFilterTypes("smultronstalle")).toEqual(["smultronstalle"]);
  });
});
