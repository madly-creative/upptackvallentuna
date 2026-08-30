/**
 * Places catalog — source of truth for SPA + SEO pages.
 *
 * Optional fields used by the UI:
 * - `tipsare` (string) — credit line, e.g. "Anna i Brottby" → "Tipsat av …"
 * - `types` (string[]) — multi-category membership (else single `type`)
 *
 * Category `smultronstalle`: prefer pin `color:"#c4454a"` (matches Nära dig).
 * Filter/nav for that category stays hidden until ≥ SMULTRON_FILTER_MIN places exist.
 */
const PLACES_RAW = [
    {name:"Vallentuna Stenugnsbageri",cat:"Bageri & Fika",type:"fika",lat:59.5344263,lng:18.0772938,color:"#c8912f",oh:8,ch:19,web:true,url:"https://www.vsbageri.se/",phone:"+46 8 511 705 70",blurb:"Kanelbullar med en nästan seg, mochig lyster — av många kallade de bästa i landet. Surdegsbröd, semlor och pizza ur ugnen, gott om plats både inne och ute, och filtar när det nyper.",short:"Kanelbullar i särklass och surdeg ur stenugnen.",img:"/assets/upplev/vallentuna-stenugnsbageri/cover.webp"},
    {name:"Café Valkyria",cat:"Café & Fika",type:"fika",lat:59.5455361,lng:18.128901,color:"#a85a3a",oh:11,ch:16,web:false,url:"",blurb:"Ett mysigt lantkafé utanför Vallentuna med hembakat, god caffè latte och ett vänligt välkomnande. Barn och hundar trivs, det finns spel att låna och en loppis intill — värt turen ut på landet.",short:"Hembakat lantkafé på landet, med loppis intill.",img:"/assets/upplev/cafe-valkyria/cover.webp"},
    {name:"Orkesta Granby Gård",cat:"Gård & besöksmål",type:"gard",types:["gard","fika"],aka:["Hökeriet"],lat:59.5946698,lng:18.0976369,color:"#3d4f3a",oh:12,ch:16,web:true,url:"https://hokeriet.se/",phone:"+46 76 945 90 10",blurb:"Orkesta Granby Gård — modernt lantbruk mitt i vikingalandskapet. På gården ligger Hökeriet: butik, servering och mötesplats med gårdens Charolais-kött, växthusodlat, närproducerade samarbeten och Granbyhällen i betet.",short:"Gård, Hökeriet och vikingalandskap — öppet till jul.",img:"/assets/upplev/orkesta-granby-gard/cover-garden.webp"},
    {name:"Tarby Gårdsbutik",cat:"Gårdsbutik",type:"gard",lat:59.6500882,lng:18.1340226,color:"#3d4f3a",oh:7,ch:19,web:false,url:"",phone:"+46 70 303 93 96",blurb:"En riktig liten gårdsbutik värd en avstickare. Ägg i toppklass, korv och köttlådor ur frysen. Den sortens ställe grannarna handlar troget hos för att det ska få finnas kvar.",short:"Superbra ägg och kött direkt från gården.",img:"/assets/upplev/tarby-gardsbutik/cover.webp"},
    {name:"Markims Bergby",cat:"Gårdsbutik",type:"gard",lat:59.6045806,lng:18.0359285,color:"#3d4f3a",oh:12,ch:16,web:true,url:"https://www.markimsbergby.se/",phone:"+46 70 457 55 97",blurb:"Gård i Markims kulturlandskap, driven i tre generationer. Här säljs eget nöt- och lammkött, plus honung, fårskinn och andra gårdsprodukter i klockboden — öppet efter överenskommelse.",short:"Nöt- och lammkött från gården i Markim.",img:"/assets/upplev/markims-bergby/cover.webp"},
    {name:"Gårdsbutiken Gamla Mjölkrummet",cat:"Gårdsbutik",type:"gard",lat:59.532572,lng:18.0396212,color:"#3d4f3a",oh:9,ch:20,web:false,url:"",blurb:"Liten gårdsbutik på Skålhamravägen — ägg, potatis, kött och den rödprickiga osten folk återvänder för. Enkelt, ärligt och nära centrum.",short:"Nära gårdsbutik med ägg, ost och kött.",img:"/assets/upplev/gardsbutiken-gamla-mjolkrummet/cover.webp"},
    {name:"Angarnssjöängen",cat:"Natur & Utflykt",type:"natur",lat:59.5430672,lng:18.1668485,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.lansstyrelsen.se/stockholm/besoksmal/naturreservat/angarnssjoangen.html",blurb:"Vidöppet fågellandskap med spänger, ängar och en klipphäll att blicka ut från — nästan som en nordisk savann. Ta med kikaren och fikakorgen; det finns till och med ett kafé för en paus.",short:"Fågelliv, spänger och öppna vyer att vandra i.",img:"/assets/upplev/angarnsjoangen/cover.webp"},
    {name:"Kvarnbadet",cat:"Bad & Utomhus",type:"natur",lat:59.5334979,lng:18.0662016,color:"#3d4f3a",oh:9,ch:21,web:true,url:"https://www.vallentuna.se/fritid-och-kultur/idrott-och-motion/simhallar-badhus-utomhusbad-och-simskola/",phone:"+46 8 587 851 83",blurb:"Vallentunas utomhusbad mitt i byn — två stora bassänger, mindre pooler för de små, beachvolley och kiosk. En klassisk familjefavorit när sommardagen ska kylas av.",short:"Utomhusbad med bassänger, beachvolley och kiosk.",img:"/assets/upplev/kvarnbadet/cover.webp"},
    {name:"Toftesta Holme",cat:"Bad & Natur",type:"natur",lat:59.558559,lng:18.2655986,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.vallentuna.se/fritid-och-kultur/friluftsliv-och-natur/badplatser-och-sjoar/",blurb:"En vacker liten badsjö lite avsides, med sandbotten och stillhet. Lättillgänglig, hundvänlig och precis lagom undanskymd — naturbad och avkoppling när du vill undan.",short:"Stilla badsjö med sandbotten, lite avsides.",img:"/assets/upplev/toftesta-holme/cover.webp"},
    {name:"Arkils Tingstad",cat:"Historia & Sevärt",type:"natur",lat:59.5159582,lng:18.0533033,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.vallentuna.se/runriket/runrikets-platser/arkils-tingstad/",blurb:"En välbevarad tingsplats från vikingatiden, där bygdens folk en gång samlades för att skipa rätt — ett slags utomhusparlament. Två runstenar och en vidunderlig utsikt över sjön.",short:"Vikingatida tingsplats med runstenar och sjöutsikt.",img:"/assets/upplev/arkils-tingstad/cover.webp"},
    {name:"Vallentuna Kulturhus",cat:"Kultur & Bibliotek",type:"butik",lat:59.5342735,lng:18.0765645,color:"#a85a3a",oh:9,ch:17,web:true,url:"https://www.vallentuna.se/fritid-och-kultur/kultur/vallentuna-kulturhus/",phone:"+46 8 587 853 50",blurb:"Ljust och nybyggt bibliotek och kulturhus mitt i centrum, med stora fönster, gott om barnböcker och hjälpsam personal. Här finns också teater och kulturskolans föreställningar.",short:"Ljust bibliotek och kulturhus mitt i byn.",img:"/assets/upplev/vallentuna-kulturhus/cover.webp"},
    {name:"Lilla Valentina",cat:"Restaurang & Pizza",type:"fika",lat:59.5340472,lng:18.0782195,color:"#a85a3a",oh:10,ch:21,web:true,url:"https://lillavalentina.se/",phone:"+46 8 511 737 04",blurb:"Folkkär kvarterspizzeria vid Tuna Torg med generösa portioner, vänlig personal och priser som inte skrämmer. Många Vallentunabors självklara fredagsval — enkelt och gott.",short:"Folkkär kvarterspizzeria vid torget.",img:"/assets/upplev/lilla-valentina/cover.webp"},
{name:"Lejonkulan Presenter & Inredning",cat:"Present & Inredning",type:"butik",lat:59.5339568,lng:18.0788346,color:"#a85a3a",oh:10,ch:18,web:true,url:"https://vallentunacentrum.se/butik/lejonkulan-trend-interior/",phone:"+46 8 511 807 30",blurb:"Lejonkulan Foto & Interiör vid Tuna Torg — inredning, presenter, kläder och smycken, plus hjälp med fotoframkallning, ramar och album. Personligt och omsorgsfullt mitt i centrum.",short:"Presenter, inredning och fotoframkallning vid torget.",img:"/assets/upplev/lejonkulan-presenter-och-inredning/cover.webp"},
    {name:"Ellen's Corner",cat:"Mode & Butik",type:"butik",lat:59.5348481,lng:18.0761409,color:"#a85a3a",oh:10,ch:18,web:true,url:"https://ellenscorner.se/",phone:"+46 70 810 95 48",blurb:"En liten boutique där tiden står still och man handlar i lugn och ro. Kvalitetsplagg valda med omsorg, mest tillverkat i Europa, och en personlig, kunnig stil bakom disken.",short:"Boutique med utvalda kvalitetsplagg och personlig stil.",img:"/assets/upplev/ellens-corner/cover.webp"},
    {name:"Silver & Sånt",cat:"Smycken & Hantverk",type:"butik",lat:59.5353942,lng:18.0787004,color:"#c8912f",oh:10,ch:18,web:true,url:"https://vallentunacentrum.se/butik/silver-sant/",phone:"+46 8 511 737 97",blurb:"Smycken och klockor i silver, guld och stål i centrumpassagen — eget varumärke Rozaro Jewelry plus Snö of Sweden och fler. Det rätta smycket för varje tillfälle.",short:"Utvalda smycken och klockor i centrum.",img:"/assets/upplev/silver-och-sant/cover.webp"},
    {name:"Ljuvliga Bakverk",cat:"Bakgårdscafé",type:"fika",lat:59.5962722,lng:18.1051425,color:"#a85a3a",oh:11,ch:16,web:false,url:"",phone:"+46 73 633 16 85",blurb:"Ett pyttelitet bakgårdscafé i Söderbydal där Susanne bakar allt själv — inklusive ett stort glutenfritt utbud och en hyllad glutenfri surdeg. Genuint, personligt och värt att snubbla över på cykelturen.",short:"Hembakat bakgårdscafé med stort glutenfritt utbud.",img:"/assets/upplev/ljuvliga-bakverk/cover.webp"},
    {name:"Össby Handelsträdgård",cat:"Handelsträdgård",type:"gard",lat:59.5704387,lng:18.2649844,color:"#3d4f3a",oh:9,ch:18,web:true,url:"https://www.facebook.com/groups/514554541943565/",phone:"+46 70 718 81 79",blurb:"Ett avslappnat utflyktsmål på landet i Brottby — vackra plantor, lokal honung och nära till lantlivet. Somrande tisdagar blir det bilträff med korv, glass och kaffe. Ta med en fikakorg.",short:"Plantor, lokal honung och lantliv i Brottby.",img:"/assets/upplev/ossby-handelstradgard/cover.webp"},
    {name:"Antikladan",cat:"Antikt & Loppis",type:"loppis",lat:59.5132004,lng:18.1642693,color:"#7a5a4a",oh:11,ch:16,web:true,url:"https://www.antikladangillinge.se/",phone:"+46 70 756 80 18",blurb:"En lada i Angarns-Veda fylld till bredden med antikt och kuriosa — som en liten galleria för fyndare, med olika handlare under samma tak. Glas, kläder, möbler, instrument — och fika på plats.",short:"Antik-lada full av kuriosa, med fika på plats.",img:"/assets/upplev/antikladan/cover.webp"},
    {name:"Lindra Second Hand",cat:"Second Hand",type:"loppis",lat:59.5389573,lng:18.0799576,color:"#7a5a4a",oh:11,ch:18,web:true,url:"https://lindra.se/vara-butiker/",phone:"+46 8 511 700 41",blurb:"Vallentunas välsorterade fyndhåla — kläder, böcker, leksaker, porslin sorterat i färg. Här hittar folk allt från fyra fina stolar för en spottstyver till läderhandskar ingen hunnit bära.",short:"Välsorterad second hand för kläder, porslin och fynd.",img:"/assets/upplev/lindra-second-hand/cover.webp"},
    {name:"Risbyle Runstenar",cat:"Runriket & Historia",type:"natur",lat:59.5076773,lng:18.0088479,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.vallentuna.se/runriket/runrikets-platser/risbyle/",blurb:"Två runstenar vid Vallentunasjöns strand, resta på 1000-talet av vikingen Ulf av Borresta till minne av en frände. Del av Runriket — Vallentuna hör till Sveriges runstenstätaste marker. Missa inte stenen nere vid vattnet.",short:"Vikingatida runstenar vid sjön, del av Runriket.",img:"/assets/upplev/risbyle-runstenar/cover.webp"},
    {name:"Gullbron",cat:"Runriket & Historia",type:"natur",lat:59.5417715,lng:18.0338551,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.vallentuna.se/runriket/runrikets-platser/gullbron/",blurb:"En stilla plats i Runriket där Lindösläkten reste stenar och byggde bro på 1000-talet. En liten vandring bakåt i tiden — ta det lugnt och låt landskapet berätta.",short:"Runstenar och brohistoria vid Gullbron.",img:"/assets/upplev/gullbron/cover.webp"},
    {name:"Vallentuna Naturreservat",cat:"Natur & Utflykt",type:"natur",lat:59.531644,lng:18.0606668,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.lansstyrelsen.se/stockholm/besoksmal/naturreservat/bjorkby-kyrkviken.html",blurb:"Björkby-Kyrkvikens naturreservat vid Vallentunasjön — öppet odlingslandskap, vassrika vikar och ett välfrekventerat friluftsområde alldeles nära centrum, med Vallentuna kyrka och Kvarnbadet i närheten.",short:"Naturreservat vid Vallentunasjön, nära centrum.",img:"/assets/upplev/vallentuna-naturreservat/cover.webp"},
    {name:"Kristorante",cat:"Restaurang & Pizza",type:"fika",lat:59.5118294,lng:18.0663662,color:"#a85a3a",oh:11,ch:21,web:true,url:"https://kristorante.se/",phone:"+46 8 511 772 20",blurb:"Stor och trivsam kvarterskrog i Bällstaberg med uteservering, äkta italiensk pizza, burgare och en vänlig ton. Inte fine dining — men vällagat, prisvärt och omtyckt av många i bygden.",short:"Trivsam kvarterskrog med italiensk pizza och uteservering.",img:"/assets/upplev/kristorante/cover.webp"},
    {name:"Presto Grillen",cat:"Streetfood",type:"fika",lat:59.5341742,lng:18.0792961,color:"#c8912f",oh:11,ch:20,web:true,url:"https://www.prestogrillen.se/",phone:"+46 8 37 76 06",blurb:"Grillen vid Tuna Torg som lokalborna håller kär — snabbt, vänligt och med goda tips över disk. Tunnbrödsrullarna är en klassiker att börja med. Enkel, ärlig streetfood mitt i centrum.",short:"Folkkär grill vid torget, kända tunnbrödsrullar.",img:"/assets/upplev/presto-grillen/cover.webp"},

    {name:"Grävelsta Gård",cat:"Gårdsbutik",type:"gard",lat:59.5248542,lng:18.0197024,color:"#3d4f3a",oh:11,ch:14,web:true,url:"https://gravelsta.se/",phone:"+46 70 855 69 35",blurb:"KRAV-märkt familjegård utanför Vallentuna med egen gårdsbutik — nötkött, lamm och ägg. Lördagar blir det öppet hus med grillstuga och riktiga gårdsprodukter.",short:"KRAV-gård med nötkött, lamm och ägg — lördagsöppet.",img:"/assets/upplev/gravelsta-gard/cover.webp"},
    {name:"Röda Magasinet",cat:"Antikt & Loppis",type:"loppis",lat:59.5844164,lng:18.1051790,color:"#7a5a4a",oh:11,ch:16,web:true,url:"https://rodamagasinet.se/",blurb:"Trevånings antik- och kuriosamagasin i Lindholmen — möbler, glas, porslin och fynd i en röd lada med enkel fika. En lokal syskonkänsla till Antikladan, lite längre norrut.",short:"Antik och kuriosa i röd lada i Lindholmen.",img:"/assets/upplev/roda-magasinet/cover.webp"},
    {name:"Novaretro",cat:"Antik & Retro",type:"loppis",lat:59.5585279,lng:18.2251221,color:"#7a5a4a",oh:10,ch:15,web:true,url:"https://www.novaretro.se/",phone:"+46 8 515 105 06",blurb:"Antik, design och retro på Stora Karby Gård i Brottby — möbler, porslin, samlarobjekt och fynd från 30- till 70-tal. Humana priser och nya varor varje vecka. Helgöppet under säsong.",short:"Retro och antik på Stora Karby Gård i Brottby.",img:"/assets/upplev/novaretro/cover.webp"},
    {name:"Röda Korset Second Hand",cat:"Second Hand",type:"loppis",lat:59.5327491,lng:18.0822733,color:"#7a5a4a",oh:11,ch:18,web:true,url:"https://www.rodakorset.se/ort/stockholm/vallentuna-kommun/second-hand/roda-korset-second-hand-vallentuna/",phone:"+46 8 511 730 40",blurb:"Volontärdriven second hand på Tellusvägen — kläder, husgeråd, leksaker, böcker och prylar. Fynda klimatsmart; överskottet går till Röda Korsets hjälpverksamhet.",short:"Volontärdriven second hand på Tellusvägen.",img:"/assets/upplev/roda-korset-second-hand/cover.webp"},
    {name:"Vallentuna kyrka",cat:"Runriket & Historia",type:"natur",lat:59.531285,lng:18.073672,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.vallentuna.se/runriket/runrikets-platser/vallentuna-kyrka/",blurb:"Medeltidskyrka mitt i byn — Runrikets stopp med flera runinskrifter i torn och mur. En stilla plats där bygdens historia ligger bokstavligen i väggen.",short:"Medeltidskyrka med runinskrifter mitt i centrum.",img:"/assets/upplev/vallentuna-kyrka/cover.webp"},
    {name:"Gällsta",cat:"Runriket & Historia",type:"natur",lat:59.5282821,lng:18.0115378,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.vallentuna.se/runriket/runrikets-platser/gallsta/",blurb:"Runrikets plats vid Gällsta — runstenar i odlingslandskapet väster om centrum. Ett kort stopp på vägen mellan Risbyle och Gullbron, där landskapet fortfarande bär 1000-talets spår.",short:"Runstenar i odlingslandskapet vid Gällsta.",img:"/assets/upplev/gallsta/cover.webp"},
    {name:"Gustavs udde",cat:"Bad & Natur",type:"natur",lat:59.5197400,lng:18.0649727,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.vallentuna.se/fritid-och-kultur/friluftsliv-och-natur/badplatser-och-sjoar/",blurb:"Kommunal badplats nära Bällsta station — sandstrand, brygga, rullstolsramp och picknickbord. Lugnare alternativ till Kvarnbadets bassänger när du vill ha sjöbad.",short:"Kommunalt bad i Bällsta med brygga och ramp.",img:"/assets/upplev/gustavs-udde/cover.webp"},
    {name:"Bergsjöns badplats",cat:"Bad & Natur",type:"natur",lat:59.649252,lng:18.273157,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://www.vallentuna.se/fritid-och-kultur/friluftsliv-och-natur/badplatser-och-sjoar/",blurb:"Kommunalt skogsbad i Kårsta — liten strand, brygga, omklädning och grillplats. Sjön är grund och blir snabbt varm; parkera vid Kårstaskolan och gå stigen in. Perfekt hemesterutflykt med eftermiddagssol.",short:"Skogsbad i Kårsta med brygga och grill.",img:"/assets/upplev/bergsjons-badplats/cover.webp"},
    {name:"AutoMat Kårsta",cat:"Matbutik",type:"butik",lat:59.6562863,lng:18.2729421,color:"#a85a3a",oh:5,ch:23,web:true,url:"https://www.neverclosed.se/butiker/automat-karsta/",blurb:"Obemannad lanthandel vid Kårsta torg — öppet 05–23. Kom in med Bank-ID via QR-kod, skanna själv och handla basvaror i en mysig, välkomnande butik. Liten men välsorterad.",short:"Obemannad matbutik vid Kårsta torg, 05–23.",img:"/assets/upplev/automat-karsta/cover.webp"},
    {name:"Vallboden",cat:"Hantverk & Butik",type:"butik",lat:59.5329146,lng:18.0768776,color:"#a85a3a",oh:10,ch:16,web:false,url:"",blurb:"Liten butik med keramik och hantverk i centrum — personligt urval och lokala händer bakom hyllorna. Värt att titta in när du ändå är på Centralvägen.",short:"Keramik och hantverk mitt i centrum.",img:"/assets/upplev/vallboden/cover.webp"},
    {name:"Gästis Kök & Bar",cat:"Restaurang & Bar",type:"fika",lat:59.5339177,lng:18.0783348,color:"#a85a3a",oh:11,ch:22,web:true,url:"https://gastiskokochbar.se/",phone:"+46 8 511 793 40",blurb:"Kök och bar vid Tuna Torg — lokal kvarterskänsla, mat och dryck mitt i centrum. En plats där man kan äta ordentligt utan att lämna torget.",short:"Kök och bar vid Tuna Torg.",img:"/assets/upplev/gastis-kok-och-bar/cover.webp"},
    {name:"Langhard Lantbruk",cat:"Gårdsbutik",type:"gard",lat:59.6152255,lng:18.0603835,color:"#3d4f3a",oh:14,ch:16,web:true,url:"https://www.langhardlantbruk.se/",phone:"+46 70 771 03 67",blurb:"Småskaligt lantbruk i Markim med vaktlar, Hedemorahöns, får och odling. Gårdsbutik helger — lamm, ägg, grönsaker och mer direkt från gården.",short:"Gårdsbutik i Markim med ägg, lamm och odling.",img:"/assets/upplev/langhard-lantbruk/cover.webp"},
    {name:"Folkantik och Vintage",cat:"Antik & Vintage",type:"loppis",lat:59.5843230,lng:18.1068567,color:"#7a5a4a",oh:11,ch:16,web:true,url:"https://www.instagram.com/folkantikochvintage/",blurb:"Antikbutik intill Lindholmens station — allmoge, asiatiskt och folkkonst med tonvikt på det folkliga. Elin och Andreas fyller den klassiska handelsboden med fynd från 20 kronor och uppåt.",short:"Antik och folkkonst vid Lindholmens station.",img:"/assets/upplev/folkantik-och-vintage/cover.webp"},
    {name:"Jano",cat:"Jazz & Kultur",type:"butik",lat:59.5329946,lng:18.0806741,color:"#a85a3a",oh:17,ch:21,web:true,url:"https://jano.nu/",blurb:"Jazzklubb Nordost (Jano) spelar på Vallentuna Teater — konsertkvällar med café från 17:30 och musik från 18:30. Biljetter via Nortic eller biblioteket; medlemskap ger rabatt.",short:"Jazzkonserter på Vallentuna Teater.",img:"/assets/upplev/jano/cover.webp"},
    {name:"Vasakullen",cat:"Historia & Sevärt",type:"natur",lat:59.583808,lng:18.118011,color:"#2f3d2e",oh:0,ch:24,web:true,url:"https://sv.wikipedia.org/wiki/Lindholmens_g%C3%A5rd",blurb:"Höjden vid Lindholmens gård i Orkesta — enligt en tradition Gustav Vasas födelseplats. Minnessten från 1866, medeltida borgruin och naturminnesmärkta ekar. Orten Lindholmen växte fram när Roslagsbanan fick station här.",short:"Gustav Vasa-tradition, ruin och minnessten i Lindholmen.",img:"/assets/upplev/vasakullen/cover.webp"},
    {name:"Vallentuna Konditori",cat:"Konditori & Fika",type:"fika",lat:59.5331156,lng:18.0782774,color:"#c8912f",oh:7,ch:18,web:false,url:"",phone:"+46 8 511 740 04",blurb:"Klassiskt konditori på Centralvägen sedan tidigt 2000-tal — bröd, fikabröd, tårtor och smörgåstårta mitt i centrum. Ett litet kvartersställe för frukostfik eller något gott att ta med.",short:"Traditionellt konditori på Centralvägen.",img:"/assets/upplev/vallentuna-konditori/cover.webp"},
    {name:"Äppellundens Café",cat:"Café & Fika",type:"fika",lat:59.6558191,lng:18.2721718,color:"#a85a3a",oh:12,ch:16,web:true,url:"https://www.4h.se/karsta/",phone:"+46 73 852 27 98",blurb:"Caféet hos Kårsta 4H på Äppellunden — fika, enklare mat, minigolf och barnvänlig gårdsmiljö. En utflykt norrut när ni vill blanda kaffe med utomhuslek.",short:"4H-café i Kårsta med minigolf och gårdskänsla.",img:"/assets/upplev/appellundens-cafe/cover.webp"},
    {name:"Roslagsloppis",cat:"Bakluckeloppis",type:"loppis",lat:59.6347953,lng:18.3315439,color:"#7a5a4a",oh:11,ch:15,web:true,url:"https://www.roslagsloppis.se/",blurb:"Stor bakluckeloppis bakom Roslagsstoppet vid Söderhall — sälj från bilen eller fynda bland andra. Söndagar 11–15 under sommarsäsongen; fri entré för besökare. Missa inte cocosbollarna från fabriken intill.",short:"Söndagsbakluckeloppis vid Roslagsstoppet.",img:"/assets/upplev/roslagsloppis/cover.webp"},
    {name:"Lilla Cirkeln Secondhand",cat:"Second Hand",type:"loppis",aka:["Lillacirkeln Secondhand","Lilla Cirkeln"],lat:59.53425,lng:18.07855,color:"#7a5a4a",oh:10,ch:18,web:true,url:"https://www.lillacirkeln.se/",blurb:"Kommissionsbaserad second hand mitt på Tuna Torg — kläder, barnprylar och märkesfynd i liten, personlig butik. Klimatsmart shopping utan att lämna centrum.",short:"Personlig second hand mitt på Tuna Torg.",img:"/assets/upplev/lilla-cirkeln-secondhand/cover.webp"},
    {name:"Vallentuna skolmuseum",cat:"Kultur & Museum",type:"natur",aka:["Skolmuseet","Össeby-Garn skolmuseum"],lat:59.56265,lng:18.25415,color:"#2f3d2e",oh:13,ch:16,web:true,url:"https://www.vallentuna.se/fritid-och-kultur/kultur/kulturmiljo/vallentuna-skolmuseum/",phone:"+46 8 587 853 54",blurb:"I skolhuset från 1887 vid Össeby-Garns kyrka står en skolsal och lärarbostad som runt 1910 — plus planscher och skolmaterial från bygden. Nära Toftesta Holme; fri entré när det är öppet.",short:"Skolsal från 1910-talet vid Össeby-Garns kyrka.",img:"/assets/upplev/vallentuna-skolmuseum/cover.webp"},
    {name:"Sweden History Tours",cat:"Guidning & historia",type:"guidning",color:"#2f3d2e",oh:0,ch:0,web:true,url:"https://www.swedenhistorytours.se/",blurb:"Lokalt guideföretag — bokade turer på svenska eller engelska vid Arkils tingstad, Vallentuna kyrka, i Markim och Orkesta, plus guidade cykelturer. Fokus på historiska guidningar och folktro; specialturer vid jul och halloween runt kvarnen och kyrkan.",short:"Guidade historieturer och folktro — bokas efter förfrågan.",img:"/assets/upplev/sweden-history-tours/cover.webp"},
];

/** Stable URL slugs when display spelling differs from the historical path. */
const SLUG_BY_NAME = {
  Angarnssjöängen: "angarnsjoangen",
};

/** Accept one-off legacy slugs after a display-name spelling fix. */
const SLUG_ALIASES = {
  angarnssjoangen: "angarnsjoangen",
};

export function placeSlug(name) {
  if (SLUG_BY_NAME[name]) return SLUG_BY_NAME[name];
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " och ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Canonical place records — every place has a stable `slug` key. */
export const places = PLACES_RAW.map((p) => ({
  ...p,
  slug: p.slug || placeSlug(p.name),
}));

export function placeBySlug(slug, list = places) {
  const key = SLUG_ALIASES[slug] || slug;
  return list.find((p) => p.slug === key || placeSlug(p.name) === key) || null;
}

/**
 * Resolve a place by canonical slug or exact display name.
 * Guides/events keep name strings in source data; call this at build/runtime.
 */
export function resolvePlaceRef(ref, list = places) {
  if (ref == null || ref === "") return null;
  const t = String(ref).trim();
  if (!t) return null;
  const bySlug = placeBySlug(t, list);
  if (bySlug) return bySlug;
  return list.find((p) => p.name === t) || null;
}

/** True when a place may appear on the map (requires coordinates). */
export function isMappablePlace(p) {
  return (
    p &&
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng)
  );
}

export function schemaTypeFor(place) {
  switch (place.type) {
    case "fika":
      return "FoodEstablishment";
    case "gard":
    case "butik":
    case "loppis":
      return "Store";
    case "natur":
    case "smultronstalle":
      return "TouristAttraction";
    case "guidning":
      return "TouristInformationCenter";
    default:
      return "LocalBusiness";
  }
}

/** Hide Smultronställen filter/nav until enough places exist (no empty tab). */
export const SMULTRON_FILTER_MIN = 5;

export function countPlacesOfType(list, typeKey) {
  return (list || []).filter((p) => placeHasType(p, typeKey)).length;
}

export function isSmultronFilterVisible(list, min = SMULTRON_FILTER_MIN) {
  return countPlacesOfType(list, "smultronstalle") >= min;
}

/** Category keys a place belongs to (`types` array, else single `type`). */
export function placeTypes(p) {
  if (Array.isArray(p?.types) && p.types.length) {
    return [...new Set(p.types.filter(Boolean))];
  }
  return p?.type ? [p.type] : [];
}

export function placeHasType(p, typeKey) {
  return placeTypes(p).includes(typeKey);
}

