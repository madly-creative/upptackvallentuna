/**
 * Disk assertions for /veckans-fakta pages — mocked week date picks the right fact.
 */
import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  currentFact,
  factSlug,
  weekIndex,
  isSagen,
} from "../src/lib/factsWeek.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const facts = JSON.parse(readFileSync(join(root, "src/data/facts.json"), "utf8"));
const distIndex = join(root, "dist/index.html");
const sitemap = join(root, "dist/sitemap.xml");

function ensureDist() {
  const sample = join(root, "dist/veckans-fakta", `${factSlug(facts[0])}.html`);
  const ready =
    existsSync(distIndex) &&
    existsSync(sample) &&
    existsSync(sitemap) &&
    readFileSync(sitemap, "utf8").includes("/veckans-fakta/");
  if (!ready) {
    execSync("npm run build", { cwd: root, stdio: "inherit" });
  }
}

test.describe("veckans-fakta built HTML", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    ensureDist();
  });

  test("mocked date selects the expected weekly fact page on disk", () => {
    const mockDate = "2026-08-18"; // weekIndex 1 → fact id 2
    expect(weekIndex(mockDate)).toBe(1);
    const fact = currentFact(mockDate, facts);
    expect(fact?.id).toBe(2);
    const slug = factSlug(fact);
    const path = join(root, "dist/veckans-fakta", `${slug}.html`);
    expect(existsSync(path)).toBe(true);
    const html = readFileSync(path, "utf8");
    expect(html).toContain(fact.title);
    expect(html).toContain(fact.longFact.slice(0, 40));
    expect(html).toContain(`<title>${fact.title}`);
    expect(html).toContain("/veckans-fakta/");
  });

  test("sägen page is marked as folktro", () => {
    const sagen = facts.find((f) => f.id === 27);
    expect(isSagen(sagen)).toBe(true);
    const html = readFileSync(
      join(root, "dist/veckans-fakta", `${factSlug(sagen)}.html`),
      "utf8"
    );
    expect(html).toMatch(/Enligt sägnen/i);
    expect(html).toMatch(/Folktro/i);
    expect(html).toContain("seo-sagen-label");
  });

  test("verified page does not use sägen label", () => {
    const verified = facts.find((f) => f.id === 1);
    expect(isSagen(verified)).toBe(false);
    const html = readFileSync(
      join(root, "dist/veckans-fakta", `${factSlug(verified)}.html`),
      "utf8"
    );
    expect(html).not.toContain("seo-sagen-label");
    expect(html).not.toMatch(/Enligt sägnen/i);
  });

  test("fact pages have no place/map onward links", () => {
    for (const fact of facts) {
      const html = readFileSync(
        join(root, "dist/veckans-fakta", `${factSlug(fact)}.html`),
        "utf8"
      );
      expect(html).not.toContain("på kartan");
      expect(html).not.toContain("seo-place-link");
      expect(html).not.toMatch(/href="\/plats\//);
    }
  });

  test("sitemap lists all fact pages", () => {
    const xml = readFileSync(sitemap, "utf8");
    for (const fact of facts) {
      expect(xml).toContain(`/veckans-fakta/${factSlug(fact)}.html`);
    }
  });
});
