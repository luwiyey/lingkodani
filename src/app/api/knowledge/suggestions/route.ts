import { NextResponse } from "next/server";

import { suggestKnowledgeBaseArticles } from "@/ai/flows/suggest-knowledge-base-articles";
import { isLiveMode } from "@/lib/config/app-mode";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { buildSuggestedArticlesLocally } from "@/lib/knowledge-search";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import { hasServerDemoPreviewAccess } from "@/lib/server/session-auth";

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function listRecentLiveSmsReports() {
  const snapshot = await getServerFirestore()
    .collection(firebaseCollections.smsMessages)
    .orderBy("timestamp", "desc")
    .limit(30)
    .get();

  return snapshot.docs
    .map((documentSnapshot) => documentSnapshot.data()?.message)
    .filter((message): message is string => typeof message === "string")
    .map((message) => message.trim())
    .filter(Boolean);
}

export async function POST(request: Request) {
  if (isLiveMode) {
    const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);
    const hasDemoAccess = await hasServerDemoPreviewAccess();

    if (!auth.ok && !hasDemoAccess) {
      return NextResponse.json({ error: "Unauthorized suggestion request." }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const smsReports = isLiveMode
      ? await listRecentLiveSmsReports()
      : normalizeStringArray(body.smsReports);
    const farmerInquiries = isLiveMode
      ? smsReports
      : normalizeStringArray(body.farmerInquiries);
    const combined = [...smsReports, ...farmerInquiries];

    if (combined.length === 0) {
      return NextResponse.json({ suggestedArticles: [] });
    }

    const aiConfigured =
      typeof process.env.GOOGLE_GENAI_API_KEY === "string" ||
      typeof process.env.GEMINI_API_KEY === "string";

    if (!aiConfigured) {
      return NextResponse.json({
        suggestedArticles: buildSuggestedArticlesLocally(combined),
      });
    }

    const result = await suggestKnowledgeBaseArticles({
      smsReports,
      farmerInquiries,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Knowledge suggestion request failed", error);
    return NextResponse.json(
      { error: "Hindi makabuo ng knowledge suggestions sa ngayon." },
      { status: 500 }
    );
  }
}
