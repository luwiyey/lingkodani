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
import type { Resource } from "@/lib/types";
import type { ResourceRepository } from "@/lib/repositories/resources/types";

export const liveResourceRepository: ResourceRepository = {
  async listResources() {
    const db = getClientFirestore();
    const snapshot = await getDocs(query(collection(db, "resources"), orderBy("lastUpdated", "desc")));
    return snapshot.docs.map((item) => item.data() as Resource);
  },

  async createResource(resource) {
    const db = getClientFirestore();
    await setDoc(doc(db, "resources", resource.id), resource);
    return resource;
  },

  async updateResource(id, updates) {
    const db = getClientFirestore();
    await updateDoc(doc(db, "resources", id), updates);
    return { id, ...updates } as Resource;
  },

  async deleteResource(id) {
    const db = getClientFirestore();
    await deleteDoc(doc(db, "resources", id));
  },
};
