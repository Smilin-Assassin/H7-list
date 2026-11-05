// Sign-in. One tap, no SMS, no email link, no per-person quota — anyone
// with the link signs in anonymously and then picks their name on the
// next screen (see onboarding.js). Firestore's rules only require
// request.auth != null, which anonymous sign-in satisfies just as well
// as phone or email did.
import { auth, signInAnonymously, onAuthStateChanged } from "./firebase.js";

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

// No sign-out. An anonymous session has no credential to sign back in
// with — ending it would silently orphan that person's name and item
// history under an abandoned uid, with no way back. Clearing a
// member's identity on the board isn't offered as a quick settings
// action for the same reason.
export function joinWithLink() {
  return signInAnonymously(auth);
}
