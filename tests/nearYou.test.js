import { describe, expect, it } from "vitest";
import {
  NEAR_RADIUS_KM,
  WALK_KMH,
  NEAR_WALK_MINUTES,
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

describe("nearYou constants", () => {
  it("10 min walk @ 5 km/h ≈ 0.833 km", () => {
    expect(WALK_KMH).toBe(5);
    expect(NEAR_WALK_MINUTES).toBe(10);
    expect(NEAR_RADIUS_KM).toBeCloseTo(5 / 6, 5);
  });

  it("walkMinutesFromKm rounds sensibly", () => {
    expect(walkMinutesFromKm(NEAR_RADIUS_KM)).toBe(10);
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
  it("keeps places within walk radius only", () => {
    const hits = filterPlacesNear(sample, origin, haversineKm);
    expect(hits.every((h) => h.km <= NEAR_RADIUS_KM)).toBe(true);
    expect(hits.map((h) => h.place.name)).not.toContain("Far");
    expect(hits.length).toBe(5);
  });

  it("filters by category and additive open-now", () => {
    const open = new Set(["A Fika", "D Loppis"]);
    const fika = filterPlacesNear(sample, origin, haversineKm, {
      filterKey: "fika",
    });
    expect(fika.map((h) => h.place.name)).toEqual(["A Fika"]);

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
    expect(groups.find((g) => g.key === "fika")?.count).toBe(1);
    expect(groups.find((g) => g.key === "mer")?.count).toBe(2);
    expect(groups.every((g) => g.count > 0)).toBe(true);
  });
});

describe("pinColorForType", () => {
  it("uses distinct colors per taxonomy bucket", () => {
    expect(pinColorForType("fika")).not.toBe(pinColorForType("natur"));
    expect(pinColorForType("butik")).toBe("#2a3228");
    expect(pinColorForType("loppis")).toBe(pinColorForType("gard"));
  });
});
