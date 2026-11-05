import { joinWithLink } from "../auth.js";

let loading = false;
let error = "";

function root() {
  return document.getElementById("app");
}

function render() {
  const app = root();
  app.innerHTML = `
    <div class="screen auth-screen">
      <div class="auth-center">
        <div class="auth-intro">
          <div class="auth-mark"><span>H7</span></div>
          <h1>Duty board</h1>
          <p>Shared shopping &amp; tasks board for the apartment</p>
        </div>

        <div class="auth-action">
          <button type="button" id="join-btn" class="btn btn-primary" ${loading ? "disabled" : ""}>${loading ? "Joining…" : "Join the board"}</button>
          <p style="margin:0;font-size:12px;color:var(--ink-faint);text-align:center;line-height:1.5">One link for everyone in H7 — no code, no sign-up. Tap to join, then tell us your name.</p>
          ${error ? `<p class="field-error" role="alert" style="text-align:center">${error}</p>` : ""}
        </div>
      </div>

      <p class="auth-footer">H7 · household of 5</p>
    </div>
  `;

  const joinBtn = document.getElementById("join-btn");
  if (joinBtn) joinBtn.addEventListener("click", async () => {
    loading = true;
    error = "";
    render();
    try {
      await joinWithLink();
      // Auth state listener in app.js takes it from here (straight to the
      // name screen, since there's no profile yet for a new anonymous uid).
    } catch (err) {
      loading = false;
      error = `Something went wrong (${(err && err.code) || (err && err.message) || "unknown error"}). Please try again.`;
      render();
    }
  });
}

export function renderLogin() {
  loading = false;
  error = "";
  render();
  return () => {};
}
