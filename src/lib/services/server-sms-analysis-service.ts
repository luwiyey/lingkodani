import { analyzeInboundSmsWithAi } from "@/ai/flows/analyze-inbound-sms";
import { smsTrainingExamples as demoSmsTrainingExamples } from "@/lib/data";
import { isLiveMode } from "@/lib/config/app-mode";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { enhanceInboundAnalysisWithClarification } from "@/lib/services/sms-clarification-service";
import { ensureRespectfulSmsAdvice, normalizeSmsMessage } from "@/lib/sms-normalization";
import {
  applyLexiconRuleToAnalysis,
  buildLexiconTeachingContext,
  buildReviewedExamplesContext,
  findBestMatchingLexiconRule,
} from "@/lib/sms-teaching";
import { analyzeInboundSms, type InboundSmsAnalysis } from "@/lib/sms-simulator";
import { mergeSystemSettings, SYSTEM_SETTINGS_DOCUMENT_ID } from "@/lib/system-settings";
import type { SmsLexiconRule, SmsTrainingExample } from "@/lib/types";

const TEACHING_CACHE_TTL_MS = 60_000;

let runtimeTeachingCache:
  | {
      fetchedAt: number;
      rules: SmsLexiconRule[];
      examples: SmsTrainingExample[];
    }
  | null = null;

function hasAiAnalysisConfig() {
  return Boolean(process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY);
}

function sanitizeAdvice(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

async function loadRuntimeTeachingData() {
  if (
    runtimeTeachingCache &&
    Date.now() - runtimeTeachingCache.fetchedAt < TEACHING_CACHE_TTL_MS
  ) {
    return runtimeTeachingCache;
  }

  if (!isLiveMode) {
    runtimeTeachingCache = {
      fetchedAt: Date.now(),
      rules: mergeSystemSettings(null).smsLexiconRules,
      examples: demoSmsTrainingExamples,
    };

    return runtimeTeachingCache;
  }

  try {
    const db = getServerFirestore();
    const [settingsSnapshot, trainingSnapshot] = await Promise.all([
      db
        .collection(firebaseCollections.systemSettings)
        .doc(SYSTEM_SETTINGS_DOCUMENT_ID)
        .get(),
      db
        .collection(firebaseCollections.smsTrainingExamples)
        .orderBy("finalReview.reviewedAt", "desc")
        .limit(80)
        .get(),
    ]);

    const mergedSettings = mergeSystemSettings(
      settingsSnapshot.exists ? settingsSnapshot.data() : null
    );
    const examples = trainingSnapshot.docs.map(
      (item) => item.data() as SmsTrainingExample
    );

    runtimeTeachingCache = {
      fetchedAt: Date.now(),
      rules: mergedSettings.smsLexiconRules,
      examples,
    };

    return runtimeTeachingCache;
  } catch (error) {
    console.error(
      "Falling back to bundled teaching data because live teaching data could not be loaded.",
      error
    );

    runtimeTeachingCache = {
      fetchedAt: Date.now(),
      rules: mergeSystemSettings(null).smsLexiconRules,
      examples: demoSmsTrainingExamples,
    };

    return runtimeTeachingCache;
  }
}

export async function analyzeInboundSmsWithFallback(input: {
  message: string;
  farmerName?: string;
  knownFarmer?: boolean;
}): Promise<InboundSmsAnalysis> {
  const knownFarmer = Boolean(input.knownFarmer);
  const teachingData = await loadRuntimeTeachingData();
  const normalization = normalizeSmsMessage(input.message);
  const matchedLexiconRule = findBestMatchingLexiconRule(
    normalization.normalizedMessage,
    teachingData.rules
  );
  const fallback = analyzeInboundSms(
    normalization.normalizedMessage,
    input.farmerName ?? "magsasaka",
    knownFarmer,
    teachingData.rules
  );
  const teachingContext = buildLexiconTeachingContext(
    normalization.normalizedMessage,
    teachingData.rules
  );
  const reviewedExamplesContext = buildReviewedExamplesContext(
    normalization.normalizedMessage,
    teachingData.examples
  );

  if (!hasAiAnalysisConfig()) {
    return applyLexiconRuleToAnalysis(
      enhanceInboundAnalysisWithClarification({
        message: input.message,
        analysis: {
          ...fallback,
          detectedLanguage: normalization.detectedLanguage,
        },
        knownFarmer,
      }),
      matchedLexiconRule
    );
  }

  try {
    const output = await analyzeInboundSmsWithAi({
      message: input.message,
      normalizedMessage: normalization.normalizedMessage,
      detectedLanguage: normalization.detectedLanguage,
      farmerName: input.farmerName,
      knownFarmer: Boolean(input.knownFarmer),
      teachingContext: teachingContext || undefined,
      reviewedExamplesContext: reviewedExamplesContext || undefined,
    });

    return applyLexiconRuleToAnalysis(
      enhanceInboundAnalysisWithClarification({
        message: input.message,
        knownFarmer,
        analysis: {
          parsedIntent: output.parsedIntent,
          urgency: output.urgency,
          safetyFlag: output.safetyFlag,
          tone: output.tone,
          aiAdvice: ensureRespectfulSmsAdvice(
            sanitizeAdvice(output.aiAdvice, fallback.aiAdvice),
            normalization.detectedLanguage
          ),
          aiConfidence: Number.isFinite(output.aiConfidence)
            ? Math.max(0, Math.min(1, output.aiConfidence))
            : fallback.aiConfidence,
          analysisSource: "ai",
          detectedLanguage: normalization.detectedLanguage,
        },
      }),
      matchedLexiconRule
    );
  } catch (error) {
    console.error("AI inbound SMS analysis failed, using rule fallback.", error);
    return applyLexiconRuleToAnalysis(
      enhanceInboundAnalysisWithClarification({
        message: input.message,
        analysis: {
          ...fallback,
          analysisSource: "ai_fallback",
          detectedLanguage: normalization.detectedLanguage,
        },
        knownFarmer,
      }),
      matchedLexiconRule
    );
  }
}
