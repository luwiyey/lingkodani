'use server';

import { z } from 'genkit';

import { ai } from '@/ai/genkit';

const TranscribeAudioFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe("An audio file as a data URI with MIME type and Base64 encoding."),
  fileName: z.string().describe("The uploaded audio file name."),
  mimeType: z.string().describe("The MIME type of the uploaded audio file."),
  context: z
    .enum(["farmer_field_note", "knowledge_audio"])
    .describe("The product context where this audio will be used."),
});

const TranscribeAudioFileOutputSchema = z.object({
  transcript: z.string().describe("A cleaned transcript of the audio in Filipino when possible."),
  summary: z.string().describe("A short summary that barangay staff can scan quickly."),
  suggestedTitle: z.string().describe("A short suggested title for this audio content."),
  keywords: z.array(z.string()).describe("Useful keywords extracted from the recording."),
  detectedLanguage: z.string().describe("The dominant detected language or language mix."),
});

export type TranscribeAudioFileInput = z.infer<typeof TranscribeAudioFileInputSchema>;
export type TranscribeAudioFileOutput = z.infer<typeof TranscribeAudioFileOutputSchema>;

export async function transcribeAudioFile(
  input: TranscribeAudioFileInput
): Promise<TranscribeAudioFileOutput> {
  return transcribeAudioFileFlow(input);
}

const transcribeAudioFilePrompt = ai.definePrompt({
  name: 'transcribeAudioFilePrompt',
  input: { schema: TranscribeAudioFileInputSchema },
  output: { schema: TranscribeAudioFileOutputSchema },
  prompt: `You are helping Lingkod-Ani understand uploaded agricultural audio.

The audio may be:
- a field note from an Agricultural Extension Worker,
- a recorded explanation from barangay staff,
- a voice note about a farmer concern,
- or an audio advisory meant for the local knowledge base.

Your job:
1. Listen carefully to the recording.
2. Produce a cleaned transcript.
3. Summarize the recording in a short, useful way for barangay staff.
4. Suggest a short title.
5. Extract useful search keywords.

Rules:
- Prefer Filipino in the transcript and summary when the speaker is using Filipino.
- If the speaker uses mixed Filipino and English, preserve the meaning naturally.
- Remove filler sounds and obvious repetition when it does not change meaning.
- If some parts are unclear, keep the transcript conservative instead of inventing words.
- Focus on agricultural context, symptoms, actions, locations, crops, pests, weather concerns, and follow-up needs.
- The output must follow the schema exactly.

Context: {{{context}}}
Filename: {{{fileName}}}
MIME type: {{{mimeType}}}
Audio: {{media url=fileDataUri}}`,
});

const transcribeAudioFileFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFileFlow',
    inputSchema: TranscribeAudioFileInputSchema,
    outputSchema: TranscribeAudioFileOutputSchema,
  },
  async (input) => {
    const { output } = await transcribeAudioFilePrompt(input);

    return output ?? {
      transcript: "",
      summary: "",
      suggestedTitle: input.fileName.replace(/\.[^/.]+$/, ""),
      keywords: [],
      detectedLanguage: "unknown",
    };
  }
);
