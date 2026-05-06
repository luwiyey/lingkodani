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
import type { LogbookRepository } from "@/lib/repositories/logbook/types";
import type { LogbookEntry } from "@/lib/types";

export const liveLogbookRepository: LogbookRepository = {
  async listEntries() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.logbookEntries), orderBy("timestamp", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<LogbookEntry>(item));
  },

  async createEntry(entry) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(entry);
    await setDoc(doc(db, firebaseCollections.logbookEntries, entry.id), payload);
    return payload;
  },

  async updateEntry(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, firebaseCollections.logbookEntries, id), payload);
    return {
      id,
      ...payload,
    } as LogbookEntry;
  },
};
