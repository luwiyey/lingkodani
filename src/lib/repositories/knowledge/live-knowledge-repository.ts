import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { getClientFirestore } from "@/lib/firebase/client";
import { sanitizeFirestoreDocument } from "@/lib/firebase/sanitize-firestore";
import { withFirestoreDocId } from "@/lib/firebase/with-firestore-doc-id";
import type { KnowledgeArticle } from "@/lib/types";
import type { KnowledgeRepository } from "@/lib/repositories/knowledge/types";

export const liveKnowledgeRepository: KnowledgeRepository = {
  async listKnowledgeArticles() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, "knowledgeArticles"), orderBy("lastUpdated", "desc"))
    );

    return snapshot.docs.map((item) => withFirestoreDocId<KnowledgeArticle>(item));
  },

  async createKnowledgeArticle(article) {
    const db = getClientFirestore();
    const payload = sanitizeFirestoreDocument(article);
    await setDoc(doc(db, "knowledgeArticles", article.id), payload);
    return payload;
  },

  async updateKnowledgeArticles(articles) {
    const db = getClientFirestore();
    const batch = writeBatch(db);

    for (const article of articles) {
      batch.set(doc(db, "knowledgeArticles", article.id), sanitizeFirestoreDocument(article));
    }

    await batch.commit();
    return articles;
  },
};
