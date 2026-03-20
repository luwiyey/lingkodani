'use server';

import { z } from "zod";

import { ai } from "@/ai/genkit";
import { searchArticlesLocally } from "@/lib/knowledge-search";
import type { KnowledgeArticle } from "@/lib/types";

const ArticleForKnowledgeAnswerSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  content: z.string(),
  keywords: z.array(z.string()),
  author: z.string(),
  type: z.enum(["article", "audio", "tip", "myth-buster"]),
});

const AnswerKnowledgeQueryInputSchema = z.object({
  query: z.string().describe("The user's question."),
  articles: z
    .array(ArticleForKnowledgeAnswerSchema)
    .describe("The locally stored knowledge base articles available to answer the question."),
});

const AnswerKnowledgeQueryOutputSchema = z.object({
  directAnswer: z
    .string()
    .describe("A grounded and concise answer in Filipino using only the provided knowledge articles."),
  relevantArticleIds: z
    .array(z.string())
    .describe("IDs of the most relevant local articles used in the answer."),
});

export type AnswerKnowledgeQueryInput = z.infer<typeof AnswerKnowledgeQueryInputSchema>;
export type AnswerKnowledgeQueryOutput = z.infer<typeof AnswerKnowledgeQueryOutputSchema>;

export async function answerKnowledgeQuery(input: AnswerKnowledgeQueryInput): Promise<AnswerKnowledgeQueryOutput> {
  return answerKnowledgeQueryFlow(input);
}

function buildFallbackKnowledgeAnswer(input: AnswerKnowledgeQueryInput): AnswerKnowledgeQueryOutput {
  const fallback = searchArticlesLocally(input.query, input.articles as KnowledgeArticle[]);

  return {
    directAnswer: fallback.directAnswer,
    relevantArticleIds: fallback.articles.map((article) => article.id),
  };
}

const answerKnowledgeQueryPrompt = ai.definePrompt({
  name: "answerKnowledgeQueryPrompt",
  input: { schema: AnswerKnowledgeQueryInputSchema },
  output: { schema: AnswerKnowledgeQueryOutputSchema },
  prompt: `You are helping barangay agricultural staff answer questions using the Lingkod-Ani local knowledge base.

Rules:
- Use ONLY the provided local knowledge articles. Do not invent outside facts.
- Write the answer in clear Filipino.
- Keep the answer practical, specific, and easy to follow for barangay staff and farmers.
- If the articles are not enough, say that the local knowledge base is still incomplete and suggest the kind of article or field validation that is still needed.
- Prefer safe, cautious language when the query involves pests, disease, chemicals, flooding, or emergencies.

User question:
"{{{query}}}"

Local knowledge articles:
{{#each articles}}
- ID: {{this.id}}
  Title: {{this.title}}
  Type: {{this.type}}
  Summary: {{this.summary}}
  Keywords: {{#each this.keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Content: {{this.content}}
{{/each}}

Return:
- one grounded directAnswer in Filipino
- relevantArticleIds that genuinely support the answer`,
});

const answerKnowledgeQueryFlow = ai.defineFlow(
  {
    name: "answerKnowledgeQueryFlow",
    inputSchema: AnswerKnowledgeQueryInputSchema,
    outputSchema: AnswerKnowledgeQueryOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await answerKnowledgeQueryPrompt(input);

      if (output) {
        return output;
      }
    } catch (error) {
      console.error("answerKnowledgeQueryFlow fallback triggered", error);
    }

    return buildFallbackKnowledgeAnswer(input);
  }
);
