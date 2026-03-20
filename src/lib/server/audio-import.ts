export const MAX_AUDIO_IMPORT_SIZE_BYTES = 20 * 1024 * 1024;

export function isSupportedAudioType(file: File) {
  return file.type.startsWith("audio/");
}

export function guessAudioMimeType(file: File) {
  if (file.type) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".mp3")) return "audio/mpeg";
  if (lowerName.endsWith(".wav")) return "audio/wav";
  if (lowerName.endsWith(".m4a")) return "audio/mp4";
  if (lowerName.endsWith(".aac")) return "audio/aac";
  if (lowerName.endsWith(".ogg")) return "audio/ogg";
  if (lowerName.endsWith(".webm")) return "audio/webm";

  return "audio/mpeg";
}

export function toAudioDataUri(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
