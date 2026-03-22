import { analyzeInboundSms, normalizePhone, type InboundSmsAnalysis } from "@/lib/sms-simulator";
import { getAutoReplyEligibleAt } from "@/lib/services/auto-reply-service";
import { buildCaseId, deriveInitialCaseStatus, getSlaDueAt } from "@/lib/services/sms-case-service";
import { enhanceInboundAnalysisWithClarification } from "@/lib/services/sms-clarification-service";
import { assessRegistrationMessage, buildRegistrationPrompt } from "@/lib/services/sms-registration-service";
import { defaultSystemSettings } from "@/lib/system-settings";
import type { Farmer, SmsMessage, SystemSettings } from "@/lib/types";

export type CreateInboundSmsInput = {
  phone: string;
  message: string;
  farmers: Farmer[];
  existingMessages?: SmsMessage[];
  analysis?: InboundSmsAnalysis;
  settings?: SystemSettings;
  timestamp?: string;
  id?: string;
  sourceProvider?: SmsMessage["sourceProvider"];
  externalId?: string;
};

export type CreatedInboundSms = {
  message: SmsMessage;
  matchedFarmerId?: string;
  newFarmer?: Farmer;
};

export function createInboundSmsRecord(input: CreateInboundSmsInput): CreatedInboundSms {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const settings = input.settings ?? defaultSystemSettings;
  const messageId = input.id ?? `SMS${Date.now()}`;
  const normalizedPhone = normalizePhone(input.phone);
  const existingMessages = input.existingMessages ?? [];
  const farmer = input.farmers.find((item) => normalizePhone(item.phone) === normalizedPhone);
  const activeRegistrationMessages = farmer
    ? []
    : existingMessages
        .filter((item) =>
          normalizePhone(item.phone) === normalizedPhone &&
          !item.closedAt &&
          (
            item.registrationRequired ||
            item.caseStatus === "awaiting_registration" ||
            (item.parsedIntent === "REGISTER" && item.caseId)
          )
        )
        .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
  const registrationDraftCaseId = activeRegistrationMessages[0]?.caseId;
  const hasOpenRegistrationDraft = activeRegistrationMessages.length > 0;
  const registrationFragments = activeRegistrationMessages
    .map((item) => item.message.replace(/^register\b/i, "").trim())
    .filter(Boolean);
  const currentRegistrationFragment = input.message.replace(/^register\b/i, "").trim();
  const compiledRegistrationMessage = hasOpenRegistrationDraft || /^register\b/i.test(input.message.trim())
    ? `REGISTER ${Array.from(new Set([
        ...registrationFragments,
        currentRegistrationFragment,
      ].filter(Boolean))).join(" ")}`.trim()
    : input.message;
  const registrationAssessment = farmer
    ? null
    : assessRegistrationMessage({
        message: compiledRegistrationMessage,
        phone: input.phone,
        timestamp,
      });
  const registrationCandidate = registrationAssessment?.farmer ?? null;
  const isRegistrationIntent = registrationAssessment?.isRegistrationMessage ?? hasOpenRegistrationDraft;
  const baseAnalysis =
    input.analysis ?? analyzeInboundSms(compiledRegistrationMessage, farmer?.name ?? registrationCandidate?.name ?? "magsasaka", !!farmer);
  const enhancedAnalysis = enhanceInboundAnalysisWithClarification({
    message: compiledRegistrationMessage,
    analysis: baseAnalysis,
    knownFarmer: Boolean(farmer),
  });
  const needsRegistrationDetails = !farmer && isRegistrationIntent && !registrationCandidate;
  const registrationRequired =
    !farmer && (!registrationCandidate && (baseAnalysis.parsedIntent !== "REGISTER" || needsRegistrationDetails));
  const analysis = needsRegistrationDetails
    ? {
        ...enhancedAnalysis,
        parsedIntent: "REGISTER" as const,
        clarificationNeeded: true,
        clarificationQuestion:
          registrationAssessment?.clarificationPrompt ??
          buildRegistrationPrompt(registrationAssessment?.missingFields, registrationAssessment?.detectedLanguage),
        aiAdvice:
          registrationAssessment?.clarificationPrompt ??
          buildRegistrationPrompt(registrationAssessment?.missingFields, registrationAssessment?.detectedLanguage),
      }
    : isRegistrationIntent && registrationCandidate
      ? {
          ...enhancedAnalysis,
          parsedIntent: "REGISTER" as const,
          clarificationNeeded: false,
          clarificationQuestion: undefined,
        }
      : enhancedAnalysis;
  const effectiveFarmerId = farmer?.id ?? registrationCandidate?.id ?? `UNKNOWN-${Date.now()}`;
  const effectiveFarmerName = farmer?.name ?? registrationCandidate?.name ?? "Hindi pa nakilalang magsasaka";
  const caseId = registrationDraftCaseId ?? buildCaseId({
    farmerId: farmer?.id ?? registrationCandidate?.id,
    normalizedPhone,
    fallbackId: messageId,
  });
  const caseStatus = deriveInitialCaseStatus({
    clarificationNeeded: analysis.clarificationNeeded,
    registrationRequired,
  });
  const aiAdvice =
    registrationRequired
      ? registrationAssessment?.clarificationPrompt ??
        buildRegistrationPrompt(registrationAssessment?.missingFields, registrationAssessment?.detectedLanguage)
      : analysis.aiAdvice;

  return {
    matchedFarmerId: farmer?.id ?? registrationCandidate?.id,
    newFarmer: registrationCandidate ?? undefined,
    message: {
      id: messageId,
      farmerId: effectiveFarmerId,
      farmerName: effectiveFarmerName,
      phone: input.phone,
      message: input.message,
      timestamp,
      sourceProvider: input.sourceProvider ?? "demo",
      externalId: input.externalId,
      caseId,
      caseStatus,
      registrationRequired,
      slaDueAt: getSlaDueAt(timestamp, analysis.urgency),
      autoReplyEligibleAt: getAutoReplyEligibleAt(timestamp, settings),
      analysisSource: analysis.analysisSource ?? "rules",
      detectedLanguage: analysis.detectedLanguage,
      clarificationNeeded: analysis.clarificationNeeded,
      clarificationQuestion: analysis.clarificationQuestion,
      parsedIntent: analysis.parsedIntent,
      urgency: analysis.urgency,
      status: "pending_approval",
      aiAdvice,
      aiConfidence: analysis.aiConfidence,
      safetyFlag: analysis.safetyFlag,
      tone: analysis.tone,
    },
  };
}
