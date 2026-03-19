import { NextResponse } from "next/server";

import type { RuntimeCapabilities } from "@/lib/runtime-capabilities";
import {
  readLiveSmsProvider,
  readSmsgateDeviceId,
  readSmsgatePassword,
  readSmsgateUsername,
  readTextbeeApiKey,
  readTextbeeDeviceId,
} from "@/lib/providers/sms/live-sms-config";

function isPresent(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function readMode(): "demo" | "live" {
  const raw = process.env.APP_MODE ?? process.env.NEXT_PUBLIC_APP_MODE ?? "demo";
  return raw === "live" ? "live" : "demo";
}

function readRealSmsEnabled() {
  return (process.env.ENABLE_REAL_SMS ?? process.env.NEXT_PUBLIC_ENABLE_REAL_SMS ?? "false") === "true";
}

function resolveFirebaseAdminConfigured() {
  if (
    isPresent(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) ||
    isPresent(process.env.FIREBASE_ADMIN_CREDENTIALS_PATH) ||
    isPresent(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    return true;
  }

  if (
    isPresent(process.env.FIREBASE_ADMIN_PROJECT_ID) &&
    isPresent(process.env.FIREBASE_CLIENT_EMAIL) &&
    isPresent(process.env.FIREBASE_PRIVATE_KEY)
  ) {
    return true;
  }

  return (process.env.FIREBASE_USE_APPLICATION_DEFAULT ?? "").toLowerCase() === "true";
}

function resolveLiveSmsStatus(mode: "demo" | "live", realSmsEnabled: boolean) {
  if (mode !== "live" || !realSmsEnabled) {
    return {
      configured: true,
      reason: "",
    };
  }

  const provider = readLiveSmsProvider(process.env);

  if (provider === "textbee") {
    const configured =
      isPresent(readTextbeeApiKey(process.env)) &&
      isPresent(readTextbeeDeviceId(process.env));

    return {
      configured,
      reason: configured
        ? ""
        : "Kailangan muna ang TEXTBEE_API_KEY at TEXTBEE_DEVICE_ID bago i-enable ang live SMS.",
    };
  }

  if (provider === "smsgate") {
    const configured =
      isPresent(readSmsgateUsername(process.env)) &&
      isPresent(readSmsgatePassword(process.env)) &&
      isPresent(readSmsgateDeviceId(process.env));

    return {
      configured,
      reason: configured
        ? ""
        : "Kailangan muna ang SMSGATE_USERNAME/SMS_USERNAME, SMSGATE_PASSWORD/SMS_PASSWORD, at SMSGATE_DEVICE_ID/SMS_DEVICE_ID bago i-enable ang live SMS.",
    };
  }

  if (provider === "twilio") {
    const configured =
      isPresent(process.env.TWILIO_ACCOUNT_SID) &&
      isPresent(process.env.TWILIO_AUTH_TOKEN) &&
      isPresent(process.env.TWILIO_FROM_NUMBER);

    return {
      configured,
      reason: configured
        ? ""
        : "Kailangan muna ang Twilio credentials bago i-enable ang live SMS.",
    };
  }

  if (provider === "semaphore") {
    const configured =
      isPresent(process.env.SEMAPHORE_API_KEY) &&
      isPresent(process.env.SEMAPHORE_SENDER_NAME);

    return {
      configured,
      reason: configured
        ? ""
        : "Kailangan muna ang Semaphore credentials bago i-enable ang live SMS.",
    };
  }

  const configured = isPresent(process.env.GENERIC_SMS_WEBHOOK_URL);

  return {
    configured,
    reason: configured
      ? ""
      : "Kailangan muna ang GENERIC_SMS_WEBHOOK_URL bago i-enable ang live SMS.",
  };
}

function resolveKnowledgeAudioUploadConfigured(mode: "demo" | "live") {
  if (mode !== "live") {
    return true;
  }

  return (
    isPresent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
    isPresent(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) &&
    isPresent(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
    isPresent(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) &&
    isPresent(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) &&
    isPresent(process.env.NEXT_PUBLIC_FIREBASE_APP_ID)
  );
}

export async function GET() {
  const mode = readMode();
  const realSmsEnabled = readRealSmsEnabled();
  const aiConfigured = isPresent(process.env.GOOGLE_GENAI_API_KEY) || isPresent(process.env.GEMINI_API_KEY);
  const firebaseAdminConfigured = resolveFirebaseAdminConfigured();
  const liveSmsStatus = resolveLiveSmsStatus(mode, realSmsEnabled);
  const knowledgeAudioUploadConfigured = resolveKnowledgeAudioUploadConfigured(mode);

  const payload: RuntimeCapabilities = {
    mode,
    aiConfigured,
    realSmsEnabled,
    liveSmsConfigured: liveSmsStatus.configured,
    firebaseAdminConfigured,
    knowledgeAudioUploadConfigured,
    reasons: {
      ai: aiConfigured
        ? undefined
        : "Naka-lock muna ang AI feature habang hindi pa configured ang Gemini/Genkit service sa server.",
      liveSms: liveSmsStatus.configured ? undefined : liveSmsStatus.reason,
      knowledgeAudio: knowledgeAudioUploadConfigured
        ? undefined
        : "Naka-lock muna ang audio upload habang hindi pa kumpleto ang live Firebase web/storage setup.",
    },
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
