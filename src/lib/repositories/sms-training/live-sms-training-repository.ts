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
import type { SmsTrainingRepository } from "@/lib/repositories/sms-training/types";
import type { SmsTrainingExample } from "@/lib/types";

export const liveSmsTrainingRepository: SmsTrainingRepository = {
  async listTrainingExamples() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.smsTrainingExamples), orderBy("finalReview.reviewedAt", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<SmsTrainingExample>(item));
  },

  async createTrainingExample(example) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(example);
    await setDoc(doc(db, firebaseCollections.smsTrainingExamples, example.id), payload);
    return payload;
  },

  async updateTrainingExample(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, firebaseCollections.smsTrainingExamples, id), payload);
    return {
      id,
      ...payload,
    } as SmsTrainingExample;
  },
};
