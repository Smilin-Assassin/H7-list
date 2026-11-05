import { joinWithLink } from "../auth.js";

let loading = false;
let error = "";

function root() {
  return document.getElementById("app");
}

function render() {
  const app = root();
  app.innerHTML = `
    <div class="screen" style="padding:48px 32px 40px">
      <div style="flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
        <div class="auth-mark"><span>H7</span></div>
        <h1 style="margin:14px 0 0;font-size:22px;font-weight:700">Duty board</h1>
        <p style="margin:0;font-size:14px;color:var(--ink-muted);text-align:center;max-width:260px">Shared shopping &amp; tasks board for the apartment</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:20px">
        <button type="button" id="join-btn" class="btn btn-primary" ${loading ? "disabled" : ""}>${loading ? "Joining…" : "Join the board"}</button>
        <p style="margin:0;font-size:12px;color:var(--ink-faint);text-align:center;line-height:1.5">One link for everyone in H7 — no code, no sign-up. Tap to join, then tell us your name.</p>
        ${error ? `<p class="field-error" role="alert" style="text-align:center">${error}</p>` : ""}
      </div>

      <p style="margin:24px 0 0;font-size:11px;color:var(--ink-faint);text-align:center">H7 · household of 5</p>
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
