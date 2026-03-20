import {
  applyLexiconRuleToAnalysis,
  buildLexiconTeachingContext,
  buildReviewedExamplesContext,
  findBestMatchingLexiconRule,
  findRelevantTrainingExamples,
} from "@/lib/sms-teaching";
import type { SmsLexiconRule, SmsTrainingExample } from "@/lib/types";

const rules: SmsLexiconRule[] = [
  {
    id: "lex-armyworm",
    phrase: "armyworm",
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "Medium",
    tone: "Kritikal",
    guidance: "Armyworm ito. I-prioritize ang field validation.",
    enabled: true,
  },
  {
    id: "lex-drought",
    phrase: "walang patubig",
    intent: "WEATHER_HELP",
    urgency: "high",
    safetyFlag: "Medium",
    guidance: "I-escalate ang kakulangan sa patubig para sa irrigation support.",
    enabled: true,
  },
];

const reviewedExamples: SmsTrainingExample[] = [
  {
    id: "TRAIN-1",
    smsMessageId: "SMS-1",
    farmerId: "FARM-1",
    farmerName: "Juan",
    phone: "+639171234567",
    message: "May armyworm po sa mais namin at mabilis dumami.",
    inboundTimestamp: "2026-03-20T08:00:00.000Z",
    analysisSource: "ai",
    originalAnalysis: {
      parsedIntent: "PEST_DISEASE",
      urgency: "high",
      safetyFlag: "Medium",
      tone: "Nag-aalala",
      aiAdvice: "Orihinal na payo",
      aiConfidence: 0.84,
    },
    finalReview: {
      action: "approved_edited",
      status: "approved",
      finalAdvice: "I-check agad ang dahon at maghanda ng ligtas na pest control guidance.",
      finalAnalysis: {
        parsedIntent: "PEST_DISEASE",
        urgency: "high",
        safetyFlag: "Medium",
        tone: "Kritikal",
      },
      reviewedBy: "Brgy. Admin",
      reviewedAt: "2026-03-20T08:30:00.000Z",
      wasAdviceEdited: true,
    },
  },
  {
    id: "TRAIN-2",
    smsMessageId: "SMS-2",
    farmerId: "FARM-2",
    farmerName: "Maria",
    phone: "+639181234567",
    message: "Magkano po presyo ng palay ngayon?",
    inboundTimestamp: "2026-03-19T08:00:00.000Z",
    analysisSource: "rules",
    originalAnalysis: {
      parsedIntent: "PRICE_CHECK",
      urgency: "low",
      safetyFlag: "Low",
      tone: "Neutral",
      aiAdvice: "Orihinal na payo",
      aiConfidence: 0.61,
    },
    finalReview: {
      action: "approved_as_is",
      status: "approved",
      finalAdvice: "I-check ang pinakahuling market price reference bago sumagot.",
      finalAnalysis: {
        parsedIntent: "PRICE_CHECK",
        urgency: "low",
        safetyFlag: "Low",
        tone: "Neutral",
      },
      reviewedBy: "Brgy. Admin",
      reviewedAt: "2026-03-19T08:15:00.000Z",
      wasAdviceEdited: false,
    },
  },
];

describe("sms-teaching", () => {
  it("finds the strongest matching lexicon rule", () => {
    const matchedRule = findBestMatchingLexiconRule(
      "May armyworm sa mais ko at mabilis dumami.",
      rules
    );

    expect(matchedRule?.id).toBe("lex-armyworm");
  });

  it("builds lexicon and reviewed-example context for the AI prompt", () => {
    const teachingContext = buildLexiconTeachingContext(
      "May armyworm sa mais ko at mabilis dumami.",
      rules
    );
    const reviewedContext = buildReviewedExamplesContext(
      "May armyworm sa mais ko at mabilis dumami.",
      reviewedExamples
    );

    expect(teachingContext).toContain("armyworm");
    expect(teachingContext).toContain("PEST_DISEASE");
    expect(reviewedContext).toContain("Reviewed SMS");
    expect(reviewedContext).toContain("finalAdvice");
  });

  it("returns relevant approved examples and applies the matched lexicon rule", () => {
    const relevantExamples = findRelevantTrainingExamples(
      "May armyworm sa mais ko at mabilis dumami.",
      reviewedExamples
    );

    expect(relevantExamples).toHaveLength(1);
    expect(relevantExamples[0].id).toBe("TRAIN-1");

    const patched = applyLexiconRuleToAnalysis(
      {
        parsedIntent: "UNKNOWN",
        urgency: "low",
        safetyFlag: "Low",
        tone: "Neutral",
        aiAdvice: "Fallback advice",
        aiConfidence: 0.32,
        analysisSource: "rules",
        clarificationNeeded: true,
        clarificationQuestion: "Ano ang problema?",
      },
      rules[0]
    );

    expect(patched.parsedIntent).toBe("PEST_DISEASE");
    expect(patched.urgency).toBe("high");
    expect(patched.aiAdvice).toContain("Armyworm");
    expect(patched.clarificationNeeded).toBe(false);
  });
});
