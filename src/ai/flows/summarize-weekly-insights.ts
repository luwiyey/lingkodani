'use server';

/**
 * @fileOverview Provides weekly summary insights based on SMS data and trends.
 *
 * - summarizeWeeklyInsights - A function that generates the weekly summary insights.
 * - SummarizeWeeklyInsightsInput - The input type for the summarizeWeeklyInsights function.
 * - SummarizeWeeklyInsightsOutput - The return type for the summarizeWeeklyInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeWeeklyInsightsInputSchema = z.object({
  smsData: z
    .string()
    .describe(
      'A string containing the SMS data for the week. Should be formatted so the AI can easily digest it.'
    ),
  trendData: z
    .string()
    .describe(
      'A string containing trend data derived from the SMS data for the week. Should be formatted so the AI can easily digest it.'
    ),
});
export type SummarizeWeeklyInsightsInput = z.infer<
  typeof SummarizeWeeklyInsightsInputSchema
>;

const SummarizeWeeklyInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the weekly insights.'),
});
export type SummarizeWeeklyInsightsOutput = z.infer<
  typeof SummarizeWeeklyInsightsOutputSchema
>;

export async function summarizeWeeklyInsights(
  input: SummarizeWeeklyInsightsInput
): Promise<SummarizeWeeklyInsightsOutput> {
  return summarizeWeeklyInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeWeeklyInsightsPrompt',
  input: {schema: SummarizeWeeklyInsightsInputSchema},
  output: {schema: SummarizeWeeklyInsightsOutputSchema},
  prompt: `You are an AI assistant helping barangay admins understand key issues and make informed decisions about resource allocation and support efforts based on SMS data and trends.

  Summarize the following SMS data and trend data for the week:

  SMS Data: {{{smsData}}}

  Trend Data: {{{trendData}}}
  `,
});

const summarizeWeeklyInsightsFlow = ai.defineFlow(
  {
    name: 'summarizeWeeklyInsightsFlow',
    inputSchema: SummarizeWeeklyInsightsInputSchema,
    outputSchema: SummarizeWeeklyInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
