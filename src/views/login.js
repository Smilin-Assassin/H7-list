import { startPhoneSignIn, confirmPhoneCode, startEmailSignIn } from "../auth.js";
import { showToast } from "../util.js";

let state = { method: "phone", step: "enter", loading: false, error: "" };

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

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
        ${state.step === "enter" ? renderEnterStep() : renderVerifyStep()}
        ${state.error ? `<p class="field-error" role="alert" style="text-align:center">${state.error}</p>` : ""}
      </div>

      <p style="margin:24px 0 0;font-size:11px;color:var(--ink-faint);text-align:center">H7 · household of 5</p>
      <div id="recaptcha-container"></div>
    </div>
  `;
  attachHandlers();
}

function renderEnterStep() {
  return `
    <div role="tablist" aria-label="Sign in method" style="display:flex;background:var(--board-sunken);border:1px solid var(--rule-strong);border-radius:10px;padding:4px;gap:4px">
      <button type="button" id="tab-phone" role="tab" aria-selected="${state.method === "phone"}"
        style="flex:1;min-height:40px;border:none;background:${state.method === "phone" ? "var(--tag-gold)" : "transparent"};color:${state.method === "phone" ? "var(--tag-gold-ink)" : "var(--ink-muted)"};font-weight:700;font-size:14px;border-radius:7px">Phone</button>
      <button type="button" id="tab-email" role="tab" aria-selected="${state.method === "email"}"
        style="flex:1;min-height:40px;border:none;background:${state.method === "email" ? "var(--tag-gold)" : "transparent"};color:${state.method === "email" ? "var(--tag-gold-ink)" : "var(--ink-muted)"};font-weight:700;font-size:14px;border-radius:7px">Email</button>
    </div>

    ${state.method === "phone" ? `
      <div class="field" style="margin:0">
        <label for="phone">Phone number</label>
        <input id="phone" type="tel" inputmode="tel" placeholder="+960 7XX XXXX" value="${state.phone || ""}" aria-invalid="${!!state.error}">
      </div>
      <button type="button" id="submit-phone" class="btn btn-primary" ${state.loading ? "disabled" : ""}>${state.loading ? "Sending…" : "Send code"}</button>
      <p style="margin:0;font-size:12px;color:var(--ink-faint);text-align:center;line-height:1.5">We'll text you a 6-digit code to sign in — no password to remember. Include your country code.</p>
    ` : `
      <div class="field" style="margin:0">
        <label for="email">Email address</label>
        <input id="email" type="email" placeholder="you@example.com" value="${state.email || ""}" aria-invalid="${!!state.error}">
      </div>
      <button type="button" id="submit-email" class="btn btn-primary" ${state.loading ? "disabled" : ""}>${state.loading ? "Sending…" : "Send sign-in link"}</button>
      <p style="margin:0;font-size:12px;color:var(--ink-faint);text-align:center;line-height:1.5">We'll email you a link — open it on this device to finish signing in.</p>
    `}
  `;
}

function renderVerifyStep() {
  return `
    <p style="margin:0;font-size:14px;text-align:center">Enter the code sent to <strong>${state.phone}</strong></p>
    <div class="field" style="margin:0">
      <label for="code">6-digit code</label>
      <input id="code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="123456" aria-invalid="${!!state.error}">
    </div>
    <button type="button" id="submit-code" class="btn btn-primary" ${state.loading ? "disabled" : ""}>${state.loading ? "Verifying…" : "Verify &amp; sign in"}</button>
    <button type="button" id="back-to-enter" class="btn btn-text" style="margin:0 auto">Use a different number</button>
  `;
}

function validatePhone(value) {
  return /^\+[1-9]\d{6,14}$/.test(value.trim());
}
function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function attachHandlers() {
  const tabPhone = document.getElementById("tab-phone");
  const tabEmail = document.getElementById("tab-email");
  if (tabPhone) tabPhone.addEventListener("click", () => setState({ method: "phone", error: "" }));
  if (tabEmail) tabEmail.addEventListener("click", () => setState({ method: "email", error: "" }));

  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("blur", () => {
      if (phoneInput.value && !validatePhone(phoneInput.value)) {
        setState({ phone: phoneInput.value, error: "Include the country code, e.g. +9607XXXXXXX" });
      } else {
        state.phone = phoneInput.value;
        state.error = "";
      }
    });
  }

  const emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      if (emailInput.value && !validateEmail(emailInput.value)) {
        setState({ email: emailInput.value, error: "That doesn't look like a valid email address." });
      } else {
        state.email = emailInput.value;
        state.error = "";
      }
    });
  }

  const submitPhone = document.getElementById("submit-phone");
  if (submitPhone) submitPhone.addEventListener("click", async () => {
    const value = document.getElementById("phone").value.trim();
    if (!validatePhone(value)) {
      setState({ phone: value, error: "Include the country code, e.g. +9607XXXXXXX" });
      return;
    }
    setState({ phone: value, loading: true, error: "" });
    try {
      await startPhoneSignIn(value, "recaptcha-container");
      setState({ loading: false, step: "verify" });
    } catch (err) {
      setState({ loading: false, error: friendlyAuthError(err) });
    }
  });

  const submitEmail = document.getElementById("submit-email");
  if (submitEmail) submitEmail.addEventListener("click", async () => {
    const value = document.getElementById("email").value.trim();
    if (!validateEmail(value)) {
      setState({ email: value, error: "That doesn't look like a valid email address." });
      return;
    }
    setState({ email: value, loading: true, error: "" });
    try {
      await startEmailSignIn(value);
      setState({ loading: false });
      showToast("Link sent — check your email on this device.");
    } catch (err) {
      setState({ loading: false, error: friendlyAuthError(err) });
    }
  });

  const submitCode = document.getElementById("submit-code");
  if (submitCode) submitCode.addEventListener("click", async () => {
    const value = document.getElementById("code").value.trim();
    if (!/^\d{6}$/.test(value)) {
      setState({ error: "Enter the 6-digit code from the text message." });
      return;
    }
    setState({ loading: true, error: "" });
    try {
      await confirmPhoneCode(value);
      // Auth state listener in app.js takes it from here.
    } catch (err) {
      setState({ loading: false, error: friendlyAuthError(err) });
    }
  });

  const backBtn = document.getElementById("back-to-enter");
  if (backBtn) backBtn.addEventListener("click", () => setState({ step: "enter", error: "" }));
}

function friendlyAuthError(err) {
  const code = err && err.code;
  if (code === "auth/invalid-phone-number") return "That phone number doesn't look right.";
  if (code === "auth/invalid-verification-code") return "That code didn't match — check and try again.";
  if (code === "auth/too-many-requests") return "Too many attempts — wait a bit before trying again.";
  if (code === "auth/code-expired") return "That code expired — request a new one.";
  return "Something went wrong. Please try again.";
}

export function renderLogin() {
  state = { method: "phone", step: "enter", loading: false, error: "" };
  render();
  return () => {};
}
