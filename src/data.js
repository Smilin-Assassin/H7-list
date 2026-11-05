// Firestore access layer. Everything lives under one household document
// (households/h7) for now — see firebase-config.js HOUSEHOLD_ID.
import {
  db, doc, collection, onSnapshot, query, orderBy, addDoc, updateDoc,
  getDoc, setDoc, writeBatch, serverTimestamp,
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
// archive batch together, with a reimbursement summary computed from
// who bought what. Called after any item is marked done.
export async function archiveIfCycleComplete(allItems, members) {
  const current = allItems.filter((i) => !i.batchId);
  if (current.length === 0) return;
  const stillOpen = current.some((i) => i.status !== "done");
  if (stillOpen) return;

  const batch = writeBatch(db);
  const batchRef = doc(batchesCol());

  const totalsByMember = {};
  const snapshotItems = current.map((i) => {
    if (i.costEstimate) {
      totalsByMember[i.doneBy] = (totalsByMember[i.doneBy] || 0) + i.costEstimate;
    }
    return {
      id: i.id,
      name: i.name,
      category: i.category,
      costEstimate: i.costEstimate || null,
      doneBy: i.doneBy || null,
    };
  });

  const memberIds = Object.keys(members);
  const total = Object.values(totalsByMember).reduce((a, b) => a + b, 0);
  const evenShare = memberIds.length > 0 ? total / memberIds.length : 0;
  const settlement = memberIds.map((uid) => ({
    memberId: uid,
    paid: totalsByMember[uid] || 0,
    // positive = this person owes the group; negative = should be reimbursed
    balance: Math.round((evenShare - (totalsByMember[uid] || 0)) * 100) / 100,
  }));

  batch.set(batchRef, {
    clearedAt: serverTimestamp(),
    items: snapshotItems,
    total,
    evenShare: Math.round(evenShare * 100) / 100,
    settlement,
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
