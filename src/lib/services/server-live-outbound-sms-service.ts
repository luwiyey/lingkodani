import { randomUUID } from "node:crypto";

import {
  readLiveSmsProvider,
  readSmsgateDeviceId,
  readSmsgatePassword,
  readSmsgateUsername,
  readTextbeeApiKey,
  readTextbeeDeviceId,
} from "@/lib/providers/sms/live-sms-config";
import { getSmsgateAuthHeader, getSmsgateBaseUrl } from "@/lib/providers/sms/smsgate";
import { isValidPhilippineMobileNumber } from "@/lib/sms-simulator";
import { recordRuntimeHealthFailure, recordRuntimeHealthSuccess } from "@/lib/system-health";
import { getTextbeeBaseUrl } from "@/lib/providers/sms/textbee";
import type { SendSmsInput, SendSmsResult } from "@/lib/providers/sms/types";

type SupportedProvider = "twilio" | "semaphore" | "generic" | "smsgate" | "textbee";

function getProvider(): SupportedProvider {
  return readLiveSmsProvider(process.env);
}

async function sendLiveSmsInternal(input: SendSmsInput): Promise<SendSmsResult> {
  const provider = getProvider();

  if (provider === "twilio") {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !from) {
      return {
        status: "failed",
        errorMessage: "Twilio environment variables are incomplete.",
      };
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: input.to,
        From: from,
        Body: input.body,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    return {
      status: response.ok ? "sent" : "failed",
      providerMessageId: payload.sid,
      errorMessage: response.ok ? undefined : payload.message ?? "Twilio send failed.",
    };
  }

  if (provider === "semaphore") {
    const apiKey = process.env.SEMAPHORE_API_KEY;
    const senderName = process.env.SEMAPHORE_SENDER_NAME;

    if (!apiKey || !senderName) {
      return {
        status: "failed",
        errorMessage: "Semaphore environment variables are incomplete.",
      };
    }

    const response = await fetch("https://api.semaphore.co/api/v4/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        apikey: apiKey,
        number: input.to,
        message: input.body,
        sendername: senderName,
      }),
    });

    const payload = await response.json().catch(() => ([]));
    const first = Array.isArray(payload) ? payload[0] : payload;

    return {
      status: response.ok ? "sent" : "failed",
      providerMessageId: first?.message_id ? String(first.message_id) : undefined,
      errorMessage: response.ok ? undefined : first?.message ?? "Semaphore send failed.",
    };
  }

  if (provider === "smsgate") {
    const username = readSmsgateUsername(process.env);
    const password = readSmsgatePassword(process.env);
    const sendEndpoint =
      process.env.SMSGATE_SEND_ENDPOINT?.trim() ||
      `${getSmsgateBaseUrl()}/messages`;

    if (!username || !password) {
      return {
        status: "failed",
        errorMessage: "SMSGate credentials are incomplete.",
      };
    }

    const requestId = `lingkodani-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const params = new URLSearchParams();
    const payload: Record<string, unknown> = {
      id: requestId,
      textMessage: {
        text: input.body,
      },
      phoneNumbers: [input.to],
      withDeliveryReport: true,
    };
    const deviceId = readSmsgateDeviceId(process.env);
    const simNumber = process.env.SMSGATE_SIM_NUMBER?.trim();
    const deviceActiveWithin = process.env.SMSGATE_DEVICE_ACTIVE_WITHIN?.trim();
    const skipPhoneValidation = process.env.SMSGATE_SKIP_PHONE_VALIDATION?.trim();
    const ttl = process.env.SMSGATE_TTL_SECONDS?.trim();
    const priority = process.env.SMSGATE_PRIORITY?.trim();

    if (deviceId) {
      payload.deviceId = deviceId;
    }

    if (simNumber && Number.isFinite(Number(simNumber))) {
      payload.simNumber = Number(simNumber);
    }

    if (ttl && Number.isFinite(Number(ttl))) {
      payload.ttl = Number(ttl);
    }

    if (priority && Number.isFinite(Number(priority))) {
      payload.priority = Number(priority);
    }

    if (deviceActiveWithin && deviceActiveWithin.length > 0) {
      params.set("deviceActiveWithin", deviceActiveWithin);
    }

    if (skipPhoneValidation && skipPhoneValidation.length > 0) {
      params.set("skipPhoneValidation", skipPhoneValidation);
    }

    const endpoint = params.size > 0 ? `${sendEndpoint}?${params.toString()}` : sendEndpoint;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: getSmsgateAuthHeader(username, password),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responsePayload = await response.json().catch(() => ({}));

    return {
      status: response.ok ? "sent" : "failed",
      providerMessageId: response.ok
        ? String(responsePayload.messageId ?? responsePayload.id ?? requestId)
        : undefined,
      errorMessage: response.ok
        ? undefined
        : responsePayload.error ?? responsePayload.message ?? "SMSGate send failed.",
    };
  }

  if (provider === "textbee") {
    const apiKey = readTextbeeApiKey(process.env);
    const deviceId = readTextbeeDeviceId(process.env);

    if (!apiKey || !deviceId) {
      return {
        status: "failed",
        errorMessage: "TextBee environment variables are incomplete.",
      };
    }

    const payload: Record<string, unknown> = {
      recipients: [input.to],
      message: input.body,
    };
    const simSubscriptionId = process.env.TEXTBEE_SIM_SUBSCRIPTION_ID?.trim();

    if (simSubscriptionId && Number.isFinite(Number(simSubscriptionId))) {
      payload.simSubscriptionId = Number(simSubscriptionId);
    }

    const response = await fetch(
      `${getTextbeeBaseUrl(process.env)}/gateway/devices/${encodeURIComponent(deviceId)}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    const responsePayload = await response.json().catch(() => ({}));

    return {
      status: response.ok ? "sent" : "failed",
      providerMessageId: response.ok
        ? String(
            responsePayload.smsId ??
              responsePayload.messageId ??
              responsePayload.id ??
              responsePayload.data?.smsId ??
              responsePayload.data?.id ??
              ""
          ) || undefined
        : undefined,
      errorMessage: response.ok
        ? undefined
        : responsePayload.error ?? responsePayload.message ?? "TextBee send failed.",
    };
  }

  const endpoint = process.env.GENERIC_SMS_WEBHOOK_URL;
  const token = process.env.GENERIC_SMS_WEBHOOK_TOKEN;

  if (!endpoint) {
    return {
      status: "failed",
      errorMessage: "GENERIC_SMS_WEBHOOK_URL is not configured.",
    };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      to: input.to,
      body: input.body,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  return {
    status: response.ok ? "sent" : "failed",
    providerMessageId: payload.id ?? payload.messageId,
    errorMessage: response.ok ? undefined : payload.error ?? "Generic SMS send failed.",
  };
}

export async function sendLiveSms(input: SendSmsInput): Promise<SendSmsResult> {
  if (!isValidPhilippineMobileNumber(input.to)) {
    await recordRuntimeHealthFailure("sms_outbound", "Live Outbound SMS", "Recipient phone must be a valid Philippine mobile number.", {
      recipientPhone: input.to,
      provider: getProvider(),
    });
    return {
      status: "failed",
      errorMessage: "Recipient phone must be a valid Philippine mobile number.",
    };
  }

  try {
    const result = await sendLiveSmsInternal(input);

    if (result.status === "failed") {
      await recordRuntimeHealthFailure("sms_outbound", "Live Outbound SMS", result.errorMessage ?? "Live SMS send failed.", {
        recipientPhone: input.to,
        provider: getProvider(),
      });
    } else {
      await recordRuntimeHealthSuccess("sms_outbound", "Live Outbound SMS", {
        recipientPhone: input.to,
        provider: getProvider(),
        providerMessageId: result.providerMessageId,
      });
    }

    return result;
  } catch (error) {
    await recordRuntimeHealthFailure("sms_outbound", "Live Outbound SMS", error, {
      recipientPhone: input.to,
      provider: getProvider(),
    });
    return {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Live SMS send failed.",
    };
  }
}
