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
import type { AuditRepository } from "@/lib/repositories/audit/types";
import type { AuditLog } from "@/lib/types";

export const liveAuditRepository: AuditRepository = {
  async listAuditLogs() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, firebaseCollections.auditLogs), orderBy("timestamp", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<AuditLog>(item));
  },

  async createAuditLog(input) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(input);
    await setDoc(doc(db, firebaseCollections.auditLogs, input.id), payload);
    return payload;
  },

  async updateAuditLog(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, firebaseCollections.auditLogs, id), payload);
    return {
      id,
      ...payload,
    } as AuditLog;
  },
};
