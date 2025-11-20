import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../../../firebase/config";

export const firebaseAdapter = {
  // GET ALL
  async getAll(collectionName) {
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // GET BY ID
  async getById(collectionName, id) {
    const ref = doc(db, collectionName, id);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  // QUERY
  async where(collectionName, conditions = []) {
    let q = collection(db, collectionName);

    let builtQuery = query(
      q,
      ...conditions.map((c) => where(c.field, c.op, c.value))
    );

    const snap = await getDocs(builtQuery);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  // CREATE
  async create(collectionName, data) {
    const ref = await addDoc(collection(db, collectionName), data);
    return ref.id;
  },

  // UPDATE
  async update(collectionName, id, data) {
    await updateDoc(doc(db, collectionName, id), data);
  },

  // DELETE
  async remove(collectionName, id) {
    await deleteDoc(doc(db, collectionName, id));
  },
};
