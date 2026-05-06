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
import type { FieldVisitTask } from "@/lib/types";
import type { FieldVisitRepository } from "@/lib/repositories/field-visits/types";

export const liveFieldVisitRepository: FieldVisitRepository = {
  async listFieldVisitTasks() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.fieldVisitTasks), orderBy("scheduledFor", "asc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<FieldVisitTask>(item));
  },

  async createFieldVisitTask(task) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(task);
    await setDoc(doc(db, firebaseCollections.fieldVisitTasks, task.id), payload);
    return payload;
  },

  async updateFieldVisitTask(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, firebaseCollections.fieldVisitTasks, id), payload);
    return {
      id,
      ...payload,
    } as FieldVisitTask;
  },
};
