import type {
  FarmerEvidenceAttachment,
  FarmerEvidenceType,
  LogbookEntry,
} from "@/lib/types";

type FarmerEvidencePayload = {
  attachment: FarmerEvidenceAttachment;
};

function isFarmerEvidenceType(value: unknown): value is FarmerEvidenceType {
  return value === "document" || value === "field_photo" || value === "audio";
}

function isFarmerEvidenceAttachment(value: unknown): value is FarmerEvidenceAttachment {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    typeof record.farmerId === "string" &&
    isFarmerEvidenceType(record.type) &&
    typeof record.title === "string" &&
    typeof record.fileName === "string" &&
    typeof record.mimeType === "string" &&
    typeof record.url === "string" &&
    typeof record.uploadedAt === "string" &&
    typeof record.uploadedBy === "string"
  );
}

function isFarmerEvidencePayload(value: unknown): value is FarmerEvidencePayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return isFarmerEvidenceAttachment(record.attachment);
}

export function getFarmerEvidenceAttachment(entry: LogbookEntry) {
  return isFarmerEvidencePayload(entry.data) ? entry.data.attachment : null;
}

export function getFarmerEvidenceTypeLabel(type: FarmerEvidenceType) {
  switch (type) {
    case "document":
      return "Dokumento";
    case "field_photo":
      return "Larawan sa Bukid";
    case "audio":
      return "Audio";
    default:
      return "Evidence";
  }
}

export function describeFarmerEvidenceAttachment(attachment: FarmerEvidenceAttachment) {
  const base = `${getFarmerEvidenceTypeLabel(attachment.type)}: ${attachment.fileName}`;
  return attachment.notes?.trim() ? `${base} - ${attachment.notes.trim()}` : base;
}

export function buildFarmerEvidenceLogbookData(attachment: FarmerEvidenceAttachment) {
  return {
    attachment,
  } satisfies FarmerEvidencePayload;
}
