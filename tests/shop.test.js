import { describe, it, expect, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { MOTIFS, PRODUCTS, resolveLine, shippingFor } from "../src/data/shop.js";
import { PRINT } from "../src/data/shopPrint.js";
import { parseCart, sessionParams, checkout, originFrom } from "../netlify/functions/checkout.mjs";
import { verifySignature, decodeCart, gelatoOrder, webhook } from "../netlify/functions/stripe-webhook.mjs";
import { existsSync } from "node:fs";

describe("butikens konfig", () => {
  it("varje produkt har Gelato-koppling och tryckfiler som finns", () => {
    for (const key of Object.keys(PRODUCTS)) {
      expect(PRINT[key]?.gelato, key).toBeTruthy();
      for (const m of MOTIFS) for (const f of PRINT[key].files(m.slug)) expect(existsSync(`public${f.url}`), f.url).toBe(true);
    }
  });
  it("varje motiv har webbilder", () => {
    for (const m of MOTIFS) for (const s of ["720", "1400", "ram-ek", "ram-svart", "ram-vit"])
      expect(existsSync(`public/assets/butik/${m.slug}-${s}.webp`)).toBe(true);
  });
  it("avvisar okända motiv, produkter och konstiga antal", () => {
    expect(resolveLine({ motif: "nej", product: "poster", qty: 1 })).toBeNull();
    expect(resolveLine({ motif: "vasby-kvarn", product: "nej", qty: 1 })).toBeNull();
    expect(resolveLine({ motif: "vasby-kvarn", product: "poster", qty: 0 })).toBeNull();
    expect(resolveLine({ motif: "vasby-kvarn", product: "poster", qty: 1.5 })).toBeNull();
    expect(resolveLine({ motif: "vasby-kvarn", product: "poster", qty: 99 })).toBeNull();
  });
  it("frakt: brev för bara vykort, standard annars, fri över gränsen", () => {
    const vk = [resolveLine({ motif: "vasby-kvarn", product: "vykort", qty: 1 })];
    expect(shippingFor(vk).price).toBe(29);
    const p = [resolveLine({ motif: "vasby-kvarn", product: "poster", qty: 1 })];
    expect(shippingFor(p).price).toBe(79);
    const big = [resolveLine({ motif: "vasby-kvarn", product: "poster-ram-ek", qty: 2 })];
    expect(shippingFor(big).price).toBe(0);
  });
});

describe("checkout", () => {
  beforeEach(() => { delete process.env.STRIPE_SECRET_KEY; });
  it("priser kommer från servern, inte klienten", () => {
    const lines = parseCart([{ motif: "vasby-kvarn", product: "poster", qty: 2, price: 1 }]);
    const p = sessionParams(lines, "https://upptackvallentuna.se");
    expect(p.get("line_items[0][price_data][unit_amount]")).toBe(String(PRODUCTS.poster.price * 100));
    expect(p.get("line_items[0][quantity]")).toBe("2");
    expect(p.get("metadata[cart]")).toBe("vasby-kvarn:poster:2");
    expect(p.get("success_url")).toContain("{CHECKOUT_SESSION_ID}");
  });
  it("mockläge utan nyckel", async () => {
    const r = await checkout({ httpMethod: "POST", headers: {}, body: JSON.stringify({ items: [{ motif: "vasby-kvarn", product: "poster", qty: 1 }] }) });
    expect(JSON.parse(r.body)).toMatchObject({ mock: true, url: "https://upptackvallentuna.se/butik.html?order=mock" });
  });
  it("ogiltig varukorg ger 400", async () => {
    const r = await checkout({ httpMethod: "POST", headers: {}, body: JSON.stringify({ items: [{ motif: "x", product: "poster", qty: 1 }] }) });
    expect(r.statusCode).toBe(400);
  });
  it("okänd origin faller tillbaka till produktion", () => {
    expect(originFrom({ origin: "https://evil.example" })).toBe("https://upptackvallentuna.se");
    expect(originFrom({ origin: "https://deploy-preview-90--upptackvallentuna.netlify.app" })).toBe("https://deploy-preview-90--upptackvallentuna.netlify.app");
  });
});

describe("stripe-webhook", () => {
  const secret = "whsec_test";
  const sign = (body, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
  const session = {
    id: "cs_test_1", payment_status: "paid", payment_intent: "pi_1",
    metadata: { cart: "vasby-kvarn:poster-ram-ek:1,vallentuna-kyrka:vykort:2" },
    customer_details: { email: "a@b.se", name: "Anna Andersson", phone: "+4670" },
    collected_information: { shipping_details: { name: "Anna Andersson", address: { line1: "Storgatan 1", city: "Vallentuna", postal_code: "18630", country: "SE" } } },
  };

  it("verifierar signatur och avvisar fel/gammal", () => {
    expect(verifySignature("x", sign("x"), secret)).toBe(true);
    expect(verifySignature("y", sign("x"), secret)).toBe(false);
    expect(verifySignature("x", sign("x", 1000), secret)).toBe(false);
  });
  it("bygger Gelato-order: adress, filer, vykort i 4-pack", () => {
    const o = gelatoOrder(session, decodeCart(session.metadata.cart));
    expect(o.orderType).toBe("draft");
    expect(o.orderReferenceId).toBe("cs_test_1");
    expect(o.shippingAddress).toMatchObject({ firstName: "Anna", lastName: "Andersson", postCode: "18630", country: "SE" });
    expect(o.items[0].productUid).toBe(PRINT["poster-ram-ek"].gelato);
    expect(o.items[0].files[0].url).toMatch(/^https:\/\/upptackvallentuna\.se\/tryck\/.+vasby-kvarn-50x70\.jpg$/);
    expect(o.items[1].quantity).toBe(8);
  });
  it("betald session → Gelato-anrop, id sparas på betalningen", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    process.env.GELATO_API_KEY = "g";
    const calls = [];
    const fetchImpl = async (url, opts = {}) => {
      calls.push([url, opts.method || "GET"]);
      if (url.includes("payment_intents") && (opts.method || "GET") === "GET") return new Response(JSON.stringify({ metadata: {} }));
      if (url.includes("gelato")) return new Response(JSON.stringify({ id: "g_1" }));
      return new Response("{}");
    };
    const body = JSON.stringify({ type: "checkout.session.completed", data: { object: session } });
    const r = await webhook({ httpMethod: "POST", headers: { "stripe-signature": sign(body) }, body }, fetchImpl);
    expect(JSON.parse(r.body)).toEqual({ gelato: "g_1" });
    expect(calls.map((c) => c[1] + " " + c[0].split("/").slice(2, 5).join("/"))).toEqual([
      "GET api.stripe.com/v1/payment_intents", "POST order.gelatoapis.com/v4/orders", "POST api.stripe.com/v1/payment_intents",
    ]);
  });
  it("redan skickad order skickas inte igen", async () => {
    const fetchImpl = async (url) => new Response(JSON.stringify(url.includes("payment_intents") ? { metadata: { gelato_order_id: "g_1" } } : {}));
    const body = JSON.stringify({ type: "checkout.session.completed", data: { object: session } });
    const r = await webhook({ httpMethod: "POST", headers: { "stripe-signature": sign(body) }, body }, fetchImpl);
    expect(JSON.parse(r.body)).toEqual({ duplicate: "g_1" });
  });
  it("obetald (t.ex. väntande) session ignoreras", async () => {
    const body = JSON.stringify({ type: "checkout.session.completed", data: { object: { ...session, payment_status: "unpaid" } } });
    const r = await webhook({ httpMethod: "POST", headers: { "stripe-signature": sign(body) }, body }, async () => new Response("{}"));
    expect(JSON.parse(r.body).ignored).toBeTruthy();
  });
});
