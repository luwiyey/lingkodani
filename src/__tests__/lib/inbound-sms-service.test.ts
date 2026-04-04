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
    expect(concernMessage.message.caseId).not.toBe(firstMessage.message.caseId);
    expect(concernMessage.message.registrationRequired).toBe(false);
    expect(concernMessage.message.identityDetailsNeeded).toBe(true);
    expect(concernMessage.message.aiAdvice).toContain("pangalan");
  });

  it("handles an unregistered farmer concern without blocking it behind registration", () => {
    const created = createInboundSmsRecord({
      id: "SMS-CONCERN-1",
      phone: "+639171239999",
      message: "Marami pong uod sa palay namin",
      farmers: [],
      timestamp: "2026-03-22T08:10:00.000Z",
    });

    expect(created.newFarmer).toBeUndefined();
    expect(created.message.parsedIntent).toBe("PEST_DISEASE");
    expect(created.message.registrationRequired).toBe(false);
    expect(created.message.identityDetailsNeeded).toBe(true);
    expect(created.message.caseStatus).toBe("open");
    expect(created.message.aiAdvice).toContain("pangalan");
    expect(created.message.aiAdvice).toContain("sitio");
  });

  it("does not force clarification when the concern has strong pest evidence", () => {
    const created = createInboundSmsRecord({
      id: "SMS-CONCERN-1B",
      phone: "+639171239998",
      message: "May uod at kuhol po sa palay namin sa Zone 1",
      farmers: [],
      timestamp: "2026-03-22T08:11:00.000Z",
    });

    expect(created.message.parsedIntent).toBe("PEST_DISEASE");
    expect(created.message.clarificationNeeded).toBe(false);
    expect(created.message.caseStatus).toBe("open");
  });

  it("asks a topic confirmation question when the message is ambiguous between pest and water concern", () => {
    const created = createInboundSmsRecord({
      id: "SMS-CONCERN-1C",
      phone: "+639171239997",
      message: "May uod po pero kulang din sa tubig ang palay namin",
      farmers: [],
      timestamp: "2026-03-22T08:12:00.000Z",
    });

    expect(created.message.parsedIntent).toBe("PEST_DISEASE");
    expect(created.message.clarificationNeeded).toBe(true);
    expect(created.message.caseStatus).toBe("awaiting_clarification");
    expect(created.message.aiAdvice).toContain("peste o sakit");
    expect(created.message.aiAdvice).toContain("panahon, tubig, o patubig");
  });

  it("stores richer triage details for severity, stage, and sentiment-sensitive pest cases", () => {
    const created = createInboundSmsRecord({
      id: "SMS-CONCERN-1D",
      phone: "+639171239996",
      message: "May uod sa palay namin pero wala pa ring sagot at namumulaklak na ito",
      farmers: [],
      timestamp: "2026-03-22T08:13:00.000Z",
    });

    expect(created.message.cropStage).toBe("flowering");
    expect(created.message.sentiment).toBe("frustrated");
    expect(created.message.triageUncertainty).toBe("needs_severity");
    expect(created.message.triageNextQuestion).toContain("Gaano po kalawak");
    expect(created.message.clarificationNeeded).toBe(true);
  });

  it("keeps emergency concerns open even when the sender is not yet registered", () => {
    const created = createInboundSmsRecord({
      id: "SMS-EMERGENCY-1",
      phone: "+639171230001",
      message: "Baha na po sa bukid namin, emergency ito",
      farmers: [],
      timestamp: "2026-03-22T08:12:00.000Z",
    });

    expect(created.newFarmer).toBeUndefined();
    expect(created.message.parsedIntent).toBe("EMERGENCY");
    expect(created.message.registrationRequired).toBe(false);
    expect(created.message.identityDetailsNeeded).toBe(true);
    expect(created.message.caseStatus).toBe("open");
    expect(created.message.aiAdvice).toContain("pangalan");
  });

  it("reuses the same case id for a recent unknown concern follow-up with the same intent", () => {
    const firstMessage = createInboundSmsRecord({
      id: "SMS-CONCERN-2A",
      phone: "+639171230002",
      message: "Marami pong uod sa palay namin",
      farmers: [],
      timestamp: "2026-03-22T08:20:00.000Z",
    });

    const secondMessage = createInboundSmsRecord({
      id: "SMS-CONCERN-2B",
      phone: "+639171230002",
      message: "Lumalala pa po ang uod sa palay namin",
      farmers: [],
      existingMessages: [firstMessage.message],
      timestamp: "2026-03-22T09:00:00.000Z",
    });

    expect(secondMessage.message.parsedIntent).toBe("PEST_DISEASE");
    expect(secondMessage.message.caseId).toBe(firstMessage.message.caseId);
    expect(secondMessage.message.threadConfidence).toBeGreaterThan(0.5);
    expect(secondMessage.message.threadReason).toContain("parehong intent");
  });

  it("keeps a short prompt-style reply attached to the same unknown-sender case", () => {
    const firstMessage = createInboundSmsRecord({
      id: "SMS-CONCERN-2C",
      phone: "+639171230012",
      message: "Marami pong uod sa palay namin",
      farmers: [],
      timestamp: "2026-03-22T08:40:00.000Z",
    });

    const secondMessage = createInboundSmsRecord({
      id: "SMS-CONCERN-2D",
      phone: "+639171230012",
      message: "Zone 1 sa Batakil po",
      farmers: [],
      existingMessages: [firstMessage.message],
      timestamp: "2026-03-22T08:43:00.000Z",
    });

    expect(firstMessage.message.identityDetailsNeeded).toBe(true);
    expect(secondMessage.message.caseId).toBe(firstMessage.message.caseId);
    expect(secondMessage.message.threadConfidence).toBeGreaterThan(0.5);
    expect(secondMessage.message.threadReason).toContain("prompt");
  });

  it("opens a new case when the same unknown sender reports a clearly different new concern", () => {
    const firstMessage = createInboundSmsRecord({
      id: "SMS-CONCERN-2E",
      phone: "+639171230013",
      message: "May uod po sa palay namin",
      farmers: [],
      timestamp: "2026-03-22T08:50:00.000Z",
    });

    const secondMessage = createInboundSmsRecord({
      id: "SMS-CONCERN-2F",
      phone: "+639171230013",
      message: "Bagong problema po ito, nalalanta naman ang mais sa kabilang lote",
      farmers: [],
      existingMessages: [firstMessage.message],
      timestamp: "2026-03-22T08:56:00.000Z",
    });

    expect(secondMessage.message.caseId).not.toBe(firstMessage.message.caseId);
    expect(secondMessage.message.threadConfidence).toBeUndefined();
    expect(secondMessage.message.message).toContain("mais");
  });

  it("flags mixed-concern messages for manual thread review instead of silently merging them", () => {
    const firstMessage = createInboundSmsRecord({
      id: "SMS-CONCERN-2G",
      phone: "+639171230014",
      message: "May uod po sa palay namin sa Zone 1",
      farmers: [],
      timestamp: "2026-03-22T08:52:00.000Z",
    });

    const secondMessage = createInboundSmsRecord({
      id: "SMS-CONCERN-2H",
      phone: "+639171230014",
      message: "May uod sa palay pero baha naman sa mais sa kabilang lote",
      farmers: [],
      existingMessages: [firstMessage.message],
      timestamp: "2026-03-22T08:58:00.000Z",
    });

    expect(secondMessage.message.caseId).not.toBe(firstMessage.message.caseId);
    expect(secondMessage.message.multiConcernDetected).toBe(true);
    expect(secondMessage.message.threadReviewStatus).toBe("pending");
    expect(secondMessage.message.possibleDuplicateOfCaseId).toBe(firstMessage.message.caseId);
  });

  it("creates a new case id when a known farmer sends a separate new concern", () => {
    const farmers = [
      {
        id: "FARM-1",
        name: "Juan Dela Cruz",
        age: 42,
        gender: "Lalaki",
        phone: "+639171230003",
        barangay: "Batakil",
        sitio: "Zone 1",
        farmSize: 1,
        crops: ["Palay"],
        registrationDate: "2026-03-01T00:00:00.000Z",
        lastSmsActivity: "2026-03-21T00:00:00.000Z",
        status: "active" as const,
      },
    ];

    const firstMessage = createInboundSmsRecord({
      id: "SMS-KNOWN-1A",
      phone: "+639171230003",
      message: "May uod po sa palay namin",
      farmers,
      timestamp: "2026-03-22T08:25:00.000Z",
    });

    const secondMessage = createInboundSmsRecord({
      id: "SMS-KNOWN-1B",
      phone: "+639171230003",
      message: "Mahal din po ang presyo ng palay ngayon",
      farmers,
      existingMessages: [firstMessage.message],
      timestamp: "2026-03-22T10:25:00.000Z",
    });

    expect(firstMessage.message.caseId).toBe("CASE-SMS-KNOWN-1A");
    expect(secondMessage.message.caseId).toBe("CASE-SMS-KNOWN-1B");
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

  it("keeps unknown tokens so the lexicon learning queue can review them later", () => {
    const created = createInboundSmsRecord({
      id: "SMS-CONCERN-4A",
      phone: "+639171230020",
      message: "May lamisaan po sa pagay dito sa Zone 2",
      farmers: [],
      timestamp: "2026-03-22T08:30:00.000Z",
    });

    expect(created.message.normalizationUnknownTokens).toContain("lamisaan");
    expect(created.message.normalizationTokens?.some((token) => token.raw === "pagay" && token.normalized === "palay")).toBe(true);
  });
});
