import type {
  AlertHistoryEntry,
  AuditLog,
  Farmer,
  FarmerAssistanceRecord,
  FieldVisitTask,
  KnowledgeArticle,
  LogbookEntry,
  MarketPriceEntry,
  OutboundMessage,
  Resource,
  SmsMessage,
  SmsTrainingExample,
  SystemSettings,
  User,
  Voucher,
} from "@/lib/types";
import {
  farmerRegistrationSchema,
  userManagementSchema,
  type FarmerRegistrationValues,
  type UserManagementValues,
} from "@/lib/schemas";

export type PortableAppDataBundle = {
  farmers: Farmer[];
  smsMessages: SmsMessage[];
  outboundMessages: OutboundMessage[];
  resources: Resource[];
  marketPrices: MarketPriceEntry[];
  knowledgeArticles: KnowledgeArticle[];
  logbookEntries: LogbookEntry[];
  auditLogs: AuditLog[];
  alertHistory: AlertHistoryEntry[];
  assistanceRecords: FarmerAssistanceRecord[];
  fieldVisitTasks: FieldVisitTask[];
  smsTrainingExamples: SmsTrainingExample[];
  systemSettings: SystemSettings;
  vouchers: Voucher[];
};

export type PortableAppBackup = {
  version: 1;
  exportedAt: string;
  exportedBy?: string;
  data: PortableAppDataBundle;
};

