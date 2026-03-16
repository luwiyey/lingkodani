'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { googleSearchTool } from '../tools/google-search';

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

const prompt = ai.definePrompt({
  name: 'searchKnowledgeBasePrompt',
  input: {schema: SearchKnowledgeBaseInputSchema},
  output: {schema: SearchKnowledgeBaseOutputSchema},
  tools: [googleSearchTool],
  prompt: `You are an expert agricultural assistant for Filipino farmers. Your response must be in Filipino (Tagalog).

Your task is to answer the user's query by combining information from two sources:
1.  The internal knowledge base articles provided.
2.  Up-to-date information from the internet, which you can get by using the 'googleSearchTool'.

**User Query:**
"{{{query}}}"

**Available Internal Articles & Audio Stories:**
{{#if articles}}
  {{#each articles}}
  - ID: {{this.id}}
    Type: {{this.type}}
    Title: {{this.title}}
    Summary: {{this.summary}}
    Keywords: {{#each this.keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/each}}
{{else}}
  No internal articles available.
{{/if}}

**Process:**
1.  **Analyze the Query:** Understand what the user is asking.
2.  **Decide to Search:** If the internal articles are insufficient or the topic requires very current information (like market prices or new pest alerts), use the 'googleSearchTool' with a relevant search query.
3.  **Synthesize and Answer:** Create a comprehensive but concise 'directAnswer' in Tagalog. Combine the most useful information from both the internal articles and the web search results. Prioritize information from the internal articles if it's relevant.
4.  **Cite Sources:** Identify the 'relevantArticleIds' from the internal knowledge base that you used or are relevant.
`,
});

const searchKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'searchKnowledgeBaseFlow',
    inputSchema: SearchKnowledgeBaseInputSchema,
    outputSchema: SearchKnowledgeBaseOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);

      if (output) {
        return output;
      }
    } catch (error) {
      console.error('searchKnowledgeBaseFlow fallback triggered', error);
    }

    return buildFallbackSearchResult(input);
  }
);
