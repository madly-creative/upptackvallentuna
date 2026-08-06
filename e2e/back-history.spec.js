import { test, expect } from "@playwright/test";

test("in-app back closes place and restores category", async ({ page }) => {
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await expect(page.locator("#view-kategori")).toHaveClass(/on/);
  await page.getByText("Jano", { exact: true }).first().click();
  await expect(page.locator("#view-plats")).toHaveClass(/on/);
  await expect(page).toHaveURL(/plats=jano/);
  await page.locator("#view-plats button.back").click();
  await expect(page.locator("#view-plats")).not.toHaveClass(/on/);
  await expect(page.locator("#view-kategori")).toHaveClass(/on/);
  await expect(page).not.toHaveURL(/plats=/);
});

test("browser back from place restores category not start blank", async ({ page }) => {
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await page.getByText("Jano", { exact: true }).first().click();
  await expect(page.locator("#view-plats")).toHaveClass(/on/);
  await page.goBack();
  await expect(page.locator("#view-plats")).not.toHaveClass(/on/);
  await expect(page.locator("#view-kategori")).toHaveClass(/on/);
});

test("history length: open place adds one entry", async ({ page }) => {
  await page.goto("/");
  const before = await page.evaluate(() => history.length);
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await page.getByText("Jano", { exact: true }).first().click();
  await expect(page.locator("#view-plats")).toHaveClass(/on/);
  const after = await page.evaluate(() => history.length);
  const flag = await page.evaluate(() => history.state);
  expect(after).toBeGreaterThanOrEqual(before);
  expect(flag?.pushed).toBe(true);
});

test("nav away from place pops history (no ghost entry)", async ({ page }) => {
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await page.getByText("Jano", { exact: true }).first().click();
  await expect(page.locator("#view-plats")).toHaveClass(/on/);
  await expect(page).toHaveURL(/plats=jano/);

  // Leave via top nav — must pop the place entry, not replaceState-strip it
  await page.getByRole("button", { name: "Evenemang", exact: true }).first().click();
  await expect(page.locator("#view-hander")).toHaveClass(/on/);
  await expect(page).not.toHaveURL(/plats=/);
  const state = await page.evaluate(() => history.state);
  expect(state?.uv).not.toBe("plats");
});

test("in-app ← from place→place returns to category in one tap", async ({ page }) => {
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await page.getByText("Jano", { exact: true }).first().click();
  await expect(page.locator("#platsName")).toHaveText("Jano");
  await page.evaluate(() => openPlace("Ellen's Corner"));
  await expect(page.locator("#platsName")).toHaveText("Ellen's Corner");
  await page.locator("#view-plats button.back").click();
  await expect(page.locator("#view-plats")).not.toHaveClass(/on/);
  await expect(page.locator("#view-kategori")).toHaveClass(/on/);
  await expect(page).not.toHaveURL(/plats=/);
});

test("browser back place→place restores previous place then category", async ({ page }) => {
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await page.getByText("Jano", { exact: true }).first().click();
  await expect(page.locator("#platsName")).toHaveText("Jano");
  await page.evaluate(() => openPlace("Ellen's Corner"));
  await expect(page.locator("#platsName")).toHaveText("Ellen's Corner");
  await page.goBack();
  await expect(page.locator("#platsName")).toHaveText("Jano");
  await page.goBack();
  await expect(page.locator("#view-plats")).not.toHaveClass(/on/);
  await expect(page.locator("#view-kategori")).toHaveClass(/on/);
});
