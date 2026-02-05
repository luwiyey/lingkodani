'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const CalculateProfitInputSchema = z.object({
  yield: z.number().describe('The expected yield in kilograms.'),
  price: z.number().describe('The market price per kilogram.'),
});
export type CalculateProfitInput = z.infer<typeof CalculateProfitInputSchema>;

export const CalculateProfitOutputSchema = z.object({
  analysis: z.string().describe('A simple, one-sentence profit analysis.'),
});
export type CalculateProfitOutput = z.infer<typeof CalculateProfitOutputSchema>;

export async function calculateProfit(input: CalculateProfitInput): Promise<CalculateProfitOutput> {
  return calculateProfitFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateProfitPrompt',
  input: {schema: CalculateProfitInputSchema},
  output: {schema: CalculateProfitOutputSchema},
  prompt: `You are an agricultural calculator for Filipino farmers. Your response must be in Filipino (Tagalog).
Calculate the profit analysis for the following:

-   Expected Yield: {{{yield}}} kg
-   Market Price: ₱{{{price}}} per kg

Provide a simple, one-sentence analysis that includes the estimated profit. For example: "Tinatayang Kita: ₱[calculated profit]. Break-even sa [calculated break-even] kg."
Assume production cost is 30% of the gross revenue.
`,
});

const calculateProfitFlow = ai.defineFlow(
  {
    name: 'calculateProfitFlow',
    inputSchema: CalculateProfitInputSchema,
    outputSchema: CalculateProfitOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
