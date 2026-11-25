import { describe, it, expect } from "vitest";
import { windows, pickEvents, readerFavourites, buildDraft, teaser } from "../scripts/lib/newsletter.mjs";

const ev = (title, date, extra = {}) => ({ title, date, when: date, venue: "vallentuna-teater", note: "Kort text. Mer text.", ...extra });
const LIST = [
  ev("Förra veckan", "2026-11-20"),
  ev("Fredagskonsert", "2026-11-27"),
  ev("Söndagsbio", "2026-11-29", { note: "Fri entré. Popcorn." }),
  ev("Pågående utställning", "2026-11-01", { endDate: "2026-12-31" }),
  ev("Nästa helg", "2026-12-05"),
  ev("För långt bort", "2026-12-20"),
];

describe("nyhetsbrevsutkast", () => {
  it("torsdag ger helgen t.o.m. söndag och två veckor framåt", () => {
    expect(windows("2026-11-26")).toEqual({
      weekend: { start: "2026-11-26", end: "2026-11-29" },
      ahead: { start: "2026-11-30", end: "2026-12-13" },
    });
  });

  it("väljer kommande evenemang, tar med pågående, hoppar över passerade och för avlägsna", () => {
    const { weekend, ahead } = pickEvents("2026-11-26", { list: LIST });
    expect(weekend.map((e) => e.title)).toEqual(["Pågående utställning", "Fredagskonsert", "Söndagsbio"]);
    expect(ahead.map((e) => e.title)).toEqual(["Nästa helg"]);
  });

  it("översätter Umami-sidor till evenemang och platser, utan passerade evenemang", () => {
    const { top, popularity } = readerFavourites(
      [
        { key: "/evenemang/fredagskonsert-2026-11-27.html", n: 4 },
        { key: "/app/evenemang/fredagskonsert-2026-11-27", n: 2 },
        { key: "/evenemang/forra-veckan-2026-11-20.html", n: 9 },
        { key: "/", n: 50 },
      ],
      { todayISO: "2026-11-26", list: LIST },
    );
    expect(top).toHaveLength(1);
    expect(top[0]).toMatchObject({ title: "Fredagskonsert", n: 6 });
    expect(popularity["forra-veckan-2026-11-20"]).toBe(9);
  });

  it("bygger HTML med avregistreringslänk, UTM och egen intro", () => {
    const d = buildDraft({ todayISO: "2026-11-26", list: LIST, intro: ["Hej från mig."] });
    expect(d.html).toContain("{{ unsubscribe }}");
    expect(d.html).toContain("utm_campaign=brev-2026-11-26");
    expect(d.html).toContain("Hej från mig.");
    expect(d.subject).toMatch(/^Helgen i Vallentuna/);
  });

  it("teaser tar första meningen", () => {
    expect(teaser("Ett. Två.")).toBe("Ett.");
  });
});
