import type { KnowledgeArticle } from "@/lib/types";

export interface KnowledgeRepository {
  listKnowledgeArticles(): Promise<KnowledgeArticle[]>;
  createKnowledgeArticle(article: KnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticles(articles: KnowledgeArticle[]): Promise<KnowledgeArticle[]>;
}
