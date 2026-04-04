import type { InboundSmsAnalysis } from "@/lib/sms-simulator";
import { normalizeSmsMessage } from "@/lib/sms-normalization";
import {
  CLARIFICATION_CONFIDENCE_THRESHOLD,
  getClarificationDecision,
  getIntentSignals,
} from "@/lib/services/sms-clarification-service";
import type {
  SmsCropStage,
  SmsIntent,
  SmsSentiment,
  SmsTriageField,
  SmsTriageUncertainty,
  SmsUrgency,
} from "@/lib/types";

export type SmsTriageAssessment = {
  triageConfidence: number;
  uncertainty: SmsTriageUncertainty;
  missingFields: SmsTriageField[];
  nextQuestion?: string;
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
  sentiment: SmsSentiment;
  cropStage: SmsCropStage;
  candidateIntents: SmsIntent[];
  multiConcernDetected: boolean;
  multiConcernReason?: string;
  recommendedUrgency?: SmsUrgency;
};

const CROP_HINTS = [
  "palay",
  "mais",
  "kamatis",
  "talong",
  "sitaw",
  "okra",
  "sili",
  "gulay",
  "monggo",
  "ampalaya",
];

const SYMPTOM_HINTS = [
  "uod",
  "peste",
  "sakit",
  "dilaw",
  "naninilaw",
  "nalalanta",
  "spot",
  "brown",
  "kuhol",
  "daga",
  "insekto",
  "lubog",
  "baha",
  "tuyo",
];

const STAGE_KEYWORDS: Record<SmsCropStage, string[]> = {
  seedling: ["punla", "seedling", "bagong tanim", "newly planted"],
  vegetative: ["lumalaki", "vegetative", "growing", "lumalago"],
  flowering: ["namumulaklak", "flowering", "may bulaklak", "booting"],
  fruiting: ["may bunga", "fruiting", "nagbubunga"],
  pre_harvest: ["malapit anihin", "pre-harvest", "malapit na anihin", "heading"],
  harvest_ready: ["aani na", "ready anihin", "ready to harvest", "hinog"],
  unknown: [],
};

const LOCATION_PATTERN = /\b(?:zone|sitio|barangay)\s*[a-z0-9-]+\b/i;
const SEVERITY_PATTERNS = [
  /\b\d+\s*(?:percent|%|ha|ektarya|hectare|puno|halaman)\b/i,
  /\b(?:halos lahat|buong bukid|kalahati|marami|lumalala|mabilis kumalat|fast spread|wide area)\b/i,
];
const TIMING_PATTERNS = [
  /\b(?:kanina|ngayon|kahapon|this morning|today|yesterday|ilang araw)\b/i,
  /\b\d+\s*(?:araw|day|oras|hours?)\b/i,
];
const FRUSTRATION_KEYWORDS = [
  "ilang beses",
  "paulit ulit",
  "paulit-ulit",
  "wala pa rin",
  "hindi pa rin",
  "wala parin",
  "tagal",
  "urgent na",
  "sana naman",
  "please respond",
  "frustrated",
];
const DISTRESS_KEYWORDS = [
  "tulong",
  "help",
  "emergency",
  "kagyat",
  "critical",
  "delikado",
  "nakakaalarma",
  "masisira",
  "malulugi",
];
const MULTI_CONCERN_CONNECTORS = ["pero", "samantala", "kabilang lote", "bukod pa", "also", "another", "iba naman"];

function includesAny(message: string, values: string[]) {
  return values.some((value) => message.includes(value));
}

function detectCropStage(normalizedMessage: string) {
  const entry = (Object.entries(STAGE_KEYWORDS) as Array<[SmsCropStage, string[]]>).find(([, keywords]) =>
    includesAny(normalizedMessage, keywords)
  );

  return entry?.[0] ?? "unknown";
}

function detectSentiment(normalizedMessage: string, urgency: SmsUrgency): SmsSentiment {
  if (includesAny(normalizedMessage, DISTRESS_KEYWORDS) || urgency === "high") {
    return "distressed";
  }

  if (includesAny(normalizedMessage, FRUSTRATION_KEYWORDS)) {
    return "frustrated";
  }

  if (/\b(?:po|please|pwede|paano|maari|maaari)\b/i.test(normalizedMessage)) {
    return "concerned";
  }

  return "neutral";
}

