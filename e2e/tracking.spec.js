import { test, expect } from "@playwright/test";

/**
 * Trackingkontraktet (docs/trackingplan.md): Umami stubbas, vi läser vad ut.js skickar.
 * Fångar regressionen att SPA-vyer slutar ge egna sidvisningar eller att eventnamn glider.
 */
const STUB = `(() => {
  const s = document.currentScript, site = s.getAttribute('data-website-id');
  const auto = s.getAttribute('data-auto-track') !== 'false';
  const base = () => ({ website: site, hostname: location.hostname, url: location.pathname, title: document.title, referrer: '' });
  const send = (p) => fetch('https://cloud.umami.is/api/send', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type: 'event', payload: p }) });
  window.umami = { track: (o, d) => typeof o === 'function' ? send(o(base())) : send(typeof o === 'string' ? { ...base(), name: o, data: d } : base()) };
  if (auto) window.umami.track();
})();`;

async function capture(page) {
  const sent = [];
  await page.route("https://cloud.umami.is/script.js", (r) => r.fulfill({ contentType: "application/javascript", body: STUB }));
  await page.route("https://cloud.umami.is/api/send", (r) => {
    sent.push(JSON.parse(r.request().postData()).payload);
    r.fulfill({ body: "ok" });
  });
  return sent;
}
const names = (sent) => sent.map((p) => `${p.name || "pageview"} ${p.url}`);

test("SPA: en virtuell sidvisning per vy, sammanfattning, filter och sök", async ({ page }) => {
  const sent = await capture(page);
  await page.goto("/");
  await expect.poll(() => names(sent)).toContain("pageview /");

  await page.evaluate(() => window.showView("hander"));
  await expect.poll(() => names(sent)).toContain("pageview /app/hander");
  // Föregående sida sammanfattas när vyn byts
  expect(sent.find((p) => p.name === "page_summary" && p.data.page === "/")).toBeTruthy();

  await page.locator(".evx-chip:not([data-f='alla'])").first().click();
  await expect.poll(() => sent.find((p) => p.name === "filter")?.data.kind).toBe("evenemang");

  await page.evaluate(() => { document.getElementById("globalSearch").value = "kaffe"; window.showView("sok"); });
  await expect.poll(() => sent.find((p) => p.name === "search")?.data.q, { timeout: 5000 }).toBe("kaffe");

  // Bara de dokumenterade eventnamnen får förekomma
  const allowed = new Set([undefined, "click", "outbound", "search", "filter", "action", "page_summary"]);
  expect(sent.filter((p) => !allowed.has(p.name)).map((p) => p.name)).toEqual([]);
});

test("statisk sida: utgående länk klassas som outbound, inte click", async ({ page }) => {
  const sent = await capture(page);
  await page.goto("/plats/antikladan.html");
  await expect.poll(() => names(sent)).toContain("pageview /plats/antikladan.html");
  const ext = page.locator('a[href^="http"]:not([href*="upptackvallentuna"])').first();
  await ext.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
  await ext.click();
  await expect.poll(() => sent.find((p) => p.name === "outbound")?.data.kind).toBeTruthy();
});
