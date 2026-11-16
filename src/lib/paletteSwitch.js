/**
 * Palettväljare för att jämföra palett A och B.
 * Visas bara i Netlifys förhandsvisningar, lokalt, eller när ?palett= finns i adressen —
 * aldrig för vanliga besökare på upptackvallentuna.se.
 */
const PALETTES = [
  { id: "a", label: "A · Rapsfält" },
  { id: "b", label: "B · Runsten & sjö" },
];

function shouldShow(loc) {
  const host = loc.hostname;
  return (
    host.startsWith("deploy-preview-") ||
    host.endsWith(".netlify.app") ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    new URLSearchParams(loc.search).has("palett")
  );
}

export function setPalette(id) {
  const p = id === "b" ? "b" : "a";
  document.documentElement.setAttribute("data-palette", p);
  try { localStorage.setItem("uv-palette", p); } catch (e) { /* privat läge */ }
  document.querySelectorAll(".uv-palette-switch button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.palette === p));
  });
}

export function mountPaletteSwitch(loc = window.location) {
  if (!shouldShow(loc) || document.querySelector(".uv-palette-switch")) return;
  const bar = document.createElement("div");
  bar.className = "uv-palette-switch";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Välj palett");
  bar.innerHTML =
    "<span>Palett</span>" +
    PALETTES.map((p) => `<button type="button" data-palette="${p.id}">${p.label}</button>`).join("");
  bar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-palette]");
    if (btn) setPalette(btn.dataset.palette);
  });
  document.body.appendChild(bar);
  setPalette(document.documentElement.getAttribute("data-palette"));
}
