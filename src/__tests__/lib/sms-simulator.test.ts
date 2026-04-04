import { analyzeInboundSms, inferIntent } from "@/lib/sms-simulator";
import type { SmsLexiconRule } from "@/lib/types";

const customRules: SmsLexiconRule[] = [
  {
    id: "lex-custom-armyworm",
    phrase: "armyworm",
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "Medium",
    tone: "Kritikal",
    guidance: "Armyworm ito. I-prioritize ang validation at rekomendasyon sa pest control.",
    enabled: true,
  },
];

describe("sms-simulator", () => {
  it("prioritizes flood emergencies over harvest substring matches", () => {
    expect(inferIntent("Binabaha ang palayan namin ngayong umaga")).toBe("EMERGENCY");
  });

  it("detects harvest updates from explicit harvest language", () => {
    expect(inferIntent("Mag-aani kami bukas ng umaga")).toBe("HARVEST");
  });

  it("returns lower-confidence rules output than the AI path implies", () => {
    const analysis = analyzeInboundSms("May mga uod sa palay namin.", "Juan dela Cruz", true);

    expect(analysis.analysisSource).toBe("rules");
    expect(analysis.aiConfidence).toBeLessThan(0.75);
  });

  it("uses custom cue rules for fallback analysis when provided", () => {
    const analysis = analyzeInboundSms(
      "May armyworm sa mais namin dito sa Zone 3.",
      "Juan dela Cruz",
      true,
      customRules
    );

    expect(analysis.parsedIntent).toBe("PEST_DISEASE");
    expect(analysis.urgency).toBe("high");
    expect(analysis.tone).toBe("Kritikal");
    expect(analysis.aiAdvice).toContain("Armyworm");
  });

  it("lowers fallback confidence when the message includes several unknown local terms", () => {
    const familiar = analyzeInboundSms("May uod sa palay namin dito sa Zone 1.", "Juan dela Cruz", true);
    const unfamiliar = analyzeInboundSms("May lamisaan at garud sa palay namin dito sa Zone 1.", "Juan dela Cruz", true);

    expect(unfamiliar.normalizationUnknownTokens).toContain("lamisaan");
    expect(unfamiliar.aiConfidence).toBeLessThan(familiar.aiConfidence);
  });
});
