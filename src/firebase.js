// Central place that boots Firebase and exports the SDK pieces the rest of
// the app uses. Loaded straight from Google's CDN as ES modules — no build
// step needed.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";

import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut,
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  getMessaging,
  getToken,
  onMessage,
  isMessagingSupported,
};
