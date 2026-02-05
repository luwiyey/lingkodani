'use server';

/**
 * @fileOverview A farming advice generation AI agent.
 *
 * - generateFarmingAdvice - A function that handles the generation of farming advice based on an SMS report.
 * - GenerateFarmingAdviceInput - The input type for the generateFarmingAdvice function.
 * - GenerateFarmingAdviceOutput - The return type for the generateFarmingAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFarmingAdviceInputSchema = z.object({
  smsReport: z
    .string()
    .describe('The SMS report from the farmer.'),
  knowledgeBaseArticle: z.string().optional().describe('Relevant article in the knowledge base that can be used.'),
});
export type GenerateFarmingAdviceInput = z.infer<
  typeof GenerateFarmingAdviceInputSchema
>;

const GenerateFarmingAdviceOutputSchema = z.object({
  advice: z
    .string()
    .describe('The AI-generated farming advice based on the SMS report.'),
  confidenceScore: z.number().describe('Confidence score of the generated advice.'),
});
export type GenerateFarmingAdviceOutput = z.infer<
  typeof GenerateFarmingAdviceOutputSchema
>;

export async function generateFarmingAdvice(
  input: GenerateFarmingAdviceInput
): Promise<GenerateFarmingAdviceOutput> {
  return generateFarmingAdviceFlow(input);
}

const generateFarmingAdvicePrompt = ai.definePrompt({
  name: 'generateFarmingAdvicePrompt',
  input: {schema: GenerateFarmingAdviceInputSchema},
  output: {schema: GenerateFarmingAdviceOutputSchema},
  prompt: `You are an AI farming advisor. Based on the following SMS report from a farmer, generate farming advice.

SMS Report: {{{smsReport}}}

Consider this knowledge base article when formulating your advice: {{{knowledgeBaseArticle}}}

Provide a confidence score between 0 and 1 for the advice. 1 indicates the highest confidence and 0 the lowest.

Format your response as a JSON object with "advice" and "confidenceScore" fields.
`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  }
});

const generateFarmingAdviceFlow = ai.defineFlow(
  {
    name: 'generateFarmingAdviceFlow',
    inputSchema: GenerateFarmingAdviceInputSchema,
    outputSchema: GenerateFarmingAdviceOutputSchema,
  },
  async input => {
    const {output} = await generateFarmingAdvicePrompt(input);
    return output!;
  }
);
