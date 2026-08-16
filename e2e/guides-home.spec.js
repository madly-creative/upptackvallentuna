import { test, expect } from "@playwright/test";

test.describe("Guides home section", () => {
  test("shows editorial header, filters, and three cards", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const sec = page.locator("#guidesHomeSec");
    await expect(sec).toBeVisible();
    await expect(sec.locator("#guidesHomeTitle")).toContainText("Färdiga guider");
    await expect(sec.locator(".guides-flora img")).toBeVisible();
    await expect(sec.locator(".guides-home-chip")).toHaveCount(6);
    await expect(sec.locator(".guides-home-chip.on")).toContainText("Populära");
    await expect(sec.locator(".guide-home-card")).toHaveCount(3);
    await expect(sec.locator(".stops-pill").first()).toBeVisible();
    await expect(sec.locator(".guide-home-card .tag").first()).toBeVisible();
    await expect(sec.getByText("bilvänlig")).toHaveCount(0);
    await expect(sec.locator(".guide-home-card .arrow").first()).toBeVisible();
  });

  test("theme filter updates cards", async ({ page }) => {
    await page.goto("/");
    await page.locator("#guidesHomeFilters").getByRole("tab", { name: "Med barn" }).click();
    await expect(page.locator("#guidesHomeFilters .guides-home-chip.on")).toContainText("Med barn");
    await expect(page.locator("#guidesHomeTeaser .guide-home-card").first()).toContainText("barn");
  });
});
