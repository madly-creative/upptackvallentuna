/**
 * POST /.netlify/functions/subscribe
 * Body: { email, sec, website }   (website = honeypot, ska vara tomt)
 *
 * Anmälan till nyhetsbrevet med double opt-in via Brevo (EU-hostat, Frankrike/Tyskland).
 * Brevo skickar bekräftelsemejlet; kontakten hamnar på listan först när länken klickats.
 *
 * Miljövariabler i Netlify (Site configuration → Environment variables), aldrig i koden:
 *   BREVO_API_KEY            API-nyckel (Brevo → SMTP & API → API keys)
 *   BREVO_LIST_ID            id på listan "Nyhetsbrev" (siffra)
 *   BREVO_DOI_TEMPLATE_ID    id på bekräftelsemallen (typ "Double opt-in")
 *   NEWSLETTER_REDIRECT_URL  valfri; annars <formulärets origin>/nyhetsbrev.html?bekraftad=1 (prod eller preview)
 */

const BREVO_DOI = "https://api.brevo.com/v3/contacts/doubleOptinConfirmation";
const DEFAULT_REDIRECT = "https://upptackvallentuna.se/nyhetsbrev.html?bekraftad=1";
// Medvetet enkel: Brevo validerar på riktigt, det här stoppar bara uppenbart skräp.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

// Bekräftelselänken ska leda tillbaka till samma sajt som formuläret skickades från
// (produktion eller en deploy preview), annars landar test från en preview på en sida som inte finns än.
const ORIGIN_OK = /^https:\/\/((www\.)?upptackvallentuna\.se|[a-z0-9-]+--upptackvallentuna\.netlify\.app)$/i;

export function redirectFor(headers = {}, fallback = DEFAULT_REDIRECT) {
  if (process.env.NEWSLETTER_REDIRECT_URL) return process.env.NEWSLETTER_REDIRECT_URL;
  const origin = headers.origin || headers.Origin || "";
  return ORIGIN_OK.test(origin) ? `${origin}/nyhetsbrev.html?bekraftad=1` : fallback;
}

export function config() {
  const key = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID);
  if (!key || !listId || !templateId) return null;
  return { key, listId, templateId };
}

export function cleanEmail(raw) {
  const email = String(raw || "").trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

export async function handler(event, _ctx, fetchImpl = fetch) {
  if (event.httpMethod !== "POST") return reply(405, { error: "Method Not Allowed" });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return reply(400, { error: "bad_json" }); }

  // Honeypot ifylld = bot. Svara som vid lyckad anmälan så den inte provar igen.
  if (body.website) return reply(200, { ok: true });

  const email = cleanEmail(body.email);
  if (!email) return reply(400, { error: "invalid_email" });

  const cfg = config();
  if (!cfg) return reply(503, { error: "not_configured" });

  const redirect = redirectFor(event.headers);
  const sec = String(body.sec || "okand").replace(/[^a-z0-9-]/gi, "").slice(0, 32);
  try {
    const res = await fetchImpl(BREVO_DOI, {
      method: "POST",
      headers: { "api-key": cfg.key, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        email,
        includeListIds: [cfg.listId],
        templateId: cfg.templateId,
        redirectionUrl: redirect,
        attributes: { KALLA: sec },
      }),
    });
    // 201 = ny kontakt, 204 = fanns redan (bekräftelsemejl skickas ändå).
    if (res.status === 201 || res.status === 204) return reply(200, { ok: true });
    const data = await res.json().catch(() => ({}));
    console.warn("Brevo DOI", res.status, data.code, data.message);
    // Okänt attribut KALLA ska inte stoppa en anmälan: försök igen utan.
    if (res.status === 400 && /attribute/i.test(data.message || "")) {
      const retry = await fetchImpl(BREVO_DOI, {
        method: "POST",
        headers: { "api-key": cfg.key, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, includeListIds: [cfg.listId], templateId: cfg.templateId, redirectionUrl: redirect }),
      });
      if (retry.status === 201 || retry.status === 204) return reply(200, { ok: true });
    }
    return reply(502, { error: "provider_error" });
  } catch (err) {
    console.error("subscribe error", err);
    return reply(502, { error: "provider_unreachable" });
  }
}
