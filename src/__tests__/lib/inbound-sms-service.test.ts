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

  it("auto-creates a pending farmer record for complete registration SMS", () => {
    const created = createInboundSmsRecord({
      id: "SMS-REGISTER-1",
      phone: "+639171234567",
      message: "REGISTER Juan Dela Cruz Zone 1 Palay 1ha",
      farmers: [],
      timestamp: "2026-03-22T08:00:00.000Z",
    });

    expect(created.newFarmer).toBeTruthy();
    expect(created.newFarmer?.name).toBe("Juan Dela Cruz");
    expect(created.newFarmer?.sitio).toBe("Zone 1");
    expect(created.newFarmer?.status).toBe("pending_approval");
    expect(created.message.registrationRequired).toBe(false);
    expect(created.message.caseStatus).toBe("open");
    expect(created.message.parsedIntent).toBe("REGISTER");
  });

  it("asks for missing details instead of creating an incomplete pending farmer", () => {
    const created = createInboundSmsRecord({
      id: "SMS-REGISTER-2",
      phone: "+639171234567",
      message: "REGISTER Juan Dela Cruz",
      farmers: [],
      timestamp: "2026-03-22T08:00:00.000Z",
    });

    expect(created.newFarmer).toBeUndefined();
    expect(created.message.registrationRequired).toBe(true);
    expect(created.message.caseStatus).toBe("awaiting_registration");
    expect(created.message.clarificationNeeded).toBe(true);
    expect(created.message.aiAdvice).toContain("sitio o zone");
    expect(created.message.parsedIntent).toBe("REGISTER");
  });
});
