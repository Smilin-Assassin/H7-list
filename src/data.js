// Firestore access layer. Everything lives under one household document
// (households/h7) for now — see firebase-config.js HOUSEHOLD_ID.
import {
  db, doc, collection, onSnapshot, query, orderBy, where, addDoc, updateDoc,
  deleteDoc, getDocs, getDoc, setDoc, writeBatch, serverTimestamp,
} from "./firebase.js";
import { HOUSEHOLD_ID } from "./firebase-config.js";

const householdRef = () => doc(db, "households", HOUSEHOLD_ID);
const membersCol = () => collection(db, "households", HOUSEHOLD_ID, "members");
const itemsCol = () => collection(db, "households", HOUSEHOLD_ID, "items");
const batchesCol = () => collection(db, "households", HOUSEHOLD_ID, "batches");

// ---- Household / membership -----------------------------------------

export async function ensureHousehold() {
  const ref = householdRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: "H7",
      createdAt: serverTimestamp(),
      memberIds: [],
      financeLeadId: null,
    });
  }
  return ref;
}

export async function getMemberProfile(uid) {
  const snap = await getDoc(doc(membersCol(), uid));
  return snap.exists() ? { id: uid, ...snap.data() } : null;
}

export async function createMemberProfile(uid, { displayName, initial }) {
  await setDoc(doc(membersCol(), uid), {
    displayName,
    initial,
    joinedAt: serverTimestamp(),
  });
  const household = householdRef();
  const snap = await getDoc(household);
  const data = snap.data() || {};
  const memberIds = Array.isArray(data.memberIds) ? data.memberIds : [];
  if (!memberIds.includes(uid)) {
    await setDoc(
      household,
      {
        memberIds: [...memberIds, uid],
        financeLeadId: data.financeLeadId || uid, // first person in is finance lead by default
      },
      { merge: true },
    );
  }
}

export function subscribeMembers(cb) {
  return onSnapshot(membersCol(), (snap) => {
    const members = {};
    snap.forEach((d) => { members[d.id] = { id: d.id, ...d.data() }; });
    cb(members);
  });
}

export function subscribeHousehold(cb) {
  return onSnapshot(householdRef(), (snap) => cb(snap.exists() ? snap.data() : null));
}

export async function setFinanceLead(uid) {
  await updateDoc(householdRef(), { financeLeadId: uid });
}

// Remove a member profile — e.g. a duplicate created by signing in again
// on a different device/browser (anonymous auth gives each one its own
// uid). Items that reference this uid (assigneeId/doneBy) are left as-is;
// every screen already falls back to "Someone"/"?" for an unknown member,
// so nothing breaks, it just reads a little more anonymously after this.
export async function deleteMember(uid) {
  // Update the household doc *before* deleting the member doc: its
  // write rule requires the caller to currently be a member, and if
  // you're removing your own (duplicate) profile, deleting it first
  // would fail that check on the household update right after.
  const household = householdRef();
  const snap = await getDoc(household);
  const data = snap.data() || {};
  const memberIds = Array.isArray(data.memberIds) ? data.memberIds : [];
  const remaining = memberIds.filter((id) => id !== uid);
  const patch = { memberIds: remaining };
  if (data.financeLeadId === uid) {
    patch.financeLeadId = remaining[0] || null;
  }
  await setDoc(household, patch, { merge: true });

  await deleteDoc(doc(membersCol(), uid));
}

// ---- Items -------------------------------------------------------------

export function subscribeItems(cb) {
  const q = query(itemsCol(), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(items);
  });
}

export async function addItem({ name, category, quantity, assigneeId, costEstimate, note, createdBy }) {
  await addDoc(itemsCol(), {
    name,
    category,
    quantity: quantity || 1,
    assigneeId: assigneeId || null,
    costEstimate: typeof costEstimate === "number" ? costEstimate : null,
    note: note || "",
    status: "open",
    helpRequested: false,
    batchId: null,
    createdBy,
    createdAt: serverTimestamp(),
    doneBy: null,
    doneAt: null,
  });
}

