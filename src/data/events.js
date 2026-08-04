/**
 * Evenemangskalender — verifierad mot arrangörssidor (aug 2026).
 * Past dates auto-hide i appen. Tider kan ändras — käll-URL i `source`.
 */
const FALLBACK_IMG = "/assets/hero/2.webp";

export const events = [
  {
    host: "Gravröset Festival / Svista",
    title: "Gravröset Festival",
    date: "2026-08-14",
    when: "Fre–sön 14–16 aug",
    time: "12:00 – 14:00 (sön)",
    cat: "FESTIVAL",
    note: "Experimentell musik- och konstfestival i Svista, Brottby. Biljett krävs; arrangören anger att medlemskap i kulturföreningen gäller.",
    img: "/assets/evenemang/gravroset/cover.webp",
    source: "https://billetto.se/e/gravroset-festival-2026-biljetter-1859379",
  },
  {
    host: "Orkesta Bygdegård Lindholmen",
    title: "Brädspelskväll",
    date: "2026-08-19",
    when: "Ons 19 aug · 18–21",
    time: "18:00 – 21:00",
    cat: "KULTUR",
    note: "Gratis brädspelskväll i Orkesta Bygdegård (Lindholmsvägen 245). Brett urval för alla åldrar — ta med spel eller låna på plats.",
    img: "/assets/hero/3.webp",
    source: "https://www.orkestahembygd.se/event",
  },
  {
    host: "Langhard Lantbruk",
    title: "Smaka på Vallentuna",
    date: "2026-08-29",
    when: "Lör 29 aug · 11–14",
    time: "11:00 – 14:00",
    cat: "MAT",
    note: "Lokal matdag på Langhard Lantbruk, Lena 50 i Markim. Matmakare, föreläsning och smakprover (anmälan krävs för att smaka, enligt arrangören).",
    img: "/assets/evenemang/smaka-pa-vallentuna/cover.webp",
    source: "https://upplandsbygd.se/save-the-date-smaka-pa-vallentuna/",
  },
  {
    host: "Orkesta Bygdegård Lindholmen",
    title: "Skördefest i Lindholmen",
    date: "2026-09-06",
    when: "Sön 6 sep · 11–15",
    time: "11:00 – 15:00",
    cat: "MARKNAD",
    note: "Skördefest vid Orkesta Bygdegård (Lindholmsvägen 245) med lokala producenter och hantverk. Arrangören hoppas erbjuda foodtrucks, café, ponnyridning och workshops.",
    img: "/assets/evenemang/skordefest/cover.webp",
    source: "https://www.orkestahembygd.se/event",
  },
  {
    host: "Vallentuna Centrum",
    title: "SkördeFEST — AW & musik",
    date: "2026-09-12",
    when: "Fre 12 sep · kväll",
    time: "Kväll",
    cat: "MARKNAD",
    note: "Fredagsöppning av SkördeFEST: musik och AW hos restaurangerna i centrum. Familjefesten är dagen efter.",
    img: "/assets/evenemang/skordefest/cover.webp",
    source: "https://vallentunacentrum.se/skordefest/",
  },
  {
    host: "Vallentuna Centrum",
    title: "SkördeFEST — familjefest",
    date: "2026-09-13",
    when: "Lör 13 sep · 10–15",
    time: "10:00 – 15:00",
    cat: "MARKNAD",
    note: "Finaldag på Tuna Torg: torgmarknad, barnaktiviteter (bl.a. i gamla Pressbyrån), karusell, livemusik och tävlingar. Program uppdateras på vallentunacentrum.se.",
    img: "/assets/evenemang/skordefest/cover.webp",
    source: "https://vallentunacentrum.se/skordefest/",
  },
  {
    host: "Vallentuna kommun",
    title: "Beredskapsveckan",
    date: "2026-09-21",
    when: "21–27 sep",
    time: "Vecka",
    cat: "KULTUR",
    note: "Kommunens beredskapsvecka (tema: du är en del av Sveriges totalförsvar). Öppna punkter bl.a. medborgardialoger och Tryggare Vallentuna-dagen — se programmet.",
    img: FALLBACK_IMG,
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/beredskapsveckan/",
  },
  {
    host: "Kårsta bibliotek",
    title: "Medborgardialog — Kårsta",
    date: "2026-09-23",
    when: "Ons 23 sep · 15–17",
    time: "15:00 – 17:00",
    cat: "KULTUR",
    note: "Medborgardialog om beredskap med kommunens medarbetare på Kårsta bibliotek (under Beredskapsveckan).",
    img: FALLBACK_IMG,
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/beredskapsveckan/",
  },
  {
    host: "Karby bibliotek",
    title: "Medborgardialog — Karby",
    date: "2026-09-24",
    when: "Tor 24 sep · 15–17",
    time: "15:00 – 17:00",
    cat: "KULTUR",
    note: "Medborgardialog om beredskap med kommunens medarbetare på Karby bibliotek (under Beredskapsveckan).",
    img: FALLBACK_IMG,
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/beredskapsveckan/",
  },
  {
    host: "Vallentuna kommun",
    title: "Tryggare Vallentuna-dagen",
    date: "2026-09-26",
    when: "Lör 26 sep · 11–15",
    time: "11:00 – 15:00",
    cat: "KULTUR",
    note: "Familjedag på Tuna Torg med lokala organisationer, polis och brandförsvar — avslutning på Beredskapsveckan.",
    img: "/assets/upplev/vallentuna-kulturhus/cover.webp",
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/beredskapsveckan/",
  },
  {
    host: "Vallentuna Stenugnsbageri",
    title: "Kanelbullens dag",
    date: "2026-10-04",
    when: "Sön 4 okt",
    time: "Kolla öppettider",
    cat: "FIKA",
    note: "Nationell Kanelbullens dag (4 okt). Stenugnsbageriet är ett naturligt stopp — bekräfta öppettider/erbjudande närmare dagen hos bageriet (ingen separat eventannons publicerad ännu).",
    img: "/assets/evenemang/kanelbullens-dag/cover.webp",
    source: "https://kanelbullensdag.se/",
  },
  {
    host: "Orkesta Bygdegård Lindholmen",
    title: "Pub & musikquiz",
    date: "2026-10-17",
    when: "Lör 17 okt · från 19:00",
    time: "19:00",
    cat: "KULTUR",
    note: "Pub- och musikquizkväll i Orkesta Bygdegård kl. 19–22. Samla lag eller kom solo — följ bygdegårdens kanaler för bord/biljett.",
    img: "/assets/hero/3.webp",
    source: "https://www.orkestahembygd.se/event",
  },
  {
    host: "Orkesta Bygdegård Lindholmen",
    title: "Julmarknad i Lindholmen",
    date: "2026-12-06",
    when: "Sön 6 dec · 11–15",
    time: "11:00 – 15:00",
    cat: "MARKNAD",
    note: "Julmarknad i bygdegården med hantverk, lokala smaker, fika och (enligt arrangören) ponnyridning. Utställare bokar bord via julmarknad@orkestahembygd.se.",
    img: FALLBACK_IMG,
    source: "https://www.orkestahembygd.se/event",
  },
  {
    host: "Vallentuna Centrum",
    title: "Julmarknad i centrum",
    date: "2026-12-13",
    when: "Sön 13 dec · 11–15",
    time: "11:00 – 15:00",
    cat: "MARKNAD",
    note: "Julmarknad i Vallentuna centrum — angivet i centrumets avvikande öppettider (11–15).",
    img: FALLBACK_IMG,
    source: "https://vallentunacentrum.se/",
  },
].map((e) => ({
  img: FALLBACK_IMG,
  ...e,
}));

