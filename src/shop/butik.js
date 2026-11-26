/* Butiken: renderar motiv från src/data/shop.js, varukorg i localStorage, kassa via Netlify-funktionen.
 * Mätning (docs/trackingplan.md): action shop_add / shop_checkout / shop_purchase / shop_cancel. */
import { MOTIFS, PRODUCTS, SHOP, motifImages, resolveLine, shippingFor } from "../data/shop.js";

const $ = (s, el = document) => el.querySelector(s);
const kr = (n) => `${n.toLocaleString("sv-SE")} kr`;
const KEY = "uv.cart";
const PENDING = "uv.cart.pending";

const store = {
  get(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const track = (type, item, extra) => {
  try { window.ut ? window.ut.track("action", { type, item, ...extra }) : null; } catch {}
};

let cart = store.get(KEY, []).filter((l) => resolveLine(l));

/* ---------- Motiv ---------- */
const FORMATS = [
  { id: "poster", label: "Poster", key: () => "poster" },
  { id: "ram", label: "Med ram", key: (frame) => `poster-ram-${frame}` },
  { id: "vykort", label: "Vykort", key: () => "vykort" },
];
const FRAMES = [
  { id: "ek", label: "Ek" },
  { id: "svart", label: "Svart" },
  { id: "vit", label: "Vit" },
];

function motifHTML(m, i) {
  const img = motifImages(m.slug);
  const fmt = FORMATS.filter((f) => m.products.includes(f.key("svart"))).map((f) => {
    const p = PRODUCTS[f.key("ek")];
    return `<label class="shop-opt"><input type="radio" name="fmt-${m.slug}" value="${f.id}"${f.id === "ram" ? " checked" : ""}>
      <span><b>${f.label}</b><small>${kr(p.price)}</small></span></label>`;
  }).join("");
  const frames = FRAMES.map((f) =>
    `<label class="shop-swatch shop-swatch--${f.id}"><input type="radio" name="frame-${m.slug}" value="${f.id}"${f.id === "ek" ? " checked" : ""}><span>${f.label}</span></label>`
  ).join("");
  return `
  <article class="shop-motif${i % 2 ? " shop-motif--flip" : ""}" id="${m.slug}" data-sec="butik-${m.slug}" data-name="${m.title}" data-motif="${m.slug}">
    <figure class="shop-art" data-view="ram">
      <img data-img src="${img.framed("ek")}" alt="${m.title}, inramad poster på en vägg" width="1400" height="1750" loading="${i ? "lazy" : "eager"}" decoding="async">
    </figure>
    <div class="shop-copy">
      <p class="shop-eyebrow">${m.kicker}</p>
      <h2>${m.title}</h2>
      <p class="shop-text">${m.text}</p>
      ${m.place ? `<p class="shop-place"><a href="${m.place.href}">${m.place.label} →</a></p>` : ""}
      <form class="shop-form" data-form>
        <fieldset class="shop-opts"><legend class="sr-only">Format</legend>${fmt}</fieldset>
        <fieldset class="shop-frames" data-frames><legend>Ram</legend>${frames}</fieldset>
        <p class="shop-desc" data-desc></p>
        <div class="shop-buy">
          <span class="shop-price" data-price></span>
          <button type="submit" class="shop-add">Lägg i varukorgen</button>
        </div>
      </form>
    </div>
  </article>`;
}

function selected(el) {
  const m = MOTIFS.find((x) => x.slug === el.dataset.motif);
  const fmt = $(`input[name="fmt-${m.slug}"]:checked`, el).value;
  const frame = $(`input[name="frame-${m.slug}"]:checked`, el).value;
  const key = FORMATS.find((f) => f.id === fmt).key(frame);
  return { m, fmt, frame, key, product: PRODUCTS[key] };
}

function syncMotif(el) {
  const { m, fmt, frame, product } = selected(el);
  const img = motifImages(m.slug);
  const fig = $(".shop-art", el);
  const pic = $("[data-img]", el);
  const src = fmt === "ram" ? img.framed(frame) : img.large;
  if (pic.getAttribute("src") !== src) {
    pic.src = src;
    pic.alt = fmt === "ram" ? `${m.title}, inramad poster på en vägg` : m.title;
  }
  fig.dataset.view = fmt;
  $("[data-frames]", el).hidden = fmt !== "ram";
  $("[data-price]", el).textContent = kr(product.price);
  $("[data-desc]", el).textContent = product.short;
}

/* ---------- Varukorg ---------- */
function save() { store.set(KEY, cart); renderCart(); }

function add(motif, product) {
  const hit = cart.find((l) => l.motif === motif && l.product === product);
  if (hit) hit.qty = Math.min(10, hit.qty + 1);
  else cart.push({ motif, product, qty: 1 });
  save();
}

function renderCart() {
  const lines = cart.map(resolveLine).filter(Boolean);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const badge = $("[data-cart-count]");
  badge.textContent = count;
  badge.hidden = !count;
  $("[data-lines]").innerHTML = lines.map((l, i) => `
    <li class="shop-line">
      <img src="${motifImages(l.motif.slug).small}" alt="" width="64" height="90">
      <div><b>${l.motif.title}</b><small>${l.product.name}</small>
        <span class="shop-qty">
          <button type="button" data-qty="${i}" data-d="-1" aria-label="En färre">−</button>
          <output>${l.qty}</output>
          <button type="button" data-qty="${i}" data-d="1" aria-label="En till">+</button>
        </span>
      </div>
      <span class="shop-line-price">${kr(l.product.price * l.qty)}</span>
    </li>`).join("");
  $("[data-empty]").hidden = !!lines.length;
  $("[data-sum]").hidden = !lines.length;
  $("[data-checkout]").disabled = !lines.length;
  if (!lines.length) return;
  const ship = shippingFor(lines);
  $("[data-subtotal]").textContent = kr(ship.subtotal);
  $("[data-ship-label]").textContent = ship.label;
  $("[data-ship]").textContent = ship.price ? kr(ship.price) : "0 kr";
  $("[data-total]").textContent = kr(ship.subtotal + ship.price);
}

const drawer = () => $("[data-drawer]");
function openCart() { drawer().hidden = false; document.body.classList.add("shop-locked"); $("[data-cart-close]").focus(); }
function closeCart() { drawer().hidden = true; document.body.classList.remove("shop-locked"); }

async function checkout() {
  const btn = $("[data-checkout]");
  const status = $("[data-status]");
  const lines = cart.map(resolveLine).filter(Boolean);
  const ship = shippingFor(lines);
  btn.disabled = true;
  status.textContent = "Öppnar kassan …";
  const total = ship.subtotal + ship.price;
  track("shop_checkout", `${lines.length} rader`, { revenue: total, currency: "SEK" });
  try {
    const res = await fetch("/.netlify/functions/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart }),
    });
    const data = await res.json();
    if (!res.ok || !data.url) throw new Error(data.error || res.status);
    store.set(PENDING, { total, items: lines.map((l) => `${l.motif.slug}:${l.productKey}:${l.qty}`).join(",") });
    location.href = data.url;
  } catch (e) {
    btn.disabled = false;
    status.textContent = "Kassan gick inte att öppna just nu. Försök igen om en stund, eller mejla info@upptackvallentuna.se.";
  }
}

/* ---------- Retur från Stripe ---------- */
function handleReturn() {
  const q = new URLSearchParams(location.search);
  const order = q.get("order");
  if (order) {
    const pending = store.get(PENDING, null);
    if (pending) {
      track("shop_purchase", pending.items, { revenue: pending.total, currency: "SEK" });
      store.del(PENDING);
    }
    cart = [];
    store.del(KEY);
    $(".shop-thanks").hidden = false;
    $(".shop-hero").hidden = true;
    $("[data-mock]").hidden = order !== "mock";
    history.replaceState(null, "", location.pathname);
  } else if (q.has("avbrutet")) {
    track("shop_cancel", "stripe");
    history.replaceState(null, "", location.pathname);
    setTimeout(openCart, 300);
  }
}

/* ---------- Start ---------- */
function init() {
  const wrap = $("[data-motifs]");
  wrap.innerHTML = MOTIFS.map(motifHTML).join("");
  wrap.querySelectorAll("[data-motif]").forEach((el) => {
    syncMotif(el);
    el.addEventListener("change", () => syncMotif(el));
    $("[data-form]", el).addEventListener("submit", (e) => {
      e.preventDefault();
      const { m, key } = selected(el);
      add(m.slug, key);
      track("shop_add", `${m.slug}:${key}`);
      const b = $(".shop-add", el);
      b.textContent = "Tillagd ✓";
      setTimeout(() => { b.textContent = "Lägg i varukorgen"; }, 1600);
      openCart();
    });
  });

  $("[data-ship-std]").textContent = kr(SHOP.shipping.standard.price);
  $("[data-ship-small]").textContent = kr(SHOP.shipping.small.price);
  $("[data-ship-free]").textContent = kr(SHOP.shipping.freeOver);
  if (SHOP.christmasDeadline) {
    const d = new Date(SHOP.christmasDeadline + "T23:59:59");
    if (d > new Date()) {
      const x = $("[data-xmas]");
      x.textContent = `Beställ senast ${d.toLocaleDateString("sv-SE", { day: "numeric", month: "long" })} för leverans före jul.`;
      x.hidden = false;
    }
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-cart-open],[data-cart-close],[data-qty],[data-checkout],[data-drawer]");
    if (!t) return;
    if (t.matches("[data-cart-open]")) openCart();
    else if (t.matches("[data-cart-close]") || (t.matches("[data-drawer]") && e.target === t)) closeCart();
    else if (t.matches("[data-qty]")) {
      const l = cart.filter((x) => resolveLine(x))[Number(t.dataset.qty)];
      if (!l) return;
      l.qty += Number(t.dataset.d);
      if (l.qty < 1) cart = cart.filter((x) => x !== l);
      if (l.qty > 10) l.qty = 10;
      save();
    } else if (t.matches("[data-checkout]")) checkout();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer().hidden) closeCart(); });

  renderCart();
  handleReturn();
}

init();
