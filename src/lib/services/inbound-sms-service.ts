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
  const farmer = input.farmers.find((item) => normalizePhone(item.phone) === normalizedPhone);
  const registrationAssessment = farmer
    ? null
    : assessRegistrationMessage({
        message: input.message,
        phone: input.phone,
        timestamp,
      });
  const registrationCandidate = registrationAssessment?.farmer ?? null;
  const isRegistrationIntent = registrationAssessment?.isRegistrationMessage ?? false;
  const baseAnalysis =
    input.analysis ?? analyzeInboundSms(input.message, farmer?.name ?? registrationCandidate?.name ?? "magsasaka", !!farmer);
  const enhancedAnalysis = enhanceInboundAnalysisWithClarification({
    message: input.message,
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
          buildRegistrationPrompt(registrationAssessment?.missingFields),
        aiAdvice:
          registrationAssessment?.clarificationPrompt ??
          buildRegistrationPrompt(registrationAssessment?.missingFields),
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
  const caseId = buildCaseId({
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
        buildRegistrationPrompt(registrationAssessment?.missingFields)
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
