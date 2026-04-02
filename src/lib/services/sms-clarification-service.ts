import { normalizeSmsMessage } from "@/lib/sms-normalization";
import type { InboundSmsAnalysis } from "@/lib/sms-simulator";
import type { SmsDetectedLanguage, SmsIntent } from "@/lib/types";

export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.7;

type ClarificationDecision = {
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
};

type IntentSignal = {
  intent: SmsIntent;
  score: number;
};

const INTENT_SIGNAL_MAP: Record<SmsIntent, string[]> = {
  REGISTER: ["register", "rehistro", "rehistrado", "pangalan", "farm size", "ektarya", "hectare"],
  CROP_UPDATE: ["palay", "pagay", "mais", "kamatis", "gulay", "talong", "sitaw", "crop", "tanim", "pananim"],
  HARVEST: ["ani", "anihan", "harvest", "naani", "post-harvest"],
  REQUEST: ["hiram", "sprayer", "tractor", "pataba", "abono", "supply", "kahilingan", "request", "need"],
  PEST_DISEASE: ["peste", "uod", "kuhol", "daga", "leafminer", "borer", "insekto", "sakit", "dilaw", "spot"],
  WEATHER_HELP: ["ulan", "bagyo", "tubig", "patubig", "irrigation", "flood", "rain", "baha", "tagtuyot", "walang tubig"],
  PRICE_CHECK: ["presyo", "price", "market", "palengke", "bili", "benta"],
  EMERGENCY: ["emergency", "kagyat", "lubog", "evacuate", "delikado"],
  UNKNOWN: [],
};

const INTENT_TOPIC_LABELS: Record<SmsIntent, { fil: string; eng: string; shortFil: string; shortEng: string }> = {
  REGISTER: {
    fil: "registration",
    eng: "registration",
    shortFil: "registration",
    shortEng: "registration",
  },
  CROP_UPDATE: {
    fil: "update sa pananim",
    eng: "crop update",
    shortFil: "pananim",
    shortEng: "crop update",
  },
  HARVEST: {
    fil: "ani o post-harvest",
    eng: "harvest or post-harvest",
    shortFil: "ani",
    shortEng: "harvest",
  },
  REQUEST: {
    fil: "kahilingan sa kagamitan o supply",
    eng: "equipment or supply request",
    shortFil: "kahilingan",
    shortEng: "request",
  },
  PEST_DISEASE: {
    fil: "peste o sakit sa pananim",
    eng: "a pest or crop disease concern",
    shortFil: "peste/sakit",
    shortEng: "pest/disease",
  },
  WEATHER_HELP: {
    fil: "panahon, tubig, o patubig",
    eng: "weather, water, or irrigation",
    shortFil: "tubig/panahon",
    shortEng: "weather/water",
  },
  PRICE_CHECK: {
    fil: "presyo sa merkado",
    eng: "market pricing",
    shortFil: "presyo",
    shortEng: "price",
  },
  EMERGENCY: {
    fil: "emergency o agarang pinsala",
    eng: "an emergency or severe damage",
    shortFil: "emergency",
    shortEng: "emergency",
  },
  UNKNOWN: {
    fil: "pangunahing concern",
    eng: "main concern",
    shortFil: "concern",
    shortEng: "concern",
  },
};

function scoreIntentSignals(message: string): IntentSignal[] {
  const { normalizedMessage } = normalizeSmsMessage(message);
  const lower = normalizedMessage.toLowerCase();

  const signals = (Object.keys(INTENT_SIGNAL_MAP) as SmsIntent[])
    .filter((intent) => intent !== "UNKNOWN")
    .map((intent) => {
      const score = INTENT_SIGNAL_MAP[intent].reduce((total, keyword) => {
        return total + (lower.includes(keyword) ? 1 : 0);
      }, 0);

      return { intent, score };
    })
    .filter((signal) => signal.score > 0)
    .sort((left, right) => right.score - left.score);

  const hasSpecificIssueSignal = signals.some(
    (signal) => signal.intent !== "CROP_UPDATE" && signal.intent !== "REGISTER"
  );

  return hasSpecificIssueSignal
    ? signals.filter((signal) => signal.intent !== "CROP_UPDATE")
    : signals;
}

