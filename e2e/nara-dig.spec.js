import { test, expect } from "@playwright/test";

/** Distinct from CONFIG.center weather coords so network assertions aren't false positives. */
const NEAR_POS = { latitude: 59.53381, longitude: 18.07842 };

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
  test("denied geolocation: CTA and section leave the DOM, no alert", async ({ page }) => {
    const dialogs = [];
    page.on("dialog", (d) => {
      dialogs.push(d.message());
      d.dismiss();
    });
    await mockGeo(page, { grant: false });
    await page.goto("/");
    await expect(page.locator("#naraDigCta")).toBeVisible();
    await page.locator("#naraDigAskBtn").click();
    await expect(page.locator("#naraDigRoot")).toHaveCount(0);
    await expect(page.locator("#naraDig")).toHaveCount(0);
    await expect(page.locator("#naraDigCta")).toHaveCount(0);
    expect(dialogs).toEqual([]);
  });

  test("granted: panel summary + filters + list/map toggle", async ({ page }) => {
    await mockGeo(page, { grant: true });
    await page.goto("/");
    await page.locator("#naraDigAskBtn").click();
    await expect(page.locator("#naraDig")).toBeVisible();
    await expect(page.locator("#naraDigPanel")).toContainText("tips för dig");
    await expect(page.locator("#naraDigPanel .nara-dig-stat")).not.toHaveText("0");

    await page.locator('.nara-dig-chip[data-key="fika"]').click();
    await expect(page.locator('.nara-dig-chip[data-key="fika"]')).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    const fikaCount = await page.locator("#naraDigPanel .nara-dig-stat").textContent();
    expect(Number(fikaCount)).toBeGreaterThan(0);
    await expect(page.locator("#naraDigPanel")).toContainText("Fika & mat");
    await expect(page.locator("#naraDigPanel")).not.toContainText("Butiker");

    await page.locator("#naraDigViewToggle").click();
    await expect(page.locator("#naraDigList")).toBeVisible();
    await expect(page.locator("#naraDigMapWrap")).toBeHidden();
    await page.locator("#naraDigViewToggle").click();
    await expect(page.locator("#naraDigMapWrap")).toBeVisible();
  });

  test("network: no visitor position payload to Umami or any backend", async ({ page }) => {
    const lat = String(NEAR_POS.latitude);
    const lng = String(NEAR_POS.longitude);
    const suspicious = [];

    page.on("request", (req) => {
      const url = req.url();
      const post = req.postData() || "";
      const blob = `${url}\n${post}`;
      // Only the mocked visitor coords — not CONFIG.center used by weather.
      if (!blob.includes(lat) && !blob.includes(lng)) return;
      suspicious.push({ url, method: req.method(), post: post.slice(0, 200) });
    });

    await mockGeo(page, { grant: true });
    await page.goto("/");
    await page.locator("#naraDigAskBtn").click();
    await expect(page.locator("#naraDig")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);

    expect(suspicious, JSON.stringify(suspicious, null, 2)).toEqual([]);

    const tracks = await page.evaluate(() => window.__umamiTracks || []);
    expect(tracks.filter((t) => /geo/i.test(String(t.name)))).toEqual([]);
    for (const t of tracks) {
      const raw = JSON.stringify(t);
      expect(raw).not.toContain(lat);
      expect(raw).not.toContain(lng);
    }

    const stored = await page.evaluate(() => JSON.stringify(localStorage));
    expect(stored).not.toContain(lat);
    expect(stored).not.toContain(lng);
  });
});
