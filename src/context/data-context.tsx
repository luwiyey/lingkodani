
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import type {
  AlertHistoryEntry,
  AlertHistorySeverity,
  AlertHistorySource,
  AlertHistoryType,
  AssistanceStatus,
  AuditLog,
  Farmer,
  FarmerAssistanceRecord,
  FieldVisitPriority,
  FieldVisitStatus,
  FieldVisitTask,
  KnowledgeArticle,
  KnowledgeArticleType,
  LogbookEntry,
  MarketPriceEntry,
  OutboundMessage,
  Resource,
  SmsCaseOutcomeStatus,
  SmsResolutionConfirmationStatus,
  SmsMessage,
  SmsTrainingExample,
  SystemSettings,
  User,
  Voucher,
  VoucherStatus,
} from '@/lib/types';
import { 
    alertHistory as initialAlertHistory,
    assistanceRecords as initialAssistanceRecords,
    farmers as initialFarmers, 
    fieldVisitTasks as initialFieldVisitTasks,
    outboundMessages as initialOutboundMessages,
    smsMessages as initialSmsMessages,
    smsTrainingExamples as initialSmsTrainingExamples,
    marketPrices as initialMarketPrices,
    resources as initialResources,
    knowledgeArticles as initialKnowledgeArticles,
    farmerLogbookEntries as initialLogbookEntries,
    auditLogs as initialAuditLogs,
    registeredUsers as initialUsers,
    vouchers as initialVouchers
} from '@/lib/data';
import type { FarmerRegistrationValues, UserManagementValues } from '@/lib/schemas';
import type { InboundSmsAnalysis } from '@/lib/sms-simulator';
import { isDemoMode, isLiveMode } from '@/lib/config/app-mode';
import { useAuth } from '@/context/auth-context';
import { getClientAuth } from '@/lib/firebase/auth-client';
import { getClientFirestore } from '@/lib/firebase/client';
import { firebaseCollections } from '@/lib/firebase/collections';
import { withFirestoreDocId } from '@/lib/firebase/with-firestore-doc-id';
import { smsProvider } from '@/lib/providers/sms';
import { alertHistoryRepository, assistanceRepository, auditRepository, farmerRepository, fieldVisitRepository, knowledgeRepository, logbookRepository, marketPriceRepository, outboundMessageRepository, resourceRepository, smsRepository, smsTrainingRepository, systemSettingsRepository, userRepository, voucherRepository } from '@/lib/repositories';
import { clearDemoStoreData } from '@/lib/repositories/demo-store';
import { DEMO_PREVIEW_EVENT } from '@/lib/onboarding';
import type { PortableAppBackup, PortableAppDataBundle } from '@/lib/data-portability';
import { isAutoReplyOverdue } from '@/lib/services/auto-reply-service';
import { processDueFollowUpMessage, isFollowUpDue } from '@/lib/services/follow-up-service';
import { processOverdueSmsMessage } from '@/lib/services/overdue-sms-service';
import { sendOutboundMessage } from '@/lib/services/outbound-sms-service';
import { applyPriceWatchAdvice } from '@/lib/services/price-watch-service';
import { applyFarmerResolutionConfirmation, parseFarmerResolutionConfirmationReply } from '@/lib/services/resolution-confirmation-service';
import { createSmsTrainingExample } from '@/lib/services/sms-training-service';
import { applySmsStatusUpdate, processInboundSms } from '@/lib/services/sms-workflow-service';
import { processOfficialReminderMessage } from '@/lib/services/staff-sms-service';
import { filterVisibleInboundSmsMessages, screenInboundSms } from '@/lib/inbound-sms-screening';
import { getSmsCaseResolutionReadiness } from '@/lib/sms-case-quality';
import { getCaseStatusForOutcome, getSmsCaseOutcomeMeta } from '@/lib/sms-case-outcomes';
import { applyDataRetentionSweep } from '@/lib/data-retention';
import { buildFarmerProfileRevision, reconcileFarmerIdentity } from '@/lib/farmer-identity';
import {
  appendOfflineMutation,
  createOfflineMutationId,
  readOfflineMutations,
  sanitizeLogbookEntry,
  writeOfflineMutations,
  type OfflineMutation,
} from '@/lib/offline-outbox';
import { defaultSystemSettings, mergeSystemSettings, SYSTEM_SETTINGS_DOCUMENT_ID } from '@/lib/system-settings';
import { getUserAssignmentId } from '@/lib/sms-assignment';
import { getUserRecordId } from '@/lib/user-record';
import { buildCaseId, deriveInitialCaseStatus } from '@/lib/services/sms-case-service';
import { isDemoPreviewProfile } from '@/lib/runtime-mode';

type NewResourceData = {
  name: string;
  category: Resource['category'];
  inventoryGroup?: Resource['inventoryGroup'];
  subcategory?: Resource['subcategory'];
  intendedUse?: Resource['intendedUse'];
  stock: number;
  unit: string;
};

type NewMarketPriceData = {
  crop: string;
  price: number;
  unit: string;
  source: string;
  trend: MarketPriceEntry['trend'];
};

type NewAlertBroadcastData = {
  title: string;
  type: AlertHistoryType;
  severity: AlertHistorySeverity;
  message: string;
  recommendation: string;
  source: AlertHistorySource;
  recipientFarmerIds?: string[];
};

type NewAssistanceRecordData = {
  farmerId: string;
  type: FarmerAssistanceRecord['type'];
  title: string;
  details: string;
  quantity?: string;
  nextAction?: string;
  resourceId?: string;
  providedBy?: string;
};

type NewFieldVisitTaskData = {
  farmerId: string;
  title: string;
  purpose: string;
  scheduledFor: string;
  assignedTo?: string;
  priority: FieldVisitPriority;
  notes?: string;
  relatedSmsId?: string;
};

type FarmerStatusUpdateOptions = {
  archiveReason?: string;
};

type FarmerStatusUpdateFailureReason = 'not_found' | 'no_change' | 'persist_failed';

type FarmerStatusUpdateResult = {
  ok: boolean;
  status: Farmer['status'];
  farmer?: Farmer;
  previousFarmer?: Farmer;
  reason?: FarmerStatusUpdateFailureReason;
  error?: unknown;
};

type FarmerBulkStatusUpdateResult = {
  ok: boolean;
  status: Farmer['status'];
  updatedCount: number;
  farmers: Farmer[];
  reason?: 'none_selected' | 'persist_failed';
  error?: unknown;
};

type EntityMutationFailureReason =
  | 'not_found'
  | 'persist_failed'
  | 'invalid'
  | 'duplicate'
  | 'insufficient_stock'
  | 'no_change';

type EntityMutationResult<T> = {
  ok: boolean;
  item?: T;
  previousItem?: T;
  reason?: EntityMutationFailureReason;
  error?: unknown;
};

type EntityDeletionResult<T> = {
  ok: boolean;
  deletedItem?: T;
  reason?: 'not_found' | 'persist_failed';
  error?: unknown;
};

type FieldVisitStatusUpdateOptions = {
  notes?: string;
  verificationStatus?: FieldVisitTask['verificationStatus'];
  verificationSource?: FieldVisitTask['verificationSource'];
  verificationCapturedAt?: string;
  verificationLat?: number;
  verificationLng?: number;
  verificationAccuracyMeters?: number;
  verificationNote?: string;
};

export type NewKnowledgeArticleData = {
  title: string;
  summary: string;
  keywords: string[];
  type: KnowledgeArticleType;
  content: string;
  audioUrl?: string;
  reviewStatus?: KnowledgeArticle["reviewStatus"];
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  sourceLabel?: string;
  sourceType?: KnowledgeArticle["sourceType"];
  version?: number;
  supersedesArticleId?: string;
};

export type NewInboundSmsData = {
  phone: string;
  message: string;
  analysis?: InboundSmsAnalysis;
  sourceProvider?: SmsMessage['sourceProvider'];
};

