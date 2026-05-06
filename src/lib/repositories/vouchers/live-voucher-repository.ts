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
import { sanitizeFirestoreDocument, sanitizeFirestorePatch } from "@/lib/firebase/sanitize-firestore";
import { withFirestoreDocId } from "@/lib/firebase/with-firestore-doc-id";
import type { Voucher } from "@/lib/types";
import type { VoucherRepository } from "@/lib/repositories/vouchers/types";

export const liveVoucherRepository: VoucherRepository = {
  async listVouchers() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, "vouchers"), orderBy("issueDate", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<Voucher>(item));
  },

  async createVoucher(voucher) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(voucher);
    await setDoc(doc(db, "vouchers", voucher.id), payload);
    return payload;
  },

  async updateVoucher(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, "vouchers", id), payload);
    return { id, ...payload } as Voucher;
  },
};
