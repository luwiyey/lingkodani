import { getTextbeeBaseUrl } from "@/lib/providers/sms/textbee";
import {
  readTextbeeApiKey,
  readTextbeeDeviceId,
} from "@/lib/providers/sms/live-sms-config";
import { persistLiveInboundSms } from "@/lib/services/server-live-inbound-sms-service";

type TextbeeInboxItem = {
  _id?: string;
  message?: string;
  sender?: string;
  type?: string;
  status?: string;
  receivedAt?: string;
  createdAt?: string;
};

type TextbeeInboxResponse = {
  data?: TextbeeInboxItem[];
};

function normalizeSender(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function looksLikePhilippineMobileSender(value?: string) {
  if (!value) {
    return false;
  }

  const normalized = normalizeSender(value);
  return /^(\+639|09)\d{9}$/.test(normalized);
}

export async function syncTextbeeInbox(limit = 50) {
  const apiKey = readTextbeeApiKey(process.env);
  const deviceId = readTextbeeDeviceId(process.env);

  if (!apiKey || !deviceId) {
    throw new Error(
      "TextBee inbox sync is unavailable because TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID is missing."
    );
  }

  const url = new URL(
    `${getTextbeeBaseUrl(process.env)}/gateway/devices/${encodeURIComponent(
      deviceId
    )}/get-received-sms`
  );
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as TextbeeInboxResponse & {
    error?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(
      payload.error ??
        payload.message ??
        `TextBee inbox sync failed with HTTP ${response.status}.`
    );
  }

  const inboxItems = Array.isArray(payload.data) ? payload.data : [];
  const eligibleItems = inboxItems
    .filter((item) => item.type === "RECEIVED" || item.status === "received")
    .filter((item) => item.message && item.message.trim().length > 0)
    .filter((item) => looksLikePhilippineMobileSender(item.sender))
    .sort((left, right) => {
      const leftTime = new Date(left.receivedAt ?? left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.receivedAt ?? right.createdAt ?? 0).getTime();
      return leftTime - rightTime;
    });

  let persistedCount = 0;
  let duplicateCount = 0;
  let ignoredCount = 0;
  const errors: Array<{ externalId?: string; sender?: string; error: string }> = [];

  for (const item of eligibleItems) {
    try {
      const result = await persistLiveInboundSms({
        phone: item.sender!,
        message: item.message!,
        sourceProvider: "textbee",
        externalId: item._id,
        receivedAt: item.receivedAt ?? item.createdAt,
      });

      if (result.duplicate) {
        duplicateCount += 1;
      } else if (result.ignored) {
        ignoredCount += 1;
      } else if (result.persisted) {
        persistedCount += 1;
      }
    } catch (error) {
      errors.push({
        externalId: item._id,
        sender: item.sender,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    fetchedCount: inboxItems.length,
    eligibleCount: eligibleItems.length,
    persistedCount,
    duplicateCount,
    ignoredCount,
    failedCount: errors.length,
    errors,
  };
}
