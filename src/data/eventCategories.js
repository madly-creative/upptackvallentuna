/**
 * Övergripande filterchips för evenemang (6 st inkl. Alla).
 * `cats` mappar mot `events[].cat` i events.js.
 */
export const EVENT_FILTERS = [
  { key: "alla", label: "Alla", cats: null },
  { key: "kultur", label: "Kultur", cats: ["KULTUR"] },
  { key: "festival", label: "Festival", cats: ["FESTIVAL"] },
  { key: "mat", label: "Mat & fika", cats: ["MAT", "FIKA"] },
  { key: "marknad", label: "Marknad", cats: ["MARKNAD"] },
  { key: "sport", label: "Sport & rörelse", cats: ["SPORT", "NATUR"] },
];

/** Visa-vänlig etikett på kort/taggar. */
export function eventCatLabel(cat) {
  const map = {
    KULTUR: "Kultur",
    FESTIVAL: "Festival",
    MAT: "Mat",
    FIKA: "Fika",
    MARKNAD: "Marknad",
    SPORT: "Sport",
    NATUR: "Natur",
    ÖVRIGT: "Övrigt",
  };
  return map[cat] || cat || "Evenemang";
}

export function eventMatchesFilter(event, filterKey) {
  const f = EVENT_FILTERS.find((x) => x.key === filterKey) || EVENT_FILTERS[0];
  if (!f.cats) return true;
  return f.cats.includes(event.cat);
}

/** Vilket filter-key ett event tillhör (för data-attribut på SEO-sidan). */
export function filterKeyForCat(cat) {
  const f = EVENT_FILTERS.find((x) => x.cats && x.cats.includes(cat));
  return f?.key || "alla";
}
