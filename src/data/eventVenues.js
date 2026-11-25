/**
 * Platser där evenemangen hålls — används för `location` i Event-schemat.
 * Varje evenemang i events.js pekar hit med `venue: "<id>"`.
 *
 * Fyll bara i gatuadress/postnummer som är belagda (arrangörens sida,
 * evenemangstexten eller en källa). Hellre ort utan gata än en gissad gata.
 * `place` = namn i places.js → ger koordinater och länk till platssidan.
 */
export const EVENT_VENUES = {
  "vallentuna-teater": { name: "Vallentuna Teater", streetAddress: "Gymnasievägen 4B", addressLocality: "Vallentuna" },
  "vallentuna-kulturhus": { name: "Vallentuna Kulturhus", streetAddress: "Allévägen 1", addressLocality: "Vallentuna", place: "Vallentuna Kulturhus" },
  hokeriet: { name: "Hökeriet, Orkesta Granby Gård", streetAddress: "Granby", postalCode: "186 94", addressLocality: "Vallentuna", place: "Hökeriet" },
  "orkesta-bygdegard": { name: "Orkesta Bygdegård, Lindholmen", streetAddress: "Lindholmsvägen 245", addressLocality: "Lindholmen" },
  "vasby-kvarn": { name: "Väsby kvarn vid Kvarnbadet", addressLocality: "Vallentuna" },
  "vallentuna-ishall": { name: "Vallentuna Ishall", streetAddress: "Parkvägen 3", addressLocality: "Vallentuna" },
  "vallentuna-ip": { name: "Vallentuna IP", addressLocality: "Vallentuna" },
  "vallentuna-kyrka": { name: "Vallentuna kyrka", addressLocality: "Vallentuna", place: "Vallentuna kyrka" },
  "karsta-kyrka": { name: "Kårsta kyrka", streetAddress: "Kårstaby 9", addressLocality: "Kårsta" },
  "vada-kyrka": { name: "Vada kyrka", addressLocality: "Vada" },
  "tuna-torg": { name: "Tuna Torg, Vallentuna centrum", streetAddress: "Tuna Torg", addressLocality: "Vallentuna" },
  "langhard-lantbruk": { name: "Langhard Lantbruk", streetAddress: "Lena 50", addressLocality: "Markim", place: "Langhard Lantbruk" },
  "rosendalsskolan-sodra": { name: "Rosendalsskolan Södra", streetAddress: "Teknikvägen 25", addressLocality: "Vallentuna" },
  "rosenlundsvagen-14": { name: "Trädgården på Rosenlundsvägen 14", streetAddress: "Rosenlundsvägen 14", addressLocality: "Vallentuna" },
  solglantan: { name: "Solgläntans kattpensionat och katthem", streetAddress: "Grävelsta 16", addressLocality: "Vallentuna" },
  "ekskogens-bygdegard": { name: "Kårsta-Ekskogens bygdegård", addressLocality: "Ekskogen" },
  "frosunda-station": { name: "Frösunda station", addressLocality: "Frösunda" },
  "karsta-bibliotek": { name: "Kårsta bibliotek", addressLocality: "Kårsta" },
  "karby-bibliotek": { name: "Karby bibliotek", addressLocality: "Brottby" },
  svista: { name: "Svista", addressLocality: "Brottby" },
  angarn: { name: "Angarns Bio", addressLocality: "Angarn" },
  konstrundan: { name: "Öppna ateljéer i Täby och Vallentuna", addressLocality: "Vallentuna" },
  "vallentuna-kommun": { name: "Flera platser i Vallentuna", addressLocality: "Vallentuna" },
};