function getTopicLabel(intent: SmsIntent, detectedLanguage: SmsDetectedLanguage = "Filipino", short = false) {
  const labels = INTENT_TOPIC_LABELS[intent] ?? INTENT_TOPIC_LABELS.UNKNOWN;
  const useEnglish = detectedLanguage === "English";

  if (short) {
    return useEnglish ? labels.shortEng : labels.shortFil;
  }

  return useEnglish ? labels.eng : labels.fil;
}

function buildGenericClarification(intent: SmsIntent, detectedLanguage: SmsDetectedLanguage = "Filipino") {
  const useEnglish = detectedLanguage === "English";

  switch (intent) {
    case "REGISTER":
      return useEnglish
        ? "We received your message. Please send your full name, sitio or barangay, main crop, and farm size so we can complete your registration."
        : "Opo, natanggap po namin ang inyong mensahe. Pakisend po ang buong pangalan, sitio o barangay, pangunahing pananim, at lawak ng sakahan para makumpleto po ang registration.";
    case "REQUEST":
      return useEnglish
        ? "We received your request. Please clarify which equipment or supply you need and when you need it."
        : "Opo, natanggap po namin ang inyong kahilingan. Pakilinaw po kung anong kagamitan o supply ang kailangan at kailan po ninyo ito kakailanganin.";
    case "PEST_DISEASE":
      return useEnglish
        ? "We received your report. Please tell us which crop is affected and what main symptoms you are seeing."
        : "Opo, natanggap po namin ang inyong ulat. Pakisabi po kung anong pananim ang apektado at ano po ang pangunahing sintomas na nakikita ninyo.";
    case "WEATHER_HELP":
      return useEnglish
        ? "We received your report. Please clarify the farm location and the current condition of water, rain, or flooding."
        : "Opo, natanggap po namin ang inyong ulat. Pakilinaw po ang lokasyon ng bukid at ang kasalukuyang kondisyon ng tubig, ulan, o pagbaha.";
    case "HARVEST":
      return useEnglish
        ? "We received your harvest update. Please clarify which crop this is, how large the affected area is, and when you plan to harvest."
        : "Opo, natanggap po namin ang inyong update sa ani. Pakilinaw po kung anong pananim ito, gaano kalaki ang apektadong bahagi, at kailan po ninyo planong mag-ani.";
    case "PRICE_CHECK":
      return useEnglish
        ? "We received your question. Please clarify which product and which market or location you want to check the price for."
        : "Opo, natanggap po namin ang inyong tanong. Pakilinaw po kung anong produkto at saang merkado o lokasyon po ninyo gustong magtanong ng presyo.";
    case "CROP_UPDATE":
      return useEnglish
        ? "We received your crop update. Please clarify the crop, its stage, and the main problem you are noticing in the field."
        : "Opo, natanggap po namin ang inyong crop update. Pakilinaw po ang pananim, yugto nito, at ang pangunahing problemang napapansin ninyo sa bukid.";
    default:
      return useEnglish
        ? "We received your message. Please clarify the crop, location, and main problem you want reviewed so we can give the right advice."
        : "Opo, natanggap po namin ang inyong mensahe. Pakilinaw po ang pananim, lokasyon, at pangunahing problemang nais po ninyong ipasuri upang makapagbigay po kami ng tamang payo.";
  }
}

function buildAmbiguityClarification(input: {
  primaryIntent: SmsIntent;
  secondaryIntent: SmsIntent;
  detectedLanguage: SmsDetectedLanguage;
  knownFarmer: boolean;
}) {
  const useEnglish = input.detectedLanguage === "English";
  const primary = getTopicLabel(input.primaryIntent, input.detectedLanguage);
  const secondary = getTopicLabel(input.secondaryIntent, input.detectedLanguage);
  const primaryShort = getTopicLabel(input.primaryIntent, input.detectedLanguage, true);
  const secondaryShort = getTopicLabel(input.secondaryIntent, input.detectedLanguage, true);

  if (useEnglish) {
    return `We received your message. On the first pass, it looks like it may be about ${primary}. Did we get that right, or is it about ${secondary} instead? Please reply with "${primaryShort}" or "${secondaryShort}", and include the crop and location if possible.${input.knownFarmer ? "" : " Please include your name and sitio or barangay too so we can match your record."}`;
  }

  return `Opo, natanggap po namin ang inyong mensahe. Sa unang basa, mukhang tungkol po ito sa ${primary}. Tama po ba iyon, o tungkol po ba ito sa ${secondary}? Pakisagot po ng "${primaryShort}" o "${secondaryShort}" at isama rin po ang pananim at lokasyon kung maaari.${input.knownFarmer ? "" : " Pakisama rin po ang inyong pangalan at sitio o barangay upang maitugma po namin ang inyong record."}`;
}

