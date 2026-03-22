import { parseCsvRows } from "@/lib/data-portability";
import type {
  SafetyFlag,
  SmsIntent,
  SmsLexiconRule,
  SmsTone,
  SmsUrgency,
} from "@/lib/types";

const VALID_INTENTS: SmsIntent[] = [
  "REGISTER",
  "CROP_UPDATE",
  "HARVEST",
  "REQUEST",
  "PEST_DISEASE",
  "WEATHER_HELP",
  "PRICE_CHECK",
  "EMERGENCY",
  "UNKNOWN",
];
const VALID_URGENCY: SmsUrgency[] = ["low", "medium", "high"];
const VALID_SAFETY: SafetyFlag[] = ["Low", "Medium", "High"];
const VALID_TONES: SmsTone[] = [
  "Neutral",
  "Nag-aalala",
  "Kritikal",
  "Positibo",
];

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function asBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = asString(value).trim().toLowerCase();

  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeIntent(value: unknown) {
  const normalized = asString(value).trim().toUpperCase() as SmsIntent;
  return VALID_INTENTS.includes(normalized) ? normalized : "UNKNOWN";
}

function normalizeUrgency(value: unknown) {
  const normalized = asString(value).trim().toLowerCase() as SmsUrgency;
  return VALID_URGENCY.includes(normalized) ? normalized : "medium";
}

function normalizeSafetyFlag(value: unknown) {
  const raw = asString(value).trim().toLowerCase();

  if (raw === "low") return "Low";
  if (raw === "medium") return "Medium";
  if (raw === "high") return "High";
  return "Low";
}

function normalizeTone(value: unknown) {
  const raw = asString(value).trim();
  return VALID_TONES.includes(raw as SmsTone) ? (raw as SmsTone) : undefined;
}

function coerceLexiconRule(
  record: Record<string, unknown>,
  index: number
): SmsLexiconRule | null {
  const phrase = asString(record.phrase).trim();
  const guidance = asString(record.guidance).trim();

  if (!phrase || !guidance) {
    return null;
  }

  return {
    id: asString(record.id).trim() || `LEX-${Date.now()}-${index}`,
    phrase,
    intent: normalizeIntent(record.intent),
    urgency: normalizeUrgency(record.urgency),
    safetyFlag: normalizeSafetyFlag(record.safetyFlag),
    tone: normalizeTone(record.tone),
    guidance,
    enabled: asBoolean(record.enabled, true),
    applicability: asString(record.applicability).trim() || undefined,
    notes: asString(record.notes).trim() || undefined,
    createdAt: asString(record.createdAt).trim() || undefined,
    updatedAt: asString(record.updatedAt).trim() || undefined,
  };
}

function rowsToObjects(rows: string[][]) {
  const [headerRow, ...dataRows] = rows;

  if (!headerRow) {
    return [];
  }

  return dataRows.map((row) =>
    Object.fromEntries(
      headerRow.map((header, index) => [header.trim(), row[index] ?? ""])
    )
  );
}

export function formatSmsLexiconRulesAsCsv(rules: SmsLexiconRule[]) {
  const rows = [
    [
      "id",
      "phrase",
      "intent",
      "urgency",
      "safetyFlag",
      "tone",
      "guidance",
      "enabled",
      "applicability",
      "notes",
    ],
    ...rules.map((rule) => [
      rule.id,
      rule.phrase,
      rule.intent,
      rule.urgency,
      rule.safetyFlag,
      rule.tone ?? "",
      rule.guidance,
      String(rule.enabled),
      rule.applicability ?? "",
      rule.notes ?? "",
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

export function parseSmsLexiconRulesCsv(text: string) {
  return rowsToObjects(parseCsvRows(text))
    .map((record, index) => coerceLexiconRule(record, index))
    .filter((rule): rule is SmsLexiconRule => Boolean(rule));
}

export function extractSmsLexiconRulesFromJson(input: unknown) {
  if (Array.isArray(input)) {
    return input
      .filter(isRecord)
      .map((record, index) => coerceLexiconRule(record, index))
      .filter((rule): rule is SmsLexiconRule => Boolean(rule));
  }

  if (isRecord(input) && Array.isArray(input.smsLexiconRules)) {
    return input.smsLexiconRules
      .filter(isRecord)
      .map((record, index) => coerceLexiconRule(record, index))
      .filter((rule): rule is SmsLexiconRule => Boolean(rule));
  }

  return [];
}
