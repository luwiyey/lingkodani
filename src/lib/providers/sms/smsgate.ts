import { createHmac, timingSafeEqual } from "node:crypto";

import { getStringAtPaths, type WebhookPayloadRecord } from "@/lib/webhook-request";
import { readSmsgateBaseUrl } from "@/lib/providers/sms/live-sms-config";

export const SMSGATE_DEFAULT_BASE_URL = "https://api.sms-gate.app/3rdparty/v1";

function encodeBase64(value: string) {
  return Buffer.from(value).toString("base64");
}

export function getSmsgateAuthHeader(username: string, password: string) {
  return `Basic ${encodeBase64(`${username}:${password}`)}`;
}

export function getSmsgateBaseUrl() {
  const configured = readSmsgateBaseUrl(process.env);
  return (configured && configured.length > 0 ? configured : SMSGATE_DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export function isSmsgatePayload(body: WebhookPayloadRecord) {
  const event = getStringAtPaths(body, ["event"]);
  const deviceId = getStringAtPaths(body, ["deviceId"]);
  const payloadMessageId = getStringAtPaths(body, ["payload", "messageId"]);

  return Boolean(event?.startsWith("sms:") || event?.startsWith("mms:") || deviceId || payloadMessageId);
}

export function verifySmsgateWebhookSignature(input: {
  rawBody: string;
  timestamp?: string | null;
  signature?: string | null;
  secret: string;
  maxAgeSeconds?: number;
}) {
  const {
    rawBody,
    timestamp,
    signature,
    secret,
    maxAgeSeconds = 300,
  } = input;

  if (!timestamp || !signature) {
    return false;
  }

  const parsedTimestamp = Number(timestamp);

  if (!Number.isFinite(parsedTimestamp)) {
    return false;
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - parsedTimestamp);

  if (ageSeconds > maxAgeSeconds) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${rawBody}${timestamp}`)
    .digest("hex");
  const providedSignature = signature.trim().toLowerCase();

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
