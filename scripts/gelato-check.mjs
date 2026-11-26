/**
 * Kontrollerar att butikens Gelato-produkter finns i katalogen och att tryckfilerna nås.
 *   GELATO_API_KEY=… node scripts/gelato-check.mjs [https://upptackvallentuna.se]
 */
import { PRINT } from "../src/data/shopPrint.js";
import { MOTIFS } from "../src/data/shop.js";

const key = process.env.GELATO_API_KEY;
const base = process.argv[2] || "https://upptackvallentuna.se";
let bad = 0;

for (const [name, p] of Object.entries(PRINT)) {
  if (!key) { console.log(`- ${name}: ${p.gelato} (hoppar över, ingen GELATO_API_KEY)`); continue; }
  const r = await fetch(`https://product.gelatoapis.com/v3/products/${p.gelato}`, { headers: { "X-API-KEY": key } });
  console.log(`${r.ok ? "✓" : "✗"} ${name}: ${p.gelato}${r.ok ? "" : ` (${r.status})`}`);
  if (!r.ok) bad++;
}
for (const m of MOTIFS) for (const p of Object.values(PRINT)) for (const f of p.files(m.slug)) {
  const r = await fetch(base + f.url, { method: "HEAD" });
  if (!r.ok) { console.log(`✗ fil saknas: ${base}${f.url} (${r.status})`); bad++; }
}
console.log(bad ? `${bad} fel` : "Allt ok");
process.exit(bad ? 1 : 0);
