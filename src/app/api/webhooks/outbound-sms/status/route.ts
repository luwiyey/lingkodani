import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { verifySmsgateWebhookSignature } from "@/lib/providers/sms/smsgate";
import type { OutboundMessageStatus } from "@/lib/types";
import { getStringAtPaths, readWebhookRequest, type WebhookPayloadRecord } from "@/lib/webhook-request";

function normalizeStatus(value: string | undefined): OutboundMessageStatus | null {
  const status = (value ?? "").toLowerCase();

  if (["delivered", "delivery_report_delivered", "success"].includes(status)) return "delivered";
  if (["sent", "accepted"].includes(status)) return "sent";
  if (["queued", "buffered"].includes(status)) return "queued";
  if (["failed", "undelivered", "error"].includes(status)) return "failed";
  if (["sms:sent"].includes(status)) return "sent";
  if (["sms:delivered"].includes(status)) return "delivered";
  if (["sms:failed"].includes(status)) return "failed";

  return null;
}

function isAuthorized(request: Request, rawBody: string) {
  const configuredToken = process.env.OUTBOUND_STATUS_WEBHOOK_TOKEN ?? process.env.INBOUND_SMS_WEBHOOK_TOKEN;
  const signingKey = process.env.SMSGATE_WEBHOOK_SIGNING_KEY;
  const headerToken = request.headers.get("x-webhook-token") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (configuredToken && headerToken === configuredToken) {
    return true;
  }

  if (signingKey) {
    return verifySmsgateWebhookSignature({
      rawBody,
      timestamp: request.headers.get("x-timestamp"),
      signature: request.headers.get("x-signature"),
      secret: signingKey,
    });
  }

  return !isLiveMode;
}

function parseStatusPayload(rawBody: WebhookPayloadRecord) {
  const providerMessageId = getStringAtPaths(
    rawBody,
    ["providerMessageId"],
    ["messageId"],
    ["MessageSid"],
    ["message_id"],
    ["id"],
    ["payload", "messageId"]
  );
  const eventOrStatus = getStringAtPaths(
    rawBody,
    ["status"],
    ["MessageStatus"],
    ["delivery_status"],
    ["event"]
  );
  const status = normalizeStatus(eventOrStatus);
  const errorMessage = getStringAtPaths(
    rawBody,
    ["error"],
    ["payload", "failureReason"],
    ["payload", "reason"]
  );

  return { providerMessageId, status, errorMessage };
}

export async function POST(request: Request) {
  const webhookRequest = await readWebhookRequest(request);

  if (!isAuthorized(request, webhookRequest.rawBody)) {
    return NextResponse.json({ error: "Unauthorized webhook request." }, { status: 401 });
  }

  const { providerMessageId, status, errorMessage } = parseStatusPayload(webhookRequest.body);

  if (!providerMessageId || !status) {
    return NextResponse.json(
      { error: "Hindi mabasa ang outbound status payload." },
      { status: 400 }
    );
  }

  const db = getServerFirestore();
  const snapshot = await db
    .collection(firebaseCollections.outboundMessages)
    .where("providerMessageId", "==", providerMessageId)
    .limit(1)
    .get();
  const target = snapshot.docs[0];

  if (!target) {
    return NextResponse.json(
      { error: "Walang outbound record na tumugma sa provider message ID." },
      { status: 404 }
    );
  }

  const timestamp = new Date().toISOString();
  const updates: Record<string, string> = {
    status,
    lastStatusAt: timestamp,
  };

  if (errorMessage) {
    updates.errorMessage = errorMessage;
  }

  if (status === "delivered") {
    updates.deliveryReceivedAt = timestamp;
  }

  await target.ref.update(updates);

  return NextResponse.json({
    updated: true,
    outboundId: target.id,
    status,
  });
}
