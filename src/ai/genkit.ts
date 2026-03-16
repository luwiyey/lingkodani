import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const googleGenAiApiKey = process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY;

if (googleGenAiApiKey && !process.env.GOOGLE_GENAI_API_KEY) {
  process.env.GOOGLE_GENAI_API_KEY = googleGenAiApiKey;
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
