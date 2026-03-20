export type AudioTranscriptionContext = "farmer_field_note" | "knowledge_audio";

export type AudioTranscriptionResult = {
  transcript: string;
  summary: string;
  suggestedTitle: string;
  keywords: string[];
  detectedLanguage: string;
};

export async function transcribeAudioUpload(file: File, context: AudioTranscriptionContext) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("context", context);

  const response = await fetch("/api/audio/transcribe", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(String(payload.error ?? "Hindi ma-transcribe ang audio file."));
  }

  return payload as AudioTranscriptionResult;
}
