'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-farming-advice.ts';
import '@/ai/flows/suggest-knowledge-base-articles.ts';
import '@/ai/flows/summarize-weekly-insights.ts';
import '@/ai/flows/generate-alert.ts';
import '@/ai/flows/diagnose-plant-problem.ts';
import '@/ai/flows/calculate-fertilizer.ts';
import '@/ai/flows/calculate-pesticide.ts';
import '@/ai/flows/calculate-profit.ts';
