import { test, expect } from "@playwright/test";

/** Distinct from CONFIG.center weather coords so network assertions aren't false positives. */
const NEAR_POS = { latitude: 59.53381, longitude: 18.07842 };
const FAR_POS = { latitude: 59.33, longitude: 18.06 };

async function mockGeo(page, { grant = true, coords = NEAR_POS } = {}) {
  await page.addInitScript(
    ({ grant, coords }) => {
      const pos = {
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: 20,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };
      navigator.geolocation.getCurrentPosition = (success, error) => {
        if (grant) success(pos);
        else if (error) error({ code: 1, message: "denied" });
      };
      window.__umamiTracks = [];
      window.umami = {
        track(name, data) {
          window.__umamiTracks.push({ name, data });
        },
      };
    },
    { grant, coords }
  );
}

test.describe("Nära dig", () => {
  test("default: section shows all places without geolocation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#naraDig")).toBeVisible();
    await expect(page.locator("#naraDigAskBtn")).toBeVisible();
    await expect(page.locator("#naraDigPanel")).toContainText("Alla platser");
    const total = await page.locator("#naraDigPanel .nara-dig-stat").textContent();
    expect(Number(total)).toBeGreaterThan(10);
    await expect(page.locator(".nara-dig-pin").first()).toBeVisible({ timeout: 15_000 });
  });

  test("denied geolocation: keeps all-places map, no alert", async ({ page }) => {
    const dialogs = [];
    page.on("dialog", (d) => {
      dialogs.push(d.message());
      d.dismiss();
    });
    await mockGeo(page, { grant: false });
    await page.goto("/");
    await page.locator("#naraDigAskBtn").click();
    await expect(page.locator("#naraDig")).toBeVisible();
    await expect(page.locator("#naraDigPanel")).toContainText("Alla platser");
    expect(dialogs).toEqual([]);
  });

  test("granted: pans to me, keeps all pins, list toggle, overview resets", async ({ page }) => {
    await mockGeo(page, { grant: true, coords: NEAR_POS });
    await page.goto("/");
    const before = await page.locator("#naraDigPanel .nara-dig-stat").textContent();

    await page.locator("#naraDigAskBtn").click();
    await expect(page.locator("#naraDigPanel")).toContainText("Från din position");
    await expect(page.locator("#naraDigPanel .nara-dig-stat")).toHaveText(before);
    await expect(page.locator("#naraDigAskBtn")).toHaveText("Visa hela kartan");
    await expect(page.locator(".nara-dig-pin").first()).toBeVisible();

    await page.locator('.nara-dig-chip[data-key="fika"]').click();
    await expect(page.locator("#naraDigPanel")).toContainText("Fika & mat");
    await expect(page.locator("#naraDigPanel")).not.toContainText("Butiker");

    await page.locator("#naraDigViewToggle").click();
    await expect(page.locator("#naraDigList")).toBeVisible();
    await expect(page.locator("#naraDigMapWrap")).toBeHidden();
    await page.locator("#naraDigViewToggle").click();
    await expect(page.locator("#naraDigMapWrap")).toBeVisible();
    await expect(page.locator("#naraDigList")).toBeHidden();
    await expect(page.locator("#naraDigList")).not.toHaveClass(/is-visible/);

    await page.locator("#naraDigAskBtn").click();
    await expect(page.locator("#naraDigPanel")).toContainText("Alla platser");
    await expect(page.locator("#naraDigAskBtn")).toHaveText("Använd min position");
  });

  test("far position: still shows full tip count", async ({ page }) => {
    await mockGeo(page, { grant: true, coords: FAR_POS });
    await page.goto("/");
    const before = await page.locator("#naraDigPanel .nara-dig-stat").textContent();
    expect(Number(before)).toBeGreaterThan(0);

    await page.locator("#naraDigAskBtn").click();
    await expect(page.locator("#naraDigPanel")).toContainText("Från din position");
    await expect(page.locator("#naraDigPanel .nara-dig-stat")).toHaveText(before);
    expect(await page.locator(".nara-dig-pin").count()).toBeGreaterThan(5);
  });

  test("karta: tips-summary overlays map on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.evaluate(() => showView("karta"));
    await expect(page.locator("#view-karta")).toHaveClass(/on/);
    await expect(page.locator("#mapSummary")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#mapSummary")).toContainText("tips på kartan");
    const n = await page.locator("#mapSummary .map-summary-n").textContent();
    expect(Number(n)).toBeGreaterThan(10);
    await expect(page.locator("#mapSummary .map-summary-pill").first()).toBeVisible();
    // Summary stays a single strip (no multi-line wrap covering the map)
    const box = await page.locator("#mapSummary").boundingBox();
    expect(box?.height ?? 99).toBeLessThan(72);
  });

  test("network: no visitor position payload to Umami or any backend", async ({ page }) => {
    const lat = String(NEAR_POS.latitude);
    const lng = String(NEAR_POS.longitude);
    const suspicious = [];

    page.on("request", (req) => {
      const url = req.url();
      const post = req.postData() || "";
      const blob = `${url}\n${post}`;
      if (!blob.includes(lat) && !blob.includes(lng)) return;
      suspicious.push({ url, method: req.method(), post: post.slice(0, 200) });
    });

    await mockGeo(page, { grant: true });
    await page.goto("/");
    await page.locator("#naraDigAskBtn").click();
    await expect(page.locator("#naraDigPanel")).toContainText("Från din position");
    await page.waitForTimeout(1500);

    expect(suspicious, JSON.stringify(suspicious, null, 2)).toEqual([]);

    const tracks = await page.evaluate(() => window.__umamiTracks || []);
    expect(tracks.filter((t) => /geo/i.test(String(t.name)))).toEqual([]);
    const stored = await page.evaluate(() => JSON.stringify(localStorage));
    expect(stored).not.toContain(lat);
    expect(stored).not.toContain(lng);
  });
});
