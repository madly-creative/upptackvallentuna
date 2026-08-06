/**
 * Evenemangskalender — verifierad mot arrangörssidor (aug 2026).
 * Past dates auto-hide i appen. Tider kan ändras — käll-URL i `source`.
 */
const FALLBACK_IMG = "/assets/hero/2.webp";

export const events = [
  {
    host: "Orkesta Bygdegård Lindholmen",
    title: "Utomhusbio – Grannfejden",
    date: "2026-08-09",
    when: "Sön 9 aug · 21–23",
    time: "21:00 – 23:00",
    cat: "KULTUR",
    note: "Fri entré till utomhusbio vid Orkesta bygdegård — feelgoodfilmen Grannfejden. Ta med filt eller campingstol; popcorn och biosnacks till försäljning.",
    img: "/assets/evenemang/utomhusbio-grannfejden/cover.webp",
    source: "https://www.orkestahembygd.se/event",
  },
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
    img: "/assets/evenemang/bradspelskvall/cover.webp",
    source: "https://www.orkestahembygd.se/event",
  },
  {
    host: "Orkesta Bygdegård Lindholmen",
    title: "Linedance en-dagskurs",
    date: "2026-08-22",
    when: "Lör 22 aug · 10–13",
    time: "10:00 – 13:00",
    cat: "KULTUR",
    note: "Prova-på linedance utan partner i Orkesta hembygdsgård. Inga förkunskaper krävs — instruktör Linda Blumenthal. Se bygdegårdens kalender för pris/anmälan.",
    img: "/assets/evenemang/linedance-en-dagskurs/cover.webp",
    source: "https://www.orkestahembygd.se/event",
  },
  {
    host: "Vallentuna Kulturhus",
    title: "Scenfredag – Axman Band",
    date: "2026-08-28",
    when: "Fre 28 aug · 19:00",
    time: "19:00 – 21:00",
    cat: "KULTUR",
    note: "Blues och rock på Caféscenen i Vallentuna Kulturhus. Insläpp från 18:30. Biljetter från 150 kr via Nortic (även biblioteket).",
    img: "/assets/evenemang/scenfredag-axman-band/cover.webp",
    source: "https://www.nortic.se/ticket/show/353467",
  },
  {
    host: "Orkesta Granby Gård",
    title: "Viskväll med Lindar och Liljor",
    date: "2026-08-28",
    when: "Fre 28 aug · 19–21",
    time: "19:00 – 21:00",
    cat: "KULTUR",
    note: "Visor och folkmusik på Hökeriet, Orkesta Granby Gård — duon Lindar och Liljor med Dan Andersson, vallmusik och egna visor. Ca 2 timmar. Biljetter från 495 kr/person via Hökeriets bokning.",
    img: "/assets/evenemang/viskvall-lindar-och-liljor/cover.webp",
    source: "https://hokeriet.understory.io/sv/experience/b49ea0ae822f1cd02f8b2755242700d2",
  },
  {
    host: "Vallentuna kommun",
    title: "Naturen och idrottens dag",
    date: "2026-08-29",
    when: "Lör 29 aug · 11–14",
    time: "11:00 – 14:00",
    cat: "NATUR",
    note: "Prova-på-dag på Vallentuna IP med ~30 föreningar och aktörer — idrott, fritid och natur för hela familjen. Fri entré. Samma dag som Smaka på Vallentuna i Markim.",
    img: "/assets/upplev/vallentuna-naturreservat/cover.webp",
    source: "https://www.vallentuna.se/fritid-och-kultur/kulturskola/aktuellt-och-evenemang/",
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
    host: "Vallentuna Hockey",
    title: "Vallentuna Hockey Week",
    date: "2026-09-04",
    when: "4–12 sep",
    time: "Matcher kväll/helg",
    cat: "SPORT",
    note: "Hockeyfest i Vallentuna Ishall (Parkvägen 3): bl.a. VHF–Huddinge 4/9, AIK–BIK Karlskoga 9/9 och Hammarby-dubbel 12/9. Grill, öl och musik utomhus — biljetter via hockeyweek.se.",
    img: "/assets/upplev/rookie-cafe-och-restaurang/cover.webp",
    source: "https://hockeyweek.se/",
  },
  {
    host: "Orkesta hembygdsförening",
    title: "Höstfest / Skördefest i Lindholmen",
    date: "2026-09-06",
    when: "Sön 6 sep · 11–15",
    time: "11:00 – 15:00",
    cat: "MARKNAD",
    note: "Fri entré till höstfest/skördefest i Lindholmen och Orkesta hembygdsgård: utställare, foodtruck Super Burger, café med Ljuvliga bakverk, ponnyridning, pilkastning, fiskdamm, lyckohjul och korta föredrag inne i hembygdsgården.",
    img: "/assets/evenemang/skordefest-lindholmen/cover.webp",
    source: "https://www.orkestahembygd.se/event",
  },
  {
    host: "Jano / Vallentuna Teater",
    title: "Jano — Sylvia Vrethammar",
    date: "2026-09-20",
    when: "Sön 20 sep · 18:30",
    time: "18:30",
    cat: "KULTUR",
    note: "Jazzklubben Jano på Vallentuna Teater (Gymnasievägen 4B). Café från 17:30, konsert 18:30. Biljetter via Nortic eller Vallentuna bibliotek.",
    img: "/assets/evenemang/jano-sylvia-vrethammar/cover.webp",
    source: "https://www.nortic.se/ticket/show/344818",
  },
  {
    host: "Jano / Vallentuna Teater",
    title: "Jano — Hans Backenroth Quartet",
    date: "2026-10-04",
    when: "Sön 4 okt · 18:30",
    time: "18:30",
    cat: "KULTUR",
    note: "Jazzkväll med Hans Backenroth Quartet på Vallentuna Teater. Café från 17:30. Biljetter via Nortic eller biblioteket.",
    img: "/assets/evenemang/jano-hans-backenroth/cover.webp",
    source: "https://www.nortic.se/ticket/show/344820",
  },
  {
    host: "Jano / Vallentuna Teater",
    title: "Jano — Carin Lundin / Ronnie Gardiner",
    date: "2026-10-18",
    when: "Sön 18 okt · 18:30",
    time: "18:30",
    cat: "KULTUR",
    note: "Carin Lundin och Ronnie Gardiner Quartet hos Jano på Vallentuna Teater. Café från 17:30. Biljetter via Nortic eller biblioteket.",
    img: "/assets/evenemang/jano-carin-lundin-ronnie-gardiner/cover.webp",
    source: "https://www.nortic.se/ticket/show/344861",
  },
  {
    host: "Jano / Vallentuna Teater",
    title: "Jano — Johan Stengård Big Band",
    date: "2026-11-01",
    when: "Sön 1 nov · 18:30",
    time: "18:30",
    cat: "KULTUR",
    note: "Johan Stengård Big Band på Vallentuna Teater — Jano-konsert. Café från 17:30. Biljetter via Nortic eller biblioteket.",
    img: "/assets/evenemang/jano-johan-stengard/cover.webp",
    source: "https://www.nortic.se/ticket/show/344862",
  },
  {
    host: "Jano / Vallentuna Teater",
    title: "Jano — Miriam Aida",
    date: "2026-11-15",
    when: "Sön 15 nov · 18:30",
    time: "18:30",
    cat: "KULTUR",
    note: "Miriam Aida — Loving the Hero — hos Jano på Vallentuna Teater. Café från 17:30. Biljetter via Nortic eller biblioteket.",
    img: "/assets/evenemang/jano-miriam-aida/cover.webp",
    source: "https://www.nortic.se/ticket/show/344915",
  },
  {
    host: "Jano / Vallentuna Teater",
    title: "Jano — Vivian Buczek",
    date: "2026-11-29",
    when: "Sön 29 nov · 18:30",
    time: "18:30",
    cat: "KULTUR",
    note: "Vivian Buczek — Le Grand Michel — hos Jano på Vallentuna Teater. Café från 17:30. Biljetter via Nortic eller biblioteket.",
    img: "/assets/evenemang/jano-vivian-buczek/cover.webp",
    source: "https://www.nortic.se/ticket/show/344918",
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
    img: "/assets/evenemang/beredskapsveckan/cover.webp",
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
    img: "/assets/evenemang/beredskapsveckan/cover.webp",
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
    img: "/assets/evenemang/beredskapsveckan/cover.webp",
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
    img: "/assets/evenemang/beredskapsveckan/cover.webp",
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/beredskapsveckan/",
  },
  {
    host: "Orkesta Bygdegård Lindholmen",
    title: "Pub & musikquiz",
    date: "2026-10-17",
    when: "Lör 17 okt · 19–22",
    time: "19:00 – 22:00",
    cat: "KULTUR",
    note: "Pub- och musikquizkväll i Orkesta Bygdegård kl. 19–22. Samla lag eller kom solo — följ bygdegårdens kanaler för bord/biljett.",
    img: "/assets/evenemang/pub-musikquiz/cover.webp",
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
    img: "/assets/evenemang/julmarknad-lindholmen/cover.webp",
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
    img: "/assets/evenemang/julmarknad-centrum/cover.webp",
    source: "https://vallentunacentrum.se/",
  },
].map((e) => ({
  img: FALLBACK_IMG,
  ...e,
}));

