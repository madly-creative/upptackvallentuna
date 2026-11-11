import { test, expect } from "@playwright/test";

test.describe("Guides home section", () => {
  test("shows editorial header, filters, and three cards", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    const sec = page.locator("#guidesHomeSec");
    await expect(sec).toBeVisible();
    await expect(sec.locator("#guidesHomeTitle")).toContainText("Färdiga guider för alla slags dagar");
    await expect(sec.locator(".guides-home-all")).toBeVisible();
    await expect(sec.locator(".guides-home-chip")).toHaveCount(6);
    await expect(sec.locator(".guides-home-chip.on")).toContainText("Populära");
    await expect(sec.locator("#guidesHomeTeaser .guide-card")).toHaveCount(3);
    await expect(sec.locator("#guidesHomeTeaser .guide-card .lnk").first()).toContainText("Läs guiden");
    await expect(sec.getByText("bilvänlig")).toHaveCount(0);
    await expect(sec.locator(".arrow")).toHaveCount(0);
  });

  test("November home cards are autumn guides", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("#guidesHomeTeaser .guide-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("Höstens vandring");
    await expect(cards.nth(0)).toContainText("Vikingaspåret");
    await expect(cards.nth(1)).toContainText("Skördetid");
    await expect(cards.nth(1)).toContainText("Höst på gården");
    await expect(cards.nth(2)).toContainText("Inomhus");
    await expect(cards.nth(2)).toContainText("Centrum på foten");
    await expect(page.locator("#guidesHomeTeaser")).not.toContainText(/sommar/i);

    await cards.nth(0).click();
    await expect(page.locator("#view-guide")).toHaveClass(/on/);
    await expect(page.locator("#guideSeason")).toContainText("Höst");
    await expect(page.locator("#guideTitle")).toHaveText("Vikingaspåret");
    await expect(page.locator("#guideStops")).toContainText("Arkils Tingstad");
    await expect(page.locator("#guideIntro")).not.toContainText(/sommar/i);

    await page.goto("/");
    await page.locator("#guidesHomeTeaser .guide-card").nth(1).click();
    await expect(page.locator("#guideTitle")).toHaveText("Höst på gården");
    await expect(page.locator("#guideStops")).toContainText("Hökeriet");
    await expect(page.locator("#guideStops")).toContainText("Grävelsta Gård");

    await page.goto("/");
    await page.locator("#guidesHomeTeaser .guide-card").nth(2).click();
    await expect(page.locator("#guideTitle")).toHaveText("Centrum på foten");
    await expect(page.locator("#guideStops")).toContainText("Vallentuna Kulturhus");
    await expect(page.locator("#guideIntro")).not.toContainText(/sommar/i);
  });

  test("theme filter updates cards", async ({ page }) => {
    await page.goto("/");
    await page.locator("#guidesHomeFilters").getByRole("tab", { name: "Med barn" }).click();
    await expect(page.locator("#guidesHomeFilters .guides-home-chip.on")).toContainText("Med barn");
    await expect(page.locator("#guidesHomeTeaser .guide-card").first()).toContainText("barn");
  });
});
