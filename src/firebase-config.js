// ----------------------------------------------------------------------------
// Fill this in with YOUR Firebase project's values once you create the
// project in the Firebase console (Project settings -> General -> Your apps
// -> SDK setup and configuration -> Config). Every value below is a public
// identifier, not a secret — it's safe to commit.
// ----------------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

// From Project settings -> Cloud Messaging -> Web configuration -> Web Push
// certificates ("Key pair" value). Needed for push notifications.
export const vapidKey = "REPLACE_ME";

// Everything in this app lives under one household document for now.
// This matches the "just this household, pin multi-household for later" plan.
export const HOUSEHOLD_ID = "h7";
