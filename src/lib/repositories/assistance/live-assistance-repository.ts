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
import { sanitizeFirestoreDocument, sanitizeFirestorePatch } from "@/lib/firebase/sanitize-firestore";
import { withFirestoreDocId } from "@/lib/firebase/with-firestore-doc-id";
import type { FarmerAssistanceRecord } from "@/lib/types";
import type { AssistanceRepository } from "@/lib/repositories/assistance/types";

export const liveAssistanceRepository: AssistanceRepository = {
  async listAssistanceRecords() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.assistanceRecords), orderBy("updatedAt", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<FarmerAssistanceRecord>(item));
  },

  async createAssistanceRecord(record) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(record);
    await setDoc(doc(db, firebaseCollections.assistanceRecords, record.id), payload);
    return payload;
  },

  async updateAssistanceRecord(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, firebaseCollections.assistanceRecords, id), payload);
    return {
      id,
      ...payload,
    } as FarmerAssistanceRecord;
  },
};
