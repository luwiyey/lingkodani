import { analyzeInboundSmsWithAi } from "@/ai/flows/analyze-inbound-sms";
import { enhanceInboundAnalysisWithClarification } from "@/lib/services/sms-clarification-service";
import { analyzeInboundSms, type InboundSmsAnalysis } from "@/lib/sms-simulator";

function hasAiAnalysisConfig() {
  return Boolean(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY);
}

function sanitizeAdvice(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export async function analyzeInboundSmsWithFallback(input: {
  message: string;
  farmerName?: string;
  knownFarmer?: boolean;
}): Promise<InboundSmsAnalysis> {
  const knownFarmer = Boolean(input.knownFarmer);
  const fallback = analyzeInboundSms(
    input.message,
    input.farmerName ?? "magsasaka",
    knownFarmer
  );

  if (!hasAiAnalysisConfig()) {
    return enhanceInboundAnalysisWithClarification({
      message: input.message,
      analysis: fallback,
      knownFarmer,
    });
  }

  try {
    const output = await analyzeInboundSmsWithAi({
      message: input.message,
      farmerName: input.farmerName,
      knownFarmer: Boolean(input.knownFarmer),
    });

    return enhanceInboundAnalysisWithClarification({
      message: input.message,
      knownFarmer,
      analysis: {
      parsedIntent: output.parsedIntent,
      urgency: output.urgency,
      safetyFlag: output.safetyFlag,
      tone: output.tone,
      aiAdvice: sanitizeAdvice(output.aiAdvice, fallback.aiAdvice),
      aiConfidence: Number.isFinite(output.aiConfidence)
        ? Math.max(0, Math.min(1, output.aiConfidence))
        : fallback.aiConfidence,
      analysisSource: "ai",
      },
    });
  } catch (error) {
    console.error("AI inbound SMS analysis failed, using rule fallback.", error);
    return enhanceInboundAnalysisWithClarification({
      message: input.message,
      analysis: {
        ...fallback,
        analysisSource: "ai_fallback",
      },
      knownFarmer,
    });
  }
}
