import type { MarketPriceEntry, MarketPriceTrend, SmsMessage } from "@/lib/types";

const STALE_AFTER_DAYS = 3;

const CROP_ALIASES: Record<string, string[]> = {
  palay: ["rice", "bigas"],
  mais: ["corn"],
  kamatis: ["tomato"],
  sili: ["chili", "chili pepper"],
  okra: [],
  gulay: ["vegetable", "vegetables"],
  tubo: ["sugarcane"],
  tabako: ["tobacco"],
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function getMarketPriceTrendLabel(trend: MarketPriceTrend) {
  switch (trend) {
    case "up":
      return "tumataas";
    case "down":
      return "bumababa";
    default:
      return "steady";
  }
}

export function isMarketPriceStale(entry: MarketPriceEntry, referenceDate = new Date()) {
  const updatedAt = new Date(entry.updatedAt).getTime();
  if (Number.isNaN(updatedAt)) {
    return true;
  }

  return referenceDate.getTime() - updatedAt > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}

export function sortMarketPricesByUpdatedAt(entries: MarketPriceEntry[]) {
  return [...entries].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export function getLatestMarketPriceTimestamp(entries: MarketPriceEntry[]) {
  return sortMarketPricesByUpdatedAt(entries)[0]?.updatedAt;
}

export function countStaleMarketPrices(entries: MarketPriceEntry[], referenceDate = new Date()) {
  return entries.filter((entry) => isMarketPriceStale(entry, referenceDate)).length;
}

function uniqueByCrop(entries: MarketPriceEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const normalizedCrop = normalizeText(entry.crop);
    if (seen.has(normalizedCrop)) {
      return false;
    }
    seen.add(normalizedCrop);
    return true;
  });
}

export function getRelevantMarketPrices(message: string, entries: MarketPriceEntry[]) {
  const normalizedMessage = normalizeText(message);
  const sorted = sortMarketPricesByUpdatedAt(entries);

  const matched = sorted.filter((entry) => {
    const normalizedCrop = normalizeText(entry.crop);
    const aliases = [normalizedCrop, ...(CROP_ALIASES[normalizedCrop] ?? [])];
    return aliases.some((alias) => normalizedMessage.includes(alias));
  });

  return uniqueByCrop(matched.length > 0 ? matched : sorted).slice(0, 3);
}

export function buildPriceCheckAdvice(message: string, entries: MarketPriceEntry[]) {
  if (entries.length === 0) {
    return "Natanggap namin ang inyong tanong sa presyo, ngunit wala pang na-update na barangay price watch data sa ngayon. Makipag-ugnayan sa barangay hall para sa manual na presyo.";
  }

  const selectedEntries = getRelevantMarketPrices(message, entries);
  const latestTimestamp = getLatestMarketPriceTimestamp(selectedEntries) ?? new Date().toISOString();
  const needsRefresh = selectedEntries.some((entry) => isMarketPriceStale(entry));
  const priceSummary = selectedEntries
    .map((entry) => `${entry.crop}: ${formatPeso(entry.price)}/${entry.unit} mula sa ${entry.source} (${getMarketPriceTrendLabel(entry.trend)})`)
    .join("; ");

  return `Narito ang barangay price watch update: ${priceSummary}. Huling update: ${new Date(latestTimestamp).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}.${needsRefresh ? " Paalala: may ilang presyong kailangan nang i-refresh para mas siguradong updated." : ""}`;
}

export function applyPriceWatchAdvice(message: SmsMessage, entries: MarketPriceEntry[]): SmsMessage {
  if (message.parsedIntent !== "PRICE_CHECK" || message.registrationRequired) {
    return message;
  }

  return {
    ...message,
    aiAdvice: buildPriceCheckAdvice(message.message, entries),
    aiConfidence: Math.max(message.aiConfidence, 0.96),
  };
}
