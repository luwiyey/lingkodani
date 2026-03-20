import type {
  SafetyFlag,
  SmsAnalysisSource,
  SmsIntent,
  SmsLexiconRule,
  SmsMessage,
  SmsTone,
  SmsTrainingExample,
  SmsUrgency,
} from "@/lib/types";

type AnalysisLike = {
  parsedIntent: SmsIntent;
  urgency: SmsUrgency;
  safetyFlag: SafetyFlag;
  tone?: SmsTone;
  aiAdvice: string;
  aiConfidence: number;
  analysisSource?: SmsAnalysisSource;
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
};

type MatchedLexiconRule = {
  rule: SmsLexiconRule;
  score: number;
};

const WORD_SEPARATOR = /[^\p{L}\p{N}]+/u;

export function normalizeTeachingText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function tokenizeTeachingText(value: string) {
  return normalizeTeachingText(value)
    .split(WORD_SEPARATOR)
    .map((token) => token.trim())
    .filter(Boolean);
}

function getMatchedLexiconRules(
  message: string,
  rules: SmsLexiconRule[]
): MatchedLexiconRule[] {
  const normalizedMessage = normalizeTeachingText(message);
  const messageTokens = tokenizeTeachingText(message);

  return rules
    .filter((rule) => rule.enabled)
    .map((rule) => {
      const normalizedPhrase = normalizeTeachingText(rule.phrase);
      const phraseTokens = tokenizeTeachingText(rule.phrase);

      if (!normalizedPhrase || phraseTokens.length === 0) {
        return null;
      }

      const exactTokenMatch =
        phraseTokens.length === 1 && messageTokens.includes(phraseTokens[0]);
      const exactPhraseMatch =
        phraseTokens.length > 1 && normalizedMessage.includes(normalizedPhrase);
      const allTokensPresent = phraseTokens.every((token) =>
        messageTokens.includes(token)
      );

      if (!exactTokenMatch && !exactPhraseMatch && !allTokensPresent) {
        return null;
      }

      const score =
        (exactPhraseMatch ? 120 : exactTokenMatch ? 100 : 80) +
        phraseTokens.length * 4 +
        Math.min(rule.guidance.trim().length / 40, 8);

      return {
        rule,
        score,
      };
    })
    .filter((entry): entry is MatchedLexiconRule => Boolean(entry))
    .sort((left, right) => right.score - left.score);
}

export function findBestMatchingLexiconRule(
  message: string,
  rules: SmsLexiconRule[]
) {
  return getMatchedLexiconRules(message, rules)[0]?.rule ?? null;
}

export function buildLexiconTeachingContext(
  message: string,
  rules: SmsLexiconRule[]
) {
  const matched = getMatchedLexiconRules(message, rules).slice(0, 5);

  if (matched.length === 0) {
    return "";
  }

  return matched
    .map(({ rule }, index) => {
      const parts = [
        `${index + 1}. Phrase: ${rule.phrase}`,
        `intent=${rule.intent}`,
        `urgency=${rule.urgency}`,
        `safety=${rule.safetyFlag}`,
      ];

      if (rule.tone) {
        parts.push(`tone=${rule.tone}`);
      }

      if (rule.guidance.trim()) {
        parts.push(`guidance=${rule.guidance.trim()}`);
      }

      if (rule.notes?.trim()) {
        parts.push(`notes=${rule.notes.trim()}`);
      }

      return parts.join(" | ");
    })
    .join("\n");
}

function getTokenOverlapScore(leftTokens: string[], rightTokens: string[]) {
  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const rightSet = new Set(rightTokens);
  return leftTokens.filter((token) => rightSet.has(token)).length;
}

export function findRelevantTrainingExamples(
  message: string,
  examples: SmsTrainingExample[],
  maxExamples = 4
) {
  const messageTokens = tokenizeTeachingText(message);

  return examples
    .filter(
      (example) =>
        example.finalReview.status !== "rejected" &&
        example.finalReview.action !== "rejected"
    )
    .map((example) => {
      const overlap = getTokenOverlapScore(
        messageTokens,
        tokenizeTeachingText(example.message)
      );

      return {
        example,
        overlap,
        reviewedAt: Date.parse(example.finalReview.reviewedAt || ""),
      };
    })
    .filter((entry) => entry.overlap > 0)
    .sort((left, right) => {
      if (right.overlap !== left.overlap) {
        return right.overlap - left.overlap;
      }

      return (right.reviewedAt || 0) - (left.reviewedAt || 0);
    })
    .slice(0, maxExamples)
    .map((entry) => entry.example);
}

export function buildReviewedExamplesContext(
  message: string,
  examples: SmsTrainingExample[]
) {
  const relevantExamples = findRelevantTrainingExamples(message, examples);

  if (relevantExamples.length === 0) {
    return "";
  }

  return relevantExamples
    .map((example, index) => {
      const lines = [
        `${index + 1}. Reviewed SMS: ${example.message.trim()}`,
        `finalIntent=${example.finalReview.finalAnalysis.parsedIntent}`,
        `finalUrgency=${example.finalReview.finalAnalysis.urgency}`,
        `finalSafety=${example.finalReview.finalAnalysis.safetyFlag}`,
        `finalAdvice=${example.finalReview.finalAdvice.trim()}`,
      ];

      if (example.finalReview.finalAnalysis.tone) {
        lines.push(`finalTone=${example.finalReview.finalAnalysis.tone}`);
      }

      return lines.join(" | ");
    })
    .join("\n");
}

export function applyLexiconRuleToAnalysis<T extends AnalysisLike>(
  analysis: T,
  matchedRule: SmsLexiconRule | null
) {
  if (!matchedRule) {
    return analysis;
  }

  return {
    ...analysis,
    parsedIntent: matchedRule.intent,
    urgency: matchedRule.urgency,
    safetyFlag: matchedRule.safetyFlag,
    tone: matchedRule.tone ?? analysis.tone,
    aiAdvice: matchedRule.guidance.trim() || analysis.aiAdvice,
    aiConfidence:
      analysis.parsedIntent === "UNKNOWN"
        ? Math.max(analysis.aiConfidence, 0.7)
        : analysis.aiConfidence,
    clarificationNeeded: false,
    clarificationQuestion: undefined,
  };
}

export function summarizeTeachingCoverage(
  rules: SmsLexiconRule[],
  examples: SmsTrainingExample[]
) {
  const enabledRules = rules.filter((rule) => rule.enabled);
  const approvedExamples = examples.filter(
    (example) => example.finalReview.status !== "rejected"
  );

  return {
    enabledRules: enabledRules.length,
    approvedExamples: approvedExamples.length,
  };
}

export function describeRuleIntent(rule: SmsLexiconRule) {
  return `${rule.phrase} -> ${rule.intent} (${rule.urgency}/${rule.safetyFlag})`;
}
