import { applyDataRetentionSweep } from "@/lib/data-retention";
import type { AuditLog, Farmer, SystemSettings } from "@/lib/types";

const policy: SystemSettings["retentionPolicy"] = {
  autoRedactionEnabled: true,
  auditLogRedactionDays: 30,
  archivedFarmerRedactionDays: 90,
};

describe("data-retention", () => {
  it("redacts old audit logs after the configured window", () => {
    const result = applyDataRetentionSweep({
      auditLogs: [
        {
          id: "AUD-1",
          timestamp: "2025-01-01T00:00:00.000Z",
          user: "Juan",
          action: "UPDATE_SMS_CASE_OUTCOME",
          details: "Juan dela Cruz -> resolved",
        } satisfies AuditLog,
      ],
      farmers: [],
      policy,
      now: "2025-03-15T00:00:00.000Z",
    });

    expect(result.redactedAuditLogIds).toEqual(["AUD-1"]);
    expect(result.auditLogs[0].details).toContain("PII redacted");
    expect(result.auditLogs[0].retentionRedactedAt).toBe("2025-03-15T00:00:00.000Z");
  });

  it("redacts archived farmer PII after the archive retention window", () => {
    const result = applyDataRetentionSweep({
      auditLogs: [],
      farmers: [
        {
          id: "FARM-1",
          name: "Maria Clara",
          age: 40,
          gender: "Babae",
          phone: "+639171234567",
          barangay: "Batakil",
          sitio: "Zone 2",
          farmSize: 1.5,
          crops: ["Palay"],
          registrationDate: "2024-01-01T00:00:00.000Z",
          lastSmsActivity: "2024-05-01T00:00:00.000Z",
          status: "archived",
          archivedAt: "2024-01-10T00:00:00.000Z",
        } satisfies Farmer,
      ],
      policy,
      now: "2024-05-01T00:00:00.000Z",
    });

    expect(result.redactedFarmerIds).toEqual(["FARM-1"]);
    expect(result.farmers[0].name).toBe("Archived Farmer FARM-1");
    expect(result.farmers[0].retentionRedactedAt).toBe("2024-05-01T00:00:00.000Z");
  });
});
