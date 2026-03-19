'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractSmsTrainingFromDocumentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A PDF or image file as a data URI with MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The original filename uploaded by the user.'),
  mimeType: z.string().describe('The MIME type of the uploaded file.'),
});

const ExtractedSmsTrainingExampleSchema = z.object({
  farmerName: z.string().describe('The farmer name if visible in the document, otherwise an empty string.'),
  phone: z.string().describe('The farmer phone number if visible in the document, otherwise an empty string.'),
  message: z.string().describe('The farmer SMS message content.'),
  analysisSource: z.enum(['rules', 'ai', 'ai_fallback']).describe('The original analysis source if visible, otherwise choose the best fit.'),
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

const ExtractSmsTrainingFromDocumentOutputSchema = z.object({
  examples: z
    .array(ExtractedSmsTrainingExampleSchema)
    .describe('The structured SMS training examples extracted from the uploaded PDF or image.'),
});

export type ExtractSmsTrainingFromDocumentInput = z.infer<typeof ExtractSmsTrainingFromDocumentInputSchema>;
export type ExtractedSmsTrainingExample = z.infer<typeof ExtractedSmsTrainingExampleSchema>;
export type ExtractSmsTrainingFromDocumentOutput = z.infer<typeof ExtractSmsTrainingFromDocumentOutputSchema>;

export async function extractSmsTrainingFromDocument(
  input: ExtractSmsTrainingFromDocumentInput
): Promise<ExtractSmsTrainingFromDocumentOutput> {
  return extractSmsTrainingFromDocumentFlow(input);
}

const extractSmsTrainingFromDocumentPrompt = ai.definePrompt({
  name: 'extractSmsTrainingFromDocumentPrompt',
  input: { schema: ExtractSmsTrainingFromDocumentInputSchema },
  output: { schema: ExtractSmsTrainingFromDocumentOutputSchema },
  prompt: `You are helping Lingkod-Ani convert uploaded SMS review materials into structured training examples.

The uploaded file may be:
- a PDF review sheet,
- a screenshot of reviewed SMS cases,
- a photo of printed SMS examples,
- or a table/list of farmer messages with labels.

Your job:
1. Read and extract reviewed SMS examples from the document or image.
2. Clean up OCR noise when needed.
3. Return one training example per clearly identifiable reviewed SMS case.
4. If the file is not about SMS review/training data, return an empty array.

Important rules:
- Preserve the original farmer message as closely as possible.
- If a field is not visible, return an empty string for text fields.
- Do not invent farmer names or phone numbers when not shown.
- Use the best matching enum values for intent, urgency, safety, and review action.
- Keep confidence between 0 and 1.
- Limit the output to clearly supported examples only.
- The output must follow the schema exactly.

Filename: {{{fileName}}}
MIME type: {{{mimeType}}}
Document/Image: {{media url=fileDataUri}}`,
});

const extractSmsTrainingFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractSmsTrainingFromDocumentFlow',
    inputSchema: ExtractSmsTrainingFromDocumentInputSchema,
    outputSchema: ExtractSmsTrainingFromDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await extractSmsTrainingFromDocumentPrompt(input);
    return output ?? { examples: [] };
  }
);
