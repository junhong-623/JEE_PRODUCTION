import {
  collection, query, orderBy, getDocs, doc,
  deleteDoc, writeBatch, limit, getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export async function fetchCollection(colName, opts = {}) {
  try {
    let q = collection(db, colName);
    if (opts.orderBy) q = query(q, orderBy(opts.orderBy, opts.dir || "desc"));
    if (opts.limit)   q = query(q, limit(opts.limit));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, colName));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

export async function fetchSubcollection(tripId, col) {
  const snap = await getDocs(collection(db, "trips", tripId, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTripDetails(tripId) {
  const [schedule, messages, photos, people, receipts] = await Promise.all([
    fetchSubcollection(tripId, "schedule"),
    fetchSubcollection(tripId, "messages"),
    fetchSubcollection(tripId, "photos"),
    fetchSubcollection(tripId, "people"),
    fetchSubcollection(tripId, "receipts"),
  ]);
  return { schedule, messages, photos, people, receipts };
}

export async function deleteTripCascade(tripId) {
  const cols = ["receipts","people","photos","settlements","schedule","messages"];
  for (const col of cols) {
    const snap = await getDocs(collection(db, "trips", tripId, col));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }
  await deleteDoc(doc(db, "trips", tripId));
}

export async function deletePushSubscription(id) {
  await deleteDoc(doc(db, "pushSubscriptions", id));
}

export async function getAllReceiptsSampled(trips, maxTrips = 60) {
  const receipts = [];
  for (const trip of trips.slice(0, maxTrips)) {
    const snap = await getDocs(collection(db, "trips", trip.id, "receipts"));
    snap.docs.forEach(r => receipts.push({
      id: r.id,
      tripId: trip.id,
      tripName: trip.name || "Untitled",
      ...r.data(),
    }));
  }
  return receipts;
}
