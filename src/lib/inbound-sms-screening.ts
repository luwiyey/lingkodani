import { isValidPhilippineMobileNumber, normalizePhone } from "@/lib/sms-simulator";

const CARRIER_ALIASES = new Set([
  "smart",
  "tnt",
  "sun",
  "globe",
  "tm",
  "dito",
  "gomo",
]);

const PROMO_KEYWORDS = [
  "free data",
  "open access data",
  "smart app",
  "latest offers",
  "tiktok subscription",
  "promo",
  "load ",
  "load now",
  "unli",
  "dial *",
  "subscription mo",
];

function normalizeSenderAlias(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function looksLikeCarrierPromo(message: string) {
  const lower = message.toLowerCase();
  return PROMO_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export type InboundSmsScreeningResult = {
  ignored: boolean;
  reason?: "invalid_sender" | "carrier_promo";
  normalizedPhone: string;
};

export function screenInboundSms(input: {
  phone: string;
  message: string;
}): InboundSmsScreeningResult {
  const normalizedPhone = normalizePhone(input.phone);
  const senderAlias = normalizeSenderAlias(input.phone);

  if (isValidPhilippineMobileNumber(input.phone)) {
    return {
      ignored: false,
      normalizedPhone,
    };
  }

  if (
    CARRIER_ALIASES.has(senderAlias) ||
    (normalizedPhone.length === 0 && looksLikeCarrierPromo(input.message))
  ) {
    return {
      ignored: true,
      reason: "carrier_promo",
      normalizedPhone,
    };
  }

  if (normalizedPhone.length === 0) {
    return {
      ignored: true,
      reason: "invalid_sender",
      normalizedPhone,
    };
  }

  return {
    ignored: true,
    reason: "invalid_sender",
    normalizedPhone,
  };
}
