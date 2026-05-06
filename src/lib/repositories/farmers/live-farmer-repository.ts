import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import { sanitizeFirestoreDocument, sanitizeFirestorePatch } from "@/lib/firebase/sanitize-firestore";
import { withFirestoreDocId } from "@/lib/firebase/with-firestore-doc-id";
import type { FarmerRepository } from "@/lib/repositories/farmers/types";
import type { Farmer } from "@/lib/types";

export const liveFarmerRepository: FarmerRepository = {
  async listFarmers() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.farmers), orderBy("registrationDate", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<Farmer>(item));
  },

  async createFarmer(input) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(input);
    await setDoc(doc(db, firebaseCollections.farmers, input.id), payload);
    return payload;
  },

  async updateFarmer(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, firebaseCollections.farmers, id), payload);
    return {
      id,
      ...payload,
    } as Farmer;
  },

  async deleteFarmer(id) {
    const db = getClientFirestore();
    await deleteDoc(doc(db, firebaseCollections.farmers, id));
  },
};
