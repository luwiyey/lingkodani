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

  async updateAuditLog(id, updates) {
    const db = getClientFirestore();
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await updateDoc(doc(db, firebaseCollections.auditLogs, id), payload);
    return {
      id,
      ...payload,
    } as AuditLog;
  },
};
