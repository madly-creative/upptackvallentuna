import { describe, it, expect } from "vitest";
import { checkEvent, checkWhen, similarity } from "../scripts/event-check.mjs";

const base = {
  title: "Julkonsert med Testkören",
  host: "Testkören",
  venue: "vallentuna-kyrka",
  date: "2026-12-13",
  when: "Sön 13 dec · 18–19",
  time: "18:00 – 19:00",
  cat: "KULTUR",
  note: "Testkören sjunger. Fri entré.",
  source: "https://example.se/kalender/1",
  addedDate: "2026-11-29",
  img: "/assets/hero/2.webp",
};
const opts = { today: "2026-11-29", list: [], content: {}, fileExists: () => true };

describe("evenemangskontrollen", () => {
  it("godkänner ett komplett evenemang", () => {
    expect(checkEvent(base, opts).errors).toEqual([]);
  });

  it("fångar fel veckodag i when", () => {
    expect(checkWhen({ ...base, when: "Lör 13 dec · 18–19" })).toMatch(/veckodag/);
    expect(checkWhen({ ...base, when: "21–27 sep" })).toBeNull();
  });

  it("stoppar passerat datum, okänd plats och saknad källa", () => {
    const { errors } = checkEvent({ ...base, date: "2026-11-01", when: "Sön 1 nov · 18–19", venue: "okand", source: "" }, opts);
    expect(errors.join(" ")).toMatch(/passerat/);
    expect(errors.join(" ")).toMatch(/venue/);
    expect(errors.join(" ")).toMatch(/saknar source/);
  });

  it("varnar för dubbletter och Facebook som enda källa", () => {
    const other = { ...base, title: "Julkonsert Testkören", addedDate: "2026-10-01" };
    const { warnings } = checkEvent({ ...base, source: "https://www.facebook.com/events/1" }, { ...opts, list: [other] });
    expect(warnings.join(" ")).toMatch(/dubblett/);
    expect(warnings.join(" ")).toMatch(/Facebook/);
  });

  it("likhet ignorerar småord", () => {
    expect(similarity("Julkonsert med Össeby kyrkokör", "Össeby kyrkokör – julkonsert")).toBe(1);
  });
});
