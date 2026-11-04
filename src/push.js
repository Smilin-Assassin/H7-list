import { getMessaging, getToken, onMessage, isMessagingSupported, app, db, doc, setDoc, serverTimestamp } from "./firebase.js";
import { vapidKey, HOUSEHOLD_ID } from "./firebase-config.js";
import { showToast } from "./util.js";

export async function enableNotifications(uid) {
  const supported = await isMessagingSupported();
  if (!supported) throw new Error("This browser doesn't support push notifications.");
  if (!("serviceWorker" in navigator)) throw new Error("Service workers aren't available here.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notifications were blocked — enable them in your browser/app settings.");

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error("Couldn't get a notification token — try again.");

  await setDoc(
    doc(db, "households", HOUSEHOLD_ID, "members", uid, "tokens", token),
    { createdAt: serverTimestamp(), token },
  );

  onMessage(messaging, (payload) => {
    showToast(payload.notification?.title || "New update on the list");
  });
}
