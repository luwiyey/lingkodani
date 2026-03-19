import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { applyOutboundStatusPayload } from "@/lib/outbound-status-webhook";
import { verifyTextbeeWebhookSignature } from "@/lib/providers/sms/textbee";
import { verifySmsgateWebhookSignature } from "@/lib/providers/sms/smsgate";
import { readWebhookRequest } from "@/lib/webhook-request";

function isAuthorized(
  request: Request,
  rawBody: string,
  body: Record<string, unknown>
) {
  const configuredToken = process.env.OUTBOUND_STATUS_WEBHOOK_TOKEN ?? process.env.INBOUND_SMS_WEBHOOK_TOKEN;
  const signingKey = process.env.SMSGATE_WEBHOOK_SIGNING_KEY;
  const textbeeWebhookSecret = process.env.TEXTBEE_WEBHOOK_SECRET;
  const headerToken = request.headers.get("x-webhook-token") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (configuredToken && headerToken === configuredToken) {
    return true;
  }

  if (textbeeWebhookSecret) {
    const verified = verifyTextbeeWebhookSignature({
      rawBody,
      body,
      signature: request.headers.get("x-signature"),
      secret: textbeeWebhookSecret,
    });

    if (verified) {
      return true;
    }
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

  if (!isAuthorized(request, webhookRequest.rawBody, webhookRequest.body)) {
    return NextResponse.json({ error: "Unauthorized webhook request." }, { status: 401 });
  }

  const result = await applyOutboundStatusPayload(webhookRequest.body);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.code }
    );
  }

  return NextResponse.json({
    updated: true,
    outboundId: result.outboundId,
    status: result.status,
  });
}
