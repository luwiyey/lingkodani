import { normalizeSmsMessage } from "@/lib/sms-normalization";
import type { SmsLexiconLearningCandidate, SmsMessage } from "@/lib/types";

const EXCLUDED_INTENTS = new Set(["REGISTER"]);

export function buildSmsLexiconLearningQueue(
  messages: SmsMessage[],
  maxItems = 8
): SmsLexiconLearningCandidate[] {
  const candidateMap = new Map<
    string,
    {
      token: string;
      occurrences: number;
      detectedLanguages: Set<SmsMessage["detectedLanguage"]>;
      exampleMessages: string[];
      suggestedIntentCounts: Map<string, number>;
    }
  >();

  for (const message of messages) {
    if (EXCLUDED_INTENTS.has(message.parsedIntent)) {
      continue;
    }

    const normalization = normalizeSmsMessage(message.message);
    const unknownTokens =
      message.normalizationUnknownTokens?.length
        ? message.normalizationUnknownTokens
        : normalization.unknownTokens;

    for (const token of unknownTokens) {
      if (token.length < 4) {
        continue;
      }

      const existing = candidateMap.get(token) ?? {
        token,
        occurrences: 0,
        detectedLanguages: new Set<SmsMessage["detectedLanguage"]>(),
        exampleMessages: [],
        suggestedIntentCounts: new Map<string, number>(),
      };

      existing.occurrences += 1;
      if (message.detectedLanguage) {
        existing.detectedLanguages.add(message.detectedLanguage);
      }
      if (!existing.exampleMessages.includes(message.message)) {
        existing.exampleMessages.push(message.message);
      }
      existing.suggestedIntentCounts.set(
        message.parsedIntent,
        (existing.suggestedIntentCounts.get(message.parsedIntent) ?? 0) + 1
      );

      candidateMap.set(token, existing);
    }
  }

  return Array.from(candidateMap.values())
    .filter((candidate) => candidate.occurrences >= 2)
    .sort((left, right) => {
      if (right.occurrences !== left.occurrences) {
        return right.occurrences - left.occurrences;
      }

      return left.token.localeCompare(right.token);
    })
    .slice(0, maxItems)
    .map((candidate) => {
      const suggestedIntentEntry = Array.from(candidate.suggestedIntentCounts.entries()).sort(
        (left, right) => right[1] - left[1]
      )[0];

      return {
        token: candidate.token,
        occurrences: candidate.occurrences,
        detectedLanguages: Array.from(candidate.detectedLanguages).filter(
          (language): language is NonNullable<typeof language> => Boolean(language)
        ),
        exampleMessages: candidate.exampleMessages.slice(0, 3),
        suggestedIntent: suggestedIntentEntry?.[0] as SmsLexiconLearningCandidate["suggestedIntent"],
      };
    });
}
