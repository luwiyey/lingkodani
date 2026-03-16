import type { SmsTrainingExample, SmsMessage } from "@/lib/types";

export function createSmsTrainingExample(input: {
  previousMessage: SmsMessage;
  nextMessage: SmsMessage;
  actorName: string;
}) {
  const reviewedAt = input.nextMessage.respondedAt ?? new Date().toISOString();
  const wasAdviceEdited = input.previousMessage.aiAdvice !== input.nextMessage.aiAdvice;

  const action: SmsTrainingExample["finalReview"]["action"] =
    input.nextMessage.status === "approved"
      ? wasAdviceEdited
        ? "approved_edited"
        : "approved_as_is"
      : input.nextMessage.status === "replied"
        ? "manual_reply"
        : "rejected";

  return {
    id: `TRAIN${Date.now()}-${input.nextMessage.id}`,
    smsMessageId: input.previousMessage.id,
    farmerId: input.previousMessage.farmerId,
    farmerName: input.previousMessage.farmerName,
    phone: input.previousMessage.phone,
    message: input.previousMessage.message,
    inboundTimestamp: input.previousMessage.timestamp,
    analysisSource: input.previousMessage.analysisSource ?? "rules",
    originalAnalysis: {
      parsedIntent: input.previousMessage.parsedIntent,
      urgency: input.previousMessage.urgency,
      safetyFlag: input.previousMessage.safetyFlag,
      tone: input.previousMessage.tone,
      aiAdvice: input.previousMessage.aiAdvice,
      aiConfidence: input.previousMessage.aiConfidence,
    },
    finalReview: {
      action,
      status: input.nextMessage.status,
      finalAdvice: input.nextMessage.aiAdvice,
      finalAnalysis: {
        parsedIntent: input.nextMessage.parsedIntent,
        urgency: input.nextMessage.urgency,
        safetyFlag: input.nextMessage.safetyFlag,
        tone: input.nextMessage.tone,
      },
      reviewedBy: input.actorName,
      reviewedAt,
      wasAdviceEdited,
    },
  } satisfies SmsTrainingExample;
}
