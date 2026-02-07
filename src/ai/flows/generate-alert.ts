'use server';

/**
 * @fileOverview An AI agent for generating agricultural alerts.
 *
 * - generateAlert - A function that analyzes data to generate alerts for farmers.
 * - GenerateAlertInput - The input type for the generateAlert function.
 * - GenerateAlertOutput - The return type for the generateAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAlertInputSchema = z.object({
  smsSummary: z.string().describe('A summary of recent, relevant SMS reports from farmers.'),
  weatherData: z.string().describe('A summary of the current weather forecast.'),
});
export type GenerateAlertInput = z.infer<typeof GenerateAlertInputSchema>;

const AlertSchema = z.object({
    type: z.enum(["flood", "pest", "wind", "heat"]).describe("The type of alert."),
    severity: z.enum(["Warning", "Critical"]).describe("The severity level of the alert."),
    message: z.string().describe("The main alert message to be sent to farmers."),
    recommendation: z.string().describe("A recommended action for the farmers to take."),
});

const GenerateAlertOutputSchema = z.object({
    shouldGenerateAlert: z.boolean().describe("Indicates whether an alert is necessary based on the input."),
    alert: AlertSchema.optional().describe("The generated alert details, if one is necessary."),
});
export type GenerateAlertOutput = z.infer<typeof GenerateAlertOutputSchema>;


export async function generateAlert(input: GenerateAlertInput): Promise<GenerateAlertOutput> {
    return generateAlertFlow(input);
}

const generateAlertPrompt = ai.definePrompt({
    name: 'generateAlertPrompt',
    input: { schema: GenerateAlertInputSchema },
    output: { schema: GenerateAlertOutputSchema },
    prompt: `You are a disaster risk and agricultural officer for a barangay in the Philippines.
Your task is to analyze summaries of farmer SMS reports and weather data to decide if a new alert is required.

Based on the following information, determine if an alert should be generated.
- If multiple reports indicate a growing problem (e.g., multiple pest sightings in one area), an alert is likely needed.
- If weather data indicates an imminent threat (e.g., heavy rain, strong winds), an alert is critical.

If an alert is necessary, set 'shouldGenerateAlert' to true and create the alert content. The message and recommendation should be clear, concise, and in Filipino (Tagalog).
If no alert is needed, set 'shouldGenerateAlert' to false.

Input Data:
SMS Report Summary: {{{smsSummary}}}
Weather Forecast: {{{weatherData}}}
`,
});

const generateAlertFlow = ai.defineFlow(
    {
        name: 'generateAlertFlow',
        inputSchema: GenerateAlertInputSchema,
        outputSchema: GenerateAlertOutputSchema,
    },
    async (input) => {
        const { output } = await generateAlertPrompt(input);
        return output!;
    }
);
