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
import type { SmsTrainingRepository } from "@/lib/repositories/sms-training/types";
import type { SmsTrainingExample } from "@/lib/types";

export const liveSmsTrainingRepository: SmsTrainingRepository = {
  async listTrainingExamples() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.smsTrainingExamples), orderBy("finalReview.reviewedAt", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as SmsTrainingExample);
  },

  async createTrainingExample(example) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.smsTrainingExamples, example.id), example);
    return example;
  },

  async updateTrainingExample(id, updates) {
    const db = getClientFirestore();
    await updateDoc(doc(db, firebaseCollections.smsTrainingExamples, id), updates);
    return {
      id,
      ...updates,
    } as SmsTrainingExample;
  },
};
