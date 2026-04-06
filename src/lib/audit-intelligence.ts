import type { AuditLog } from "@/lib/types";

type AuditCategory = NonNullable<AuditLog["category"]> | "uncategorized";
type AuditSeverity = NonNullable<AuditLog["severity"]> | "info";

export type AuditSuspiciousActivity = {
  id: string;
  title: string;
  detail: string;
  severity: "warning" | "critical";
  relatedLogIds: string[];
};

export type AuditSummary = {
  totalLogs: number;
  securityLogs: number;
  operationsLogs: number;
  criticalLogs: number;
  warningLogs: number;
  sensitiveLogs: number;
  reasonRequiredCount: number;
  reasonMissingCount: number;
  beforeAfterCount: number;
  suspiciousActivities: AuditSuspiciousActivity[];
};

function normalizeCategory(log: AuditLog): AuditCategory {
  return log.category ?? "uncategorized";
}

function normalizeSeverity(log: AuditLog): AuditSeverity {
  return log.severity ?? "info";
}

function asTimestamp(value?: string) {
  if (!value) {
    return Number.NaN;
  }

  return new Date(value).getTime();
}

export function getAuditChangedFields(log: AuditLog) {
  if (!log.beforeSnapshot || !log.afterSnapshot) {
    return [] as string[];
  }

  const keys = new Set([
    ...Object.keys(log.beforeSnapshot),
    ...Object.keys(log.afterSnapshot),
  ]);

  return Array.from(keys).filter((key) => {
    const before = JSON.stringify(log.beforeSnapshot?.[key] ?? null);
    const after = JSON.stringify(log.afterSnapshot?.[key] ?? null);
    return before !== after;
  });
}

export function buildAuditSummary(logs: AuditLog[]): AuditSummary {
  const suspiciousActivities: AuditSuspiciousActivity[] = [];
  const reasonMissing = logs.filter(
    (log) => log.reasonRequired && !log.reasonProvided?.trim()
  );

  if (reasonMissing.length > 0) {
    suspiciousActivities.push({
      id: "missing-reasons",
      title: "May sensitive actions na walang dahilan",
      detail: `${reasonMissing.length} audit log ang may required reason pero walang nakasulat na paliwanag.`,
      severity: "warning",
      relatedLogIds: reasonMissing.map((log) => log.id),
    });
  }

  const systemSensitiveLogs = logs.filter(
    (log) => log.securitySensitive && log.user.toLowerCase() === "system"
  );

  if (systemSensitiveLogs.length > 0) {
    suspiciousActivities.push({
      id: "system-sensitive-actions",
      title: "May system-triggered sensitive actions",
      detail: `${systemSensitiveLogs.length} sensitive action ang naitala bilang automated/system event. Suriin kung inaasahan ang automation na iyon.`,
      severity: "warning",
      relatedLogIds: systemSensitiveLogs.map((log) => log.id),
    });
  }

  const criticalLogs = logs.filter((log) => normalizeSeverity(log) === "critical");
  const groupedByUser = new Map<string, AuditLog[]>();

  for (const log of criticalLogs) {
    const key = log.user.toLowerCase();
    const current = groupedByUser.get(key) ?? [];
    current.push(log);
    groupedByUser.set(key, current);
  }

  for (const [user, entries] of groupedByUser.entries()) {
    const sorted = [...entries].sort(
      (left, right) => asTimestamp(left.timestamp) - asTimestamp(right.timestamp)
    );

    for (let index = 0; index < sorted.length; index += 1) {
      const windowStart = asTimestamp(sorted[index].timestamp);
      const withinWindow = sorted.filter((entry) => {
        const timestamp = asTimestamp(entry.timestamp);
        return !Number.isNaN(timestamp) && timestamp >= windowStart && timestamp <= windowStart + 15 * 60 * 1000;
      });

      if (withinWindow.length >= 3) {
        suspiciousActivities.push({
          id: `critical-burst-${user}-${index}`,
          title: "May burst ng critical actions",
          detail: `${withinWindow.length} critical log ang ginawa ni ${user} sa loob ng 15 minuto.`,
          severity: "critical",
          relatedLogIds: withinWindow.map((entry) => entry.id),
        });
        break;
      }
    }
  }

  const securityLogs = logs.filter(
    (log) => normalizeCategory(log) === "security" || Boolean(log.securitySensitive)
  );
  const operationsLogs = logs.filter(
    (log) => !["security"].includes(normalizeCategory(log))
  );

  return {
    totalLogs: logs.length,
    securityLogs: securityLogs.length,
    operationsLogs: operationsLogs.length,
    criticalLogs: criticalLogs.length,
    warningLogs: logs.filter((log) => normalizeSeverity(log) === "warning").length,
    sensitiveLogs: logs.filter((log) => log.securitySensitive).length,
    reasonRequiredCount: logs.filter((log) => log.reasonRequired).length,
    reasonMissingCount: reasonMissing.length,
    beforeAfterCount: logs.filter((log) => Boolean(log.beforeSnapshot || log.afterSnapshot)).length,
    suspiciousActivities,
  };
}

