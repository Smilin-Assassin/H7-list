import { createMemberProfile } from "../data.js";
import { initialOf, escapeHtml } from "../util.js";

export function renderOnboarding(user, onDone) {
  const app = document.getElementById("app");
  let error = "";
  let loading = false;

  function paint() {
    app.innerHTML = `
      <div class="screen auth-screen">
        <div class="auth-center">
          <div class="auth-intro">
            <div class="auth-mark"><span>H7</span></div>
            <h1>What should we call you?</h1>
            <p>This is how your tag will read on the board.</p>
          </div>
          <div class="auth-action">
            <div class="field" style="margin:0">
              <label for="display-name">Your name</label>
              <input id="display-name" type="text" placeholder="e.g. Hassan" autocomplete="given-name" aria-invalid="${!!error}">
            </div>
            ${error ? `<p class="field-error" role="alert" style="text-align:center">${escapeHtml(error)}</p>` : ""}
            <button type="button" id="save-name" class="btn btn-primary" ${loading ? "disabled" : ""}>${loading ? "Saving…" : "Join the list"}</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("save-name").addEventListener("click", async () => {
      const input = document.getElementById("display-name");
      const name = input.value.trim();
      if (!name) {
        error = "Enter your name so the others know it's you.";
        paint();
        return;
      }
      loading = true;
      error = "";
      paint();
      try {
        await createMemberProfile(user.uid, {
          displayName: name,
          initial: initialOf(name),
        });
        onDone();
      } catch (err) {
        loading = false;
        error = "Couldn't save that — check your connection and try again.";
        paint();
      }
    });
  }

  paint();
  return () => {};
}
