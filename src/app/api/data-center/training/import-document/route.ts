import { NextResponse } from "next/server";

import { extractSmsTrainingFromDocument } from "@/ai/flows/extract-sms-training-from-document";
import { canManageBarangaySettings } from "@/lib/access-control";
import { isLiveMode } from "@/lib/config/app-mode";
import { buildImportedSmsTrainingExamples } from "@/lib/imported-training-examples";
import {
  guessDocumentMimeType,
  isSupportedPdfOrImageType,
  MAX_DOCUMENT_SIZE_BYTES,
  toDocumentDataUri,
} from "@/lib/server/document-import";
import { authenticateServerRequest } from "@/lib/server/request-auth";

export async function POST(request: Request) {
  if (isLiveMode) {
    const auth = await authenticateServerRequest(request);

    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (!canManageBarangaySettings(auth.profile)) {
      return NextResponse.json(
        { error: "Kailangan ng barangay manager o developer access para mag-import ng teaching files." },
        { status: 403 }
      );
    }
  }

  const aiConfigured =
    typeof process.env.GOOGLE_GENAI_API_KEY === "string" ||
    typeof process.env.GEMINI_API_KEY === "string";

  if (!aiConfigured) {
    return NextResponse.json(
      { error: "Hindi available ang AI training-data extraction sa build na ito." },
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
        { error: "PDF o image file lang ang puwedeng i-convert sa SMS training examples." },
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
    const result = await extractSmsTrainingFromDocument({
      fileDataUri: toDocumentDataUri(buffer, mimeType),
      fileName: file.name,
      mimeType,
    });

    const examples = buildImportedSmsTrainingExamples(result.examples, file.name);

    if (examples.length === 0) {
      return NextResponse.json(
        { error: "Hindi sapat ang nabasang laman ng file para makabuo ng SMS training examples." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      examples,
      importedFrom: file.name,
    });
  } catch (error) {
    console.error("Training document import failed", error);
    return NextResponse.json(
      { error: "Hindi mabasa ang PDF/image file bilang SMS training examples." },
      { status: 500 }
    );
  }
}
