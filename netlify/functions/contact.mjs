/**
 * POST /.netlify/functions/contact
 * Body: { subject, ...fields }
 *
 * Delivers to CONTACT_EMAIL (default info@upptackvallentuna.se):
 * 1. Loopia SMTP when SMTP_PASS is set (mailcluster.loopia.se)
 * 2. Else / on SMTP failure → FormSubmit.co server-side
 */
import nodemailer from "nodemailer";

const CONTACT = process.env.CONTACT_EMAIL || process.env.VITE_CONTACT_EMAIL || "info@upptackvallentuna.se";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

function fieldLines(fields) {
  return Object.entries(fields)
    .filter(([k, v]) => v != null && String(v).trim() !== "" && k !== "subject")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

async function trySmtpOnce({ host, port, secure, user, pass, subject, fields }) {
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    auth: { user, pass },
  });

  const replyTo = fields.email && String(fields.email).includes("@") ? String(fields.email) : undefined;
  await transporter.sendMail({
    from: `"Upptäck Vallentuna" <${user}>`,
    to: CONTACT,
    replyTo,
    subject: subject || "Tips från upptackvallentuna.se",
    text: fieldLines(fields) || "(tomt tips)",
  });
  return { channel: "smtp", host, port };
}

async function sendViaSmtp(subject, fields) {
  const user = process.env.SMTP_USER || CONTACT;
  const pass = process.env.SMTP_PASS;
  if (!pass) return null;

  const host = process.env.SMTP_HOST || "mailcluster.loopia.se";
  const preferPort = Number(process.env.SMTP_PORT || 465);
  const attempts =
    preferPort === 587
      ? [
          { host, port: 587, secure: false },
          { host, port: 465, secure: true },
        ]
      : [
          { host, port: 465, secure: true },
          { host, port: 587, secure: false },
        ];

  let lastErr;
  for (const a of attempts) {
    try {
      return await trySmtpOnce({ ...a, user, pass, subject, fields });
    } catch (err) {
      lastErr = err;
      console.warn(`SMTP ${a.host}:${a.port} failed:`, err.message);
    }
  }
  throw lastErr || new Error("SMTP failed");
}

async function sendViaFormSubmit(subject, fields) {
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(CONTACT)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      _subject: subject || "Tips från upptackvallentuna.se",
      _template: "table",
      _captcha: false,
      ...fields,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false || data.success === "false") {
    const msg = data.message || `FormSubmit HTTP ${res.status}`;
    throw new Error(msg);
  }
  return { channel: "formsubmit", message: data.message || "" };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders() };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const { subject, ...fields } = payload;
    if (!subject && !Object.keys(fields).length) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "Tomt formulär" }) };
    }

    if (process.env.SMTP_PASS) {
      try {
        const smtp = await sendViaSmtp(subject, fields);
        return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true, ...smtp }) };
      } catch (smtpErr) {
        console.warn("SMTP failed, trying FormSubmit:", smtpErr.message);
      }
    }

    const fs = await sendViaFormSubmit(subject, fields);
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true, ...fs }) };
  } catch (err) {
    console.error("contact function error", err);
    return {
      statusCode: 502,
      headers: corsHeaders(),
      body: JSON.stringify({ error: err.message || "Kunde inte skicka mejl" }),
    };
  }
}
