/**
 * POST /.netlify/functions/checkout
 * Body: { items: [{ motif, product, qty }] }
 * Svar: { url }  → webbläsaren skickas till Stripe Checkout (kort, Klarna, Swish).
 *
 * Priserna läses ALLTID från src/data/shop.js här på servern; klienten skickar bara vad som ska köpas.
 * Betalsätten styrs i Stripe (Settings → Payment methods): slå på Kort, Klarna och Swish där.
 *
 * Miljövariabler i Netlify (Site configuration → Environment variables):
 *   STRIPE_SECRET_KEY   sk_test_… under test, sk_live_… vid go-live. Saknas den körs mockläge:
 *                       ingen betalning, kunden skickas direkt till tack-vyn.
 */
import { SHOP, resolveLine, shippingFor, motifImages } from "../../src/data/shop.js";

const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

const ORIGIN_OK = /^https:\/\/((www\.)?upptackvallentuna\.se|[a-z0-9-]+--upptackvallentuna\.netlify\.app)$|^http:\/\/localhost:\d+$/i;
const PROD = "https://upptackvallentuna.se";

export function originFrom(h = {}) {
  const o = h.origin || h.Origin || "";
  return ORIGIN_OK.test(o) ? o : PROD;
}

/** Varukorg → validerade rader. Ogiltiga rader gör hela köpet ogiltigt (hellre fel än tyst bortfall). */
export function parseCart(items) {
  if (!Array.isArray(items) || !items.length || items.length > 20) return null;
  const lines = items.map(resolveLine);
  return lines.every(Boolean) ? lines : null;
}

/** Kompakt varukorg i Stripe-metadata (max 500 tecken): "motiv:produkt:antal,…" */
export function encodeCart(lines) {
  return lines.map((l) => `${l.motif.slug}:${l.productKey}:${l.qty}`).join(",");
}

/** Bygger formulärparametrarna till Stripe POST /v1/checkout/sessions. */
export function sessionParams(lines, origin) {
  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("locale", "sv");
  p.set("success_url", `${origin}/butik.html?order={CHECKOUT_SESSION_ID}`);
  p.set("cancel_url", `${origin}/butik.html?avbrutet=1`);
  p.set("billing_address_collection", "auto");
  p.set("phone_number_collection[enabled]", "true");
  SHOP.shipTo.forEach((c, i) => p.set(`shipping_address_collection[allowed_countries][${i}]`, c));
  lines.forEach((l, i) => {
    const k = `line_items[${i}]`;
    p.set(`${k}[quantity]`, String(l.qty));
    p.set(`${k}[price_data][currency]`, SHOP.currency);
    p.set(`${k}[price_data][unit_amount]`, String(l.product.price * 100));
    p.set(`${k}[price_data][product_data][name]`, `${l.motif.title} · ${l.product.name}`);
    p.set(`${k}[price_data][product_data][description]`, l.product.short);
    p.set(`${k}[price_data][product_data][images][0]`, `${PROD}${motifImages(l.motif.slug).small}`);
  });
  const ship = shippingFor(lines);
  p.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  p.set("shipping_options[0][shipping_rate_data][display_name]", ship.label);
  p.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(ship.price * 100));
  p.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", SHOP.currency);
  p.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]", "business_day");
  p.set("shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]", "3");
  p.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]", "business_day");
  p.set("shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]", "7");
  const cart = encodeCart(lines);
  p.set("metadata[cart]", cart);
  p.set("payment_intent_data[metadata][cart]", cart);
  return p;
}

export const handler = (event) => checkout(event, fetch);

export async function checkout(event, fetchImpl) {
  if (event.httpMethod !== "POST") return reply(405, { error: "Method Not Allowed" });
  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return reply(400, { error: "bad_json" }); }

  const lines = parseCart(body.items);
  if (!lines) return reply(400, { error: "invalid_cart" });
  const origin = originFrom(event.headers);

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Mockläge: ingen Stripe-nyckel än. Låtsas att köpet gick igenom.
    console.log("checkout (mock)", encodeCart(lines));
    return reply(200, { url: `${origin}/butik.html?order=mock`, mock: true });
  }

  const res = await fetchImpl("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: sessionParams(lines, origin),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    console.error("stripe checkout failed", res.status, data?.error?.message);
    return reply(502, { error: "stripe_failed" });
  }
  return reply(200, { url: data.url });
}

