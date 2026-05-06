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
import { sanitizeFirestoreDocument, sanitizeFirestorePatch } from "@/lib/firebase/sanitize-firestore";
import { withFirestoreDocId } from "@/lib/firebase/with-firestore-doc-id";
import type { OutboundMessage } from "@/lib/types";
import type { OutboundMessageRepository } from "@/lib/repositories/outbound/types";

export const liveOutboundRepository: OutboundMessageRepository = {
  async listOutboundMessages() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.outboundMessages), orderBy("createdAt", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<OutboundMessage>(item));
  },

  async createOutboundMessage(message) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(message);
    await setDoc(doc(db, firebaseCollections.outboundMessages, message.id), payload);
    return payload;
  },

  async updateOutboundMessage(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
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
    return first ? withFirestoreDocId<OutboundMessage>(first) : null;
  },
};
