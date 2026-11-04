// ----------------------------------------------------------------------------
// Fill this in with YOUR Firebase project's values once you create the
// project in the Firebase console (Project settings -> General -> Your apps
// -> SDK setup and configuration -> Config). Every value below is a public
// identifier, not a secret — it's safe to commit.
// ----------------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "AIzaSyA0y5DHTZCkzwZr7k47-4tYPvgp9XEx02Q",
  authDomain: "h7-coordination.firebaseapp.com",
  projectId: "h7-coordination",
  storageBucket: "h7-coordination.firebasestorage.app",
  messagingSenderId: "543033818248",
  appId: "1:543033818248:web:445a4ac74598b191df333d",
};

// From Project settings -> Cloud Messaging -> Web configuration -> Web Push
// certificates ("Key pair" value). Needed for push notifications.
export const vapidKey = "BN5gt8Y4fRDWDQ8vEUZDtVvhr3ft2Xp83A7i4QqyMCTVyENDqVdSTIv59rmnylKOU-KgT4yhg4mOF_N5wH4nxCg";

// Everything in this app lives under one household document for now.
// This matches the "just this household, pin multi-household for later" plan.
export const HOUSEHOLD_ID = "h7";
