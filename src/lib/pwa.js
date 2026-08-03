/**
 * PWA: service worker + discreet Android install hint.
 * No push, no background sync — shell cache only (see /sw.js).
 */

const DISMISS_KEY = "uv_pwa_install_dismissed";
const VISIT_KEY = "uv_pwa_visits";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && navigator.standalone === true)
  );
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

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Show a quiet “Lägg till på hemskärmen” chip after beforeinstallprompt,
 * and only for returning visitors (2+ visits).
 */
function setupInstallHint() {
  if (isStandalone() || wasDismissed()) return;

  let deferred = null;
  const visits = visitCount();

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    if (visits < 2) return;
    showHint(() => {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.finally(() => {
        deferred = null;
        hideHint();
        dismiss();
      });
    });
  });
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
    dismiss();
    hideHint();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
}

function hideHint() {
  const el = document.getElementById("pwa-install");
  if (!el) return;
  el.classList.remove("show");
  setTimeout(() => el.remove(), 280);
}

export function initPwa() {
  registerServiceWorker();
  setupInstallHint();
}
