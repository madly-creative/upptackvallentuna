/**
 * Reads built HTML from disk (not via the browser) so crawlers' view is what we assert.
 * Builds dist/ once if the SEO crawl list is missing.
 */
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const distIndex = join(root, "dist/index.html");
const placePage = join(root, "dist/plats/cafe-valkyria.html");

function ensureDist() {
  const ready =
    existsSync(distIndex) &&
    existsSync(placePage) &&
    readFileSync(distIndex, "utf8").includes("seo-crawl-places") &&
    readFileSync(distIndex, "utf8").includes("Café Valkyria");
  if (!ready) {
    execSync("npm run build", { cwd: root, stdio: "inherit" });
  }
}

test.describe("built SEO markup on disk", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    ensureDist();
  });

  test("dist/index.html contains a known place name in raw markup", () => {
    const html = readFileSync(distIndex, "utf8");
    expect(html).toContain("Café Valkyria");
    expect(html).toContain("/plats/cafe-valkyria.html");
    expect(html).toContain("seo-crawl-places");
  });

  test("dist place page has unique title and JSON-LD", () => {
    const html = readFileSync(placePage, "utf8");
    expect(html).toMatch(/<title>Café Valkyria — Upptäck Vallentuna<\/title>/);
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain("FoodEstablishment");
    expect(html).toContain("Café Valkyria");
    expect(html).toContain("openingHoursSpecification");
    expect(html).toContain("https://upptackvallentuna.se/plats/cafe-valkyria.html");
  });
});
