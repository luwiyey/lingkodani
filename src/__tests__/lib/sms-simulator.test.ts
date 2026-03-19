import { analyzeInboundSms, inferIntent } from "@/lib/sms-simulator";

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
});
