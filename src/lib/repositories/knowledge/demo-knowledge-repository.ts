import type { KnowledgeArticle } from "@/lib/types";
import type { KnowledgeRepository } from "@/lib/repositories/knowledge/types";
import { knowledgeArticles as initialKnowledgeArticles } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<KnowledgeArticle>({
  storageKey: "knowledgeArticles",
  initialData: initialKnowledgeArticles,
});

export const demoKnowledgeRepository: KnowledgeRepository = {
  async listKnowledgeArticles() {
    return store.list();
  },

  async createKnowledgeArticle(article) {
    return store.prepend(article);
  },

  async updateKnowledgeArticles(articles) {
    return store.replaceAll(articles);
  },
};
