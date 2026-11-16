// Mikroanimationer: scroll-reveal av banden, kartnålar som landar en gång,
// och kortbilden som flyger upp till undersidans toppbild.
// Allt är progressivt: utan IntersectionObserver, eller med "reducera rörelse",
// syns sidan precis som förut.

const HEROES = ["platsHero", "guideHero", "verkHero", "portrattHero", "eventModalHero"];
const CARD_IMG = ".im, .thumb, .ll-img, .card-img, .gc-img, img";

function prefersReduced() {
  try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
}

function isShown(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// Banden under vecket tonar och glider in när de kommer in i bild.
function initReveal() {
  const bands = document.querySelectorAll("#view-start > .band");
  if (!bands.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const band = e.target;
      io.unobserve(band);
      band.classList.add("in");
      // Släpp animationen när den gått klart, så omritningar inte spelar om den
      setTimeout(() => band.classList.add("done"), 1600);
    }
  }, { rootMargin: "0px 0px -12% 0px" });
  const fold = window.innerHeight;
  bands.forEach((band) => {
    if (band.getBoundingClientRect().top < fold * 0.9) return; // redan i bild: rör inte
    band.classList.add("rv");
    io.observe(band);
  });
}

// Kartnålarna studsar ner en gång när respektive karta först syns.
function initPinDrop() {
  const targets = ["naraDigRoot", "map"].map((id) => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      // Vänta in nålarna om kartan inte hunnit ladda; de nya animeras ändå medan klassen sitter kvar
      const arm = () => {
        el.classList.add("pins-drop");
        setTimeout(() => el.classList.remove("pins-drop"), 2200);
      };
      io.unobserve(el);
      if (el.querySelector(".leaflet-marker-icon")) arm();
      else {
        const mo = new MutationObserver(() => {
          if (!el.querySelector(".leaflet-marker-icon")) return;
          mo.disconnect();
          arm();
        });
        mo.observe(el, { childList: true, subtree: true });
        setTimeout(() => mo.disconnect(), 15000);
      }
    }
  }, { rootMargin: "0px 0px -15% 0px" });
  targets.forEach((t) => io.observe(t));
}

// Kortbilden flyger upp och blir undersidans toppbild.
// Källan mäts i capture-fasen (före kortets onclick), målet i bubbelfasen
// (efter att vyn bytts), så appens egen navigering lämnas helt orörd.
function initCardFlight() {
  let pending = null;

  document.addEventListener("click", (e) => {
    pending = null;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    const t = e.target instanceof Element ? e.target : null;
    if (!t || t.closest(".fav, .remind-btn, a[href], .leaflet-container")) return;
    const card = t.closest("article, .guide-card, .tcard, [onclick]");
    if (!card) return;
    const img = card.matches(CARD_IMG) ? card : card.querySelector(CARD_IMG);
    if (!img) return;
    const rect = img.getBoundingClientRect();
    if (rect.width * rect.height < 6000) return;
    const src = img.tagName === "IMG" ? `url("${img.currentSrc || img.src}")` : getComputedStyle(img).backgroundImage;
    if (!src || src === "none") return;
    const radius = getComputedStyle(img).borderRadius || getComputedStyle(card).borderRadius;
    pending = { rect, src, radius, before: HEROES.filter((id) => isShown(document.getElementById(id))) };
  }, true);

  document.addEventListener("click", () => {
    const p = pending; pending = null;
    if (!p) return;
    // Vyerna byts synkront i kortets onclick, så målet finns redan här.
    const hero = HEROES.map((id) => document.getElementById(id))
      .find((el) => el && isShown(el) && !p.before.includes(el.id));
    if (!hero) return;
    // Ny vy: hoppa direkt till toppen i stället för den mjuka scrollen,
    // annars flyger bilden mot ett mål som rör sig.
    if (hero.id !== "eventModalHero" && window.scrollY > 0) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    requestAnimationFrame(() => {
      const to = hero.getBoundingClientRect();
      if (to.bottom < 0 || to.top > window.innerHeight) return;
      fly(p, to);
    });
  });
}

function fly(p, to) {
  const g = document.createElement("div");
  g.className = "uv-fly";
  g.setAttribute("aria-hidden", "true");
  g.style.backgroundImage = p.src;
  const vh = window.innerHeight;
  // Målet kan vara högre än skärmen; flyg bara till den synliga delen
  const target = { top: to.top, left: to.left, width: to.width, height: Math.min(to.height, vh - Math.max(0, to.top)) };
  const from = { top: `${p.rect.top}px`, left: `${p.rect.left}px`, width: `${p.rect.width}px`, height: `${p.rect.height}px`, borderRadius: p.radius || "16px", opacity: 1 };
  const end = { top: `${target.top}px`, left: `${target.left}px`, width: `${target.width}px`, height: `${target.height}px`, borderRadius: "0px", opacity: 1 };
  Object.assign(g.style, from);
  document.body.appendChild(g);
  const a = g.animate([from, end], { duration: 460, easing: "cubic-bezier(.2,.75,.2,1)", fill: "forwards" });
  a.finished
    .then(() => g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" }).finished)
    .catch(() => {})
    .finally(() => g.remove());
}

export function initMotion() {
  // Heroens intro: ta bort klassen efter första visningen så den inte spelas om
  setTimeout(() => document.documentElement.classList.remove("intro"), 3200);
  if (prefersReduced()) return;
  if ("IntersectionObserver" in window) {
    try { initReveal(); } catch (e) { console.warn("motion reveal", e); }
    try { initPinDrop(); } catch (e) { console.warn("motion pins", e); }
  }
  if (typeof Element.prototype.animate === "function") {
    try { initCardFlight(); } catch (e) { console.warn("motion flight", e); }
  }
}
