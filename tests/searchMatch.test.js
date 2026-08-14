import { describe, it, expect } from "vitest";
import {
  textMatchesQuery,
  eventSearchHay,
  recurringSearchHay,
  producerSearchHay,
} from "../src/lib/searchMatch.js";
import { producers } from "../src/data/producers.js";

describe("searchMatch", () => {
  it("matches all tokens", () => {
    expect(textMatchesQuery("Frösunda skördemarknad station", "frösunda skörd")).toBe(true);
    expect(textMatchesQuery("Frösunda skördemarknad", "jazz")).toBe(false);
    expect(textMatchesQuery("Linedance kickoff", "")).toBe(false);
  });

  it("event hay includes host and note", () => {
    const hay = eventSearchHay({
      title: "Kickoff",
      host: "Bara man Vill",
      note: "Rosendalsskolan linedance",
      cat: "KULTUR",
    });
    expect(textMatchesQuery(hay, "bara man")).toBe(true);
    expect(textMatchesQuery(hay, "linedance")).toBe(true);
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
