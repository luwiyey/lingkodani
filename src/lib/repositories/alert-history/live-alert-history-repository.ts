import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { AlertHistoryEntry } from "@/lib/types";
import type { AlertHistoryRepository } from "@/lib/repositories/alert-history/types";

export const liveAlertHistoryRepository: AlertHistoryRepository = {
  async listAlertHistory() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.alertHistory), orderBy("timestamp", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as AlertHistoryEntry);
  },

  async createAlertHistoryEntry(entry) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.alertHistory, entry.id), entry);
    return entry;
  },
};
