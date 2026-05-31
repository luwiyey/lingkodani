import { sanitizeFirestoreDocument } from "@/lib/firebase/sanitize-firestore";
import type { AuditLog } from "@/lib/types";

export function createAuditEntry(input: {
  action: string;
  details: string;
  user?: string;
  timestamp?: string;
  id?: string;
  category?: AuditLog["category"];
  severity?: AuditLog["severity"];
  reasonRequired?: boolean;
  reasonProvided?: string;
  beforeSnapshot?: AuditLog["beforeSnapshot"];
  afterSnapshot?: AuditLog["afterSnapshot"];
  securitySensitive?: boolean;
}): AuditLog {
  const timestamp = input.timestamp ?? new Date().toISOString();

  return sanitizeFirestoreDocument({
    id: input.id ?? `AUD${Date.now()}`,
    timestamp,
    user: input.user ?? "system",
    action: input.action,
    details: input.details,
    category: input.category,
    severity: input.severity,
    reasonRequired: input.reasonRequired,
    reasonProvided: input.reasonProvided,
    beforeSnapshot: input.beforeSnapshot,
    afterSnapshot: input.afterSnapshot,
    securitySensitive: input.securitySensitive,
  });
}
