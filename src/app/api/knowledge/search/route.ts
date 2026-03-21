import { NextResponse } from "next/server";

import { answerKnowledgeQuery } from "@/ai/flows/answer-knowledge-query";
import { isLiveMode } from "@/lib/config/app-mode";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { normalizeKnowledgeQueryArticles } from "@/lib/knowledge-query";
import { searchArticlesLocally } from "@/lib/knowledge-search";
import { hasServerDemoPreviewAccess, readServerSessionProfile } from "@/lib/server/session-auth";
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
    const articles = isLiveMode
      ? await listServerKnowledgeArticles()
      : normalizeKnowledgeQueryArticles(body.articles);

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
        relevantArticles: fallback.articles,
      });
    }

    const result = await answerKnowledgeQuery({ query, articles });
    const relevantArticles = result.relevantArticleIds
      .map((articleId) => articles.find((article) => article.id === articleId))
      .filter((article): article is KnowledgeArticle => Boolean(article));

    return NextResponse.json({
      ...result,
      relevantArticles,
    });
  } catch (error) {
    console.error("Knowledge search request failed", error);
    return NextResponse.json(
      { error: "Hindi maiproseso ang knowledge search sa ngayon." },
      { status: 500 }
    );
  }
}
