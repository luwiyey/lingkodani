import type {
  SafetyFlag,
  SmsAnalysisSource,
  SmsMessage,
  SmsMessageStatus,
  SmsReviewAction,
  SmsTrainingExample,
  SmsIntent,
} from "@/lib/types";
import { normalizePhone } from "@/lib/sms-simulator";

export type ImportedSmsTrainingCandidate = {
  farmerName: string;
  phone: string;
  message: string;
  analysisSource: SmsAnalysisSource;
  originalIntent: SmsIntent;
  originalUrgency: SmsMessage["urgency"];
  originalSafetyFlag: SafetyFlag;
  originalTone?: SmsMessage["tone"];
  originalAdvice: string;
  originalConfidence: number;
  reviewAction: SmsReviewAction;
  finalStatus: SmsMessageStatus;
  finalIntent: SmsIntent;
  finalUrgency: SmsMessage["urgency"];
  finalSafetyFlag: SafetyFlag;
  finalTone?: SmsMessage["tone"];
  finalAdvice: string;
  reviewedBy?: string;
  reviewedAt?: string;
};

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return 0.55;
  }

  return Math.min(1, Math.max(0, value));
}

function normalizeImportedPhone(value: string, index: number) {
  const normalized = normalizePhone(value);
  return normalized || `Imported-${index + 1}`;
}

function normalizeImportedName(value: string, index: number) {
  return value.trim() || `Imported Example ${index + 1}`;
}

export function buildImportedSmsTrainingExamples(
  examples: ImportedSmsTrainingCandidate[],
  sourceLabel: string
): SmsTrainingExample[] {
  const importedAt = new Date().toISOString();
  const sourceReviewer = `Imported from ${sourceLabel}`;

  return examples
    .filter((example) => example.message.trim().length > 0)
    .map((example, index) => {
      const suffix = `${Date.now()}-${index}`;
      const farmerName = normalizeImportedName(example.farmerName, index);
      const phone = normalizeImportedPhone(example.phone, index);
      const reviewedAt = example.reviewedAt?.trim() || importedAt;
      const originalAdvice = example.originalAdvice.trim() || "Imported training example.";
      const finalAdvice = example.finalAdvice.trim() || originalAdvice;

      return {
        id: `TRAIN-IMPORT-${suffix}`,
        smsMessageId: `SMS-IMPORT-${suffix}`,
        farmerId: `FARM-IMPORT-${suffix}`,
        farmerName,
        phone,
        message: example.message.trim(),
        inboundTimestamp: importedAt,
        analysisSource: example.analysisSource || "rules",
        originalAnalysis: {
          parsedIntent: example.originalIntent,
          urgency: example.originalUrgency,
          safetyFlag: example.originalSafetyFlag,
          tone: example.originalTone,
          aiAdvice: originalAdvice,
          aiConfidence: clampConfidence(example.originalConfidence),
        },
        finalReview: {
          action: example.reviewAction,
          status: example.finalStatus,
          finalAdvice,
          finalAnalysis: {
            parsedIntent: example.finalIntent,
            urgency: example.finalUrgency,
            safetyFlag: example.finalSafetyFlag,
            tone: example.finalTone,
          },
          reviewedBy: example.reviewedBy?.trim() || sourceReviewer,
          reviewedAt,
          wasAdviceEdited: originalAdvice !== finalAdvice,
        },
        reviewStatus: "needs_review",
        reviewNotes: "Imported dataset. Hintayin munang ma-review bago gamitin bilang live precedent.",
        sourceLabel,
        importedAt,
      } satisfies SmsTrainingExample;
    });
}
