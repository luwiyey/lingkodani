import {
  buildFarmerResolutionConfirmationBody,
  parseFarmerResolutionConfirmationReply,
} from "@/lib/services/resolution-confirmation-service";
import type { SmsMessage } from "@/lib/types";

function createMessage(overrides: Partial<SmsMessage> = {}): SmsMessage {
  return {
    id: "SMS-1",
    farmerId: "FARM-1",
    farmerName: "Juan Dela Cruz",
    phone: "+639171234567",
    message: "May problema po sa palay namin",
    timestamp: "2026-03-22T08:00:00.000Z",
    caseId: "CASE-SMS-1",
    parsedIntent: "PEST_DISEASE",
    urgency: "medium",
    status: "pending_approval",
    aiAdvice: "Test advice",
    aiConfidence: 0.9,
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    ...overrides,
  };
}

describe("resolution-confirmation-service", () => {
  it("builds respectful Filipino confirmation copy by default", () => {
    const body = buildFarmerResolutionConfirmationBody(createMessage());

    expect(body).toContain("handa nang isara ang inyong concern");
    expect(body).toContain("Pakireply po");
  });

  it("builds respectful English confirmation copy for English senders", () => {
    const body = buildFarmerResolutionConfirmationBody(
      createMessage({ detectedLanguage: "English" })
    );

    expect(body).toContain("ready for closure");
    expect(body).toContain("Please reply YES");
  });

  it("parses farmer confirmation replies together with optional case ids", () => {
    expect(parseFarmerResolutionConfirmationReply("YES CASE-SMS-1")).toEqual({
      status: "confirmed_by_farmer",
      caseId: "CASE-SMS-1",
    });

    expect(parseFarmerResolutionConfirmationReply("NO case-sms-2")).toEqual({
      status: "reopened",
      caseId: "CASE-SMS-2",
    });
  });
});