export const EVENT_CONTENT = {
  "Utomhusbio – Grannfejden": {
    body: `<p>Söndag 9 augusti kl. 21–23 vid Orkesta bygdegård i Lindholmen. Fri entré — ta med filt eller campingstol. Filmen <em>Grannfejden</em> (feelgood/drama). Popcorn och biosnacks till försäljning.</p>
      <p>Kalender: <a href="https://www.orkestahembygd.se/event" target="_blank" rel="noopener">orkestahembygd.se/event</a>.</p>`,
  },
  "Gravröset Festival": {
    body: `<p>Experimentell musik- och konstfestival i <strong>Svista, Brottby</strong> (14–16 augusti). Biljetter via Billetto; arrangören Rosa Händer anger att det är ett medlemsarrangemang.</p>
      <p>Mer info: <a href="https://www.gravrosetfestival.se/sv" target="_blank" rel="noopener">gravrosetfestival.se</a> · biljetter: <a href="https://billetto.se/e/gravroset-festival-2026-biljetter-1859379" target="_blank" rel="noopener">Billetto</a>.</p>`,
  },
  "Smaka på Vallentuna": {
    body: `<p>Lokal matdag på <strong>Langhard Lantbruk</strong> i Markim (Lena 50) lördag 29 augusti kl. 11–14 — matmakare, föreläsning och smakprover.</p>
      <p>För att smaka lokal mat krävs anmälan enligt arrangören. Info: <a href="https://upplandsbygd.se/save-the-date-smaka-pa-vallentuna/" target="_blank" rel="noopener">upplandsbygd.se</a>.</p>`,
  },
  "Naturen och idrottens dag": {
    body: `<p>Lördag 29 augusti kl. 11–14 på <strong>Vallentuna IP</strong>. Prova aktiviteter med föreningar och aktörer — en familjedag kring idrott, fritid och natur. Fri entré.</p>
      <p>Info: <a href="https://www.vallentuna.se/fritid-och-kultur/kulturskola/aktuellt-och-evenemang/" target="_blank" rel="noopener">vallentuna.se</a>.</p>`,
  },
  "Scenfredag – Axman Band": {
    body: `<p>Fredag 28 augusti kl. 19 på Caféscenen i Vallentuna Kulturhus — blues och rock med Axman Band. Insläpp från 18:30. Biljetter från 150 kr.</p>
      <p>Boka: <a href="https://www.nortic.se/ticket/show/353467" target="_blank" rel="noopener">Nortic</a>.</p>`,
  },
  "Viskväll med Lindar och Liljor": {
    body: `<p>Fredag 28 augusti kl. 19–21 på <strong>Hökeriet</strong>, Orkesta Granby Gård (Granby, Vallentuna). Musikaliska duon Lindar och Liljor bjuder på visor och folkmusik — tolkningar av Dan Andersson, vallmusik och egna visor. Cirka två timmar.</p>
      <p>Biljetter från 495 kr/person. Boka: <a href="https://hokeriet.understory.io/sv/experience/b49ea0ae822f1cd02f8b2755242700d2" target="_blank" rel="noopener">Hökeriet / Understory</a>.</p>`,
  },
  "Linedance en-dagskurs": {
    body: `<p>Lördag 22 augusti kl. 10–13 i Orkesta hembygdsgård. Linedance utan partner — enkla danser, inga förkunskaper. Instruktör Linda Blumenthal.</p>
      <p>Se <a href="https://www.orkestahembygd.se/event" target="_blank" rel="noopener">orkestahembygd.se/event</a> för pris och anmälan.</p>`,
  },
  "Vallentuna Hockey Week": {
    body: `<p>4–12 september i Vallentuna Ishall (Parkvägen 3). Matcher bl.a. Vallentuna–Huddinge (4/9), AIK–BIK Karlskoga (9/9) och Hammarby-dubbel (12/9). Grill, öl och musik utomhus.</p>
      <p>Program och biljetter: <a href="https://hockeyweek.se/" target="_blank" rel="noopener">hockeyweek.se</a>.</p>`,
  },
  "Höstfest / Skördefest i Lindholmen": {
    body: `<p>Söndag 6 september kl. 11–15 — <strong>Höstfest / Skördefest</strong> i Lindholmen och Orkesta hembygdsgård (arrangör Orkesta hembygdsförening). <strong>Fri entré.</strong></p>
      <p>På plats: olika utställare, foodtruck Super Burger, café med Ljuvliga bakverk, ponnyridning, pilkastning, fiskdamm, lyckohjul — och korta föredrag inne i hembygdsgården (föredrag och café håller till inomhus).</p>
      <ul>
        <li>11:30 Linda — fönstertomater</li>
        <li>12:15 Andreas — invasiva växtarter</li>
        <li>13:00 Anna från Mosters goda — mjölksyrade grönsaker</li>
        <li>13:45 Erik från Bällsta trädgård — äpplen och mustning</li>
        <li>14:30 Maija från Blomsterprakten Roslagen — beskärning av fruktträd</li>
      </ul>
      <p>Kalender: <a href="https://www.orkestahembygd.se/event" target="_blank" rel="noopener">orkestahembygd.se/event</a>.</p>`,
  },
  "Jano — Sylvia Vrethammar": {
    body: `<p>Söndag 20 september kl. 18:30 på <strong>Vallentuna Teater</strong> (Gymnasievägen 4B) — Sylvia Vrethammar med Jano. Café från 17:30 (servering via Triften).</p>
      <p>Biljetter: <a href="https://www.nortic.se/ticket/show/344818" target="_blank" rel="noopener">Nortic</a> · mer: <a href="https://jano.nu/" target="_blank" rel="noopener">jano.nu</a>.</p>`,
  },
  "Jano — Hans Backenroth Quartet": {
    body: `<p>Söndag 4 oktober kl. 18:30 på Vallentuna Teater — Hans Backenroth Quartet. Café från 17:30.</p>
      <p>Biljetter: <a href="https://www.nortic.se/ticket/show/344820" target="_blank" rel="noopener">Nortic</a> · <a href="https://jano.nu/" target="_blank" rel="noopener">jano.nu</a>.</p>`,
  },
  "Jano — Carin Lundin / Ronnie Gardiner": {
    body: `<p>Söndag 18 oktober kl. 18:30 — Carin Lundin / Ronnie Gardiner Quartet hos Jano på Vallentuna Teater. Café från 17:30.</p>
      <p>Biljetter: <a href="https://www.nortic.se/ticket/show/344861" target="_blank" rel="noopener">Nortic</a> · <a href="https://jano.nu/" target="_blank" rel="noopener">jano.nu</a>.</p>`,
  },
  "Jano — Johan Stengård Big Band": {
    body: `<p>Söndag 1 november kl. 18:30 — Johan Stengård Big Band på Vallentuna Teater. Café från 17:30.</p>
      <p>Biljetter: <a href="https://www.nortic.se/ticket/show/344862" target="_blank" rel="noopener">Nortic</a> · <a href="https://jano.nu/" target="_blank" rel="noopener">jano.nu</a>.</p>`,
  },
  "Jano — Miriam Aida": {
    body: `<p>Söndag 15 november kl. 18:30 — Miriam Aida (<em>Loving the Hero</em>) hos Jano. Café från 17:30.</p>
      <p>Biljetter: <a href="https://www.nortic.se/ticket/show/344915" target="_blank" rel="noopener">Nortic</a> · <a href="https://jano.nu/" target="_blank" rel="noopener">jano.nu</a>.</p>`,
  },
  "Jano — Vivian Buczek": {
    body: `<p>Söndag 29 november kl. 18:30 — Vivian Buczek (<em>Le Grand Michel</em>) hos Jano. Café från 17:30.</p>
      <p>Biljetter: <a href="https://www.nortic.se/ticket/show/344918" target="_blank" rel="noopener">Nortic</a> · <a href="https://jano.nu/" target="_blank" rel="noopener">jano.nu</a>.</p>`,
  },
  "SkördeFEST — AW & musik": {
    body: `<p>Fredag 12 september: musik och AW hos restaurangerna i Vallentuna centrum — upptakt till lördagens familjefest. Se <a href="https://vallentunacentrum.se/skordefest/" target="_blank" rel="noopener">vallentunacentrum.se/skordefest</a>.</p>`,
  },
  "SkördeFEST — familjefest": {
    body: `<p>Lördag 13 september kl. 10–15 på Tuna Torg: torgmarknad, barnaktiviteter, karusell, livemusik med Linda Rapp &amp; Livat, käpphästrace m.m. Programmet uppdateras löpande.</p>`,
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
