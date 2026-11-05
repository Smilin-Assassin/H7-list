// Central place that boots Firebase and exports the SDK pieces the rest of
// the app uses. Imported from the npm "firebase" package (see package.json)
// so the build step can bundle it into dist/app.js — one file, one request,
// instead of the browser fetching the SDK live from Google's CDN in several
// pieces on every cold load.
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
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
// A persistent local (IndexedDB) cache means a returning visit can often
// show data straight from disk while Firestore reconnects in the
// background, instead of every open waiting on a fresh network round
// trip. persistentMultipleTabManager so it still works with the PWA and
// a browser tab open at the same time.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export {
  signInAnonymously,
  onAuthStateChanged,
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
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
