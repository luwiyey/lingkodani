import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { parseInboundWebhookRequest } from "@/lib/inbound-webhook";
import { verifySmsgateWebhookSignature } from "@/lib/providers/sms/smsgate";
import { enqueueInboundWebhook, peekInboundWebhookCount } from "@/lib/server/inbound-sms-queue";
import { persistLiveInboundSms } from "@/lib/services/server-live-inbound-sms-service";
import { readWebhookRequest } from "@/lib/webhook-request";

function isAuthorized(request: Request, rawBody: string) {
  const configuredToken = process.env.INBOUND_SMS_WEBHOOK_TOKEN;
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

export async function POST(request: Request) {
  const webhookRequest = await readWebhookRequest(request);

  if (!isAuthorized(request, webhookRequest.rawBody)) {
    return NextResponse.json({ error: "Unauthorized webhook request." }, { status: 401 });
  }

  const inbound = await parseInboundWebhookRequest(webhookRequest);

  if (!inbound) {
    return NextResponse.json(
      { error: "Hindi mabasa ang inbound SMS payload." },
      { status: 400 }
    );
  }

  if (isLiveMode) {
    const result = await persistLiveInboundSms({
      phone: inbound.phone,
      message: inbound.message,
      analysis: inbound.analysis,
      sourceProvider: inbound.provider,
      externalId: inbound.externalId,
    });

    return NextResponse.json({
      accepted: true,
      persisted: !result.duplicate,
      duplicate: result.duplicate,
      provider: inbound.provider,
      messageId: result.message.id,
    });
  }

  enqueueInboundWebhook(inbound);

  return NextResponse.json({
    accepted: true,
    queued: true,
    provider: inbound.provider,
    queueSize: peekInboundWebhookCount(),
  });
}
