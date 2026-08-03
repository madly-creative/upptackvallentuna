/**
 * Renders public/icons/*.svg → PNG sizes via Playwright.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dir = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dir, "../public/icons");
mkdirSync(iconsDir, { recursive: true });

const jobs = [
  { svg: "mark.svg", out: "icon-192.png", size: 192 },
  { svg: "mark.svg", out: "icon-512.png", size: 512 },
  { svg: "mark-maskable.svg", out: "icon-512-maskable.png", size: 512 },
  { svg: "mark.svg", out: "apple-touch-icon.png", size: 180 },
];

const browser = await chromium.launch();

for (const job of jobs) {
  const svg = readFileSync(join(iconsDir, job.svg), "utf8");
  const page = await browser.newPage({
    viewport: { width: job.size, height: job.size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><html><head><style>
      html,body{margin:0;padding:0;width:${job.size}px;height:${job.size}px;overflow:hidden;background:#f5f1e8}
      svg{display:block;width:${job.size}px;height:${job.size}px}
    </style></head><body>${svg}</body></html>`,
    { waitUntil: "load" }
  );
  const buf = await page.screenshot({ type: "png", omitBackground: false });
  writeFileSync(join(iconsDir, job.out), buf);
  console.log("wrote", job.out, `(${job.size}×${job.size})`);
  await page.close();
}

await browser.close();
console.log("PWA icons ready in public/icons/");
