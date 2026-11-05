// Central place that boots Firebase and exports the SDK pieces the rest of
// the app uses. Imported from the npm "firebase" package (see package.json)
// so the build step can bundle it into dist/app.js — one file, one request,
// instead of the browser fetching the SDK live from Google's CDN in several
// pieces on every cold load.
import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
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
} from "firebase/firestore";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
} from "firebase/messaging";

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
