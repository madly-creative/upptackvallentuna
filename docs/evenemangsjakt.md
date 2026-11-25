# Veckans evenemangsjakt

En schemalagd körning varje söndag morgon letar upp nya evenemang i Vallentuna, korrläser dem mot källorna och öppnar en PR. Inget går live förrän Juha har granskat och mergat.

## Grundregler

1. **Inget gissas.** Datum, klockslag, plats, pris och beskrivning ska stå i en källa. Saknas något: utelämna det eller flagga det i PR:en.
2. **Minst en källa som är arrangörens egen eller kommunens**, helst två som stämmer överens (t.ex. kommunens kalender + Nortic). Facebook duger som tips men inte som enda källa.
3. **Bilder** bara från arrangören eller kommunens evenemangssida (det bilden publicerats för), eller fritt licensierade (Wikimedia Commons, ange fotograf och licens). Hellre ingen bild än en felaktig eller osäker. Bilder med igenkännbara personer i utsatta grupper (barn i närbild, LSS-verksamhet) läggs inte in utan att Juha säger ja.
4. **Horisont:** de närmaste ca 10 veckorna. Längre fram bara stora evenemang (festivaler, marknader, kända artister).
5. **Urval:** det som är värt en utflykt eller ett besök: konserter, teater, bio, föredrag med namngiven gäst, marknader, festivaler, barnaktiviteter av engångstyp, utställningsinvigningar. Hoppa över veckovisa programpunkter (sagostund, bokfika, läxhjälp, språkcafé, öppen verksamhet) och gudstjänster.
6. **Skicka aldrig något live.** Rutinen öppnar en PR och postar en notis, inget mer.

## Steg för steg

```bash
git fetch origin main && git checkout -B claude/evenemang-ÅÅÅÅ-MM-DD origin/main
npm ci
node scripts/event-leads.mjs            # kandidater ur kommunens kalender, NY = saknas på sajten
node scripts/event-check.mjs --known    # allt som redan finns (för dubblettkoll mot andra källor)
```

1. **Hitta kandidater.** Börja med `event-leads.mjs`. Gå sedan igenom källorna nedan och sök på webben efter sådant som inte står i kommunens kalender.
2. **Korrläs varje kandidat.** `node scripts/event-leads.mjs --page <url>` visar sidans text, externa länkar (t.ex. biljettlänk), Event-schemats datum och delningsbilden. Läs kommunens sida och arrangörens/biljettsidans sida och jämför datum, veckodag, klockslag, plats och pris. Notera varje avvikelse.
3. **Plats.** Återanvänd ett venue-id i `src/data/eventVenues.js`. Ny plats: lägg till med gatuadress bara om den står i en källa.
4. **Bild.** Ta `og:image` från evenemangssidan, konvertera till `public/assets/evenemang/<slug>/cover.webp` (`convert in -strip -quality 82 cover.webp`). Kvadratiska eller små bilder (under ca 1200 px bred) får `imgFit: "native"`.
5. **Skriv in.** Lägg evenemangen i en JSON-fil (samma fält som i events.js plus `body` med HTML för EVENT_CONTENT, där källa och bildkredit står) och kör `node scripts/event-add.mjs nya.json`. `addedDate` sätts till idag.
6. **Kontrollera.** `node scripts/event-check.mjs` stoppar fel veckodag, passerade datum, okända platser, saknade bilder och källor, och varnar för möjliga dubbletter. Rätta alla FEL, bedöm varje OBS.
7. **Bygg.** `npm test && npm run generate:seo && npm run build`. Genererade sidor och sitemap ska med i commiten.
8. **PR.** Öppna en PR mot main med tabellen nedan och posta en kort notis till Juha.

## Källor

| Källa | Hur | Anm. |
| --- | --- | --- |
| Kommunens evenemangskalender (vallentuna.se) | `event-leads.mjs` | Huvudkälla. Kultur Vallentuna, bibliotek, Tuna Bio, kulturskolan. |
| Nortic (nortic.se/ticket/event/…) | `--page`, läs Event-schemat | Andra källa för allt med biljett: Vallentuna Teater, Jano, Mellandagsblues. |
| Svenska kyrkan (Vallentuna, Össeby församlingar) | `--page` på konsertprogram och `svenskakyrkan.se/kalender?eventId=…` | Kalenderlistan renderas med JavaScript; enskilda evenemang och programsidor går att läsa. |
| Hemmaplan Media (hemmaplanmedia.se/event) | `--page` | Marknader på Tuna Torg. |
| Orkesta hembygdsförening (orkestahembygd.se/event) | `--page` | Lindholmen, Orkesta bygdegård. |
| Kårsta-Ekskogens bygdegård (bygdegarden.nu) | `--page` | |
| Hembygd.se (Vallentuna, Össeby m.fl.) | webbsökning / inbyggda webbläsaren | Svarar 403 till skript. |
| Hökeriet (hokeriet.understory.io) | `--page` | Mat- och musikkvällar. |
| Jano (jano.nu), VaDoM, Bluesföreningen | `--page` | |
| vallentuna.info | `--page` | Turistsidan, ofta samma som kommunen. |
| Facebook-evenemang | bara i inbyggda webbläsaren på Juhas Mac om den är nåbar | Endast tips; bekräfta mot en öppen sida. |

Nätverket i molnmiljön släpper igenom värdarna ovan. Blockeras en ny källa: skriv det i PR:en i stället för att gå runt det.

## PR-beskrivning

Rubrik: `Evenemang: N nya (vecka VV)`. Brödtext:

- En tabell per evenemang: datum och tid, titel, plats, **källa 1**, **källa 2**, bild (källa/licens eller "ingen").
- Avsnittet **Att kolla** först: alla avvikelser mellan källor, OBS från `event-check`, osäkra uppgifter, utelämnade bilder och varför.
- Avsnittet **Hoppade över**: kandidater som valdes bort och varför (en rad var).
- Avsnittet **Kunde inte läsas**: källor som var nere eller blockerade.

Hittas inget nytt: öppna ingen PR, posta bara en rad om det.
