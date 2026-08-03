/** Site-wide config — set VITE_FORM_* in .env for live form delivery */
export const SITE = {
  name: "Upptäck Vallentuna",
  url: "https://upptackvallentuna.se",
  locale: "sv_SE",
  kommun: "Vallentuna",
  region: "Norrort",
  center: [59.5345, 18.077],
  zoom: 14,
  /** Public contact for tips (shown on integritet / om). Override via env. */
  contactEmail: (import.meta.env && import.meta.env.VITE_CONTACT_EMAIL) || "tips@upptackvallentuna.se",
  /** Formspree form IDs (https://formspree.io) — empty = mailto fallback */
  forms: {
    event: (import.meta.env && import.meta.env.VITE_FORMSPREE_EVENT) || "",
    report: (import.meta.env && import.meta.env.VITE_FORMSPREE_REPORT) || "",
  },
  defaultOgImage: "/assets/hero/1.webp",
  /** Umami Cloud analytics (cookieless). Empty string disables the script in SEO pages. */
  umamiWebsiteId: "f52ab92f-5136-450c-b9b7-cef84fe73c02",
};
