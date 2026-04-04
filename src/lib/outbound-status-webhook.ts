import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import {
  recordRuntimeHealthFailure,
  recordRuntimeHealthSuccess,
  recordRuntimeHealthWarning,
} from "@/lib/system-health";
import type { OutboundMessageStatus } from "@/lib/types";
import { getStringAtPaths, type WebhookPayloadRecord } from "@/lib/webhook-request";

const OUTBOUND_WEBHOOK_RUNTIME_HEALTH_ID = "sms_outbound_webhook";
const OUTBOUND_WEBHOOK_RUNTIME_HEALTH_LABEL = "Outbound Status Webhook";

function normalizeStatus(value: string | undefined): OutboundMessageStatus | null {
  const status = (value ?? "").toLowerCase();

  if (["message_sent"].includes(status)) return "sent";
  if (["message_delivered"].includes(status)) return "delivered";
  if (["message_failed"].includes(status)) return "failed";
  if (["delivered", "delivery_report_delivered", "success"].includes(status)) return "delivered";
  if (["sent", "accepted"].includes(status)) return "sent";
  if (["queued", "buffered"].includes(status)) return "queued";
  if (["failed", "undelivered", "error"].includes(status)) return "failed";
  if (["sms:sent"].includes(status)) return "sent";
  if (["sms:delivered"].includes(status)) return "delivered";
  if (["sms:failed"].includes(status)) return "failed";

  return null;
}

export function parseOutboundStatusPayload(rawBody: WebhookPayloadRecord) {
  const providerMessageId = getStringAtPaths(
    rawBody,
    ["providerMessageId"],
    ["messageId"],
    ["MessageSid"],
    ["message_id"],
    ["smsId"],
    ["id"],
    ["payload", "messageId"]
  );
  const eventOrStatus = getStringAtPaths(
    rawBody,
    ["webhookEvent"],
    ["status"],
    ["MessageStatus"],
    ["delivery_status"],
    ["event"]
  );
  const status = normalizeStatus(eventOrStatus);
  const errorMessage = getStringAtPaths(
    rawBody,
    ["error"],
    ["errorMessage"],
    ["payload", "failureReason"],
    ["payload", "reason"]
  );
  const sentAt = getStringAtPaths(rawBody, ["sentAt"]);
  const deliveredAt = getStringAtPaths(rawBody, ["deliveredAt"]);

  return { providerMessageId, status, errorMessage, sentAt, deliveredAt };
}

export async function applyOutboundStatusPayload(rawBody: WebhookPayloadRecord) {
  const { providerMessageId, status, errorMessage, sentAt, deliveredAt } = parseOutboundStatusPayload(rawBody);

  if (!providerMessageId || !status) {
    await recordRuntimeHealthFailure(
      OUTBOUND_WEBHOOK_RUNTIME_HEALTH_ID,
      OUTBOUND_WEBHOOK_RUNTIME_HEALTH_LABEL,
      "Hindi mabasa ang outbound status payload.",
      {
        providerMessageId: providerMessageId ?? "",
        status: status ?? "unknown",
      }
    );
    return {
      ok: false as const,
      code: 400,
      error: "Hindi mabasa ang outbound status payload.",
    };
  }

  const db = getServerFirestore();
  const snapshot = await db
    .collection(firebaseCollections.outboundMessages)
    .where("providerMessageId", "==", providerMessageId)
    .limit(1)
    .get();
  const target = snapshot.docs[0];

  if (!target) {
    await recordRuntimeHealthWarning(
      OUTBOUND_WEBHOOK_RUNTIME_HEALTH_ID,
      OUTBOUND_WEBHOOK_RUNTIME_HEALTH_LABEL,
      {
        providerMessageId,
        status,
        errorMessage: errorMessage ?? "Walang tumugmang outbound record.",
      }
    );
    return {
      ok: false as const,
      code: 404,
      error: "Walang outbound record na tumugma sa provider message ID.",
    };
  }

  const timestamp = deliveredAt ?? sentAt ?? new Date().toISOString();
  const updates: Record<string, string> = {
    status,
    lastStatusAt: timestamp,
  };

  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }

  if (status === "sent" && sentAt) {
    updates.sentAt = sentAt;
  }

  if (status === "delivered") {
    updates.deliveryReceivedAt = deliveredAt ?? timestamp;
    if (sentAt) {
      updates.sentAt = sentAt;
    }
  }

  await target.ref.update(updates);
  await recordRuntimeHealthSuccess(
    OUTBOUND_WEBHOOK_RUNTIME_HEALTH_ID,
    OUTBOUND_WEBHOOK_RUNTIME_HEALTH_LABEL,
    {
      outboundId: target.id,
      providerMessageId,
      status,
    }
  );

  return {
    ok: true as const,
    outboundId: target.id,
    status,
  };
}
