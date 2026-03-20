'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractKnowledgeFromTextInputSchema = z.object({
  sourceLabel: z.string().describe('The uploaded source name.'),
  transcript: z.string().describe('The cleaned transcript or extracted text content.'),
  summaryHint: z.string().optional().describe('A short summary from upstream transcription when available.'),
  keywordHints: z.array(z.string()).optional().describe('Optional keyword hints from upstream transcription.'),
});

const ExtractedKnowledgeArticleFromTextSchema = z.object({
  title: z.string().describe('A short, readable article title in Filipino.'),
  summary: z.string().describe('A one- or two-sentence summary in Filipino.'),
  content: z.string().describe('The main cleaned article content in Filipino.'),
  keywords: z.array(z.string()).describe('Important keywords for search and categorization.'),
  type: z.enum(['article', 'tip', 'myth-buster']).describe('The best fitting knowledge article type.'),
});

const ExtractKnowledgeFromTextOutputSchema = z.object({
  articles: z
    .array(ExtractedKnowledgeArticleFromTextSchema)
    .describe('Structured knowledge articles derived from the transcript text.'),
});

export type ExtractKnowledgeFromTextInput = z.infer<typeof ExtractKnowledgeFromTextInputSchema>;
export type ExtractKnowledgeFromTextOutput = z.infer<typeof ExtractKnowledgeFromTextOutputSchema>;

export async function extractKnowledgeFromText(
  input: ExtractKnowledgeFromTextInput
): Promise<ExtractKnowledgeFromTextOutput> {
  return extractKnowledgeFromTextFlow(input);
}

const extractKnowledgeFromTextPrompt = ai.definePrompt({
  name: 'extractKnowledgeFromTextPrompt',
  input: { schema: ExtractKnowledgeFromTextInputSchema },
  output: { schema: ExtractKnowledgeFromTextOutputSchema },
  prompt: `You are helping Lingkod-Ani turn spoken or transcribed agricultural guidance into knowledge-base entries for barangay staff.

Your job:
1. Read the transcript carefully.
2. Extract only useful agricultural guidance, advisories, warnings, or practical steps.
3. Convert the content into 1 to 3 structured knowledge articles in Filipino.
4. If the transcript is too noisy, too short, or not useful as agricultural guidance, return an empty array.

Rules:
- Write all titles, summaries, and content in Filipino.
- Keep the answer grounded only in the transcript.
- Do not invent technical details that are not present.
- Use "tip" for short actionable advice, "article" for fuller guidance, and "myth-buster" only when the transcript is correcting misinformation.
- Use the summary hint and keyword hints only as support, not as new facts.

Source label: {{{sourceLabel}}}
Summary hint: {{{summaryHint}}}
Keyword hints: {{#each keywordHints}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Transcript:
{{{transcript}}}`,
});

const extractKnowledgeFromTextFlow = ai.defineFlow(
  {
    name: 'extractKnowledgeFromTextFlow',
    inputSchema: ExtractKnowledgeFromTextInputSchema,
    outputSchema: ExtractKnowledgeFromTextOutputSchema,
  },
  async (input) => {
    const { output } = await extractKnowledgeFromTextPrompt(input);
    return output ?? { articles: [] };
  }
);