function detectMissingFields(input: {
  normalizedMessage: string;
  parsedIntent: SmsIntent;
  knownFarmer: boolean;
  cropStage: SmsCropStage;
  urgency: SmsUrgency;
  sentiment: SmsSentiment;
}) {
  const lower = input.normalizedMessage;
  const hasCrop = CROP_HINTS.some((crop) => lower.includes(crop));
  const hasSymptom = SYMPTOM_HINTS.some((symptom) => lower.includes(symptom));
  const hasLocation = LOCATION_PATTERN.test(lower) || /\bdito\b|\bdoon\b|\bbukid\b/i.test(lower);
  const hasSeverity = SEVERITY_PATTERNS.some((pattern) => pattern.test(lower));
  const hasTiming = TIMING_PATTERNS.some((pattern) => pattern.test(lower));
  const hasResource = /\b(?:tractor|sprayer|pataba|abono|binhi|seed|supply|kagamitan)\b/i.test(lower);
  const missingFields: SmsTriageField[] = [];

  if (input.parsedIntent === "PEST_DISEASE" || input.parsedIntent === "WEATHER_HELP" || input.parsedIntent === "CROP_UPDATE") {
    if (!hasCrop) {
      missingFields.push("crop");
    }
    if (!hasLocation) {
      missingFields.push("location");
    }
  }

  if (input.parsedIntent === "PEST_DISEASE") {
    if (!hasSymptom) {
      missingFields.push("symptom");
    }
    if (
      !hasSeverity &&
      (
        input.urgency === "high" ||
        input.sentiment === "frustrated" ||
        input.sentiment === "distressed" ||
        input.cropStage === "flowering" ||
        input.cropStage === "pre_harvest" ||
        input.cropStage === "harvest_ready"
      )
    ) {
      missingFields.push("severity");
    }
    if (hasCrop && input.cropStage === "unknown" && input.urgency === "high") {
      missingFields.push("crop_stage");
    }
  }

  if (input.parsedIntent === "WEATHER_HELP") {
    if (!hasSeverity) {
      missingFields.push("severity");
    }
    if (hasCrop && input.cropStage === "unknown" && input.urgency === "high") {
      missingFields.push("crop_stage");
    }
  }

  if (input.parsedIntent === "REQUEST") {
    if (!hasResource) {
      missingFields.push("resource");
    }
    if (!hasTiming) {
      missingFields.push("timing");
    }
    if (!hasLocation) {
      missingFields.push("location");
    }
  }

  if (input.parsedIntent === "HARVEST") {
    if (!hasCrop) {
      missingFields.push("crop");
    }
    if (!hasLocation) {
      missingFields.push("location");
    }
  }

  if (input.parsedIntent === "UNKNOWN") {
    if (!hasCrop) {
      missingFields.push("crop");
    }
    if (!hasLocation) {
      missingFields.push("location");
    }
    if (!hasSymptom) {
      missingFields.push("symptom");
    }
  }

  if (!input.knownFarmer) {
    missingFields.push("identity");
  }

  return Array.from(new Set(missingFields));
}

function buildSeverityPrompt(detectedLanguage: InboundSmsAnalysis["detectedLanguage"] = "Filipino") {
  if (detectedLanguage === "English") {
    return "How large is the affected area now: a few plants, half of the field, or almost all of it? Please also say when the problem started.";
  }

  return "Gaano po kalawak ang apektado ngayon: iilang tanim lang, kalahati ng bukid, o halos lahat? Pakisabi rin po kung kailan ito nagsimula.";
}

function buildStagePrompt(detectedLanguage: InboundSmsAnalysis["detectedLanguage"] = "Filipino") {
  if (detectedLanguage === "English") {
    return "What stage is the crop in now: seedling, growing, flowering, or near harvest?";
  }

  return "Ano na po ang yugto ng pananim ngayon: punla, lumalago, namumulaklak, o malapit nang anihin?";
}

function buildLocationPrompt(detectedLanguage: InboundSmsAnalysis["detectedLanguage"] = "Filipino") {
  if (detectedLanguage === "English") {
    return "Which zone, sitio, or barangay is affected so we can route the case correctly?";
  }

  return "Saang zone, sitio, o barangay po ito para maituro namin sa tamang staff at maayos ang follow-up?";
}

function buildCropPrompt(detectedLanguage: InboundSmsAnalysis["detectedLanguage"] = "Filipino") {
  if (detectedLanguage === "English") {
    return "Which crop is affected right now?";
  }

  return "Anong pananim po ang apektado ngayon?";
}

function buildSymptomPrompt(detectedLanguage: InboundSmsAnalysis["detectedLanguage"] = "Filipino") {
  if (detectedLanguage === "English") {
    return "What main symptom are you seeing now: yellowing, insects, wilting, spots, or something else?";
  }

  return "Ano po ang pangunahing nakikita ninyo ngayon: naninilaw, may insekto, nalalanta, may batik, o iba pa?";
}

