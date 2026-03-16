import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { FarmerAssistanceRecord } from "@/lib/types";
import type { AssistanceRepository } from "@/lib/repositories/assistance/types";

function compactUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export const liveAssistanceRepository: AssistanceRepository = {
  async listAssistanceRecords() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.assistanceRecords), orderBy("updatedAt", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as FarmerAssistanceRecord);
  },

  async createAssistanceRecord(record) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.assistanceRecords, record.id), record);
    return record;
  },

  async updateAssistanceRecord(id, updates) {
    const db = getClientFirestore();
    const payload = compactUndefined(updates);
    await updateDoc(doc(db, firebaseCollections.assistanceRecords, id), payload);
    return {
      id,
      ...payload,
    } as FarmerAssistanceRecord;
  },
};
