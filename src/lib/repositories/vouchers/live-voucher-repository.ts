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
import type { Voucher } from "@/lib/types";
import type { VoucherRepository } from "@/lib/repositories/vouchers/types";

export const liveVoucherRepository: VoucherRepository = {
  async listVouchers() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, "vouchers"), orderBy("issueDate", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as Voucher);
  },

  async createVoucher(voucher) {
    const db = getClientFirestore();
    await setDoc(doc(db, "vouchers", voucher.id), voucher);
    return voucher;
  },

  async updateVoucher(id, updates) {
    const db = getClientFirestore();
    await updateDoc(doc(db, "vouchers", id), updates);
    return { id, ...updates } as Voucher;
  },
};
