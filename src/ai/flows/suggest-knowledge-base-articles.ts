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

function buildFallbackSuggestions(input: SuggestKnowledgeBaseArticlesInput): SuggestKnowledgeBaseArticlesOutput {
  const combinedText = [...input.smsReports, ...input.farmerInquiries]
    .join(' ')
    .toLowerCase();

  const suggestions: SuggestKnowledgeBaseArticlesOutput['suggestedArticles'] = [];

  if (combinedText.includes('peste') || combinedText.includes('leafminer') || combinedText.includes('daga')) {
    suggestions.push({
      title: 'Pangunang Gabay sa Karaniwang Peste sa Barangay',
      summary: 'Mga unang hakbang sa pag-report, pag-dokumento, at pansamantalang pagsugpo sa karaniwang peste tulad ng leafminer, daga, at rice bugs.',
      keywords: ['peste', 'leafminer', 'daga', 'rice bugs'],
    });
  }

  if (combinedText.includes('bagyo') || combinedText.includes('baha') || combinedText.includes('emergency')) {
    suggestions.push({
      title: 'Gabay sa Pinsala ng Bagyo at Emergency Reporting',
      summary: 'Checklist para sa barangay at magsasaka kapag may bagyo, baha, o agarang pinsala sa pananim.',
      keywords: ['bagyo', 'baha', 'emergency', 'pinsala'],
    });
  }

  if (combinedText.includes('presyo') || combinedText.includes('ani') || combinedText.includes('harvest')) {
    suggestions.push({
      title: 'Pagbabantay sa Presyo at Post-Harvest Tips',
      summary: 'Mga batayang payo sa pag-check ng presyo, tamang oras ng bentahan, at pangunahing post-harvest handling.',
      keywords: ['presyo', 'ani', 'harvest', 'post-harvest'],
    });
  }

  if (suggestions.length === 0) {
    suggestions.push(
      {
        title: 'Mga Madalas Itanong ng Magsasaka sa Barangay',
        summary: 'Panimulang knowledge article para sa mga madalas na concern sa peste, panahon, inputs, at farmer assistance.',
        keywords: ['faq', 'barangay', 'magsasaka'],
      },
      {
        title: 'Paano Mag-report ng Concern sa Lingkod-Ani',
        summary: 'Maikling paliwanag kung paano magsumite ng malinaw na ulat sa SMS at anong detalye ang dapat ilagay.',
        keywords: ['sms', 'ulat', 'report', 'lingkod-ani'],
      },
    );
  }

  return {
    suggestedArticles: suggestions.slice(0, 4),
  };
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
    try {
      const {output} = await suggestKnowledgeBaseArticlesPrompt(input);

      if (output) {
        return output;
      }
    } catch (error) {
      console.error('suggestKnowledgeBaseArticlesFlow fallback triggered', error);
    }

    return buildFallbackSuggestions(input);
  }
);
