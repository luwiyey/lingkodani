export const MAX_DOCUMENT_SIZE_BYTES = 8 * 1024 * 1024;

export function isSupportedPdfOrImageType(file: File) {
  if (file.type === "application/pdf") {
    return true;
  }

  return file.type.startsWith("image/");
}

export function guessDocumentMimeType(file: File) {
  if (file.type) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".webp")) return "image/webp";

  return "application/octet-stream";
}

export function toDocumentDataUri(buffer: Buffer, mimeType: string) {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
