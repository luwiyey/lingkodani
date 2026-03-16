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
import type { NewSmsRecordInput, SmsRepository } from "@/lib/repositories/sms/types";
import type { SmsMessage } from "@/lib/types";

function compactUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export const liveSmsRepository: SmsRepository = {
  async listMessages() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.smsMessages), orderBy("timestamp", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as SmsMessage);
  },

  async createInboundMessage(input: NewSmsRecordInput) {
    const db = getClientFirestore();
    const message: SmsMessage = {
      ...input,
      id: input.id ?? `SMS${Date.now()}`,
    };

    await setDoc(doc(db, firebaseCollections.smsMessages, message.id), message);
    return message;
  },

  async updateMessage(id, updates) {
    const db = getClientFirestore();
    const payload = compactUndefined(updates);
    await updateDoc(doc(db, firebaseCollections.smsMessages, id), payload);
    return {
      id,
      ...payload,
    } as SmsMessage;
  },
};
