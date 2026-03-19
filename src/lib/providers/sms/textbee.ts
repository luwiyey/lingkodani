import { createHmac, timingSafeEqual } from "node:crypto";

import { getStringAtPaths, type WebhookPayloadRecord } from "@/lib/webhook-request";

export const TEXTBEE_DEFAULT_BASE_URL = "https://api.textbee.dev/api/v1";

function normalizeSignature(signature: string) {
  return signature.trim().replace(/^sha256=/i, "").toLowerCase();
}

function createSignature(secret: string, payload: string) {
  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

function signaturesMatch(providedSignature: string, expectedSignature: string) {
  if (
    providedSignature.length !== expectedSignature.length ||
    !/^[a-f0-9]+$/.test(providedSignature)
  ) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(providedSignature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export function getTextbeeBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  return (env.TEXTBEE_BASE_URL?.trim() || TEXTBEE_DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export function isTextbeePayload(body: WebhookPayloadRecord) {
  const webhookEvent = getStringAtPaths(body, ["webhookEvent"]);
  const smsId = getStringAtPaths(body, ["smsId"]);
  const sender = getStringAtPaths(body, ["sender"]);
  const deviceId = getStringAtPaths(body, ["deviceId"]);

  return Boolean(webhookEvent || smsId || (sender && deviceId));
}

export function verifyTextbeeWebhookSignature(input: {
  rawBody: string;
  body: WebhookPayloadRecord;
  signature?: string | null;
  secret: string;
}) {
  const { rawBody, body, signature, secret } = input;

  if (!signature) {
    return false;
  }

  const normalizedSignature = normalizeSignature(signature);
  const payloadCandidates = [
    rawBody.trim(),
    JSON.stringify(body),
  ].filter((candidate) => candidate.length > 0);

  return payloadCandidates.some((candidate) =>
    signaturesMatch(normalizedSignature, createSignature(secret, candidate))
  );
}
