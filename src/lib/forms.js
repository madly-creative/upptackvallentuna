import { SITE } from "../data/site.js";

function encodeFields(fields) {
  return Object.entries(fields)
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function buildMailtoUrl(subject, fields) {
  const body = encodeFields(fields);
  return `mailto:${encodeURIComponent(SITE.contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function deliverViaFormspree(formId, subject, fields) {
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

/** Live site: Netlify function → Loopia SMTP or FormSubmit (no browser CORS). */
async function deliverViaNetlifyFunction(subject, fields) {
  const res = await fetch("/.netlify/functions/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ subject, ...fields }),
  });
  if (res.status === 404) {
    const err = new Error("NOT_DEPLOYED");
    err.code = "NOT_DEPLOYED";
    throw err;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Formuläret kunde inte skickas just nu.");
  }
  return {
    channel: data.channel || "api",
    message: data.message || "",
  };
}

/**
 * Deliver tips/reports to SITE.contactEmail (info@ → Loopia).
 * Does NOT auto-open the mail client — caller can offer mailto via buildMailtoUrl.
 */
export async function deliverForm({ kind, subject, fields, persistLocal }) {
  if (typeof persistLocal === "function") persistLocal(fields);

  const formId = kind === "report" ? SITE.forms.report : SITE.forms.event;
  if (formId) {
    return deliverViaFormspree(formId, subject, fields);
  }

  return deliverViaNetlifyFunction(subject, fields);
}
