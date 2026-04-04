import { analyzeInboundSms, normalizePhone, type InboundSmsAnalysis } from "@/lib/sms-simulator";
import { normalizeSmsMessage } from "@/lib/sms-normalization";
import { getAutoReplyEligibleAt } from "@/lib/services/auto-reply-service";
import { buildCaseId, deriveInitialCaseStatus, getSlaDueAt } from "@/lib/services/sms-case-service";
import { enhanceInboundAnalysisWithClarification } from "@/lib/services/sms-clarification-service";
import { assessRegistrationMessage, buildRegistrationPrompt } from "@/lib/services/sms-registration-service";
import { buildSmsTriageAssessment } from "@/lib/services/sms-triage-service";
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

const THREAD_CROP_HINTS = [
  "palay",
  "mais",
  "kamatis",
  "talong",
  "sitaw",
  "sibuyas",
  "gulay",
  "okra",
  "sili",
  "tubo",
  "tabako",
  "monggo",
  "ampalaya",
];

const THREAD_SYMPTOM_HINTS = [
  "uod",
  "peste",
  "sakit",
  "dilaw",
  "leafminer",
  "borer",
  "baha",
  "ulan",
  "tubig",
  "daga",
  "kuhol",
  "insekto",
  "damage",
  "spot",
  "brown",
];

const THREAD_WEATHER_HINTS = [
  "baha",
  "ulan",
  "tubig",
  "patubig",
  "flood",
  "rain",
  "danum",
];

const THREAD_NEW_CASE_HINTS = [
  "bagong problema",
  "iba naman",
  "another issue",
  "new problem",
  "panibagong",
];

type UnknownConcernThreadMatch = {
  caseId: string;
  confidence: number;
  reason: string;
};

type UnknownConcernThreadCandidate = {
  item: SmsMessage;
  score: number;
  reason: string;
};

function getSharedTokens(left: Set<string>, right: Set<string>) {
  return [...left].filter((token) => right.has(token));
}

function buildThreadSignature(message: string) {
  const normalization = normalizeSmsMessage(message);
  const originalNormalized = normalization.originalMessage.toLowerCase();
  const normalizedText = normalization.normalizedMessage.toLowerCase();
  const normalizedTokens = normalization.normalizedMessage.split(/\s+/).filter(Boolean);
  const originalTokens = originalNormalized.split(/\s+/).filter(Boolean);
  const tokenSet = new Set([...originalTokens, ...normalizedTokens]);
  const crops = new Set(THREAD_CROP_HINTS.filter((hint) => tokenSet.has(hint)));
  const symptoms = new Set(THREAD_SYMPTOM_HINTS.filter((hint) => tokenSet.has(hint)));
  const weatherSignals = new Set(THREAD_WEATHER_HINTS.filter((hint) => tokenSet.has(hint)));
  const locations = new Set(
    [...originalNormalized.matchAll(/\b(?:zone|sitio|barangay)\s*[a-z0-9-]+\b/gi)].map(
      (match) => match[0].toLowerCase()
    )
  );
  const multiConcernDetected =
    (crops.size >= 2 && /\b(?:pero|samantala|kabilang lote|bukod pa|also|another|iba naman)\b/i.test(normalizedText)) ||
    (symptoms.size > 0 &&
      weatherSignals.size > 0 &&
      /\b(?:pero|samantala|habang|kabilang lote|bukod pa|also)\b/i.test(normalizedText));

  return {
    crops,
    symptoms,
    weatherSignals,
    locations,
    shortReply: originalTokens.length > 0 && originalTokens.length <= 6,
    looksLikePromptAnswer:
      originalTokens.length > 0 &&
      originalTokens.length <= 8 &&
      !/[?.!]/.test(originalNormalized) &&
      !THREAD_NEW_CASE_HINTS.some((hint) => originalNormalized.includes(hint)),
    startsNewCase: THREAD_NEW_CASE_HINTS.some((hint) => originalNormalized.includes(hint)),
    multiConcernDetected,
    multiConcernReason: multiConcernDetected
      ? "Mukhang may hiwalay na concern o ibang lote/pananim sa parehong mensahe."
      : undefined,
  };
}

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

