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
import type { FarmerRepository } from "@/lib/repositories/farmers/types";
import type { Farmer } from "@/lib/types";

export const liveFarmerRepository: FarmerRepository = {
  async listFarmers() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.farmers), orderBy("registrationDate", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as Farmer);
  },

  async createFarmer(input) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.farmers, input.id), input);
    return input;
  },

  async updateFarmer(id, updates) {
    const db = getClientFirestore();
    await updateDoc(doc(db, firebaseCollections.farmers, id), updates);
    return {
      id,
      ...updates,
    } as Farmer;
  },

  async deleteFarmer(id) {
    const db = getClientFirestore();
    await deleteDoc(doc(db, firebaseCollections.farmers, id));
  },
};