function buildResourcePrompt(detectedLanguage: InboundSmsAnalysis["detectedLanguage"] = "Filipino") {
  if (detectedLanguage === "English") {
    return "Which equipment or supply do you need, and when do you need it?";
  }

  return "Anong kagamitan o supply po ang kailangan ninyo, at kailan po ninyo ito kakailanganin?";
}

function buildMultiConcernPrompt(input: {
  primaryIntent: SmsIntent;
  secondaryIntent?: SmsIntent;
  detectedLanguage?: InboundSmsAnalysis["detectedLanguage"];
}) {
  const useEnglish = input.detectedLanguage === "English";
  const topicLabel = (intent?: SmsIntent) => {
    switch (intent) {
      case "PEST_DISEASE":
        return useEnglish ? "a pest or crop disease concern" : "peste o sakit sa pananim";
      case "WEATHER_HELP":
        return useEnglish ? "weather, water, or irrigation" : "panahon, tubig, o patubig";
      case "REQUEST":
        return useEnglish ? "a request for tools or supplies" : "kahilingan sa gamit o supply";
      case "PRICE_CHECK":
        return useEnglish ? "market pricing" : "presyo sa merkado";
      default:
        return useEnglish ? "the main concern" : "pangunahing concern";
    }
  };
  const primary = topicLabel(input.primaryIntent);
  const secondary = topicLabel(input.secondaryIntent);

  if (useEnglish) {
    return `Your message seems to include more than one concern. On the first pass, it may be about ${primary}, but it may also be about ${secondary}. Please reply first with the main issue to prioritize now, or send the second issue as a separate SMS.`;
  }

  return `Mukhang may higit sa isang concern sa mensahe ninyo. Sa unang basa, puwedeng ito ay tungkol sa ${primary}, pero maaari rin itong tungkol sa ${secondary}. Pakisabi po muna kung alin ang uunahin ngayon, o ipadala po nang hiwalay ang pangalawang issue.`;
}