function buildUnknownFarmerSuffix(detectedLanguage: SmsDetectedLanguage = "Filipino") {
  if (detectedLanguage === "English") {
    return " Please include your name and sitio or barangay as well so we can match your record.";
  }

  return " Pakisama rin po ang inyong pangalan at sitio o barangay upang maitugma po namin ang inyong record.";
}

export function getClarificationDecision(input: {
  message: string;
  analysis: Pick<InboundSmsAnalysis, "parsedIntent" | "urgency" | "aiConfidence" | "detectedLanguage">;
  knownFarmer: boolean;
}): ClarificationDecision {
  const { analysis, knownFarmer, message } = input;

  if (analysis.parsedIntent === "EMERGENCY" || analysis.urgency === "high") {
    return { clarificationNeeded: false };
  }

  const signals = scoreIntentSignals(message);
  const bestSignal = signals[0];
  const secondSignal = signals[1];
  const lowConfidence = analysis.aiConfidence < CLARIFICATION_CONFIDENCE_THRESHOLD;
  const matchedSignal = bestSignal?.intent === analysis.parsedIntent ? bestSignal : undefined;
  const strongIntentEvidence =
    analysis.parsedIntent !== "UNKNOWN" &&
    matchedSignal !== undefined &&
    matchedSignal.score >= 2 &&
    (!secondSignal || matchedSignal.score - secondSignal.score >= 1);
  const ambiguityDetected =
    bestSignal !== undefined &&
    secondSignal !== undefined &&
    bestSignal.intent !== secondSignal.intent &&
    Math.abs(bestSignal.score - secondSignal.score) <= 1;

  if (analysis.parsedIntent !== "UNKNOWN" && strongIntentEvidence && !ambiguityDetected) {
    return { clarificationNeeded: false };
  }

  if (!lowConfidence && analysis.parsedIntent !== "UNKNOWN" && !ambiguityDetected) {
    return { clarificationNeeded: false };
  }

  if (ambiguityDetected) {
    const primaryIntent =
      analysis.parsedIntent !== "UNKNOWN" ? analysis.parsedIntent : bestSignal.intent;
    const secondaryIntent =
      bestSignal.intent === primaryIntent ? secondSignal.intent : bestSignal.intent;

    return {
      clarificationNeeded: true,
      clarificationQuestion: buildAmbiguityClarification({
        primaryIntent,
        secondaryIntent,
        detectedLanguage: analysis.detectedLanguage ?? "Filipino",
        knownFarmer,
      }),
    };
  }

  let clarificationQuestion = buildGenericClarification(
    analysis.parsedIntent,
    analysis.detectedLanguage
  );

  if (!knownFarmer) {
    clarificationQuestion += buildUnknownFarmerSuffix(analysis.detectedLanguage);
  }

  return {
    clarificationNeeded: true,
    clarificationQuestion,
  };
}

export function enhanceInboundAnalysisWithClarification(input: {
  message: string;
  analysis: InboundSmsAnalysis;
  knownFarmer: boolean;
}): InboundSmsAnalysis {
  const decision = getClarificationDecision({
    message: input.message,
    analysis: input.analysis,
    knownFarmer: input.knownFarmer,
  });

  if (!decision.clarificationNeeded) {
    return {
      ...input.analysis,
      clarificationNeeded: false,
      clarificationQuestion: undefined,
    };
  }

  return {
    ...input.analysis,
    clarificationNeeded: true,
    clarificationQuestion: decision.clarificationQuestion,
    aiAdvice: decision.clarificationQuestion ?? input.analysis.aiAdvice,
  };
}
