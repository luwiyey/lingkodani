import type { SendSmsResult, SmsProvider } from "@/lib/providers/sms/types";
import type { OutboundMessage, SmsMessage } from "@/lib/types";

export function createOutboundMessageRecord(input: {
  sourceMessage: SmsMessage;
  body: string;
  providerName: string;
  sendResult: SendSmsResult;
  timestamp?: string;
}): OutboundMessage {
  const createdAt = input.timestamp ?? new Date().toISOString();

  return {
    id: `OUT${Date.now()}`,
    smsMessageId: input.sourceMessage.id,
    recipientPhone: input.sourceMessage.phone,
    body: input.body,
    status: input.sendResult.status,
    provider: input.providerName,
    providerMessageId: input.sendResult.providerMessageId,
    errorMessage: input.sendResult.errorMessage,
    createdAt,
    sentAt: input.sendResult.status === "sent" ? createdAt : undefined,
    lastStatusAt: createdAt,
    attempts: 1,
  };
}

export async function sendOutboundMessage(input: {
  sourceMessage: SmsMessage;
  body: string;
  provider: SmsProvider;
  providerName: string;
}) {
  const sendResult = await input.provider.sendMessage({
    to: input.sourceMessage.phone,
    body: input.body,
  });

  return createOutboundMessageRecord({
    sourceMessage: input.sourceMessage,
    body: input.body,
    providerName: input.providerName,
    sendResult,
  });
}