type CsvRow = string[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(asString(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback = false) {
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

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function parseCsvRows(text: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: CsvRow = [];
  let value = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        value += '"';
        index += 1;
        continue;
      }

      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === "," && !insideQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(value);
      value = "";

      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    value += character;
  }

  row.push(value);

  if (row.some((cell) => cell.trim().length > 0)) {
    rows.push(row);
  }

  return rows;
}

function rowsToObjects(rows: CsvRow[]) {
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

export function formatSmsTrainingExamplesAsCsv(examples: SmsTrainingExample[]) {
  const rows = [
    [
      "id",
      "smsMessageId",
      "farmerId",
      "farmerName",
      "phone",
      "message",
      "inboundTimestamp",
      "analysisSource",
      "originalIntent",
      "originalUrgency",
      "originalSafetyFlag",
      "originalTone",
      "originalAdvice",
      "originalConfidence",
      "reviewAction",
      "finalStatus",
      "finalIntent",
      "finalUrgency",
      "finalSafetyFlag",
      "finalTone",
      "finalAdvice",
      "reviewedBy",
      "reviewedAt",
      "wasAdviceEdited",
    ],
    ...examples.map((example) => [
      example.id,
      example.smsMessageId,
      example.farmerId,
      example.farmerName,
      example.phone,
      example.message,
      example.inboundTimestamp,
      example.analysisSource,
      example.originalAnalysis.parsedIntent,
      example.originalAnalysis.urgency,
      example.originalAnalysis.safetyFlag,
      example.originalAnalysis.tone ?? "",
      example.originalAnalysis.aiAdvice,
      String(example.originalAnalysis.aiConfidence),
      example.finalReview.action,
      example.finalReview.status,
      example.finalReview.finalAnalysis.parsedIntent,
      example.finalReview.finalAnalysis.urgency,
      example.finalReview.finalAnalysis.safetyFlag,
      example.finalReview.finalAnalysis.tone ?? "",
      example.finalReview.finalAdvice,
      example.finalReview.reviewedBy,
      example.finalReview.reviewedAt,
      String(example.finalReview.wasAdviceEdited),
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

function coerceTrainingExample(record: Record<string, unknown>, index: number): SmsTrainingExample | null {
  const id = asString(record.id).trim() || `TRAIN-IMPORT-${Date.now()}-${index}`;
  const smsMessageId = asString(record.smsMessageId).trim();
  const farmerId = asString(record.farmerId).trim();
  const farmerName = asString(record.farmerName).trim();
  const phone = asString(record.phone).trim();
  const message = asString(record.message).trim();
  const inboundTimestamp = asString(record.inboundTimestamp).trim() || new Date().toISOString();
  const originalIntent = asString(record.originalIntent ?? record["originalAnalysis.parsedIntent"]).trim();
  const finalIntent = asString(record.finalIntent ?? record["finalReview.finalAnalysis.parsedIntent"] ?? originalIntent).trim();
  const reviewedAt = asString(record.reviewedAt ?? record["finalReview.reviewedAt"]).trim() || new Date().toISOString();
  const reviewedBy = asString(record.reviewedBy ?? record["finalReview.reviewedBy"]).trim() || "Imported Dataset";

  if (!smsMessageId || !farmerId || !farmerName || !phone || !message || !originalIntent) {
    return null;
  }

  return {
    id,
    smsMessageId,
    farmerId,
    farmerName,
    phone,
    message,
    inboundTimestamp,
    analysisSource: asString(record.analysisSource).trim() as SmsTrainingExample["analysisSource"] || "rules",
    originalAnalysis: {
      parsedIntent: originalIntent as SmsTrainingExample["originalAnalysis"]["parsedIntent"],
      urgency: asString(record.originalUrgency).trim() as SmsTrainingExample["originalAnalysis"]["urgency"] || "low",
      safetyFlag: asString(record.originalSafetyFlag).trim() as SmsTrainingExample["originalAnalysis"]["safetyFlag"] || "Low",
      tone: asString(record.originalTone).trim() as SmsTrainingExample["originalAnalysis"]["tone"] || undefined,
      aiAdvice: asString(record.originalAdvice).trim() || asString(record.aiAdvice).trim() || "Imported training example.",
      aiConfidence: asNumber(record.originalConfidence, 0.75),
    },
    finalReview: {
      action: asString(record.reviewAction).trim() as SmsTrainingExample["finalReview"]["action"] || "approved_as_is",
      status: asString(record.finalStatus).trim() as SmsTrainingExample["finalReview"]["status"] || "approved",
      finalAdvice: asString(record.finalAdvice).trim() || asString(record.originalAdvice).trim() || "Imported final advice.",
      finalAnalysis: {
        parsedIntent: finalIntent as SmsTrainingExample["finalReview"]["finalAnalysis"]["parsedIntent"],
        urgency: asString(record.finalUrgency).trim() as SmsTrainingExample["finalReview"]["finalAnalysis"]["urgency"] || asString(record.originalUrgency).trim() as SmsTrainingExample["finalReview"]["finalAnalysis"]["urgency"] || "low",
        safetyFlag: asString(record.finalSafetyFlag).trim() as SmsTrainingExample["finalReview"]["finalAnalysis"]["safetyFlag"] || asString(record.originalSafetyFlag).trim() as SmsTrainingExample["finalReview"]["finalAnalysis"]["safetyFlag"] || "Low",
        tone: asString(record.finalTone).trim() as SmsTrainingExample["finalReview"]["finalAnalysis"]["tone"] || asString(record.originalTone).trim() as SmsTrainingExample["finalReview"]["finalAnalysis"]["tone"] || undefined,
      },
      reviewedBy,
      reviewedAt,
      wasAdviceEdited: asBoolean(record.wasAdviceEdited),
    },
  };
}

export function parseSmsTrainingExamplesCsv(text: string) {
  return rowsToObjects(parseCsvRows(text))
    .map((record, index) => coerceTrainingExample(record, index))
    .filter((example): example is SmsTrainingExample => Boolean(example));
}

export function extractSmsTrainingExamplesFromJson(input: unknown): SmsTrainingExample[] {
  if (Array.isArray(input)) {
    return input.filter(isRecord)
      .map((record, index) => coerceTrainingExample(record, index))
      .filter((example): example is SmsTrainingExample => Boolean(example));
  }

  if (isPortableAppBackup(input)) {
    return input.data.smsTrainingExamples;
  }

  if (isRecord(input) && Array.isArray(input.smsTrainingExamples)) {
    return input.smsTrainingExamples
      .filter(isRecord)
      .map((record, index) => coerceTrainingExample(record, index))
      .filter((example): example is SmsTrainingExample => Boolean(example));
  }

  return [];
}

export function userToManagementValues(user: User): UserManagementValues {
  return {
    name: user.name,
    email: user.email,
    title: user.title ?? "Barangay Staff",
    phone: user.phone ?? "",
    role: user.role,
    status: user.status ?? "active",
    preferredWorkspace: user.preferredWorkspace ?? (user.role === "developer" ? "detailed" : "simple"),
  };
}

export function formatUsersAsCsv(users: User[]) {
  const rows = [
    ["name", "email", "title", "phone", "role", "status", "preferredWorkspace"],
    ...users.map((user) => {
      const mapped = userToManagementValues(user);
      return [
        mapped.name,
        mapped.email,
        mapped.title,
        mapped.phone,
        mapped.role,
        mapped.status,
        mapped.preferredWorkspace,
      ];
    }),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

function coerceUserManagementValue(record: Record<string, unknown>) {
  const parsed = userManagementSchema.safeParse({
    name: asString(record.name).trim(),
    email: asString(record.email).trim().toLowerCase(),
    title: asString(record.title).trim(),
    phone: asString(record.phone).trim(),
    role: asString(record.role).trim() || "barangay",
    status: asString(record.status).trim() || "active",
    preferredWorkspace: asString(record.preferredWorkspace).trim() || "simple",
  });

  return parsed.success ? parsed.data : null;
}

export function parseUsersCsv(text: string) {
  return rowsToObjects(parseCsvRows(text))
    .map((record) => coerceUserManagementValue(record))
    .filter((record): record is UserManagementValues => Boolean(record));
}

export function extractUserManagementValuesFromJson(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(isRecord)
    .map((record) => coerceUserManagementValue(record))
    .filter((record): record is UserManagementValues => Boolean(record));
}

type ResourceImportRecord = {
  name: string;
  category: Resource["category"];
  stock: number;
  unit: string;
};

function coerceResourceRecord(record: Record<string, unknown>) {
  const name = asString(record.name).trim();
  const category = asString(record.category).trim() as Resource["category"];
  const unit = asString(record.unit).trim();
  const stock = asNumber(record.stock);

  if (!name || !category || !unit || !Number.isFinite(stock)) {
    return null;
  }

  return {
    name,
    category,
    stock,
    unit,
  } satisfies ResourceImportRecord;
}

export function formatResourcesAsCsv(resources: Resource[]) {
  const rows = [
    ["name", "category", "stock", "unit", "lastUpdated"],
    ...resources.map((resource) => [
      resource.name,
      resource.category,
      String(resource.stock),
      resource.unit,
      resource.lastUpdated,
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

export function parseResourcesCsv(text: string) {
  return rowsToObjects(parseCsvRows(text))
    .map((record) => coerceResourceRecord(record))
    .filter((record): record is ResourceImportRecord => Boolean(record));
}

export function extractResourcesFromJson(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(isRecord)
    .map((record) => coerceResourceRecord(record))
    .filter((record): record is ResourceImportRecord => Boolean(record));
}

function coerceFarmerRegistrationRecord(record: Record<string, unknown>) {
  const parsed = farmerRegistrationSchema.safeParse({
    name: asString(record.name).trim(),
    phone: asString(record.phone).trim(),
    barangay: asString(record.barangay).trim() || "Batakil",
    sitio: asString(record.sitio).trim(),
    crops: asString(record.crops).trim() || undefined,
    farmSize: asString(record.farmSize).trim() || undefined,
    age: asString(record.age).trim() || undefined,
    gender: asString(record.gender).trim() || undefined,
  });

  return parsed.success ? parsed.data : null;
}

export function formatFarmerRegistrationsAsCsv(farmers: Farmer[]) {
  const rows = [
    ["name", "phone", "barangay", "sitio", "crops", "farmSize", "age", "gender", "status"],
    ...farmers.map((farmer) => [
      farmer.name,
      farmer.phone,
      farmer.barangay,
      farmer.sitio,
      farmer.crops.join(", "),
      String(farmer.farmSize),
      String(farmer.age),
      farmer.gender,
      farmer.status,
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

export function parseFarmerRegistrationsCsv(text: string) {
  return rowsToObjects(parseCsvRows(text))
    .map((record) => coerceFarmerRegistrationRecord(record))
    .filter((record): record is FarmerRegistrationValues => Boolean(record));
}

export function extractFarmerRegistrationsFromJson(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(isRecord)
    .map((record) => coerceFarmerRegistrationRecord(record))
    .filter((record): record is FarmerRegistrationValues => Boolean(record));
}

function coerceKnowledgeArticle(record: Record<string, unknown>, index: number): KnowledgeArticle | null {
  const title = asString(record.title).trim();
  const content = asString(record.content).trim();
  const type = asString(record.type).trim() as KnowledgeArticle["type"];

  if (!title || !content) {
    return null;
  }

  const keywordsValue = record.keywords;
  const keywords = Array.isArray(keywordsValue)
    ? keywordsValue.map((value) => asString(value).trim()).filter(Boolean)
    : asString(keywordsValue)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  return {
    id: asString(record.id).trim() || `KB-IMPORT-${Date.now()}-${index}`,
    title,
    summary: asString(record.summary).trim() || content.slice(0, 160),
    content,
    keywords,
    lastUpdated: asString(record.lastUpdated).trim() || new Date().toISOString(),
    author: asString(record.author).trim() || "Imported Knowledge File",
    type: type || "article",
    audioUrl: asString(record.audioUrl).trim() || undefined,
  };
}

export function formatKnowledgeArticlesAsCsv(articles: KnowledgeArticle[]) {
  const rows = [
    ["id", "title", "summary", "content", "keywords", "type", "author", "lastUpdated", "audioUrl"],
    ...articles.map((article) => [
      article.id,
      article.title,
      article.summary,
      article.content,
      article.keywords.join(", "),
      article.type,
      article.author,
      article.lastUpdated,
      article.audioUrl ?? "",
    ]),
  ];

  return rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

export function parseKnowledgeArticlesCsv(text: string) {
  return rowsToObjects(parseCsvRows(text))
    .map((record, index) => coerceKnowledgeArticle(record, index))
    .filter((record): record is KnowledgeArticle => Boolean(record));
}

export function extractKnowledgeArticlesFromJson(input: unknown) {
  if (Array.isArray(input)) {
    return input
      .filter(isRecord)
      .map((record, index) => coerceKnowledgeArticle(record, index))
      .filter((record): record is KnowledgeArticle => Boolean(record));
  }

  if (isPortableAppBackup(input)) {
    return input.data.knowledgeArticles;
  }

  if (isRecord(input) && Array.isArray(input.knowledgeArticles)) {
    return input.knowledgeArticles
      .filter(isRecord)
      .map((record, index) => coerceKnowledgeArticle(record, index))
      .filter((record): record is KnowledgeArticle => Boolean(record));
  }

  return [];
}

export function isPortableAppBackup(input: unknown): input is PortableAppBackup {
  if (!isRecord(input) || !isRecord(input.data)) {
    return false;
  }

  return Array.isArray(input.data.farmers) &&
    Array.isArray(input.data.smsMessages) &&
    Array.isArray(input.data.resources) &&
    isRecord(input.data.systemSettings);
}
