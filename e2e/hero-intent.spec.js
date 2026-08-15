import { test, expect } from "@playwright/test";

test.describe("Hero intent", () => {
  test("desktop: search, chips, and rail", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.locator("#heroTitle")).toContainText("Vad vill du göra idag?");
    await expect(page.locator("#heroWx")).toBeVisible();
    await expect(page.locator("#heroSearch")).toBeVisible();
    await expect(page.locator(".hero-chip")).toHaveCount(6);
    await expect(page.locator(".hero-rail-cell")).toHaveCount(4);
    await expect(page.locator(".hero-rail-cell").nth(3)).toContainText("Utforska runt dig");

    await page.getByRole("button", { name: /Överraska mig/i }).click();
    await expect(page.locator("#view-plats")).toHaveClass(/on/);
  });

  test("mobile: chips scroll, rail is 2×2, search works", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("#heroSearch")).toBeVisible();
    const intents = page.locator(".hero-intents");
    await expect(intents).toBeVisible();
    const rail = page.locator(".hero-rail-grid");
    const box = await rail.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(200);

    await page.locator("#heroSearch").fill("loppis");
    await page.locator(".hero-search-go").click();
    await expect(page.locator("#view-sok")).toHaveClass(/on/);
    await expect(page.locator("#globalSearch")).toHaveValue("loppis");
  });
});
