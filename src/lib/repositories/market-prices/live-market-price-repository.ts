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
import type { MarketPriceEntry } from "@/lib/types";
import type { MarketPriceRepository } from "@/lib/repositories/market-prices/types";

function compactUndefined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export const liveMarketPriceRepository: MarketPriceRepository = {
  async listMarketPrices() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.marketPrices), orderBy("updatedAt", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as MarketPriceEntry);
  },

  async createMarketPriceEntry(entry) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.marketPrices, entry.id), entry);
    return entry;
  },

  async updateMarketPriceEntry(id, updates) {
    const db = getClientFirestore();
    const payload = compactUndefined(updates);
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
