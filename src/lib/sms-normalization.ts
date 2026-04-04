import type {
  SmsDetectedLanguage,
  SmsNormalizationKind,
  SmsNormalizationMatch,
  SmsNormalizationToken,
} from "@/lib/types";

export type SmsNormalizationResult = {
  originalMessage: string;
  normalizedMessage: string;
  detectedLanguage: SmsDetectedLanguage;
  matches: SmsNormalizationMatch[];
  tokens: SmsNormalizationToken[];
  unknownTokens: string[];
};

const WORD_SEPARATOR = /[^\p{L}\p{N}-]+/u;

type ReplacementRule = SmsNormalizationMatch & {
  variants: string[];
};

const NORMALIZATION_RULES: ReplacementRule[] = [
  { from: "aq", to: "ako", kind: "shortcut", confidence: 0.98, variants: ["aq", "akoq"] },
  { from: "qaqa", to: "kakailangan", kind: "shortcut", confidence: 0.92, variants: ["qaqa"] },
  { from: "wla", to: "wala", kind: "shortcut", confidence: 0.98, variants: ["wla", "walaa"] },
  { from: "wlang", to: "walang", kind: "shortcut", confidence: 0.98, variants: ["wlang", "wlangg", "wlng"] },
  { from: "d2", to: "dito", kind: "shortcut", confidence: 0.96, variants: ["d2", "dto", "d2a", "ditoy", "ditoya"] },
  { from: "d2n", to: "doon", kind: "shortcut", confidence: 0.94, variants: ["d2n", "don", "doon"] },
  { from: "dyan", to: "doon", kind: "shortcut", confidence: 0.86, variants: ["dyan", "jan", "idiay"] },
  { from: "ndi", to: "hindi", kind: "shortcut", confidence: 0.97, variants: ["ndi", "di", "diko", "dko"] },
  { from: "qng", to: "kung", kind: "shortcut", confidence: 0.88, variants: ["qng", "kng"] },
  { from: "kc", to: "kasi", kind: "shortcut", confidence: 0.9, variants: ["kc", "kse", "ksi"] },
  { from: "pwde", to: "pwede", kind: "shortcut", confidence: 0.96, variants: ["pwde", "pde", "puwede"] },
  { from: "nmn", to: "naman", kind: "shortcut", confidence: 0.92, variants: ["nmn"] },
  { from: "bkt", to: "bakit", kind: "shortcut", confidence: 0.9, variants: ["bkt"] },
  { from: "kelan", to: "kailan", kind: "shortcut", confidence: 0.9, variants: ["kelan"] },
  { from: "mrami", to: "marami", kind: "shortcut", confidence: 0.92, variants: ["mrami", "mrmi"] },
  { from: "kyo", to: "kayo", kind: "shortcut", confidence: 0.9, variants: ["kyo", "kau"] },
  { from: "lng", to: "lang", kind: "shortcut", confidence: 0.93, variants: ["lng"] },
  { from: "san", to: "saan", kind: "shortcut", confidence: 0.9, variants: ["san", "saan"] },
  { from: "pls", to: "please", kind: "shortcut", confidence: 0.95, variants: ["pls", "pls.", "plss"] },
  { from: "asap", to: "agad", kind: "shortcut", confidence: 0.82, variants: ["asap"] },
  { from: "brgy", to: "barangay", kind: "local_term", confidence: 0.98, variants: ["brgy", "baranggay"] },
  { from: "adda", to: "may", kind: "local_term", confidence: 0.94, variants: ["adda"] },
  { from: "awan", to: "wala", kind: "local_term", confidence: 0.94, variants: ["awan"] },
  { from: "ngem", to: "pero", kind: "local_term", confidence: 0.94, variants: ["ngem"] },
  { from: "manen", to: "muli", kind: "local_term", confidence: 0.9, variants: ["manen"] },
  { from: "agdama", to: "nararanasan", kind: "local_term", confidence: 0.86, variants: ["agdama", "agdamaak"] },
  { from: "agmula", to: "nagsisimula", kind: "local_term", confidence: 0.84, variants: ["agmula", "agmulaen"] },
  { from: "agsakit", to: "may sakit", kind: "local_term", confidence: 0.88, variants: ["agsakit", "agsaksakit"] },
  { from: "agkurang", to: "kulang", kind: "local_term", confidence: 0.88, variants: ["agkurang"] },
  { from: "agtudo", to: "umuulan", kind: "local_term", confidence: 0.9, variants: ["agtudo", "agtutudo", "agtudtudo"] },
  { from: "napudot", to: "mainit", kind: "local_term", confidence: 0.92, variants: ["napudot"] },
  { from: "nalam-ek", to: "malamig", kind: "local_term", confidence: 0.92, variants: ["nalamek", "nalam-ek"] },
  { from: "napigsa", to: "malakas", kind: "local_term", confidence: 0.9, variants: ["napigsa"] },
  { from: "bassit", to: "maliit", kind: "local_term", confidence: 0.88, variants: ["bassit"] },
  { from: "dakkel", to: "malaki", kind: "local_term", confidence: 0.88, variants: ["dakkel"] },
  { from: "narigat", to: "mahirap", kind: "local_term", confidence: 0.88, variants: ["narigat"] },
  { from: "pagay", to: "palay", kind: "crop_alias", confidence: 0.98, variants: ["pagay"] },
  { from: "utong", to: "sitaw", kind: "crop_alias", confidence: 0.9, variants: ["utong"] },
  { from: "kalunay", to: "talong", kind: "crop_alias", confidence: 0.9, variants: ["kalunay"] },
  { from: "bugguong", to: "sitaw", kind: "crop_alias", confidence: 0.78, variants: ["bugguong"] },
  { from: "paria", to: "ampalaya", kind: "crop_alias", confidence: 0.92, variants: ["paria"] },
  { from: "kamote tops", to: "talbos ng kamote", kind: "crop_alias", confidence: 0.8, variants: ["talbos", "kamote-tops"] },
  { from: "ricebug", to: "rice bug pest", kind: "pest_alias", confidence: 0.92, variants: ["ricebug", "ricebugs"] },
  { from: "kuhol", to: "golden kuhol pest", kind: "pest_alias", confidence: 0.9, variants: ["kuhol"] },
  { from: "blackbug", to: "black bug pest", kind: "pest_alias", confidence: 0.92, variants: ["blackbug", "blackbugs"] },
  { from: "bukbok", to: "insect pest", kind: "pest_alias", confidence: 0.78, variants: ["bukbok"] },
  { from: "gamugamo", to: "insect pest", kind: "pest_alias", confidence: 0.8, variants: ["gamugamo", "gamu-gamo"] },
  { from: "tungro", to: "rice disease", kind: "pest_alias", confidence: 0.95, variants: ["tungro"] },
  { from: "abono", to: "pataba", kind: "service_alias", confidence: 0.96, variants: ["abono"] },
  { from: "spry", to: "sprayer", kind: "service_alias", confidence: 0.78, variants: ["spry", "isprayer"] },
  { from: "araro", to: "plow", kind: "service_alias", confidence: 0.75, variants: ["araro"] },
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

const COMMON_KNOWN_TOKENS = new Set(
  [
    ...FILIPINO_HINTS,
    ...ENGLISH_HINTS,
    ...ILOCANO_HINTS,
    "may",
    "pero",
    "muli",
    "nararanasan",
    "nagsisimula",
    "kulang",
    "mainit",
    "malamig",
    "maliit",
    "malaki",
    "sitio",
    "zone",
    "farmer",
    "name",
    "pangalan",
    "problem",
    "problema",
    "symptom",
    "sintomas",
    "stage",
    "yugto",
    "ectarya",
    "ektarya",
    "hectare",
    "ha",
    "sa",
    "ang",
    "ng",
    "mga",
    "at",
    "din",
    "pero",
    "namin",
    "amin",
    "kami",
    "ako",
    "siya",
    "po",
    "sir",
    "maam",
  ].concat(NORMALIZATION_RULES.flatMap((rule) => [rule.from, rule.to, ...rule.variants]))
);

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

function classifyKnownToken(token: string): { kind: SmsNormalizationKind; confidence: number } {
  if (/^\d+$/.test(token) || /^\d+(\.\d+)?ha$/.test(token)) {
    return { kind: "known_term", confidence: 0.72 };
  }

  if (COMMON_KNOWN_TOKENS.has(token)) {
    return { kind: "known_term", confidence: 0.76 };
  }

  if (token.length <= 3) {
    return { kind: "known_term", confidence: 0.6 };
  }

  return { kind: "unknown", confidence: 0.38 };
}

export function normalizeSmsForMatching(message: string) {
  const normalizedBase = normalizeBaseText(message);
  const originalTokens = tokenize(message);
  const matches: SmsNormalizationMatch[] = [];
  const tokens: SmsNormalizationToken[] = [];
  const unknownTokens = new Set<string>();

  const normalizedTokens = originalTokens.map((token) => {
    const matchedRule = NORMALIZATION_RULES.find((rule) => rule.variants.includes(token));

    if (matchedRule) {
      matches.push({
        from: token,
        to: matchedRule.to,
        kind: matchedRule.kind,
        confidence: matchedRule.confidence,
      });
      tokens.push({
        raw: token,
        normalized: matchedRule.to,
        kind: matchedRule.kind,
        confidence: matchedRule.confidence ?? 0.8,
      });
      return matchedRule.to;
    }

    const known = classifyKnownToken(token);
    tokens.push({
      raw: token,
      normalized: token,
      kind: known.kind,
      confidence: known.confidence,
    });

    if (known.kind === "unknown") {
      unknownTokens.add(token);
    }

    return token;
  });

  const normalizedMessage = normalizeWhitespace([normalizedBase, normalizedTokens.join(" ")].filter(Boolean).join(" "));

  return {
    normalizedMessage,
    matches,
    tokens,
    unknownTokens: Array.from(unknownTokens),
  };
}

export function normalizeSmsMessage(message: string): SmsNormalizationResult {
  const originalMessage = normalizeWhitespace(message);
  const { normalizedMessage, matches, tokens, unknownTokens } = normalizeSmsForMatching(originalMessage);

  return {
    originalMessage,
    normalizedMessage,
    detectedLanguage: detectLanguage(originalMessage, normalizedMessage),
    matches,
    tokens,
    unknownTokens,
  };
}

export function isFilipinoFamilyLanguage(language: SmsDetectedLanguage) {
  return language === "Filipino" || language === "Taglish" || language === "Ilocano" || language === "Ilocano mix";
}

export function ensureRespectfulSmsAdvice(advice: string, detectedLanguage: SmsDetectedLanguage) {
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
