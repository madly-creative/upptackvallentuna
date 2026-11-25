import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { handler, cleanEmail, redirectFor } from "../netlify/functions/subscribe.mjs";

const post = (body) => ({ httpMethod: "POST", body: JSON.stringify(body) });
const ENV = { BREVO_API_KEY: "test-key", BREVO_LIST_ID: "7", BREVO_DOI_TEMPLATE_ID: "3" };

describe("subscribe (Brevo double opt-in)", () => {
  let saved;
  beforeEach(() => { saved = { ...process.env }; Object.assign(process.env, ENV); });
  afterEach(() => { process.env = saved; });

  it("normaliserar och validerar e-post", () => {
    expect(cleanEmail("  Anna@Exempel.SE ")).toBe("anna@exempel.se");
    expect(cleanEmail("inte-en-adress")).toBeNull();
    expect(cleanEmail("")).toBeNull();
  });

  it("skickar DOI-förfrågan med lista, mall och källa", async () => {
    let call;
    const fetchImpl = async (url, opts) => { call = { url, opts }; return { status: 201 }; };
    const res = await handler(post({ email: "a@b.se", sec: "nyhetsbrev-om" }), {}, fetchImpl);
    expect(res.statusCode).toBe(200);
    expect(call.url).toMatch(/doubleOptinConfirmation$/);
    expect(call.opts.headers["api-key"]).toBe("test-key");
    const sent = JSON.parse(call.opts.body);
    expect(sent).toMatchObject({ email: "a@b.se", includeListIds: [7], templateId: 3, attributes: { KALLA: "nyhetsbrev-om" } });
    expect(sent.redirectionUrl).toContain("bekraftad=1");
  });

  it("bekräftelselänken går tillbaka till formulärets sajt, bara för egna domäner", () => {
    delete process.env.NEWSLETTER_REDIRECT_URL;
    expect(redirectFor({ origin: "https://deploy-preview-83--upptackvallentuna.netlify.app" }))
      .toBe("https://deploy-preview-83--upptackvallentuna.netlify.app/nyhetsbrev.html?bekraftad=1");
    expect(redirectFor({ origin: "https://upptackvallentuna.se" })).toBe("https://upptackvallentuna.se/nyhetsbrev.html?bekraftad=1");
    expect(redirectFor({ origin: "https://evil.example" })).toBe("https://upptackvallentuna.se/nyhetsbrev.html?bekraftad=1");
    expect(redirectFor({})).toBe("https://upptackvallentuna.se/nyhetsbrev.html?bekraftad=1");
  });

  it("befintlig kontakt (204) räknas som lyckad", async () => {
    const res = await handler(post({ email: "a@b.se" }), {}, async () => ({ status: 204 }));
    expect(res.statusCode).toBe(200);
  });

  it("honeypot svarar ok utan att anropa Brevo", async () => {
    let called = false;
    const res = await handler(post({ email: "a@b.se", website: "spam" }), {}, async () => { called = true; });
    expect(res.statusCode).toBe(200);
    expect(called).toBe(false);
  });

  it("ogiltig adress ger 400", async () => {
    const res = await handler(post({ email: "nope" }), {}, async () => ({ status: 201 }));
    expect(res.statusCode).toBe(400);
  });

  it("saknad nyckel ger 503 not_configured", async () => {
    delete process.env.BREVO_API_KEY;
    const res = await handler(post({ email: "a@b.se" }), {}, async () => ({ status: 201 }));
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body).error).toBe("not_configured");
  });

  it("försöker igen utan attribut om KALLA saknas i Brevo", async () => {
    const bodies = [];
    const fetchImpl = async (_u, o) => {
      bodies.push(JSON.parse(o.body));
      return bodies.length === 1
        ? { status: 400, json: async () => ({ code: "invalid_parameter", message: "Attribute KALLA does not exist" }) }
        : { status: 201 };
    };
    const res = await handler(post({ email: "a@b.se" }), {}, fetchImpl);
    expect(res.statusCode).toBe(200);
    expect(bodies[1].attributes).toBeUndefined();
  });

  it("leverantörsfel ger 502", async () => {
    const res = await handler(post({ email: "a@b.se" }), {}, async () => ({ status: 401, json: async () => ({}) }));
    expect(res.statusCode).toBe(502);
  });
});
