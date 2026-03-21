import { createInboundSmsRecord } from "@/lib/services/inbound-sms-service";

describe("inbound-sms-service", () => {
  it("builds a stable fallback case id when the sender cannot be normalized into a phone", () => {
    const created = createInboundSmsRecord({
      id: "SMS-CUSTOM-1",
      phone: "TNT",
      message: "Nag-expire na ang FREE DATA 7 mo.",
      farmers: [],
      timestamp: "2026-03-21T08:00:00.000Z",
    });

    expect(created.message.id).toBe("SMS-CUSTOM-1");
    expect(created.message.caseId).toBe("CASE-SMS-CUSTOM-1");
  });
});
