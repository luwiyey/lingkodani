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
import type { FieldVisitTask } from "@/lib/types";
import type { FieldVisitRepository } from "@/lib/repositories/field-visits/types";

function compactUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export const liveFieldVisitRepository: FieldVisitRepository = {
  async listFieldVisitTasks() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.fieldVisitTasks), orderBy("scheduledFor", "asc"))
    );

    return snapshot.docs.map((item) => item.data() as FieldVisitTask);
  },

  async createFieldVisitTask(task) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.fieldVisitTasks, task.id), task);
    return task;
  },

  async updateFieldVisitTask(id, updates) {
    const db = getClientFirestore();
    const payload = compactUndefined(updates);
    await updateDoc(doc(db, firebaseCollections.fieldVisitTasks, id), payload);
    return {
      id,
      ...payload,
    } as FieldVisitTask;
  },
};