// Bulk add: one write batch for N items, all sharing category/assignee
// but otherwise identical to a single addItem — same "open" status, no
// auto-splitting of quantity/cost/note per line. Those stay per-item
// defaults the person can edit afterward, same as any other item.
export async function addItems(items) {
  if (!items.length) return;
  const batch = writeBatch(db);
  items.forEach(({ name, category, assigneeId, createdBy }) => {
    const ref = doc(itemsCol());
    batch.set(ref, {
      name,
      category,
      quantity: 1,
      assigneeId: assigneeId || null,
      costEstimate: null,
      note: "",
      status: "open",
      helpRequested: false,
      batchId: null,
      createdBy,
      createdAt: serverTimestamp(),
      doneBy: null,
      doneAt: null,
    });
  });
  await batch.commit();
}

export async function markItemDone(itemId, uid) {
  await updateDoc(doc(itemsCol(), itemId), {
    status: "done",
    doneBy: uid,
    doneAt: serverTimestamp(),
  });
}

export async function markItemOpen(itemId) {
  await updateDoc(doc(itemsCol(), itemId), {
    status: "open",
    doneBy: null,
    doneAt: null,
  });
}

export async function requestHelp(itemId) {
  await updateDoc(doc(itemsCol(), itemId), { helpRequested: true });
}

export async function getItem(itemId) {
  const snap = await getDoc(doc(itemsCol(), itemId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Partial update from the edit-item form. Only the fields the form
// actually sends get touched — callers pass exactly what changed.
export async function updateItem(itemId, fields) {
  await updateDoc(doc(itemsCol(), itemId), fields);
}

export async function deleteItem(itemId) {
  await deleteDoc(doc(itemsCol(), itemId));
}

// Sweep whichever items are currently marked "done" into a new Cleared
// batch, leaving any still-open items on the board untouched. This is an
// explicit action (the "Mark as paid" button), not automatic — a round
// only moves to the archive once someone says it's actually settled, so
// a list that happens to end up fully ticked off doesn't silently vanish
// before anyone's been paid back. No computed reimbursement/split here —
// just a record of what was bought and who bought it; archive.js shows
// per-person totals straight from `items` on read.
export async function markCurrentAsPaid(allItems) {
  const current = allItems.filter((i) => !i.batchId && i.status === "done");
  if (current.length === 0) return;

  const batch = writeBatch(db);
  const batchRef = doc(batchesCol());

  let total = 0;
  const snapshotItems = current.map((i) => {
    if (i.costEstimate) total += i.costEstimate;
    return {
      id: i.id,
      name: i.name,
      category: i.category,
      costEstimate: i.costEstimate || null,
      doneBy: i.doneBy || null,
    };
  });

  batch.set(batchRef, {
    clearedAt: serverTimestamp(),
    items: snapshotItems,
    total,
  });

  current.forEach((i) => {
    batch.update(doc(itemsCol(), i.id), { batchId: batchRef.id });
  });

  await batch.commit();
}

export function subscribeBatches(cb) {
  const q = query(batchesCol(), orderBy("clearedAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Delete a cleared round entirely — for wiping out a test round, not an
// everyday action. Removes the batch doc plus every item that was swept
// into it (they're otherwise just orphaned "done" records sitting under
// items/ forever with no screen that shows them again).
export async function deleteBatch(batchId) {
  const itemsSnap = await getDocs(query(itemsCol(), where("batchId", "==", batchId)));
  const batch = writeBatch(db);
  itemsSnap.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(batchesCol(), batchId));
  await batch.commit();
}

// Correct a cleared item's price after the fact (a typo, a receipt that
// turned up later). The batch doc's own `items` snapshot is what the
// archive screen reads and totals from, so that's the source of truth to
// rewrite; the original item doc is updated too, best-effort, in case
// anything else still reads it.
export async function updateBatchItemCost(batchId, itemId, costEstimate) {
  const batchRef = doc(batchesCol(), batchId);
  const snap = await getDoc(batchRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const items = (data.items || []).map((i) => (
    i.id === itemId ? { ...i, costEstimate } : i
  ));
  const total = items.reduce((sum, i) => sum + (i.costEstimate || 0), 0);
  await updateDoc(batchRef, { items, total });
  try {
    await updateDoc(doc(itemsCol(), itemId), { costEstimate });
  } catch {
    // Item may have been deleted separately — the batch snapshot is the
    // one that matters for the archive screen, so this is non-fatal.
  }
}
