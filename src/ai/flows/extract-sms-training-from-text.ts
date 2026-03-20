'use server';

import { z } from 'genkit';

import { ai } from '@/ai/genkit';

const ExtractSmsTrainingFromTextInputSchema = z.object({
  sourceLabel: z.string().describe('The uploaded source name.'),
  transcript: z.string().describe('The transcript or extracted text content.'),
  summaryHint: z.string().optional().describe('A short upstream summary when available.'),
  keywordHints: z.array(z.string()).optional().describe('Optional keyword hints from the transcription layer.'),
});

const ExtractedSmsTrainingFromTextExampleSchema = z.object({
  farmerName: z.string().describe('The farmer name if mentioned, otherwise an empty string.'),
  phone: z.string().describe('The farmer phone number if mentioned, otherwise an empty string.'),
  message: z.string().describe('The farmer message content.'),
  analysisSource: z.enum(['rules', 'ai', 'ai_fallback']).describe('The best fitting analysis source.'),
  originalIntent: z.enum(['REGISTER', 'CROP_UPDATE', 'HARVEST', 'REQUEST', 'PEST_DISEASE', 'WEATHER_HELP', 'PRICE_CHECK', 'EMERGENCY', 'UNKNOWN']),
  originalUrgency: z.enum(['low', 'medium', 'high']),
  originalSafetyFlag: z.enum(['Low', 'Medium', 'High']),
  originalTone: z.enum(['Neutral', 'Nag-aalala', 'Kritikal', 'Positibo']).optional(),
  originalAdvice: z.string().describe('The original AI or staff advisory associated with the message.'),
  originalConfidence: z.number().describe('A confidence score between 0 and 1.'),
  reviewAction: z.enum(['approved_as_is', 'approved_edited', 'manual_reply', 'rejected']),
  finalStatus: z.enum(['pending_approval', 'approved', 'replied', 'rejected']),
  finalIntent: z.enum(['REGISTER', 'CROP_UPDATE', 'HARVEST', 'REQUEST', 'PEST_DISEASE', 'WEATHER_HELP', 'PRICE_CHECK', 'EMERGENCY', 'UNKNOWN']),
  finalUrgency: z.enum(['low', 'medium', 'high']),
  finalSafetyFlag: z.enum(['Low', 'Medium', 'High']),
  finalTone: z.enum(['Neutral', 'Nag-aalala', 'Kritikal', 'Positibo']).optional(),
  finalAdvice: z.string().describe('The final reviewed or approved advice.'),
  reviewedBy: z.string().describe('The reviewer name if visible, otherwise an empty string.'),
  reviewedAt: z.string().describe('The review timestamp if visible, otherwise an empty string.'),
});

const ExtractSmsTrainingFromTextOutputSchema = z.object({
  examples: z
    .array(ExtractedSmsTrainingFromTextExampleSchema)
    .describe('Structured SMS training examples derived from transcript text.'),
});

export type ExtractSmsTrainingFromTextInput = z.infer<typeof ExtractSmsTrainingFromTextInputSchema>;
export type ExtractSmsTrainingFromTextOutput = z.infer<typeof ExtractSmsTrainingFromTextOutputSchema>;

export async function extractSmsTrainingFromText(
  input: ExtractSmsTrainingFromTextInput
): Promise<ExtractSmsTrainingFromTextOutput> {
  return extractSmsTrainingFromTextFlow(input);
}

const extractSmsTrainingFromTextPrompt = ai.definePrompt({
  name: 'extractSmsTrainingFromTextPrompt',
  input: { schema: ExtractSmsTrainingFromTextInputSchema },
  output: { schema: ExtractSmsTrainingFromTextOutputSchema },
  prompt: `You are helping Lingkod-Ani convert spoken review notes, narrated SMS examples, or transcribed QA discussions into structured SMS training examples.

Your job:
1. Read the transcript carefully.
2. Extract clearly supported farmer SMS examples and their reviewed handling.
3. Return one example per clearly identifiable case.
4. If the transcript is not really about SMS review or case-handling examples, return an empty array.

Rules:
- Preserve the original farmer message as closely as possible.
- If a detail is not available, return an empty string for text fields.
- Do not invent phone numbers or names when they are not stated.
- Keep confidence between 0 and 1.
- Prefer conservative extraction over invented structure.
- The output must follow the schema exactly.

Source label: {{{sourceLabel}}}
Summary hint: {{{summaryHint}}}
Keyword hints: {{#each keywordHints}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Transcript:
{{{transcript}}}`,
});

const extractSmsTrainingFromTextFlow = ai.defineFlow(
  {
    name: 'extractSmsTrainingFromTextFlow',
    inputSchema: ExtractSmsTrainingFromTextInputSchema,
    outputSchema: ExtractSmsTrainingFromTextOutputSchema,
  },
  async (input) => {
    const { output } = await extractSmsTrainingFromTextPrompt(input);
    return output ?? { examples: [] };
  }
);
