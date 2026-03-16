import type { AuditLog } from "@/lib/types";

export interface AuditRepository {
  listAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(input: AuditLog): Promise<AuditLog>;
}
