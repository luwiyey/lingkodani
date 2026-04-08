import { NextResponse } from "next/server";

import { transcribeAudioFile } from "@/ai/flows/transcribe-audio-file";
import { isLiveMode } from "@/lib/config/app-mode";
import {
  applyRateLimitHeaders,
  checkRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/server/request-security";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import { hasServerDemoPreviewAccess, readServerSessionProfile } from "@/lib/server/session-auth";
import {
  guessAudioMimeType,
  isSupportedAudioType,
  MAX_AUDIO_IMPORT_SIZE_BYTES,
  toAudioDataUri,
} from "@/lib/server/audio-import";

export async function POST(request: Request) {
  const rateLimit = checkRequestRateLimit(request, {
    key: "audio-transcribe-post",
    maxRequests: 12,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit,
      "Masyadong maraming audio transcription requests mula sa network na ito. Maghintay muna bago muling mag-upload."
    );
  }

  if (isLiveMode) {
    const session = await readServerSessionProfile();
    const hasDemoAccess = await hasServerDemoPreviewAccess();

    if (!session && !hasDemoAccess) {
      const auth = await authenticateServerRequest(request);
      if (!auth.ok) {
        return applyRateLimitHeaders(
          NextResponse.json({ error: auth.error }, { status: auth.status }),
          rateLimit
        );
      }
    }
  }

  const aiConfigured =
    typeof process.env.GOOGLE_GENAI_API_KEY === "string" ||
    typeof process.env.GEMINI_API_KEY === "string";

  if (!aiConfigured) {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Hindi available ang audio transcription sa build na ito." },
        { status: 503 }
      ),
      rateLimit
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const context = formData.get("context");

    if (!(file instanceof File)) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Walang valid na audio file na natanggap." },
          { status: 400 }
        ),
        rateLimit
      );
    }

    if (!isSupportedAudioType(file)) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Audio file lang ang puwedeng i-transcribe." },
          { status: 400 }
        ),
        rateLimit
      );
    }

    if (file.size > MAX_AUDIO_IMPORT_SIZE_BYTES) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Masyadong malaki ang audio file. Limitahan muna sa 20 MB o mas mababa." },
          { status: 413 }
        ),
        rateLimit
      );
    }

    const mimeType = guessAudioMimeType(file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await transcribeAudioFile({
      fileDataUri: toAudioDataUri(buffer, mimeType),
      fileName: file.name,
      mimeType,
      context: context === "knowledge_audio" ? "knowledge_audio" : "farmer_field_note",
    });

    if (!result.transcript.trim()) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Hindi sapat ang audio para makabuo ng transcript." },
          { status: 422 }
        ),
        rateLimit
      );
    }

    return applyRateLimitHeaders(NextResponse.json(result), rateLimit);
  } catch (error) {
    console.error("Audio transcription failed", error);
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Hindi ma-transcribe ang audio file sa ngayon." },
        { status: 500 }
      ),
      rateLimit
    );
  }
}
