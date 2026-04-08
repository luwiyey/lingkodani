import { NextResponse } from "next/server";

import { answerKnowledgeQuery } from "@/ai/flows/answer-knowledge-query";
import { isLiveMode } from "@/lib/config/app-mode";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { normalizeKnowledgeQueryArticles } from "@/lib/knowledge-query";
import { searchArticlesLocally } from "@/lib/knowledge-search";
import { answerKnowledgeQueryWithGeminiGrounding } from "@/lib/services/gemini-grounded-knowledge-service";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import {
  applyRateLimitHeaders,
  checkRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/server/request-security";
import { hasServerDemoPreviewAccess } from "@/lib/server/session-auth";
import type { KnowledgeArticle } from "@/lib/types";

async function listServerKnowledgeArticles() {
  const snapshot = await getServerFirestore()
    .collection(firebaseCollections.knowledgeArticles)
    .orderBy("lastUpdated", "desc")
    .get();

  return normalizeKnowledgeQueryArticles(
    snapshot.docs.map((documentSnapshot) => {
      const article = documentSnapshot.data() as KnowledgeArticle;

      return {
        ...article,
        id: article.id ?? documentSnapshot.id,
      };
    })
  );
}

export async function POST(request: Request) {
  const rateLimit = checkRequestRateLimit(request, {
    key: "knowledge-search-post",
    maxRequests: 30,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit,
      "Masyadong maraming knowledge searches mula sa network na ito. Maghintay muna bago muling magtanong."
    );
  }

  if (isLiveMode) {
    const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);
    const hasDemoAccess = await hasServerDemoPreviewAccess();

    if (!auth.ok && !hasDemoAccess) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: "Unauthorized knowledge search request." }, { status: 401 }),
        rateLimit
      );
    }
  }

  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const includeWebGrounding = body.includeWebGrounding === true;
    const articles = isLiveMode
      ? await listServerKnowledgeArticles()
      : normalizeKnowledgeQueryArticles(body.articles);

    if (!query) {
      return applyRateLimitHeaders(
        NextResponse.json({ error: "Kailangan ang search query." }, { status: 400 }),
        rateLimit
      );
    }

    if (articles.length === 0) {
      return applyRateLimitHeaders(
        NextResponse.json({
          directAnswer: `Wala pang articles sa local knowledge base para sa "${query}". Mag-import muna ng lokal na gabay o gumawa ng bagong knowledge entry.`,
          relevantArticleIds: [],
        }),
        rateLimit
      );
    }

    const aiConfigured =
      typeof process.env.GOOGLE_GENAI_API_KEY === "string" ||
      typeof process.env.GEMINI_API_KEY === "string";

    if (!aiConfigured) {
      const fallback = searchArticlesLocally(query, articles);
      return applyRateLimitHeaders(
        NextResponse.json({
          directAnswer: fallback.directAnswer,
          relevantArticleIds: fallback.articles.map((article) => article.id),
          relevantArticles: fallback.articles,
          answerMode: "local_only",
          usedWebGrounding: false,
          webSources: [],
          webSearchQueries: [],
        }),
        rateLimit
      );
    }

    const localResult = searchArticlesLocally(query, articles);
    const prioritizedArticles = localResult.articles.length > 0
      ? localResult.articles
      : articles.slice(0, 6);

    if (includeWebGrounding) {
      try {
        const groundedResult = await answerKnowledgeQueryWithGeminiGrounding({
          query,
          articles: prioritizedArticles,
        });

        return applyRateLimitHeaders(
          NextResponse.json({
            directAnswer: groundedResult.directAnswer,
            relevantArticleIds: prioritizedArticles.map((article) => article.id),
            relevantArticles: prioritizedArticles,
            answerMode: groundedResult.usedWebGrounding ? "local_web" : "local_ai",
            usedWebGrounding: groundedResult.usedWebGrounding,
            webSources: groundedResult.webSources,
            webSearchQueries: groundedResult.webSearchQueries,
          }),
          rateLimit
        );
      } catch (groundingError) {
        console.error("Gemini web grounding fallback triggered", groundingError);
      }
    }

    const result = await answerKnowledgeQuery({ query, articles: prioritizedArticles });
    const relevantArticles = result.relevantArticleIds
      .map((articleId) => prioritizedArticles.find((article) => article.id === articleId))
      .filter((article): article is KnowledgeArticle => Boolean(article));

    return applyRateLimitHeaders(
      NextResponse.json({
        ...result,
        relevantArticles,
        answerMode: "local_ai",
        usedWebGrounding: false,
        webSources: [],
        webSearchQueries: [],
      }),
      rateLimit
    );
  } catch (error) {
    console.error("Knowledge search request failed", error);
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Hindi maiproseso ang knowledge search sa ngayon." },
        { status: 500 }
      ),
      rateLimit
    );
  }
}
