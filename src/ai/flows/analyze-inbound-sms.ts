'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeInboundSmsInputSchema = z.object({
  message: z.string().describe('The raw SMS message from the farmer.'),
  farmerName: z.string().optional().describe('Known farmer name, if available.'),
  knownFarmer: z.boolean().default(false).describe('Whether the phone number is already matched to a farmer record.'),
  teachingContext: z.string().optional().describe('Approved local cue rules that matched the message.'),
  reviewedExamplesContext: z.string().optional().describe('Similar reviewed SMS examples approved by the barangay team.'),
});
export type AnalyzeInboundSmsInput = z.infer<typeof AnalyzeInboundSmsInputSchema>;

const AnalyzeInboundSmsOutputSchema = z.object({
  parsedIntent: z.enum([
    'REGISTER',
    'CROP_UPDATE',
    'HARVEST',
    'REQUEST',
    'PEST_DISEASE',
    'WEATHER_HELP',
    'PRICE_CHECK',
    'EMERGENCY',
    'UNKNOWN',
  ]),
  urgency: z.enum(['low', 'medium', 'high']),
  safetyFlag: z.enum(['Low', 'Medium', 'High']),
  tone: z.enum(['Neutral', 'Nag-aalala', 'Kritikal', 'Positibo']),
  aiAdvice: z.string(),
  aiConfidence: z.number().min(0).max(1),
});
export type AnalyzeInboundSmsOutput = z.infer<typeof AnalyzeInboundSmsOutputSchema>;

export async function analyzeInboundSmsWithAi(
  input: AnalyzeInboundSmsInput
): Promise<AnalyzeInboundSmsOutput> {
  return analyzeInboundSmsFlow(input);
}

const analyzeInboundSmsPrompt = ai.definePrompt({
  name: 'analyzeInboundSmsPrompt',
  input: { schema: AnalyzeInboundSmsInputSchema },
  output: { schema: AnalyzeInboundSmsOutputSchema },
  prompt: `You are an SMS triage assistant for a barangay agricultural advisory system in the Philippines.

Read the farmer's message and classify it into one structured result.

Rules:
- Keep the advice safe and conservative.
- If the message suggests danger, flooding, typhoon, poisoning, severe pest outbreak, or immediate crop damage, treat it as EMERGENCY or high urgency as appropriate.
- Use Filipino-friendly advice. The advice should be short and suitable to send by SMS.
- If the message is unclear, choose UNKNOWN and give a short clarification-oriented response.
- Confidence must be between 0 and 1.
- If approved local cue rules are provided below and they clearly match the message, prioritize them over generic assumptions.
- If reviewed example messages are provided, use them as guidance for tone, classification, and practical barangay response style. Do not copy them blindly if they do not fit.

Allowed parsedIntent values:
- REGISTER
- CROP_UPDATE
- HARVEST
- REQUEST
- PEST_DISEASE
- WEATHER_HELP
- PRICE_CHECK
- EMERGENCY
- UNKNOWN

Allowed tone values:
- Neutral
- Nag-aalala
- Kritikal
- Positibo

Farmer known in system: {{{knownFarmer}}}
Farmer name: {{{farmerName}}}
SMS message: {{{message}}}
Approved local cue rules:
{{{teachingContext}}}

Similar reviewed examples:
{{{reviewedExamplesContext}}}
`,
});

const analyzeInboundSmsFlow = ai.defineFlow(
  {
    name: 'analyzeInboundSmsFlow',
    inputSchema: AnalyzeInboundSmsInputSchema,
    outputSchema: AnalyzeInboundSmsOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeInboundSmsPrompt(input);
    return output!;
  }
);
