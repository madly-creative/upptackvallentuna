import { test, expect } from "@playwright/test";

test("träffpunkten and Solgläntans julmarknad open", async ({ page }) => {
  await page.goto("/?plats=traffpunkten-allevagen-10");
  await expect(page.locator("#platsName")).toHaveText("Träffpunkten Allévägen 10");
  await expect(page.locator("#platsBody")).toContainText("traffpunkten@vallentuna.se");
  await expect(page.locator("#platsBody")).toContainText("Karby");
  await expect(page.locator("#platsBody")).toContainText("Kårsta");
  await expect(page.locator("#platsLead")).not.toContainText("Träffpunkterna");
  const copy = await page.locator("#platsLead").innerText() + await page.locator("#platsBody").innerText();
  expect(copy).not.toMatch(/\p{Extended_Pictographic}/u);

  await page.locator("#nav-hander").click();
  await expect(page.locator("#view-hander")).toHaveClass(/on/);
  const card = page.locator("#eventsFull").getByRole("heading", { name: "Solgläntans julmarknad" });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(page.locator("#eventModal")).toHaveClass(/on/);
  await expect(page.locator("#eventModal")).toContainText("12");
  await expect(page.locator("#eventModal")).toContainText("Grävelsta 16");
  await expect(page.locator("#eventModal")).toContainText("glögg");
});
