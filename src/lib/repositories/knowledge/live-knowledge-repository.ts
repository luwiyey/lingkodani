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
import type { KnowledgeArticle } from "@/lib/types";
import type { KnowledgeRepository } from "@/lib/repositories/knowledge/types";

export const liveKnowledgeRepository: KnowledgeRepository = {
  async listKnowledgeArticles() {
    const db = getClientFirestore();
    const snapshot = await getDocs(
      query(collection(db, "knowledgeArticles"), orderBy("lastUpdated", "desc"))
    );

    return snapshot.docs.map((item) => item.data() as KnowledgeArticle);
  },

  async createKnowledgeArticle(article) {
    const db = getClientFirestore();
    await setDoc(doc(db, "knowledgeArticles", article.id), article);
    return article;
  },

  async updateKnowledgeArticles(articles) {
    const db = getClientFirestore();
    const batch = writeBatch(db);

    for (const article of articles) {
      batch.set(doc(db, "knowledgeArticles", article.id), article);
    }

    await batch.commit();
    return articles;
  },
};
