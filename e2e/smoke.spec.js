import { test, expect } from "@playwright/test";

test("home loads with hero and today module", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#heroTitle")).toContainText("upptäcka");
  await expect(page.locator("#heroToday")).toBeVisible();
  await expect(page.locator("#wPlace")).toHaveText("Vallentuna");
  await expect(page.locator("#picksGrid")).toBeVisible();
});

test("evenemang SEO page lists calendar", async ({ page }) => {
  await page.goto("/evenemang.html");
  await expect(page.locator("h1")).toContainText("Evenemang");
  await expect(page.getByText("Smaka på Vallentuna")).toBeVisible();
  await expect(page.getByText("Julmarknad i centrum")).toBeVisible();
});

test("integritet page is reachable", async ({ page }) => {
  await page.goto("/integritet.html");
  await expect(page.locator("h1")).toHaveText("Integritet");
  await expect(page.getByText("localStorage")).toBeVisible();
});

test("place SEO page has LocalBusiness schema", async ({ page }) => {
  await page.goto("/plats/vallentuna-stenugnsbageri.html");
  await expect(page.locator("h1")).toContainText("Vallentuna Stenugnsbageri");
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  expect(ld).toContain("FoodEstablishment");
  expect(ld).toContain("Vallentuna Stenugnsbageri");
  await expect(page.getByRole("link", { name: "Byggd av Formverket Norrort" })).toHaveAttribute(
    "href",
    "https://www.fvno.se/"
  );
});

test("map view opens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Öppna kartan" }).click();
  await expect(page.locator("#view-karta")).toHaveClass(/on/);
});

test("guides section and summer guide open", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#nav-guider")).toBeVisible();
  await expect(page.locator("#guidesHomeSec")).toBeVisible();
  await page.locator("#nav-guider").click();
  await expect(page.locator("#view-guider")).toHaveClass(/on/);
  await page.getByRole("button", { name: /perfekt sommarsöndag/i }).click();
  await expect(page.locator("#view-guide")).toHaveClass(/on/);
  await expect(page.locator("#guideTitle")).toContainText("sommarsöndag");
  await expect(page.getByRole("button", { name: "Planera rutten" }).first()).toBeVisible();
});

test("event remind pop and place name with apostrophe", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Gravröset Festival", { exact: true }).first().click();
  await expect(page.locator("#eventModal")).toHaveClass(/on/);
  await page.locator("#eventModalActions").getByRole("button", { name: "Påminn mig" }).click();
  await expect(page.locator("#remindPop")).toHaveClass(/on/);
  await expect(page.locator("#remindGcal")).toHaveAttribute("href", /calendar\.google\.com/);
  await page.locator("#eventModal .em-close").click();

  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await page.getByText("Ellen's Corner", { exact: true }).first().click();
  await expect(page.locator("#view-plats")).toHaveClass(/on/);
  await expect(page.locator("#platsName")).toHaveText("Ellen's Corner");
});

test("browser back closes place without leaving to integritet", async ({ page }) => {
  await page.goto("/integritet.html");
  await expect(page.locator("h1")).toHaveText("Integritet");
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await page.getByText("Jano", { exact: true }).first().click();
  await expect(page.locator("#view-plats")).toHaveClass(/on/);
  await expect(page).toHaveURL(/[?&]plats=jano/);
  await page.goBack();
  await expect(page.locator("#view-plats")).not.toHaveClass(/on/);
  await expect(page).not.toHaveURL(/integritet/);
  await expect(page).toHaveURL(/\/($|\?)/);
});

test("place to place then back restores previous place", async ({ page }) => {
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await page.getByText("Jano", { exact: true }).first().click();
  await expect(page.locator("#platsName")).toHaveText("Jano");
  await page.evaluate(() => window.openPlace("Langhard Lantbruk"));
  await expect(page.locator("#platsName")).toHaveText("Langhard Lantbruk");
  await expect(page).toHaveURL(/plats=langhard-lantbruk/);
  await page.goBack();
  await expect(page.locator("#view-plats")).toHaveClass(/on/);
  await expect(page.locator("#platsName")).toHaveText("Jano");
});
