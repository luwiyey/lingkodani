'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ArticleForSearchSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  keywords: z.array(z.string()),
  type: z.enum(['article', 'audio']),
});

export const SearchKnowledgeBaseInputSchema = z.object({
  query: z.string().describe("The user's search query."),
  articles: z
    .array(ArticleForSearchSchema)
    .describe('A list of available knowledge base articles and audio stories.'),
});
export type SearchKnowledgeBaseInput = z.infer<
  typeof SearchKnowledgeBaseInputSchema
>;

export const SearchKnowledgeBaseOutputSchema = z.object({
  directAnswer: z
    .string()
    .describe(
      "A direct, helpful, and concise answer to the user's query, written in Filipino (Tagalog)."
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

const prompt = ai.definePrompt({
  name: 'searchKnowledgeBasePrompt',
  input: {schema: SearchKnowledgeBaseInputSchema},
  output: {schema: SearchKnowledgeBaseOutputSchema},
  prompt: `You are an expert agricultural assistant for Filipino farmers. Your response must be in Filipino (Tagalog).

The user is searching for information. Your task is twofold:
1. Provide a direct, helpful, and concise answer to their query.
2. Identify the most relevant articles from the provided list that could help them further.

**User Query:**
"{{{query}}}"

**Available Articles & Audio Stories:**
{{#if articles}}
  {{#each articles}}
  - ID: {{this.id}}
    Type: {{this.type}}
    Title: {{this.title}}
    Summary: {{this.summary}}
    Keywords: {{#each this.keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/each}}
{{else}}
  No articles available.
{{/if}}

Based on the query and the available articles, generate a response.
- Your 'directAnswer' should be a standalone, helpful paragraph answering the user's query.
- Your 'relevantArticleIds' should be an array of the IDs of the articles/audio stories that are most closely related to the query. Return an empty array if none are relevant.
`,
});

const searchKnowledgeBaseFlow = ai.defineFlow(
  {
    name: 'searchKnowledgeBaseFlow',
    inputSchema: SearchKnowledgeBaseInputSchema,
    outputSchema: SearchKnowledgeBaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
