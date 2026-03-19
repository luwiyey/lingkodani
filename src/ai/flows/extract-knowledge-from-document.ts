'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractKnowledgeFromDocumentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A PDF or image file as a data URI with MIME type and Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The original filename uploaded by the user.'),
  mimeType: z.string().describe('The MIME type of the uploaded file.'),
});

const ExtractedKnowledgeArticleSchema = z.object({
  title: z.string().describe('A short, readable article title in Filipino.'),
  summary: z.string().describe('A one- or two-sentence summary in Filipino.'),
  content: z.string().describe('The main cleaned article content in Filipino.'),
  keywords: z.array(z.string()).describe('Important keywords for search and categorization.'),
  type: z.enum(['article', 'tip', 'myth-buster']).describe('The best fitting knowledge article type.'),
});

const ExtractKnowledgeFromDocumentOutputSchema = z.object({
  articles: z
    .array(ExtractedKnowledgeArticleSchema)
    .describe('The structured knowledge articles extracted from the uploaded PDF or image.'),
});

export type ExtractKnowledgeFromDocumentInput = z.infer<typeof ExtractKnowledgeFromDocumentInputSchema>;
export type ExtractKnowledgeFromDocumentOutput = z.infer<typeof ExtractKnowledgeFromDocumentOutputSchema>;

export async function extractKnowledgeFromDocument(
  input: ExtractKnowledgeFromDocumentInput
): Promise<ExtractKnowledgeFromDocumentOutput> {
  return extractKnowledgeFromDocumentFlow(input);
}

const extractKnowledgeFromDocumentPrompt = ai.definePrompt({
  name: 'extractKnowledgeFromDocumentPrompt',
  input: { schema: ExtractKnowledgeFromDocumentInputSchema },
  output: { schema: ExtractKnowledgeFromDocumentOutputSchema },
  prompt: `You are helping Lingkod-Ani convert uploaded agricultural reference materials into a knowledge base that barangay staff can search and use.

The uploaded file may be:
- a PDF guide,
- a screenshot of a farming tip,
- a photo of a printed advisory,
- or an image containing text.

Your job:
1. Read and extract the important text from the document or image.
2. Clean up noisy OCR when needed.
3. Convert the content into 1 to 3 structured knowledge articles in Filipino.
4. Preserve practical agricultural instructions, warnings, and farmer-facing guidance.
5. If the file contains only one coherent topic, return one article.
6. If the file has multiple clearly separate topics, split them into separate articles.
7. If the material is unreadable or not useful as agricultural guidance, return an empty array.

Important rules:
- Write all titles, summaries, and content in Filipino.
- Keep titles clear and professional.
- Keep summaries short.
- Keep content readable for barangay staff and farmers.
- Use "tip" for short practical advice, "article" for fuller guidance, and "myth-buster" only when the material is clearly correcting a misconception.
- Do not mention OCR, screenshots, or extraction artifacts in the final text.
- The output must follow the schema exactly.

Filename: {{{fileName}}}
MIME type: {{{mimeType}}}
Document/Image: {{media url=fileDataUri}}`,
});

const extractKnowledgeFromDocumentFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFromDocumentFlow',
    inputSchema: ExtractKnowledgeFromDocumentInputSchema,
    outputSchema: ExtractKnowledgeFromDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await extractKnowledgeFromDocumentPrompt(input);
    return output ?? { articles: [] };
  }
);
