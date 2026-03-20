import { NextResponse } from "next/server";

import { transcribeAudioFile } from "@/ai/flows/transcribe-audio-file";
import { isLiveMode } from "@/lib/config/app-mode";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import { hasServerDemoPreviewAccess, readServerSessionProfile } from "@/lib/server/session-auth";
import {
  guessAudioMimeType,
  isSupportedAudioType,
  MAX_AUDIO_IMPORT_SIZE_BYTES,
  toAudioDataUri,
} from "@/lib/server/audio-import";

export async function POST(request: Request) {
  if (isLiveMode) {
    const session = await readServerSessionProfile();
    const hasDemoAccess = await hasServerDemoPreviewAccess();

    if (!session && !hasDemoAccess) {
      const auth = await authenticateServerRequest(request);
      if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
    }
  }

  const aiConfigured =
    typeof process.env.GOOGLE_GENAI_API_KEY === "string" ||
    typeof process.env.GEMINI_API_KEY === "string";

  if (!aiConfigured) {
    return NextResponse.json(
      { error: "Hindi available ang audio transcription sa build na ito." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const context = formData.get("context");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Walang valid na audio file na natanggap." },
        { status: 400 }
      );
    }

    if (!isSupportedAudioType(file)) {
      return NextResponse.json(
        { error: "Audio file lang ang puwedeng i-transcribe." },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_IMPORT_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Masyadong malaki ang audio file. Limitahan muna sa 20 MB o mas mababa." },
        { status: 413 }
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
      return NextResponse.json(
        { error: "Hindi sapat ang audio para makabuo ng transcript." },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Audio transcription failed", error);
    return NextResponse.json(
      { error: "Hindi ma-transcribe ang audio file sa ngayon." },
      { status: 500 }
    );
  }
}
