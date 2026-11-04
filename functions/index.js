// The only server-side piece this app needs: client devices can only
// *request* a push token for themselves, not send pushes to anyone else's
// device, so fan-out notifications go through this Cloud Function instead.
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

exports.notifyOnItemChange = onDocumentWritten(
  "households/{householdId}/items/{itemId}",
  async (event) => {
    const before = event.data.before.exists ? event.data.before.data() : null;
    const after = event.data.after.exists ? event.data.after.data() : null;
    if (!after) return; // item deleted — nothing to notify

    let title = null;
    let body = null;
    let excludeUid = null;

    if (!before) {
      title = "New item added";
      body = `${after.name} was added to the list`;
      excludeUid = after.createdBy;
    } else if (before.status !== "done" && after.status === "done") {
      title = "Checked off";
      body = `${after.name} is done`;
      excludeUid = after.doneBy;
    } else if (!before.helpRequested && after.helpRequested) {
      title = "Help requested";
      body = `Someone needs a hand with ${after.name}`;
    } else if (before.assigneeId !== after.assigneeId && after.assigneeId) {
      title = "New task assigned";
      body = `You were assigned "${after.name}"`;
      // only tell the newly-assigned person
      await sendToMembers(event.params.householdId, [after.assigneeId], title, body);
      return;
    } else {
      return;
    }

    const memberIds = await listMemberIds(event.params.householdId);
    const recipients = memberIds.filter((uid) => uid !== excludeUid);
    await sendToMembers(event.params.householdId, recipients, title, body);
  },
);

async function listMemberIds(householdId) {
  const snap = await db.collection(`households/${householdId}/members`).listDocuments();
  return snap.map((ref) => ref.id);
}

async function sendToMembers(householdId, memberIds, title, body) {
  if (memberIds.length === 0) return;
  const tokenDocs = [];
  for (const uid of memberIds) {
    const tokensSnap = await db.collection(`households/${householdId}/members/${uid}/tokens`).get();
    tokensSnap.forEach((d) => tokenDocs.push({ uid, token: d.id }));
  }
  if (tokenDocs.length === 0) return;

  const messaging = getMessaging();
  const results = await Promise.allSettled(
    tokenDocs.map((t) =>
      messaging.send({
        token: t.token,
        notification: { title, body },
      }),
    ),
  );

  // Clean up tokens that are no longer valid (app uninstalled, etc).
  await Promise.all(
    results.map((r, i) => {
      if (r.status === "rejected" && /registration-token-not-registered/.test(r.reason?.message || "")) {
        const t = tokenDocs[i];
        return db.doc(`households/${householdId}/members/${t.uid}/tokens/${t.token}`).delete().catch(() => {});
      }
      return Promise.resolve();
    }),
  );
}
