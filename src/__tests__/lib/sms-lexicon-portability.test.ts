import {
  extractSmsLexiconRulesFromJson,
  formatSmsLexiconRulesAsCsv,
  parseSmsLexiconRulesCsv,
} from "@/lib/sms-lexicon-portability";
import type { SmsLexiconRule } from "@/lib/types";

const rules: SmsLexiconRule[] = [
  {
    id: "lex-1",
    phrase: "armyworm",
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "Medium",
    tone: "Kritikal",
    guidance: "I-prioritize ang field validation.",
    enabled: true,
    notes: "Mais at gulay",
  },
];

describe("sms-lexicon-portability", () => {
  it("round-trips cue rules through CSV", () => {
    const csv = formatSmsLexiconRulesAsCsv(rules);
    const parsed = parseSmsLexiconRulesCsv(csv);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].phrase).toBe("armyworm");
    expect(parsed[0].intent).toBe("PEST_DISEASE");
    expect(parsed[0].tone).toBe("Kritikal");
  });

  it("extracts cue rules from JSON payloads", () => {
    const parsed = extractSmsLexiconRulesFromJson({
      smsLexiconRules: rules,
    });

    expect(parsed).toHaveLength(1);
    expect(parsed[0].guidance).toContain("field validation");
  });
});
