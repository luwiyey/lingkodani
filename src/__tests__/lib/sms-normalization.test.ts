import { normalizeSmsMessage } from "@/lib/sms-normalization";

describe("sms-normalization", () => {
  it("expands shortcut texting before analysis", () => {
    const normalized = normalizeSmsMessage("wla d2 tubig sa bukid");

    expect(normalized.normalizedMessage).toContain("wala");
    expect(normalized.normalizedMessage).toContain("dito");
    expect(normalized.detectedLanguage).toBe("Filipino");
  });

  it("maps Ilocano local terms into more analysis-friendly wording", () => {
    const normalized = normalizeSmsMessage("adda peste idiay pagay mi");

    expect(normalized.normalizedMessage).toContain("may");
    expect(normalized.normalizedMessage).toContain("palay");
    expect(["Ilocano", "Ilocano mix"]).toContain(normalized.detectedLanguage);
  });

  it("detects English-heavy SMS messages", () => {
    const normalized = normalizeSmsMessage("Please help, my rice field has pest damage and no water.");

    expect(normalized.detectedLanguage).toBe("English");
  });

  it("maps more local Ilocano and barangay shorthand into normalized wording", () => {
    const normalized = normalizeSmsMessage("Adda agdama a peste idiay brgy pagay mi, bassit ti danum.");

    expect(normalized.normalizedMessage).toContain("nararanasan");
    expect(normalized.normalizedMessage).toContain("barangay");
    expect(normalized.normalizedMessage).toContain("palay");
    expect(normalized.detectedLanguage).toMatch(/Ilocano/);
  });

  it("keeps token confidence details and unknown local words for review", () => {
    const normalized = normalizeSmsMessage("May garud po na lamisaan sa palay at dakkel na area");

    expect(normalized.tokens.some((token) => token.raw === "dakkel" && token.normalized === "malaki")).toBe(true);
    expect(normalized.tokens.some((token) => token.raw === "lamisaan" && token.kind === "unknown")).toBe(true);
    expect(normalized.unknownTokens).toContain("lamisaan");
  });
});
