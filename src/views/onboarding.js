import { createMemberProfile } from "../data.js";
import { initialOf, escapeHtml } from "../util.js";

export function renderOnboarding(user, onDone) {
  const app = document.getElementById("app");
  let error = "";
  let loading = false;

  function paint() {
    app.innerHTML = `
      <div class="screen" style="padding:48px 32px 40px">
        <div style="flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
          <div class="auth-mark"><span>H7</span></div>
          <h1 style="margin:14px 0 0;font-size:21px;font-weight:700">What should we call you?</h1>
          <p style="margin:0;font-size:14px;color:var(--ink-muted);text-align:center;max-width:280px">This is how your tag will read on the board.</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:20px">
          <div class="field" style="margin:0">
            <label for="display-name">Your name</label>
            <input id="display-name" type="text" placeholder="e.g. Hassan" autocomplete="given-name" aria-invalid="${!!error}">
          </div>
          ${error ? `<p class="field-error" role="alert" style="text-align:center">${escapeHtml(error)}</p>` : ""}
          <button type="button" id="save-name" class="btn btn-primary" ${loading ? "disabled" : ""}>${loading ? "Saving…" : "Join the list"}</button>
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
