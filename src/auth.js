// Sign-in. One tap, no SMS, no email link, no per-person quota — anyone
// with the link signs in anonymously and then picks their name on the
// next screen (see onboarding.js). Firestore's rules only require
// request.auth != null, which anonymous sign-in satisfies just as well
// as phone or email did.
import { auth, signInAnonymously, onAuthStateChanged, signOut } from "./firebase.js";

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export function logOut() {
  return signOut(auth);
}

export function joinWithLink() {
  return signInAnonymously(auth);
}
