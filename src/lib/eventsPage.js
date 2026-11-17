/**
 * Evenemangssidan (evenemang.html): datumremsa, filter och en horisontell kortrad per period.
 * Korten renderas av scripts/generate-seo.mjs vid bygget. Här grupperas de om efter dagens datum,
 * så passerade evenemang försvinner även om sajten inte byggts om sedan dess.
 */
const DAYS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
const DAYS_LONG = ["söndag", "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag"];
const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
const STRIP_DAYS = 42;

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const noon = (s) => new Date(`${s}T12:00:00`);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function init() {
  const list = document.getElementById("evxList");
  if (!list) return;
  const strip = document.getElementById("evxStrip");
  const chips = document.getElementById("evxChips");
  const empty = document.getElementById("evxEmpty");
  const next = document.getElementById("evxNext");
  const bar = document.getElementById("evxBar");

  const now = new Date();
  const today = noon(iso(now));
  const todayISO = iso(today);
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const nextMonday = addDays(monday, 7);
  const afterNext = addDays(monday, 14);
  // "I helgen": kommande fre–sön (eller resten av helgen om den redan börjat)
  const wd = today.getDay();
  const weekendStart = wd === 0 || wd === 6 || wd === 5 ? today : addDays(monday, 4);
  const weekendEnd = addDays(monday, 6);

  const all = [...list.querySelectorAll(".evx-card")].map((el) => ({
    el,
    date: el.dataset.date,
    end: el.dataset.end || el.dataset.date,
    free: el.hasAttribute("data-free"),
    kids: el.hasAttribute("data-kids"),
    jul: el.hasAttribute("data-jul"),
    title: el.querySelector("h3")?.textContent || "",
    time: el.querySelector(".evx-time")?.textContent || "",
  }));
  const upcoming = all.filter((e) => e.end >= todayISO).sort((a, b) => a.date.localeCompare(b.date));

  // Passerade sedan bygget: ut ur raderna, in i arkivet
  const gone = all.filter((e) => e.end < todayISO);
  if (gone.length) {
    const count = document.getElementById("evxPastCount");
    if (count) count.textContent = String(Number(count.textContent || 0) + gone.length);
    const ul = document.querySelector("#evxArchive ul");
    if (ul) {
      const li = document.createElement("li");
      li.innerHTML = "<b>Nyss</b> ";
      gone.forEach((e, i) => {
        if (i) li.append(" · ");
        const a = document.createElement("a");
        a.href = e.el.getAttribute("href");
        a.textContent = e.title;
        li.append(a);
      });
      ul.append(li);
    }
    gone.forEach((e) => e.el.remove());
  }

  const FILTERS = {
    alla: () => true,
    helg: (e) => noon(e.end) >= weekendStart && noon(e.date) <= weekendEnd,
    gratis: (e) => e.free,
    barn: (e) => e.kids,
    jul: (e) => e.jul,
  };

  function groupOf(e) {
    const d = noon(e.date) < today ? today : noon(e.date);
    if (d < nextMonday) return ["vecka", "Den här veckan", `${monday.getDate()}–${addDays(nextMonday, -1).getDate()} ${MONTHS[addDays(nextMonday, -1).getMonth()].slice(0, 3)}`];
    if (d < afterNext) return ["nasta", "Nästa vecka", `${nextMonday.getDate()}–${addDays(afterNext, -1).getDate()} ${MONTHS[addDays(afterNext, -1).getMonth()].slice(0, 3)}`];
    const m = MONTHS[d.getMonth()];
    const label = m[0].toUpperCase() + m.slice(1) + (d.getFullYear() !== today.getFullYear() ? ` ${d.getFullYear()}` : "");
    return [e.date.slice(0, 7), label, ""];
  }

  function whenWord(e) {
    const d = noon(e.date);
    const diff = Math.round((d - today) / 864e5);
    if (diff <= 0) return "i dag";
    if (diff === 1) return "i morgon";
    if (diff < 7) return `på ${DAYS_LONG[d.getDay()]}`;
    return `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }

  if (next && upcoming.length) {
    const first = upcoming[0];
    next.innerHTML = "";
    next.append(`${upcoming.length} på gång i bygden. Närmast: `);
    const a = document.createElement("a");
    a.href = first.el.getAttribute("href");
    a.textContent = first.title;
    next.append(a, `, ${whenWord(first)}${/^\d/.test(first.time) ? ` kl ${first.time.split("–")[0]}` : ""}.`);
  } else if (next) {
    next.textContent = "Just nu finns inga kommande evenemang i kalendern. Tipsa oss gärna!";
  }

  // Filterchips: antal, och dölj de som saknar träffar
  chips.querySelectorAll(".evx-chip").forEach((b) => {
    const f = b.dataset.f;
    if (f === "alla") return;
    const n = upcoming.filter(FILTERS[f]).length;
    const em = b.querySelector("em");
    if (em) em.textContent = String(n);
    b.hidden = n === 0;
  });

  let current = "alla";
  try {
    const saved = sessionStorage.getItem("evx-filter");
    if (saved && FILTERS[saved] && upcoming.some(FILTERS[saved])) current = saved;
  } catch {}

  function railNav(section) {
    const rail = section.querySelector(".evx-rail");
    const nav = section.querySelector(".evx-nav");
    if (!rail || !nav) return;
    const overflow = rail.scrollWidth > rail.clientWidth + 4;
    nav.hidden = !overflow;
    const [prev, nxt] = nav.querySelectorAll("button");
    prev.disabled = rail.scrollLeft < 4;
    nxt.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
  }

  function render() {
    const fn = FILTERS[current];
    const shown = upcoming.filter(fn);
    chips.querySelectorAll(".evx-chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === current)));

    // Kortrader: återanvänd kortnoderna, bygg om sektionerna
    const groups = [];
    for (const e of shown) {
      const [key, label, sub] = groupOf(e);
      let g = groups.find((x) => x.key === key);
      if (!g) groups.push((g = { key, label, sub, items: [] }));
      g.items.push(e);
    }
    const frag = document.createDocumentFragment();
    for (const g of groups) {
      const sec = document.createElement("section");
      sec.className = "evx-grp";
      sec.dataset.key = g.key;
      sec.setAttribute("aria-labelledby", `evx-h-${g.key}`);
      sec.innerHTML = `<div class="evx-grp-h"><h2 id="evx-h-${g.key}"></h2><div class="evx-nav" hidden><button type="button" data-dir="-1" aria-label="Föregående">←</button><button type="button" data-dir="1" aria-label="Nästa">→</button></div></div><div class="evx-rail"></div>`;
      const h = sec.querySelector("h2");
      h.textContent = `${g.label} `;
      const small = document.createElement("small");
      small.textContent = `${g.sub ? `${g.sub} · ` : ""}${g.items.length} st`;
      h.append(small);
      const rail = sec.querySelector(".evx-rail");
      g.items.forEach((e) => rail.append(e.el));
      frag.append(sec);
    }
    list.replaceChildren(frag);
    empty.hidden = shown.length > 0;
    list.querySelectorAll(".evx-grp").forEach(railNav);

    // Datumremsa: sex veckor från måndag, prick på dagar med (filtrerade) evenemang
    const counts = {};
    for (const e of shown) {
      let d = noon(e.date);
      const end = noon(e.end);
      for (let i = 0; d <= end && i < 31; i++, d = addDays(d, 1)) counts[iso(d)] = (counts[iso(d)] || 0) + 1;
    }
    let html = "";
    let month = -1;
    for (let i = 0; i < STRIP_DAYS; i++) {
      const d = addDays(monday, i);
      const s = iso(d);
      if (d.getMonth() !== month) {
        if (month >= 0) html += "</div>";
        month = d.getMonth();
        html += `<div class="evx-mo"><i>${MONTHS[month].slice(0, 3)}</i>`;
      }
      const n = s >= todayISO ? counts[s] || 0 : 0;
      const cls = ["evx-d", (d.getDay() === 0 || d.getDay() === 6) && "we", n && "has", n > 1 && "many", s === todayISO && "today", s < todayISO && "past"].filter(Boolean).join(" ");
      const label = `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${n ? `, ${n} evenemang` : ""}${s === todayISO ? ", i dag" : ""}`;
      html += n
        ? `<button type="button" class="${cls}" data-d="${s}" aria-label="${label}"><span>${d.getDate()}</span><span class="dot"></span></button>`
        : `<span class="${cls}" aria-hidden="true"><span>${d.getDate()}</span><span class="dot"></span></span>`;
    }
    strip.innerHTML = `${html}</div>`;
  }

  function jumpTo(dateISO, btn) {
    strip.querySelectorAll(".sel").forEach((x) => x.classList.remove("sel"));
    btn?.classList.add("sel");
    const cards = [...list.querySelectorAll(".evx-card")];
    const card = cards.find((c) => c.dataset.date <= dateISO && (c.dataset.end || c.dataset.date) >= dateISO);
    if (!card) return;
    const section = card.closest(".evx-grp");
    const rail = card.parentElement;
    const behavior = reduceMotion() ? "auto" : "smooth";
    const top = section.getBoundingClientRect().top + window.scrollY - bar.getBoundingClientRect().height - topOffset() - 12;
    window.scrollTo({ top, behavior });
    const padL = parseFloat(getComputedStyle(rail).scrollPaddingLeft) || 0;
    rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft - padL, behavior });
    card.classList.remove("flash");
    void card.offsetWidth;
    card.classList.add("flash");
  }

  // Efter filterbyte krymper listan: se till att den börjar direkt under den fasta remsan
  function keepListInView() {
    const barBottom = bar.getBoundingClientRect().bottom;
    const listTop = list.getBoundingClientRect().top;
    if (listTop < barBottom) window.scrollTo({ top: window.scrollY + listTop - barBottom - 8, behavior: "auto" });
  }

  function topOffset() {
    const top = document.querySelector(".seo-top");
    return top && getComputedStyle(top).position === "sticky" ? top.getBoundingClientRect().height : 0;
  }
  function syncTop() {
    document.documentElement.style.setProperty("--evx-top", `${topOffset()}px`);
  }

  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".evx-chip");
    if (!b) return;
    current = b.getAttribute("aria-pressed") === "true" && b.dataset.f !== "alla" ? "alla" : b.dataset.f;
    try { sessionStorage.setItem("evx-filter", current); } catch {}
    render();
    strip.scrollLeft = 0;
    keepListInView();
  });
  empty.addEventListener("click", (e) => {
    if (!e.target.closest("[data-f]")) return;
    current = "alla";
    render();
    keepListInView();
  });
  strip.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-d]");
    if (b) jumpTo(b.dataset.d, b);
  });
  list.addEventListener("click", (e) => {
    const b = e.target.closest(".evx-nav button");
    if (!b) return;
    const rail = b.closest(".evx-grp").querySelector(".evx-rail");
    rail.scrollBy({ left: Number(b.dataset.dir) * rail.clientWidth * 0.85, behavior: reduceMotion() ? "auto" : "smooth" });
  });
  list.addEventListener("scroll", (e) => {
    if (e.target.classList?.contains("evx-rail")) railNav(e.target.closest(".evx-grp"));
  }, true);
  let raf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      syncTop();
      list.querySelectorAll(".evx-grp").forEach(railNav);
    });
  });

  syncTop();
  render();
  document.documentElement.classList.add("evx-ready");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
