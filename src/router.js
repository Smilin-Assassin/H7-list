// Minimal hash router. Each base route renders into #app and returns an
// optional cleanup function, called before the next base route renders (so
// Firestore listeners from the previous screen get unsubscribed).
//
// An "overlay" route (e.g. /add) is different: it's a modal over whatever
// base screen is already mounted, not a screen of its own. Opening one
// must NOT tear down and re-render the base screen behind it — that's the
// whole point of it being a popup instead of a full-page navigation. So
// overlay routes get their own cleanup slot and never touch `routes` /
// `currentCleanup`.
const routes = {};
const overlays = {};
let currentCleanup = null;
let currentBasePath = null;
let overlayCleanup = null;
let guard = null; // optional function(path) -> redirect path | null

export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
}

export function registerOverlay(path, renderFn) {
  overlays[path] = renderFn;
}

export function setGuard(fn) {
  guard = fn;
}

export function navigate(path) {
  if (window.location.hash === `#${path}`) {
    renderCurrent();
  } else {
    window.location.hash = path;
  }
}

function currentPath() {
  return window.location.hash.replace(/^#/, "") || "/";
}

async function closeOverlay() {
  if (typeof overlayCleanup === "function") {
    try { overlayCleanup(); } catch (e) { /* ignore */ }
  }
  overlayCleanup = null;
  const root = document.getElementById("modal-root");
  if (root) root.innerHTML = "";
}

async function renderCurrent() {
  let path = currentPath();
  if (guard) {
    const redirect = await guard(path);
    if (redirect && redirect !== path) {
      window.location.hash = redirect;
      return;
    }
  }

  if (overlays[path]) {
    if (currentBasePath === null) {
      // Deep link / refresh landed directly on an overlay path (e.g.
      // #/add) with nothing mounted yet — give the overlay a base
      // screen to sit on top of before opening it.
      const baseRender = routes["/"] || routes["/404"];
      currentBasePath = "/";
      currentCleanup = await baseRender();
    }
    // The base screen underneath stays exactly as it is — only the
    // overlay mounts/remounts.
    if (overlayCleanup) await closeOverlay();
    overlayCleanup = await overlays[path]();
    return;
  }

  // Landing on a non-overlay path closes any open overlay first.
  if (overlayCleanup) await closeOverlay();

  if (path === currentBasePath) return; // base screen is already up, nothing to do

  if (typeof currentCleanup === "function") {
    try { currentCleanup(); } catch (e) { /* ignore */ }
  }
  const render = routes[path] || routes["/404"];
  currentBasePath = path;
  currentCleanup = await render();
}

export function startRouter() {
  window.addEventListener("hashchange", renderCurrent);
  renderCurrent();
}

export function rerender() {
  renderCurrent();
}
