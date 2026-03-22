import type { SmsDetectedLanguage } from "@/lib/types";

export type SmsNormalizationMatch = {
  from: string;
  to: string;
  kind: "shortcut" | "local_term" | "crop_alias" | "pest_alias" | "service_alias";
};

export type SmsNormalizationResult = {
  originalMessage: string;
  normalizedMessage: string;
  detectedLanguage: SmsDetectedLanguage;
  matches: SmsNormalizationMatch[];
};

const WORD_SEPARATOR = /[^\p{L}\p{N}]+/u;

type ReplacementRule = SmsNormalizationMatch & {
  variants: string[];
};

const NORMALIZATION_RULES: ReplacementRule[] = [
  { from: "aq", to: "ako", kind: "shortcut", variants: ["aq", "akoq"] },
  { from: "qaqa", to: "kakailangan", kind: "shortcut", variants: ["qaqa"] },
  { from: "wla", to: "wala", kind: "shortcut", variants: ["wla", "walaa"] },
  { from: "wlang", to: "walang", kind: "shortcut", variants: ["wlang", "wlangg", "wlng"] },
  { from: "d2", to: "dito", kind: "shortcut", variants: ["d2", "dto", "d2a", "ditoy", "ditoya"] },
  { from: "d2n", to: "doon", kind: "shortcut", variants: ["d2n", "don", "doon"] },
  { from: "dyan", to: "doon", kind: "shortcut", variants: ["dyan", "jan", "idiay"] },
  { from: "ndi", to: "hindi", kind: "shortcut", variants: ["ndi", "di", "diko", "dko"] },
  { from: "qng", to: "kung", kind: "shortcut", variants: ["qng", "kng"] },
  { from: "kc", to: "kasi", kind: "shortcut", variants: ["kc", "kse", "ksi"] },
  { from: "pwde", to: "pwede", kind: "shortcut", variants: ["pwde", "pde", "puwede"] },
  { from: "nmn", to: "naman", kind: "shortcut", variants: ["nmn"] },
  { from: "bkt", to: "bakit", kind: "shortcut", variants: ["bkt"] },
  { from: "kelan", to: "kailan", kind: "shortcut", variants: ["kelan"] },
  { from: "mrami", to: "marami", kind: "shortcut", variants: ["mrami", "mrmi"] },
  { from: "kyo", to: "kayo", kind: "shortcut", variants: ["kyo", "kau"] },
  { from: "lng", to: "lang", kind: "shortcut", variants: ["lng"] },
  { from: "san", to: "saan", kind: "shortcut", variants: ["san", "saan"] },
  { from: "pls", to: "please", kind: "shortcut", variants: ["pls", "pls.", "plss"] },
  { from: "asap", to: "agad", kind: "shortcut", variants: ["asap"] },
  { from: "brgy", to: "barangay", kind: "local_term", variants: ["brgy", "baranggay"] },
  { from: "adda", to: "may", kind: "local_term", variants: ["adda"] },
  { from: "awan", to: "wala", kind: "local_term", variants: ["awan"] },
  { from: "ngem", to: "pero", kind: "local_term", variants: ["ngem"] },
  { from: "manen", to: "muli", kind: "local_term", variants: ["manen"] },
  { from: "agdama", to: "nararanasan", kind: "local_term", variants: ["agdama", "agdamaak"] },
  { from: "agmula", to: "nagsisimula", kind: "local_term", variants: ["agmula", "agmulaen"] },
  { from: "agsakit", to: "may sakit", kind: "local_term", variants: ["agsakit", "agsaksakit"] },
  { from: "agkurang", to: "kulang", kind: "local_term", variants: ["agkurang"] },
  { from: "agtudo", to: "umuulan", kind: "local_term", variants: ["agtudo", "agtutudo", "agtudtudo"] },
  { from: "napudot", to: "mainit", kind: "local_term", variants: ["napudot"] },
  { from: "nalam-ek", to: "malamig", kind: "local_term", variants: ["nalamek", "nalam-ek"] },
  { from: "napigsa", to: "malakas", kind: "local_term", variants: ["napigsa"] },
  { from: "bassit", to: "maliit", kind: "local_term", variants: ["bassit"] },
  { from: "dakkel", to: "malaki", kind: "local_term", variants: ["dakkel"] },
  { from: "narigat", to: "mahirap", kind: "local_term", variants: ["narigat"] },
  { from: "pagay", to: "palay", kind: "crop_alias", variants: ["pagay"] },
  { from: "utong", to: "sitaw", kind: "crop_alias", variants: ["utong"] },
  { from: "kalunay", to: "talong", kind: "crop_alias", variants: ["kalunay"] },
  { from: "bugguong", to: "sitaw", kind: "crop_alias", variants: ["bugguong"] },
  { from: "paria", to: "ampalaya", kind: "crop_alias", variants: ["paria"] },
  { from: "kamote tops", to: "talbos ng kamote", kind: "crop_alias", variants: ["talbos", "kamote-tops"] },
  { from: "ricebug", to: "rice bug pest", kind: "pest_alias", variants: ["ricebug", "ricebugs"] },
  { from: "kuhol", to: "golden kuhol pest", kind: "pest_alias", variants: ["kuhol"] },
  { from: "blackbug", to: "black bug pest", kind: "pest_alias", variants: ["blackbug", "blackbugs"] },
  { from: "bukbok", to: "insect pest", kind: "pest_alias", variants: ["bukbok"] },
  { from: "gamugamo", to: "insect pest", kind: "pest_alias", variants: ["gamugamo", "gamu-gamo"] },
  { from: "tungro", to: "rice disease", kind: "pest_alias", variants: ["tungro"] },
  { from: "abono", to: "pataba", kind: "service_alias", variants: ["abono"] },
  { from: "spry", to: "sprayer", kind: "service_alias", variants: ["spry", "isprayer"] },
  { from: "araro", to: "plow", kind: "service_alias", variants: ["araro"] },
];

