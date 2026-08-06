/**
 * PWA: service worker + install entry points.
 * - Floating chip for returning visitors (snoozable 14 days)
 * - Evergreen footer / Om links → explain modal, then install/tip
 * No push, no background sync — shell cache only (see /sw.js).
 */

const LEGACY_DISMISS_KEY = "uv_pwa_install_dismissed";
const SNOOZE_KEY = "uv_pwa_install_snooze_until";
const VISIT_KEY = "uv_pwa_visits";
const SNOOZE_DAYS = 14;

/** @type {Event | null} */
let deferredPrompt = null;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && navigator.standalone === true)
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // Avoid SW during Vite HMR — register in production / preview only
  if (import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline / file:// — ignore */
    });
  });
}

function visitCount() {
  try {
    const n = Number(localStorage.getItem(VISIT_KEY) || "0") + 1;
    localStorage.setItem(VISIT_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}

/** Chip only — footer link stays available after snooze. */
function isChipSnoozed() {
  try {
    // Migrate legacy permanent dismiss → treat as snoozed for chip
    if (localStorage.getItem(LEGACY_DISMISS_KEY) === "1") {
      snoozeChip(SNOOZE_DAYS);
      localStorage.removeItem(LEGACY_DISMISS_KEY);
    }
    const until = Number(localStorage.getItem(SNOOZE_KEY) || "0");
    return until > Date.now();
  } catch {
    return false;
  }
}

function snoozeChip(days = SNOOZE_DAYS) {
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(SNOOZE_KEY, String(until));
    localStorage.removeItem(LEGACY_DISMISS_KEY);
  } catch {
    /* ignore */
  }
}

function setInstallEntryVisible(show) {
  document.querySelectorAll("[data-pwa-install-entry]").forEach((el) => {
    el.hidden = !show;
  });
}

function removeEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("show");
  setTimeout(() => el.remove(), 280);
}

function hideHint() {
  removeEl("pwa-install");
}

function hideExplainModal() {
  removeEl("pwa-explain");
  const bg = document.getElementById("pwa-explain-bg");
  if (bg) {
    bg.classList.remove("show");
    setTimeout(() => bg.remove(), 280);
  }
}

function showHint(onInstall) {
  if (document.getElementById("pwa-install")) return;

  const el = document.createElement("div");
  el.id = "pwa-install";
  el.className = "pwa-install";
  el.setAttribute("role", "region");
  el.setAttribute("aria-label", "Installera appen");
  el.innerHTML = `
    <p class="pwa-install-text">Lägg till på hemskärmen för snabbare öppning.</p>
    <div class="pwa-install-actions">
      <button type="button" class="pwa-install-yes">Lägg till</button>
      <button type="button" class="pwa-install-no" aria-label="Stäng">Inte nu</button>
    </div>
  `;
  el.querySelector(".pwa-install-yes").addEventListener("click", onInstall);
  el.querySelector(".pwa-install-no").addEventListener("click", () => {
    snoozeChip();
    hideHint();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
}

function showManualTip() {
  hideHint();
  hideExplainModal();
  if (document.getElementById("pwa-install")) return;

  const ios = isIos();
  const el = document.createElement("div");
  el.id = "pwa-install";
  el.className = "pwa-install";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Lägg till på hemskärmen");
  el.innerHTML = ios
    ? `<p class="pwa-install-text">På iPhone/iPad: tryck <strong>Dela</strong> (□↑) och välj <strong>Lägg till på hemskärmen</strong>.</p>
       <div class="pwa-install-actions">
         <button type="button" class="pwa-install-yes pwa-install-ok">Förstått</button>
       </div>`
    : `<p class="pwa-install-text">Öppna webbläsarmenyn och välj <strong>Installera app</strong> eller <strong>Lägg till på hemskärmen</strong>.</p>
       <div class="pwa-install-actions">
         <button type="button" class="pwa-install-yes pwa-install-ok">Förstått</button>
       </div>`;
  el.querySelector(".pwa-install-ok").addEventListener("click", hideHint);
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
}

/** Run native install prompt or fall back to manual tip. */
async function runInstallPrompt() {
  if (deferredPrompt) {
    const ev = deferredPrompt;
    deferredPrompt = null;
    try {
      ev.prompt();
      await ev.userChoice;
      return;
    } catch {
      /* fall through */
    }
  }
  showManualTip();
}

/**
 * Explain what “add to home screen” means before Chrome’s native dialog / iOS tip.
 */
function showExplainModal() {
  hideHint();
  if (document.getElementById("pwa-explain")) return;

  const bg = document.createElement("div");
  bg.id = "pwa-explain-bg";
  bg.className = "pwa-explain-bg";
  bg.addEventListener("click", hideExplainModal);

  const el = document.createElement("div");
  el.id = "pwa-explain";
  el.className = "pwa-explain";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "pwa-explain-title");
  el.innerHTML = `
    <h2 id="pwa-explain-title">Lägg till på hemskärmen</h2>
    <p>Öppna Upptäck Vallentuna som en ikon på hemskärmen — snabbare start, utan appbutik och utan konto.</p>
    <p class="pwa-explain-note">Nästa steg är webbläsarens egen fråga (eller en kort instruktion på iPhone).</p>
    <div class="pwa-explain-actions">
      <button type="button" class="pwa-install-no pwa-explain-cancel">Avbryt</button>
      <button type="button" class="pwa-install-yes pwa-explain-continue">Fortsätt</button>
    </div>
  `;
  el.querySelector(".pwa-explain-cancel").addEventListener("click", hideExplainModal);
  el.querySelector(".pwa-explain-continue").addEventListener("click", async () => {
    hideExplainModal();
    await runInstallPrompt();
  });

  document.body.appendChild(bg);
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    bg.classList.add("show");
    el.classList.add("show");
  });
  el.querySelector(".pwa-explain-continue")?.focus();
}

/**
 * Footer / Om entry — always available when not installed.
 * Shows explain modal first, then native prompt or tip.
 */
export async function promptPwaInstall() {
  if (isStandalone()) return;
  showExplainModal();
}

function maybeShowChip(visits) {
  if (isStandalone() || isChipSnoozed() || visits < 2 || !deferredPrompt) return;
  // Chip already explains briefly — open explain modal on “Lägg till” for consistency
  showHint(() => {
    hideHint();
    showExplainModal();
  });
}

function setupInstallHint() {
  if (isStandalone()) {
    setInstallEntryVisible(false);
    return;
  }

  setInstallEntryVisible(true);
  const visits = visitCount();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    maybeShowChip(visits);
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    hideHint();
    hideExplainModal();
    setInstallEntryVisible(false);
  });
}

export function initPwa() {
  registerServiceWorker();
  setupInstallHint();
  // Expose for footer / Om onclick without importing into the SPA bundle graph
  window.promptPwaInstall = promptPwaInstall;
}
