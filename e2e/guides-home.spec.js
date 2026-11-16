import { test, expect } from "@playwright/test";

test.describe("Guides home spread", () => {
  test("shows one guide as a spread plus a short list", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const sec = page.locator("#guidesHomeSec");
    await expect(sec).toBeVisible();
    await expect(sec.locator("#guidesHomeTitle")).toHaveText("Vikingaspåret");
    await expect(sec.locator(".guide-spread-eyebrow")).toContainText("Veckans guide");
    await expect(sec.locator(".guide-spread-cta")).toContainText("Läs guiden");
    await expect(sec.locator(".guide-spread-list button")).toHaveCount(3);
    await expect(sec.locator(".guide-spread-list button").last()).toContainText("Alla guider");
    await expect(page.locator("#guidesHomeTeaser")).not.toContainText(/sommar/i);
  });

  test("November spread opens autumn guides", async ({ page }) => {
    await page.goto("/");
    await page.locator("#guidesHomeSec .guide-spread-cta").click();
    await expect(page.locator("#view-guide")).toHaveClass(/on/);
    await expect(page.locator("#guideTitle")).toHaveText("Vikingaspåret");
    await expect(page.locator("#guideStops")).toContainText("Arkils Tingstad");

    await page.goto("/");
    await page.locator("#guidesHomeSec .guide-spread-list button").nth(0).click();
    await expect(page.locator("#guideTitle")).toHaveText("Höst på gården");

    await page.goto("/");
    await page.locator("#guidesHomeSec .guide-spread-list button").nth(1).click();
    await expect(page.locator("#guideTitle")).toHaveText("Centrum på foten");
  });
});
