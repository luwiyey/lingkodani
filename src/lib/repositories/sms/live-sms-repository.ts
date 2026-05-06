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
import type { NewSmsRecordInput, SmsRepository } from "@/lib/repositories/sms/types";
import type { SmsMessage } from "@/lib/types";

export const liveSmsRepository: SmsRepository = {
  async listMessages() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.smsMessages), orderBy("timestamp", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<SmsMessage>(item));
  },

  async createInboundMessage(input: NewSmsRecordInput) {
    const db = getClientFirestore();
    const message: SmsMessage = {
      ...input,
      id: input.id ?? `SMS${Date.now()}`,
    };

    const payload = sanitizeFirestoreDocument(message);
    await setDoc(doc(db, firebaseCollections.smsMessages, message.id), payload);
    return payload;
  },

  async updateMessage(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, firebaseCollections.smsMessages, id), payload);
    return {
      id,
      ...payload,
    } as SmsMessage;
  },
};
