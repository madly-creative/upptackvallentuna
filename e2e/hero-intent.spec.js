import { test, expect } from "@playwright/test";

test.describe("Classic hero with search", () => {
  test("desktop: film hero, today strip, search + chips, today-brief", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.locator("#heroTitle")).toContainText("Mellan runor och rapsfält.");
    await expect(page.locator("#heroToday")).toBeVisible();
    await expect(page.locator("#heroSearch")).toBeVisible();
    await expect(page.locator("#todayBriefGrid .today-card")).toHaveCount(1);
    await expect(page.locator(".hero-chip")).toHaveCount(4);
    await expect(page.locator(".hero-rail-cell")).toHaveCount(0);
  });

  test("mobile: search submits to search view", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("#heroSearch")).toBeVisible();
    await expect(page.locator("#heroToday")).toBeVisible();
    await page.locator("#heroSearch").fill("loppis");
    await page.locator(".hero-search-go").click();
    await expect(page.locator("#view-sok")).toHaveClass(/on/);
    await expect(page.locator("#globalSearch")).toHaveValue("loppis");
  });
});
