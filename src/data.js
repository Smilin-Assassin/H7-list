// Firestore access layer. Everything lives under one household document
// (households/h7) for now — see firebase-config.js HOUSEHOLD_ID.
import {
  db, doc, collection, onSnapshot, query, orderBy, where, addDoc, updateDoc,
  getDocs, getDoc, setDoc, writeBatch, serverTimestamp,
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

// When every item in the current cycle is done, sweep them into a new
// archive batch together. No computed reimbursement/split here — just a
// record of what was bought and who bought it; archive.js shows per-person
// totals straight from `items` on read. Called after any item is marked
// done.
export async function archiveIfCycleComplete(allItems, members) {
  const current = allItems.filter((i) => !i.batchId);
  if (current.length === 0) return;
  const stillOpen = current.some((i) => i.status !== "done");
  if (stillOpen) return;

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
