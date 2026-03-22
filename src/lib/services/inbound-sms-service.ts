import { analyzeInboundSms, normalizePhone, type InboundSmsAnalysis } from "@/lib/sms-simulator";
import { getAutoReplyEligibleAt } from "@/lib/services/auto-reply-service";
import { buildCaseId, deriveInitialCaseStatus, getSlaDueAt } from "@/lib/services/sms-case-service";
import { enhanceInboundAnalysisWithClarification } from "@/lib/services/sms-clarification-service";
import { assessRegistrationMessage, buildRegistrationPrompt } from "@/lib/services/sms-registration-service";
import { defaultSystemSettings } from "@/lib/system-settings";
import type { Farmer, SmsDetectedLanguage, SmsMessage, SystemSettings } from "@/lib/types";

const REGISTRATION_FIELD_HINTS = [
  "zone",
  "sitio",
  "barangay",
  "lalaki",
  "babae",
  "male",
  "female",
  "palay",
  "mais",
  "kamatis",
  "gulay",
  "sibuyas",
  "talong",
  "monggo",
  "saging",
];

const NON_REGISTRATION_CONCERN_HINTS = [
  "peste",
  "uod",
  "sakit",
  "baha",
  "ulan",
  "bagyo",
  "presyo",
  "price",
  "hiram",
  "tractor",
  "sprayer",
  "pataba",
  "abono",
  "tubig",
  "emergency",
  "help",
  "tulong",
];

function looksLikeRegistrationFollowUp(message: string) {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  if (/^register\b/.test(normalized)) {
    return true;
  }

  if (NON_REGISTRATION_CONCERN_HINTS.some((hint) => normalized.includes(hint))) {
    return false;
  }

  if (/\?/.test(normalized)) {
    return false;
  }

  if (REGISTRATION_FIELD_HINTS.some((hint) => normalized.includes(hint))) {
    return true;
  }

  if (/\b\d+(\.\d+)?\s*ha\b/.test(normalized) || /\b\d{2}\b/.test(normalized)) {
    return true;
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);

  return tokens.length > 0 && tokens.length <= 5;
}

function buildUnknownSenderIdentityPrompt(detectedLanguage: SmsDetectedLanguage = "Filipino") {
  if (detectedLanguage === "English") {
    return "Please also send your full name and sitio or barangay so we can match and follow up your concern properly.";
  }

  return "Pakisend din po ang inyong buong pangalan at sitio o barangay upang maitugma po namin ang inyong concern at ma-follow up po namin ito nang maayos.";
}

function appendIdentityPrompt(body: string, identityPrompt?: string) {
  const trimmedBody = body.trim();
  const trimmedPrompt = identityPrompt?.trim();

  if (!trimmedPrompt) {
    return trimmedBody;
  }

  if (!trimmedBody) {
    return trimmedPrompt;
  }

  if (trimmedBody.includes(trimmedPrompt)) {
    return trimmedBody;
  }

  return `${trimmedBody} ${trimmedPrompt}`.trim();
}

function findContinuableUnknownConcernCaseId(input: {
  existingMessages: SmsMessage[];
  normalizedPhone: string;
  parsedIntent: SmsMessage["parsedIntent"];
  timestamp: string;
}) {
  if (input.parsedIntent === "REGISTER" || input.parsedIntent === "UNKNOWN") {
    return undefined;
  }

  const currentTime = new Date(input.timestamp).getTime();

  const candidate = input.existingMessages
    .filter((item) => normalizePhone(item.phone) === input.normalizedPhone)
    .filter((item) => !item.closedAt)
    .filter((item) => !item.registrationRequired)
    .filter((item) => item.parsedIntent === input.parsedIntent)
    .filter((item) => Boolean(item.caseId))
    .filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      const hoursApart = Math.abs(currentTime - itemTime) / (1000 * 60 * 60);
      return hoursApart <= 12;
    })
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())[0];

  return candidate?.caseId;
}

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
  const shouldContinueRegistrationDraft =
    hasOpenRegistrationDraft && looksLikeRegistrationFollowUp(input.message);
  const registrationFragments = activeRegistrationMessages
    .map((item) => item.message.replace(/^register\b/i, "").trim())
    .filter(Boolean);
  const currentRegistrationFragment = input.message.replace(/^register\b/i, "").trim();
  const compiledRegistrationMessage = shouldContinueRegistrationDraft || /^register\b/i.test(input.message.trim())
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
  const isRegistrationIntent = registrationAssessment?.isRegistrationMessage ?? shouldContinueRegistrationDraft;
  const baseAnalysis =
    input.analysis ?? analyzeInboundSms(compiledRegistrationMessage, farmer?.name ?? registrationCandidate?.name ?? "magsasaka", !!farmer);
  const enhancedAnalysis = enhanceInboundAnalysisWithClarification({
    message: compiledRegistrationMessage,
    analysis: baseAnalysis,
    knownFarmer: Boolean(farmer),
  });
  const needsRegistrationDetails = !farmer && isRegistrationIntent && !registrationCandidate;
  const registrationRequired = !farmer && isRegistrationIntent && !registrationCandidate;
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
  const identityDetailsNeeded =
    !farmer &&
    !registrationCandidate &&
    analysis.parsedIntent !== "REGISTER";
  const identityPrompt = identityDetailsNeeded
    ? buildUnknownSenderIdentityPrompt(analysis.detectedLanguage)
    : undefined;
  const effectiveFarmerId = farmer?.id ?? registrationCandidate?.id ?? `UNKNOWN-${Date.now()}`;
  const effectiveFarmerName = farmer?.name ?? registrationCandidate?.name ?? "Hindi pa nakilalang magsasaka";
  const continuingUnknownConcernCaseId =
    !farmer && !registrationCandidate && !shouldContinueRegistrationDraft
      ? findContinuableUnknownConcernCaseId({
          existingMessages,
          normalizedPhone,
          parsedIntent: analysis.parsedIntent,
          timestamp,
        })
      : undefined;
  const caseId = (shouldContinueRegistrationDraft ? registrationDraftCaseId : undefined) ?? continuingUnknownConcernCaseId ?? buildCaseId({
    farmerId: farmer?.id ?? registrationCandidate?.id,
    normalizedPhone: "",
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
      : analysis.clarificationNeeded
        ? analysis.aiAdvice
        : appendIdentityPrompt(analysis.aiAdvice, identityPrompt);

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
      identityDetailsNeeded,
      identityPrompt,
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