export const EVENT_CONTENT = {
  "Gravröset Festival": {
    body: `<p>Experimentell musik- och konstfestival i <strong>Svista, Brottby</strong> (14–16 augusti). Biljetter via Billetto; arrangören Rosa Händer anger att det är ett medlemsarrangemang.</p>
      <p>Mer info och biljetter: <a href="https://billet.to/1859379-web" target="_blank" rel="noopener">billet.to</a>.</p>`,
  },
  "Smaka på Vallentuna": {
    body: `<p>Lokal matdag på <strong>Langhard Lantbruk</strong> i Markim (Lena 50) lördag 29 augusti kl. 11–14 — matmakare, föreläsning och smakprover.</p>
      <p>För att smaka lokal mat krävs anmälan enligt arrangören. Info: <a href="https://upplandsbygd.se/save-the-date-smaka-pa-vallentuna/" target="_blank" rel="noopener">upplandsbygd.se</a>.</p>`,
  },
  "Skördefest i Lindholmen": {
    body: `<p>Skördefest söndag 6 september kl. 11–15 vid Orkesta Bygdegård Lindholmen (Lindholmsvägen 245). Lokala producenter och hantverk; foodtrucks, café, ponnyridning och workshops kan tillkomma.</p>`,
  },
  "SkördeFEST — AW & musik": {
    body: `<p>Fredag 12 september: musik och AW hos restaurangerna i Vallentuna centrum — upptakt till lördagens familjefest. Se <a href="https://vallentunacentrum.se/skordefest/" target="_blank" rel="noopener">vallentunacentrum.se/skordefest</a>.</p>`,
  },
  "SkördeFEST — familjefest": {
    body: `<p>Lördag 13 september kl. 10–15 på Tuna Torg: torgmarknad, barnaktiviteter, karusell, livemusik med Linda Rapp &amp; Livat, käpphästrace m.m. Programmet uppdateras löpande.</p>`,
  },
  "Kanelbullens dag": {
    body: `<p>4 oktober är den nationella Kanelbullens dag. Vallentuna Stenugnsbageri i centrum brukar vara ett självklart stopp — bekräfta öppettider och eventuella erbjudanden närmare dagen.</p>`,
  },
  "Julmarknad i Lindholmen": {
    body: `<p>Julmarknad i Orkesta Bygdegård 6 december kl. 11–15 med hantverk, lokala smaker och fika.</p>`,
  },
  "Julmarknad i centrum": {
    body: `<p>Julmarknad i Vallentuna centrum 13 december kl. 11–15 (enligt centrumets öppettider).</p>`,
  },
  "Beredskapsveckan": {
    body: `<p>21–27 september 2026. Tema: <em>Du är en del av Sveriges totalförsvar</em>. Öppna aktiviteter i kalendern — fullt program på <a href="https://www.vallentuna.se/evenemang-och-upplevelser/beredskapsveckan/" target="_blank" rel="noopener">vallentuna.se</a>.</p>`,
  },
  "Medborgardialog — Kårsta": {
    body: `<p>Onsdag 23 september kl. 15–17 på Kårsta bibliotek. Prata beredskap med kommunens medarbetare.</p>`,
  },
  "Medborgardialog — Karby": {
    body: `<p>Torsdag 24 september kl. 15–17 på Karby bibliotek. Prata beredskap med kommunens medarbetare.</p>`,
  },
  "Tryggare Vallentuna-dagen": {
    body: `<p>Lördag 26 september kl. 11–15 på Tuna Torg — aktiviteter för hela familjen med lokala organisationer, polis och brandförsvar.</p>`,
  },
  "Brädspelskväll": {
    body: `<p>Onsdag 19 augusti kl. 18–21 i Orkesta Bygdegård Lindholmen. Gratis spelkväll för alla åldrar — se <a href="https://www.orkestahembygd.se/event" target="_blank" rel="noopener">orkestahembygd.se/event</a>.</p>`,
  },
  "Pub & musikquiz": {
    body: `<p>Lördag 17 oktober kl. 19–22 i Orkesta Bygdegård. Pub- och musikquiz — se <a href="https://www.orkestahembygd.se/event" target="_blank" rel="noopener">orkestahembygd.se/event</a>.</p>`,
  },
};

export function upcomingEvents(todayISO, list = events) {
  return list.filter((e) => e.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date));
}

export function eventSlug(e) {
  return `${e.title}-${e.date}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
