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
import { sanitizeFirestoreDocument, sanitizeFirestorePatch } from "@/lib/firebase/sanitize-firestore";
import { withFirestoreDocId } from "@/lib/firebase/with-firestore-doc-id";
import type { Resource } from "@/lib/types";
import type { ResourceRepository } from "@/lib/repositories/resources/types";

export const liveResourceRepository: ResourceRepository = {
  async listResources() {
    const db = getClientFirestore();
    const snapshot = await getDocs(query(collection(db, "resources"), orderBy("lastUpdated", "desc")));
    return snapshot.docs.map((item) => withFirestoreDocId<Resource>(item));
  },

  async createResource(resource) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(resource);
    await setDoc(doc(db, "resources", resource.id), payload);
    return payload;
  },

  async updateResource(id, updates) {
    const db = getClientFirestore();
    const payload = sanitizeFirestorePatch(updates);
    await updateDoc(doc(db, "resources", id), payload);
    return { id, ...payload } as Resource;
  },

  async deleteResource(id) {
    const db = getClientFirestore();
    await deleteDoc(doc(db, "resources", id));
  },
};
