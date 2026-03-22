import type { KnowledgeArticle } from "@/lib/types";

type GeminiGroundingWebChunk = {
  web?: {
    uri?: string;
    title?: string;
  };
};

type GeminiGroundingMetadata = {
  webSearchQueries?: string[];
  groundingChunks?: GeminiGroundingWebChunk[];
};

type GeminiContentPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiContentPart[];
  };
  groundingMetadata?: GeminiGroundingMetadata;
  grounding_metadata?: GeminiGroundingMetadata;
};

type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[];
};

export type GroundedKnowledgeWebSource = {
  title: string;
  url: string;
};

export type GroundedKnowledgeAnswer = {
  directAnswer: string;
  usedWebGrounding: boolean;
  webSearchQueries: string[];
  webSources: GroundedKnowledgeWebSource[];
};

function getGeminiApiKey() {
  return process.env.GOOGLE_GENAI_API_KEY ?? process.env.GEMINI_API_KEY ?? "";
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildLocalKnowledgeContext(articles: KnowledgeArticle[]) {
  if (articles.length === 0) {
    return "Walang local knowledge articles na available sa kasalukuyan.";
  }

  return articles
    .slice(0, 6)
    .map((article, index) => {
      const contentPreview = compactText(article.content ?? "").slice(0, 900);
      return [
        `${index + 1}. ${article.title}`,
        `Summary: ${article.summary}`,
        `Keywords: ${article.keywords.join(", ") || "wala"}`,
        `Source label: ${article.sourceLabel ?? "local knowledge base"}`,
        `Content preview: ${contentPreview || "walang content preview"}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function extractGroundedKnowledgeMetadata(
  payload: GeminiGenerateContentResponse
): Pick<GroundedKnowledgeAnswer, "usedWebGrounding" | "webSearchQueries" | "webSources"> {
  const candidate = payload.candidates?.[0];
  const metadata =
    candidate?.groundingMetadata ??
    candidate?.grounding_metadata;

  const webSearchQueries = (metadata?.webSearchQueries ?? [])
    .map((value) => compactText(value))
    .filter(Boolean);

  const webSources = (metadata?.groundingChunks ?? [])
    .map((chunk) => {
      const title = compactText(chunk.web?.title ?? "");
      const url = compactText(chunk.web?.uri ?? "");

      if (!title || !url) {
        return null;
      }

      return { title, url };
    })
    .filter((source): source is GroundedKnowledgeWebSource => Boolean(source))
    .filter((source, index, all) => all.findIndex((entry) => entry.url === source.url) === index)
    .slice(0, 6);

  return {
    usedWebGrounding: webSearchQueries.length > 0 || webSources.length > 0,
    webSearchQueries,
    webSources,
  };
}

function extractDirectAnswer(payload: GeminiGenerateContentResponse) {
  const rawText = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n");

  return compactText(rawText ?? "");
}

export async function answerKnowledgeQueryWithGeminiGrounding(input: {
  query: string;
  articles: KnowledgeArticle[];
}): Promise<GroundedKnowledgeAnswer> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Hindi configured ang Gemini API key para sa web grounding.");
  }

  const prompt = [
    "Ikaw ay knowledge assistant ng Lingkod-Ani para sa barangay agriculture team sa Pilipinas.",
    "Sagutin ang tanong sa malinaw, praktikal, at respetadong Filipino.",
    "Unahin ang local knowledge articles sa ibaba.",
    "Kung kulang ang local knowledge o kailangan ng mas updated na web support, gumamit ng Google Search grounding.",
    "Huwag mag-imbento. Kung hindi sapat ang local + grounded sources, sabihin ito nang tapat.",
    "",
    `Tanong: ${input.query}`,
    "",
    "Local knowledge context:",
    buildLocalKnowledgeContext(input.articles),
    "",
    "Ibigay lamang ang mismong sagot. Huwag maglabas ng JSON o markdown code fences.",
  ].join("\n");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        tools: [
          {
            google_search: {},
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 700,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini grounding request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as GeminiGenerateContentResponse;
  const directAnswer = extractDirectAnswer(payload);

  if (!directAnswer) {
    throw new Error("Walang nabuong grounded answer mula sa Gemini.");
  }

  return {
    directAnswer,
    ...extractGroundedKnowledgeMetadata(payload),
  };
}
