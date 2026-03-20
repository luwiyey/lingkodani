import { NextResponse } from "next/server";

import { answerKnowledgeQuery } from "@/ai/flows/answer-knowledge-query";
import { isLiveMode } from "@/lib/config/app-mode";
import { searchArticlesLocally } from "@/lib/knowledge-search";
import { hasServerDemoPreviewAccess, readServerSessionProfile } from "@/lib/server/session-auth";
import type { KnowledgeArticle } from "@/lib/types";

function normalizeArticles(input: unknown): KnowledgeArticle[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.filter((value): value is KnowledgeArticle => {
    return Boolean(
      value &&
        typeof value === "object" &&
        typeof (value as KnowledgeArticle).id === "string" &&
        typeof (value as KnowledgeArticle).title === "string" &&
        typeof (value as KnowledgeArticle).summary === "string" &&
        typeof (value as KnowledgeArticle).content === "string" &&
        Array.isArray((value as KnowledgeArticle).keywords)
    );
  });
}

export async function POST(request: Request) {
  if (isLiveMode) {
    const session = await readServerSessionProfile();
    const hasDemoAccess = await hasServerDemoPreviewAccess();

    if (!session && !hasDemoAccess) {
      return NextResponse.json({ error: "Unauthorized knowledge search request." }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const articles = normalizeArticles(body.articles);

    if (!query) {
      return NextResponse.json({ error: "Kailangan ang search query." }, { status: 400 });
    }

    if (articles.length === 0) {
      return NextResponse.json({
        directAnswer: `Wala pang articles sa local knowledge base para sa "${query}". Mag-import muna ng lokal na gabay o gumawa ng bagong knowledge entry.`,
        relevantArticleIds: [],
      });
    }

    const aiConfigured =
      typeof process.env.GOOGLE_GENAI_API_KEY === "string" ||
      typeof process.env.GEMINI_API_KEY === "string";

    if (!aiConfigured) {
      const fallback = searchArticlesLocally(query, articles);
      return NextResponse.json({
        directAnswer: fallback.directAnswer,
        relevantArticleIds: fallback.articles.map((article) => article.id),
      });
    }

    const result = await answerKnowledgeQuery({ query, articles });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Knowledge search request failed", error);
    return NextResponse.json(
      { error: "Hindi maiproseso ang knowledge search sa ngayon." },
      { status: 500 }
    );
  }
}
