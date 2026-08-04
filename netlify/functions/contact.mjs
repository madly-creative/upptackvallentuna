/**
 * POST /.netlify/functions/contact
 * Body: { subject, ...fields }
 *
 * Delivers to CONTACT_EMAIL (default info@upptackvallentuna.se):
 * 1. Loopia SMTP when SMTP_PASS is set in Netlify env
 * 2. Else FormSubmit.co server-side (first send needs activation mail)
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

async function sendViaSmtp(subject, fields) {
  const user = process.env.SMTP_USER || CONTACT;
  const pass = process.env.SMTP_PASS;
  if (!pass) return null;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.loopia.se",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
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
  return { channel: "smtp" };
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

    const smtp = await sendViaSmtp(subject, fields);
    if (smtp) {
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ ok: true, ...smtp }) };
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
