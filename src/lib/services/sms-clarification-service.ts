import type { InboundSmsAnalysis } from "@/lib/sms-simulator";
import type { SmsIntent } from "@/lib/types";

export const CLARIFICATION_CONFIDENCE_THRESHOLD = 0.78;

type ClarificationDecision = {
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
};

function buildIntentClarification(intent: SmsIntent) {
  switch (intent) {
    case "REGISTER":
      return "Natanggap namin ang inyong mensahe. Pakisend po ang buong pangalan, sitio o barangay, pangunahing pananim, at lawak ng sakahan para makumpleto ang registration.";
    case "REQUEST":
      return "Natanggap namin ang inyong kahilingan. Pakilinaw po kung anong kagamitan o supply ang kailangan at kailan ninyo ito kakailanganin.";
    case "PEST_DISEASE":
      return "Natanggap namin ang inyong ulat. Pakisabi po kung anong pananim ang apektado at ano ang pangunahing sintomas na nakikita ninyo.";
    case "WEATHER_HELP":
      return "Natanggap namin ang inyong ulat. Pakilinaw po ang lokasyon ng bukid at ang kasalukuyang kondisyon ng tubig, ulan, o pagbaha.";
    case "HARVEST":
      return "Natanggap namin ang inyong update sa ani. Pakilinaw po kung anong pananim ito, gaano kalaki ang apektadong bahagi, at kailan ninyo planong mag-ani.";
    case "PRICE_CHECK":
      return "Natanggap namin ang inyong tanong. Pakilinaw po kung anong produkto at saang merkado o lokasyon ninyo gustong magtanong ng presyo.";
    case "CROP_UPDATE":
      return "Natanggap namin ang inyong crop update. Pakilinaw po ang pananim, yugto nito, at ang pangunahing problemang napapansin ninyo sa bukid.";
    default:
      return "Natanggap namin ang inyong mensahe. Pakilinaw po ang pananim, lokasyon, at pangunahing problemang nais ninyong ipasuri upang makapagbigay kami ng tamang payo.";
  }
}

function buildUnknownFarmerSuffix() {
  return " Pakisama rin po ang inyong pangalan at sitio o barangay upang maitugma namin ang inyong record.";
}

export function getClarificationDecision(input: {
  message: string;
  analysis: Pick<InboundSmsAnalysis, "parsedIntent" | "urgency" | "aiConfidence">;
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

  let clarificationQuestion = buildIntentClarification(analysis.parsedIntent);

  if (!knownFarmer) {
    clarificationQuestion += buildUnknownFarmerSuffix();
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
