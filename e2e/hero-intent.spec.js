import { test, expect } from "@playwright/test";

test.describe("Classic hero with search", () => {
  test("desktop: greeting hero, today card, search, today-brief", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.locator("#heroTitle")).toContainText("Vad vill du upptäcka idag?");
    await expect(page.locator("#heroGreet")).not.toBeEmpty();
    await expect(page.locator("#heroToday")).toBeVisible();
    await expect(page.locator("#heroSearch")).toBeVisible();
    await expect(page.getByRole("button", { name: "Öppna kartan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Se vad som händer" })).toBeVisible();
    await expect(page.locator("#todayBriefGrid .today-card")).toHaveCount(1);
    await expect(page.locator(".hero-chip")).toHaveCount(0);
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
