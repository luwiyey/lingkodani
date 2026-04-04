'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

import { answerKnowledgeQuery } from '@/ai/flows/answer-knowledge-query';
import { answerKnowledgeQueryWithGeminiGrounding } from '@/lib/services/gemini-grounded-knowledge-service';
import type { KnowledgeArticle } from '@/lib/types';

const ArticleForSearchSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  keywords: z.array(z.string()),
  type: z.enum(['article', 'audio']),
});

const SearchKnowledgeBaseInputSchema = z.object({
  query: z.string().describe("The user's search query."),
  articles: z
    .array(ArticleForSearchSchema)
    .describe('A list of available knowledge base articles and audio stories.'),
});
export type SearchKnowledgeBaseInput = z.infer<
  typeof SearchKnowledgeBaseInputSchema
>;

const SearchKnowledgeBaseOutputSchema = z.object({
  directAnswer: z
    .string()
    .describe(
      "A direct, helpful, and concise answer to the user's query, written in Filipino (Tagalog). Synthesize information from the internal knowledge base and external web search results."
    ),
  relevantArticleIds: z
    .array(z.string())
    .describe(
      'An array of IDs of the most relevant articles from the provided list. Return an empty array if none are relevant.'
    ),
});
export type SearchKnowledgeBaseOutput = z.infer<
  typeof SearchKnowledgeBaseOutputSchema
>;

export async function searchKnowledgeBase(
  input: SearchKnowledgeBaseInput
): Promise<SearchKnowledgeBaseOutput> {
  return searchKnowledgeBaseFlow(input);
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function buildFallbackSearchResult(input: SearchKnowledgeBaseInput): SearchKnowledgeBaseOutput {
  const queryTokens = tokenize(input.query);

  const scoredArticles = input.articles
    .map((article) => {
      const haystack = tokenize([
        article.title,
        article.summary,
        article.keywords.join(' '),
        article.type,
      ].join(' '));

      const matchCount = queryTokens.reduce((score, token) => {
        return score + (haystack.includes(token) ? 1 : 0);
      }, 0);

      return {
        article,
        score: matchCount,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const relevantArticleIds = scoredArticles.slice(0, 4).map((entry) => entry.article.id);
  const topArticle = scoredArticles[0]?.article;

  if (!topArticle) {
    return {
      directAnswer: `Wala pang eksaktong tugma sa lokal na knowledge base para sa "${input.query}". Subukang gumamit ng mas tiyak na keyword tulad ng pananim, peste, sintomas, o uri ng tulong na kailangan.`,
      relevantArticleIds: [],
    };
  }

  return {
    directAnswer: `Batay sa lokal na knowledge base, pinakamalapit na sanggunian ang "${topArticle.title}". ${topArticle.summary} Maaari mong buksan ang kaugnay na artikulo sa ibaba para sa mas detalyadong gabay.`,
    relevantArticleIds,
  };
}

function toKnowledgeArticles(input: SearchKnowledgeBaseInput): KnowledgeArticle[] {
  const timestamp = new Date().toISOString();

  return input.articles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    content: article.summary,
    keywords: article.keywords,
    lastUpdated: timestamp,
    author: 'Lingkod-Ani Knowledge',
    type: article.type,
  }));
}

function prioritizeArticles(input: SearchKnowledgeBaseInput) {
  const mappedArticles = toKnowledgeArticles(input);
  const fallback = buildFallbackSearchResult(input);
  const ordered = fallback.relevantArticleIds
    .map((articleId) => mappedArticles.find((article) => article.id === articleId))
    .filter((article): article is KnowledgeArticle => Boolean(article));

  return ordered.length > 0 ? ordered : mappedArticles.slice(0, 6);
}

const searchKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'searchKnowledgeBaseFlow',
    inputSchema: SearchKnowledgeBaseInputSchema,
    outputSchema: SearchKnowledgeBaseOutputSchema,
  },
  async (input) => {
    const fallback = buildFallbackSearchResult(input);
    const prioritizedArticles = prioritizeArticles(input);

    if (prioritizedArticles.length === 0) {
      return fallback;
    }

    if (process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY) {
      try {
        const grounded = await answerKnowledgeQueryWithGeminiGrounding({
          query: input.query,
          articles: prioritizedArticles,
        });

        return {
          directAnswer: grounded.directAnswer,
          relevantArticleIds: prioritizedArticles.map((article) => article.id),
        };
      } catch (error) {
        console.error('searchKnowledgeBaseFlow grounding fallback triggered', error);
      }
    }

    try {
      return await answerKnowledgeQuery({
        query: input.query,
        articles: prioritizedArticles,
      });
    } catch (error) {
      console.error('searchKnowledgeBaseFlow local AI fallback triggered', error);
      return fallback;
    }
  }
);
