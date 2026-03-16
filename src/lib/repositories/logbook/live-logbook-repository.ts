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
import type { LogbookRepository } from "@/lib/repositories/logbook/types";
import type { LogbookEntry } from "@/lib/types";

export const liveLogbookRepository: LogbookRepository = {
  async listEntries() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.logbookEntries), orderBy("timestamp", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as LogbookEntry);
  },

  async createEntry(entry) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.logbookEntries, entry.id), entry);
    return entry;
  },
};
