import { findBestMatchingLexiconRule } from "@/lib/sms-teaching";
import type { SafetyFlag, SmsIntent, SmsLexiconRule, SmsMessage } from "@/lib/types";

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
const WORD_SEPARATOR = /[^\p{L}\p{N}]+/u;

function tokenize(message: string) {
  return message
    .toLowerCase()
    .split(WORD_SEPARATOR)
    .map((token) => token.trim())
    .filter(Boolean);
}

function hasWord(tokens: string[], ...keywords: string[]) {
  return keywords.some((keyword) => tokens.includes(keyword));
}

function hasPhrase(message: string, ...phrases: string[]) {
  return phrases.some((phrase) => message.includes(phrase));
}

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

export function isValidPhilippineMobileNumber(value: string) {
  const normalized = normalizePhone(value);
  return normalized.startsWith("63") && normalized.length === 12;
}

export function buildPhoneLookupCandidates(value: string) {
  const trimmed = value.trim();
  const normalized = normalizePhone(value);
  const candidates = new Set<string>();

  if (trimmed) {
    candidates.add(trimmed);
  }

  if (normalized) {
    candidates.add(normalized);
    candidates.add(`+${normalized}`);

    if (normalized.startsWith("63") && normalized.length === 12) {
      candidates.add(`0${normalized.slice(2)}`);
    }
  }

  return Array.from(candidates);
}

export function inferIntent(
  message: string,
  matchedRule?: SmsLexiconRule | null
): SmsIntent {
  if (matchedRule) {
    return matchedRule.intent;
  }

  const lower = message.toLowerCase();
  const tokens = tokenize(message);
  if (lower.startsWith("register")) return "REGISTER";
  if (hasPhrase(lower, "emergency", "baha", "bagyo", "lubog", "evacuate", "evacuation")) return "EMERGENCY";
  if (hasWord(tokens, "peste", "uod", "daga", "leafminer", "borer") || hasPhrase(lower, "insekto", "may sakit")) return "PEST_DISEASE";
  if (hasWord(tokens, "ulan", "panahon", "tubig") || hasPhrase(lower, "walang tubig", "kulang sa tubig", "malakas na ulan")) return "WEATHER_HELP";
  if (hasWord(tokens, "sprayer", "hiram", "mahihiraman", "tractor")) return "REQUEST";
  if (hasWord(tokens, "presyo")) return "PRICE_CHECK";
  if (hasWord(tokens, "ani", "anihan", "harvest") || hasPhrase(lower, "nag ani", "mag-aani", "mag ani", "naani")) return "HARVEST";
  if (hasWord(tokens, "tanim", "palay", "kamatis", "mais", "gulay", "okra", "sili") || hasPhrase(lower, "palayan", "pananim")) return "CROP_UPDATE";
  return "UNKNOWN";
}

export function inferUrgency(
  message: string,
  intent: SmsIntent,
  matchedRule?: SmsLexiconRule | null
): SmsMessage["urgency"] {
  if (matchedRule) {
    return matchedRule.urgency;
  }

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

export function inferSafetyFlag(
  message: string,
  matchedRule?: SmsLexiconRule | null
): SafetyFlag {
  if (matchedRule) {
    return matchedRule.safetyFlag;
  }

  const lower = message.toLowerCase();
  if (lower.includes("lason") || lower.includes("emergency") || lower.includes("baha")) return "High";
  if (lower.includes("peste") || lower.includes("uod") || lower.includes("sira")) return "Medium";
  return "Low";
}

export function inferTone(
  message: string,
  urgency: SmsMessage["urgency"],
  matchedRule?: SmsLexiconRule | null
): NonNullable<SmsMessage["tone"]> {
  if (matchedRule?.tone) {
    return matchedRule.tone;
  }

  const lower = message.toLowerCase();
  if (urgency === "high" || lower.includes("tulong") || lower.includes("kagyat")) return "Kritikal";
  if (lower.includes("paano") || lower.includes("pwede") || lower.includes("po")) return "Nag-aalala";
  return "Neutral";
}

export function inferAdvice(
  intent: SmsIntent,
  message: string,
  farmerName: string,
  matchedRule?: SmsLexiconRule | null
) {
  if (matchedRule?.guidance.trim()) {
    return matchedRule.guidance.trim();
  }

  switch (intent) {
    case "REGISTER":
      return `Opo, natanggap po namin ang inyong registration request, ${farmerName}. Susuriin po ito ng barangay team at magpapadala po kami ng kumpirmasyon kapag kumpleto na ang detalye.`;
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

export function analyzeInboundSms(
  message: string,
  farmerName = "magsasaka",
  knownFarmer = true,
  customRules: SmsLexiconRule[] = []
): InboundSmsAnalysis {
  const matchedRule = findBestMatchingLexiconRule(message, customRules);
  const parsedIntent = inferIntent(message, matchedRule);
  const urgency = inferUrgency(message, parsedIntent, matchedRule);
  const safetyFlag = inferSafetyFlag(message, matchedRule);
  const tone = inferTone(message, urgency, matchedRule);
  const baseConfidence = knownFarmer ? 0.62 : 0.48;
  const confidenceByIntent: Record<SmsIntent, number> = {
    REGISTER: 0.74,
    CROP_UPDATE: 0.58,
    HARVEST: 0.56,
    REQUEST: 0.61,
    PEST_DISEASE: 0.68,
    WEATHER_HELP: 0.57,
    PRICE_CHECK: 0.66,
    EMERGENCY: 0.72,
    UNKNOWN: 0.36,
  };

  return {
    parsedIntent,
    urgency,
    safetyFlag,
    tone,
    aiAdvice: inferAdvice(parsedIntent, message, farmerName, matchedRule),
    aiConfidence: Math.max(baseConfidence, confidenceByIntent[parsedIntent]),
    analysisSource: "rules",
  };
}
