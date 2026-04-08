import {
  buildMobileSyncConflict,
  getFarmerSyncVersion,
  getFieldVisitTaskSyncVersion,
  getSmsMessageSyncVersion,
  hasExpectedSyncConflict,
} from "@/lib/mobile-sync-integrity";
import type { Farmer, FieldVisitTask, SmsMessage } from "@/lib/types";

const baseFarmer: Farmer = {
  id: "FARM-1",
  name: "Juan Dela Cruz",
  age: 48,
  gender: "Lalaki",
  phone: "+639171234567",
  barangay: "Batakil",
  sitio: "Zone 1",
  farmSize: 1.75,
  crops: ["Palay"],
  registrationDate: "2025-01-01T00:00:00.000Z",
  lastSmsActivity: "2025-01-02T00:00:00.000Z",
  status: "active",
  profileVersion: 2,
  identityTrustLevel: "probable",
};

const baseMessage: SmsMessage = {
  id: "SMS-1",
  farmerId: baseFarmer.id,
  farmerName: baseFarmer.name,
  phone: baseFarmer.phone,
  message: "May dilaw na dahon sa palay.",
  timestamp: "2025-01-03T08:00:00.000Z",
  parsedIntent: "PEST_DISEASE",
  urgency: "medium",
  status: "pending_approval",
  aiAdvice: "Magbigay muna ng dagdag na detalye.",
  aiConfidence: 0.72,
  safetyFlag: "Low",
  caseStatus: "open",
};

const baseVisit: FieldVisitTask = {
  id: "VISIT-1",
  farmerId: baseFarmer.id,
  title: "Field validation",
  purpose: "Suriin ang sintomas",
  scheduledFor: "2025-01-03T09:00:00.000Z",
  assignedTo: "AEW Maria",
  priority: "medium",
  status: "scheduled",
  createdAt: "2025-01-03T07:30:00.000Z",
  updatedAt: "2025-01-03T07:30:00.000Z",
};

describe("mobile sync integrity", () => {
  it("changes sms sync version when case state changes", () => {
    const before = getSmsMessageSyncVersion(baseMessage);
    const after = getSmsMessageSyncVersion({
      ...baseMessage,
      assignedTo: "AEW Maria",
      assignedAt: "2025-01-03T08:10:00.000Z",
    });

    expect(after).not.toBe(before);
  });

  it("changes farmer sync version when profile version changes", () => {
    const before = getFarmerSyncVersion(baseFarmer);
    const after = getFarmerSyncVersion({
      ...baseFarmer,
      profileVersion: 3,
      identityTrustLevel: "verified",
    });

    expect(after).not.toBe(before);
  });

  it("changes field visit sync version when verification status changes", () => {
    const before = getFieldVisitTaskSyncVersion(baseVisit);
    const after = getFieldVisitTaskSyncVersion({
      ...baseVisit,
      status: "completed",
      updatedAt: "2025-01-03T10:00:00.000Z",
      verificationStatus: "gps_captured",
    });

    expect(after).not.toBe(before);
  });

  it("detects sync conflicts only when an expected version exists", () => {
    const current = getSmsMessageSyncVersion(baseMessage);

    expect(hasExpectedSyncConflict(undefined, current)).toBe(false);
    expect(hasExpectedSyncConflict("", current)).toBe(false);
    expect(hasExpectedSyncConflict(current, current)).toBe(false);
    expect(hasExpectedSyncConflict(`${current}-changed`, current)).toBe(true);
  });

  it("builds a conflict payload with operator guidance", () => {
    const payload = buildMobileSyncConflict({
      expectedSyncVersion: "old-version",
      currentSyncVersion: "new-version",
      target: "sms_message",
      summary: "Nagbago na ang case habang offline ang phone.",
      recommendedAction: "I-refresh ang case bago mag-reply ulit.",
      currentState: {
        caseStatus: "assigned",
        assignedTo: "AEW Maria",
      },
    });

    expect(payload.code).toBe("mobile_sync_conflict");
    expect(payload.conflict.target).toBe("sms_message");
    expect(payload.conflict.summary).toContain("offline");
    expect(payload.conflict.currentState.assignedTo).toBe("AEW Maria");
  });
});
