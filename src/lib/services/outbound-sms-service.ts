import type { SendSmsResult, SmsProvider } from "@/lib/providers/sms/types";
import { getOutboundPriorityMeta } from "@/lib/outbound-priority";
import type { OutboundMessage, SmsMessage } from "@/lib/types";

function compactUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function createRecordId() {
  return `OUT${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createOutboundMessageRecord(input: {
  sourceMessage: SmsMessage;
  body: string;
  providerName: string;
  sendResult: SendSmsResult;
  recipientPhone?: string;
  audience?: OutboundMessage["audience"];
  purpose?: OutboundMessage["purpose"];
  timestamp?: string;
}): OutboundMessage {
  const createdAt = input.timestamp ?? new Date().toISOString();
  const recipientPhone = input.recipientPhone ?? input.sourceMessage.phone;
  const priority = getOutboundPriorityMeta({
    sourceMessage: input.sourceMessage,
    purpose: input.purpose,
    audience: input.audience,
  });

  return compactUndefined({
    id: createRecordId(),
    smsMessageId: input.sourceMessage.id,
    recipientPhone,
    audience: input.audience,
    purpose: input.purpose,
    queuePriority: priority.score,
    queuePriorityLabel: priority.priority,
    body: input.body,
    status: input.sendResult.status,
    provider: input.providerName,
    providerMessageId: input.sendResult.providerMessageId,
    errorMessage: input.sendResult.errorMessage,
    createdAt,
    sentAt: input.sendResult.status === "sent" ? createdAt : undefined,
    lastStatusAt: createdAt,
    attempts: 1,
  }) as OutboundMessage;
}

export async function sendOutboundMessage(input: {
  sourceMessage: SmsMessage;
  body: string;
  provider: SmsProvider;
  providerName: string;
  recipientPhone?: string;
  audience?: OutboundMessage["audience"];
  purpose?: OutboundMessage["purpose"];
}) {
  const sendResult = await input.provider.sendMessage({
    to: input.recipientPhone ?? input.sourceMessage.phone,
    body: input.body,
  });

  return createOutboundMessageRecord({
    sourceMessage: input.sourceMessage,
    body: input.body,
    providerName: input.providerName,
    sendResult,
    recipientPhone: input.recipientPhone,
    audience: input.audience,
    purpose: input.purpose,
  });
}
