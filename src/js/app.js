import { events as EVENTS_SEED, EVENT_CONTENT } from "../data/events.js";
import { EVENT_FILTERS, eventCatLabel, eventMatchesFilter } from "../data/eventCategories.js";
import { SITE } from "../data/site.js";
import { deliverForm, buildMailtoUrl } from "../lib/forms.js";
import {
  swedishHoliday,
  daySlot as libDaySlot,
  isOpenAt,
  addDays,
} from "../lib/hours.js";
import { places as PLACES_SEED, placeSlug, placeBySlug, resolvePlaceRef, isMappablePlace, placeHasType, placeTypes, isSmultronFilterVisible } from "../data/places.js";
import { PLACE_META, A } from "../data/placeMeta.js";
import {
  guides as GUIDES_SEED,
  featuredGuide,
  guideBySlug,
  seasonLabel,
  GUIDE_HOME_FILTERS,
  guidesForHomeFilter,
} from "../data/guides.js";
import { producers as PRODUCERS_SEED, producerBySlug, producersAtPlaceSlug, producerSlug } from "../data/producers.js";
import { recurring as RECURRING_SEED, recurringSlug, recurringToday, recurringWhenLine } from "../data/recurring.js";
import {
  formatWeekday,
  WEEKDAY_ORDER_MON_FIRST,
  stockholmWeekday,
  stockholmTodayISO,
  stockholmHourMinute,
  stockholmMonth,
} from "../data/stockholm.js";
import { picksRotationSeed, selectRotatedDiversePicks, hashStr } from "../lib/picksRotate.js";
import {
  daypartTypesForMood,
  prepareRankedForPicks,
  weatherScoreDelta,
  isOutdoorBathPlace,
  isHotSwimWeather,
  picksWhyForWeather,
} from "../lib/picksFit.js";
import {
  matchesPrimaryOrSecondary,
  eventSearchPrimary,
  eventSearchSecondary,
  recurringSearchPrimary,
  recurringSearchSecondary,
  placeSearchPrimary,
  placeSearchSecondary,
  producerSearchPrimary,
  producerSearchSecondary,
} from "../lib/searchMatch.js";
import { facts as FACTS_SEED, currentFact, isSagen } from "../data/facts.js";
import {
  resolveVisitState,
  writeLastVisit,
  collectSinceLastDelta,
  deltaIsEmpty,
  placeGroupLabel,
  eventGroupLabel,
} from "../lib/sinceLastVisit.js";
import {
  NEAR_FILTERS,
  filterPlacesNear,
  pinColorForType,
  pinIconSvgForType,
  summarizeNearGroups,
  walkMinutesFromKm,
} from "../lib/nearYou.js";

  const CONFIG = { kommun: SITE.kommun, region: SITE.region, center: SITE.center, zoom: SITE.zoom };
  const K = CONFIG.kommun;
  // Prefer OpenFreeMap Liberty (Voyager-like, no API key). OSM raster is fallback only.
  const MAP_STYLE="https://tiles.openfreemap.org/styles/liberty";
  const MAP_TILE_FALLBACK={
    url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    opts:{
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains:"abc",
      maxZoom:19,
    },
  };
  function addBasemap(mapInst, Lref=window.L){
    if(!mapInst||!Lref) return null;
    if(typeof Lref.maplibreGL==="function" && typeof window.maplibregl!=="undefined"){
      try{
        return Lref.maplibreGL({ style:MAP_STYLE, interactive:false }).addTo(mapInst);
      }catch(err){
        console.warn("OpenFreeMap failed, falling back to OSM tiles", err);
      }
    }
    return Lref.tileLayer(MAP_TILE_FALLBACK.url, MAP_TILE_FALLBACK.opts).addTo(mapInst);
  }

  const places = PLACES_SEED;
  const guides = GUIDES_SEED;
  const producers = PRODUCERS_SEED;
  const facts = FACTS_SEED;
  const recurring = RECURRING_SEED;

  let events = EVENTS_SEED.map(e => ({ ...e }));
  let currentGuideSlug = null;
  let currentProducerSlug = null;

  // Bygdens röster — editorial portraits (published = sort only, never shown)
  const portraits=[
    {
      slug:"stenugnsbageriet-bagaren",
      person:"Bagaren",
      role:"Bagare & eldsjäl",
      place:"Vallentuna Stenugnsbageri",
      draft:true, // gömd tills Bygdens röster öppnas på riktigt
      heroImg:"/assets/roester/stenugnsbageriet-bagaren/hero.webp",
      portraitImg:"/assets/roester/stenugnsbageriet-bagaren/portratt.webp",
      dek:"Om surdegen som tar tre dygn och varför det är värt det.",
      body:[
        "Det luktar redan från Allévägen innan du öppnar dörren. Inte den söta, påträngande doften av industriell kanel — utan något djupare. Mjöl, ugn, tid.",
        "Bakom stenugnen i Vallentuna centrum börjar dagen tidigt. Surdegen har sitt eget schema, och det är inte förhandlingsbart. Tre dygn från start till ett bröd som faktiskt smakar något. I en värld som vill ha allt nu, är det en sorts trots.",
        "Bageriet har blivit en träffpunkt utan att någon egentligen planerat det. Folk kommer för bullen och stannar för samtalet — för lunchmackan, gelaton, doften av nybakat. Stamgästerna syns på hur de tar sin latte, och på om de frågar efter gårdagens surdegslimpa som nästan alltid är slut före lunch.",
        "Här handlar det sällan om trender. Hellre om mjöl, om hur en kall natt påverkar jäsningen, om barnen som står på tå vid disken och pekar. Det är det som gör stället mer än en bageriadress: att någon bryr sig hela vägen från deg till påse.",
        "När solen ligger på uteplatserna och filtarna kommer fram, ser man det tydligt — bygden samlas där det finns värme. I ugnen, och bakom disken."
      ],
      quote:"Ett bra bröd kan man inte skynda på.",
      published:"2026-10"
    },
    {
      slug:"markims-bergby-erik",
      person:"Erik Holm",
      role:"Gårdsägare",
      place:"Markims Bergby",
      heroImg:"",
      portraitImg:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=75",
      dek:"På en 1700-talsgård i Markim möter barnen djuren — och köttet kommer från samma jord.",
      body:[
        "Markim ligger en bit från centrum, men känslan när man svänger in på gårdsplanen är omedelbar: här har någon bott och brukat länge. Timret, ängen, lukten av hö när vinden ligger rätt.",
        "Erik Holm tar emot som om man vore grannens barnbarn. Inte som kund i första hand, utan som någon som ska förstå var maten kommer ifrån. Barnen får ofta möta djuren. De vuxna får svar på frågor om köttlådor, säsong och vad som faktiskt växer här just nu.",
        "Gårdsbutiken är inte stor, och det är poängen. Det som finns i disken har en historia som går att peka på — ängen där borta, stallet, den långa raden av arbete som inte syns på en etikett i en stormarknad.",
        "Erik pratar om ansvar mer än om varumärke. Om att hålla gården vid liv så att nästa generation fortfarande har något att ta över. Om marknader där grannar träffas och byter recept lika gärna som pengar.",
        "När skördemarknaden kommer och gårdsplanen fylls, ser man vad bygden egentligen är: inte en lista på kartan, utan människor som väljer att stanna och göra något av jorden."
      ],
      quote:"Om barnen får se djuren, förstår de maten på ett annat sätt.",
      published:"2026-09"
    },
    {
      slug:"angarn-lisa",
      person:"Lisa Norén",
      role:"Naturguide & eldsjäl",
      place:"Angarnssjöängen",
      heroImg:"",
      portraitImg:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=75",
      dek:"Vid spängerna i Angarn lär hon folk att stå still — och faktiskt se fåglarna.",
      body:[
        "Angarnssjöängen ser vidöppen ut första gången. Nästan som en nordisk savann, brukar folk säga. Lisa Norén ler åt det — hon har hört det förr — men hon håller med om känslan. Här krymper brådskan.",
        "Hon har guidat skolklasser, nyfikna stockholmare och Vallentunabor som bott här i trettio år utan att egentligen gått ut på spängerna. Hennes knep är enkelt: gå långsamt. Stanna. Titta igen. Kikaren är bara ett verktyg; tålamodet är det egentliga.",
        "Lisa pratar om fåglarna som grannar mer än som arter på en lista. Om vårens brus, om höstens tysta mellanrum, om hur ett kafé i kanten av reservatet kan bli pausen som gör att fler orkar hela rundan.",
        "Hon är noga med att det inte ska kännas som prestation. En utflykt hit kan vara en kvart på klipphällen. Det räcker. Det är fortfarande att vara i bygden på riktigt — inte bara köra förbi på väg någon annanstans.",
        "När skymningen kommer och ljuset lägger sig mjukt över vattnet, förstår man varför hon aldrig tröttnar. Angarn ger tillbaka varje gång man ger den tid."
      ],
      quote:"Man behöver inte se allt. Man behöver bara se något ordentligt.",
      published:"2026-08"
    }
  ];

  // Vallentuna levererar — chronological stream.
  // datePublished = ISO YYYY-MM-DD (source of truth for sort, display, future JSON-LD/arkiv)
  // Deep link: #levererar=<id>  → opens stream and scrolls to that moment
  const moments = [
    {
      id: "bygden-svarade",
      title: "Bygden svarade",
      img: "/assets/levererar/bygden-svarade/cover.webp",
      body: "För en vecka sedan lade jag upp en karta över Vallentuna. Jag hade hållit på några veckor, mest på kvällarna, och trodde ärligt talat att ett femtiotal personer skulle titta på den.\n\nSedan hände något jag inte räknat med.\n\nDet började komma mejl. Fredrik, som sitter i styrelsen för Vallentuna Dans, undrade hur de bäst får in sina kurser och danskvällar. Anna hörde av sig och berättade att hon gör surkål och picklade grönsaker för hand i sitt eget kök, och frågade försiktigt om hon passade in i guiden. Det gör hon. Carl-Axel berättade att Företagareföreningen lanserade namnet \"Upptäck Vallentuna\" redan 1984, i samband med sin företagsmässa. Det hade jag ingen aning om.\n\nOch så tipsen. Ställen jag aldrig hört talas om, trots att de legat en kvart bort hela tiden. Evenemang jag missat. Vänliga rättelser från folk som visste bättre än jag om öppettider. En som skrev att jag hade fel om en gårdsbutik, och som hade rätt.\n\nDet är därför den här sektionen heter Vallentuna levererar.\n\nSedan lanseringen har det tillkommit ännu fler platser och evenemang till sajten och ambitionen är att fortsätta fylla upp med fler guldkorn.\n\nJag lade upp en karta. Jag fick tillbaka en bygd.\n\nTack. Fortsätt skicka.",
      datePublished: "2026-08-17"
    },
    {
      id: "sigrids-sjalvplock-markim",
      title: "Sigrids självplock i Markim",
      img: "/assets/levererar/sigrids-sjalvplock-markim/cover.webp",
      imgs: [
        "/assets/levererar/sigrids-sjalvplock-markim/cover.webp",
        "/assets/levererar/sigrids-sjalvplock-markim/skylt.webp",
        "/assets/levererar/sigrids-sjalvplock-markim/falt.webp"
      ],
      body: "Frugan såg en blänkare på Facebook om Sigrids självplock av solrosor i Markim. Sagt och gjort — vi satte oss i bilen och tog kringelkrokvägarna bort mot Snåttsta gård.\n\nJag älskar initiativ som det här. Alla intäkter går oavkortat till Blågula Bilen och Ukraina. Man plockar sina egna solrosor och swishar enligt skylten vid vägen.\n\nVi gick därifrån med en famn full av solrosor och en fin känsla i kroppen. Det enkla, det lokala, det som görs av hjärtat — det finns här, om man bara vet var man ska titta.",
      datePublished: "2026-08-02"
    },
    {
      id: "biltraff-ur-tomma-intet",
      title: "En bilträff ur tomma intet",
      img: "/assets/levererar/biltraff-ur-tomma-intet/cover.webp",
      body: "På väg mot Arninge för lite ärenden idag får vi plötsligt syn på en enorm bilträff på Vallentuna flygfält. Jag har varit på bilträffar förr, men detta var nog den största hittills. Så otroligt många häftiga bilar — veteranare i alla former, men också nyare modeller. Vi hade ingen aning om att den skulle vara där.\n\nVi stannade till. Och blev kvar i flera timmar.\n\nJag har alltid dragits till formerna, hantverket och designen på bilar från förr — det fanns en själ i dem, ett uttryck. Mycket av det känns förlorat idag. Att få stå mitt i en hel äng av det, helt oväntat, var något extra.\n\nEn riktigt fin överraskning på vad som skulle ha blivit en helt vanlig mathandling.",
      datePublished: "2026-08-01"
    }
  ];

  // Rich editorial content + gallery images (Unsplash: free-to-use stämningsbilder).
  // Texter är omskrivna utifrån offentliga källor (kommun, verksamheters sidor, lokalpress).
  const U=(id,w=900)=>`https://images.unsplash.com/${id}?w=${w}&q=75`;
  const CONTENT={
    "Vallentuna Stenugnsbageri":{
      address:"Allévägen 6A, Vallentuna centrum",
      facts:["Stenugnsbakat","Lunch & pizza","Gelato","Familjevänligt"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/vallentuna-stenugnsbageri/brod.webp",alt:"Surdegsbröd framför stenugnen"},
        {url:"/assets/upplev/vallentuna-stenugnsbageri/bullar.webp",alt:"Bullar, kakor och bakverk i disken"},
        {url:"/assets/upplev/vallentuna-stenugnsbageri/lunch.webp",alt:"Lunch, bulle och kaffe på Stenugnsbageriet"},
        {url:"/assets/upplev/vallentuna-stenugnsbageri/gelato.webp",alt:"Hemgjord gelato med citron"}
      ],
      body:`<p>Mitt i Vallentuna centrum bakas det på riktigt — surdeg, bullar och bröd ur stenugn, ofta omtalade kanelbullar med seg, mochig lyster. Här finns mer än fikadisk: kallkök och lunch, napolitanskt inspirerad pizza, hemgjord gelato och en liten shop med delikatesser.</p>
      <p>Ordinarie öppettider (centrum): mån–fre 07–19, lör–sön 08–18 enligt vsbageri.se. Förbeställning går bra (pizza tidsbokas dock inte). Tel 08-511 705 70 · <a href="https://www.vsbageri.se/" target="_blank" rel="noopener">vsbageri.se</a>.</p>`
    },
    "Café Valkyria":{
      address:"Lingsbergsvägen 49, Vallentuna",
      facts:["Helgfik","Hembakat","Barnvänligt","Hundvänligt"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/cafe-valkyria/cover.webp",alt:"Välkommen till Café Valkyria — uteplatsen vid den röda ladan"},
        {url:"/assets/upplev/cafe-valkyria/uteplats.webp",alt:"Uteplatsen med Öppet-skylt och cafébord"},
        {url:"/assets/upplev/cafe-valkyria/interior.webp",alt:"Disken med bakverk och kylskåp"},
        {url:"/assets/upplev/cafe-valkyria/personalen.webp",alt:"Personal bakom disken på Café Valkyria"}
      ],
      body:`<p>Familjedrivet helgfik en bit utanför centrum, öppnat av Monica, Alexandra och Andrea Brink-Sehlberg. Namnet Valkyria nickar åt Vallentunas runstenar och nordisk mytologi — fokus på gemenskap snarare än snabb fika.</p>
      <p>Hembakat, caffè latte, lekhörna, hundvänligt och loppis intill. Öppet främst helger året runt (ägarnas heltidsjobb styr). Ingen egen webb — kolla Facebook/Instagram för aktuella tider innan du åker ut på Lingsbergsvägen.</p>`
    },
    "Orkesta Granby Gård":{
      address:"Orkesta-Granby, 186 94 Vallentuna",
      facts:["Lantbruk","Charolais","Spannmål","Granbyhällen","Arbetslivsmuseum"],
      localPhotos:true,
      photoCredit:"Foto: Orkesta Granby Gård (granbygard.com).",
      images:[
        {url:"/assets/upplev/orkesta-granby-gard/cover-garden.webp",alt:"Grusväg genom Orkesta Granby Gård"},
        {url:"/assets/upplev/orkesta-granby-gard/kor.webp",alt:"Kor i solnedgång på Granby"},
        {url:"/assets/upplev/orkesta-granby-gard/runsten.webp",alt:"Granbyhällen — vikingatida runhäll"},
        {url:"/assets/upplev/orkesta-granby-gard/cover.webp",alt:"Vy mot gården och Hökeriet"}
      ],
      body:`<p><strong>Orkesta Granby Gård</strong> är det moderna livsmedelsproducerande lantbruket mitt i vikingalandskapet — spannmål, köttproduktion och odling.</p>
      <p>Mitt i betesmarken ligger <strong>Granbyhällen</strong>, en av Sveriges till ytan största vikingatida runhällar. Gården är också listad som <strong>arbetslivsmuseum</strong> (ArbetSam).</p>
      <p>För butik, servering, turistinformation, guidade turer och event: se <button type="button" class="place-btn" onclick="openPlace('Hökeriet')">Hökeriet →</button>. Mer om lantbruket: <a href="https://granbygard.com/" target="_blank" rel="noopener">granbygard.com</a> · arbetslivsmuseum: <a href="https://arbetsam.com/sok-arbetslivsmuseum/?museum_id=4996" target="_blank" rel="noopener">ArbetSam</a>.</p>`
    },
    "Hökeriet":{
      address:"Orkesta-Granby, 186 94 Vallentuna",
      facts:["Butik","Servering","Guidade turer","Event","Turistinfo"],
      localPhotos:true,
      photoCredit:"Foto: Orkesta Granby Gård / Hökeriet.",
      images:[
        {url:"/assets/upplev/hokeriet/cover.webp",alt:"Vy mot Hökeriet på Orkesta Granby Gård"},
        {url:"/assets/upplev/orkesta-granby-gard/cover-garden.webp",alt:"Grusväg genom Orkesta Granby Gård"},
        {url:"/assets/upplev/orkesta-granby-gard/kor.webp",alt:"Kor i solnedgång på Granby"},
        {url:"/assets/upplev/orkesta-granby-gard/runsten.webp",alt:"Granbyhällen — vikingatida runhäll"}
      ],
      body:`<p><strong>Hökeriet</strong> ligger på <button type="button" class="place-btn" onclick="openPlace('Orkesta Granby Gård')">Orkesta Granby Gård →</button> — butik, servering, turistinformation, guidade turer och event.</p>
      <p>I butiken hittar du gårdens Charolais-kött, rapsolja, honung och äppelmust tillsammans med utvalda delikatesser, närproducerade samarbeten, vikingatida hantverk och svensk hemslöjd. Växthus ger gurka, tomat och örter till köket.</p>
      <p>Boka gärna guidad visning av Granby Vikingagård eller hantverkstorpet Granbylund. Sommaröppet med servering lördag–söndag 12–16. Frågor eller bokning av event: <a href="mailto:info@hokeriet.se">info@hokeriet.se</a> · tel 08-612 30 05 / 076-945 90 10. Webb: <a href="https://hokeriet.se/" target="_blank" rel="noopener">hokeriet.se</a> · gården: <a href="https://granbygard.com/" target="_blank" rel="noopener">granbygard.com</a>.</p>`
    },
    "Tarby Gårdsbutik":{
      address:"Tarbyvägen / Tarby gård, Frösunda",
      facts:["Självbetjäning","Ägg & kött","Swish","Öppet dagligen"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/tarby-gardsbutik/cover.webp",alt:"Kor på bete vid Tarby gård"},
        {url:"/assets/upplev/tarby-gardsbutik/kor.webp",alt:"Kor i ladugården på Tarby"},
        {url:"/assets/upplev/tarby-gardsbutik/traktor.webp",alt:"Höskörd med traktor på Tarby"},
        {url:"/assets/upplev/tarby-gardsbutik/rapsolja.webp",alt:"Kallpressad rapsolja från Tarby Gård"}
      ],
      body:`<p>Liten självbetjäningsbutik vid landsvägen — ägg, korv, köttfärs, styckdetaljer och mer från gården. Betalning med Swish; ingen personal bakom disk. Öppet alla dagar ca 07–19.</p>
      <p>Drivs av Marianne Holmström och Fredrik Andersson med fokus på närproducerat och kretslopp; delar av betesmarken är Natura 2000. GPS kan lura dig fel — följ skylt på grusväg från vägen mellan Gottröra och Frösunda. Tel 070-303 93 96.</p>`
    },
    "Markims Bergby":{
      address:"Markim, Vallentuna (ca fyra mil norr om Stockholm)",
      facts:["Nöt & lamm","Tre generationer","Gårdsbutik i klockboden","Öppet efter överenskommelse"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/markims-bergby/cover.webp",alt:"Markims Bergby och Markims kyrka i kulturlandskapet"},
        {url:"/assets/upplev/markims-bergby/butik.webp",alt:"Gårdsbutiken i klockboden på Markims Bergby"},
        {url:"/assets/upplev/markims-bergby/far.webp",alt:"Får på bete vid Markims Bergby"}
      ],
      body:`<p>Välkommen till Markims Bergby i kulturlandskapet Markim. Gården har drivits i tre generationer och erbjuder högkvalitativt nöt- och lammkött — djuren föds upp på gården, fodret odlas på plats och slakten sker på ett närbeläget slakteri i Roslagen.</p>
      <p>Gårdsbutiken ligger i klockboden (med vällingklocka över taknocken). Utbudet följer säsongen: nötkött under höst, vinter och vår; lammkött tidigt på hösten. Här finns också egen honung, fårskinn, linoljesåpa, tvålar och annat hantverk när lagret räcker.</p>
      <p>Öppet enligt överenskommelse — mejla <a href="mailto:matilda@markimsbergby.se">matilda@markimsbergby.se</a> och boka en tid. Följ gärna gården på Instagram eller Facebook (@markimsbergby) för aktuellt utbud. Mer info på <a href="https://www.markimsbergby.se/" target="_blank" rel="noopener">markimsbergby.se</a>.</p>`
    },
    "Gårdsbutiken Gamla Mjölkrummet":{
      address:"Skålhamravägen 112, 186 92 Vallentuna",
      facts:["Ägg & ost","Nära centrum","Närproducerat"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/gardsbutiken-gamla-mjolkrummet/cover.webp",alt:"Entrén till Gamla Mjölkrummet på Kragsta"},
        {url:"/assets/upplev/gardsbutiken-gamla-mjolkrummet/butik.webp",alt:"Hylla med potatis och gula ärter i gårdsbutiken"},
        {url:"/assets/upplev/gardsbutiken-gamla-mjolkrummet/kor.webp",alt:"Kor i hagen vid gården"},
        {url:"/assets/upplev/gardsbutiken-gamla-mjolkrummet/falt.webp",alt:"Traktor och potatissättning på åkern"}
      ],
      body:`<p>En liten gårdsbutik på Skålhamravägen för den som vill handla lokalt utan lång bilresa. Här hittar du ägg, potatis, kött och den där osten folk återvänder för — enkelt och ärligt i mjölkrummets anda.</p>
      <p>Ingen egen webbplats hittad; utbud och tider skiftar med säsong. Ta med egen kasse och fråga gärna om veckans favoriter.</p>`
    },
    "Angarnssjöängen":{
      address:"Angarnssjöängens naturreservat, Brottby",
      facts:["Fågelsjö","~7 km slinga","Natura 2000","Alltid öppet"],
      localPhotos:true,
      photoCredit:"Foto: Wikimedia Commons (landskap) — platsen är naturreservat.",
      images:[
        {url:"/assets/upplev/angarnsjoangen/cover.webp",alt:"Angarnssjöängen från utsiktspunkt"},
        {url:"/assets/upplev/angarnsjoangen/kor.webp",alt:"Kor i betesmark vid Angarnssjöängen"},
        {url:"/assets/upplev/angarnsjoangen/sjo.webp",alt:"Angarnssjöängens öppna landskap"}
      ],
      body:`<p>En av Stockholms läns främsta fågelsjöar — betade strandängar, spänger och den knappt sju kilometer långa <strong>Sjöängsslingan</strong>. Är du inte fågelskådare redan blir du kanske det efter ett besök. Skyddat sedan 1982, förvaltas av Länsstyrelsen.</p>
      <h3>Bra att veta</h3>
      <ul>
        <li>Fågelskyddsområde: tillträdesförbud i markerad zon 1 apr–30 sep</li>
        <li>Hundar ska vara kopplade; tält/eld endast på anvisade platser</li>
        <li>Parkering vid Örsta, Olhamra och Skesta hage — Örsta bäst för tillgänglighet</li>
        <li>Buss från Vallentuna mot Kårsta, hållplats Örsta</li>
      </ul>
      <p>Mer: <a href="https://www.lansstyrelsen.se/stockholm/besoksmal/naturreservat/angarnssjoangen.html" target="_blank" rel="noopener">Länsstyrelsen</a> · <a href="https://www.naturkartan.se/sv/stockholms-lan/angarnssjoangen" target="_blank" rel="noopener">Naturkartan</a>.</p>`
    },
    "Kvarnbadet":{
      address:"Vid Vallentunasjöns norra ände, Vallentuna",
      facts:["50 m bassäng","Plaskdamm","Beachvolley","Kiosk & grill"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/kvarnbadet/cover.webp",alt:"Översikt över Kvarnbadet med plaskdamm och 50-metersbassäng"},
        {url:"/assets/upplev/kvarnbadet/bassang.webp",alt:"50-metersbassängen på Kvarnbadet en solig dag"},
        {url:"/assets/upplev/kvarnbadet/skylt.webp",alt:"Välkommen till Kvarnbadet — kartskylt med badets faciliteter"}
      ],
      body:`<p>Kommunalt utomhusbad vid Vallentunasjöns norra ände: tempererad 50-metersbassäng (djup 120–180 cm), grundare bassäng (80 cm) och plaskdamm (30 cm). På området finns kiosk &amp; grill, omklädning, lekplats, soldäck, beachvolley, fotbollsplan — och den röda kvarnen i bakgrunden.</p>
      <p>Säsong 2026: öppet 1 juni–30 augusti. Ordinarie tider mån–tors 09–21, fre 09–19, lör–sön 10–19. Midsommarafton stängt; v.33–35 stänger badet 19:00 alla dagar. För att bada utan vuxen: minst 12 år och simkunnig.</p>
      <p>Tillgänglighet: RWC, lyft till bassäng och ramper. Info: <a href="https://www.vallentuna.se/fritid-och-kultur/idrott-och-motion/simhallar-badhus-utomhusbad-och-simskola/" target="_blank" rel="noopener">vallentuna.se</a>.</p>`
    },
    "Toftesta Holme":{
      address:"Lilla Garn / väster om Össeby-Garns kyrka",
      facts:["Kommunalt bad","Sandbotten","Hundvänligt","Ramp"],
      localPhotos:true,
      photoCredit:"Foto: Vallentuna kommun.",
      images:[
        {url:"/assets/upplev/toftesta-holme/cover.webp",alt:"Badplats i Vallentuna kommun"}
      ],
      body:`<p>En av kommunens fyra skötta badplatser — i vackert kulturlandskap väster om Össeby-Garns kyrka. Parkera gärna mitt emot kyrkan och gå genom bygden; badet ligger strax utanför bebyggelsen.</p>
      <p>Sandbotten, stillhet och ramp som underlättar för rullstolsburna. Hundar välkomna kopplade. Vattenkvalitet och temperatur publiceras på Havs- och vattenmyndighetens badplatsinfo (sök Vallentuna → Toftesta Holme).</p>
      <p>Mer: <a href="https://www.vallentuna.se/fritid-och-kultur/friluftsliv-och-natur/badplatser-och-sjoar/" target="_blank" rel="noopener">vallentuna.se / badplatser</a>.</p>`
    },
    "Arkils Tingstad":{
      address:"Bällsta, söder om Vallentuna kyrka",
      facts:["Runriket","Tingsplats","U 225 & U 226","1010-talet"],
      localPhotos:true,
      photoCredit:"Foto: Wikimedia Commons.",
      images:[
        {url:"/assets/upplev/arkils-tingstad/cover.webp",alt:"Arkils tingstad vid Vallentunasjön"},
        {url:"/assets/upplev/arkils-tingstad/img1.webp",alt:"Stensättningen vid Arkils tingstad"}
      ],
      body:`<p>Vikingatida tingsplats vid Vallentunasjön — kvadratisk stensättning (ca 10×10 m) och två runstenar (U 225 och U 226), resta av Skålhamrasläkten till minne av Ulv. Stenarna har sammanhängande text; platsen anlades troligen på 1010-talet.</p>
      <p>Ett av nio stopp i <strong>Runriket</strong>. Fri entré, alltid öppet. Ljudguide finns på informationstavlan. Läs mer på <a href="https://www.vallentuna.se/runriket/runrikets-platser/arkils-tingstad/" target="_blank" rel="noopener">vallentuna.se / Runriket</a>.</p>
      <p>Vill du ha guidning på platsen? <button type="button" class="place-btn" onclick="openPlace('Sweden History Tours')">Sweden History Tours →</button></p>`
    },
    "Vallentuna Kulturhus":{
      address:"Allévägen 1, Vallentuna centrum",
      facts:["Bibliotek","Scen","Utställningar","Mötesplats"],
      localPhotos:true,
      photoCredit:"Foto: Wikimedia Commons.",
      images:[
        {url:"/assets/upplev/vallentuna-kulturhus/cover.webp",alt:"Vallentuna Kulturhus"}
      ],
      body:`<p>Kulturhus mitt i centrum med stort bibliotek, utställningar, scener, mötesrum och kreativ verkstad. Foajén öppnar ofta kl. 9 på vardagar; biblioteket bemannas från kl. 10.</p>
      <p>Ordinarie bibliotekstider: mån–tors 10–19, fre 10–18, lör 10–16, sön 12–16. Avvikelser förekommer (t.ex. sommaröppet och underhåll) — kolla <a href="https://bibliotek.vallentuna.se/" target="_blank" rel="noopener">bibliotek.vallentuna.se</a>.</p>
      <ul><li>Telefon: 08-587 853 50</li><li>bibliotek@vallentuna.se</li><li><a href="https://www.vallentuna.se/fritid-och-kultur/kultur/vallentuna-kulturhus/" target="_blank" rel="noopener">vallentuna.se / Kulturhuset</a></li></ul>`
    },
    "Lilla Valentina":{
      address:"Tuna Torg 3, Vallentuna centrum",
      facts:["Pizza","Kvarterskrog","Generösa portioner"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/lilla-valentina/cover.webp",alt:"Uteserveringen vid Tuna Torg"},
        {url:"/assets/upplev/lilla-valentina/personalen.webp",alt:"Personal utanför Lilla Valentina"}
      ],
      body:`<p>Folkkär kvarterspizzeria vid Tuna Torg — generösa portioner, vänlig personal och priser som inte skrämmer. En måltid att dela; fina råvaror och mycket kärlek i rätterna, enligt restaurangens egen meny.</p>
      <p>Telefon 08-511 737 04. Meny: <a href="https://lillavalentina.se/" target="_blank" rel="noopener">lillavalentina.se</a>.</p>`
    },
    "Lejonkulan Presenter & Inredning":{
      address:"Tuna Torg 4C, Vallentuna centrum",
      facts:["Presenter","Inredning","Fotoframkallning"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/lejonkulan-presenter-och-inredning/cover.webp",alt:"Lejonkulan Foto & Interiör"}
      ],
      body:`<p>Hos Lejonkulan Foto &amp; Interiör hittar du inredning, presenter, kläder, smycken — och personlig hjälp med fotoframkallning, ramar och album. Studentplakat och andra trycksaker går också att ordna.</p>
      <p>Öppet mån–fre 10–18, lör 10–15 enligt Vallentuna Centrum. Tel 08-511 807 30. Mer: <a href="https://vallentunacentrum.se/butik/lejonkulan-trend-interior/" target="_blank" rel="noopener">vallentunacentrum.se</a>.</p>`
    },
    "Ellen's Corner":{
      address:"Mörbyvägen 1a, 186 32 Vallentuna",
      facts:["Mode","Inredning","Personlig service"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/ellens-corner/cover.webp",alt:"Kläder på Ellen's Corner"},
        {url:"/assets/upplev/ellens-corner/accessoarer.webp",alt:"Accessoarer i butiken"},
        {url:"/assets/upplev/ellens-corner/inredning.webp",alt:"Inredning hos Ellen's Corner"}
      ],
      body:`<p>När du kommer till Ellen’s ska du känna dig sedd och unik — butiken utstrålar charm, glädje och inspiration. Personlig service och omsorg om att hitta det perfekta för just dig ligger i fokus.</p>
      <p>Kläder, accessoarer och inredning. Aktuella öppettider via Instagram/Facebook. Mail: <a href="mailto:info@ellenscorner.se">info@ellenscorner.se</a>. Webb: <a href="https://ellenscorner.se/" target="_blank" rel="noopener">ellenscorner.se</a>.</p>`
    },
    "Silver & Sånt":{
      address:"Torggatan 19A / centrumpassagen, Vallentuna",
      facts:["Smycken","Klockor","Rozaro Jewelry"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/silver-och-sant/cover.webp",alt:"Entrén till Silver & Sånt i Vallentuna centrum"},
        {url:"/assets/upplev/silver-och-sant/ringar.webp",alt:"Silverringar hos Silver & Sånt"}
      ],
      body:`<p>Noga utvalt sortiment av smycken och klockor i silver, guld och stål. Eget varumärke <strong>Rozaro Jewelry</strong> plus märken som Snö of Sweden. Det rätta smycket för varje tillfälle — du är i centrum.</p>
      <p>Öppet mån–fre 10–18, lör 10–15 enligt Vallentuna Centrum. Tel 08-511 737 97. Mer: <a href="https://vallentunacentrum.se/butik/silver-sant/" target="_blank" rel="noopener">vallentunacentrum.se</a>.</p>`
    },
    "Ljuvliga Bakverk":{
      address:"Söderbydal 8, 186 94 Vallentuna",
      facts:["Hembakat","Glutenfritt","Bakgårdscafé"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/ljuvliga-bakverk/cover.webp",alt:"Susanne i dörren till bakgårdscaféet i Söderbydal"},
        {url:"/assets/upplev/ljuvliga-bakverk/kanelbullar.webp",alt:"Laktosfria kanelbullar på fat"},
        {url:"/assets/upplev/ljuvliga-bakverk/jordgubbstarta.webp",alt:"Jordgubbstårta med vispad grädde"}
      ],
      body:`<p>Susannes bakgårdscafé i Söderbydal — litet, personligt och känt för hembakat inklusive ett starkt glutenfritt utbud. Allt bakas på plats av Susanne Olsen / Susannes Ljuvliga Bakverk AB.</p>
      <p>Öppettider kan vara begränsade (ofta helger i säsong). Hör av dig på 073-633 16 85 eller <a href="mailto:susanne@ljuvligabakverk.se">susanne@ljuvligabakverk.se</a> innan du åker, särskilt om du vill säkra glutenfritt bröd.</p>`
    },
    "Össby Handelsträdgård":{
      address:"Forsenberg / Brottby, nära Össeby-Garns kyrka",
      facts:["Självplock","Plantor","Honung & ägg","Swish"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/ossby-handelstradgard/cover.webp",alt:"Plantor och perenner ute på Össby Handelsträdgård"},
        {url:"/assets/upplev/ossby-handelstradgard/pensier.webp",alt:"Lila penséer i bricka"}
      ],
      body:`<p>Ösby (Össby) handelsträdgård i Brottby — avslappnad plantskola där Björn Furugren Beselin driver upp merparten av växterna på plats sedan 2007. Självplock av blommor och grönt, plus ägg, honung, saft och mer i bodarna. Betalning med Swish eller kontanter.</p>
      <p>Öppet året om i praktiken (vintertid mer ägg/sylt/honung än plantor). Potatisplock styrs ofta till tider när personal finns. Aktuellt i Facebook-gruppen. Tel 070-718 81 79.</p>`
    },
    "Antikladan":{
      address:"Angarns-Veda 7, 186 91 Vallentuna",
      facts:["Antik & retro","Ons 16–18","Lör–sön 11–16","Dödsbon"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/antikladan/cover.webp",alt:"Antikladan utifrån — röd lada med skylten Veda Antik & Diversehandel"},
        {url:"/assets/upplev/antikladan/interior.webp",alt:"Interiör i Antikladan — vintagekläder och tegelvägg"},
        {url:"/assets/upplev/antikladan/neon.webp",alt:"Neon- och bilrummet inne i Antikladan"},
        {url:"/assets/upplev/antikladan/bar.webp",alt:"Disk med vintagebelysning i Antikladan"},
        {url:"/assets/upplev/antikladan/motorcykel.webp",alt:"Motorcykel och modellflygplan i Antikladans sal"},
        {url:"/assets/upplev/antikladan/keramik.webp",alt:"Hylla med svensk keramik och syltburkar i Antikladan"}
      ],
      body:`<p>Stor antik- och kuriosalada två minuter från E18-avfarten mot Åkersberga — möbler, lampor, glas, porslin och samlarobjekt som byts från vecka till vecka (ofta via dödsbon). Grannen Handelshuset Cedergren kompletterar med vintagekläder och maritimt.</p>
      <p>Öppet onsdag 16–18 samt lördag–söndag 11–16 enligt antikladangillinge.se (kolla Facebook för avvikelser). Tel 070-756 80 18. Webb: <a href="https://www.antikladangillinge.se/" target="_blank" rel="noopener">antikladangillinge.se</a>.</p>`
    },
    "Lindra Second Hand":{
      address:"Svedjevägen 2, 186 32 Vallentuna",
      facts:["Second hand","Ideell","Human Bridge"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/lindra-second-hand/cover.webp",alt:"Lindra Second Hand"},
        {url:"/assets/upplev/lindra-second-hand/klader.webp",alt:"Second hand-kläder hos Lindra"},
        {url:"/assets/upplev/lindra-second-hand/porslin.webp",alt:"Porslin och husgeråd hos Lindra"}
      ],
      body:`<p>Lindras butik i Vallentuna — kläder, hemtextil, husgeråd, lampor, tavlor, leksaker och elektronik. När du handlar eller skänker bidrar du till Human Bridges arbete med sjukvårdsutrustning till länder där resurserna är små.</p>
      <p>Öppet mån–fre 11–18, lör 11–15. Tel 08-511 700 41. Mer: <a href="https://lindra.se/vara-butiker/" target="_blank" rel="noopener">lindra.se</a>.</p>`
    },
    "Risbyle Runstenar":{
      address:"Risbyle / Skålhamra, Vallentunasjöns västra sida",
      facts:["Runriket","U 160 & U 161","Skålhamrasläkten"],
      localPhotos:true,
      photoCredit:"Foto: Wikimedia Commons.",
      images:[
        {url:"/assets/upplev/risbyle-runstenar/cover.webp",alt:"Runsten U 161 vid Risbyle"},
        {url:"/assets/upplev/risbyle-runstenar/img2.webp",alt:"Detalj av runsten vid Risbyle"}
      ],
      body:`<p>Två runstenar (U 160 och U 161) vid Risbyle på Vallentunasjöns västra sida, knutna till Skålhamrasläkten — samma ätt som rest Arkils tingstad på andra sidan sjön. En sten är signerad av Ulv i Bårresta; kristna böneformler syns i inskrifterna.</p>
      <p>Fri entré, alltid öppet. Ljudguide finns på plats. Mer: <a href="https://www.vallentuna.se/runriket/runrikets-platser/risbyle/" target="_blank" rel="noopener">vallentuna.se / Risbyle</a>.</p>`
    },
    "Gullbron":{
      address:"Gullbron, vägen Vallentuna–Upplands Väsby",
      facts:["Runriket","Lindösläkten","Brobyggnad","1000-talet"],
      localPhotos:true,
      photoCredit:"Historisk avbildning: Wikimedia Commons (Bautil / U 237).",
      images:[
        {url:"/assets/upplev/gullbron/cover.webp",alt:"Historisk avbildning av runsten U 237 vid Gullbron"}
      ],
      body:`<p>Här möter du Lindösläkten — Ulf och Astrid och deras söner — som på 1000-talet byggde en bro och reste stenar. En 1600-talsbeskrivning nämner fyra resta stenar; tre runstenar finns kvar i området (bl.a. signerad av Visäte).</p>
      <p>Bron låg på södra sidan av vägen mellan Upplands Väsby och Vallentuna; få fysiska spår kvar, men skyltning och ljudguide hjälper dig läsa platsen. Mer: <a href="https://www.vallentuna.se/runriket/runrikets-platser/gullbron/" target="_blank" rel="noopener">vallentuna.se / Gullbron</a>.</p>`
    },
    "Vallentuna Naturreservat":{
      address:"Björkby-Kyrkviken, vid Vallentunasjön",
      facts:["Nära centrum","Fågelliv","Kulturlandskap","Alltid öppet"],
      localPhotos:true,
      photoCredit:"Foto: Länsstyrelsen Stockholm.",
      images:[
        {url:"/assets/upplev/vallentuna-naturreservat/cover.webp",alt:"Vassrik vik vid Vallentunasjön"}
      ],
      body:`<p><strong>Björkby-Kyrkvikens naturreservat</strong> ligger vid Vallentunasjön — öppet odlingslandskap, vassrik Kyrkvik och betesmarker med torrbacksflora. Ett välfrekventerat friluftsområde för boende i tätorten, med Vallentuna kyrka och Kvarnbadet i närheten.</p>
      <p>Rik fågelfauna: flyttfåglar på åkrarna om våren, sjöfågel i vassarna. Fornlämningar finns i området. Mer: <a href="https://www.lansstyrelsen.se/stockholm/besoksmal/naturreservat/bjorkby-kyrkviken.html" target="_blank" rel="noopener">Länsstyrelsen / Björkby-Kyrkviken</a>.</p>`
    },
    "Kristorante":{
      address:"Bällstabergsvägen 2, Vallentuna",
      facts:["Pizza","Uteservering","Kvarterskrog"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/kristorante/cover.webp",alt:"Kristorante utifrån med uteservering"},
        {url:"/assets/upplev/kristorante/pizza.webp",alt:"Pizza från Kristorante"}
      ],
      body:`<p>Trivsam kvarterskrog i Bällstaberg med uteservering, italiensk pizza, burgare och husmansidéer. Vällagat och omtyckt av många i bygden.</p>
      <p>Enligt kristorante.se: måndag 10–14 (lunch), tisdag–fredag 10–21, lördag–söndag 11–21. Tel 08-511 772 20. Webb: <a href="https://kristorante.se/" target="_blank" rel="noopener">kristorante.se</a>.</p>`
    },
    "Presto Grillen":{
      address:"Tuna Torg 6, Vallentuna centrum",
      facts:["Streetfood","Tunnbrödsrulle","Take away"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/presto-grillen/cover.webp",alt:"Presto Grillen"},
        {url:"/assets/upplev/presto-grillen/mat.webp",alt:"Mat från Presto Grillen"},
        {url:"/assets/upplev/presto-grillen/om.webp",alt:"Om Presto Grillen"}
      ],
      body:`<p>Grillen vid Tuna Torg — hamburgare, kebab, tunnbrödsrullar och vegetariskt i generösa portioner. Snabbt, vänligt och med tips över disk. En lokal klassiker mitt i centrum.</p>
      <p>Tel 08-37 76 06. Meny och mer: <a href="https://www.prestogrillen.se/" target="_blank" rel="noopener">prestogrillen.se</a>.</p>`
    },

    "Grävelsta Gård":{
      address:"Grävelsta, väster om Vallentuna",
      facts:["KRAV","Nöt & lamm","Ägg","Grillstuga"],
      localPhotos:true,
      photoCredit:"Stämningsfoto: Wikimedia Commons (Angus-kor — rasen som föds upp på gården).",
      images:[
        {url:"/assets/upplev/gravelsta-gard/cover.webp",alt:"Angus-kor i bete — stämningsbild för Grävelsta Gård"}
      ],
      body:`<p>Familjegård med KRAV-inriktning — nötkött, lamm, ägg, honung och mer från egna djur. Ägg finns i skåp bakom butiken alla dagar (Swish). Själva gårdsbutiken har sommaruppehåll och öppnar igen 29 augusti 2026 enligt gravelsta.se; hör av dig för avhämtning av övriga varor.</p>
      <p>Kontakt via <a href="https://gravelsta.se/" target="_blank" rel="noopener">gravelsta.se</a>.</p>`
    },
    "Röda Magasinet":{
      address:"Lindholmen, Vallentuna kommun",
      facts:["Antik & kuriosa","Tre våningar","Fika","Säsongsöppet"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/roda-magasinet/cover.webp",alt:"Röda Magasinet i Lindholmen"}
      ],
      body:`<p>Antikaffär i Lindholmen, strax bakom Lindholmens gård — glas, porslin, möbler, lampor och fynd i lantlig miljö. Öppet maj–september (perfekt söndagsutflykt); kan även öppna utanför säsong.</p>
      <p>Mer: <a href="https://rodamagasinet.se/" target="_blank" rel="noopener">rodamagasinet.se</a>.</p>`
    },
    "Novaretro":{
      address:"Stora Karby Gård, 186 70 Brottby",
      facts:["Antik & retro","Designmöbler","Helgöppet","Värdering"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/novaretro/cover.webp",alt:"Retrofynd och vinyl i butiken"},
        {url:"/assets/upplev/novaretro/skrivmaskin.webp",alt:"Underwood-skrivmaskin bland antikviteter"},
        {url:"/assets/upplev/novaretro/konst.webp",alt:"Vas, skulptur och keramik — design och konst"}
      ],
      body:`<p>Antik-, design- och retrobutik på <strong>Stora Karby Gård</strong> i Brottby — möbler, porslin, samlarobjekt och fynd med tyngdpunkt på 1930–70-tal. Ambitionen är humana priser; sortimentet fylls på varje vecka.</p>
      <p>Öppet lördag–söndag kl. 10–15 under säsong (vinterstängt). Från E18: avfart Brottby, Gamla Norrtäljevägen — sväng in mellan de vita pelarna efter ICA Brottby. Tel 08-51 51 05 06 · <a href="https://www.novaretro.se/" target="_blank" rel="noopener">novaretro.se</a>.</p>`
    },
    "Röda Korset Second Hand":{
      address:"Tellusvägen 7, 186 36 Vallentuna",
      facts:["Volontärer","Kläder & husgeråd","Välgörenhet","Tors & lör"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/roda-korset-second-hand/cover.webp",alt:"Hyllor med burkar och husgeråd i second hand-butiken"}
      ],
      body:`<p>Röda Korsets second hand-butik (Kupan) på Tellusvägen — kläder, husgeråd, leksaker, böcker, glas och prylar. Driven av volontärer; överskottet går till Röda Korsets hjälpverksamhet.</p>
      <p>Öppet <strong>torsdag 11–18</strong> och <strong>lördag 12–15</strong>. Skänk gärna under öppettiderna (hela och rena saker). Mer: <a href="https://www.rodakorset.se/ort/stockholm/vallentuna-kommun/second-hand/roda-korset-second-hand-vallentuna/" target="_blank" rel="noopener">rodakorset.se</a>.</p>`
    },
    "Vallentuna kyrka":{
      address:"Kyrkvägen / Vallentuna centrum",
      facts:["Runriket","Medeltid","Runinskrifter","Ljudguide"],
      localPhotos:true,
      photoCredit:"Foto: Wikimedia Commons.",
      images:[
        {url:"/assets/upplev/vallentuna-kyrka/cover.webp",alt:"Vallentuna kyrka"}
      ],
      body:`<p>Medeltidskyrka mitt i byn (ca 1150–1250) — ett av Runrikets stopp med flera runinskrifter. I tornet och bogårdsmuren har murmästare ristat sina namn; inne i tornrummet sitter en runsten inmurad. Ljudguide finns på plats.</p>
      <p>Fri entré till området runt kyrkan. Mer: <a href="https://www.vallentuna.se/runriket/runrikets-platser/vallentuna-kyrka/" target="_blank" rel="noopener">vallentuna.se / Vallentuna kyrka</a>.</p>
      <p>Vill du ha guidning här? <button type="button" class="place-btn" onclick="openPlace('Sweden History Tours')">Sweden History Tours →</button></p>`
    },
    "Gällsta":{
      address:"Gällsta, väster om Vallentuna",
      facts:["Runriket","Runstenar","Kulturlandskap"],
      localPhotos:true,
      photoCredit:"Foto: Wikimedia Commons.",
      images:[
        {url:"/assets/upplev/gallsta/cover.webp",alt:"Runsten vid Gällsta"}
      ],
      body:`<p>Vid Gällsta står tre runstenar som omnämner fyra generationer av samma släkt — ristade av Öpir kring 1000-talets slut — plus en fjärde sten med kors men utan inskrift. Ljudguide finns på informationstavlan.</p>
      <p>Fri entré, alltid öppet. Mer: <a href="https://www.vallentuna.se/runriket/runrikets-platser/gallsta/" target="_blank" rel="noopener">vallentuna.se / Gällsta</a>.</p>`
    },
    "Gustavs udde":{
      address:"Wirséns väg 19, Bällsta",
      facts:["Kommunalt bad","Sandstrand","Brygga","Rullstolsramp"],
      localPhotos:true,
      photoCredit:"Foto: Naturkartan.",
      images:[
        {url:"/assets/upplev/gustavs-udde/cover.webp",alt:"Badplatsen Gustavs udde"}
      ],
      body:`<p>En av kommunens skötta badplatser — ca 500 m från Bällsta station, med sandstrand, brygga, rullstolsramp och picknickbord. Lugnare alternativ till Kvarnbadets bassänger när du vill ha sjöbad.</p>
      <p>Vattenkvalitet publiceras via Havs- och vattenmyndigheten. Mer: <a href="https://www.vallentuna.se/fritid-och-kultur/friluftsliv-och-natur/badplatser-och-sjoar/" target="_blank" rel="noopener">vallentuna.se / badplatser</a>.</p>`
    },
    "Bergsjöns badplats":{
      address:"Kårsta (parkering vid Kårstaskolan)",
      facts:["Kommunalt bad","Brygga","Grillplats","Omklädning","Kårsta"],
      localPhotos:true,
      photoCredit:"Foto: Naturkartan / Vallentuna kommun.",
      images:[
        {url:"/assets/upplev/bergsjons-badplats/cover.webp",alt:"Bergsjöns badplats i Kårsta"}
      ],
      body:`<p>Kommunalt skogsbad i <strong>Kårsta</strong> — en mindre, ganska grund sjö med liten strand, brygga och omklädningsrum. På varma sommardagar blir vattnet snabbt skönt; det finns också grillplats (ta med egen ved).</p>
      <p>Parkera vid Kårstaskolan och följ stigen till badet. Hund är välkommen kopplad. Vattenkvalitet: sök Bergsjön på Havs- och vattenmyndighetens badplatsinfo. Mer: <a href="https://www.vallentuna.se/fritid-och-kultur/friluftsliv-och-natur/badplatser-och-sjoar/" target="_blank" rel="noopener">vallentuna.se / badplatser</a>.</p>`
    },
    "AutoMat Kårsta":{
      address:"Röbytorpsvägen 1A / Kårsta torg, 186 60 Kårsta",
      facts:["Obemannad","Bank-ID","Öppet 05–23","Kårsta torg"],
      localPhotos:true,
      photoCredit:"Foto: Never Closed / AutoMat.",
      images:[
        {url:"/assets/upplev/automat-karsta/cover.webp",alt:"AutoMat Kårsta — obemannad matbutik"}
      ],
      body:`<p>Liten, välsorterad lanthandel mitt på <strong>Kårsta torg</strong> — obemannad butik i Never Closed-konceptet. Skanna QR-koden vid dörren, identifiera dig med Bank-ID, gå in och handla i egen takt. Öppet <strong>05–23</strong> alla dagar.</p>
      <p>Basvaror, närproducerat när det finns, kort/Swish i självskanning. Tipset kom från en lokalbo som lyfter den mysiga, välkomnande atmosfären. Webb: <a href="https://www.neverclosed.se/butiker/automat-karsta/" target="_blank" rel="noopener">neverclosed.se / AutoMat Kårsta</a>.</p>`
    },
    "Vallboden":{
      address:"Centralvägen 6, Vallentuna centrum",
      facts:["Keramik","Hantverk","Lokalt"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/vallboden/cover.webp",alt:"Vallboden — keramik och hantverk"}
      ],
      body:`<p>Liten butik med keramik och hantverk i centrum — personligt urval och lokala händer bakom hyllorna. Titta in när du ändå är på Centralvägen.</p>
      <p>Öppettider kan variera — kolla skylt eller fråga i området innan du åker långt.</p>`
    },
    "Gästis Kök & Bar":{
      address:"Tuna Torg 5, Vallentuna centrum",
      facts:["Kök & bar","Tuna Torg","Lokal kvarterskänsla"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/gastis-kok-och-bar/cover.webp",alt:"Gästis Kök & Bar"}
      ],
      body:`<p>Kök och bar vid Tuna Torg — mat och dryck mitt i centrum, med lokal kvarterskänsla. Lunch mån–fre 09–14, helg 12–15; köket stänger 21:00. Fre–lör nattklubb till 01:00.</p>
      <p>Öppet mån–tors 09–22, fre 09–01, lör 12–01, sön 12–22 enligt gastiskokochbar.se. Tel 08-511 793 40. Webb: <a href="https://gastiskokochbar.se/" target="_blank" rel="noopener">gastiskokochbar.se</a>.</p>`
    },
    "Langhard Lantbruk":{
      address:"Lena 50, 186 93 Vallentuna",
      facts:["Vaktel & höns","Lamm","Odling","Helgöppet"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/langhard-lantbruk/cover.webp",alt:"Livet på Langhard Lantbruk"},
        {url:"/assets/upplev/langhard-lantbruk/vaktlar.webp",alt:"Japanska jumbovaktlar på gården"},
        {url:"/assets/upplev/langhard-lantbruk/hons.webp",alt:"Hedemorahöns på Langhard"},
        {url:"/assets/upplev/langhard-lantbruk/far.webp",alt:"Får i hagen vid Langhard"},
        {url:"/assets/upplev/langhard-lantbruk/odling.webp",alt:"Odling och skörd på Langhard Lantbruk"}
      ],
      body:`<p>Småskaligt lantbruk i Markim — japanska jumbovaktlar, Hedemorahöns, Dorper- och Gotlandsfår samt grönsaksodling med fokus på levande landsbygd. Gårdsbutiken säljer lamm, ägg, grönsaker och mer när den håller öppet.</p>
      <p>Gårdsbutik <strong>lördag–söndag 14–16</strong>; övriga tider enligt överenskommelse. Helena 070-771 03 67 · Joakim 070-441 54 85 · <a href="mailto:info@langhard.se">info@langhard.se</a>. Webb: <a href="https://www.langhardlantbruk.se/" target="_blank" rel="noopener">langhardlantbruk.se</a>.</p>`
    },
    "Folkantik och Vintage":{
      address:"Trädgårdsvägen 1, 186 94 Vallentuna",
      facts:["Antik & vintage","Allmoge","Folkkonst","Lindholmen"],
      localPhotos:true,
      photoCredit:"Foto: Jonas Månsson / Mitt i.",
      images:[
        {url:"/assets/upplev/folkantik-och-vintage/cover.webp",alt:"Andreas och Elin i Folkantik i Lindholmen"},
        {url:"/assets/upplev/folkantik-och-vintage/interior.webp",alt:"Interiör i Folkantik — antikviteter i handelsboden"},
        {url:"/assets/upplev/folkantik-och-vintage/detalj.webp",alt:"Detaljer och föremål hos Folkantik"},
        {url:"/assets/upplev/folkantik-och-vintage/butik.webp",alt:"Butiksmiljö hos Folkantik och Vintage"}
      ],
      body:`<p>Antikhandeln <strong>Folkantik</strong> intill Lindholmens station — Elin Strid och Andreas Scoufias fyller en klassisk handelsbod med allmoge, asiatiskt och äldre hantverk. Visionen är folklig antik och folkkonst; det billigaste ligger runt 20 kronor, så det finns något för de flesta.</p>
      <p>Öppet främst på <strong>söndagar</strong> (paret driver butiken parallellt med andra jobb). Aktuella tider: <a href="https://www.instagram.com/folkantikochvintage/" target="_blank" rel="noopener">Instagram @folkantikochvintage</a>.</p>`
    },
    "Jano":{
      address:"Vallentuna Teater, Gymnasievägen 4B",
      facts:["Jazz","Teater","Café","Biljett"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/jano/cover.webp",alt:"Jano-konsert — Carin Lundin och Ronnie Gardiner"},
        {url:"/assets/upplev/jano/konsert.webp",alt:"Artistporträtt från Jano"},
        {url:"/assets/upplev/jano/servering.webp",alt:"Stina Wallster — servering via Triften på Janos jazzkvällar"}
      ],
      body:`<p><strong>Jazzklubb Nordost (Jano)</strong> arrangerar jazzkonserter på Vallentuna Teater i centrum — ca 100 m från stationen, 320 sittplatser, hörslinga och rullstolsanpassat. Caféet öppnar kl. 17:30; musiken startar kl. 18:30 (om inte annat anges). Servering sköts av Triften.</p>
      <p>Biljetter via <a href="https://jano.nu/biljetter-29542633" target="_blank" rel="noopener">Nortic</a> eller över disk på Vallentuna bibliotek. Medlemskap 200 kr / VIP 800 kr (halvår) via Plusgiro 19 25 83-3 eller Swish 123 494 71 72. Program och mer: <a href="https://jano.nu/" target="_blank" rel="noopener">jano.nu</a>.</p>`
    },
    "Vasakullen":{
      address:"Lindholmens gård / Orkesta, Lindholmen",
      facts:["Gustav Vasa","Borgruin","Minnessten 1866","Orkesta"],
      localPhotos:true,
      photoCredit:"Foto: Wikimedia Commons (Holger Ellgaard).",
      images:[
        {url:"/assets/upplev/vasakullen/cover.webp",alt:"Vasakullen vid Lindholmens gård"},
        {url:"/assets/upplev/vasakullen/img1.webp",alt:"Minnessten och landskap vid Vasakullen"},
        {url:"/assets/upplev/vasakullen/img2.webp",alt:"Borgruinen på Vasakullen"}
      ],
      body:`<p><strong>Vasakullen</strong> ligger vid Lindholmens gård i Orkesta socken. Enligt en tradition föddes Gustav Vasa här den 12 maj 1496 (en annan tradition pekar på Rydboholm). Hans mormor Sigrid Eskilsdotter (Banér) bodde på Lindholmen från 1496 till sin död 1527. År 1866 restes en minnessten på kullen.</p>
      <p>På höjden mellan Lillsjön och Storsjön syns lämningarna efter ett medeltida stenhus (borgruin) och två ekar som naturminnesförklarades 1918. Samhället <em>Lindholmen</em> växte fram väster om gården när Roslagsbanan fick station här 1887 — namnet hör historiskt till Orkesta, även om många idag säger Lindholmen.</p>
      <p><strong>Herrgården är privat.</strong> Besök kulle, ruin och minnessten utifrån informationstavlan på plats. Mer: <a href="https://sv.wikipedia.org/wiki/Lindholmens_g%C3%A5rd" target="_blank" rel="noopener">Wikipedia — Lindholmens gård</a> · <a href="https://www.vallentuna.se/fritid-och-kultur/kultur/kulturmiljo/hitta-din-plats-historia/orkesta/gardar-och-byar/lindholmen/" target="_blank" rel="noopener">vallentuna.se</a>.</p>`
    },
    "Vallentuna Konditori":{
      address:"Centralvägen 1, 186 31 Vallentuna",
      facts:["Konditori","Bröd & tårta","Centrum","Frukostfik"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/vallentuna-konditori/cover.webp",alt:"Disken på Vallentuna Konditori med smörgåsar och bakverk"}
      ],
      body:`<p><strong>Vallentuna Konditori</strong> på Centralvägen 1 — traditionellt konditori med bröd, fikabröd, tårtor och smörgåstårta. Ett litet kvartersställe mitt i centrum, öppet tidigt på vardagar.</p>
      <p>Öppet mån–fre 07–18, lör 08–16, sön 11–15 (kan variera — ring gärna). Tel 08-511 740 04.</p>`
    },
    "Äppellundens Café":{
      address:"Kårstavägen 311, 186 60 Vallentuna",
      facts:["4H","Café","Minigolf","Barnvänligt"],
      localPhotos:true,
      images:[
        {url:"/assets/upplev/appellundens-cafe/cover.webp",alt:"Äppellundens Café hos Kårsta 4H"}
      ],
      body:`<p><strong>Äppellundens Café</strong> hör till Kårsta 4H på Kårstavägen 311 — fika och enklare mat i gårdsmiljö, plus minigolf och aktiviteter för barn och familjer.</p>
      <p>Caféet siktar på öppet ca <strong>12–16</strong> (tider ändras ofta). Följ <a href="https://www.facebook.com/karsta4h" target="_blank" rel="noopener">Facebook Kårsta 4H</a> eller ring 073-852 27 98 innan ni åker. Info: <a href="https://www.4h.se/karsta/" target="_blank" rel="noopener">4h.se/karsta</a>.</p>`
    },
    "Roslagsloppis":{
      address:"Roslagsstoppet, Söderhalls trafikplats, Vallentuna",
      facts:["Bakluckeloppis","Söndagar","Fri entré","Säsong"],
      localPhotos:true,
      photoCredit:"Foto: roslagsloppis.se / Loppistajm.",
      images:[
        {url:"/assets/upplev/roslagsloppis/cover.webp",alt:"Bakluckeloppis vid Roslagsstoppet"},
        {url:"/assets/upplev/roslagsloppis/fynd.webp",alt:"Fynd och prylar på Roslagsloppis"},
        {url:"/assets/upplev/roslagsloppis/bakluckor.webp",alt:"Bilar och bakluckor på loppisen"},
        {url:"/assets/upplev/roslagsloppis/folkfest.webp",alt:"Folkfeststämning på Roslagsloppis"}
      ],
      body:`<p><strong>Roslagsloppis</strong> är den stora bakluckeloppisen bakom Roslagsstoppet vid Söderhalls trafikplats — halvvägs ut i Roslagen, i Vallentuna kommun. Sälj direkt från bilen eller kom och fynda; fri entré och parkering för besökare.</p>
      <p>Öppet <strong>söndagar 11–15</strong> under säsongen <strong>31 maj–13 september 2026</strong> (stängt 21 juni). Åk runt den långa röda byggnaden till baksidan. Vill du sälja? Plats online från 175 kr via <a href="https://www.roslagsloppis.se/salja/" target="_blank" rel="noopener">roslagsloppis.se</a>, eller Swish på plats om det finns rum. Frågor: <a href="mailto:info@stockholmsmarknader.se">info@stockholmsmarknader.se</a>. Psst: fabriksförsäljning av cocosbollar finns intill.</p>`
    },
    "Lilla Cirkeln Secondhand":{
      address:"Tuna Torg 2, 186 39 Vallentuna",
      facts:["Second hand","Kommission","Barn & dam","Centrum"],
      localPhotos:false,
      photoCredit:"Stämningsbild (Unsplash) — byt gärna mot eget butiksfoto.",
      images:[
        {url:"/assets/upplev/lilla-cirkeln-secondhand/cover.webp",alt:"Second hand-fynd i butiksmiljö"}
      ],
      body:`<p><strong>Lilla Cirkeln Secondhand</strong> ligger mitt på Tuna Torg — en liten kommissionsbaserad butik med fokus på kläder, barnprylar och märkesfynd. Klimatsmart shopping utan att lämna centrum.</p>
      <p>Öppet mån–fre 10–18, lör 10–15 (avvikelser på storhelger). Inlämning enligt <a href="https://www.lillacirkeln.se/" target="_blank" rel="noopener">lillacirkeln.se</a> · även listad på <a href="https://vallentunacentrum.se/butik/lillacirkeln-secondhand/" target="_blank" rel="noopener">vallentunacentrum.se</a>.</p>`
    },
    "Vallentuna skolmuseum":{
      address:"Lilla Garn 32, Brottby (vid Össeby-Garns kyrka)",
      facts:["Museum","1910-tal","Fri entré","Kultur Vallentuna"],
      localPhotos:true,
      photoCredit:"Foto: Vallentuna kommun.",
      images:[
        {url:"/assets/upplev/vallentuna-skolmuseum/cover.webp",alt:"Vallentuna skolmuseum vid Össeby-Garn"}
      ],
      body:`<p><strong>Vallentuna skolmuseum</strong> ligger i det gamla skolhuset (1887–1965) invid Össeby-Garns kyrka i Brottby. På övre våningen finns en rekonstruktion av skolsal och lärarbostad som runt 1910, plus planscher och skolmaterial från nerlagda skolor i kommunen.</p>
      <p>Söndagsöppet under sommaren (t.ex. kl. 13–16 — kolla aktuella datum). Övrig tid: boka via <a href="mailto:kultur@vallentuna.se">kultur@vallentuna.se</a> eller tel 08-587 853 54. Fri entré. Nära Toftesta Holme. Mer: <a href="https://www.vallentuna.se/fritid-och-kultur/kultur/kulturmiljo/vallentuna-skolmuseum/" target="_blank" rel="noopener">vallentuna.se / skolmuseum</a>.</p>`
    },
    "Sweden History Tours":{
      address:"Möts på platsen enligt bokning",
      facts:["Bokas","Svenska & engelska","Historia & folktro","Cykelturer"],
      localPhotos:true,
      photoCredit:"Foto från verksamheten.",
      images:[
        {url:"/assets/upplev/sweden-history-tours/medeltidskyrka.webp",alt:"Medeltidskyrka i landskapet under guidning"},
        {url:"/assets/upplev/sweden-history-tours/guide-runsten.webp",alt:"Guide vid runsten ute i markerna"},
        {url:"/assets/upplev/sweden-history-tours/runsten-besok.webp",alt:"Besökare vid runsten under guidning"}
      ],
      body:`<p>Guideföretag med bas i Vallentuna. De erbjuder turer mot förfrågan — eller när någon bokar — på svenska eller engelska. Fokus på historiska guidningar och folktro.</p>
      <p>Bland stoppen: Arkils tingstad, Vallentuna kyrka, ute i Markim och Orkesta, samt guidade cykelturer. Specialturer vid jul och halloween erbjuds vid Vallentuna kvarn och runt kyrkan.</p>
      <p>Sedan 2015 har guiderna tagit ut mer än 29 000 gäster till historiska platser i landskapet — vid runstenar, medeltidskyrkor och andra fornlämningar, inte inne på museum. Privata turer eller små grupper om högst 16 personer.</p>
      <p>Boka via <a href="https://www.swedenhistorytours.se/" target="_blank" rel="noopener">swedenhistorytours.se</a>.</p>`
    },
  };

    const cats=[{key:"alla",label:"Allt"},{key:"fika",label:"Fika & Mat"},{key:"gard",label:"Gård & Handelsträdgård"},{key:"natur",label:"Natur & Historia"},{key:"butik",label:"Butik & Kultur"},{key:"loppis",label:"Loppis"},{key:"smultronstalle",label:"Smultronställen"},{key:"guidning",label:"Guidning"}];

  const DOW=["SÖN","MÅN","TIS","ONS","TOR","FRE","LÖR"];
  const MON=["JAN","FEB","MAR","APR","MAJ","JUN","JUL","AUG","SEP","OKT","NOV","DEC"];
  const typeLabel={fika:"FIKA",gard:"HANDLA LOKALT",butik:"BUTIK",loppis:"LOPPIS",natur:"NATUR",smultronstalle:"SMULTRONSTÄLLE",guidning:"GUIDNING"};

  // Editorial category landings (nav + view-kategori)
  const CATEGORIES={
    attgora:{
      key:"attgora", nav:"Att göra", title:"Att göra i Vallentuna",
      lede:"Handplockade upplevelser i bygden — fika, gårdar, loppis, natur och små upptäckter värda en omväg.",
      types:null, mapKey:"alla"
    },
    fika:{
      key:"fika", nav:"Äta & fika", title:"Äta & fika",
      lede:"Bagerier, caféer och kök där doften av nybakat och gott kaffe får dig att stanna en stund till.",
      types:["fika"], mapKey:"fika"
    },
    gard:{
      key:"gard", nav:"Handla lokalt", title:"Handla lokalt",
      lede:"Gårdsbutiker, handelsträdgårdar och presentshoppar — stötta dem som får bygden att blomstra.",
      types:["gard","butik"], mapKey:"gard"
    },
    loppis:{
      key:"loppis", nav:"Loppis", title:"Loppis & second hand",
      lede:"Antiklador, retro, second hand och fynd — från Tellusvägen till Brottby och Angarns-Veda.",
      types:["loppis"], mapKey:"loppis"
    },
    natur:{
      key:"natur", nav:"Natur & uteliv", title:"Natur & uteliv",
      lede:"Spänger, bad, runstenar och öppna landskap — utflykter nära dig när du vill andas ut.",
      types:["natur"], mapKey:"natur"
    },
    smultronstalle:{
      key:"smultronstalle", nav:"Smultronställen", title:"Smultronställen",
      lede:"Guldkorn tippade av lokalbor — utsikter, bänkar och små hemligheter du inte nödvändigtvis kände till.",
      types:["smultronstalle"], mapKey:"smultronstalle"
    },
    guidning:{
      key:"guidning", nav:"Guidning", title:"Guidning & historia",
      lede:"Bokade guidningar i bygden — historia, folktro och platser som berättas på plats. Ingen drop-in; möts enligt bokning.",
      types:["guidning"], mapKey:null
    },
    producent:{
      key:"producent", nav:"Producenter", title:"Lokala producenter",
      lede:"Hantverk och gårdsprodukter utan egen butik — hitta dem där de säljs i bygden. Ingen egen adress på kartan.",
      types:null, mapKey:null, isProducer:true
    }
  };
  let currentCategory="attgora";

  // Newer listings get a "Nytt"-badge for ~45 days from this date
  const NEW_SINCE={
    "Ljuvliga Bakverk":"2026-07-10",
    "Ellen's Corner":"2026-07-18",
    "Antikladan":"2026-06-28",
    "Grävelsta Gård":"2026-08-02",
    "Röda Magasinet":"2026-08-02",
    "Novaretro":"2026-08-04",
    "Röda Korset Second Hand":"2026-08-04",
    "Vallentuna kyrka":"2026-08-02",
    "Gällsta":"2026-08-02",
    "Gustavs udde":"2026-08-02",
    "Vallboden":"2026-08-02",
    "Gästis Kök & Bar":"2026-08-02",
    "Langhard Lantbruk":"2026-08-05",
    "Folkantik och Vintage":"2026-08-05",
    "Jano":"2026-08-06",
    "Bergsjöns badplats":"2026-08-07",
    "AutoMat Kårsta":"2026-08-07",
    "Vasakullen":"2026-08-14",
    "Vallentuna Konditori":"2026-08-14",
    "Äppellundens Café":"2026-08-14",
    "Roslagsloppis":"2026-08-15",
    "Lilla Cirkeln Secondhand":"2026-08-20",
    "Vallentuna skolmuseum":"2026-08-20",
    "Sweden History Tours":"2026-08-25",
    "Hökeriet":"2026-08-31"
  };

  const now=new Date();
  const {hour, minute}=stockholmHourMinute(now);
  const month=stockholmMonth(now);
  const day=stockholmWeekday(now); // 0=Sun, Europe/Stockholm
  const todayISO=stockholmTodayISO(now);
  const isWeekend=day===0||day===6;
  const daypart=hour<10?"morgon":hour<14?"lunch":hour<18?"eftermiddag":"kvall";
  const recurringTodayList=recurringToday(day, recurring);

  const holidayToday=swedishHoliday(now);
  const TAG_LABEL={barn:"Barnvänligt",hund:"Hund",rullstol:"Rullstol",ute:"Uteservering",gratis:"Gratis",inomhus:"Inomhus"};
  const SEARCH_FILTERS=[
    {key:"open",label:"Öppet nu"},
    {key:"barn",label:"Barnvänligt"},
    {key:"hund",label:"Hund"},
    {key:"rullstol",label:"Rullstol"},
    {key:"ute",label:"Uteservering"},
    {key:"gratis",label:"Gratis"}
  ];

  function metaOf(p){return PLACE_META[p.name]||{};}
  function daySlot(p,d=day){
    return libDaySlot(p, metaOf(p), d, now);
  }
  function isHolidayClosed(p,d){
    // Guard: Array#filter passes (el, index) — never treat a number as a Date.
    if(!(d instanceof Date)) d=now;
    const hol=swedishHoliday(d);
    if(!hol) return false;
    const m=metaOf(p);
    if(m.holidayClosed===false) return false;
    // always-open outdoor sites stay open
    if(daySlot(p,d.getDay())===A) return false;
    return !!hol && m.holidayClosed!==false && !!m.hours;
  }
  function isOpen(p,at){
    if(!(at instanceof Date)) at=now;
    return isOpenAt(p, metaOf(p), at);
  }
  /** Platser med riktiga öppettider (inte alltid-öppna runstenar/natur). */
  function isTimedVenue(p){
    const m=metaOf(p);
    if(!m.hours?.length) return false;
    return m.hours.some(h=>h && h!==A);
  }
  function isOpenVenue(p,at){
    return isTimedVenue(p) && isOpen(p,at);
  }
  function openVenueCount(){
    return places.filter(p=>isOpenVenue(p)).length;
  }
  /** Kort status för listor — skiljer på verksamhet vs alltid-öppen plats. */
  function openLabelShort(p){
    if(!isTimedVenue(p)) return isOpen(p)?"Alltid tillgänglig":"Stängt";
    return isOpen(p)?"Öppet nu":"Stängt";
  }
  function minutesUntilClose(p){
    if(isHolidayClosed(p)) return -1;
    if(!isOpen(p)) return -1;
    const mins=hour*60+minute;
    const slot=daySlot(p);
    if(slot===A) return Infinity;
    if(slot && mins>=slot.o*60 && mins<slot.c*60) return (slot.c*60)-mins;
    const prev=daySlot(p,(day+6)%7);
    if(prev && prev!==A && prev.c>24 && mins<(prev.c-24)*60) return (prev.c-24)*60-mins;
    return -1;
  }
  function isClosingSoon(p){const m=minutesUntilClose(p);return m>0&&m<=75;}
  function fmtHoursSlot(slot){
    if(slot===A) return "Öppet dygnet runt";
    if(!slot) return "Stängt";
    const closeH=slot.c>24?slot.c-24:slot.c;
    const suffix=slot.c>24?" (natt)":"";
    return `${String(slot.o).padStart(2,"0")}:00 – ${String(closeH).padStart(2,"0")}:00${suffix}`;
  }
  function hoursTableHTML(p){
    const m=metaOf(p);
    // Visa mån→sön (data lagras fortfarande sön=0 … lör=6).
    const rows=WEEKDAY_ORDER_MON_FIRST.map((i)=>{
      const name=formatWeekday(i,{capitalize:true});
      const slot=daySlot(p,i);
      const cls=[i===day?"today":"",!slot&&slot!==A?"closed":""].filter(Boolean).join(" ");
      return `<tr class="${cls}"><td>${name}</td><td>${fmtHoursSlot(slot)}</td></tr>`;
    }).join("");
    let note=`<p class="hours-disclaimer">Öppettider kan ändras — dubbelkolla med stället innan du åker.</p>`;
    if(holidayToday) note+=`<div class="sun-note" style="margin-top:8px">Idag är det <strong>${holidayToday}</strong>${isHolidayClosed(p)?" — vi antar stängt (röda dagar).":" — kolla gärna med stället."}</div>`;
    if(m.seasonNote) note+=`<div class="sun-note" style="margin-top:6px">${m.seasonNote}</div>`;
    return `<table class="hours-table"><tbody>${rows}</tbody></table>${note}`;
  }
  function sourcesHTML(p){
    const m=metaOf(p);
    const src=(m.sources||[]).map(s=>s.url?`<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`:s.label).join(" · ");
    const upd=m.updated?`Senast uppdaterad <strong>${m.updated}</strong>. `:"";
    return `<div class="source-box">${upd}${src?`Källor: ${src}. `:""}Öppettider kan ändras. Ser du fel? <a href="#" onclick="openReport();return false">Rapportera</a>.</div>`;
  }
  function isNewPlace(p){
    // "Nytt"-badges pausade — launch-batchen ligger kvar för länge för att kännas relevant.
    return false;
  }
  function haversineKm(a,b,c,d){
    const R=6371,toR=x=>x*Math.PI/180;
    const dLat=toR(c-a),dLon=toR(d-b);
    const x=Math.sin(dLat/2)**2+Math.cos(toR(a))*Math.cos(toR(c))*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(x));
  }
  function fmtDist(km){
    if(km==null) return "";
    if(km<1) return Math.round(km*1000)+" m";
    return km.toFixed(1).replace(".",",")+" km";
  }

  const liveEvents=events.filter(e=>e.date>=todayISO).sort((a,b)=>a.date.localeCompare(b.date));
  const eventsToday=liveEvents.filter(e=>e.date===todayISO);
  const eventsByHost={};liveEvents.forEach(e=>{(eventsByHost[e.host]=eventsByHost[e.host]||[]).push(e);});
  function trackEvent(n,l){if(window.umami){try{umami.track(n,{label:l});}catch(e){}}}

  // UX-TEST-V1 mobile nav
  function toggleMobileNav(open){
    const bg=document.getElementById("mnavBg");
    const nav=document.getElementById("mobileNav");
    const btn=document.getElementById("menuToggle");
    if(!bg||!nav) return;
    const on=!!open;
    bg.hidden=!on; nav.hidden=!on;
    bg.classList.toggle("on",on); nav.classList.toggle("on",on);
    document.body.classList.toggle("mnav-open",on);
    if(btn){ btn.setAttribute("aria-expanded", on?"true":"false"); btn.setAttribute("aria-label", on?"Stäng meny":"Öppna meny"); }
    if(on){ const c=nav.querySelector(".mnav-close"); if(c) c.focus(); }
  }
  function mobileGo(fn){ toggleMobileNav(false); try{ fn(); }catch(e){} }
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") toggleMobileNav(false); });

  // ---- localStorage: favorites, last visit, soft interest ----
  const LS_FAV="vii_favs_v1", LS_LAST="vii_last_place_v1", LS_INTEREST="vii_interest_v1", LS_GEO_ASKED="vii_geo_asked_v1";
  const LS_LISTS="uv_lists_v1", LS_PENDING="uv_pending_events_v1", LS_REPORTS="uv_reports_v1", LS_NOTIFY="uv_notify_seen_v1";
  function loadJSON(k,fb){try{return JSON.parse(localStorage.getItem(k))??fb;}catch(e){return fb;}}
  function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  let favorites=new Set(loadJSON(LS_FAV,[]));
  let interest=loadJSON(LS_INTEREST,{}); // place -> {saves, views}
  let userPos=null; // {lat,lng}
  let openNowOnly=false, favOnly=false;
  let ctx={mood:"mild",temp:null,sunset:null,sunrise:null,code:null};
  let searchFilters=new Set();
  let activeListId=null;
  let routeSeed=0;
  /** Place names already shown higher on the homepage — keep later blocks varied */
  let homeShownNames=new Set();
  let map,markers=[];
  let active="alla";
  let miniMap=null, lastViewBeforePlats='start';
  let lists=loadJSON(LS_LISTS,null);
  if(!lists||!Array.isArray(lists)||!lists.length){
    lists=[
      {id:"kids",name:"Helg med kids",places:["Kvarnbadet","Gustavs udde","Vallentuna Kulturhus","Angarnssjöängen"]},
      {id:"hund",name:"Utflykt med hund",places:["Angarnssjöängen","Toftesta Holme","Gustavs udde","Vallentuna Naturreservat"]}
    ];
    saveJSON(LS_LISTS,lists);
  }
  function originLatLng(){
    if(userPos) return [userPos.lat,userPos.lng];
    return CONFIG.center;
  }
  function distToPlace(p){
    if(!isMappablePlace(p)) return null;
    const [la,ln]=originLatLng();
    return haversineKm(la,ln,p.lat,p.lng);
  }
  function travelEstimate(p){
    const km=distToPlace(p);
    if(km==null) return null;
    const car=Math.max(3,Math.round(km/45*60));
    const bike=Math.max(5,Math.round(km/15*60));
    const walk=walkMinutesFromKm(km);
    const sl=Math.max(12,Math.round(km/22*60)+8);
    return {km,car,bike,walk,sl,fromUser:!!userPos};
  }
  function travelHTML(p){
    const t=travelEstimate(p);
    if(!t) return "Möts på platsen enligt bokning — ingen fast adress.";
    const from=t.fromUser?"från dig":"från centrum";
    return `<strong>${fmtDist(t.km)}</strong> ${from}<br>Bil ~${t.car} min · Cykel ~${t.bike} min · SL ~${t.sl} min`;
  }
  function placeTags(p){return metaOf(p).tags||[];}
  function hasTag(p,t){return placeTags(p).includes(t);}

  function bumpInterest(name,kind){
    if(!interest[name]) interest[name]={saves:0,views:0};
    interest[name][kind]=(interest[name][kind]||0)+1;
    saveJSON(LS_INTEREST,interest);
  }
  function interestLabel(name){
    const n=(interest[name]?.saves||0)+(interest[name]?.views||0);
    if(n>=3) return "Populärt hos dig just nu";
    if(favorites.has(name)) return "Sparad av dig";
    return "";
  }
  function updateFavBadge(){
    const el=document.getElementById('favCountBadge');
    if(!el) return;
    if(favorites.size){el.hidden=false;el.textContent=String(favorites.size);}
    else el.hidden=true;
  }
  function toggleFavorite(name){
    const key=String(name||"").trim();
    if(!key) return false;
    if(favorites.has(key)) favorites.delete(key);
    else {favorites.add(key);bumpInterest(key,"saves");}
    saveJSON(LS_FAV,[...favorites]);
    updateFavBadge();
    trackEvent(favorites.has(key)?'fav-add':'fav-remove',key);
    renderFavorites();
    refreshPulse();
    return favorites.has(key);
  }
  function removeFavorite(name){
    const key=String(name||"").trim();
    if(!key||!favorites.has(key)) return;
    favorites.delete(key);
    saveJSON(LS_FAV,[...favorites]);
    updateFavBadge();
    trackEvent('fav-remove',key);
    renderFavorites();
    refreshPulse();
    const platsName=document.getElementById('platsName')?.textContent;
    const favBtn=document.getElementById('platsFavBtn');
    if(favBtn&&platsName===key){
      favBtn.classList.remove('on');
      favBtn.textContent='♡ Spara som favorit';
    }
  }
  function toggleFavFromPlats(){
    const name=document.getElementById('platsName')?.textContent;
    if(!name) return;
    const on=toggleFavorite(name);
    const btn=document.getElementById('platsFavBtn');
    if(btn){btn.classList.toggle('on',on);btn.textContent=on?'♥ Sparad':'♡ Spara som favorit';}
  }

  // Municipal / local rhythms (soft editorial cues)
  function municipalRhythm(){
    if(day===2 && month>=4 && month<=8) return {text:"Tisdag i Brottby — bilträff-känsla vid Össby Handelsträdgård.",place:"Össby Handelsträdgård"};
    if(day===6) return {text:"Lördag i bygden — bra dag för fika, torgkänsla och fynd.",place:null};
    if(day===0) return {text:"Söndagsutflykt? Gårdar, natur och lugnare tempo.",place:null};
    if(daypart==="lunch") return {text:"Lunchrundan: flera kök i centrum har öppet nu.",place:null};
    if(holidayToday) return {text:holidayToday+" i "+K+" — kolla öppettider innan du åker.",place:null};
    return null;
  }

  function daypartTypes(){
    return daypartTypesForMood(daypart, isWeekend, ctx.mood||"mild", {
      temp:ctx.temp,
      code:ctx.code,
    });
  }

  function scorePlace(p){
    let s=0;
    const reasons=[];
    const open=isOpen(p);
    const timed=isTimedVenue(p);
    const soon=isClosingSoon(p);
    const mins=minutesUntilClose(p);
    // "Öppet nu" = verksamheter med öppettider — inte runstenar/kyrkor som alltid är "öppna"
    if(timed && open){s+=40;reasons.push("Öppet nu");}
    else if(!timed && open){
      // Alltid tillgängliga utomhusplatser: lätt boost dagtid, inte nattfavoriter
      s+=(hour>=8 && hour<21)?10:-8;
    }
    else {s-=25;}
    if(soon){s+=8;reasons.push("Stänger snart");}
    if(daypartTypes().includes(p.type)){
      s+=18;
      let fit=
        daypart==="morgon"?"Passar morgonen":
        daypart==="lunch"?"Bra till lunch":
        daypart==="eftermiddag"?"Passar eftermiddagen":
        (open?"Kvällsläge":"Planera kvällen");
      // Avoid contradicting "Öppet nu" with a second open-status reason
      if(fit && !(open && (fit==="Kvällsläge"))) reasons.push(fit);
    }
    if(isWeekend && ["natur","gard","loppis","fika"].includes(p.type)){s+=12;reasons.push("Helgläge");}
    if(!isWeekend && ["fika","butik"].includes(p.type) && daypart==="lunch"){s+=8;}

    const wxDelta=weatherScoreDelta(p, ctx.mood, {
      hasTag:(pl,t)=>hasTag(pl,t),
      temp:ctx.temp,
      code:ctx.code,
    });
    s+=wxDelta;
    const hot=isHotSwimWeather(ctx.temp, ctx.code);
    if(hot && isOutdoorBathPlace(p)){
      reasons.push("Perfekt baddags");
    } else if(ctx.mood==="nice" && !isOutdoorBathPlace(p) && (["natur","gard","loppis"].includes(p.type) || hasTag(p,"ute"))){
      const outdoor=["Soligt läge","Fin dag ute","Landskapet kallar","Bra utflyktsväder"];
      if(!reasons.some(r=>outdoor.includes(r))){
        reasons.push(outdoor[Math.abs([...p.name].reduce((a,c)=>a+c.charCodeAt(0),0))%outdoor.length]);
      }
    }
    if(ctx.mood==="rough" && (["fika","butik"].includes(p.type) || hasTag(p,"inomhus"))){
      const indoor=["Mysigt inomhus","Tak över huvudet","Varm dryck väntar","Innekos"];
      if(!reasons.some(r=>indoor.includes(r))){
        reasons.push(indoor[Math.abs([...p.name].reduce((a,c)=>a+c.charCodeAt(0),0))%indoor.length]);
      }
    }
    if(ctx.mood==="rough" && (isOutdoorBathPlace(p) || p.type==="natur")){
      reasons.push("Väntar på bättre väder");
    }
    if(ctx.mood==="mild" && open){s+=4;}
    if(ctx.mood==="mild" && hasTag(p,"ute") && hour>=10 && hour<18){s+=4;}
    if(eventsByHost[p.name]?.some(e=>e.date===todayISO)){s+=22;reasons.push("Event idag");}
    if(isNewPlace(p)){s+=6;reasons.push("Nytt i guiden");}
    if(favorites.has(p.name)){s+=10;reasons.push("Din favorit");}
    if(userPos && isMappablePlace(p)){
      const km=haversineKm(userPos.lat,userPos.lng,p.lat,p.lng);
      p._km=km;
      if(km<1.2){s+=20;reasons.push(fmtDist(km)+" bort");}
      else if(km<4){s+=10;reasons.push(fmtDist(km)+" bort");}
      else if(km<10){s+=4;}
      else {s-=6;}
    } else {p._km=null;}
    // Soft sunset boost for nature in evening light window (skip in rough rain/cold)
    if(p.type==="natur" && ctx.sunset && ctx.mood!=="rough"){
      const [sh,sm]=ctx.sunset.split(":").map(Number);
      const sunsetMin=sh*60+sm;
      const nowMin=hour*60+minute;
      if(nowMin>=sunsetMin-120 && nowMin<=sunsetMin+20){s+=10;reasons.push("Fint ljus fram till skymning");}
    }
    if(mins>0 && mins<40){reasons[0]=`Stänger om ${mins} min`;}
    return {score:s,reasons:reasons.slice(0,2),open,soon,mins};
  }

  function rankedPlaces(){
    return places.map(p=>({p,...scorePlace(p)})).sort((a,b)=>b.score-a.score);
  }

  document.title="Upptäck "+K;
  const S=(id,t)=>{const e=document.getElementById(id);if(e)e.textContent=t;};
  S('brandKommun',K);S('handerKommun',K);S('wPlace',K);
  S('seasonHeading',"I säsong just nu");
  S('footTag',"Tillsammans gör vi "+K+" levande.");S('omKommun',K);
  {const y=document.getElementById('footYear'); if(y) y.textContent=String(now.getFullYear());}
  S('omLede',"Jag heter Juha. Jag är ursprungligen Sundsvallsbo, men har bott i södra Stockholm i snart femton år.");
  const omBody=document.getElementById('omBody');
  if(omBody){omBody.innerHTML=`
    <p>När min fru och jag började längta efter något annat blev det till slut ${K} — här finns något som påminner mig om hemma. Ett lugn, en närhet, en känsla av att bygden faktiskt är en bygd.</p>
    <p>Jag minns dagen vi hade skrivit på för huset. Vi svängde förbi Ica i centrum, och på väg tillbaka till bilen stod en liten handskriven skylt nära parkeringen:</p>
    <p class="om-quote">“Hönsfoder säljes, ring…”</p>
    <p>Något så enkelt — men både jag och min fru kände det direkt. Det var äkta. En påminnelse om något jordnära och mänskligt som sakta håller på att försvinna. Och som är värt att hålla fast vid.</p>
    <p>Det är därför den här sidan finns. Google visar dig kedjorna och det du redan känner till. Men bagaren som är uppe klockan fyra för surdegen, gårdsbutiken där du betalar i en burk på förtroende, runstenarna vid sjön som stått där i tusen år — och skylten om hönsfodret — det hittar du inte där.</p>
    <p>Upptäck ${K} är min lilla insats: en handplockad guide till bygden — ställena, människorna bakom dem och det som händer här. Ingen katalog, inga annonser — bara sådant jag själv tycker om, beskrivet med omsorg.</p>
    <p>Jag är själv småföretagare precis som de flesta här på sidan, och driver en liten designbyrå här i ${K} — <a href="https://www.fvno.se/" target="_blank" rel="noopener">Formverket Norrort</a>. Den här sidan är ingen annons för den. Allt du ser här har jag valt själv, för att jag tycker om det. Sidan är gratis att använda, för både besökare och verksamheter. Att jag byggt den beror nog mest på att det här är vad jag kan, och det kändes som rätt sak att använda det till.</p>
    <p>Jag tycker att de lokala verksamheterna är en av de pelare som gör en bygd levande, och stolt. Det är där en del av själen sitter.</p>
    <p>Mitt enda syfte är att lyfta det som gör ${K} till ${K}.</p>
    <p>Så: välkommen. Ge dig ut, hälsa på grannen, upptäck något du inte visste fanns.</p>
    <p class="om-sign">— Juha</p>
    <p class="om-pwa" data-pwa-install-entry><button type="button" class="lnk" onclick="promptPwaInstall()">Lägg till på hemskärmen</button> — snabbare öppning, utan appbutik.</p>`;}

  function refreshHeroGreet(){
    let greet;
    const sunsetH=ctx.sunset?Number(String(ctx.sunset).slice(0,2)):null;
    const stillDaylight=sunsetH!=null?hour<sunsetH:(hour<20);
    if(holidayToday){greet=holidayToday+" i "+K;}
    else if(hour<10){greet="God morgon, "+K;}
    else if(hour<14){greet=isWeekend?"Helglunch i bygden":"Lunchdags i bygden";}
    else if(hour<18 || (stillDaylight && hour<20)){
      greet=isWeekend?"Helgeftermiddag i "+K:"Eftermiddag i "+K;
    }
    else if(hour<21){greet="Kvällsljus i "+K;}
    else {greet="God kväll, "+K;}
    S('heroGreet',greet);
  }
  refreshHeroGreet();
  const heroTitleEl=document.getElementById('heroTitle');
  if(heroTitleEl) heroTitleEl.textContent="Vad vill du upptäcka idag?";
  S('heroTagline',"Smultronställen · Fika · Natur · Evenemang");
  const heroSubBase="Handplockade lokala favoriter — inte kedjorna du redan känner till.";
  S('heroSub', isWeekend ? "Helgläge: utflykter, fika och det som gör bygden levande — nära dig." : heroSubBase);
  updateFavBadge();

  /**
   * "Sen sist du var här" — only when there is a non-empty delta.
   * Launch migration: missing uv_last_visit → set to now, render nothing
   * (covers first-timers AND known visitors who lack the new key).
   */
  function renderSinceLastVisit(){
    try{
      document.getElementById("sinceLast")?.remove();
      const after=document.getElementById("todayBrief");
      if(!after || !after.parentNode) return;

      let storage=null;
      try{ storage=window.localStorage; }catch(e){ storage=null; }

      const visitNow=new Date();
      const state=resolveVisitState(storage, visitNow);
      if(state.mode==="bootstrap"){
        writeLastVisit(storage, visitNow);
        return;
      }

      const delta=collectSinceLastDelta({
        places,
        placeMeta:PLACE_META,
        events,
        lastVisitISO:state.lastVisitISO,
      });
      writeLastVisit(storage, visitNow);
      if(deltaIsEmpty(delta)) return;

      const groups=[];
      if(delta.places.length){
        const items=delta.places.map(p=>
          `<li><button type="button" class="since-last-link" onclick="openPlace('${jsEsc(p.name)}')">${escHtml(p.name)}</button></li>`
        ).join("");
        groups.push(`<div class="since-last-group"><h3>${placeGroupLabel(delta.places.length)}</h3><ul>${items}</ul></div>`);
      }
      if(delta.events.length){
        const items=delta.events.map(e=>{
          const key=jsEsc(e.title+"||"+e.date);
          return `<li><button type="button" class="since-last-link" onclick="openEvent('${key}')">${escHtml(e.title)}</button></li>`;
        }).join("");
        groups.push(`<div class="since-last-group"><h3>${eventGroupLabel(delta.events.length)}</h3><ul>${items}</ul></div>`);
      }

      const sec=document.createElement("section");
      sec.id="sinceLast";
      sec.className="since-last";
      sec.setAttribute("aria-label","Sen sist du var här");
      sec.innerHTML=`<div class="inner">
        <header class="since-last-head">
          <div class="eyebrow">Sen sist</div>
          <h2>Sen sist du var här</h2>
        </header>
        <div class="since-last-groups">${groups.join("")}</div>
      </div>`;
      after.insertAdjacentElement("afterend", sec);
    }catch(e){
      console.warn("renderSinceLastVisit", e);
    }
  }
  try{ renderSinceLastVisit(); }catch(e){}

  // ============================================================
  //  NÄRA DIG (homepage) — strict privacy: in-memory only, no Umami geo
  //  Default: all places. "Använd min position" only pans + marks you — no radius filter.
  // ============================================================
  let nearDigPos=null; // session memory only — never localStorage / never analytics
  let nearDigFilter="alla";
  let nearDigOpenNow=false;
  let nearDigMode="map"; // map | list
  let nearDigMap=null;
  let nearDigMarkers=[];
  let nearDigYouMarker=null;

  function nearDigIsOpen(p){
    return isOpenVenue(p) || (!isTimedVenue(p) && isOpen(p));
  }

  function nearDigHits(){
    return filterPlacesNear(places.filter(isMappablePlace), nearDigPos, haversineKm, {
      filterKey:nearDigFilter,
      openNowOnly:nearDigOpenNow,
      isOpenFn:nearDigIsOpen,
    });
  }

  function mountNearDigPanel(){
    const root=document.getElementById("naraDigRoot");
    if(!root) return;
    root.innerHTML=`<section class="nara-dig" id="naraDig" aria-label="Utforska">
      <div class="inner">
        <header class="nara-dig-head">
          <div class="nara-dig-titles">
            <h2>Upptäck runt hörnet</h2>
            <p class="nara-dig-sub">Fika, natur, gårdar och mer — zooma kartan, filtrera eller byt till lista.</p>
          </div>
        </header>
        <div class="nara-dig-toolbar">
          <div class="nara-dig-filters" id="naraDigFilters" role="toolbar" aria-label="Filter"></div>
          <div class="nara-dig-head-actions">
            <button type="button" class="nara-dig-view-toggle" id="naraDigViewToggle" aria-pressed="false">≡ Visa som lista</button>
          </div>
        </div>
        <div class="nara-dig-stage">
          <div class="nara-dig-map-wrap" id="naraDigMapWrap">
            <div id="naraDigMap" class="nara-dig-map" role="presentation"></div>
            <aside class="nara-dig-panel" id="naraDigPanel" aria-live="polite"></aside>
            <div class="nara-dig-controls" aria-label="Kartkontroller">
              <button type="button" class="nara-dig-ctrl" id="naraDigLocate" title="Min position" aria-label="Använd min position">◎</button>
              <button type="button" class="nara-dig-ctrl" id="naraDigZoomIn" title="Zooma in" aria-label="Zooma in">+</button>
              <button type="button" class="nara-dig-ctrl" id="naraDigZoomOut" title="Zooma ut" aria-label="Zooma ut">−</button>
            </div>
          </div>
          <div class="nara-dig-list" id="naraDigList" hidden></div>
        </div>
      </div>
    </section>`;
    nearDigMode="map";
    nearDigFilter="alla";
    nearDigOpenNow=false;
    renderNearDigFilters();
    document.getElementById("naraDigViewToggle")?.addEventListener("click", toggleNearDigView);
    document.getElementById("naraDigLocate")?.addEventListener("click", ()=>{
      if(nearDigPos && nearDigMap){
        nearDigMap.setView([nearDigPos.lat, nearDigPos.lng], 14);
      }else{
        requestNearDigLocation();
      }
    });
    document.getElementById("naraDigZoomIn")?.addEventListener("click", ()=>nearDigMap?.zoomIn());
    document.getElementById("naraDigZoomOut")?.addEventListener("click", ()=>nearDigMap?.zoomOut());
    renderNearDigContent();
    initNearDigMap();
  }

  function syncNearDigAskBtn(){
    const locate=document.getElementById("naraDigLocate");
    if(!locate) return;
    if(!navigator.geolocation){
      locate.hidden=true;
      return;
    }
    locate.hidden=false;
    locate.title=nearDigPos?"Centrera på min position":"Använd min position";
    locate.setAttribute("aria-label", locate.title);
    locate.classList.toggle("is-active", !!nearDigPos);
  }

  function requestNearDigLocation(){
    if(!navigator.geolocation) return;
    const locate=document.getElementById("naraDigLocate");
    if(locate) locate.disabled=true;
    navigator.geolocation.getCurrentPosition(
      (pos)=>{
        nearDigPos={ lat:pos.coords.latitude, lng:pos.coords.longitude };
        if(locate) locate.disabled=false;
        syncNearDigAskBtn();
        applyNearDigPositionToMap();
        renderNearDigContent();
        refreshNearDigMapMarkers();
      },
      ()=>{
        if(locate) locate.disabled=false;
        syncNearDigAskBtn();
      },
      { enableHighAccuracy:false, timeout:8000, maximumAge:0 }
    );
  }

  function renderNearDigFilters(){
    const bar=document.getElementById("naraDigFilters");
    if(!bar) return;
    const showSmultron=isSmultronFilterVisible(places);
    const chips=[
      { key:"alla", label:"Allt", kind:"cat" },
      { key:"open", label:"Öppet nu", kind:"open" },
      ...NEAR_FILTERS.filter(f=>{
        if(f.key==="alla") return false;
        if(f.key==="smultronstalle") return showSmultron;
        return true;
      }).map(f=>({ key:f.key, label:f.label, kind:"cat" })),
    ];
    if(nearDigFilter==="smultronstalle" && !showSmultron) nearDigFilter="alla";
    bar.innerHTML=chips.map(c=>{
      const on=c.kind==="open" ? nearDigOpenNow : nearDigFilter===c.key;
      const ico=c.key==="open"?"🕒 ":c.key==="fika"?"🍴 ":c.key==="natur"?"🌲 ":c.key==="butik"?"🛍️ ":c.key==="smultronstalle"?"✨ ":c.key==="mer"?"··· ":"";
      const label=c.key==="alla"?(on?"● Allt":"Allt"):ico+c.label;
      return `<button type="button" class="nara-dig-chip${on?" on":""}" data-kind="${c.kind}" data-key="${c.key}" aria-pressed="${on?"true":"false"}">${label}</button>`;
    }).join("");
    bar.querySelectorAll(".nara-dig-chip").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const kind=btn.dataset.kind;
        const key=btn.dataset.key;
        if(kind==="open"){
          nearDigOpenNow=!nearDigOpenNow;
        }else{
          nearDigFilter=key;
        }
        renderNearDigFilters();
        renderNearDigContent();
        refreshNearDigMapMarkers();
      });
    });
  }

  function toggleNearDigView(){
    nearDigMode=nearDigMode==="map"?"list":"map";
    const toggle=document.getElementById("naraDigViewToggle");
    const wrap=document.getElementById("naraDigMapWrap");
    const list=document.getElementById("naraDigList");
    if(toggle){
      toggle.setAttribute("aria-pressed", nearDigMode==="list"?"true":"false");
      toggle.textContent=nearDigMode==="list"?"☰ Visa som karta":"≡ Visa som lista";
    }
    if(wrap) wrap.hidden=nearDigMode==="list";
    if(list){
      const showList=nearDigMode==="list";
      list.hidden=!showList;
      list.classList.toggle("is-visible", showList);
      if(!showList) list.innerHTML="";
    }
    if(nearDigMode==="map"){
      setTimeout(()=>{ nearDigMap?.invalidateSize(); }, 40);
    }else{
      renderNearDigList();
    }
  }

  function renderNearDigPanel(hits){
    const panel=document.getElementById("naraDigPanel");
    if(!panel) return;
    const groups=summarizeNearGroups(hits);
    const n=hits.length;
    const kicker=nearDigPos
      ? `<span aria-hidden="true">📍</span> Från din position`
      : `<span aria-hidden="true">🗺️</span> Alla platser`;
    const rows=groups.map(g=>`
      <div class="nara-dig-row">
        <span class="nara-dig-ico" style="background:${g.color}" aria-hidden="true">${pinIconSvgForType(g.types[0])}</span>
        <span class="nara-dig-row-label">${escHtml(g.label)}</span>
        <span class="nara-dig-row-count">${g.count}</span>
      </div>`).join("");
    panel.innerHTML=`
      <div class="nara-dig-panel-kicker">${kicker}</div>
      <div class="nara-dig-stat">${n}</div>
      <div class="nara-dig-stat-label">tips för dig</div>
      <div class="nara-dig-rows">${rows||`<p class="nara-dig-empty">Inga träffar med nuvarande filter.</p>`}</div>
      <button type="button" class="nara-dig-panel-link" id="naraDigShowMap">Se alla på karta →</button>`;
    document.getElementById("naraDigShowMap")?.addEventListener("click",()=>{
      if(nearDigMode!=="map") toggleNearDigView();
      else fitNearDigMap(hits);
    });
  }

  function renderNearDigList(){
    const list=document.getElementById("naraDigList");
    if(!list || nearDigMode!=="list") return;
    const hits=nearDigHits();
    if(!hits.length){
      list.innerHTML=`<p class="nara-dig-empty">Inga träffar med nuvarande filter.</p>`;
      return;
    }
    list.innerHTML=hits.map(({place:p})=>{
      return `<button type="button" class="nara-dig-list-item" data-name="${escHtml(p.name)}">
        <span class="nara-dig-ico" style="background:${pinColorForType(p.type)}" aria-hidden="true">${pinIconSvgForType(p.type)}</span>
        <span class="nara-dig-list-copy">
          <strong>${escHtml(p.name)}</strong>
          <span>${escHtml(p.cat)}</span>
        </span>
      </button>`;
    }).join("");
    list.querySelectorAll(".nara-dig-list-item").forEach(btn=>{
      btn.addEventListener("click",()=>focusNearDigPlace(btn.dataset.name));
    });
  }

  function renderNearDigContent(){
    const hits=nearDigHits();
    renderNearDigPanel(hits);
    renderNearDigList();
    syncNearDigAskBtn();
  }

  /** List → map: pan to the place and open its popup (detail via "Läs mer"). */
  function focusNearDigPlace(name){
    const p=places.find(x=>x.name===name);
    if(!p || !isMappablePlace(p)) return;
    const wasList=nearDigMode==="list";
    if(wasList) toggleNearDigView();
    const reveal=()=>{
      if(!nearDigMap) return;
      nearDigMap.invalidateSize();
      nearDigMap.flyTo([p.lat, p.lng], 15, { duration:0.55 });
      const entry=nearDigMarkers.find(x=>x.name===name);
      setTimeout(()=>entry?.marker?.openPopup(), wasList ? 620 : 560);
    };
    setTimeout(reveal, wasList ? 50 : 0);
  }

  function nearDigPinIcon(type){
    const Lref=window.L;
    if(!Lref) return null;
    const color=pinColorForType(type);
    const svg=pinIconSvgForType(type);
    return Lref.divIcon({
      className:"",
      html:`<div class="nara-dig-pin" style="--pin:${color}">${svg}</div>`,
      iconSize:[32,32],
      iconAnchor:[16,16],
    });
  }

  function clearNearDigYouMarker(){
    if(nearDigYouMarker && nearDigMap){
      try{ nearDigMap.removeLayer(nearDigYouMarker); }catch(e){}
    }
    nearDigYouMarker=null;
  }

  function applyNearDigPositionToMap(){
    const Lref=window.L;
    if(!nearDigMap || !nearDigPos || !Lref) return;
    clearNearDigYouMarker();
    nearDigYouMarker=Lref.circleMarker([nearDigPos.lat, nearDigPos.lng],{
      radius:9,
      color:"#fff",
      weight:3,
      fillColor:"#2a3228",
      fillOpacity:1,
      className:"nara-dig-you",
    }).addTo(nearDigMap);
    nearDigMap.setView([nearDigPos.lat, nearDigPos.lng], 13);
  }

  function fitNearDigMap(hits){
    const Lref=window.L;
    if(!nearDigMap || !Lref) return;
    if(!hits.length){
      nearDigMap.setView(CONFIG.center, CONFIG.zoom || 12);
      return;
    }
    const bounds=Lref.latLngBounds(hits.map(h=>[h.place.lat, h.place.lng]));
    if(nearDigPos) bounds.extend([nearDigPos.lat, nearDigPos.lng]);
    nearDigMap.fitBounds(bounds.pad(0.18));
  }

  async function initNearDigMap(){
    const el=document.getElementById("naraDigMap");
    if(!el) return;
    let Lref;
    try{ Lref=await ensureLeaflet(); }catch(e){ return; }
    if(!Lref) return;
    if(nearDigMap){
      try{ nearDigMap.remove(); }catch(err){}
      nearDigMap=null;
    }
    nearDigMap=Lref.map("naraDigMap",{
      zoomControl:false,
      scrollWheelZoom:true,
      attributionControl:false,
    }).setView(CONFIG.center, CONFIG.zoom || 12);
    addBasemap(nearDigMap, Lref);
    refreshNearDigMapMarkers();
    setTimeout(()=>{
      nearDigMap?.invalidateSize();
      fitNearDigMap(nearDigHits());
    }, 80);
  }

  function refreshNearDigMapMarkers(){
    const Lref=window.L;
    if(!nearDigMap || !Lref) return;
    nearDigMarkers.forEach(({marker:m})=>{ try{ nearDigMap.removeLayer(m); }catch(e){} });
    nearDigMarkers=[];
    const hits=nearDigHits();
    hits.forEach(({place:p})=>{
      const icon=nearDigPinIcon(p.type);
      if(!icon) return;
      const m=Lref.marker([p.lat,p.lng],{ icon })
        .addTo(nearDigMap)
        .bindPopup(`<strong>${escHtml(p.name)}</strong><br>${escHtml(p.cat)}<br><button type="button" class="popup-more" onclick="openPlace('${jsEsc(p.name)}')">Läs mer →</button>`,{ closeButton:false, maxWidth:220 });
      nearDigMarkers.push({ name:p.name, marker:m });
    });
    renderNearDigPanel(hits);
  }

  // Return visit memory
  (function showReturn(){
    const last=loadJSON(LS_LAST,null);
    if(!last?.name) return;
    const p=places.find(x=>x.name===last.name); if(!p) return;
    const open=isOpen(p);
    const banner=document.getElementById('returnBanner');
    const text=document.getElementById('returnText');
    const btn=document.getElementById('returnBtn');
    if(!banner||!text||!btn) return;
    const when=last.at?new Date(last.at):null;
    let whenBit="";
    if(when && !Number.isNaN(when.getTime())){
      const sameDay=
        when.getFullYear()===now.getFullYear() &&
        when.getMonth()===now.getMonth() &&
        when.getDate()===now.getDate();
      if(!sameDay){
        whenBit=" ("+when.toLocaleDateString("sv-SE",{weekday:"short",day:"numeric",month:"short"})+")";
      }
    }
    const openBit=!isTimedVenue(p)
      ?(open?"alltid tillgänglig":"kolla innan du åker")
      :(open?"öppet nu":"stängt just nu");
    text.innerHTML=`Senast tittade du på <strong>${p.name}</strong>${whenBit} — ${openBit}${p.ch&&open&&isTimedVenue(p)?`, till ${String(p.ch).padStart(2,"0")}:00`:""}.`;
    btn.onclick=()=>openPlace(p.name);
    banner.hidden=false;
  })();

  // ---- Botanical SVGs for season cards ----
  const BOTANICALS={
    berry:`<svg width="90" height="90" viewBox="0 0 90 90" fill="none"><circle cx="30" cy="48" r="8" stroke="currentColor" stroke-width="1.4"/><circle cx="44" cy="40" r="8" stroke="currentColor" stroke-width="1.4"/><circle cx="48" cy="56" r="8" stroke="currentColor" stroke-width="1.4"/><path d="M36 28c8-14 22-16 30-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M52 22c6 2 10 8 10 14" stroke="currentColor" stroke-width="1.3"/></svg>`,
    leaf:`<svg width="90" height="90" viewBox="0 0 90 90" fill="none"><path d="M20 62c8-28 28-42 52-46-2 26-14 48-40 58-6-2-10-6-12-12z" stroke="currentColor" stroke-width="1.4"/><path d="M28 58c14-10 28-28 36-44" stroke="currentColor" stroke-width="1.2"/></svg>`,
    stalk:`<svg width="90" height="90" viewBox="0 0 90 90" fill="none"><path d="M40 78V28" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M40 48c-12-4-18-14-16-24" stroke="currentColor" stroke-width="1.3"/><path d="M40 40c12-2 20-10 22-20" stroke="currentColor" stroke-width="1.3"/><path d="M34 24c4-8 10-12 18-12" stroke="currentColor" stroke-width="1.3"/></svg>`
  };

  function seasonCards(){
    if(month>=2&&month<=4){
      return [
        {title:"Första grönskan",text:"Vitsippor, fågelsång och de första promenaderna i Angarn.",img:"/assets/upplev/angarnsjoangen/cover.webp",link:"Se naturpärlor →",type:"natur",bot:"leaf"},
        {title:"Ägg från gården",text:"Frigående höns och vårens första leveranser i gårdsbodarna.",img:"/assets/upplev/gravelsta-gard/cover.webp",link:"Se var du kan köpa →",type:"gard",bot:"stalk"},
        {title:"Rabarber och första skörden",text:"Syrligt, rosa och alldeles vårigt — fyll korgen.",img:"/assets/upplev/markims-bergby/cover.webp",link:"Hitta gårdsbutiker →",type:"gard",bot:"berry"}
      ];
    }
    if(month>=5&&month<=7){
      return [
        {title:"Svenska jordgubbar",text:"Säsongens sötaste — plocka eller köp lokalt.",img:"/assets/upplev/orkesta-granby-gard/cover.webp",link:"Se var du kan köpa →",type:"gard",bot:"berry"},
        {title:"Vandra i grönskan",text:"Spänger, fågelliv och öppna landskap nära dig.",img:"/assets/upplev/angarnsjoangen/cover.webp",link:"Utforska natur →",type:"natur",bot:"leaf"},
        {title:"Uteserveringarnas tid",text:"Långa ljusa kvällar och fika under öppet himlavalv.",img:"/assets/upplev/vallentuna-stenugnsbageri/cover.webp",link:"Hitta fik →",type:"fika",bot:"stalk"}
      ];
    }
    if(month>=8&&month<=9){
      return [
        {title:"Skördens tid",text:"Rotfrukter, äpplen och honung direkt från gården.",img:"/assets/upplev/gravelsta-gard/cover.webp",link:"Se var du kan köpa →",type:"gard",bot:"stalk"},
        {title:"Svamppromenad",text:"Skogar och stigar när luften blir krispig.",img:"/assets/upplev/vallentuna-naturreservat/cover.webp",link:"Utforska natur →",type:"natur",bot:"leaf"},
        {title:"Höstfika",text:"Kanel, kardemumma och nybakat ur stenugnen.",img:"/assets/upplev/vallentuna-stenugnsbageri/cover.webp",link:"Hitta bagerier →",type:"fika",bot:"berry"}
      ];
    }
    return [
      {title:"Värm dig lokalt",text:"Nybakat ur stenugnen när mörkret faller.",img:"/assets/upplev/vallentuna-stenugnsbageri/cover.webp",link:"Hitta fik →",type:"fika",bot:"berry"},
      {title:"Julmarknadskänsla",text:"Små evenemang, ljus och lokala smaker.",img:"/assets/hero/2.webp",link:"Se evenemang →",type:"hander",bot:"leaf"},
      {title:"Handla nära",text:"Presenttips och hantverk från bygdens verkstäder.",img:"/assets/upplev/lejonkulan-presenter-och-inredning/cover.webp",link:"Utforska butiker →",type:"butik",bot:"stalk"}
    ];
  }

  // Season tips live in the hero "Just nu"-panel — no duplicate strip on the homepage.
  const seasonStrip=document.getElementById('seasonStrip');
  if(seasonStrip){
    seasonStrip.innerHTML=seasonCards().map(s=>`
      <article class="season" onclick="${s.type==='hander'?"showView('hander')":(CATEGORIES[s.type]?`openCategory('${s.type}')`:`filterAndMap('${s.type}')`)}">
        <div class="im" style="background-image:url('${s.img}')" role="img" aria-label="${s.title}"></div>
        <div class="bd">
          <h3>${s.title}</h3>
          <p>${s.text}</p>
          <span class="lnk">${s.link}</span>
        </div>
        <div class="botanical" aria-hidden="true">${BOTANICALS[s.bot]||BOTANICALS.leaf}</div>
      </article>`).join('');
  }

  /** Escape for single-quoted JS string in HTML onclick attributes */
  function jsEsc(s){
    return String(s||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  }
  function eventKeyAttr(e){
    return jsEsc(e.title+"||"+e.date);
  }
  function resolveHostPlace(host){
    const h=String(host||"").trim();
    if(!h) return null;
    const exact=resolvePlaceRef(h, places);
    if(exact) return exact;
    const hits=places.filter(p=>h.includes(p.name)||p.name.includes(h));
    if(!hits.length) return null;
    return hits.sort((a,b)=>b.name.length-a.name.length)[0];
  }
  /** Prefer a guide place name when an event host maps to one. */
  function favoriteKeyFromHost(host){
    return resolveHostPlace(host)?.name || String(host||"").trim();
  }
  /** Collapse event-host favorites onto place names so badge and list stay in sync. */
  function normalizeFavorites(){
    const next=[];
    for(const n of favorites){
      const key=places.find(p=>p.name===n)?.name || resolveHostPlace(n)?.name || String(n||"").trim();
      if(key&&!next.includes(key)) next.push(key);
    }
    const same=next.length===favorites.size && next.every(n=>favorites.has(n));
    if(same) return;
    favorites.clear();
    next.forEach(n=>favorites.add(n));
    saveJSON(LS_FAV,next);
    updateFavBadge();
  }
  function eventHostActionHTML(e){
    const hostPlace=resolveHostPlace(e.host);
    if(hostPlace){
      return `<button type="button" class="btn-ghost-ink" onclick="closeEventModal();openPlace('${jsEsc(hostPlace.name)}')">Visa ${escHtml(hostPlace.name)} →</button>`;
    }
    if(e.source){
      return `<a class="btn-ghost-ink" href="${String(e.source).replace(/"/g,"&quot;")}" target="_blank" rel="noopener" onclick="trackEvent('event-source','${jsEsc(e.title)}')">Mer info →</a>`;
    }
    const q=encodeURIComponent(e.host+", Vallentuna");
    return `<a class="btn-ghost-ink" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">Hitta platsen →</a>`;
  }
  function remindBtnHTML(e){
    return `<button type="button" class="remind-btn" data-remind onclick="event.stopPropagation();openRemindChooser(event,'${eventKeyAttr(e)}')">Påminn mig</button>`;
  }
  function eventCard(e,withFav){
    const d=new Date(e.date+"T12:00:00");
    const favKey=favoriteKeyFromHost(e.host);
    const isFavHost=favorites.has(favKey);
    const favKeyEsc=jsEsc(favKey);
    const keyAttr=eventKeyAttr(e);
    const fav=withFav?`<button class="fav ${isFavHost?'on':''}" type="button" aria-label="${isFavHost?"Ta bort favorit":"Spara favorit"}" onclick="event.stopPropagation();const on=toggleFavorite('${favKeyEsc}');this.classList.toggle('on',on);this.setAttribute('aria-label',on?'Ta bort favorit':'Spara favorit')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.35-7-9.2A3.8 3.8 0 0 1 12 7.1a3.8 3.8 0 0 1 7 3.7C19 15.65 12 20 12 20z" stroke="currentColor" stroke-width="1.7"/></svg></button>`:"";
    return `<article class="ev" role="button" tabindex="0" onclick="openEvent('${keyAttr}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openEvent('${keyAttr}')}">
      <div class="media">
        <div class="thumb" style="background-image:url('${e.img}')" role="img" aria-label="${e.title.replace(/"/g,"&quot;")}"></div>
        <div class="date"><span class="dow">${DOW[d.getDay()]}</span><span class="d">${d.getDate()}</span><span class="m">${MON[d.getMonth()]}</span></div>
        ${fav}
      </div>
      <div class="bd">
        <h3>${e.title}</h3>
        <div class="meta">
          <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="11" r="2" stroke="currentColor" stroke-width="2"/></svg>${e.host}</span>
          <span><svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/><path d="M12 8v4l2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>${e.time||e.when}</span>
        </div>
        <div class="tag">${e.date===todayISO?"IDAG · ":""}${eventCatLabel(e.cat)}</div>
        ${remindBtnHTML(e)}
      </div>
    </article>`;
  }

  let eventModalKey=null;
  function openEvent(key){
    const e=findEventByKey(key);
    if(!e) return;
    eventModalKey=key;
    const d=new Date(e.date+"T12:00:00");
    const modal=document.getElementById('eventModal');
    const hero=document.getElementById('eventModalHero');
    const dateEl=document.getElementById('eventModalDate');
    const rich=EVENT_CONTENT[e.title];
    const hostPlace=resolveHostPlace(e.host);
    if(hero) hero.style.backgroundImage=`url('${e.img}')`;
    if(dateEl) dateEl.innerHTML=`<span class="dow">${DOW[d.getDay()]}</span><span class="d">${d.getDate()}</span><span class="m">${MON[d.getMonth()]}</span>`;
    const cat=document.getElementById('eventModalCat');
    if(cat) cat.textContent=(e.date===todayISO?"IDAG · ":"")+eventCatLabel(e.cat);
    const title=document.getElementById('eventModalTitle');
    if(title) title.textContent=e.title;
    const meta=document.getElementById('eventModalMeta');
    if(meta){
      meta.innerHTML=`
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="11" r="2" stroke="currentColor" stroke-width="2"/></svg>${escHtml(e.host)}${hostPlace&&hostPlace.short?" · "+escHtml(hostPlace.short):""}</span>
        <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2"/><path d="M12 8v4l2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>${escHtml(e.when||e.time||e.date)}</span>
        ${e.time&&e.when&&e.time!==e.when?`<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Klockslag: ${escHtml(e.time)}</span>`:""}`;
    }
    const note=document.getElementById('eventModalNote');
    if(note){
      note.textContent=e.note||"";
      note.hidden=!e.note;
    }
    const body=document.getElementById('eventModalBody');
    if(body){
      body.innerHTML=rich?.body||"";
      body.hidden=!rich?.body;
    }
    const actions=document.getElementById('eventModalActions');
    if(actions){
      actions.innerHTML=`
        <button type="button" class="btn-primary" data-remind onclick="openRemindChooser(event,'${eventKeyAttr(e)}')">Påminn mig</button>
        ${eventHostActionHTML(e)}`;
    }
    if(modal){
      modal.hidden=false;
      modal.classList.add('on');
      document.body.style.overflow="hidden";
      modal.querySelector('.em-close')?.focus();
    }
    trackEvent('event-open', e.title);
  }
  function closeEventModal(){
    const modal=document.getElementById('eventModal');
    if(!modal) return;
    modal.classList.remove('on');
    modal.hidden=true;
    document.body.style.overflow="";
    eventModalKey=null;
  }
  document.getElementById('eventModal')?.addEventListener('click',(ev)=>{
    if(ev.target.id==='eventModal') closeEventModal();
  });
  // Calendar reminder (.ics + Google Calendar) — client-side only
  let remindEventRef=null;
  function findEventByKey(key){
    const [title,date]=String(key||"").split("||");
    return liveEvents.find(ev=>ev.title===title && ev.date===date) || events.find(ev=>ev.title===title && ev.date===date) || null;
  }
  function parseEventBounds(e){
    const m=String(e.time||"").match(/(\d{1,2}):(\d{2})\s*[–\-—]\s*(\d{1,2}):(\d{2})/);
    const sh=m?String(m[1]).padStart(2,"0"):"10";
    const sm=m?m[2]:"00";
    const eh=m?String(m[3]).padStart(2,"0"):"12";
    const em=m?m[4]:"00";
    const startLocal=`${e.date.replace(/-/g,"")}T${sh}${sm}00`;
    const endLocal=`${e.date.replace(/-/g,"")}T${eh}${em}00`;
    return {startLocal,endLocal};
  }
  function icsEscape(s){
    return String(s||"").replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
  }
  function buildIcs(e){
    const {startLocal,endLocal}=parseEventBounds(e);
    const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
    const uid=`${e.date}-${e.title}`.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"@upptack-vallentuna";
    const desc=[e.note||"",e.when?`Tid: ${e.when}`:"",`Värd: ${e.host}`,"— Upptäck Vallentuna"].filter(Boolean).join("\n");
    return [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Upptack Vallentuna//SV","CALSCALE:GREGORIAN","METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:"+uid,
      "DTSTAMP:"+stamp,
      "DTSTART;TZID=Europe/Stockholm:"+startLocal,
      "DTEND;TZID=Europe/Stockholm:"+endLocal,
      "SUMMARY:"+icsEscape(e.title),
      "LOCATION:"+icsEscape(e.host+", Vallentuna"),
      "DESCRIPTION:"+icsEscape(desc),
      "END:VEVENT","END:VCALENDAR"
    ].join("\r\n");
  }
  function googleCalUrl(e){
    const {startLocal,endLocal}=parseEventBounds(e);
    const params=new URLSearchParams({
      action:"TEMPLATE",
      text:e.title,
      dates:`${startLocal}/${endLocal}`,
      details:[e.note||"",e.when?`Tid: ${e.when}`:"","— Upptäck Vallentuna"].filter(Boolean).join("\n"),
      location:e.host+", Vallentuna"
    });
    return "https://calendar.google.com/calendar/render?"+params.toString();
  }
  function downloadIcs(e){
    const blob=new Blob([buildIcs(e)],{type:"text/calendar;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=(e.title||"event").toLowerCase().replace(/[^a-z0-9åäö]+/gi,"-").replace(/^-|-$/g,"")+".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function closeRemindChooser(){
    const pop=document.getElementById('remindPop');
    if(!pop) return;
    pop.classList.remove('on');
    pop.hidden=true;
    remindEventRef=null;
  }
  function openRemindChooser(domEvent,key){
    if(domEvent){
      domEvent.preventDefault?.();
      domEvent.stopPropagation?.();
    }
    const e=findEventByKey(key); if(!e) return;
    remindEventRef=e;
    trackEvent('reminder', e.title);
    const pop=document.getElementById('remindPop'); if(!pop) return;
    const g=document.getElementById('remindGcal');
    if(g) g.href=googleCalUrl(e);
    pop.hidden=false;
    pop.classList.add('on');
    const anchor=domEvent?.currentTarget;
    const r=anchor?.getBoundingClientRect?.() || {left:16,bottom:window.innerHeight/2,top:window.innerHeight/2};
    const pw=Math.min(260, window.innerWidth-24), ph=130;
    let left=Math.min(window.innerWidth-pw-12, Math.max(12, r.left));
    let top=r.bottom+8;
    if(top+ph>window.innerHeight-12) top=Math.max(12, r.top-ph-8);
    pop.style.left=left+"px";
    pop.style.top=top+"px";
    pop.style.width=pw+"px";
  }
  document.getElementById('remindIcs')?.addEventListener('click',()=>{
    if(remindEventRef) downloadIcs(remindEventRef);
    closeRemindChooser();
  });
  document.getElementById('remindGcal')?.addEventListener('click',()=>setTimeout(closeRemindChooser,80));
  document.addEventListener('click',(ev)=>{
    const pop=document.getElementById('remindPop');
    if(!pop||!pop.classList.contains('on')) return;
    if(pop.contains(ev.target)||ev.target.closest?.('[data-remind]')) return;
    closeRemindChooser();
  });
  document.addEventListener('keydown',(ev)=>{
    if(ev.key!=='Escape') return;
    const pop=document.getElementById('remindPop');
    if(pop?.classList.contains('on')){ closeRemindChooser(); return; }
    closeEventModal();
  });

  // Hero image carousel — first slide is in HTML + preload; rest after idle
  const HERO_FALLBACK="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1800&q=80";
  const heroImages=[
    "/assets/hero/1.webp",
    "/assets/hero/2.webp",
    "/assets/hero/3.webp",
    "/assets/hero/4.webp"
  ];
  function bootHeroCarousel(){
    const host=document.getElementById('heroSlides'); if(!host) return;
    const urls=heroImages.map(u=>(u&&String(u).trim())?u:HERO_FALLBACK);
    // Ensure LCP slide exists without wiping a server-rendered first frame
    if(!host.querySelector('.hero-slide')){
      host.innerHTML=`<div class="hero-slide on" style="background-image:url('${urls[0]}')"></div>`;
    }
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const allSame=urls.every(u=>u===urls[0]);
    if(reduce||allSame||urls.length<2) return;
    const startRotate=()=>{
      if(host.querySelectorAll('.hero-slide').length<2){
        urls.slice(1).forEach(u=>{
          const d=document.createElement('div');
          d.className='hero-slide';
          d.style.backgroundImage=`url('${u}')`;
          host.appendChild(d);
        });
      }
      let i=0;
      setInterval(()=>{
        const slides=host.querySelectorAll(".hero-slide");
        if(!slides.length) return;
        slides[i].classList.remove("on");
        i=(i+1)%slides.length;
        slides[i].classList.add("on");
      },5600);
    };
    if('requestIdleCallback' in window) requestIdleCallback(startRotate,{timeout:2500});
    else setTimeout(startRotate,1800);
  }
  bootHeroCarousel();

  function daysUntil(dateISO){
    const a=new Date(todayISO+"T12:00:00");
    const b=new Date(dateISO+"T12:00:00");
    return Math.round((b-a)/(1000*60*60*24));
  }
  function eventFeatureHTML(e){
    const key=eventKeyAttr(e);
    const tm=(e.time||e.when||"").match(/(\d{1,2}:\d{2})/);
    const when=e.date===todayISO
      ? (tm ? `Idag kl. ${tm[1]}` : "Idag")
      : (e.when||e.date);
    return `<article class="ev-feature" onclick="openEvent('${key}')" role="button" tabindex="0"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openEvent('${key}')}">
      <div class="im" style="background-image:url('${e.img}')" role="img" aria-hidden="true"></div>
      <div class="shade"></div>
      <div class="bd">
        <div class="when">${when} · ${eventCatLabel(e.cat)}</div>
        <h3>${e.title}</h3>
        <div class="meta">${e.host||""}${e.note?" — "+e.note:""}</div>
      </div>
    </article>`;
  }
  /** Homepage events live in todayBrief — keep helper for featured pool only. */
  function happenHomePool(limit=4){
    const pool=[];
    const seen=new Set();
    for(const e of [...eventsToday, ...liveEvents]){
      const k=e.title+"|"+e.date;
      if(seen.has(k)) continue;
      seen.add(k);
      pool.push(e);
      if(pool.length>=limit) break;
    }
    // If we cut mid-day, pull remaining same-date siblings so co-events (e.g. Smaka + Naturen) both show
    if(pool.length>=limit){
      const lastDate=pool[pool.length-1].date;
      const cap=limit+2;
      for(const e of liveEvents){
        if(e.date!==lastDate) continue;
        const k=e.title+"|"+e.date;
        if(seen.has(k)) continue;
        seen.add(k);
        pool.push(e);
        if(pool.length>=cap) break;
      }
    }
    return pool;
  }
  function renderHappenHome(){ /* merged into renderTodayBrief */ }

  const WEATHER_ICONS={sun:"☀️",cloud:"☁️",part:"⛅",rain:"🌧️",snow:"❄️",fog:"🌫️",storm:"⛈️"};
  function weatherKind(code){
    if(code===0)return{k:"sun",t:"Soligt"};
    if([1,2].includes(code))return{k:"part",t:"Växlande moln"};
    if(code===3)return{k:"cloud",t:"Mulet"};
    if([45,48].includes(code))return{k:"fog",t:"Dimma"};
    if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return{k:"rain",t:"Regn"};
    if([71,73,75,77,85,86].includes(code))return{k:"snow",t:"Snö"};
    if([95,96,99].includes(code))return{k:"storm",t:"Åska"};
    return{k:"cloud",t:"Blandat"};
  }
  function weatherMood(code,temp){
    const rainy=[51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(code);
    const cold=temp!=null&&temp<8;
    if(rainy||cold)return "rough";
    // "Nice" = riktigt fint uteväder — 15° + växlande moln är mild, inte badväder
    if(code<=2 && temp!=null && temp>=18)return "nice";
    return "mild";
  }
  function statusPill(p){
    // Alltid-öppna utomhusplatser (kyrka, runsten, natur) är inte "öppet nu" som en butik
    if(!isTimedVenue(p)){
      if(isOpen(p)) return `<span class="status-pill open">Alltid tillgänglig</span>`;
      return "";
    }
    if(isOpen(p)){
      const m=minutesUntilClose(p);
      if(m!==Infinity && m<=75) return `<span class="status-pill soon">Stänger om ${m} min</span>`;
      return `<span class="status-pill open">Öppet nu</span>`;
    }
    const meta=metaOf(p);
    if(meta.hours && meta.hours.every(h=>!h) && meta.seasonNote){
      const book=/bokas|förfrågan|överenskommelse/i.test(meta.seasonNote);
      return `<span class="status-pill closed">${book?"Bokas":"Efter överenskommelse"}</span>`;
    }
    return `<span class="status-pill closed">Stängt</span>`;
  }
  function pickToday(){
    return rankedPlaces().filter(x=>x.open||x.score>10).slice(0,4).map(x=>x.p);
  }
  function renderScoreRow(){ /* merged into renderPicks */ }
  const WEATHER_SVG={
    sun:`<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="#e0a020" stroke-width="1.7"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" stroke="#e0a020" stroke-width="1.7" stroke-linecap="round"/></svg>`,
    part:`<svg viewBox="0 0 24 24" fill="none"><circle cx="9.5" cy="10" r="3.2" stroke="#e0a020" stroke-width="1.5"/><path d="M9.5 3.8V5.5M3.8 10H5.5M5.2 5.2l1.2 1.2" stroke="#e0a020" stroke-width="1.5" stroke-linecap="round"/><path d="M8.5 16.5h8.2a3.2 3.2 0 1 0-.6-6.3 4.2 4.2 0 0 0-7.8 1.4A2.7 2.7 0 0 0 8.5 16.5z" stroke="#6b7280" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    cloud:`<svg viewBox="0 0 24 24" fill="none"><path d="M7.5 17h9a3.5 3.5 0 1 0-.7-6.9 4.5 4.5 0 0 0-8.5 1.6A3 3 0 0 0 7.5 17z" stroke="#6b7280" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    rain:`<svg viewBox="0 0 24 24" fill="none"><path d="M7.5 14.5h9a3.5 3.5 0 1 0-.7-6.9 4.5 4.5 0 0 0-8.5 1.6A3 3 0 0 0 7.5 14.5z" stroke="#5b7c99" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 17.5 8 20M12.5 17.5 11.5 20M16 17.5 15 20" stroke="#5b7c99" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    snow:`<svg viewBox="0 0 24 24" fill="none"><path d="M7.5 14h9a3.5 3.5 0 1 0-.7-6.9 4.5 4.5 0 0 0-8.5 1.6A3 3 0 0 0 7.5 14z" stroke="#7a8fa6" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.5 17v3M12.5 17v3M15.5 17v3M9.5 18.5h2M13.5 18.5h2" stroke="#7a8fa6" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    fog:`<svg viewBox="0 0 24 24" fill="none"><path d="M4 10h16M5 13.5h14M7 17h10" stroke="#8a8270" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    storm:`<svg viewBox="0 0 24 24" fill="none"><path d="M7.5 13.5h9a3.5 3.5 0 1 0-.7-6.9 4.5 4.5 0 0 0-8.5 1.6A3 3 0 0 0 7.5 13.5z" stroke="#5b6070" stroke-width="1.6" stroke-linejoin="round"/><path d="m12 14.5-2 4h3l-1.5 3.5" stroke="#e0a020" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  };
  const SEASON_ICO={
    berry:`<svg viewBox="0 0 24 24" fill="none"><path d="M12 20c0-4 3-7 3-11a3 3 0 1 0-6 0c0 4 3 7 3 11z" fill="#c23b3b"/><path d="M12 9c-1.2-2.2-3.5-3.2-5-3.4.8 2.2 2.4 3.4 5 3.4 2.6 0 4.2-1.2 5-3.4-1.5.2-3.8 1.2-5 3.4z" fill="#3d6b32"/></svg>`,
    leaf:`<svg viewBox="0 0 24 24" fill="none"><path d="M5 19c6-1 11-6 13-13-7 2-12 7-13 13z" stroke="#3d6b32" stroke-width="1.6" fill="rgba(61,107,50,.12)"/><path d="M6 18c4-4 8-7 12-9" stroke="#3d6b32" stroke-width="1.4" stroke-linecap="round"/></svg>`,
    stalk:`<svg viewBox="0 0 24 24" fill="none"><path d="M12 21V8" stroke="#3d6b32" stroke-width="1.6" stroke-linecap="round"/><path d="M12 10c-3-2-5-2.5-7-2 1.5 2.5 4 4 7 4.5 3-.5 5.5-2 7-4.5-2 .5-4 1-7 2z" fill="#c8912f" stroke="#a85a3a" stroke-width="1"/></svg>`
  };
  let heroSeasonAction=null;
  let heroEventKey=null;
  function refreshPulse(){ refreshHeroToday(); }
  function refreshHeroToday(){
    const openN=openVenueCount();
    const elOpen=document.getElementById('pulseOpen');
    const elMsg=document.getElementById('pulseMsg');
    if(elOpen) elOpen.textContent=openN?`${openN} ställen öppna`:"Få ställen öppna";
    if(elMsg) elMsg.textContent=openN?"med öppettider just nu":"kolla öppettider";

    const ev=eventsToday[0]||liveEvents[0]||null;
    const evTitle=document.getElementById('heroEventTitle');
    const evSub=document.getElementById('heroEventSub');
    const evRow=document.getElementById('heroEventRow');
    if(ev){
      heroEventKey=eventKeyAttr(ev);
      if(evTitle) evTitle.textContent=ev.title;
      if(evSub){
        if(ev.date===todayISO){
          const t=(ev.time||ev.when||"").match(/(\d{1,2}:\d{2})/);
          evSub.textContent=t?`idag kl. ${t[1]}`:(ev.when||"idag");
        } else {
          const n=daysUntil(ev.date);
          evSub.textContent=n===1?"imorgon":(ev.when||`om ${n} dagar`);
        }
      }
      if(evRow) evRow.hidden=false;
    } else {
      heroEventKey=null;
      if(evTitle) evTitle.textContent="Inga evenemang just nu";
      if(evSub) evSub.textContent="Se kalendern";
    }

    const season=seasonCards()[0];
    const sTitle=document.getElementById('heroSeasonTitle');
    const sSub=document.getElementById('heroSeasonSub');
    const sIco=document.getElementById('heroSeasonIco');
    if(season){
      if(sTitle) sTitle.textContent=season.title.includes("i säsong")||/jordgubbar|ägg|skörd|svamp|rabarber/i.test(season.title)
        ? (season.title.toLowerCase().includes("jordgubb")?"Jordgubbar i säsong":season.title)
        : season.title;
      if(sSub){
        if(/jordgubb/i.test(season.title)) sSub.textContent="hos gårdsbutikerna";
        else if(season.type==="gard") sSub.textContent="hos gårdsbutikerna";
        else if(season.type==="natur") sSub.textContent="i naturen runt knuten";
        else if(season.type==="fika") sSub.textContent="hos bygdens fik";
        else sSub.textContent=season.text.split("—")[0].trim().slice(0,42);
      }
      if(sIco) sIco.innerHTML=SEASON_ICO[season.bot]||SEASON_ICO.berry;
      heroSeasonAction=()=>{
        if(season.type==="hander") showView('hander');
        else if(CATEGORIES[season.type]) openCategory(season.type);
        else filterAndMap(season.type);
      };
    }
  }
  function heroTodayOpenEvent(){
    if(heroEventKey) openEvent(heroEventKey);
    else showView('hander');
  }
  function heroTodayOpenSeason(){
    if(typeof heroSeasonAction==="function") heroSeasonAction();
    else openCategory('gard');
  }
  function heroTodaySeeMore(){
    const el=document.getElementById('todayBrief')||document.getElementById('picksHeading');
    if(el){
      showView('start');
      setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),50);
    } else openCategory('attgora');
  }

  function heroSubmitSearch(ev){
    ev?.preventDefault?.();
    const q=(document.getElementById("heroSearch")?.value||"").trim();
    heroGoSearch(q);
    return false;
  }
  function heroGoSearch(q, filterKey){
    searchFilters.clear();
    if(filterKey) searchFilters.add(filterKey);
    const input=document.getElementById("globalSearch");
    if(input) input.value=q||"";
    showView("sok");
    initSearchUI();
    runSearch();
    setTimeout(()=>document.getElementById("globalSearch")?.focus(), 60);
  }

  function isoPlusDays(n){
    const d=new Date(todayISO+"T12:00:00");
    d.setDate(d.getDate()+n);
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), dd=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dd}`;
  }
  function weekendEndISO(){
    if(day===0) return todayISO;
    if(day===6) return isoPlusDays(1);
    if(day===5) return isoPlusDays(2);
    return isoPlusDays(7-day);
  }
  function isWeekendWindow(){ return day===5||day===6||day===0; }

  function todayBriefEventBundle(){
    if(eventsToday.length) return {mode:"today", list:eventsToday.slice(0,2)};
    if(isWeekendWindow()){
      const end=weekendEndISO();
      const list=liveEvents.filter(e=>e.date<=end).slice(0,2);
      if(list.length) return {mode:"weekend", list};
    }
    const list=liveEvents.slice(0,2);
    return {mode:list.length?"soon":"empty", list};
  }
  function eventWhenShort(e){
    const tm=(e.time||e.when||"").match(/(\d{1,2}:\d{2})/);
    if(e.date===todayISO) return tm?`Idag kl. ${tm[1]}`:"Idag";
    const n=daysUntil(e.date);
    if(n===1) return tm?`Imorgon kl. ${tm[1]}`:"Imorgon";
    return e.when||e.date;
  }
  function happenScrollHTML(inner, ariaLabel){
    const allTile=`<button type="button" class="happen-more-all" onclick="showView('hander')">
      <span class="happen-more-all-label">Se alla evenemang</span>
      <span class="happen-more-all-arrow" aria-hidden="true">→</span>
    </button>`;
    return `<div class="happen-scroll is-start">
      <div class="happen-more" role="region" aria-label="${escHtml(ariaLabel||"Fler evenemang")}">${inner}${allTile}</div>
      <div class="happen-scroll-fade happen-scroll-fade-start" aria-hidden="true"></div>
      <div class="happen-scroll-fade happen-scroll-fade-end" aria-hidden="true"></div>
      <button type="button" class="happen-scroll-prev" aria-label="Föregående evenemang">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button type="button" class="happen-scroll-next" aria-label="Nästa evenemang">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <p class="happen-scroll-hint">Fler evenemang — scrolla eller använd pilarna</p>
    </div>`;
  }
  function wireHappenScroll(scope){
    const wrap=scope?.querySelector?.(".happen-scroll");
    const scroller=wrap?.querySelector?.(".happen-more");
    const prev=wrap?.querySelector?.(".happen-scroll-prev");
    const next=wrap?.querySelector?.(".happen-scroll-next");
    if(!wrap||!scroller) return;
    const cardCount=[...scroller.children].filter(el=>el.classList?.contains("ev")).length;
    const step=()=>Math.max(220, Math.round(scroller.clientWidth*0.72));
    let startLeft=null;
    const sync=()=>{
      // ≤4 kort: fyll raden. Fler → horisontell scroll + pilar/fade.
      const wantFill=cardCount>0 && cardCount<=4;
      wrap.classList.toggle("is-fill", wantFill);
      const max=scroller.scrollWidth-scroller.clientWidth;
      const overflow=max>8;
      if(wantFill && overflow){
        // Smal viewport: ge upp fill, behåll scroll + pil
        wrap.classList.remove("is-fill");
      }
      const max2=scroller.scrollWidth-scroller.clientWidth;
      const overflow2=max2>8;
      // Snap/padding can leave a small non-zero rest offset — track the true start.
      if(startLeft==null) startLeft=scroller.scrollLeft;
      startLeft=Math.min(startLeft, scroller.scrollLeft);
      const atStart=scroller.scrollLeft<=startLeft+8;
      const atEnd=!overflow2 || scroller.scrollLeft>=max2-8;
      wrap.classList.toggle("is-overflow", overflow2);
      wrap.classList.toggle("is-start", atStart);
      wrap.classList.toggle("is-end", atEnd);
    };
    prev?.addEventListener("click",()=>{
      scroller.scrollBy({left:-step(), behavior:"smooth"});
    });
    next?.addEventListener("click",()=>{
      scroller.scrollBy({left:step(), behavior:"smooth"});
    });
    scroller.addEventListener("scroll", sync, {passive:true});
    window.addEventListener("resize", sync, {passive:true});
    requestAnimationFrame(()=>{
      scroller.scrollLeft=0;
      requestAnimationFrame(sync);
    });
  }
  function todayBriefItem(thumb, name, sub, onclick){
    return `<button type="button" class="tc-item" onclick="${onclick}">
      <span class="tc-thumb" style="background-image:url('${thumb}')" aria-hidden="true"></span>
      <span>
        <span class="tc-name">${name}</span>
        <span class="tc-sub">${sub}</span>
      </span>
    </button>`;
  }
  function renderTodayBrief(){
    const grid=document.getElementById('todayBriefGrid');
    const featureEl=document.getElementById('todayBriefFeature');
    if(!grid) return;

    const titleEl=document.getElementById('todayBriefTitle');
    const metaEl=document.getElementById('todayBriefMeta');
    const weekend=isWeekendWindow();
    if(titleEl) titleEl.textContent=weekend?`Helgen i ${K}`:`Händer i ${K}`;

    const openRanked=rankedPlaces().filter(x=>x.open && isTimedVenue(x.p)).slice(0,3);
    const openN=openVenueCount();
    if(metaEl){
      const bits=[];
      if(ctx.temp!=null){
        const wk=ctx.code!=null?weatherKind(ctx.code):null;
        bits.push(`${ctx.temp}°${wk?.t?" · "+wk.t:""}`);
      }
      bits.push(openN?`${openN} ställen öppna`:"Kolla öppettider");
      if(eventsToday.length) bits.push(eventsToday.length===1?"1 event idag":`${eventsToday.length} event idag`);
      else if(recurringTodayList.length) bits.push(recurringTodayList.length===1?"1 återkommande idag":`${recurringTodayList.length} återkommande idag`);
      else if(weekend && liveEvents.length) bits.push("Se helgens program");
      metaEl.textContent=bits.join(" · ");
    }

    // Featured + fler: hämta mer än 4 så scroll/pil kan kicka in när det finns
    const pool=happenHomePool(9);
    if(featureEl){
      if(pool.length){
        const [feat, ...rest]=pool;
        const more=rest.map(e=>eventCard(e,true)).join("");
        featureEl.innerHTML=eventFeatureHTML(feat)+(more?happenScrollHTML(more,"Fler evenemang"):"");
        featureEl.hidden=false;
        if(more) wireHappenScroll(featureEl);
      } else if(recurringTodayList.length){
        const more=recurringTodayList.slice(0,2).map(r=>`
          <article class="ev compact" onclick="showView('hander')" role="button" tabindex="0">
            <div class="media"><div class="thumb" style="background-image:url('${r.img}')"></div></div>
            <div class="bd">
              <div class="when">${escHtml(recurringWhenLine(r))}</div>
              <h3>${escHtml(r.title)}</h3>
              <p class="meta">Återkommande · varje vecka</p>
            </div>
          </article>`).join("");
        featureEl.innerHTML=happenScrollHTML(more,"Återkommande aktiviteter");
        featureEl.hidden=false;
        wireHappenScroll(featureEl);
      } else {
        featureEl.innerHTML=`<p class="tc-empty" style="margin:0 0 4px">Inga inplanerade evenemang just nu — kika in snart igen.</p>`;
        featureEl.hidden=false;
      }
    }

    let openBody="";
    if(openRanked.length){
      openBody=`<div class="tc-list">${openRanked.map(({p,reasons,mins})=>{
        const sub=mins!==Infinity&&mins<=75?`Stänger om ${mins} min`
          :(p.short||reasons.find(r=>!/^Öppet|väder|Soligt|ute|Landskapet|utflykt|inomhus|Tak över|Innekos|Varm dryck/i.test(r))||p.cat);
        return todayBriefItem(p.img, escHtml(p.name), escHtml(sub), `openPlace('${jsEsc(p.name)}')`);
      }).join("")}</div>`;
    } else {
      openBody=`<p class="tc-empty">Få ställen har öppet i just den här stunden — planera med kartan eller kom tillbaka senare.</p>`;
    }
    // Single utility card — Passar vädret removed (often duplicated Öppet nu; events need the space)
    grid.innerHTML=`<article class="today-card today-card-open">
      <p class="tc-label">Öppet nu${openN?` · ${openN}`:""}</p>
      ${openBody}
      <button type="button" class="tc-foot" onclick="showOpenNowOnMap()">Visa på karta →</button>
    </article>`;
  }
  function showOpenNowOnMap(){
    openNowOnly=true;
    document.getElementById('chipOpenNow')?.classList.add('on');
    filterAndMap('alla');
  }
  /** Prefer different types; score = eligibility pool, order rotates by Stockholm day + weather. */
  function selectDiversePicks(count=3){
    const seed=picksRotationSeed({
      todayISO,
      daypart,
      mood:ctx.mood||"mild",
      weatherCode:ctx.code,
    });
    const ranked=prepareRankedForPicks(rankedPlaces(), ctx.mood||"mild", {
      hasTag:(p,t)=>hasTag(p,t),
      temp:ctx.temp,
      code:ctx.code,
    });
    return selectRotatedDiversePicks(ranked, {
      seed,
      count,
      preferOpenTimed:(x)=>x.open && isTimedVenue(x.p),
    });
  }
  function renderWeeklyFact(){
    const card=document.getElementById('weeklyFactCard');
    if(!card) return;
    const fact=currentFact(todayISO, facts);
    if(!fact){ card.innerHTML=""; return; }
    const sagen=isSagen(fact);
    const source=fact.source
      ?`<p class="weekly-fact-source">Källa: ${escHtml(fact.source)}</p>`
      :"";
    const media=fact.image
      ?`<img class="weekly-fact-art" src="${escHtml(fact.image)}" alt="" width="1024" height="682" decoding="async" loading="lazy" />`
      :`<div class="weekly-fact-ph">${sagen?"✦":"?"}</div>`;
    let cta="";
    if(fact.relatedPlace){
      const place=placeBySlug(fact.relatedPlace, places) || places.find(p=>(p.slug||placeSlug(p.name))===fact.relatedPlace);
      if(place){
        cta=`<button type="button" class="weekly-fact-cta" onclick="openPlace('${jsEsc(place.name)}')">Se ${escHtml(place.name)} →</button>`;
      }
    }
    if(!cta){
      cta=`<button type="button" class="weekly-fact-cta" onclick="document.getElementById('naraDig')?.scrollIntoView({behavior:'smooth',block:'start'})">Utforska bygden på kartan →</button>`;
    }
    card.innerHTML=`
      <div class="weekly-fact-copy">
        <div class="eyebrow">${sagen?"Enligt sägnen…":"Veckans Visste du att"}</div>
        <blockquote>${escHtml(fact.title)}</blockquote>
        ${sagen?`<p class="weekly-fact-sagen">Folktro — inte fastslagen historia.</p>`:""}
        <p>${escHtml(fact.longFact)}</p>
        ${source}
        ${cta}
      </div>
      <div class="weekly-fact-media" aria-hidden="true">${media}</div>`;
  }
  function renderPicks(){
    const grid=document.getElementById('picksGrid'); if(!grid) return;
    const wk=ctx.code!=null?weatherKind(ctx.code):null;
    const hot=isHotSwimWeather(ctx.temp, ctx.code);
    let picksWhy=picksWhyForWeather({
      mood:ctx.mood,
      temp:ctx.temp,
      weatherLabel:wk?.t,
      hot,
    });
    // Editorial voice — not a mirror of "öppet nu"
    if(!picksWhy){
      if(holidayToday) picksWhy=`Vår röst för ${holidayToday.toLowerCase()} — tre favoriter vi står bakom.`;
      else if(isWeekend) picksWhy="Redaktionens tre — favoriter för en fin sväng i bygden.";
      else if(daypart==="morgon") picksWhy="Redaktionens tre — ställen värda en morgonrunda.";
      else if(daypart==="lunch") picksWhy="Redaktionens tre — bra stopp mitt i dagen.";
      else if(ctx.temp!=null && wk) picksWhy=`Vår röst just nu — tre favoriter när det är ${wk.t.toLowerCase()}.`;
      else picksWhy="Redaktionens tre favoriter — inte bara det som råkar vara öppet.";
    } else {
      picksWhy=picksWhy.replace(/handplockat/gi,"vår röst").replace(/\.$/, "")+" — tre favoriter vi står bakom.";
    }
    S('picksWhy', picksWhy);

    const pool=selectDiversePicks(3);
    const feature=pool[0];
    const side=pool.slice(1,3);
    if(!feature){
      homeShownNames=new Set();
      grid.innerHTML="";
      refreshPulse();
      try{ renderTodayBrief(); }catch(e){}
      return;
    }
    homeShownNames=new Set(pool.map(x=>x.p.name));

    const nonStatus=r=>r && !/^(Öppet|Stänger|Planera kvällen|Kvällsläge)/.test(r);
    const weatherish=r=>/väder|Soligt|ute|Landskapet|utflykt|inomhus|Tak över|Innekos|Varm dryck|Helgläge|Passar morgonen|Bra till lunch|Passar eftermiddagen/i.test(r||"");
    const pickEyebrow=(scored)=>{
      if(scored.open && isTimedVenue(scored.p)) return typeLabel[scored.p.type]||scored.p.cat||"Favorit";
      const r=scored.reasons.find(x=>nonStatus(x) && !weatherish(x));
      return r||typeLabel[scored.p.type]||scored.p.cat||scored.p.short||"Vår favorit";
    };
    const pickSub=(scored)=>scored.p.short||scored.p.blurb||scored.p.cat;
    const featWhy=pickEyebrow(feature)+(feature.p._km!=null?" · "+fmtDist(feature.p._km):"");
    const featSub=pickSub(feature);
    const featHTML=`
      <article class="pick-feature" onclick="openPlace('${jsEsc(feature.p.name)}')" role="button" tabindex="0"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openPlace('${jsEsc(feature.p.name)}')}">
        <div class="im" style="background-image:url('${feature.p.img}')" role="img" aria-label="${feature.p.name}"></div>
        <div class="shade"></div>
        <div class="pick-status">${statusPill(feature.p)}</div>
        <div class="bd">
          <div class="why">${featWhy}</div>
          <h3>${feature.p.name}</h3>
          <p>${featSub}</p>
          ${tipsareCreditHTML(feature.p)}
        </div>
      </article>`;

    const sideHTML=side.map((scored)=>{
      const {p}=scored;
      const badges=[`<span class="badge">${typeLabel[p.type]||p.cat}</span>`];
      if(isNewPlace(p)) badges.push(`<span class="badge new">Nytt</span>`);
      if(p._km!=null && p._km<5) badges.push(`<span class="badge near">${fmtDist(p._km)}</span>`);
      const why=pickSub(scored);
      return `
      <article class="tcard" onclick="openPlace('${jsEsc(p.name)}')">
        <div class="im" style="background-image:url('${p.img}')"></div>
        <div class="shade"></div>
        <div class="badge-row">${badges.join("")}</div>
        <div class="bd">
          <h3>${p.name}</h3>
          <p>${why}</p>
          ${tipsareCreditHTML(p)}
        </div>
      </article>`;
    }).join("");

    // No manifesto quote board — Handplockat is the editorial voice itself
    grid.innerHTML=featHTML+`<div class="picks-row picks-row-solo">${sideHTML}</div>`;
    refreshPulse();
    try{ renderTodayBrief(); }catch(e){}
  }
  function renderToday(){ renderPicks(); renderWeeklyFact(); }
  function renderFavorites(){
    const grid=document.getElementById('favGrid');
    const lede=document.getElementById('favLede');
    if(!grid) return;
    normalizeFavorites();
    const entries=[...favorites].map(n=>{
      const p=places.find(x=>x.name===n);
      return p?{kind:"place",name:n,p}:{kind:"orphan",name:n};
    });
    const placesN=entries.filter(e=>e.kind==="place").map(e=>e.p);
    const openN=placesN.filter(isOpen).length;
    if(lede) lede.textContent=entries.length
      ? `${entries.length} sparade${placesN.length?` · ${openN} öppna just nu`:""}`
      : "Spara ställen du vill återvända till — vi visar vilka som är öppna just nu.";
    if(!entries.length){
      grid.innerHTML=`<div class="ev-empty" style="grid-column:1/-1">Inga favoriter ännu. Tryck på hjärtat på ett evenemang eller spara från en platssida.</div>`;
      return;
    }
    grid.innerHTML=entries.map(e=>{
      if(e.kind==="place"){
        const p=e.p;
        return `<article class="fav-card" onclick="openPlace('${jsEsc(p.name)}')">
        <div class="im" style="background-image:url('${p.img}')"></div>
        <div class="bd">
          <h3>${escHtml(p.name)}</h3>
          <div class="meta">${escHtml(p.cat)} · ${openLabelShort(p)}${p._km!=null?" · "+fmtDist(p._km):""}</div>
          <button type="button" class="fav-remove" onclick="event.stopPropagation();removeFavorite('${jsEsc(p.name)}')">Ta bort</button>
        </div>
      </article>`;
      }
      return `<article class="fav-card fav-card-orphan">
        <div class="bd" style="grid-column:1/-1">
          <h3>${escHtml(e.name)}</h3>
          <div class="meta">Sparad från evenemang · finns inte som plats i guiden</div>
          <button type="button" class="fav-remove" onclick="removeFavorite('${jsEsc(e.name)}')">Ta bort</button>
        </div>
      </article>`;
    }).join('');
  }
  try{ renderToday(); }catch(e){ console.warn('renderToday', e); }
  try{ renderFavorites(); }catch(e){ console.warn('renderFavorites', e); }

  // ============================================================
  //  SÖK · RUTTER · LISTOR · NOTISER · EVENT · RAPPORT
  // ============================================================
  function toggleSearchFilter(key){
    if(searchFilters.has(key)) searchFilters.delete(key); else searchFilters.add(key);
    runSearch();
  }
  function initSearchUI(){
    const row=document.getElementById('searchFilters');
    if(!row) return;
    row.innerHTML=SEARCH_FILTERS.map(f=>`
      <button type="button" class="chip ${searchFilters.has(f.key)?'on':''}" data-key="${f.key}" onclick="toggleSearchFilter('${f.key}')">${f.label}</button>`).join('');
  }
  function searchQuery(){
    return (document.getElementById('globalSearch')?.value||"").trim();
  }
  function placeMatchesSearch(p){
    for(const f of searchFilters){
      if(f==="open" && !isOpen(p)) return false;
      if(f!=="open" && !hasTag(p,f)) return false;
    }
    const q=searchQuery();
    if(!q) return true;
    const m=metaOf(p);
    const extras={
      district:m.district,
      tags:(m.tags||[]).join(" "),
      address:CONTENT[p.name]?.address||"",
    };
    return matchesPrimaryOrSecondary(
      placeSearchPrimary(p, extras),
      placeSearchSecondary(p, extras),
      q
    );
  }
  function eventMatchesSearch(e){
    const q=searchQuery();
    if(!q) return false; // evenemang bara vid fritext — annars drunknar listan
    return matchesPrimaryOrSecondary(eventSearchPrimary(e), eventSearchSecondary(e), q);
  }
  function recurringMatchesSearch(r){
    const q=searchQuery();
    if(!q) return false;
    return matchesPrimaryOrSecondary(recurringSearchPrimary(r), recurringSearchSecondary(r), q);
  }
  function producerMatchesSearch(pr){
    const q=searchQuery();
    if(!q) return false; // som evenemang: bara vid fritext
    return matchesPrimaryOrSecondary(producerSearchPrimary(pr), producerSearchSecondary(pr), q);
  }
  function searchEventRowHTML(e){
    const d=new Date(e.date+"T12:00:00");
    const whenShort=`${d.getDate()} ${MON[d.getMonth()]}`;
    return `<article class="s-item" onclick="openEvent('${eventKeyAttr(e)}')">
      <div class="im" style="background-image:url('${e.img||""}')"></div>
      <div>
        <h3>${escHtml(e.title)}</h3>
        <div class="meta">${escHtml(e.host)} · ${escHtml(e.when||e.time||"")}</div>
        <div class="tags"><span class="tag">Evenemang</span><span class="tag">${escHtml(eventCatLabel(e.cat))}</span></div>
      </div>
      <div class="travel">${escHtml(whenShort)}<br>${escHtml(DOW[d.getDay()])}</div>
    </article>`;
  }
  function searchRecurringRowHTML(r){
    const place=resolvePlaceRef(r.place, places);
    const when=recurringWhenLine(r);
    const go=place
      ? `openPlace('${jsEsc(place.name)}')`
      : `showView('hander')`;
    return `<article class="s-item" onclick="${go}">
      <div class="im" style="background-image:url('${r.img||""}')"></div>
      <div>
        <h3>${escHtml(r.title)}</h3>
        <div class="meta">${escHtml(place?.name||r.place||r.host||"")} · ${escHtml(when)}</div>
        <div class="tags"><span class="tag">Varje vecka</span></div>
      </div>
      <div class="travel">↻</div>
    </article>`;
  }
  function searchPlaceRowHTML(p){
    const tags=placeTags(p).slice(0,4).map(t=>`<span class="tag">${TAG_LABEL[t]||t}</span>`).join("");
    const t=travelEstimate(p);
    const travel=t
      ?`${fmtDist(t.km)}<br>Bil ${t.car} min<br>Cykel ${t.bike} min<br>SL ${t.sl} min`
      :"Bokas<br>Ingen fast adress";
    return `<article class="s-item" onclick="openPlace('${jsEsc(p.name)}')">
      <div class="im" style="background-image:url('${p.img}')"></div>
      <div>
        <h3>${escHtml(p.name)}</h3>
        <div class="meta">${escHtml(p.cat)}${metaOf(p).district?" · "+escHtml(metaOf(p).district):""} · ${openLabelShort(p)}</div>
        <div class="tags"><span class="tag">Plats</span>${tags}</div>
      </div>
      <div class="travel">${travel}</div>
    </article>`;
  }
  function searchProducerRowHTML(pr){
    return `<article class="s-item" onclick="openProducer('${jsEsc(producerSlug(pr))}')">
      <div class="im" style="background-image:url('${pr.img||""}')"></div>
      <div>
        <h3>${escHtml(pr.name)}</h3>
        <div class="meta">${escHtml(pr.cat||"Producent")} · Ingen egen butiksadress</div>
        <div class="tags"><span class="tag">Producent</span></div>
      </div>
      <div class="travel">→</div>
    </article>`;
  }
  function runSearch(){
    initSearchUI();
    const box=document.getElementById('searchResults'); if(!box) return;
    const q=searchQuery();
    const placeHits=places.filter(placeMatchesSearch).map(p=>{
      const t=travelEstimate(p);
      p._km=t?t.km:null;
      return p;
    }).sort((a,b)=>{
      // Unmappable (bokas) after distance-sorted hits
      const ak=a._km!=null?a._km:1e9;
      const bk=b._km!=null?b._km:1e9;
      return ak-bk;
    });
    // Place-only filters (öppet nu, barn…) apply to places; events/producers match fritext only.
    const eventHits=q ? liveEvents.filter(eventMatchesSearch) : [];
    const recurringHits=q ? recurring.filter(recurringMatchesSearch) : [];
    const producerHits=q ? producers.filter(producerMatchesSearch) : [];
    if(!placeHits.length && !eventHits.length && !recurringHits.length && !producerHits.length){
      box.innerHTML=`<div class="ev-empty">Inga träffar — prova ett annat ord eller färre filter.</div>`;
      return;
    }
    const parts=[];
    // With a query: places first (name hits like "bad" → Kvarnbadet beat note-mentions in events).
    if(q){
      if(placeHits.length){
        parts.push(`<p class="search-group">Platser <span>${placeHits.length}</span></p>`);
        parts.push(...placeHits.map(searchPlaceRowHTML));
      }
      if(eventHits.length){
        parts.push(`<p class="search-group">Evenemang <span>${eventHits.length}</span></p>`);
        parts.push(...eventHits.map(searchEventRowHTML));
      }
      if(recurringHits.length){
        parts.push(`<p class="search-group">Återkommande <span>${recurringHits.length}</span></p>`);
        parts.push(...recurringHits.map(searchRecurringRowHTML));
      }
      if(producerHits.length){
        parts.push(`<p class="search-group">Producenter <span>${producerHits.length}</span></p>`);
        parts.push(...producerHits.map(searchProducerRowHTML));
      }
    } else {
      if(eventHits.length){
        parts.push(`<p class="search-group">Evenemang <span>${eventHits.length}</span></p>`);
        parts.push(...eventHits.map(searchEventRowHTML));
      }
      if(recurringHits.length){
        parts.push(`<p class="search-group">Återkommande <span>${recurringHits.length}</span></p>`);
        parts.push(...recurringHits.map(searchRecurringRowHTML));
      }
      if(placeHits.length){
        parts.push(...placeHits.map(searchPlaceRowHTML));
      }
      if(producerHits.length){
        parts.push(`<p class="search-group">Producenter <span>${producerHits.length}</span></p>`);
        parts.push(...producerHits.map(searchProducerRowHTML));
      }
    }
    box.innerHTML=parts.join("");
  }

  function pickBest(type,except=new Set(),{preferOpen=true}={}){
    const scored=places
      .filter(p=>placeHasType(p,type))
      .map(p=>{
        let s=scorePlace(p).score+(hasTag(p,"barn")?2:0);
        if(preferOpen && isOpen(p)) s+=12;
        // Timed venues that are closed get pushed down so afternoon routes stay usable
        if(preferOpen && isTimedVenue(p) && !isOpen(p)) s-=20;
        return {p,s};
      })
      .sort((a,b)=>b.s-a.s);
    const fresh=scored.filter(x=>!except.has(x.p.name));
    return fresh.length?fresh:scored;
  }
  function pickFromPool(pool, offset){
    if(!pool.length) return null;
    // Prefer first open timed (or always-available) stop from rotated window
    const rotated=[...pool.slice(offset%pool.length), ...pool.slice(0, offset%pool.length)];
    const openHit=rotated.find(x=>!isTimedVenue(x.p) || isOpen(x.p));
    return (openHit||rotated[0])?.p || null;
  }
  /** Daily base so first load isn't locked on the top-scoring fika (e.g. Konditoriet). */
  function routeDayOffset(){
    return hashStr(`route|${todayISO}|${daypart}|${ctx.mood||"mild"}|${ctx.code??""}`);
  }
  function buildRoute(){
    const base=routeDayOffset()+routeSeed;
    const except=new Set(homeShownNames);
    const fika=pickFromPool(pickBest("fika",except), base);
    if(fika) except.add(fika.name);
    const gard=pickFromPool(pickBest("gard",except), base+1);
    if(gard) except.add(gard.name);
    const natur=pickFromPool(pickBest("natur",except), base+2);
    return [fika,gard,natur].filter(Boolean);
  }
  function journeyStepHTML(p, n, kind){
    const open=isOpen(p);
    const timed=isTimedVenue(p);
    const status=!timed
      ?(open?"Alltid tillgänglig":"Stängt")
      :(open?(isClosingSoon(p)?"Stänger snart":"Öppet nu"):"Stängt just nu");
    const km=p._km!=null?` · ${fmtDist(p._km)}`:"";
    return `<article class="journey-step${timed&&!open?" is-closed":""}" onclick="openPlace('${jsEsc(p.name)}')">
      <span class="n" aria-hidden="true">${n}</span>
      <div class="im" style="background-image:url('${p.img}')" role="img" aria-hidden="true"></div>
      <div class="bd">
        <div class="kind">${kind}</div>
        <h3>${p.name}</h3>
        <p>${p.short||p.blurb}</p>
        <div class="meta">${status}${km}</div>
      </div>
    </article>`;
  }
  function renderRoute(){
    const grid=document.getElementById('routeGrid'); if(!grid) return;
    const steps=buildRoute();
    const kinds=["Fika","Gård","Natur"];
    const why=document.getElementById('routeWhy');
    const mapsBtn=document.getElementById('routeMapsBtn');
    const closedN=steps.filter(p=>isTimedVenue(p)&&!isOpen(p)).length;
    if(why){
      why.textContent=closedN
        ?"Tre stopp — byt rutt om något är stängt"
        :"Tre stopp — fika, gård och natur · öppna när det går";
    }
    const parts=[];
    steps.forEach((p,i)=>{
      if(i) parts.push(`<div class="journey-arrow" aria-hidden="true"><span class="journey-rail"></span></div>`);
      parts.push(journeyStepHTML(p, i+1, kinds[i]||typeLabel[p.type]));
    });
    grid.innerHTML=parts.join("");
    const mapsUrl=mapsRouteUrl(steps.filter(p=>p.lat!=null&&p.lng!=null));
    if(mapsBtn){
      if(mapsUrl){
        mapsBtn.hidden=false;
        mapsBtn.onclick=()=>{ window.open(mapsUrl,"_blank","noopener"); trackEvent("route-maps",""); };
      } else {
        mapsBtn.hidden=true;
        mapsBtn.onclick=null;
      }
    }
  }
  function reshuffleRoute(){routeSeed++;renderRoute();trackEvent('route-reshuffle','');}

  function placeRouteCardHTML(p,stepLabel){
    const step=stepLabel || typeLabel[p.type] || p.cat;
    const open=isOpen(p);
    const status=!isTimedVenue(p)
      ?(open?"Alltid tillgänglig":"Stängt")
      :(open?(isClosingSoon(p)?"Stänger snart":"Öppet nu"):"Stängt");
    const credit=tipsareCreditHTML(p);
    return `<article class="route-card" onclick="openPlace('${jsEsc(p.name)}')">
      <div class="step">${step}</div>
      <div class="im" style="background-image:url('${p.img}')"></div>
      <div class="bd">
        <h3>${p.name}</h3>
        <p>${p.short||p.blurb}</p>
        ${credit}
        <div class="meta" style="margin-top:8px;font-size:12px;color:var(--ink-soft)">${status} · ${travelHTML(p).replace(/<br>/g," · ")}</div>
      </div>
    </article>`;
  }

  function placesForCategory(key){
    const cat=CATEGORIES[key]||CATEGORIES.attgora;
    if(cat.isProducer) return [];
    let list=places.slice();
    if(cat.types) list=list.filter(p=>cat.types.some(t=>placeHasType(p,t)));
    return list
      .map(p=>({p,s:scorePlace(p).score+(isOpen(p)?6:0)}))
      .sort((a,b)=>b.s-a.s)
      .map(x=>x.p);
  }
  function producerCardHTML(pr){
    return `<article class="route-card" onclick="openProducer('${jsEsc(producerSlug(pr))}')">
      <div class="step">PRODUCENT</div>
      <div class="im" style="background-image:url('${pr.img}')"></div>
      <div class="bd">
        <h3>${escHtml(pr.name)}</h3>
        <p>${escHtml(pr.short||pr.blurb)}</p>
        <div class="meta" style="margin-top:8px;font-size:12px;color:var(--ink-soft)">Finns hos återförsäljare · ingen egen adress</div>
      </div>
    </article>`;
  }
  function soldAtHTML(soldAt){
    if(!soldAt?.length) return "";
    const items=soldAt.map(s=>{
      if(s.placeSlug){
        const place=resolvePlaceRef(s.placeSlug, places);
        const label=s.label || place?.name || s.placeSlug;
        if(place){
          return `<button type="button" class="place-btn" onclick="openPlace('${jsEsc(place.name)}')">${escHtml(label)}</button>`;
        }
        return `<span class="place-btn place-btn-static">${escHtml(label)}</span>`;
      }
      if(s.name) return `<span class="place-btn place-btn-static">${escHtml(s.name)}</span>`;
      return "";
    }).filter(Boolean).join("");
    return items?`<div class="plats-soldat"><h3>Finns hos</h3><div class="plats-soldat-actions">${items}</div></div>`:"";
  }
  function producerGalleryHTML(pr){
    const imgs=(pr.gallery||[]).filter(g=>g?.url);
    if(imgs.length<2) return "";
    return `<div class="plats-gallery verk-gallery">${imgs.map((g,i)=>
      `<button type="button" class="g-thumb" style="background-image:url('${g.url}')" aria-label="${escHtml(g.alt||pr.name)}" onclick="openLightbox('${jsEsc(g.url)}')"></button>`
    ).join("")}</div>`;
  }
  function closeUpplevMenu(){
    const dd=document.getElementById('navUpplev');
    const btn=document.getElementById('nav-upplev');
    if(dd) dd.classList.remove('open');
    if(btn) btn.setAttribute('aria-expanded','false');
  }
  function toggleUpplevMenu(ev){
    ev?.stopPropagation?.();
    const dd=document.getElementById('navUpplev');
    const btn=document.getElementById('nav-upplev');
    if(!dd||!btn) return;
    const open=!dd.classList.contains('open');
    dd.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open?'true':'false');
  }
  document.addEventListener('click',(ev)=>{
    const dd=document.getElementById('navUpplev');
    if(!dd||!dd.classList.contains('open')) return;
    if(dd.contains(ev.target)) return;
    closeUpplevMenu();
  });
  document.addEventListener('keydown',(ev)=>{ if(ev.key==='Escape') closeUpplevMenu(); });

  function openCategory(key){
    currentCategory=CATEGORIES[key]?key:"attgora";
    closeUpplevMenu();
    renderCategory();
    showView('kategori',{category:currentCategory});
    trackEvent('view-category', currentCategory);
  }
  function renderCategory(){
    const cat=CATEGORIES[currentCategory]||CATEGORIES.attgora;
    S('catTitle', cat.title);
    S('catLede', cat.lede);
    const pills=document.getElementById('catPills');
    if(pills){
      const showSmultron=isSmultronFilterVisible(places);
      pills.innerHTML=Object.values(CATEGORIES)
        .filter(c=>c.key!=="smultronstalle" || showSmultron)
        .map(c=>
        `<button type="button" class="chip${c.key===cat.key?" on":""}" aria-pressed="${c.key===cat.key?"true":"false"}" onclick="openCategory('${c.key}')">${c.nav}</button>`
      ).join('');
    }
    const mapBtn=document.getElementById('catMapBtn');
    if(mapBtn) mapBtn.hidden=!!cat.isProducer || cat.mapKey==null;
    const countEl=document.getElementById('catCount');
    const grid=document.getElementById('catGrid');
    if(cat.isProducer){
      const list=producers.slice();
      if(countEl) countEl.textContent=`${list.length} verksamheter · ingen kartnål`;
      if(grid){
        grid.innerHTML=list.length
          ? list.map(pr=>producerCardHTML(pr)).join('')
          : `<div class="ev-empty" style="grid-column:1/-1">Inga producenter just nu.</div>`;
      }
    } else {
      const list=placesForCategory(cat.key);
      if(countEl){
        const openN=list.filter(p=>isOpen(p)).length;
        countEl.textContent=`${list.length} ställen · ${openN} öppna just nu`;
      }
      if(grid){
        grid.innerHTML=list.length
          ? list.map(p=>placeRouteCardHTML(p)).join('')
          : `<div class="ev-empty" style="grid-column:1/-1">Inga platser i den här kategorin just nu.</div>`;
      }
    }
    document.querySelectorAll('.nav button[id^="nav-cat-"]').forEach(b=>b.classList.remove('on'));
    document.getElementById('nav-cat-'+cat.key)?.classList.add('on');
    document.getElementById('nav-upplev')?.classList.add('on');
  }
  function filterAndMapFromCategory(){
    const cat=CATEGORIES[currentCategory]||CATEGORIES.attgora;
    if(cat.isProducer || cat.mapKey==null) return;
    filterAndMap(cat.mapKey||'alla');
  }

  function indoorCandidates(){
    return places.filter(p=>hasTag(p,"inomhus")||p.type==="butik"||p.type==="loppis"||p.name.includes("Kulturhus")||p.name.includes("Stenugns"))
      .filter(p=>p.type!=="natur")
      .sort((a,b)=>scorePlace(b).score-scorePlace(a).score);
  }
  function outdoorCandidates(){
    return places.filter(p=>p.type==="natur"||hasTag(p,"ute")).sort((a,b)=>scorePlace(b).score-scorePlace(a).score);
  }
  function renderWxShare(){
    const card=document.getElementById('wxShareCard'); if(!card) return;
    const rain=ctx.mood==="rough";
    const list=(rain?indoorCandidates():outdoorCandidates()).slice(0,5);
    const title=rain?"Regn? Här är 5 inomhus":"Sol? Här är 5 utomhus";
    const why=rain?"Mysiga stopp när vädret inte bjuder ut.":"Ut och andas — handplockat för fint väder.";
    S('wxShareHeading', rain?"Väder + inomhus":"Väder + uteliv");
    S('wxShareWhy', why);
    const shareText=`${title} i ${K}:\n`+list.map((p,i)=>`${i+1}. ${p.name}`).join("\n")+`\n— Upptäck ${K}`;
    card.innerHTML=`
      <div>
        <h3>${title}</h3>
        <p>${why}${ctx.temp!=null?` Just nu ca ${ctx.temp}°.`:""}</p>
        <div class="actions">
          <button type="button" class="chip on" onclick="shareWxCard()">Dela listan</button>
          <button type="button" class="chip" onclick="navigator.clipboard?.writeText(document.getElementById('wxShareText').textContent);pushNotify('Kopierat','Listan ligger i urklipp.');">Kopiera</button>
        </div>
        <pre id="wxShareText" hidden>${shareText.replace(/</g,"")}</pre>
      </div>
      <div class="mini">${list.map(p=>`<button type="button" onclick="openPlace('${jsEsc(p.name)}')">${p.name}</button>`).join("")}</div>`;
    window.__wxShareText=shareText;
  }
  async function shareWxCard(){
    const text=window.__wxShareText||"";
    try{
      if(navigator.share){await navigator.share({title:`Upptäck ${K}`,text});}
      else {await navigator.clipboard.writeText(text);pushNotify("Kopierat","Väderlistan ligger i urklipp.");}
      trackEvent('wx-share',ctx.mood);
    }catch(e){}
  }

  function renderLists(){
    const grid=document.getElementById('listsGrid'); if(!grid) return;
    grid.innerHTML=lists.map(L=>`
      <article class="list-card" onclick="openList('${L.id}')">
        <h3>${L.name}</h3>
        <p>${L.places.length} ställen · klicka för att öppna</p>
        <div class="row">
          <button type="button" class="chip" onclick="event.stopPropagation();shareList('${L.id}')">Dela länk</button>
          <button type="button" class="chip" onclick="event.stopPropagation();deleteList('${L.id}')">Ta bort</button>
        </div>
      </article>`).join('');
    if(activeListId) openList(activeListId);
  }
  function createList(){
    const name=(document.getElementById('newListName')?.value||"").trim();
    if(!name){alert("Ge listan ett namn.");return;}
    const id="l_"+Date.now().toString(36);
    lists.push({id,name,places:[]});
    saveJSON(LS_LISTS,lists);
    document.getElementById('newListName').value="";
    activeListId=id;
    renderLists();
    trackEvent('list-create',name);
  }
  function deleteList(id){
    if(!confirm("Ta bort listan?")) return;
    lists=lists.filter(L=>L.id!==id);
    saveJSON(LS_LISTS,lists);
    if(activeListId===id) activeListId=null;
    document.getElementById('listDetail').innerHTML="";
    renderLists();
  }
  function openList(id){
    activeListId=id;
    const L=lists.find(x=>x.id===id); if(!L) return;
    const detail=document.getElementById('listDetail');
    const items=L.places.map(n=>places.find(p=>p.name===n)).filter(Boolean);
    const routeBtn=items.length>=2
      ? `<div style="margin-bottom:16px"><button type="button" class="chip" onclick="planRouteFromList('${L.id}')">Planera rutten</button></div>`
      : "";
    detail.innerHTML=`<h2 style="font-family:var(--font-serif);font-size:28px;color:var(--moss-deep);margin-bottom:12px">${L.name}</h2>
      ${routeBtn}
      ${items.length?items.map(p=>`<article class="s-item" onclick="openPlace('${jsEsc(p.name)}')">
        <div class="im" style="background-image:url('${p.img}')"></div>
        <div><h3>${p.name}</h3><div class="meta">${p.cat} · ${!isTimedVenue(p)?(isOpen(p)?"Alltid tillgänglig":"Stängt"):(isOpen(p)?"Öppet":"Stängt")}</div></div>
        <div class="travel"><button type="button" class="chip" onclick="event.stopPropagation();removeFromList('${L.id}','${jsEsc(p.name)}')">Ta bort</button></div>
      </article>`).join(""):`<div class="ev-empty">Tom lista — öppna en plats och tryck “Lägg i lista”.</div>`}`;
  }

  // ============================================================
  //  GUIDER — redaktionella dagsguider
  // ============================================================
  function guideResolvedStops(g){
    return (g?.stops||[]).map(s=>{
      const p=places.find(x=>x.name===s.place);
      return p?{...s,placeObj:p}:null;
    }).filter(Boolean);
  }
  function mapsRouteUrl(placeObjs){
    if(!placeObjs.length) return null;
    const coords=placeObjs.map(p=>`${p.lat},${p.lng}`);
    const destination=coords[coords.length-1];
    const waypoints=coords.slice(0,-1).join("|");
    let url=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    if(waypoints) url+=`&waypoints=${encodeURIComponent(waypoints)}`;
    return url;
  }
  function syncGuidesVisibility(){
    const has=guides.length>0;
    for(const id of ["nav-guider","mnav-guider","guidesHomeSec"]){
      const el=document.getElementById(id);
      if(el) el.hidden=!has;
    }
  }
  function guideActionsHTML(slug){
    return `<button type="button" class="btn-guide primary" onclick="saveGuideAsList('${slug}')">Spara som lista</button>
      <button type="button" class="btn-guide" onclick="planGuideRoute('${slug}')">Planera rutten</button>`;
  }
  let guidesHomeFilter="popular";
  const GUIDE_FILTER_ICONS={
    star:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4.5l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4L7.5 18.2l.9-5L4.8 9.7l5-.7L12 4.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    family:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="8" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="15.5" cy="9" r="2" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 18.5c.6-3 2.4-4.5 4.5-4.5s3.9 1.5 4.5 4.5M13 14c1.5 0 3 .8 3.8 2.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    tree:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20v-5M12 15l-5 2 5-9 5 9-5-2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 11L8.5 13.2 12 6l3.5 7.2L12 11z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
    cup:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9h10v5.5A3.5 3.5 0 0 1 12.5 18h-3A3.5 3.5 0 0 1 6 14.5V9z" stroke="currentColor" stroke-width="1.6"/><path d="M16 10h1.8A2.2 2.2 0 0 1 20 12.2v0A2.2 2.2 0 0 1 17.8 14H16M8 20h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    museum:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10.5L12 5l8 5.5M6 10.5V18M10 10.5V18M14 10.5V18M18 10.5V18M4 18h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    gift:`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M5 14h14M12 10v10M12 10c-2.2 0-4-1.2-4-2.6S10.2 5 12 7.2C13.8 5 16 5.8 16 7.4S14.2 10 12 10z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  };
  function renderGuidesHomeFilters(){ /* filters only on guides page */ }
  function setGuidesHomeFilter(key){
    guidesHomeFilter=key||"popular";
    renderGuidesHomeCards();
  }
  function renderGuidesHomeCards(){
    const wrap=document.getElementById("guidesHomeTeaser");
    if(!wrap) return;
    if(!guides.length){ wrap.innerHTML=""; return; }
    const ordered=guidesForHomeFilter(guides, "popular", month, 3);
    if(!ordered.length){
      wrap.innerHTML=`<p class="guides-home-empty">Inga guider just nu — kom tillbaka snart.</p>`;
      return;
    }
    wrap.innerHTML=ordered.map((g,i)=>{
      const img=g.heroImg || guideResolvedStops(g)[0]?.placeObj?.img || "";
      const kicker=g.kicker || seasonLabel(g.season);
      const feat=i===0?" featured":"";
      return `<button type="button" class="guide-card${feat}" onclick="openGuide('${g.slug}')">
        <div class="im" style="background-image:url('${escHtml(img)}')"></div>
        <div class="bd">
          <div class="tag">${escHtml(kicker)}</div>
          <h3>${escHtml(g.title)}</h3>
          <p>${escHtml(g.intro)}</p>
          <span class="lnk">Läs guiden →</span>
        </div>
      </button>`;
    }).join("");
  }
  function renderGuidesHome(){
    syncGuidesVisibility();
    renderGuidesHomeCards();
  }
  function renderGuidesGrid(){
    const grid=document.getElementById('guidesGrid'); if(!grid) return;
    if(!guides.length){
      grid.innerHTML=`<div class="ev-empty">Inga guider ännu — kom tillbaka snart.</div>`;
      return;
    }
    grid.innerHTML=guides.map(g=>{
      const img=g.heroImg || guideResolvedStops(g)[0]?.placeObj?.img || "";
      return `<button type="button" class="guide-card" onclick="openGuide('${g.slug}')">
        <div class="im" style="background-image:url('${img}')"></div>
        <div class="bd">
          <div class="tag">${seasonLabel(g.season)}</div>
          <h3>${g.title}</h3>
          <p>${g.intro}</p>
          <span class="lnk">Läs guiden →</span>
        </div>
      </button>`;
    }).join("");
  }
  function openGuide(slug, opts={}){
    const g=guideBySlug(slug, guides); if(!g) return;
    currentGuideSlug=slug;
    const stops=guideResolvedStops(g);
    const hero=document.getElementById('guideHero');
    if(hero) hero.style.backgroundImage=`url('${g.heroImg || stops[0]?.placeObj?.img || ""}')`;
    S('guideSeason', `${seasonLabel(g.season)}guide`);
    S('guideTitle', g.title);
    S('guideIntro', g.intro);
    const leadEl=document.getElementById('guideLead');
    if(leadEl){
      leadEl.textContent=g.lead||"";
      leadEl.hidden=!g.lead;
    }
    const actions=guideActionsHTML(slug);
    const a1=document.getElementById('guideActions');
    const a2=document.getElementById('guideActionsBottom');
    if(a1) a1.innerHTML=actions;
    if(a2) a2.innerHTML=actions;
    const stopsEl=document.getElementById('guideStops');
    if(stopsEl){
      stopsEl.innerHTML=stops.map((s,i)=>{
        return `<article class="guide-stop">
          <div class="num" aria-hidden="true">${i+1}</div>
          <div>
            <h2>${s.place}</h2>
            <p>${s.text}</p>
            <button type="button" class="place-link" onclick="openPlace('${jsEsc(s.place)}')">Om platsen →</button>
          </div>
        </article>`;
      }).join("");
    }
    const outroEl=document.getElementById('guideOutro');
    if(outroEl){
      outroEl.innerHTML=`${g.outro||""}${g.signature?`<span class="sig">${g.signature}</span>`:""}`;
    }
    showView('guide',{historyMode:opts.historyMode,guide:slug,fromPopstate:opts.historyMode==="none"});
    trackEvent('view-guide', slug);
  }
  function saveGuideAsList(slug){
    const g=guideBySlug(slug, guides); if(!g) return;
    const names=g.stops.map(s=>s.place);
    let L=lists.find(x=>x.name===g.title);
    if(!L){
      L={id:"l_"+Date.now().toString(36),name:g.title,places:[]};
      lists.push(L);
    }
    L.places=[...names];
    saveJSON(LS_LISTS,lists);
    activeListId=L.id;
    pushNotify("Sparad som lista", g.title);
    trackEvent('guide-save-list', slug);
  }
  function planGuideRoute(slug){
    const g=guideBySlug(slug, guides); if(!g) return;
    const stops=guideResolvedStops(g).map(s=>s.placeObj);
    const url=mapsRouteUrl(stops);
    if(!url){ pushNotify("Ingen rutt", "Guiden saknar platser med koordinater."); return; }
    trackEvent('planera-rutt', slug);
    window.open(url, "_blank", "noopener");
  }
  function planRouteFromList(id){
    const L=lists.find(x=>x.id===id); if(!L) return;
    const objs=L.places.map(n=>places.find(p=>p.name===n)).filter(Boolean);
    const url=mapsRouteUrl(objs);
    if(!url){ pushNotify("Ingen rutt", "Listan behöver minst en plats med koordinater."); return; }
    trackEvent('planera-rutt', L.name);
    window.open(url, "_blank", "noopener");
  }
  function removeFromList(id,name){
    const L=lists.find(x=>x.id===id); if(!L) return;
    L.places=L.places.filter(n=>n!==name);
    saveJSON(LS_LISTS,lists);
    openList(id); renderLists();
  }
  function addCurrentToList(){
    const name=document.getElementById('platsName')?.textContent; if(!name) return;
    const names=lists.map(L=>L.name);
    const pick=prompt("Lägg i vilken lista?\n\n"+names.map((n,i)=>`${i+1}. ${n}`).join("\n")+"\n\nSkriv nummer eller nytt namn:");
    if(!pick) return;
    let L=null;
    const n=parseInt(pick,10);
    if(n>=1&&n<=lists.length) L=lists[n-1];
    else {
      L={id:"l_"+Date.now().toString(36),name:pick.trim(),places:[]};
      lists.push(L);
    }
    if(!L.places.includes(name)) L.places.push(name);
    saveJSON(LS_LISTS,lists);
    pushNotify("Sparad i lista",`${name} → ${L.name}`);
    trackEvent('list-add',name);
  }
  function shareList(id){
    const L=lists.find(x=>x.id===id); if(!L) return;
    const url=new URL(location.href);
    url.hash=`lista=${encodeURIComponent(JSON.stringify({n:L.name,p:L.places}))}`;
    const link=url.toString();
    navigator.clipboard?.writeText(link).then(()=>pushNotify("Länk kopierad",L.name)).catch(()=>prompt("Kopiera länken:",link));
    trackEvent('list-share',L.name);
  }
  function importListFromHash(){
    if(!location.hash.startsWith("#lista=")) return;
    try{
      const raw=decodeURIComponent(location.hash.slice(7));
      const data=JSON.parse(raw);
      if(!data?.n||!Array.isArray(data.p)) return;
      const id="l_"+Date.now().toString(36);
      lists.push({id,name:data.n+(data.n.includes("(delad)")?"":" (delad)"),places:data.p});
      saveJSON(LS_LISTS,lists);
      activeListId=id;
      history.replaceState(null,"",location.pathname+location.search);
      showView('listor');
      pushNotify("Lista importerad",data.n);
    }catch(e){}
  }

  function pushNotify(title,body,actions=[]){
    const stack=document.getElementById('notifyStack'); if(!stack) return;
    const el=document.createElement('div');
    el.className='notify';
    el.innerHTML=`<strong>${title}</strong><p>${body}</p><div class="row">${actions.map(a=>`<button type="button" class="${a.cls||'ok'}" data-act="${a.id||''}">${a.label}</button>`).join("")}<button type="button" class="no">Stäng</button></div>`;
    stack.appendChild(el);
    el.querySelectorAll('button').forEach(btn=>{
      btn.onclick=()=>{
        const act=btn.dataset.act;
        if(act&&window.__notifyActs?.[act]) window.__notifyActs[act]();
        el.remove();
      };
    });
    setTimeout(()=>el.remove(),14000);
  }
  function runNotifications(){
    const seen=new Set(loadJSON(LS_NOTIFY,[]));
    window.__notifyActs={};
    // Favorites closing soon
    const closing=[...favorites].map(n=>places.find(p=>p.name===n)).filter(p=>p&&isClosingSoon(p));
    if(closing[0]){
      const key="close_"+todayISO+"_"+closing[0].name;
      if(!seen.has(key)){
        seen.add(key);
        const act="open_"+closing[0].name;
        window.__notifyActs[act]=()=>openPlace(closing[0].name);
        pushNotify("Favorit stänger snart",`${closing[0].name} stänger om ${minutesUntilClose(closing[0])} min.`,[{id:act,label:"Öppna",cls:"ok"}]);
      }
    }
    // Event tomorrow
    const tmr=addDays(now,1); const tmrISO=iso(tmr);
    const tomorrow=liveEvents.find(e=>e.date===tmrISO);
    if(tomorrow){
      const key="ev_"+tomorrow.date+"_"+tomorrow.title;
      if(!seen.has(key)){
        seen.add(key);
        window.__notifyActs.openEv=()=>showView('hander');
        pushNotify("Event imorgon",`${tomorrow.title} · ${tomorrow.when}`,[{id:"openEv",label:"Visa",cls:"ok"}]);
      }
    }
    // New place in district (Markim demo)
    const newbie=places.find(p=>isNewPlace(p)&&metaOf(p).district==="Markim")||places.find(p=>isNewPlace(p));
    if(newbie){
      const key="new_"+newbie.name;
      if(!seen.has(key)){
        seen.add(key);
        window.__notifyActs.openNew=()=>openPlace(newbie.name);
        const dist=metaOf(newbie).district||K;
        pushNotify(`Nytt ställe i ${dist}`,`${newbie.name} — ${newbie.short||newbie.cat}`,[{id:"openNew",label:"Läs mer",cls:"ok"}]);
      }
    }
    saveJSON(LS_NOTIFY,[...seen].slice(-40));
  }

  let tipKind="place";
  function setTipKind(kind){
    tipKind=kind==="event"?"event":kind==="smultron"?"smultron":"place";
    const tabs={
      place:document.getElementById("tipTabPlace"),
      event:document.getElementById("tipTabEvent"),
      smultron:document.getElementById("tipTabSmultron"),
    };
    const panels={
      place:document.getElementById("tipPanelPlace"),
      event:document.getElementById("tipPanelEvent"),
      smultron:document.getElementById("tipPanelSmultron"),
    };
    Object.keys(tabs).forEach(k=>{
      const on=tipKind===k;
      if(tabs[k]){ tabs[k].classList.toggle("on",on); tabs[k].setAttribute("aria-selected",on?"true":"false"); }
      if(panels[k]) panels[k].hidden=!on;
    });
    const msg=document.getElementById("evFormMsg");
    if(msg) msg.textContent="";
  }
  async function submitTipForm(){
    const msg=document.getElementById("evFormMsg");
    if(tipKind==="place"){
      const name=document.getElementById("plName")?.value.trim();
      const type=document.getElementById("plKind")?.value.trim();
      const where=document.getElementById("plWhere")?.value.trim();
      const note=document.getElementById("plNote")?.value.trim();
      const web=document.getElementById("plWeb")?.value.trim();
      const email=document.getElementById("plEmail")?.value.trim();
      if(!name||!where){ if(msg) msg.textContent="Fyll i namn och adress/område."; return; }
      const fields={tipType:"plats",name,type,where,note,web,email,source:location.href};
      const subject=`Platstips: ${name}`;
      if(msg) msg.textContent="Skickar…";
      try{
        const result=await deliverForm({ kind:"place", subject, fields });
        const activate=/activat|confirm|check your email|bekräft/i.test(result.message||"");
        if(msg) msg.textContent=activate
          ? "Nästan klart — kolla info@upptackvallentuna.se (även skräppost) och bekräfta aktiveringsmejlet. Sedan fungerar tipsen."
          : "Tack! Tipset är skickat till info@upptackvallentuna.se — syns inte publikt förrän det godkänts.";
        ["plName","plKind","plWhere","plNote","plWeb","plEmail"].forEach(id=>{const el=document.getElementById(id);if(el) el.value="";});
        trackEvent("place-submit",name);
      }catch(err){
        const mailto=buildMailtoUrl(subject,fields);
        if(msg){
          msg.innerHTML=err.code==="NOT_DEPLOYED"
            ? `Lokalt läge — <a href="${mailto}">skicka tipset via e-post till info@</a> i stället.`
            : `Kunde inte skicka automatiskt. <a href="${mailto}">Öppna e-post till info@upptackvallentuna.se</a> och skicka manuellt.`;
        }
      }
      return;
    }
    if(tipKind==="smultron"){
      const name=document.getElementById("smName")?.value.trim();
      const where=document.getElementById("smWhere")?.value.trim();
      const note=document.getElementById("smNote")?.value.trim();
      const tipsare=document.getElementById("smTipsare")?.value.trim();
      const email=document.getElementById("smEmail")?.value.trim();
      if(!name||!where){ if(msg) msg.textContent="Fyll i vad platsen kallas och var den ligger."; return; }
      const fields={tipType:"smultronstalle",name,where,note,tipsare,email,source:location.href};
      const subject=`Smultronställe-tips: ${name}`;
      if(msg) msg.textContent="Skickar…";
      try{
        const result=await deliverForm({ kind:"place", subject, fields });
        const activate=/activat|confirm|check your email|bekräft/i.test(result.message||"");
        if(msg) msg.textContent=activate
          ? "Nästan klart — kolla info@upptackvallentuna.se (även skräppost) och bekräfta aktiveringsmejlet. Sedan fungerar tipsen."
          : "Tack! Tipset är skickat till info@upptackvallentuna.se — syns inte publikt förrän det godkänts.";
        ["smName","smWhere","smNote","smTipsare","smEmail"].forEach(id=>{const el=document.getElementById(id);if(el) el.value="";});
        trackEvent("smultron-submit",name);
      }catch(err){
        const mailto=buildMailtoUrl(subject,fields);
        if(msg){
          msg.innerHTML=err.code==="NOT_DEPLOYED"
            ? `Lokalt läge — <a href="${mailto}">skicka tipset via e-post till info@</a> i stället.`
            : `Kunde inte skicka automatiskt. <a href="${mailto}">Öppna e-post till info@upptackvallentuna.se</a> och skicka manuellt.`;
        }
      }
      return;
    }
    const title=document.getElementById("evTitle")?.value.trim();
    const host=document.getElementById("evHost")?.value.trim();
    const date=document.getElementById("evDate")?.value;
    const time=document.getElementById("evTime")?.value.trim();
    const note=document.getElementById("evNote")?.value.trim();
    const email=document.getElementById("evEmail")?.value.trim();
    if(!title||!host||!date){if(msg) msg.textContent="Fyll i titel, plats och datum.";return;}
    const payload={id:"pe_"+Date.now(),title,host,date,time,note,email,status:"pending",at:new Date().toISOString()};
    const fields={tipType:"evenemang",title,host,date,time,note,email,source:location.href};
    const subject=`Evenemangstips: ${title}`;
    if(msg) msg.textContent="Skickar…";
    try{
      const result=await deliverForm({
        kind:"event",
        subject,
        fields,
        persistLocal:()=>{
          const pending=loadJSON(LS_PENDING,[]);
          pending.push(payload);
          saveJSON(LS_PENDING,pending);
        }
      });
      const activate=/activat|confirm|check your email|bekräft/i.test(result.message||"");
      if(msg) msg.textContent=activate
        ? "Nästan klart — kolla info@upptackvallentuna.se (även skräppost) och bekräfta aktiveringsmejlet. Sedan fungerar tipsen."
        : "Tack! Tipset är skickat till info@upptackvallentuna.se — syns inte publikt förrän det godkänts.";
      ["evTitle","evHost","evDate","evTime","evNote","evEmail"].forEach(id=>{const el=document.getElementById(id);if(el) el.value="";});
      renderPendingAdmin();
      trackEvent("event-submit",title);
    }catch(err){
      const mailto=buildMailtoUrl(subject,fields);
      if(msg){
        msg.innerHTML=err.code==="NOT_DEPLOYED"
          ? `Lokalt läge — <a href="${mailto}">skicka tipset via e-post till info@</a> i stället.`
          : `Kunde inte skicka automatiskt. <a href="${mailto}">Öppna e-post till info@upptackvallentuna.se</a> och skicka manuellt.`;
      }
    }
  }
  /** @deprecated alias — older onclick bindings */
  async function submitEventForm(){ return submitTipForm(); }
  function renderPendingAdmin(){
    const box=document.getElementById('pendingAdmin'); if(!box) return;
    if(!/admin=1/.test(location.search)){box.innerHTML="";return;}
    const pending=loadJSON(LS_PENDING,[]);
    if(!pending.length){box.innerHTML="";return;}
    box.innerHTML=`<h3 style="font-family:var(--font-serif);font-size:22px;color:var(--moss-deep);margin-bottom:10px">Inkomna (lokal kö)</h3>
      ${pending.map(e=>`<div class="s-item" style="cursor:default">
        <div class="im" style="background:#f0ebe4"></div>
        <div>
          <h3>${e.title}</h3>
          <div class="meta">${e.host} · ${e.date} · ${e.status}</div>
          <p style="font-size:13px;color:var(--ink-soft);margin-top:6px">${e.note||""}</p>
        </div>
        <div class="travel">
          ${e.status==="pending"?`<button type="button" class="chip on" onclick="approvePending('${e.id}')">Godkänn</button>`:`<span class="tag">Godkänd</span>`}
        </div>
      </div>`).join("")}`;
  }
  function approvePending(id){
    const pending=loadJSON(LS_PENDING,[]);
    const e=pending.find(x=>x.id===id); if(!e) return;
    e.status="approved";
    saveJSON(LS_PENDING,pending);
    // Surface as live event in-session
    events.push({host:e.host,title:e.title,date:e.date,when:e.date+(e.time?" · "+e.time:""),time:e.time||"",cat:"ÖVRIGT",note:e.note||"",img:places.find(p=>p.name===e.host)?.img||places[0].img});
    liveEvents.push(events[events.length-1]);
    liveEvents.sort((a,b)=>a.date.localeCompare(b.date));
    renderEventsFull();
    renderPendingAdmin();
    pushNotify("Event godkänt",e.title);
    trackEvent('event-approve',e.title);
  }

  function openReport(){
    const name=document.getElementById('platsName')?.textContent||"";
    document.getElementById('reportPlace').value=name;
    document.getElementById('reportText').value="";
    document.getElementById('reportModal').classList.add('on');
  }
  function closeReport(){document.getElementById('reportModal').classList.remove('on');}
  async function submitReport(){
    const place=document.getElementById('reportPlace').value;
    const type=document.getElementById('reportType').value;
    const text=document.getElementById('reportText').value.trim();
    try{
      await deliverForm({
        kind:"report",
        subject:`Felrapport: ${place} (${type})`,
        fields:{place,type,text,source:location.href},
        persistLocal:(fields)=>{
          const reports=loadJSON(LS_REPORTS,[]);
          reports.push({...fields,at:new Date().toISOString()});
          saveJSON(LS_REPORTS,reports);
        }
      });
      closeReport();
      pushNotify("Tack för tipset","Vi tar med rapporten i nästa uppdatering.");
      trackEvent('report',type);
    }catch(err){
      pushNotify(
        "Kunde inte skicka automatiskt",
        "Mejla tipset till info@upptackvallentuna.se — eller testa igen på live-sajten efter deploy.",
      );
    }
  }

  function bootSmartPack(){
    try{
      normalizeFavorites();
      initSearchUI();
      runSearch();
      renderRoute();
      renderGuidesHome();
      renderGuidesGrid();
      renderVoicesHome();
      renderLevererarHome();
      renderHappenHome();
      renderLists();
      renderFavorites();
      renderPendingAdmin();
      importListFromHash();
      setTimeout(runNotifications,900);
    }catch(e){ console.warn('bootSmartPack', e); }
  }

  function requestNearMe(){
    // TODO: bryter mot integritetskrav satta för feature/nara-dig — se separat uppstädning.
    if(!navigator.geolocation){alert("Din webbläsare stödjer inte plats.");return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      userPos={lat:pos.coords.latitude,lng:pos.coords.longitude};
      saveJSON(LS_GEO_ASKED,true);
      // TODO: bryter mot integritetskrav satta för feature/nara-dig — se separat uppstädning.
      trackEvent('geo','granted');
      renderPicks();
      renderRoute();
      if(document.getElementById('view-sok')?.classList.contains('on')) runSearch();
      if(map){buildList();renderFilter();}
    },()=>{
      // TODO: bryter mot integritetskrav satta för feature/nara-dig — se separat uppstädning.
      trackEvent('geo','denied');
      // TODO: bryter mot integritetskrav satta för feature/nara-dig — se separat uppstädning.
      alert("Kunde inte hämta din plats. Du kan fortsätta utan den.");
    },{enableHighAccuracy:false,timeout:8000,maximumAge:300000});
  }
  function toggleOpenNow(){
    openNowOnly=!openNowOnly;
    document.getElementById('chipOpenNow')?.classList.toggle('on',openNowOnly);
    if(map) renderFilter();
  }
  function toggleFavOnly(){
    favOnly=!favOnly;
    document.getElementById('chipFavOnly')?.classList.toggle('on',favOnly);
    if(map) renderFilter();
  }

  function paintHeroWeatherFallback(){
    if(ctx.temp!=null) return;
    const ico=document.getElementById('wIcon');
    if(ico) ico.innerHTML=WEATHER_SVG.part;
    const t=document.getElementById('wTemp');
    const p=document.getElementById('wPlace');
    const w=document.getElementById('wText');
    const s=document.getElementById('wSub');
    if(t) t.textContent="–°";
    if(p) p.textContent=K;
    if(w) w.textContent="Lokalt väder";
    if(s) s.textContent="hämtas strax";
  }
  async function loadWeather(){
    try{
      const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.center[0]}&longitude=${CONFIG.center[1]}&current=temperature_2m,weather_code,wind_speed_10m,apparent_temperature&daily=sunrise,sunset&timezone=Europe/Stockholm`);
      const d=await r.json();
      const code=d.current.weather_code, temp=Math.round(d.current.temperature_2m);
      const feels=Math.round(d.current.apparent_temperature);
      const wind=Math.round(d.current.wind_speed_10m);
      const wk=weatherKind(code);
      const sunrise=(d.daily?.sunrise?.[0]||"").slice(11,16);
      const sunset=(d.daily?.sunset?.[0]||"").slice(11,16);
      ctx={mood:weatherMood(code,temp),temp,code,sunrise,sunset,feels,wind};
      const ico=document.getElementById('wIcon');
      if(ico) ico.innerHTML=WEATHER_SVG[wk.k]||WEATHER_SVG.cloud;
      document.getElementById('wTemp').textContent=temp+"°";
      document.getElementById('wPlace').textContent=K;
      document.getElementById('wText').textContent=wk.t;
      document.getElementById('wSub').textContent=`känns som ${feels}°`;
      try{ refreshHeroGreet(); }catch(e){ console.warn('refreshHeroGreet', e); }
      try{ refreshHeroToday(); }catch(e){ console.warn('refreshHeroToday', e); }
      try{ renderTodayBrief(); }catch(e){ console.warn('renderTodayBrief after weather', e); }
      try{ renderPicks(); }catch(e){ console.warn('renderPicks after weather', e); }
      try{ renderRoute(); }catch(e){ console.warn('renderRoute after weather', e); }
    }catch(e){
      paintHeroWeatherFallback();
      try{ refreshHeroGreet(); }catch(err){}
      try{ refreshHeroToday(); }catch(err){}
      try{ renderTodayBrief(); }catch(err){}
    }
  }
  try{ refreshHeroToday(); }catch(e){}
  try{ renderTodayBrief(); }catch(e){}
  loadWeather();

  // ============================================================
  //  KARTA
  // ============================================================
  /** Load Leaflet (+ MapLibre/OpenFreeMap) only when a map is actually opened. */
  let leafletPromise=null;
  function loadStylesheet(href){
    if([...document.querySelectorAll("link[rel=stylesheet]")].some(l=>l.href===href||l.getAttribute("href")===href)){
      return Promise.resolve();
    }
    return new Promise((resolve,reject)=>{
      const css=document.createElement("link");
      css.rel="stylesheet";
      css.href=href;
      css.onload=()=>resolve();
      css.onerror=()=>reject(new Error("CSS "+href));
      document.head.appendChild(css);
    });
  }
  function loadScript(src){
    if([...document.scripts].some(s=>s.src===src||s.getAttribute("src")===src)){
      return Promise.resolve();
    }
    return new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src=src;
      s.async=true;
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error("Script "+src));
      document.body.appendChild(s);
    });
  }
  function ensureLeaflet(){
    if(leafletPromise) return leafletPromise;
    leafletPromise=(async()=>{
      if(typeof window.L==="undefined"){
        await loadStylesheet("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");
      }
      if(typeof window.maplibregl==="undefined" || typeof window.L.maplibreGL!=="function"){
        await loadStylesheet("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css");
        await loadScript("https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js");
        await loadScript("https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js");
      }
      return window.L;
    })().catch(err=>{
      leafletPromise=null;
      throw err;
    });
    return leafletPromise;
  }
  try{ mountNearDigPanel(); }catch(e){ console.warn("mountNearDigPanel", e); }
  async function initMap(){
    if(map)return;
    try{ await ensureLeaflet(); }catch(e){ console.warn(e); return; }
    map=L.map('map',{zoomControl:false,scrollWheelZoom:true}).setView(CONFIG.center,CONFIG.zoom);
    L.control.zoom({position:'bottomright'}).addTo(map);
    addBasemap(map);
    places.filter(isMappablePlace).forEach((p)=>{
      const open=isOpen(p);
      const tag=!isTimedVenue(p)
        ?`<span class="card-tag open">● Alltid tillgänglig</span>`
        :(open?`<span class="card-tag open">● Öppet nu</span>`:`<span class="card-tag closed">○ Stängt</span>`);
      const evs=eventsByHost[p.name]||[];
      const evHtml=evs.length?`<div class="ev-badge">📅 ${evs[0].title} · ${evs[0].when}</div>`:'';
      const dir=`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
      const webLink=p.url?`<a class="weblink" href="${p.url}" target="_blank" rel="noopener" onclick="trackEvent('website','${jsEsc(p.name)}')">🌐 Besök hemsidan →</a>`:'';
      const hook=p.url
        ?""
        :`<div class="hook">Äger du den här verksamheten och saknar hemsida? <a href="https://www.fvno.se/" target="_blank" rel="noopener" onclick="trackEvent('hook-formverket','${jsEsc(p.name)}')">Synas bättre →</a></div>`;
      const html=`<div class="card-img" style="background-image:url('${p.img}')"></div><div class="card-body"><div class="cat">${p.cat}</div><h3>${p.name}</h3><p>${p.blurb}</p>${tipsareCreditHTML(p)}${tag}${evHtml}${webLink?`<div class="card-actions" style="margin-bottom:6px">${webLink}</div>`:""}<div class="card-actions"><a class="btn-dir" href="${dir}" target="_blank" rel="noopener" onclick="trackEvent('hitta-hit','${jsEsc(p.name)}')">📍 Hitta hit</a></div><button class="popup-more" onclick="openPlace('${jsEsc(p.name)}')">Läs mer →</button>${hook}</div>`;
      markers.push(L.marker([p.lat,p.lng],{icon:pinIcon(p.color,open?'':'closed')}).addTo(map).bindPopup(html,{closeButton:false,maxWidth:262}));
    });
    buildFilters();buildList();renderFilter();
    setTimeout(()=>map.invalidateSize(),50);
  }
  function pinIcon(color,cls){return L.divIcon({className:'',html:`<div class="pin ${cls||''}"><svg width="26" height="34" viewBox="0 0 26 34" fill="none"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.2 13 21 13 21s13-11.8 13-21C26 5.8 20.2 0 13 0z" fill="${color}"/><circle cx="13" cy="13" r="5" fill="#f9f7f3"/></svg></div>`,iconSize:[26,34],iconAnchor:[13,34],popupAnchor:[0,-32]});}

  function buildFilters(){
    const bar=document.getElementById('filters');
    bar.innerHTML='';
    const showSmultron=isSmultronFilterVisible(places);
    cats.filter(c=>c.key!=="smultronstalle" || showSmultron).forEach(c=>{
      const b=document.createElement('div');
      b.className='chip'+(c.key==="alla"?' on':'');
      b.textContent=c.label;
      b.dataset.key=c.key;
      b.onclick=()=>{active=c.key;document.getElementById('search').value='';renderFilter();};
      bar.appendChild(b);
    });
    if(active==="smultronstalle" && !showSmultron){ active="alla"; }
  }
  function buildList(){
    const list=document.getElementById('mlist');list.innerHTML='';
    // Sort by score — only mappable places get pins (markers[] index matches mappable order)
    const mappable=places.filter(isMappablePlace);
    const indexByName=Object.fromEntries(mappable.map((p,i)=>[p.name,i]));
    const order=rankedPlaces().filter(({p})=>isMappablePlace(p));
    order.forEach(({p,soon,mins})=>{
      const i=indexByName[p.name];
      if(i==null) return;
      const open=isOpen(p);
      const el=document.createElement('div');
      el.className='item';
      el.dataset.type=p.type;
      el.dataset.name=p.name;
      let sub="";
      if(isTimedVenue(p) && open&&soon) sub=`<div class="submeta soon">Stänger om ${mins} min</div>`;
      else if(isTimedVenue(p) && open) sub=`<div class="submeta open">Öppet nu${p._km!=null?" · "+fmtDist(p._km):""}</div>`;
      else if(!isTimedVenue(p) && open) sub=`<div class="submeta open">Alltid tillgänglig${p._km!=null?" · "+fmtDist(p._km):""}</div>`;
      else if(p._km!=null) sub=`<div class="submeta">${fmtDist(p._km)}</div>`;
      if(isNewPlace(p)) sub+=`<div class="submeta">Nytt i guiden</div>`;
      el.innerHTML=`<div class="thumb" style="background-image:url('${p.img}')"></div><div><h3><span class="dot ${open?'open':'closed'}"></span>${p.name}${favorites.has(p.name)?" ♥":""}</h3><div class="cat">${p.cat}</div>${sub}</div>`;
      el.onclick=()=>{document.querySelectorAll('#mlist .item').forEach(x=>x.classList.remove('active'));el.classList.add('active');map.flyTo([p.lat,p.lng],16,{duration:.6});setTimeout(()=>markers[i].openPopup(),620);};
      list.appendChild(el);
    });
  }
  function placeMatchesFilters(p){
    if(active!=="alla"&&!placeHasType(p,active)) return false;
    if(openNowOnly&&!isOpenVenue(p)) return false;
    if(favOnly&&!favorites.has(p.name)) return false;
    return true;
  }
  function renderMapSummary(shownPlaces){
    const el=document.getElementById("mapSummary");
    if(!el) return;
    const hits=shownPlaces.map(place=>({place}));
    const groups=summarizeNearGroups(hits).filter(g=>g.count>0);
    const n=shownPlaces.length;
    const pills=groups.map(g=>`
      <span class="map-summary-pill">
        <span class="nara-dig-ico" style="background:${g.color}" aria-hidden="true">${pinIconSvgForType(g.types[0])}</span>
        <span>${escHtml(g.label)}</span>
        <strong>${g.count}</strong>
      </span>`).join("");
    el.innerHTML=`
      <div class="map-summary-stat">
        <span class="map-summary-n">${n}</span>
        <span class="map-summary-label">tips på kartan</span>
      </div>
      <div class="map-summary-groups">${pills||`<span class="map-summary-label">Inga träffar med nuvarande filter.</span>`}</div>`;
    el.hidden=false;
  }

  function renderFilter(){
    document.querySelectorAll('#filters .chip').forEach(c=>c.classList.toggle('on',c.dataset.key===active));
    let shown=0;
    const shownPlaces=[];
    const mappable=places.filter(isMappablePlace);
    const items=[...document.querySelectorAll('#mlist .item')];
    items.forEach(el=>{
      const p=places.find(x=>x.name===el.dataset.name);
      if(!p||!isMappablePlace(p)){el.classList.add('hidden');return;}
      const m=placeMatchesFilters(p);
      el.classList.toggle('hidden',!m);
      const i=mappable.indexOf(p);
      if(i<0) return;
      if(m){markers[i].addTo(map);shown++;shownPlaces.push(p);}else{markers[i].remove();}
    });
    let label=shown+' platser i '+K;
    if(openNowOnly) label=shown+' öppna nu';
    if(favOnly) label=shown+' favoriter';
    if(userPos) label+=' · närmast först';
    document.getElementById('mcount').textContent=label;
    renderMapSummary(shownPlaces);
  }

  document.getElementById('search')?.addEventListener('input',function(){
    const q=this.value.trim().toLowerCase();document.getElementById('searchClr')?.classList.toggle('show',q.length>0);
    if(!q){renderFilter();return;}
    let shown=0;
    const shownPlaces=[];
    const mappable=places.filter(isMappablePlace);
    document.querySelectorAll('#mlist .item').forEach(el=>{
      const p=places.find(x=>x.name===el.dataset.name); if(!p) return;
      const i=mappable.indexOf(p);
      const hay=(p.name+' '+(p.aka||[]).join(' ')+' '+p.cat+' '+p.blurb+' '+placeTypes(p).join(' ')).toLowerCase();
      const m=hay.includes(q)&&placeMatchesFilters(p);
      el.classList.toggle('hidden',!m);
      if(i<0) return;
      if(m){markers[i]?.addTo(map);shown++;shownPlaces.push(p);}else{markers[i]?.remove();}
    });
    document.querySelectorAll('#filters .chip').forEach(c=>c.classList.toggle('on',c.dataset.key==='alla'));active='alla';
    const mc=document.getElementById('mcount'); if(mc) mc.textContent=(shown?shown+' träffar':'Inga träffar')+' · '+K;
    renderMapSummary(shownPlaces);
  });
  document.getElementById('searchClr')?.addEventListener('click',()=>{const s=document.getElementById('search');if(!s)return;s.value='';s.dispatchEvent(new Event('input'));s.focus();});

  let activeEventCat="alla";
  function renderEventChips(){
    const bar=document.getElementById('eventFilters');
    if(!bar) return;
    bar.innerHTML=EVENT_FILTERS.map(f=>
      `<button type="button" class="chip${f.key===activeEventCat?" on":""}" data-key="${f.key}" aria-pressed="${f.key===activeEventCat?"true":"false"}" onclick="filterEvents('${f.key}')">${f.label}</button>`
    ).join("");
  }
  function recurringCardHTML(r){
    const when=recurringWhenLine(r);
    const place=resolvePlaceRef(r.place, places);
    const isToday=Number(r.weekday)===day;
    const slug=recurringSlug(r);
    return `<article class="ev recurring-card" data-recurring="${escHtml(slug)}">
      <div class="media">
        <div class="thumb" style="background-image:url('${r.img||""}')" role="img" aria-label="${escHtml(r.title)}"></div>
        <div class="date"><span class="dow">${escHtml(formatWeekday(r.weekday,{capitalize:true}).slice(0,3).toUpperCase())}</span><span class="d">↻</span><span class="m">VECKA</span></div>
      </div>
      <div class="bd">
        <h3>${escHtml(r.title)}</h3>
        <div class="meta">
          <span>${escHtml(place?.name||r.place||"")}</span>
          <span>${escHtml(when)}</span>
        </div>
        <div class="tag">${isToday?"IDAG · ":""}Varje vecka</div>
        <p class="note" style="margin-top:8px;font-size:13px;color:var(--ink-soft)">${escHtml(r.note||"")}</p>
        ${place?`<button type="button" class="place-btn" onclick="event.stopPropagation();openPlace('${jsEsc(place.name)}')">Om platsen →</button>`:""}
      </div>
    </article>`;
  }
  function renderRecurringSection(){
    const wrap=document.getElementById('recurringSection');
    const grid=document.getElementById('recurringGrid');
    if(!wrap||!grid) return;
    if(!recurring.length){ wrap.hidden=true; grid.innerHTML=""; return; }
    wrap.hidden=false;
    grid.innerHTML=recurring.map(r=>recurringCardHTML(r)).join("");
  }
  function renderEventsFull(){
    const evFull=document.getElementById('eventsFull');
    if(!evFull) return;
    renderEventChips();
    renderRecurringSection();
    const list=liveEvents.filter(e=>eventMatchesFilter(e, activeEventCat));
    const countEl=document.getElementById('eventCount');
    if(countEl){
      if(!liveEvents.length) countEl.textContent="";
      else if(activeEventCat==="alla") countEl.textContent=list.length+" evenemang";
      else countEl.textContent=list.length+" av "+liveEvents.length;
    }
    if(!liveEvents.length){
      evFull.innerHTML=`<div class="ev-empty">Inga inplanerade evenemang just nu — kika in snart igen.</div>`;
      return;
    }
    if(!list.length){
      evFull.innerHTML=`<div class="ev-empty">Inga evenemang i den här kategorin just nu. <button type="button" class="lnk" onclick="filterEvents('alla')">Visa alla</button></div>`;
      return;
    }
    evFull.innerHTML=list.map(e=>eventCard(e,true)).join('');
  }
  function filterEvents(key){
    activeEventCat=EVENT_FILTERS.some(f=>f.key===key)?key:"alla";
    renderEventsFull();
    trackEvent('event-filter', activeEventCat);
  }
  renderEventsFull();


  // ============================================================
  //  PLATS — detaljsida
  // ============================================================
  /** How many pushState place entries sit above the pre-place view. */
  let platsStackDepth=0;
  /** True when the current place entry was pushState'd — in-app ← can history.back(). */
  let canHistoryBackFromPlats=false;
  /** When leaving plats via nav/←, pop history then show this view (avoids ghost entries). */
  let platsClosePending=null;
  /** Opts carried through leavePlats → popstate (e.g. verksamhet slug). */
  let platsClosePendingMeta=null;
  /** Skip clearPlatsParam while optimistically leaving a pushed place (URL still has ?plats=). */
  let skipClearPlatsParam=false;
  /** Guard hashchange while popstate is restoring a view. */
  let handlingPopstate=false;
  /** Don't push SPA history during initial boot / deep-link restore. */
  let viewHistoryReady=false;

  function resolvePlaceFromQuery(q){
    if(!q) return null;
    const decoded=decodeURIComponent(q);
    return places.find(x=>x.name===decoded) || placeBySlug(decoded) || places.find(x=>placeSlug(x.name)===decoded) || null;
  }
  function getPlatsSlugFromLocation(){
    try{ return new URLSearchParams(location.search).get("plats"); }catch(e){ return null; }
  }
  function isPlatsViewOn(){
    return !!document.getElementById('view-plats')?.classList.contains('on');
  }

  function syncPlatsUrl(slug, mode){
    try{
      const url=new URL(location.href);
      url.searchParams.set("plats", slug);
      const path=url.pathname+url.search+url.hash;
      const prev=history.state || {};
      if(mode==="push"){
        const depth=platsStackDepth+1;
        history.pushState({uv:"plats",slug,pushed:true,depth},"",path);
        platsStackDepth=depth;
        canHistoryBackFromPlats=true;
      }else if(mode==="replace"){
        history.replaceState({uv:"plats",slug,pushed:!!prev.pushed,depth:platsStackDepth},"",path);
      }else{
        // "none" — deep-link / popstate: keep entry, restore depth/pushed from this history entry
        const pushed=!!prev.pushed;
        const depth=typeof prev.depth==="number" ? prev.depth : (pushed ? Math.max(platsStackDepth,1) : 0);
        history.replaceState({uv:"plats",slug,pushed,depth},"",path);
        canHistoryBackFromPlats=pushed;
        platsStackDepth=depth;
      }
    }catch(e){}
  }

  function openPlace(name, opts={}){
    const p=places.find(x=>x.name===name); if(!p)return;
    const onPlats=!!document.getElementById('view-plats')?.classList.contains('on');
    // Keep prior "where we came from" when switching place→place or restoring via popstate
    if(!onPlats) lastViewBeforePlats = document.querySelector('.view.on')?.id.replace('view-','')||'start';
    const open=isOpen(p);
    const soon=isClosingSoon(p);
    const mins=minutesUntilClose(p);
    const scored=scorePlace(p);
    bumpInterest(p.name,"views");
    saveJSON(LS_LAST,{name:p.name,at:new Date().toISOString()});
    document.getElementById('platsHero').style.backgroundImage=`url('${p.img}')`;
    S('platsCat',p.cat); S('platsName',p.name);
    S('platsLead',p.blurb);
    const tipsareEl=document.getElementById('platsTipsare');
    if(tipsareEl){
      const tip=(p.tipsare||"").trim();
      if(tip){ tipsareEl.hidden=false; tipsareEl.textContent=`Tipsat av ${tip}`; }
      else { tipsareEl.hidden=true; tipsareEl.textContent=""; }
    }
    const rich=CONTENT[p.name]||{};
    const factsEl=document.getElementById('platsFacts');
    if(factsEl){
      const facts=[...(rich.facts||[])];
      if(rich.address) facts.unshift(rich.address);
      factsEl.innerHTML=facts.map(f=>`<span>${f}</span>`).join('');
    }
    const gal=document.getElementById('platsGallery');
    if(gal){
      // Dedupe by URL — never repeat the same photo in the gallery.
      const raw=rich.images&&rich.images.length?rich.images:[{url:p.img,alt:p.name}];
      const seen=new Set();
      const imgs=raw.filter(im=>{
        const u=(im&&im.url||"").trim();
        if(!u||seen.has(u)) return false;
        seen.add(u); return true;
      }).slice(0,3);
      const isStock=/unsplash\.com/i.test(p.img)||(rich.images||[]).some(im=>/unsplash\.com/i.test(im?.url||""));
      const credit=rich.photoCredit
        || (rich.localPhotos && !isStock
          ? "Foto från verksamheten."
          : "Stämningsfoto (Unsplash) — inte nödvändigtvis taget på platsen. Ersätts när eget foto finns.");
      const n=imgs.length;
      gal.className="plats-gallery g-count-"+n;
      if(!n){ gal.innerHTML=""; }
      else if(n===1){
        gal.innerHTML=`
        <div class="g-main" style="background-image:url('${imgs[0].url}')" role="img" aria-label="${imgs[0].alt||p.name}"></div>
        <div class="g-credit">${credit}</div>`;
      } else if(n===2){
        gal.innerHTML=`
        <div class="g-main" style="background-image:url('${imgs[0].url}')" role="img" aria-label="${imgs[0].alt||p.name}"></div>
        <div class="g-side" style="background-image:url('${imgs[1].url}')" role="img" aria-label="${imgs[1].alt||''}"></div>
        <div class="g-credit">${credit}</div>`;
      } else {
        gal.innerHTML=`
        <div class="g-main" style="background-image:url('${imgs[0].url}')" role="img" aria-label="${imgs[0].alt||p.name}"></div>
        <div class="g-side" style="background-image:url('${imgs[1].url}')" role="img" aria-label="${imgs[1].alt||''}"></div>
        <div class="g-side" style="background-image:url('${imgs[2].url}')" role="img" aria-label="${imgs[2].alt||''}"></div>
        <div class="g-credit">${credit}</div>`;
      }
    }
    let body = rich.body || (p.short && !p.blurb.includes(p.short) ? `<p>${p.short}</p>` : '');
    // Attach longer event copy if this place hosts an upcoming event
    const hostEv=(eventsByHost[p.name]||[])[0];
    if(hostEv && EVENT_CONTENT[hostEv.title]){
      body += `<h3>Kommande: ${hostEv.title}</h3>`+EVENT_CONTENT[hostEv.title].body;
    }
    const proof=interestLabel(p.name);
    if(proof) body += `<p class="plats-proof">${proof}</p>`;
    if(p.type==="natur" && ctx.sunset){
      body += `<div class="sun-note">Solnedgång idag ca <strong>${ctx.sunset}</strong>${ctx.sunrise?" · soluppgång "+ctx.sunrise:""}. Fint ljus sista timmarna innan skymning.</div>`;
    }
    if(scored.reasons.length) body += `<div class="sun-note">Varför just nu: ${scored.reasons.join(" · ")}</div>`;
    const atHere=producersAtPlaceSlug(p.slug||placeSlug(p.name));
    if(atHere.length){
      body += `<div class="plats-soldat"><h3>Lokala producenter här</h3><div class="plats-soldat-actions">${atHere.map(pr=>
        `<button type="button" class="place-btn" onclick="openProducer('${jsEsc(producerSlug(pr))}')">${escHtml(pr.name)}</button>`
      ).join("")}</div></div>`;
    }
    document.getElementById('platsBody').innerHTML = body;
    const todayHrs=fmtHoursSlot(daySlot(p));
    let statusTxt;
    if(!isTimedVenue(p)){
      const note=metaOf(p).seasonNote||"";
      if(/bokas|förfrågan|överenskommelse/i.test(note)) statusTxt=/bokas|förfrågan/i.test(note)?"Bokas efter förfrågan":"Efter överenskommelse";
      else statusTxt=open?"Alltid tillgänglig":"Ej tillgänglig just nu";
    } else statusTxt=open?(soon?`Öppet — stänger om ${mins} min`:"Öppet nu"):"Stängt just nu";
    if(holidayToday&&isHolidayClosed(p)) statusTxt=`Stängt (${holidayToday})`;
    const tags=placeTags(p).map(t=>TAG_LABEL[t]||t);
    let info = `<div class="irow"><span class="k">Kategori</span><span class="v">${p.cat}${isNewPlace(p)?" · Nytt":""}</span></div>`;
    info += `<div class="irow"><span class="k">Status</span><span class="v ${open?'open':'closed'}">${statusTxt}</span></div>`;
    info += `<div class="irow"><span class="k">Idag</span><span class="v">${todayHrs}</span></div>`;
    if(tags.length) info += `<div class="irow"><span class="k">Passar</span><span class="v">${tags.join(" · ")}</span></div>`;
    const t=travelEstimate(p);
    if(t){
      p._km=t.km;
      info += `<div class="irow"><span class="k">Avstånd</span><span class="v">${fmtDist(t.km)} ${t.fromUser?"från dig":"från centrum"}</span></div>`;
    } else {
      p._km=null;
      info += `<div class="irow"><span class="k">Möte</span><span class="v">På platsen enligt bokning</span></div>`;
    }
    if(p.phone) info += `<div class="irow"><span class="k">Telefon</span><span class="v"><a href="tel:${p.phone.replace(/\s/g,'')}" onclick="trackEvent('phone','${jsEsc(p.name)}')">${p.phone}</a></span></div>`;
    if(p.url) info += `<div class="irow"><span class="k">Hemsida</span><span class="v"><a href="${p.url}" target="_blank" rel="noopener" onclick="trackEvent('website','${jsEsc(p.name)}')">Besök hemsidan →</a></span></div>`;
    document.getElementById('platsInfo').innerHTML=info;
    const trav=document.getElementById('platsTravel'); if(trav) trav.innerHTML=travelHTML(p);
    const hrsEl=document.getElementById('platsHours'); if(hrsEl) hrsEl.innerHTML=hoursTableHTML(p);
    const favBtn=document.getElementById('platsFavBtn');
    if(favBtn){const on=favorites.has(p.name);favBtn.classList.toggle('on',on);favBtn.textContent=on?'♥ Sparad':'♡ Spara som favorit';}
    const dir=document.getElementById('platsDir');
    if(dir){
      if(isMappablePlace(p)){
        dir.hidden=false;
        dir.href=`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
        dir.onclick=()=>trackEvent('hitta-hit',p.name);
      } else {
        dir.hidden=true;
        dir.removeAttribute('href');
        dir.onclick=null;
      }
    }
    const evs=eventsByHost[p.name]||[];
    document.getElementById('platsEvent').innerHTML = evs.length
      ? `<div class="plats-ev"><div class="lbl">📅 Händer här</div><h4>${evs[0].title}</h4><div class="when">${evs[0].when}</div><p>${evs[0].note}</p><div class="remind-actions">${remindBtnHTML(evs[0])}</div></div>` : '';
    document.getElementById('platsHook').innerHTML = sourcesHTML(p) + (p.url
      ? ""
      : `<div style="margin-top:12px">Äger du den här verksamheten och saknar hemsida? <a href="https://www.fvno.se/" target="_blank" rel="noopener" onclick="trackEvent('hook-formverket','${jsEsc(p.name)}')">Synas bättre →</a></div>`);
    showView('plats');
    const slug=placeSlug(p.name);
    let mode=opts.historyMode;
    if(!mode){
      const cur=new URLSearchParams(location.search).get("plats");
      // Same slug already in URL → replace; otherwise push (incl. place→place so back returns to previous place)
      mode=(cur===slug)?"replace":"push";
    }
    syncPlatsUrl(slug, mode);
    setTimeout(async ()=>{
      try{ await ensureLeaflet(); }catch(e){ console.warn(e); return; }
      if(!miniMap){
        miniMap=L.map('miniMap',{zoomControl:false,scrollWheelZoom:false,dragging:true,attributionControl:false}).setView([p.lat,p.lng],15);
        addBasemap(miniMap);
      } else { miniMap.setView([p.lat,p.lng],15); miniMap.eachLayer(l=>{if(l instanceof L.Marker)miniMap.removeLayer(l);}); }
      L.marker([p.lat,p.lng],{icon:pinIcon(p.color,'')}).addTo(miniMap);
      miniMap.invalidateSize();
    },80);
    trackEvent('view-place',p.name);
  }
  function currentViewId(){
    return document.querySelector('.view.on')?.id?.replace(/^view-/,"")||"start";
  }
  function clearPlatsParam(){
    try{
      const url=new URL(location.href);
      if(!url.searchParams.has("plats")) return;
      url.searchParams.delete("plats");
      const view=currentViewId();
      const next=history.state && history.state.uv==="plats"
        ? {uv:"view",view}
        : (history.state && history.state.uv ? history.state : {uv:"view",view});
      history.replaceState(next,"",url.pathname+url.search+url.hash);
      canHistoryBackFromPlats=false;
      platsStackDepth=0;
    }catch(e){}
  }
  /**
   * Leave the place view. If we pushState'd here, pop those entries (so swipe/back
   * isn't left with a stripped ghost URL). Never replaceState-strip a pushed entry.
   */
  function leavePlats(nextView, passOpts={}){
    const target=nextView||lastViewBeforePlats||'start';
    const steps=Math.max(platsStackDepth, canHistoryBackFromPlats ? 1 : 0);
    // fromPopstate must win over passOpts — callers may pass fromPopstate:undefined
    const nextOpts={...passOpts, fromPopstate:true};
    if(steps>0){
      platsClosePending=target;
      platsClosePendingMeta=passOpts;
      canHistoryBackFromPlats=false;
      const depthAtLeave=platsStackDepth;
      platsStackDepth=0;
      // Optimistic UI — don't clearPlatsParam yet (that would ghost the history entry)
      skipClearPlatsParam=true;
      try{ showView(target, nextOpts); }finally{ skipClearPlatsParam=false; }
      if(depthAtLeave>1) history.go(-depthAtLeave);
      else history.back();
      return;
    }
    platsClosePendingMeta=null;
    clearPlatsParam();
    showView(target, nextOpts);
  }
  function goBackFromPlats(){
    leavePlats(lastViewBeforePlats||'start');
  }
  /** Restore SPA view from history.state / URL (guides, nav, levererar, …). */
  function restoreViewFromHistory(st, fallback){
    const lev=parseLevererarHash();
    if(lev){
      showView('levererar',{fromPopstate:true});
      if(lev.id) setTimeout(()=>scrollToLevererarMoment(lev.id),80);
      return;
    }
    if(st?.uv==="view" && st.view){
      if(st.view==="guide" && st.guide){
        openGuide(st.guide,{historyMode:"none"});
        return;
      }
      if(st.view==="portratt" && st.portrait){
        openPortrait(st.portrait,{historyMode:"none"});
        return;
      }
      if(st.view==="verksamhet" && st.verksamhet){
        openProducer(st.verksamhet,{historyMode:"none",fromPopstate:true});
        return;
      }
      if(st.view==="kategori" && st.category){
        currentCategory=CATEGORIES[st.category]?st.category:currentCategory;
      }
      showView(st.view,{fromPopstate:true});
      return;
    }
    showView(fallback||'start',{fromPopstate:true});
  }
  function onAppPopState(){
    handlingPopstate=true;
    try{
      // Nav / in-app ← asked us to unwind place history to a specific view
      if(platsClosePending!==null){
        const v=platsClosePending;
        const meta=platsClosePendingMeta||{};
        platsClosePending=null;
        platsClosePendingMeta=null;
        canHistoryBackFromPlats=false;
        platsStackDepth=0;
        if(getPlatsSlugFromLocation()) clearPlatsParam();
        if(!document.getElementById('view-'+v)?.classList.contains('on')){
          skipClearPlatsParam=true;
          try{ showView(v,{...meta, fromPopstate:true}); }finally{ skipClearPlatsParam=false; }
        }
        // Place entry is popped — push/replace verksamhet so reload + back work
        if(v==="verksamhet"){
          const slug=meta.verksamhet||currentProducerSlug;
          if(slug){
            syncViewHistory(
              "verksamhet",
              meta.historyMode==="none"?"replace":"push",
              {verksamhet:slug}
            );
          }
        }
        return;
      }
      const q=getPlatsSlugFromLocation();
      if(q){
        const p=resolvePlaceFromQuery(q);
        if(p){
          openPlace(p.name,{historyMode:"none"});
          return;
        }
      }
      if(isPlatsViewOn()){
        canHistoryBackFromPlats=false;
        platsStackDepth=0;
        skipClearPlatsParam=true;
        try{
          restoreViewFromHistory(history.state, lastViewBeforePlats||'start');
        }finally{ skipClearPlatsParam=false; }
        return;
      }
      // Guide / nav / levererar / category etc.
      restoreViewFromHistory(history.state, 'start');
    }finally{
      handlingPopstate=false;
    }
  }
  window.addEventListener("popstate", onAppPopState);
  function bootPlaceDeepLink(){
    try{
      const q=new URLSearchParams(location.search).get("plats");
      if(!q) return;
      const p=resolvePlaceFromQuery(q);
      if(p) setTimeout(()=>openPlace(p.name,{historyMode:"none"}), 40);
    }catch(e){}
  }

  // ============================================================
  //  BYGDENS RÖSTER — editorial portraits
  // ============================================================
  // Bygdens röster — false = gömd helt (nav/footer/deep links → start)
  const VOICES_ENABLED = false;
  const VOICES_COMING_SOON = true; // kept for when VOICES_ENABLED flips on

  let lastViewBeforePortratt='start';
  let currentPortraitSlug=null;
  function sortedPortraits(){
    return [...portraits]
      .filter(p=>!p.draft)
      .sort((a,b)=>(b.published||"").localeCompare(a.published||""));
  }
  function portraitHeroUrl(pr){
    if(pr.heroImg) return pr.heroImg;
    const place=places.find(p=>p.name===pr.place);
    return place?.img || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&q=75";
  }
  function portraitPersonUrl(pr){
    if(pr.portraitImg) return pr.portraitImg;
    // Reserved slot fallback — replace with real portrait when you have one
    return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=75";
  }
  function portraitMidHTML(pr){
    const src=portraitPersonUrl(pr);
    const isLocal=!!pr.portraitImg && !/^https?:\/\//i.test(pr.portraitImg);
    const isStock=!!pr.portraitImg && /unsplash\.com/i.test(pr.portraitImg);
    const note=!pr.portraitImg || isStock
      ? "Platshållare tills riktigt porträttfoto finns — inte den avbildade personen."
      : (isLocal ? `${pr.role} · ${pr.place}` : `${pr.person} · ${pr.place}`);
    return `<aside class="portratt-mid" aria-label="Porträtt">
      <figure class="shot">
        <img src="${src}" alt="Porträtt — ${pr.place}" loading="lazy" />
      </figure>
      <div class="meta">
        <div class="who">${pr.person}</div>
        <div class="what">${pr.role}</div>
        <div class="note">${note}</div>
      </div>
    </aside>`;
  }
  function renderVoicesHome(){
    const sec=document.getElementById('voicesSec');
    const feature=document.getElementById('voicesFeature');
    const more=document.getElementById('voicesMore');
    if(!sec||!feature) return;
    if(VOICES_COMING_SOON){
      sec.hidden=true; feature.innerHTML=""; if(more){more.hidden=true;more.innerHTML="";} return;
    }
    const list=sortedPortraits();
    if(!list.length){ sec.hidden=true; feature.innerHTML=""; if(more){more.hidden=true;more.innerHTML="";} return; }
    sec.hidden=false;
    const top=list[0];
    const esc=s=>(s||"").replace(/'/g,"\\'");
    const q=top.quote || "";
    feature.innerHTML=`
      <article class="voice-feature">
        <div class="vf-img" style="background-image:url('${portraitHeroUrl(top)}')" role="img" aria-label="${top.person}"></div>
        <div class="vf-body">
          <div class="eyebrow">Intervju</div>
          ${q?`<blockquote class="vf-quote">${q}</blockquote>`:""}
          <h3>${top.person}</h3>
          <div class="role">${top.role} · ${top.place}</div>
          <p class="dek">${top.dek}</p>
          <button type="button" class="read-btn" onclick="openPortrait('${esc(top.slug)}')">Läs porträttet →</button>
        </div>
      </article>`;
    if(more){
      const rest=list.slice(1);
      if(rest.length){
        more.hidden=false;
        more.innerHTML=`<span>Fler röster</span>`+rest.map(pr=>
          `<button type="button" onclick="openPortrait('${esc(pr.slug)}')">${pr.person} — ${pr.role}</button>`
        ).join("");
      } else {
        more.hidden=true; more.innerHTML="";
      }
    }
  }
  function openVoicesNav(){
    if(!VOICES_ENABLED){ showView('start'); return; }
    if(VOICES_COMING_SOON){
      showView('roester');
      return;
    }
    const list=sortedPortraits();
    if(!list.length){ showView('roester'); return; }
    openPortrait(list[0].slug);
  }
  function openPortrait(slug, opts={}){
    if(!VOICES_ENABLED){ showView('start',{fromPopstate:opts.fromPopstate,historyMode:opts.historyMode||"none"}); return; }
    const list=sortedPortraits();
    const pr=list.find(x=>x.slug===slug)||list[0];
    if(!pr) return;
    currentPortraitSlug=pr.slug;
    lastViewBeforePortratt=document.querySelector('.view.on')?.id.replace('view-','')||'start';
    if(lastViewBeforePortratt==='portratt') lastViewBeforePortratt='start';
    const hero=document.getElementById('portrattHero');
    if(hero) hero.style.backgroundImage=`url('${portraitHeroUrl(pr)}')`;
    S('portrattName', pr.person);
    S('portrattRole', `${pr.role} · ${pr.place}`);
    S('portrattDek', pr.dek);
    const bodyEl=document.getElementById('portrattBody');
    const quoteWrap=document.getElementById('portrattQuote');
    const quoteText=document.getElementById('portrattQuoteText');
    const paras=(pr.body||[]).map(t=>`<p>${t}</p>`);
    const mid=portraitMidHTML(pr);
    const qHtml=pr.quote?`<figure class="portratt-quote"><p>${pr.quote}</p></figure>`:"";
    if(bodyEl){
      // Flow: lead paragraphs → quote → portrait → rest of article
      if(paras.length>=2){
        bodyEl.innerHTML=paras.slice(0,2).join("")+qHtml+mid+paras.slice(2).join("");
        if(quoteWrap) quoteWrap.hidden=true;
      } else {
        bodyEl.innerHTML=paras.join("")+qHtml+mid;
        if(pr.quote && quoteText && quoteWrap){
          // quote already in body; keep footer quote hidden
          quoteWrap.hidden=true;
        } else if(quoteWrap) quoteWrap.hidden=true;
      }
    }
    const placeCard=document.getElementById('portrattPlace');
    const place=places.find(p=>p.name===pr.place);
    if(placeCard){
      if(place){
        placeCard.hidden=false;
        S('portrattPlaceName', place.name);
        S('portrattPlaceGo', `Besök ${place.name} →`);
        placeCard.onclick=()=>{ trackEvent('portrait-place', pr.slug); openPlace(place.name); };
      } else placeCard.hidden=true;
    }
    const also=document.getElementById('portrattAlso');
    const alsoLinks=document.getElementById('portrattAlsoLinks');
    const others=list.filter(x=>x.slug!==pr.slug);
    if(also&&alsoLinks){
      if(others.length){
        also.hidden=false;
        alsoLinks.innerHTML=others.map(x=>
          `<button type="button" onclick="openPortrait('${x.slug.replace(/'/g,"\\'")}')">${x.person} — ${x.role}</button>`
        ).join("");
      } else also.hidden=true;
    }
    showView('portratt',{historyMode:opts.historyMode,portrait:pr.slug,fromPopstate:opts.historyMode==="none"});
    trackEvent('view-portrait', pr.slug);
  }
  function goBackFromPortratt(){
    if(history.state?.uv==="view" && history.state?.view==="portratt"){
      history.back();
      return;
    }
    showView(lastViewBeforePortratt||'start');
  }

  // ============================================================
  //  VALLENTUNA LEVERERAR — one chronological stream + id anchors
  // ============================================================
  const MOMENT_FALLBACK="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=75";
  function momentDateISO(m){
    return String(m?.datePublished || m?.published || "").trim();
  }
  /** Display label from datePublished — never store a display string in data. */
  function formatMomentDate(iso){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||"")) return "";
    const d=new Date(iso+"T12:00:00");
    if(Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("sv-SE",{day:"numeric",month:"long",year:"numeric"});
  }
  function momentDateHTML(m){
    const iso=momentDateISO(m);
    const label=formatMomentDate(iso);
    if(!iso||!label) return "";
    return `<time class="moment-date" datetime="${escHtml(iso)}">${escHtml(label)}</time>`;
  }
  function sortedMoments(){
    return [...moments].sort((a,b)=>momentDateISO(b).localeCompare(momentDateISO(a)));
  }
  function momentId(m){
    return (m&&m.id) ? String(m.id) : "";
  }
  function momentImgs(m){
    if(m&&Array.isArray(m.imgs)&&m.imgs.length) return m.imgs.map(u=>String(u).trim()).filter(Boolean);
    const one=(m&&m.img)?String(m.img).trim():"";
    return one ? [one] : [MOMENT_FALLBACK];
  }
  function momentImg(m){
    return momentImgs(m)[0] || MOMENT_FALLBACK;
  }
  function escHtml(s){
    return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  /** Optional credit under place copy — empty when `tipsare` is missing. */
  function tipsareCreditHTML(p){
    const tip=(p?.tipsare||"").trim();
    if(!tip) return "";
    return `<p class="tipsare-credit">Tipsat av ${escHtml(tip)}</p>`;
  }
  function momentBodyHTML(body){
    const parts=String(body||"").trim().split(/\n+/).filter(Boolean);
    if(!parts.length) return "";
    return parts.map(p=>`<p>${escHtml(p)}</p>`).join("");
  }
  function momentExcerpt(body,max){
    const t=String(body||"").replace(/\s+/g," ").trim();
    if(t.length<=max) return t;
    const cut=t.slice(0,max);
    const i=cut.lastIndexOf(" ");
    return (i>40?cut.slice(0,i):cut).trim()+"…";
  }
  function openLightbox(src){
    const box=document.getElementById('imgLightbox');
    const img=document.getElementById('imgLightboxImg');
    if(!box||!img||!src) return;
    img.src=src;
    img.alt="";
    box.hidden=false;
    box.classList.add('on');
    document.body.style.overflow='hidden';
  }
  function closeLightbox(){
    const box=document.getElementById('imgLightbox');
    const img=document.getElementById('imgLightboxImg');
    if(!box) return;
    box.classList.remove('on');
    box.hidden=true;
    if(img) img.src="";
    document.body.style.overflow='';
  }
  document.getElementById('imgLightbox')?.addEventListener('click',(ev)=>{
    if(ev.target.id==='imgLightbox' || ev.target.classList.contains('lb-close')) closeLightbox();
  });
  document.addEventListener('keydown',(ev)=>{ if(ev.key==='Escape') closeLightbox(); });

  function momentExtrasHTML(m){
    const imgs=momentImgs(m);
    const extras=imgs.slice(1);
    if(!extras.length) return "";
    return `<div class="moment-extras">${extras.map(src=>
      `<button type="button" class="thumb" onclick="openLightbox('${escHtml(src)}')" aria-label="Visa större bild">
        <img src="${escHtml(src)}" alt="" loading="lazy" />
      </button>`
    ).join("")}</div>`;
  }
  function momentCardHTML(m){
    const id=momentId(m);
    const anchor=id?` id="moment-${escHtml(id)}"`:"";
    const hero=momentImg(m);
    const dateBit=momentDateHTML(m);
    return `<article class="moment"${anchor}>
      ${dateBit}
      <h2>${escHtml(m.title)}</h2>
      <button type="button" class="moment-hero" onclick="openLightbox('${escHtml(hero)}')" aria-label="Visa större bild">
        <img src="${escHtml(hero)}" alt="" loading="lazy" />
      </button>
      <div class="moment-body">${momentBodyHTML(m.body)}</div>
      ${momentExtrasHTML(m)}
      <p class="moment-sign">Vallentuna levererar.</p>
    </article>`;
  }
  function openLevererarMoment(id){
    const slug=id||"";
    // pushState via showView (not location.hash=) so we get one history entry, not two
    showView('levererar',{moment:slug,setLevererarHash:true});
    setTimeout(()=>scrollToLevererarMoment(slug),60);
  }
  function scrollToLevererarMoment(id){
    if(!id) return;
    const el=document.getElementById('moment-'+id);
    if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function parseLevererarHash(){
    const h=location.hash.slice(1);
    if(!h) return null;
    if(h==="levererar") return {view:true,id:""};
    if(h.startsWith("levererar=")) return {view:true,id:decodeURIComponent(h.slice(10))};
    // Also accept bare #moment-<id>
    if(h.startsWith("moment-")) return {view:true,id:h.slice(7)};
    return null;
  }
  function applyLevererarHash(){
    const parsed=parseLevererarHash();
    if(!parsed) return false;
    showView('levererar',{fromPopstate:true});
    if(parsed.id) setTimeout(()=>scrollToLevererarMoment(parsed.id),80);
    return true;
  }
  function renderLevererarHome(){
    const sec=document.getElementById('levererarSec');
    const host=document.getElementById('levererarTeaser');
    if(!sec||!host) return;
    const list=sortedMoments();
    if(!list.length){ sec.hidden=true; host.innerHTML=""; return; }
    sec.hidden=false;
    const m=list[0];
    const id=momentId(m);
    const dateBit=momentDateHTML(m);
    host.innerHTML=`
      <article class="levererar-latest" onclick="openLevererarMoment('${escHtml(id)}')" role="button" tabindex="0"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLevererarMoment('${escHtml(id)}')}">
        <div class="ll-img" style="background-image:url('${escHtml(momentImg(m))}')" role="img" aria-hidden="true"></div>
        <div class="ll-body">
          <div class="eyebrow">Senaste inlägget${dateBit?` · ${dateBit}`:""}</div>
          <h3>${escHtml(m.title)}</h3>
          <p>${escHtml(momentExcerpt(m.body,200))}</p>
          <span class="more-link">Läs mer →</span>
        </div>
      </article>`;
  }
  function renderLevererarView(){
    const stream=document.getElementById('levererarStream');
    if(!stream) return;
    const list=sortedMoments();
    if(!list.length){
      stream.innerHTML=`<div class="levererar-empty">Inga ögonblick här ännu.<span class="hint">Kom tillbaka snart — bygden levererar alltid något.</span></div>`;
      return;
    }
    stream.innerHTML=list.map(momentCardHTML).join("");
  }
  window.addEventListener('hashchange',()=>{
    if(handlingPopstate) return;
    const parsed=parseLevererarHash();
    if(!parsed){
      // Hash cleared (often via back) — leave levererar if still showing it
      if(document.getElementById('view-levererar')?.classList.contains('on')){
        showView('start',{fromPopstate:true});
      }
      return;
    }
    applyLevererarHash();
  });

  /** Sync SPA view into history so browser back/swipe restores it (not only plats). */
  function syncViewHistory(v, mode, meta={}){
    try{
      const url=new URL(location.href);
      url.searchParams.delete("plats");
      if(v==="verksamhet"){
        const slug=meta.verksamhet || currentProducerSlug;
        if(slug) url.searchParams.set("verksamhet", slug);
        else url.searchParams.delete("verksamhet");
      } else {
        url.searchParams.delete("verksamhet");
      }
      if(v==="levererar" && (meta.setLevererarHash || meta.moment!=null)){
        url.hash=meta.moment ? `levererar=${encodeURIComponent(meta.moment)}` : "levererar";
      }else if(v!=="levererar"){
        const h=url.hash||"";
        if(h==="#levererar" || h.startsWith("#levererar=") || h.startsWith("#moment-")){
          url.hash="";
        }
      }
      const state={uv:"view",view:v};
      if(meta.guide) state.guide=meta.guide;
      else if(v==="guide" && currentGuideSlug) state.guide=currentGuideSlug;
      if(meta.category) state.category=meta.category;
      else if(v==="kategori") state.category=currentCategory;
      if(meta.portrait) state.portrait=meta.portrait;
      else if(v==="portratt" && currentPortraitSlug) state.portrait=currentPortraitSlug;
      if(meta.verksamhet) state.verksamhet=meta.verksamhet;
      else if(v==="verksamhet" && currentProducerSlug) state.verksamhet=currentProducerSlug;
      if(meta.moment) state.moment=meta.moment;
      const path=url.pathname+url.search+url.hash;
      if(mode==="push") history.pushState(state,"",path);
      else history.replaceState(state,"",path);
    }catch(e){}
  }

  function showView(v, opts={}){
    if(!VOICES_ENABLED && (v==="roester" || v==="portratt")) v="start";
    opts=opts||{};
    // Leaving plats via nav/logo must pop pushState entries — not replaceState-strip
    // (that leaves a ghost history entry where swipe/back appears to do nothing).
    if(v!=='plats' && !skipClearPlatsParam && !platsClosePending && !opts.fromPopstate && isPlatsViewOn() &&
       (canHistoryBackFromPlats || platsStackDepth>0 || !!getPlatsSlugFromLocation())){
      leavePlats(v, opts);
      return;
    }
    const prev=currentViewId();
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
    const viewEl=document.getElementById('view-'+v);
    if(!viewEl) return;
    viewEl.classList.add('on');
    // Leaving a place must drop ?plats= — otherwise reload re-opens the place
    if(v!=='plats' && !skipClearPlatsParam) clearPlatsParam();
    if(v!=='verksamhet') clearVerksamhetParam();
    if(v!=='kategori') closeUpplevMenu();
    document.querySelectorAll('.nav button[id^="nav-"]').forEach(b=>b.classList.remove('on'));
    const navBtn=document.getElementById('nav-'+v);
    if(navBtn) navBtn.classList.add('on');
    if(v==='start') document.getElementById('nav-start')?.classList.add('on');
    if(v==='portratt' || v==='roester') document.getElementById('nav-roester')?.classList.add('on');
    if(v==='guider' || v==='guide') document.getElementById('nav-guider')?.classList.add('on');
    if(v==='kategori'){
      document.getElementById('nav-upplev')?.classList.add('on');
      document.getElementById('nav-cat-'+currentCategory)?.classList.add('on');
    }
    if(v==='karta'){initMap();setTimeout(()=>map&&map.invalidateSize(),60);}
    if(v==='favoriter') renderFavorites();
    if(v==='sok'){runSearch();setTimeout(()=>document.getElementById('globalSearch')?.focus(),80);}
    if(v==='listor') renderLists();
    if(v==='skicka'){ setTipKind(tipKind||'place'); renderPendingAdmin(); }
    if(v==='kategori') renderCategory();
    if(v==='guider') renderGuidesGrid();
    if(v==='levererar') renderLevererarView();
    trackEvent('view-'+v, '');
    if(v==='start'){
      try{ refreshHeroToday(); }catch(e){}
      try{ renderPicks(); }catch(e){}
      try{ renderGuidesHome(); }catch(e){}
      try{ renderVoicesHome(); }catch(e){}
      try{ renderLevererarHome(); }catch(e){}
      try{ renderHappenHome(); }catch(e){}
      try{ renderRoute(); }catch(e){}
    }
    // Keep scroll position when deep-linking into a moment; otherwise go to top
    const levHash=parseLevererarHash();
    if(!(v==='levererar' && levHash && levHash.id)) window.scrollTo(0,0);

    // SPA history for non-place views (guides, nav, levererar, verksamhet, …)
    // leavePlats→verksamhet syncs after history.back() in onAppPopState (not here —
    // replaceState on the place entry would be discarded by the pop).
    const leavingPlatsToVerksamhet=v==='verksamhet' && (!!platsClosePending || skipClearPlatsParam);
    const silent=opts.fromPopstate || opts.historyMode==="none" || skipClearPlatsParam || !!platsClosePending || !viewHistoryReady;
    if(!silent && v!=='plats' && !leavingPlatsToVerksamhet){
      const mode=opts.historyMode || (prev===v ? "replace" : "push");
      if(prev!==v || mode==="replace" || v==='verksamhet'){
        syncViewHistory(v, mode, opts);
      }
    } else if(v==='verksamhet' && !leavingPlatsToVerksamhet && (opts.historyMode==="none" || opts.fromPopstate) && (opts.verksamhet||currentProducerSlug)){
      syncViewHistory(v, "replace", {verksamhet:opts.verksamhet||currentProducerSlug});
    }
  }
  function filterAndMap(type){
    active=type||'alla';
    showView('karta');
    setTimeout(()=>{if(map){renderFilter();}},80);
  }
  function openOnMap(name){
    showView('karta');
    const mappable=places.filter(isMappablePlace);
    const i=mappable.findIndex(p=>p.name===name);
    if(i>=0){setTimeout(()=>{map.flyTo([mappable[i].lat,mappable[i].lng],16,{duration:.7});setTimeout(()=>markers[i].openPopup(),720);},120);}
  }

  function openProducer(slugOrName, opts={}){
    const pr=producerBySlug(slugOrName) || producers.find(x=>x.name===slugOrName);
    if(!pr) return;
    const slug=producerSlug(pr);
    currentProducerSlug=slug;
    const onV=!!document.getElementById('view-verksamhet')?.classList.contains('on');
    if(!onV) lastViewBeforePlats = document.querySelector('.view.on')?.id.replace('view-','')||'start';
    const hero=document.getElementById('verkHero');
    if(hero) hero.style.backgroundImage=`url('${pr.img}')`;
    S('verkCat', pr.cat||"Producent");
    S('verkName', pr.name);
    S('verkLead', pr.blurb);
    const bodyEl=document.getElementById('verkBody');
    if(bodyEl){
      let body = pr.short && pr.short!==pr.blurb ? `<p>${escHtml(pr.short)}</p>` : "";
      body += `<p class="verk-no-address">Ingen egen butiksadress — se beskrivningen och återförsäljarna nedan. Förbeställning enligt överenskommelse (ingen hemleverans).</p>`;
      body += soldAtHTML(pr.soldAt);
      body += producerGalleryHTML(pr);
      bodyEl.innerHTML=body;
    }
    const info=document.getElementById('verkInfo');
    if(info){
      info.innerHTML=`
        <div class="irow"><span class="k">Kategori</span><span class="v">${escHtml(pr.cat||"Producent")}</span></div>
        <div class="irow"><span class="k">Besök</span><span class="v">Adress saknas — se beskrivning &amp; återförsäljare</span></div>
        ${pr.email?`<div class="irow"><span class="k">E-post</span><span class="v"><a href="mailto:${escHtml(pr.email)}">${escHtml(pr.email)}</a></span></div>`:""}
        ${pr.phone?`<div class="irow"><span class="k">Telefon</span><span class="v"><a href="tel:${escHtml(String(pr.phone).replace(/\s+/g,""))}">${escHtml(pr.phone)}</a></span></div>`:""}
        ${pr.url?`<div class="irow"><span class="k">Hemsida</span><span class="v"><a href="${escHtml(pr.url)}" target="_blank" rel="noopener">Besök hemsidan →</a></span></div>`:""}`;
    }
    const histMode=opts.historyMode || (opts.fromPopstate ? "none" : "push");
    showView('verksamhet',{historyMode:histMode,verksamhet:slug,fromPopstate:opts.fromPopstate});
    trackEvent('view-producer', pr.name);
  }
  function clearVerksamhetParam(){
    try{
      const url=new URL(location.href);
      if(!url.searchParams.has("verksamhet")) return;
      url.searchParams.delete("verksamhet");
      history.replaceState(history.state && history.state.uv ? history.state : {uv:"view",view:currentViewId()},"",url.pathname+url.search+url.hash);
    }catch(e){}
  }
  function bootProducerDeepLink(){
    try{
      const q=new URLSearchParams(location.search).get("verksamhet");
      if(!q) return;
      const pr=producerBySlug(q);
      if(pr) setTimeout(()=>openProducer(producerSlug(pr),{historyMode:"none",fromPopstate:true}), 50);
    }catch(e){}
  }

  try{ if(document.getElementById('eventsFull') && !document.getElementById('eventsFull').children.length) renderEventsFull(); }catch(e){}
  // Seed SPA history before any user tap so nav/guides/levererar can pushState
  try{
    if(!history.state || history.state.uv==null){
      history.replaceState({uv:"view",view:currentViewId()},"",location.pathname+location.search+location.hash);
    }
  }catch(e){}
  viewHistoryReady=true;
  function syncSmultronNav(){
    const show=isSmultronFilterVisible(places);
    document.querySelectorAll("[data-smultron-nav]").forEach(el=>{
      el.hidden=!show;
    });
  }

  function bootSmultronBanner(){
    const banner=document.getElementById("smultronBanner");
    if(!banner) return;
    banner.hidden=false;
    document.getElementById("smultronBannerCta")?.addEventListener("click",()=>{
      setTipKind("smultron");
      showView("skicka");
      trackEvent("smultron-banner-cta","");
    });
  }

  setTimeout(bootSmartPack, 0);
  setTimeout(()=>{ try{ applyLevererarHash(); }catch(e){} }, 20);
  setTimeout(bootPlaceDeepLink, 30);
  setTimeout(bootProducerDeepLink, 35);
  try{ syncSmultronNav(); }catch(e){}
  setTimeout(bootSmultronBanner, 0);

// --- window exports (HTML onclick / SPA nav) ---
Object.assign(window, {
  addCurrentToList,
  approvePending,
  closeEventModal,
  closeLightbox,
  closeReport,
  createList,
  deleteList,
  favorites,
  filterAndMapFromCategory,
  filterEvents,
  goBackFromPlats,
  goBackFromPortratt,
  heroTodayOpenEvent,
  heroTodayOpenSeason,
  heroTodaySeeMore,
  heroSubmitSearch,
  heroGoSearch,
  mobileGo,
  showOpenNowOnMap,
  openCategory,
  openEvent,
  openGuide,
  setGuidesHomeFilter,
  openLevererarMoment,
  openLightbox,
  openList,
  openPlace,
  openProducer,
  openPortrait,
  openRemindChooser,
  openReport,
  openVoicesNav,
  planGuideRoute,
  planRouteFromList,
  removeFromList,
  requestNearMe,
  reshuffleRoute,
  runSearch,
  saveGuideAsList,
  shareList,
  shareWxCard,
  showView,
  setTipKind,
  submitTipForm,
  submitEventForm,
  submitReport,
  toggleFavorite,
  removeFavorite,
  toggleFavFromPlats,
  toggleFavOnly,
  toggleMobileNav,
  toggleOpenNow,
  toggleSearchFilter,
  toggleUpplevMenu,
  trackEvent
});
