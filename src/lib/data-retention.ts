import type { AuditLog, Farmer, SystemSettings } from "@/lib/types";

type RetentionPolicy = SystemSettings["retentionPolicy"];

export type DataRetentionSweepResult = {
  auditLogs: AuditLog[];
  farmers: Farmer[];
  redactedAuditLogIds: string[];
  redactedFarmerIds: string[];
};

function getMs(value?: string) {
  if (!value) {
    return Number.NaN;
  }

  return new Date(value).getTime();
}

function olderThanDays(timestamp: string, days: number, nowIso: string) {
  const ts = getMs(timestamp);
  const now = getMs(nowIso);

  if (Number.isNaN(ts) || Number.isNaN(now)) {
    return false;
  }

  return now - ts >= days * 24 * 60 * 60 * 1000;
}

function buildAuditLogRedactionReason(days: number) {
  return `PII redacted automatically after ${days} days under the barangay retention policy.`;
}

function buildArchivedFarmerRedactionReason(days: number) {
  return `Archived farmer PII redacted automatically after ${days} days under the barangay retention policy.`;
}

export function shouldRedactAuditLog(log: AuditLog, policy: RetentionPolicy, nowIso: string) {
  return (
    policy.autoRedactionEnabled &&
    !log.retentionRedactedAt &&
    olderThanDays(log.timestamp, policy.auditLogRedactionDays, nowIso)
  );
}

export function redactAuditLog(log: AuditLog, policy: RetentionPolicy, nowIso: string): AuditLog {
  return {
    ...log,
    user: "Redacted staff",
    details: "PII redacted after the configured retention window.",
    retentionRedactedAt: nowIso,
    retentionRedactionReason: buildAuditLogRedactionReason(policy.auditLogRedactionDays),
  };
}

export function shouldRedactArchivedFarmer(farmer: Farmer, policy: RetentionPolicy, nowIso: string) {
  return (
    policy.autoRedactionEnabled &&
    farmer.status === "archived" &&
    Boolean(farmer.archivedAt) &&
    !farmer.retentionRedactedAt &&
    olderThanDays(farmer.archivedAt as string, policy.archivedFarmerRedactionDays, nowIso)
  );
}

export function redactArchivedFarmer(farmer: Farmer, policy: RetentionPolicy, nowIso: string): Farmer {
  return {
    ...farmer,
    name: `Archived Farmer ${farmer.id}`,
    phone: `ARCHIVED-${farmer.id}`,
    age: 0,
    gender: "Hindi na naka-retain",
    sitio: "Archived area",
    farmSize: 0,
    avatarUrl: undefined,
    phoneHistory: ["redacted"],
    retentionRedactedAt: nowIso,
    retentionRedactionReason: buildArchivedFarmerRedactionReason(policy.archivedFarmerRedactionDays),
  };
}

export function applyDataRetentionSweep(input: {
  auditLogs: AuditLog[];
  farmers: Farmer[];
  policy: RetentionPolicy;
  now?: string;
}): DataRetentionSweepResult {
  const nowIso = input.now ?? new Date().toISOString();
  const redactedAuditLogIds: string[] = [];
  const redactedFarmerIds: string[] = [];

  const auditLogs = input.auditLogs.map((log) => {
    if (!shouldRedactAuditLog(log, input.policy, nowIso)) {
      return log;
    }

    redactedAuditLogIds.push(log.id);
    return redactAuditLog(log, input.policy, nowIso);
  });

  const farmers = input.farmers.map((farmer) => {
    if (!shouldRedactArchivedFarmer(farmer, input.policy, nowIso)) {
      return farmer;
    }

    redactedFarmerIds.push(farmer.id);
    return redactArchivedFarmer(farmer, input.policy, nowIso);
  });

  return {
    auditLogs,
    farmers,
    redactedAuditLogIds,
    redactedFarmerIds,
  };
}
