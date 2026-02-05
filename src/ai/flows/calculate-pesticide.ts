'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const CalculatePesticideInputSchema = z.object({
    pest: z.string().describe('The name of the pesticide.'),
    area: z.number().describe('The size of the area to be sprayed in hectares.'),
});
export type CalculatePesticideInput = z.infer<typeof CalculatePesticideInputSchema>;

export const CalculatePesticideOutputSchema = z.object({
  recommendation: z.string().describe('The pesticide dosage recommendation in a clear, simple sentence.'),
});
export type CalculatePesticideOutput = z.infer<typeof CalculatePesticideOutputSchema>;

export async function calculatePesticide(input: CalculatePesticideInput): Promise<CalculatePesticideOutput> {
  return calculatePesticideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculatePesticidePrompt',
  input: {schema: CalculatePesticideInputSchema},
  output: {schema: CalculatePesticideOutputSchema},
  prompt: `You are an agricultural calculator for Filipino farmers. Your response must be in Filipino (Tagalog).
Calculate the pesticide dosage recommendation for the following:

-   Pesticide: {{{pest}}}
-   Area: {{{area}}} hectares

Provide a simple, actionable recommendation for mixing. For example: "Rekomendasyon: 20ml ng {{{pest}}} bawat 16L na tubig." Keep it concise.
`,
});

const calculatePesticideFlow = ai.defineFlow(
  {
    name: 'calculatePesticideFlow',
    inputSchema: CalculatePesticideInputSchema,
    outputSchema: CalculatePesticideOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
