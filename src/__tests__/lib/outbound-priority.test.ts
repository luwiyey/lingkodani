import { compareMessagesForOutboundPriority, getOutboundPriorityMeta } from "@/lib/outbound-priority";
import type { SmsMessage } from "@/lib/types";

const baseMessage: SmsMessage = {
  id: "SMS-PRIO-1",
  farmerId: "FARM-1",
  farmerName: "Juan Dela Cruz",
  phone: "+639171234567",
  message: "May peste sa palay",
  timestamp: "2026-03-22T08:00:00.000Z",
  parsedIntent: "PEST_DISEASE",
  urgency: "medium",
  status: "approved",
  aiAdvice: "Mag-ingat po.",
  aiConfidence: 0.8,
  safetyFlag: "Medium",
};

describe("outbound-priority", () => {
  it("assigns critical priority to urgent emergency reminders", () => {
    const priority = getOutboundPriorityMeta({
      sourceMessage: {
        ...baseMessage,
        parsedIntent: "EMERGENCY",
        urgency: "high",
        caseStatus: "escalated",
      },
      purpose: "official_reminder",
      audience: "official",
    });

    expect(priority.priority).toBe("critical");
    expect(priority.score).toBeGreaterThanOrEqual(72);
  });

  it("keeps registration follow-ups below urgent case traffic", () => {
    const urgent = {
      ...baseMessage,
      id: "SMS-PRIO-2",
      urgency: "high" as const,
    };
    const registration = {
      ...baseMessage,
      id: "SMS-PRIO-3",
      registrationRequired: true,
      identityDetailsNeeded: true,
      urgency: "low" as const,
    };

    expect(compareMessagesForOutboundPriority(urgent, registration, "auto_reply")).toBeLessThan(0);
  });
});

