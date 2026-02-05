import { config } from 'dotenv';
config();

import '@/ai/flows/generate-farming-advice.ts';
import '@/ai/flows/suggest-knowledge-base-articles.ts';
import '@/ai/flows/summarize-weekly-insights.ts';