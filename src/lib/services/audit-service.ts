import type { AuditLog } from "@/lib/types";

export function createAuditEntry(input: {
  action: string;
  details: string;
  user?: string;
  timestamp?: string;
  id?: string;
}): AuditLog {
  const timestamp = input.timestamp ?? new Date().toISOString();

  return {
    id: input.id ?? `AUD${Date.now()}`,
    timestamp,
    user: input.user ?? "system",
    action: input.action,
    details: input.details,
  };
}
