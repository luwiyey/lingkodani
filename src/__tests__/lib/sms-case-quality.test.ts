import {
  getSmsCaseReportingCompleteness,
  getSmsCaseResolutionReadiness,
  requiresStructuredResolutionEvidence,
} from "@/lib/sms-case-quality";
import type { SmsMessage } from "@/lib/types";

function createSmsMessage(overrides: Partial<SmsMessage>): SmsMessage {
  return {
    id: "SMS-BASE",
    farmerId: "FARM-BASE",
    farmerName: "Farmer",
    phone: "+639171234567",
    message: "Sample message",
    timestamp: "2026-03-22T08:00:00.000Z",
    parsedIntent: "UNKNOWN",
    urgency: "medium",
    status: "pending_approval",
    aiAdvice: "Pakisend pa ang detalye.",
    aiConfidence: 0.5,
    safetyFlag: "Medium",
    ...overrides,
  };
}

describe("sms-case-quality", () => {
  it("requires structured evidence for high-risk pest and emergency cases", () => {
    expect(
      requiresStructuredResolutionEvidence({
        urgency: "high",
        parsedIntent: "PEST_DISEASE",
      })
    ).toBe(true);
    expect(
      requiresStructuredResolutionEvidence({
        urgency: "medium",
        parsedIntent: "PEST_DISEASE",
      })
    ).toBe(false);
  });

  it("blocks high-risk resolution when no assistance or completed field visit exists", () => {
    const readiness = getSmsCaseResolutionReadiness({
      message: {
        id: "SMS-001",
        farmerId: "FARM-001",
        timestamp: "2026-03-22T08:00:00.000Z",
        urgency: "high",
        parsedIntent: "PEST_DISEASE",
      },
      assistanceRecords: [],
      fieldVisitTasks: [],
    });

    expect(readiness.required).toBe(true);
    expect(readiness.ready).toBe(false);
    expect(readiness.blockers[0]).toContain("Mag-log muna");
  });

  it("allows high-risk resolution once there is linked assistance or completed visit evidence", () => {
    const readiness = getSmsCaseResolutionReadiness({
      message: {
        id: "SMS-002",
        farmerId: "FARM-002",
        timestamp: "2026-03-22T08:00:00.000Z",
        urgency: "high",
        parsedIntent: "EMERGENCY",
      },
      assistanceRecords: [
        {
          id: "AST-002",
          farmerId: "FARM-002",
          relatedSmsId: "SMS-002",
          type: "Technical Advice",
          title: "Emergency follow-up",
          details: "Nagbigay ng actual field response at safety advice.",
          status: "completed",
          providedBy: "AEW",
          createdAt: "2026-03-22T08:10:00.000Z",
          updatedAt: "2026-03-22T08:20:00.000Z",
        },
      ],
      fieldVisitTasks: [
        {
          id: "VISIT-002",
          farmerId: "FARM-002",
          relatedSmsId: "SMS-002",
          title: "Flood visit",
          purpose: "I-check ang pinsala",
          scheduledFor: "2026-03-22T08:30:00.000Z",
          assignedTo: "AEW",
          priority: "high",
          status: "completed",
          createdAt: "2026-03-22T08:05:00.000Z",
          updatedAt: "2026-03-22T09:00:00.000Z",
        },
      ],
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.assistanceCount).toBe(1);
    expect(readiness.completedVisitCount).toBe(1);
  });

  it("marks only fully documented outcomes as reporting-ready", () => {
    const ready = getSmsCaseReportingCompleteness(createSmsMessage({
      id: "SMS-003",
      farmerId: "FARM-003",
      farmerName: "Juan",
      message: "May peste po sa palay",
      parsedIntent: "PEST_DISEASE",
      urgency: "high",
      status: "approved",
      aiAdvice: "Mag-follow up ang barangay team.",
      aiConfidence: 0.8,
      safetyFlag: "High",
      caseId: "CASE-003",
      caseStatus: "closed",
      caseOutcomeStatus: "resolved",
      caseOutcomeSummary: "Nagkaroon ng onsite assistance at kumpirmadong humupa ang infestation.",
      assignedTo: "AEW",
      respondedAt: "2026-03-22T08:20:00.000Z",
      closedAt: "2026-03-22T10:00:00.000Z",
      resolutionConfirmationStatus: "confirmed_by_farmer",
    }));
    const partial = getSmsCaseReportingCompleteness(createSmsMessage({
      id: "SMS-004",
      farmerId: "FARM-004",
      farmerName: "Maria",
      phone: "+639171234568",
      message: "May problema po",
      aiConfidence: 0.4,
      caseStatus: "open",
    }));

    expect(ready.readyForReports).toBe(true);
    expect(ready.tier).toBe("complete");
    expect(partial.readyForReports).toBe(false);
    expect(partial.tier).toBe("low_confidence");
  });
});
