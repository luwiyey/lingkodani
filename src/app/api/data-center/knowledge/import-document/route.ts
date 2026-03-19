import { NextResponse } from "next/server";

import { extractKnowledgeFromDocument } from "@/ai/flows/extract-knowledge-from-document";
import { isLiveMode } from "@/lib/config/app-mode";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import {
  guessDocumentMimeType,
  isSupportedPdfOrImageType,
  MAX_DOCUMENT_SIZE_BYTES,
  toDocumentDataUri,
} from "@/lib/server/document-import";
import type { KnowledgeArticle } from "@/lib/types";

export async function POST(request: Request) {
  if (isLiveMode) {
    const auth = await authenticateServerRequest(request, ["developer"]);

    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
  }

  const aiConfigured =
    typeof process.env.GOOGLE_GENAI_API_KEY === "string" ||
    typeof process.env.GEMINI_API_KEY === "string";

  if (!aiConfigured) {
    return NextResponse.json(
      { error: "Hindi available ang AI document extraction sa build na ito." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Walang valid na file na natanggap." },
        { status: 400 }
      );
    }

    if (!isSupportedPdfOrImageType(file)) {
      return NextResponse.json(
        { error: "PDF o image file lang ang puwedeng i-convert sa knowledge articles." },
        { status: 400 }
      );
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Masyadong malaki ang file. Limitahan muna sa humigit-kumulang 8 MB bawat import." },
        { status: 413 }
      );
    }

    const mimeType = guessDocumentMimeType(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractKnowledgeFromDocument({
      fileDataUri: toDocumentDataUri(buffer, mimeType),
      fileName: file.name,
      mimeType,
    });

    const timestamp = new Date().toISOString();
    const articles: KnowledgeArticle[] = result.articles.map((article, index) => ({
      id: `KB-DOC-${Date.now()}-${index}`,
      title: article.title.trim(),
      summary: article.summary.trim(),
      content: article.content.trim(),
      keywords: article.keywords.map((keyword) => keyword.trim()).filter(Boolean),
      type: article.type,
      author: `Imported from ${file.name}`,
      lastUpdated: timestamp,
    }));

    if (articles.length === 0) {
      return NextResponse.json(
        { error: "Hindi sapat ang nabasang laman ng file para makabuo ng knowledge article." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      articles,
      importedFrom: file.name,
    });
  } catch (error) {
    console.error("Document knowledge import failed", error);
    return NextResponse.json(
      { error: "Hindi mabasa ang PDF/image file bilang knowledge article." },
      { status: 500 }
    );
  }
}
