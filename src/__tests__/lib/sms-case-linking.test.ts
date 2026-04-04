import { getPotentialDuplicateCases } from "@/lib/sms-case-linking";
import type { SmsMessage } from "@/lib/types";

const baseMessage: SmsMessage = {
  id: "SMS-NEW",
  farmerId: "FARM-1",
  farmerName: "Juan",
  phone: "+639171234567",
  message: "May peste at dilaw na dahon sa palay sa Zone 1",
  timestamp: "2025-01-05T10:00:00.000Z",
  parsedIntent: "PEST_DISEASE",
  urgency: "high",
  status: "pending_approval",
  aiAdvice: "Mag-monitor po.",
  aiConfidence: 0.82,
  safetyFlag: "Medium",
  assignedTo: "AEW Cruz",
  caseId: "CASE-1",
};

describe("sms-case-linking", () => {
  it("surfaces the strongest duplicate candidate for thread review", () => {
    const candidates = getPotentialDuplicateCases(baseMessage, [
      baseMessage,
      {
        ...baseMessage,
        id: "SMS-OLD",
        timestamp: "2025-01-05T08:30:00.000Z",
        message: "Palay sa Zone 1, may peste at naninilaw",
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.message.id).toBe("SMS-OLD");
    expect(candidates[0]?.score).toBeGreaterThanOrEqual(0.7);
  });

  it("keeps divergent same-number messages as low-confidence review candidates", () => {
    const candidates = getPotentialDuplicateCases(baseMessage, [
      baseMessage,
      {
        ...baseMessage,
        id: "SMS-DIFF",
        message: "Presyo ng mais sa palengke ngayong linggo",
        parsedIntent: "PRICE_CHECK",
        timestamp: "2025-01-05T09:00:00.000Z",
        caseId: undefined,
        assignedTo: undefined,
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.message.id).toBe("SMS-DIFF");
    expect(candidates[0]?.score).toBeLessThan(0.6);
  });
});
