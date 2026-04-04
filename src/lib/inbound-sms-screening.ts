import { isValidPhilippineMobileNumber, normalizePhone } from "@/lib/sms-simulator";

const CARRIER_ALIASES = new Set([
  "smart",
  "smartph",
  "tnt",
  "tntph",
  "sun",
  "globe",
  "tm",
  "dito",
  "gomo",
]);

const CARRIER_ALIAS_PREFIXES = [
  "smart",
  "tnt",
  "globe",
  "dito",
  "gomo",
];

const STRONG_PROMO_KEYWORDS = [
  "free data",
  "open access data",
  "smart app",
  "latest offers",
  "tiktok subscription",
  "sim registration",
  "text all",
  "call and text",
  "reply stop",
  "surf saya",
  "giga",
];

const WEAK_PROMO_KEYWORDS = [
  "promo",
  "load ",
  "load now",
  "unli",
  "subscription mo",
  "dial *",
  "all-net",
  "all net",
];

function normalizeSenderAlias(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function matchesCarrierAlias(senderAlias: string) {
  return (
    CARRIER_ALIASES.has(senderAlias) ||
    CARRIER_ALIAS_PREFIXES.some((prefix) => senderAlias.startsWith(prefix))
  );
}

function analyzeCarrierPromo(message: string) {
  const lower = message.toLowerCase();
  const strongMatches = STRONG_PROMO_KEYWORDS.filter((keyword) => lower.includes(keyword));
  const weakMatches = WEAK_PROMO_KEYWORDS.filter((keyword) => lower.includes(keyword));

  return {
    strongMatches: strongMatches.length,
    weakMatches: weakMatches.length,
  };
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
  const isValidMobile = isValidPhilippineMobileNumber(input.phone);
  const promoSignals = analyzeCarrierPromo(input.message);

  if (
    matchesCarrierAlias(senderAlias) ||
    promoSignals.strongMatches > 0 ||
    promoSignals.weakMatches >= 2 ||
    (!isValidMobile && promoSignals.weakMatches > 0)
  ) {
    return {
      ignored: true,
      reason: "carrier_promo",
      normalizedPhone,
    };
  }

  if (isValidMobile) {
    return {
      ignored: false,
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

type SmsScreeningCandidate = {
  phone: string;
  message: string;
};

export function isVisibleInboundSmsMessage(input: SmsScreeningCandidate) {
  return !screenInboundSms(input).ignored;
}

export function filterVisibleInboundSmsMessages<T extends SmsScreeningCandidate>(messages: T[]) {
  return messages.filter((message) => isVisibleInboundSmsMessage(message));
}