function getUrgencyRank(urgency: SmsUrgency) {
  switch (urgency) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function maxUrgency(left: SmsUrgency, right: SmsUrgency): SmsUrgency {
  return getUrgencyRank(left) >= getUrgencyRank(right) ? left : right;
}

export function buildSmsTriageAssessment(input: {
  message: string;
  analysis: InboundSmsAnalysis;
  knownFarmer: boolean;
}): SmsTriageAssessment {
  const normalization = normalizeSmsMessage(input.message);
  const normalizedMessage = normalization.normalizedMessage.toLowerCase();
  const intentSignals = getIntentSignals(input.message);
  const candidateIntents = Array.from(
    new Set(
      [
        input.analysis.parsedIntent,
        ...intentSignals.map((signal) => signal.intent),
      ].filter((intent): intent is SmsIntent => Boolean(intent))
    )
  ).slice(0, 3);
  const cropStage = detectCropStage(normalizedMessage);
  const sentiment = detectSentiment(normalizedMessage, input.analysis.urgency);
  const missingFields = detectMissingFields({
    normalizedMessage,
    parsedIntent: input.analysis.parsedIntent,
    knownFarmer: input.knownFarmer,
    cropStage,
    urgency: input.analysis.urgency,
    sentiment,
  });
  const topSignal = intentSignals[0];
  const secondSignal = intentSignals[1];
  const multiConcernDetected =
    (topSignal &&
      secondSignal &&
      topSignal.intent !== secondSignal.intent &&
      topSignal.score >= 1 &&
      secondSignal.score >= 1 &&
      Math.abs(topSignal.score - secondSignal.score) <= 1) ||
    (CROP_HINTS.filter((crop) => normalizedMessage.includes(crop)).length >= 2 &&
      includesAny(normalizedMessage, MULTI_CONCERN_CONNECTORS));
  const multiConcernReason = multiConcernDetected
    ? "Mukhang may magkaibang concern o magkaibang pananim sa iisang mensahe."
    : undefined;
  const secondaryConcernIntent =
    input.analysis.parsedIntent === "PEST_DISEASE" &&
    /\b(?:ulan|baha|tubig|patubig|flood|rain)\b/i.test(normalizedMessage)
      ? "WEATHER_HELP"
      : input.analysis.parsedIntent === "WEATHER_HELP" &&
          /\b(?:uod|peste|kuhol|daga|sakit|insekto)\b/i.test(normalizedMessage)
        ? "PEST_DISEASE"
        : secondSignal?.intent;
  const baselineClarification = getClarificationDecision({
    message: input.message,
    analysis: input.analysis,
    knownFarmer: input.knownFarmer,
  });
  const severityMissing = missingFields.includes("severity");
  const stageMissing = missingFields.includes("crop_stage");
  const locationMissing = missingFields.includes("location");
  const symptomMissing = missingFields.includes("symptom");
  const lowConfidence = input.analysis.aiConfidence < CLARIFICATION_CONFIDENCE_THRESHOLD;
  let uncertainty: SmsTriageUncertainty = "clear";

  if (multiConcernDetected) {
    uncertainty = "ambiguous";
  } else if (severityMissing && (input.analysis.parsedIntent === "PEST_DISEASE" || input.analysis.parsedIntent === "WEATHER_HELP")) {
    uncertainty = "needs_severity";
  } else if (stageMissing) {
    uncertainty = "needs_crop_stage";
  } else if (locationMissing) {
    uncertainty = "needs_location";
  } else if (symptomMissing) {
    uncertainty = "needs_symptom_details";
  } else if (missingFields.length >= 2 || input.analysis.parsedIntent === "UNKNOWN") {
    uncertainty = "insufficient_details";
  } else if (lowConfidence || baselineClarification.clarificationNeeded) {
    uncertainty = "probable";
  }

  let nextQuestion: string | undefined;
  if (multiConcernDetected) {
    nextQuestion = buildMultiConcernPrompt({
      primaryIntent: input.analysis.parsedIntent,
      secondaryIntent: secondaryConcernIntent,
      detectedLanguage: input.analysis.detectedLanguage,
    });
  } else if (severityMissing && (input.analysis.parsedIntent === "PEST_DISEASE" || input.analysis.parsedIntent === "WEATHER_HELP")) {
    nextQuestion = buildSeverityPrompt(input.analysis.detectedLanguage);
  } else if (missingFields.includes("crop")) {
    nextQuestion = buildCropPrompt(input.analysis.detectedLanguage);
  } else if (symptomMissing) {
    nextQuestion = buildSymptomPrompt(input.analysis.detectedLanguage);
  } else if (stageMissing) {
    nextQuestion = buildStagePrompt(input.analysis.detectedLanguage);
  } else if (locationMissing) {
    nextQuestion = buildLocationPrompt(input.analysis.detectedLanguage);
  } else if (missingFields.includes("resource") || missingFields.includes("timing")) {
    nextQuestion = buildResourcePrompt(input.analysis.detectedLanguage);
  } else if (baselineClarification.clarificationQuestion) {
    nextQuestion = baselineClarification.clarificationQuestion;
  }

  const confidencePenalty =
    Math.min(missingFields.length * 0.08, 0.24) +
    (multiConcernDetected ? 0.16 : 0) +
    (normalization.unknownTokens.length > 0 ? Math.min(normalization.unknownTokens.length * 0.03, 0.12) : 0) +
    (sentiment === "frustrated" ? 0.04 : sentiment === "distressed" ? 0.06 : 0);
  const triageConfidence = Number(Math.max(0.25, Math.min(0.99, input.analysis.aiConfidence - confidencePenalty)).toFixed(2));

  let recommendedUrgency = input.analysis.urgency;
  if (sentiment === "distressed") {
    recommendedUrgency = maxUrgency(recommendedUrgency, "high");
  } else if (
    (cropStage === "flowering" || cropStage === "pre_harvest" || cropStage === "harvest_ready") &&
    (input.analysis.parsedIntent === "WEATHER_HELP" || input.analysis.parsedIntent === "PEST_DISEASE")
  ) {
    recommendedUrgency = maxUrgency(recommendedUrgency, "medium");
  }

  const clarificationNeeded =
    input.analysis.parsedIntent === "EMERGENCY" || input.analysis.urgency === "high"
      ? false
      : baselineClarification.clarificationNeeded ||
        uncertainty === "ambiguous" ||
        uncertainty === "needs_severity" ||
        uncertainty === "needs_crop_stage" ||
        uncertainty === "needs_location" ||
        uncertainty === "needs_symptom_details" ||
        uncertainty === "insufficient_details";

  return {
    triageConfidence,
    uncertainty,
    missingFields,
    nextQuestion,
    clarificationNeeded,
    clarificationQuestion: clarificationNeeded ? nextQuestion ?? baselineClarification.clarificationQuestion : undefined,
    sentiment,
    cropStage,
    candidateIntents,
    multiConcernDetected,
    multiConcernReason,
    recommendedUrgency: recommendedUrgency !== input.analysis.urgency ? recommendedUrgency : undefined,
  };
}
