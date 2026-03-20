import type { KnowledgeArticle, KnowledgeArticleType } from '@/lib/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asKeywords(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function asKnowledgeType(value: unknown): KnowledgeArticleType {
  return value === 'audio' || value === 'tip' || value === 'myth-buster' || value === 'article'
    ? value
    : 'article';
}

export function normalizeKnowledgeQueryArticles(input: unknown): KnowledgeArticle[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized = input
    .filter(isRecord)
    .map((value) => {
      const id = asString(value.id);
      const title = asString(value.title);
      const summary = asString(value.summary);
      const content = asString(value.content);
      const keywords = asKeywords(value.keywords);

      if (!id || !title || !summary || !content || keywords.length === 0) {
        return null;
      }

      const audioUrl = asString(value.audioUrl) || undefined;
      const article: KnowledgeArticle = {
        id,
        title,
        summary,
        content,
        keywords,
        author: asString(value.author) || 'Imported Knowledge',
        type: asKnowledgeType(value.type),
        lastUpdated: asString(value.lastUpdated) || new Date().toISOString(),
        ...(audioUrl ? { audioUrl } : {}),
      };

      return article;
    })
    .filter((article) => article !== null);

  return normalized;
}
