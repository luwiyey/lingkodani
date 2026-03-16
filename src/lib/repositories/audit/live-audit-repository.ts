import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase/client";
import { firebaseCollections } from "@/lib/firebase/collections";
import type { AuditRepository } from "@/lib/repositories/audit/types";
import type { AuditLog } from "@/lib/types";

export const liveAuditRepository: AuditRepository = {
  async listAuditLogs() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.auditLogs), orderBy("timestamp", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as AuditLog);
  },

  async createAuditLog(input) {
    const db = getClientFirestore();
    await setDoc(doc(db, firebaseCollections.auditLogs, input.id), input);
    return input;
  },
};
