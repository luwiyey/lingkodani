import type { SmsMessage } from "@/lib/types";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4);
}

function hasTokenOverlap(left: string, right: string) {
  const leftTokens = normalizeText(left);
  const rightTokens = new Set(normalizeText(right));

  return leftTokens.some((token) => rightTokens.has(token));
}

export function findPotentialDuplicateCase(
  message: SmsMessage,
  allMessages: SmsMessage[]
) {
  const messageTime = new Date(message.timestamp).getTime();

  return allMessages
    .filter((candidate) => candidate.id !== message.id)
    .filter((candidate) => candidate.phone === message.phone || candidate.farmerId === message.farmerId)
    .filter((candidate) => {
      const candidateTime = new Date(candidate.timestamp).getTime();
      const timeDistanceHours = Math.abs(messageTime - candidateTime) / (1000 * 60 * 60);
      return timeDistanceHours <= 72;
    })
    .filter((candidate) => candidate.caseStatus !== "closed" || candidate.caseOutcomeStatus === "resolved")
    .filter((candidate) => {
      if (candidate.parsedIntent === message.parsedIntent) {
        return true;
      }

      return hasTokenOverlap(message.message, candidate.message);
    })
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
    )[0] ?? null;
}

