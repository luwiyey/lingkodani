'use server';

/**
 * @fileOverview An AI agent for diagnosing plant problems from an image.
 *
 * - diagnosePlant - A function that handles the plant diagnosis process.
 * - DiagnosePlantInput - The input type for the diagnosePlant function.
 * - DiagnosePlantOutput - The return type for the diagnosePlant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnosePlantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('A description of the plant and its symptoms.'),
});
export type DiagnosePlantInput = z.infer<typeof DiagnosePlantInputSchema>;

const DiagnosePlantOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Whether or not the input image is a plant.'),
    commonName: z.string().describe('The common name of the identified plant (e.g., "Tomato", "Corn").'),
    latinName: z.string().describe('The Latin name of the identified plant (e.g., "Solanum lycopersicum").'),
  }),
  diagnosis: z.object({
    isHealthy: z.boolean().describe('Whether or not the plant appears to be healthy.'),
    problem: z.string().describe("The specific problem, pest, or disease identified. If healthy, state 'None'."),
    description: z.string().describe("A concise, one-sentence description of the diagnosis."),
  }),
  remediation: z.object({
      steps: z.array(z.string()).describe("A list of clear, actionable steps the farmer can take to address the problem."),
      chemicalWarning: z.string().optional().describe("If chemical treatment is suggested, provide a clear safety warning about proper use and consulting an AEW. Start with 'BABALA:'."),
  }),
});
export type DiagnosePlantOutput = z.infer<typeof DiagnosePlantOutputSchema>;

export async function diagnosePlant(input: DiagnosePlantInput): Promise<DiagnosePlantOutput> {
  return diagnosePlantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnosePlantPrompt',
  input: {schema: DiagnosePlantInputSchema},
  output: {schema: DiagnosePlantOutputSchema},
  prompt: `You are an expert botanist and agricultural extension worker in the Philippines. Your task is to analyze an image of a plant and a description of its symptoms to provide a diagnosis and actionable advice.

The response must be in Filipino (Tagalog).

1.  **Identify the plant**: Look at the photo and determine if it's a plant. Identify its common and latin name.
2.  **Diagnose the problem**: Based on the image and the user's description, determine if the plant is healthy. If not, identify the specific pest, disease, or nutrient deficiency.
3.  **Provide Remediation Steps**: Give a clear, step-by-step list of actions the farmer can take. Prioritize organic or simple interventions first.
4.  **Add a Safety Warning**: If you recommend any chemical pesticides or treatments, you MUST include a \`chemicalWarning\` field. This warning must be in Tagalog, start with "BABALA:", and advise the user to be careful and consult a local expert.

Analyze the following information:
Description: {{{description}}}
Photo: {{media url=photoDataUri}}`,
});

const diagnosePlantFlow = ai.defineFlow(
  {
    name: 'diagnosePlantFlow',
    inputSchema: DiagnosePlantInputSchema,
    outputSchema: DiagnosePlantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
