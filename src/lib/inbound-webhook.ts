import type { InboundSmsAnalysis } from "@/lib/sms-simulator";
import { analyzeInboundSmsWithFallback } from "@/lib/services/server-sms-analysis-service";
import { isSmsgatePayload } from "@/lib/providers/sms/smsgate";
import { isTextbeePayload } from "@/lib/providers/sms/textbee";
import {
  getStringAtPaths,
  type ParsedWebhookRequest,
  type WebhookPayloadRecord,
} from "@/lib/webhook-request";

export type NormalizedInboundWebhook = {
  phone: string;
  message: string;
  provider: "generic" | "twilio" | "semaphore" | "smsgate" | "textbee" | "unknown";
  externalId?: string;
  receivedAt: string;
  analysis: InboundSmsAnalysis;
};

function normalizeRawBody(body: WebhookPayloadRecord) {
  const phone = getStringAtPaths(
    body,
    ["phone"],
    ["from"],
    ["From"],
    ["sender"],
    ["senderNumber"],
    ["msisdn"],
    ["number"],
    ["source"],
    ["payload", "sender"],
    ["payload", "phoneNumber"]
  );
  const message = getStringAtPaths(
    body,
    ["message"],
    ["text"],
    ["Body"],
    ["body"],
    ["content"],
    ["sms"],
    ["payload", "message"]
  );
  const externalId = getStringAtPaths(
    body,
    ["externalId"],
    ["id"],
    ["MessageSid"],
    ["message_id"],
    ["messageId"],
    ["smsId"],
    ["payload", "messageId"]
  );
  const event = getStringAtPaths(body, ["event"], ["webhookEvent"]);

  const provider: NormalizedInboundWebhook["provider"] =
    isTextbeePayload(body)
      ? "textbee"
      : isSmsgatePayload(body)
      ? "smsgate"
      : body.MessageSid || body.From || body.Body
        ? "twilio"
        : body.message_id || body.msisdn || body.sender
          ? "semaphore"
          : body.phone || body.message
            ? "generic"
            : "unknown";

  const receivedAt =
    getStringAtPaths(body, ["payload", "receivedAt"], ["receivedAt"], ["timestamp"], ["createdAt"]) ??
    (event === "sms:received" ? new Date().toISOString() : undefined);

  return { phone, message, provider, externalId, receivedAt };
}

export async function parseInboundWebhookRequest(webhookRequest: ParsedWebhookRequest): Promise<NormalizedInboundWebhook | null> {
  const normalized = normalizeRawBody(webhookRequest.body);

  if (!normalized.phone || !normalized.message) {
    return null;
  }

  return {
    phone: normalized.phone,
    message: normalized.message,
    provider: normalized.provider,
    externalId: normalized.externalId,
    receivedAt: normalized.receivedAt ?? new Date().toISOString(),
    analysis: await analyzeInboundSmsWithFallback({
      message: normalized.message,
    }),
  };
}
