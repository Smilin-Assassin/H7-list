import { watchAuth, isEmailLinkReturn, completeEmailSignIn } from "./auth.js";
import { ensureHousehold, getMemberProfile } from "./data.js";
import { renderLogin } from "./views/login.js";
import { renderOnboarding } from "./views/onboarding.js";
import { renderHome } from "./views/home.js";
import { renderAddItem } from "./views/addItem.js";
import { renderArchive } from "./views/archive.js";
import { renderMe } from "./views/me.js";
import { registerRoute, startRouter } from "./router.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

let appCleanup = null;
function clearScreen() {
  if (typeof appCleanup === "function") {
    try { appCleanup(); } catch (e) { /* ignore */ }
  }
  appCleanup = null;
}

function showFatalError(err) {
  console.error(err);
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = `
    <div style="padding:40px 28px;text-align:center;font-family:system-ui,sans-serif;color:#241F18">
      <p style="font-weight:700;margin-bottom:8px">Something went wrong loading H7 List</p>
      <p style="color:#6B6256;font-size:13px;margin-bottom:16px">${(err && err.message) ? String(err.message).replace(/</g, "&lt;") : "Unknown error"}</p>
      <button type="button" onclick="location.reload()" style="padding:10px 20px;border-radius:10px;border:none;background:#2E6F5E;color:#fff;font-weight:700">Reload</button>
    </div>`;
}

window.addEventListener("error", (e) => showFatalError(e.error || e));
window.addEventListener("unhandledrejection", (e) => showFatalError(e.reason));

async function boot() {
  if (isEmailLinkReturn()) {
    try {
      await completeEmailSignIn();
    } catch (err) {
      console.error("Email link sign-in failed", err);
    }
  }

  watchAuth(async (user) => {
    clearScreen();
    if (!user) {
      appCleanup = renderLogin();
      return;
    }
    // Only touch the household doc once someone is actually signed in —
    // Firestore's rules (correctly) refuse reads from signed-out requests.
    await ensureHousehold();
    const profile = await getMemberProfile(user.uid);
    if (!profile) {
      appCleanup = renderOnboarding(user, () => {
        clearScreen();
        startAppRoutes(user);
      });
      return;
    }
    startAppRoutes(user);
  });
}

let routesStarted = false;
function startAppRoutes(user) {
  if (!routesStarted) {
    registerRoute("/", () => renderHome(user));
    registerRoute("/add", () => renderAddItem(user));
    registerRoute("/archive", () => renderArchive());
    registerRoute("/me", () => renderMe(user));
    registerRoute("/404", () => renderHome(user));
    routesStarted = true;
    startRouter();
  } else {
    // Already running (e.g. returning after onboarding) — just re-render.
    window.dispatchEvent(new Event("hashchange"));
  }
}

boot();
