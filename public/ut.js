/*
 * ut.js — Upptäck Vallentunas mätlager ovanpå Umami (cookiefritt).
 * Trackingplan: docs/trackingplan.md. Håll eventnamnen få:
 *
 *   click         {sec, el, page}            klick på knapp/länk, sektion avläses automatiskt
 *   outbound      {kind, dest, sec, name}    lämnar sajten: web | maps | phone | mail | social
 *   search        {q, hits}                  sökningar (hits: 0 | 1-3 | 4+)
 *   filter        {kind, value}              filterval (t.ex. evenemangskalendern)
 *   action        {type, item}               avsiktliga handlingar: favorit, lista, påminn, tips …
 *   page_summary  {page, depth, seen, time}  EN rad per sidvisning: scrolldjup, sedda sektioner, tid
 *
 * Sektioner märks med data-sec="namn" i HTML. Utan märkning används vyns/sektionens id.
 * SPA:n (index.html, data-spa) skickar egna sidvisningar via ut.page('/app/…').
 * Egen trafik: kör localStorage.setItem('umami.disabled','1') i webbläsaren.
 */
(function () {
  "use strict";
  if (window.ut) return;
  var me = document.currentScript;
  var SPA = !!(me && me.hasAttribute("data-spa"));
  var queue = [];
  var path = SPA ? null : location.pathname;
  var title = document.title;
  var ref = document.referrer;

  function disabled() {
    try { return !!localStorage.getItem("umami.disabled"); } catch (e) { return false; }
  }
  function cut(s, n) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n || 60);
  }
  function clean(props) {
    var o = {};
    for (var k in props) if (props[k] != null && props[k] !== "") o[k] = typeof props[k] === "number" ? props[k] : cut(props[k], 120);
    return o;
  }
  function umamiReady() { return window.umami && typeof window.umami.track === "function"; }
  function flush() {
    if (!umamiReady()) return;
    while (queue.length) {
      try { queue.shift()(); } catch (e) {}
    }
  }
  function run(fn) {
    if (disabled()) return;
    if (umamiReady()) { try { fn(); } catch (e) {} }
    else queue.push(fn);
  }
  // Umami laddas efter första renderingen — töm kön när det finns.
  var tries = 0;
  var poll = setInterval(function () {
    flush();
    if (umamiReady() || ++tries > 60) clearInterval(poll);
  }, 500);

  function curPath() { return path || location.pathname; }

  function track(name, props) {
    var p = curPath(), data = clean(props || {});
    run(function () {
      window.umami.track(function (base) {
        base.url = p; base.name = name; base.data = data;
        return base;
      });
    });
  }

  /* ---------- Sidsammanfattning: scrolldjup + sedda sektioner + tid ---------- */
  var depth = 0, seen = [], t0 = Date.now(), summarySent = false, io = null;

  function measureDepth() {
    var el = document.documentElement;
    var h = Math.max(el.scrollHeight, document.body ? document.body.scrollHeight : 0);
    var view = window.innerHeight || el.clientHeight;
    if (h <= view + 40) { depth = 100; return; }
    var pct = ((window.scrollY + view) / h) * 100;
    var step = pct >= 97 ? 100 : pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : 0;
    if (step > depth) depth = step;
  }
  function timeBucket(ms) {
    var s = ms / 1000;
    return s < 10 ? "<10s" : s < 30 ? "10-30s" : s < 120 ? "30s-2m" : s < 600 ? "2-10m" : "10m+";
  }
  function summary(useBeacon) {
    if (summarySent || !curPath()) return;
    summarySent = true;
    var data = { page: curPath(), depth: depth, seen: seen.join(",") || "-", time: timeBucket(Date.now() - t0) };
    if (!useBeacon) return track("page_summary", data);
    // Flikbyte/stängning: skicka direkt med keepalive så att raden inte tappas.
    if (disabled() || !me) return;
    var host = (document.querySelector('script[src*="umami"][data-website-id]') || {});
    var site = host.getAttribute && host.getAttribute("data-website-id");
    if (!site) return;
    var endpoint = host.src.split("/").slice(0, -1).join("/") + "/api/send";
    var body = JSON.stringify({ type: "event", payload: {
      website: site, hostname: location.hostname, screen: screen.width + "x" + screen.height,
      language: navigator.language, title: encodeURIComponent(title), url: encodeURI(curPath()),
      referrer: encodeURI(ref || ""), name: "page_summary", data: clean(data),
    } });
    try { fetch(endpoint, { method: "POST", body: body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(function () {}); }
    catch (e) {}
  }
  function secName(el) {
    if (!el || !el.closest) return "";
    var tagged = el.closest("[data-sec]");
    if (tagged) return tagged.getAttribute("data-sec");
    var view = el.closest(".view[id]");
    if (view) return view.id.replace(/^view-/, "");
    var box = el.closest("section[id],article[id],aside[id],header,footer,nav,main");
    if (!box) return "sida";
    return box.id || box.getAttribute("aria-label") || box.tagName.toLowerCase();
  }
  function observeSections() {
    if (!("IntersectionObserver" in window)) return;
    if (io) io.disconnect();
    // En sektion räknas som "sedd" när den når mittbandet av skärmen.
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target.getAttribute("data-sec");
        if (n && seen.indexOf(n) < 0 && seen.join(",").length < 400) seen.push(n);
        io.unobserve(e.target);
      });
    }, { rootMargin: "-35% 0px -35% 0px" });
    var nodes = document.querySelectorAll("[data-sec]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.closest(".view") && !n.closest(".view.on")) continue;
      if (/^(nav|nav-mobil|footer|evenemang-modal)$/.test(n.getAttribute("data-sec"))) continue;
      io.observe(n);
    }
  }
  function resetPage() {
    depth = 0; seen = []; t0 = Date.now(); summarySent = false;
    setTimeout(function () { measureDepth(); observeSections(); }, 250);
  }

  /** SPA-sidvisning. Skickar föregående sidas sammanfattning först. */
  function page(p, t) {
    if (!p || p === path) return;
    if (path) summary(false);
    ref = path ? location.origin + path : document.referrer;
    path = p; title = t || document.title;
    var r = ref;
    run(function () {
      window.umami.track(function (base) {
        base.url = p; base.title = encodeURIComponent(title); base.referrer = encodeURI(r || "");
        return base;
      });
    });
    resetPage();
  }

  /* ---------- Klick + utgående länkar (en delegerad lyssnare) ---------- */
  var MAPS = /(^|\.)(google\.[a-z.]+|goo\.gl|maps\.apple\.com|waze\.com)$/;
  var SOCIAL = /(^|\.)(facebook\.com|instagram\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com|linkedin\.com)$/;
  function outboundKind(a) {
    var href = a.getAttribute("href") || "";
    if (/^tel:/i.test(href)) return ["phone", "tel"];
    if (/^mailto:/i.test(href)) return ["mail", "mail"];
    if (!a.hostname || a.hostname === location.hostname || !/^https?:/.test(a.protocol)) return null;
    var h = a.hostname.replace(/^www\./, "");
    if (MAPS.test(h) && /map|dir|maps/i.test(a.href)) return ["maps", h];
    if (SOCIAL.test(h)) return ["social", h];
    return ["web", h];
  }
  function label(el) {
    return cut(el.getAttribute("data-track") || el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || el.tagName, 60);
  }
  function itemName(el) {
    var card = el.closest("[data-name],article,.card,.popup,.modal,.view");
    var h = card && (card.getAttribute("data-name") || (card.querySelector("h1,h2,h3") || {}).textContent);
    return cut(h, 60);
  }
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest && e.target.closest('a[href],button,[role="button"],[onclick],summary,[data-track]');
    if (!el || el.hasAttribute("data-track-skip")) return;
    var sec = secName(el);
    if (el.tagName === "A") {
      var k = outboundKind(el);
      if (k) return track("outbound", { kind: k[0], dest: k[1], sec: sec, name: itemName(el) });
    }
    track("click", { sec: sec, el: label(el), page: curPath() });
  }, true);

  addEventListener("scroll", function () { measureDepth(); }, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") summary(true);
  });
  addEventListener("pagehide", function () { summary(true); });

  if (!SPA) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", resetPage);
    else resetPage();
  }

  window.ut = {
    page: page,
    track: track,
    /** Utgående navigering via window.open (rutter m.m.). */
    outbound: function (kind, url, props) {
      var dest = "";
      try { dest = new URL(url, location.href).hostname.replace(/^www\./, ""); } catch (e) {}
      track("outbound", Object.assign({ kind: kind, dest: dest }, props || {}));
    },
    action: function (type, item) { track("action", { type: type, item: item }); },
  };
})();
