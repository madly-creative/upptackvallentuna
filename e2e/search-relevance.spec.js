import { test, expect } from "@playwright/test";

test("search bad ranks Kvarnbadet, not kvarn events from note mentions", async ({ page }) => {
  await page.goto("/");
  await page.locator("#heroSearch").fill("bad");
  await page.locator(".hero-search-go").click();
  await expect(page.locator("#view-sok")).toHaveClass(/on/);

  const groups = page.locator(".search-group");
  await expect(groups.first()).toContainText("Platser");

  const firstPlace = page.locator(".s-item").first();
  await expect(firstPlace.locator("h3")).toContainText(/bad/i);

  const body = await page.locator("#searchResults").textContent();
  expect(body).not.toMatch(/Drop-in Väsby kvarn/);
  expect(body).not.toMatch(/Kvarnens dag/);
  expect(body).toMatch(/Kvarnbadet|badplats|Bad/i);
});
