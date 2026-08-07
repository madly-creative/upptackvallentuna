import { describe, it, expect } from "vitest";
import {
  textMatchesQuery,
  eventSearchHay,
  recurringSearchHay,
} from "../src/lib/searchMatch.js";

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
});
