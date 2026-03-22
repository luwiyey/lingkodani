import { findBestMatchingLexiconRule } from "@/lib/sms-teaching";
import type {
  SafetyFlag,
  SmsDetectedLanguage,
  SmsIntent,
  SmsLexiconRule,
  SmsMessage,
} from "@/lib/types";
import {
  isFilipinoFamilyLanguage,
  normalizeSmsMessage,
} from "@/lib/sms-normalization";

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
  detectedLanguage?: SmsDetectedLanguage;
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

  const { normalizedMessage } = normalizeSmsMessage(message);
  const lower = normalizedMessage.toLowerCase();
  const tokens = tokenize(normalizedMessage);
  if (lower.startsWith("register")) return "REGISTER";
  if (hasPhrase(lower, "emergency", "baha", "bagyo", "lubog", "evacuate", "evacuation")) return "EMERGENCY";
  if (
    hasWord(tokens, "peste", "uod", "daga", "leafminer", "borer", "bug", "worm", "kuhol") ||
    hasPhrase(lower, "insekto", "may sakit", "rice bug", "black bug", "golden kuhol")
  ) return "PEST_DISEASE";
  if (
    hasWord(tokens, "ulan", "panahon", "tubig", "drought", "rain", "flood", "flooded", "water") ||
    hasPhrase(lower, "walang tubig", "kulang sa tubig", "malakas na ulan", "no water", "no irrigation")
  ) return "WEATHER_HELP";
  if (hasWord(tokens, "sprayer", "hiram", "mahihiraman", "tractor", "borrow", "need", "request", "pataba", "abono")) return "REQUEST";
  if (hasWord(tokens, "presyo", "price", "market")) return "PRICE_CHECK";
  if (hasWord(tokens, "ani", "anihan", "harvest") || hasPhrase(lower, "nag ani", "mag-aani", "mag ani", "naani")) return "HARVEST";
  if (hasWord(tokens, "tanim", "palay", "pagay", "kamatis", "mais", "gulay", "okra", "sili", "crop", "rice", "sitaw", "talong") || hasPhrase(lower, "palayan", "pananim", "rice field")) return "CROP_UPDATE";
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

  const lower = normalizeSmsMessage(message).normalizedMessage.toLowerCase();
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

  const lower = normalizeSmsMessage(message).normalizedMessage.toLowerCase();
  if (lower.includes("lason") || lower.includes("emergency") || lower.includes("baha") || lower.includes("flood")) return "High";
  if (lower.includes("peste") || lower.includes("uod") || lower.includes("sira") || lower.includes("damage") || lower.includes("disease")) return "Medium";
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

  const lower = normalizeSmsMessage(message).normalizedMessage.toLowerCase();
  if (urgency === "high" || lower.includes("tulong") || lower.includes("kagyat")) return "Kritikal";
  if (lower.includes("paano") || lower.includes("pwede") || lower.includes("po") || lower.includes("please")) return "Nag-aalala";
  return "Neutral";
}

export function inferAdvice(
  intent: SmsIntent,
  message: string,
  farmerName: string,
  detectedLanguage: SmsDetectedLanguage,
  matchedRule?: SmsLexiconRule | null
) {
  if (matchedRule?.guidance.trim()) {
    return matchedRule.guidance.trim();
  }

  const useEnglish = detectedLanguage === "English";
  const useRespectfulFilipino = isFilipinoFamilyLanguage(detectedLanguage) || detectedLanguage === "Unknown";

  switch (intent) {
    case "REGISTER":
      return useEnglish
        ? `We have received your registration request, ${farmerName}. The barangay team will review it and send confirmation once the details are complete.`
        : `Opo, natanggap po namin ang inyong registration request, ${farmerName}. Susuriin po ito ng barangay team at magpapadala po kami ng kumpirmasyon kapag kumpleto na ang detalye.`;
    case "EMERGENCY":
      return useEnglish
        ? `We have received the emergency report from ${farmerName}. Please secure the farm area and wait for the next alert while the barangay team reviews the situation.`
        : `Opo, natanggap po ang emergency report mula kay ${farmerName}. Paki-secure po ang inyong taniman at hintayin ang susunod na alerto habang sinusuri po ng barangay team ang sitwasyon.`;
    case "REQUEST":
      return useEnglish
        ? `We have received your request, ${farmerName}. We will check the available equipment or supplies and send the next instructions shortly.`
        : `Opo, natanggap po namin ang inyong kahilingan, ${farmerName}. Susuriin po namin ang available na kagamitan o supply at magpapadala po kami ng susunod na instruction sa inyo.`;
    case "PEST_DISEASE":
      return useEnglish
        ? `Thank you for the report, ${farmerName}. The system flagged this as a possible pest or disease concern. We will send guidance after AEW review.`
        : `Salamat po sa ulat, ${farmerName}. Sinuri po ng system ang mensahe at minarkahan ito bilang posibleng concern sa peste o sakit. Magpapadala po kami ng rekomendasyon matapos ang review ng AEW.`;
    case "HARVEST":
      return useEnglish
        ? "We have received your harvest update. We will prepare guidance for the next steps on post-harvest handling and possible market coordination."
        : "Opo, natanggap po namin ang update tungkol sa ani. Maghahanda po kami ng gabay sa susunod na hakbang para sa post-harvest handling at posibleng market coordination.";
    case "WEATHER_HELP":
      return useEnglish
        ? "We have received your report about weather or water conditions. We will review it with other field reports and send advice if needed."
        : "Opo, natanggap po namin ang inyong ulat tungkol sa kondisyon ng panahon o tubig. Susuriin po ito kasama ng iba pang field reports at magpapadala po kami ng payo kung kinakailangan.";
    case "PRICE_CHECK":
      return useEnglish
        ? "We have received your price inquiry. The system will check the available market references and send a response shortly."
        : "Opo, natanggap po namin ang inyong tanong sa presyo. Susuriin po ng system ang available market references at magpapadala po kami ng sagot sa susunod na tugon.";
    case "CROP_UPDATE":
      return useEnglish
        ? "We have received your crop update. It will be added to the live feed so the barangay agriculture team can review and prioritize the next action."
        : "Opo, natanggap po ang inyong crop update. Idadagdag po ito sa live feed para makita ng barangay agriculture team at ma-prioritize ang susunod na aksyon.";
    default:
      return useEnglish
        ? `We have received your message: "${message.slice(0, 60)}${message.length > 60 ? "..." : ""}". The barangay team will review it and send a response as soon as possible.`
        : `${useRespectfulFilipino ? "Opo, " : ""}natanggap po namin ang inyong mensahe: "${message.slice(0, 60)}${message.length > 60 ? "..." : ""}". Susuriin po ito ng barangay team at magpapadala po kami ng tugon sa lalong madaling panahon.`;
  }
}

export function analyzeInboundSms(
  message: string,
  farmerName = "magsasaka",
  knownFarmer = true,
  customRules: SmsLexiconRule[] = []
): InboundSmsAnalysis {
  const normalization = normalizeSmsMessage(message);
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
    aiAdvice: inferAdvice(parsedIntent, message, farmerName, normalization.detectedLanguage, matchedRule),
    aiConfidence: Math.max(baseConfidence, confidenceByIntent[parsedIntent]),
    analysisSource: "rules",
    detectedLanguage: normalization.detectedLanguage,
  };
}
