'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleSearchTool } from '../tools/google-search';

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
    const {output} = await prompt(input);
    return output!;
  }
);
