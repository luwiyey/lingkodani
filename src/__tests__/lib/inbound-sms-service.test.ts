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

  it("merges follow-up registration replies into the same draft until complete", () => {
    const firstMessage = createInboundSmsRecord({
      id: "SMS-REGISTER-3A",
      phone: "+639171234567",
      message: "REGISTER Juan Dela Cruz",
      farmers: [],
      timestamp: "2026-03-22T08:00:00.000Z",
    });

    const secondMessage = createInboundSmsRecord({
      id: "SMS-REGISTER-3B",
      phone: "+639171234567",
      message: "Zone 1",
      farmers: [],
      existingMessages: [firstMessage.message],
      timestamp: "2026-03-22T08:02:00.000Z",
    });

    expect(firstMessage.newFarmer).toBeUndefined();
    expect(firstMessage.message.caseStatus).toBe("awaiting_registration");
    expect(secondMessage.newFarmer).toBeTruthy();
    expect(secondMessage.newFarmer?.name).toBe("Juan Dela Cruz");
    expect(secondMessage.newFarmer?.sitio).toBe("Zone 1");
    expect(secondMessage.message.caseId).toBe(firstMessage.message.caseId);
    expect(secondMessage.message.caseStatus).toBe("open");
    expect(secondMessage.message.registrationRequired).toBe(false);
  });

  it("does not force an unrelated concern into an open registration draft", () => {
    const firstMessage = createInboundSmsRecord({
      id: "SMS-REGISTER-3C",
      phone: "+639171234567",
      message: "REGISTER Juan Dela Cruz",
      farmers: [],
      timestamp: "2026-03-22T08:00:00.000Z",
    });

    const concernMessage = createInboundSmsRecord({
      id: "SMS-REGISTER-3D",
      phone: "+639171234567",
      message: "Marami pong uod sa palay namin",
      farmers: [],
      existingMessages: [firstMessage.message],
      timestamp: "2026-03-22T08:03:00.000Z",
    });

    expect(concernMessage.newFarmer).toBeUndefined();
    expect(concernMessage.message.parsedIntent).toBe("PEST_DISEASE");
    expect(concernMessage.message.message).toBe("Marami pong uod sa palay namin");
    expect(concernMessage.message.aiAdvice).toContain("rehistro");
  });

  it("asks for missing registration details in respectful English when the farmer texts in English", () => {
    const created = createInboundSmsRecord({
      id: "SMS-REGISTER-4",
      phone: "+639171234568",
      message: "REGISTER John Smith please",
      farmers: [],
      timestamp: "2026-03-22T08:05:00.000Z",
    });

    expect(created.newFarmer).toBeUndefined();
    expect(created.message.detectedLanguage).toBe("English");
    expect(created.message.aiAdvice).toContain("please send your");
    expect(created.message.aiAdvice).toContain("sitio or zone");
  });
});
