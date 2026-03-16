import type { KnowledgeArticle } from "@/lib/types";
import type { KnowledgeRepository } from "@/lib/repositories/knowledge/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoKnowledgeStore?: KnowledgeArticle[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoKnowledgeStore) {
    demoStore.__lingkodAniDemoKnowledgeStore = [];
  }

  return demoStore.__lingkodAniDemoKnowledgeStore;
}

export const demoKnowledgeRepository: KnowledgeRepository = {
  async listKnowledgeArticles() {
    return [...getStore()];
  },

  async createKnowledgeArticle(article) {
    getStore().unshift(article);
    return article;
  },

  async updateKnowledgeArticles(articles) {
    demoStore.__lingkodAniDemoKnowledgeStore = [...articles];
    return articles;
  },
};