const FILIPINO_HINTS = [
  "wala",
  "walang",
  "dito",
  "doon",
  "hindi",
  "kasi",
  "kung",
  "po",
  "opo",
  "bukid",
  "barangay",
  "pananim",
  "palay",
  "mais",
  "ulan",
  "baha",
  "tubig",
  "tulong",
  "mahirap",
  "malakas",
];

const ENGLISH_HINTS = [
  "the",
  "is",
  "are",
  "please",
  "help",
  "field",
  "rice",
  "crop",
  "damage",
  "disease",
  "need",
  "water",
  "flood",
  "sprayer",
];

const ILOCANO_HINTS = [
  "adda",
  "awan",
  "ngem",
  "ditoy",
  "idiay",
  "pagay",
  "utong",
  "kalunay",
  "paria",
  "agtudo",
  "napudot",
  "nalamek",
  "manen",
  "agdama",
  "agmula",
  "agsakit",
  "narigat",
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeBaseText(value: string) {
  return normalizeWhitespace(
    value
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
  );
}

function tokenize(value: string) {
  return normalizeBaseText(value)
    .split(WORD_SEPARATOR)
    .map((token) => token.trim())
    .filter(Boolean);
}

function countMatches(tokens: string[], hints: string[]) {
  const tokenSet = new Set(tokens);
  return hints.filter((hint) => tokenSet.has(hint)).length;
}

function detectLanguage(originalMessage: string, normalizedMessage: string): SmsDetectedLanguage {
  const originalTokens = tokenize(originalMessage);
  const normalizedTokens = tokenize(normalizedMessage);
  const combinedTokens = Array.from(new Set([...originalTokens, ...normalizedTokens]));
  const englishHits = countMatches(combinedTokens, ENGLISH_HINTS);
  const filipinoHits = countMatches(combinedTokens, FILIPINO_HINTS);
  const ilocanoHits = countMatches(combinedTokens, ILOCANO_HINTS);

  if (englishHits >= 2 && filipinoHits === 0 && ilocanoHits === 0) {
    return "English";
  }

  if (ilocanoHits >= 2 && englishHits === 0 && filipinoHits <= 2) {
    return "Ilocano";
  }

  if (ilocanoHits >= 2 && (englishHits > 0 || filipinoHits > 0)) {
    return "Ilocano mix";
  }

  if (ilocanoHits >= 1 && englishHits === 0 && filipinoHits === 0) {
    return "Ilocano";
  }

  if (ilocanoHits >= 1 && (englishHits > 0 || filipinoHits > 0)) {
    return "Ilocano mix";
  }

  if (englishHits >= 1 && (filipinoHits > 0 || ilocanoHits > 0)) {
    return "Taglish";
  }

  if (filipinoHits > 0) {
    return "Filipino";
  }

  if (englishHits > 0) {
    return "English";
  }

  return "Unknown";
}

export function normalizeSmsForMatching(message: string) {
  const normalizedBase = normalizeBaseText(message);
  const tokens = tokenize(message);
  const matches: SmsNormalizationMatch[] = [];
  const normalizedTokens = tokens.map((token) => {
    const matchedRule = NORMALIZATION_RULES.find((rule) =>
      rule.variants.includes(token)
    );

    if (!matchedRule) {
      return token;
    }

    matches.push({
      from: token,
      to: matchedRule.to,
      kind: matchedRule.kind,
    });

    return matchedRule.to;
  });

  const normalizedMessage = normalizeWhitespace(
    [normalizedBase, normalizedTokens.join(" ")]
      .filter(Boolean)
      .join(" ")
  );

  return {
    normalizedMessage,
    matches,
  };
}

export function normalizeSmsMessage(message: string): SmsNormalizationResult {
  const originalMessage = normalizeWhitespace(message);
  const { normalizedMessage, matches } = normalizeSmsForMatching(originalMessage);

  return {
    originalMessage,
    normalizedMessage,
    detectedLanguage: detectLanguage(originalMessage, normalizedMessage),
    matches,
  };
}

export function isFilipinoFamilyLanguage(language: SmsDetectedLanguage) {
  return language === "Filipino" || language === "Taglish" || language === "Ilocano" || language === "Ilocano mix";
}

export function ensureRespectfulSmsAdvice(
  advice: string,
  detectedLanguage: SmsDetectedLanguage
) {
  const trimmed = advice.trim();

  if (!trimmed || detectedLanguage === "English") {
    return trimmed;
  }

  if (/^babala:/i.test(trimmed) || /\bpo\b|\bopo\b/i.test(trimmed)) {
    return trimmed;
  }

  if (/^salamat\b/i.test(trimmed)) {
    return trimmed.replace(/^salamat\b/i, "Salamat po");
  }

  return `Opo, ${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`;
}
