import type { SafetyFlag, SmsIntent, SmsMessage } from "@/lib/types";

export type InboundSmsAnalysis = {
  parsedIntent: SmsIntent;
  urgency: SmsMessage["urgency"];
  safetyFlag: SafetyFlag;
  tone: NonNullable<SmsMessage["tone"]>;
  aiAdvice: string;
  aiConfidence: number;
  analysisSource?: SmsMessage["analysisSource"];
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
};

const PHONE_NORMALIZER = /\D/g;

export function normalizePhone(value: string) {
  const digits = value.replace(PHONE_NORMALIZER, "");

  if (digits.startsWith("63") && digits.length >= 12) {
    return digits;
  }

  if (digits.startsWith("09") && digits.length === 11) {
    return `63${digits.slice(1)}`;
  }

  if (digits.startsWith("9") && digits.length === 10) {
    return `63${digits}`;
  }

  return digits;
}

export function inferIntent(message: string): SmsIntent {
  const lower = message.toLowerCase();
  if (lower.startsWith("register")) return "REGISTER";
  if (lower.includes("emergency") || lower.includes("baha") || lower.includes("bagyo")) return "EMERGENCY";
  if (lower.includes("sprayer") || lower.includes("hiram") || lower.includes("mahihiraman") || lower.includes("tractor")) return "REQUEST";
  if (lower.includes("ani") || lower.includes("harvest")) return "HARVEST";
  if (lower.includes("ulan") || lower.includes("panahon") || lower.includes("tubig")) return "WEATHER_HELP";
  if (lower.includes("presyo")) return "PRICE_CHECK";
  if (lower.includes("peste") || lower.includes("uod") || lower.includes("daga") || lower.includes("leafminer") || lower.includes("borer")) return "PEST_DISEASE";
  if (lower.includes("tanim") || lower.includes("palay") || lower.includes("kamatis") || lower.includes("mais")) return "CROP_UPDATE";
  return "UNKNOWN";
}

export function inferUrgency(message: string, intent: SmsIntent): SmsMessage["urgency"] {
  const lower = message.toLowerCase();
  if (
    intent === "EMERGENCY" ||
    lower.includes("kagyat") ||
    lower.includes("nakakaalarma") ||
    lower.includes("lumalala") ||
    lower.includes("marami") ||
    lower.includes("baha")
  ) {
    return "high";
  }
  if (intent === "REQUEST" || intent === "PEST_DISEASE" || intent === "WEATHER_HELP") return "medium";
  return "low";
}

export function inferSafetyFlag(message: string): SafetyFlag {
  const lower = message.toLowerCase();
  if (lower.includes("lason") || lower.includes("emergency") || lower.includes("baha")) return "High";
  if (lower.includes("peste") || lower.includes("uod") || lower.includes("sira")) return "Medium";
  return "Low";
}

export function inferTone(message: string, urgency: SmsMessage["urgency"]): NonNullable<SmsMessage["tone"]> {
  const lower = message.toLowerCase();
  if (urgency === "high" || lower.includes("tulong") || lower.includes("kagyat")) return "Kritikal";
  if (lower.includes("paano") || lower.includes("pwede") || lower.includes("po")) return "Nag-aalala";
  return "Neutral";
}

export function inferAdvice(intent: SmsIntent, message: string, farmerName: string) {
  switch (intent) {
    case "REGISTER":
      return `Natanggap namin ang inyong registration request, ${farmerName}. Susuriin ito ng barangay team at magpapadala kami ng kumpirmasyon kapag kumpleto na ang detalye.`;
    case "EMERGENCY":
      return `Natanggap ang emergency report mula kay ${farmerName}. I-secure ang inyong taniman at hintayin ang susunod na alerto mula sa barangay habang sinusuri ng team ang sitwasyon.`;
    case "REQUEST":
      return `Natanggap namin ang inyong kahilingan, ${farmerName}. Susuriin namin ang available na kagamitan o supply at magpapadala kami ng susunod na instruction sa inyo.`;
    case "PEST_DISEASE":
      return `Salamat sa ulat, ${farmerName}. Sinuri ng system ang mensahe at minarkahan ito bilang posibleng concern sa peste o sakit. Magpapadala kami ng rekomendasyon matapos ang review ng AEW.`;
    case "HARVEST":
      return "Natanggap namin ang update tungkol sa ani. Maghahanda kami ng gabay sa susunod na hakbang para sa post-harvest handling at posibleng market coordination.";
    case "WEATHER_HELP":
      return "Natanggap namin ang inyong ulat tungkol sa kondisyon ng panahon o tubig. Susuriin ito kasama ng iba pang field reports at magpapadala kami ng payo kung kinakailangan.";
    case "PRICE_CHECK":
      return "Natanggap namin ang inyong tanong sa presyo. Susuriin ng system ang available market references at magpapadala kami ng sagot sa susunod na tugon.";
    case "CROP_UPDATE":
      return "Natanggap ang inyong crop update. Idadagdag ito sa live feed para makita ng barangay agriculture team at ma-prioritize ang susunod na aksyon.";
    default:
      return `Natanggap namin ang inyong mensahe: "${message.slice(0, 60)}${message.length > 60 ? "..." : ""}". Susuriin ito ng barangay team at magpapadala kami ng tugon sa lalong madaling panahon.`;
  }
}

export function analyzeInboundSms(message: string, farmerName = "magsasaka", knownFarmer = true): InboundSmsAnalysis {
  const parsedIntent = inferIntent(message);
  const urgency = inferUrgency(message, parsedIntent);
  const safetyFlag = inferSafetyFlag(message);
  const tone = inferTone(message, urgency);

  return {
    parsedIntent,
    urgency,
    safetyFlag,
    tone,
    aiAdvice: inferAdvice(parsedIntent, message, farmerName),
    aiConfidence: knownFarmer ? 0.91 : 0.72,
    analysisSource: "rules",
  };
}