function getUnknownConcernThreadCandidates(input: {
  existingMessages: SmsMessage[];
  normalizedPhone: string;
  parsedIntent: SmsMessage["parsedIntent"];
  timestamp: string;
  message: string;
}): UnknownConcernThreadCandidate[] {
  const currentSignature = buildThreadSignature(input.message);

  if (
    input.parsedIntent === "REGISTER" ||
    (input.parsedIntent === "UNKNOWN" && !currentSignature.looksLikePromptAnswer)
  ) {
    return [];
  }

  const currentTime = new Date(input.timestamp).getTime();

  return input.existingMessages
    .filter((item) => normalizePhone(item.phone) === input.normalizedPhone)
    .filter((item) => !item.closedAt)
    .filter((item) => !item.registrationRequired)
    .filter((item) => Boolean(item.caseId))
    .filter((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      const hoursApart = Math.abs(currentTime - itemTime) / (1000 * 60 * 60);
      return hoursApart <= 18;
    })
    .map((item) => {
      const itemTime = new Date(item.timestamp).getTime();
      const hoursApart = Math.abs(currentTime - itemTime) / (1000 * 60 * 60);
      const candidateSignature = buildThreadSignature(item.message);
      const sharedCrops = getSharedTokens(currentSignature.crops, candidateSignature.crops);
      const sharedSymptoms = getSharedTokens(currentSignature.symptoms, candidateSignature.symptoms);
      const sharedWeatherSignals = getSharedTokens(currentSignature.weatherSignals, candidateSignature.weatherSignals);
      const sharedLocations = getSharedTokens(currentSignature.locations, candidateSignature.locations);
      const reasons: string[] = [];
      let score = 0;

      if (item.parsedIntent === input.parsedIntent) {
        score += 0.42;
        reasons.push("parehong intent");
      }

      if (
        currentSignature.looksLikePromptAnswer &&
        (item.clarificationNeeded || item.identityDetailsNeeded || item.caseStatus === "awaiting_clarification")
      ) {
        score += 0.46;
        reasons.push("mukhang sagot sa naunang prompt");
      }

      if (sharedCrops.length > 0) {
        score += 0.18;
        reasons.push(`parehong pananim: ${sharedCrops.join(", ")}`);
      } else if (currentSignature.crops.size > 0 && candidateSignature.crops.size > 0) {
        score -= 0.34;
        reasons.push("magkaibang pananim");
      }

      if (sharedSymptoms.length > 0) {
        score += 0.16;
        reasons.push(`parehong sintomas: ${sharedSymptoms.join(", ")}`);
      } else if (currentSignature.symptoms.size > 0 && candidateSignature.symptoms.size > 0) {
        score -= 0.12;
      }

      if (sharedWeatherSignals.length > 0) {
        score += 0.14;
        reasons.push(`parehong weather/water cues: ${sharedWeatherSignals.join(", ")}`);
      }

      if (sharedLocations.length > 0) {
        score += 0.12;
        reasons.push(`parehong lokasyon: ${sharedLocations.join(", ")}`);
      }

      if (hoursApart <= 4) {
        score += 0.08;
      } else if (hoursApart > 12) {
        score -= 0.08;
      }

      if (currentSignature.startsNewCase) {
        score -= 0.4;
      }

      if (currentSignature.multiConcernDetected) {
        score -= 0.2;
      }

      return {
        item,
        score,
        reason:
          reasons.length > 0
            ? `Ipinagpatuloy ang case dahil sa ${reasons.join("; ")}.`
            : "Ipinagpatuloy ang case dahil sa pinakamalapit na naunang thread.",
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return new Date(right.item.timestamp).getTime() - new Date(left.item.timestamp).getTime();
    });
}

function findContinuableUnknownConcernCase(input: {
  existingMessages: SmsMessage[];
  normalizedPhone: string;
  parsedIntent: SmsMessage["parsedIntent"];
  timestamp: string;
  message: string;
}): UnknownConcernThreadMatch | undefined {
  const scoredCandidates = getUnknownConcernThreadCandidates(input);

  const bestCandidate = scoredCandidates[0];
  const secondCandidate = scoredCandidates[1];

  if (!bestCandidate) {
    return undefined;
  }

  const threshold =
    bestCandidate.item.clarificationNeeded || bestCandidate.item.identityDetailsNeeded
      ? 0.48
      : 0.56;

  if (bestCandidate.score < threshold) {
    return undefined;
  }

  if (
    secondCandidate &&
    secondCandidate.score >= threshold &&
    Math.abs(bestCandidate.score - secondCandidate.score) < 0.08
  ) {
    return undefined;
  }

  return {
    caseId: bestCandidate.item.caseId!,
    confidence: Number(bestCandidate.score.toFixed(2)),
    reason: bestCandidate.reason,
  };
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
  const triageAssessment =
    isRegistrationIntent
      ? null
      : buildSmsTriageAssessment({
          message: compiledRegistrationMessage,
          analysis,
          knownFarmer: Boolean(farmer || registrationCandidate),
        });
  const identityDetailsNeeded =
    !farmer &&
    !registrationCandidate &&
    analysis.parsedIntent !== "REGISTER";
  const identityPrompt = identityDetailsNeeded
    ? buildUnknownSenderIdentityPrompt(analysis.detectedLanguage)
    : undefined;
  const effectiveFarmerId = farmer?.id ?? registrationCandidate?.id ?? `UNKNOWN-${Date.now()}`;
  const effectiveFarmerName = farmer?.name ?? registrationCandidate?.name ?? "Hindi pa nakilalang magsasaka";
  const continuingUnknownConcernMatch =
    !farmer && !registrationCandidate && !shouldContinueRegistrationDraft
      ? findContinuableUnknownConcernCase({
          existingMessages,
          normalizedPhone,
          parsedIntent: analysis.parsedIntent,
          timestamp,
          message: input.message,
        })
      : undefined;
  const threadReviewCandidate =
    !farmer && !registrationCandidate && !shouldContinueRegistrationDraft
      ? getUnknownConcernThreadCandidates({
          existingMessages,
          normalizedPhone,
          parsedIntent: analysis.parsedIntent,
          timestamp,
          message: input.message,
        })[0]
      : undefined;
  const effectiveUrgency = triageAssessment?.recommendedUrgency ?? analysis.urgency;
  const effectiveClarificationNeeded = registrationRequired
    ? true
    : triageAssessment?.clarificationNeeded ?? analysis.clarificationNeeded;
  const effectiveClarificationQuestion = registrationRequired
    ? registrationAssessment?.clarificationPrompt ??
      buildRegistrationPrompt(registrationAssessment?.missingFields, registrationAssessment?.detectedLanguage)
    : triageAssessment?.clarificationQuestion ?? analysis.clarificationQuestion;
  const caseId = (shouldContinueRegistrationDraft ? registrationDraftCaseId : undefined) ?? continuingUnknownConcernMatch?.caseId ?? buildCaseId({
    farmerId: farmer?.id ?? registrationCandidate?.id,
    normalizedPhone: "",
    fallbackId: messageId,
  });
  const caseStatus = deriveInitialCaseStatus({
    clarificationNeeded: effectiveClarificationNeeded,
    registrationRequired,
  });
  const aiAdvice =
    registrationRequired
      ? registrationAssessment?.clarificationPrompt ??
        buildRegistrationPrompt(registrationAssessment?.missingFields, registrationAssessment?.detectedLanguage)
      : effectiveClarificationNeeded
        ? effectiveClarificationQuestion ?? analysis.aiAdvice
        : appendIdentityPrompt(analysis.aiAdvice, identityPrompt);
  const normalization = normalizeSmsMessage(input.message);
  const possibleDuplicateThread =
    !continuingUnknownConcernMatch &&
    threadReviewCandidate &&
    threadReviewCandidate.item.caseId &&
    (threadReviewCandidate.score >= 0.32 || triageAssessment?.multiConcernDetected)
      ? threadReviewCandidate
      : undefined;

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
      threadConfidence: shouldContinueRegistrationDraft ? 1 : continuingUnknownConcernMatch?.confidence,
      threadReason:
        shouldContinueRegistrationDraft
          ? "Ipinagpatuloy ang kasalukuyang registration draft mula sa parehong sender."
          : continuingUnknownConcernMatch?.reason,
      threadReviewStatus: possibleDuplicateThread ? "pending" : undefined,
      possibleDuplicateOfCaseId:
        possibleDuplicateThread && possibleDuplicateThread.item.caseId !== caseId
          ? possibleDuplicateThread.item.caseId
          : undefined,
      possibleDuplicateReason:
        possibleDuplicateThread && possibleDuplicateThread.item.caseId !== caseId
          ? triageAssessment?.multiConcernDetected
            ? triageAssessment.multiConcernReason ??
              `May naunang bukas na case (${possibleDuplicateThread.item.caseId}) mula sa parehong sender.`
            : possibleDuplicateThread.reason
          : undefined,
      caseStatus,
      registrationRequired,
      identityDetailsNeeded,
      identityPrompt,
      slaDueAt: getSlaDueAt(timestamp, effectiveUrgency),
      autoReplyEligibleAt: getAutoReplyEligibleAt(timestamp, settings),
      analysisSource: analysis.analysisSource ?? "rules",
      detectedLanguage: analysis.detectedLanguage,
      normalizationMatches: normalization.matches,
      normalizationTokens: normalization.tokens,
      normalizationUnknownTokens: normalization.unknownTokens,
      clarificationNeeded: effectiveClarificationNeeded,
      clarificationQuestion: effectiveClarificationQuestion,
      candidateIntents: triageAssessment?.candidateIntents,
      sentiment: triageAssessment?.sentiment,
      cropStage: triageAssessment?.cropStage,
      triageConfidence: triageAssessment?.triageConfidence ?? analysis.aiConfidence,
      triageUncertainty: triageAssessment?.uncertainty,
      triageMissingFields: triageAssessment?.missingFields,
      triageNextQuestion: triageAssessment?.nextQuestion,
      multiConcernDetected: triageAssessment?.multiConcernDetected,
      multiConcernReason: triageAssessment?.multiConcernReason,
      parsedIntent: analysis.parsedIntent,
      urgency: effectiveUrgency,
      status: "pending_approval",
      aiAdvice,
      aiConfidence: analysis.aiConfidence,
      safetyFlag: analysis.safetyFlag,
      tone: analysis.tone,
    },
  };
}
