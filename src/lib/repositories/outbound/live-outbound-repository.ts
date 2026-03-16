import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { OutboundMessage } from "@/lib/types";
import type { OutboundMessageRepository } from "@/lib/repositories/outbound/types";

function compactUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export const liveOutboundRepository: OutboundMessageRepository = {
  async listOutboundMessages() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.outboundMessages), orderBy("createdAt", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as OutboundMessage);
  },

  async createOutboundMessage(message) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.outboundMessages, message.id), message);
    return message;
  },

  async updateOutboundMessage(id, updates) {
    const db = getClientFirestore();
    const payload = compactUndefined(updates);
    await updateDoc(doc(db, firebaseCollections.outboundMessages, id), payload);
    return {
      id,
      ...payload,
    } as OutboundMessage;
  },

  async findByProviderMessageId(providerMessageId) {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(
        collection(db, firebaseCollections.outboundMessages),
        where("providerMessageId", "==", providerMessageId)
      )
    );

    const first = snapshot.docs[0];
    return first ? (first.data() as OutboundMessage) : null;
  },
};
