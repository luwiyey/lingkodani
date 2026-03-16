import { analyzeInboundSms, normalizePhone, type InboundSmsAnalysis } from "@/lib/sms-simulator";
import { getAutoReplyEligibleAt } from "@/lib/services/auto-reply-service";
import { buildCaseId, deriveInitialCaseStatus, getSlaDueAt } from "@/lib/services/sms-case-service";
import { enhanceInboundAnalysisWithClarification } from "@/lib/services/sms-clarification-service";
import { buildRegistrationPrompt, extractRegistrationFarmer } from "@/lib/services/sms-registration-service";
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
  const normalizedPhone = normalizePhone(input.phone);
  const farmer = input.farmers.find((item) => normalizePhone(item.phone) === normalizedPhone);
  const registrationCandidate = farmer
    ? null
    : extractRegistrationFarmer({
        message: input.message,
        phone: input.phone,
        timestamp,
      });
  const baseAnalysis =
    input.analysis ?? analyzeInboundSms(input.message, farmer?.name ?? registrationCandidate?.name ?? "magsasaka", !!farmer);
  const analysis = enhanceInboundAnalysisWithClarification({
    message: input.message,
    analysis: baseAnalysis,
    knownFarmer: Boolean(farmer),
  });
  const registrationRequired = !farmer && !registrationCandidate && analysis.parsedIntent !== "REGISTER";
  const effectiveFarmerId = farmer?.id ?? registrationCandidate?.id ?? `UNKNOWN-${Date.now()}`;
  const effectiveFarmerName = farmer?.name ?? registrationCandidate?.name ?? "Hindi pa nakilalang magsasaka";
  const caseId = buildCaseId({
    farmerId: farmer?.id ?? registrationCandidate?.id,
    normalizedPhone,
  });
  const caseStatus = deriveInitialCaseStatus({
    clarificationNeeded: analysis.clarificationNeeded,
    registrationRequired,
  });
  const aiAdvice = registrationRequired ? buildRegistrationPrompt() : analysis.aiAdvice;

  return {
    matchedFarmerId: farmer?.id ?? registrationCandidate?.id,
    newFarmer: registrationCandidate ?? undefined,
    message: {
      id: input.id ?? `SMS${Date.now()}`,
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