interface DataContextType {
  farmers: Farmer[];
  setFarmers: React.Dispatch<React.SetStateAction<Farmer[]>>;
  updateFarmerRecord: (farmerId: string, updates: Partial<Farmer>) => void;
  updateFarmerStatus: (
    farmerId: string,
    status: Farmer['status'],
    options?: FarmerStatusUpdateOptions
  ) => Promise<FarmerStatusUpdateResult>;
  updateManyFarmerStatuses: (
    farmerIds: string[],
    status: Farmer['status']
  ) => Promise<FarmerBulkStatusUpdateResult>;
  mergeFarmerRecords: (sourceFarmerId: string, targetFarmerId: string) => Promise<boolean>;
  deleteFarmerRecord: (farmerId: string) => Promise<EntityDeletionResult<Farmer>>;
  smsMessages: SmsMessage[];
  outboundMessages: OutboundMessage[];
  addInboundSms: (data: NewInboundSmsData) => SmsMessage | null;
  addSmsPreview: (message: SmsMessage) => SmsMessage;
  webhookBridgeStatus: 'idle' | 'syncing' | 'error';
  updateSmsMessage: (
    messageId: string,
    updates: Partial<Pick<SmsMessage, 'status' | 'aiAdvice' | 'parsedIntent' | 'urgency' | 'safetyFlag' | 'tone'>>
  ) => void;
  assignSmsMessage: (messageId: string, assigneeName?: string) => void;
  updateSmsCaseOutcome: (messageId: string, outcomeStatus: SmsCaseOutcomeStatus, summary: string) => boolean;
  closeSmsCase: (messageId: string, resolutionNote?: string) => boolean;
  confirmSmsCaseResolution: (
    messageId: string,
    confirmationStatus: SmsResolutionConfirmationStatus,
    note?: string
  ) => void;
  confirmSmsThread: (messageId: string) => Promise<boolean>;
  splitSmsThread: (messageId: string) => Promise<boolean>;
  mergeSmsThreads: (sourceMessageId: string, targetMessageId: string) => Promise<boolean>;
  resources: Resource[];
  addResource: (data: NewResourceData) => Promise<EntityMutationResult<Resource>>;
  updateResource: (resourceId: string, data: Partial<Omit<Resource, 'id' | 'lastUpdated'>>) => Promise<EntityMutationResult<Resource>>;
  deleteResource: (resourceId: string) => Promise<EntityDeletionResult<Resource>>;
  marketPrices: MarketPriceEntry[];
  addMarketPriceEntry: (data: NewMarketPriceData) => Promise<EntityMutationResult<MarketPriceEntry>>;
  updateMarketPriceEntry: (entryId: string, data: NewMarketPriceData) => Promise<EntityMutationResult<MarketPriceEntry>>;
  deleteMarketPriceEntry: (entryId: string) => Promise<EntityDeletionResult<MarketPriceEntry>>;
  knowledgeArticles: KnowledgeArticle[];
  addKnowledgeArticle: (data: NewKnowledgeArticleData) => void;
  setKnowledgeArticles: React.Dispatch<React.SetStateAction<KnowledgeArticle[]>>;
  logbook: LogbookEntry[];
  addLogbookEntry: (entry: Omit<LogbookEntry, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  setLogbook: React.Dispatch<React.SetStateAction<LogbookEntry[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  alertHistory: AlertHistoryEntry[];
  broadcastAlert: (data: NewAlertBroadcastData) => Promise<AlertHistoryEntry>;
  assistanceRecords: FarmerAssistanceRecord[];
  addAssistanceRecord: (data: NewAssistanceRecordData) => FarmerAssistanceRecord;
  updateAssistanceRecordStatus: (recordId: string, status: AssistanceStatus) => void;
  fieldVisitTasks: FieldVisitTask[];
  scheduleFieldVisit: (data: NewFieldVisitTaskData) => FieldVisitTask;
  updateFieldVisitTaskStatus: (
    taskId: string,
    status: FieldVisitStatus,
    options?: FieldVisitStatusUpdateOptions
  ) => void;
  smsTrainingExamples: SmsTrainingExample[];
  exportPortableBackup: () => PortableAppBackup;
  importPortableBackup: (backup: PortableAppBackup) => Promise<{ importedCollections: string[]; importedRecords: number }>;
  importSmsTrainingExamples: (examples: SmsTrainingExample[]) => Promise<number>;
  importKnowledgeArticles: (articles: KnowledgeArticle[]) => Promise<number>;
  reviewSmsTrainingExample: (
    exampleId: string,
    reviewStatus: NonNullable<SmsTrainingExample["reviewStatus"]>,
    reviewNotes?: string
  ) => Promise<void>;
  reviewKnowledgeArticle: (
    articleId: string,
    reviewStatus: NonNullable<KnowledgeArticle["reviewStatus"]>,
    reviewNotes?: string
  ) => Promise<void>;
  systemSettings: SystemSettings;
  saveSystemSettings: (settings: SystemSettings) => Promise<void>;
  users: User[];
  addUser: (user: UserManagementValues) => void;
  updateUser: (userId: string, updatedUser: User) => void;
  deleteUser: (userId: string) => void;
  addPendingFarmer: (farmerData: FarmerRegistrationValues) => Promise<EntityMutationResult<Farmer>>;
  vouchers: Voucher[];
  addVoucher: (voucher: Omit<Voucher, 'id' | 'code' | 'status' | 'issueDate'>) => Promise<EntityMutationResult<Voucher>>;
  updateVoucherStatus: (voucherId: string, status: VoucherStatus) => Promise<EntityMutationResult<Voucher>>;
  retryOutboundMessage: (outboundId: string) => Promise<OutboundMessage | null>;
  runDataRetentionSweep: () => Promise<{
    redactedAuditLogs: number;
    redactedArchivedFarmers: number;
  }>;
  offlineMode: boolean;
  offlineSyncing: boolean;
  offlineOutboxCount: number;
  liveDataReady: boolean;
  syncOfflineChanges: () => Promise<{ processedCount: number; remainingCount: number }>;
  resetDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);
const LIVE_BOOTSTRAP_KEYS = ['systemSettings', 'resources', 'marketPrices', 'farmers', 'smsMessages', 'users'] as const;
type LiveBootstrapKey = typeof LIVE_BOOTSTRAP_KEYS[number];

function createEntityId(prefix: string) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeFarmerPhone(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

function normalizeTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeResourceRecordKey(name: string, category: Resource['category']) {
  return `${category}:${name.trim().toLowerCase()}`;
}

function buildPersistableFarmerUpdates(farmer: Farmer): Partial<Farmer> {
  const { id: farmerId, ...updates } = farmer;
  void farmerId;
  return updates;
}

function prepareFarmerRecord(input: {
  farmer: Farmer;
  existingFarmers: Farmer[];
  previousFarmer?: Farmer;
  actorName: string;
  source:
    | 'sms_registration'
    | 'manual_registration'
    | 'approval_review'
    | 'profile_edit'
    | 'household_update'
    | 'merge'
    | 'system_reconciliation';
  reason?: string;
  timestamp?: string;
}) {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const nextFarmer = {
    ...input.farmer,
    ...reconcileFarmerIdentity(input.farmer, input.existingFarmers, { now: timestamp }),
  };
  const revisionState = buildFarmerProfileRevision({
    previousFarmer: input.previousFarmer,
    nextFarmer,
    changedBy: input.actorName,
    source: input.source,
    reason: input.reason,
    changedAt: timestamp,
  });

  return {
    ...nextFarmer,
    ...revisionState,
  };
}

function mergeById<T extends { id: string }>(currentItems: T[], importedItems: T[]) {
  const merged = new Map<string, T>();

  for (const item of currentItems) {
    merged.set(item.id, item);
  }

  let importedRecords = 0;

  for (const item of importedItems) {
    merged.set(item.id, item);
    importedRecords += 1;
  }

  return {
    items: Array.from(merged.values()),
    importedRecords,
  };
}

function sortByDateDescending<T>(items: T[], getDateValue: (item: T) => string) {
  return [...items].sort((left, right) => normalizeTimestamp(getDateValue(right)) - normalizeTimestamp(getDateValue(left)));
}

function sortVisibleSmsMessages(items: SmsMessage[]) {
  return sortByDateDescending(filterVisibleInboundSmsMessages(items), (item) => item.timestamp);
}

function sortByDateAscending<T>(items: T[], getDateValue: (item: T) => string) {
  return [...items].sort((left, right) => normalizeTimestamp(getDateValue(left)) - normalizeTimestamp(getDateValue(right)));
}

function getRuntimeInitialItems<T>(demoItems: T[]) {
  return isLiveMode ? [] as T[] : demoItems;
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

function isLikelyOfflinePersistenceError(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('failed to fetch') ||
    message.includes('unavailable') ||
    message.includes('timeout')
  );
}

function getFieldVisitVerificationSummary(task: Pick<
  FieldVisitTask,
  | 'verificationStatus'
  | 'verificationSource'
  | 'verificationAccuracyMeters'
  | 'verificationNote'
>) {
  if (task.verificationStatus === 'gps_captured') {
    const accuracyText =
      typeof task.verificationAccuracyMeters === 'number'
        ? ` (accuracy ${Math.round(task.verificationAccuracyMeters)}m)`
        : '';
    return `GPS verified${accuracyText}`;
  }

  if (task.verificationStatus === 'manual_only') {
    const source =
      task.verificationSource === 'manual_dashboard'
        ? 'manual dashboard update'
        : 'manual mobile fallback';
    return task.verificationNote
      ? `Manual verification via ${source}: ${task.verificationNote}`
      : `Manual verification via ${source}`;
  }

  return 'Unverified visit metadata';
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { authLoading, currentUser, currentUserProfile } = useAuth();
  const autoReplyInFlight = React.useRef<Set<string>>(new Set());
  const followUpInFlight = React.useRef<Set<string>>(new Set());
  const retentionSweepStarted = React.useRef(false);
  const liveBootstrapRef = React.useRef<Set<LiveBootstrapKey>>(new Set());
  const liveBootstrapApiLoaded = React.useRef(false);
  const liveSmsApiFallbackLoaded = React.useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [liveDataReady, setLiveDataReady] = useState(!isLiveMode);
  
  const [farmers, setFarmers] = useState<Farmer[]>(() => getRuntimeInitialItems(initialFarmers));
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(() => (
    isLiveMode ? [] : sortVisibleSmsMessages(initialSmsMessages)
  ));
  const [resources, setResources] = useState<Resource[]>(() => getRuntimeInitialItems(initialResources));
  const [marketPrices, setMarketPrices] = useState<MarketPriceEntry[]>(() => getRuntimeInitialItems(initialMarketPrices));
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(() => getRuntimeInitialItems(initialKnowledgeArticles));
  const [logbook, setLogbook] = useState<LogbookEntry[]>(() => getRuntimeInitialItems(initialLogbookEntries));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getRuntimeInitialItems(initialAuditLogs));
  const [alertHistory, setAlertHistory] = useState<AlertHistoryEntry[]>(() => getRuntimeInitialItems(initialAlertHistory));
  const [assistanceRecords, setAssistanceRecords] = useState<FarmerAssistanceRecord[]>(() => getRuntimeInitialItems(initialAssistanceRecords));
  const [fieldVisitTasks, setFieldVisitTasks] = useState<FieldVisitTask[]>(() => getRuntimeInitialItems(initialFieldVisitTasks));
  const [smsTrainingExamples, setSmsTrainingExamples] = useState<SmsTrainingExample[]>(() => getRuntimeInitialItems(initialSmsTrainingExamples));
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [users, setUsers] = useState<User[]>(() => getRuntimeInitialItems(initialUsers));
  const [vouchers, setVouchers] = useState<Voucher[]>(() => getRuntimeInitialItems(initialVouchers));
  const [outboundMessages, setOutboundMessages] = useState<OutboundMessage[]>(() => getRuntimeInitialItems(initialOutboundMessages));
  const [webhookBridgeStatus, setWebhookBridgeStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineSyncing, setOfflineSyncing] = useState(false);
  const [offlineOutboxCount, setOfflineOutboxCount] = useState(0);
  const offlineOutboxScope = React.useMemo(() => {
    if (currentUser?.uid) {
      return `uid:${currentUser.uid}`;
    }

    if (currentUserProfile?.uid) {
      return `uid:${currentUserProfile.uid}`;
    }

    if (currentUserProfile?.email) {
      return `email:${currentUserProfile.email}`;
    }

    return "guest";
  }, [currentUser?.uid, currentUserProfile?.email, currentUserProfile?.uid]);
  const demoPreviewActive = isLiveMode && !currentUser && isDemoPreviewProfile(currentUserProfile);
  const usingDemoSandbox = isDemoMode || demoPreviewActive;
  const usingLiveData = isLiveMode && !usingDemoSandbox;

  const queueOfflineMutation = useCallback((mutation: OfflineMutation) => {
    const storage = canUseBrowserStorage();
    const next = appendOfflineMutation(mutation, storage, offlineOutboxScope);
    setOfflineOutboxCount(next.length);
  }, [offlineOutboxScope]);

  const persistOfflineOutbox = useCallback((mutations: OfflineMutation[]) => {
    writeOfflineMutations(mutations, canUseBrowserStorage(), offlineOutboxScope);
    setOfflineOutboxCount(mutations.length);
  }, [offlineOutboxScope]);

  const shouldQueueLiveMutation = useCallback((error?: unknown) => {
    if (!usingLiveData) {
      return false;
    }

    return offlineMode || isLikelyOfflinePersistenceError(error);
  }, [offlineMode, usingLiveData]);

  const markLiveBootstrapReady = useCallback((key: LiveBootstrapKey) => {
    liveBootstrapRef.current.add(key);

    if (LIVE_BOOTSTRAP_KEYS.every((requiredKey) => liveBootstrapRef.current.has(requiredKey))) {
      setLiveDataReady(true);
    }
  }, []);

  const processOfflineMutation = useCallback(async (mutation: OfflineMutation) => {
    switch (mutation.type) {
      case 'save-system-settings':
        await systemSettingsRepository.saveSettings(mutation.payload.settings);
        return;
      case 'update-farmer-record':
        await Promise.all([
          farmerRepository.updateFarmer(mutation.payload.farmerId, mutation.payload.updates),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'create-logbook-entry':
        await logbookRepository.createEntry(mutation.payload.entry);
        return;
      case 'create-assistance-activity':
        await Promise.all([
          assistanceRepository.createAssistanceRecord(mutation.payload.record),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'update-assistance-status':
        await Promise.all([
          assistanceRepository.updateAssistanceRecord(mutation.payload.recordId, mutation.payload.updates),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'schedule-field-visit':
        await Promise.all([
          fieldVisitRepository.createFieldVisitTask(mutation.payload.task),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'update-field-visit-status':
        await Promise.all([
          fieldVisitRepository.updateFieldVisitTask(mutation.payload.taskId, mutation.payload.updates),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'update-sms-message': {
        await smsRepository.updateMessage(mutation.payload.messageId, mutation.payload.updates);

        if (mutation.payload.auditLog) {
          await auditRepository.createAuditLog(mutation.payload.auditLog);
        }

        if (mutation.payload.responseLogbookEntry) {
          await logbookRepository.createEntry(mutation.payload.responseLogbookEntry);
        }

        if (mutation.payload.trainingExample) {
          await smsTrainingRepository.createTrainingExample(mutation.payload.trainingExample);
        }

        if (mutation.payload.outboundReply) {
          const outboundRecord = await sendOutboundMessage({
            sourceMessage: mutation.payload.outboundReply.sourceMessage,
            body: mutation.payload.outboundReply.body,
            provider: smsProvider,
            providerName: mutation.payload.outboundReply.providerName,
            audience: mutation.payload.outboundReply.audience,
            purpose: mutation.payload.outboundReply.purpose,
          });
          setOutboundMessages((records) => [outboundRecord, ...records]);
          await outboundMessageRepository.createOutboundMessage(outboundRecord);
        }
        return;
      }
      case 'assign-sms-message':
        await Promise.all([
          smsRepository.updateMessage(mutation.payload.messageId, mutation.payload.updates),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'update-sms-case-outcome':
        await Promise.all([
          smsRepository.updateMessage(mutation.payload.messageId, mutation.payload.updates),
          auditRepository.createAuditLog(mutation.payload.auditLog),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
        ]);
        return;
      case 'close-sms-case':
        await Promise.all([
          smsRepository.updateMessage(mutation.payload.messageId, mutation.payload.updates),
          auditRepository.createAuditLog(mutation.payload.auditLog),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
        ]);
        return;
      case 'create-knowledge-article':
        await knowledgeRepository.createKnowledgeArticle(mutation.payload.article);
        return;
      default:
        return;
    }
  }, []);

  const syncOfflineChanges = useCallback(async () => {
    const storage = canUseBrowserStorage();
    const pending = readOfflineMutations(storage, offlineOutboxScope);

    if (!usingLiveData || offlineSyncing || pending.length === 0) {
      return {
        processedCount: 0,
        remainingCount: pending.length,
      };
    }

    setOfflineSyncing(true);
    const remaining: OfflineMutation[] = [];
    let processedCount = 0;

    for (const mutation of pending) {
      try {
        await processOfflineMutation(mutation);
        processedCount += 1;
      } catch (error) {
        remaining.push({
          ...mutation,
          attempts: (mutation.attempts ?? 0) + 1,
          lastError: error instanceof Error ? error.message : 'Unknown sync failure',
        });
      }
    }

    persistOfflineOutbox(remaining);
    setOfflineSyncing(false);

    return {
      processedCount,
      remainingCount: remaining.length,
    };
  }, [offlineOutboxScope, offlineSyncing, persistOfflineOutbox, processOfflineMutation, usingLiveData]);

  const hydrateDemoState = useCallback(() => {
    if (!usingDemoSandbox || typeof window === 'undefined') {
      return;
    }

    try {
      const storedFarmers = localStorage.getItem('farmers');
      setFarmers(storedFarmers ? JSON.parse(storedFarmers) : initialFarmers);

      const storedSms = localStorage.getItem('smsMessages');
      setSmsMessages(storedSms ? sortVisibleSmsMessages(JSON.parse(storedSms) as SmsMessage[]) : sortVisibleSmsMessages(initialSmsMessages));

      const storedResources = localStorage.getItem('resources');
      setResources(storedResources ? JSON.parse(storedResources) : initialResources);

      const storedMarketPrices = localStorage.getItem('marketPrices');
      setMarketPrices(storedMarketPrices ? JSON.parse(storedMarketPrices) : initialMarketPrices);

      const storedKnowledge = localStorage.getItem('knowledgeArticles');
      setKnowledgeArticles(storedKnowledge ? JSON.parse(storedKnowledge) : initialKnowledgeArticles);

      const storedLogbook = localStorage.getItem('logbook');
      setLogbook(storedLogbook ? JSON.parse(storedLogbook) : initialLogbookEntries);

      const storedAudit = localStorage.getItem('auditLogs');
      setAuditLogs(storedAudit ? JSON.parse(storedAudit) : initialAuditLogs);

      const storedAlertHistory = localStorage.getItem('alertHistory');
      setAlertHistory(storedAlertHistory ? JSON.parse(storedAlertHistory) : initialAlertHistory);

      const storedAssistanceRecords = localStorage.getItem('assistanceRecords');
      setAssistanceRecords(storedAssistanceRecords ? JSON.parse(storedAssistanceRecords) : initialAssistanceRecords);

      const storedFieldVisitTasks = localStorage.getItem('fieldVisitTasks');
      setFieldVisitTasks(storedFieldVisitTasks ? JSON.parse(storedFieldVisitTasks) : initialFieldVisitTasks);

      const storedTrainingExamples = localStorage.getItem('smsTrainingExamples');
      setSmsTrainingExamples(storedTrainingExamples ? JSON.parse(storedTrainingExamples) : initialSmsTrainingExamples);

      const storedSystemSettings = localStorage.getItem('systemSettings');
      setSystemSettings(storedSystemSettings ? mergeSystemSettings(JSON.parse(storedSystemSettings)) : defaultSystemSettings);

      const storedUsers = localStorage.getItem('users');
      setUsers(storedUsers ? JSON.parse(storedUsers) : initialUsers);

      const storedVouchers = localStorage.getItem('vouchers');
      setVouchers(storedVouchers ? JSON.parse(storedVouchers) : initialVouchers);

      const storedOutbound = localStorage.getItem('outboundMessages');
      setOutboundMessages(storedOutbound ? JSON.parse(storedOutbound) : initialOutboundMessages);
    } catch (error) {
      console.error("Error loading data from localStorage", error);
      setFarmers(initialFarmers);
      setSmsMessages(sortVisibleSmsMessages(initialSmsMessages));
      setResources(initialResources);
      setMarketPrices(initialMarketPrices);
      setKnowledgeArticles(initialKnowledgeArticles);
      setLogbook(initialLogbookEntries);
      setAuditLogs(initialAuditLogs);
      setAlertHistory(initialAlertHistory);
      setAssistanceRecords(initialAssistanceRecords);
      setFieldVisitTasks(initialFieldVisitTasks);
      setSmsTrainingExamples(initialSmsTrainingExamples);
      setSystemSettings(defaultSystemSettings);
      setUsers(initialUsers);
      setVouchers(initialVouchers);
      setOutboundMessages(initialOutboundMessages);
    }

    setHydrated(true);
    setLiveDataReady(true);
  }, [usingDemoSandbox]);

  useEffect(() => {
    if (!usingDemoSandbox) return;

    hydrateDemoState();
    window.addEventListener('demo-session-change', hydrateDemoState);
    window.addEventListener(DEMO_PREVIEW_EVENT, hydrateDemoState);
    window.addEventListener('storage', hydrateDemoState);

    return () => {
      window.removeEventListener('demo-session-change', hydrateDemoState);
      window.removeEventListener(DEMO_PREVIEW_EVENT, hydrateDemoState);
      window.removeEventListener('storage', hydrateDemoState);
    };
  }, [hydrateDemoState, usingDemoSandbox]);

  useEffect(() => {
    if (!usingLiveData || typeof window === 'undefined') {
      return;
    }

    setOfflineMode(!navigator.onLine);
    const pendingMutations = readOfflineMutations(window.localStorage, offlineOutboxScope);
    setOfflineOutboxCount(pendingMutations.length);
    if (navigator.onLine && pendingMutations.length > 0) {
      void syncOfflineChanges();
    }

    const handleOnline = () => {
      setOfflineMode(false);
      void syncOfflineChanges();
    };
    const handleOffline = () => {
      setOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineOutboxScope, syncOfflineChanges, usingLiveData]);

  useEffect(() => {
    if (!usingLiveData) {
      setLiveDataReady(true);
      return;
    }
    if (authLoading) return;

    if (!currentUser) {
      setHydrated(true);
      setLiveDataReady(true);
      return;
    }

    try {
      liveBootstrapRef.current = new Set();
      setLiveDataReady(false);
      const db = getClientFirestore();
      const unsubscribers = [
        onSnapshot(doc(db, firebaseCollections.systemSettings, SYSTEM_SETTINGS_DOCUMENT_ID), (snapshot) => {
          setSystemSettings(mergeSystemSettings(snapshot.exists() ? (snapshot.data() as Partial<SystemSettings>) : null));
          markLiveBootstrapReady('systemSettings');
        }),
        onSnapshot(query(collection(db, firebaseCollections.resources), orderBy('lastUpdated', 'desc')), (snapshot) => {
          setResources(snapshot.docs.map((item) => withFirestoreDocId<Resource>(item)));
          setWebhookBridgeStatus('idle');
          markLiveBootstrapReady('resources');
        }),
        onSnapshot(query(collection(db, firebaseCollections.marketPrices), orderBy('updatedAt', 'desc')), (snapshot) => {
          setMarketPrices(snapshot.docs.map((item) => withFirestoreDocId<MarketPriceEntry>(item)));
          markLiveBootstrapReady('marketPrices');
        }),
        onSnapshot(query(collection(db, firebaseCollections.alertHistory), orderBy('timestamp', 'desc')), (snapshot) => {
          setAlertHistory(snapshot.docs.map((item) => withFirestoreDocId<AlertHistoryEntry>(item)));
        }),
        onSnapshot(query(collection(db, firebaseCollections.assistanceRecords), orderBy('updatedAt', 'desc')), (snapshot) => {
          setAssistanceRecords(snapshot.docs.map((item) => withFirestoreDocId<FarmerAssistanceRecord>(item)));
        }),
        onSnapshot(query(collection(db, firebaseCollections.fieldVisitTasks), orderBy('scheduledFor', 'asc')), (snapshot) => {
          setFieldVisitTasks(snapshot.docs.map((item) => withFirestoreDocId<FieldVisitTask>(item)));
        }),
        onSnapshot(query(collection(db, firebaseCollections.knowledgeArticles), orderBy('lastUpdated', 'desc')), (snapshot) => {
          setKnowledgeArticles(snapshot.docs.map((item) => withFirestoreDocId<KnowledgeArticle>(item)));
        }),
        onSnapshot(query(collection(db, firebaseCollections.vouchers), orderBy('issueDate', 'desc')), (snapshot) => {
          setVouchers(snapshot.docs.map((item) => withFirestoreDocId<Voucher>(item)));
        }),
        onSnapshot(query(collection(db, firebaseCollections.farmers), orderBy('registrationDate', 'desc')), (snapshot) => {
          setFarmers(snapshot.docs.map((item) => withFirestoreDocId<Farmer>(item)));
          markLiveBootstrapReady('farmers');
        }),
        onSnapshot(query(collection(db, firebaseCollections.smsMessages), orderBy('timestamp', 'desc')), (snapshot) => {
          setSmsMessages(sortVisibleSmsMessages(snapshot.docs.map((item) => withFirestoreDocId<SmsMessage>(item))));
          markLiveBootstrapReady('smsMessages');
        }),
        onSnapshot(query(collection(db, firebaseCollections.auditLogs), orderBy('timestamp', 'desc')), (snapshot) => {
          setAuditLogs(snapshot.docs.map((item) => withFirestoreDocId<AuditLog>(item)));
        }),
        onSnapshot(query(collection(db, firebaseCollections.outboundMessages), orderBy('createdAt', 'desc')), (snapshot) => {
          setOutboundMessages(snapshot.docs.map((item) => withFirestoreDocId<OutboundMessage>(item)));
        }),
        onSnapshot(query(collection(db, firebaseCollections.logbookEntries), orderBy('timestamp', 'desc')), (snapshot) => {
          setLogbook(snapshot.docs.map((item) => withFirestoreDocId<LogbookEntry>(item)));
        }),
        onSnapshot(query(collection(db, firebaseCollections.smsTrainingExamples), orderBy('finalReview.reviewedAt', 'desc')), (snapshot) => {
          setSmsTrainingExamples(snapshot.docs.map((item) => withFirestoreDocId<SmsTrainingExample>(item)));
        }),
      ];

      if (currentUserProfile?.role === 'developer') {
        unsubscribers.push(
          onSnapshot(query(collection(db, firebaseCollections.users), orderBy('name', 'asc')), (snapshot) => {
            setUsers(snapshot.docs.map((item) => ({
              id: item.id,
              ...(item.data() as User),
            })));
            markLiveBootstrapReady('users');
          })
        );
      } else {
        setUsers(currentUserProfile ? [currentUserProfile] : []);
        markLiveBootstrapReady('users');
      }

      setHydrated(true);

      return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };
    } catch (error) {
      console.error("Error attaching live listeners", error);
      setWebhookBridgeStatus('error');
      setHydrated(true);
      setLiveDataReady(true);
    }
  }, [authLoading, currentUser, currentUserProfile, markLiveBootstrapReady, usingLiveData]);

  useEffect(() => {
    if (!usingLiveData || authLoading || !currentUser) {
      liveBootstrapApiLoaded.current = false;
      liveSmsApiFallbackLoaded.current = false;
      return;
    }

    if (liveBootstrapApiLoaded.current) {
      return;
    }

    liveBootstrapApiLoaded.current = true;

    let cancelled = false;

    const loadLiveBootstrap = async () => {
      const idToken = await getClientAuth().currentUser?.getIdToken();

      if (!idToken) {
        throw new Error('Missing live ID token for bootstrap preload.');
      }

      const response = await fetch('/api/system/live-bootstrap', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Live bootstrap failed with HTTP ${response.status}.`);
      }

      const payload = await response.json();
      const bootstrap = payload.bootstrap ?? {};

      if (cancelled) {
        return;
      }

      setSystemSettings((current) => mergeSystemSettings(bootstrap.systemSettings ?? current));
      setResources((current) => current.length > 0 ? current : (bootstrap.resources ?? []));
      setMarketPrices((current) => current.length > 0 ? current : (bootstrap.marketPrices ?? []));
      setFarmers((current) => current.length > 0 ? current : (bootstrap.farmers ?? []));
      setSmsMessages((current) => current.length > 0 ? current : sortVisibleSmsMessages(bootstrap.smsMessages ?? []));
      setUsers((current) => current.length > 0 ? current : (bootstrap.users ?? []));
      setVouchers((current) => current.length > 0 ? current : (bootstrap.vouchers ?? []));
      setAssistanceRecords((current) => current.length > 0 ? current : (bootstrap.assistanceRecords ?? []));
      setFieldVisitTasks((current) => current.length > 0 ? current : (bootstrap.fieldVisitTasks ?? []));
      setAlertHistory((current) => current.length > 0 ? current : (bootstrap.alertHistory ?? []));
      setOutboundMessages((current) => current.length > 0 ? current : (bootstrap.outboundMessages ?? []));

      markLiveBootstrapReady('systemSettings');
      markLiveBootstrapReady('resources');
      markLiveBootstrapReady('marketPrices');
      markLiveBootstrapReady('farmers');
      markLiveBootstrapReady('smsMessages');
      markLiveBootstrapReady('users');
    };

    void loadLiveBootstrap().catch((error) => {
      console.error('Failed to preload live bootstrap payload.', error);
      liveBootstrapApiLoaded.current = false;
    });

    if (smsMessages.length > 0 || liveSmsApiFallbackLoaded.current) {
      return () => {
        cancelled = true;
      };
    }

    liveSmsApiFallbackLoaded.current = true;

    void fetch('/api/mobile/sms-feed', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Live SMS fallback failed with HTTP ${response.status}.`);
        }

        const payload = await response.json();
        const nextMessages = Array.isArray(payload.messages)
          ? sortVisibleSmsMessages(payload.messages as SmsMessage[])
          : [];

        if (!cancelled && nextMessages.length > 0) {
          setSmsMessages(nextMessages);
        }
      })
      .catch((error) => {
        console.error('Failed to hydrate live SMS feed from API fallback.', error);
        liveSmsApiFallbackLoaded.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser, markLiveBootstrapReady, smsMessages.length, usingLiveData]);

  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('farmers', JSON.stringify(farmers)); }, [farmers, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('smsMessages', JSON.stringify(smsMessages)); }, [smsMessages, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('resources', JSON.stringify(resources)); }, [resources, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('marketPrices', JSON.stringify(marketPrices)); }, [marketPrices, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('knowledgeArticles', JSON.stringify(knowledgeArticles)); }, [knowledgeArticles, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('logbook', JSON.stringify(logbook)); }, [logbook, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('auditLogs', JSON.stringify(auditLogs)); }, [auditLogs, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('alertHistory', JSON.stringify(alertHistory)); }, [alertHistory, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('assistanceRecords', JSON.stringify(assistanceRecords)); }, [assistanceRecords, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('fieldVisitTasks', JSON.stringify(fieldVisitTasks)); }, [fieldVisitTasks, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('smsTrainingExamples', JSON.stringify(smsTrainingExamples)); }, [smsTrainingExamples, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('systemSettings', JSON.stringify(systemSettings)); }, [systemSettings, hydrated, usingDemoSandbox]);
  useEffect(() => {
    if (hydrated && usingDemoSandbox) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('vouchers', JSON.stringify(vouchers)); }, [vouchers, hydrated, usingDemoSandbox]);
  useEffect(() => { if (hydrated && usingDemoSandbox) localStorage.setItem('outboundMessages', JSON.stringify(outboundMessages)); }, [outboundMessages, hydrated, usingDemoSandbox]);

  useEffect(() => {
    if (!hydrated || !usingDemoSandbox) return;

    let active = true;

    const syncWebhookQueue = async () => {
      try {
        setWebhookBridgeStatus('syncing');
        const response = await fetch('/api/webhooks/inbound-sms/consume', {
          method: 'POST',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Webhook bridge failed');
        }

        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];

        if (!active) return;

        for (const item of items) {
          const screening = screenInboundSms({
            phone: item.phone,
            message: item.message,
          });

          if (screening.ignored) {
            continue;
          }

          const confirmationReply = parseFarmerResolutionConfirmationReply(item.message);
          const awaitingConfirmationMessages = confirmationReply
            ? smsMessages
                .filter((message) => (
                  normalizeFarmerPhone(message.phone) === normalizeFarmerPhone(item.phone) &&
                  message.resolutionConfirmationStatus === 'awaiting_farmer' &&
                  !message.closedAt
                ))
                .sort((left, right) => normalizeTimestamp(right.timestamp) - normalizeTimestamp(left.timestamp))
            : [];
          const awaitingConfirmationMessage = confirmationReply
            ? (
                confirmationReply.caseId
                  ? awaitingConfirmationMessages.find((message) => (message.caseId ?? '').toUpperCase() === confirmationReply.caseId)
                  : awaitingConfirmationMessages[0]
              ) ?? awaitingConfirmationMessages[0]
            : null;

          if (confirmationReply && awaitingConfirmationMessage) {
            const confirmationResult = applyFarmerResolutionConfirmation({
              message: awaitingConfirmationMessage,
              confirmationStatus: confirmationReply.status,
              replyBody: item.message,
            });
            const reminderResult = confirmationReply.status === 'reopened'
              ? await processOfficialReminderMessage({
                  message: confirmationResult.updatedMessage,
                  users,
                  settings: systemSettings,
                  provider: smsProvider,
                  providerName: item.provider ?? 'demo',
                  actorName: 'system',
                  force: true,
                })
              : null;
            const finalMessage = reminderResult?.updatedMessage ?? confirmationResult.updatedMessage;

            setSmsMessages((prev) => sortVisibleSmsMessages(prev.map((message) => (
              message.id === awaitingConfirmationMessage.id ? finalMessage : message
            ))));
            setAuditLogs((prev) => [
              ...(reminderResult ? [reminderResult.auditLog] : []),
              confirmationResult.auditLog,
              ...prev,
            ]);
            setLogbook((prev) => [
              ...(reminderResult ? [reminderResult.logbookEntry] : []),
              confirmationResult.logbookEntry,
              ...prev,
            ]);

            if (reminderResult) {
              setOutboundMessages((prev) => [reminderResult.outboundRecord, ...prev]);
            }

            void Promise.all([
              smsRepository.updateMessage(awaitingConfirmationMessage.id, {
                caseStatus: finalMessage.caseStatus,
                closedAt: finalMessage.closedAt,
                caseOutcomeStatus: finalMessage.caseOutcomeStatus,
                caseOutcomeSummary: finalMessage.caseOutcomeSummary,
                caseOutcomeUpdatedAt: finalMessage.caseOutcomeUpdatedAt,
                caseOutcomeUpdatedBy: finalMessage.caseOutcomeUpdatedBy,
                resolutionConfirmationStatus: finalMessage.resolutionConfirmationStatus,
                resolutionConfirmedAt: finalMessage.resolutionConfirmedAt,
                resolutionConfirmedBy: finalMessage.resolutionConfirmedBy,
                resolutionConfirmationNote: finalMessage.resolutionConfirmationNote,
                followUpDueAt: finalMessage.followUpDueAt,
                assignedTo: finalMessage.assignedTo,
                assignedToUserId: finalMessage.assignedToUserId,
                assignedAt: finalMessage.assignedAt,
                officialReminderRecipientName: finalMessage.officialReminderRecipientName,
                officialReminderRecipientPhone: finalMessage.officialReminderRecipientPhone,
                officialReminderDueAt: finalMessage.officialReminderDueAt,
                officialReminderLastSentAt: finalMessage.officialReminderLastSentAt,
                officialReminderCount: finalMessage.officialReminderCount,
              }),
              auditRepository.createAuditLog(confirmationResult.auditLog),
              logbookRepository.createEntry(confirmationResult.logbookEntry),
              ...(reminderResult
                ? [
                    auditRepository.createAuditLog(reminderResult.auditLog),
                    logbookRepository.createEntry(reminderResult.logbookEntry),
                    outboundMessageRepository.createOutboundMessage(reminderResult.outboundRecord),
                  ]
                : []),
            ]).catch((error) => {
              console.error('Failed to persist webhook farmer confirmation', error);
            });
            continue;
          }

          const timestamp = new Date().toISOString();
          const workflow = processInboundSms({
            phone: item.phone,
            message: item.message,
            farmers,
            existingMessages: smsMessages,
            analysis: item.analysis,
            settings: systemSettings,
            timestamp,
            id: `SMS${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sourceProvider: item.provider,
            externalId: item.externalId,
          });
          const newMessage = applyPriceWatchAdvice(workflow.message, marketPrices);

          setSmsMessages(prev => [newMessage, ...prev]);
          setAuditLogs(prev => [
            {
              ...workflow.auditLog,
              details: `Tumanggap ng bagong SMS mula sa ${newMessage.farmerName} (${item.phone}) sa webhook bridge.`,
            },
            ...prev,
          ]);

          if (workflow.farmerUpdates.length > 0) {
            setFarmers(prev => prev.map(entry => {
              const update = workflow.farmerUpdates.find(itemUpdate => itemUpdate.farmerId === entry.id);
              return update ? { ...entry, ...update.updates } : entry;
            }));
          }

          if (workflow.newFarmer) {
            const preparedWorkflowFarmer = prepareFarmerRecord({
              farmer: workflow.newFarmer as Farmer,
              existingFarmers: farmers,
              actorName: 'system',
              source: 'sms_registration',
              timestamp,
              reason: 'Created from inbound SMS registration flow.',
            });
            setFarmers(prev => [preparedWorkflowFarmer, ...prev]);
          }
        }

        setWebhookBridgeStatus('idle');
      } catch {
        if (active) {
          setWebhookBridgeStatus('error');
        }
      }
    };

    void syncWebhookQueue();
    const interval = window.setInterval(() => {
      void syncWebhookQueue();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [farmers, hydrated, marketPrices, smsMessages, systemSettings, users, usingDemoSandbox]);

  useEffect(() => {
    if (!hydrated) return;
    if (!usingDemoSandbox) return;

    let active = true;

    const processOverdueMessages = async () => {
      const overdueMessages = smsMessages.filter((message) => (
        isAutoReplyOverdue(message, undefined, systemSettings) && !autoReplyInFlight.current.has(message.id)
      ));

      for (const message of overdueMessages) {
        autoReplyInFlight.current.add(message.id);

        try {
          const result = await processOverdueSmsMessage({
            message,
            settings: systemSettings,
            provider: smsProvider,
            providerName: usingDemoSandbox ? 'mock-sms-provider' : 'live-sms-provider',
            actorName: 'system',
          });

          if (!result) {
            continue;
          }

          if (!active) return;

          setSmsMessages(prev => prev.map((item) => (
            item.id === message.id ? result.updatedMessage : item
          )));
          setAuditLogs(prev => [result.auditLog, ...prev]);
          setLogbook(prev => [result.logbookEntry, ...prev]);
          setOutboundMessages(prev => [result.outboundRecord, ...prev]);

          await Promise.all([
            smsRepository.updateMessage(message.id, {
              autoReplyEligibleAt: result.updatedMessage.autoReplyEligibleAt,
              autoReplySentAt: result.updatedMessage.autoReplySentAt,
              respondedAt: result.updatedMessage.respondedAt,
              escalatedAt: result.updatedMessage.escalatedAt,
              caseStatus: result.updatedMessage.caseStatus,
            }),
            auditRepository.createAuditLog(result.auditLog),
            logbookRepository.createEntry(result.logbookEntry),
            outboundMessageRepository.createOutboundMessage(result.outboundRecord),
          ]);
        } catch (error) {
          console.error("Failed to process overdue SMS auto reply", error);
        } finally {
          autoReplyInFlight.current.delete(message.id);
        }
      }
    };

    void processOverdueMessages();
    const interval = window.setInterval(() => {
      void processOverdueMessages();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [hydrated, smsMessages, systemSettings, usingDemoSandbox]);

  useEffect(() => {
    if (!hydrated || !usingDemoSandbox) return;

    let active = true;

    const processFollowUps = async () => {
      const dueMessages = smsMessages.filter((message) => (
        isFollowUpDue(message) && !followUpInFlight.current.has(message.id)
      ));

      for (const message of dueMessages) {
        followUpInFlight.current.add(message.id);

        try {
          const result = await processDueFollowUpMessage({
            message,
            provider: smsProvider,
            providerName: 'mock-sms-provider',
            actorName: 'system',
          });

          if (!result || !active) {
            continue;
          }

          setSmsMessages(prev => prev.map((item) => (
            item.id === message.id ? result.updatedMessage : item
          )));
          setAuditLogs(prev => [result.auditLog, ...prev]);
          setLogbook(prev => [result.logbookEntry, ...prev]);
          setOutboundMessages(prev => [result.outboundRecord, ...prev]);

          await Promise.all([
            smsRepository.updateMessage(message.id, {
              followUpSentAt: result.updatedMessage.followUpSentAt,
            }),
            auditRepository.createAuditLog(result.auditLog),
            logbookRepository.createEntry(result.logbookEntry),
            outboundMessageRepository.createOutboundMessage(result.outboundRecord),
          ]);
        } catch (error) {
          console.error("Failed to process due follow-up SMS", error);
        } finally {
          followUpInFlight.current.delete(message.id);
        }
      }
    };

    void processFollowUps();
    const interval = window.setInterval(() => {
      void processFollowUps();
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [hydrated, smsMessages, usingDemoSandbox]);


  const addUser = (userData: UserManagementValues) => {
    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Developer';
    const newUser: User = {
        id: userData.email,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        title: userData.title,
        barangay: 'Batakil',
        phone: userData.phone,
        status: userData.status,
        preferredWorkspace: userData.preferredWorkspace,
        assignmentRole: userData.assignmentRole,
        availabilityStatus: userData.availabilityStatus,
        availabilityNote: userData.availabilityNote || undefined,
        shiftStartTime: userData.shiftStartTime || undefined,
        shiftEndTime: userData.shiftEndTime || undefined,
        assignedZones: userData.assignedZones.length > 0 ? userData.assignedZones : undefined,
        expertiseTags: userData.expertiseTags.length > 0 ? userData.expertiseTags : undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'CREATE_USER_ACCESS',
      details: `${newUser.name} (${newUser.email}) - ${newUser.role}, ${newUser.status}, ${newUser.preferredWorkspace}`,
    };
    setUsers(prev => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
    setAuditLogs(prev => [auditLog, ...prev]);
    void userRepository.createUser(newUser).catch((error) => {
      console.error("Failed to persist user", error);
    });
    void auditRepository.createAuditLog(auditLog).catch((error) => {
      console.error("Failed to persist user creation audit log", error);
    });
  };

  const saveSystemSettings = async (settings: SystemSettings) => {
    const nextSettings = mergeSystemSettings({
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserProfile?.name ?? settings.updatedBy ?? 'Brgy. Admin',
    });
    setSystemSettings(nextSettings);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('settings'),
        type: 'save-system-settings',
        createdAt: new Date().toISOString(),
        payload: { settings: nextSettings },
      });
      return;
    }

    try {
      await systemSettingsRepository.saveSettings(nextSettings);
    } catch (error) {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('settings'),
          type: 'save-system-settings',
          createdAt: new Date().toISOString(),
          payload: { settings: nextSettings },
        });
        return;
      }

      console.error("Failed to persist system settings", error);
    }
  };

  const updateUser = (userId: string, updatedUser: User) => {
    const nextUser: User = {
      ...updatedUser,
      id: updatedUser.id ?? updatedUser.uid ?? userId,
      uid: updatedUser.uid ?? updatedUser.id ?? userId,
      updatedAt: new Date().toISOString(),
    };
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: nextUser.updatedAt ?? new Date().toISOString(),
      user: actorName,
      action: 'UPDATE_USER_RECORD',
      details: `${nextUser.name} (${nextUser.email}) - ${nextUser.role}, ${nextUser.status ?? 'active'}, ${nextUser.preferredWorkspace ?? 'simple'}`,
    };
    setUsers(prev => {
      const hasExistingUser = prev.some((user) => getUserRecordId(user) === userId);
      const nextUsers = hasExistingUser
        ? prev.map((user) => (getUserRecordId(user) === userId ? nextUser : user))
        : [...prev, nextUser];
      return nextUsers.sort((left, right) => left.name.localeCompare(right.name));
    });
    setAuditLogs(prev => [auditLog, ...prev]);
    void userRepository.updateUser(userId, nextUser).catch((error) => {
      console.error("Failed to persist user update", error);
    });
    void auditRepository.createAuditLog(auditLog).catch((error) => {
      console.error("Failed to persist user update audit log", error);
    });
  };

  const deleteUser = (userId: string) => {
    const actorName = currentUserProfile?.name ?? 'Developer';
    const userToDelete = users.find((user) => getUserRecordId(user) === userId);
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: new Date().toISOString(),
      user: actorName,
      action: 'DELETE_USER_ACCESS',
      details: userToDelete
        ? `${userToDelete.name} (${userToDelete.email})`
        : userId,
    };
    setUsers(prev => prev.filter(u => getUserRecordId(u) !== userId));
    setAuditLogs(prev => [auditLog, ...prev]);
    void userRepository.deleteUser(userId).catch((error) => {
      console.error("Failed to delete user", error);
    });
    void auditRepository.createAuditLog(auditLog).catch((error) => {
      console.error("Failed to persist user delete audit log", error);
    });
  };

  const exportPortableBackup = (): PortableAppBackup => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: currentUserProfile?.name ?? currentUserProfile?.email ?? 'Lingkod-Ani User',
    data: {
      farmers,
      smsMessages,
      outboundMessages,
      resources,
      marketPrices,
      knowledgeArticles,
      logbookEntries: logbook,
      auditLogs,
      alertHistory,
      assistanceRecords,
      fieldVisitTasks,
      smsTrainingExamples,
      systemSettings,
      vouchers,
    } satisfies PortableAppDataBundle,
  });

  const importSmsTrainingExamples = async (examples: SmsTrainingExample[]) => {
    if (examples.length === 0) {
      return 0;
    }

    const importedAt = new Date().toISOString();
    const normalizedExamples = examples.map((example) => ({
      ...example,
      reviewStatus: example.reviewStatus ?? 'needs_review',
      reviewNotes:
        example.reviewNotes ??
        'Imported teaching example. Hintayin munang ma-review bago gamitin bilang live precedent.',
      importedAt: example.importedAt ?? importedAt,
    }));
    const mergedExamples = mergeById(smsTrainingExamples, normalizedExamples);
    const nextExamples = sortByDateDescending(
      mergedExamples.items.map((example) => {
        const importedVersion = normalizedExamples.find((item) => item.id === example.id);
        return importedVersion ?? example;
      }),
      (example) => example.finalReview.reviewedAt
    );
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: new Date().toISOString(),
      user: actorName,
        action: 'IMPORT_SMS_TRAINING_DATA',
        details: `${examples.length} SMS training examples ang in-import at minarkahang needs review.`,
      };

    setSmsTrainingExamples(nextExamples);
    setAuditLogs((prev) => sortByDateDescending([auditLog, ...prev], (entry) => entry.timestamp));

      if (usingLiveData) {
        await Promise.all([
          ...normalizedExamples.map((example) => smsTrainingRepository.createTrainingExample(example)),
          auditRepository.createAuditLog(auditLog),
        ]);
      }

    return mergedExamples.importedRecords;
  };

  const importKnowledgeArticles = async (articles: KnowledgeArticle[]) => {
    if (articles.length === 0) {
      return 0;
    }

      const importedAt = new Date().toISOString();
      const normalizedArticles = articles.map((article) => {
        const existingMatch = knowledgeArticles.find(
          (currentArticle) =>
            currentArticle.title.trim().toLowerCase() === article.title.trim().toLowerCase()
        );

        return {
          ...article,
          reviewStatus: article.reviewStatus ?? 'needs_review',
          reviewNotes:
            article.reviewNotes ??
            'Imported article. Hintayin munang ma-review bago isama sa live search assistant.',
          sourceLabel: article.sourceLabel ?? article.author,
          sourceType: article.sourceType ?? 'imported_file',
          version: article.version ?? ((existingMatch?.version ?? 0) + 1),
          supersedesArticleId: article.supersedesArticleId ?? existingMatch?.id,
          reviewedAt: article.reviewStatus === 'approved' ? article.reviewedAt ?? importedAt : article.reviewedAt,
        } satisfies KnowledgeArticle;
      });

      const mergedArticles = mergeById(knowledgeArticles, normalizedArticles);
      const nextArticles = sortByDateDescending(
        mergedArticles.items,
        (article) => article.lastUpdated
    );
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: new Date().toISOString(),
      user: actorName,
        action: 'IMPORT_KNOWLEDGE_ARTICLES',
        details: `${articles.length} knowledge articles ang in-import at minarkahang needs review.`,
      };

    setKnowledgeArticles(nextArticles);
    setAuditLogs((prev) => sortByDateDescending([auditLog, ...prev], (entry) => entry.timestamp));

    if (usingLiveData) {
      await Promise.all([
        knowledgeRepository.updateKnowledgeArticles(nextArticles),
        auditRepository.createAuditLog(auditLog),
      ]);
    }

      return mergedArticles.importedRecords;
    };

  const reviewSmsTrainingExample = async (
    exampleId: string,
    reviewStatus: NonNullable<SmsTrainingExample["reviewStatus"]>,
    reviewNotes?: string
  ) => {
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    let nextExample: SmsTrainingExample | null = null;

    const nextExamples = smsTrainingExamples.map((example) => {
      if (example.id !== exampleId) {
        return example;
      }

      nextExample = {
        ...example,
        reviewStatus,
        reviewNotes: reviewNotes?.trim() || example.reviewNotes,
        finalReview: {
          ...example.finalReview,
          reviewedAt: timestamp,
          reviewedBy: actorName,
        },
      };
      return nextExample;
    });

    if (!nextExample) {
      return;
    }

    setSmsTrainingExamples(nextExamples);
    await smsTrainingRepository.createTrainingExample(nextExample);
  };

  const reviewKnowledgeArticle = async (
    articleId: string,
    reviewStatus: NonNullable<KnowledgeArticle["reviewStatus"]>,
    reviewNotes?: string
  ) => {
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const nextArticles = knowledgeArticles.map((article) =>
      article.id === articleId
        ? {
            ...article,
            reviewStatus,
            reviewNotes: reviewNotes?.trim() || article.reviewNotes,
            reviewedAt: timestamp,
            reviewedBy: actorName,
          }
        : article
    );

    setKnowledgeArticles(nextArticles);
    await knowledgeRepository.updateKnowledgeArticles(nextArticles);
  };

  const importPortableBackup = async (backup: PortableAppBackup) => {
    const importableSmsMessages = filterVisibleInboundSmsMessages(backup.data.smsMessages);
    const mergedFarmers = mergeById(farmers, backup.data.farmers);
    const mergedSmsMessages = mergeById(smsMessages, importableSmsMessages);
    const mergedOutboundMessages = mergeById(outboundMessages, backup.data.outboundMessages);
    const mergedResources = mergeById(resources, backup.data.resources);
    const mergedMarketPrices = mergeById(marketPrices, backup.data.marketPrices);
    const mergedKnowledgeArticles = mergeById(knowledgeArticles, backup.data.knowledgeArticles);
    const mergedLogbook = mergeById(logbook, backup.data.logbookEntries);
    const mergedAuditLogs = mergeById(auditLogs, backup.data.auditLogs);
    const mergedAlertHistory = mergeById(alertHistory, backup.data.alertHistory);
    const mergedAssistanceRecords = mergeById(assistanceRecords, backup.data.assistanceRecords);
    const mergedFieldVisitTasks = mergeById(fieldVisitTasks, backup.data.fieldVisitTasks);
    const mergedTrainingExamples = mergeById(smsTrainingExamples, backup.data.smsTrainingExamples);
    const mergedVouchers = mergeById(vouchers, backup.data.vouchers);
    const nextSystemSettings = mergeSystemSettings(backup.data.systemSettings);
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const importedCollections = Object.entries({
      farmers: backup.data.farmers.length,
      smsMessages: importableSmsMessages.length,
      outboundMessages: backup.data.outboundMessages.length,
      resources: backup.data.resources.length,
      marketPrices: backup.data.marketPrices.length,
      knowledgeArticles: backup.data.knowledgeArticles.length,
      logbookEntries: backup.data.logbookEntries.length,
      auditLogs: backup.data.auditLogs.length,
      alertHistory: backup.data.alertHistory.length,
      assistanceRecords: backup.data.assistanceRecords.length,
      fieldVisitTasks: backup.data.fieldVisitTasks.length,
      smsTrainingExamples: backup.data.smsTrainingExamples.length,
      vouchers: backup.data.vouchers.length,
      systemSettings: 1,
    })
      .filter(([, count]) => count > 0)
      .map(([collectionName]) => collectionName);
    const importedRecords =
      backup.data.farmers.length +
      importableSmsMessages.length +
      backup.data.outboundMessages.length +
      backup.data.resources.length +
      backup.data.marketPrices.length +
      backup.data.knowledgeArticles.length +
      backup.data.logbookEntries.length +
      backup.data.auditLogs.length +
      backup.data.alertHistory.length +
      backup.data.assistanceRecords.length +
      backup.data.fieldVisitTasks.length +
      backup.data.smsTrainingExamples.length +
      backup.data.vouchers.length;
    const importAuditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: new Date().toISOString(),
      user: actorName,
      action: 'IMPORT_APP_BACKUP',
      details: `Nag-import ng backup para sa ${importedCollections.join(', ') || 'walang collection'} (${importedRecords} records).`,
    };

    setFarmers(sortByDateDescending(mergedFarmers.items, (item) => item.registrationDate));
    setSmsMessages(sortVisibleSmsMessages(mergedSmsMessages.items));
    setOutboundMessages(sortByDateDescending(mergedOutboundMessages.items, (item) => item.createdAt));
    setResources(sortByDateDescending(mergedResources.items, (item) => item.lastUpdated));
    setMarketPrices(sortByDateDescending(mergedMarketPrices.items, (item) => item.updatedAt));
    setKnowledgeArticles(sortByDateDescending(mergedKnowledgeArticles.items, (item) => item.lastUpdated));
    setLogbook(sortByDateDescending(mergedLogbook.items, (item) => item.timestamp));
    setAlertHistory(sortByDateDescending(mergedAlertHistory.items, (item) => item.timestamp));
    setAssistanceRecords(sortByDateDescending(mergedAssistanceRecords.items, (item) => item.updatedAt));
    setFieldVisitTasks(sortByDateAscending(mergedFieldVisitTasks.items, (item) => item.scheduledFor));
    setSmsTrainingExamples(sortByDateDescending(mergedTrainingExamples.items, (item) => item.finalReview.reviewedAt));
    setVouchers(sortByDateDescending(mergedVouchers.items, (item) => item.issueDate));
    setSystemSettings(nextSystemSettings);
    setAuditLogs(sortByDateDescending([...mergedAuditLogs.items, importAuditLog], (item) => item.timestamp));

    if (usingLiveData) {
      await Promise.all([
        ...backup.data.farmers.map((item) => farmerRepository.createFarmer(item)),
        ...importableSmsMessages.map((item) => smsRepository.createInboundMessage(item)),
        ...backup.data.outboundMessages.map((item) => outboundMessageRepository.createOutboundMessage(item)),
        ...backup.data.resources.map((item) => resourceRepository.createResource(item)),
        ...backup.data.marketPrices.map((item) => marketPriceRepository.createMarketPriceEntry(item)),
        ...backup.data.logbookEntries.map((item) => logbookRepository.createEntry(item)),
        ...backup.data.auditLogs.map((item) => auditRepository.createAuditLog(item)),
        ...backup.data.alertHistory.map((item) => alertHistoryRepository.createAlertHistoryEntry(item)),
        ...backup.data.assistanceRecords.map((item) => assistanceRepository.createAssistanceRecord(item)),
        ...backup.data.fieldVisitTasks.map((item) => fieldVisitRepository.createFieldVisitTask(item)),
        ...backup.data.smsTrainingExamples.map((item) => smsTrainingRepository.createTrainingExample(item)),
        ...backup.data.vouchers.map((item) => voucherRepository.createVoucher(item)),
        knowledgeRepository.updateKnowledgeArticles(mergedKnowledgeArticles.items),
        systemSettingsRepository.saveSettings(nextSystemSettings),
        auditRepository.createAuditLog(importAuditLog),
      ]);
    }

    return {
      importedCollections,
      importedRecords,
    };
  };

  const updateFarmerRecord = (farmerId: string, updates: Partial<Farmer>) => {
    const currentFarmer = farmers.find((farmer) => farmer.id === farmerId);

    if (!currentFarmer) {
      return;
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const rawNextFarmer = {
      ...currentFarmer,
      ...updates,
    };
    const nextFarmer = prepareFarmerRecord({
      farmer: rawNextFarmer,
      existingFarmers: farmers,
      previousFarmer: currentFarmer,
      actorName,
      source:
        updates.sharedPhone !== undefined || updates.householdLabel !== undefined || updates.sharedPhoneNotes !== undefined
          ? 'household_update'
          : 'profile_edit',
      timestamp,
      reason: 'Farmer profile updated from dashboard.',
    });
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'UPDATE_FARMER',
      details: `${nextFarmer.name} (${nextFarmer.id})`,
    };

    setFarmers(prev => prev.map((farmer) => farmer.id === farmerId ? nextFarmer : farmer));
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('farmer'),
        type: 'update-farmer-record',
        createdAt: timestamp,
        payload: {
          farmerId,
          updates: buildPersistableFarmerUpdates(nextFarmer),
          auditLog,
        },
      });
      return;
    }

    void farmerRepository.updateFarmer(farmerId, buildPersistableFarmerUpdates(nextFarmer)).then(() => {
      return auditRepository.createAuditLog(auditLog).catch((error) => {
        console.error("Failed to persist farmer update audit log", error);
      });
    }).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('farmer'),
          type: 'update-farmer-record',
          createdAt: timestamp,
          payload: {
            farmerId,
            updates: buildPersistableFarmerUpdates(nextFarmer),
            auditLog,
          },
        });
        return;
      }
      setFarmers(prev => prev.map((farmer) => (
        farmer.id === farmerId ? currentFarmer : farmer
      )));
      setAuditLogs(prev => prev.filter((entry) => entry.id !== auditLog.id));
      console.error("Failed to persist farmer update", error);
    });
  };

  const updateFarmerStatus = async (
    farmerId: string,
    status: Farmer['status'],
    options?: FarmerStatusUpdateOptions
  ) => {
    const currentFarmer = farmers.find((farmer) => farmer.id === farmerId);

    if (!currentFarmer) {
      return {
        ok: false,
        status,
        reason: 'not_found' as const,
      };
    }

    if (currentFarmer.status === status) {
      return {
        ok: false,
        status,
        farmer: currentFarmer,
        previousFarmer: currentFarmer,
        reason: 'no_change' as const,
      };
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const action =
      status === 'active' && currentFarmer.status === 'pending_approval'
        ? 'APPROVE_FARMER_REGISTRATION'
        : status === 'rejected'
          ? 'REJECT_FARMER_REGISTRATION'
          : status === 'archived'
            ? 'ARCHIVE_FARMER'
          : 'UPDATE_FARMER_STATUS';
    const archiveUpdates: Partial<Farmer> =
      status === 'archived'
        ? {
            archivedAt: timestamp,
            archivedBy: actorName,
            archiveReason: options?.archiveReason?.trim() || 'Archived from active farmer roster.',
          }
        : currentFarmer.status === 'archived'
          ? {
              archivedAt: undefined,
              archivedBy: undefined,
              archiveReason: undefined,
            }
          : {};
    const rawNextFarmer: Farmer = {
      ...currentFarmer,
      status,
      ...archiveUpdates,
    };
    const nextFarmer = prepareFarmerRecord({
      farmer: rawNextFarmer,
      existingFarmers: farmers,
      previousFarmer: currentFarmer,
      actorName,
      source: status === 'active' && currentFarmer.status === 'pending_approval' ? 'approval_review' : 'system_reconciliation',
      timestamp,
      reason:
        status === 'active' && currentFarmer.status === 'pending_approval'
          ? 'Farmer registration approved.'
          : `Farmer status changed to ${status}.`,
    });
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action,
      details:
        status === 'archived' && nextFarmer.archiveReason
          ? `${currentFarmer.name} (${currentFarmer.id}) -> archived (${nextFarmer.archiveReason})`
          : `${currentFarmer.name} (${currentFarmer.id}) -> ${status}`,
    };

    setFarmers(prev => prev.map((farmer) => (
      farmer.id === farmerId
        ? nextFarmer
        : farmer
    )));
    setAuditLogs(prev => [auditLog, ...prev]);

    try {
      const persistedFarmer = await farmerRepository.updateFarmer(farmerId, {
        ...buildPersistableFarmerUpdates(nextFarmer),
      });

      if (!persistedFarmer) {
        throw new Error('Farmer record was not found in the demo data store.');
      }

      await auditRepository.createAuditLog(auditLog).catch((error) => {
        console.error("Failed to persist farmer status audit log", error);
      });

      return {
        ok: true,
        status,
        farmer: nextFarmer,
        previousFarmer: currentFarmer,
      };
    } catch (error) {
      setFarmers(prev => prev.map((farmer) => (
        farmer.id === farmerId
          ? currentFarmer
          : farmer
      )));
      setAuditLogs(prev => prev.filter((entry) => entry.id !== auditLog.id));
      console.error("Failed to persist farmer status update", error);
      return {
        ok: false,
        status,
        farmer: currentFarmer,
        previousFarmer: currentFarmer,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };

  const updateManyFarmerStatuses = async (farmerIds: string[], status: Farmer['status']) => {
    const normalizedIds = Array.from(new Set(farmerIds));
    const targetFarmers = farmers.filter((farmer) => normalizedIds.includes(farmer.id) && farmer.status !== status);

    if (targetFarmers.length === 0) {
      return {
        ok: false,
        status,
        updatedCount: 0,
        farmers: [],
        reason: 'none_selected' as const,
      };
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const preparedFarmers = targetFarmers.map((farmer) =>
      prepareFarmerRecord({
        farmer: { ...farmer, status },
        existingFarmers: farmers,
        previousFarmer: farmer,
        actorName,
        source: status === 'active' && farmer.status === 'pending_approval' ? 'approval_review' : 'system_reconciliation',
        timestamp,
        reason: `Bulk farmer status update to ${status}.`,
      })
    );
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'BULK_UPDATE_FARMER_STATUS',
      details: `${preparedFarmers.length} magsasaka -> ${status}`,
    };

    setFarmers(prev => prev.map((farmer) => (
      preparedFarmers.find((candidate) => candidate.id === farmer.id) ?? farmer
    )));
    setAuditLogs(prev => [auditLog, ...prev]);

    try {
      const persistedFarmers = await Promise.all(
        preparedFarmers.map((farmer) =>
          farmerRepository.updateFarmer(farmer.id, buildPersistableFarmerUpdates(farmer))
        )
      );

      if (persistedFarmers.some((farmer) => !farmer)) {
        throw new Error('One or more farmer records were missing from the demo data store.');
      }

      await auditRepository.createAuditLog(auditLog).catch((error) => {
        console.error("Failed to persist bulk farmer status audit log", error);
      });

      return {
        ok: true,
        status,
        updatedCount: preparedFarmers.length,
        farmers: preparedFarmers,
      };
    } catch (error) {
      setFarmers(prev => prev.map((farmer) => {
        const originalFarmer = targetFarmers.find((candidate) => candidate.id === farmer.id);
        return originalFarmer ? originalFarmer : farmer;
      }));
      setAuditLogs(prev => prev.filter((entry) => entry.id !== auditLog.id));
      console.error("Failed to persist bulk farmer status update", error);

      return {
        ok: false,
        status,
        updatedCount: 0,
        farmers: targetFarmers,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };

  const deleteFarmerRecord = async (farmerId: string) => {
    const currentFarmer = farmers.find((farmer) => farmer.id === farmerId);

    if (!currentFarmer) {
      return {
        ok: false,
        reason: 'not_found' as const,
      };
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'DELETE_FARMER',
      details: `${currentFarmer.name} (${currentFarmer.id})`,
    };

    setFarmers(prev => prev.filter((farmer) => farmer.id !== farmerId));
    setAuditLogs(prev => [auditLog, ...prev]);

    try {
      await farmerRepository.deleteFarmer(farmerId);
      await auditRepository.createAuditLog(auditLog).catch((error) => {
        console.error("Failed to persist farmer deletion audit log", error);
      });
      return {
        ok: true,
        deletedItem: currentFarmer,
      };
    } catch (error) {
      setFarmers(prev => sortByDateDescending([currentFarmer, ...prev], (farmer) => farmer.registrationDate));
      setAuditLogs(prev => prev.filter((entry) => entry.id !== auditLog.id));
      console.error("Failed to persist farmer deletion", error);
      return {
        ok: false,
        deletedItem: currentFarmer,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };

  const mergeFarmerRecords = async (sourceFarmerId: string, targetFarmerId: string) => {
    const sourceFarmer = farmers.find((farmer) => farmer.id === sourceFarmerId);
    const targetFarmer = farmers.find((farmer) => farmer.id === targetFarmerId);

    if (!sourceFarmer || !targetFarmer || sourceFarmer.id === targetFarmer.id) {
      return false;
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const mergedPhoneHistory = Array.from(
      new Set(
        [
          ...(targetFarmer.phoneHistory ?? []),
          targetFarmer.phone,
          ...(sourceFarmer.phoneHistory ?? []),
          sourceFarmer.phone,
        ]
          .map((phone) => phone?.trim())
          .filter((phone): phone is string => Boolean(phone))
      )
    );
    const mergedFromFarmerIds = Array.from(
      new Set([
        ...(targetFarmer.mergedFromFarmerIds ?? []),
        ...(sourceFarmer.mergedFromFarmerIds ?? []),
        sourceFarmer.id,
      ])
    );
    const lastSmsActivity =
      normalizeTimestamp(sourceFarmer.lastSmsActivity) > normalizeTimestamp(targetFarmer.lastSmsActivity)
        ? sourceFarmer.lastSmsActivity
        : targetFarmer.lastSmsActivity;
    const mergedTargetUpdates: Partial<Farmer> = {
      lastSmsActivity,
      phoneHistory: mergedPhoneHistory,
      mergedFromFarmerIds,
      crops: Array.from(new Set([...targetFarmer.crops, ...sourceFarmer.crops])),
      farmSize: Math.max(targetFarmer.farmSize, sourceFarmer.farmSize),
      age: targetFarmer.age || sourceFarmer.age,
      gender:
        targetFarmer.gender && targetFarmer.gender !== 'Hindi natukoy'
          ? targetFarmer.gender
          : sourceFarmer.gender,
      sitio:
        targetFarmer.sitio && targetFarmer.sitio !== 'Hindi tukoy'
          ? targetFarmer.sitio
          : sourceFarmer.sitio,
      barangay:
        targetFarmer.barangay && targetFarmer.barangay !== 'Hindi tukoy'
          ? targetFarmer.barangay
          : sourceFarmer.barangay,
    };
    const mergedSourceUpdates: Partial<Farmer> = {
      status: 'inactive',
      mergedIntoFarmerId: targetFarmer.id,
      phoneHistory: Array.from(
        new Set([
          ...(sourceFarmer.phoneHistory ?? []),
          sourceFarmer.phone,
        ])
      ),
    };
    const rawTargetFarmer: Farmer = {
      ...targetFarmer,
      ...mergedTargetUpdates,
    };
    const rawSourceFarmer: Farmer = {
      ...sourceFarmer,
      ...mergedSourceUpdates,
    };
    const nextTargetFarmer = prepareFarmerRecord({
      farmer: rawTargetFarmer,
      existingFarmers: [
        ...farmers.filter((farmer) => farmer.id !== targetFarmer.id && farmer.id !== sourceFarmer.id),
        rawSourceFarmer,
      ],
      previousFarmer: targetFarmer,
      actorName,
      source: 'merge',
      timestamp,
      reason: `Merged farmer record ${sourceFarmer.id} into this profile.`,
    });
    const nextSourceFarmer = prepareFarmerRecord({
      farmer: rawSourceFarmer,
      existingFarmers: [
        ...farmers.filter((farmer) => farmer.id !== sourceFarmer.id && farmer.id !== targetFarmer.id),
        nextTargetFarmer,
      ],
      previousFarmer: sourceFarmer,
      actorName,
      source: 'merge',
      timestamp,
      reason: `Merged into farmer record ${targetFarmer.id}.`,
    });
    const smsToMove = smsMessages.filter((message) => message.farmerId === sourceFarmer.id);
    const assistanceToMove = assistanceRecords.filter((record) => record.farmerId === sourceFarmer.id);
    const visitsToMove = fieldVisitTasks.filter((task) => task.farmerId === sourceFarmer.id);
    const vouchersToMove = vouchers.filter((voucher) => voucher.farmerId === sourceFarmer.id);
    const logbookToMove = logbook.filter((entry) => entry.farmerId === sourceFarmer.id);
    const trainingExamplesToMove = smsTrainingExamples.filter((example) => example.farmerId === sourceFarmer.id);
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'MERGE_FARMER_RECORDS',
      details: `${sourceFarmer.name} (${sourceFarmer.id}) -> ${targetFarmer.name} (${targetFarmer.id})`,
    };

    const previousFarmers = farmers;
    const previousSmsMessages = smsMessages;
    const previousAssistanceRecords = assistanceRecords;
    const previousFieldVisitTasks = fieldVisitTasks;
    const previousVouchers = vouchers;
    const previousLogbook = logbook;
    const previousTrainingExamples = smsTrainingExamples;
    const previousAuditLogs = auditLogs;

    setFarmers((prev) =>
      sortByDateDescending(
        prev.map((farmer) => {
          if (farmer.id === sourceFarmer.id) return nextSourceFarmer;
          if (farmer.id === targetFarmer.id) return nextTargetFarmer;
          return farmer;
        }),
        (farmer) => farmer.registrationDate
      )
    );
    setSmsMessages((prev) =>
      sortVisibleSmsMessages(
        prev.map((message) =>
          message.farmerId === sourceFarmer.id
            ? {
                ...message,
                farmerId: targetFarmer.id,
                farmerName: nextTargetFarmer.name,
              }
            : message
        )
      )
    );
    setAssistanceRecords((prev) =>
      sortByDateDescending(
        prev.map((record) =>
          record.farmerId === sourceFarmer.id
            ? { ...record, farmerId: targetFarmer.id }
            : record
        ),
        (record) => record.updatedAt
      )
    );
    setFieldVisitTasks((prev) =>
      sortByDateAscending(
        prev.map((task) =>
          task.farmerId === sourceFarmer.id
            ? { ...task, farmerId: targetFarmer.id }
            : task
        ),
        (task) => task.scheduledFor
      )
    );
    setVouchers((prev) =>
      sortByDateDescending(
        prev.map((voucher) =>
          voucher.farmerId === sourceFarmer.id
            ? { ...voucher, farmerId: targetFarmer.id }
            : voucher
        ),
        (voucher) => voucher.issueDate
      )
    );
    setLogbook((prev) =>
      sortByDateDescending(
        prev.map((entry) =>
          entry.farmerId === sourceFarmer.id
            ? { ...entry, farmerId: targetFarmer.id }
            : entry
        ),
        (entry) => entry.timestamp
      )
    );
    setSmsTrainingExamples((prev) =>
      sortByDateDescending(
        prev.map((example) =>
          example.farmerId === sourceFarmer.id
            ? {
                ...example,
                farmerId: targetFarmer.id,
                farmerName: nextTargetFarmer.name,
                phone:
                  normalizeFarmerPhone(example.phone) === normalizeFarmerPhone(sourceFarmer.phone)
                    ? sourceFarmer.phone
                    : example.phone,
              }
            : example
        ),
        (example) => example.finalReview.reviewedAt
      )
    );
    setAuditLogs((prev) => [auditLog, ...prev]);

    try {
      await Promise.all([
        farmerRepository.updateFarmer(targetFarmer.id, buildPersistableFarmerUpdates(nextTargetFarmer)),
        farmerRepository.updateFarmer(sourceFarmer.id, buildPersistableFarmerUpdates(nextSourceFarmer)),
        ...smsToMove.map((message) =>
          smsRepository.updateMessage(message.id, {
            farmerId: targetFarmer.id,
            farmerName: nextTargetFarmer.name,
          })
        ),
        ...assistanceToMove.map((record) =>
          assistanceRepository.updateAssistanceRecord(record.id, {
            farmerId: targetFarmer.id,
          })
        ),
        ...visitsToMove.map((task) =>
          fieldVisitRepository.updateFieldVisitTask(task.id, {
            farmerId: targetFarmer.id,
          })
        ),
        ...vouchersToMove.map((voucher) =>
          voucherRepository.updateVoucher(voucher.id, {
            farmerId: targetFarmer.id,
          })
        ),
        ...logbookToMove.map((entry) =>
          logbookRepository.updateEntry(entry.id, {
            farmerId: targetFarmer.id,
          })
        ),
        ...trainingExamplesToMove.map((example) =>
          smsTrainingRepository.updateTrainingExample(example.id, {
            farmerId: targetFarmer.id,
            farmerName: nextTargetFarmer.name,
          })
        ),
        auditRepository.createAuditLog(auditLog),
      ]);

      return true;
    } catch (error) {
      setFarmers(previousFarmers);
      setSmsMessages(previousSmsMessages);
      setAssistanceRecords(previousAssistanceRecords);
      setFieldVisitTasks(previousFieldVisitTasks);
      setVouchers(previousVouchers);
      setLogbook(previousLogbook);
      setSmsTrainingExamples(previousTrainingExamples);
      setAuditLogs(previousAuditLogs);
      console.error("Failed to merge farmer records", error);
      return false;
    }
  };

  const addPendingFarmer = async (farmerData: FarmerRegistrationValues) => {
    const normalizedPhone = normalizeFarmerPhone(farmerData.phone);
    const duplicateFarmer = farmers.find((farmer) => (
      !farmer.mergedIntoFarmerId &&
      farmer.status !== 'archived' &&
      normalizeFarmerPhone(farmer.phone) === normalizedPhone &&
      !(farmer.sharedPhone || farmerData.sharedPhone)
    ));

    if (duplicateFarmer) {
      return {
        ok: false,
        reason: 'duplicate' as const,
        item: duplicateFarmer,
      };
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const newFarmer = prepareFarmerRecord({
      farmer: {
        id: `FARM${Date.now()}`,
        name: farmerData.name,
        phone: farmerData.phone,
        barangay: farmerData.barangay,
        sitio: farmerData.sitio,
        crops: farmerData.crops ? farmerData.crops.split(',').map(c => c.trim()) : [],
        farmSize: farmerData.farmSize || 0,
        age: farmerData.age || 0,
        gender: farmerData.gender || 'Hindi natukoy',
        registrationDate: timestamp,
        lastSmsActivity: timestamp,
        status: 'pending_approval',
        sharedPhone: farmerData.sharedPhone,
        householdLabel: farmerData.householdLabel?.trim() || undefined,
        sharedPhoneNotes: farmerData.sharedPhoneNotes?.trim() || undefined,
      },
      existingFarmers: farmers,
      actorName,
      source: 'manual_registration',
      timestamp,
      reason: 'Manually submitted pending farmer registration.',
    });
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'CREATE_PENDING_FARMER',
      details: `${newFarmer.name} (${newFarmer.phone})`,
    };

    setFarmers(prev => sortByDateDescending([newFarmer, ...prev], (farmer) => farmer.registrationDate));
    setAuditLogs(prev => [auditLog, ...prev]);

    try {
      await farmerRepository.createFarmer(newFarmer);
      await auditRepository.createAuditLog(auditLog).catch((error) => {
        console.error("Failed to persist pending farmer audit log", error);
      });
      return {
        ok: true,
        item: newFarmer,
      };
    } catch (error) {
      setFarmers(prev => prev.filter((farmer) => farmer.id !== newFarmer.id));
      setAuditLogs(prev => prev.filter((entry) => entry.id !== auditLog.id));
      console.error("Failed to persist pending farmer", error);
      return {
        ok: false,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };
  
  const addKnowledgeArticle = (data: NewKnowledgeArticleData) => {
      const newArticle: KnowledgeArticle = {
          id: `KB${Date.now()}`,
          title: data.title,
          summary: data.summary,
        content: data.content,
        keywords: data.keywords,
          type: data.type,
          author: 'Admin',
          lastUpdated: new Date().toISOString(),
          audioUrl: data.type === 'audio' ? data.audioUrl : undefined,
          reviewStatus: data.reviewStatus ?? 'approved',
          reviewNotes: data.reviewNotes,
          reviewedAt: data.reviewStatus === 'needs_review' ? data.reviewedAt : data.reviewedAt ?? new Date().toISOString(),
          reviewedBy: data.reviewedBy ?? currentUserProfile?.name ?? 'Admin',
          sourceLabel: data.sourceLabel,
          sourceType: data.sourceType ?? (data.type === 'audio' ? 'audio_upload' : 'manual'),
          version: data.version ?? 1,
          supersedesArticleId: data.supersedesArticleId,
      };
      setKnowledgeArticles(prev => [newArticle, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('knowledge'),
        type: 'create-knowledge-article',
        createdAt: newArticle.lastUpdated,
        payload: { article: newArticle },
      });
      return;
    }

    void knowledgeRepository.createKnowledgeArticle(newArticle).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('knowledge'),
          type: 'create-knowledge-article',
          createdAt: newArticle.lastUpdated,
          payload: { article: newArticle },
        });
        return;
      }
      console.error("Failed to persist knowledge article", error);
    });
  };
  
  const addVoucher = async (voucherData: Omit<Voucher, 'id' | 'code' | 'status' | 'issueDate'>) => {
    const farmer = farmers.find((entry) => entry.id === voucherData.farmerId);
    const resource = resources.find((entry) => entry.id === voucherData.resourceId);

    if (!farmer || !resource || voucherData.quantity <= 0) {
      return {
        ok: false,
        reason: 'invalid' as const,
      };
    }

    if (resource.stock < voucherData.quantity) {
      return {
        ok: false,
        reason: 'insufficient_stock' as const,
        previousItem: resource as unknown as Voucher,
      };
    }

    const newVoucher: Voucher = {
      ...voucherData,
      id: `VOUCH${Date.now()}`,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'issued',
      issueDate: new Date().toISOString(),
    };
    setVouchers(prev => [newVoucher, ...prev]);
    try {
      await voucherRepository.createVoucher(newVoucher);
      return {
        ok: true,
        item: newVoucher,
      };
    } catch (error) {
      setVouchers(prev => prev.filter((voucher) => voucher.id !== newVoucher.id));
      console.error("Failed to persist voucher", error);
      return {
        ok: false,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };

  const updateVoucherStatus = async (voucherId: string, status: VoucherStatus) => {
    const previousVoucher = vouchers.find((voucher) => voucher.id === voucherId);

    if (!previousVoucher) {
      return {
        ok: false,
        reason: 'not_found' as const,
      };
    }

    if (previousVoucher.status === status) {
      return {
        ok: false,
        reason: 'no_change' as const,
        item: previousVoucher,
        previousItem: previousVoucher,
      };
    }

    if ((previousVoucher.status === 'redeemed' || previousVoucher.status === 'voided') && status === 'redeemed') {
      return {
        ok: false,
        reason: 'invalid' as const,
        item: previousVoucher,
        previousItem: previousVoucher,
      };
    }

    const linkedResource = resources.find((resource) => resource.id === previousVoucher.resourceId);
    const previousResource = linkedResource ? { ...linkedResource } : undefined;
    const nextRedemptionDate = status === 'redeemed' ? new Date().toISOString() : undefined;
    const stockDelta =
      previousVoucher.status !== 'redeemed' && status === 'redeemed'
        ? -previousVoucher.quantity
        : previousVoucher.status === 'redeemed' && status !== 'redeemed'
          ? previousVoucher.quantity
          : 0;

    if (stockDelta !== 0 && !linkedResource) {
      return {
        ok: false,
        reason: 'invalid' as const,
        item: previousVoucher,
        previousItem: previousVoucher,
      };
    }

    if (linkedResource && linkedResource.stock + stockDelta < 0) {
      return {
        ok: false,
        reason: 'insufficient_stock' as const,
        item: previousVoucher,
        previousItem: previousVoucher,
      };
    }

    const nextVoucher: Voucher = {
      ...previousVoucher,
      status,
      redemptionDate: nextRedemptionDate ?? previousVoucher.redemptionDate,
    };
    const nextResource = linkedResource && stockDelta !== 0
      ? {
          ...linkedResource,
          stock: linkedResource.stock + stockDelta,
          lastUpdated: new Date().toISOString(),
        }
      : undefined;
    setVouchers(prev =>
      prev.map(v =>
        v.id === voucherId
          ? nextVoucher
          : v
      )
    );
    if (nextResource) {
      setResources(prev => prev.map((resource) => (
        resource.id === nextResource.id ? nextResource : resource
      )));
    }

    try {
      await voucherRepository.updateVoucher(voucherId, {
        status,
        redemptionDate: nextRedemptionDate,
      });

      if (nextResource) {
        const persistedResource = await resourceRepository.updateResource(nextResource.id, {
          stock: nextResource.stock,
          lastUpdated: nextResource.lastUpdated,
        });

        if (!persistedResource) {
          throw new Error('Resource record was not found while updating voucher stock.');
        }
      }

      return {
        ok: true,
        item: nextVoucher,
        previousItem: previousVoucher,
      };
    } catch (error) {
      setVouchers(prev =>
        prev.map((voucher) => (
          voucher.id === voucherId ? previousVoucher : voucher
        ))
      );
      if (previousResource) {
        setResources(prev => prev.map((resource) => (
          resource.id === previousResource.id ? previousResource : resource
        )));
      }
      console.error("Failed to persist voucher update", error);
      return {
        ok: false,
        reason: 'persist_failed' as const,
        item: previousVoucher,
        previousItem: previousVoucher,
        error,
      };
    }
  };
  
  const addResource = async (data: NewResourceData) => {
    const duplicateResource = resources.find((resource) => (
      normalizeResourceRecordKey(resource.name, resource.category) === normalizeResourceRecordKey(data.name, data.category)
    ));

    if (duplicateResource) {
      return {
        ok: false,
        reason: 'duplicate' as const,
        item: duplicateResource,
      };
    }

    const newResource: Resource = {
      ...data,
      id: `RES${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    setResources(prev => [newResource, ...prev]);
    try {
      await resourceRepository.createResource(newResource);
      return {
        ok: true,
        item: newResource,
      };
    } catch (error) {
      setResources(prev => prev.filter((resource) => resource.id !== newResource.id));
      console.error("Failed to persist resource", error);
      return {
        ok: false,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };

  const updateResource = async (resourceId: string, data: Partial<Omit<Resource, 'id' | 'lastUpdated'>>) => {
    const previousResource = resources.find((resource) => resource.id === resourceId);

    if (!previousResource) {
      return {
        ok: false,
        reason: 'not_found' as const,
      };
    }

    const candidateName = data.name ?? previousResource.name;
    const candidateCategory = data.category ?? previousResource.category;
    const duplicateResource = resources.find((resource) => (
      resource.id !== resourceId &&
      normalizeResourceRecordKey(resource.name, resource.category) === normalizeResourceRecordKey(candidateName, candidateCategory)
    ));

    if (duplicateResource) {
      return {
        ok: false,
        reason: 'duplicate' as const,
        item: previousResource,
        previousItem: previousResource,
      };
    }

    const nextUpdatedAt = new Date().toISOString();
    const nextResource: Resource = {
      ...previousResource,
      ...data,
      lastUpdated: nextUpdatedAt,
    };
    setResources(prev =>
      prev.map(r =>
        r.id === resourceId ? nextResource : r
      )
    );
    try {
      const persistedResource = await resourceRepository.updateResource(resourceId, {
        ...data,
        lastUpdated: nextUpdatedAt,
      });

      if (!persistedResource) {
        throw new Error('Resource record was not found in the data store.');
      }

      return {
        ok: true,
        item: nextResource,
        previousItem: previousResource,
      };
    } catch (error) {
      setResources(prev => prev.map((resource) => (
        resource.id === resourceId ? previousResource : resource
      )));
      console.error("Failed to persist resource update", error);
      return {
        ok: false,
        reason: 'persist_failed' as const,
        item: previousResource,
        previousItem: previousResource,
        error,
      };
    }
  };
  
  const deleteResource = async (resourceId: string) => {
    const previousResource = resources.find((resource) => resource.id === resourceId);

    if (!previousResource) {
      return {
        ok: false,
        reason: 'not_found' as const,
      };
    }

    setResources(prev => prev.filter(r => r.id !== resourceId));
    try {
      await resourceRepository.deleteResource(resourceId);
      return {
        ok: true,
        deletedItem: previousResource,
      };
    } catch (error) {
      setResources(prev => [previousResource, ...prev].sort((left, right) => (
        normalizeTimestamp(right.lastUpdated) - normalizeTimestamp(left.lastUpdated)
      )));
      console.error("Failed to persist resource deletion", error);
      return {
        ok: false,
        deletedItem: previousResource,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };

  const addMarketPriceEntry = async (data: NewMarketPriceData) => {
    const nextEntry: MarketPriceEntry = {
      ...data,
      id: createEntityId('PRICE'),
      updatedAt: new Date().toISOString(),
    };

    setMarketPrices(prev => [nextEntry, ...prev]);
    try {
      await marketPriceRepository.createMarketPriceEntry(nextEntry);
      return {
        ok: true,
        item: nextEntry,
      };
    } catch (error) {
      setMarketPrices(prev => prev.filter((entry) => entry.id !== nextEntry.id));
      console.error("Failed to persist market price entry", error);
      return {
        ok: false,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };

  const updateMarketPriceEntry = async (entryId: string, data: NewMarketPriceData) => {
    const previousEntry = marketPrices.find((entry) => entry.id === entryId);

    if (!previousEntry) {
      return {
        ok: false,
        reason: 'not_found' as const,
      };
    }

    const nextUpdatedAt = new Date().toISOString();
    const nextEntry: MarketPriceEntry = {
      ...previousEntry,
      ...data,
      updatedAt: nextUpdatedAt,
    };
    setMarketPrices(prev => prev.map((entry) => (
      entry.id === entryId
        ? nextEntry
        : entry
    )));
    try {
      const persistedEntry = await marketPriceRepository.updateMarketPriceEntry(entryId, {
        ...data,
        updatedAt: nextUpdatedAt,
      });

      if (!persistedEntry) {
        throw new Error('Market price entry was not found in the data store.');
      }

      return {
        ok: true,
        item: nextEntry,
        previousItem: previousEntry,
      };
    } catch (error) {
      setMarketPrices(prev => prev.map((entry) => (
        entry.id === entryId ? previousEntry : entry
      )));
      console.error("Failed to persist market price update", error);
      return {
        ok: false,
        reason: 'persist_failed' as const,
        item: previousEntry,
        previousItem: previousEntry,
        error,
      };
    }
  };

  const deleteMarketPriceEntry = async (entryId: string) => {
    const previousEntry = marketPrices.find((entry) => entry.id === entryId);

    if (!previousEntry) {
      return {
        ok: false,
        reason: 'not_found' as const,
      };
    }

    setMarketPrices(prev => prev.filter((entry) => entry.id !== entryId));
    try {
      await marketPriceRepository.deleteMarketPriceEntry(entryId);
      return {
        ok: true,
        deletedItem: previousEntry,
      };
    } catch (error) {
      setMarketPrices(prev => sortByDateDescending([previousEntry, ...prev], (entry) => entry.updatedAt));
      console.error("Failed to delete market price entry", error);
      return {
        ok: false,
        deletedItem: previousEntry,
        reason: 'persist_failed' as const,
        error,
      };
    }
  };

  const broadcastAlert = async (data: NewAlertBroadcastData) => {
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const targetFarmerIds = (
      data.recipientFarmerIds?.length
        ? data.recipientFarmerIds
        : farmers
            .filter((farmer) => farmer.status === 'active' || farmer.status === 'inactive')
            .map((farmer) => farmer.id)
    );
    const recipientFarmers = targetFarmerIds
      .map((farmerId) => farmers.find((farmer) => farmer.id === farmerId))
      .filter((farmer): farmer is Farmer & { phone: string } => Boolean(farmer?.phone));

    const sendResults = await Promise.allSettled(
      recipientFarmers.map((farmer) => smsProvider.sendMessage({
        to: farmer.phone,
        body: `${data.message} ${data.recommendation}`.trim(),
      }))
    );
    const sentCount = sendResults.filter((result) => result.status === 'fulfilled' && result.value.status !== 'failed').length;
    const failedCount = recipientFarmers.length - sentCount;
    const nextEntry: AlertHistoryEntry = {
      id: createEntityId('ALH'),
      title: data.title,
      timestamp,
      type: data.type,
      severity: data.severity,
      message: data.message,
      recommendation: data.recommendation,
      source: data.source,
      recipientFarmerIds: recipientFarmers.map((farmer) => farmer.id),
      sentCount,
      failedCount,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'SEND_ALERT_BROADCAST',
      details: `${data.title}: ipinadala sa ${sentCount}/${recipientFarmers.length} na magsasaka.`,
    };
    const logEntries: LogbookEntry[] = recipientFarmers.map((farmer) => ({
      id: createEntityId('LOG'),
      farmerId: farmer.id,
      timestamp,
      type: 'Insidente',
      title: `Nakatanggap ng alerto: ${data.title}`,
      description: `${data.message} ${data.recommendation}`.trim(),
    }));

    setAlertHistory(prev => [nextEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);
    if (logEntries.length > 0) {
      setLogbook(prev => [...logEntries, ...prev]);
    }

    void alertHistoryRepository.createAlertHistoryEntry(nextEntry).catch((error) => {
      console.error("Failed to persist alert history entry", error);
    });
    void auditRepository.createAuditLog(auditLog).catch((error) => {
      console.error("Failed to persist alert broadcast audit log", error);
    });
    void Promise.all(logEntries.map((entry) => logbookRepository.createEntry(entry))).catch((error) => {
      console.error("Failed to persist alert broadcast logbook entries", error);
    });

    return nextEntry;
  };

  const addAssistanceRecord = (data: NewAssistanceRecordData) => {
    const actorName = data.providedBy ?? currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const nextRecord: FarmerAssistanceRecord = {
      id: createEntityId('AST'),
      farmerId: data.farmerId,
      type: data.type,
      title: data.title,
      details: data.details,
      quantity: data.quantity,
      status: 'planned',
      providedBy: actorName,
      createdAt: timestamp,
      updatedAt: timestamp,
      nextAction: data.nextAction,
      resourceId: data.resourceId,
    };
    const farmer = farmers.find((entry) => entry.id === data.farmerId);
    const logbookEntry: LogbookEntry = {
      id: createEntityId('LOG'),
      farmerId: data.farmerId,
      timestamp,
      type: 'Tulong',
      title: `Bagong tulong: ${data.title}`,
      description: `${data.type} - ${data.details}`,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'CREATE_ASSISTANCE_RECORD',
      details: `${farmer?.name ?? data.farmerId}: ${data.title}`,
    };

    setAssistanceRecords(prev => [nextRecord, ...prev]);
    setLogbook(prev => [logbookEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('assistance'),
        type: 'create-assistance-activity',
        createdAt: timestamp,
        payload: {
          record: nextRecord,
          logbookEntry: sanitizeLogbookEntry(logbookEntry),
          auditLog,
        },
      });
      return nextRecord;
    }

    void Promise.all([
      assistanceRepository.createAssistanceRecord(nextRecord),
      logbookRepository.createEntry(logbookEntry),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('assistance'),
          type: 'create-assistance-activity',
          createdAt: timestamp,
          payload: {
            record: nextRecord,
            logbookEntry: sanitizeLogbookEntry(logbookEntry),
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist assistance activity", error);
    });

    return nextRecord;
  };

  const updateAssistanceRecordStatus = (recordId: string, status: AssistanceStatus) => {
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const currentRecord = assistanceRecords.find((record) => record.id === recordId);

    if (!currentRecord || currentRecord.status === status) {
      return;
    }

    const nextRecord: FarmerAssistanceRecord = {
      ...currentRecord,
      status,
      updatedAt: timestamp,
      fulfilledAt: status === 'completed' ? timestamp : currentRecord.fulfilledAt,
    };
    const farmer = farmers.find((entry) => entry.id === currentRecord.farmerId);
    const logbookEntry: LogbookEntry = {
      id: createEntityId('LOG'),
      farmerId: currentRecord.farmerId,
      timestamp,
      type: 'Tulong',
      title: `Na-update ang tulong: ${currentRecord.title}`,
      description: `Status: ${status}`,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'UPDATE_ASSISTANCE_STATUS',
      details: `${farmer?.name ?? currentRecord.farmerId}: ${currentRecord.title} -> ${status}`,
    };

    setAssistanceRecords(prev => prev.map((record) => record.id === recordId ? nextRecord : record));
    setLogbook(prev => [logbookEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('assistance-status'),
        type: 'update-assistance-status',
        createdAt: timestamp,
        payload: {
          recordId,
          updates: {
            status: nextRecord.status,
            updatedAt: nextRecord.updatedAt,
            fulfilledAt: nextRecord.fulfilledAt,
          },
          logbookEntry: sanitizeLogbookEntry(logbookEntry),
          auditLog,
        },
      });
      return;
    }

    void Promise.all([
      assistanceRepository.updateAssistanceRecord(recordId, {
        status: nextRecord.status,
        updatedAt: nextRecord.updatedAt,
        fulfilledAt: nextRecord.fulfilledAt,
      }),
      logbookRepository.createEntry(logbookEntry),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('assistance-status'),
          type: 'update-assistance-status',
          createdAt: timestamp,
          payload: {
            recordId,
            updates: {
              status: nextRecord.status,
              updatedAt: nextRecord.updatedAt,
              fulfilledAt: nextRecord.fulfilledAt,
            },
            logbookEntry: sanitizeLogbookEntry(logbookEntry),
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist assistance status", error);
    });
  };

  const scheduleFieldVisit = (data: NewFieldVisitTaskData) => {
    const actorName = data.assignedTo ?? currentUserProfile?.name ?? 'AEW Jose Rizal';
    const timestamp = new Date().toISOString();
    const nextTask: FieldVisitTask = {
      id: createEntityId('VISIT'),
      farmerId: data.farmerId,
      title: data.title,
      purpose: data.purpose,
      scheduledFor: data.scheduledFor,
      assignedTo: actorName,
      priority: data.priority,
      status: 'scheduled',
      createdAt: timestamp,
      updatedAt: timestamp,
      notes: data.notes,
      relatedSmsId: data.relatedSmsId,
      verificationStatus: 'unverified',
    };
    const farmer = farmers.find((entry) => entry.id === data.farmerId);
    const logbookEntry: LogbookEntry = {
      id: createEntityId('LOG'),
      farmerId: data.farmerId,
      timestamp,
      type: 'Tala sa Bukid',
      title: `Nakaiskedyul na pagbisita: ${data.title}`,
      description: `${data.purpose} (${new Date(data.scheduledFor).toLocaleString()})`,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'SCHEDULE_FIELD_VISIT',
      details: `${farmer?.name ?? data.farmerId}: ${data.title}`,
    };

    setFieldVisitTasks(prev => [nextTask, ...prev].sort((left, right) => normalizeTimestamp(left.scheduledFor) - normalizeTimestamp(right.scheduledFor)));
    setLogbook(prev => [logbookEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('visit'),
        type: 'schedule-field-visit',
        createdAt: timestamp,
        payload: {
          task: nextTask,
          logbookEntry: sanitizeLogbookEntry(logbookEntry),
          auditLog,
        },
      });
      return nextTask;
    }

    void Promise.all([
      fieldVisitRepository.createFieldVisitTask(nextTask),
      logbookRepository.createEntry(logbookEntry),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('visit'),
          type: 'schedule-field-visit',
          createdAt: timestamp,
          payload: {
            task: nextTask,
            logbookEntry: sanitizeLogbookEntry(logbookEntry),
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist field visit schedule", error);
    });

    return nextTask;
  };

  const updateFieldVisitTaskStatus = (
    taskId: string,
    status: FieldVisitStatus,
    options?: FieldVisitStatusUpdateOptions
  ) => {
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const currentTask = fieldVisitTasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.status === status) {
      return;
    }

    const shouldApplyManualVerification =
      (status === 'in_progress' || status === 'completed') &&
      options?.verificationStatus == null &&
      currentTask.verificationStatus !== 'gps_captured';
    const verificationStatus =
      options?.verificationStatus ??
      (shouldApplyManualVerification
        ? 'manual_only'
        : currentTask.verificationStatus ?? 'unverified');
    const verificationSource =
      options?.verificationSource ??
      (shouldApplyManualVerification ? 'manual_dashboard' : currentTask.verificationSource);
    const verificationCapturedAt =
      options?.verificationCapturedAt ??
      (shouldApplyManualVerification ? timestamp : currentTask.verificationCapturedAt);
    const verificationNote =
      options?.verificationNote ??
      (shouldApplyManualVerification
        ? 'Na-update mula sa dashboard nang walang GPS metadata.'
        : currentTask.verificationNote);
    const nextTask: FieldVisitTask = {
      ...currentTask,
      status,
      updatedAt: timestamp,
      notes: options?.notes ?? currentTask.notes,
      startedAt:
        status === 'in_progress'
          ? currentTask.startedAt ?? timestamp
          : currentTask.startedAt,
      completedAt:
        status === 'completed'
          ? timestamp
          : status === 'cancelled'
            ? undefined
            : currentTask.completedAt,
      verificationStatus,
      verificationSource,
      verificationCapturedAt,
      verificationLat:
        options?.verificationLat ?? (verificationStatus === 'gps_captured' ? currentTask.verificationLat : undefined),
      verificationLng:
        options?.verificationLng ?? (verificationStatus === 'gps_captured' ? currentTask.verificationLng : undefined),
      verificationAccuracyMeters:
        options?.verificationAccuracyMeters ??
        (verificationStatus === 'gps_captured' ? currentTask.verificationAccuracyMeters : undefined),
      verificationNote,
    };
    const farmer = farmers.find((entry) => entry.id === currentTask.farmerId);
    const logbookEntry: LogbookEntry = {
      id: createEntityId('LOG'),
      farmerId: currentTask.farmerId,
      timestamp,
      type: 'Tala sa Bukid',
      title: `Na-update ang field visit: ${currentTask.title}`,
      description: `Status: ${status}. ${getFieldVisitVerificationSummary(nextTask)}`,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'UPDATE_FIELD_VISIT_STATUS',
      details: `${farmer?.name ?? currentTask.farmerId}: ${currentTask.title} -> ${status} (${nextTask.verificationStatus ?? 'unverified'})`,
    };
    const taskUpdates: Partial<FieldVisitTask> = {
      status: nextTask.status,
      updatedAt: nextTask.updatedAt,
      notes: nextTask.notes,
      startedAt: nextTask.startedAt,
      completedAt: nextTask.completedAt,
      verificationStatus: nextTask.verificationStatus,
      verificationSource: nextTask.verificationSource,
      verificationCapturedAt: nextTask.verificationCapturedAt,
      verificationLat: nextTask.verificationLat,
      verificationLng: nextTask.verificationLng,
      verificationAccuracyMeters: nextTask.verificationAccuracyMeters,
      verificationNote: nextTask.verificationNote,
    };

    setFieldVisitTasks(prev => prev.map((task) => task.id === taskId ? nextTask : task));
    setLogbook(prev => [logbookEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('visit-status'),
        type: 'update-field-visit-status',
        createdAt: timestamp,
        payload: {
          taskId,
          updates: taskUpdates,
          logbookEntry: sanitizeLogbookEntry(logbookEntry),
          auditLog,
        },
      });
      return;
    }

    void Promise.all([
      fieldVisitRepository.updateFieldVisitTask(taskId, taskUpdates),
      logbookRepository.createEntry(logbookEntry),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('visit-status'),
          type: 'update-field-visit-status',
          createdAt: timestamp,
          payload: {
            taskId,
            updates: taskUpdates,
            logbookEntry: sanitizeLogbookEntry(logbookEntry),
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist field visit status", error);
    });
  };

  const addInboundSms = (data: NewInboundSmsData) => {
    const screening = screenInboundSms({
      phone: data.phone,
      message: data.message,
    });

    if (screening.ignored) {
      return null;
    }

    const confirmationReply = parseFarmerResolutionConfirmationReply(data.message);
    const awaitingConfirmationMessages = confirmationReply
      ? smsMessages
          .filter((message) => (
            normalizeFarmerPhone(message.phone) === normalizeFarmerPhone(data.phone) &&
            message.resolutionConfirmationStatus === 'awaiting_farmer' &&
            !message.closedAt
          ))
          .sort((left, right) => normalizeTimestamp(right.timestamp) - normalizeTimestamp(left.timestamp))
      : [];
    const awaitingConfirmationMessage = confirmationReply
      ? (
          confirmationReply.caseId
            ? awaitingConfirmationMessages.find((message) => (message.caseId ?? '').toUpperCase() === confirmationReply.caseId)
            : awaitingConfirmationMessages[0]
        ) ?? awaitingConfirmationMessages[0]
      : null;

    if (confirmationReply && awaitingConfirmationMessage) {
      const confirmationResult = applyFarmerResolutionConfirmation({
        message: awaitingConfirmationMessage,
        confirmationStatus: confirmationReply.status,
        replyBody: data.message,
      });
      const reminderPromise = confirmationReply.status === 'reopened'
        ? processOfficialReminderMessage({
            message: confirmationResult.updatedMessage,
            users,
            settings: systemSettings,
            provider: smsProvider,
            providerName: 'demo',
            actorName: 'system',
            force: true,
          })
        : Promise.resolve(null);

      void reminderPromise.then((reminderResult) => {
        const finalMessage = reminderResult?.updatedMessage ?? confirmationResult.updatedMessage;

        setSmsMessages((prev) => sortVisibleSmsMessages(prev.map((message) => (
          message.id === awaitingConfirmationMessage.id ? finalMessage : message
        ))));
        setAuditLogs((prev) => [
          ...(reminderResult ? [reminderResult.auditLog] : []),
          confirmationResult.auditLog,
          ...prev,
        ]);
        setLogbook((prev) => [
          ...(reminderResult ? [reminderResult.logbookEntry] : []),
          confirmationResult.logbookEntry,
          ...prev,
        ]);
        if (reminderResult) {
          setOutboundMessages((prev) => [reminderResult.outboundRecord, ...prev]);
        }

        void Promise.all([
          smsRepository.updateMessage(awaitingConfirmationMessage.id, {
            caseStatus: finalMessage.caseStatus,
            closedAt: finalMessage.closedAt,
            caseOutcomeStatus: finalMessage.caseOutcomeStatus,
            caseOutcomeSummary: finalMessage.caseOutcomeSummary,
            caseOutcomeUpdatedAt: finalMessage.caseOutcomeUpdatedAt,
            caseOutcomeUpdatedBy: finalMessage.caseOutcomeUpdatedBy,
            resolutionConfirmationStatus: finalMessage.resolutionConfirmationStatus,
            resolutionConfirmedAt: finalMessage.resolutionConfirmedAt,
            resolutionConfirmedBy: finalMessage.resolutionConfirmedBy,
            resolutionConfirmationNote: finalMessage.resolutionConfirmationNote,
            followUpDueAt: finalMessage.followUpDueAt,
            assignedTo: finalMessage.assignedTo,
            assignedToUserId: finalMessage.assignedToUserId,
            assignedAt: finalMessage.assignedAt,
            officialReminderRecipientName: finalMessage.officialReminderRecipientName,
            officialReminderRecipientPhone: finalMessage.officialReminderRecipientPhone,
            officialReminderDueAt: finalMessage.officialReminderDueAt,
            officialReminderLastSentAt: finalMessage.officialReminderLastSentAt,
            officialReminderCount: finalMessage.officialReminderCount,
          }),
          auditRepository.createAuditLog(confirmationResult.auditLog),
          logbookRepository.createEntry(confirmationResult.logbookEntry),
          ...(reminderResult
            ? [
                auditRepository.createAuditLog(reminderResult.auditLog),
                logbookRepository.createEntry(reminderResult.logbookEntry),
                outboundMessageRepository.createOutboundMessage(reminderResult.outboundRecord),
              ]
            : []),
        ]).catch((error) => {
          console.error('Failed to persist inbound farmer confirmation', error);
        });
      }).catch((error) => {
        console.error('Failed to apply inbound farmer confirmation', error);
      });

      return confirmationResult.updatedMessage;
    }

    const workflow = processInboundSms({
      phone: data.phone,
      message: data.message,
      farmers,
      existingMessages: smsMessages,
      analysis: data.analysis,
      settings: systemSettings,
      sourceProvider: data.sourceProvider ?? 'demo',
    });
    const newMessage = applyPriceWatchAdvice(workflow.message, marketPrices);

    setSmsMessages(prev => [newMessage, ...prev]);
    setAuditLogs(prev => [workflow.auditLog, ...prev]);
    const logbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}`,
      farmerId: newMessage.farmerId,
      timestamp: newMessage.timestamp,
      type: 'SMS',
      title: 'Bagong ulat sa SMS',
      description: `${newMessage.farmerName}: ${newMessage.message}`,
    };
    setLogbook(prev => [logbookEntry, ...prev]);
    void smsRepository.createInboundMessage(newMessage).catch((error) => {
      console.error("Failed to persist inbound SMS", error);
    });
    void auditRepository.createAuditLog(workflow.auditLog).catch((error) => {
      console.error("Failed to persist inbound SMS audit log", error);
    });
    void logbookRepository.createEntry(logbookEntry).catch((error) => {
      console.error("Failed to persist inbound SMS logbook entry", error);
    });

    if (workflow.newFarmer) {
      const preparedWorkflowFarmer = prepareFarmerRecord({
        farmer: workflow.newFarmer as Farmer,
        existingFarmers: farmers,
        actorName: 'system',
        source: 'sms_registration',
        timestamp: workflow.message.timestamp,
        reason: 'Created from inbound SMS registration flow.',
      });
      setFarmers(prev => [preparedWorkflowFarmer, ...prev]);
      void farmerRepository.createFarmer(preparedWorkflowFarmer).catch((error) => {
        console.error("Failed to persist inbound registration farmer", error);
      });
    }

    if (workflow.farmerUpdates.length > 0) {
      setFarmers(prev => prev.map(item => {
        const update = workflow.farmerUpdates.find(farmerUpdate => farmerUpdate.farmerId === item.id);
        return update ? { ...item, ...update.updates } : item;
      }));
      for (const update of workflow.farmerUpdates) {
        void farmerRepository.updateFarmer(update.farmerId, update.updates).catch((error) => {
          console.error("Failed to persist farmer update", error);
        });
      }
    }

    return newMessage;
  };

  const addSmsPreview = (message: SmsMessage) => {
    setSmsMessages((previous) => sortVisibleSmsMessages([message, ...previous]));
    return message;
  };

  const updateSmsMessage = (
    messageId: string,
    updates: Partial<Pick<SmsMessage, 'status' | 'aiAdvice' | 'parsedIntent' | 'urgency' | 'safetyFlag' | 'tone'>>
  ) => {
    const current = smsMessages.find((message) => message.id === messageId);
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const workflow = applySmsStatusUpdate({
      currentMessage: current ?? null,
      updates,
      actorName,
    });

    if (!workflow.nextMessage) {
      return;
    }

    const nextMessage = workflow.nextMessage;
    const isFarmerFacingReply = nextMessage.status === 'approved' || nextMessage.status === 'replied';

    setSmsMessages((prev) => prev.map((message) => (
      message.id === messageId ? nextMessage : message
    )));

    const responseLogbookEntry: LogbookEntry | null = isFarmerFacingReply
      ? {
          id: `LOG${Date.now()}-${nextMessage.id}`,
          farmerId: nextMessage.farmerId,
          timestamp: nextMessage.respondedAt ?? new Date().toISOString(),
          type: 'Payo',
          title: 'Naglabas ng tugon',
          description: `${actorName}: ${nextMessage.aiAdvice}`,
        }
      : null;
    const trainingExample = current && nextMessage.status !== 'pending_approval'
      ? createSmsTrainingExample({
          previousMessage: current,
          nextMessage,
          actorName,
        })
      : null;
    const messageUpdates = {
      status: nextMessage.status,
      aiAdvice: nextMessage.aiAdvice,
      respondedAt: nextMessage.respondedAt,
      assignedTo: nextMessage.assignedTo,
      assignedAt: nextMessage.assignedAt,
      caseStatus: nextMessage.caseStatus,
      followUpDueAt: nextMessage.followUpDueAt,
      followUpSentAt: nextMessage.followUpSentAt,
      closedAt: nextMessage.closedAt,
      resolutionNote: nextMessage.resolutionNote,
      parsedIntent: nextMessage.parsedIntent,
      urgency: nextMessage.urgency,
      safetyFlag: nextMessage.safetyFlag,
      tone: nextMessage.tone,
    };

    if (workflow.auditLog) {
      setAuditLogs((logs) => [workflow.auditLog as AuditLog, ...logs]);
    }

    if (responseLogbookEntry) {
      setLogbook((entries) => [responseLogbookEntry, ...entries]);
    }

    if (trainingExample) {
      setSmsTrainingExamples((examples) => [trainingExample, ...examples]);
    }

    const outboundReply =
      isFarmerFacingReply && nextMessage.aiAdvice.trim().length > 0
        ? {
            sourceMessage: nextMessage,
            body: nextMessage.aiAdvice,
              providerName: usingDemoSandbox ? 'mock-sms-provider' : 'live-sms-provider',
            audience: 'farmer' as const,
            purpose: 'manual_reply' as const,
          }
        : undefined;

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('sms-update'),
        type: 'update-sms-message',
        createdAt: new Date().toISOString(),
        payload: {
          messageId,
          updates: messageUpdates,
          auditLog: workflow.auditLog ?? undefined,
          responseLogbookEntry: responseLogbookEntry ? sanitizeLogbookEntry(responseLogbookEntry) : undefined,
          trainingExample: trainingExample ?? undefined,
          outboundReply,
        },
      });
      return;
    }

    const persistMessageUpdate = async () => {
      await smsRepository.updateMessage(messageId, messageUpdates);

      if (workflow.auditLog) {
        await auditRepository.createAuditLog(workflow.auditLog as AuditLog);
      }

      if (responseLogbookEntry) {
        await logbookRepository.createEntry(responseLogbookEntry);
      }

      if (trainingExample) {
        await smsTrainingRepository.createTrainingExample(trainingExample);
      }

      if (outboundReply) {
        const record = await sendOutboundMessage({
          sourceMessage: outboundReply.sourceMessage,
          body: outboundReply.body,
          provider: smsProvider,
          providerName: outboundReply.providerName,
          audience: outboundReply.audience,
          purpose: outboundReply.purpose,
        });
        setOutboundMessages((records) => [record, ...records]);
        await outboundMessageRepository.createOutboundMessage(record);
      }
    };

    void persistMessageUpdate().catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('sms-update'),
          type: 'update-sms-message',
          createdAt: new Date().toISOString(),
          payload: {
            messageId,
            updates: messageUpdates,
            auditLog: workflow.auditLog ?? undefined,
            responseLogbookEntry: responseLogbookEntry ? sanitizeLogbookEntry(responseLogbookEntry) : undefined,
            trainingExample: trainingExample ?? undefined,
            outboundReply,
          },
        });
        return;
      }

      console.error("Failed to persist SMS status update", error);
    });
  };

  const assignSmsMessage = (messageId: string, assigneeName?: string) => {
    const assignedAt = new Date().toISOString();
    const assigneeUser = users.find((user) => (
      getUserAssignmentId(user) === assigneeName?.trim().toLowerCase() ||
      user.name.trim().toLowerCase() === assigneeName?.trim().toLowerCase()
    )) ?? currentUserProfile ?? null;
    const actorName = assigneeName ?? assigneeUser?.name ?? currentUserProfile?.name ?? 'Brgy. Admin';
    const actorUserId = getUserAssignmentId(assigneeUser);

    setSmsMessages(prev => prev.map((message) => (
      message.id === messageId
        ? {
            ...message,
            assignedTo: actorName,
            assignedToUserId: actorUserId || message.assignedToUserId,
            assignedAt,
            caseStatus: message.caseStatus === 'closed' ? 'closed' : 'assigned',
          }
        : message
    )));

    const auditLog: AuditLog = {
      id: `AUD${Date.now()}`,
      timestamp: assignedAt,
      user: actorName,
      action: 'ASSIGN_SMS_CASE',
      details: `${messageId}: itinalaga kay ${actorName}`,
    };
    setAuditLogs(prev => [auditLog, ...prev]);

    const assignmentUpdates = {
      assignedTo: actorName,
      assignedToUserId: actorUserId || undefined,
      assignedAt,
      caseStatus: 'assigned' as const,
    };

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('sms-assign'),
        type: 'assign-sms-message',
        createdAt: assignedAt,
        payload: {
          messageId,
          updates: assignmentUpdates,
          auditLog,
        },
      });
      return;
    }

    void Promise.all([
      smsRepository.updateMessage(messageId, assignmentUpdates),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('sms-assign'),
          type: 'assign-sms-message',
          createdAt: assignedAt,
          payload: {
            messageId,
            updates: assignmentUpdates,
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to assign SMS message", error);
    });
  };

  const updateSmsCaseOutcome = (
    messageId: string,
    outcomeStatus: SmsCaseOutcomeStatus,
    summary: string
  ) => {
    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const trimmedSummary = summary.trim();
    const outcomeMeta = getSmsCaseOutcomeMeta(outcomeStatus);
    const currentMessage = smsMessages.find((message) => message.id === messageId);

    if (!currentMessage) {
      return false;
    }

    if (outcomeStatus === 'resolved') {
      const resolutionReadiness = getSmsCaseResolutionReadiness({
        message: currentMessage,
        assistanceRecords,
        fieldVisitTasks,
      });

      if (!resolutionReadiness.ready) {
        return false;
      }
    }

    const updatedMessage: SmsMessage = {
      ...currentMessage,
      caseStatus: getCaseStatusForOutcome(outcomeStatus),
      caseOutcomeStatus: outcomeStatus,
      caseOutcomeSummary: trimmedSummary,
      caseOutcomeUpdatedAt: timestamp,
      caseOutcomeUpdatedBy: actorName,
      closedAt:
        outcomeStatus === 'resolved' ? undefined : currentMessage.closedAt,
      resolutionNote:
        outcomeStatus === 'resolved'
          ? (trimmedSummary || currentMessage.resolutionNote)
          : currentMessage.resolutionNote,
      resolutionConfirmationStatus:
        outcomeStatus === 'resolved'
          ? 'awaiting_farmer'
          : currentMessage.resolutionConfirmationStatus,
      resolutionConfirmationRequestedAt:
        outcomeStatus === 'resolved' ? timestamp : currentMessage.resolutionConfirmationRequestedAt,
      resolutionConfirmedAt:
        outcomeStatus === 'resolved' ? undefined : currentMessage.resolutionConfirmedAt,
      resolutionConfirmedBy:
        outcomeStatus === 'resolved' ? undefined : currentMessage.resolutionConfirmedBy,
      resolutionConfirmationNote:
        outcomeStatus === 'resolved'
          ? 'Hinihintay pa ang kumpirmasyon ng magsasaka bago tuluyang isara ang case.'
          : currentMessage.resolutionConfirmationNote,
    };

    setSmsMessages((prev) => prev.map((message) => (
      message.id === messageId ? updatedMessage : message
    )));

    const auditLog: AuditLog = {
      id: `AUD${Date.now()}`,
      timestamp,
      user: actorName,
      action: 'UPDATE_SMS_CASE_OUTCOME',
      details: `${messageId}: ${outcomeMeta?.label ?? outcomeStatus}${trimmedSummary ? ` - ${trimmedSummary}` : ''}`,
    };

    const outcomeLogbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}-${messageId}`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: 'Tulong',
      title: `Case outcome: ${outcomeMeta?.label ?? outcomeStatus}`,
      description: trimmedSummary || outcomeMeta?.helper || 'Na-update ang case outcome.',
    };

    setAuditLogs((prev) => [auditLog, ...prev]);
    setLogbook((prev) => [outcomeLogbookEntry, ...prev]);

    const outcomeUpdates = {
      caseStatus: updatedMessage.caseStatus,
      caseOutcomeStatus: updatedMessage.caseOutcomeStatus,
      caseOutcomeSummary: updatedMessage.caseOutcomeSummary,
      caseOutcomeUpdatedAt: updatedMessage.caseOutcomeUpdatedAt,
      caseOutcomeUpdatedBy: updatedMessage.caseOutcomeUpdatedBy,
      closedAt: updatedMessage.closedAt,
      resolutionNote: updatedMessage.resolutionNote,
      resolutionConfirmationStatus: updatedMessage.resolutionConfirmationStatus,
      resolutionConfirmationRequestedAt: updatedMessage.resolutionConfirmationRequestedAt,
      resolutionConfirmedAt: updatedMessage.resolutionConfirmedAt,
      resolutionConfirmedBy: updatedMessage.resolutionConfirmedBy,
      resolutionConfirmationNote: updatedMessage.resolutionConfirmationNote,
    };

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('sms-outcome'),
        type: 'update-sms-case-outcome',
        createdAt: timestamp,
        payload: {
          messageId,
          updates: outcomeUpdates,
          auditLog,
          logbookEntry: sanitizeLogbookEntry(outcomeLogbookEntry),
        },
      });
      return true;
    }

    if (usingLiveData && outcomeStatus === 'resolved') {
      void (async () => {
        try {
          const idToken = await getClientAuth().currentUser?.getIdToken();

          if (!idToken) {
            throw new Error('Walang authenticated live session para makapagpadala ng farmer confirmation.');
          }

          const response = await fetch('/api/sms-cases/request-resolution-confirmation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              messageId,
              note: updatedMessage.resolutionNote,
            }),
          });
          const payload = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(payload.error ?? 'Hindi naipadala ang resolution confirmation SMS.');
          }

          const serverMessage = payload.message as SmsMessage | undefined;
          const outboundRecord = payload.outboundRecord as OutboundMessage | undefined;

          if (serverMessage) {
            setSmsMessages((prev) =>
              prev.map((message) => (message.id === messageId ? serverMessage : message))
            );
          }

          if (outboundRecord) {
            setOutboundMessages((prev) => [
              outboundRecord,
              ...prev.filter((record) => record.id !== outboundRecord.id),
            ]);
          }
        } catch (error) {
          setSmsMessages((prev) =>
            prev.map((message) => (message.id === messageId ? currentMessage : message))
          );
          setAuditLogs((prev) => prev.filter((entry) => entry.id !== auditLog.id));
          setLogbook((prev) => prev.filter((entry) => entry.id !== outcomeLogbookEntry.id));
          console.error('Failed to request farmer confirmation for resolved case', error);
        }
      })();
      return true;
    }

    void Promise.all([
      smsRepository.updateMessage(messageId, outcomeUpdates),
      auditRepository.createAuditLog(auditLog),
      logbookRepository.createEntry(outcomeLogbookEntry),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('sms-outcome'),
          type: 'update-sms-case-outcome',
          createdAt: timestamp,
          payload: {
            messageId,
            updates: outcomeUpdates,
            auditLog,
            logbookEntry: sanitizeLogbookEntry(outcomeLogbookEntry),
          },
        });
        return;
      }
      console.error("Failed to persist SMS case outcome update", error);
    });

    return true;
  };

  const closeSmsCase = (messageId: string, resolutionNote?: string) => {
    return updateSmsCaseOutcome(messageId, 'resolved', resolutionNote?.trim() || 'Minarkahang handa nang isara ng barangay team. Hihintayin pa ang kumpirmasyon ng magsasaka.');
  };

  const confirmSmsCaseResolution = (
    messageId: string,
    confirmationStatus: SmsResolutionConfirmationStatus,
    note?: string
  ) => {
    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const currentMessage = smsMessages.find((message) => message.id === messageId);

    if (!currentMessage) {
      return;
    }

    const trimmedNote = note?.trim();
    const isConfirmed = confirmationStatus === 'confirmed_by_farmer';
    const updatedMessage: SmsMessage = {
      ...currentMessage,
      caseStatus: isConfirmed ? 'closed' : 'monitoring',
      closedAt: isConfirmed ? timestamp : undefined,
      caseOutcomeStatus: isConfirmed ? 'resolved' : 'needs_follow_up',
      caseOutcomeSummary:
        trimmedNote ||
        (isConfirmed
          ? 'Kinumpirma ng magsasaka na maayos na ang concern.'
          : 'Hindi pa kumpirmadong okay ang concern; ibinalik sa follow-up queue.'),
      caseOutcomeUpdatedAt: timestamp,
      caseOutcomeUpdatedBy: actorName,
      resolutionConfirmationStatus: confirmationStatus,
      resolutionConfirmedAt: isConfirmed ? timestamp : undefined,
      resolutionConfirmedBy: actorName,
      resolutionConfirmationNote:
        trimmedNote ||
        (isConfirmed
          ? 'Kinumpirma ng magsasaka ang resolution.'
          : 'Ibinukas muli matapos sabihing kailangan pa ng dagdag na tulong.'),
      followUpDueAt: !isConfirmed ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : currentMessage.followUpDueAt,
    };

    setSmsMessages((prev) =>
      prev.map((message) => (message.id === messageId ? updatedMessage : message))
    );

    const auditLog: AuditLog = {
      id: `AUD${Date.now()}`,
      timestamp,
      user: actorName,
      action: isConfirmed ? 'CONFIRM_SMS_CASE_RESOLUTION' : 'REOPEN_SMS_CASE',
      details: `${messageId}: ${updatedMessage.resolutionConfirmationNote}`,
    };
    const logbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}-${messageId}`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: 'Tulong',
      title: isConfirmed ? 'Kinumpirma ang resolution' : 'Ibinalik sa follow-up',
      description: updatedMessage.resolutionConfirmationNote ?? updatedMessage.caseOutcomeSummary ?? '',
    };

    setAuditLogs((prev) => [auditLog, ...prev]);
    setLogbook((prev) => [logbookEntry, ...prev]);

    const updates = {
      caseStatus: updatedMessage.caseStatus,
      closedAt: updatedMessage.closedAt,
      caseOutcomeStatus: updatedMessage.caseOutcomeStatus,
      caseOutcomeSummary: updatedMessage.caseOutcomeSummary,
      caseOutcomeUpdatedAt: updatedMessage.caseOutcomeUpdatedAt,
      caseOutcomeUpdatedBy: updatedMessage.caseOutcomeUpdatedBy,
      resolutionConfirmationStatus: updatedMessage.resolutionConfirmationStatus,
      resolutionConfirmedAt: updatedMessage.resolutionConfirmedAt,
      resolutionConfirmedBy: updatedMessage.resolutionConfirmedBy,
      resolutionConfirmationNote: updatedMessage.resolutionConfirmationNote,
      followUpDueAt: updatedMessage.followUpDueAt,
    };

    void Promise.all([
      smsRepository.updateMessage(messageId, updates),
      auditRepository.createAuditLog(auditLog),
      logbookRepository.createEntry(logbookEntry),
    ]).catch((error) => {
      console.error("Failed to confirm SMS case resolution state", error);
    });
  };

  const confirmSmsThread = async (messageId: string) => {
    const currentMessage = smsMessages.find((message) => message.id === messageId);

    if (!currentMessage) {
      return false;
    }

    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const updates = {
      threadReviewStatus: 'confirmed' as const,
      threadReviewedAt: timestamp,
      threadReviewedBy: actorName,
      threadReviewNote: 'Manu-manong kinumpirma na tama ang thread linkage.',
      threadConfidence: 1,
      threadReason: 'Manu-manong kinumpirma ng staff ang kasalukuyang thread.',
      possibleDuplicateOfCaseId: undefined,
      possibleDuplicateReason: undefined,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'CONFIRM_SMS_THREAD',
      details: `${messageId}: kinumpirma bilang tamang hiwalay na thread.`,
    };

    setSmsMessages((prev) =>
      prev.map((message) => (message.id === messageId ? { ...message, ...updates } : message))
    );
    setAuditLogs((prev) => [auditLog, ...prev]);

    try {
      await Promise.all([
        smsRepository.updateMessage(messageId, updates),
        auditRepository.createAuditLog(auditLog),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to confirm SMS thread review', error);
      return false;
    }
  };

  const splitSmsThread = async (messageId: string) => {
    const currentMessage = smsMessages.find((message) => message.id === messageId);

    if (!currentMessage) {
      return false;
    }

    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const newCaseId = buildCaseId({
      farmerId: currentMessage.farmerId,
      normalizedPhone: '',
      fallbackId: `${currentMessage.id}-split-${Date.now()}`,
    });
    const updates = {
      caseId: newCaseId,
      caseStatus: deriveInitialCaseStatus({
        clarificationNeeded: currentMessage.clarificationNeeded,
        registrationRequired: currentMessage.registrationRequired,
      }),
      assignedTo: undefined,
      assignedAt: undefined,
      threadReviewStatus: 'split' as const,
      threadReviewedAt: timestamp,
      threadReviewedBy: actorName,
      threadReviewNote: `Inihiwalay sa bagong case ${newCaseId} matapos ang manual review.`,
      threadConfidence: 1,
      threadReason: `Manu-manong hinati sa bagong case ${newCaseId}.`,
      possibleDuplicateOfCaseId: undefined,
      possibleDuplicateReason: undefined,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'SPLIT_SMS_THREAD',
      details: `${messageId}: inihiwalay sa ${newCaseId}.`,
    };

    setSmsMessages((prev) =>
      prev.map((message) => (message.id === messageId ? { ...message, ...updates } : message))
    );
    setAuditLogs((prev) => [auditLog, ...prev]);

    try {
      await Promise.all([
        smsRepository.updateMessage(messageId, updates),
        auditRepository.createAuditLog(auditLog),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to split SMS thread', error);
      return false;
    }
  };

  const mergeSmsThreads = async (sourceMessageId: string, targetMessageId: string) => {
    const sourceMessage = smsMessages.find((message) => message.id === sourceMessageId);
    const targetMessage = smsMessages.find((message) => message.id === targetMessageId);

    if (!sourceMessage || !targetMessage || sourceMessage.id === targetMessage.id) {
      return false;
    }

    const sourceCaseId = sourceMessage.caseId ?? sourceMessage.id;
    const targetCaseId =
      targetMessage.caseId ??
      buildCaseId({
        farmerId: targetMessage.farmerId,
        normalizedPhone: '',
        fallbackId: targetMessage.id,
      });
    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const messagesToMove = smsMessages.filter(
      (message) =>
        message.id === sourceMessage.id ||
        (message.caseId === sourceCaseId &&
          (message.phone === sourceMessage.phone || message.farmerId === sourceMessage.farmerId))
    );

    if (messagesToMove.length === 0) {
      return false;
    }

    const movedIds = new Set(messagesToMove.map((message) => message.id));
    const updates = {
      caseId: targetCaseId,
      caseStatus: targetMessage.caseStatus ?? 'open',
      assignedTo: targetMessage.assignedTo ?? sourceMessage.assignedTo,
      assignedAt: targetMessage.assignedAt ?? sourceMessage.assignedAt,
      threadReviewStatus: 'merged' as const,
      threadReviewedAt: timestamp,
      threadReviewedBy: actorName,
      threadReviewNote: `Manu-manong in-merge sa ${targetCaseId} sa ilalim ng review.`,
      threadConfidence: 1,
      threadReason: `Manu-manong in-merge sa ${targetCaseId}.`,
      possibleDuplicateOfCaseId: undefined,
      possibleDuplicateReason: undefined,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'MERGE_SMS_THREADS',
      details: `${sourceCaseId} -> ${targetCaseId} (${messagesToMove.length} message${messagesToMove.length > 1 ? 's' : ''})`,
    };

    setSmsMessages((prev) =>
      prev.map((message) => (movedIds.has(message.id) ? { ...message, ...updates } : message))
    );
    setAuditLogs((prev) => [auditLog, ...prev]);

    try {
      await Promise.all([
        ...messagesToMove.map((message) => smsRepository.updateMessage(message.id, updates)),
        auditRepository.createAuditLog(auditLog),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to merge SMS threads', error);
      return false;
    }
  };

  const runDataRetentionSweep = useCallback(async () => {
    const nextPolicy = systemSettings.retentionPolicy;
    const result = applyDataRetentionSweep({
      auditLogs,
      farmers,
      policy: nextPolicy,
    });

    if (
      result.redactedAuditLogIds.length === 0 &&
      result.redactedFarmerIds.length === 0
    ) {
      return {
        redactedAuditLogs: 0,
        redactedArchivedFarmers: 0,
      };
    }

    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'system';
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'RUN_DATA_RETENTION_SWEEP',
      details: `Audit logs redacted: ${result.redactedAuditLogIds.length}; archived farmers redacted: ${result.redactedFarmerIds.length}.`,
    };

    setAuditLogs([auditLog, ...result.auditLogs]);
    setFarmers(result.farmers);

    try {
      await Promise.all([
        ...result.redactedAuditLogIds.map((id) => {
          const updated = result.auditLogs.find((entry) => entry.id === id);
          return updated ? auditRepository.updateAuditLog(id, updated) : Promise.resolve(null);
        }),
        ...result.redactedFarmerIds.map((id) => {
          const updated = result.farmers.find((entry) => entry.id === id);
          return updated ? farmerRepository.updateFarmer(id, updated) : Promise.resolve(null);
        }),
        auditRepository.createAuditLog(auditLog),
      ]);
    } catch (error) {
      console.error('Failed to persist data retention sweep', error);
    }

    return {
      redactedAuditLogs: result.redactedAuditLogIds.length,
      redactedArchivedFarmers: result.redactedFarmerIds.length,
    };
  }, [auditLogs, currentUserProfile?.name, farmers, systemSettings.retentionPolicy]);

  const retryOutboundMessage = async (outboundId: string) => {
    const currentRecord = outboundMessages.find((record) => record.id === outboundId);

    if (!currentRecord) {
      return null;
    }

    const sourceMessage = smsMessages.find((message) => message.id === currentRecord.smsMessageId);

    if (!sourceMessage) {
      return null;
    }

    const nextTimestamp = new Date().toISOString();
    const retriedRecord: OutboundMessage = {
      ...currentRecord,
      status: 'retried',
      lastStatusAt: nextTimestamp,
    };
    const resendRecord = await sendOutboundMessage({
      sourceMessage,
      body: currentRecord.body,
      provider: smsProvider,
      providerName: usingDemoSandbox ? 'mock-sms-provider' : 'live-sms-provider',
      audience: currentRecord.audience,
      purpose: currentRecord.purpose,
    });
    const retryRecord: OutboundMessage = {
      ...resendRecord,
      retryOfOutboundId: currentRecord.id,
      attempts: (currentRecord.attempts ?? 1) + 1,
    };
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const retryAuditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: nextTimestamp,
      user: actorName,
      action: 'RETRY_OUTBOUND_MESSAGE',
      details: `Ni-retry ang outbound SMS para kay ${sourceMessage.farmerName} (${currentRecord.recipientPhone}).`,
      category: 'operations',
      severity: 'warning',
      beforeSnapshot: {
        outboundId: currentRecord.id,
        status: currentRecord.status,
        providerMessageId: currentRecord.providerMessageId ?? null,
        attempts: currentRecord.attempts ?? 1,
      },
      afterSnapshot: {
        outboundId: retryRecord.id,
        retryOfOutboundId: currentRecord.id,
        status: retryRecord.status,
        providerMessageId: retryRecord.providerMessageId ?? null,
        attempts: retryRecord.attempts ?? 1,
      },
    };

    setOutboundMessages(prev => [
      retryRecord,
      ...prev.map((record) => (record.id === outboundId ? retriedRecord : record)),
    ]);
    setAuditLogs(prev => [retryAuditLog, ...prev]);

    await Promise.all([
      outboundMessageRepository.updateOutboundMessage(outboundId, {
        status: retriedRecord.status,
        lastStatusAt: retriedRecord.lastStatusAt,
      }),
      outboundMessageRepository.createOutboundMessage(retryRecord),
      auditRepository.createAuditLog(retryAuditLog),
    ]);

    return retryRecord;
  };

  const addLogbookEntry = (entry: Omit<LogbookEntry, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const nextEntry: LogbookEntry = {
      ...entry,
      id: `LOG${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: entry.timestamp ?? new Date().toISOString(),
    };

    setLogbook(prev => [nextEntry, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('logbook'),
        type: 'create-logbook-entry',
        createdAt: nextEntry.timestamp,
        payload: {
          entry: sanitizeLogbookEntry(nextEntry),
        },
      });
      return;
    }

    void logbookRepository.createEntry(nextEntry).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('logbook'),
          type: 'create-logbook-entry',
          createdAt: nextEntry.timestamp,
          payload: {
            entry: sanitizeLogbookEntry(nextEntry),
          },
        });
        return;
      }
      console.error("Failed to persist logbook entry", error);
    });
  };

  const resetDemoData = () => {
    setFarmers(initialFarmers);
    setSmsMessages(sortVisibleSmsMessages(initialSmsMessages));
    setResources(initialResources);
    setMarketPrices(initialMarketPrices);
    setKnowledgeArticles(initialKnowledgeArticles);
    setLogbook(initialLogbookEntries);
    setAuditLogs(initialAuditLogs);
    setAlertHistory(initialAlertHistory);
    setAssistanceRecords(initialAssistanceRecords);
    setFieldVisitTasks(initialFieldVisitTasks);
      setSmsTrainingExamples(initialSmsTrainingExamples);
      setSystemSettings(defaultSystemSettings);
    setUsers(initialUsers);
    setVouchers(initialVouchers);
    setOutboundMessages(initialOutboundMessages);
    clearDemoStoreData();
  };

  React.useEffect(() => {
    if (
      !hydrated ||
      retentionSweepStarted.current ||
      !systemSettings.retentionPolicy.autoRedactionEnabled
    ) {
      return;
    }

    retentionSweepStarted.current = true;
    void runDataRetentionSweep();
  }, [hydrated, runDataRetentionSweep, systemSettings.retentionPolicy.autoRedactionEnabled]);


  const value = {
    farmers,
    setFarmers,
    updateFarmerRecord,
    updateFarmerStatus,
    updateManyFarmerStatuses,
    mergeFarmerRecords,
    deleteFarmerRecord,
    smsMessages,
    outboundMessages,
    addInboundSms,
    addSmsPreview,
    webhookBridgeStatus,
    updateSmsMessage,
    assignSmsMessage,
    updateSmsCaseOutcome,
    closeSmsCase,
    confirmSmsCaseResolution,
    confirmSmsThread,
    splitSmsThread,
    mergeSmsThreads,
    resources,
    addResource,
    updateResource,
    deleteResource,
    marketPrices,
    addMarketPriceEntry,
    updateMarketPriceEntry,
    deleteMarketPriceEntry,
    knowledgeArticles,
    setKnowledgeArticles,
    addKnowledgeArticle,
    logbook,
    addLogbookEntry,
    setLogbook,
    auditLogs,
    setAuditLogs,
    alertHistory,
    broadcastAlert,
    assistanceRecords,
    addAssistanceRecord,
    updateAssistanceRecordStatus,
    fieldVisitTasks,
    scheduleFieldVisit,
    updateFieldVisitTaskStatus,
    smsTrainingExamples,
    exportPortableBackup,
    importPortableBackup,
    importSmsTrainingExamples,
    importKnowledgeArticles,
    reviewSmsTrainingExample,
    reviewKnowledgeArticle,
    systemSettings,
    saveSystemSettings,
    users,
    addUser,
    updateUser,
    deleteUser,
    addPendingFarmer,
    vouchers,
    addVoucher,
    updateVoucherStatus,
    retryOutboundMessage,
    runDataRetentionSweep,
    offlineMode,
    offlineSyncing,
    offlineOutboxCount,
    liveDataReady,
    syncOfflineChanges,
    resetDemoData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
