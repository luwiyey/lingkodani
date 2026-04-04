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

export type PotentialDuplicateCase = {
  message: SmsMessage;
  score: number;
  reason: string;
};

export function getPotentialDuplicateCases(
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
    .map((candidate) => {
      const sameIntent = candidate.parsedIntent === message.parsedIntent;
      const overlap = hasTokenOverlap(message.message, candidate.message);
      const sameAssignedOwner = Boolean(candidate.assignedTo && candidate.assignedTo === message.assignedTo);
      const sharedCaseId = Boolean(candidate.caseId && message.caseId && candidate.caseId === message.caseId);
      const timeDistanceHours =
        Math.abs(messageTime - new Date(candidate.timestamp).getTime()) / (1000 * 60 * 60);
      let score = 0;
      const reasons: string[] = [];

      if (candidate.phone === message.phone) {
        score += 0.28;
        reasons.push("parehong numero");
      }

      if (candidate.farmerId === message.farmerId) {
        score += 0.18;
        reasons.push("parehong farmer");
      }

      if (sameIntent) {
        score += 0.2;
        reasons.push("parehong intent");
      }

      if (overlap) {
        score += 0.18;
        reasons.push("magkahawig ang sintomas o keyword");
      }

      if (sharedCaseId) {
        score += 0.22;
        reasons.push("parehong case ID");
      }

      if (sameAssignedOwner) {
        score += 0.05;
        reasons.push("parehong assignee");
      }

      if (timeDistanceHours <= 24) {
        score += 0.12;
      } else if (timeDistanceHours <= 48) {
        score += 0.06;
      }

      if (!sameIntent && !overlap) {
        score -= 0.12;
      }

      return {
        message: candidate,
        score,
        reason:
          reasons.length > 0
            ? `Review candidate dahil sa ${reasons.join(", ")}.`
            : "Review candidate mula sa parehong farmer context.",
      } satisfies PotentialDuplicateCase;
    })
    .filter((candidate) => candidate.score >= 0.25)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return new Date(right.message.timestamp).getTime() - new Date(left.message.timestamp).getTime();
    });
}

export function findPotentialDuplicateCase(
  message: SmsMessage,
  allMessages: SmsMessage[]
) {
  return getPotentialDuplicateCases(message, allMessages)[0]?.message ?? null;
}

