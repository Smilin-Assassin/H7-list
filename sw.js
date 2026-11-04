// Single service worker: offline app-shell caching + Firebase Cloud
// Messaging background push. Classic (non-module) worker, so Firebase is
// loaded with importScripts rather than ES import.
//
// IMPORTANT: the firebaseConfig values below must be kept in sync with
// src/firebase-config.js by hand — a service worker can't import that
// module directly. These are all public identifiers, never secrets.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyA0y5DHTZCkzwZr7k47-4tYPvgp9XEx02Q",
  authDomain: "h7-coordination.firebaseapp.com",
  projectId: "h7-coordination",
  storageBucket: "h7-coordination.firebasestorage.app",
  messagingSenderId: "543033818248",
  appId: "1:543033818248:web:445a4ac74598b191df333d",
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "H7 List";
    const body = payload.notification?.body || "";
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });
  });
} catch (e) {
  // Config not filled in yet — messaging just stays off until it is.
}

const CACHE_NAME = "h7-shell-v1";
const SHELL_FILES = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // never cache Firebase/CDN calls

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/");
    }),
  );
});
