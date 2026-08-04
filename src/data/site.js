/** Site-wide config — set VITE_FORM_* in .env for live form delivery */
export const SITE = {
  name: "Upptäck Vallentuna",
  url: "https://upptackvallentuna.se",
  locale: "sv_SE",
  kommun: "Vallentuna",
  region: "Norrort",
  center: [59.5345, 18.077],
  zoom: 14,
  /** Public contact — tips & reports land in this inbox (Loopia). Override via env. */
  contactEmail: (import.meta.env && import.meta.env.VITE_CONTACT_EMAIL) || "info@upptackvallentuna.se",
  /** Optional Formspree IDs — empty = FormSubmit → contactEmail */
  forms: {
    event: (import.meta.env && import.meta.env.VITE_FORMSPREE_EVENT) || "",
    report: (import.meta.env && import.meta.env.VITE_FORMSPREE_REPORT) || "",
  },
  /** JPG for Facebook/LinkedIn — do not convert to WebP in build. */
  defaultOgImage: "/assets/og.jpg",
  defaultOgImageAlt: "Vallentuna kvarn i kvällsljus vid Vallentunasjön",
  defaultOgImageWidth: 1200,
  defaultOgImageHeight: 630,
  /** Umami Cloud analytics (cookieless). Empty string disables the script in SEO pages. */
  umamiWebsiteId: "f52ab92f-5136-450c-b9b7-cef84fe73c02",
};
