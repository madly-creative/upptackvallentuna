/**
 * POST /.netlify/functions/stripe-webhook   (anges som endpoint i Stripe → Developers → Webhooks)
 * Lyssnar på: checkout.session.completed, checkout.session.async_payment_succeeded
 *
 * Betald order → order hos Gelato (tryck + leverans). Gelato-ordern får Stripe-sessionens id som
 * orderReferenceId, och id:t sparas på betalningen i Stripe så att en omsänd webhook inte ger dubbelorder.
 *
 * Miljövariabler i Netlify:
 *   STRIPE_SECRET_KEY       samma som checkout
 *   STRIPE_WEBHOOK_SECRET   whsec_… (visas när webhooken skapas i Stripe)
 *   GELATO_API_KEY          Gelato → Developer → API keys. Saknas den loggas ordern bara (mockläge).
 *   GELATO_ORDER_TYPE       "draft" (standard: hamnar som utkast i Gelato, trycks inte) eller "order" (skarpt)
 *   PRINT_BASE_URL          valfri; varifrån Gelato hämtar tryckfilerna. Standard: https://upptackvallentuna.se
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { resolveLine } from "../../src/data/shop.js";
import { PRINT } from "../../src/data/shopPrint.js";

const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const TOLERANCE_S = 300;

/** Stripes signaturkontroll (samma algoritm som stripe-node, utan beroendet). */
export function verifySignature(payload, header, secret, now = Date.now() / 1000) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=").map((s) => s.trim())).filter((a) => a.length === 2 && a[0] !== "v1"));
  const sigs = header.split(",").map((s) => s.trim()).filter((s) => s.startsWith("v1=")).map((s) => s.slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length || Math.abs(now - t) > TOLERANCE_S) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`, "utf8").digest("hex");
  const a = Buffer.from(expected, "hex");
  return sigs.some((s) => {
    const b = Buffer.from(s, "hex");
    return b.length === a.length && timingSafeEqual(a, b);
  });
}

/** "motiv:produkt:antal,…" → validerade rader */
export function decodeCart(str) {
  const lines = String(str || "").split(",").filter(Boolean).map((s) => {
    const [motif, product, qty] = s.split(":");
    return resolveLine({ motif, product, qty: Number(qty) });
  });
  return lines.length && lines.every(Boolean) ? lines : null;
}

function splitName(full) {
  const parts = String(full || "").trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.pop() : "-";
  return { firstName: parts.join(" ") || "-", lastName };
}

/** Stripe Checkout-session → Gelatos orderformat (POST /v4/orders). */
export function gelatoOrder(session, lines, { orderType = "draft", printBase = "https://upptackvallentuna.se" } = {}) {
  const ship = session.collected_information?.shipping_details || session.shipping_details || {};
  const cust = session.customer_details || {};
  const addr = ship.address || cust.address || {};
  const { firstName, lastName } = splitName(ship.name || cust.name);
  return {
    orderType,
    orderReferenceId: session.id,
    customerReferenceId: cust.email || session.id,
    currency: "SEK",
    items: lines.map((l, i) => ({
      itemReferenceId: `${session.id}-${i + 1}`,
      productUid: PRINT[l.productKey].gelato,
      files: PRINT[l.productKey].files(l.motif.slug).map((f) => ({ type: f.type, url: printBase + f.url })),
      quantity: l.qty * (l.product.packOf || 1),
    })),
    shippingAddress: {
      firstName,
      lastName,
      addressLine1: addr.line1 || "",
      addressLine2: addr.line2 || "",
      city: addr.city || "",
      postCode: addr.postal_code || "",
      country: addr.country || "SE",
      email: cust.email || "",
      phone: cust.phone || "",
    },
  };
}

async function stripe(path, key, fetchImpl, form) {
  const res = await fetchImpl(`https://api.stripe.com/v1/${path}`, {
    method: form ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: form ? new URLSearchParams(form) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`stripe ${path} ${res.status} ${data?.error?.message || ""}`);
  return data;
}

export const handler = (event) => webhook(event, fetch);

export async function webhook(event, fetchImpl) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });
  const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || "";
  const sigHeader = event.headers?.["stripe-signature"] || event.headers?.["Stripe-Signature"];
  if (!verifySignature(raw, sigHeader, process.env.STRIPE_WEBHOOK_SECRET)) return json(400, { error: "bad_signature" });

  let evt;
  try { evt = JSON.parse(raw); } catch { return json(400, { error: "bad_json" }); }
  const session = evt.data?.object;
  const relevant = evt.type === "checkout.session.async_payment_succeeded" ||
    (evt.type === "checkout.session.completed" && session?.payment_status === "paid");
  if (!relevant) return json(200, { ignored: evt.type });

  const lines = decodeCart(session.metadata?.cart);
  if (!lines) {
    console.error("webhook: okänd varukorg", session.id, session.metadata?.cart);
    return json(200, { error: "bad_cart" }); // 200: en omsändning blir inte bättre
  }

  const key = process.env.STRIPE_SECRET_KEY;
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  try {
    if (key && piId) {
      const pi = await stripe(`payment_intents/${piId}`, key, fetchImpl);
      if (pi.metadata?.gelato_order_id) return json(200, { duplicate: pi.metadata.gelato_order_id });
    }

    const order = gelatoOrder(session, lines, {
      orderType: process.env.GELATO_ORDER_TYPE === "order" ? "order" : "draft",
      printBase: process.env.PRINT_BASE_URL || process.env.DEPLOY_URL || "https://upptackvallentuna.se",
    });

    const gelatoKey = process.env.GELATO_API_KEY;
    if (!gelatoKey) {
      console.log("webhook (mock, ingen GELATO_API_KEY):", JSON.stringify(order));
      return json(200, { mock: true });
    }
    const res = await fetchImpl("https://order.gelatoapis.com/v4/orders", {
      method: "POST",
      headers: { "X-API-KEY": gelatoKey, "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.id) throw new Error(`gelato ${res.status} ${JSON.stringify(data).slice(0, 300)}`);

    if (key && piId) await stripe(`payment_intents/${piId}`, key, fetchImpl, { "metadata[gelato_order_id]": data.id });
    console.log("gelato order", data.id, "för", session.id);
    return json(200, { gelato: data.id });
  } catch (e) {
    // 500 → Stripe försöker igen (upp till tre dygn). Felet syns i Netlify → Functions → logs.
    console.error("webhook failed", session.id, e.message);
    return json(500, { error: "fulfilment_failed" });
  }
}
