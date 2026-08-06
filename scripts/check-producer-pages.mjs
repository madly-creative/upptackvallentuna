/**
 * Fail the build if any verksamhet (producer) page contains address/geo markup.
 * Run after SEO generate (public/) and optionally against dist/.
 *
 * Usage: node scripts/check-producer-pages.mjs [dir...]
 * Default dirs: public/verksamhet, dist/verksamhet (if exists)
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

const FORBIDDEN = [
  /PostalAddress/i,
  /"@type"\s*:\s*"GeoCoordinates"/i,
  /itemprop=["']address["']/i,
  /\baddressLocality\b/i,
  /\bstreetAddress\b/i,
  /\blatitude\b/i,
  /\blongitude\b/i,
  /google\.com\/maps\/dir/i,
  /Hitta hit/i,
  /data-address=/i,
];

function checkDir(dir) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".html"));
  const errors = [];
  for (const f of files) {
    const path = join(dir, f);
    const html = readFileSync(path, "utf8");
    for (const re of FORBIDDEN) {
      if (re.test(html)) {
        errors.push(`${path}: matched ${re}`);
      }
    }
  }
  return errors;
}

const args = process.argv.slice(2);
const dirs =
  args.length > 0
    ? args.map((d) => (d.startsWith("/") ? d : join(root, d)))
    : [join(root, "public/verksamhet"), join(root, "dist/verksamhet")];

const all = dirs.flatMap(checkDir);
if (all.length) {
  console.error("Producer page address/geo check FAILED:");
  for (const e of all) console.error("  -", e);
  process.exit(1);
}
console.log(
  "Producer page address/geo check OK:",
  dirs.filter((d) => existsSync(d)).join(", ") || "(no dirs yet)"
);
