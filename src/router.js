// Minimal hash router. Each route renders into #app and returns an optional
// cleanup function, called before the next route renders (so Firestore
// listeners from the previous screen get unsubscribed).
const routes = {};
let currentCleanup = null;
let guard = null; // optional function(path) -> redirect path | null

export function registerRoute(path, renderFn) {
  routes[path] = renderFn;
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

async function renderCurrent() {
  let path = currentPath();
  if (guard) {
    const redirect = await guard(path);
    if (redirect && redirect !== path) {
      window.location.hash = redirect;
      return;
    }
  }
  if (typeof currentCleanup === "function") {
    try { currentCleanup(); } catch (e) { /* ignore */ }
  }
  const render = routes[path] || routes["/404"];
  currentCleanup = await render();
}

export function startRouter() {
  window.addEventListener("hashchange", renderCurrent);
  renderCurrent();
}

export function rerender() {
  renderCurrent();
}
