import { SITE } from "../data/site.js";

/**
 * Send a form payload to Formspree when configured, otherwise open a mailto: draft.
 * Always keeps a localStorage copy via `persistLocal` for offline resilience.
 */
export async function deliverForm({ kind, subject, fields, persistLocal }) {
  if (typeof persistLocal === "function") persistLocal(fields);

  const formId = kind === "report" ? SITE.forms.report : SITE.forms.event;
  if (formId) {
    const endpoint = formId.startsWith("http")
      ? formId
      : `https://formspree.io/f/${formId}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ _subject: subject, ...fields }),
    });
    if (!res.ok) throw new Error("Formuläret kunde inte skickas just nu.");
    return { channel: "formspree" };
  }

  const body = Object.entries(fields)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const mailto = `mailto:${encodeURIComponent(SITE.contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
  return { channel: "mailto" };
}
