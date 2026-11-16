import { test, expect } from "@playwright/test";

test("Hökeriet appears under Handla lokalt", async ({ page }) => {
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await expect(page.locator("#view-kategori")).toHaveClass(/on/);
  await expect(page.locator("#view-kategori")).toContainText("Hökeriet");
});

test("Orkesta Granby Gård also appears under Handla lokalt", async ({ page }) => {
  await page.goto("/");
  await page.locator(".quick-paths").getByRole("button", { name: "Handla lokalt" }).click();
  await expect(page.locator("#view-kategori")).toHaveClass(/on/);
  await expect(page.locator("#view-kategori")).toContainText("Orkesta Granby Gård");
});

test("Sommarbuffé på Hökeriet is listed in calendar", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hero-chip", { hasText: "Evenemang" }).click();
  await expect(page.locator("#view-hander")).toHaveClass(/on/);
  await expect(page.locator("#eventsFull")).toContainText("Sommarbuffé på Hökeriet");
});
