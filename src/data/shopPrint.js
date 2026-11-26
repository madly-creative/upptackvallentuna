/**
 * Bara för servern (stripe-webhook): Gelato-produkter och sökvägar till tryckfilerna.
 * Importera aldrig från webbläsarkod, då hamnar den hemliga mappen i JS-bundeln.
 *
 * productUid verifieras mot Gelatos katalog med `npm run gelato:check` (kräver GELATO_API_KEY).
 */
export const PRINT_DIR = "/tryck/t-ac22eb8ad91d";

const poster = (m) => [{ type: "default", url: `${PRINT_DIR}/${m}-50x70.jpg` }];

export const PRINT = {
  poster: {
    gelato: "flat_500x700-mm-20x28-inch_200-gsm-80lb-uncoated_4-0_ver",
    files: poster,
  },
  "poster-ram-svart": {
    gelato: "framed_poster_mounted_500x700-mm-20x28-inch_black_wood_w20xt20-mm_plexiglass_500x700-mm-20x28-inch_200-gsm-80lb-uncoated_4-0_ver",
    files: poster,
  },
  "poster-ram-vit": {
    gelato: "framed_poster_mounted_500x700-mm-20x28-inch_white_wood_w20xt20-mm_plexiglass_500x700-mm-20x28-inch_200-gsm-80lb-uncoated_4-0_ver",
    files: poster,
  },
  "poster-ram-ek": {
    gelato: "framed_poster_mounted_500x700-mm-20x28-inch_natural-wood_wood_w20xt20-mm_plexiglass_500x700-mm-20x28-inch_200-gsm-80lb-uncoated_4-0_ver",
    files: poster,
  },
  vykort: {
    gelato: "cards_pf_a6_pt_350-gsm-coated-silk_cl_4-4_ver",
    files: (m) => [
      { type: "default", url: `${PRINT_DIR}/${m}-vykort-fram.jpg` },
      { type: "back", url: `${PRINT_DIR}/${m}-vykort-bak.jpg` },
    ],
  },
};
