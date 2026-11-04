// Sign-in helpers. Phone uses real SMS one-time codes (Firebase Phone Auth).
// Email uses Firebase's native passwordless flow, which is a sign-in LINK
// rather than a typed code — Firebase Auth has no built-in numeric email
// code, so "email OTP" here means "we email you a link that signs you in".
import {
  auth, RecaptchaVerifier, signInWithPhoneNumber, isSignInWithEmailLink,
  sendSignInLinkToEmail, signInWithEmailLink, onAuthStateChanged, signOut,
} from "./firebase.js";

let recaptchaVerifier = null;
let confirmationResult = null;

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export function logOut() {
  return signOut(auth);
}

export async function startPhoneSignIn(phoneNumber, recaptchaContainerId) {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, { size: "invisible" });
  }
  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return confirmationResult;
}

export async function confirmPhoneCode(code) {
  if (!confirmationResult) throw new Error("Start sign-in again — no code was requested yet.");
  return confirmationResult.confirm(code);
}

const EMAIL_STORAGE_KEY = "h7_pending_email";

export async function startEmailSignIn(email) {
  const actionCodeSettings = {
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
}

export function isEmailLinkReturn() {
  return isSignInWithEmailLink(auth, window.location.href);
}

export async function completeEmailSignIn() {
  let email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
  if (!email) {
    email = window.prompt("Confirm the email address you used to request the sign-in link:");
  }
  const result = await signInWithEmailLink(auth, email, window.location.href);
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  return result;
}
