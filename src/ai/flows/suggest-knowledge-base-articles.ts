'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests relevant knowledge base articles based on trending SMS reports and farmer inquiries.
 *
 * - suggestKnowledgeBaseArticles - A function that suggests relevant knowledge base articles.
 * - SuggestKnowledgeBaseArticlesInput - The input type for the suggestKnowledgeBaseArticles function.
 * - SuggestKnowledgeBaseArticlesOutput - The return type for the suggestKnowledgeBaseArticles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestKnowledgeBaseArticlesInputSchema = z.object({
  smsReports: z
    .array(z.string())
    .describe('An array of SMS reports from farmers.'),
  farmerInquiries: z
    .array(z.string())
    .describe('An array of farmer inquiries.'),
});
export type SuggestKnowledgeBaseArticlesInput = z.infer<
  typeof SuggestKnowledgeBaseArticlesInputSchema
>;

const SuggestedArticleSchema = z.object({
  title: z.string().describe('The title of the suggested knowledge base article.'),
  summary: z
    .string()
    .describe('A brief summary of the suggested knowledge base article.'),
  keywords: z
    .array(z.string())
    .describe('Keywords related to the suggested knowledge base article.'),
});

const SuggestKnowledgeBaseArticlesOutputSchema = z.object({
  suggestedArticles: z
    .array(SuggestedArticleSchema)
    .describe('An array of suggested knowledge base articles.'),
});

export type SuggestKnowledgeBaseArticlesOutput = z.infer<
  typeof SuggestKnowledgeBaseArticlesOutputSchema
>;

export async function suggestKnowledgeBaseArticles(
  input: SuggestKnowledgeBaseArticlesInput
): Promise<SuggestKnowledgeBaseArticlesOutput> {
  return suggestKnowledgeBaseArticlesFlow(input);
}

const suggestKnowledgeBaseArticlesPrompt = ai.definePrompt({
  name: 'suggestKnowledgeBaseArticlesPrompt',
  input: {schema: SuggestKnowledgeBaseArticlesInputSchema},
  output: {schema: SuggestKnowledgeBaseArticlesOutputSchema},
  prompt: `You are an AI assistant helping barangay administrators maintain a knowledge base of farming information.
  Based on the recent SMS reports and farmer inquiries, suggest relevant knowledge base articles that would be helpful to the farmers.

  SMS Reports:
  {{#each smsReports}}
  - {{{this}}}
  {{/each}}

  Farmer Inquiries:
  {{#each farmerInquiries}}
  - {{{this}}}
  {{/each}}

  Suggest knowledge base articles with a title, a brief summary, and a list of keywords.
  Ensure that the suggested articles address the issues and questions raised in the SMS reports and farmer inquiries.
  The output should conform to the schema exactly, paying close attention to field descriptions.
  `,
});

const suggestKnowledgeBaseArticlesFlow = ai.defineFlow(
  {
    name: 'suggestKnowledgeBaseArticlesFlow',
    inputSchema: SuggestKnowledgeBaseArticlesInputSchema,
    outputSchema: SuggestKnowledgeBaseArticlesOutputSchema,
  },
  async input => {
    const {output} = await suggestKnowledgeBaseArticlesPrompt(input);
    return output!;
  }
);
