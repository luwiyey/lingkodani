'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateFertilizerInputSchema = z.object({
  area: z.number().describe('The area of the farm in hectares.'),
  crop: z.string().describe('The type of crop being planted.'),
});
export type CalculateFertilizerInput = z.infer<typeof CalculateFertilizerInputSchema>;

const CalculateFertilizerOutputSchema = z.object({
  recommendation: z.string().describe('The fertilizer recommendation in clear, simple terms.'),
});
export type CalculateFertilizerOutput = z.infer<typeof CalculateFertilizerOutputSchema>;

export async function calculateFertilizer(input: CalculateFertilizerInput): Promise<CalculateFertilizerOutput> {
  return calculateFertilizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateFertilizerPrompt',
  input: {schema: CalculateFertilizerInputSchema},
  output: {schema: CalculateFertilizerOutputSchema},
  prompt: `You are an agricultural calculator for Filipino farmers. Your response must be in Filipino (Tagalog).
Calculate the fertilizer recommendation for the following:

-   Farm Area: {{{area}}} hectares
-   Crop: {{{crop}}}

Provide a simple, actionable recommendation. For example: "Rekomendasyon: 3 sako ng Urea, 2 sako ng Complete (14-14-14)." Keep it concise.
`,
});

const calculateFertilizerFlow = ai.defineFlow(
  {
    name: 'calculateFertilizerFlow',
    inputSchema: CalculateFertilizerInputSchema,
    outputSchema: CalculateFertilizerOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
