/**
 * Evenemangskalender — verifierad mot arrangörssidor (aug 2026).
 * Hemmaplan-marknader: https://hemmaplanmedia.se/event
 * Past dates auto-hide i appen. Tider kan ändras — käll-URL i `source`.
 */
const FALLBACK_IMG = "/assets/hero/2.webp";

export const events = [
  {
    host: "Hökeriet",
    title: "Sommarkväll med Live-Jazz",
    date: "2026-08-07",
    when: "Fre 7 aug · 19–21",
    time: "19:00 – 21:00",
    cat: "KULTUR",
    note: "Mat och livejazz på Hökeriet, Orkesta Granby Gård — Jan Levander med trion Jazz Latitude 59° (barytonsax, gitarr, kontrabas). Från 495 kr/person via Hökeriets bokning.",
    img: "/assets/evenemang/hokeriet-live-jazz/cover.webp",
    source: "https://hokeriet.understory.io/sv/experience/e5f1d480e8599f924086394b90a1fbab",
  },
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
    host: "Tuna Bio / Kultur Vallentuna",
    title: "Lovbio: Vaiana",
    date: "2026-08-13",
    addedDate: "2026-08-10",
    when: "Tor 13 aug · 14:00",
    time: "14:00 – 15:30",
    cat: "KULTUR",
    note: "Lovbio på Vallentuna Teater — Disneys Vaiana i live action. Biljetter 90 kr via Nortic.",
    img: "/assets/evenemang/lovbio-vaiana/cover.webp",
    source: "https://nortic.se/ticket/event/82660",
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
    host: "Väsby kvarnförening / Kultur Vallentuna",
    title: "Drop-in Väsby kvarn",
    date: "2026-08-15",
    addedDate: "2026-08-10",
    when: "Lör 15 aug · 12–14",
    time: "12:00 – 14:00",
    cat: "KULTUR",
    note: "Lördagsöppet i Väsby kvarn vid Kvarnbadet — bemannad kvarn, utställning om historien och funktionen. Packa gärna picknick. Fri entré.",
    img: "/assets/evenemang/drop-in-vasby-kvarn/cover.webp",
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/08/drop-in-vasby-kvarn2/",
  },
  {
    host: "VaDoM / Vallentuna Dans och Musikförening",
    title: "Living Room Concert — Roslagens ungdomsspelmanslag",
    date: "2026-08-18",
    addedDate: "2026-08-14",
    when: "Tis 18 aug · 19:00",
    time: "19:00 – 20:00",
    cat: "KULTUR",
    note: "Folkmusik i trädgården på Rosenlundsvägen 14, östra Bällsta — Roslagens spelmanslags ungdomssektion. Ta med något att sitta på och kaffekorg. Fri entré.",
    img: "/assets/evenemang/living-room-concert-vadom/cover.webp",
    source: "https://vadom.se/program.html",
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
    host: "Hökeriet",
    title: "Sommarbuffé på Hökeriet",
    date: "2026-08-21",
    when: "Fre 21 aug · 19–21",
    time: "19:00 – 21:00",
    cat: "MAT",
    note: "Sensommarbuffé med långbord i växthuset och sång av Maria — den årliga traditionen är tillbaka. Från 495 kr/person via Hökeriets bokning.",
    img: "/assets/evenemang/hokeriet-sommarbuffe/cover.webp",
    source: "https://hokeriet.understory.io/sv/experience/b84495386fe4ab5e3eeed34adb116d9d",
  },
  {
    host: "Orkesta Bygdegård Lindholmen",
    title: "Linedance en-dagskurs",
    date: "2026-08-22",
    when: "Lör 22 aug · 10–13",
    time: "10:00 – 13:00",
    cat: "KULTUR",
    note: "Prova-på linedance utan partner i Orkesta hembygdsgård. Inga förkunskaper krävs — instruktör Linda Blumenthal (Bara man Vill). Se bygdegårdens kalender för pris/anmälan.",
    img: "/assets/evenemang/linedance-en-dagskurs/cover.webp",
    source: "https://www.orkestahembygd.se/event",
  },
  {
    host: "Väsby kvarnförening / Kultur Vallentuna",
    title: "Drop-in Väsby kvarn",
    date: "2026-08-22",
    addedDate: "2026-08-10",
    when: "Lör 22 aug · 12–14",
    time: "12:00 – 14:00",
    cat: "KULTUR",
    note: "Lördagsöppet i Väsby kvarn vid Kvarnbadet — bemannad kvarn och utställning. Packa gärna picknick. Fri entré. Kvarnens dag (större fest) är 5 september.",
    img: "/assets/evenemang/drop-in-vasby-kvarn/cover.webp",
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/08/drop-in-vasby-kvarn3/",
  },
  {
    host: "Bara man Vill",
    title: "Linedance — Kickoff & gratis prova på",
    date: "2026-08-23",
    when: "Sön 23 aug · 17–20:30",
    time: "17:00 – 20:30",
    cat: "KULTUR",
    note: "Gratis kickoff inför höstens linedance-terminer: prova på 17–18 (ingen föranmälan), gemensam dans ca 18–20:30. Rosendalsskolan Södras matsal, Teknikvägen 25.",
    img: "/assets/evenemang/bara-man-vill-kickoff/cover.webp",
    source: "https://baramanvill.se/2026/07/24/kickoff-och-gratis-prova-pa-23-8/",
  },
  {
    host: "Tuna Bio / Kultur Vallentuna",
    title: "Bio Halvåtta: The Invite",
    date: "2026-08-27",
    addedDate: "2026-08-10",
    when: "Tor 27 aug · 19:30",
    time: "19:30 – 21:30",
    cat: "KULTUR",
    note: "Bio på Vallentuna Teater — dramakomedi av Olivia Wilde med Seth Rogen, Penélope Cruz och Edward Norton. Biljetter 120 kr via Nortic.",
    img: "/assets/evenemang/bio-halvatta-the-invite/cover.webp",
    source: "https://nortic.se/ticket/event/85436",
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
    host: "Hökeriet",
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
    host: "Hökeriet",
    title: "Granby Vikingagård — guidad visning",
    date: "2026-08-30",
    when: "Sön 30 aug · 14–15",
    time: "14:00 – 15:00",
    cat: "NATUR",
    note: "Personlig guidning till vikingagården vid Granbyhällen — hallbyggnad, gravar och gårdsliv under yngre järnåldern. Samling vid Hökeriet. Från 200 kr/person.",
    img: "/assets/evenemang/hokeriet-granby-vikingagard/cover.webp",
    source: "https://hokeriet.understory.io/sv/experience/9ec9190d8fe8512ca0d843c783c85ec7",
  },
  {
    host: "Vallentuna Hockey",
    title: "Vallentuna Hockey Week",
    date: "2026-09-04",
    when: "4–12 sep",
    time: "Matcher kväll/helg",
    cat: "SPORT",
    note: "Hockeyfest i Vallentuna Ishall (Parkvägen 3): bl.a. VHF–Huddinge 4/9, AIK–BIK Karlskoga 9/9 och Hammarby-dubbel 12/9. Grill, öl och musik utomhus — biljetter via hockeyweek.se.",
    img: "/assets/og.jpg",
    source: "https://hockeyweek.se/",
  },
  {
    host: "Frösunda Hembygdsförening / Sunda Frön",
    title: "Frösunda skördemarknad",
    date: "2026-09-05",
    when: "Lör 5 sep · 11–14",
    time: "11:00 – 14:00",
    cat: "MARKNAD",
    note: "Liten skördemarknad vid Frösunda station — grönsaker, hantverk, perenner, äppelsortbestämning, korvgrillning, loppis och hembygdsföreningens fika. Välkommen som besökare eller försäljare (Swish).",
    img: "/assets/evenemang/frosunda-skordemarknad/cover.webp",
    source: "https://www.hembygd.se/frosunda/activities/56301",
  },
  {
    host: "Väsby kvarnförening / Kultur Vallentuna",
    title: "Kvarnens dag",
    date: "2026-09-05",
    addedDate: "2026-08-10",
    when: "Lör 5 sep · 12–15",
    time: "12:00 – 15:00",
    cat: "MARKNAD",
    note: "Familjefest vid Väsby kvarn nära Kvarnbadet — sång, musik, ponnyridning (4H), pyssel, korvgrillning (scouterna) och utställning i kvarnen. Fri entré.",
    img: "/assets/evenemang/kvarnens-dag/cover.webp",
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/09/kvarnens-dag/",
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
    host: "Hökeriet",
    title: "Kokroki",
    date: "2026-09-19",
    addedDate: "2026-09-03",
    when: "Lör 19 sep · 10–14",
    time: "10:00 – 14:00",
    cat: "KULTUR",
    note: "Krokimålning med levande kor som modeller på Orkesta Granby Gård — ledning konstnären Åsa Alneng. Material ingår, lunch serveras. Från 875 kr/person via Hökeriets bokning.",
    img: "/assets/evenemang/kokroki-hokeriet/cover.webp",
    source: "https://hokeriet.understory.io/sv/experience/e19426ad-c1a7-4465-8ea8-675c429256d8",
  },
  {
    host: "Vallentuna Hembygdsförening",
    title: "Hembygdstorsdag — Porkalaparentesen",
    date: "2026-09-03",
    addedDate: "2026-08-14",
    when: "Tor 3 sep · 19:00",
    time: "19:00 – 20:00",
    cat: "KULTUR",
    note: "Föreläsning i Kulturrummet, Vallentuna Kulturhus — Henrik Wirén om Porkalaparentesen 1944–1956 (sovjetisk bas på Finlands sydkust). Första torsdagen i månaden.",
    img: "/assets/evenemang/hembygdstorsdag-porkala/cover.webp",
    source: "https://www.hembygd.se/vallentuna/activities/55941",
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
    host: "Vallentuna Bluesförening / Kultur Vallentuna",
    title: "B.B. & The Blues Shacks",
    date: "2026-10-02",
    addedDate: "2026-08-10",
    when: "Fre 2 okt · 19:00",
    time: "19:00 – 21:00",
    cat: "KULTUR",
    note: "Tyska bluesbandet B.B. & The Blues Shacks på Vallentuna Teater. Insläpp från 18:30. Biljetter från 200 kr via Nortic.",
    img: "/assets/evenemang/bb-and-the-blues-shacks/cover.webp",
    source: "https://nortic.se/ticket/show/353486",
  },
  {
    host: "Vallentuna Hembygdsförening",
    title: "Hembygdstorsdag — Svensk militärmusik",
    date: "2026-10-01",
    addedDate: "2026-08-14",
    when: "Tor 1 okt · 19:00",
    time: "19:00 – 20:00",
    cat: "KULTUR",
    note: "Föreläsning i Kulturrummet, Vallentuna Kulturhus — svensk militärmusik genom femhundra år (jubileumsår 2026). Första torsdagen i månaden.",
    img: "/assets/evenemang/hembygdstorsdag-militarmusik/cover.webp",
    source: "https://www.hembygd.se/vallentuna/activities/55942",
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
    host: "Kultur Vallentuna / Riksteatern",
    title: "Riksteatern: Den enfaldige mördaren",
    date: "2026-10-08",
    addedDate: "2026-08-10",
    when: "Tor 8 okt · 19:00",
    time: "19:00 – 21:30",
    cat: "KULTUR",
    note: "Pjäs av Dennis Magnusson på Vallentuna Teater, inspirerad av Hans Alfredsons film. Ca 2,5 h inkl. paus. Biljetter 390 kr (ung t.o.m. 26 år 340 kr) via Nortic.",
    img: "/assets/evenemang/riksteatern-den-enfaldige-mordaren/cover.webp",
    source: "https://nortic.se/ticket/event/81913",
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
    host: "Vallentuna Bluesförening / Kultur Vallentuna",
    title: "Scenfredag – Mr Bob’s Machinery",
    date: "2026-10-23",
    addedDate: "2026-08-10",
    when: "Fre 23 okt · 19:00",
    time: "19:00 – 21:00",
    cat: "KULTUR",
    note: "Releasegig på Caféscenen i Vallentuna Kulturhus med Mr Bob’s Machinery från södra Uppland. Servering via Café Triften. Biljetter från 150 kr via Nortic eller biblioteket.",
    img: "/assets/evenemang/scenfredag-mr-bobs-machinery/cover.webp",
    source: "https://nortic.se/ticket/show/353483",
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
    host: "Hemmaplan Media / Vallentuna Centrum",
    title: "Vallentuna Höstmarknad",
    date: "2026-09-19",
    addedDate: "2026-08-18",
    when: "Lör 19 sep · 11–15",
    time: "11:00 – 15:00",
    cat: "MARKNAD",
    note: "Säsongens skörd, lokala företag och höstmys på Tuna Torg. Arrangeras av Hemmaplan Media i samarbete med Vallentuna Centrum och Fastpartner.",
    img: "/assets/evenemang/vallentuna-hostmarknad/cover.webp",
    source: "https://hemmaplanmedia.se/event",
  },
  {
    host: "Konstrundan Täby Vallentuna",
    title: "Konstrundan — öppna ateljéer",
    date: "2026-09-12",
    addedDate: "2026-08-10",
    when: "Lör–sön 12–13 sep · 11–17",
    time: "11:00 – 17:00",
    cat: "KULTUR",
    note: "Öppna ateljéer under Konstrundan Täby Vallentuna — se hela programmet och öppettider på konstrundans webb.",
    img: "/assets/evenemang/konstrundan-opna-ateljeer/cover.webp",
    source: "https://tabyvallentunakonstrunda.se/",
  },
  {
    host: "Tuna Bio / Kultur Vallentuna",
    title: "Bio Halvåtta",
    date: "2026-09-17",
    addedDate: "2026-08-10",
    when: "Tor 17 sep · 19:30",
    time: "19:30 – 21:30",
    cat: "KULTUR",
    note: "Bio på hemmaplan i Vallentuna Teater — ny biofilm var tredje torsdag. Biljetter 120 kr. Filmsättning publiceras när den är klar.",
    img: "/assets/evenemang/bio-halvatta/cover.webp",
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/09/bio-halvatta/",
  },
  {
    host: "Vadom / Kultur Vallentuna",
    title: "Musik i handlingstider",
    date: "2026-09-19",
    addedDate: "2026-08-10",
    when: "Lör 19 sep · 13–14",
    time: "13:00 – 14:00",
    cat: "KULTUR",
    note: "Folkmusik med Vadom på Caféscenen i Vallentuna Kulturhus — en paus i lördagshandeln. Arrangör: Vallentuna dans- och musikförening (Vadom).",
    img: "/assets/evenemang/musik-i-handlingstider/cover.webp",
    source: "https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/09/musik-i-handlingstider/",
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
    host: "Hemmaplan Media / Vallentuna Centrum",
    title: "Vallentuna Julmarknad",
    date: "2026-12-12",
    addedDate: "2026-08-18",
    when: "Lör 12 dec · 11–15",
    time: "11:00 – 15:00",
    cat: "MARKNAD",
    note: "Julstämning på Tuna Torg & Torgpassagen — glögg, hantverk och lokala delikatesser. Arrangeras av Hemmaplan Media i samarbete med Vallentuna Centrum och Fastpartner.",
    img: "/assets/evenemang/julmarknad-centrum/cover.webp",
    source: "https://hemmaplanmedia.se/event",
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
  "Lovbio: Vaiana": {
    body: `<p>Torsdag 13 augusti kl. 14:00 på <strong>Vallentuna Teater</strong> (Gymnasievägen 4B) — lovbio med Disneys <em>Vaiana</em> i live action. Arrangör: Tuna Bio / Kultur Vallentuna.</p>
      <p>Biljetter 90 kr: <a href="https://nortic.se/ticket/event/82660" target="_blank" rel="noopener">Nortic</a> · <a href="https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/08/lovbio-vaiana--live-action/" target="_blank" rel="noopener">kommunens kalender</a>.</p>`,
  },
  "Drop-in Väsby kvarn": {
    body: `<p>Lördagsöppet i <strong>Väsby kvarn</strong> vid Kvarnbadet — Väsby kvarnförening bemannar kvarnen och visar utställningen om historien och funktionen. Packa gärna picknickkorgen. Fri entré.</p>
      <p>Öppet bl.a. 15 och 22 augusti kl. 12–14. Större fest: <em>Kvarnens dag</em> 5 september. Info: <a href="https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/08/drop-in-vasby-kvarn2/" target="_blank" rel="noopener">vallentuna.se</a>.</p>`,
  },
  "Living Room Concert — Roslagens ungdomsspelmanslag": {
    body: `<p>Tisdag 18 augusti kl. 19 i trädgården på <strong>Rosenlundsvägen 14</strong>, östra Bällsta — Living Room Concert med Roslagens spelmanslags ungdomssektion. Arrangör: VaDoM (Vallentuna Dans och Musikförening).</p>
      <p>Ta med något att sitta på och kaffekorg. <strong>Fri entré.</strong> Program: <a href="https://vadom.se/program.html" target="_blank" rel="noopener">vadom.se</a>.</p>`,
  },
  "Hembygdstorsdag — Porkalaparentesen": {
    body: `<p>Torsdag 3 september kl. 19–20 i Kulturrummet, Vallentuna Kulturhus — Hembygdstorsdag med Vallentuna Hembygdsförening. Henrik Wirén berättar om Porkalaparentesen 1944–1956.</p>
      <p>Info: <a href="https://www.hembygd.se/vallentuna/activities/55941" target="_blank" rel="noopener">hembygd.se / Vallentuna</a>.</p>`,
  },
  "Hembygdstorsdag — Svensk militärmusik": {
    body: `<p>Torsdag 1 oktober kl. 19–20 i Kulturrummet, Vallentuna Kulturhus — Hembygdstorsdag om svensk militärmusik genom femhundra år (jubileumsår 2026).</p>
      <p>Info: <a href="https://www.hembygd.se/vallentuna/activities/55942" target="_blank" rel="noopener">hembygd.se / Vallentuna</a>.</p>`,
  },
  "Bio Halvåtta: The Invite": {
    body: `<p>Torsdag 27 augusti kl. 19:30 på Vallentuna Teater — <em>The Invite</em>, dramakomedi av Olivia Wilde med Seth Rogen, Penélope Cruz och Edward Norton. Arrangör: Tuna Bio / Kultur Vallentuna.</p>
      <p>Biljetter 120 kr: <a href="https://nortic.se/ticket/event/85436" target="_blank" rel="noopener">Nortic</a>.</p>`,
  },
  "Kvarnens dag": {
    body: `<p>Lördag 5 september kl. 12–15 vid <strong>Väsby kvarn</strong> nära Kvarnbadet — familjefest med sång, musik, ponnyridning (4H), pyssel, korvgrillning (scouterna) och utställning i kvarnen. <strong>Fri entré.</strong></p>
      <p>Arrangör: Väsby kvarnförening i samarbete med Kultur Vallentuna. Info: <a href="https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/09/kvarnens-dag/" target="_blank" rel="noopener">vallentuna.se</a>.</p>`,
  },
  "Konstrundan — öppna ateljéer": {
    body: `<p>12–13 september — öppna ateljéer under <strong>Konstrundan Täby Vallentuna</strong>. Se hela programmet och öppettider på konstrundans webb.</p>
      <p><a href="https://tabyvallentunakonstrunda.se/" target="_blank" rel="noopener">tabyvallentunakonstrunda.se</a>.</p>`,
  },
  "Bio Halvåtta": {
    body: `<p>Torsdag 17 september kl. 19:30 på Vallentuna Teater — bio på hemmaplan (ny biofilm var tredje torsdag). Biljetter 120 kr. Filmsättning publiceras när den är klar.</p>
      <p>Info: <a href="https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/09/bio-halvatta/" target="_blank" rel="noopener">vallentuna.se</a>.</p>`,
  },
  "Musik i handlingstider": {
    body: `<p>Lördag 19 september kl. 13–14 på <strong>Caféscenen</strong> i Vallentuna Kulturhus — folkmusik med Vadom (Vallentuna dans- och musikförening) i samarbete med Kultur Vallentuna. Gör en paus i lördagshandeln.</p>
      <p>Info: <a href="https://www.vallentuna.se/evenemang-och-upplevelser/evenemangskalender/2026/09/musik-i-handlingstider/" target="_blank" rel="noopener">vallentuna.se</a>.</p>`,
  },
  "B.B. & The Blues Shacks": {
    body: `<p>Fredag 2 oktober kl. 19:00 på <strong>Vallentuna Teater</strong> — B.B. &amp; The Blues Shacks. Insläpp från 18:30. Arrangör: Vallentuna Bluesförening i samarbete med Kultur Vallentuna.</p>
      <p>Biljetter från 200 kr: <a href="https://nortic.se/ticket/show/353486" target="_blank" rel="noopener">Nortic</a> · bandet: <a href="https://www.bluesshacks.de/en/" target="_blank" rel="noopener">bluesshacks.de</a>.</p>`,
  },
  "Riksteatern: Den enfaldige mördaren": {
    body: `<p>Torsdag 8 oktober kl. 19:00 på Vallentuna Teater — pjäs av Dennis Magnusson, inspirerad av Hans Alfredsons film <em>Den enfaldige mördaren</em>. Cirka 2 tim 30 min inkl. paus. Servering från kl. 18.</p>
      <p>Biljetter 390 kr (ung t.o.m. 26 år 340 kr): <a href="https://nortic.se/ticket/event/81913" target="_blank" rel="noopener">Nortic</a>.</p>`,
  },
  "Scenfredag – Mr Bob’s Machinery": {
    body: `<p>Fredag 23 oktober kl. 19 på Caféscenen i Vallentuna Kulturhus — releasegig med Mr Bob’s Machinery från södra Uppland. Café Triften har servering med rättigheter. Arrangör: Vallentuna Bluesförening / Kultur Vallentuna.</p>
      <p>Biljetter från 150 kr: <a href="https://nortic.se/ticket/show/353483" target="_blank" rel="noopener">Nortic</a> eller Vallentuna bibliotek.</p>`,
  },
  "Sommarkväll med Live-Jazz": {
    body: `<p>Fredag 7 augusti kl. 19–21 på <strong>Hökeriet</strong>, Orkesta Granby Gård — sommarkväll med mat och livejazz. Jan Levander med trion <em>Jazz Latitude 59°</em>: Jan Levander (barytonsax), Mats Larsson (gitarr) och Filip Augustsson (kontrabas).</p>
      <p>Från 495 kr/person. Boka: <a href="https://hokeriet.understory.io/sv/experience/e5f1d480e8599f924086394b90a1fbab" target="_blank" rel="noopener">Hökeriet / Understory</a> · <a href="https://hokeriet.se/bokningar/" target="_blank" rel="noopener">hokeriet.se/bokningar</a>.</p>`,
  },
  "Sommarbuffé på Hökeriet": {
    body: `<p>Fredag 21 augusti kl. 19–21 på <strong>Hökeriet</strong>, Orkesta Granby Gård — sensommarbuffé med långbord i växthuset och sång av Maria. Den årliga traditionen är tillbaka.</p>
      <p>Från 495 kr/person. Boka: <a href="https://hokeriet.understory.io/sv/experience/b84495386fe4ab5e3eeed34adb116d9d" target="_blank" rel="noopener">Hökeriet / Understory</a>.</p>`,
  },
  "Granby Vikingagård — guidad visning": {
    body: `<p>Söndag 30 augusti kl. 14–15 — personlig guidning till vikingagården vid Granbyhällen. Hallbyggnad, gravar och gårdsliv under yngre järnåldern; samling vid Hökeriet på Orkesta Granby Gård.</p>
      <p>Från 200 kr/person. Boka: <a href="https://hokeriet.understory.io/sv/experience/9ec9190d8fe8512ca0d843c783c85ec7" target="_blank" rel="noopener">Hökeriet / Understory</a>.</p>`,
  },
  "Viskväll med Lindar och Liljor": {
    body: `<p>Fredag 28 augusti kl. 19–21 på <strong>Hökeriet</strong>, Orkesta Granby Gård (Granby, Vallentuna). Musikaliska duon Lindar och Liljor bjuder på visor och folkmusik — tolkningar av Dan Andersson, vallmusik och egna visor. Cirka två timmar.</p>
      <p>Biljetter från 495 kr/person. Boka: <a href="https://hokeriet.understory.io/sv/experience/b49ea0ae822f1cd02f8b2755242700d2" target="_blank" rel="noopener">Hökeriet / Understory</a> · fler bokningar: <a href="https://hokeriet.se/bokningar/" target="_blank" rel="noopener">hokeriet.se/bokningar</a>.</p>`,
  },
  "Kokroki": {
    body: `<p>Lördag 19 september kl. 10–14 på <strong>Hökeriet</strong>, Orkesta Granby Gård — <em>Kokroki</em>: krokimålning med levande kor som modeller under ledning av konstnären och illustratören Åsa Alneng.</p>
      <p>Samling på Hökeriet kl. 10 för genomgång, sedan ut till kornas. Lunch serveras kl. 12 (vegetariskt alternativ finns — maila särskild kost till <a href="mailto:info@hokeriet.se">info@hokeriet.se</a> senast två dagar innan). Vernissage kl. 14. Material ingår.</p>
      <p>Från 875 kr/person. Boka: <a href="https://hokeriet.understory.io/sv/experience/e19426ad-c1a7-4465-8ea8-675c429256d8" target="_blank" rel="noopener">Hökeriet / Understory</a>.</p>`,
  },
  "Linedance en-dagskurs": {
    body: `<p>Lördag 22 augusti kl. 10–13 i Orkesta hembygdsgård. Linedance utan partner — enkla danser, inga förkunskaper. Instruktör Linda Blumenthal (<a href="https://baramanvill.se/" target="_blank" rel="noopener">Bara man Vill</a>).</p>
      <p>Se <a href="https://www.orkestahembygd.se/event" target="_blank" rel="noopener">orkestahembygd.se/event</a> för pris och anmälan. Dagen efter: gratis <em>Kickoff &amp; prova på</em> hos Bara man Vill (23 aug).</p>`,
  },
  "Linedance — Kickoff & gratis prova på": {
    body: `<p>Söndag 23 augusti i <strong>Rosendalsskolan Södras matsal</strong>, Teknikvägen 25 i Vallentuna — gratis kickoff inför höstens linedance-terminer med <a href="https://baramanvill.se/" target="_blank" rel="noopener">Bara man Vill</a>.</p>
      <ul>
        <li><strong>17:00–18:00</strong> — gratis prova på (ingen föranmälan)</li>
        <li><strong>ca 18:00–20:30</strong> — gemensam dans (blandade nivåer; häng på även utan förkunskaper)</li>
      </ul>
      <p>Fika finns; ta gärna med något att bjuda på. Mer: <a href="https://baramanvill.se/2026/07/24/kickoff-och-gratis-prova-pa-23-8/" target="_blank" rel="noopener">baramanvill.se</a>.</p>`,
  },
  "Frösunda skördemarknad": {
    body: `<p>Lördag 5 september kl. 11–14 vid <strong>Frösunda station</strong> — skördemarknad arrangerad av Frösunda Hembygdsförening och odlingsgruppen Sunda Frön. Liten, genuin skala: av grannar, för grannar.</p>
      <p>På plats bl.a. äppelsortbestämning (ta med 5 äpplen), korvgrillning med Frösunda SK, grönsaker, honung, sticklingar/perenner, stickat &amp; virkat, bakverk, loppis och hembygdsföreningens fika.</p>
      <p>Vill du sälja? Meddela gärna innan eller kom spontant — Swish och prisskyltade varor krävs. Bord i mån av plats. Info: <a href="https://www.hembygd.se/frosunda/activities/56301" target="_blank" rel="noopener">hembygd.se / Frösunda</a>.</p>`,
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
        <li>13:00 Anna från <a href="/?verksamhet=mosters-goda">Mosters Goda</a> — mjölksyrade grönsaker</li>
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
  "Vallentuna Höstmarknad": {
    body: `<p>Lördag 19 september kl. 11–15 på <strong>Tuna Torg</strong> — säsongens skörd, lokala företag och höstmys i centrum.</p>
      <p>Arrangeras av Hemmaplan Media i samarbete med Vallentuna Centrum och Fastpartner. Info: <a href="https://hemmaplanmedia.se/event" target="_blank" rel="noopener">hemmaplanmedia.se/event</a>.</p>`,
  },
  "Julmarknad i Lindholmen": {
    body: `<p>Julmarknad i Orkesta Bygdegård 6 december kl. 11–15 med hantverk, lokala smaker och fika.</p>`,
  },
  "Vallentuna Julmarknad": {
    body: `<p>Lördag 12 december kl. 11–15 på <strong>Tuna Torg &amp; Torgpassagen</strong> — julstämning med glögg, hantverk och lokala delikatesser.</p>
      <p>Arrangeras av Hemmaplan Media i samarbete med Vallentuna Centrum och Fastpartner. Info: <a href="https://hemmaplanmedia.se/event" target="_blank" rel="noopener">hemmaplanmedia.se/event</a>.</p>`,
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

const MONTH_SV = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];

/** "2026-09" → "September" (append year when `showYear`). */
export function eventMonthLabel(ym, { showYear = false } = {}) {
  const m = Number(String(ym).slice(5, 7));
  const y = String(ym).slice(0, 4);
  if (!m || m < 1 || m > 12) return String(ym);
  const name = MONTH_SV[m - 1];
  return showYear ? `${name} ${y}` : name;
}

/**
 * Group sorted upcoming events into month buckets (YYYY-MM).
 * @returns {{ key: string, label: string, events: object[] }[]}
 */
export function groupEventsByMonth(list) {
  const sorted = [...(list || [])].sort((a, b) => a.date.localeCompare(b.date));
  const years = new Set(sorted.map((e) => String(e.date).slice(0, 4)));
  const showYear = years.size > 1;
  const groups = [];
  const byKey = new Map();
  for (const e of sorted) {
    const key = String(e.date).slice(0, 7);
    let g = byKey.get(key);
    if (!g) {
      g = { key, label: eventMonthLabel(key, { showYear }), events: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.events.push(e);
  }
  return groups;
}

export function eventSlug(e) {
  return `${e.title}-${e.date}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
