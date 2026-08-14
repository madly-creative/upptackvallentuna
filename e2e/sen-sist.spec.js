import { test, expect } from "@playwright/test";

const LS_LAST_VISIT = "uv_last_visit";

test.describe("Sen sist du var här", () => {
  test("first visit: no section, bootstraps uv_last_visit", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#todayBrief")).toBeVisible();
    await expect(page.locator("#sinceLast")).toHaveCount(0);
    const stored = await page.evaluate((k) => localStorage.getItem(k), LS_LAST_VISIT);
    expect(stored).toBeTruthy();
    expect(Number.isNaN(Date.parse(stored))).toBe(false);
  });

  test("known visitor without uv_last_visit: no false delta dump", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("vii_favs_v1", JSON.stringify(["Jano"]));
      localStorage.setItem(
        "vii_last_place_v1",
        JSON.stringify({ name: "Jano", at: "2026-07-01T10:00:00.000Z" })
      );
      localStorage.removeItem("uv_last_visit");
    });
    await page.goto("/");
    await expect(page.locator("#sinceLast")).toHaveCount(0);
    const stored = await page.evaluate((k) => localStorage.getItem(k), LS_LAST_VISIT);
    expect(stored).toBeTruthy();
    // Must not have used last_place.at (July) — otherwise Vasakullen etc. would dump
    expect(Date.parse(stored)).toBeGreaterThan(Date.parse("2026-08-01T00:00:00.000Z"));
  });

  test("returning visitor, empty delta: no section and no empty placeholder", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("uv_last_visit", new Date().toISOString());
    });
    await page.goto("/");
    await expect(page.locator("#sinceLast")).toHaveCount(0);
    await expect(page.getByText("Sen sist du var här")).toHaveCount(0);
    await expect(page.getByText(/inga? nytt/i)).toHaveCount(0);
  });

  test("returning visitor with newer content: shows grouped section", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("uv_last_visit", "2026-08-01T12:00:00.000Z");
    });
    await page.goto("/");
    const sec = page.locator("#sinceLast");
    await expect(sec).toBeVisible();
    await expect(sec.getByRole("heading", { name: "Sen sist du var här" })).toBeVisible();
    await expect(sec.getByText(/nya ställen|nytt ställe/)).toBeVisible();
    await expect(sec.getByRole("button", { name: "Vasakullen" })).toBeVisible();
    await expect(sec.getByText(/nya evenemang|nytt evenemang/)).toBeVisible();
  });

  test("uv_last_visit updates across two sessions", async ({ page }) => {
    // Set last visit after first paint so reload is not reset by addInitScript.
    await page.goto("/");
    await page.evaluate((k) => {
      localStorage.setItem(k, "2026-08-01T12:00:00.000Z");
    }, LS_LAST_VISIT);
    await page.reload();
    await expect(page.locator("#sinceLast")).toBeVisible();
    const first = await page.evaluate((k) => localStorage.getItem(k), LS_LAST_VISIT);
    expect(Date.parse(first)).toBeGreaterThan(Date.parse("2026-08-01T12:00:00.000Z"));

    await page.reload();
    await expect(page.locator("#sinceLast")).toHaveCount(0);
    const second = await page.evaluate((k) => localStorage.getItem(k), LS_LAST_VISIT);
    expect(Date.parse(second)).toBeGreaterThanOrEqual(Date.parse(first));
  });

  test("blocked localStorage: app loads, no section, no crash", async ({ page }) => {
    await page.addInitScript(() => {
      const boom = () => {
        throw new DOMException("Denied", "QuotaExceededError");
      };
      const blocked = {
        getItem: boom,
        setItem: boom,
        removeItem: boom,
        clear: boom,
        key: boom,
        length: 0,
      };
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get: () => blocked,
      });
    });
    await page.goto("/");
    await expect(page.locator("#heroTitle")).toContainText("upptäcka");
    await expect(page.locator("#sinceLast")).toHaveCount(0);
  });
});
