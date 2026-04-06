import { buildAuditSummary, getAuditChangedFields } from "@/lib/audit-intelligence";
import type { AuditLog } from "@/lib/types";

const baseLog: AuditLog = {
  id: "AUD-1",
  timestamp: "2026-04-05T00:00:00.000Z",
  user: "Brgy. Admin",
  action: "UPDATE_SETTINGS",
  details: "In-update ang barangay settings.",
  category: "settings",
  severity: "info",
};

describe("audit intelligence", () => {
  it("flags missing reasons on reason-required actions", () => {
    const summary = buildAuditSummary([
      {
        ...baseLog,
        id: "AUD-2",
        action: "REVOKE_INVITE",
        category: "security",
        severity: "critical",
        reasonRequired: true,
      },
    ]);

    expect(summary.reasonMissingCount).toBe(1);
    expect(summary.suspiciousActivities.some((item) => item.id === "missing-reasons")).toBe(true);
  });

  it("detects bursts of critical actions by the same user", () => {
    const summary = buildAuditSummary([
      {
        ...baseLog,
        id: "AUD-3",
        action: "DELETE_USER",
        category: "security",
        severity: "critical",
        timestamp: "2026-04-05T08:00:00.000Z",
      },
      {
        ...baseLog,
        id: "AUD-4",
        action: "REVOKE_INVITE",
        category: "security",
        severity: "critical",
        timestamp: "2026-04-05T08:05:00.000Z",
      },
      {
        ...baseLog,
        id: "AUD-5",
        action: "DELETE_USER",
        category: "security",
        severity: "critical",
        timestamp: "2026-04-05T08:09:00.000Z",
      },
    ]);

    expect(summary.suspiciousActivities.some((item) => item.id.startsWith("critical-burst-"))).toBe(true);
  });

  it("returns changed snapshot fields for before/after comparisons", () => {
    const changedFields = getAuditChangedFields({
      ...baseLog,
      id: "AUD-6",
      beforeSnapshot: {
        status: "pending",
        assignedTo: "AEW 1",
      },
      afterSnapshot: {
        status: "resolved",
        assignedTo: "AEW 1",
        reason: "Field visit done",
      },
    });

    expect(changedFields).toContain("status");
    expect(changedFields).toContain("reason");
    expect(changedFields).not.toContain("assignedTo");
  });
});
