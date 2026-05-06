import {
  collection,
  deleteDoc,
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
import type { MarketPriceEntry } from "@/lib/types";
import type { MarketPriceRepository } from "@/lib/repositories/market-prices/types";

export const liveMarketPriceRepository: MarketPriceRepository = {
  async listMarketPrices() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.marketPrices), orderBy("updatedAt", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<MarketPriceEntry>(item));
  },

  async createMarketPriceEntry(entry) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(entry);
    await setDoc(doc(db, firebaseCollections.marketPrices, entry.id), payload);
    return payload;
  },

  async updateMarketPriceEntry(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, firebaseCollections.marketPrices, id), payload);
    return {
      id,
      ...payload,
    } as MarketPriceEntry;
  },

  async deleteMarketPriceEntry(id) {
    const db = getClientFirestore();
    await deleteDoc(doc(db, firebaseCollections.marketPrices, id));
  },
};
