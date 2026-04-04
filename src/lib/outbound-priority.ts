import type { OutboundMessage, SmsMessage } from "@/lib/types";

export type OutboundPriorityLabel = NonNullable<OutboundMessage["queuePriorityLabel"]>;

function urgencyScore(message: SmsMessage) {
  if (message.urgency === "high") return 42;
  if (message.urgency === "medium") return 24;
  return 8;
}

function purposeScore(purpose?: OutboundMessage["purpose"]) {
  switch (purpose) {
    case "official_reminder":
      return 32;
    case "resolution_confirmation":
      return 26;
    case "manual_reply":
      return 22;
    case "official_help":
      return 20;
    case "official_ack":
      return 18;
    case "auto_reply":
      return 16;
    case "follow_up":
      return 9;
    default:
      return 6;
  }
}

export function getOutboundPriorityMeta(input: {
  sourceMessage: SmsMessage;
  purpose?: OutboundMessage["purpose"];
  audience?: OutboundMessage["audience"];
}) {
  const { sourceMessage, purpose, audience } = input;
  let score = urgencyScore(sourceMessage) + purposeScore(purpose);

  if (sourceMessage.parsedIntent === "EMERGENCY") {
    score += 14;
  }

  if (audience === "official") {
    score += 10;
  }

  if (sourceMessage.caseStatus === "escalated") {
    score += 8;
  }

  if (sourceMessage.registrationRequired || sourceMessage.identityDetailsNeeded) {
    score -= 6;
  }

  if (sourceMessage.clarificationNeeded && purpose === "follow_up") {
    score -= 4;
  }

  const priority =
    score >= 72
      ? "critical"
      : score >= 54
        ? "high"
        : score >= 30
          ? "normal"
          : "low";

  return {
    score,
    priority,
  };
}

export function compareMessagesForOutboundPriority(
  left: SmsMessage,
  right: SmsMessage,
  purpose?: OutboundMessage["purpose"]
) {
  const leftPriority = getOutboundPriorityMeta({
    sourceMessage: left,
    purpose,
  });
  const rightPriority = getOutboundPriorityMeta({
    sourceMessage: right,
    purpose,
  });

  if (rightPriority.score !== leftPriority.score) {
    return rightPriority.score - leftPriority.score;
  }

  return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
}

