import { describe, it, expect } from "vitest";
import { events } from "../src/data/events.js";
import { places } from "../src/data/places.js";
import { EVENT_VENUES } from "../src/data/eventVenues.js";
import {
  stockholmOffset,
  parseEventTime,
  eventDates,
  isPastEvent,
  eventSeriesKey,
  nextEdition,
  eventJsonLd,
} from "../src/lib/eventSchema.js";

const ISO_DT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2})?$/;

describe("Event-schema", () => {
  it("Stockholm-offset följer sommartid", () => {
    expect(stockholmOffset("2026-08-07", "19:00")).toBe("+02:00");
    expect(stockholmOffset("2026-12-12", "11:00")).toBe("+01:00");
    expect(stockholmOffset("2026-10-25", "02:00")).toBe("+02:00");
    expect(stockholmOffset("2026-10-25", "12:00")).toBe("+01:00");
    expect(stockholmOffset("2026-03-29", "12:00")).toBe("+02:00");
    expect(stockholmOffset("2026-03-28", "12:00")).toBe("+01:00");
  });

  it("läser klockslag och hoppar över fritext", () => {
    expect(parseEventTime("11:00 – 15:00")).toEqual({ start: "11:00", end: "15:00" });
    expect(parseEventTime("18:30")).toEqual({ start: "18:30" });
    expect(parseEventTime("Vecka")).toEqual({});
    expect(parseEventTime("12:00 – 14:00 (sön)")).toEqual({});
  });

  it("startDate/endDate får klockslag och tidszon", () => {
    expect(eventDates({ date: "2026-09-19", time: "11:00 – 15:00" })).toEqual({
      startDate: "2026-09-19T11:00:00+02:00",
      endDate: "2026-09-19T15:00:00+02:00",
    });
    expect(eventDates({ date: "2026-09-12", endDate: "2026-09-13", time: "11:00 – 17:00" }).endDate).toBe(
      "2026-09-13T17:00:00+02:00"
    );
  });

  it("varje evenemang har en känd plats och giltigt schema", () => {
    for (const e of events) {
      expect(EVENT_VENUES[e.venue], `${e.title} venue=${e.venue}`).toBeTruthy();
      const j = eventJsonLd(e, { canonical: "https://x/e.html", image: "https://x/i.jpg", places });
      expect(j.startDate).toMatch(ISO_DT);
      if (j.endDate) {
        expect(j.endDate).toMatch(ISO_DT);
        expect(j.endDate >= j.startDate.slice(0, 10)).toBe(true);
      }
      expect(j.location["@type"]).toBe("Place");
      expect(j.location.address["@type"]).toBe("PostalAddress");
      expect(j.location.address.addressLocality).toBeTruthy();
      expect(j.eventStatus).toBe("https://schema.org/EventScheduled");
      expect(j.eventAttendanceMode).toBe("https://schema.org/OfflineEventAttendanceMode");
    }
  });

  it("evenemang med klockslag i datan får klockslag i schemat", () => {
    for (const e of events) {
      if (parseEventTime(e.time).start) expect(eventDates(e).startDate).toContain("T");
    }
  });

  it("plats är venue, inte arrangör", () => {
    const e = events.find((x) => x.title === "Vallentuna Höstmarknad");
    const j = eventJsonLd(e, { canonical: "", image: "", places });
    expect(j.location.name).toMatch(/Tuna Torg/);
    expect(j.organizer.name).toBe(e.host);
  });

  it("passerat räknas från sista dagen", () => {
    const multi = { date: "2026-09-04", endDate: "2026-09-12" };
    expect(isPastEvent(multi, "2026-09-10")).toBe(false);
    expect(isPastEvent(multi, "2026-09-13")).toBe(true);
    expect(isPastEvent({ date: "2026-11-25" }, "2026-11-25")).toBe(false);
  });

  it("hittar nästa upplaga i samma serie", () => {
    expect(eventSeriesKey("Bio Halvåtta: Arkipelag")).toBe("bio halvatta");
    expect(eventSeriesKey("Jano — Miriam Aida")).toBe("jano");
    const list = [
      { title: "Bio Halvåtta: A", date: "2026-10-01" },
      { title: "Bio Halvåtta: C", date: "2026-12-10" },
      { title: "Bio Halvåtta: B", date: "2026-11-30" },
      { title: "Julmarknad", date: "2026-12-12" },
    ];
    expect(nextEdition(list[0], list, "2026-11-25").title).toBe("Bio Halvåtta: B");
    expect(nextEdition({ title: "Lovbio: X", date: "2026-10-29" }, list, "2026-11-25")).toBeNull();
  });
});
