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

async function boot() {
  await ensureHousehold();

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
