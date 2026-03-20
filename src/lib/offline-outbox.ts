import type { SmsMessageUpdate } from "@/lib/repositories/sms/types";
import type {
  AuditLog,
  Farmer,
  FarmerAssistanceRecord,
  FieldVisitTask,
  KnowledgeArticle,
  LogbookEntry,
  SmsMessage,
  SmsTrainingExample,
  SystemSettings,
} from "@/lib/types";

const OFFLINE_OUTBOX_STORAGE_KEY = "lingkodani:offline-outbox";

type OfflineMutationBase<TType extends string, TPayload> = {
  id: string;
  type: TType;
  createdAt: string;
  payload: TPayload;
  attempts?: number;
  lastError?: string;
};

export type OfflineMutation =
  | OfflineMutationBase<"save-system-settings", { settings: SystemSettings }>
  | OfflineMutationBase<"update-farmer-record", {
      farmerId: string;
      updates: Partial<Farmer>;
      auditLog: AuditLog;
    }>
  | OfflineMutationBase<"create-logbook-entry", { entry: LogbookEntry }>
  | OfflineMutationBase<"create-assistance-activity", {
      record: FarmerAssistanceRecord;
      logbookEntry: LogbookEntry;
      auditLog: AuditLog;
    }>
  | OfflineMutationBase<"update-assistance-status", {
      recordId: string;
      updates: Partial<FarmerAssistanceRecord>;
      logbookEntry: LogbookEntry;
      auditLog: AuditLog;
    }>
  | OfflineMutationBase<"schedule-field-visit", {
      task: FieldVisitTask;
      logbookEntry: LogbookEntry;
      auditLog: AuditLog;
    }>
  | OfflineMutationBase<"update-field-visit-status", {
      taskId: string;
      updates: Partial<FieldVisitTask>;
      logbookEntry: LogbookEntry;
      auditLog: AuditLog;
    }>
  | OfflineMutationBase<"update-sms-message", {
      messageId: string;
      updates: SmsMessageUpdate;
      auditLog?: AuditLog;
      responseLogbookEntry?: LogbookEntry;
      trainingExample?: SmsTrainingExample;
      outboundReply?: {
        sourceMessage: SmsMessage;
        body: string;
        providerName: string;
      };
    }>
  | OfflineMutationBase<"assign-sms-message", {
      messageId: string;
      updates: SmsMessageUpdate;
      auditLog: AuditLog;
    }>
  | OfflineMutationBase<"update-sms-case-outcome", {
      messageId: string;
      updates: SmsMessageUpdate;
      auditLog: AuditLog;
      logbookEntry: LogbookEntry;
    }>
  | OfflineMutationBase<"close-sms-case", {
      messageId: string;
      updates: SmsMessageUpdate;
      auditLog: AuditLog;
      logbookEntry: LogbookEntry;
    }>
  | OfflineMutationBase<"create-knowledge-article", {
      article: KnowledgeArticle;
    }>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function getOfflineOutboxStorageKey() {
  return OFFLINE_OUTBOX_STORAGE_KEY;
}

export function createOfflineMutationId(scope: string) {
  return `offline-${scope}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sanitizeLogbookEntry(entry: LogbookEntry): LogbookEntry {
  return {
    ...entry,
    icon: undefined,
  };
}

function normalizeOfflineMutation(value: unknown): OfflineMutation | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = typeof value.id === "string" ? value.id : "";
  const type = typeof value.type === "string" ? value.type : "";
  const createdAt = typeof value.createdAt === "string" ? value.createdAt : "";
  const payload = value.payload;

  if (!id || !type || !createdAt || !isRecord(payload)) {
    return null;
  }

  return {
    id,
    type,
    createdAt,
    payload,
    attempts: typeof value.attempts === "number" ? value.attempts : undefined,
    lastError: typeof value.lastError === "string" ? value.lastError : undefined,
  } as OfflineMutation;
}

export function readOfflineMutations(storage?: Storage | null) {
  if (!storage) {
    return [] as OfflineMutation[];
  }

  try {
    const raw = storage.getItem(OFFLINE_OUTBOX_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeOfflineMutation(item))
      .filter((item): item is OfflineMutation => Boolean(item));
  } catch {
    return [];
  }
}

export function writeOfflineMutations(mutations: OfflineMutation[], storage?: Storage | null) {
  if (!storage) {
    return;
  }

  storage.setItem(OFFLINE_OUTBOX_STORAGE_KEY, JSON.stringify(mutations));
}

export function appendOfflineMutation(mutation: OfflineMutation, storage?: Storage | null) {
  const next = [...readOfflineMutations(storage), mutation];
  writeOfflineMutations(next, storage);
  return next;
}

export function clearOfflineMutations(storage?: Storage | null) {
  if (!storage) {
    return;
  }

  storage.removeItem(OFFLINE_OUTBOX_STORAGE_KEY);
}
