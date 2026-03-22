import type { InboundSmsAnalysis } from "@/lib/sms-simulator";
import type { SmsDetectedLanguage, SmsIntent } from "@/lib/types";

export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.78;

type ClarificationDecision = {
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
};

function buildIntentClarification(intent: SmsIntent, detectedLanguage: SmsDetectedLanguage = "Filipino") {
  const useEnglish = detectedLanguage === "English";

  switch (intent) {
    case "REGISTER":
      return useEnglish
        ? "We have received your message. Please send your full name, sitio or barangay, main crop, and farm size so we can complete your registration."
        : "Opo, natanggap po namin ang inyong mensahe. Pakisend po ang buong pangalan, sitio o barangay, pangunahing pananim, at lawak ng sakahan para makumpleto po ang registration.";
    case "REQUEST":
      return useEnglish
        ? "We have received your request. Please clarify which equipment or supply you need and when you will need it."
        : "Opo, natanggap po namin ang inyong kahilingan. Pakilinaw po kung anong kagamitan o supply ang kailangan at kailan po ninyo ito kakailanganin.";
    case "PEST_DISEASE":
      return useEnglish
        ? "We have received your report. Please tell us which crop is affected and what main symptoms you are seeing."
        : "Opo, natanggap po namin ang inyong ulat. Pakisabi po kung anong pananim ang apektado at ano po ang pangunahing sintomas na nakikita ninyo.";
    case "WEATHER_HELP":
      return useEnglish
        ? "We have received your report. Please clarify the farm location and the current condition of water, rain, or flooding."
        : "Opo, natanggap po namin ang inyong ulat. Pakilinaw po ang lokasyon ng bukid at ang kasalukuyang kondisyon ng tubig, ulan, o pagbaha.";
    case "HARVEST":
      return useEnglish
        ? "We have received your harvest update. Please clarify which crop this is, how large the affected area is, and when you plan to harvest."
        : "Opo, natanggap po namin ang inyong update sa ani. Pakilinaw po kung anong pananim ito, gaano kalaki ang apektadong bahagi, at kailan po ninyo planong mag-ani.";
    case "PRICE_CHECK":
      return useEnglish
        ? "We have received your question. Please clarify which product and which market or location you want to check the price for."
        : "Opo, natanggap po namin ang inyong tanong. Pakilinaw po kung anong produkto at saang merkado o lokasyon po ninyo gustong magtanong ng presyo.";
    case "CROP_UPDATE":
      return useEnglish
        ? "We have received your crop update. Please clarify the crop, its stage, and the main problem you are noticing in the field."
        : "Opo, natanggap po namin ang inyong crop update. Pakilinaw po ang pananim, yugto nito, at ang pangunahing problemang napapansin ninyo sa bukid.";
    default:
      return useEnglish
        ? "We have received your message. Please clarify the crop, location, and main problem you want reviewed so we can give the right advice."
        : "Opo, natanggap po namin ang inyong mensahe. Pakilinaw po ang pananim, lokasyon, at pangunahing problemang nais po ninyong ipasuri upang makapagbigay po kami ng tamang payo.";
  }
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
  const { analysis, knownFarmer } = input;
  const lowConfidence = analysis.aiConfidence < CLARIFICATION_CONFIDENCE_THRESHOLD;

  if (analysis.parsedIntent === "EMERGENCY" || analysis.urgency === "high") {
    return { clarificationNeeded: false };
  }

  if (analysis.parsedIntent !== "UNKNOWN" && !lowConfidence) {
    return { clarificationNeeded: false };
  }

  let clarificationQuestion = buildIntentClarification(
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
