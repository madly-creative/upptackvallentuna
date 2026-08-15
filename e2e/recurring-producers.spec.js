/**
 * Asserts built HTML on disk for recurring activities + producers.
 */
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function ensureDist() {
  const activity = join(root, "dist/aktivitet/socialdans-tisdag.html");
  const producer = join(root, "dist/verksamhet/markims-honung.html");
  if (!existsSync(activity) || !existsSync(producer)) {
    execSync("npm run build", { cwd: root, stdio: "inherit" });
  }
}

test.describe("recurring + producers built markup", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    ensureDist();
  });

  test("exactly one recurring activity page for Socialdans", () => {
    const dir = join(root, "dist/aktivitet");
    const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
    expect(files).toContain("socialdans-tisdag.html");
    const social = files.filter((f) => f.includes("socialdans"));
    expect(social).toHaveLength(1);
    const html = readFileSync(join(dir, "socialdans-tisdag.html"), "utf8");
    expect(html).toContain("Socialdans");
    expect(html).toContain("Varje tisdag");
    // Must not look like a dated one-off flood
    expect(html).not.toMatch(/2026-\d{2}-\d{2}T/);
  });

  test("Roslagsloppis has one Sunday recurring activity page", () => {
    const dir = join(root, "dist/aktivitet");
    const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
    expect(files).toContain("roslagsloppis-sondag.html");
    const loppis = files.filter((f) => f.includes("roslagsloppis"));
    expect(loppis).toHaveLength(1);
    const html = readFileSync(join(dir, "roslagsloppis-sondag.html"), "utf8");
    expect(html).toContain("Roslagsloppis");
    expect(html).toContain("Varje söndag");
    expect(html).not.toMatch(/2026-\d{2}-\d{2}T/);
  });

  test("producer pages have no address/geo markup", () => {
    const dir = join(root, "dist/verksamhet");
    const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const f of files) {
      const html = readFileSync(join(dir, f), "utf8");
      expect(html).not.toMatch(/PostalAddress/i);
      expect(html).not.toMatch(/GeoCoordinates/i);
      expect(html).not.toMatch(/streetAddress/i);
      expect(html).not.toMatch(/latitude/i);
      expect(html).not.toMatch(/Hitta hit/i);
      expect(html).not.toMatch(/google\.com\/maps\/dir/i);
    }
  });

  test("bilateral soldAt: producer ↔ place", () => {
    const honey = readFileSync(
      join(root, "dist/verksamhet/markims-honung.html"),
      "utf8"
    );
    expect(honey).toContain("Finns hos");
    expect(honey).toContain("/plats/markims-bergby.html");
    expect(honey).toContain("Säsongens marknader i Brottby");

    const bergby = readFileSync(
      join(root, "dist/plats/markims-bergby.html"),
      "utf8"
    );
    expect(bergby).toContain("Lokala producenter här");
    expect(bergby).toContain("/verksamhet/markims-honung.html");
  });

  test("producers are not listed as map places in index crawl list", () => {
    const index = readFileSync(join(root, "dist/index.html"), "utf8");
    // Producer names may appear in category UI, but must not have /plats/ URLs
    expect(index).not.toContain("/plats/markims-honung.html");
    expect(index).toContain("Producenter");
  });
});
