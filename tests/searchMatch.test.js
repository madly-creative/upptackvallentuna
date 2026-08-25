import { describe, it, expect } from "vitest";
import {
  textMatchesQuery,
  textMatchesQueryStrict,
  matchesPrimaryOrSecondary,
  eventSearchPrimary,
  eventSearchSecondary,
  eventSearchHay,
  recurringSearchHay,
  producerSearchHay,
  placeSearchPrimary,
  placeSearchSecondary,
  lightStemSv,
  expandSearchToken,
} from "../src/lib/searchMatch.js";
import { producers } from "../src/data/producers.js";

describe("searchMatch", () => {
  it("matches all tokens (loose)", () => {
    expect(textMatchesQuery("Frösunda skördemarknad station", "frösunda skörd")).toBe(true);
    expect(textMatchesQuery("Frösunda skördemarknad", "jazz")).toBe(false);
    expect(textMatchesQuery("Linedance kickoff", "")).toBe(false);
  });

  it("loose match finds compound place names", () => {
    expect(textMatchesQuery("Kvarnbadet", "bad")).toBe(true);
    expect(textMatchesQuery("Bergsjöns badplats", "bad")).toBe(true);
  });

  it("strict match does not treat mid-compound substring as a hit", () => {
    expect(textMatchesQueryStrict("vid Kvarnbadet — bemannad kvarn", "bad")).toBe(false);
    expect(textMatchesQueryStrict("badplats vid sjön", "bad")).toBe(true);
    expect(textMatchesQueryStrict("Bad & Utomhus", "bad")).toBe(true);
    expect(textMatchesQueryStrict("badplats vid sjön", "badplats")).toBe(true);
  });

  it("event note mentioning Kvarnbadet does not match query bad or bada", () => {
    const e = {
      title: "Drop-in Väsby kvarn",
      host: "Väsby kvarnförening / Kultur Vallentuna",
      cat: "KULTUR",
      note: "Lördagsöppet i Väsby kvarn vid Kvarnbadet — bemannad kvarn.",
    };
    expect(
      matchesPrimaryOrSecondary(eventSearchPrimary(e), eventSearchSecondary(e), "bad")
    ).toBe(false);
    expect(
      matchesPrimaryOrSecondary(eventSearchPrimary(e), eventSearchSecondary(e), "bada")
    ).toBe(false);
    expect(textMatchesQuery(eventSearchHay(e), "bad")).toBe(true);
  });

  it("place name Kvarnbadet still matches bad via primary fields", () => {
    const p = { name: "Kvarnbadet", cat: "Bad & Utomhus", type: "natur", blurb: "Kommunalt bad." };
    expect(
      matchesPrimaryOrSecondary(placeSearchPrimary(p), placeSearchSecondary(p), "bad")
    ).toBe(true);
  });

  it("Sweden History Tours is findable by name and guidning", () => {
    const p = {
      name: "Sweden History Tours",
      cat: "Guidning & historia",
      type: "guidning",
      short: "Guidade historieturer och folktro — bokas efter förfrågan.",
      blurb: "Lokalt guideföretag — bokade turer vid Arkils tingstad.",
    };
    for (const q of ["sweden", "history", "sweden history", "guidning", "historia", "folktro"]) {
      expect(
        matchesPrimaryOrSecondary(placeSearchPrimary(p), placeSearchSecondary(p), q),
        q
      ).toBe(true);
    }
  });

  it("bada / simma expand to the same bathing places as bad", () => {
    const p = { name: "Kvarnbadet", cat: "Bad & Utomhus", type: "natur", blurb: "Utomhusbad." };
    const p2 = { name: "Bergsjöns badplats", cat: "Bad & Natur", type: "natur", blurb: "Skogsbad." };
    for (const q of ["bada", "badar", "simma", "badplats"]) {
      expect(
        matchesPrimaryOrSecondary(placeSearchPrimary(p), placeSearchSecondary(p), q),
        q
      ).toBe(true);
      expect(
        matchesPrimaryOrSecondary(placeSearchPrimary(p2), placeSearchSecondary(p2), q),
        q
      ).toBe(true);
    }
  });

  it("lightStemSv and expandSearchToken cover bada → bad", () => {
    expect(lightStemSv("bada")).toBe("bad");
    expect(lightStemSv("badar")).toBe("bad");
    expect(expandSearchToken("bada")).toContain("bad");
    expect(expandSearchToken("simma")).toContain("bad");
  });

  it("event hay includes host and note for linedance-style queries", () => {
    const e = {
      title: "Kickoff",
      host: "Bara man Vill",
      note: "Rosendalsskolan linedance",
      cat: "KULTUR",
    };
    expect(
      matchesPrimaryOrSecondary(eventSearchPrimary(e), eventSearchSecondary(e), "bara man")
    ).toBe(true);
    expect(
      matchesPrimaryOrSecondary(eventSearchPrimary(e), eventSearchSecondary(e), "linedance")
    ).toBe(true);
  });

  it("recurring hay matches weekly activity", () => {
    const hay = recurringSearchHay({
      title: "Socialdans",
      place: "Vallentuna Kulturhus",
      host: "Dans i Vallentuna",
      whenLabel: "Varje tisdag 19–22",
    });
    expect(textMatchesQuery(hay, "socialdans")).toBe(true);
    expect(textMatchesQuery(hay, "varje vecka")).toBe(true);
  });

  it("every producer is findable by name", () => {
    expect(producers.length).toBeGreaterThan(0);
    for (const pr of producers) {
      const hay = producerSearchHay(pr);
      const token = pr.name.split(/\s+/)[0];
      expect(textMatchesQuery(hay, token), pr.name).toBe(true);
    }
  });

  it("producer hay includes soldAt and category words", () => {
    const mosters = producers.find((p) => p.slug === "mosters-goda");
    expect(mosters).toBeTruthy();
    const hay = producerSearchHay(mosters);
    expect(textMatchesQuery(hay, "mosters")).toBe(true);
    expect(textMatchesQuery(hay, "marmelader")).toBe(true);
    expect(textMatchesQuery(hay, "hökeriet")).toBe(true);
    expect(textMatchesQuery(hay, "producent")).toBe(true);
  });
});
